// Equipment dossiers retain their work/segment provenance. A runtime profile is
// not permission to put that model in a scene: its explicit whitelist, period
// and wearer must all agree. Chronicle preparation has no economy or ME1 stock.
import { UNIVERSE_GROUPS } from './universe-data.js';
import { normalizeContext, canAccessContent } from './continuity.js';
import { SCENARIOS, getUniverseActorProfile, canUseUniverseActor } from './universe-actors.js';

const OWN = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const fail = reason => ({ ok: false, reason });
const SLOTS = Object.freeze(['weapon', 'armor']);
const PREPARATION_NOTE = 'Préparation libre du prototype ; acquisition et déblocages d’origine non simulés. Aucun crédit, stock ou objet transféré depuis ME1.';
const TUNING_NOTE = 'Budgets et effets adaptés au système ATB ; aucune fidélité numérique ou visuelle 1:1 certifiée.';
const AMMO = Object.freeze({
  pistol: Object.freeze({ magazineCapacity: 8, ammo: 8, reserveAmmo: 32 }),
  smg: Object.freeze({ magazineCapacity: 24, ammo: 24, reserveAmmo: 96 }),
  assault: Object.freeze({ magazineCapacity: 18, ammo: 18, reserveAmmo: 72 }),
  shotgun: Object.freeze({ magazineCapacity: 4, ammo: 4, reserveAmmo: 16 }),
  sniper: Object.freeze({ magazineCapacity: 2, ammo: 2, reserveAmmo: 8 }),
});
const definitions = {};
const editionSpecificIds = new Set([
  'ME2-WPN-LOCUST', 'ME2-WPN-COLLECTOR-RIFLE', 'ME2-EQP-KESTREL',
]);
const weapons = (work, type, suffixes) => {
  for (const suffix of suffixes) definitions[`${work}-WPN-${suffix}`] = {
    kind: 'weapon', slot: 'weapon', weaponType: type, weaponSystem: 'thermal-clip',
    requiredCapabilities: ['thermal-clip'], ...AMMO[type], bonuses: {},
  };
};
const locked = (id, kind, reason, requiredCapabilities = []) => {
  definitions[id] = { ...definitions[id], kind, slot: kind === 'weapon' ? 'weapon' : kind === 'armor' ? 'armor' : null,
    requiredCapabilities, unsupportedReason: reason, bonuses: {} };
};

weapons('ME2', 'pistol', ['PREDATOR', 'CARNIFEX', 'PHALANX']);
weapons('ME2', 'smg', ['SHURIKEN', 'TEMPEST', 'LOCUST']);
weapons('ME2', 'assault', ['AVENGER', 'VINDICATOR', 'REVENANT', 'MATTOCK', 'GETH-RIFLE', 'COLLECTOR-RIFLE']);
weapons('ME2', 'shotgun', ['KATANA', 'SCIMITAR', 'CLAYMORE', 'EVISCERATOR']);
weapons('ME2', 'sniper', ['MANTIS', 'VIPER', 'WIDOW', 'INCISOR']);
for (const suffix of ['REVENANT', 'CLAYMORE', 'WIDOW']) locked(`ME2-WPN-${suffix}`, 'weapon',
  'Les restrictions de porteur et de spécialisation de ce modèle restent à reconstituer.', ['model-specialization']);
locked('ME2-WPN-GETH-SHOTGUN', 'weapon', 'Le tir chargé de cette arme n’est pas encore reproduit.', ['charged-shot']);
for (const suffix of ['GRENADE', 'MISSILE', 'AVALANCHE', 'CAIN', 'PARTICLE', 'FIRESTORM', 'BLACKSTORM', 'ARC']) {
  locked(`ME2-WPN-${suffix}`, 'weapon', 'Arme lourde : réserve de cellules, ciblage et effet propre à implémenter.', ['heavy-weapon-cells', 'model-specific-fire']);
}

