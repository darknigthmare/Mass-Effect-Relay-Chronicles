import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, winEncounter, completeZone, recruit, zoneEncounters, encodeSave, decodeSave } from '../src/state.js';
import { CHAPTERS } from '../src/game-data.js';
import { getLevelLayout, isLevelGround } from '../src/level-layout-data.js';
import { createMissionProgress, normalizeMissionProgress, MISSION_DEFINITIONS, getMissionProgress,
  getMissionPOIs, getMissionInteraction, advanceMission, tickMission, canCompleteMission,
  getMissionEncounterGate, getMissionTravelGate } from '../src/mission-progress.js';
import { missionHUDText, missionTimeLabel, renderMissionProgress } from '../src/mission-progress-ui.js';

const clone = value => JSON.parse(JSON.stringify(value));
function prepared(id, { allEncounters = false } = {}) {
  const state = newGame({ difficulty: 'story' }); state.flags.briefed = true;
  const decisions = { feros: 'save', noveria: 'release', virmire: 'save-kaidan', 'citadel-finale': 'save-council' };
  for (const zone of ['eden-prime', 'citadel', 'therum', 'feros', 'noveria', 'virmire', 'ilos']) {
    state.zone = zone;
    if (zone === 'citadel') assert.equal(recruit(state, 'tali'), true);
    const encounters = zoneEncounters(zone);
    const count = zone !== id || allEncounters ? encounters.length : id === 'eden-prime' ? 2 : id === 'noveria' ? 1 : 3;
    for (const encounter of encounters.slice(0, count)) assert.equal(winEncounter(state, encounter), true, encounter);
    if (zone === id) break;
    assert.equal(completeZone(state, zone, decisions[zone] ?? null), true, zone);
  }
  state.missionProgress = normalizeMissionProgress(undefined, state);
  state.position = { ...MISSION_DEFINITIONS[id].start };
  return state;
}
const economy = state => ({ xp: state.xp, credits: state.credits, medigel: state.medigel, paragon: state.paragon,
  renegade: state.renegade, choices: clone(state.choices), inventory: clone(state.inventory), cleared: [...state.cleared] });
const missionPOI = (id, step) => `mission:${id}:${step}`;

test('old completed chapters migrate as explicitly unknown details, while explicit malformed records never migrate', () => {
  const state = prepared('ilos'), old = normalizeMissionProgress(undefined, state);
  assert.equal(old.records['eden-prime'].status, 'legacy-complete');
  assert.equal(old.records.noveria.status, 'legacy-complete');
  assert.deepEqual(old.records['eden-prime'].steps, []);
  assert.equal(old.records.ilos.status, 'idle');
  old.records.ilos.steps.push('vigil'); assert.deepEqual(createMissionProgress().records.ilos.steps, []);
  for (const invalid of [null, [], {}, { ...createMissionProgress(), version: 2 }, { ...createMissionProgress(), bonus: true }])
    assert.equal(normalizeMissionProgress(invalid, state), null);
  const inconsistent = createMissionProgress(); inconsistent.records.ilos.status = 'legacy-complete';
  assert.equal(normalizeMissionProgress(inconsistent, state), null, 'A legacy completion cannot be forged for an incomplete chapter');
  assert.equal(normalizeMissionProgress(old, state), null, 'An idle record cannot contain invented steps');
});

test('normalization refuses getters, symbols, impossible counters, duplicate steps and unknown charge channels', () => {
  const state = prepared('eden-prime'); let getters = 0;
  const accessor = createMissionProgress(); Object.defineProperty(accessor.records['eden-prime'], 'remaining', { enumerable: true, get() { getters++; return 300; } });
  assert.equal(normalizeMissionProgress(accessor, state), null); assert.equal(getters, 0);
  const symbol = createMissionProgress(); symbol.records[Symbol('extra')] = {};
  assert.equal(normalizeMissionProgress(symbol, state), null);
  assert.equal(advanceMission(state, 'eden-prime', 'start').ok, true);
  const active = clone(state.missionProgress);
  assert.equal(normalizeMissionProgress(active, { ...state, zone: 'normandy' }), null,
    'A timed stage cannot be imported outside its zone when its public travel boundary forbids leaving');
  for (const mutate of [
    p => { p.records['eden-prime'].remaining = Infinity; },
    p => { p.records['eden-prime'].remaining = -1; },
    p => { p.records['eden-prime'].remaining = 301; },
    p => { p.records['eden-prime'].attempts = .5; },
    p => { p.records['eden-prime'].steps = ['charge-1', 'charge-1']; },
    p => { p.records['eden-prime'].steps = ['charge-5']; },
    p => { p.records['eden-prime'].status = 'complete'; },
    p => { p.records['eden-prime'].channel = { stepId: 'unknown', remaining: 6, position: { x: 0, z: 0 } }; },
  ]) { const input = clone(active); mutate(input); assert.equal(normalizeMissionProgress(input, state), null); }
  const arrayAccessor = clone(active); Object.defineProperty(arrayAccessor.records['eden-prime'].steps, '0', { enumerable: true, get() { getters++; return 'charge-1'; } });
  assert.equal(normalizeMissionProgress(arrayAccessor, state), null); assert.equal(getters, 0);
});

