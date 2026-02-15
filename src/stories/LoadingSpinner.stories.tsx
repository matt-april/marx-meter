import type { Meta, StoryObj } from '@storybook/preact';
import { LoadingSpinner } from '../entrypoints/sidepanel/components/LoadingSpinner';

const meta: Meta<typeof LoadingSpinner> = {
  title: 'Components/LoadingSpinner',
  component: LoadingSpinner,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LoadingSpinner>;

export const Default: Story = {};
