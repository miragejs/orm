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
      // Provider - v8 is fast and works well for most cases
      provider: 'v8',

      // Reporters for different use cases
      reporter: [
        'text', // Console output during development
        'text-summary', // Brief summary
        'html', // Interactive HTML report for local viewing
        'json-summary', // For badges and programmatic access
        'lcov', // For CI/CD integrations (Codecov, Coveralls, etc.)
      ],

      // What to include in coverage
      include: ['lib/src/**/*.ts'],

      // What to exclude from coverage
      exclude: [
        'lib/src/**/*.test.ts',
        'lib/src/**/*.test-d.ts',
        'lib/src/**/__tests__/**',
        'lib/src/**/types.ts', // Type-only files
        'lib/src/**/index.ts', // Re-export files typically don't need coverage
        'node_modules/**',
        'lib/dist/**',
      ],

      // Coverage thresholds - fail if coverage drops below these
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },

      // Clean coverage directory before running tests
      clean: true,

      // Show all files, including those with 0% coverage
      all: true,

      // Output directory
      reportsDirectory: './coverage',
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
