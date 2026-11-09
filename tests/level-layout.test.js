import test from 'node:test';
import assert from 'node:assert/strict';
import { EDEN_LAYOUT, LEVEL_LAYOUTS, getLevelLayout, isLevelGround, nearestLevelGround } from '../src/level-layout-data.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { newGame, encodeSave, decodeSave, canStartEncounter, winEncounter, completeZone } from '../src/state.js';

test('four authored immutable spatial plans preserve seven identities while the five legacy zones retain their bounds', () => {
  assert.equal(getLevelLayout('eden-prime'), EDEN_LAYOUT);
  const authored=['eden-prime','therum','noveria','virmire'];
  for(const id of authored){const layout=getLevelLayout(id);assert.ok(layout);assert.deepEqual(WORLD_ZONES[id].bounds,layout.bounds);assert.ok(Object.isFrozen(layout));assert.deepEqual(WORLD_ZONES[id].pois.map(p=>p.id),['arrival','cache','encounter-1','encounter-2','boss','objective','exit'].map(suffix=>`${id}:${suffix}`));}
  for (const id of Object.keys(WORLD_ZONES).filter(id => !authored.includes(id))) assert.equal(getLevelLayout(id), null);
  assert.equal(getLevelLayout('__proto__'), null);
  assert.ok(Object.isFrozen(LEVEL_LAYOUTS)); assert.ok(Object.isFrozen(EDEN_LAYOUT.rooms[0].polygon[0]));
  assert.throws(() => { EDEN_LAYOUT.paths[0].points.push([0, 0]); }, TypeError);
  for(const id of ['citadel','feros','ilos','citadel-finale'])assert.deepEqual(WORLD_ZONES[id].bounds,{minX:-20,maxX:20,minZ:-21,maxZ:21});
  assert.deepEqual(WORLD_ZONES.normandy.bounds, { minX: -7.5, maxX: 7.5, minZ: -17, maxZ: 16 });
  assert.deepEqual(WORLD_ZONES['eden-prime'].pois.map(poi => poi.id), ['arrival', 'cache', 'encounter-1', 'encounter-2', 'boss', 'objective', 'exit'].map(id => `eden-prime:${id}`));
});

test('five clearings, an optional supply loop and a western return provide actual ground inside a larger nonrectangular envelope', () => {
  const layout = EDEN_LAYOUT, b = layout.bounds;
  assert.equal(layout.rooms.length, 5); assert.equal(layout.paths.length, 3); assert.equal(layout.landmarks.length, 9);
  assert.ok((b.maxX - b.minX) * (b.maxZ - b.minZ) > 9 * 40 * 42);
  assert.deepEqual(layout.paths.map(path => path.kind), ['main', 'branch', 'return']);
  assert.ok(layout.paths.every(path => path.width >= 6));
  for (const room of layout.rooms) assert.equal(isLevelGround(layout, room.center.x, room.center.z), true, room.id);
  for (const point of [layout.spawn, ...Object.values(layout.pois), ...Object.values(layout.arenas)])
    assert.equal(isLevelGround(layout, point.x, point.z), true);
  for (const point of [[-50, 50], [-12, -40], [45, -65], [50, -85]])
    assert.equal(isLevelGround(layout, ...point), false, `Void inside rectangular bounds must remain closed: ${point}`);
  assert.equal(isLevelGround(layout, b.minX - 1, 0), false); assert.equal(isLevelGround(layout, 0, b.maxZ + 1), false);
});

test('every authored route stays connected through its joints with enough width for the actual ground clearance', () => {
  for (const path of EDEN_LAYOUT.paths) for (let i = 1; i < path.points.length; i++) {
    const a = path.points[i - 1], b = path.points[i], samples = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 4);
    for (let sample = 0; sample <= samples; sample++) {
      const t = sample / samples;
      assert.equal(isLevelGround(EDEN_LAYOUT, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 2), true, `${path.id}:${i}:${sample}`);
    }
  }
});

