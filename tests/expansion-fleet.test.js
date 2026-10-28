import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPANSION_FLEET } from '../src/expansion-fleet.js';
import { canAccessContent } from '../src/continuity.js';
import { getUniverseRecord, getUniverseWork } from '../src/universe-data.js';

const byId = id => EXPANSION_FLEET.find(entry => entry.recordId === id);
const contextsFor = id => getUniverseRecord(id).availability.flatMap(scope =>
  scope.periodIds.map(periodId => ({ mediaId: scope.mediaId, periodId })));
const roles = new Set(['ground-vehicle', 'aircraft', 'spacecraft', 'station', 'fleet-group', 'unresolved-reference']);
const zeroBudget = { hp: 0, shield: 0, attack: 0, defense: 0, speed: 0 };

test('fleet expansion has exactly forty unique contextual references and only the declared data fields', () => {
  assert.equal(EXPANSION_FLEET.length, 40);
  assert.equal(new Set(EXPANSION_FLEET.map(entry => entry.recordId)).size, 40);
  for (const entry of EXPANSION_FLEET) {
    assert.equal(entry.mode, 'fleet');
    assert.ok(roles.has(entry.role));
    assert.deepEqual(Object.keys(entry).sort(), [
      'recordId', 'mode', 'role', 'simulation', 'notes', 'limitations', ...(entry.blockedReason ? ['blockedReason'] : []),
    ].sort());
    assert.deepEqual(Object.keys(entry.simulation).sort(), ['hp', 'shield', 'attack', 'defense', 'speed'].sort());
  }
});

test('every selected reference is factual, sourced, and accessible in at least one exact published context', () => {
  const works = new Set();
  for (const entry of EXPANSION_FLEET) {
    const record = getUniverseRecord(entry.recordId), work = getUniverseWork(record.mediaId);
    assert.equal(record.fact, true, entry.recordId);
    assert.ok(record.availability.length, entry.recordId);
    assert.ok(contextsFor(entry.recordId).some(context => canAccessContent(entry.recordId, context).ok), entry.recordId);
    assert.ok(record.sourceIds.length, entry.recordId);
    for (const id of record.sourceIds) assert.ok(work.sources.some(source => source.id === id), `${entry.recordId}: ${id}`);
    works.add(record.mediaId);
  }
  assert.ok(works.size >= 9);
});

test('export and all nested data are immutable without sharing a mutable simulation budget', () => {
  assert.ok(Object.isFrozen(EXPANSION_FLEET));
  for (const entry of EXPANSION_FLEET) {
    assert.ok(Object.isFrozen(entry));
    assert.ok(Object.isFrozen(entry.simulation));
    assert.ok(Object.isFrozen(entry.notes));
    assert.ok(Object.isFrozen(entry.limitations));
    assert.throws(() => { entry.simulation.attack = 9000; }, TypeError);
    assert.throws(() => entry.notes.push('Invented canon'), TypeError);
  }
  assert.equal(new Set(EXPANSION_FLEET.map(entry => entry.simulation)).size, 40);
  assert.throws(() => EXPANSION_FLEET.pop(), TypeError);
});

test('original descriptions and documentary conditions are kept instead of replaced by simulation claims', () => {
  for (const entry of EXPANSION_FLEET) {
    const record = getUniverseRecord(entry.recordId);
    assert.equal(entry.notes[0], record.description, entry.recordId);
    assert.ok(entry.notes.slice(1).some(text => text.includes('Budget original sans unité')));
    if (record.conditions) assert.ok(entry.limitations.includes(`Conditions documentaires conservées : ${record.conditions}`));
    assert.ok(entry.limitations.some(text => text.includes('Aucun carburant, bouclier, armement, vitesse canonique')));
    assert.ok(entry.limitations.some(text => text.includes('aucune physique, géométrie, cabine, équipage')));
  }
});

test('logistics budgets are finite original role budgets with no weapon damage, fuel, or source-model performance', () => {
  const prototypes = new Map();
  for (const entry of EXPANSION_FLEET) {
    assert.equal(entry.simulation.attack, 0);
    for (const value of Object.values(entry.simulation)) assert.ok(Number.isFinite(value) && Number.isInteger(value) && value >= 0 && value <= 20);
    if (entry.blockedReason) {
      assert.deepEqual(entry.simulation, zeroBudget);
    } else {
      assert.ok(['ground-vehicle', 'spacecraft'].includes(entry.role));
      assert.ok(entry.simulation.hp > 0 && entry.simulation.shield > 0 && entry.simulation.speed > 0);
      if (prototypes.has(entry.role)) assert.deepEqual(entry.simulation, prototypes.get(entry.role));
      else prototypes.set(entry.role, entry.simulation);
    }
  }
  assert.equal(prototypes.size, 2);
});

test('ground vehicles stay distinct from spacecraft and the nonidentified combat-aircraft reference', () => {
  for (const id of ['REF-VEH-M35-MAKO-ME1', 'ME2-EQP-HAMMERHEAD', 'MEA-EQP-NOMAD-UPGRADES']) {
    assert.equal(byId(id).role, 'ground-vehicle');
    assert.equal(byId(id).blockedReason, undefined);
  }
  assert.equal(byId('REF-SHP-NORMANDY-SR1-ME1').role, 'spacecraft');
  assert.equal(byId('ME2-ENM-GUNSHIP').role, 'aircraft');
  assert.ok(byId('ME2-ENM-GUNSHIP').blockedReason.includes('sans modèle individuel'));
});

