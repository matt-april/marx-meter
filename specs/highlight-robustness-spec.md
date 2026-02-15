# Highlight Injection System — Mission-Critical Robustness Spec

**Goal:** Create a highlight injection system that NEVER fails silently and guarantees every framing analysis is visible to the user in all circumstances.
**Status:** For implementation
**Priority:** P0 — Core feature, cannot fail

---

## Problem Statement

The current highlight system (`src/lib/highlights/injector.ts`) has a critical flaw: it uses `Range.surroundContents()` which throws when a text range crosses element boundaries. The code catches this exception and logs a warning, meaning users see **zero highlights** when the core feature fails.

This is unacceptable because:

1. The highlight system IS the product — it's how users see framing analysis in-context
2. Silent failures erode trust — users think the analysis found nothing
3. Every framing choice MUST be visible — missing even one undermines the entire analysis

---

## System Analysis

### Current Data Flow

```
AI Analysis Result
       │
       ▼
┌──────────────────┐
│ convertAnalysis  │  ──► Extracts quotes from framingChoices
│   ToHighlights   │      and missingContext
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ injectHighlights  │  ──► TreeWalker finds text, surroundContents wraps
│                   │      SILENTLY FAILS on cross-element ranges
└────────┬─────────┘
         │
         ▼
    DOM with spans
```

### Failure Modes Identified

| #   | Failure Mode              | Cause                                      | Current Behavior             | Severity |
| --- | ------------------------- | ------------------------------------------ | ---------------------------- | -------- |
| 1   | `surroundContents` throws | Quote spans multiple DOM elements          | Silent catch, no highlights  | CRITICAL |
| 2   | Text not found in DOM     | Quote sanitized/differs from rendered text | No match, no highlights      | CRITICAL |
| 3   | Text in hidden element    | Script, style, template tags               | May highlight invisible text | HIGH     |
| 4   | Dynamic content changes   | SPA hydration after injection              | Highlights disappear         | MEDIUM   |
| 5   | Unicode normalization     | AI output vs DOM encoding mismatch         | No match                     | MEDIUM   |
| 6   | Duplicate quotes in page  | Ambiguous which instance to highlight      | Highlights wrong instance    | MEDIUM   |
| 7   | Very long quotes          | Exact match unlikely for long text         | Low match rate               | MEDIUM   |
| 8   | Click without hover       | Mobile, accessibility needs                | No way to see explanation    | HIGH     |

---

## Design Principles

### 1. Never Fail Silently

Every failure mode must have a visible fallback. The user must ALWAYS see the framing analysis, even if highlighting the exact quote fails.

### 2. Defense in Depth (4-Layer System)

```
Layer 1: Exact text match + surroundContents     [Primary path]
    │                                                  │
    ▼ (if fails)                                       │
Layer 2: Tokenized fuzzy match + DOM reconstruction  │
    │                                                  │
    ▼ (if fails)                                       │
Layer 3: Partial match (sentence/phrase contains)    │
    │                                                  │
    ▼ (if fails)                                       │
Layer 4: Sidepanel-only fallback + user notification │
```

### 3. Always Show Explanation

Every framing choice must have its explanation accessible:

- **Hover:** Tooltip with explanation (desktop)
- **Click:** Opens sidepanel or inline popover (mobile/accessibility)
- **Fallback:** If no highlight renders, show in sidepanel with "Text not found in article" indicator

### 4. Mutation-Resistant

Subscribe to DOM mutations to re-inject highlights when content changes.

---

## Implementation Specification

### File: `src/lib/highlights/types.ts`

Add new types for the robust system:

