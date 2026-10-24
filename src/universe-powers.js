// Explicit catalogue-to-action bindings. Effects and timing remain ATB tuning.
// Companion assignments below retain the secondary squad/skills references used
// for the partial kits; they are not a new primary-source certification.
import { UNIVERSE_RECORDS, getUniverseRecord } from './universe-data.js';
import { normalizeContext, canAccessContent } from './continuity.js';

const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const ACTION_SUFFIXES = {
  ME2: { PULL: 'pull', THROW: 'throw', WARP: 'warp', SINGULARITY: 'singularity', SHOCKWAVE: 'shockwave', SLAM: 'slam',
    REAVE: 'reave', DOMINATE: 'dominate', BARRIER: 'barrier', OVERLOAD: 'overload', INCINERATE: 'incinerate',
    CRYO: 'cryoBlast', HACK: 'hack', 'ENERGY-DRAIN': 'energyDrain', FORTIFICATION: 'fortification', CONCUSSIVE: 'concussiveShot', STASIS: 'stasis' },
  ME3: { PULL: 'pull', THROW: 'throw', WARP: 'warp', SINGULARITY: 'singularity', SHOCKWAVE: 'shockwave', SLAM: 'slam',
    REAVE: 'reave', DOMINATE: 'dominate', BARRIER: 'barrier', OVERLOAD: 'overload', INCINERATE: 'incinerate',
    CRYO: 'cryoBlast', 'ENERGY-DRAIN': 'energyDrain', FORTIFICATION: 'fortification', CONCUSSIVE: 'concussiveShot', STASIS: 'stasis', SABOTAGE: 'sabotage' },
  MEA: { CONCUSSIVE: 'concussiveShot', THROW: 'throw', PULL: 'pull', SHOCKWAVE: 'shockwave', SINGULARITY: 'singularity',
    OVERLOAD: 'overload', INCINERATE: 'incinerate', 'ENERGY-DRAIN': 'energyDrain' },
  GAL: { STASIS: 'stasis', OVERLOAD: 'overload' },
};
const catalogueId = (mediaId, suffix) => `${mediaId}-${mediaId === 'GAL' ? 'PWR' : 'POW'}-${suffix}`;
export const UNIVERSE_POWER_MAPPINGS = freeze(Object.entries(ACTION_SUFFIXES).flatMap(([mediaId, powers]) =>
  Object.entries(powers).map(([suffix, actionId]) => {
    const id = catalogueId(mediaId, suffix), record = getUniverseRecord(id);
    if (!record || record.mediaId !== mediaId || record.fact !== true || !record.sourceIds.length) throw new Error(`Missing power provenance: ${id}`);
    return { catalogId: id, mediaId, name: record.name, actionId, sourceIds: [...record.sourceIds],
      reference: record.reference, sourceUrl: record.sourceUrl, conditions: record.conditions,
      statsBasis: 'ATB adaptation', verification: 'Catalogue fact; action mechanics adapted' };
  })));
const byId = new Map(UNIVERSE_POWER_MAPPINGS.map(power => [power.catalogId, power]));
export const getUniversePowerMapping = id => typeof id === 'string' ? byId.get(id) || null : null;

