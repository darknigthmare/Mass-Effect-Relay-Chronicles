import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { isLevelGround, nearestLevelGround } from './level-layout-data.js';

const distanceToSegment = (x, z, a, b) => {
  const dx = b[0] - a[0], dz = b[1] - a[1], n = dx * dx + dz * dz;
  const t = n ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / n)) : 0;
  return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t);
};
const reserved = (layout, x, z, radius = 1) => layout.reservations.some(area => area.kind === 'arena'
  ? Math.abs(x - area.x) < area.halfWidth + radius + 1 && Math.abs(z - area.z) < area.halfDepth + radius + 1
  : Math.hypot(x - area.x, z - area.z) < area.radius + radius + 1)
  || layout.paths.some(path => path.points.slice(1).some((p, i) => distanceToSegment(x, z, path.points[i], p) < path.width / 2 + radius + 1));
const inPolygon = (polygon, x, z) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[j], b = polygon[i];
    if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
};
function surface(world, polygon, material, y = .015) {
  const shape = new THREE.Shape(); polygon.forEach(([x, z], i) => i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)); shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape); geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position, uv = geometry.attributes.uv;
  for (let i = 0; i < position.count; i++) uv.setXY(i, position.getX(i) / 5, position.getZ(i) / 5);
  return world._mesh(geometry, material, 0, y, 0);
}
function relief(world, layout) {
  const b = layout.bounds, step = 2, columns = Math.ceil((b.maxX - b.minX) / step), rows = Math.ceil((b.maxZ - b.minZ) / step);
  const vertices = [], colors = [], uvs = [], indices = [];
  for (let z = 0; z <= rows; z++) for (let x = 0; x <= columns; x++) {
    const px = b.minX + x / columns * (b.maxX - b.minX), pz = b.minZ + z / rows * (b.maxZ - b.minZ);
    const near = isLevelGround(layout, px, pz, 0) ? { x: px, z: pz } : nearestLevelGround(layout, { x: px, z: pz }, 0);
    const distance = near ? Math.hypot(px - near.x, pz - near.z) : 40;
    const height = distance < 2 ? -.035 : Math.min(9, (distance - 2) * .67) + Math.sin(px * .17 + pz * .11) * Math.min(1.1, (distance - 2) * .12);
    vertices.push(px, height, pz); uvs.push(px / 5, pz / 5);
    const shade = Math.max(.46, 1 - distance * .022); colors.push(shade, shade * (.97 - Math.min(.15, distance * .007)), shade * .88);
  }
  for (let z = 0; z < rows; z++) for (let x = 0; x < columns; x++) {
    const a = z * (columns + 1) + x, c = a + columns + 1;
    const centerX = b.minX + (x + .5) / columns * (b.maxX - b.minX), centerZ = b.minZ + (z + .5) / rows * (b.maxZ - b.minZ);
    if (inPolygon(layout.coastPolygon, centerX, centerZ)) indices.push(a, c, a + 1, a + 1, c, c + 1);
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  world._mesh(geometry, world._edenTerrainMaterial('grass', 0xa2ae82, true));
}

// Merge each large prop internally while retaining a group which can yield to
// nearby battles. No architecture is baked over the combat actors afterward.
function sceneryGroup(world, id, x, z, build) {
  const existing = new Set(world.stage.children); build();
  const group = new THREE.Group(); group.name = id; group.userData.keep = true;
  group.userData.levelScenery = { x, z }; world.stage.add(group);
  for (const object of [...world.stage.children]) if (object !== group && !existing.has(object)) group.add(object);
  group.updateMatrixWorld(true); const buckets = new Map(), old = [];
  group.traverse(object => {
    if (!object.isMesh || object.material.transparent || object.userData.keep || Array.isArray(object.material)) return;
    const geometry = object.geometry.clone(); geometry.applyMatrix4(object.matrixWorld);
    if (!buckets.has(object.material.uuid)) buckets.set(object.material.uuid, { material: object.material, parts: [] });
    buckets.get(object.material.uuid).parts.push(geometry.index ? geometry.toNonIndexed() : geometry);
    if (geometry.index) geometry.dispose(); old.push(object);
  });
  for (const bucket of buckets.values()) {
    const geometry = mergeGeometries(bucket.parts, false); bucket.parts.forEach(part => part.dispose());
    if (geometry) world._mesh(geometry, bucket.material, 0, 0, 0, group);
  }
  for (const object of old) { object.parent.remove(object); object.geometry.dispose(); }
  world.combatOccluders.push(group); return group;
}

/** Authoring of the retained ME1 prologue, not a surveyed original-game map. */
export function buildEdenScene(world, layout) {
  relief(world, layout);
  const grass = world._edenTerrainMaterial('grass', 0xa3ad85), dirt = world._edenTerrainMaterial('dirt', 0xc5b296);
  for (const room of layout.rooms) surface(world, room.polygon, grass, -.015);
  for (const path of layout.paths) {
    world._road(path.points, path.width, grass, -.045);
    world._road(path.points, path.kind === 'return' ? 2.5 : 4.6, dirt, .005);
    for (const [x, z] of path.points) world._mesh(new THREE.CircleGeometry(path.width / 2, 20), grass, x, -.014, z).rotation.x = -Math.PI / 2;
  }
  const stone = world._material(0x6e7568, .96, .05), dark = world._material(0x35464a, .7, .5), steel = world._material(0x758487, .7, .6);
  const water = world._box(340, .035, 360, new THREE.MeshStandardMaterial({ color: 0x41646a, roughness: .34, metalness: .37 }), 0, -.7, -22);
  water.userData.keep = true;
  // Distant jagged ridges continue past the playable contour, rather than a
  // square wall or a rectangular floor edge around the party.
  for (let i = 0; i < 25; i++) {
    const angle = i / 25 * Math.PI * 2, x = 94 * Math.cos(angle), z = -20 + 120 * Math.sin(angle), h = 15 + world.rand() * 20;
    const ridge = world._mesh(new THREE.ConeGeometry(12 + world.rand() * 13, h, 5), stone, x, h * .42 - 2, z);
    ridge.rotation.y = world.rand() * Math.PI;
  }
  // Landmark arrangements stay clear of authored approaches and fighting pads.
  sceneryGroup(world, 'eden-landing-relay', -32, 47, () => {
    world._box(5.2, .35, 7.5, steel, -31, .15, 46, true);
    world._rectCollider(-31, 46, 5.2, 7.5);
    world._box(2.3, 1.8, 3.5, dark, -32, 1.1, 47, true);
    world._cylinder(.13, 6.5, steel, -34, 3.25, 49, .11, 8);
    world._sign('UTOPIA · EDEN PRIME', -32, 3.1, 49, 5.8);
    world._propSprite(12, -28.5, 48, 2.2);
  });
  sceneryGroup(world, 'eden-farmstead', 39, -10, () => {
    world._building(39, -10, 7, 10, 4.2, 0x9ba294, 0x839b8d);
    world._building(35, 1, 10, 5, 3.7, 0x9ba294, 0x839b8d);
    world._sign('COLONIE AGRICOLE', 38, 3.8, -4.7, 5.8);
    world._smoke(41, -14, .8);
    for (let i = 0; i < 5; i++) world._box(6, .16, .7, world._material(0x61794a, 1, 0), 11, .08, -13 + i * 2.1);
  });
  sceneryGroup(world, 'eden-dig-and-camp', 1, -40, () => {
    for (const [x, z, w, d] of [[0, -33, 6, 2], [3, -42, 4, 3], [-1, -49, 5, 2]]) world._box(w, 1.1, d, stone, x, .55, z, true);
    world._box(4.5, .22, 5, dark, 0, .12, -41);
    world._rectCollider(0, -41, 4.5, 5);
    world._console(1, -40, -.3);
    world._propSprite(6, 1, -44, 1.9);
    world._sign('SITE DE FOUILLE', 2, 2.6, -35, 4.8);
  });
  sceneryGroup(world, 'eden-freight-quay', 31, -46, () => {
    world._box(6.5, .6, 26, dark, 34, .28, -47);
    world._rectCollider(34, -47, 6.5, 26);
    for (const x of [32, 35]) world._box(.12, .12, 34, steel, x, .66, -47);
    for (const z of [-38, -47, -59]) {
      world._box(4.1, 2.8, 6.5, world._material(0x856c54, .8, .45), 34, 1.9, z, true);
      for (const dz of [-2.2, 2.2]) for (const x of [32.4, 35.6]) world._cylinder(.42, .23, dark, x, .6, z + dz, .42, 10).rotation.z = Math.PI / 2;
    }
    world._box(.7, 8.4, .7, steel, 31, 4.2, -35); world._box(11, .5, .6, steel, 26, 8.2, -35);
    world._sign('FRET · PLATEFORME', 31, 4.8, -32, 5.8);
  });
  sceneryGroup(world, 'eden-beacon', 10, -84, () => {
    world._cylinder(3.1, .5, stone, 10, .2, -84, 3.7, 12);
    const beacon = world._box(.85, 5.1, .8, world._material(0x4f6963, .55, .6), 10, 2.9, -84, true); beacon.rotation.z = -.12;
    world._box(.16, 3.9, .08, world._material(0xa5efc8, .25, .2, 0x55b990), 10.04, 2.95, -83.5);
    world._circleCollider(10, -84, 3.1);
    const glow = new THREE.PointLight(0x81ecc3, 10, 13); glow.position.set(10, 4, -83); world.stage.add(glow);
  });
  for (const [x, z, size] of [[-42, 20, .9], [-36, 19, .7], [4, -63, 1.1]]) if (!reserved(layout, x, z, size)) world._crate(x, z, size);
  world._propSprite(0, -41, 19, 1.2); world._propSprite(3, -37, 16, 1.2);
  // A restrained population follows the larger land shape, not the old54x58
  // random rectangle. Critical routes and combat sightlines remain reserved.
  let trees = 0;
  for (let i = 0; i < 320 && trees < 70; i++) {
    const x = layout.bounds.minX + world.rand() * (layout.bounds.maxX - layout.bounds.minX);
    const z = layout.bounds.minZ + world.rand() * (layout.bounds.maxZ - layout.bounds.minZ);
    if (!isLevelGround(layout, x, z, 2) || reserved(layout, x, z, 1.3)) continue;
    world._tree(x, z, .75 + world.rand() * .5); trees++;
  }
  for (let i = 0; i < 45; i++) {
    const x = layout.bounds.minX + world.rand() * (layout.bounds.maxX - layout.bounds.minX);
    const z = layout.bounds.minZ + world.rand() * (layout.bounds.maxZ - layout.bounds.minZ);
    if (!isLevelGround(layout, x, z, 1.5) || reserved(layout, x, z, 1.6)) continue;
    world._rock(x, z, .6 + world.rand() * .7, 0x6c7464, .7);
  }
  world._vehicleSprite('sovereign', -52, -124, 25, 16);
  world.edenSceneMetrics = { rooms: layout.rooms.length, paths: layout.paths.length, landmarks: layout.landmarks.length, trees,
    authoredArea: 'rooms-and-corridors', relief: true, rectangularFloor: false };
}
