import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { HORIZON_FLEET, HORIZON_FLEET_FAMILIES, normalizeHorizonFleetAtlas,
  getHorizonFleet, getHorizonFleetEntry, getHorizonFleetFrame, listHorizonFleet, canShowHorizonFleet } from '../src/horizon-fleet.js';
import { getHorizonFleetReferenceVisual } from '../src/horizon-fleet-reference.js';
import { canAccessContent } from '../src/continuity.js';

const read = family => JSON.parse(readFileSync(new URL(`../public/assets/horizon-fleet-${family}.json`, import.meta.url)));
const atlases = Object.fromEntries(HORIZON_FLEET_FAMILIES.map(family => [family, normalizeHorizonFleetAtlas(family, read(family))]));
const context = { mediaId: 'ME1', periodId: 'me1' };
const state = { flags: { briefed: true }, completed: ['citadel', 'virmire'] };

test('eight separate fixed hulls bind to their actual two local native PNGs', () => {
  assert.equal(HORIZON_FLEET.length, 8);
  assert.equal(new Set(HORIZON_FLEET.map(entry => entry.id)).size, 8);
  for (const family of HORIZON_FLEET_FAMILIES) {
    const raw = read(family), bytes = readFileSync(new URL(`../public/assets/${raw.file}`, import.meta.url));
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(bytes[25], 6, 'Native RGBA retains transparency.');
    assert.equal(bytes.readUInt32BE(16), raw.width); assert.equal(bytes.readUInt32BE(20), raw.height);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), raw.sha256);
    assert.equal(Object.keys(atlases[family].frames).length, 4);
  }
  for (const entry of HORIZON_FLEET) {
    const frame = getHorizonFleetFrame(entry.id, atlases);
    assert.equal(frame.file, entry.file); assert.equal(frame.id, entry.id);
    assert.ok(Object.isFrozen(entry) && Object.isFrozen(frame.rect));
    assert.equal(entry.status, 'Prototype'); assert.equal(entry.partial, true);
    assert.equal(entry.primaryVisualVerified, false);
    assert.equal(entry.weapons, undefined); assert.equal(entry.pilotable, undefined);
  }
});

test('bad or foreign atlas metadata cannot replace a registered family or reach UVs', () => {
  const mutations = [raw => { raw.file = '../other.png'; }, raw => { raw.width = NaN; },
    raw => { raw.sha256 = 'unknown'; }, raw => { delete raw.frames.sovereign; },
    raw => { raw.frames.sovereign.rect[2] = 99999; }, raw => { raw.frames.sovereign.pivot[0] = -1; },
    raw => { raw.frames.sovereign.rect = [...raw.frames['normandy-sr1'].rect]; }];
  for (const mutate of mutations) { const raw = read('me1'); mutate(raw); assert.equal(normalizeHorizonFleetAtlas('me1', raw), null); }
  assert.equal(normalizeHorizonFleetAtlas('later', read('me1')), null);
  assert.equal(getHorizonFleetFrame('tempest', atlases.me1), null);
  assert.equal(getHorizonFleet('__proto__'), null);
  const raw = read('me1'), normalized = normalizeHorizonFleetAtlas('me1', raw);
  raw.frames.sovereign.rect[0] = 9999;
  assert.notEqual(normalized.frames.sovereign.rect[0], 9999);
});

test('campaign recognition follows briefing, Citadel and Virmire without disclosing later hulls', () => {
  const fresh = { flags: {}, completed: [] };
  assert.deepEqual(listHorizonFleet(context, fresh).map(entry => entry.id), ['normandy-sr1']);
  fresh.flags.briefed = true;
  assert.deepEqual(listHorizonFleet(context, fresh).map(entry => entry.id), ['normandy-sr1', 'geth-dropship']);
  fresh.completed.push('citadel');
  assert.ok(getHorizonFleetEntry('destiny-ascension', context, fresh));
  assert.equal(getHorizonFleetEntry('sovereign', context, fresh), null);
  fresh.completed.push('virmire');
  assert.equal(listHorizonFleet(context, fresh).length, 4);
  assert.equal(listHorizonFleet(context, undefined).length, 0);
});

