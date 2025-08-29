import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentTheme: 'light' | 'dark' = 'light';

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme() {
    // Check system preference and local storage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    this.currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    this.applyTheme(this.currentTheme);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  getCurrentTheme(): 'light' | 'dark' {
    return this.currentTheme;
  }

  setTheme(theme: 'light' | 'dark') {
    this.currentTheme = theme;
    this.applyTheme(theme);
    localStorage.setItem('theme', theme);
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  private applyTheme(theme: 'light' | 'dark') {
    document.body.classList.toggle('dark-theme', theme === 'dark');
  }

  // Food category color mappings (backward compatible with itemColor1-8)
  getCategoryColor(category: string): string {
    const categoryMap = {
      // New semantic categories
      'fruits': 'category-fruits',
      'vegetables': 'category-vegetables', 
      'dairy': 'category-dairy',
      'meat': 'category-meat',
      'grains': 'category-grains',
      'pantry': 'category-pantry',
      'frozen': 'category-frozen',
      'other': 'category-other',
      
      // Backward compatibility for existing itemColor1-8
      '--ion-color-itemColor1': 'category-frozen', // Cyan
      '--ion-color-itemColor2': 'category-vegetables', // Green
      '--ion-color-itemColor3': 'category-fruits', // Pink
      '--ion-color-itemColor4': 'category-grains', // Orange
      '--ion-color-itemColor5': 'category-meat', // Red
      '--ion-color-itemColor6': 'category-pantry', // Purple
      '--ion-color-itemColor7': 'category-dairy', // Blue
      '--ion-color-itemColor8': 'category-other', // Grey
      
      // Support direct CSS variable names
      'itemColor1': 'category-frozen',
      'itemColor2': 'category-vegetables',
      'itemColor3': 'category-fruits',
      'itemColor4': 'category-grains',
      'itemColor5': 'category-meat',
      'itemColor6': 'category-pantry',
      'itemColor7': 'category-dairy',
      'itemColor8': 'category-other'
    };

    return categoryMap[category] || 'category-other';
  }

  // Get CSS variable name from category
  getCategoryVariable(category: string): string {
    const cleanCategory = this.getCategoryColor(category);
    return `--ion-color-${cleanCategory}`;
  }

  // Get available food categories for selection
  getAvailableCategories() {
    return [
      { key: 'fruits', name: 'Fruits', color: 'category-fruits', icon: 'nutrition' },
      { key: 'vegetables', name: 'Vegetables', color: 'category-vegetables', icon: 'leaf' },
      { key: 'dairy', name: 'Dairy', color: 'category-dairy', icon: 'restaurant' },
      { key: 'meat', name: 'Meat', color: 'category-meat', icon: 'fish' },
      { key: 'grains', name: 'Grains', color: 'category-grains', icon: 'cafe' },
      { key: 'pantry', name: 'Pantry', color: 'category-pantry', icon: 'storefront' },
      { key: 'frozen', name: 'Frozen', color: 'category-frozen', icon: 'snow' },
      { key: 'other', name: 'Other', color: 'category-other', icon: 'ellipsis-horizontal' }
    ];
  }
}