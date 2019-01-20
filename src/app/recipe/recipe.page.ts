import {Component, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Params, Router} from '@angular/router';
import * as BrowserCamera from '@ionic-native/camera';
import {Camera, CameraOptions} from '@ionic-native/camera/ngx';
import {File} from '@ionic-native/file/ngx';
import {IonList, ModalController, Platform} from '@ionic/angular';
import {Guid} from 'guid-typescript';
import {Observable} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {IngredientOverlayPage} from '../ingredient-overlay/ingredient-overlay.page';
import {Ingredient} from '../models/ingredient';
import {Recipe} from '../models/recipe';
import {CloudStoreService} from '../services/cloud-store.service';
import {compare, groupByVanilla2} from '../shopping-list/shopping-list.page';

@Component({
    selector: 'app-recipe',
    templateUrl: './recipe.page.html',
    styleUrls: ['./recipe.page.scss'],
})
export class RecipePage implements OnInit {

    mode;
    @ViewChild('ingredientList') ingredientList: IonList;

    recipeImageURI;
    recipeImageUploadPercentage: number;
    downloadURL: Observable<string>;
    recipeName: string;
    recipeDescription: string;
    ingredients: Ingredient[] = [];
    ingredientMap: Map<string, Ingredient[]>;
    recipeForm: FormGroup;

    constructor(
        private platform: Platform,
        private modalCtrl: ModalController,
        private route: ActivatedRoute,
        private router: Router,
        private camera: Camera,
        private cloudStore: CloudStoreService,
        private file: File
    ) {
    }

    async ngOnInit() {
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
        modal.present();

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
        modal.present();

        const {data} = await modal.onDidDismiss();
        // if data is provided, if action is cancelled data is undefined (backdrop tapped)
        if (data !== undefined) {
            this.ingredients[this.ingredients.indexOf(this.findIngredientUsingUUID(data.uuid)[0])] = data;
            this.initializeIngredients();
        }
        modal = null;
        this.ingredientList.closeSlidingItems();
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
        this.ingredientList.closeSlidingItems();
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
    }

    uploadFile(recipe: Recipe) {
        console.log('create upload task...');
        const uploadTask = this.cloudStore.storeRecipeImage(this.recipeImageURI, recipe.uuid);
        uploadTask.percentageChanges().subscribe(value => this.recipeImageUploadPercentage = value.valueOf() / 100);
        uploadTask.snapshotChanges().pipe(
            finalize
            (
                () => {
                    this.downloadURL = this.cloudStore.getReferenceToUploadedFile(recipe.uuid).getDownloadURL();
                    this.downloadURL.subscribe((value) => {
                        recipe.imageURI = value;
                        console.log(recipe.imageURI);
                        // persist

                        // navigate away
                    });
                }
            )).subscribe();
    }

    onSubmit() {
        console.log(this.recipeForm);
        const recipe = new Recipe(Guid.create().toString(), this.recipeForm.get('recipeName').value, this.recipeForm.get('recipeDescription').value, this.recipeImageURI, this.ingredients);
        if (this.recipeImageURI) {
            this.uploadFile(recipe);
        }
        console.log('Image uploaded');
        console.log(recipe);
        if (this.recipeForm.valid) {
            console.log(recipe);
        }
    }

    getRecipeImageFromCamera() {

        this.platform.ready().then(() => {
            if (this.platform.is('cordova')) {
                // make your native API calls
                const options: CameraOptions = {
                    quality: 80,
                    destinationType: this.camera.DestinationType.FILE_URI,
                    encodingType: this.camera.EncodingType.JPEG,
                    mediaType: this.camera.MediaType.PICTURE
                };

                this.camera.getPicture(options).then((imageData) => {
                    // imageData is either a base64 encoded string or a file URI
                    this.makeFileIntoBlob(imageData).then(value => this.recipeImageURI = value);
                }, (err) => {
                    console.log(err);
                });

            } else {
                // fallback to browser APIs
                BrowserCamera.Camera.getPicture()
                    .then(data => console.log('Took a picture!', data))
                    .catch(e => console.log('Error occurred while taking a picture', e));
            }
        });
    }

    // FILE STUFF
    makeFileIntoBlob(_imagePath) {
        // INSTALL PLUGIN - cordova plugin add cordova-plugin-file
        return new Promise((resolve, reject) => {
            let fileName = '';
            this.file
                .resolveLocalFilesystemUrl(_imagePath)
                .then(fileEntry => {
                    let {name, nativeURL} = fileEntry;

                    // get the path..
                    let path = nativeURL.substring(0, nativeURL.lastIndexOf('/'));
                    console.log('path', path);
                    console.log('fileName', name);

                    fileName = name;

                    // we are provided the name, so now read the file into
                    // a buffer
                    return this.file.readAsArrayBuffer(path, name);
                })
                .then(buffer => {
                    // get the buffer and make a blob to be saved
                    let imgBlob = new Blob([buffer], {
                        type: 'image/jpeg'
                    });
                    console.log(imgBlob.type, imgBlob.size);
                    resolve({
                        fileName,
                        imgBlob
                    });
                })
                .catch(e => reject(e));
        });
    }
}
