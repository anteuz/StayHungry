import { Injectable } from '@angular/core';
import { Ingredient } from '../models/ingredient';
import { SimpleItem } from '../models/simple-item';

export interface UnitConversion {
  unit: string;
  baseUnit: string;
  conversionFactor: number;
}

export interface ParsedAmount {
  value: number;
  unit: string;
  originalText: string;
}

@Injectable({
  providedIn: 'root'
})
export class IngredientMergerService {

  // European metric unit conversions (to base units)
  private readonly UNIT_CONVERSIONS: UnitConversion[] = [
    // Volume units (base: ml)
    { unit: 'ml', baseUnit: 'ml', conversionFactor: 1 },
    { unit: 'cl', baseUnit: 'ml', conversionFactor: 10 },
    { unit: 'dl', baseUnit: 'ml', conversionFactor: 100 },
    { unit: 'l', baseUnit: 'ml', conversionFactor: 1000 },
    
    // Weight units (base: g)
    { unit: 'g', baseUnit: 'g', conversionFactor: 1 },
    { unit: 'kg', baseUnit: 'g', conversionFactor: 1000 },
    
    // Count units (base: kpl)
    { unit: 'kpl', baseUnit: 'kpl', conversionFactor: 1 },
    { unit: 'pkt', baseUnit: 'kpl', conversionFactor: 1 }, // package
    { unit: 'pakkaus', baseUnit: 'kpl', conversionFactor: 1 }, // package
    { unit: 'prk', baseUnit: 'kpl', conversionFactor: 1 }, // package
    
    // Spoon units (base: rkl)
    { unit: 'rkl', baseUnit: 'rkl', conversionFactor: 1 }, // tablespoon
    { unit: 'tl', baseUnit: 'rkl', conversionFactor: 0.33 }, // teaspoon (1/3 tablespoon)
    
    // Other units
    { unit: 'kuppi', baseUnit: 'kuppi', conversionFactor: 1 }, // cup
    { unit: 'pala', baseUnit: 'pala', conversionFactor: 1 }, // piece
    { unit: 'viipale', baseUnit: 'viipale', conversionFactor: 1 }, // slice
    { unit: 'purkki', baseUnit: 'purkki', conversionFactor: 1 }, // jar
    { unit: 'pussi', baseUnit: 'pussi', conversionFactor: 1 } // bag
  ];

  // Preferred display units for different base units
  private readonly PREFERRED_UNITS = {
    'ml': 'l', // Prefer liters for large volumes
    'g': 'kg', // Prefer kilograms for large weights
    'kpl': 'kpl', // Keep pieces as is
    'rkl': 'rkl', // Keep tablespoons as is
    'kuppi': 'kuppi', // Keep cups as is
    'pala': 'pala', // Keep pieces as is
    'viipale': 'viipale', // Keep slices as is
    'purkki': 'purkki', // Keep jars as is
    'pussi': 'pussi' // Keep bags as is
  };

  // Thresholds for unit conversion (when to switch to larger unit)
  private readonly CONVERSION_THRESHOLDS = {
    'ml': 1000, // Switch to liters when >= 1000ml
    'g': 1000,  // Switch to kilograms when >= 1000g
    'rkl': 3    // Switch to larger unit when >= 3 tablespoons
  };

  constructor() {}

  /**
   * Merge ingredients with the same item, combining their amounts
   */
  mergeIngredients(existingIngredients: Ingredient[], newIngredients: Ingredient[]): Ingredient[] {
    if (!existingIngredients || existingIngredients.length === 0) {
      return newIngredients ? [...newIngredients] : [];
    }

    if (!newIngredients || newIngredients.length === 0) {
      return existingIngredients ? [...existingIngredients] : [];
    }

    const mergedIngredients: Ingredient[] = [];
    const existingMap = new Map<string, Ingredient>();

    // Create a map of existing ingredients by item UUID
    existingIngredients.forEach(ingredient => {
      existingMap.set(ingredient.item.uuid, ingredient);
    });

    // Process new ingredients
    newIngredients.forEach(newIngredient => {
      const existingIngredient = existingMap.get(newIngredient.item.uuid);
      
      if (existingIngredient) {
        // Merge with existing ingredient
        const mergedAmount = this.mergeAmountsWithItemName(
          existingIngredient.amount, 
          newIngredient.amount,
          existingIngredient.item.itemName,
          newIngredient.item.itemName
        );
        const mergedIngredient = new Ingredient(
          existingIngredient.uuid,
          existingIngredient.item,
          mergedAmount
        );
        
        // Preserve collection status from existing ingredient
        mergedIngredient.isCollected = existingIngredient.isCollected;
        mergedIngredient.isBeingCollected = existingIngredient.isBeingCollected;
        mergedIngredient.isCollectedAsDefault = existingIngredient.isCollectedAsDefault;
        
        existingMap.set(newIngredient.item.uuid, mergedIngredient);
      } else {
        // Add as new ingredient
        existingMap.set(newIngredient.item.uuid, newIngredient);
      }
    });

    // Convert map back to array
    return Array.from(existingMap.values());
  }

