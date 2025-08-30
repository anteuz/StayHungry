import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IngredientOverlayPage } from './ingredient-overlay.page';
import { ShoppingListService } from '../services/shopping-list.service';
import { SimpleItemService } from '../services/simple-item.service';
import { ModalController, NavParams } from '@ionic/angular';
import { ThemeService } from '../services/theme.service';

describe('IngredientOverlayPage', () => {
  let component: IngredientOverlayPage;
  let fixture: ComponentFixture<IngredientOverlayPage>;
  let mockShoppingListService: jest.Mocked<ShoppingListService>;
  let mockSimpleItemService: jest.Mocked<SimpleItemService>;
  let mockModalController: any;
  let mockNavParams: any;
  let mockThemeService: any;

  beforeEach(async () => {
    mockShoppingListService = {
      getItems: jest.fn(),
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateItem: jest.fn()
    } as any;

    mockSimpleItemService = {
      filterItems: jest.fn().mockReturnValue([]),
      getItems: jest.fn().mockReturnValue([])
    } as any;

    mockModalController = {
      dismiss: jest.fn()
    };

    mockNavParams = {
      get: jest.fn().mockReturnValue('insert')
    };

    mockThemeService = {
      getAvailableCategories: jest.fn().mockReturnValue([]),
      getCategoryKey: jest.fn().mockReturnValue('other')
    };

    await TestBed.configureTestingModule({
      declarations: [IngredientOverlayPage],
      imports: [IonicModule.forRoot(), HttpClientTestingModule],
      providers: [
        { provide: ShoppingListService, useValue: mockShoppingListService },
        { provide: SimpleItemService, useValue: mockSimpleItemService },
        { provide: ModalController, useValue: mockModalController },
        { provide: NavParams, useValue: mockNavParams },
        { provide: ThemeService, useValue: mockThemeService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(IngredientOverlayPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
