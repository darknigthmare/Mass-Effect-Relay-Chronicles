import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OPERATIONS, OPERATION_ENCOUNTERS, createOperationState, normalizeOperations, listOperations,
  operationPOIs, getOperationInteraction, advanceOperation, getOperationEncounter, finishOperationBattle, operationEffects,
} from '../src/operations.js';
import { renderOperationsJournal } from '../src/operations-ui.js';
import { newGame, zoneEncounters, winEncounter, completeZone, recruit, encodeSave, decodeSave } from '../src/state.js';
import { chooseAssignmentReply, getAssignments } from '../src/assignments.js';

const clone = value => structuredClone(value);
const snapshot = state => JSON.stringify(state);
const operation = id => OPERATIONS.find(item => item.id === id);
function finishMain(state, zone, choice = null) {
  state.zone = zone; state.position = null;
  for (const id of zoneEncounters(zone)) assert.equal(winEncounter(state, id), true);
  assert.equal(completeZone(state, zone, choice), true);
}
function citadel({ tali = true, council = true } = {}) {
  const state = newGame(); state.flags.briefed = true; finishMain(state, 'eden-prime'); state.zone = 'citadel';
  if (tali) recruit(state, 'tali');
  if (council) assert.equal(completeZone(state, 'citadel'), true);
  return state;
}
function feros() {
  const state = citadel(); state.zone = 'feros'; assert.equal(winEncounter(state, 'feros:encounter-1'), true); return state;
}
function current(state, id) { return listOperations(state).find(item => item.id === id); }
function take(state, id, selected = null) {
  const entry = current(state, id); assert.ok(entry.currentStep, id);
  const interaction = getOperationInteraction(state, id, entry.currentStep.id);
  assert.equal(interaction.ok, true, interaction.reason);
  const choice = selected || interaction.choices.find(choice => !choice.disabled && choice.id !== 'cancel')?.id;
  const result = advanceOperation(state, id, entry.currentStep.id, choice);
  assert.equal(result.ok, true, result.reason); return result;
}
function complete(state, id, choose = {}) {
  let steps = 0;
  while (current(state, id).status !== 'completed' && steps++ < 10) {
    const step = current(state, id).currentStep.id, result = take(state, id, choose[step]);
    if (result.battle) assert.equal(finishOperationBattle(state, id, step, true).ok, true);
  }
  assert.equal(current(state, id).status, 'completed');
}
function roundtrip(state) {
  const decoded = decodeSave(encodeSave(state)); assert.ok(decoded, 'Full save remains valid');
  assert.deepEqual(decoded.operations, state.operations); return decoded;
}

test('extension contains eleven source-linked operations, forty-three steps and four actual encounter definitions', () => {
  assert.equal(OPERATIONS.length, 11); assert.equal(OPERATIONS.reduce((n, entry) => n + entry.steps.length, 0), 43);
  assert.equal(new Set(OPERATIONS.map(entry => entry.id)).size, 11); assert.equal(Object.keys(OPERATION_ENCOUNTERS).length, 4);
  for (const entry of OPERATIONS) {
    assert.ok(entry.sourceUrls.every(url => new URL(url).hostname === 'masseffect.fandom.com'));
    assert.ok(entry.adaptationNote.length > 60);
    assert.equal(new Set(entry.steps.map(step => step.id)).size, entry.steps.length);
    for (const step of entry.steps) {
      assert.equal(step.zone, entry.zone); assert.ok(Math.abs(step.x) <= 20 && Math.abs(step.z) <= 21);
      for (const choice of step.choices) if (choice.combat) assert.ok(OPERATION_ENCOUNTERS[choice.combat]);
    }
  }
});

