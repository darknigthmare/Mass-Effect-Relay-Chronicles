import test from 'node:test';
import assert from 'node:assert/strict';
import { createBossPhasePlan, advanceBossPhases, bossActorCanAct,
  bossDamageBlocked, getBossTargetReason, getBossPhaseView } from '../src/boss-phases.js';
import { createBattle, getActions, performAction, tickBattle, summarizeBattle } from '../src/combat.js';
import { ENEMIES } from '../src/game-data.js';

const clone = value => structuredClone(value);
const actor = (id, team, sprite, hp, shield = 0, extra = {}) => ({ id, team, sprite, hp, maxHp: hp,
  shield, maxShield: shield, powers: [], cooldowns: {}, statuses: {}, atb: 0, attack: 20, defense: 4, speed: 1, ...extra });
function fixture(profileId = 'benezia') {
  const boss = profileId === 'benezia'
    ? actor('benezia-0', 'enemy', 'benezia', 340, 170, { boss: true, powers: ['throw', 'stasis', 'barrier'] })
    : actor('thorian-0', 'enemy', 'thorian', 420, 0, { boss: true, primaryAction: 'acid', hackImmune: true });
  return [actor('shepard', 'party', 'shepard', 250, 140), actor('kaidan', 'party', 'kaidan', 215, 140),
    actor('ashley', 'party', 'ashley', 240, 120), boss,
    profileId === 'benezia' ? actor('asari-1', 'enemy', 'asari', 150, 60) : actor('creeper-1', 'enemy', 'creeper', 125)];
}
function battleFor(profileId) {
  const plan = createBossPhasePlan(fixture(profileId), { enabled: true });
  return { actors: plan.actors, bossPhases: plan.state, events: [...plan.events], winner: null };
}
function apply(battle, plan) {
  assert.ok(plan); battle.bossPhases = plan.state;
  for (const id of plan.retireIds) battle.actors.find(actor => actor.id === id).bossPhaseRetired = true;
  for (const spawn of plan.spawns) {
    assert.ok(!battle.actors.some(actor => actor.id === spawn.id), 'A phase never reuses an actor identity');
    battle.actors.push(spawn);
  }
  battle.events.push(...plan.events);
}
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} ≠ ${expected}`);

test('boss phases require the explicit ME1 encounter opt-in and do not reinterpret other bosses or mixed formations', () => {
  const input = fixture(); assert.equal(createBossPhasePlan(input), null);
  assert.equal(createBossPhasePlan(input, { enabled: 'true' }), null);
  const foreign = clone(input); foreign[0].mediaId = 'ME2';
  assert.equal(createBossPhasePlan(foreign, { enabled: true }), null);
  const future = clone(input); future[3].periodId = 'me3';
  assert.equal(createBossPhasePlan(future, { enabled: true }), null);
  const saren = clone(input); saren[3].sprite = 'saren-final';
  assert.equal(createBossPhasePlan(saren, { enabled: true }), null);
  assert.equal(createBossPhasePlan([...input, actor('geth-extra', 'enemy', 'geth', 95)], { enabled: true }), null);
  assert.equal(createBossPhasePlan(input.slice(0, 4), { enabled: true }), null);
  const missingBudget = clone(input); delete missingBudget[3].maxHp;
  assert.equal(createBossPhasePlan(missingBudget, { enabled: true }), null);
});

test('initial phase plans are detached and divide the existing escort instead of healing or granting rewards', () => {
  const input = fixture(), before = clone(input), plan = createBossPhasePlan(input, { enabled: true });
  assert.deepEqual(input, before);
  assert.equal(plan.actors.find(actor => actor.id === 'benezia-0').hp, 340);
  assert.equal(plan.actors.find(actor => actor.id === 'benezia-0').shield, 170);
  assert.equal(plan.actors.find(actor => actor.id === 'asari-1').hp, 50);
  assert.equal(plan.actors.find(actor => actor.id === 'asari-1').shield, 20);
  plan.state.supportTemplate.powers.push('warp'); plan.actors[0].hp = 1;
  assert.deepEqual(input, before, 'Neither returned actors nor stored templates alias campaign definitions');
  assert.deepEqual(Object.keys(plan).sort(), ['actors', 'events', 'retireIds', 'state']);
  assert.ok(plan.events.every(event => event.type === 'bossPhase'), 'The phase module emits no victory or reward');
});

test('three distinct asari waves precede Benezia vulnerability without resetting her damage or defenses', () => {
  const battle = battleFor('benezia'), boss = battle.actors.find(actor => actor.sprite === 'benezia');
  boss.hp = 301; boss.shield = 77;
  assert.equal(bossDamageBlocked(battle, boss), true);
  assert.match(getBossTargetReason(battle, boss), /neutralisez/i);
  assert.equal(bossDamageBlocked(battle, battle.actors[0]), false);
  const seen = [], rawSpawns = [];
  for (let index = 0; index < 3; index++) {
    const current = battle.actors.find(actor => actor.id === battle.bossPhases.reinforcementIds[index]);
    seen.push(current); assert.equal(bossDamageBlocked(battle, current), false);
    assert.equal(advanceBossPhases(battle), null, 'A living escort cannot be skipped');
    current.hp = 0; current.shield = 0;
    const before = clone(battle), plan = advanceBossPhases(battle);
    assert.deepEqual(battle, before, 'Planning a transition has no side effects');
    assert.deepEqual(plan.retireIds, [current.id]);
    rawSpawns.push(...plan.spawns); apply(battle, plan);
    assert.equal(battle.bossPhases.phaseIndex, index + 1);
    assert.equal(bossDamageBlocked(battle, boss), index < 2);
    assert.equal(boss.hp, 301); assert.equal(boss.shield, 77);
    assert.equal(advanceBossPhases(battle), null, 'An applied transition is not emitted twice');
  }
  close(seen.reduce((sum, actor) => sum + actor.maxHp, 0), 150);
  close(seen.reduce((sum, actor) => sum + actor.maxShield, 0), 60);
  assert.equal(new Set(seen.map(actor => actor.id)).size, 3);
  assert.equal(rawSpawns.length, 2);
  assert.equal(getBossTargetReason(battle, boss), null);
  assert.equal(getBossPhaseView(battle).protectedActorId, null);
  assert.equal(getBossPhaseView(battle).objectiveActorId, boss.id);
  assert.equal(battle.winner, null, 'Opening a phase never awards victory');
});

test('six passive neural objectives preserve Thorian health, reuse one anchor and leave surviving creepers to combat', () => {
  const battle = battleFor('thorian'), anchorId = battle.bossPhases.bossId;
  const nodes = [], supports = [];
  for (let index = 0; index < 6; index++) {
    const view = getBossPhaseView(battle), node = battle.actors.find(actor => actor.id === view.objectiveActorId);
    assert.equal(view.phaseIndex, index); assert.equal(view.phaseCount, 6);
    assert.equal(node.hp, 70); assert.equal(node.tacticalAnchorId, anchorId);
    assert.equal(bossActorCanAct(battle, node), false);
    assert.equal(bossActorCanAct(battle, battle.actors[0]), true);
    assert.equal(bossDamageBlocked(battle, node), false, 'No invented neural invulnerability barrier');
    nodes.push(node); assert.equal(advanceBossPhases(battle), null);
    node.hp = 0;
    const plan = advanceBossPhases(battle);
    supports.push(...plan.spawns.filter(actor => actor.bossPhaseRole === 'reinforcement'));
    apply(battle, plan);
    assert.ok(battle.actors.filter(actor => actor.team === 'enemy' && actor.hp > 0).length <= 4);
    assert.equal(battle.winner, null);
  }
  const allSupports = battle.actors.filter(actor => actor.bossPhaseRole === 'reinforcement');
  assert.equal(supports.length, 2); assert.equal(allSupports.length, 3);
  close(nodes.reduce((sum, actor) => sum + actor.maxHp, 0), 420);
  close(allSupports.reduce((sum, actor) => sum + actor.maxHp, 0), 125);
  assert.equal(nodes.filter(actor => actor.bossPhaseRetired).length, 5);
  assert.equal(nodes[5].bossPhaseRetired, undefined, 'Only the final fallen node stays visible for the ending');
  assert.equal(getBossPhaseView(battle).objectiveActorId, null);
  assert.match(getBossPhaseView(battle).instruction, /rampants/i);
  assert.equal(allSupports.every(actor => actor.hp > 0), true, 'Node destruction never silently kills surviving opponents');
  assert.equal(advanceBossPhases(battle), null);
});

test('new phase identities avoid existing party IDs, and repeated pure reads consume no random state', () => {
  const input = fixture('thorian'); input[0].id = 'thorian-1'; input[1].id = 'creeper-0';
  const plan = createBossPhasePlan(input, { enabled: true }), ids = [...plan.state.nodeIds, ...plan.state.reinforcementIds, ...input.filter(actor => actor.team === 'party').map(actor => actor.id)];
  assert.equal(new Set(ids).size, ids.length);
  assert.ok([...plan.state.nodeIds, ...plan.state.reinforcementIds].every(id => /^(?:thorian|creeper)-\d+$/.test(id)), 'Existing combat atlas identity guards remain valid');
  let rngCalls = 0; const battle = { actors: plan.actors, bossPhases: plan.state, winner: null, _rng: () => ++rngCalls };
  const before = clone({ actors: battle.actors, state: battle.bossPhases });
  for (let i = 0; i < 3; i++) { getBossPhaseView(battle); bossDamageBlocked(battle, battle.actors[3]); advanceBossPhases(battle); }
  assert.equal(rngCalls, 0); assert.deepEqual({ actors: battle.actors, state: battle.bossPhases }, before);
});

test('a lost party or a terminal battle cannot spawn another wave, resurrect anyone or reopen combat', () => {
  const battle = battleFor('thorian'); battle.actors.find(actor => actor.bossPhaseRole === 'node').hp = 0;
  for (const actor of battle.actors.filter(actor => actor.team === 'party')) actor.hp = 0;
  const before = clone(battle); assert.equal(advanceBossPhases(battle), null); assert.deepEqual(battle, before);
  const terminal = battleFor('benezia'); terminal.winner = 'party'; terminal.actors.find(actor => actor.bossPhaseRole === 'reinforcement').hp = 0;
  assert.equal(advanceBossPhases(terminal), null);
  assert.equal(getBossPhaseView({ actors: [] }), null);
  assert.equal(bossActorCanAct({}, actor('generic', 'enemy', 'thorian', 1)), true);
});

// Explicit high-health/high-damage unit fixtures isolate transition ordering.
// They are not campaign-balance or public-browser victory evidence.
function nativeBattle(profileId, extras = {}) {
  const support = profileId === 'benezia' ? 'asari' : 'creeper';
  return createBattle({ party: [{ id: 'unit-hero', name: 'Fixture de transitions', sprite: 'shepard', mediaId: 'ME1',
    hp: 8000, maxHp: 8000, shield: 0, attack: 3000, defense: 1000, speed: 1, primaryAction: 'strike', powers: [], atb: 100 }],
  enemies: [{ ...ENEMIES[profileId], id: `${profileId}-0` }, { ...ENEMIES[support], id: `${support}-1` }],
  mode: 'active', difficulty: 'story', seed: 2183, bossPhases: true, tactical: false, ...extras });
}
function nativeStrike(battle, targetId) {
  let advances = 0;
  while (!getActions(battle, 'unit-hero').some(action => action.id === 'strike' && action.available) && advances++ < 4000 && !battle.winner) tickBattle(battle, .05);
  const result = performAction(battle, { actorId: 'unit-hero', actionId: 'strike', targetId });
  assert.equal(result.ok, true, result.reason);
  return result;
}

test('native hostile targeting rejects Benezia protection without consuming an order, heat or random numbers', () => {
  let randomCalls = 0; const battle = nativeBattle('benezia', { rng: () => { randomCalls++; return .5; } });
  const hero = battle.actors.find(actor => actor.id === 'unit-hero');
  const before = { atb: hero.atb, heat: hero.heat, actionCount: battle.actionCount, events: battle.events.length };
  const result = performAction(battle, { actorId: hero.id, actionId: 'strike', targetId: 'benezia-0' });
  assert.equal(result.ok, false); assert.match(result.reason, /protégée/i);
  assert.deepEqual({ atb: hero.atb, heat: hero.heat, actionCount: battle.actionCount, events: battle.events.length }, before);
  assert.equal(randomCalls, 0);
});

test('native Benezia waves resolve real actions before the single final victory, with no healing between stages', () => {
  const battle = nativeBattle('benezia');
  assert.equal(battle.bossPhases.profileId, 'benezia');
  for (let wave = 0; wave < 3; wave++) {
    const targetId = getBossPhaseView(battle).objectiveActorId;
    nativeStrike(battle, targetId);
    assert.equal(battle.bossPhases.phaseIndex, wave + 1); assert.equal(battle.winner, null);
    assert.equal(battle.events.filter(event => event.type === 'victory').length, 0);
  }
  nativeStrike(battle, 'benezia-0'); assert.equal(battle.winner, 'party');
  assert.equal(summarizeBattle(battle).defeatedEnemies, 4);
  assert.equal(battle.events.filter(event => event.type === 'victory').length, 1);
  const lastPhase = battle.events.filter(event => event.type === 'bossPhase').at(-1);
  assert.ok(lastPhase.id < battle.events.find(event => event.type === 'victory').id);
});

test('native neural nodes cannot act and spawning the next real target prevents premature victory', () => {
  const battle = nativeBattle('thorian');
  assert.deepEqual(getActions(battle, 'thorian-0'), []);
  const nodeOrder = performAction(battle, { actorId: 'thorian-0', actionId: 'acid', targetId: 'unit-hero' });
  assert.equal(nodeOrder.ok, false);
  for (let index = 0; index < 6; index++) {
    nativeStrike(battle, getBossPhaseView(battle).objectiveActorId);
    assert.equal(battle.bossPhases.phaseIndex, index + 1); assert.equal(battle.winner, null);
    assert.equal(battle.events.filter(event => event.type === 'victory').length, 0);
  }
  const supports = battle.actors.filter(actor => actor.bossPhaseRole === 'reinforcement' && actor.hp > 0);
  assert.equal(supports.length, 3);
  for (const support of supports) nativeStrike(battle, support.id);
  assert.equal(battle.winner, 'party'); assert.equal(summarizeBattle(battle).defeatedEnemies, 9);
  assert.equal(battle.events.filter(event => event.type === 'action' && battle.actors.some(actor => actor.id === event.actorId && actor.bossPhaseRole === 'node')).length, 0);
  assert.equal(battle.events.filter(event => event.type === 'victory').length, 1);
});
