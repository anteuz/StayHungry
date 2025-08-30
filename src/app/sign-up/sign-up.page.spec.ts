import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, LoadingController, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SignUpPage } from './sign-up.page';
import { AuthService } from '../services/auth.service';
import { UserStorageService } from '../services/user-storage.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';


describe('SignUpPage', () => {
  let component: SignUpPage;
  let fixture: ComponentFixture<SignUpPage>;
  let mockAuthService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    mockAuthService = {
      fireAuth: {} as any,
      signin: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      getActiveUser: jest.fn(),
      getUserUID: jest.fn(),
      getToken: jest.fn(),
      isAuthenticated: jest.fn()
    } as any;

    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), FormsModule, SignUpPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserStorageService, useValue: { storeFromCredential: jest.fn(), clearUserData: jest.fn() } },
        { provide: LoadingController, useValue: { create: jest.fn().mockResolvedValue({ present: jest.fn().mockResolvedValue(undefined), dismiss: jest.fn().mockResolvedValue(undefined) }) } },
        { provide: AlertController, useValue: { create: jest.fn().mockResolvedValue({ present: jest.fn().mockResolvedValue(undefined) }) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignUpPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});