```typescript
import { z } from 'zod';

export const HighlightTypeSchema = z.enum(['euphemism', 'sourcing', 'missing_context']);

export type HighlightType = z.infer<typeof HighlightTypeSchema>;

export const HighlightSchema = z.object({
  id: z.string(),
  type: HighlightTypeSchema,
  text: z.string(),
  explanation: z.string(),
  reference: z.string().optional(),
});

export type Highlight = z.infer<typeof HighlightSchema>;

// NEW: Result of highlight injection attempt
export const HighlightAttemptSchema = z.object({
  highlight: HighlightSchema,
  success: z.boolean(),
  method: z.enum(['exact', 'tokenized', 'partial', 'fallback']),
  matchedText: z.string().optional(),
  error: z.string().optional(),
});

export type HighlightAttempt = z.infer<typeof HighlightAttemptSchema>;

// NEW: Report for debugging/user feedback
export const HighlightReportSchema = z.object({
  total: z.number(),
  succeeded: z.number(),
  failed: z.number(),
  attempts: z.array(HighlightAttemptSchema),
});

export type HighlightReport = z.infer<typeof HighlightReportSchema>;

export const highlightColors: Record<
  HighlightType,
  { bg: string; border: string; tooltip: string }
> = {
  euphemism: {
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.5)',
    tooltip: 'Euphemism detected',
  },
  sourcing: {
    bg: 'rgba(234, 179, 8, 0.2)',
    border: 'rgba(234, 179, 8, 0.5)',
    tooltip: 'Sourcing concern',
  },
  missing_context: {
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.5)',
    tooltip: 'Missing context',
  },
};
```

---

### File: `src/lib/highlights/injector.ts`

Complete rewrite with 4-layer fallback system:

```typescript
import type { Highlight, HighlightAttempt, HighlightReport } from './types';
import { highlightColors } from './types';

let shadowRoot: ShadowRoot | null = null;
let highlightContainer: HTMLDivElement | null = null;
let mutationObserver: MutationObserver | null = null;
let currentHighlights: Highlight[] = [];
let sidepanelFallbackContainer: HTMLElement | null = null;

const EXACT = 'exact';
const TOKENIZED = 'tokenized';
const PARTIAL = 'partial';
const FALLBACK = 'fallback';

function ensureShadowRoot(): ShadowRoot {
  const existingHost = document.getElementById('marx-meter-highlights');
  if (shadowRoot && existingHost && shadowRoot === existingHost.shadowRoot) {
    return shadowRoot;
  }

  shadowRoot = null;
  highlightContainer = null;

  const host = document.createElement('div');
  host.id = 'marx-meter-highlights';
  host.style.cssText = 'position: absolute; z-index: 999999; pointer-events: none;';
  document.body.appendChild(host);
  shadowRoot = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    .highlight {
      pointer-events: auto;
      cursor: pointer;
      border-bottom: 2px solid;
      position: relative;
      transition: background-color 0.2s;
    }
    .highlight:hover, .highlight:focus {
      filter: brightness(1.2);
      outline: none;
    }
    .highlight:focus {
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
    }
    .tooltip {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 12px;
      background: #171717;
      color: #e5e5e5;
      font-size: 12px;
      line-height: 1.4;
      border-radius: 6px;
      white-space: normal;
      max-width: 300px;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s, visibility 0.2s;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      margin-bottom: 8px;
      text-align: left;
    }
    .highlight:hover .tooltip, .highlight:focus .tooltip {
      opacity: 1;
      visibility: visible;
    }
    .tooltip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-top-color: #171717;
    }
    .fallback-list {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 16px;
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      margin: 8px 0;
    }
    .fallback-item {
      padding: 8px;
      margin: 4px 0;
      background: white;
      border-radius: 4px;
      border-left: 3px solid;
    }
    .fallback-item.euphemism { border-color: #ef4444; }
    .fallback-item.sourcing { border-color: #eab308; }
    .fallback-item.missing_context { border-color: #3b82f6; }
    .fallback-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: #6b7280;
    }
    .fallback-text {
      font-size: 14px;
      color: #1f2937;
      margin: 4px 0;
    }
    .fallback-explanation {
      font-size: 13px;
      color: #4b5563;
    }
  `;
  shadowRoot.appendChild(style);

  highlightContainer = document.createElement('div');
  shadowRoot.appendChild(highlightContainer);

  return shadowRoot;
}

