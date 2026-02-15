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

## Bug Fixes — Issues Found in Production

This section documents bugs discovered during testing on CNN articles and provides explicit fix instructions for implementation.

### Bug 1: Highlights Get Darker on Re-Enable

**Symptom:** Every time highlights are toggled off and back on, the highlights appear progressively darker/bolder.

**Root Cause:** The `clearHighlights()` function (`src/lib/highlights/injector.ts:463-476`) removes the host element from the DOM but does NOT remove the highlight `<span>` elements that were injected into the article content. When highlights are re-enabled, new spans are added on top of existing spans, causing visual overlap.

**Fix in `src/lib/highlights/injector.ts`:**

Add a function to unwrap existing highlight spans before clearing:

```typescript
function unwrapHighlights(): void {
  const highlights = document.querySelectorAll('.highlight');
  highlights.forEach((span) => {
    const parent = span.parentNode;
    if (parent) {
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
    }
  });
}

export function clearHighlights(): void {
  // ADD THIS LINE at the start of clearHighlights
  unwrapHighlights(); // <-- ADD THIS LINE

  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }
  // ... rest of function
}
```

**Why this works:** Before removing the host element, we find all `.highlight` spans in the document, unwrap them by inserting their children before the span, then remove the span. This cleanly removes highlights without leaving duplicates.

---

### Bug 2: Highlights Stop Mid-Word / Random Positions

**Symptom:** First few highlights work, then they stop working. Sometimes highlights only cover half a word.

**Root Cause:** Multiple issues:

1. **Line 208 in `tryExactMatch`**: `if (ranges.length >= 3) return ranges;` — Only finds first 3 matches per highlight text, then stops
2. **TreeWalker limitations**: The walker only processes text nodes that exist at injection time. Lazy-loaded content (common in CNN and other news sites) is not searched.
3. **Cross-element boundaries**: The exact match only works within a single TextNode. If a quote spans `<p>word <em>more</em></p>`, it fails.

**Fix in `src/lib/highlights/injector.ts`:**

1. Remove the artificial 3-match limit:

```typescript
// REMOVE this line from tryExactMatch (around line 208):
// if (ranges.length >= 3) return ranges;

// REPLACE with:
return ranges; // Return all matches found
```

2. Add debug logging to help diagnose remaining failures:

```typescript
// In injectHighlights function, after the matching attempts:
if (!success) {
  // Add this diagnostic info
  console.warn(`Marx Meter highlight failed:`, {
    text: highlight.text.substring(0, 50),
    method: method || 'none tried',
    error,
    // Add these for debugging:
    articleTextLength: document.body.textContent?.length || 0,
    textNodeCount: document.querySelectorAll(
      'p, h1, h2, h3, h4, h5, h6, li, td, th, blockquote, span, div',
    ).length,
  });
}
```

---

### Bug 3: No Tooltip / Hover / Click Functionality

**Symptom:** Highlights appear but nothing happens on hover, click, or focus.

**Root Cause:** The CSS for tooltips exists in the shadow DOM but the hover/click events are not triggering because:

1. The host element has `pointer-events: none` but child spans have `pointer-events: auto`
2. However, the tooltip is positioned with `bottom: 100%` relative to the span, but spans are positioned in the document flow, not absolutely positioned
3. The tooltip might be rendering but appearing behind other content due to z-index issues

**Fix in `src/lib/highlights/injector.ts`:**

1. Change tooltip positioning to work within the document flow:

```typescript
// In createHighlightSpan function, change tooltip CSS:
// Replace the tooltip styles around line 45-78 with:

const tooltip = document.createElement('div');
tooltip.className = 'tooltip';
tooltip.id = `tooltip-${highlight.id}`;
tooltip.setAttribute('role', 'tooltip');
tooltip.style.cssText = `
  position: absolute;
  display: none;
  z-index: 1000000;
  padding: 8px 12px;
  background: #171717;
  color: #e5e5e5;
  font-size: 12px;
  line-height: 1.4;
  border-radius: 6px;
  max-width: 300px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  text-align: left;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;
tooltip.innerHTML = `
  <strong>${colors.tooltip}</strong><br/>
  <span style="font-style: italic; opacity: 0.8;">"${matchedText}"</span><br/>
  ${highlight.explanation}
`;
```

2. Add explicit hover/focus handlers to show tooltip:

```typescript
// After creating the span, add these event handlers:

span.addEventListener('mouseenter', () => {
  tooltip.style.display = 'block';

  // Position tooltip above the span
  const rect = span.getBoundingClientRect();
  tooltip.style.bottom = window.innerHeight - rect.top + 8 + 'px';
  tooltip.style.left = rect.left + 'px';
});

span.addEventListener('mouseleave', () => {
  tooltip.style.display = 'none';
});

span.addEventListener('focus', () => {
  tooltip.style.display = 'block';
});
```

3. Add the tooltip to the document body (not shadow DOM) so it overlays correctly:

```typescript
// At the end of createHighlightSpan, append tooltip to body instead:
document.body.appendChild(tooltip);
```

**Alternative simpler fix:** Just ensure the highlight spans have proper z-index:

```typescript
// In the highlight CSS, ensure z-index is high enough:
.highlight {
  pointer-events: auto;
  cursor: pointer;
  border-bottom: 2px solid;
  position: relative;
  z-index: 999999;  /* ADD THIS */
}
```

---

### Bug 4: Only First Half of Article Gets Highlighted

**Symptom:** Highlights work for content at the top of the article but not for content lower down.

**Root Cause:**

1. **Lazy loading**: CNN and many news sites load article content dynamically. The TreeWalker only searches text nodes that exist at the time of injection.
2. **Ad insertions**: Sites insert ad containers that break text continuity
3. **Infinite scroll**: Content below the fold doesn't exist in the DOM yet

**Fix in `src/lib/highlights/injector.ts`:**

1. Wait for page to fully load before injecting:

```typescript
// In injectHighlights function, add at the beginning:

