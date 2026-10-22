import { defineConfig } from 'vite';
export default defineConfig({ base: './', build: { target: 'es2022', rollupOptions:{output:{manualChunks:{three:['three']}}} }, server: { port: 4173, hmr: process.env.RELAY_QA === '1' ? false : undefined } });