weapons('ME3', 'pistol', ['PREDATOR', 'PHALANX', 'CARNIFEX', 'PALADIN', 'TALON', 'SUPPRESSOR']);
weapons('ME3', 'smg', ['SHURIKEN', 'TEMPEST', 'LOCUST', 'HORNET', 'HURRICANE']);
weapons('ME3', 'assault', ['AVENGER', 'VINDICATOR', 'MATTOCK', 'REVENANT', 'PHAESTON', 'SABER', 'HARRIER', 'TYPHOON', 'VALKYRIE', 'GETH-RIFLE']);
weapons('ME3', 'shotgun', ['KATANA', 'SCIMITAR', 'CLAYMORE', 'EVISCERATOR', 'DISCIPLE', 'PIRANHA', 'RAIDER']);
weapons('ME3', 'sniper', ['MANTIS', 'VIPER', 'WIDOW', 'BLACK-WIDOW', 'JAVELIN', 'RAPTOR', 'INDRA', 'VALIANT']);
for (const suffix of ['FALCON', 'CHAKRAM', 'ADAS', 'SCORPION', 'ARC', 'ACOLYTE', 'GRAAL', 'REEGAR', 'VENOM', 'JAVELIN']) {
  locked(`ME3-WPN-${suffix}`, 'weapon', 'Le projectile, le rayon ou la charge propre à ce modèle reste à implémenter.', ['model-specific-fire']);
}
for (const suffix of ['PARTICLE', 'LANCER']) locked(`ME3-WPN-${suffix}`, 'weapon',
  'Ce modèle utilise une gestion thermique propre ; il ne doit pas recevoir les clips des armes conventionnelles.', ['model-specific-heat']);
for (const suffix of ['CAIN', 'HYDRA', 'BLACKSTAR']) locked(`ME3-WPN-${suffix}`, 'weapon',
  'Arme lourde locale : emplacement et réserve propres à la scène non reproduits.', ['local-heavy-weapon']);

weapons('MEA', 'pistol', ['PREDATOR', 'CARNIFEX', 'PHALANX', 'EAGLE', 'CHARGER', 'HORNET', 'SIDEWINDER', 'TALON']);
weapons('MEA', 'assault', ['AVENGER', 'CYCLONE', 'MATTOCK', 'REVENANT', 'VALKYRIE']);
weapons('MEA', 'shotgun', ['KATANA', 'RUZAD', 'DISCIPLE', 'PIRANHA']);
weapons('MEA', 'sniper', ['MANTIS', 'VIPER', 'BLACK-WIDOW', 'INDRA', 'VANQUISHER']);
for (const suffix of ['SWEEPER', 'PAW', 'EQUALIZER', 'SCATTERSHOT']) locked(`MEA-WPN-${suffix}`, 'weapon',
  'Technologie reliquate : gestion thermique et tir spécifiques à reproduire, sans substitution par des clips.', ['remnant-weapon-system']);
for (const suffix of ['THOKIN', 'ZALKIN', 'SONED', 'HESH', 'DHAN', 'ISHARAY', 'LANAT', 'INFERNO']) locked(`MEA-WPN-${suffix}`, 'weapon',
  'Technologie de Heleus : mécanisme de projectile et de charge à vérifier pour ce modèle.', ['heleus-model-specific-fire']);
for (const suffix of ['SCORPION', 'REEGAR', 'VENOM']) locked(`MEA-WPN-${suffix}`, 'weapon',
  'Le projectile explosif ou le rayon de ce modèle reste à implémenter.', ['model-specific-fire']);
for (const suffix of ['PIONEER', 'DEEP-IMPACT', 'WATCHMAN']) locked(`MEA-WPN-${suffix}`, 'weapon',
  'Variante Pathfinder Elite : édition, acquisition et comportement propre à vérifier.', ['edition-specific-model']);
