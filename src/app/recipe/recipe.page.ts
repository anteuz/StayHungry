import {Component, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {Camera, CameraOptions} from '@ionic-native/camera/ngx';
import * as BrowserCamera from '@ionic-native/camera';
import {IonList, ModalController} from '@ionic/angular';
import {Guid} from 'guid-typescript';
import {IngredientOverlayPage} from '../ingredient-overlay/ingredient-overlay.page';
import {Ingredient} from '../models/ingredient';
import {Recipe} from '../models/recipe';
import {compare, groupByVanilla2} from '../shopping-list/shopping-list.page';
import {Platform} from '@ionic/angular';

@Component({
    selector: 'app-recipe',
    templateUrl: './recipe.page.html',
    styleUrls: ['./recipe.page.scss'],
})
export class RecipePage implements OnInit {

    mode;
    @ViewChild('ingredientList') ingredientList: IonList;

    recipeImageURI: string;
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
        private camera: Camera
    ) {}

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
                'recipeDescription': new FormControl(this.recipeDescription),
                'recipeImageURI': new FormControl(this.recipeImageURI)
            });
        }
    }
    onSubmit() {
        console.log(this.recipeForm);
        if (this.recipeForm.valid) {
            const recipe = new Recipe(Guid.create().toString(), this.recipeForm.get('recipeName').value, this.recipeForm.get('recipeDescription').value,  this.recipeForm.get('recipeImageURI').value, this.ingredients);
            console.log(recipe);
        }
    }

    getRecipeImageFromCamera() {

        this.platform.ready().then(() => {
            if (this.platform.is('cordova')) {
                // make your native API calls
                const options: CameraOptions = {
                    quality: 100,
                    destinationType: this.camera.DestinationType.FILE_URI,
                    encodingType: this.camera.EncodingType.JPEG,
                    mediaType: this.camera.MediaType.PICTURE
                }

                this.camera.getPicture(options).then((imageData) => {
                    // imageData is either a base64 encoded string or a file URI
                    console.log(imageData);
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
}
