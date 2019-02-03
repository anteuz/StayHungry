import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShoppingListTransferComponent } from './shopping-list-transfer.component';

describe('ShoppingListTransferComponent', () => {
  let component: ShoppingListTransferComponent;
  let fixture: ComponentFixture<ShoppingListTransferComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShoppingListTransferComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShoppingListTransferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
