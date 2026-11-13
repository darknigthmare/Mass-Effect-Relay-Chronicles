import { RETREAT_RECOVERY_SECONDS } from './completion-world.js';

const finitePoint = value => value && Number.isFinite(value.x) && Number.isFinite(value.z);

/** Keep a followed mission/operation attached to its next live step. */
export function resolveTrackedPOI(tracked, pois = [], { previousPOIs = [] } = {}) {
  if (typeof tracked !== 'string') return null;
  const current = pois.find(poi => poi.id === tracked);
  if (current && !current.cleared) return current.id;
  const previous = previousPOIs.find(poi => poi.id === tracked) || current;
  const missionId = previous?.missionId || (tracked.startsWith('mission:') ? tracked.split(':')[1] : null);
  if (missionId) return pois.find(poi => poi.missionId === missionId && !poi.cleared)?.id || null;
  if (previous?.operationId) return pois.find(poi => poi.operationId === previous.operationId && !poi.cleared)?.id || null;
  // Static campaign markers retain their authored order; contacts never become
  // a different person just because a conversation has disappeared.
  if (previous?.type === 'encounter') {
    const zone = tracked.split(':')[0];
    return pois.find(poi => poi.id.startsWith(`${zone}:`) && poi.type === 'encounter' && !poi.cleared)?.id
      || pois.find(poi => poi.id === `${zone}:objective` && !poi.cleared)?.id || null;
  }
  return null;
}

export function beginEncounterRecovery(id) {
  return typeof id === 'string' && id ? { id, remaining: RETREAT_RECOVERY_SECONDS } : null;
}

/** This consumes foreground exploration time supplied by the simulation clock. */
export function advanceEncounterRecovery(recovery, seconds, { exploring = true } = {}) {
  if (!recovery || typeof recovery.id !== 'string' || !Number.isFinite(recovery.remaining) || recovery.remaining <= 0) return null;
  if (!exploring || !Number.isFinite(seconds) || seconds <= 0) return { ...recovery };
  const remaining = recovery.remaining - seconds;
  // Exact-duration fixed-step sums may leave a floating point residue.
  return remaining > 1e-9 ? { id: recovery.id, remaining } : null;
}

export function encounterRecoveryAccess(recovery, id) {
  const remaining = recovery?.id === id && Number.isFinite(recovery.remaining) ? Math.max(0, recovery.remaining) : 0;
  return { ok: remaining <= 0, remaining,
    reason: remaining > 0 ? `Repli en cours : attendez encore ${Math.ceil(remaining)} s sur le terrain.` : '' };
}

/** Detached collision footprints, with the same foot clearance as _walkable. */
export function mapCollisionFootprints(solids = [], padding = .36) {
  if (!Number.isFinite(padding) || padding < 0) return [];
  return solids.flatMap(solid => {
    if (solid?.kind === 'circle' && finitePoint(solid) && Number.isFinite(solid.radius) && solid.radius > 0)
      return [{ kind: 'circle', x: solid.x, z: solid.z, radius: solid.radius + padding }];
    if (solid?.kind === 'rect' && [solid.minX, solid.maxX, solid.minZ, solid.maxZ].every(Number.isFinite)
      && solid.minX < solid.maxX && solid.minZ < solid.maxZ)
      return [{ kind: 'rect', minX: solid.minX - padding, maxX: solid.maxX + padding,
        minZ: solid.minZ - padding, maxZ: solid.maxZ + padding }];
    return [];
  });
}
