import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPANSION2_FLEET } from '../src/expansion2-fleet.js';
import { EXPANSION_CHARACTERS } from '../src/expansion-characters.js';
import { EXPANSION_ARMOR } from '../src/expansion-armor.js';
import { EXPANSION_WEAPONS } from '../src/expansion-weapons.js';
import { EXPANSION_FLEET } from '../src/expansion-fleet.js';
import { EXPANSION_ENEMIES } from '../src/expansion-enemies.js';
import { canAccessContent } from '../src/continuity.js';
import { getUniverseRecord, getUniverseWork } from '../src/universe-data.js';

const byId = id => EXPANSION2_FLEET.find(entry => entry.recordId === id);
const contextsFor = id => getUniverseRecord(id).availability.flatMap(scope =>
  scope.periodIds.map(periodId => ({ mediaId: scope.mediaId, periodId })));

test('second fleet lot declares its real twenty-six dossiers without reusing any of the first two hundred references', () => {
  const old = [EXPANSION_CHARACTERS, EXPANSION_ARMOR, EXPANSION_WEAPONS, EXPANSION_FLEET, EXPANSION_ENEMIES].flat();
  assert.equal(old.length, 200);
  const oldIds = new Set(old.map(entry => entry.recordId));
  assert.equal(EXPANSION2_FLEET.length, 26);
  assert.equal(new Set(EXPANSION2_FLEET.map(entry => entry.recordId)).size, 26);
  for (const entry of EXPANSION2_FLEET) {
    assert.ok(!oldIds.has(entry.recordId), entry.recordId);
    assert.equal(entry.mode, 'fleet');
    assert.deepEqual(Object.keys(entry).sort(), [
      'recordId', 'mode', 'role', 'simulation', 'notes', 'limitations', ...(entry.blockedReason ? ['blockedReason'] : []),
    ].sort());
  }
});

test('all additional references are factual, sourced and accessible in their original exact published context', () => {
  const works = new Set();
  for (const entry of EXPANSION2_FLEET) {
    const record = getUniverseRecord(entry.recordId), work = getUniverseWork(record.mediaId);
    assert.equal(record.fact, true, entry.recordId);
    assert.ok(record.sourceIds.length, entry.recordId);
    for (const id of record.sourceIds) assert.ok(work.sources.some(source => source.id === id), `${entry.recordId}: ${id}`);
    assert.ok(contextsFor(entry.recordId).some(context => canAccessContent(entry.recordId, context).ok), entry.recordId);
    assert.ok(!['ME4', 'CUT', 'LIB', 'BLA'].includes(record.mediaId));
    works.add(record.mediaId);
  }
  assert.equal(works.size, 12);
});

test('all exports and nested objects are immutable and do not share a mutable simulation budget', () => {
  assert.ok(Object.isFrozen(EXPANSION2_FLEET));
  const budgets = [];
  for (const entry of EXPANSION2_FLEET) {
    for (const value of [entry, entry.notes, entry.limitations]) assert.ok(Object.isFrozen(value));
    assert.throws(() => entry.notes.push('Invented source assertion'), TypeError);
    assert.throws(() => { entry.blockedReason = null; }, TypeError);
    if (entry.simulation) {
      assert.ok(Object.isFrozen(entry.simulation));
      assert.throws(() => { entry.simulation.attack = 100; }, TypeError);
      budgets.push(entry.simulation);
    }
  }
  assert.equal(new Set(budgets).size, 2);
  assert.throws(() => EXPANSION2_FLEET.pop(), TypeError);
});

test('only the liner and exact prologue ark occurrence receive the existing original logistics budget', () => {
  const runnable = EXPANSION2_FLEET.filter(entry => !entry.blockedReason);
  assert.deepEqual(runnable.map(entry => entry.recordId), ['GAL-LOC-JADE', 'MEA-MQ-HYPERION']);
  const reference = EXPANSION_FLEET.find(entry => entry.role === 'spacecraft' && !entry.blockedReason).simulation;
  for (const entry of runnable) {
    assert.equal(entry.role, 'spacecraft');
    assert.deepEqual(entry.simulation, reference);
    assert.deepEqual(entry.simulation, { hp: 14, shield: 10, attack: 0, defense: 2, speed: 3 });
    assert.ok(entry.notes.some(text => text.includes('Budget original sans unité')));
    assert.ok(entry.notes.some(text => text.includes('Ces valeurs ne sont pas des statistiques de l’œuvre')));
  }
});

test('twenty-four inspections have no simulation object and cannot silently become numerical vehicles', () => {
  const inspections = EXPANSION2_FLEET.filter(entry => entry.blockedReason);
  assert.equal(inspections.length, 24);
  for (const entry of inspections) {
    assert.equal(entry.simulation, null, entry.recordId);
    assert.ok(entry.blockedReason.startsWith('Consultation uniquement :'), entry.recordId);
    assert.ok(entry.notes.some(text => text.includes('sans budget de simulation')));
  }
  assert.equal(EXPANSION2_FLEET.filter(entry => entry.role === 'station').length, 19);
  for (const entry of EXPANSION2_FLEET.filter(entry => entry.role === 'station')) assert.ok(entry.blockedReason);
});

test('original descriptions and source conditions survive without broadening rewards, acquisition or pilotage', () => {
  for (const entry of EXPANSION2_FLEET) {
    const record = getUniverseRecord(entry.recordId);
    assert.equal(entry.notes[0], record.description);
    if (record.conditions) assert.ok(entry.limitations.includes(`Conditions documentaires conservées : ${record.conditions}`));
    assert.ok(entry.limitations.some(text => text.includes('aucune physique, géométrie, cabine, équipage')));
    assert.ok(entry.limitations.some(text => text.includes('Aucun carburant, bouclier, armement, vitesse canonique')));
  }
});

