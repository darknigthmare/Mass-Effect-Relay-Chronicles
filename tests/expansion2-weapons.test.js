import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EXPANSION2_WEAPONS, getExpansion2Weapon } from '../src/expansion2-weapons.js';
import { EXPANSION_WEAPONS } from '../src/expansion-weapons.js';
import { EXPANSION_CHARACTERS } from '../src/expansion-characters.js';
import { EXPANSION_ARMOR } from '../src/expansion-armor.js';
import { EXPANSION_FLEET } from '../src/expansion-fleet.js';
import { EXPANSION_ENEMIES } from '../src/expansion-enemies.js';
import { getUniverseEquipment } from '../src/universe-equipment.js';
import { canAccessContent } from '../src/continuity.js';
import { createBattle, getActions, performAction, tickBattle } from '../src/combat.js';

const oldIds = new Set([...EXPANSION_WEAPONS, ...EXPANSION_CHARACTERS, ...EXPANSION_ARMOR,
  ...EXPANSION_FLEET, ...EXPANSION_ENEMIES].map(record => record.recordId));
const resourceFields = ['weaponType', 'weaponSystem', 'magazineCapacity', 'ammo', 'reserveAmmo'];
const unit = (battle, id = 'carrier') => battle.actors.find(actor => actor.id === id);
const recursivelyFrozen = object => {
  if (object && typeof object === 'object') {
    assert.equal(Object.isFrozen(object), true); Object.values(object).forEach(recursivelyFrozen);
  }
};
function battleFor(card, fixture = {}) {
  return createBattle({ mode: 'active', seed: 1, rng: () => .5, medigel: 0,
    party: [{ ...card.simulation, ...fixture, id: 'carrier', name: 'Porteur abstrait', mediaId: card.mediaId, atb: 100 }],
    enemies: [{ id: 'target', name: 'Cible abstraite', hp: 5000, shield: 0, attack: 1, defense: 0, speed: .1, powers: [] }] });
}
function order(battle, actionId) {
  const action = getActions(battle, 'carrier').find(action => action.id === actionId);
  const result = performAction(battle, { actorId: 'carrier', actionId, targetId: action?.target === 'self' ? 'carrier' : 'target' });
  assert.equal(result.ok, true, result.reason); return result;
}
function waitReady(battle, actionId) {
  for (let i = 0; i < 300 && !getActions(battle, 'carrier').some(action => action.id === actionId && action.available); i++) tickBattle(battle, .1);
  assert.equal(getActions(battle, 'carrier').some(action => action.id === actionId && action.available), true, actionId);
}

test('forty recursively immutable weapon dossiers are all distinct from the entire first two-hundred selection', () => {
  assert.equal(EXPANSION2_WEAPONS.length, 40); assert.equal(oldIds.size, 200);
  assert.equal(new Set(EXPANSION2_WEAPONS.map(card => card.recordId)).size, 40);
  recursivelyFrozen(EXPANSION2_WEAPONS);
  for (const card of EXPANSION2_WEAPONS) {
    assert.equal(oldIds.has(card.recordId), false, card.recordId); assert.equal(card.mode, 'weapon');
    assert.equal(card.behaviorKind, 'existing-conventional-equipment'); assert.equal(card.blockedReason, null);
    assert.deepEqual(card.constraints, { editionProfile: null });
    assert.ok(card.notes.length > 0 && card.limitations.length > 0);
    assert.match(card.notes.join(' '), /aucune fidélité.*1:1 certifiée/);
    assert.match(card.notes.join(' '), /Aucun objet.*campagne/);
    assert.match(card.limitations.join(' '), /ne constitue pas une nouvelle mécanique/);
  }
  assert.throws(() => { EXPANSION2_WEAPONS[0].simulation.ammo = 100; }, TypeError);
  assert.throws(() => { EXPANSION2_WEAPONS[0].sourceIds.push('new-source'); }, TypeError);
});

test('all forty use exact supported conventional equipment IDs rather than a name, a special profile or an edition bypass', () => {
  for (const card of EXPANSION2_WEAPONS) {
    const item = getUniverseEquipment(card.recordId);
    assert.ok(item); assert.equal(item.fact, true); assert.equal(item.category, 'weapons'); assert.equal(item.kind, 'weapon');
    assert.equal(item.runtimeSupported, true); assert.equal(item.requiresEdition, false);
    assert.equal(card.simulation.equipmentProfileId, item.id);
    assert.deepEqual(item.requiredCapabilities, ['thermal-clip']);
    for (const field of resourceFields) assert.equal(card.simulation[field], item[field], `${card.recordId}: ${field}`);
    assert.equal(card.simulation.weaponSystem, 'thermal-clip');
    assert.equal(Object.hasOwn(card.simulation, 'weaponProfileId'), false);
    assert.equal(Object.hasOwn(card.simulation, 'primaryAction'), false);
    assert.deepEqual(card.simulation.powers, []);
    assert.equal(card.primarySourceVerified, false); assert.equal(card.statsBasis, 'ATB adaptation');
  }
});

test('names, factual descriptions, source IDs and conditions are preserved from each work catalogue', async () => {
  const works = Object.fromEntries(await Promise.all(['ME2', 'ME3', 'MEA'].map(async mediaId => [mediaId,
    JSON.parse(await readFile(new URL(`../docs/universe/catalogs/${mediaId}.json`, import.meta.url), 'utf8'))])));
  for (const card of EXPANSION2_WEAPONS) {
    const work = works[card.mediaId], source = work.entries.find(record => record.id === card.recordId);
    assert.ok(source, card.recordId); assert.equal(source.nature, 'Établi'); assert.equal(source.category, 'weapons');
    assert.equal(card.name, source.name); assert.equal(card.identityFact, source.description);
    assert.equal(card.conditions, source.conditions || ''); assert.deepEqual(card.sourceIds, source.sourceIds);
    assert.ok(card.sourceIds.length > 0 && card.sourceIds.every(id => work.sources.some(source => source.id === id)));
    assert.equal(card.periodId, card.mediaId.toLowerCase());
  }
});

