import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import compression from 'vite-plugin-compression'
import checker from 'vite-plugin-checker'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      // Babel-based fast refresh — better HMR for hooks
      babel: {
        plugins: [],
      },
    }),
    // TypeScript checking during development
    checker({
      typescript: true,
      // Disable ESLint for now due to config issues
      // eslint: {
      //   lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
      // },
    }),
    // Only run in analysis mode: `ANALYZE=true npm run build`
    process.env.ANALYZE && visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/bundle-report.html',
    }),
    // Brotli (modern browsers, ~20% smaller than gzip)
    compression({ algorithm: 'brotliCompress', ext: '.br', threshold: 1024 }),
    // Gzip fallback (older browsers/CDNs)
    compression({ algorithm: 'gzip', ext: '.gz', threshold: 1024 }),
    // PWA configuration
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.zorvyn\.com\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Zorvyn Financial Platform',
        short_name: 'Zorvyn',
        description: 'Secure, Compliant & Intelligent Financial Systems',
        theme_color: '#0A0F1E',
        background_color: '#0A0F1E',
        display: 'standalone',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
    hmr: {
      overlay: true,
    },
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  optimizeDeps: {
    // Remove force: true - causes unnecessary re-bundling every cold start
    include: [
      'react', 'react-dom', 'react-router-dom',
      'axios', '@tanstack/react-query', 'zustand',
      'react-hook-form', '@hookform/resolvers/zod', 'zod',
      'lucide-react', 'clsx', 'tailwind-merge', 'react-hot-toast',
      'date-fns',
    ],
    // Large libs — let Vite handle lazily (they're in async chunks anyway)
    exclude: ['recharts', 'framer-motion'],
  },
  build: {
    target: 'es2022',
    minify: 'esbuild',
    cssMinify: true,
    cssCodeSplit: true,         // Each chunk gets its own CSS — only load what the page needs
    assetsInlineLimit: 4096,    // Inline assets < 4KB as base64 (avoids HTTP requests)
    sourcemap: false,           // No sourcemaps in production
    reportCompressedSize: false,  // Speeds up build (gzip stats slow it down)
    chunkSizeWarningLimit: 400,   // Warn at 400KB chunks
    rollupOptions: {
      output: {
        // Content-hash filenames for long-term caching
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',

        manualChunks(id) {
          // React core — cached forever, almost never changes
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }

          // Router
          if (id.includes('node_modules/react-router-dom') ||
              id.includes('node_modules/react-router/') ||
              id.includes('node_modules/@remix-run/')) {
            return 'vendor-router';
          }

          // Data fetching & state
          if (id.includes('node_modules/@tanstack/react-query') ||
              id.includes('node_modules/zustand') ||
              id.includes('node_modules/axios')) {
            return 'vendor-data';
          }

          // Charts — only ANALYST/ADMIN ever see these
          if (id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory-')) {
            return 'vendor-charts';
          }

          // Animations — landing page only
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }

          // Forms
          if (id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/@hookform/') ||
              id.includes('node_modules/zod')) {
            return 'vendor-forms';
          }

          // Date utilities
          if (id.includes('node_modules/date-fns')) {
            return 'vendor-date';
          }
        },
      },
    },
  },
  // Remove custom cacheDir - let Vite use node_modules/.vite
})
