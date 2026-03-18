import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Always use source - Vite handles transpilation efficiently
      // This avoids issues with the built dist not being available during initial dev
      '@eyewear/shared': path.resolve(__dirname, '../packages/shared/src'),
    },
  },
  build: {
    // Simplified chunk splitting to avoid circular dependencies
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Only split out large independent chunks to avoid circular deps
          // Three.js is large and mostly independent
          if (id.includes('three') || id.includes('@react-three') || id.includes('@react-three/drei') || id.includes('@react-three/fiber')) {
            return 'vendor-three';
          }
          // Everything else - let Vite handle default chunking
          // This prevents circular dependencies between vendor chunks
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Improve chunk size warning threshold
    chunkSizeWarningLimit: 1000,
    // Optimize chunk loading
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: [], // Don't exclude anything, let Vite handle it
  },
  // Server configuration
  server: {
    port: 5173,
    host: true,
  },
});
