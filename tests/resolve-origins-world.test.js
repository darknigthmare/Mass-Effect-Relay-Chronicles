import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { WorldView } from '../src/world.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { getLevelLayout } from '../src/level-layout-data.js';
import { buildFrontierScene } from '../src/frontier-scene.js';
import { RESOLVE_ORIGIN_CONTACTS } from '../src/resolve-origins-data.js';
import { getResolveOriginContacts } from '../src/resolve-origins.js';
import { listResolveCitadelPOIs, createResolveCitadelState } from '../src/resolve-citadel.js';
import { listResolveNoveriaPOIs, createResolveNoveriaState } from '../src/resolve-noveria.js';
import { RESOLVE_VIRMIRE_POIS } from '../src/resolve-virmire.js';
import { newGame } from '../src/state.js';

function worldFor(zoneId, context) {
  const world = Object.create(WorldView.prototype), zone = WORLD_ZONES[zoneId]; let seed = 2183;
  Object.assign(world, { storyContext: null, commanderAppearance: 'male', actors: [], ambientActors: [], party: ['shepard'],
    battleActors: new Map(), characters: new THREE.Group(), stage: new THREE.Group(), particles: new THREE.Group(), scene: new THREE.Scene(),
    materialCache: new Map(), spriteCache: new Map(), textureCache: new Map(), animations: [], effects: [], colliders: [], combatOccluders: [],
    atlases: { crew: new THREE.Texture({ width: 400, height: 200 }), npc: new THREE.Texture({ width: 400, height: 200 }), enemy: new THREE.Texture({ width: 400, height: 200 }), boss: new THREE.Texture({ width: 400, height: 400 }) },
    cleared: new Set(), keys: new Set(), player: { ...zone.spawn }, mode: 'explore', operationPois: [], assetErrors: [], poiViews: [],
    camera: new THREE.OrthographicCamera(-23, 23, 15, -15, .1, 500), cameraOffset: new THREE.Vector3(23, 29, 27), cameraTarget: new THREE.Vector3(),
    rand() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; },
    _makeMarkers() {}, _sign() {}, _propSprite() {}, _vehicleSprite() {},
  });
  world.setStoryContext(context); world.zoneId = zoneId; world.zone = zone; world.levelLayout = getLevelLayout(zoneId);
  world._texturedMaterial = color => world._material(color);
  if (world.levelLayout) buildFrontierScene(world, world.levelLayout);
  else if (zoneId === 'citadel') world._citadel(); else world._normandy();
  world._resetTrail(); return world;
}
const mapOrigins = contacts => contacts.map(contact => ({ ...contact, id: `${contact.zone}:resolve-${contact.id}`, resolveOriginContactId: contact.id }));
const base = zone => ({ ...newGame(), zone, completed: ['eden-prime', 'citadel', 'therum'], flags: { briefed: true, spectre: true },
  recruited: ['kaidan', 'ashley', 'tali'], lost: [], story: { visitedZones: ['normandy', 'eden-prime', 'citadel', 'therum'] } });

