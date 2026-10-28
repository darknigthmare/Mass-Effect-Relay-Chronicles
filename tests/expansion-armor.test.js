import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPANSION_ARMOR, EXPANSION_ARMOR_REFERENCE, getExpansionArmor } from '../src/expansion-armor.js';
import { getUniverseRecord, getUniverseWork } from '../src/universe-data.js';
import { canAccessContent } from '../src/continuity.js';
import { getUniverseEquipment } from '../src/universe-equipment.js';

const sets = [
  ...['N7', 'KESTREL', 'CERBERUS', 'COLLECTOR', 'TERMINUS', 'BLOOD-DRAGON', 'INFERNO'].map(id => `ME2-EQP-${id}`),
  ...['N7', 'AJAX', 'INFERNO', 'BLOOD-DRAGON', 'COLLECTOR', 'TERMINUS', 'CERBERUS'].map(id => `ME3-EQP-${id}`),
  ...['INITIATIVE', 'PATHFINDER', 'N7', 'HYPERGUARDIAN', 'MAVERICK', 'ANGARAN', 'KETT', 'REMNANT', 'HELEUS', 'SCAVENGER', 'DEEP-SPACE'].map(id => `MEA-EQP-${id}`),
];
const components = [
  ...['RECON', 'SENTRY', 'ARCHON', 'CAPACITOR', 'LIFE-SUPPORT', 'ORDNANCE'].map(id => `ME2-EQP-${id}`),
  ...['ROSENKOV', 'SERRICE', 'HANNES', 'KASSA', 'ARIAKE', 'SENTRY', 'DEATH-MASK'].map(id => `ME3-EQP-${id}`),
  'INF-EQ-BODY', 'ASC-REF-SUIT',
];
const blockedIds = ['SENTRY', 'ARCHON', 'CAPACITOR', 'LIFE-SUPPORT', 'ORDNANCE'].map(id => `ME2-EQP-${id}`);
const sameMembers = (actual, expected) => assert.deepEqual([...actual].sort(), [...expected].sort());

test('forty documentary identities, including 25 existing sets and 15 previously closed references', () => {
  assert.equal(EXPANSION_ARMOR.length, 40);
  assert.equal(new Set(EXPANSION_ARMOR.map(item => item.recordId)).size, 40);
  sameMembers(EXPANSION_ARMOR.map(item => item.recordId), [...sets, ...components]);
  for (const id of sets) {
    const existing = getUniverseEquipment(id);
    assert.equal(existing.runtimeSupported, true, id);
    assert.equal(existing.kind, 'armor', id);
  }
  for (const id of components) assert.notEqual(getUniverseEquipment(id)?.runtimeSupported, true, id);
});

test('each identity resolves to factual contextual equipment with existing declared sources', () => {
  for (const entry of EXPANSION_ARMOR) {
    const record = getUniverseRecord(entry.recordId);
    assert.ok(record, entry.recordId);
    assert.equal(record.fact, true, entry.recordId);
    assert.equal(record.nature, 'Établi', entry.recordId);
    assert.equal(record.category, 'equipment', entry.recordId);
    assert.ok(record.availability.length, entry.recordId);
    assert.ok(record.sourceIds.length, entry.recordId);
    const sourceIds = new Set(getUniverseWork(record.catalogWorkId).sources.map(source => source.id));
    for (const id of record.sourceIds) assert.ok(sourceIds.has(id), `${entry.recordId}: ${id}`);
    for (const availability of record.availability) {
      for (const periodId of availability.periodIds) {
        assert.equal(canAccessContent(record.id, { mediaId: availability.mediaId, periodId }).ok, true);
      }
    }
    assert.equal(entry.mode, 'armor');
    // The overlay cannot overwrite documentary status, facts or provenance.
    for (const key of ['name', 'status', 'nature', 'fact', 'sources', 'sourceIds', 'sourceUrl', 'provenance', 'availability', 'playable']) {
      assert.equal(Object.hasOwn(entry, key), false, `${entry.recordId}: ${key}`);
    }
  }
});

test('canonical context remains mandatory; matching names do not cross works or prologues', () => {
  for (const entry of EXPANSION_ARMOR) {
    assert.equal(canAccessContent(entry.recordId, { mediaId: 'ME1', periodId: 'me1' }).ok, false);
  }
  assert.equal(canAccessContent('ME3-EQP-N7', { mediaId: 'ME2', periodId: 'me2' }).ok, false);
  assert.equal(canAccessContent('MEA-EQP-N7', { mediaId: 'ME3', periodId: 'me3' }).ok, false);
  assert.equal(canAccessContent('ME3-EQP-AJAX', { mediaId: 'ME3', periodId: 'me3-prologue' }).ok, false);
  assert.equal(canAccessContent('MEA-EQP-PATHFINDER', { mediaId: 'MEA', periodId: 'mea-prologue' }).ok, false);
  assert.equal(canAccessContent('ASC-REF-SUIT', { mediaId: 'MEA', periodId: 'mea' }).ok, false);
});

