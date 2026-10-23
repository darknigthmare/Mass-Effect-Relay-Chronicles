import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { WorldView } from '../src/world.js';
import { WORLD_ZONES } from '../src/world-data.js';

const contacts = [
  { id: 'samesh-bhatia', label: 'Samesh Bhatia', speaker: 'Samesh Bhatia', assignmentId: 'homecoming', x: -5, z: 11.5 },
  { id: 'bosker', label: 'Bosker', speaker: 'Bosker', assignmentId: 'homecoming', x: 5, z: -3 },
  { id: 'petrovsky-family', label: 'Famille Petrovsky', speaker: 'Michael et Rebekah Petrovsky', assignmentId: 'family', x: -5, z: -8.5 },
  { id: 'conrad-verner', label: 'Conrad Verner', speaker: 'Conrad Verner', assignmentId: 'fan', x: 5, z: 12.5 },
];

function context(assignmentContacts = contacts) {
  return {
    recruited: ['kaidan', 'garrus', 'tali', 'wrex'], lost: [], completed: ['eden-prime', 'citadel'],
    flags: { spectre: true }, visitedZones: ['eden-prime', 'citadel'], assignmentContacts,
  };
}

function makeWorld(story = context()) {
  const world = Object.create(WorldView.prototype);
  Object.assign(world, {
    storyContext: null, commanderAppearance: 'male', actors: [], ambientActors: [], party: ['shepard'],
    battleActors: new Map(), characters: new THREE.Group(), stage: new THREE.Group(),
    materialCache: new Map(), spriteCache: new Map(), animations: [], colliders: [], rand: () => .5,
    atlases: { crew: new THREE.Texture({ width: 400, height: 200 }), npc: new THREE.Texture({ width: 400, height: 200 }) },
    cleared: new Set(), player: { ...WORLD_ZONES.citadel.spawn }, mode: 'explore',
  });
  world.setStoryContext(story);
  world.zone = WORLD_ZONES.citadel; world.zoneId = 'citadel';
  world._makeMarkers = () => {};
  return world;
}

test('assignment contacts have stable separate interaction ids without changing authored routes or fabricating bodies', () => {
  const world = makeWorld();
  world.setParty(['shepard', 'kaidan']);
  world._makeAmbientCharacters();
  assert.equal(world.getPOIs().length, 7);
  assert.equal(Object.values(WORLD_ZONES).reduce((sum, zone) => sum + zone.pois.length, 0), 63);
  assert.equal(world.getAssignmentPOIs().length, 4);
  assert.equal(world.getInteractivePOIs().filter(poi => poi.assignmentContactId).length, 4);
  for (const contact of contacts) {
    const poi = world.getAssignmentPOIs().find(entry => entry.assignmentContactId === contact.id);
    assert.equal(poi.id, `citadel:assignment-${contact.id}`);
    assert.equal(poi.assignmentId, contact.assignmentId);
    assert.equal(poi.speaker, contact.speaker);
    assert.equal(poi.type, 'dialogue');
  }
  assert.deepEqual(world.ambientActors.map(actor => actor.id).sort(), ['npc:anderson', 'npc:udina']);
  assert.equal(world.characters.children.length, 4, 'Only Shepard, Kaidan and existing NPC sprites have bodies');
});

test('four assignment contacts are navigable and dispatch interactions around the actual Citadel geometry', () => {
  const world = makeWorld();
  // Keep real architecture and all collisions; canvas surface art and signs do not affect navigation.
  world._texturedMaterial = color => world._material(color);
  world._sign = () => {};
  world._citadel();
  const received = [];
  world.onInteract = poi => received.push(poi);
  for (const poi of world.getAssignmentPOIs()) {
    world.setPosition(WORLD_ZONES.citadel.spawn);
    assert.equal(world._walkable(poi.x, poi.z), true, `${poi.id}: contact is outside scenery`);
    const path = world._pathTo(poi);
    assert.ok(path?.length, `${poi.id}: route from the spawn exists`);
    assert.ok(path.every(point => world._walkable(point.x, point.z)), `${poi.id}: every waypoint is navigable`);
    world.setPosition(poi);
    assert.equal(world.interact()?.id, poi.id);
    assert.equal(received.at(-1).assignmentContactId, poi.assignmentContactId);
  }
});

test('a choice refreshes contact markers and cancels removed targets without duplicating contacts', () => {
  const world = makeWorld();
  let refreshes = 0;
  world._makeMarkers = () => { refreshes++; };
  const samesh = world.getAssignmentPOIs().find(poi => poi.assignmentContactId === 'samesh-bhatia');
  world.pendingPOI = samesh; world.targetPath = [{ x: samesh.x, z: samesh.z }];
  world.setStoryContext(context(contacts.filter(contact => contact.id !== 'samesh-bhatia')));
  assert.equal(refreshes, 1);
  assert.equal(world.pendingPOI, null);
  assert.equal(world.targetPath, null);
  assert.ok(!world.getInteractivePOIs().some(poi => poi.id === samesh.id));
  world.setStoryContext(context(contacts.filter(contact => contact.id !== 'samesh-bhatia')));
  assert.equal(refreshes, 1, 'Unchanged contacts do not rebuild markers each time the context is synchronized');
  world.setStoryContext(context());
  assert.equal(refreshes, 2);
  assert.equal(world.getAssignmentPOIs().length, 4, 'Reloading an earlier state restores its contact list exactly once');
});

test('contacts are copied, deduplicated and confined to the Citadel while legacy worlds stay unchanged', () => {
  const source = contacts.map(contact => ({ ...contact }));
  const world = makeWorld(context([
    ...source, source[0], { ...source[0], id: 'invalid-point', x: Infinity },
    { ...source[0], id: 'outside-point', x: 1000 }, { ...source[0], id: 'bad:id' },
  ]));
  source[0].label = 'Changed outside the renderer';
  assert.equal(world.getAssignmentPOIs().length, 4);
  assert.equal(world.getAssignmentPOIs()[0].label, 'Samesh Bhatia');
  world.zone = WORLD_ZONES.normandy; world.zoneId = 'normandy';
  assert.deepEqual(world.getAssignmentPOIs(), []);
  assert.ok(!world.getInteractivePOIs().some(poi => poi.assignmentContactId));
  world.zone = WORLD_ZONES.citadel; world.zoneId = 'citadel';
  assert.equal(world.getAssignmentPOIs().length, 4);
  world.setStoryContext(null);
  assert.deepEqual(world.getAssignmentPOIs(), []);
  assert.equal(world.getInteractivePOIs().length, 7, 'No story context preserves the original standalone world QA');
});
