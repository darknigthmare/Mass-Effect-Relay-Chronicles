import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattle, performAction, tickBattle, getActions, getTacticalCoverState, getTacticalPosition,
  getTargetAvailability, performCoordinatedOrder } from '../src/combat.js';
import { newGame, encodeSave, decodeSave } from '../src/state.js';
import { actorFor } from '../src/game-data.js';
import { buyItem, equipItem } from '../src/loadout.js';

const unit = (id, changes = {}) => ({ id, name: id, hp: 1000, maxHp: 1000, shield: 0, maxShield: 0,
  atb: 100, attack: 40, defense: 0, speed: 1, powers: [], ...changes });
const get = (battle, id = 'shepard') => battle.actors.find(actor => actor.id === id);
const order = (battle, actionId, targetId = 'geth', actorId = 'shepard') => performAction(battle, { actorId, actionId, targetId });
const battleFor = changes => createBattle({ party: [unit('shepard')], enemies: [unit('geth', { atb: 0, speed: .1, synthetic: true })],
  rng: () => .5, mode: 'active', ...changes });
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} ≠ ${expected}`);

test('geometric cover refuses empty ground atomically and exposes a detached reason', () => {
  let draws = 0;
  const battle = battleFor({ tactical: true, rng: () => { draws++; return .5; }, tacticalCoverAvailable: context => {
    context.position.x = 999; context.opponentPositions[0].x = 999;
    return { available: false, reason: 'Aucun obstacle solide dans cette direction.' };
  } });
  const position = getTacticalPosition(battle, 'shepard'), before = JSON.stringify(battle);
  const view = getTacticalCoverState(battle, 'shepard');
  assert.equal(view.enforced, true); assert.equal(view.available, false);
  assert.match(getActions(battle, 'shepard').find(action => action.id === 'cover').reason, /obstacle solide/);
  const result = order(battle, 'cover', 'shepard');
  assert.equal(result.ok, false); assert.equal(JSON.stringify(battle), before); assert.equal(draws, 0);
  assert.deepEqual(getTacticalPosition(battle, 'shepard'), position);
});

test('one obstacle protects from its facing attacker, while an exposed flank receives full damage', () => {
  const battle = battleFor({ tactical: true, party: [unit('shepard')],
    enemies: [unit('front', { attack: 40 }), unit('flank', { attack: 40 })],
    tacticalCoverAvailable: ({ opponentPositions }) => {
      const protectedFrom = opponentPositions.filter(other => other.id === 'front').map(other => other.id);
      return { available: protectedFrom.length > 0, protectedFrom, coverId: 'solid-crate' };
    } });
  assert.equal(order(battle, 'cover', 'shepard').ok, true);
  assert.equal(get(battle).atb, 0); assert.equal(get(battle).cover, true);
  const front = order(battle, 'shoot', 'shepard', 'front').events.find(event => event.type === 'damage');
  const flank = order(battle, 'shoot', 'shepard', 'flank').events.find(event => event.type === 'damage');
  close(flank.amount, front.amount * 2);
  assert.equal(get(battle).cover, true, 'A flank hit does not remove an obstacle still protecting the front');
  const view = getTacticalCoverState(battle, 'shepard'); view.protectedFrom.push('flank');
  assert.deepEqual(getTacticalCoverState(battle, 'shepard').protectedFrom, ['front']);
  assert.equal(getTacticalCoverState(battle, 'shepard', 'flank').active, false);
});

test('losing real cover removes both damage protection and accelerated shield recovery', () => {
  let obstacle = true;
  const battle = battleFor({ tactical: true, tacticalCoverAvailable: () => obstacle,
    party: [unit('shepard', { maxShield: 100, shield: 0 })] });
  assert.equal(order(battle, 'cover', 'shepard').ok, true);
  obstacle = false;
  tickBattle(battle, .5);
  assert.equal(get(battle).cover, false); close(get(battle).shield, .5);
  assert.equal(battle.events.filter(event => event.type === 'coverLost').length, 1);
  assert.equal(getActions(battle, 'shepard').find(action => action.id === 'cover').available, false);
  const legacy = battleFor({ tacticalCoverAvailable: () => false });
  assert.equal(order(legacy, 'cover', 'shepard').ok, true, 'Non-tactical sessions retain their declared abstract cover');
});

test('Stasis explains blocked control and prevents weapon, ability and timed damage', () => {
  const battle = battleFor({ party: [unit('shepard', { powers: ['lift', 'throw', 'overload'] })],
    enemies: [unit('geth', { atb: 0, speed: .1, shield: 80, maxShield: 80, statuses: { stasis: 6, warp: 3 } })] });
  const before = { hp: get(battle, 'geth').hp, shield: get(battle, 'geth').shield };
  const lifted = order(battle, 'lift');
  assert.equal(lifted.ok, true); assert.equal(get(battle, 'geth').statuses.lift, undefined);
  assert.ok(lifted.events.some(event => event.type === 'blocked' && /stase.*contrôle/.test(event.message)));
  for (const actionId of ['shoot', 'throw', 'overload']) {
    get(battle).atb = 100;
    assert.ok(order(battle, actionId).events.some(event => event.type === 'blocked' && /stase/.test(event.message)));
  }
  tickBattle(battle, 1);
  assert.deepEqual({ hp: get(battle, 'geth').hp, shield: get(battle, 'geth').shield }, before);
});

test('resistance gives explicit feedback for immune control and shieldless organics', () => {
  const battle = battleFor({ party: [unit('shepard', { powers: ['lift', 'overload', 'incinerate'] })],
    enemies: [unit('geth', { controlImmune: true, burnImmune: true, synthetic: false, atb: 0 })] });
  assert.ok(order(battle, 'lift').events.some(event => event.type === 'resist' && /résiste/.test(event.message)));
  get(battle).atb = 100;
  assert.ok(order(battle, 'overload').events.some(event => event.type === 'resist' && /santé organique/.test(event.message)));
  get(battle).atb = 100;
  const result = order(battle, 'incinerate');
  assert.ok(result.events.some(event => event.type === 'damage'));
  assert.ok(result.events.some(event => event.type === 'resist' && /brûlure/.test(event.message)));
  assert.equal(get(battle, 'geth').statuses.burning, undefined);
});

test('AI hacking an organic in a mixed formation is refused before ATB, cooldown or RNG is spent', () => {
  let draws = 0;
  const battle = battleFor({ rng: () => { draws++; return .5; }, party: [unit('shepard', { powers: ['hack'] })],
    enemies: [unit('human', { synthetic: false }), unit('geth', { synthetic: true })] });
  assert.equal(getActions(battle, 'shepard').find(action => action.id === 'hack').available, true);
  const before = JSON.stringify(battle);
  assert.equal(getTargetAvailability(battle, { actorId: 'shepard', actionId: 'hack', targetId: 'human' }).ok, false);
  const result = order(battle, 'hack', 'human');
  assert.equal(result.ok, false); assert.match(result.reason, /synthétique/);
  assert.equal(JSON.stringify(battle), before); assert.equal(draws, 0);
});

test('buying an amplifier cannot grant biotics to a Soldier through equipment, a save or combat', () => {
  const state = newGame({ classId: 'soldier' }), originalPowers = [...actorFor('shepard', state).powers];
  assert.equal(buyItem(state, 'biotic-amp-upgraded').ok, true, 'Use a real affordable purchase from the starter budget');
  assert.equal(state.credits, 10);
  const purchased = JSON.stringify(state), rejected = equipItem(state, 'shepard', 'biotic-amp-upgraded', 'bioticAmp');
  assert.equal(rejected.ok, false); assert.equal(JSON.stringify(state), purchased);
  const resumed = decodeSave(encodeSave(state)); assert.ok(resumed);
  assert.deepEqual(actorFor('shepard', resumed).powers, originalPowers);
  let draws = 0;
  const battle = battleFor({ party: [{ ...actorFor('shepard', resumed), atb: 100 }], rng: () => { draws++; return .5; } });
  assert.equal(getActions(battle, 'shepard').some(action => ['stasis', 'lift', 'throw', 'warp', 'singularity', 'barrier'].includes(action.id)), false);
  const before = JSON.stringify(battle);
  assert.equal(order(battle, 'stasis').ok, false); assert.equal(JSON.stringify(battle), before); assert.equal(draws, 0);
});

test('a lost target cancels a prepared shot immediately with an announced reason and no clip expenditure', () => {
  const battle = battleFor({ party: [unit('shepard', { weaponProfileId: 'ME3-WPN-ARC' }), unit('helper')],
    enemies: [unit('geth', { hp: 1, maxHp: 1, atb: 0 }), unit('remaining', { atb: 0 })] });
  const ammunition = get(battle).ammo;
  assert.equal(order(battle, 'shoot').ok, true);
  assert.ok(get(battle).channel); assert.equal(get(battle).atb, 0);
  const result = order(battle, 'shoot', 'geth', 'helper');
  assert.equal(get(battle).channel, null);
  assert.ok(result.events.some(event => event.type === 'channelEnd' && event.reason === 'cible hors combat' && /tir interrompu/.test(event.message)));
  tickBattle(battle, 2);
  assert.equal(get(battle).ammo, ammunition);
  assert.equal(battle.events.some(event => event.type === 'weaponChargeRelease'), false);
});

test('a hacked shooter cancels its old friendly target before the next charged emission', () => {
  const battle = battleFor({ party: [unit('shepard', { synthetic: true, weaponProfileId: 'ME3-WPN-ARC' }), unit('helper')],
    enemies: [unit('geth', { powers: ['hack'] })] });
  const ammunition = get(battle).ammo, hp = get(battle, 'geth').hp;
  assert.equal(order(battle, 'shoot').ok, true);
  assert.equal(order(battle, 'hack', 'shepard', 'geth').ok, true);
  tickBattle(battle, .05);
  assert.equal(get(battle).channel, null); assert.equal(get(battle).ammo, ammunition); assert.equal(get(battle, 'geth').hp, hp);
  assert.ok(battle.events.some(event => event.type === 'channelEnd' && event.reason === 'cible devenue alliée'));
});

test('a queued actor KO cannot fire, and a coordinated target KO cancels only the remaining free order', () => {
  const charged = battleFor({ party: [unit('shepard', { hp: 1, weaponProfileId: 'ME3-WPN-ARC' }), unit('helper', { atb: 0 })],
    enemies: [unit('geth', { attack: 100 })] });
  const ammunition = get(charged).ammo;
  order(charged, 'shoot'); order(charged, 'shoot', 'shepard', 'geth'); tickBattle(charged, 2);
  assert.equal(get(charged).hp, 0); assert.equal(get(charged).ammo, ammunition);
  assert.equal(charged.events.some(event => event.type === 'weaponChargeRelease'), false);
  assert.match(order(charged, 'shoot').reason, /hors combat/);
  const coordinated = battleFor({ tactical: true, party: [unit('shepard'), unit('helper')], enemies: [unit('geth', { hp: 1, maxHp: 1, atb: 0 })] });
  const result = performCoordinatedOrder(coordinated, { orders: [{ actorId: 'shepard', actionId: 'shoot', targetId: 'geth' }, { actorId: 'helper', actionId: 'shoot', targetId: 'geth' }] });
  assert.equal(result.applied.length, 1); assert.equal(result.cancelled.length, 1);
  assert.equal(get(coordinated, 'helper').atb, 100); assert.equal(get(coordinated, 'helper').heat, 0);
  assert.ok(result.events.some(event => event.type === 'coordinatedCancel' && /sans dépense/.test(event.message)));
});

test('natural ATB firing reaches bounded overheat, rejects a shot for free, then resumes after cooling', () => {
  let draws = 0;
  const battle = battleFor({ party: [unit('shepard', { weaponHeatMultiplier: 3, powers: ['barrier'] })], rng: () => { draws++; return .5; } });
  for (let shot = 0; shot < 3; shot++) {
    assert.equal(order(battle, 'shoot').ok, true);
    if (shot < 2) tickBattle(battle, 5);
  }
  assert.equal(get(battle).heat, 100); assert.equal(get(battle).overheated, true);
  tickBattle(battle, 5);
  const before = JSON.stringify(battle), count = draws;
  assert.equal(order(battle, 'shoot').ok, false); assert.equal(JSON.stringify(battle), before); assert.equal(draws, count);
  tickBattle(battle, 3);
  assert.equal(get(battle).overheated, false); assert.ok(get(battle).heat <= 35);
  assert.equal(order(battle, 'shoot').ok, true);
  assert.ok(battle.events.some(event => event.type === 'cooled'));
});

test('active and Wait pause heat, enemies and all recovery by the same explicit decision rule', () => {
  const initial = { party: [unit('shepard', { heat: 80, cooldowns: { overload: 9 }, statuses: { barrier: 5 }, shield: 0, maxShield: 100 })] };
  const waiting = battleFor({ ...initial, mode: 'wait' }), active = battleFor(initial);
  const waitBefore = JSON.stringify(waiting), activeBefore = JSON.stringify(active);
  tickBattle(waiting, 20); tickBattle(active, 20, { paused: true });
  assert.equal(JSON.stringify(waiting), waitBefore); assert.equal(JSON.stringify(active), activeBefore);
  order(waiting, 'cover', 'shepard'); order(active, 'cover', 'shepard');
  tickBattle(waiting, 1); tickBattle(active, 1);
  assert.deepEqual(waiting.actors, active.actors); close(waiting.elapsed, active.elapsed);
});

test('simultaneous periodic kills emit one outcome and a three-person defeat freezes the completed simulation', () => {
  for (const loser of ['party', 'enemy']) {
    const doomed = id => unit(id, { hp: .1, maxHp: 1000, atb: 0, statuses: { warp: 2, corrosion: 2 } });
    const battle = battleFor(loser === 'party' ? { party: ['shepard', 'kaidan', 'ashley'].map(doomed) }
      : { enemies: [doomed('geth')] });
    tickBattle(battle, .1);
    assert.equal(battle.winner, loser === 'party' ? 'enemy' : 'party');
    assert.equal(battle.events.filter(event => event.type === 'victory').length, 1);
    const before = JSON.stringify(battle);
    tickBattle(battle, 60); assert.equal(order(battle, 'shoot').ok, false);
    assert.equal(JSON.stringify(battle), before);
  }
});
