import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './input';

describe('Input', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    await user.type(input, 'Hello World');
    
    expect(input).toHaveValue('Hello World');
  });

  it('handles onChange events', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} placeholder="Test" />);
    
    const input = screen.getByPlaceholderText('Test');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled placeholder="Disabled" />);
    expect(screen.getByPlaceholderText('Disabled')).toBeDisabled();
  });

  it('accepts different types', () => {
    const { rerender } = render(<Input type="text" placeholder="Text" />);
    expect(screen.getByPlaceholderText('Text')).toHaveAttribute('type', 'text');

    rerender(<Input type="password" placeholder="Password" />);
    expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password');

    rerender(<Input type="email" placeholder="Email" />);
    expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email');

    rerender(<Input type="number" placeholder="Number" />);
    expect(screen.getByPlaceholderText('Number')).toHaveAttribute('type', 'number');
  });

  it('applies default classes', () => {
    render(<Input data-testid="input" />);
    const input = screen.getByTestId('input');
    
    expect(input).toHaveClass('flex');
    expect(input).toHaveClass('h-10');
    expect(input).toHaveClass('w-full');
    expect(input).toHaveClass('rounded-lg');
    expect(input).toHaveClass('border');
  });

  it('accepts custom className', () => {
    render(<Input className="custom-class" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('handles required attribute', () => {
    render(<Input required placeholder="Required" />);
    expect(screen.getByPlaceholderText('Required')).toBeRequired();
  });

  it('handles value prop', () => {
    render(<Input value="controlled value" onChange={() => {}} placeholder="Test" />);
    expect(screen.getByPlaceholderText('Test')).toHaveValue('controlled value');
  });

  it('handles defaultValue prop', () => {
    render(<Input defaultValue="default value" placeholder="Test" />);
    expect(screen.getByPlaceholderText('Test')).toHaveValue('default value');
  });

  it('handles maxLength attribute', () => {
    render(<Input maxLength={10} placeholder="Max length" />);
    expect(screen.getByPlaceholderText('Max length')).toHaveAttribute('maxLength', '10');
  });

  it('handles min and max for number type', () => {
    render(<Input type="number" min={0} max={100} placeholder="Number" />);
    const input = screen.getByPlaceholderText('Number');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
  });

  it('handles pattern attribute', () => {
    render(<Input pattern="[0-9]*" placeholder="Pattern" />);
    expect(screen.getByPlaceholderText('Pattern')).toHaveAttribute('pattern', '[0-9]*');
  });

  it('handles autoComplete attribute', () => {
    render(<Input autoComplete="email" placeholder="Email" />);
    expect(screen.getByPlaceholderText('Email')).toHaveAttribute('autocomplete', 'email');
  });

  it('handles aria attributes', () => {
    render(
      <Input
        aria-label="Test input"
        aria-describedby="description"
        placeholder="Accessible"
      />
    );
    const input = screen.getByPlaceholderText('Accessible');
    expect(input).toHaveAttribute('aria-label', 'Test input');
    expect(input).toHaveAttribute('aria-describedby', 'description');
  });

  it('handles focus and blur events', () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    
    render(
      <Input
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Focus test"
      />
    );
    
    const input = screen.getByPlaceholderText('Focus test');
    
    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalled();
    
    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalled();
  });

  it('has correct file input styling', () => {
    render(<Input type="file" data-testid="file-input" />);
    const input = screen.getByTestId('file-input');
    expect(input).toHaveClass('file:border-0');
    expect(input).toHaveClass('file:bg-transparent');
  });
});

