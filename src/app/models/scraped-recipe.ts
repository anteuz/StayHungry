export interface ScrapedRecipe {
  id?: string;
  name: string;
  image?: string[];
  description?: string;
  recipeYield?: string;
  recipeIngredient: string[];
  recipeInstructions: string[];
  nutrition?: Record<string, any>;
  tags?: string[];
  categories?: string[];
  language?: string;
  sourceUrl?: string;
  ownerId?: string;
  familyId?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecipeScrapingResult {
  status: 'ok' | 'error' | 'not_found';
  error?: string;
  extractionMethod?: string;
  recipe?: ScrapedRecipe;
  debug?: any;
}
