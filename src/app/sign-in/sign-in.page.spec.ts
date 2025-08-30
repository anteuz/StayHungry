import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, LoadingController, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SignInPage } from './sign-in.page';
import { AuthService } from '../services/auth.service';
import { UserStorageService } from '../services/user-storage.service';
import { Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';


describe('SignInPage', () => {
  let component: SignInPage;
  let fixture: ComponentFixture<SignInPage>;
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
      imports: [IonicModule.forRoot(), FormsModule, SignInPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserStorageService, useValue: { storeFromCredential: jest.fn(), clearUserData: jest.fn() } },
        { provide: LoadingController, useValue: { create: jest.fn().mockResolvedValue({ present: jest.fn().mockResolvedValue(undefined), dismiss: jest.fn().mockResolvedValue(undefined) }) } },
        { provide: AlertController, useValue: { create: jest.fn().mockResolvedValue({ present: jest.fn().mockResolvedValue(undefined) }) } },
        { provide: Router, useValue: { navigate: jest.fn().mockResolvedValue(true) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignInPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});