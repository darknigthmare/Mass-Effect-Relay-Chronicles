import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { WorldView } from '../src/world.js';
import { ENEMY_ANIMATION_IDS as IDS, ENEMY_COMBAT_POSES as POSES,
  normalizeEnemyAnimation, canShowEnemyAnimation } from '../src/enemy-animation-data.js';
import { normalizeJokerSeated, canShowJokerSeated } from '../src/joker-seated-data.js';
import { newGame } from '../src/state.js';
import { actorFor, ENEMIES, enemiesFor, ENCOUNTERS } from '../src/game-data.js';
import { createBattle, performAction } from '../src/combat.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { initialCustomization } from '../src/customization.js';

const texture = (width = 100, height = 100) => new THREE.Texture({ width, height });
const nativeKey = { geth: 'geth', 'geth-sniper': 'sniper', 'geth-destroyer': 'destroyer', husk: 'husk' };
const config = key => ({ version: 1, characterId: key, mediaId: 'ME1', periodId: 'me1', combat: {
  file: `enemy-${key}-combat.png`, width: 100, height: 100, direction: 'three-quarter', frames: {
    aim: { id: `${key}-combat-aim`, pose: 'aim', rect: [0, 0, 40, 50], pivot: [16, 48], heightScale: 1 },
    power: { id: `${key}-combat-power`, pose: 'power', rect: [40, 0, 60, 50], pivot: [21, 48], heightScale: 1 },
    hit: { id: `${key}-combat-hit`, pose: 'hit', rect: [0, 50, 40, 40], pivot: [18, 38], heightScale: .8 },
    down: { id: `${key}-combat-down`, pose: 'down', rect: [40, 80, 60, 20], pivot: [30, 18], heightScale: .25 },
  },
} });
const seated = () => ({ version: 1, characterId: 'joker', mediaId: 'ME1', periodId: 'me1', file: 'joker-seated.png', width: 100, height: 100,
  frames: { idle: { id: 'joker-seated-idle', rect: [0, 0, 45, 90], pivot: [22, 88], heightScale: .77 },
    pilot: { id: 'joker-seated-pilot', rect: [50, 0, 45, 90], pivot: [20, 88], heightScale: .77 } } });
const close = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-9, `${label}: ${actual} != ${expected}`);
function fixture({ loaded = true } = {}) {
  const world = Object.create(WorldView.prototype);
  Object.assign(world, {
    commanderAppearance: 'male', commanderCustomization: initialCustomization(), actors: [], ambientActors: [],
    battleActors: new Map(), characterAnimations: Object.fromEntries(IDS.map(key => [key, normalizeEnemyAnimation(key, config(key))])),
    scene: new THREE.Scene(), characters: new THREE.Group(), particles: new THREE.Group(), spriteCache: new Map(),
    customizationTextures: new Map(), textureCache: new Map(), materialCache: new Map(), assetErrors: [],
    atlases: { crew: texture(400, 200), npc: texture(400, 200), enemy: texture(400, 200) },
    camera: new THREE.OrthographicCamera(-20, 20, 15, -15, .1, 500), cameraOffset: new THREE.Vector3(23, 29, 27), cameraTarget: new THREE.Vector3(),
    player: { x: 0, z: 0 }, zone: { arena: { x: 0, z: 0 } }, mode: 'combat', time: 0, keys: new Set(), trail: [],
    effects: [], animations: [], poiViews: [], combatOccluders: [], cleared: new Set(), operationPois: [],
    renderer: { render() {} }, getNearby() { return null; }, _walkable() { return true; },
  });
  world.scene.add(world.characters, world.particles);
  if (loaded) for (const key of IDS) world.atlases[`combat-${key}`] = texture();
  return world;
}
function battleFor(world, keys) {
  const state = newGame({ classId: 'soldier' });
  const battle = createBattle({ party: [{ ...actorFor('shepard', state), atb: 100 }],
    enemies: keys.map((key, index) => ({ ...ENEMIES[nativeKey[key]], id: `${nativeKey[key]}-${index}`, atb: 100 })),
    difficulty: 'normal', mode: 'wait', seed: 2183 });
  world.setBattle(battle); return { state, battle };
}
function checkFrame(world, actor, frame, atlasName = `combat-${actor.key}`) {
  const map = actor.body.material.map, atlas = world.atlases[atlasName], [x, y, width, height] = frame.rect;
  assert.equal(actor.animationFrame, frame.id); assert.equal(map.image, atlas.image); assert.notEqual(map, atlas);
  close(map.repeat.x, width / atlas.image.width, 'UV width'); close(map.repeat.y, height / atlas.image.height, 'UV height');
  close(map.offset.x, x / atlas.image.width, 'UV x'); close(map.offset.y, 1 - (y + height) / atlas.image.height, 'UV y');
  const displayHeight = actor.height * frame.heightScale, displayWidth = displayHeight * width / height;
  close(actor.body.geometry.parameters.height * actor.body.scale.y, displayHeight, 'height');
  close(actor.body.geometry.parameters.width * actor.body.scale.x, displayWidth, 'width');
  close(actor.body.position.y + (.5 - frame.pivot[1] / height) * displayHeight, .05, 'ground pivot');
  assert.equal(actor.body.rotation.z, 0);
}

