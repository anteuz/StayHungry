import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { RecipeScrapingPage } from './recipe-scraping.page';
import { UnifiedRecipeScrapingService } from '../services/unified-recipe-scraping.service';
import { RecipeServiceService } from '../services/recipe-service.service';
import { StandaloneRecipeScrapingService } from '../services/standalone-recipe-scraping.service';
import { RecipeScrapingConfigService } from '../services/recipe-scraping-config.service';

describe('RecipeScrapingPage', () => {
  let component: RecipeScrapingPage;
  let fixture: ComponentFixture<RecipeScrapingPage>;

  beforeEach(async () => {
    const mockRouter = { navigate: jest.fn() };
    const mockUnifiedRecipeScrapingService = {
      scrapeRecipeFromUrl: jest.fn(),
      convertScrapedToRecipe: jest.fn(),
      validateUrl: jest.fn()
    };
    const mockRecipeService = { addItem: jest.fn() };
    const mockLoadingController = { create: jest.fn() };
    const mockAlertController = { create: jest.fn() };
    const mockToastController = { create: jest.fn() };
    const mockStandaloneService = {
      scrapeRecipeFromUrl: jest.fn(),
      convertScrapedToRecipe: jest.fn(),
      validateUrl: jest.fn()
    };
    const mockConfigService = {
      isStandaloneMode: jest.fn(),
      getFirebaseFunctionUrl: jest.fn(),
      testConfiguration: jest.fn(),
      getConfig: jest.fn(),
      updateConfig: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [RecipeScrapingPage],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: UnifiedRecipeScrapingService, useValue: mockUnifiedRecipeScrapingService },
        { provide: RecipeServiceService, useValue: mockRecipeService },
        { provide: LoadingController, useValue: mockLoadingController },
        { provide: AlertController, useValue: mockAlertController },
        { provide: ToastController, useValue: mockToastController },
        { provide: StandaloneRecipeScrapingService, useValue: mockStandaloneService },
        { provide: RecipeScrapingConfigService, useValue: mockConfigService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeScrapingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.url).toBe('');
    expect(component.isLoading).toBe(false);
    expect(component.scrapedRecipe).toBeNull();
    expect(component.errorMessage).toBe('');
  });

  it('should clear form state', () => {
    component.url = 'https://example.com/recipe';
    component.scrapedRecipe = { name: 'Test', recipeIngredient: [], recipeInstructions: [] } as any;
    component.errorMessage = 'Some error';
    
    component.clearForm();
    
    expect(component.url).toBe('');
    expect(component.scrapedRecipe).toBeNull();
    expect(component.errorMessage).toBe('');
  });

  it('should navigate back to recipes page', () => {
    const router = TestBed.inject(Router);
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/tabs/tab2']);
  });

  it('should validate recipe data correctly', () => {
    // Test with valid recipe
    const validRecipe = {
      name: 'Test Recipe',
      recipeIngredient: ['ingredient 1', 'ingredient 2'],
      recipeInstructions: ['step 1', 'step 2']
    };
    
    component.scrapedRecipe = validRecipe as any;
    expect(component.canSaveRecipe()).toBe(true);
    
    // Test with missing ingredients
    const invalidRecipe1 = {
      name: 'Test Recipe',
      recipeIngredient: [],
      recipeInstructions: ['step 1', 'step 2']
    };
    
    component.scrapedRecipe = invalidRecipe1 as any;
    expect(component.canSaveRecipe()).toBe(false);
    
    // Test with missing instructions
    const invalidRecipe2 = {
      name: 'Test Recipe',
      recipeIngredient: ['ingredient 1', 'ingredient 2'],
      recipeInstructions: []
    };
    
    component.scrapedRecipe = invalidRecipe2 as any;
    expect(component.canSaveRecipe()).toBe(false);
    
    // Test with no recipe
    component.scrapedRecipe = null;
    expect(component.canSaveRecipe()).toBe(false);
  });
});
