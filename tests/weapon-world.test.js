import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { WorldView } from '../src/world.js';
import { WORLD_ZONES } from '../src/world-data.js';

function makeWorld(weaponType) {
  const world = Object.create(WorldView.prototype);
  Object.assign(world, {
    commanderAppearance: 'male', mode: 'combat', time: 0, keys: new Set(), actors: [], ambientActors: [],
    battleActors: new Map(), characters: new THREE.Group(), particles: new THREE.Group(), scene: new THREE.Scene(),
    camera: new THREE.OrthographicCamera(), cameraTarget: new THREE.Vector3(), cameraOffset: new THREE.Vector3(23, 29, 27),
    spriteCache: new Map(), atlases: { crew: new THREE.Texture({ width: 400, height: 200 }), enemy: new THREE.Texture({ width: 400, height: 200 }) },
    effects: [], animations: [], poiViews: [], player: { x: 0, z: 0 }, trail: [],
    zoneId: 'eden-prime', zone: WORLD_ZONES['eden-prime'], renderer: { render() {} },
  });
  world.setBattle({ actors: [
    Object.freeze({ id: 'shepard', sprite: 'shepard', team: 'party', hp: 100, shield: 30, weaponType, weaponName: 'Arme de test' }),
    Object.freeze({ id: 'geth-1', sprite: 'geth', team: 'enemy', hp: 80, shield: 20 }),
  ] });
  return world;
}

function fire(world, actionId = 'shoot') {
  world.playEvent({ type: 'action', actorId: 'shepard', targetId: 'geth-1', actionId });
  return world.effects.filter(effect => effect.kind === 'weapon-trace');
}

function ends(mesh) {
  const half = mesh.geometry.parameters.height / 2;
  return [-half, half].map(y => new THREE.Vector3(0, y, 0).applyQuaternion(mesh.quaternion).add(mesh.position));
}

test('four weapon families have distinct actual tracer geometry without changing actor state or positions', () => {
  const worlds = Object.fromEntries(['pistol', 'assault', 'shotgun', 'sniper'].map(type => [type, makeWorld(type)]));
  const traces = {};
  for (const [type, world] of Object.entries(worlds)) {
    const source = world.battleActors.get('shepard'), target = world.battleActors.get('geth-1');
    const sourcePosition = source.group.position.clone(), targetPosition = target.group.position.clone();
    const state = { ...source.state }, targetState = { ...target.state };
    traces[type] = fire(world);
    assert.deepEqual(source.group.position, sourcePosition);
    assert.deepEqual(target.group.position, targetPosition);
    assert.deepEqual(source.state, state);
    assert.deepEqual(target.state, targetState);
    for (const trace of traces[type]) {
      assert.ok(trace.object.isMesh);
      assert.equal(trace.object.geometry.type, 'CylinderGeometry');
      assert.equal(trace.object.userData.weaponType, type);
      assert.equal(trace.object.userData.weaponName, 'Arme de test');
      assert.equal(trace.object.material.depthWrite, false);
      assert.ok(trace.max > 0 && trace.max < .4, 'Weapon traces are brief visual cues');
    }
    assert.equal(world.effects.filter(effect => effect.kind === 'impact').length, 1, 'Scatter is visual, with one target impact');
  }
  assert.equal(traces.pistol.length, 1);
  assert.ok(traces['assault'].length > 1);
  assert.ok(traces.shotgun.length > traces['assault'].length);
  assert.equal(traces['sniper'].length, 1);
  assert.ok(traces['sniper'][0].object.geometry.parameters.radiusTop < traces.pistol[0].object.geometry.parameters.radiusTop);
  const assaultDirections = traces['assault'].map(trace => {
    const [start, end] = ends(trace.object);
    return end.sub(start).normalize();
  });
  assert.ok(assaultDirections.every(direction => direction.dot(assaultDirections[0]) > .999999), 'Assault tracers are parallel');
  const shotgunStarts = traces.shotgun.map(trace => ends(trace.object)[0]);
  assert.ok(shotgunStarts.every(position => position.distanceTo(shotgunStarts[0]) < .000001), 'Shotgun rays share their source');
  const shotgunEnds = traces.shotgun.map(trace => ends(trace.object)[1]);
  assert.ok(shotgunEnds[0].distanceTo(shotgunEnds.at(-1)) > 1, 'Shotgun rays visibly diverge around the target');
});

test('burst and signature vary presentation without introducing another action or mutating battle rules', () => {
  for (const type of ['pistol', 'assault', 'shotgun', 'sniper']) {
    const ordinary = fire(makeWorld(type));
    const burst = fire(makeWorld(type), 'burst');
    const signature = fire(makeWorld(type), 'signature');
    assert.ok(burst.length >= ordinary.length);
    if (type !== 'sniper') assert.ok(burst.length > ordinary.length);
    assert.equal(signature.length, ordinary.length);
    assert.ok(signature[0].max > ordinary[0].max);
    assert.ok(signature[0].object.geometry.parameters.radiusTop > ordinary[0].object.geometry.parameters.radiusTop);
  }
});

test('missing or unsupported weapon metadata preserves the previous beam presentation', () => {
  for (const type of [undefined, null, 'unknown', 'constructor', {}]) {
    const world = makeWorld(type);
    assert.deepEqual(fire(world), []);
    const beams = world.effects.filter(effect => effect.kind === 'beam');
    assert.equal(beams.length, 1);
    assert.equal(beams[0].object.geometry.parameters.radiusTop, .045);
    assert.equal(beams[0].max, .18);
    assert.equal(beams[0].object.material.color.getHex(), 0xffcf96);
  }
});

test('weapon metadata does not replace biotic, tech, organic or healing effects', () => {
  for (const [action, radius, color] of [['warp', .13, 0xa9a2ff], ['overload', .045, 0x7ee5ed], ['acid', .045, 0xb6d16d]]) {
    const world = makeWorld('shotgun');
    world.playEvent({ type: 'action', actorId: 'shepard', targetId: 'geth-1', actionId: action });
    assert.equal(world.effects.filter(effect => effect.kind === 'weapon-trace').length, 0);
    const beams = world.effects.filter(effect => effect.kind === 'beam');
    assert.equal(beams.length, 1);
    assert.equal(beams[0].object.geometry.parameters.radiusTop, radius);
    assert.equal(beams[0].object.material.color.getHex(), color);
  }
  const healed = makeWorld('assault');
  healed.playEvent({ type: 'heal', actorId: 'shepard', targetId: 'shepard', actionId: 'medigel' });
  assert.deepEqual(healed.effects.map(effect => effect.kind), ['impact']);
  healed.playEvent(null);
  healed.playEvent({ type: 'action', actorId: 'absent', targetId: 'geth-1', actionId: 'shoot' });
  assert.equal(healed.effects.length, 1);
});

test('tracers expire through the existing update loop and dispose real Three.js resources', () => {
  const world = makeWorld('shotgun');
  fire(world, 'burst');
  const effects = [...world.effects];
  let geometriesDisposed = 0, materialsDisposed = 0;
  for (const { object } of effects) {
    object.geometry.addEventListener('dispose', () => { geometriesDisposed++; });
    object.material.addEventListener('dispose', () => { materialsDisposed++; });
  }
  for (let i = 0; i < 12; i++) world.update(.05);
  assert.equal(world.effects.length, 0);
  assert.equal(world.particles.children.length, 0);
  assert.equal(geometriesDisposed, effects.length);
  assert.equal(materialsDisposed, effects.length);
  fire(world);
  world._clearEffects();
  assert.equal(world.effects.length, 0);
  assert.equal(world.particles.children.length, 0);
});
