// Utility functions for formatting chart values with proper scaling

export interface ChartFormattingOptions {
  scale?: 'auto' | 'units' | 'thousands' | 'millions';
  currency?: boolean;
  decimals?: number;
}

/**
 * Automatically determine the best scale for a set of values
 */
export function determineScale(values: number[]): 'units' | 'thousands' | 'millions' {
  const maxValue = Math.max(...values.map(v => Math.abs(v)));

  if (maxValue >= 1000000) {
    return 'millions';
  } else if (maxValue >= 1000) {
    return 'thousands';
  } else {
    return 'units';
  }
}

/**
 * Format a value with the specified scale
 */
export function formatValueWithScale(
  value: number,
  scale: 'units' | 'thousands' | 'millions',
  options: ChartFormattingOptions = {}
): string {
  const { currency = true, decimals = 1 } = options;

  let scaledValue = value;
  let suffix = '';

  switch (scale) {
    case 'thousands':
      scaledValue = value / 1000;
      suffix = 'K';
      break;
    case 'millions':
      scaledValue = value / 1000000;
      suffix = 'M';
      break;
    default:
      scaledValue = value;
      suffix = '';
  }

  // Use appropriate decimals based on scale
  const finalDecimals = scale === 'units' ? 0 : Math.max(1, decimals);

  // Format the number with proper locale
  const formatter = new Intl.NumberFormat('es-AR', {
    style: currency ? 'currency' : 'decimal',
    currency: currency ? 'ARS' : undefined,
    minimumFractionDigits: finalDecimals,
    maximumFractionDigits: finalDecimals,
  });

  let formattedValue = formatter.format(Math.abs(scaledValue));

  // Add negative sign if needed (after currency symbol)
  if (value < 0) {
    if (currency) {
      formattedValue = formattedValue.replace('$', '-$');
    } else {
      formattedValue = '-' + formattedValue;
    }
  }

  return formattedValue + suffix;
}

/**
 * Smart formatter that auto-determines scale and formats appropriately
 */
export function smartFormatValue(
  value: number,
  allValues: number[] = [],
  options: ChartFormattingOptions = {}
): string {
  const { scale = 'auto' } = options;

  const effectiveScale = scale === 'auto'
    ? determineScale(allValues.length > 0 ? allValues : [value])
    : scale;

  return formatValueWithScale(value, effectiveScale, options);
}

/**
 * Create a chart tick formatter function
 */
export function createChartTickFormatter(
  allValues: number[],
  options: ChartFormattingOptions = {}
) {
  const { scale = 'auto', currency = false } = options;

  return (value: any) => {
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue)) return '';

    // Determine scale based on the current value if allValues is empty
    const effectiveValues = allValues.length > 0 ? allValues : [numValue];
    const effectiveScale = scale === 'auto' ? determineScale(effectiveValues) : scale;

    return formatValueWithScale(numValue, effectiveScale, {
      ...options,
      currency: currency, // Use the provided currency option
      decimals: effectiveScale === 'units' ? 0 : 1
    });
  };
}

/**
 * Create a tooltip formatter for charts
 */
export function createTooltipFormatter(
  allValues: number[],
  options: ChartFormattingOptions = {}
) {
  const { scale = 'auto' } = options;
  const effectiveScale = scale === 'auto' ? determineScale(allValues) : scale;

  return (value: any) => {
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue)) return '';

    return formatValueWithScale(numValue, effectiveScale, options);
  };
}

/**
 * Get scale label for display
 */
export function getScaleLabel(scale: 'units' | 'thousands' | 'millions'): string {
  switch (scale) {
    case 'thousands':
      return 'en miles (K)';
    case 'millions':
      return 'en millones (M)';
    default:
      return 'en unidades';
  }
}
