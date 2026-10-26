import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIONS, createBattle, getActions, performAction, tickBattle } from '../src/combat.js';
import { getUniverseWeaponProfile } from '../src/universe-weapon-profiles.js';
import { validateAmmoMode } from '../src/universe-ammo.js';

const charges = ['ME3-WPN-ARC', 'ME3-WPN-GRAAL', 'ME3-WPN-JAVELIN', 'MEA-WPN-VENOM'];
const beams = ['ME3-WPN-PARTICLE', 'MEA-WPN-EQUALIZER'];
const thermal = ['ME3-WPN-LANCER', 'MEA-WPN-SCATTERSHOT'];
const actor = (id = 'owner', changes = {}) => ({ id, name: id, hp: 500, maxHp: 500, shield: 0, maxShield: 0,
  attack: 40, defense: 0, speed: 1, atb: 100, focus: 100, powers: [], ...changes });
const target = (id = 'target', changes = {}) => actor(id, { hp: 10000, maxHp: 10000, speed: .1, atb: 0, attack: 1, ...changes });
const battleFor = (id, changes = {}, enemy = {}, others = [], foes = [], mode = 'active') => createBattle({ mode, rng: () => .5,
  party: [actor('owner', { weaponProfileId: id, ...changes }), ...others], enemies: [target('target', enemy), ...foes] });
