import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { UNIVERSE_EQUIPMENT, getUniverseEquipment, canEquipUniverseItem, listUniverseEquipment, normalizeChronicleLoadouts } from '../src/universe-equipment.js';
import { SCENARIOS, getUniverseActorProfile } from '../src/universe-actors.js';
import { UNIVERSE_WORKS, getUniverseRecord } from '../src/universe-data.js';
import { createChronicle, equipChronicle, buildChronicleActor, startChronicleBattle, encodeChronicle, decodeChronicle } from '../src/chronicles.js';
import { createBattle, getActions, performAction, tickBattle } from '../src/combat.js';

const ids = ['ME3-WPN-SUPPRESSOR', 'ME3-WPN-RAIDER'];
const before = JSON.parse(readFileSync(new URL('../docs/qa/me3-legendary-weapons-baseline.json', import.meta.url)));
const scene = SCENARIOS.find(s => s.id === 'me3-legendary-equipment-workshop');
const standard = SCENARIOS.find(s => s.id === 'me3-equipment-workshop');
const actorId = 'ME3-CHR-SHEPARD';
const fresh = () => createChronicle(scene.context, scene.id);
const omit = (object, keys) => Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key)));
const prepared = id => { const r = equipChronicle(fresh(), actorId, id, 'weapon'); assert.equal(r.ok, true, r.reason); return r.session; };
const order = (battle, actionId) => performAction(battle, { actorId, actionId, targetId: actionId === 'reload' ? actorId : 'target' });
const ready = battle => { for (let i = 0; i < 300 && battle.actors[0].atb < 100; i++) tickBattle(battle, .1); assert.equal(battle.actors[0].atb, 100); };

test('exactly two individually linked ME3 DLC profiles gain Legendary access while all 224 identities and existing budgets are preserved', () => {
  assert.equal(before.baselineCommit, '05d1f030dab0925d57d4ba8c5bdb9ccde8db1ad0');
  assert.equal(UNIVERSE_EQUIPMENT.length, 224);
  assert.deepEqual(UNIVERSE_EQUIPMENT.map(item => item.id), before.equipment.map(item => item.id));
  for (const old of before.equipment) {
    const current = getUniverseEquipment(old.id);
    if (!ids.includes(old.id)) { assert.deepEqual(current, old, old.id); continue; }
    assert.equal(old.runtimeSupported, false); assert.equal(old.requiredEditionProfile, null);
    assert.equal(current.runtimeSupported, true); assert.equal(current.requiredEditionProfile, 'legendary');
    assert.equal(current.requiresEdition, true); assert.match(current.lockReason, /Legendary Edition/);
    assert.deepEqual(omit(current, ['runtimeSupported', 'requiredEditionProfile', 'lockReason']), omit(old, ['runtimeSupported', 'requiredEditionProfile', 'lockReason']));
    const source = getUniverseRecord(old.id);
    assert.equal(current.name, source.name); assert.deepEqual(current.sourceIds, source.sourceIds);
    assert.deepEqual(current.availability, source.availability); assert.equal(current.fact, true);
    assert.deepEqual(current.requiredCapabilities, ['thermal-clip']); assert.equal(current.playable, false);
    assert.equal(current.statsBasis, 'ATB adaptation'); assert.equal(current.weaponProfileId, undefined);
  }
  assert.equal(UNIVERSE_EQUIPMENT.filter(i => i.runtimeSupported).length, 107);
  assert.equal(UNIVERSE_EQUIPMENT.filter(i => i.runtimeSupported && i.kind === 'weapon').length, 79);
});