test('enemy metadata accepts four complete ME1 families while rejecting malformed scopes, identities, local paths and frames', () => {
  for (const key of IDS) {
    const raw = config(key), parsed = normalizeEnemyAnimation(key, raw);
    assert.ok(parsed); assert.ok(Object.isFrozen(parsed.combat.frames.aim.rect));
    raw.combat.frames.aim.rect[0] = 900; assert.equal(parsed.combat.frames.aim.rect[0], 0);
    for (const mutate of [c => { c.mediaId = 'ME2'; }, c => { c.periodId = 'me2'; }, c => { c.characterId = 'geth-prime'; },
      c => { c.combat.file = '../enemy-atlas.png'; }, c => { c.combat.url = 'https://example.com/atlas.png'; },
      c => { delete c.combat.frames.down; }, c => { c.combat.frames.hit.id = 'shared'; },
      c => { c.combat.frames.down.pivot[0] = 61; }, c => { c.combat.frames.aim.rect[2] = 101; },
      c => { c.combat.frames.power.heightScale = 0; }]) {
      const invalid = config(key); mutate(invalid); assert.equal(normalizeEnemyAnimation(key, invalid), null);
    }
  }
  assert.equal(normalizeEnemyAnimation('saren', config('geth')), null);
});

test('native campaign enemy IDs are accepted while cross-family aliases, party actors and foreign contexts fail closed', () => {
  const state = newGame();
  let observed = 0;
  for (const [zone, encounters] of Object.entries(ENCOUNTERS)) for (let i = 0; i < encounters.length; i++) {
    const battle = createBattle({ party: [actorFor('shepard', state)], enemies: enemiesFor(zone, i, state) });
    for (const entry of battle.actors.filter(actor => actor.team === 'enemy' && IDS.includes(actor.sprite))) {
      const view = { id: entry.id, key: entry.sprite, enemy: true, state: entry };
      assert.equal(canShowEnemyAnimation(view), true, `${zone}:${entry.id}`); observed++;
      for (const patch of [{ mediaId: 'ME3' }, { periodId: 'me2' }, { context: { mediaId: 'MEA' } },
        { team: 'party' }, { sprite: 'geth-prime' }, { id: 'ME2-ENM-GETH' }])
        assert.equal(canShowEnemyAnimation(view, { ...entry, ...patch }), false);
      assert.equal(canShowEnemyAnimation({ ...view, enemy: false }), false);
      assert.equal(canShowEnemyAnimation({ ...view, id: 'geth-fixture', state: { ...entry, id: 'geth-fixture' } }), false);
    }
  }
  assert.ok(observed > 20);
});