test('each dossier retains factual context and rejects ME1 and foreign-work contexts', () => {
  for (const card of EXPANSION2_WEAPONS) {
    assert.equal(canAccessContent(card.recordId, { mediaId: card.mediaId, periodId: card.periodId }).ok, true, card.recordId);
    assert.equal(canAccessContent(card.recordId, { mediaId: 'ME1', periodId: 'me1' }).ok, false, card.recordId);
    const foreign = card.mediaId === 'MEA' ? { mediaId: 'ME2', periodId: 'me2' } : { mediaId: 'MEA', periodId: 'mea' };
    assert.equal(canAccessContent(card.recordId, foreign).ok, false, card.recordId);
  }
});

test('each of the forty real native shoots spends exactly one clip round, damages the target and generates no heat', () => {
  for (const card of EXPANSION2_WEAPONS) {
    const before = JSON.stringify(card), battle = battleFor(card), carrier = unit(battle);
    assert.equal(carrier.weaponSystem, 'thermal-clip'); assert.equal(carrier.weaponType, card.simulation.weaponType);
    order(battle, 'shoot');
    assert.equal(carrier.ammo, card.simulation.ammo - 1, card.recordId);
    assert.equal(carrier.reserveAmmo, card.simulation.reserveAmmo); assert.equal(carrier.heat, 0);
    assert.ok(unit(battle, 'target').hp < 5000); assert.equal(battle.projectiles?.length || 0, 0);
    assert.equal(carrier.channel, null); assert.deepEqual(carrier.powers, []);
    assert.equal(JSON.stringify(card), before, 'A native battle must not modify the dossier');
  }
});

test('each model reloads through a naturally ready native order and transfers exactly the missing round from reserve', () => {
  for (const card of EXPANSION2_WEAPONS) {
    const battle = battleFor(card); order(battle, 'shoot'); waitReady(battle, 'reload'); order(battle, 'reload');
    assert.equal(unit(battle).ammo, card.simulation.magazineCapacity, card.recordId);
    assert.equal(unit(battle).reserveAmmo, card.simulation.reserveAmmo - 1);
    assert.equal(unit(battle).heat, 0);
  }
});

test('an empty starting clip atomically refuses shoot for every model without spending focus, ATB or reserve', () => {
  for (const card of EXPANSION2_WEAPONS) {
    const battle = battleFor(card, { ammo: 0 }), before = JSON.stringify(battle);
    const result = performAction(battle, { actorId: 'carrier', actionId: 'shoot', targetId: 'target' });
    assert.equal(result.ok, false, card.recordId); assert.equal(JSON.stringify(battle), before);
    assert.equal(getActions(battle, 'carrier').some(action => action.id === 'reload' && action.available), true);
  }
});

test('the five represented families preserve finite partially depleted reserves instead of manufacturing a full reload', () => {
  const witnesses = [...new Set(EXPANSION2_WEAPONS.map(card => card.simulation.weaponType))]
    .map(type => EXPANSION2_WEAPONS.find(card => card.simulation.weaponType === type));
  assert.equal(witnesses.length, 5);
  for (const card of witnesses) {
    const battle = battleFor(card, { ammo: 1, reserveAmmo: 2 }); order(battle, 'shoot');
    assert.equal(unit(battle).ammo, 0); waitReady(battle, 'reload'); order(battle, 'reload');
    assert.equal(unit(battle).ammo, 2); assert.equal(unit(battle).reserveAmmo, 0);
    assert.equal(unit(battle).magazineCapacity, card.simulation.magazineCapacity); assert.equal(unit(battle).heat, 0);
  }
});

test('class-specialization, unconfigured DLC, local heavy, heat and unknown-model records remain outside the selection', () => {
  for (const id of ['ME2-WPN-REVENANT', 'ME2-WPN-CLAYMORE', 'ME2-WPN-WIDOW', 'ME2-WPN-PHALANX', 'ME2-WPN-LOCUST',
    'ME2-WPN-MATTOCK', 'ME2-WPN-GETH-RIFLE', 'ME3-WPN-HARRIER', 'ME3-WPN-SUPPRESSOR', 'ME3-WPN-HURRICANE',
    'ME3-WPN-CAIN', 'ME3-WPN-HYDRA', 'MEA-WPN-LANAT', 'MEA-WPN-PIONEER', 'INF-WPN-MATTOCK', 'GAL-WPN-AVENGER',
    'MEA-WPN-PAW', 'MEA-WPN-SWEEPER', 'ME3-WPN-PARTICLE', 'ME3-WPN-JAVELIN']) assert.equal(getExpansion2Weapon(id), null, id);
  assert.match(getExpansion2Weapon('ME2-WPN-VINDICATOR').limitations.join(' '), /rafales.*ne sont pas reproduits/);
  assert.match(getExpansion2Weapon('ME3-WPN-BLACK-WIDOW').limitations.join(' '), /pénétration.*ne sont pas reproduits/i);
});

test('identity lookup rejects unknown or forged values without evaluating client getters', () => {
  let invoked = false;
  const forged = { get id() { invoked = true; return 'ME3-WPN-AVENGER'; }, toString() { invoked = true; throw Error('coercion'); } };
  for (const value of [null, undefined, 0, [], forged, '__proto__', 'constructor', 'Avenger', 'me3-wpn-avenger']) assert.equal(getExpansion2Weapon(value), null);
  assert.equal(invoked, false);
});
