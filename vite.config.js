import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ mode }) => {
  const server = loadEnv(mode, process.cwd(), '').TRACCAR_SERVER || 'http://localhost:8082';
  return {
    server: {
      port: 3000,
      proxy: {
        '/api/socket': { target: server.replace(/^http/, 'ws'), ws: true, changeOrigin: true },
        '/api': { target: server, changeOrigin: true },
      },
    },
    build: {
      outDir: 'build',
      chunkSizeWarningLimit: 1100,
    },
    plugins: [
      svgr(),
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
        workbox: {
          navigateFallbackDenylist: [/^\/api/],
          globPatterns: ['**/*.{js,css,html,woff,woff2,mp3,webp}'],
        },
        manifest: {
          short_name: '${title}',
          name: '${description}',
          theme_color: '${colorPrimary}',
          icons: [
            {
              src: 'pwa-64x64.png',
              sizes: '64x64',
              type: 'image/png',
            },
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
      }),
      viteStaticCopy({
        targets: [
          { src: 'node_modules/@mapbox/mapbox-gl-rtl-text/dist/mapbox-gl-rtl-text.js', dest: '' },
        ],
      }),
    ],
  };
});
