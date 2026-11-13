import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, winEncounter, completeZone, recruit, zoneEncounters, encodeSave, decodeSave } from '../src/state.js';
import { createAdvanceFerosState, normalizeAdvanceFerosState, FEROS_COLONIST_TARGETS,
  FEROS_PRESSURE_VALVES, ferosPressure, listAdvanceFerosPOIs, getAdvanceFerosInteraction,
  transitionAdvanceFeros, advanceFerosEncounterGate, advanceFerosCompletionGate,
  ferosColonyReport, advanceFerosCivilianAlive, isAdvanceFerosUntouched } from '../src/advance-feros.js';

const clone = value => JSON.parse(JSON.stringify(value));
const id = key => `advance:feros:${key}`;
function prepared() {
  return { zone: 'feros', completed: ['eden-prime', 'citadel'], cleared: ['feros:encounter-1'],
    flags: { spectre: true }, advanceFeros: createAdvanceFerosState(), choices: {},
    credits: 1234, xp: 120, medigel: 4, paragon: 20, renegade: 20, inventory: { unchanged: true }, position: null };
}
function act(state, key, choice) {
  const poi = listAdvanceFerosPOIs(state).find(poi => poi.id === id(key));
  assert.ok(poi, key); state.position = { x: poi.x, z: poi.z };
  const before = clone(state), result = transitionAdvanceFeros(state, id(key), choice);
  assert.equal(result.ok, true, result.reason); assert.deepEqual(state, before, 'Pure transition must not mutate its input');
  state.advanceFeros = result.progress; return result;
}
function returnPrepared(jeong = 'confront') {
  const state = prepared(); act(state, 'defense', 'coordinate'); act(state, 'lizbeth', 'listen');
  state.cleared.push('feros:encounter-2'); act(state, 'investigation', 'research');
  for (const index of [1, 3, 4]) act(state, 'pressure', `valve-${index}`);
  act(state, 'pressure', 'release'); act(state, 'jeong', jeong); act(state, 'juliana', 'prepare');
  return state;
}
function colonyPrepared(methodFor = () => 'gas') {
  const state = returnPrepared();
  FEROS_COLONIST_TARGETS.forEach((target, index) => act(state, `colonist-${target.id}`, methodFor(target, index)));
  act(state, 'freighter', 'open'); return state;
}

test('Feros only absent legacy state migrates and never invents individual lives or a Shiala fate', () => {
  const state = prepared(); delete state.advanceFeros;
  assert.deepEqual(normalizeAdvanceFerosState(undefined, state), createAdvanceFerosState());
  state.completed.push('feros'); state.choices.feros = 'save';
  const migrated = normalizeAdvanceFerosState(undefined, state);
  assert.equal(migrated.legacy, true); assert.equal(Object.values(migrated.colonists).filter(Boolean).length, 0);
  state.advanceFeros = migrated;
  assert.equal(ferosColonyReport(state).known, false); assert.equal(ferosColonyReport(state).spared, null);
  assert.equal(ferosColonyReport(state).legacyChoice, 'save'); assert.equal(advanceFerosCivilianAlive(state, 'shiala'), null);
  for (const bad of [null, [], {}, { ...migrated, version: 2 }, { ...migrated, extra: true }])
    assert.equal(normalizeAdvanceFerosState(bad, state), null);
  const impossible = clone(migrated); impossible.colonists.davin = 'gas';
  assert.equal(normalizeAdvanceFerosState(impossible, state), null);
});

test('post-boss old saves also migrate honestly, while forged legacy without an old milestone is refused', () => {
  const state = prepared(), legacy = { ...createAdvanceFerosState(), legacy: true };
  assert.equal(normalizeAdvanceFerosState(legacy, state), null);
  state.cleared.push('feros:boss');
  assert.equal(normalizeAdvanceFerosState(undefined, state).legacy, true);
  state.advanceFeros = legacy;
  assert.equal(advanceFerosCompletionGate(state).ok, true);
  assert.deepEqual(listAdvanceFerosPOIs(state), []);
});

