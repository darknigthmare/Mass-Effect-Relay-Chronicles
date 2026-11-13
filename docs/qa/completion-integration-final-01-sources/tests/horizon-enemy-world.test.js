import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { WorldView } from '../src/world.js';
import { HORIZON_ENEMIES, HORIZON_ENEMY_IDS as IDS, HORIZON_ENEMY_HEIGHTS, normalizeHorizonEnemyAtlas } from '../src/horizon-enemies.js';
import { initialCustomization } from '../src/customization.js';
import { newGame } from '../src/state.js';
import { actorFor } from '../src/game-data.js';
import { createBattle } from '../src/combat.js';
const raw = () => JSON.parse(readFileSync(new URL('../public/assets/horizon-enemies.json', import.meta.url)));
const texture = (width = 1536, height = 1024) => new THREE.Texture({ width, height });
const close = (a, b) => assert.ok(Math.abs(a-b) < 1e-8, `${a} != ${b}`);
function fixture() {
  const world = Object.create(WorldView.prototype), config = normalizeHorizonEnemyAtlas(raw());
  Object.assign(world, { commanderAppearance: 'male', commanderCustomization: initialCustomization(),
    scene: new THREE.Scene(), stage: new THREE.Group(), characters: new THREE.Group(), particles: new THREE.Group(),
    actors: [], ambientActors: [], battleActors: new Map(), characterAnimations: {},
    spriteCache: new Map(), textureCache: new Map(), customizationTextures: new Map(), materialCache: new Map(),
    atlases: { crew: texture(), enemy: texture(), npc: texture(), boss: texture(), 'horizon-enemies': texture(config.width, config.height) },
    horizonEnemyConfig: config, assetErrors: [], storyContext: null,
    zoneId: 'feros', zone: { id: 'feros', arena: { x: 0, z: 0 }, pois: [] }, levelLayout: null,
    camera: new THREE.OrthographicCamera(-20, 20, 15, -15, .1, 500), cameraOffset: new THREE.Vector3(23,29,27), cameraTarget: new THREE.Vector3(),
    player: { x: 0, z: 0 }, mode: 'combat', time: 0, keys: new Set(), trail: [], effects: [], animations: [],
    poiViews: [], combatOccluders: [], operationPois: [], cleared: new Set(), renderer: { render() {} },
    getNearby() { return null; }, _walkable() { return true; } });
  world.scene.add(world.stage, world.characters, world.particles); return world;
}
function battle(world, key) {
  const state = newGame({ classId: 'soldier' });
  const value = createBattle({ party: [actorFor('shepard', state)],
    enemies: [{ ...HORIZON_ENEMIES[key], id: `${key}-0`, atb: 100 }], mode: 'wait', difficulty: 'story', seed: 2183 });
  world.setBattle(value); world.update(0);
  return { state, value, native: value.actors.find(actor => actor.team === 'enemy'), actor: world.battleActors.get(`${key}-0`) };
}

test('all five real WorldView bodies honor native heights, detached UVs and ground/hover pivots', () => {
  for (const key of IDS) {
    const world = fixture(), { actor } = battle(world, key), frame = world.horizonEnemyConfig.frames[key], atlas = world.atlases['horizon-enemies'];
    const [x,y,w,h] = frame.rect, map = actor.body.material.map;
    assert.equal(actor.height, HORIZON_ENEMY_HEIGHTS[key]); assert.equal(actor.animationFrame, `${key}-body`);
    assert.notEqual(map, atlas); assert.equal(map.image, atlas.image);
    close(map.offset.x, x/atlas.image.width); close(map.offset.y, 1-(y+h)/atlas.image.height);
    close(map.repeat.x, w/atlas.image.width); close(map.repeat.y, h/atlas.image.height);
    close(actor.body.geometry.parameters.height * actor.body.scale.y, actor.height);
    close(actor.body.geometry.parameters.width * actor.body.scale.x, actor.height*w/h);
    close(actor.body.position.y + (.5-frame.pivot[1]/h)*actor.height, .05 + frame.hoverHeight);
    const offset = (.5-frame.pivot[0]/w)*(actor.height*w/h), facing = Math.atan2(world.cameraOffset.x,world.cameraOffset.z);
    close(actor.body.position.x,Math.cos(facing)*offset); close(actor.body.position.z,-Math.sin(facing)*offset);
    world.setBattle(null);
  }
});

