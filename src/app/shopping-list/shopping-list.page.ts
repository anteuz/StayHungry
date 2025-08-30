import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuToggle, IonButton, IonIcon, IonContent, IonItem, IonSearchbar, IonBadge, IonList, IonItemSliding, IonItemOptions, IonItemOption, IonLabel, IonSpinner } from '@ionic/angular/standalone';
import { ThemeToggleComponent } from '../shared/theme-toggle.component';
import { IsCollectedPipe } from '../shared/iscollected.pipe';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {ModalController} from '@ionic/angular';
import {Subscription} from 'rxjs';
import {IngredientOverlayPage} from '../ingredient-overlay/ingredient-overlay.page';
import {BrowseItemsModalComponent} from '../browse-items-modal/browse-items-modal.component';
import {AppState} from '../models/app-state';
import {Ingredient} from '../models/ingredient';
import {ShoppingList} from '../models/shopping-list';
import {ShoppingListService} from '../services/shopping-list.service';
import {SimpleStateService} from '../services/simple-state-service';
import {ThemeService} from '../services/theme.service';

@Component({
    selector: 'app-shopping-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonButtons,
        IonMenuToggle,
        IonButton,
        IonIcon,
        IonContent,
        IonItem,
        IonSearchbar,
        IonBadge,
        IonList,
        IonItemSliding,
        IonItemOptions,
        IonItemOption,
        IonLabel,
        IonSpinner,
        ThemeToggleComponent,
        IsCollectedPipe
    ],
    templateUrl: './shopping-list.page.html',
    styleUrls: ['./shopping-list.page.scss'],
})
export class ShoppingListPage implements OnInit, OnDestroy {

    shoppingListID: string;
    shoppingList: ShoppingList;
    ingredients: Ingredient[] = [];
    ingredientMap: Map<string, Ingredient[]>;
    categorizedIngredients: Array<{category: any, items: Ingredient[]}> = [];
    showSearchBar = true;
    @ViewChild('ingredientList', {static: false}) ingredientList: IonList;
    loading = true;
    appState: AppState = null;
    private subscriptions: Subscription = new Subscription();

     constructor(
        public slService: ShoppingListService,
        public modalCtrl: ModalController,
        public router: Router,
        public route: ActivatedRoute,
        private stateService: SimpleStateService,
        private themeService: ThemeService
    ) {
        console.log('Created constructor');
        // If route param is empty, go to last opened shopping list
        if (this.shoppingListID == null) {
            this.stateService.getAppState().then(appState => this.appState = appState).catch(e => console.log('Could not get app state'));
        }
    }

    async ionViewWillEnter() {
        console.log('ion view will enter');
        // If route param is empty, go to last opened shopping list
        if (this.shoppingListID == null) {
            if (this.appState) {
                this.shoppingListID = this.appState.lastVisited_ShoppingList;
            }
        }
        
        // Only try to get shopping list if service has data loaded
        const existingShoppingLists = this.slService.getItems();
        if (existingShoppingLists && existingShoppingLists.length > 0) {
            try {
                this.shoppingList = this.slService.findUsingUUID(this.shoppingListID);
                console.log(this.shoppingList);
                if (this.shoppingList) {
                    this.loading = false;
                    this.initializeIngredients();
                } else {
                    // If specific shopping list not found but lists exist, don't show error yet
                    // The subscription will handle it when data is fully loaded
                    console.log('Shopping list not found with ID:', this.shoppingListID);
                }
            } catch (e) {
                console.log('Error finding shopping list:', e);
            }
        }
        // If no shopping lists loaded yet, let the subscription handle it
    }

