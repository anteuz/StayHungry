import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RecipesPage } from './recipes.page';
import { Recipe } from '../models/recipe';
import { Ingredient } from '../models/ingredient';
import { SimpleItem } from '../models/simple-item';
import { RecipeServiceService } from '../services/recipe-service.service';
import { CloudStoreService } from '../services/cloud-store.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PopoverController } from '@ionic/angular';
import { of } from 'rxjs';

describe('RecipesPage', () => {
  let component: RecipesPage;
  let fixture: ComponentFixture<RecipesPage>;
  let mockRecipeService: jest.Mocked<RecipeServiceService>;
  let mockCloudStore: jest.Mocked<CloudStoreService>;
  let mockRouter: jest.Mocked<Router>;
  let mockActivatedRoute: jest.Mocked<ActivatedRoute>;
  let mockPopoverController: jest.Mocked<PopoverController>;

  const mockRecipes = [
    new Recipe(
      'test-uuid-1',
      'Test Recipe 1',
      'A test recipe description',
      'test-image-1.jpg',
      [],
      'food',
      ['Step 1', 'Step 2'],
      ['Ingredient 1', 'Ingredient 2'],
      'https://example.com/recipe1',
      ['test', 'recipe'],
      { calories: 300 }
    ),
    new Recipe(
      'test-uuid-2',
      'Test Recipe 2',
      'Another test recipe description',
      'test-image-2.jpg',
      [],
      'desserts',
      ['Step 1'],
      ['Ingredient 1'],
      'https://example.com/recipe2',
      ['dessert', 'sweet'],
      { calories: 400 }
    )
  ];

  beforeEach(async () => {
    const mockSubscription = {
      unsubscribe: jest.fn()
    };

    mockRecipeService = {
      recipeEvent: {
        subscribe: jest.fn().mockReturnValue(mockSubscription)
      },
      getItems: jest.fn().mockReturnValue(mockRecipes),
      filterUsingCategory: jest.fn().mockReturnValue([mockRecipes[1]])
    } as any;

    mockCloudStore = {} as any;

    mockRouter = {
      navigate: jest.fn()
    } as any;

    mockActivatedRoute = {} as any;

    mockPopoverController = {
      create: jest.fn()
    } as any;

    await TestBed.configureTestingModule({
      declarations: [RecipesPage],
      imports: [IonicModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: RecipeServiceService, useValue: mockRecipeService },
        { provide: CloudStoreService, useValue: mockCloudStore },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: PopoverController, useValue: mockPopoverController }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecipesPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with recipes data', () => {
    component.ngOnInit();
    // The subscription should be set up, but we need to trigger it manually in the test
    const subscribeCall = mockRecipeService.recipeEvent.subscribe as jest.MockedFunction<any>;
    subscribeCall.mock.calls[0][0](mockRecipes);
    expect(component.recipes).toEqual(mockRecipes);
  });

  it('should get correct category label', () => {
    const label = component.getCategoryLabel('food');
    expect(label).toBe('Food');
  });

  it('should get correct category icon', () => {
    const icon = component.getCategoryIcon('desserts');
    expect(icon).toBe('ice-cream');
  });

  it('should get recipe display info with recipeIngredient', () => {
    const info = component.getRecipeDisplayInfo(mockRecipes[0]);
    expect(info).toBe('2 ingredients');
  });

  it('should get recipe display info with ingredients', () => {
    const simpleItem = new SimpleItem('test-uuid', 'Test Item', '--ion-color-primary');
    const ingredient = new Ingredient('ingredient-uuid', simpleItem, '1');
    const recipe = new Recipe('test', 'Test', 'Desc', 'img', [ingredient], 'food');
    const info = component.getRecipeDisplayInfo(recipe);
    expect(info).toBe('1 ingredients');
  });

  it('should get recipe display info for no ingredients', () => {
    const recipe = new Recipe('test', 'Test', 'Desc', 'img', [], 'food');
    const info = component.getRecipeDisplayInfo(recipe);
    expect(info).toBe('No ingredients');
  });

  it('should check if recipe has instructions', () => {
    expect(component.hasInstructions(mockRecipes[0])).toBe(true);
    const recipe = new Recipe('test', 'Test', 'Desc', 'img', [], 'food');
    expect(component.hasInstructions(recipe)).toBe(false);
  });

  it('should get instruction count', () => {
    expect(component.getInstructionCount(mockRecipes[0])).toBe(2);
    expect(component.getInstructionCount(mockRecipes[1])).toBe(1);
  });

  it('should handle unknown category gracefully', () => {
    const label = component.getCategoryLabel('unknown');
    const icon = component.getCategoryIcon('unknown');
    expect(label).toBe('Unknown');
    expect(icon).toBe('help-circle');
  });

  it('should add recipe to cart', () => {
    expect(component.cart).toBeNull();
    component.addToCart(mockRecipes[0]);
    expect(component.cart).not.toBeNull();
    expect(component.cart.recipes).toContain(mockRecipes[0]);
  });

  it('should filter recipes by category', () => {
    component.segmentChanged({ detail: { value: 'desserts' } });
    expect(component.recipeFilter).toBe('desserts');
    expect(mockRecipeService.filterUsingCategory).toHaveBeenCalledWith('desserts');
  });

  it('should show all recipes when filter is all', () => {
    component.segmentChanged({ detail: { value: 'all' } });
    expect(component.recipeFilter).toBe('all');
    expect(mockRecipeService.getItems).toHaveBeenCalled();
  });
});