test('Hyperion prologue uses the existing canonical ID and does not leak into the later ark context', () => {
  const entry = byId('MEA-MQ-HYPERION');
  assert.deepEqual(contextsFor(entry.recordId), [{ mediaId: 'MEA', periodId: 'mea-prologue' }]);
  assert.equal(canAccessContent(entry.recordId, { mediaId: 'MEA', periodId: 'mea-prologue' }).ok, true);
  for (const wrong of [
    { mediaId: 'MEA', periodId: 'mea' },
    { mediaId: 'INI', periodId: 'ini' },
    { mediaId: 'ME1', periodId: 'me1' },
  ]) assert.equal(canAccessContent(entry.recordId, wrong).ok, false);
  assert.ok(entry.notes.some(text => text.includes('pas une nouvelle arche')));
  assert.equal(byId('MEA-WRL-HYPERION'), undefined);
});

test('Arcturian Jade remains a Galaxy liner reference and never an Andromeda ship or combat unit', () => {
  const entry = byId('GAL-LOC-JADE');
  assert.equal(getUniverseRecord(entry.recordId).name, 'Arcturian Jade');
  assert.deepEqual(contextsFor(entry.recordId), [{ mediaId: 'GAL', periodId: 'gal' }]);
  assert.equal(canAccessContent(entry.recordId, { mediaId: 'GAL', periodId: 'gal' }).ok, true);
  assert.equal(canAccessContent(entry.recordId, { mediaId: 'MEA', periodId: 'mea' }).ok, false);
  assert.equal(entry.simulation.attack, 0);
});

test('Normandy systems stay inspection-only, preserve the Tali and unverified consequences conditions and grant no equipment', () => {
  for (const suffix of ['ARMOR', 'SHIELD', 'GUN']) {
    const entry = byId(`ME2-EQP-NORMANDY-${suffix}`);
    assert.equal(entry.role, 'ship-system');
    assert.equal(entry.simulation, null);
    assert.ok(entry.blockedReason);
    assert.equal(canAccessContent(entry.recordId, { mediaId: 'ME3', periodId: 'me3' }).ok, false);
  }
  assert.ok(byId('ME2-EQP-NORMANDY-SHIELD').limitations.includes('Conditions documentaires conservées : Tali requise pour l’accès approprié.'));
  assert.ok(byId('ME2-EQP-NORMANDY-ARMOR').limitations.some(text => text.includes('Vérifier table exacte des pertes')));
  assert.ok(byId('ME2-EQP-NORMANDY-GUN').limitations.some(text => text.includes('Table de conséquences à revérifier')));
});

test('Nomad appearance and abandoned Reaper are not additional operable hulls or statistical upgrades', () => {
  const appearance = byId('MEA-EQP-NOMAD-SKINS'), derelict = byId('ME2-ZON-DERELICT');
  assert.equal(appearance.role, 'vehicle-appearance');
  assert.equal(appearance.simulation, null);
  assert.ok(appearance.limitations.includes('Conditions documentaires conservées : Selon édition et contenu.'));
  assert.ok(appearance.limitations.some(text => text.includes('Aucun skin')));
  assert.equal(derelict.role, 'derelict');
  assert.equal(derelict.simulation, null);
  assert.ok(derelict.limitations.some(text => text.includes('Aucune remise en service')));
});

test('station names shared across works retain exact work scopes instead of merging chronology or canon outcomes', () => {
  for (const id of ['ASC-REF-OMEGA', 'RET-REF-OMEGA', 'RED-WRL-OMEGA', 'INV-WRL-OMEGA', 'INC-WRL-OMEGA']) {
    const entry = byId(id), record = getUniverseRecord(id);
    assert.equal(entry.role, 'station');
    for (const mediaId of ['ME2', 'ME3']) assert.equal(canAccessContent(id, { mediaId, periodId: mediaId.toLowerCase() }).ok, false);
    assert.ok(contextsFor(id).every(context => context.mediaId === record.mediaId));
  }
  assert.ok(byId('INV-WRL-OMEGA').limitations.some(text => text.includes('départ d’Aria restent fixes')));
  assert.ok(byId('INQ-WRL-CITADEL').limitations.some(text => text.includes('aucun verdict omniscient')));
});

test('rooms, duplicate mission anchors, unavailable periods and extrapolated models never fill the shortfall to forty', () => {
  for (const id of [
    'ME2-ZON-NORMANDY-CABIN', 'ME2-ZON-NORMANDY-LAB', 'ME2-ZON-NORMANDY-ENGINE',
    'ME2-ZON-RAYYA', 'ME3-ZON-NORM-HANGAR', 'MEA-ZON-TEMPEST-POD', 'MEA-ZON-TEMPEST-ENGINE',
    'ME2-MQ-COLLECTOR-SHIP', 'ME3-MQ-DREADNOUGHT', 'MEA-SQ-CORA-ARK',
    'ME2-WRL-AEIA', 'ME2-ZON-AEIA-CAMP', 'PL-REF-MAKO', 'HWB-REF-SR1',
    'SPR-VEH-sovereign', 'ME2-SYS-HAMMERHEAD', 'MEA-SYS-NOMAD',
  ]) assert.equal(byId(id), undefined, id);
  assert.equal(canAccessContent('PL-REF-MAKO', { mediaId: 'PL', periodId: 'pl-2183' }).ok, false);
  assert.ok(EXPANSION2_FLEET.length < 40);
});
