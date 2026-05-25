import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/lib/behaviorAnalysis.ts',
        'src/lib/utils.ts',
        'src/lib/datetime.ts',
        'src/lib/taskLabels.ts',
        'src/lib/render/taskQuestionParser.ts',
        'src/lib/taxonomy/validate.ts',
        'src/components/edvance/onboarding/validation.ts',
      ],
      exclude: ['src/lib/supabase/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
