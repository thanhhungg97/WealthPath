import {
  addDays,
  capitalize,
  cn,
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatPercent,
  formatRelativeTime,
  getCurrencyInfo,
  getInitials,
  isSameDay,
  isToday,
  isValidCurrency,
  parseDate,
  toAPIDate,
  today,
  truncate,
} from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('resolves Tailwind conflicts', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });
});

describe('getInitials', () => {
  it('returns initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('handles single name', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('limits to 2 characters', () => {
    expect(getInitials('John Michael Doe')).toBe('JM');
  });

  it('handles empty string', () => {
    expect(getInitials('')).toBe('');
  });
});

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('handles all caps', () => {
    expect(capitalize('HELLO')).toBe('Hello');
  });

  it('handles empty string', () => {
    expect(capitalize('')).toBe('');
  });
});

describe('truncate', () => {
  it('truncates long strings', () => {
    expect(truncate('Hello World', 8)).toBe('Hello...');
  });

  it('returns short strings unchanged', () => {
    expect(truncate('Hi', 10)).toBe('Hi');
  });

  it('uses custom suffix', () => {
    expect(truncate('Hello World', 8, '…')).toBe('Hello W…');
  });
});

describe('formatCurrency', () => {
  it('formats USD', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('formats EUR', () => {
    const result = formatCurrency(1234.56, 'EUR');
    expect(result).toContain('1.234,56');
  });

  it('formats VND (no decimals)', () => {
    const result = formatCurrency(50000, 'VND');
    expect(result).toContain('50.000');
  });

  it('handles string input', () => {
    expect(formatCurrency('1234.56')).toBe('$1,234.56');
  });

  it('handles null/undefined', () => {
    expect(formatCurrency(null)).toBe('');
    expect(formatCurrency(undefined)).toBe('');
  });
});

describe('formatCurrencyCompact', () => {
  it('formats large numbers compactly', () => {
    const result = formatCurrencyCompact(1500000, 'USD');
    expect(result).toMatch(/\$1\.5(0)?M/);
  });

  it('formats thousands', () => {
    const result = formatCurrencyCompact(1500, 'USD');
    expect(result).toMatch(/\$1\.5(0)?K/);
  });
});

describe('formatPercent', () => {
  it('formats percentage', () => {
    expect(formatPercent(75)).toBe('75.0%');
  });

  it('handles decimals', () => {
    expect(formatPercent(33.33, 2)).toBe('33.33%');
  });

  it('handles null/undefined', () => {
    expect(formatPercent(null)).toBe('');
    expect(formatPercent(undefined)).toBe('');
  });
});

describe('Currency utilities', () => {
  it('validates currency codes', () => {
    expect(isValidCurrency('USD')).toBe(true);
    expect(isValidCurrency('EUR')).toBe(true);
    expect(isValidCurrency('INVALID')).toBe(false);
  });

  it('gets currency info', () => {
    const usd = getCurrencyInfo('USD');
    expect(usd.symbol).toBe('$');
    expect(usd.decimalPlaces).toBe(2);

    const jpy = getCurrencyInfo('JPY');
    expect(jpy.symbol).toBe('¥');
    expect(jpy.decimalPlaces).toBe(0);
  });
});

describe('Date utilities', () => {
  describe('formatDate', () => {
    it('formats date objects', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('formats date strings', () => {
      const result = formatDate('2024-01-15');
      expect(result).toContain('Jan');
    });

    it('handles null/undefined', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });
  });

  describe('toAPIDate', () => {
    it('formats date for API', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      expect(toAPIDate(date)).toBe('2024-01-15');
    });

    it('handles string input', () => {
      expect(toAPIDate('2024-01-15T12:00:00Z')).toBe('2024-01-15');
    });

    it('handles null/undefined', () => {
      expect(toAPIDate(null)).toBe('');
      expect(toAPIDate(undefined)).toBe('');
    });
  });

  describe('parseDate', () => {
    it('parses ISO date strings', () => {
      const date = parseDate('2024-01-15');
      expect(date).toBeInstanceOf(Date);
      expect(date?.getFullYear()).toBe(2024);
    });

    it('parses ISO datetime strings', () => {
      const date = parseDate('2024-01-15T12:00:00Z');
      expect(date).toBeInstanceOf(Date);
    });

    it('returns null for invalid input', () => {
      expect(parseDate('')).toBe(null);
      expect(parseDate(null)).toBe(null);
    });
  });

  describe('Date manipulation', () => {
    it('adds days correctly', () => {
      const date = new Date('2024-01-15');
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(20);
    });

    it('checks same day', () => {
      const date1 = new Date('2024-01-15T10:00:00');
      const date2 = new Date('2024-01-15T20:00:00');
      const date3 = new Date('2024-01-16T10:00:00');

      expect(isSameDay(date1, date2)).toBe(true);
      expect(isSameDay(date1, date3)).toBe(false);
    });

    it('checks if today', () => {
      const todayDate = today();
      expect(isToday(todayDate)).toBe(true);
      expect(isToday(new Date('2020-01-01'))).toBe(false);
    });
  });

  describe('formatRelativeTime', () => {
    it('formats past dates', () => {
      const yesterday = addDays(new Date(), -1);
      const result = formatRelativeTime(yesterday);
      expect(result).toContain('yesterday');
    });

    it('handles null/undefined', () => {
      expect(formatRelativeTime(null)).toBe('');
      expect(formatRelativeTime(undefined)).toBe('');
    });
  });
});
