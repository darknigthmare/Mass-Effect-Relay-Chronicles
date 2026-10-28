// Independent ATB samples, never source-mission encounters or original stats.
// Identity and occurrence remain attached to the published documentary record.
import { getUniverseRecord, getUniverseWork } from './universe-data.js';
import { canAccessContent, normalizeContext } from './continuity.js';

const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

// hp, shield, attack, defense and speed below are all adaptation parameters.
// A contact attack is a generic existing ATB action, not a reconstructed kit.
const definitions = [
  ['ME2-ENM-BS-TROOPER', 'mercenary-infantry', [135, 10, 13, 3, 1],
    ['Armement et tactiques propres au Blue Suns Trooper non reconstitués.']],
  ['ME2-ENM-BS-HEAVY', 'mercenary-heavy', [185, 20, 16, 5, .8],
    ['Arme lourde, projectiles et protections du modèle original non reconstitués.']],
  ['ME2-ENM-EC-ENGINEER', 'mercenary-engineer', [135, 20, 12, 3, 1],
    ['Actions de soutien et éventuels dispositifs de l’ingénieur non attribués sans kit vérifié.']],
  ['ME2-ENM-EC-VANGUARD', 'biotic-mercenary', [160, 25, 15, 4, 1],
    ['Le rôle biotique ne suffit pas à attribuer une liste de pouvoirs ; aucun pouvoir nommé n’est activé.']],
  ['ME2-ENM-EC-COMMANDO', 'mercenary-commando', [175, 25, 16, 4, .95],
    ['Armes et capacités propres à la combattante Eclipse non reconstituées.']],
  ['ME2-ENM-BP-WARRIOR', 'krogan-mercenary', [230, 0, 18, 6, .8],
    ['Kit krogan, réactions et protections du Warrior non reconstitués.']],
  ['ME2-ENM-BP-PYRO', 'incendiary-mercenary', [165, 10, 15, 4, .9],
    ['L’armement incendiaire est seulement documenté ; le tir ATB générique ne produit ni jet de flamme ni brûlure.']],
  ['ME2-ENM-GETH-ROCKET', 'synthetic-rocket-infantry', [150, 20, 16, 3, .9],
    ['Le tir générique ne reproduit ni trajectoire de roquette ni explosion de zone.'], { synthetic: true }],
  ['ME2-ENM-GETH-HUNTER', 'cloaked-synthetic', [165, 25, 16, 4, 1.15],
    ['Camouflage et comportement du Hunter non simulés.'], { synthetic: true }],
  ['ME2-ENM-GETH-PRIME', 'heavy-synthetic', [290, 45, 20, 7, .65],
    ['Armement et soutien propres à la plateforme lourde non reconstitués.'], { synthetic: true }],
  ['ME2-ENM-GETH-COLOSSUS', 'synthetic-boss', [460, 65, 23, 9, .55],
    ['La rencontre de Haestrom, son terrain, ses objectifs et ses phases ne sont pas rejoués.'], { synthetic: true, boss: true }],
  ['ME2-ENM-ABOMINATION', 'collector-creature', [115, 0, 13, 2, 1.15],
    ['Capacités propres à l’Abomination non spécifiées ici ; aucun effet secondaire ou de mort n’est appliqué.'], { primaryAction: 'strike' }],
  ['ME2-ENM-SCION', 'heavy-collector-creature', [270, 15, 20, 6, .65],
    ['Attaques, portée et protections propres au Scion non reconstituées.']],
  ['ME2-ENM-COLLECTOR-GUARDIAN', 'collector-protector', [185, 30, 15, 4, .9],
    ['Le comportement protecteur de l’unité n’est pas reproduit ; le bouclier ATB n’en constitue pas une spécification.']],
  ['ME2-ENM-VASIR', 'asari-boss', [380, 55, 21, 7, 1.1],
    ['La confrontation contre Shepard et Liara, ses déplacements et son kit ne sont pas rejoués.'],
    { boss: true, dlc: 'Lair of the Shadow Broker' }],
  ['ME2-ENM-BROKER', 'yahg-boss', [450, 60, 23, 9, .65],
    ['Le combat du yahg, ses protections et ses phases ne sont pas reconstitués.'],
    { primaryAction: 'strike', boss: true, dlc: 'Lair of the Shadow Broker' }],

  ['ME3-ENM-CENTURION', 'cerberus-infantry', [160, 25, 15, 4, 1],
    ['Armement et tactiques du Centurion non reconstitués.']],
  ['ME3-ENM-ENGINEER', 'cerberus-engineer', [140, 20, 12, 3, 1],
    ['Le soutien de l’ingénieur et ses constructions ne sont pas simulés ; aucune tourelle n’est invoquée.']],
  ['ME3-ENM-GUARDIAN', 'shield-carrier', [190, 0, 15, 7, .75],
    ['Le bouclier porté, sa direction et ses ouvertures ne sont pas simulés par la défense numérique ATB.']],
  ['ME3-ENM-NEMESIS', 'cerberus-marksman', [135, 20, 18, 3, 1.05],
    ['Distance, visée et comportement de tireuse de précision non simulés.']],
  ['ME3-ENM-PHANTOM', 'cerberus-close-assault', [185, 30, 18, 4, 1.2],
    ['L’assaut rapproché est générique ; armes, défenses et enchaînements propres à la Phantom ne sont pas reproduits.'],
    { primaryAction: 'strike' }],
  ['ME3-ENM-ATLAS', 'piloted-mech', [380, 60, 22, 8, .55],
    ['Cockpit, pilotage, sous-cibles et armement du méca ne sont pas simulés ; aucune prise de contrôle n’est accordée.',
      'Le méca piloté n’est pas classé comme cible synthétique autonome par cette simulation.']],
  ['ME3-ENM-CANNIBAL', 'reaper-infantry', [155, 0, 14, 3, 1],
    ['Actions et réactions propres au Cannibal non reconstituées.']],
  ['ME3-ENM-RAVAGER', 'reaper-artillery', [255, 10, 20, 6, .65],
    ['Le rôle d’artillerie n’est représenté que par des réglages ATB ; trajectoires et portée ne sont pas simulées.',
      'Le lien avec les petites unités Swarmer n’entraîne aucune apparition automatique.']],
  ['ME3-ENM-SWARMER', 'small-reaper-creature', [80, 0, 11, 1, 1.3],
    ['Cette cible isolée ne reproduit ni groupe de Swarmers ni apparition associée à un Ravager.'],
    { primaryAction: 'strike' }],
  ['ME3-ENM-HARVESTER', 'flying-creature', [420, 35, 22, 8, .55],
    ['Vol, relief, mouvements et rencontres terrestres du Harvester non reproduits.']],
  ['ME3-ENM-RAMPART', 'omega-mech', [210, 30, 17, 5, .9],
    ['Le robot d’Omega conserve une identité distincte ; son armement et ses capacités ne sont pas reconstitués.'],
    { synthetic: true, dlc: 'Omega' }],
  ['ME3-ENM-ADJUTANT', 'omega-creature', [245, 15, 19, 6, 1.05],
    ['Déplacements et capacités propres à la créature d’Omega non reconstitués.'],
    { primaryAction: 'strike', dlc: 'Omega' }],

  ['MEA-ENM-ANOINTED', 'kett-infantry', [180, 20, 16, 4, .9],
    ['Armement et comportement propres à l’Anointed non reconstitués.']],
  ['MEA-ENM-DESTINED', 'kett-support', [165, 25, 14, 4, 1],
    ['Actions de soutien du Destined non attribuées faute de kit vérifié.']],
  ['MEA-ENM-WRAITH', 'cloaked-kett-creature', [150, 0, 15, 3, 1.2],
    ['Camouflage non simulé ; le contact ATB générique ne constitue pas le kit de la créature.'],
    { primaryAction: 'strike' }],
  ['MEA-ENM-FIEND', 'large-kett-creature', [295, 0, 21, 7, .7],
    ['La taille, les mouvements et les attaques propres à la grande créature ne sont pas simulés.'],
    { primaryAction: 'strike' }],
  ['MEA-ENM-INVICTOR', 'named-kett-boss', [380, 55, 22, 8, .7],
    ['Defeating the Kett, ses objectifs et les capacités du boss ne sont pas rejoués.'], { boss: true }],
  ['MEA-ENM-ARCHON-SWORD', 'named-kett-opponent', [300, 40, 20, 6, .85],
    ['L’adversaire nommé n’est pas l’Archonte ; sa rencontre de campagne et son kit restent non reconstitués.']],
  ['MEA-ENM-VALIANT', 'named-kett-opponent', [320, 45, 20, 7, .8],
    ['La rencontre liée à l’arche asari et ses conséquences ne sont pas rejouées ; aucun résultat de loyauté n’est accordé.']],
  ['MEA-ENM-BEHEMOTH', 'heavy-kett-creature', [330, 0, 22, 8, .65],
    ['Le contact ATB ne reproduit ni la morphologie ni les attaques propres au Behemoth.'],
    { primaryAction: 'strike' }],
  ['MEA-ENM-RAIDER', 'outlaw-infantry', [145, 15, 14, 3, 1],
    ['Armement et comportement propres au Raider non reconstitués.']],
  ['MEA-ENM-BERSERKER', 'heavy-outlaw', [265, 15, 20, 6, .8],
    ['Armement, capacités et réactions propres au Berserker non reconstitués.']],
  ['MEA-ENM-NULLIFIER', 'protected-remnant', [270, 45, 19, 7, .65],
    ['Les protections de la machine ne sont pas reproduites par le simple bouclier numérique ATB.'],
    { synthetic: true }],
  ['MEA-ENM-ARCHITECT', 'giant-remnant', [520, 65, 24, 10, .5],
    ['Les rencontres d’Eos, Voeld, Kadara et Elaaden restent distinctes et ne sont pas fusionnées en mission.',
      'Échelle, sous-cibles, phases et déplacement de la machine géante non reconstitués.'],
    { synthetic: true }],
];

