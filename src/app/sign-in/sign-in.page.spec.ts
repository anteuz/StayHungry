import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SignInPage } from './sign-in.page';
import { AuthService } from '../services/auth.service';

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
      declarations: [SignInPage],
      imports: [IonicModule.forRoot(), FormsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
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