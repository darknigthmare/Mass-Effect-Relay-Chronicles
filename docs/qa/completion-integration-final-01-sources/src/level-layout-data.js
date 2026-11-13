import { FRONTIER_LAYOUTS } from './frontier-layout-data.js';
import { HORIZON_LAYOUTS } from './horizon-layout-data.js';
// Authored spatial adaptation of the existing ME1 prologue. These coordinates
// are not a surveyed reconstruction of the original game's map.
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const rooms = [
  { id: 'landing', label: 'Zone de largage', kind: 'grass', center: { x: -20, z: 43 },
    polygon: [[-36, 56], [-4, 56], [3, 43], [-7, 30], [-30, 28], [-42, 38]] },
  { id: 'patrol', label: 'Sentier de la patrouille', kind: 'earth', center: { x: -14, z: 12 },
    polygon: [[-30, 24], [0, 27], [7, 14], [-4, -3], [-24, -2], [-36, 10]] },
  { id: 'farm', label: 'Ferme attaquée', kind: 'colony', center: { x: 25, z: -10 },
    polygon: [[6, 5], [40, 6], [49, -8], [39, -25], [15, -27], [4, -14]] },
  { id: 'quays', label: 'Quais de fret', kind: 'industrial', center: { x: 20, z: -48 },
    polygon: [[1, -27], [31, -25], [41, -40], [35, -64], [6, -69], [-7, -49]] },
  { id: 'beacon', label: 'Plateforme de la balise', kind: 'platform', center: { x: 10, z: -78 },
    polygon: [[-8, -67], [27, -65], [35, -77], [24, -90], [-4, -88], [-16, -78]] },
];
const paths = [
  { id: 'main', kind: 'main', width: 8,
    points: [[-20, 44], [-21, 35], [-25, 27], [-24, 18], [-14, 12], [-3, 8], [8, 2],
      [19, -4], [25, -10], [25, -23], [16, -30], [13, -40], [22, -55], [19, -66], [10, -78]] },
  { id: 'supply-loop', kind: 'branch', width: 7,
    points: [[-24, 24], [-35, 26], [-39, 18], [-35, 9], [-26, 8], [-14, 12]] },
  { id: 'western-return', kind: 'return', width: 6,
    points: [[10, -78], [-9, -76], [-25, -62], [-38, -41], [-43, -14], [-39, 18]] },
];
const pois = {
  arrival: { x: -20, z: 41 }, cache: { x: -39, z: 18 },
  'encounter-1': { x: -14, z: 12 }, 'encounter-2': { x: 25, z: -10 },
  boss: { x: 22, z: -55 }, objective: { x: 10, z: -78 }, exit: { x: -24, z: 47 },
};
const landmarks = [
  { id: 'drop-zone', label: 'Zone de largage', kind: 'landing', x: -20, z: 44, productionRecordId: 'ZON-eden-prime-zone-de-largage' },
  { id: 'drone-path', label: 'Sentier de reconnaissance', kind: 'rocks', x: -21, z: 28, productionRecordId: 'ZON-eden-prime-sentier-des-drones' },
  { id: 'attacked-farm', label: 'Ferme attaquée', kind: 'farm', x: 35, z: -10, productionRecordId: 'ZON-eden-prime-ferme-attaquee' },
  { id: 'dig-site', label: 'Site de fouille', kind: 'dig', x: 9, z: -31, productionRecordId: 'ZON-eden-prime-site-de-fouille' },
  { id: 'research-camp', label: 'Campement scientifique', kind: 'camp', x: 2, z: -41, productionRecordId: 'ZON-eden-prime-campement-scientifique' },
  { id: 'rail-quay', label: 'Quai ferroviaire', kind: 'rail', x: 25, z: -42, productionRecordId: 'ZON-eden-prime-quai-ferroviaire' },
  { id: 'freight-train', label: 'Train de fret', kind: 'train', x: 21, z: -59, productionRecordId: 'ZON-eden-prime-train-de-fret' },
  { id: 'charge-platform', label: 'Plateforme industrielle', kind: 'platform', x: 5, z: -66, productionRecordId: 'ZON-eden-prime-plateforme-de-desamorcage' },
  { id: 'beacon-platform', label: 'Balise prothéenne', kind: 'beacon', x: 10, z: -78, productionRecordId: 'ZON-eden-prime-plateforme-de-la-balise' },
];
const arenas = Object.fromEntries(['encounter-1', 'encounter-2', 'boss'].map(suffix => [`eden-prime:${suffix}`, { ...pois[suffix] }]));
const eden = {
  id: 'eden-prime', version: 1, partial: true,
  bounds: { minX: -54, maxX: 56, minZ: -92, maxZ: 58 }, spawn: { x: -20, z: 44 },
  arena: { ...pois['encounter-1'] }, arenas, pois, rooms, paths, sectors: rooms, corridors: paths, landmarks,
  camera: { follow: 1, span: 29, limits: { minX: -44, maxX: 46, minZ: -82, maxZ: 48 } },
  contours: { areas: rooms.map(room => ({ id: room.id, polygon: room.polygon })),
    paths: paths.map(path => ({ id: path.id, points: path.points, width: path.width })) },
  // This outline is distant scenery; only rooms/paths define navigable ground.
  coastPolygon: [[-50, 59], [-8, 62], [12, 50], [12, 25], [51, 22], [61, -2], [53, -34],
    [46, -65], [37, -95], [-8, -96], [-29, -86], [-51, -53], [-57, -13], [-53, 23]],
  reservations: [
    ...Object.entries(pois).map(([id, position]) => ({ id: `approach:${id}`, ...position, radius: 3.4, kind: 'approach' })),
    ...Object.entries(arenas).map(([id, position]) => ({ id: `arena:${id}`, ...position, halfWidth: 8, halfDepth: 7, kind: 'arena' })),
  ],
  reference: { sourceId: 'PRIMA-PROLOGUE', pageRangePDF: [9, 16],
    url: 'https://na.llnet.bioware.cdn.ea.com/u/f/eagames/bioware/masseffect/prima/prima_guide_me_pc.pdf',
    limitation: 'The guide documents the sequence and named places. The authored ground contours, distances and landmark placements remain an adaptation; train travel, survivors and timed charges are not newly simulated.' },
};
export const LEVEL_LAYOUTS = freeze({ 'eden-prime': eden, ...FRONTIER_LAYOUTS, ...HORIZON_LAYOUTS });
export const EDEN_LAYOUT = LEVEL_LAYOUTS['eden-prime'];
export const getLevelLayout = zoneId => Object.hasOwn(LEVEL_LAYOUTS, zoneId) ? LEVEL_LAYOUTS[zoneId] : null;

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
function closestOnSegment(x, z, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1], length2 = dx * dx + dz * dz;
  const t = length2 ? clamp(((x - a[0]) * dx + (z - a[1]) * dz) / length2, 0, 1) : 0;
  return { x: a[0] + t * dx, z: a[1] + t * dz };
}
function polygonContains(polygon, x, z, padding) {
  let inside = false, distance = Infinity;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[j], b = polygon[i], near = closestOnSegment(x, z, a, b);
    distance = Math.min(distance, Math.hypot(x - near.x, z - near.z));
    if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return (inside || distance < 1e-9) && distance + 1e-9 >= padding;
}

