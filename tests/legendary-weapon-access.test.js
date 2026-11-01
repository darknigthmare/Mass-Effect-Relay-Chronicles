import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { UNIVERSE_EQUIPMENT, getUniverseEquipment, canEquipUniverseItem, listUniverseEquipment,
  normalizeChronicleLoadouts, getChronicleEquipmentEffects } from '../src/universe-equipment.js';
import { SCENARIOS, getUniverseActorProfile } from '../src/universe-actors.js';
import { getUniverseRecord, UNIVERSE_WORKS } from '../src/universe-data.js';
import { createChronicle, equipChronicle, buildChronicleActor, startChronicleBattle,
  setChronicleBuild, encodeChronicle, decodeChronicle } from '../src/chronicles.js';
import { createBattle, getActions, performAction, tickBattle } from '../src/combat.js';

const ids = ['PHALANX', 'LOCUST', 'MATTOCK', 'EVISCERATOR', 'INCISOR'].map(suffix => `ME2-WPN-${suffix}`);
const scene = SCENARIOS.find(scene => scene.id === 'me2-legendary-equipment-workshop');
const standard = SCENARIOS.find(scene => scene.id === 'me2-equipment-workshop');
const actorId = 'ME2-CHR-SHEPARD';
const fresh = () => createChronicle(scene.context, scene.id);
const before = JSON.parse(await readFile(new URL('../docs/qa/legendary-weapon-access-baseline.json', import.meta.url), 'utf8'));
const emptyRow = () => ({ weapon: null, armor: null, weaponMod: null, weaponMod2: null });
const equip = (session, id) => {
  const result = equipChronicle(session, actorId, id, 'weapon');
  assert.equal(result.ok, true, result.reason); return result.session;
};
const omit = (value, keys) => Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));
function ready(battle) {
  const actor = battle.actors.find(actor => actor.id === actorId);
  for (let i = 0; i < 300 && actor.atb < 100; i++) tickBattle(battle, .1);
  assert.equal(actor.atb, 100);
}
const order = (battle, actionId) => performAction(battle, {
  actorId, actionId, targetId: actionId === 'reload' ? actorId : 'target',
});

test('exactly five existing profiles gain a Legendary preparation flag, with all identities, resources and other profiles preserved', () => {
  assert.equal(before.baselineCommit, '105d03727dc51c6121ed1bd2811b0146d047cbb2');
  assert.equal(UNIVERSE_EQUIPMENT.length, before.equipment.length);
  assert.deepEqual(UNIVERSE_EQUIPMENT.map(item => item.id), before.equipment.map(item => item.id));
  for (const old of before.equipment) {
    const current = getUniverseEquipment(old.id);
    if (!ids.includes(old.id)) { assert.deepEqual(current, old); continue; }
    assert.equal(old.runtimeSupported, false); assert.equal(old.requiredEditionProfile, null);
    assert.equal(current.runtimeSupported, true); assert.equal(current.requiredEditionProfile, 'legendary');
    assert.deepEqual(omit(current, ['runtimeSupported', 'requiredEditionProfile', 'lockReason']),
      omit(old, ['runtimeSupported', 'requiredEditionProfile', 'lockReason']));
    assert.match(current.lockReason, /Legendary Edition/);
    const source = getUniverseRecord(old.id);
    assert.equal(current.fact, true); assert.equal(current.name, source.name); assert.equal(current.playable, false);
    assert.deepEqual(current.sourceIds, source.sourceIds); assert.deepEqual(current.availability, source.availability);
    assert.deepEqual(current.requiredCapabilities, ['thermal-clip']); assert.equal(current.weaponProfileId, undefined);
    assert.equal(current.requiresEdition, true); assert.equal(current.statsBasis, 'ATB adaptation');
  }
  assert.equal(UNIVERSE_EQUIPMENT.filter(item => item.runtimeSupported).length, 105);
  assert.equal(UNIVERSE_EQUIPMENT.filter(item => item.runtimeSupported && item.kind === 'weapon').length, 77);
});

