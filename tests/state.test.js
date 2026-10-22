import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newGame, unlockedZones, encounterIndex, zoneEncounters, winEncounter, completeZone,
  recruit, setSquad, encodeSave, decodeSave, buyUpgrade, objectiveReady,
  canStartEncounter, saveTo, loadFrom, SAVE_KEY,
} from '../src/state.js';
import { actorFor, CLASSES, ENEMIES, enemiesFor } from '../src/game-data.js';

const snapshot = state => JSON.stringify(state);
const envelope = state => JSON.parse(encodeSave(state));
function assertRoundtrip(state) {
  const loaded = decodeSave(encodeSave(state));
  assert.ok(loaded, `Save rejected at ${state.zone}; completed=${state.completed.join(',')}`);
  assert.deepEqual(loaded, state);
  return loaded;
}
function travel(state, zone) {
  assert.ok(unlockedZones(state).includes(zone), `${zone} should be unlocked`);
  state.zone = zone;
  state.position = null;
}
function clear(state, zone) {
  travel(state, zone);
  for (const id of zoneEncounters(zone)) {
    assert.equal(canStartEncounter(state, id).ok, true, id);
    assert.equal(winEncounter(state, id), true, id);
    assertRoundtrip(state);
  }
}
function finish(state, zone, choice) {
  clear(state, zone);
  assert.equal(completeZone(state, zone, choice), true, zone);
  assertRoundtrip(state);
}
function reachSpectre() {
  const state = newGame();
  state.flags.briefed = true;
  finish(state, 'eden-prime');
  travel(state, 'citadel');
  for (const id of ['garrus', 'tali', 'wrex']) {
    assert.equal(recruit(state, id), true);
    assertRoundtrip(state);
  }
  assert.equal(completeZone(state, 'citadel'), true);
  assertRoundtrip(state);
  return state;
}

test('a fresh game is independent and invalid creation enums fall back safely', () => {
  const first = newGame();
  first.completed.push('ilos');
  first.settings.sound = false;
  const second = newGame({ classId: 'constructor', difficulty: 'impossible', mode: 'broken', name: '  ' });
  assert.equal(second.zone, 'normandy');
  assert.deepEqual(second.completed, []);
  assert.equal(second.settings.sound, true);
  assert.equal(second.classId, 'soldier');
  assert.equal(second.difficulty, 'normal');
  assert.equal(second.mode, 'wait');
  assert.equal(second.name, 'Shepard');
  assert.deepEqual(unlockedZones(second), ['normandy']);
  assertRoundtrip(second);
});

test('exact encounter ids, destination, order and unlock gates precede all rewards', () => {
  const state = newGame();
  for (const id of ['invented:boss', 'eden-prime:invented', 'citadel:boss', 'normandy:boss', null]) {
    const before = snapshot(state);
    assert.equal(encounterIndex(id), -1);
    assert.equal(canStartEncounter(state, id).ok, false);
    assert.equal(winEncounter(state, id), false);
    assert.equal(snapshot(state), before);
  }
  assert.equal(winEncounter(state, 'eden-prime:encounter-1'), false);
  state.flags.briefed = true;
  assert.equal(winEncounter(state, 'eden-prime:encounter-1'), false); // Still aboard.
  travel(state, 'eden-prime');
  assert.equal(winEncounter(state, 'eden-prime:encounter-2'), false);
  assert.equal(winEncounter(state, 'eden-prime:boss'), false);
  assert.equal(winEncounter(state, 'eden-prime:encounter-1'), true);
  const before = snapshot(state);
  assert.equal(winEncounter(state, 'eden-prime:encounter-1'), false);
  assert.equal(snapshot(state), before);
  assert.equal(objectiveReady(state, 'eden-prime'), false);
  assert.equal(objectiveReady(state, 'normandy'), false);
  assert.equal(objectiveReady(state, 'invented'), false);
  assert.deepEqual(zoneEncounters('citadel'), []);
});

