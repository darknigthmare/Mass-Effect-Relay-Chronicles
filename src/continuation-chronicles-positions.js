// A local two-dimensional ATB arena for the independent ME2/ME3 trials.
// Coordinates are scene units, never metres, original maps or 3D trajectories.
// No campaign tactical state, collision callback or save schema is reused.
const EPSILON = 1e-8;
const BOUNDS = Object.freeze({ minX: -8, maxX: 8, minZ: -6, maxZ: 6 });
export const CHRONICLE_CONTACT_DISTANCE = 1.6;
export const CHRONICLE_CHARGE_RANGE = 12.5;
const STEP = 3.6;
const finitePoint = point => !!point && Number.isFinite(point.x) && Number.isFinite(point.z);
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const alive = actor => Number.isFinite(actor?.hp) && actor.hp > EPSILON;
const fail = reason => ({ ok: false, reason });
const withinBounds = point => finitePoint(point) && point.x >= BOUNDS.minX && point.x <= BOUNDS.maxX
  && point.z >= BOUNDS.minZ && point.z <= BOUNDS.maxZ;
export const chroniclePositionsEnabled = battle => battle?.chroniclePositions?.enabled === true
  && ['ME2', 'ME3'].includes(battle.chroniclePositions.mediaId)
  && battle.chroniclePositions.periodId === battle.chroniclePositions.mediaId.toLowerCase()
  && Array.isArray(battle.actors) && battle.actors.some(actor => actor.team === 'party')
  && battle.actors.every(actor => actor.team !== 'party' || actor.mediaId === battle.chroniclePositions.mediaId);

/** Explicit context gate; the campaign createBattle default stays unchanged. */
export function initializeChroniclePositions(battle, context) {
  if (!['ME2', 'ME3'].includes(context?.mediaId) || context.periodId !== context.mediaId.toLowerCase()
    || !Array.isArray(battle?.actors) || !battle.actors.some(actor => actor.team === 'party')
    || battle.actors.some(actor => actor.team === 'party' && (actor.mediaId !== context.mediaId
      || !actor.catalogId?.startsWith(`${context.mediaId}-`)))) return false;
  const indices = { party: 0, enemy: 0 }, positions = Object.create(null);
  for (const actor of battle.actors) {
    const index = indices[actor.team]++;
    const rows = battle.actors.filter(other => other.team === actor.team).length;
    positions[actor.id] = { x: (actor.team === 'party' ? -1 : 1) * (3.8 + Math.floor(index / 3) * 2.4),
      z: rows === 1 ? 0 : (index % 3 - 1) * 2.8 };
    // Two bounded columns cover the current trials. Refuse a future
    // roster rather than silently placing bodies on top of each other.
    if (index >= 6) return false;
  }
  battle.chroniclePositions = { version: 1, enabled: true, mediaId: context.mediaId,
    periodId: context.periodId, bounds: { ...BOUNDS }, positions, revision: 0 };
  return true;
}

/** Detached reads never change simulation time or resources. */
export function getChroniclePosition(battle, actorId) {
  const point = chroniclePositionsEnabled(battle) && battle.chroniclePositions.positions[actorId];
  return withinBounds(point) ? { x: point.x, z: point.z } : null;
}
export function getChroniclePositionState(battle) {
  if (!chroniclePositionsEnabled(battle)) return null;
  return { version: 1, units: 'unités de scène ATB', revision: battle.chroniclePositions.revision,
    bounds: { ...BOUNDS }, contactDistance: CHRONICLE_CONTACT_DISTANCE,
    positions: Object.fromEntries(Object.keys(battle.chroniclePositions.positions)
      .map(id => [id, getChroniclePosition(battle, id)])) };
}

const freeDestination = (battle, actor, point) => withinBounds(point) && battle.actors
  .filter(other => other.id !== actor.id && alive(other))
  .every(other => {
    const position = getChroniclePosition(battle, other.id);
    return !position || distance(point, position) >= 1.2 - EPSILON;
  });

