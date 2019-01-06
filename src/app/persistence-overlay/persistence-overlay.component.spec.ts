import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PersistenceOverlayComponent } from './persistence-overlay.component';

describe('PersistenceOverlayComponent', () => {
  let component: PersistenceOverlayComponent;
  let fixture: ComponentFixture<PersistenceOverlayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PersistenceOverlayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PersistenceOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