  /**
   * Merge two amount strings and return the combined amount
   */
  mergeAmounts(amount1: string, amount2: string): string {
    if (!amount1 || !amount2) {
      return amount1 || amount2 || '';
    }

    const parsed1 = this.parseAmount(amount1);
    const parsed2 = this.parseAmount(amount2);

    if (!parsed1 || !parsed2) {
      // If parsing fails, concatenate with '+'
      return `${amount1} + ${amount2}`;
    }

    // Check if units are compatible
    if (!this.areUnitsCompatible(parsed1.unit, parsed2.unit)) {
      // If units are not compatible, concatenate with '+'
      return `${amount1} + ${amount2}`;
    }

    // Convert to base units and add
    const baseValue1 = this.convertToBaseUnit(parsed1.value, parsed1.unit);
    const baseValue2 = this.convertToBaseUnit(parsed2.value, parsed2.unit);
    const totalBaseValue = baseValue1 + baseValue2;

    // Convert back to preferred unit
    return this.convertToPreferredUnit(totalBaseValue, parsed1.unit);
  }

  /**
   * Merge amounts, extracting from item name if amount is empty
   */
  mergeAmountsWithItemName(amount1: string, amount2: string, itemName1?: string, itemName2?: string): string {
    // If both amounts are empty, return empty
    if (!amount1 && !amount2) {
      return '';
    }

    // Extract amount from item names if amounts are empty
    let effectiveAmount1 = amount1;
    let effectiveAmount2 = amount2;

    if (!amount1 && itemName1) {
      const extractedAmount = this.extractAmountFromItemName(itemName1);
      if (extractedAmount) {
        effectiveAmount1 = extractedAmount;
      }
    }

    if (!amount2 && itemName2) {
      const extractedAmount = this.extractAmountFromItemName(itemName2);
      if (extractedAmount) {
        effectiveAmount2 = extractedAmount;
      }
    }

    // If we still don't have both amounts, return the non-empty one or empty
    if (!effectiveAmount1 || !effectiveAmount2) {
      return effectiveAmount1 || effectiveAmount2 || '';
    }

    return this.mergeAmounts(effectiveAmount1, effectiveAmount2);
  }

