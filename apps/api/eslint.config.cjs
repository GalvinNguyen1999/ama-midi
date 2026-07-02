const js = require('@eslint/js')
const tseslint = require('typescript-eslint')
const importPlugin = require('eslint-plugin-import')
const prettier = require('eslint-config-prettier')

module.exports = [
  { ignores: ['eslint.config.*', 'jest.config.*', 'dist/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  prettier,

  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {

        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      'import/order': [
        'error',
        { 'newlines-between': 'always', alphabetize: { order: 'asc' } },
      ],

      'import/no-unresolved': 'off',
      'import/named': 'off',
      'import/extensions': 'off',
    },
  },
]
