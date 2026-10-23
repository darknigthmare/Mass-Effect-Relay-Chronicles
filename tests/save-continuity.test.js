import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, encodeSave, decodeSave, saveTo, loadFrom, SAVE_KEY } from '../src/state.js';
import { getCurrentContext, createChronicleSession, discoverContent, setChronicleNote } from '../src/continuity.js';
import { writeManualSave, readManualSave } from '../src/save-slots.js';

const storage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
};
const packetFor = state => JSON.parse(encodeSave(state));

test('published campaign saves keep their v1 envelope and implicit fixed ME1 context', () => {
  const state = newGame({ name: 'Ariane', appearance: 'female' }), packet = packetFor(state);
  assert.equal(packet.version, 1); assert.equal(packet.state.version, 1);
  assert.equal(Object.hasOwn(packet.state, 'context'), false);
  assert.deepEqual(decodeSave(packet), state);
  assert.deepEqual(getCurrentContext(state), { mediaId: 'ME1', periodId: 'me1', galaxy: 'milky-way' });
  assert.deepEqual(getCurrentContext({ ...state, context: { mediaId: 'ME3', periodId: 'me3' } }), getCurrentContext(state));
});

test('explicit ME1 save context is accepted but extra epochs, years and foreign contexts fail closed', () => {
  const state = newGame();
  for (const context of [{ mediaId: 'ME1', periodId: 'me1' }, { mediaId: 'ME1', periodId: 'me1', galaxy: 'milky-way' }]) {
    const packet = packetFor(state); packet.state.context = context;
    assert.deepEqual(decodeSave(packet), state);
  }
  const invalid = [null, [], 'ME1', { mediaId: 'ME2', periodId: 'me2' }, { mediaId: 'ME3', periodId: 'me3' },
    { mediaId: 'MEA', periodId: 'mea', galaxy: 'andromeda' }, { mediaId: 'ME1', periodId: 'me1', galaxy: 'andromeda' },
    { mediaId: 'ME1', periodId: 'me1', year: 2183 }, { mediaId: 'ME1', periodId: 'me1', sceneId: 'citadel' },
    { mediaId: 'ME1', periodId: 'me1', extra: true }, { mediaId: 'ME1' }];
  const hidden = { mediaId: 'ME1', periodId: 'me1' }; Object.defineProperty(hidden, 'year', { value: 2183 });
  const symbolic = { mediaId: 'ME1', periodId: 'me1' }; symbolic[Symbol('epoch')] = 'ME3';
  invalid.push(hidden, symbolic);
  for (const context of invalid) { const packet = packetFor(state); packet.state.context = context; assert.equal(decodeSave(packet), null); }
});

test('foreign catalogue actor and equipment IDs cannot be imported as campaign assets', () => {
  const state = newGame(), weapon = packetFor(state);
  weapon.state.inventory.items['ME3-WPN-GRAAL'] = 1;
  weapon.state.inventory.equipped.shepard.weapon = 'ME3-WPN-GRAAL';
  assert.equal(decodeSave(weapon), null);
  const actor = packetFor(state); actor.state.party[1] = 'ME2-CHR-JACK'; actor.state.recruited.push('ME2-CHR-JACK');
  assert.equal(decodeSave(actor), null);
  const chronicle = createChronicleSession({ mediaId: 'ME2', periodId: 'me2' });
  assert.equal(decodeSave({ format: 'relay-chronicles', version: 1, state: chronicle }), null);
});

test('chronicle notes and selections leave the campaign autosave and manual slot unchanged', () => {
  const store = storage(), state = newGame({ name: 'Campagne témoin' });
  assert.equal(saveTo(store, state), true);
  assert.equal(writeManualSave(store, '1', state, { name: 'Campagne ME1' }).ok, true);
  const autoBefore = store.getItem(SAVE_KEY), manualBefore = JSON.stringify(readManualSave(store, '1'));
  const chronicle = createChronicleSession({ mediaId: 'ME2', periodId: 'me2' });
  assert.equal(discoverContent(chronicle, 'ME2-CHR-JACK').ok, true);
  assert.equal(setChronicleNote(chronicle, 'ME2-CHR-JACK', 'Dossier séparé.').ok, true);
  chronicle.party = ['ME2-CHR-JACK']; chronicle.loadouts = { 'ME2-CHR-JACK': { weapon: null, armor: null } };
  assert.equal(store.getItem(SAVE_KEY), autoBefore);
  assert.equal(JSON.stringify(readManualSave(store, '1')), manualBefore);
  assert.deepEqual(loadFrom(store), state);
  const invalid = { ...state, context: { mediaId: 'ME3', periodId: 'me3' } };
  assert.equal(saveTo(store, invalid), false); assert.equal(store.getItem(SAVE_KEY), autoBefore);
  assert.equal(writeManualSave(store, '1', invalid, { overwrite: true }).ok, false);
  assert.equal(JSON.stringify(readManualSave(store, '1')), manualBefore);
});
