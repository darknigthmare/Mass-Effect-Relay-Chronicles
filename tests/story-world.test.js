import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { WorldView } from '../src/world.js';
import { WORLD_ZONES } from '../src/world-data.js';

const companions = ['kaidan', 'ashley', 'garrus', 'tali', 'wrex', 'liara'];

// Keep actual actor geometry, atlas textures, availability and navigation.
// Canvas labels, textured surfaces and the WebGL context are browser concerns.
function makeWorld(context) {
  const world = Object.create(WorldView.prototype);
  Object.assign(world, {
    storyContext: null, commanderAppearance: 'male', actors: [], ambientActors: [], party: ['shepard'],
    battleActors: new Map(), characters: new THREE.Group(), stage: new THREE.Group(),
    materialCache: new Map(), spriteCache: new Map(), animations: [], colliders: [],
    atlases: {
      crew: new THREE.Texture({ width: 400, height: 200 }),
      npc: new THREE.Texture({ width: 400, height: 200 }),
    },
    cleared: new Set(['eden-prime:boss']), player: { ...WORLD_ZONES.normandy.spawn }, mode: 'explore',
  });
  world.setStoryContext(context);
  world.zone = WORLD_ZONES.normandy; world.zoneId = 'normandy';
  world._makeMarkers = () => {};
  return world;
}

const conversationIds = world => world.getConversationPOIs().map(poi => poi.conversationId);

test('conversation points do not change the 63 authored mission and service routes', () => {
  const world = makeWorld();
  assert.equal(Object.values(WORLD_ZONES).reduce((sum, zone) => sum + zone.pois.length, 0), 63);
  assert.equal(world.getPOIs().length, 7);
  assert.deepEqual(world.getConversationPOIs(), []);
  assert.equal(world.getInteractivePOIs().length, 7);
  world.setStoryContext({ recruited: ['kaidan', 'jenkins'], lost: [], completed: [], flags: {}, visitedZones: ['normandy'] });
  assert.deepEqual(conversationIds(world), ['joker', 'chakwas', 'nihlus', 'kaidan']);
  assert.equal(world.getPOIs().length, 7);
  assert.equal(world.getInteractivePOIs().length, 11);
  assert.ok(world.getConversationPOIs().every(poi => poi.id === `normandy:talk-${poi.conversationId}`));
});

test('Nihlus never returns after visiting Eden Prime, and lost companions have no conversation', () => {
  const context = { recruited: [...companions, 'jenkins'], lost: ['ashley', 'jenkins'], completed: [], flags: {}, visitedZones: [] };
  const world = makeWorld(context);
  assert.ok(conversationIds(world).includes('nihlus'));
  assert.ok(!conversationIds(world).includes('ashley'));
  assert.ok(!conversationIds(world).includes('jenkins'));
  world.setStoryContext({ ...context, visitedZones: ['normandy', 'eden-prime'] });
  assert.ok(!conversationIds(world).includes('nihlus'));
  world.setStoryContext({ ...context, completed: ['eden-prime'] });
  assert.ok(!conversationIds(world).includes('nihlus'), 'Completed legacy saves also hide Nihlus');
  world.setStoryContext({ ...context, flags: { jenkinsLost: true } });
  assert.ok(!conversationIds(world).includes('nihlus'), 'The first encounter is another safe prologue boundary');
});

test('active and reserve companions each have exactly one body aboard, including after squad changes', () => {
  const world = makeWorld({ recruited: companions, lost: [], completed: ['eden-prime'], visitedZones: ['eden-prime'] });
  world.setParty(['shepard', 'kaidan', 'wrex']);
  const assertSingleBodies = () => {
    const actors = [...world.actors, ...world.ambientActors];
    for (const key of [...companions, 'joker', 'chakwas']) assert.equal(actors.filter(actor => actor.key === key).length, 1, key);
    assert.ok(!actors.some(actor => actor.key === 'nihlus'));
  };
  assertSingleBodies();
  world.setParty(['shepard', 'garrus', 'liara']);
  assertSingleBodies();
  const garrus = world.actors.find(actor => actor.id === 'garrus');
  const station = garrus.group.position.clone();
  world.setPosition({ x: 0, z: 4 });
  assert.deepEqual(garrus.group.position, station, 'Stationed squad members do not teleport with Shepard');
  world.zone = WORLD_ZONES['eden-prime']; world.zoneId = 'eden-prime';
  world.setParty(['shepard', 'garrus', 'liara']);
  assert.ok(world.actors.every(actor => !actor.stationPosition), 'The squad follows Shepard again on expeditions');
});

test('context updates remove dead actors and pending interactions without rebuilding an unchanged context', () => {
  const context = { recruited: [...companions, 'jenkins'], lost: [], completed: [], flags: {}, visitedZones: [] };
  const world = makeWorld(context);
  world.setParty(['shepard', 'kaidan', 'jenkins']);
  const originalShepard = world.actors[0];
  world.setStoryContext(context);
  assert.equal(world.actors[0], originalShepard, 'An unchanged context does not allocate new actors');
  const kaidan = world.getConversationPOIs().find(poi => poi.conversationId === 'kaidan');
  world.pendingPOI = kaidan; world.targetPath = [{ x: kaidan.x, z: kaidan.z }];
  world.setStoryContext({ ...context, lost: ['kaidan'], flags: { jenkinsLost: true }, visitedZones: ['eden-prime'] });
  assert.equal(world.pendingPOI, null);
  assert.equal(world.targetPath, null);
  assert.ok(![...world.actors, ...world.ambientActors].some(actor => ['kaidan', 'jenkins', 'nihlus'].includes(actor.key)));
  assert.deepEqual(world.party, ['shepard']);
  context.recruited.push('unrelated');
  assert.ok(!world.storyContext.recruited.includes('unrelated'), 'The renderer keeps a snapshot, not mutable state arrays');
});

