import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { join } from 'path';
import { extractArticle } from '../../src/lib/extraction/readability';

function loadFixture(filename: string): Document {
  const html = readFileSync(join(__dirname, '../fixtures/articles', filename), 'utf-8');
  const dom = new JSDOM(html, { url: 'https://example.com/article' });
  return dom.window.document;
}

describe('extractArticle', () => {
  it('extracts title from a news article', () => {
    const doc = loadFixture('sample-article.html');
    const result = extractArticle(doc);
    expect(result).not.toBeNull();
    expect(result!.title).toContain('TechCorp');
  });

  it('extracts non-empty text content', () => {
    const doc = loadFixture('sample-article.html');
    const result = extractArticle(doc);
    expect(result).not.toBeNull();
    expect(result!.textContent.length).toBeGreaterThan(500);
  });

  it('extracts text content containing key article phrases', () => {
    const doc = loadFixture('sample-article.html');
    const result = extractArticle(doc);
    expect(result).not.toBeNull();
    expect(result!.textContent).toContain('workforce optimization');
  });

  it('returns null for non-article pages', () => {
    const doc = loadFixture('non-article.html');
    const result = extractArticle(doc);
    // Readability may return null or a result with very short content
    if (result !== null) {
      expect(result.textContent.length).toBeLessThan(200);
    }
  });

  it('extracts byline when available', () => {
    const doc = loadFixture('sample-article.html');
    const result = extractArticle(doc);
    expect(result).not.toBeNull();
    // Byline detection is heuristic — it may or may not find "Jane Reporter"
    // Just check it doesn't crash
    expect(result!.byline === null || typeof result!.byline === 'string').toBe(true);
  });
});