  /**
   * Extract amount information from item name
   */
  extractAmountFromItemName(itemName: string): string | null {
    if (!itemName || typeof itemName !== 'string') {
      return null;
    }

    // Look for amount patterns in the item name
    const patterns = [
      // n.800g pattern
      /n\.\s*(\d+,\d+)\s*(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
      /n\.\s*(\d+\.?\d*)\s*(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
      /n\.\s*(\d+\/\d+)\s*(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
      /n\.\s*(-?\d+)\s*(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
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

        // Format the extracted amount
        return this.formatAmount(value, unit);
      }
    }

    return null;
  }

  /**
   * Parse amount string into value and unit
   */
  parseAmount(amountText: string): ParsedAmount | null {
    if (!amountText || typeof amountText !== 'string') {
      return null;
    }

    const trimmed = amountText.trim();
    
    // Handle approximate amounts (n. 1 dl)
    let isApproximate = false;
    let text = trimmed;
    if (trimmed.startsWith('n. ')) {
      isApproximate = true;
      text = trimmed.substring(3);
    }

    // Handle concatenated amounts like "2 kpl2 kpl" - split and parse the first one
    if (text.match(/(\d+\s*[a-zA-Z]+)(\d+\s*[a-zA-Z]+)/)) {
      // Find the first complete amount pattern
      const firstAmountMatch = text.match(/^(\d+(?:[,\/]\d+)?(?:\.\d+)?)\s*(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i);
      if (firstAmountMatch) {
        text = firstAmountMatch[0];
      }
    }

    // Match amount patterns
    const patterns = [
      // Decimal with comma: 0,5 dl
      /^(\d+,\d+)\s*(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
      // Decimal with dot: 1.5 dl or 0.001 l
      /^(\d+\.?\d*)\s*(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
      // Fraction: 1/2 kg
      /^(\d+\/\d+)\s*(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
      // Whole number with unit: 2 kpl (including negative numbers)
      /^(-?\d+)\s*(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
      // Numbers directly followed by units without space: 15kpl, 2dl, etc.
      /^(\d+,\d+)(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
      /^(\d+\.?\d*)(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
      /^(\d+\/\d+)(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
      /^(-?\d+)(dl|ml|l|g|kg|kpl|pkt|rkl|tl|prk|kuppi|pala|viipale|purkki|pussi|pakkaus)/i,
      // Whole number without unit: 2 (including negative numbers)
      /^(-?\d+)$/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
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

        return {
          value,
          unit: unit.toLowerCase(),
          originalText: amountText
        };
      }
    }

    return null;
  }

  /**
   * Check if two units are compatible for merging
   */
  areUnitsCompatible(unit1: string, unit2: string): boolean {
    // If both units are empty, they are compatible (numbers without units)
    if (!unit1 && !unit2) {
      return true;
    }
    
    // If one unit is empty and the other is not, they are not compatible
    if (!unit1 || !unit2) {
      return false;
    }

    const baseUnit1 = this.getBaseUnit(unit1);
    const baseUnit2 = this.getBaseUnit(unit2);

    return baseUnit1 === baseUnit2;
  }

  /**
   * Get the base unit for a given unit
   */
  getBaseUnit(unit: string): string {
    const conversion = this.UNIT_CONVERSIONS.find(c => c.unit === unit.toLowerCase());
    return conversion ? conversion.baseUnit : unit.toLowerCase();
  }

  /**
   * Convert value to base unit
   */
  convertToBaseUnit(value: number, unit: string): number {
    const conversion = this.UNIT_CONVERSIONS.find(c => c.unit === unit.toLowerCase());
    if (!conversion) {
      return value; // Return as-is if no conversion found
    }
    return value * conversion.conversionFactor;
  }

  /**
   * Convert base unit value to preferred display unit
   */
  convertToPreferredUnit(baseValue: number, originalUnit: string): string {
    const baseUnit = this.getBaseUnit(originalUnit);
    const preferredUnit = this.PREFERRED_UNITS[baseUnit] || baseUnit;
    
    // Check if we should convert to a larger unit
    const threshold = this.CONVERSION_THRESHOLDS[baseUnit];
    if (threshold && baseValue >= threshold) {
      const conversion = this.UNIT_CONVERSIONS.find(c => c.unit === preferredUnit);
      if (conversion && conversion.baseUnit === baseUnit) {
        const convertedValue = baseValue / conversion.conversionFactor;
        return this.formatAmount(convertedValue, preferredUnit);
      }
    }

    // For volume units, prefer the larger unit when appropriate
    if (baseUnit === 'ml' && baseValue >= 1000) {
      return this.formatAmount(baseValue / 1000, 'l');
    }
    
    // For small volume amounts, prefer ml over very small l values, but preserve original unit when reasonable
    if (baseUnit === 'ml' && baseValue < 1000 && baseValue > 0) {
      // If the original unit was dl and the result is a whole number of dl, prefer dl
      if (originalUnit === 'dl' && baseValue % 100 === 0) {
        return this.formatAmount(baseValue / 100, 'dl');
      }
      // If the original unit was dl and the result is a reasonable decimal of dl, prefer dl
      if (originalUnit === 'dl' && baseValue % 25 === 0) { // 25 ml = 0.25 dl
        return this.formatAmount(baseValue / 100, 'dl');
      }
      // Otherwise use ml for small amounts
      return this.formatAmount(baseValue, 'ml');
    }
    
    // For weight units, prefer the larger unit when appropriate
    if (baseUnit === 'g' && baseValue >= 1000) {
      return this.formatAmount(baseValue / 1000, 'kg');
    }

    // Convert back to original unit
    const originalConversion = this.UNIT_CONVERSIONS.find(c => c.unit === originalUnit.toLowerCase());
    if (originalConversion && originalConversion.baseUnit === baseUnit) {
      const convertedValue = baseValue / originalConversion.conversionFactor;
      return this.formatAmount(convertedValue, originalUnit);
    }

    // Fallback to base unit
    return this.formatAmount(baseValue, baseUnit);
  }

  /**
   * Format amount with proper decimal places and unit
   */
  formatAmount(value: number, unit: string): string {
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
   * Check if two ingredients can be merged (same item)
   */
  canMerge(ingredient1: Ingredient, ingredient2: Ingredient): boolean {
    return ingredient1.item.uuid === ingredient2.item.uuid;
  }

  /**
   * Get a summary of merged ingredients for display
   */
  getMergeSummary(existingIngredients: Ingredient[], newIngredients: Ingredient[]): {
    merged: number;
    added: number;
    total: number;
  } {
    const existingMap = new Map<string, Ingredient>();
    existingIngredients.forEach(ingredient => {
      existingMap.set(ingredient.item.uuid, ingredient);
    });

    let merged = 0;
    let added = 0;

    newIngredients.forEach(ingredient => {
      if (existingMap.has(ingredient.item.uuid)) {
        merged++;
      } else {
        added++;
      }
    });

    return {
      merged,
      added,
      total: existingIngredients.length + added
    };
  }
}
