import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {IonItem, IonItemSliding, IonVirtualScroll, PopoverController} from '@ionic/angular';
import {v4 as uuidv4} from 'uuid';
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
  templateUrl: './recipes.page.html',
  styleUrls: ['./recipes.page.scss'],
})
export class RecipesPage implements OnInit, OnDestroy {

  recipes: Recipe[] = [];
  subscriptions: Subscription = new Subscription();
  recipeFilter = 'all';
  cart: Cart = null;

  // Recipe category options with labels
  readonly categoryOptions = [
    { value: 'all', label: 'All Recipes', icon: 'globe' },
    { value: 'basicStuff', label: 'Basic Stuff', icon: 'basket' },
    { value: 'food', label: 'Food', icon: 'pizza' },
    { value: 'drinks', label: 'Drinks', icon: 'wine' },
    { value: 'desserts', label: 'Desserts', icon: 'ice-cream' },
    { value: 'householdUtilities', label: 'Household', icon: 'construct' },
    { value: 'apothecary', label: 'Health', icon: 'medkit' },
    { value: 'clothes', label: 'Clothes', icon: 'shirt' }
  ];

  @ViewChild('virtualScroll', {static: false}) virtualScroll: IonVirtualScroll;
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
    this.router.navigate(['/tabs/tab2/scrape'], {relativeTo: this.route}).catch(e => console.log('Could not navigate'));
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
      this.cart = new Cart(uuidv4(), []);
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

  /**
   * Get category label for display
   */
  getCategoryLabel(categoryValue: string): string {
    const category = this.categoryOptions.find(opt => opt.value === categoryValue);
    return category ? category.label : 'Unknown';
  }

  /**
   * Get category icon for display
   */
  getCategoryIcon(categoryValue: string): string {
    const category = this.categoryOptions.find(opt => opt.value === categoryValue);
    return category ? category.icon : 'help-circle';
  }

  /**
   * Get recipe display info
   */
  getRecipeDisplayInfo(recipe: Recipe): string {
    if (recipe.recipeIngredient && recipe.recipeIngredient.length > 0) {
      return `${recipe.recipeIngredient.length} ingredients`;
    } else if (recipe.ingredients && recipe.ingredients.length > 0) {
      return `${recipe.ingredients.length} ingredients`;
    } else {
      return 'No ingredients';
    }
  }

  /**
   * Check if recipe has instructions
   */
  hasInstructions(recipe: Recipe): boolean {
    return recipe.recipeInstructions && recipe.recipeInstructions.length > 0;
  }

  /**
   * Get instruction count
   */
  getInstructionCount(recipe: Recipe): number {
    return recipe.recipeInstructions ? recipe.recipeInstructions.length : 0;
  }
}
