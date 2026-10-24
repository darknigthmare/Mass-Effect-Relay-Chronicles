// Source identities remain separate by work and segment. A character card is
// never a recruitment right. Only the explicit tactical scenario rosters below
// authorize combat; their statistics and encounter counts are ATB adaptations.
import { UNIVERSE_GROUPS, getUniverseRecord } from './universe-data.js';
import { canAccessContent, normalizeContext } from './continuity.js';
import { getActorPowerKit, unresolvedPowerNames, SHEPARD_CLASS_PREPARATIONS, RYDER_SKILL_PREPARATIONS, getPreparationPowers, ME2_CLASS_PRIMARY_REFERENCE } from './universe-powers.js';

const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const WEAPONS = ['pistol', 'smg', 'assault', 'shotgun', 'sniper'];
const TUNING = {
  soldier: { hp: 250, shield: 140, attack: 30, defense: 10, speed: 1 },
  hybrid: { hp: 220, shield: 140, attack: 24, defense: 7, speed: 1 },
  biotic: { hp: 210, shield: 120, attack: 20, defense: 5, speed: 1.05 },
  tech: { hp: 210, shield: 140, attack: 22, defense: 6, speed: 1.02 },
  sniper: { hp: 220, shield: 130, attack: 32, defense: 7, speed: .96 },
  krogan: { hp: 320, shield: 110, attack: 30, defense: 12, speed: .85 },
};
// These are subsets of existing powers, never substitutions such as Warp for
// Reave, Barrier for Fortification, or ME1 Lift for every later biotic ability.
// Missing powers remain listed so a gun-only prototype cannot imply a full kit.
const definitions = [];
function actor(id, tuning, species, weapons, powers = [], missingPowers = [], extra = {}) {
  definitions.push({ id, tuning, biologicalSpecies: species, armorSpecies: species === 'asari' ? 'human' : species,
    allowedWeapons: weapons, weaponTraining: weapons, powers, missingPowers,
    biotic: false, tech: false, playable: true, role: 'combatant', ...extra });
}
actor('ME2-CHR-SHEPARD', 'soldier', 'human', WEAPONS, [], ['Classe et talents personnalisés'], { role: 'protagonist', classPolicy: 'Profil militaire de prototype ; aucune classe canonique imposée.' });
actor('ME2-CHR-MIRANDA', 'hybrid', 'human', ['pistol', 'smg'], ['warp', 'overload'], ['Slam de loyauté'], { biotic: true, tech: true });
actor('ME2-CHR-JACOB', 'hybrid', 'human', ['pistol', 'shotgun'], [], ['Pull', 'Incendiary Ammo', 'Barrier de loyauté'], { biotic: true });
actor('ME2-CHR-MORDIN', 'tech', 'salarian', ['pistol', 'smg'], [], ['Incinerate', 'Cryo Blast', 'Neural Shock'], { tech: true });
actor('ME2-CHR-GARRUS', 'sniper', 'turian', ['assault', 'sniper'], ['overload'], ['Concussive Shot', 'Armor-Piercing Ammo'], { tech: true });
actor('ME2-CHR-GRUNT', 'krogan', 'krogan', ['assault', 'shotgun'], [], ['Concussive Shot', 'Fortification', 'Incendiary Ammo']);
actor('ME2-CHR-JACK', 'biotic', 'human', ['pistol', 'shotgun'], [], ['Pull', 'Shockwave', 'Warp Ammo'], { biotic: true });
actor('ME2-CHR-TALI', 'tech', 'quarian', ['pistol', 'shotgun'], ['hack'], ['Combat Drone', 'Energy Drain'], { tech: true });
actor('ME2-CHR-THANE', 'sniper', 'drell', ['smg', 'sniper'], ['throw', 'warp'], ['Shredder Ammo'], { biotic: true });
actor('ME2-CHR-SAMARA', 'biotic', 'asari', ['assault', 'smg'], ['throw'], ['Pull', 'Reave'], { biotic: true });
actor('ME2-CHR-MORINTH', 'biotic', 'asari', ['assault', 'smg'], ['throw'], ['Pull', 'Dominate'], { biotic: true });
actor('ME2-CHR-LEGION', 'sniper', 'geth', ['assault', 'sniper'], ['hack'], ['Combat Drone', 'Geth Shield Boost'], { tech: true, synthetic: true });
actor('ME2-CHR-KASUMI', 'tech', 'human', ['pistol', 'smg'], ['overload'], ['Shadow Strike', 'Flashbang Grenade'], { tech: true });
actor('ME2-CHR-ZAEED', 'soldier', 'human', ['assault', 'sniper'], [], ['Concussive Shot', 'Inferno Grenade', 'Disruptor Ammo']);
actor('ME2-CHR-LIARA', 'biotic', 'asari', ['pistol', 'smg'], ['warp', 'singularity', 'stasis'], [], { biotic: true, sceneRestriction: 'Lair of the Shadow Broker uniquement.' });
actor('ME3-CHR-SHEPARD', 'soldier', 'human', WEAPONS, [], ['Classe et talents personnalisés'], { role: 'protagonist', classPolicy: 'Profil militaire de prototype ; aucune classe canonique imposée.' });
actor('ME3-CHR-JAMES', 'soldier', 'human', ['assault', 'shotgun'], [], ['Fortification', 'Frag Grenade', 'Carnage']);
actor('ME3-CHR-LIARA', 'biotic', 'asari', ['pistol', 'smg'], ['warp', 'singularity', 'stasis'], [], { biotic: true });
actor('ME3-CHR-GARRUS', 'sniper', 'turian', ['assault', 'sniper'], ['overload'], ['Proximity Mine', 'Concussive Shot'], { tech: true });
actor('ME3-CHR-EDI', 'tech', 'synthetic', ['pistol', 'smg'], ['overload'], ['Incinerate', 'Decoy', 'Defense Matrix'], { tech: true, synthetic: true });
actor('ME3-CHR-JAVIK', 'hybrid', 'prothean', ['assault', 'pistol'], [], ['Dark Channel', 'Slam', 'Lift Grenade'], { biotic: true });
actor('ME3-CHR-ASHLEY', 'soldier', 'human', ['assault', 'sniper'], [], ['Marksman', 'Concussive Shot', 'Disruptor Ammo']);
actor('ME3-CHR-KAIDAN', 'hybrid', 'human', ['assault', 'pistol'], ['overload', 'barrier'], ['Reave', 'Cryo Blast'], { biotic: true, tech: true });
actor('ME3-CHR-TALI', 'tech', 'quarian', ['pistol', 'shotgun'], ['sabotage'], ['Combat Drone', 'Defense Drone', 'Energy Drain'], { tech: true });
actor('ME3-CHR-ANDERSON', 'soldier', 'human', ['assault', 'pistol'], [], [], { role: 'temporary-combatant', sceneRestriction: 'Prologue terrestre uniquement.' });
actor('ME3-CHR-ARIA', 'biotic', 'asari', ['smg', 'shotgun'], [], ['Flare', 'Lash', 'Reave', 'Carnage'], { biotic: true, sceneRestriction: 'Omega uniquement.' });
actor('ME3-CHR-NYREEN', 'hybrid', 'turian', ['assault', 'pistol'], ['overload'], ['Incinerate', 'Lift Grenade', 'Biotic Protector'], { biotic: true, tech: true, sceneRestriction: 'Omega uniquement.' });
actor('ME3-CHR-WREX', 'krogan', 'krogan', ['shotgun'], [], ['Carnage', 'Stimulant Pack', 'Lift Grenade'], { sceneRestriction: 'Citadel, s’il est vivant.' });
actor('MEA-CHR-RYDER', 'soldier', 'human', WEAPONS, [], ['Compétences et profils personnalisés'], { role: 'protagonist', classPolicy: 'Profil militaire de prototype ; Sara ou Scott ne devient pas une classe de Shepard.' });
actor('MEA-CHR-CORA', 'biotic', 'human', ['shotgun', 'pistol'], [], ['Charge', 'Nova', 'Shield Boost'], { biotic: true });
actor('MEA-CHR-LIAM', 'soldier', 'human', ['assault'], [], ['Havoc Strike', 'Frag Grenade']);
actor('MEA-CHR-VETRA', 'soldier', 'turian', ['assault'], [], ['Power Armor', 'Turbocharge']);
actor('MEA-CHR-JAAL', 'sniper', 'angara', ['sniper'], [], ['Energy Drain', 'Avenger Strike', 'Sticky Grenade'], { tech: true });
actor('MEA-CHR-DRACK', 'krogan', 'krogan', ['shotgun'], [], ['Blood Rage', 'Incinerate', 'Flak Cannon'], { tech: true });
actor('MEA-CHR-PEEBEE', 'biotic', 'asari', ['pistol'], [], ['Pull', 'Invasion', 'Flak Cannon'], { biotic: true, tech: true });
actor('MEA-CHR-ALEC', 'soldier', 'human', WEAPONS, [], ['Profils et compétences non relevés'], { role: 'temporary-combatant', sceneRestriction: 'Habitat 7 uniquement.' });
actor('INF-CHR-RANDALL', 'soldier', 'human', ['assault', 'shotgun', 'sniper'], [], ['Implants et pouvoirs non confirmés'], { role: 'protagonist' });
actor('INF-CHR-TURIAN', 'soldier', 'turian', ['assault', 'shotgun', 'sniper'], [], [], { sceneRestriction: 'Bonus Incarceration uniquement.' });
actor('GAL-CHR-JACOB', 'hybrid', 'human', ['assault'], ['stasis', 'overload'], [], { role: 'protagonist', biotic: true, tech: true });
actor('PL-CHR-VEGA', 'soldier', 'human', ['assault'], [], [], { role: 'protagonist' });
actor('RED-ACT-LIARA', 'biotic', 'asari', ['pistol'], [], ['Manifestations biotiques exactes non relevées dans le comic'], { biotic: true });
actor('RED-ACT-FERON', 'soldier', 'drell', ['pistol'], [], ['Techniques exactes non relevées']);

