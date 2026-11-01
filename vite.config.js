import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { COMPANION_ANIMATION_IDS, normalizeCompanionAnimation } from './src/companion-animation-data.js';

const femaleAnimation = JSON.parse(readFileSync(new URL('./public/assets/shepard-female-animation.json', import.meta.url), 'utf8'));
const maleAnimation = JSON.parse(readFileSync(new URL('./public/assets/shepard-male-animation.json', import.meta.url), 'utf8'));
const companionAnimations = COMPANION_ANIMATION_IDS.map(key => {
  const raw = JSON.parse(readFileSync(new URL(`./public/assets/companion-${key}-animation.json`, import.meta.url), 'utf8'));
  const animation = normalizeCompanionAnimation(key, raw);
  if (!animation) throw new Error(`Invalid ME1 companion animation metadata: ${key}`);
  return animation;
});
export default defineConfig({
  base: './',
  define: { __RELAY_FEMSHEP_ANIMATION__: JSON.stringify(femaleAnimation), __RELAY_MALESHEP_ANIMATION__: JSON.stringify(maleAnimation),
    __RELAY_COMPANION_ANIMATIONS__: JSON.stringify(companionAnimations) },
  build: { target: 'es2022', rollupOptions: { output: { manualChunks: { three: ['three'] } } } },
  server: { port: 4173, hmr: process.env.RELAY_QA === '1' ? false : undefined },
});
