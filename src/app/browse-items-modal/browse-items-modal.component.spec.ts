import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule, ModalController } from '@ionic/angular';
import { BrowseItemsModalComponent } from './browse-items-modal.component';
import { SimpleItemService } from '../services/simple-item.service';
import { EventEmitter } from '@angular/core';

describe('BrowseItemsModalComponent', () => {
  let component: BrowseItemsModalComponent;
  let fixture: ComponentFixture<BrowseItemsModalComponent>;
  let mockModalController: jasmine.SpyObj<ModalController>;
  let mockSimpleItemService: jasmine.SpyObj<SimpleItemService>;

  beforeEach(waitForAsync(() => {
    const modalSpy = jasmine.createSpyObj('ModalController', ['dismiss']);
    const itemServiceSpy = jasmine.createSpyObj('SimpleItemService', ['getItems', 'updateItem']);
    itemServiceSpy.newItemEvent = new EventEmitter();

    TestBed.configureTestingModule({
      declarations: [BrowseItemsModalComponent],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: ModalController, useValue: modalSpy },
        { provide: SimpleItemService, useValue: itemServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BrowseItemsModalComponent);
    component = fixture.componentInstance;
    mockModalController = TestBed.inject(ModalController) as jasmine.SpyObj<ModalController>;
    mockSimpleItemService = TestBed.inject(SimpleItemService) as jasmine.SpyObj<SimpleItemService>;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should dismiss modal', () => {
    component.dismiss();
    expect(mockModalController.dismiss).toHaveBeenCalled();
  });

  it('should change sort mode', () => {
    component.onSortModeChange('alphabetic');
    expect(component.currentSortMode).toBe('alphabetic');
  });
});
