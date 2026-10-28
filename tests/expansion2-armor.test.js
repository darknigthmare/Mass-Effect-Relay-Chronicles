import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EXPANSION2_ARMOR, getExpansion2Armor } from '../src/expansion2-armor.js';
import { EXPANSION_ENTRIES } from '../src/expansion.js';
import { UNIVERSE_RECORDS, getUniverseRecord, getUniverseWork } from '../src/universe-data.js';
import { canAccessContent } from '../src/continuity.js';
import { getUniverseEquipment } from '../src/universe-equipment.js';
import { getUniversePowerMapping } from '../src/universe-powers.js';
import { getTool } from '../src/tool-data.js';
import { ACTIONS } from '../src/combat.js';

const reserved = ['ME2-EQP-NORMANDY-ARMOR', 'ME2-EQP-NORMANDY-SHIELD', 'ME2-EQP-NORMANDY-GUN', 'MEA-EQP-NOMAD-SKINS'];
const benchIds = ['EQP-omni-outil', 'EQP-amplificateur-biotique', 'ME2-EQP-THERMAL',
  'ME3-EQP-BARREL', 'ME3-EQP-MAGAZINE', 'ME3-EQP-ULTRALIGHT', 'ME3-EQP-GRENADE-STOCK', 'ME3-EQP-THERMAL', 'MEA-EQP-POWER-CELLS'];
const sameMembers = (actual, expected) => assert.deepEqual([...actual].sort(), [...expected].sort());

test('real remaining stock gives thirty new contextual equipment references, not forty invented armours', () => {
  const previous = new Set(EXPANSION_ENTRIES.map(entry => entry.recordId));
  const remaining = UNIVERSE_RECORDS.filter(record => record.fact && record.category === 'equipment' && !previous.has(record.id));
  assert.equal(remaining.length, 35);
  assert.equal(remaining.filter(record => record.availability.length).length, 34);
  assert.equal(EXPANSION2_ARMOR.length, 30);
  assert.equal(new Set(EXPANSION2_ARMOR.map(entry => entry.recordId)).size, 30);
  sameMembers(EXPANSION2_ARMOR.map(entry => entry.recordId), remaining
    .filter(record => record.availability.length && !reserved.includes(record.id)).map(record => record.id));
  for (const entry of EXPANSION2_ARMOR) assert.equal(previous.has(entry.recordId), false, entry.recordId);
  for (const id of [...reserved, 'PL-REF-MAKO']) assert.equal(getExpansion2Armor(id), null, id);
});

test('facts, conditions, scopes and provenance come exactly from existing contextual records', () => {
  for (const entry of EXPANSION2_ARMOR) {
    const record = getUniverseRecord(entry.recordId), work = getUniverseWork(record.catalogWorkId);
    assert.equal(record.fact, true, entry.recordId);
    assert.equal(record.category, 'equipment', entry.recordId);
    assert.equal(entry.identityFact, record.description);
    assert.equal(entry.conditions, record.conditions);
    assert.deepEqual(entry.contextScopes, record.availability);
    assert.deepEqual(entry.sourceIds, record.sourceIds);
    assert.deepEqual(entry.provenance, record.provenance);
    assert.ok(entry.sourceIds.length);
    for (const id of entry.sourceIds) assert.ok(work.sources.some(source => source.id === id));
    for (const scope of entry.contextScopes) for (const periodId of scope.periodIds) {
      assert.equal(canAccessContent(entry.recordId, { mediaId: scope.mediaId, periodId }).ok, true);
      if (entry.bench) assert.equal(canAccessContent(entry.bench.parentRecordId, { mediaId: scope.mediaId, periodId }).ok, true);
    }
    assert.equal(entry.constraints.editionProfile, null);
    assert.equal(Object.hasOwn(entry, 'status'), false);
    assert.equal(Object.hasOwn(entry, 'fact'), false);
    assert.equal(Object.hasOwn(entry, 'playable'), false);
    assert.equal(Object.hasOwn(entry, 'bonuses'), false);
    assert.equal(entry.notes[0], record.description);
    if (record.conditions) assert.ok(entry.notes.includes(record.conditions));
  }
  assert.equal(canAccessContent('ME3-EQP-MAGAZINE', { mediaId: 'ME2', periodId: 'me2' }).ok, false);
  assert.equal(canAccessContent('MEA-EQP-POWER-CELLS', { mediaId: 'MEA', periodId: 'mea-prologue' }).ok, false);
  assert.equal(canAccessContent('EQP-omni-outil', { mediaId: 'ME3', periodId: 'me3' }).ok, false);
});

