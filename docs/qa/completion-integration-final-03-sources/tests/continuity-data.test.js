import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { MEDIA_PERIODS, COMMON28, getMediaPeriod, getEntryContinuity, evaluateContinuity } from '../src/continuity-data.js';
import { UNIVERSE_WORKS, UNIVERSE_RECORDS, UNIVERSE_GROUPS, UNIVERSE_SUMMARY, getUniverseRecord, getUniverseRecords } from '../src/universe-data.js';
import { buildUniverseRuntime } from '../scripts/build-universe-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = async name => JSON.parse(await readFile(new URL(`../${name}`, import.meta.url), 'utf8'));
const allowed = (id, mediaId, periodId, extra = {}) => evaluateContinuity(getUniverseRecord(id), { mediaId, periodId, ...extra });

test('the 28 immutable works and every original catalogue row retain their IDs, statuses and provenance', async () => {
  const manifest = await json('docs/universe/manifest.json');
  assert.equal(COMMON28.length, 28);
  assert.equal(new Set(COMMON28).size, 28);
  assert.deepEqual(COMMON28, ['ME1', ...manifest.workbooks.map(work => work.id)]);
  assert.deepEqual(UNIVERSE_WORKS.map(work => work.id), COMMON28);
  const inputs = [{ id: 'ME1', catalogPath: 'docs/content-catalog.json' }, ...manifest.workbooks];
  let count = 0, sources = 0;
  for (const input of inputs) {
    const original = await json(input.catalogPath), work = UNIVERSE_WORKS.find(item => item.id === input.id);
    assert.deepEqual(work.sources, original.sources);
    assert.equal(work.count, original.entries.length);
    sources += original.sources.length;
    for (const entry of original.entries) {
      const actual = getUniverseRecord(entry.id);
      assert.ok(actual, entry.id);
      for (const key of ['name', 'category', 'status', 'description', 'reference', 'notes', 'conditions']) {
        assert.equal(actual[key], entry[key] || '', `${entry.id}/${key}`);
      }
      assert.equal(actual.catalogWorkId, input.id);
      assert.equal(actual.provenance.catalogPath, input.catalogPath);
      assert.deepEqual(actual.dependencies, entry.dependencies || []);
      assert.equal(actual.playable, false);
      if (input.id !== 'ME1') assert.equal(actual.nature, entry.nature);
      else assert.equal(actual.canonLevel, entry.canonLevel);
      count++;
    }
    for (const segment of work.periods) for (const sourceId of segment.sourceIds) {
      assert.ok(original.sources.some(source => source.id === sourceId), `${input.id}/${segment.id}/${sourceId}`);
    }
  }
  assert.equal(UNIVERSE_RECORDS.length, count);
  assert.equal(UNIVERSE_SUMMARY.recordCount, count);
  assert.equal(UNIVERSE_SUMMARY.sourceCount, sources);
  assert.equal(UNIVERSE_SUMMARY.playableCount, 0);
  assert.ok(Object.isFrozen(UNIVERSE_WORKS));
  assert.ok(Object.isFrozen(UNIVERSE_RECORDS[0].provenance.sourceIds));
});

test('a shared character name, year or galaxy never opens content from another work', () => {
  assert.equal(allowed('ME3-CHR-SHEPARD', 'ME3', 'me3'), true);
  assert.equal(allowed('ME3-CHR-SHEPARD', 'ME1', 'me1'), false);
  assert.equal(allowed('ME3-CHR-SHEPARD', 'ME2', 'me2'), false);
  assert.equal(allowed('ME3-CHR-SHEPARD', 'ME3', 'me3', { galaxy: 'andromeda' }), false);
  assert.equal(allowed('ME3-CHR-SHEPARD', 'ME3', 'me3', { year: 2186 }), true);
  assert.equal(evaluateContinuity(getUniverseRecord('ME3-CHR-SHEPARD'), { year: 2186, galaxy: 'milky-way' }), false);
  assert.equal(getMediaPeriod('ME3', 'me2'), null);
  assert.equal(getMediaPeriod('__proto__'), null);
});

test('Homeworlds separates childhood, family and Archangel, including within the same issue', () => {
  // Scene locator rows are still À vérifier in the source catalogue. Knowing
  // a protagonist's identity is not proof of an age-specific appearance.
  assert.equal(allowed('HOM-SC-VEGA-YOUTH-REF', 'HOM', 'hom-1-youth'), false);
  assert.equal(allowed('HOM-SC-VEGA-YOUTH-REF', 'HOM', 'hom-1-present'), false);
  assert.equal(allowed('HOM-ACT-JOSH', 'HOM', 'hom-1-youth'), false);
  assert.equal(allowed('HOM-ACT-JOSH', 'HOM', 'hom-1-present'), false);
  assert.equal(allowed('HOM-ACT-FATHER', 'HOM', 'hom-3-past'), false);
  assert.equal(allowed('HOM-ACT-FATHER', 'HOM', 'hom-3-omega'), false);
  assert.equal(allowed('HOM-ACT-SIDONIS', 'HOM', 'hom-3-past'), false);
  assert.equal(allowed('HOM-ACT-SIDONIS', 'HOM', 'hom-3-omega'), false);
  assert.equal(allowed('HOM-ACT-LIARA', 'HOM', 'hom-4-liara'), true);
  assert.equal(allowed('HOM-ACT-LIARA', 'HOM', 'hom-1-present'), false);
  assert.equal(allowed('HOM-REF-ISSUE4', 'HOM', 'hom-4-liara'), true);
  assert.deepEqual(getUniverseRecord('HOM-REF-SCOPE').availability, []);
  assert.equal(evaluateContinuity(getUniverseRecord('HOM-ACT-TALI'), { mediaId: 'HOM' }), false);
});