test('the full legitimate campaign survives save/load after every encounter and chapter', () => {
  const state = reachSpectre();
  assert.ok(!unlockedZones(state).includes('virmire'));
  finish(state, 'therum');
  assert.ok(state.recruited.includes('liara'));
  finish(state, 'feros', 'save');
  assert.ok(unlockedZones(state).includes('virmire'));
  assert.ok(!unlockedZones(state).includes('ilos'));
  finish(state, 'virmire', 'save-kaidan');
  assert.ok(!unlockedZones(state).includes('ilos'));
  finish(state, 'noveria', 'release');
  assert.ok(unlockedZones(state).includes('ilos'));
  finish(state, 'ilos');
  finish(state, 'citadel-finale', 'save-council');
  assert.equal(state.ending, true);
  assert.equal(state.completed.length, 8);
  assert.equal(state.cleared.length, 21);
  assert.deepEqual(state.lost, ['jenkins', 'ashley']);
  assert.equal(state.paragon, 60);
  travel(state, 'normandy');
  assertRoundtrip(state);
});

test('sensitive decisions must be explicit and valid before any mutation', () => {
  const state = reachSpectre();
  for (const [zone, choice] of [['feros', 'force'], ['noveria', 'destroy'], ['virmire', 'save-ashley']]) {
    clear(state, zone);
    const before = snapshot(state);
    for (const invalid of [undefined, null, '', 'invented', false]) {
      assert.equal(completeZone(state, zone, invalid), false);
      assert.equal(snapshot(state), before);
    }
    assert.equal(completeZone(state, zone, choice), true);
    assertRoundtrip(state);
  }
  finish(state, 'therum');
  finish(state, 'ilos');
  clear(state, 'citadel-finale');
  const before = snapshot(state);
  assert.equal(completeZone(state, 'citadel-finale'), false);
  assert.equal(completeZone(state, 'citadel-finale', 'destroy'), false);
  assert.equal(snapshot(state), before);
  assert.equal(completeZone(state, 'citadel-finale', 'focus-sovereign'), true);
  assert.ok(state.lost.includes('kaidan'));
  assert.ok(!state.party.includes('kaidan'));
  assert.equal(state.renegade, 60);
  assertRoundtrip(state);
});

test('objectives cannot complete remotely, early, twice, or with an unrelated choice', () => {
  const state = newGame();
  assert.equal(completeZone(state, 'eden-prime'), false);
  assert.equal(completeZone(state, 'invented'), false);
  state.flags.briefed = true;
  clear(state, 'eden-prime');
  assert.equal(completeZone(state, 'eden-prime', 'save'), false);
  travel(state, 'normandy');
  assert.equal(completeZone(state, 'eden-prime'), false);
  travel(state, 'eden-prime');
  assert.equal(completeZone(state, 'eden-prime'), true);
  const before = snapshot(state);
  assert.equal(completeZone(state, 'eden-prime'), false);
  assert.equal(snapshot(state), before);
});

test('recruitment follows story gates and lost companions cannot return', () => {
  const initial = newGame();
  for (const id of ['liara', 'ashley', 'garrus', 'tali', 'wrex', 'shepard', '__proto__']) assert.equal(recruit(initial, id), false);
  const state = reachSpectre();
  assert.equal(recruit(state, 'garrus'), false);
  assert.equal(recruit(state, 'liara'), false);
  assert.equal(recruit(state, 'jenkins'), false);
  finish(state, 'feros', 'save');
  finish(state, 'noveria', 'release');
  finish(state, 'virmire', 'save-kaidan');
  assert.equal(recruit(state, 'ashley'), false);
  assert.ok(!state.party.includes('ashley'));
  assert.equal(state.party.length, 3);
});

test('squad selection is restricted to unique living recruits at the Normandy', () => {
  const state = reachSpectre();
  assert.equal(setSquad(state, ['garrus', 'tali']), false);
  travel(state, 'normandy');
  const before = snapshot(state);
  for (const ids of [['garrus', 'garrus'], ['liara', 'tali'], ['shepard', 'tali'], ['jenkins', 'tali'], ['garrus'], ['garrus', 'tali', 'wrex'], null]) {
    assert.equal(setSquad(state, ids), false);
    assert.equal(snapshot(state), before);
  }
  assert.equal(setSquad(state, ['garrus', 'tali']), true);
  assert.deepEqual(state.party, ['shepard', 'garrus', 'tali']);
  assertRoundtrip(state);
});

