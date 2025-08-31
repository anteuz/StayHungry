import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AuthGuard } from '../shared/auth-guard.service';
import { UserStorageService } from '../services/user-storage.service';

describe('Authentication Integration', () => {
  let authService: AuthService;
  let authGuard: AuthGuard;
  let router: Router;
  let userStorageService: UserStorageService;

  const mockAuth = {
    currentUser: null,
    signInWithPopup: jest.fn(),
    signInWithRedirect: jest.fn(),
    getRedirectResult: jest.fn(),
    signOut: jest.fn()
  };

  const mockUserStorageService = {
    storeFromUser: jest.fn().mockResolvedValue(undefined),
    clearUserData: jest.fn().mockResolvedValue(undefined),
    getUserData: jest.fn().mockResolvedValue(null)
  };

  const mockRouter = {
    navigate: jest.fn().mockResolvedValue(true)
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        AuthGuard,
        { provide: Auth, useValue: mockAuth },
        { provide: UserStorageService, useValue: mockUserStorageService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    authService = TestBed.inject(AuthService);
    authGuard = TestBed.inject(AuthGuard);
    router = TestBed.inject(Router);
    userStorageService = TestBed.inject(UserStorageService);

    jest.clearAllMocks();
  });

  it('should create all authentication services', () => {
    expect(authService).toBeTruthy();
    expect(authGuard).toBeTruthy();
    expect(userStorageService).toBeTruthy();
  });

  it('should handle complete authentication flow', async () => {
    // Mock successful Google sign-in
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User'
    };
    const mockCredential = { user: mockUser };
    
    mockAuth.signInWithPopup = jest.fn().mockResolvedValue(mockCredential);
    mockAuth.currentUser = mockUser as any;

    // Test sign-in
    const result = await authService.signInWithGooglePopup();
    expect(result).toEqual(mockCredential);

    // Test user data retrieval
    expect(authService.getCurrentUser()).toEqual(mockUser);
    expect(authService.getCurrentUserUID()).toBe('test-uid');
    expect(authService.getCurrentUserEmail()).toBe('test@example.com');

    // Test sign-out
    mockAuth.signOut = jest.fn().mockResolvedValue(undefined);
    await authService.signOut();
    expect(mockAuth.signOut).toHaveBeenCalled();
  });

  it('should protect routes when user is not authenticated', (done) => {
    // Set up unauthenticated state
    (authService as any).authState$ = {
      pipe: jest.fn().mockReturnValue({
        subscribe: (callback: any) => {
          callback(false);
          return { unsubscribe: jest.fn() };
        }
      })
    };

    const route = {} as any;
    const state = { url: '/protected' } as any;

    const result = authGuard.canActivate(route, state);
    
    if (result instanceof Observable) {
      result.subscribe({
        next: (canActivate: boolean) => {
          expect(canActivate).toBe(false);
          expect(router.navigate).toHaveBeenCalledWith(['/sign-in'], { queryParams: { returnUrl: '/protected' } });
          done();
        },
        error: done.fail
      });
    } else if (result instanceof Promise) {
      result.then((canActivate: boolean) => {
        expect(canActivate).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/sign-in'], { queryParams: { returnUrl: '/protected' } });
        done();
      }).catch(done.fail);
    } else {
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/sign-in'], { queryParams: { returnUrl: '/protected' } });
      done();
    }
  });

  it('should allow route access when user is authenticated', (done) => {
    // Set up authenticated state
    (authService as any).authState$ = {
      pipe: jest.fn().mockReturnValue({
        subscribe: (callback: any) => {
          callback(true);
          return { unsubscribe: jest.fn() };
        }
      })
    };

    const route = {} as any;
    const state = { url: '/protected' } as any;

    const result = authGuard.canActivate(route, state);
    
    if (result instanceof Observable) {
      result.subscribe({
        next: (canActivate: boolean) => {
          expect(canActivate).toBe(true);
          expect(router.navigate).not.toHaveBeenCalled();
          done();
        },
        error: done.fail
      });
    } else if (result instanceof Promise) {
      result.then((canActivate: boolean) => {
        expect(canActivate).toBe(true);
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      }).catch(done.fail);
    } else {
      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
      done();
    }
  });

  it('should handle authentication state changes', () => {
    // Test initial state
    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.isLoading()).toBe(true); // Initially loading

    // Simulate user authentication
    const mockUser = { uid: 'test-uid', email: 'test@example.com' };
    (authService as any).authState.next({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false
    });

    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.isLoading()).toBe(false);
  });

  it('should handle error scenarios gracefully', async () => {
    // Test authentication error
    const authError = new Error('Authentication failed');
    mockAuth.signInWithPopup = jest.fn().mockRejectedValue(authError);

    await expect(authService.signInWithGooglePopup()).rejects.toThrow();

    // Test sign-out error
    const signOutError = new Error('Sign out failed');
    mockAuth.signOut = jest.fn().mockRejectedValue(signOutError);

    await expect(authService.signOut()).rejects.toThrow();
  });
});