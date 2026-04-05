import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import compression from 'vite-plugin-compression'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:8000/api'
  
  return {
  base: '/',
  plugins: [
    react({
      // Babel-based fast refresh — better HMR for hooks
      babel: {
        plugins: [],
      },
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
            urlPattern: new RegExp(`^${apiBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
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
        name: 'Finance Dashboard',
        short_name: 'Finance',
        description: 'Secure Financial Management Platform',
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
        target: 'http://localhost:8000',
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
    include: [
      'react', 'react-dom', 'react-router-dom',
      'axios', '@tanstack/react-query', 'zustand',
      'react-hook-form', '@hookform/resolvers/zod', 'zod',
      'lucide-react', 'clsx', 'tailwind-merge', 'react-hot-toast',
      'date-fns',
    ],
    exclude: ['recharts', 'framer-motion'],
  },
  build: {
    target: 'es2022',
    minify: 'esbuild',
    cssMinify: true,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',

        manualChunks(id) {
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }

          if (id.includes('node_modules/react-router-dom') ||
              id.includes('node_modules/react-router/') ||
              id.includes('node_modules/@remix-run/')) {
            return 'vendor-router';
          }

          if (id.includes('node_modules/@tanstack/react-query') ||
              id.includes('node_modules/zustand') ||
              id.includes('node_modules/axios')) {
            return 'vendor-data';
          }

          if (id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory-')) {
            return 'vendor-charts';
          }

          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }

          if (id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/@hookform/') ||
              id.includes('node_modules/zod')) {
            return 'vendor-forms';
          }

          if (id.includes('node_modules/date-fns')) {
            return 'vendor-date';
          }
        },
      },
    },
  }
})
