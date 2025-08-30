import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, NavParams, PopoverController, ModalController } from '@ionic/angular';
import { CartPopoverComponent } from './cart-popover.component';
import { Cart } from '../models/cart';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';


describe('CartPopoverComponent', () => {
  let component: CartPopoverComponent;
  let fixture: ComponentFixture<CartPopoverComponent>;
  let mockNavParams: any;
  let mockPopoverController: any;
  let mockModalController: any;

  beforeEach(async () => {
    const mockCart: Cart = {
      uuid: 'test-cart-uuid',
      recipes: []
    };

    mockNavParams = {
      get: jest.fn().mockReturnValue(mockCart)
    };

    mockPopoverController = {
      dismiss: jest.fn()
    };

    mockModalController = {
      create: jest.fn().mockResolvedValue({
        present: jest.fn(),
        onDidDismiss: jest.fn().mockResolvedValue({ data: undefined })
      })
    };

    await TestBed.configureTestingModule({
      imports: [CommonModule, IonicModule.forRoot(), CartPopoverComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: NavParams, useValue: mockNavParams },
        { provide: PopoverController, useValue: mockPopoverController },
        { provide: ModalController, useValue: mockModalController }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CartPopoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
