import test from 'node:test';
import assert from 'node:assert/strict';
import { getActions, performAction, tickBattle } from '../src/combat.js';
import { getLevelLayout, isLevelGround } from '../src/level-layout-data.js';
import { createVehicleExercise, vehicleExerciseArena, vehicleExercisePosition } from '../src/vehicle-exercise.js';

test('an exercise needs a mounted vehicle at the authored parking point and safe ground for its formation', () => {
  const layout = getLevelLayout('therum');
  const footprints = [];
  const context = {
    zoneId: 'therum', mounted: true, position: layout.vehicleSpawn, parking: layout.vehicleSpawn,
    walkable(x, z, radius) {
      footprints.push({ x, z, radius });
      return isLevelGround(layout, x, z, radius);
    },
  };
  const arena = vehicleExerciseArena(context);
  assert.ok(arena);
  assert.equal(footprints.length, 3);
  assert.equal(footprints[0].radius, 1.45);
  assert.equal(footprints.every(point => isLevelGround(layout, point.x, point.z, point.radius)), true);
  assert.deepEqual(vehicleExercisePosition(arena, 'mako'), { x: footprints[0].x, z: footprints[0].z });
  assert.equal(vehicleExercisePosition(arena, 'shepard'), null);
  assert.equal(vehicleExerciseArena({ ...context, mounted: false }), null);
  assert.equal(vehicleExerciseArena({ ...context, zoneId: 'ilos' }), null);
  assert.equal(vehicleExerciseArena({ ...context, position: { x: layout.vehicleSpawn.x, z: layout.vehicleSpawn.z - 8 } }), null);
  assert.equal(vehicleExerciseArena({ ...context, walkable: (x, z, radius) => radius < 1 }), null);
});

for (const mode of ['wait', 'active']) {
  test(`the ${mode} ATB drill can finish using only its own hull, orders and target beacons`, () => {
    const battle = createVehicleExercise(mode);
    assert.equal(battle.mode, mode);
    assert.equal(battle.vehicleExercise, true);
    assert.equal(battle.medigel, 0);
    assert.deepEqual(battle.actors.map(actor => actor.id), ['mako', 'training-target-a', 'training-target-b']);
    assert.deepEqual(getActions(battle, 'mako').map(action => action.id), ['shoot', 'burst', 'cover']);
    for (let tick = 0; tick < 1200 && !battle.winner; tick++) {
      tickBattle(battle, .1);
      if (!getActions(battle, 'mako').find(action => action.id === 'shoot').available) continue;
      const target = battle.actors.find(actor => actor.team === 'enemy' && actor.hp > 0);
      if (target) assert.equal(performAction(battle, { actorId: 'mako', actionId: 'shoot', targetId: target.id }).ok, true);
    }
    assert.equal(battle.winner, 'party');
    assert.ok(battle.events.some(event => event.type === 'damage' && event.targetId === 'training-target-b'));
    const newRun = createVehicleExercise(mode);
    assert.equal(newRun.actors[0].hp, newRun.actors[0].maxHp);
    assert.ok(newRun.actors.slice(1).every(actor => actor.hp > 0));
    assert.equal(newRun.winner, null);
  });
}
