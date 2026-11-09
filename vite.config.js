import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { COMPANION_ANIMATION_IDS, normalizeCompanionAnimation } from './src/companion-animation-data.js';
import { ENEMY_ANIMATION_IDS, normalizeEnemyAnimation } from './src/enemy-animation-data.js';
import { normalizeJokerSeated } from './src/joker-seated-data.js';
import { BOSS_ANIMATION_IDS, normalizeBossAnimation } from './src/boss-animation-data.js';
import { normalizeFrontierNPCAtlas } from './src/frontier-characters.js';
import { normalizeFrontierEnemyAtlas } from './src/frontier-enemies.js';
import { normalizeMakoDirections } from './src/frontier-vehicles.js';
import { normalizeHorizonNPCAtlas } from './src/horizon-characters.js';
import { normalizeHorizonEnemyAtlas } from './src/horizon-enemies.js';
import { normalizeHorizonFleetAtlas } from './src/horizon-fleet.js';
import { normalizeHorizonFaunaAtlas } from './src/horizon-fauna.js';

const femaleAnimation = JSON.parse(readFileSync(new URL('./public/assets/shepard-female-animation.json', import.meta.url), 'utf8'));
const maleAnimation = JSON.parse(readFileSync(new URL('./public/assets/shepard-male-animation.json', import.meta.url), 'utf8'));
const companionAnimations = COMPANION_ANIMATION_IDS.map(key => {
  const raw = JSON.parse(readFileSync(new URL(`./public/assets/companion-${key}-animation.json`, import.meta.url), 'utf8'));
  const animation = normalizeCompanionAnimation(key, raw);
  if (!animation) throw new Error(`Invalid ME1 companion animation metadata: ${key}`);
  return animation;
});
// Include every explicitly registered ME1 family, including organic enemies;
// Electron keeps the same local metadata without a runtime JSON fetch.
const enemyAnimations = ENEMY_ANIMATION_IDS.map(key => {
  const raw = JSON.parse(readFileSync(new URL(`./public/assets/enemy-${key}-animation.json`, import.meta.url), 'utf8'));
  const animation = normalizeEnemyAnimation(key, raw);
  if (!animation) throw new Error(`Invalid ME1 enemy animation metadata: ${key}`);
  return animation;
});
const jokerSeated = normalizeJokerSeated(JSON.parse(readFileSync(new URL('./public/assets/joker-seated.json', import.meta.url), 'utf8')));
if (!jokerSeated) throw new Error('Invalid ME1 Joker seated metadata');
const bossAnimations = Object.fromEntries(BOSS_ANIMATION_IDS.map(key => {
  const raw = JSON.parse(readFileSync(new URL(`./public/assets/boss-${key}-animation.json`, import.meta.url), 'utf8'));
  const animation = normalizeBossAnimation(key, raw);
  if (!animation) throw new Error(`Invalid ME1 boss animation metadata: ${key}`);
  return [key, animation];
}));
const localAtlas = (file, normalize) => {
  const atlas = normalize(JSON.parse(readFileSync(new URL(`./public/assets/${file}`, import.meta.url), 'utf8')));
  if (!atlas) throw new Error(`Invalid ME1 local atlas metadata: ${file}`);
  return atlas;
};
const frontierNPCAtlas = localAtlas('frontier-npcs.json', normalizeFrontierNPCAtlas);
const frontierEnemyAtlas = localAtlas('frontier-enemies.json', normalizeFrontierEnemyAtlas);
const makoDirections = localAtlas('vehicle-mako-directions.json', normalizeMakoDirections);
const horizonNPCAtlas = localAtlas('horizon-npcs.json', normalizeHorizonNPCAtlas);
const horizonEnemyAtlas = localAtlas('horizon-enemies.json', normalizeHorizonEnemyAtlas);
const horizonFleetAtlases = Object.fromEntries(['me1', 'later'].map(family => [family, localAtlas(`horizon-fleet-${family}.json`, raw => normalizeHorizonFleetAtlas(family, raw))]));
const horizonFaunaAtlas = localAtlas('horizon-fauna.json', normalizeHorizonFaunaAtlas);
export default defineConfig({
  base: './',
  define: { __RELAY_FEMSHEP_ANIMATION__: JSON.stringify(femaleAnimation), __RELAY_MALESHEP_ANIMATION__: JSON.stringify(maleAnimation),
    __RELAY_COMPANION_ANIMATIONS__: JSON.stringify(companionAnimations),
    __RELAY_ENEMY_ANIMATIONS__: JSON.stringify(enemyAnimations), __RELAY_JOKER_SEATED__: JSON.stringify(jokerSeated),
    __RELAY_BOSS_ANIMATIONS__: JSON.stringify(bossAnimations),
    __RELAY_FRONTIER_NPC_ATLAS__: JSON.stringify(frontierNPCAtlas),
    __RELAY_FRONTIER_ENEMY_ATLAS__: JSON.stringify(frontierEnemyAtlas),
    __RELAY_MAKO_DIRECTIONS__: JSON.stringify(makoDirections),
    __RELAY_HORIZON_NPC_ATLAS__: JSON.stringify(horizonNPCAtlas),
    __RELAY_HORIZON_ENEMY_ATLAS__: JSON.stringify(horizonEnemyAtlas),
    __RELAY_HORIZON_FLEET_ATLASES__: JSON.stringify(horizonFleetAtlases),
    __RELAY_HORIZON_FAUNA_ATLAS__: JSON.stringify(horizonFaunaAtlas) },
  build: { target: 'es2022', rollupOptions: { output: { manualChunks: { three: ['three'] } } } },
  server: { port: 4173, hmr: process.env.RELAY_QA === '1' ? false : undefined },
});
