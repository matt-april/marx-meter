import { describe, it, expect } from 'vitest';
import { matchReferences, getAllReferences } from '../../src/lib/references/matcher';

describe('getAllReferences', () => {
  it('returns all 10 reference entries', () => {
    const refs = getAllReferences();
    expect(refs).toHaveLength(10);
  });

  it('each reference has required fields', () => {
    const refs = getAllReferences();
    for (const ref of refs) {
      expect(ref.id).toBeDefined();
      expect(ref.concept_name).toBeDefined();
      expect(ref.author).toBeDefined();
      expect(ref.work_title).toBeDefined();
      expect(ref.year).toBeDefined();
      expect(ref.specific_section).toBeDefined();
      expect(ref.plain_language_summary).toBeDefined();
      expect(ref.keywords).toBeDefined();
      expect(ref.analysis_triggers).toBeDefined();
    }
  });
});

describe('matchReferences', () => {
  it('returns empty array for text with no matches', () => {
    const result = matchReferences('This is a generic article about random topics.');
    expect(result).toHaveLength(0);
  });

  it('matches references by keyword', () => {
    const result = matchReferences('The article discusses propaganda and corporate media bias.');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].id).toBe('manufacturing-consent-filters');
  });

  it('matches references by analysis triggers', () => {
    const result = matchReferences(
      'This article has no workers quoted and only executives are interviewed.',
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].id).toBe('manufacturing-consent-filters');
  });

  it('scores triggers higher than keywords', () => {
    const triggerText = 'This article has no workers quoted and only executives are interviewed.';
    const keywordOnlyText = 'The article discusses propaganda and corporate media bias.';

    const triggerResult = matchReferences(triggerText);
    const keywordResult = matchReferences(keywordOnlyText);

    expect(triggerResult[0].relevance_score).toBeGreaterThan(keywordResult[0].relevance_score);
  });

  it('returns maximum 5 references', () => {
    const text = `
      This article discusses propaganda and corporate media bias.
      It also mentions hegemony and ruling class ideology.
      The market forces and commodity fetishism are mentioned.
      Capitalist realism says there is no alternative.
      Reform or revolution is a false choice.
      Neoliberalism promotes human capital and privatization.
    `;
    const result = matchReferences(text);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('sorts results by relevance score descending', () => {
    const result = matchReferences(
      'The ruling class controls the media through propaganda and corporate sources.',
    );
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].relevance_score).toBeGreaterThanOrEqual(result[i].relevance_score);
    }
  });

  it('includes matched_triggers in results when triggers match', () => {
    const result = matchReferences('no workers quoted');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].matched_triggers).toContain('no workers quoted');
  });

  it('handles case-insensitive matching', () => {
    const upperText = 'PROPAGANDA AND CORPORATE MEDIA BIAS';
    const lowerText = 'propaganda and corporate media bias';

    const upperResult = matchReferences(upperText);
    const lowerResult = matchReferences(lowerText);

    expect(upperResult.length).toBe(lowerResult.length);
    expect(upperResult[0].id).toBe(lowerResult[0].id);
  });

  it('matches multiple keywords in the same reference', () => {
    const result = matchReferences(
      'The propaganda model shows corporate media sourcing flak and advertising influence.',
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].id).toBe('manufacturing-consent-filters');
  });

  it('caps relevance score at 10', () => {
    const text = `
      ${'propaganda '.repeat(10)}
      ${'media bias '.repeat(10)}
      ${'no workers quoted '.repeat(10)}
    `;
    const result = matchReferences(text);
    expect(result[0].relevance_score).toBeLessThanOrEqual(10);
  });
});
