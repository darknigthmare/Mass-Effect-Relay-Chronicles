import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  FRONTIER_VEHICLES, createMakoState, getMakoState, boardMako,
  stepMako, dismountMako, makoDirectionFrame, normalizeMakoDirections,
} from '../src/frontier-vehicles.js';

const mounted = () => boardMako(createMakoState({ x: 0, z: 0 }), { x: 0, z: 2 }, 'therum').state;
const free = () => true;
const drive = (initial, input, ticks, check = free) => {
  let state = initial;
  for (let index = 0; index < ticks; index += 1) state = stepMako(state, input, .05, check);
  return state;
};

test('Mako boarding is local to Thérum, detached and does not create campaign data', () => {
  const parked = createMakoState({ x: 2, z: 3 });
  const original = structuredClone(parked);
  assert.equal(boardMako(parked, { x: 2, z: 3 }, 'ilos').reason, 'wrong-zone');
  assert.equal(boardMako(parked, { x: 20, z: 3 }, 'therum').reason, 'too-far');
  const board = boardMako(parked, { x: 2, z: 6 }, 'therum');
  assert.equal(board.ok, true);
  assert.equal(board.state.mounted, true);
  assert.equal(boardMako(board.state, { x: 2, z: 3 }, 'therum').reason, 'already-mounted');
  assert.deepEqual(parked, original);
  assert.deepEqual(Object.keys(board.state), ['key', 'zoneId', 'position', 'velocity', 'heading', 'mounted']);
  assert.equal(FRONTIER_VEHICLES.mako.persistent, false);
  assert.equal(FRONTIER_VEHICLES.mako.weaponsAvailable, false);
});

test('inertia, boost and diagonal input remain bounded, frame stalls cannot teleport', () => {
  const state = mounted();
  const first = stepMako(state, { x: 1, z: 1 }, .05, free);
  assert.ok(Math.hypot(first.velocity.x, first.velocity.z) <= .75 + 1e-9);
  const normal = drive(state, { x: 9, z: 9 }, 80);
  assert.ok(Math.abs(Math.hypot(normal.velocity.x, normal.velocity.z) - 9) < 1e-9);
  const boost = drive(normal, { x: 9, z: 9, boost: true }, 80);
  assert.ok(Math.abs(Math.hypot(boost.velocity.x, boost.velocity.z) - 13) < 1e-9);
  const coasting = stepMako(boost, { x: 0, z: 0, boost: true }, .05, free);
  assert.ok(Math.hypot(coasting.velocity.x, coasting.velocity.z) < 13);
  assert.ok(Math.hypot(coasting.velocity.x, coasting.velocity.z) > 0);
  const stalled = stepMako(boost, { x: 1, z: 1, boost: true }, 999, free);
  assert.ok(Math.hypot(stalled.position.x - boost.position.x, stalled.position.z - boost.position.z) <= .65 + 1e-9);
  assert.deepEqual(state.position, { x: 0, z: 0 });
});

test('footprint padding stops the rover before a wall and preserves free-axis sliding', () => {
  const radii = [];
  const wall = (x, z, radius) => { radii.push(radius); return x + radius < 4 && Math.abs(z) < 50; };
  const state = drive(mounted(), { x: 1, z: .4, boost: true }, 100, wall);
  assert.ok(state.position.x + FRONTIER_VEHICLES.mako.radius < 4);
  assert.ok(state.position.z > 3, 'continues along the clear axis');
  assert.ok(radii.length > 100);
  assert.ok(radii.every(radius => radius === 1.45));
});

test('bounded substeps catch a narrow obstacle even when a frame targets beyond it', () => {
  const state = { ...mounted(), velocity: { x: 13, z: 0 } };
  const result = stepMako(state, { x: 1, z: 0, boost: true }, .05,
    x => !(x > .2 && x < .45));
  assert.ok(result.position.x <= .2);
  assert.equal(result.velocity.x, 0);
});

