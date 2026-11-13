// Third documentary selection: the forty remaining contextual enemy records.
// The two Evolution records without an unambiguous segment remain excluded.
// No mission, original kit, conditional allegiance or boss phase is inferred.
import { getUniverseRecord, getUniverseWork } from './universe-data.js';
import { canAccessContent, normalizeContext } from './continuity.js';

const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};

const DLC = 'legendary';
const citadelBlock = 'Le contexte ne prépare pas le DLC Citadel ni ses conditions de rencontre ; consultation uniquement.';
const collectorBlock = 'La fiche exige Retaliation ou une simulation Armax prévue, mais son segment publié est me3 : aucun banc de campagne, de multijoueur ou Legendary de remplacement.';
const wildlifeBlock = 'La notice ne confirme pas une variante individuellement hostile dans un lieu précis ; la présence de faune ne crée aucun ennemi automatique.';
const turretLimits = [
  'Défense fixe : aucun déplacement, déploiement, construction, changement de faction ou contrôle de tourelle n’est simulé.',
  'La vitesse règle seulement la cadence de la jauge ATB ; le tir abstrait ne reproduit pas l’arme, la portée ni le ciblage de cette défense.',
];
const dlcNote = 'État d’étude préparé avec le DLC inclus dans Legendary Edition ; aucune acquisition de contenu ni autorisation de rencontre n’est accordée à la campagne.';

