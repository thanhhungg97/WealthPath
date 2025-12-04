import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

describe('Tabs', () => {
  it('renders tabs correctly', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Content 1')).toBeInTheDocument();
  });

  it('triggers are interactive', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    const tab1Trigger = screen.getByText('Tab 1');
    const tab2Trigger = screen.getByText('Tab 2');
    
    // Verify triggers are buttons
    expect(tab1Trigger.tagName).toBe('BUTTON');
    expect(tab2Trigger.tagName).toBe('BUTTON');
    
    // Verify they have correct role
    expect(tab1Trigger).toHaveAttribute('role', 'tab');
    expect(tab2Trigger).toHaveAttribute('role', 'tab');
  });
});

describe('TabsList', () => {
  it('applies default classes', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList data-testid="tabs-list">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>
    );

    const tabsList = screen.getByTestId('tabs-list');
    expect(tabsList).toHaveClass('inline-flex');
    expect(tabsList).toHaveClass('h-10');
    expect(tabsList).toHaveClass('items-center');
    expect(tabsList).toHaveClass('rounded-lg');
    expect(tabsList).toHaveClass('bg-muted');
  });

  it('accepts custom className', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList className="custom-class" data-testid="tabs-list">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>
    );

    expect(screen.getByTestId('tabs-list')).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Tabs defaultValue="tab1">
        <TabsList ref={ref}>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('TabsTrigger', () => {
  it('applies default classes', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" data-testid="trigger">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>
    );

    const trigger = screen.getByTestId('trigger');
    expect(trigger).toHaveClass('inline-flex');
    expect(trigger).toHaveClass('items-center');
    expect(trigger).toHaveClass('justify-center');
    expect(trigger).toHaveClass('rounded-md');
    expect(trigger).toHaveClass('text-sm');
    expect(trigger).toHaveClass('font-medium');
  });

  it('accepts custom className', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" className="custom-trigger" data-testid="trigger">
            Tab 1
          </TabsTrigger>
        </TabsList>
      </Tabs>
    );

    expect(screen.getByTestId('trigger')).toHaveClass('custom-trigger');
  });

  it('shows active state', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" data-testid="trigger1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2" data-testid="trigger2">Tab 2</TabsTrigger>
        </TabsList>
      </Tabs>
    );

    const trigger1 = screen.getByTestId('trigger1');
    const trigger2 = screen.getByTestId('trigger2');

    expect(trigger1).toHaveAttribute('data-state', 'active');
    expect(trigger2).toHaveAttribute('data-state', 'inactive');
  });

  it('can be disabled', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" disabled data-testid="trigger">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>
    );

    expect(screen.getByTestId('trigger')).toBeDisabled();
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger ref={ref} value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

describe('TabsContent', () => {
  it('applies default classes', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" data-testid="content">Content 1</TabsContent>
      </Tabs>
    );

    const content = screen.getByTestId('content');
    expect(content).toHaveClass('mt-2');
    expect(content).toHaveClass('ring-offset-background');
  });

  it('accepts custom className', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" className="custom-content" data-testid="content">
          Content 1
        </TabsContent>
      </Tabs>
    );

    expect(screen.getByTestId('content')).toHaveClass('custom-content');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent ref={ref} value="tab1">Content</TabsContent>
      </Tabs>
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('shows content for active tab only', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    // Active tab content should be visible
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    // Inactive tab content should not be in the DOM (Radix UI behavior)
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
  });
});