const overlays = new Map(definitions.map(definition => [definition.id, definition]));
export const UNIVERSE_ACTORS = freeze(UNIVERSE_GROUPS.actors.map(record => {
  const definition = overlays.get(record.id);
  const scope = record.availability.find(item => item.mediaId === record.mediaId);
  const kit = definition && scope?.periodIds[0] ? getActorPowerKit(record.id, { mediaId: record.mediaId, periodId: scope.periodIds[0] }) : null;
  return { ...record, id: record.id, catalogId: record.id, mediaId: record.mediaId,
    periodIds: record.availability.flatMap(scope => scope.periodIds),
    role: 'narrative', playable: false, allowedWeapons: [], weaponTraining: [], powers: [], missingPowers: [],
    biologicalSpecies: null, armorSpecies: null, biotic: false, tech: false,
    ...definition, ...(kit ? { powers: kit.powers, powerCatalogIds: kit.powerCatalogIds, powerProvenance: kit.powerProvenance,
      lockedPowers: kit.lockedPowers, missingPowers: unresolvedPowerNames(record.mediaId, definition.missingPowers, kit.powerCatalogIds) } : {}),
    canUseOmniTool: definition?.tech || false,
    visualMode: 'prototype-symbol', portrait: null, sprite: null,
    statsBasis: definition ? 'ATB adaptation' : null,
    implementationNote: definition ? 'Prototype partiel : statistiques adaptées, sans portrait ni sprite de ce personnage ; pouvoirs manquants explicitement conservés.' : 'Fiche documentaire ; aucun rôle de combattant ou recrutement accordé.',
  };
}));
const actorById = new Map(UNIVERSE_ACTORS.map(profile => [profile.id, profile]));
export const getUniverseActor = id => typeof id === 'string' ? actorById.get(id) || null : null;

