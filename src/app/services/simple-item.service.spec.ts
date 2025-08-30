import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SimpleItemService } from './simple-item.service';
import { AuthService } from './auth.service';
import { UserStorageService } from './user-storage.service';
import { Database } from '@angular/fire/database';

describe('SimpleItemService', () => {
  let service: SimpleItemService;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockUserStorageService: jest.Mocked<UserStorageService>;
  let mockDatabase: jest.Mocked<Database>;

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

    mockUserStorageService = {
      getUserData: jest.fn(),
      setUserData: jest.fn(),
      clearUserData: jest.fn(),
      isLoggedIn: jest.fn(),
      getUserEmail: jest.fn().mockResolvedValue('test@example.com')
    } as any;

    mockDatabase = {
      ref: jest.fn(),
      onValue: jest.fn(),
      set: jest.fn()
    } as any;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SimpleItemService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserStorageService, useValue: mockUserStorageService },
        { provide: Database, useValue: mockDatabase }
      ]
    });
    service = TestBed.inject(SimpleItemService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
