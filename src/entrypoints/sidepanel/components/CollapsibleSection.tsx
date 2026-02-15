import type { ComponentChildren } from 'preact';
import { useUIStore } from '../../../lib/ui/store';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  children: ComponentChildren;
  defaultExpanded?: boolean;
}

export function CollapsibleSection({
  id,
  title,
  children,
  defaultExpanded = false,
}: CollapsibleSectionProps) {
  const { expandedSections, toggleSection } = useUIStore();
  const isExpanded = expandedSections.has(id) || defaultExpanded;

  return (
    <section class="rounded-lg bg-neutral-900 overflow-hidden">
      <button
        onClick={() => toggleSection(id)}
        class="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-neutral-800/50 transition-colors"
        aria-expanded={isExpanded}
      >
        <h2 class="text-xs font-semibold uppercase tracking-wider text-neutral-400">{title}</h2>
        <svg
          class={`h-4 w-4 text-neutral-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div
        class={`overflow-hidden transition-all duration-200 ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div class="px-4 pb-4">{children}</div>
      </div>
    </section>
  );
}
