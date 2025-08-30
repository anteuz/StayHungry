import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { WeeklyMenuPage } from './weekly-menu.page';
import { AuthService } from '../services/auth.service';
import { WeeklyMenuService } from '../services/weekly-menu.service';
import { EventEmitter } from '@angular/core';

describe('WeeklyMenuPage', () => {
  let component: WeeklyMenuPage;
  let fixture: ComponentFixture<WeeklyMenuPage>;
  let mockAuthService: any;
  let mockWeeklyMenuService: any;

  beforeEach(async () => {
    const weeklyMenuEvent = new EventEmitter<any[]>();

    mockAuthService = {
      isAuthenticated: jest.fn().mockReturnValue(true),
      getUserUID: jest.fn().mockReturnValue('test-user-id'),
      signin: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      getActiveUser: jest.fn(),
      getToken: jest.fn()
    };

    mockWeeklyMenuService = {
      setupHandlers: jest.fn(),
      weeklyMenuEvent: weeklyMenuEvent,
      findUsingWeekStart: jest.fn(),
      addMenu: jest.fn(),
      updateMenu: jest.fn()
    };

    await TestBed.configureTestingModule({
      declarations: [WeeklyMenuPage],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: WeeklyMenuService, useValue: mockWeeklyMenuService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WeeklyMenuPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
