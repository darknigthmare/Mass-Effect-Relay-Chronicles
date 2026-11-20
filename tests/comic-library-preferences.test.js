import test from 'node:test';
import assert from 'node:assert/strict';
import { createComicLibraryPreferences, normalizeComicLibraryPreferences, updateComicLibraryPreferences,
  encodeComicLibraryPreferences, decodeComicLibraryPreferences, loadComicLibraryPreferences,
  saveComicLibraryPreferences, COMIC_LIBRARY_PREFERENCES_KEY, getComicLibraryIndex,
  getComicLibraryTarget, renderComicLibrary } from '../src/comic-library.js';
import { UNIVERSE_RECORDS } from '../src/universe-data.js';

const clone = value => structuredClone(value);
function storage(initial = []) {
  const values = new Map(initial), reads = [], writes = [];
  return { values, reads, writes, getItem(key) { reads.push(key); return values.get(key) ?? null; },
    setItem(key, value) { writes.push(key); values.set(key, value); } };
}
function change(preferences, command) {
  const before = clone(preferences), result = updateComicLibraryPreferences(preferences, command);
  assert.equal(result.ok, true, result.reason); assert.deepEqual(preferences, before); return result.preferences;
}
const workOrder = html => [...html.matchAll(/data-comic-work="([^"]+)"/g)].map(match => match[1]);

test('an absent library preference key starts fresh and reads no game or Chronicle storage', () => {
  const store = storage([['relay-chronicles.save.v1', 'campaign'], ['relay-chronicles.chronicle.RED.red.v1', 'owner']]);
  const result = loadComicLibraryPreferences(store);
  assert.equal(result.ok, true); assert.equal(result.fresh, true); assert.deepEqual(result.preferences, createComicLibraryPreferences());
  assert.deepEqual(store.reads, [COMIC_LIBRARY_PREFERENCES_KEY]); assert.deepEqual(store.writes, []);
  assert.equal(store.values.size, 2);
});

test('sort, bookmarks, personal consultation, last visit and open sections round-trip independently', () => {
  const store = storage(); let preferences = createComicLibraryPreferences();
  for (const command of [{ type: 'sort', value: 'title' }, { type: 'bookmark', id: 'RED:2' },
    { type: 'consultation', id: 'RED:2', value: 'consulted' }, { type: 'visit', id: 'HOM:1' },
    { type: 'section', id: 'units:RED', value: true }, { type: 'section', id: 'edition:omnibus-1', value: true }]) preferences = change(preferences, command);
  assert.equal(saveComicLibraryPreferences(store, preferences).ok, true);
  const loaded = loadComicLibraryPreferences(store); assert.equal(loaded.fresh, false); assert.deepEqual(loaded.preferences, preferences);
  assert.deepEqual(decodeComicLibraryPreferences(encodeComicLibraryPreferences(preferences)), preferences);
  loaded.preferences.bookmarks.push('INV:1'); loaded.preferences.consultation.RED = 'consulted';
  assert.deepEqual(loadComicLibraryPreferences(store).preferences, preferences);
  assert.deepEqual(new Set(store.writes), new Set([COMIC_LIBRARY_PREFERENCES_KEY]));
});

test('Omnibus links share canonical bookmarks and visits never downgrade an explicit consulted status', () => {
  let preferences = change(createComicLibraryPreferences(), { type: 'bookmark', id: 'omnibus-1/RED' });
  assert.deepEqual(preferences.bookmarks, ['RED']);
  preferences = change(preferences, { type: 'bookmark', id: 'RED' }); assert.deepEqual(preferences.bookmarks, []);
  preferences = change(preferences, { type: 'consultation', id: 'RED', value: 'consulted' });
  preferences = change(preferences, { type: 'visit', id: 'RED:1' });
  assert.equal(preferences.consultation.RED, 'consulted'); assert.equal(preferences.consultation['RED:1'], 'in-progress');
  preferences = change(preferences, { type: 'visit', id: 'omnibus-1/RED' }); assert.equal(preferences.lastTarget, 'RED');
  assert.deepEqual(Object.keys(preferences.consultation).sort(), ['RED', 'RED:1']);
  preferences = change(preferences, { type: 'consultation', id: 'RED:1', value: 'unseen' });
  assert.equal(Object.hasOwn(preferences.consultation, 'RED:1'), false);
});

