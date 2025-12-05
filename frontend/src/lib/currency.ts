/**
 * Standardized currency handling utilities.
 * All monetary amounts are represented as numbers or strings.
 */

/**
 * Supported currency codes (ISO 4217).
 */
export const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'VND', 'CAD', 'AUD', 'CHF', 'SGD',
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number];

/**
 * Default currency when none is specified.
 */
export const DEFAULT_CURRENCY: CurrencyCode = 'USD';

/**
 * Currency metadata.
 */
export interface CurrencyInfo {
  code: CurrencyCode;
  name: string;
  symbol: string;
  decimalPlaces: number;
  locale: string; // Preferred locale for formatting
}

/**
 * Currency information map.
 */
export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, locale: 'en-US' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, locale: 'de-DE' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2, locale: 'en-GB' },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0, locale: 'ja-JP' },
  CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2, locale: 'zh-CN' },
  VND: { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', decimalPlaces: 0, locale: 'vi-VN' },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: '$', decimalPlaces: 2, locale: 'en-CA' },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: '$', decimalPlaces: 2, locale: 'en-AU' },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, locale: 'de-CH' },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: '$', decimalPlaces: 2, locale: 'en-SG' },
};

/**
 * Check if a currency code is valid.
 */
export function isValidCurrency(code: string): code is CurrencyCode {
  return SUPPORTED_CURRENCIES.includes(code as CurrencyCode);
}

/**
 * Get currency info by code.
 */
export function getCurrencyInfo(code: string): CurrencyInfo {
  const currency = CURRENCIES[code as CurrencyCode];
  return currency || CURRENCIES[DEFAULT_CURRENCY];
}

/**
 * Format amount as currency.
 *
 * @param amount - The numeric amount
 * @param currency - Currency code (default: USD)
 * @param options - Additional formatting options
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = DEFAULT_CURRENCY,
  options: {
    locale?: string;
    showSymbol?: boolean;
    compact?: boolean;
  } = {}
): string {
  if (amount === null || amount === undefined) return '';

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '';

  const currencyInfo = getCurrencyInfo(currency);
  const locale = options.locale || currencyInfo.locale;

  const formatOptions: Intl.NumberFormatOptions = {
    style: options.showSymbol === false ? 'decimal' : 'currency',
    currency: currencyInfo.code,
    minimumFractionDigits: currencyInfo.decimalPlaces,
    maximumFractionDigits: currencyInfo.decimalPlaces,
  };

  if (options.compact) {
    formatOptions.notation = 'compact';
    formatOptions.compactDisplay = 'short';
  }

  return new Intl.NumberFormat(locale, formatOptions).format(num);
}

/**
 * Format amount as compact currency (e.g., "$1.2K", "$1.5M").
 */
export function formatCurrencyCompact(
  amount: number | string | null | undefined,
  currency: string = DEFAULT_CURRENCY
): string {
  return formatCurrency(amount, currency, { compact: true });
}

/**
 * Format amount as plain number (no currency symbol).
 */
export function formatAmount(
  amount: number | string | null | undefined,
  currency: string = DEFAULT_CURRENCY
): string {
  return formatCurrency(amount, currency, { showSymbol: false });
}

/**
 * Parse a currency string to number.
 */
export function parseCurrency(value: string): number | null {
  if (!value) return null;

  // Remove currency symbols and thousand separators
  const cleaned = value
    .replace(/[^0-9.,\-]/g, '')
    .replace(/,/g, '');

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Round amount to currency's decimal places.
 */
export function roundCurrency(amount: number, currency: string = DEFAULT_CURRENCY): number {
  const info = getCurrencyInfo(currency);
  const factor = Math.pow(10, info.decimalPlaces);
  return Math.round(amount * factor) / factor;
}

/**
 * Format amount with sign (positive/negative indicator).
 */
export function formatCurrencyWithSign(
  amount: number | string | null | undefined,
  currency: string = DEFAULT_CURRENCY
): string {
  if (amount === null || amount === undefined) return '';

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '';

  const formatted = formatCurrency(Math.abs(num), currency);
  if (num > 0) return `+${formatted}`;
  if (num < 0) return `-${formatted}`;
  return formatted;
}

/**
 * Get currency symbol.
 */
export function getCurrencySymbol(currency: string = DEFAULT_CURRENCY): string {
  return getCurrencyInfo(currency).symbol;
}

/**
 * Format percentage.
 */
export function formatPercent(
  value: number | null | undefined,
  decimals = 1,
  locale = 'en-US'
): string {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Format large numbers (e.g., "1.2K", "3.5M").
 */
export function formatNumber(
  value: number | string | null | undefined,
  options: {
    locale?: string;
    compact?: boolean;
    decimals?: number;
  } = {}
): string {
  if (value === null || value === undefined) return '';

  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';

  const locale = options.locale || 'en-US';
  const formatOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: options.decimals ?? 0,
    maximumFractionDigits: options.decimals ?? 2,
  };

  if (options.compact) {
    formatOptions.notation = 'compact';
    formatOptions.compactDisplay = 'short';
  }

  return new Intl.NumberFormat(locale, formatOptions).format(num);
}