test('only absent old save data initializes an empty extension and does not replace existing assignments', () => {
  assert.deepEqual(normalizeOperations(undefined), { version: 1, records: {} });
  for (const input of [null, {}, [], { version: 2, records: {} }, { version: 1, records: {}, extra: true }]) assert.equal(normalizeOperations(input), null);
  const state = citadel();
  for (const [contact, choice] of [['samesh-bhatia', 'accept-help'], ['bosker', 'return-body'], ['samesh-bhatia', 'inform-family']]) assert.equal(chooseAssignmentReply(state, contact, choice).ok, true);
  const before = clone(state.assignments); complete(state, 'citadel-consort');
  assert.deepEqual(state.assignments, before); assert.equal(getAssignments(state)[0].status, 'completed');
  const legacy = JSON.parse(encodeSave(state)); delete legacy.state.operations; delete legacy.state.trackedOperation;
  const migrated = decodeSave(legacy); assert.ok(migrated); assert.deepEqual(migrated.operations, createOperationState());
  assert.deepEqual(migrated.assignments, before); assert.equal(migrated.trackedOperation, null);
});

test('new-game and wrong-location operations cannot advance or expose interactive markers', () => {
  const state = newGame(), before = snapshot(state);
  assert.deepEqual(operationPOIs(state, 'citadel'), []); assert.ok(listOperations(state).every(entry => entry.status === 'locked'));
  assert.equal(advanceOperation(state, 'citadel-consort', 'reception', 'accept').ok, false); assert.equal(snapshot(state), before);
  const reached = citadel(); reached.zone = 'normandy'; const saved = snapshot(reached);
  assert.equal(advanceOperation(reached, 'citadel-consort', 'reception', 'accept').ok, false); assert.equal(snapshot(reached), saved);
});

test('reading and cancelling interactions do not start a quest, charge credits or grant rewards', () => {
  const state = citadel(), before = snapshot(state);
  for (const poi of operationPOIs(state)) {
    const interaction = getOperationInteraction(state, poi.operationId, poi.stepId);
    assert.equal(interaction.ok, true); assert.equal(advanceOperation(state, poi.operationId, poi.stepId, 'cancel').cancelled, true);
  }
  listOperations(state); operationEffects(state); renderOperationsJournal(state);
  assert.equal(snapshot(state), before);
});

test('only current steps can execute and replaced decisions cannot be replayed', () => {
  const state = citadel();
  assert.equal(advanceOperation(state, 'citadel-consort', 'report', 'report').ok, false);
  take(state, 'citadel-consort'); const before = snapshot(state);
  assert.equal(advanceOperation(state, 'citadel-consort', 'reception', 'accept').ok, false);
  assert.equal(advanceOperation(state, 'citadel-consort', 'request', 'no-such-choice').ok, false); assert.equal(snapshot(state), before);
});

test('Emily may be met before Tali, but her disk objective clearly waits for the evidence milestone', () => {
  const state = citadel({ tali: false, council: false }); take(state, 'citadel-reporters-request');
  const blocked = current(state, 'citadel-reporters-request'); assert.equal(blocked.status, 'active'); assert.match(blocked.blockedReason, /Tali/);
  assert.equal(operationPOIs(state).some(poi => poi.operationId === blocked.id), false);
  const before = snapshot(state); assert.equal(advanceOperation(state, blocked.id, 'disk', 'copy').ok, false); assert.equal(snapshot(state), before);
  assert.ok(recruit(state, 'tali')); take(state, blocked.id); take(state, blocked.id); roundtrip(state);
});

test('Xeltan requires Septimus’s evidence and retains his chosen outcome independently of Sha’ira', () => {
  const state = citadel(); assert.equal(current(state, 'citadel-xeltan').status, 'locked');
  for (let i = 0; i < 3; i++) take(state, 'citadel-consort');
  assert.equal(current(state, 'citadel-xeltan').status, 'available'); complete(state, 'citadel-xeltan', { reassure: 'reassure' });
  assert.match(current(state, 'citadel-xeltan').outcome, /rassuré/); assert.equal(current(state, 'citadel-consort').stage, 3);
  const invalid = clone(state.operations); delete invalid.records['citadel-consort']; assert.equal(normalizeOperations(invalid, state), null);
  roundtrip(state);
});

