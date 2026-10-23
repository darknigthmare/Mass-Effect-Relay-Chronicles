import test from 'node:test';
import assert from 'node:assert/strict';
import { COMMANDER_APPEARANCES, ORIGINS, PSYCHOLOGICAL_PROFILES } from '../src/commander.js';
import { newGame, encodeSave, decodeSave, saveTo, loadFrom, SAVE_KEY } from '../src/state.js';
import { actorFor, CLASSES, CREW } from '../src/game-data.js';

const fields = ['appearance', 'origin', 'psychologicalProfile'];
const defaults = { appearance: 'male', origin: 'spacer', psychologicalProfile: 'sole-survivor' };
const envelope = state => JSON.parse(encodeSave(state));
const dossier = state => Object.fromEntries(fields.map(field => [field, state[field]]));

for (const appearance of Object.keys(COMMANDER_APPEARANCES)) {
  for (const origin of Object.keys(ORIGINS)) {
    for (const psychologicalProfile of Object.keys(PSYCHOLOGICAL_PROFILES)) {
      test(`commander dossier survives save/load: ${appearance}, ${origin}, ${psychologicalProfile}`, () => {
        const options = { appearance, origin, psychologicalProfile };
        const state = newGame({ ...options, name: '  Alex Shepard  ' });
        assert.deepEqual(dossier(state), options);
        assert.equal(state.name, 'Alex Shepard');
        const loaded = decodeSave(encodeSave(state));
        assert.deepEqual(loaded, state);
        const actor = actorFor('shepard', loaded);
        assert.equal(actor.id, 'shepard');
        assert.equal(actor.name, 'Alex Shepard');
        assert.equal(actor.sprite, appearance === 'female' ? 'femshep' : 'shepard');
        assert.equal(loaded.paragon, 0);
        assert.equal(loaded.renegade, 0);
      });
    }
  }
}

test('commander creation defaults invalid dossier choices without coercing arbitrary objects', () => {
  assert.deepEqual(dossier(newGame()), defaults);
  for (const invalid of [undefined, null, '', 'invented', 'constructor', '__proto__', 'toString', 0, true, [], {}, { toString() { throw new Error('Must not coerce'); } }]) {
    const state = newGame(Object.fromEntries(fields.map(field => [field, invalid])));
    assert.deepEqual(dossier(state), defaults);
    assert.ok(decodeSave(encodeSave(state)));
  }
});

test('saved dossier fields reject explicit invalid values rather than migrating them', () => {
  for (const field of fields) {
    for (const invalid of [undefined, null, '', 'invented', 'constructor', '__proto__', 'toString', 0, true, [], {}]) {
      const data = envelope(newGame());
      data.state[field] = invalid;
      assert.equal(decodeSave(data), null, `${field} rejects ${String(invalid)}`);
    }
  }
});

test('legacy version 1 saves migrate absent dossier fields without losing progression', () => {
  const original = newGame();
  original.flags.briefed = true;
  original.zone = 'eden-prime';
  original.position = { x: 3, z: -2 };
  original.playedSeconds = 73;
  original.settings.sound = false;
  original.logs.unshift({ title: 'Briefing', text: 'Mission acceptée.' });
  const data = envelope(original);
  for (const field of fields) delete data.state[field];
  const before = JSON.stringify(data);
  const loaded = decodeSave(data);
  assert.deepEqual(loaded, original);
  assert.equal(JSON.stringify(data), before, 'Migration must not mutate imported data');
  assert.deepEqual(decodeSave(encodeSave(loaded)), loaded);
});

test('partially specified legacy dossiers migrate only absent fields', () => {
  const data = envelope(newGame({ appearance: 'female', origin: 'colonist', psychologicalProfile: 'war-hero' }));
  delete data.state.origin;
  const loaded = decodeSave(data);
  assert.deepEqual(dossier(loaded), { appearance: 'female', origin: 'spacer', psychologicalProfile: 'war-hero' });
  data.state.psychologicalProfile = 'invented';
  assert.equal(decodeSave(data), null);
});

test('dossier settings do not change combat statistics or companion identity', () => {
  for (const classId of Object.keys(CLASSES)) {
    const baseline = actorFor('shepard', newGame({ classId }));
    for (const appearance of Object.keys(COMMANDER_APPEARANCES)) {
      for (const origin of Object.keys(ORIGINS)) {
        for (const psychologicalProfile of Object.keys(PSYCHOLOGICAL_PROFILES)) {
          const state = newGame({ classId, appearance, origin, psychologicalProfile });
          const actor = actorFor('shepard', state);
          assert.deepEqual({ ...actor, sprite: baseline.sprite }, baseline);
          for (const companion of ['kaidan', 'jenkins']) {
            assert.equal(actorFor(companion, state).sprite, CREW[companion].sprite);
            assert.equal(actorFor(companion, state).name, CREW[companion].name);
          }
        }
      }
    }
  }
});

test('storage preserves a selected dossier and rejects an invalid replacement', () => {
  const records = new Map();
  const storage = { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value) };
  const state = newGame({ appearance: 'female', origin: 'earthborn', psychologicalProfile: 'ruthless' });
  assert.equal(saveTo(storage, state), true);
  assert.deepEqual(loadFrom(storage), state);
  const previous = records.get(SAVE_KEY);
  assert.equal(saveTo(storage, { ...state, origin: 'invented' }), false);
  assert.equal(records.get(SAVE_KEY), previous);
});
