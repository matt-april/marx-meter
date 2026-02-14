import type { FramingChoice } from '../../../common/types';

interface FramingChoicesProps {
  choices: FramingChoice[];
}

const typeLabels: Record<FramingChoice['type'], string> = {
  euphemism: 'Euphemism',
  passive_voice: 'Passive Voice',
  source_bias: 'Source Bias',
  omission: 'Omission',
  headline_mismatch: 'Headline Mismatch',
  other: 'Other',
};

const typeColors: Record<FramingChoice['type'], string> = {
  euphemism: 'text-red-400 bg-red-950',
  passive_voice: 'text-orange-400 bg-orange-950',
  source_bias: 'text-yellow-400 bg-yellow-950',
  omission: 'text-blue-400 bg-blue-950',
  headline_mismatch: 'text-purple-400 bg-purple-950',
  other: 'text-neutral-400 bg-neutral-800',
};

export function FramingChoices({ choices }: FramingChoicesProps) {
  return (
    <section class="rounded-lg bg-neutral-900 p-4">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Framing Choices
      </h2>
      <div class="mt-3 space-y-3">
        {choices.map((choice, i) => (
          <div key={i} class="border-l-2 border-neutral-700 pl-3">
            <span
              class={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${typeColors[choice.type]}`}
            >
              {typeLabels[choice.type]}
            </span>
            <blockquote class="mt-1 text-sm italic text-neutral-400">"{choice.quote}"</blockquote>
            <p class="mt-1 text-sm text-neutral-300">{choice.explanation}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
