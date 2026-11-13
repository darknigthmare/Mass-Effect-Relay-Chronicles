import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, zoneEncounters, winEncounter, completeZone, recruit, encodeSave, decodeSave } from '../src/state.js';
import { getConversation, readTopic } from '../src/story.js';
import { createResolveNoveriaState, normalizeResolveNoveriaState, getResolveNoveriaInteraction,
  transitionResolveNoveria, listResolveNoveriaPOIs, resolveNoveriaEncounterGate,
  resolveNoveriaContactAvailable, noveriaResolutionReport } from '../src/resolve-noveria.js';

const clone = value => JSON.parse(JSON.stringify(value));
const id = key => `resolve:noveria:${key}`;
function prepared() {
  return { zone: 'noveria', completed: ['eden-prime', 'citadel'], cleared: [], flags: { spectre: true },
    resolveNoveria: createResolveNoveriaState(), choices: {}, paragon: 20, renegade: 20,
    xp: 1200, credits: 1800, inventory: { untouched: true }, position: null,
    missionProgress: { records: { noveria: { status: 'active', steps: [], remaining: null, attempts: 1, channel: null } } } };
}
function act(state, key, selected, step = 'intro') {
  const poi = listResolveNoveriaPOIs(state).find(poi => poi.id === id(key));
  assert.ok(poi, `${key} available`); state.position = { x: poi.x, z: poi.z };
  const before = clone(state), result = transitionResolveNoveria(state, id(key), selected, step);
  assert.equal(result.ok, true, result.reason); assert.deepEqual(state, before, 'Transition is pure');
  if (result.progress) state.resolveNoveria = result.progress;
  return result;
}
function evidence(state = prepared()) {
  act(state, 'anoleis', 'request'); act(state, 'lorik', 'accept'); act(state, 'evidence', 'retrieve'); return state;
}
function investigation() {
  const state = evidence(); act(state, 'parasini', 'investigate'); return state;
}

test('only absent old Noveria state migrates; explicit invalid state and invented legacy details fail', () => {
  const state = prepared(); delete state.resolveNoveria;
  assert.deepEqual(normalizeResolveNoveriaState(undefined, state), createResolveNoveriaState());
  state.cleared.push('noveria:encounter-1');
  const migrated = normalizeResolveNoveriaState(undefined, state);
  assert.equal(migrated.legacy, true); assert.equal(migrated.pass, null); assert.equal(migrated.gianna, 'reception');
  state.resolveNoveria = migrated;
  assert.equal(noveriaResolutionReport(state).known, false);
  assert.equal(noveriaResolutionReport(state).anoleis, null);
  assert.equal(resolveNoveriaEncounterGate(state, 'noveria:encounter-1').ok, true);
  for (const bad of [null, [], {}, { ...migrated, extra: 1 }, { ...migrated, pass: 'lorik' }])
    assert.equal(normalizeResolveNoveriaState(bad, state), null);
  assert.equal(normalizeResolveNoveriaState(migrated, prepared()), null);
});

test('strict schema refuses accessors, foreign keys and impossible evidence/death/testimony combinations', () => {
  const state = prepared(); let reads = 0;
  const getter = createResolveNoveriaState(); Object.defineProperty(getter, 'evidence', { enumerable: true, get() { reads++; return 'held'; } });
  assert.equal(normalizeResolveNoveriaState(getter, state), null); assert.equal(reads, 0);
  for (const change of [{ version: 2 }, { pass: 'opold' }, { evidence: 'held' }, { gianna: 'dead' },
    { anoleis: 'arrested' }, { lorikTestimony: 'charmed' }, { opold: 'reported' }, { pass: 'constructor' }])
    assert.equal(normalizeResolveNoveriaState({ ...createResolveNoveriaState(), ...change }, state), null);
  const symbol = createResolveNoveriaState(); symbol[Symbol('extra')] = true;
  assert.equal(normalizeResolveNoveriaState(symbol, state), null);
});

test('port options are isolated by campaign, location, proximity and current evidence', () => {
  const state = prepared(); assert.equal(resolveNoveriaEncounterGate(state, 'noveria:encounter-1').ok, false);
  assert.equal(getResolveNoveriaInteraction(state, id('evidence')).ok, false);
  assert.equal(getResolveNoveriaInteraction(state, id('lorik')).ok, false);
  for (const change of [{ zone: 'normandy' }, { completed: [] }, { flags: {} }, { mediaId: 'ME2' },
    { context: { mediaId: 'ME3', periodId: 'me3' } }, { position: { x: 900, z: 900 } }]) {
    const blocked = { ...clone(state), ...change }, before = clone(blocked);
    assert.equal(transitionResolveNoveria(blocked, id('anoleis'), 'request').ok, false); assert.deepEqual(blocked, before);
  }
});

