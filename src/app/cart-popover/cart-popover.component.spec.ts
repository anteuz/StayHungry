import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CartPopoverComponent } from './cart-popover.component';

describe('CartPopoverComponent', () => {
  let component: CartPopoverComponent;
  let fixture: ComponentFixture<CartPopoverComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CartPopoverComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CartPopoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
