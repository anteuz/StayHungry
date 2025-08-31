export interface IngredientParserResult {
  amount: string;
  brand?: string;
  itemName: string;
  category?: string;
  confidence: number;
  rawText: string;
  metadata?: {
    packageSize?: string;
    redundantMeasure?: string; // e.g., "(500 g)" from "2-3 (500 g)"
    subBrand?: string; // e.g., "Lempi" from "Arla Lempi"
    temperature?: string; // e.g., "pakaste" (frozen)
    preparation?: string; // e.g., "kuivattu" (dried)
    [key: string]: any;
  };
}

export interface IngredientParserOptions {
  useAI?: boolean;
  confidenceThreshold?: number;
  language?: string;
  preferredCategories?: string[];
}
