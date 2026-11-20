import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { fitWorldCamera, showCoveredActor } from '../src/world-camera.js';
import { WorldView } from '../src/world.js';

function bodyAt(x, z, width = 2.4, height = 3) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const body = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({
    map: new THREE.Texture(), alphaTest: .2, transparent: true,
  }));
  body.position.y = height / 2;
  body.rotation.y = Math.atan2(23, 27);
  group.add(body);
  return { group, body };
}

function cameraAt(target = new THREE.Vector3()) {
  const world = Object.create(WorldView.prototype);
  world.camera = new THREE.OrthographicCamera(-20, 20, 15, -15, .1, 500);
  world.cameraTarget = target;
  world.cameraOffset = new THREE.Vector3(23, 29, 27);
  world._positionCamera();
  return world.camera;
}

test('portrait framing fits the full battle formation, including a tall contact and its move destination', () => {
  const camera = cameraAt(new THREE.Vector3(40, .3, -35));
  const left = bodyAt(32, -27), right = bodyAt(51, -43, 5.4, 7.2);
  right.basePosition = new THREE.Vector3(54, 0, -46);
  const aspect = 390 / 844;
  fitWorldCamera(camera, [left, right], { aspect, baseSpan: 29, dt: 0, combat: true });
  assert.ok(camera.top - camera.bottom > 29);
  for (const actor of [left, right]) {
    const dx = (actor.basePosition?.x ?? actor.group.position.x) - actor.group.position.x;
    const dz = (actor.basePosition?.z ?? actor.group.position.z) - actor.group.position.z;
    const p = actor.body.geometry.attributes.position;
    for (let index = 0; index < p.count; index++) {
      const point = new THREE.Vector3().fromBufferAttribute(p, index).applyMatrix4(actor.body.matrixWorld);
      for (const frame of [point, point.clone().add(new THREE.Vector3(dx, 0, dz))]) {
        frame.project(camera);
        assert.ok(Math.abs(frame.x) <= .881, `full width stays inside the frame: ${frame.x}`);
        assert.ok(frame.y >= -.761 && frame.y <= .841, `full height stays inside the frame: ${frame.y}`);
      }
    }
  }
});

test('near a field limit the leader stays framed and zoom recovery depends on elapsed time', () => {
  const camera = cameraAt(new THREE.Vector3(9, 0, 10));
  const actor = bodyAt(17, 19);
  const span = fitWorldCamera(camera, [actor], { aspect: .5, baseSpan: 29, dt: 0, combat: false });
  const head = new THREE.Vector3(17, 3, 19).project(camera);
  assert.ok(Math.abs(head.x) < .88 && head.y > -.76 && head.y < .84);
  const recoverAt = hz => {
    let previousSpan = span;
    for (let step = 0; step < hz; step++) {
      previousSpan = fitWorldCamera(camera, [actor], { aspect: 2, baseSpan: 29, previousSpan, dt: 1 / hz, combat: false });
    }
    return previousSpan;
  };
  // Start with an explicitly larger span so the recovery cannot trivially
  // pass because the subject already fits at the default zoom.
  assert.ok(span > 29);
  assert.ok(Math.abs(recoverAt(20) - recoverAt(144)) < 1e-9);
  assert.ok(recoverAt(60) < span);
});

test('occluded pixels use the active pose and texture without changing visible-body depth or alpha', () => {
  const actor = bodyAt(0, 0);
  const { body, group } = actor;
  showCoveredActor(actor, true);
  const covered = actor.coveredBody;
  assert.equal(covered.parent, group);
  assert.equal(covered.material.depthFunc, THREE.GreaterDepth);
  assert.equal(covered.material.depthWrite, false);
  assert.equal(body.material.depthFunc, THREE.LessEqualDepth);
  assert.equal(body.material.depthWrite, true);
  assert.equal(body.material.alphaTest, .2);
  body.material.map = new THREE.Texture();
  body.position.set(.2, 1.8, .1);
  body.scale.set(.8, .88, 1);
  body.rotation.z = .1;
  showCoveredActor(actor, true);
  assert.equal(covered.geometry, body.geometry);
  assert.equal(covered.material.map, body.material.map);
  assert.deepEqual(covered.position, body.position);
  assert.deepEqual(covered.scale, body.scale);
  assert.deepEqual(covered.quaternion.toArray(), body.quaternion.toArray());
  group.visible = false;
  showCoveredActor(actor, true);
  assert.equal(covered.visible, false);
});
