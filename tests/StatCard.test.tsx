import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from '../src/app/components/StatCard';

describe('StatCard Component', () => {
  it('renders label and value', () => {
    render(<StatCard label="Test" value={123} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
  });

  it('renders unit when provided', () => {
    render(<StatCard label="Price" value={100} unit="USD" />);
    expect(screen.getByText('USD')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const { container } = render(
      <StatCard label="Price" value={100} icon={<div data-testid="icon">💰</div>} />
    );
    expect(container.querySelector('[data-testid="icon"]')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <StatCard label="Price" value={100} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('uses Tailwind classes for styling', () => {
    const { container } = render(<StatCard label="Price" value={100} />);
    const card = container.firstChild;
    expect(card).toHaveClass('rounded');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('shadow');
  });
});