test('edition requirements survive independently of documentary membership', () => {
  const legendary = [
    ...['KESTREL', 'CERBERUS', 'COLLECTOR', 'TERMINUS', 'BLOOD-DRAGON', 'INFERNO', 'RECON'].map(id => `ME2-EQP-${id}`),
    ...['AJAX', 'INFERNO', 'BLOOD-DRAGON', 'COLLECTOR', 'TERMINUS', 'CERBERUS'].map(id => `ME3-EQP-${id}`),
  ];
  const deluxe = ['MEA-EQP-SCAVENGER', 'MEA-EQP-DEEP-SPACE'];
  sameMembers(EXPANSION_ARMOR.filter(entry => entry.constraints.editionProfile === 'legendary').map(entry => entry.recordId), legendary);
  sameMembers(EXPANSION_ARMOR.filter(entry => entry.constraints.editionProfile === 'deluxe').map(entry => entry.recordId), deluxe);
  for (const id of sets) {
    assert.equal(getExpansionArmor(id).constraints.editionProfile, getUniverseEquipment(id).requiredEditionProfile, id);
  }
  assert.match(getUniverseRecord('ME2-EQP-RECON').description, /Legendary/);
  for (const entry of EXPANSION_ARMOR) {
    assert.ok([null, 'legendary', 'deluxe'].includes(entry.constraints.editionProfile));
    assert.equal(entry.blockedReason, entry.constraints.blockedReason);
  }
  sameMembers(EXPANSION_ARMOR.filter(entry => entry.blockedReason !== null).map(entry => entry.recordId), blockedIds);
  for (const id of blockedIds) {
    const entry = getExpansionArmor(id);
    assert.equal(entry.constraints.editionProfile, null);
    assert.match(entry.blockedReason, /non établies/);
  }
});

test('simulation contains bounded absolute ATB values, without weapon or power bonuses', () => {
  assert.deepEqual(EXPANSION_ARMOR_REFERENCE, { hp: 120, shield: 30, attack: 16, defense: 4, speed: 1 });
  for (const entry of EXPANSION_ARMOR) {
    const stats = entry.simulation;
    sameMembers(Object.keys(stats), ['hp', 'shield', 'attack', 'defense', 'speed']);
    assert.ok(Object.values(stats).every(Number.isFinite), entry.recordId);
    assert.ok(stats.hp >= 100 && stats.hp <= 150, entry.recordId);
    assert.ok(stats.shield >= 20 && stats.shield <= 55, entry.recordId);
    assert.equal(stats.attack, 16, entry.recordId);
    assert.ok(stats.defense >= 4 && stats.defense <= 10, entry.recordId);
    assert.ok(stats.speed >= .8 && stats.speed <= 1.1, entry.recordId);
    assert.ok(entry.notes.length >= 3);
    assert.ok(entry.notes.every(note => typeof note === 'string' && note.trim().length > 0));
    assert.ok(entry.limitations.length >= 4);
    assert.match(entry.limitations.join(' '), /ATB/);
    assert.match(entry.limitations.join(' '), /aucun chiffre/i);
    assert.match(entry.limitations.join(' '), /anciens inventaires/);
    assert.equal(Object.hasOwn(entry, 'bonuses'), false);
    assert.equal(Object.hasOwn(entry, 'wearerIds'), false);
  }
});

test('sparse families and narrative suit remain neutral and do not imply original mechanics', () => {
  for (const suffix of ['ROSENKOV', 'SERRICE', 'HANNES', 'KASSA', 'ARIAKE']) {
    const entry = getExpansionArmor(`ME3-EQP-${suffix}`);
    assert.deepEqual(entry.simulation, EXPANSION_ARMOR_REFERENCE);
    assert.match(entry.limitations.join(' '), /aucune pièce précise/i);
  }
  const suit = getExpansionArmor('ASC-REF-SUIT');
  assert.deepEqual(suit.simulation, EXPANSION_ARMOR_REFERENCE);
  assert.match(suit.notes.join(' '), /masque de Hilo compromise/);
  assert.match(suit.limitations.join(' '), /Aucun kit jouable de Hilo/);
  assert.match(getExpansionArmor('ME2-EQP-ORDNANCE').limitations.join(' '), /Aucune cellule/);
  assert.deepEqual(getExpansionArmor('ME2-EQP-ORDNANCE').simulation, EXPANSION_ARMOR_REFERENCE);
  for (const id of components.filter(id => !['ASC-REF-SUIT', 'INF-EQ-BODY'].includes(id))) {
    assert.match(getExpansionArmor(id).limitations.join(' '), /aucun nouveau slot/i, id);
  }
});

test('registry and nested profiles are immutable; lookup accepts canonical ID strings only', () => {
  assert.ok(Object.isFrozen(EXPANSION_ARMOR));
  assert.ok(Object.isFrozen(EXPANSION_ARMOR_REFERENCE));
  for (const entry of EXPANSION_ARMOR) {
    assert.ok(Object.isFrozen(entry));
    for (const value of [entry.simulation, entry.notes, entry.limitations, entry.constraints]) assert.ok(Object.isFrozen(value));
    assert.strictEqual(getExpansionArmor(entry.recordId), entry);
  }
  const entry = EXPANSION_ARMOR[0];
  assert.throws(() => { entry.simulation.attack = 999; }, TypeError);
  assert.throws(() => { entry.constraints.editionProfile = 'deluxe'; }, TypeError);
  assert.throws(() => { entry.notes.push('forged'); }, TypeError);
  assert.throws(() => { EXPANSION_ARMOR.push(entry); }, TypeError);
  for (const invalid of [null, undefined, {}, [], 0, '__proto__', 'ME1-EQP-N7', 'ME3-EQP-WEAPON-MODS', { recordId: entry.recordId }]) {
    assert.equal(getExpansionArmor(invalid), null);
  }
});