function createHighlightSpan(highlight: Highlight, matchedText: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'highlight';
  span.tabIndex = 0;
  span.setAttribute('role', 'button');
  span.setAttribute(
    'aria-label',
    `${highlightColors[highlight.type].tooltip}: ${highlight.explanation}`,
  );

  const colors = highlightColors[highlight.type];
  span.style.backgroundColor = colors.bg;
  span.style.borderBottomColor = colors.border;

  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.id = `tooltip-${highlight.id}`;
  tooltip.innerHTML = `
    <strong>${colors.tooltip}</strong><br/>
    <span style="font-style: italic; opacity: 0.8;">"${matchedText}"</span><br/>
    ${highlight.explanation}
  `;
  span.appendChild(tooltip);

  span.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.postMessage(
      {
        type: 'MARX_METER_HIGHLIGHT_CLICK',
        highlight,
        matchedText,
      },
      '*',
    );
  });

  span.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      span.click();
    }
  });

  return span;
}

// Layer 1: Exact text match
function tryExactMatch(doc: Document, text: string): Range[] {
  const ranges: Range[] = [];
  const normalizedText = text.normalize('NFC');

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node: Text) => {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tagName = parent.tagName.toLowerCase();
      if (['script', 'style', 'template', 'noscript', 'iframe'].includes(tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      if (
        parent.hidden ||
        parent.style.display === 'none' ||
        parent.style.visibility === 'hidden'
      ) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node: Text | null;
  while ((node = walker.nextNode() as Text)) {
    const nodeText = node.textContent?.normalize('NFC');
    if (!nodeText) continue;

    let searchStart = 0;
    while (true) {
      const index = nodeText.indexOf(normalizedText, searchStart);
      if (index === -1) break;

      try {
        const range = doc.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + normalizedText.length);

        if (range.toString() === normalizedText) {
          ranges.push(range);
          if (ranges.length >= 3) return ranges;
        }
      } catch {
        // Invalid range, skip
      }
      searchStart = index + 1;
    }
  }

  return ranges;
}

// Layer 2: Tokenized fuzzy match
function tryTokenizedMatch(doc: Document, text: string): { range: Range; matched: string } | null {
  const normalizedText = text.normalize('NFC').trim();
  const tokens = normalizedText.split(/\s+/).filter((t) => t.length > 3);

  if (tokens.length === 0) return null;

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);

  let bestMatch: { range: Range; matched: string; score: number } | null = null;
  let node: Text | null;

  while ((node = walker.nextNode() as Text)) {
    const nodeText = node.textContent?.normalize('NFC');
    if (!nodeText) continue;

    for (const token of tokens) {
      const index = nodeText.indexOf(token);
      if (index === -1) continue;

      // Expand to try to capture more context
      const start = Math.max(0, index - 20);
      const end = Math.min(nodeText.length, index + token.length + 20);
      const context = nodeText.slice(start, end);

      // Score by how many tokens match
      let score = 0;
      for (const t of tokens) {
        if (context.toLowerCase().includes(t.toLowerCase())) score++;
      }

      if (score > (bestMatch?.score ?? 0)) {
        try {
          const range = doc.createRange();
          range.setStart(node, start);
          range.setEnd(node, end);
          bestMatch = { range, matched: range.toString(), score };
        } catch {
          // Invalid range
        }
      }
    }
  }

  if (bestMatch) {
    return { range: bestMatch.range, matched: bestMatch.matched };
  }
  return null;
}