test('combat-only enemy registrations are deduplicated and cannot install exploration frames', t => {
  const world = fixture({ loaded: false }), loads = [];
  world.characterAnimations = {}; t.mock.method(world, '_loadAtlas', (name, url) => loads.push({ name, url }));
  for (const key of IDS) {
    const raw = config(key); raw.frames = [{ id: 'forged-walk' }]; raw.file = 'enemy-atlas.png';
    assert.equal(world.registerCharacterAnimation(key, raw), true); assert.equal(world.registerCharacterAnimation(key, raw), true);
    assert.equal(world.characterAnimations[key].frames, undefined); assert.equal(world._animateCharacter({ key }, true, 1, 0), false);
  }
  assert.deepEqual(loads, IDS.map(key => ({ name: `combat-${key}`, url: `./assets/enemy-${key}-combat.png` })));
});

test('sixteen enemy frames keep native battle/save data intact and remove stale crops after foreign scope transitions', () => {
  for (const key of IDS) {
    const world = fixture(), { state, battle } = battleFor(world, [key]), beforeSave = structuredClone(state);
    const native = battle.actors.find(actor => actor.team === 'enemy'), view = world.battleActors.get(native.id);
    for (const pose of POSES) {
      native.hp = pose === 'down' ? 0 : native.maxHp; world.setBattle(battle);
      const before = { ...structuredClone({ ...battle, _rng: null }), _rng: battle._rng };
      if (pose === 'hit') world.playEvent({ type: 'damage', targetId: native.id });
      else if (pose !== 'down') world.playEvent({ type: 'action', actorId: native.id, actionId: pose === 'aim' ? 'shoot' : 'cover' });
      world.update(0); checkFrame(world, view, world.characterAnimations[key].combat.frames[pose]);
      assert.deepEqual(battle, before); assert.deepEqual(state, beforeSave);
    }
    native.mediaId = 'ME3'; world.setBattle(battle); world.update(0);
    assert.equal(view.animationFrame, null); assert.equal(view.body.material.map.image, world.atlases.enemy.image);
    native.mediaId = 'ME1'; native.hp = native.maxHp; world.setBattle(battle); world.update(0);
    checkFrame(world, view, world.characterAnimations[key].combat.frames.aim);
  }
});

test('real native enemy actions, native damage and KO honor action/impact/down priorities without new skills', () => {
  for (const key of IDS) {
    const world = fixture(), state = newGame({ classId: 'soldier' });
    const battle = createBattle({ party: ['shepard', 'ashley'].map(id => ({ ...actorFor(id, state), atb: 100 })),
      enemies: [{ ...ENEMIES[nativeKey[key]], id: `${nativeKey[key]}-0`, atb: 100 }], mode: 'wait', seed: 2183 });
    world.setBattle(battle);
    const native = battle.actors.find(actor => actor.team === 'enemy'), view = world.battleActors.get(native.id), powers = [...native.powers];
    const actionId = native.primaryAction === 'strike' ? 'strike' : native.powers[0] || 'shoot';
    const action = performAction(battle, { actorId: native.id, actionId, targetId: 'shepard' });
    assert.equal(action.ok, true); world.setBattle(battle); for (const event of action.events) world.playEvent(event); world.update(0);
    assert.equal(view.animationFrame, `${key}-combat-${actionId === 'shoot' ? 'aim' : 'power'}`);
    world.playEvent({ type: 'damage', targetId: native.id }); world.playEvent({ type: 'action', actorId: native.id, actionId: 'shoot' }); world.update(0);
    assert.equal(view.animationFrame, `${key}-combat-hit`);
    const shooter = battle.actors.find(actor => actor.id === 'ashley'); shooter.attack = 5000; native.hp = 1; native.shield = 0;
    const damage = performAction(battle, { actorId: shooter.id, actionId: 'shoot', targetId: native.id });
    assert.equal(damage.ok, true); assert.equal(native.hp, 0);
    world.setBattle(battle); for (const event of damage.events) world.playEvent(event);
    world.playEvent({ type: 'action', actorId: native.id, actionId: 'shoot' }); world.update(0);
    assert.equal(view.animationFrame, `${key}-combat-down`); assert.deepEqual(native.powers, powers);
  }
});

