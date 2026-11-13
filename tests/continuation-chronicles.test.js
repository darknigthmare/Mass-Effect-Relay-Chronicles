import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattle, getActions, getTargetAvailability, performAction, tickBattle } from '../src/combat.js';
import { createChronicle, setChronicleBuild, startChronicleBattle, buildChronicleActor, encodeChronicle, decodeChronicle } from '../src/chronicles.js';
import { CHRONICLE_SCENARIOS, universeActorFor } from '../src/universe-actors.js';
import { getUniverseRecord } from '../src/universe-data.js';
import { signatureActionAllowed, planSignatureAction, signatureIncomingDamageMultiplier } from '../src/completion-chronicles-powers.js';
import { initializeChroniclePositions, getChroniclePosition, getChroniclePositionState, planChronicleCharge,
  planChronicleMove, CHRONICLE_CHARGE_RANGE, CHRONICLE_CONTACT_DISTANCE } from '../src/continuation-chronicles-positions.js';

const context = mediaId => ({ mediaId, periodId: mediaId.toLowerCase() });
const approx = (left, right) => assert.ok(Math.abs(left - right) < 1e-7, `${left} != ${right}`);
const distance = (left, right) => Math.hypot(left.x - right.x, left.z - right.z);
function fixture(mediaId = 'ME2', buildId = 'vanguard') {
  const id = `${mediaId}-CHR-SHEPARD`;
  const initial = createChronicle(context(mediaId), `${mediaId.toLowerCase()}-equipment-workshop`);
  initial.party = [id];
  // Native tests declare a one-member workshop and ready actor before testing
  // any order; the browser collector uses actual menus and real ATB time.
  for (const field of ['builds', 'loadouts', 'ammoModes']) initial[field] = { [id]: initial[field][id] };
  const session = setChronicleBuild(initial, id, buildId).session;
  const { battle } = startChronicleBattle(session);
  battle.mode = 'active'; battle.actors[0].atb = 100;
  return { session, battle, actor: battle.actors[0], target: battle.actors[1] };
}
const order = (battle, actionId, targetId = battle.actors[1].id) => performAction(battle, { actorId: battle.actors[0].id, actionId, targetId });

test('local positions initialize only the main ME2/ME3 periods and stay separate from ME1 tactical state', () => {
  for (const scenario of CHRONICLE_SCENARIOS) {
    const session = createChronicle(scenario.context, scenario.id), result = startChronicleBattle(session);
    assert.equal(result.ok, true, scenario.id);
    const expected = ['ME2', 'ME3'].includes(scenario.context.mediaId)
      && scenario.context.periodId === scenario.context.mediaId.toLowerCase();
    assert.equal(getChroniclePositionState(result.battle) !== null, expected, scenario.id);
    assert.equal(result.battle.tactical, undefined);
  }
  const { battle } = fixture(), snapshot = JSON.stringify(battle);
  for (const invalid of [context('ME1'), context('MEA'), { mediaId: 'ME2', periodId: 'me2-opening' }, context('ME3')]) {
    assert.equal(initializeChroniclePositions(battle, invalid), false);
    assert.equal(JSON.stringify(battle), snapshot);
  }
});

test('position getters and preview plans are detached, deterministic and resource-free', () => {
  const { battle, actor, target } = fixture(); let draws = 0;
  battle._rng = () => { draws++; return .5; };
  const before = JSON.stringify(battle), position = getChroniclePosition(battle, actor.id), state = getChroniclePositionState(battle);
  position.x = 999; state.positions[actor.id].z = 999; state.bounds.minX = 999;
  const first = planChronicleCharge(battle, actor, target), second = planChronicleCharge(battle, actor, target);
  assert.equal(first.ok, true); assert.deepEqual(first, second);
  const preview = getTargetAvailability(battle, { actorId: actor.id, actionId: 'bioticCharge', targetId: target.id });
  assert.equal(preview.ok, true); assert.equal(preview.range, CHRONICLE_CHARGE_RANGE);
  assert.deepEqual(preview.movement, { from: first.from, to: first.to });
  assert.equal(JSON.stringify(battle), before); assert.equal(draws, 0);
});

