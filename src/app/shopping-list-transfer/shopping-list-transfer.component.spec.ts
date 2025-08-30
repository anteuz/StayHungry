import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, NavParams, ModalController } from '@ionic/angular';
import { ShoppingListTransferComponent } from './shopping-list-transfer.component';
import { SimpleStateService } from '../services/simple-state-service';
import { ShoppingListService } from '../services/shopping-list.service';
import { Router } from '@angular/router';
import { Cart } from '../models/cart';


describe('ShoppingListTransferComponent', () => {
  let component: ShoppingListTransferComponent;
  let fixture: ComponentFixture<ShoppingListTransferComponent>;
  let mockNavParams: any;
  let mockModalController: any;
  let mockSimpleStateService: any;
  let mockShoppingListService: any;
  let mockRouter: any;

  beforeEach(async () => {
    const mockCart: Cart = {
      uuid: 'test-cart-uuid',
      recipes: []
    };

    mockNavParams = {
      get: jest.fn().mockReturnValue(mockCart),
      data: {}
    };

    mockModalController = {
      dismiss: jest.fn()
    };

    mockSimpleStateService = {
      getAppState: jest.fn().mockResolvedValue({ lastVisited_ShoppingList: 'test-id' })
    };

    mockShoppingListService = {
      findUsingUUID: jest.fn().mockReturnValue({ items: [] }),
      updateShoppingList: jest.fn()
    };

    mockRouter = {
      navigate: jest.fn().mockResolvedValue(true)
    };

    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), ShoppingListTransferComponent],
      providers: [
        { provide: NavParams, useValue: mockNavParams },
        { provide: ModalController, useValue: mockModalController },
        { provide: SimpleStateService, useValue: mockSimpleStateService },
        { provide: ShoppingListService, useValue: mockShoppingListService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ShoppingListTransferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
