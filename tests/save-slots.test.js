import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MANUAL_SAVE_KEY_PREFIX, MANUAL_SAVE_SLOT_IDS, listManualSaves,
  readManualSave, writeManualSave, deleteManualSave,
} from '../src/save-slots.js';
import { newGame, SAVE_KEY, encodeSave, saveTo, loadFrom } from '../src/state.js';

function memoryStorage() {
  const records = new Map();
  return {
    records,
    getItem: key => records.get(key) ?? null,
    setItem: (key, value) => records.set(key, String(value)),
    removeItem: key => records.delete(key),
  };
}
const keyFor = id => MANUAL_SAVE_KEY_PREFIX + id;
const snapshot = storage => [...storage.records.entries()];

test('six distinct manual slots start empty and remain independent of automatic saves', () => {
  const storage = memoryStorage();
  const auto = newGame({ name: 'Automatic' });
  assert.equal(saveTo(storage, auto), true);
  const autoBytes = storage.getItem(SAVE_KEY);
  const empty = listManualSaves(storage);
  assert.equal(empty.ok, true);
  assert.equal(empty.slots.length, 6);
  assert.deepEqual(empty.slots.map(slot => slot.id), ['1', '2', '3', '4', '5', '6']);
  assert.ok(empty.slots.every(slot => slot.status === 'empty' && slot.metadata === null));

  for (const id of MANUAL_SAVE_SLOT_IDS) {
    const state = newGame({ name: `Commander ${id}` });
    state.credits += Number(id);
    assert.equal(writeManualSave(storage, id, state, { name: `Mission ${id}` }).ok, true);
  }
  for (const id of MANUAL_SAVE_SLOT_IDS) {
    const result = readManualSave(storage, id);
    assert.equal(result.ok, true);
    assert.equal(result.state.name, `Commander ${id}`);
    assert.equal(result.state.credits, 250 + Number(id));
  }
  assert.equal(storage.getItem(SAVE_KEY), autoBytes);
  assert.deepEqual(loadFrom(storage), auto);
  assert.equal(listManualSaves(storage).slots.filter(slot => slot.status === 'saved').length, 6);
});

test('manual metadata reliably describes the validated state and actual save timestamp', () => {
  const storage = memoryStorage();
  const state = newGame({ name: 'Jane', classId: 'adept', appearance: 'female', origin: 'earthborn', psychologicalProfile: 'war-hero' });
  state.flags.briefed = true;
  state.zone = 'eden-prime';
  state.position = { x: 2, z: -3 };
  const before = Date.now();
  const written = writeManualSave(storage, '1', state, { name: '  Avant la balise  ' });
  const after = Date.now();
  assert.equal(written.ok, true);
  assert.deepEqual(written.metadata, {
    name: 'Avant la balise', savedAt: written.metadata.savedAt, zone: 'eden-prime',
    commanderName: 'Jane', classId: 'adept', appearance: 'female',
  });
  assert.ok(Date.parse(written.metadata.savedAt) >= before && Date.parse(written.metadata.savedAt) <= after);
  assert.deepEqual(readManualSave(storage, '1').state, state);
  assert.deepEqual(listManualSaves(storage).slots[0].metadata, written.metadata);
  const stored = JSON.parse(storage.getItem(keyFor('1')));
  assert.equal(stored.save.savedAt, written.metadata.savedAt);
  // Untrusted duplicate preview fields cannot misrepresent the loaded payload.
  stored.metadata = { zone: 'ilos', commanderName: 'Fake', classId: 'soldier', appearance: 'male' };
  storage.setItem(keyFor('1'), JSON.stringify(stored));
  assert.deepEqual(readManualSave(storage, '1').metadata, written.metadata);
});

test('unnamed saves receive a label with their zone and stored date', () => {
  const storage = memoryStorage();
  const result = writeManualSave(storage, '2', newGame());
  assert.equal(result.ok, true);
  assert.equal(result.metadata.name, `Normandy SR-1 · ${result.metadata.savedAt.slice(0, 16).replace('T', ' ')} UTC`);
});

