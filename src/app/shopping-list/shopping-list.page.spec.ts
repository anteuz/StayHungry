import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ShoppingListPage } from './shopping-list.page';
import { ShoppingListService } from '../services/shopping-list.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { SimpleStateService } from '../services/simple-state-service';
import { ThemeService } from '../services/theme.service';
import { EventEmitter } from '@angular/core';
import { ThemeToggleComponent } from '../shared/theme-toggle.component';
import { IsCollectedPipe } from '../shared/iscollected.pipe';
import { ObjectNamePipe } from '../shared/object-name.pipe';
import { StyledButtonComponent } from '../shared/styled-button.component';


describe('ShoppingListPage', () => {
  let component: ShoppingListPage;
  let fixture: ComponentFixture<ShoppingListPage>;
  let mockShoppingListService: any;
  let mockActivatedRoute: any;
  let mockRouter: any;
  let mockModalController: any;
  let mockSimpleStateService: any;
  let mockThemeService: any;

  beforeEach(async () => {
    const shoppingListsEvent = new EventEmitter<any[]>();

    mockShoppingListService = {
      getItems: jest.fn().mockReturnValue([]),
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateItem: jest.fn(),
      findUsingUUID: jest.fn(),
      shoppingListsEvent: shoppingListsEvent
    };

    mockActivatedRoute = {
      params: {
        subscribe: jest.fn()
      }
    };

    mockRouter = {
      navigate: jest.fn().mockResolvedValue(true)
    };

    mockModalController = {
      create: jest.fn()
    };

    mockSimpleStateService = {
      getAppState: jest.fn().mockResolvedValue({ lastVisited_ShoppingList: 'test-id' }),
      updateLastVisitedShoppingList: jest.fn()
    };

    mockThemeService = {
      getCurrentTheme: jest.fn().mockReturnValue('light')
    };

    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), ShoppingListPage, ThemeToggleComponent, IsCollectedPipe, ObjectNamePipe, StyledButtonComponent],
      providers: [
        { provide: ShoppingListService, useValue: mockShoppingListService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: ModalController, useValue: mockModalController },
        { provide: SimpleStateService, useValue: mockSimpleStateService },
        { provide: ThemeService, useValue: mockThemeService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ShoppingListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});