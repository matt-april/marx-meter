import type { Meta, StoryObj } from '@storybook/preact';
import { WhoBenefits } from '../entrypoints/sidepanel/components/WhoBenefits';

const meta: Meta<typeof WhoBenefits> = {
  title: 'Components/WhoBenefits',
  component: WhoBenefits,
  tags: ['autodocs'],
  argTypes: {
    benefits: { control: 'object' },
    absent: { control: 'object' },
  },
};

export default meta;
type Story = StoryObj<typeof WhoBenefits>;

export const Default: Story = {
  args: {
    benefits: ['Tech company executives', 'Shareholders', 'Investment firms'],
    absent: ['Frontline workers', 'Labor unions', 'Local communities'],
  },
};

export const Empty: Story = {
  args: {
    benefits: [],
    absent: [],
  },
};
