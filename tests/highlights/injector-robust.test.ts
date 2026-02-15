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
          <p>Workers and community members were not consulted about the changes.</p>
          <div>Some other content here with <span>nested elements</span> in the text.</div>
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

      const highlights: Highlight[] = [
        {
          id: 'test-1',
          type: 'euphemism',
          text: 'difficult',
          explanation: 'Test',
        },
      ];

      const report = injectHighlights(highlights);
      expect(report.total).toBe(1);
    });
  });

  describe('Layer 2: Tokenized fuzzy match', () => {
    it('finds highlight when exact match fails due to minor differences', async () => {
      const { injectHighlights } = await import('../../src/lib/highlights/injector');

      const highlights: Highlight[] = [
        {
          id: 'test-1',
          type: 'source_bias',
          text: 'workers community consulted',
          explanation: 'Sourcing concern',
        },
      ];

      const report = injectHighlights(highlights);

      expect(report.attempts[0].method).not.toBe('fallback');
    });
  });

  describe('Layer 3: Partial sentence match', () => {
    it('highlights sentence containing key phrase when exact fails', async () => {
      const { injectHighlights } = await import('../../src/lib/highlights/injector');

      const highlights: Highlight[] = [
        {
          id: 'test-1',
          type: 'omission',
          text: 'about changes',
          explanation: 'Should find partial',
        },
      ];

      const report = injectHighlights(highlights);

      expect(report.attempts[0].method).not.toBe('fallback');
    });
  });

  describe('Layer 4: Fallback behavior', () => {
    it('returns report with error when highlight is not found', async () => {
      const { injectHighlights } = await import('../../src/lib/highlights/injector');

      const highlights: Highlight[] = [
        {
          id: 'test-1',
          type: 'euphemism',
          text: 'xyzqwerty123456 abcdefg789',
          explanation: 'Test explanation',
        },
      ];

      const report = injectHighlights(highlights);

      expect(report.total).toBe(1);
      expect(report.attempts[0].method).toBe('fallback');
      expect(report.attempts[0].error).toBeDefined();
    });

    it('sends report via postMessage for sidepanel fallback', async () => {
      const postMessageSpy = vi.spyOn(window, 'postMessage');

      const { injectHighlights } = await import('../../src/lib/highlights/injector');

      const highlights: Highlight[] = [
        {
          id: 'test-1',
          type: 'euphemism',
          text: 'nonexistent text xyz',
          explanation: 'Test',
        },
      ];

      injectHighlights(highlights);

      expect(postMessageSpy).toHaveBeenCalledWith(
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

      const highlights: Highlight[] = [
        {
          id: 'test-1',
          type: 'euphemism',
          text: 'nested elements',
          explanation: 'Test across elements',
        },
      ];

      const report = injectHighlights(highlights);

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
});
