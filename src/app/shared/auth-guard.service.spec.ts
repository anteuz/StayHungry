import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthGuard } from './auth-guard.service';
import { AuthService, AuthState } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: AuthService;
  let router: Router;

  const mockAuthenticatedState: AuthState = {
    user: { uid: 'test-uid', email: 'test@example.com' } as any,
    isAuthenticated: true,
    isLoading: false
  };

  const mockUnauthenticatedState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false
  };

  const mockLoadingState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true
  };

  beforeEach(() => {
    const authServiceMock = {
      authState$: of(mockUnauthenticatedState)
    };
    const routerMock = {
      navigate: jest.fn().mockResolvedValue(true)
    };

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate', () => {
    it('should allow access when user is authenticated', (done) => {
      // Override the authState$ observable for this test
      (authService as any).authState$ = of(mockAuthenticatedState);

      const route = {} as any;
      const state = { url: '/test' } as any;

      const result = guard.canActivate(route, state);
      
      if (result instanceof Promise) {
        result.then(canActivate => {
          expect(canActivate).toBe(true);
          expect(router.navigate).not.toHaveBeenCalled();
          done();
        }).catch(done.fail);
      } else if (typeof result === 'object' && result.subscribe) {
        result.subscribe({
          next: canActivate => {
            expect(canActivate).toBe(true);
            expect(router.navigate).not.toHaveBeenCalled();
            done();
          },
          error: done.fail
        });
      } else {
        expect(result).toBe(true);
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      }
    });

    it('should deny access and redirect when user is not authenticated', (done) => {
      (authService as any).authState$ = of(mockUnauthenticatedState);

      const route = {} as any;
      const state = { url: '/protected' } as any;

      const result = guard.canActivate(route, state);
      
      if (result instanceof Promise) {
        result.then(canActivate => {
          expect(canActivate).toBe(false);
          expect(router.navigate).toHaveBeenCalledWith(['/sign-in'], { queryParams: { returnUrl: '/protected' } });
          done();
        }).catch(done.fail);
      } else if (typeof result === 'object' && result.subscribe) {
        result.subscribe({
          next: canActivate => {
            expect(canActivate).toBe(false);
            expect(router.navigate).toHaveBeenCalledWith(['/sign-in'], { queryParams: { returnUrl: '/protected' } });
            done();
          },
          error: done.fail
        });
      } else {
        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/sign-in'], { queryParams: { returnUrl: '/protected' } });
        done();
      }
    });

    it('should deny access when auth is still loading', (done) => {
      (authService as any).authState$ = of(mockLoadingState);

      const route = {} as any;
      const state = { url: '/test' } as any;

      const result = guard.canActivate(route, state);
      
      if (result instanceof Promise) {
        result.then(canActivate => {
          expect(canActivate).toBe(false);
          done();
        }).catch(done.fail);
      } else if (typeof result === 'object' && result.subscribe) {
        result.subscribe({
          next: canActivate => {
            expect(canActivate).toBe(false);
            done();
          },
          error: done.fail
        });
      } else {
        expect(result).toBe(false);
        done();
      }
    });
  });

  describe('canLoad', () => {
    it('should allow loading when user is authenticated', (done) => {
      (authService as any).authState$ = of(mockAuthenticatedState);

      const route = {} as any;
      const result = guard.canLoad(route);
      
      if (result instanceof Promise) {
        result.then(canLoad => {
          expect(canLoad).toBe(true);
          done();
        }).catch(done.fail);
      } else if (typeof result === 'object' && result.subscribe) {
        result.subscribe({
          next: canLoad => {
            expect(canLoad).toBe(true);
            done();
          },
          error: done.fail
        });
      } else {
        expect(result).toBe(true);
        done();
      }
    });

    it('should deny loading when user is not authenticated', (done) => {
      (authService as any).authState$ = of(mockUnauthenticatedState);

      const route = {} as any;
      const result = guard.canLoad(route);
      
      if (result instanceof Promise) {
        result.then(canLoad => {
          expect(canLoad).toBe(false);
          expect(router.navigate).toHaveBeenCalledWith(['/sign-in'], {});
          done();
        }).catch(done.fail);
      } else if (typeof result === 'object' && result.subscribe) {
        result.subscribe({
          next: canLoad => {
            expect(canLoad).toBe(false);
            expect(router.navigate).toHaveBeenCalledWith(['/sign-in'], {});
            done();
          },
          error: done.fail
        });
      } else {
        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/sign-in'], {});
        done();
      }
    });
  });

  describe('canActivateChild', () => {
    it('should allow child activation when user is authenticated', (done) => {
      (authService as any).authState$ = of(mockAuthenticatedState);

      const route = {} as any;
      const state = { url: '/test' } as any;

      const result = guard.canActivateChild(route, state);
      
      if (result instanceof Promise) {
        result.then(canActivate => {
          expect(canActivate).toBe(true);
          done();
        }).catch(done.fail);
      } else if (typeof result === 'object' && result.subscribe) {
        result.subscribe({
          next: canActivate => {
            expect(canActivate).toBe(true);
            done();
          },
          error: done.fail
        });
      } else {
        expect(result).toBe(true);
        done();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle router navigation errors gracefully', (done) => {
      (authService as any).authState$ = of(mockUnauthenticatedState);
      (router.navigate as jest.Mock).mockRejectedValue(new Error('Navigation failed'));
      
      const route = {} as any;
      const state = { url: '/test' } as any;

      const result = guard.canActivate(route, state);
      
      if (result instanceof Promise) {
        result.then(canActivate => {
          expect(canActivate).toBe(false);
          expect(router.navigate).toHaveBeenCalled();
          done();
        }).catch(done.fail);
      } else if (typeof result === 'object' && result.subscribe) {
        result.subscribe({
          next: canActivate => {
            expect(canActivate).toBe(false);
            expect(router.navigate).toHaveBeenCalled();
            done();
          },
          error: done.fail
        });
      } else {
        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalled();
        done();
      }
    });
  });
});