// Unlock conditions are attached to a power, never inferred from its name.
const assignments = {};
function kit(actorId, suffixes, loyalty = []) {
  const mediaId = actorId.split('-')[0];
  assignments[actorId] = suffixes.map(suffix => ({ catalogId: catalogueId(mediaId, suffix), requirement: loyalty.includes(suffix) ? 'loyalty' : null }));
}
kit('ME2-CHR-MIRANDA', ['WARP', 'OVERLOAD', 'SLAM'], ['SLAM']);
kit('ME2-CHR-JACOB', ['PULL', 'BARRIER'], ['BARRIER']);
kit('ME2-CHR-MORDIN', ['INCINERATE', 'CRYO']);
kit('ME2-CHR-GARRUS', ['OVERLOAD', 'CONCUSSIVE']);
kit('ME2-CHR-GRUNT', ['CONCUSSIVE', 'FORTIFICATION'], ['FORTIFICATION']);
kit('ME2-CHR-JACK', ['PULL', 'SHOCKWAVE']);
kit('ME2-CHR-TALI', ['HACK', 'ENERGY-DRAIN'], ['ENERGY-DRAIN']);
kit('ME2-CHR-THANE', ['THROW', 'WARP']);
kit('ME2-CHR-SAMARA', ['THROW', 'PULL', 'REAVE'], ['REAVE']);
kit('ME2-CHR-MORINTH', ['THROW', 'PULL', 'DOMINATE'], ['DOMINATE']);
kit('ME2-CHR-LEGION', ['HACK']);
kit('ME2-CHR-KASUMI', ['OVERLOAD']);
kit('ME2-CHR-ZAEED', ['CONCUSSIVE']);
kit('ME2-CHR-LIARA', ['WARP', 'SINGULARITY', 'STASIS']);
kit('ME3-CHR-JAMES', ['FORTIFICATION']);
kit('ME3-CHR-LIARA', ['WARP', 'SINGULARITY', 'STASIS']);
kit('ME3-CHR-GARRUS', ['OVERLOAD', 'CONCUSSIVE']);
kit('ME3-CHR-EDI', ['OVERLOAD', 'INCINERATE']);
kit('ME3-CHR-JAVIK', ['SLAM']);
kit('ME3-CHR-ASHLEY', ['CONCUSSIVE']);
kit('ME3-CHR-KAIDAN', ['OVERLOAD', 'BARRIER', 'REAVE', 'CRYO']);
kit('ME3-CHR-TALI', ['SABOTAGE', 'ENERGY-DRAIN']);
kit('ME3-CHR-ARIA', ['REAVE']);
kit('ME3-CHR-NYREEN', ['OVERLOAD', 'INCINERATE']);
kit('MEA-CHR-JAAL', ['ENERGY-DRAIN']);
kit('MEA-CHR-DRACK', ['INCINERATE']);
kit('MEA-CHR-PEEBEE', ['PULL']);
kit('GAL-CHR-JACOB', ['STASIS', 'OVERLOAD']);
export const ACTOR_POWER_ASSIGNMENTS = freeze(assignments);
const squadSources = { ME2: ['ME2-SRC-SQUAD'], ME3: ['ME3-SRC-SQUAD'], MEA: ['MEA-SRC-SQUAD', 'MEA-SRC-SKILLS'], GAL: ['GAL-ABIL'] };
const workshopFor = mediaId => `${mediaId.toLowerCase()}-equipment-workshop`;

export function getActorPowerKit(actorId, rawContext, scenarioId) {
  const context = normalizeContext(rawContext);
  if (!context || typeof actorId !== 'string' || !canAccessContent(actorId, context).ok) return null;
  const selected = own(ACTOR_POWER_ASSIGNMENTS, actorId) ? ACTOR_POWER_ASSIGNMENTS[actorId] : [];
  const unlocked = [], locked = [];
  for (const assignment of selected) {
    const mapping = getUniversePowerMapping(assignment.catalogId);
    if (!mapping || !canAccessContent(mapping.catalogId, context).ok) continue;
    const provenance = { ...mapping, actorCatalogId: actorId, attributionSourceIds: [...squadSources[context.mediaId] || []],
      requirement: assignment.requirement, attributionVerification: 'Secondary squad/skills reference; full source kit not certified 1:1' };
    if (assignment.requirement === 'loyalty' && scenarioId !== workshopFor(context.mediaId)) locked.push(provenance);
    else unlocked.push(provenance);
  }
  return { powers: unlocked.map(power => power.actionId), powerCatalogIds: unlocked.map(power => power.catalogId),
    powerProvenance: unlocked, lockedPowers: locked };
}

/** Canonical active names still lacking a runtime binding remain visible. */
export function unresolvedPowerNames(mediaId, labels, unlockedCatalogIds) {
  const normalize = value => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const enabled = new Set(unlockedCatalogIds.map(id => normalize(getUniverseRecord(id)?.name || '')));
  return labels.filter(label => {
    const name = normalize(label.replace(/ de loyauté$/u, ''));
    return !enabled.has(name);
  });
}

export const ME2_CLASS_PRIMARY_REFERENCE = freeze({
  sourceUrl: 'https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-2-manuals_PC_fr.pdf',
  reference: 'Manuel PC français, pages imprimées 22–24, annexe 2 : classes, armes et pouvoirs',
  verification: 'Primary manual consulted; ATB timing and unlock progression are adapted',
});

