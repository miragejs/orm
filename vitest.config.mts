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
        'lib/dist/**',
        'examples/**',
        'node_modules/**',
      ],

      // Coverage thresholds - fail if coverage drops below these
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },

      // Clean coverage directory before running tests
      clean: true,

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
