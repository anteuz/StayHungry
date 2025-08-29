import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {IonList, ModalController} from '@ionic/angular';
import {Subscription} from 'rxjs';
import {IngredientOverlayPage} from '../ingredient-overlay/ingredient-overlay.page';
import {BrowseItemsModalComponent} from '../browse-items-modal/browse-items-modal.component';
import {AppState} from '../models/app-state';
import {Ingredient} from '../models/ingredient';
import {ShoppingList} from '../models/shopping-list';
import {ShoppingListService} from '../services/shopping-list.service';
import {SimpleStateService} from '../services/simple-state-service';

@Component({
    selector: 'app-shopping-list',
    templateUrl: './shopping-list.page.html',
    styleUrls: ['./shopping-list.page.scss'],
})
export class ShoppingListPage implements OnInit, OnDestroy {

    shoppingListID: string;
    shoppingList: ShoppingList;
    ingredients: Ingredient[] = [];
    ingredientMap: Map<string, Ingredient[]>;
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
        private stateService: SimpleStateService
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

    onRemoveItem(index: Ingredient) {
        this.ingredientList.closeSlidingItems().catch(e => console.log('Could not close sliding item'));
        this.ingredients.splice(this.ingredients.indexOf(index), 1);
        this.shoppingList.items = this.ingredients;
        this.slService.updateShoppingList(this.shoppingList);
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
            this.slService.updateShoppingList(this.shoppingList);
        }
        modal = null;
        this.ingredientList.closeSlidingItems().catch(e => console.log('Could not close sliding item'));
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    getStyle(ingredientColor: string) {
        return '5px solid var(' + ingredientColor + ')';
    }

    getStyleClass(ingredient: Ingredient) {
         if (this.ingredientMap === undefined || ingredient === undefined) {
             return 'roundedCornersTop';
         }
        else if (this.ingredientMap.get(ingredient.item.itemColor).indexOf(ingredient) === 0 && this.ingredientMap.get(ingredient.item.itemColor).length > 1) {
            return 'roundedCornersTop';
        } else if (this.ingredientMap.get(ingredient.item.itemColor).indexOf(ingredient) === 0 && this.ingredientMap.get(ingredient.item.itemColor).length === 1) {
            return 'roundedCornersSingle';
        } else if (this.ingredientMap.get(ingredient.item.itemColor).indexOf(ingredient) === this.ingredientMap.get(ingredient.item.itemColor).length - 1) {
            return 'roundedCornersBottom';
        } else {
            return 'roundedCornersMiddle';
        }
    }

    async onCollect(ingredient: Ingredient) {
        ingredient.isCollected = true;
        ingredient.isBeingCollected = false;
        this.shoppingList.items = this.ingredients;
        await this.slService.updateShoppingList(this.shoppingList);

    }

    async onDeCollect(ingredient: Ingredient) {
        ingredient.isCollected = false;
        this.shoppingList.items = this.ingredients;
        await this.slService.updateShoppingList(this.shoppingList);
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
            this.slService.updateShoppingList(this.shoppingList);
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
            this.slService.updateShoppingList(this.shoppingList);
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
        }
        // Create groups by color for ui magic
        this.loading = false;
    }

    clearCollected() {
        for (let i = this.ingredients.length - 1; i >= 0; --i) {
            if (this.ingredients[i].isCollected === true) {
                this.ingredients.splice(i, 1);
            }
        }
        this.shoppingList.items = this.ingredients;
        this.slService.updateShoppingList(this.shoppingList);
    }

    private addItemsToShoppingList(data) {
        if (this.shoppingList.items == null) {
            this.shoppingList.items = [];
        }
        this.shoppingList.items.push(...data);
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
    if (a.item.itemColor < b.item.itemColor) {
        return -1;
    }
    if (a.item.itemColor > b.item.itemColor) {
        return 1;
    }
    return 0;
}