const unit = (battle, id = 'owner') => battle.actors.find(actor => actor.id === id);
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} != ${expected}`);
const order = (battle, actionId = 'shoot', actorId = 'owner', targetId = 'target') => {
  const result = performAction(battle, { actorId, actionId,
    targetId: ['self', 'allies'].includes(ACTIONS[actionId].target) ? actorId : targetId });
  assert.equal(result.ok, true, result.reason); return result;
};

test('four charge profiles really prepare first and spend clips once at emission, with no phantom early damage', () => {
  for (const id of charges) {
    const profile = getUniverseWeaponProfile(id), battle = battleFor(id), initial = unit(battle).ammo;
    const metadata = getActions(battle, 'owner').find(action => action.id === 'shoot');
    assert.equal(metadata.chargeDuration, profile.chargeDuration); assert.equal(metadata.ammoCost, 1);
    order(battle);
    assert.equal(unit(battle).atb, 0); assert.equal(unit(battle).ammo, initial);
    assert.equal(unit(battle).channel.phase, 'charging'); assert.equal(unit(battle, 'target').hp, 10000);
    tickBattle(battle, profile.chargeDuration - .01);
    assert.equal(unit(battle).ammo, initial); assert.equal(unit(battle, 'target').hp, 10000);
    tickBattle(battle, .01);
    assert.equal(unit(battle).ammo, initial - 1); assert.equal(unit(battle).reserveAmmo, profile.reserveAmmo);
    assert.equal(unit(battle).heat, 0); assert.equal(unit(battle).channel, null);
    assert.equal(battle.events.filter(event => event.type === 'weaponChargeRelease').length, 1);
    if (profile.mode === 'charged-area') {
      assert.equal(unit(battle, 'target').hp, 10000); assert.equal(battle.projectiles.length, 1);
      near(battle.projectiles[0].remaining, profile.delay);
      tickBattle(battle, profile.delay);
    }
    near(unit(battle, 'target').hp, 10000 - 40 * profile.chargeDamageMultiplier);
    tickBattle(battle, .5);
    assert.equal(battle.events.filter(event => event.type === 'weaponChargeRelease').length, 1);
    assert.equal(unit(battle).ammo, initial - 1);
  }
});

test('Graal produces actual distinct spike hits and Javelin abstracts only light cover, without removing armor', () => {
  const graal = battleFor('ME3-WPN-GRAAL', {}, { defense: 5 }); order(graal); tickBattle(graal, 1);
  assert.equal(graal.events.filter(event => event.type === 'damage').length, 3);
  near(unit(graal, 'target').hp, 10000 - (40 * 1.5 - 3 * 5));
  for (const [id, expected] of [['ME3-WPN-JAVELIN', 55], ['ME3-WPN-ARC', 25]]) {
    const battle = battleFor(id, {}, { cover: true, defense: 5 }); order(battle); tickBattle(battle, 1);
    near(unit(battle, 'target').hp, 10000 - expected);
  }
});

test('canceling before release keeps clips but never refunds the spent turn or signature concentration', () => {
  for (const id of charges) {
    const battle = battleFor(id), initial = unit(battle).ammo;
    order(battle, 'signature'); assert.equal(unit(battle).focus, 0);
    tickBattle(battle, .4); const atb = unit(battle).atb;
    order(battle, 'cancelChannel'); assert.equal(unit(battle).atb, atb); assert.equal(unit(battle).channel, null);
    tickBattle(battle, 2);
    assert.equal(unit(battle).ammo, initial); assert.equal(unit(battle, 'target').hp, 10000);
    assert.equal(unit(battle).focus, 0); assert.equal(battle.projectiles, undefined);
    assert.equal(battle.events.some(event => event.type === 'weaponChargeRelease'), false);
  }
});

test('burst and signature charges spend their own finite budgets once, and an underfilled charge cannot start', () => {
  const burst = battleFor('ME3-WPN-ARC'); order(burst, 'burst'); tickBattle(burst, 1);
  assert.equal(unit(burst).ammo, 3); assert.equal(unit(burst).reserveAmmo, 24);
  near(unit(burst, 'target').hp, 10000 - 40 * 1.65 * 1.5);
  const signature = battleFor('ME3-WPN-JAVELIN'); order(signature, 'signature'); tickBattle(signature, 1);
  assert.equal(unit(signature).ammo, 0); assert.equal(unit(signature).reserveAmmo, 8);
  near(unit(signature, 'target').hp, 10000 - 40 * 2.4 * 1.5);
  const short = battleFor('ME3-WPN-JAVELIN'), snapshot = JSON.stringify(short);
  assert.equal(performAction(short, { actorId: 'owner', actionId: 'burst', targetId: 'target' }).ok, false);
  assert.equal(JSON.stringify(short), snapshot); assert.equal(unit(short).channel, null);
});

test('KO, Stasis, Sabotage and a target lost during preparation cancel the charge without a later release', () => {
  for (const actionId of ['stasis', 'sabotage']) {
    const battle = battleFor('ME3-WPN-ARC', {}, { atb: 100, powers: [actionId] });
    const initial = unit(battle).ammo; order(battle); order(battle, actionId, 'target', 'owner');
    assert.equal(unit(battle).channel, null); tickBattle(battle, 2);
    assert.equal(unit(battle).ammo, initial); assert.equal(unit(battle, 'target').hp, 10000);
  }
  const ko = battleFor('ME3-WPN-GRAAL', { hp: 1 }, { atb: 100, attack: 100 }, [actor('survivor', { atb: 0 })]);
  const ammo = unit(ko).ammo; order(ko); order(ko, 'shoot', 'target', 'owner'); tickBattle(ko, 2);
  assert.equal(unit(ko).hp, 0); assert.equal(unit(ko).ammo, ammo);
  assert.equal(ko.events.some(event => event.type === 'weaponChargeRelease'), false);
  const lost = battleFor('ME3-WPN-JAVELIN', {}, { hp: 1 }, [actor('helper')], [target('other')]);
  order(lost); order(lost, 'shoot', 'helper'); tickBattle(lost, 2);
  assert.equal(unit(lost).channel, null); assert.equal(unit(lost).ammo, 2);
  assert.equal(lost.events.some(event => event.type === 'weaponChargeRelease'), false);
});

test('Venom charges, launches, then resolves delayed area damage without aging its flight twice', () => {
  const battle = battleFor('MEA-WPN-VENOM', {}, {}, [], [target('secondary')]); order(battle);
  tickBattle(battle, 1.399);
  assert.equal(unit(battle, 'target').hp, 10000); assert.equal(unit(battle, 'secondary').hp, 10000);
  assert.equal(unit(battle).ammo, 3); assert.equal(battle.projectiles.length, 1);
  tickBattle(battle, .001);
  near(unit(battle, 'target').hp, 9940); near(unit(battle, 'secondary').hp, 9976);
  assert.equal(battle.events.filter(event => event.type === 'explosion').length, 1);
  const small = battleFor('MEA-WPN-VENOM', {}, {}, [], [target('secondary')]); order(small);
  for (let frame = 0; frame < 60; frame++) tickBattle(small, .03);
  assert.equal(unit(small).ammo, unit(battle).ammo);
  near(unit(small, 'target').hp, unit(battle, 'target').hp);
  near(unit(small, 'secondary').hp, unit(battle, 'secondary').hp);
});

test('a launched Venom projectile survives the shooter; a canceled preparation never creates one', () => {
  const battle = battleFor('MEA-WPN-VENOM', { hp: 1 }, { atb: 75, speed: 1, attack: 100 }, [actor('survivor', { atb: 0 })]);
  // The ordinary enemy AI becomes ready just after the one-second release.
  order(battle); tickBattle(battle, 1.1);
  assert.equal(unit(battle).hp, 0); assert.equal(battle.projectiles.length, 1);
  tickBattle(battle, .4); near(unit(battle, 'target').hp, 9940);
  assert.equal(unit(battle).ammo, 3);
});

test('new heat weapons have real pulses/impacts and no inherited ammo fields or reload action', () => {
  for (const id of [...beams, ...thermal]) {
    const profile = getUniverseWeaponProfile(id), battle = battleFor(id, { weaponSystem: 'thermal-clip', ammo: 90, magazineCapacity: 90, reserveAmmo: 90 });
    for (const key of ['ammo', 'reserveAmmo', 'magazineCapacity']) assert.equal(unit(battle)[key], undefined);
    assert.equal(getActions(battle, 'owner').some(action => action.id === 'reload'), false);
    order(battle);
    if (profile.mode === 'heat-beam') {
      assert.equal(unit(battle, 'target').hp, 10000); tickBattle(battle, .5);
      near(unit(battle, 'target').hp, 9980); near(unit(battle).heat, 14);
      order(battle, 'cancelChannel'); tickBattle(battle, 1);
      near(unit(battle, 'target').hp, 9980); near(unit(battle).heat, 5);
    } else {
      near(unit(battle, 'target').hp, 9960); assert.equal(unit(battle).heat, 24);
      assert.equal(battle.events.filter(event => event.type === 'damage').length, profile.burstCount);
      tickBattle(battle, 1); near(unit(battle).heat, 15);
    }
  }
});

test('new special models reject conventional ammo modes, and charge admission rejects missing clips atomically', () => {
  for (const id of [...charges, ...beams, ...thermal]) {
    const battle = battleFor(id, { mediaId: id.split('-')[0], powers: ['ammoIncendiary'] });
    const profileId = `${id.split('-')[0]}-POW-AMMO-INCENDIARY`;
    assert.equal(validateAmmoMode(unit(battle), profileId).ok, false);
    const snapshot = JSON.stringify(battle);
    assert.equal(performAction(battle, { actorId: 'owner', actionId: 'ammoIncendiary', targetId: 'owner' }).ok, false);
    assert.equal(JSON.stringify(battle), snapshot);
  }
  for (const id of charges) {
    const battle = battleFor(id, { ammo: 0 }), snapshot = JSON.stringify(battle);
    assert.equal(performAction(battle, { actorId: 'owner', actionId: 'shoot', targetId: 'target' }).ok, false);
    assert.equal(JSON.stringify(battle), snapshot);
  }
});

test('Wait and explicit pause freeze new charge, remaining clips and pending charged-projectile flight', () => {
  const battle = battleFor('MEA-WPN-VENOM', {}, {}, [actor('waiting')], [], 'wait'); order(battle);
  const frozen = JSON.stringify(battle); tickBattle(battle, 2); assert.equal(JSON.stringify(battle), frozen);
  order(battle, 'cover', 'waiting'); tickBattle(battle, 1);
  const paused = JSON.stringify(battle); tickBattle(battle, 1, { paused: true }); assert.equal(JSON.stringify(battle), paused);
  tickBattle(battle, .4); near(unit(battle, 'target').hp, 9940);
});

test('the ultralight modifier scales each cooldown once and never changes weapon, ammo-mode or grenade resources', () => {
  const battle = battleFor(null, { powerCooldownMultiplier: .9, powers: ['overload'] }); order(battle, 'overload');
  near(unit(battle).cooldowns.overload, 7.2); assert.equal(unit(battle).powerCooldownMultiplier, .9);
  const neutral = battleFor(null, { powers: ['overload'] }); order(neutral, 'overload'); assert.equal(unit(neutral).cooldowns.overload, 8);
  for (const [given, expected] of [[0, .5], [9, 1.5], [Infinity, 1]]) assert.equal(unit(battleFor(null, { powerCooldownMultiplier: given })).powerCooldownMultiplier, expected);
  for (const actionId of ['shoot', 'ammoIncendiary', 'fragGrenade']) {
    const build = multiplier => battleFor(null, { mediaId: 'ME3', weaponSystem: 'thermal-clip', magazineCapacity: 8, ammo: 8, reserveAmmo: 32,
      grenadeCapacity: 3, grenadeCharges: 3, powers: ['ammoIncendiary', 'fragGrenade'], powerCooldownMultiplier: multiplier });
    const modified = build(.9), normal = build(1); order(modified, actionId); order(normal, actionId);
    for (const key of ['ammo', 'reserveAmmo', 'grenadeCharges', 'heat', 'ammoModeId']) assert.equal(unit(modified)[key], unit(normal)[key]);
    assert.equal(unit(modified).cooldowns[actionId], undefined);
  }
});
