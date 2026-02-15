import type { Highlight, HighlightAttempt, HighlightReport } from './types';
import { getHighlightColors } from './types';

let shadowRoot: ShadowRoot | null = null;
let highlightContainer: HTMLDivElement | null = null;
let mutationObserver: MutationObserver | null = null;
let currentHighlights: Highlight[] = [];

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
    .fallback-item.passive_voice { border-color: #f97316; }
    .fallback-item.source_bias { border-color: #eab308; }
    .fallback-item.omission { border-color: #3b82f6; }
    .fallback-item.headline_mismatch { border-color: #a855f7; }
    .fallback-item.other { border-color: #a1a1aa; }
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
    `${getHighlightColors(highlight.type).tooltip}: ${highlight.explanation}`,
  );

  const colors = getHighlightColors(highlight.type);
  span.style.backgroundColor = colors.bg;
  span.style.borderBottomColor = colors.border;
  span.style.position = 'relative';
  span.style.zIndex = '999999';
  span.style.display = 'inline';

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
    white-space: normal;
  `;
  tooltip.innerHTML = `
    <strong>${colors.tooltip}</strong><br/>
    <span style="font-style: italic; opacity: 0.8;">"${matchedText}"</span><br/>
    ${highlight.explanation}
  `;
  document.body.appendChild(tooltip);

  span.addEventListener('mouseenter', () => {
    const rect = span.getBoundingClientRect();
    tooltip.style.display = 'block';
    tooltip.style.top = rect.top + window.scrollY - tooltip.offsetHeight - 8 + 'px';
    tooltip.style.left =
      Math.max(0, rect.left + window.scrollX - tooltip.offsetWidth / 2 + rect.width / 2) + 'px';
  });

  span.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
  });

  span.addEventListener('focus', () => {
    const rect = span.getBoundingClientRect();
    tooltip.style.display = 'block';
    tooltip.style.top = rect.top + window.scrollY - tooltip.offsetHeight - 8 + 'px';
    tooltip.style.left =
      Math.max(0, rect.left + window.scrollX - tooltip.offsetWidth / 2 + rect.width / 2) + 'px';
  });

  span.addEventListener('blur', () => {
    tooltip.style.display = 'none';
  });

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
        }
      } catch {
        // Invalid range, skip
      }
      searchStart = index + 1;
    }
  }

  return ranges;
}

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

      const sentenceStartMatch = nodeText
        .slice(0, index + token.length)
        .match(/[.!?\n]\s*([^.!?]*)$/);
      const sentenceStart = sentenceStartMatch ? (sentenceStartMatch.index ?? 0) + 1 : 0;

      const afterToken = nodeText.slice(index);
      const sentenceEndMatch = afterToken.match(/[.!?]\s*/);
      const sentenceEnd = sentenceEndMatch
        ? index + token.length + (sentenceEndMatch.index ?? 0) + sentenceEndMatch[0].length
        : nodeText.length;

      const start = Math.max(0, sentenceStart);
      const end = Math.min(nodeText.length, sentenceEnd);
      const context = nodeText.slice(start, end);

      let score = 0;
      for (const t of tokens) {
        if (context.toLowerCase().includes(t.toLowerCase())) score++;
      }

      if (score > (bestMatch?.score ?? 0) && context.trim().length > 0) {
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

function tryPartialMatch(doc: Document, text: string): Range[] {
  const normalizedText = text.normalize('NFC');

  const phrases = normalizedText.match(/\b[A-Za-z]{5,}\b/g) || [];
  if (phrases.length === 0) return [];

  const sentences: { text: string; range: Range }[] = [];

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);

  let node: Text | null;
  while ((node = walker.nextNode() as Text)) {
    const nodeText = node.textContent;
    if (!nodeText) continue;

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

  return sentences.slice(0, 10).map((s) => s.range);
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
  return doInjectHighlights(highlights);
}

function doInjectHighlights(highlights: Highlight[]): HighlightReport {
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

    if (!success) {
      method = FALLBACK;
      error = 'Text not found in article after all matching strategies';
      console.warn(
        `Marx Meter: Could not highlight "${highlight.text.substring(0, 50)}..."`,
        error,
        {
          method: method || 'none tried',
          articleTextLength: document.body.textContent?.length || 0,
          textNodeCount: document.querySelectorAll(
            'p, h1, h2, h3, h4, h5, h6, li, td, th, blockquote, span, div',
          ).length,
        },
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

  setupMutationObserver();

  const report: HighlightReport = {
    total: highlights.length,
    succeeded,
    failed: highlights.length - succeeded,
    attempts,
  };

  window.postMessage({ type: 'MARX_METER_HIGHLIGHT_REPORT', payload: report }, '*');

  return report;
}

function setupMutationObserver(): void {
  if (mutationObserver) {
    mutationObserver.disconnect();
  }

  mutationObserver = new MutationObserver((_mutations) => {
    const host = document.getElementById('marx-meter-highlights');
    if (!host || !host.isConnected) {
      injectHighlights(currentHighlights);
    }
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

export function clearHighlights(): void {
  unwrapHighlights();

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