test('late/mismatched atlas and foreign identity transitions cannot retain a Horizon crop', () => {
  for (const key of IDS) {
    const world = fixture(), { actor, native } = battle(world, key), atlas = world.atlases['horizon-enemies'];
    for (const patch of [{ mediaId: 'ME2' }, { periodId: 'me3' }, { context: { mediaId: 'MEA' } }]) {
      const saved = { mediaId: native.mediaId, periodId: native.periodId, context: native.context };
      Object.assign(native, patch); world.update(0);
      assert.equal(actor.animationFrame, null); assert.notEqual(actor.body.material.map.image, atlas.image);
      assert.equal(actor.body.material.map.isDataTexture, true);
      assert.ok(actor.body.material.map.image.data.every(value => value === 0), 'Foreign identities use a transparent neutral texture, never a geth alias');
      Object.assign(native, saved); world.update(0); assert.equal(actor.animationFrame, `${key}-body`);
    }
    atlas.image = { width: world.horizonEnemyConfig.width+1, height: world.horizonEnemyConfig.height };
    world.update(0); assert.equal(actor.animationFrame, null); assert.notEqual(actor.body.material.map.image, atlas.image);
    atlas.image = { width: world.horizonEnemyConfig.width, height: world.horizonEnemyConfig.height };
    world.update(0); assert.equal(actor.animationFrame, `${key}-body`);
    actor.enemy = false; world.update(0); assert.equal(actor.animationFrame, null);
    actor.enemy = true; world.update(0); assert.equal(actor.animationFrame, `${key}-body`);
  }
});

test('actor-specific crop textures are released on battle exit while the source atlas survives', () => {
  const world = fixture(), atlas = world.atlases['horizon-enemies']; let sourceDisposals = 0, croppedDisposals = 0;
  atlas.addEventListener('dispose', () => { sourceDisposals++; });
  const state = newGame(), value = createBattle({ party: [actorFor('shepard',state)],
    enemies: IDS.map((key,index) => ({ ...HORIZON_ENEMIES[key], id: `${key}-${index}` })), mode: 'wait', seed: 2183 });
  world.setBattle(value);world.update(0);
  const crops = [...world.spriteCache.entries()].filter(([key]) => key.startsWith('horizon-enemies:'));
  assert.equal(crops.length, 5); assert.equal(new Set(crops.map(([,map]) => map)).size, 5);
  for (const [,map] of crops) map.addEventListener('dispose', () => { croppedDisposals++; });
  world.setBattle(null);
  assert.equal(world.battleActors.size, 0); assert.equal(croppedDisposals, 5); assert.equal(sourceDisposals, 0);
  assert.deepEqual([...world.spriteCache.keys()].filter(key => key.startsWith('horizon-enemies:')), []);
  assert.equal(world.atlases['horizon-enemies'], atlas);
});

test('heavy-machine traces originate and land near the tall body instead of human knee height', t => {
  for (const key of ['armature', 'colossus']) {
    const world = fixture(), { actor, native, value } = battle(world, key), player = world.battleActors.get('shepard');
    // Isolate the shared native origin/target geometry from weapon spread; the
    // generic beam remains the actual playEvent fallback for these enemies.
    t.mock.method(world, '_weaponTraces', () => false);
    const snapshot = JSON.stringify(value, (key,value) => typeof value === 'function' ? undefined : value);
    world.playEvent({ type: 'action', actorId: native.id, actionId: 'shoot', targetId: 'shepard' });
    const beam = world.effects.find(effect => effect.kind === 'beam'); assert.ok(beam);
    close(beam.object.position.y, (actor.height*.62+1.2)/2);
    assert.equal(JSON.stringify(value, (key,value) => typeof value === 'function' ? undefined : value), snapshot);
    world._clearEffects();
    world.playEvent({ type: 'action', actorId: 'shepard', actionId: 'shoot', targetId: native.id });
    const hit = world.effects.find(effect => effect.kind === 'beam'); assert.ok(hit);
    close(hit.object.position.y, (1.4+actor.height*.62)/2);
    assert.ok(player.height < actor.height);
  }
});