test('Lorik direct pass and handing evidence to Anoleis remain distinct routes with no repeated reward', () => {
  for (const [person, pass] of [['lorik', 'lorik'], ['anoleis', 'anoleis-evidence']]) {
    const state = evidence(), economic = [state.xp, state.credits, state.paragon, state.renegade, clone(state.inventory)];
    act(state, person, 'give-evidence');
    assert.equal(state.resolveNoveria.pass, pass);
    assert.equal(state.resolveNoveria.evidence, person);
    assert.equal(resolveNoveriaEncounterGate(state, 'noveria:encounter-1').ok, true);
    assert.equal(transitionResolveNoveria(state, id(person), 'give-evidence').ok, false);
    assert.deepEqual([state.xp, state.credits, state.paragon, state.renegade, state.inventory], economic);
  }
});

test('Gianna revelation requires held evidence; both testimony methods yield arrest and remove those contacts', () => {
  for (const method of ['charm', 'intimidate']) {
    const state = investigation();
    assert.equal(transitionResolveNoveria(state, id('parasini'), 'report-testimony').ok, false);
    act(state, 'lorik', method); act(state, 'parasini', 'report-testimony');
    assert.equal(state.resolveNoveria.pass, 'gianna'); assert.equal(state.resolveNoveria.evidence, 'gianna');
    assert.equal(state.resolveNoveria.anoleis, 'arrested'); assert.equal(state.resolveNoveria.gianna, 'arrested-anoleis');
    assert.equal(resolveNoveriaContactAvailable(state, 'anoleis'), false);
    assert.equal(resolveNoveriaContactAvailable(state, 'parasini'), false);
    assert.equal(getResolveNoveriaInteraction(state, id('anoleis')).ok, false);
    assert.equal(getResolveNoveriaInteraction(state, id('parasini')).ok, false);
    assert.equal(normalizeResolveNoveriaState({ ...state.resolveNoveria, opold: 'reported' }, state), null,
      'A reported package would have granted the first pass before the administrator was arrested');
  }
});

test('adapted persuasion thresholds are visible, revalidated, and do not bar direct alternatives', () => {
  const state = investigation(); state.paragon = state.renegade = 19;
  const model = getResolveNoveriaInteraction(state, id('lorik'));
  assert.match(model.choices.find(c => c.id === 'charm').reason, /Adaptation.*Charme/);
  state.position = { x: -10, z: 51 };
  for (const method of ['charm', 'intimidate']) assert.equal(transitionResolveNoveria(state, id('lorik'), method).ok, false);
  act(state, 'lorik', 'decline-testimony');
  assert.equal(state.resolveNoveria.lorikTestimony, 'declined');
  act(state, 'anoleis', 'give-evidence'); assert.equal(state.resolveNoveria.pass, 'anoleis-evidence');
  const forged = investigation().resolveNoveria; forged.lorikTestimony = 'charmed';
  assert.equal(normalizeResolveNoveriaState(forged, state), null);
});

test('exposing Gianna preserves the lethal outcome, corpse retrieval and stale callback rejection', () => {
  const state = investigation(); act(state, 'lorik', 'intimidate');
  act(state, 'anoleis', 'expose-gianna');
  assert.equal(state.resolveNoveria.pass, null);
  assert.equal(state.resolveNoveria.gianna, 'dead'); assert.equal(state.resolveNoveria.anoleis, 'dead');
  assert.equal(resolveNoveriaEncounterGate(state, 'noveria:encounter-1').ok, false);
  assert.equal(resolveNoveriaContactAvailable(state, 'parasini'), false);
  assert.equal(transitionResolveNoveria(state, id('parasini'), 'report-testimony').ok, false);
  act(state, 'corpse', 'take-pass'); assert.equal(state.resolveNoveria.pass, 'anoleis-corpse');
  assert.equal(resolveNoveriaEncounterGate(state, 'noveria:encounter-1').ok, true);
  assert.equal(getResolveNoveriaInteraction(state, id('corpse')).ok, false);
});

test('original story APIs also reject dead or arrested port contacts and cannot record their stale topics', () => {
  for (const outcome of ['arrest', 'death']) {
    const state = investigation();
    assert.ok(getConversation(state, 'anoleis')); assert.ok(getConversation(state, 'parasini'));
    const oldAnoleis = getConversation(state, 'anoleis').topics[0].id;
    const oldParasini = getConversation(state, 'parasini').topics[0].id;
    if (outcome === 'arrest') { act(state, 'lorik', 'charm'); act(state, 'parasini', 'report-testimony'); }
    else act(state, 'anoleis', 'expose-gianna');
    const before = clone(state);
    assert.equal(getConversation(state, 'anoleis'), null); assert.equal(getConversation(state, 'parasini'), null);
    assert.equal(readTopic(state, 'anoleis', oldAnoleis).ok, false);
    assert.equal(readTopic(state, 'parasini', oldParasini).ok, false);
    assert.deepEqual(state, before);
    assert.ok(getConversation(state, 'lorik'), 'Other living contacts remain available');
  }
});

