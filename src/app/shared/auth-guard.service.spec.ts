import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, Route } from '@angular/router';
import { AuthGuard } from './auth-guard.service';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;
  let mockRouteConfig: Route;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/tabs/tab1' } as RouterStateSnapshot;
    mockRouteConfig = {} as Route;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('Route Protection Security Tests', () => {
    it('should allow access when user is authenticated', () => {
      mockAuthService.isAuthenticated.and.returnValue(true);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBeTrue();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should deny access and redirect when user is not authenticated', () => {
      mockAuthService.isAuthenticated.and.returnValue(false);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBeFalse();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/sign-in']);
    });

    it('should protect lazy loaded routes when user is not authenticated', () => {
      mockAuthService.isAuthenticated.and.returnValue(false);

      const result = guard.canLoad(mockRouteConfig);

      expect(result).toBeFalse();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/sign-in']);
    });

    it('should allow lazy loaded routes when user is authenticated', () => {
      mockAuthService.isAuthenticated.and.returnValue(true);

      const result = guard.canLoad(mockRouteConfig);

      expect(result).toBeTrue();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle authentication service errors gracefully', () => {
      mockAuthService.isAuthenticated.and.throwError('Service error');

      expect(() => guard.canActivate(mockRoute, mockState)).toThrow();
    });

    it('should not bypass security with falsy values', () => {
      // Test that the guard doesn't accidentally allow access with falsy values
      const falsyValues = [false, 0, '', null, undefined, NaN];
      
      falsyValues.forEach(value => {
        mockAuthService.isAuthenticated.and.returnValue(value as any);
        const result = guard.canActivate(mockRoute, mockState);
        expect(result).toBeFalse();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/sign-in']);
      });
    });
  });

  describe('Integration with Router', () => {
    it('should redirect to sign-in page with correct path', () => {
      mockAuthService.isAuthenticated.and.returnValue(false);

      guard.canActivate(mockRoute, mockState);

      expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/sign-in']);
    });

    it('should handle router navigation failures gracefully', () => {
      mockAuthService.isAuthenticated.and.returnValue(false);
      mockRouter.navigate.and.returnValue(Promise.reject('Navigation failed'));

      expect(() => guard.canActivate(mockRoute, mockState)).not.toThrow();
    });
  });
});