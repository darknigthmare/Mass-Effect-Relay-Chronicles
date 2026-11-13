/**
 * ME1 / Thérum Mako driving prototype. Renderer state only: never serialize this
 * object into campaign saves. The world owns ground, obstacles and interactions.
 * Speeds/inertia are JRPG adaptation values, not original Mass Effect physics.
 */
export const FRONTIER_VEHICLES = Object.freeze({
  mako: Object.freeze({
    key: 'mako', label: 'Mako M35', mediaId: 'ME1', periodId: 'me1', zoneId: 'therum',
    radius: 1.45, boardRadius: 4, footRadius: .4, dismountRadius: 2.35,
    maxSpeed: 9, boostSpeed: 13, acceleration: 15, drag: 5,
    atlas: 'vehicle-mako-directions.png', metadata: 'vehicle-mako-directions.json',
    frames: Object.freeze(['front', 'back', 'left', 'right']),
    status: 'Prototype', weaponsAvailable: false, persistent: false,
  }),
});

const MAKO = FRONTIER_VEHICLES.mako;
const MAX_DT = .05;
const MAX_SUBSTEP = .18;
const LIMIT = 10000;
const CAMERA_LENGTH = Math.hypot(23, 27);
const validPoint = point => point && typeof point === 'object'
  && Number.isFinite(point.x) && Number.isFinite(point.z)
  && Math.abs(point.x) <= LIMIT && Math.abs(point.z) <= LIMIT;
const clonePoint = point => ({ x: point.x, z: point.z });
const length = point => Math.hypot(point.x, point.z);
const plain = value => !!value && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));

/** Four fixed direction drawings; invalid metadata never reaches texture UVs. */
export function normalizeMakoDirections(input) {
  try {
    if (!plain(input) || input.version !== 1 || input.vehicleId !== 'mako'
      || input.mediaId !== 'ME1' || input.periodId !== 'me1' || input.file !== MAKO.atlas
      || ![input.width, input.height].every(value => Number.isInteger(value) && value > 0 && value <= 8192)
      || !plain(input.frames)) return null;
    const frames = {};
    for (const direction of MAKO.frames) {
      const frame = input.frames[direction];
      if (!plain(frame) || frame.id !== `mako-${direction}`
        || !Array.isArray(frame.rect) || frame.rect.length !== 4 || !frame.rect.every(Number.isInteger)
        || !Array.isArray(frame.pivot) || frame.pivot.length !== 2 || !frame.pivot.every(Number.isFinite)
        || !Number.isFinite(frame.heightScale) || frame.heightScale < .1 || frame.heightScale > 1.5) return null;
      const [x, y, width, height] = frame.rect;
      if (x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > input.width || y + height > input.height
        || frame.pivot[0] < 0 || frame.pivot[0] > width || frame.pivot[1] < 0 || frame.pivot[1] > height) return null;
      for (const other of Object.values(frames)) {
        const [ox, oy, ow, oh] = other.rect;
        if (x < ox + ow && x + width > ox && y < oy + oh && y + height > oy) return null;
      }
      frames[direction] = Object.freeze({ id: frame.id, rect: Object.freeze([...frame.rect]),
        pivot: Object.freeze([...frame.pivot]), heightScale: frame.heightScale });
    }
    return Object.freeze({ version: 1, vehicleId: 'mako', mediaId: 'ME1', periodId: 'me1',
      status: 'Prototype', file: MAKO.atlas, width: input.width, height: input.height,
      displayHeight: 3, frames: Object.freeze(frames) });
  } catch { return null; }
}

function limitVector(vector, maximum) {
  const magnitude = length(vector);
  return magnitude > maximum
    ? { x: vector.x / magnitude * maximum, z: vector.z / magnitude * maximum }
    : clonePoint(vector);
}

/** Detached, validated snapshot; unknown keys and campaign data are discarded. */
export function getMakoState(state) {
  if (!state || state.key !== 'mako' || state.zoneId !== MAKO.zoneId
    || !validPoint(state.position) || !validPoint(state.velocity)
    || typeof state.mounted !== 'boolean') return null;
  return {
    key: 'mako', zoneId: MAKO.zoneId, position: clonePoint(state.position),
    velocity: state.mounted ? limitVector(state.velocity, MAKO.boostSpeed) : { x: 0, z: 0 },
    heading: MAKO.frames.includes(state.heading) ? state.heading : 'front',
    mounted: state.mounted,
  };
}

/** A parked Mako is recreated at the level's authored parking point on load. */
export function createMakoState(position) {
  if (!validPoint(position)) return null;
  return { key: 'mako', zoneId: MAKO.zoneId, position: clonePoint(position),
    velocity: { x: 0, z: 0 }, heading: 'front', mounted: false };
}

