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
      '@eyewear/shared': path.resolve(__dirname, '../packages/shared/src'),
    },
  },
  build: {
    // Split Virtual Try-On into separate chunk
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Virtual Try-On components - separate chunk
          if (id.includes('/virtual-tryon/')) {
            return 'virtual-try-on';
          }

          // Three.js and 3D libraries - separate chunk
          if (id.includes('three') || id.includes('@react-three')) {
            return 'three';
          }

          // MUI components - vendor chunk
          if (id.includes('@mui') || id.includes('@emotion')) {
            return 'mui';
          }

          // React and router - vendor chunk
          if (id.includes('react') || id.includes('react-router')) {
            return 'react-vendor';
          }

          // API and state management
          if (id.includes('/lib/') || id.includes('/store/')) {
            return 'api-store';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Improve chunk size warning threshold
    chunkSizeWarningLimit: 600,
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
