import React from 'react';
import { render, screen } from '@testing-library/react';
import { Label } from './label';

describe('Label', () => {
  it('renders children correctly', () => {
    render(<Label>Email</Label>);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    render(<Label data-testid="label">Email</Label>);
    const label = screen.getByTestId('label');
    expect(label).toHaveClass('text-sm');
    expect(label).toHaveClass('font-medium');
    expect(label).toHaveClass('leading-none');
  });

  it('accepts custom className', () => {
    render(<Label className="custom-class" data-testid="label">Email</Label>);
    expect(screen.getByTestId('label')).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLLabelElement>();
    render(<Label ref={ref}>Email</Label>);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it('associates with form input via htmlFor', () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <input id="email" type="email" />
      </>
    );

    const label = screen.getByText('Email');
    expect(label).toHaveAttribute('for', 'email');
  });

  it('renders as label element', () => {
    render(<Label>Email</Label>);
    const label = screen.getByText('Email');
    expect(label.tagName).toBe('LABEL');
  });

  it('handles long text', () => {
    render(<Label>This is a very long label text for a form field</Label>);
    expect(screen.getByText('This is a very long label text for a form field')).toBeInTheDocument();
  });

  it('can contain elements', () => {
    render(
      <Label>
        <span data-testid="required">*</span>
        Email
      </Label>
    );
    expect(screen.getByTestId('required')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });
});

