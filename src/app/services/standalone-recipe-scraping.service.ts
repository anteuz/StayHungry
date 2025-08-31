import { Injectable } from '@angular/core';
import { Observable, from, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ScrapedRecipe, RecipeScrapingResult } from '../models/scraped-recipe';

@Injectable({
  providedIn: 'root'
})
export class StandaloneRecipeScrapingService {
  private readonly CORS_PROXY = 'https://api.allorigins.win/raw?url=';

  constructor() {}

  /**
   * Scrape recipe from a URL using standalone methods
   */
  scrapeRecipeFromUrl(url: string): Observable<RecipeScrapingResult> {
    // Validate URL first
    if (!this.validateUrl(url)) {
      return of({
        status: 'error' as const,
        error: 'Invalid URL format',
        extractionMethod: null,
        recipe: null,
        debug: { invalidUrl: url }
      });
    }

    return from(this.extractRecipe(url)).pipe(
      map(result => {
        if (result && result.recipe) {
          return {
            status: 'ok' as const,
            error: null,
            extractionMethod: result.extractionMethod,
            recipe: result.recipe,
            debug: result.debug
          };
        } else {
          return {
            status: 'not_found' as const,
            error: 'No recipe data found',
            extractionMethod: null,
            recipe: null,
            debug: result?.debug
          };
        }
      }),
      catchError(error => {
        console.error('Recipe scraping failed:', error);
        return of({
          status: 'error' as const,
          error: error.message || 'Failed to scrape recipe from URL',
          extractionMethod: null,
          recipe: null,
          debug: { error: error.stack }
        });
      })
    );
  }

  /**
   * Main recipe extraction method
   */
  private async extractRecipe(url: string): Promise<{ recipe: ScrapedRecipe; extractionMethod: string; debug: any } | null> {
    const debug: any = {};

    try {
      // Try using CORS proxy first
      const result = await this.extractWithCorsProxy(url, debug);
      if (result) {
        return result;
      }

      // Fallback: Try direct fetch if same-origin or if CORS allows
      const directResult = await this.extractWithDirectFetch(url, debug);
      if (directResult) {
        return directResult;
      }

      // Final fallback: Try with different CORS proxies
      const proxyResult = await this.extractWithAlternativeProxies(url, debug);
      if (proxyResult) {
        return proxyResult;
      }

      return null;
    } catch (error) {
      debug.error = error instanceof Error ? error.stack || error.message : String(error);
      // If any extraction method throws an error, we should throw it to trigger error handling
      throw error;
    }
  }

