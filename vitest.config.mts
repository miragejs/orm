import { resolve } from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@src': resolve(__dirname, './lib/src'),
    },
  },
  test: {
    coverage: {
      reporter: ['text', 'html'],
    },
    environment: 'node',
    globals: true,
    include: ['lib/**/*.test.ts'],
    typecheck: {
      ignoreSourceErrors: true,
      include: ['**/*.test-d.ts'],
      only: true,
    },
  },
});
