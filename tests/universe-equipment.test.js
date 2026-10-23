import test from 'node:test';
import assert from 'node:assert/strict';
import {
  UNIVERSE_EQUIPMENT, getUniverseEquipment, listUniverseEquipment, canEquipUniverseItem,
  normalizeChronicleLoadouts, equipChronicleItem, getChronicleEquipmentEffects,
} from '../src/universe-equipment.js';
import { getUniverseRecord } from '../src/universe-data.js';
import { SCENARIOS, universeActorFor } from '../src/universe-actors.js';
import { canAccessContent } from '../src/continuity.js';
import { createBattle, performAction } from '../src/combat.js';

const clone = value => JSON.parse(JSON.stringify(value));
const workshop = mediaId => SCENARIOS.find(scene => scene.kind === 'equipment-workshop' && scene.context.mediaId === mediaId);
const protagonist = { ME2: 'ME2-CHR-SHEPARD', ME3: 'ME3-CHR-SHEPARD', MEA: 'MEA-CHR-RYDER' };
const sessionFor = mediaId => {
  const scene = workshop(mediaId);
  return { context: { ...scene.context }, scenarioId: scene.id, party: [protagonist[mediaId]], loadouts: {} };
};
const prepare = (session, actorId, itemId, slot) => {
  const result = equipChronicleItem(session, actorId, itemId, slot);
  assert.equal(result.ok, true, result.reason);
  return { ...session, loadouts: result.loadouts };
};
const neutral = { hp: 0, shield: 0, attack: 0, defense: 0, weaponHeatMultiplier: 1,
  weaponCoolingBonus: 0, controlResistance: 0, bioticMultiplier: 1, techMultiplier: 1 };

test('equipment profiles preserve catalogue provenance without inventing manufacturers, ranks or comic models', () => {
  assert.equal(new Set(UNIVERSE_EQUIPMENT.map(item => item.id)).size, UNIVERSE_EQUIPMENT.length);
  assert.ok(UNIVERSE_EQUIPMENT.length > 200);
  assert.ok(Object.isFrozen(UNIVERSE_EQUIPMENT));
  for (const item of UNIVERSE_EQUIPMENT) {
    const source = getUniverseRecord(item.id);
    assert.ok(source);
    assert.equal(item.name, source.name);
    assert.equal(item.sourceUrl, source.sourceUrl);
    assert.deepEqual(item.sourceIds, source.sourceIds);
    assert.deepEqual(item.availability, source.availability);
    assert.equal(Object.hasOwn(item, 'manufacturer'), false);
    assert.equal(Object.hasOwn(item, 'rank'), false);
    assert.equal(item.statsBasis, 'ATB adaptation');
    assert.match(item.tuningNote, /aucune fidélité numérique ou visuelle 1:1 certifiée/);
    assert.ok(Object.isFrozen(item)); assert.ok(Object.isFrozen(item.bonuses));
  }
  assert.equal(getUniverseEquipment('HOM-KIT-SNIPER'), null);
  assert.equal(getUniverseEquipment('RED-KIT-SIDEARM'), null);
  const cannon = getUniverseEquipment('REV-REF-CANNON');
  assert.equal(cannon.kind, 'reference'); assert.equal(cannon.runtimeSupported, false);
  assert.equal(cannon.name, 'Canon accélérateur portatif');
  assert.equal(Object.hasOwn(cannon, 'weaponType'), false);
});

