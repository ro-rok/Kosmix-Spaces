import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    server: {
      host: "0.0.0.0", // Listen on all interfaces (accessible via 192.168.1.18:8080)
      port: 8080,
      proxy: {
        // Proxy /sitemap.xml to backend before React Router can intercept it
        "/sitemap.xml": {
          target: env.VITE_API_BASE_URL || "http://localhost:8000",
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              // Ensure proper headers for XML content
              proxyReq.setHeader("Accept", "application/xml, text/xml, */*");
            });
          },
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Ensure public assets are properly copied
    publicDir: 'public',
    build: {
      // Optimize bundle splitting for better performance
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
            'query-vendor': ['@tanstack/react-query'],
            
            // Animation libraries chunk
            'animation-vendor': ['lenis', 'framer-motion', 'gsap'],
            
            // Performance chunk
            'performance': ['./src/lib/performance', './src/lib/image-compression']
          }
        }
      },
      // Optimize chunk size warnings
      chunkSizeWarningLimit: 1000,
      // Enable source maps in development
      sourcemap: mode === 'development',
      // Minify in production
      minify: mode === 'production' ? 'esbuild' : false,
      // Target modern browsers for better performance
      target: 'es2020'
    },
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        'sonner',
        'lucide-react',
        // Animation libraries
        'lenis',
        'framer-motion',
        'gsap'
      ],
      exclude: ['@vite/client', '@vite/env']
    },
    // Performance optimizations
    esbuild: {
      // Remove console logs in production
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    }
  };
});
