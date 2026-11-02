import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { WorldView } from '../src/world.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { EDEN_LAYOUT, getLevelLayout, isLevelGround } from '../src/level-layout-data.js';
import { findLevelPath } from '../src/world-navigation.js';
import { initialCustomization } from '../src/customization.js';
import { newGame } from '../src/state.js';
import { actorFor, enemiesFor } from '../src/game-data.js';
import { createBattle } from '../src/combat.js';

function fixture({ geometry = true } = {}) {
  let seed = 2166136261;
  for (const c of 'eden-prime') seed = Math.imul(seed ^ c.charCodeAt(0), 16777619) >>> 0;
  const world = Object.create(WorldView.prototype);
  Object.assign(world, {
    zone: WORLD_ZONES['eden-prime'], zoneId: 'eden-prime', levelLayout: EDEN_LAYOUT,
    player: { ...EDEN_LAYOUT.spawn }, mode: 'explore', time: 0, keys: new Set(), trail: [],
    commanderAppearance: 'male', commanderCustomization: initialCustomization(), storyContext: null,
    stage: new THREE.Group(), scene: new THREE.Scene(), characters: new THREE.Group(), particles: new THREE.Group(),
    spriteCache: new Map(), textureCache: new Map(), materialCache: new Map(), customizationTextures: new Map(),
    actors: [], ambientActors: [], battleActors: new Map(), characterAnimations: {}, colliders: [], effects: [], animations: [],
    atlases: { crew: new THREE.Texture({ width: 400, height: 200 }), enemy: new THREE.Texture({ width: 400, height: 200 }) },
    assetErrors: [], operationPois: [], poiViews: [], combatOccluders: [], cleared: new Set(),
    camera: new THREE.OrthographicCamera(-23.2, 23.2, 14.5, -14.5, .1, 500), cameraOffset: new THREE.Vector3(23, 29, 27), cameraTarget: new THREE.Vector3(),
    renderer: { render() {} }, rand() { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; },
    getNearby() { return null; }, _sign() {}, _propSprite() {}, _vehicleSprite() {},
  });
  world.scene.add(world.stage, world.characters, world.particles);
  // Canvas texture loading and labels have separate browser coverage. Geometry,
  // scenery footprints, camera matrices and navigation remain the native code.
  world._edenTerrainMaterial = (kind, color, vertexColors) => {
    const key = `${kind}:${color}:${vertexColors}`;
    if (!world.materialCache.has(key)) world.materialCache.set(key, new THREE.MeshStandardMaterial({ color, vertexColors: !!vertexColors }));
    return world.materialCache.get(key);
  };
  world._texturedMaterial = color => world._material(color);
  if (geometry) world._eden();
  world._resetTrail(); return world;
}

test('every retained Eden objective and return branch has a continuous route through actual authored scenery', () => {
  const world = fixture();
  assert.equal(world.edenSceneMetrics.rooms, 5); assert.equal(world.edenSceneMetrics.paths, 3);
  assert.equal(world._walkable(world.player.x, world.player.z), true);
  for (const goal of [...world.zone.pois, ...EDEN_LAYOUT.paths[2].points.map(([x, z]) => ({ x, z }))]) {
    const path = world._pathTo(goal); assert.ok(path?.length, `Missing route to${goal.id || JSON.stringify(goal)}`);
    let previous = world.player;
    for (const point of path) {
      const samples = Math.max(1, Math.ceil(Math.hypot(point.x - previous.x, point.z - previous.z) / .15));
      for (let i = 0; i <= samples; i++) assert.equal(world._walkable(previous.x + (point.x - previous.x) * i / samples,
        previous.z + (point.z - previous.z) * i / samples), true, `Route segment crosses scenery or void at${JSON.stringify(point)}`);
      previous = point;
    }
    assert.deepEqual(path.at(-1), { x: goal.x, z: goal.z });
  }
  assert.equal(world._pathTo({ x: 0, z: -15 }), null, 'A click into the nonplayable ridge does not create a false route');
});

test('legacy and newly obstructed saved positions recover to actual clear ground with a distinct safe party formation', () => {
  const world = fixture(); world.setParty(['shepard', 'kaidan', 'jenkins']);
  const state = newGame(), before = structuredClone(state);
  for (const position of [{ x: 0, z: 17 }, { x: -7, z: -5 }, { x: 5, z: -10 }, { x: 0, z: -17 },
    { x: -4, z: 18 }, { x: 34, z: -47 }, { x: 10, z: -84 }, { x: 9999, z: -9999 }]) {
    assert.equal(world.setPosition(position), true);
    assert.equal(world._walkable(world.player.x, world.player.z), true);
    assert.ok(world.trail.every(point => world._walkable(point.x, point.z)));
    for (const actor of world.actors) assert.equal(world._walkable(actor.group.position.x, actor.group.position.z), true);
    const positions = world.actors.map(actor => actor.group.position);
    for (let i = 0; i < positions.length; i++) for (let j = i + 1; j < positions.length; j++) assert.ok(positions[i].distanceTo(positions[j]) >= .69);
  }
  const valid = { ...EDEN_LAYOUT.pois.arrival }; world.setPosition(valid); assert.deepEqual(world.getPosition(), valid);
  const current = world.getPosition(); world.setPosition({ x: NaN, z: 2 }); assert.deepEqual(world.getPosition(), current);
  assert.deepEqual(state, before, 'Repositioning owns presentation only and never rewrites the campaign object');
});

