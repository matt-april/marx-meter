import type { Highlight } from './types';
import { highlightColors } from './types';

let shadowRoot: ShadowRoot | null = null;
let highlightContainer: HTMLDivElement | null = null;

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
    .highlight:hover {
      filter: brightness(1.2);
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
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s, visibility 0.2s;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      margin-bottom: 8px;
    }
    .highlight:hover .tooltip {
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
  `;
  shadowRoot.appendChild(style);

  highlightContainer = document.createElement('div');
  shadowRoot.appendChild(highlightContainer);

  return shadowRoot;
}

export function injectHighlights(highlights: Highlight[]): void {
  ensureShadowRoot();
  if (!highlightContainer) return;

  highlightContainer.innerHTML = '';

  for (const highlight of highlights) {
    const ranges = findTextRanges(document, highlight.text);
    const colors = highlightColors[highlight.type];

    for (const range of ranges) {
      try {
        const span = document.createElement('span');
        span.className = 'highlight';
        span.style.backgroundColor = colors.bg;
        span.style.borderBottomColor = colors.border;

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = `${colors.tooltip}: ${highlight.explanation}`;
        span.appendChild(tooltip);

        range.surroundContents(span);

        span.addEventListener('click', () => {
          window.postMessage({ type: 'MARX_METER_HIGHLIGHT_CLICK', highlight }, '*');
        });
      } catch (e) {
        console.warn('Marx Meter: Could not highlight range', e);
      }
    }
  }
}

function findTextRanges(doc: Document, text: string): Range[] {
  const ranges: Range[] = [];
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);

  let node: Text | null;
  while ((node = walker.nextNode() as Text)) {
    const index = node.textContent?.indexOf(text);
    if (index !== null && index >= 0) {
      const range = doc.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + text.length);
      ranges.push(range);

      if (ranges.length >= 3) return ranges;
    }
  }

  return ranges;
}

export function clearHighlights(): void {
  const host = document.getElementById('marx-meter-highlights');
  if (host) {
    host.remove();
  }
  shadowRoot = null;
  highlightContainer = null;
}

export function isHighlightEnabled(): boolean {
  return document.getElementById('marx-meter-highlights') !== null;
}
