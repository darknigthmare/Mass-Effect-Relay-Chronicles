import test from 'node:test';
import assert from 'node:assert/strict';
import {
  UNIVERSE_EQUIPMENT, getUniverseEquipment, listUniverseEquipment, canEquipUniverseItem,
  normalizeChronicleLoadouts, equipChronicleItem, getChronicleEquipmentEffects, CHRONICLE_EQUIPMENT_SLOTS,
} from '../src/universe-equipment.js';
import { getUniverseRecord } from '../src/universe-data.js';
import { SCENARIOS, universeActorFor } from '../src/universe-actors.js';
import { canAccessContent } from '../src/continuity.js';
import { createBattle, performAction } from '../src/combat.js';
import { UNIVERSE_WEAPON_PROFILES, getUniverseWeaponProfile } from '../src/universe-weapon-profiles.js';

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
  weaponCoolingBonus: 0, controlResistance: 0, bioticMultiplier: 1, techMultiplier: 1, weaponDamageMultiplier: 1, powerCooldownMultiplier: 1 };
const emptyLoadout = () => ({ weapon: null, armor: null, weaponMod: null, weaponMod2: null });

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
  const clipItems = UNIVERSE_EQUIPMENT.filter(item => item.runtimeSupported && item.kind === 'weapon' && item.weaponSystem === 'thermal-clip');
  assert.ok(clipItems.length > 50);
  for (const item of clipItems) {
    assert.equal(item.weaponSystem, 'thermal-clip');
    assert.ok(['pistol', 'smg', 'assault', 'shotgun', 'sniper'].includes(item.weaponType));
    assert.ok(Number.isInteger(item.magazineCapacity) && item.magazineCapacity > 0 && item.magazineCapacity <= 24);
    assert.equal(item.ammo, item.magazineCapacity);
    assert.equal(item.reserveAmmo, item.magazineCapacity * 4);
    if (!item.weaponProfileId) assert.match(item.firingModelNote, /variantes de tir d’origine non reproduits/);
  }
  for (const id of ['ME3-WPN-CHAKRAM', 'ME3-WPN-REEGAR', 'MEA-WPN-LANAT',
    'MEA-WPN-ASARI-SWORD', 'INF-WPN-MATTOCK', 'GAL-WPN-AVENGER']) {
    const item = getUniverseEquipment(id);
    assert.equal(item.runtimeSupported, false, id);
    assert.equal(item.playable, false);
    assert.ok(item.lockReason.length > 20);
    assert.ok(item.requiredCapabilities.length);
  }
  assert.equal(getUniverseEquipment('MEA-WPN-LANAT').weaponSystem, undefined);
  assert.equal(getUniverseEquipment('ME3-WPN-LANCER').weaponSystem, 'heat');
});

test('edition-dependent equipment is not unlocked by selecting its work or workshop', () => {
  for (const [mediaId, itemId] of [['ME2', 'ME2-WPN-MATTOCK'], ['ME2', 'ME2-EQP-KESTREL'],
    ['ME3', 'ME3-WPN-SUPPRESSOR'], ['MEA', 'MEA-EQP-SCAVENGER']]) {
    const item = getUniverseEquipment(itemId), scene = workshop(mediaId);
    assert.equal(item.requiresEdition, true);
    assert.equal(item.runtimeSupported, item.requiredEditionProfile !== null);
    const result = canEquipUniverseItem(scene.context, protagonist[mediaId], itemId, item.slot, scene.id);
    assert.equal(result.ok, false);
    assert.match(result.reason, /Édition|édition|Edition|Deluxe|contenu additionnel/);
  }
});