// Numbers are bounded exercise budgets, never statistics from the source game.
const definitions = [
  ['ME2-ENM-HUMAN-REAPER', 'confrontation finale de ME2', null,
    ['Échelle, points faibles, phases et environnement du boss final non reconstitués.'],
    { blocked: 'Le Moissonneur humain ne peut pas être remplacé par un duel d’infanterie : la confrontation finale reste à implémenter.' }],
  ['ME2-ENM-BROKER-AGENT', 'agent du réseau du Courtier', [155, 20, 14, 3, 1],
    ['Armement, protection et comportement du modèle original non reconstitués.'],
    { edition: DLC, note: dlcNote }],
  ['ME2-ENM-BROKER-VANGUARD', 'biotique du réseau du Courtier', [180, 25, 16, 4, .95],
    ['Le rôle biotique ne donne aucun pouvoir nommé, charge ou attaque originale au profil.'],
    { edition: DLC, note: dlcNote }],
  ['ME2-ENM-OVERLORD', 'dispositif de transfert Overlord', null,
    ['Le dispositif, ses connexions, objectifs et séquences de transfert restent non reproduits.',
      'David n’est pas transformé en adversaire personnel ou en unité recrutée.'],
    { blocked: 'Le dispositif VI et son transfert exigent une rencontre dédiée ; aucune barre de vie de substitution.' }],
  ['ME2-ENM-PROJECT-GUARD', 'garde hostile d’Arrival', [155, 20, 14, 3, 1],
    ['Armement, infiltration, vagues et issue d’Arrival non reconstitués.'],
    { edition: DLC, note: dlcNote }],
  ['ME2-ENM-PROJECT-PYRO', 'unité incendiaire d’Arrival', [170, 15, 15, 4, .9],
    ['Le tir abstrait ne produit ni lance-flammes, jet incendiaire, brûlure ni explosion de réservoir.'],
    { edition: DLC, note: dlcNote }],
  ['ME2-ENM-PRISON-GUARD', 'garde batarien d’Arrival', [150, 15, 14, 3, 1],
    ['L’occurrence reste celle d’Arrival ; aucune identité ou arme d’un garde de Purgatory n’est importée.'],
    { edition: DLC, note: dlcNote }],

  ['ME3-ENM-TURRET', 'défense fixe de Cerberus', [180, 15, 15, 4, .7],
    turretLimits, { synthetic: true }],
  ['ME3-ENM-EVA', 'confrontation de Mars', null,
    ['La poursuite et les contraintes de la confrontation de Mars ne sont pas reproduites.',
      'L’identité de la confrontation n’autorise pas le transfert du corps ou du kit d’EDI.'],
    { blocked: 'Mars uniquement : poursuite et confrontation spécifique non implémentées ; aucun duel générique de remplacement.' }],
  ['ME3-ENM-GETH-TURRET', 'défense fixe geth', [190, 20, 15, 4, .7],
    [...turretLimits, 'Cette défense reste un adversaire de test ; elle n’est pas le pouvoir de soutien Tourelle geth de Legion.'],
    { synthetic: true }],
  ['ME3-ENM-CAT6-MERC', 'mercenaire CAT6 de Citadel', null,
    ['DLC Citadel et simulation Armax restent des occurrences conditionnelles, sans préparation certifiée ici.'],
    { blocked: citadelBlock }],
  ['ME3-ENM-CAT6-SPECIALIST', 'technicien CAT6 de Citadel', null,
    ['Le rôle technique ne fournit aucun pouvoir, dispositif ou déploiement de soutien.'],
    { blocked: citadelBlock }],
  ['ME3-ENM-DISRUPTION', 'drone CAT6 de Citadel', null,
    ['Vol, perturbation et interactions avec les protections restent non reconstitués.'],
    { blocked: citadelBlock }],
  ['ME3-ENM-BROOKS', 'antagoniste de Citadel', null,
    ['Rencontre, camouflage, interventions et dénouement de Citadel non reproduits.'],
    { blocked: citadelBlock }],
  ['ME3-ENM-COLLECTOR-TROOPER', 'Récolteur sous condition Retaliation / Armax', null,
    ['Les conditions de la source ne constituent pas une présence de Récolteurs dans la campagne ME3.'],
    { blocked: collectorBlock }],
  ['ME3-ENM-COLLECTOR-CAPTAIN', 'Récolteur sous condition Retaliation / simulation', null,
    ['Aucun kit de Captain, possession, arme ou comportement ME2 n’est transféré.'],
    { blocked: collectorBlock }],
  ['ME3-ENM-ABOMINATION', 'Récolteur explosif sous condition Retaliation / simulation', null,
    ['Explosion, possession et rayon d’effet ne sont pas reconstitués.'],
    { blocked: collectorBlock }],
  ['ME3-ENM-SCION', 'Récolteur lourd sous condition Retaliation / simulation', null,
    ['Aucune attaque ni statistique du Scion ME2 n’est transférée à cette occurrence ME3.'],
    { blocked: collectorBlock }],
  ['ME3-ENM-PRAETORIAN', 'Récolteur volant sous condition Retaliation / simulation', null,
    ['Vol, barrières, prises et phases de cette occurrence ME3 restent non reproduits.'],
    { blocked: collectorBlock }],

  ['MEA-ENM-KETT-TURRET', 'défense fixe kett', [180, 15, 15, 4, .7], turretLimits,
    { synthetic: true }],
  ['MEA-ENM-OUTLAW-TURRET', 'défense fixe des hors-la-loi', [175, 10, 15, 4, .75],
    [...turretLimits, 'Le banc utilise uniquement le segment solo publié ; aucune variante multijoueur n’est attribuée.'],
    { synthetic: true }],
  ['MEA-ENM-ADHI-TRAINED', 'animal dressé par des groupes ennemis', [125, 0, 13, 2, 1.15],
    ['Le dressage documenté reste distinct de la faune sauvage ; aucun changement de faction ou domptage jouable.',
      'Contact abstrait seulement : morsure, bond, déplacements et comportement de meute non reconstitués.'],
    { primaryAction: 'strike' }],
  ['MEA-ENM-OBSERVER', 'machine reliquate à allégeance conditionnelle', null,
    ['L’Observer peut être hostile ou allié selon une console ou une mission ; aucun état n’est choisi implicitement.',
      'Le soutien de Peebee ne transforme pas cette fiche en ennemi permanent ni en compagnon universel.'],
    { blocked: 'L’état de console ou de mission qui détermine l’allégeance manque ; aucun combat automatique contre l’Observer.' }],
  ['MEA-ENM-REM-TURRET', 'défense fixe reliquate', [195, 20, 15, 5, .65], turretLimits,
    { synthetic: true }],
  ['MEA-ENM-CALOT', 'chef du vaisseau de la mission de Liam', null,
    ['Le rôle de chef de vaisseau ne précise ici ni participation personnelle combattante ni armement.'],
    { blocked: 'Liam: All In : rencontre et actions personnelles de Calot non établies par la notice ; consultation uniquement.' }],
  ['MEA-ENM-MERIWEATHER', 'antagoniste de la mission de Vetra', null,
    ['Le rôle d’antagoniste ne suffit pas à attribuer une arme, un pouvoir ou un duel personnel.'],
    { blocked: 'Vetra: Means and Ends : rencontre et actions personnelles non établies par la notice ; consultation uniquement.' }],
  ['MEA-ENM-ADHI-WILD', 'faune sauvage de Heleus', null,
    ['L’Adhi sauvage reste distinct de l’Adhi dressé ; aucune faction kett n’est attribuée par défaut.'],
    { blocked: wildlifeBlock }],
  ['MEA-ENM-ANCIENT-EIROCH', 'créature massive de Heleus', null,
    ['La taille et le nom ne précisent ni lieu, variante hostile ni attaque de cette rencontre.'],
    { blocked: wildlifeBlock }],
  ['MEA-ENM-KAERKYN', 'faune de Heleus à hostilité locale', null,
    ['Les paramètres d’hostilité restent à vérifier par lieu avant un combat automatique.'],
    { blocked: wildlifeBlock }],
  ['MEA-ENM-SPITBUG', 'faune projetant une substance', null,
    ['La projection attestée n’est pas transformée en tir d’arme ; substance, trajectoire et hostilité restent non définies.'],
    { blocked: wildlifeBlock }],
  ['MEA-ENM-TAURG', 'faune à variante conditionnelle', null,
    ['La variante documentée détermine l’hostilité ; aucune variante agressive n’est choisie par défaut.'],
    { blocked: wildlifeBlock }],
  ['MEA-ENM-CHALLYRION', 'faune de Havarl', null,
    ['Le Challyrion de base n’est pas remplacé par la variante mutée Overgrown ; aucune mutation ni agression automatique.'],
    { blocked: wildlifeBlock }],

  ['INF-ENM-MECH', 'machine hostile du Barn', [205, 25, 16, 5, .8],
    ['Le type générique ne reçoit aucun modèle, système d’arme ou comportement des mécas de ME2 ou ME3.'],
    { synthetic: true }],
  ['INF-ENM-SUBJECT', 'victime expérimentale hostile', [145, 5, 13, 3, 1],
    ['Contact ATB seulement : aucune mutation, arme ou capacité expérimentale nommée n’est attribuée.',
      'La notice décrit une victime hostile ; aucune catégorie de victimes innocentes n’est ajoutée au bestiaire.'],
    { primaryAction: 'strike' }],
  ['INF-ENM-OGRE', 'méca du contenu bonus d’Infiltrator', null,
    ['Le rôle du contenu bonus ne donne aucun déploiement dans la fuite principale de Randall.'],
    { blocked: 'Le segment du contenu bonus n’est pas représenté par ce banc ; aucune activation dans la fuite principale.' }],
  ['INF-ENM-ORCUS', 'méca du contenu bonus d’Infiltrator', null,
    ['La notice du bonus ne précise ici ni kit complet ni condition de rencontre.'],
    { blocked: 'Le segment du contenu bonus n’est pas représenté par ce banc ; aucune activation dans la fuite principale.' }],

  ['GAL-ENM-JATH', 'ambassadeur au centre du final de Galaxy', null,
    ['La fonction diplomatique et le rôle dans le final ne prouvent aucune attaque ou participation combattante personnelle.'],
    { blocked: 'Le rôle d’ambassadeur ne définit pas un combattant ; le final de Galaxy ne devient pas un duel contre Jath’Amon.' }],
  ['GAL-ENM-TURIAN', 'type d’adversaire du bestiaire Galaxy', [150, 10, 14, 3, 1],
    ['Type documentaire seulement : aucune identité nommée, arme, faculté ou résistance raciale n’est déduite de l’espèce.']],
  ['INV-EN-CERBERUS', 'forces de Cerberus dans Invasion', null,
    ['La fiche atteste un collectif militaire, sans type d’unité individuelle ni kit original identifié.',
      'Le raccord d’occupation d’Omega et le départ d’Aria restent ceux du comic.'],
    { blocked: 'Des forces collectives ne deviennent pas un soldat inventé : type d’unité individuelle à documenter avant un exercice.' }],
  ['INC-EN-COLLECTOR', 'unité Collector du raid d’Incursion', [160, 20, 15, 4, .9],
    ['Type de menace attesté par la notice éditeur ; aucun modèle nommé, kit ME2, pouvoir ou arme précise n’est importé.',
      'Le sort des captifs et le résultat du raid restent fixés par l’œuvre ; aucune colonie n’est libérée par le banc.']],
];

