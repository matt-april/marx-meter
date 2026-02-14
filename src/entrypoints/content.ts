import { extractArticle } from '../lib/extraction/readability';
import { getOutletDomain } from '../lib/extraction/domain';
import type { ArticleData, ExtractArticleMessage, ArticleExtractedMessage, ExtractionFailedMessage } from '../common/types';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    console.log('Marx Meter content script loaded.');

    // Listen for extraction requests from the background/sidepanel
    browser.runtime.onMessage.addListener(
      (message: ExtractArticleMessage, _sender, sendResponse) => {
        if (message.type !== 'EXTRACT_ARTICLE') return;

        try {
          const clonedDoc = document.cloneNode(true) as Document;
          const result = extractArticle(clonedDoc);

          if (!result) {
            const response: ExtractionFailedMessage = {
              type: 'EXTRACTION_FAILED',
              error: 'Could not extract article content from this page. It may not be a news article.',
            };
            sendResponse(response);
            return;
          }

          const articleData: ArticleData = {
            title: result.title,
            byline: result.byline,
            content: result.content,
            textContent: result.textContent,
            excerpt: result.excerpt,
            domain: getOutletDomain(window.location.href),
            url: window.location.href,
            publishedTime: result.publishedTime,
            siteName: result.siteName,
          };

          const response: ArticleExtractedMessage = {
            type: 'ARTICLE_EXTRACTED',
            payload: articleData,
          };
          sendResponse(response);
        } catch (err) {
          const response: ExtractionFailedMessage = {
            type: 'EXTRACTION_FAILED',
            error: err instanceof Error ? err.message : 'Unknown extraction error',
          };
          sendResponse(response);
        }

        return true; // indicates async sendResponse
      },
    );
  },
});