function enemy(catalogId, name, changes = {}) {
  return { id: `${catalogId}:prototype`, catalogId, name, hp: 105, maxHp: 105, shield: 25, maxShield: 25,
    attack: 14, defense: 3, speed: .65, powers: [], synthetic: false,
    visualMode: 'prototype-symbol', portrait: null, sprite: null, statsBasis: 'ATB adaptation', ...changes };
}
function scenario(id, mediaId, periodId, name, actorIds, defaultParty, enemies, sourceEntryIds, description) {
  return { id, context: { mediaId, periodId }, name, label: name, kind: 'tactical-skirmish', actorIds, defaultParty, enemies,
    sourceEntryIds, sourceIds: [...new Set(sourceEntryIds.flatMap(entryId => getUniverseRecord(entryId)?.sourceIds || []))],
    allowedEquipmentIds: [], description: `Essai tactique : ${description} Les effectifs et chiffres sont adaptés à l’ATB ; ce prototype ne reproduit pas la mission complète et n’accorde aucune récompense de campagne.` };
}
const workshopWeapons = {
  ME2: ['PREDATOR', 'CARNIFEX', 'SHURIKEN', 'TEMPEST', 'AVENGER', 'VINDICATOR', 'KATANA', 'SCIMITAR', 'MANTIS', 'VIPER'],
  ME3: ['AVENGER', 'VINDICATOR', 'MATTOCK', 'REVENANT', 'PHAESTON', 'SABER', 'GETH-RIFLE', 'PREDATOR', 'PHALANX', 'CARNIFEX', 'PALADIN', 'TALON', 'KATANA', 'SCIMITAR', 'CLAYMORE', 'EVISCERATOR', 'DISCIPLE', 'MANTIS', 'VIPER', 'WIDOW', 'BLACK-WIDOW', 'RAPTOR', 'SHURIKEN', 'TEMPEST', 'LOCUST', 'HORNET'],
  MEA: ['AVENGER', 'CYCLONE', 'MATTOCK', 'REVENANT', 'VALKYRIE', 'PREDATOR', 'CARNIFEX', 'PHALANX', 'EAGLE', 'CHARGER', 'HORNET', 'SIDEWINDER', 'TALON', 'KATANA', 'RUZAD', 'DISCIPLE', 'PIRANHA', 'MANTIS', 'VIPER', 'BLACK-WIDOW', 'INDRA', 'VANQUISHER'],
};
function workshop(mediaId, actorIds, exclusiveActorGroups = []) {
  const equipmentIds = [...workshopWeapons[mediaId].map(model => `${mediaId}-WPN-${model}`),
    ...(mediaId === 'MEA' ? ['INITIATIVE', 'PATHFINDER', 'N7', 'HYPERGUARDIAN', 'MAVERICK', 'ANGARAN', 'KETT', 'HELEUS'] : ['N7']).map(model => `${mediaId}-EQP-${model}`)];
  if (mediaId === 'ME3') equipmentIds.push('ME3-EQP-BARREL', 'ME3-EQP-MAGAZINE');
  const title = mediaId === 'MEA' ? 'Andromeda' : mediaId === 'ME2' ? 'Mass Effect 2' : 'Mass Effect 3';
  const scene = scenario(`${mediaId.toLowerCase()}-equipment-workshop`, mediaId, mediaId.toLowerCase(), `Atelier d’équipement — ${title}`, actorIds, actorIds.slice(0, 3),
    [enemy('prototype-target', 'Cible mécanique — banc ATB', { id: `${mediaId}:workshop:synthetic`, catalogId: null, abstract: true, synthetic: true, hp: 250, maxHp: 250, attack: 5 }),
      enemy('prototype-target', 'Cible organique — banc ATB', { id: `${mediaId}:workshop:organic`, catalogId: null, abstract: true, hp: 250, maxHp: 250, attack: 5 })],
    equipmentIds, 'banc de production indépendant pour les modèles de cette œuvre et les mécaniques effectivement disponibles. Les cibles sont des gabarits de test originaux. Aucun modèle n’est attribué à une mission ou acquis dans l’histoire.');
  return { ...scene, kind: 'equipment-workshop', allowedEquipmentIds: equipmentIds, exclusiveActorGroups,
    description: `${scene.description} Les compagnons conditionnels sont proposés dans un état de test où ils ont rejoint le groupe et survécu ; les pouvoirs de loyauté de ME2 sont disponibles dans cet atelier post-loyauté, sans acquisition narrative ; leurs conditions documentaires et leurs alternatives restent distinctes. Cet atelier ne recrute personne dans une campagne. Les armures personnelles restent réservées à Shepard ou Ryder selon l’œuvre.` };
}
function redemptionSimulation() {
  const scene = scenario('red-liara-feron', 'RED', 'red', 'Redemption — banc de personnages',
    ['RED-ACT-LIARA', 'RED-ACT-FERON'], ['RED-ACT-LIARA', 'RED-ACT-FERON'],
    [enemy('prototype-target', 'Mannequin mécanique — original', { id: 'RED:simulation:synthetic', catalogId: null, abstract: true, synthetic: true }),
      enemy('prototype-target', 'Mannequin organique — original', { id: 'RED:simulation:organic', catalogId: null, abstract: true })],
    ['RED-ACT-LIARA', 'RED-ACT-FERON'], 'banc de production indépendant autour des rôles de Liara et Feron. Les mannequins sont originaux et ne représentent aucun adversaire du comic. Les rencontres dont la référence reste à vérifier demeurent fermées ; aucun événement du récit n’est rejoué.');
  return { ...scene, kind: 'tactical-simulation' };
}
function contextualSimulation(id, mediaId, periodId, name, actorIds, sourceEntryIds, description) {
  const scene = scenario(id, mediaId, periodId, name, actorIds, actorIds,
    [enemy('prototype-target', 'Mannequin mécanique — original', { id: `${mediaId}:simulation:synthetic`, catalogId: null, abstract: true, synthetic: true }),
      enemy('prototype-target', 'Mannequin organique — original', { id: `${mediaId}:simulation:organic`, catalogId: null, abstract: true })],
    sourceEntryIds, `configuration de commando à l’époque du prologue, dans un banc de personnages indépendant. ${description} Les adversaires exacts de cette scène ne sont pas vérifiés : seuls des mannequins originaux sont employés ; aucune rencontre de la mission n’est reproduite.`);
  return { ...scene, kind: 'tactical-simulation' };
}
export const CHRONICLE_SCENARIOS = freeze([
  scenario('me2-freedoms-progress', 'ME2', 'me2', 'Freedom’s Progress — sécurité mécanique',
    ['ME2-CHR-SHEPARD', 'ME2-CHR-MIRANDA', 'ME2-CHR-JACOB'], ['ME2-CHR-SHEPARD', 'ME2-CHR-MIRANDA', 'ME2-CHR-JACOB'],
    [enemy('ME2-ENM-LOKI', 'LOKI — prototype', { synthetic: true }), enemy('ME2-ENM-LOKI', 'LOKI — prototype', { id: 'ME2-ENM-LOKI:prototype-2', synthetic: true })],
    ['ME2-MQ-FREEDOM', 'ME2-CHR-MIRANDA', 'ME2-CHR-JACOB', 'ME2-ENM-LOKI'], 'le groupe d’enquête de Shepard affronte des machines de sécurité de la colonie.'),
  contextualSimulation('me3-earth-prologue', 'ME3', 'me3-prologue', 'Terre — banc du prologue',
    ['ME3-CHR-SHEPARD', 'ME3-CHR-ANDERSON'], ['ME3-MQ-EARTH-PROLOGUE', 'ME3-CHR-ANDERSON'],
    'Anderson accompagne Shepard dans ce prologue ; ce rôle temporaire ne lui accorde aucune place en campagne principale.'),
  contextualSimulation('mea-habitat7', 'MEA', 'mea-prologue', 'Habitat 7 — banc de personnages',
    ['MEA-CHR-RYDER', 'MEA-CHR-ALEC'], ['MEA-MQ-PLANETSIDE', 'MEA-CHR-ALEC'],
    'Ryder et Alec appartiennent à la première expédition ; Alec reste limité à ce prologue.'),
  scenario('inf-security', 'INF', 'inf', 'Infiltrator — fuite face à Cerberus', ['INF-CHR-RANDALL'], ['INF-CHR-RANDALL'],
    [enemy('INF-ENM-TROOPER', 'Soldat de Cerberus — prototype'), enemy('INF-ENM-MECH', 'Mech de Cerberus — prototype', { synthetic: true })],
    ['INF-MIS-SECURITY', 'INF-CHR-RANDALL', 'INF-ENM-TROOPER', 'INF-ENM-MECH'], 'Randall affronte les forces du centre pendant sa fuite ; aucun pouvoir d’implant non confirmé n’est ajouté.'),
  scenario('gal-jacob', 'GAL', 'gal', 'Galaxy — intervention de Jacob', ['GAL-CHR-JACOB'], ['GAL-CHR-JACOB'],
    [enemy('GAL-ENM-ROBOT', 'Robot — prototype', { synthetic: true }), enemy('GAL-ENM-TURIAN', 'Adversaire turien — prototype')],
    ['GAL-CHR-JACOB', 'GAL-ENM-ROBOT', 'GAL-ENM-TURIAN', 'GAL-PWR-STASIS', 'GAL-PWR-OVERLOAD'], 'Jacob utilise les deux pouvoirs documentés de Galaxy contre les types d’adversaires répertoriés. Cet exercice n’est attribué à aucune rencontre précise.'),
  scenario('pl-collectors', 'PL', 'pl-collectors', 'Paragon Lost — crise des Récolteurs', ['PL-CHR-VEGA'], ['PL-CHR-VEGA'],
    [enemy('PL-REF-COLLECTOR', 'Récolteur — prototype')],
    ['PL-CHR-VEGA', 'PL-REF-COLLECTOR'], 'Vega est confronté aux Récolteurs de Fehl Prime ; aucun membre de Delta Squad dont la fenêtre de présence reste à vérifier n’est sélectionnable.'),
  redemptionSimulation(),
  workshop('ME2', ['ME2-CHR-SHEPARD', 'ME2-CHR-MIRANDA', 'ME2-CHR-JACOB', 'ME2-CHR-MORDIN',
    'ME2-CHR-GARRUS', 'ME2-CHR-GRUNT', 'ME2-CHR-JACK', 'ME2-CHR-TALI', 'ME2-CHR-THANE',
    'ME2-CHR-SAMARA', 'ME2-CHR-LEGION', 'ME2-CHR-MORINTH'], [['ME2-CHR-SAMARA', 'ME2-CHR-MORINTH']]),
  workshop('ME3', ['ME3-CHR-SHEPARD', 'ME3-CHR-LIARA', 'ME3-CHR-JAMES', 'ME3-CHR-GARRUS',
    'ME3-CHR-EDI', 'ME3-CHR-TALI', 'ME3-CHR-ASHLEY', 'ME3-CHR-KAIDAN'], [['ME3-CHR-ASHLEY', 'ME3-CHR-KAIDAN']]),
  workshop('MEA', ['MEA-CHR-RYDER', 'MEA-CHR-CORA', 'MEA-CHR-LIAM', 'MEA-CHR-VETRA',
    'MEA-CHR-JAAL', 'MEA-CHR-DRACK', 'MEA-CHR-PEEBEE']),
]);
export const SCENARIOS = CHRONICLE_SCENARIOS;
export function getUniverseScenario(context, scenarioId) {
  return CHRONICLE_SCENARIOS.find(item => item.id === scenarioId && item.context.mediaId === context?.mediaId && item.context.periodId === context?.periodId) || null;
}