test('Charge commits real ATB coordinates, native costs and impact exactly once in both allowed works', () => {
  for (const mediaId of ['ME2', 'ME3']) {
    const { battle, actor, target } = fixture(mediaId);
    actor.cover = true; actor.shield = 0;
    const original = getChroniclePosition(battle, actor.id), targetPosition = getChroniclePosition(battle, target.id);
    const ammo = actor.ammo, reserve = actor.reserveAmmo, plan = planSignatureAction({ battle, actor, actionId: 'bioticCharge', targets: [target] });
    assert.equal(plan.ok, true); assert.ok(plan.displacement);
    const result = order(battle, 'bioticCharge'); assert.equal(result.ok, true);
    const after = getChroniclePosition(battle, actor.id);
    assert.notDeepEqual(after, original); assert.deepEqual(after, plan.displacement.to);
    approx(distance(after, targetPosition), CHRONICLE_CONTACT_DISTANCE);
    assert.equal(battle.chroniclePositions.revision, 1); assert.equal(actor.atb, 0); assert.equal(actor.cooldowns.bioticCharge, 12);
    assert.equal(actor.cover, false); assert.equal(actor.engagedTargetId, target.id); assert.equal(actor.shield, actor.maxShield * .5);
    assert.equal(actor.ammo, ammo); assert.equal(actor.reserveAmmo, reserve); assert.equal(actor.statuses.chargeExposure, 3);
    assert.equal(result.events.filter(event => event.type === 'chronicleDisplacement').length, 1);
    assert.equal(result.events.find(event => event.type === 'chronicleSignature').approach, 'atb-position-contact');
    const snapshot = JSON.stringify(battle); assert.equal(order(battle, 'bioticCharge').ok, false); assert.equal(JSON.stringify(battle), snapshot);
  }
});

test('out-of-range, already-contact, missing-position and dead-target refusals preserve all resources and RNG', () => {
  for (const condition of ['range', 'contact', 'position', 'dead']) {
    const { battle, actor, target } = fixture(); let draws = 0; battle._rng = () => { draws++; return .5; };
    if (condition === 'range') { battle.chroniclePositions.positions[actor.id] = { x: -8, z: -6 }; battle.chroniclePositions.positions[target.id] = { x: 8, z: 6 }; }
    if (condition === 'contact') battle.chroniclePositions.positions[actor.id] = { x: 2.2, z: -2.8 };
    if (condition === 'position') delete battle.chroniclePositions.positions[target.id];
    if (condition === 'dead') target.hp = 0;
    const snapshot = JSON.stringify(battle), result = order(battle, 'bioticCharge');
    assert.equal(result.ok, false, condition); assert.equal(JSON.stringify(battle), snapshot, condition); assert.equal(draws, 0);
  }
});

test('a blocked contact ring refuses Charge rather than overlapping a living body', () => {
  const { battle, actor, target } = fixture();
  const point = getChroniclePosition(battle, target.id), from = getChroniclePosition(battle, actor.id);
  const angle = Math.atan2(from.z - point.z, from.x - point.x);
  for (const [index, offset] of [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2, Math.PI].entries()) {
    const id = `blocker-${index}`;
    battle.actors.push({ id, hp: 1, team: 'enemy' });
    battle.chroniclePositions.positions[id] = { x: point.x + Math.cos(angle + offset) * 1.6, z: point.z + Math.sin(angle + offset) * 1.6 };
  }
  assert.equal(planChronicleCharge(battle, actor, target).ok, false);
});

test('a target moving through a native order invalidates its old destination preview', () => {
  const { battle, actor, target } = fixture(); target.atb = 100;
  const preview = getTargetAvailability(battle, { actorId: actor.id, actionId: 'bioticCharge', targetId: target.id });
  assert.equal(preview.ok, true);
  assert.equal(performAction(battle, { actorId: target.id, actionId: 'withdraw', targetId: target.id }).ok, true);
  assert.equal(order(battle, 'bioticCharge').ok, true);
  const arrived = getChroniclePosition(battle, actor.id);
  assert.notDeepEqual(arrived, preview.movement.to);
  approx(distance(arrived, getChroniclePosition(battle, target.id)), CHRONICLE_CONTACT_DISTANCE);
});

test('the displacement exposure actually increases an otherwise identical enemy hit by fifteen percent', () => {
  const normal = fixture(), charged = fixture();
  for (const setup of [normal, charged]) { setup.target.atb = 100; setup.battle._rng = () => .5; }
  assert.equal(order(charged.battle, 'bioticCharge').ok, true);
  const received = setup => {
    const before = setup.actor.hp + setup.actor.shield;
    assert.equal(performAction(setup.battle, { actorId: setup.target.id, actionId: 'shoot', targetId: setup.actor.id }).ok, true);
    return before - setup.actor.hp - setup.actor.shield;
  };
  approx(received(charged) / received(normal), 1.15);
});

