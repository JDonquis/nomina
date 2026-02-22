import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate", // Better for fonts
            options: {
              cacheName: "google-fonts-css",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
            },
          },
          {
            // Cache build assets and images under /assets/ with a long TTL for repeat visits
            urlPattern: /\/assets\/.*$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "assets-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      manifest: {
        name: "Nómina - Sistema de Laboratorio",
        short_name: "Nómina",
        description: "Sistema de gestión de laboratorio médico",
        theme_color: "#011140",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/pwa-72x72.png", sizes: "72x72", type: "image/png" },
          { src: "/pwa-96x96.png", sizes: "96x96", type: "image/png" },
          { src: "/pwa-128x128.png", sizes: "128x128", type: "image/png" },
          { src: "/pwa-144x144.png", sizes: "144x144", type: "image/png" },
          { src: "/pwa-152x152.png", sizes: "152x152", type: "image/png" },
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-384x384.png", sizes: "384x384", type: "image/png" },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        screenshots: [
          {
            src: "/screenshot.webp",
            sizes: "1359x647",
            type: "image/webp",
            form_factor: "wide",
          },
          {
            src: "/narrowScreenshot.webp",
            sizes: "1359x647",
            type: "image/webp",
            form_factor: "narrow",
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          mui: ["@mui/material", "@mui/icons-material"],
          charts: ["@nivo/bar", "@nivo/pie", "@nivo/core"],
          utils: ["axios", "lodash.debounce"],
        },
      },
    },
    minify: "esbuild",
    target: "es2015",
  },
  optimizeDeps: {
    include: ["@mui/material", "@nivo/bar", "@nivo/pie"],
  },
});