test('enemy textures stay actor-local without image invalidation and battle exit releases only their crops', () => {
  const world = fixture(), { battle } = battleFor(world, ['geth', 'geth']); world.update(0);
  const [first, second] = battle.actors.filter(actor => actor.team === 'enemy').map(actor => world.battleActors.get(actor.id));
  const a = first.body.material.map, b = second.body.material.map, originalUV = b.offset.clone(), version = a.version, sourceVersion = a.source.version;
  assert.notEqual(a, b); assert.equal(a.source, b.source);
  for (let i = 0; i < 50; i++) world._applyAnimationFrame(first, 'combat-geth', world.characterAnimations.geth.combat.frames[i % 2 ? 'aim' : 'down']);
  assert.equal(a.version, version); assert.equal(a.source.version, sourceVersion); assert.deepEqual(b.offset, originalUV);
  let aDisposed = 0, bDisposed = 0; a.addEventListener('dispose', () => aDisposed++); b.addEventListener('dispose', () => bDisposed++);
  world.setBattle(null); assert.equal(aDisposed, 1); assert.equal(bDisposed, 1);
  assert.ok(world.atlases['combat-geth']); assert.ok(world.atlases.enemy);
});

test('failed, delayed, stale and wrong-size enemy atlas loads retain a base fallback and recover safely', t => {
  const world = fixture({ loaded: false }), { battle } = battleFor(world, ['geth']), view = world.battleActors.get(battle.actors[1].id), pending = [];
  t.mock.method(THREE.TextureLoader.prototype, 'load', (url, ready, _progress, error) => pending.push({ url, ready, error }));
  assert.equal(world._loadAtlas('combat-geth', './assets/enemy-geth-combat.png'), true);
  assert.equal(world._loadAtlas('combat-geth', './assets/enemy-geth-combat.png'), false);
  world.update(0); assert.equal(view.animationFrame, null); assert.equal(view.body.material.map.image, world.atlases.enemy.image);
  pending[0].error(); assert.equal(world.assetErrors.length, 1);
  world._loadAtlas('combat-geth', './assets/enemy-geth-combat.png'); const wrong = texture(90, 100); let wrongDisposed = 0;
  wrong.addEventListener('dispose', () => wrongDisposed++); pending[1].ready(wrong); assert.equal(wrongDisposed, 1);
  world._loadAtlas('combat-geth', './assets/old.png'); world._loadAtlas('combat-geth', './assets/enemy-geth-combat.png');
  const stale = texture(); let staleDisposed = 0; stale.addEventListener('dispose', () => staleDisposed++);
  pending[3].ready(texture()); pending[2].ready(stale); assert.equal(staleDisposed, 1); world.update(0);
  checkFrame(world, view, world.characterAnimations.geth.combat.frames.aim);
});

test('seated Joker metadata rejects foreign identity, paths, missing poses and incompatible geometry', () => {
  const raw = seated(), parsed = normalizeJokerSeated(raw); assert.ok(parsed); assert.ok(Object.isFrozen(parsed.frames.idle.rect));
  raw.frames.idle.rect[0] = 900; assert.equal(parsed.frames.idle.rect[0], 0);
  for (const mutate of [c => { c.mediaId = 'ME2'; }, c => { c.periodId = 'me2'; }, c => { c.characterId = 'anderson'; },
    c => { c.file = '../joker-seated.png'; }, c => { delete c.frames.pilot; }, c => { c.frames.idle.rect[2] = 101; },
    c => { c.frames.pilot.pivot[1] = 100; }, c => { c.frames.idle.heightScale = Infinity; }]) {
    const invalid = seated(); mutate(invalid); assert.equal(normalizeJokerSeated(invalid), null);
  }
});

