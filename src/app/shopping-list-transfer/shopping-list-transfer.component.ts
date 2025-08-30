import {Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonListHeader, IonLabel, IonItemDivider, IonAvatar, IonImg, IonGrid, IonRow, IonCol, IonItem, IonBadge, IonToggle, IonItemSliding, IonItemOptions, IonItemOption, IonFooter, IonButton, IonIcon } from '@ionic/angular/standalone';
import {Router} from '@angular/router';
import {ModalController, NavParams} from '@ionic/angular';
import {AppState} from '../models/app-state';
import {Cart} from '../models/cart';
import {Ingredient} from '../models/ingredient';
import {Recipe} from '../models/recipe';
import {ShoppingListService} from '../services/shopping-list.service';
import {SimpleStateService} from '../services/simple-state-service';
import {compare, groupByVanilla2} from '../shopping-list/shopping-list.page';

@Component({
    selector: 'app-shopping-list-transfer',
    standalone: true,
    imports: [
        CommonModule,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonContent,
        IonList,
        IonListHeader,
        IonLabel,
        IonItemDivider,
        IonAvatar,
        IonImg,
        IonGrid,
        IonRow,
        IonCol,
        IonItem,
        IonBadge,
        IonToggle,
        IonItemSliding,
        IonItemOptions,
        IonItemOption,
        IonFooter,
        IonButton,
        IonIcon
    ],
    templateUrl: './shopping-list-transfer.component.html',
    styleUrls: ['./shopping-list-transfer.component.scss']
})
export class ShoppingListTransferComponent implements OnInit {

    cart: Cart;

    constructor(private navParams: NavParams,
                private modalController: ModalController,
                private stateService: SimpleStateService,
                private slService: ShoppingListService,
                private router: Router) {
    }

    ngOnInit() {
        console.log(this.navParams.data);
        this.cart = this.navParams.get('cart');
    }

    getStyle(ingredientColor: string) {
        return '5px solid var(' + ingredientColor + ')';
    }

    getStyleClass(recipe: Recipe, ingredientToClass: Ingredient) {
        if (recipe.ingredientMap == null || recipe.ingredientMap === undefined) {
            recipe.ingredients.sort(compare);
            recipe.ingredientMap = groupByVanilla2(recipe.ingredients, ingredient => ingredient.item.itemColor);
        }
        if (recipe.ingredientMap.get(ingredientToClass.item.itemColor).indexOf(ingredientToClass) === 0 && recipe.ingredientMap.get(ingredientToClass.item.itemColor).length > 1) {
            return 'roundedCornersTop';
        } else if (recipe.ingredientMap.get(ingredientToClass.item.itemColor).indexOf(ingredientToClass) === 0 && recipe.ingredientMap.get(ingredientToClass.item.itemColor).length === 1) {
            return 'roundedCornersSingle';
        } else if (recipe.ingredientMap.get(ingredientToClass.item.itemColor).indexOf(ingredientToClass) === recipe.ingredientMap.get(ingredientToClass.item.itemColor).length - 1) {
            return 'roundedCornersBottom';
        } else {
            return 'roundedCornersMiddle';
        }
    }

    isItemCollected(recipe: Recipe, ingredient: Ingredient) {
        console.log(ingredient.isCollectedAsDefault);
        this.cart.recipes[this.cart.recipes.indexOf(recipe)].ingredients[recipe.ingredients.indexOf(ingredient)].isCollectedAsDefault = !ingredient.isCollectedAsDefault;
    }

    addToShoppingList() {
        this.stateService.getAppState().then((appState: AppState) => {
            const shoppingList = this.slService.findUsingUUID(appState.lastVisited_ShoppingList);
            if (shoppingList.items == null) {
                shoppingList.items = [];
            }
            for (let i = 0; i < this.cart.recipes.length; i++) {
                let recipe = this.cart.recipes[i];
                console.log(recipe);
                shoppingList.items.push(...recipe.ingredients.filter(recipeItem => recipeItem.isCollectedAsDefault === true));
            }

            this.slService.updateShoppingList(shoppingList);
            this.modalController.dismiss('itemsMovedToShoppingList').catch(e => console.log('Could not pop-over modal'));
            this.router.navigate(['/tabs/tab1', appState.lastVisited_ShoppingList]).catch(e => console.log('Could not navigate to tabs!'));


        }).catch(e => console.log('Could not get app' +
            ' state'));
    }

    onDismiss(event: Event) {
    	console.log(event);
        if (event.type === 'ion-content') {
            this.modalController.dismiss('Cancelled').catch(e => console.log('Could not pop-over modal'));
        }
    }
}
