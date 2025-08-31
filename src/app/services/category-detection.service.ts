import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CategoryDetectionService {
  
  private readonly categories = {
    'vegetables': ['carrot', 'onion', 'potato', 'tomato', 'lettuce', 'cucumber', 'pepper'],
    'fruits': ['apple', 'banana', 'orange', 'lemon', 'lime', 'berry', 'grape'],
    'meat': ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'fish', 'salmon'],
    'dairy': ['milk', 'cheese', 'butter', 'yogurt', 'cream', 'egg'],
    'grains': ['rice', 'pasta', 'bread', 'flour', 'oats', 'quinoa'],
    'spices': ['salt', 'pepper', 'garlic', 'ginger', 'basil', 'oregano'],
    'other': []
  };

  constructor() { }

  detectCategory(ingredient: string): string {
    const normalizedIngredient = ingredient.toLowerCase();
    
    for (const [category, items] of Object.entries(this.categories)) {
      if (items.some(item => normalizedIngredient.includes(item))) {
        return category;
      }
    }
    
    return 'other';
  }
}