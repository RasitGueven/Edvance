import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    reporters: ['verbose'],
    environmentMatchGlobs: [
      // Pure lib tests run in node for speed; React component/context tests need jsdom
      ['src/lib/**/*.test.ts', 'node'],
      ['src/context/**/*.test.tsx', 'jsdom'],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**/*.ts', 'src/context/**/*.tsx'],
      exclude: ['src/lib/supabase/**', 'src/lib/mocks/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
