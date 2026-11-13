import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { WorldView } from '../src/world.js';
import { initialCustomization } from '../src/customization.js';
import { newGame } from '../src/state.js';
import { actorFor, ENEMIES } from '../src/game-data.js';
import { createBattle } from '../src/combat.js';

// Deliberately independent of generated artwork: exercise the renderer contract
// with real Three.js textures/meshes and bounded, asymmetric fixture regions.
const configuration = (prefix = 'shepard') => ({
  schemaVersion: 1, appearance: prefix === 'shepard' ? 'male' : 'female',
  combat: {
    file: `${prefix}-fixture.png`, width: 100, height: 100,
    frames: {
      aim: { id: `${prefix}-combat-aim`, pose: 'aim', rect: [0, 0, 40, 50], pivot: [16, 48], heightScale: 1, headRegion: [.2, 0, .4, .25] },
      power: { id: `${prefix}-combat-power`, pose: 'power', rect: [40, 0, 60, 50], pivot: [20, 48], heightScale: 1, headRegion: [.15, 0, .3, .25] },
      hit: { id: `${prefix}-combat-hit`, pose: 'hit', rect: [0, 50, 40, 40], pivot: [18, 38], heightScale: .8, headRegion: [.2, 0, .4, .3] },
      down: { id: `${prefix}-combat-down`, pose: 'down', rect: [40, 80, 60, 20], pivot: [30, 18], heightScale: .25, headRegion: [0, .2, .2, .7], headAxis: 'x' },
    },
  },
});
const texture = (width = 100, height = 100) => new THREE.Texture({ width, height });
const close = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-9, `${label}: ${actual} != ${expected}`);

function worldFixture({ loaded = true } = {}) {
  const world = Object.create(WorldView.prototype);
  Object.assign(world, {
    commanderAppearance: 'male', commanderCustomization: initialCustomization(),
    actors: [], ambientActors: [], battleActors: new Map(), characterAnimations: { shepard: configuration() },
    scene: new THREE.Scene(), characters: new THREE.Group(), particles: new THREE.Group(),
    spriteCache: new Map(), customizationTextures: new Map(), assetErrors: [],
    atlases: { crew: texture(400, 200), npc: texture(400, 200), enemy: texture(400, 200), walk: texture(1269, 1240) },
    walkConfig: { directions: ['front', 'back', 'right', 'left'], fps: 8, columns: [45, 345, 645, 945], rowBounds: [[0, 315], [315, 621], [621, 920], [920, 1240]], cellWidth: 300 },
    camera: new THREE.OrthographicCamera(-20, 20, 15, -15, .1, 500), cameraOffset: new THREE.Vector3(23, 29, 27), cameraTarget: new THREE.Vector3(),
    player: { x: 0, z: 0 }, zone: { arena: { x: 0, z: 0 } }, mode: 'combat', time: 0, keys: new Set(), trail: [],
    effects: [], animations: [], poiViews: [], combatOccluders: [], cleared: new Set(), operationPois: [],
    renderer: { render() {} }, getNearby() { return null; }, _walkable() { return true; },
  });
  if (loaded) world.atlases['combat-shepard'] = texture();
  return world;
}

function battleFixture(world) {
  const state = newGame({ classId: 'soldier', appearance: 'male' });
  const battle = createBattle({
    party: [actorFor('shepard', state), actorFor('kaidan', state)],
    enemies: [{ ...ENEMIES.geth, id: 'geth-fixture' }], difficulty: 'normal', mode: 'wait', seed: 2183, medigel: state.medigel,
  });
  world.setBattle(battle);
  return { state, battle, commander: battle.actors.find(actor => actor.id === 'shepard'), actor: world.battleActors.get('shepard') };
}

