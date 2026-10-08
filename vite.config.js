import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const server = env.TRACCAR_SERVER || 'http://localhost:8082';
  // templates API lives on the same origin as Traccar in production
  const templatesApi = env.TEMPLATES_API || server;
  return {
    server: {
      port: 3000,
      proxy: {
        '/api/socket': { target: server.replace(/^http/, 'ws'), ws: true, changeOrigin: true },
        '/api': { target: server, changeOrigin: true },
        '/templates-api': { target: templatesApi, changeOrigin: true },
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
        includeAssets: ['favicon.ico', 'favicon-96x96.png', 'apple-touch-icon.png'],
        workbox: {
          navigateFallbackDenylist: [/^\/api/],
          globPatterns: ['**/*.{js,css,html,woff,woff2,mp3,webp}'],
        },
        manifest: {
          short_name: 'IDGPS',
          name: 'IDGPS GPS Tracking',
          theme_color: '${colorPrimary}',
          icons: [
            {
              src: 'web-app-manifest-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: 'web-app-manifest-512x512.png',
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