test('the permit checks affordability, charges exactly once and distributes XP only at the report', () => {
  const state = citadel(); take(state, 'citadel-presidium-prophet'); state.credits = 149;
  const before = snapshot(state), conversation = getOperationInteraction(state, 'citadel-presidium-prophet', 'hanar');
  assert.equal(conversation.choices.find(choice => choice.id === 'permit').disabled, true);
  assert.equal(advanceOperation(state, 'citadel-presidium-prophet', 'hanar', 'permit').ok, false); assert.equal(snapshot(state), before);
  state.credits = 150; const xp = state.xp; take(state, 'citadel-presidium-prophet', 'permit');
  assert.equal(state.credits, 0); assert.equal(state.xp, xp);
  const checkpoint = snapshot(state); assert.equal(advanceOperation(state, 'citadel-presidium-prophet', 'hanar', 'permit').ok, false); assert.equal(snapshot(state), checkpoint);
  take(state, 'citadel-presidium-prophet'); assert.equal(state.xp, xp + 50); assert.equal(state.credits, 0); roundtrip(state);
});

test('persuasion thresholds enforce disabled dialogue choices and do not mutate on rejection', () => {
  const state = citadel(); take(state, 'citadel-doctor-michel'); take(state, 'citadel-doctor-michel');
  const before = snapshot(state);
  assert.equal(getOperationInteraction(state, 'citadel-doctor-michel', 'blackmailer').choices.find(choice => choice.id === 'persuade').disabled, true);
  assert.equal(advanceOperation(state, 'citadel-doctor-michel', 'blackmailer', 'persuade').ok, false); assert.equal(snapshot(state), before);
  state.paragon = 8; take(state, 'citadel-doctor-michel', 'persuade'); assert.equal(state.paragon, 8);
  assert.equal(operationEffects(state).medicalDiscount, 0); take(state, 'citadel-doctor-michel');
  assert.equal(state.paragon, 12); assert.equal(operationEffects(state).medicalDiscount, .2); roundtrip(state);
});

test('combat must be armed, survives a save and resumes without completing or awarding a victory', () => {
  let state = citadel(); const id = 'citadel-doctor-michel', step = 'blackmailer';
  assert.equal(getOperationEncounter(state, id, step), null); assert.equal(finishOperationBattle(state, id, step, true).ok, false);
  take(state, id); take(state, id); const xp = state.xp, credits = state.credits;
  const start = take(state, id, 'fight'); assert.equal(start.battle.enemies.length, 1); assert.equal(start.battle.enemies[0].synthetic, false);
  assert.equal(state.operations.records[id].stage, 2); assert.equal(state.xp, xp); assert.equal(state.credits, credits);
  assert.equal(current(state, id).outcome, '', 'An armed choice cannot claim its battle has already been won.');
  state = roundtrip(state); const saved = snapshot(state);
  assert.equal(getOperationInteraction(state, id, step).choices[0].id, 'resume');
  assert.equal(advanceOperation(state, id, step, 'persuade').ok, false); assert.equal(snapshot(state), saved);
  assert.equal(take(state, id, 'resume').battle.id, start.battle.id); assert.equal(snapshot(state), saved);
  assert.equal(finishOperationBattle(state, id, step, false).retryable, true); assert.equal(snapshot(state), saved);
  assert.equal(finishOperationBattle(state, id, step, true).ok, true); assert.equal(state.operations.records[id].stage, 3);
  const after = snapshot(state); assert.equal(finishOperationBattle(state, id, step, true).ok, false); assert.equal(snapshot(state), after);
  take(state, id); assert.equal(state.xp, xp + 70); assert.equal(state.credits, credits + 90); roundtrip(state);
});

