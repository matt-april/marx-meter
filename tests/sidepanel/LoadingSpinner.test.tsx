import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { LoadingSpinner } from '../../src/entrypoints/sidepanel/components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders loading text', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Analyzing article...')).toBeTruthy();
  });
});
