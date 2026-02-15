import type { Meta, StoryObj } from '@storybook/preact';
import { QuickTake } from '../entrypoints/sidepanel/components/QuickTake';

const meta: Meta<typeof QuickTake> = {
  title: 'Components/QuickTake',
  component: QuickTake,
  tags: ['autodocs'],
  argTypes: {
    text: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof QuickTake>;

export const Default: Story = {
  args: {
    text: 'This article frames mass layoffs as a positive "restructuring" that will benefit shareholders, while centering investor reaction and analyst commentary.',
  },
};

export const Short: Story = {
  args: {
    text: 'Quick summary here.',
  },
};

export const Long: Story = {
  args: {
    text: 'This is a much longer quick take that goes into significant detail about the framing choices in the article. It covers multiple angles and provides substantial context for the reader to understand what this article is really about.',
  },
};