for (const suffix of ['OMNIBLADE', 'ASARI-SWORD', 'KROGAN-HAMMER', 'FIRAAN', 'CARFALON', 'VAKARSH', 'CRYO-GAUNTLET', 'BIOTIC-AMP']) {
  locked(`MEA-WPN-${suffix}`, 'weapon', 'Arme de mêlée : action et effets propres non implémentés ; aucun pouvoir accordé.', ['melee-equipment']);
}

const armors = (work, suffixes, baseline) => {
  for (const suffix of suffixes) definitions[`${work}-EQP-${suffix}`] = {
    kind: 'armor', slot: 'armor', armorSpecies: ['human'],
    wearerIds: [work === 'MEA' ? 'MEA-CHR-RYDER' : `${work}-CHR-SHEPARD`], requiredCapabilities: ['armor-set'],
    // One transparent prototype budget, not guessed original model bonuses.
    bonuses: suffix === baseline ? {} : { defense: 2, shield: 10 },
  };
};
armors('ME2', ['N7', 'KESTREL', 'CERBERUS', 'COLLECTOR', 'TERMINUS', 'BLOOD-DRAGON', 'INFERNO'], 'N7');
armors('ME3', ['N7', 'AJAX', 'INFERNO', 'BLOOD-DRAGON', 'COLLECTOR', 'TERMINUS', 'CERBERUS'], 'N7');
armors('MEA', ['INITIATIVE', 'PATHFINDER', 'N7', 'HYPERGUARDIAN', 'MAVERICK', 'ANGARAN', 'KETT', 'REMNANT', 'HELEUS', 'SCAVENGER', 'DEEP-SPACE'], 'INITIATIVE');
locked('MEA-EQP-REMNANT', 'armor', 'Les effets propres à cette protection reliquate restent à vérifier et à implémenter.', ['remnant-armor-system']);
for (const suffix of ['MATTOCK', 'EVISCERATOR', 'INCISOR', 'PARTICLE']) locked(`INF-WPN-${suffix}`, 'weapon',
  'Système d’arme propre à Infiltrator à vérifier ; aucune recharge ME2 ni chauffe ME1 déduite.', ['infiltrator-weapon-system']);
locked('GAL-WPN-AVENGER', 'weapon', 'Système d’arme de Galaxy à vérifier ; le nom seul ne détermine pas sa gestion thermique.', ['galaxy-weapon-system']);