    async ngOnInit() {
        console.log('onInit');
        // Get Route parameter
        this.route.params
            .subscribe(
                (params: Params) => {
                    this.shoppingListID = params['id'];
                    if (this.shoppingListID != null) {
                        this.stateService.updateLastVisitedShoppingList(this.shoppingListID);
                    }
                }
            );

        // If route param is empty, go to last opened shopping list
        if (this.shoppingListID == null) {
            const appState = await this.stateService.getAppState();
            if (appState) {
                this.shoppingListID = appState.lastVisited_ShoppingList;
                this.router.navigate(['/tabs/tab1', this.shoppingListID]).catch(e => console.log('Could not navigate to tabs!'));
            }
        }

        // Subscribe for changes - this will handle the initial load and subsequent updates
        this.subscriptions.add(this.slService.shoppingListsEvent.subscribe(
            (shoppingLists: ShoppingList[]) => {
                this.loading = false; // Set loading to false once we have data from the service
                
                if (this.shoppingListID != null) {
                    this.shoppingList = this.slService.findUsingUUID(this.shoppingListID);
                    if (this.shoppingList) {
                        this.initializeIngredients();
                    }
                } else {
                    // If no shopping list ID, try to get the first available shopping list
                    if (shoppingLists && shoppingLists.length > 0) {
                        this.shoppingListID = shoppingLists[0].uuid;
                        this.shoppingList = shoppingLists[0];
                        this.initializeIngredients();
                        this.router.navigate(['/tabs/tab1', this.shoppingListID]).catch(e => console.log('Could not navigate to tabs!'));
                    }
                }
            }
        ));

        // Try to get shopping list immediately if service already has data
        const existingShoppingLists = this.slService.getItems();
        if (existingShoppingLists && existingShoppingLists.length > 0) {
            this.loading = false;
            if (this.shoppingListID != null) {
                this.shoppingList = this.slService.findUsingUUID(this.shoppingListID);
                if (this.shoppingList) {
                    this.initializeIngredients();
                }
            }
        }
    }

    async onRemoveItem(index: Ingredient) {
        this.ingredientList.closeSlidingItems().catch(e => console.log('Could not close sliding item'));
        this.ingredients.splice(this.ingredients.indexOf(index), 1);
        this.shoppingList.items = this.ingredients;
        
        try {
            await this.slService.updateShoppingList(this.shoppingList);
            console.log('Successfully removed item from shopping list');
        } catch (error) {
            console.error('Failed to remove item from shopping list:', error);
            // Revert the change if database update fails
            this.ingredients.push(index);
            this.shoppingList.items = this.ingredients;
            this.initializeIngredients();
        }
    }

