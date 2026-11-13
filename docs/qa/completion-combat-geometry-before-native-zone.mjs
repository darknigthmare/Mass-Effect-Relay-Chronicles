// Native scene geometry only: no WebGL, DOM, texture requests or forced actors.
// Actual zone builders populate the same colliders used by WorldView in play.
import * as THREE from 'three';
import { WorldView } from '../src/world.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { getLevelLayout } from '../src/level-layout-data.js';
import { initialCustomization } from '../src/customization.js';
import { buildFrontierScene } from '../src/frontier-scene.js';
import { buildHorizonScene } from '../src/horizon-scene.js';

export function createCombatGeometry(zoneId) {
  const world = Object.create(WorldView.prototype); let seed = 2183;
  Object.assign(world, { zoneId, zone: WORLD_ZONES[zoneId], levelLayout: getLevelLayout(zoneId), player: { ...WORLD_ZONES[zoneId].spawn },
    mode: 'explore', time: 0, keys: new Set(), trail: [], commanderAppearance: 'male', commanderCustomization: initialCustomization(), storyContext: null,
    scene: new THREE.Scene(), stage: new THREE.Group(), characters: new THREE.Group(), particles: new THREE.Group(), actors: [], ambientActors: [], battleActors: new Map(),
    spriteCache: new Map(), textureCache: new Map(), materialCache: new Map(), customizationTextures: new Map(), characterAnimations: {}, colliders: [], effects: [], animations: [],
    atlases: Object.fromEntries(['crew', 'enemy', 'boss', 'npc'].map(key => [key, new THREE.Texture({ width: 400, height: 400 })])),
    assetErrors: [], operationPois: [], poiViews: [], combatOccluders: [], cleared: new Set(), camera: new THREE.OrthographicCamera(-24, 24, 15, -15, .1, 500),
    cameraOffset: new THREE.Vector3(23, 29, 27), cameraTarget: new THREE.Vector3(), renderer: { render() {} },
    rand() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; },
    getNearby() { return null; }, _sign() {}, _propSprite() {}, _vehicleSprite() {}, _makeMarkers() {} });
  world.scene.add(world.stage, world.characters, world.particles);
  world._texturedMaterial = color => world._material(color);
  world._edenTerrainMaterial = (kind, color) => world._material(color || 0x556655);
  if (world.levelLayout?.renderer === 'horizon') buildHorizonScene(world, world.levelLayout);
  else if (world.levelLayout?.renderer === 'frontier') buildFrontierScene(world, world.levelLayout);
  else if (zoneId === 'eden-prime') world._eden();
  else world._citadel(true);
  world._installTacticalCover();
  world._resetTrail(); return world;
}
