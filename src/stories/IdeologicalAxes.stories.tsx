import type { Meta, StoryObj } from '@storybook/preact';
import { IdeologicalAxes } from '../entrypoints/sidepanel/components/IdeologicalAxes';
import type { IdeologicalAxis } from '../common/types';

const meta: Meta<typeof IdeologicalAxes> = {
  title: 'Components/IdeologicalAxes',
  component: IdeologicalAxes,
  tags: ['autodocs'],
  argTypes: {
    axes: { control: 'object' },
  },
};

export default meta;
type Story = StoryObj<typeof IdeologicalAxes>;

const defaultAxes: IdeologicalAxis[] = [
  {
    name: 'pro_capital_vs_pro_labor',
    score: 7,
    label: 'Pro-capital',
    explanation: 'Article centers investor and corporate perspectives over worker concerns.',
  },
  {
    name: 'individualist_vs_systemic',
    score: 8,
    label: 'Individualist',
    explanation: 'Frames issues as personal failures rather than systemic problems.',
  },
  {
    name: 'nationalist_vs_internationalist',
    score: 4,
    label: 'Internationalist',
    explanation: 'Takes a global perspective on economic issues.',
  },
];

export const Default: Story = {
  args: {
    axes: defaultAxes,
  },
};

export const ProLabor: Story = {
  args: {
    axes: [
      {
        name: 'pro_capital_vs_pro_labor',
        score: 2,
        label: 'Pro-labor',
        explanation: 'Article centers worker perspectives and labor organizing.',
      },
      {
        name: 'individualist_vs_systemic',
        score: 3,
        label: 'Systemic',
        explanation: 'Addresses structural causes of economic issues.',
      },
      {
        name: 'nationalist_vs_internationalist',
        score: 6,
        label: 'Nationalist',
        explanation: 'Focuses on national interests over global cooperation.',
      },
    ],
  },
};
