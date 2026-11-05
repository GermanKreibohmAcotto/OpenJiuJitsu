/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

// Served from the domain root by default; set BASE_PATH (e.g. `/OpenJiuJitsu/`) for a subpath such as a GitHub Pages project site.
const baseSegments = (process.env.BASE_PATH ?? '').replace(/^\/+|\/+$/g, '');
const base = baseSegments ? `/${baseSegments}/` : '/';
const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default defineConfig({
  base,
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'OpenJiuJitsu',
        short_name: 'OpenJiuJitsu',
        description: 'Local-first BJJ technique library, training planner and journal.',
        theme_color: '#0b0d10',
        background_color: '#0b0d10',
        display: 'standalone',
        start_url: `${base}app/`,
        scope: base,
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      // The landing (`<base>`) and the app (`<base>app/`) are separate pages: only app navigations fall back to the app shell.
      workbox: { navigateFallback: `${base}app/index.html`, navigateFallbackAllowlist: [new RegExp(`^${escapedBase}app/`)] },
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        landing: fileURLToPath(new URL('./index.html', import.meta.url)),
        app: fileURLToPath(new URL('./app/index.html', import.meta.url)),
      },
    },
  },
  // Listen on all interfaces so the app is reachable from other devices on the LAN.
  server: { host: true },
  preview: { host: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // jsdom UI tests with user-event can exceed the 5 s default when the suite runs in parallel.
    testTimeout: 15000,
  },
});
