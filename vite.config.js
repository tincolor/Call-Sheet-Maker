import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [
    viteSingleFile({ removeViteModuleLoader: true }),
  ],
  build: {
    assetsInlineLimit: 100000, // Inline all assets up to 100KB
  },
});
