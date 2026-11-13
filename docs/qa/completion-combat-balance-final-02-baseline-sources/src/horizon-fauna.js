// Eight fixed prototype bodies. Reference access never creates a pet, campaign
// actor, combat profile, reward or later-game appearance in the ME1 world.
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const plain = value => !!value && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const definition = (id, name, mediaId, periodId, recordIds, role, description) =>
  ({ id, name, mediaId, periodId, recordIds, role, description, status: 'Prototype', partial: true });

export const HORIZON_FAUNA = freeze([
  definition('varren-me1', 'Varren', 'ME1', 'me1', ['ENM-varren', 'SPR-varren-ennemi', 'LOR-varrens', 'SIDE-feros-varrens'], 'combat',
    'Prédateur quadrupède des tunnels de Féros. L’affrontement contre la meute utilise l’assaut organique ATB.'),
  definition('alpha-varren-me1', 'Alpha varren', 'ME1', 'me1', [], 'combat',
    'Individu plus imposant qui empêche les colons de chasser dans le secteur du pont effondré. Profil de menace adapté à l’ATB.'),
  definition('gasbag-me1', 'Faune paisible d’Eden Prime', 'ME1', 'me1', ['SPR-faune-gasbag-eden-prime'], 'ambient',
    'Les créatures paisibles observées au nord du débarquement flottent à proximité des terres agricoles. Leur présence ne constitue pas une menace.'),
  definition('varren-me2', 'Varren — ME2', 'ME2', 'me2', ['ME2-ENM-VARRREN', 'ME2-SPR-ENM-VARRREN'], 'reference',
    'Illustration de la faune de ME2. Les comportements et rencontres originaux ne sont pas créés par cette image.'),
  definition('pyjak-me2', 'Pyjak de Tuchanka', 'ME2', 'me2', ['ME2-SQ-TUCH-PYJAK'], 'reference',
    'Petit animal associé aux réserves de nourriture de Tuchanka. Cette illustration ne réalise pas l’affectation ni son jeu de tourelle.'),
  definition('thresher-me1', 'Dévoreur', 'ME1', 'me1', ['ENM-devoreur', 'SPR-devoreur-ennemi', 'LOR-devoreurs'], 'reference',
    'Prédateur souterrain géant. Sa fiche générale ne place aucun individu dans les zones actuelles et ne simule pas son combat au Mako.'),
  definition('adhi-mea', 'Adhi sauvage', 'MEA', 'mea', ['MEA-ENM-ADHI-WILD', 'MEA-SPR-ENM-ADHI-WILD'], 'reference',
    'Faune de Heleus. La consultation n’ajoute ni faction kett, ni rencontre automatiquement hostile.'),
  definition('kaerkyn-mea', 'Kaerkyn', 'MEA', 'mea', ['MEA-ENM-KAERKYN', 'MEA-SPR-ENM-KAERKYN'], 'reference',
    'Créature locale de Heleus. La silhouette est une interprétation partielle ; son comportement et son hostilité restent à vérifier par lieu.'),
]);
export const HORIZON_FAUNA_IDS = Object.freeze(HORIZON_FAUNA.map(entry => entry.id));
const BY_ID = Object.fromEntries(HORIZON_FAUNA.map(entry => [entry.id, entry]));

// JRPG adaptation values. No shields, firearms or biotic powers are assigned.
export const HORIZON_FAUNA_ENEMIES = freeze({
  varren: { name: 'Varren', sprite: 'varren', catalogId: 'ENM-varren', mediaId: 'ME1', periodId: 'me1',
    hp: 80, shield: 0, attack: 14, defense: 2, speed: .90, powers: [], primaryAction: 'strike', synthetic: false },
  'alpha-varren': { name: 'Alpha varren', sprite: 'alpha-varren', catalogId: 'ENM-varren', mediaId: 'ME1', periodId: 'me1',
    hp: 190, shield: 0, attack: 24, defense: 4, speed: .72, powers: [], primaryAction: 'strike', synthetic: false, boss: true },
});

const exactContext = context => {
  if (!plain(context)) return null;
  const media = Object.getOwnPropertyDescriptor(context, 'mediaId'), period = Object.getOwnPropertyDescriptor(context, 'periodId');
  return media && own(media, 'value') && period && own(period, 'value')
    && typeof media.value === 'string' && typeof period.value === 'string'
    ? { mediaId: media.value, periodId: period.value } : null;
};
const scopeIs = (context, mediaId, periodId) => {
  const scope = exactContext(context); return scope?.mediaId === mediaId && scope.periodId === periodId;
};
const optionalME1Scope = (value, seen = new WeakSet()) => {
  if (!plain(value) || seen.has(value)) return false;
  seen.add(value);
  for (const [key, expected] of [['mediaId', 'ME1'], ['periodId', 'me1']]) {
    const property = Object.getOwnPropertyDescriptor(value, key);
    if (property && (!own(property, 'value') || property.value !== expected)) return false;
  }
  const nested = Object.getOwnPropertyDescriptor(value, 'context');
  return !nested || own(nested, 'value') && optionalME1Scope(nested.value, seen);
};

