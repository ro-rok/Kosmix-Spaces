/**
 * Price display utilities for offerings
 * Implements the hierarchy: startingPrice > budgetBand > "On enquiry"
 */

export interface PriceDisplayProps {
  startingPrice?: number;
  unit?: 'month' | 'hr' | 'NA';
  budgetBand?: string;
}

/**
 * Format price display according to the hierarchy:
 * 1. If startingPrice exists and unit is not 'NA': "Starting ₹X / {unit}"
 * 2. Else if budgetBand exists: "Budget {band}"
 * 3. Else: "On enquiry"
 */
export function formatPrice({ startingPrice, unit, budgetBand }: PriceDisplayProps): string {
  // Priority 1: Starting price with valid unit
  if (startingPrice && unit && unit !== 'NA') {
    const formattedPrice = startingPrice.toLocaleString('en-IN');
    return `Starting ₹${formattedPrice} / ${unit}`;
  }
  
  // Priority 2: Budget band
  if (budgetBand) {
    return `Budget ${budgetBand}`;
  }
  
  // Priority 3: On enquiry (fallback)
  return 'On enquiry';
}

/**
 * Format price for display in cards and listings
 * Alias for formatPrice for consistency
 */
export function formatCardPrice(offering: PriceDisplayProps): string {
  return formatPrice(offering);
}

/**
 * Get price sorting value for comparison
 * Returns numeric value for sorting purposes
 */
export function getPriceSortValue({ startingPrice, budgetBand }: PriceDisplayProps): number {
  if (startingPrice) {
    return startingPrice;
  }
  
  // Convert budget band to numeric value for sorting
  if (budgetBand) {
    const bandMap: Record<string, number> = {
      '₹': 5000,
      '₹₹': 25000,
      '₹₹₹': 75000,
      '5k-10k': 7500,
      '10k-20k': 15000,
      '20k-40k': 30000,
      '40k-80k': 60000,
      '80k+': 100000,
    };
    
    return bandMap[budgetBand] || 0;
  }
  
  return 0; // "On enquiry" items go to end
}

/**
 * Check if offering has pricing information
 * Returns true if either startingPrice or budgetBand is available
 */
export function hasPricing({ startingPrice, budgetBand }: PriceDisplayProps): boolean {
  return !!(startingPrice || budgetBand);
}

/**
 * Validate price data consistency
 * Ensures price data follows business rules
 */
export function validatePriceData({ startingPrice, unit, budgetBand }: PriceDisplayProps): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // If startingPrice is provided, unit should also be provided
  if (startingPrice && !unit) {
    errors.push('Unit is required when starting price is provided');
  }
  
  // Starting price should be positive
  if (startingPrice && startingPrice <= 0) {
    errors.push('Starting price must be positive');
  }
  
  // Unit should be valid enum value
  if (unit && !['month', 'hr', 'NA'].includes(unit)) {
    errors.push('Unit must be one of: month, hr, NA');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}