import { TestBed } from '@angular/core/testing';
import { StandaloneRecipeScrapingService } from './standalone-recipe-scraping.service';
import { ScrapedRecipe, RecipeScrapingResult } from '../models/scraped-recipe';

describe('StandaloneRecipeScrapingService', () => {
  let service: StandaloneRecipeScrapingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StandaloneRecipeScrapingService]
    });
    service = TestBed.inject(StandaloneRecipeScrapingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      const validUrls = [
        'https://www.k-ruoka.fi/reseptit/lime-kookoskana',
        'https://www.valio.fi/reseptit/imanin-ja-leenan-philly-cheesesteak/',
        'https://www.kotikokki.net/reseptit/nayta/377680/',
        'http://example.com/recipe',
        'https://subdomain.example.com/path/to/recipe'
      ];

      validUrls.forEach(url => {
        expect(service.validateUrl(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://invalid-protocol.com',
        'https://',
        'http://',
        '',
        '   ',
        null as any,
        undefined as any,
        'file://local-file',
        'data:text/html,<html></html>'
      ];

      invalidUrls.forEach(url => {
        expect(service.validateUrl(url)).toBe(false);
      });
    });
  });

  describe('convertScrapedToRecipe', () => {
    it('should convert scraped recipe to app recipe format', () => {
      const scrapedRecipe: ScrapedRecipe = {
        name: 'Test Recipe',
        description: 'A test recipe',
        image: ['https://example.com/image.jpg'],
        recipeIngredient: ['2 cups flour', '1 cup sugar'],
        recipeInstructions: ['Mix ingredients', 'Bake at 350F'],
        sourceUrl: 'https://example.com/recipe',
        tags: ['dessert', 'sweet'],
        nutrition: { calories: '200 kcal' }
      };

      const result = service.convertScrapedToRecipe(scrapedRecipe);

      expect(result).toEqual({
        uuid: expect.any(String),
        name: 'Test Recipe',
        description: 'A test recipe',
        imageURI: 'https://example.com/image.jpg',
        ingredients: [
          {
            item: {
              name: '2 cups flour',
              itemColor: expect.any(String),
              category: 'food'
            },
            amount: 1,
            unit: 'piece'
          },
          {
            item: {
              name: '1 cup sugar',
              itemColor: expect.any(String),
              category: 'food'
            },
            amount: 1,
            unit: 'piece'
          }
        ],
        instructions: ['Mix ingredients', 'Bake at 350F'],
        sourceUrl: 'https://example.com/recipe',
        category: 'desserts',
        tags: ['dessert', 'sweet'],
        nutrition: { calories: '200 kcal' },
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });

    it('should handle missing optional fields', () => {
      const scrapedRecipe: ScrapedRecipe = {
        name: 'Minimal Recipe',
        recipeIngredient: ['1 ingredient'],
        recipeInstructions: ['1 step']
      };

      const result = service.convertScrapedToRecipe(scrapedRecipe);

      expect(result).toEqual({
        uuid: expect.any(String),
        name: 'Minimal Recipe',
        description: '',
        imageURI: null,
        ingredients: [
          {
            item: {
              name: '1 ingredient',
              itemColor: expect.any(String),
              category: 'food'
            },
            amount: 1,
            unit: 'piece'
          }
        ],
        instructions: ['1 step'],
        sourceUrl: undefined,
        category: 'food',
        tags: [],
        nutrition: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });

    it('should categorize recipes correctly', () => {
      const testCases = [
        {
          recipe: { name: 'Chocolate Cake', recipeIngredient: ['flour'], recipeInstructions: ['bake'] },
          expectedCategory: 'desserts'
        },
        {
          recipe: { name: 'Smoothie Drink', recipeIngredient: ['fruit'], recipeInstructions: ['blend'] },
          expectedCategory: 'drinks'
        },
        {
          recipe: { name: 'Homemade Soap', recipeIngredient: ['oil'], recipeInstructions: ['mix'] },
          expectedCategory: 'householdUtilities'
        },
        {
          recipe: { name: 'Chicken Soup', recipeIngredient: ['chicken'], recipeInstructions: ['cook'] },
          expectedCategory: 'food'
        }
      ];

      testCases.forEach(({ recipe, expectedCategory }) => {
        const result = service.convertScrapedToRecipe(recipe as ScrapedRecipe);
        expect(result.category).toBe(expectedCategory);
      });
    });
  });

  describe('scrapeRecipeFromUrl', () => {
    it('should return error for invalid URL', (done) => {
      service.scrapeRecipeFromUrl('invalid-url').subscribe({
        next: (result) => {
          expect(result.status).toBe('error');
          expect(result.error).toBe('Invalid URL format');
          done();
        },
        error: done
      });
    });

    it('should handle CORS proxy failures gracefully', (done) => {
      // Mock fetch to simulate CORS proxy failure
      const originalFetch = window.fetch;
      window.fetch = jest.fn().mockRejectedValue(new Error('CORS proxy failed'));

      service.scrapeRecipeFromUrl('https://example.com/recipe').subscribe({
        next: (result) => {
          expect(result.status).toBe('error');
          expect(result.error).toContain('Failed to scrape recipe');
          window.fetch = originalFetch; // Restore original fetch
          done();
        },
        error: (error) => {
          window.fetch = originalFetch; // Restore original fetch
          done(error);
        }
      });
    });

    it('should handle successful recipe extraction', (done) => {
      // Mock successful HTML response with JSON-LD
      const mockHtml = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "Recipe",
                "name": "Test Recipe",
                "recipeIngredient": ["2 cups flour", "1 cup sugar"],
                "recipeInstructions": ["Mix ingredients", "Bake"]
              }
            </script>
          </head>
          <body>
            <h1>Test Recipe</h1>
          </body>
        </html>
      `;

      const originalFetch = window.fetch;
      window.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml)
      } as Response);

      service.scrapeRecipeFromUrl('https://example.com/recipe').subscribe({
        next: (result) => {
          expect(result.status).toBe('ok');
          expect(result.recipe?.name).toBe('Test Recipe');
          expect(result.recipe?.recipeIngredient).toEqual(['2 cups flour', '1 cup sugar']);
          expect(result.extractionMethod).toContain('jsonld');
          done();
        },
        error: done
      });

      window.fetch = originalFetch;
    });

    it('should handle site-specific extraction for K-Ruoka', (done) => {
      const mockHtml = `
        <html>
          <body>
            <h1>K-Ruoka Recipe</h1>
            <div class="ingredient">2 cups flour</div>
            <div class="ingredient">1 cup sugar</div>
            <div class="instruction">Mix ingredients</div>
            <div class="instruction">Bake at 350F</div>
          </body>
        </html>
      `;

      const originalFetch = window.fetch;
      window.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml)
      } as Response);

      service.scrapeRecipeFromUrl('https://www.k-ruoka.fi/reseptit/test').subscribe({
        next: (result) => {
          expect(result.status).toBe('ok');
          expect(result.recipe?.name).toBe('K-Ruoka Recipe');
          expect(result.recipe?.recipeIngredient).toEqual(['2 cups flour', '1 cup sugar']);
          expect(result.extractionMethod).toContain('site-specific');
          done();
        },
        error: done
      });

      window.fetch = originalFetch;
    });

    it('should handle site-specific extraction for Kotikokki', (done) => {
      const mockHtml = `
        <html>
          <body>
            <h1>Kotikokki Recipe</h1>
            <table>
              <tr><td>2 cups</td><td>flour</td></tr>
              <tr><td>1 cup</td><td>sugar</td></tr>
            </table>
            <p>Mix all ingredients together in a bowl.</p>
            <p>Bake in the oven at 350 degrees.</p>
          </body>
        </html>
      `;

      const originalFetch = window.fetch;
      window.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml)
      } as Response);

      service.scrapeRecipeFromUrl('https://www.kotikokki.net/reseptit/test').subscribe({
        next: (result) => {
          expect(result.status).toBe('ok');
          expect(result.recipe?.name).toBe('Kotikokki Recipe');
          expect(result.recipe?.recipeIngredient).toEqual(['2 cups flour', '1 cup sugar']);
          expect(result.extractionMethod).toContain('site-specific');
          done();
        },
        error: done
      });

      window.fetch = originalFetch;
    });

    it('should handle no recipe found scenario', (done) => {
      const mockHtml = `
        <html>
          <body>
            <h1>Not a Recipe Page</h1>
            <p>This is just a regular page with no recipe data.</p>
          </body>
        </html>
      `;

      const originalFetch = window.fetch;
      window.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml)
      } as Response);

      service.scrapeRecipeFromUrl('https://example.com/not-a-recipe').subscribe({
        next: (result) => {
          expect(result.status).toBe('not_found');
          expect(result.error).toBe('No recipe data found');
          expect(result.recipe).toBeNull();
          done();
        },
        error: done
      });

      window.fetch = originalFetch;
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', (done) => {
      const originalFetch = window.fetch;
      window.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      service.scrapeRecipeFromUrl('https://example.com/recipe').subscribe({
        next: (result) => {
          expect(result.status).toBe('error');
          expect(result.error).toContain('Failed to scrape recipe');
          window.fetch = originalFetch; // Restore original fetch
          done();
        },
        error: (error) => {
          window.fetch = originalFetch; // Restore original fetch
          done(error);
        }
      });
    });

    it('should handle malformed JSON-LD gracefully', (done) => {
      const mockHtml = `
        <html>
          <head>
            <script type="application/ld+json">
              { invalid json }
            </script>
          </head>
          <body>
            <h1>Recipe with Bad JSON-LD</h1>
          </body>
        </html>
      `;

      const originalFetch = window.fetch;
      window.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml)
      } as Response);

      service.scrapeRecipeFromUrl('https://example.com/recipe').subscribe({
        next: (result) => {
          // Should fall back to site-specific extraction or return not_found
          expect(['ok', 'not_found']).toContain(result.status);
          done();
        },
        error: done
      });

      window.fetch = originalFetch;
    });
  });

  describe('integration tests', () => {
    it('should work with real recipe URLs (if network available)', (done) => {
      // This test will only run if we have network access
      // In a real environment, you might want to mock this or make it conditional
      const testUrl = 'https://www.k-ruoka.fi/reseptit/lime-kookoskana';
      
      // Skip this test if we're in a test environment without network
      if (process.env.NODE_ENV === 'test') {
        done();
        return;
      }

      service.scrapeRecipeFromUrl(testUrl).subscribe({
        next: (result) => {
          expect(['ok', 'error', 'not_found']).toContain(result.status);
          if (result.status === 'ok') {
            expect(result.recipe).toBeTruthy();
            expect(result.recipe?.name).toBeTruthy();
            expect(result.recipe?.recipeIngredient).toBeTruthy();
            expect(result.recipe?.recipeInstructions).toBeTruthy();
          }
          done();
        },
        error: done
      });
    });
  });
});
