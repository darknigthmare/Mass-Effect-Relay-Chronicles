import test from 'node:test';
import assert from 'node:assert/strict';
import { getExploreInteraction } from '../src/frontier-ui.js';

test('a mounted player can always leave even beside a mission contact', () => {
  const result = getExploreInteraction({ vehicle: { id: 'mako', mounted: true }, poi: { id: 'boss', label: 'Boss' } });
  assert.equal(result.id, 'mako:leave');
});

test('boarding does not steal a closer conversation or an equally close mission point', () => {
  const input = { vehicle: { id: 'mako', available: true, distance: 3 }, position: { x: 0, z: 0 }, poi: { id: 'arrival', label: 'Briefing', x: 0, z: 2 } };
  assert.equal(getExploreInteraction(input).id, 'arrival');
  input.poi.z = 3;
  assert.equal(getExploreInteraction(input).id, 'arrival');
  input.poi.z = 4;
  assert.equal(getExploreInteraction(input).id, 'mako:board');
});

test('out of range or invalid vehicles never create a boarding prompt', () => {
  for (const vehicle of [{ id: 'mako', available: false, distance: 2 }, { id: 'mako', available: true, distance: NaN }, { id: 'mako', available: true, distance: -1 }, { id: 'other', available: true, distance: 1 }]) {
    assert.equal(getExploreInteraction({ vehicle }), null);
  }
});
