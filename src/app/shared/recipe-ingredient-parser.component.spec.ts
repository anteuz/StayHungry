import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { RecipeIngredientParserComponent } from './recipe-ingredient-parser.component';
import { Recipe } from '../models/recipe';
import { IngredientParserResult } from '../models/ingredient-parser-result';
import { RecipeValidationResult } from '../services/recipe-to-shopping-list.service';

describe('RecipeIngredientParserComponent', () => {
  let component: RecipeIngredientParserComponent;
  let fixture: ComponentFixture<RecipeIngredientParserComponent>;
  let mockRecipeToShoppingListService: any;
  let mockIngredientParserService: any;

  beforeEach(async () => {
    mockRecipeToShoppingListService = {
      validateRecipeIngredients: jest.fn(),
      addRecipeIngredientsToShoppingList: jest.fn(),
      addRecipeIngredientsToShoppingListById: jest.fn(),
      createShoppingListFromRecipe: jest.fn(),
      getIngredientsNeedingReview: jest.fn(),
      getSuccessfullyParsedIngredients: jest.fn()
    };

    mockIngredientParserService = {
      parseIngredientText: jest.fn(),
      parseRecipeIngredients: jest.fn()
    };

    await TestBed.configureTestingModule({
      declarations: [ RecipeIngredientParserComponent ],
      imports: [ IonicModule.forRoot(), FormsModule ],
      providers: [
        { provide: 'RecipeToShoppingListService', useValue: mockRecipeToShoppingListService },
        { provide: 'IngredientParserService', useValue: mockIngredientParserService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecipeIngredientParserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('parseSingleIngredient', () => {
    it('should parse single ingredient text', () => {
      const mockResult: IngredientParserResult = {
        amount: '2 kpl',
        itemName: 'omenat',
        confidence: 0.9,
        rawText: '2 kpl omenat'
      };

      mockIngredientParserService.parseIngredientText.mockReturnValue(mockResult);

      component.ingredientText = '2 kpl omenat';
      component.parseSingleIngredient();

      expect(mockIngredientParserService.parseIngredientText).toHaveBeenCalledWith('2 kpl omenat');
      expect(component.parsedResult).toEqual(mockResult);
    });

    it('should handle empty ingredient text', () => {
      component.ingredientText = '';
      component.parseSingleIngredient();

      expect(mockIngredientParserService.parseIngredientText).not.toHaveBeenCalled();
      expect(component.parsedResult).toBeNull();
    });
  });

  describe('validateRecipe', () => {
    it('should validate recipe ingredients', () => {
      const mockRecipe = new Recipe(
        'recipe-1',
        'Test Recipe',
        'Test description',
        null,
        [],
        'food',
        [],
        ['2 kpl omenat', '1 pkt Pirkka lehtitaikinalevyjä']
      );

      const mockValidationResult: RecipeValidationResult = {
        totalIngredients: 2,
        validIngredients: 2,
        lowConfidenceIngredients: 0,
        parsedResults: [
          { amount: '2 kpl', itemName: 'omenat', confidence: 0.9, rawText: '2 kpl omenat' },
          { amount: '1 pkt', itemName: 'lehtitaikinalevyjä', confidence: 0.8, rawText: '1 pkt Pirkka lehtitaikinalevyjä' }
        ]
      };

      mockRecipeToShoppingListService.validateRecipeIngredients.mockReturnValue(mockValidationResult);

      component.recipe = mockRecipe;
      component.validateRecipe();

      expect(mockRecipeToShoppingListService.validateRecipeIngredients).toHaveBeenCalledWith(mockRecipe);
      expect(component.validationResult).toEqual(mockValidationResult);
    });

    it('should handle recipe without ingredients', () => {
      const mockRecipe = new Recipe(
        'recipe-1',
        'Test Recipe',
        'Test description',
        null,
        [],
        'food',
        [],
        []
      );

      const mockValidationResult: RecipeValidationResult = {
        totalIngredients: 0,
        validIngredients: 0,
        lowConfidenceIngredients: 0,
        parsedResults: []
      };

      mockRecipeToShoppingListService.validateRecipeIngredients.mockReturnValue(mockValidationResult);

      component.recipe = mockRecipe;
      component.validateRecipe();

      expect(component.validationResult).toEqual(mockValidationResult);
    });
  });

  describe('addToShoppingList', () => {
    it('should add recipe ingredients to shopping list', async () => {
      const mockRecipe = new Recipe(
        'recipe-1',
        'Test Recipe',
        'Test description',
        null,
        [],
        'food',
        [],
        ['2 kpl omenat']
      );

      const mockResult = {
        success: true,
        addedIngredients: [],
        shoppingList: { uuid: 'list-1', name: 'Test List', items: [] }
      };

      mockRecipeToShoppingListService.addRecipeIngredientsToShoppingList.mockResolvedValue(mockResult);

      component.recipe = mockRecipe;
      component.selectedShoppingListId = 'list-1';
      
      await component.addToShoppingList();

      expect(mockRecipeToShoppingListService.addRecipeIngredientsToShoppingListById).toHaveBeenCalled();
      expect(component.lastOperationResult).toEqual(mockResult);
    });

    it('should handle errors when adding to shopping list', async () => {
      const mockRecipe = new Recipe(
        'recipe-1',
        'Test Recipe',
        'Test description',
        null,
        [],
        'food',
        [],
        ['2 kpl omenat']
      );

      const mockResult = {
        success: false,
        addedIngredients: [],
        error: 'Shopping list not found'
      };

      mockRecipeToShoppingListService.addRecipeIngredientsToShoppingListById.mockResolvedValue(mockResult);

      component.recipe = mockRecipe;
      component.selectedShoppingListId = 'non-existent';
      
      await component.addToShoppingList();

      expect(component.lastOperationResult).toEqual(mockResult);
    });
  });

  describe('createNewShoppingList', () => {
    it('should create new shopping list from recipe', async () => {
      const mockRecipe = new Recipe(
        'recipe-1',
        'Test Recipe',
        'Test description',
        null,
        [],
        'food',
        [],
        ['2 kpl omenat']
      );

      const mockResult = {
        success: true,
        addedIngredients: [],
        shoppingList: { uuid: 'new-list-1', name: 'Test Recipe - Shopping List', items: [] }
      };

      mockRecipeToShoppingListService.createShoppingListFromRecipe.mockResolvedValue(mockResult);

      component.recipe = mockRecipe;
      
      await component.createNewShoppingList();

      expect(mockRecipeToShoppingListService.createShoppingListFromRecipe).toHaveBeenCalledWith(mockRecipe);
      expect(component.lastOperationResult).toEqual(mockResult);
    });
  });

  describe('getConfidenceColor', () => {
    it('should return green for high confidence', () => {
      const color = component.getConfidenceColor(0.9);
      expect(color).toBe('success');
    });

    it('should return yellow for medium confidence', () => {
      const color = component.getConfidenceColor(0.6);
      expect(color).toBe('warning');
    });

    it('should return red for low confidence', () => {
      const color = component.getConfidenceColor(0.3);
      expect(color).toBe('danger');
    });
  });

  describe('getConfidenceText', () => {
    it('should return "High" for high confidence', () => {
      const text = component.getConfidenceText(0.9);
      expect(text).toBe('High');
    });

    it('should return "Medium" for medium confidence', () => {
      const text = component.getConfidenceText(0.6);
      expect(text).toBe('Medium');
    });

    it('should return "Low" for low confidence', () => {
      const text = component.getConfidenceText(0.3);
      expect(text).toBe('Low');
    });
  });
});
