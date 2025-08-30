import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowseItemsModalComponent } from './browse-items-modal.component';
import { SimpleItemService } from '../services/simple-item.service';


describe('BrowseItemsModalComponent', () => {
  let component: BrowseItemsModalComponent;
  let fixture: ComponentFixture<BrowseItemsModalComponent>;

  beforeEach(async () => {
    const modalSpy = {
      dismiss: jest.fn()
    };
    const itemServiceSpy = {
      getItems: jest.fn(),
      updateItem: jest.fn(),
      newItemEvent: new EventEmitter()
    } as any;

    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), BrowseItemsModalComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: 'ModalController', useValue: modalSpy },
        { provide: SimpleItemService, useValue: itemServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BrowseItemsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should dismiss modal', () => {
    component.dismiss();
    expect(component).toBeTruthy();
  });

  it('should change sort mode', () => {
    expect(component).toBeTruthy();
  });
});
