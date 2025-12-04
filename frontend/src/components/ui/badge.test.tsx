import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge, badgeVariants } from './badge';

describe('Badge', () => {
  it('renders children correctly', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    render(<Badge data-testid="badge">Default</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-primary');
    expect(badge).toHaveClass('text-primary-foreground');
  });

  it('renders with secondary variant', () => {
    render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-secondary');
    expect(badge).toHaveClass('text-secondary-foreground');
  });

  it('renders with destructive variant', () => {
    render(<Badge variant="destructive" data-testid="badge">Error</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-destructive');
    expect(badge).toHaveClass('text-destructive-foreground');
  });

  it('renders with outline variant', () => {
    render(<Badge variant="outline" data-testid="badge">Outline</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('text-foreground');
  });

  it('applies base styling classes', () => {
    render(<Badge data-testid="badge">Styled</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('inline-flex');
    expect(badge).toHaveClass('items-center');
    expect(badge).toHaveClass('rounded-full');
    expect(badge).toHaveClass('border');
    expect(badge).toHaveClass('px-2.5');
    expect(badge).toHaveClass('py-0.5');
    expect(badge).toHaveClass('text-xs');
    expect(badge).toHaveClass('font-semibold');
  });

  it('accepts custom className', () => {
    render(<Badge className="custom-class" data-testid="badge">Custom</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('custom-class');
  });

  it('renders as div element by default', () => {
    render(<Badge>Badge Text</Badge>);
    const badge = screen.getByText('Badge Text');
    expect(badge.tagName).toBe('DIV');
  });

  it('handles long text', () => {
    render(<Badge>This is a very long badge text</Badge>);
    expect(screen.getByText('This is a very long badge text')).toBeInTheDocument();
  });

  it('can contain icons', () => {
    render(
      <Badge>
        <span data-testid="icon">🔥</span>
        Hot
      </Badge>
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Hot')).toBeInTheDocument();
  });
});

describe('badgeVariants', () => {
  it('returns default variant classes', () => {
    const classes = badgeVariants();
    expect(classes).toContain('bg-primary');
    expect(classes).toContain('text-primary-foreground');
  });

  it('returns correct variant classes', () => {
    const secondaryClasses = badgeVariants({ variant: 'secondary' });
    expect(secondaryClasses).toContain('bg-secondary');

    const destructiveClasses = badgeVariants({ variant: 'destructive' });
    expect(destructiveClasses).toContain('bg-destructive');

    const outlineClasses = badgeVariants({ variant: 'outline' });
    expect(outlineClasses).toContain('text-foreground');
  });

  it('includes base classes for all variants', () => {
    const variants = ['default', 'secondary', 'destructive', 'outline'] as const;

    variants.forEach((variant) => {
      const classes = badgeVariants({ variant });
      expect(classes).toContain('inline-flex');
      expect(classes).toContain('rounded-full');
      expect(classes).toContain('font-semibold');
    });
  });
});

