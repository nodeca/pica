import neostandard from 'neostandard'
import globals from 'globals'

export default [
  ...neostandard({
    env: ['browser', 'node'],
    ignores: [
      'benchmark/implementations/**',
      'demo/**',
      'dist/**'
    ]
  }),

  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2015,
      sourceType: 'commonjs'
    },
    rules: {
      camelcase: 'off',
      'one-var': 'off',
      '@stylistic/no-multiple-empty-lines': 'off',
      '@stylistic/space-infix-ops': 'off'
    }
  },

  {
    files: ['src/**/*.ts', 'test/**/*.{js,mjs}', 'support/**/*.mjs', 'benchmark/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    },
    rules: {
      camelcase: 'off',
      'one-var': 'off',
      '@stylistic/no-multiple-empty-lines': 'off',
      '@stylistic/space-infix-ops': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off'
    }
  },

  {
    files: ['test/**/*.{js,mjs}'],
    languageOptions: {
      globals: globals.mocha
    }
  }
]
