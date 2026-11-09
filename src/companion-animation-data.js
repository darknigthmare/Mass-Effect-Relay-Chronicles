// Visual metadata only. These short IDs belong to the retained ME1 campaign;
// no equipment, skill, recruitment or later-game identity is supplied here.
export const COMPANION_ANIMATION_IDS = Object.freeze(['ashley', 'kaidan', 'garrus', 'tali', 'wrex', 'liara', 'jenkins']);
export const COMPANION_COMBAT_POSES = Object.freeze(['aim', 'power', 'hit', 'down']);
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const plain = value => !!value && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};

/** Reject incomplete, cross-identity, remote or geometrically invalid families. */
export function normalizeCompanionAnimation(key, input) {
  try {
    if (!COMPANION_ANIMATION_IDS.includes(key) || !plain(input) || input.version !== 1
      || input.characterId !== key || input.mediaId !== 'ME1'
      || own(input, 'character') && input.character !== key
      || own(input, 'periodId') && input.periodId !== 'me1' || !plain(input.combat)) return null;
    const combat = input.combat, file = `companion-${key}-combat.png`;
    if ((combat.file ?? combat.url) !== file || own(combat, 'file') && combat.file !== file
      || own(combat, 'url') && combat.url !== file
      || ![combat.width, combat.height].every(value => Number.isInteger(value) && value > 0 && value <= 8192)
      || combat.direction !== 'three-quarter' || !plain(combat.frames)) return null;
    const frames = {};
    for (const pose of COMPANION_COMBAT_POSES) {
      const frame = combat.frames[pose];
      if (!plain(frame) || frame.id !== `${key}-combat-${pose}` || frame.pose !== pose
        || !Array.isArray(frame.rect) || frame.rect.length !== 4 || !frame.rect.every(Number.isInteger)
        || !Array.isArray(frame.pivot) || frame.pivot.length !== 2 || !frame.pivot.every(Number.isFinite)
        || !Number.isFinite(frame.heightScale) || frame.heightScale < .05 || frame.heightScale > 1.5) return null;
      const [x, y, width, height] = frame.rect;
      if (x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > combat.width || y + height > combat.height
        || frame.pivot[0] < 0 || frame.pivot[0] > width || frame.pivot[1] < 0 || frame.pivot[1] > height) return null;
      frames[pose] = { id: frame.id, pose, rect: [...frame.rect], pivot: [...frame.pivot], heightScale: frame.heightScale };
      if (Array.isArray(frame.headRegion) && frame.headRegion.length === 4 && frame.headRegion.every(Number.isFinite)
        && frame.headRegion.every(value => value >= 0 && value <= 1)
        && frame.headRegion[0] + frame.headRegion[2] <= 1 && frame.headRegion[1] + frame.headRegion[3] <= 1) {
        frames[pose].headRegion = [...frame.headRegion];
        frames[pose].headAxis = frame.headAxis === 'x' ? 'x' : 'y';
      }
    }
    return freeze({ version: 1, characterId: key, mediaId: 'ME1', periodId: 'me1', status: 'Prototype',
      combat: { file, width: combat.width, height: combat.height, direction: 'three-quarter', frames } });
  } catch { return null; }
}

/** Legacy ME1 combat actors have no mediaId; an explicit foreign scope closes. */
export function canShowCompanionAnimation(actor, state = actor?.state, campaignContext = null) {
  if (actor?.id === 'jenkins' && campaignContext && typeof campaignContext === 'object'
    && (campaignContext.flags?.jenkinsLost === true
      || Array.isArray(campaignContext.lost) && campaignContext.lost.includes('jenkins')
      || Array.isArray(campaignContext.completed) && campaignContext.completed.includes('eden-prime'))) return false;
  return !!actor && COMPANION_ANIMATION_IDS.includes(actor.id) && actor.key === actor.id && actor.enemy === false
    && !!state && state.id === actor.id && state.sprite === actor.key && state.team === 'party'
    && (state.mediaId === undefined || state.mediaId === 'ME1')
    && (state.periodId === undefined || state.periodId === 'me1')
    && (state.context?.mediaId === undefined || state.context.mediaId === 'ME1')
    && (state.context?.periodId === undefined || state.context.periodId === 'me1');
}
