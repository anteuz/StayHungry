import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AlertController, LoadingController, Platform } from '@ionic/angular';
import { of, BehaviorSubject } from 'rxjs';
import { SignUpPage } from './sign-up.page';
import { AuthService, AuthState } from '../services/auth.service';

describe('SignUpPage', () => {
  let component: SignUpPage;
  let fixture: ComponentFixture<SignUpPage>;
  let authService: AuthService;
  let router: Router;
  let loadingCtrl: LoadingController;
  let alertCtrl: AlertController;
  let platform: Platform;

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

    await TestBed.configureTestingModule({
      declarations: [SignUpPage],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: LoadingController, useValue: loadingCtrlMock },
        { provide: AlertController, useValue: alertCtrlMock },
        { provide: Platform, useValue: platformMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignUpPage);
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
    it('should navigate to home when already authenticated', () => {
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

  describe('Google Sign-Up', () => {
    beforeEach(() => {
      (platform.is as jest.Mock).mockReturnValue(false); // Default to web platform
    });

    it('should sign up with Google popup on web platform', async () => {
      (authService.signInWithGooglePopup as jest.Mock).mockResolvedValue({});

      await component.onGoogleSignUp();

      expect(loadingCtrl.create).toHaveBeenCalledWith({
        message: 'Creating account with Google...',
        spinner: 'circular'
      });
      expect(mockLoadingElement.present).toHaveBeenCalled();
      expect(authService.signInWithGooglePopup).toHaveBeenCalled();
      expect(mockLoadingElement.dismiss).toHaveBeenCalled();
      expect(alertCtrl.create).toHaveBeenCalledWith({
        header: 'Welcome!',
        message: 'Your account has been created successfully.',
        buttons: ['OK']
      });
    });

    it('should sign up with Google redirect on mobile platform', async () => {
      (platform.is as jest.Mock).mockReturnValue(true); // Mobile platform
      (authService.signInWithGoogleRedirect as jest.Mock).mockResolvedValue(undefined);

      await component.onGoogleSignUp();

      expect(authService.signInWithGoogleRedirect).toHaveBeenCalled();
      expect(mockLoadingElement.dismiss).not.toHaveBeenCalled(); // Should not dismiss on redirect
    });

    it('should handle Google sign-up errors', async () => {
      const error = new Error('Sign-up failed');
      (authService.signInWithGooglePopup as jest.Mock).mockRejectedValue(error);

      await component.onGoogleSignUp();

      expect(mockLoadingElement.dismiss).toHaveBeenCalled();
      expect(alertCtrl.create).toHaveBeenCalledWith({
        header: 'Google Sign-Up Failed',
        message: 'Sign-up failed',
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

      expect(alertCtrl.create).toHaveBeenCalledWith({
        header: 'Welcome!',
        message: 'Your account has been created successfully.',
        buttons: ['OK']
      });
    });

    it('should handle redirect result errors', async () => {
      const error = new Error('Redirect failed');
      (authService.getRedirectResult as jest.Mock).mockRejectedValue(error);

      await component['checkRedirectResult']();

      expect(alertCtrl.create).toHaveBeenCalledWith({
        header: 'Sign-Up Error',
        message: 'Redirect failed',
        buttons: ['OK']
      });
    });

    it('should handle null redirect result', async () => {
      (authService.getRedirectResult as jest.Mock).mockResolvedValue(null);

      await component['checkRedirectResult']();

      // Should only call getRedirectResult, no alerts
      expect(authService.getRedirectResult).toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should navigate to sign-in page', () => {
      component.goToSignIn();
      expect(router.navigate).toHaveBeenCalledWith(['/sign-in']);
    });

    it('should handle navigation errors gracefully', () => {
      (router.navigate as jest.Mock).mockRejectedValue(new Error('Navigation failed'));
      
      expect(() => component.goToSignIn()).not.toThrow();
    });

    it('should navigate to home page', () => {
      component['navigateToHome']();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('Platform Detection', () => {
    it('should detect capacitor platform', async () => {
      (platform.is as jest.Mock).mockImplementation((platformName: string) => platformName === 'capacitor');
      (authService.signInWithGoogleRedirect as jest.Mock).mockResolvedValue(undefined);

      await component.onGoogleSignUp();

      expect(authService.signInWithGoogleRedirect).toHaveBeenCalled();
      expect(authService.signInWithGooglePopup).not.toHaveBeenCalled();
    });

    it('should detect cordova platform', async () => {
      (platform.is as jest.Mock).mockImplementation((platformName: string) => platformName === 'cordova');
      (authService.signInWithGoogleRedirect as jest.Mock).mockResolvedValue(undefined);

      await component.onGoogleSignUp();

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

  describe('Error Display', () => {
    it('should show error alert with correct parameters', async () => {
      await component['showErrorAlert']('Test Header', 'Test Message');

      expect(alertCtrl.create).toHaveBeenCalledWith({
        header: 'Test Header',
        message: 'Test Message',
        buttons: ['OK']
      });
      expect(mockAlertElement.present).toHaveBeenCalled();
    });

    it('should show success alert', async () => {
      await component['showSuccessAlert']();

      expect(alertCtrl.create).toHaveBeenCalledWith({
        header: 'Welcome!',
        message: 'Your account has been created successfully.',
        buttons: ['OK']
      });
      expect(mockAlertElement.present).toHaveBeenCalled();
    });
  });
});