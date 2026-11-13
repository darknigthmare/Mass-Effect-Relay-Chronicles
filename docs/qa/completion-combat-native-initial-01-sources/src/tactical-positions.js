// Local ATB positions in scene units. This is an authored tactical adaptation,
// not an original-game map, metres, ballistic trajectory or collision solver.
const EPSILON = 1e-8;
const finitePoint = point => point !== null && typeof point === 'object'
  && Number.isFinite(point.x) && Number.isFinite(point.z);
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const distance = (left, right) => Math.hypot(left.x - right.x, left.z - right.z);
export const TACTICAL_BOUNDS = Object.freeze({ minX: -8, maxX: 8, minZ: -6, maxZ: 6 });
export const TACTICAL_WEAPON_RANGES = Object.freeze({ pistol: 11.5, assault: 14, shotgun: 8.5, sniper: 22 });
export const TACTICAL_MOVE_DISTANCE = 3.6;

export function tacticalEnabled(battle) { return battle?.tactical?.enabled === true; }

function withinBounds(point) {
  return finitePoint(point) && point.x >= TACTICAL_BOUNDS.minX && point.x <= TACTICAL_BOUNDS.maxX
    && point.z >= TACTICAL_BOUNDS.minZ && point.z <= TACTICAL_BOUNDS.maxZ;
}

function groundAllowed(battle, point, actorId) {
  if (!withinBounds(point)) return false;
  if (typeof battle._tacticalAllowed !== 'function') return true;
  try { return battle._tacticalAllowed({ ...point, actorId }) === true; }
  catch { return false; }
}

function segmentAllowed(battle, from, to, actorId) {
  const samples = Math.max(1, Math.ceil(distance(from, to) / .2));
  for (let step = 0; step <= samples; step++) {
    const t = step / samples;
    if (!groundAllowed(battle, { x: from.x + (to.x - from.x) * t, z: from.z + (to.z - from.z) * t }, actorId)) return false;
  }
  return true;
}

function formationPosition(actor, index, heavy) {
  if (withinBounds(actor.tacticalAnchor)) return { ...actor.tacticalAnchor };
  const enemy = actor.team === 'enemy';
  return { x: enemy ? 3.8 + Math.floor(index / 3) * 2.4 : -3.8 - Math.floor(index / 3) * 2.4,
    z: (index % 3 - 1) * (enemy && heavy ? 4.8 : 2.9) };
}

/** Called only while creating a battle or adding real phase actors. */
export function registerTacticalActors(battle) {
  if (!tacticalEnabled(battle)) return;
  const heavy = battle.actors.some(actor => actor.team === 'enemy' && ['armature', 'colossus'].includes(actor.sprite));
  const indices = { party: 0, enemy: 0 };
  for (const actor of battle.actors) {
    const index = indices[actor.team]++;
    if (Object.hasOwn(battle.tactical.positions, actor.id)) continue;
    const anchor = typeof actor.tacticalAnchorId === 'string' && battle.tactical.positions[actor.tacticalAnchorId];
    const point = finitePoint(anchor) ? anchor : formationPosition(actor, index, heavy);
    let candidate = {
      x: clamp(point.x, TACTICAL_BOUNDS.minX, TACTICAL_BOUNDS.maxX),
      z: clamp(point.z, TACTICAL_BOUNDS.minZ, TACTICAL_BOUNDS.maxZ),
    };
    if (!groundAllowed(battle, candidate, actor.id)) {
      const alternatives = [];
      for (let x = TACTICAL_BOUNDS.minX; x <= TACTICAL_BOUNDS.maxX; x += .5) for (let z = TACTICAL_BOUNDS.minZ; z <= TACTICAL_BOUNDS.maxZ; z += .5) {
        const next = { x, z };
        if (groundAllowed(battle, next, actor.id) && Object.values(battle.tactical.positions).every(other => distance(other, next) >= 1.2)) alternatives.push(next);
      }
      alternatives.sort((left, right) => distance(left, point) - distance(right, point));
      if (!alternatives.length) throw new TypeError('Aucune position tactique praticable dans cette arène.');
      candidate = alternatives[0];
    }
    battle.tactical.positions[actor.id] = candidate;
  }
}