test('exactly nine native bench contracts; closed mechanisms have neither dormant stats nor a bench', () => {
  const runnable = EXPANSION2_ARMOR.filter(entry => !entry.blockedReason);
  sameMembers(runnable.map(entry => entry.recordId), benchIds);
  assert.equal(EXPANSION2_ARMOR.filter(entry => entry.blockedReason).length, 21);
  for (const entry of EXPANSION2_ARMOR) {
    assert.equal(entry.mode, 'armor');
    assert.equal(entry.blockedReason, entry.constraints.blockedReason);
    assert.ok(entry.limitations.length >= 5);
    if (entry.blockedReason) {
      assert.equal(entry.simulation, null);
      assert.equal(entry.bench, null);
      assert.equal(entry.behaviorKind, 'inspection-only');
      assert.equal(entry.statsBasis, null);
    } else {
      assert.deepEqual(entry.simulation, { hp: 120, shield: 30, attack: 16, defense: 4, speed: 1 });
      assert.equal(entry.behaviorKind, 'equipment-bench');
      assert.equal(entry.statsBasis, 'ATB adaptation');
      assert.ok(['tool', 'weapon-mod', 'thermal-clips', 'grenade-stock', 'power-cells'].includes(entry.bench.kind));
      assert.ok(ACTIONS[entry.bench.actionId]);
      assert.ok(Object.keys(entry.bench).every(key => ['kind', 'parentRecordId', 'equipmentId', 'actionId'].includes(key)));
    }
  }
});

test('tools strengthen only a prelearned matching power and reuse existing generic definitions', () => {
  const tech = getExpansion2Armor('EQP-omni-outil').bench;
  const bio = getExpansion2Armor('EQP-amplificateur-biotique').bench;
  assert.deepEqual(tech, { kind: 'tool', parentRecordId: 'PWR-surcharge', equipmentId: 'omni-tool-upgraded', actionId: 'overload' });
  assert.deepEqual(bio, { kind: 'tool', parentRecordId: 'PWR-projection', equipmentId: 'biotic-amp-upgraded', actionId: 'throw' });
  assert.deepEqual(getTool(tech.equipmentId).bonuses, { techMultiplier: 1.15 });
  assert.deepEqual(getTool(bio.equipmentId).bonuses, { bioticMultiplier: 1.15 });
  assert.match(getExpansion2Armor('EQP-omni-outil').limitations.join(' '), /n’accorde aucune compétence/);
  assert.match(getExpansion2Armor('EQP-amplificateur-biotique').limitations.join(' '), /ne crée aucune aptitude biotique/);
});

test('three modification benches keep exact conventional parents and native effect families', () => {
  for (const id of ['ME3-EQP-BARREL', 'ME3-EQP-MAGAZINE', 'ME3-EQP-ULTRALIGHT']) {
    const bench = getExpansion2Armor(id).bench, mod = getUniverseEquipment(bench.equipmentId), parent = getUniverseEquipment(bench.parentRecordId);
    assert.equal(mod.runtimeSupported, true);
    assert.equal(parent.runtimeSupported, true);
    assert.equal(mod.kind, 'weaponMod');
    assert.equal(parent.weaponSystem, 'thermal-clip');
    assert.equal(parent.weaponProfileId, undefined);
    assert.ok(mod.weaponTypes.includes(parent.weaponType));
    assert.ok(mod.weaponSystems.includes(parent.weaponSystem));
    assert.equal(Object.hasOwn(mod.bonuses, 'defense'), false);
  }
  assert.deepEqual(getUniverseEquipment('ME3-EQP-BARREL').bonuses, { weaponDamageMultiplier: 1.12 });
  assert.deepEqual(getUniverseEquipment('ME3-EQP-MAGAZINE').bonuses, { magazineCapacityMultiplier: 1.25 });
  assert.deepEqual(getUniverseEquipment('ME3-EQP-ULTRALIGHT').bonuses, { powerCooldownMultiplier: .9 });
  assert.equal(getExpansion2Armor('ME3-EQP-ULTRALIGHT').bench.parentRecordId, 'ME3-WPN-SHURIKEN');
  assert.match(getExpansion2Armor('ME3-EQP-MAGAZINE').notes.join(' '), /90 unités totales sont conservées/);
});

