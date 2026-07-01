import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'data/exercises.min.json'],
      manifest: {
        name: 'Workout',
        short_name: 'Workout',
        description: 'Home & gym workout tracker',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f1f2f4',
        theme_color: '#f1f2f4',
        icons: [
          { src: 'icons/192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          {
            // Exercise frames (public-domain free-exercise-db via jsDelivr) —
            // cache on first view so sessions work offline.
            urlPattern:
              /^https:\/\/cdn\.jsdelivr\.net\/gh\/yuhonas\/free-exercise-db.*\.(jpg|jpeg|png)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'exercise-images',
              expiration: { maxEntries: 2000, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Discover card photography from the image CDN.
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'discover-images',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
