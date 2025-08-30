import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { NgForm } from '@angular/forms';
import { SignUpPage } from './sign-up.page';
import { AuthService } from '../services/auth.service';

describe('SignUpPage Integration Tests', () => {
  let component: SignUpPage;
  let fixture: ComponentFixture<SignUpPage>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockAlertController: jasmine.SpyObj<AlertController>;
  let mockLoadingController: jasmine.SpyObj<LoadingController>;
  let mockAlert: jasmine.SpyObj<HTMLIonAlertElement>;
  let mockLoading: jasmine.SpyObj<HTMLIonLoadingElement>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['signup']);
    const alertSpy = jasmine.createSpyObj('AlertController', ['create']);
    const loadingSpy = jasmine.createSpyObj('LoadingController', ['create']);
    const mockAlertElement = jasmine.createSpyObj('HTMLIonAlertElement', ['present']);
    const mockLoadingElement = jasmine.createSpyObj('HTMLIonLoadingElement', ['present', 'dismiss']);

    await TestBed.configureTestingModule({
      declarations: [SignUpPage],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: AlertController, useValue: alertSpy },
        { provide: LoadingController, useValue: loadingSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignUpPage);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
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

  describe('User Registration Flow', () => {
    it('should successfully create account with valid data', async () => {
      const mockForm = {
        valid: true,
        value: { email: 'newuser@example.com', password: 'SecurePass123' }
      } as NgForm;

      mockAuthService.signup.and.returnValue(Promise.resolve());

      await component.onSignup(mockForm);

      expect(mockAuthService.signup).toHaveBeenCalledWith('newuser@example.com', 'SecurePass123');
      expect(mockAlertController.create).toHaveBeenCalledWith({
        header: 'Account Created',
        message: 'Your account has been created successfully. You can now sign in.',
        buttons: ['OK']
      });
    });

    it('should handle duplicate email registration', async () => {
      const mockForm = {
        valid: true,
        value: { email: 'existing@example.com', password: 'SecurePass123' }
      } as NgForm;

      mockAuthService.signup.and.returnValue(Promise.reject({ message: 'auth/email-already-in-use' }));

      await component.onSignup(mockForm);

      expect(mockAlertController.create).toHaveBeenCalledWith({
        header: 'Sign Up Failed',
        message: 'An account with this email already exists.',
        buttons: ['OK']
      });
    });

    it('should prevent registration with invalid form', async () => {
      const mockForm = {
        valid: false,
        value: { email: 'invalid-email', password: 'weak' }
      } as NgForm;

      await component.onSignup(mockForm);

      expect(mockAuthService.signup).not.toHaveBeenCalled();
      expect(mockLoadingController.create).not.toHaveBeenCalled();
    });
  });

  describe('Security Error Handling', () => {
    it('should sanitize Firebase error messages', async () => {
      const mockForm = {
        valid: true,
        value: { email: 'test@example.com', password: 'SecurePass123' }
      } as NgForm;

      const testCases = [
        { firebaseError: 'auth/email-already-in-use', expectedMessage: 'An account with this email already exists.' },
        { firebaseError: 'auth/weak-password', expectedMessage: 'Password is too weak. Please choose a stronger password.' },
        { firebaseError: 'Invalid email format', expectedMessage: 'Invalid email format' },
        { firebaseError: 'Password must be at least 8 characters with letters and numbers', expectedMessage: 'Password must be at least 8 characters with letters and numbers' },
        { firebaseError: 'Internal server error with sensitive details', expectedMessage: 'Account creation failed. Please try again.' }
      ];

      for (const testCase of testCases) {
        mockAuthService.signup.and.returnValue(Promise.reject({ message: testCase.firebaseError }));

        await component.onSignup(mockForm);

        expect(mockAlertController.create).toHaveBeenCalledWith({
          header: 'Sign Up Failed',
          message: testCase.expectedMessage,
          buttons: ['OK']
        });
      }
    });

    it('should handle network failures gracefully', async () => {
      const mockForm = {
        valid: true,
        value: { email: 'test@example.com', password: 'SecurePass123' }
      } as NgForm;

      mockAuthService.signup.and.returnValue(Promise.reject({ code: 'network-request-failed' }));

      await component.onSignup(mockForm);

      expect(mockAlertController.create).toHaveBeenCalledWith({
        header: 'Sign Up Failed',
        message: 'Account creation failed. Please try again.',
        buttons: ['OK']
      });
    });
  });

  describe('UI State Management', () => {
    it('should manage loading states correctly during signup', async () => {
      const mockForm = {
        valid: true,
        value: { email: 'test@example.com', password: 'SecurePass123' }
      } as NgForm;

      mockAuthService.signup.and.returnValue(Promise.resolve());

      await component.onSignup(mockForm);

      expect(mockLoadingController.create).toHaveBeenCalledWith({
        message: 'Creating your account...'
      });
      expect(mockLoading.present).toHaveBeenCalled();
      expect(mockLoading.dismiss).toHaveBeenCalled();
    });

    it('should dismiss loading dialog even when signup fails', async () => {
      const mockForm = {
        valid: true,
        value: { email: 'test@example.com', password: 'SecurePass123' }
      } as NgForm;

      mockAuthService.signup.and.returnValue(Promise.reject({ message: 'signup failed' }));

      await component.onSignup(mockForm);

      expect(mockLoading.dismiss).toHaveBeenCalled();
      expect(mockAlert.present).toHaveBeenCalled();
    });
  });

  describe('Form Validation Security', () => {
    it('should reject empty form submissions', async () => {
      const emptyForm = {
        valid: false,
        value: { email: '', password: '' }
      } as NgForm;

      await component.onSignup(emptyForm);

      expect(mockAuthService.signup).not.toHaveBeenCalled();
    });

    it('should validate form before processing', async () => {
      const invalidForm = {
        valid: false,
        value: { email: 'invalid-email', password: 'weak' }
      } as NgForm;

      await component.onSignup(invalidForm);

      expect(mockAuthService.signup).not.toHaveBeenCalled();
      expect(mockLoadingController.create).not.toHaveBeenCalled();
    });
  });
});