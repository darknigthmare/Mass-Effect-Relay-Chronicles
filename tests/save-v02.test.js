import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, encodeSave, decodeSave, winEncounter, completeZone, recruit } from '../src/state.js';
import { actorFor, baseActorFor } from '../src/game-data.js';
import { initialInventory, buyItem, equipItem } from '../src/loadout.js';
import { chooseAssignmentReply } from '../src/assignments.js';

function citadel() {
  const state = newGame({ appearance: 'female', origin: 'colonist', psychologicalProfile: 'war-hero' });
  state.flags.briefed = true; state.zone = 'eden-prime';
  for (const suffix of ['encounter-1', 'encounter-2', 'boss']) assert.equal(winEncounter(state, `eden-prime:${suffix}`), true);
  assert.equal(completeZone(state, 'eden-prime'), true);
  state.zone = 'citadel'; recruit(state, 'tali'); completeZone(state, 'citadel');
  assert.equal(chooseAssignmentReply(state, 'samesh-bhatia', 'accept-help').ok, true);
  return state;
}

test('latest-main saves migrate absent v0.2 fields while preserving commander, story and existing assignments', () => {
  const state = citadel(), packet = JSON.parse(encodeSave(state));
  delete packet.state.inventory; delete packet.state.operations; delete packet.state.trackedOperation;
  const migrated = decodeSave(packet);
  assert.ok(migrated);
  assert.deepEqual(migrated.inventory, initialInventory());
  assert.deepEqual(migrated.operations, { version: 1, records: {} });
  assert.equal(migrated.trackedOperation, null);
  for (const key of ['appearance', 'origin', 'psychologicalProfile', 'story', 'assignments', 'party', 'recruited', 'choices'])
    assert.deepEqual(migrated[key], state[key]);
});

test('explicit invalid inventory, operation and tracking payloads are rejected rather than reset', () => {
  for (const [key, value] of [['inventory', null], ['operations', null], ['trackedOperation', 'missing-operation']]) {
    const packet = JSON.parse(encodeSave(newGame())); packet.state[key] = value;
    assert.equal(decodeSave(packet), null, key);
  }
});

test('purchases, loadout and stock survive export/import without replaying their cost', () => {
  const state = newGame();
  assert.equal(buyItem(state, 'heat-sink-i').ok, true);
  assert.equal(equipItem(state, 'shepard', 'heat-sink-i').ok, true);
  const restored = decodeSave(encodeSave(state));
  assert.ok(restored);
  assert.deepEqual(restored.inventory, state.inventory);
  assert.equal(restored.credits, 150);
  assert.equal(actorFor('shepard', restored).weaponHeatMultiplier, .9);
  assert.equal(actorFor('shepard', restored).weaponCoolingBonus, 1);
});

test('starter items preserve the published campaign balance and actor computation never accumulates bonuses', () => {
  const state = newGame(), baseline = baseActorFor('shepard', state);
  const starter = actorFor('shepard', state);
  for (const key of ['hp', 'maxHp', 'shield', 'maxShield', 'attack', 'defense', 'speed']) assert.equal(starter[key], baseline[key]);
  assert.equal(buyItem(state, 'armor-plating-i').ok, true);
  assert.equal(equipItem(state, 'shepard', 'armor-plating-i').ok, true);
  const first = actorFor('shepard', state), second = actorFor('shepard', state);
  assert.equal(first.defense, baseline.defense + 3);
  assert.equal(second.defense, first.defense);
  assert.equal(baseActorFor('shepard', state).defense, baseline.defense);
});