test('stations and collective fleets are inspection-only and cannot receive an individual vehicle budget', () => {
  const blocked = ['ME2-WRL-OMEGA', 'MEA-WRL-NEXUS', 'NEX-REF-NEXUS', 'INI-REF-THEIA', 'INI-REF-HOMEAWAY',
    'ME2-LOR-FLOTILLA', 'ASC-REF-FLEET', 'MEA-LOR-ARKS'];
  for (const id of blocked) {
    const entry = byId(id);
    assert.ok(['station', 'fleet-group'].includes(entry.role), id);
    assert.ok(entry.blockedReason, id);
    assert.deepEqual(entry.simulation, zeroBudget, id);
  }
});

test('unresolved transports, an exterior location and a signal do not fabricate a controllable hull', () => {
  for (const id of ['ME2-ZON-HAGALAZ-HULL', 'MEA-LOR-QUARIAN', 'MEA-WRL-MOONYARD', 'ME2-SQ-N7-CRASH']) {
    const entry = byId(id);
    assert.equal(entry.role, 'unresolved-reference');
    assert.ok(entry.blockedReason.length > 30);
    assert.deepEqual(entry.simulation, zeroBudget);
  }
  assert.ok(byId('MEA-LOR-QUARIAN').blockedReason.includes('signal documentaire'));
  assert.ok(byId('MEA-WRL-MOONYARD').blockedReason.includes('transport non identifié'));
});

test('Normandy opening, ME1, and later ME2 contexts remain exact instead of resolving by a shared name', () => {
  assert.equal(canAccessContent('REF-SHP-NORMANDY-SR1-ME1', { mediaId: 'ME1', periodId: 'me1' }).ok, true);
  assert.equal(canAccessContent('REF-SHP-NORMANDY-SR1-ME1', { mediaId: 'ME2', periodId: 'me2' }).ok, false);
  assert.equal(canAccessContent('ME2-MQ-SAVE-JOKER', { mediaId: 'ME2', periodId: 'me2-opening' }).ok, true);
  assert.equal(canAccessContent('ME2-MQ-SAVE-JOKER', { mediaId: 'ME2', periodId: 'me2' }).ok, false);
  assert.equal(canAccessContent('ME2-ZON-NORMANDY-CIC', { mediaId: 'ME3', periodId: 'me3' }).ok, false);
});

test('the same ark or station in separate works never bridges Milky Way prequel, transit, and Heleus contexts', () => {
  const cases = [
    ['INI-REF-HYPERION', { mediaId: 'MEA', periodId: 'mea' }],
    ['MEA-WRL-HYPERION', { mediaId: 'INI', periodId: 'ini' }],
    ['ANN-REF-ARK', { mediaId: 'MEA', periodId: 'mea' }],
    ['NEX-REF-NEXUS', { mediaId: 'MEA', periodId: 'mea' }],
    ['PL-REF-BROODSHIP', { mediaId: 'PL', periodId: 'pl-2183' }],
  ];
  for (const [id, wrong] of cases) {
    assert.ok(byId(id));
    assert.equal(canAccessContent(id, wrong).ok, false, id);
    assert.ok(contextsFor(id).some(context => canAccessContent(id, context).ok));
  }
});

test('one contextual hull anchor is used per Normandy and Tempest instead of counting cabins, labs, or skins', () => {
  assert.deepEqual(EXPANSION_FLEET.filter(entry => entry.recordId.startsWith('ME2-ZON-NORMANDY')).map(entry => entry.recordId), ['ME2-ZON-NORMANDY-CIC']);
  assert.deepEqual(EXPANSION_FLEET.filter(entry => entry.recordId.startsWith('ME3-ZON-NORM')).map(entry => entry.recordId), ['ME3-ZON-NORM-CIC']);
  assert.deepEqual(EXPANSION_FLEET.filter(entry => entry.recordId.startsWith('MEA-ZON-TEMPEST')).map(entry => entry.recordId), ['MEA-ZON-TEMPEST-BRIDGE']);
  assert.equal(byId('MEA-EQP-NOMAD-SKINS'), undefined);
  assert.equal(byId('ME2-EQP-NORMANDY-GUN'), undefined);
  assert.equal(byId('ME2-EQP-NORMANDY-SHIELD'), undefined);
});

test('closed adaptations, unsupported segments, unpublished works and fictional archive entries never fill the forty-reference quota', () => {
  for (const id of ['SPR-VEH-mako', 'SPR-VEH-normandy-sr-1', 'PL-REF-MAKO', 'PL-REF-ARCHIVE', 'CUT-CASE-ARK', 'HWB-REF-SR1']) assert.equal(byId(id), undefined);
  for (const entry of EXPANSION_FLEET) assert.ok(!['ME4', 'CUT', 'LIB', 'BLA'].includes(getUniverseRecord(entry.recordId).mediaId));
});
