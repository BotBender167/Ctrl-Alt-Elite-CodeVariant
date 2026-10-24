import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// GitHub Pages serves the site under the repository name, so production builds use that base path.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Ctrl-Alt-Elite-CodeVariant/' : '/',
  plugins: [react(), tailwindcss()],
  test: { environment: 'node' },
}))