test('activation enforces story prerequisites, chapter and period without changing refused state', () => {
  const state = newGame(), original = clone(state);
  assert.equal(advanceMission(state, 'eden-prime', 'start').ok, false); assert.deepEqual(state, original);
  for (const invalid of ['constructor:boss', '__proto__:boss', 'unknown:boss', null]) assert.equal(getMissionEncounterGate(state, invalid), null);
  const ready = prepared('eden-prime');
  for (const changes of [{ zone: 'normandy' }, { context: { mediaId: 'ME2', periodId: 'me2' } }, { cleared: ['eden-prime:encounter-1'] }]) {
    const refused = { ...clone(ready), ...changes }, before = clone(refused);
    assert.equal(advanceMission(refused, 'eden-prime', 'start').ok, false); assert.deepEqual(refused, before);
  }
  assert.equal(advanceMission(ready, 'mission:eden-prime:charge-1:extra', 'start').ok, false);
  assert.equal(getMissionEncounterGate(ready, 'eden-prime:boss').status, 'idle');
  assert.equal(getMissionEncounterGate(ready, 'eden-prime:encounter-2'), null);
});

test('four real six-second channels neutralize Eden charges once, with pause and movement cancellation', () => {
  const state = prepared('eden-prime'), resources = economy(state);
  assert.equal(canCompleteMission(state), true, 'Untouched native primitive remains compatible with historical fixtures');
  assert.equal(advanceMission(state, 'eden-prime', 'start').kind, 'started');
  assert.equal(canCompleteMission(state), false); assert.equal(getMissionTravelGate(state, 'normandy').ok, false);
  assert.equal(getMissionPOIs(state).length, 4);
  const first = missionPOI('eden-prime', 'charge-1');
  state.position = { x: 18.2, z: -40.2, zone: 'eden-prime' };
  assert.equal(advanceMission(state, first, 'disarm').kind, 'channel-started');
  const paused = clone(state); assert.deepEqual(tickMission(state, 80, { paused: true }), []); assert.deepEqual(state, paused);
  tickMission(state, 3, { position: { x: 18.2, z: -40.2 } });
  assert.equal(getMissionProgress(state).channel.remaining, 3);
  const events = tickMission(state, .1, { position: { x: 20, z: -40.2 } });
  assert.equal(events[0].type, 'channel-cancelled'); assert.deepEqual(state.missionProgress.records['eden-prime'].steps, []);
  for (const step of MISSION_DEFINITIONS['eden-prime'].steps) {
    state.position = { x: step.x, z: step.z };
    assert.equal(advanceMission(state, missionPOI('eden-prime', step.id), 'disarm').ok, true);
    const pending = clone(state.missionProgress);
    assert.equal(advanceMission(state, missionPOI('eden-prime', step.id), 'disarm').ok, false);
    assert.deepEqual(state.missionProgress, pending);
    tickMission(state, 5.9); assert.equal(state.missionProgress.records['eden-prime'].steps.includes(step.id), false);
    const event = tickMission(state, .1)[0]; assert.equal(event.stepId, step.id);
    assert.equal(advanceMission(state, missionPOI('eden-prime', step.id), 'disarm').ok, false);
  }
  assert.equal(getMissionProgress(state).status, 'complete'); assert.equal(getMissionPOIs(state).length, 0);
  assert.equal(getMissionEncounterGate(state, 'eden-prime:boss'), null); assert.equal(canCompleteMission(state), true);
  assert.equal(getMissionTravelGate(state, 'normandy').ok, true); assert.deepEqual(economy(state), resources);
  const completed = clone(state); assert.deepEqual(tickMission(state, 1000), []); assert.deepEqual(state, completed);
});