function checkFrame(world, actor, frame, cover = false) {
  const map = actor.body.material.map;
  assert.equal(actor.animationFrame, frame.id);
  assert.equal(map.image, world.atlases[`combat-${actor.key}`].image);
  assert.equal(map.userData.relayAnimationFrame, frame);
  const [x, y, width, height] = frame.rect;
  close(map.repeat.x, width / 100, 'UV width'); close(map.repeat.y, height / 100, 'UV height');
  close(map.offset.x, x / 100, 'UV x'); close(map.offset.y, 1 - (y + height) / 100, 'UV y');
  const displayHeight = actor.height * frame.heightScale * (cover ? .88 : 1);
  const displayWidth = displayHeight * width / height;
  close(actor.body.geometry.parameters.height * actor.body.scale.y, displayHeight, 'display height');
  close(actor.body.geometry.parameters.width * actor.body.scale.x, displayWidth, 'display width');
  close(actor.body.position.y + (.5 - frame.pivot[1] / height) * displayHeight, .05, 'ground pivot');
  const offset = (.5 - frame.pivot[0] / width) * displayWidth, facing = Math.atan2(world.cameraOffset.x, world.cameraOffset.z);
  close(actor.body.position.x, Math.cos(facing) * offset, 'horizontal pivot x');
  close(actor.body.position.z, -Math.sin(facing) * offset, 'horizontal pivot z');
  assert.equal(actor.body.rotation.z, 0, 'a horizontal drawing is never rotated a second time');
}

function showPose(world, fixture, pose) {
  fixture.commander.hp = pose === 'down' ? 0 : fixture.commander.maxHp;
  fixture.commander.cover = false;
  world.setBattle(fixture.battle);
  if (pose === 'hit') world.playEvent({ type: 'damage', targetId: 'shepard' });
  else if (pose !== 'down') world.playEvent({ type: 'action', actorId: 'shepard', targetId: 'geth-fixture', actionId: pose === 'power' ? 'warp' : 'shoot' });
  world.update(0);
}

test('combat-only registration loads only its combat atlas and keeps masculine exploration metadata', t => {
  const world = worldFixture({ loaded: false }), walk = world.atlases.walk, walkConfig = structuredClone(world.walkConfig), loads = [];
  t.mock.method(world, '_loadAtlas', (name, url) => loads.push({ name, url }));
  world.characterAnimations = {};
  const config = configuration();
  world.registerCharacterAnimation('shepard', config);
  assert.equal(world.characterAnimations.shepard, config);
  assert.deepEqual(loads, [{ name: 'combat-shepard', url: './assets/shepard-fixture.png' }]);
  assert.equal(world.atlases.walk, walk); assert.deepEqual(world.walkConfig, walkConfig);
  assert.equal(world._animateCharacter({ key: 'shepard' }, true, 1, 0), false);
  // A stale optional motion texture must not make combat-only metadata iterable.
  world.atlases['motion-shepard'] = texture();
  assert.equal(world._animateCharacter({ key: 'shepard' }, false, 0, 0), false);
  world.registerCharacterAnimation('invalid', { combat: { file: 'empty.png', frames: {} } });
  assert.equal(world.characterAnimations.invalid, undefined); assert.equal(loads.length, 1);
});

test('a delayed combat atlas preserves a visible fallback, then adopts the correct KO pose', t => {
  const world = worldFixture({ loaded: false }), fixture = battleFixture(world);
  let finishLoad;
  t.mock.method(THREE.TextureLoader.prototype, 'load', (_url, ready) => { finishLoad = ready; });
  world._loadAtlas('combat-shepard', './assets/shepard-fixture.png');
  world.update(0);
  assert.equal(fixture.actor.body.material.map.image, world.atlases.crew.image);
  assert.deepEqual(fixture.actor.body.scale.toArray(), [1, 1, 1]); assert.equal(fixture.actor.animationFrame, null);
  fixture.commander.hp = 0; world.setBattle(fixture.battle); world.update(0);
  assert.equal(fixture.actor.body.rotation.z, -.9); assert.equal(fixture.actor.body.material.map.image, world.atlases.crew.image);
  const companionMap = world.battleActors.get('kaidan').body.material.map;
  finishLoad(texture()); world.update(0);
  checkFrame(world, fixture.actor, world.characterAnimations.shepard.combat.frames.down);
  assert.equal(world.battleActors.get('kaidan').body.material.map, companionMap);
  assert.deepEqual(world.assetErrors, []);
});

test('the four masculine key poses use their actual crop, pivot and relative size without changing combat data', () => {
  const world = worldFixture(), fixture = battleFixture(world), originalState = structuredClone(fixture.state);
  for (const pose of ['aim', 'power', 'hit', 'down']) {
    fixture.commander.hp = pose === 'down' ? 0 : fixture.commander.maxHp; fixture.commander.cover = false;
    const expectedBattle = { ...structuredClone({ ...fixture.battle, _rng: null }), _rng: fixture.battle._rng };
    showPose(world, fixture, pose);
    checkFrame(world, fixture.actor, world.characterAnimations.shepard.combat.frames[pose]);
    assert.deepEqual(fixture.battle, expectedBattle, `${pose} cannot grant a power, modify statistics or advance combat`);
    assert.deepEqual(fixture.state, originalState);
  }
  fixture.commander.hp = fixture.commander.maxHp; fixture.commander.cover = true;
  world.setBattle(fixture.battle); world.update(0);
  checkFrame(world, fixture.actor, world.characterAnimations.shepard.combat.frames.aim, true);
});

