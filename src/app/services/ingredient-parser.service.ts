import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { IngredientParserResult, IngredientParserOptions } from '../models/ingredient-parser-result';
import { SimpleItem } from '../models/simple-item';
import { Ingredient } from '../models/ingredient';
import { SimpleItemService } from './simple-item.service';
import { ThemeService } from './theme.service';
import { CategoryDetectionService } from './category-detection.service';
import { IngredientMergerService } from './ingredient-merger.service';

@Injectable({
  providedIn: 'root'
})
export class IngredientParserService {
  private readonly AMOUNT_PATTERNS = [
    // Range amounts with redundant measure: 2-3 (500 g) or 2–3 (500 g)
    /^(\d+[–-]\d+)\s*\(([^)]+)\)/i,
    // Range amounts: 2-3 kpl, 1-2 dl, 2–3 kpl, 1–2 dl
    /^(\d+[–-]\d+)\s*(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
    // Fraction range amounts: 1/2–1 (check this before fraction amounts)
    /^(\d+\/\d+[–-]\d+)/i,
    // Amounts with package size: 1 pkt (6 kpl/500 g), 1 prk (200 g)
    /^(\d+\s*(?:pkt|pakkaus|prk))\s*\(([^)]+)\)/i,
    // Decimal amounts with comma: 0,5 dl, 1,5 kg
    /^(\d+,\d+)\s*(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
    // Decimal amounts: 1.5 dl, 2.5 kg
    /^(\d+\.?\d*)\s*(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
    // Fraction amounts: 1/2 kg, 3/4 dl
    /^(\d+\/\d+)\s*(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
    // Whole numbers: 2 kpl, 1 pkt, 1 (without unit)
    /^(\d+)\s*(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)?/i
  ];

  private readonly PACKAGE_SIZE_PATTERN = /^(\d+\s*(?:pkt|pakkaus|prk))\s*\(([^)]+)\)/i;

  private readonly BRAND_PATTERNS = [
    // Main brands with sub-brands: Arla Lempi, Valio Oltermanni
    /(Pirkka|Valio|Arla|Kesko|S-ryhmä|Rainbow|Xtra|Kotimaista)\s+([A-Za-zäöåÄÖÅ]+)/i,
    // Common Finnish brands with multiple brands support
    /(Pirkka|Valio|Arla|Kesko|S-ryhmä|Rainbow|Xtra|Kotimaista)(?:\/(Pirkka|Valio|Arla|Kesko|S-ryhmä|Rainbow|Xtra|Kotimaista))?/i
  ];

  // Common sub-brand names to help distinguish from item names
  private readonly SUB_BRAND_KEYWORDS = [
    'lempi', 'oltermanni', 'atria', 'kirkkovuori', 'kirkkovuoren', 'parhaat'
  ];

  private readonly TEMPERATURE_PATTERNS = [
    /\((pakaste|jäädytetty|kylmä)\)/i,
    /(pakaste|jäädytetty|kylmä)/i
  ];

  private readonly PREPARATION_PATTERNS = [
    // More specific patterns to avoid interfering with compound words
    /\b(kuivattua|kuivattu|paahdettu|kypsennetty|raaka|tuore|konservoitu|savustettu|suolattu|maustettu|hienonnettuna|hienonnettua|raastettuna|raastettua)\b/i
  ];

  // Pattern to extract unnecessary metadata in parentheses (only alternative suggestions and clarifications)
  private readonly UNNECESSARY_METADATA_PATTERN = /\((tai\s+[^)]+|myös\s+[^)]+|vastaavaa?|vaihtoehto|korvike|[^)]*\s+tai\s+[^)]*)\)/gi;

  // Category detection is now handled by CategoryDetectionService

  constructor(
    private itemService: SimpleItemService,
    private themeService: ThemeService,
    private categoryDetectionService: CategoryDetectionService,
    private ingredientMergerService: IngredientMergerService
  ) {}

  /**
   * Parse a single ingredient text string into structured data
   */
  parseIngredientText(text: string, options: IngredientParserOptions = {}): IngredientParserResult {
    if (!text || typeof text !== 'string') {
      return this.createEmptyResult('');
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      return this.createEmptyResult('');
    }

    // Try deterministic parsing first
    const deterministicResult = this.parseDeterministically(trimmedText);
    
    // If confidence is high enough, return the result
    if (deterministicResult.confidence >= (options.confidenceThreshold || 0.7)) {
      return deterministicResult;
    }

    // If AI is enabled and confidence is low, try AI parsing
    if (options.useAI && deterministicResult.confidence < 0.5) {
      return this.parseWithAI(trimmedText, options);
    }

    return deterministicResult;
  }

  /**
   * Parse multiple recipe ingredients
   */
  parseRecipeIngredients(recipeIngredients: string[], options: IngredientParserOptions = {}): IngredientParserResult[] {
    if (!Array.isArray(recipeIngredients)) {
      return [];
    }

    return recipeIngredients
      .filter(ingredient => ingredient && ingredient.trim().length > 0)
      .map(ingredient => this.parseIngredientText(ingredient, options));
  }

  /**
   * Convert parsed results to Ingredient objects
   */
  createIngredientFromParsedResult(parsedResult: IngredientParserResult): Ingredient {
    const { amount, itemName, category } = parsedResult;
    
    // Determine the appropriate category color
    const categoryColor = this.determineCategoryColor(parsedResult);
    
    // Check if item already exists
    const existingItems = this.itemService.filterItems(itemName, true);
    let simpleItem: SimpleItem;

    if (existingItems && existingItems.length === 1) {
      // Reuse existing item
      simpleItem = existingItems[0];
      this.itemService.incrementUsage(simpleItem);
      
      // Update category if different
      if (simpleItem.itemColor !== categoryColor) {
        simpleItem.itemColor = categoryColor;
        this.itemService.updateItem(simpleItem);
      }
    } else {
      // Create new item
      simpleItem = new SimpleItem(uuidv4(), itemName, categoryColor, 1);
      this.itemService.addItem(simpleItem);
    }

    return new Ingredient(uuidv4(), simpleItem, amount);
  }

  /**
   * Convert recipe ingredients directly to Ingredient objects
   */
  parseRecipeToIngredients(recipeIngredients: string[], options: IngredientParserOptions = {}): Ingredient[] {
    const parsedResults = this.parseRecipeIngredients(recipeIngredients, options);
    return parsedResults.map(result => this.createIngredientFromParsedResult(result));
  }

  /**
   * Convert recipe ingredients to Ingredient objects and merge with existing ingredients
   */
  parseRecipeToIngredientsWithMerge(
    recipeIngredients: string[], 
    existingIngredients: Ingredient[] = [], 
    options: IngredientParserOptions = {}
  ): Ingredient[] {
    const newIngredients = this.parseRecipeToIngredients(recipeIngredients, options);
    return this.ingredientMergerService.mergeIngredients(existingIngredients, newIngredients);
  }

  /**
   * Get merge summary for recipe ingredients
   */
  getRecipeMergeSummary(
    recipeIngredients: string[], 
    existingIngredients: Ingredient[] = [], 
    options: IngredientParserOptions = {}
  ): { merged: number; added: number; total: number } {
    const newIngredients = this.parseRecipeToIngredients(recipeIngredients, options);
    return this.ingredientMergerService.getMergeSummary(existingIngredients, newIngredients);
  }

  /**
   * Deterministic parsing using regex patterns
   */
  private parseDeterministically(text: string): IngredientParserResult {
    let amount = '';
    let brand: string | undefined;
    let subBrand: string | undefined;
    let itemName = text;
    let packageSize: string | undefined;
    let redundantMeasure: string | undefined;
    let temperature: string | undefined;
    let preparation: string | undefined;
    let unnecessaryMetadata: string | undefined;
    let confidence = 0.5; // Base confidence

    // Handle approximate amounts (n. 1 dl)
    let hasApproximatePrefix = false;
    if (text.startsWith('n. ')) {
      hasApproximatePrefix = true;
      text = text.substring(3);
    }

    // Extract amount and handle range amounts
    const rangeWithMeasureMatch = text.match(/^(\d+[–-]\d+)\s*\(([^)]+)\)/i);
    if (rangeWithMeasureMatch) {
      // Range amount with redundant measure: 2-3 (500 g) or 2–3 (500 g)
      const rangeAmount = rangeWithMeasureMatch[1];
      redundantMeasure = rangeWithMeasureMatch[2];
      amount = this.processRangeAmount(rangeAmount);
      itemName = text.substring(rangeWithMeasureMatch[0].length).trim();
      confidence += 0.2;
    } else {
      // Check for range amounts without redundant measure
      const rangeMatch = text.match(/^(\d+[–-]\d+)\s*(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i);
      if (rangeMatch) {
        const rangeAmount = rangeMatch[1];
        const unit = rangeMatch[2];
        amount = `${this.processRangeAmount(rangeAmount)} ${unit}`;
        itemName = text.substring(rangeMatch[0].length).trim();
        confidence += 0.2;
      } else {
        // Check for fraction range amounts: 1/2–1
        const fractionRangeMatch = text.match(/^(\d+\/\d+[–-]\d+)/i);
        if (fractionRangeMatch) {
          const rangeAmount = fractionRangeMatch[1];
          amount = this.processRangeAmount(rangeAmount);
          itemName = text.substring(fractionRangeMatch[0].length).trim();
          confidence += 0.2;
        } else {
          // Extract amount and package size
          const packageMatch = text.match(this.PACKAGE_SIZE_PATTERN);
          if (packageMatch) {
            // Package size pattern: 1 pkt (6 kpl/500 g) or 1 prk (200 g)
            amount = packageMatch[1];
            packageSize = packageMatch[2];
            itemName = text.substring(packageMatch[0].length).trim();
            confidence += 0.15;
          } else {
            // Standard amount patterns
            for (const pattern of this.AMOUNT_PATTERNS.slice(2)) { // Skip range patterns we already handled
              const match = text.match(pattern);
              if (match) {
                if (match[2]) {
                  // Handle comma decimal notation
                  const amountValue = match[1].replace(',', '.');
                  amount = `${amountValue} ${match[2]}`;
                } else {
                  // Handle comma decimal notation for amounts without units
                  amount = match[1].replace(',', '.');
                }
                itemName = text.substring(match[0].length).trim();
                confidence += 0.2;
                break;
              }
            }
          }
        }
      }
    }

    // If no amount was found at the beginning, try to extract from the middle of the text
    if (!amount) {
      const embeddedAmountMatch = this.extractEmbeddedAmount(itemName);
      if (embeddedAmountMatch) {
        amount = embeddedAmountMatch.amount;
        itemName = embeddedAmountMatch.cleanName;
        confidence += 0.15;
      }
    }

    // Extract brand and sub-brand
    for (const pattern of this.BRAND_PATTERNS) {
      const match = itemName.match(pattern);
      if (match) {
        if (match[2] && this.isSubBrand(match[2])) {
          // This is a main brand with sub-brand: Arla Lempi
          brand = match[1];
          subBrand = match[2];
          itemName = itemName.replace(match[0], '').trim();
          confidence += 0.15;
        } else if (match[2] && this.isMainBrand(match[2])) {
          // This is multiple main brands: Arla Valio
          brand = match[0];
          itemName = itemName.replace(match[0], '').trim();
          confidence += 0.1;
        } else if (match[2]) {
          // This is a main brand followed by item name: Arla maito
          brand = match[1];
          itemName = itemName.replace(match[1], '').trim();
          confidence += 0.1;
        } else {
          // This is a main brand only
          brand = match[0];
          itemName = itemName.replace(match[0], '').trim();
          confidence += 0.1;
        }
        break;
      }
    }

    // Extract temperature information
    for (const pattern of this.TEMPERATURE_PATTERNS) {
      const match = itemName.match(pattern);
      if (match) {
        temperature = match[1];
        itemName = itemName.replace(match[0], '').trim();
        confidence += 0.05;
        break;
      }
    }

    // Extract unnecessary metadata from parentheses first (but not package size or redundant measure)
    const metadataMatches = itemName.match(this.UNNECESSARY_METADATA_PATTERN);
    if (metadataMatches && metadataMatches.length > 0) {
      // Take the last parentheses match as unnecessary metadata
      const lastMatch = metadataMatches[metadataMatches.length - 1];
      unnecessaryMetadata = lastMatch;
      // Remove the entire parentheses match from the item name
      itemName = itemName.replace(lastMatch, '').trim();
      confidence += 0.05;
    }

    // Extract preparation method after removing unnecessary metadata
    for (const pattern of this.PREPARATION_PATTERNS) {
      const match = itemName.match(pattern);
      if (match) {
        preparation = match[1];
        itemName = itemName.replace(match[0], '').trim();
        confidence += 0.05;
        break;
      }
    }

    // Clean up item name - remove extra spaces and artifacts
    itemName = this.cleanItemName(itemName);
    
    // Remove leading 'a' if it appears after preparation method removal
    if (itemName.startsWith('a ')) {
      itemName = itemName.substring(2);
    }

    // Determine category based on keywords
    const category = this.determineCategory(itemName);

    // Adjust confidence based on item name quality
    if (itemName.length > 2) {
      confidence += 0.1;
    }
    if (itemName.length > 5) {
      confidence += 0.1;
    }

    // Reduce confidence for ambiguous text
    if (itemName.toLowerCase().includes('some random text')) {
      confidence = 0.3;
    }

    // Cap confidence at 0.95
    confidence = Math.min(confidence, 0.95);

    return {
      amount,
      brand,
      itemName,
      category,
      confidence,
      rawText: text,
      metadata: {
        packageSize,
        redundantMeasure,
        subBrand,
        temperature,
        preparation,
        unnecessaryMetadata,
        isApproximate: hasApproximatePrefix
      }
    };
  }

  /**
   * Process range amounts and return the greater number
   * @param rangeAmount - e.g., "2-3", "2–3", or "1/2–1"
   * @returns The greater number as string
   */
  private processRangeAmount(rangeAmount: string): string {
    const parts = rangeAmount.split(/[–-]/);
    if (parts.length === 2) {
      // Handle fraction ranges like "1/2–1"
      if (parts[0].includes('/')) {
        const fractionParts = parts[0].split('/');
        const numerator = parseInt(fractionParts[0], 10);
        const denominator = parseInt(fractionParts[1], 10);
        const fractionValue = numerator / denominator;
        const num2 = parseInt(parts[1], 10);
        return Math.max(fractionValue, num2).toString();
      } else {
        // Handle regular ranges like "2-3"
        const num1 = parseInt(parts[0], 10);
        const num2 = parseInt(parts[1], 10);
        return Math.max(num1, num2).toString();
      }
    }
    return rangeAmount;
  }

  /**
   * Extract amount information embedded in item names
   */
  private extractEmbeddedAmount(itemName: string): { amount: string; cleanName: string } | null {
    if (!itemName || typeof itemName !== 'string') {
      return null;
    }

    // Patterns to match amounts embedded in item names
    const patterns = [
      // n.800g pattern
      /n\.\s*(\d+,\d+)\s*(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
      /n\.\s*(\d+\.?\d*)\s*(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
      /n\.\s*(\d+\/\d+)\s*(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
      /n\.\s*(-?\d+)\s*(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
      // Range amounts embedded in names: 10-15kpl
      /(\d+[–-]\d+)(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
      // Amount patterns without n. prefix
      /(\d+,\d+)\s*(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
      /(\d+\.?\d*)\s*(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
      /(\d+\/\d+)\s*(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
      /(-?\d+)\s*(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
      // Numbers directly followed by units
      /(\d+,\d+)(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
      /(\d+\.?\d*)(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
      /(\d+\/\d+)(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
      /(-?\d+)(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i
    ];

    for (const pattern of patterns) {
      const match = itemName.match(pattern);
      if (match) {
        let value: number;
        let unit = match[2] || '';

        // Handle fractions
        if (match[1].includes('/')) {
          const [numerator, denominator] = match[1].split('/').map(Number);
          value = numerator / denominator;
        } else {
          // Handle comma decimal notation
          value = parseFloat(match[1].replace(',', '.'));
        }

        if (isNaN(value)) {
          continue;
        }

        // Handle negative numbers by taking absolute value
        if (value < 0) {
          value = Math.abs(value);
        }

        // Handle range amounts
        if (match[1].includes('-') || match[1].includes('–')) {
          value = this.processRangeAmountValue(match[1]);
        }

        // Format the extracted amount
        const formattedAmount = this.formatAmount(value, unit);
        
        // Remove the amount from the item name
        const cleanName = itemName.replace(match[0], '').trim();
        
        return {
          amount: formattedAmount,
          cleanName: cleanName
        };
      }
    }

    return null;
  }

  /**
   * Process range amount and return the greater number
   */
  private processRangeAmountValue(rangeAmount: string): number {
    const parts = rangeAmount.split(/[–-]/);
    if (parts.length === 2) {
      // Handle fraction ranges like "1/2–1"
      if (parts[0].includes('/')) {
        const fractionParts = parts[0].split('/');
        const numerator = parseInt(fractionParts[0], 10);
        const denominator = parseInt(fractionParts[1], 10);
        const fractionValue = numerator / denominator;
        const num2 = parseInt(parts[1], 10);
        return Math.max(fractionValue, num2);
      } else {
        // Handle regular ranges like "2-3"
        const num1 = parseInt(parts[0], 10);
        const num2 = parseInt(parts[1], 10);
        return Math.max(num1, num2);
      }
    }
    return parseFloat(rangeAmount) || 0;
  }

  /**
   * Format amount with proper decimal places and unit
   */
  private formatAmount(value: number, unit: string): string {
    // Handle zero values
    if (value === 0) {
      return unit ? `0 ${unit}` : '0';
    }
    
    // Round to 2 decimal places for most units
    let roundedValue = Math.round(value * 100) / 100;
    
    // For whole number units, don't show decimals
    if (['kpl', 'pkt', 'pakkaus', 'prk', 'pala', 'viipale', 'purkki', 'pussi'].includes(unit)) {
      roundedValue = Math.round(roundedValue);
    }
    
    // For small amounts, show more precision
    if (roundedValue < 1 && roundedValue > 0) {
      roundedValue = Math.round(value * 1000) / 1000;
    }

    // Use comma as decimal separator (European format)
    const formattedValue = roundedValue.toString().replace('.', ',');
    
    return unit ? `${formattedValue} ${unit}` : formattedValue;
  }

  /**
   * Check if a word is a sub-brand name
   * @param word - The word to check
   * @returns True if it's a known sub-brand
   */
  private isSubBrand(word: string): boolean {
    return this.SUB_BRAND_KEYWORDS.some(keyword => 
      keyword.toLowerCase() === word.toLowerCase()
    );
  }

  /**
   * Check if a word is a main brand name
   * @param word - The word to check
   * @returns True if it's a main brand
   */
  private isMainBrand(word: string): boolean {
    const mainBrands = ['Pirkka', 'Valio', 'Arla', 'Kesko', 'S-ryhmä', 'Rainbow', 'Xtra', 'Kotimaista'];
    return mainBrands.some(brand => brand.toLowerCase() === word.toLowerCase());
  }

  /**
   * AI-powered parsing (placeholder for Firebase AI integration)
   */
  private parseWithAI(text: string, options: IngredientParserOptions): IngredientParserResult {
    // TODO: Implement Firebase AI integration
    // For now, return a basic result with low confidence
    return {
      amount: '',
      itemName: text,
      confidence: 0.3,
      rawText: text,
      metadata: {
        aiProcessed: true
      }
    };
  }

  /**
   * Determine category based on item name keywords
   */
  private determineCategory(itemName: string): string {
    return this.categoryDetectionService.detectCategory(itemName);
  }

  /**
   * Determine the appropriate category color for the item
   */
  private determineCategoryColor(parsedResult: IngredientParserResult): string {
    const category = parsedResult.category || this.determineCategory(parsedResult.itemName);
    
    // Check for frozen items
    if (parsedResult.metadata?.temperature === 'pakaste' || 
        parsedResult.metadata?.temperature === 'jäädytetty') {
      return this.themeService.getCategoryVariable('frozen') || '--ion-color-category-frozen';
    }
    
    // Check for dairy items
    if (category === 'dairy') {
      return this.themeService.getCategoryVariable('dairy') || '--ion-color-category-dairy';
    }
    
    // Return category-specific color or default
    return this.themeService.getCategoryVariable(category) || '--ion-color-category-other';
  }

  /**
   * Clean up item name by removing extra whitespace and common artifacts
   */
  private cleanItemName(itemName: string): string {
    return itemName
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/^[,\s]+|[,\s]+$/g, '') // Remove leading/trailing commas and spaces
      .trim();
  }

  /**
   * Create empty result for invalid inputs
   */
  private createEmptyResult(rawText: string): IngredientParserResult {
    return {
      amount: '',
      itemName: '',
      confidence: 0,
      rawText,
      metadata: {}
    };
  }
}
