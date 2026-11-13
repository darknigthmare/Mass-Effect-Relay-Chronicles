import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { WorldView } from '../src/world.js';

// Exercise real Three.js actor meshes and atlas crops without constructing a WebGL context.
function worldWithoutRenderer() {
  const world = Object.create(WorldView.prototype);
  Object.assign(world, {
    commanderAppearance: 'male', actors: [], battleActors: new Map(),
    characters: new THREE.Group(), spriteCache: new Map(),
    atlases: {
      crew: new THREE.Texture({ width: 400, height: 200 }),
      npc: new THREE.Texture({ width: 400, height: 200 }),
      enemy: new THREE.Texture({ width: 400, height: 200 }),
    },
    player: { x: 1, z: 2 }, mode: 'explore', zone: { arena: { x: 0, z: 0 } },
  });
  return world;
}

function battle() {
  return { actors: [
    { id: 'shepard', sprite: 'shepard', team: 'party', hp: 100, shield: 30 },
    { id: 'geth-1', sprite: 'geth', team: 'enemy', hp: 80, shield: 20 },
  ] };
}

test('commander appearance selects the existing female atlas for future exploration and combat actors', () => {
  const world = worldWithoutRenderer();
  world.setCommanderAppearance('female');
  world.setParty(['shepard', 'kaidan']);
  world.setBattle(battle());
  for (const actor of [world.actors[0], world.battleActors.get('shepard')]) {
    assert.equal(actor.id, 'shepard');
    assert.equal(actor.group.userData.actorId, 'shepard');
    assert.equal(actor.key, 'femshep');
    assert.equal(actor.body.userData.characterKey, 'femshep');
    assert.equal(actor.body.material.map.image, world.atlases.npc.image);
    assert.deepEqual(actor.body.material.map.offset.toArray(), [0, .5]);
    assert.deepEqual(actor.body.material.map.repeat.toArray(), [.25, .5]);
  }
  assert.equal(world.actors[1].key, 'kaidan');
  assert.equal(world.actors[1].body.material.map.image, world.atlases.crew.image);
  assert.equal(world.battleActors.get('geth-1').key, 'geth');
});

test('changing appearance preserves actors, navigation and combat state, and clears masculine walk stretching', () => {
  const world = worldWithoutRenderer();
  world.setParty(['shepard', 'kaidan']);
  const currentBattle = battle();
  world.setBattle(currentBattle);
  const explorer = world.actors[0], fighter = world.battleActors.get('shepard');
  const companion = world.actors[1], companionMap = companion.body.material.map;
  const targetPath = world.targetPath = [{ x: 1, z: -1 }];
  const position = explorer.group.position.clone();
  explorer.body.scale.x = 1.4;
  fighter.poseTime = .25;
  world.setCommanderAppearance('female');
  assert.equal(world.actors[0], explorer);
  assert.equal(world.battleActors.get('shepard'), fighter);
  assert.equal(world.targetPath, targetPath);
  assert.deepEqual(explorer.group.position, position);
  assert.equal(explorer.body.scale.x, 1);
  assert.equal(fighter.poseTime, .25);
  assert.equal(fighter.state, currentBattle.actors[0]);
  assert.equal(companion.body.material.map, companionMap);
  const femaleMap = explorer.body.material.map, cacheSize = world.spriteCache.size;
  world.setCommanderAppearance('female');
  world.setBattle(currentBattle);
  assert.equal(explorer.body.material.map, femaleMap);
  assert.equal(world.spriteCache.size, cacheSize);
  world.setCommanderAppearance('male');
  assert.equal(explorer.key, 'shepard');
  assert.equal(fighter.key, 'shepard');
  assert.equal(explorer.body.material.map.image, world.atlases.crew.image);
});

test('an asynchronously refreshed NPC atlas keeps female exploration and combat sprites', t => {
  const world = worldWithoutRenderer();
  world.setCommanderAppearance('female');
  world.setParty(['shepard']);
  world.setBattle(battle());
  const oldMap = world.actors[0].body.material.map;
  let disposed = false;
  oldMap.addEventListener('dispose', () => { disposed = true; });
  let loaded;
  t.mock.method(THREE.TextureLoader.prototype, 'load', (_url, onLoad) => { loaded = onLoad; });
  world._loadAtlas('npc', 'npc-atlas.png');
  const refreshed = new THREE.Texture({ width: 800, height: 400 });
  loaded(refreshed);
  assert.equal(disposed, true);
  for (const actor of [world.actors[0], world.battleActors.get('shepard')]) {
    assert.equal(actor.key, 'femshep');
    assert.equal(actor.body.material.map.image, refreshed.image);
    assert.notEqual(actor.body.material.map, oldMap);
  }
});

test('male is the default and unsupported appearance values return to it', () => {
  const world = worldWithoutRenderer();
  world.setParty(['shepard']);
  assert.equal(world.actors[0].key, 'shepard');
  world.setCommanderAppearance('female');
  world.setParty(['shepard']);
  assert.equal(world.actors[0].key, 'femshep');
  world.setCommanderAppearance('unsupported');
  assert.equal(world.commanderAppearance, 'male');
  assert.equal(world.actors[0].key, 'shepard');
});