test('strict records refuse accessors, foreign keys, unsupported methods and impossible milestones', () => {
  const state = prepared(); let reads = 0;
  const getter = createAdvanceFerosState(); Object.defineProperty(getter, 'cipher', { enumerable: true, get() { reads++; return true; } });
  assert.equal(normalizeAdvanceFerosState(getter, state), null); assert.equal(reads, 0);
  const symbol = createAdvanceFerosState(); symbol[Symbol('extra')] = true;
  assert.equal(normalizeAdvanceFerosState(symbol, state), null);
  for (const mutate of [p => { p.lizbeth = true; }, p => { p.cipher = true; }, p => { p.shiala = 'spared'; },
    p => { p.colonists.davin = 'gas'; }, p => { p.colonists.davin = 'creeper'; }, p => { p.valves = 32; },
    p => { p.gasIssued = true; }, p => { p.jeong = 'paid'; }, p => { p.colonists['fai-dan'] = 'gas'; }]) {
    const raw = createAdvanceFerosState(); mutate(raw); assert.equal(normalizeAdvanceFerosState(raw, state), null);
  }
});

test('Feros stages gate revelations and are isolated from foreign campaigns, zones and distant actors', () => {
  const state = prepared();
  assert.equal(isAdvanceFerosUntouched(state), true);
  assert.equal(getAdvanceFerosInteraction(state, id('investigation')).ok, false);
  assert.equal(getAdvanceFerosInteraction(state, id('shiala')).ok, false);
  assert.equal(advanceFerosEncounterGate(state, 'feros:encounter-2').ok, false);
  assert.equal(advanceFerosEncounterGate(state, 'feros:boss').ok, false);
  assert.equal(advanceFerosCompletionGate(state).ok, false);
  for (const changes of [{ zone: 'normandy' }, { flags: {} }, { completed: [] }, { mediaId: 'ME2' },
    { context: { mediaId: 'ME3', periodId: 'me3' } }, { position: { x: 900, z: 900 } }]) {
    const blocked = { ...clone(state), ...changes }, before = clone(blocked);
    assert.equal(transitionAdvanceFeros(blocked, id('defense'), 'coordinate').ok, false); assert.deepEqual(blocked, before);
  }
  act(state, 'defense', 'coordinate'); assert.equal(isAdvanceFerosUntouched(state), false);
  act(state, 'lizbeth', 'listen'); assert.equal(advanceFerosEncounterGate(state, 'feros:encounter-2').ok, true);
  assert.equal(getAdvanceFerosInteraction(state, id('lizbeth')).ok, false, 'A resolved witness does not replay the full dialogue');
  assert.equal(getAdvanceFerosInteraction(state, id('investigation')).ok, false, 'Research still requires ExoGeni security');
});

test('five pressure valves require an actual safe combination before the ship and return unlock', () => {
  assert.deepEqual(FEROS_PRESSURE_VALVES, [5, 7, 17, 11, 13]);
  const state = prepared(); act(state, 'defense', 'coordinate'); act(state, 'lizbeth', 'listen');
  state.cleared.push('feros:encounter-2'); act(state, 'investigation', 'research');
  state.position = { x: 30, z: -54 };
  const before = clone(state);
  assert.equal(transitionAdvanceFeros(state, id('pressure'), 'release').ok, false); assert.deepEqual(state, before);
  for (const index of [1, 3, 4]) act(state, 'pressure', `valve-${index}`);
  assert.equal(ferosPressure(state.advanceFeros), 31);
  act(state, 'pressure', 'valve-0'); assert.equal(ferosPressure(state.advanceFeros), 36);
  assert.equal(getAdvanceFerosInteraction(state, id('pressure')).choices.at(-1).disabled, true);
  act(state, 'pressure', 'valve-0'); act(state, 'pressure', 'release');
  assert.equal(state.advanceFeros.shipReleased, true);
  assert.equal(getAdvanceFerosInteraction(state, id('pressure')).ok, false);
  assert.equal(getAdvanceFerosInteraction(state, id('jeong')).ok, true);
});