function compile([recordId, role, stats, limitations, options = {}]) {
  const record = getUniverseRecord(recordId), work = record && getUniverseWork(record.mediaId);
  const contexts = record?.availability.flatMap(scope => scope.periodIds
    .map(periodId => normalizeContext({ mediaId: scope.mediaId, periodId }))).filter(Boolean) ?? [];
  const valid = record?.fact === true && record.category === 'enemies' && record.sourceIds.length > 0
    && record.sourceIds.every(id => work?.sources.some(source => source.id === id))
    && contexts.some(context => canAccessContent(recordId, context).ok);
  const blockedReason = !valid ? 'Identité, source ou segment documentaire non validé dans le registre publié.' : options.blocked ?? null;
  const [hp, shield, attack, defense, speed] = stats ?? [];
  return {
    recordId, mode: 'enemy', role,
    simulation: stats && !blockedReason ? {
      hp, shield, attack, defense, speed, synthetic: options.synthetic === true,
      primaryAction: options.primaryAction ?? 'shoot', powers: [], boss: false,
    } : null,
    notes: [record?.description ?? 'Identité documentaire indisponible.',
      `Identité : ${recordId}. Sources existantes du registre : ${record?.sourceIds.join(', ') ?? 'indisponibles'}.`,
      ...(record?.conditions ? [`Conditions documentaires conservées : ${record.conditions}`] : []),
      ...(options.note ? [options.note] : []),
      'Sources brèves du catalogue existant ; aucun nouveau contrôle primaire du kit, des statistiques ou du modèle visuel.',
      'Échantillon indépendant contre une équipe de test abstraite ; aucune mission ou rencontre canonique n’est rejouée.',
      ...(stats && !blockedReason ? [
        'PV, bouclier, attaque, défense, cadence et classification de ciblage sont des réglages ATB adaptés ; aucune statistique ou résistance d’origine certifiée.',
        'Tir ou contact générique seulement : aucun pouvoir nommé ni armement original attribué.',
      ] : ['Consultation documentaire seulement : aucune statistique de combat, action ou récompense n’est proposée.']),
    ],
    limitations: [...limitations,
      'Modèle visuel, animations, son et kit original non reconstitués.',
      'Aucun recrutement, droit d’équipement, récompense ou résultat de campagne n’est accordé.'],
    blockedReason, constraints: { editionProfile: options.edition ?? null },
  };
}

/** Forty disjoint dossiers; twenty-five conditional/unspecified encounters stay closed. */
export const EXPANSION3_ENEMIES = freeze(definitions.map(compile));
