import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

const femaleAnimation = JSON.parse(readFileSync(new URL('./public/assets/shepard-female-animation.json', import.meta.url), 'utf8'));
const maleAnimation = JSON.parse(readFileSync(new URL('./public/assets/shepard-male-animation.json', import.meta.url), 'utf8'));
export default defineConfig({
  base: './',
  define: { __RELAY_FEMSHEP_ANIMATION__: JSON.stringify(femaleAnimation), __RELAY_MALESHEP_ANIMATION__: JSON.stringify(maleAnimation) },
  build: { target: 'es2022', rollupOptions: { output: { manualChunks: { three: ['three'] } } } },
  server: { port: 4173, hmr: process.env.RELAY_QA === '1' ? false : undefined },
});