test('Jeong persuasion, intimidation and armed confrontation remain distinct recorded outcomes', () => {
  for (const [selected, expected] of [['persuade', 'persuaded'], ['intimidate', 'intimidated'], ['confront', 'killed']]) {
    const state = returnPrepared(selected);
    assert.equal(state.advanceFeros.jeong, expected);
    assert.equal(getAdvanceFerosInteraction(state, id('jeong')).ok, false);
    assert.equal(state.paragon, 20); assert.equal(state.renegade, 20, 'No repeated dialogue morality reward');
  }
  const state = returnPrepared(); state.advanceFeros.jeong = null; state.advanceFeros.gasIssued = false;
  state.paragon = 19; state.renegade = 19; state.position = { x: -20, z: -10 };
  for (const selected of ['persuade', 'intimidate']) assert.equal(transitionAdvanceFeros(state, id('jeong'), selected).ok, false);
  assert.equal(getAdvanceFerosInteraction(state, id('jeong')).choices[0].reason.includes('20 points conciliants'), true);
});

test('receiving gas saves nobody; sixteen actual target actions produce a mixed, exact civilian report', () => {
  const state = returnPrepared(), economy = clone({ credits: state.credits, xp: state.xp, medigel: state.medigel, inventory: state.inventory });
  assert.equal(ferosColonyReport(state).spared, 0); assert.equal(ferosColonyReport(state).pending, 16);
  assert.equal(listAdvanceFerosPOIs(state).filter(poi => poi.targetId).length, 16);
  FEROS_COLONIST_TARGETS.forEach((target, index) => act(state, `colonist-${target.id}`, index < 5 ? 'gas' : index < 12 ? 'melee' : 'lethal'));
  const report = ferosColonyReport(state);
  assert.deepEqual([report.resolved, report.spared, report.killed, report.gas, report.melee, report.pending], [16, 12, 4, 5, 7, 0]);
  assert.equal(report.survivors.length, 12); assert.equal(report.survivors.some(target => target.id === 'fai-dan'), false);
  assert.equal(advanceFerosCivilianAlive(state, 'davin'), false);
  assert.equal(advanceFerosCivilianAlive(state, 'garage-1'), true);
  assert.equal(listAdvanceFerosPOIs(state).filter(poi => poi.targetId).length, 0);
  const frozen = clone(state); assert.equal(transitionAdvanceFeros(state, id('colonist-garage-1'), 'lethal').ok, false); assert.deepEqual(state, frozen);
  assert.deepEqual({ credits: state.credits, xp: state.xp, medigel: state.medigel, inventory: state.inventory }, economy);
});

test('cargo requires every civilian; Fai Dan death is separate and boss permission follows the cargo', () => {
  const state = returnPrepared(); state.position = { x: -24, z: 72 };
  assert.equal(transitionAdvanceFeros(state, id('freighter'), 'open').ok, false);
  FEROS_COLONIST_TARGETS.forEach(target => act(state, `colonist-${target.id}`, 'gas'));
  assert.equal(advanceFerosEncounterGate(state, 'feros:boss').ok, false);
  const result = act(state, 'freighter', 'open'); assert.match(result.response, /Fai Dan/);
  assert.equal(advanceFerosCivilianAlive(state, 'fai-dan'), false);
  assert.equal(ferosColonyReport(state).spared, 16); assert.equal(advanceFerosEncounterGate(state, 'feros:boss').ok, true);
});

test('Shiala transmits the Cipher after the boss, and both fates preserve that acquired knowledge', () => {
  for (const [choice, fate] of [['spare', 'spared'], ['kill', 'killed']]) {
    const state = colonyPrepared();
    assert.equal(getAdvanceFerosInteraction(state, id('shiala')).ok, false);
    state.cleared.push('feros:boss');
    assert.equal(ferosColonyReport(state).cipher, false);
    act(state, 'shiala', 'receive'); assert.equal(state.advanceFeros.cipher, true);
    assert.equal(advanceFerosCompletionGate(state).ok, false);
    act(state, 'shiala', choice); assert.equal(state.advanceFeros.shiala, fate);
    assert.equal(advanceFerosCompletionGate(state).ok, true); assert.equal(state.advanceFeros.cipher, true);
    assert.equal(advanceFerosCivilianAlive(state, 'shiala'), choice === 'spare');
    const resumed = JSON.parse(JSON.stringify(state));
    assert.deepEqual(normalizeAdvanceFerosState(resumed.advanceFeros, resumed), state.advanceFeros);
    assert.deepEqual(ferosColonyReport(resumed), ferosColonyReport(state));
    assert.equal(getAdvanceFerosInteraction(resumed, id('shiala')).ok, false);
  }
});

