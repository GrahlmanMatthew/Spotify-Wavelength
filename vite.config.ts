import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/spotify-listening-history-graph/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
}))
