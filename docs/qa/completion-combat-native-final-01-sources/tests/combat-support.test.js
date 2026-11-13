import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIONS, createBattle, performAction, getActions, tickBattle, summarizeBattle } from '../src/combat.js';
import { isSummon } from '../src/combat-summons.js';

const ammoActions = ['ammoIncendiary', 'ammoCryo', 'ammoDisruptor', 'ammoArmorPiercing', 'ammoWarp', 'ammoShredder'];
const source = (changes = {}) => ({ id: 'owner', mediaId: 'ME3', name: 'Owner', hp: 1000, maxHp: 1000, shield: 0, maxShield: 0,
  attack: 40, defense: 0, speed: .1, atb: 100, powers: ['combatDrone', 'sentryTurret', 'defenseDrone', ...ammoActions,
    'unity', 'shieldBoost', 'overload', 'incinerate', 'stasis'], weaponSystem: 'thermal-clip', magazineCapacity: 100, ammo: 100, reserveAmmo: 200, ...changes });
const foe = (changes = {}) => ({ id: 'enemy', mediaId: 'ME3', name: 'Enemy', hp: 10000, maxHp: 10000, shield: 0, maxShield: 0,
  attack: 20, defense: 0, speed: .1, powers: [], ...changes });
const build = (owner = {}, target = {}, party = [], enemies = [], mode = 'active') => createBattle({
  mode, rng: () => .5, party: [source(owner), ...party], enemies: [foe(target), ...enemies] });
