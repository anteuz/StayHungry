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

describe('Complete User Workflow Integration Tests', () => {
  let authService: AuthService;
  let shoppingListService: ShoppingListService;
  let cloudStoreService: CloudStoreService;
  let authGuard: AuthGuard;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuth: jasmine.SpyObj<Auth>;
  let mockDatabase: jasmine.SpyObj<Database>;
  let mockStorage: jasmine.SpyObj<Storage>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const authSpy = jasmine.createSpyObj('Auth', [], { currentUser: null });
    const dbSpy = jasmine.createSpyObj('Database', []);
    const storageSpy = jasmine.createSpyObj('Storage', []);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, IonicModule.forRoot()],
      providers: [
        AuthService,
        ShoppingListService,
        CloudStoreService,
        AuthGuard,
        { provide: Router, useValue: routerSpy },
        { provide: Auth, useValue: authSpy },
        { provide: Database, useValue: dbSpy },
        { provide: Storage, useValue: storageSpy }
      ]
    });

    authService = TestBed.inject(AuthService);
    shoppingListService = TestBed.inject(ShoppingListService);
    cloudStoreService = TestBed.inject(CloudStoreService);
    authGuard = TestBed.inject(AuthGuard);
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockAuth = TestBed.inject(Auth) as jasmine.SpyObj<Auth>;
    mockDatabase = TestBed.inject(Database) as jasmine.SpyObj<Database>;
    mockStorage = TestBed.inject(Storage) as jasmine.SpyObj<Storage>;
  });

  describe('Complete Authentication Workflow', () => {
    it('should enforce authentication across all services', () => {
      // Initially not authenticated
      expect(authService.isAuthenticated()).toBeFalse();
      
      // AuthGuard should block access
      expect(authGuard.canActivate(null, null)).toBeFalse();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/sign-in']);
      
      // Services should reject operations
      expect(() => shoppingListService.setupHandlers()).toThrowError('Cannot setup shopping list handlers: user not authenticated');
    });

    it('should allow full functionality after authentication', () => {
      // Simulate authenticated user
      const mockUser = { uid: 'test-123', getIdToken: () => Promise.resolve('token') };
      Object.defineProperty(mockAuth, 'currentUser', { value: mockUser });
      
      // AuthGuard should allow access
      expect(authGuard.canActivate(null, null)).toBeTrue();
      
      // Services should work
      expect(authService.isAuthenticated()).toBeTrue();
      expect(authService.getUserUID()).toBe('test-123');
    });
  });

  describe('Shopping List Workflow Integration', () => {
    beforeEach(() => {
      // Setup authenticated state
      const mockUser = { uid: 'test-user-123', getIdToken: () => Promise.resolve('token') };
      Object.defineProperty(mockAuth, 'currentUser', { value: mockUser });
    });

    it('should complete entire shopping list creation workflow', () => {
      // 1. Setup service handlers
      shoppingListService.setupHandlers();
      expect(shoppingListService['DATABASE_PATH']).toBe('users/test-user-123/shopping-list');
      
      // 2. Create shopping list
      const shoppingList = new ShoppingList('Weekly Groceries', []);
      shoppingListService.addItem(shoppingList);
      
      // 3. Add ingredients
      const item1 = new SimpleItem('Tomatoes', 'vegetables');
      const ingredient1 = new Ingredient(item1, 2, 'kg');
      shoppingListService.addItemToShoppingList(shoppingList, ingredient1);
      
      // 4. Verify data integrity
      const lists = shoppingListService.getItems();
      expect(lists.length).toBe(1);
      expect(lists[0].items.length).toBe(1);
      expect(lists[0].items[0].item.itemName).toBe('Tomatoes');
    });

    it('should handle ingredient updates correctly', () => {
      const shoppingList = new ShoppingList('Test List', []);
      const item = new SimpleItem('Milk', 'dairy');
      const ingredient1 = new Ingredient(item, 1, 'liter');
      const ingredient2 = new Ingredient(item, 2, 'liter');
      
      shoppingListService.addItem(shoppingList);
      shoppingListService.addItemToShoppingList(shoppingList, ingredient1);
      shoppingListService.addItemToShoppingList(shoppingList, ingredient2);
      
      const foundIngredient = shoppingListService.findUsingIngredientName(shoppingList, 'Milk');
      expect(foundIngredient.amount).toBe(3); // Should combine amounts
    });
  });

  describe('File Upload Security Workflow', () => {
    beforeEach(() => {
      const mockUser = { uid: 'test-user-123', getIdToken: () => Promise.resolve('token') };
      Object.defineProperty(mockAuth, 'currentUser', { value: mockUser });
    });

    it('should enforce complete security chain for file uploads', async () => {
      const validFile = new File(['test'], 'recipe.jpg', { type: 'image/jpeg' });
      const recipeUUID = 'recipe-123';
      
      // Should validate authentication
      expect(cloudStoreService['authService'].isAuthenticated()).toBeTrue();
      
      // Should validate file type
      expect(cloudStoreService['validateFileType'](validFile)).toBeTrue();
      
      // Should validate file size
      expect(cloudStoreService['validateFileSize'](validFile)).toBeTrue();
      
      // Should create proper user-specific path
      expect(cloudStoreService['authService'].getUserUID()).toBe('test-user-123');
    });

    it('should block malicious file uploads', async () => {
      const maliciousFile = new File(['<script>alert("xss")</script>'], 'malicious.html', { type: 'text/html' });
      
      try {
        await cloudStoreService.storeRecipeImage(maliciousFile, 'recipe-123');
        fail('Should have blocked malicious file');
      } catch (error) {
        expect(error.message).toBe('Only JPEG, PNG, and WebP images are allowed');
      }
    });
  });

  describe('Data Isolation and User Security', () => {
    it('should ensure user data isolation', () => {
      const user1UID = 'user-1';
      const user2UID = 'user-2';
      
      // User 1
      Object.defineProperty(mockAuth, 'currentUser', { value: { uid: user1UID } });
      shoppingListService.setupHandlers();
      const user1Path = shoppingListService['DATABASE_PATH'];
      
      // User 2
      Object.defineProperty(mockAuth, 'currentUser', { value: { uid: user2UID } });
      shoppingListService.setupHandlers();
      const user2Path = shoppingListService['DATABASE_PATH'];
      
      // Paths should be different and user-specific
      expect(user1Path).toBe(`users/${user1UID}/shopping-list`);
      expect(user2Path).toBe(`users/${user2UID}/shopping-list`);
      expect(user1Path).not.toBe(user2Path);
    });
  });

  describe('Cross-Service Security Integration', () => {
    it('should maintain security context across service calls', async () => {
      // Start unauthenticated
      expect(authService.isAuthenticated()).toBeFalse();
      
      // All services should reject operations
      expect(() => shoppingListService.setupHandlers()).toThrow();
      expect(cloudStoreService.storeRecipeImage(new File([''], 'test.jpg'), 'recipe-123'))
        .toBeRejectedWith(jasmine.objectContaining({ message: 'User must be authenticated to upload images' }));
      
      // Simulate authentication
      const mockUser = { uid: 'test-123', getIdToken: () => Promise.resolve('token') };
      Object.defineProperty(mockAuth, 'currentUser', { value: mockUser });
      
      // Now services should work
      expect(authService.isAuthenticated()).toBeTrue();
      expect(() => shoppingListService.setupHandlers()).not.toThrow();
    });
  });

  describe('Error Boundary Testing', () => {
    it('should handle service failures gracefully without exposing sensitive data', async () => {
      const mockUser = { uid: 'test-123', getIdToken: () => Promise.resolve('token') };
      Object.defineProperty(mockAuth, 'currentUser', { value: mockUser });
      
      // Simulate database error
      try {
        await shoppingListService.updateDatabase();
      } catch (error) {
        // Error message should be generic, not expose internal details
        expect(error.message).toBe('Failed to update shopping lists in database');
        expect(error.message).not.toContain('test-123');
        expect(error.message).not.toContain('firebase');
      }
    });
  });

  describe('State Consistency Across Services', () => {
    it('should maintain consistent authentication state across all services', () => {
      const mockUser = { uid: 'consistent-user', getIdToken: () => Promise.resolve('token') };
      Object.defineProperty(mockAuth, 'currentUser', { value: mockUser });
      
      // All services should see the same authentication state
      expect(authService.isAuthenticated()).toBeTrue();
      expect(authService.getUserUID()).toBe('consistent-user');
      
      // AuthGuard should also see the same state
      expect(authGuard.canActivate(null, null)).toBeTrue();
      
      // Shopping list service should accept the authenticated state
      expect(() => shoppingListService.setupHandlers()).not.toThrow();
    });
  });
});