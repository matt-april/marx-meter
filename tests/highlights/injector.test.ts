import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import type { Highlight } from '../../src/lib/highlights/types';

describe('injector', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window;

  beforeEach(() => {
    dom = new JSDOM(
      '<!DOCTYPE html><html><body><p>Test paragraph with some text here.</p><p>More content about euphemisms and sourcing.</p></body></html>',
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
    const tooltips = document.querySelectorAll('.tooltip');
    tooltips.forEach((t) => t.remove());
  });

  it('clears highlights from page', async () => {
    const { injectHighlights, clearHighlights, isHighlightEnabled } =
      await import('../../src/lib/highlights/injector');

    clearHighlights(); // Clear any previous state

    const highlights: Highlight[] = [
      {
        id: 'test-1',
        type: 'sourcing',
        text: 'text',
        explanation: 'Test',
      },
    ];

    injectHighlights(highlights);
    expect(isHighlightEnabled()).toBe(true);

    clearHighlights();
    expect(isHighlightEnabled()).toBe(false);
  });

  it('injects highlights into page', async () => {
    const { injectHighlights, isHighlightEnabled } =
      await import('../../src/lib/highlights/injector');

    const highlights: Highlight[] = [
      {
        id: 'test-1',
        type: 'euphemism',
        text: 'euphemisms',
        explanation: 'Euphemism used to obscure meaning',
      },
    ];

    injectHighlights(highlights);

    expect(isHighlightEnabled()).toBe(true);
    const highlightsInDom = document.querySelectorAll('.highlight');
    expect(highlightsInDom.length).toBeGreaterThan(0);
  });

  it('clears highlights from page', async () => {
    const { injectHighlights, clearHighlights, isHighlightEnabled } =
      await import('../../src/lib/highlights/injector');

    const highlights: Highlight[] = [
      {
        id: 'test-1',
        type: 'sourcing',
        text: 'text',
        explanation: 'Test',
      },
    ];

    injectHighlights(highlights);
    expect(isHighlightEnabled()).toBe(true);

    clearHighlights();
    expect(isHighlightEnabled()).toBe(false);
  });

  it('applies correct colors for each highlight type', async () => {
    const { injectHighlights } = await import('../../src/lib/highlights/injector');

    const highlights: Highlight[] = [
      { id: '1', type: 'euphemism', text: 'euphemisms', explanation: 'Test' },
      { id: '2', type: 'sourcing', text: 'text here', explanation: 'Test' },
    ];

    injectHighlights(highlights);

    const spans = document.querySelectorAll('.highlight');
    expect(spans.length).toBe(2);
  });

  it('does not throw when text not found', async () => {
    const { injectHighlights } = await import('../../src/lib/highlights/injector');

    const highlights: Highlight[] = [
      { id: '1', type: 'missing_context', text: 'nonexistent text xyz', explanation: 'Test' },
    ];

    expect(() => injectHighlights(highlights)).not.toThrow();
  });

  describe('unwrapHighlights on clear', () => {
    it('removes highlight spans from DOM when clearing', async () => {
      const { injectHighlights, clearHighlights, isHighlightEnabled } =
        await import('../../src/lib/highlights/injector');

      const highlights: Highlight[] = [
        { id: '1', type: 'euphemism', text: 'euphemisms', explanation: 'Test' },
      ];

      injectHighlights(highlights);
      expect(isHighlightEnabled()).toBe(true);

      const spansBefore = document.querySelectorAll('.highlight');
      expect(spansBefore.length).toBeGreaterThan(0);

      clearHighlights();

      const spansAfter = document.querySelectorAll('.highlight');
      expect(spansAfter.length).toBe(0);
      expect(isHighlightEnabled()).toBe(false);
    });

    it('allows re-enabling highlights without duplicate spans', async () => {
      const { injectHighlights, clearHighlights } =
        await import('../../src/lib/highlights/injector');

      const highlights: Highlight[] = [
        { id: '1', type: 'euphemism', text: 'euphemisms', explanation: 'Test' },
      ];

      injectHighlights(highlights);
      clearHighlights();
      injectHighlights(highlights);

      const spans = document.querySelectorAll('.highlight');
      expect(spans.length).toBe(1);
    });
  });

  describe('tooltip functionality', () => {
    it('creates tooltip element in document body', async () => {
      const { injectHighlights } = await import('../../src/lib/highlights/injector');

      const highlights: Highlight[] = [
        {
          id: 'tooltip-test',
          type: 'euphemism',
          text: 'euphemisms',
          explanation: 'Test explanation',
        },
      ];

      injectHighlights(highlights);

      const tooltip = document.getElementById('tooltip-tooltip-test');
      expect(tooltip).toBeTruthy();
      expect(tooltip?.className).toBe('tooltip');
      expect(tooltip?.getAttribute('role')).toBe('tooltip');
    });

    it('tooltip contains explanation text', async () => {
      const { injectHighlights } = await import('../../src/lib/highlights/injector');

      const highlights: Highlight[] = [
        {
          id: 'test-tooltip',
          type: 'sourcing',
          text: 'text here',
          explanation: 'Source bias detected',
        },
      ];

      injectHighlights(highlights);

      const tooltip = document.getElementById('tooltip-test-tooltip');
      expect(tooltip?.innerHTML).toContain('Source bias detected');
      expect(tooltip?.innerHTML).toContain('Sourcing concern');
    });

    it('tooltip has proper role attribute for accessibility', async () => {
      const { injectHighlights } = await import('../../src/lib/highlights/injector');

      const highlights: Highlight[] = [
        { id: 'style-test', type: 'missing_context', text: 'text', explanation: 'Test' },
      ];

      injectHighlights(highlights);

      const tooltip = document.getElementById('tooltip-style-test');
      expect(tooltip).toBeTruthy();
      expect(tooltip?.getAttribute('role')).toBe('tooltip');
    });
  });

  describe('highlight span styling', () => {
    it('highlight spans have correct z-index for overlay', async () => {
      const { injectHighlights } = await import('../../src/lib/highlights/injector');

      const highlights: Highlight[] = [
        { id: 'z-test', type: 'euphemism', text: 'euphemisms', explanation: 'Test' },
      ];

      injectHighlights(highlights);

      const span = document.querySelector('.highlight') as HTMLElement;
      expect(span.style.zIndex).toBe('999999');
      expect(span.style.position).toBe('relative');
    });

    it('highlight spans have pointer-events enabled', async () => {
      const { injectHighlights } = await import('../../src/lib/highlights/injector');

      const highlights: Highlight[] = [
        { id: 'pointer-test', type: 'euphemism', text: 'euphemisms', explanation: 'Test' },
      ];

      injectHighlights(highlights);

      const span = document.querySelector('.highlight') as HTMLElement;
      expect(span.style.display).toBe('inline');
    });
  });

  describe('multiple highlights', () => {
    it('handles many highlights without limit', async () => {
      const { injectHighlights } = await import('../../src/lib/highlights/injector');

      const highlights: Highlight[] = [
        { id: '1', type: 'euphemism', text: 'Test', explanation: 'Test' },
        { id: '2', type: 'euphemism', text: 'paragraph', explanation: 'Test' },
        { id: '3', type: 'euphemism', text: 'some', explanation: 'Test' },
        { id: '4', type: 'euphemism', text: 'content', explanation: 'Test' },
        { id: '5', type: 'euphemism', text: 'More', explanation: 'Test' },
      ];

      const report = injectHighlights(highlights);
      expect(report.total).toBe(5);
    });
  });
});