test('all nine conversations are reachable around actual Normandy geometry and dispatch interaction callbacks', () => {
  const world = makeWorld({ recruited: companions, lost: [], completed: [], flags: {}, visitedZones: [] });
  world._texturedMaterial = color => world._material(color);
  world._sign = () => {};
  world._normandy();
  world.setParty(['shepard', 'kaidan', 'wrex']);
  const received = [];
  world.onInteract = poi => received.push(poi);
  assert.equal(world.getConversationPOIs().length, 9);
  for (const poi of world.getConversationPOIs()) {
    world.setPosition(WORLD_ZONES.normandy.spawn);
    assert.equal(world._walkable(poi.x, poi.z), true, `${poi.id}: interaction is outside scenery`);
    assert.equal(world._walkable(poi.actorPosition.x, poi.actorPosition.z), true, `${poi.id}: actor is outside scenery`);
    const path = world._pathTo(poi);
    assert.ok(path?.length, `${poi.id}: a route exists from the spawn`);
    assert.ok(path.every(point => world._walkable(point.x, point.z)), `${poi.id}: the route stays navigable`);
    world.setPosition(poi);
    assert.equal(world.interact()?.id, poi.id);
    assert.equal(received.at(-1).conversationId, poi.conversationId);
  }
});

test('recruiting on the Citadel removes only that recruit body, marker and pending interaction', () => {
  const context = { recruited: ['kaidan', 'jenkins'], lost: ['jenkins'], completed: ['eden-prime'], visitedZones: ['eden-prime'] };
  const world = makeWorld(context);
  world.zone = WORLD_ZONES.citadel; world.zoneId = 'citadel';
  world.setParty(['shepard', 'kaidan']);
  world._makeAmbientCharacters();
  for (const key of ['garrus', 'tali', 'wrex']) assert.equal(world.ambientActors.filter(actor => actor.key === key).length, 1);
  const target = world.getInteractivePOIs().find(poi => poi.id === 'citadel:encounter-1');
  world.pendingPOI = target; world.targetPath = [{ x: target.x, z: target.z }];
  let markerRefreshes = 0;
  world._makeMarkers = () => { markerRefreshes++; };
  world.setStoryContext({ ...context, recruited: [...context.recruited, 'garrus'] });
  assert.equal(markerRefreshes, 1, 'Recruitment refreshes visible markers without leaving the zone');
  assert.equal(world.pendingPOI, null);
  assert.equal(world.targetPath, null);
  assert.ok(!world.ambientActors.some(actor => actor.key === 'garrus'));
  assert.ok(!world.getInteractivePOIs().some(poi => poi.id === target.id));
  assert.equal(world.getPOIs().length, 7, 'Authored mission routes remain available to geometry QA');
  for (const [id, key] of [['citadel:encounter-2', 'tali'], ['citadel:boss', 'wrex']]) {
    assert.ok(world.getInteractivePOIs().some(poi => poi.id === id), `${key}: unrecruited dialogue stays available`);
    assert.equal(world.ambientActors.filter(actor => actor.key === key).length, 1);
  }
  world.setPosition(target);
  assert.notEqual(world.getNearby()?.id, target.id, 'The old marker cannot be selected using proximity interaction');
});

test('Citadel squad changes and Normandy revisits never duplicate already recruited companions', () => {
  const world = makeWorld({ recruited: ['kaidan', 'garrus', 'tali', 'wrex'], lost: [], completed: ['eden-prime', 'citadel'], visitedZones: ['eden-prime', 'citadel'] });
  // Exercise the actual public zone transition and actor lifecycle. These drawing
  // hooks do not affect recruitment availability, party bodies or ambient bodies.
  Object.assign(world, {
    effects: [], camera: new THREE.OrthographicCamera(), cameraTarget: new THREE.Vector3(),
    cameraOffset: new THREE.Vector3(23, 29, 27), particles: new THREE.Group(),
    _lights() {}, _citadel() {}, _normandy() {}, _dressScene() {}, _mergeStatic() {}, resize() {},
  });
  world.setZone('citadel', { party: ['shepard', 'garrus', 'wrex'] });
  const count = key => [...world.actors, ...world.ambientActors].filter(actor => actor.key === key).length;
  assert.equal(count('garrus'), 1);
  assert.equal(count('wrex'), 1);
  assert.equal(count('tali'), 0, 'A reserve recruit is back aboard rather than waiting at the old recruitment site');
  assert.ok(!world.getInteractivePOIs().some(poi => ['citadel:encounter-1', 'citadel:encounter-2', 'citadel:boss'].includes(poi.id)));
  world.setParty(['shepard', 'tali', 'kaidan']);
  assert.equal(count('tali'), 1);
  assert.equal(count('garrus'), 0);
  assert.equal(count('wrex'), 0);
  world.setZone('normandy', { party: ['shepard', 'tali', 'kaidan'] });
  for (const key of ['kaidan', 'garrus', 'tali', 'wrex']) assert.equal(count(key), 1, `${key}: active or stationed once aboard`);
  world.setZone('citadel', { party: ['shepard', 'garrus', 'wrex'] });
  assert.equal(count('garrus'), 1);
  assert.equal(count('wrex'), 1);
  assert.equal(count('tali'), 0);
  assert.equal(world.getPOIs().length, 7);
});
