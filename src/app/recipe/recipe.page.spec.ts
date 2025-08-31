import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RecipePage } from './recipe.page';
import { Recipe } from '../models/recipe';
import { RecipeServiceService } from '../services/recipe-service.service';
import { CloudStoreService } from '../services/cloud-store.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController, LoadingController, Platform, ToastController } from '@ionic/angular';
import { of } from 'rxjs';
import { IngredientParserService } from '../services/ingredient-parser.service';
import { ShoppingListService } from '../services/shopping-list.service';
import { SimpleStateService } from '../services/simple-state-service';
import { Ingredient } from '../models/ingredient';
import { ShoppingList } from '../models/shopping-list';
import { SimpleItem } from '../models/simple-item';

describe('RecipePage', () => {
  let component: RecipePage;
  let fixture: ComponentFixture<RecipePage>;
  let mockRecipeService: jest.Mocked<RecipeServiceService>;
  let mockCloudStore: jest.Mocked<CloudStoreService>;
  let mockRouter: jest.Mocked<Router>;
  let mockActivatedRoute: jest.Mocked<ActivatedRoute>;
  let mockModalController: jest.Mocked<ModalController>;
  let mockLoadingController: jest.Mocked<LoadingController>;
  let mockPlatform: jest.Mocked<Platform>;
  let mockIngredientParser: jest.Mocked<IngredientParserService>;
  let mockShoppingListService: jest.Mocked<ShoppingListService>;
  let mockStateService: jest.Mocked<SimpleStateService>;
  let mockToastController: jest.Mocked<ToastController>;

  const mockRecipe = new Recipe(
    'test-uuid',
    'Test Recipe',
    'A test recipe description',
    'test-image.jpg',
    [],
    'food',
    ['Step 1', 'Step 2'],
    ['2 kpl omenat', '1 dl maito'],
    'https://example.com/recipe',
    ['test', 'recipe'],
    { calories: 300 }
  );

  const mockShoppingList = new ShoppingList('shopping-uuid', 'Test Shopping List', []);
  const mockIngredient = new Ingredient('ingredient-uuid', new SimpleItem('item-uuid', 'omenat', 'red', 1), '2 kpl');

  beforeEach(async () => {
    mockRecipeService = {
      findUsingUUID: jest.fn().mockReturnValue(mockRecipe),
      addItem: jest.fn(),
      updateRecipe: jest.fn(),
      removeRecipe: jest.fn()
    } as any;

    mockCloudStore = {
      storeRecipeImage: jest.fn(),
      getReferenceToUploadedFile: jest.fn(),
      removeImage: jest.fn()
    } as any;

    mockRouter = {
      navigate: jest.fn()
    } as any;

    mockActivatedRoute = {
      params: of({ mode: 'view', id: 'test-uuid' })
    } as any;

    mockModalController = {
      create: jest.fn()
    } as any;

    mockLoadingController = {
      create: jest.fn()
    } as any;

    mockPlatform = {
      is: jest.fn().mockReturnValue(false)
    } as any;

    mockIngredientParser = {
      parseRecipeToIngredients: jest.fn().mockReturnValue([mockIngredient])
    } as any;

    mockShoppingListService = {
      findUsingUUID: jest.fn().mockReturnValue(mockShoppingList),
      getItems: jest.fn().mockReturnValue([mockShoppingList]),
      addItemToShoppingList: jest.fn()
    } as any;

    mockStateService = {
      getAppState: jest.fn().mockResolvedValue({ lastVisited_ShoppingList: 'shopping-uuid' }),
      updateLastVisitedShoppingList: jest.fn()
    } as any;

    mockToastController = {
      create: jest.fn().mockResolvedValue({
        present: jest.fn()
      })
    } as any;

    await TestBed.configureTestingModule({
      declarations: [RecipePage],
      imports: [IonicModule.forRoot(), ReactiveFormsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: RecipeServiceService, useValue: mockRecipeService },
        { provide: CloudStoreService, useValue: mockCloudStore },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ModalController, useValue: mockModalController },
        { provide: LoadingController, useValue: mockLoadingController },
        { provide: Platform, useValue: mockPlatform },
        { provide: IngredientParserService, useValue: mockIngredientParser },
        { provide: ShoppingListService, useValue: mockShoppingListService },
        { provide: SimpleStateService, useValue: mockStateService },
        { provide: ToastController, useValue: mockToastController }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecipePage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with recipe data in view mode', () => {
    component.ngOnInit();
    expect(component.recipe).toEqual(mockRecipe);
    expect(component.mode).toBe('view');
  });

  it('should get correct category label', () => {
    const label = component.getCategoryLabel('food');
    expect(label).toBe('Food');
  });

  it('should get correct category icon', () => {
    const icon = component.getCategoryIcon('desserts');
    expect(icon).toBe('ice-cream');
  });

  it('should toggle instructions visibility', () => {
    expect(component.showInstructions).toBe(false);
    component.toggleInstructions();
    expect(component.showInstructions).toBe(true);
    component.toggleInstructions();
    expect(component.showInstructions).toBe(false);
  });

  it('should open source URL', () => {
    const mockOpen = jest.spyOn(window, 'open').mockImplementation();
    component.openSourceUrl('https://example.com');
    expect(mockOpen).toHaveBeenCalledWith('https://example.com', '_blank');
    mockOpen.mockRestore();
  });

  it('should handle unknown category gracefully', () => {
    const label = component.getCategoryLabel('unknown');
    const icon = component.getCategoryIcon('unknown');
    expect(label).toBe('Unknown');
    expect(icon).toBe('help-circle');
  });

  describe('onAddIngredients', () => {
    beforeEach(() => {
      // Create a fresh copy of the recipe for each test
      component.recipe = new Recipe(
        'test-uuid',
        'Test Recipe',
        'A test recipe description',
        'test-image.jpg',
        [],
        'food',
        ['Step 1', 'Step 2'],
        ['2 kpl omenat', '1 dl maito'],
        'https://example.com/recipe',
        ['test', 'recipe'],
        { calories: 300 }
      );
      mockLoadingController.create.mockResolvedValue({
        present: jest.fn(),
        dismiss: jest.fn()
      } as any);
    });

    it('should add ingredients to shopping list successfully', async () => {
      await component.onAddIngredients();

      expect(mockIngredientParser.parseRecipeToIngredients).toHaveBeenCalledWith(
        mockRecipe.recipeIngredient,
        { confidenceThreshold: 0.6 }
      );
      expect(mockShoppingListService.addItemToShoppingList).toHaveBeenCalledWith(
        mockShoppingList,
        mockIngredient
      );
      expect(mockStateService.updateLastVisitedShoppingList).toHaveBeenCalledWith('shopping-uuid');
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/tabs/tab1', 'shopping-uuid'],
        { relativeTo: mockActivatedRoute }
      );
    });

    it('should show warning when no ingredients found', async () => {
      component.recipe.recipeIngredient = [];
      
      await component.onAddIngredients();

      expect(mockToastController.create).toHaveBeenCalledWith({
        message: 'No ingredients found in this recipe',
        duration: 3000,
        color: 'warning',
        position: 'bottom'
      });
    });

    it('should show warning when no shopping list available', async () => {
      mockStateService.getAppState.mockResolvedValue(null);
      mockShoppingListService.getItems.mockReturnValue([]);

      await component.onAddIngredients();

      expect(mockToastController.create).toHaveBeenCalledWith({
        message: 'No shopping list available. Please create one first.',
        duration: 3000,
        color: 'warning',
        position: 'bottom'
      });
    });

    it('should show warning when no ingredients could be parsed', async () => {
      mockIngredientParser.parseRecipeToIngredients.mockReturnValue([]);

      await component.onAddIngredients();

      expect(mockToastController.create).toHaveBeenCalledWith({
        message: 'No ingredients could be parsed from this recipe',
        duration: 3000,
        color: 'warning',
        position: 'bottom'
      });
    });

    it('should handle errors gracefully', async () => {
      mockIngredientParser.parseRecipeToIngredients.mockImplementation(() => {
        throw new Error('Test error');
      });

      await component.onAddIngredients();

      expect(mockToastController.create).toHaveBeenCalledWith({
        message: 'Failed to add ingredients to shopping list',
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
    });
  });
});
