import type { Meta, StoryObj } from '@storybook/preact';
import { FramingChoices } from '../entrypoints/sidepanel/components/FramingChoices';

const meta: Meta<typeof FramingChoices> = {
  title: 'Components/FramingChoices',
  component: FramingChoices,
  tags: ['autodocs'],
  argTypes: {
    choices: { control: 'object' },
  },
};

export default meta;
type Story = StoryObj<typeof FramingChoices>;

export const Default: Story = {
  args: {
    choices: [
      {
        type: 'euphemism' as const,
        quote: 'The company announced a difficult decision to optimize its workforce',
        explanation:
          'Using "optimize" instead of "lay off" frames job losses as a positive improvement.',
      },
      {
        type: 'source_bias' as const,
        quote: 'According to CEO John Smith...',
        explanation: 'Only corporate sources are quoted, no worker perspectives included.',
      },
    ],
  },
};

export const MultipleChoices: Story = {
  args: {
    choices: [
      {
        type: 'euphemism' as const,
        quote: 'The restructuring will improve operational efficiency',
        explanation: 'Restructuring is used instead of layoffs.',
      },
      {
        type: 'passive_voice' as const,
        quote: 'Positions were eliminated due to market conditions',
        explanation: 'Passive voice obscures who made the decision.',
      },
      {
        type: 'omission' as const,
        quote: 'The company announced changes',
        explanation: 'No mention of how many workers will lose their jobs.',
      },
    ],
  },
};
