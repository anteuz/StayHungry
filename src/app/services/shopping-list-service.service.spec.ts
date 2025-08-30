import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ShoppingListService } from './shopping-list.service';
import { AuthService } from './auth.service';
import { Database } from '@angular/fire/database';

describe('ShoppingListService', () => {
  let service: ShoppingListService;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockDatabase: any;

  beforeEach(() => {
    mockAuthService = {
      fireAuth: {} as any,
      isAuthenticated: jest.fn().mockReturnValue(true),
      getUserUID: jest.fn().mockReturnValue('test-user-id'),
      signin: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      getActiveUser: jest.fn(),
      getToken: jest.fn()
    } as any;

    mockDatabase = {
      ref: jest.fn(),
      onValue: jest.fn(),
      set: jest.fn(),
      app: {} as any,
      type: 'database'
    } as any;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ShoppingListService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: Database, useValue: mockDatabase }
      ]
    });
    service = TestBed.inject(ShoppingListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should setup handlers when user is authenticated', () => {
    // Arrange
    mockAuthService.isAuthenticated.mockReturnValue(true);
    mockAuthService.getUserUID.mockReturnValue('test-user-id');

    // Act
    service.setupHandlers();

    // Assert
    expect(mockDatabase.ref).toHaveBeenCalled();
    expect(mockDatabase.onValue).toHaveBeenCalled();
  });

  it('should not setup handlers when user is not authenticated', () => {
    // Arrange
    mockAuthService.isAuthenticated.mockReturnValue(false);

    // Act
    service.setupHandlers();

    // Assert
    expect(mockDatabase.ref).not.toHaveBeenCalled();
    expect(mockDatabase.onValue).not.toHaveBeenCalled();
  });

  it('should return empty array when no shopping lists exist', () => {
    // Arrange
    service['shoppingLists'] = null;

    // Act
    const result = service.getItems();

    // Assert
    expect(result).toEqual([]);
  });

  it('should return copy of shopping lists', () => {
    // Arrange
    const lists = [{ uuid: 'list-1' }, { uuid: 'list-2' }] as any[];
    service['shoppingLists'] = lists;

    // Act
    const result = service.getItems();

    // Assert
    expect(result).toEqual(lists);
    expect(result).not.toBe(lists); // Should be a copy
  });

     it('should find shopping list by UUID', () => {
     // Arrange
     service['shoppingLists'] = [
       { uuid: 'list-1', name: 'List 1', items: [] },
       { uuid: 'list-2', name: 'List 2', items: [] }
     ];

     // Act
     const result = service.findUsingUUID('list-1');

     // Assert
     expect(result).toEqual({ uuid: 'list-1', name: 'List 1', items: [] });
   });

     it('should return null when shopping list not found', () => {
     // Arrange
     service['shoppingLists'] = [
       { uuid: 'list-1', name: 'List 1', items: [] },
       { uuid: 'list-2', name: 'List 2', items: [] }
     ];

     // Act
     const result = service.findUsingUUID('non-existent');

     // Assert
     expect(result).toBeNull();
   });
});
