import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { UNIVERSE_WORKS } from '../src/universe-data.js';
import { canAccessContent } from '../src/continuity.js';
import { canRunMedicalBench } from '../src/expansion-medical-bench.js';
import { renderExpansion } from '../src/expansion-ui.js';
import { EXPANSION_ENTRIES, EXPANSION2_ENTRIES, EXPANSION3_ENTRIES,
  EXPANSION3_GROUPS, EXPANSION_ALL_ENTRIES, EXPANSION_BATCHES,
  getExpansionEntry, listExpansionEntries, canRunExpansionEntry, runExpansionTrial } from '../src/expansion.js';

const contexts = UNIVERSE_WORKS.flatMap(work => work.periods.map(period => ({ mediaId: work.id, periodId: period.id })));
const contextFor = entry => contexts.find(context => canAccessContent(entry.id, context).ok);
const optionsFor = entry => ({ seed: 17, difficulty: 'normal', edition: entry.constraints?.editionProfile || 'standard' });
const run = entry => runExpansionTrial(entry.id, contextFor(entry), optionsFor(entry));

test('third lot exposes actual stock, no duplicate identities and the unchanged legacy default', () => {
  assert.equal(EXPANSION3_ENTRIES.length, 122);
  assert.equal(EXPANSION_ALL_ENTRIES.length, 498);
  assert.equal(new Set(EXPANSION_ALL_ENTRIES.map(entry => entry.id)).size, 498);
  assert.deepEqual(EXPANSION_ALL_ENTRIES.slice(0, 376), [...EXPANSION_ENTRIES, ...EXPANSION2_ENTRIES]);
  assert.deepEqual(Object.fromEntries(EXPANSION3_GROUPS.map(group => [group.id, group.entries.length])),
    { actor: 40, armor: 2, weapon: 40, fleet: 0, enemy: 40 });
  assert.deepEqual(EXPANSION_BATCHES.map(batch => batch.count), [200, 176, 122]);
  assert.ok(EXPANSION3_ENTRIES.filter(entry => entry.mode === 'armor').every(entry => entry.record.category === 'powers'));
  for (const context of contexts) {
    assert.deepEqual(listExpansionEntries(context), listExpansionEntries(context, 'all', 'lot1'));
    assert.equal(listExpansionEntries(context, 'all', 'all').length,
      ['lot1', 'lot2', 'lot3'].reduce((sum, batch) => sum + listExpansionEntries(context, 'all', batch).length, 0));
    assert.deepEqual(listExpansionEntries(context, 'fleet', 'lot3'), []);
  }
});

test('all 122 identities preserve their source context and reject caller-supplied permissions', () => {
  for (const entry of EXPANSION3_ENTRIES) {
    assert.equal(entry.identitySourceVerified, true, entry.id);
    assert.equal(entry.record.fact, true, entry.id);
    assert.ok(Object.isFrozen(entry)); assert.ok(Object.isFrozen(entry.notes));
    for (const context of contexts)
      assert.equal(!!getExpansionEntry(entry.id, context), canAccessContent(entry.id, context).ok, entry.id);
    const context = contextFor(entry), options = optionsFor(entry);
    assert.ok(context);
    for (const extra of [{ unlocked: true }, { attack: 999 }, { medicalBench: 'medical-me2' }, { sourceIds: entry.sourceIds }])
      assert.equal(runExpansionTrial(entry.id, context, { ...options, ...extra }).ok, false, entry.id);
    assert.equal(getExpansionEntry(entry.id, { ...context, year: 2186 }), null);
  }
});

test('DLC preparations, prologue and consultation states stay distinct', () => {
  for (const entry of EXPANSION3_ENTRIES.filter(entry => entry.constraints?.editionProfile)) {
    assert.equal(runExpansionTrial(entry.id, contextFor(entry), { edition: 'standard' }).ok, false);
  }
  const prologue = { mediaId: 'MEA', periodId: 'mea-prologue' };
  for (const id of ['MEA-NPC-FISHER', 'MEA-NPC-GREER', 'MEA-NPC-KIRKLAND']) {
    assert.ok(getExpansionEntry(id, prologue));
    assert.equal(getExpansionEntry(id, { mediaId: 'MEA', periodId: 'mea' }), null);
  }
  assert.equal(runExpansionTrial('ME3-NPC-BROOKS', { mediaId: 'ME3', periodId: 'me3' }, { edition: 'legendary' }).ok, true);
  assert.equal(runExpansionTrial('ME3-ENM-BROOKS', { mediaId: 'ME3', periodId: 'me3' }, { edition: 'legendary' }).ok, false);
  for (const id of ['ME3-ENM-COLLECTOR-TROOPER', 'MEA-ENM-OBSERVER', 'INF-ENM-OGRE']) {
    const entry = EXPANSION3_ENTRIES.find(item => item.id === id);
    assert.equal(run(entry).ok, false, id);
  }
});

