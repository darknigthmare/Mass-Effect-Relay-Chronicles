// Dependency-free ammo-power rules. The catalogue identifies these native
// powers; every multiplier, buildup threshold and duration here is ATB tuning.
// MEA consumables are intentionally absent: duration/clip rules are unverified.
const EPSILON = 1e-8;
const WEAPON_ACTIONS = Object.freeze({ shoot: 1, burst: 3, signature: 2 });
const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const types = [
  ['INCENDIARY', 'ammoIncendiary', 'incendiary', 'Munitions incendiaires'],
  ['CRYO', 'ammoCryo', 'cryo', 'Munitions cryogéniques'],
  ['DISRUPTOR', 'ammoDisruptor', 'disruptor', 'Munitions disruptives'],
  ['AP', 'ammoArmorPiercing', 'armor-piercing', 'Munitions perforantes'],
  ['WARP', 'ammoWarp', 'warp', 'Munitions de distorsion'],
  ['SHREDDER', 'ammoShredder', 'shredder', 'Munitions déchiqueteuses'],
];
export const UNIVERSE_AMMO_PROFILES = freeze(['ME2', 'ME3'].flatMap(mediaId => types
  .filter(([suffix]) => mediaId === 'ME2' || suffix !== 'SHREDDER')
  .map(([suffix, actionId, mode, name]) => {
    const id = `${mediaId}-POW-AMMO-${suffix}`;
    return {
      id, catalogId: id, mediaId, actionId, mode, name, kind: 'power', activation: 'learned-mode',
      exclusive: true, weaponSystems: ['thermal-clip'], conventionalOnly: true,
      sourceIds: [`${mediaId}-SRC-POWERS`],
      sourceUrl: mediaId === 'ME2' ? 'https://masseffect.fandom.com/wiki/Powers'
        : 'https://masseffect.fandom.com/wiki/Powers_%28Mass_Effect_3%29',
      statsBasis: 'ATB adaptation', primaryMechanicsVerified: false,
      tuningNote: 'Multiplicateurs, seuils et durées adaptés à l’ATB ; aucune valeur originale ni fidélité 1:1 certifiée.',
      limitations: ['Un seul mode appris actif ; réservé dans ce prototype aux armes conventionnelles à clips.',
        'Aucun effet sur les pouvoirs, les attaques de soutien ou les invocations ; pas de consommable MEA ni de cellule de pouvoir.',
        'Rangs, partage à l’escouade, acquisition et variantes d’édition non reproduits.'],
    };
  })));
const byId = new Map(UNIVERSE_AMMO_PROFILES.map(profile => [profile.id, profile]));
const byAction = new Map(UNIVERSE_AMMO_PROFILES.map(profile => [`${profile.mediaId}:${profile.actionId}`, profile]));
export const getUniverseAmmoProfile = id => typeof id === 'string' ? byId.get(id) || null : null;
export const getAmmoActionProfile = (mediaId, actionId) => typeof mediaId === 'string' && typeof actionId === 'string'
  ? byAction.get(`${mediaId}:${actionId}`) || null : null;

// Inspect data properties only. Public helpers neither coerce hostile payloads
// nor execute accessors when validating saved choices or actor definitions.
const plain = value => value && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const data = (value, key) => {
  if (!plain(value)) return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor && Object.hasOwn(descriptor, 'value') ? descriptor.value : undefined;
};
const number = (value, fallback = 0) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const stringList = value => Array.isArray(value) && Object.getPrototypeOf(value) === Array.prototype
  && value.length <= 128 && Reflect.ownKeys(value).every(key => key === 'length'
    || typeof key === 'string' && /^(?:0|[1-9]\d*)$/.test(key) && Object.hasOwn(Object.getOwnPropertyDescriptor(value, key), 'value'))
  && value.every(item => typeof item === 'string') ? value : null;
const rejected = reason => ({ ok: false, reason, ammoModeId: null, profile: null });

/** Validate a selected ID against the actor's real kit, media and weapon. */
export function validateAmmoMode(source, modeId = data(source, 'ammoModeId') ?? null) {
  if (modeId === null) return { ok: true, reason: null, ammoModeId: null, profile: null };
  const profile = getUniverseAmmoProfile(modeId);
  if (!profile) return rejected('Mode de munitions inconnu.');
  if (!plain(source) || data(source, 'mediaId') !== profile.mediaId) return rejected('Ce mode ne correspond pas à cette œuvre.');
  if (data(source, 'isSummon') === true || data(source, 'autonomous') === true || data(source, 'countsForVictory') === false)
    return rejected('Les soutiens et invocations n’utilisent pas les modes du porteur.');
  const permissions = stringList(data(source, 'allowedAmmoProfileIds')), powers = stringList(data(source, 'powers'));
  if (!permissions?.includes(profile.id) || !powers?.includes(profile.actionId)) return rejected('Ce mode ne fait pas partie du profil appris du porteur.');
  if (data(source, 'weaponSystem') !== 'thermal-clip' || ![undefined, null].includes(data(source, 'weaponProfileId'))
    || ['strike', 'acid'].includes(data(source, 'primaryAction')))
    return rejected('Ce prototype exige une arme conventionnelle à clips thermiques.');
  return { ok: true, reason: null, ammoModeId: profile.id, profile };
}

