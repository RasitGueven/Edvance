import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: false,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        include: ['src/lib/**/*.ts', 'src/components/edvance/onboarding/validation.ts'],
        exclude: ['src/lib/supabase/**', 'src/lib/mocks/**'],
      },
    },
  }),
)
