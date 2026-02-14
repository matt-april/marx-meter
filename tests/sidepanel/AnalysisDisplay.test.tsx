import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { AnalysisDisplay } from '../../src/entrypoints/sidepanel/components/AnalysisDisplay';
import type { AnalysisResult } from '../../src/common/types';
import fullResult from '../fixtures/analysis-results/full.json';
import minimalResult from '../fixtures/analysis-results/minimal.json';

describe('AnalysisDisplay', () => {
  it('renders Quick Take section', () => {
    render(
      <AnalysisDisplay
        result={fullResult as AnalysisResult}
        articleTitle="Test Article"
        articleDomain="example.com"
      />,
    );
    expect(screen.getByText('Quick Take')).toBeTruthy();
    expect(screen.getByText(/frames mass layoffs/i)).toBeTruthy();
  });

  it('renders Who Benefits list', () => {
    render(
      <AnalysisDisplay
        result={fullResult as AnalysisResult}
        articleTitle="Test Article"
        articleDomain="example.com"
      />,
    );
    expect(screen.getByText('TechCorp shareholders')).toBeTruthy();
  });

  it("renders Who's Absent list", () => {
    render(
      <AnalysisDisplay
        result={fullResult as AnalysisResult}
        articleTitle="Test Article"
        articleDomain="example.com"
      />,
    );
    expect(screen.getByText('Laid-off workers')).toBeTruthy();
  });

  it('renders framing choices with quotes', () => {
    render(
      <AnalysisDisplay
        result={fullResult as AnalysisResult}
        articleTitle="Test Article"
        articleDomain="example.com"
      />,
    );
    expect(screen.getByText(/workforce optimization initiative/)).toBeTruthy();
  });

  it('renders ideological axes', () => {
    render(
      <AnalysisDisplay
        result={fullResult as AnalysisResult}
        articleTitle="Test Article"
        articleDomain="example.com"
      />,
    );
    expect(screen.getByText('Pro-capital')).toBeTruthy();
    expect(screen.getByText('Pro-labor')).toBeTruthy();
  });

  it('renders source analysis summary', () => {
    render(
      <AnalysisDisplay
        result={fullResult as AnalysisResult}
        articleTitle="Test Article"
        articleDomain="example.com"
      />,
    );
    expect(screen.getAllByText(/Wall Street analysts/).length).toBeGreaterThan(0);
  });

  it('renders missing context', () => {
    render(
      <AnalysisDisplay
        result={fullResult as AnalysisResult}
        articleTitle="Test Article"
        articleDomain="example.com"
      />,
    );
    expect(screen.getByText(/stock buyback/)).toBeTruthy();
  });

  it('renders article title and domain in header', () => {
    render(
      <AnalysisDisplay
        result={fullResult as AnalysisResult}
        articleTitle="Test Article"
        articleDomain="example.com"
      />,
    );
    expect(screen.getByText('Test Article')).toBeTruthy();
    expect(screen.getByText('example.com')).toBeTruthy();
  });

  it('renders with minimal data without crashing', () => {
    render(
      <AnalysisDisplay
        result={minimalResult as AnalysisResult}
        articleTitle="Minimal"
        articleDomain="test.com"
      />,
    );
    expect(screen.getByText('Quick Take')).toBeTruthy();
    expect(screen.getByText('Basic analysis of a short article.')).toBeTruthy();
  });
});
