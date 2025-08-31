import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';

import { RecipeScrapingPage } from './recipe-scraping.page';
import { RecipeScrapingService } from '../services/recipe-scraping.service';
import { RecipeServiceService } from '../services/recipe-service.service';

describe('RecipeScrapingPage', () => {
  let component: RecipeScrapingPage;
  let fixture: ComponentFixture<RecipeScrapingPage>;

  beforeEach(async () => {
    const mockRouter = { navigate: jest.fn() };
    const mockRecipeScrapingService = {
      scrapeRecipeFromUrl: jest.fn(),
      convertScrapedToRecipe: jest.fn(),
      validateUrl: jest.fn()
    };
    const mockRecipeService = { addItem: jest.fn() };
    const mockLoadingController = { create: jest.fn() };
    const mockAlertController = { create: jest.fn() };
    const mockToastController = { create: jest.fn() };

    await TestBed.configureTestingModule({
      declarations: [RecipeScrapingPage],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: RecipeScrapingService, useValue: mockRecipeScrapingService },
        { provide: RecipeServiceService, useValue: mockRecipeService },
        { provide: LoadingController, useValue: mockLoadingController },
        { provide: AlertController, useValue: mockAlertController },
        { provide: ToastController, useValue: mockToastController }
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
});