export function initializeTacticalBattle(battle, enabled, allowed) {
  if (enabled !== true) return;
  if (battle.actors.some(actor => actor.team === 'party' && actor.mediaId && actor.mediaId !== 'ME1')) throw new TypeError('Le plan tactique de campagne est réservé à Mass Effect 1.');
  if (typeof allowed === 'function') battle._tacticalAllowed = allowed;
  battle.tactical = { version: 1, enabled: true, bounds: { ...TACTICAL_BOUNDS }, positions: Object.create(null), revision: 0 };
  registerTacticalActors(battle);
}

/** Detached getters: renderer/menu reads never advance the battle. */
export function getTacticalPosition(battle, actorId) {
  const point = tacticalEnabled(battle) && battle.tactical.positions[actorId];
  return finitePoint(point) ? { x: point.x, z: point.z } : null;
}

/** A scene may bind cover to its actual obstacles. The callback receives only
 * detached geometry, never the mutable simulation or its random generator. */
export function getTacticalCoverState(battle, actorId, attackerId) {
  const actor = battle?.actors?.find(candidate => candidate.id === actorId);
  const enforced = tacticalEnabled(battle) && typeof battle._tacticalCoverAvailable === 'function';
  if (!actor) return { enforced, available: false, active: false, reason: 'Combattant inconnu.' };
  if (!enforced) return { enforced: false, available: true, active: actor.cover === true && actor.hp > EPSILON, reason: null };
  const position = getTacticalPosition(battle, actorId);
  const opponents = battle.actors.filter(other => other.id !== actorId && other.hp > EPSILON && !other.bossPhaseRetired
    && (attackerId == null ? other.team !== actor.team : other.id === attackerId));
  let check;
  try {
    check = battle._tacticalCoverAvailable({ actorId, team: actor.team, position,
      opponentPositions: opponents.map(other => ({ id: other.id, ...getTacticalPosition(battle, other.id) })) });
  } catch { check = false; }
  const available = check === true || check?.available === true;
  const protectedFrom = Array.isArray(check?.protectedFrom) ? check.protectedFrom.filter(id => typeof id === 'string' && opponents.some(other => other.id === id)) : [];
  return { enforced: true, available, active: available && actor.cover === true && actor.hp > EPSILON,
    reason: available ? null : typeof check?.reason === 'string' && check.reason.trim() ? check.reason : 'Aucun obstacle ne protège cette position. Déplacez-vous vers une couverture.',
    protectedFrom: [...new Set(protectedFrom)], opponentCount: opponents.length,
    ...(available && typeof check?.coverId === 'string' ? { coverId: check.coverId } : {}) };
}

export function getTacticalState(battle) {
  if (!tacticalEnabled(battle)) return null;
  return { version: 1, enabled: true, units: 'unités de scène ATB', revision: battle.tactical.revision,
    reservedActorIds: battle.actors.filter(actor => actor.team === 'party' && actor.tacticalHeld === true && actor.hp > EPSILON).map(actor => actor.id),
    bounds: { ...battle.tactical.bounds }, positions: Object.fromEntries(Object.entries(battle.tactical.positions).map(([id, point]) => [id, { ...point }])) };
}

export function getTacticalRange(actor, actionId, definition) {
  if (['self', 'allies'].includes(definition?.target) || ['advance', 'withdraw', 'reposition'].includes(actionId)) return null;
  if (['shoot', 'burst', 'signature'].includes(actionId)) return TACTICAL_WEAPON_RANGES[actor?.weaponType] ?? TACTICAL_WEAPON_RANGES.assault;
  if (actionId === 'strike') return 3.2;
  if (actionId === 'medigel') return 12;
  return 12.5;
}