test('equipment purchases enforce access, recruited actor, caps and exact payment', () => {
  const state = newGame();
  assert.equal(buyUpgrade(state, 'liara', 'rifle').ok, false);
  assert.equal(buyUpgrade(state, '__proto__', 'rifle').ok, false);
  assert.equal(buyUpgrade(state, 'shepard', 'invented').ok, false);
  assert.equal(buyUpgrade(state, 'shepard', 'rifle').ok, true);
  assert.equal(state.credits, 70);
  assert.equal(state.upgrades.shepard.attack, 3);
  assert.equal(buyUpgrade(state, 'shepard', 'rifle').ok, false);
  assert.equal(state.credits, 70);
  assertRoundtrip(state);
  state.credits = 10000;
  for (let i = 0; i < 4; i += 1) assert.equal(buyUpgrade(state, 'shepard', 'rifle').ok, true);
  const before = snapshot(state);
  assert.equal(buyUpgrade(state, 'shepard', 'rifle').ok, false);
  assert.equal(snapshot(state), before);
  state.medigel = 9;
  const credits = state.credits;
  assert.equal(buyUpgrade(state, 'shepard', 'medigel').ok, false);
  assert.equal(state.credits, credits);
  state.flags.briefed = true;
  travel(state, 'eden-prime');
  assert.equal(buyUpgrade(state, 'shepard', 'armor').ok, false);
});

test('valid saves reconstruct nested data without sharing references', () => {
  const state = reachSpectre();
  state.settings.sound = false;
  state.position = { x: 2, z: -3 };
  state.collected.push('normandy:medbay-restock', 'eden-prime:cache');
  buyUpgrade(state, 'shepard', 'shield');
  const loaded = assertRoundtrip(state);
  loaded.upgrades.shepard.shield = 999;
  loaded.settings.volume = 0;
  loaded.logs[0].text = 'changed';
  assert.equal(state.upgrades.shepard.shield, 15);
  assert.equal(state.settings.volume, 0.35);
  assert.notEqual(state.logs[0].text, 'changed');
  state.position.zone = state.zone;
  assert.deepEqual(decodeSave(encodeSave(state)).position, { x: 2, z: -3 });
  assert.ok(actorFor('shepard', decodeSave(encodeSave(state))).maxHp > 0);
});

test('malformed nested records and arrays are rejected before actor/UI access', () => {
  const mutate = [
    state => { state.upgrades = null; },
    state => { state.choices = null; },
    state => { state.logs = [null]; },
    state => { state.logs = [{ title: 'Title', text: {} }]; },
    state => { state.flags = []; },
    state => { state.settings = null; },
    state => { state.upgrades = { shepard: null }; },
    state => { state.upgrades = { shepard: { attack: null } }; },
    state => { state.upgrades = { shepard: { attack: 999, attackCount: 1 } }; },
    state => { state.upgrades = { shepard: { attack: 18, attackCount: 6 } }; },
    state => { state.upgrades = { shepard: { arbitrary: 1 } }; },
    state => { state.upgrades = { liara: { attack: 3, attackCount: 1 } }; },
    state => { state.party = ['shepard', , 'kaidan']; },
  ];
  for (const change of mutate) {
    const data = envelope(newGame());
    change(data.state);
    assert.equal(decodeSave(data), null);
  }
});

test('class, difficulty, mode, booleans, settings and numeric bounds are validated', () => {
  const cases = [
    ['classId', 'mage'], ['classId', 'constructor'], ['difficulty', 'invalid'], ['mode', 'turbo'],
    ['xp', -5], ['credits', 0.5], ['medigel', 10], ['playedSeconds', Infinity], ['ending', 'false'],
    ['zone', 'unknown'], ['position', { x: '1', z: 2 }], ['position', { x: 0, z: 0, zone: 'ilos' }],
    ['settings', { sound: 'false' }], ['settings', { volume: 1.1 }], ['settings', { volume: NaN }],
    ['flags', { briefed: 'true' }], ['flags', { spectre: true }],
  ];
  for (const [key, value] of cases) {
    const data = envelope(newGame());
    data.state[key] = value;
    assert.equal(decodeSave(data), null, key);
  }
});