export function canUseUniverseActor(context, actorId, scenarioId) {
  const profile = getUniverseActor(actorId);
  if (!profile || !profile.playable) return { ok: false, reason: 'Cette fiche narrative ne possède aucun profil de combat autorisé.' };
  const access = canAccessContent(actorId, context);
  if (!access.ok) return access;
  if (scenarioId !== undefined) {
    const scene = getUniverseScenario(context, scenarioId);
    if (!scene || !scene.actorIds.includes(actorId)) return { ok: false, reason: 'Ce personnage ne participe pas à cet essai tactique.' };
  }
  return { ok: true };
}
export function getUniverseActorProfile(actorId, context) {
  const profile = getUniverseActor(actorId);
  return profile && canAccessContent(actorId, context).ok ? profile : null;
}

const copy = value => JSON.parse(JSON.stringify(value));
const OWN = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

/** Builds change the permitted skill subset, never the base ATB statistics. */
export function getUniverseBuild(actorId, rawContext, buildId = 'default', scenarioId) {
  const context = normalizeContext(rawContext), profile = context && getUniverseActorProfile(actorId, context);
  if (!profile?.playable || typeof buildId !== 'string') return null;
  if (scenarioId !== undefined && !canUseUniverseActor(context, actorId, scenarioId).ok) return null;
  const kit = getActorPowerKit(actorId, context, scenarioId);
  if (!kit) return null;
  const base = { id: 'default', name: 'Dotation du prototype', label: 'Dotation du prototype',
    description: 'Préparation conservée des anciennes chroniques, sans classe ni pouvoir supplémentaire attribué au protagoniste.',
    allowedWeapons: [...profile.allowedWeapons], powers: kit.powers, powerCatalogIds: kit.powerCatalogIds,
    powerProvenance: kit.powerProvenance, lockedPowers: kit.lockedPowers,
    missingPowers: unresolvedPowerNames(context.mediaId, profile.missingPowers, kit.powerCatalogIds),
    biotic: profile.biotic, tech: profile.tech, statsBasis: 'ATB adaptation' };
  if (buildId === 'default') return freeze(base);
  // The prologue trial preserves its original, unresolved character abilities.
  if (context.periodId !== context.mediaId.toLowerCase()) return null;
  if (['ME2-CHR-SHEPARD', 'ME3-CHR-SHEPARD'].includes(actorId)) {
    if (!OWN(SHEPARD_CLASS_PREPARATIONS, buildId)) return null;
    const definition = SHEPARD_CLASS_PREPARATIONS[buildId], powers = getPreparationPowers(context.mediaId, definition[context.mediaId], actorId);
    if (!powers.powerCatalogIds.every(id => canAccessContent(id, context).ok)) return null;
    return freeze({ ...base, ...powers, id: buildId, name: definition.name, label: definition.name,
      allowedWeapons: context.mediaId === 'ME2' ? [...definition.weapons] : [...WEAPONS],
      biotic: definition.biotic, tech: definition.tech,
      description: 'Sous-ensemble de classe en préparation d’essai, avec les capacités disponibles débloquées pour le test. Talents, rangs, passifs et acquisition d’origine non simulés ; statistiques ATB de base conservées.',
      attributionReference: context.mediaId === 'ME2' ? ME2_CLASS_PRIMARY_REFERENCE : {
        sourceIds: ['ME3-SRC-POWERS'], verification: 'Secondary reference; full class tree not certified 1:1' } });
  }
  if (actorId === 'MEA-CHR-RYDER') {
    if (!OWN(RYDER_SKILL_PREPARATIONS, buildId)) return null;
    const definition = RYDER_SKILL_PREPARATIONS[buildId], powers = getPreparationPowers('MEA', definition.suffixes, actorId);
    if (!powers.powerCatalogIds.every(id => canAccessContent(id, context).ok)) return null;
    return freeze({ ...base, ...powers, id: buildId, name: definition.name, label: definition.name,
      missingPowers: [...powers.missingPowers, ...definition.missing], biotic: definition.biotic, tech: definition.tech,
      description: 'Préparation libre de trois compétences au maximum parmi les familles de Ryder. Aucun bonus de profil passif, rang ou classe de Shepard attribué ; statistiques ATB de base conservées.' });
  }
  return null;
}
export function listUniverseBuilds(actorId, rawContext, scenarioId) {
  const base = getUniverseBuild(actorId, rawContext, 'default', scenarioId);
  if (!base) return [];
  const ids = ['ME2-CHR-SHEPARD', 'ME3-CHR-SHEPARD'].includes(actorId) ? Object.keys(SHEPARD_CLASS_PREPARATIONS)
    : actorId === 'MEA-CHR-RYDER' ? Object.keys(RYDER_SKILL_PREPARATIONS) : [];
  return [base, ...ids.map(id => getUniverseBuild(actorId, rawContext, id, scenarioId)).filter(Boolean)];
}

