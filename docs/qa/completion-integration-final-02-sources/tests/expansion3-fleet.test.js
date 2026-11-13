import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPANSION3_FLEET } from '../src/expansion3-fleet.js';
import { EXPANSION_ENTRIES, EXPANSION2_ENTRIES, runExpansionTrial } from '../src/expansion.js';
import { getUniverseRecord } from '../src/universe-data.js';
import { canAccessContent } from '../src/continuity.js';

test('lot 3 fleet does not relabel old hulls, interiors or station missions as new transports', () => {
  assert.equal(Object.isFrozen(EXPANSION3_FLEET), true);
  assert.deepEqual(EXPANSION3_FLEET, []);
  const oldFleet = [...EXPANSION_ENTRIES, ...EXPANSION2_ENTRIES].filter(entry => entry.mode === 'fleet');
  assert.equal(oldFleet.length, 66);
  assert.equal(new Set(oldFleet.map(entry => entry.id)).size, 66);
});

test('a film Mako identity or an Arcturus station fact without a segment grants no fleet trial', () => {
  for (const [id, context] of [
    ['PL-REF-MAKO', { mediaId: 'PL', periodId: 'pl-collectors' }],
    ['EVO-WRL-ARCTURUS', { mediaId: 'EVO', periodId: 'evo' }],
  ]) {
    const record = getUniverseRecord(id);
    assert.equal(record.fact, true);
    assert.deepEqual(record.availability, []);
    assert.equal(canAccessContent(id, context).ok, false);
    assert.equal(runExpansionTrial(id, context).ok, false);
  }
});

test('unverified Normandy consequence tables remain consultation only', () => {
  for (const id of ['ME2-EQP-NORMANDY-ARMOR', 'ME2-EQP-NORMANDY-SHIELD', 'ME2-EQP-NORMANDY-GUN']) {
    const entry = EXPANSION2_ENTRIES.find(candidate => candidate.id === id);
    assert.equal(entry.mode, 'fleet');
    assert.equal(entry.simulation, null);
    assert.equal(runExpansionTrial(id, { mediaId: 'ME2', periodId: 'me2' }, { edition: 'legendary' }).ok, false);
    assert.match(entry.blockedReason, /(?:consultation|implément)/i);
  }
});