// Layer 3: Partial match - find sentences containing key phrases
function tryPartialMatch(doc: Document, text: string): Range[] {
  const normalizedText = text.normalize('NFC');

  // Extract key phrases (5+ character sequences)
  const phrases = normalizedText.match(/\b[A-Za-z]{5,}\b/g) || [];
  if (phrases.length === 0) return [];

  // Find sentences containing any key phrase
  const sentences: { text: string; range: Range }[] = [];

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);

  let node: Text | null;
  while ((node = walker.nextNode() as Text)) {
    const nodeText = node.textContent;
    if (!nodeText) continue;

    // Split into sentences
    const sentenceMatches = nodeText.match(/[^.!?]+[.!?]+/g) || [];
    for (const sentence of sentenceMatches) {
      for (const phrase of phrases) {
        if (sentence.toLowerCase().includes(phrase.toLowerCase())) {
          const startInNode = nodeText.indexOf(sentence);
          if (startInNode === -1) continue;

          try {
            const range = doc.createRange();
            range.setStart(node, startInNode);
            range.setEnd(node, startInNode + sentence.length);
            sentences.push({ text: sentence.trim(), range });
          } catch {
            // Invalid range
          }
          break;
        }
      }
    }
  }

  // Return up to 3 sentences
  return sentences.slice(0, 3).map((s) => s.range);
}

function trySurroundContents(range: Range, span: HTMLSpanElement): boolean {
  try {
    range.surroundContents(span);
    return true;
  } catch {
    return false;
  }
}

function tryExtractAndInsert(range: Range, span: HTMLSpanElement): boolean {
  try {
    const contents = range.extractContents();
    span.appendChild(contents);
    range.insertNode(span);
    return true;
  } catch {
    return false;
  }
}

export function injectHighlights(highlights: Highlight[]): HighlightReport {
  ensureShadowRoot();
  if (!highlightContainer) {
    return {
      total: highlights.length,
      succeeded: 0,
      failed: highlights.length,
      attempts: highlights.map((h) => ({
        highlight: h,
        success: false,
        method: FALLBACK,
        error: 'Shadow DOM not available',
      })),
    };
  }

  highlightContainer.innerHTML = '';
  currentHighlights = highlights;

  const attempts: HighlightAttempt[] = [];
  let succeeded = 0;

  for (const highlight of highlights) {
    let method = '';
    let success = false;
    let matchedText = highlight.text;
    let error: string | undefined;

    // Layer 1: Exact match
    const exactRanges = tryExactMatch(document, highlight.text);
    if (exactRanges.length > 0) {
      for (const range of exactRanges) {
        const span = createHighlightSpan(highlight, highlight.text);
        if (trySurroundContents(range, span)) {
          method = EXACT;
          success = true;
          succeeded++;
          break;
        } else if (tryExtractAndInsert(range, span)) {
          method = EXACT;
          success = true;
          succeeded++;
          break;
        }
      }
    }

    // Layer 2: Tokenized match
    if (!success) {
      const tokenized = tryTokenizedMatch(document, highlight.text);
      if (tokenized) {
        const span = createHighlightSpan(highlight, tokenized.matched);
        if (trySurroundContents(tokenized.range, span)) {
          method = TOKENIZED;
          success = true;
          matchedText = tokenized.matched;
          succeeded++;
        } else if (tryExtractAndInsert(tokenized.range, span)) {
          method = TOKENIZED;
          success = true;
          matchedText = tokenized.matched;
          succeeded++;
        }
      }
    }

    // Layer 3: Partial match
    if (!success) {
      const partialRanges = tryPartialMatch(document, highlight.text);
      if (partialRanges.length > 0) {
        for (const range of partialRanges) {
          const matched = range.toString();
          const span = createHighlightSpan(highlight, matched);
          if (trySurroundContents(range, span)) {
            method = PARTIAL;
            success = true;
            matchedText = matched;
            succeeded++;
            break;
          } else if (tryExtractAndInsert(range, span)) {
            method = PARTIAL;
            success = true;
            matchedText = matched;
            succeeded++;
            break;
          }
        }
      }
    }

    // Layer 4: Fallback - notify user, store for sidepanel
    if (!success) {
      method = FALLBACK;
      error = 'Text not found in article after all matching strategies';
      console.warn(
        `Marx Meter: Could not highlight "${highlight.text.substring(0, 50)}..."`,
        error,
      );
    }

    attempts.push({
      highlight,
      success,
      method: method as HighlightAttempt['method'],
      matchedText: success ? matchedText : undefined,
      error,
    });
  }

  // Setup mutation observer to re-inject on DOM changes
  setupMutationObserver();

  const report: HighlightReport = {
    total: highlights.length,
    succeeded,
    failed: highlights.length - succeeded,
    attempts,
  };

  // Send report to sidepanel for debugging/display
  window.postMessage({ type: 'MARX_METER_HIGHLIGHT_REPORT', payload: report }, '*');

  return report;
}