    async onEdit(ingredient: Ingredient) {
        // Blur the main search bar to ensure clean focus transition
        const mainSearchBar = document.querySelector('ion-searchbar') as HTMLIonSearchbarElement;
        if (mainSearchBar) {
            mainSearchBar.blur();
        }

        let modal = await this.modalCtrl.create({
            component: IngredientOverlayPage,
            animated: false,
            showBackdrop: true,
            cssClass: 'searchbar-dropdown',
            backdropDismiss: true,
            componentProps:
                {
                    'mode': 'edit',
                    'ingredient': ingredient
                }
        });
        modal.present().catch(e => console.log('Could not present modal!'));

        const {data} = await modal.onDidDismiss();
        // if data is provided, if action is cancelled data is undefined (backdrop tapped)
        if (data !== undefined) {
            // Find and replace the existing ingredient
            const existingIngredientIndex = this.ingredients.findIndex(ing => ing.uuid === data.uuid);
            if (existingIngredientIndex !== -1) {
                this.ingredients[existingIngredientIndex] = data;
            }
            // Update the shopping list items
            this.shoppingList.items = this.ingredients;
            this.initializeIngredients();
            
            try {
                await this.slService.updateShoppingList(this.shoppingList);
                console.log('Successfully updated ingredient in shopping list');
            } catch (error) {
                console.error('Failed to update ingredient in shopping list:', error);
                // Revert the change if database update fails
                if (existingIngredientIndex !== -1) {
                    this.ingredients[existingIngredientIndex] = ingredient; // Revert to original
                }
                this.shoppingList.items = this.ingredients;
                this.initializeIngredients();
            }
        }
        modal = null;
        this.ingredientList.closeSlidingItems().catch(e => console.log('Could not close sliding item'));
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    getStyle(ingredientColor: string) {
        // Handle both new category colors and legacy itemColor variables
        let cssVariable = ingredientColor;
        
        // If itemColor doesn't start with --, it might be a legacy format or category name
        if (!ingredientColor.startsWith('--')) {
            // Try to get the proper CSS variable from theme service
            cssVariable = this.themeService.getCategoryVariable(ingredientColor);
        }
        
        // Ensure we have a valid CSS variable format
        if (!cssVariable.startsWith('--')) {
            cssVariable = '--ion-color-category-other';
        }
        
        return `5px solid var(${cssVariable})`;
    }

    getCategoryStyle(ingredient: Ingredient) {
        const cssVariable = this.getCategoryColor(ingredient.item.itemColor);
        
        // All items use the same border-left styling
        return {
            'border-left': `5px solid var(${cssVariable})`
        };
    }

    private getCategoryColor(ingredientColor: string): string {
        // Handle both new category colors and legacy itemColor variables
        let cssVariable = ingredientColor;
        
        // If itemColor doesn't start with --, it might be a legacy format or category name
        if (!ingredientColor.startsWith('--')) {
            // Try to get the proper CSS variable from theme service
            cssVariable = this.themeService.getCategoryVariable(ingredientColor);
        }
        
        // Ensure we have a valid CSS variable format
        if (!cssVariable.startsWith('--')) {
            cssVariable = '--ion-color-category-other';
        }
        
        return cssVariable;
    }

    getStyleClass(ingredient: Ingredient) {
        if (this.ingredientMap === undefined || ingredient === undefined) {
            return 'roundedCornersTop';
        }
        
        const categoryItems = this.ingredientMap.get(ingredient.item.itemColor);
        if (!categoryItems) {
            return 'roundedCornersMiddle';
        }
        
        const itemIndex = categoryItems.indexOf(ingredient);
        const totalItems = categoryItems.length;
        
        // Single item in category
        if (totalItems === 1) {
            return 'roundedCornersMiddle';
        }
        
        // First item (top)
        if (itemIndex === 0) {
            return 'roundedCornersTop';
        }
        
        // Last item (bottom)
        if (itemIndex === totalItems - 1) {
            return 'roundedCornersBottom';
        }
        
        // Middle items
        return 'roundedCornersMiddle';
    }
    async onCollect(ingredient: Ingredient) {
        console.log('Collecting ingredient:', ingredient.item.itemName);
        ingredient.isCollected = true;
        ingredient.isBeingCollected = false;
        
        // Ensure the shopping list items array is properly updated
        this.shoppingList.items = [...this.ingredients]; // Create new array reference
        
        // Sort ingredients to move collected items to bottom
        this.sortIngredients();
        
        // Update the service and database
        try {
            await this.slService.updateShoppingList(this.shoppingList);
            console.log('Successfully saved collected state to database');
        } catch (error) {
            console.error('Failed to save collected state to database:', error);
            // Revert the change if database update fails
            ingredient.isCollected = false;
            ingredient.isBeingCollected = false;
        }
        
        // Refresh local state
        this.initializeIngredients();
    }

    async onDeCollect(ingredient: Ingredient) {
        console.log('De-collecting ingredient:', ingredient.item.itemName);
        ingredient.isCollected = false;
        
        // Ensure the shopping list items array is properly updated
        this.shoppingList.items = [...this.ingredients]; // Create new array reference
        
        // Sort ingredients to move uncollected items to top
        this.sortIngredients();
        
        // Update the service and database
        try {
            await this.slService.updateShoppingList(this.shoppingList);
            console.log('Successfully saved de-collected state to database');
        } catch (error) {
            console.error('Failed to save de-collected state to database:', error);
            // Revert the change if database update fails
            ingredient.isCollected = true;
        }
        
        // Refresh local state
        this.initializeIngredients();
    }

    async beingCollected(ingredient: Ingredient) {
        if (ingredient.isBeingCollected) {
            return 'collected';
        } else {
            return '';
        }
    }

    onStartCollect(ingredient: Ingredient) {
        ingredient.isBeingCollected = true;
    }

    cancelCollect(ingredient: Ingredient) {
        ingredient.isBeingCollected = false;
    }

    onTransitionEnd(event: TransitionEvent, ingredient: Ingredient) {
        // Only trigger onCollect for the transform transition to avoid multiple calls
        if (event.propertyName === 'transform' && ingredient.isBeingCollected) {
            this.onCollect(ingredient);
        }
    }

    async openIngredientOverlay() {
        // Blur the main search bar to ensure clean focus transition
        const mainSearchBar = document.querySelector('ion-searchbar') as HTMLIonSearchbarElement;
        if (mainSearchBar) {
            mainSearchBar.blur();
        }

        let modal = await this.modalCtrl.create({
            component: IngredientOverlayPage,
            animated: false,
            showBackdrop: true,
            cssClass: 'searchbar-dropdown',
            backdropDismiss: true,
            componentProps:
                {
                    'mode': 'insert'
                }
        });
        modal.present().catch(e => console.log('Could not present modal!'));

        const {data} = await modal.onDidDismiss();
        // if data is provided, if action is cancelled data is undefined (backdrop tapped)
        if (data !== undefined) {
            // Add new ingredients to the shopping list
            if (Array.isArray(data)) {
                this.addItemsToShoppingList(data);
            } else {
                // Single ingredient (shouldn't happen in insert mode, but handle it)
                if (this.shoppingList.items == null) {
                    this.shoppingList.items = [];
                }
                this.shoppingList.items.push(data);
            }
            this.initializeIngredients();
            
            try {
                await this.slService.updateShoppingList(this.shoppingList);
                console.log('Successfully added ingredients to shopping list');
            } catch (error) {
                console.error('Failed to add ingredients to shopping list:', error);
                // Revert the changes if database update fails
                if (Array.isArray(data)) {
                    this.shoppingList.items.splice(-data.length);
                } else {
                    this.shoppingList.items.pop();
                }
                this.initializeIngredients();
            }
        }
        modal = null;
    }

    async onOpenItemsList() {
        const modal = await this.modalCtrl.create({
            component: BrowseItemsModalComponent,
            animated: true,
            showBackdrop: true,
            cssClass: 'browse-items-modal',
            backdropDismiss: true
        });
        
        await modal.present();
        
        const { data } = await modal.onDidDismiss();
        if (data) {
            // data is an Ingredient object returned from the modal
            if (this.shoppingList.items == null) {
                this.shoppingList.items = [];
            }
            this.shoppingList.items.push(data);
            this.initializeIngredients();
            
            try {
                await this.slService.updateShoppingList(this.shoppingList);
                console.log('Successfully added item to shopping list');
            } catch (error) {
                console.error('Failed to add item to shopping list:', error);
                // Revert the change if database update fails
                this.shoppingList.items.pop();
                this.initializeIngredients();
            }
        }
    }

    findIngredientUsingUUID(searchTerm) {
        return this.ingredients.filter((ingredient) => {
            return ingredient.uuid.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1;
        });
    }

    initializeIngredients() {

        if (this.shoppingList != null && this.shoppingList.items != null) {
            this.shoppingList.items.sort(compare);
            this.ingredients = this.shoppingList.items;
            this.ingredientMap = groupByVanilla2(this.ingredients, ingredient => ingredient.item.itemColor);
            this.categorizedIngredients = this.getCategorizedIngredients();
        }
        // Create groups by color for ui magic
        this.loading = false;
    }

    /**
     * Efficient method to just sort ingredients without recreating maps or resetting loading state
     */
    private sortIngredients() {
        if (this.ingredients && this.ingredients.length > 0) {
            this.ingredients.sort(compare);
            this.shoppingList.items = this.ingredients;
            this.categorizedIngredients = this.getCategorizedIngredients();
        }
    }

    async clearCollected() {
        const originalIngredients = [...this.ingredients];
        
        for (let i = this.ingredients.length - 1; i >= 0; --i) {
            if (this.ingredients[i].isCollected === true) {
                this.ingredients.splice(i, 1);
            }
        }
        this.shoppingList.items = this.ingredients;
        
        try {
            await this.slService.updateShoppingList(this.shoppingList);
            console.log('Successfully cleared collected items from shopping list');
        } catch (error) {
            console.error('Failed to clear collected items from shopping list:', error);
            // Revert the change if database update fails
            this.ingredients = originalIngredients;
            this.shoppingList.items = this.ingredients;
            this.initializeIngredients();
        }
    }

    private addItemsToShoppingList(data) {
        if (this.shoppingList.items == null) {
            this.shoppingList.items = [];
        }
        this.shoppingList.items.push(...data);
    }

    /**
     * Get category information from itemColor using the theme service
     */
    getCategoryFromItemColor(itemColor: string): any {
        const categoryKey = this.themeService.getCategoryKey(itemColor);
        const availableCategories = this.themeService.getAvailableCategories();
        const result = availableCategories.find(cat => cat.key === categoryKey) || 
                      availableCategories.find(cat => cat.key === 'other');
        
        // Debug logging to help identify category mapping issues
        if (categoryKey === 'other' && itemColor !== '--ion-color-category-other') {
            console.log('Item defaulting to Other category:', {
                itemColor: itemColor,
                categoryKey: categoryKey,
                mappedCategory: result
            });
        }
        
        return result;
    }

    /**
     * Organize ingredients by category for display with category headers
     */
    getCategorizedIngredients(): Array<{category: any, items: Ingredient[]}> {
        if (!this.ingredients || this.ingredients.length === 0) {
            return [];
        }

        // Filter out collected items for categorization
        const uncollectedIngredients = this.ingredients.filter(ingredient => !ingredient.isCollected);
        
        // Group ingredients by category
        const categoryMap = new Map<string, Ingredient[]>();
        
        uncollectedIngredients.forEach(ingredient => {
            const category = this.getCategoryFromItemColor(ingredient.item.itemColor);
            const categoryKey = category.key;
            
            if (!categoryMap.has(categoryKey)) {
                categoryMap.set(categoryKey, []);
            }
            categoryMap.get(categoryKey).push(ingredient);
        });

        // Convert map to array and sort categories
        const categorizedResults: Array<{category: any, items: Ingredient[]}> = [];
        const availableCategories = this.themeService.getAvailableCategories();
        
        // Iterate through categories in predefined order
        availableCategories.forEach(category => {
            const items = categoryMap.get(category.key);
            if (items && items.length > 0) {
                // Sort items within category by name
                items.sort((a, b) => a.item.itemName.localeCompare(b.item.itemName));
                categorizedResults.push({
                    category: category,
                    items: items
                });
            }
        });

        return categorizedResults;
    }
}

export function groupByVanilla2(list, keyGetter) {
    const map = new Map();
    list.forEach((item) => {
        const key = keyGetter(item);
        const collection = map.get(key);
        if (!collection && item.isCollected !== true) {
            map.set(key, [item]);
        } else {
            if (item.isCollected !== true) {
                collection.push(item);
            }
        }
    });
    return map;
}

export function compare(a: Ingredient, b: Ingredient) {
    // First sort by collection status - uncollected items first
    if (a.isCollected !== b.isCollected) {
        return a.isCollected ? 1 : -1;
    }
    
    // Then sort by item color for visual grouping
    if (a.item.itemColor < b.item.itemColor) {
        return -1;
    }
    if (a.item.itemColor > b.item.itemColor) {
        return 1;
    }
    
    // Finally sort by item name for consistent ordering within same color group
    return a.item.itemName.localeCompare(b.item.itemName);
}
