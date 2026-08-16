import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      watch: {
        // Docker Desktop nie zawsze przekazuje zdarzenia systemu plików
        // z bind mounta, dlatego w trybie kontenerowym używamy pollingu.
        usePolling: env.VITE_USE_POLLING === 'true',
        interval: 100,
      },
      hmr: env.VITE_HMR_CLIENT_PORT
        ? { clientPort: Number(env.VITE_HMR_CLIENT_PORT) }
        : undefined,
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://127.0.0.1:8080',
          changeOrigin: true,
        },
      },
    },
  }
})
