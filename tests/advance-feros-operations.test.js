import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, winEncounter, completeZone, recruit, zoneEncounters, encodeSave, decodeSave } from '../src/state.js';
import { listAdvanceFerosPOIs, transitionAdvanceFeros, FEROS_COLONIST_TARGETS } from '../src/advance-feros.js';
import { listOperations, operationPOIs, getOperationInteraction, advanceOperation } from '../src/operations.js';

const clone = value => JSON.parse(JSON.stringify(value));
function act(state, key, choice) {
  const poi = listAdvanceFerosPOIs(state).find(poi => poi.id === `advance:feros:${key}`); assert.ok(poi, key);
  state.position = { x: poi.x, z: poi.z }; const result = transitionAdvanceFeros(state, poi.id, choice);
  assert.equal(result.ok, true, result.reason); state.advanceFeros = result.progress;
}
function beforeInfluence() {
  const state = newGame(); state.flags.briefed = true;
  for (const zone of ['eden-prime', 'citadel']) {
    state.zone = zone; if (zone === 'citadel') assert.equal(recruit(state, 'tali'), true);
    for (const encounter of zoneEncounters(zone)) assert.equal(winEncounter(state, encounter), true);
    assert.equal(completeZone(state, zone), true);
  }
  state.zone = 'feros'; assert.equal(winEncounter(state, 'feros:encounter-1'), true);
  act(state, 'defense', 'coordinate'); act(state, 'lizbeth', 'listen'); assert.equal(winEncounter(state, 'feros:encounter-2'), true);
  act(state, 'investigation', 'research'); for (const valve of [1, 3, 4]) act(state, 'pressure', `valve-${valve}`);
  act(state, 'pressure', 'release'); act(state, 'jeong', 'confront'); return state;
}
const operation = (state, id) => listOperations(state).find(item => item.id === id);
function waterToReport(state) {
  for (const [step, choice] of [['request', 'accept'], ['valve-south', 'restore'], ['valve-central', 'restore'], ['valve-north', 'restore']])
    assert.equal(advanceOperation(state, 'feros-water', step, choice).ok, true);
}
function refused(state, id, step, choice) {
  const before = clone(state);
  assert.equal(getOperationInteraction(state, id, step).ok, false);
  assert.equal(advanceOperation(state, id, step, choice).ok, false);
  assert.deepEqual(state, before, 'Refused ghost-contact actions cannot mutate history, inventory or reward budgets');
  assert.equal(operationPOIs(state).some(poi => poi.operationId === id && poi.stepId === step), false);
}

test('individually killed Macha/Davin and Fai Dan at the cargo lose request/report exchanges before the old boss deadline', () => {
  const state = beforeInfluence(); waterToReport(state); act(state, 'juliana', 'prepare');
  act(state, 'colonist-macha', 'lethal'); act(state, 'colonist-davin', 'lethal');
  assert.equal(operation(state, 'feros-water').status, 'unavailable'); assert.match(operation(state, 'feros-water').blockedReason, /plus en vie/);
  assert.equal(operation(state, 'feros-varrens').status, 'unavailable');
  refused(state, 'feros-water', 'report', 'report'); refused(state, 'feros-varrens', 'request', 'accept');
  for (const target of FEROS_COLONIST_TARGETS.filter(target => state.advanceFeros.colonists[target.id] === null)) act(state, `colonist-${target.id}`, 'gas');
  act(state, 'freighter', 'open'); assert.equal(state.cleared.includes('feros:boss'), false);
  assert.match(operation(state, 'feros-geth-tunnels').blockedReason, /plus en vie/);
  refused(state, 'feros-geth-tunnels', 'request', 'accept');
  assert.ok(decodeSave(encodeSave(state)), 'Contact deaths cannot corrupt a valid ongoing campaign');
});

test('living influenced contacts wait, while accepted physical work remains available and a spared Macha can report after liberation', () => {
  const state = beforeInfluence(); assert.equal(advanceOperation(state, 'feros-water', 'request', 'accept').ok, true);
  act(state, 'juliana', 'prepare');
  assert.match(operation(state, 'feros-varrens').blockedReason, /influence/);
  assert.match(operation(state, 'feros-geth-tunnels').blockedReason, /influence/);
  refused(state, 'feros-varrens', 'request', 'accept');
  assert.equal(operation(state, 'feros-water').status, 'active');
  for (const step of ['valve-south', 'valve-central', 'valve-north']) assert.equal(advanceOperation(state, 'feros-water', step, 'restore').ok, true);
  assert.match(operation(state, 'feros-water').blockedReason, /influence/); refused(state, 'feros-water', 'report', 'report');
  for (const target of FEROS_COLONIST_TARGETS) act(state, `colonist-${target.id}`, 'melee');
  act(state, 'freighter', 'open'); assert.equal(winEncounter(state, 'feros:boss'), true);
  assert.equal(operation(state, 'feros-water').status, 'active');
  assert.equal(advanceOperation(state, 'feros-water', 'report', 'report').ok, true);
  assert.equal(operation(state, 'feros-water').status, 'completed');
});

test('completed services and legacy contact availability survive unchanged without inventing individual outcomes', () => {
  const state = beforeInfluence(); waterToReport(state); assert.equal(advanceOperation(state, 'feros-water', 'report', 'report').ok, true);
  const completed = clone(state.operations.records['feros-water']); act(state, 'juliana', 'prepare'); act(state, 'colonist-macha', 'lethal');
  assert.equal(operation(state, 'feros-water').status, 'completed'); assert.deepEqual(state.operations.records['feros-water'], completed);
  refused(state, 'feros-water', 'report', 'report');
  const resumed = decodeSave(encodeSave(state)); assert.ok(resumed); assert.equal(operation(resumed, 'feros-water').status, 'completed');
  const legacy = beforeInfluence(); delete legacy.advanceFeros;
  assert.equal(operation(legacy, 'feros-water').status, 'available'); assert.equal(operation(legacy, 'feros-varrens').status, 'available');
  assert.equal(operation(legacy, 'feros-geth-tunnels').status, 'available');
  assert.equal(advanceOperation(legacy, 'feros-water', 'request', 'accept').ok, true);
});
