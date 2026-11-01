import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPANSION3_WEAPONS, getExpansion3Weapon } from '../src/expansion3-weapons.js';
import { EXPANSION_WEAPONS } from '../src/expansion-weapons.js';
import { EXPANSION2_WEAPONS } from '../src/expansion2-weapons.js';
import { getUniverseRecord, getUniverseWork, UNIVERSE_RECORDS } from '../src/universe-data.js';
import { getUniverseEquipment } from '../src/universe-equipment.js';
import { canAccessContent } from '../src/continuity.js';
import { createBattle, getActions, performAction, tickBattle } from '../src/combat.js';

const open = EXPANSION3_WEAPONS.filter(entry => entry.simulation);
const closed = EXPANSION3_WEAPONS.filter(entry => !entry.simulation);
const oldIds = new Set([...EXPANSION_WEAPONS, ...EXPANSION2_WEAPONS].map(entry => entry.recordId));
const actor = (battle, id = 'carrier') => battle.actors.find(unit => unit.id === id);
function fixture(entry, resources = {}) {
  return createBattle({ mode: 'active', seed: 17, rng: () => .5, medigel: 0,
    party: [{ ...entry.simulation, ...resources, id: 'carrier', name: 'Porteur abstrait', atb: 100 }],
    enemies: [{ id: 'target', name: 'Cible abstraite', hp: 5000, shield: 0, attack: 1, defense: 0, speed: .1, powers: [] }] });
}
function order(battle, actionId) {
  return performAction(battle, { actorId: 'carrier', actionId, targetId: actionId === 'reload' ? 'carrier' : 'target' });
}
function ready(battle) {
  for (let i = 0; i < 300 && actor(battle).atb < 100; i++) tickBattle(battle, .1);
  assert.equal(actor(battle).atb, 100);
}
function frozen(value) {
  if (value && typeof value === 'object') {
    assert.ok(Object.isFrozen(value)); Object.values(value).forEach(frozen);
  }
}

test('third weapon selection has forty disjoint immutable occurrences and honest eighteen/twenty-two execution scope', () => {
  assert.equal(EXPANSION3_WEAPONS.length, 40);
  assert.equal(new Set(EXPANSION3_WEAPONS.map(entry => entry.recordId)).size, 40);
  assert.equal(open.length, 18); assert.equal(closed.length, 22);
  frozen(EXPANSION3_WEAPONS);
  for (const entry of EXPANSION3_WEAPONS) {
    assert.equal(oldIds.has(entry.recordId), false, entry.recordId);
    assert.equal(entry.mode, 'weapon'); assert.equal(entry.primarySourceVerified, false);
    assert.match(entry.notes.join(' '), /Aucun objet.*campagne/);
    assert.match(entry.limitations.join(' '), /Aucun nouveau sprite/);
  }
  assert.throws(() => { open[0].simulation.reserveAmmo = 9000; }, TypeError);
  assert.throws(() => { closed[0].contextScopes[0].periodIds.push('me1'); }, TypeError);
});

test('forty identities, source references, original statuses and context scopes remain exact catalogue facts', () => {
  const works = {};
  for (const entry of EXPANSION3_WEAPONS) {
    const record = getUniverseRecord(entry.recordId), work = getUniverseWork(record.mediaId);
    assert.ok(record.fact); assert.equal(record.category, 'weapons'); assert.equal(work.locked, false);
    assert.equal(entry.name, record.name); assert.equal(entry.identityFact, record.description);
    assert.equal(entry.conditions, record.conditions); assert.deepEqual(entry.sourceIds, record.sourceIds);
    assert.deepEqual(entry.contextScopes, record.availability);
    assert.deepEqual(entry.sourceEntryIds, [record.id]);
    assert.deepEqual(entry.provenance.sources, record.sourceIds.map(id => work.sources.find(source => source.id === id)));
    assert.equal(entry.provenance.catalogPath, record.provenance.catalogPath);
    assert.equal(entry.provenance.reference, record.reference);
    assert.ok(entry.sourceIds.length); assert.ok(entry.provenance.sources.every(source => source?.url));
    works[record.mediaId] = (works[record.mediaId] || 0) + 1;
  }
  assert.deepEqual(works, { ME3: 10, MEA: 8, ME2: 11, INF: 4, GAL: 2, REV: 1, ASC: 1, RET: 1, INI: 1, ANN: 1 });
});

test('all eighteen remaining supported conventional profiles use their exact identity and unchanged finite family resources', () => {
  const remaining = UNIVERSE_RECORDS.filter(record => record.fact && record.category === 'weapons' && record.availability.length
    && !oldIds.has(record.id) && getUniverseEquipment(record.id)?.runtimeSupported);
  assert.deepEqual(open.map(entry => entry.recordId).sort(), remaining.map(record => record.id).sort());
  for (const entry of open) {
    const item = getUniverseEquipment(entry.recordId);
    assert.ok(item.runtimeSupported); assert.equal(item.kind, 'weapon'); assert.equal(item.requiresEdition, false);
    assert.equal(entry.simulation.equipmentProfileId, entry.recordId);
    assert.deepEqual(item.requiredCapabilities, ['thermal-clip']);
    for (const key of ['weaponType', 'weaponSystem', 'magazineCapacity', 'ammo', 'reserveAmmo']) {
      assert.equal(entry.simulation[key], item[key], `${entry.recordId}:${key}`);
    }
    assert.equal(Object.hasOwn(entry.simulation, 'weaponProfileId'), false);
    assert.deepEqual(entry.simulation.powers, []); assert.equal(entry.blockedReason, null);
    assert.deepEqual(entry.constraints, { editionProfile: null });
    assert.equal(entry.behaviorKind, 'existing-conventional-equipment');
  }
  assert.equal(getExpansion3Weapon('ME3-WPN-HORNET').simulation.weaponType, 'smg');
  assert.equal(getExpansion3Weapon('MEA-WPN-HORNET').simulation.weaponType, 'pistol');
});

