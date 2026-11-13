// Shared native setZone fixture. Only renderer/image/DOM boundaries are simulated;
// seeded scenery, native sprite footprints, POI filtering and cover are retained.
import { createCombatGeometry } from '../../scripts/completion-combat-geometry.mjs';

export function createDressedWorld(zoneId, geometry = true, state = null) {
  const world = createCombatGeometry(zoneId, { geometry, state });
  return { world, get renders() { return world._nativeRenderCount; } };
}
