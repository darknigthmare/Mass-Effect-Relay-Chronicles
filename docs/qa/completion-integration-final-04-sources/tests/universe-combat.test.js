import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattle, getActions, performAction, tickBattle } from '../src/combat.js';

const makeBattle = (changes = {}) => createBattle({ mode: 'active', rng: () => .5,
  party: [{ id: 'actor', hp: 500, shield: 0, attack: 20, atb: 100, focus: 100,
    powers: ['overload'], weaponSystem: 'thermal-clip', magazineCapacity: 8, ammo: 8, reserveAmmo: 12, ...changes }],
  enemies: [{ id: 'enemy', hp: 1000, shield: 0, attack: 1, speed: .1, synthetic: true }],
});
function act(battle, actionId, targetId = 'enemy') {
  battle.actors[0].atb = 100;
  return performAction(battle, { actorId: 'actor', actionId, targetId: actionId === 'reload' ? 'actor' : targetId });
}

test('thermal-clip weapons consume magazine shots and display their actual costs without heat', () => {
  const battle = makeBattle();
  const actions = getActions(battle, 'actor');
  assert.equal(actions.find(action => action.id === 'shoot').ammoCost, 1);
  assert.equal(actions.find(action => action.id === 'burst').ammoCost, 3);
  assert.equal(actions.find(action => action.id === 'shoot').heatCost, 0);
  assert.match(actions.find(action => action.id === 'shoot').description, /chargeur/);
  assert.equal(act(battle, 'shoot').ok, true); assert.equal(battle.actors[0].ammo, 7);
  assert.equal(act(battle, 'burst').ok, true); assert.equal(battle.actors[0].ammo, 4);
  assert.equal(act(battle, 'signature').ok, true); assert.equal(battle.actors[0].ammo, 2);
  assert.equal(battle.actors[0].heat, 0); assert.equal(battle.actors[0].reserveAmmo, 12);
});

test('empty magazines and invalid targets cannot spend ATB, focus, ammunition or randomness', () => {
  const battle = makeBattle({ ammo: 0 }), actor = battle.actors[0];
  const before = JSON.stringify({ actor, actions: battle.actionCount, events: battle.events });
  assert.equal(act(battle, 'shoot').ok, false);
  assert.equal(JSON.stringify({ actor, actions: battle.actionCount, events: battle.events }), before);
  actor.ammo = 3;
  assert.equal(act(battle, 'burst', 'unknown').ok, false);
  assert.equal(actor.ammo, 3); assert.equal(actor.atb, 100);
  assert.equal(act(battle, 'overload').ok, true); assert.equal(actor.ammo, 3);
});

test('reloading transfers only missing shots, consumes an ATB order, and cannot create reserve ammunition', () => {
  const battle = makeBattle({ ammo: 2, reserveAmmo: 3 }), actor = battle.actors[0];
  assert.equal(act(battle, 'reload').ok, true);
  assert.equal(actor.ammo, 5); assert.equal(actor.reserveAmmo, 0); assert.equal(actor.atb, 0);
  actor.atb = 100;
  assert.equal(act(battle, 'reload').ok, false); assert.equal(actor.atb, 100);
  assert.equal(actor.ammo, 5); assert.equal(actor.reserveAmmo, 0);
  const full = makeBattle(); assert.equal(act(full, 'reload').ok, false);
  assert.equal(full.actors[0].reserveAmmo, 12);
});

test('wait-mode pauses ammunition state and enemy AI reloads an empty thermal magazine', () => {
  const battle = makeBattle(); battle.mode = 'wait';
  const before = JSON.stringify(battle.actors); tickBattle(battle, 2);
  assert.equal(JSON.stringify(battle.actors), before);
  const enemy = battle.actors[1]; Object.assign(enemy, { weaponSystem: 'thermal-clip', magazineCapacity: 4, ammo: 0, reserveAmmo: 3, atb: 100 });
  battle.mode = 'active'; tickBattle(battle, .05);
  assert.equal(enemy.ammo, 3); assert.equal(enemy.reserveAmmo, 0);
  assert.ok(battle.events.some(event => event.type === 'reload' && event.actorId === 'enemy'));
});

test('ME1 heat actors retain unlimited gunfire and cannot acquire reload through a forged power', () => {
  const battle = makeBattle({ weaponSystem: 'heat', powers: ['reload'] });
  assert.equal(getActions(battle, 'actor').some(action => action.id === 'reload'), false);
  assert.equal(act(battle, 'shoot').ok, true); assert.equal(battle.actors[0].heat, 24);
  assert.equal(act(battle, 'reload').ok, false);
  tickBattle(battle, 1); assert.ok(Math.abs(battle.actors[0].heat - 15) < 1e-7);
});
