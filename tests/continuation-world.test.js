import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { WorldView } from '../src/world.js';
import { sampleWalkableHeight } from '../src/continuation-world-ground.js';
import { initialCustomization } from '../src/customization.js';
import { createBattle } from '../src/combat.js';
import { actorFor, enemiesFor } from '../src/game-data.js';
import { newGame } from '../src/state.js';

const near = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-6, `${message}: ${actual} != ${expected}`);

// Independent native fixture: call actual setZone/merge/party/update methods.
// Only browser canvas/image/label boundaries are substituted. The generated
// geometry, colliders, support registration and camera math remain production.
function worldFixture(zoneId = 'citadel') {
  const world = Object.create(WorldView.prototype);
  Object.assign(world, {
    mode: 'explore', time: 0, keys: new Set(), player: { x: 0, z: 0 }, party: ['shepard', 'kaidan', 'jenkins'],
    commanderAppearance: 'male', commanderCustomization: initialCustomization(), storyContext: null,
    scene: new THREE.Scene(), stage: new THREE.Group(), characters: new THREE.Group(), particles: new THREE.Group(),
    actors: [], ambientActors: [], battleActors: new Map(), spriteCache: new Map(), textureCache: new Map(),
    materialCache: new Map(), customizationTextures: new Map(), characterAnimations: {}, effects: [], animations: [],
    atlases: Object.fromEntries(['crew', 'enemy', 'boss', 'npc', 'props', 'vehicles'].map(key => [key, new THREE.Texture({ width: 1600, height: 1200 })])),
    assetErrors: [], operationPois: [], poiViews: [], cleared: new Set(),
    camera: new THREE.OrthographicCamera(-24, 24, 15, -15, .1, 500), cameraOffset: new THREE.Vector3(23, 29, 27), cameraTarget: new THREE.Vector3(),
    renderer: { render() {} }, _sign() {}, _makeMarkers() { this.poiViews = []; }, resize() {}, getNearby() { return null; },
  });
  world.scene.add(world.stage, world.characters, world.particles);
  world.scene.background = new THREE.Color(0);
  world._texturedMaterial = color => world._material(color);
  world._edenTerrainMaterial = (kind, color) => world._material(color || 0x556655);
  world.setZone(zoneId);
  world.visualAccessibility = { ambientPulse: false, spriteShake: false };
  return world;
}

test('walkable sampling follows transformed floor triangles and excludes walls, roofs and downward faces', () => {
  const floor = new THREE.Mesh(new THREE.BoxGeometry(8, .5, 8), new THREE.MeshBasicMaterial());
  const parent = new THREE.Group(); parent.position.set(3, 2, 5); parent.add(floor);
  near(sampleWalkableHeight([floor], 3, 5), 2.25, 'world-transformed top');
  near(sampleWalkableHeight([floor], 8, 5), 0, 'outside support');
  const roof = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 8), new THREE.MeshBasicMaterial()); roof.position.set(3, 7, 5); parent.add(roof);
  near(sampleWalkableHeight([floor], 3, 5), 2.25, 'unregistered roof ignored');
  const slope = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  slope.rotation.x = -Math.PI / 3; slope.position.y = 3;
  near(sampleWalkableHeight([slope], 0, 1), 3 - 1 / Math.sqrt(3), 'sloped support');
  slope.rotation.x = Math.PI / 2;
  near(sampleWalkableHeight([slope], 0, 0), 0, 'downward face rejected');
  floor.visible = false;
  near(sampleWalkableHeight([floor], 3, 5), 0, 'hidden support rejected');
});

test('native Citadel stairs ground the entire squad, feet and shadows on ascent and descent after static merging', () => {
  for (const zone of ['citadel', 'citadel-finale']) {
    const world = worldFixture(zone);
    assert.equal(world.walkableSurfaces.length, 6);
    for (const surface of world.walkableSurfaces) assert.ok(surface.parent, 'support survives native static merge');
    const profile = [[-15.5, .06], [-16.15, .146], [-16.65, .232], [-17.15, .318], [-17.65, .404], [-18.5, .49]];
    for (const [z, expected] of [...profile, ...profile.toReversed()]) {
      world.setPosition({ x: 0, z }); world.update(0, { render: false });
      near(world.actors[0].group.position.y, expected, `${zone} leader ground at ${z}`);
      for (const actor of world.actors) {
        const ground = world._groundHeightAt(actor.group.position.x, actor.group.position.z);
        near(actor.group.position.y, ground, 'every member follows its own support');
        near(actor.group.position.y + actor.shadow.position.y, ground + .035, 'contact shadow');
        near(actor.group.position.y + actor.body.position.y - actor.height / 2, ground + .05, 'feet pivot');
      }
    }
    world.setZone('normandy');
    assert.equal(world.walkableSurfaces.length, 1, 'zone replacement releases the old supports');
    near(world._groundHeightAt(0, -18.5), 0, 'old Citadel platform cannot leak to Normandy');
    near(world._groundHeightAt(0, 11), .06, 'Normandy deck top');
  }
});

