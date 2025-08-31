import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, LoadingController, Platform } from '@ionic/angular';
import { of, BehaviorSubject } from 'rxjs';
import { SignInPage } from './sign-in.page';
import { AuthService, AuthState } from '../services/auth.service';

describe('SignInPage', () => {
  let component: SignInPage;
  let fixture: ComponentFixture<SignInPage>;
  let authService: AuthService;
  let router: Router;
  let loadingCtrl: LoadingController;
  let alertCtrl: AlertController;
  let platform: Platform;
  let activatedRoute: any;

  const mockAuthState = new BehaviorSubject<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false
  });

  const mockLoadingElement = {
    present: jest.fn().mockResolvedValue(undefined),
    dismiss: jest.fn().mockResolvedValue(undefined)
  };

  const mockAlertElement = {
    present: jest.fn().mockResolvedValue(undefined)
  };

  beforeEach(async () => {
    const authServiceMock = {
      authState$: mockAuthState.asObservable(),
      signInWithGooglePopup: jest.fn(),
      signInWithGoogleRedirect: jest.fn(),
      getRedirectResult: jest.fn()
    };

    const routerMock = {
      navigate: jest.fn().mockResolvedValue(true)
    };

    const loadingCtrlMock = {
      create: jest.fn().mockResolvedValue(mockLoadingElement)
    };

    const alertCtrlMock = {
      create: jest.fn().mockResolvedValue(mockAlertElement)
    };

    const platformMock = {
      is: jest.fn().mockReturnValue(false)
    };

    activatedRoute = {
      snapshot: {
        queryParams: {}
      }
    };

    await TestBed.configureTestingModule({
      declarations: [SignInPage],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: LoadingController, useValue: loadingCtrlMock },
        { provide: AlertController, useValue: alertCtrlMock },
        { provide: Platform, useValue: platformMock },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignInPage);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    loadingCtrl = TestBed.inject(LoadingController);
    alertCtrl = TestBed.inject(AlertController);
    platform = TestBed.inject(Platform);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set return URL from query params', () => {
      activatedRoute.snapshot.queryParams = { returnUrl: '/protected' };
      component.ngOnInit();
      expect(component['returnUrl']).toBe('/protected');
    });

    it('should use default return URL when none provided', () => {
      activatedRoute.snapshot.queryParams = {};
      component.ngOnInit();
      expect(component['returnUrl']).toBe('/');
    });

    it('should navigate to return URL when already authenticated', () => {
      mockAuthState.next({
        user: { uid: 'test-uid' } as any,
        isAuthenticated: true,
        isLoading: false
      });

      component.ngOnInit();

      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should check redirect result on init', () => {
      (authService.getRedirectResult as jest.Mock).mockResolvedValue(null);
      component.ngOnInit();
      expect(authService.getRedirectResult).toHaveBeenCalled();
    });
  });

  describe('Google Sign-In', () => {
    beforeEach(() => {
      (platform.is as jest.Mock).mockReturnValue(false); // Default to web platform
    });

    it('should sign in with Google popup on web platform', async () => {
      (authService.signInWithGooglePopup as jest.Mock).mockResolvedValue({});

      await component.onGoogleSignIn();

      expect(loadingCtrl.create).toHaveBeenCalledWith({
        message: 'Signing in with Google...',
        spinner: 'circular'
      });
      expect(mockLoadingElement.present).toHaveBeenCalled();
      expect(authService.signInWithGooglePopup).toHaveBeenCalled();
      expect(mockLoadingElement.dismiss).toHaveBeenCalled();
    });

    it('should sign in with Google redirect on mobile platform', async () => {
      (platform.is as jest.Mock).mockReturnValue(true); // Mobile platform
      (authService.signInWithGoogleRedirect as jest.Mock).mockResolvedValue(undefined);

      await component.onGoogleSignIn();

      expect(authService.signInWithGoogleRedirect).toHaveBeenCalled();
      expect(mockLoadingElement.dismiss).not.toHaveBeenCalled(); // Should not dismiss on redirect
    });

    it('should handle Google sign-in errors', async () => {
      const error = new Error('Sign-in failed');
      (authService.signInWithGooglePopup as jest.Mock).mockRejectedValue(error);

      await component.onGoogleSignIn();

      expect(mockLoadingElement.dismiss).toHaveBeenCalled();
      expect(alertCtrl.create).toHaveBeenCalledWith({
        header: 'Google Sign-In Failed',
        message: 'Sign-in failed',
        buttons: ['OK']
      });
      expect(mockAlertElement.present).toHaveBeenCalled();
    });
  });

  describe('Redirect Result Handling', () => {
    it('should handle successful redirect result', async () => {
      const mockCredential = {
        user: { uid: 'test-uid', email: 'test@example.com' }
      };
      (authService.getRedirectResult as jest.Mock).mockResolvedValue(mockCredential);

      await component['checkRedirectResult']();

      // Should not show error
      expect(alertCtrl.create).not.toHaveBeenCalled();
    });

    it('should handle redirect result errors', async () => {
      const error = new Error('Redirect failed');
      (authService.getRedirectResult as jest.Mock).mockRejectedValue(error);

      await component['checkRedirectResult']();

      expect(alertCtrl.create).toHaveBeenCalledWith({
        header: 'Sign-In Error',
        message: 'Redirect failed',
        buttons: ['OK']
      });
    });

    it('should handle null redirect result', async () => {
      (authService.getRedirectResult as jest.Mock).mockResolvedValue(null);

      await component['checkRedirectResult']();

      // Should not show error or success message
      expect(alertCtrl.create).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should navigate to sign-up page', () => {
      component.goToSignUp();
      expect(router.navigate).toHaveBeenCalledWith(['/sign-up']);
    });

    it('should handle navigation errors gracefully', () => {
      (router.navigate as jest.Mock).mockRejectedValue(new Error('Navigation failed'));
      
      expect(() => component.goToSignUp()).not.toThrow();
    });

    it('should navigate to return URL successfully', () => {
      component['returnUrl'] = '/protected';
      component['navigateToReturnUrl']();
      expect(router.navigate).toHaveBeenCalledWith(['/protected']);
    });

    it('should fallback to home page if return URL navigation fails', async () => {
      component['returnUrl'] = '/protected';
      (router.navigate as jest.Mock)
        .mockRejectedValueOnce(new Error('Navigation failed'))
        .mockResolvedValueOnce(true);

      component['navigateToReturnUrl']();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(router.navigate).toHaveBeenCalledWith(['/protected']);
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('Platform Detection', () => {
    it('should detect capacitor platform', async () => {
      (platform.is as jest.Mock).mockImplementation((platformName: string) => platformName === 'capacitor');
      (authService.signInWithGoogleRedirect as jest.Mock).mockResolvedValue(undefined);

      await component.onGoogleSignIn();

      expect(authService.signInWithGoogleRedirect).toHaveBeenCalled();
      expect(authService.signInWithGooglePopup).not.toHaveBeenCalled();
    });

    it('should detect cordova platform', async () => {
      (platform.is as jest.Mock).mockImplementation((platformName: string) => platformName === 'cordova');
      (authService.signInWithGoogleRedirect as jest.Mock).mockResolvedValue(undefined);

      await component.onGoogleSignIn();

      expect(authService.signInWithGoogleRedirect).toHaveBeenCalled();
      expect(authService.signInWithGooglePopup).not.toHaveBeenCalled();
    });
  });

  describe('Component Lifecycle', () => {
    it('should unsubscribe on destroy', () => {
      component.ngOnInit();
      const subscription = component['authSubscription'];
      const unsubscribeSpy = jest.spyOn(subscription!, 'unsubscribe');

      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should handle destroy when no subscription exists', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});