import { Injectable } from '@angular/core';
import { Observable, from, throwError, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { ScrapedRecipe, RecipeScrapingResult } from '../models/scraped-recipe';

@Injectable({
  providedIn: 'root'
})
export class StandaloneRecipeScrapingService {
  // Updated list of working CORS proxies
  private readonly CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://cors-anywhere.herokuapp.com/',
    'https://thingproxy.freeboard.io/fetch/',
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://cors.bridged.cc/',
    'https://cors-anywhere.herokuapp.com/'
  ];

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
      timeout(45000), // 45 second timeout
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
   * Main recipe extraction method with improved error handling
   */
  private async extractRecipe(url: string): Promise<{ recipe: ScrapedRecipe; extractionMethod: string; debug: any } | null> {
    const debug: any = { url, attempts: [] };

    try {
      // Method 1: Try working CORS proxies
      const proxyResult = await this.extractWithCorsProxies(url, debug);
      if (proxyResult) {
        return proxyResult;
      }

      // Method 2: Try direct fetch (works for same-origin or CORS-allowed sites)
      const directResult = await this.extractWithDirectFetch(url, debug);
      if (directResult) {
        return directResult;
      }

      // Method 3: Try with no-cors mode (limited but might work)
      const noCorsResult = await this.extractWithNoCors(url, debug);
      if (noCorsResult) {
        return noCorsResult;
      }

      // Method 4: Try with different user agents
      const userAgentResult = await this.extractWithUserAgents(url, debug);
      if (userAgentResult) {
        return userAgentResult;
      }

      // If all methods fail, provide detailed error information
      debug.finalError = 'All extraction methods failed';
      console.warn('Recipe extraction failed for URL:', url, debug);
      return null;

    } catch (error) {
      debug.error = error instanceof Error ? error.stack || error.message : String(error);
      throw error;
    }
  }

  /**
   * Extract recipe using multiple CORS proxies with better error handling
   */
  private async extractWithCorsProxies(url: string, debug: any): Promise<{ recipe: ScrapedRecipe; extractionMethod: string; debug: any } | null> {
    for (let i = 0; i < this.CORS_PROXIES.length; i++) {
      const proxy = this.CORS_PROXIES[i];
      const attempt = { proxy, success: false, error: null, status: null };
      
      try {
        const proxyUrl = proxy === 'https://corsproxy.io/?' ? 
          `${proxy}${encodeURIComponent(url)}` : 
          `${proxy}${url}`;

        debug.attempts.push(attempt);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout per proxy

        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        attempt.status = response.status;

        if (!response.ok) {
          attempt.error = `HTTP ${response.status}`;
          continue;
        }

        const html = await response.text();
        attempt.success = true;
        debug.lastSuccessfulProxy = proxy;

        // Try JSON-LD extraction first
        const recipeJson = this.extractRecipeJsonLd(html);
        if (recipeJson) {
          const normalized = this.normalizeRecipeData(recipeJson, url);
          return {
            recipe: normalized,
            extractionMethod: `cors-proxy-jsonld-${i}`,
            debug
          };
        }

        // Try site-specific extraction
        const siteSpecific = this.extractSiteSpecificRecipe(html, url);
        if (siteSpecific) {
          return {
            recipe: siteSpecific,
            extractionMethod: `cors-proxy-site-specific-${i}`,
            debug
          };
        }

      } catch (error) {
        attempt.error = error instanceof Error ? error.message : String(error);
        debug.attempts.push(attempt);
        continue;
      }
    }

    return null;
  }

  /**
   * Extract recipe using direct fetch with improved headers
   */
  private async extractWithDirectFetch(url: string, debug: any): Promise<{ recipe: ScrapedRecipe; extractionMethod: string; debug: any } | null> {
    const attempt = { method: 'direct-fetch', success: false, error: null, status: null };
    
    try {
      debug.attempts.push(attempt);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      attempt.status = response.status;

      if (!response.ok) {
        attempt.error = `HTTP ${response.status}`;
        return null;
      }

      const html = await response.text();
      attempt.success = true;

      // Try JSON-LD extraction
      const recipeJson = this.extractRecipeJsonLd(html);
      if (recipeJson) {
        const normalized = this.normalizeRecipeData(recipeJson, url);
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
      attempt.error = error instanceof Error ? error.message : String(error);
      debug.attempts.push(attempt);
      return null;
    }
  }

  /**
   * Extract recipe using no-cors mode (limited but might work for some sites)
   */
  private async extractWithNoCors(url: string, debug: any): Promise<{ recipe: ScrapedRecipe; extractionMethod: string; debug: any } | null> {
    const attempt = { method: 'no-cors', success: false, error: null };
    
    try {
      debug.attempts.push(attempt);

      const response = await fetch(url, {
        method: 'GET',
        mode: 'no-cors',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      // Note: no-cors mode severely limits what we can access
      // This is mostly a fallback for very basic cases
      attempt.success = true;
      
      // Unfortunately, with no-cors we can't read the response body
      // This method is included for completeness but won't work for recipe extraction
      return null;

    } catch (error) {
      attempt.error = error instanceof Error ? error.message : String(error);
      debug.attempts.push(attempt);
      return null;
    }
  }

  /**
   * Extract recipe using different user agents
   */
  private async extractWithUserAgents(url: string, debug: any): Promise<{ recipe: ScrapedRecipe; extractionMethod: string; debug: any } | null> {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    ];

    for (let i = 0; i < userAgents.length; i++) {
      const userAgent = userAgents[i];
      const attempt = { method: `user-agent-${i}`, userAgent, success: false, error: null };
      
      try {
        debug.attempts.push(attempt);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          attempt.error = `HTTP ${response.status}`;
          continue;
        }

        const html = await response.text();
        attempt.success = true;

        // Try JSON-LD extraction
        const recipeJson = this.extractRecipeJsonLd(html);
        if (recipeJson) {
          const normalized = this.normalizeRecipeData(recipeJson, url);
          return {
            recipe: normalized,
            extractionMethod: `user-agent-jsonld-${i}`,
            debug
          };
        }

        // Try site-specific extraction
        const siteSpecific = this.extractSiteSpecificRecipe(html, url);
        if (siteSpecific) {
          return {
            recipe: siteSpecific,
            extractionMethod: `user-agent-site-specific-${i}`,
            debug
          };
        }

      } catch (error) {
        attempt.error = error instanceof Error ? error.message : String(error);
        debug.attempts.push(attempt);
        continue;
      }
    }

    return null;
  }

  /**
   * Extract recipe JSON-LD from HTML with improved parsing
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
            // Also check for nested recipes
            if (obj && obj['@graph']) {
              for (const graphItem of obj['@graph']) {
                if (graphItem && graphItem['@type'] === 'Recipe') {
                  return graphItem;
                }
              }
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
   * Extract recipe using site-specific parsing with improved selectors
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

      // Generic recipe extraction with improved selectors
      return this.extractGenericRecipe(doc, url);
    } catch (error) {
      console.error('Error in site-specific extraction:', error);
      return null;
    }
  }

  /**
   * Extract recipe from K-Ruoka with improved selectors
   */
  private extractKRuokaRecipe(doc: Document, url: string): ScrapedRecipe | null {
    try {
      // Look for recipe title with multiple selectors
      const titleSelectors = [
        'h1',
        '.recipe-title',
        '.title',
        '[data-testid="recipe-title"]',
        '.recipe-header h1',
        '.recipe-name'
      ];
      
      let name = '';
      for (const selector of titleSelectors) {
        const element = doc.querySelector(selector);
        if (element?.textContent?.trim()) {
          name = element.textContent.trim();
          break;
        }
      }

      // Look for ingredients with improved selectors
      const ingredientSelectors = [
        '.ingredient',
        '.recipe-ingredient',
        '[data-ingredient]',
        '.ingredients-list li',
        '.recipe-ingredients li',
        '[itemprop="recipeIngredient"]'
      ];
      
      const recipeIngredient: string[] = [];
      
      for (const selector of ingredientSelectors) {
        const elements = doc.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach(el => {
            const text = el.textContent?.trim();
            if (text && text.length > 2) {
              recipeIngredient.push(text);
            }
          });
          break;
        }
      }

      // Look for instructions with improved selectors
      const instructionSelectors = [
        '.instruction',
        '.recipe-instruction',
        '.step',
        '.instructions li',
        '.recipe-steps li',
        '[itemprop="recipeInstructions"]',
        '.recipe-directions li'
      ];
      
      const recipeInstructions: string[] = [];
      
      for (const selector of instructionSelectors) {
        const elements = doc.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach(el => {
            const text = el.textContent?.trim();
            if (text && text.length > 10) {
              recipeInstructions.push(text);
            }
          });
          break;
        }
      }

      // Look for description
      const descriptionSelectors = [
        '.description',
        '.recipe-description',
        '.summary',
        '.recipe-summary',
        '[itemprop="description"]'
      ];
      
      let description = '';
      for (const selector of descriptionSelectors) {
        const element = doc.querySelector(selector);
        if (element?.textContent?.trim()) {
          description = element.textContent.trim();
          break;
        }
      }

      // Look for image
      const imageSelectors = [
        '.recipe-image img',
        '.main-image img',
        '.recipe-photo img',
        '[itemprop="image"] img',
        '.hero-image img'
      ];
      
      let image = '';
      for (const selector of imageSelectors) {
        const element = doc.querySelector(selector) as HTMLImageElement;
        if (element?.src) {
          image = element.src;
          break;
        }
      }

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
   * Extract recipe from Kotikokki.net with improved selectors
   */
  private extractKotikokkiRecipe(doc: Document, url: string): ScrapedRecipe | null {
    try {
      // Look for recipe title
      const titleSelectors = ['h1', '.recipe-title', '.title'];
      let name = '';
      
      for (const selector of titleSelectors) {
        const element = doc.querySelector(selector);
        if (element?.textContent?.trim()) {
          name = element.textContent.trim();
          break;
        }
      }

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

      // If no table ingredients found, try other selectors
      if (recipeIngredient.length === 0) {
        const ingredientSelectors = [
          '.ingredients li',
          '.recipe-ingredients li',
          '[itemprop="recipeIngredient"]'
        ];
        
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
      }

      // Look for instructions
      const instructionSelectors = [
        '.instructions li',
        '.recipe-steps li',
        '.directions li',
        '[itemprop="recipeInstructions"]',
        '.recipe-directions p'
      ];
      
      const recipeInstructions: string[] = [];
      
      for (const selector of instructionSelectors) {
        const elements = doc.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach(el => {
            const text = el.textContent?.trim();
            if (text && text.length > 10) {
              recipeInstructions.push(text);
            }
          });
          break;
        }
      }

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
   * Generic recipe extraction with comprehensive selectors
   */
  private extractGenericRecipe(doc: Document, url: string): ScrapedRecipe | null {
    try {
      // Look for recipe title with comprehensive selectors
      const titleSelectors = [
        'h1',
        '.recipe-title',
        '.title',
        '[itemprop="name"]',
        '.recipe-name',
        '.recipe-header h1',
        '.recipe-heading h1',
        'h1[itemprop="name"]'
      ];
      
      let name = '';
      for (const selector of titleSelectors) {
        const element = doc.querySelector(selector);
        if (element?.textContent?.trim()) {
          name = element.textContent.trim();
          break;
        }
      }

      // Look for ingredients with comprehensive selectors
      const ingredientSelectors = [
        '[itemprop="recipeIngredient"]',
        '.ingredient',
        '.recipe-ingredient',
        '.ingredients-list li',
        '.recipe-ingredients li',
        '.ingredients li',
        '.recipe-ingredient-list li',
        '.ingredient-item',
        '.recipe-ingredient-item'
      ];
      
      const recipeIngredient: string[] = [];
      
      for (const selector of ingredientSelectors) {
        const elements = doc.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach(el => {
            const text = el.textContent?.trim();
            if (text && text.length > 2) {
              recipeIngredient.push(text);
            }
          });
          break;
        }
      }

      // Look for instructions with comprehensive selectors
      const instructionSelectors = [
        '[itemprop="recipeInstructions"]',
        '.instruction',
        '.recipe-instruction',
        '.step',
        '.instructions li',
        '.recipe-steps li',
        '.recipe-instructions li',
        '.directions li',
        '.recipe-directions li',
        '.method li',
        '.recipe-method li'
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
      const descriptionSelectors = [
        '[itemprop="description"]',
        '.description',
        '.recipe-description',
        '.summary',
        '.recipe-summary',
        '.recipe-intro',
        '.recipe-overview'
      ];
      
      let description = '';
      for (const selector of descriptionSelectors) {
        const element = doc.querySelector(selector);
        if (element?.textContent?.trim()) {
          description = element.textContent.trim();
          break;
        }
      }

      // Look for image
      const imageSelectors = [
        '[itemprop="image"] img',
        '.recipe-image img',
        '.main-image img',
        '.recipe-photo img',
        '.hero-image img',
        '.recipe-hero img',
        '.recipe-main-image img'
      ];
      
      let image = '';
      for (const selector of imageSelectors) {
        const element = doc.querySelector(selector) as HTMLImageElement;
        if (element?.src) {
          image = element.src;
          break;
        }
      }

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
   * Extract text content from instruction objects (handles both strings and complex objects)
   */
  private extractInstructionText(instructions: any): string[] {
    if (!instructions) return [];
    
    if (Array.isArray(instructions)) {
      return instructions.map(instruction => this.extractSingleInstructionText(instruction));
    }
    
    return [this.extractSingleInstructionText(instructions)];
  }

  /**
   * Extract text from a single instruction (handles various formats)
   */
  private extractSingleInstructionText(instruction: any): string {
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
      
      // If it's an object with @type, try to extract meaningful content
      if (instruction['@type'] === 'HowToStep' || instruction['@type'] === 'CreativeWork') {
        const text = instruction.text || instruction.name || instruction.description;
        if (text) return text.trim();
      }
    }
    
    // Fallback: convert to string
    return String(instruction).trim();
  }

  /**
   * Normalize recipe data from various sources
   */
  private normalizeRecipeData(raw: any, url: string): ScrapedRecipe {
    return {
      name: raw.name || raw.title || 'Untitled Recipe',
      image: Array.isArray(raw.image) ? raw.image : (raw.image ? [raw.image] : []),
      description: raw.description || '',
      recipeYield: raw.yield || raw.recipeYield || '',
      recipeIngredient: Array.isArray(raw.recipeIngredient) ? raw.recipeIngredient : 
                       Array.isArray(raw.ingredients) ? raw.ingredients : [],
      recipeInstructions: this.extractInstructionText(raw.recipeInstructions || raw.instructions),
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
      recipeInstructions: scrapedRecipe.recipeInstructions || [],
      recipeIngredient: scrapedRecipe.recipeIngredient || [],
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

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyError(error: any): string {
    if (error.message && error.message.includes('Failed to fetch')) {
      return 'Failed to connect to the website. The site might be down or blocking access.';
    }
    if (error.message && error.message.includes('Invalid or blocked response')) {
      return 'The website returned an invalid or blocked response. This might indicate a temporary issue or that the site does not support recipe scraping.';
    }
    if (error.message && error.message.includes('Access denied') || error.message.includes('Forbidden')) {
      return 'Access to the website was denied. This could be due to incorrect proxy settings or the site blocking access.';
    }
    if (error.message && error.message.includes('Invalid URL format')) {
      return 'The provided URL is not in a valid format. Please check the URL and try again.';
    }
    if (error.message && error.message.includes('timeout')) {
      return 'The request timed out. The website might be slow or temporarily unavailable.';
    }
    if (error.message && error.message.includes('CORS')) {
      return 'The website does not allow cross-origin requests. This is a common security restriction.';
    }
    if (error.message && error.message.includes('ERR_CERT_DATE_INVALID')) {
      return 'The website has certificate issues. This might be a temporary problem.';
    }
    return 'An unexpected error occurred during recipe scraping. Please try again later.';
  }

  /**
   * Get alternative solutions for failed recipe scraping
   */
  getAlternativeSolutions(url: string): string[] {
    const solutions = [
      'Try copying and pasting the recipe ingredients manually',
      'Check if the website has a mobile version that might work better',
      'Try using a different browser or device',
      'Contact the website owner to request API access',
      'Use a recipe from a different source that supports scraping'
    ];

    // Add site-specific suggestions
    if (url.includes('k-ruoka.fi')) {
      solutions.unshift('K-Ruoka.fi may require authentication or have changed their website structure');
      solutions.unshift('Try accessing the recipe while logged into K-Ruoka.fi');
    }

    if (url.includes('kotikokki.net')) {
      solutions.unshift('Kotikokki.net may have updated their website security');
      solutions.unshift('Try using the recipe search function instead of direct URL');
    }

    return solutions;
  }

  /**
   * Check if a proxy is working by testing it with a simple request
   */
  private async testProxy(proxy: string): Promise<boolean> {
    try {
      const testUrl = 'https://httpbin.org/get';
      const proxyUrl = proxy === 'https://corsproxy.io/?' ? 
        `${proxy}${encodeURIComponent(testUrl)}` : 
        `${proxy}${testUrl}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(proxyUrl, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get working proxies by testing them
   */
  private async getWorkingProxies(): Promise<string[]> {
    const workingProxies: string[] = [];
    
    for (const proxy of this.CORS_PROXIES) {
      const isWorking = await this.testProxy(proxy);
      if (isWorking) {
        workingProxies.push(proxy);
      }
    }
    
    return workingProxies.length > 0 ? workingProxies : this.CORS_PROXIES;
  }

  /**
   * Provide detailed error information for debugging
   */
  getDetailedErrorInfo(debug: any): string {
    if (!debug || !debug.attempts) {
      return 'No detailed error information available.';
    }

    const failedAttempts = debug.attempts.filter((attempt: any) => !attempt.success);
    if (failedAttempts.length === 0) {
      return 'All attempts were successful but no recipe data was found.';
    }

    const errorSummary = failedAttempts.map((attempt: any) => {
      const method = attempt.proxy ? `Proxy: ${attempt.proxy}` : 
                    attempt.method ? `Method: ${attempt.method}` : 'Unknown method';
      const error = attempt.error || 'Unknown error';
      const status = attempt.status ? ` (Status: ${attempt.status})` : '';
      return `${method} - ${error}${status}`;
    }).join('\n');

    return `Failed attempts:\n${errorSummary}`;
  }
}