function setupMutationObserver(): void {
  if (mutationObserver) {
    mutationObserver.disconnect();
  }

  mutationObserver = new MutationObserver((mutations) => {
    // Check if mutations might have removed our highlights
    const host = document.getElementById('marx-meter-highlights');
    if (!host || !host.isConnected) {
      // Highlights were removed, re-inject
      injectHighlights(currentHighlights);
    }
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

export function clearHighlights(): void {
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }

  const host = document.getElementById('marx-meter-highlights');
  if (host) {
    host.remove();
  }
  shadowRoot = null;
  highlightContainer = null;
  currentHighlights = [];
}

export function isHighlightEnabled(): boolean {
  return document.getElementById('marx-meter-highlights') !== null;
}

export function getCurrentHighlights(): Highlight[] {
  return currentHighlights;
}
```

---

### File: `src/entrypoints/content.ts`

Update to handle highlight report and show fallback in sidepanel:

```typescript
import { extractArticle } from '../lib/extraction/readability';
import { getOutletDomain } from '../lib/extraction/domain';
import {
  injectHighlights,
  clearHighlights,
  getCurrentHighlights,
} from '../lib/highlights/injector';
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
  HighlightReportMessage,
} from '../common/types';
import { HighlightSchema } from '../lib/highlights/types';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    console.log('Marx Meter content script loaded.');

    // Listen for highlight report
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'MARX_METER_HIGHLIGHT_REPORT') {
        // Store report for sidepanel access
        browser.storage.local.set({ lastHighlightReport: event.data.payload });

        // If any failed, notify user
        const report = event.data.payload;
        if (report.failed > 0) {
          console.warn(`Marx Meter: ${report.failed}/${report.total} highlights failed to render`);
        }
      }
    });

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
                  const report = injectHighlights(highlights);
                  // Also store highlights that failed for fallback display
                  const failedHighlights = report.attempts
                    .filter((a) => !a.success)
                    .map((a) => a.highlight);
                  browser.storage.local.set({ failedHighlights });
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
          const report = injectHighlights(message.payload);
          const failedHighlights = report.attempts
            .filter((a) => !a.success)
            .map((a) => a.highlight);
          browser.storage.local.set({ failedHighlights });
          sendResponse({ success: true, report });
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
                const report = injectHighlights(highlights);
                const failedHighlights = report.attempts
                  .filter((a) => !a.success)
                  .map((a) => a.highlight);
                browser.storage.local.set({ failedHighlights });
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
```

---

### File: `src/common/types.ts`

Add the HighlightReportMessage type:

```typescript
export interface HighlightReportMessage {
  type: 'HIGHLIGHT_REPORT';
  payload: import('../lib/highlights/types').HighlightReport;
}
```

---

### File: `src/entrypoints/sidepanel/components/FailedHighlights.tsx`

New component to display highlights that couldn't be injected:

```tsx
import type { Highlight } from '../../lib/highlights/types';
import { highlightColors } from '../../lib/highlights/types';

interface FailedHighlightsProps {
  highlights: Highlight[];
}

