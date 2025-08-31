import { TestBed } from '@angular/core/testing';
import { RecipeToShoppingListService } from './recipe-to-shopping-list.service';
import { Recipe } from '../models/recipe';
import { ShoppingList } from '../models/shopping-list';
import { Ingredient } from '../models/ingredient';
import { SimpleItem } from '../models/simple-item';

describe('RecipeToShoppingListService', () => {
  let service: RecipeToShoppingListService;
  let mockShoppingListService: any;
  let mockIngredientParserService: any;
  let mockItemService: any;

  beforeEach(() => {
    mockShoppingListService = {
      updateShoppingList: jest.fn(),
      findUsingUUID: jest.fn()
    };

    mockIngredientParserService = {
      parseRecipeToIngredients: jest.fn(),
      parseRecipeIngredients: jest.fn()
    };

    mockItemService = {
      filterItems: jest.fn(),
      addItem: jest.fn(),
      updateItem: jest.fn(),
      incrementUsage: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        RecipeToShoppingListService,
        { provide: 'ShoppingListService', useValue: mockShoppingListService },
        { provide: 'IngredientParserService', useValue: mockIngredientParserService },
        { provide: 'ItemService', useValue: mockItemService }
      ]
    });

    service = TestBed.inject(RecipeToShoppingListService);
  });

  describe('addRecipeIngredientsToShoppingList', () => {
    it('should add recipe ingredients to shopping list', async () => {
      const recipe = new Recipe(
        'recipe-1',
        'Test Recipe',
        'Test description',
        null,
        [],
        'food',
        [],
        ['2 kpl omenat', '1 pkt Pirkka lehtitaikinalevyjä']
      );

      const shoppingList = new ShoppingList('list-1', 'Test List', []);

      const mockIngredients = [
        new Ingredient('ing-1', new SimpleItem('item-1', 'omenat', '--ion-color-category-fruit', 1), '2 kpl'),
        new Ingredient('ing-2', new SimpleItem('item-2', 'lehtitaikinalevyjä', '--ion-color-category-frozen', 1), '1 pkt')
      ];

      mockIngredientParserService.parseRecipeToIngredients.mockReturnValue(mockIngredients);
      mockShoppingListService.updateShoppingList.mockResolvedValue(undefined);

      const result = await service.addRecipeIngredientsToShoppingList(recipe, shoppingList);

      expect(result.success).toBe(true);
      expect(result.addedIngredients).toHaveLength(2);
      expect(result.addedIngredients[0].item.itemName).toBe('omenat');
      expect(result.addedIngredients[1].item.itemName).toBe('lehtitaikinalevyjä');
      expect(mockShoppingListService.updateShoppingList).toHaveBeenCalledWith(shoppingList);
    });

    it('should handle empty recipe ingredients', async () => {
      const recipe = new Recipe(
        'recipe-1',
        'Test Recipe',
        'Test description',
        null,
        [],
        'food',
        [],
        []
      );

      const shoppingList = new ShoppingList('list-1', 'Test List', []);

      mockIngredientParserService.parseRecipeToIngredients.mockReturnValue([]);

      const result = await service.addRecipeIngredientsToShoppingList(recipe, shoppingList);

      expect(result.success).toBe(true);
      expect(result.addedIngredients).toHaveLength(0);
      expect(mockShoppingListService.updateShoppingList).not.toHaveBeenCalled();
    });

    it('should handle shopping list service errors', async () => {
      const recipe = new Recipe(
        'recipe-1',
        'Test Recipe',
        'Test description',
        null,
        [],
        'food',
        [],
        ['2 kpl omenat']
      );

      const shoppingList = new ShoppingList('list-1', 'Test List', []);

      const mockIngredients = [
        new Ingredient('ing-1', new SimpleItem('item-1', 'omenat', '--ion-color-category-fruit', 1), '2 kpl')
      ];

      mockIngredientParserService.parseRecipeToIngredients.mockReturnValue(mockIngredients);
      mockShoppingListService.updateShoppingList.mockRejectedValue(new Error('Database error'));

      const result = await service.addRecipeIngredientsToShoppingList(recipe, shoppingList);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(result.addedIngredients).toHaveLength(0);
    });

    it('should handle ingredient parser errors', async () => {
      const recipe = new Recipe(
        'recipe-1',
        'Test Recipe',
        'Test description',
        null,
        [],
        'food',
        [],
        ['invalid ingredient']
      );

      const shoppingList = new ShoppingList('list-1', 'Test List', []);

      mockIngredientParserService.parseRecipeToIngredients.mockImplementation(() => {
        throw new Error('Parser error');
      });

      const result = await service.addRecipeIngredientsToShoppingList(recipe, shoppingList);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Parser error');
      expect(result.addedIngredients).toHaveLength(0);
    });
  });

  describe('addRecipeIngredientsToShoppingListById', () => {
    it('should add ingredients to shopping list by ID', async () => {
      const recipe = new Recipe(
        'recipe-1',
        'Test Recipe',
        'Test description',
        null,
        [],
        'food',
        [],
        ['2 kpl omenat']
      );

      const shoppingList = new ShoppingList('list-1', 'Test List', []);
      const mockIngredients = [
        new Ingredient('ing-1', new SimpleItem('item-1', 'omenat', '--ion-color-category-fruit', 1), '2 kpl')
      ];

      mockShoppingListService.findUsingUUID.mockReturnValue(shoppingList);
      mockIngredientParserService.parseRecipeToIngredients.mockReturnValue(mockIngredients);
      mockShoppingListService.updateShoppingList.mockResolvedValue(undefined);

      const result = await service.addRecipeIngredientsToShoppingListById(recipe, 'list-1');

      expect(result.success).toBe(true);
      expect(mockShoppingListService.findUsingUUID).toHaveBeenCalledWith('list-1');
    });

    it('should handle shopping list not found', async () => {
      const recipe = new Recipe(
        'recipe-1',
        'Test Recipe',
        'Test description',
        null,
        [],
        'food',
        [],
        ['2 kpl omenat']
      );

      mockShoppingListService.findUsingUUID.mockReturnValue(null);

      const result = await service.addRecipeIngredientsToShoppingListById(recipe, 'non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Shopping list not found');
    });
  });

  describe('createShoppingListFromRecipe', () => {
    it('should create new shopping list from recipe', async () => {
      const recipe = new Recipe(
        'recipe-1',
        'Test Recipe',
        'Test description',
        null,
        [],
        'food',
        [],
        ['2 kpl omenat', '1 pkt Pirkka lehtitaikinalevyjä']
      );

      const mockIngredients = [
        new Ingredient('ing-1', new SimpleItem('item-1', 'omenat', '--ion-color-category-fruit', 1), '2 kpl'),
        new Ingredient('ing-2', new SimpleItem('item-2', 'lehtitaikinalevyjä', '--ion-color-category-frozen', 1), '1 pkt')
      ];

      mockIngredientParserService.parseRecipeToIngredients.mockReturnValue(mockIngredients);
      mockShoppingListService.updateShoppingList.mockResolvedValue(undefined);

      const result = await service.createShoppingListFromRecipe(recipe);

      expect(result.success).toBe(true);
      expect(result.shoppingList.name).toBe('Test Recipe - Shopping List');
      expect(result.shoppingList.items).toHaveLength(2);
      expect(mockShoppingListService.updateShoppingList).toHaveBeenCalled();
    });

    it('should handle recipe without ingredients', async () => {
      const recipe = new Recipe(
        'recipe-1',
        'Test Recipe',
        'Test description',
        null,
        [],
        'food',
        [],
        []
      );

      mockIngredientParserService.parseRecipeToIngredients.mockReturnValue([]);

      const result = await service.createShoppingListFromRecipe(recipe);

      expect(result.success).toBe(true);
      expect(result.shoppingList.items).toHaveLength(0);
    });
  });

  describe('validateRecipeIngredients', () => {
    it('should validate recipe ingredients and return parsing results', () => {
      const recipe = new Recipe(
        'recipe-1',
        'Test Recipe',
        'Test description',
        null,
        [],
        'food',
        [],
        ['2 kpl omenat', 'invalid ingredient', '1 pkt Pirkka lehtitaikinalevyjä']
      );

      const mockParsedResults = [
        { amount: '2 kpl', itemName: 'omenat', confidence: 0.9, rawText: '2 kpl omenat' },
        { amount: '', itemName: 'invalid ingredient', confidence: 0.2, rawText: 'invalid ingredient' },
        { amount: '1 pkt', itemName: 'lehtitaikinalevyjä', confidence: 0.8, rawText: '1 pkt Pirkka lehtitaikinalevyjä' }
      ];

      mockIngredientParserService.parseRecipeIngredients.mockReturnValue(mockParsedResults);

      const result = service.validateRecipeIngredients(recipe);

      expect(result.totalIngredients).toBe(3);
      expect(result.validIngredients).toBe(2);
      expect(result.lowConfidenceIngredients).toBe(1);
      expect(result.parsedResults).toEqual(mockParsedResults);
    });

    it('should handle recipe without ingredients', () => {
      const recipe = new Recipe(
        'recipe-1',
        'Test Recipe',
        'Test description',
        null,
        [],
        'food',
        [],
        []
      );

      mockIngredientParserService.parseRecipeIngredients.mockReturnValue([]);

      const result = service.validateRecipeIngredients(recipe);

      expect(result.totalIngredients).toBe(0);
      expect(result.validIngredients).toBe(0);
      expect(result.lowConfidenceIngredients).toBe(0);
    });
  });
});
