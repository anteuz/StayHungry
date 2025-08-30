import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonHeader, IonToolbar, IonSegment, IonSegmentButton, IonButtons, IonMenuToggle, IonButton, IonIcon, IonBadge, IonContent, IonItemSliding, IonItem, IonThumbnail, IonImg, IonLabel, IonItemOptions, IonItemOption, IonFab, IonFabButton } from '@ionic/angular/standalone';
import { ObjectNamePipe } from '../shared/object-name.pipe';
import {ActivatedRoute, Router} from '@angular/router';
import {PopoverController} from '@ionic/angular';
import {Guid} from 'guid-typescript';
import {Subscription} from 'rxjs';
import {CartPopoverComponent} from '../cart-popover/cart-popover.component';
import {Cart} from '../models/cart';
import {Ingredient} from '../models/ingredient';
import {Recipe} from '../models/recipe';
import {CloudStoreService} from '../services/cloud-store.service';
import {RecipeServiceService} from '../services/recipe-service.service';
import {compare, groupByVanilla2} from '../shopping-list/shopping-list.page';

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ObjectNamePipe,
    IonHeader,
    IonToolbar,
    IonSegment,
    IonSegmentButton,
    IonButtons,
    IonMenuToggle,
    IonButton,
    IonIcon,
    IonBadge,
    IonContent,
    IonItemSliding,
    IonItem,
    IonThumbnail,
    IonImg,
    IonLabel,
    IonItemOptions,
    IonItemOption,
    IonFab,
    IonFabButton
  ],
  templateUrl: './recipes.page.html',
  styleUrls: ['./recipes.page.scss'],
})
export class RecipesPage implements OnInit, OnDestroy {

  recipes: Recipe[] = [];
  subscriptions: Subscription = new Subscription();
  recipeFilter = 'all';
  cart: Cart = null;

  // IonVirtualScroll removed in Ionic 8, leaving property for legacy templates (unused)
  @ViewChild('virtualScroll', {static: false}) virtualScroll: any;
  constructor(
      private router: Router,
      private route: ActivatedRoute,
      private recipeService: RecipeServiceService,
      private cloudStore: CloudStoreService,
      public popoverController: PopoverController) { }

  ngOnInit() {

    this.subscriptions.add(
      this.recipeService.recipeEvent.subscribe((recipes: Recipe[]) => {
          this.recipes = recipes;
          console.log(this.recipes);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onNewRecipe() {
    this.router.navigate(['/tabs/tab2/recipe', 'new'], {relativeTo: this.route}).catch(e => console.log('Could not navigate'));
  }

  openRecipe(recipe: Recipe, slidingItem: IonItemSliding) {
      slidingItem.closeOpened();
      this.router.navigate(['/tabs/tab2/recipe', 'view', recipe.uuid], {relativeTo: this.route}).catch(e => console.log('Could not navigate'));
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
    segmentChanged(event: any) {
      this.recipeFilter = event.detail.value;
      console.log(this.recipeFilter);
      if (this.recipeFilter === 'all') {
          this.recipes = this.recipeService.getItems();
      } else {
          this.recipes = this.recipeService.filterUsingCategory(this.recipeFilter);
      }
    }

    addToCart(recipe: Recipe) {
      if (this.cart === null) {
        this.cart = new Cart(Guid.create().toString(), []);
      }
      this.cart.recipes.push(recipe);
    }

    async checkCart(event: Event) {
      const popover = await this.popoverController.create({
        component: CartPopoverComponent,
        event: event,
        translucent: false,
        cssClass: 'cartPopover',
        componentProps: {
          cart: this.cart
        }
      });
      popover.present();
      const {data} = await popover.onDidDismiss();
      console.log(data);
      if (data !== undefined) {
        this.cart = data;
      }
    }
}
