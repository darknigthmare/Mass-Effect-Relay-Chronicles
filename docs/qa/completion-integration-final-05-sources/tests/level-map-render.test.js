import test from 'node:test';
import assert from 'node:assert/strict';
import { EDEN_LAYOUT } from '../src/level-layout-data.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { levelMapProjection, renderLevelGround, currentSectorLabel } from '../src/level-map-render.js';
import { renderLocalMap } from '../src/local-map.js';

const esc = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test('the long Eden map keeps equal world distances at the same scale and centres the narrower axis', () => {
  const projection = levelMapProjection(EDEN_LAYOUT.bounds);
  close(projection.x(-44) - projection.x(-54), projection.z(-82) - projection.z(-92));
  close(projection.x(1) - projection.x(0), .6);
  close(projection.x(-54), 17); close(projection.x(56), 83);
  close(projection.z(-92), 5); close(projection.z(58), 95);
  const radar = levelMapProjection(EDEN_LAYOUT.bounds, { left: 12, top: 12, width: 126, height: 126 });
  close(radar.x(1) - radar.x(0), radar.z(1) - radar.z(0));
  assert.equal(levelMapProjection({ minX: 0, maxX: 0, minZ: 0, maxZ: 1 }), null);
});

test('player and exact POI leader points use the same Eden projection as its authored ground silhouette', () => {
  const projection = levelMapProjection(EDEN_LAYOUT.bounds), point = WORLD_ZONES['eden-prime'].pois.find(poi => poi.id.endsWith('boss'));
  const source = structuredClone({ bounds: EDEN_LAYOUT.bounds, position: EDEN_LAYOUT.spawn, pois: [point] });
  const original = structuredClone(source);
  const html = renderLocalMap({ ...source, objective: 'Rejoindre la balise', tracked: point.id, esc, layout: EDEN_LAYOUT });
  assert.ok(html.includes(`class="map-player" style="left:${projection.x(source.position.x)}%;top:${projection.z(source.position.z)}%"`));
  assert.ok(html.includes(`<circle cx="${projection.x(point.x)}" cy="${projection.z(point.z)}"`));
  assert.ok(html.includes(`transform="${projection.transform}"`));
  assert.equal((html.match(/data-map-sector=/g) || []).length, 5);
  assert.equal((html.match(/data-map-route=/g) || []).length, 3);
  assert.ok(html.includes('data-do="track"')); assert.deepEqual(source, original);
});

test('ordinary maps and their filters retain the existing frame while authored terrain stays visible with an empty contact filter', () => {
  const zone = WORLD_ZONES.citadel;
  const plain = renderLocalMap({ bounds: zone.bounds, position: zone.spawn, pois: zone.pois, objective: 'Audience', esc });
  assert.ok(plain.includes('<rect x="5" y="5" width="90" height="90"'));
  assert.equal(plain.includes('data-map-layout='), false);
  const filtered = renderLocalMap({ bounds: EDEN_LAYOUT.bounds, position: EDEN_LAYOUT.spawn,
    pois: WORLD_ZONES['eden-prime'].pois, objective: 'Balise', filter: 'contacts', esc, layout: EDEN_LAYOUT });
  assert.ok(filtered.includes('data-map-layout="eden-prime"'));
  assert.ok(filtered.includes('Aucun lieu dans ce filtre.')); assert.equal(filtered.includes('class="map-number'), false);
  assert.equal(renderLevelGround(null), ''); assert.equal(renderLevelGround(EDEN_LAYOUT, { width: -1 }), '');
});

test('sector labels describe actual rooms or routes without mutating geometry or inventing a region outside the ground', () => {
  const snapshot = JSON.stringify(EDEN_LAYOUT);
  for (const room of EDEN_LAYOUT.rooms) assert.equal(currentSectorLabel(EDEN_LAYOUT, room.center), room.label);
  assert.equal(currentSectorLabel(EDEN_LAYOUT, { x: -38, z: -41 }), 'Piste de retour');
  assert.equal(currentSectorLabel(EDEN_LAYOUT, { x: 55, z: 57 }), '');
  assert.equal(currentSectorLabel(null, EDEN_LAYOUT.spawn), ''); assert.equal(JSON.stringify(EDEN_LAYOUT), snapshot);
});
