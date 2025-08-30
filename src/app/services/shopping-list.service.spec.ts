import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Database } from '@angular/fire/database';
import { ShoppingListService } from './shopping-list.service';
import { AuthService } from './auth.service';
import { ShoppingList } from '../models/shopping-list';
import { Ingredient } from '../models/ingredient';
import { SimpleItem } from '../models/simple-item';


describe('ShoppingListService Integration Tests', () => {
  let service: ShoppingListService;
  let mockAuthService: any;
  let mockDatabase: any;

  beforeEach(() => {
    mockAuthService = { isAuthenticated: jest.fn(), getUserUID: jest.fn() };
    mockDatabase = {} as any;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ShoppingListService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: Database, useValue: mockDatabase }
      ]
    });

    service = TestBed.inject(ShoppingListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Security Tests', () => {
    it('should throw error when trying to setup handlers without authentication', () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);
      expect(() => service.setupHandlers()).toThrow(/user not authenticated/);
    });

    it('should throw error when user has no UID', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getUserUID.mockReturnValue(null);
      expect(() => service.setupHandlers()).toThrow(/no user UID/);
    });

    it('should reject database updates when user is not authenticated', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);
      await expect(service.updateDatabase()).rejects.toBeDefined();
    });

    it('should ensure user-specific database paths', () => {
      const testUID = 'user-123';
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getUserUID.mockReturnValue(testUID);

      // Spy on console but ignore output
      jest.spyOn(console, 'log').mockImplementation(() => {});

      service.setupHandlers();

      expect((service as any)['DATABASE_PATH']).toBe(`users/${testUID}/shopping-list`);
    });
  });

  describe('Shopping List Operations', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getUserUID.mockReturnValue('test-user-123');
    });

    it('should initialize empty shopping lists array', () => {
      const result = service.getItems();
      expect(result).toEqual([]);
    });

    it('should add new shopping list', () => {
      const shoppingList = new ShoppingList('Test List', []);
      service.addItem(shoppingList);
      const items = service.getItems();
      expect(items).toContain(shoppingList);
      expect(items.length).toBe(1);
    });

    it('should add ingredient to existing shopping list', () => {
      const item = new SimpleItem('uuid', 'Test Ingredient', 'test-category');
      const ingredient = new Ingredient(item, 2, 'kg');
      const shoppingList = new ShoppingList('Test List', []);
      service.addItem(shoppingList);
      service.addItemToShoppingList(shoppingList, ingredient);
      const items = service.getItems();
      expect(items[0].items).toContain(ingredient);
    });

    it('should increment amount when adding existing ingredient', () => {
      const item = new SimpleItem('uuid', 'Test Ingredient', 'test-category');
      const ingredient1 = new Ingredient(item, 2, 'kg');
      const ingredient2 = new Ingredient(item, 3, 'kg');
      const shoppingList = new ShoppingList('Test List', [ingredient1]);
      service.addItemToShoppingList(shoppingList, ingredient2);
      const foundIngredient = service.findUsingIngredientName(shoppingList, 'Test Ingredient');
      expect(foundIngredient.amount).toBe(5);
    });

    it('should remove shopping list correctly', () => {
      const shoppingList1 = new ShoppingList('List 1', []);
      const shoppingList2 = new ShoppingList('List 2', []);
      service.addItem(shoppingList1);
      service.addItem(shoppingList2);
      service.removeShoppingList(shoppingList1);
      const items = service.getItems();
      expect(items).not.toContain(shoppingList1);
      expect(items).toContain(shoppingList2);
      expect(items.length).toBe(1);
    });
  });

  describe('Data Validation and Integrity', () => {
    it('should handle null/undefined shopping list updates gracefully', async () => {
      await expect(service.updateShoppingList(null as any)).rejects.toHaveProperty('message', 'Invalid data or no shopping lists loaded');
    });

    it('should validate shopping list UUID exists', async () => {
      const invalidList = { uuid: null, listName: 'Test' } as unknown as ShoppingList;
      await expect(service.updateShoppingList(invalidList)).rejects.toHaveProperty('message', 'Invalid data or no shopping lists loaded');
    });

    it('should find shopping lists by UUID correctly', () => {
      const uuid1 = 'uuid-1';
      const uuid2 = 'uuid-2';
      const list1 = new ShoppingList('List 1', []);
      const list2 = new ShoppingList('List 2', []);
      list1.uuid = uuid1;
      list2.uuid = uuid2;
      service.addItem(list1);
      service.addItem(list2);
      expect(service.findUsingUUID(uuid1)).toBe(list1);
      expect(service.findUsingUUID(uuid2)).toBe(list2);
      expect(service.findUsingUUID('non-existent')).toBeNull();
    });
  });

  describe('Event Emission Integration', () => {
    it('should emit shopping lists changes', (done) => {
      service.shoppingListsEvent.subscribe(lists => {
        expect(Array.isArray(lists)).toBe(true);
        done();
      });
      (service as any)['shoppingLists'] = [];
      service.shoppingListsEvent.emit([]);
    });
  });
});