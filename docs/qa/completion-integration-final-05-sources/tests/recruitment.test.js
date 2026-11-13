import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newGame, unlockedZones, objectiveReady, recruit, availableCrew, setSquad,
  zoneEncounters, winEncounter, completeZone, encodeSave, decodeSave,
} from '../src/state.js';

const snapshot = state => JSON.stringify(state);
function assertRoundtrip(state) {
  assert.deepEqual(decodeSave(encodeSave(state)), state);
}
function travel(state, zone) {
  assert.ok(unlockedZones(state).includes(zone));
  state.zone = zone;
  state.position = null;
}
function finish(state, zone, choice) {
  travel(state, zone);
  for (const encounter of zoneEncounters(zone)) {
    assert.equal(winEncounter(state, encounter), true);
    assertRoundtrip(state);
  }
  assert.equal(completeZone(state, zone, choice), true);
  assertRoundtrip(state);
}
function reachCitadel() {
  const state = newGame();
  state.flags.briefed = true;
  finish(state, 'eden-prime');
  travel(state, 'citadel');
  return state;
}

for (const optional of [[], ['garrus'], ['wrex'], ['garrus', 'wrex']]) {
  test(`Council progression accepts optional recruitment: ${optional.join(', ') || 'neither Garrus nor Wrex'}`, () => {
    const state = reachCitadel();
    const party = [...state.party];
    for (const id of optional) {
      assert.equal(recruit(state, id), true);
      assertRoundtrip(state);
    }
    assert.equal(objectiveReady(state, 'citadel'), false, 'Tali’s evidence is still required');
    const before = snapshot(state);
    assert.equal(completeZone(state, 'citadel'), false);
    assert.equal(snapshot(state), before, 'An early audience cannot grant rewards');
    assert.equal(recruit(state, 'tali'), true);
    assert.equal(objectiveReady(state, 'citadel'), true);
    assert.deepEqual(state.party, party, 'Recruitment cannot replace the selected squad');
    assert.equal(completeZone(state, 'citadel'), true);
    assert.equal(state.flags.spectre, true);
    assert.ok(unlockedZones(state).includes('therum'));
    for (const id of ['garrus', 'wrex']) assert.equal(state.recruited.includes(id), optional.includes(id));
    assert.deepEqual(state.party, ['shepard', 'kaidan', 'ashley']);
    assertRoundtrip(state);
    const completed = snapshot(state);
    assert.equal(objectiveReady(state, 'citadel'), false);
    assert.equal(completeZone(state, 'citadel'), false);
    assert.equal(snapshot(state), completed);
  });
}

test('Garrus and Wrex can be recruited independently on return visits after the Council', () => {
  const state = reachCitadel();
  assert.equal(recruit(state, 'tali'), true);
  assert.equal(completeZone(state, 'citadel'), true);
  finish(state, 'feros', 'save');
  travel(state, 'normandy');
  const outside = snapshot(state);
  for (const id of ['garrus', 'wrex']) assert.equal(recruit(state, id), false);
  assert.equal(snapshot(state), outside);

  for (const id of ['garrus', 'wrex']) {
    travel(state, 'citadel');
    const oldParty = [...state.party];
    const oldXp = state.xp, oldCredits = state.credits;
    assert.equal(recruit(state, id), true);
    assert.equal(state.recruited.filter(companion => companion === id).length, 1);
    assert.deepEqual(state.party, oldParty);
    assert.equal(state.xp, oldXp);
    assert.equal(state.credits, oldCredits);
    assertRoundtrip(state);
    const recruited = snapshot(state);
    assert.equal(recruit(state, id), false);
    assert.equal(snapshot(state), recruited, 'Repeated conversation cannot duplicate the recruit or log');
    travel(state, 'normandy');
  }
  assert.equal(setSquad(state, ['garrus', 'wrex']), true, 'New recruits are available through normal squad selection');
  assertRoundtrip(state);
});

test('optional recruitment preserves story, location, death and squad-selection restrictions', () => {
  const initial = newGame();
  const before = snapshot(initial);
  for (const id of ['garrus', 'tali', 'wrex', 'liara', 'ashley', 'shepard', '__proto__', 'constructor']) {
    assert.equal(recruit(initial, id), false);
  }
  assert.equal(snapshot(initial), before);
  // Changing the current location alone cannot bypass the Eden Prime gate.
  initial.zone = 'citadel';
  for (const id of ['garrus', 'tali', 'wrex']) assert.equal(recruit(initial, id), false);
  assert.equal(decodeSave(encodeSave(initial)), null);

  const state = reachCitadel();
  for (const id of ['garrus', 'wrex']) assert.equal(availableCrew(state).includes(id), false);
  travel(state, 'normandy');
  const squad = [...state.party];
  assert.equal(setSquad(state, ['garrus', 'wrex']), false);
  assert.deepEqual(state.party, squad);
  travel(state, 'citadel');
  state.lost.push('wrex');
  const lost = snapshot(state);
  assert.equal(recruit(state, 'wrex'), false);
  assert.equal(snapshot(state), lost, 'Recruitment must not revive a lost companion');
});

for (const virmireChoice of ['save-kaidan', 'save-ashley']) {
  test(`the full campaign remains playable without Garrus or Wrex (${virmireChoice})`, () => {
    const state = reachCitadel();
    assert.equal(recruit(state, 'tali'), true);
    assert.equal(completeZone(state, 'citadel'), true);
    finish(state, 'therum');
    finish(state, 'feros', 'save');
    finish(state, 'virmire', virmireChoice);
    assert.equal(state.party.length, 3);
    const lost = virmireChoice === 'save-kaidan' ? 'ashley' : 'kaidan';
    assert.ok(!state.party.includes(lost));
    assert.equal(recruit(state, lost), false);
    finish(state, 'noveria', 'release');
    finish(state, 'ilos');
    finish(state, 'citadel-finale', 'save-council');
    assert.equal(state.ending, true);
    assert.equal(state.cleared.length, 21);
    assert.ok(!state.recruited.includes('garrus'));
    assert.ok(!state.recruited.includes('wrex'));
    assertRoundtrip(state);
  });
}

test('saved Council completion still requires Tali and forbids recruits before Citadel access', () => {
  const state = reachCitadel();
  for (const id of ['garrus', 'tali', 'wrex']) assert.equal(recruit(state, id), true);
  assert.equal(completeZone(state, 'citadel'), true);
  assertRoundtrip(state);
  const missingTali = JSON.parse(encodeSave(state));
  missingTali.state.recruited = missingTali.state.recruited.filter(id => id !== 'tali');
  assert.equal(decodeSave(missingTali), null);
  for (const id of ['garrus', 'tali', 'wrex']) {
    const premature = JSON.parse(encodeSave(newGame()));
    premature.state.recruited.push(id);
    assert.equal(decodeSave(premature), null);
  }
});

test('older saves with all three Citadel recruits and no commander dossier still migrate', () => {
  const state = reachCitadel();
  for (const id of ['garrus', 'tali', 'wrex']) assert.equal(recruit(state, id), true);
  assert.equal(completeZone(state, 'citadel'), true);
  travel(state, 'normandy');
  assert.equal(setSquad(state, ['garrus', 'wrex']), true);
  const legacy = JSON.parse(encodeSave(state));
  for (const field of ['appearance', 'origin', 'psychologicalProfile']) delete legacy.state[field];
  assert.deepEqual(decodeSave(legacy), state);
});