/** Caller also gates interactions on exploration mode and current ME1 campaign. */
export function boardMako(state, playerPosition, zoneId) {
  const next = getMakoState(state);
  if (!next || !validPoint(playerPosition)) return { ok: false, state: next, reason: 'invalid' };
  if (zoneId !== MAKO.zoneId) return { ok: false, state: next, reason: 'wrong-zone' };
  if (next.mounted) return { ok: false, state: next, reason: 'already-mounted' };
  if (Math.hypot(next.position.x - playerPosition.x, next.position.z - playerPosition.z) > MAKO.boardRadius) {
    return { ok: false, state: next, reason: 'too-far' };
  }
  next.mounted = true;
  return { ok: true, state: next, reason: null };
}

function walkable(check, x, z, radius) {
  if (typeof check !== 'function' || !validPoint({ x, z })) return false;
  try { return check(x, z, radius) === true; } catch { return false; }
}

/** Directions match the world's fixed camera at (23,29,27), not compass axes. */
export function makoDirectionFrame(state) {
  const next = getMakoState(state);
  if (!next) return 'front';
  if (length(next.velocity) < .08) return next.heading;
  const across = (next.velocity.x * 27 - next.velocity.z * 23) / CAMERA_LENGTH;
  const away = (-next.velocity.x * 23 - next.velocity.z * 27) / CAMERA_LENGTH;
  return Math.abs(across) > Math.abs(away)
    ? (across > 0 ? 'right' : 'left')
    : (away > 0 ? 'back' : 'front');
}

/**
 * input.x/z are WORLD axes, after the same camera-basis conversion used on foot.
 * dt is bounded; stalls do not teleport. Every <= .18-unit substep asks the world
 * to test the WHOLE radius-1.45 footprint against ground and padded colliders.
 * Missing/throwing ground callbacks stop the Mako rather than bypass collisions.
 */
export function stepMako(state, input, dt, isVehicleWalkable) {
  const next = getMakoState(state);
  if (!next || !next.mounted || !Number.isFinite(dt) || dt <= 0) return next;
  const elapsed = Math.min(dt, MAX_DT);
  if (!walkable(isVehicleWalkable, next.position.x, next.position.z, MAKO.radius)) {
    next.velocity = { x: 0, z: 0 };
    return next;
  }
  const stick = validPoint(input) ? limitVector(input, 1) : { x: 0, z: 0 };
  const speed = input?.boost === true ? MAKO.boostSpeed : MAKO.maxSpeed;
  if (length(stick) > .001) {
    const change = { x: stick.x * speed - next.velocity.x, z: stick.z * speed - next.velocity.z };
    const delta = limitVector(change, MAKO.acceleration * elapsed);
    next.velocity.x += delta.x;
    next.velocity.z += delta.z;
  } else {
    const damping = Math.exp(-MAKO.drag * elapsed);
    next.velocity.x *= damping;
    next.velocity.z *= damping;
    if (length(next.velocity) < .02) next.velocity = { x: 0, z: 0 };
  }
  next.velocity = limitVector(next.velocity, speed);
  // Preserve intended facing when a wall stops all motion.
  next.heading = makoDirectionFrame(next);
  const steps = Math.max(1, Math.ceil(length(next.velocity) * elapsed / MAX_SUBSTEP));
  for (let index = 0; index < steps; index += 1) {
    const dx = next.velocity.x * elapsed / steps;
    const dz = next.velocity.z * elapsed / steps;
    const x = next.position.x, z = next.position.z;
    if (walkable(isVehicleWalkable, x + dx, z + dz, MAKO.radius)) {
      next.position.x += dx;
      next.position.z += dz;
      continue;
    }
    // Slide along an obstacle; test the second axis from the already moved point.
    if (dx && walkable(isVehicleWalkable, x + dx, z, MAKO.radius)) next.position.x += dx;
    else next.velocity.x = 0;
    if (dz && walkable(isVehicleWalkable, next.position.x, z + dz, MAKO.radius)) next.position.z += dz;
    else next.velocity.z = 0;
  }
  return next;
}

/** Exit stays mounted if none of 16 adjacent foot paths and footprints is safe. */
export function dismountMako(state, isFootWalkable) {
  const next = getMakoState(state);
  if (!next) return { ok: false, state: null, position: null, reason: 'invalid' };
  if (!next.mounted) return { ok: false, state: next, position: null, reason: 'not-mounted' };
  for (let index = 0; index < 16; index += 1) {
    const angle = index * Math.PI / 8;
    const position = {
      x: next.position.x + Math.cos(angle) * MAKO.dismountRadius,
      z: next.position.z + Math.sin(angle) * MAKO.dismountRadius,
    };
    let clear = true;
    const samples = Math.ceil(MAKO.dismountRadius / MAX_SUBSTEP);
    for (let sample = 0; sample <= samples; sample += 1) {
      const t = sample / samples;
      if (!walkable(isFootWalkable,
        next.position.x + (position.x - next.position.x) * t,
        next.position.z + (position.z - next.position.z) * t,
        MAKO.footRadius)) { clear = false; break; }
    }
    if (!clear) continue;
    next.mounted = false;
    next.velocity = { x: 0, z: 0 };
    return { ok: true, state: next, position, reason: null };
  }
  return { ok: false, state: next, position: null, reason: 'no-safe-ground' };
}