// These lists describe permitted skill families, not a canonical level or an
// acquisition history. Only the mapped subset is enabled in a prepared trial.
const shepardClasses = {
  soldier: { name: 'Soldat', weapons: ['pistol', 'assault', 'shotgun', 'sniper'], biotic: false, tech: false,
    ME2: ['ADRENALINE', 'CONCUSSIVE', 'AMMO-DISRUPTOR', 'AMMO-INCENDIARY', 'AMMO-CRYO'],
    ME3: ['ADRENALINE', 'CONCUSSIVE', 'FRAG', 'AMMO-DISRUPTOR', 'AMMO-INCENDIARY', 'AMMO-CRYO'] },
  engineer: { name: 'Ingénieur', weapons: ['pistol', 'smg'], biotic: false, tech: true,
    ME2: ['DRONE', 'OVERLOAD', 'HACK', 'INCINERATE', 'CRYO'],
    ME3: ['DRONE', 'OVERLOAD', 'INCINERATE', 'CRYO', 'SABOTAGE', 'SENTRY'] },
  adept: { name: 'Adepte', weapons: ['pistol', 'smg'], biotic: true, tech: false,
    ME2: ['SINGULARITY', 'THROW', 'PULL', 'SHOCKWAVE', 'WARP'],
    ME3: ['SINGULARITY', 'THROW', 'PULL', 'SHOCKWAVE', 'WARP', 'CLUSTER'] },
  infiltrator: { name: 'Franc-tireur', weapons: ['pistol', 'smg', 'sniper'], biotic: false, tech: true,
    ME2: ['TACTICAL', 'HACK', 'INCINERATE', 'AMMO-DISRUPTOR', 'AMMO-CRYO'],
    ME3: ['TACTICAL', 'INCINERATE', 'SABOTAGE', 'STICKY', 'AMMO-DISRUPTOR', 'AMMO-CRYO'] },
  vanguard: { name: 'Porte-étendard', weapons: ['pistol', 'smg', 'shotgun'], biotic: true, tech: false,
    ME2: ['CHARGE', 'PULL', 'SHOCKWAVE', 'AMMO-INCENDIARY', 'AMMO-CRYO'],
    ME3: ['CHARGE', 'PULL', 'SHOCKWAVE', 'NOVA', 'AMMO-INCENDIARY', 'AMMO-CRYO'] },
  sentinel: { name: 'Sentinelle', weapons: ['pistol', 'smg'], biotic: true, tech: true,
    ME2: ['TECH-ARMOR', 'THROW', 'CRYO', 'OVERLOAD', 'WARP'],
    ME3: ['TECH-ARMOR', 'THROW', 'CRYO', 'OVERLOAD', 'WARP', 'LIFT-GRENADE'] },
};
export const SHEPARD_CLASS_PREPARATIONS = freeze(shepardClasses);
export const RYDER_SKILL_PREPARATIONS = freeze({
  combat: { name: 'Préparation combat', biotic: false, tech: false, suffixes: ['CONCUSSIVE'],
    missing: ['Turbocharge', 'Omni Grenade', 'Passifs de combat et rangs non reproduits'] },
  biotic: { name: 'Préparation biotique', biotic: true, tech: false, suffixes: ['THROW', 'PULL', 'SHOCKWAVE'],
    missing: ['Charge', 'Nova', 'Profils passifs et rangs non reproduits'] },
  tech: { name: 'Préparation technologique', biotic: false, tech: true, suffixes: ['OVERLOAD', 'INCINERATE', 'ENERGY-DRAIN'],
    missing: ['Assault Turret', 'Remnant VI', 'Profils passifs et rangs non reproduits'] },
});

export function getPreparationPowers(mediaId, suffixes, actorId) {
  const powerCatalogIds = [], missingPowers = [], powerProvenance = [];
  for (const suffix of suffixes) {
    const id = catalogueId(mediaId, suffix), mapping = getUniversePowerMapping(id), record = getUniverseRecord(id);
    if (mapping) {
      powerCatalogIds.push(id);
      powerProvenance.push({ ...mapping, actorCatalogId: actorId, requirement: 'prepared-build',
        attributionSourceIds: [...mapping.sourceIds], attributionReference: mediaId === 'ME2' ? ME2_CLASS_PRIMARY_REFERENCE : null });
    } else missingPowers.push(record?.name || suffix);
  }
  return { powers: powerProvenance.map(power => power.actionId), powerCatalogIds, powerProvenance, missingPowers };
}

// Consumers may compare all documentary power cards with the smaller binding
// registry; a future card never obtains an action just by sharing a label.
export const UNIVERSE_POWER_CATALOG_IDS = freeze(UNIVERSE_RECORDS.filter(record => record.category === 'powers').map(record => record.id));
