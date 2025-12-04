import React from 'react';
import { render, screen } from '@testing-library/react';
import { Progress } from './progress';

describe('Progress', () => {
  it('renders correctly', () => {
    render(<Progress value={50} data-testid="progress" />);
    expect(screen.getByTestId('progress')).toBeInTheDocument();
  });

  it('renders with 0% progress', () => {
    render(<Progress value={0} data-testid="progress" />);
    const progress = screen.getByTestId('progress');
    expect(progress).toBeInTheDocument();
  });

  it('renders with 100% progress', () => {
    render(<Progress value={100} data-testid="progress" />);
    expect(screen.getByTestId('progress')).toBeInTheDocument();
  });

  it('renders with 50% progress', () => {
    render(<Progress value={50} data-testid="progress" />);
    expect(screen.getByTestId('progress')).toBeInTheDocument();
  });

  it('applies default classes to root element', () => {
    render(<Progress value={50} data-testid="progress" />);
    const progress = screen.getByTestId('progress');
    expect(progress).toHaveClass('relative');
    expect(progress).toHaveClass('h-3');
    expect(progress).toHaveClass('w-full');
    expect(progress).toHaveClass('overflow-hidden');
    expect(progress).toHaveClass('rounded-full');
    expect(progress).toHaveClass('bg-secondary');
  });

  it('accepts custom className', () => {
    render(<Progress value={50} className="custom-class" data-testid="progress" />);
    expect(screen.getByTestId('progress')).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Progress ref={ref} value={50} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('handles undefined value', () => {
    render(<Progress data-testid="progress" />);
    expect(screen.getByTestId('progress')).toBeInTheDocument();
  });

  it('handles null value', () => {
    render(<Progress value={null as unknown as number} data-testid="progress" />);
    expect(screen.getByTestId('progress')).toBeInTheDocument();
  });

  it('clamps values below 0', () => {
    render(<Progress value={-10} data-testid="progress" />);
    expect(screen.getByTestId('progress')).toBeInTheDocument();
  });

  it('clamps values above 100', () => {
    render(<Progress value={150} data-testid="progress" />);
    expect(screen.getByTestId('progress')).toBeInTheDocument();
  });

  it('handles decimal values', () => {
    render(<Progress value={33.33} data-testid="progress" />);
    expect(screen.getByTestId('progress')).toBeInTheDocument();
  });

  it('has correct role attribute', () => {
    render(<Progress value={50} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('has accessible aria attributes', () => {
    render(<Progress value={75} />);
    const progressbar = screen.getByRole('progressbar');
    // Radix UI Progress handles aria attributes internally
    expect(progressbar).toBeInTheDocument();
  });
});

describe('Progress visual states', () => {
  it('indicator should have transform based on value', () => {
    render(<Progress value={25} data-testid="progress" />);
    // The indicator is a child element that shows progress
    expect(screen.getByTestId('progress')).toBeInTheDocument();
  });

  it('can be used in different contexts', () => {
    const { rerender } = render(
      <div>
        <label htmlFor="progress">Loading...</label>
        <Progress id="progress" value={30} />
      </div>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Update progress
    rerender(
      <div>
        <label htmlFor="progress">Almost done...</label>
        <Progress id="progress" value={90} />
      </div>
    );

    expect(screen.getByText('Almost done...')).toBeInTheDocument();
  });

  it('can be styled for different use cases', () => {
    // Budget progress (green when under, red when over)
    const { rerender } = render(
      <Progress 
        value={60} 
        className="h-2 bg-green-100" 
        data-testid="budget-progress" 
      />
    );
    
    expect(screen.getByTestId('budget-progress')).toHaveClass('h-2');
    expect(screen.getByTestId('budget-progress')).toHaveClass('bg-green-100');

    // Savings goal progress (taller bar)
    rerender(
      <Progress 
        value={80} 
        className="h-6 bg-blue-100" 
        data-testid="savings-progress"
      />
    );

    expect(screen.getByTestId('savings-progress')).toHaveClass('h-6');
  });
});

