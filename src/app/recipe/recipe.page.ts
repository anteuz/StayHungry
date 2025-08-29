import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Params, Router} from '@angular/router';
import * as BrowserCamera from '@ionic-native/camera';
import {Camera, CameraOptions} from '@ionic-native/camera/ngx';
import {File} from '@ionic-native/file/ngx';
import {IonList, LoadingController, ModalController, Platform} from '@ionic/angular';
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
        private camera: Camera,
        private cloudStore: CloudStoreService,
        private file: File,
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

        const uploadTask = this.cloudStore.storeRecipeImage(this.recipe.imageURI, this.recipe.uuid);

        uploadTask.percentageChanges().subscribe(value => this.recipeImageUploadPercentage = value.valueOf() / 100);
        uploadTask.snapshotChanges().pipe(
            finalize
            (
                () => {
                    this.downloadURL = this.cloudStore.getReferenceToUploadedFile(this.recipe.uuid).getDownloadURL();
                    this.downloadURL.subscribe((value) => {
                        // save download url as recipe img src
                        this.recipe.imageURI = value;
                        // persist
                        console.log(value);
                        // navigate away
                        loadingDialog.dismiss().catch(e => console.log('Could not dismiss dialog'));
                        if (this.platformTypeCordova) {
                            this.camera.cleanup();
                        }
                    });
                }
            )).subscribe();

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

    getRecipeImageFromCamera() {

        this.platform.ready().then(() => {
            if (this.platformTypeCordova) {
                // make your native API calls
                const options: CameraOptions = {
                    quality: 70,
                    destinationType: this.camera.DestinationType.FILE_URI,
                    encodingType: this.camera.EncodingType.JPEG,
                    mediaType: this.camera.MediaType.PICTURE
                };

                this.camera.getPicture(options).then((imageData) => {
                    const currentName = imageData.replace(/^.*[\\\/]/, '');
                    const path = imageData.replace(/[^\/]*$/, '');
                    this.file.readAsArrayBuffer(path, currentName).then((res) => {
                        this.recipe.imageURI = new Blob([res], {
                            type: 'image/jpeg'
                        });
                        this.uploadFile();
                    }).catch(e => console.log(e));
                }, (err) => {
                    console.log(err);
                });

            } else {
                // fallback to browser APIs, actually not implemented
                BrowserCamera.Camera.getPicture()
                    .then(data => console.log('Took a picture!', data))
                    .catch(e => console.log('Error occurred while taking a picture', e));
            }
        }).catch(e => console.log('Could not enable camera!' + e));
    }
    onEditRecipe() {
        this.router.navigate(['/tabs/tab2/recipe', 'edit', this.recipe.uuid], {relativeTo: this.route});
    }

    onCancel() {
        // camera clean up
        if (this.platformTypeCordova) {
            this.camera.cleanup().catch(e => console.log('Cordova not available, could not clean'));
        }

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