  /**
   * Extract recipe using CORS proxy
   */
  private async extractWithCorsProxy(url: string, debug: any): Promise<{ recipe: ScrapedRecipe; extractionMethod: string; debug: any } | null> {
    try {
      const proxyUrl = `${this.CORS_PROXY}${encodeURIComponent(url)}`;
      debug.corsProxyUrl = proxyUrl;

      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache'
        }
      });

      debug.corsProxyStatus = response.status;
      
      if (!response.ok) {
        throw new Error(`CORS proxy failed with status: ${response.status}`);
      }

      const html = await response.text();
      debug.corsProxyHtmlLength = html.length;

      // Try JSON-LD extraction
      const recipeJson = this.extractRecipeJsonLd(html);
      if (recipeJson) {
        const normalized = this.normalizeRecipe(recipeJson, url);
        return {
          recipe: normalized,
          extractionMethod: 'cors-proxy-jsonld',
          debug
        };
      }

      // Try site-specific extraction
      const siteSpecific = this.extractSiteSpecificRecipe(html, url);
      if (siteSpecific) {
        return {
          recipe: siteSpecific,
          extractionMethod: 'cors-proxy-site-specific',
          debug
        };
      }

      return null;
    } catch (error) {
      debug.corsProxyError = error instanceof Error ? error.stack || error.message : String(error);
      // Don't throw here, let the fallback methods try
      return null;
    }
  }

  /**
   * Extract recipe using direct fetch (works for same-origin or CORS-allowed sites)
   */
  private async extractWithDirectFetch(url: string, debug: any): Promise<{ recipe: ScrapedRecipe; extractionMethod: string; debug: any } | null> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });

      debug.directFetchStatus = response.status;
      
      if (!response.ok) {
        throw new Error(`Direct fetch failed with status: ${response.status}`);
      }

      const html = await response.text();
      debug.directFetchHtmlLength = html.length;

      // Try JSON-LD extraction
      const recipeJson = this.extractRecipeJsonLd(html);
      if (recipeJson) {
        const normalized = this.normalizeRecipe(recipeJson, url);
        return {
          recipe: normalized,
          extractionMethod: 'direct-fetch-jsonld',
          debug
        };
      }

      // Try site-specific extraction
      const siteSpecific = this.extractSiteSpecificRecipe(html, url);
      if (siteSpecific) {
        return {
          recipe: siteSpecific,
          extractionMethod: 'direct-fetch-site-specific',
          debug
        };
      }

      return null;
    } catch (error) {
      debug.directFetchError = error instanceof Error ? error.stack || error.message : String(error);
      // Don't throw here, let the fallback methods try
      return null;
    }
  }

  /**
   * Try alternative CORS proxies
   */
  private async extractWithAlternativeProxies(url: string, debug: any): Promise<{ recipe: ScrapedRecipe; extractionMethod: string; debug: any } | null> {
    const proxies = [
      `https://cors-anywhere.herokuapp.com/${url}`,
      `https://thingproxy.freeboard.io/fetch/${url}`,
      `https://api.codetabs.com/v1/proxy?quest=${url}`
    ];

    for (const proxyUrl of proxies) {
      try {
        debug.alternativeProxyUrl = proxyUrl;
        
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });

        if (response.ok) {
          const html = await response.text();
          debug.alternativeProxyHtmlLength = html.length;

          // Try JSON-LD extraction
          const recipeJson = this.extractRecipeJsonLd(html);
          if (recipeJson) {
            const normalized = this.normalizeRecipe(recipeJson, url);
            return {
              recipe: normalized,
              extractionMethod: 'alternative-proxy-jsonld',
              debug
            };
          }

          // Try site-specific extraction
          const siteSpecific = this.extractSiteSpecificRecipe(html, url);
          if (siteSpecific) {
            return {
              recipe: siteSpecific,
              extractionMethod: 'alternative-proxy-site-specific',
              debug
            };
          }
        }
      } catch (error) {
        debug.alternativeProxyError = error instanceof Error ? error.stack || error.message : String(error);
        continue;
      }
    }

    // If all proxies fail, throw an error to trigger error handling
    if (debug.corsProxyError || debug.directFetchError || debug.alternativeProxyError) {
      throw new Error('All extraction methods failed');
    }

    return null;
  }

  /**
   * Extract recipe JSON-LD from HTML
   */
  private extractRecipeJsonLd(html: string): any | null {
    try {
      // Create a temporary DOM element to parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Look for JSON-LD scripts
      const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
      
      for (const script of Array.from(scripts)) {
        try {
          const content = script.textContent;
          if (!content) continue;

          // Parse JSON-LD
          const jsonData = JSON.parse(content);
          
          // Handle arrays of JSON-LD objects
          const candidates = Array.isArray(jsonData) ? jsonData : [jsonData];
          
          for (const obj of candidates) {
            if (obj && obj['@type'] === 'Recipe') {
              return obj;
            }
          }
        } catch (parseError) {
          console.warn('Failed to parse JSON-LD script:', parseError);
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error('Error extracting JSON-LD:', error);
      return null;
    }
  }

  /**
   * Extract recipe using site-specific parsing
   */
  private extractSiteSpecificRecipe(html: string, url: string): ScrapedRecipe | null {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // K-Ruoka specific extraction
      if (url.includes('k-ruoka.fi')) {
        return this.extractKRuokaRecipe(doc, url);
      }

      // Kotikokki.net specific extraction
      if (url.includes('kotikokki.net')) {
        return this.extractKotikokkiRecipe(doc, url);
      }

      // Generic recipe extraction
      return this.extractGenericRecipe(doc, url);
    } catch (error) {
      console.error('Error in site-specific extraction:', error);
      return null;
    }
  }

  /**
   * Extract recipe from K-Ruoka
   */
  private extractKRuokaRecipe(doc: Document, url: string): ScrapedRecipe | null {
    try {
      // Look for recipe title
      const titleElement = doc.querySelector('h1, .recipe-title, .title');
      const name = titleElement?.textContent?.trim();

      // Look for ingredients
      const ingredientElements = doc.querySelectorAll('.ingredient, .recipe-ingredient, [data-ingredient]');
      const recipeIngredient: string[] = [];
      
      ingredientElements.forEach(el => {
        const text = el.textContent?.trim();
        if (text) {
          recipeIngredient.push(text);
        }
      });

      // Look for instructions
      const instructionElements = doc.querySelectorAll('.instruction, .recipe-instruction, .step');
      const recipeInstructions: string[] = [];
      
      instructionElements.forEach(el => {
        const text = el.textContent?.trim();
        if (text) {
          recipeInstructions.push(text);
        }
      });

      // Look for description
      const descriptionElement = doc.querySelector('.description, .recipe-description, .summary');
      const description = descriptionElement?.textContent?.trim();

      // Look for image
      const imageElement = doc.querySelector('.recipe-image img, .main-image img');
      const image = imageElement?.getAttribute('src');

      if (name && recipeIngredient.length > 0 && recipeInstructions.length > 0) {
        return {
          name,
          description,
          image: image ? [image] : undefined,
          recipeIngredient,
          recipeInstructions,
          sourceUrl: url
        };
      }

      return null;
    } catch (error) {
      console.error('Error extracting K-Ruoka recipe:', error);
      return null;
    }
  }

  /**
   * Extract recipe from Kotikokki.net
   */
  private extractKotikokkiRecipe(doc: Document, url: string): ScrapedRecipe | null {
    try {
      // Look for recipe title
      const titleElement = doc.querySelector('h1');
      const name = titleElement?.textContent?.trim();

      // Look for ingredients in table format
      const ingredientRows = doc.querySelectorAll('table tr');
      const recipeIngredient: string[] = [];
      
      ingredientRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 2) {
          const amount = cells[0]?.textContent?.trim();
          const ingredient = cells[1]?.textContent?.trim();
          if (ingredient) {
            recipeIngredient.push(amount ? `${amount} ${ingredient}` : ingredient);
          }
        }
      });

      // Look for instructions
      const instructionElements = doc.querySelectorAll('p, .instruction, .ohje');
      const recipeInstructions: string[] = [];
      
      instructionElements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 10) { // Filter out short text
          recipeInstructions.push(text);
        }
      });

      if (name && recipeIngredient.length > 0 && recipeInstructions.length > 0) {
        return {
          name,
          recipeIngredient,
          recipeInstructions,
          sourceUrl: url
        };
      }

      return null;
    } catch (error) {
      console.error('Error extracting Kotikokki recipe:', error);
      return null;
    }
  }

  /**
   * Generic recipe extraction
   */
  private extractGenericRecipe(doc: Document, url: string): ScrapedRecipe | null {
    try {
      // Look for recipe title
      const titleSelectors = ['h1', '.recipe-title', '.title', '[itemprop="name"]'];
      let name = '';
      
      for (const selector of titleSelectors) {
        const element = doc.querySelector(selector);
        if (element?.textContent?.trim()) {
          name = element.textContent.trim();
          break;
        }
      }

      // Look for ingredients
      const ingredientSelectors = [
        '[itemprop="recipeIngredient"]',
        '.ingredient',
        '.recipe-ingredient',
        'li:contains("ingredient")'
      ];
      
      const recipeIngredient: string[] = [];
      
      for (const selector of ingredientSelectors) {
        const elements = doc.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach(el => {
            const text = el.textContent?.trim();
            if (text) {
              recipeIngredient.push(text);
            }
          });
          break;
        }
      }

      // Look for instructions
      const instructionSelectors = [
        '[itemprop="recipeInstructions"]',
        '.instruction',
        '.recipe-instruction',
        '.step',
        'ol li',
        'ul li'
      ];
      
      const recipeInstructions: string[] = [];
      
      for (const selector of instructionSelectors) {
        const elements = doc.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach(el => {
            const text = el.textContent?.trim();
            if (text && text.length > 5) {
              recipeInstructions.push(text);
            }
          });
          break;
        }
      }

      // Look for description
      const descriptionElement = doc.querySelector('[itemprop="description"], .description, .summary');
      const description = descriptionElement?.textContent?.trim();

      // Look for image
      const imageElement = doc.querySelector('[itemprop="image"] img, .recipe-image img, .main-image img');
      const image = imageElement?.getAttribute('src');

      if (name && recipeIngredient.length > 0 && recipeInstructions.length > 0) {
        return {
          name,
          description,
          image: image ? [image] : undefined,
          recipeIngredient,
          recipeInstructions,
          sourceUrl: url
        };
      }

      return null;
    } catch (error) {
      console.error('Error in generic recipe extraction:', error);
      return null;
    }
  }

  /**
   * Normalize recipe data to consistent format
   */
  private normalizeRecipe(raw: any, url: string): ScrapedRecipe {
    return {
      name: raw.name || raw.title || 'Untitled Recipe',
      image: Array.isArray(raw.image) ? raw.image : (raw.image ? [raw.image] : []),
      description: raw.description || '',
      recipeYield: raw.yield || raw.recipeYield || '',
      recipeIngredient: Array.isArray(raw.recipeIngredient) ? raw.recipeIngredient : 
                       Array.isArray(raw.ingredients) ? raw.ingredients : [],
      recipeInstructions: Array.isArray(raw.recipeInstructions) ? raw.recipeInstructions :
                         Array.isArray(raw.instructions) ? raw.instructions : [],
      nutrition: raw.nutrition || null,
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      categories: Array.isArray(raw.categories) ? raw.categories : [],
      language: raw.language || 'en',
      sourceUrl: raw.sourceUrl || url
    };
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
      nutrition: scrapedRecipe.nutrition || null,
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
    if (!url || typeof url !== 'string') {
      return false;
    }
    
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
