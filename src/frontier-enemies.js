// Eight additional ME1 campaign types. Statistics and existing ATB orders are
// adaptation values; a body drawing does not implement original-game movement.
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const plain = value => !!value && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));

const profiles = {
  'recon-drone': { name: 'Drone de reconnaissance geth', sprite: 'recon-drone', catalogId: 'ENM-drone-de-reconnaissance-geth', hp: 65, shield: 20, attack: 14, defense: 2, speed: .98, powers: [], synthetic: true },
  'assault-drone': { name: 'Drone d’assaut geth', sprite: 'assault-drone', catalogId: 'ENM-drone-d-assaut-geth', hp: 95, shield: 35, attack: 15, defense: 3, speed: .74, powers: [], synthetic: true },
  'rocket-geth': { name: 'Lance-roquettes geth', sprite: 'rocket-geth', catalogId: 'ENM-lance-roquettes-geth', hp: 105, shield: 45, attack: 24, defense: 3, speed: .52, powers: [], synthetic: true },
  'shock-geth': { name: 'Soldat de choc geth', sprite: 'shock-geth', catalogId: 'ENM-soldat-de-choc-geth', hp: 130, shield: 60, attack: 20, defense: 6, speed: .70, powers: [], synthetic: true },
  juggernaut: { name: 'Juggernaut geth', sprite: 'juggernaut', catalogId: 'ENM-juggernaut-geth', hp: 190, shield: 75, attack: 25, defense: 8, speed: .52, powers: [], synthetic: true },
  stalker: { name: 'Traqueur geth', sprite: 'stalker', catalogId: 'ENM-traqueur-geth', hp: 85, shield: 45, attack: 17, defense: 2, speed: 1.02, powers: [], synthetic: true },
  'rachni-worker': { name: 'Rachni ouvrier', sprite: 'rachni-worker', catalogId: 'ENM-rachni-ouvrier', hp: 70, shield: 0, attack: 18, defense: 2, speed: 1.15, powers: [], primaryAction: 'strike', synthetic: false },
  turret: { name: 'Tourelle automatisée', sprite: 'turret', catalogId: 'ENM-tourelle-automatisee', hp: 130, shield: 50, attack: 21, defense: 5, speed: .58, powers: [], synthetic: true },
};
export const FRONTIER_ENEMIES = freeze(Object.fromEntries(Object.entries(profiles)
  .map(([key, profile]) => [key, { ...profile, mediaId: 'ME1', periodId: 'me1', status: 'Prototype' }])));
export const FRONTIER_ENEMY_IDS = Object.freeze(Object.keys(FRONTIER_ENEMIES));

export const FRONTIER_ENEMY_MECHANICS = freeze({
  'recon-drone': { implemented: ['Tir et chaleur ATB', 'Profil léger rapide', 'Présentation en sustentation'], missing: ['Volume et trajectoire de vol du jeu original', 'Immunité physique à Projection, Lévitation et Singularité', 'Arme et cadence exactes', 'Poses dédiées d’action, impact et défaite'] },
  'assault-drone': { implemented: ['Tir et chaleur ATB', 'Budget ATB du soldat geth remplacé conservé', 'Châssis plus résistant que le drone de reconnaissance', 'Présentation en sustentation'], missing: ['Trajectoire et télégraphe de vol distincts', 'Arme et cadence exactes', 'Poses dédiées d’action, impact et défaite'] },
  'rocket-geth': { implemented: ['Tir ATB générique', 'Frappe plus forte et jauge plus lente'], missing: ['Projectile explosif', 'Zone visée annoncée et évitable', 'Cadence et dégâts originaux', 'Poses dédiées d’action, impact et défaite'] },
  'shock-geth': { implemented: ['Tir et chaleur ATB', 'Protection et silhouette renforcées'], missing: ['Carnage, barrières cinétiques destructibles et Renfort de bouclier du jeu original', 'Kit et valeurs exacts du jeu original', 'Poses dédiées d’action, impact et défaite'] },
  juggernaut: { implemented: ['Tir et chaleur ATB', 'Infanterie lourde lente distincte du Destructeur'], missing: ['Kit de soutien et projectiles originaux', 'Poses dédiées d’action, impact et défaite'] },
  stalker: { implemented: ['Tir et chaleur ATB', 'Profil léger à jauge rapide'], missing: ['Ancrages aux murs et plafonds', 'Grimpe et locomotion du jeu original', 'Poses dédiées d’action, impact et défaite'] },
  'rachni-worker': { implemented: ['Assaut organique ATB de proximité', 'Petit profil fragile rapide', 'Un ouvrier dans une formation mixte de trois rachni'], missing: ['Explosion et autodestruction du jeu original', 'Distance et mouvement de proximité originaux', 'Poses dédiées d’action, impact et défaite'] },
  turret: { implemented: ['Tir et chaleur ATB', 'Corps de défense fixe'], missing: ['Secteur de tir géométrique', 'Acquisition et rotation originales', 'Poses dédiées d’action, impact et défaite'] },
});

