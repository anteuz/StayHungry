import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UnifiedRecipeScrapingService } from './unified-recipe-scraping.service';
import { StandaloneRecipeScrapingService } from './standalone-recipe-scraping.service';
import { RecipeScrapingConfigService } from './recipe-scraping-config.service';
import { ScrapedRecipe, RecipeScrapingResult } from '../models/scraped-recipe';
import { of, throwError } from 'rxjs';

describe('UnifiedRecipeScrapingService', () => {
  let service: UnifiedRecipeScrapingService;
  let httpMock: HttpTestingController;
  let standaloneService: jest.Mocked<StandaloneRecipeScrapingService>;
  let configService: jest.Mocked<RecipeScrapingConfigService>;

  beforeEach(() => {
    const standaloneServiceMock = {
      scrapeRecipeFromUrl: jest.fn(),
      convertScrapedToRecipe: jest.fn(),
      validateUrl: jest.fn()
    };

    const configServiceMock = {
      isStandaloneMode: jest.fn(),
      getFirebaseFunctionUrl: jest.fn(),
      getConfig: jest.fn(),
      updateConfig: jest.fn(),
      enableStandaloneMode: jest.fn(),
      enableFirebaseMode: jest.fn(),
      getAvailableCorsProxies: jest.fn(),
      resetConfig: jest.fn(),
      testConfiguration: jest.fn()
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UnifiedRecipeScrapingService,
        { provide: StandaloneRecipeScrapingService, useValue: standaloneServiceMock },
        { provide: RecipeScrapingConfigService, useValue: configServiceMock }
      ]
    });

    service = TestBed.inject(UnifiedRecipeScrapingService);
    httpMock = TestBed.inject(HttpTestingController);
    standaloneService = TestBed.inject(StandaloneRecipeScrapingService) as jest.Mocked<StandaloneRecipeScrapingService>;
    configService = TestBed.inject(RecipeScrapingConfigService) as jest.Mocked<RecipeScrapingConfigService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('scrapeRecipeFromUrl', () => {
    it('should use standalone mode when configured', (done) => {
      const testUrl = 'https://example.com/recipe';
      const mockResult: RecipeScrapingResult = {
        status: 'ok',
        recipe: {
          name: 'Test Recipe',
          recipeIngredient: ['ingredient'],
          recipeInstructions: ['instruction']
        }
      };

      configService.isStandaloneMode.mockReturnValue(true);
      standaloneService.scrapeRecipeFromUrl.mockReturnValue(of(mockResult));

      service.scrapeRecipeFromUrl(testUrl).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResult);
          expect(standaloneService.scrapeRecipeFromUrl).toHaveBeenCalledWith(testUrl);
          done();
        },
        error: done
      });
    });

    it('should use Firebase mode when configured', (done) => {
      const testUrl = 'https://example.com/recipe';
      const mockResult: RecipeScrapingResult = {
        status: 'ok',
        recipe: {
          name: 'Test Recipe',
          recipeIngredient: ['ingredient'],
          recipeInstructions: ['instruction']
        }
      };

      configService.isStandaloneMode.mockReturnValue(false);
      configService.getFirebaseFunctionUrl.mockReturnValue('https://firebase-function.com/parseRecipe');

      service.scrapeRecipeFromUrl(testUrl).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResult);
          done();
        },
        error: done
      });

      const req = httpMock.expectOne('https://firebase-function.com/parseRecipe');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ url: testUrl });
      req.flush(mockResult);
    });

    it('should fallback to Firebase when standalone fails', (done) => {
      const testUrl = 'https://example.com/recipe';
      const mockResult: RecipeScrapingResult = {
        status: 'ok',
        recipe: {
          name: 'Test Recipe',
          recipeIngredient: ['ingredient'],
          recipeInstructions: ['instruction']
        }
      };

      configService.isStandaloneMode.mockReturnValue(true);
      configService.getFirebaseFunctionUrl.mockReturnValue('https://firebase-function.com/parseRecipe');
      standaloneService.scrapeRecipeFromUrl.mockReturnValue(throwError(() => new Error('Standalone failed')));

      service.scrapeRecipeFromUrl(testUrl).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResult);
          done();
        },
        error: done
      });

      const req = httpMock.expectOne('https://firebase-function.com/parseRecipe');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ url: testUrl });
      req.flush(mockResult);
    });

    it('should throw error when Firebase URL is not configured', (done) => {
      const testUrl = 'https://example.com/recipe';

      configService.isStandaloneMode.mockReturnValue(false);
      configService.getFirebaseFunctionUrl.mockReturnValue(undefined);

      service.scrapeRecipeFromUrl(testUrl).subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toBe('Firebase function URL not configured');
          done();
        }
      });
    });

    it('should handle Firebase function errors', (done) => {
      const testUrl = 'https://example.com/recipe';

      configService.isStandaloneMode.mockReturnValue(false);
      configService.getFirebaseFunctionUrl.mockReturnValue('https://firebase-function.com/parseRecipe');

      service.scrapeRecipeFromUrl(testUrl).subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toBe('Failed to scrape recipe from URL');
          done();
        }
      });

      const req = httpMock.expectOne('https://firebase-function.com/parseRecipe');
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('convertScrapedToRecipe', () => {
    it('should delegate to standalone service', () => {
      const scrapedRecipe: ScrapedRecipe = {
        name: 'Test Recipe',
        recipeIngredient: ['ingredient'],
        recipeInstructions: ['instruction']
      };

      const expectedResult = { uuid: '123', name: 'Test Recipe' };
      standaloneService.convertScrapedToRecipe.mockReturnValue(expectedResult);

      const result = service.convertScrapedToRecipe(scrapedRecipe);

      expect(result).toEqual(expectedResult);
      expect(standaloneService.convertScrapedToRecipe).toHaveBeenCalledWith(scrapedRecipe);
    });
  });

  describe('validateUrl', () => {
    it('should delegate to standalone service', () => {
      const testUrl = 'https://example.com/recipe';
      standaloneService.validateUrl.mockReturnValue(true);

      const result = service.validateUrl(testUrl);

      expect(result).toBe(true);
      expect(standaloneService.validateUrl).toHaveBeenCalledWith(testUrl);
    });
  });

  describe('configuration methods', () => {
    it('should delegate testConfiguration to config service', (done) => {
      const mockResult = { success: true, message: 'Test passed' };
      configService.testConfiguration.mockResolvedValue(mockResult);

      service.testConfiguration().subscribe({
        next: (result) => {
          expect(result).toEqual(mockResult);
          expect(configService.testConfiguration).toHaveBeenCalled();
          done();
        },
        error: done
      });
    });

    it('should delegate getConfiguration to config service', () => {
      const mockConfig = { useStandalone: true, timeoutMs: 30000, maxRetries: 3 };
      configService.getConfig.mockReturnValue(mockConfig);

      const result = service.getConfiguration();

      expect(result).toEqual(mockConfig);
      expect(configService.getConfig).toHaveBeenCalled();
    });

    it('should delegate updateConfiguration to config service', () => {
      const newConfig = { timeoutMs: 60000 };
      configService.updateConfig.mockImplementation(() => {});

      service.updateConfiguration(newConfig);

      expect(configService.updateConfig).toHaveBeenCalledWith(newConfig);
    });

    it('should delegate enableStandaloneMode to config service', () => {
      configService.enableStandaloneMode.mockImplementation(() => {});

      service.enableStandaloneMode();

      expect(configService.enableStandaloneMode).toHaveBeenCalled();
    });

    it('should delegate enableFirebaseMode to config service', () => {
      configService.enableFirebaseMode.mockImplementation(() => {});

      service.enableFirebaseMode();

      expect(configService.enableFirebaseMode).toHaveBeenCalled();
    });

    it('should delegate getAvailableCorsProxies to config service', () => {
      const mockProxies = ['proxy1', 'proxy2'];
      configService.getAvailableCorsProxies.mockReturnValue(mockProxies);

      const result = service.getAvailableCorsProxies();

      expect(result).toEqual(mockProxies);
      expect(configService.getAvailableCorsProxies).toHaveBeenCalled();
    });

    it('should delegate resetConfiguration to config service', () => {
      configService.resetConfig.mockImplementation(() => {});

      service.resetConfiguration();

      expect(configService.resetConfig).toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete workflow with standalone mode', (done) => {
      const testUrl = 'https://example.com/recipe';
      const mockScrapedRecipe: ScrapedRecipe = {
        name: 'Test Recipe',
        recipeIngredient: ['2 cups flour', '1 cup sugar'],
        recipeInstructions: ['Mix ingredients', 'Bake']
      };
      const mockScrapingResult: RecipeScrapingResult = {
        status: 'ok',
        recipe: mockScrapedRecipe
      };
      const mockConvertedRecipe = {
        uuid: '123',
        name: 'Test Recipe',
        ingredients: []
      };

      configService.isStandaloneMode.mockReturnValue(true);
      standaloneService.scrapeRecipeFromUrl.mockReturnValue(of(mockScrapingResult));
      standaloneService.convertScrapedToRecipe.mockReturnValue(mockConvertedRecipe);

      service.scrapeRecipeFromUrl(testUrl).subscribe({
        next: (result) => {
          expect(result).toEqual(mockScrapingResult);
          
          // Test conversion
          const converted = service.convertScrapedToRecipe(mockScrapedRecipe);
          expect(converted).toEqual(mockConvertedRecipe);
          
          done();
        },
        error: done
      });
    });

    it('should handle complete workflow with Firebase mode', (done) => {
      const testUrl = 'https://example.com/recipe';
      const mockScrapedRecipe: ScrapedRecipe = {
        name: 'Test Recipe',
        recipeIngredient: ['2 cups flour', '1 cup sugar'],
        recipeInstructions: ['Mix ingredients', 'Bake']
      };
      const mockScrapingResult: RecipeScrapingResult = {
        status: 'ok',
        recipe: mockScrapedRecipe
      };
      const mockConvertedRecipe = {
        uuid: '123',
        name: 'Test Recipe',
        ingredients: []
      };

      configService.isStandaloneMode.mockReturnValue(false);
      configService.getFirebaseFunctionUrl.mockReturnValue('https://firebase-function.com/parseRecipe');
      standaloneService.convertScrapedToRecipe.mockReturnValue(mockConvertedRecipe);

      service.scrapeRecipeFromUrl(testUrl).subscribe({
        next: (result) => {
          expect(result).toEqual(mockScrapingResult);
          
          // Test conversion
          const converted = service.convertScrapedToRecipe(mockScrapedRecipe);
          expect(converted).toEqual(mockConvertedRecipe);
          
          done();
        },
        error: done
      });

      const req = httpMock.expectOne('https://firebase-function.com/parseRecipe');
      req.flush(mockScrapingResult);
    });
  });
});
