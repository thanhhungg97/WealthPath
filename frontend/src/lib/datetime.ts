/**
 * Standardized date and time handling utilities.
 * All dates are handled in UTC timezone using ISO 8601 format.
 */

// Standard date formats
export const DATE_FORMAT = 'yyyy-MM-dd'; // YYYY-MM-DD
export const DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss'Z'"; // ISO 8601 / RFC3339
export const DISPLAY_DATE_FORMAT = 'MMM d, yyyy'; // Jan 2, 2024
export const DISPLAY_DATETIME_FORMAT = 'MMM d, yyyy h:mm a'; // Jan 2, 2024 3:04 PM

/**
 * Parse a date string from the API (ISO 8601 or YYYY-MM-DD).
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Format a date for API requests (YYYY-MM-DD).
 */
export function toAPIDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

/**
 * Format a datetime for API requests (ISO 8601).
 */
export function toAPIDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toISOString();
}

/**
 * Format a date for display (localized).
 */
export function formatDate(
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  },
  locale = 'en-US'
): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * Format a datetime for display (localized).
 */
export function formatDateTime(
  date: Date | string | null | undefined,
  locale = 'en-US'
): string {
  return formatDate(date, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }, locale);
}

/**
 * Format a date in short format (e.g., "Jan 2").
 */
export function formatDateShort(
  date: Date | string | null | undefined,
  locale = 'en-US'
): string {
  return formatDate(date, { month: 'short', day: 'numeric' }, locale);
}

/**
 * Format a relative time (e.g., "2 days ago", "in 3 hours").
 */
export function formatRelativeTime(
  date: Date | string | null | undefined,
  locale = 'en-US'
): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);
  const diffMonths = Math.round(diffDays / 30);
  const diffYears = Math.round(diffDays / 365);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffSecs) < 60) return rtf.format(diffSecs, 'second');
  if (Math.abs(diffMins) < 60) return rtf.format(diffMins, 'minute');
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, 'day');
  if (Math.abs(diffMonths) < 12) return rtf.format(diffMonths, 'month');
  return rtf.format(diffYears, 'year');
}

/**
 * Get start of day (00:00:00.000).
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day (23:59:59.999).
 */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get start of month.
 */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get end of month.
 */
export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Get start of year.
 */
export function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

/**
 * Get end of year.
 */
export function endOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

/**
 * Add days to a date.
 */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Add months to a date.
 */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Check if two dates are the same day.
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a date is today.
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Get today's date at midnight.
 */
export function today(): Date {
  return startOfDay(new Date());
}

/**
 * Get month name.
 */
export function getMonthName(
  date: Date,
  format: 'long' | 'short' = 'long',
  locale = 'en-US'
): string {
  return new Intl.DateTimeFormat(locale, { month: format }).format(date);
}


