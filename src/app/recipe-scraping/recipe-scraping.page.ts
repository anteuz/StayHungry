import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { UnifiedRecipeScrapingService } from '../services/unified-recipe-scraping.service';
import { RecipeServiceService } from '../services/recipe-service.service';
import { ScrapedRecipe } from '../models/scraped-recipe';

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
    private toastController: ToastController
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
        this.scrapedRecipe = result.recipe;
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
   * Save scraped recipe to the app
   */
  async saveRecipe() {
    if (!this.scrapedRecipe) {
      this.showError('No recipe to save');
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
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'danger',
      position: 'top'
    });
    toast.present();
  }

  /**
   * Show success message
   */
  private async showSuccess(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'success',
      position: 'top'
    });
    toast.present();
  }

  /**
   * Navigate back to recipes page
   */
  goBack() {
    this.router.navigate(['/tabs/tab2']);
  }
}
