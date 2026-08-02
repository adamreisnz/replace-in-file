import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import globals from 'globals'

export default [
  js.configs.recommended,
  {
    ignores: [
      'node_modules',
      'coverage',
    ],
    plugins: {
      '@stylistic': stylistic,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.builtin,
        ...globals.node,
        ...globals.mocha,
        ...globals.jasmine,
      },
    },
    rules: {
      '@stylistic/indent': ['error', 2, {
        SwitchCase: 1,
      }],
      '@stylistic/quotes': ['error', 'single', {
        allowTemplateLiterals: 'always',
      }],
      '@stylistic/brace-style': ['error', 'stroustrup', {
        allowSingleLine: false,
      }],
      curly: 'error',
      '@stylistic/comma-dangle': ['error', {
        functions: 'never',
        arrays: 'always-multiline',
        objects: 'always-multiline',
      }],
      '@stylistic/space-infix-ops': ['error'],
      '@stylistic/quote-props': ['error', 'as-needed'],
      '@stylistic/object-curly-spacing': ['error', 'never'],
      '@stylistic/space-before-blocks': 'error',
      '@stylistic/keyword-spacing': 'error',
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/eol-last': ['error', 'always'],
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      'no-empty': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      'no-empty-function': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      'no-unused-vars': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      'no-unreachable': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      '@stylistic/no-multiple-empty-lines': ['error', {
        max: 1, maxEOF: 0,
      }],
    },
  },
]
