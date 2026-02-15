import { describe, it, expect } from 'vitest';
import {
  HighlightTypeSchema,
  HighlightSchema,
  highlightColors,
  getHighlightColors,
} from '../../src/lib/highlights/types';

describe('HighlightTypeSchema', () => {
  it('accepts valid highlight types', () => {
    expect(HighlightTypeSchema.parse('euphemism')).toBe('euphemism');
    expect(HighlightTypeSchema.parse('passive_voice')).toBe('passive_voice');
    expect(HighlightTypeSchema.parse('source_bias')).toBe('source_bias');
    expect(HighlightTypeSchema.parse('omission')).toBe('omission');
    expect(HighlightTypeSchema.parse('headline_mismatch')).toBe('headline_mismatch');
    expect(HighlightTypeSchema.parse('other')).toBe('other');
  });

  it('rejects invalid highlight types', () => {
    expect(() => HighlightTypeSchema.parse('invalid')).toThrow();
    expect(() => HighlightTypeSchema.parse('sourcing')).toThrow();
    expect(() => HighlightTypeSchema.parse('missing_context')).toThrow();
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
      type: 'source_bias',
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

  it('has correct colors for source_bias', () => {
    expect(highlightColors.source_bias.bg).toBe('rgba(234, 179, 8, 0.2)');
    expect(highlightColors.source_bias.border).toBe('rgba(234, 179, 8, 0.5)');
    expect(highlightColors.source_bias.tooltip).toBe('Source Bias');
  });

  it('has correct colors for omission', () => {
    expect(highlightColors.omission.bg).toBe('rgba(59, 130, 246, 0.15)');
    expect(highlightColors.omission.border).toBe('rgba(59, 130, 246, 0.5)');
    expect(highlightColors.omission.tooltip).toBe('Omission');
  });

  it('has correct colors for passive_voice', () => {
    expect(highlightColors.passive_voice.bg).toBe('rgba(249, 115, 22, 0.15)');
    expect(highlightColors.passive_voice.border).toBe('rgba(249, 115, 22, 0.5)');
    expect(highlightColors.passive_voice.tooltip).toBe('Passive Voice');
  });

  it('has correct colors for headline_mismatch', () => {
    expect(highlightColors.headline_mismatch.bg).toBe('rgba(168, 85, 247, 0.15)');
    expect(highlightColors.headline_mismatch.border).toBe('rgba(168, 85, 247, 0.5)');
    expect(highlightColors.headline_mismatch.tooltip).toBe('Headline Mismatch');
  });

  it('has correct colors for other', () => {
    expect(highlightColors.other.bg).toBe('rgba(161, 161, 170, 0.15)');
    expect(highlightColors.other.border).toBe('rgba(161, 161, 170, 0.5)');
    expect(highlightColors.other.tooltip).toBe('Other Framing');
  });
});

describe('getHighlightColors', () => {
  it('returns colors for valid euphemism type', () => {
    const colors = getHighlightColors('euphemism');
    expect(colors.bg).toBe('rgba(239, 68, 68, 0.15)');
    expect(colors.tooltip).toBe('Euphemism detected');
  });

  it('returns colors for valid source_bias type', () => {
    const colors = getHighlightColors('source_bias');
    expect(colors.bg).toBe('rgba(234, 179, 8, 0.2)');
    expect(colors.tooltip).toBe('Source Bias');
  });

  it('returns colors for valid omission type', () => {
    const colors = getHighlightColors('omission');
    expect(colors.bg).toBe('rgba(59, 130, 246, 0.15)');
    expect(colors.tooltip).toBe('Omission');
  });

  it('falls back to euphemism colors for unknown type', () => {
    const colors = getHighlightColors('euphemism' as 'euphemism' | 'source_bias' | 'omission');
    expect(colors).toEqual(highlightColors.euphemism);
  });
});
