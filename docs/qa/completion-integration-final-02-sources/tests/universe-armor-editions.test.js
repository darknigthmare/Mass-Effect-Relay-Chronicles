import test from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIOS } from '../src/universe-actors.js';
import { getUniverseRecord } from '../src/universe-data.js';
import { getUniverseEquipment, UNIVERSE_EQUIPMENT, canEquipUniverseItem, equipChronicleItem,
  normalizeChronicleLoadouts, getChronicleEquipmentEffects } from '../src/universe-equipment.js';
import { createChronicle, equipChronicle, setChronicleBuild, buildChronicleActor,
  startChronicleBattle, encodeChronicle, decodeChronicle } from '../src/chronicles.js';
import { performAction } from '../src/combat.js';

const protagonist = { ME2: 'ME2-CHR-SHEPARD', ME3: 'ME3-CHR-SHEPARD', MEA: 'MEA-CHR-RYDER' };
const editionIds = {
  ME2: ['KESTREL', 'CERBERUS', 'COLLECTOR', 'TERMINUS', 'BLOOD-DRAGON', 'INFERNO'],
  ME3: ['AJAX', 'INFERNO', 'BLOOD-DRAGON', 'COLLECTOR', 'TERMINUS', 'CERBERUS'],
  MEA: ['SCAVENGER', 'DEEP-SPACE'],
};
const scene = (mediaId, edition = false) => SCENARIOS.find(candidate => candidate.context.mediaId === mediaId
  && candidate.kind === 'equipment-workshop' && Boolean(candidate.editionEquipmentProfile) === edition);
const emptyRow = () => ({ weapon: null, armor: null, weaponMod: null, weaponMod2: null });
const fresh = (mediaId, edition = false) => createChronicle(scene(mediaId, edition).context, scene(mediaId, edition).id);
const equip = (session, actorId, itemId, slot) => {
  const result = equipChronicle(session, actorId, itemId, slot);
  assert.equal(result.ok, true, result.reason); return result.session;
};

test('all twenty-five aggregate armor profiles preserve their documented identity and protagonist morphology', () => {
  const armors = UNIVERSE_EQUIPMENT.filter(item => item.runtimeSupported && item.kind === 'armor');
  assert.equal(armors.length, 25);
  for (const item of armors) {
    const record = getUniverseRecord(item.id);
    assert.equal(item.name, record.name); assert.equal(item.description, record.description);
    assert.deepEqual(item.sourceIds, record.sourceIds); assert.deepEqual(item.availability, record.availability);
    assert.deepEqual(item.armorSpecies, ['human']); assert.deepEqual(item.wearerIds, [protagonist[item.mediaId]]);
    assert.equal(item.armorGranularity, 'aggregate-preset');
    assert.match(item.prototypeDetail, /statistiques et apparence d’origine non reproduites/);
    assert.equal(item.statsBasis, 'ATB adaptation'); assert.equal(Object.hasOwn(item, 'rank'), false);
    assert.equal(Object.hasOwn(item, 'manufacturer'), false);
  }
});

test('fourteen edition sets require the exact prepared edition workshop, never the historical workshop or a forged context', () => {
  for (const [mediaId, suffixes] of Object.entries(editionIds)) {
    const standard = scene(mediaId), edition = scene(mediaId, true), actorId = protagonist[mediaId];
    assert.equal(edition.editionEquipmentProfile, mediaId === 'MEA' ? 'deluxe' : 'legendary');
    for (const suffix of suffixes) {
      const id = `${mediaId}-EQP-${suffix}`, item = getUniverseEquipment(id);
      assert.equal(item.runtimeSupported, true); assert.equal(item.requiresEdition, true);
      assert.equal(item.requiredEditionProfile, edition.editionEquipmentProfile);
      assert.equal(canEquipUniverseItem(edition.context, actorId, id, 'armor', edition.id).ok, true);
      assert.equal(canEquipUniverseItem(standard.context, actorId, id, 'armor', standard.id).ok, false);
      assert.equal(standard.allowedEquipmentIds.includes(id), false);
      assert.equal(canEquipUniverseItem({ ...standard.context, editionEquipmentProfile: item.requiredEditionProfile }, actorId, id, 'armor', standard.id).ok, false);
      assert.equal(canEquipUniverseItem(edition.context, actorId, id, 'armor', scene(mediaId === 'ME2' ? 'ME3' : 'ME2', true).id).ok, false);
      for (const companion of edition.actorIds.filter(candidate => candidate !== actorId))
        assert.equal(canEquipUniverseItem(edition.context, companion, id, 'armor', edition.id).ok, false);
    }
  }
});

