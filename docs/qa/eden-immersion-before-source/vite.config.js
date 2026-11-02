import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { COMPANION_ANIMATION_IDS, normalizeCompanionAnimation } from './src/companion-animation-data.js';
import { ENEMY_ANIMATION_IDS, normalizeEnemyAnimation } from './src/enemy-animation-data.js';
import { normalizeJokerSeated } from './src/joker-seated-data.js';

const femaleAnimation = JSON.parse(readFileSync(new URL('./public/assets/shepard-female-animation.json', import.meta.url), 'utf8'));
const maleAnimation = JSON.parse(readFileSync(new URL('./public/assets/shepard-male-animation.json', import.meta.url), 'utf8'));
const companionAnimations = COMPANION_ANIMATION_IDS.map(key => {
  const raw = JSON.parse(readFileSync(new URL(`./public/assets/companion-${key}-animation.json`, import.meta.url), 'utf8'));
  const animation = normalizeCompanionAnimation(key, raw);
  if (!animation) throw new Error(`Invalid ME1 companion animation metadata: ${key}`);
  return animation;
});
const enemyAnimations = ENEMY_ANIMATION_IDS.map(key => {
  const raw = JSON.parse(readFileSync(new URL(`./public/assets/enemy-${key}-animation.json`, import.meta.url), 'utf8'));
  const animation = normalizeEnemyAnimation(key, raw);
  if (!animation) throw new Error(`Invalid ME1 enemy animation metadata: ${key}`);
  return animation;
});
const jokerSeated = normalizeJokerSeated(JSON.parse(readFileSync(new URL('./public/assets/joker-seated.json', import.meta.url), 'utf8')));
if (!jokerSeated) throw new Error('Invalid ME1 Joker seated metadata');
export default defineConfig({
  base: './',
  define: { __RELAY_FEMSHEP_ANIMATION__: JSON.stringify(femaleAnimation), __RELAY_MALESHEP_ANIMATION__: JSON.stringify(maleAnimation),
    __RELAY_COMPANION_ANIMATIONS__: JSON.stringify(companionAnimations),
    __RELAY_ENEMY_ANIMATIONS__: JSON.stringify(enemyAnimations), __RELAY_JOKER_SEATED__: JSON.stringify(jokerSeated) },
  build: { target: 'es2022', rollupOptions: { output: { manualChunks: { three: ['three'] } } } },
  server: { port: 4173, hmr: process.env.RELAY_QA === '1' ? false : undefined },
});
