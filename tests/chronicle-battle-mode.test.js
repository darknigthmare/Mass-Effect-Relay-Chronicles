import test from 'node:test';
import assert from 'node:assert/strict';
import { createChronicle, startChronicleBattle } from '../src/chronicles.js';
import { getActions, performAction, setBattleMode, tickBattle } from '../src/combat.js';

const trials = [
  ['GAL', 'gal-jacob'], ['INF', 'inf-security'], ['INF', 'inf-incarceration'],
];
const basicFire = ['reload', 'burst', 'shoot'];
const combatState = ({ mode, waiting, ...state }) => JSON.stringify(state);

for (const [mediaId, id] of trials) {
  const start = () => startChronicleBattle(createChronicle({ mediaId, periodId: mediaId.toLowerCase() }, id)).battle;
  test(`${id} switches ATB with one ready command and unchanged combat resources`, () => {
    const battle = start(), [actor, target] = battle.actors;
    for (let step = 0; step < 400 && !battle.waiting; step++) tickBattle(battle, .1);
    assert.equal(battle.waiting, true);
    assert.equal(actor.atb, 100);
    const before = combatState(battle), originalActions = getActions(battle, actor.id);
    assert.equal(setBattleMode(battle, 'other'), false);
    assert.equal(battle.mode, 'wait');
    assert.equal(setBattleMode(battle, 'active'), true);
    assert.equal(battle.waiting, false);
    assert.equal(combatState(battle), before);
    assert.deepEqual(getActions(battle, actor.id), originalActions);
    const elapsed = battle.elapsed;
    tickBattle(battle, .1);
    assert.ok(battle.elapsed > elapsed);
    assert.equal(actor.atb, 100);

    assert.equal(setBattleMode(battle, 'wait'), true);
    assert.equal(battle.waiting, true);
    const order = { actorId: actor.id, targetId: target.id, actionId: 'shoot' };
    const receipt = performAction(battle, order);
    assert.equal(receipt.ok, true);
    assert.equal(receipt.events.filter(event => event.type === 'action' && event.actorId === actor.id).length, 1);
    assert.equal(actor.atb, 0);
    for (const mode of ['active', 'wait']) {
      const after = combatState(battle);
      assert.equal(setBattleMode(battle, mode), true);
      assert.equal(performAction(battle, order).ok, false, 'The spent turn cannot be used again after a mode switch.');
      assert.equal(combatState(battle), after);
    }
  });

  test(`${id} can be won with conventional attacks and has no hidden weakness requirement`, () => {
    const battle = start(), [actor] = battle.actors, used = [];
    for (let step = 0; step < 2500 && !battle.winner; step++) {
      const target = battle.actors.find(actor => actor.team === 'enemy' && actor.hp > 0);
      const available = getActions(battle, actor.id).filter(action => action.available);
      const actionId = basicFire.find(id => available.some(action => action.id === id));
      if (actionId && target) {
        assert.equal(performAction(battle, { actorId: actor.id, actionId, targetId: target.id }).ok, true);
        used.push(actionId);
      }
      tickBattle(battle, .05);
    }
    assert.equal(battle.winner, 'party');
    assert.ok(used.length > 0);
    assert.equal(setBattleMode(battle, 'active'), false, 'A completed fight does not resume after a mode change.');
  });
}
