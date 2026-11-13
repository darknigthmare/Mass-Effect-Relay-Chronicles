import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattle, getActions, getTargetAvailability, getTacticalState, getTacticalPosition,
  performAction, planCoordinatedOrder, performCoordinatedOrder, tickBattle, autoEnemyActions, summarizeBattle } from '../src/combat.js';
import { reserveTacticalOrder, releaseTacticalReservations } from '../src/combat.js';

const party = (id = 'shepard', extra = {}) => ({ id, name: id, hp: 200, maxHp: 200, shield: 0, maxShield: 0,
  attack: 25, defense: 0, speed: 1, atb: 100, powers: [], weaponType: 'assault', ...extra });
const enemy = (id = 'geth', extra = {}) => ({ id, name: id, hp: 300, maxHp: 300, shield: 0, maxShield: 0,
  attack: 15, defense: 0, speed: .8, powers: [], synthetic: true, ...extra });
const actor = (battle, id) => battle.actors.find(candidate => candidate.id === id);
const snapshot = battle => JSON.stringify(battle);
const order = (battle, actorId, actionId, targetId) => performAction(battle, { actorId, actionId, targetId });
const fixture = extra => createBattle({ party: [party(), party('kaidan', { powers: ['lift', 'throw'] })], enemies: [enemy()], tactical: true, rng: () => .5, ...extra });

test('the tactical mode is explicit, ME1-only, and default/future sessions retain their old action and simulation path', () => {
  const base = { party: [party('shepard', { atb: 0 })], enemies: [enemy()], seed: 2183, mode: 'active' };
  const legacy = createBattle(base), disabled = createBattle({ ...base, tactical: false, bossPhases: false });
  assert.equal(getTacticalState(legacy), null); assert.equal(getTacticalPosition(legacy, 'shepard'), null);
  assert.equal(getActions(legacy, 'shepard').some(action => ['advance', 'withdraw'].includes(action.id)), false);
  for (let step = 0; step < 100; step++) { tickBattle(legacy, .1); tickBattle(disabled, .1); }
  assert.equal(snapshot(legacy), snapshot(disabled));
  const future = createBattle({ ...base, party: [party('ryder', { mediaId: 'MEA', powers: ['advance'] })] });
  assert.equal(getActions(future, 'ryder').some(action => action.id === 'advance'), false);
  assert.throws(() => createBattle({ ...base, party: [party('ryder', { mediaId: 'MEA' })], tactical: true }), /Mass Effect 1/);
});

test('range is shown before an order, a distant target cannot spend resources or RNG, and action selection stays available', () => {
  let draws = 0;
  const battle = fixture({ party: [party('shepard', { weaponType: 'shotgun', tacticalAnchor: { x: -8, z: -6 } })],
    enemies: [enemy('geth', { tacticalAnchor: { x: 8, z: 6 } })], rng: () => { draws++; return .5; } });
  const before = snapshot(battle), view = getActions(battle, 'shepard').find(action => action.id === 'shoot');
  assert.equal(view.available, true, 'A targetless action is not disabled because one opponent is far away');
  assert.equal(view.range, 8.5); assert.equal(view.atbCost, 100);
  const target = getTargetAvailability(battle, { actorId: 'shepard', actionId: 'shoot', targetId: 'geth' });
  assert.equal(target.ok, false); assert.equal(target.range, 8.5); assert.equal(target.distance, 20); assert.match(target.reason, /Hors de portée/);
  assert.equal(order(battle, 'shepard', 'shoot', 'geth').ok, false);
  assert.equal(snapshot(battle), before); assert.equal(draws, 0);
  actor(battle, 'shepard').atb = 20;
  assert.equal(getTargetAvailability(battle, { actorId: 'shepard', actionId: 'shoot', targetId: 'geth' }).distance, 20, 'Distance remains inspectable while ATB is charging');
});

test('advancing/repositioning consumes real ATB, changes the exact renderer position and makes a close attack possible', () => {
  const battle = fixture({ party: [party('shepard', { weaponType: 'shotgun' })], enemies: [enemy('geth', { tacticalAnchor: { x: 6.5, z: -2.9 } })] });
  const before = getTacticalPosition(battle, 'shepard');
  assert.equal(getTargetAvailability(battle, { actorId: 'shepard', actionId: 'shoot', targetId: 'geth' }).ok, false);
  assert.equal(order(battle, 'shepard', 'advance', 'shepard').ok, true);
  assert.equal(actor(battle, 'shepard').atb, 0); assert.equal(actor(battle, 'shepard').heat, 0); assert.equal(actor(battle, 'shepard').focus, 0);
  assert.ok(getTacticalPosition(battle, 'shepard').x > before.x);
  assert.equal(getTargetAvailability(battle, { actorId: 'shepard', actionId: 'shoot', targetId: 'geth' }).ok, false, 'Movement cannot also fire without another ATB cycle');
  actor(battle, 'shepard').atb = 100;
  assert.equal(order(battle, 'shepard', 'shoot', 'geth').ok, true);
  actor(battle, 'shepard').atb = 100;
  const position = getTacticalPosition(battle, 'shepard');
  assert.equal(order(battle, 'shepard', 'reposition', 'shepard').ok, true);
  assert.notDeepEqual(getTacticalPosition(battle, 'shepard'), position); assert.equal(actor(battle, 'shepard').statuses.flanking, 8);
  assert.equal(getTacticalState(battle).revision, 2);
});

