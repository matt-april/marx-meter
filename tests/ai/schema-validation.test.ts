import { describe, it, expect } from 'vitest';
import { AnalysisResultSchema, ArticleDataSchema } from '../../src/common/types';
import validResponse from '../fixtures/api-responses/gemini-valid.json';

describe('AnalysisResultSchema', () => {
  it('validates a correct analysis result', () => {
    const result = AnalysisResultSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
  });

  it('rejects when whoBenefits is empty', () => {
    const invalid = { ...validResponse, whoBenefits: [] };
    const result = AnalysisResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects when whosAbsent is empty', () => {
    const invalid = { ...validResponse, whosAbsent: [] };
    const result = AnalysisResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects when framingChoices is empty', () => {
    const invalid = { ...validResponse, framingChoices: [] };
    const result = AnalysisResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects when ideologicalAxes score is out of range', () => {
    const invalid = {
      ...validResponse,
      ideologicalAxes: [
        { name: 'pro_capital_vs_pro_labor', score: 15, label: 'Invalid', explanation: 'test' },
      ],
    };
    const result = AnalysisResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects when ideologicalAxes score is negative', () => {
    const invalid = {
      ...validResponse,
      ideologicalAxes: [
        { name: 'pro_capital_vs_pro_labor', score: -1, label: 'Invalid', explanation: 'test' },
      ],
    };
    const result = AnalysisResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid framing choice type', () => {
    const invalid = {
      ...validResponse,
      framingChoices: [
        { type: 'not_a_valid_type', quote: 'test', explanation: 'test' },
      ],
    };
    const result = AnalysisResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid axis name', () => {
    const invalid = {
      ...validResponse,
      ideologicalAxes: [
        { name: 'fake_axis', score: 5, label: 'test', explanation: 'test' },
      ],
    };
    const result = AnalysisResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects when quickTake is missing', () => {
    const { quickTake: _quickTake, ...rest } = validResponse;
    const result = AnalysisResultSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe('ArticleDataSchema', () => {
  it('validates correct article data', () => {
    const article = {
      title: 'Test',
      byline: null,
      content: '<p>content</p>',
      textContent: 'content',
      excerpt: 'excerpt',
      domain: 'example.com',
      url: 'https://example.com/article',
      publishedTime: null,
      siteName: null,
    };
    const result = ArticleDataSchema.safeParse(article);
    expect(result.success).toBe(true);
  });

  it('rejects invalid URL', () => {
    const article = {
      title: 'Test',
      byline: null,
      content: 'content',
      textContent: 'content',
      excerpt: 'excerpt',
      domain: 'example.com',
      url: 'not-a-url',
      publishedTime: null,
      siteName: null,
    };
    const result = ArticleDataSchema.safeParse(article);
    expect(result.success).toBe(false);
  });
});