const unit = (battle, id = 'owner') => battle.actors.find(actor => actor.id === id);
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} should equal ${expected}`);
function use(battle, actionId, targetId = 'enemy', actorId = 'owner') {
  unit(battle, actorId).atb = 100;
  const result = performAction(battle, { actorId, actionId, targetId: ['self', 'allies'].includes(ACTIONS[actionId]?.target) ? actorId : targetId });
  assert.equal(result.ok, true, result.reason); return result;
}
const damage = result => result.events.find(event => event.type === 'damage');
const supports = battle => battle.actors.filter(isSummon);

test('real deployment adds a targetable autonomous entity and its scheduled pulse uses actual HP', () => {
  const battle = build({ techMultiplier: 1.5, weaponDamageMultiplier: 3, ammoModeId: 'ME3-POW-AMMO-DISRUPTOR' });
  use(battle, 'combatDrone'); const drone = supports(battle)[0];
  assert.equal(unit(battle).atb, 0); assert.equal(unit(battle).cooldowns.combatDrone, 10);
  assert.equal(drone.hp, 65); close(drone.attack, 13.5); assert.equal(drone.ownerId, 'owner');
  assert.equal(drone.ammoModeId, null); assert.deepEqual(drone.allowedAmmoProfileIds, []);
  assert.deepEqual(getActions(battle, drone.id), []);
  const before = JSON.stringify(battle);
  assert.equal(performAction(battle, { actorId: drone.id, actionId: 'shoot', targetId: 'enemy' }).ok, false);
  assert.equal(JSON.stringify(battle), before);
  tickBattle(battle, 2); close(unit(battle, 'enemy').hp, 9986.5);
  assert.ok(battle.events.some(event => event.type === 'damage' && event.actorId === drone.id && event.actionId === 'summonPulse'));
  tickBattle(battle, .5); // The harassment pulse briefly staggers its target.
  use(battle, 'shoot', drone.id, 'enemy'); close(drone.hp, 29);
  assert.equal(unit(battle).hp, 1000, 'The drone and its owner have separate real HP');
});

test('Defense Drone reacts once to real owner damage, with its own entity and native event cursor', () => {
  const battle = build(); use(battle, 'defenseDrone');
  const drone = supports(battle)[0]; assert.equal(drone.actionId, 'defenseDrone');
  tickBattle(battle, 1); assert.equal(unit(battle, 'enemy').hp, 10000);
  use(battle, 'shoot', 'owner', 'enemy'); close(unit(battle).hp, 963);
  tickBattle(battle, .05); close(unit(battle, 'enemy').hp, 9994);
  tickBattle(battle, .55); close(unit(battle, 'enemy').hp, 9994);
  use(battle, 'shoot', 'owner', 'enemy'); tickBattle(battle, .05);
  close(unit(battle, 'enemy').hp, 9994, 'Hits during the guard interval do not produce duplicate retaliation');
  tickBattle(battle, 2); use(battle, 'shoot', 'owner', 'enemy'); tickBattle(battle, .05);
  close(unit(battle, 'enemy').hp, 9988);
  assert.equal(battle.events.filter(event => event.type === 'action' && event.actorId === drone.id).length, 2);
  assert.equal(unit(battle).statuses.barrier, undefined);
});

test('supports are enemy targets but cannot consume Medi-gel, Unity or Shield Boost', () => {
  const battle = build({ hp: 800, maxShield: 100 }, {}, [source({ id: 'ally', hp: 0, maxHp: 500, atb: 0 })]);
  use(battle, 'sentryTurret'); const turret = supports(battle)[0];
  use(battle, 'shoot', turret.id, 'enemy'); assert.equal(turret.shield, 0); assert.ok(turret.hp < turret.maxHp);
  unit(battle).atb = 100; const before = JSON.stringify(battle);
  assert.equal(performAction(battle, { actorId: 'owner', actionId: 'medigel', targetId: turret.id }).ok, false);
  assert.equal(JSON.stringify(battle), before);
  use(battle, 'shieldBoost'); close(unit(battle).shield, 45);
  assert.equal(turret.shield, 0); assert.equal(turret.statuses.shieldBoost, undefined);
  use(battle, 'shoot', turret.id, 'enemy'); use(battle, 'shoot', turret.id, 'enemy'); use(battle, 'shoot', turret.id, 'enemy');
  assert.equal(supports(battle).length, 0);
  use(battle, 'unity'); assert.equal(unit(battle, 'ally').hp, 150); assert.equal(supports(battle).length, 0);
});

test('owner KO removes the entity immediately and supports never postpone a native defeat or victory', () => {
  const surviving = build({ hp: 1 }, {}, [source({ id: 'ally', atb: 0 })]); use(surviving, 'combatDrone');
  use(surviving, 'shoot', 'owner', 'enemy'); assert.equal(supports(surviving).length, 0); assert.equal(surviving.winner, null);
  tickBattle(surviving, 2); assert.equal(unit(surviving, 'enemy').hp, 10000);
  assert.equal(surviving.summonHistory.at(-1).reason, 'owner-unavailable');
  const defeat = build({ hp: 1 }); use(defeat, 'defenseDrone'); use(defeat, 'shoot', 'owner', 'enemy');
  assert.equal(defeat.winner, 'enemy'); assert.equal(supports(defeat).length, 0);
  const victory = build({}, { hp: 1, maxHp: 1, powers: ['sentryTurret'] });
  use(victory, 'sentryTurret', 'enemy', 'enemy'); assert.equal(supports(victory).length, 1);
  use(victory, 'shoot'); assert.equal(victory.winner, 'party'); assert.equal(supports(victory).length, 0);
  assert.equal(summarizeBattle(victory).defeatedEnemies, 1); assert.equal(summarizeBattle(victory).enemies.length, 1);
});

test('a support can win through a real pulse without becoming an extra squad member in the summary', () => {
  const battle = build({}, { hp: 5, maxHp: 5 }); use(battle, 'combatDrone'); tickBattle(battle, 2);
  assert.equal(battle.winner, 'party'); assert.equal(summarizeBattle(battle).party.length, 1);
  assert.equal(summarizeBattle(battle).defeatedEnemies, 1);
});

test('Wait never pauses for an autonomous ATB gauge, and control prevents phantom pulses', () => {
  const wait = build({}, {}, [], [], 'wait'); use(wait, 'combatDrone');
  supports(wait)[0].atb = 100; tickBattle(wait, 2);
  close(wait.elapsed, 2); close(unit(wait, 'enemy').hp, 9991);
  const controlled = build({}, { powers: ['stasis'] }); use(controlled, 'combatDrone');
  const drone = supports(controlled)[0]; use(controlled, 'stasis', drone.id, 'enemy'); tickBattle(controlled, 3);
  assert.equal(unit(controlled, 'enemy').hp, 10000);
});

test('native support scheduling is frame independent and freezes with a real player decision or explicit pause', () => {
  const coarse = build(), fine = build(); use(coarse, 'combatDrone'); use(fine, 'combatDrone');
  const beforePause = JSON.stringify(coarse); tickBattle(coarse, 6, { paused: true });
  assert.equal(JSON.stringify(coarse), beforePause);
  tickBattle(coarse, 6); for (let index = 0; index < 60; index++) tickBattle(fine, .1);
  close(unit(coarse, 'enemy').hp, 9973); close(unit(fine, 'enemy').hp, 9973);
  close(supports(coarse)[0].nextAttackAt, supports(fine)[0].nextAttackAt);
  assert.equal(coarse.events.filter(event => event.actionId === 'summonPulse').length,
    fine.events.filter(event => event.actionId === 'summonPulse').length);
  const waiting = build({}, {}, [], [], 'wait'); use(waiting, 'combatDrone'); unit(waiting).atb = 100;
  const supportTime = supports(waiting)[0].nextAttackAt; tickBattle(waiting, 6);
  assert.equal(waiting.elapsed, 0); assert.equal(unit(waiting, 'enemy').hp, 10000);
  assert.equal(supports(waiting)[0].nextAttackAt, supportTime);
});

test('replacement, expiry and the native per-owner cap spend no resources on a refused deployment', () => {
  const battle = build(); use(battle, 'combatDrone'); use(battle, 'sentryTurret');
  unit(battle).atb = 100; const before = JSON.stringify(battle);
  assert.equal(performAction(battle, { actorId: 'owner', actionId: 'defenseDrone', targetId: 'owner' }).ok, false);
  assert.equal(JSON.stringify(battle), before);
  const firstId = supports(battle).find(actor => actor.actionId === 'combatDrone').id;
  tickBattle(battle, 10); use(battle, 'combatDrone');
  assert.equal(unit(battle, firstId), undefined); assert.equal(supports(battle).length, 2);
  assert.equal(battle.summonHistory.at(-1).reason, 'replaced');
  tickBattle(battle, 18.1); assert.equal(supports(battle).length, 0);
  assert.ok(battle.summonHistory.some(entry => entry.reason === 'expired'));
});

test('repeated real replacements retain bounded support history and no growing actor list', () => {
  const battle = build();
  for (let count = 0; count < 27; count++) { use(battle, 'combatDrone'); tickBattle(battle, 10); }
  assert.equal(supports(battle).length, 1); assert.equal(battle.actors.length, 3);
  assert.equal(battle.summonHistory.length, 24);
});

test('native mode permissions are rebuilt from kit and work instead of caller permissions', () => {
  const granted = build({ powers: ['ammoCryo'], allowedAmmoProfileIds: [], ammoModeId: 'ME3-POW-AMMO-CRYO' });
  assert.deepEqual(unit(granted).allowedAmmoProfileIds, ['ME3-POW-AMMO-CRYO']); assert.equal(unit(granted).ammoModeId, 'ME3-POW-AMMO-CRYO');
  const forged = build({ powers: [], allowedAmmoProfileIds: ['ME3-POW-AMMO-DISRUPTOR'], ammoModeId: 'ME3-POW-AMMO-DISRUPTOR' });
  assert.deepEqual(unit(forged).allowedAmmoProfileIds, []); assert.equal(unit(forged).ammoModeId, null);
  assert.equal(getActions(forged, 'owner').some(action => action.id === 'ammoDisruptor'), false);
  const me3 = build({ powers: ['ammoShredder'], ammoModeId: 'ME2-POW-AMMO-SHREDDER' });
  assert.equal(unit(me3).ammoModeId, null); assert.equal(getActions(me3, 'owner').some(action => action.id === 'ammoShredder'), false);
  const old = build({ mediaId: 'ME1', ammoModeId: 'ME3-POW-AMMO-CRYO' });
  assert.equal(unit(old).ammoModeId, null); unit(old).atb = 100;
  assert.equal(performAction(old, { actorId: 'owner', actionId: 'combatDrone', targetId: 'enemy' }).ok, false);
});

test('activation, replacement and off consume an ATB order without refilling, heating or adding cooldown', () => {
  const battle = build({ grenadeCapacity: 3, grenadeCharges: 2 }); use(battle, 'ammoCryo');
  assert.equal(unit(battle).atb, 0); assert.equal(unit(battle).ammoModeId, 'ME3-POW-AMMO-CRYO');
  use(battle, 'ammoDisruptor'); assert.equal(unit(battle).ammoModeId, 'ME3-POW-AMMO-DISRUPTOR');
  assert.equal(unit(battle).ammo, 100); assert.equal(unit(battle).reserveAmmo, 200); assert.equal(unit(battle).heat, 0); assert.equal(unit(battle).grenadeCharges, 2);
  assert.equal(unit(battle).cooldowns.ammoCryo, undefined);
  unit(battle).atb = 100; const before = JSON.stringify(battle);
  assert.equal(performAction(battle, { actorId: 'owner', actionId: 'ammoDisruptor', targetId: 'owner' }).ok, false);
  assert.equal(JSON.stringify(battle), before);
  use(battle, 'ammoOff'); assert.equal(unit(battle).ammoModeId, null); assert.equal(unit(battle).atb, 0);
  assert.equal(getActions(battle, 'owner').some(action => action.id === 'ammoOff'), false);
});

test('Disruptor consumes the original shield budget before applying a health bonus after armor', () => {
  const organic = build({ ammoModeId: 'ME3-POW-AMMO-DISRUPTOR' }, { shield: 10, maxShield: 10 });
  const hit = damage(use(organic, 'shoot')); close(hit.shieldDamage, 10); close(hit.healthDamage, 40 - 10 / 1.3);
  const synthetic = build({ ammoModeId: 'ME3-POW-AMMO-DISRUPTOR' }, { shield: 10, maxShield: 10, defense: 10, synthetic: true });
  const result = damage(use(synthetic, 'shoot'));
  close(result.healthDamage, (40 - 10 / 1.3 - 10) * 1.2); close(result.shieldDamage, 10);
});

test('temporary and normal shields share the same correctly converted base budget', () => {
  const battle = build({ ammoModeId: 'ME3-POW-AMMO-DISRUPTOR' }, { mediaId: 'ME2', shield: 10, maxShield: 10 });
  unit(battle, 'enemy').statuses.fortification = 10; unit(battle, 'enemy').fortificationShield = 30;
  const hit = damage(use(battle, 'shoot'));
  close(hit.temporaryShieldDamage, 30); close(hit.shieldDamage, 40); close(hit.healthDamage, 40 - 40 / 1.3);
});

test('AP reduces flat armor and the cover penalty without inventing geometry penetration', () => {
  const normal = build({}, { defense: 10, cover: true }); close(damage(use(normal, 'shoot')).healthDamage, 10);
  const ap = build({ ammoModeId: 'ME3-POW-AMMO-AP' }, { defense: 10, cover: true });
  close(damage(use(ap, 'shoot')).healthDamage, 40 * (1 - .5 * .75) - 10 * .65);
});

test('Shredder is ME2-only, exposed-organic-only, and boosts health after defense', () => {
  const state = { mediaId: 'ME2', ammoModeId: 'ME2-POW-AMMO-SHREDDER' };
  close(damage(use(build(state, { defense: 10 }), 'shoot')).healthDamage, 37.5);
  close(damage(use(build(state, { defense: 10, synthetic: true }), 'shoot')).healthDamage, 30);
  close(damage(use(build(state, { defense: 10, shield: 1, maxShield: 1 }), 'shoot')).healthDamage, 29);
});

test('Warp ammunition uses existing suspension and barrier states without a new fake barrier health bar', () => {
  const state = { ammoModeId: 'ME3-POW-AMMO-WARP' };
  const shielded = build(state, { shield: 1000, maxShield: 1000, statuses: { pull: 3, barrier: 8 } });
  close(damage(use(shielded, 'shoot')).shieldDamage, 40 * .7 * 1.2 * 1.25);
  close(damage(use(build(state, { defense: 10, statuses: { pull: 3 } }), 'shoot')).healthDamage, 36);
});

test('incendiary post-hit burning needs real organic health damage and remains independent of technology boosts', () => {
  const state = { ammoModeId: 'ME3-POW-AMMO-INCENDIARY', techMultiplier: 5 };
  const large = build(state), small = build(state); use(large, 'shoot'); use(small, 'shoot');
  assert.equal(unit(large, 'enemy').statuses.burning, 3); use(large, 'ammoOff');
  tickBattle(large, 2); for (let index = 0; index < 40; index++) tickBattle(small, .05);
  close(unit(large, 'enemy').hp, 9952); close(unit(small, 'enemy').hp, 9952);
  for (const target of [{ shield: 1000, maxShield: 1000 }, { synthetic: true }, { burnImmune: true }, { statuses: { stasis: 6 } }]) {
    const battle = build(state, target); use(battle, 'shoot'); assert.equal(unit(battle, 'enemy').statuses.burning, undefined);
  }
  const breaking = build(state, { shield: 10, maxShield: 10 }); use(breaking, 'shoot'); assert.equal(unit(breaking, 'enemy').statuses.burning, 3);
});

test('Cryo accumulates real hit counts, freezes through the native control rules, and respects immunities', () => {
  const state = { ammoModeId: 'ME3-POW-AMMO-CRYO' }, battle = build(state, { controlResistance: .25 });
  use(battle, 'shoot'); assert.equal(unit(battle, 'enemy').cryoStacks, 1);
  use(battle, 'shoot'); assert.equal(unit(battle, 'enemy').cryoStacks, 2);
  use(battle, 'shoot'); assert.equal(unit(battle, 'enemy').cryoStacks, 0); close(unit(battle, 'enemy').statuses.frozen, 1.5);
  const burst = build(state); use(burst, 'burst'); assert.equal(unit(burst, 'enemy').statuses.frozen, 2);
  for (const target of [{ shield: 1000, maxShield: 1000 }, { controlImmune: true }, { freezeImmune: true }, { controlResistance: 1 }, { statuses: { stasis: 6 } }]) {
    const immune = build(state, target); use(immune, 'burst'); assert.equal(unit(immune, 'enemy').cryoStacks, 0); assert.equal(unit(immune, 'enemy').statuses.frozen, undefined);
  }
});

test('ammo modes never amplify powers, summon pulses, specialist weapons or heat guns', () => {
  const boosted = { ammoModeId: 'ME3-POW-AMMO-DISRUPTOR', weaponDamageMultiplier: 3 };
  close(damage(use(build(boosted, { synthetic: true }), 'overload')).healthDamage, 66);
  close(damage(use(build(boosted), 'incinerate')).healthDamage, 42);
  const summon = build(boosted, { synthetic: true }); use(summon, 'combatDrone'); tickBattle(summon, 2);
  close(unit(summon, 'enemy').hp, 9991);
  for (const specialist of [{ weaponProfileId: 'ME3-WPN-FALCON' }, { weaponSystem: 'heat' }]) {
    const battle = build({ ...boosted, ...specialist }); assert.equal(unit(battle).ammoModeId, null);
    assert.equal(getActions(battle, 'owner').find(action => action.id === 'ammoDisruptor').available, false);
  }
});