test('exact work and segment gates prevent future equipment and Andromeda technology leaking into ME1', () => {
  for (const mediaId of ['ME2', 'ME3', 'MEA', 'INF', 'GAL']) {
    const context = workshop(mediaId)?.context || { mediaId, periodId: mediaId.toLowerCase() };
    for (const item of listUniverseEquipment(context)) {
      assert.equal(item.mediaId, mediaId);
      assert.equal(canAccessContent(item.id, context).ok, true);
    }
  }
  assert.deepEqual(listUniverseEquipment({ mediaId: 'ME1', periodId: 'me1' }), []);
  assert.deepEqual(listUniverseEquipment({ mediaId: 'ME3', periodId: 'me3', year: 2183 }), []);
  assert.deepEqual(listUniverseEquipment({ mediaId: 'MEA', periodId: 'mea', galaxy: 'milky-way' }), []);
  assert.equal(canEquipUniverseItem({ mediaId: 'GAL', periodId: 'gal' }, 'GAL-CHR-JACOB', 'ME3-WPN-GRAAL').ok, false);
  assert.equal(canEquipUniverseItem(workshop('ME2').context, protagonist.ME2, 'MEA-WPN-AVENGER', 'weapon', workshop('ME2').id).ok, false);
});

test('thermal-clip budgets are bounded ATB data and unsupported technologies remain documentary', () => {
  const clipItems = UNIVERSE_EQUIPMENT.filter(item => item.runtimeSupported && item.kind === 'weapon');
  assert.ok(clipItems.length > 50);
  for (const item of clipItems) {
    assert.equal(item.weaponSystem, 'thermal-clip');
    assert.ok(['pistol', 'smg', 'assault', 'shotgun', 'sniper'].includes(item.weaponType));
    assert.ok(Number.isInteger(item.magazineCapacity) && item.magazineCapacity > 0 && item.magazineCapacity <= 24);
    assert.equal(item.ammo, item.magazineCapacity);
    assert.equal(item.reserveAmmo, item.magazineCapacity * 4);
    assert.match(item.firingModelNote, /variantes de tir d’origine non reproduits/);
  }
  for (const id of ['ME3-WPN-LANCER', 'ME3-WPN-PARTICLE', 'MEA-WPN-EQUALIZER', 'MEA-WPN-SWEEPER',
    'MEA-WPN-ASARI-SWORD', 'MEA-EQP-REMNANT', 'INF-WPN-MATTOCK', 'GAL-WPN-AVENGER']) {
    const item = getUniverseEquipment(id);
    assert.equal(item.runtimeSupported, false, id);
    assert.equal(item.playable, false);
    assert.ok(item.lockReason.length > 20);
    assert.ok(item.requiredCapabilities.length);
  }
  assert.equal(getUniverseEquipment('MEA-WPN-EQUALIZER').weaponSystem, undefined);
  assert.equal(getUniverseEquipment('ME3-WPN-LANCER').weaponSystem, undefined);
});

test('edition-dependent equipment is not unlocked by selecting its work or workshop', () => {
  for (const [mediaId, itemId] of [['ME2', 'ME2-WPN-MATTOCK'], ['ME2', 'ME2-EQP-KESTREL'],
    ['ME3', 'ME3-WPN-SUPPRESSOR'], ['MEA', 'MEA-EQP-SCAVENGER']]) {
    const item = getUniverseEquipment(itemId), scene = workshop(mediaId);
    assert.equal(item.requiresEdition, true);
    assert.equal(item.runtimeSupported, false);
    const result = canEquipUniverseItem(scene.context, protagonist[mediaId], itemId, item.slot, scene.id);
    assert.equal(result.ok, false);
    assert.match(result.reason, /Édition|édition|contenu additionnel/);
  }
});

test('the 68 workshop selections have explicit permissions and never become prologue mission equipment', () => {
  const expected = { ME2: 11, ME3: 27, MEA: 30 };
  for (const [mediaId, count] of Object.entries(expected)) {
    const scene = workshop(mediaId), actorId = protagonist[mediaId];
    assert.equal(scene.allowedEquipmentIds.length, count);
    const listed = listUniverseEquipment(scene.context, { actorId, scenarioId: scene.id });
    assert.equal(listed.filter(item => item.compatible).length, count);
    for (const id of scene.allowedEquipmentIds) {
      const item = getUniverseEquipment(id);
      assert.equal(item.mediaId, mediaId);
      assert.equal(item.runtimeSupported, true);
      assert.equal(canEquipUniverseItem(scene.context, actorId, id, item.slot, scene.id).ok, true);
    }
    assert.equal(listUniverseEquipment(scene.context).some(item => item.playable), false);
  }
  for (const scene of SCENARIOS.filter(item => item.kind !== 'equipment-workshop')) {
    assert.deepEqual(scene.allowedEquipmentIds, []);
    for (const actorId of scene.actorIds) {
      for (const item of UNIVERSE_EQUIPMENT.filter(item => item.runtimeSupported)) {
        assert.equal(canEquipUniverseItem(scene.context, actorId, item.id, item.slot, scene.id).ok, false);
      }
    }
  }
});

