import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getHorizonReferenceVisual, filterHorizonReferences } from '../src/horizon-reference-visuals.js';
import { normalizeHorizonFleetAtlas } from '../src/horizon-fleet.js';
import { normalizeHorizonFaunaAtlas } from '../src/horizon-fauna.js';
import { getUniverseRecord } from '../src/universe-data.js';
const asset = filename => JSON.parse(readFileSync(new URL(`../public/assets/${filename}`, import.meta.url)));
const atlases = {
  fleet:Object.fromEntries(['me1','later'].map(family => [family, normalizeHorizonFleetAtlas(family, asset(`horizon-fleet-${family}.json`))])),
  fauna:normalizeHorizonFaunaAtlas(asset('horizon-fauna.json')),
};

test('fleet and fauna references retain real catalogue period access and never grant party/combat imagery', () => {
  for (const [id, mediaId, periodId] of [['ME2-ZON-NORMANDY-CIC','ME2','me2'], ['ME3-ZON-NORM-CIC','ME3','me3'],
    ['MEA-ZON-TEMPEST-BRIDGE','MEA','mea'], ['MEA-MQ-HYPERION','MEA','mea-prologue'],
    ['ME2-ENM-VARRREN','ME2','me2'], ['ME2-SQ-TUCH-PYJAK','ME2','me2'], ['MEA-ENM-ADHI-WILD','MEA','mea'], ['MEA-ENM-KAERKYN','MEA','mea']]) {
    const context = {mediaId,periodId}, before = JSON.stringify(atlases);
    const reference = getHorizonReferenceVisual(id, context, {usage:'reference'}, atlases);
    assert.ok(reference, id); assert.equal(reference.partial, true);
    assert.ok(reference.sourceRect.every(Number.isFinite));
    assert.equal(getHorizonReferenceVisual(id, {mediaId:'ME1',periodId:'me1'}, {}, atlases), null);
    for (const usage of ['party','combat']) assert.equal(getHorizonReferenceVisual(id, context, {usage,scenarioId:'anything'}, atlases), null);
    assert.equal(JSON.stringify(atlases), before);
  }
  // A generated image cannot open a production-only SPR or a broad scene record.
  assert.equal(getHorizonReferenceVisual('SPR-VEH-sovereign', {mediaId:'ME1',periodId:'me1'}, {}, atlases), null);
  assert.equal(getHorizonReferenceVisual('MEA-SCN-TEMPEST', {mediaId:'MEA',periodId:'mea'}, {}, atlases), null);
});

test('illustrated filters preserve chapter access, reject the Tempest prologue and leave ordinary references alone', () => {
  const records = ['MEA-ZON-TEMPEST-BRIDGE','MEA-WRL-HYPERION','MEA-MQ-HYPERION','MEA-ENM-ADHI-WILD','MEA-ENM-KAERKYN'].map(getUniverseRecord);
  assert.deepEqual(filterHorizonReferences(records, {mediaId:'MEA',periodId:'mea'}, 'fleet', atlases).map(record => record.id), ['MEA-ZON-TEMPEST-BRIDGE','MEA-WRL-HYPERION']);
  assert.deepEqual(filterHorizonReferences(records, {mediaId:'MEA',periodId:'mea-prologue'}, 'fleet', atlases).map(record => record.id), ['MEA-MQ-HYPERION']);
  assert.deepEqual(filterHorizonReferences(records, {mediaId:'MEA',periodId:'mea'}, 'fauna', atlases).map(record => record.id), ['MEA-ENM-ADHI-WILD','MEA-ENM-KAERKYN']);
  assert.equal(filterHorizonReferences(records, {mediaId:'MEA',periodId:'mea'}, 'all', atlases), records);
  assert.deepEqual(filterHorizonReferences(records, {mediaId:'MEA',periodId:'apex'}, 'fleet', atlases), []);
});
