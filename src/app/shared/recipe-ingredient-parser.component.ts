import { Component, Input, OnInit, Inject } from '@angular/core';
import { Recipe } from '../models/recipe';
import { IngredientParserResult } from '../models/ingredient-parser-result';
import { RecipeToShoppingListService, RecipeToShoppingListResult, RecipeValidationResult } from '../services/recipe-to-shopping-list.service';

@Component({
  selector: 'app-recipe-ingredient-parser',
  templateUrl: './recipe-ingredient-parser.component.html',
  styleUrls: ['./recipe-ingredient-parser.component.scss']
})
export class RecipeIngredientParserComponent implements OnInit {
  @Input() recipe: Recipe;
  @Input() selectedShoppingListId: string;

  // Single ingredient parsing
  ingredientText: string = '';
  parsedResult: IngredientParserResult | null = null;

  // Recipe validation
  validationResult: RecipeValidationResult | null = null;

  // Operation results
  lastOperationResult: RecipeToShoppingListResult | null = null;
  isLoading = false;

  constructor(
    @Inject('RecipeToShoppingListService') private recipeToShoppingListService: RecipeToShoppingListService,
    @Inject('IngredientParserService') private ingredientParserService: any
  ) {}

  ngOnInit() {
    if (this.recipe) {
      this.validateRecipe();
    }
  }

  /**
   * Parse a single ingredient text
   */
  parseSingleIngredient() {
    if (!this.ingredientText.trim()) {
      this.parsedResult = null;
      return;
    }

    this.parsedResult = this.ingredientParserService.parseIngredientText(this.ingredientText);
  }

  /**
   * Validate recipe ingredients
   */
  validateRecipe() {
    if (!this.recipe) {
      this.validationResult = null;
      return;
    }

    this.validationResult = this.recipeToShoppingListService.validateRecipeIngredients(this.recipe);
  }

  /**
   * Add recipe ingredients to existing shopping list
   */
  async addToShoppingList() {
    if (!this.recipe || !this.selectedShoppingListId) {
      return;
    }

    this.isLoading = true;
    try {
      this.lastOperationResult = await this.recipeToShoppingListService.addRecipeIngredientsToShoppingListById(
        this.recipe,
        this.selectedShoppingListId,
        { skipDuplicates: true, mergeSimilar: true }
      );
    } catch (error) {
      this.lastOperationResult = {
        success: false,
        addedIngredients: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Create new shopping list from recipe
   */
  async createNewShoppingList() {
    if (!this.recipe) {
      return;
    }

    this.isLoading = true;
    try {
      this.lastOperationResult = await this.recipeToShoppingListService.createShoppingListFromRecipe(this.recipe);
    } catch (error) {
      this.lastOperationResult = {
        success: false,
        addedIngredients: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Get confidence color for UI display
   */
  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.7) return 'success';
    if (confidence >= 0.5) return 'warning';
    return 'danger';
  }

  /**
   * Get confidence text for UI display
   */
  getConfidenceText(confidence: number): string {
    if (confidence >= 0.7) return 'High';
    if (confidence >= 0.5) return 'Medium';
    return 'Low';
  }

  /**
   * Get ingredients that need manual review
   */
  getIngredientsNeedingReview(): IngredientParserResult[] {
    if (!this.recipe) return [];
    return this.recipeToShoppingListService.getIngredientsNeedingReview(this.recipe);
  }

  /**
   * Get successfully parsed ingredients
   */
  getSuccessfullyParsedIngredients(): IngredientParserResult[] {
    if (!this.recipe) return [];
    return this.recipeToShoppingListService.getSuccessfullyParsedIngredients(this.recipe);
  }

  /**
   * Clear last operation result
   */
  clearLastOperationResult() {
    this.lastOperationResult = null;
  }

  /**
   * Clear parsed result
   */
  clearParsedResult() {
    this.parsedResult = null;
    this.ingredientText = '';
  }

  /**
   * Get operation status message
   */
  getOperationStatusMessage(): string {
    if (!this.lastOperationResult) return '';

    if (this.lastOperationResult.success) {
      const count = this.lastOperationResult.addedIngredients.length;
      return count > 0 
        ? `Successfully added ${count} ingredient(s) to shopping list`
        : 'No new ingredients added (duplicates skipped)';
    } else {
      return `Error: ${this.lastOperationResult.error}`;
    }
  }

  /**
   * Get operation status color
   */
  getOperationStatusColor(): string {
    if (!this.lastOperationResult) return '';
    return this.lastOperationResult.success ? 'success' : 'danger';
  }
}
