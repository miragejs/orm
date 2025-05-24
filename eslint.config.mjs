import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import eslintPluginImport from 'eslint-plugin-import';
import globals from "globals";
import tseslint from "typescript-eslint";

const rules = {
  'import/order': [
    'error',
    {
      alphabetize: { order: 'asc', caseInsensitive: true },
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always',
    },
  ],
  ...eslintConfigPrettier.rules,
};

export default defineConfig([
  {
    ignores: ['**/node_modules/**', '**/lib/dist/**'],
  },

  // JS support
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { js, import: eslintPluginImport },
    rules,
    extends: ['js/recommended'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // TS support 
  ...tseslint.config(
    {
      files: ['**/*.{ts,mts,cts}'],
      languageOptions: {
        globals: {
          ...globals.browser,
          ...globals.node,
        },
        parser: tseslint.parser,
        parserOptions: {
          project: ['./tsconfig.json'],
        },
      },
      plugins: {
        import: eslintPluginImport,
      },
      rules,
    },
  ),

  // Vitest globals
  {
    files: ['**/*.test.ts'],
    languageOptions: {
      globals: {
        afterEach: 'readonly',
        beforeEach: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        it: 'readonly',
      },
    },
  },
]);