test('occupied and corrupted slots require explicit overwrite before any replacement', () => {
  const storage = memoryStorage();
  const first = newGame({ name: 'First' });
  const second = newGame({ name: 'Second' });
  assert.equal(writeManualSave(storage, '1', first).ok, true);
  const original = storage.getItem(keyFor('1'));
  assert.equal(writeManualSave(storage, '1', second).code, 'occupied');
  assert.equal(writeManualSave(storage, '1', second, { overwrite: false }).code, 'occupied');
  assert.equal(storage.getItem(keyFor('1')), original);
  assert.equal(writeManualSave(storage, '1', second, { overwrite: true }).ok, true);
  assert.equal(readManualSave(storage, '1').state.name, 'Second');

  storage.setItem(keyFor('2'), '{broken JSON');
  assert.equal(listManualSaves(storage).slots[1].status, 'corrupt');
  assert.equal(readManualSave(storage, '2').code, 'corrupt');
  assert.equal(writeManualSave(storage, '2', first).code, 'occupied');
  assert.equal(storage.getItem(keyFor('2')), '{broken JSON');
  assert.equal(writeManualSave(storage, '2', first, { overwrite: true }).ok, true);
  assert.equal(listManualSaves(storage).slots[1].status, 'saved');
});

test('invalid slot IDs, labels and options cannot touch storage', () => {
  const storage = memoryStorage();
  const state = newGame();
  assert.equal(writeManualSave(storage, '1', state).ok, true);
  const initial = snapshot(storage);
  const hostile = { toString() { throw new Error('Must not coerce'); } };
  for (const id of [undefined, null, 1, 0, '0', '7', '', 'constructor', '__proto__', 'toString', [], hostile]) {
    assert.equal(writeManualSave(storage, id, state).code, 'invalid-id');
    assert.equal(readManualSave(storage, id).code, 'invalid-id');
    assert.equal(deleteManualSave(storage, id).code, 'invalid-id');
  }
  for (const name of [null, '', '  ', 'x'.repeat(61), 'newline\n', 'tab\t', 'nul\u0000', 'delete\u007f', 23, {}, []]) {
    assert.equal(writeManualSave(storage, '1', state, { name, overwrite: true }).code, 'invalid-name');
  }
  for (const options of [null, false, [], { overwrite: 'true' }, { overwrite: 1 }, { overrite: true }, Object.create({ overwrite: true }), { get overwrite() { throw new Error('Must not invoke'); } }]) {
    assert.equal(writeManualSave(storage, '1', state, options).code, 'invalid-options');
  }
  assert.deepEqual(snapshot(storage), initial);
  assert.equal(writeManualSave(storage, '2', state, { name: 'x'.repeat(60) }).ok, true);
});

test('invalid imported states never replace an existing slot even with overwrite requested', () => {
  const storage = memoryStorage();
  const state = newGame();
  assert.equal(writeManualSave(storage, '1', state).ok, true);
  const original = storage.getItem(keyFor('1'));
  const cycle = {}; cycle.self = cycle;
  const invalidStates = [null, undefined, {}, cycle, { ...state, origin: 'invented' }, { ...state, zone: 'ilos' }, { ...state, party: ['shepard', 'shepard'] }];
  for (const invalid of invalidStates) {
    assert.equal(writeManualSave(storage, '1', invalid, { overwrite: true }).code, 'invalid-save');
    assert.equal(storage.getItem(keyFor('1')), original);
  }
});

test('malformed records stay visibly corrupted rather than appearing empty', () => {
  const storage = memoryStorage();
  assert.equal(writeManualSave(storage, '1', newGame()).ok, true);
  const good = JSON.parse(storage.getItem(keyFor('1')));
  const invalidRecords = [
    '', 'null', '[]', '{}', JSON.stringify({ ...good, version: 2 }),
    JSON.stringify({ ...good, name: '' }),
    JSON.stringify({ ...good, save: { ...good.save, savedAt: 'yesterday' } }),
    JSON.stringify({ ...good, save: { ...good.save, state: { ...good.save.state, origin: 'invented' } } }),
    JSON.stringify({ ...good, save: encodeSave(newGame()) }),
  ];
  for (const raw of invalidRecords) {
    storage.setItem(keyFor('2'), raw);
    const listed = listManualSaves(storage);
    assert.equal(listed.ok, true);
    assert.equal(listed.slots[1].status, 'corrupt');
    assert.equal(listed.slots[1].metadata, null);
    assert.equal(listed.slots[0].status, 'saved');
    assert.equal(readManualSave(storage, '2').code, 'corrupt');
    assert.equal(storage.getItem(keyFor('2')), raw);
  }
  assert.equal(readManualSave(storage, '3').code, 'empty');
});

