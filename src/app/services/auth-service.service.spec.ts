import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { UserStorageService } from './user-storage.service';
import { Auth } from '@angular/fire/auth';

describe('AuthService', () => {
  let service: AuthService;
  let mockFireAuth: jest.Mocked<Auth>;

  beforeEach(() => {
    mockFireAuth = {
      currentUser: null,
      signInWithEmailAndPassword: jest.fn(),
      createUserWithEmailAndPassword: jest.fn(),
      signOut: jest.fn(),
      getIdToken: jest.fn()
    } as any;

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth, useValue: mockFireAuth },
        { provide: UserStorageService, useValue: { clearUserData: jest.fn().mockResolvedValue(undefined) } }
      ]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
