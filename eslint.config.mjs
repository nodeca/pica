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
      camelcase: 'off'
    }
  },

  {
    files: ['lib/pica_main.js', 'test/**/*.js', 'benchmark/**/*.js'],
    languageOptions: {
      ecmaVersion: 2018
    }
  },

  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: globals.mocha
    }
  }
]
