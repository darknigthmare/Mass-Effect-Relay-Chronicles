import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { WorldView } from '../src/world.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { getLevelLayout } from '../src/level-layout-data.js';
import { normalizeHorizonFleetAtlas } from '../src/horizon-fleet.js';

const raw = family => JSON.parse(readFileSync(new URL(`../public/assets/horizon-fleet-${family}.json`, import.meta.url)));
const config = normalizeHorizonFleetAtlas('me1', raw('me1'));
const story = extra => ({ recruited: [], lost: [], cleared: [], visitedZones: [], completed: [], flags: {}, ...extra });
function fixture(zoneId = 'citadel', storyContext = { flags: { briefed: true }, completed: ['citadel', 'virmire'] }) {
  const world = Object.create(WorldView.prototype), loads = [];
  Object.assign(world, { zoneId, zone: WORLD_ZONES[zoneId], levelLayout: getLevelLayout(zoneId), storyContext: storyContext && story(storyContext),
    mode: 'explore', stage: new THREE.Group(), horizonFleetViews: new Map(), spriteCache: new Map(),
    atlases: { 'horizon-fleet-me1': new THREE.Texture({ width: config.width, height: config.height }) },
    cameraOffset: new THREE.Vector3(23, 29, 27), keys: new Set(), combatOccluders: [], actors: [],
    ambientActors: [], battleActors: new Map(), poiViews: [], cleared: new Set(),
    _loadAtlas(name, url) { loads.push({ name, url }); return true; }, _applyCommanderCustomization() {} });
  assert.equal(world.registerHorizonFleetAtlas('me1', raw('me1')), true);
  return { world, loads };
}
const assertProjectionSync = world => {
  for (const view of world.horizonFleetViews.values()) {
    assert.equal(view.projection?.isGroup, true, 'Each fleet marker has its authored holographic stand.');
    assert.equal(view.projection.parent, world.stage);
    assert.equal(view.projection.visible, view.mesh.visible, 'The stand and hull obey the same scene eligibility.');
  }
};
const visible = world => {
  assertProjectionSync(world);
  return [...world.horizonFleetViews.values()].filter(view => view.mesh.visible).map(view => view.id).sort();
};

test('native fleet registration creates only known ME1 meshes with exact measured UVs', () => {
  const { world, loads } = fixture(); world._syncHorizonFleet();
  assert.deepEqual(loads, [{ name: 'horizon-fleet-me1', url: './assets/horizon-fleet-me1.png' }]);
  assert.deepEqual(visible(world), ['destiny-ascension', 'normandy-sr1']);
  for (const [id, view] of world.horizonFleetViews) {
    const [x, y, width, height] = config.frames[id].rect, map = view.mesh.material.map;
    assert.equal(view.frameId, id); assert.equal(view.mesh.userData.horizonFleet, id);
    assert.equal(view.mesh.parent, world.stage); assert.equal(view.mesh.userData.keep, true);
    assert.equal(view.projection.userData.keep, true);
    assert.equal(view.mesh.material.transparent, true); assert.ok(view.mesh.material.opacity > 0 && view.mesh.material.opacity < 1);
    assert.notEqual(map, world.atlases['horizon-fleet-me1']);
    assert.equal(map.image, world.atlases['horizon-fleet-me1'].image);
    assert.equal(map.repeat.x, width / config.width); assert.equal(map.repeat.y, height / config.height);
    assert.equal(map.offset.x, x / config.width); assert.equal(map.offset.y, 1 - (y + height) / config.height);
    assert.ok(view.mesh.geometry.parameters.width > 0 && view.mesh.geometry.parameters.height > 0);
  }
  assert.equal(world.registerHorizonFleetAtlas('later', raw('later')), false);
  assert.equal(world.horizonFleetConfigs.later, undefined);
  assert.equal(world.registerHorizonFleetAtlas('me1', { ...raw('me1'), file: 'other.png' }), false);
});

