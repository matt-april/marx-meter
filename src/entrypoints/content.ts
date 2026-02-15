import { extractArticle } from '../lib/extraction/readability';
import { getOutletDomain } from '../lib/extraction/domain';
import { injectHighlights, clearHighlights } from '../lib/highlights/injector';
import type {
  ArticleData,
  ExtractArticleMessage,
  ArticleExtractedMessage,
  ExtractionFailedMessage,
  HighlightsToggleMessage,
  AnalysisResult,
  AnalysisCompleteMessage,
  InjectHighlightsMessage,
  ClearHighlightsMessage,
} from '../common/types';
import { HighlightSchema } from '../lib/highlights/types';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    console.log('Marx Meter content script loaded.');

    browser.runtime.onMessage.addListener(
      (
        message:
          | ExtractArticleMessage
          | HighlightsToggleMessage
          | AnalysisCompleteMessage
          | InjectHighlightsMessage
          | ClearHighlightsMessage,
        _sender,
        sendResponse,
      ) => {
        if (message.type === 'EXTRACT_ARTICLE') {
          handleExtractArticle(sendResponse);
          return true;
        }

        if (message.type === 'HIGHLIGHTS_TOGGLE') {
          const enabled = message.payload;
          if (enabled) {
            browser.storage.local
              .get('lastAnalysis')
              .then((storage: { lastAnalysis?: AnalysisResult }) => {
                if (storage.lastAnalysis) {
                  const highlights = convertAnalysisToHighlights(storage.lastAnalysis);
                  injectHighlights(highlights);
                }
              });
          } else {
            clearHighlights();
          }
          browser.storage.local.set({ highlightsEnabled: enabled });
          sendResponse({ success: true });
          return true;
        }

        if (message.type === 'INJECT_HIGHLIGHTS') {
          injectHighlights(message.payload);
          sendResponse({ success: true });
          return true;
        }

        if (message.type === 'CLEAR_HIGHLIGHTS') {
          clearHighlights();
          sendResponse({ success: true });
          return true;
        }

        if (message.type === 'ANALYSIS_COMPLETE') {
          const analysis: AnalysisResult = message.payload;
          browser.storage.local.set({ lastAnalysis: analysis });
          browser.storage.local
            .get('highlightsEnabled')
            .then((storage: { highlightsEnabled?: boolean }) => {
              if (storage.highlightsEnabled !== false) {
                const highlights = convertAnalysisToHighlights(analysis);
                injectHighlights(highlights);
              }
            });
        }
      },
    );
  },
});

function handleExtractArticle(
  sendResponse: (response: ArticleExtractedMessage | ExtractionFailedMessage) => void,
) {
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
}

function convertAnalysisToHighlights(analysis: AnalysisResult) {
  const highlights: ReturnType<typeof HighlightSchema.parse>[] = [];

  for (const framing of analysis.framingChoices) {
    if (framing.type === 'euphemism') {
      highlights.push({
        id: `framing-${highlights.length}`,
        type: 'euphemism',
        text: framing.quote,
        explanation: framing.explanation,
      });
    } else if (framing.type === 'source_bias') {
      highlights.push({
        id: `framing-${highlights.length}`,
        type: 'sourcing',
        text: framing.quote,
        explanation: framing.explanation,
      });
    } else if (framing.type === 'omission') {
      highlights.push({
        id: `framing-${highlights.length}`,
        type: 'missing_context',
        text: framing.quote,
        explanation: framing.explanation,
      });
    }
  }

  if (analysis.missingContext) {
    const firstParagraph = analysis.quickTake.split('.')[0];
    highlights.push({
      id: 'missing-context',
      type: 'missing_context',
      text: firstParagraph,
      explanation: analysis.missingContext,
    });
  }

  return highlights;
}
