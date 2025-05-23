import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['lib/src/index.ts'],
  format: ['esm', 'cjs'],
  minify: true,
  outDir: 'lib/dist',
  sourcemap: true,
  target: 'esnext',
});