test('storage quota errors preserve the old slot and automatic save', () => {
  const storage = memoryStorage();
  const original = newGame({ name: 'Before' });
  assert.equal(saveTo(storage, original), true);
  assert.equal(writeManualSave(storage, '1', original).ok, true);
  const initial = snapshot(storage);
  const fullStorage = { ...storage, setItem() { const error = new Error('Full'); error.name = 'QuotaExceededError'; throw error; } };
  const result = writeManualSave(fullStorage, '1', newGame({ name: 'After' }), { overwrite: true });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'storage-full');
  assert.deepEqual(snapshot(storage), initial);
});

test('unavailable storage is contained and distinct from empty or corrupted slots', () => {
  for (const storage of [undefined, null, {}, {
    getItem() { throw new Error('Disabled'); }, setItem() { throw new Error('Disabled'); }, removeItem() { throw new Error('Disabled'); },
  }]) {
    const listed = listManualSaves(storage);
    assert.equal(listed.ok, false);
    assert.equal(listed.code, 'storage-unavailable');
    assert.ok(listed.slots.every(slot => slot.status === 'unavailable'));
    assert.equal(readManualSave(storage, '1').code, 'storage-unavailable');
    assert.equal(writeManualSave(storage, '1', newGame()).code, 'storage-unavailable');
    assert.equal(deleteManualSave(storage, '1').code, 'storage-unavailable');
  }
  const storage = memoryStorage();
  assert.equal(writeManualSave(storage, '1', newGame()).ok, true);
  const partlyUnavailable = { getItem(key) { if (key === keyFor('2')) throw new Error('Unavailable'); return storage.getItem(key); } };
  const result = listManualSaves(partlyUnavailable);
  assert.equal(result.ok, false);
  assert.equal(result.slots[0].status, 'saved');
  assert.equal(result.slots[1].status, 'unavailable');
  assert.equal(result.slots[2].status, 'empty');
});

test('manual loading migrates legacy dossier fields and returns independent state copies', () => {
  const storage = memoryStorage();
  const state = newGame({ appearance: 'female', origin: 'colonist', psychologicalProfile: 'war-hero' });
  assert.equal(writeManualSave(storage, '1', state).ok, true);
  const stored = JSON.parse(storage.getItem(keyFor('1')));
  delete stored.save.state.appearance;
  delete stored.save.state.origin;
  delete stored.save.state.psychologicalProfile;
  storage.setItem(keyFor('1'), JSON.stringify(stored));
  const loaded = readManualSave(storage, '1');
  assert.equal(loaded.ok, true);
  assert.equal(loaded.state.appearance, 'male');
  assert.equal(loaded.state.origin, 'spacer');
  assert.equal(loaded.state.psychologicalProfile, 'sole-survivor');
  assert.equal(loaded.metadata.appearance, 'male');
  loaded.state.settings.sound = false;
  loaded.state.credits = 0;
  assert.equal(readManualSave(storage, '1').state.settings.sound, true);
  assert.equal(readManualSave(storage, '1').state.credits, state.credits);
  assert.equal(storage.getItem(keyFor('1')), JSON.stringify(stored), 'A read must not rewrite legacy records');
});

test('deletion affects only the chosen slot and contains removal failures', () => {
  const storage = memoryStorage();
  assert.equal(saveTo(storage, newGame()), true);
  for (const id of ['1', '2']) assert.equal(writeManualSave(storage, id, newGame()).ok, true);
  const auto = storage.getItem(SAVE_KEY), second = storage.getItem(keyFor('2'));
  const failing = { ...storage, removeItem() { throw new Error('Disabled'); } };
  assert.equal(deleteManualSave(failing, '1').code, 'storage-unavailable');
  assert.equal(readManualSave(storage, '1').ok, true);
  assert.deepEqual(deleteManualSave(storage, '1'), { ok: true, id: '1' });
  assert.equal(readManualSave(storage, '1').code, 'empty');
  assert.equal(storage.getItem(SAVE_KEY), auto);
  assert.equal(storage.getItem(keyFor('2')), second);
  storage.setItem(keyFor('3'), '{broken');
  assert.equal(deleteManualSave(storage, '3').ok, true);
  assert.equal(listManualSaves(storage).slots[2].status, 'empty');
  assert.equal(deleteManualSave(storage, '1').ok, true, 'Deleting an empty slot is harmless');
});
