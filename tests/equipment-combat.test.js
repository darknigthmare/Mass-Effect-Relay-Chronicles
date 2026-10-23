import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattle, performAction, getActions, tickBattle } from '../src/combat.js';

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