test('workshop selections have explicit permissions and never become prologue mission equipment', () => {
  const expected = { ME2: 11, ME3: 35, MEA: 38 };
  for (const [mediaId, count] of Object.entries(expected)) {
    const scene = workshop(mediaId), actorId = protagonist[mediaId];
    assert.equal(scene.allowedEquipmentIds.length, count);
    const loadout = { ...emptyLoadout(), weapon: `${mediaId}-WPN-AVENGER` };
    const listed = listUniverseEquipment(scene.context, { actorId, scenarioId: scene.id, loadout });
    assert.equal(listed.filter(item => item.compatible).length, count - (mediaId === 'ME3' ? 1 : 0), 'The SMG ultralight family does not fit the assault-rifle parent');
    for (const id of scene.allowedEquipmentIds) {
      const item = getUniverseEquipment(id);
      assert.equal(item.mediaId, mediaId);
      assert.equal(item.runtimeSupported, true);
      const parent = item.modFamily === 'ultralight' ? { ...loadout, weapon: 'ME3-WPN-SHURIKEN' } : loadout;
      assert.equal(canEquipUniverseItem(scene.context, actorId, id, item.slot, scene.id, parent).ok, true, id);
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
  assert.deepEqual(normalizeChronicleLoadouts(undefined, session.context, session.party, session.scenarioId), { [actorId]: emptyLoadout() });
  const valid = { [actorId]: { weapon: 'ME2-WPN-PREDATOR', armor: 'ME2-EQP-N7' } };
  assert.deepEqual(normalizeChronicleLoadouts(valid, session.context, session.party, session.scenarioId), {
    [actorId]: { ...emptyLoadout(), ...valid[actorId] },
  });
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

test('the original barrel and magazine modifications remain partial family prototypes with no invented ranks', () => {
  assert.deepEqual(CHRONICLE_EQUIPMENT_SLOTS, ['weapon', 'armor', 'weaponMod', 'weaponMod2']);
  for (const [id, family] of [['ME3-EQP-BARREL', 'barrel'], ['ME3-EQP-MAGAZINE', 'magazine']]) {
    const item = getUniverseEquipment(id), source = getUniverseRecord(id);
    assert.equal(item.name, source.name);
    assert.equal(item.description, 'Famille de modification.');
    assert.deepEqual(item.sourceIds, source.sourceIds);
    assert.equal(item.familyPrototype, true); assert.equal(item.runtimeSupported, true);
    assert.equal(item.kind, 'weaponMod'); assert.equal(item.slot, 'weaponMod');
    assert.equal(item.modFamily, family);
    assert.deepEqual(item.allowedSlots, ['weaponMod', 'weaponMod2']);
    assert.deepEqual(item.weaponTypes, ['assault']); assert.deepEqual(item.weaponSystems, ['thermal-clip']);
    assert.match(item.prototypeDetail, /aucun modèle, rang, fabricant ni compatibilité universelle d’origine certifiés/);
  }
  for (const id of ['ME3-EQP-SCOPE', 'ME3-EQP-WEAPON-MODS',
    'MEA-EQP-WEAPON-MODS', 'MEA-EQP-AUGMENT', 'MEA-EQP-FUSION']) {
    assert.equal(getUniverseEquipment(id).runtimeSupported, false, id);
  }
});

test('two-slot saves migrate to four empty ports without changing their selected weapon or armor', () => {
  const session = sessionFor('ME3'), actorId = protagonist.ME3;
  const legacy = { [actorId]: { weapon: 'ME3-WPN-AVENGER', armor: 'ME3-EQP-N7' } }, before = clone(legacy);
  const expected = { [actorId]: { ...emptyLoadout(), ...legacy[actorId] } };
  const normalized = normalizeChronicleLoadouts(legacy, session.context, session.party, session.scenarioId);
  assert.deepEqual(normalized, expected); assert.deepEqual(legacy, before);
  assert.deepEqual(normalizeChronicleLoadouts(normalized, session.context, session.party, session.scenarioId), expected);
  const partial = { [actorId]: { ...legacy[actorId], weaponMod: null } };
  assert.equal(normalizeChronicleLoadouts(partial, session.context, session.party, session.scenarioId), null);
  normalized[actorId].weapon = null;
  assert.equal(legacy[actorId].weapon, 'ME3-WPN-AVENGER');
});

test('modification permissions require an explicit compatible parent rather than an abstract default gun', () => {
  const session = sessionFor('ME3'), actorId = protagonist.ME3, { context, scenarioId } = session;
  const check = (itemId, slot, row) => canEquipUniverseItem(context, actorId, itemId, slot, scenarioId, row);
  assert.equal(check('ME3-EQP-BARREL', 'weaponMod').ok, false);
  assert.equal(check('ME3-EQP-BARREL', 'weaponMod', emptyLoadout()).ok, false);
  for (const id of ['ME3-WPN-PREDATOR', 'ME3-WPN-SHURIKEN', 'ME3-WPN-KATANA', 'ME3-WPN-MANTIS',
    'ME3-WPN-LANCER', 'ME3-WPN-PARTICLE', 'ME3-WPN-FALCON', 'ME3-WPN-SCORPION', 'ME2-WPN-AVENGER']) {
    assert.equal(check('ME3-EQP-BARREL', 'weaponMod', { ...emptyLoadout(), weapon: id }).ok, false, id);
  }
  const row = { ...emptyLoadout(), weapon: 'ME3-WPN-AVENGER' };
  assert.equal(check('ME3-EQP-BARREL', 'weaponMod', row).ok, true);
  assert.equal(check('ME3-EQP-BARREL', 'weaponMod2', row).ok, true);
  assert.equal(check('ME3-EQP-BARREL', 'armor', row).ok, false);
  assert.equal(canEquipUniverseItem(workshop('ME2').context, protagonist.ME2, 'ME3-EQP-BARREL', 'weaponMod', workshop('ME2').id, row).ok, false);
  const noParent = listUniverseEquipment(context, { actorId, scenarioId }).find(item => item.id === 'ME3-EQP-BARREL');
  assert.equal(noParent.compatible, false); assert.deepEqual(noParent.compatibleSlots, []);
  const withParent = listUniverseEquipment(context, { actorId, scenarioId, loadout: row }).find(item => item.id === 'ME3-EQP-BARREL');
  assert.equal(withParent.compatible, true); assert.deepEqual(withParent.compatibleSlots, ['weaponMod', 'weaponMod2']);
});

test('the two ports accept distinct families in either order and reject duplicated or orphaned imports', () => {
  const actorId = protagonist.ME3, base = prepare(sessionFor('ME3'), actorId, 'ME3-WPN-AVENGER');
  const first = prepare(base, actorId, 'ME3-EQP-BARREL'), combined = prepare(first, actorId, 'ME3-EQP-MAGAZINE');
  assert.equal(first.loadouts[actorId].weaponMod, 'ME3-EQP-BARREL');
  assert.equal(combined.loadouts[actorId].weaponMod2, 'ME3-EQP-MAGAZINE');
  const before = clone(first);
  assert.equal(equipChronicleItem(first, actorId, 'ME3-EQP-BARREL', 'weaponMod2').ok, false);
  assert.deepEqual(first, before);
  const card = listUniverseEquipment(first.context, { actorId, scenarioId: first.scenarioId, loadout: first.loadouts[actorId] })
    .find(item => item.id === 'ME3-EQP-BARREL');
  assert.equal(card.compatible, true); assert.equal(card.reason, null);
  assert.deepEqual(card.compatibleSlots, ['weaponMod']); assert.equal(card.slotReasons.weaponMod, null);
  assert.match(card.slotReasons.weaponMod2, /même famille/);
  assert.deepEqual(prepare(first, actorId, 'ME3-EQP-BARREL').loadouts, first.loadouts);
  const reverse = prepare(prepare(base, actorId, 'ME3-EQP-MAGAZINE', 'weaponMod2'), actorId, 'ME3-EQP-BARREL', 'weaponMod');
  assert.deepEqual(getChronicleEquipmentEffects(reverse, actorId), getChronicleEquipmentEffects(combined, actorId));
  for (const mutate of [row => { row.weaponMod2 = 'ME3-EQP-BARREL'; }, row => { row.weapon = null; },
    row => { row.weapon = 'ME3-WPN-PREDATOR'; }, row => { row.weaponMod = 'MEA-EQP-FUSION'; },
    row => { row.weaponMod = 'ME3-EQP-SCOPE'; }]) {
    const raw = clone(combined.loadouts); mutate(raw[actorId]);
    assert.equal(normalizeChronicleLoadouts(raw, combined.context, combined.party, combined.scenarioId), null);
  }
});

test('weapon replacement or removal releases both module selections atomically and same-weapon selection preserves them', () => {
  const actorId = protagonist.ME3;
  const base = prepare(prepare(prepare(sessionFor('ME3'), actorId, 'ME3-WPN-AVENGER'), actorId, 'ME3-EQP-BARREL'), actorId, 'ME3-EQP-MAGAZINE');
  const before = clone(base);
  const same = equipChronicleItem(base, actorId, 'ME3-WPN-AVENGER');
  assert.equal(same.ok, true); assert.deepEqual(same.returnedMods, []); assert.deepEqual(same.loadouts, base.loadouts);
  for (const replacement of [null, 'ME3-WPN-PREDATOR', 'ME3-WPN-VINDICATOR']) {
    const result = equipChronicleItem(base, actorId, replacement, 'weapon');
    assert.equal(result.ok, true, result.reason);
    assert.deepEqual(result.returnedMods, ['ME3-EQP-BARREL', 'ME3-EQP-MAGAZINE']);
    assert.equal(result.loadouts[actorId].weaponMod, null); assert.equal(result.loadouts[actorId].weaponMod2, null);
    assert.equal(getChronicleEquipmentEffects({ ...base, loadouts: result.loadouts }, actorId).weaponDamageMultiplier, 1);
  }
  assert.equal(equipChronicleItem(base, actorId, 'ME3-WPN-LANCER').ok, false);
  assert.deepEqual(base, before);
});

test('magazine capacity transfers its initial extra rounds from reserve and removing it restores the same finite budget', () => {
  const actorId = protagonist.ME3, scene = workshop('ME3');
  for (const weaponId of scene.allowedEquipmentIds.filter(id => getUniverseEquipment(id).kind === 'weapon'
    && getUniverseEquipment(id).weaponType === 'assault' && !getUniverseEquipment(id).weaponProfileId)) {
    const base = prepare(sessionFor('ME3'), actorId, weaponId), original = getChronicleEquipmentEffects(base, actorId);
    const equipped = prepare(base, actorId, 'ME3-EQP-MAGAZINE'), effects = getChronicleEquipmentEffects(equipped, actorId);
    assert.equal(effects.magazineCapacity, Math.ceil(original.magazineCapacity * 1.25));
    assert.equal(effects.ammo + effects.reserveAmmo, original.ammo + original.reserveAmmo);
    assert.equal(effects.ammo, effects.magazineCapacity); assert.ok(effects.reserveAmmo >= 0);
    assert.equal(Object.hasOwn(effects, 'magazineCapacityMultiplier'), false, 'The compositor receives final capacity, never a multiplier to apply twice');
    const removed = prepare(equipped, actorId, null, 'weaponMod');
    assert.deepEqual(getChronicleEquipmentEffects(removed, actorId), original);
  }
});

test('a real modified weapon changes only gunfire damage while capacity and reload preserve finite ammunition', () => {
  const actorId = protagonist.ME3;
  const plain = prepare(sessionFor('ME3'), actorId, 'ME3-WPN-AVENGER');
  const modified = prepare(prepare(plain, actorId, 'ME3-EQP-BARREL'), actorId, 'ME3-EQP-MAGAZINE');
  const before = getChronicleEquipmentEffects(plain, actorId), after = getChronicleEquipmentEffects(modified, actorId);
  assert.equal(before.attack, after.attack); assert.equal(after.weaponDamageMultiplier, 1.12);
  assert.equal(after.bioticMultiplier, 1); assert.equal(after.techMultiplier, 1);
  assert.equal(after.magazineCapacity, 23); assert.equal(after.ammo, 23); assert.equal(after.reserveAmmo, 67);
  const scenario = effects => {
    const base = universeActorFor(actorId, modified.context);
    return createBattle({ party: [{ ...base, ...effects, hp: base.hp, maxHp: base.maxHp, shield: base.shield, maxShield: base.maxShield,
      attack: base.attack, defense: base.defense, powers: ['throw', 'overload'] }],
      enemies: [{ id: 'target', hp: 10000, maxHp: 10000, shield: 0, defense: 0, synthetic: true }], mode: 'active', rng: () => .5 });
  };
  const damage = (effects, actionId) => {
    const battle = scenario(effects); battle.actors[0].atb = 100;
    assert.equal(performAction(battle, { actorId, actionId, targetId: 'target' }).ok, true);
    return { value: 10000 - battle.actors[1].hp, battle };
  };
  const shot = damage(after, 'shoot');
  assert.ok(Math.abs(shot.value - damage(before, 'shoot').value * 1.12) < 1e-8);
  for (const action of ['throw', 'overload']) assert.equal(damage(after, action).value, damage(before, action).value);
  const actor = shot.battle.actors[0];
  assert.equal(actor.ammo, 22); assert.equal(actor.heat, 0);
  actor.atb = 100; assert.equal(performAction(shot.battle, { actorId, actionId: 'reload' }).ok, true);
  assert.equal(actor.ammo, 23); assert.equal(actor.reserveAmmo, 66); assert.equal(actor.heat, 0);
  assert.equal(actor.ammo + actor.reserveAmmo, 89, 'The shot spent one round; reload creates none');
});

test('special weapons retain source facts, exact edition and scene gates without leaking into prologues', () => {
  for (const profile of UNIVERSE_WEAPON_PROFILES) {
    const item = getUniverseEquipment(profile.id), source = getUniverseRecord(profile.id);
    const mediaId = profile.id.startsWith('ME3-') ? 'ME3' : 'MEA';
    const scene = item.requiredEditionProfile ? SCENARIOS.find(candidate => candidate.context.mediaId === mediaId
      && candidate.editionEquipmentProfile === item.requiredEditionProfile) : workshop(mediaId), actorId = protagonist[mediaId];
    assert.equal(item.runtimeSupported, true, profile.id); assert.equal(item.requiresEdition, item.requiredEditionProfile !== null);
    assert.equal(item.playable, false, 'A supported profile alone is not permission to use it in any scene');
    assert.equal(item.name, source.name); assert.equal(item.description, source.description);
    assert.deepEqual(item.sourceIds, source.sourceIds);
    assert.equal(item.weaponProfileId, profile.id); assert.equal(item.weaponSystem, profile.weaponSystem);
    assert.equal(item.weaponType, profile.weaponType); assert.equal(item.firingModelNote, profile.mechanicNote);
    assert.deepEqual(item.profileLimitations, profile.limitations);
    assert.equal(canEquipUniverseItem(scene.context, actorId, item.id, 'weapon', scene.id).ok, true);
    assert.equal(canEquipUniverseItem(scene.context, actorId, item.id, 'weapon', 'missing-workshop').ok, false);
    assert.equal(canEquipUniverseItem(scene.context, actorId, item.id, 'weaponMod', scene.id).ok, false);
    assert.equal(canEquipUniverseItem(workshop('ME2').context, protagonist.ME2, item.id, 'weapon', workshop('ME2').id).ok, false);
    for (const prologue of SCENARIOS.filter(candidate => candidate.context.mediaId === mediaId && candidate.kind !== 'equipment-workshop')) {
      for (const wearer of prologue.actorIds) {
        assert.equal(canEquipUniverseItem(prologue.context, wearer, item.id, 'weapon', prologue.id).ok, false);
      }
    }
  }
});

test('special equipment effects transmit only a whitelisted profile ID and the correct finite resource system', () => {
  for (const profile of UNIVERSE_WEAPON_PROFILES) {
    const mediaId = profile.id.startsWith('ME3-') ? 'ME3' : 'MEA', actorId = protagonist[mediaId];
    const item = getUniverseEquipment(profile.id), scene = item.requiredEditionProfile ? SCENARIOS.find(candidate => candidate.context.mediaId === mediaId
      && candidate.editionEquipmentProfile === item.requiredEditionProfile) : workshop(mediaId);
    const original = { ...sessionFor(mediaId), scenarioId: scene.id }, snapshot = clone(original);
    const prepared = prepare(original, actorId, profile.id), effects = getChronicleEquipmentEffects(prepared, actorId);
    assert.deepEqual(original, snapshot);
    assert.equal(effects.weaponProfileId, profile.id);
    assert.equal(getUniverseWeaponProfile(effects.weaponProfileId), profile);
    assert.equal(effects.weaponSystem, profile.weaponSystem);
    assert.equal(effects.attack, 0); assert.equal(effects.weaponDamageMultiplier, 1);
    assert.equal(effects.techMultiplier, 1); assert.equal(effects.bioticMultiplier, 1);
    assert.equal(Object.hasOwn(effects, 'weaponProfile'), false, 'Custom serialized mechanics are never accepted');
    if (profile.weaponSystem === 'heat') {
      for (const key of ['magazineCapacity', 'ammo', 'reserveAmmo']) {
        assert.equal(Object.hasOwn(effects, key), false); assert.equal(Object.hasOwn(getUniverseEquipment(profile.id), key), false);
      }
    } else {
      assert.equal(effects.magazineCapacity, profile.magazineCapacity);
      assert.equal(effects.ammo, profile.ammo); assert.equal(effects.reserveAmmo, profile.reserveAmmo);
    }
    assert.deepEqual(getChronicleEquipmentEffects(prepare(prepared, actorId, null, 'weapon'), actorId), neutral);
  }
  const ordinary = prepare(sessionFor('ME3'), protagonist.ME3, 'ME3-WPN-AVENGER');
  assert.equal(Object.hasOwn(getChronicleEquipmentEffects(ordinary, protagonist.ME3), 'weaponProfileId'), false);
  const legacy = { [protagonist.ME3]: { weapon: 'ME3-WPN-AVENGER', armor: 'ME3-EQP-N7' } };
  assert.deepEqual(normalizeChronicleLoadouts(legacy, ordinary.context, ordinary.party, ordinary.scenarioId), {
    [protagonist.ME3]: { ...emptyLoadout(), ...legacy[protagonist.ME3] },
  });
});

test('special assault weapons do not inherit conventional mod permissions, and replacing the parent releases both ports', () => {
  const actorId = protagonist.ME3;
  const equipped = prepare(prepare(prepare(sessionFor('ME3'), actorId, 'ME3-WPN-AVENGER'), actorId, 'ME3-EQP-BARREL'), actorId, 'ME3-EQP-MAGAZINE');
  const result = equipChronicleItem(equipped, actorId, 'ME3-WPN-FALCON', 'weapon');
  assert.equal(result.ok, true, result.reason);
  assert.deepEqual(result.returnedMods, ['ME3-EQP-BARREL', 'ME3-EQP-MAGAZINE']);
  assert.deepEqual(result.loadouts[actorId], { ...emptyLoadout(), weapon: 'ME3-WPN-FALCON' });
  const falcon = { ...equipped, loadouts: result.loadouts }, snapshot = clone(result.loadouts);
  assert.equal(getChronicleEquipmentEffects(falcon, actorId).magazineCapacity, 6);
  for (const slot of ['weaponMod', 'weaponMod2']) {
    for (const itemId of ['ME3-EQP-BARREL', 'ME3-EQP-MAGAZINE']) {
      const rejected = equipChronicleItem(falcon, actorId, itemId, slot);
      assert.equal(rejected.ok, false); assert.match(rejected.reason, /conventionnel/);
      const forged = clone(falcon.loadouts); forged[actorId][slot] = itemId;
      assert.equal(normalizeChronicleLoadouts(forged, falcon.context, falcon.party, falcon.scenarioId), null);
    }
  }
  assert.deepEqual(falcon.loadouts, snapshot);
});
