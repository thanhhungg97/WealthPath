import { useAuthStore } from '@/store/auth';
import {
  formatCurrency as baseFormatCurrency,
  formatCurrencyCompact as baseFormatCurrencyCompact,
  formatAmount as baseFormatAmount,
  formatCurrencyWithSign as baseFormatCurrencyWithSign,
  getCurrencySymbol as baseGetCurrencySymbol,
  getCurrencyInfo,
  DEFAULT_CURRENCY,
  type CurrencyCode,
} from '@/lib/currency';

/**
 * Hook that returns currency formatting functions using the user's preferred currency.
 * Falls back to DEFAULT_CURRENCY (USD) if no user is logged in.
 */
export function useCurrency() {
  const user = useAuthStore((state) => state.user);
  const userCurrency = (user?.currency as CurrencyCode) || DEFAULT_CURRENCY;

  return {
    /** The user's currency code */
    currency: userCurrency,

    /** Currency info (name, symbol, decimal places, etc.) */
    currencyInfo: getCurrencyInfo(userCurrency),

    /** Format amount with user's currency */
    formatCurrency: (
      amount: number | string | null | undefined,
      options?: { locale?: string; showSymbol?: boolean; compact?: boolean }
    ) => baseFormatCurrency(amount, userCurrency, options),

    /** Format amount as compact (e.g., "1.2K", "3.5M") */
    formatCurrencyCompact: (amount: number | string | null | undefined) =>
      baseFormatCurrencyCompact(amount, userCurrency),

    /** Format amount without currency symbol */
    formatAmount: (amount: number | string | null | undefined) =>
      baseFormatAmount(amount, userCurrency),

    /** Format amount with +/- sign */
    formatCurrencyWithSign: (amount: number | string | null | undefined) =>
      baseFormatCurrencyWithSign(amount, userCurrency),

    /** Get currency symbol */
    getCurrencySymbol: () => baseGetCurrencySymbol(userCurrency),
  };
}

/**
 * Get the user's currency from the store (non-reactive, for use outside components).
 */
export function getUserCurrency(): CurrencyCode {
  const user = useAuthStore.getState().user;
  return (user?.currency as CurrencyCode) || DEFAULT_CURRENCY;
}