test('tactical getters are detached and the real-ground callback rejects thin blocking segments, without RNG or costs', () => {
  let blocked = false, draws = 0;
  const allowed = ({ x }) => !blocked || x < -3.75 || x > -3.55;
  const battle = fixture({ tacticalPositionAllowed: allowed, rng: () => { draws++; return .5; } });
  const state = getTacticalState(battle); state.positions.shepard.x = 900; state.bounds.minX = -900;
  assert.notEqual(getTacticalPosition(battle, 'shepard').x, 900);
  blocked = true;
  const before = snapshot(battle), result = order(battle, 'shepard', 'advance', 'shepard');
  assert.equal(result.ok, false, 'A free endpoint across a thin blocked strip is insufficient');
  assert.match(result.reason, /passage|sol/); assert.equal(snapshot(battle), before); assert.equal(draws, 0);
  assert.throws(() => fixture({ tacticalPositionAllowed: () => false }), /praticable/);
});

test('a coordinated draft can be inspected or discarded with no state/randomness change and shared healing is reserved atomically', () => {
  let draws = 0;
  const battle = fixture({ medigel: 1, party: [party('shepard', { hp: 50 }), party('kaidan', { hp: 50 })], rng: () => { draws++; return .5; } });
  const before = snapshot(battle);
  const draft = { orders: [{ actorId: 'shepard', actionId: 'medigel', targetId: 'shepard' }, { actorId: 'kaidan', actionId: 'medigel', targetId: 'kaidan' }] };
  assert.equal(planCoordinatedOrder(battle, draft).ok, false);
  assert.equal(performCoordinatedOrder(battle, draft).ok, false);
  assert.equal(snapshot(battle), before); assert.equal(draws, 0);
  const valid = { orders: [{ actorId: 'shepard', actionId: 'shoot', targetId: 'geth' }, { actorId: 'kaidan', actionId: 'cover' }] };
  const plan = planCoordinatedOrder(battle, valid); assert.equal(plan.ok, true);
  plan.orders[0].targetId = 'missing';
  assert.equal(snapshot(battle), before); assert.equal(draws, 0, 'Discarding the detached draft never spends anything');
});

test('coordinated orders prevalidate all participants, powers, targets, range and readiness before any partial commitment', () => {
  let draws = 0;
  const battle = fixture({ rng: () => { draws++; return .5; } });
  const valid = { actorId: 'shepard', actionId: 'shoot', targetId: 'geth' };
  const sparse = [valid]; sparse.length = 2;
  assert.equal(planCoordinatedOrder(battle, null).ok, false);
  assert.equal(planCoordinatedOrder(battle, { orders: sparse }).ok, false);
  for (const orders of [[valid], [valid, valid], [valid, { actorId: 'geth', actionId: 'shoot', targetId: 'shepard' }],
    [valid, { actorId: 'kaidan', actionId: 'singularity', targetId: 'geth' }], [valid, { actorId: 'kaidan', actionId: 'shoot', targetId: 'missing' }]]) {
    const before = snapshot(battle); assert.equal(performCoordinatedOrder(battle, { orders }).ok, false); assert.equal(snapshot(battle), before); assert.equal(draws, 0);
  }
  actor(battle, 'kaidan').atb = 99;
  const before = snapshot(battle);
  assert.equal(performCoordinatedOrder(battle, { orders: [valid, { actorId: 'kaidan', actionId: 'throw', targetId: 'geth' }] }).ok, false);
  assert.equal(snapshot(battle), before); assert.equal(draws, 0);
});

test('a genuine lift/throw sequence consumes each participant and its native cooldown without granting a power or damage bonus', () => {
  const input = { party: [party('shepard', { powers: ['lift'] }), party('kaidan', { powers: ['throw'] })], enemies: [enemy()], tactical: true, seed: 2183 };
  const coordinated = createBattle(input), sequential = createBattle(input);
  const orders = [{ actorId: 'shepard', actionId: 'lift', targetId: 'geth' }, { actorId: 'kaidan', actionId: 'throw', targetId: 'geth' }];
  const committed = performCoordinatedOrder(coordinated, { orders });
  for (const action of orders) assert.equal(performAction(sequential, action).ok, true);
  assert.equal(committed.ok, true); assert.equal(committed.applied.length, 2); assert.deepEqual(committed.cancelled, []);
  assert.equal(actor(coordinated, 'shepard').atb, 0); assert.equal(actor(coordinated, 'kaidan').atb, 0);
  assert.equal(actor(coordinated, 'shepard').cooldowns.lift, 10); assert.equal(actor(coordinated, 'kaidan').cooldowns.throw, 7);
  assert.deepEqual(coordinated.actors, sequential.actors); assert.deepEqual(summarizeBattle(coordinated), summarizeBattle(sequential));
  assert.equal(coordinated._rng(), sequential._rng(), 'Coordination adds no hidden random roll');
});

