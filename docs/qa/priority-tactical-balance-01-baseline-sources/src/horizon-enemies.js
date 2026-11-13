// Five ME1 bodies and adapted native ATB profiles. Static art and these budgets
// do not implement the complete original locomotion, projectiles or encounters.
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const plain = value => !!value && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const profiles = {
  'rocket-drone': { name: 'Drone lance-roquettes geth', sprite: 'rocket-drone', catalogId: 'ENM-drone-lance-roquettes', hp: 95, shield: 35, attack: 15, defense: 3, speed: .74, powers: [], synthetic: true },
  sapper: { name: 'Sapeur geth', sprite: 'sapper', catalogId: 'ENM-sapeur-geth', hp: 140, shield: 60, attack: 18, defense: 5, speed: .62, powers: ['sabotage'], synthetic: true },
  armature: { name: 'Armature geth', sprite: 'armature', catalogId: 'ENM-armature-geth', hp: 110, shield: 40, attack: 16, defense: 4, speed: .55, powers: [], synthetic: true },
  colossus: { name: 'Colosse geth', sprite: 'colossus', catalogId: 'ENM-colosse-geth', hp: 210, shield: 90, attack: 22, defense: 8, speed: .45, powers: [], synthetic: true },
  // Canonical identity replaces the condensed Therum encounter's generic krogan.
  // Keep that actor's exact ATB budget and orders; this does not add a boss phase.
  battlemaster: { name: 'Maître de guerre krogan', sprite: 'battlemaster', catalogId: 'ENM-maitre-de-guerre-krogan', hp: 210, shield: 45, attack: 25, defense: 9, speed: .66, powers: ['barrier'], synthetic: false },
};
export const HORIZON_ENEMIES = freeze(Object.fromEntries(Object.entries(profiles)
  .map(([key, profile]) => [key, { ...profile, mediaId: 'ME1', periodId: 'me1', status: 'Prototype' }])));
export const HORIZON_ENEMY_IDS = Object.freeze(Object.keys(HORIZON_ENEMIES));
export const HORIZON_ENEMY_HEIGHTS = freeze({ 'rocket-drone': 1.6, sapper: 2.85, armature: 4.4, colossus: 5.6, battlemaster: 3.25 });
export const HORIZON_ENCOUNTER_CHANGES = freeze([
  { zone: 'feros', index: 0, before: ['geth', 'geth', 'sniper'], after: ['armature', 'geth', 'sniper'] },
  { zone: 'noveria', index: 0, before: ['geth', 'destroyer'], after: ['rocket-drone', 'destroyer'] },
  { zone: 'ilos', index: 1, before: ['destroyer', 'sniper'], after: ['sapper', 'sniper'] },
  { zone: 'virmire', index: 1, before: ['juggernaut', 'krogan'], after: ['colossus', 'krogan'] },
  { zone: 'citadel-finale', index: 0, before: ['geth', 'sniper', 'destroyer'], after: ['geth', 'sniper', 'juggernaut'] },
  { zone: 'therum', index: 2, before: ['krogan', 'geth', 'sniper'], after: ['battlemaster', 'geth', 'sniper'] },
]);
export const HORIZON_ENEMY_MECHANICS = freeze({
  'rocket-drone': { implemented: ['Tir et chaleur ATB', 'Corps en sustentation'], missing: ['Projectiles explosifs et zone visée évitable', 'Vol original', 'Poses dédiées d’action, impact et défaite'] },
  sapper: { implemented: ['Tir et chaleur ATB', 'Véritable commande Sabotage ATB sur les armes'], missing: ['Locomotion bondissante originale', 'Différences et valeurs exactes selon l’édition', 'Poses dédiées d’action, impact et défaite'] },
  armature: { implemented: ['Profil de machine quadrupède', 'Tir et chaleur ATB', 'Gabarit de rendu plus grand'], missing: ['Charge de canon télégraphiée et projectile original', 'Arc de tir géométrique', 'Locomotion et résistances exactes', 'Poses dédiées d’action, impact et défaite'] },
  colossus: { implemented: ['Corps quadrupède lourd', 'Tir ATB plus lent', 'Gabarit de rendu plus grand'], missing: ['Rencontre Mako et armement du véhicule', 'Charge et zone d’impact originales', 'Réorientation et résistances exactes', 'Poses dédiées d’action, impact et défaite'] },
  battlemaster: { implemented: ['Identité du maître de guerre dans le combat existant de Thérum', 'Budget et commandes du krogan remplacé conservés', 'Barrière ATB existante'], missing: ['Kit complet et récupérations d’origine', 'Régénération et ruée originales', 'Séquence et mise en scène originales', 'Poses dédiées d’action, impact et défaite'] },
});
export const HORIZON_ENEMY_VISUALS = freeze(Object.fromEntries(HORIZON_ENEMY_IDS.map(key => [key, {
  key, sprite: key, catalogId: HORIZON_ENEMIES[key].catalogId, id: `${key}-body`,
  mediaId: 'ME1', periodId: 'me1', file: 'horizon-enemies.png', heightScale: 1,
  hoverHeight: key === 'rocket-drone' ? .65 : 0,
}])));

