// Scene-unit rules for the ATB adaptation. The same solid ground footprints
// drive movement and directional protection; no original ballistic claim.
export const COVER_PROXIMITY = 2.4;
export const RETREAT_CLEARANCE = 5;
export const RETREAT_RECOVERY_SECONDS = 8;
const finitePoint = value => value && Number.isFinite(value.x) && Number.isFinite(value.z);

export function distanceToSolid(point, solid) {
  if (!finitePoint(point) || !solid) return Infinity;
  if (solid.kind === 'circle' && finitePoint(solid) && Number.isFinite(solid.radius) && solid.radius > 0)
    return Math.max(0, Math.hypot(point.x - solid.x, point.z - solid.z) - solid.radius);
  if (solid.kind === 'rect' && [solid.minX, solid.maxX, solid.minZ, solid.maxZ].every(Number.isFinite)
    && solid.maxX > solid.minX && solid.maxZ > solid.minZ)
    return Math.hypot(Math.max(solid.minX - point.x, 0, point.x - solid.maxX), Math.max(solid.minZ - point.z, 0, point.z - solid.maxZ));
  return Infinity;
}

function segmentCrossesSolid(from, to, solid) {
  if (solid.kind === 'circle') {
    const dx = to.x - from.x, dz = to.z - from.z, lengthSquared = dx * dx + dz * dz;
    if (!lengthSquared) return false;
    const t = Math.max(0, Math.min(1, ((solid.x - from.x) * dx + (solid.z - from.z) * dz) / lengthSquared));
    return t > 0 && t < 1 && Math.hypot(from.x + dx * t - solid.x, from.z + dz * t - solid.z) < solid.radius;
  }
  let enter = 0, leave = 1;
  for (const [axis, low, high] of [['x', 'minX', 'maxX'], ['z', 'minZ', 'maxZ']]) {
    const delta = to[axis] - from[axis];
    if (Math.abs(delta) < 1e-10) { if (from[axis] <= solid[low] || from[axis] >= solid[high]) return false; }
    else {
      const a = (solid[low] - from[axis]) / delta, b = (solid[high] - from[axis]) / delta;
      enter = Math.max(enter, Math.min(a, b)); leave = Math.min(leave, Math.max(a, b));
      if (leave <= enter) return false;
    }
  }
  return enter < 1 && leave > 0;
}

export function geometricCover({ position, opponentPositions = [], solids = [] } = {}) {
  if (!finitePoint(position)) return { available: false, protectedFrom: [], reason: 'Position de couverture indisponible.' };
  const nearby = solids.filter(solid => distanceToSolid(position, solid) > .001 && distanceToSolid(position, solid) <= COVER_PROXIMITY);
  const protectedFrom = opponentPositions.filter(opponent => typeof opponent?.id === 'string' && finitePoint(opponent)
    && nearby.some(solid => segmentCrossesSolid(position, opponent, solid))).map(opponent => opponent.id);
  return { available: protectedFrom.length > 0, protectedFrom,
    reason: protectedFrom.length ? `Obstacle protecteur contre ${protectedFrom.length}/${opponentPositions.length} adversaires. Un tir de flanc reste dangereux.`
      : 'Aucun obstacle protecteur proche dans la direction des adversaires. Repositionnez-vous.' };
}

export function findRetreatPoint({ start, encounter, spawn, encounters = [], isWalkable, findPath } = {}) {
  if (!finitePoint(start) || !finitePoint(encounter) || typeof isWalkable !== 'function' || typeof findPath !== 'function') return null;
  const threats = [encounter, ...encounters.filter(finitePoint)], heading = finitePoint(spawn) ? Math.atan2(spawn.z - encounter.z, spawn.x - encounter.x) : Math.PI;
  // Search toward the arrival route first, then both flanks. A destination is
  // accepted only with an actual continuous path on the current dressed floor.
  for (const radius of [6, 8, 10, 13]) for (let turn = 0; turn < 16; turn++) {
    const offset = (turn % 2 ? 1 : -1) * Math.ceil(turn / 2) * Math.PI / 8, angle = heading + offset;
    const point = { x: encounter.x + Math.cos(angle) * radius, z: encounter.z + Math.sin(angle) * radius };
    if (!isWalkable(point.x, point.z) || threats.some(threat => Math.hypot(point.x - threat.x, point.z - threat.z) < RETREAT_CLEARANCE)) continue;
    const path = findPath(point);
    if (!Array.isArray(path) || !path.length || Math.hypot(path.at(-1).x - point.x, path.at(-1).z - point.z) > .05) continue;
    let previous = start, valid = true;
    for (const step of path) {
      if (!finitePoint(step)) { valid = false; break; }
      const samples = Math.max(1, Math.ceil(Math.hypot(step.x - previous.x, step.z - previous.z) / .15));
      for (let i = 0; i <= samples; i++) if (!isWalkable(previous.x + (step.x - previous.x) * i / samples, previous.z + (step.z - previous.z) * i / samples)) { valid = false; break; }
      if (!valid) break; previous = step;
    }
    if (valid) return { ...point, path: path.map(step => ({ x: step.x, z: step.z })) };
  }
  return null;
}

export function retreatAvailability(battle, poi, destination) {
  if (!battle || battle.winner || !poi) return { ok: false, reason: 'Aucun combat actif à quitter.' };
  if (poi.type === 'boss' || poi.id?.endsWith(':boss') || battle.actors.some(actor => actor.team === 'enemy' && actor.boss))
    return { ok: false, reason: 'Cette confrontation décisive ne permet pas le repli.' };
  const living = battle.actors.filter(actor => actor.team === 'party' && actor.hp > 0);
  if (!living.length || living.some(actor => actor.atb < 99.999 || ['stasis', 'lift', 'singularity', 'stagger'].some(key => actor.statuses?.[key] > 0)))
    return { ok: false, reason: 'Préparez les jauges de tous les équipiers en vie. En Attente, réservez les jauges déjà prêtes.' };
  if (!finitePoint(destination)) return { ok: false, reason: 'Aucun chemin de repli sûr depuis cette arène.' };
  return { ok: true, reason: 'Quitter sans XP ni butin ; médi-gel dépensé conservé. Reprise hors du contact, délai de huit secondes de terrain.' };
}