test('all eleven operations complete through their ordered interactions with four correctly typed encounters', () => {
  const state = feros(), encountered = [], startXP = state.xp, startCredits = state.credits;
  const choices = { 'hanar': 'permit', 'blackmailer': 'fight' };
  for (const entry of OPERATIONS) {
    state.zone = entry.zone;
    while (current(state, entry.id).status !== 'completed') {
      const step = current(state, entry.id).currentStep.id, result = take(state, entry.id, choices[step]);
      if (result.battle) {
        encountered.push(result.battle);
        for (const actor of result.battle.enemies) assert.ok(actor.id && actor.maxHp > 0 && actor.maxShield >= 0 && actor.powers);
        assert.equal(finishOperationBattle(state, entry.id, step, true).ok, true);
      }
      roundtrip(state);
    }
    const before = snapshot(state), last = entry.steps.at(-1);
    assert.equal(advanceOperation(state, entry.id, last.id, last.choices[0].id).ok, false); assert.equal(snapshot(state), before);
  }
  assert.equal(encountered.length, 4); assert.equal(encountered.reduce((sum, battle) => sum + battle.enemies.length, 0), 10);
  assert.deepEqual(encountered[1].enemies.map(enemy => enemy.synthetic), [true, true, true]);
  assert.deepEqual(listOperations(state).map(entry => entry.status), Array(11).fill('completed'));
  assert.equal(state.xp - startXP, 680); assert.equal(state.credits - startCredits, 615);
  assert.deepEqual(operationEffects(state), { medicalDiscount: .2, colonySupport: 3, researchRecovered: true });
});

test('the Thorian closes unfinished Fai Dan work but a previously copied Gavin archive remains deliverable', () => {
  const state = feros(); take(state, 'feros-geth-tunnels');
  take(state, 'feros-data-recovery'); take(state, 'feros-data-recovery', 'fight');
  assert.equal(finishOperationBattle(state, 'feros-data-recovery', 'guards', true).ok, true); take(state, 'feros-data-recovery');
  assert.equal(winEncounter(state, 'feros:encounter-2'), true); assert.equal(winEncounter(state, 'feros:boss'), true);
  assert.equal(current(state, 'feros-geth-tunnels').status, 'unavailable');
  assert.equal(current(state, 'feros-data-recovery').status, 'active'); take(state, 'feros-data-recovery');
  assert.equal(operationEffects(state).researchRecovered, true); roundtrip(state);
});

test('uncopied research cannot be recovered after the Thorian and colony casualties close water and power', () => {
  const state = feros(); take(state, 'feros-data-recovery'); take(state, 'feros-water'); take(state, 'feros-power');
  assert.equal(winEncounter(state, 'feros:encounter-2'), true); assert.equal(winEncounter(state, 'feros:boss'), true); assert.equal(completeZone(state, 'feros', 'force'), true);
  for (const id of ['feros-data-recovery', 'feros-water', 'feros-power']) assert.equal(current(state, id).status, 'unavailable');
  assert.equal(operationPOIs(state).length, 0); roundtrip(state);
});

test('saving the colony allows remaining water and power services to be completed after the main mission', () => {
  const state = feros(); assert.equal(winEncounter(state, 'feros:encounter-2'), true); assert.equal(winEncounter(state, 'feros:boss'), true); assert.equal(completeZone(state, 'feros', 'save'), true);
  complete(state, 'feros-water'); complete(state, 'feros-power'); assert.equal(operationEffects(state).colonySupport, 2); roundtrip(state);
});

test('Ilos closes unfinished objectives without deleting their history or completed rewards', () => {
  const state = feros(); state.zone = 'citadel'; complete(state, 'citadel-consort'); take(state, 'citadel-keepers');
  const records = clone(state.operations), resources = { xp: state.xp, credits: state.credits };
  state.completed.push('ilos');
  assert.equal(current(state, 'citadel-consort').status, 'completed'); assert.equal(current(state, 'citadel-keepers').status, 'unavailable');
  assert.deepEqual(operationPOIs(state), []); assert.deepEqual(normalizeOperations(state.operations, state), records);
  assert.equal(state.xp, resources.xp); assert.equal(state.credits, resources.credits);
});

