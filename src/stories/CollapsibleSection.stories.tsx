import type { Meta, StoryObj } from '@storybook/preact';
import { CollapsibleSection } from '../entrypoints/sidepanel/components/CollapsibleSection';

const meta: Meta<typeof CollapsibleSection> = {
  title: 'Components/CollapsibleSection',
  component: CollapsibleSection,
  tags: ['autodocs'],
  argTypes: {
    id: { control: 'text' },
    title: { control: 'text' },
    defaultExpanded: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof CollapsibleSection>;

export const Default: Story = {
  args: {
    id: 'test-section',
    title: 'Test Section',
    defaultExpanded: false,
    children: 'This is the collapsible content that can be hidden or shown.',
  },
};

export const Expanded: Story = {
  args: {
    id: 'expanded-section',
    title: 'Expanded Section',
    defaultExpanded: true,
    children: 'This section is expanded by default.',
  },
};