test('all 25 scenarios retain their actors and enemies, and only the ME3 Legendary scene appends the two exact models', () => {
  assert.equal(SCENARIOS.length, 25);
  for (const old of before.scenarios) {
    const current = SCENARIOS.find(s => s.id === old.id);
    if (old.id !== scene.id) { assert.deepEqual(current, old, old.id); continue; }
    assert.deepEqual(omit(current, ['allowedEquipmentIds', 'additionalEquipmentIds', 'sourceEntryIds', 'sourceIds', 'description', 'preparedConditions']),
      omit(old, ['allowedEquipmentIds', 'additionalEquipmentIds', 'sourceEntryIds', 'sourceIds', 'description', 'preparedConditions']));
    for (const key of ['allowedEquipmentIds', 'additionalEquipmentIds', 'sourceEntryIds']) assert.deepEqual(current[key], [...old[key], ...ids]);
    assert.deepEqual(current.sourceIds.slice(0, old.sourceIds.length), old.sourceIds);
    assert.match(current.preparedConditions[0], /From Ashes, Leviathan, Citadel/);
    assert.deepEqual(current.preparedConditions.slice(1), old.preparedConditions.slice(1));
    assert.equal(current.description, old.description.replace('From Ashes, Citadel', 'From Ashes, Leviathan, Citadel'));
  }
  assert.equal(scene.allowedEquipmentIds.length, 45); assert.equal(standard.allowedEquipmentIds.length, 35);
});

test('the exact Legendary scene, work, period, wearer, family and slot must all agree, including read-only UI reasons', () => {
  const contexts = UNIVERSE_WORKS.flatMap(work => work.periods.map(period => ({ mediaId: work.id, periodId: period.id })));
  for (const id of ids) {
    assert.equal(canEquipUniverseItem(scene.context, actorId, id, 'weapon', scene.id).ok, true);
    for (const other of SCENARIOS.filter(s => s.id !== scene.id))
      assert.equal(canEquipUniverseItem(other.context, other.defaultParty[0], id, 'weapon', other.id).ok, false, `${id}:${other.id}`);
    for (const context of contexts.filter(c => c.mediaId !== 'ME3' || c.periodId !== 'me3'))
      assert.equal(canEquipUniverseItem(context, actorId, id, 'weapon', scene.id).ok, false);
    for (const owner of scene.actorIds) assert.equal(canEquipUniverseItem(scene.context, owner, id, 'weapon', scene.id).ok,
      getUniverseActorProfile(owner, scene.context).allowedWeapons.includes(getUniverseEquipment(id).weaponType), owner);
    for (const slot of ['armor', 'weaponMod', 'weaponMod2']) assert.equal(canEquipUniverseItem(scene.context, actorId, id, slot, scene.id).ok, false);
    assert.equal(canEquipUniverseItem({ ...standard.context, editionEquipmentProfile: 'legendary' }, actorId, id, 'weapon', standard.id).ok, false);
    assert.equal(canEquipUniverseItem(scene.context, actorId, id, 'weapon', { id: scene.id }).ok, false);
    const selected = listUniverseEquipment(scene.context, { actorId, scenarioId: scene.id }).find(item => item.id === id);
    assert.equal(selected.compatible, true); assert.equal(selected.reason, null); assert.equal(selected.slotReasons.weapon, null);
    const refused = listUniverseEquipment(standard.context, { actorId, scenarioId: standard.id }).find(item => item.id === id);
    assert.equal(refused.compatible, false); assert.match(refused.reason, /Legendary Edition/);
  }
});

test('both prepared items reach a genuine Chronicle battle without mutating the input session, granting powers or changing base statistics', () => {
  const original = fresh(), untouched = structuredClone(original), baseActor = buildChronicleActor(original, actorId);
  for (const id of ids) {
    const result = equipChronicle(original, actorId, id, 'weapon'); assert.equal(result.ok, true);
    assert.deepEqual(original, untouched);
    const actor = buildChronicleActor(result.session, actorId), item = getUniverseEquipment(id);
    for (const key of ['hp', 'maxHp', 'shield', 'maxShield', 'attack', 'defense', 'powers']) assert.deepEqual(actor[key], baseActor[key]);
    for (const key of ['weaponType', 'weaponSystem', 'magazineCapacity', 'ammo', 'reserveAmmo']) assert.equal(actor[key], item[key]);
    const started = startChronicleBattle(result.session); assert.equal(started.ok, true);
    const native = started.battle.actors.find(a => a.id === actorId), target = started.battle.actors.find(a => a.team === 'enemy');
    native.atb = 100; assert.equal(performAction(started.battle, { actorId, actionId: 'shoot', targetId: target.id }).ok, true);
    assert.equal(native.ammo, item.ammo - 1); assert.equal(native.reserveAmmo, item.reserveAmmo); assert.equal(native.heat, 0);
    for (const key of ['owned', 'inventory', 'credits', 'unlockedPacks', 'canonicalAcquisition']) assert.equal(Object.hasOwn(result.session, key), false);
  }
});