const freeze = value => {
  if (value && typeof value === 'object') { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
  return value;
};
const records = Array.isArray(UNIVERSE_GROUPS.equipment) ? UNIVERSE_GROUPS.equipment : [];
export const UNIVERSE_EQUIPMENT = freeze(records.filter(record => record.mediaId !== 'ME1').map(record => {
  const definition = definitions[record.id];
  const requiresEdition = editionSpecificIds.has(record.id)
    || /(?:DLC|additionnel|additionnelle|promotionnel|édition|Legendary|Deluxe|Kasumi|Leviathan|pack)/i.test(`${record.description} ${record.conditions}`);
  const supported = !!definition && !definition.unsupportedReason && !requiresEdition;
  return {
    ...record, ...definition, kind: definition?.kind || 'reference', slot: definition?.slot || null,
    bonuses: { ...definition?.bonuses }, requiredCapabilities: [...definition?.requiredCapabilities || []],
    runtimeSupported: supported, playable: false, requiresEdition,
    lockReason: definition?.unsupportedReason || (requiresEdition
      ? 'Édition ou contenu additionnel requis : sa disponibilité n’est pas configurée dans cet essai.' : supported
      ? 'Choisissez un porteur et une scène attestant explicitement ce modèle.'
      : 'Fiche documentaire : modèle précis, emplacement ou mécanique non reconstitués.'),
    statsBasis: 'ATB adaptation', tuningNote: TUNING_NOTE, acquisitionNote: PREPARATION_NOTE,
    firingModelNote: definition?.kind === 'weapon'
      ? 'Profil de famille ATB ; cadence, dispersion, précision, sons et variantes de tir d’origine non reproduits.' : null,
    visualMode: 'prototype-symbol',
  };
}));
const byId = new Map(UNIVERSE_EQUIPMENT.map(item => [item.id, item]));
export const getUniverseEquipment = id => typeof id === 'string' ? byId.get(id) || null : null;

const scenarioFor = (context, scenarioId) => typeof scenarioId === 'string' ? SCENARIOS.find(scenario => {
  const scope = normalizeContext(scenario.context);
  return scenario.id === scenarioId && scope?.mediaId === context.mediaId && scope.periodId === context.periodId;
}) || null : null;

/** Scene evidence and wearer permissions are checked separately from dossier access. */
export function canEquipUniverseItem(rawContext, actorId, itemId, slot, scenarioId) {
  try {
    const context = normalizeContext(rawContext), item = getUniverseEquipment(itemId);
    if (!context) return fail('Œuvre ou segment indisponible.');
    if (!item) return fail('Équipement inconnu.');
    const access = canAccessContent(item.id, context);
    if (!access.ok) return fail(access.reason);
    if (typeof actorId !== 'string' || !canUseUniverseActor(context, actorId, scenarioId).ok) return fail('Porteur indisponible dans cette scène et cette période.');
    const profile = getUniverseActorProfile(actorId, context);
    if (!profile) return fail('Profil de porteur indisponible.');
    if (!item.runtimeSupported) return fail(item.lockReason);
    const targetSlot = slot ?? item.slot;
    if (!SLOTS.includes(targetSlot) || targetSlot !== item.slot) return fail('Cet équipement ne correspond pas à cet emplacement.');
    const scenario = scenarioFor(context, scenarioId);
    if (!scenario) return fail('Choisissez un essai tactique attesté pour cette période.');
    if (!Array.isArray(scenario.allowedEquipmentIds) || !scenario.allowedEquipmentIds.includes(item.id))
      return fail('La présence de ce modèle n’est pas attestée dans cette scène.');
    if (scenario.allowedEquipmentByActor && (!OWN(scenario.allowedEquipmentByActor, actorId)
      || !scenario.allowedEquipmentByActor[actorId].includes(item.id))) return fail('Ce modèle n’est pas attesté pour ce porteur dans cette scène.');
    if (item.kind === 'weapon' && !profile.allowedWeapons.includes(item.weaponType)) return fail('Cette famille d’arme ne fait pas partie du profil du porteur.');
    if (item.kind === 'armor' && (!item.armorSpecies.includes(profile.armorSpecies) || !item.wearerIds.includes(actorId)))
      return fail('Cette protection est réservée au protagoniste et à la morphologie documentés.');
    return { ok: true, reason: null, slot: targetSlot, item };
  } catch { return fail('Équipement ou contexte invalide.'); }
}

/** Lists only dossiers available in this exact segment; references remain non-equippable. */
export function listUniverseEquipment(rawContext, { actorId, scenarioId } = {}) {
  const context = normalizeContext(rawContext);
  if (!context) return [];
  return UNIVERSE_EQUIPMENT.filter(item => canAccessContent(item.id, context).ok).map(item => {
    const check = actorId === undefined ? fail(item.lockReason) : canEquipUniverseItem(context, actorId, item.id, undefined, scenarioId);
    return { ...item, compatible: check.ok, playable: check.ok, reason: check.reason };
  });
}

const plain = value => value && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
function ownData(value, maxKeys = 20) {
  if (!plain(value)) return false;
  const keys = Reflect.ownKeys(value);
  return keys.length <= maxKeys && keys.every(key => typeof key === 'string' && !['__proto__', 'prototype', 'constructor'].includes(key)
    && OWN(Object.getOwnPropertyDescriptor(value, key), 'value') && Object.getOwnPropertyDescriptor(value, key).enumerable);
}
const emptyLoadout = () => ({ weapon: null, armor: null });
function partyIds(value) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length > 8
    || Reflect.ownKeys(value).length !== value.length + 1) return null;
  const result = [];
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !OWN(descriptor, 'value') || !descriptor.enumerable || typeof descriptor.value !== 'string') return null;
    result.push(descriptor.value);
  }
  return new Set(result).size === result.length ? result : null;
}