test('38 native studies replay exactly and 84 consultations cannot launch a substituted duel', () => {
  const before = JSON.stringify(EXPANSION_ALL_ENTRIES);
  let runnable = 0, closed = 0;
  for (const entry of EXPANSION3_ENTRIES) {
    const trial = run(entry);
    assert.equal(trial.ok, canRunExpansionEntry(entry.id, contextFor(entry), optionsFor(entry)).ok);
    if (!trial.ok) { closed++; assert.ok(trial.reason); continue; }
    runnable++;
    assert.deepEqual(trial, run(entry), entry.id);
    assert.equal(Object.hasOwn(trial, 'reward'), false);
    assert.equal(Object.hasOwn(trial, 'cleared'), false);
    assert.equal(trial.result.kind, entry.bench ? 'equipment-bench' : 'atb');
    if (!entry.bench) assert.ok(trial.result.orders > 0 && trial.result.elapsed <= 90.1);
  }
  assert.equal(runnable, 38); assert.equal(closed, 84);
  assert.equal(JSON.stringify(EXPANSION_ALL_ENTRIES), before);
});

test('medical orders spend one shared dose, revive two KO actors and refuse excluded or exhausted attempts', () => {
  for (const entry of EXPANSION3_ENTRIES.filter(entry => entry.bench)) {
    const trial = run(entry), result = trial.result, context = contextFor(entry);
    assert.equal(result.medical, true);
    assert.equal(result.before.doses, 1); assert.equal(result.after.doses, 0);
    assert.equal(result.revived.length, 2);
    assert.equal(result.resourceEvents.length, 1);
    assert.equal(result.resourceEvents[0].spent, 1);
    assert.equal(result.after.excludedHp, 0); assert.equal(result.after.woundedHp, result.before.woundedHp);
    assert.equal(result.after.medicAtb, 0);
    assert.equal(result.rejectedExhaustedOrder, true); assert.equal(result.exhaustionReadyAtb, 100);
    assert.equal(result.exhaustedPatientHp, 0); assert.match(result.exhaustionReason, /médi-gel/);
    assert.equal(result.rejectedExcludedTarget, true); assert.equal(result.rejectedNoPatient, true);
    for (const patch of [{ parentRecordId: 'EQP-medi-gel' }, { actionId: 'unity' }, { bonus: 99 }])
      assert.equal(canRunMedicalBench({ ...entry, bench: { ...entry.bench, ...patch } }, context).ok, false);
    assert.equal(canRunMedicalBench(entry, { mediaId: 'ME1', periodId: 'me1' }).ok, false);
  }
});

test('medical view exposes primary evidence, actual refusal and an isolated five-column result', () => {
  for (const entry of EXPANSION3_ENTRIES.filter(entry => entry.bench)) {
    const context = contextFor(entry), result = run(entry), options = optionsFor(entry);
    const view = { context, works: UNIVERSE_WORKS, expansion: {
      entries: [entry], selected: entry, access: { ok: true }, groups: EXPANSION3_GROUPS,
      batches: EXPANSION_BATCHES, result,
    } };
    const ui = { expansionBatch: 'lot3', expansionMode: 'armor', expansionSeed: options.seed,
      expansionDifficulty: options.difficulty, expansionEdition: options.edition };
    const before = JSON.stringify(view);
    const html = renderExpansion(view, ui);
    assert.match(html, /data-expansion-primary-source/);
    assert.ok(html.includes(entry.primaryEvidence.url));
    assert.match(html, /Lancer le banc de secours/); assert.match(html, /Banc de secours ·/);
    assert.match(html, /data-expansion-medical-resource/); assert.match(html, /2 équipiers de test relevés/);
    assert.match(html, /Nouvel ordre refusé sans médi-gel/);
    assert.equal(JSON.stringify(view), before);
  }
});

test('all 242 published results remain exact and all previous consultation gates stay closed', async () => {
  let replayed = 0, closed = 0;
  for (const filename of ['expansion-native-report.json', 'expansion2-native-report.json']) {
    const previous = JSON.parse(await readFile(new URL(`../docs/qa/${filename}`, import.meta.url), 'utf8'));
    for (const card of previous.cards) {
      const trial = runExpansionTrial(card.id, card.testedContext, card.testedOptions);
      assert.equal(trial.ok, card.executable, card.id);
      if (!trial.ok) { closed++; continue; }
      assert.deepEqual(trial.result, card.result, card.id);
      assert.deepEqual(trial.control, card.control, card.id);
      replayed++;
    }
  }
  assert.equal(replayed, 242); assert.equal(closed, 134);
});