test('saved squads cannot duplicate, omit Shepard, exceed three, or include unrecruited/lost actors', () => {
  const state = reachSpectre();
  for (const party of [[], ['tali', 'shepard'], ['shepard', 'tali', 'tali'], ['shepard', 'liara'], ['shepard', 'jenkins'], ['shepard', 'tali', 'garrus', 'wrex']]) {
    const data = envelope(state);
    data.state.party = party;
    assert.equal(decodeSave(data), null);
  }
  for (const patch of [{ recruited: ['kaidan', 'jenkins', 'kaidan'] }, { lost: ['liara'] }, { recruited: ['shepard', 'kaidan', 'jenkins'] }]) {
    const data = envelope(newGame());
    Object.assign(data.state, patch);
    assert.equal(decodeSave(data), null);
  }
});

test('save progression cannot forge completion, out-of-order encounters, future choices or losses', () => {
  const cases = [
    state => { state.completed = ['ilos']; },
    state => { state.zone = 'ilos'; },
    state => { state.flags.briefed = true; state.completed = ['eden-prime']; },
    state => { state.flags.briefed = true; state.cleared = ['eden-prime:boss']; },
    state => { state.choices = { noveria: 'release' }; },
    state => { state.ending = true; },
    state => { state.lost = ['kaidan']; state.party = ['shepard', 'jenkins']; },
    state => { state.collected = ['ilos:cache']; },
    state => { state.collected = ['normandy:invented']; },
  ];
  for (const change of cases) {
    const data = envelope(newGame());
    change(data.state);
    assert.equal(decodeSave(data), null);
  }
  const state = reachSpectre();
  finish(state, 'feros', 'save');
  const data = envelope(state);
  delete data.state.choices.feros;
  assert.equal(decodeSave(data), null);
});

test('prototype keys, inherited dictionaries, accessors and cycles are rejected safely', () => {
  for (const field of ['upgrades', 'flags', 'choices', 'settings']) {
    const data = envelope(newGame());
    data.state[field] = JSON.parse('{"__proto__":{"polluted":true}}');
    assert.equal(decodeSave(data), null);
  }
  for (const dangerous of ['constructor', 'prototype']) {
    const data = envelope(newGame());
    data.state.upgrades[dangerous] = {};
    assert.equal(decodeSave(data), null);
  }
  const inherited = envelope(newGame());
  inherited.state.upgrades = Object.create({ shepard: { attack: 3 } });
  assert.equal(decodeSave(inherited), null);
  let getterInvoked = false;
  const accessor = envelope(newGame());
  Object.defineProperty(accessor.state, 'name', { enumerable: true, get() { getterInvoked = true; return 'Shepard'; } });
  assert.equal(decodeSave(accessor), null);
  assert.equal(getterInvoked, false);
  const cyclic = envelope(newGame());
  cyclic.state.extra = cyclic;
  assert.equal(decodeSave(cyclic), null);
  assert.equal({}.polluted, undefined);
});

test('invalid saves cannot overwrite the last valid save and storage errors are contained', () => {
  const entries = new Map();
  const storage = { setItem: (key, value) => entries.set(key, value), getItem: key => entries.get(key) ?? null };
  const state = newGame();
  assert.equal(saveTo(storage, state), true);
  const saved = entries.get(SAVE_KEY);
  const invalid = newGame();
  invalid.upgrades = null;
  assert.equal(saveTo(storage, invalid), false);
  assert.equal(entries.get(SAVE_KEY), saved);
  assert.deepEqual(loadFrom(storage), state);
  entries.set(SAVE_KEY, 'bad json');
  assert.equal(loadFrom(storage), null);
  assert.equal(saveTo({ setItem() { throw Error('quota'); } }, state), false);
  assert.equal(loadFrom({ getItem() { throw Error('denied'); } }), null);
});

test('organic enemy definitions no longer assign guns or biotic Warp, and boss hacking is blocked', () => {
  assert.deepEqual(CLASSES.soldier.powers, []);
  for (const id of ['husk', 'creeper']) assert.equal(ENEMIES[id].primaryAction, 'strike');
  for (const id of ['rachni', 'thorian']) {
    assert.equal(ENEMIES[id].primaryAction, 'acid');
    assert.equal(ENEMIES[id].powers.includes('warp'), false);
  }
  assert.equal(ENEMIES.thorian.hackImmune, true);
  assert.equal(ENEMIES['saren-final'].hackImmune, true);
  const enemies = enemiesFor('noveria', 1, newGame());
  assert.ok(enemies.every(enemy => enemy.primaryAction === 'acid'));
});
