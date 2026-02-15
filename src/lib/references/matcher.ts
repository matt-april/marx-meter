import referencesData from '../../../data/references/references.json';
import type { Reference, MatchedReference } from './types';

export function matchReferences(analysisText: string): MatchedReference[] {
  const lowerText = analysisText.toLowerCase();
  const scoredReferences: { ref: Reference; score: number; triggers: string[] }[] = [];

  for (const ref of referencesData) {
    let score = 0;
    const matchedTriggers: string[] = [];

    for (const trigger of ref.analysis_triggers) {
      if (lowerText.includes(trigger.toLowerCase())) {
        score += 2;
        matchedTriggers.push(trigger);
      }
    }

    for (const keyword of ref.keywords) {
      const keywordRegex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'gi');
      const matches = lowerText.match(keywordRegex);
      if (matches) {
        score += matches.length * 0.5;
      }
    }

    if (score > 0) {
      scoredReferences.push({ ref, score, triggers: matchedTriggers });
    }
  }

  scoredReferences.sort((a, b) => b.score - a.score);

  return scoredReferences.slice(0, 5).map(({ ref, score, triggers }) => ({
    ...ref,
    relevance_score: Math.min(score, 10),
    matched_triggers: triggers,
  }));
}

export function getAllReferences(): Reference[] {
  return referencesData;
}
