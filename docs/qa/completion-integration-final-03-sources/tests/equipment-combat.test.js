import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattle, performAction, getActions, tickBattle } from '../src/combat.js';
import { newGame, encodeSave, decodeSave } from '../src/state.js';
import { CLASSES, CREW, actorFor, baseActorFor } from '../src/game-data.js';
import { buyItem, equipItem } from '../src/loadout.js';

function scenario(bonuses = {}, target = {}) {
  return createBattle({
    mode: 'active', rng: () => .5,
    party: [{ id: 'shepard', hp: 500, shield: 0, attack: 100, atb: 100, powers: ['warp', 'throw'], ...bonuses }],
    enemies: [{ id: 'target', hp: 1000, shield: 100, defense: 0, speed: .1, ...target }],
  });
}
const shoot = battle => performAction(battle, { actorId: 'shepard', actionId: 'shoot', targetId: 'target' });
const damage = result => result.events.find(event => event.type === 'damage');

test('weapon cooling and heat cost agree with displayed actions and preserve wait-mode pause', () => {
  const battle = scenario({ weaponHeatMultiplier: .75, weaponCoolingBonus: 3 });
  assert.equal(getActions(battle, 'shepard').find(action => action.id === 'shoot').heatCost, 18);
  assert.match(getActions(battle, 'shepard').find(action => action.id === 'shoot').description, /18 points/);
  shoot(battle);
  assert.equal(battle.actors[0].heat, 18);
  tickBattle(battle, .5);
  assert.ok(Math.abs(battle.actors[0].heat - 12) < 1e-7);
  battle.mode = 'wait'; battle.actors[0].atb = 100;
  const heat = battle.actors[0].heat;
  tickBattle(battle, 1);
  assert.equal(battle.actors[0].heat, heat);
});

test('organic and synthetic ammunition apply only to their target type', () => {
  const bonuses = { organicDamageBonus: .2, syntheticDamageBonus: .4 };
  assert.equal(damage(shoot(scenario(bonuses))).amount, 120);
  assert.equal(damage(shoot(scenario(bonuses, { synthetic: true }))).amount, 140);
  assert.equal(damage(shoot(scenario())).amount, 100);
});

test('ammunition bypass divides one hit without duplicating shield or health damage', () => {
  const result = damage(shoot(scenario({ shieldBypass: .5 })));
  assert.equal(result.shieldDamage, 50);
  assert.equal(result.healthDamage, 50);
  assert.equal(result.amount, 100);
  const armored = damage(shoot(scenario({ shieldBypass: .5 }, { defense: 10 })));
  assert.equal(armored.shieldDamage, 50);
  assert.equal(armored.healthDamage, 40);
});

test('ammunition modifiers do not affect powers and stasis still blocks every component', () => {
  const action = battle => performAction(battle, { actorId: 'shepard', actionId: 'warp', targetId: 'target' });
  const regular = damage(action(scenario()));
  const modified = damage(action(scenario({ organicDamageBonus: .8, shieldBypass: .7 })));
  assert.equal(modified.amount, regular.amount);
  assert.equal(modified.shieldDamage, regular.shieldDamage);
  const frozen = scenario({ organicDamageBonus: 1, shieldBypass: .75 }, { statuses: { stasis: 6 } });
  shoot(frozen);
  assert.equal(frozen.actors[1].hp, 1000);
  assert.equal(frozen.actors[1].shield, 100);
});

