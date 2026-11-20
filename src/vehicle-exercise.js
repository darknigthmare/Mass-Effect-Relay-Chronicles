import { createBattle } from './combat.js';
import { FRONTIER_VEHICLES } from './frontier-vehicles.js';

const mako = FRONTIER_VEHICLES.mako;
export const VEHICLE_EXERCISE = Object.freeze({
  id: 'therum:vehicle-exercise',
  label: 'Exercice embarqué',
});

const formation = Object.freeze({
  mako: Object.freeze({ x: -3.5, z: 0, radius: mako.radius }),
  'training-target-a': Object.freeze({ x: 3.5, z: -2.2, radius: .65 }),
  'training-target-b': Object.freeze({ x: 4.5, z: 2.2, radius: .65 }),
});

export function vehicleExercisePosition(arena, actorId) {
  const offset = Object.hasOwn(formation, actorId) ? formation[actorId] : null;
  return arena && offset && { x: arena.x + offset.x, z: arena.z + offset.z };
}

export function vehicleExerciseArena({ zoneId, mounted, position, parking, walkable } = {}) {
  if (zoneId !== mako.zoneId || !mounted || !position || !parking
    || ![position.x, position.z, parking.x, parking.z].every(Number.isFinite)
    || typeof walkable !== 'function' || Math.hypot(position.x - parking.x, position.z - parking.z) > 7) return null;
  const arena = { x: parking.x + 2, z: parking.z - 6 };
  return Object.keys(formation).every(id => {
    const point = vehicleExercisePosition(arena, id);
    return walkable(point.x, point.z, formation[id].radius);
  }) ? arena : null;
}

/** An exercise owns its hull, targets and heat until exit. */
export function createVehicleExercise(mode) {
  const party = [{
    id: 'mako', name: mako.label, sprite: 'mako', hp: 220, shield: 90,
    attack: 47, defense: 10, speed: 1.15, weaponType: 'assault', weaponCoolingBonus: 9,
  }];
  const enemies = ['a', 'b'].map((suffix, index) => ({
    id: `training-target-${suffix}`, name: `Balise d’exercice ${index + 1}`, sprite: 'training-target',
    hp: 35 + index * 13, shield: 16 + index * 5, attack: 11 + index * 5,
    defense: 3, speed: .78 + index * .08, synthetic: true,
  }));
  return createBattle({ party, enemies, medigel: 0, seed: 41, mode, vehicleExercise: true });
}
