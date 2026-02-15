import type { Highlight } from '../../../lib/highlights/types';
import { highlightColors } from '../../../lib/highlights/types';

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