test('native world gates add the transport after briefing and Sovereign only in the known final', () => {
  const { world } = fixture('eden-prime', { flags: {}, completed: [] }); world._syncHorizonFleet();
  assert.deepEqual(visible(world), ['normandy-sr1']);
  world.storyContext.flags.briefed = true; world._syncHorizonFleet();
  assert.deepEqual(visible(world), ['geth-dropship', 'normandy-sr1']);
  const final = fixture('citadel-finale', { flags: { briefed: true }, completed: ['citadel'] }).world;
  final._syncHorizonFleet(); assert.deepEqual(visible(final), []);
  final.storyContext.completed.push('virmire'); final._syncHorizonFleet();
  assert.deepEqual(visible(final), ['sovereign']);
  final.zoneId = 'virmire'; final.zone = WORLD_ZONES.virmire; final.levelLayout = getLevelLayout('virmire'); final._syncHorizonFleet();
  assert.deepEqual(visible(final), ['normandy-sr1']);
  assert.equal(final.horizonFleetViews.get('sovereign').mesh.visible, false);
});

test('combat, foreign periods and later mode changes never retain visible campaign fleet props', () => {
  const { world } = fixture(); world._syncHorizonFleet(); const native = visible(world);
  world.setMode('combat'); assert.deepEqual(visible(world), []);
  world.setMode('explore'); assert.deepEqual(visible(world), native);
  for (const foreign of [{ mediaId: 'ME2', periodId: 'me2' }, { context: { mediaId: 'MEA', periodId: 'mea' } }]) {
    world.storyContext = story({ flags: { briefed: true }, completed: ['citadel', 'virmire'], ...foreign });
    world.setMode('menu'); world.setMode('explore'); assert.deepEqual(visible(world), []);
  }
  world.storyContext = story({ flags: { briefed: true }, completed: ['citadel', 'virmire'] });
  world._syncHorizonFleet(); assert.deepEqual(visible(world), native);
  world.storyContext = null; world._syncHorizonFleet(); assert.deepEqual(visible(world), []);
});

test('incorrect live atlas dimensions hide previous crops and recover only with matching geometry', () => {
  const { world } = fixture(); world._syncHorizonFleet(); const native = visible(world), atlas = world.atlases['horizon-fleet-me1'];
  const beforeContext = JSON.stringify(world.storyContext);
  for (const image of [{ width: config.width + 1, height: config.height }, { width: config.width, height: config.height - 1 }]) {
    atlas.image = image; world._syncHorizonFleet(); assert.deepEqual(visible(world), []);
    world.setMode('menu'); world.setMode('explore'); assert.deepEqual(visible(world), []);
  }
  atlas.image = { width: config.width, height: config.height }; world._syncHorizonFleet(); assert.deepEqual(visible(world), native);
  assert.equal(JSON.stringify(world.storyContext), beforeContext, 'Rendering never changes campaign progress.');
});

test('a replaced atlas refreshes an existing hull instead of retaining a disposed crop', () => {
  const { world } = fixture(); world._syncHorizonFleet();
  const view = world.horizonFleetViews.get('normandy-sr1'), old = view.mesh.material.map;
  let disposed = false; old.addEventListener('dispose', () => { disposed = true; });
  // Native _loadAtlas releases all family crops before invoking synchronization.
  for (const [key, texture] of world.spriteCache) if (key.startsWith('horizon-fleet-me1:')) { texture.dispose(); world.spriteCache.delete(key); }
  const replacement = new THREE.Texture({ width: config.width, height: config.height, generation: 'replacement' });
  world.atlases['horizon-fleet-me1'] = replacement; world._syncHorizonFleet();
  assert.equal(disposed, true); assert.equal(world.horizonFleetViews.get('normandy-sr1'), view);
  assert.notEqual(view.mesh.material.map, old); assert.equal(view.mesh.material.map.image, replacement.image);
  const [x, y, width, height] = config.frames['normandy-sr1'].rect;
  assert.equal(view.mesh.material.map.offset.x, x / config.width);
  assert.equal(view.mesh.material.map.offset.y, 1 - (y + height) / config.height);
  assert.equal(view.mesh.material.map.repeat.x, width / config.width);
  assert.equal(view.mesh.material.map.repeat.y, height / config.height);
});

test('completed final progression removes existing Sovereign and Ascension props through later modes', () => {
  for (const [zoneId, ship] of [['citadel-finale', 'sovereign'], ['citadel', 'destiny-ascension']]) {
    const { world } = fixture(zoneId); world._syncHorizonFleet();
    const view = world.horizonFleetViews.get(ship); assert.equal(view.mesh.visible, true); assertProjectionSync(world);
    world.storyContext.completed.push('citadel-finale'); world._syncHorizonFleet();
    assert.equal(view.mesh.visible, false); assertProjectionSync(world);
    world.setMode('menu'); world.setMode('explore'); assert.equal(view.mesh.visible, false); assertProjectionSync(world);
  }
});
