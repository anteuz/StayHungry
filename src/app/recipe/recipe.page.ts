import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonImg, IonItem, IonIcon, IonLabel, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonSegment, IonSegmentButton, IonGrid, IonList, IonRow, IonListHeader, IonCol, IonItemSliding, IonItemOptions, IonItemOption, IonBadge, IonToggle, IonButton } from '@ionic/angular/standalone';
import {UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {Camera, CameraResultType, CameraSource} from '@capacitor/camera';
import {Filesystem} from '@capacitor/filesystem';
import {LoadingController, ModalController, Platform} from '@ionic/angular';
import {Guid} from 'guid-typescript';
import {Observable} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {IngredientOverlayPage} from '../ingredient-overlay/ingredient-overlay.page';
import {Ingredient} from '../models/ingredient';
import {Recipe} from '../models/recipe';
import {CloudStoreService} from '../services/cloud-store.service';
import {RecipeServiceService} from '../services/recipe-service.service';
import {compare, groupByVanilla2} from '../shopping-list/shopping-list.page';

@Component({
    selector: 'app-recipe',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonContent,
        IonCard,
        IonImg,
        IonItem,
        IonIcon,
        IonLabel,
        IonCardHeader,
        IonCardTitle,
        IonCardSubtitle,
        IonCardContent,
        IonSegment,
        IonSegmentButton,
        IonGrid,
        IonList,
        IonRow,
        IonListHeader,
        IonCol,
        IonItemSliding,
        IonItemOptions,
        IonItemOption,
        IonBadge,
        IonToggle,
        IonButton
    ],
    templateUrl: './recipe.page.html',
    styleUrls: ['./recipe.page.scss'],
})
export class RecipePage implements OnInit, OnDestroy {

    mode;
    @ViewChild('ingredientList', {static: false}) ingredientList: IonList;
    recipe: Recipe;
    recipeUUID;
    recipeImageUploadPercentage: number;
    downloadURL: Observable<string>;
    recipeForm: UntypedFormGroup;
    platformTypeCordova: boolean;

    constructor(
        private platform: Platform,
        private modalCtrl: ModalController,
        private route: ActivatedRoute,
        private router: Router,

        private cloudStore: CloudStoreService,

        private loadingCtrl: LoadingController,
        private recipeService: RecipeServiceService
    ) {
    }

    async ngOnInit() {
        this.platformTypeCordova = this.platform.is('desktop');

        console.log('onInit');
        // Get Route parameter
        this.route.params
            .subscribe(
                (params: Params) => {
                    this.mode = params['mode'];
                    this.recipeUUID = params['id'];
                }
            );

        console.log(this.mode);
        if (this.mode === 'new') {
           this.recipe = new Recipe(Guid.create().toString(), null, null, null, [], null);
            this.initializeForm();
        }
        if (this.mode === 'view' || this.mode === 'edit') {
            this.recipe = this.recipeService.findUsingUUID(this.recipeUUID);
            if ((this.recipe.ingredientMap == null || this.recipe.ingredientMap === undefined) && this.recipe.ingredients !== undefined) {
                this.recipe.ingredients.sort(compare);
                this.recipe.ingredientMap = groupByVanilla2(this.recipe.ingredients, ingredient => ingredient.item.itemColor);
            }
            this.initializeForm();
        }
    }

    // Open ingredient overlay and add ingredients
    async addItems() {
        let modal = await this.modalCtrl.create({
            component: IngredientOverlayPage,
            animated: false,
            showBackdrop: true,
            cssClass: 'noBackground',
            backdropDismiss: true,
            componentProps:
                {
                    'mode': 'insert'
                }
        });
        modal.present().catch(e => console.log('Could not show modal!'));

        const {data} = await modal.onDidDismiss(); // Maybe later?
        if (data !== undefined) {
            if (this.recipe.ingredients === null || this.recipe.ingredients === undefined) {
                this.recipe.ingredients = [];
            }
            this.recipe.ingredients.push(...data);
            this.initializeIngredients();
        }
        modal = null;
    }

    async onEdit(ingredient: Ingredient) {
        let modal = await this.modalCtrl.create({
            component: IngredientOverlayPage,
            animated: false,
            showBackdrop: true,
            cssClass: 'noBackground',
            backdropDismiss: true,
            componentProps:
                {
                    'mode': 'edit',
                    'ingredient': ingredient
                }
        });
        modal.present().catch(e => console.log('Could not show modal!'));

        const {data} = await modal.onDidDismiss();
        // if data is provided, if action is cancelled data is undefined (backdrop tapped)
        if (data !== undefined) {
            this.recipe.ingredients[this.recipe.ingredients.indexOf(this.findIngredientUsingUUID(data.uuid)[0])] = data;
            this.initializeIngredients();
        }
        modal = null;
        this.ingredientList.closeSlidingItems().catch(e => 'Could not close open sliding items!');
    }

    onDeleteRecipe() {
        this.cloudStore.removeImage(this.recipe.uuid);
        this.recipeService.removeRecipe(this.recipe);
        this.router.navigate(['/tabs/tab2'], {relativeTo: this.route});
    }

    getStyle(ingredientColor: string) {
        return '5px solid var(' + ingredientColor + ')';
    }

