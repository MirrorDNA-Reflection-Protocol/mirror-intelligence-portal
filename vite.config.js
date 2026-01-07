import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 8085,
    host: true,
    allowedHosts: ['brief.activemirror.ai', 'localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8083',
        changeOrigin: true
      }
    }
  }
})
