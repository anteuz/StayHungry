import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { SignInPage } from './sign-in.page';
import { AuthService } from '../services/auth.service';

describe('SignInPage Integration Tests', () => {
  let component: SignInPage;
  let fixture: ComponentFixture<SignInPage>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAlertController: jasmine.SpyObj<AlertController>;
  let mockLoadingController: jasmine.SpyObj<LoadingController>;
  let mockAlert: jasmine.SpyObj<HTMLIonAlertElement>;
  let mockLoading: jasmine.SpyObj<HTMLIonLoadingElement>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['signin']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const alertSpy = jasmine.createSpyObj('AlertController', ['create']);
    const loadingSpy = jasmine.createSpyObj('LoadingController', ['create']);
    const mockAlertElement = jasmine.createSpyObj('HTMLIonAlertElement', ['present']);
    const mockLoadingElement = jasmine.createSpyObj('HTMLIonLoadingElement', ['present', 'dismiss']);

    await TestBed.configureTestingModule({
      declarations: [SignInPage],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: AlertController, useValue: alertSpy },
        { provide: LoadingController, useValue: loadingSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignInPage);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockAlertController = TestBed.inject(AlertController) as jasmine.SpyObj<AlertController>;
    mockLoadingController = TestBed.inject(LoadingController) as jasmine.SpyObj<LoadingController>;
    
    mockAlert = mockAlertElement;
    mockLoading = mockLoadingElement;
    
    mockAlertController.create.and.returnValue(Promise.resolve(mockAlert));
    mockLoadingController.create.and.returnValue(Promise.resolve(mockLoading));
    mockLoading.present.and.returnValue(Promise.resolve());
    mockLoading.dismiss.and.returnValue(Promise.resolve());
    mockAlert.present.and.returnValue(Promise.resolve());

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Authentication Flow Integration', () => {
    it('should successfully sign in and navigate on valid credentials', async () => {
      const mockForm = {
        valid: true,
        value: { email: 'test@example.com', password: 'validPassword123' }
      } as NgForm;

      mockAuthService.signin.and.returnValue(Promise.resolve());
      mockRouter.navigate.and.returnValue(Promise.resolve(true));

      await component.onSignin(mockForm);

      expect(mockAuthService.signin).toHaveBeenCalledWith('test@example.com', 'validPassword123');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
      expect(mockLoading.present).toHaveBeenCalled();
      expect(mockLoading.dismiss).toHaveBeenCalled();
    });

    it('should handle authentication failure with user-friendly message', async () => {
      const mockForm = {
        valid: true,
        value: { email: 'test@example.com', password: 'wrongPassword' }
      } as NgForm;

      mockAuthService.signin.and.returnValue(Promise.reject({ message: 'auth/wrong-password' }));

      await component.onSignin(mockForm);

      expect(mockAlertController.create).toHaveBeenCalledWith({
        header: 'Sign In Failed',
        message: 'Invalid email or password.',
        buttons: ['OK']
      });
      expect(mockAlert.present).toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should prevent submission of invalid forms', async () => {
      const mockForm = {
        valid: false,
        value: { email: '', password: '' }
      } as NgForm;

      await component.onSignin(mockForm);

      expect(mockAuthService.signin).not.toHaveBeenCalled();
      expect(mockLoadingController.create).not.toHaveBeenCalled();
    });
  });

  describe('Security Error Handling', () => {
    it('should sanitize error messages to prevent information disclosure', async () => {
      const mockForm = {
        valid: true,
        value: { email: 'test@example.com', password: 'password123' }
      } as NgForm;

      const testCases = [
        { firebaseError: 'auth/user-not-found', expectedMessage: 'Invalid email or password.' },
        { firebaseError: 'auth/wrong-password', expectedMessage: 'Invalid email or password.' },
        { firebaseError: 'auth/too-many-requests', expectedMessage: 'Too many failed attempts. Please try again later.' },
        { firebaseError: 'Invalid email format', expectedMessage: 'Invalid email format' },
        { firebaseError: 'Some internal server error', expectedMessage: 'Sign in failed. Please check your credentials.' }
      ];

      for (const testCase of testCases) {
        mockAuthService.signin.and.returnValue(Promise.reject({ message: testCase.firebaseError }));

        await component.onSignin(mockForm);

        expect(mockAlertController.create).toHaveBeenCalledWith({
          header: 'Sign In Failed',
          message: testCase.expectedMessage,
          buttons: ['OK']
        });
      }
    });

    it('should handle loading dialog errors gracefully', async () => {
      const mockForm = {
        valid: true,
        value: { email: 'test@example.com', password: 'validPassword123' }
      } as NgForm;

      mockLoadingController.create.and.returnValue(Promise.reject('Loading creation failed'));

      // Should not throw error
      await expectAsync(component.onSignin(mockForm)).not.toBeRejected();
    });
  });

  describe('UI State Management', () => {
    it('should properly manage loading states during sign in', async () => {
      const mockForm = {
        valid: true,
        value: { email: 'test@example.com', password: 'validPassword123' }
      } as NgForm;

      mockAuthService.signin.and.returnValue(Promise.resolve());

      await component.onSignin(mockForm);

      expect(mockLoadingController.create).toHaveBeenCalledWith({
        message: 'Signing you in...'
      });
      expect(mockLoading.present).toHaveBeenCalled();
      expect(mockLoading.dismiss).toHaveBeenCalled();
    });

    it('should dismiss loading dialog even when sign in fails', async () => {
      const mockForm = {
        valid: true,
        value: { email: 'test@example.com', password: 'wrongPassword' }
      } as NgForm;

      mockAuthService.signin.and.returnValue(Promise.reject({ message: 'auth/wrong-password' }));

      await component.onSignin(mockForm);

      expect(mockLoading.dismiss).toHaveBeenCalled();
    });
  });

  describe('Form Validation Integration', () => {
    it('should respect form validation state', async () => {
      const validForm = { valid: true, value: { email: 'test@example.com', password: 'validPassword123' } } as NgForm;
      const invalidForm = { valid: false, value: { email: '', password: '' } } as NgForm;

      mockAuthService.signin.and.returnValue(Promise.resolve());

      await component.onSignin(validForm);
      expect(mockAuthService.signin).toHaveBeenCalled();

      await component.onSignin(invalidForm);
      expect(mockAuthService.signin).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });
});