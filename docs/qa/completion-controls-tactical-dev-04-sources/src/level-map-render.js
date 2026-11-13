import { isLevelGround } from './level-layout-data.js';

const finite = values => values.every(Number.isFinite);
const number = value => Number(value.toFixed(4));

/** Equal world distances keep the same scale on both map axes. */
export function levelMapProjection(bounds, { left = 5, top = 5, width = 90, height = 90 } = {}) {
  if (!bounds || !finite([left, top, width, height, bounds.minX, bounds.maxX, bounds.minZ, bounds.maxZ])) return null;
  const rangeX = bounds.maxX - bounds.minX, rangeZ = bounds.maxZ - bounds.minZ;
  if (rangeX <= 0 || rangeZ <= 0 || width <= 0 || height <= 0) return null;
  const scale = Math.min(width / rangeX, height / rangeZ);
  const originX = left + (width - rangeX * scale) / 2, originZ = top + (height - rangeZ * scale) / 2;
  return { scale, originX, originZ, x: value => originX + (value - bounds.minX) * scale,
    z: value => originZ + (value - bounds.minZ) * scale,
    transform: `translate(${number(originX)} ${number(originZ)}) scale(${number(scale)}) translate(${-bounds.minX} ${-bounds.minZ})` };
}

/** Shared world-space silhouettes for the local map and the small radar. */
export function renderLevelGround(layout, { left = 5, top = 5, width = 90, height = 90 } = {}) {
  if (!layout?.rooms?.length || !layout.paths || !finite([left, top, width, height]) || width <= 0 || height <= 0) return '';
  const projection = levelMapProjection(layout.bounds, { left, top, width, height });
  if (!projection) return '';
  const { transform } = projection;
  const polygon = points => points.map(point => point.map(number).join(',')).join(' ');
  const coast = layout.coastPolygon ? `<polygon class="map-coast" points="${polygon(layout.coastPolygon)}" fill="#17313a" stroke="#65b8bb33" stroke-width=".3" vector-effect="non-scaling-stroke"/>` : '';
  const corridors = layout.paths.map(path => `<polyline data-map-route="${path.id}" points="${polygon(path.points)}" fill="none" stroke="${path.kind === 'main' ? '#667a66' : '#3f6962'}" stroke-width="${path.width}" stroke-linejoin="round" stroke-linecap="round"/>`).join('');
  const areas = layout.rooms.map(room => `<polygon data-map-sector="${room.id}" points="${polygon(room.polygon)}" fill="${room.kind === 'industrial' || room.kind === 'platform' ? '#40565d' : '#315b50'}" stroke="#91d4c059" stroke-width=".25" vector-effect="non-scaling-stroke"/>`).join('');
  const trails = layout.paths.map(path => `<polyline points="${polygon(path.points)}" fill="none" stroke="${path.kind === 'main' ? '#c7cba8' : '#83baaa'}" stroke-width="${path.kind === 'main' ? '.42' : '.3'}" stroke-dasharray="${path.kind === 'main' ? 'none' : '1.3 1.2'}" vector-effect="non-scaling-stroke"/>`).join('');
  return `<g class="level-map-ground" data-map-layout="${layout.id}" transform="${transform}">${coast}${corridors}${areas}${trails}</g>`;
}

/** Region names describe the ground currently occupied, without changing state. */
export function currentSectorLabel(layout, position) {
  if (!layout || !position || !finite([position.x, position.z])) return '';
  for (const room of layout.rooms) if (isLevelGround({ ...layout, rooms: [room], paths: [] }, position.x, position.z, 0)) return room.label;
  for (const path of layout.paths) if (isLevelGround({ ...layout, rooms: [], paths: [path] }, position.x, position.z, 0))
    return path.kind === 'return' ? 'Piste de retour' : path.kind === 'branch' ? 'Ravitaillement' : 'Chemin de liaison';
  return '';
}
