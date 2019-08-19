import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {IonList, ModalController} from '@ionic/angular';
import {Subscription} from 'rxjs';
import {IngredientOverlayPage} from '../ingredient-overlay/ingredient-overlay.page';
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
        // Get shopping List
        try {
            this.shoppingList = this.slService.findUsingUUID(this.shoppingListID);
            console.log(this.shoppingList);
            if (this.shoppingList) {
                this.loading = false;
                this.initializeIngredients();
            }
        } catch (e) {
            this.loading = false;
            this.shoppingList = null;
            this.ingredients = null;
        }
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

        // Subscribe for changes
        this.subscriptions.add(this.slService.shoppingListsEvent.subscribe(
            (event) => {

                if (this.shoppingListID != null) {
                    this.shoppingList = this.slService.findUsingUUID(this.shoppingListID);
                    this.initializeIngredients();
                }
            }
        ));

        // Get shopping List
        try {
            this.shoppingList = this.slService.findUsingUUID(this.shoppingListID);

            if (this.shoppingList) {
                this.loading = false;
                this.initializeIngredients();
            }
        } catch (e) {

        }
    }

    onRemoveItem(index: Ingredient) {
        this.ingredientList.closeSlidingItems().catch(e => console.log('Could not close sliding item'));
        this.ingredients.splice(this.ingredients.indexOf(index), 1);
        this.shoppingList.items = this.ingredients;
        this.slService.updateShoppingList(this.shoppingList);
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
        this.showSearchBar = false;
        modal.present().catch(e => console.log('Could not present modal!'));

        const {data} = await modal.onDidDismiss();
        // if data is provided, if action is cancelled data is undefined (backdrop tapped)
        if (data !== undefined) {
            this.ingredients[this.ingredients.indexOf(this.findIngredientUsingUUID(data.uuid)[0])] = data;
            this.addItemsToShoppingList(data);
            this.initializeIngredients();
            this.slService.updateShoppingList(this.shoppingList);
        }
        this.showSearchBar = true;
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
        this.showSearchBar = false;
        modal.present().catch(e => console.log('Could not present modal!'));

        const {data} = await modal.onDidDismiss(); // Maybe later?
        this.addItemsToShoppingList(data);
        this.initializeIngredients();
        this.slService.updateShoppingList(this.shoppingList);
        this.showSearchBar = true;
        modal = null;
    }

    onOpenItemsList() {
        const grouped = groupByVanilla2(this.ingredients, ingredient => ingredient.item.itemColor);
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
