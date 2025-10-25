import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginJSDoc from 'eslint-plugin-jsdoc';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import unusedImports from 'eslint-plugin-unused-imports';
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
  ...tseslint.config(...tseslint.configs.recommended, {
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
      'unused-imports': unusedImports,
    },
    rules: {
      ...baseRules,
      ...eslintPluginJSDoc.configs.recommended.rules,
      ...jsdocRules,
      // Relax JSDoc rules for TS files
      'jsdoc/require-returns-type': 'off',
      'jsdoc/require-param-type': 'off',
      // Turn off base rule and let TypeScript ESLint handle it
      'no-unused-vars': 'off',
      // Unused imports/vars
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'unused-imports/no-unused-imports': 'error',
        'unused-imports/no-unused-vars': [
          'warn',
          {
            vars: 'all',
            varsIgnorePattern: '^_',
            args: 'after-used',
            argsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
          },
        ],
      // Relax strict rules for existing codebase
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
    },
  }),

  // Test files (general)
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

  // Type test files (special handling for typeof usage)
  {
    files: ['**/*.test-d.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        expectTypeOf: 'readonly',
        assertType: 'readonly',
        test: 'readonly',
      },
    },
    rules: {
      'import/no-default-export': 'off',
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',
      // Completely disable unused var checks for type test files
      // Variables are often created just to extract their types with typeof
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-vars': 'off',
    },
  },

  // Type definition files (generic type parameters may appear unused)
  {
    files: ['**/types.ts'],
    rules: {
      // Disable unused var checks for type definition files
      // Generic type parameters and type aliases may not be directly "used"
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-vars': 'off',
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