test('the compatibility summary comes from acts, never an arbitrary colony save button', () => {
  const saved = colonyPrepared(), killed = colonyPrepared(() => 'lethal');
  saved.choices.feros = 'force'; killed.choices.feros = 'save';
  assert.equal(ferosColonyReport(saved).completionChoice, 'save');
  assert.equal(ferosColonyReport(killed).completionChoice, 'force');
  assert.equal(ferosColonyReport(killed).spared, 0); assert.equal(ferosColonyReport(killed).killed, 16);
});

test('explicit imported Jeong outcomes must retain the morality threshold that made the choice possible', () => {
  for (const [selected, score] of [['persuade', 'paragon'], ['intimidate', 'renegade']]) {
    const state = returnPrepared(selected), before = clone(state.advanceFeros);
    state[score] = 19;
    assert.equal(normalizeAdvanceFerosState(state.advanceFeros, state), null);
    assert.deepEqual(state.advanceFeros, before, 'Refused imported outcomes cannot repair or reset the input');
    state[score] = 20; assert.ok(normalizeAdvanceFerosState(state.advanceFeros, state));
  }
});

test('modern final colony choice must match actual targets both at completion and in imported saves', () => {
  for (const method of ['gas', 'lethal']) {
    const state = newGame(); state.flags.briefed = true;
    for (const zone of ['eden-prime', 'citadel']) {
      state.zone = zone; if (zone === 'citadel') assert.equal(recruit(state, 'tali'), true);
      for (const encounter of zoneEncounters(zone)) assert.equal(winEncounter(state, encounter), true);
      assert.equal(completeZone(state, zone), true);
    }
    state.zone = 'feros'; for (const encounter of zoneEncounters('feros')) assert.equal(winEncounter(state, encounter), true);
    state.advanceFeros = colonyPrepared(() => method).advanceFeros;
    act(state, 'shiala', 'receive'); act(state, 'shiala', 'spare');
    const matching = method === 'gas' ? 'save' : 'force', contradicting = method === 'gas' ? 'force' : 'save';
    const before = clone(state);
    assert.equal(completeZone(state, 'feros', contradicting), false); assert.deepEqual(state, before);
    assert.equal(completeZone(state, 'feros', matching), true);
    state.choices.feros = contradicting;
    assert.equal(normalizeAdvanceFerosState(state.advanceFeros, state), null);
    state.choices.feros = matching;
    assert.ok(normalizeAdvanceFerosState(state.advanceFeros, state));
  }
});

test('real campaign save encode/decode preserves partial targets and final fate and refuses contradictory explicit progress', () => {
  const state = newGame(); state.flags.briefed = true;
  for (const zone of ['eden-prime', 'citadel']) {
    state.zone = zone; if (zone === 'citadel') assert.equal(recruit(state, 'tali'), true);
    for (const encounter of zoneEncounters(zone)) assert.equal(winEncounter(state, encounter), true);
    assert.equal(completeZone(state, zone), true);
  }
  const modern = colonyPrepared();
  state.zone = 'feros'; state.cleared.push('feros:encounter-1', 'feros:encounter-2');
  state.advanceFeros = modern.advanceFeros;
  let resumed = decodeSave(encodeSave(state)); assert.ok(resumed); assert.deepEqual(resumed.advanceFeros, state.advanceFeros);
  assert.equal(completeZone(state, 'feros', 'save'), false, 'No final reward before boss and Shiala');
  assert.equal(winEncounter(state, 'feros:boss'), true); act(state, 'shiala', 'receive'); act(state, 'shiala', 'kill');
  assert.equal(completeZone(state, 'feros', 'save'), true);
  resumed = decodeSave(encodeSave(state)); assert.ok(resumed);
  assert.deepEqual(resumed.advanceFeros, state.advanceFeros); assert.equal(resumed.advanceFeros.cipher, true); assert.equal(resumed.advanceFeros.shiala, 'killed');
  const invalid = JSON.parse(encodeSave(state)); invalid.state.advanceFeros.cipher = false;
  assert.equal(decodeSave(invalid), null);
  const missing = JSON.parse(encodeSave(state)); delete missing.state.advanceFeros;
  const migrated = decodeSave(missing); assert.ok(migrated); assert.equal(migrated.advanceFeros.legacy, true); assert.equal(ferosColonyReport(migrated).spared, null);
});