test('a later invalidated participant/target is explicitly cancelled for free; the initial accepted order stays resolved', () => {
  const battle = fixture({ enemies: [enemy('geth', { hp: 1, maxHp: 1 })] });
  const draft = { orders: [{ actorId: 'shepard', actionId: 'shoot', targetId: 'geth' }, { actorId: 'kaidan', actionId: 'shoot', targetId: 'geth' }] };
  const result = performCoordinatedOrder(battle, draft);
  assert.equal(result.ok, true); assert.equal(result.applied.length, 1); assert.equal(result.cancelled.length, 1);
  assert.equal(actor(battle, 'shepard').atb, 0); assert.equal(actor(battle, 'shepard').heat, 24);
  assert.equal(actor(battle, 'kaidan').atb, 100); assert.equal(actor(battle, 'kaidan').heat, 0);
  assert.equal(battle.actionCount, 1); assert.equal(battle.events.filter(event => event.type === 'coordinatedCancel').length, 1);
  assert.equal(battle.winner, 'party');
});

test('a single-target range gate is also respected by enemy AI, which closes distance before organic contact', () => {
  const battle = fixture({ party: [party('shepard', { atb: 0 })], enemies: [enemy('varren', { atb: 100, primaryAction: 'strike', synthetic: false })], mode: 'active' });
  const before = getTacticalPosition(battle, 'varren'), hp = actor(battle, 'shepard').hp;
  autoEnemyActions(battle);
  assert.equal(actor(battle, 'shepard').hp, hp);
  assert.ok(getTacticalPosition(battle, 'varren').x < before.x);
  assert.equal(actor(battle, 'varren').atb, 0);
  const event = battle.events.find(event => event.type === 'action' && event.actorId === 'varren');
  assert.equal(event.actionId, 'advance');
});

test('Wait coordination becomes possible through explicitly reserving a naturally ready gauge, without forcing ATB or freezing enemies', () => {
  const battle = fixture({ party: [party('shepard', { atb: 0, speed: 1 }), party('kaidan', { atb: 0, speed: 1.2 })],
    enemies: [enemy('geth', { atb: 0, speed: 1 })], mode: 'wait' });
  tickBattle(battle, 10);
  assert.equal(actor(battle, 'kaidan').atb, 100); assert.ok(actor(battle, 'shepard').atb < 100);
  const firstTime = battle.elapsed, hp = actor(battle, 'kaidan').hp;
  const reserved = reserveTacticalOrder(battle, 'kaidan'); assert.equal(reserved.ok, true);
  assert.equal(actor(battle, 'kaidan').atb, 100); assert.equal(actor(battle, 'kaidan').heat, 0);
  assert.deepEqual(getTacticalState(battle).reservedActorIds, ['kaidan']);
  tickBattle(battle, 10);
  assert.ok(battle.elapsed > firstTime); assert.equal(actor(battle, 'shepard').atb, 100);
  assert.ok(battle.events.some(event => event.type === 'action' && event.actorId === 'geth'), 'Reservation permits an enemy order while waiting for the other gauge');
  assert.ok(actor(battle, 'kaidan').hp <= hp);
  const draft = { orders: [{ actorId: 'kaidan', actionId: 'shoot', targetId: 'geth' }, { actorId: 'shepard', actionId: 'shoot', targetId: 'geth' }] };
  assert.equal(planCoordinatedOrder(battle, draft).ok, true);
  const result = performCoordinatedOrder(battle, draft); assert.equal(result.applied.length, 2);
  assert.deepEqual(getTacticalState(battle).reservedActorIds, []);
});

test('invalid reservations are pure, release restores Wait decisions, and cancelling an empty draft has no side effect', () => {
  let draws = 0;
  const battle = fixture({ party: [party('shepard', { atb: 0 }), party('kaidan')], rng: () => { draws++; return .5; } });
  const before = snapshot(battle);
  assert.equal(reserveTacticalOrder(battle, 'missing').ok, false); assert.equal(reserveTacticalOrder(battle, 'shepard').ok, false);
  assert.equal(reserveTacticalOrder(battle, 'geth').ok, false);
  assert.equal(releaseTacticalReservations(battle).ok, true); assert.equal(snapshot(battle), before); assert.equal(draws, 0);
  assert.equal(reserveTacticalOrder(battle, 'kaidan').ok, true);
  const held = snapshot(battle); assert.equal(reserveTacticalOrder(battle, 'kaidan').ok, false); assert.equal(snapshot(battle), held);
  assert.equal(releaseTacticalReservations(battle).ok, true); assert.equal(battle.waiting, true);
  const elapsed = battle.elapsed; tickBattle(battle, 2); assert.equal(battle.elapsed, elapsed);
  assert.equal(draws, 0);
});
