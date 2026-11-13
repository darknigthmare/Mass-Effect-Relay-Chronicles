import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { WorldView } from '../src/world.js';
import { normalizeHorizonFaunaAtlas } from '../src/horizon-fauna.js';
import { newGame } from '../src/state.js';
import { ENEMIES, actorFor } from '../src/game-data.js';
import { createBattle } from '../src/combat.js';
import { initialCustomization } from '../src/customization.js';
const raw = JSON.parse(readFileSync(new URL('../public/assets/horizon-fauna.json', import.meta.url)));
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8);
function fixture() {
  const world = Object.create(WorldView.prototype), atlas = normalizeHorizonFaunaAtlas(raw);
  Object.assign(world, { commanderAppearance: 'male', commanderCustomization: initialCustomization(),
    zoneId: 'feros', zone: { id: 'feros', arena: { x: 12, z: 25 }, pois: [] }, levelLayout: null,
    storyContext: { ...newGame(), zone: 'feros', operations: { records: { 'feros-varrens': { stage: 1 } } } },
    horizonFaunaConfig: atlas, atlases: { crew: new THREE.Texture({ width: 1536, height: 1024 }),
      enemy: new THREE.Texture({ width: 1536, height: 1024 }), 'horizon-fauna': new THREE.Texture({ width: atlas.width, height: atlas.height }) },
    actors: [], ambientActors: [], battleActors: new Map(), characterAnimations: {},
    scene: new THREE.Scene(), characters: new THREE.Group(), particles: new THREE.Group(),
    spriteCache: new Map(), customizationTextures: new Map(), textureCache: new Map(), materialCache: new Map(), assetErrors: [],
    camera: new THREE.OrthographicCamera(-20, 20, 15, -15, .1, 500), cameraOffset: new THREE.Vector3(23, 29, 27),
    cameraTarget: new THREE.Vector3(), player: { x: 12, z: 25 }, mode: 'combat', time: 0, keys: new Set(), trail: [],
    effects: [], animations: [], poiViews: [], combatOccluders: [], cleared: new Set(), operationPois: [],
    renderer: { render() {} }, getNearby() { return null; }, _walkable() { return true; } });
  world.scene.add(world.characters, world.particles); return world;
}
function pack(world) {
  const state = newGame(), battle = createBattle({ party: ['shepard', 'kaidan', 'ashley'].map(id => actorFor(id, state)),
    enemies: ['varren', 'varren', 'alpha-varren'].map((key, index) => ({ ...ENEMIES[key], id: `feros-varrens-pack-${index}` })), seed: 2183 });
  world.setBattle(battle); return battle;
}
test('real WorldView crops, feet and display heights use the three native optional enemies without changing battle data', () => {
  const world = fixture(), battle = pack(world), before = JSON.stringify(battle);
  world.update(0); assert.equal(JSON.stringify(battle), before);
  for (const [index, key] of ['varren-me1', 'varren-me1', 'alpha-varren-me1'].entries()) {
    const actor = world.battleActors.get(`feros-varrens-pack-${index}`), frame = raw.frames[key], map = actor.body.material.map;
    assert.equal(actor.animationFrame, key); assert.equal(map.image, world.atlases['horizon-fauna'].image);
    const [x, y, w, h] = frame.rect;
    close(map.offset.x, x / raw.width); close(map.offset.y, 1 - (y + h) / raw.height);
    close(map.repeat.x, w / raw.width); close(map.repeat.y, h / raw.height);
    const display = actor.height * frame.heightScale;
    close(actor.body.geometry.parameters.height * actor.body.scale.y, display);
    close(actor.body.position.y + (.5 - frame.pivot[1] / h) * display, .05);
  }
});
test('foreign period, wrong world and mismatched atlas dimensions remove existing animal crops; battle exit disposes them', () => {
  const world = fixture(); pack(world); world.update(0);
  const actor = world.battleActors.get('feros-varrens-pack-0'); assert.equal(actor.animationFrame, 'varren-me1');
  for (const invalidate of [() => { world.storyContext.mediaId = 'ME2'; }, () => { world.zoneId = 'therum'; },
    () => { world.atlases['horizon-fauna'].image = { width: raw.width + 1, height: raw.height }; }]) {
    invalidate(); assert.equal(world._applyHorizonFaunaBody(actor), false); assert.equal(actor.animationFrame, null);
    assert.equal(actor.body.material.map.image.width, 1);
    delete world.storyContext.mediaId; world.zoneId = 'feros'; world.atlases['horizon-fauna'].image = { width: raw.width, height: raw.height };
    assert.equal(world._applyHorizonFaunaBody(actor), true);
  }
  const maps = [...world.spriteCache].filter(([key]) => key.startsWith('horizon-fauna:')).map(([, value]) => value);
  const disposed = new Set(); for (const map of maps) map.addEventListener('dispose', () => disposed.add(map));
  world.setBattle(null); assert.equal([...world.spriteCache.keys()].some(key => key.startsWith('horizon-fauna:')), false);
  assert.equal(disposed.size, maps.length);
});
test('gasbag bodies belong to passive Eden ambience and cannot remain visible as that fauna in Feros or ME2', () => {
  const world = fixture(); world.zoneId = 'eden-prime'; world.mode = 'explore';
  const actor = world._makeActor('gasbag-me1', 'fauna:gasbag-me1:0', false); actor.faunaId = 'gasbag-me1'; actor.faunaIndex = 0;
  assert.equal(world._applyHorizonFaunaBody(actor), true); assert.equal(actor.animationFrame, 'gasbag-me1');
  world.zoneId = 'feros'; assert.equal(world._applyHorizonFaunaBody(actor), false); assert.equal(actor.animationFrame, null);
  world.zoneId = 'eden-prime'; world.storyContext.context = { mediaId: 'ME2', periodId: 'me2' };
  assert.equal(world._applyHorizonFaunaBody(actor), false); assert.equal(actor.animationFrame, null);
});

