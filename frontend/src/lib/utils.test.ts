import { cn, formatCurrency, formatDate, formatPercent, getInitials } from './utils';

describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', true && 'bar', false && 'baz')).toBe('foo bar');
  });

  it('handles undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('merges tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('handles arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('handles objects', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });

  it('handles empty input', () => {
    expect(cn()).toBe('');
  });
});

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    const result = formatCurrency(1234.56, 'USD');
    expect(result).toContain('1,234.56');
    expect(result).toContain('$');
  });

  it('formats EUR correctly', () => {
    const result = formatCurrency(1234.56, 'EUR');
    expect(result).toContain('1,234.56');
    expect(result).toContain('€');
  });

  it('handles string amounts', () => {
    const result = formatCurrency('1234.56', 'USD');
    expect(result).toContain('1,234.56');
  });

  it('handles zero', () => {
    const result = formatCurrency(0, 'USD');
    expect(result).toContain('0.00');
  });

  it('handles negative numbers', () => {
    const result = formatCurrency(-1234.56, 'USD');
    expect(result).toContain('1,234.56');
    expect(result).toMatch(/-/);
  });

  it('defaults to USD when no currency specified', () => {
    const result = formatCurrency(100);
    expect(result).toContain('$');
  });

  it('formats large numbers', () => {
    const result = formatCurrency(1000000, 'USD');
    expect(result).toContain('1,000,000');
  });

  it('handles VND (no decimal places)', () => {
    const result = formatCurrency(1234567, 'VND');
    expect(result).toContain('1,234,567');
  });

  it('handles JPY (no decimal places)', () => {
    const result = formatCurrency(1234, 'JPY');
    expect(result).toContain('1,234');
  });
});

describe('formatDate', () => {
  it('formats date string correctly', () => {
    const result = formatDate('2024-06-15');
    expect(result).toContain('Jun');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('formats Date object correctly', () => {
    const date = new Date(2024, 5, 15); // June 15, 2024
    const result = formatDate(date);
    expect(result).toContain('Jun');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('handles ISO date string', () => {
    const result = formatDate('2024-06-15T10:30:00Z');
    expect(result).toContain('Jun');
    expect(result).toContain('2024');
  });

  it('handles different months', () => {
    expect(formatDate('2024-01-01')).toContain('Jan');
    expect(formatDate('2024-12-25')).toContain('Dec');
  });
});

describe('formatPercent', () => {
  it('formats percentage with one decimal place', () => {
    expect(formatPercent(50)).toBe('50.0%');
  });

  it('formats zero correctly', () => {
    expect(formatPercent(0)).toBe('0.0%');
  });

  it('formats 100% correctly', () => {
    expect(formatPercent(100)).toBe('100.0%');
  });

  it('handles decimal values', () => {
    expect(formatPercent(33.333)).toBe('33.3%');
  });

  it('handles values over 100%', () => {
    expect(formatPercent(150.5)).toBe('150.5%');
  });

  it('handles negative values', () => {
    expect(formatPercent(-10.5)).toBe('-10.5%');
  });
});

describe('getInitials', () => {
  it('gets initials from two-word name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('gets initials from single word name', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('limits to two characters', () => {
    expect(getInitials('John Michael Doe')).toBe('JM');
  });

  it('handles lowercase names', () => {
    expect(getInitials('john doe')).toBe('JD');
  });

  it('handles names with extra spaces', () => {
    expect(getInitials('John  Doe')).toBe('JD');
  });

  it('handles single character name', () => {
    expect(getInitials('J')).toBe('J');
  });

  it('handles empty string', () => {
    expect(getInitials('')).toBe('');
  });

  it('handles names with multiple spaces', () => {
    const result = getInitials('John   Michael   Doe');
    expect(result.length).toBeLessThanOrEqual(2);
  });
});

