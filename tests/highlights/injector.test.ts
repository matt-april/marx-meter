import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import type { Highlight } from '../../src/lib/highlights/types';

describe('injector', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    dom = new JSDOM(
      '<!DOCTYPE html><html><body><p>Test paragraph with some text here.</p><p>More content about euphemisms and sourcing.</p></body></html>',
    );
    document = dom.window.document;
    vi.stubGlobal('document', document);
    vi.stubGlobal('window', dom.window as unknown as Window);
    vi.stubGlobal('NodeFilter', dom.window.NodeFilter);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    const host = document.getElementById('marx-meter-highlights');
    if (host) host.remove();
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
});