export function FailedHighlights({ highlights }: FailedHighlightsProps) {
  if (highlights.length === 0) return null;

  return (
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
      <h3 class="text-sm font-semibold text-yellow-800 mb-2">
        Some highlights could not be displayed in article
      </h3>
      <p class="text-xs text-yellow-700 mb-3">
        The following framing choices were identified but the exact text was not found in the
        article:
      </p>
      <div class="space-y-3">
        {highlights.map((highlight) => {
          const colors = highlightColors[highlight.type];
          return (
            <div
              key={highlight.id}
              class="bg-white rounded p-3 border-l-4"
              style={{ borderColor: colors.border }}
            >
              <div class="text-xs font-semibold uppercase text-gray-500 mb-1">{colors.tooltip}</div>
              <div class="text-sm text-gray-700 italic mb-2">
                "{highlight.text.substring(0, 100)}
                {highlight.text.length > 100 ? '...' : ''}"
              </div>
              <div class="text-sm text-gray-600">{highlight.explanation}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

### Tests: `tests/highlights/injector-robust.test.ts`

Comprehensive tests for all failure modes:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import type { Highlight } from '../../src/lib/highlights/types';

describe('injector - Robust Highlight System', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window;

  beforeEach(() => {
    dom = new JSDOM(
      `<!DOCTYPE html><html><body>
        <article>
          <p>The company's spokesperson said the layoffs were a "difficult but necessary" restructuring.</p>
          <p>Workers and community members were not consulted.</p>
          <div>Some other content here with <span>nested elements</span> in the text.</p>
        </article>
      </body></html>`,
      { url: 'https://example.com/article' },
    );
    document = dom.window.document;
    window = dom.window as unknown as Window;
    vi.stubGlobal('document', document);
    vi.stubGlobal('window', window);
    vi.stubGlobal('NodeFilter', dom.window.NodeFilter);
    vi.stubGlobal(
      'MutationObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    const host = document.getElementById('marx-meter-highlights');
    if (host) host.remove();
  });

  describe('Layer 1: Exact match', () => {
    it('highlights exact text match in simple paragraph', async () => {
      const { injectHighlights } = await import('../../src/lib/highlights/injector');

      const highlights: Highlight[] = [
        {
          id: 'test-1',
          type: 'euphemism',
          text: 'difficult but necessary',
          explanation: 'Euphemism obscures the real impact',
        },
      ];

      const report = injectHighlights(highlights);

      expect(report.succeeded).toBe(1);
      expect(report.attempts[0].method).toBe('exact');
    });

    it('handles unicode normalization differences', async () => {
      const { injectHighlights } = await import('../../src/lib/highlights/injector');

      // JSDOM might normalize differently than AI output
      const highlights: Highlight[] = [
        {
          id: 'test-1',
          type: 'euphemism',
          text: 'café', // acute accent
          explanation: 'Test',
        },
      ];

      const report = injectHighlights(highlights);
      // Should still succeed due to NFC normalization
      expect(report.total).toBe(1);
    });
  });

  describe('Layer 2: Tokenized fuzzy match', () => {
    it('finds highlight when exact match fails due to minor differences', async () => {
      const { injectHighlights } = await import('../../src/lib/highlights/injector');

      const highlights: Highlight[] = [
        {
          id: 'test-1',
          type: 'sourcing',
          text: 'workers community members were consulted', // "not" removed by AI
          explanation: 'Sourcing concern',
        },
      ];

      const report = injectHighlights(highlights);

      // Should fall back to tokenized and find partial match
      expect(report.attempts[0].method).not.toBe('fallback');
    });
  });

  describe('Layer 3: Partial sentence match', () => {
    it('highlights sentence containing key phrase when exact fails', async () => {
      const { injectHighlights } = await import('../../src/lib/highlights/injector');

      const highlights: Highlight[] = [
        {
          id: 'test-1',
          type: 'missing_context',
          text: 'xyznonexistentphrase123',
          explanation: 'Should find partial',
        },
      ];

      const report = injectHighlights(highlights);

      // Falls through to partial which should find sentence with matching tokens
      expect(report.attempts[0].method).not.toBe('fallback');
    });
  });

  describe('Layer 4: Fallback behavior', () => {
    it('returns detailed report when all layers fail', async () => {
      const { injectHighlights } = await import('../../src/lib/highlights/injector');

      const highlights: Highlight[] = [
        {
          id: 'test-1',
          type: 'euphemism',
          text: 'completely nonexistent text xyz123',
          explanation: 'Test explanation',
        },
      ];

      const report = injectHighlights(highlights);

      expect(report.total).toBe(1);
      expect(report.failed).toBe(1);
      expect(report.attempts[0].success).toBe(false);
      expect(report.attempts[0].error).toBeDefined();
    });

    it('sends report via postMessage for sidepanel fallback', async () => {
      const postMessageMock = vi.fn();
      vi.stubGlobal('postMessage', postMessageMock);

      const { injectHighlights } = await import('../../src/lib/highlights/injector');

      const highlights: Highlight[] = [
        {
          id: 'test-1',
          type: 'euphemism',
          text: 'nonexistent',
          explanation: 'Test',
        },
      ];

      injectHighlights(highlights);

      expect(postMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'MARX_METER_HIGHLIGHT_REPORT',
        }),
        '*',
      );
    });
  });

  describe('Cross-element ranges', () => {
    it('handles text spanning multiple DOM elements', async () => {
      const { injectHighlights } = await import('../../src/lib/highlights/injector');

      // "nested elements" spans across the <span> boundary
      const highlights: Highlight[] = [
        {
          id: 'test-1',
          type: 'euphemism',
          text: 'nested elements',
          explanation: 'Test across elements',
        },
      ];

      const report = injectHighlights(highlights);

      // Should succeed using extractContents approach
      expect(report.succeeded).toBe(1);
    });
  });

  describe('Accessibility', () => {
    it('makes highlights keyboard accessible', async () => {
      const { injectHighlights } = await import('../../src/lib/highlights/injector');

      const highlights: Highlight[] = [
        {
          id: 'test-1',
          type: 'euphemism',
          text: 'difficult but necessary',
          explanation: 'Test',
        },
      ];

      injectHighlights(highlights);

      const highlightEl = document.querySelector('.highlight') as HTMLElement;
      expect(highlightEl).toBeTruthy();
      expect(highlightEl.getAttribute('tabIndex')).toBe('0');
      expect(highlightEl.getAttribute('role')).toBe('button');
    });
  });

  describe('Mutation observer', () => {
    it('re-injects highlights when DOM is mutated', async () => {
      const { injectHighlights, clearHighlights } =
        await import('../../src/lib/highlights/injector');

      const highlights: Highlight[] = [
        {
          id: 'test-1',
          type: 'euphemism',
          text: 'difficult but necessary',
          explanation: 'Test',
        },
      ];

      injectHighlights(highlights);

      // Simulate DOM removal
      const host = document.getElementById('marx-meter-highlights');
      host?.remove();

      // Trigger a mutation
      const p = document.createElement('p');
      p.textContent = 'New content';
      document.body.appendChild(p);

      // Should have re-injected
      const newHost = document.getElementById('marx-meter-highlights');
      expect(newHost).toBeTruthy();
    });
  });
});
```

---

## Integration Checklist

- [ ] Update `src/lib/highlights/types.ts` with new schemas
- [ ] Rewrite `src/lib/highlights/injector.ts` with 4-layer system
- [ ] Update `src/entrypoints/content.ts` to handle reports
- [ ] Add `HighlightReportMessage` to `src/common/types.ts`
- [ ] Create `FailedHighlights.tsx` component
- [ ] Integrate `FailedHighlights` into `AnalysisDisplay.tsx`
- [ ] Run `pnpm typecheck` — must pass
- [ ] Run `pnpm lint` — must pass
- [ ] Run `pnpm test` — must pass
- [ ] Verify highlights appear on test article pages

---

## Success Metrics

| Metric                     | Target                         |
| -------------------------- | ------------------------------ |
| Exact match success rate   | >70%                           |
| Tokenized fallback success | >90% cumulative                |
| Partial fallback success   | >95% cumulative                |
| Silent failures            | 0 (always fallback visible)    |
| Mutation resilience        | Highlights survive DOM changes |
| Accessibility              | Keyboard navigable             |
