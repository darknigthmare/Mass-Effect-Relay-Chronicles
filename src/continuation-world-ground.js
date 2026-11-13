import * as THREE from 'three';

// Only meshes explicitly authored as walkable supports are queried. A general
// scene raycast would put the commando on roofs, consoles or decorative beams.
const ray = new THREE.Raycaster();
const origin = new THREE.Vector3();
const down = new THREE.Vector3(0, -1, 0);
const normal = new THREE.Vector3();
const normalMatrix = new THREE.Matrix3();

export function sampleWalkableHeight(surfaces = [], x, z, fallback = 0) {
  if (![x, z, fallback].every(Number.isFinite)) return fallback;
  let height = fallback;
  ray.set(origin.set(x, 1000, z), down);
  ray.near = 0; ray.far = 2000;
  for (const surface of surfaces) {
    if (!surface?.isMesh || !surface.visible) continue;
    surface.updateWorldMatrix(true, false);
    for (const hit of ray.intersectObject(surface, false)) {
      if (!hit.face) continue;
      normalMatrix.getNormalMatrix(surface.matrixWorld);
      normal.copy(hit.face.normal).applyNormalMatrix(normalMatrix);
      if (normal.y >= .5) height = Math.max(height, hit.point.y);
    }
  }
  return height;
}
