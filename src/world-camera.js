import { GreaterDepth, MathUtils, Mesh, MeshBasicMaterial, Vector3 } from 'three';

const cameraRight = new Vector3();
const cameraUp = new Vector3();
const corner = new Vector3();

// Reserve a little more vertical room below the formation for combat commands.
// The camera's target limits remain authored in world space.
export function fitWorldCamera(camera, actors, { aspect, baseSpan, previousSpan, dt, combat }) {
  cameraRight.setFromMatrixColumn(camera.matrixWorld, 0);
  cameraUp.setFromMatrixColumn(camera.matrixWorld, 1);
  const minimumWidth = combat ? 20 : 16;
  let requiredSpan = Math.max(baseSpan, minimumWidth / aspect);
  const viewOffset = combat ? -.12 : 0;
  for (const actor of actors) {
    const body = actor.body;
    if (!actor.group.visible || !body?.visible || !body.geometry) continue;
    body.updateWorldMatrix(true, false);
    if (!body.geometry.boundingBox) body.geometry.computeBoundingBox();
    const { min, max } = body.geometry.boundingBox;
    const destination = combat ? actor.basePosition : null;
    const dx = (destination?.x ?? actor.group.position.x) - actor.group.position.x;
    const dz = (destination?.z ?? actor.group.position.z) - actor.group.position.z;
    const headingX = dx * cameraRight.x + dz * cameraRight.z;
    const headingY = dx * cameraUp.x + dz * cameraUp.z;
    // Actor bodies are planar meshes. Cover all four corners of the posed sprite,
    // its pivot and the end of any tactical movement before the animation catches up.
    for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) {
      corner.set(x, y, 0).applyMatrix4(body.matrixWorld).sub(camera.position);
      const screenX = corner.dot(cameraRight), screenY = corner.dot(cameraUp);
      const width = Math.max(Math.abs(screenX), Math.abs(screenX + headingX));
      const top = Math.max(screenY, screenY + headingY);
      const bottom = Math.min(screenY, screenY + headingY);
      requiredSpan = Math.max(requiredSpan, 2 * width / (.88 * aspect),
        2 * top / (.84 + viewOffset), -2 * bottom / (.76 - viewOffset));
    }
  }
  const prior = Number.isFinite(previousSpan) ? previousSpan : requiredSpan;
  // Zoom out immediately to keep the subjects in view, then ease back in.
  const span = Math.max(requiredSpan, MathUtils.damp(prior, requiredSpan, 5, dt));
  const halfWidth = span * aspect / 2, halfHeight = span / 2;
  const offsetY = viewOffset * halfHeight;
  if (camera.right !== halfWidth || camera.top !== halfHeight + offsetY) {
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight + offsetY;
    camera.bottom = -halfHeight + offsetY;
    camera.updateProjectionMatrix();
  }
  return span;
}

// The normal body keeps its depth and alpha rules. A second pass makes covered
// pixels readable over foreground scenery. Its depth comparison rejects every
// pixel already visible in the normal pass, even with merged stage geometry.
export function showCoveredActor(actor, enabled) {
  const body = actor.body;
  const visible = enabled && actor.group.visible && body?.visible && !!body.material?.map;
  if (!visible && !actor.coveredBody) return;
  if (!actor.coveredBody) {
    const material = new MeshBasicMaterial({
      color: actor.enemy ? 0xffb5a4 : 0xaef5f3,
      transparent: true, depthWrite: false, depthFunc: GreaterDepth, toneMapped: false,
    });
    actor.coveredBody = new Mesh(body.geometry, material);
    actor.coveredBody.renderOrder = 2;
    actor.coveredBody.name = 'covered-actor';
    actor.group.add(actor.coveredBody);
  }
  const covered = actor.coveredBody;
  covered.visible = visible;
  if (!visible) return;
  covered.geometry = body.geometry;
  covered.position.copy(body.position);
  covered.quaternion.copy(body.quaternion);
  covered.scale.copy(body.scale);
  covered.material.map = body.material.map;
  covered.material.side = body.material.side;
  covered.material.opacity = .58 * body.material.opacity;
  covered.material.alphaTest = body.material.alphaTest * .58;
}