// Filled from the native, unmodified atlas after alpha-bound measurement.
const measuredFrames = {
  "recon-drone": {
    "key": "recon-drone",
    "sprite": "recon-drone",
    "catalogId": "ENM-drone-de-reconnaissance-geth",
    "mediaId": "ME1",
    "periodId": "me1",
    "file": "frontier-enemies.png",
    "width": 1536,
    "height": 1024,
    "rect": [
      84,
      104,
      242,
      249
    ],
    "pivot": [
      121,
      241
    ],
    "heightScale": 0.52,
    "hoverHeight": 0.62
  },
  "assault-drone": {
    "key": "assault-drone",
    "sprite": "assault-drone",
    "catalogId": "ENM-drone-d-assaut-geth",
    "mediaId": "ME1",
    "periodId": "me1",
    "file": "frontier-enemies.png",
    "width": 1536,
    "height": 1024,
    "rect": [
      399,
      82,
      351,
      285
    ],
    "pivot": [
      175.5,
      277
    ],
    "heightScale": 0.66,
    "hoverHeight": 0.7
  },
  "rocket-geth": {
    "key": "rocket-geth",
    "sprite": "rocket-geth",
    "catalogId": "ENM-lance-roquettes-geth",
    "mediaId": "ME1",
    "periodId": "me1",
    "file": "frontier-enemies.png",
    "width": 1536,
    "height": 1024,
    "rect": [
      786,
      17,
      321,
      477
    ],
    "pivot": [
      190,
      469
    ],
    "heightScale": 1
  },
  "shock-geth": {
    "key": "shock-geth",
    "sprite": "shock-geth",
    "catalogId": "ENM-soldat-de-choc-geth",
    "mediaId": "ME1",
    "periodId": "me1",
    "file": "frontier-enemies.png",
    "width": 1536,
    "height": 1024,
    "rect": [
      1197,
      10,
      294,
      487
    ],
    "pivot": [
      185,
      479
    ],
    "heightScale": 1
  },
  "juggernaut": {
    "key": "juggernaut",
    "sprite": "juggernaut",
    "catalogId": "ENM-juggernaut-geth",
    "mediaId": "ME1",
    "periodId": "me1",
    "file": "frontier-enemies.png",
    "width": 1536,
    "height": 1024,
    "rect": [
      6,
      486,
      364,
      530
    ],
    "pivot": [
      215,
      522
    ],
    "heightScale": 1.2
  },
  "stalker": {
    "key": "stalker",
    "sprite": "stalker",
    "catalogId": "ENM-traqueur-geth",
    "mediaId": "ME1",
    "periodId": "me1",
    "file": "frontier-enemies.png",
    "width": 1536,
    "height": 1024,
    "rect": [
      387,
      552,
      382,
      436
    ],
    "pivot": [
      191,
      428
    ],
    "heightScale": 0.72
  },
  "rachni-worker": {
    "key": "rachni-worker",
    "sprite": "rachni-worker",
    "catalogId": "ENM-rachni-ouvrier",
    "mediaId": "ME1",
    "periodId": "me1",
    "file": "frontier-enemies.png",
    "width": 1536,
    "height": 1024,
    "rect": [
      771,
      650,
      373,
      256
    ],
    "pivot": [
      186,
      248
    ],
    "heightScale": 0.43
  },
  "turret": {
    "key": "turret",
    "sprite": "turret",
    "catalogId": "ENM-tourelle-automatisee",
    "mediaId": "ME1",
    "periodId": "me1",
    "file": "frontier-enemies.png",
    "width": 1536,
    "height": 1024,
    "rect": [
      1180,
      574,
      338,
      365
    ],
    "pivot": [
      170,
      357
    ],
    "heightScale": 0.7
  }
};
const nativeFrames = Object.fromEntries(Object.entries(measuredFrames).map(([key, frame]) => [key, { id: `${key}-body`, ...frame }]));
export const FRONTIER_ENEMY_ATLAS = freeze({ version: 1, mediaId: 'ME1', periodId: 'me1',
  file: 'frontier-enemies.png', width: 1536, height: 1024, frames: nativeFrames });
export const FRONTIER_ENEMY_VISUALS = FRONTIER_ENEMY_ATLAS.frames;

