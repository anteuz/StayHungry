import {Component, HostListener, OnInit, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonItem, IonSearchbar, IonContent, IonText, IonGrid, IonRow, IonCol, IonButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { ModalController, NavParams } from '@ionic/angular';
import {Guid} from 'guid-typescript';
import {Ingredient} from '../models/ingredient';
import {SimpleItem} from '../models/simple-item';
import {ShoppingListService} from '../services/shopping-list.service';
import {SimpleItemService} from '../services/simple-item.service';
import {ThemeService} from '../services/theme.service';


@Component({
    selector: 'app-ingredient-overlay',
    standalone: true,
    imports: [
        CommonModule,
        IonItem,
        IonSearchbar,
        IonContent,
        IonText,
        IonGrid,
        IonRow,
        IonCol,
        IonButton,
        IonIcon,
        IonLabel
    ],
    templateUrl: './ingredient-overlay.page.html',
    styleUrls: ['./ingredient-overlay.page.scss'],
})
export class IngredientOverlayPage implements OnInit {

    @ViewChild('ingredientBar', {static: false}) ingredientBar: IonSearchbar;
    itemColorName = '';
    selectedCategory = 'other';
    showItemColorSelector = false;
    itemSuggestions: SimpleItem[] = [];
    ingredients: Ingredient[];
    availableCategories: any[] = [];

    mode;
    ingredientToEdit: Ingredient;

    constructor(
        private itemService: SimpleItemService,
        public slService: ShoppingListService,
        private modalCtrl: ModalController,
        private navParams: NavParams,
        private themeService: ThemeService
    ) {
        this.mode = this.navParams.get('mode');

        if (this.mode === 'edit') {
            this.ingredientToEdit = this.navParams.get('ingredient');
        }
    }

    ngOnInit() {
        // Initialize available categories from theme service
        this.availableCategories = this.themeService.getAvailableCategories();
        
        if (this.mode === 'edit') {
            this.itemColorName = this.ingredientToEdit.item.itemColor;
            // Convert legacy itemColor to semantic category key
            this.selectedCategory = this.themeService.getCategoryKey(this.itemColorName);
        } else {
            this.selectedCategory = 'other';
        }
    }

    ionViewDidEnter() {
        // Set focus after the modal is fully presented
        setTimeout(() => {
            const searchBar = this.getActiveSearchBar();
            if (this.mode === 'edit') {
                const simple: any = this.ingredientToEdit.item as any;
                searchBar.value = (simple?.itemName ?? String(simple)) + ' : ' + this.ingredientToEdit.amount;
                this.showColorSelector();
            } else {
                // Show popular items when modal opens for adding new items
                this.loadPopularItems();
            }
            searchBar.setFocus();
        }, 100);
    }

    getActiveSearchBar(): IonSearchbar {
        return this.ingredientBar;
    }

    onIngredientBarFocus() {
        const searchBar = this.getActiveSearchBar();
        if (searchBar.value === '') {
            searchBar.placeholder = 'Item : amount';
        }
    }

    onIngredientBarBlur() {
        const searchBar = this.getActiveSearchBar();
        if (searchBar.value === '') {
            searchBar.placeholder = '+ New item';
            this.showItemColorSelector = false;
        }
    }

    onIngredientNameChanged() {
        const searchBar = this.getActiveSearchBar();

        // Trigger search here
        if (searchBar.value != null && searchBar.value.trim() !== '') {
            this.showColorSelector();
            // empty previous suggestions
            this.itemSuggestions = [];
            // Handle suggestions - now sorted by popularity
            this.itemSuggestions.push(...this.itemService.filterItems(searchBar.value, false).splice(0, 10));
            // Check if we need color chooser
            this.showColorSelector();
        } else {
            // If search bar is empty, show popular items
            this.loadPopularItems();
        }
        
        // Check if we need to store complete ingredient
        if (searchBar.value != null) {
            if (searchBar.value.includes(',')
                && (searchBar.value.endsWith(',') || searchBar.value.endsWith(', '))) {
                this.storeIngredients(false);
            }
        }
    }

    onAddFromSearchbar() {
        const searchBar = this.getActiveSearchBar();
        // check if we have un saved changes
        if (searchBar.value != null) {
            this.storeIngredients(true);
        }
        // remove all ingredients no longer present in the search bar string
        // if (this.mode === 'insert') {
        //    this.slService.addItems(this.ingredients);
        // }
        searchBar.value = null;
        this.showItemColorSelector = false;

        console.log(this.ingredients);

        if (this.mode === 'insert') {
            this.modalCtrl.dismiss(this.ingredients).catch(e => console.log('Could not close modal'));
        } else {
            this.modalCtrl.dismiss(this.ingredients[0]).catch(e => console.log('Could not close modal'));
        }
    }

    chooseColor(categoryKey: string) {
        this.selectedCategory = categoryKey;
        // Convert category to CSS variable for backward compatibility
        this.itemColorName = this.themeService.getCategoryVariable(categoryKey);
        console.log('Category selected:', categoryKey, 'CSS Variable:', this.itemColorName);
        this.getActiveSearchBar().setFocus();
    }

    pickSuggestion(item: SimpleItem) {
        const searchBar = this.getActiveSearchBar();
        this.itemSuggestions = [];
        searchBar.value = item.itemName + ' : ';
        this.itemColorName = item.itemColor;
        
        // Track usage of this item
        this.itemService.incrementUsage(item);
        
        searchBar.setFocus();
        // Check if we need color selector
        this.showColorSelector();
    }

    loadPopularItems() {
        // Load most popular items to show as suggestions
        this.itemSuggestions = this.itemService.getPopularItems(10);
    }

    getSuggestionLabel(): string {
        const searchBar = this.getActiveSearchBar();
        if (searchBar.value && searchBar.value.trim() !== '') {
            return 'Suggestions';
        } else {
            return 'Popular Items';
        }
    }

    getButtonColor(ingredientColor: string) {
        // Convert legacy itemColor to semantic category for display
        const categoryColor = this.themeService.getCategoryColor(ingredientColor);
        return categoryColor;
    }

    trackByCategory(index: number, category: any): string {
        return category.key;
    }

    showColorSelector() {
        const searchBar = this.getActiveSearchBar();
        if (searchBar.value != null && this.itemSuggestions.length === 0) {
            this.showItemColorSelector = true;
        } else {
            this.showItemColorSelector = false;
        }
    }

    onDismiss(event: Event) {
    	console.log(event);
        // Only dismiss if clicking directly on the content area, not on buttons or other elements
        if (event.target === event.currentTarget) {
            this.modalCtrl.dismiss().catch(e => console.log('Could not close modal'));
        }
    }

    onBack() {
        // Dismiss modal without returning any data
        this.modalCtrl.dismiss().catch(e => console.log('Could not close modal'));
    }

    @HostListener('document:keydown.escape', ['$event'])
    onEscapeKey(event: KeyboardEvent) {
        // Close modal when ESC key is pressed
        this.onBack();
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
        const currentIngredientString = this.getActiveSearchBar().value;

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
        
        // Ensure we have a valid color - if empty, use the selected category
        const finalColor = ingredientColor || this.themeService.getCategoryVariable(this.selectedCategory);
        
        let simpleItem: SimpleItem;
        
        if (this.mode === 'edit') {
            // In edit mode, check if we're changing the item name
            const originalItem = this.ingredientToEdit.item;
            
            if (originalItem.itemName.toLowerCase() === ingredientName.toLowerCase()) {
                // Same item name, just update the color if needed
                simpleItem = originalItem;
                if (simpleItem.itemColor !== finalColor) {
                    simpleItem.itemColor = finalColor;
                    this.itemService.updateItem(simpleItem);
                }
                // Track usage for the item being edited
                this.itemService.incrementUsage(simpleItem);
            } else {
                // Item name changed, check if new name exists
                const existingItem = this.checkIfItemExists(ingredientName);
                if (existingItem) {
                    // Use existing item but update color if needed
                    simpleItem = existingItem;
                    if (simpleItem.itemColor !== finalColor) {
                        simpleItem.itemColor = finalColor;
                        this.itemService.updateItem(simpleItem);
                    }
                    // Track usage for existing item
                    this.itemService.incrementUsage(simpleItem);
                } else {
                    // Create new item with new name and color
                    simpleItem = new SimpleItem(Guid.create().toString(), ingredientName, finalColor, 1);
                    this.itemService.addItem(simpleItem);
                }
            }
        } else {
            // Insert mode - check if item exists
            const existingItem = this.checkIfItemExists(ingredientName);
            if (existingItem) {
                // Use existing item but update color if user has chosen a different color
                simpleItem = existingItem;
                if (simpleItem.itemColor !== finalColor) {
                    simpleItem.itemColor = finalColor;
                    this.itemService.updateItem(simpleItem);
                }
                // Track usage for existing item
                this.itemService.incrementUsage(simpleItem);
            } else {
                // Create new item with initial usage count of 1
                simpleItem = new SimpleItem(Guid.create().toString(), ingredientName, finalColor, 1);
                this.itemService.addItem(simpleItem);
            }
        }
        console.log('Created SimpleItem:', simpleItem);
        console.log('Final color for item:', finalColor);
        console.log('Selected category:', this.selectedCategory);
        // Create full ingredient
        const amountNumber = parseFloat(ingredientAmount) || 0;
        if (this.mode === 'insert') {
            return new Ingredient(simpleItem, amountNumber);
        } else if (this.mode === 'edit') {
            return new Ingredient(simpleItem, amountNumber);
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