test('impact outranks an overlapping action, KO outranks every pose and revival returns to aim', () => {
  const world = worldFixture(), fixture = battleFixture(world);
  world.playEvent({ type: 'action', actorId: 'shepard', actionId: 'warp' }); world.update(0);
  assert.equal(fixture.actor.animationFrame, 'shepard-combat-power');
  world.playEvent({ type: 'damage', targetId: 'shepard' });
  world.playEvent({ type: 'action', actorId: 'shepard', actionId: 'shoot' }); world.update(0);
  assert.equal(fixture.actor.animationFrame, 'shepard-combat-hit');
  for (let i = 0; i < 9; i++) world.update(.05);
  assert.equal(fixture.actor.animationFrame, 'shepard-combat-aim');
  world.playEvent({ type: 'action', actorId: 'shepard', actionId: 'warp' });
  for (let i = 0; i < 15; i++) world.update(.05);
  assert.equal(fixture.actor.animationFrame, 'shepard-combat-aim');
  world.playEvent({ type: 'action', actorId: 'shepard', actionId: 'warp' });
  fixture.commander.hp = 0; world.setBattle(fixture.battle);
  world.playEvent({ type: 'damage', targetId: 'shepard' });
  world.playEvent({ type: 'action', actorId: 'shepard', actionId: 'shoot' }); world.update(0);
  assert.equal(fixture.actor.animationFrame, 'shepard-combat-down'); assert.equal(fixture.actor.combatPoseTime, 0);
  fixture.commander.hp = fixture.commander.maxHp; world.setBattle(fixture.battle); world.update(0);
  assert.equal(fixture.actor.animationFrame, 'shepard-combat-aim'); assert.equal(fixture.actor.body.material.opacity, 1);
});

test('an absent or invalid key pose falls back without retaining the preceding frame geometry or head region', () => {
  const world = worldFixture(), fixture = battleFixture(world);
  showPose(world, fixture, 'power');
  delete world.characterAnimations.shepard.combat.frames.down;
  fixture.commander.hp = 0; world.setBattle(fixture.battle); world.update(0);
  assert.equal(fixture.actor.body.material.map.image, world.atlases.crew.image);
  assert.deepEqual(fixture.actor.body.scale.toArray(), [1, 1, 1]);
  assert.equal(fixture.actor.body.position.x, 0); assert.equal(fixture.actor.body.position.z, 0);
  assert.equal(fixture.actor.body.rotation.z, -.9); assert.equal(fixture.actor.animationFrame, null);
  assert.equal(fixture.actor.body.material.map.userData.relayAnimationFrame, undefined);
  fixture.commander.hp = fixture.commander.maxHp; world.setBattle(fixture.battle);
  world.characterAnimations.shepard.combat.frames.aim.rect = [90, 90, 40, 50]; world.update(0);
  assert.equal(fixture.actor.body.material.map.image, world.atlases.crew.image);
  assert.equal(fixture.actor.body.rotation.z, 0); assert.equal(fixture.actor.animationFrame, null);
});

test('changing commander appearance changes only its combat family and preserves companion and enemy sprites', () => {
  const world = worldFixture(), fixture = battleFixture(world);
  world.characterAnimations.femshep = configuration('femshep'); world.atlases['combat-femshep'] = texture();
  const companion = world.battleActors.get('kaidan'), enemy = world.battleActors.get('geth-fixture');
  const companionMap = companion.body.material.map, enemyMap = enemy.body.material.map;
  showPose(world, fixture, 'power');
  world.setCommanderAppearance('female'); world.update(0);
  checkFrame(world, fixture.actor, world.characterAnimations.femshep.combat.frames.power);
  world.setCommanderAppearance('male'); world.update(0);
  checkFrame(world, fixture.actor, world.characterAnimations.shepard.combat.frames.power);
  assert.equal(companion.body.material.map, companionMap); assert.equal(enemy.body.material.map, enemyMap);
  assert.equal(companion.key, 'kaidan'); assert.equal(enemy.key, 'geth');
});

