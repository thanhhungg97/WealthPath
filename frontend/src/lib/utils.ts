import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Re-export date utilities
export {
  parseDate,
  toAPIDate,
  toAPIDateTime,
  formatDate,
  formatDateTime,
  formatDateShort,
  formatRelativeTime,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addDays,
  addMonths,
  isSameDay,
  isToday,
  today,
  getMonthName,
} from './datetime';

// Re-export currency utilities
export {
  SUPPORTED_CURRENCIES,
  DEFAULT_CURRENCY,
  CURRENCIES,
  isValidCurrency,
  getCurrencyInfo,
  formatCurrency,
  formatCurrencyCompact,
  formatAmount,
  parseCurrency,
  roundCurrency,
  formatCurrencyWithSign,
  getCurrencySymbol,
  formatPercent,
  formatNumber,
  type CurrencyCode,
  type CurrencyInfo,
} from './currency';

/**
 * Merge Tailwind CSS classes with conflict resolution.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get initials from a name (max 2 characters).
 */
export function getInitials(name: string): string {
  if (!name) return '';
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Sleep for a specified number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce a function.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle a function.
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Capitalize first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Truncate a string to a maximum length.
 */
export function truncate(str: string, maxLength: number, suffix = '...'): string {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}
