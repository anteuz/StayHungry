import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ShoppingListPage } from './shopping-list.page';
import { ShoppingListService } from '../services/shopping-list.service';
import { SimpleStateService } from '../services/simple-state-service';
import { ThemeService } from '../services/theme.service';
import { IngredientMergerService } from '../services/ingredient-merger.service';
import { CategoryDetectionService } from '../services/category-detection.service';
import { DragDropService } from '../services/drag-drop.service';
import { ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { Ingredient } from '../models/ingredient';
import { SimpleItem } from '../models/simple-item';

describe('ShoppingListPage', () => {
  let component: ShoppingListPage;
  let fixture: ComponentFixture<ShoppingListPage>;
  let mockShoppingListService: jest.Mocked<ShoppingListService>;
  let mockStateService: jest.Mocked<SimpleStateService>;
  let mockThemeService: jest.Mocked<ThemeService>;
  let mockIngredientMergerService: jest.Mocked<IngredientMergerService>;
  let mockCategoryDetectionService: jest.Mocked<CategoryDetectionService>;
  let mockDragDropService: jest.Mocked<DragDropService>;
  let mockToastController: jest.Mocked<ToastController>;

  beforeEach(async () => {
    mockShoppingListService = {
      shoppingListsEvent: of([]),
      getItems: jest.fn().mockReturnValue([]),
      findUsingUUID: jest.fn(),
      updateShoppingList: jest.fn().mockResolvedValue(undefined)
    } as any;

    mockStateService = {
      getAppState: jest.fn().mockResolvedValue({ lastVisited_ShoppingList: 'test-id' }),
      updateLastVisitedShoppingList: jest.fn()
    } as any;

    mockThemeService = {
      getCategoryVariable: jest.fn().mockReturnValue('--ion-color-category-fruits'),
      getCategoryKey: jest.fn().mockReturnValue('fruits'),
      getAvailableCategories: jest.fn().mockReturnValue([
        { key: 'fruits', name: 'Fruits', color: 'category-fruits', icon: 'nutrition' },
        { key: 'vegetables', name: 'Vegetables', color: 'category-vegetables', icon: 'leaf' }
      ])
    } as any;

    mockIngredientMergerService = {
      mergeIngredients: jest.fn().mockReturnValue([])
    } as any;

    mockCategoryDetectionService = {
      learnFromUserChange: jest.fn().mockResolvedValue(undefined)
    } as any;

    mockDragDropService = {
      startDrag: jest.fn(),
      stopDrag: jest.fn(),
      isCurrentlyDragging: jest.fn().mockReturnValue(false),
      getCurrentDragItem: jest.fn().mockReturnValue(null)
    } as any;

    mockToastController = {
      create: jest.fn().mockReturnValue({
        present: jest.fn().mockResolvedValue(undefined)
      })
    } as any;

    await TestBed.configureTestingModule({
      declarations: [ShoppingListPage],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: ShoppingListService, useValue: mockShoppingListService },
        { provide: SimpleStateService, useValue: mockStateService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: IngredientMergerService, useValue: mockIngredientMergerService },
        { provide: CategoryDetectionService, useValue: mockCategoryDetectionService },
        { provide: DragDropService, useValue: mockDragDropService },
        { provide: ToastController, useValue: mockToastController },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 'test-id' })
          }
        },
        {
          provide: Router,
          useValue: {
            navigate: jest.fn().mockResolvedValue(undefined)
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ShoppingListPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('drag and drop functionality', () => {
    it('should handle mouse down correctly', () => {
      const mockIngredient: Ingredient = {
        uuid: 'test-uuid',
        item: {
          uuid: 'item-uuid',
          itemName: 'Test Apple',
          itemColor: '--ion-color-category-fruits'
        } as SimpleItem,
        amount: '1',
        isCollected: false,
        isBeingCollected: false,
        isCollectedAsDefault: false
      };

      const mockMouseEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        clientX: 100,
        clientY: 200,
        target: {
          closest: jest.fn().mockReturnValue({
            classList: { add: jest.fn() },
            getBoundingClientRect: jest.fn().mockReturnValue({ left: 0, top: 0, width: 100, height: 50 }),
            querySelector: jest.fn().mockReturnValue({ innerHTML: '<span>Test Apple</span>' })
          })
        }
      } as any;

      component.onMouseDown(mockMouseEvent, mockIngredient, 'fruits', 0);

      expect(component.isDragging).toBe(true);
      expect(component.draggedItem).toBe(mockIngredient);
      expect(mockDragDropService.startDrag).toHaveBeenCalledWith(mockIngredient, 'fruits', 0);
    });

    it('should handle touch start correctly', () => {
      const mockIngredient: Ingredient = {
        uuid: 'test-uuid',
        item: {
          uuid: 'item-uuid',
          itemName: 'Test Apple',
          itemColor: '--ion-color-category-fruits'
        } as SimpleItem,
        amount: '1',
        isCollected: false,
        isBeingCollected: false,
        isCollectedAsDefault: false
      };

      const mockTouchEvent = {
        preventDefault: jest.fn(),
        touches: [{ clientX: 100, clientY: 200 }],
        target: {
          closest: jest.fn().mockReturnValue({
            classList: { add: jest.fn() },
            getBoundingClientRect: jest.fn().mockReturnValue({ left: 0, top: 0, width: 100, height: 50 }),
            querySelector: jest.fn().mockReturnValue({ innerHTML: '<span>Test Apple</span>' })
          })
        }
      } as any;

      component.onTouchStart(mockTouchEvent, mockIngredient, 'fruits', 0);

      expect(component.touchStartX).toBe(100);
      expect(component.touchStartY).toBe(200);
      expect(component.longPressTimeout).toBeTruthy();
      // Should not prevent default to allow click events to fire
      expect(mockTouchEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('should handle touch move correctly', () => {
      const mockTouchEvent = {
        preventDefault: jest.fn(),
        touches: [{ clientX: 120, clientY: 220 }]
      } as any;

      // Set up component state
      component.touchStartX = 100;
      component.touchStartY = 200;
      component.isDragging = false;
      component.isLongPress = false;

      component.onTouchMove(mockTouchEvent);

      // Should cancel long press due to movement
      expect(component.longPressTimeout).toBeNull();
    });

    it('should handle touch end correctly', () => {
      const mockTouchEvent = {
        preventDefault: jest.fn()
      } as any;

      // Set up component state
      component.isDragging = true;
      component.longPressTimeout = setTimeout(() => {}, 1000);

      component.onTouchEnd(mockTouchEvent);

      expect(component.longPressTimeout).toBeNull();
      expect(component.isLongPress).toBe(false);
    });

    it('should not prevent default on short touch (tap) for collection', () => {
      const mockTouchEvent = {
        preventDefault: jest.fn()
      } as any;

      // Set up component state for a short touch (tap)
      component.touchStartTime = Date.now() - 100; // 100ms ago (short touch)
      component.touchMoved = false;
      component.isDragging = false;

      component.onTouchEnd(mockTouchEvent);

      // Should not prevent default for short touches
      expect(mockTouchEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent default on long touch without movement', () => {
      const mockTouchEvent = {
        preventDefault: jest.fn()
      } as any;

      // Set up component state for a long touch
      component.touchStartTime = Date.now() - 500; // 500ms ago (long touch)
      component.touchMoved = false;
      component.isDragging = false;

      component.onTouchEnd(mockTouchEvent);

      // Should prevent default for long touches
      expect(mockTouchEvent.preventDefault).toHaveBeenCalled();
    });

    it('should handle keyboard escape to cancel drag', () => {
      const mockIngredient: Ingredient = {
        uuid: 'test-uuid',
        item: {
          uuid: 'item-uuid',
          itemName: 'Test Apple',
          itemColor: '--ion-color-category-fruits'
        } as SimpleItem,
        amount: '1',
        isCollected: false,
        isBeingCollected: false,
        isCollectedAsDefault: false
      };

      const mockKeyEvent = {
        key: 'Escape'
      } as KeyboardEvent;

      // Set up component state
      component.isDragging = true;
      component.draggedItem = mockIngredient;

      component.onKeyDown(mockKeyEvent);

      expect(component.isDragging).toBe(false);
      expect(component.draggedItem).toBeNull();
    });

    it('should not start drag on keyboard events other than escape', () => {
      const mockIngredient: Ingredient = {
        uuid: 'test-uuid',
        item: {
          uuid: 'item-uuid',
          itemName: 'Test Apple',
          itemColor: '--ion-color-category-fruits'
        } as SimpleItem,
        amount: '1',
        isCollected: false,
        isBeingCollected: false,
        isCollectedAsDefault: false
      };

      const mockKeyEvent = {
        key: 'Enter'
      } as KeyboardEvent;

      // Set up component state
      component.isDragging = true;
      component.draggedItem = mockIngredient;

      component.onKeyDown(mockKeyEvent);

      // Should still be dragging
      expect(component.isDragging).toBe(true);
      expect(component.draggedItem).toBe(mockIngredient);
    });

    it('should handle category change correctly', async () => {
      const mockIngredient: Ingredient = {
        uuid: 'test-uuid',
        item: {
          uuid: 'item-uuid',
          itemName: 'Test Apple',
          itemColor: '--ion-color-category-fruits'
        } as SimpleItem,
        amount: '1',
        isCollected: false,
        isBeingCollected: false,
        isCollectedAsDefault: false
      };

      component.shoppingList = {
        uuid: 'list-uuid',
        name: 'Test List',
        items: [mockIngredient]
      } as any;

      component.ingredients = [mockIngredient];

      await component.handleCategoryChange(mockIngredient, 'fruits', 'vegetables');

      expect(mockCategoryDetectionService.learnFromUserChange).toHaveBeenCalledWith(
        'Test Apple',
        'vegetables'
      );
      expect(mockShoppingListService.updateShoppingList).toHaveBeenCalled();
      expect(mockToastController.create).toHaveBeenCalled();
    });

    it('should not change category if source and target are the same', async () => {
      const mockIngredient: Ingredient = {
        uuid: 'test-uuid',
        item: {
          uuid: 'item-uuid',
          itemName: 'Test Apple',
          itemColor: '--ion-color-category-fruits'
        } as SimpleItem,
        amount: '1',
        isCollected: false,
        isBeingCollected: false,
        isCollectedAsDefault: false
      };

      await component.handleCategoryChange(mockIngredient, 'fruits', 'fruits');

      expect(mockCategoryDetectionService.learnFromUserChange).not.toHaveBeenCalled();
      expect(mockShoppingListService.updateShoppingList).not.toHaveBeenCalled();
    });
  });
});