import { defineConfig } from 'wxt';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  srcDir: 'src',
  manifest: {
    name: 'Marx Meter',
    description: "Decode the news. Who benefits? Now you'll know.",
    version: '0.0.1',
    action: {},
    icons: {
      '16': '/icon/16.png',
      '32': '/icon/32.png',
      '48': '/icon/48.png',
      '128': '/icon/128.png',
    },
  },
  vite: () => ({
    plugins: [preact(), tailwindcss()],
  }),
});