function compile([recordId, role, stats, limitations, options = {}]) {
  const record = getUniverseRecord(recordId);
  const context = normalizeContext({ mediaId: record?.mediaId, periodId: record?.mediaId?.toLowerCase() });
  const work = record && getUniverseWork(record.mediaId);
  const sourceValid = record?.fact === true && record.category === 'enemies'
    && context && canAccessContent(recordId, context).ok && record.sourceIds.length > 0
    && record.sourceIds.every(id => work?.sources.some(source => source.id === id));
  const [hp, shield, attack, defense, speed] = stats;
  // No access flag for these DLCs exists in the independent sample context.
  // A broad campaign period must not silently stand in for DLC entitlement.
  const blockedReason = !sourceValid ? 'Identité, source ou occurrence documentaire non validée dans le registre publié.'
    : options.dlc ? `Accès au DLC ${options.dlc} non attesté par ce contexte de simulation ; profil consultable seulement.` : null;
  return {
    recordId, mode: 'enemy', role,
    simulation: {
      hp, shield, attack, defense, speed,
      synthetic: options.synthetic === true, primaryAction: options.primaryAction ?? 'shoot',
      boss: options.boss === true, powers: [],
    },
    notes: [
      record?.description ?? 'Identité documentaire non disponible.',
      `Fiche d’identité : ${recordId}. Sources du registre : ${record?.sourceIds.join(', ') ?? 'indisponibles'}.`,
      ...(record?.conditions ? [`Conditions documentaires conservées : ${record.conditions}`] : []),
      ...(options.dlc ? [`Occurrence limitée au DLC ${options.dlc} ; aucune autorisation de campagne générale n’en découle.`] : []),
      'Échantillon ATB indépendant contre une équipe de test abstraite ; aucune rencontre de mission n’est reproduite.',
      'PV, bouclier, dégâts, défense et cadence sont adaptés. Tir ou contact générique, sans puissance canonique certifiée.',
    ],
    limitations: [...limitations,
      'Aucun pouvoir nommé attribué ; le kit original, les animations et le modèle visuel ne sont pas reconstitués.',
      'Aucun recrutement, choix narratif, récompense ou résultat de campagne n’est accordé.'],
    constraints: { editionProfile: null }, blockedReason,
  };
}

/** Exactly forty new documentary identities; four DLC samples fail closed. */
export const EXPANSION_ENEMIES = freeze(definitions.map(compile));