test('shots and reloads consume finite existing reserves and exhausted orders leave battle state unchanged', () => {
  for (const id of ids) {
    const actor = buildChronicleActor(prepared(id), actorId);
    const battle = createBattle({ party: [{ ...actor, ammo: 0, reserveAmmo: 2, atb: 100 }],
      enemies: [{ id: 'target', hp: 5000, attack: 1, defense: 0, speed: .1, powers: [] }], rng: () => .5, mode: 'active', medigel: 0 });
    const original = JSON.stringify(battle); assert.equal(order(battle, 'shoot').ok, false); assert.equal(JSON.stringify(battle), original);
    assert.equal(order(battle, 'reload').ok, true); assert.equal(battle.actors[0].ammo, 2); assert.equal(battle.actors[0].reserveAmmo, 0);
    ready(battle); assert.equal(order(battle, 'shoot').ok, true); ready(battle); assert.equal(order(battle, 'shoot').ok, true); ready(battle);
    const depleted = JSON.stringify(battle); assert.equal(order(battle, 'reload').ok, false); assert.equal(order(battle, 'shoot').ok, false);
    assert.equal(JSON.stringify(battle), depleted); assert.equal(battle.actors[0].heat, 0);
    assert.equal(getActions(battle, actorId).find(a => a.id === 'reload').available, false);
  }
});

test('the existing save schema round-trips exact preparation and atomically refuses Standard, foreign work and forged loadout imports', () => {
  for (const id of ids) {
    const session = prepared(id); assert.deepEqual(decodeChronicle(encodeChronicle(session)), session);
    assert.deepEqual(buildChronicleActor(decodeChronicle(encodeChronicle(session)), actorId), buildChronicleActor(session, actorId));
    for (const scenarioId of ['me3-equipment-workshop', 'me2-legendary-equipment-workshop']) {
      const forged = JSON.parse(encodeChronicle(session)); forged.session.scenarioId = scenarioId; assert.equal(decodeChronicle(forged), null);
    }
    const plain = createChronicle(standard.context, standard.id), untouched = structuredClone(plain);
    const forged = structuredClone(plain.loadouts); forged[actorId].weapon = id;
    assert.equal(normalizeChronicleLoadouts(forged, plain.context, plain.party, plain.scenarioId), null);
    assert.equal(equipChronicle(plain, actorId, id, 'weapon').ok, false); assert.deepEqual(plain, untouched);
  }
});

test('the two added pistol/shotgun models never inherit assault or SMG modification compatibility', () => {
  for (const id of ids) {
    const session = prepared(id), unchanged = structuredClone(session);
    for (const moduleId of ['ME3-EQP-BARREL', 'ME3-EQP-MAGAZINE', 'ME3-EQP-ULTRALIGHT'])
      for (const slot of ['weaponMod', 'weaponMod2']) assert.equal(equipChronicle(session, actorId, moduleId, slot).ok, false);
    assert.deepEqual(session, unchanged);
  }
});

test('seven other conventional extended-arsenal models and unrelated special weapons retain their original refusal', () => {
  for (const suffix of ['HARRIER', 'TYPHOON', 'VALKYRIE', 'PIRANHA', 'INDRA', 'VALIANT', 'HURRICANE', 'CHAKRAM', 'ADAS', 'ACOLYTE', 'REEGAR', 'VENOM', 'CAIN', 'HYDRA', 'BLACKSTAR']) {
    const id = `ME3-WPN-${suffix}`, current = getUniverseEquipment(id), old = before.equipment.find(i => i.id === id);
    assert.deepEqual(current, old, id); assert.equal(current.runtimeSupported, false); assert.equal(scene.allowedEquipmentIds.includes(id), false);
    assert.equal(equipChronicle(fresh(), actorId, id, 'weapon').ok, false);
  }
});