test('real Three camera projection follows all five large clearings while legacy zones retain their previous framing', () => {
  const world = fixture({ geometry: false });
  for (const room of EDEN_LAYOUT.rooms) {
    assert.equal(world.setPosition(room.center), true); world.update(0); world.camera.updateMatrixWorld();
    const projected = new THREE.Vector3(world.player.x, 0, world.player.z).project(world.camera);
    assert.ok(Math.abs(projected.x) < .02 && Math.abs(projected.y) < .02, `${room.id}: the controlled actor remains central`);
  }
  world.levelLayout = getLevelLayout('feros');
  const previous = world._cameraFocus({ x: 40, z: -50 }, 'combat');
  assert.deepEqual(previous.toArray(), [9, .3, -10]);
});

test('each new native Eden battle keeps its nearest encounter arena stable without altering the battle', () => {
  const world = fixture({ geometry: false }), state = newGame();
  for (const [index, suffix] of ['encounter-1', 'encounter-2', 'boss'].entries()) {
    world.setPosition(EDEN_LAYOUT.pois[suffix]);
    const battle = createBattle({ party: ['shepard', 'kaidan', 'jenkins'].map(id => actorFor(id, state)),
      enemies: enemiesFor('eden-prime', index, state), mode: 'wait', seed: 2183 });
    const snapshot = JSON.stringify(battle); world.setBattle(battle);
    assert.deepEqual(world.battleArena, EDEN_LAYOUT.arenas[`eden-prime:${suffix}`]);
    for (const actor of world.battleActors.values()) assert.equal(isLevelGround(EDEN_LAYOUT, actor.basePosition.x, actor.basePosition.z), true);
    const arena = { ...world.battleArena }; world.player = { ...EDEN_LAYOUT.spawn }; world.setBattle(battle);
    assert.deepEqual(world.battleArena, arena, 'Normal event refreshes cannot move an active battle');
    assert.equal(JSON.stringify(battle), snapshot);
  }
  world.setBattle(null); assert.equal(world.battleArena, null);
});

test('large-mask navigation rejects unreachable targets and cannot cut through a thin solid obstruction', () => {
  const bounds = { minX: 0, maxX: 80, minZ: 0, maxZ: 80 };
  const walkable = (x, z) => x >= .4 && z >= .4 && x <= 79.6 && z <= 79.6 && !(x > 39.2 && x < 40.8 && z < 65);
  const path = findLevelPath({ bounds, start: { x: 4, z: 4 }, destination: { x: 75, z: 4 }, isWalkable: walkable });
  assert.ok(path?.some(point => point.z > 65), 'The path goes around the actual long barrier in the larger grid');
  let previous = { x: 4, z: 4 };
  for (const point of path) {
    for (let i = 0; i <= 10; i++) assert.ok(walkable(previous.x + (point.x - previous.x) * i / 10, previous.z + (point.z - previous.z) * i / 10));
    previous = point;
  }
  assert.equal(findLevelPath({ bounds, start: { x: 4, z: 4 }, destination: { x: 40, z: 4 }, isWalkable: walkable }), null);
});

test('terrain image loads deduplicate, replace only matching active materials and keep the fallback safe after failure or disposal', t => {
  const prior = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { createElement() {
    return { width: 128, height: 128, getContext() { return { fillRect() {}, fillStyle: '' }; } };
  } } });
  t.after(() => { if (prior) Object.defineProperty(globalThis, 'document', prior); else delete globalThis.document; });
  const requests = []; t.mock.method(THREE.TextureLoader.prototype, 'load', (url, ready, progress, error) => requests.push({ url, ready, error }));
  const world = Object.create(WorldView.prototype); Object.assign(world, { materialCache: new Map(), textureCache: new Map(), assetErrors: [] });
  const grass = world._edenTerrainMaterial('grass'), relief = world._edenTerrainMaterial('grass', 0xffffff, true), fallback = grass.map;
  assert.equal(requests.length, 1); assert.equal(relief.map, fallback);
  let disposed = 0; fallback.addEventListener('dispose', () => disposed++);
  const native = new THREE.Texture({ width: 1254, height: 1254 }); requests[0].ready(native);
  assert.equal(grass.map, native); assert.equal(relief.map, native); assert.equal(disposed, 1);
  assert.equal(native.colorSpace, THREE.SRGBColorSpace); assert.equal(native.wrapS, THREE.RepeatWrapping); assert.equal(native.wrapT, THREE.RepeatWrapping);
  const dirt = world._edenTerrainMaterial('dirt'), dirtFallback = dirt.map;
  requests[1].error(); assert.equal(dirt.map, dirtFallback); assert.equal(world.assetErrors.length, 1);
  world.materialCache.clear(); world._edenTerrainMaterial('dirt'); assert.equal(requests.length, 3, 'A later visit can retry a failed image');
  world._disposed = true; let lateDisposed = 0;
  const late = new THREE.Texture({ width: 1254, height: 1254 }); late.addEventListener('dispose', () => lateDisposed++);
  requests[2].ready(late); assert.equal(lateDisposed, 1); assert.equal(world.textureCache.get('eden-native-terrain:dirt'), dirtFallback);
});