test('only authored Normandy pilot Joker sits; fixed pose, anchored feet and save data survive updates and zone changes', t => {
  const world = fixture(), state = newGame(), before = structuredClone(state);
  world.zoneId = 'normandy'; world.zone = WORLD_ZONES.normandy; world.mode = 'explore';
  world.storyContext = { recruited: ['shepard'], lost: [] };
  world.getConversationPOIs = () => [WORLD_ZONES.normandy.conversationPois.find(poi => poi.conversationId === 'joker')];
  t.mock.method(world, '_loadAtlas', () => true); assert.equal(world.registerJokerSeated(seated()), true);
  world.atlases['seated-joker'] = texture(); world._makeAmbientCharacters(); world.update(0);
  const joker = world.ambientActors.find(actor => actor.id === 'npc:joker');
  assert.equal(canShowJokerSeated(joker, world.zoneId), true);
  checkFrame(world, joker, world.jokerSeatedConfig.frames.idle, 'seated-joker');
  const map = joker.body.material.map, version = map.version;
  for (let i = 0; i < 20; i++) world.update(.05);
  checkFrame(world, joker, world.jokerSeatedConfig.frames.idle, 'seated-joker'); assert.equal(map.version, version);
  const ordinary = world._makeActor('joker', 'joker'); assert.equal(world._applySeatedJoker(ordinary), false);
  assert.equal(ordinary.animationFrame, undefined); assert.equal(ordinary.body.material.map.image, world.atlases.npc.image);
  world.zoneId = 'citadel'; world.update(0); assert.equal(joker.animationFrame, null); assert.equal(joker.body.material.map.image, world.atlases.npc.image);
  assert.deepEqual(state, before);
});

test('seated Joker loads deduplicate, reject mismatched dimensions and recover without replacing unrelated NPCs', t => {
  const world = fixture(), pending = []; world.zoneId = 'normandy';
  t.mock.method(THREE.TextureLoader.prototype, 'load', (url, ready, _progress, error) => pending.push({ url, ready, error }));
  assert.equal(world.registerJokerSeated(seated()), true); assert.equal(world.registerJokerSeated(seated()), true); assert.equal(pending.length, 1);
  const joker = world._makeActor('joker', 'npc:joker'); joker.stationRole = 'normandy-pilot';
  const anderson = world._makeActor('anderson', 'npc:anderson'), otherMap = anderson.body.material.map;
  assert.equal(world._applySeatedJoker(joker), false); assert.equal(joker.body.material.map.image, world.atlases.npc.image);
  const wrong = texture(90, 100); let disposed = 0; wrong.addEventListener('dispose', () => disposed++); pending[0].ready(wrong);
  assert.equal(disposed, 1); assert.equal(world.assetErrors.length, 1);
  world._loadAtlas('seated-joker', './assets/joker-seated.png'); pending[1].ready(texture());
  assert.equal(world._applySeatedJoker(joker), true); assert.equal(anderson.body.material.map, otherMap);
  checkFrame(world, joker, world.jokerSeatedConfig.frames.idle, 'seated-joker');
});

test('shipped enemy and pilot metadata matches five native PNG headers and eighteen unique measured pose IDs', () => {
  const families = IDS.map(key => normalizeEnemyAnimation(key, JSON.parse(readFileSync(new URL(`../public/assets/enemy-${key}-animation.json`, import.meta.url)))));
  assert.ok(families.every(Boolean));
  const joker = normalizeJokerSeated(JSON.parse(readFileSync(new URL('../public/assets/joker-seated.json', import.meta.url)))); assert.ok(joker);
  const poses = [];
  for (const family of [...families.map(family => family.combat), joker]) {
    const bytes = readFileSync(new URL(`../public/assets/${family.file}`, import.meta.url));
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(bytes.readUInt32BE(16), family.width); assert.equal(bytes.readUInt32BE(20), family.height);
    assert.equal(bytes[25], 6, 'native RGBA'); poses.push(...Object.values(family.frames).map(frame => frame.id));
  }
  assert.equal(poses.length, 18); assert.equal(new Set(poses).size, 18);
});
