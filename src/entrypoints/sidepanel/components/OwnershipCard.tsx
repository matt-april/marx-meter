import type { OutletOwnership } from '../../../lib/ownership/types';
import { formatDonations } from '../../../lib/ownership/lookup';

interface OwnershipCardProps {
  ownership: OutletOwnership;
}

export function OwnershipCard({ ownership }: OwnershipCardProps) {
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
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h2 class="text-xs font-semibold uppercase tracking-wider text-neutral-400">Ownership</h2>
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
        <div>
          <p class="text-sm font-medium text-neutral-200">{ownership.name}</p>
          <p class="text-xs text-neutral-400">Owned by {ownership.parent_company}</p>
        </div>
        <div class="text-xs text-neutral-400">
          <p>Revenue: {ownership.revenue_model}</p>
          <p class="mt-1">{formatDonations(ownership.political_donations)}</p>
        </div>
        {ownership.other_properties.length > 0 && (
          <div class="text-xs text-neutral-500">
            <p>Other properties: {ownership.other_properties.slice(0, 3).join(', ')}</p>
          </div>
        )}
        {ownership.editorial_notes && (
          <div class="text-xs text-neutral-500 italic border-t border-neutral-800 pt-2 mt-2">
            {ownership.editorial_notes}
          </div>
        )}
      </div>
    </section>
  );
}

interface OwnershipUnknownProps {
  domain: string;
}

export function OwnershipUnknown({ domain }: OwnershipUnknownProps) {
  return (
    <section class="rounded-lg bg-neutral-900 p-4">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-neutral-500">Ownership</h2>
      <p class="mt-2 text-sm text-neutral-400">No ownership data available for {domain}</p>
    </section>
  );
}