test('edition armor changes are pure and their bounded protection reaches saved preparations and real battles once', () => {
  for (const [mediaId, suffixes] of Object.entries(editionIds)) {
    const actorId = protagonist[mediaId], original = fresh(mediaId, true), before = structuredClone(original);
    const baseActor = buildChronicleActor(original, actorId);
    for (const suffix of suffixes) {
      const prepared = equip(original, actorId, `${mediaId}-EQP-${suffix}`, 'armor');
      const effects = getChronicleEquipmentEffects(prepared, actorId), actor = buildChronicleActor(prepared, actorId);
      assert.equal(effects.defense, 2); assert.equal(effects.shield, 10); assert.equal(effects.attack, 0); assert.equal(effects.hp, 0);
      assert.equal(actor.defense, baseActor.defense + 2); assert.equal(actor.maxShield, baseActor.maxShield + 10);
      assert.equal(actor.hp, baseActor.hp); assert.equal(actor.attack, baseActor.attack);
      assert.deepEqual(actor.powers, baseActor.powers);
      const restored = decodeChronicle(encodeChronicle(prepared)); assert.deepEqual(restored, prepared);
      assert.deepEqual(buildChronicleActor(restored, actorId), actor);
      const started = startChronicleBattle(restored); assert.equal(started.ok, true, started.reason);
      const combatant = started.battle.actors.find(candidate => candidate.id === actorId);
      assert.equal(combatant.defense, actor.defense); assert.equal(combatant.maxShield, actor.maxShield);
      assert.deepEqual(prepared.cleared, []); assert.equal(Object.hasOwn(prepared, 'credits'), false);
      assert.equal(Object.hasOwn(prepared, 'owned'), false);
    }
    assert.deepEqual(original, before);
  }
});

test('moving an edition armor ID into an old-workshop save is rejected instead of silently broadening availability', () => {
  for (const [mediaId, suffixes] of Object.entries(editionIds)) {
    const session = fresh(mediaId), actorId = protagonist[mediaId], forged = structuredClone(session.loadouts);
    forged[actorId].armor = `${mediaId}-EQP-${suffixes[0]}`;
    assert.equal(normalizeChronicleLoadouts(forged, session.context, session.party, session.scenarioId), null);
    const packet = JSON.parse(encodeChronicle(session)); packet.session.loadouts = forged;
    assert.equal(decodeChronicle(packet), null);
    assert.equal(equipChronicleItem(session, actorId, forged[actorId].armor, 'armor').ok, false);
  }
});

test('Remnant is a bounded Ryder-only aggregate, without unverified regeneration or fusion slots', () => {
  const id = 'MEA-EQP-REMNANT', item = getUniverseEquipment(id);
  assert.equal(item.requiresEdition, false); assert.equal(item.requiredEditionProfile, null);
  assert.deepEqual(item.bonuses, { defense: 2, shield: 10 });
  for (const edition of [false, true]) {
    const session = equip(fresh('MEA', edition), protagonist.MEA, id, 'armor');
    const effects = getChronicleEquipmentEffects(session, protagonist.MEA);
    assert.equal(effects.defense, 2); assert.equal(effects.shield, 10);
    assert.equal(Object.hasOwn(effects, 'shieldRechargeMultiplier'), false);
    assert.deepEqual(Object.keys(session.loadouts[protagonist.MEA]).sort(), Object.keys(emptyRow()).sort());
    for (const companion of session.party.filter(actorId => actorId !== protagonist.MEA))
      assert.equal(equipChronicleItem(session, companion, id, 'armor').ok, false);
  }
});