export function normalizeHorizonEnemyAtlas(input) {
  try {
    if (!plain(input) || input.version !== 1 || input.mediaId !== 'ME1' || input.periodId !== 'me1'
      || input.file !== 'horizon-enemies.png' || !plain(input.frames)
      || ![input.width, input.height].every(value => Number.isInteger(value) && value > 0 && value <= 8192)
      || Object.keys(input.frames).length !== HORIZON_ENEMY_IDS.length) return null;
    const frames = {};
    for (const key of HORIZON_ENEMY_IDS) {
      const frame = input.frames[key], spec = HORIZON_ENEMY_VISUALS[key];
      if (!plain(frame) || frame.key !== key || frame.sprite !== key || frame.id !== spec.id
        || frame.catalogId !== spec.catalogId || frame.mediaId !== 'ME1' || frame.periodId !== 'me1'
        || frame.file !== input.file || frame.width !== input.width || frame.height !== input.height
        || frame.heightScale !== spec.heightScale || frame.hoverHeight !== spec.hoverHeight
        || !Array.isArray(frame.rect) || frame.rect.length !== 4 || !frame.rect.every(Number.isInteger)
        || !Array.isArray(frame.pivot) || frame.pivot.length !== 2 || !frame.pivot.every(Number.isFinite)) return null;
      const [x, y, width, height] = frame.rect;
      if (x < 0 || y < 0 || width < 16 || height < 16 || x + width > input.width || y + height > input.height
        || frame.pivot[0] < 0 || frame.pivot[0] > width || frame.pivot[1] < 0 || frame.pivot[1] > height) return null;
      frames[key] = { ...spec, width: input.width, height: input.height, rect: [...frame.rect], pivot: [...frame.pivot] };
    }
    const list = Object.values(frames);
    for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) {
      const [x, y, w, h] = list[a].rect, [xx, yy, ww, hh] = list[b].rect;
      if (x < xx + ww && xx < x + w && y < yy + hh && yy < y + h) return null;
    }
    return freeze({ version: 1, mediaId: 'ME1', periodId: 'me1', file: 'horizon-enemies.png', status: 'Prototype',
      width: input.width, height: input.height, frames });
  } catch { return null; }
}
const localScope = value => (value?.mediaId === undefined || value.mediaId === 'ME1')
  && (value?.periodId === undefined || value.periodId === 'me1')
  && (value?.context?.mediaId === undefined || value.context.mediaId === 'ME1')
  && (value?.context?.periodId === undefined || value.context.periodId === 'me1');

export function getHorizonEnemyVisual(actor, state = actor?.state) {
  if (!actor || !HORIZON_ENEMY_IDS.includes(actor.key) || actor.enemy !== true || !state
    || state.id !== actor.id || state.sprite !== actor.key || state.team !== 'enemy'
    || !localScope(actor) || !localScope(state)
    || typeof actor.id !== 'string' || !new RegExp(`^${actor.key}-[0-9]+$`).test(actor.id)) return null;
  return HORIZON_ENEMY_VISUALS[actor.key];
}
const ambientSlots = freeze({ 'feros:encounter-1': 'armature', 'noveria:encounter-1': 'rocket-drone',
  'ilos:encounter-2': 'sapper', 'virmire:encounter-2': 'colossus', 'therum:boss': 'battlemaster' });
export function getHorizonAmbientVisual(actor, { zoneId, poi, firstSprite, context } = {}) {
  if (!actor || !poi || !HORIZON_ENEMY_IDS.includes(actor.key) || actor.enemy !== true || !localScope(actor)
    || !localScope(context) || !localScope(actor.state) || typeof zoneId !== 'string'
    || poi.id?.split(':')[0] !== zoneId || poi.type !== 'encounter' || !own(ambientSlots, poi.id)
    || ambientSlots[poi.id] !== actor.key || firstSprite !== actor.key || actor.poiId !== poi.id
    || actor.id !== `ambient:${poi.id}`) return null;
  return HORIZON_ENEMY_VISUALS[actor.key];
}
