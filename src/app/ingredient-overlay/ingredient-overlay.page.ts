import {Component, OnInit, ViewChild} from '@angular/core';
import {IonSearchbar, ModalController, NavParams} from '@ionic/angular';
import {Guid} from 'guid-typescript';
import {Ingredient} from '../models/ingredient';
import {SimpleItem} from '../models/simple-item';
import {ShoppingListService} from '../services/shopping-list.service';
import {SimpleItemService} from '../services/simple-item.service';


@Component({
    selector: 'app-ingredient-overlay',
    templateUrl: './ingredient-overlay.page.html',
    styleUrls: ['./ingredient-overlay.page.scss'],
})
export class IngredientOverlayPage implements OnInit {

    @ViewChild('ingredientBar') ingredientBar: IonSearchbar;
    itemColorName = '';
    showItemColorSelector = false;
    itemSuggestions: SimpleItem[] = [];
    ingredients: Ingredient[];

    mode;
    ingredientToEdit: Ingredient;

    constructor(
        private itemService: SimpleItemService,
        public slService: ShoppingListService,
        private modalCtrl: ModalController,
        private navParams: NavParams
    ) {
        this.mode = this.navParams.get('mode');

        if (this.mode === 'edit') {
            this.ingredientToEdit = this.navParams.get('ingredient');
        }
    }