test('native ambient rebuilding removes the resolved pack and its crops, closes foreign scope and restores valid ME1 ambience', () => {
  const world = fixture(); world.mode = 'explore'; world._makeMarkers = () => {};
  // Declared story-context fixture: lifecycle coverage, not a replayed victory.
  const stageOne = { ...newGame(), zone: 'feros', operations: { records: { 'feros-varrens': { stage: 1 } } } };
  const original = structuredClone(stageOne);
  world.setStoryContext(stageOne);
  assert.equal(world.ambientActors.length, 3);
  assert.deepEqual(world.ambientActors.map(actor => actor.animationFrame), ['varren-me1', 'varren-me1', 'alpha-varren-me1']);
  assert.ok(world.ambientActors.every(actor => actor.group.visible));
  const maps = [...world.spriteCache].filter(([key]) => key.startsWith('horizon-fauna:')).map(([, value]) => value);
  assert.equal(maps.length, 3); const disposed = new Set();
  for (const map of maps) map.addEventListener('dispose', () => disposed.add(map));
  world.setStoryContext({ ...stageOne, operations: { records: { 'feros-varrens': { stage: 2 } } } });
  assert.equal(world.ambientActors.length, 0); assert.equal(disposed.size, 3);
  assert.equal([...world.spriteCache.keys()].some(key => key.startsWith('horizon-fauna:')), false);
  world.setMode('explore'); assert.equal(world.ambientActors.length, 0);
  world.setStoryContext({ ...stageOne, operations: { records: { 'feros-varrens': { stage: 3 } } } });
  assert.equal(world.ambientActors.length, 0);
  world.setStoryContext({ ...stageOne, mediaId: 'ME2', periodId: 'me2' }); assert.equal(world.ambientActors.length, 0);
  world.setStoryContext(stageOne); assert.equal(world.ambientActors.length, 3);
  assert.ok(world.ambientActors.every(actor => actor.animationFrame && actor.group.visible));
  world.setStoryContext({ ...stageOne, cleared: ['feros:boss'] }); assert.equal(world.ambientActors.length, 0);
  assert.deepEqual(stageOne, original, 'Renderer rebuilding never alters the supplied save-shaped fixture.');
});
