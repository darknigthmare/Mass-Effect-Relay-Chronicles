import { getTacticalPosition } from './tactical-positions.js';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { WORLD_ZONES, getWorldArrival } from './world-data.js';
import { mapCollisionFootprints } from './advance-travel.js';
import { FEROS_COLONIST_TARGETS, normalizeAdvanceFerosState, advanceFerosCivilianAlive } from './advance-feros.js';
import { ENCOUNTERS, ENEMIES } from './game-data.js';
import { initialCustomization, normalizeCustomization } from './customization.js';
import { hasVisualCustomization, renderCustomizationSprite } from './customization-render.js';
import { COMPANION_ANIMATION_IDS, normalizeCompanionAnimation, canShowCompanionAnimation } from './companion-animation-data.js';
import { ENEMY_ANIMATION_IDS, normalizeEnemyAnimation, canShowEnemyAnimation } from './enemy-animation-data.js';
import { normalizeJokerSeated, canShowJokerSeated } from './joker-seated-data.js';
import { getLevelLayout, isLevelGround, nearestLevelGround } from './level-layout-data.js';
import { findLevelPath } from './world-navigation.js';
import { geometricCover, findRetreatPoint } from './completion-world.js';
import { sampleWalkableHeight } from './continuation-world-ground.js';
import { buildEdenScene } from './eden-scene.js';
import { buildFrontierScene } from './frontier-scene.js';
import { buildHorizonScene } from './horizon-scene.js';
import { FRONTIER_NPCS, getFrontierNPC, frontierNPCVisible, normalizeFrontierNPCAtlas, getFrontierNPCFrame } from './frontier-characters.js';
import { FRONTIER_ENEMY_IDS, normalizeFrontierEnemyAtlas, getFrontierEnemyVisual, getFrontierAmbientVisual } from './frontier-enemies.js';
import { HORIZON_ENEMY_IDS, HORIZON_ENEMY_HEIGHTS, normalizeHorizonEnemyAtlas, getHorizonEnemyVisual, getHorizonAmbientVisual } from './horizon-enemies.js';
import { getHorizonNPC, horizonNPCVisible, normalizeHorizonNPCAtlas, getHorizonNPCFrame } from './horizon-characters.js';
import { HORIZON_FAUNA, normalizeHorizonFaunaAtlas, getHorizonFaunaFrame, getHorizonFaunaCombatVisual, horizonFaunaVisible } from './horizon-fauna.js';
import { HORIZON_FLEET, normalizeHorizonFleetAtlas, getHorizonFleetFrame, canShowHorizonFleet } from './horizon-fleet.js';
import { BOSS_ANIMATION_IDS, normalizeBossAnimation, canShowBossAnimation } from './boss-animation-data.js';
import { createMakoState, boardMako, stepMako, dismountMako, makoDirectionFrame, normalizeMakoDirections } from './frontier-vehicles.js';

const GUARDED_COMBAT_ANIMATION_IDS = [...COMPANION_ANIMATION_IDS, ...ENEMY_ANIMATION_IDS, ...BOSS_ANIMATION_IDS];

const CREW_KEYS = ['shepard', 'ashley', 'kaidan', 'jenkins', 'garrus', 'tali', 'wrex', 'liara'];
const ENEMY_KEYS = ['geth', 'husk', 'geth-sniper', 'geth-destroyer', 'krogan', 'rachni', 'creeper', 'asari'];
const BOSS_KEYS = ['saren', 'benezia', 'thorian', 'saren-final'];
const NPC_KEYS = ['femshep', 'anderson', 'joker', 'chakwas', 'nihlus', 'udina', 'kirrahe', 'emily'];
const CITADEL_RECRUITS = { 'citadel:encounter-1': 'garrus', 'citadel:encounter-2': 'tali', 'citadel:boss': 'wrex' };
// Abstract ATB readability cues; these do not replace the weapons drawn in the
// character atlases or reproduce original firing animations, spread or range.
const WEAPON_TRACE_STYLES = {
  pistol: { count: 1, burstExtra: 1, radius: .035, duration: .13, spread: .06, color: 0xffdfaf },
  assault: { count: 3, burstExtra: 2, radius: .024, duration: .11, spread: .13, color: 0xffc376 },
  shotgun: { count: 5, burstExtra: 2, radius: .024, duration: .12, spread: .7, color: 0xffb577 },
  sniper: { count: 1, burstExtra: 0, radius: .012, duration: .22, spread: 0, color: 0xe2f3ff },
};
const ASSET_BASE = `${import.meta.env?.BASE_URL || './'}assets/`;
const COLORS = { operation: 0xc09be9, dialogue: 0x91e4dc, terminal: 0x5faee6, encounter: 0xf06d53, objective: 0xf1c775, exit: 0x9db5ce };
const TAU = Math.PI * 2;
const clamp = THREE.MathUtils.clamp;
const V3 = () => new THREE.Vector3();

function hash(text) { let n = 2166136261; for (const c of text) n = Math.imul(n ^ c.charCodeAt(0), 16777619); return n >>> 0; }
function randomGenerator(seed) { let state = seed || 1; return () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; }; }
function disposeObject(group, materials = true) {
  const geometries = new Set(), mats = new Set();
  group.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) for (const m of [].concat(o.material)) mats.add(m); });
  for (const geometry of geometries) geometry.dispose();
  if (materials) for (const material of mats) { if (material.userData.ownedMap) material.map?.dispose(); material.dispose(); }
}

function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4; return texture;
}

function fallbackCharacter(key, enemy = false) {
  return canvasTexture(160, 256, (c, w, h) => {
    const alien = ['garrus', 'wrex', 'krogan', 'geth', 'geth-sniper', 'geth-destroyer'].includes(key);
    const krogan = ['wrex', 'krogan'].includes(key);
    const tone = enemy ? '#524f4c' : key === 'tali' ? '#6d5885' : key === 'liara' ? '#a7b4bc' : key === 'garrus' ? '#426475' : '#3e505c';
    const headColor = key === 'liara' ? '#70acbd' : key === 'garrus' ? '#8696a0' : krogan ? '#afa68b' : key === 'tali' || key.includes('geth') ? '#202c37' : '#c8a596';
    c.shadowColor = '#070c12'; c.shadowBlur = 5;
    c.fillStyle = '#14202a'; c.beginPath(); c.roundRect(47, 142, 28, 98, 10); c.fill(); c.beginPath(); c.roundRect(85, 142, 28, 98, 10); c.fill();
    c.fillStyle = tone; c.beginPath(); c.moveTo(krogan ? 30 : 45, 72); c.lineTo(krogan ? 130 : 115, 72); c.lineTo(119, 154); c.lineTo(41, 154); c.closePath(); c.fill();
    c.fillStyle = '#9aa8ad'; c.fillRect(52, 94, 23, 5); c.fillRect(86, 94, 23, 5);
    c.fillStyle = tone; c.beginPath(); c.roundRect(26, 78, 24, 80, 12); c.fill(); c.beginPath(); c.roundRect(109, 78, 24, 80, 12); c.fill();
    c.fillStyle = headColor; c.beginPath(); c.ellipse(80, 48, alien ? 25 : 19, alien ? 27 : 24, 0, 0, TAU); c.fill();
    if (key.includes('geth')) { c.fillStyle = '#f5b07d'; c.fillRect(75, 41, 11, 5); }
    if (key === 'tali') { c.fillStyle = '#b8b9e0'; c.fillRect(66, 43, 28, 5); }
    c.fillStyle = '#b7dce5'; c.fillRect(57, 122, 46, 3);
    c.fillStyle = '#1a242d'; c.beginPath(); c.roundRect(100, 126, 45, 12, 3); c.fill();
    if (key === 'shepard') { c.fillStyle = '#bd4f46'; c.fillRect(110, 80, 7, 28); c.fillStyle = '#f5f4ef'; c.font = 'bold 13px sans-serif'; c.fillText('N7', 51, 116); }
    c.fillStyle = '#0a141d'; c.fillRect(43, 229, 33, 16); c.fillRect(85, 229, 33, 16);
  });
}

