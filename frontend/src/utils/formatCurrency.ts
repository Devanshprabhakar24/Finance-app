import { CURRENCY } from './constants';

/**
 * Format number as Indian Rupee currency
 * Uses Intl.NumberFormat for proper localization
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(CURRENCY.LOCALE, {
    style: 'currency',
    currency: CURRENCY.CODE,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number with Indian numbering system (lakhs, crores)
 */
export function formatIndianNumber(num: number): string {
  return new Intl.NumberFormat(CURRENCY.LOCALE).format(num);
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]+/g, '')) || 0;
}

/**
 * Format compact currency (1.2K, 1.5L, 2.3Cr)
 */
export function formatCompactCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absAmount >= 10000000) {
    // Crores
    return `${sign}${CURRENCY.SYMBOL}${(absAmount / 10000000).toFixed(1)}Cr`;
  } else if (absAmount >= 100000) {
    // Lakhs
    return `${sign}${CURRENCY.SYMBOL}${(absAmount / 100000).toFixed(1)}L`;
  } else if (absAmount >= 1000) {
    // Thousands
    return `${sign}${CURRENCY.SYMBOL}${(absAmount / 1000).toFixed(1)}K`;
  }

  return `${sign}${CURRENCY.SYMBOL}${absAmount.toFixed(0)}`;
}
