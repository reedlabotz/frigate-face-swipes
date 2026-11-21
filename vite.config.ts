import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'custom_components/frigate_face_swipes/frontend',
    emptyOutDir: false,
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'frigate-face-swipes-card.js',
    },
    minify: 'esbuild',
  },
});
