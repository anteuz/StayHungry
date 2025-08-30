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
      ref: jest.fn((db: any, path: string) => ({ path })),
      onValue: jest.fn(),
      set: jest.fn().mockResolvedValue(undefined),
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
    mockAuthService.isAuthenticated.mockReturnValue(true);
    mockAuthService.getUserUID.mockReturnValue('test-user-id');

    service.setupHandlers();

    expect(mockDatabase.onValue).toHaveBeenCalled();
  });

  it('should not setup handlers when user is not authenticated', () => {
    mockAuthService.isAuthenticated.mockReturnValue(false);

    expect(() => service.setupHandlers()).toThrow(/user not authenticated/);
  });

  it('should return empty array when no shopping lists exist', () => {
    (service as any)['shoppingLists'] = null;
    const result = service.getItems();
    expect(result).toEqual([]);
  });

  it('should return copy of shopping lists', () => {
    const lists = [{ uuid: 'list-1' }, { uuid: 'list-2' }] as any[];
    (service as any)['shoppingLists'] = lists;
    const result = service.getItems();
    expect(result).toEqual(lists);
    expect(result).not.toBe(lists);
  });

  it('should find shopping list by UUID', () => {
    (service as any)['shoppingLists'] = [
      { uuid: 'list-1', name: 'List 1', items: [] },
      { uuid: 'list-2', name: 'List 2', items: [] }
    ];

    const result = service.findUsingUUID('list-1');
    expect(result).toEqual({ uuid: 'list-1', name: 'List 1', items: [] });
  });

  it('should return null when shopping list not found', () => {
    (service as any)['shoppingLists'] = [
      { uuid: 'list-1', name: 'List 1', items: [] },
      { uuid: 'list-2', name: 'List 2', items: [] }
    ];

    const result = service.findUsingUUID('non-existent');
    expect(result).toBeNull();
  });

  it('should initialize DB path before modifying lists to avoid update errors', async () => {
    service.setupHandlers();
    const list = { uuid: 'id', name: 'Name', items: [] } as any;
    service.addItem(list);
    await Promise.resolve();
    expect((service as any)['DATABASE_PATH']).toBe('users/test-user-id/shopping-list');
  });
});