test('validation rejects skipped steps, unknown choices, fabricated victories and inconsistent pending fights', () => {
  const state = citadel(); take(state, 'citadel-doctor-michel'); take(state, 'citadel-doctor-michel'); take(state, 'citadel-doctor-michel', 'fight');
  const make = () => clone(state.operations), variants = [];
  let copy = make(); copy.records['citadel-doctor-michel'].stage = 4; variants.push(copy);
  copy = make(); copy.records['citadel-doctor-michel'].choices.request = 'invented'; variants.push(copy);
  copy = make(); copy.records['citadel-doctor-michel'].victories = ['blackmailer']; variants.push(copy);
  copy = make(); copy.records['citadel-doctor-michel'].pendingBattle = 'morlan'; variants.push(copy);
  copy = make(); copy.records['citadel-doctor-michel'].pendingBattle = null; variants.push(copy);
  copy = make(); copy.records.unknown = clone(copy.records['citadel-doctor-michel']); variants.push(copy);
  copy = make(); copy.records['citadel-doctor-michel'].extra = true; variants.push(copy);
  for (const variant of variants) assert.equal(normalizeOperations(variant, state), null);
  assert.equal(normalizeOperations(state.operations, newGame()), null);
});

test('object-input validation rejects hostile keys, accessors, cycles, sparse and extended arrays', () => {
  let accessed = false; const getter = { version: 1 }; Object.defineProperty(getter, 'records', { enumerable: true, get() { accessed = true; return {}; } });
  assert.equal(normalizeOperations(getter), null); assert.equal(accessed, false);
  assert.equal(normalizeOperations(JSON.parse('{"version":1,"records":{"__proto__":{}}}')), null);
  const cyclic = createOperationState(); cyclic.records.loop = cyclic; assert.equal(normalizeOperations(cyclic), null);
  const state = citadel(); take(state, 'citadel-consort');
  const sparse = clone(state.operations); sparse.records['citadel-consort'].victories = new Array(1); assert.equal(normalizeOperations(sparse), null);
  const extended = clone(state.operations); extended.records['citadel-consort'].victories.foo = 'value'; assert.equal(normalizeOperations(extended), null);
});

test('reward overflow rejects the entire transaction before progress or any reserve changes', () => {
  const state = citadel(); for (let i = 0; i < 3; i++) take(state, 'citadel-consort');
  state.xp = 1_000_000_000; const before = snapshot(state);
  assert.equal(advanceOperation(state, 'citadel-consort', 'report', 'report').ok, false); assert.equal(snapshot(state), before);
  state.xp = 0; state.medigel = 10; const corrupt = snapshot(state);
  assert.equal(advanceOperation(state, 'citadel-consort', 'report', 'report').ok, false); assert.equal(snapshot(state), corrupt);
});

test('view and encounter data are detached copies and cannot corrupt definitions or save state', () => {
  const state = citadel(); take(state, 'citadel-doctor-michel'); take(state, 'citadel-doctor-michel'); take(state, 'citadel-doctor-michel', 'fight');
  const before = snapshot(state), view = listOperations(state), fight = getOperationEncounter(state, 'citadel-doctor-michel', 'blackmailer');
  view[0].sourceUrls.push('evil'); view[0].reward.xp = 999; view[0].currentStep.label = 'changed'; fight.enemies[0].powers.push('fake');
  assert.equal(snapshot(state), before); assert.equal(listOperations(state)[0].reward.xp, 65);
  assert.equal(getOperationEncounter(state, 'citadel-doctor-michel', 'blackmailer').enemies[0].powers.includes('fake'), false);
});

test('the journal exposes progress, filters, prerequisites and tracking without changing state', () => {
  const state = citadel({ tali: false, council: false }); take(state, 'citadel-reporters-request'); state.trackedOperation = 'citadel-reporters-request';
  const before = snapshot(state), markup = renderOperationsJournal(state, { operationFilter: 'active' });
  assert.match(markup, /data-operation-id="citadel-reporters-request"/); assert.match(markup, /Tali/); assert.match(markup, /Arrêter le suivi/);
  assert.doesNotMatch(markup, /data-operation-id="citadel-consort"/); assert.match(markup, /1 \/ 3/); assert.equal(snapshot(state), before);
});