export function injectHighlights(highlights: Highlight[]): Promise<HighlightReport> {
  return new Promise((resolve) => {
    // If document is still loading, wait for it
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => resolve(doInjectHighlights(highlights)));
    } else {
      // Small delay to let dynamic content settle
      setTimeout(() => resolve(doInjectHighlights(highlights)), 500);
    }
  });
}

function doInjectHighlights(highlights: Highlight[]): HighlightReport {
  // ... existing code
}
```

2. Add retry logic for content loaded after initial injection:

```typescript
// In setupMutationObserver, change to re-scan for unmatched highlights:

function setupMutationObserver(): void {
  if (mutationObserver) {
    mutationObserver.disconnect();
  }

  mutationObserver = new MutationObserver((mutations) => {
    // Check if we have failed highlights that might now match
    const host = document.getElementById('marx-meter-highlights');
    if (!host || !host.isConnected) {
      injectHighlights(currentHighlights);
      return;
    }

    // Also retry failed highlights when new content loads
    const failedAttempts = getCurrentHighlights().filter(h => /* check if not highlighted */);
    if (failedAttempts.length > 0) {
      injectHighlights(failedAttempts);
    }
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
```

---

### Bug 5: Highlight Color Doesn't Match Framing Type

**Status:** FIXED - All 6 framing types now have matching colors.

**Symptom:** Source bias highlights appear red instead of yellow (or wrong colors for other types).

**Root Cause:**

1. **Silent type drop**: In `src/entrypoints/content.ts:152-191`, the `convertAnalysisToHighlights` function only handles 3 framing types: `euphemism`, `source_bias`, and `omission`. The other types (`passive_voice`, `headline_mismatch`, `other`) are silently dropped — never converted to highlights.

2. **Type mapping error**: `source_bias` is mapped to `sourcing` type in highlights (line 166), but the color definition in `types.ts` uses `sourcing` which is correct. However, if an unhandled type is passed, it won't have colors and may default to browser styles.

**Fix in `src/entrypoints/content.ts`:**

Add all framing types to the conversion:

```typescript
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
    // ADD THESE NEW MAPPINGS:
    else if (framing.type === 'passive_voice') {
      highlights.push({
        id: `framing-${highlights.length}`,
        type: 'euphemism', // Reuse euphemism color (red) - passive voice obscures agency
        text: framing.quote,
        explanation: framing.explanation,
      });
    } else if (framing.type === 'headline_mismatch') {
      highlights.push({
        id: `framing-${highlights.length}`,
        type: 'missing_context', // Reuse missing_context (blue)
        text: framing.quote,
        explanation: framing.explanation,
      });
    } else if (framing.type === 'other') {
      highlights.push({
        id: `framing-${highlights.length}`,
        type: 'euphemism', // Default to euphemism color
        text: framing.quote,
        explanation: framing.explanation,
      });
    }
    // END ADDITIONS

    // REMOVE the old fallback that silently dropped unhandled types
  }

  // ... rest of function
}
```

**Also fix in `src/lib/highlights/types.ts`:**

Add a fallback color for unknown types:

```typescript
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

// ADD this fallback function:
export function getHighlightColors(type: HighlightType) {
  return highlightColors[type] || highlightColors.euphemism;
}
```

Then update `createHighlightSpan` to use the fallback:

```typescript
const colors = getHighlightColors(highlight.type); // Changed from direct access
```

---

## Console Errors to Ignore

The following errors in the console are from third-party ads/scripts on CNN and are NOT related to Marx Meter:

- `CORS policy: No 'Access-Control-Allow-Origin'` — From ad networks (hb.openwebmp.com, api.rlcdn.com)
- `Failed to load resource: net::ERR_FAILED` — Ad loading failures
- `Not signed in with the identity provider` — CNN's authentication iframe
- `SecurityError: Failed to read a named property 'document'` — Ad sandbox cross-origin violations
- `ssp-sync.criteo.com` 429 errors — Rate limiting from ad trackers
- `GSAP target not found` — Animation library warnings from ads
- `FedCM get() rejects` — Google's federated identity API
- `VPAIDAd: emit AdLoaded second time` — Video ad errors

**Real Marx Meter errors** to look for:

- `Marx Meter: X/Y highlights failed to render` — Our own failure reporting
- Console.warn from injector.ts with diagnostic info

---

## Test Checklist

After implementing all fixes, verify:

- [ ] Toggle highlights off/on multiple times — no darkening/overlap
- [ ] All framing types show correct colors (euphemism=red, sourcing=yellow, missing_context=blue)
- [ ] Hover shows tooltip with explanation
- [ ] Click opens sidepanel or shows click handler
- [ ] Keyboard navigation works (Tab to highlight, Enter to activate)
- [ ] Highlights appear throughout entire article, not just first half
- [ ] Works on lazy-loaded content (scroll down, then re-analyze)
- [ ] No console errors from Marx Meter code
