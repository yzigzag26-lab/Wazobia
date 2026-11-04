/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

/**
 * WAZOBIA frontend build configuration.
 *
 * Browser-facing configuration is intentionally minimal: only the Supabase URL
 * and anon key may ever be shipped to the client. Privileged credentials
 * (Groq, Gemini, service-role keys, TTS/ASR provider keys) live server-side
 * only and must never appear in this file or in any `VITE_` variable.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      /**
       * The sandboxed preview proxies this server under a generated host. Vite's
       * host check must accept that domain or the preview is served a 403.
       * Only development is affected; production is served by Vercel.
       */
      allowedHosts: ['.e2b.app', '.vercel.app', 'localhost'],

      /**
       * The application API boundary (`/api/v1/*`) is owned by Vercel
       * server-side functions, which do not run under plain `vite dev`.
       * During local development requests are proxied to a separately running
       * backend origin. When VITE_API_ORIGIN is unset the proxy is disabled and
       * the client reports an honest "not connected" state instead of failing
       * silently.
       */
      proxy: env.VITE_API_ORIGIN
        ? {
            '/api': {
              target: env.VITE_API_ORIGIN,
              changeOrigin: true,
            },
          }
        : undefined,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      /*
       * `api/**` is included so the server functions are actually tested. They
       * live outside `src/` and, until this line existed, outside every
       * compilation unit — meaning server behaviour could be wrong while the
       * whole suite stayed green. Server tests do not need jsdom, so each file
       * that targets the API declares `@vitest-environment node` for itself.
       */
      include: ['src/**/*.{test,spec}.{ts,tsx}', 'api/**/*.{test,spec}.{ts,tsx}'],
    },
  }
})
