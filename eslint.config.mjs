import neostandard from 'neostandard'

export default [
  ...neostandard({
    env: ['browser', 'node'],
    ts: true,
    ignores: [
      'benchmark/implementations/**',
      'demo/**',
      'dist/**'
    ]
  }),

  {
    rules: {
      camelcase: 'off',
      'one-var': 'off',
      '@stylistic/space-infix-ops': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off'
    }
  }
]