test('documentary and ambiguous targets store personal markers without selecting a narrative period', () => {
  let preferences = createComicLibraryPreferences();
  for (const id of ['HOM:1', 'BLA:single', 'DIS']) preferences = change(preferences, { type: 'visit', id });
  assert.equal(getComicLibraryTarget('HOM:1').periodId, ''); assert.equal(getComicLibraryTarget('BLA:single').periodId, '');
  assert.equal(preferences.lastTarget, 'DIS'); assert.equal(preferences.consultation.HOM, 'in-progress');
  assert.equal(preferences.consultation['HOM:1'], 'in-progress'); assert.equal(preferences.consultation.BLA, 'in-progress');
  assert.equal(Object.hasOwn(preferences, 'context'), false); assert.equal(Object.hasOwn(preferences, 'party'), false);
  const index = getComicLibraryIndex(); assert.equal(index.workCount, 10); assert.equal(index.unitCount, 34);
});

test('legacy absent optional UI fields migrate but explicit malformed fields and future versions refuse', () => {
  const old = { version: 1, sort: 'volume', bookmarks: [], consultation: {} };
  assert.deepEqual(normalizeComicLibraryPreferences(old), createComicLibraryPreferences());
  for (const raw of [{ ...old, lastTarget: undefined }, { ...old, expanded: null }, { ...old, version: 2 },
    { ...old, bookmarks: ['RED:1', 'RED:1'] }, { ...old, bookmarks: ['omnibus-1/RED'] },
    { ...old, consultation: { RED: 'unseen' } }, { ...old, lastTarget: 'ME1' },
    { ...old, expanded: ['units:ME2'] }, { ...old, extra: true }, null]) assert.equal(normalizeComicLibraryPreferences(raw), null);
  assert.equal(normalizeComicLibraryPreferences(old).lastTarget, null);
});

test('malformed packets preserve the previous storage bytes and reject accessors without running them', () => {
  const preferences = createComicLibraryPreferences(), valid = encodeComicLibraryPreferences(preferences), packet = JSON.parse(valid);
  const malformed = ['{broken', 'x'.repeat(100001), JSON.stringify({ ...packet, version: 2 }),
    JSON.stringify({ ...packet, format: 'relay-chronicles' }), JSON.stringify({ ...packet, extra: true })];
  for (const bytes of malformed) {
    const store = storage([[COMIC_LIBRARY_PREFERENCES_KEY, bytes]]), before = new Map(store.values);
    const result = loadComicLibraryPreferences(store); assert.equal(result.ok, false); assert.equal(result.preferences, null);
    assert.deepEqual(store.values, before); assert.deepEqual(store.writes, []);
  }
  let calls = 0; const accessor = { version: 1, preferences };
  Object.defineProperty(accessor, 'format', { enumerable: true, get() { calls++; return packet.format; } });
  assert.equal(decodeComicLibraryPreferences(accessor), null); assert.equal(calls, 0);
});