test('every Resolve anchor has a continuous route around actual retained scenery without clearing collisions', () => {
  const origins = Object.values(RESOLVE_ORIGIN_CONTACTS), noveria = new Map(), state = base('noveria');
  for (const p of [createResolveNoveriaState(), { ...createResolveNoveriaState(), anoleisAsked: true, lorikContract: true },
    { ...createResolveNoveriaState(), opold: 'accepted' },
    { ...createResolveNoveriaState(), anoleisAsked: true, lorikContract: true, evidence: 'held', gianna: 'dead', anoleis: 'dead' }]) {
    state.resolveNoveria = p; for (const point of listResolveNoveriaPOIs(state)) noveria.set(point.id, point);
  }
  state.resolveNoveria = { ...createResolveNoveriaState(), pass: 'opold', opold: 'reported' };
  state.cleared = ['noveria:encounter-1', 'noveria:encounter-2', 'noveria:boss'];
  state.missionProgress = { records: { noveria: { steps: ['memory', 'power', 'uplink'] } } };
  for (const point of listResolveNoveriaPOIs(state)) noveria.set(point.id, point);
  assert.equal(noveria.size, 9, 'All nine independently gated Novéria anchors were collected');
  const citadel = { ...base('citadel'), completed: ['eden-prime'], recruited: ['kaidan', 'ashley'], resolveCitadel: { ...createResolveCitadelState(), hearing: true,
    clinic: true, michel: true, battles: { clinic: true, fist: true, ambush: true }, fist: 'spared', fistWrex: false, rescue: true } };
  const points = [
    ...mapOrigins(origins), ...listResolveCitadelPOIs(citadel).map(point => ({ ...point, zone: 'citadel' })),
    ...noveria.values(), ...Object.entries(RESOLVE_VIRMIRE_POIS).map(([id, point]) => ({ ...point, id: `resolve:virmire:${id}`, zone: 'virmire', resolveVirmire: true })),
  ];
  // Finch's later interruption has a second, physically distinct anchor.
  points.push(...mapOrigins(getResolveOriginContacts({ ...base('citadel'), origin: 'earthborn', resolveOrigins: { version: 1, records: { 'old-friends': { stage: 'confrontation', outcome: null } } } })).filter(point => point.resolveOriginContactId === 'origin-finch').map(point => ({ ...point, id: `${point.id}-interruption` })));
  assert.equal(points.length, 30);
  for (const zoneId of ['citadel', 'normandy', 'noveria', 'virmire']) {
    const world = worldFor(zoneId, { ...base(zoneId), resolveContacts: points });
    const collisions = structuredClone(world.colliders), received = []; world.onInteract = point => received.push(point);
    for (const point of world.getResolvePOIs()) {
      // Living Anoleis and the later corpse are mutually exclusive in play.
      // Exercise each marker with the other alias at that same anchor absent.
      const contacts = points.filter(other => other.id === point.id || other.zone !== point.zone || Math.hypot(other.x - point.x, other.z - point.z) > .01);
      world.setStoryContext({ ...base(zoneId), resolveContacts: contacts });
      world.setPosition(WORLD_ZONES[zoneId].spawn);
      assert.equal(world._walkable(point.x, point.z), true, `${point.id}: walkable authored contact`);
      if (point.actorPosition) assert.equal(world._walkable(point.actorPosition.x, point.actorPosition.z), true, `${point.id}: body stands outside scenery`);
      const path = world._pathTo(point); assert.ok(path?.length, `${point.id}: connected to arrival`);
      assert.ok(path.every(step => world._walkable(step.x, step.z)), `${point.id}: route stays navigable`);
      world.setPosition(point); world.pendingPOI = point; assert.equal(world.interact()?.id, point.id);
      assert.equal(received.at(-1).id, point.id);
    }
    assert.deepEqual(world.colliders, collisions, 'No scenery collision was removed to admit a new point');
  }
});

test('Novéria replaces duplicate dialogue markers, preserves living bodies and removes dead or arrested contacts', () => {
  const state = base('noveria'); state.resolveNoveria = { ...createResolveNoveriaState(), anoleisAsked: true };
  const sync = world => world.setStoryContext({ ...state, resolveContacts: listResolveNoveriaPOIs(state) });
  const world = worldFor('noveria', { ...state, resolveContacts: listResolveNoveriaPOIs(state) }); world._makeAmbientCharacters();
  assert.ok(world.ambientActors.some(actor => actor.conversationId === 'anoleis'));
  assert.ok(!world.getConversationPOIs().some(point => ['anoleis', 'parasini', 'lorik'].includes(point.conversationId)));
  const oldPoint = world.getResolvePOIs().find(point => point.id === 'resolve:noveria:anoleis');
  world.pendingPOI = oldPoint; world.targetPath = [{ x: oldPoint.x, z: oldPoint.z }];
  state.resolveNoveria = { ...state.resolveNoveria, lorikContract: true, evidence: 'held', gianna: 'dead', anoleis: 'dead' }; sync(world);
  assert.equal(world.pendingPOI, null); assert.equal(world.targetPath, null);
  assert.ok(world.getResolvePOIs().some(point => point.id === 'resolve:noveria:corpse'));
  assert.ok(!world.ambientActors.some(actor => ['anoleis', 'parasini'].includes(actor.conversationId)));
  assert.ok(!world.getConversationPOIs({ includeResolveReplaced: true }).some(point => ['anoleis', 'parasini'].includes(point.conversationId)));
  state.paragon = 20; state.resolveNoveria = { ...state.resolveNoveria, evidence: 'gianna', gianna: 'arrested-anoleis', anoleis: 'arrested', lorikTestimony: 'charmed', pass: 'gianna' }; sync(world);
  assert.ok(!world.ambientActors.some(actor => ['anoleis', 'parasini'].includes(actor.conversationId)));
  world.setMode('menu'); world.setMode('explore');
  assert.ok(!world.ambientActors.some(actor => ['anoleis', 'parasini'].includes(actor.conversationId)), 'Changing modes cannot resurrect a removed contact');
});