/** Repeated activation is refused without spending an action or other resource. */
export function canActivateAmmoProfile(source, profileId) {
  const result = validateAmmoMode(source, profileId);
  if (result.ok && (data(source, 'ammoModeId') ?? null) === result.ammoModeId)
    return rejected('Ce mode de munitions est déjà actif.');
  return result;
}

/** Pure replacement plan; the combat/compositor owns the actual state update. */
export function activateAmmoProfile(source, profileId) {
  const result = canActivateAmmoProfile(source, profileId);
  if (!result.ok) return { ok: false, reason: result.reason, ammoModeId: null, replacedProfileId: null };
  const previous = validateAmmoMode(source);
  return { ok: true, reason: null, ammoModeId: result.ammoModeId,
    replacedProfileId: previous.ok ? previous.ammoModeId : null };
}

const status = (target, key) => number(data(data(target, 'statuses'), key)) > EPSILON;
const synthetic = target => data(target, 'synthetic') === true || data(target, 'type') === 'synthetic';
const protectedTarget = target => number(data(target, 'shield')) > EPSILON
  || status(target, 'fortification') && number(data(target, 'fortificationShield')) > EPSILON;
const neutral = () => ({ profileId: null, shieldMultiplier: 1, healthMultiplier: 1,
  defenseMultiplier: 1, coverMultiplier: 1, postHit: null });
const shotCount = (actionId, requested) => {
  const maximum = typeof actionId === 'string' && Object.hasOwn(WEAPON_ACTIONS, actionId) ? WEAPON_ACTIONS[actionId] : 0;
  return requested === undefined ? maximum : Math.max(0, Math.min(maximum, Math.floor(number(requested))));
};

function usableHitProfile(source, target, actionId) {
  if (typeof actionId !== 'string' || !Object.hasOwn(WEAPON_ACTIONS, actionId) || !plain(target) || status(target, 'stasis')) return null;
  const checked = validateAmmoMode(source);
  return checked.ok ? checked.profile : null;
}

/** Layer-specific multipliers; shield amplification must not leak to health. */
export function getAmmoHitModifiers(source, target, actionId) {
  const modifiers = neutral(), profile = usableHitProfile(source, target, actionId);
  if (!profile) return modifiers;
  modifiers.profileId = profile.id;
  if (profile.mode === 'incendiary' && !synthetic(target) && !protectedTarget(target)) {
    modifiers.postHit = { kind: 'burn', duration: 3, damagePerSecond: 4 };
  } else if (profile.mode === 'cryo' && !protectedTarget(target) && data(target, 'controlImmune') !== true
    && data(target, 'freezeImmune') !== true && number(data(target, 'controlResistance')) < 1) {
    modifiers.postHit = { kind: 'cryo', stacks: shotCount(actionId), threshold: 3, freezeDuration: 2 };
  } else if (profile.mode === 'disruptor') {
    modifiers.shieldMultiplier = 1.3;
    if (synthetic(target)) modifiers.healthMultiplier = 1.2;
  } else if (profile.mode === 'armor-piercing') {
    modifiers.defenseMultiplier = .65;
    if (profile.mediaId === 'ME3') modifiers.coverMultiplier = .75;
  } else if (profile.mode === 'warp') {
    if (['lift', 'singularity', 'pull', 'slam'].some(key => status(target, key))) {
      modifiers.shieldMultiplier *= 1.2; modifiers.healthMultiplier *= 1.2;
    }
    if (status(target, 'barrier')) modifiers.shieldMultiplier *= 1.25;
  } else if (profile.mode === 'shredder' && !synthetic(target) && !protectedTarget(target)) {
    modifiers.healthMultiplier = 1.25;
  }
  return modifiers;
}

/** Evaluate AFTER actual damage, so a shield-breaking hit may prime a status.
 * postHit in getAmmoHitModifiers is only a preview; apply this result once.
 * Real health damage is required, and dead/immune/Stasis targets gain no state.
 */
export function getAmmoPostHit(source, target, actionId, damage = {}) {
  if (!plain(damage) || number(data(damage, 'healthDamage')) <= EPSILON || number(data(target, 'hp')) <= EPSILON
    || !shotCount(actionId, data(damage, 'shotCount'))) return null;
  const effect = getAmmoHitModifiers(source, target, actionId).postHit;
  if (!effect) return null;
  return effect.kind === 'cryo' ? { ...effect, stacks: shotCount(actionId, data(damage, 'shotCount')) } : { ...effect };
}
