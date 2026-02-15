import { useState, useEffect } from 'preact/hooks';
import type { AnalysisResult, ArticleData } from '../../common/types';
import type { OutletOwnership } from '../../lib/ownership/types';
import { matchReferences } from '../../lib/references/matcher';
import type { MatchedReference } from '../../lib/references/types';
import { useHighlightsStore } from '../../lib/highlights/store';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorDisplay } from './components/ErrorDisplay';
import { ApiKeyInput } from './components/ApiKeyInput';
import { OwnershipCard, OwnershipUnknown } from './components/OwnershipCard';
import { FurtherReading } from './components/FurtherReading';
import { CollapsibleSection } from './components/CollapsibleSection';

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
      ownership: OutletOwnership | null;
      references: MatchedReference[];
      articleTitle: string;
      articleDomain: string;
    };

export function App() {
  const [state, setState] = useState<AppState>({ status: 'idle' });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { enabled: highlightsEnabled, toggle: toggleHighlights } = useHighlightsStore();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

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
      await browser.storage.local.set({ geminiApiKey: key });
      setState({ status: 'idle' });
    } catch {
      setState({ status: 'key_error', error: 'Failed to save API key.' });
    }
  };

  const handleAnalyze = async () => {
    setState({ status: 'extracting' });

    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        setState({ status: 'error', error: 'No active tab found.' });
        return;
      }

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

      const analysisResponse = await browser.runtime.sendMessage({
        type: 'ANALYZE_ARTICLE',
        payload: article,
      });

      if (analysisResponse.type === 'ANALYSIS_ERROR') {
        setState({ status: 'error', error: analysisResponse.error });
        return;
      }

      const { analysis, ownership } = analysisResponse.payload as {
        analysis: AnalysisResult;
        ownership: OutletOwnership | null;
      };
      const references = matchReferences(
        analysis.quickTake +
          ' ' +
          analysis.framingChoices
            .map((f: import('../../common/types').FramingChoice) => f.explanation)
            .join(' '),
      );

      setState({
        status: 'done',
        result: analysis,
        ownership,
        references,
        articleTitle: article.title,
        articleDomain: article.domain,
      });

      // Send highlights to content script if enabled
      if (highlightsEnabled && tab.id) {
        const highlights = analysis.framingChoices.map(
          (choice: import('../../common/types').FramingChoice, index: number) => ({
            id: `highlight-${index}`,
            type:
              choice.type === 'euphemism'
                ? 'euphemism'
                : choice.type === 'source_bias'
                  ? 'sourcing'
                  : 'missing_context',
            text: choice.quote,
            explanation: choice.explanation,
          }),
        );
        browser.tabs
          .sendMessage(tab.id, {
            type: 'INJECT_HIGHLIGHTS',
            payload: highlights,
          })
          .catch(() => {});
      }
    } catch (err) {
      setState({
        status: 'error',
        error: err instanceof Error ? err.message : 'An unexpected error occurred.',
      });
    }
  };

  const handleHighlightsToggle = async () => {
    toggleHighlights();
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      if (!useHighlightsStore.getState().enabled) {
        browser.tabs.sendMessage(tab.id, { type: 'CLEAR_HIGHLIGHTS' }).catch(() => {});
      } else if (state.status === 'done') {
        const highlights = state.result.framingChoices.map(
          (choice: import('../../common/types').FramingChoice, index: number) => ({
            id: `highlight-${index}`,
            type:
              choice.type === 'euphemism'
                ? 'euphemism'
                : choice.type === 'source_bias'
                  ? 'sourcing'
                  : 'missing_context',
            text: choice.quote,
            explanation: choice.explanation,
          }),
        );
        browser.tabs
          .sendMessage(tab.id, {
            type: 'INJECT_HIGHLIGHTS',
            payload: highlights,
          })
          .catch(() => {});
      }
    }
  };

  return (
    <div
      class={`min-h-screen ${isDarkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'} p-4`}
    >
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-xl font-bold tracking-tight">Marx Meter</h1>
        <button
          onClick={handleHighlightsToggle}
          class={`px-3 py-1.5 text-xs rounded transition-colors ${
            highlightsEnabled
              ? 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
              : 'bg-neutral-800/50 text-neutral-500 hover:bg-neutral-800'
          }`}
        >
          {highlightsEnabled ? 'Highlights On' : 'Highlights Off'}
        </button>
      </div>

      {state.status === 'needs_key' && (
        <div class="mt-4">
          <ApiKeyInput onKeySubmit={handleApiKeySubmit} isValidating={false} error={null} />
        </div>
      )}

      {state.status === 'validating_key' && (
        <div class="mt-4">
          <ApiKeyInput onKeySubmit={handleApiKeySubmit} isValidating={true} error={null} />
        </div>
      )}

      {state.status === 'key_error' && (
        <div class="mt-4">
          <ApiKeyInput onKeySubmit={handleApiKeySubmit} isValidating={false} error={state.error} />
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
        <div class="mt-4 space-y-3">
          {state.ownership ? (
            <OwnershipCard ownership={state.ownership} />
          ) : (
            <OwnershipUnknown domain={state.articleDomain} />
          )}

          <CollapsibleSection id="quickTake" title="Quick Take" defaultExpanded={true}>
            <p class="text-sm text-neutral-300">{state.result.quickTake}</p>
          </CollapsibleSection>

          <CollapsibleSection id="whoBenefits" title="Who Benefits">
            <WhoBenefitsSection beneficiaries={state.result.whoBenefits} />
          </CollapsibleSection>

          <CollapsibleSection id="whosAbsent" title="Who's Absent">
            <WhosAbsentSection absent={state.result.whosAbsent} />
          </CollapsibleSection>

          <CollapsibleSection id="framingChoices" title="Framing Choices">
            <FramingChoicesDisplay choices={state.result.framingChoices} />
          </CollapsibleSection>

          <CollapsibleSection id="ideologicalAxes" title="Ideological Axes">
            <IdeologicalAxesDisplay axes={state.result.ideologicalAxes} />
          </CollapsibleSection>

          <CollapsibleSection id="sourceAnalysis" title="Source Analysis">
            <SourceAnalysisDisplay sourceAnalysis={state.result.sourceAnalysis} />
          </CollapsibleSection>

          <CollapsibleSection id="missingContext" title="Missing Context">
            <p class="text-sm text-neutral-300">{state.result.missingContext}</p>
          </CollapsibleSection>

          {state.references.length > 0 && <FurtherReading references={state.references} />}

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

function WhoBenefitsSection({ beneficiaries }: { beneficiaries: string[] }) {
  return (
    <ul class="space-y-1">
      {beneficiaries.map((b, i) => (
        <li key={i} class="text-sm text-neutral-300 flex items-start gap-2">
          <span class="text-green-500 mt-1">●</span>
          {b}
        </li>
      ))}
    </ul>
  );
}

function WhosAbsentSection({ absent }: { absent: string[] }) {
  return (
    <ul class="space-y-1">
      {absent.map((a, i) => (
        <li key={i} class="text-sm text-neutral-400 flex items-start gap-2">
          <span class="text-red-500 mt-1">●</span>
          {a}
        </li>
      ))}
    </ul>
  );
}

function FramingChoicesDisplay({ choices }: { choices: AnalysisResult['framingChoices'] }) {
  return (
    <div class="space-y-3">
      {choices.map((choice, i) => (
        <div key={i} class="border-l-2 border-neutral-700 pl-3">
          <span
            class={`text-xs font-medium px-2 py-0.5 rounded ${
              choice.type === 'euphemism'
                ? 'bg-red-500/20 text-red-400'
                : choice.type === 'source_bias'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : choice.type === 'passive_voice'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-neutral-600 text-neutral-300'
            }`}
          >
            {choice.type.replace('_', ' ')}
          </span>
          <p class="text-xs text-neutral-500 mt-1 italic">"{choice.quote}"</p>
          <p class="text-sm text-neutral-300 mt-1">{choice.explanation}</p>
        </div>
      ))}
    </div>
  );
}

function IdeologicalAxesDisplay({ axes }: { axes: AnalysisResult['ideologicalAxes'] }) {
  const axisLabels: Record<string, [string, string]> = {
    pro_capital_vs_pro_labor: ['Pro-capital', 'Pro-labor'],
    individualist_vs_systemic: ['Individualist', 'Systemic'],
    nationalist_vs_internationalist: ['Nationalist', 'Internationalist'],
  };

  const axisColors: Record<string, string> = {
    pro_capital_vs_pro_labor: 'from-blue-600 to-red-500',
    individualist_vs_systemic: 'from-purple-500 to-green-500',
    nationalist_vs_internationalist: 'from-yellow-500 to-teal-500',
  };

  return (
    <div class="space-y-4">
      {axes.map((axis) => {
        const [leftLabel, rightLabel] = axisLabels[axis.name] || [axis.name, ''];
        const pct = (axis.score / 10) * 100;
        const gradient = axisColors[axis.name] || 'from-neutral-500 to-neutral-400';

        return (
          <div key={axis.name} class="space-y-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="text-neutral-400">{leftLabel}</span>
              <span class="font-medium text-neutral-300">{axis.label}</span>
              <span class="text-neutral-400">{rightLabel}</span>
            </div>
            <div class="relative h-3 rounded-full bg-neutral-800 overflow-hidden">
              <div
                class={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${gradient}`}
                style={{ width: `${pct}%` }}
              />
              <div
                class="absolute top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-full shadow-sm"
                style={{ left: `${pct}%` }}
              />
            </div>
            <p class="text-xs text-neutral-500">{axis.explanation}</p>
          </div>
        );
      })}
    </div>
  );
}

function SourceAnalysisDisplay({
  sourceAnalysis,
}: {
  sourceAnalysis: AnalysisResult['sourceAnalysis'];
}) {
  return (
    <div class="space-y-2">
      <div class="flex gap-4 text-xs">
        <div>
          <span class="text-neutral-500">Corporate/Official:</span>{' '}
          <span class="text-neutral-300">{sourceAnalysis.corporateOrOfficial}</span>
        </div>
        <div>
          <span class="text-neutral-500">Workers/Community:</span>{' '}
          <span class="text-neutral-300">{sourceAnalysis.workerOrCommunity}</span>
        </div>
        <div>
          <span class="text-neutral-500">Anonymous:</span>{' '}
          <span class="text-neutral-300">{sourceAnalysis.anonymous}</span>
        </div>
      </div>
      <p class="text-sm text-neutral-400">{sourceAnalysis.summary}</p>
    </div>
  );
}
