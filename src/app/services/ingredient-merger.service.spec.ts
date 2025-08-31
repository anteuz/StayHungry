import { TestBed } from '@angular/core/testing';
import { IngredientMergerService, ParsedAmount } from './ingredient-merger.service';
import { Ingredient } from '../models/ingredient';
import { SimpleItem } from '../models/simple-item';
import { v4 as uuidv4 } from 'uuid';

describe('IngredientMergerService', () => {
  let service: IngredientMergerService;
  let mockItem1: SimpleItem;
  let mockItem2: SimpleItem;
  let mockItem3: SimpleItem;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IngredientMergerService]
    });
    service = TestBed.inject(IngredientMergerService);

    // Create mock items for testing
    mockItem1 = new SimpleItem(uuidv4(), 'maito', '--ion-color-category-dairy', 1);
    mockItem2 = new SimpleItem(uuidv4(), 'leipä', '--ion-color-category-grains', 1);
    mockItem3 = new SimpleItem(uuidv4(), 'omena', '--ion-color-category-fruits', 1);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('parseAmount', () => {
    it('should parse decimal amounts with comma', () => {
      const result = service['parseAmount']('0,5 dl');
      expect(result).toEqual({
        value: 0.5,
        unit: 'dl',
        originalText: '0,5 dl'
      });
    });

    it('should parse decimal amounts with dot', () => {
      const result = service['parseAmount']('1.5 dl');
      expect(result).toEqual({
        value: 1.5,
        unit: 'dl',
        originalText: '1.5 dl'
      });
    });

    it('should parse fraction amounts', () => {
      const result = service['parseAmount']('1/2 kg');
      expect(result).toEqual({
        value: 0.5,
        unit: 'kg',
        originalText: '1/2 kg'
      });
    });

    it('should parse whole numbers with units', () => {
      const result = service['parseAmount']('2 kpl');
      expect(result).toEqual({
        value: 2,
        unit: 'kpl',
        originalText: '2 kpl'
      });
    });

    it('should parse numbers directly followed by units without space', () => {
      const result = service['parseAmount']('15kpl');
      expect(result).toEqual({
        value: 15,
        unit: 'kpl',
        originalText: '15kpl'
      });
    });

    it('should parse decimal numbers directly followed by units without space', () => {
      const result = service['parseAmount']('2.5dl');
      expect(result).toEqual({
        value: 2.5,
        unit: 'dl',
        originalText: '2.5dl'
      });
    });

    it('should parse comma decimal numbers directly followed by units without space', () => {
      const result = service['parseAmount']('1,5kg');
      expect(result).toEqual({
        value: 1.5,
        unit: 'kg',
        originalText: '1,5kg'
      });
    });

    it('should parse whole numbers without units', () => {
      const result = service['parseAmount']('3');
      expect(result).toEqual({
        value: 3,
        unit: '',
        originalText: '3'
      });
    });

    it('should handle approximate amounts', () => {
      const result = service['parseAmount']('n. 1 dl');
      expect(result).toEqual({
        value: 1,
        unit: 'dl',
        originalText: 'n. 1 dl'
      });
    });

    it('should return null for invalid amounts', () => {
      expect(service['parseAmount']('')).toBeNull();
      expect(service['parseAmount']('invalid')).toBeNull();
      expect(service['parseAmount']('abc dl')).toBeNull();
    });

    it('should handle case insensitive units', () => {
      const result = service['parseAmount']('1 DL');
      expect(result).toEqual({
        value: 1,
        unit: 'dl',
        originalText: '1 DL'
      });
    });
  });

  describe('areUnitsCompatible', () => {
    it('should return true for compatible volume units', () => {
      expect(service['areUnitsCompatible']('dl', 'ml')).toBe(true);
      expect(service['areUnitsCompatible']('l', 'dl')).toBe(true);
      expect(service['areUnitsCompatible']('cl', 'l')).toBe(true);
    });

    it('should return true for compatible weight units', () => {
      expect(service['areUnitsCompatible']('g', 'kg')).toBe(true);
    });

    it('should return true for same units', () => {
      expect(service['areUnitsCompatible']('dl', 'dl')).toBe(true);
      expect(service['areUnitsCompatible']('kpl', 'kpl')).toBe(true);
    });

    it('should return false for incompatible units', () => {
      expect(service['areUnitsCompatible']('dl', 'g')).toBe(false);
      expect(service['areUnitsCompatible']('kpl', 'l')).toBe(false);
    });

    it('should return false for empty units', () => {
      expect(service['areUnitsCompatible']('', 'dl')).toBe(false);
      expect(service['areUnitsCompatible']('dl', '')).toBe(false);
    });
  });

  describe('convertToBaseUnit', () => {
    it('should convert volume units to ml', () => {
      expect(service['convertToBaseUnit'](1, 'l')).toBe(1000);
      expect(service['convertToBaseUnit'](1, 'dl')).toBe(100);
      expect(service['convertToBaseUnit'](1, 'cl')).toBe(10);
      expect(service['convertToBaseUnit'](1, 'ml')).toBe(1);
    });

    it('should convert weight units to g', () => {
      expect(service['convertToBaseUnit'](1, 'kg')).toBe(1000);
      expect(service['convertToBaseUnit'](1, 'g')).toBe(1);
    });

    it('should handle unknown units', () => {
      expect(service['convertToBaseUnit'](5, 'unknown')).toBe(5);
    });
  });

  describe('convertToPreferredUnit', () => {
    it('should convert large volumes to liters', () => {
      const result = service['convertToPreferredUnit'](1500, 'ml');
      expect(result).toBe('1,5 l');
    });

    it('should convert large weights to kilograms', () => {
      const result = service['convertToPreferredUnit'](1500, 'g');
      expect(result).toBe('1,5 kg');
    });

    it('should keep small amounts in original unit', () => {
      const result = service['convertToPreferredUnit'](500, 'ml');
      expect(result).toBe('500 ml');
    });

    it('should handle units without conversion', () => {
      const result = service['convertToPreferredUnit'](3, 'kpl');
      expect(result).toBe('3 kpl');
    });
  });

  describe('formatAmount', () => {
    it('should format decimal amounts with comma', () => {
      expect(service['formatAmount'](1.5, 'dl')).toBe('1,5 dl');
      expect(service['formatAmount'](0.75, 'kg')).toBe('0,75 kg');
    });

    it('should round whole number units', () => {
      expect(service['formatAmount'](2.7, 'kpl')).toBe('3 kpl');
      expect(service['formatAmount'](1.2, 'pala')).toBe('1 pala');
    });

    it('should handle small decimal amounts', () => {
      expect(service['formatAmount'](0.125, 'dl')).toBe('0,125 dl');
    });

    it('should handle amounts without units', () => {
      expect(service['formatAmount'](3, '')).toBe('3');
    });
  });

  describe('mergeAmounts', () => {
    it('should merge compatible volume units', () => {
      const result = service.mergeAmounts('1 dl', '500 ml');
      expect(result).toBe('6 dl');
    });

    it('should merge compatible weight units', () => {
      const result = service.mergeAmounts('500 g', '1 kg');
      expect(result).toBe('1,5 kg');
    });

    it('should merge same units', () => {
      const result = service.mergeAmounts('2 dl', '3 dl');
      expect(result).toBe('5 dl');
    });

    it('should merge numbers directly followed by units', () => {
      const result = service.mergeAmounts('15kpl', '15kpl');
      expect(result).toBe('30 kpl');
    });

    it('should merge mixed format units', () => {
      const result = service.mergeAmounts('15 kpl', '15kpl');
      expect(result).toBe('30 kpl');
    });

    it('should merge ingredients without measurement units', () => {
      const result = service.mergeAmounts('1', '1');
      expect(result).toBe('2');
    });

    it('should handle fractions', () => {
      const result = service.mergeAmounts('1/2 dl', '1/4 dl');
      expect(result).toBe('0,75 dl');
    });

    it('should concatenate incompatible units', () => {
      const result = service.mergeAmounts('1 dl', '2 kpl');
      expect(result).toBe('1 dl + 2 kpl');
    });

    it('should handle empty amounts', () => {
      expect(service.mergeAmounts('', '2 dl')).toBe('2 dl');
      expect(service.mergeAmounts('1 dl', '')).toBe('1 dl');
      expect(service.mergeAmounts('', '')).toBe('');
    });

    it('should handle unparseable amounts', () => {
      const result = service.mergeAmounts('some text', '2 dl');
      expect(result).toBe('some text + 2 dl');
    });
  });

  describe('canMerge', () => {
    it('should return true for same item', () => {
      const ingredient1 = new Ingredient(uuidv4(), mockItem1, '1 dl');
      const ingredient2 = new Ingredient(uuidv4(), mockItem1, '2 dl');
      expect(service.canMerge(ingredient1, ingredient2)).toBe(true);
    });

    it('should return false for different items', () => {
      const ingredient1 = new Ingredient(uuidv4(), mockItem1, '1 dl');
      const ingredient2 = new Ingredient(uuidv4(), mockItem2, '2 dl');
      expect(service.canMerge(ingredient1, ingredient2)).toBe(false);
    });
  });

  describe('mergeIngredients', () => {
    it('should return new ingredients when no existing ingredients', () => {
      const newIngredients = [
        new Ingredient(uuidv4(), mockItem1, '1 dl'),
        new Ingredient(uuidv4(), mockItem2, '2 kpl')
      ];
      const result = service.mergeIngredients([], newIngredients);
      expect(result).toEqual(newIngredients);
    });

    it('should return existing ingredients when no new ingredients', () => {
      const existingIngredients = [
        new Ingredient(uuidv4(), mockItem1, '1 dl'),
        new Ingredient(uuidv4(), mockItem2, '2 kpl')
      ];
      const result = service.mergeIngredients(existingIngredients, []);
      expect(result).toEqual(existingIngredients);
    });

    it('should merge ingredients with same item', () => {
      const existingIngredients = [
        new Ingredient(uuidv4(), mockItem1, '1 dl')
      ];
      const newIngredients = [
        new Ingredient(uuidv4(), mockItem1, '2 dl')
      ];
      const result = service.mergeIngredients(existingIngredients, newIngredients);
      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe('3 dl');
      expect(result[0].item.uuid).toBe(mockItem1.uuid);
    });

    it('should add new ingredients when no matching items', () => {
      const existingIngredients = [
        new Ingredient(uuidv4(), mockItem1, '1 dl')
      ];
      const newIngredients = [
        new Ingredient(uuidv4(), mockItem2, '2 kpl')
      ];
      const result = service.mergeIngredients(existingIngredients, newIngredients);
      expect(result).toHaveLength(2);
    });

    it('should preserve collection status from existing ingredients', () => {
      const existingIngredient = new Ingredient(uuidv4(), mockItem1, '1 dl');
      existingIngredient.isCollected = true;
      existingIngredient.isBeingCollected = true;
      
      const newIngredient = new Ingredient(uuidv4(), mockItem1, '2 dl');
      newIngredient.isCollected = false;
      
      const result = service.mergeIngredients([existingIngredient], [newIngredient]);
      expect(result[0].isCollected).toBe(true);
      expect(result[0].isBeingCollected).toBe(true);
    });

    it('should handle complex merging scenarios', () => {
      const existingIngredients = [
        new Ingredient(uuidv4(), mockItem1, '1 dl'),
        new Ingredient(uuidv4(), mockItem2, '2 kpl')
      ];
      const newIngredients = [
        new Ingredient(uuidv4(), mockItem1, '500 ml'), // Should merge with 1 dl
        new Ingredient(uuidv4(), mockItem3, '3 kpl')   // Should add as new
      ];
      const result = service.mergeIngredients(existingIngredients, newIngredients);
      expect(result).toHaveLength(3);
      
      const mergedMilk = result.find(ing => ing.item.uuid === mockItem1.uuid);
      expect(mergedMilk.amount).toBe('6 dl');
    });
  });

  describe('getMergeSummary', () => {
    it('should return correct summary for merged ingredients', () => {
      const existingIngredients = [
        new Ingredient(uuidv4(), mockItem1, '1 dl'),
        new Ingredient(uuidv4(), mockItem2, '2 kpl')
      ];
      const newIngredients = [
        new Ingredient(uuidv4(), mockItem1, '2 dl'), // Merged
        new Ingredient(uuidv4(), mockItem3, '3 kpl') // Added
      ];
      const summary = service.getMergeSummary(existingIngredients, newIngredients);
      expect(summary.merged).toBe(1);
      expect(summary.added).toBe(1);
      expect(summary.total).toBe(3);
    });

    it('should handle empty arrays', () => {
      const summary = service.getMergeSummary([], []);
      expect(summary.merged).toBe(0);
      expect(summary.added).toBe(0);
      expect(summary.total).toBe(0);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle null and undefined inputs gracefully', () => {
      expect(service.mergeIngredients(null, [])).toEqual([]);
      expect(service.mergeIngredients([], null)).toEqual([]);
      expect(service.mergeIngredients(undefined, [])).toEqual([]);
      expect(service.mergeIngredients([], undefined)).toEqual([]);
    });

    it('should handle very large numbers', () => {
      const result = service.mergeAmounts('999999 ml', '1 ml');
      expect(result).toBe('1000 l');
    });

    it('should handle very small numbers', () => {
      const result = service.mergeAmounts('0,001 l', '0,001 l');
      expect(result).toBe('2 ml');
    });

    it('should handle zero amounts', () => {
      const result = service.mergeAmounts('0 dl', '1 dl');
      expect(result).toBe('1 dl');
    });

    it('should handle negative numbers gracefully', () => {
      const result = service.mergeAmounts('-1 dl', '2 dl');
      expect(result).toBe('3 dl');
    });
  });

  describe('Real-world recipe merging scenarios', () => {
    it('should properly merge ingredients with amounts embedded in item names', () => {
      // Create mock items that simulate the real recipe scenario
      const mockItem1 = new SimpleItem('item1', 'karjalanpaisti lihaa', '--ion-color-category-meat', 1);
      const mockItem2 = new SimpleItem('item2', 'Keskikokoinen sipuli', '--ion-color-category-vegetables', 1);
      const mockItem3 = new SimpleItem('item3', 'maustepippuria', '--ion-color-category-pantry', 1);
      const mockItem4 = new SimpleItem('item4', 'keskikokoinen porkkana', '--ion-color-category-vegetables', 1);
      const mockItem5 = new SimpleItem('item5', 'vettä', '--ion-color-category-other', 1);
      const mockItem6 = new SimpleItem('item6', 'voita', '--ion-color-category-dairy', 1);
      const mockItem7 = new SimpleItem('item7', 'laakerinlehteä', '--ion-color-category-other', 1);
      const mockItem8 = new SimpleItem('item8', 'suolaa', '--ion-color-category-pantry', 1);

      // First batch of ingredients (first time adding to shopping list)
      const firstBatch = [
        new Ingredient('ing1', mockItem1, '800 g'), // n.800g karjalanpaisti lihaa
        new Ingredient('ing2', mockItem2, '1 kpl'), // 1 Keskikokoinen sipuli
        new Ingredient('ing3', mockItem3, '15 kpl'), // 10-15kpl maustepippuria (takes max)
        new Ingredient('ing4', mockItem4, '1 kpl'), // 1 keskikokoinen porkkana
        new Ingredient('ing5', mockItem5, ''), // vettä
        new Ingredient('ing6', mockItem6, ''), // voita
        new Ingredient('ing7', mockItem7, '2 kpl'), // 2kpl laakerinlehteä
        new Ingredient('ing8', mockItem8, '') // suolaa
      ];

      // Second batch of ingredients (second time adding to shopping list)
      const secondBatch = [
        new Ingredient('ing9', mockItem1, '800 g'), // n.800g karjalanpaisti lihaa
        new Ingredient('ing10', mockItem2, '1 kpl'), // 1 Keskikokoinen sipuli
        new Ingredient('ing11', mockItem3, '15 kpl'), // 10-15kpl maustepippuria
        new Ingredient('ing12', mockItem4, '1 kpl'), // 1 keskikokoinen porkkana
        new Ingredient('ing13', mockItem5, ''), // vettä
        new Ingredient('ing14', mockItem6, ''), // voita
        new Ingredient('ing15', mockItem7, '2 kpl'), // 2kpl laakerinlehteä
        new Ingredient('ing16', mockItem8, '') // suolaa
      ];

      // Merge the ingredients
      const mergedIngredients = service.mergeIngredients(firstBatch, secondBatch);

      // Should have 8 unique ingredients (not 16)
      expect(mergedIngredients).toHaveLength(8);

      // Check that amounts are properly merged (not concatenated)
      const meatIngredient = mergedIngredients.find(ing => ing.item.uuid === 'item1');
      expect(meatIngredient.amount).toBe('1,6 kg'); // 800g + 800g = 1600g = 1.6kg

      const onionIngredient = mergedIngredients.find(ing => ing.item.uuid === 'item2');
      expect(onionIngredient.amount).toBe('2 kpl'); // 1 + 1 = 2

      const pepperIngredient = mergedIngredients.find(ing => ing.item.uuid === 'item3');
      expect(pepperIngredient.amount).toBe('30 kpl'); // 15 + 15 = 30

      const carrotIngredient = mergedIngredients.find(ing => ing.item.uuid === 'item4');
      expect(carrotIngredient.amount).toBe('2 kpl'); // 1 + 1 = 2

      const waterIngredient = mergedIngredients.find(ing => ing.item.uuid === 'item5');
      expect(waterIngredient.amount).toBe(''); // Empty amounts stay empty

      const butterIngredient = mergedIngredients.find(ing => ing.item.uuid === 'item6');
      expect(butterIngredient.amount).toBe(''); // Empty amounts stay empty

      const bayLeafIngredient = mergedIngredients.find(ing => ing.item.uuid === 'item7');
      expect(bayLeafIngredient.amount).toBe('4 kpl'); // 2 + 2 = 4

      const saltIngredient = mergedIngredients.find(ing => ing.item.uuid === 'item8');
      expect(saltIngredient.amount).toBe(''); // Empty amounts stay empty
    });

    it('should handle concatenated amounts gracefully', () => {
      const mockItem = new SimpleItem('item1', 'test item', '--ion-color-category-other', 1);
      
      // Simulate a concatenated amount that might occur due to a bug
      const ingredient1 = new Ingredient('ing1', mockItem, '2 kpl');
      const ingredient2 = new Ingredient('ing2', mockItem, '2 kpl2 kpl'); // Concatenated amount
      
      const mergedIngredients = service.mergeIngredients([ingredient1], [ingredient2]);
      
      // Should handle the concatenated amount gracefully
      expect(mergedIngredients).toHaveLength(1);
      expect(mergedIngredients[0].amount).toBe('4 kpl'); // Should parse and add correctly
    });
  });
});
