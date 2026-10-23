import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { WORLD_ZONES } from './world-data.js';

const CREW_KEYS = ['shepard', 'ashley', 'kaidan', 'jenkins', 'garrus', 'tali', 'wrex', 'liara'];
const ENEMY_KEYS = ['geth', 'husk', 'geth-sniper', 'geth-destroyer', 'krogan', 'rachni', 'creeper', 'asari'];
const BOSS_KEYS = ['saren', 'benezia', 'thorian', 'saren-final'];
const NPC_KEYS = ['femshep', 'anderson', 'joker', 'chakwas', 'nihlus', 'udina', 'kirrahe', 'emily'];
const CITADEL_RECRUITS = { 'citadel:encounter-1': 'garrus', 'citadel:encounter-2': 'tali', 'citadel:boss': 'wrex' };
const ASSET_BASE = `${import.meta.env?.BASE_URL || './'}assets/`;
const COLORS = { dialogue: 0x91e4dc, terminal: 0x5faee6, encounter: 0xf06d53, objective: 0xf1c775, exit: 0x9db5ce };
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
    this.mode = 'menu'; this.time = 0; this.keys = new Set(); this.party = ['shepard', 'kaidan', 'jenkins']; this.commanderAppearance = 'male'; this.storyContext = null;
    this.player = { x: 0, z: 11 }; this.cleared = new Set(); this.colliders = []; this.animations = []; this.effects = [];
    this.actors = []; this.battleActors = new Map(); this.trail = []; this.spriteCache = new Map(); this.atlases = {};
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
    this.setZone('normandy'); this.resize();
  }

  _loadAtlas(name, url) {
    new THREE.TextureLoader().load(url, texture => {
      if (this._disposed) { texture.dispose(); return; }
      texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; texture.magFilter = THREE.LinearFilter;
      this.atlases[name] = texture;
      for (const [key, tex] of this.spriteCache) if (key.startsWith(`${name}:`)) { tex.dispose(); this.spriteCache.delete(key); }
      this.characters.traverse(o => { if (o.userData.characterKey && o.material) o.material.map = this._spriteTexture(o.userData.characterKey, o.userData.enemy); });
      if (name === 'props') { for (const args of this._pendingProps || []) this._propSprite(...args); this._pendingProps = []; }
      if (name === 'vehicles') { for (const args of this._pendingVehicles || []) this._vehicleSprite(...args); this._pendingVehicles = []; }
    }, undefined, () => { /* Hand-drawn placeholder sprites stay usable while assets are prepared. */ });
  }

  _spriteTexture(key = 'shepard', enemy = false) {
    const name = NPC_KEYS.includes(key) ? 'npc' : enemy && BOSS_KEYS.includes(key) ? 'boss' : enemy ? 'enemy' : 'crew', cacheKey = `${name}:${key}`;
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
    const row = Math.max(0, this.walkConfig.directions.indexOf(direction));
    const rate = this.walkConfig.fps * (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? 1.4 : 1);
    const frame = Math.floor(this.time * rate) % this.walkConfig.columns.length;
    const [top, bottom] = this.walkConfig.rowBounds[row], width = this.walkConfig.cellWidth - 2, height = bottom - top - 2;
    const image = this.atlases.walk.image;
    texture.repeat.set(width / image.width, height / image.height);
    texture.offset.set((this.walkConfig.columns[frame] + 1) / image.width, 1 - (bottom - 1) / image.height);
    actor.walkAspect = width / height; return texture;
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

  _mesh(geometry, material, x = 0, y = 0, z = 0, parent = this.stage) {
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  _box(w, h, d, material, x = 0, y = 0, z = 0, rounded = false, parent = this.stage) {
    return this._mesh(rounded ? new RoundedBoxGeometry(w, h, d, 1, Math.min(.1, h / 5, w / 5, d / 5)) : new THREE.BoxGeometry(w, h, d), material, x, y, z, parent);
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
    this._box(4.4, .08, 33, this._texturedMaterial(0x677a86), 0, .02, 0);
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
    this._box(10, .06, 44, this._texturedMaterial(finale ? 0x465562 : 0xaec2c5, 'metal', 12), 0, .03, 0);
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
    this._box(14, .5, 4.2, white, 0, .24, -20, true);
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
      for (const x of [-10, 10]) { this._box(1.3, 11, 2.8, trim, x, 5.5, z); this._rectCollider(x, z, 1.3, 2.8); }
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
        this._box(1.3, 10, 1.3, steel, x - Math.sign(x) * 6.6, 5, z);
        this._box(.12, 5.5, .2, this._material(0xadcfe1, .5, .1, 0x517e96), x - Math.sign(x) * 7.3, 4.5, z + .6);
      }
    }
    this._box(13, 4.3, .5, dark, 0, 2.2, -22.5);
    this._box(8.4, 3.5, .08, this._material(0x93abb7, .2, .6, 0x365570), 0, 2.2, -22.2);
    this._sign('PORT HANSHAN · RECHERCHE', 0, 6.1, -21.9, 9);
    for (const z of [-11, 10]) {
      this._box(27, .8, 1.8, steel, 0, 10, z);
      this._box(11, .06, .2, this._material(0xc6e8f1, .5, .1, 0x7aabbc), 0, 9.55, z);
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
    for (const z of [-9, 8]) { this._box(30, 1.3, 3, stone, 0, 13, z); for (const x of [-7, 7]) this._pipe([x, 12, z], [x + .7, 1, z + 1.5], .2, dark); }
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

  setZone(zoneId, { party, cleared, stage } = {}) {
    const zone = WORLD_ZONES[zoneId] || WORLD_ZONES.normandy;
    this.zone = zone; this.zoneId = zone.id; this.stageState = stage; this.rand = randomGenerator(hash(zone.id));
    this.cleared = new Set(cleared instanceof Set ? cleared : Array.isArray(cleared) ? cleared : []);
    this._clearEffects(); this.animations = []; this.colliders = []; this.combatOccluders = []; this.targetPath = null; this.pendingPOI = null; this._pendingProps = []; this._pendingVehicles = [];
    this.setBattle(null);
    disposeObject(this.stage, true); this.stage.clear(); this.materialCache.clear();
    this._lights(zone.theme);
    ({ normandy: () => this._normandy(), eden: () => this._eden(), citadel: () => this._citadel(false), therum: () => this._therum(), feros: () => this._feros(), noveria: () => this._noveria(), virmire: () => this._virmire(), ilos: () => this._ilos(), finale: () => this._citadel(true) }[zone.theme] || (() => this._eden()))();
    this._dressScene();
    // No interaction may be hidden inside scenery. Small placements yield to their authored approach area.
    this.colliders = this.colliders.filter(c => !this.getInteractivePOIs().some(p => this._insideCollider(p.x, p.z, c, .3)));
    this._mergeStatic(); this.player = { ...zone.spawn }; this._resetTrail();
    this.cameraTarget.set(this.player.x * .42, 0, this.player.z * .42);
    this._makeMarkers(); this.setParty(party || this.party);
    if (this.zoneId !== 'normandy' || !this.storyContext) this._makeAmbientCharacters();
    this.camera.position.copy(this.cameraTarget).add(this.cameraOffset); this.camera.lookAt(this.cameraTarget); this.resize();
  }

  setCommanderAppearance(appearance = 'male') {
    const next = appearance === 'female' ? 'female' : 'male';
    if (this.commanderAppearance === next) return;
    this.commanderAppearance = next;
    const key = next === 'female' ? 'femshep' : 'shepard';
    for (const actor of [...this.actors, ...this.battleActors.values()]) {
      if (actor.id !== 'shepard' || actor.enemy) continue;
      actor.key = key; actor.group.userData.key = key; actor.body.userData.characterKey = key;
      actor.body.material.map = this._spriteTexture(key, false);
      actor.body.scale.x = 1;
    }
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
      visitedZones: strings(context.visitedZones ?? context.story?.visitedZones),
      flags: { jenkinsLost: context.flags?.jenkinsLost === true },
      assignmentContacts,
    } : null;
    if (next?.flags.jenkinsLost && !next.lost.includes('jenkins')) next.lost.push('jenkins');
    if (JSON.stringify(next) === JSON.stringify(this.storyContext)) return;
    this.storyContext = next;
    if (!this.zone) return;
    if (this.pendingPOI && !this.getInteractivePOIs().some(poi => poi.id === this.pendingPOI.id)) {
      this.pendingPOI = null; this.targetPath = null;
    }
    this.setParty(this.party);
    if (this.zoneId === 'normandy') this._makeMarkers();
    if (this.zoneId === 'citadel') { this._makeMarkers(); this._makeAmbientCharacters(); }
  }

  _makeActor(key, id, enemy = false, parent = this.characters) {
    if (id === 'shepard' && !enemy) key = this.commanderAppearance === 'female' ? 'femshep' : 'shepard';
    const group = new THREE.Group(); group.userData.actorId = id; group.userData.key = key;
    const boss = BOSS_KEYS.includes(key), large = ['wrex', 'krogan', 'geth-destroyer', 'thorian', 'saren-final'].includes(key);
    const height = key === 'thorian' ? 5.4 : key === 'saren-final' ? 3.6 : large ? 3.25 : key === 'rachni' ? 2.45 : 2.85;
    const material = new THREE.MeshBasicMaterial({ map: this._spriteTexture(key, enemy), transparent: true, alphaTest: .2, depthWrite: true, side: THREE.DoubleSide, toneMapped: false });
    const body = new THREE.Mesh(new THREE.PlaneGeometry(boss ? height * (2 / 3) : large ? 2.55 : 2.1, height), material); body.position.y = height / 2 + .05;
    body.userData.characterKey = key; body.userData.enemy = enemy; group.add(body);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(large ? .67 : .46, 24), new THREE.MeshBasicMaterial({ color: 0x020a10, transparent: true, opacity: .28, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = .035; group.add(shadow);
    const statusShell = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), new THREE.MeshBasicMaterial({ color: 0xa69cea, transparent: true, opacity: .18, wireframe: true, depthWrite: false }));
    statusShell.scale.set(large ? 1.35 : 1.05, height * .6, .8); statusShell.position.y = height * .48; statusShell.visible = false; group.add(statusShell);
    parent.add(group); return { id, key, enemy, group, body, shadow, statusShell, height, alive: true, poseTime: 0, lastHp: null, lastShield: null };
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
      actor.group.position.set(actor.stationPosition?.x ?? this.player.x + (i === 1 ? -1.2 : i === 2 ? 1.2 : 0), 0, actor.stationPosition?.z ?? this.player.z + i * .8);
      actor.group.visible = this.mode !== 'combat'; return actor;
    });
    if (this.zoneId === 'normandy' && this.storyContext) this._makeAmbientCharacters();
  }

  _makeAmbientCharacters() {
    for (const actor of this.ambientActors || []) { this.characters.remove(actor.group); disposeObject(actor.group); }
    this.ambientActors = [];
    for (const p of this.zone.pois) {
      if (p.type === 'encounter' && !this.cleared.has(p.id)) {
        const key = this.zone.theme === 'noveria' && p.id.endsWith('encounter-2') ? 'rachni' : this.zone.theme === 'feros' && p.id.endsWith('encounter-2') ? 'creeper' : p.id.endsWith('encounter-2') && this.zone.theme === 'eden' ? 'husk' : 'geth';
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
      : this.zoneId === 'virmire' ? [['kirrahe', .8, 11.2]] : [];
    for (const [key, x, z] of npcs) { const actor = this._makeActor(key, `npc:${key}`); actor.group.position.set(x, 0, z); actor.group.visible = this.mode !== 'combat'; this.ambientActors.push(actor); }
    const active = new Set(this.actors.map(actor => actor.id));
    for (const poi of this.getConversationPOIs()) {
      if (active.has(poi.characterId)) continue;
      const actor = this._makeActor(poi.characterId, `npc:${poi.characterId}`);
      actor.conversationId = poi.conversationId; actor.poiId = poi.id;
      actor.group.position.set(poi.actorPosition.x, 0, poi.actorPosition.z);
      actor.group.visible = this.mode !== 'combat'; this.ambientActors.push(actor);
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
    for (const view of this.poiViews || []) { const hidden = this.cleared.has(view.poi.id) && view.poi.type === 'encounter'; view.group.visible = !hidden && this.mode !== 'combat'; if (hidden) view.label.style.opacity = '0'; }
    for (const actor of this.ambientActors || []) if (actor.poiId) actor.group.visible = !this.cleared.has(actor.poiId) && this.mode !== 'combat';
  }

  setMode(mode) {
    this.mode = mode; if (mode !== 'explore') { this.keys.clear(); this.targetPath = null; this.pendingPOI = null; }
    for (const object of this.combatOccluders) object.visible = mode !== 'combat';
    for (const actor of this.actors) actor.group.visible = mode !== 'combat';
    for (const actor of this.ambientActors || []) actor.group.visible = mode !== 'combat' && (!actor.poiId || !this.cleared.has(actor.poiId));
    for (const actor of this.battleActors.values()) actor.group.visible = mode === 'combat';
    for (const view of this.poiViews || []) { view.group.visible = mode !== 'combat' && !(view.poi.type === 'encounter' && this.cleared.has(view.poi.id)); if (mode !== 'explore') view.label.style.opacity = '0'; }
  }

  setBattle(battle) {
    this.battle = battle;
    if (!battle) { for (const actor of this.battleActors.values()) { this.characters.remove(actor.group); disposeObject(actor.group); } this.battleActors.clear(); return; }
    const entries = battle.actors || [...(battle.party || []).map(a => ({ ...a, team: 'party' })), ...(battle.enemies || []).map(a => ({ ...a, team: 'enemy' }))];
    const active = new Set(entries.map(a => a.id));
    for (const [id, actor] of this.battleActors) if (!active.has(id)) { this.characters.remove(actor.group); disposeObject(actor.group); this.battleActors.delete(id); }
    let partyIndex = 0, enemyIndex = 0;
    for (const state of entries) {
      const enemy = state.team === 'enemy', index = enemy ? enemyIndex++ : partyIndex++;
      const key = state.sprite || state.id || (enemy ? 'geth' : 'shepard');
      let actor = this.battleActors.get(state.id);
      if (!actor) { actor = this._makeActor(key, state.id, enemy); this.battleActors.set(state.id, actor); }
      const arena = this.zone.arena;
      actor.basePosition = new THREE.Vector3(arena.x + (enemy ? 4.0 + (index % 2) * .7 : -3.5 - (index % 2) * .5), 0, arena.z + (index - 1) * 2.9);
      if (actor.lastHp === null) actor.group.position.copy(actor.basePosition);
      if (actor.lastHp !== null && state.hp < actor.lastHp) { actor.poseTime = .35; this._impact(actor.group.position.clone().add(new THREE.Vector3(0, 1.3, 0)), enemy ? 0xffae79 : 0xf0c7a7); }
      if (actor.lastShield !== null && state.shield < actor.lastShield) actor.shieldFlash = .35;
      actor.alive = state.hp > 0; actor.state = state; actor.lastHp = state.hp; actor.lastShield = state.shield;
      actor.body.material.opacity = actor.alive ? 1 : .32; actor.group.visible = this.mode === 'combat';
      actor.body.rotation.z = actor.alive ? 0 : -.9;
    }
  }

  playEvent(event) {
    if (!event) return;
    const source = this.battleActors.get(event.actorId || event.sourceId || event.actor), target = this.battleActors.get(event.targetId || event.target);
    const type = String(event.type || event.kind || '').toLowerCase();
    const action = String(event.actionId || event.power || '').toLowerCase();
    if (source) source.poseTime = .3;
    if (target) target.poseTime = .24;
    if (type === 'heal' || type === 'revive' || ['medigel', 'unity', 'barrier', 'cover', 'reposition'].includes(action)) {
      const actor = target || source; if (actor) this._impact(actor.group.position.clone().add(new THREE.Vector3(0, 1.1, 0)), ['medigel', 'unity'].includes(action) || type === 'heal' ? 0x84e3bb : 0x80bddd, 1.5);
      return;
    }
    if (source && target && type === 'action' && source !== target) {
      const from = source.group.position.clone().add(new THREE.Vector3(0, 1.4, 0)), to = target.group.position.clone().add(new THREE.Vector3(0, 1.2, 0));
      const biotic = /biotic|warp|lift|throw|singularity|stasis/.test(action), tech = /tech|overload|sabotage|hack/.test(action);
      const color = action === 'acid' ? 0xb6d16d : biotic ? 0xa9a2ff : tech ? 0x7ee5ed : 0xffcf96;
      if (action === 'strike') { source.group.position.add(to.clone().sub(from).normalize().multiplyScalar(.8)); this._impact(to, 0xf3b391, 1.3); return; }
      const line = new THREE.Mesh(new THREE.CylinderGeometry(biotic ? .13 : .045, biotic ? .13 : .045, from.distanceTo(to), 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .9, depthWrite: false }));
      line.position.copy(from).add(to).multiplyScalar(.5); line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
      this.particles.add(line); this.effects.push({ object: line, time: .18, max: .18, kind: 'beam' }); this._impact(to, color, biotic ? 1.8 : 1);
    } else if (target && ['damage', 'blocked', 'status'].includes(type)) this._impact(target.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)), type === 'blocked' ? 0xb0a2e4 : 0xf5b282);
  }

  _impact(position, color, size = 1) {
    const ring = new THREE.Mesh(new THREE.SphereGeometry(.3 * size, 12, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .7, wireframe: true, depthWrite: false })); ring.position.copy(position); this.particles.add(ring);
    this.effects.push({ object: ring, time: .42, max: .42, kind: 'impact' });
  }
  _clearEffects() { for (const fx of this.effects) { this.particles.remove(fx.object); disposeObject(fx.object); } this.effects = []; }

  getPosition() { return { x: this.player.x, z: this.player.z }; }
  _resetTrail() {
    this.trail = Array.from({ length: 32 }, (_, i) => ({
      x: this.player.x,
      z: clamp(this.player.z + i * .13, this.zone.bounds.minZ + .5, this.zone.bounds.maxZ - .5),
    }));
  }
  setPosition(position = {}) {
    if (!Number.isFinite(position.x) || !Number.isFinite(position.z)) return;
    const b = this.zone.bounds; const x = clamp(position.x, b.minX + .5, b.maxX - .5), z = clamp(position.z, b.minZ + .5, b.maxZ - .5);
    if (!this._walkable(x, z)) return;
    this.player = { x, z }; this._resetTrail(); this.targetPath = null;
    this.actors.forEach((actor, i) => actor.group.position.set(actor.stationPosition?.x ?? x, 0, actor.stationPosition?.z ?? z + i * .8));
  }
  getBounds() { return { ...this.zone.bounds }; }
  getPOIs() { return this.zone.pois.map(poi => ({ ...poi, cleared: this.cleared.has(poi.id) })); }
  getConversationPOIs() {
    const context = this.storyContext;
    if (this.zoneId !== 'normandy' || !context) return [];
    return (this.zone.conversationPois || []).filter(poi => {
      const id = poi.conversationId;
      if (context.lost.includes(id)) return false;
      if (id === 'joker' || id === 'chakwas') return true;
      if (id === 'nihlus') return !context.visitedZones.includes('eden-prime') && !context.completed.includes('eden-prime') && !context.flags.jenkinsLost;
      return context.recruited.includes(id);
    }).map(poi => ({ ...poi, cleared: false }));
  }
  getInteractivePOIs() {
    const pois = this.getPOIs().filter(poi => {
      const recruit = this.zoneId === 'citadel' && CITADEL_RECRUITS[poi.id];
      return !recruit || !this.storyContext || !this.storyContext.recruited.includes(recruit) && !this.storyContext.lost.includes(recruit);
    });
    return [...pois, ...this.getConversationPOIs(), ...this.getAssignmentPOIs()];
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
  getNearby() {
    let nearest = null, distance = 2.65;
    for (const poi of this.getInteractivePOIs()) { if (poi.type === 'encounter' && this.cleared.has(poi.id)) continue; const d = Math.hypot(this.player.x - poi.x, this.player.z - poi.z); if (d < distance) { distance = d; nearest = poi; } }
    return nearest ? { ...nearest, distance } : null;
  }
  interact() {
    if (this.mode !== 'explore') return null;
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
    return !this.colliders.some(c => this._insideCollider(x, z, c));
  }

  _pathTo(destination) {
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
    const hits = this.raycaster.intersectObjects(this.poiViews.filter(v => v.group.visible).map(v => v.icon));
    let destination, poi;
    if (hits.length) { poi = hits[0].object.userData.poi; destination = { x: poi.x, z: poi.z }; }
    else { const p = new THREE.Vector3(); if (!this.raycaster.ray.intersectPlane(this.groundPlane, p)) return; destination = { x: p.x, z: p.z }; }
    if (poi && Math.hypot(this.player.x - poi.x, this.player.z - poi.z) < 2.65) { if (poi.type === 'encounter' && this.onEncounter) this.onEncounter(poi); else this.onInteract?.(poi); return; }
    this.targetPath = this._pathTo(destination); this.pendingPOI = this.targetPath ? poi : null;
  }

  update(dt = 1 / 60) {
    if (this._disposed) return;
    dt = clamp(Number.isFinite(dt) ? dt : 1 / 60, 0, .05); this.time += dt;
    let moving = false, movementX = 0, movementZ = 0;
    if (this.mode === 'explore') {
      const right = Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('KeyQ') || this.keys.has('ArrowLeft'));
      const forward = Number(this.keys.has('KeyW') || this.keys.has('KeyZ') || this.keys.has('ArrowUp')) - Number(this.keys.has('KeyS') || this.keys.has('ArrowDown'));
      let dx = 0, dz = 0;
      if (right || forward) {
        this.targetPath = null; this.pendingPOI = null;
        const side = new THREE.Vector2(this.cameraOffset.z, -this.cameraOffset.x).normalize(), up = new THREE.Vector2(-this.cameraOffset.x, -this.cameraOffset.z).normalize();
        const direction = side.multiplyScalar(right).add(up.multiplyScalar(forward)).normalize(); dx = direction.x; dz = direction.y;
      } else if (this.targetPath?.length) {
        const target = this.targetPath[0], x = target.x - this.player.x, z = target.z - this.player.z, d = Math.hypot(x, z);
        if (d < .16) this.targetPath.shift(); else { dx = x / d; dz = z / d; }
      }
      const speed = (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? 6.6 : 4.35) * dt;
      if (dx || dz) {
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
    const cameraPoint = this.mode === 'combat' ? this.zone.arena : this.player;
    const desired = new THREE.Vector3(clamp(cameraPoint.x * .48, -9, 9), this.mode === 'combat' ? .3 : 0, clamp(cameraPoint.z * .48, -10, 10));
    this.cameraTarget.lerp(desired, 1 - Math.exp(-dt * 3)); this.camera.position.copy(this.cameraTarget).add(this.cameraOffset); this.camera.lookAt(this.cameraTarget);
    const facing = Math.atan2(this.cameraOffset.x, this.cameraOffset.z);
    this.actors.forEach((actor, index) => {
      const target = actor.stationPosition || (index === 0 ? this.player : this.trail[Math.min(this.trail.length - 1, index * 11)] || this.player);
      const actorMoving = moving && !actor.stationPosition;
      actor.group.position.x = THREE.MathUtils.lerp(actor.group.position.x, target.x, index === 0 ? 1 : 1 - Math.exp(-dt * 8));
      actor.group.position.z = THREE.MathUtils.lerp(actor.group.position.z, target.z, index === 0 ? 1 : 1 - Math.exp(-dt * 8));
      actor.body.rotation.y = facing; actor.body.position.y = actor.height / 2 + .05 + (actorMoving ? Math.abs(Math.sin(this.time * 10 - index)) * .065 : Math.sin(this.time * 1.8 + index) * .016);
      actor.body.rotation.z = actorMoving ? Math.sin(this.time * 10 - index) * .018 : 0;
      if (actor.key === 'shepard' && this.atlases.walk && this.walkConfig) {
        actor.body.material.map = moving ? this._walkingTexture(actor, movementX, movementZ) : this._spriteTexture(actor.key, false);
        actor.body.scale.x = moving ? actor.walkAspect / (2.1 / actor.height) : 1;
      }
    });
    for (const actor of this.ambientActors || []) { actor.body.rotation.y = facing; actor.body.position.y = actor.height / 2 + .05 + Math.sin(this.time * 1.5 + actor.group.position.x) * .02; }
    for (const actor of this.battleActors.values()) {
      actor.body.rotation.y = facing; actor.poseTime = Math.max(0, actor.poseTime - dt);
      actor.shieldFlash = Math.max(0, (actor.shieldFlash || 0) - dt);
      if (actor.basePosition) { actor.group.position.lerp(actor.basePosition, 1 - Math.exp(-dt * 8)); if (actor.poseTime > 0) actor.group.position.x += Math.sin(actor.poseTime * 45) * .035; }
      const statuses = actor.state?.statuses || {}, lifted = statuses.lift > 0 || statuses.singularity > 0, stasis = statuses.stasis > 0;
      actor.group.position.y = actor.alive && lifted ? .8 + Math.sin(this.time * 2) * .15 : 0;
      actor.statusShell.visible = actor.alive && (stasis || lifted || actor.shieldFlash > 0 || statuses.barrier > 0);
      actor.statusShell.material.color.set(stasis || lifted ? 0xa99ef0 : 0x83d0ed);
      actor.statusShell.rotation.y += dt * .4;
      actor.body.scale.y = actor.alive && actor.state?.cover ? .88 : 1;
      actor.body.position.y = actor.height / 2 * actor.body.scale.y + .05 + (actor.alive ? Math.sin(this.time * 2 + actor.group.position.z) * .025 : -.5);
      actor.body.material.color.set(actor.poseTime > .15 ? 0xffd6b2 : 0xffffff);
    }
    for (const item of this.animations) {
      if (item.kind === 'globe') item.object.rotation.y += dt * .12;
      if (item.kind === 'orbit') item.object.rotation.z += dt * item.speed;
      if (item.kind === 'smoke') item.object.children.forEach((puff, i) => { puff.position.x = Math.sin(this.time * .35 + i) * .3 * item.scale; puff.scale.setScalar(1 + Math.sin(this.time + i) * .09); });
      if (item.kind === 'fire') item.object.intensity = 5.5 + Math.sin(this.time * 9) * .7;
      if (item.kind === 'water') item.object.material.roughness = .16 + Math.sin(this.time * .5) * .04;
      if (item.kind === 'barrier') item.object.material.opacity = .15 + Math.sin(this.time * 2) * .04;
      if (item.kind === 'snow') { const attr = item.object.geometry.attributes.position; for (let i = 0; i < attr.count; i++) { attr.array[i * 3] += dt * 1.1; attr.array[i * 3 + 1] -= dt * 1.3; if (attr.array[i * 3 + 1] < 0) attr.array[i * 3 + 1] = 18; if (attr.array[i * 3] > 28) attr.array[i * 3] = -28; } attr.needsUpdate = true; }
    }
    for (let i = this.effects.length - 1; i >= 0; i--) { const fx = this.effects[i]; fx.time -= dt; if (fx.time <= 0) { this.particles.remove(fx.object); disposeObject(fx.object); this.effects.splice(i, 1); } else { fx.object.material.opacity = fx.time / fx.max * .8; if (fx.kind === 'impact') fx.object.scale.setScalar(1 + (1 - fx.time / fx.max) * 3); } }
    const nearby = this.mode === 'explore' ? this.getNearby() : null;
    const w = this.width || 1, h = this.height || 1;
    for (const view of this.poiViews || []) {
      if (!view.group.visible || this.mode !== 'explore') { view.label.style.opacity = '0'; continue; }
      const active = nearby?.id === view.poi.id; view.ring.material.opacity = active ? .95 : .34;
      view.icon.position.y = 3.9 + Math.sin(this.time * 2 + view.poi.x) * .1; view.icon.material.opacity = active ? 1 : .7;
      const p = new THREE.Vector3(view.poi.x, 4.6, view.poi.z).project(this.camera);
      view.label.style.left = `${(p.x * .5 + .5) * w}px`; view.label.style.top = `${(-p.y * .5 + .5) * h}px`;
      view.label.style.opacity = active && p.z > -1 && p.z < 1 ? '1' : '0';
    }
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    if (this._disposed) return;
    const rect = this.container.getBoundingClientRect(); const width = Math.max(1, rect.width), height = Math.max(1, rect.height);
    this.width = width; this.height = height; this.renderer.setSize(width, height, false);
    const aspect = width / height, span = this.zoneId === 'normandy' ? 24 : 29;
    this.camera.left = -span * aspect / 2; this.camera.right = span * aspect / 2; this.camera.top = span / 2; this.camera.bottom = -span / 2; this.camera.updateProjectionMatrix();
  }

  dispose() {
    if (this._disposed) return; this._disposed = true;
    this.resizeObserver?.disconnect(); window.removeEventListener('keydown', this._keydown); window.removeEventListener('keyup', this._keyup); window.removeEventListener('blur', this._blur);
    this.renderer.domElement.removeEventListener('pointerdown', this._pointerdown);
    disposeObject(this.scene); for (const texture of this.spriteCache.values()) texture.dispose(); for (const texture of this.textureCache.values()) texture.dispose(); for (const texture of Object.values(this.atlases)) texture.dispose();
    this.renderer.dispose(); this.renderer.domElement.remove(); this.labels.remove();
  }
}
