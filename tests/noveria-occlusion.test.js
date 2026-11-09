import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { WorldView } from '../src/world.js';
import { WORLD_ZONES } from '../src/world-data.js';

test('Noveria overhead spans survive static merging and reveal combat bodies without removing field scenery', () => {
  const world = Object.create(WorldView.prototype);
  Object.assign(world, {
    stage: new THREE.Group(), materialCache: new Map(), animations: [], combatOccluders: [],
    colliders: [], zone: WORLD_ZONES.noveria, levelLayout: null, mode: 'explore',
    keys: new Set(), actors: [], ambientActors: [], battleActors: new Map(), poiViews: [],
    cleared: new Set(), rand: () => .5, _building() {}, _sign() {}, _console() {}, _rock() {},
    _texturedMaterial(color) { return this._material(color); },
  });
  world._noveria();
  const colliders = structuredClone(world.colliders), spans = world.combatOccluders.filter(object => object.geometry.parameters.height < 1);
  assert.equal(spans.length, 4, 'Both structural spans and their light strips must yield.');
  assert.ok(spans.every(span => span.visible && span.userData.keep));
  world._mergeStatic();
  assert.ok(spans.every(span => span.parent === world.stage), 'Merged static geometry cannot toggle an individual occluder.');
  for (let cycle = 0; cycle < 2; cycle++) {
    world.setMode('combat'); assert.ok(spans.every(span => !span.visible));
    world.setMode('explore'); assert.ok(spans.every(span => span.visible));
  }
  assert.deepEqual(world.colliders, colliders, 'The view correction does not alter collision footprints.');
});
