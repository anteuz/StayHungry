import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';
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
  constructor(
      private router: Router,
      private route: ActivatedRoute,
      private recipeService: RecipeServiceService,
      private cloudStore: CloudStoreService) { }

  ngOnInit() {

    this.subscriptions.add(
      this.recipeService.recipeEvent.subscribe((recipes: Recipe[]) => this.recipes = recipes)
    );

  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onNewRecipe() {
    this.router.navigate(['/tabs/tab2/recipe', 'new'], {relativeTo: this.route}).catch(e => console.log('Could not navigate'));
  }

  onDelete(recipe: Recipe) {
    this.cloudStore.removeImage(recipe.uuid);
    this.recipeService.removeRecipe(recipe);
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
}