test('clock boundaries fail once, keep the chapter blocked and restart only the explicit checkpoint', () => {
  const state = prepared('eden-prime'), resources = economy(state);
  advanceMission(state, 'eden-prime', 'start');
  assert.deepEqual(tickMission(state, NaN), []); assert.deepEqual(tickMission(state, -10), []);
  const first = missionPOI('eden-prime', 'charge-1'); advanceMission(state, first, 'disarm'); tickMission(state, 6);
  assert.equal(state.missionProgress.records['eden-prime'].steps.length, 1);
  const events = tickMission(state, 294);
  assert.equal(events[0].type, 'failed'); assert.equal(state.missionProgress.records['eden-prime'].remaining, 0);
  assert.equal(getMissionProgress(state).status, 'failed'); assert.equal(canCompleteMission(state), false);
  assert.deepEqual(tickMission(state, 900), []); assert.equal(getMissionInteraction(state, first).choices[0].id, 'retry');
  const retried = advanceMission(state, 'eden-prime', 'retry');
  assert.equal(retried.kind, 'retry'); assert.deepEqual(retried.checkpoint, MISSION_DEFINITIONS['eden-prime'].start);
  assert.equal(getMissionProgress(state).attempts, 2); assert.equal(getMissionProgress(state).remaining, 300);
  assert.equal(state.missionProgress.records['eden-prime'].steps.length, 0); assert.deepEqual(economy(state), resources);
});

test('MIRA restores each real station in any order and gates the labs without generating resources', () => {
  const state = prepared('noveria'), resources = economy(state);
  assert.equal(getMissionEncounterGate(state, 'noveria:encounter-2').status, 'idle');
  assert.equal(advanceMission(state, 'noveria', 'start').ok, true);
  assert.equal(getMissionPOIs(state).length, 3); assert.equal(getMissionTravelGate(state, 'normandy').ok, true);
  const beforeClock = clone(state); assert.deepEqual(tickMission(state, 1000), []); assert.deepEqual(state, beforeClock);
  for (const id of ['uplink', 'memory', 'power']) {
    const poi = missionPOI('noveria', id), interaction = getMissionInteraction(state, poi);
    assert.equal(interaction.choices[0].id, 'repair'); assert.equal(advanceMission(state, poi, 'repair').ok, true);
    assert.equal(advanceMission(state, poi, 'repair').ok, false);
    assert.ok(normalizeMissionProgress(state.missionProgress, state));
  }
  assert.equal(getMissionProgress(state).status, 'complete'); assert.equal(getMissionEncounterGate(state, 'noveria:boss'), null);
  assert.equal(canCompleteMission(state), true); assert.deepEqual(economy(state), resources);
});

test('Vigil starts the Ilos window only on activation, expiry/retry cannot skip the final passage', () => {
  const state = prepared('ilos'), resources = economy(state);
  assert.equal(advanceMission(state, 'ilos', 'start').ok, true);
  assert.equal(getMissionProgress(state).remaining, null); assert.deepEqual(tickMission(state, 400), []);
  assert.equal(getMissionPOIs(state)[0].stepId, 'vigil');
  assert.equal(advanceMission(state, missionPOI('ilos', 'conduit'), 'enter').ok, false);
  assert.equal(advanceMission(state, missionPOI('ilos', 'vigil'), 'activate').ok, true);
  assert.equal(getMissionProgress(state).remaining, 60); assert.equal(getMissionPOIs(state)[0].stepId, 'conduit');
  assert.equal(tickMission(state, 60)[0].type, 'failed');
  assert.equal(advanceMission(state, missionPOI('ilos', 'conduit'), 'enter').ok, false);
  const retry = advanceMission(state, 'ilos', 'retry'); assert.deepEqual(retry.checkpoint, MISSION_DEFINITIONS.ilos.start);
  assert.equal(getMissionProgress(state).remaining, null); assert.equal(getMissionPOIs(state)[0].stepId, 'vigil');
  advanceMission(state, missionPOI('ilos', 'vigil'), 'activate'); tickMission(state, 59.5);
  assert.equal(advanceMission(state, missionPOI('ilos', 'conduit'), 'enter').kind, 'complete');
  assert.equal(canCompleteMission(state), true); assert.equal(getMissionProgress(state).remaining, .5);
  assert.deepEqual(economy(state), resources); assert.equal(state.completed.includes('ilos'), false, 'Mission progress never claims the native chapter reward itself');
});