test('wearer, weapon family, exact scenario and slot remain independent restrictions', () => {
  const me2 = workshop('ME2'), me3 = workshop('ME3'), mea = workshop('MEA');
  assert.equal(canEquipUniverseItem(me2.context, 'ME2-CHR-MIRANDA', 'ME2-WPN-PREDATOR', 'weapon', me2.id).ok, true);
  assert.equal(canEquipUniverseItem(me2.context, 'ME2-CHR-MIRANDA', 'ME2-WPN-AVENGER', 'weapon', me2.id).ok, false);
  assert.equal(canEquipUniverseItem(me2.context, 'ME2-CHR-MIRANDA', 'ME2-EQP-N7', 'armor', me2.id).ok, false);
  assert.equal(canEquipUniverseItem(me3.context, 'ME3-CHR-LIARA', 'ME3-EQP-N7', 'armor', me3.id).ok, false);
  assert.equal(canEquipUniverseItem(mea.context, 'MEA-CHR-CORA', 'MEA-EQP-PATHFINDER', 'armor', mea.id).ok, false);
  assert.equal(canEquipUniverseItem(mea.context, protagonist.MEA, 'MEA-EQP-PATHFINDER', 'armor', mea.id).ok, true);
  assert.equal(canEquipUniverseItem(me2.context, protagonist.ME2, 'ME2-WPN-PREDATOR', 'armor', me2.id).ok, false);
  assert.equal(canEquipUniverseItem(me2.context, protagonist.ME2, 'ME2-WPN-PREDATOR', 'weapon', 'me3-equipment-workshop').ok, false);
  assert.equal(canEquipUniverseItem(me2.context, protagonist.ME2, 'ME2-WPN-PREDATOR', 'weapon').ok, false);
});

test('loadout normalization rejects cross-period payloads, unknown slots and malformed maps without coercion', () => {
  const session = sessionFor('ME2'), actorId = protagonist.ME2;
  assert.deepEqual(normalizeChronicleLoadouts(undefined, session.context, session.party, session.scenarioId), { [actorId]: { weapon: null, armor: null } });
  const valid = { [actorId]: { weapon: 'ME2-WPN-PREDATOR', armor: 'ME2-EQP-N7' } };
  assert.deepEqual(normalizeChronicleLoadouts(valid, session.context, session.party, session.scenarioId), valid);
  for (const raw of [null, [], { outsider: { weapon: null, armor: null } },
    { [actorId]: { weapon: 'MEA-WPN-PREDATOR', armor: null } },
    { [actorId]: { weapon: 'ME2-WPN-MATTOCK', armor: null } },
    { [actorId]: { weapon: null, armor: null, ammo: 999 } },
    { [actorId]: { weapon: null } }]) assert.equal(normalizeChronicleLoadouts(raw, session.context, session.party, session.scenarioId), null);
  assert.equal(normalizeChronicleLoadouts(valid, session.context, [actorId, actorId], session.scenarioId), null);
  assert.equal(normalizeChronicleLoadouts(valid, session.context, session.party, 'missing-scene'), null);
  assert.equal(normalizeChronicleLoadouts(valid, session.context, session.party), null);
  assert.equal(normalizeChronicleLoadouts(Object.create(valid), session.context, session.party, session.scenarioId), null);
  let invoked = false;
  const getter = {};
  Object.defineProperty(getter, actorId, { enumerable: true, get() { invoked = true; return valid[actorId]; } });
  assert.equal(normalizeChronicleLoadouts(getter, session.context, session.party, session.scenarioId), null);
  const array = [actorId]; Object.defineProperty(array, '0', { enumerable: true, get() { invoked = true; return actorId; } });
  assert.equal(normalizeChronicleLoadouts(valid, session.context, array, session.scenarioId), null);
  assert.equal(invoked, false);
  for (const id of ['constructor', '__proto__', null, 1, { toString() { throw new Error('Do not coerce'); } }]) assert.equal(getUniverseEquipment(id), null);
});

