import { describe, it, expect } from 'vitest';
import { buildAnalysisPrompt } from '../../src/lib/analysis/prompts';
import type { ArticleData } from '../../src/common/types';

const mockArticle: ArticleData = {
  title: 'Test Article Headline',
  byline: 'Test Author',
  content: '<p>HTML content</p>',
  textContent: 'Plain text content of the article.',
  excerpt: 'Test excerpt',
  domain: 'example.com',
  url: 'https://example.com/article',
  publishedTime: '2026-01-01',
  siteName: 'Example News',
};

describe('buildAnalysisPrompt', () => {
  it('includes article title in the prompt', () => {
    const prompt = buildAnalysisPrompt(mockArticle);
    expect(prompt).toContain('Test Article Headline');
  });

  it('includes article domain in the prompt', () => {
    const prompt = buildAnalysisPrompt(mockArticle);
    expect(prompt).toContain('Example News');
  });

  it('includes article text content in the prompt', () => {
    const prompt = buildAnalysisPrompt(mockArticle);
    expect(prompt).toContain('Plain text content of the article.');
  });

  it('includes byline in the prompt', () => {
    const prompt = buildAnalysisPrompt(mockArticle);
    expect(prompt).toContain('Test Author');
  });

  it('falls back to domain when siteName is null', () => {
    const article = { ...mockArticle, siteName: null };
    const prompt = buildAnalysisPrompt(article);
    expect(prompt).toContain('example.com');
  });

  it('truncates articles longer than 30000 characters', () => {
    const longArticle = {
      ...mockArticle,
      textContent: 'Z'.repeat(50000),
    };
    const prompt = buildAnalysisPrompt(longArticle);
    // The prompt should contain exactly 30000 Z's (Z doesn't appear in the template)
    const zCount = (prompt.match(/Z/g) || []).length;
    expect(zCount).toBe(30000);
  });

  it('adds truncation notice for long articles', () => {
    const longArticle = {
      ...mockArticle,
      textContent: 'Z'.repeat(50000),
    };
    const prompt = buildAnalysisPrompt(longArticle);
    expect(prompt).toContain('truncated');
  });

  it('does not add truncation notice for short articles', () => {
    const prompt = buildAnalysisPrompt(mockArticle);
    expect(prompt).not.toContain('truncated');
  });

  it('includes analysis instructions for all required output fields', () => {
    const prompt = buildAnalysisPrompt(mockArticle);
    expect(prompt).toContain('quickTake');
    expect(prompt).toContain('whoBenefits');
    expect(prompt).toContain('whosAbsent');
    expect(prompt).toContain('framingChoices');
    expect(prompt).toContain('ideologicalAxes');
    expect(prompt).toContain('sourceAnalysis');
    expect(prompt).toContain('missingContext');
  });
});
