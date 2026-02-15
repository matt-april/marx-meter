import type { IdeologicalAxis } from '../../../common/types';

interface IdeologicalAxesProps {
  axes: IdeologicalAxis[];
}

const axisLabels: Record<IdeologicalAxis['name'], [string, string]> = {
  pro_capital_vs_pro_labor: ['Pro-capital', 'Pro-labor'],
  individualist_vs_systemic: ['Individualist', 'Systemic'],
  nationalist_vs_internationalist: ['Nationalist', 'Internationalist'],
};

const axisColors = {
  pro_capital_vs_pro_labor: 'from-blue-600 to-red-500',
  individualist_vs_systemic: 'from-purple-500 to-green-500',
  nationalist_vs_internationalist: 'from-yellow-500 to-teal-500',
};

export function IdeologicalAxes({ axes }: IdeologicalAxesProps) {
  return (
    <div class="space-y-4">
      {axes.map((axis) => {
        const [leftLabel, rightLabel] = axisLabels[axis.name] || [axis.name, ''];
        const pct = (axis.score / 10) * 100;
        const gradient = axisColors[axis.name] || 'from-neutral-500 to-neutral-400';

        return (
          <div key={axis.name} class="space-y-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="text-neutral-400">{leftLabel}</span>
              <span class="font-medium text-neutral-300">{axis.label}</span>
              <span class="text-neutral-400">{rightLabel}</span>
            </div>
            <div class="relative h-3 rounded-full bg-neutral-800 overflow-hidden">
              <div
                class={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${gradient}`}
                style={{ width: `${pct}%` }}
              />
              <div
                class="absolute top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-full shadow-sm"
                style={{ left: `${pct}%` }}
              />
            </div>
            <p class="text-xs text-neutral-500">{axis.explanation}</p>
          </div>
        );
      })}
    </div>
  );
}