    ngOnInit() {
        if (this.mode === 'edit') {
            this.ingredientBar.value = this.ingredientToEdit.item.itemName + ' : ' + this.ingredientToEdit.amount;
            this.itemColorName = this.ingredientToEdit.item.itemColor;
            this.showColorSelector();
        }
        this.ingredientBar.setFocus();
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

    onIngredientNameChanged() {

        // Trigger search here
        if (this.ingredientBar.value != null) {
            this.showColorSelector();
            // empty previous suggestions
            this.itemSuggestions = [];
            // Handle suggestions
            this.itemSuggestions.push(...this.itemService.filterItems(this.ingredientBar.value, false).splice(0, 10));
            // Check if we need color chooser
            this.showColorSelector();
        }
        // Check if we need to store complete ingredient
        if (this.ingredientBar.value != null) {
            if (this.ingredientBar.value.includes(',')
                && (this.ingredientBar.value.endsWith(',') || this.ingredientBar.value.endsWith(', '))) {
                this.storeIngredients(false);
            }
        }
    }

    onAddFromSearchbar() {
        // check if we have un saved changes
        if (this.ingredientBar.value != null) {
            this.storeIngredients(true);
        }
        // remove all ingredients no longer present in the search bar string
        // if (this.mode === 'insert') {
        //    this.slService.addItems(this.ingredients);
        // }
        this.ingredientBar.value = null;
        this.showItemColorSelector = false;

        console.log(this.ingredients);

        if (this.mode === 'insert') {
            this.modalCtrl.dismiss(this.ingredients).catch(e => console.log('Could not close modal'));
        } else {
            this.modalCtrl.dismiss(this.ingredients[0]).catch(e => console.log('Could not close modal'));
        }
    }

    chooseColor(colorName: string) {
        if (this.itemColorName === colorName) {
            this.itemColorName = null;
        } else {
            this.itemColorName = colorName;
        }
        // patch color of latest ingredient if color is switched
        if (this.ingredients != null) {
            this.ingredients[this.ingredients.length - 1].item.itemColor = colorName;
            this.itemService.updateItem(this.ingredients[this.ingredients.length - 1].item);
        }
        console.log(colorName);
        this.ingredientBar.setFocus();
    }

    pickSuggestion(item: SimpleItem) {
        this.itemSuggestions = [];
        this.ingredientBar.value = item.itemName + ' : ';
        this.itemColorName = item.itemColor;
        this.ingredientBar.setFocus();
        // Check if we need color selector
        this.showColorSelector();
    }

    getButtonColor(ingredientColor: string) {
        return ingredientColor.substring(ingredientColor.lastIndexOf('-') + 1);
    }

    showColorSelector() {
        if (this.ingredientBar.value != null && this.itemSuggestions.length === 0) {
            this.showItemColorSelector = true;
        } else {
            this.showItemColorSelector = false;
        }
    }

    onDismiss(event: Event) {
        if (event.srcElement.localName === 'ion-content') {
            this.modalCtrl.dismiss().catch(e => console.log('Could not close modal'));
        }
    }

    duplicateIngredients(ingredientName) {
        if (this.ingredients == null) {
            return null;
        }
        return this.ingredients.filter((item) => {
            return item.item.itemName.toLowerCase() === ingredientName.toLowerCase();
        });
    }

    private storeIngredients(finalStore: boolean) {
        // Pick value from ingredient bar to constant
        const currentIngredientString = this.ingredientBar.value;

        // if there is colon in the string we assume it has multiple ingredients
        if (currentIngredientString.includes(',') && this.mode === 'insert') {

            // Put ingredients into an string array
            const ingredients: string[] = currentIngredientString.split(',');

            // Iterate through the array
            for (let i = 0; i < ingredients.length; i++) {
                // Process if there's an actual item
                if (ingredients[i].trim().length > 1) {

                    // Parse ingredient from string
                    const ingredient: Ingredient = this.parseIngredientFromString(ingredients[i], this.itemColorName);

                    // Check if we already have such ingredient stored from this session
                    const duplicateIngredients = this.duplicateIngredients(ingredient.item.itemName);
                    if (duplicateIngredients == null || duplicateIngredients.length === 0) {
                        if (this.ingredients == null) {
                            this.ingredients = [];
                        }

                        this.ingredients.push(ingredient);
                    } else {
                        // If we do have similarly named ingredient, check if the amount is also similar
                        if (duplicateIngredients[0].amount !== ingredient.amount) {
                            // if not, patch amount
                            this.ingredients[this.ingredients.indexOf(duplicateIngredients[0])].amount = ingredient.amount;
                        }
                    }
                }
            }
        } else {
            // Same same but different, when there is only a single ingredient
            const ingredient: Ingredient = this.parseIngredientFromString(currentIngredientString, this.itemColorName);
            const duplicateIngredients = this.duplicateIngredients(ingredient.item.itemName);
            if (duplicateIngredients == null || duplicateIngredients.length === 0) {
                if (this.ingredients == null) {
                    this.ingredients = [];
                }
                this.ingredients.push(ingredient);
            } else {
                if (duplicateIngredients[0].amount !== ingredient.amount) {
                    // patch amount
                    this.ingredients[this.ingredients.indexOf(duplicateIngredients[0])].amount = ingredient.amount;
                }
            }
        }
    }

    private parseIngredientFromString(ingredientString: string, ingredientColor: string): Ingredient {
        let ingredientName;
        let ingredientAmount = '0';

        // Check if we also have amount data available
        if (ingredientString.includes(':')) {
            const ingredientPart: string[] = ingredientString.split(':');
            ingredientName = ingredientPart[0].trim();
            ingredientAmount = ingredientPart[1].trim();
        } else {
            ingredientName = ingredientString.trim();
        }
        console.log(ingredientName);
        // Check if we have already stored this kind of an ingredient into a DB
        let simpleItem: SimpleItem = this.checkIfItemExists(ingredientName);
        console.log(simpleItem);
        // If we are in edit mode and item color is not what we wanted
        if (this.mode === 'edit' && simpleItem.itemColor !== ingredientColor) {
            simpleItem.itemColor = ingredientColor;
            this.itemService.updateItem(simpleItem);
        }
        // Check if we found already existing item, if not, create new and store for future re-use
        if (simpleItem == null) {
            simpleItem = new SimpleItem(Guid.create().toString(), ingredientName, ingredientColor);
            this.itemService.addItem(simpleItem);
        }
        console.log(simpleItem);
        console.log(ingredientColor);
        // Create full ingredient
        if (this.mode === 'insert') {
            return new Ingredient(Guid.create().toString(), simpleItem, ingredientAmount);
        } else if (this.mode === 'edit') {
            return new Ingredient(this.ingredientToEdit.uuid, simpleItem, ingredientAmount);
        }
    }

    private checkIfItemExists(ingredientName: string): SimpleItem {
        const items: SimpleItem[] = this.itemService.filterItems(ingredientName, true);

        if (items != null) {
            if (items.length === 1) {
                return items[0]; // Should present just one
            } else {
                return null; // Result is ambiquous and we can persist new item with this name
            }
        } else {
            return null; // Was not found
        }
    }
}
