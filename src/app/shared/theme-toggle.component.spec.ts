import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ThemeToggleComponent } from './theme-toggle.component';
import { ThemeService } from '../services/theme.service';

describe('ThemeToggleComponent', () => {
  let component: ThemeToggleComponent;
  let fixture: ComponentFixture<ThemeToggleComponent>;
  let mockThemeService: any;

  beforeEach(async () => {
    const themeServiceSpy = {
      getCurrentTheme: jest.fn().mockReturnValue('light'),
      toggleTheme: jest.fn()
    };

    await TestBed.configureTestingModule({
      declarations: [ThemeToggleComponent],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: ThemeService, useValue: themeServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeToggleComponent);
    component = fixture.componentInstance;
    mockThemeService = TestBed.inject(ThemeService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with current theme from service', () => {
    mockThemeService.getCurrentTheme.mockReturnValue('dark');
    
    component.ngOnInit();
    
    expect(component.currentTheme).toBe('dark');
  });

  it('should toggle theme when button is clicked', () => {
    mockThemeService.getCurrentTheme.mockReturnValue('light');
    
    component.toggleTheme();
    
    expect(mockThemeService.toggleTheme).toHaveBeenCalled();
  });

  it('should update current theme after toggle', () => {
    mockThemeService.getCurrentTheme.mockReturnValue('dark');
    
    component.toggleTheme();
    
    expect(component.currentTheme).toBe('dark');
  });

  it('should return correct aria label for light theme', () => {
    component.currentTheme = 'light';
    
    expect(component.getAriaLabel()).toBe('Switch to dark theme');
  });

  it('should return correct aria label for dark theme', () => {
    component.currentTheme = 'dark';
    
    expect(component.getAriaLabel()).toBe('Switch to light theme');
  });

  it('should display moon icon for light theme', () => {
    mockThemeService.getCurrentTheme.mockReturnValue('light');
    component.ngOnInit();
    fixture.detectChanges();
    
    const iconElement = fixture.nativeElement.querySelector('ion-icon');
    expect(iconElement.name).toBe('moon');
  });

  it('should display sun icon for dark theme', () => {
    mockThemeService.getCurrentTheme.mockReturnValue('dark');
    component.ngOnInit();
    fixture.detectChanges();
    
    const iconElement = fixture.nativeElement.querySelector('ion-icon');
    expect(iconElement.name).toBe('sunny');
  });

  it('should have proper accessibility attributes', () => {
    mockThemeService.getCurrentTheme.mockReturnValue('light');
    component.ngOnInit();
    fixture.detectChanges();
    
    const buttonElement = fixture.nativeElement.querySelector('ion-button');
    expect(buttonElement.getAttribute('aria-label')).toBe('Switch to dark theme');
  });
});