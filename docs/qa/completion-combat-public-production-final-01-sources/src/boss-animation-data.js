// Four fixed visual states for existing ME1 bosses. These drawings do not
// create actors, powers, phases, statistics, rewards or encounter changes.
export const BOSS_ANIMATION_IDS = Object.freeze(['saren', 'benezia', 'thorian', 'saren-final']);
export const BOSS_COMBAT_POSES = Object.freeze(['aim', 'power', 'hit', 'down']);
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const plain = value => !!value && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const me1Scope = value => (value.mediaId === undefined || value.mediaId === 'ME1')
  && (value.periodId === undefined || value.periodId === 'me1')
  && (value.context?.mediaId === undefined || value.context.mediaId === 'ME1')
  && (value.context?.periodId === undefined || value.context.periodId === 'me1');

/** Copy and freeze complete local ME1 families; metadata cannot grant access. */
export function normalizeBossAnimation(key, input) {
  try {
    if (!BOSS_ANIMATION_IDS.includes(key) || !plain(input) || input.version !== 1
      || input.characterId !== key || input.mediaId !== 'ME1'
      || own(input, 'character') && input.character !== key
      || own(input, 'periodId') && input.periodId !== 'me1' || !plain(input.combat)) return null;
    const combat = input.combat, file = `boss-${key}-combat.png`;
    if ((combat.file ?? combat.url) !== file || own(combat, 'file') && combat.file !== file
      || own(combat, 'url') && combat.url !== file
      || ![combat.width, combat.height].every(value => Number.isInteger(value) && value > 0 && value <= 8192)
      || combat.direction !== 'three-quarter' || !plain(combat.frames)) return null;
    const frames = {};
    for (const pose of BOSS_COMBAT_POSES) {
      const frame = combat.frames[pose];
      if (!plain(frame) || frame.id !== `${key}-combat-${pose}` || frame.pose !== pose
        || !Array.isArray(frame.rect) || frame.rect.length !== 4 || !frame.rect.every(Number.isInteger)
        || !Array.isArray(frame.pivot) || frame.pivot.length !== 2 || !frame.pivot.every(Number.isFinite)
        || !Number.isFinite(frame.heightScale) || frame.heightScale < .05 || frame.heightScale > 1.5) return null;
      const [x, y, width, height] = frame.rect;
      if (x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > combat.width || y + height > combat.height
        || frame.pivot[0] < 0 || frame.pivot[0] > width || frame.pivot[1] < 0 || frame.pivot[1] > height) return null;
      frames[pose] = { id: frame.id, pose, rect: [...frame.rect], pivot: [...frame.pivot], heightScale: frame.heightScale };
    }
    return freeze({ version: 1, characterId: key, mediaId: 'ME1', periodId: 'me1', status: 'Prototype',
      combat: { file, width: combat.width, height: combat.height, direction: 'three-quarter', frames } });
  } catch { return null; }
}

/** Native campaign enemy IDs only. Missing legacy scope is tolerated, foreign scope is not. */
export function canShowBossAnimation(actor, state = actor?.state) {
  if (!actor || !BOSS_ANIMATION_IDS.includes(actor.key) || actor.enemy !== true || !state
    || state.id !== actor.id || state.sprite !== actor.key || state.team !== 'enemy') return false;
  return typeof actor.id === 'string' && new RegExp(`^${actor.key}-[0-9]+$`).test(actor.id)
    && me1Scope(actor) && me1Scope(state);
}
