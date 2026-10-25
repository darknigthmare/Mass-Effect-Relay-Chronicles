import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIONS, createBattle, getActions, performAction, tickBattle } from '../src/combat.js';
import { getUniverseWeaponProfile } from '../src/universe-weapon-profiles.js';

const source = (changes = {}) => ({ id: 'source', name: 'Source', hp: 500, maxHp: 500, shield: 0, maxShield: 100,
  attack: 40, defense: 0, speed: .1, atb: 100, focus: 100, grenadeCapacity: 3, grenadeCharges: 3,
  powers: ['fragGrenade', 'stickyGrenade', 'shieldBoost', 'stasis'], ...changes });
const foe = (changes = {}) => ({ id: 'target', name: 'Cible', hp: 10000, maxHp: 10000, shield: 0, maxShield: 0,
  attack: 40, defense: 0, speed: .1, powers: [], ...changes });
const build = (id, changes = {}, target = {}, extraParty = [], extraEnemies = [], mode = 'active') => createBattle({
  mode, rng: () => .5, party: [source({ ...(id ? { weaponProfileId: id } : {}), ...changes }), ...extraParty], enemies: [foe(target), ...extraEnemies] });
const unit = (battle, id = 'source') => battle.actors.find(actor => actor.id === id);
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} should equal ${expected}`);
function order(battle, actionId, targetId = 'target', actorId = 'source') {
  const result = performAction(battle, { actorId, actionId, targetId: ['self', 'allies'].includes(ACTIONS[actionId].target) ? actorId : targetId });
  assert.equal(result.ok, true, result.reason); return result;
}
const readyOrder = (battle, actionId, targetId, actorId = 'source') => { unit(battle, actorId).atb = 100; return order(battle, actionId, targetId, actorId); };

test('all three explosive weapon profiles consume clips immediately and explode later on the target group', () => {
  for (const id of ['ME3-WPN-FALCON', 'ME3-WPN-SCORPION', 'MEA-WPN-SCORPION']) {
    const profile = getUniverseWeaponProfile(id), battle = build(id, {}, {}, [], [foe({ id: 'secondary' })]);
    const ammo = unit(battle).ammo;
    order(battle, 'shoot');
    assert.equal(unit(battle).ammo, ammo - 1); assert.equal(unit(battle).heat, 0);
    assert.equal(unit(battle, 'target').hp, 10000); assert.equal(unit(battle, 'secondary').hp, 10000);
    assert.equal(battle.projectiles.length, 1); close(battle.projectiles[0].remaining, profile.delay);
    tickBattle(battle, profile.delay - .05); assert.equal(unit(battle, 'target').hp, 10000);
    tickBattle(battle, .06); close(unit(battle, 'target').hp, 9960); close(unit(battle, 'secondary').hp, 9984);
    assert.equal(battle.projectiles.length, 0);
    assert.equal(battle.events.filter(event => event.type === 'explosion').length, 1);
    assert.equal(battle.events.filter(event => event.type === 'damage').length, 2);
  }
});

test('delayed heavy orders preserve their ammunition costs, damage modifiers and focus expenditure', () => {
  const burst = build('ME3-WPN-FALCON', { weaponDamageMultiplier: 1.5 }); order(burst, 'burst');
  assert.equal(unit(burst).ammo, 3); tickBattle(burst, .8); close(unit(burst, 'target').hp, 10000 - 40 * 1.5 * 1.65);
  const signature = build('MEA-WPN-SCORPION'); order(signature, 'signature');
  assert.equal(unit(signature).ammo, 2); assert.equal(unit(signature).focus, 0);
  tickBattle(signature, 1.2); close(unit(signature, 'target').hp, 9904);
});

test('grenade samples are per actor, finite, and use no cooldown or gun ammunition', () => {
  const battle = build(null, { weaponSystem: 'thermal-clip', ammo: 8, magazineCapacity: 8, reserveAmmo: 20 }, {}, [source({ id: 'ally', atb: 0 })], [foe({ id: 'secondary' })]);
  for (let i = 0; i < 3; i++) readyOrder(battle, 'fragGrenade');
  close(unit(battle, 'target').hp, 10000 - 3 * 48); close(unit(battle, 'secondary').hp, 10000 - 3 * 24);
  assert.equal(unit(battle).grenadeCharges, 0); assert.equal(unit(battle, 'ally').grenadeCharges, 3);
  assert.equal(unit(battle).ammo, 8); assert.equal(unit(battle).reserveAmmo, 20);
  assert.equal(unit(battle).cooldowns.fragGrenade, undefined); assert.equal(ACTIONS.fragGrenade.cooldown, undefined);
  assert.equal(ACTIONS.stickyGrenade.cooldown, undefined);
  unit(battle).atb = 100; const before = JSON.stringify(battle);
  assert.equal(performAction(battle, { actorId: 'source', actionId: 'stickyGrenade', targetId: 'target' }).ok, false);
  assert.equal(JSON.stringify(battle), before);
  const invalid = build(), snapshot = JSON.stringify(invalid);
  assert.equal(performAction(invalid, { actorId: 'source', actionId: 'fragGrenade', targetId: 'missing' }).ok, false);
  assert.equal(JSON.stringify(invalid), snapshot);
  const bounded = build(null, { grenadeCapacity: 999, grenadeCharges: 999 });
  assert.equal(unit(bounded).grenadeCapacity, 12); assert.equal(unit(bounded).grenadeCharges, 12);
});

test('a sticky charge survives both its shooter and its initial target while the battle continues', () => {
  const battle = build(null, { hp: 1 }, { hp: 1, maxHp: 1 }, [source({ id: 'ally' })], [foe({ id: 'secondary' })]);
  order(battle, 'stickyGrenade');
  readyOrder(battle, 'shoot', 'target', 'ally'); assert.equal(unit(battle, 'target').hp, 0);
  readyOrder(battle, 'shoot', 'source', 'secondary'); assert.equal(unit(battle).hp, 0);
  assert.equal(battle.winner, null); tickBattle(battle, 1.2);
  close(unit(battle, 'secondary').hp, 10000 - 58 * .4);
  assert.equal(unit(battle).hp, 0); assert.equal(battle.projectiles.length, 0);
});

test('pending autonomous explosives settle before an outcome and never revive an eliminated party', () => {
  const battle = build(null, { hp: 1 }, { hp: 50, maxHp: 50 });
  order(battle, 'stickyGrenade'); readyOrder(battle, 'shoot', 'source', 'target');
  assert.equal(unit(battle).hp, 0); assert.equal(battle.winner, null);
  tickBattle(battle, 1.2);
  assert.equal(unit(battle, 'target').hp, 0); assert.equal(battle.winner, 'enemy');
  const ended = JSON.stringify(battle); tickBattle(battle, 20); assert.equal(JSON.stringify(battle), ended);
});

test('a hostile projectile can land after its shooter falls, without a pointless final Wait decision', () => {
  const battle = build(null, { maxShield: 0 }, { hp: 1, maxHp: 1, weaponProfileId: 'ME3-WPN-SCORPION' }, [], [], 'wait');
  readyOrder(battle, 'shoot', 'source', 'target'); order(battle, 'shoot');
  assert.equal(unit(battle, 'target').hp, 0); assert.equal(battle.winner, null);
  unit(battle).atb = 100;
  tickBattle(battle, 1.2);
  close(unit(battle).hp, 426); assert.equal(battle.winner, 'party'); assert.equal(battle.waiting, false);
});

test('explosions respect Stasis independently for every target without refunding their resources', () => {
  const battle = build('ME3-WPN-FALCON', {}, {}, [source({ id: 'ally' })], [foe({ id: 'secondary' })]);
  order(battle, 'shoot'); readyOrder(battle, 'stasis', 'target', 'ally'); tickBattle(battle, .8);
  assert.equal(unit(battle, 'target').hp, 10000); close(unit(battle, 'secondary').hp, 9984);
  assert.equal(unit(battle).ammo, 5);
  const grenades = build(null, {}, { statuses: { stasis: 6 } }, [], [foe({ id: 'secondary' })]);
  order(grenades, 'fragGrenade'); assert.equal(unit(grenades, 'target').hp, 10000);
  close(unit(grenades, 'secondary').hp, 9976); assert.equal(unit(grenades).grenadeCharges, 2);
});

test('PAW is a real timed heat channel with four impulses, no inherited clips, and ordinary cooling afterward', () => {
  const battle = build('MEA-WPN-PAW', { weaponSystem: 'thermal-clip', ammo: 50, magazineCapacity: 50, reserveAmmo: 50 });
  for (const field of ['ammo', 'magazineCapacity', 'reserveAmmo']) assert.equal(unit(battle)[field], undefined);
  order(battle, 'shoot'); assert.equal(unit(battle, 'target').hp, 10000); assert.equal(unit(battle).heat, 0);
  assert.equal(unit(battle).channel.remainingTicks, 4);
  tickBattle(battle, .5); close(unit(battle, 'target').hp, 9980); close(unit(battle).heat, 14);
  tickBattle(battle, 1.5); close(unit(battle, 'target').hp, 9920); close(unit(battle).heat, 56);
  assert.equal(unit(battle).channel, null);
  assert.equal(battle.events.filter(event => event.type === 'channelPulse').length, 4);
  tickBattle(battle, 1); close(unit(battle).heat, 47);
});

test('Reegar spends clips per pulse and stops at an empty magazine before the nominal channel ends', () => {
  const battle = build('MEA-WPN-REEGAR', { ammo: 3 }); order(battle, 'shoot');
  assert.equal(unit(battle).ammo, 3); tickBattle(battle, 2);
  close(unit(battle, 'target').hp, 9940); assert.equal(unit(battle).ammo, 0);
  assert.equal(unit(battle).reserveAmmo, 32); assert.equal(unit(battle).heat, 0); assert.equal(unit(battle).channel, null);
  assert.equal(battle.events.filter(event => event.type === 'channelPulse').length, 3);
  readyOrder(battle, 'reload'); assert.equal(unit(battle).ammo, 8); assert.equal(unit(battle).reserveAmmo, 24);
  const partial = build('MEA-WPN-REEGAR', { ammo: 1 }); order(partial, 'burst'); tickBattle(partial, 2);
  close(unit(partial, 'target').hp, 9967); assert.equal(unit(partial).ammo, 0);
});

test('an explicit channel cancellation is free in ATB and never refunds already emitted pulses', () => {
  const battle = build('MEA-WPN-PAW'); order(battle, 'shoot'); tickBattle(battle, .5);
  const atb = unit(battle).atb; assert.ok(atb < 100);
  order(battle, 'cancelChannel'); assert.equal(unit(battle).atb, atb); assert.equal(unit(battle).channel, null);
  tickBattle(battle, 1.5); close(unit(battle, 'target').hp, 9980); close(unit(battle).heat, .5);
  assert.equal(getActions(battle, 'source').some(action => action.id === 'cancelChannel'), false);
});

test('KO, Stasis and Sabotage interrupt a channel before any later pulse can occur', () => {
  const ko = build('MEA-WPN-PAW', { hp: 1 }, {}, [source({ id: 'ally', atb: 0 })]);
  order(ko, 'shoot'); tickBattle(ko, .5); readyOrder(ko, 'shoot', 'source', 'target');
  assert.equal(unit(ko).hp, 0); assert.equal(unit(ko).channel, null);
  tickBattle(ko, 2); close(unit(ko, 'target').hp, 9980);
  for (const actionId of ['stasis', 'sabotage']) {
    const battle = build('MEA-WPN-PAW', {}, { powers: [actionId] });
    order(battle, 'shoot'); readyOrder(battle, actionId, 'source', 'target');
    assert.equal(unit(battle).channel, null); tickBattle(battle, 2); assert.equal(unit(battle, 'target').hp, 10000);
  }
});

test('overheating ends the heat channel and respects equipped thermal recovery afterward', () => {
  const battle = build('MEA-WPN-PAW', { heat: 90, weaponCoolingBonus: 3 });
  order(battle, 'shoot'); tickBattle(battle, .5);
  assert.equal(unit(battle).channel, null); assert.equal(unit(battle).heat, 100); assert.equal(unit(battle).overheated, true);
  close(unit(battle, 'target').hp, 9980); tickBattle(battle, 1); close(unit(battle).heat, 88);
  unit(battle).atb = 100; const before = JSON.stringify(battle);
  assert.equal(performAction(battle, { actorId: 'source', actionId: 'shoot', targetId: 'target' }).ok, false);
  assert.equal(JSON.stringify(battle), before);
});

test('Sweeper produces three real heat impacts and never silently spends clips', () => {
  const battle = build('MEA-WPN-SWEEPER', { ammo: 99, magazineCapacity: 99, reserveAmmo: 99 }); order(battle, 'shoot');
  close(unit(battle, 'target').hp, 9960); assert.equal(unit(battle).heat, 24);
  assert.equal(battle.events.filter(event => event.type === 'damage').length, 3);
  assert.equal(unit(battle).ammo, undefined); assert.equal(unit(battle).channel, null); assert.equal(battle.projectiles, undefined);
});

test('Shield Boost restores living allies, changes their real recovery, and never heals HP or revives', () => {
  const ally = source({ id: 'ally', hp: 100, maxHp: 200, shield: 10, atb: 0, statuses: { stasis: 6 } });
  const dead = source({ id: 'dead', hp: 0, maxHp: 200, atb: 0 });
  const battle = build(null, { hp: 120, maxHp: 200 }, {}, [ally, dead]);
  const result = order(battle, 'shieldBoost');
  close(unit(battle).shield, 45); close(unit(battle, 'ally').shield, 55);
  assert.equal(unit(battle).hp, 120); assert.equal(unit(battle, 'ally').hp, 100); assert.equal(unit(battle, 'dead').hp, 0);
  assert.equal(unit(battle, 'dead').shield, 0); assert.equal(unit(battle, 'dead').statuses.shieldBoost, undefined);
  assert.equal(unit(battle).statuses.barrier, undefined); assert.equal(unit(battle).grenadeCharges, 3);
  assert.equal(unit(battle).cooldowns.shieldBoost, 14);
  assert.ok(result.events.some(event => event.type === 'shield' && event.actorId === 'source' && event.targetId === 'ally'));
  tickBattle(battle, 2); close(unit(battle).shield, 59); close(unit(battle, 'ally').shield, 69);
  tickBattle(battle, 3.1); assert.equal(unit(battle).statuses.shieldBoost, undefined);
  const capped = build(null, { shield: 99 }); order(capped, 'shieldBoost'); assert.equal(unit(capped).shield, 100);
});

test('Wait and explicit pause freeze active flights and channels; Active timing is frame independent', () => {
  const waited = build('ME3-WPN-FALCON', {}, {}, [source({ id: 'ally' })], [], 'wait');
  order(waited, 'shoot'); const frozen = JSON.stringify(waited); tickBattle(waited, 2); assert.equal(JSON.stringify(waited), frozen);
  order(waited, 'cover', 'ally', 'ally'); tickBattle(waited, .8); close(unit(waited, 'target').hp, 9960);
  const channel = build('MEA-WPN-PAW', {}, {}, [source({ id: 'ally' })], [], 'wait'); order(channel, 'shoot');
  const before = JSON.stringify(channel); tickBattle(channel, 2); assert.equal(JSON.stringify(channel), before);
  order(channel, 'cover', 'ally', 'ally'); tickBattle(channel, 2); close(unit(channel, 'target').hp, 9920);
  const large = build('MEA-WPN-PAW'), small = build('MEA-WPN-PAW'); order(large, 'shoot'); order(small, 'shoot');
  tickBattle(large, 2.1); for (let frame = 0; frame < 70; frame++) tickBattle(small, .03);
  close(unit(large, 'target').hp, unit(small, 'target').hp); close(unit(large).heat, unit(small).heat);
  const paused = build('MEA-WPN-REEGAR'); order(paused, 'shoot'); const pausedState = JSON.stringify(paused);
  tickBattle(paused, 2, { paused: true }); assert.equal(JSON.stringify(paused), pausedState);
});

test('unknown profile objects cannot create special weapons, and invalid targets spend no special resources', () => {
  const plain = build(null, { weaponProfileId: 'forged', weaponProfile: { mode: 'heat-beam' } }); order(plain, 'shoot');
  close(unit(plain, 'target').hp, 9960); assert.equal(unit(plain).heat, 24); assert.equal(unit(plain).channel, null);
  assert.equal(plain.projectiles, undefined);
  const special = build('ME3-WPN-SCORPION'), before = JSON.stringify(special);
  assert.equal(performAction(special, { actorId: 'source', actionId: 'shoot', targetId: 'missing' }).ok, false);
  assert.equal(JSON.stringify(special), before);
});
