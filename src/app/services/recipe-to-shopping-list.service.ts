import { Injectable, Inject } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Recipe } from '../models/recipe';
import { ShoppingList } from '../models/shopping-list';
import { Ingredient } from '../models/ingredient';
import { IngredientParserResult } from '../models/ingredient-parser-result';

export interface RecipeToShoppingListResult {
  success: boolean;
  addedIngredients: Ingredient[];
  error?: string;
  shoppingList?: ShoppingList;
}

export interface RecipeValidationResult {
  totalIngredients: number;
  validIngredients: number;
  lowConfidenceIngredients: number;
  parsedResults: IngredientParserResult[];
}

@Injectable({
  providedIn: 'root'
})
export class RecipeToShoppingListService {
  constructor(
    @Inject('ShoppingListService') private shoppingListService: any,
    @Inject('IngredientParserService') private ingredientParserService: any,
    @Inject('ItemService') private itemService: any
  ) {}

  /**
   * Add recipe ingredients to an existing shopping list
   */
  async addRecipeIngredientsToShoppingList(
    recipe: Recipe, 
    shoppingList: ShoppingList,
    options: { skipDuplicates?: boolean; mergeSimilar?: boolean } = {}
  ): Promise<RecipeToShoppingListResult> {
    try {
      if (!recipe.recipeIngredient || recipe.recipeIngredient.length === 0) {
        return {
          success: true,
          addedIngredients: []
        };
      }

      // Parse recipe ingredients
      const parsedIngredients = this.ingredientParserService.parseRecipeToIngredients(
        recipe.recipeIngredient
      );

      if (parsedIngredients.length === 0) {
        return {
          success: true,
          addedIngredients: []
        };
      }

      // Initialize shopping list items if needed
      if (!shoppingList.items) {
        shoppingList.items = [];
      }

      const addedIngredients: Ingredient[] = [];

      for (const parsedIngredient of parsedIngredients) {
        let shouldAdd = true;

        // Check for duplicates if skipDuplicates is enabled
        if (options.skipDuplicates) {
          const existingIngredient = shoppingList.items.find(
            item => item.item.itemName.toLowerCase() === parsedIngredient.item.itemName.toLowerCase()
          );

          if (existingIngredient) {
            shouldAdd = false;
          }
        }

        // Check for similar items if mergeSimilar is enabled
        if (shouldAdd && options.mergeSimilar) {
          const similarIngredient = shoppingList.items.find(
            item => this.isSimilarIngredient(item, parsedIngredient)
          );

          if (similarIngredient) {
            // Merge amounts
            similarIngredient.amount = this.mergeAmounts(similarIngredient.amount, parsedIngredient.amount);
            shouldAdd = false;
          }
        }

        if (shouldAdd) {
          shoppingList.items.push(parsedIngredient);
          addedIngredients.push(parsedIngredient);
        }
      }

      // Update shopping list in database
      await this.shoppingListService.updateShoppingList(shoppingList);

      return {
        success: true,
        addedIngredients,
        shoppingList
      };

    } catch (error) {
      console.error('Error adding recipe ingredients to shopping list:', error);
      return {
        success: false,
        addedIngredients: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Add recipe ingredients to shopping list by ID
   */
  async addRecipeIngredientsToShoppingListById(
    recipe: Recipe, 
    shoppingListId: string,
    options: { skipDuplicates?: boolean; mergeSimilar?: boolean } = {}
  ): Promise<RecipeToShoppingListResult> {
    try {
      const shoppingList = this.shoppingListService.findUsingUUID(shoppingListId);
      
      if (!shoppingList) {
        return {
          success: false,
          addedIngredients: [],
          error: 'Shopping list not found'
        };
      }

      return await this.addRecipeIngredientsToShoppingList(recipe, shoppingList, options);

    } catch (error) {
      console.error('Error adding recipe ingredients to shopping list by ID:', error);
      return {
        success: false,
        addedIngredients: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Create a new shopping list from recipe ingredients
   */
  async createShoppingListFromRecipe(recipe: Recipe): Promise<RecipeToShoppingListResult> {
    try {
      const shoppingListName = `${recipe.name} - Shopping List`;
      const shoppingList = new ShoppingList(uuidv4(), shoppingListName, []);

      const result = await this.addRecipeIngredientsToShoppingList(recipe, shoppingList);
      
      if (result.success) {
        result.shoppingList = shoppingList;
      }

      return result;

    } catch (error) {
      console.error('Error creating shopping list from recipe:', error);
      return {
        success: false,
        addedIngredients: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Validate recipe ingredients and return parsing confidence
   */
  validateRecipeIngredients(recipe: Recipe): RecipeValidationResult {
    if (!recipe.recipeIngredient || recipe.recipeIngredient.length === 0) {
      return {
        totalIngredients: 0,
        validIngredients: 0,
        lowConfidenceIngredients: 0,
        parsedResults: []
      };
    }

    const parsedResults = this.ingredientParserService.parseRecipeIngredients(recipe.recipeIngredient);
    
    const validIngredients = parsedResults.filter(result => result.confidence >= 0.7).length;
    const lowConfidenceIngredients = parsedResults.filter(result => result.confidence < 0.5).length;

    return {
      totalIngredients: recipe.recipeIngredient.length,
      validIngredients,
      lowConfidenceIngredients,
      parsedResults
    };
  }

  /**
   * Check if two ingredients are similar (same item name)
   */
  private isSimilarIngredient(ingredient1: Ingredient, ingredient2: Ingredient): boolean {
    return ingredient1.item.itemName.toLowerCase() === ingredient2.item.itemName.toLowerCase();
  }

  /**
   * Merge two amounts (basic implementation - can be enhanced)
   */
  private mergeAmounts(amount1: string, amount2: string): string {
    // For now, just return the first amount
    // TODO: Implement proper amount merging logic
    return amount1;
  }

  /**
   * Get ingredients that need manual review (low confidence)
   */
  getIngredientsNeedingReview(recipe: Recipe): IngredientParserResult[] {
    const parsedResults = this.ingredientParserService.parseRecipeIngredients(recipe.recipeIngredient || []);
    return parsedResults.filter(result => result.confidence < 0.5);
  }

  /**
   * Get ingredients that were successfully parsed (high confidence)
   */
  getSuccessfullyParsedIngredients(recipe: Recipe): IngredientParserResult[] {
    const parsedResults = this.ingredientParserService.parseRecipeIngredients(recipe.recipeIngredient || []);
    return parsedResults.filter(result => result.confidence >= 0.7);
  }
}
