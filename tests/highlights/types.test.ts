import { describe, it, expect } from 'vitest';
import {
  HighlightTypeSchema,
  HighlightSchema,
  highlightColors,
} from '../../src/lib/highlights/types';

describe('HighlightTypeSchema', () => {
  it('accepts valid highlight types', () => {
    expect(HighlightTypeSchema.parse('euphemism')).toBe('euphemism');
    expect(HighlightTypeSchema.parse('sourcing')).toBe('sourcing');
    expect(HighlightTypeSchema.parse('missing_context')).toBe('missing_context');
  });

  it('rejects invalid highlight types', () => {
    expect(() => HighlightTypeSchema.parse('invalid')).toThrow();
    expect(() => HighlightTypeSchema.parse('other')).toThrow();
  });
});

describe('HighlightSchema', () => {
  it('parses valid highlight', () => {
    const highlight = {
      id: 'test-1',
      type: 'euphemism',
      text: 'some text',
      explanation: 'This is a euphemism',
    };
    expect(HighlightSchema.parse(highlight)).toEqual(highlight);
  });

  it('parses highlight with optional reference', () => {
    const highlight = {
      id: 'test-2',
      type: 'sourcing',
      text: 'quoted text',
      explanation: 'Source bias detected',
      reference: 'Marx, Capital Vol I',
    };
    expect(HighlightSchema.parse(highlight)).toEqual(highlight);
  });

  it('rejects highlight missing required fields', () => {
    expect(() => HighlightSchema.parse({ id: 'test' })).toThrow();
    expect(() => HighlightSchema.parse({ type: 'euphemism' })).toThrow();
  });
});

describe('highlightColors', () => {
  it('has correct colors for euphemism', () => {
    expect(highlightColors.euphemism.bg).toBe('rgba(239, 68, 68, 0.15)');
    expect(highlightColors.euphemism.border).toBe('rgba(239, 68, 68, 0.5)');
    expect(highlightColors.euphemism.tooltip).toBe('Euphemism detected');
  });

  it('has correct colors for sourcing', () => {
    expect(highlightColors.sourcing.bg).toBe('rgba(234, 179, 8, 0.2)');
    expect(highlightColors.sourcing.border).toBe('rgba(234, 179, 8, 0.5)');
    expect(highlightColors.sourcing.tooltip).toBe('Sourcing concern');
  });

  it('has correct colors for missing_context', () => {
    expect(highlightColors.missing_context.bg).toBe('rgba(59, 130, 246, 0.15)');
    expect(highlightColors.missing_context.border).toBe('rgba(59, 130, 246, 0.5)');
    expect(highlightColors.missing_context.tooltip).toBe('Missing context');
  });
});
