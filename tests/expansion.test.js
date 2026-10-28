import test from 'node:test';
import assert from 'node:assert/strict';
import { UNIVERSE_WORKS } from '../src/universe-data.js';
import { canAccessContent } from '../src/continuity.js';
import { EXPANSION_ENTRIES, EXPANSION_GROUPS, getExpansionEntry, listExpansionEntries,
  canRunExpansionEntry, runExpansionTrial } from '../src/expansion.js';
import { CHRONICLE_SCENARIOS } from '../src/universe-actors.js';

const contexts = UNIVERSE_WORKS.flatMap(work => work.periods.map(period => ({ mediaId: work.id, periodId: period.id })));
const contextFor = entry => contexts.find(context => canAccessContent(entry.id, context).ok);
const optionsFor = entry => ({ edition: entry.constraints?.editionProfile || 'standard', seed: 17, difficulty: 'normal' });

test('five curated batches remain separate from historical parties and equipment', () => {
  assert.equal(EXPANSION_GROUPS.length, 5);
  assert.ok(EXPANSION_GROUPS.every(group => group.entries.length === 40));
  assert.equal(EXPANSION_ENTRIES.length, 200);
  assert.equal(new Set(EXPANSION_ENTRIES.map(entry => entry.id)).size, 200);
  assert.equal(CHRONICLE_SCENARIOS.length, 25);
  for (const entry of EXPANSION_ENTRIES) {
    assert.equal(entry.record.fact, true, entry.id);
    assert.equal(entry.identitySourceVerified, true, entry.id);
    assert.ok(contextFor(entry), `No authorized published context: ${entry.id}`);
    assert.equal(entry.partial, true);
    assert.equal(entry.statsBasis, 'ATB adaptation');
    assert.ok(Object.isFrozen(entry)); assert.ok(Object.isFrozen(entry.notes));
    assert.ok(Object.isFrozen(entry.limitations));
    assert.ok(entry.limitations.length);
  }
});

test('all 200 identities retain exact canonical work and period restrictions', () => {
  for (const entry of EXPANSION_ENTRIES) {
    for (const context of contexts) assert.equal(!!getExpansionEntry(entry.id, context),
      canAccessContent(entry.id, context).ok, `${entry.id}/${context.mediaId}/${context.periodId}`);
    assert.equal(getExpansionEntry(entry.id, { ...contextFor(entry), year: 2186 }), null);
    assert.equal(getExpansionEntry(entry.id, { mediaId: 'ME4', periodId: 'me4' }), null);
  }
  assert.deepEqual(listExpansionEntries(null), []);
  assert.deepEqual(listExpansionEntries({ mediaId: 'ME3', periodId: 'me3' }, '__proto__'), []);
});

test('inspection and edition gates cannot be bypassed by a forged control payload', () => {
  let closed = 0, gated = 0;
  for (const entry of EXPANSION_ENTRIES) {
    const context = contextFor(entry), options = optionsFor(entry);
    const reason = entry.blockedReason || entry.constraints?.blockedReason;
    if (reason) {
      closed++;
      assert.equal(canRunExpansionEntry(entry.id, context, options).ok, false);
      assert.equal(runExpansionTrial(entry.id, context, options).ok, false);
    } else if (entry.constraints?.editionProfile) {
      gated++;
      assert.equal(canRunExpansionEntry(entry.id, context, { ...options, edition: 'standard' }).ok, false);
      assert.equal(canRunExpansionEntry(entry.id, context, options).ok, true, entry.id);
    }
  }
  assert.ok(closed > 20); assert.ok(gated > 10);
  const entry = EXPANSION_ENTRIES.find(entry => canRunExpansionEntry(entry.id, contextFor(entry), optionsFor(entry)).ok);
  const context = contextFor(entry), options = optionsFor(entry);
  for (const bad of [null, [], { ...options, attack: 999 }, { ...options, unlocked: true },
    { ...options, seed: 0 }, { ...options, seed: Infinity }, { ...options, seed: 1.1 },
    { ...options, difficulty: 'god' }, { ...options, edition: 'all-packs' },
    Object.create(options), { ...options, simulation: entry.simulation }]) {
    assert.equal(runExpansionTrial(entry.id, context, bad).ok, false);
  }
  let called = false;
  assert.equal(runExpansionTrial(entry.id, context, { get seed() { called = true; return 17; } }).ok, false);
  assert.equal(called, false);
});

test('real engine trials are bounded, reproducible and leave definitions unchanged', () => {
  const before = JSON.stringify(EXPANSION_ENTRIES);
  for (const mode of ['actor', 'armor', 'weapon', 'enemy']) {
    const entry = EXPANSION_ENTRIES.find(entry => entry.mode === mode
      && canRunExpansionEntry(entry.id, contextFor(entry), optionsFor(entry)).ok);
    const context = contextFor(entry), options = optionsFor(entry);
    const first = runExpansionTrial(entry.id, context, options), second = runExpansionTrial(entry.id, context, options);
    assert.deepEqual(first, second, entry.id);
    assert.equal(first.ok, true); assert.equal(first.result.kind, 'atb');
    assert.ok(first.result.elapsed > 0 && first.result.elapsed <= 90.1);
    assert.ok(first.result.orders > 0);
    assert.ok(first.result.actors.every(actor => actor.hp >= 0 && actor.hp <= actor.maxHp
      && actor.shield >= 0 && actor.shield <= actor.maxShield));
    assert.equal(!!first.control, mode === 'armor');
    assert.equal(Object.hasOwn(first, 'reward'), false);
    assert.equal(Object.hasOwn(first, 'cleared'), false);
  }
  assert.equal(JSON.stringify(EXPANSION_ENTRIES), before);
});

test('eight melee studies use contact, never a hidden clip or borrowed power', () => {
  const melee = EXPANSION_ENTRIES.filter(entry => entry.mode === 'weapon' && entry.simulation?.weaponSystem === 'melee');
  assert.equal(melee.length, 8);
  for (const entry of melee) {
    const trial = runExpansionTrial(entry.id, contextFor(entry), optionsFor(entry));
    assert.equal(trial.ok, true, entry.id);
    const subject = trial.result.actors.find(actor => actor.id === `study:${entry.id}`);
    assert.ok(subject);
    for (const key of ['ammo', 'reserveAmmo', 'heat']) assert.equal(Object.hasOwn(subject, key), false);
    assert.ok(trial.result.orders > 0);
  }
});

test('vehicles use three original logistical stages, never an infantry battle', () => {
  const fleet = EXPANSION_ENTRIES.filter(entry => entry.mode === 'fleet'
    && canRunExpansionEntry(entry.id, contextFor(entry), optionsFor(entry)).ok);
  assert.ok(fleet.length >= 20);
  for (const entry of fleet) {
    const trial = runExpansionTrial(entry.id, contextFor(entry), optionsFor(entry));
    assert.equal(trial.result.kind, 'logistics');
    assert.equal(Object.hasOwn(trial.result, 'actors'), false);
    assert.ok(trial.result.stages.length >= 1 && trial.result.stages.length <= 3);
    assert.ok(trial.result.stages.every(stage => stage.integrity >= 0 && stage.reserve >= 0));
  }
  const entry = fleet[0], options = optionsFor(entry), context = contextFor(entry);
  assert.deepEqual(runExpansionTrial(entry.id, context, options), runExpansionTrial(entry.id, context, options));
  assert.notDeepEqual(runExpansionTrial(entry.id, context, { ...options, seed: 1 }).result,
    runExpansionTrial(entry.id, context, { ...options, seed: 999999 }).result);
});
