import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

const browser = {
  enabled: true,
  provider: playwright(),
  headless: true,
  instances: [
    { browser: 'chromium' }
  ]
}

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          globals: true,
          environment: 'node',
          include: ['test/unit/**/*.test.js']
        }
      },
      {
        test: {
          name: 'browser',
          globals: true,
          include: ['test/browser/**/*.test.mjs'],
          browser
        }
      },
      {
        test: {
          name: 'dist',
          globals: true,
          include: ['test/dist/**/*.test.mjs'],
          browser
        }
      }
    ]
  }
})