export function tacticalTargetCheck(battle, actor, target, actionId, definition) {
  if (!tacticalEnabled(battle)) return { ok: true };
  const range = getTacticalRange(actor, actionId, definition);
  if (range === null) return { ok: true, range: null, distance: 0 };
  const from = getTacticalPosition(battle, actor.id), to = target && getTacticalPosition(battle, target.id);
  if (!from || !to) return { ok: false, reason: 'Position tactique indisponible.', range, distance: null };
  const actual = distance(from, to);
  return { ok: actual <= range + EPSILON, range, distance: actual,
    ...(actual > range + EPSILON ? { reason: `Hors de portée : ${actual.toFixed(1)} / ${range.toFixed(1)} unités ATB.` } : {}) };
}

/** Plan first; a menu can inspect or discard this object without any cost. */
export function planTacticalMove(battle, actor, actionId) {
  if (!tacticalEnabled(battle)) return { ok: false, reason: 'Les positions tactiques ne sont pas activées.' };
  const from = getTacticalPosition(battle, actor.id);
  const controlled = actor.statuses?.hacked > EPSILON || actor.statuses?.dominated > EPSILON;
  const opponents = battle.actors.filter(candidate => candidate.id !== actor.id && candidate.hp > EPSILON
    && (controlled ? candidate.team === actor.team : candidate.team !== actor.team))
    .map(candidate => ({ actor: candidate, point: getTacticalPosition(battle, candidate.id) })).filter(entry => entry.point);
  if (!from || !opponents.length) return { ok: false, reason: 'Aucun adversaire vivant pour ce déplacement.' };
  opponents.sort((left, right) => distance(from, left.point) - distance(from, right.point));
  const target = opponents[0].point, length = distance(from, target);
  let direction;
  if (actionId === 'advance' || actionId === 'withdraw') {
    if (length < EPSILON) return { ok: false, reason: 'Le contact est déjà atteint.' };
    const sign = actionId === 'advance' ? 1 : -1;
    const step = actionId === 'advance' ? Math.min(TACTICAL_MOVE_DISTANCE, Math.max(0, length - 1.6)) : TACTICAL_MOVE_DISTANCE;
    direction = { x: (target.x - from.x) / length * step * sign, z: (target.z - from.z) / length * step * sign };
  } else if (actionId === 'reposition') {
    // Choose the side with more room; no hidden random draw or geometric claim.
    direction = { x: 0, z: (from.z <= 0 ? 1 : -1) * 2.4 };
  } else return { ok: false, reason: 'Déplacement tactique inconnu.' };
  const to = { x: clamp(from.x + direction.x, TACTICAL_BOUNDS.minX, TACTICAL_BOUNDS.maxX),
    z: clamp(from.z + direction.z, TACTICAL_BOUNDS.minZ, TACTICAL_BOUNDS.maxZ) };
  if (distance(from, to) < .05) return { ok: false, reason: 'La limite de l’arène empêche ce déplacement.' };
  // A participant cannot finish on top of a living body. Try shorter steps,
  // keeping the rule deterministic and bounded rather than forcing overlap.
  const occupied = battle.actors.filter(candidate => candidate.id !== actor.id && candidate.hp > EPSILON)
    .map(candidate => getTacticalPosition(battle, candidate.id)).filter(Boolean);
  for (const ratio of [1, .75, .5, .25]) {
    const candidate = { x: from.x + (to.x - from.x) * ratio, z: from.z + (to.z - from.z) * ratio };
    if (distance(from, candidate) >= .05 && occupied.every(point => distance(point, candidate) >= 1.2)
      && segmentAllowed(battle, from, candidate, actor.id)) {
      return { ok: true, actorId: actor.id, actionId, from, to: candidate, atbCost: 100, distance: distance(from, candidate) };
    }
  }
  return { ok: false, reason: 'Le passage est occupé ou le sol ne permet pas ce déplacement.' };
}

export function commitTacticalMove(battle, plan) {
  battle.tactical.positions[plan.actorId] = { ...plan.to };
  battle.tactical.revision += 1;
}