test('returning from combat keeps all four existing masculine walk directions and the original field idle', () => {
  const world = worldFixture(), fixture = battleFixture(world);
  world.setParty(['shepard', 'kaidan']);
  const explorer = world.actors[0], legacyIdle = world._spriteTexture('shepard', false), walkConfig = structuredClone(world.walkConfig);
  showPose(world, fixture, 'down');
  world.setBattle(null); world.setMode('explore'); world.update(0);
  assert.equal(world.battleActors.size, 0); assert.equal(explorer.body.material.map, legacyIdle);
  const directions = [['KeyW', 'back'], ['KeyS', 'front'], ['KeyD', 'right'], ['KeyA', 'left']];
  for (const [key, direction] of directions) {
    world.keys.add(key); world.update(.05); world.keys.delete(key);
    assert.equal(explorer.walkDirection, direction); assert.equal(explorer.body.material.map.image, world.atlases.walk.image);
    world.update(0); assert.equal(explorer.body.material.map, legacyIdle, `${direction} retains the existing field idle`);
    assert.equal(explorer.body.material.map.userData.relayAnimationFrame, undefined);
  }
  assert.deepEqual(world.walkConfig, walkConfig);
});

function fakeCanvas() {
  const canvas = { width: 0, height: 0, pixels: null };
  const context = {
    drawImage(source) { canvas.pixels = new Uint8ClampedArray(source.pixels || canvas.width * canvas.height * 4); },
    getImageData() { return { width: canvas.width, height: canvas.height, data: new Uint8ClampedArray(canvas.pixels || canvas.width * canvas.height * 4) }; },
    putImageData(image) { canvas.pixels = new Uint8ClampedArray(image.data); },
  };
  canvas.getContext = () => context;
  return canvas;
}

test('the actual active frame passes its horizontal head region to recoloration and separates cached variants', t => {
  const priorDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { createElement(tag) { assert.equal(tag, 'canvas'); return fakeCanvas(); } } });
  t.after(() => { if (priorDocument) Object.defineProperty(globalThis, 'document', priorDocument); else delete globalThis.document; });
  const world = worldFixture(), fixture = battleFixture(world), pixels = new Uint8ClampedArray(400);
  const inside = (6 * 10 + 2) * 4, outside = (0 * 10 + 6) * 4;
  pixels.set([190, 140, 108, 255], inside); pixels.set([190, 140, 108, 255], outside);
  world.atlases['combat-shepard'] = new THREE.Texture({ width: 10, height: 10, pixels });
  const frame = { id: 'horizontal-head-fixture', pose: 'down', rect: [0, 0, 10, 10], pivot: [5, 9], heightScale: .25, headRegion: [.1, .5, .3, .3], headAxis: 'x' };
  world.commanderCustomization.face.skinTone = 'deep';
  assert.equal(world._applyAnimationFrame(fixture.actor, 'combat-shepard', frame), true);
  world._applyCommanderCustomization(fixture.actor);
  const first = fixture.actor.body.material.map, result = first.image.pixels;
  assert.notDeepEqual(result.slice(inside, inside + 3), pixels.slice(inside, inside + 3), 'head at the middle-left receives the selected skin tone');
  assert.deepEqual(result.slice(outside, outside + 4), pixels.slice(outside, outside + 4), 'a skin-coloured pixel outside the frame head region is not a face');
  for (let i = 3; i < pixels.length; i += 4) assert.equal(result[i], pixels[i], 'alpha is preserved');
  world._applyCommanderCustomization(fixture.actor); assert.equal(fixture.actor.body.material.map, first);
  const otherAxis = { ...frame, headAxis: 'y' };
  world._applyAnimationFrame(fixture.actor, 'combat-shepard', otherAxis); world._applyCommanderCustomization(fixture.actor);
  assert.notEqual(fixture.actor.body.material.map, first, 'the head axis participates in the recoloration cache');
  assert.equal(fixture.actor.body.material.map.userData.relayCustomizationSource.userData.relayAnimationFrame.headAxis, 'y');
  const alternate = { ...frame, headRegion: [.5, 0, .3, .2] };
  world._applyAnimationFrame(fixture.actor, 'combat-shepard', alternate); world._applyCommanderCustomization(fixture.actor);
  assert.notEqual(fixture.actor.body.material.map, first, 'same crop with different metadata cannot reuse an incompatible recoloration');
  assert.equal(fixture.actor.body.material.map.userData.relayCustomizationSource.userData.relayAnimationFrame, alternate);
});