test('advance and withdraw are actual independent ATB orders with bounded occupied destinations', () => {
  const { battle, actor, target } = fixture();
  const from = getChroniclePosition(battle, actor.id), targetPoint = getChroniclePosition(battle, target.id);
  assert.ok(getActions(battle, actor.id).find(action => action.id === 'advance').available);
  const planned = planChronicleMove(battle, actor, 'advance'), snapshot = JSON.stringify(battle);
  assert.equal(planned.ok, true); assert.equal(JSON.stringify(battle), snapshot);
  assert.equal(order(battle, 'advance', actor.id).ok, true);
  assert.ok(distance(getChroniclePosition(battle, actor.id), targetPoint) < distance(from, targetPoint));
  assert.equal(actor.atb, 0); assert.equal(battle.chroniclePositions.revision, 1);
  tickBattle(battle, 5.1); assert.equal(order(battle, 'withdraw', actor.id).ok, true);
  assert.ok(distance(getChroniclePosition(battle, actor.id), targetPoint) > distance(planned.to, targetPoint));
  const point = getChroniclePosition(battle, actor.id); assert.ok(point.x >= -8 && point.x <= 8 && point.z >= -6 && point.z <= 6);
});

test('Charge exposure freezes in pause and expires in real simulated time while its displacement remains', () => {
  const { battle, actor } = fixture(); assert.equal(order(battle, 'bioticCharge').ok, true);
  const position = getChroniclePosition(battle, actor.id);
  approx(signatureIncomingDamageMultiplier(actor), 1.15);
  tickBattle(battle, 9, { paused: true }); assert.equal(actor.statuses.chargeExposure, 3);
  tickBattle(battle, 3.05); assert.equal(actor.statuses.chargeExposure, undefined); assert.equal(signatureIncomingDamageMultiplier(actor), 1);
  assert.deepEqual(getChroniclePosition(battle, actor.id), position);
});

test('preparation export/reload stores class and equipment but no arena coordinates, effects or live outcome', () => {
  const { session, battle, actor } = fixture(); const encoded = encodeChronicle(session);
  assert.equal(order(battle, 'bioticCharge').ok, true);
  assert.equal(encodeChronicle(session), encoded);
  assert.doesNotMatch(encoded, /chroniclePositions|chargeExposure|engagedTargetId/);
  const resumed = startChronicleBattle(decodeChronicle(encoded)).battle;
  assert.deepEqual(getChroniclePosition(resumed, actor.id), { x: -3.8, z: 0 });
  assert.equal(resumed.chroniclePositions.revision, 0); assert.deepEqual(resumed.actors[0].statuses, {});
  assert.equal(resumed.actors[0].buildId, 'vanguard'); assert.equal(resumed.winner, null);
});

test('raw combat defaults and ME1 keep their original logs, geometry and power permissions', () => {
  const source = universeActorFor('ME2-CHR-SHEPARD', context('ME2'), 'vanguard', 'me2-equipment-workshop');
  const battle = createBattle({ party: [{ ...source, atb: 100 }], enemies: [{ id: 'dummy', hp: 500 }], mode: 'active' });
  assert.equal(getChroniclePositionState(battle), null); assert.equal(getActions(battle, source.id).some(action => action.id === 'advance'), false);
  const result = order(battle, 'bioticCharge'); assert.equal(result.ok, true);
  assert.equal(result.events.some(event => event.type === 'chronicleDisplacement'), false);
  assert.equal(result.events.find(event => event.type === 'chronicleSignature').approach, 'abstract-contact');
  const me1 = createBattle({ party: [{ id: 'shepard', mediaId: 'ME1', atb: 100 }], enemies: [{ id: 'enemy', hp: 500 }], tactical: true });
  assert.ok(me1.tactical); assert.equal(me1.chroniclePositions, undefined);
  assert.equal(signatureActionAllowed(me1.actors[0], 'bioticCharge'), false);
});

test('omni-blade stays closed because the existing animation is an unsourced production specification', () => {
  const record = getUniverseRecord('ME3-ANI-OMNIBLADE');
  assert.equal(record.fact, false); assert.deepEqual(record.sourceIds, []);
  for (const mediaId of ['ME2', 'ME3']) for (const buildId of ['soldier', 'engineer', 'adept', 'infiltrator', 'vanguard', 'sentinel']) {
    const actor = buildChronicleActor(setChronicleBuild(createChronicle(context(mediaId), `${mediaId.toLowerCase()}-equipment-workshop`), `${mediaId}-CHR-SHEPARD`, buildId).session, `${mediaId}-CHR-SHEPARD`);
    assert.equal(actor.powers.some(id => /omni.?blade|omni.?lame/i.test(id)), false);
  }
});
