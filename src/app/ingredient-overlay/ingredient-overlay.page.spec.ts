import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IngredientOverlayPage } from './ingredient-overlay.page';

describe('IngredientOverlayPage', () => {
  let component: IngredientOverlayPage;
  let fixture: ComponentFixture<IngredientOverlayPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IngredientOverlayPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IngredientOverlayPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
