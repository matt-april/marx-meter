import { Readability } from '@mozilla/readability';

export interface ReadabilityResult {
  title: string;
  byline: string | null;
  content: string;
  textContent: string;
  excerpt: string;
  publishedTime: string | null;
  siteName: string | null;
}

/**
 * Extract article content from a DOM document using Mozilla's Readability.js.
 * Returns null if the page is not an article or extraction fails.
 *
 * IMPORTANT: Readability modifies the document it receives.
 * Always pass a cloned document: `document.cloneNode(true)`.
 */
export function extractArticle(doc: Document): ReadabilityResult | null {
  const reader = new Readability(doc);
  const article = reader.parse();

  if (!article) {
    return null;
  }

  return {
    title: article.title ?? '',
    byline: article.byline ?? null,
    content: article.content ?? '',
    textContent: article.textContent ?? '',
    excerpt: article.excerpt ?? '',
    publishedTime: article.publishedTime ?? null,
    siteName: article.siteName ?? null,
  };
}
