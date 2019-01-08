import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {IonList, ModalController} from '@ionic/angular';
import {Subscription} from 'rxjs';
import {IngredientOverlayPage} from '../ingredient-overlay/ingredient-overlay.page';
import {Ingredient} from '../models/ingredient';
import {ShoppingListService} from '../services/shopping-list.service';

@Component({
    selector: 'app-shopping-list',
    templateUrl: './shopping-list.page.html',
    styleUrls: ['./shopping-list.page.scss'],
})
export class ShoppingListPage implements OnInit, OnDestroy {

    ingredients: Ingredient[] = [];
    ingredientMap: Map<string, Ingredient[]>;
    showSearchBar = true;
    @ViewChild('ingredientList') ingredientList: IonList;
    loading = true;

    private subscriptions: Subscription = new Subscription();

    constructor(
        public slService: ShoppingListService,
        public modalCtrl: ModalController
    ) {

        console.log('Created constructor');
    }

    ngOnInit() {
        this.subscriptions.add(this.slService.newIngredientEvent.subscribe(
            (ingredients) => {
                this.ingredients = ingredients;
                // Create groups by color for ui magic
                this.ingredientMap = groupByVanilla2(this.ingredients, ingredient => ingredient.item.itemColor);
                if (this.loading === true) {
                    this.loading = false;
                }
            }
        ));
    }

    onRemoveItem(index: Ingredient) {
        this.ingredientList.closeSlidingItems();
        this.slService.removeItem(index);
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
        modal.present();

        const {data} = await modal.onDidDismiss();
        this.slService.updateItem(data);
        this.showSearchBar = true;
        modal = null;
        this.ingredientList.closeSlidingItems();
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
        console.log(this.subscriptions);
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
        modal.present();

        const {data} = await modal.onDidDismiss(); // Maybe later?
        this.showSearchBar = true;
        modal = null;
    }

    onOpenItemsList() {
        const grouped = groupByVanilla2(this.ingredients, ingredient => ingredient.item.itemColor);
        console.log(grouped);
    }
}

function groupByVanilla2(list, keyGetter) {
    const map = new Map();
    list.forEach((item) => {
        const key = keyGetter(item);
        const collection = map.get(key);
        if (!collection && item.isCollected !== true) {
            map.set(key, [item]);
        } else {
            if (item.isCollected != true) {
                collection.push(item);
            }
        }
    });
    return map;
}
