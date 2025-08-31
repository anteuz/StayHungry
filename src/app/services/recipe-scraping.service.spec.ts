import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RecipeScrapingService } from './recipe-scraping.service';
import { ScrapedRecipe, RecipeScrapingResult } from '../models/scraped-recipe';

describe('RecipeScrapingService', () => {
  let service: RecipeScrapingService;
  let httpMock: HttpTestingController;

  const mockScrapedRecipe: ScrapedRecipe = {
    name: 'Test Recipe',
    description: 'A test recipe',
    recipeIngredient: ['2 cups flour', '1 cup sugar'],
    recipeInstructions: ['Mix ingredients', 'Bake at 350F'],
    image: ['https://example.com/image.jpg'],
    sourceUrl: 'https://example.com/recipe'
  };

  const mockScrapingResult: RecipeScrapingResult = {
    status: 'ok',
    extractionMethod: 'static-html-jsonld',
    recipe: mockScrapedRecipe
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RecipeScrapingService]
    });
    service = TestBed.inject(RecipeScrapingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('scrapeRecipeFromUrl', () => {
    it('should make POST request to scrape recipe from URL', () => {
      const testUrl = 'https://example.com/recipe';
      
      service.scrapeRecipeFromUrl(testUrl).subscribe(result => {
        expect(result).toEqual(mockScrapingResult);
      });

      const req = httpMock.expectOne(`${service['API_BASE_URL']}/parseRecipe`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ url: testUrl });
      req.flush(mockScrapingResult);
    });

    it('should handle HTTP errors gracefully', () => {
      const testUrl = 'https://example.com/recipe';
      
      service.scrapeRecipeFromUrl(testUrl).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe('Failed to scrape recipe from URL');
        }
      });

      const req = httpMock.expectOne(`${service['API_BASE_URL']}/parseRecipe`);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('convertScrapedToRecipe', () => {
    it('should convert scraped recipe to app recipe format', () => {
      const result = service.convertScrapedToRecipe(mockScrapedRecipe);
      
      expect(result.name).toBe('Test Recipe');
      expect(result.description).toBe('A test recipe');
      expect(result.imageURI).toBe('https://example.com/image.jpg');
      expect(result.sourceUrl).toBe('https://example.com/recipe');
      expect(result.ingredients).toHaveLength(2);
      expect(result.instructions).toEqual(['Mix ingredients', 'Bake at 350F']);
      expect(result.uuid).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should handle missing optional fields', () => {
      const minimalRecipe: ScrapedRecipe = {
        name: 'Minimal Recipe',
        recipeIngredient: ['1 ingredient'],
        recipeInstructions: ['1 step']
      };

      const result = service.convertScrapedToRecipe(minimalRecipe);
      
      expect(result.name).toBe('Minimal Recipe');
      expect(result.description).toBe('');
      expect(result.imageURI).toBeNull();
      expect(result.sourceUrl).toBeUndefined();
      expect(result.category).toBe('food'); // Default category
    });

    it('should generate unique IDs for recipes without ID', () => {
      const recipe1 = service.convertScrapedToRecipe(mockScrapedRecipe);
      const recipe2 = service.convertScrapedToRecipe(mockScrapedRecipe);
      
      expect(recipe1.uuid).not.toBe(recipe2.uuid);
    });

    it('should use provided ID if available', () => {
      const recipeWithId = { ...mockScrapedRecipe, id: 'test-id-123' };
      const result = service.convertScrapedToRecipe(recipeWithId);
      
      expect(result.uuid).toBe('test-id-123');
    });
  });

  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      const validUrls = [
        'https://www.k-ruoka.fi/reseptit/test',
        'http://example.com/recipe',
        'https://valio.fi/reseptit/something',
        'https://kotikokki.net/reseptit/123'
      ];

      validUrls.forEach(url => {
        expect(service.validateUrl(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'just text',
        ''
      ];

      invalidUrls.forEach(url => {
        expect(service.validateUrl(url)).toBe(false);
      });
    });
  });

  describe('category determination', () => {
    it('should categorize desserts correctly', () => {
      const dessertRecipes = [
        { name: 'Chocolate Cake', recipeIngredient: ['flour'], recipeInstructions: ['bake'], tags: [], categories: [] },
        { name: 'Apple Pie', recipeIngredient: ['apples'], recipeInstructions: ['bake'], tags: ['dessert'], categories: [] },
        { name: 'Cookies', recipeIngredient: ['flour'], recipeInstructions: ['bake'], tags: [], categories: ['desserts'] }
      ];

      dessertRecipes.forEach(recipe => {
        const result = service.convertScrapedToRecipe(recipe as ScrapedRecipe);
        expect(result.category).toBe('desserts');
      });
    });

    it('should categorize drinks correctly', () => {
      const drinkRecipes = [
        { name: 'Smoothie Bowl', recipeIngredient: ['fruit'], recipeInstructions: ['blend'], tags: [], categories: [] },
        { name: 'Cocktail', recipeIngredient: ['alcohol'], recipeInstructions: ['mix'], tags: ['drink'], categories: [] },
        { name: 'Coffee Drink', recipeIngredient: ['coffee'], recipeInstructions: ['brew'], tags: [], categories: ['beverages'] }
      ];

      drinkRecipes.forEach(recipe => {
        const result = service.convertScrapedToRecipe(recipe as ScrapedRecipe);
        expect(result.category).toBe('drinks');
      });
    });

    it('should categorize household utilities correctly', () => {
      const householdRecipes = [
        { name: 'Homemade Soap', recipeIngredient: ['oil'], recipeInstructions: ['mix'], tags: [], categories: [] },
        { name: 'Cleaning Solution', recipeIngredient: ['vinegar'], recipeInstructions: ['mix'], tags: ['household'], categories: [] },
        { name: 'Detergent', recipeIngredient: ['soap'], recipeInstructions: ['mix'], tags: [], categories: ['cleaning'] }
      ];

      householdRecipes.forEach(recipe => {
        const result = service.convertScrapedToRecipe(recipe as ScrapedRecipe);
        expect(result.category).toBe('householdUtilities');
      });
    });

    it('should default to food category', () => {
      const foodRecipes = [
        { name: 'Pasta Carbonara', recipeIngredient: ['pasta'], recipeInstructions: ['cook'], tags: [], categories: [] },
        { name: 'Chicken Soup', recipeIngredient: ['chicken'], recipeInstructions: ['simmer'], tags: ['main'], categories: [] },
        { name: 'Salad', recipeIngredient: ['lettuce'], recipeInstructions: ['mix'], tags: [], categories: ['healthy'] }
      ];

      foodRecipes.forEach(recipe => {
        const result = service.convertScrapedToRecipe(recipe as ScrapedRecipe);
        expect(result.category).toBe('food');
      });
    });
  });

  describe('ingredient conversion', () => {
    it('should convert ingredient strings to ingredient objects', () => {
      const scrapedRecipe: ScrapedRecipe = {
        name: 'Test',
        recipeIngredient: ['2 cups flour', '1 cup sugar', '3 eggs'],
        recipeInstructions: ['Mix']
      };

      const result = service.convertScrapedToRecipe(scrapedRecipe);
      
      expect(result.ingredients).toHaveLength(3);
      result.ingredients.forEach(ingredient => {
        expect(ingredient.item).toBeDefined();
        expect(ingredient.item.name).toBeDefined();
        expect(ingredient.item.itemColor).toBeDefined();
        expect(ingredient.item.category).toBe('food');
        expect(ingredient.amount).toBe(1);
        expect(ingredient.unit).toBe('piece');
      });
    });

    it('should assign random colors to ingredients', () => {
      const scrapedRecipe: ScrapedRecipe = {
        name: 'Test',
        recipeIngredient: ['ingredient1', 'ingredient2', 'ingredient3'],
        recipeInstructions: ['Mix']
      };

      const result = service.convertScrapedToRecipe(scrapedRecipe);
      const colors = result.ingredients.map(ing => ing.item.itemColor);
      
      // Should have valid color values
      colors.forEach(color => {
        expect(color).toMatch(/^--ion-color-/);
      });
    });
  });
});