test('hostile preference trees and commands never invoke getters, serializers or modify valid data', () => {
  const valid = createComicLibraryPreferences(), hostile = []; let calls = 0;
  const getter = clone(valid); Object.defineProperty(getter.consultation, 'RED', { enumerable: true, get() { calls++; return 'consulted'; } }); hostile.push(getter);
  const symbol = clone(valid); symbol[Symbol('extra')] = true; hostile.push(symbol);
  const hidden = clone(valid); Object.defineProperty(hidden, 'hidden', { value: 1 }); hostile.push(hidden);
  const serializer = clone(valid); serializer.toJSON = () => { calls++; return valid; }; hostile.push(serializer);
  const inherited = Object.assign(Object.create({ extra: true }), valid); hostile.push(inherited);
  const cyclic = clone(valid); cyclic.consultation.RED = cyclic; hostile.push(cyclic);
  const sparse = clone(valid); sparse.bookmarks = new Array(1); hostile.push(sparse);
  for (const raw of hostile) { assert.equal(normalizeComicLibraryPreferences(raw), null); assert.equal(encodeComicLibraryPreferences(raw), null); }
  const command = { type: 'bookmark' }; Object.defineProperty(command, 'id', { enumerable: true, get() { calls++; return 'RED'; } });
  const before = clone(valid); assert.equal(updateComicLibraryPreferences(valid, command).ok, false);
  assert.equal(calls, 0); assert.deepEqual(valid, before);
});

test('unknown targets, invalid enums and command extras refuse before changing personal progress', () => {
  const preferences = change(createComicLibraryPreferences(), { type: 'bookmark', id: 'RED:1' }), before = clone(preferences);
  for (const command of [{ type: 'visit', id: 'ME1' }, { type: 'visit', id: 'RED:5' },
    { type: 'visit', id: 'omnibus-2/RED' }, { type: 'sort', value: 'canon' },
    { type: 'consultation', id: 'RED', value: 'finished-campaign' }, { type: 'bookmark', id: 'RED', reward: 100 },
    { type: 'section', id: 'units:RED', value: 1 }, { type: 'reset', id: 'RED' }]) {
    assert.equal(updateComicLibraryPreferences(preferences, command).ok, false); assert.deepEqual(preferences, before);
  }
  assert.equal(updateComicLibraryPreferences(preferences, { type: 'sort', value: 'volume' }).changed, false);
  const opened = change(preferences, { type: 'section', id: 'units:RED', value: true });
  assert.equal(updateComicLibraryPreferences(opened, { type: 'section', id: 'units:RED', value: true }).changed, false);
});

test('quota and inaccessible storage report failure without erasing a previous save or a game key', () => {
  const initial = encodeComicLibraryPreferences(createComicLibraryPreferences()), values = new Map([[COMIC_LIBRARY_PREFERENCES_KEY, initial], ['relay-chronicles.save.v1', 'keep']]);
  const attempted = [], failed = { getItem() { throw Error('security'); }, setItem(key) { attempted.push(key); throw Error('quota'); } };
  assert.equal(loadComicLibraryPreferences(failed).ok, false); assert.equal(saveComicLibraryPreferences(failed, createComicLibraryPreferences()).ok, false);
  assert.deepEqual(attempted, [COMIC_LIBRARY_PREFERENCES_KEY]);
  assert.deepEqual([...values], [[COMIC_LIBRARY_PREFERENCES_KEY, initial], ['relay-chronicles.save.v1', 'keep']]);
  const store = storage([...values]), before = new Map(store.values);
  assert.equal(saveComicLibraryPreferences(store, { ...createComicLibraryPreferences(), lastTarget: 'ME1' }).ok, false);
  assert.deepEqual(store.values, before); assert.deepEqual(store.writes, []);
});

