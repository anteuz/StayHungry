import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ShoppingListItemsComponent } from './shopping-list-items.component';
import { ShoppingListService } from '../services/shopping-list.service';
import { Router } from '@angular/router';
import { ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { EventEmitter } from '@angular/core';

describe('ShoppingListItemsComponent', () => {
  let component: ShoppingListItemsComponent;
  let fixture: ComponentFixture<ShoppingListItemsComponent>;
  let mockShoppingListService: jest.Mocked<ShoppingListService>;
  let mockRouter: jest.Mocked<Router>;

  beforeEach(async () => {
    const shoppingListsEvent = new EventEmitter<any[]>();

    mockShoppingListService = {
      getItems: jest.fn(),
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateItem: jest.fn(),
      removeShoppingList: jest.fn(),
      updateShoppingList: jest.fn(),
      shoppingListsEvent: shoppingListsEvent
    } as any;

    mockRouter = {
      navigate: jest.fn().mockResolvedValue(true)
    } as any;

    await TestBed.configureTestingModule({
      declarations: [ShoppingListItemsComponent],
      imports: [IonicModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: ShoppingListService, useValue: mockShoppingListService },
        { provide: Router, useValue: mockRouter },
        { provide: ChangeDetectorRef, useValue: { detectChanges: jest.fn() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ShoppingListItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
