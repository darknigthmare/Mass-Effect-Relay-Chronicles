// Native WorldView.setZone, without WebGL submission or image/DOM loading.
// Do not mirror its seed/build/filter order here: call the production method.
import * as THREE from 'three';
import { WorldView } from '../src/world.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { getLevelLayout } from '../src/level-layout-data.js';
import { initialCustomization } from '../src/customization.js';
import { getAssignmentContacts } from '../src/assignments.js';
import { operationPOIs } from '../src/operations.js';
import { getMissionPOIs } from '../src/mission-progress.js';

export function loadCombatGeometry(world, zoneId, state = null) {
  if (state) world.setStoryContext({ ...state, visitedZones: state.story?.visitedZones || [], assignmentContacts: getAssignmentContacts(state) });
  else world.setStoryContext(null);
  world.setZone(zoneId, { party: state?.party || [], cleared: state?.cleared || [] });
  if (state) world.setOperationPOIs([...operationPOIs(state), ...getMissionPOIs(state)]);
  return world;
}

export function createCombatGeometry(zoneId, { geometry = true, state = null } = {}) {
  const world = Object.create(WorldView.prototype);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0);
  Object.assign(world, { zoneId, zone: geometry ? null : WORLD_ZONES[zoneId], levelLayout: getLevelLayout(zoneId), player: { ...WORLD_ZONES[zoneId].spawn },
    mode: 'explore', time: 0, keys: new Set(), trail: [], commanderAppearance: 'male', commanderCustomization: initialCustomization(), storyContext: null,
    scene, stage: new THREE.Group(), characters: new THREE.Group(), particles: new THREE.Group(), markers: new THREE.Group(), actors: [], ambientActors: [], battleActors: new Map(),
    spriteCache: new Map(), textureCache: new Map(), materialCache: new Map(), customizationTextures: new Map(), characterAnimations: {}, colliders: [], effects: [], animations: [],
    // Dimensions/pixels are explicit image-loading substitutes, not visual proof.
    // Keep native _vehicleSprite: its static Mako really adds a circle collider.
    atlases: Object.fromEntries(['crew', 'enemy', 'boss', 'npc', 'props', 'vehicles'].map(key => [key, new THREE.Texture({ width: 1600, height: 1200 })])),
    assetErrors: [], operationPois: [], poiViews: [], combatOccluders: [], cleared: new Set(), camera: new THREE.OrthographicCamera(-24, 24, 15, -15, .1, 500),
    cameraOffset: new THREE.Vector3(23, 29, 27), cameraTarget: new THREE.Vector3(), _nativeRenderCount: 0,
    renderer: { render() { world._nativeRenderCount++; } },
    getNearby() { return null; },
    _sign() { return new THREE.Group(); }, // DOM/canvas label only; no RNG/collider.
    _makeMarkers() { this.poiViews = []; }, // DOM markers only; no RNG/collider.
    resize() {}, // No real canvas or display surface in this native fixture.
  });
  world.scene.add(world.stage, world.characters, world.particles, world.markers);
  // These two CanvasTexture generators use their own private material seeds,
  // never world.rand, and create neither geometry nor collision footprints.
  world._texturedMaterial = color => world._material(color);
  world._edenTerrainMaterial = (kind, color) => world._material(color || 0x556655);
  if (geometry) loadCombatGeometry(world, zoneId, state);
  else { world._walkable = () => true; world._resetTrail(); }
  return world;
}
