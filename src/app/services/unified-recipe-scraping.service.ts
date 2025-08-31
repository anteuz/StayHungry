import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ScrapedRecipe, RecipeScrapingResult } from '../models/scraped-recipe';
import { StandaloneRecipeScrapingService } from './standalone-recipe-scraping.service';
import { RecipeScrapingConfigService } from './recipe-scraping-config.service';

@Injectable({
  providedIn: 'root'
})
export class UnifiedRecipeScrapingService {
  constructor(
    private http: HttpClient,
    private standaloneService: StandaloneRecipeScrapingService,
    private configService: RecipeScrapingConfigService
  ) {}

  /**
   * Scrape recipe from URL using the configured method
   */
  scrapeRecipeFromUrl(url: string): Observable<RecipeScrapingResult> {
    if (this.configService.isStandaloneMode()) {
      return this.scrapeWithStandalone(url);
    } else {
      return this.scrapeWithFirebase(url);
    }
  }

  /**
   * Scrape recipe using standalone service
   */
  private scrapeWithStandalone(url: string): Observable<RecipeScrapingResult> {
    return this.standaloneService.scrapeRecipeFromUrl(url).pipe(
      catchError(error => {
        console.error('Standalone scraping failed, trying Firebase fallback:', error);
        // Fallback to Firebase if standalone fails
        return this.scrapeWithFirebase(url);
      })
    );
  }

  /**
   * Scrape recipe using Firebase function
   */
  private scrapeWithFirebase(url: string): Observable<RecipeScrapingResult> {
    const firebaseUrl = this.configService.getFirebaseFunctionUrl();
    
    if (!firebaseUrl) {
      return throwError(() => new Error('Firebase function URL not configured'));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<RecipeScrapingResult>(firebaseUrl, { url }, { headers }).pipe(
      catchError(error => {
        console.error('Firebase scraping failed:', error);
        return throwError(() => new Error('Failed to scrape recipe from URL'));
      })
    );
  }

  /**
   * Convert scraped recipe to the app's Recipe model
   */
  convertScrapedToRecipe(scrapedRecipe: ScrapedRecipe): any {
    return this.standaloneService.convertScrapedToRecipe(scrapedRecipe);
  }

  /**
   * Validate URL format
   */
  validateUrl(url: string): boolean {
    return this.standaloneService.validateUrl(url);
  }

  /**
   * Test the current scraping configuration
   */
  testConfiguration(): Observable<{ success: boolean; message: string }> {
    return from(this.configService.testConfiguration());
  }

  /**
   * Get current configuration
   */
  getConfiguration() {
    return this.configService.getConfig();
  }

  /**
   * Update configuration
   */
  updateConfiguration(config: any): void {
    this.configService.updateConfig(config);
  }

  /**
   * Switch to standalone mode
   */
  enableStandaloneMode(): void {
    this.configService.enableStandaloneMode();
  }

  /**
   * Switch to Firebase function mode
   */
  enableFirebaseMode(): void {
    this.configService.enableFirebaseMode();
  }

  /**
   * Get available CORS proxies
   */
  getAvailableCorsProxies(): string[] {
    return this.configService.getAvailableCorsProxies();
  }

  /**
   * Reset configuration to defaults
   */
  resetConfiguration(): void {
    this.configService.resetConfig();
  }
}
