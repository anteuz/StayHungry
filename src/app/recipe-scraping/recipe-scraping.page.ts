import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { UnifiedRecipeScrapingService } from '../services/unified-recipe-scraping.service';
import { RecipeServiceService } from '../services/recipe-service.service';
import { ScrapedRecipe } from '../models/scraped-recipe';
import { ToastService } from '../shared/services/toast.service';

@Component({
  selector: 'app-recipe-scraping',
  templateUrl: './recipe-scraping.page.html',
  styleUrls: ['./recipe-scraping.page.scss'],
})
export class RecipeScrapingPage implements OnInit {
  url: string = '';
  isLoading = false;
  scrapedRecipe: ScrapedRecipe | null = null;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private recipeScrapingService: UnifiedRecipeScrapingService,
    private recipeService: RecipeServiceService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastService: ToastService
  ) {}

  ngOnInit() {}

  /**
   * Validate and scrape recipe from URL
   */
  async scrapeRecipe() {
    if (!this.url.trim()) {
      this.showError('Please enter a URL');
      return;
    }

    if (!this.recipeScrapingService.validateUrl(this.url)) {
      this.showError('Please enter a valid URL');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.scrapedRecipe = null;

    const loading = await this.loadingController.create({
      message: 'Scraping recipe...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const result = await this.recipeScrapingService.scrapeRecipeFromUrl(this.url).toPromise();
      
      if (result?.status === 'ok' && result.recipe) {
        this.scrapedRecipe = this.validateAndCleanRecipe(result.recipe);
        this.showSuccess(`Recipe scraped successfully using ${result.extractionMethod}`);
      } else {
        this.errorMessage = result?.error || 'Failed to scrape recipe';
        this.showError(this.errorMessage);
      }
    } catch (error) {
      this.errorMessage = 'Failed to scrape recipe. Please check the URL and try again.';
      this.showError(this.errorMessage);
    } finally {
      this.isLoading = false;
      await loading.dismiss();
    }
  }

  /**
   * Validate and clean scraped recipe data
   */
  private validateAndCleanRecipe(recipe: ScrapedRecipe): ScrapedRecipe {
    // Ensure recipe has a name
    if (!recipe.name || recipe.name.trim() === '') {
      recipe.name = 'Untitled Recipe';
    }

    // Clean and validate ingredients
    if (recipe.recipeIngredient) {
      recipe.recipeIngredient = recipe.recipeIngredient
        .map(ingredient => ingredient?.trim())
        .filter(ingredient => ingredient && ingredient.length > 0);
    }

    // Clean and validate instructions
    if (recipe.recipeInstructions) {
      recipe.recipeInstructions = recipe.recipeInstructions
        .map(instruction => this.cleanInstructionText(instruction))
        .filter(instruction => instruction && instruction.length > 0);
    }

    // Clean description
    if (recipe.description) {
      recipe.description = recipe.description.trim();
    }

    return recipe;
  }

  /**
   * Clean instruction text from various formats
   */
  private cleanInstructionText(instruction: any): string {
    if (typeof instruction === 'string') {
      return instruction.trim();
    }
    
    if (typeof instruction === 'object' && instruction !== null) {
      // Handle HowToStep objects
      if (instruction.text) {
        return instruction.text.trim();
      }
      if (instruction.name) {
        return instruction.name.trim();
      }
      if (instruction.description) {
        return instruction.description.trim();
      }
      if (instruction.content) {
        return instruction.content.trim();
      }
      if (instruction.step) {
        return instruction.step.trim();
      }
      
      // Try to find any string property
      for (const key in instruction) {
        if (typeof instruction[key] === 'string' && instruction[key].trim()) {
          return instruction[key].trim();
        }
      }
    }
    
    // Fallback: convert to string
    return String(instruction).trim();
  }

  /**
   * Check if recipe has valid data for saving
   */
  canSaveRecipe(): boolean {
    if (!this.scrapedRecipe) return false;
    
    const hasIngredients = this.scrapedRecipe.recipeIngredient && 
                          this.scrapedRecipe.recipeIngredient.length > 0;
    const hasInstructions = this.scrapedRecipe.recipeInstructions && 
                           this.scrapedRecipe.recipeInstructions.length > 0;
    
    return hasIngredients && hasInstructions;
  }

  /**
   * Save scraped recipe to the app
   */
  async saveRecipe() {
    if (!this.scrapedRecipe) {
      this.showError('No recipe to save');
      return;
    }

    if (!this.canSaveRecipe()) {
      this.showError('Recipe must have both ingredients and instructions to save');
      return;
    }

    try {
      const recipe = this.recipeScrapingService.convertScrapedToRecipe(this.scrapedRecipe);
      await this.recipeService.addItem(recipe);
      
      this.showSuccess('Recipe saved successfully!');
      
      // Navigate back to recipes page
      setTimeout(() => {
        this.router.navigate(['/tabs/tab2']);
      }, 1500);
    } catch (error) {
      this.showError('Failed to save recipe');
    }
  }

  /**
   * Clear form and reset state
   */
  clearForm() {
    this.url = '';
    this.scrapedRecipe = null;
    this.errorMessage = '';
  }

  /**
   * Show error message
   */
  private async showError(message: string) {
    await this.toastService.showError(message);
  }

  /**
   * Show success message
   */
  private async showSuccess(message: string) {
    await this.toastService.showSuccess(message);
  }

  /**
   * Navigate back to recipes page
   */
  goBack() {
    this.router.navigate(['/tabs/tab2']);
  }
}