test('Foundation scenes do not make its whole cast simultaneous or make Rasa and the clone generic recruits', () => {
  assert.equal(allowed('FOU-ACT-WREX', 'FOU', 'fou-2'), false);
  assert.equal(allowed('FOU-ACT-WREX', 'FOU', 'fou-4'), false);
  assert.equal(allowed('FOU-ACT-RAHNA', 'FOU', 'fou-4'), false);
  assert.equal(allowed('FOU-ACT-RAHNA', 'FOU', 'fou-13'), false);
  assert.equal(allowed('FOU-ACT-MIRANDA', 'FOU', 'fou-5'), true);
  assert.equal(allowed('FOU-ACT-MIRANDA', 'FOU', 'fou-6'), false);
  assert.equal(allowed('FOU-SC-05-REF', 'FOU', 'fou-5'), true);
  assert.equal(allowed('FOU-SC-13-REF', 'FOU', 'fou-13'), false);
  assert.equal(allowed('FOU-SC-13-REF', 'FOU', 'fou-5'), false);
  assert.deepEqual(getUniverseRecord('FOU-ACT-RASA').availability, []);
});

test('collections, fiction, cut material, uncertainty and adaptation remain closed', () => {
  for (const id of ['LIB', 'BLA', 'ME4', 'CUT']) {
    const work = getMediaPeriod(id);
    assert.equal(work.locked, true);
    assert.deepEqual(work.periods, []);
    assert.ok(work.reason);
    for (const record of UNIVERSE_RECORDS.filter(record => record.catalogWorkId === id)) {
      assert.deepEqual(record.availability, [], record.id);
      assert.equal(record.playable, false);
    }
  }
  assert.equal(getUniverseRecord('HOM-KIT-PROOF').fact, false);
  const prospective = UNIVERSE_WORKS.find(work => work.id === 'ME4');
  assert.equal(prospective.title, 'Mass Effect suivant — dossier prospectif');
  assert.match(prospective.verificationNote, /n’a pas été validée/);
  assert.match(prospective.canonNote, /n’a pas été validée/);
  assert.doesNotMatch(prospective.title, /annul/i);
  assert.ok(!UNIVERSE_GROUPS.equipment.some(record => record.id === 'HOM-KIT-PROOF'));
  assert.equal(allowed('GAL-CNT-DATE', 'GAL', 'gal'), false);
  assert.equal(getEntryContinuity('ME1', { id: 'future', episode: 'ME3', canonLevel: 'Adaptation' }).mediaId, 'ME3');
  assert.deepEqual(getEntryContinuity('HOM', { id: 'unknown', nature: 'Établi', sourceIds: ['some-source'] }).availability, []);
  assert.deepEqual(getUniverseRecords({ mediaId: 'ME2', periodId: 'me2' }, { group: 'unknown' }), []);
  assert.deepEqual(getUniverseRecords({ mediaId: 'ME2', periodId: 'me2' }, { group: '__proto__' }), []);
});

test('prologues, multiplayer, postwar events and uncertain Paragon Lost actors are distinct contexts', () => {
  assert.equal(allowed('ME3-CHR-ANDERSON', 'ME3', 'me3-prologue'), true);
  assert.equal(allowed('ME3-CHR-ANDERSON', 'ME3', 'me3'), false);
  assert.equal(allowed('ME3-ENM-HUSK', 'ME3', 'me3-prologue'), false);
  assert.equal(allowed('ME3-ZON-MP-DAGGER', 'ME3', 'me3'), false);
  assert.equal(allowed('ME3-ZON-MP-DAGGER', 'ME3', 'me3-multiplayer'), true);
  assert.equal(allowed('MEA-CHR-ALEC', 'MEA', 'mea-prologue'), true);
  assert.equal(allowed('MEA-CHR-ALEC', 'MEA', 'mea'), false);
  assert.equal(allowed('MEA-ENM-CHOSEN', 'MEA', 'mea-prologue'), false);
  assert.equal(allowed('MEA-CHR-LIAM', 'MEA', 'mea-prologue'), false);
  assert.equal(allowed('MEA-CHR-RYDER', 'MEA', 'mea-prologue'), true);
  assert.equal(allowed('EVO-SC-RESIST-REF', 'EVO', 'evo-contact'), true);
  assert.equal(allowed('EVO-SC-RESIST-REF', 'EVO', 'evo-aftermath'), false);
  assert.equal(allowed('PL-CHR-VEGA', 'PL', 'pl-collectors'), true);
  assert.deepEqual(getUniverseRecord('PL-CHR-MASON').availability, []);
});

test('uncertain dates stay nonnumeric, and intergalactic transit is not a Heleus scene', () => {
  for (const id of ['gal', 'ann', 'pl-2183', 'pl-collectors']) {
    const segment = MEDIA_PERIODS.flatMap(media => media.periods).find(period => period.id === id);
    assert.equal(segment.yearStart, null);
    assert.equal(segment.yearEnd, null);
    assert.ok(segment.uncertainty);
  }
  assert.equal(getMediaPeriod('REV', 'rev').yearStart, 2165);
  assert.equal(getMediaPeriod('ANN').galaxy, 'unknown');
  assert.equal(getMediaPeriod('DIS').galaxy, 'milky-way');
  assert.equal(getMediaPeriod('INI').galaxy, 'milky-way');
  assert.equal(getMediaPeriod('NEX').galaxy, 'andromeda');
  assert.equal(allowed('ANN-REF-DARKSPACE', 'ANN', 'ann', { galaxy: 'andromeda' }), false);
});

test('the generated registry is reproducible from current inputs without editing them', async () => {
  const { source } = await buildUniverseRuntime(root);
  assert.equal(await readFile(new URL('../src/universe-data.js', import.meta.url), 'utf8'), source);
});