test('in-progress channel and repaired stations round-trip without sharing copies or inventing legacy details', () => {
  const state = prepared('eden-prime'); advanceMission(state, 'eden-prime', 'start');
  advanceMission(state, missionPOI('eden-prime', 'charge-2'), 'disarm'); tickMission(state, 2.25);
  const serialized = JSON.stringify(state.missionProgress), restored = normalizeMissionProgress(JSON.parse(serialized), state);
  assert.deepEqual(restored, state.missionProgress); restored.records['eden-prime'].channel.remaining = 1;
  assert.equal(state.missionProgress.records['eden-prime'].channel.remaining, 3.75);
  assert.equal(state.missionProgress.records['eden-prime'].steps.length, 0);
  const original = clone(state); renderMissionProgress(state); missionHUDText(state); getMissionPOIs(state); getMissionInteraction(state, 'eden-prime');
  assert.deepEqual(state, original, 'Consultation must not consume timer or change the pending channel');
});

test('the actual campaign decoder preserves pending channels and rejects present-invalid mission data', () => {
  const state = prepared('eden-prime'); advanceMission(state, 'eden-prime', 'start');
  advanceMission(state, missionPOI('eden-prime', 'charge-1'), 'disarm'); tickMission(state, 2.5);
  const resumed = decodeSave(encodeSave(state)); assert.ok(resumed);
  assert.deepEqual(resumed.missionProgress, state.missionProgress);
  const malformed = JSON.parse(encodeSave(state)); malformed.state.missionProgress.records['eden-prime'].channel.remaining = 9;
  assert.equal(decodeSave(JSON.stringify(malformed)), null);
  const old = JSON.parse(encodeSave(state)); delete old.state.missionProgress;
  const migrated = decodeSave(JSON.stringify(old)); assert.ok(migrated); assert.equal(migrated.missionProgress.records['eden-prime'].status, 'idle');
  let getters = 0; const input = JSON.parse(encodeSave(state));
  Object.defineProperty(input.state.missionProgress.records['eden-prime'], 'remaining', { enumerable: true, get() { getters++; return 290; } });
  assert.equal(decodeSave(input), null); assert.equal(getters, 0);
});

test('native chapter resolution remains blocked during an activated objective and pays exactly once after completion', () => {
  const state = prepared('eden-prime', { allEncounters: true }); advanceMission(state, 'eden-prime', 'start');
  const resources = economy(state); assert.equal(completeZone(state, 'eden-prime'), false); assert.deepEqual(economy(state), resources);
  for (const step of MISSION_DEFINITIONS['eden-prime'].steps) {
    state.position = { x: step.x, z: step.z }; advanceMission(state, missionPOI('eden-prime', step.id), 'disarm'); tickMission(state, 6);
  }
  assert.equal(completeZone(state, 'eden-prime'), true); assert.equal(state.xp, resources.xp + CHAPTERS['eden-prime'].reward);
  assert.equal(state.credits, resources.credits + 180); const paid = clone(state);
  assert.equal(completeZone(state, 'eden-prime'), false); assert.deepEqual(state, paid); assert.ok(decodeSave(encodeSave(state)));
});

test('mission countdown and channel completion consume the same elapsed simulation time at several cadences', () => {
  const snapshots = [];
  for (const fps of [5, 10, 60]) {
    const state = prepared('eden-prime'); advanceMission(state, 'eden-prime', 'start');
    advanceMission(state, missionPOI('eden-prime', 'charge-1'), 'disarm');
    for (let index = 0; index < fps * 7; index++) tickMission(state, 1 / fps);
    const record = state.missionProgress.records['eden-prime']; snapshots.push(record.remaining);
    assert.equal(record.channel, null); assert.deepEqual(record.steps, ['charge-1']);
  }
  assert.ok(snapshots.every(value => Math.abs(value - 293) < 1e-8));
});

test('all dynamic anchors lie on native authored ground; journal reports remaining time and no false completed steps', () => {
  for (const id of Object.keys(MISSION_DEFINITIONS)) {
    const state = prepared(id); advanceMission(state, id, 'start');
    for (const step of MISSION_DEFINITIONS[id].steps) assert.equal(isLevelGround(getLevelLayout(id), step.x, step.z), true, `${id}/${step.id}`);
    for (const poi of getMissionPOIs(state)) { assert.equal(poi.zone, id); assert.equal(poi.missionId, id); }
    assert.match(renderMissionProgress(state), /data-mission-progress=/); assert.ok(missionHUDText(state).length > 0);
  }
  assert.equal(missionTimeLabel(60), '1:00'); assert.equal(missionTimeLabel(.1), '0:01'); assert.equal(missionTimeLabel(null), '');
  assert.equal(renderMissionProgress(newGame()), '');
});
