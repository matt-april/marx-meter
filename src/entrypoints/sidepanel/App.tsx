import { useState, useEffect } from 'preact/hooks';
import type { AnalysisResult, ArticleData } from '../../common/types';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorDisplay } from './components/ErrorDisplay';
import { ApiKeyInput } from './components/ApiKeyInput';

type AppState =
  | { status: 'idle' }
  | { status: 'needs_key' }
  | { status: 'validating_key' }
  | { status: 'key_error'; error: string }
  | { status: 'extracting' }
  | { status: 'analyzing'; articleTitle: string; articleDomain: string }
  | { status: 'error'; error: string }
  | {
      status: 'done';
      result: AnalysisResult;
      articleTitle: string;
      articleDomain: string;
    };

export function App() {
  const [state, setState] = useState<AppState>({ status: 'idle' });

  // Check for API key on mount
  useEffect(() => {
    browser.storage.local.get('geminiApiKey').then((storage) => {
      if (!storage.geminiApiKey) {
        setState({ status: 'needs_key' });
      }
    });
  }, []);

  const handleApiKeySubmit = async (key: string) => {
    setState({ status: 'validating_key' });

    try {
      // Store key (validation will happen on first use)
      await browser.storage.local.set({ geminiApiKey: key });
      setState({ status: 'idle' });
    } catch {
      setState({ status: 'key_error', error: 'Failed to save API key.' });
    }
  };

  const handleAnalyze = async () => {
    setState({ status: 'extracting' });

    try {
      // Get the active tab
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        setState({ status: 'error', error: 'No active tab found.' });
        return;
      }

      // Request extraction from content script
      const extractionResponse = await browser.tabs.sendMessage(tab.id, {
        type: 'EXTRACT_ARTICLE',
      });

      if (extractionResponse.type === 'EXTRACTION_FAILED') {
        setState({ status: 'error', error: extractionResponse.error });
        return;
      }

      const article: ArticleData = extractionResponse.payload;

      setState({
        status: 'analyzing',
        articleTitle: article.title,
        articleDomain: article.domain,
      });

      // Request analysis from background script
      const analysisResponse = await browser.runtime.sendMessage({
        type: 'ANALYZE_ARTICLE',
        payload: article,
      });

      if (analysisResponse.type === 'ANALYSIS_ERROR') {
        setState({ status: 'error', error: analysisResponse.error });
        return;
      }

      setState({
        status: 'done',
        result: analysisResponse.payload,
        articleTitle: article.title,
        articleDomain: article.domain,
      });
    } catch (err) {
      setState({
        status: 'error',
        error: err instanceof Error ? err.message : 'An unexpected error occurred.',
      });
    }
  };

  return (
    <div class="min-h-screen bg-neutral-950 text-neutral-100 p-4">
      <h1 class="text-xl font-bold tracking-tight">Marx Meter</h1>

      {state.status === 'needs_key' && (
        <div class="mt-4">
          <ApiKeyInput
            onKeySubmit={handleApiKeySubmit}
            isValidating={false}
            error={null}
          />
        </div>
      )}

      {state.status === 'validating_key' && (
        <div class="mt-4">
          <ApiKeyInput
            onKeySubmit={handleApiKeySubmit}
            isValidating={true}
            error={null}
          />
        </div>
      )}

      {state.status === 'key_error' && (
        <div class="mt-4">
          <ApiKeyInput
            onKeySubmit={handleApiKeySubmit}
            isValidating={false}
            error={state.error}
          />
        </div>
      )}

      {state.status === 'idle' && (
        <div class="mt-4">
          <p class="text-sm text-neutral-400">
            Navigate to a news article and click Analyze to begin.
          </p>
          <button
            onClick={handleAnalyze}
            class="mt-4 w-full rounded bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
          >
            Analyze This Article
          </button>
        </div>
      )}

      {state.status === 'extracting' && (
        <div class="mt-4">
          <LoadingSpinner />
          <p class="text-center text-xs text-neutral-500 mt-2">Extracting article content...</p>
        </div>
      )}

      {state.status === 'analyzing' && (
        <div class="mt-4">
          <LoadingSpinner />
        </div>
      )}

      {state.status === 'error' && (
        <div class="mt-4">
          <ErrorDisplay message={state.error} onRetry={handleAnalyze} />
        </div>
      )}

      {state.status === 'done' && (
        <div class="mt-4">
          <AnalysisDisplay
            result={state.result}
            articleTitle={state.articleTitle}
            articleDomain={state.articleDomain}
          />
          <button
            onClick={handleAnalyze}
            class="mt-4 w-full rounded bg-neutral-800 px-4 py-2 text-xs font-medium text-neutral-400 hover:bg-neutral-700"
          >
            Re-analyze
          </button>
        </div>
      )}
    </div>
  );
}
