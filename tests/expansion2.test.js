import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { UNIVERSE_WORKS } from '../src/universe-data.js';
import { canAccessContent } from '../src/continuity.js';
import { getUniverseEquipment } from '../src/universe-equipment.js';
import { canRunExpansionBench } from '../src/expansion-bench.js';
import { EXPANSION_ENTRIES, EXPANSION2_ENTRIES, EXPANSION_ALL_ENTRIES, listExpansionEntries,
  getExpansionEntry, canRunExpansionEntry, runExpansionTrial } from '../src/expansion.js';

const contexts = UNIVERSE_WORKS.flatMap(work => work.periods.map(period => ({ mediaId: work.id, periodId: period.id })));
const contextFor = entry => contexts.find(context => canAccessContent(entry.id, context).ok);
const optionsFor = entry => ({ seed: 17, difficulty: 'normal', edition: entry.constraints?.editionProfile || 'standard' });
const run = id => { const entry = EXPANSION2_ENTRIES.find(entry => entry.id === id); return runExpansionTrial(id, contextFor(entry), optionsFor(entry)); };

test('second lot uses actual stock and keeps all old identities separate', () => {
  assert.equal(EXPANSION_ENTRIES.length, 200); assert.equal(EXPANSION2_ENTRIES.length, 176);
  assert.equal(EXPANSION_ALL_ENTRIES.length, 376);
  assert.equal(new Set(EXPANSION_ALL_ENTRIES.map(entry => entry.id)).size, 376);
  assert.deepEqual(Object.fromEntries(['actor', 'armor', 'weapon', 'fleet', 'enemy'].map(mode =>
    [mode, EXPANSION2_ENTRIES.filter(entry => entry.mode === mode).length])), { actor: 40, armor: 30, weapon: 40, fleet: 26, enemy: 40 });
  for (const context of contexts) {
    assert.deepEqual(listExpansionEntries(context), listExpansionEntries(context, 'all', 'lot1'));
    assert.equal(listExpansionEntries(context, 'all', 'all').length,
      listExpansionEntries(context, 'all', 'lot1').length + listExpansionEntries(context, 'all', 'lot2').length);
    assert.deepEqual(listExpansionEntries(context, 'all', 'forged'), []);
  }
});

test('all new cards retain canonical context and closure; packs cannot be injected as options', () => {
  let open = 0, closed = 0;
  for (const entry of EXPANSION2_ENTRIES) {
    assert.equal(entry.record.fact, true); assert.equal(entry.identitySourceVerified, true);
    assert.ok(Object.isFrozen(entry)); assert.ok(Object.isFrozen(entry.notes));
    const own = contextFor(entry); assert.ok(own);
    for (const context of contexts) assert.equal(!!getExpansionEntry(entry.id, context), canAccessContent(entry.id, context).ok);
    const access = canRunExpansionEntry(entry.id, own, optionsFor(entry));
    if (access.ok) open++; else { closed++; assert.ok(access.reason); assert.equal(runExpansionTrial(entry.id, own, optionsFor(entry)).ok, false); }
    assert.equal(runExpansionTrial(entry.id, own, { ...optionsFor(entry), batch: 'all', unlocked: true }).ok, false);
  }
  assert.equal(open, 97); assert.equal(closed, 79);
});

test('APEX, original ME3 multiplayer and Hyperion prologue do not become solo or Legendary content', () => {
  const apex = EXPANSION2_ENTRIES.filter(entry => entry.record.availability.some(scope => scope.periodIds.includes('mea-apex')));
  assert.ok(apex.length >= 7);
  for (const entry of apex) {
    assert.ok(getExpansionEntry(entry.id, { mediaId: 'MEA', periodId: 'mea-apex' }));
    assert.equal(getExpansionEntry(entry.id, { mediaId: 'MEA', periodId: 'mea' }), null);
  }
  assert.equal(runExpansionTrial('MEA-MQ-HYPERION', { mediaId: 'MEA', periodId: 'mea' }).ok, false);
  assert.equal(runExpansionTrial('MEA-MQ-HYPERION', { mediaId: 'MEA', periodId: 'mea-prologue' }).ok, true);
  assert.equal(runExpansionTrial('ME3-ENM-DRAGOON', { mediaId: 'ME3', periodId: 'me3-multiplayer' }, { edition: 'legendary' }).ok, false);
});

