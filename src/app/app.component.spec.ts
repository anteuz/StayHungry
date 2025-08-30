import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule, Platform, NavController } from '@ionic/angular';
import { AppComponent } from './app.component';
import { Auth } from '@angular/fire/auth';
import { ShoppingListService } from './services/shopping-list.service';
import { SimpleItemService } from './services/simple-item.service';
import { SimpleStateService } from './services/simple-state-service';
import { RecipeServiceService } from './services/recipe-service.service';
import { ThemeService } from './services/theme.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { UserStorageService } from './services/user-storage.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';


describe('AppComponent', () => {
  let statusBarSpy: any;
  let splashScreenSpy: any;
  let platformSpy: any;
  let platformReadySpy: Promise<void>;
  let mockAuth: any;
  let mockShoppingListService: any;
  let mockSimpleItemService: any;
  let mockSimpleStateService: any;
  let mockRecipeService: any;
  let mockThemeService: any;
  let mockNavController: any;

  beforeEach(async () => {
    statusBarSpy = {
      styleDefault: jest.fn()
    };
    splashScreenSpy = {
      hide: jest.fn()
    };
    platformReadySpy = Promise.resolve();
    platformSpy = {
      ready: jest.fn().mockReturnValue(platformReadySpy),
      is: jest.fn().mockReturnValue(false)
    };

    mockAuth = {
      currentUser: null,
      onAuthStateChanged: jest.fn()
    };

    mockShoppingListService = {
      setupHandlers: jest.fn()
    };

    mockSimpleItemService = {
      setupHandlers: jest.fn()
    };

    mockSimpleStateService = {
      setupHandlers: jest.fn().mockResolvedValue(undefined)
    };

    mockRecipeService = {
      setupHandlers: jest.fn()
    };

    mockThemeService = {
      getCurrentTheme: jest.fn().mockReturnValue('light')
    };

    mockNavController = {
      navigateForward: jest.fn(),
      navigateBack: jest.fn(),
      navigateRoot: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, IonicModule.forRoot(), AppComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: Auth, useValue: mockAuth },
        { provide: ShoppingListService, useValue: mockShoppingListService },
        { provide: SimpleItemService, useValue: mockSimpleItemService },
        { provide: SimpleStateService, useValue: mockSimpleStateService },
        { provide: RecipeServiceService, useValue: mockRecipeService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: Platform, useValue: platformSpy },
        { provide: NavController, useValue: mockNavController },
        { provide: UserStorageService, useValue: { clearUserData: jest.fn(), storeUserData: jest.fn() } }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should initialize the app', async () => {
    TestBed.createComponent(AppComponent);
    expect(platformSpy.ready).toHaveBeenCalled();
    await platformReadySpy;
  });
});
