import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { WebGLMaterials } from 'three/src/renderers/webgl/WebGLMaterials.js';
import { WorldView } from '../src/world.js';
import { COMPANION_ANIMATION_IDS as IDS, COMPANION_COMBAT_POSES as POSES,
  normalizeCompanionAnimation, canShowCompanionAnimation } from '../src/companion-animation-data.js';
import { initialCustomization } from '../src/customization.js';
import { newGame } from '../src/state.js';
import { actorFor, ENEMIES } from '../src/game-data.js';
import { createBattle, performAction } from '../src/combat.js';

const texture = (width = 100, height = 100) => new THREE.Texture({ width, height });
const config = key => ({ version: 1, characterId: key, mediaId: 'ME1', combat: {
  file: `companion-${key}-combat.png`, width: 100, height: 100, direction: 'three-quarter', frames: {
    aim: { id: `${key}-combat-aim`, pose: 'aim', rect: [0, 0, 40, 50], pivot: [16, 48], heightScale: 1 },
    power: { id: `${key}-combat-power`, pose: 'power', rect: [40, 0, 60, 50], pivot: [21, 48], heightScale: 1 },
    hit: { id: `${key}-combat-hit`, pose: 'hit', rect: [0, 50, 40, 40], pivot: [18, 38], heightScale: .8 },
    down: { id: `${key}-combat-down`, pose: 'down', rect: [40, 80, 60, 20], pivot: [30, 18], heightScale: .25 },
  },
} });
const close = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-9, `${label}: ${actual} != ${expected}`);
function fixture({ loaded = true } = {}) {
  const world = Object.create(WorldView.prototype);
  Object.assign(world, {
    commanderAppearance: 'male', commanderCustomization: initialCustomization(), actors: [], ambientActors: [],
    battleActors: new Map(), characterAnimations: Object.fromEntries(IDS.map(key => [key, normalizeCompanionAnimation(key, config(key))])),
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
function battleFor(world, ids, overrides = {}) {
  const state = newGame({ classId: 'soldier', appearance: 'male' }); state.flags.spectre = true;
  const battle = createBattle({ party: ['shepard', ...ids].map(id => ({ ...actorFor(id, state), atb: 100, ...overrides[id] })),
    enemies: [{ ...ENEMIES.geth, id: 'geth-fixture', hp: 1500, maxHp: 1500, atb: 100 }],
    difficulty: 'normal', mode: 'wait', seed: 2183, medigel: state.medigel });
  world.setBattle(battle); return { state, battle };
}
function checkFrame(world, actor, frame, cover = false) {
  const map = actor.body.material.map, atlas = world.atlases[`combat-${actor.key}`], [x, y, width, height] = frame.rect;
  assert.equal(actor.animationFrame, frame.id); assert.equal(map.image, atlas.image); assert.equal(map.userData.relayAnimationFrame, frame);
  close(map.repeat.x, width / atlas.image.width, 'UV width'); close(map.repeat.y, height / atlas.image.height, 'UV height');
  close(map.offset.x, x / atlas.image.width, 'UV x'); close(map.offset.y, 1 - (y + height) / atlas.image.height, 'UV y');
  const displayHeight = actor.height * frame.heightScale * (cover ? .88 : 1), displayWidth = displayHeight * width / height;
  close(actor.body.geometry.parameters.height * actor.body.scale.y, displayHeight, 'height');
  close(actor.body.geometry.parameters.width * actor.body.scale.x, displayWidth, 'width');
  close(actor.body.position.y + (.5 - frame.pivot[1] / height) * displayHeight, .05, 'ground pivot');
  const offset = (.5 - frame.pivot[0] / width) * displayWidth, facing = Math.atan2(world.cameraOffset.x, world.cameraOffset.z);
  close(actor.body.position.x, Math.cos(facing) * offset, 'pivot x'); close(actor.body.position.z, -Math.sin(facing) * offset, 'pivot z');
  assert.equal(actor.body.rotation.z, 0); assert.notEqual(map, atlas);
}

test('complete companion metadata is copied and frozen; wrong identities, scopes, paths and geometry fail closed', () => {
  for (const key of IDS) {
    const raw = config(key), before = structuredClone(raw), parsed = normalizeCompanionAnimation(key, raw);
    assert.ok(parsed); assert.deepEqual(raw, before); assert.ok(Object.isFrozen(parsed)); assert.ok(Object.isFrozen(parsed.combat.frames.aim.rect));
    raw.combat.frames.aim.rect[0] = 999; assert.equal(parsed.combat.frames.aim.rect[0], 0);
    assert.throws(() => { parsed.combat.frames.aim.rect.push(1); }, TypeError);
    for (const mutate of [
      c => { c.characterId = 'shepard'; }, c => { c.mediaId = 'ME3'; }, c => { c.periodId = 'me3'; },
      c => { c.combat.file = '../crew-atlas.png'; }, c => { c.combat.file = 'https://example.com/atlas.png'; },
      c => { delete c.combat.frames.down; }, c => { c.combat.frames.aim.id = 'shared-aim'; },
      c => { c.combat.frames.aim.pivot[0] = 41; }, c => { c.combat.frames.aim.rect[0] = 99; },
      c => { c.combat.frames.hit.heightScale = 0; }, c => { c.combat.width = NaN; },
    ]) { const invalid = config(key); mutate(invalid); assert.equal(normalizeCompanionAnimation(key, invalid), null); }
    const urlOnly = config(key); urlOnly.combat.url = urlOnly.combat.file; delete urlOnly.combat.file;
    assert.equal(normalizeCompanionAnimation(key, urlOnly).combat.file, `companion-${key}-combat.png`);
  }
  for (const key of ['jenkins', 'shepard', 'ME3-CHR-GARRUS', '__proto__']) assert.equal(normalizeCompanionAnimation(key, config('garrus')), null);
});

test('six combat-only registrations load exact local families once and never install an exploration animation', t => {
  const world = fixture({ loaded: false }), loads = [], base = world.atlases.crew;
  world.characterAnimations = {}; t.mock.method(world, '_loadAtlas', (name, url) => loads.push({ name, url }));
  for (const key of IDS) {
    const raw = config(key); raw.frames = [{ id: 'forged-walk' }]; raw.file = 'crew-atlas.png';
    assert.equal(world.registerCharacterAnimation(key, raw), true);
    assert.equal(world.registerCharacterAnimation(key, raw), true);
    assert.equal(world.characterAnimations[key].frames, undefined);
    assert.equal(world._animateCharacter({ key }, true, 1, 0), false);
  }
  assert.deepEqual(loads, IDS.map(key => ({ name: `combat-${key}`, url: `./assets/companion-${key}-combat.png` })));
  assert.equal(world.atlases.crew, base);
  assert.equal(world.registerCharacterAnimation('ME3-CHR-GARRUS', config('garrus')), false);
  assert.equal(world.registerCharacterAnimation('garrus', config('wrex')), false);
});

test('all twenty-four companion poses use actual crop/pivot/relative height without mutating a native battle or save', () => {
  for (const key of IDS) {
    const world = fixture(), { state, battle } = battleFor(world, [key]), actor = world.battleActors.get(key), native = battle.actors.find(a => a.id === key);
    const originalSave = structuredClone(state);
    for (const pose of POSES) {
      native.hp = pose === 'down' ? 0 : native.maxHp; native.cover = false; world.setBattle(battle);
      const originalBattle = { ...structuredClone({ ...battle, _rng: null }), _rng: battle._rng };
      if (pose === 'hit') world.playEvent({ type: 'damage', targetId: key });
      else if (pose !== 'down') world.playEvent({ type: 'action', actorId: key, actionId: pose === 'aim' ? 'shoot' : 'cover' });
      world.update(0); checkFrame(world, actor, world.characterAnimations[key].combat.frames[pose]);
      assert.deepEqual(battle, originalBattle); assert.deepEqual(state, originalSave);
    }
    native.hp = native.maxHp; native.cover = true; world.setBattle(battle); world.update(0);
    checkFrame(world, actor, world.characterAnimations[key].combat.frames.aim, true);
  }
});

test('real native damage, KO and existing ME1 Unity events produce hit/down/revival without granting a skill', () => {
  for (const key of IDS) {
    const world = fixture(), { battle } = battleFor(world, [key], { [key]: { hp: 1, shield: 0 } });
    const attacker = battle.actors.find(a => a.team === 'enemy'); attacker.attack = 500;
    const view = world.battleActors.get(key), native = battle.actors.find(a => a.id === key), powers = [...native.powers];
    const damage = performAction(battle, { actorId: attacker.id, actionId: 'shoot', targetId: key });
    assert.equal(damage.ok, true); assert.equal(native.hp, 0); assert.ok(damage.events.some(e => e.type === 'damage' && e.targetId === key));
    world.setBattle(battle); for (const event of damage.events) world.playEvent(event); world.update(0);
    checkFrame(world, view, world.characterAnimations[key].combat.frames.down);
    const revive = performAction(battle, { actorId: 'shepard', actionId: 'unity' });
    assert.equal(revive.ok, true); assert.ok(revive.events.some(e => e.type === 'revive' && e.targetId === key));
    const afterNativeAction = { ...structuredClone({ ...battle, _rng: null }), _rng: battle._rng };
    world.setBattle(battle); for (const event of revive.events) world.playEvent(event); world.update(0);
    checkFrame(world, view, world.characterAnimations[key].combat.frames.aim);
    assert.deepEqual(native.powers, powers); assert.deepEqual(battle, afterNativeAction);
  }
});

test('impact outranks action, KO outranks all events and expired or revived companions return to aim', () => {
  const world = fixture(), { battle } = battleFor(world, ['garrus', 'wrex']), view = world.battleActors.get('garrus');
  world.playEvent({ type: 'action', actorId: 'garrus', actionId: 'overload' }); world.update(0);
  assert.equal(view.animationFrame, 'garrus-combat-power');
  world.playEvent({ type: 'damage', targetId: 'garrus' }); world.playEvent({ type: 'action', actorId: 'garrus', actionId: 'shoot' }); world.update(0);
  assert.equal(view.animationFrame, 'garrus-combat-hit');
  for (let i = 0; i < 9; i++) world.update(.05); assert.equal(view.animationFrame, 'garrus-combat-aim');
  const native = battle.actors.find(a => a.id === 'garrus'); native.hp = 0; world.setBattle(battle);
  world.playEvent({ type: 'action', actorId: 'garrus', actionId: 'overload' }); world.playEvent({ type: 'damage', targetId: 'garrus' }); world.update(0);
  assert.equal(view.animationFrame, 'garrus-combat-down'); assert.equal(view.combatPoseTime, 0);
  native.hp = 100; world.setBattle(battle); world.update(0); assert.equal(view.animationFrame, 'garrus-combat-aim');
});

test('short actor ID, sprite, side and explicit ME1 scope must all agree; foreign transitions remove a stale crop', () => {
  const cases = [
    { id: 'ME3-CHR-GARRUS', sprite: 'garrus', mediaId: 'ME3' },
    { id: 'garrus', sprite: 'garrus', mediaId: 'ME3' }, { id: 'garrus', sprite: 'garrus', periodId: 'me2' },
    { id: 'garrus', sprite: 'liara' }, { id: 'Garrus', sprite: 'garrus' },
    { id: 'garrus', sprite: 'garrus', context: { mediaId: 'MEA', periodId: 'mea' } },
  ];
  for (const fields of cases) {
    const world = fixture(), state = { ...fields, team: 'party', hp: 100, shield: 20 };
    world.setBattle({ actors: [state] }); const actor = world.battleActors.get(fields.id);
    assert.equal(canShowCompanionAnimation(actor), false); world.update(0);
    assert.equal(actor.animationFrame ?? null, null); assert.equal(world._combatAnimationConfig(actor), null);
  }
  const world = fixture(), { battle } = battleFor(world, ['garrus']); world.update(0);
  const native = battle.actors.find(a => a.id === 'garrus'), actor = world.battleActors.get('garrus');
  assert.equal(actor.animationFrame, 'garrus-combat-aim'); native.mediaId = 'ME3'; world.setBattle(battle); world.update(0);
  assert.equal(actor.animationFrame, null); assert.equal(actor.body.material.map.image, world.atlases.crew.image);
  native.mediaId = 'ME1'; world.setBattle(battle); world.update(0); assert.equal(actor.animationFrame, 'garrus-combat-aim');
  native.team = 'enemy'; world.setBattle(battle); world.update(0); assert.equal(actor.animationFrame, null);
});

test('pose textures are actor-local and loading a family never resets another companion or customized Shepard', t => {
  const world = fixture(), { battle } = battleFor(world, ['garrus', 'wrex']); world.update(0);
  const garrus = world.battleActors.get('garrus'), wrex = world.battleActors.get('wrex'), shepard = world.battleActors.get('shepard');
  const wrexMap = wrex.body.material.map, wrexUV = wrexMap.offset.clone(), custom = texture(); shepard.body.material.map = custom;
  const source = world.atlases['combat-garrus'];
  world.playEvent({ type: 'action', actorId: 'garrus', actionId: 'overload' }); world.update(0);
  assert.notEqual(garrus.body.material.map, wrexMap); assert.deepEqual(wrexMap.offset, wrexUV);
  assert.deepEqual(source.repeat.toArray(), [1, 1]); assert.deepEqual(source.offset.toArray(), [0, 0]);
  let ready; t.mock.method(THREE.TextureLoader.prototype, 'load', (_url, callback) => { ready = callback; });
  shepard.body.material.map = custom; world._loadAtlas('combat-garrus', './assets/replacement-garrus.png'); ready(texture());
  assert.equal(wrex.body.material.map, wrexMap); assert.equal(shepard.body.material.map, custom);
  world.update(0); checkFrame(world, garrus, world.characterAnimations.garrus.combat.frames.power);
  assert.equal(wrex.body.material.map, wrexMap); assert.equal(battle.actors.length, 4);
});

test('delayed, failed and dimension-mismatched loads keep a visible base fallback and can recover', t => {
  const world = fixture({ loaded: false }), { battle } = battleFor(world, ['garrus']), actor = world.battleActors.get('garrus'), pending = [];
  t.mock.method(THREE.TextureLoader.prototype, 'load', (url, ready, _progress, error) => { pending.push({ url, ready, error }); });
  assert.equal(world._loadAtlas('combat-garrus', './assets/companion-garrus-combat.png'), true);
  assert.equal(world._loadAtlas('combat-garrus', './assets/companion-garrus-combat.png'), false); assert.equal(pending.length, 1);
  world.update(0); assert.equal(actor.body.material.map.image, world.atlases.crew.image); assert.equal(actor.animationFrame, null);
  battle.actors.find(a => a.id === 'garrus').hp = 0; world.setBattle(battle); world.update(0);
  assert.equal(actor.body.rotation.z, -.9); pending[0].error(); assert.equal(world.assetErrors.length, 1);
  world._loadAtlas('combat-garrus', './assets/companion-garrus-combat.png'); const invalid = texture(90, 100); let invalidDisposed = 0;
  invalid.addEventListener('dispose', () => invalidDisposed++); pending[1].ready(invalid);
  assert.equal(invalidDisposed, 1); assert.equal(world.assetErrors.length, 2); assert.equal(world.atlases['combat-garrus'], undefined);
  world._loadAtlas('combat-garrus', './assets/companion-garrus-combat.png'); pending[2].ready(texture()); world.update(0);
  checkFrame(world, actor, world.characterAnimations.garrus.combat.frames.down);
});

test('a superseded load is disposed without replacing the newer atlas and its per-actor crop', t => {
  const world = fixture({ loaded: false }), pending = [];
  battleFor(world, ['garrus']); t.mock.method(THREE.TextureLoader.prototype, 'load', (url, ready) => pending.push({ url, ready }));
  world._loadAtlas('combat-garrus', './assets/old.png'); world._loadAtlas('combat-garrus', './assets/new.png');
  const older = texture(), newer = texture(); let disposed = 0; older.addEventListener('dispose', () => disposed++);
  pending[1].ready(newer); world.update(0); const active = world.battleActors.get('garrus').body.material.map;
  pending[0].ready(older); assert.equal(disposed, 1); assert.equal(world.atlases['combat-garrus'], newer);
  assert.equal(world.battleActors.get('garrus').body.material.map, active); assert.deepEqual(world.assetErrors, []);
});

test('leaving combat releases only that battle texture family and keeps base exploration and recruitment rules', () => {
  const world = fixture(); world.storyContext = { recruited: ['shepard', 'garrus', 'tali'], lost: ['tali'] };
  world.setParty(['shepard', 'garrus', 'tali', 'wrex']); assert.deepEqual(world.party, ['shepard', 'garrus']);
  const explorer = world.actors.find(a => a.id === 'garrus'), idle = explorer.body.material.map;
  const { battle } = battleFor(world, ['garrus', 'wrex']); world.update(0);
  const garrusMap = world.battleActors.get('garrus').body.material.map, wrexMap = world.battleActors.get('wrex').body.material.map;
  let garrusDisposed = 0, wrexDisposed = 0; garrusMap.addEventListener('dispose', () => garrusDisposed++); wrexMap.addEventListener('dispose', () => wrexDisposed++);
  battle.actors = battle.actors.filter(actor => actor.id !== 'garrus'); world.setBattle(battle);
  assert.equal(garrusDisposed, 1); assert.equal(wrexDisposed, 0); assert.equal(world.battleActors.has('garrus'), false);
  world.setBattle(null); assert.equal(wrexDisposed, 1); assert.equal(world.battleActors.size, 0);
  world.mode = 'explore'; world.update(0); assert.equal(explorer.body.material.map, idle); assert.equal(explorer.animationFrame, undefined);
  assert.ok(world.atlases['combat-garrus']); assert.ok(world.atlases.crew);
});

test('dispose releases unique owned textures once, ignores a late load and is idempotent', t => {
  const prior = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { removeEventListener() {} } });
  t.after(() => { if (prior) Object.defineProperty(globalThis, 'window', prior); else delete globalThis.window; });
  const world = fixture(), pending = []; battleFor(world, ['garrus']); world.update(0);
  t.mock.method(THREE.TextureLoader.prototype, 'load', (_url, ready) => pending.push(ready));
  world._loadAtlas('combat-tali', './assets/pending.png');
  let rendererDisposed = 0, nodesRemoved = 0;
  Object.assign(world.renderer, { dispose() { rendererDisposed++; }, domElement: { removeEventListener() {}, remove() { nodesRemoved++; } } });
  world.labels = { remove() { nodesRemoved++; } }; world.textureCache.set('alias', world.atlases.crew);
  const owned = new Set([...world.spriteCache.values(), ...world.textureCache.values(), ...Object.values(world.atlases)]), counts = new Map();
  for (const map of owned) { counts.set(map, 0); map.addEventListener('dispose', () => counts.set(map, counts.get(map) + 1)); }
  world.dispose(); world.dispose(); assert.equal(rendererDisposed, 1); assert.equal(nodesRemoved, 2);
  assert.ok([...counts.values()].every(count => count === 1)); assert.equal(world.spriteCache.size, 0); assert.equal(world.textureCache.size, 0);
  assert.deepEqual(world.atlases, {}); const late = texture(); let lateDisposed = 0; late.addEventListener('dispose', () => lateDisposed++);
  pending[0](late); assert.equal(lateDisposed, 1); assert.deepEqual(world.atlases, {}); assert.deepEqual(world.assetErrors, []);
  assert.equal(world.registerCharacterAnimation('garrus', config('garrus')), false);
});

test('UV recropping reaches actual Three material uniforms without invalidating initialized or shared image sources', () => {
  const world = fixture(); battleFor(world, ['garrus']); world.update(0);
  const actor = world.battleActors.get('garrus'), map = actor.body.material.map, atlas = world.atlases['combat-garrus'];
  const sibling = atlas.clone(); sibling.repeat.set(.2, .3); sibling.offset.set(.4, .5);
  assert.equal(map.source, atlas.source); assert.equal(sibling.source, map.source); assert.equal(map.matrixAutoUpdate, true);
  const versions = { texture: map.version, source: map.source.version, sibling: sibling.version };
  assert.ok(versions.texture > 0, 'the initial clone still requests its first GPU upload');
  const uniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.basic.uniforms);
  const materials = WebGLMaterials({}, { get: () => ({}) }), observed = [];
  for (let i = 0; i < 50; i++) {
    const frame = world.characterAnimations.garrus.combat.frames[i % 2 ? 'down' : 'aim'];
    assert.equal(world._applyAnimationFrame(actor, 'combat-garrus', frame), true);
    materials.refreshMaterialUniforms(uniforms, actor.body.material, 1, 800, null);
    const [x, y, width, height] = frame.rect, w = atlas.image.width, h = atlas.image.height;
    const expected = new THREE.Matrix3().set(width / w, 0, x / w, 0, height / h, 1 - (y + height) / h, 0, 0, 1);
    uniforms.mapTransform.value.elements.forEach((value, index) => close(value, expected.elements[index], 'real material crop matrix'));
    const uv = new THREE.Vector2(.25, .75).applyMatrix3(uniforms.mapTransform.value);
    close(uv.x, x / w + .25 * width / w, 'mapped U'); close(uv.y, 1 - (y + height) / h + .75 * height / h, 'mapped V');
    observed.push(uv.toArray()); assert.equal(uniforms.map.value, map);
    assert.equal(map.version, versions.texture); assert.equal(map.source.version, versions.source); assert.equal(sibling.version, versions.sibling);
  }
  assert.notDeepEqual(observed[0], observed[1], 'distinct poses change the actual sampling transform');
  assert.deepEqual(sibling.repeat.toArray(), [.2, .3]); assert.deepEqual(sibling.offset.toArray(), [.4, .5]);
  assert.deepEqual(atlas.repeat.toArray(), [1, 1]); assert.deepEqual(atlas.offset.toArray(), [0, 0]);
});

test('shipped companion metadata matches six real PNG headers and has twenty-four globally distinct pose IDs', () => {
  const ids = [];
  for (const key of IDS) {
    const raw = JSON.parse(readFileSync(new URL(`../public/assets/companion-${key}-animation.json`, import.meta.url))), normalized = normalizeCompanionAnimation(key, raw);
    assert.ok(normalized, `${key}: complete ME1 family`);
    const bytes = readFileSync(new URL(`../public/assets/${normalized.combat.file}`, import.meta.url));
    assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(bytes.readUInt32BE(16), normalized.combat.width); assert.equal(bytes.readUInt32BE(20), normalized.combat.height);
    ids.push(...Object.values(normalized.combat.frames).map(frame => frame.id));
  }
  assert.equal(ids.length, 24); assert.equal(new Set(ids).size, 24);
});
