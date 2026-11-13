import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { WorldView } from '../src/world.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { normalizeCompanionAnimation, canShowCompanionAnimation } from '../src/companion-animation-data.js';
import { newGame, winEncounter, availableCrew, encodeSave, decodeSave } from '../src/state.js';
import { recordVisit } from '../src/story.js';
import { actorFor, enemiesFor } from '../src/game-data.js';
import { createBattle, performAction } from '../src/combat.js';
import { initialCustomization } from '../src/customization.js';

function prologue() {
  const state = newGame({ difficulty: 'story', mode: 'wait' });
  state.flags.briefed = true; state.zone = 'eden-prime'; recordVisit(state, 'eden-prime');
  return state;
}

function jenkinsWorld(state) {
  const raw = JSON.parse(readFileSync(new URL('../public/assets/companion-jenkins-animation.json', import.meta.url)));
  const config = normalizeCompanionAnimation('jenkins', raw); assert.ok(config);
  const world = Object.create(WorldView.prototype), texture = (width = 400, height = 200) => new THREE.Texture({ width, height });
  Object.assign(world, {
    commanderAppearance: 'male', commanderCustomization: initialCustomization(), actors: [], ambientActors: [],
    party: [...state.party], storyContext: null, battleActors: new Map(), characterAnimations: { jenkins: config },
    scene: new THREE.Scene(), characters: new THREE.Group(), particles: new THREE.Group(),
    spriteCache: new Map(), textureCache: new Map(), materialCache: new Map(), customizationTextures: new Map(),
    atlases: { crew: texture(), enemy: texture(), 'combat-jenkins': texture(config.combat.width, config.combat.height) },
    camera: new THREE.OrthographicCamera(-20, 20, 15, -15, .1, 500), cameraTarget: new THREE.Vector3(), cameraOffset: new THREE.Vector3(23, 29, 27),
    zone: WORLD_ZONES['eden-prime'], zoneId: 'eden-prime', player: { x: 0, z: 0 }, mode: 'combat',
    time: 0, keys: new Set(), trail: [], effects: [], animations: [], poiViews: [], combatOccluders: [],
    cleared: new Set(), operationPois: [], assetErrors: [], renderer: { render() {} },
    getNearby() { return null; }, _walkable() { return true; }, _makeMarkers() {},
  });
  world.scene.add(world.characters, world.particles); world.setStoryContext(state); return world;
}

test('Jenkins uses his existing cover action and combat KO drawing without gaining a biotic or Spectre ability', () => {
  const state = prologue(), before = structuredClone(state), world = jenkinsWorld(state);
  // One health and no shield are explicit fixture inputs to exercise a real KO
  // with the existing geth attack. They are not canonical or persistent stats.
  const battle = createBattle({ party: state.party.map(id => ({ ...actorFor(id, state), atb: 100,
    ...(id === 'jenkins' ? { hp: 1, shield: 0 } : {}) })),
    enemies: enemiesFor('eden-prime', 0, state).map(enemy => ({ ...enemy, atb: 100 })), mode: 'wait', seed: 2183 });
  world.setBattle(battle);
  const native = battle.actors.find(actor => actor.id === 'jenkins'), actor = world.battleActors.get('jenkins');
  assert.deepEqual(native.powers, []);
  const cover = performAction(battle, { actorId: 'jenkins', actionId: 'cover' }); assert.equal(cover.ok, true);
  world.setBattle(battle); for (const event of cover.events) world.playEvent(event); world.update(0);
  assert.equal(actor.animationFrame, 'jenkins-combat-power'); assert.equal(native.cover, true);
  assert.deepEqual(native.powers, []);
  assert.equal(performAction(battle, { actorId: 'shepard', actionId: 'unity' }).ok, false,
    'Jenkins cannot be put into a post-Spectre Unity fixture as if that were a reachable campaign state.');
  const geth = battle.actors.find(actor => actor.team === 'enemy');
  const damage = performAction(battle, { actorId: geth.id, actionId: 'shoot', targetId: 'jenkins' }); assert.equal(damage.ok, true);
  world.setBattle(battle); for (const event of damage.events) world.playEvent(event); world.update(0);
  assert.equal(native.hp, 0); assert.equal(actor.animationFrame, 'jenkins-combat-down');
  assert.equal(state.flags.jenkinsLost, undefined); assert.deepEqual(state, before);
});

test('the first Eden victory closes Jenkins presentation, party availability and forged save revival independently of a combat KO', () => {
  const state = prologue(), world = jenkinsWorld(state);
  const battle = createBattle({ party: state.party.map(id => actorFor(id, state)), enemies: enemiesFor('eden-prime', 0, state), seed: 2183 });
  world.setBattle(battle); world.update(0);
  const view = world.battleActors.get('jenkins'), native = battle.actors.find(actor => actor.id === 'jenkins');
  assert.equal(view.animationFrame, 'jenkins-combat-aim');
  assert.equal(canShowCompanionAnimation(view, native, state), true);
  for (const boundary of [{ lost: ['jenkins'] }, { flags: { jenkinsLost: true } }, { completed: ['eden-prime'] }])
    assert.equal(canShowCompanionAnimation(view, native, boundary), false);
  assert.equal(winEncounter(state, 'eden-prime:encounter-1'), true);
  const persisted = structuredClone(state); world.setStoryContext(state); world.setParty(state.party); world.update(0);
  assert.deepEqual(state, persisted, 'Renderer synchronization does not edit campaign state.');
  assert.equal(world._combatAnimationConfig(view, native), null); assert.equal(view.animationFrame, null);
  assert.deepEqual(world.actors.map(actor => actor.id), ['shepard', 'kaidan', 'ashley']);
  assert.ok(!availableCrew(state).includes('jenkins'));
  const restored = decodeSave(encodeSave(state)); assert.ok(restored);
  assert.ok(restored.lost.includes('jenkins')); assert.equal(restored.flags.jenkinsLost, true);
  assert.deepEqual(restored.party, ['shepard', 'kaidan', 'ashley']);
  const forged = structuredClone(restored); forged.party = ['shepard', 'kaidan', 'jenkins'];
  assert.equal(decodeSave(encodeSave(forged)), null, 'A rendered KO pose cannot make a narrative loss revivable.');
  const xp = state.xp; assert.equal(winEncounter(state, 'eden-prime:encounter-1'), false); assert.equal(state.xp, xp);
});

