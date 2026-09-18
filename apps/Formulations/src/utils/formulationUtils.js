/**
 * Generate a unique ID
 */
export const generateId = () => {
  return `form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Helper to convert quantity units safely
 */
export const convertToSecondaryUnit = (qty, fromUnit, toUnit) => {
  const from = String(fromUnit || '').toUpperCase();
  const to = String(toUnit || '').toUpperCase();
  if (from === to) return qty;
  
  // KG <-> GM
  if (from === 'KG' && to === 'GM') return qty * 1000;
  if (from === 'GM' && to === 'KG') return qty / 1000;
  
  // L <-> ML
  if (from === 'L' && to === 'ML') return qty * 1000;
  if (from === 'ML' && to === 'L') return qty / 1000;
  
  // Cross compatibility fallback
  if ((from === 'L' || from === 'KG') && (to === 'ML' || to === 'GM')) return qty * 1000;
  if ((from === 'ML' || from === 'GM') && (to === 'L' || to === 'KG')) return qty / 1000;

  return qty;
};

/**
 * Calculate total percentage from ingredients
 * For quantity-based ingredients, calculate % as (quantity / baseVolume) × 100
 */
export const calculateTotalPercentage = (ingredients = [], baseVolume = 1, baseUnit = 'L') => {
  return (ingredients || []).reduce((sum, ing) => {
    if (!ing) return sum;
    const percentage = parseFloat(ing.percentage) || 0;
    const quantity = parseFloat(ing.quantity) || 0;
    
    // If percentage is used, add it directly
    if (percentage > 0) {
      return sum + percentage;
    }
    // If quantity is used, calculate percentage after matching units
    if (quantity > 0 && baseVolume > 0) {
      const normalizedQty = convertToSecondaryUnit(quantity, ing.unit || baseUnit, baseUnit);
      return sum + (normalizedQty / baseVolume) * 100;
    }
    return sum;
  }, 0);
};

/**
 * Calculate total cost for a formulation
 * Cost is based on actual quantities used
 */
export const calculateTotalCost = (ingredients = [], baseVolume, baseUnit = 'L') => {
  return (ingredients || []).reduce((sum, ing) => {
    if (!ing) return sum;
    const percentage = parseFloat(ing.percentage) || 0;
    const quantity = parseFloat(ing.quantity) || 0;
    const costPerUnit = parseFloat(ing.costPerUnit) || 0;
    
    // Use quantity if filled, otherwise use percentage
    let actualQuantity = quantity;
    if (quantity === 0 && percentage > 0 && baseVolume > 0) {
      actualQuantity = (percentage / 100) * baseVolume;
    }
    
    return sum + (actualQuantity * costPerUnit);
  }, 0);
};

/**
 * Validate formulation based on PERCENTAGE/QUANTITY mode
 */
export const validateFormulation = (formulation) => {
  const errors = [];

  if (!formulation.name || formulation.name.trim() === '') {
    errors.push('Product name is required');
  }

  if (!formulation.baseVolume || formulation.baseVolume <= 0) {
    errors.push('Base volume must be greater than 0');
  }

  if (!formulation.ingredients || formulation.ingredients.length < 2) {
    errors.push('Minimum 2 ingredients required');
  }

  const hasEmptyIngredient = (formulation.ingredients || []).some(
    ing => ing && (!ing.name || ing.name.trim() === '')
  );
  if (hasEmptyIngredient) {
    errors.push('All ingredients must have a name');
  }

  // Check each ingredient has EITHER percentage or quantity
  const incompleteIngredients = (formulation.ingredients || []).filter(ing => {
    if (!ing) return true;
    const percentage = parseFloat(ing.percentage) || 0;
    const quantity = parseFloat(ing.quantity) || 0;
    return percentage === 0 && quantity === 0;
  });
  if (incompleteIngredients.length > 0) {
    errors.push('All ingredients must specify a percentage or quantity');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Calculate batch quantities with proper PERCENTAGE vs QUANTITY scaling
 * Normalizes by actual total percentage if not 100%
 */
export const calculateBatchQuantities = (formulation, batchSize) => {
  const scaleFactor = batchSize / formulation.baseVolume;
  
  // Calculate total percentage for normalization
  const totalPercentage = calculateTotalPercentage(formulation.ingredients, formulation.baseVolume, formulation.baseUnit);
  const percentageNormalizationFactor = totalPercentage > 0 ? (100 / totalPercentage) : 1;
  
  return (formulation.ingredients || []).map(ing => {
    if (!ing) return {};
    const percentage = parseFloat(ing.percentage) || 0;
    const quantity = parseFloat(ing.quantity) || 0;
    
    let batchQuantity;
    let displayPercentage;
    
    if (percentage > 0) {
      // PERCENTAGE mode: normalize by actual total, then scale to batch size
      const normalizedPercentage = percentage * percentageNormalizationFactor;
      batchQuantity = (normalizedPercentage / 100) * batchSize;
      displayPercentage = percentage;
    } else if (quantity > 0) {
      // QUANTITY mode: scale proportionally
      batchQuantity = quantity * scaleFactor;
      const normalizedQty = convertToSecondaryUnit(quantity, ing.unit || formulation.baseUnit, formulation.baseUnit);
      displayPercentage = (normalizedQty / formulation.baseVolume) * 100;
    } else {
      batchQuantity = 0;
      displayPercentage = 0;
    }
    
    return {
      ...ing,
      quantity: batchQuantity,
      displayPercentage
    };
  });
};

/**
 * Format number with proper decimals
 */
export const formatNumber = (num, decimals = 2) => {
  return parseFloat(num).toFixed(decimals);
};

/**
 * Format currency
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format date
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch (e) {
    return String(date);
  }
};

const capitalizeWord = (word) => {
  const lower = String(word || '').toLowerCase();
  const firstLetterIndex = lower.search(/[a-z]/i);
  if (firstLetterIndex === -1) return lower;
  return `${lower.slice(0, firstLetterIndex)}${lower.charAt(firstLetterIndex).toUpperCase()}${lower.slice(firstLetterIndex + 1)}`;
};

export const formatTitleCaseWithPercentRules = (value) => {
  const parts = String(value || '').split(/(\s+)/);
  let uppercaseUntilPlus = false;
  return parts.map(part => {
    if (!part || /^\s+$/.test(part)) return part;
    if (part === '+') { uppercaseUntilPlus = false; return part; }
    const normalized = uppercaseUntilPlus ? part.toUpperCase() : capitalizeWord(part);
    if (/^\d+(?:\.\d+)?%$/.test(part)) uppercaseUntilPlus = true;
    return normalized;
  }).join('');
};