test('forty conventional weapons use exact finite equipment resources and no heat fallback', () => {
  for (const entry of EXPANSION2_ENTRIES.filter(entry => entry.mode === 'weapon')) {
    const native = getUniverseEquipment(entry.id), trial = run(entry.id);
    assert.equal(trial.ok, true, entry.id);
    const actor = trial.result.initial.find(actor => actor.id === `study:${entry.id}`);
    assert.equal(actor.ammo, native.ammo); assert.equal(actor.reserveAmmo, native.reserveAmmo);
    assert.equal(actor.magazineCapacity, native.magazineCapacity); assert.equal(Object.hasOwn(actor, 'heat'), false);
    assert.ok(trial.result.orders > 0); assert.ok(trial.result.elapsed <= 90.1);
  }
});

test('equipment comparisons execute real native damage, conserved ammunition and power cooldowns', () => {
  const omni = run('EQP-omni-outil').result, biotic = run('EQP-amplificateur-biotique').result;
  assert.ok(omni.after.targetShield < omni.control.targetShield);
  assert.ok(biotic.after.targetHp < biotic.control.targetHp);
  const barrel = run('ME3-EQP-BARREL').result;
  assert.ok(barrel.after.targetShield < barrel.control.targetShield);
  const magazine = run('ME3-EQP-MAGAZINE').result;
  assert.equal(magazine.control.ammo, 18); assert.equal(magazine.control.reserve, 72);
  assert.equal(magazine.after.ammo, 23); assert.equal(magazine.after.reserve, 67);
  assert.equal(magazine.before.ammo + magazine.before.reserve, magazine.after.ammo + magazine.after.reserve);
  const ultralight = run('ME3-EQP-ULTRALIGHT').result;
  assert.equal(ultralight.control.cooldown, 8); assert.equal(ultralight.after.cooldown, 7.2);
  assert.equal(ultralight.after.targetShield, ultralight.control.targetShield);
  for (const id of ['ME2-EQP-THERMAL', 'ME3-EQP-THERMAL']) {
    const result = run(id).result; assert.equal(result.before.ammo, 0);
    assert.equal(result.after.ammo + result.after.reserve, result.before.reserve);
    assert.equal(Object.hasOwn(result.after, 'heat'), false);
  }
});

test('finite grenade and cell benches exhaust charges and reject a ready fourth order after actual time', () => {
  for (const id of ['ME3-EQP-GRENADE-STOCK', 'MEA-EQP-POWER-CELLS']) {
    const result = run(id).result;
    assert.equal(result.before.grenades, 3); assert.equal(result.after.grenades, 0);
    assert.equal(result.actions, 3); assert.equal(result.rejectedFourthOrder, true);
    assert.equal(result.replenishmentObserved, false); assert.equal(result.after.atb, 100);
    assert.match(result.rejectionReason, /grenade|charge|réserve/i);
  }
});

test('curated parent, action and compatibility cannot be replaced by caller data', () => {
  for (const entry of EXPANSION2_ENTRIES.filter(entry => entry.bench)) {
    const context = contextFor(entry);
    assert.equal(canRunExpansionBench(entry, context).ok, true);
    for (const patch of [{ parentRecordId: 'MEA-WPN-PAW' }, { actionId: 'unity' }, { effect: 999 }])
      assert.equal(canRunExpansionBench({ ...entry, bench: { ...entry.bench, ...patch } }, context).ok, false);
    assert.deepEqual(run(entry.id), run(entry.id));
  }
});

test('all 145 previous native outcomes remain exactly equal to the published first lot', async () => {
  const prior = JSON.parse(await readFile(new URL('../docs/qa/expansion-native-report.json', import.meta.url), 'utf8'));
  let checked = 0;
  for (const card of prior.cards) {
    const trial = runExpansionTrial(card.id, card.testedContext, card.testedOptions);
    assert.equal(trial.ok, card.executable, card.id);
    if (trial.ok) { assert.deepEqual(trial.result, card.result, card.id); assert.deepEqual(trial.control, card.control, card.id); checked++; }
  }
  assert.equal(checked, 145);
});
