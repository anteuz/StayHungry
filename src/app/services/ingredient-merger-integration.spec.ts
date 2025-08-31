import { TestBed } from '@angular/core/testing';
import { IngredientMergerService } from './ingredient-merger.service';
import { Ingredient } from '../models/ingredient';
import { SimpleItem } from '../models/simple-item';
import { v4 as uuidv4 } from 'uuid';

describe('IngredientMergerService Integration', () => {
  let mergerService: IngredientMergerService;
  let mockItem1: SimpleItem;
  let mockItem2: SimpleItem;
  let mockItem3: SimpleItem;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IngredientMergerService]
    });
    mergerService = TestBed.inject(IngredientMergerService);

    // Create mock items
    mockItem1 = new SimpleItem(uuidv4(), 'maito', '--ion-color-category-dairy', 1);
    mockItem2 = new SimpleItem(uuidv4(), 'leipä', '--ion-color-category-grains', 1);
    mockItem3 = new SimpleItem(uuidv4(), 'jauho', '--ion-color-category-pantry', 1);
  });

  describe('Real-world scenarios', () => {
    it('should merge milk amounts correctly', () => {
      // Scenario: Shopping list has 1 l milk, recipe adds 2 dl milk
      const existingIngredients = [
        new Ingredient(uuidv4(), mockItem1, '1 l')
      ];
      
      const newIngredients = [
        new Ingredient(uuidv4(), mockItem1, '2 dl')
      ];
      
      const mergedIngredients = mergerService.mergeIngredients(existingIngredients, newIngredients);
      
      expect(mergedIngredients).toHaveLength(1);
      expect(mergedIngredients[0].amount).toBe('1,2 l');
      expect(mergedIngredients[0].item.itemName).toBe('maito');
    });

    it('should merge flour amounts correctly', () => {
      // Scenario: Shopping list has 500 g flour, recipe adds 1 kg flour
      const existingIngredients = [
        new Ingredient(uuidv4(), mockItem3, '500 g')
      ];
      
      const newIngredients = [
        new Ingredient(uuidv4(), mockItem3, '1 kg')
      ];
      
      const mergedIngredients = mergerService.mergeIngredients(existingIngredients, newIngredients);
      
      expect(mergedIngredients).toHaveLength(1);
      expect(mergedIngredients[0].amount).toBe('1,5 kg');
      expect(mergedIngredients[0].item.itemName).toBe('jauho');
    });

    it('should handle mixed units intelligently', () => {
      // Scenario: Shopping list has 2 dl milk, recipe adds 1 l milk
      const existingIngredients = [
        new Ingredient(uuidv4(), mockItem1, '2 dl')
      ];
      
      const newIngredients = [
        new Ingredient(uuidv4(), mockItem1, '1 l')
      ];
      
      const mergedIngredients = mergerService.mergeIngredients(existingIngredients, newIngredients);
      
      expect(mergedIngredients).toHaveLength(1);
      expect(mergedIngredients[0].amount).toBe('1,2 l');
    });

    it('should add new ingredients when no matches found', () => {
      // Scenario: Shopping list has milk, recipe adds bread
      const existingIngredients = [
        new Ingredient(uuidv4(), mockItem1, '1 l')
      ];
      
      const newIngredients = [
        new Ingredient(uuidv4(), mockItem2, '1 kpl')
      ];
      
      const mergedIngredients = mergerService.mergeIngredients(existingIngredients, newIngredients);
      
      expect(mergedIngredients).toHaveLength(2);
      
      const milkIngredient = mergedIngredients.find(ing => ing.item.itemName === 'maito');
      const breadIngredient = mergedIngredients.find(ing => ing.item.itemName === 'leipä');
      
      expect(milkIngredient.amount).toBe('1 l');
      expect(breadIngredient.amount).toBe('1 kpl');
    });

    it('should handle complex recipe with multiple ingredients', () => {
      // Scenario: Shopping list has some items, recipe adds multiple ingredients
      const existingIngredients = [
        new Ingredient(uuidv4(), mockItem1, '1 l'),
        new Ingredient(uuidv4(), mockItem2, '2 kpl')
      ];
      
      const newIngredients = [
        new Ingredient(uuidv4(), mockItem1, '2 dl'),  // Should merge with existing milk
        new Ingredient(uuidv4(), mockItem2, '1 kpl'), // Should merge with existing bread
        new Ingredient(uuidv4(), mockItem3, '500 g')  // Should add as new ingredient
      ];
      
      const mergedIngredients = mergerService.mergeIngredients(existingIngredients, newIngredients);
      
      // Should have 3 ingredients: milk (merged), bread (merged), flour (new)
      expect(mergedIngredients).toHaveLength(3);
      
      const milkIngredient = mergedIngredients.find(ing => ing.item.itemName === 'maito');
      const breadIngredient = mergedIngredients.find(ing => ing.item.itemName === 'leipä');
      const flourIngredient = mergedIngredients.find(ing => ing.item.itemName === 'jauho');
      
      expect(milkIngredient.amount).toBe('1,2 l');
      expect(breadIngredient.amount).toBe('3 kpl');
      expect(flourIngredient.amount).toBe('500 g');
    });

    it('should provide accurate merge summary', () => {
      const existingIngredients = [
        new Ingredient(uuidv4(), mockItem1, '1 l'),
        new Ingredient(uuidv4(), mockItem2, '2 kpl')
      ];
      
      const newIngredients = [
        new Ingredient(uuidv4(), mockItem1, '2 dl'),  // Should merge with existing milk
        new Ingredient(uuidv4(), mockItem3, '500 g')  // Should add as new ingredient
      ];
      
      const summary = mergerService.getMergeSummary(existingIngredients, newIngredients);
      
      expect(summary.merged).toBe(1);
      expect(summary.added).toBe(1);
      expect(summary.total).toBe(3);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty shopping list', () => {
      const newIngredients = [
        new Ingredient(uuidv4(), mockItem1, '1 l'),
        new Ingredient(uuidv4(), mockItem2, '2 kpl')
      ];
      
      const mergedIngredients = mergerService.mergeIngredients([], newIngredients);
      
      expect(mergedIngredients).toHaveLength(2);
      expect(mergedIngredients[0].item.itemName).toBe('maito');
      expect(mergedIngredients[1].item.itemName).toBe('leipä');
    });

    it('should handle empty recipe', () => {
      const existingIngredients = [
        new Ingredient(uuidv4(), mockItem1, '1 l')
      ];
      
      const mergedIngredients = mergerService.mergeIngredients(existingIngredients, []);
      
      expect(mergedIngredients).toHaveLength(1);
      expect(mergedIngredients[0].amount).toBe('1 l');
    });

    it('should preserve collection status', () => {
      const existingIngredient = new Ingredient(uuidv4(), mockItem1, '1 l');
      existingIngredient.isCollected = true;
      existingIngredient.isBeingCollected = true;
      
      const newIngredients = [
        new Ingredient(uuidv4(), mockItem1, '2 dl')
      ];
      
      const mergedIngredients = mergerService.mergeIngredients([existingIngredient], newIngredients);
      
      expect(mergedIngredients[0].isCollected).toBe(true);
      expect(mergedIngredients[0].isBeingCollected).toBe(true);
    });
  });

  describe('Unit conversion examples', () => {
    it('should convert 2 dl + 500 ml to 7 dl', () => {
      const result = mergerService.mergeAmounts('2 dl', '500 ml');
      expect(result).toBe('7 dl');
    });

    it('should convert 500 g + 1 kg to 1,5 kg', () => {
      const result = mergerService.mergeAmounts('500 g', '1 kg');
      expect(result).toBe('1,5 kg');
    });

    it('should handle fractions correctly', () => {
      const result = mergerService.mergeAmounts('1/2 dl', '1/4 dl');
      expect(result).toBe('0,75 dl');
    });

    it('should handle incompatible units by concatenating', () => {
      const result = mergerService.mergeAmounts('1 dl', '2 kpl');
      expect(result).toBe('1 dl + 2 kpl');
    });
  });
});