test('all forty occurrences reject ME1 and foreign contexts, with Andromeda solo separate from APEX and prologue', () => {
  for (const entry of EXPANSION3_WEAPONS) {
    assert.equal(canAccessContent(entry.recordId, { mediaId: entry.mediaId, periodId: entry.periodId }).ok, true, entry.recordId);
    assert.equal(canAccessContent(entry.recordId, { mediaId: 'ME1', periodId: 'me1' }).ok, false, entry.recordId);
    const foreign = entry.mediaId === 'ME2' ? { mediaId: 'MEA', periodId: 'mea' } : { mediaId: 'ME2', periodId: 'me2' };
    assert.equal(canAccessContent(entry.recordId, foreign).ok, false, entry.recordId);
    if (entry.mediaId === 'MEA') {
      assert.equal(canAccessContent(entry.recordId, { mediaId: 'MEA', periodId: 'mea-apex' }).ok, false);
      assert.equal(canAccessContent(entry.recordId, { mediaId: 'MEA', periodId: 'mea-prologue' }).ok, false);
    }
  }
});

test('eighteen native shots consume one round and each native reload transfers exactly one finite reserve round', () => {
  for (const entry of open) {
    const before = JSON.stringify(entry), battle = fixture(entry), carrier = actor(battle);
    assert.equal(order(battle, 'shoot').ok, true, entry.recordId);
    assert.equal(carrier.ammo, entry.simulation.magazineCapacity - 1);
    assert.equal(carrier.reserveAmmo, entry.simulation.reserveAmmo); assert.equal(carrier.heat, 0);
    assert.ok(actor(battle, 'target').hp < 5000); assert.equal(battle.projectiles?.length || 0, 0);
    ready(battle);
    assert.equal(getActions(battle, 'carrier').some(action => action.id === 'reload' && action.available), true);
    assert.equal(order(battle, 'reload').ok, true);
    assert.equal(carrier.ammo, entry.simulation.magazineCapacity);
    assert.equal(carrier.reserveAmmo, entry.simulation.reserveAmmo - 1);
    assert.equal(carrier.channel, null); assert.deepEqual(carrier.powers, []);
    assert.equal(JSON.stringify(entry), before);
  }
});

test('depleted new profiles refuse shoot atomically and incomplete reserves never manufacture ammunition', () => {
  for (const entry of open) {
    const battle = fixture(entry, { ammo: 0, reserveAmmo: 2 }), before = JSON.stringify(battle);
    assert.equal(order(battle, 'shoot').ok, false, entry.recordId);
    assert.equal(JSON.stringify(battle), before);
    assert.equal(order(battle, 'reload').ok, true);
    assert.equal(actor(battle).ammo, 2); assert.equal(actor(battle).reserveAmmo, 0);
    assert.equal(actor(battle).magazineCapacity, entry.simulation.magazineCapacity);
    ready(battle);
    assert.equal(order(battle, 'shoot').ok, true); ready(battle);
    assert.equal(order(battle, 'shoot').ok, true); ready(battle);
    const empty = JSON.stringify(battle);
    assert.equal(order(battle, 'reload').ok, false); assert.equal(JSON.stringify(battle), empty);
    assert.equal(order(battle, 'shoot').ok, false); assert.equal(JSON.stringify(battle), empty);
  }
});

test('twenty-two consultations retain exact unsupported reasons and contain no alternate combat statistics or resource fallback', () => {
  for (const entry of closed) {
    const item = getUniverseEquipment(entry.recordId);
    assert.equal(item.runtimeSupported, false, entry.recordId);
    assert.equal(entry.behaviorKind, 'inspection-only'); assert.equal(entry.simulation, null); assert.equal(entry.statsBasis, null);
    assert.ok(entry.blockedReason.startsWith(item.lockReason));
    for (const key of ['hp', 'attack', 'defense', 'speed', 'weaponSystem', 'ammo', 'reserveAmmo']) assert.equal(Object.hasOwn(entry, key), false);
    assert.match(entry.limitations.join(' '), /gardent l’exercice fermé/);
  }
  assert.match(getExpansion3Weapon('ME2-WPN-BLACKSTORM').blockedReason, /cellules.*aucun chargeur conventionnel/i);
  assert.match(getExpansion3Weapon('ME2-WPN-CLAYMORE').blockedReason, /classe et de recherche/);
  assert.match(getExpansion3Weapon('GAL-WPN-GRENADE').blockedReason, /système de pouvoirs/);
  assert.match(getExpansion3Weapon('RET-REF-SHOTGUN').blockedReason, /aucun Katana/);
});

test('identity lookup rejects values and forged getters without coercion or property access', () => {
  let called = false;
  const forged = { get id() { called = true; throw Error('getter'); }, toString() { called = true; throw Error('coercion'); } };
  for (const value of [null, undefined, 0, [], {}, forged, '__proto__', 'constructor', 'Hornet', 'mea-wpn-hornet']) {
    assert.equal(getExpansion3Weapon(value), null);
  }
  assert.equal(called, false); assert.equal(getExpansion3Weapon('MEA-WPN-HORNET'), open.find(entry => entry.recordId === 'MEA-WPN-HORNET'));
});