export function chronicleChargeTargetCheck(battle, actor, target) {
  if (!chroniclePositionsEnabled(battle)) return { ok: true };
  const from = getChroniclePosition(battle, actor?.id), to = getChroniclePosition(battle, target?.id);
  if (!from || !to) return fail('Position indisponible dans cette arène Chroniques.');
  const actual = distance(from, to);
  return { ok: actual <= CHRONICLE_CHARGE_RANGE + EPSILON, range: CHRONICLE_CHARGE_RANGE, distance: actual,
    ...(actual > CHRONICLE_CHARGE_RANGE + EPSILON
      ? { reason: `Hors de portée de Charge : ${actual.toFixed(1)} / ${CHRONICLE_CHARGE_RANGE} unités ATB.` } : {}) };
}

/** Choose a free contact point deterministically; no geometry or RNG is hidden. */
export function planChronicleCharge(battle, actor, target) {
  if (!chroniclePositionsEnabled(battle)) return null;
  if (!battle.actors.includes(actor) || !battle.actors.includes(target) || !alive(actor) || !alive(target)
    || actor.team === target.team) return fail('Charge exige un adversaire vivant de cet essai.');
  const check = chronicleChargeTargetCheck(battle, actor, target);
  if (!check.ok) return check;
  if (check.distance <= CHRONICLE_CONTACT_DISTANCE + EPSILON) return fail('Le contact est déjà atteint ; reculez avant une nouvelle Charge.');
  const from = getChroniclePosition(battle, actor.id), destination = getChroniclePosition(battle, target.id);
  const angle = Math.atan2(from.z - destination.z, from.x - destination.x);
  for (const offset of [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2, Math.PI]) {
    const to = { x: destination.x + Math.cos(angle + offset) * CHRONICLE_CONTACT_DISTANCE,
      z: destination.z + Math.sin(angle + offset) * CHRONICLE_CONTACT_DISTANCE };
    if (freeDestination(battle, actor, to)) return { ok: true, actorId: actor.id, targetId: target.id,
      actionId: 'bioticCharge', from, to, distance: distance(from, to), contactDistance: distance(to, destination),
      targetDistance: check.distance, range: check.range, atbCost: 100 };
  }
  return fail('Aucun point de contact libre dans les limites de cette arène.');
}

export function planChronicleMove(battle, actor, actionId) {
  if (!chroniclePositionsEnabled(battle) || !battle.actors.includes(actor) || !alive(actor)
    || !['advance', 'withdraw'].includes(actionId)) return fail('Déplacement indisponible dans cette arène Chroniques.');
  const from = getChroniclePosition(battle, actor.id);
  if (!from) return fail('Position Chroniques indisponible.');
  const opponents = battle.actors.filter(other => other.team !== actor.team && alive(other))
    .map(other => ({ actor: other, point: getChroniclePosition(battle, other.id) })).filter(entry => entry.point)
    .sort((left, right) => distance(from, left.point) - distance(from, right.point));
  if (!opponents.length) return fail('Aucun adversaire vivant pour ce déplacement.');
  const target = opponents[0].point, length = distance(from, target);
  if (length <= EPSILON) return fail('Le contact est déjà atteint.');
  const step = actionId === 'advance' ? Math.min(STEP, Math.max(0, length - CHRONICLE_CONTACT_DISTANCE)) : -STEP;
  for (const ratio of [1, .75, .5, .25]) {
    const to = { x: Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, from.x + (target.x - from.x) / length * step * ratio)),
      z: Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, from.z + (target.z - from.z) / length * step * ratio)) };
    if (distance(from, to) >= .05 && freeDestination(battle, actor, to)) return { ok: true, actorId: actor.id,
      actionId, from, to, distance: distance(from, to), atbCost: 100 };
  }
  return fail('La limite de l’arène ou un combattant empêche ce déplacement.');
}

/** Commit only a plan validated before the native order costs are paid. */
export function commitChronicleDisplacement(battle, plan) {
  battle.chroniclePositions.positions[plan.actorId] = { ...plan.to };
  battle.chroniclePositions.revision++;
}