/** A genuine navigable Three.js world. Narrative and combat rules are owned by the application. */
export class WorldView {
  constructor(container, { onInteract, onMove, onEncounter } = {}) {
    if (!container) throw new Error('WorldView needs a container.');
    this.container = container; this.onInteract = onInteract; this.onMove = onMove; this.onEncounter = onEncounter;
    this.mode = 'menu'; this.time = 0; this.keys = new Set(); this.party = ['shepard', 'kaidan', 'jenkins']; this.commanderAppearance = 'male'; this.commanderCustomization = initialCustomization(); this.customizationTextures = new Map(); this.storyContext = null;
    this.player = { x: 0, z: 11 }; this.cleared = new Set(); this.colliders = []; this.animations = []; this.effects = [];
    this.actors = []; this.battleActors = new Map(); this.trail = []; this.spriteCache = new Map(); this.atlases = {}; this.characterAnimations = {}; this.assetErrors = []; this.operationPois = [];
    this.textureCache = new Map(); this.materialCache = new Map(); this._moveReport = 0; this._disposed = false;
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x07111d);
    this.camera = new THREE.OrthographicCamera(-20, 20, 15, -15, 0.1, 500);
    this.cameraTarget = new THREE.Vector3(0, 0, 0); this.cameraOffset = new THREE.Vector3(23, 29, 27);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15; this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.className = 'world-canvas';
    Object.assign(this.renderer.domElement.style, { display: 'block', width: '100%', height: '100%', touchAction: 'none', outline: 'none' });
    this.container.appendChild(this.renderer.domElement);
    this.labels = document.createElement('div'); this.labels.className = 'world-labels';
    Object.assign(this.labels.style, { position: 'absolute', inset: '0', overflow: 'hidden', pointerEvents: 'none' });
    this.container.appendChild(this.labels);
    this.stage = new THREE.Group(); this.stage.name = 'world-architecture'; this.scene.add(this.stage);
    this.characters = new THREE.Group(); this.characters.name = 'sprite-characters'; this.scene.add(this.characters);
    this.markers = new THREE.Group(); this.scene.add(this.markers);
    this.particles = new THREE.Group(); this.scene.add(this.particles);
    this.raycaster = new THREE.Raycaster(); this.pointer = new THREE.Vector2(); this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this._keydown = e => {
      if (e.ctrlKey || e.altKey || e.metaKey || /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || '') || e.target?.isContentEditable) return;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyZ', 'KeyQ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
        if (this.mode === 'explore') { this.keys.add(e.code); if (e.code.startsWith('Arrow')) e.preventDefault(); }
      }
    };
    this._keyup = e => this.keys.delete(e.code); this._blur = () => this.keys.clear();
    this._pointerdown = e => this._handlePointer(e);
    window.addEventListener('keydown', this._keydown); window.addEventListener('keyup', this._keyup); window.addEventListener('blur', this._blur);
    this.renderer.domElement.addEventListener('pointerdown', this._pointerdown);
    this.resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => this.resize()) : null;
    this.resizeObserver?.observe(container);
    this._loadAtlas('crew', `${ASSET_BASE}crew-atlas.png`); this._loadAtlas('enemy', `${ASSET_BASE}enemy-atlas.png`);
    this._loadAtlas('boss', `${ASSET_BASE}boss-atlas.png`); this._loadAtlas('props', `${ASSET_BASE}props-atlas.png`);
    this._loadAtlas('npc', `${ASSET_BASE}npc-atlas.png`); this._loadAtlas('vehicles', `${ASSET_BASE}vehicle-atlas.png`);
    this.enableWalkAtlas();
    if (typeof __RELAY_FEMSHEP_ANIMATION__ !== 'undefined') this.registerCharacterAnimation('femshep', __RELAY_FEMSHEP_ANIMATION__);
    if (typeof __RELAY_MALESHEP_ANIMATION__ !== 'undefined') this.registerCharacterAnimation('shepard', __RELAY_MALESHEP_ANIMATION__);
    if (typeof __RELAY_COMPANION_ANIMATIONS__ !== 'undefined') for (const config of __RELAY_COMPANION_ANIMATIONS__)
      this.registerCharacterAnimation(config.characterId, config);
    if (typeof __RELAY_ENEMY_ANIMATIONS__ !== 'undefined') for (const config of __RELAY_ENEMY_ANIMATIONS__)
      this.registerCharacterAnimation(config.characterId, config);
    if (typeof __RELAY_JOKER_SEATED__ !== 'undefined') this.registerJokerSeated(__RELAY_JOKER_SEATED__);
    if (typeof __RELAY_BOSS_ANIMATIONS__ !== 'undefined') for (const config of Object.values(__RELAY_BOSS_ANIMATIONS__))
      this.registerCharacterAnimation(config.characterId, config);
    if (typeof __RELAY_FRONTIER_ENEMY_ATLAS__ !== 'undefined') this.registerFrontierEnemyAtlas(__RELAY_FRONTIER_ENEMY_ATLAS__);
    if (typeof __RELAY_FRONTIER_NPC_ATLAS__ !== 'undefined') this.registerFrontierNPCAtlas(__RELAY_FRONTIER_NPC_ATLAS__);
    if (typeof __RELAY_MAKO_DIRECTIONS__ !== 'undefined') this.registerMakoDirections(__RELAY_MAKO_DIRECTIONS__);
    if (typeof __RELAY_HORIZON_NPC_ATLAS__ !== 'undefined') this.registerHorizonNPCAtlas(__RELAY_HORIZON_NPC_ATLAS__);
    if (typeof __RELAY_HORIZON_ENEMY_ATLAS__ !== 'undefined') this.registerHorizonEnemyAtlas(__RELAY_HORIZON_ENEMY_ATLAS__);
    if (typeof __RELAY_HORIZON_FAUNA_ATLAS__ !== 'undefined') this.registerHorizonFaunaAtlas(__RELAY_HORIZON_FAUNA_ATLAS__);
    if (typeof __RELAY_HORIZON_FLEET_ATLASES__ !== 'undefined') this.registerHorizonFleetAtlas('me1',__RELAY_HORIZON_FLEET_ATLASES__.me1);
    this.setZone('normandy'); this.resize();
  }

  _loadAtlas(name, url) {
    if (this._disposed) return false;
    const requests = this._atlasRequests ||= new Map(), urls = this._atlasUrls ||= new Map();
    if (requests.get(name)?.url === url || urls.get(name) === url && this.atlases[name]) return false;
    const request = { url }; requests.set(name, request);
    const failed = () => {
      if (this._disposed || requests.get(name) !== request) return;
      requests.delete(name); this.assetErrors?.push(`Asset indisponible : ${url}`);
    };
    try { new THREE.TextureLoader().load(url, texture => {
      if (this._disposed || requests.get(name) !== request) { texture.dispose(); return; }
      requests.delete(name);
      const key = name.startsWith('combat-') ? name.slice(7) : null;
      const config = GUARDED_COMBAT_ANIMATION_IDS.includes(key) ? this.characterAnimations?.[key]?.combat
        : name === 'seated-joker' ? this.jokerSeatedConfig : name === 'frontier-enemies' ? this.frontierEnemyConfig : name === 'mako-directions' ? this.makoDirectionsConfig : name === 'frontier-npcs' ? this.frontierNPCConfig : this._horizonAtlasConfig(name);
      if (config && (texture.image?.width !== config.width || texture.image?.height !== config.height)) {
        texture.dispose(); this.assetErrors?.push(`Dimensions d’animation incompatibles : ${url}`); return;
      }
      texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; texture.magFilter = THREE.LinearFilter;
      const previous = this.atlases[name]; this.atlases[name] = texture; urls.set(name, url);
      for (const [key, tex] of this.spriteCache) if (key.startsWith(`${name}:`)) { tex.dispose(); this.spriteCache.delete(key); }
      if (previous && previous !== texture) previous.dispose();
      // A new combat family must never reset an unrelated actor or customized
      // Shepard to a base texture. The next update selects its current pose.
      if (!name.startsWith('combat-') && !name.startsWith('motion-') && name !== 'walk') this.characters.traverse(o => {
        if (o.userData.characterKey && o.material && this._spriteAtlasName(o.userData.characterKey, o.userData.enemy) === name)
          o.material.map = this._spriteTexture(o.userData.characterKey, o.userData.enemy);
      });
      if (name === 'props') { for (const args of this._pendingProps || []) this._propSprite(...args); this._pendingProps = []; }
      if (name === 'mako-directions') this._syncMakoSprite();
      if (name === 'vehicles') { for (const args of this._pendingVehicles || []) this._vehicleSprite(...args); this._pendingVehicles = []; }
      if (name === 'horizon-fleet-me1') this._syncHorizonFleet();
    }, undefined, failed); } catch { failed(); return false; }
    return true;
  }

  _spriteAtlasName(key, enemy = false) {
    return NPC_KEYS.includes(key) ? 'npc' : enemy && BOSS_KEYS.includes(key) ? 'boss' : enemy ? 'enemy' : 'crew';
  }

  _spriteTexture(key = 'shepard', enemy = false) {
    const name = this._spriteAtlasName(key, enemy), cacheKey = `${name}:${key}`;
    if (FRONTIER_ENEMY_IDS.includes(key) || getFrontierNPC(key)?.visual.atlas || HORIZON_ENEMY_IDS.includes(key) || getHorizonNPC(key)
      || ['varren','alpha-varren','gasbag-me1'].includes(key)) return this._neutralSpriteTexture();
    if (this.spriteCache.has(cacheKey)) return this.spriteCache.get(cacheKey);
    let texture;
    if (this.atlases[name]) {
      const keys = name === 'boss' ? BOSS_KEYS : name === 'npc' ? NPC_KEYS : enemy ? ENEMY_KEYS : CREW_KEYS; const index = Math.max(0, keys.indexOf(key));
      const columns = name === 'boss' ? 2 : 4;
      texture = this.atlases[name].clone(); texture.repeat.set(1 / columns, .5);
      texture.offset.set((index % columns) / columns, .5 - Math.floor(index / columns) * .5); texture.needsUpdate = true;
    } else texture = fallbackCharacter(key, enemy);
    this.spriteCache.set(cacheKey, texture); return texture;
  }

  _neutralSpriteTexture() {
    if(!this._neutralBodyTexture){this._neutralBodyTexture=new THREE.DataTexture(new Uint8Array([0,0,0,0]),1,1);this._neutralBodyTexture.needsUpdate=true;}
    return this._neutralBodyTexture;
  }

  _material(color, roughness = 0.7, metalness = 0.15, emissive = null) {
    const key = `${color}-${roughness}-${metalness}-${emissive}`;
    if (!this.materialCache.has(key)) this.materialCache.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness, ...(emissive ? { emissive, emissiveIntensity: 1.6 } : {}) }));
    return this.materialCache.get(key);
  }

  _propSprite(index, x, z, height = 1.7, y = 0) {
    if (!this.atlases.props) { (this._pendingProps ||= []).push([index, x, z, height, y]); return; }
    const key = `props:${index}`;
    // The generator and low cover extend slightly outside the generated regular grid.
    // Tight source rectangles avoid borrowing foliage or orange screens from the next row.
    const crops = { 3: [1144, 4, 368, 229], 6: [786, 252, 338, 226] };
    const source = this.atlases.props.image;
    const rect = crops[index] || [(index % 4) * source.width / 4, Math.floor(index / 4) * source.height / 4, source.width / 4, source.height / 4];
    if (!this.spriteCache.has(key)) {
      const texture = this.atlases.props.clone(); texture.repeat.set(rect[2] / source.width, rect[3] / source.height); texture.offset.set(rect[0] / source.width, 1 - (rect[1] + rect[3]) / source.height); texture.needsUpdate = true; this.spriteCache.set(key, texture);
    }
    const material = new THREE.MeshBasicMaterial({ map: this.spriteCache.get(key), transparent: true, alphaTest: .2, depthWrite: true, side: THREE.DoubleSide, toneMapped: false });
    const mesh = this._mesh(new THREE.PlaneGeometry(height * rect[2] / rect[3], height), material, x, height / 2 + .03 + y, z);
    mesh.rotation.y = Math.atan2(this.cameraOffset.x, this.cameraOffset.z); mesh.castShadow = false; mesh.userData.keep = true;
    const shadow = this._mesh(new THREE.CircleGeometry(height * .38, 24), new THREE.MeshBasicMaterial({ color: 0x071218, transparent: true, opacity: .18, depthWrite: false }), x, .04, z);
    shadow.rotation.x = -Math.PI / 2; shadow.scale.y = .65; shadow.castShadow = false;
  }

  _dressScene() {
    if (this.levelLayout) return;
    const placements = {
      normandy: [[1, 5.7, -1.5, 1.65], [4, -5.5, 7.7, 2.5], [2, 5.7, 11.7, .9], [7, -5.4, -1.9, 1.6]],
      eden: [[0, -8, 4.5, 1.25], [12, -6.5, 9, 2.2], [6, 7.8, 10.8, 1.8], [3, 6.7, 4.4, 1.35]],
      citadel: [[11, -8.2, 2.6, 2.2], [10, 7.5, 12, 1.55], [8, -7.6, 10.5, 1.15], [9, 8, -15, 2.7]],
      therum: [[6, -9, 9.8, 1.9], [0, -8.3, 4.8, 1.2], [3, 7.5, 4.6, 1.35]],
      feros: [[13, 7.8, 4.2, 2.2], [0, -8.3, 4.8, 1.2], [1, -7.8, -9, 1.7], [12, -7, 13, 1.65]],
      noveria: [[14, -8.7, 10.5, 1.8], [1, -8.2, 4, 1.65], [3, 7.5, 5, 1.35], [14, 8.7, -15.5, 1.55]],
      virmire: [[9, 8.5, 9.5, 2.5], [6, 8.7, -7, 1.8], [0, -8.3, 4.8, 1.2], [3, -7.2, -9, 1.35]],
      ilos: [[15, -2.5, -16.5, 1.95], [13, 7.8, 4.8, 2.4], [13, -7.5, -10, 1.7]],
      finale: [[3, 6.8, 7.5, 1.4], [13, -7.5, 9.5, 1.8], [2, -8.3, 4.5, 1.0]],
    };
    for (const args of placements[this.zone.theme] || []) this._propSprite(...args);
    if (this.zoneId === 'therum') this._vehicleSprite('mako', -7.2, 16, 3.4);
    if (this.zoneId === 'ilos') this._vehicleSprite('mako', -6.8, 15.8, 3.4);
  }

  _vehicleSprite(key, x, z, height = 3.4, elevation = 0) {
    if (!this.atlases.vehicles) { (this._pendingVehicles ||= []).push([key, x, z, height, elevation]); return; }
    // The supplied sheet is intentionally not an even grid: Sovereign starts above its lower half.
    const rectangles = { mako: [650, 90, 662, 400], sovereign: [650, 480, 662, 719] };
    const rect = rectangles[key]; if (!rect) return;
    const image = this.atlases.vehicles.image, cacheKey = `vehicles:${key}`;
    if (!this.spriteCache.has(cacheKey)) {
      const texture = this.atlases.vehicles.clone();
      texture.repeat.set(rect[2] / image.width, rect[3] / image.height);
      texture.offset.set(rect[0] / image.width, 1 - (rect[1] + rect[3]) / image.height); texture.needsUpdate = true;
      this.spriteCache.set(cacheKey, texture);
    }
    const width = height * rect[2] / rect[3];
    let geometry;
    if (key === 'mako') {
      // Omit the lower-left empty triangle so the adjacent Normandy's nose cannot bleed into the Mako.
      const uv = [[0, 1], [1, 1], [1, 0], [.12, 0], [0, .25]], positions = uv.flatMap(([u, v]) => [(u - .5) * width, (v - .5) * height, 0]);
      geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv.flat(), 2)); geometry.setIndex([0, 2, 1, 0, 3, 2, 0, 4, 3]); geometry.computeVertexNormals();
    } else geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({ map: this.spriteCache.get(cacheKey), transparent: true, alphaTest: .2, depthWrite: true, side: THREE.DoubleSide, toneMapped: false });
    const mesh = this._mesh(geometry, material, x, elevation + height / 2 + .03, z); mesh.rotation.y = Math.atan2(this.cameraOffset.x, this.cameraOffset.z); mesh.castShadow = false; mesh.userData.keep = true;
    if (key === 'mako') {
      const shadow = this._mesh(new THREE.CircleGeometry(2.2, 32), new THREE.MeshBasicMaterial({ color: 0x061016, transparent: true, opacity: .25, depthWrite: false }), x, .045, z);
      shadow.rotation.x = -Math.PI / 2; shadow.scale.y = .58; shadow.castShadow = false; this._circleCollider(x, z, 2.2);
    }
  }

  /** Enable only after visual review of the four-direction, four-frame Shepard sheet. */
  enableWalkAtlas(url = `${ASSET_BASE}shepard-walk-atlas.png`, {
    directions = ['front', 'back', 'right', 'left'], fps = 8,
    columns = [45, 345, 645, 945], rowBounds = [[0, 315], [315, 621], [621, 920], [920, 1240]], cellWidth = 300,
  } = {}) {
    this.walkConfig = { directions, fps, columns, rowBounds, cellWidth }; this._loadAtlas('walk', url);
  }

  _walkingTexture(actor, dx, dz) {
    const key = `walk:${actor.id}`;
    if (!this.spriteCache.has(key)) { const texture = this.atlases.walk.clone(); texture.needsUpdate = true; this.spriteCache.set(key, texture); }
    const texture = this.spriteCache.get(key), side = new THREE.Vector2(this.cameraOffset.z, -this.cameraOffset.x).normalize(), forward = new THREE.Vector2(-this.cameraOffset.x, -this.cameraOffset.z).normalize();
    const horizontal = dx * side.x + dz * side.y, vertical = dx * forward.x + dz * forward.y;
    const direction = Math.abs(horizontal) > Math.abs(vertical) ? horizontal > 0 ? 'right' : 'left' : vertical > 0 ? 'back' : 'front';
    actor.walkDirection = direction;
    const row = Math.max(0, this.walkConfig.directions.indexOf(direction));
    const rate = this.walkConfig.fps * (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? 1.4 : 1);
    const frame = Math.floor(this.time * rate) % this.walkConfig.columns.length;
    const [top, bottom] = this.walkConfig.rowBounds[row], width = this.walkConfig.cellWidth - 2, height = bottom - top - 2;
    const image = this.atlases.walk.image;
    texture.repeat.set(width / image.width, height / image.height);
    texture.offset.set((this.walkConfig.columns[frame] + 1) / image.width, 1 - (bottom - 1) / image.height);
    actor.walkAspect = width / height; return texture;
  }

  // Metadata is bundled by Vite, so Electron loadFile needs no file:// fetch.
  registerCharacterAnimation(key, config) {
    if (this._disposed) return false;
    if (GUARDED_COMBAT_ANIMATION_IDS.includes(key)) {
      config = BOSS_ANIMATION_IDS.includes(key) ? normalizeBossAnimation(key, config) : ENEMY_ANIMATION_IDS.includes(key) ? normalizeEnemyAnimation(key, config) : normalizeCompanionAnimation(key, config);
      if (!config) return false;
      if (JSON.stringify(this.characterAnimations[key]) === JSON.stringify(config)) return true;
      for (const [cacheKey, texture] of this.spriteCache) if (cacheKey.startsWith(`combat-${key}:`)) {
        texture.dispose(); this.spriteCache.delete(cacheKey);
      }
    } else if (!['shepard', 'femshep'].includes(key)) return false;
    const hasWalk = Array.isArray(config?.frames) && config.frames.length > 0 && typeof config.file === 'string' && config.file.length > 0;
    const hasCombat = typeof config?.combat?.file === 'string' && config.combat.file.length > 0
      && ['aim', 'power', 'hit', 'down'].some(pose => Array.isArray(config.combat.frames?.[pose]?.rect));
    if (!hasWalk && !hasCombat) return false;
    this.characterAnimations[key] = config;
    // A combat-only family must not replace the masculine exploration atlas.
    if (hasWalk) this._loadAtlas(`motion-${key}`, `${ASSET_BASE}${config.file}`);
    if (hasCombat) this._loadAtlas(`combat-${key}`, `${ASSET_BASE}${config.combat.file}`);
    return true;
  }

  registerFrontierNPCAtlas(input) {
    const config = normalizeFrontierNPCAtlas(input); if (!config || this._disposed) return false;
    this.frontierNPCConfig = config; this._loadAtlas('frontier-npcs', `${ASSET_BASE}${config.file}`); return true;
  }

  _applyFrontierNPCBody(actor) {
    const npc = getFrontierNPC(actor.key);
    const permitted = npc?.visual.atlas && !actor.enemy && actor.id === `npc:${npc.id}` && actor.conversationId === npc.conversationId
      && this.zoneId === npc.zone && frontierNPCVisible({ ...this.storyContext, zone:this.zoneId }, npc);
    const frame = permitted && getFrontierNPCFrame(actor.key,this.frontierNPCConfig);
    if (frame) {
      actor.height = frame.height;
      if (this._applyAnimationFrame(actor,'frontier-npcs',frame)) return true;
    }
    if (npc?.visual.atlas && actor.animationFrame === npc.id) this._fallbackCombatFrame(actor);
    return false;
  }

  registerFrontierEnemyAtlas(input) {
    const config = normalizeFrontierEnemyAtlas(input); if (!config || this._disposed) return false;
    this.frontierEnemyConfig = config; this._loadAtlas('frontier-enemies', `${ASSET_BASE}${config.file}`); return true;
  }

  _applyFrontierEnemyBody(actor) {
    const poi = actor.poiId && this.zone.pois.find(p => p.id === actor.poiId && p.type === 'encounter');
    const suffix = poi?.id.slice(this.zoneId.length + 1), index = ['encounter-1','encounter-2','boss'].indexOf(suffix);
    const firstSprite = ENEMIES[ENCOUNTERS[this.zoneId]?.[index]?.[0]]?.sprite;
    const native = getFrontierEnemyVisual(actor) || getFrontierAmbientVisual(actor,{zoneId:this.zoneId,poi,firstSprite,context:this.storyContext}), config = this.frontierEnemyConfig;
    const frame = native && config?.frames[actor.key];
    if (!frame || !this._applyAnimationFrame(actor, 'frontier-enemies', frame, { cover: actor.alive && actor.state?.cover })) {
      if (actor.animationFrame?.endsWith('-body')) this._fallbackCombatFrame(actor);
      return false;
    }
    actor.body.position.y += frame.hoverHeight || 0;
    // This lot provides one body pose, retaining the existing ATB defeat cue.
    actor.body.rotation.z = actor.alive ? 0 : -.9; return true;
  }

  registerMakoDirections(input) {
    const config = normalizeMakoDirections(input); if (!config || this._disposed) return false;
    this.makoDirectionsConfig = config; this._loadAtlas('mako-directions', `${ASSET_BASE}${config.file}`); return true;
  }

  _horizonAtlasConfig(name) {
    return name==='horizon-npcs'?this.horizonNPCConfig:name==='horizon-enemies'?this.horizonEnemyConfig
      :name==='horizon-fauna'?this.horizonFaunaConfig:name==='horizon-fleet-me1'?this.horizonFleetConfigs?.me1:null;
  }

  _horizonCampaignContext() {
    const s=this.storyContext;if(!s)return null;
    if([s,s.context].filter(Boolean).some(value=>value.mediaId!==undefined&&value.mediaId!=='ME1'||value.periodId!==undefined&&value.periodId!=='me1'))return null;
    return {mediaId:'ME1',periodId:'me1'};
  }

  _horizonPresenceContext() {
    const context=this.storyContext;return {...context,zone:this.zoneId,cleared:[...new Set([...(context?.cleared||[]),...this.cleared])]};
  }

  registerHorizonNPCAtlas(input) {
    const config=normalizeHorizonNPCAtlas(input);if(!config||this._disposed)return false;
    this.horizonNPCConfig=config;this._loadAtlas('horizon-npcs',`${ASSET_BASE}${config.file}`);return true;
  }

  _applyHorizonNPCBody(actor) {
    const npc=getHorizonNPC(actor.key),civilian=actor.advanceFerosCivilian&&actor.id===`civilian:feros:${actor.advanceFerosCivilian}`
      &&FEROS_COLONIST_TARGETS.some(target=>target.id===actor.advanceFerosCivilian&&target.characterKey===actor.key)
      &&this._hasAdvanceFerosCivilians()&&this._advanceFerosCivilianAlive(actor.advanceFerosCivilian),
      permitted=npc&&!actor.enemy&&actor.conversationId===npc.conversationId&&this.zoneId===npc.zone
      &&(civilian||actor.id===`npc:${npc.id}`&&horizonNPCVisible(this._horizonPresenceContext(),npc));
    const frame=permitted&&getHorizonNPCFrame(actor.key,this.horizonNPCConfig);
    if(frame){actor.height=frame.height;if(this._applyAnimationFrame(actor,'horizon-npcs',frame))return true;}
    if(npc&&actor.animationFrame===npc.id)this._fallbackCombatFrame(actor);return false;
  }

  registerHorizonEnemyAtlas(input) {
    const config=normalizeHorizonEnemyAtlas(input);if(!config||this._disposed)return false;
    this.horizonEnemyConfig=config;this._loadAtlas('horizon-enemies',`${ASSET_BASE}${config.file}`);return true;
  }

  _applyHorizonEnemyBody(actor) {
    const poi=actor.poiId&&this.zone.pois.find(p=>p.id===actor.poiId&&p.type==='encounter'),suffix=poi?.id.slice(this.zoneId.length+1),index=['encounter-1','encounter-2','boss'].indexOf(suffix);
    const firstSprite=ENEMIES[ENCOUNTERS[this.zoneId]?.[index]?.[0]]?.sprite;
    const native=getHorizonEnemyVisual(actor)||getHorizonAmbientVisual(actor,{zoneId:this.zoneId,poi,firstSprite,context:this.storyContext});
    const frame=native&&this.horizonEnemyConfig?.frames[actor.key];
    if(frame&&this._applyAnimationFrame(actor,'horizon-enemies',frame,{cover:actor.alive&&actor.state?.cover})){
      actor.body.position.y+=frame.hoverHeight||0;actor.body.rotation.z=actor.alive?0:-.9;return true;
    }
    if(HORIZON_ENEMY_IDS.includes(actor.key)&&actor.animationFrame)this._fallbackCombatFrame(actor);return false;
  }

  registerHorizonFaunaAtlas(input) {
    const config=normalizeHorizonFaunaAtlas(input);if(!config||this._disposed)return false;
    this.horizonFaunaConfig=config;this._loadAtlas('horizon-fauna',`${ASSET_BASE}${config.file}`);return true;
  }

  _applyHorizonFaunaBody(actor) {
    const context=this._horizonCampaignContext(),worldContext=context&&{...context,zoneId:this.zoneId,campaignState:this._horizonPresenceContext()};
    const ambient=worldContext&&actor.faunaId&&actor.id===`fauna:${actor.faunaId}:${actor.faunaIndex}`&&[0,1,2].includes(actor.faunaIndex)
      &&horizonFaunaVisible(actor.faunaId,worldContext);
    const combat=worldContext&&this.zoneId==='feros'&&getHorizonFaunaCombatVisual(actor,this.horizonFaunaConfig);
    const frame=combat||(ambient&&getHorizonFaunaFrame(actor.faunaId,this.horizonFaunaConfig));
    if(frame&&this._applyAnimationFrame(actor,'horizon-fauna',frame)){
      actor.body.position.y+=(frame.hoverHeight||0)+(actor.faunaId==='gasbag-me1'?Math.sin(this.time*1.4+actor.faunaIndex)*.07:0);
      actor.body.rotation.z=actor.alive?0:-.9;return true;
    }
    if(['varren','alpha-varren','gasbag-me1'].includes(actor.key)&&actor.animationFrame)this._fallbackCombatFrame(actor);return false;
  }

  registerHorizonFleetAtlas(familyId,input) {
    if(familyId!=='me1'||this._disposed)return false;const config=normalizeHorizonFleetAtlas(familyId,input);if(!config)return false;
    this.horizonFleetConfigs={...this.horizonFleetConfigs,[familyId]:config};this._loadAtlas(`horizon-fleet-${familyId}`,`${ASSET_BASE}${config.file}`);return true;
  }

  _syncHorizonFleet() {
    if(!this.zone||!this.stage)return;
    this.horizonFleetViews ||= new Map();
    const context=this._horizonCampaignContext(),config=this.horizonFleetConfigs?.me1,atlas=this.atlases?.['horizon-fleet-me1'];
    for(const entry of HORIZON_FLEET.filter(entry=>entry.mediaId==='ME1')){
      const frame=config&&getHorizonFleetFrame(entry.id,{me1:config}),permitted=context&&canShowHorizonFleet(entry.id,context,this.storyContext,this.zoneId)
        &&atlas?.image?.width===config?.width&&atlas?.image?.height===config?.height;
      let view=this.horizonFleetViews.get(entry.id);
      if(permitted&&frame&&!view){
        // These are explicitly local recognition projections. They do not put
        // miniature physical hulls in the Presidium or assert a shared scale.
        const positions={'normandy-sr1':[8,-6,2.8],'geth-dropship':[-9,-5,2.3],'destiny-ascension':[-6.8,-4,3],sovereign:[-6.8,-4,3.8]},[dx,dz,height]=positions[entry.id];
        const citadel=this.zoneId==='citadel'||this.zoneId==='citadel-finale',anchor=citadel?{x:entry.id==='normandy-sr1'?6.8:dx,z:-4}:{x:this.zone.spawn.x+dx,z:this.zone.spawn.z+dz};
        if(this.zoneId==='therum'&&entry.id==='geth-dropship'){anchor.x=this.zone.spawn.x-9;anchor.z=this.zone.spawn.z+7;}
        if(this.zoneId==='citadel-finale'&&entry.id==='sovereign'){anchor.x=-6.5;anchor.z=13;}
        const [x,top,width,depth]=frame.rect,key=`horizon-fleet-me1:${entry.id}`;
        if(!this.spriteCache.has(key)){const texture=atlas.clone();texture.repeat.set(width/config.width,depth/config.height);texture.offset.set(x/config.width,1-(top+depth)/config.height);this.spriteCache.set(key,texture);}
        const material=new THREE.MeshBasicMaterial({map:this.spriteCache.get(key),color:0x6ce5ff,opacity:.58,transparent:true,alphaTest:.04,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
        const mesh=new THREE.Mesh(new THREE.PlaneGeometry(height*width/depth,height),material);mesh.position.set(anchor.x,1.2+height/2,anchor.z);mesh.rotation.y=Math.atan2(this.cameraOffset.x,this.cameraOffset.z);mesh.userData.keep=true;mesh.userData.horizonFleet=entry.id;mesh.userData.presentation='recognition-projection';mesh.name=`horizon-fleet:${entry.id}`;
        const projection=new THREE.Group();projection.name=`horizon-fleet-projector:${entry.id}`;projection.userData.keep=true;projection.userData.caption='Projection de reconnaissance';
        const base=new THREE.Mesh(new THREE.CylinderGeometry(.85,1.05,.28,16),new THREE.MeshStandardMaterial({color:0x263e4c,roughness:.7,metalness:.4}));base.position.set(anchor.x,.14,anchor.z);projection.add(base);
        const halo=new THREE.Mesh(new THREE.TorusGeometry(.78,.06,6,32),new THREE.MeshBasicMaterial({color:0x73dcff,transparent:true,opacity:.8,depthWrite:false}));halo.rotation.x=-Math.PI/2;halo.position.set(anchor.x,.3,anchor.z);projection.add(halo);
        const beam=new THREE.Mesh(new THREE.CylinderGeometry(.28,.7,.85,16,1,true),new THREE.MeshBasicMaterial({color:0x4ebddf,transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide}));beam.position.set(anchor.x,.76,anchor.z);projection.add(beam);
        if(typeof document!=='undefined')projection.add(this._sign('PROJECTION DE RECONNAISSANCE',anchor.x,.8,anchor.z+1.15,5.2,'#8be7ff',mesh.rotation.y));
        this.stage.add(mesh,projection);view={id:entry.id,mesh,projection,frameId:frame.id};this.horizonFleetViews.set(entry.id,view);
      }
      if(view){
        if(permitted&&frame){
          const key=`horizon-fleet-me1:${entry.id}`;
          if(!this.spriteCache.has(key)){const[x,y,w,h]=frame.rect,texture=atlas.clone();texture.repeat.set(w/config.width,h/config.height);texture.offset.set(x/config.width,1-(y+h)/config.height);this.spriteCache.set(key,texture);}
          const texture=this.spriteCache.get(key);if(view.mesh.material.map!==texture){view.mesh.material.map=texture;view.mesh.material.needsUpdate=true;}
        }
        view.mesh.visible=!!permitted&&this.mode!=='combat';if(view.projection)view.projection.visible=view.mesh.visible;
      }
    }
  }

  _vehicleInPeriod() {
    const context=this.storyContext;
    return (context?.mediaId === undefined || context.mediaId === 'ME1') && (context?.periodId === undefined || context.periodId === 'me1')
      && (context?.context?.mediaId === undefined || context.context.mediaId === 'ME1') && (context?.context?.periodId === undefined || context.context.periodId === 'me1');
  }

  isVehicleMounted() { return this.makoState?.mounted === true; }

  _vehicleGround(x, z, radius = 1.45, { encounters = true } = {}) {
    if (this.zoneId !== 'therum' || !this.levelLayout || !isLevelGround(this.levelLayout, x, z, radius)) return false;
    if (this.colliders.some(c => this._insideCollider(x,z,c,radius))) return false;
    // The condensed mission progresses northward. A vehicle cannot drive past
    // an uncleared ATB checkpoint on an optional flank, or start combat aboard.
    if (encounters && radius > .5) for (const suffix of ['encounter-1','encounter-2','boss']) {
      const id = `therum:${suffix}`, p = this.levelLayout.pois[suffix];
      if (!this.cleared.has(id) && z < p.z + 9 + radius) return false;
    }
    return true;
  }

  getNearbyVehicle() {
    const state = this.makoState; if (!state || this.zoneId !== 'therum' || !this._vehicleInPeriod()) return null;
    const distance = Math.hypot(state.position.x-this.player.x,state.position.z-this.player.z);
    if (!state.mounted && distance > 4) return null;
    return { id:'mako', name:'M35 Mako', label:'M35 Mako', mounted:state.mounted, distance,
      available:this.mode === 'explore' && (state.mounted || distance <= 4), reason:this.mode === 'explore' ? null : 'mode' };
  }

  boardVehicle() {
    if (!this._vehicleInPeriod()) return {ok:false,reason:'period'};
    if (this.mode !== 'explore' || this.battle || this.zoneId !== 'therum') return {ok:false,reason:'mode'};
    const state=this.makoState;if (!state || !this._vehicleGround(state.position.x,state.position.z)) return {ok:false,reason:'blocked'};
    const distance=Math.hypot(state.position.x-this.player.x,state.position.z-this.player.z);
    if(distance>4)return {ok:false,reason:'too-far'};
    const samples=Math.max(1,Math.ceil(distance/.15));
    for(let i=0;i<=samples;i++) if(!this._walkable(this.player.x+(state.position.x-this.player.x)*i/samples,this.player.z+(state.position.z-this.player.z)*i/samples)) return {ok:false,reason:'blocked'};
    const result=boardMako(state,this.player,this.zoneId);if(!result.ok)return {ok:false,reason:result.reason};
    this.makoState=result.state;this.player={...result.state.position};this.targetPath=null;this.pendingPOI=null;this._resetTrail();
    for(const actor of this.actors)actor.group.visible=false;
    this.onMove?.({...this.player,zone:this.zoneId});this._syncMakoSprite();return {ok:true,reason:null};
  }

  leaveVehicle() {
    if(this.mode!=='explore' || this.battle)return {ok:false,reason:'mode'};
    return this._dismountVehicle();
  }

  _dismountVehicle() {
    const result=dismountMako(this.makoState,(x,z,radius)=>this._vehicleGround(x,z,radius,{encounters:false}));
    if(!result.ok)return {ok:false,reason:result.reason};
    this.makoState=result.state;this.setPosition(result.position);this.targetPath=null;this.pendingPOI=null;
    for(const actor of this.actors)actor.group.visible=this.mode!=='combat';
    this.onMove?.({...this.player,zone:this.zoneId});this._syncMakoSprite();return {ok:true,reason:null};
  }

  _syncMakoSprite() {
    const state=this.makoState;if(!state || !this.stage || this.zoneId!=='therum')return;
    if(!this.makoSprite){
      const group=new THREE.Group();group.name='therum-driveable-mako';group.userData.keep=true;
      const body=new THREE.Mesh(new THREE.PlaneGeometry(5,3),new THREE.MeshBasicMaterial({transparent:true,alphaTest:.2,side:THREE.DoubleSide,toneMapped:false}));
      body.position.y=1.5;group.add(body);
      const shadow=new THREE.Mesh(new THREE.CircleGeometry(1.65,24),new THREE.MeshBasicMaterial({color:0x070b10,transparent:true,opacity:.25,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.04;group.add(shadow);
      this.stage.add(group);this.makoSprite={group,body};
    }
    const {group,body}=this.makoSprite;group.visible=this.mode!=='combat'&&this._vehicleInPeriod();group.position.set(state.position.x,0,state.position.z);body.rotation.y=Math.atan2(this.cameraOffset.x,this.cameraOffset.z);
    const config=this.makoDirectionsConfig,atlas=this.atlases['mako-directions'],frame=config?.frames[makoDirectionFrame(state)];
    if(atlas && frame && atlas.image?.width===config.width && atlas.image.height===config.height){
      const [x,y,w,h]=frame.rect,key=`mako-directions:${frame.id}`;let texture=this.spriteCache.get(key);
      if(!texture){texture=atlas.clone();texture.repeat.set(w/config.width,h/config.height);texture.offset.set(x/config.width,1-(y+h)/config.height);this.spriteCache.set(key,texture);}
      body.material.map=texture;const height=config.displayHeight*(frame.heightScale||1),width=height*w/h;
      body.scale.set(width/5,height/3,1);body.position.y=(frame.pivot[1]/h-.5)*height+.05;
      const offset=(.5-frame.pivot[0]/w)*width,angle=body.rotation.y;body.position.x=Math.cos(angle)*offset;body.position.z=-Math.sin(angle)*offset;body.visible=true;
    }else if(this.atlases.vehicles){
      const key='mako-legacy-preview';let texture=this.spriteCache.get(key);if(!texture){const atlas=this.atlases.vehicles;texture=atlas.clone();texture.repeat.set(662/atlas.image.width,400/atlas.image.height);texture.offset.set(650/atlas.image.width,1-490/atlas.image.height);this.spriteCache.set(key,texture);}body.material.map=texture;body.scale.set(1,1,1);body.position.set(0,1.55,0);body.visible=true;
    }else body.visible=false;
    body.material.needsUpdate=true;
  }

  registerJokerSeated(input) {
    if (this._disposed) return false;
    const config = normalizeJokerSeated(input);
    if (!config) return false;
    if (JSON.stringify(config) === JSON.stringify(this.jokerSeatedConfig)) return true;
    for (const [key, texture] of this.spriteCache) if (key.startsWith('seated-joker:')) {
      texture.dispose(); this.spriteCache.delete(key);
    }
    this.jokerSeatedConfig = config;
    this._loadAtlas('seated-joker', `${ASSET_BASE}${config.file}`);
    return true;
  }

  _applySeatedJoker(actor) {
    if (!canShowJokerSeated(actor, this.zoneId)) {
      if (actor.animationFrame?.startsWith('joker-seated-')) this._fallbackCombatFrame(actor);
      return false;
    }
    const config = this.jokerSeatedConfig, atlas = this.atlases['seated-joker'];
    if (config && atlas?.image?.width === config.width && atlas.image.height === config.height
      && this._applyAnimationFrame(actor, 'seated-joker', config.frames.idle)) return true;
    if (actor.animationFrame?.startsWith('joker-seated-')) this._fallbackCombatFrame(actor);
    return false;
  }

  _combatAnimationConfig(actor, state = actor.state) {
    const config = this.characterAnimations?.[actor.key];
    if (!config?.combat) return null;
    if (COMPANION_ANIMATION_IDS.includes(actor.key)) return canShowCompanionAnimation(actor, state, this.storyContext)
      && config.characterId === actor.key && config.mediaId === 'ME1' ? config.combat : null;
    if (ENEMY_ANIMATION_IDS.includes(actor.key)) return canShowEnemyAnimation(actor, state)
      && config.characterId === actor.key && config.mediaId === 'ME1' ? config.combat : null;
    if (BOSS_ANIMATION_IDS.includes(actor.key)) return canShowBossAnimation(actor, state)
      && config.characterId === actor.key && config.mediaId === 'ME1' ? config.combat : null;
    return config.combat;
  }

  _releaseBattleActorTextures(actor) {
    for (const [key, texture] of this.spriteCache) if ((key.startsWith('combat-') || key.startsWith('frontier-enemies:') || key.startsWith('horizon-enemies:') || key.startsWith('horizon-fauna:')) && key.endsWith(`:${actor.id}`)) {
      texture.dispose(); this.spriteCache.delete(key);
    }
  }

  _releaseAmbientActorTextures(actor) {
    for(const[key,texture]of this.spriteCache)if(['frontier-npcs:','horizon-npcs:','horizon-enemies:','horizon-fauna:','frontier-enemies:'].some(prefix=>key.startsWith(prefix))&&key.endsWith(`:${actor.id}`)){
      texture.dispose();this.spriteCache.delete(key);
    }
  }

  _fallbackCombatFrame(actor) {
    actor.body.material.map = this._spriteTexture(actor.key, actor.enemy);
    actor.body.scale.set(1, actor.alive && actor.state?.cover ? .88 : 1, 1);
    actor.body.position.x = 0; actor.body.position.z = 0;
    actor.body.rotation.z = actor.alive ? 0 : -.9; actor.animationFrame = null;
  }

  _applyAnimationFrame(actor, atlasName, frame, { cover = false } = {}) {
    if (BOSS_ANIMATION_IDS.includes(actor.key) && atlasName !== `combat-${actor.key}`) return false;
    const atlas = this.atlases[atlasName], rect = frame?.rect;
    if (!atlas?.image?.width || !atlas.image.height || !Array.isArray(rect) || rect.length !== 4 || !rect.every(Number.isFinite)) return false;
    if (GUARDED_COMBAT_ANIMATION_IDS.includes(actor.key) && atlasName === `combat-${actor.key}`) {
      const config = this._combatAnimationConfig(actor);
      if (!config || atlas.image.width !== config.width || atlas.image.height !== config.height) return false;
    }
    const staticConfig = atlasName === 'frontier-enemies' ? this.frontierEnemyConfig : atlasName === 'frontier-npcs' ? this.frontierNPCConfig : this._horizonAtlasConfig(atlasName);
    if (staticConfig && (atlas.image.width !== staticConfig.width || atlas.image.height !== staticConfig.height)) return false;
    const [x, y, width, height] = rect;
    if (x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > atlas.image.width || y + height > atlas.image.height) return false;
    const cacheKey = `${atlasName}:${actor.id}`;
    if (!this.spriteCache.has(cacheKey)) this.spriteCache.set(cacheKey, atlas.clone());
    const texture = this.spriteCache.get(cacheKey);
    texture.userData.relayAnimationFrame = frame;
    texture.repeat.set(width / atlas.image.width, height / atlas.image.height);
    texture.offset.set(x / atlas.image.width, 1 - (y + height) / atlas.image.height);
    const displayHeight = actor.height * (frame.heightScale || 1) * (cover ? .88 : 1);
    const displayWidth = displayHeight * width / height;
    const pivot = frame.pivot || [width / 2, height];
    actor.body.scale.set(displayWidth / actor.body.geometry.parameters.width, displayHeight / actor.body.geometry.parameters.height, 1);
    actor.body.position.y = (pivot[1] / height - .5) * displayHeight + .05;
    const offset = (.5 - pivot[0] / width) * displayWidth, facing = Math.atan2(this.cameraOffset.x, this.cameraOffset.z);
    actor.body.position.x = Math.cos(facing) * offset; actor.body.position.z = -Math.sin(facing) * offset;
    actor.body.material.map = texture; actor.body.rotation.z = 0;
    actor.animationFrame = frame.id || frame.pose || null;
    return true;
  }

  _animateCharacter(actor, moving, dx, dz) {
    const config = this.characterAnimations?.[actor.key];
    if (!Array.isArray(config?.frames) || !config.frames.length || !this.atlases[`motion-${actor.key}`]) return false;
    if (moving) {
      const side = new THREE.Vector2(this.cameraOffset.z, -this.cameraOffset.x).normalize();
      const forward = new THREE.Vector2(-this.cameraOffset.x, -this.cameraOffset.z).normalize();
      const horizontal = dx * side.x + dz * side.y, vertical = dx * forward.x + dz * forward.y;
      actor.walkDirection = Math.abs(horizontal) > Math.abs(vertical) ? horizontal > 0 ? 'right' : 'left' : vertical > 0 ? 'back' : 'front';
    }
    const frames = config.frames.filter(frame => frame.direction === (actor.walkDirection || 'front'));
    const rate = (config.fps || 7) * (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? 1.4 : 1);
    const frame = frames[moving ? Math.floor(this.time * rate) % frames.length : 0];
    return this._applyAnimationFrame(actor, `motion-${actor.key}`, frame);
  }

  _texturedMaterial(color, kind = 'metal', repeats = 6) {
    const key = `texture-${color}-${kind}-${repeats}`;
    if (this.materialCache.has(key)) return this.materialCache.get(key);
    const rand = randomGenerator(hash(key));
    const texture = canvasTexture(256, 256, (c, w, h) => {
      c.fillStyle = '#a5a5a5'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 11000; i++) { const b = Math.floor(90 + rand() * 90); c.fillStyle = `rgba(${b},${b},${b},${kind === 'metal' ? .16 : .38})`; c.fillRect(rand() * w, rand() * h, 1 + rand() * 3, 1 + rand() * 3); }
      if (kind === 'metal') { c.strokeStyle = '#50585c'; c.lineWidth = 2; c.strokeRect(1, 1, w - 2, h - 2); c.fillStyle = '#3a4044'; for (const x of [8, w - 10]) for (const y of [8, h - 10]) c.fillRect(x, y, 3, 3); }
    });
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(repeats, repeats); this.textureCache.set(key, texture);
    const material = new THREE.MeshStandardMaterial({ color, map: texture, roughness: kind === 'metal' ? .62 : .98, metalness: kind === 'metal' ? .48 : .02 });
    this.materialCache.set(key, material); return material;
  }

  _edenTerrainMaterial(kind, color = 0xffffff, vertexColors = false) {
    const materialKey = `eden-native-material:${kind}:${color}:${vertexColors}`;
    if (this.materialCache.has(materialKey)) return this.materialCache.get(materialKey);
    const textureKey = `eden-native-terrain:${kind}`;
    let texture = this.textureCache.get(textureKey);
    if (!texture) {
      const rand = randomGenerator(hash(`eden-fallback:${kind}`));
      texture = canvasTexture(128, 128, (c, w, h) => {
        c.fillStyle = kind === 'dirt' ? '#9c8971' : '#73805a'; c.fillRect(0, 0, w, h);
        for (let i = 0; i < 1800; i++) {
          const value = Math.floor(80 + rand() * 85); c.fillStyle = `rgba(${value},${value},${value},.19)`;
          c.fillRect(rand() * w, rand() * h, 1 + rand() * 3, 1 + rand() * 3);
        }
      });
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.userData.edenTerrain = 'fallback'; this.textureCache.set(textureKey, texture);
    }
    const material = new THREE.MeshStandardMaterial({ color, map: texture, roughness: 1, metalness: 0, vertexColors });
    material.userData.edenTerrainKind = kind; this.materialCache.set(materialKey, material);
    const requests = this._terrainRequests ||= new Map();
    if (texture.userData.edenTerrain !== 'native' && !requests.has(kind) && !this._disposed) {
      const request = {}; requests.set(kind, request);
      const failed = () => {
        if (this._disposed || requests.get(kind) !== request) return;
        requests.delete(kind); this.assetErrors?.push(`Texture de terrain indisponible : eden-ground-${kind}.png`);
      };
      try { new THREE.TextureLoader().load(`${ASSET_BASE}eden-ground-${kind}.png`, loaded => {
        if (this._disposed || requests.get(kind) !== request) { loaded.dispose(); return; }
        requests.delete(kind); loaded.colorSpace = THREE.SRGBColorSpace; loaded.wrapS = loaded.wrapT = THREE.RepeatWrapping;
        loaded.magFilter = THREE.LinearFilter; loaded.anisotropy = 4; loaded.userData.edenTerrain = 'native';
        const previous = this.textureCache.get(textureKey); this.textureCache.set(textureKey, loaded);
        for (const value of this.materialCache.values()) if (value.userData.edenTerrainKind === kind) {
          value.map = loaded; value.needsUpdate = true;
        }
        if (previous && previous !== loaded) previous.dispose();
      }, undefined, failed); } catch { failed(); }
    }
    return material;
  }

  _mesh(geometry, material, x = 0, y = 0, z = 0, parent = this.stage) {
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  _box(w, h, d, material, x = 0, y = 0, z = 0, rounded = false, parent = this.stage) {
    return this._mesh(rounded ? new RoundedBoxGeometry(w, h, d, 1, Math.min(.1, h / 5, w / 5, d / 5)) : new THREE.BoxGeometry(w, h, d), material, x, y, z, parent);
  }
  _walkableSurface(mesh) {
    mesh.userData.keep = true; mesh.userData.walkableSurface = true;
    (this.walkableSurfaces ||= []).push(mesh); return mesh;
  }
  _groundHeightAt(x, z) { return sampleWalkableHeight(this.walkableSurfaces, x, z); }
  _groundActor(actor, lift = 0) {
    actor.group.position.y = this._groundHeightAt(actor.group.position.x, actor.group.position.z) + lift;
    // A biotic lift moves the body and status shell; its contact shadow stays
    // on the supporting floor instead of hovering with the actor group.
    actor.shadow.position.y = .035 - lift;
  }
  _cylinder(radius, height, material, x, y, z, radiusTop = radius, sides = 24, parent = this.stage) {
    return this._mesh(new THREE.CylinderGeometry(radiusTop, radius, height, sides), material, x, y, z, parent);
  }
  _ring(radius, tube, color, x, y, z, parent = this.stage) {
    const ring = this._mesh(new THREE.TorusGeometry(radius, tube, 6, 64), this._material(color, .5, .2, color), x, y, z, parent);
    ring.rotation.x = Math.PI / 2; return ring;
  }
  _pipe(a, b, radius, material, parent = this.stage) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), direction = end.clone().sub(start);
    const mesh = this._mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 8), material, ...start.clone().add(end).multiplyScalar(.5).toArray(), parent);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()); return mesh;
  }
  _rectCollider(x, z, width, depth) { this.colliders.push({ kind: 'rect', minX: x - width / 2, maxX: x + width / 2, minZ: z - depth / 2, maxZ: z + depth / 2 }); }
  _circleCollider(x, z, radius) { this.colliders.push({ kind: 'circle', x, z, radius }); }

  _floor(width, depth, color, kind = 'metal') {
    this._box(width, .4, depth, this._texturedMaterial(color, kind, kind === 'metal' ? 10 : 15), 0, -.23, 0);
  }

  _sign(text, x, y, z, width = 3.3, color = '#b9edf0', rotation = 0) {
    const texture = canvasTexture(768, 160, (c, w, h) => {
      c.fillStyle = 'rgba(5,17,27,.9)'; c.fillRect(0, 0, w, h); c.fillStyle = color; c.fillRect(0, 0, 5, h); c.globalAlpha = .25; c.fillRect(25, h - 12, w - 50, 2); c.globalAlpha = 1;
      c.font = `600 ${text.length > 22 ? 30 : 39}px sans-serif`; c.textBaseline = 'middle'; c.fillText(text.toUpperCase(), 30, h / 2, w - 60);
    });
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide }); material.userData.ownedMap = true;
    const sign = this._mesh(new THREE.PlaneGeometry(width, width * 160 / 768), material, x, y, z); sign.rotation.y = rotation; sign.castShadow = false; return sign;
  }

  _console(x, z, angle = 0, color = 0x63c9df) {
    const group = new THREE.Group(); group.position.set(x, 0, z); group.rotation.y = angle; this.stage.add(group);
    const base = this._material(0x263a49, .55, .7), trim = this._material(0x102330, .7, .5);
    this._box(1.8, .8, 1.1, base, 0, .4, 0, true, group);
    this._box(1.65, .08, .85, trim, 0, .9, -.1, false, group).rotation.x = -.3;
    const screen = this._box(1.4, .025, .62, this._material(color, .3, .3, color), 0, .95, -.12, false, group); screen.rotation.x = -.3;
    for (let i = 0; i < 4; i++) this._box(.16, .035, .075, this._material(0xb7e6ed, .5, .1, 0x2d657c), -.5 + i * .24, 1.0, .38, false, group);
    this._rectCollider(x, z, 1.8, 1.1); return group;
  }

  _crate(x, z, size = 1, color = 0x55616b) {
    const material = this._material(color, .74, .52); this._box(1.5 * size, 1.2 * size, 1.15 * size, material, x, .6 * size, z, true);
    const edge = this._material(0x263543, .5, .65);
    for (const offset of [-.48, .48]) this._box(.09 * size, 1.24 * size, 1.19 * size, edge, x + offset * size, .6 * size, z);
    this._box(.28 * size, .14 * size, .03, this._material(0xa3d6c3, .4, .1, 0x416d67), x, .72 * size, z + .58 * size);
    this._rectCollider(x, z, 1.5 * size, 1.15 * size);
  }

  _rock(x, z, scale = 1, color = 0x596265, height = 1) {
    const geometry = new THREE.DodecahedronGeometry(1, 0);
    const rock = this._mesh(geometry, this._material(color, 1, 0), x, .45 * height * scale, z);
    rock.scale.set(scale * 1.4, scale * height, scale); rock.rotation.set(this.rand() * .4, this.rand() * 5, this.rand() * .3);
    this._circleCollider(x, z, scale * 1.05); return rock;
  }

  _tree(x, z, scale = 1, variant = 'pine') {
    const trunk = this._material(variant === 'alien' ? 0x4d5141 : 0x465044, 1, 0);
    this._cylinder(.2 * scale, 4 * scale, trunk, x, 2 * scale, z, .11 * scale, 7);
    if (variant === 'palm') {
      const leafMat = this._material(0x446852, .9, 0);
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * TAU + .2, length = (2.5 + this.rand()) * scale;
        const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.quadraticCurveTo(length * .4, .7 * scale, length, -.3 * scale); shape.quadraticCurveTo(length * .55, -.3 * scale, 0, 0);
        const leaf = this._mesh(new THREE.ShapeGeometry(shape, 8), leafMat, x, 4 * scale, z); leaf.material.side = THREE.DoubleSide; leaf.rotation.set(-.2, a, .15);
      }
    } else {
      for (let j = 0; j < 3; j++) {
        const material = this._material(variant === 'alien' ? [0x3e5e52, 0x4c7160, 0x5d7862][j] : [0x253f36, 0x355849, 0x52715a][j], 1, 0);
        this._mesh(new THREE.ConeGeometry((1.5 - j * .26) * scale, 2.3 * scale, 7), material, x, (2.2 + j * .85) * scale, z);
      }
    }
    this._circleCollider(x, z, .42 * scale);
  }

  _stars() {
    const positions = [];
    for (let i = 0; i < 600; i++) { const angle = this.rand() * TAU, r = 100 + this.rand() * 100; positions.push(Math.cos(angle) * r, 18 + this.rand() * 130, Math.sin(angle) * r); }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const stars = new THREE.Points(geometry, new THREE.PointsMaterial({ size: .35, color: 0xb9d8f1, transparent: true, opacity: .8, sizeAttenuation: true })); this.stage.add(stars);
  }

  _lights(theme) {
    const outdoor = !['normandy', 'citadel', 'noveria', 'finale'].includes(theme);
    const moods = { normandy: [0x07121e, 0x92d6ee, 0x1b293d], eden: [0x343b40, 0xffd4a0, 0x415b57], citadel: [0x526775, 0xc5e5ed, 0x668789], therum: [0x302b29, 0xffb787, 0x43424a], feros: [0x334348, 0xc0d3c3, 0x405956], noveria: [0x3d5869, 0xd2f0ff, 0x4b6478], virmire: [0x577d87, 0xffe4b3, 0x527b72], ilos: [0x1e3432, 0xa7c6a0, 0x334e4a], finale: [0x172a38, 0x8cb9d1, 0x27394b] };
    const [background, main, ambient] = moods[theme] || moods.eden;
    this.scene.background.set(background); this.scene.fog = new THREE.FogExp2(background, outdoor ? .0105 : .0075);
    const hemi = new THREE.HemisphereLight(main, ambient, 1.45); this.stage.add(hemi);
    const key = new THREE.DirectionalLight(main, 3.1); key.position.set(-22, 33, -15); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -45; key.shadow.camera.right = 45; key.shadow.camera.top = 45; key.shadow.camera.bottom = -45;
    key.shadow.camera.near = 1; key.shadow.camera.far = 110; key.shadow.bias = -.0005; key.shadow.normalBias = .08; this.stage.add(key);
    if (this.levelLayout) {
      const b = this.levelLayout.bounds, center = new THREE.Vector3((b.minX + b.maxX) / 2, 0, (b.minZ + b.maxZ) / 2);
      key.position.copy(center).add(new THREE.Vector3(-60, 110, -55)); key.target.position.copy(center); this.stage.add(key.target);
      const extent = Math.max(b.maxX - b.minX, b.maxZ - b.minZ) * .82;
      Object.assign(key.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent, far: 350 });
      key.shadow.camera.updateProjectionMatrix();
      hemi.intensity = 1.15; key.intensity = 2.65;
      const mood = this.levelLayout.lighting || { background: 0x4c5b55, fog: .0055 };
      this.scene.background.set(mood.background); this.scene.fog.color.set(mood.background); this.scene.fog.density = mood.fog;
    }
    const fill = new THREE.DirectionalLight(0x83b4cf, .8); fill.position.set(12, 14, 25); this.stage.add(fill);
    if (['normandy', 'finale', 'citadel'].includes(theme)) this._stars();
  }

  _landscape(color, ridgeColor) {
    this._floor(54, 58, color, 'stone');
    for (let i = 0; i < 22; i++) {
      const angle = i / 22 * TAU, radius = 38 + this.rand() * 22, height = 12 + this.rand() * 24;
      const mountain = this._mesh(new THREE.ConeGeometry(10 + this.rand() * 14, height, 5), this._material(ridgeColor, 1, 0), Math.cos(angle) * radius, height * .4 - 2, Math.sin(angle) * radius);
      mountain.rotation.y = this.rand() * 3;
    }
  }

  _road(points, width, material, y = .025) {
    const vertices = [], uvs = [], indices = []; let distance = 0;
    for (let i = 0; i < points.length; i++) {
      const before = points[Math.max(0, i - 1)], after = points[Math.min(points.length - 1, i + 1)];
      const dx = after[0] - before[0], dz = after[1] - before[1], length = Math.hypot(dx, dz) || 1;
      const nx = dz / length * width / 2, nz = -dx / length * width / 2;
      if (i) distance += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
      vertices.push(points[i][0] + nx, y + .03, points[i][1] + nz, points[i][0] - nx, y + .03, points[i][1] - nz);
      uvs.push(0, distance / width, 1, distance / width);
      if (i < points.length - 1) indices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
    this._mesh(geometry, material);
  }

  _grass(count = 600, color = 0x647557) {
    const geometry = new THREE.ConeGeometry(.13, .52, 3);
    const mesh = new THREE.InstancedMesh(geometry, this._material(color, 1, 0), count);
    const transform = new THREE.Object3D(); let placed = 0;
    for (let i = 0; i < count * 4 && placed < count; i++) {
      const x = (this.rand() - .5) * 49, z = (this.rand() - .5) * 51;
      if (Math.abs(x) < 4.5 || this.colliders.some(c => this._insideCollider(x, z, c, .2))) continue;
      const scale = .45 + this.rand() * 1.3; transform.position.set(x, .22 * scale, z); transform.scale.set(scale, scale, scale); transform.rotation.y = this.rand() * TAU; transform.updateMatrix(); mesh.setMatrixAt(placed++, transform.matrix);
    }
    mesh.count = placed; mesh.castShadow = false; mesh.receiveShadow = true; this.stage.add(mesh);
  }

  _building(x, z, width, depth, height, color = 0x78838a, windows = 0x75969f) {
    // Camera-facing architecture uses a deliberate cutaway height to preserve playable sightlines.
    if (x > 7 && x < 30 && z > -30) height = Math.min(height, 4.3);
    const wall = this._material(color, .86, .15), dark = this._material(0x273a48, .6, .45);
    this._box(width, height, depth, wall, x, height / 2, z, true);
    this._box(width + .4, .25, depth + .4, dark, x, height, z);
    for (let y = 1.3; y < height - .4; y += 1.8) {
      this._box(width + .04, .65, .04, this._material(windows, .25, .4, 0x1b3444), x, y, z + depth / 2 + .025);
      this._box(.04, .65, depth + .04, this._material(windows, .25, .4, 0x1b3444), x + width / 2 + .025, y, z);
      for (let xx = -width / 2 + .8; xx < width / 2; xx += 1.4) this._box(.14, .7, .09, dark, x + xx, y, z + depth / 2 + .06);
    }
    for (const side of [-1, 1]) {
      this._box(.25, height + .2, .32, this._material(0x8a999e, .7, .4), x + side * (width / 2 - .3), height / 2, z + depth / 2 + .08);
      const ventX = x + side * width * .27;
      this._box(width * .22, .55, Math.min(2.4, depth * .3), dark, ventX, height + .38, z, true);
      for (let j = 0; j < 5; j++) this._box(width * .18, .035, .06, wall, ventX, height + .68, z - .65 + j * .3);
    }
    this._box(2.25, 2.4, .15, dark, x, 1.2, z + depth / 2 + .04, true);
    this._box(.035, 2.1, .08, this._material(0x8fcedc, .5, .1, 0x36647d), x, 1.15, z + depth / 2 + .15);
    this._box(2.6, .17, 1.4, wall, x, 2.55, z + depth / 2 + .5, true);
    this._rectCollider(x, z, width, depth);
  }

  _smoke(x, z, scale = 1, fire = true) {
    const group = new THREE.Group(); group.userData.keep = true; group.position.set(x, 0, z); this.stage.add(group);
    for (let i = 0; i < 7; i++) {
      const material = new THREE.MeshBasicMaterial({ color: fire && i < 2 ? 0xffa24e : 0x495353, transparent: true, opacity: fire && i < 2 ? .28 : .18, depthWrite: false });
      const puff = this._mesh(new THREE.IcosahedronGeometry((.5 + i * .17) * scale, 1), material, Math.sin(i) * .3 * scale, (.4 + i * .65) * scale, 0, group);
      puff.userData.smoke = i;
    }
    this.animations.push({ kind: 'smoke', object: group, scale });
    if (fire) { const light = new THREE.PointLight(0xff8844, 6, 7); light.position.set(x, 1.5, z); this.stage.add(light); this.animations.push({ kind: 'fire', object: light }); }
  }

  _normandy() {
    const steel = this._material(0x3a4a59, .6, .72), dark = this._material(0x12222f, .6, .6), white = this._material(0x9ca9b0, .67, .45);
    this._floor(18, 37, 0x4f6370);
    this._walkableSurface(this._box(4.4, .08, 33, this._texturedMaterial(0x677a86), 0, .02, 0));
    for (let z = -16; z <= 16; z += 2) {
      this._box(4.35, .04, .06, dark, 0, .07, z);
      for (const x of [-2.35, 2.35]) this._box(.055, .035, 1.5, this._material(0x85c8e2, .5, .2, 0x365f81), x, .08, z);
    }
    for (const x of [-8.5, 8.5]) {
      this._box(.8, 1.2, 37, dark, x, .55, 0);
      this._box(.15, .07, 36, this._material(0x5ba5bb, .5, .2, 0x1c4c69), x - Math.sign(x) * .45, 1.19, 0);
      for (let z = -16; z < 16; z += 5.5) {
        this._box(.8, 4.2, .65, steel, x, 2.1, z, true);
        this._box(.06, 2.8, .11, this._material(0x8dc5d3, .45, .2, 0x3a7895), x - Math.sign(x) * .43, 2.25, z + .36);
        this._pipe([x, 4, z], [x - Math.sign(x) * 2.3, 5.3, z], .23, white);
        this._box(3.2, .15, .75, dark, x - Math.sign(x) * 1.7, 5.2, z);
      }
    }
    this._box(18, 5, .6, dark, 0, 2.5, -18.3);
    this._box(14, 3.2, .12, this._material(0x102c45, .12, .8, 0x0a203c), 0, 3.0, -17.93);
    for (const x of [-6.2, -2.1, 2.1, 6.2]) this._box(.12, 3.3, .2, white, x, 3.0, -17.82);
    this._sign('SSV NORMANDY · SR-1', 0, 4.95, -17.7, 7.3);
    this._console(-4.8, -12, .3); this._console(4.8, -12, -.3); this._console(-6.6, -1, Math.PI / 2); this._console(6.5, 1, -Math.PI / 2);
    this._cylinder(2.2, .7, dark, 0, .35, -7, 2.5);
    this._cylinder(2.55, .12, white, 0, .78, -7);
    this._cylinder(2.3, .03, this._material(0x28526c, .15, .65, 0x163b5b), 0, .86, -7);
    this._ring(2.27, .025, 0x6fc7e8, 0, .91, -7);
    const globe = this._mesh(new THREE.SphereGeometry(1.5, 24, 16), new THREE.MeshBasicMaterial({ color: 0x75c6e8, wireframe: true, transparent: true, opacity: .22, depthWrite: false }), 0, 2.2, -7);
    globe.userData.keep = true; this.animations.push({ kind: 'globe', object: globe });
    for (let i = 0; i < 3; i++) {
      const ring = this._ring(1.7 + i * .13, .014, 0x6fa4d3, 0, 2.2, -7); ring.rotation.set(.4 + i * .9, i * .6, .2); ring.userData.keep = true; this.animations.push({ kind: 'orbit', object: ring, speed: .08 + i * .04 });
    }
    this._circleCollider(0, -7, 2.5);
    for (const x of [-6.6, 6.6]) for (const z of [6, 12]) {
      this._box(1.25, 2.35, 2.2, steel, x, 1.175, z, true); this._box(.06, 1.9, 1.8, dark, x - Math.sign(x) * .66, 1.2, z);
      this._rectCollider(x, z, 1.3, 2.2);
    }
    this._sign('ARMURERIE', -6.4, 2.8, 6, 2.5, '#c7dce8', Math.PI / 2);
    this._sign('INFIRMERIE', 6.4, 2.8, 12, 2.5, '#a2dacb', -Math.PI / 2);
    const galaxyGlow = new THREE.PointLight(0x43a5e5, 10, 10); galaxyGlow.position.set(0, 3, -7); this.stage.add(galaxyGlow);
    const planet = this._mesh(new THREE.SphereGeometry(10, 32, 24), this._material(0x366d85, .9, 0, 0x193346), -18, 18, -65); planet.castShadow = false;
  }

  _eden() {
    if (this.levelLayout) { buildEdenScene(this, this.levelLayout); return; }
    this._landscape(0x75816a, 0x4a5b51);
    this._road([[0, 22], [0, 11], [-3, 1], [0, -9], [0, -21]], 5.4, this._texturedMaterial(0x999b83, 'stone', 8));
    this._building(-15, 2, 8, 7, 5.8, 0xa7a99c); this._building(14, -1, 9, 8, 4.5, 0x989f98);
    this._building(-14, -14, 7, 6, 4.4, 0xa4aba0); this._building(14, 14, 8, 7, 4.8, 0xa0a8a3);
    this._sign('EDEN PRIME · AGRICULTURE', -14, 4.2, 5.6, 6);
    for (const [x, z, s] of [[-16, 15, 1.5], [17, -15, 1.4], [10, -20, 1.2], [-20, -7, 1.8], [22, 5, 1.3]]) this._tree(x, z, s);
    for (const [x, z, s] of [[-8, -12, 1.3], [10, 8, 1.1], [7, -3, .8], [-8, 13, 1.3]]) this._rock(x, z, s, 0x677569);
    this._crate(-10.5, 5, 1.1); this._crate(-12.3, 6, .7); this._crate(7, 3, .8);
    this._smoke(12, -2, 1.4); this._smoke(-13, -13, .8); this._smoke(20, 12, 1.8);
    for (let i = 0; i < 7; i++) {
      const x = -5 + i * 1.7; this._box(.15, 1.2, .15, this._material(0x52655e), x, .6, -7.5);
      this._box(1.6, .13, .13, this._material(0x889585), x + .8, 1.05, -7.5);
    }
    this._cylinder(1.7, .3, this._material(0x697c76, .7, .6), 0, .15, -19);
    const beacon = this._box(.72, 4.3, .68, this._material(0x4b6765, .5, .65), 0, 2.35, -19, true); beacon.rotation.z = -.1;
    this._box(.12, 3.1, .06, this._material(0x9ff5cc, .2, .3, 0x70dcb3), .05, 2.4, -18.62);
    this._circleCollider(0, -19, 1.45);
    const glow = new THREE.PointLight(0x81ecc3, 8, 9); glow.position.set(0, 3, -18); this.stage.add(glow);
    // Sovereign remains a distant scenery element, never a playable encounter on Eden Prime.
    this._vehicleSprite('sovereign', -28, -52, 25, 10);
    this._grass(1000, 0x6e8056);
  }

  _citadel(finale = false) {
    const white = this._material(finale ? 0x737f86 : 0xc4c9c6, .65, .28), trim = this._material(0x445e6c, .45, .7);
    this._floor(47, 49, finale ? 0x6c7982 : 0xa6b6b8);
    this._walkableSurface(this._box(10, .06, 44, this._texturedMaterial(finale ? 0x465562 : 0xaec2c5, 'metal', 12), 0, .03, 0));
    for (const x of [-5.2, 5.2]) this._box(.08, .035, 46, this._material(0x8bd4df, .2, .4, 0x537e8e), x, .08, 0);
    for (const x of [-15, 15]) {
      this._box(10, .35, 22, trim, x, .1, -3, true);
      const water = this._box(9.3, .035, 21.3, new THREE.MeshStandardMaterial({ color: finale ? 0x284b5b : 0x528d99, roughness: .16, metalness: .66, transparent: true, opacity: .88 }), x, .3, -3);
      water.userData.keep = true; this.animations.push({ kind: 'water', object: water }); this._rectCollider(x, -3, 10, 22);
      for (const z of [-15, 10]) {
        this._cylinder(2, .7, white, x, .35, z, 2);
        if (!finale) this._tree(x, z, 1.15, 'palm'); else this._smoke(x, z, .8);
      }
    }
    for (const x of [-21, 21]) for (let z = -20; z <= 20; z += 10) {
      this._cylinder(1.0, 12, white, x, 6, z, .58, 12);
      this._box(2.2, .6, 2.2, trim, x, 11.6, z, true);
      const arm = this._box(8, .5, 1.4, white, x - Math.sign(x) * 2.9, 12.8, z, true); arm.rotation.z = Math.sign(x) * .28;
      this._circleCollider(x, z, 1.05);
    }
    this._walkableSurface(this._box(14, .5, 4.2, white, 0, .24, -20));
    // Shallow approach stairs join the retained council platform. These are
    // scene-unit adaptation geometry, not an original Citadel floor survey.
    for (let step = 0; step < 4; step++) {
      const top = .06 + (.49 - .06) * (step + 1) / 5;
      this._walkableSurface(this._box(14, top, .5, white, 0, top / 2, -16.15 - step * .5));
    }
    for (const x of [-5.4, 0, 5.4]) this._cylinder(.65, 5.4, trim, x, 2.9, -22, .35, 10);
    this._sign(finale ? 'TOUR DU CONSEIL · ALERTE' : 'PRÉSIDIUM · TOUR DU CONSEIL', 0, 5.3, -21.7, 9, finale ? '#e99c8b' : '#d4f1f2');
    for (const x of [-9, 9]) for (const z of [-6, 7, 17]) {
      this._box(2.1, .55, .65, white, x, .4, z, true);
      this._box(2.1, .8, .17, trim, x, .87, z - .24, true);
      this._rectCollider(x, z, 2.1, .65);
    }
    this._console(-10.8, 4, .4); this._console(8, -13, -.2);
    for (let i = 0; i < 30; i++) {
      const x = (i - 15) * 5.5, z = -55 - this.rand() * 12, h = 12 + this.rand() * 28;
      this._building(x, z, 3 + this.rand() * 5, 6 + this.rand() * 6, h, 0x78909a, 0x6c9da8);
    }
    if (finale) { this._smoke(-7, 0, 1.2); this._smoke(9, -17, 1.6); this._crate(8, 2, 1.2, 0x53616a); }
  }

  _therum() {
    this._landscape(0x6a6050, 0x50483d);
    this._road([[0, 22], [0, 10], [-3, 0], [0, -13], [0, -21]], 6.2, this._material(0x867b65, .98, .1));
    for (let i = 0; i < 16; i++) {
      const side = i % 2 ? 1 : -1, x = side * (12 + this.rand() * 9), z = -22 + i * 3;
      this._rock(x, z, 2 + this.rand() * 2, 0x665b4c, 1.4 + this.rand());
    }
    const lava = this._material(0xd26e36, .75, .1, 0xc74113);
    this._road([[-24, 21], [-17, 11], [-20, 1], [-15, -11], [-18, -24]], 3, lava, .06);
    this._road([[24, 19], [17, 8], [20, -4], [16, -20]], 2.5, lava, .06);
    this._building(-15, 13, 6, 6, 4, 0x7f8077); this._crate(-10.4, 5, 1.1, 0x847e6e);
    for (const x of [-5.5, 5.5]) {
      this._box(2.2, 8, 3.5, this._material(0x464c47, .92, .4), x, 4, -19);
      this._box(.11, 6.2, .06, this._material(0x72bca6, .6, .2, 0x29674e), x + .5, 4, -17.22);
    }
    this._box(13, 1.2, 3.8, this._material(0x4d554e, .9, .4), 0, 8.5, -19);
    const barrier = this._mesh(new THREE.PlaneGeometry(7.7, 5.5), new THREE.MeshBasicMaterial({ color: 0x69aacc, transparent: true, opacity: .18, side: THREE.DoubleSide, depthWrite: false }), 0, 2.8, -20);
    barrier.userData.keep = true; this.animations.push({ kind: 'barrier', object: barrier });
    this._smoke(-17, 1, 1.5, false); this._smoke(18, -8, 1.1, false);
  }

  _feros() {
    this._floor(49, 51, 0x707f77, 'stone');
    const concrete = this._material(0x73837d, .95, .1), trim = this._material(0x465955, .8, .35);
    this._road([[0, 23], [0, -22]], 7, this._texturedMaterial(0x9ba79a, 'stone', 9));
    for (const x of [-18, 18]) for (const z of [-17, -1, 15]) {
      this._building(x, z, 10, 10, 8 + this.rand() * 9, 0x73867e, 0x354b4c);
      this._box(11.5, .7, 1.4, concrete, x, 5, z + 5.3);
      for (let i = 0; i < 5; i++) this._pipe([x - 3 + i * 1.5, 12, z + 5.2], [x - 3.5 + i * 1.5, .2, z + 5.9], .13, this._material(0x3b5e46, 1, 0));
    }
    for (const z of [-10, 9]) {
      const beam = this._box(42, .9, 3, concrete, 0, 11, z);
      // Keep overhead spans separate so the combat camera can expose the arena.
      beam.userData.keep = true; beam.userData.combatOccluder = true;
      beam.visible = this.mode !== 'combat'; this.combatOccluders.push(beam);
      for (const x of [-10, 10]) {
        const pillar = this._box(1.3, 11, 2.8, trim, x, 5.5, z);
        if (x > 0) {
          pillar.userData.keep = true; pillar.userData.combatOccluder = true;
          pillar.visible = this.mode !== 'combat'; this.combatOccluders.push(pillar);
        }
        this._rectCollider(x, z, 1.3, 2.8);
      }
    }
    this._sign('EXOGENI · ZHU’S HOPE', -15, 4.5, 20.2, 7);
    for (const [x, z] of [[-7, -15], [7, 12], [-8, 0], [8, -17]]) this._tree(x, z, .8, 'alien');
    this._crate(-10.5, 5, 1); this._crate(9, 3, .8); this._smoke(17, -4, .6, false);
    const roots = this._material(0x515d40, 1, 0);
    for (let i = 0; i < 8; i++) this._pipe([-8 + i * 2.2, .2, -23], [-6 + i * 1.7, 7 + Math.sin(i) * 2, -26], .4 + this.rand() * .4, roots);
    this._mesh(new THREE.IcosahedronGeometry(5, 2), this._material(0x596c47, 1, 0), 0, 6, -28);
    this._grass(400, 0x567855);
  }

  _noveria() {
    this._floor(49, 51, 0x91a4ae);
    const ice = this._material(0xd4e0e2, .97, .05), steel = this._material(0x617580, .64, .5), dark = this._material(0x263b4a, .55, .7);
    this._box(13, .1, 43, this._texturedMaterial(0xa3b6bf, 'metal', 12), 0, .02, 0);
    for (const x of [-18, 18]) {
      this._building(x, -2, 11, 43, 13, 0x92a4ab, 0x406b82);
      this._box(1.5, 4.8, 44, dark, x - Math.sign(x) * 6.2, 2.4, -2);
      for (let z = -20; z <= 20; z += 6.7) {
        const pillar = this._box(1.3, 10, 1.3, steel, x - Math.sign(x) * 6.6, 5, z);
        const light = this._box(.12, 5.5, .2, this._material(0xadcfe1, .5, .1, 0x517e96), x - Math.sign(x) * 7.3, 4.5, z + .6);
        // The camera-facing row cuts across wide enemy silhouettes in combat.
        if (x > 0) for (const object of [pillar, light]) {
          object.userData.keep = true; object.userData.combatOccluder = true;
          object.visible = this.mode !== 'combat'; this.combatOccluders.push(object);
        }
      }
    }
    this._box(13, 4.3, .5, dark, 0, 2.2, -22.5);
    this._box(8.4, 3.5, .08, this._material(0x93abb7, .2, .6, 0x365570), 0, 2.2, -22.2);
    this._sign('PORT HANSHAN · RECHERCHE', 0, 6.1, -21.9, 9);
    for (const z of [-11, 10]) {
      for (const span of [this._box(27, .8, 1.8, steel, 0, 10, z),
        this._box(11, .06, .2, this._material(0xc6e8f1, .5, .1, 0x7aabbc), 0, 9.55, z)]) {
        // As on Feros, overhead spans yield to the tactical combat view.
        span.userData.keep = true; span.userData.combatOccluder = true;
        span.visible = this.mode !== 'combat'; this.combatOccluders.push(span);
      }
    }
    this._console(-10.7, 5, Math.PI / 2); this._console(9, -13, -Math.PI / 2); this._crate(8, 3, 1);
    for (const [x, z, s] of [[-9, -17, 1.8], [9, 16, 1.4], [-9, 15, 1.1], [11, -3, .8]]) this._rock(x, z, s, 0xcbd8dd, .4);
    for (let i = 0; i < 8; i++) this._box(1 + this.rand() * 2, .3, 2 + this.rand() * 3, ice, (this.rand() < .5 ? -1 : 1) * (8 + this.rand() * 3), .13, -20 + this.rand() * 40, true);
    const points = new Float32Array(450 * 3);
    for (let i = 0; i < 450; i++) { points[i * 3] = (this.rand() - .5) * 55; points[i * 3 + 1] = this.rand() * 18; points[i * 3 + 2] = (this.rand() - .5) * 55; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(points, 3));
    const snow = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xd6e8f3, size: .065, opacity: .7, transparent: true })); this.stage.add(snow); this.animations.push({ kind: 'snow', object: snow });
  }

  _virmire() {
    this._landscape(0xb8b49a, 0x6f8c7d);
    this._road([[0, 23], [0, 11], [-3, 0], [0, -18]], 6.5, this._texturedMaterial(0xc9c8ad, 'stone', 8));
    const water = this._box(30, .03, 80, new THREE.MeshStandardMaterial({ color: 0x458c99, roughness: .17, metalness: .6, transparent: true, opacity: .94 }), -38, -.02, -4);
    water.userData.keep = true; this.animations.push({ kind: 'water', object: water });
    for (let i = 0; i < 13; i++) this._tree((i % 2 ? 1 : -1) * (12 + this.rand() * 8), -20 + this.rand() * 40, .85 + this.rand() * .5, 'palm');
    for (const [x, z, s] of [[-8, -13, 1.8], [8, 12, 1.2], [11, -5, 1.5], [-9, 8, .8]]) this._rock(x, z, s, 0x929d89, .8);
    this._building(-15, -17, 10, 9, 6, 0x8c9993); this._building(15, -17, 10, 9, 8, 0x8c9993);
    this._box(21, .7, 4.2, this._material(0x738681, .7, .5), 0, 7.8, -18);
    for (const x of [-8, 8]) { this._box(1.3, 8, 2.4, this._material(0x657b74, .8, .45), x, 4, -18); this._rectCollider(x, -18, 1.3, 2.4); }
    this._sign('RECHERCHE · ACCÈS RESTREINT', 0, 6.8, -15.8, 8);
    this._crate(-10.5, 5, 1.0); this._crate(-12.2, 6.4, .8); this._console(7.6, -10, -.5);
    for (let i = 0; i < 3; i++) this._smoke(12 + i * 3, -23, .6 + i * .3);
    this._grass(750, 0x6e925f);
  }

  _ilos() {
    this._landscape(0x586952, 0x324b43);
    const stone = this._material(0x6d7868, .98, .1), dark = this._material(0x394d42, .9, .2);
    this._road([[0, 23], [0, -23]], 7, this._texturedMaterial(0x84917b, 'stone', 12));
    for (const x of [-12, 12]) for (const z of [-15, 0, 15]) {
      this._box(5.2, .8, 6, stone, x, .4, z, true);
      this._box(2.4, 8.5, 2.2, stone, x, 4.6, z, true);
      const head = this._mesh(new THREE.DodecahedronGeometry(1.5, 0), dark, x, 9.4, z); head.scale.set(.8, 1.3, .85);
      this._pipe([x - .8, 6.4, z], [x - 1.7, 2.7, z + .2], .5, stone); this._pipe([x + .8, 6.4, z], [x + 1.7, 2.7, z + .2], .5, stone);
      this._rectCollider(x, z, 5.2, 6);
    }
    for (let i = 0; i < 14; i++) this._tree((i % 2 ? 1 : -1) * (17 + this.rand() * 8), -27 + this.rand() * 52, 1.0 + this.rand() * 1.3, 'alien');
    for (const z of [-9, 8]) {
      const span = this._box(30, 1.3, 3, stone, 0, 13, z);
      // Retain the field bridge but expose the native enemy sightline in ATB.
      span.userData.keep = true; span.userData.combatOccluder = true;
      span.visible = this.mode !== 'combat'; this.combatOccluders.push(span);
      for (const x of [-7, 7]) this._pipe([x, 12, z], [x + .7, 1, z + 1.5], .2, dark);
    }
    this._crate(-10.6, 5.0, .8, 0x6b7964);
    this._cylinder(2.3, .8, dark, 0, .4, -20);
    const vigil = this._mesh(new THREE.IcosahedronGeometry(1.5, 2), new THREE.MeshBasicMaterial({ color: 0xb7d9a0, transparent: true, opacity: .32, wireframe: true }), 0, 2.8, -20);
    vigil.userData.keep = true; this.animations.push({ kind: 'globe', object: vigil }); this._circleCollider(0, -20, 2.2);
    this._ring(1.6, .025, 0x9ecbb3, 0, .9, -20);
    const light = new THREE.PointLight(0xc7efb2, 9, 14); light.position.set(0, 4, -20); this.stage.add(light);
    this._smoke(-15, -5, .7, false); this._smoke(16, 10, .8, false);
    this._grass(900, 0x688159);
  }

  _mergeStatic() {
    this.stage.updateMatrixWorld(true);
    const buckets = new Map(), old = [];
    this.stage.traverse(object => {
      if (!object.isMesh || object.isInstancedMesh || !object.geometry || Array.isArray(object.material) || object.material.transparent || object.material.wireframe) return;
      let p = object; while (p && p !== this.stage) { if (p.userData.keep) return; p = p.parent; }
      const key = object.material.uuid;
      if (!buckets.has(key)) buckets.set(key, { material: object.material, geometries: [] });
      const geometry = object.geometry.clone(); geometry.applyMatrix4(object.matrixWorld);
      if (geometry.index) buckets.get(key).geometries.push(geometry.toNonIndexed()); else buckets.get(key).geometries.push(geometry);
      if (geometry.index) geometry.dispose(); old.push(object);
    });
    for (const { material, geometries } of buckets.values()) {
      if (!geometries.length) continue;
      const geometry = mergeGeometries(geometries, false);
      for (const g of geometries) g.dispose();
      if (geometry) { const mesh = new THREE.Mesh(geometry, material); mesh.castShadow = true; mesh.receiveShadow = true; this.stage.add(mesh); }
    }
    for (const object of old) { object.parent?.remove(object); object.geometry.dispose(); }
  }

  setZone(zoneId, { party, cleared, stage, fromZone = null } = {}) {
    const zone = WORLD_ZONES[zoneId] || WORLD_ZONES.normandy;
    this.operationPois = [];
    this.zone = zone; this.zoneId = zone.id; this.levelLayout = getLevelLayout(zone.id); this.battleArena = null;
    this.stageState = stage; this.rand = randomGenerator(hash(zone.id));
    this.cleared = new Set(cleared instanceof Set ? cleared : Array.isArray(cleared) ? cleared : []);
    this._clearEffects(); this.animations = []; this.colliders = []; this.combatOccluders = []; this.walkableSurfaces = []; this.targetPath = null; this.pendingPOI = null; this._pendingProps = []; this._pendingVehicles = [];
    this.keys?.clear(); this.gamepadInput = { right: 0, forward: 0, sprint: false };
    this.setBattle(null);
    disposeObject(this.stage, true); this.stage.clear(); this.materialCache.clear();
    this.horizonFleetViews = new Map();
    this._lights(zone.theme);
    if (this.levelLayout?.renderer === 'horizon') buildHorizonScene(this, this.levelLayout);
    else if (this.levelLayout?.renderer === 'frontier') buildFrontierScene(this, this.levelLayout);
    else ({ normandy: () => this._normandy(), eden: () => this._eden(), citadel: () => this._citadel(false), therum: () => this._therum(), feros: () => this._feros(), noveria: () => this._noveria(), virmire: () => this._virmire(), ilos: () => this._ilos(), finale: () => this._citadel(true) }[zone.theme] || (() => this._eden()))();
    this._dressScene();
    // No interaction may be hidden inside scenery. Small placements yield to their authored approach area.
    this.colliders = this.colliders.filter(c => !this.getInteractivePOIs().some(p => this._insideCollider(p.x, p.z, c, .3)));
    this._installTacticalCover();
    this._mergeStatic(); this.player = getWorldArrival(zone.id, fromZone); this._resetTrail();
    this._syncHorizonFleet();
    this.cameraTarget.copy(this._cameraFocus(this.player, 'explore'));
    this.makoState = zone.id === 'therum' ? createMakoState(this.levelLayout?.vehicleSpawn || { x: -7.2, z: 16 }) : null;
    this.makoSprite = null; this._syncMakoSprite();
    this._makeMarkers(); this.setParty(party || this.party);
    if (this.zoneId !== 'normandy' || !this.storyContext) this._makeAmbientCharacters();
    this.camera.position.copy(this.cameraTarget).add(this.cameraOffset); this.camera.lookAt(this.cameraTarget); this.resize();
  }

  setCommanderAppearance(appearance = 'male') {
    const next = appearance === 'female' ? 'female' : 'male';
    if (this.commanderAppearance === next) return;
    const previousDefault = initialCustomization(this.commanderAppearance);
    const usedDefault = !this.commanderCustomization || JSON.stringify(this.commanderCustomization) === JSON.stringify(previousDefault);
    this._clearCommanderTextures();
    this.commanderAppearance = next;
    if (usedDefault) this.commanderCustomization = initialCustomization(next);
    const key = next === 'female' ? 'femshep' : 'shepard';
    for (const actor of [...this.actors, ...this.battleActors.values()]) {
      if (actor.id !== 'shepard' || actor.enemy) continue;
      actor.key = key; actor.group.userData.key = key; actor.body.userData.characterKey = key;
      actor.body.material.map = this._spriteTexture(key, false);
      actor.body.scale.set(1, 1, 1); actor.body.position.x = 0; actor.body.position.z = 0;
      this._applyCommanderCustomization(actor);
    }
  }

  setCommanderCustomization(customization) {
    const next = normalizeCustomization(customization, this.commanderAppearance);
    if (!next || JSON.stringify(next) === JSON.stringify(this.commanderCustomization)) return false;
    this._clearCommanderTextures(); this.commanderCustomization = next;
    for (const actor of [...this.actors, ...this.battleActors.values()]) this._applyCommanderCustomization(actor);
    return true;
  }

  _clearCommanderTextures() {
    for (const actor of [...this.actors, ...this.battleActors.values()]) {
      const source = actor.body?.material?.map?.userData?.relayCustomizationSource;
      if (source) actor.body.material.map = source;
    }
    for (const texture of this.customizationTextures?.values() || []) texture.dispose();
    this.customizationTextures?.clear();
  }

  _applyCommanderCustomization(actor) {
    if (actor.id !== 'shepard' || actor.enemy || !actor.body?.material?.map) return;
    const material = actor.body.material, source = material.map.userData?.relayCustomizationSource || material.map;
    const customization = this.commanderCustomization || initialCustomization(this.commanderAppearance);
    material.userData.commanderCustomization = customization;
    const inCombat = this.mode === 'combat';
    if (!hasVisualCustomization(customization, this.commanderAppearance, inCombat)) { material.map = source; return; }
    if (typeof document === 'undefined' || !source.image?.width || !source.image?.height) return;
    const direction = actor.state ? 'front' : actor.walkDirection || 'front';
    const rect = [
      Math.round(source.offset.x * source.image.width),
      Math.round((1 - source.offset.y - source.repeat.y) * source.image.height),
      Math.max(1, Math.round(source.repeat.x * source.image.width)),
      Math.max(1, Math.round(source.repeat.y * source.image.height)),
    ];
    const headRegion = source.userData?.relayAnimationFrame?.headRegion, headAxis = source.userData?.relayAnimationFrame?.headAxis;
    const headKey = Array.isArray(headRegion) ? headRegion.join(',') : '';
    const cacheKey = `${source.uuid}:${rect.join(',')}:${this.commanderAppearance}:${direction}:${inCombat}:${headKey}:${headAxis === 'x' ? 'x' : 'y'}`;
    this.customizationTextures ||= new Map();
    if (!this.customizationTextures.has(cacheKey)) {
      try {
        const canvas = document.createElement('canvas'); canvas.width = rect[2]; canvas.height = rect[3];
        canvas.getContext('2d').drawImage(source.image, ...rect, 0, 0, rect[2], rect[3]);
        const tinted = renderCustomizationSprite(canvas, customization, { appearance: this.commanderAppearance, direction, inCombat, headRegion, headAxis });
        const texture = new THREE.CanvasTexture(tinted); texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4; texture.magFilter = THREE.LinearFilter;
        texture.userData.relayCustomizationSource = source;
        this.customizationTextures.set(cacheKey, texture);
      } catch {
        // Keep the original art if a browser cannot read its canvas; retain a
        // diagnostic instead of replacing an actor with an invisible texture.
        if (!this.customizationRenderError) this.assetErrors?.push('La teinte du personnage n’a pas pu être générée.');
        this.customizationRenderError = true; material.map = source; return;
      }
    }
    material.map = this.customizationTextures.get(cacheKey);
  }

  setStoryContext(context = null) {
    const strings = value => [...new Set(Array.isArray(value) ? value.filter(item => typeof item === 'string') : [])];
    const assignmentContacts = [], contactIds = new Set(), bounds = WORLD_ZONES.citadel.bounds;
    for (const contact of Array.isArray(context?.assignmentContacts) ? context.assignmentContacts : []) {
      if (!contact || typeof contact.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(contact.id) || contactIds.has(contact.id)
        || typeof contact.label !== 'string' || !contact.label.trim() || typeof contact.speaker !== 'string' || !contact.speaker.trim()
        || typeof contact.assignmentId !== 'string' || !contact.assignmentId
        || !Number.isFinite(contact.x) || !Number.isFinite(contact.z)
        || contact.x < bounds.minX + .4 || contact.x > bounds.maxX - .4 || contact.z < bounds.minZ + .4 || contact.z > bounds.maxZ - .4) continue;
      contactIds.add(contact.id);
      assignmentContacts.push({
        id: contact.id, label: contact.label, speaker: contact.speaker, assignmentId: contact.assignmentId,
        x: contact.x, z: contact.z, ...(typeof contact.portrait === 'string' ? { portrait: contact.portrait } : {}),
      });
    }
    const next = context && typeof context === 'object' ? {
      recruited: strings(context.recruited), lost: strings(context.lost), completed: strings(context.completed),
      visitedZones: strings(context.visitedZones ?? context.story?.visitedZones), cleared: strings(context.cleared),
      flags: { jenkinsLost: context.flags?.jenkinsLost === true, briefed:context.flags?.briefed===true, spectre:context.flags?.spectre===true },
      operations:{records:{'feros-varrens':{stage:Number.isInteger(context.operations?.records?.['feros-varrens']?.stage)?context.operations.records['feros-varrens'].stage:0}}},
      advanceFeros: normalizeAdvanceFerosState(context.advanceFeros,context),
      assignmentContacts,
      ...(context.mediaId !== undefined ? {mediaId:context.mediaId} : {}),
      ...(context.periodId !== undefined ? {periodId:context.periodId} : {}),
      ...(context.context !== undefined ? {context:{mediaId:context.context?.mediaId,periodId:context.context?.periodId}} : {}),
    } : null;
    if(next) next.advanceFerosPresence=Object.fromEntries([...FEROS_COLONIST_TARGETS.map(target=>target.id),'fai-dan','shiala']
      .map(id=>[id,advanceFerosCivilianAlive(context,id)]));
    if (next?.flags.jenkinsLost && !next.lost.includes('jenkins')) next.lost.push('jenkins');
    if (JSON.stringify(next) === JSON.stringify(this.storyContext)) return;
    this.storyContext = next;
    if (!this._vehicleInPeriod() && this.isVehicleMounted()) this._dismountVehicle();
    if (this.makoSprite) this.makoSprite.group.visible=this.mode!=='combat'&&this._vehicleInPeriod();
    if (!this.zone) return;
    if (this.pendingPOI && !this.getInteractivePOIs().some(poi => poi.id === this.pendingPOI.id)) {
      this.pendingPOI = null; this.targetPath = null;
    }
    this.setParty(this.party);
    this._makeMarkers();
    if (this.zoneId !== 'normandy') this._makeAmbientCharacters();
    this._syncHorizonFleet();
  }

  _makeActor(key, id, enemy = false, parent = this.characters) {
    if (id === 'shepard' && !enemy) key = this.commanderAppearance === 'female' ? 'femshep' : 'shepard';
    const group = new THREE.Group(); group.userData.actorId = id; group.userData.key = key;
    const boss = BOSS_KEYS.includes(key), large = ['wrex', 'krogan', 'geth-destroyer', 'thorian', 'saren-final','armature','colossus','battlemaster'].includes(key);
    const height = HORIZON_ENEMY_HEIGHTS[key] || (key === 'thorian' ? 5.4 : key === 'saren-final' ? 3.6 : large ? 3.25 : key === 'rachni' ? 2.45 : 2.85);
    const material = new THREE.MeshBasicMaterial({ map: this._spriteTexture(key, enemy), transparent: true, alphaTest: .2, depthWrite: true, side: THREE.DoubleSide, toneMapped: false });
    const body = new THREE.Mesh(new THREE.PlaneGeometry(boss ? height * (2 / 3) : large ? 2.55 : 2.1, height), material); body.position.y = height / 2 + .05;
    body.userData.characterKey = key; body.userData.enemy = enemy; group.add(body);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(large ? .67 : .46, 24), new THREE.MeshBasicMaterial({ color: 0x020a10, transparent: true, opacity: .28, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = .035; group.add(shadow);
    const statusShell = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), new THREE.MeshBasicMaterial({ color: 0xa69cea, transparent: true, opacity: .18, wireframe: true, depthWrite: false }));
    statusShell.scale.set(large ? 1.35 : 1.05, height * .6, .8); statusShell.position.y = height * .48; statusShell.visible = false; group.add(statusShell);
    const actor = { id, key, enemy, group, body, shadow, statusShell, height, alive: true, poseTime: 0, lastHp: null, lastShield: null };
    this._applyCommanderCustomization(actor);
    parent.add(group); return actor;
  }

  setParty(party = []) {
    const members = party.length ? party : ['shepard'];
    this.party = this.storyContext ? members.filter(member => {
      const id = typeof member === 'string' ? member : member.id;
      return id === 'shepard' || this.storyContext.recruited.includes(id) && !this.storyContext.lost.includes(id);
    }) : members;
    if (!this.party.length) this.party = ['shepard'];
    const conversations = this.getConversationPOIs();
    for (const actor of this.actors) { this.characters.remove(actor.group); disposeObject(actor.group); }
    this.actors = this.party.slice(0, 3).map((member, i) => {
      const key = typeof member === 'string' ? member : member.sprite || member.id || 'shepard';
      const actor = this._makeActor(key, typeof member === 'string' ? member : member.id || key);
      actor.stationPosition = conversations.find(poi => poi.conversationId === actor.id)?.actorPosition;
      const levelPoint = this.levelLayout ? this.trail[Math.min(this.trail.length - 1, i * 11)] || this.player : null;
      actor.group.position.set(actor.stationPosition?.x ?? levelPoint?.x ?? this.player.x + (i === 1 ? -1.2 : i === 2 ? 1.2 : 0), 0,
        actor.stationPosition?.z ?? levelPoint?.z ?? this.player.z + i * .8);
      this._groundActor(actor);
      actor.group.visible = this.mode !== 'combat' && !this.isVehicleMounted(); return actor;
    });
    if (this.zoneId === 'normandy' && this.storyContext) this._makeAmbientCharacters();
  }

  _makeAmbientCharacters() {
    for (const actor of this.ambientActors || []) { this.characters.remove(actor.group); disposeObject(actor.group); this._releaseAmbientActorTextures(actor); }
    this.ambientActors = [];
    for (const p of this.zone.pois) {
      if (p.type === 'encounter' && !this.cleared.has(p.id)) {
        const suffix=p.id.slice(this.zoneId.length+1), index=['encounter-1','encounter-2','boss'].indexOf(suffix);
        const key=ENEMIES[ENCOUNTERS[this.zoneId]?.[index]?.[0]]?.sprite || 'geth';
        const actor = this._makeActor(key, `ambient:${p.id}`, true); actor.poiId = p.id; actor.group.position.set(p.x + .8, 0, p.z - .8); actor.group.visible = this.mode !== 'combat'; this.ambientActors.push(actor);
      }
    }
    if (this.zoneId === 'citadel') for (const [suffix, key] of [['encounter-1', 'garrus'], ['encounter-2', 'tali'], ['boss', 'wrex']]) {
      if (this.storyContext && (this.storyContext.recruited.includes(key) || this.storyContext.lost.includes(key))) continue;
      const p = this.zone.pois.find(x => x.id === `citadel:${suffix}`); if (!p) continue;
      const actor = this._makeActor(key, `ambient:${p.id}`); actor.group.position.set(p.x + .9, 0, p.z - .8); actor.group.visible = this.mode !== 'combat'; this.ambientActors.push(actor);
    }
    const npcs = this.zoneId === 'normandy'
      ? [...(!this.storyContext ? [['chakwas', 5.2, 10.5], ['joker', .5, -15.3]] : []), ...(!this.cleared.has('eden-prime:boss') ? [['anderson', -5.2, -3.8]] : [])]
      : this.zoneId === 'citadel' ? [['anderson', .8, 11.2], ['udina', 1.1, -17.9]]
      : this.zoneId === 'virmire' ? [['kirrahe', this.levelLayout?.campNPC?.x ?? .8, this.levelLayout?.campNPC?.z ?? 11.2]] : [];
    for (const [key, x, z] of npcs) {
      const actor = this._makeActor(key, `npc:${key}`);
      if (key === 'joker' && this.zoneId === 'normandy') actor.stationRole = 'normandy-pilot';
      actor.group.position.set(x, 0, z); actor.group.visible = this.mode !== 'combat'; this.ambientActors.push(actor);
    }
    const active = new Set(this.actors.map(actor => actor.id));
    for (const poi of this.getConversationPOIs()) {
      if (active.has(poi.characterId)) continue;
      if (this._hasAdvanceFerosCivilians() && FEROS_COLONIST_TARGETS.some(target=>target.characterKey===poi.characterId)) continue;
      const actor = this._makeActor(poi.characterId, `npc:${poi.characterId}`);
      if (poi.characterId === 'joker' && this.zoneId === 'normandy') actor.stationRole = 'normandy-pilot';
      actor.conversationId = poi.conversationId; actor.poiId = poi.id;
      actor.group.position.set(poi.actorPosition.x, 0, poi.actorPosition.z);
      actor.group.visible = this.mode !== 'combat'; this.ambientActors.push(actor);
    }
    const scope=this._horizonCampaignContext(),fauna=scope&&{...scope,zoneId:this.zoneId,campaignState:this._horizonPresenceContext()};
    const placements=this.zoneId==='eden-prime'?[['gasbag-me1','gasbag-me1',-34,39],['gasbag-me1','gasbag-me1',-28,31]]
      :this.zoneId==='feros'?[['varren-me1','varren',9,26],['varren-me1','varren',15,27],['alpha-varren-me1','alpha-varren',12,23]]:[];
    placements.forEach(([id,key,x,z],index)=>{if(!fauna||!horizonFaunaVisible(id,fauna))return;const actor=this._makeActor(key,`fauna:${id}:${index}`,false);actor.faunaId=id;actor.faunaIndex=index;actor.group.position.set(x,0,z);actor.group.visible=this.mode!=='combat';this.ambientActors.push(actor);this._applyHorizonFaunaBody(actor);});
    this._syncAdvanceFerosCivilianBodies();
  }

  _hasAdvanceFerosCivilians() {
    const p=this.storyContext?.advanceFeros;
    return this.zoneId==='feros'&&!!this._horizonCampaignContext()&&p&&!p.legacy&&p.gasIssued;
  }

  _advanceFerosCivilianAlive(id) {
    return this.storyContext?.advanceFerosPresence?.[id]??null;
  }

  _syncAdvanceFerosCivilianBodies() {
    const retained=[];
    for(const actor of this.ambientActors||[]) {
      if(!actor.advanceFerosCivilian){retained.push(actor);continue;}
      this.characters.remove(actor.group);disposeObject(actor.group);this._releaseAmbientActorTextures(actor);
    }
    this.ambientActors=retained;
    if(!this._hasAdvanceFerosCivilians())return;
    for(const target of FEROS_COLONIST_TARGETS) {
      if(!this._advanceFerosCivilianAlive(target.id))continue;
      const poi=this.operationPois?.find(point=>point.advanceFeros&&point.targetId===target.id);
      const position=poi||target,key=target.characterKey||'emily';
      const actor=this._makeActor(key,`civilian:feros:${target.id}`);
      actor.advanceFerosCivilian=target.id;actor.conversationId=target.characterKey||null;
      actor.group.userData.presentation=target.characterKey?'retained-horizon-civilian':'generic-civilian-prototype';
      actor.group.userData.civilianLabel=target.name;
      const offset={x:position.x+.6,z:position.z+.6},resolved=this._walkable(offset.x,offset.z)?offset:position;
      actor.group.position.set(resolved.x,0,resolved.z);this._groundActor(actor);
      actor.group.visible=this.mode!=='combat';this.ambientActors.push(actor);this._applyHorizonNPCBody(actor);
    }
  }

  _makeMarkers() {
    disposeObject(this.markers); this.markers.clear(); this.labels.replaceChildren(); this.poiViews = [];
    for (const poi of this.getInteractivePOIs()) {
      const group = new THREE.Group(); group.position.set(poi.x, .08, poi.z); this.markers.add(group);
      const color = COLORS[poi.type] || 0x9ac8dd;
      const ring = new THREE.Mesh(new THREE.RingGeometry(.62, .69, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; group.add(ring);
      const inner = new THREE.Mesh(new THREE.CircleGeometry(.57, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .07, depthWrite: false })); inner.rotation.x = -Math.PI / 2; inner.position.y = -.01; group.add(inner);
      const glyph = poi.type === 'encounter' ? '!' : poi.type === 'exit' ? '↗' : poi.type === 'dialogue' ? '••' : poi.type === 'objective' ? '◇' : '≡';
      const texture = canvasTexture(128, 128, (c, w, h) => { c.fillStyle = '#0b1b29'; c.beginPath(); c.arc(w / 2, h / 2, 47, 0, TAU); c.fill(); c.strokeStyle = `#${color.toString(16).padStart(6, '0')}`; c.lineWidth = 3; c.stroke(); c.fillStyle = c.strokeStyle; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '600 57px sans-serif'; c.fillText(glyph, w / 2, h / 2 - 1); });
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false }); material.userData.ownedMap = true;
      const icon = new THREE.Sprite(material); icon.scale.set(.67, .67, .67); icon.position.y = 3.9; icon.userData.poi = poi; group.add(icon);
      const label = document.createElement('div'); label.textContent = poi.label;
      Object.assign(label.style, { position: 'absolute', padding: '6px 9px', color: '#dceaf1', font: '500 10px/1.2 Inter,system-ui,sans-serif', letterSpacing: '.07em', textTransform: 'uppercase', whiteSpace: 'nowrap', background: 'rgba(6,17,28,.88)', border: '1px solid rgba(146,185,208,.23)', borderRadius: '3px', opacity: '0', transform: 'translate(-50%,-100%)', transition: 'opacity 180ms', boxShadow: '0 3px 15px #0005' });
      this.labels.appendChild(label); this.poiViews.push({ poi, group, ring, icon, label });
    }
    this.setCleared(this.cleared);
  }

  setCleared(ids = []) {
    this.cleared = new Set(ids instanceof Set ? ids : Array.isArray(ids) ? ids : []);
    for (const view of this.poiViews || []) { const hidden = this.cleared.has(view.poi.id) && view.poi.type === 'encounter' || view.poi.horizonNPC&&!horizonNPCVisible(this._horizonPresenceContext(),view.poi.horizonNPC); view.group.visible = !hidden && this.mode !== 'combat'; if (hidden) view.label.style.opacity = '0'; }
    for (const actor of this.ambientActors || []) actor.group.visible=this._ambientActorVisible(actor);
    if(this.pendingPOI&&!this.getInteractivePOIs().some(p=>p.id===this.pendingPOI.id)){this.pendingPOI=null;this.targetPath=null;}
  }

  _ambientActorVisible(actor) {
    if(this.mode==='combat'||actor.poiId&&this.cleared.has(actor.poiId))return false;
    if(actor.advanceFerosCivilian)return !!this._hasAdvanceFerosCivilians()&&this._advanceFerosCivilianAlive(actor.advanceFerosCivilian)===true;
    if(this.zoneId==='feros'&&this._advanceFerosCivilianAlive(actor.key)===false)return false;
    if(getHorizonNPC(actor.key))return horizonNPCVisible(this._horizonPresenceContext(),actor.key);
    if(actor.faunaId){const scope=this._horizonCampaignContext();return !!scope&&horizonFaunaVisible(actor.faunaId,{...scope,zoneId:this.zoneId,campaignState:this._horizonPresenceContext()});}
    return true;
  }

  setMode(mode) {
    this.mode = mode; if (mode !== 'explore') { this.gamepadInput = {right:0,forward:0,sprint:false}; this.keys.clear(); this.targetPath = null; this.pendingPOI = null; }
    if (this.makoSprite) this.makoSprite.group.visible = mode !== 'combat' && this._vehicleInPeriod();
    for (const object of this.combatOccluders) {
      const scenery = object.userData.levelScenery, arena = this.battleArena || this.zone.arena;
      object.visible = mode !== 'combat' || !!this.levelLayout && !!scenery && Math.hypot(scenery.x - arena.x, scenery.z - arena.z) > 24;
    }
    for (const actor of this.actors) actor.group.visible = mode !== 'combat' && !this.isVehicleMounted();
    for (const actor of this.ambientActors || []) actor.group.visible = this._ambientActorVisible(actor);
    this._syncHorizonFleet();
    for (const actor of this.battleActors.values()) actor.group.visible = mode === 'combat' && actor.state?.bossPhaseRetired !== true;
    for (const actor of [...this.actors, ...this.battleActors.values()]) this._applyCommanderCustomization(actor);
    const activePOIIds=new Set(this.poiViews?.length?this.getInteractivePOIs().map(poi=>poi.id):[]);
    for (const view of this.poiViews || []) { view.group.visible = mode !== 'combat' && activePOIIds.has(view.poi.id) && !(view.poi.type === 'encounter' && this.cleared.has(view.poi.id)); if (mode !== 'explore') view.label.style.opacity = '0'; }
  }

  getCombatArena() {
    return this.levelLayout ? Object.values({...this.levelLayout.arenas,...this.levelLayout.sideArenas}).reduce((best, arena) =>
      Math.hypot(arena.x - this.player.x, arena.z - this.player.z) < Math.hypot(best.x - this.player.x, best.z - this.player.z) ? arena : best,
    this.zone.arena) : this.zone.arena;
  }

  _installTacticalCover() {
    this.tacticalCoverPlacements = [];
    if (!ENCOUNTERS[this.zoneId]) return;
    const arenas = this.levelLayout ? Object.values({ ...this.levelLayout.arenas, ...this.levelLayout.sideArenas }) : [this.zone.arena];
    const placed = new Set(), points = this.getInteractivePOIs();
    for (const arena of arenas) for (const x of [-1.7, 1.7]) for (const z of [-2.9, 2.9]) {
      const point = { x: arena.x + x, z: arena.z + z }, key = `${point.x}:${point.z}`;
      if (placed.has(key) || points.some(poi => Math.hypot(poi.x - point.x, poi.z - point.z) < 1.7)) continue;
      if (![[0,0],[-.7,-.6],[-.7,.6],[.7,-.6],[.7,.6]].every(([dx,dz]) => this._walkable(point.x + dx, point.z + dz))) continue;
      this._crate(point.x, point.z, .8, this.zone.theme === 'noveria' ? 0x62788b : this.zone.theme === 'ilos' ? 0x526b5c : 0x64716c);
      placed.add(key);this.tacticalCoverPlacements.push({ ...point, width: 1.2, depth: .92, height: .96 });
    }
  }

  getTacticalCoverState({ position, opponentPositions = [] } = {}, arena = this.battleArena || this.getCombatArena()) {
    if (!position || !arena) return { available: false, protectedFrom: [], reason: 'Position de couverture indisponible.' };
    return geometricCover({ position: { x: arena.x + position.x, z: arena.z + position.z },
      opponentPositions: opponentPositions.map(point => ({ id: point.id, x: arena.x + point.x, z: arena.z + point.z })), solids: this.colliders });
  }

  getRetreatPoint(encounter) {
    const position = getTacticalPosition(this.battle, 'shepard'), arena = this.battleArena || this.getCombatArena();
    const start = position ? { x: arena.x + position.x, z: arena.z + position.z } : this.getPosition();
    return findRetreatPoint({ start, encounter, spawn: this.zone.spawn,
      encounters: this.getInteractivePOIs().filter(poi => poi.type === 'encounter' && !this.cleared.has(poi.id)),
      isWalkable: (x, z) => this._walkable(x, z), findPath: destination => findLevelPath({ bounds: this.zone.bounds, start, destination, isWalkable: (x, z) => this._walkable(x, z) }) });
  }

  setBattle(battle) {
    if (battle && this.isVehicleMounted()) this._dismountVehicle();
    if (battle && battle !== this.battle) this.battleArena = this.getCombatArena();
    this.battle = battle;
    if (!battle) { for (const actor of this.battleActors.values()) { this.characters.remove(actor.group); disposeObject(actor.group); this._releaseBattleActorTextures(actor); } this.battleActors.clear(); this.battleArena = null; return; }
    const entries = battle.actors || [...(battle.party || []).map(a => ({ ...a, team: 'party' })), ...(battle.enemies || []).map(a => ({ ...a, team: 'enemy' }))];
    const active = new Set(entries.map(a => a.id));
    for (const [id, actor] of this.battleActors) if (!active.has(id)) { this.characters.remove(actor.group); disposeObject(actor.group); this._releaseBattleActorTextures(actor); this.battleActors.delete(id); }
    let partyIndex = 0, enemyIndex = 0;
    const enemySpacing=entries.some(entry=>entry.team==='enemy'&&['armature','colossus'].includes(entry.sprite))?5.6:2.9;
    for (const state of entries) {
      const enemy = state.team === 'enemy', index = enemy ? enemyIndex++ : partyIndex++;
      const key = state.sprite || state.id || (enemy ? 'geth' : 'shepard');
      let actor = this.battleActors.get(state.id);
      if (!actor) { actor = this._makeActor(key, state.id, enemy); this.battleActors.set(state.id, actor); }
      const arena = this.battleArena || this.zone.arena;
      const tactical = getTacticalPosition(battle, state.id);
      actor.basePosition = tactical
        ? new THREE.Vector3(arena.x + tactical.x, 0, arena.z + tactical.z)
        : new THREE.Vector3(arena.x + (enemy ? 4.0 + (index % 2) * .7 : -3.5 - (index % 2) * .5), 0, arena.z + (index - 1) * (enemy?enemySpacing:2.9));
      if (actor.lastHp === null) actor.group.position.copy(actor.basePosition);
      this._groundActor(actor);
      if (actor.lastHp !== null && state.hp < actor.lastHp) { actor.poseTime = .35; this._impact(actor.group.position.clone().add(new THREE.Vector3(0, 1.3, 0)), enemy ? 0xffae79 : 0xf0c7a7); }
      if (actor.lastShield !== null && state.shield < actor.lastShield) actor.shieldFlash = .35;
      const animationAllowed = !!this._combatAnimationConfig(actor, state);
      if (animationAllowed && actor.alive !== (state.hp > 0)
        || GUARDED_COMBAT_ANIMATION_IDS.includes(actor.key) && actor.animationAllowed !== animationAllowed) {
        actor.combatPose = null; actor.combatPoseTime = 0;
      }
      actor.animationAllowed = animationAllowed;
      actor.alive = state.hp > 0; actor.state = state; actor.lastHp = state.hp; actor.lastShield = state.shield;
      actor.body.material.opacity = actor.alive ? 1 : .32; actor.group.visible = this.mode === 'combat' && state.bossPhaseRetired !== true;
      actor.body.rotation.z = actor.alive ? 0 : -.9;
    }
  }

  playEvent(event) {
    if (!event) return;
    const source = this.battleActors.get(event.actorId || event.sourceId || event.actor), target = this.battleActors.get(event.targetId || event.target);
    const type = String(event.type || event.kind || '').toLowerCase();
    const action = String(event.actionId || event.power || '').toLowerCase();
    if (source) {
      source.poseTime = .3;
      const posed = this._combatAnimationConfig(source);
      const canShowAction = !posed || source.alive && !(source.combatPose === 'hit' && source.combatPoseTime > 0);
      if (type === 'action' && canShowAction) { source.combatPose = ['shoot', 'burst', 'signature'].includes(action) ? 'aim' : 'power'; source.combatPoseTime = .7; }
    }
    if (target) {
      target.poseTime = .24;
      if (type === 'damage' && (!this._combatAnimationConfig(target) || target.alive)) { target.combatPose = 'hit'; target.combatPoseTime = .4; }
    }
    if (this.visualAccessibility?.particles === false) return;
    if (type === 'heal' || type === 'revive' || ['medigel', 'unity', 'barrier', 'cover', 'reposition'].includes(action)) {
      const actor = target || source; if (actor) this._impact(actor.group.position.clone().add(new THREE.Vector3(0, 1.1, 0)), ['medigel', 'unity'].includes(action) || type === 'heal' ? 0x84e3bb : 0x80bddd, 1.5);
      return;
    }
    if (source && target && type === 'action' && source !== target) {
      const fromHeight=['armature','colossus'].includes(source.key)?source.height*.62:1.4,toHeight=['armature','colossus'].includes(target.key)?target.height*.62:1.2;
      const from = source.group.position.clone().add(new THREE.Vector3(0, fromHeight, 0)), to = target.group.position.clone().add(new THREE.Vector3(0, toHeight, 0));
      const biotic = /biotic|warp|lift|throw|singularity|stasis/.test(action), tech = /tech|overload|sabotage|hack/.test(action);
      const color = action === 'acid' ? 0xb6d16d : biotic ? 0xa9a2ff : tech ? 0x7ee5ed : 0xffcf96;
      if (action === 'strike') { source.group.position.add(to.clone().sub(from).normalize().multiplyScalar(.8)); this._impact(to, 0xf3b391, 1.3); return; }
      if (['shoot', 'burst', 'signature'].includes(action) && this._weaponTraces(source.state, from, to, action)) return;
      const line = new THREE.Mesh(new THREE.CylinderGeometry(biotic ? .13 : .045, biotic ? .13 : .045, from.distanceTo(to), 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .9, depthWrite: false }));
      line.position.copy(from).add(to).multiplyScalar(.5); line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
      this.particles.add(line); this.effects.push({ object: line, time: .18, max: .18, kind: 'beam' }); this._impact(to, color, biotic ? 1.8 : 1);
    } else if (target && ['damage', 'blocked', 'resist', 'status'].includes(type)) this._impact(target.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)), ['blocked','resist'].includes(type) ? 0xb0a2e4 : 0xf5b282);
  }

  _weaponTraces(state, from, to, action) {
    const weaponType = state?.weaponType;
    if (typeof weaponType !== 'string' || !Object.hasOwn(WEAPON_TRACE_STYLES, weaponType)) return false;
    const style = WEAPON_TRACE_STYLES[weaponType], burst = action === 'burst', signature = action === 'signature';
    const count = style.count + (burst ? style.burstExtra : 0);
    const direction = to.clone().sub(from).normalize();
    const side = new THREE.Vector3(-direction.z, 0, direction.x);
    if (side.lengthSq() < .000001) side.set(1, 0, 0); else side.normalize();
    const up = new THREE.Vector3().crossVectors(direction, side).normalize();
    for (let i = 0; i < count; i++) {
      const offset = count === 1 ? 0 : (i / (count - 1) * 2 - 1) * style.spread;
      const start = from.clone(), end = to.clone();
      if (weaponType === 'shotgun') {
        end.addScaledVector(side, offset).addScaledVector(up, Math.abs(offset) * .3);
      } else if (count > 1) {
        start.addScaledVector(side, offset); end.addScaledVector(side, offset);
      }
      const radius = style.radius * (signature ? 1.25 : 1);
      const duration = style.duration * (signature ? 1.3 : burst ? 1.15 : 1) + i * .012;
      const line = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, start.distanceTo(end), 6), new THREE.MeshBasicMaterial({ color: style.color, transparent: true, opacity: .9, depthWrite: false }));
      line.position.copy(start).add(end).multiplyScalar(.5);
      line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
      line.userData.weaponType = weaponType; line.userData.actionId = action;
      if (typeof state.weaponName === 'string') line.userData.weaponName = state.weaponName;
      this.particles.add(line); this.effects.push({ object: line, time: duration, max: duration, kind: 'weapon-trace' });
    }
    this._impact(to, style.color, signature ? 1.25 : 1);
    return true;
  }

  _impact(position, color, size = 1) {
    if (this.visualAccessibility?.particles === false) return;
    const ring = new THREE.Mesh(new THREE.SphereGeometry(.3 * size, 12, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .7, wireframe: true, depthWrite: false })); ring.position.copy(position); this.particles.add(ring);
    this.effects.push({ object: ring, time: .42, max: .42, kind: 'impact' });
  }
  _clearEffects() { for (const fx of this.effects) { this.particles.remove(fx.object); disposeObject(fx.object); } this.effects = []; }

  getPosition() { return { x: this.player.x, z: this.player.z }; }
  _resetTrail() {
    if (this.levelLayout) {
      const formation = [{ ...this.player }], choices = [[-1.1, .7], [1.1, 1.1]];
      for (let member = 0; member < 2; member++) {
        const offsets = [choices[member], ...Array.from({ length: 16 }, (_, i) => [Math.cos(i / 16 * TAU) * 1.35, Math.sin(i / 16 * TAU) * 1.35])];
        const next = offsets.map(([dx, dz]) => ({ x: this.player.x + dx, z: this.player.z + dz }))
          .find(point => this._walkable(point.x, point.z) && formation.every(other => Math.hypot(point.x - other.x, point.z - other.z) >= .7));
        formation.push(next || { ...this.player });
      }
      this.trail = Array.from({ length: 32 }, (_, i) => ({ ...formation[Math.min(2, Math.floor(i / 11))] })); return;
    }
    this.trail = Array.from({ length: 32 }, (_, i) => ({
      x: this.player.x,
      z: clamp(this.player.z + i * .13, this.zone.bounds.minZ + .5, this.zone.bounds.maxZ - .5),
    }));
  }

  _resolveLevelPosition(position) {
    const layout = this.levelLayout;
    if (!layout || !position || ![position.x, position.z].every(Number.isFinite)) return null;
    if (this._walkable(position.x, position.z)) return { x: position.x, z: position.z };
    const nearest = nearestLevelGround(layout, position);
    if (nearest && this._walkable(nearest.x, nearest.z)) return nearest;
    const origins = [nearest, ...layout.rooms.map(room => room.center), layout.spawn].filter(Boolean), candidates = [];
    for (const origin of origins) {
      for (let radius = 0; radius <= 9; radius += .75) for (let i = 0; i < (radius ? 16 : 1); i++) {
        const angle = i / 16 * TAU, x = origin.x + Math.cos(angle) * radius, z = origin.z + Math.sin(angle) * radius;
        if (this._walkable(x, z)) candidates.push({ x, z });
      }
    }
    return candidates.sort((a, b) => Math.hypot(a.x - position.x, a.z - position.z) - Math.hypot(b.x - position.x, b.z - position.z))[0] || null;
  }

  setPosition(position = {}) {
    if (!Number.isFinite(position.x) || !Number.isFinite(position.z)) return;
    const b = this.zone.bounds, recovered = this.levelLayout ? this._resolveLevelPosition(position) : null;
    if (this.levelLayout && !recovered) return false;
    const x = recovered?.x ?? clamp(position.x, b.minX + .5, b.maxX - .5), z = recovered?.z ?? clamp(position.z, b.minZ + .5, b.maxZ - .5);
    if (!this._walkable(x, z)) return;
    if (this.levelLayout) this.lastPositionRecovery = { requested: { x: position.x, z: position.z }, resolved: { x, z }, changed: x !== position.x || z !== position.z };
    this.player = { x, z }; this._resetTrail(); this.targetPath = null;
    this.actors.forEach((actor, i) => {
      const point = this.levelLayout ? this.trail[Math.min(this.trail.length - 1, i * 11)] : null;
      actor.group.position.set(actor.stationPosition?.x ?? point?.x ?? x, 0, actor.stationPosition?.z ?? point?.z ?? z + i * .8);
      this._groundActor(actor);
    });
    this.cameraTarget?.copy(this._cameraFocus(this.player, 'explore'));
    if (this.levelLayout) return true;
  }
  getBounds() { return { ...this.zone.bounds }; }
  getMapCollisions() { return mapCollisionFootprints(this.colliders); }
  getPOIs() { return this.zone.pois.map(poi => ({ ...poi, cleared: this.cleared.has(poi.id) })); }
  getConversationPOIs() {
    const context = this.storyContext;
    if (!context) return [];
    return (this.zone.conversationPois || []).filter(poi => {
      const id = poi.conversationId;
      if (poi.frontierNPC) return frontierNPCVisible({...context,zone:this.zoneId},poi.frontierNPC);
      if (poi.horizonNPC) return horizonNPCVisible(this._horizonPresenceContext(),poi.horizonNPC);
      if (this.zoneId !== 'normandy') return false;
      if (context.lost.includes(id)) return false;
      if (id === 'joker' || id === 'chakwas') return true;
      if (id === 'nihlus') return !context.visitedZones.includes('eden-prime') && !context.completed.includes('eden-prime') && !context.flags.jenkinsLost;
      return context.recruited.includes(id);
    }).filter(poi => this.zoneId!=='feros'||this._advanceFerosCivilianAlive(poi.characterId)!==false)
      .filter(poi=>!this._hasAdvanceFerosCivilians()||!FEROS_COLONIST_TARGETS.some(target=>target.characterKey===poi.characterId)
        ||this.storyContext.advanceFeros.colonists[poi.characterId]!==null)
      .map(poi => {
        const target=this._hasAdvanceFerosCivilians()&&FEROS_COLONIST_TARGETS.find(item=>item.characterKey===poi.characterId);
        return {...poi,...(target?{x:target.x,z:target.z,actorPosition:{x:target.x+.6,z:target.z+.6}}:{}),cleared:false};
      });
  }
  getInteractivePOIs() {
    const pois = this.getPOIs().filter(poi => {
      const recruit = this.zoneId === 'citadel' && CITADEL_RECRUITS[poi.id];
      return !recruit || !this.storyContext || !this.storyContext.recruited.includes(recruit) && !this.storyContext.lost.includes(recruit);
    });
    return [...pois, ...this.getConversationPOIs(), ...this.getAssignmentPOIs(), ...this.getFaunaPOIs(), ...(this.operationPois || [])];
  }
  getFaunaPOIs() {
    const scope=this._horizonCampaignContext();if(!scope)return [];
    return (this.zone.faunaPois||[]).filter(p=>horizonFaunaVisible(p.faunaId,{...scope,zoneId:this.zoneId,campaignState:this._horizonPresenceContext()})).map(p=>({...p,cleared:false}));
  }
  getAssignmentPOIs() {
    if (this.zoneId !== 'citadel') return [];
    // These contacts currently have named interaction markers, not reviewed character assets.
    return (this.storyContext?.assignmentContacts || []).map(contact => ({
      id: `citadel:assignment-${contact.id}`, type: 'dialogue', label: contact.label,
      assignmentContactId: contact.id, assignmentId: contact.assignmentId, speaker: contact.speaker,
      x: contact.x, z: contact.z, cleared: false,
      ...(contact.portrait ? { portrait: contact.portrait } : {}),
    }));
  }
  /** Place optional markers on reachable ground without removing scenery collisions. */
  setOperationPOIs(pois = []) {
    this.operationPois = [];
    const occupied = this.getInteractivePOIs();
    for (const source of pois) {
      if (!source || source.zone !== this.zoneId || !Number.isFinite(source.x) || !Number.isFinite(source.z)) continue;
      const anchor = (this.levelLayout?.operationAnchors || this.zone.operationAnchors)?.[source.operationId]?.[source.stepId] || source;
      const candidates = [{ x: anchor.x, z: anchor.z }];
      for (let radius = .9; radius <= 7.2; radius += .9) for (let angle = 0; angle < TAU; angle += Math.PI / 6)
        candidates.push({ x: anchor.x + Math.cos(angle) * radius, z: anchor.z + Math.sin(angle) * radius });
      const spot = candidates.find(point => this._walkable(point.x, point.z)
        && occupied.every(other => Math.hypot(other.x - point.x, other.z - point.z) >= 1.8)
        && this._pathTo(point)?.length);
      if (!spot) { this.assetErrors?.push(`Point inaccessible : ${source.id}`); continue; }
      const poi = { ...source, ...spot, type: source.missionId ? 'objective' : 'operation', cleared: false };
      this.operationPois.push(poi); occupied.push(poi);
    }
    if (this.pendingPOI && !this.getInteractivePOIs().some(poi => poi.id === this.pendingPOI.id)) {
      this.pendingPOI = null; this.targetPath = null;
    }
    this._makeMarkers();
    this._syncAdvanceFerosCivilianBodies();
  }

  getNearby() {
    if (this.isVehicleMounted()) return null;
    let nearest = null, distance = 2.65;
    for (const poi of this.getInteractivePOIs()) { if (poi.type === 'encounter' && this.cleared.has(poi.id)) continue; const d = Math.hypot(this.player.x - poi.x, this.player.z - poi.z); if (d < distance) { distance = d; nearest = poi; } }
    return nearest ? { ...nearest, distance } : null;
  }
  interact() {
    if (this.mode !== 'explore') return null;
    if (this.isVehicleMounted()) return null;
    const poi = this.getNearby(); if (!poi) return null;
    this.targetPath = null; this.pendingPOI = null;
    if (poi.type === 'encounter' && this.onEncounter) this.onEncounter(poi); else this.onInteract?.(poi);
    return poi;
  }

  _insideCollider(x, z, collider, padding = .36) {
    if (collider.kind === 'circle') return Math.hypot(x - collider.x, z - collider.z) < collider.radius + padding;
    return x > collider.minX - padding && x < collider.maxX + padding && z > collider.minZ - padding && z < collider.maxZ + padding;
  }
  _walkable(x, z) {
    const b = this.zone.bounds; if (x < b.minX + .4 || x > b.maxX - .4 || z < b.minZ + .4 || z > b.maxZ - .4) return false;
    if (this.levelLayout && !isLevelGround(this.levelLayout, x, z)) return false;
    return !this.colliders.some(c => this._insideCollider(x, z, c));
  }

  _pathTo(destination) {
    if (this.isVehicleMounted()) return findLevelPath({ bounds: this.zone.bounds, start: this.player, destination, isWalkable: (x,z) => this._vehicleGround(x,z,1.45) });
    if (this.levelLayout) return findLevelPath({ bounds: this.zone.bounds, start: this.player, destination, isWalkable: (x, z) => this._walkable(x, z) });
    const step = .75, b = this.zone.bounds;
    const cell = (x, z) => [Math.round((x - b.minX) / step), Math.round((z - b.minZ) / step)];
    const coords = ([x, z]) => ({ x: b.minX + x * step, z: b.minZ + z * step });
    const key = ([x, z]) => `${x},${z}`;
    const start = cell(this.player.x, this.player.z), goal = cell(destination.x, destination.z), startKey = key(start);
    const opened = [{ cell: start, score: 0 }], cost = new Map([[startKey, 0]]), previous = new Map(), closed = new Set();
    let found = null, limit = 3000;
    while (opened.length && limit-- > 0) {
      opened.sort((a, b) => a.score - b.score); const current = opened.shift().cell, k = key(current); if (closed.has(k)) continue; closed.add(k);
      if (Math.hypot(current[0] - goal[0], current[1] - goal[1]) <= 1.5) { found = current; break; }
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const next = [current[0] + dx, current[1] + dz], n = key(next), p = coords(next);
        if (closed.has(n) || !this._walkable(p.x, p.z)) continue;
        if (dx && dz) { const px = coords([current[0] + dx, current[1]]), pz = coords([current[0], current[1] + dz]); if (!this._walkable(px.x, px.z) || !this._walkable(pz.x, pz.z)) continue; }
        const value = cost.get(k) + Math.hypot(dx, dz); if (cost.has(n) && cost.get(n) <= value) continue;
        cost.set(n, value); previous.set(n, current); opened.push({ cell: next, score: value + Math.hypot(next[0] - goal[0], next[1] - goal[1]) });
      }
    }
    if (!found) return null;
    const path = []; let current = found;
    while (key(current) !== startKey) { path.unshift(coords(current)); current = previous.get(key(current)); if (!current) break; }
    if (this._walkable(destination.x, destination.z)) path.push(destination); return path;
  }

  _handlePointer(event) {
    if (this.mode !== 'explore' || event.button !== 0) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.isVehicleMounted() ? [] : this.raycaster.intersectObjects(this.poiViews.filter(v => v.group.visible).map(v => v.icon));
    let destination, poi;
    if (hits.length) { poi = hits[0].object.userData.poi; destination = { x: poi.x, z: poi.z }; }
    else { const p = new THREE.Vector3(); if (!this.raycaster.ray.intersectPlane(this.groundPlane, p)) return; destination = { x: p.x, z: p.z }; }
    if (poi && Math.hypot(this.player.x - poi.x, this.player.z - poi.z) < 2.65) { if (poi.type === 'encounter' && this.onEncounter) this.onEncounter(poi); else this.onInteract?.(poi); return; }
    this.targetPath = this._pathTo(destination); this.pendingPOI = this.targetPath ? poi : null;
  }

  _cameraFocus(point, mode = this.mode) {
    if (this.levelLayout) {
      const camera = this.levelLayout.camera, b = camera.limits;
      return new THREE.Vector3(clamp(point.x * camera.follow, b.minX, b.maxX), mode === 'combat' ? .3 : 0,
        clamp(point.z * camera.follow, b.minZ, b.maxZ));
    }
    return new THREE.Vector3(clamp(point.x * .48, -9, 9), mode === 'combat' ? .3 : 0, clamp(point.z * .48, -10, 10));
  }

  update(dt = 1 / 60, { render = true } = {}) {
    if (this._disposed) return;
    dt = clamp(Number.isFinite(dt) ? dt : 1 / 60, 0, .05); this.time += dt;
    const policy=this.visualAccessibility, visualTime=policy?.ambientPulse===false?0:this.time;
    if(policy?.particles===false&&this.effects.length)this._clearEffects();
    let moving = false, movementX = 0, movementZ = 0;
    if (this.mode === 'explore') {
      const keyRight = Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('KeyQ') || this.keys.has('ArrowLeft'));
      const keyForward = Number(this.keys.has('KeyW') || this.keys.has('KeyZ') || this.keys.has('ArrowUp')) - Number(this.keys.has('KeyS') || this.keys.has('ArrowDown'));
      // Physical keyboard and analogue pad are separate sources; a keyboard
      // direction takes priority instead of doubling speed when both are held.
      const keyboard = keyRight !== 0 || keyForward !== 0;
      const right = keyboard ? keyRight : clamp(Number.isFinite(this.gamepadInput?.right) ? this.gamepadInput.right : 0, -1, 1);
      const forward = keyboard ? keyForward : clamp(Number.isFinite(this.gamepadInput?.forward) ? this.gamepadInput.forward : 0, -1, 1);
      const sprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.gamepadInput?.sprint === true;
      let dx = 0, dz = 0;
      if (right || forward) {
        this.targetPath = null; this.pendingPOI = null;
        const side = new THREE.Vector2(this.cameraOffset.z, -this.cameraOffset.x).normalize(), up = new THREE.Vector2(-this.cameraOffset.x, -this.cameraOffset.z).normalize();
        const direction = side.multiplyScalar(right).add(up.multiplyScalar(forward)).normalize().multiplyScalar(Math.min(1,Math.hypot(right,forward))); dx = direction.x; dz = direction.y;
      } else if (this.targetPath?.length) {
        const target = this.targetPath[0], x = target.x - this.player.x, z = target.z - this.player.z, d = Math.hypot(x, z);
        if (d < (this.isVehicleMounted() ? .7 : .16)) this.targetPath.shift(); else { dx = x / d; dz = z / d; }
      }
      const speed = (sprint ? 6.6 : 4.35) * dt;
      if (this.isVehicleMounted()) {
        const previous = { ...this.player };
        this.makoState = stepMako(this.makoState, { x: dx, z: dz, boost: sprint }, dt, (x,z,radius) => this._vehicleGround(x,z,radius));
        this.player = { ...this.makoState.position };
        moving = Math.hypot(this.player.x-previous.x,this.player.z-previous.z)>.001;
        this._syncMakoSprite();
      } else if (dx || dz) {
        const oldX = this.player.x, oldZ = this.player.z;
        if (this._walkable(this.player.x + dx * speed, this.player.z + dz * speed)) { this.player.x += dx * speed; this.player.z += dz * speed; }
        else { if (this._walkable(this.player.x + dx * speed, this.player.z)) this.player.x += dx * speed; if (this._walkable(this.player.x, this.player.z + dz * speed)) this.player.z += dz * speed; }
        moving = Math.hypot(oldX - this.player.x, oldZ - this.player.z) > .001;
        movementX = this.player.x - oldX; movementZ = this.player.z - oldZ;
        if (moving && (!this.trail.length || Math.hypot(this.trail[0].x - this.player.x, this.trail[0].z - this.player.z) > .13)) { this.trail.unshift({ ...this.player }); if (this.trail.length > 100) this.trail.pop(); }
      }
      if (this.pendingPOI && Math.hypot(this.pendingPOI.x - this.player.x, this.pendingPOI.z - this.player.z) < 1.5) {
        const poi = this.pendingPOI; this.pendingPOI = null; this.targetPath = null; if (poi.type === 'encounter' && this.onEncounter) this.onEncounter(poi); else this.onInteract?.(poi);
      }
      this._moveReport -= dt; if (moving && this._moveReport <= 0) { this._moveReport = .12; this.onMove?.({ ...this.player, zone: this.zoneId }); }
    }
    const cameraPoint = this.mode === 'combat' ? this.battleArena || this.zone.arena : this.player;
    const desired = this._cameraFocus(cameraPoint, this.mode);
    this.cameraTarget.lerp(desired, 1 - Math.exp(-dt * 3)); this.camera.position.copy(this.cameraTarget).add(this.cameraOffset); this.camera.lookAt(this.cameraTarget);
    const facing = Math.atan2(this.cameraOffset.x, this.cameraOffset.z);
    this.actors.forEach((actor, index) => {
      actor.group.visible = this.mode !== 'combat' && !this.isVehicleMounted();
      const target = actor.stationPosition || (index === 0 ? this.player : this.trail[Math.min(this.trail.length - 1, index * 11)] || this.player);
      const actorMoving = moving && !actor.stationPosition;
      actor.group.position.x = THREE.MathUtils.lerp(actor.group.position.x, target.x, index === 0 ? 1 : 1 - Math.exp(-dt * 8));
      actor.group.position.z = THREE.MathUtils.lerp(actor.group.position.z, target.z, index === 0 ? 1 : 1 - Math.exp(-dt * 8));
      if (this.levelLayout && !this._walkable(actor.group.position.x, actor.group.position.z)) {
        const safe = this._resolveLevelPosition({ x: actor.group.position.x, z: actor.group.position.z }) || this.player;
        actor.group.position.x = safe.x; actor.group.position.z = safe.z;
      }
      this._groundActor(actor);
      actor.body.rotation.y = facing; actor.body.position.y = actor.height / 2 + .05 + (actorMoving ? Math.abs(Math.sin(this.time * 10 - index)) * .065 : (policy?.ambientPulse===false?0:Math.sin(this.time * 1.8 + index) * .016));
      actor.body.rotation.z = actorMoving ? Math.sin(this.time * 10 - index) * .018 : 0;
      if (this._animateCharacter(actor, actorMoving, movementX, movementZ)) return;
      if (actor.key === 'shepard' && this.atlases.walk && this.walkConfig) {
        actor.body.material.map = moving ? this._walkingTexture(actor, movementX, movementZ) : this._spriteTexture(actor.key, false);
        actor.body.scale.x = moving ? actor.walkAspect / (2.1 / actor.height) : 1;
      }
    });
    for (const actor of this.ambientActors || []) {
      this._groundActor(actor);
      actor.body.rotation.y = facing;
      actor.body.position.y = actor.height / 2 + .05 + (policy?.ambientPulse===false?0:Math.sin(this.time * 1.5 + actor.group.position.x) * .02);
      actor.group.visible=this._ambientActorVisible(actor);
      this._applySeatedJoker(actor); this._applyFrontierNPCBody(actor); this._applyHorizonNPCBody(actor);
      if (FRONTIER_ENEMY_IDS.includes(actor.key)) this._applyFrontierEnemyBody(actor);
      if (HORIZON_ENEMY_IDS.includes(actor.key)) this._applyHorizonEnemyBody(actor);
      if(actor.faunaId)this._applyHorizonFaunaBody(actor);
    }
    for (const actor of this.battleActors.values()) {
      actor.body.rotation.y = facing; actor.poseTime = Math.max(0, actor.poseTime - dt);
      actor.shieldFlash = Math.max(0, (actor.shieldFlash || 0) - dt);
      if (actor.basePosition) { actor.group.position.lerp(actor.basePosition, 1 - Math.exp(-dt * 8)); if (actor.poseTime > 0 && policy?.spriteShake !== false) actor.group.position.x += Math.sin(actor.poseTime * 45) * .035; }
      const statuses = actor.state?.statuses || {}, lifted = statuses.lift > 0 || statuses.singularity > 0, stasis = statuses.stasis > 0;
      this._groundActor(actor, actor.alive && lifted ? .8 + (policy?.ambientPulse===false?0:Math.sin(this.time * 2) * .15) : 0);
      actor.statusShell.visible = actor.alive && (stasis || lifted || actor.shieldFlash > 0 && policy?.hitTint !== false || statuses.barrier > 0);
      actor.statusShell.material.color.set(stasis || lifted ? 0xa99ef0 : 0x83d0ed);
      actor.statusShell.rotation.y += policy?.ambientPulse===false?0:dt * .4;
      actor.body.scale.y = actor.alive && actor.state?.cover ? .88 : 1;
      actor.body.position.y = actor.height / 2 * actor.body.scale.y + .05 + (actor.alive ? policy?.ambientPulse===false?0:Math.sin(this.time * 2 + actor.group.position.z) * .025 : -.5);
      actor.body.material.color.set(actor.poseTime > .15 && policy?.hitTint !== false ? 0xffd6b2 : 0xffffff);
      const combatConfig = this._combatAnimationConfig(actor);
      if (combatConfig) {
        if (!actor.alive) { actor.combatPose = null; actor.combatPoseTime = 0; }
        else actor.combatPoseTime = Math.max(0, (actor.combatPoseTime || 0) - dt);
        const pose = !actor.alive ? 'down' : actor.combatPoseTime > 0 ? actor.combatPose || 'aim' : 'aim';
        if (!this._applyAnimationFrame(actor, `combat-${actor.key}`, combatConfig.frames?.[pose], { cover: actor.alive && actor.state?.cover })) {
          // Keep a complete, correctly scaled actor while its atlas is loading,
          // or if a frame is unavailable; never retain the preceding pose's crop.
          this._fallbackCombatFrame(actor);
        }
      } else if (FRONTIER_ENEMY_IDS.includes(actor.key)) this._applyFrontierEnemyBody(actor);
      else if (HORIZON_ENEMY_IDS.includes(actor.key)) this._applyHorizonEnemyBody(actor);
      else if (['varren','alpha-varren'].includes(actor.key)) this._applyHorizonFaunaBody(actor);
      else if (GUARDED_COMBAT_ANIMATION_IDS.includes(actor.key) && actor.animationFrame) this._fallbackCombatFrame(actor);
    }
    for (const actor of [...this.actors, ...this.battleActors.values()]) this._applyCommanderCustomization(actor);
    for (const item of this.animations) {
      if (item.kind === 'globe') item.object.rotation.y += policy?.ambientPulse===false?0:dt * .12;
      if (item.kind === 'orbit') item.object.rotation.z += policy?.ambientPulse===false?0:dt * item.speed;
      if (item.kind === 'smoke') item.object.children.forEach((puff, i) => { puff.position.x = Math.sin(visualTime * .35 + i) * .3 * item.scale; puff.scale.setScalar(1 + Math.sin(visualTime + i) * .09); });
      if (item.kind === 'fire') item.object.intensity = 5.5 + (policy?.ambientPulse===false?0:Math.sin(this.time * 9) * .7);
      if (item.kind === 'water') item.object.material.roughness = .16 + Math.sin(visualTime * .5) * .04;
      if (item.kind === 'barrier') item.object.material.opacity = .15 + Math.sin(visualTime * 2) * .04;
      if (item.kind === 'snow') { item.object.visible=policy?.ambientPulse!==false;if(policy?.ambientPulse===false)continue;const attr = item.object.geometry.attributes.position; for (let i = 0; i < attr.count; i++) { attr.array[i * 3] += dt * 1.1; attr.array[i * 3 + 1] -= dt * 1.3; if (attr.array[i * 3 + 1] < 0) attr.array[i * 3 + 1] = 18; if (attr.array[i * 3] > 28) attr.array[i * 3] = -28; } attr.needsUpdate = true; }
    }
    for (let i = this.effects.length - 1; i >= 0; i--) { const fx = this.effects[i]; fx.time -= dt; if (fx.time <= 0) { this.particles.remove(fx.object); disposeObject(fx.object); this.effects.splice(i, 1); } else { fx.object.material.opacity = fx.time / fx.max * .8 * (policy?.effectIntensity ?? 1); if (fx.kind === 'impact') fx.object.scale.setScalar(1 + (1 - fx.time / fx.max) * 3); } }
    const nearby = this.mode === 'explore' ? this.getNearby() : null;
    const w = this.width || 1, h = this.height || 1;
    for (const view of this.poiViews || []) {
      if (!view.group.visible || this.mode !== 'explore') { view.label.style.opacity = '0'; continue; }
      const active = nearby?.id === view.poi.id; view.ring.material.opacity = active ? .95 : .34;
      view.icon.position.y = 3.9 + (policy?.ambientPulse===false?0:Math.sin(this.time * 2 + view.poi.x) * .1); view.icon.material.opacity = active ? 1 : .7;
      const p = new THREE.Vector3(view.poi.x, 4.6, view.poi.z).project(this.camera);
      view.label.style.left = `${(p.x * .5 + .5) * w}px`; view.label.style.top = `${(-p.y * .5 + .5) * h}px`;
      view.label.style.opacity = active && p.z > -1 && p.z < 1 ? '1' : '0';
    }
    if (render) this.renderer.render(this.scene, this.camera);
  }

  resize() {
    if (this._disposed) return;
    const rect = this.container.getBoundingClientRect(); const width = Math.max(1, rect.width), height = Math.max(1, rect.height);
    this.width = width; this.height = height; this.renderer.setSize(width, height, false);
    const aspect = width / height, span = this.levelLayout?.camera.span || (this.zoneId === 'normandy' ? 24 : 29);
    this.camera.left = -span * aspect / 2; this.camera.right = span * aspect / 2; this.camera.top = span / 2; this.camera.bottom = -span / 2; this.camera.updateProjectionMatrix();
  }

  dispose() {
    if (this._disposed) return; this._disposed = true;
    this.resizeObserver?.disconnect(); window.removeEventListener('keydown', this._keydown); window.removeEventListener('keyup', this._keyup); window.removeEventListener('blur', this._blur);
    this.renderer.domElement.removeEventListener('pointerdown', this._pointerdown);
    this._clearCommanderTextures();
    disposeObject(this.scene);
    for (const texture of new Set([...(this._neutralBodyTexture ? [this._neutralBodyTexture] : []), ...this.spriteCache.values(), ...this.textureCache.values(), ...Object.values(this.atlases)])) texture.dispose();
    this.spriteCache.clear(); this.textureCache.clear(); this.atlases = {};
    this._atlasRequests?.clear(); this._atlasUrls?.clear();
    this.renderer.dispose(); this.renderer.domElement.remove(); this.labels.remove();
    this._terrainRequests?.clear();
  }
}