test('sorting, counters and restored sections remain personal and leave the canonical index unchanged', () => {
  const before = JSON.stringify(getComicLibraryIndex()), registry = JSON.stringify(UNIVERSE_RECORDS);
  let preferences = change(createComicLibraryPreferences(), { type: 'sort', value: 'title' });
  assert.deepEqual(workOrder(renderComicLibrary({ preferences })), ['CON', 'EVO', 'HOM', 'INC', 'INQ', 'INV', 'RED', 'BLA', 'FOU', 'HWB']);
  preferences = change(preferences, { type: 'bookmark', id: 'RED:2' });
  preferences = change(preferences, { type: 'consultation', id: 'RED:2', value: 'consulted' });
  preferences = change(preferences, { type: 'section', id: 'units:RED', value: true });
  preferences = change(preferences, { type: 'sort', value: 'bookmarks' });
  const raw = clone(preferences), html = renderComicLibrary({ preferences }); assert.equal(workOrder(html)[0], 'RED');
  assert.match(html, /data-library-bookmark-count="1" data-library-consulted-work-count="0" data-library-consulted-unit-count="1"/);
  assert.match(html, /data-library-section="units:RED" open/); assert.match(html, /Pagination de l’exemplaire à relever/);
  assert.match(html, /ne constituent|n’attestent/); assert.match(html, /Aucun chapitre, objet ou récompense/);
  assert.equal([...html.matchAll(/data-comic-unit=/g)].length, 34); assert.deepEqual(preferences, raw);
  assert.equal(JSON.stringify(getComicLibraryIndex()), before); assert.equal(JSON.stringify(UNIVERSE_RECORDS), registry);
});

test('readonly preferences disable personal editing while preserving navigation and an honest resume link', () => {
  const preferences = change(createComicLibraryPreferences(), { type: 'visit', id: 'RED:1' });
  const html = renderComicLibrary({ preferences, readOnly: true });
  assert.match(html, /data-library-readonly/); assert.match(html, /id="comic-library-sort" disabled/);
  assert.match(html, /data-library-consultation data-id="RED" disabled/);
  assert.match(html, /data-do="comic-library-resume" data-id="RED:1"/);
  assert.match(html, /data-do="comic-library-open"\s+data-id="RED"/);
  assert.equal(new Set([...html.matchAll(/data-do="comic-library-open"\s+data-id="([^"]+)"/g)].map(match => match[1])).size,
    [...html.matchAll(/data-do="comic-library-open"\s+data-id=/g)].length);
});

test('saving and resuming preferences before and after a real owner dossier never repeats its reward or progress', async () => {
  const { newGame, encodeSave, SAVE_KEY } = await import('../src/state.js');
  const { createChronicle, listComicBriefings, runChronicleComicAction, saveChronicle, loadChronicle, chronicleStorageKey } = await import('../src/chronicles.js');
  const context = { mediaId: 'RED', periodId: 'red' }, store = storage([[SAVE_KEY, encodeSave(newGame())], ['relay-chronicles.manual-save.v1.1', encodeSave(newGame())]]);
  let session = createChronicle(context), preferences = change(createComicLibraryPreferences(), { type: 'visit', id: 'RED:1' });
  assert.equal(saveChronicle(store, session).ok, true); assert.equal(saveComicLibraryPreferences(store, preferences).ok, true);
  const before = new Map(store.values), id = listComicBriefings(context)[0].id;
  session = runChronicleComicAction(session, id, 'method', 'trace').session;
  for (let index = 0; index < 3; index++) session = runChronicleComicAction(session, id, 'pick', index).session;
  session = runChronicleComicAction(session, id, 'finish').session; assert.equal(session.comicProgress[id].closed, true);
  assert.equal(saveChronicle(store, session).ok, true); const ownerBytes = store.getItem(chronicleStorageKey(context));
  preferences = change(loadComicLibraryPreferences(store).preferences, { type: 'consultation', id: 'RED:1', value: 'consulted' });
  for (let index = 0; index < 5; index++) {
    assert.equal(saveComicLibraryPreferences(store, preferences).ok, true);
    preferences = change(loadComicLibraryPreferences(store).preferences, { type: 'visit', id: 'RED:1' });
    assert.equal(store.getItem(chronicleStorageKey(context)), ownerBytes);
    assert.deepEqual(loadChronicle(store, context).session, session);
    assert.equal(store.getItem(SAVE_KEY), before.get(SAVE_KEY));
    assert.equal(store.getItem('relay-chronicles.manual-save.v1.1'), before.get('relay-chronicles.manual-save.v1.1'));
  }
  assert.equal(getComicLibraryIndex().workCount, 10); assert.equal(getComicLibraryIndex().unitCount, 34);
});