test('a real .75-unit navigation grid reaches every stable POI and each return branch without crossing void or cutting corners', () => {
  const layout = EDEN_LAYOUT, step = .75, b = layout.bounds;
  const width = Math.floor((b.maxX - b.minX) / step) + 1, depth = Math.floor((b.maxZ - b.minZ) / step) + 1;
  const ground = new Uint8Array(width * depth), seen = new Uint8Array(ground.length);
  const coordinates = (x, z) => ({ x: b.minX + x * step, z: b.minZ + z * step });
  let count = 0;
  for (let z = 0; z < depth; z++) for (let x = 0; x < width; x++) {
    const p = coordinates(x, z); if (isLevelGround(layout, p.x, p.z)) { ground[z * width + x] = 1; count++; }
  }
  // The playable area itself grows, rather than only enlarging empty bounds.
  assert.ok(count * step * step > 3 * 40 * 42);
  assert.ok(count < ground.length * .65, 'A substantial portion of the bounding box is nontraversable');
  const cell = p => [Math.round((p.x - b.minX) / step), Math.round((p.z - b.minZ) / step)];
  const start = cell(layout.spawn), queue = [start]; seen[start[1] * width + start[0]] = 1;
  for (let head = 0; head < queue.length; head++) {
    const [x, z] = queue[head];
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = x + dx, nz = z + dz, key = nz * width + nx;
      if (nx < 0 || nx >= width || nz < 0 || nz >= depth || seen[key] || !ground[key]) continue;
      if (dx && dz && (!ground[z * width + nx] || !ground[nz * width + x])) continue;
      seen[key] = 1; queue.push([nx, nz]);
    }
  }
  for (const p of [...Object.values(layout.pois), ...layout.paths.flatMap(path => path.points.map(([x, z]) => ({ x, z })))]) {
    const [x, z] = cell(p); assert.equal(seen[z * width + x], 1, `Unreachable layout point ${p.x},${p.z}`);
  }
});

test('old valid positions remain exact, blocked legacy positions recover to nearby ground and malformed input fails closed', () => {
  for (const original of [{ x: 0, z: 17 }, { x: 5, z: 6 }, { x: -7, z: -5 }, { x: 5, z: -10 }, { x: 0, z: -17 }, { x: -4, z: 18 }]) {
    const before = structuredClone(original), result = nearestLevelGround(EDEN_LAYOUT, original);
    assert.deepEqual(original, before); assert.ok(result); assert.equal(isLevelGround(EDEN_LAYOUT, result.x, result.z), true);
    if (isLevelGround(EDEN_LAYOUT, original.x, original.z)) assert.deepEqual(result, original);
    else assert.ok(Math.hypot(result.x - original.x, result.z - original.z) < 25);
  }
  assert.equal(nearestLevelGround(null, { x: 0, z: 0 }), null);
  assert.equal(nearestLevelGround(EDEN_LAYOUT, { x: NaN, z: 0 }), null);
  assert.equal(isLevelGround(EDEN_LAYOUT, Infinity, 0), false);
  assert.equal(isLevelGround(EDEN_LAYOUT, 0, 0, -1), false);
});

test('remapped coordinates do not grant encounter progression, alter rewards or change the existing save schema', () => {
  const state = newGame(); state.flags.briefed = true; state.zone = 'eden-prime'; state.position = { ...EDEN_LAYOUT.spawn };
  assert.deepEqual(decodeSave(encodeSave(state)), state);
  assert.equal(canStartEncounter(state, 'eden-prime:boss').ok, false);
  for (const suffix of ['encounter-1', 'encounter-2', 'boss']) {
    const id = `eden-prime:${suffix}`; assert.equal(canStartEncounter(state, id).ok, true); assert.equal(winEncounter(state, id), true);
    const after = structuredClone(state); assert.equal(winEncounter(state, id), false); assert.deepEqual(state, after);
  }
  assert.equal(completeZone(state, 'eden-prime'), true);
  const completed = structuredClone(state); assert.equal(completeZone(state, 'eden-prime'), false); assert.deepEqual(state, completed);
  assert.deepEqual(decodeSave(encodeSave(state)), state);
});
