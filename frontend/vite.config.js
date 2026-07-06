import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        allowedHosts: ['studylabs.cs.colman.ac.il'],
    },
    build: {
        rollupOptions: {
            output: {
                // Split heavy vendor libraries into their own cacheable chunks so a
                // page chunk only pulls what it actually uses and app-code changes
                // don't invalidate the vendor cache.
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-motion': ['framer-motion'],
                    'vendor-charts': ['recharts'],
                    'vendor-markdown': [
                        'react-markdown',
                        'remark-gfm',
                        'remark-math',
                        'rehype-katex',
                        'katex',
                    ],
                },
            },
        },
    },
});