test('dismount finds safe adjacent ground and refuses exits across a thin enclosing wall', () => {
  const state = mounted();
  const blockedEast = (x, z, radius) => radius === .4 && x < 1.5 && z >= -.1;
  const exit = dismountMako(state, blockedEast);
  assert.equal(exit.ok, true);
  assert.ok(exit.position.x < 1.5);
  assert.ok(exit.position.z > 0);
  assert.equal(exit.state.mounted, false);
  assert.deepEqual(exit.state.velocity, { x: 0, z: 0 });
  assert.equal(state.mounted, true);
  // Final points are free, but reaching any of them would cross this ring.
  const ring = (x, z) => Math.hypot(x, z) < 1.6 || Math.hypot(x, z) > 1.9;
  const refused = dismountMako(state, ring);
  assert.equal(refused.ok, false);
  assert.equal(refused.reason, 'no-safe-ground');
  assert.equal(refused.state.mounted, true);
  assert.equal(refused.position, null);
});

test('direction frames follow the existing orthographic camera and stay still when parked', () => {
  const state = mounted();
  for (const [velocity, expected] of [
    [{ x: 2.7, z: -2.3 }, 'right'], [{ x: -2.7, z: 2.3 }, 'left'],
    [{ x: -2.3, z: -2.7 }, 'back'], [{ x: 2.3, z: 2.7 }, 'front'],
  ]) assert.equal(makoDirectionFrame({ ...state, velocity }), expected);
  assert.equal(makoDirectionFrame({ ...state, heading: 'left' }), 'left');
});

test('invalid state/input/time and unavailable collision checks cannot bypass ground safety', () => {
  for (const value of [null, {}, { x: NaN, z: 0 }, { x: 0, z: Infinity }]) {
    assert.equal(createMakoState(value), null);
  }
  const state = mounted();
  for (const dt of [0, -1, NaN, Infinity, '1']) assert.deepEqual(stepMako(state, { x: 1, z: 0 }, dt, free), state);
  for (const check of [null, () => { throw new Error('unavailable'); }, () => 'true']) {
    const result = stepMako({ ...state, velocity: { x: 10, z: 0 } }, { x: 1, z: 0 }, .05, check);
    assert.deepEqual(result.position, state.position);
    assert.deepEqual(result.velocity, { x: 0, z: 0 });
    assert.equal(dismountMako(state, check).ok, false);
  }
  assert.deepEqual(stepMako(state, { x: Infinity, z: 1 }, .05, free).position, state.position);
  assert.equal(getMakoState({ ...state, zoneId: 'me2' }), null);
  assert.equal(getMakoState({ ...state, velocity: { x: NaN, z: 0 } }), null);
  const extra = getMakoState({ ...state, inventory: { credits: 999 }, velocity: { x: 999, z: 999 } });
  assert.equal(extra.inventory, undefined);
  assert.ok(Math.hypot(extra.velocity.x, extra.velocity.z) <= 13 + 1e-9);
  assert.deepEqual(stepMako(createMakoState({ x: 0, z: 0 }), { x: 1, z: 0 }, .05, free).position, { x: 0, z: 0 });
});

test('direction metadata is detached, immutable and rejects unsafe UVs or another media', () => {
  const input = JSON.parse(readFileSync(new URL('../public/assets/vehicle-mako-directions.json', import.meta.url), 'utf8'));
  const metadata = normalizeMakoDirections(input);
  assert.ok(metadata);
  assert.equal(metadata.displayHeight, 3);
  assert.deepEqual(Object.keys(metadata.frames), ['front', 'back', 'left', 'right']);
  assert.ok(Object.isFrozen(metadata.frames.front.rect));
  input.frames.front.rect[0] += 1;
  assert.notEqual(metadata.frames.front.rect[0], input.frames.front.rect[0]);
  const invalid = change => {
    const copy = structuredClone(input); change(copy);
    assert.equal(normalizeMakoDirections(copy), null);
  };
  invalid(copy => { copy.mediaId = 'MEA'; });
  invalid(copy => { copy.periodId = 'me2'; });
  invalid(copy => { copy.frames.front.rect[2] = 9000; });
  invalid(copy => { copy.frames.front.pivot[0] = -1; });
  invalid(copy => { copy.frames.back.rect = [...copy.frames.front.rect]; });
  invalid(copy => { delete copy.frames.left; });
  invalid(copy => { copy.frames.right.heightScale = Infinity; });
  assert.equal(normalizeMakoDirections(null), null);
});
