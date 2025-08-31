import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ScrapedRecipe, RecipeScrapingResult } from '../models/scraped-recipe';

@Injectable({
  providedIn: 'root'
})
export class RecipeScrapingService {
  private readonly API_BASE_URL = 'https://your-firebase-function-url.com'; // Replace with actual Firebase function URL

  constructor(private http: HttpClient) {}

  /**
   * Scrape recipe from a URL using the Firebase function
   */
  scrapeRecipeFromUrl(url: string): Observable<RecipeScrapingResult> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<RecipeScrapingResult>(`${this.API_BASE_URL}/parseRecipe`, { url }, { headers })
      .pipe(
        catchError(error => {
          console.error('Recipe scraping failed:', error);
          return throwError(() => new Error('Failed to scrape recipe from URL'));
        })
      );
  }

  /**
   * Convert scraped recipe to the app's Recipe model
   */
  convertScrapedToRecipe(scrapedRecipe: ScrapedRecipe): any {
    return {
      uuid: scrapedRecipe.id || this.generateId(),
      name: scrapedRecipe.name,
      description: scrapedRecipe.description || '',
      imageURI: scrapedRecipe.image?.[0] || null,
      ingredients: this.convertIngredients(scrapedRecipe.recipeIngredient || []),
      instructions: scrapedRecipe.recipeInstructions || [],
      sourceUrl: scrapedRecipe.sourceUrl,
      category: this.determineCategory(scrapedRecipe),
      tags: scrapedRecipe.tags || [],
      nutrition: scrapedRecipe.nutrition,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Convert ingredient strings to Ingredient objects
   */
  private convertIngredients(ingredientStrings: string[]): any[] {
    if (!ingredientStrings || !Array.isArray(ingredientStrings)) {
      return [];
    }
    return ingredientStrings.map(ingredient => ({
      item: {
        name: ingredient,
        itemColor: this.getRandomColor(),
        category: 'food'
      },
      amount: 1,
      unit: 'piece'
    }));
  }

  /**
   * Determine recipe category based on scraped data
   */
  private determineCategory(scrapedRecipe: ScrapedRecipe): string {
    const name = scrapedRecipe.name?.toLowerCase() || '';
    const tags = scrapedRecipe.tags?.map(tag => tag.toLowerCase()) || [];
    const categories = scrapedRecipe.categories?.map(cat => cat.toLowerCase()) || [];

    // Check for dessert indicators
    if (name.includes('cake') || name.includes('cookie') || name.includes('dessert') || 
        tags.some(tag => tag.includes('dessert')) || categories.some(cat => cat.includes('dessert'))) {
      return 'desserts';
    }

    // Check for drink indicators
    if (name.includes('drink') || name.includes('cocktail') || name.includes('smoothie') ||
        tags.some(tag => tag.includes('drink')) || categories.some(cat => cat.includes('drink'))) {
      return 'drinks';
    }

    // Check for household utilities
    if (name.includes('cleaner') || name.includes('soap') || name.includes('detergent') ||
        tags.some(tag => tag.includes('household')) || categories.some(cat => cat.includes('household'))) {
      return 'householdUtilities';
    }

    // Default to food
    return 'food';
  }

  /**
   * Generate a random color for ingredients
   */
  private getRandomColor(): string {
    const colors = ['--ion-color-primary', '--ion-color-secondary', '--ion-color-tertiary', 
                   '--ion-color-success', '--ion-color-warning', '--ion-color-danger'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Validate URL format
   */
  validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