test('only the existing ME2 Legendary workshop appends five choices while all twenty-five default parties, enemies and old choices stay intact', () => {
  assert.equal(SCENARIOS.length, 25);
  for (const old of before.scenarios) {
    const current = SCENARIOS.find(candidate => candidate.id === old.id);
    if (current.id !== scene.id) { assert.deepEqual(current, old); continue; }
    assert.deepEqual(omit(current, ['allowedEquipmentIds', 'additionalEquipmentIds', 'sourceEntryIds', 'sourceIds']),
      omit(old, ['allowedEquipmentIds', 'additionalEquipmentIds', 'sourceEntryIds', 'sourceIds']));
    assert.deepEqual(current.allowedEquipmentIds, [...old.allowedEquipmentIds, ...ids]);
    assert.deepEqual(current.additionalEquipmentIds, [...old.additionalEquipmentIds, ...ids]);
    assert.deepEqual(current.sourceEntryIds, [...old.sourceEntryIds, ...ids]);
    assert.deepEqual(current.sourceIds.slice(0, old.sourceIds.length), old.sourceIds);
  }
  assert.equal(scene.allowedEquipmentIds.length, 22); assert.equal(standard.allowedEquipmentIds.length, 11);
  assert.equal(Object.isFrozen(scene.allowedEquipmentIds), true);
});

test('all five require the canonical Legendary scene, exact work/segment, existing actor and existing weapon-family permission', () => {
  const contexts = UNIVERSE_WORKS.flatMap(work => work.periods.map(period => ({ mediaId: work.id, periodId: period.id })));
  for (const id of ids) {
    const item = getUniverseEquipment(id);
    assert.equal(canEquipUniverseItem(scene.context, actorId, id, 'weapon', scene.id).ok, true);
    for (const candidate of SCENARIOS.filter(candidate => candidate.id !== scene.id))
      assert.equal(canEquipUniverseItem(candidate.context, candidate.defaultParty[0], id, 'weapon', candidate.id).ok, false, `${id}:${candidate.id}`);
    for (const context of contexts.filter(context => context.mediaId !== 'ME2' || context.periodId !== 'me2'))
      assert.equal(canEquipUniverseItem(context, actorId, id, 'weapon', scene.id).ok, false);
    for (const owner of scene.actorIds) {
      const profile = getUniverseActorProfile(owner, scene.context);
      assert.equal(canEquipUniverseItem(scene.context, owner, id, 'weapon', scene.id).ok, profile.allowedWeapons.includes(item.weaponType), `${id}:${owner}`);
    }
    assert.equal(canEquipUniverseItem(scene.context, actorId, id, 'armor', scene.id).ok, false);
    assert.equal(canEquipUniverseItem({ ...standard.context, editionEquipmentProfile: 'legendary' }, actorId, id, 'weapon', standard.id).ok, false);
    assert.equal(canEquipUniverseItem(scene.context, actorId, id, 'weapon', { id: scene.id, editionEquipmentProfile: 'legendary' }).ok, false);
  }
  const listed = listUniverseEquipment(scene.context, { actorId, scenarioId: scene.id });
  for (const id of ids) {
    const item = listed.find(item => item.id === id);
    assert.equal(item.compatible, true); assert.equal(item.reason, null); assert.equal(item.slotReasons.weapon, null);
  }
});

test('equipping each weapon is a pure prepared loadout change and its exact finite profile reaches a real Chronicle battle', () => {
  const original = fresh(), untouched = structuredClone(original), baseActor = buildChronicleActor(original, actorId);
  for (const id of ids) {
    const prepared = equip(original, id), item = getUniverseEquipment(id), actor = buildChronicleActor(prepared, actorId);
    assert.deepEqual(original, untouched); assert.deepEqual(prepared.loadouts[actorId], { ...emptyRow(), weapon: id });
    for (const key of ['hp', 'maxHp', 'shield', 'maxShield', 'attack', 'defense', 'powers']) assert.deepEqual(actor[key], baseActor[key]);
    const effects = getChronicleEquipmentEffects(prepared, actorId);
    for (const key of ['weaponType', 'weaponSystem', 'magazineCapacity', 'ammo', 'reserveAmmo']) {
      assert.equal(actor[key], item[key]); assert.equal(effects[key], item[key]);
    }
    const started = startChronicleBattle(prepared); assert.equal(started.ok, true);
    const combatant = started.battle.actors.find(actor => actor.id === actorId), target = started.battle.actors.find(actor => actor.team === 'enemy');
    combatant.atb = 100;
    assert.equal(performAction(started.battle, { actorId, actionId: 'shoot', targetId: target.id }).ok, true);
    assert.equal(combatant.ammo, item.ammo - 1); assert.equal(combatant.reserveAmmo, item.reserveAmmo); assert.equal(combatant.heat, 0);
    for (const key of ['owned', 'credits', 'unlockedPacks', 'inventory', 'canonicalAcquisition']) assert.equal(Object.hasOwn(prepared, key), false);
  }
});