test('native ambient and combat bodies stand on the platform while a lifted contact shadow stays on the floor', () => {
  const world = worldFixture(), state = newGame();
  world.update(0, { render: false });
  const udina = world.ambientActors.find(actor => actor.key === 'udina');
  assert.ok(udina); near(udina.group.position.y, .404, 'upper approach stair NPC');
  world.setPosition({ x: 0, z: -18.5 });
  const battle = createBattle({ party: [actorFor('shepard', state)], enemies: enemiesFor('eden-prime', 0, state), mode: 'wait' });
  world.setBattle(battle); world.setMode('combat'); world.update(0, { render: false });
  const leader = world.battleActors.get('shepard');
  // This declared battle geometry fixture places a native tactical body on
  // the actual platform, without assigning application progression or clocks.
  leader.basePosition.set(0, 0, -18.5); leader.group.position.copy(leader.basePosition);
  battle.actors.find(actor => actor.id === 'shepard').statuses.lift = 1;
  world.update(0, { render: false });
  near(leader.group.position.y, .49 + .8, 'lift above actual support');
  near(leader.group.position.y + leader.shadow.position.y, .49 + .035, 'shadow stays below lifted actor');
  battle.actors.find(actor => actor.id === 'shepard').statuses = {};
  world.update(0, { render: false }); near(leader.group.position.y, .49, 'landing restores support');
});

test('native camera enters at its ongoing focus and converges monotonically when stopped at either clamp threshold', () => {
  const world = worldFixture();
  const initial = world.cameraTarget.clone();
  for (let frame = 0; frame < 90; frame++) world.update(1 / 60, { render: false });
  assert.deepEqual(world.cameraTarget, initial, 'no initial .42-to-.48 camera drift');
  for (const sign of [-1, 1]) {
    for (const offset of [-.0001, 0, .0001]) {
      world.player = { x: sign * (18.75 + offset), z: 13 };
      const desired = world._cameraFocus(world.player);
      world.cameraTarget.set(sign * 7, 0, desired.z);
      let previousDistance = Math.abs(desired.x - world.cameraTarget.x);
      for (let frame = 0; frame < 400; frame++) {
        world.update([.01, .025, .05][frame % 3], { render: false });
        const distance = Math.abs(desired.x - world.cameraTarget.x);
        assert.ok(distance <= previousDistance + 1e-12, 'distance never reverses at camera threshold');
        assert.ok(sign * world.cameraTarget.x <= sign * desired.x + 1e-12, 'camera cannot overshoot focus');
        previousDistance = distance;
      }
      assert.ok(previousDistance < 1e-8);
    }
  }
});

test('native character fragments obey opaque geometry depth, with geometry on either side of the billboard', () => {
  const world = worldFixture(), actor = world.actors[0];
  assert.equal(actor.body.material.depthTest, true); assert.equal(actor.body.material.depthWrite, true);
  assert.ok(actor.body.material.alphaTest > 0); assert.equal(actor.shadow.material.depthTest, true);
  actor.group.position.set(0, 0, 0); actor.body.rotation.y = 0;
  const wall = new THREE.Mesh(new THREE.BoxGeometry(5, 5, .5), new THREE.MeshBasicMaterial({ color: 0x445566 }));
  wall.position.set(0, 2.5, 2); world.scene.add(wall); world.scene.updateMatrixWorld(true);
  const ray = new THREE.Raycaster(new THREE.Vector3(0, 1.5, 10), new THREE.Vector3(0, 0, -1));
  assert.equal(ray.intersectObjects([wall, actor.body], false)[0].object, wall, 'opaque wall has nearer fragment depth');
  actor.group.position.z = 4; world.scene.updateMatrixWorld(true);
  assert.equal(ray.intersectObjects([wall, actor.body], false)[0].object, actor.body, 'same actor in front of wall is nearer');
});