test('origin bodies follow their named contacts, disappear after sedation, and cannot leak into another work', () => {
  const state = { ...base('citadel'), origin: 'colonist', resolveOrigins: { version: 1, records: { 'i-remember-me': { stage: 'talk', outcome: null } } } };
  const source = mapOrigins(getResolveOriginContacts(state)), world = worldFor('citadel', { ...state, resolveContacts: source }); world._makeAmbientCharacters();
  for (const contact of source) {
    const actor = world.ambientActors.find(item => item.resolveContactId === contact.id); assert.ok(actor);
    assert.equal(actor.group.userData.presentation, 'reused-body-prototype');
    assert.equal(actor.group.position.x, contact.actorPosition.x); assert.equal(actor.group.position.z, contact.actorPosition.z);
  }
  const talitha = source.find(point => point.resolveOriginContactId === 'origin-talitha');
  world.pendingPOI = talitha; world.targetPath = [{ x: talitha.x, z: talitha.z }];
  state.resolveOrigins.records['i-remember-me'] = { stage: 'report', outcome: 'self-sedated' };
  world.setStoryContext({ ...state, resolveContacts: mapOrigins(getResolveOriginContacts(state)) });
  assert.equal(world.pendingPOI, null); assert.ok(!world.ambientActors.some(actor => actor.resolveContactId === talitha.id));
  world.setStoryContext({ ...state, mediaId: 'ME2', periodId: 'me2', resolveContacts: source });
  assert.deepEqual(world.getResolvePOIs(), []); assert.ok(!world.ambientActors.some(actor => actor.resolveContactId));
});

test('unknown combat aliases select distinct human, turian and salarian procedural textures instead of geth atlas zero', () => {
  const oldDocument = globalThis.document, canvases = [];
  globalThis.document = { createElement() {
    const commands = [], ctx = new Proxy({}, { set(target, key, value) { commands.push([key, value]); target[key] = value; return true; },
      get(target, key) { return key in target ? target[key] : (...args) => commands.push([key, ...args]); } });
    const canvas = { getContext: () => ctx, commands }; canvases.push(canvas); return canvas;
  } };
  try {
    const world = Object.create(WorldView.prototype); world.spriteCache = new Map(); world.atlases = { enemy: new THREE.Texture({ width: 400, height: 200 }) };
    const human = world._spriteTexture('resolve-thug', true), turian = world._spriteTexture('resolve-turian-assassin', true), salarian = world._spriteTexture('resolve-salarian-assassin', true);
    for (const texture of [human, turian, salarian]) { assert.equal(texture.isCanvasTexture, true); assert.notEqual(texture.image, world.atlases.enemy.image); }
    assert.notDeepEqual(turian.image.commands, human.image.commands); assert.notDeepEqual(salarian.image.commands, human.image.commands);
    assert.notDeepEqual(salarian.image.commands, turian.image.commands);
    assert.equal(world._spriteTexture('resolve-thug', true), human, 'Texture reuse does not regenerate each frame');
    assert.equal(world._spriteTexture('resolve-fist', true).isCanvasTexture, true);
    assert.equal(world._spriteTexture('resolve-assassin', true).isCanvasTexture, true);
  } finally { if (oldDocument === undefined) delete globalThis.document; else globalThis.document = oldDocument; }
});
