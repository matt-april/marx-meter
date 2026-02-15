import type { StorybookConfig } from '@storybook/preact-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/preact-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};
export default config;
