import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'coverage',
      'playwright-report',
      'test-results',
      // orval generatsiyasi — qo'lda tahrirlanmaydi.
      'src/lib/api/generated',
      // MSW o'zi yaratadigan service worker.
      'public/mockServiceWorker.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,

      // `any` taqiqlangan (4-bo'lim, 2-qoida).
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // shadcn/ui komponentlari tashqaridan keladi va yangilanib turadi —
    // ular ustida o'z uslub qoidalarimizni majburlamaymiz.
    files: ['src/components/ui/**/*.tsx'],
    rules: {
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
  {
    // Konfiguratsiya, skriptlar va e2e — Node muhiti, tipli qoidalarsiz.
    files: ['*.config.{js,ts}', 'eslint.config.js', 'scripts/**/*.mjs', 'e2e/**/*.ts'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      globals: { ...globals.node, fetch: 'readonly' },
    },
  },
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**/*.ts'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  prettier,
);
