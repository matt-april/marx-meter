import { GeminiAdapter } from '../lib/ai/gemini';
import type {
  AnalysisCompleteMessage,
  AnalysisErrorMessage,
} from '../common/types';

export default defineBackground(() => {
  console.log('Marx Meter background service worker loaded.');

  // Open side panel on toolbar icon click
  browser.action.onClicked.addListener(async (tab) => {
    if (tab.id) {
      await browser.sidePanel.open({ tabId: tab.id });
    }
  });

  // Listen for analysis requests from the side panel
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ANALYZE_ARTICLE') {
      handleAnalysis(message.payload)
        .then((result) => {
          const response: AnalysisCompleteMessage = {
            type: 'ANALYSIS_COMPLETE',
            payload: result,
          };
          sendResponse(response);
        })
        .catch((err) => {
          const response: AnalysisErrorMessage = {
            type: 'ANALYSIS_ERROR',
            error: err instanceof Error ? err.message : 'Analysis failed',
          };
          sendResponse(response);
        });
      return true; // indicates async sendResponse
    }
  });
});

async function handleAnalysis(article: import('../common/types').ArticleData) {
  // Read API key from storage
  const storage = await browser.storage.local.get('geminiApiKey');
  const apiKey = storage.geminiApiKey as string | undefined;

  if (!apiKey) {
    throw new Error('No Gemini API key configured. Please enter your API key in the extension settings.');
  }

  const adapter = new GeminiAdapter(apiKey);
  return adapter.analyze(article);
}
