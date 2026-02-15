import type { MatchedReference } from '../../../lib/references/types';

interface FurtherReadingProps {
  references: MatchedReference[];
}

export function FurtherReading({ references }: FurtherReadingProps) {
  if (references.length === 0) {
    return null;
  }

  return (
    <section class="rounded-lg bg-neutral-900 overflow-hidden">
      <button
        class="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-neutral-800/50 transition-colors"
        aria-expanded="false"
      >
        <div class="flex items-center gap-2">
          <svg
            class="w-4 h-4 text-neutral-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <h2 class="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Further Reading ({references.length})
          </h2>
        </div>
        <svg class="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div class="px-4 pb-4 space-y-3">
        {references.map((ref) => (
          <div key={ref.id} class="border-l-2 border-neutral-700 pl-3">
            <h3 class="text-sm font-medium text-neutral-200">{ref.concept_name}</h3>
            <p class="text-xs text-neutral-400 mt-0.5">
              {ref.author}, <em>{ref.work_title}</em> ({ref.year})
            </p>
            <p class="text-xs text-neutral-500 mt-2">{ref.plain_language_summary}</p>
            {ref.free_url && (
              <a
                href={ref.free_url}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-block mt-2 text-xs text-blue-400 hover:text-blue-300"
              >
                Read free on Marxists.org →
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
