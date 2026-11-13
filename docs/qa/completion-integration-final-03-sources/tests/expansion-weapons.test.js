import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EXPANSION_WEAPONS, getExpansionWeapon } from '../src/expansion-weapons.js';
import { UNIVERSE_WEAPON_PROFILES, getUniverseWeaponProfile } from '../src/universe-weapon-profiles.js';
import { createBattle, getActions, performAction, tickBattle } from '../src/combat.js';
import { canAccessContent } from '../src/continuity.js';

const native = EXPANSION_WEAPONS.filter(record => record.behaviorKind === 'existing-weapon-profile');
const contact = EXPANSION_WEAPONS.filter(record => record.behaviorKind === 'melee-family-prototype');
const blocked = EXPANSION_WEAPONS.filter(record => record.behaviorKind === 'inspection-only');
const unit = (battle, id = 'carrier') => battle.actors.find(actor => actor.id === id);
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} != ${expected}`);
function battleFor(record, extraTarget = false, carrierFixture = {}) {
  assert.ok(record.simulation, 'An inspection has no runnable actor definition');
  const target = id => ({ id, name: id, hp: 5000, shield: 0, attack: 1, defense: 0, speed: .1, powers: [] });
  return createBattle({ mode: 'active', rng: () => .5, medigel: 0,
    party: [{ ...record.simulation, ...carrierFixture, id: 'carrier', name: 'Porteur abstrait', mediaId: record.mediaId, atb: 100, focus: 100 }],
    enemies: [target('target'), ...(extraTarget ? [target('secondary')] : [])] });
}
function order(battle, actionId, targetId = 'target') {
  const result = performAction(battle, { actorId: 'carrier', actionId, targetId });
  assert.equal(result.ok, true, result.reason); return result;
}
const frozenTree = value => {
  if (value && typeof value === 'object') {
    assert.equal(Object.isFrozen(value), true);
    Object.values(value).forEach(frozenTree);
  }
};

test('forty immutable independent dossiers distinguish 14 reused profiles, eight contact trials and 18 closed inspections', () => {
  assert.equal(EXPANSION_WEAPONS.length, 40);
  assert.equal(new Set(EXPANSION_WEAPONS.map(record => record.recordId)).size, 40);
  assert.equal(native.length, 14); assert.equal(contact.length, 8); assert.equal(blocked.length, 18);
  frozenTree(EXPANSION_WEAPONS);
  for (const record of EXPANSION_WEAPONS) {
    assert.equal(record.mode, 'weapon'); assert.ok(record.role && record.notes.length && record.limitations.length);
    assert.equal(record.statsBasis, 'ATB adaptation'); assert.equal(record.primarySourceVerified, false);
    assert.match(record.notes.join(' '), /aucune fidélité.*1:1 certifiée/);
    assert.match(record.notes.join(' '), /Aucun objet.*campagne/);
    assert.ok(Object.hasOwn(record.constraints, 'editionProfile'));
    if (record.simulation) {
      for (const field of ['hp', 'shield', 'attack', 'defense', 'speed']) assert.ok(Number.isFinite(record.simulation[field]));
      assert.deepEqual(record.simulation.powers, []);
    }
  }
  assert.throws(() => { contact[0].simulation.powers.push('cryoBlast'); }, TypeError);
  assert.throws(() => { blocked[0].simulation = native[0].simulation; }, TypeError);
});

test('all identities, factual descriptions, conditions and source IDs match established records in their own work', async () => {
  const works = Object.fromEntries(await Promise.all(['ME2', 'ME3', 'MEA'].map(async mediaId => [mediaId,
    JSON.parse(await readFile(new URL(`../docs/universe/catalogs/${mediaId}.json`, import.meta.url), 'utf8'))])));
  for (const card of EXPANSION_WEAPONS) {
    const work = works[card.mediaId], record = work.entries.find(entry => entry.id === card.recordId);
    assert.ok(record, card.recordId); assert.equal(record.category, 'weapons'); assert.equal(record.nature, 'Établi');
    assert.equal(card.name, record.name); assert.equal(card.identityFact, record.description);
    assert.equal(card.conditions, record.conditions || ''); assert.deepEqual(card.sourceIds, record.sourceIds);
    assert.ok(card.sourceIds.length > 0 && card.sourceIds.every(id => work.sources.some(source => source.id === id)));
    assert.equal(card.periodId, card.mediaId.toLowerCase());
  }
});

test('closed heavy, uncertain-charge and edition dossiers have no generic actor or borrowed homonym mechanics', () => {
  for (const card of blocked) {
    assert.equal(card.simulation, null); assert.ok(card.blockedReason.length > 30);
    assert.equal(Object.hasOwn(card, 'weaponProfileId'), false);
  }
  for (const id of ['ME2-WPN-PARTICLE', 'ME2-WPN-ARC', 'ME3-WPN-REEGAR', 'ME3-WPN-VENOM', 'MEA-WPN-LANAT']) {
    const card = getExpansionWeapon(id); assert.equal(card.simulation, null); assert.ok(card.blockedReason);
  }
  for (const id of ['ME3-WPN-HYDRA', 'ME3-WPN-BLACKSTAR']) assert.match(getExpansionWeapon(id).blockedReason, /local|mission/);
  for (const id of ['MEA-WPN-PIONEER', 'MEA-WPN-DEEP-IMPACT']) {
    assert.match(getExpansionWeapon(id).blockedReason, /aucun accès déduit de Deluxe/);
    assert.equal(getExpansionWeapon(id).constraints.editionProfile, null);
  }
});

test('every inspection and trial retains its factual work and period boundary', () => {
  for (const card of EXPANSION_WEAPONS) {
    assert.equal(canAccessContent(card.recordId, { mediaId: card.mediaId, periodId: card.periodId }).ok, true, card.recordId);
    assert.equal(canAccessContent(card.recordId, { mediaId: 'ME1', periodId: 'me1' }).ok, false, card.recordId);
    const foreign = card.mediaId === 'MEA' ? { mediaId: 'ME3', periodId: 'me3' } : { mediaId: 'MEA', periodId: 'mea' };
    assert.equal(canAccessContent(card.recordId, foreign).ok, false, card.recordId);
  }
});

test('special native profiles preserve their exact resource systems and explicit DLC preparation constraint', () => {
  assert.deepEqual(native.map(card => card.recordId).sort(), UNIVERSE_WEAPON_PROFILES.map(profile => profile.id).sort());
  for (const card of native) {
    const profile = getUniverseWeaponProfile(card.recordId), stats = card.simulation;
    assert.equal(stats.weaponProfileId, card.recordId); assert.equal(stats.weaponType, profile.weaponType);
    assert.equal(stats.weaponSystem, profile.weaponSystem); assert.equal(card.blockedReason, null);
    assert.equal(card.constraints.editionProfile, ['ME3-WPN-PARTICLE', 'ME3-WPN-LANCER'].includes(card.recordId) ? 'legendary' : null);
    for (const key of ['magazineCapacity', 'ammo', 'reserveAmmo']) {
      if (profile.weaponSystem === 'heat') assert.equal(Object.hasOwn(stats, key), false);
      else assert.equal(stats[key], profile[key]);
    }
    assert.match(card.limitations.join(' '), /profil existant/);
  }
  assert.match(getExpansionWeapon('ME3-WPN-LANCER').limitations.join(' '), /ME3-SRC-SUPPRESSOR.*autre modèle/);
});

test('all eight MEA melee trials execute only the native contact primitive without firearm resources or extra powers', () => {
  assert.deepEqual(contact.map(card => card.recordId).sort(), [
    'MEA-WPN-OMNIBLADE', 'MEA-WPN-ASARI-SWORD', 'MEA-WPN-KROGAN-HAMMER', 'MEA-WPN-FIRAAN',
    'MEA-WPN-CARFALON', 'MEA-WPN-VAKARSH', 'MEA-WPN-CRYO-GAUNTLET', 'MEA-WPN-BIOTIC-AMP',
  ].sort());
  for (const card of contact) {
    const battle = battleFor(card, false, { hp: 180, maxHp: 300 }), carrier = unit(battle);
    assert.equal(card.simulation.weaponSystem, 'melee'); assert.equal(carrier.primaryAction, 'strike');
    assert.deepEqual(getActions(battle, 'carrier').filter(action => action.available).map(action => action.id).sort(), ['cover', 'reposition', 'strike']);
    order(battle, 'strike'); assert.ok(unit(battle, 'target').hp < 5000);
    assert.equal(carrier.hp, 180, 'Contact trials do not grant a model-specific heal, including Carfalon');
    assert.equal(carrier.heat, 0); assert.equal(carrier.ammo, undefined); assert.equal(carrier.reserveAmmo, undefined);
    assert.equal(carrier.magazineCapacity, undefined); assert.deepEqual(carrier.powers, []);
    assert.deepEqual(unit(battle, 'target').statuses, {});
    assert.match(card.limitations.join(' '), /huit modèles partagent cette même primitive/);
  }
  assert.match(getExpansionWeapon('MEA-WPN-CARFALON').limitations.join(' '), /aucun soin/);
  assert.match(getExpansionWeapon('MEA-WPN-CRYO-GAUNTLET').limitations.join(' '), /aucun gel/);
  assert.match(getExpansionWeapon('MEA-WPN-BIOTIC-AMP').limitations.join(' '), /aucun pouvoir biotique/);
});

test('three beam dossiers really channel four pulses with heat and have no ammo or reload action', () => {
  for (const card of native.filter(card => getUniverseWeaponProfile(card.recordId).mode === 'heat-beam')) {
    const profile = getUniverseWeaponProfile(card.recordId), battle = battleFor(card);
    assert.equal(getActions(battle, 'carrier').some(action => action.id === 'reload'), false);
    order(battle, 'shoot'); assert.equal(unit(battle, 'target').hp, 5000);
    assert.ok(unit(battle).channel); tickBattle(battle, profile.duration);
    assert.equal(battle.events.filter(event => event.type === 'channelPulse').length, 4);
    near(unit(battle).heat, profile.duration * profile.heatPerSecond);
    assert.equal(unit(battle).ammo, undefined); assert.equal(unit(battle).channel, null);
    assert.ok(unit(battle, 'target').hp < 5000);
  }
});

test('three heat-burst dossiers retain real multiple impacts and finite heat followed by native cooling', () => {
  for (const card of native.filter(card => getUniverseWeaponProfile(card.recordId).mode === 'heat-burst')) {
    const profile = getUniverseWeaponProfile(card.recordId), battle = battleFor(card);
    order(battle, 'shoot');
    assert.equal(battle.events.filter(event => event.type === 'damage').length, profile.burstCount);
    near(unit(battle).heat, profile.heatCost); assert.equal(unit(battle).ammo, undefined);
    tickBattle(battle, 1); near(unit(battle).heat, profile.heatCost - 9);
  }
});

test('three explosive dossiers spend one clip and produce no damage before their real delayed area impact', () => {
  for (const card of native.filter(card => getUniverseWeaponProfile(card.recordId).mode === 'delayed-area')) {
    const profile = getUniverseWeaponProfile(card.recordId), battle = battleFor(card, true);
    order(battle, 'shoot'); assert.equal(unit(battle).ammo, profile.ammo - 1);
    assert.equal(unit(battle, 'target').hp, 5000); assert.equal(unit(battle, 'secondary').hp, 5000);
    tickBattle(battle, profile.delay - .01); assert.equal(unit(battle, 'target').hp, 5000);
    tickBattle(battle, .02);
    assert.ok(unit(battle, 'target').hp < 5000); assert.ok(unit(battle, 'secondary').hp < 5000);
    assert.equal(battle.events.filter(event => event.type === 'explosion').length, 1);
    assert.equal(battle.events.filter(event => event.type === 'damage').length, 2);
    assert.equal(unit(battle).heat, 0);
  }
});

test('four charge dossiers cancel without clips or damage, and charge-then-flight emits one clip only at release', () => {
  for (const card of native.filter(card => getUniverseWeaponProfile(card.recordId).mode.startsWith('charged-'))) {
    const profile = getUniverseWeaponProfile(card.recordId), canceled = battleFor(card);
    order(canceled, 'shoot'); tickBattle(canceled, profile.chargeDuration / 2);
    order(canceled, 'cancelChannel', 'carrier'); tickBattle(canceled, 2);
    assert.equal(unit(canceled).ammo, profile.ammo); assert.equal(unit(canceled, 'target').hp, 5000);
    assert.equal(canceled.projectiles?.length || 0, 0);
    const fired = battleFor(card, true); order(fired, 'shoot');
    tickBattle(fired, profile.chargeDuration - .01);
    assert.equal(unit(fired).ammo, profile.ammo); assert.equal(unit(fired, 'target').hp, 5000);
    tickBattle(fired, .01); assert.equal(unit(fired).ammo, profile.ammo - 1);
    assert.equal(fired.events.filter(event => event.type === 'weaponChargeRelease').length, 1);
    if (profile.mode === 'charged-area') {
      assert.equal(unit(fired, 'target').hp, 5000); assert.equal(fired.projectiles.length, 1);
      tickBattle(fired, profile.delay); assert.ok(unit(fired, 'secondary').hp < 5000);
    }
    assert.ok(unit(fired, 'target').hp < 5000); assert.equal(unit(fired).heat, 0);
  }
});

test('Reegar clip-channel consumes real pulse ammunition and cancellation preserves only the already-spent resource', () => {
  const card = getExpansionWeapon('MEA-WPN-REEGAR'), profile = getUniverseWeaponProfile(card.recordId);
  const battle = battleFor(card); order(battle, 'shoot');
  tickBattle(battle, profile.tickInterval); assert.equal(unit(battle).ammo, profile.ammo - profile.ammoPerTick);
  const hp = unit(battle, 'target').hp; assert.ok(hp < 5000);
  order(battle, 'cancelChannel', 'carrier'); tickBattle(battle, 2);
  assert.equal(unit(battle).ammo, profile.ammo - profile.ammoPerTick); assert.equal(unit(battle, 'target').hp, hp);
  assert.equal(unit(battle).reserveAmmo, profile.reserveAmmo); assert.equal(unit(battle).heat, 0);
});

test('lookup rejects unknown identities and forged objects without invoking getters or coercion', () => {
  let invoked = false;
  const forged = { get recordId() { invoked = true; return native[0].recordId; }, toString() { invoked = true; throw Error('coercion'); } };
  for (const value of [null, undefined, 0, [], forged, '__proto__', 'constructor', 'INF-WPN-PARTICLE', 'GAL-WPN-AVENGER']) {
    assert.equal(getExpansionWeapon(value), null);
  }
  assert.equal(invoked, false);
});