test('Opold refusal is reversible; reporting the real package grants a pass without blocking the investigation', () => {
  const state = prepared(); act(state, 'opold', 'refuse'); assert.equal(state.resolveNoveria.opold, 'none');
  assert.equal(getResolveNoveriaInteraction(state, id('package')).ok, false);
  act(state, 'opold', 'accept'); act(state, 'package', 'take'); act(state, 'anoleis', 'report-package');
  assert.equal(state.resolveNoveria.pass, 'opold'); assert.equal(state.resolveNoveria.opold, 'reported');
  evidence(state); act(state, 'parasini', 'investigate'); act(state, 'lorik', 'charm'); act(state, 'parasini', 'report-testimony');
  assert.equal(state.resolveNoveria.pass, 'opold', 'First actual pass source is preserved');
  assert.equal(state.resolveNoveria.anoleis, 'arrested');
  assert.equal(transitionResolveNoveria(state, id('anoleis'), 'report-package').ok, false);
});

test('MIRA assistance reflects each repair and rejects a stale tram choice after a repair is removed', () => {
  const state = evidence(); act(state, 'lorik', 'give-evidence'); state.cleared.push('noveria:encounter-1');
  assert.equal(getResolveNoveriaInteraction(state, id('mira')).ok, false);
  const record = state.missionProgress.records.noveria; record.steps.push('memory');
  assert.match(getResolveNoveriaInteraction(state, id('mira'), 'reactor').text, /Reconnectez/);
  assert.equal(getResolveNoveriaInteraction(state, id('mira')).choices.find(c => c.id === 'tram').disabled, true);
  record.steps.push('power'); assert.match(getResolveNoveriaInteraction(state, id('mira'), 'reactor').text, /rétablie/);
  record.steps.push('uplink'); assert.equal(getResolveNoveriaInteraction(state, id('mira')).choices.find(c => c.id === 'tram').disabled, false);
  assert.equal(act(state, 'mira', 'tram').nextStep, 'tram');
  record.steps.pop(); state.position = { x: 6, z: -8 };
  assert.equal(transitionResolveNoveria(state, id('mira'), 'tram').ok, false);
  assert.equal(getResolveNoveriaInteraction(state, id('mira'), 'tram').ok, false);
});

test('the queen explains her children and future before explicit completion effects owned by state', () => {
  const state = evidence(); act(state, 'lorik', 'give-evidence');
  assert.equal(getResolveNoveriaInteraction(state, id('queen')).ok, false);
  state.cleared.push('noveria:encounter-1', 'noveria:encounter-2', 'noveria:boss');
  assert.match(getResolveNoveriaInteraction(state, id('queen')).text, /asari/);
  assert.match(getResolveNoveriaInteraction(state, id('queen'), 'children').text, /sans mon chant/);
  assert.match(getResolveNoveriaInteraction(state, id('queen'), 'future').text, /paix/);
  for (const selected of ['release', 'destroy']) {
    const result = act(state, 'queen', selected, 'decision');
    assert.equal(result.effect, `complete-${selected}`); assert.equal(result.changed, false);
    assert.equal(state.choices.noveria, undefined);
  }
  state.completed.push('noveria'); state.choices.noveria = 'release';
  assert.equal(getResolveNoveriaInteraction(state, id('queen')).ok, false);
  assert.equal(noveriaResolutionReport(state).queen, 'release');
});

test('real campaign saves preserve port branches and queen choices, refuse forged evidence, and migrate old absence', () => {
  for (const selected of ['release', 'destroy']) {
    const state = newGame(); state.flags.briefed = true; state.zone = 'eden-prime';
    for (const encounter of zoneEncounters('eden-prime')) assert.equal(winEncounter(state, encounter), true);
    assert.equal(completeZone(state, 'eden-prime'), true); state.zone = 'citadel';
    assert.equal(recruit(state, 'tali'), true); assert.equal(completeZone(state, 'citadel'), true);
    state.zone = 'noveria'; state.paragon = 20;
    evidence(state); act(state, 'parasini', 'investigate'); act(state, 'lorik', 'charm'); act(state, 'parasini', 'report-testimony');
    let loaded = decodeSave(encodeSave(state)); assert.ok(loaded); assert.deepEqual(loaded.resolveNoveria, state.resolveNoveria);
    for (const encounter of zoneEncounters('noveria')) assert.equal(winEncounter(state, encounter), true);
    assert.equal(completeZone(state, 'noveria', selected), true);
    loaded = decodeSave(encodeSave(state)); assert.ok(loaded);
    assert.deepEqual(noveriaResolutionReport(loaded), noveriaResolutionReport(state));
    assert.equal(loaded.choices.noveria, selected); assert.equal(loaded.resolveNoveria.anoleis, 'arrested');
    const bad = JSON.parse(encodeSave(state)); bad.state.resolveNoveria.evidence = 'held';
    assert.equal(decodeSave(bad), null);
    const absent = JSON.parse(encodeSave(state)); delete absent.state.resolveNoveria;
    loaded = decodeSave(absent); assert.ok(loaded); assert.equal(loaded.resolveNoveria.legacy, true);
    assert.equal(noveriaResolutionReport(loaded).known, false); assert.equal(noveriaResolutionReport(loaded).queen, selected);
    for (const value of [null, {}, undefined]) {
      const explicit = JSON.parse(encodeSave(state)); explicit.state.resolveNoveria = value;
      assert.equal(decodeSave(explicit), null);
    }
  }
});
