import type { IdeologicalAxis } from '../../../common/types';

interface IdeologicalAxesProps {
  axes: IdeologicalAxis[];
}

const axisLabels: Record<IdeologicalAxis['name'], [string, string]> = {
  pro_capital_vs_pro_labor: ['Pro-capital', 'Pro-labor'],
  individualist_vs_systemic: ['Individualist', 'Systemic'],
  nationalist_vs_internationalist: ['Nationalist', 'Internationalist'],
};

export function IdeologicalAxes({ axes }: IdeologicalAxesProps) {
  return (
    <section class="rounded-lg bg-neutral-900 p-4">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Ideological Axes
      </h2>
      <div class="mt-3 space-y-4">
        {axes.map((axis) => {
          const [leftLabel, rightLabel] = axisLabels[axis.name] || [axis.name, ''];
          const pct = (axis.score / 10) * 100;
          return (
            <div key={axis.name}>
              <div class="flex items-center justify-between text-xs text-neutral-500">
                <span>{leftLabel}</span>
                <span>{rightLabel}</span>
              </div>
              <div class="mt-1 h-2 rounded-full bg-neutral-800">
                <div
                  class="h-2 rounded-full bg-neutral-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p class="mt-1 text-xs text-neutral-500">
                {axis.label} ({axis.score}/10) — {axis.explanation}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
