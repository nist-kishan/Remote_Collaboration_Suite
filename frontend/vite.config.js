import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  // Development server configuration
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        // eslint-disable-next-line no-undef
        target: process.env.VITE_API_BASE_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  
  // Preview server configuration
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false,
  },
  
  // Production build configuration
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    minify: process.env.NODE_ENV === 'production' ? 'terser' : false,
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production',
      },
    },
    // Ensure proper MIME types and module loading
    assetsInlineLimit: 0,
    cssCodeSplit: true,
    // Force proper file extensions
    assetsDir: 'assets',
    // Ensure proper module format
    target: 'es2015',
    modulePreload: {
      polyfill: true,
    },
    rollupOptions: {
      output: {
        // Ensure proper file extensions
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            if (id.includes('react-router-dom')) {
              return 'router';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'ui';
            }
            if (id.includes('@reduxjs/toolkit') || id.includes('react-redux')) {
              return 'state';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query';
            }
            if (id.includes('fabric')) {
              return 'canvas';
            }
            // Default vendor chunk for other node_modules
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  
  // Optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'react-redux',
      '@tanstack/react-query',
      'axios',
      'lucide-react',
      'framer-motion',
    ],
    exclude: ['fabric'], // Exclude fabric to prevent empty chunk issues
  },
  
  // CSS configuration
  css: {
    devSourcemap: process.env.NODE_ENV !== 'production',
  },
})
