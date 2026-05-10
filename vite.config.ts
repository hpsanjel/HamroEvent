import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindVite from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    tailwindVite(), 
    TanStackRouterVite(), 
    react(), 
    tsconfigPaths(),
    visualizer({ 
      filename: "dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          vendor: ['react', 'react-dom'],
          router: ['@tanstack/react-router', '@tanstack/react-start'],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
          utils: ['lucide-react', 'clsx', 'tailwind-merge', 'date-fns'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          qr: ['qrcode', 'qrcode.react', 'html5-qrcode'],
          pdf: ['jspdf'],
          charts: ['recharts'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