test('the ultralight family needs an explicit conventional SMG parent and cannot duplicate itself across ports', () => {
  const workshop = scene('ME3'), actorId = protagonist.ME3, id = 'ME3-EQP-ULTRALIGHT';
  const item = getUniverseEquipment(id), base = fresh('ME3');
  assert.equal(item.familyPrototype, true); assert.deepEqual(item.weaponTypes, ['smg']);
  assert.equal(item.bonuses.powerCooldownMultiplier, .9); assert.match(item.prototypeDetail, /Aucun poids, rang ou bonus original certifié/);
  for (const weapon of [null, 'ME3-WPN-AVENGER', 'ME3-WPN-FALCON', 'ME3-WPN-PARTICLE', 'ME3-WPN-LANCER', 'ME2-WPN-SHURIKEN']) {
    assert.equal(canEquipUniverseItem(workshop.context, actorId, id, 'weaponMod', workshop.id, { ...emptyRow(), weapon }).ok, false);
  }
  const parent = equip(base, actorId, 'ME3-WPN-SHURIKEN', 'weapon');
  const first = equip(parent, actorId, id, 'weaponMod2');
  assert.equal(equipChronicleItem(first, actorId, id, 'weaponMod').ok, false);
  const forged = structuredClone(first.loadouts); forged[actorId].weaponMod = id;
  assert.equal(normalizeChronicleLoadouts(forged, first.context, first.party, first.scenarioId), null);
  const replaced = equipChronicleItem(first, actorId, 'ME3-WPN-AVENGER', 'weapon');
  assert.equal(replaced.ok, true); assert.deepEqual(replaced.returnedMods, [id]);
  assert.equal(getChronicleEquipmentEffects({ ...first, loadouts: replaced.loadouts }, actorId).powerCooldownMultiplier, 1);
});

test('ultralight changes a native timed cooldown once while finite ammunition and power strength are unchanged', () => {
  const actorId = protagonist.ME3;
  let base = setChronicleBuild(fresh('ME3'), actorId, 'engineer').session;
  base = equip(base, actorId, 'ME3-WPN-SHURIKEN', 'weapon');
  const modified = equip(base, actorId, 'ME3-EQP-ULTRALIGHT', 'weaponMod');
  const plain = buildChronicleActor(base, actorId), lighter = buildChronicleActor(modified, actorId);
  assert.equal(lighter.powerCooldownMultiplier, .9);
  for (const key of ['attack', 'defense', 'hp', 'maxShield', 'ammo', 'magazineCapacity', 'reserveAmmo', 'bioticMultiplier', 'techMultiplier'])
    assert.equal(lighter[key], plain[key], key);
  const perform = session => {
    const started = startChronicleBattle(session); assert.equal(started.ok, true, started.reason);
    const actor = started.battle.actors.find(candidate => candidate.id === actorId), enemy = started.battle.actors.find(candidate => candidate.team === 'enemy');
    actor.atb = 100;
    assert.equal(performAction(started.battle, { actorId, actionId: 'overload', targetId: enemy.id }).ok, true);
    return { actor, enemy };
  };
  const original = perform(base), adjusted = perform(modified);
  assert.equal(adjusted.actor.cooldowns.overload, original.actor.cooldowns.overload * .9);
  assert.equal(adjusted.enemy.hp, original.enemy.hp); assert.equal(adjusted.enemy.shield, original.enemy.shield);
  assert.equal(adjusted.actor.ammo, original.actor.ammo); assert.equal(adjusted.actor.reserveAmmo, original.actor.reserveAmmo);
  assert.deepEqual(buildChronicleActor(decodeChronicle(encodeChronicle(modified)), actorId), lighter);
});

test('missing aiming, named MEA mods, crafting augmentations and fusion mechanics remain closed', () => {
  for (const id of ['ME3-EQP-SCOPE', 'MEA-EQP-WEAPON-MODS', 'MEA-EQP-AUGMENT', 'MEA-EQP-FUSION',
    'ME2-EQP-SENTRY', 'ME2-EQP-ARCHON', 'ME2-EQP-CAPACITOR', 'ME2-EQP-LIFE-SUPPORT', 'ME2-EQP-ORDNANCE']) {
    assert.equal(getUniverseEquipment(id).runtimeSupported, false, id);
  }
  for (const id of ['MEA-MOD-RECEIVER', 'MEA-MOD-BARREL', 'MEA-MOD-MAGAZINE']) assert.equal(getUniverseEquipment(id), null);
});
