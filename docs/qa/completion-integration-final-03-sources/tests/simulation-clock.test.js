import test from 'node:test';
import assert from 'node:assert/strict';
import { createSimulationClock } from '../src/simulation-clock.js';
import { createBattle, tickBattle } from '../src/combat.js';
import { actorFor, enemiesFor } from '../src/game-data.js';
import { newGame } from '../src/state.js';

test('foreground time and real ATB/cooling are invariant at 10, 20, 60 and 144 frames per second', () => {
  const results = [];
  for (const fps of [10, 20, 60, 144]) {
    const clock = createSimulationClock(), state = newGame();
    const battle = createBattle({ party: [actorFor('shepard', state)], enemies: enemiesFor('eden-prime', 0, state), mode: 'active', seed: 2183 });
    battle.actors[0].heat = 80;
    clock.reset(0); let simulated = 0;
    for (let frame = 1; frame <= fps * 3; frame++) {
      const { steps, stepSeconds } = clock.advance(frame * 1000 / fps);
      for (let step = 0; step < steps; step++) { tickBattle(battle, stepSeconds); simulated += stepSeconds; }
    }
    results.push({ simulated, elapsed: battle.elapsed, actors: battle.actors.map(({ hp, shield, atb, heat }) => ({ hp, shield, atb, heat })) });
  }
  for (const result of results) { assert.ok(Math.abs(result.simulated - 3) < 1e-8); assert.deepEqual(result, results[0]); }
});

test('suspension and explicit reset discard old time without a burst of deferred actions', () => {
  const clock = createSimulationClock(); clock.reset(0);
  assert.equal(clock.advance(500).steps, 30);
  assert.equal(clock.advance(20000, { suspended: true }).steps, 0);
  clock.reset(20000); assert.equal(clock.advance(20050).steps, 3);
  assert.equal(clock.advance(30000).interrupted, true);
  assert.equal(clock.advance(30050).steps, 3);
  assert.equal(clock.advance(NaN).steps, 0); assert.equal(clock.advance(50).steps, 0);
  assert.equal(clock.advance(40).steps, 0);
});