test('Noveria foreground pillars stop crossing the native enemy silhouette envelope in combat and return in exploration', () => {
  const world = Object.create(WorldView.prototype);
  Object.assign(world, { stage: new THREE.Group(), materialCache: new Map(), animations: [], combatOccluders: [], colliders: [],
    zone: WORLD_ZONES.noveria, levelLayout: null, mode: 'explore', keys: new Set(), actors: [], ambientActors: [],
    battleActors: new Map(), poiViews: [], cleared: new Set(), rand: () => .5, _sign() {},
    _texturedMaterial(color) { return this._material(color); } });
  // All authored solid geometry, collider footprints and the real static merge
  // are retained; only the DOM sign and canvas colour map are omitted here.
  world._noveria(); const colliders = structuredClone(world.colliders);
  const foreground = world.combatOccluders.filter(object => object.geometry.parameters.height > 1);
  assert.equal(foreground.length, 12);
  assert.equal(foreground.filter(object => object.geometry.parameters.height === 10).length, 6);
  assert.ok(foreground.every(object => object.position.x > 0 && object.userData.keep));
  world._mergeStatic(); assert.ok(foreground.every(object => object.parent === world.stage));
  const direction = new THREE.Vector3(23, 29, 27).normalize(), right = new THREE.Vector3(27, 0, -23).normalize();
  // The middle native enemy is at(4.7,0). This point lies inside the wide
  // rachni bounding envelope, not an asserted opaque pixel of every pose.
  const witness = new THREE.Vector3(4.7, 1.2, 0).addScaledVector(right, .8);
  const ray = new THREE.Raycaster(witness.clone().addScaledVector(direction, 100), direction.clone().negate());
  const obstructions = () => {
    world.stage.updateMatrixWorld(true); const visible = [];
    world.stage.traverse(object => { if (object.isMesh && object.visible) visible.push(object); });
    return ray.intersectObjects(visible, false).filter(hit => hit.distance < 99.99);
  };
  assert.ok(obstructions().some(hit => foreground.includes(hit.object)), 'The unchanged field pillars actually cross this sightline.');
  for (let cycle = 0; cycle < 2; cycle++) {
    world.setMode('combat'); assert.ok(foreground.every(object => !object.visible)); assert.deepEqual(obstructions(), []);
    world.setMode('explore'); assert.ok(foreground.every(object => object.visible));
  }
  assert.deepEqual(world.colliders, colliders);
});

test('Feros camera-facing pillars preserve collision footprints while exposing the native third-enemy sightline after static merging', () => {
  const world = Object.create(WorldView.prototype);
  Object.assign(world, { stage: new THREE.Group(), materialCache: new Map(), animations: [], combatOccluders: [], colliders: [],
    zone: WORLD_ZONES.feros, levelLayout: null, mode: 'explore', keys: new Set(), actors: [], ambientActors: [],
    battleActors: new Map(), poiViews: [], cleared: new Set(), rand: () => .5, _sign() {},
    _texturedMaterial(color) { return this._material(color); } });
  world._feros(); const colliders = structuredClone(world.colliders);
  const pillars = world.combatOccluders.filter(object => object.geometry.parameters?.height === 11);
  assert.equal(pillars.length, 2); assert.equal(world.combatOccluders.length, 4);
  assert.deepEqual(pillars.map(object => object.position.toArray()), [[10, 5.5, -10], [10, 5.5, 9]]);
  assert.ok(pillars.every(object => object.userData.keep && object.geometry.parameters.width === 1.3 && object.geometry.parameters.depth === 2.8));
  for (const x of [-10, 10]) for (const z of [-10, 9]) assert.ok(colliders.some(collider => collider.kind === 'rect'
    && collider.minX === x - .65 && collider.maxX === x + .65 && collider.minZ === z - 1.4 && collider.maxZ === z + 1.4));
  world._mergeStatic(); assert.ok(pillars.every(object => object.parent === world.stage));
  // The generic asari is the third native enemy at(4,2.9). This ray samples
  // its body envelope, without asserting every visible pixel of every pose.
  const direction = new THREE.Vector3(23, 29, 27).normalize(), point = new THREE.Vector3(4, 1.2, 2.9);
  const ray = new THREE.Raycaster(point.clone().addScaledVector(direction, 100), direction.clone().negate());
  const obstructions = () => {
    world.stage.updateMatrixWorld(true); const visible = [];
    world.stage.traverse(object => { if (object.isMesh && object.visible) visible.push(object); });
    return ray.intersectObjects(visible, false).filter(hit => hit.distance < 99.99);
  };
  assert.ok(obstructions().some(hit => pillars.includes(hit.object)), 'The original field pillar crosses this native actor sightline.');
  for (let cycle = 0; cycle < 2; cycle++) {
    world.setMode('combat'); assert.ok(pillars.every(object => !object.visible)); assert.deepEqual(obstructions(), []);
    world.setMode('explore'); assert.ok(pillars.every(object => object.visible));
  }
  assert.deepEqual(world.colliders, colliders);
});
