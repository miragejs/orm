import path from 'path';

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@test': path.resolve(__dirname, './test'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    pool: 'threads',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
    deps: {
      optimizer: {
        web: { enabled: true },
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/**/index.ts',
        'node_modules/**',
      ],
      reportsDirectory: './coverage',
    },
  },
});
