import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RecipeServiceService } from './recipe-service.service';
import { AuthService } from './auth.service';
import { Database } from '@angular/fire/database';

describe('RecipeServiceService', () => {
  let service: RecipeServiceService;
  let mockAuthService: jest.Mocked<AuthService>;
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

    mockDatabase = {
      ref: jest.fn(),
      onValue: jest.fn(),
      set: jest.fn()
    } as any;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        RecipeServiceService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: Database, useValue: mockDatabase }
      ]
    });
    service = TestBed.inject(RecipeServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