/** Complete local metadata; the returned copy cannot retain extra game data. */
export function normalizeHorizonFaunaAtlas(input) {
  try {
    if (!plain(input) || input.version !== 1 || input.file !== 'horizon-fauna.png' || input.alphaCutoff !== 32
      || ![input.width, input.height].every(value => Number.isInteger(value) && value > 0 && value <= 8192)
      || !plain(input.frames) || Object.keys(input.frames).length !== HORIZON_FAUNA_IDS.length) return null;
    const frames = {};
    for (const entry of HORIZON_FAUNA) {
      const frame = input.frames[entry.id];
      if (!plain(frame) || frame.id !== entry.id || frame.mediaId !== entry.mediaId || frame.periodId !== entry.periodId
        || !Array.isArray(frame.rect) || frame.rect.length !== 4 || !frame.rect.every(Number.isInteger)
        || !Array.isArray(frame.pivot) || frame.pivot.length !== 2 || !frame.pivot.every(Number.isFinite)
        || !Number.isFinite(frame.heightScale) || frame.heightScale < .1 || frame.heightScale > 1.5) return null;
      const [x, y, width, height] = frame.rect;
      if (x < 0 || y < 0 || width <= 16 || height <= 16 || x + width > input.width || y + height > input.height
        || frame.pivot[0] < 0 || frame.pivot[0] > width || frame.pivot[1] < 0 || frame.pivot[1] > height
        || own(frame, 'hoverHeight') && (!Number.isFinite(frame.hoverHeight) || frame.hoverHeight < 0 || frame.hoverHeight > 2)) return null;
      frames[entry.id] = { id: entry.id, mediaId: entry.mediaId, periodId: entry.periodId,
        rect: [...frame.rect], pivot: [...frame.pivot], heightScale: frame.heightScale,
        ...(own(frame, 'hoverHeight') ? { hoverHeight: frame.hoverHeight } : {}) };
    }
    const list = Object.values(frames);
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const [x, y, w, h] = list[i].rect, [xx, yy, ww, hh] = list[j].rect;
      if (x < xx + ww && xx < x + w && y < yy + hh && yy < y + h) return null;
    }
    return freeze({ version: 1, file: input.file, width: input.width, height: input.height,
      alphaCutoff: 32, status: 'Prototype', frames });
  } catch { return null; }
}

export function getHorizonFaunaFrame(key, atlas) {
  if (typeof key !== 'string' || !own(BY_ID, key)) return null;
  const config = normalizeHorizonFaunaAtlas(atlas), frame = config?.frames[key];
  return frame ? freeze({ ...frame, file: config.file, width: config.width, height: config.height }) : null;
}

/** Only this optional native Feros encounter grants the two combat drawings. */
export function getHorizonFaunaCombatVisual(actor, atlas, state = actor?.state) {
  if (!actor || actor.enemy !== true || !state || state.team !== 'enemy' || state.id !== actor.id
    || state.sprite !== actor.key || !optionalME1Scope(actor) || !optionalME1Scope(state)) return null;
  const id = actor.key === 'varren' && /^feros-varrens-pack-[01]$/.test(actor.id) ? 'varren-me1'
    : actor.key === 'alpha-varren' && actor.id === 'feros-varrens-pack-2' ? 'alpha-varren-me1' : null;
  return id ? getHorizonFaunaFrame(id, atlas) : null;
}

/** The caller supplies explicit campaign scope and its actual world zone. */
export function horizonFaunaVisible(key, context) {
  if (!scopeIs(context, 'ME1', 'me1') || !optionalME1Scope(context)) return false;
  const state = context.campaignState || context;
  if (!optionalME1Scope(state)) return false;
  const zone = context.zoneId ?? context.zone;
  if (key === 'gasbag-me1') return zone === 'eden-prime';
  if (!['varren-me1', 'alpha-varren-me1'].includes(key) || zone !== 'feros') return false;
  return !(state.cleared || []).includes('feros:boss')
    && state.operations?.records?.['feros-varrens']?.stage === 1;
}

/** Dossiers only. The ME1 list requires knowledge actually reached in a save. */
export function listHorizonFauna(context, campaignState) {
  const scope = exactContext(context); if (!scope) return [];
  if (scope.mediaId !== 'ME1' || scope.periodId !== 'me1') {
    return HORIZON_FAUNA.filter(entry => entry.mediaId === scope.mediaId && entry.periodId === scope.periodId);
  }
  if (!campaignState || !optionalME1Scope(campaignState)) return [];
  const visits = campaignState.story?.visitedZones || [], completed = campaignState.completed || [];
  const varrenStage = campaignState.operations?.records?.['feros-varrens']?.stage || 0;
  return HORIZON_FAUNA.filter(entry => {
    if (entry.id === 'gasbag-me1') return visits.includes('eden-prime') || completed.includes('eden-prime');
    if (entry.id === 'varren-me1') return visits.includes('feros') || completed.includes('feros') || varrenStage > 0;
    if (entry.id === 'alpha-varren-me1') return varrenStage > 0;
    return entry.id === 'thresher-me1' && completed.includes('citadel') && campaignState.flags?.spectre === true;
  });
}

/** Root's Chroniques adapter additionally checks canAccessContent for its record. */
export function getHorizonFaunaReferenceVisual(recordId, context, atlas) {
  if (typeof recordId !== 'string') return null;
  const entry = HORIZON_FAUNA.find(item => item.recordIds.includes(recordId)
    && scopeIs(context, item.mediaId, item.periodId));
  const config = normalizeHorizonFaunaAtlas(atlas), frame = entry && config?.frames[entry.id];
  return frame ? { src: `./assets/${config.file}`, atlasWidth: config.width, atlasHeight: config.height,
    sourceRect: [...frame.rect], caption: `${entry.name} — illustration fixe de prototype`, partial: true } : null;
}