/** Validate a complete local eight-body atlas. No recruitment or kit is inferred. */
export function normalizeFrontierEnemyAtlas(input) {
  try {
    if (!plain(input) || input.version !== 1 || input.mediaId !== 'ME1' || input.periodId !== 'me1'
      || input.file !== 'frontier-enemies.png' || !plain(input.frames)
      || ![input.width, input.height].every(value => Number.isInteger(value) && value > 0 && value <= 8192)
      || Object.keys(input.frames).length !== FRONTIER_ENEMY_IDS.length) return null;
    const frames = {};
    for (const key of FRONTIER_ENEMY_IDS) {
      const frame = input.frames[key];
      if (!plain(frame) || frame.key !== key || frame.sprite !== key || own(frame, 'id') && frame.id !== `${key}-body`
        || frame.catalogId !== FRONTIER_ENEMIES[key].catalogId
        || frame.mediaId !== 'ME1' || frame.periodId !== 'me1'
        || frame.file !== input.file || frame.width !== input.width || frame.height !== input.height
        || !Array.isArray(frame.rect) || frame.rect.length !== 4 || !frame.rect.every(Number.isInteger)
        || !Array.isArray(frame.pivot) || frame.pivot.length !== 2 || !frame.pivot.every(Number.isFinite)
        || !Number.isFinite(frame.heightScale) || frame.heightScale < .05 || frame.heightScale > 1.5
        || own(frame, 'hoverHeight') && (!Number.isFinite(frame.hoverHeight) || frame.hoverHeight < 0 || frame.hoverHeight > 2)) return null;
      const [x, y, width, height] = frame.rect;
      if (x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > input.width || y + height > input.height
        || frame.pivot[0] < 0 || frame.pivot[0] > width || frame.pivot[1] < 0 || frame.pivot[1] > height) return null;
      frames[key] = { id: `${key}-body`, key, sprite: key, catalogId: frame.catalogId, mediaId: 'ME1', periodId: 'me1',
        file: input.file, width: input.width, height: input.height, rect: [...frame.rect], pivot: [...frame.pivot],
        heightScale: frame.heightScale, ...(own(frame, 'hoverHeight') ? { hoverHeight: frame.hoverHeight } : {}) };
    }
    const list = Object.values(frames);
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const [x, y, w, h] = list[i].rect, [u, v, a, b] = list[j].rect;
      if (x < u + a && u < x + w && y < v + b && v < y + h) return null;
    }
    return freeze({ version: 1, mediaId: 'ME1', periodId: 'me1', file: input.file,
      width: input.width, height: input.height, status: 'Prototype', frames });
  } catch { return null; }
}

const localScope = value => (value?.mediaId === undefined || value.mediaId === 'ME1')
  && (value?.periodId === undefined || value.periodId === 'me1')
  && (value?.context?.mediaId === undefined || value.context.mediaId === 'ME1')
  && (value?.context?.periodId === undefined || value.context.periodId === 'me1');

/** Only native, indexed ME1 campaign enemies may use these body drawings. */
export function getFrontierEnemyVisual(actor, state = actor?.state) {
  if (!actor || !FRONTIER_ENEMY_IDS.includes(actor.key) || actor.enemy !== true || !state
    || state.id !== actor.id || state.sprite !== actor.key || state.team !== 'enemy'
    || !localScope(actor) || !localScope(state)
    || typeof actor.id !== 'string' || !new RegExp(`^${actor.key}-[0-9]+$`).test(actor.id)) return null;
  return FRONTIER_ENEMY_VISUALS[actor.key] || null;
}

// Independent of game-data/world imports: these are the currently authored
// first-position Frontier patrols. Juggernaut moved to a later formation slot
// in Horizon; the caller still supplies the actual POI and current first sprite.
const ambientFirstSprites = freeze({
  'therum:encounter-1': 'recon-drone', 'therum:encounter-2': 'shock-geth',
  'noveria:encounter-2': 'rachni-worker', 'virmire:encounter-1': 'assault-drone',
  'ilos:encounter-1': 'stalker',
});

/** A visible campaign patrol marker is separate from a native battle instance. */
export function getFrontierAmbientVisual(actor, { zoneId, poi, firstSprite, context } = {}) {
  if (!actor || actor.enemy !== true || !plain(poi) || poi.type !== 'encounter'
    || typeof zoneId !== 'string' || typeof poi.id !== 'string'
    || !['encounter-1', 'encounter-2', 'boss'].some(suffix => poi.id === `${zoneId}:${suffix}`)
    || ambientFirstSprites[poi.id] !== firstSprite || actor.key !== firstSprite
    || actor.poiId !== poi.id || actor.id !== `ambient:${poi.id}`
    || !localScope(actor) || !localScope(context)) return null;
  return FRONTIER_ENEMY_VISUALS[firstSprite] || null;
}