test('preparation and removal return independent maps, leave sessions unchanged and apply bonuses once', () => {
  const initial = sessionFor('MEA'), actorId = protagonist.MEA, snapshot = clone(initial);
  assert.deepEqual(getChronicleEquipmentEffects(initial, actorId), neutral);
  const equipped = prepare(prepare(initial, actorId, 'MEA-WPN-AVENGER'), actorId, 'MEA-EQP-PATHFINDER');
  assert.deepEqual(initial, snapshot);
  const effects = getChronicleEquipmentEffects(equipped, actorId);
  assert.equal(effects.defense, 2); assert.equal(effects.shield, 10);
  assert.equal(effects.weaponSystem, 'thermal-clip'); assert.equal(effects.magazineCapacity, 18);
  assert.equal(effects.ammo, 18); assert.equal(effects.reserveAmmo, 72);
  assert.equal(effects.weaponName, 'Avenger'); assert.equal(effects.attack, 0);
  assert.deepEqual(getChronicleEquipmentEffects(equipped, actorId), effects);
  const before = clone(equipped), rejected = equipChronicleItem(equipped, actorId, 'ME3-WPN-AVENGER');
  assert.equal(rejected.ok, false); assert.deepEqual(equipped, before);
  const removed = prepare(equipped, actorId, null, 'weapon');
  assert.equal(equipped.loadouts[actorId].weapon, 'MEA-WPN-AVENGER');
  assert.equal(removed.loadouts[actorId].weapon, null);
  const withoutWeapon = getChronicleEquipmentEffects(removed, actorId);
  assert.equal(Object.hasOwn(withoutWeapon, 'weaponSystem'), false);
  assert.equal(withoutWeapon.shield, 10);
  assert.equal(Object.hasOwn(equipped, 'credits'), false); assert.equal(Object.hasOwn(equipped, 'stock'), false);
});

test('equipped conventional weapons feed real thermal-clip combat, consume ammunition and reload without heat', () => {
  const actorId = protagonist.ME2, session = prepare(sessionFor('ME2'), actorId, 'ME2-WPN-AVENGER');
  const base = universeActorFor(actorId, session.context), effects = getChronicleEquipmentEffects(session, actorId);
  const battle = createBattle({ party: [{ ...base, ...effects, hp: base.hp + effects.hp, maxHp: base.maxHp + effects.hp,
    shield: base.shield + effects.shield, maxShield: base.maxShield + effects.shield, attack: base.attack + effects.attack, defense: base.defense + effects.defense }],
    enemies: [{ id: 'target', hp: 10000, maxHp: 10000, shield: 0, defense: 0, synthetic: true }], mode: 'active', rng: () => .5 });
  const actor = battle.actors[0]; actor.atb = 100;
  assert.equal(actor.ammo, 18); assert.equal(performAction(battle, { actorId, actionId: 'shoot', targetId: 'target' }).ok, true);
  assert.equal(actor.ammo, 17); assert.equal(actor.heat, 0);
  actor.atb = 100;
  assert.equal(performAction(battle, { actorId, actionId: 'reload' }).ok, true);
  assert.equal(actor.ammo, 18); assert.equal(actor.reserveAmmo, 71); assert.equal(actor.atb, 0); assert.equal(actor.heat, 0);
  assert.equal(getChronicleEquipmentEffects(session, actorId).ammo, 18, 'Battle consumption does not mutate the preparation template');
});
