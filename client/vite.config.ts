import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:3010';

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'HisobX — Magazin boshqaruvi',
          short_name: 'HisobX',
          description:
            'Kichik va o‘rta magazinlar uchun savdo, ombor, nasiya va kassa boshqaruvi',
          lang: 'uz',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          theme_color: '#007a55',
          background_color: '#f8fafc',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: '/icons/icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          // MSW faqat dev/test uchun — uni keshlash shart emas.
          globIgnores: ['**/browser-*.js', '**/cookieStore-*.js', '**/handlers-*.js'],
          // API hech qachon keshlanmaydi — ilova faqat online ishlaydi.
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [],
        },
        devOptions: { enabled: false },
      }),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: false,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          // Katta kutubxonalar alohida chunk'ga — birinchi yuklanish yengil bo'ladi.
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return;
            if (/[\\/]recharts[\\/]|[\\/]d3-/.test(id)) return 'vendor-charts';
            if (/[\\/](react|react-dom|react-router)[\\/]/.test(id)) return 'vendor-react';
            if (/[\\/](@tanstack|axios)[\\/]/.test(id)) return 'vendor-query';
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
    },
  };
});