/** Missing rows become empty neutral selections; unknown actors/slots never migrate. */
export function normalizeChronicleLoadouts(raw, rawContext, party, scenarioId) {
  try {
    const context = normalizeContext(rawContext), ids = partyIds(party);
    if (!context || !ids || ids.length && !scenarioFor(context, scenarioId)
      || ids.some(id => !canUseUniverseActor(context, id, scenarioId).ok)) return null;
    if (raw !== undefined && (!ownData(raw, 8) || Object.keys(raw).some(id => !ids.includes(id)))) return null;
    const result = {};
    for (const actorId of ids) {
      const row = raw && OWN(raw, actorId) ? raw[actorId] : emptyLoadout();
      if (!ownData(row, 2) || Reflect.ownKeys(row).length !== 2 || !SLOTS.every(slot => OWN(row, slot))) return null;
      result[actorId] = {};
      for (const slot of SLOTS) {
        const itemId = row[slot];
        if (itemId !== null && (typeof itemId !== 'string' || !canEquipUniverseItem(context, actorId, itemId, slot, scenarioId).ok)) return null;
        result[actorId][slot] = itemId;
      }
    }
    return result;
  } catch { return null; }
}

/** Returns a replacement map and never mutates the session or campaign state. */
export function equipChronicleItem(session, actorId, itemId, slot) {
  try {
    if (!ownData(session)) return fail('Session invalide.');
    const context = normalizeContext(session.context);
    const loadouts = normalizeChronicleLoadouts(session.loadouts, context, session.party, session.scenarioId);
    if (!loadouts || typeof actorId !== 'string' || !OWN(loadouts, actorId)) return fail('Porteur ou préparation invalide.');
    const targetSlot = slot ?? getUniverseEquipment(itemId)?.slot;
    if (!SLOTS.includes(targetSlot)) return fail('Emplacement inconnu.');
    if (itemId !== null) {
      const check = canEquipUniverseItem(context, actorId, itemId, targetSlot, session.scenarioId);
      if (!check.ok) return check;
    }
    loadouts[actorId][targetSlot] = itemId;
    return { ok: true, reason: null, loadouts };
  } catch { return fail('Préparation invalide.'); }
}

const neutralEffects = () => ({ hp: 0, shield: 0, attack: 0, defense: 0, weaponHeatMultiplier: 1,
  weaponCoolingBonus: 0, controlResistance: 0, bioticMultiplier: 1, techMultiplier: 1 });

/** Base hp/shield/attack/defense are added once by the chronicles compositor. */
export function getChronicleEquipmentEffects(session, actorId) {
  const effects = neutralEffects();
  try {
    if (!ownData(session)) return effects;
    const loadouts = normalizeChronicleLoadouts(session.loadouts, session.context, session.party, session.scenarioId);
    if (!loadouts || typeof actorId !== 'string' || !OWN(loadouts, actorId)) return effects;
    for (const itemId of Object.values(loadouts[actorId])) {
      const item = getUniverseEquipment(itemId);
      if (!item) continue;
      for (const key of ['hp', 'shield', 'attack', 'defense', 'weaponCoolingBonus', 'controlResistance'])
        if (Number.isFinite(item.bonuses[key])) effects[key] += item.bonuses[key];
      for (const key of ['weaponHeatMultiplier', 'bioticMultiplier', 'techMultiplier'])
        if (Number.isFinite(item.bonuses[key]) && item.bonuses[key] > 0) effects[key] *= item.bonuses[key];
      if (item.kind === 'weapon') Object.assign(effects, {
        weaponType: item.weaponType, weaponName: item.name, weaponSystem: item.weaponSystem,
        magazineCapacity: item.magazineCapacity, ammo: item.ammo, reserveAmmo: item.reserveAmmo,
      });
    }
    return effects;
  } catch { return neutralEffects(); }
}
