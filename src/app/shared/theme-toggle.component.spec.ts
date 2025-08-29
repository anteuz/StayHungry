import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ThemeToggleComponent } from './theme-toggle.component';
import { ThemeService } from '../services/theme.service';

describe('ThemeToggleComponent', () => {
  let component: ThemeToggleComponent;
  let fixture: ComponentFixture<ThemeToggleComponent>;
  let mockThemeService: jasmine.SpyObj<ThemeService>;

  beforeEach(async () => {
    const themeServiceSpy = jasmine.createSpyObj('ThemeService', ['getCurrentTheme', 'toggleTheme']);

    await TestBed.configureTestingModule({
      declarations: [ThemeToggleComponent],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: ThemeService, useValue: themeServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeToggleComponent);
    component = fixture.componentInstance;
    mockThemeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with current theme from service', () => {
    mockThemeService.getCurrentTheme.and.returnValue('dark');
    
    component.ngOnInit();
    
    expect(component.currentTheme).toBe('dark');
  });

  it('should toggle theme when button is clicked', () => {
    mockThemeService.getCurrentTheme.and.returnValue('light');
    
    component.toggleTheme();
    
    expect(mockThemeService.toggleTheme).toHaveBeenCalled();
  });

  it('should update current theme after toggle', () => {
    mockThemeService.getCurrentTheme.and.returnValue('dark');
    
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
    component.currentTheme = 'light';
    fixture.detectChanges();
    
    const iconElement = fixture.nativeElement.querySelector('ion-icon');
    expect(iconElement.getAttribute('name')).toBe('moon');
  });

  it('should display sun icon for dark theme', () => {
    component.currentTheme = 'dark';
    fixture.detectChanges();
    
    const iconElement = fixture.nativeElement.querySelector('ion-icon');
    expect(iconElement.getAttribute('name')).toBe('sunny');
  });

  it('should have proper accessibility attributes', () => {
    component.currentTheme = 'light';
    fixture.detectChanges();
    
    const buttonElement = fixture.nativeElement.querySelector('ion-button');
    expect(buttonElement.getAttribute('aria-label')).toBe('Switch to dark theme');
  });
});