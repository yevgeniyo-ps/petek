import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  envDir: path.resolve(__dirname, '..'),
  plugins: [
    // Redirect shared contexts' `./AuthContext` import to extension's auth bridge
    {
      name: 'redirect-auth-context',
      enforce: 'pre' as const,
      resolveId(source, importer) {
        if (
          (source === './AuthContext' || source === './AuthContext.tsx') &&
          importer &&
          importer.includes('context')
        ) {
          return path.resolve(__dirname, 'src/auth-bridge.ts');
        }
      },
    },
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js'],
          'md-editor': ['@uiw/react-md-editor'],
        },
      },
    },
  },
});