test('five native reloads transfer stock and refuse an empty weapon without changing ATB or manufacturing reserves', () => {
  for (const id of ids) {
    const composed = buildChronicleActor(equip(fresh(), id), actorId);
    const battle = createBattle({ mode: 'active', seed: 17, rng: () => .5, medigel: 0,
      party: [{ ...composed, ammo: 0, reserveAmmo: 2, atb: 100 }],
      enemies: [{ id: 'target', name: 'Cible abstraite', hp: 5000, shield: 0, attack: 1, defense: 0, speed: .1, powers: [] }] });
    const actor = battle.actors[0], empty = JSON.stringify(battle);
    assert.equal(order(battle, 'shoot').ok, false); assert.equal(JSON.stringify(battle), empty);
    assert.equal(order(battle, 'reload').ok, true); assert.equal(actor.ammo, 2); assert.equal(actor.reserveAmmo, 0);
    ready(battle); assert.equal(order(battle, 'shoot').ok, true); ready(battle); assert.equal(order(battle, 'shoot').ok, true);
    ready(battle); const exhausted = JSON.stringify(battle);
    assert.equal(order(battle, 'reload').ok, false); assert.equal(order(battle, 'shoot').ok, false);
    assert.equal(JSON.stringify(battle), exhausted); assert.equal(actor.atb, 100); assert.equal(actor.heat, 0);
    assert.equal(getActions(battle, actorId).some(action => action.id === 'reload' && action.available), false);
  }
});

test('existing Shepard build training still rejects incompatible families and changing builds never grants a specialization', () => {
  const engineering = setChronicleBuild(fresh(), actorId, 'engineer'); assert.equal(engineering.ok, true);
  for (const id of ids) {
    const item = getUniverseEquipment(id), result = equipChronicle(engineering.session, actorId, id, 'weapon');
    assert.equal(result.ok, ['pistol', 'smg'].includes(item.weaponType), id);
    if (result.ok) assert.equal(result.session.builds[actorId], 'engineer');
  }
  const soldier = setChronicleBuild(fresh(), actorId, 'soldier'); assert.equal(soldier.ok, true);
  // Soldier ME2 has no SMG training; the Legendary flag must not add it.
  for (const id of ids) assert.equal(equipChronicle(soldier.session, actorId, id, 'weapon').ok,
    getUniverseEquipment(id).weaponType !== 'smg', id);
  const mattock = equip(soldier.session, 'ME2-WPN-MATTOCK'), switched = setChronicleBuild(mattock, actorId, 'engineer');
  assert.equal(switched.ok, true); assert.equal(switched.session.loadouts[actorId].weapon, null);
  assert.deepEqual(switched.clearedEquipment, ['ME2-WPN-MATTOCK']);
});

test('the unchanged save schema round-trips legitimate preparation and rejects edition or scene forgery atomically', () => {
  for (const id of ids) {
    const prepared = equip(fresh(), id), encoded = encodeChronicle(prepared);
    assert.deepEqual(decodeChronicle(encoded), prepared);
    assert.deepEqual(buildChronicleActor(decodeChronicle(encoded), actorId), buildChronicleActor(prepared, actorId));
    const forged = JSON.parse(encoded); forged.session.scenarioId = standard.id;
    assert.equal(decodeChronicle(forged), null);
    const standardSession = createChronicle(standard.context, standard.id), unchanged = structuredClone(standardSession);
    const forgedLoadouts = structuredClone(standardSession.loadouts); forgedLoadouts[actorId].weapon = id;
    assert.equal(normalizeChronicleLoadouts(forgedLoadouts, standardSession.context, standardSession.party, standard.id), null);
    assert.equal(equipChronicle(standardSession, actorId, id, 'weapon').ok, false); assert.deepEqual(standardSession, unchanged);
  }
});

test('Collector rifle and the three specialization-dependent ME2 guns remain closed in every preparation', () => {
  for (const id of ['ME2-WPN-COLLECTOR-RIFLE', 'ME2-WPN-REVENANT', 'ME2-WPN-CLAYMORE', 'ME2-WPN-WIDOW']) {
    const item = getUniverseEquipment(id); assert.equal(item.runtimeSupported, false);
    assert.equal(item.requiredEditionProfile, null); assert.equal(scene.allowedEquipmentIds.includes(id), false);
    for (const owner of scene.actorIds) assert.equal(canEquipUniverseItem(scene.context, owner, id, 'weapon', scene.id).ok, false);
    assert.equal(equipChronicle(fresh(), actorId, id, 'weapon').ok, false);
  }
});
