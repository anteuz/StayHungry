import {Component, OnInit, ViewChild} from '@angular/core';
import {IonList, ModalController} from '@ionic/angular';
import {IngredientOverlayPage} from '../ingredient-overlay/ingredient-overlay.page';
import {Ingredient} from '../models/ingredient';
import {compare, groupByVanilla2} from '../shopping-list/shopping-list.page';

@Component({
    selector: 'app-recipe',
    templateUrl: './recipe.page.html',
    styleUrls: ['./recipe.page.scss'],
})
export class RecipePage implements OnInit {

    ingredients: Ingredient[] = [];
    ingredientMap: Map<string, Ingredient[]>;
    @ViewChild('ingredientList') ingredientList: IonList;

    constructor(
        private modalCtrl: ModalController
    ) {
    }

    ngOnInit() {
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
}