/** Ground mask only. The renderer must additionally test its scenery colliders. */
export function isLevelGround(layout, x, z, padding = .4) {
  if (!layout || ![x, z, padding].every(Number.isFinite) || padding < 0) return false;
  const b = layout.bounds;
  if (x < b.minX + padding || x > b.maxX - padding || z < b.minZ + padding || z > b.maxZ - padding) return false;
  if (layout.rooms.some(room => polygonContains(room.polygon, x, z, padding))) return true;
  return layout.paths.some(path => path.width / 2 >= padding && path.points.slice(1).some((point, index) => {
    const near = closestOnSegment(x, z, path.points[index], point);
    return Math.hypot(x - near.x, z - near.z) <= path.width / 2 - padding + 1e-9;
  }));
}

function insetPolygon(polygon, padding) {
  const area = polygon.reduce((sum, point, i) => sum + cross(point, polygon[(i + 1) % polygon.length]), 0);
  const edges = polygon.map((point, i) => {
    const next = polygon[(i + 1) % polygon.length], d = [next[0] - point[0], next[1] - point[1]];
    const length = Math.hypot(...d), direction = area >= 0 ? 1 : -1;
    const normal = [-d[1] / length * direction, d[0] / length * direction];
    return { point: [point[0] + normal[0] * padding, point[1] + normal[1] * padding], d };
  });
  return edges.map((edge, i) => {
    const previous = edges[(i + edges.length - 1) % edges.length], determinant = cross(previous.d, edge.d);
    if (Math.abs(determinant) < 1e-9) return edge.point;
    const delta = [edge.point[0] - previous.point[0], edge.point[1] - previous.point[1]];
    const t = cross(delta, edge.d) / determinant;
    return [previous.point[0] + previous.d[0] * t, previous.point[1] + previous.d[1] * t];
  });
}

/** Geometry projection only; the caller resolves remaining scenery collisions. */
export function nearestLevelGround(layout, position, padding = .4) {
  if (!layout || !position || ![position.x, position.z, padding].every(Number.isFinite) || padding < 0) return null;
  if (isLevelGround(layout, position.x, position.z, padding)) return { x: position.x, z: position.z };
  const candidates = [];
  for (const room of layout.rooms) {
    const polygon = insetPolygon(room.polygon, padding + .01);
    candidates.push({ ...room.center });
    for (let i = 0; i < polygon.length; i++) candidates.push(closestOnSegment(position.x, position.z, polygon[i], polygon[(i + 1) % polygon.length]));
  }
  for (const path of layout.paths) for (let i = 1; i < path.points.length; i++) {
    const near = closestOnSegment(position.x, position.z, path.points[i - 1], path.points[i]);
    const dx = position.x - near.x, dz = position.z - near.z, distance = Math.hypot(dx, dz), radius = Math.max(0, path.width / 2 - padding - .01);
    candidates.push(near);
    if (distance) candidates.push({ x: near.x + dx / distance * radius, z: near.z + dz / distance * radius });
  }
  return candidates.filter(point => isLevelGround(layout, point.x, point.z, padding))
    .sort((a, b) => Math.hypot(a.x - position.x, a.z - position.z) - Math.hypot(b.x - position.x, b.z - position.z))[0] || null;
}
