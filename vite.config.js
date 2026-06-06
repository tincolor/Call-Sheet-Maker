import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [
    preact(),
    viteSingleFile({ removeViteModuleLoader: true }),
  ],
  build: {
    assetsInlineLimit: 100000, // Inline all assets up to 100KB
  },
});