    getStyleClass(ingredient: Ingredient) {
        if (this.recipe.ingredientMap.get(ingredient.item.itemColor).indexOf(ingredient) === 0 && this.recipe.ingredientMap.get(ingredient.item.itemColor).length > 1) {
            return 'roundedCornersTop';
        } else if (this.recipe.ingredientMap.get(ingredient.item.itemColor).indexOf(ingredient) === 0 && this.recipe.ingredientMap.get(ingredient.item.itemColor).length === 1) {
            return 'roundedCornersSingle';
        } else if (this.recipe.ingredientMap.get(ingredient.item.itemColor).indexOf(ingredient) === this.recipe.ingredientMap.get(ingredient.item.itemColor).length - 1) {
            return 'roundedCornersBottom';
        } else {
            return 'roundedCornersMiddle';
        }
    }

    initializeIngredients() {
        if (this.recipe.ingredients != null || this.recipe.ingredients != undefined) {
            this.recipe.ingredients.sort(compare);
            this.recipe.ingredientMap = groupByVanilla2(this.recipe.ingredients, ingredient => ingredient.item.itemColor);
        }
    }

    onRemoveItem(index: Ingredient) {
        this.ingredientList.closeSlidingItems().catch(e => 'Could not close open sliding items!');
        this.recipe.ingredients.splice(this.recipe.ingredients.indexOf(index), 1);
    }

    findIngredientUsingUUID(searchTerm) {
        return this.recipe.ingredients.filter((ingredient) => {
            return ingredient.uuid.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1;
        });
    }

    initializeForm() {

        this.recipeForm = new UntypedFormGroup({
            'recipeName': new UntypedFormControl(this.recipe.name, Validators.required),
            'recipeDescription': new UntypedFormControl(this.recipe.description || null)
        });
    }

    onChangeImageUpload(event) {
        const files = event.srcElement.files;
        console.log(files);
        this.recipe.imageURI = files[0];
        this.uploadFile();
    }

    private async uploadFile() {
        const loadingDialog = await this.loadingCtrl.create({
            message: 'Uploading image...',
            translucent: false,
            cssClass: 'loadingDialog'
        });

        loadingDialog.present().catch(e => console.log('Could not present loading dialog'));

        try {
            // Upload the image
            const uploadResult = await this.cloudStore.storeRecipeImage(this.recipe.imageURI, this.recipe.uuid);
            console.log('Upload completed:', uploadResult);
            
            // Get download URL
            const downloadURL = await this.cloudStore.getReferenceToUploadedFile(this.recipe.uuid);
            
            // Save download url as recipe img src
            this.recipe.imageURI = downloadURL;
            console.log('Download URL:', downloadURL);
            
            loadingDialog.dismiss().catch(e => console.log('Could not dismiss dialog'));
        } catch (error) {
            console.error('Upload failed:', error);
            loadingDialog.dismiss().catch(e => console.log('Could not dismiss dialog'));
        }
    }

    onSubmit() {
        this.recipe.name =  this.recipeForm.get('recipeName').value;
        this.recipe.description = this.recipeForm.get('recipeDescription').value;
        if (this.mode === 'new') {
            this.recipeService.addItem(this.recipe);
            this.router.navigate(['/tabs/tab2'], {relativeTo: this.route});
        }
        if (this.mode === 'edit') {
            this.recipeService.updateRecipe(this.recipe);
            this.router.navigate(['/tabs/tab2/recipe', 'view', this.recipe.uuid], {relativeTo: this.route});
        }
    }

    async getRecipeImageFromCamera() {
        try {
            const image = await Camera.getPhoto({
                quality: 70,
                allowEditing: false,
                resultType: CameraResultType.DataUrl,
                source: CameraSource.Camera
            });

            if (image.dataUrl) {
                // Convert data URL to Blob
                const response = await fetch(image.dataUrl);
                const blob = await response.blob();
                this.recipe.imageURI = blob;
                this.uploadFile();
            }
        } catch (error) {
            console.log('Error taking picture:', error);
        }
    }
    onEditRecipe() {
        this.router.navigate(['/tabs/tab2/recipe', 'edit', this.recipe.uuid], {relativeTo: this.route});
    }

    onCancel() {
        // Camera cleanup not needed with Capacitor Camera

        if (this.downloadURL != null && this.mode === 'new') {
            // remove picture as this will not be persisted
            this.cloudStore.removeImage(this.recipe.uuid);
        }
        if (this.mode === 'new') {
            this.router.navigate(['/tabs/tab2'], {relativeTo: this.route});
        } else {
            this.router.navigate(['/tabs/tab2/recipe', 'view', this.recipe.uuid], {relativeTo: this.route});
        }
    }

    ngOnDestroy() {
        console.log('On destroy');
        this.recipe = null;
        this.mode = null;
        this.downloadURL = null;
        this.recipeForm = null;
    }

    onToggleIngredientCollectionDefault(ingredient: Ingredient) {
        console.log(ingredient.isCollectedAsDefault);
        this.recipe.ingredients[this.recipe.ingredients.indexOf(ingredient)].isCollectedAsDefault = !ingredient.isCollectedAsDefault;
    }

    segmentChanged(event: any) {
        this.recipe.category = event.detail.value;
    }
}