test('clips and finite grenade/cell reserves stay distinct; primary cell evidence has narrow scope', () => {
  for (const id of ['ME2-EQP-THERMAL', 'ME3-EQP-THERMAL']) {
    const entry = getExpansion2Armor(id), parent = getUniverseEquipment(entry.bench.parentRecordId);
    assert.equal(entry.bench.kind, 'thermal-clips');
    assert.equal(parent.weaponSystem, 'thermal-clip');
    assert.equal(parent.weaponProfileId, undefined);
    assert.equal(entry.bench.actionId, 'reload');
  }
  for (const id of ['ME3-EQP-GRENADE-STOCK', 'MEA-EQP-POWER-CELLS']) {
    const entry = getExpansion2Armor(id);
    assert.equal(getUniversePowerMapping(entry.bench.parentRecordId).actionId, entry.bench.actionId);
    assert.equal(entry.bench.actionId, 'fragGrenade');
    assert.equal(ACTIONS[entry.bench.actionId].grenadeCost, 1);
    assert.equal(ACTIONS[entry.bench.actionId].cooldown, undefined);
  }
  const cells = getExpansion2Armor('MEA-EQP-POWER-CELLS');
  assert.match(cells.notes.join(' '), /ne certifie pas son attribution à un pouvoir nommé/);
  assert.match(cells.limitations.join(' '), /attendre ne rend aucune charge/);
  const proof = JSON.parse(fs.readFileSync(new URL('../docs/qa/chronicle-specialist-reference-report.json', import.meta.url)));
  const evidence = JSON.stringify(proof);
  assert.match(evidence, /Numbered powers use finite Power Cells/);
  assert.match(evidence, /no recharge time/);
  assert.match(evidence, /Which named powers use cells/);
});

test('medi-gel, generic umbrellas and narrative equipment cannot run surrogate combat', () => {
  for (const id of ['ME2-EQP-MEDIGEL', 'ME3-EQP-MEDIGEL', 'ME2-EQP-CELLS', 'ME3-EQP-WEAPON-MODS', 'ME3-EQP-SCOPE',
    'MEA-EQP-AUGMENT', 'MEA-EQP-FUSION', 'MEA-EQP-WEAPON-MODS', 'MEA-EQP-WEIGHT', 'MEA-EQP-AMMO-FIRE',
    'MEA-EQP-AMMO-CRYO', 'MEA-EQP-AMMO-DISRUPT', 'MEA-EQP-SHIELD-CAP', 'INF-EQ-INTEL', 'GAL-EQ-SHIELD', 'GAL-EQ-MED',
    'RET-REF-IMPLANTS', 'NEX-REF-CRYO', 'INI-REF-IMPLANT', 'ANN-REF-CRYO', 'ANN-REF-MICROSCOPE']) {
    const entry = getExpansion2Armor(id);
    assert.ok(entry.blockedReason, id);
    assert.equal(entry.simulation, null, id);
    assert.equal(entry.bench, null, id);
  }
  assert.match(getExpansion2Armor('ME2-EQP-MEDIGEL').blockedReason, /Unity ME1/);
  assert.match(getExpansion2Armor('ME3-EQP-SCOPE').blockedReason, /aucun bonus de dégâts ou de défense/);
});

test('all definitions, controls and metadata are immutable and lookup does not accept client definitions', () => {
  const checkFrozen = value => {
    if (value && typeof value === 'object') {
      assert.ok(Object.isFrozen(value));
      Object.values(value).forEach(checkFrozen);
    }
  };
  checkFrozen(EXPANSION2_ARMOR);
  const entry = getExpansion2Armor('ME3-EQP-BARREL');
  assert.throws(() => { entry.bench.parentRecordId = 'ME3-WPN-FALCON'; }, TypeError);
  assert.throws(() => { entry.simulation.defense = 99; }, TypeError);
  assert.throws(() => { entry.contextScopes[0].periodIds.push('me3-prologue'); }, TypeError);
  assert.throws(() => { entry.notes.push('invented fact'); }, TypeError);
  for (const invalid of [null, {}, [], 0, '__proto__', { recordId: entry.recordId }]) assert.equal(getExpansion2Armor(invalid), null);
});