test('control resistance scales disabling duration without suppressing the attack', () => {
  const battle = scenario({}, { controlResistance: .25 });
  const result = performAction(battle, { actorId: 'shepard', actionId: 'throw', targetId: 'target' });
  assert.equal(result.ok, true);
  assert.ok(Math.abs(battle.actors[1].statuses.stagger - .9) < 1e-7);
  assert.ok(damage(result).amount > 0);
});

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} should equal ${expected}`);
const powerScenario = (bonuses = {}, target = {}) => scenario({ powers: ['throw', 'warp', 'overload', 'sabotage', 'lift', 'stasis', 'singularity', 'barrier', 'hack'], ...bonuses }, { shield: 0, synthetic: true, ...target });
function cast(battle, actionId) {
  battle.actors[0].atb = 100;
  const actorId = battle.actors[0].id;
  const result = performAction(battle, { actorId, actionId, targetId: actionId === 'barrier' ? actorId : 'target' });
  assert.equal(result.ok, true, result.reason);
  return result;
}

test('neutral starting loadouts preserve every class and companion base statistics and powers', () => {
  for (const classId of Object.keys(CLASSES)) {
    const state = newGame({ classId });
    for (const id of Object.keys(CREW)) {
      const base = baseActorFor(id, state), actor = actorFor(id, state);
      for (const key of ['hp', 'maxHp', 'shield', 'maxShield', 'attack', 'defense', 'speed']) assert.equal(actor[key], base[key], `${classId}/${id}/${key}`);
      assert.deepEqual(actor.powers, base.powers);
      const battle = createBattle({ party: [actor], enemies: [{ id: 'target', hp: 1000 }] });
      assert.equal(battle.actors[0].bioticMultiplier, 1);
      assert.equal(battle.actors[0].techMultiplier, 1);
    }
  }
});

test('biotic and technological amplification never strengthen the other power family or gunfire', () => {
  const biotic = powerScenario({ bioticMultiplier: 1.5 }), tech = powerScenario({ techMultiplier: 1.2 });
  close(damage(cast(biotic, 'throw')).amount, 94 * 1.5);
  close(damage(cast(tech, 'throw')).amount, 94);
  close(damage(cast(powerScenario({ bioticMultiplier: 1.5 }), 'overload')).amount, 114);
  close(damage(cast(powerScenario({ techMultiplier: 1.2 }), 'overload')).amount, 114 * 1.2);
  close(damage(shoot(powerScenario({ bioticMultiplier: 1.5, techMultiplier: 1.2 }))).amount, 100);
});

test('amplified control descriptions, resistance, shields and technology use their real duration and magnitude', () => {
  const frozen = powerScenario({ bioticMultiplier: 1.5 }, { controlResistance: .25 });
  assert.match(getActions(frozen, 'shepard').find(action => action.id === 'stasis').description, /9 secondes/);
  cast(frozen, 'stasis'); close(frozen.actors[1].statuses.stasis, 6.75);
  cast(frozen, 'warp'); shoot(frozen);
  assert.equal(frozen.actors[1].hp, 1000);
  const shielded = powerScenario({ shield: 0, maxShield: 200, bioticMultiplier: 1.25, techMultiplier: 2 });
  cast(shielded, 'barrier'); close(shielded.actors[0].shield, 170); close(shielded.actors[0].statuses.barrier, 10);
  const disrupted = powerScenario({ techMultiplier: 1.2, bioticMultiplier: 2 });
  cast(disrupted, 'sabotage'); close(disrupted.actors[1].statuses.sabotage, 7.2); close(disrupted.actors[1].heat, 42);
});

test('amplified Warp damage remains stable across fractional simulation slices', () => {
  const large = powerScenario({ bioticMultiplier: 1.5 }), small = powerScenario({ bioticMultiplier: 1.5 });
  cast(large, 'warp'); cast(small, 'warp');
  const hp = large.actors[1].hp;
  tickBattle(large, 2); for (let i = 0; i < 40; i++) tickBattle(small, .05);
  close(hp - large.actors[1].hp, 12); close(large.actors[1].hp, small.actors[1].hp);
});

test('purchased tools affect actual equipped companion powers once, survive a save, and grant no abilities', () => {
  const battleFor = actor => createBattle({ mode: 'active', rng: () => .5, party: [actor], enemies: [{ id: 'target', hp: 1000, shield: 0, defense: 0, synthetic: true }] });
  for (const [itemId, family] of [['biotic-amp-upgraded', 'biotic'], ['omni-tool-upgraded', 'tech']]) {
    const state = newGame(), before = actorFor('kaidan', state);
    assert.equal(buyItem(state, itemId).ok, true, itemId);
    assert.equal(equipItem(state, 'kaidan', itemId).ok, true, itemId);
    const after = actorFor('kaidan', state);
    close(after.bioticMultiplier, family === 'biotic' ? 1.15 : 1);
    close(after.techMultiplier, family === 'tech' ? 1.15 : 1);
    assert.deepEqual(after.powers, before.powers);
    for (const key of ['attack', 'defense', 'maxHp', 'maxShield', 'speed']) assert.equal(after[key], before[key]);
    const restored = decodeSave(encodeSave(state)); assert.ok(restored);
    assert.deepEqual(actorFor('kaidan', restored), after);
    for (const [actionId, boosted] of [['throw', family === 'biotic'], ['overload', family === 'tech'], ['shoot', false]]) {
      const baseDamage = damage(cast(battleFor(before), actionId)).amount;
      close(damage(cast(battleFor(after), actionId)).amount, baseDamage * (boosted ? 1.15 : 1));
    }
    const snapshot = JSON.stringify(state);
    assert.equal(equipItem(state, 'shepard', itemId).ok, false);
    assert.equal(JSON.stringify(state), snapshot);
  }
});
