import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
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
    @ViewChild('ingredientList') ingredientList: IonList;

    recipeUUID;
    recipeImageURI;
    recipeImageUploadPercentage: number;
    downloadURL: Observable<string>;
    recipeName: string;
    recipeDescription: string;
    ingredients: Ingredient[] = [];
    ingredientMap: Map<string, Ingredient[]>;
    recipeForm: FormGroup;
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
        this.platformTypeCordova = this.platform.is('cordova');
        this.recipeUUID = Guid.create().toString();

        console.log('onInit');
        // Get Route parameter
        this.route.params
            .subscribe(
                (params: Params) => {
                    this.mode = params['mode'];
                }
            );
        if (this.mode === 'new' || this.mode === 'edit') {
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
            this.ingredients.push(...data);
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
            this.ingredients[this.ingredients.indexOf(this.findIngredientUsingUUID(data.uuid)[0])] = data;
            this.initializeIngredients();
        }
        modal = null;
        this.ingredientList.closeSlidingItems().catch(e => 'Could not close open sliding items!');
    }

    getStyle(ingredientColor: string) {
        return '5px solid var(' + ingredientColor + ')';
    }

    getStyleClass(ingredient: Ingredient) {
        if (this.ingredientMap.get(ingredient.item.itemColor).indexOf(ingredient) === 0 && this.ingredientMap.get(ingredient.item.itemColor).length > 1) {
            return 'roundedCornersTop';
        } else if (this.ingredientMap.get(ingredient.item.itemColor).indexOf(ingredient) === 0 && this.ingredientMap.get(ingredient.item.itemColor).length === 1) {
            return 'roundedCornersSingle';
        } else if (this.ingredientMap.get(ingredient.item.itemColor).indexOf(ingredient) === this.ingredientMap.get(ingredient.item.itemColor).length - 1) {
            return 'roundedCornersBottom';
        } else {
            return 'roundedCornersMiddle';
        }
    }

    initializeIngredients() {
        if (this.ingredients != null) {
            this.ingredients.sort(compare);
            this.ingredientMap = groupByVanilla2(this.ingredients, ingredient => ingredient.item.itemColor);
        }
    }

    onRemoveItem(index: Ingredient) {
        this.ingredientList.closeSlidingItems().catch(e => 'Could not close open sliding items!');
        this.ingredients.splice(this.ingredients.indexOf(index), 1);
    }

    findIngredientUsingUUID(searchTerm) {
        return this.ingredients.filter((ingredient) => {
            return ingredient.uuid.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1;
        });
    }

    initializeForm() {
        if (this.mode === 'new') {
            this.recipeForm = new FormGroup({
                'recipeName': new FormControl(this.recipeName, Validators.required),
                'recipeDescription': new FormControl(this.recipeDescription)
            });
        }
    }

    onChangeImageUpload(event) {
        const files = event.srcElement.files;
        console.log(files);
        this.recipeImageURI = files[0];
        this.uploadFile(this.recipeUUID);
    }

    async uploadFile(recipeUUID: string) {

        const loadingDialog = await this.loadingCtrl.create({
            message: 'Uploading image...',
            translucent: false,
            cssClass: 'loadingDialog'
        });

        loadingDialog.present().catch(e => console.log('Could not present loading dialog'));

        const uploadTask = this.cloudStore.storeRecipeImage(this.recipeImageURI, recipeUUID);

        uploadTask.percentageChanges().subscribe(value => this.recipeImageUploadPercentage = value.valueOf() / 100);
        uploadTask.snapshotChanges().pipe(
            finalize
            (
                () => {
                    this.downloadURL = this.cloudStore.getReferenceToUploadedFile(recipeUUID).getDownloadURL();
                    this.downloadURL.subscribe((value) => {
                        // save download url as recipe img src
                        this.recipeImageURI = value;
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
        const recipe = new Recipe(
            this.recipeUUID,
            this.recipeForm.get('recipeName').value,
            this.recipeForm.get('recipeDescription').value,
            this.recipeImageURI,
            this.ingredients);

        this.recipeService.addItem(recipe);

        this.router.navigate(['/tabs/tab2'], {relativeTo: this.route});
    }

    getRecipeImageFromCamera() {

        this.platform.ready().then(() => {
            if (this.platformTypeCordova) {
                // make your native API calls
                const options: CameraOptions = {
                    quality: 100,
                    destinationType: this.camera.DestinationType.FILE_URI,
                    encodingType: this.camera.EncodingType.JPEG,
                    mediaType: this.camera.MediaType.PICTURE
                };

                this.camera.getPicture(options).then((imageData) => {
                    const currentName = imageData.replace(/^.*[\\\/]/, '');
                    const path = imageData.replace(/[^\/]*$/, '');
                    this.file.readAsArrayBuffer(path, currentName).then((res) => {
                        this.recipeImageURI = new Blob([res], {
                            type: 'image/jpeg'
                        });
                        this.uploadFile(this.recipeUUID);
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

    onCancel() {
        // camera clean up
        if (this.platformTypeCordova) {
            this.camera.cleanup().catch(e => console.log('Cordova not available, could not clean'));
        }

        if (this.downloadURL != null && this.mode === 'new') {
            // remove picture as this will not be persisted
            this.cloudStore.removeImage(this.recipeUUID);
        }
        this.router.navigate(['/tabs/tab2'], {relativeTo: this.route});

    }
    ngOnDestroy() {
        console.log('On destroy');
        this.recipeUUID = null;
        this.recipeImageURI = null;
        this.recipeImageUploadPercentage = null;
        this.recipeName = null;
        this.recipeDescription = null;
        this.ingredients = null;
    }
}
