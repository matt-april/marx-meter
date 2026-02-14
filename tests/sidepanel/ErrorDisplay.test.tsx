import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { ErrorDisplay } from '../../src/entrypoints/sidepanel/components/ErrorDisplay';

describe('ErrorDisplay', () => {
  it('renders error message', () => {
    render(<ErrorDisplay message="Invalid API key" />);
    expect(screen.getByText('Invalid API key')).toBeTruthy();
  });

  it('renders retry button when onRetry is provided', () => {
    render(<ErrorDisplay message="Error" onRetry={() => {}} />);
    expect(screen.getByText('Try Again')).toBeTruthy();
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorDisplay message="Error" />);
    expect(screen.queryByText('Try Again')).toBeNull();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorDisplay message="Error" onRetry={onRetry} />);
    fireEvent.click(screen.getByText('Try Again'));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
