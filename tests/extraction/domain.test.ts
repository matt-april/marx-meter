import { describe, it, expect } from 'vitest';
import { getOutletDomain } from '../../src/lib/extraction/domain';

describe('getOutletDomain', () => {
  it('strips www. prefix', () => {
    expect(getOutletDomain('https://www.nytimes.com/2026/article')).toBe('nytimes.com');
  });

  it('strips amp. prefix', () => {
    expect(getOutletDomain('https://amp.cnn.com/article')).toBe('cnn.com');
  });

  it('strips m. prefix', () => {
    expect(getOutletDomain('https://m.washingtonpost.com/article')).toBe('washingtonpost.com');
  });

  it('strips mobile. prefix', () => {
    expect(getOutletDomain('https://mobile.reuters.com/article')).toBe('reuters.com');
  });

  it('strips edition. prefix', () => {
    expect(getOutletDomain('https://edition.cnn.com/article')).toBe('cnn.com');
  });

  it('leaves domains without common prefixes unchanged', () => {
    expect(getOutletDomain('https://reuters.com/article')).toBe('reuters.com');
  });

  it('handles subdomains that are not common prefixes', () => {
    expect(getOutletDomain('https://news.google.com/article')).toBe('news.google.com');
  });

  it('returns input string for invalid URLs', () => {
    expect(getOutletDomain('not-a-url')).toBe('not-a-url');
  });

  it('handles URLs with paths and query params', () => {
    expect(getOutletDomain('https://www.theguardian.com/us-news/2026/article?utm=test')).toBe(
      'theguardian.com',
    );
  });
});
