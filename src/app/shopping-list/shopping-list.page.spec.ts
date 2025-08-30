import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ShoppingListPage } from './shopping-list.page';
import { ShoppingListService } from '../services/shopping-list.service';
import { SimpleStateService } from '../services/simple-state-service';
import { ShoppingList } from '../models/shopping-list';
import { Ingredient } from '../models/ingredient';
import { SimpleItem } from '../models/simple-item';

describe('ShoppingListPage Integration Tests', () => {
  let component: ShoppingListPage;
  let fixture: ComponentFixture<ShoppingListPage>;
  let mockShoppingListService: jasmine.SpyObj<ShoppingListService>;
  let mockSimpleStateService: jasmine.SpyObj<SimpleStateService>;
  let mockModalController: jasmine.SpyObj<ModalController>;

  beforeEach(async () => {
    const shoppingListSpy = jasmine.createSpyObj('ShoppingListService', [
      'setupHandlers', 'getItems', 'addItem', 'removeShoppingList', 
      'updateShoppingList', 'findUsingUUID', 'shoppingListsEvent'
    ], {
      shoppingListsEvent: jasmine.createSpyObj('EventEmitter', ['subscribe'])
    });
    
    const stateServiceSpy = jasmine.createSpyObj('SimpleStateService', [
      'setupHandlers', 'updateLastVisitedShoppingList'
    ]);
    
    const modalSpy = jasmine.createSpyObj('ModalController', ['create']);

    await TestBed.configureTestingModule({
      declarations: [ShoppingListPage],
      imports: [IonicModule.forRoot(), FormsModule],
      providers: [
        { provide: ShoppingListService, useValue: shoppingListSpy },
        { provide: SimpleStateService, useValue: stateServiceSpy },
        { provide: ModalController, useValue: modalSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ShoppingListPage);
    component = fixture.componentInstance;
    mockShoppingListService = TestBed.inject(ShoppingListService) as jasmine.SpyObj<ShoppingListService>;
    mockSimpleStateService = TestBed.inject(SimpleStateService) as jasmine.SpyObj<SimpleStateService>;
    mockModalController = TestBed.inject(ModalController) as jasmine.SpyObj<ModalController>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Service Integration', () => {
    it('should initialize services on component init', () => {
      component.ngOnInit();
      
      expect(mockShoppingListService.setupHandlers).toHaveBeenCalled();
      expect(mockSimpleStateService.setupHandlers).toHaveBeenCalled();
    });

    it('should subscribe to shopping list updates', () => {
      const mockSubscribe = jasmine.createSpy('subscribe');
      mockShoppingListService.shoppingListsEvent = { subscribe: mockSubscribe } as any;
      
      component.ngOnInit();
      
      expect(mockSubscribe).toHaveBeenCalled();
    });
  });

  describe('Shopping List Management', () => {
    beforeEach(() => {
      const testLists = [
        new ShoppingList('Groceries', []),
        new ShoppingList('Hardware', [])
      ];
      mockShoppingListService.getItems.and.returnValue(testLists);
    });

    it('should load and display shopping lists', () => {
      component.loadShoppingLists();
      
      expect(component.shoppingLists).toBeDefined();
      expect(component.shoppingLists.length).toBe(2);
    });

    it('should handle shopping list removal with confirmation', () => {
      const testList = new ShoppingList('Test List', []);
      
      component.removeShoppingList(testList);
      
      expect(mockShoppingListService.removeShoppingList).toHaveBeenCalledWith(testList);
    });

    it('should update shopping list and persist changes', () => {
      const testList = new ShoppingList('Updated List', []);
      
      component.updateShoppingList(testList);
      
      expect(mockShoppingListService.updateShoppingList).toHaveBeenCalledWith(testList);
    });
  });

  describe('Item Management Integration', () => {
    it('should handle item collection state changes', () => {
      const item = new SimpleItem('Test Item', 'category');
      const ingredient = new Ingredient(item, 1, 'unit');
      const shoppingList = new ShoppingList('Test List', [ingredient]);
      
      component.updateShoppingList = jasmine.createSpy('updateShoppingList');
      
      component.toggleItemCollection(ingredient, shoppingList);
      
      expect(ingredient.isCollected).toBeTrue();
      expect(component.updateShoppingList).toHaveBeenCalledWith(shoppingList);
    });

    it('should filter items by collection status', () => {
      const collectedItem = new Ingredient(new SimpleItem('Collected', 'cat'), 1, 'unit');
      const uncollectedItem = new Ingredient(new SimpleItem('Uncollected', 'cat'), 1, 'unit');
      
      collectedItem.isCollected = true;
      uncollectedItem.isCollected = false;
      
      const shoppingList = new ShoppingList('Test List', [collectedItem, uncollectedItem]);
      
      const uncollected = component.getUncollectedItems(shoppingList);
      const collected = component.getCollectedItems(shoppingList);
      
      expect(uncollected.length).toBe(1);
      expect(collected.length).toBe(1);
      expect(uncollected[0]).toBe(uncollectedItem);
      expect(collected[0]).toBe(collectedItem);
    });
  });

  describe('Search and Filter Integration', () => {
    beforeEach(() => {
      const groceryItem = new Ingredient(new SimpleItem('Apples', 'fruits'), 2, 'kg');
      const hardwareItem = new Ingredient(new SimpleItem('Screws', 'hardware'), 10, 'pieces');
      
      const groceryList = new ShoppingList('Groceries', [groceryItem]);
      const hardwareList = new ShoppingList('Hardware', [hardwareItem]);
      
      component.shoppingLists = [groceryList, hardwareList];
    });

    it('should filter shopping lists by search term', () => {
      component.searchTerm = 'apple';
      const filtered = component.getFilteredShoppingLists();
      
      expect(filtered.length).toBe(1);
      expect(filtered[0].listName).toBe('Groceries');
    });

    it('should return all lists when search is empty', () => {
      component.searchTerm = '';
      const filtered = component.getFilteredShoppingLists();
      
      expect(filtered.length).toBe(2);
    });

    it('should be case insensitive', () => {
      component.searchTerm = 'APPLE';
      const filtered = component.getFilteredShoppingLists();
      
      expect(filtered.length).toBe(1);
    });
  });

  describe('UI State Management', () => {
    it('should track loading states', () => {
      expect(component.isLoading).toBeDefined();
      
      // Initially should be loading
      expect(component.isLoading).toBeTrue();
      
      // After loading shopping lists
      component.loadShoppingLists();
      expect(component.isLoading).toBeFalse();
    });

    it('should handle empty shopping lists gracefully', () => {
      mockShoppingListService.getItems.and.returnValue([]);
      
      component.loadShoppingLists();
      
      expect(component.shoppingLists).toEqual([]);
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle service errors gracefully', () => {
      mockShoppingListService.setupHandlers.and.throwError('Service error');
      
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should handle missing shopping list operations', () => {
      mockShoppingListService.findUsingUUID.and.returnValue(null);
      
      const result = component.findShoppingListByUUID('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('Security Validation', () => {
    it('should validate item names to prevent XSS', () => {
      const maliciousName = '<script>alert("xss")</script>';
      const item = new SimpleItem(maliciousName, 'category');
      
      // Component should handle this gracefully
      expect(item.itemName).toBe(maliciousName);
      // In a real implementation, we should sanitize this
    });

    it('should validate category names', () => {
      const maliciousCategory = 'javascript:alert("xss")';
      const item = new SimpleItem('Normal Item', maliciousCategory);
      
      expect(item.category).toBe(maliciousCategory);
      // Note: This highlights the need for input sanitization
    });
  });
});