test('only authored ME1 world placements open, including explicit foreign-scope refusals', () => {
  assert.equal(canShowHorizonFleet('sovereign', context, state, 'citadel-finale'), true);
  assert.equal(canShowHorizonFleet('sovereign', context, state, 'virmire'), false);
  assert.equal(canShowHorizonFleet('geth-dropship', context, state, 'therum'), true);
  assert.equal(canShowHorizonFleet('geth-dropship', context, state, 'normandy'), false);
  for (const foreign of [{ mediaId: 'ME2' }, { periodId: 'me2' }, { galaxy: 'andromeda' },
    { context: { mediaId: 'MEA', periodId: 'mea' } }, { context: { mediaId: 'ME1', periodId: 'me1', galaxy: 'andromeda' } }]) {
    assert.equal(canShowHorizonFleet('normandy-sr1', context, { ...state, ...foreign }, 'citadel'), false);
  }
  for (const entry of HORIZON_FLEET.filter(entry => entry.mediaId !== 'ME1')) {
    assert.equal(canShowHorizonFleet(entry.id, { mediaId: entry.mediaId, periodId: entry.periodIds[0] }, state, 'citadel'), false);
    assert.equal(getHorizonFleetEntry(entry.id, context, state), null);
  }
});

test('the final retires active Sovereign and Ascension props while historical dossiers stay known', () => {
  for (const choice of ['save-council', 'focus-sovereign']) {
    const ended = { ...state, completed: [...state.completed, 'citadel-finale'], choices: { 'citadel-finale': choice } };
    assert.equal(canShowHorizonFleet('sovereign', context, ended, 'citadel-finale'), false);
    assert.equal(canShowHorizonFleet('destiny-ascension', context, ended, 'citadel'), false);
    assert.ok(getHorizonFleetEntry('sovereign', context, ended));
    assert.ok(getHorizonFleetEntry('destiny-ascension', context, ended));
    assert.equal(listHorizonFleet(context, ended).length, 4);
  }
});

test('documentary drawings require actual catalogue access in the exact work and segment', () => {
  const cases = [['ME2-ZON-NORMANDY-CIC', 'ME2', 'me2', 'normandy-sr2-cerberus'],
    ['ME3-ZON-NORM-CIC', 'ME3', 'me3', 'normandy-sr2-alliance'],
    ['MEA-ZON-TEMPEST-BRIDGE', 'MEA', 'mea', 'tempest'],
    ['MEA-WRL-HYPERION', 'MEA', 'mea', 'hyperion'],
    ['MEA-MQ-HYPERION', 'MEA', 'mea-prologue', 'hyperion']];
  for (const [recordId, mediaId, periodId, shipId] of cases) {
    const exact = { mediaId, periodId };
    assert.equal(canAccessContent(recordId, exact).ok, true);
    const visual = getHorizonFleetReferenceVisual(recordId, exact, atlases);
    assert.equal(visual.id, `horizon-fleet:${shipId}`);
    assert.match(visual.caption, /^Vaisseau associé à ce lieu/);
    assert.equal(visual.partial, true); assert.equal(visual.primaryVisualVerified, false);
    assert.match(visual.src, /^\.\/assets\/horizon-fleet-/);
    assert.equal(getHorizonFleetReferenceVisual(recordId, context, atlases), null);
    assert.equal(getHorizonFleetReferenceVisual(recordId, exact, {}), null);
    assert.equal(getHorizonFleetReferenceVisual(recordId, { ...exact, year: 2186 }, atlases), null);
  }
  assert.equal(getHorizonFleetReferenceVisual('ME2-ZON-NORMANDY-CIC', { mediaId: 'ME2', periodId: 'me2-opening' }, atlases), null);
  assert.equal(getHorizonFleetReferenceVisual('MEA-ZON-TEMPEST-BRIDGE', { mediaId: 'MEA', periodId: 'mea-prologue' }, atlases), null);
  assert.equal(getHorizonFleetReferenceVisual('MEA-WRL-HYPERION', { mediaId: 'MEA', periodId: 'mea-apex' }, atlases), null);
  for (const entry of HORIZON_FLEET.filter(entry => entry.mediaId !== 'ME1')) {
    const exact = { mediaId: entry.mediaId, periodId: entry.periodIds[0] };
    assert.equal(canAccessContent(entry.catalogId, exact).ok, false, 'Broad future specifications stay closed.');
    assert.equal(getHorizonFleetReferenceVisual(entry.catalogId, exact, atlases), null);
  }
});

test('reference results are detached drawings and never grant a ship, action or inventory mutation', () => {
  const snapshot = JSON.stringify(state), metadata = JSON.stringify(atlases),
    visual = getHorizonFleetReferenceVisual('MEA-WRL-HYPERION', { mediaId: 'MEA', periodId: 'mea' }, atlases);
  visual.sourceRect[0] = 123456; visual.periodIds.push('me1');
  const again = getHorizonFleetReferenceVisual('MEA-WRL-HYPERION', { mediaId: 'MEA', periodId: 'mea' }, atlases);
  assert.notEqual(again.sourceRect[0], 123456); assert.ok(!again.periodIds.includes('me1'));
  assert.equal(again.playable, undefined); assert.equal(again.actionId, undefined);
  assert.equal(JSON.stringify(state), snapshot); assert.equal(JSON.stringify(atlases), metadata);
});
