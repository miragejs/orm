import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginJSDoc from 'eslint-plugin-jsdoc';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const baseRules = {
  'import/order': [
    'error',
    {
      alphabetize: { order: 'asc', caseInsensitive: true },
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always',
    },
  ],
};

const jsdocRules = {
  'jsdoc/require-jsdoc': [
    'error',
    {
      publicOnly: true,
      require: {
        ArrowFunctionExpression: true,
        ClassDeclaration: true,
        ClassExpression: true,
        FunctionDeclaration: true,
        FunctionExpression: true,
        MethodDefinition: true,
      },
      exemptEmptyConstructors: true,
      contexts: [
        'ExportDefaultDeclaration > FunctionDeclaration',
        'ExportNamedDeclaration > FunctionDeclaration',
        'ExportDefaultDeclaration > ClassDeclaration',
        'ExportNamedDeclaration > ClassDeclaration',
      ],
      checkConstructors: false,
    },
  ],
};

export default defineConfig([
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**'],
  },

  // JS support
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: {
      js,
      import: eslintPluginImport,
      jsdoc: eslintPluginJSDoc,
    },
    rules: {
      ...baseRules,
      ...eslintPluginJSDoc.configs.recommended.rules,
      ...jsdocRules,
    },
    extends: ['js/recommended'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // TS support
  ...tseslint.config({
    files: ['**/*.{ts,mts,cts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: '.',
      },
    },
    plugins: {
      import: eslintPluginImport,
      jsdoc: eslintPluginJSDoc,
    },
    rules: {
      ...baseRules,
      ...eslintPluginJSDoc.configs.recommended.rules,
      ...jsdocRules,
      // Relax JSDoc rules for TS files
      'jsdoc/require-returns-type': 'off',
      'jsdoc/require-param-type': 'off',
    },
  }),

  // Test files
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        afterEach: 'readonly',
        beforeEach: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        it: 'readonly',
        test: 'readonly',
        vi: 'readonly',
      },
    },
    rules: {
      'import/no-default-export': 'off',
      // Relax JSDoc rules for test files
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',
    },
  },

  // Config files
  {
    files: ['*.config.{js,mjs,cjs,ts,mts,cts}'],
    rules: {
      'import/no-default-export': 'off',
      // Relax JSDoc rules for config files
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',
    },
  },

  // Prettier config
  eslintPluginPrettierRecommended,
]);