/** Native neutral definition; the composite also validates scenario and gear. */
export function universeActorFor(actorId, context, buildId = 'default', scenarioId) {
  if (!canUseUniverseActor(context, actorId, scenarioId).ok) return null;
  const profile = getUniverseActor(actorId), build = getUniverseBuild(actorId, context, buildId, scenarioId);
  if (!build) return null;
  const stats = TUNING[profile.tuning], weaponType = build.allowedWeapons[0] || 'pistol';
  const clips = ['ME2', 'ME3', 'MEA'].includes(profile.mediaId);
  return { id: profile.id, catalogId: profile.id, name: profile.name, mediaId: profile.mediaId, buildId: build.id,
    ...stats, maxHp: stats.hp, maxShield: stats.shield, powers: [...build.powers], synthetic: !!profile.synthetic,
    allowedWeapons: [...build.allowedWeapons], biotic: build.biotic, tech: build.tech,
    powerCatalogIds: [...build.powerCatalogIds], powerProvenance: copy(build.powerProvenance), lockedPowers: copy(build.lockedPowers),
    weaponType, weaponName: 'Dotation abstraite — prototype ATB', weaponSystem: clips ? 'thermal-clip' : 'heat',
    ...(clips ? { magazineCapacity: 8, ammo: 8, reserveAmmo: 32 } : {}),
    visualMode: 'prototype-symbol', portrait: null, sprite: null, prototype: true,
    statsBasis: 'ATB adaptation', missingPowers: [...build.missingPowers],
  };
}
export const actorForUniverse = (context, actorId, buildId = 'default', scenarioId) => universeActorFor(actorId, context, buildId, scenarioId);
export const getChronicleActor = universeActorFor;
export function getChronicleRoster(context, scenarioId) {
  const scene = getUniverseScenario(context, scenarioId);
  return scene ? scene.actorIds.filter(id => canUseUniverseActor(context, id, scenarioId).ok).map(id => getUniverseActor(id)) : [];
}

/** Only bindings exposed by an actual scenario/build count as implemented use. */
export function getUniversePowerUsage() {
  const usage = new Map();
  for (const scenario of CHRONICLE_SCENARIOS) for (const actorId of scenario.actorIds) {
    for (const build of listUniverseBuilds(actorId, scenario.context, scenario.id)) {
      for (const provenance of build.powerProvenance) {
        const row = usage.get(provenance.catalogId) || { catalogId: provenance.catalogId, actionId: provenance.actionId,
          mediaId: provenance.mediaId, actorIds: new Set(), scenarioIds: new Set(), buildIds: new Set() };
        row.actorIds.add(actorId); row.scenarioIds.add(scenario.id); row.buildIds.add(build.id); usage.set(row.catalogId, row);
      }
    }
  }
  return [...usage.values()].map(row => ({ ...row, actorIds: [...row.actorIds], scenarioIds: [...row.scenarioIds], buildIds: [...row.buildIds] }));
}
export const getUsedUniversePowerCatalogIds = () => getUniversePowerUsage().map(power => power.catalogId);
