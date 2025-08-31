export interface IngredientParserResult {
  ingredient?: string;
  quantity?: number;
  unit?: string;
  confidence: number;
  category?: string;
  rawText: string;
  // Legacy properties for backward compatibility
  amount?: string;
  itemName?: string;
  brand?: string;
  metadata?: {
    temperature?: string;
    aiProcessed?: boolean;
    [key: string]: any;
  };
}

export interface IngredientParserOptions {
  enableCategoryDetection?: boolean;
  enableQuantityParsing?: boolean;
  enableUnitNormalization?: boolean;
  customCategories?: string[];
  language?: 'en' | 'fi' | 'auto';
  // Additional options
  confidenceThreshold?: number;
  useAI?: boolean;
}