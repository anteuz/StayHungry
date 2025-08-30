import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Database } from '@angular/fire/database';
import { Storage } from '@angular/fire/storage';

import { AuthService } from '../services/auth.service';
import { ShoppingListService } from '../services/shopping-list.service';
import { CloudStoreService } from '../services/cloud-store.service';
import { AuthGuard } from '../shared/auth-guard.service';
import { SignInPage } from '../sign-in/sign-in.page';
import { SignUpPage } from '../sign-up/sign-up.page';

import { ShoppingList } from '../models/shopping-list';
import { Ingredient } from '../models/ingredient';
import { SimpleItem } from '../models/simple-item';
import { UserStorageService } from '../services/user-storage.service';


describe('Complete User Workflow Integration Tests', () => {
  let authService: AuthService;
  let shoppingListService: ShoppingListService;
  let cloudStoreService: CloudStoreService;
  let authGuard: AuthGuard;
  let mockRouter: any;
  let mockAuth: any;
  let mockDatabase: any;
  let mockStorage: any;

  beforeEach(() => {
    mockRouter = { navigate: jest.fn().mockReturnValue({ catch: jest.fn() }) };
    mockAuth = { currentUser: null };
    mockDatabase = {};
    mockStorage = {};

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, IonicModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: jest.fn().mockReturnValue(false), getUserUID: jest.fn() } },
        ShoppingListService,
        CloudStoreService,
        AuthGuard,
        { provide: Router, useValue: mockRouter },
        { provide: Auth, useValue: mockAuth },
        { provide: Database, useValue: mockDatabase },
        { provide: Storage, useValue: mockStorage },
        { provide: UserStorageService, useValue: { clearUserData: jest.fn(), storeUserData: jest.fn() } }
      ]
    });

    authService = TestBed.inject(AuthService);
    shoppingListService = TestBed.inject(ShoppingListService);
    cloudStoreService = TestBed.inject(CloudStoreService);
    authGuard = TestBed.inject(AuthGuard);
  });

  describe('Complete Authentication Workflow', () => {
    it('should enforce authentication across all services', () => {
      expect(authService.isAuthenticated()).toBe(false);
      expect(!!authGuard.canActivate(null as any, null as any)).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/sign-in']);
      expect(() => shoppingListService.setupHandlers()).toThrow();
    });

    it('should allow full functionality after authentication', () => {
      const mockUser = { uid: 'test-123', getIdToken: () => Promise.resolve('token') } as any;
      (mockAuth as any).currentUser = mockUser;
      (authService.isAuthenticated as any).mockReturnValue(true);
      expect(!!authGuard.canActivate(null as any, null as any)).toBe(true);
      expect(authService.isAuthenticated()).toBe(true);
    });
  });

  describe('Shopping List Workflow Integration', () => {
    beforeEach(() => {
      const mockUser = { uid: 'test-user-123', getIdToken: () => Promise.resolve('token') } as any;
      (mockAuth as any).currentUser = mockUser;
      (authService.isAuthenticated as any).mockReturnValue(true);
      (authService.getUserUID as any).mockReturnValue('test-user-123');
      shoppingListService.setupHandlers();
    });

    it('should complete entire shopping list creation workflow', () => {
      const shoppingList = new ShoppingList('Weekly Groceries', []);
      shoppingListService.addItem(shoppingList);
      const item1 = new SimpleItem('uuid', 'Tomatoes', 'vegetables');
      const ingredient1 = new Ingredient(item1, 2, 'kg');
      shoppingListService.addItemToShoppingList(shoppingList, ingredient1);
      const lists = shoppingListService.getItems();
      expect(lists.length).toBe(1);
      expect(lists[0].items.length).toBe(1);
    });
  });
});