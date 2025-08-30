import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    jest.spyOn(localStorage, 'getItem').mockImplementation((key: string) => mockLocalStorage[key] || null);
    jest.spyOn(localStorage, 'setItem').mockImplementation((key: string, value: string) => {
      mockLocalStorage[key] = value;
    });

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      })
    });

    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with light theme by default', () => {
    expect(service.getCurrentTheme()).toBe('light');
  });

  it('should toggle between light and dark themes', () => {
    expect(service.getCurrentTheme()).toBe('light');
    
    service.toggleTheme();
    expect(service.getCurrentTheme()).toBe('dark');
    
    service.toggleTheme();
    expect(service.getCurrentTheme()).toBe('light');
  });

  it('should set theme and persist to localStorage', () => {
    service.setTheme('dark');
    
    expect(service.getCurrentTheme()).toBe('dark');
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('should map legacy itemColor1-8 to semantic categories', () => {
    expect(service.getCategoryColor('itemColor1')).toBe('category-frozen');
    expect(service.getCategoryColor('itemColor2')).toBe('category-vegetables');
    expect(service.getCategoryColor('itemColor3')).toBe('category-fruits');
    expect(service.getCategoryColor('itemColor4')).toBe('category-grains');
    expect(service.getCategoryColor('itemColor5')).toBe('category-meat');
    expect(service.getCategoryColor('itemColor6')).toBe('category-pantry');
    expect(service.getCategoryColor('itemColor7')).toBe('category-dairy');
    expect(service.getCategoryColor('itemColor8')).toBe('category-other');
  });

  it('should map legacy CSS variables to semantic categories', () => {
    expect(service.getCategoryColor('--ion-color-itemColor1')).toBe('category-frozen');
    expect(service.getCategoryColor('--ion-color-itemColor2')).toBe('category-vegetables');
  });

  it('should return default category for unknown values', () => {
    expect(service.getCategoryColor('unknown')).toBe('category-other');
    expect(service.getCategoryColor('')).toBe('category-other');
  });

  it('should generate correct CSS variables', () => {
    expect(service.getCategoryVariable('fruits')).toBe('--ion-color-category-fruits');
    expect(service.getCategoryVariable('itemColor1')).toBe('--ion-color-category-frozen');
  });

  it('should extract category keys correctly', () => {
    expect(service.getCategoryKey('itemColor1')).toBe('frozen');
    expect(service.getCategoryKey('itemColor2')).toBe('vegetables');
    expect(service.getCategoryKey('--ion-color-itemColor3')).toBe('fruits');
  });

  it('should return available categories with correct structure', () => {
    const categories = service.getAvailableCategories();
    
    expect(categories).toBeDefined();
    expect(categories.length).toBe(8);
    
    const fruitsCategory = categories.find(cat => cat.key === 'fruits');
    expect(fruitsCategory).toEqual({
      key: 'fruits',
      name: 'Fruits',
      color: 'category-fruits',
      icon: 'nutrition'
    });
  });

  it('should clean up media query listener on destroy', () => {
    const removeEventListenerSpy = jest.fn();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: removeEventListenerSpy
      })
    });

    const testService = new ThemeService();
    testService.ngOnDestroy();

    expect(removeEventListenerSpy).toHaveBeenCalled();
  });

  it('should apply theme to document body', () => {
    const mockMatchMedia = {
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockReturnValue(mockMatchMedia)
    });

    const testService = new ThemeService();
    testService.setTheme('dark');

    expect(document.body.classList.contains('dark-theme')).toBe(true);
  });
});