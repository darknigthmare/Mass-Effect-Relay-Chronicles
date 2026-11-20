import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getComicLibraryIndex, getComicLibraryTarget, renderComicLibrary } from '../src/comic-library.js';
import { getUniverseWork, getUniverseRecord, UNIVERSE_RECORDS } from '../src/universe-data.js';
import { normalizeContext, listAvailable } from '../src/continuity.js';
import {
  createChronicle, selectChronicleScenario, readChroniclePage, listChronicleReadings,
  encodeChronicle, decodeChronicle, listChronicleScenarios, saveChronicle, loadChronicle,
  chronicleStorageKey,
} from '../src/chronicles.js';
import { SAVE_KEY, encodeSave, newGame } from '../src/state.js';

const catalogue = async id => JSON.parse(await readFile(new URL(`../${getUniverseWork(id).catalogPath}`, import.meta.url), 'utf8'));
const openLibraryHeading = '<section class="comic-library" data-comic-library';
const chronicleContext = id => normalizeContext(getComicLibraryTarget(id));

test('each volume lists its scoped, sourced units once under their canonical owner', async () => {
  const library = await catalogue('LIB');
  const model = getComicLibraryIndex();
  assert.deepEqual(model.volumes.map(volume => volume.works.map(work => work.id)), [
    ['RED', 'EVO', 'INV', 'HOM', 'INC', 'INQ', 'CON'],
    ['FOU', 'HWB', 'BLA'],
  ]);
  assert.equal(model.workCount, 10);
  assert.equal(model.unitCount, 34);
  const expectedScopes = {
    RED: /quatre numéros/iu, EVO: /#1–4/u, INV: /#1–4/u, HOM: /#1–4/u,
    INC: /récit court/iu, INQ: /récit court/iu, CON: /récit court/iu, FOU: /#1–13|treize numéros/iu,
    HWB: /récit autonome|FCBD 2013/iu, BLA: /récit de Blasto|autonome/iu,
  };
  const units = [];
  for (const volume of model.volumes) for (const work of volume.works) {
    const locator = library.entries.find(entry => entry.id === work.locator.id);
    const owner = await catalogue(work.id);
    assert.match(owner.title, new RegExp(`${work.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'u'));
    assert.match(`${owner.scope} ${owner.entries.find(record => record.id === `${work.id}-REF-SCOPE`)?.description || ''}`, expectedScopes[work.id], work.id);
    assert.match(locator.name, new RegExp(`Volume ${volume.number}`, 'u'));
    assert.ok(locator.dependencies.every(id => library.entries.some(entry => entry.id === id)));
    assert.equal(work.locator.nature, 'À vérifier');
    assert.deepEqual(work.locator.sources.map(source => source.id), ['LIB-S-WIKI']);
    assert.equal(work.count, getUniverseWork(work.id).count);
    assert.ok(work.description.length > 0 && work.description.length < 180, work.id);
    if (work.units.length > 1) assert.equal(work.range, `#1–${work.units.length}`);
    assert.ok(work.units.every(unit => unit.page === null));
    units.push(...work.units.map(unit => unit.id));
  }
  assert.equal(new Set(units).size, units.length);
});

test('other publications link to the same units and Discovery stays outside the volume counts', () => {
  const model = getComicLibraryIndex();
  const unique = model.volumes.flatMap(volume => volume.works);
  const libraryUnits = new Set(unique.flatMap(work => work.units.map(unit => unit.id)));
  for (const edition of model.relatedEditions) for (const work of edition.works) {
    assert.ok(getUniverseWork(work.id), work.id);
    for (const id of work.unitIds) assert.ok(libraryUnits.has(id), id);
    assert.deepEqual(getComicLibraryTarget(work.linkId), getComicLibraryTarget(work.id));
  }
  assert.deepEqual(model.relatedEditions.map(edition => [edition.id, edition.works.map(work => work.id)]), [
    ['omnibus-1', ['RED', 'EVO', 'INV', 'HOM']],
    ['omnibus-2', ['FOU', 'HWB', 'BLA']],
    ['complete-comics', ['DIS']],
  ]);
  assert.deepEqual(model.relatedEditions.at(-1).works[0].unitIds, []);
  assert.equal(unique.some(work => work.id === 'DIS'), false);
  assert.equal(new Set([...libraryUnits, ...model.relatedEditions.flatMap(edition => edition.works.flatMap(work => work.unitIds))]).size, 34);
  const vol2 = model.volumes[1];
  assert.equal(vol2.isbn, '9781616556365');
  assert.equal(vol2.announcement.sources[0].id, 'LIB-S-CAT2015');
  assert.match(vol2.announcement.reference, /page PDF 103/);
  assert.ok(vol2.works.every(work => work.units.every(unit => unit.page === null)));
  assert.ok(model.volumes.every(volume => volume.bonuses.every(bonus => bonus.page === null)));
});

test('issue shortcuts reuse genuine periods, preserve ambiguous windows, and reject foreign or forged targets', () => {
  assert.deepEqual(getComicLibraryTarget('EVO:1'), { mediaId: 'EVO', periodId: 'evo-contact' });
  assert.deepEqual(getComicLibraryTarget('EVO:4'), { mediaId: 'EVO', periodId: 'evo-aftermath' });
  assert.deepEqual(getComicLibraryTarget('HOM:1'), { mediaId: 'HOM', periodId: '' });
  assert.deepEqual(getComicLibraryTarget('HOM:3'), { mediaId: 'HOM', periodId: '' });
  assert.deepEqual(getComicLibraryTarget('HOM:4'), { mediaId: 'HOM', periodId: 'hom-4-liara' });
  assert.deepEqual(getComicLibraryTarget('FOU:5'), { mediaId: 'FOU', periodId: 'fou-5' });
  assert.deepEqual(getComicLibraryTarget('FOU:13'), { mediaId: 'FOU', periodId: 'fou-13' });
  assert.deepEqual(getComicLibraryTarget('BLA:single'), { mediaId: 'BLA', periodId: '' });
  assert.deepEqual(getComicLibraryTarget('DIS'), { mediaId: 'DIS', periodId: 'dis' });
  for (const id of ['CUT', 'LIB', 'ME2', 'RED:05', 'RED:1:2', 'RED:', 'FOU:14', 'DIS:1', 'BLA:1',
    'omnibus-2/RED', 'omnibus-1/RED:1', 'omnibus-1/RED/1', 'complete-comics/DIS', null, {}, '__proto__'])
    assert.equal(getComicLibraryTarget(id), null, String(id));
  for (const volume of getComicLibraryIndex().volumes) for (const owner of volume.works) for (const unit of owner.units) {
    const context = getComicLibraryTarget(unit.id);
    assert.equal(context.mediaId, owner.id);
    if (context.periodId) assert.ok(normalizeContext(context));
    assert.ok(unit.periods.every(period => getUniverseWork(owner.id).periods.some(original => original.id === period.id)));
  }
});

test('the hardcover is documentary and an owner route cannot transfer a read or unlock to another work', () => {
  const slots = new Map([[SAVE_KEY, encodeSave(newGame())]]);
  const storage = { setItem: (key,value) => slots.set(key,value), getItem: key => slots.get(key) ?? null };
  const originalCampaign = slots.get(SAVE_KEY), originalRegistry = JSON.stringify(UNIVERSE_RECORDS);
  const red = chronicleContext('RED'), invasion = chronicleContext('INV');
  const library = { mediaId: 'LIB', periodId: 'library-1' };
  assert.equal(normalizeContext(library), null);
  assert.equal(createChronicle(library), null);
  assert.equal(chronicleStorageKey(library), null);
  assert.deepEqual(listChronicleScenarios(library), []);
  assert.deepEqual(listChronicleReadings(library), []);
  assert.deepEqual(listAvailable(library), []);
  assert.equal(getUniverseWork('LIB').periods.length, 0);

  const redReading = listChronicleReadings(red)[0], invReading = listChronicleReadings(invasion)[0];
  assert.ok(redReading && invReading);
  const carried = readChroniclePage(createChronicle(red), redReading.id, 1);
  assert.equal(carried.ok, true, carried.reason);
  assert.equal(saveChronicle(storage, carried.session).ok, true);
  assert.equal(loadChronicle(storage, invasion).fresh, true);
  assert.equal(readChroniclePage(createChronicle(invasion), redReading.id, 1).ok, false);
  assert.equal(selectChronicleScenario(createChronicle(invasion), carried.session.scenarioId).ok, false);
  assert.equal(chronicleContext('BLA'), null);
  assert.equal(chronicleContext('HOM:1'), null);
  assert.match(renderComicLibrary(), /Sommaire Library Edition/);
  assert.deepEqual(decodeChronicle(encodeChronicle(loadChronicle(storage, red).session)), carried.session);
  assert.equal(slots.get(SAVE_KEY), originalCampaign);
  assert.equal(JSON.stringify(UNIVERSE_RECORDS), originalRegistry);
});

test('the rendered index is legible without images and labels edition notices and bonus provenance', () => {
  const html = renderComicLibrary();
  assert.ok(html.includes(openLibraryHeading));
  assert.doesNotMatch(html, /<(?:img|picture|canvas)\b/iu);
  assert.equal([...html.matchAll(/data-comic-work="([^"]+)"/gu)].length,10);
  const units = [...html.matchAll(/data-comic-unit="([^"]+)"/gu)].map(match => match[1]);
  assert.equal(new Set(units).size,34);
  assert.equal(units.length,34);
  assert.match(html,/Édition reliée · ISBN 9781616556365/u);
  assert.match(html,/page PDF 103/u);
  assert.match(html,/À vérifier · Inclusion dans l’édition reliée/u);
  assert.match(html,/Omnibus 2 : récits annoncés/u);
  assert.match(html,/data-comic-edition="complete-comics"/u);
  assert.match(html,/data-comic-source="LIB-S-CAT2015"/u);
  assert.match(html,/data-comic-source="LIB-S-RETAIL"/u);
  assert.match(html,/aria-label="Repères de continuité"/u);
  assert.match(html,/Date non fixée/u);
  const linkIds = [...html.matchAll(/data-do="comic-library-open"\s+data-id="([^"]+)"/gu)].map(match => match[1]);
  assert.equal(new Set(linkIds).size, linkIds.length);
  assert.ok(linkIds.includes('omnibus-1/RED'));
  for (const id of ['LIB-BONUS-ANNOTATIONS', 'LIB-BONUS-COVERS', 'LIB-BONUS-SKETCHES', 'LIB-BONUS-VOL1BONUS']) {
    assert.ok(getUniverseRecord(id));
    assert.ok(html.includes(`data-comic-document="${id}"`), id);
  }
  assert.equal(getComicLibraryIndex().volumes.flatMap(volume => volume.works).some(work => work.id === 'CUT'), false);
});

test('returned arrays are detached and rendering cannot turn a documentary row into a playable one', () => {
  const first = getComicLibraryIndex();
  first.volumes[0].works[0].units[0].periods[0].label = 'Invention';
  first.volumes[0].works[0].locator.sources.length = 0;
  assert.doesNotMatch(renderComicLibrary(), /Invention/u);
  assert.ok(getComicLibraryIndex().volumes[0].works[0].locator.sources.length > 0);
  assert.ok(UNIVERSE_RECORDS.filter(record => record.catalogWorkId === 'LIB').every(record => record.playable === false));
});
