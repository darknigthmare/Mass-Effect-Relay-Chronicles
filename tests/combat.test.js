import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattle, tickBattle, performAction, getActions, autoEnemyActions, summarizeBattle } from '../src/combat.js';

const ally = (changes = {}) => ({ id: 'shepard', name: 'Shepard', hp: 100, maxHp: 100, shield: 40, maxShield: 40, attack: 24, defense: 3, speed: 1, powers: ['overload', 'stasis', 'lift', 'throw', 'warp', 'sabotage', 'hack', 'barrier', 'unity'], ...changes });
const foe = (changes = {}) => ({ id: 'geth', name: 'Geth', hp: 140, maxHp: 140, shield: 50, maxShield: 50, attack: 18, defense: 4, speed: 0.6, synthetic: true, powers: [], ...changes });
const build = (options = {}) => createBattle({ party: [ally()], enemies: [foe()], rng: () => 0.5, ...options });
const actor = (battle, id = 'shepard') => battle.actors.find(candidate => candidate.id === id);
const ready = (battle, id = 'shepard') => { actor(battle, id).atb = 100; };
const order = (battle, actionId, targetId = 'geth', actorId = 'shepard') => performAction(battle, { actorId, actionId, targetId });
const close = (actual, expected, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should be close to ${expected}`);

test('creation copies definitions, preserves explicit zero shields, and rejects duplicate ids', () => {
  const definition = ally({ powers: ['stasis'], shield: 0, statuses: { lift: 2 } });
  const battle = build({ party: [definition] });
  actor(battle).powers.push('warp');
  actor(battle).statuses.lift = 4;
  assert.deepEqual(definition.powers, ['stasis']);
  assert.equal(definition.statuses.lift, 2);
  assert.equal(actor(battle).shield, 0);
  assert.throws(() => createBattle({ party: [ally()], enemies: [foe({ id: 'shepard' })] }), /identifiant unique/);
});

test('a locked, untrained, or invalid-target action cannot spend resources', () => {
  const battle = build({ party: [ally({ powers: ['overload'] })] });
  assert.equal(order(battle, 'shoot').ok, false);
  ready(battle);
  const before = { heat: actor(battle).heat, atb: actor(battle).atb, count: battle.actionCount, events: battle.events.length };
  assert.equal(order(battle, 'singularity').ok, false);
  assert.equal(order(battle, 'shoot', 'missing').ok, false);
  assert.equal(order(battle, 'shoot', 'shepard').ok, false);
  assert.deepEqual({ heat: actor(battle).heat, atb: actor(battle).atb, count: battle.actionCount, events: battle.events.length }, before);
  assert.equal(getActions(battle, 'shepard').some(action => action.id === 'singularity'), false);
});

test('shots consume ATB, hit shields before health and respect armor on health damage', () => {
  const battle = build({ enemies: [foe({ shield: 10, maxShield: 10 })] });
  ready(battle);
  assert.equal(order(battle, 'shoot').ok, true);
  close(actor(battle, 'geth').shield, 0);
  close(actor(battle, 'geth').hp, 130); // 24 - 10 shield - 4 armor.
  assert.equal(actor(battle).atb, 0);
  assert.equal(actor(battle).heat, 24);
  assert.equal(order(battle, 'shoot').ok, false);
});

test('cover reduces weapon damage and reposition allows the next shot to bypass it', () => {
  const battle = build({ enemies: [foe({ shield: 100, maxShield: 100, cover: true })] });
  ready(battle);
  order(battle, 'shoot');
  close(actor(battle, 'geth').shield, 88);
  ready(battle);
  order(battle, 'reposition', 'shepard');
  ready(battle);
  order(battle, 'shoot');
  close(actor(battle, 'geth').shield, 64);
  assert.equal(actor(battle).statuses.flanking, undefined);
});

test('wait mode pauses at a ready ally and freezes time, heat, status and cooldowns', () => {
  const battle = build();
  tickBattle(battle, 12);
  close(battle.elapsed, 5);
  assert.equal(battle.waiting, true);
  assert.equal(actor(battle).atb, 100);
  actor(battle).heat = 60;
  actor(battle).cooldowns.overload = 8;
  const enemyAtb = actor(battle, 'geth').atb;
  tickBattle(battle, 20);
  close(battle.elapsed, 5);
  assert.equal(actor(battle).heat, 60);
  assert.equal(actor(battle).cooldowns.overload, 8);
  assert.equal(actor(battle, 'geth').atb, enemyAtb);
  order(battle, 'cover', 'shepard');
  tickBattle(battle, 1);
  close(battle.elapsed, 6);
  assert.ok(actor(battle).heat < 60);
  close(actor(battle).cooldowns.overload, 7);
});

test('explicit pause freezes active mode and invalid dt has no effect', () => {
  const battle = build({ mode: 'active' });
  tickBattle(battle, 2, { paused: true });
  tickBattle(battle, NaN);
  tickBattle(battle, -2);
  assert.equal(battle.elapsed, 0);
  tickBattle(battle, 1);
  close(battle.elapsed, 1);
  close(actor(battle).atb, 20);
});

test('overheat prevents weapon attacks until cooled but permits tactical actions', () => {
  const battle = build({ mode: 'active', enemies: [foe({ speed: 0.1, hp: 1000, maxHp: 1000 })] });
  actor(battle).heat = 90;
  ready(battle);
  assert.equal(order(battle, 'burst').ok, true);
  assert.equal(actor(battle).overheated, true);
  assert.equal(actor(battle).heat, 100);
  ready(battle);
  assert.equal(order(battle, 'shoot').ok, false);
  assert.equal(order(battle, 'cover', 'shepard').ok, true);
  tickBattle(battle, 8);
  assert.equal(actor(battle).overheated, false);
  ready(battle);
  assert.equal(order(battle, 'shoot').ok, true);
});

test('powers cannot be reused during their recharge and cooldown expires in simulated time', () => {
  const battle = build({ mode: 'active', enemies: [foe({ speed: 0.1, hp: 1000, maxHp: 1000 })] });
  ready(battle);
  order(battle, 'overload');
  ready(battle);
  assert.equal(order(battle, 'overload').ok, false);
  const disabledAction = getActions(battle, 'shepard').find(action => action.id === 'overload');
  assert.match(disabledAction.reason, /Recharge/);
  tickBattle(battle, 8);
  assert.equal(order(battle, 'overload').ok, true);
});

test('stasis immobilizes and protects from weapon, power, and periodic damage', () => {
  const battle = build({ mode: 'active' });
  ready(battle);
  order(battle, 'warp');
  ready(battle);
  order(battle, 'stasis');
  const enemy = actor(battle, 'geth');
  const hp = enemy.hp;
  const shield = enemy.shield;
  ready(battle, 'geth');
  assert.equal(order(battle, 'shoot', 'shepard', 'geth').ok, false);
  ready(battle);
  order(battle, 'shoot');
  close(enemy.hp, hp);
  close(enemy.shield, shield);
  tickBattle(battle, 2);
  close(enemy.hp, hp);
  close(enemy.shield, shield);
  assert.equal(enemy.atb, 100); // Preserved, never used while immobilized.
});

test('lift prevents actions and an immune boss resists displacement', () => {
  const battle = build();
  ready(battle);
  order(battle, 'lift');
  ready(battle, 'geth');
  assert.equal(order(battle, 'shoot', 'shepard', 'geth').ok, false);
  const bossBattle = build({ enemies: [foe({ controlImmune: true })] });
  ready(bossBattle);
  order(bossBattle, 'lift');
  assert.equal(actor(bossBattle, 'geth').statuses.lift, undefined);
  assert.ok(bossBattle.events.some(event => event.type === 'resist'));
});

test('sabotage blocks gunfire but leaves trained powers usable', () => {
  const battle = build({ enemies: [foe({ powers: ['overload'] })] });
  ready(battle);
  order(battle, 'sabotage');
  ready(battle, 'geth');
  assert.equal(order(battle, 'shoot', 'shepard', 'geth').ok, false);
  assert.equal(order(battle, 'overload', 'shepard', 'geth').ok, true);
});

test('hacking rejects organics and makes a synthetic attack its own camp', () => {
  const battle = build({ enemies: [foe(), foe({ id: 'merc', name: 'Mercenaire', synthetic: false, shield: 0, maxShield: 0 })] });
  ready(battle);
  assert.equal(order(battle, 'hack', 'merc').ok, false);
  assert.equal(actor(battle).atb, 100);
  assert.equal(order(battle, 'hack').ok, true);
  ready(battle, 'geth');
  const oldHp = actor(battle, 'merc').hp;
  autoEnemyActions(battle);
  assert.ok(actor(battle, 'merc').hp < oldHp);
  assert.equal(actor(battle, 'geth').team, 'enemy');
  assert.equal(battle.winner, null);
});

test('medi-gel is shared, cannot target enemies or KO allies, and Unity revives KO allies', () => {
  const battle = build({ party: [ally({ hp: 30 }), ally({ id: 'garrus', name: 'Garrus', hp: 0 })], medigel: 1 });
  ready(battle);
  assert.equal(order(battle, 'medigel', 'geth').ok, false);
  assert.equal(order(battle, 'medigel', 'garrus').ok, false);
  assert.equal(order(battle, 'medigel', 'shepard').ok, true);
  assert.ok(actor(battle).hp > 30);
  assert.equal(battle.medigel, 0);
  ready(battle);
  assert.equal(order(battle, 'medigel', 'shepard').ok, false);
  assert.equal(order(battle, 'unity').ok, true);
  assert.equal(actor(battle, 'garrus').hp, 30);
  assert.equal(actor(battle, 'garrus').atb, 0);
  assert.equal(battle.medigel, 0);
});

test('an organic without shields takes no health damage from Overload', () => {
  const battle = build({ enemies: [foe({ synthetic: false, shield: 0, maxShield: 0 })] });
  ready(battle);
  order(battle, 'overload');
  assert.equal(actor(battle, 'geth').hp, 140);
});

test('signature needs full concentration, uses the weapon, and consumes its charge', () => {
  const battle = build();
  ready(battle);
  assert.equal(order(battle, 'signature').ok, false);
  actor(battle).focus = 100;
  assert.equal(order(battle, 'signature').ok, true);
  assert.equal(actor(battle).focus, 0);
  assert.equal(actor(battle).heat, 42);
});

test('victory is emitted once, defeated units cannot act, and completed battles are immutable to orders/ticks', () => {
  const battle = build({ enemies: [foe({ hp: 4, shield: 0, maxShield: 0, defense: 0 })] });
  ready(battle);
  order(battle, 'shoot');
  assert.equal(battle.winner, 'party');
  assert.equal(actor(battle, 'geth').hp, 0);
  ready(battle, 'geth');
  assert.equal(order(battle, 'shoot', 'shepard', 'geth').ok, false);
  const elapsed = battle.elapsed;
  const count = battle.events.length;
  tickBattle(battle, 20);
  autoEnemyActions(battle);
  assert.equal(battle.elapsed, elapsed);
  assert.equal(battle.events.length, count);
  assert.equal(battle.events.filter(event => event.type === 'victory').length, 1);
  assert.equal(summarizeBattle(battle).defeatedEnemies, 1);
});

test('enemy actions can defeat the commando and cannot execute twice without another ATB cycle', () => {
  const battle = build({ party: [ally({ hp: 8, shield: 0, maxShield: 0, defense: 0 })] });
  ready(battle, 'geth');
  autoEnemyActions(battle);
  assert.equal(battle.winner, 'enemy');
  const count = battle.actionCount;
  autoEnemyActions(battle);
  assert.equal(battle.actionCount, count);
});

test('seeded active simulations reproduce enemy decisions and damage exactly', () => {
  const options = { mode: 'active', seed: 127, rng: undefined, party: [ally({ hp: 1500, maxHp: 1500 })], enemies: [foe({ powers: ['overload', 'sabotage'] })] };
  const first = build(options);
  const second = build(options);
  for (let step = 0; step < 200; step += 1) {
    tickBattle(first, 0.1);
    tickBattle(second, 0.1);
  }
  assert.deepEqual(summarizeBattle(first), summarizeBattle(second));
  assert.deepEqual(first.events, second.events);
});

test('periodic Warp damage remains four per second, independent of fractional frame duration', () => {
  const battle = build({ mode: 'active', enemies: [foe({ shield: 0, maxShield: 0, defense: 0, speed: 0.1 })] });
  ready(battle);
  order(battle, 'warp');
  const hpAfterCast = actor(battle, 'geth').hp;
  for (let frame = 0; frame < 120; frame += 1) tickBattle(battle, 1 / 60);
  close(actor(battle, 'geth').hp, hpAfterCast - 8);
});

test('direct enemy AI calls respect the player decision pause and all ready allies must issue orders', () => {
  const battle = build({ party: [ally(), ally({ id: 'liara', name: 'Liara' })] });
  ready(battle);
  ready(battle, 'liara');
  ready(battle, 'geth');
  autoEnemyActions(battle);
  assert.equal(battle.actionCount, 0);
  order(battle, 'cover', 'shepard');
  tickBattle(battle, 1);
  assert.equal(battle.elapsed, 0);
  autoEnemyActions(battle);
  assert.equal(battle.actionCount, 1);
  order(battle, 'cover', 'liara', 'liara');
  autoEnemyActions(battle);
  assert.equal(battle.actionCount, 3);
});

test('periodic damage can end a battle and is not applied again to a defeated target', () => {
  const battle = build({ mode: 'active', enemies: [foe({ hp: 33, shield: 0, maxShield: 0, defense: 0, speed: 0.1 })] });
  ready(battle);
  order(battle, 'warp');
  tickBattle(battle, 2);
  assert.equal(battle.winner, 'party');
  assert.equal(actor(battle, 'geth').hp, 0);
  assert.equal(battle.events.filter(event => event.type === 'defeat').length, 1);
});

test('organic attackers strike without guns, weapon heat, or cover protection', () => {
  const battle = build({ mode: 'active', enemies: [foe({ primaryAction: 'strike', synthetic: false })] });
  actor(battle).cover = true;
  ready(battle, 'geth');
  const ids = getActions(battle, 'geth').map(action => action.id);
  assert.equal(ids.includes('shoot'), false);
  assert.equal(ids.includes('burst'), false);
  assert.equal(ids.includes('strike'), true);
  assert.equal(order(battle, 'shoot', 'shepard', 'geth').ok, false);
  autoEnemyActions(battle);
  assert.equal(actor(battle, 'geth').heat, 0);
  close(actor(battle).shield, 40 - 18 * 1.85); // Full normal damage despite cover.
  assert.ok(battle.events.some(event => event.type === 'action' && event.actionId === 'strike'));
});

test('acid is an organic attack with its own corrosion, not biotic Warp', () => {
  const battle = build({ mode: 'active', enemies: [foe({ primaryAction: 'acid', synthetic: false, speed: 0.1 })], party: [ally({ shield: 0, maxShield: 0, defense: 0 })] });
  ready(battle, 'geth');
  assert.equal(order(battle, 'acid', 'shepard', 'geth').ok, true);
  assert.equal(actor(battle, 'geth').heat, 0);
  assert.equal(actor(battle).statuses.warp, undefined);
  assert.equal(actor(battle).statuses.corrosion, 5);
  const hpAfterAcid = actor(battle).hp;
  tickBattle(battle, 1);
  close(actor(battle).hp, hpAfterAcid - 3 * 1.85); // Normal scales periodic enemy damage too.
});

test('protected synthetic bosses cannot be hacked and rejected orders are free', () => {
  const battle = build({ enemies: [foe({ hackImmune: true }), foe({ id: 'other' })] });
  ready(battle);
  assert.equal(order(battle, 'hack').ok, false);
  assert.equal(actor(battle).atb, 100);
  assert.equal(actor(battle, 'geth').statuses.hacked, undefined);
  assert.equal(order(battle, 'hack', 'other').ok, true);
});

test('Sabotage never assigns weapon heat to an organic attacker', () => {
  const battle = build({ enemies: [foe({ primaryAction: 'acid', synthetic: false }), foe({ id: 'armed' })] });
  ready(battle);
  assert.equal(order(battle, 'sabotage').ok, false);
  assert.equal(actor(battle).atb, 100);
  assert.equal(actor(battle, 'geth').heat, 0);
  assert.equal(actor(battle, 'geth').statuses.sabotage, undefined);
  assert.equal(order(battle, 'sabotage', 'armed').ok, true);
  const organicOnly = build({ enemies: [foe({ primaryAction: 'strike' })] });
  ready(organicOnly);
  assert.equal(getActions(organicOnly, 'shepard').find(action => action.id === 'sabotage').available, false);
});

test('enemy targeting avoids invulnerable stasis when another target is available', () => {
  const battle = build({ mode: 'active', rng: () => 0, party: [ally({ statuses: { stasis: 5 } }), ally({ id: 'liara' })] });
  ready(battle, 'geth');
  const shepardShield = actor(battle).shield;
  const liaraShield = actor(battle, 'liara').shield;
  autoEnemyActions(battle);
  assert.equal(actor(battle).shield, shepardShield);
  assert.ok(actor(battle, 'liara').shield < liaraShield);
});

test('exposed shields recover slowly after a long delay while cover restores them sooner', () => {
  function damaged(cover) {
    const battle = build({ mode: 'active', party: [ally({ shield: 200, maxShield: 200 })], enemies: [foe({ attack: 40, speed: 0.1 })] });
    ready(battle, 'geth');
    order(battle, 'shoot', 'shepard', 'geth');
    if (cover) {
      ready(battle);
      order(battle, 'cover', 'shepard');
    }
    return battle;
  }
  const exposed = damaged(false);
  const covered = damaged(true);
  const afterHit = actor(exposed).shield;
  close(actor(covered).shield, afterHit);
  tickBattle(exposed, 6);
  tickBattle(covered, 6);
  close(actor(exposed).shield, afterHit);
  assert.ok(actor(covered).shield >= afterHit + 31 && actor(covered).shield <= afterHit + 33);
  tickBattle(exposed, 2);
  tickBattle(covered, 2);
  assert.ok(actor(exposed).shield >= afterHit + 0.9 && actor(exposed).shield <= afterHit + 1.1);
  assert.ok(actor(covered).shield > actor(exposed).shield + 45);

  ready(covered, 'geth');
  order(covered, 'shoot', 'shepard', 'geth');
  const hitAgain = actor(covered).shield;
  tickBattle(covered, 1.5);
  close(actor(covered).shield, hitAgain); // Every actual hit restarts the delay.
});

test('focused targeting pressures exposed wounds and covering changes enemy priority', () => {
  function enemyTarget(cover) {
    const battle = build({ mode: 'active', rng: () => 0, party: [ally(), ally({ id: 'liara', hp: 60, shield: 20, cover })] });
    ready(battle, 'geth');
    autoEnemyActions(battle);
    return battle.events.find(event => event.type === 'damage').targetId;
  }
  assert.equal(enemyTarget(false), 'liara');
  assert.equal(enemyTarget(true), 'shepard');
});

test('story difficulty retains slower, gentler enemies than normal without changing party speed', () => {
  const samples = {};
  for (const difficulty of ['story', 'normal']) {
    const battle = build({ mode: 'active', difficulty });
    ready(battle, 'geth');
    order(battle, 'shoot', 'shepard', 'geth');
    const damage = 40 - actor(battle).shield;
    tickBattle(battle, 2);
    samples[difficulty] = { damage, enemyAtb: actor(battle, 'geth').atb, partyAtb: actor(battle).atb };
  }
  close(samples.story.damage, 18 * 0.65);
  close(samples.normal.damage, 18 * 1.85);
  assert.ok(samples.story.enemyAtb < samples.normal.enemyAtb);
  close(samples.story.partyAtb, samples.normal.partyAtb);
});
