import { SimpleItem } from './simple-item';
import { Ingredient } from './ingredient';
import { ShoppingList } from './shopping-list';

describe('Model Security Tests', () => {
  describe('SimpleItem Security', () => {
    it('should create simple item with valid data', () => {
      const item = new SimpleItem('uuid-123', 'Test Item', '#FF0000');
      expect(item.itemName).toBe('Test Item');
      expect(item.itemColor).toBe('#FF0000');
      expect(item.uuid).toBe('uuid-123');
    });

    it('should handle potential XSS in item names', () => {
      const xssName = '<script>alert("xss")</script>';
      const item = new SimpleItem('uuid-123', xssName, '#FF0000');
      expect(item.itemName).toBe(xssName);
      // Note: XSS protection should be handled at the UI layer
    });
  });

  describe('Ingredient Security', () => {
    it('should create ingredient with valid amounts', () => {
      const item = new SimpleItem('uuid-123', 'Test', '#FF0000');
      const ingredient = new Ingredient('ingredient-uuid', item, '5');
      expect(ingredient.amount).toBe('5');
      expect(ingredient.item).toBe(item);
    });

    it('should handle string amounts', () => {
      const item = new SimpleItem('uuid-123', 'Test', '#FF0000');
      const ingredient = new Ingredient('ingredient-uuid', item, '2.5 kg');
      expect(ingredient.amount).toBe('2.5 kg');
      // Note: Amount validation should be implemented in business logic
    });
  });

  describe('ShoppingList Security', () => {
    it('should create shopping list with valid data', () => {
      const list = new ShoppingList('list-uuid', 'Test List', []);
      expect(list.name).toBe('Test List');
      expect(list.items).toEqual([]);
      expect(list.uuid).toBe('list-uuid');
    });

    it('should handle malicious list names', () => {
      const maliciousName = 'javascript:alert("xss")';
      const list = new ShoppingList('list-uuid', maliciousName, []);
      expect(list.name).toBe(maliciousName);
      // Note: Sanitization should occur at the UI layer
    });

    it('should handle null items array', () => {
      const list = new ShoppingList('list-uuid', 'Test List', null);
      expect(list.items).toBeNull();
    });
  });
});