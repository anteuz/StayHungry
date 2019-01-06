import {forEach} from '@angular-devkit/schematics';
import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AlertController, IonList, IonSearchbar, LoadingController, PopoverController} from '@ionic/angular';
import {Subscription} from 'rxjs';
import {AuthService} from '../auth.service';
import {Ingredient} from '../models/ingredient';
import {SimpleItem} from '../models/simple-item';
import {ShoppingListService} from '../shopping-list.service';
import {Guid} from 'guid-typescript';
import {SimpleItemService} from '../simple-item.service';

@Component({
    selector: 'app-shopping-list',
    templateUrl: './shopping-list.page.html',
    styleUrls: ['./shopping-list.page.scss'],
})
export class ShoppingListPage implements OnInit, OnDestroy {

    ingredients: Ingredient[] = [];
    @ViewChild('ingredientBar') ingredientBar: IonSearchbar;
    @ViewChild('ingredientList') ingredientList: IonList;
    newUnInitializedIngredient: string;
    itemColorName = '';
    newItem: SimpleItem[];
    showItemColorSelector = false;
    itemSuggestions: SimpleItem[] = [];


    private subscriptions: Subscription = new Subscription();

    constructor(
        public slService: ShoppingListService,
        private popoverCtrl: PopoverController,
        private authService: AuthService,
        private loadingCtrl: LoadingController,
        private alertCtrl: AlertController,
        private itemService: SimpleItemService
    ) {

        console.log('Created constructor');
    }

    ngOnInit() {
        this.subscriptions.add(this.slService.newIngredientEvent.subscribe(
            ingredients => this.ingredients = ingredients
        ));
    }

    onRemoveItem(index: Ingredient) {
        this.ingredientList.closeSlidingItems();
        this.slService.removeItem(index);
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
        console.log(this.subscriptions);
    }

    getStyle(ingredientColor: string) {
        return '5px solid var(' + ingredientColor + ')';
    }
    getButtonColor(ingredientColor: string) {
        console.log('Color: ' + ingredientColor.substring(ingredientColor.lastIndexOf('-') + 1));
        return ingredientColor.substring(ingredientColor.lastIndexOf('-') + 1);
    }

    onCollect(ingredient: Ingredient) {
       ingredient.isCollected = true;
       ingredient.isBeingCollected = false;
       this.slService.updateItemStatuses(this.ingredients);

    }
    onDeCollect(ingredient: Ingredient) {
        ingredient.isCollected = false;
        this.slService.updateItemStatuses(this.ingredients);
    }

    beingCollected(ingredient: Ingredient) {
        console.log('is this being collected?');
        if (ingredient.isBeingCollected) {
            return 'collected';
        } else {
            return '';
        }
    }

    onStartCollect(ingredient: Ingredient) {
        console.log('Start collect');
        ingredient.isBeingCollected = true;
    }
    cancelCollect(ingredient: Ingredient) {
        console.log('Cancel collect');
        ingredient.isBeingCollected = false;
    }

    onIngredientBarFocus() {
        if (this.ingredientBar.value === '') {
            this.ingredientBar.placeholder = 'Item : amount';
        }
    }

    onIngredientBarBlur() {
        if (this.ingredientBar.value === '') {
            this.ingredientBar.placeholder = '+ New item';
            this.showItemColorSelector = false;
        }
    }
    onIngredientNameChanged(ev: Event) {
        console.log('Ingredient name changed ' + this.ingredientBar.value);
        // Trigger search here
        if (this.ingredientBar.value != null) {
            this.showItemColorSelector = true;
            // empty previous suggestions
            this.itemSuggestions = [];
            // Handle suggestions
            this.itemSuggestions.push(... this.itemService.filterItems(this.ingredientBar.value).splice(0, 10));
        }
    }
    onAddItemFromSearchbar() {
        this.newUnInitializedIngredient =  this.ingredientBar.value;
        console.log('Got value: ' + this.newUnInitializedIngredient);
        let ingredientName;
        let ingredientAmount = '0';

        if (this.newUnInitializedIngredient.includes(':')) {
            const ingredientPart: string[] = this.newUnInitializedIngredient.split(':');
            ingredientName = ingredientPart[0].trim();
            ingredientAmount = ingredientPart[1].trim();
        } else {
            ingredientName = this.newUnInitializedIngredient.trim();
        }

        console.log('Ingredient name: ' + ingredientName + ' ingredient amount: ' + ingredientAmount);

        const simpleItem = new SimpleItem(Guid.create().toString(), ingredientName, this.itemColorName);
        const ingredient = new Ingredient(Guid.create().toString(), simpleItem, ingredientAmount);

        console.log('Saving ingredient:');
        console.log(ingredient);
        // and save
        this.itemService.addItem(simpleItem);
        this.slService.addItem(ingredient);

        this.ingredientBar.value = null;
        this.showItemColorSelector = false;

    }
    chooseColor(colorName: string) {
        if (this.itemColorName === colorName) {
            this.itemColorName = null;
        } else {
            this.itemColorName = colorName;
        }
        this.ingredientBar.setFocus();
    }

    pickSuggestion(item: SimpleItem) {
        if(this.newItem == null) {
            this.newItem = [];
        }
        this.newItem.push(item);
        this.itemSuggestions = [];
        this.ingredientBar.value = item.itemName + ' : ';
        this.itemColorName = item.itemColor;
        this.ingredientBar.setFocus();
    }
}
