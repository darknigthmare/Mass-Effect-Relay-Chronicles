// Second independent sample set: new published identities, not new missions.
// Documentary occurrence stays in universe-data; no source kit is inferred.
import { getUniverseRecord, getUniverseWork } from './universe-data.js';
import { canAccessContent, normalizeContext } from './continuity.js';

const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};

// Every numeric value is an ATB exercise budget, not a source-game statistic.
const definitions = [
  ['ME2-ENM-BS-CENTURION', 'mercenaire Blue Suns', [165, 20, 15, 4, 1],
    ['Armement, protections et tactiques propres au Centurion non reconstitués.']],
  ['ME2-ENM-BS-LEGION', 'mercenaire Blue Suns', [190, 25, 16, 5, .9],
    ['Le Legionnaire reste distinct de Legion ; aucun kit ou trait d’équipier geth n’est importé.']],
  ['ME2-ENM-EC-TROOPER', 'infanterie Eclipse', [135, 15, 13, 3, 1],
    ['Arme, équipement et tactiques de ce mercenaire non reconstitués.']],
  ['ME2-ENM-EC-HEAVY', 'mercenaire lourd Eclipse', [190, 20, 17, 5, .8],
    ['Arme lourde, projectile et comportement du modèle original non reconstitués.']],
  ['ME2-ENM-BP-TROOPER', 'infanterie Blood Pack', [150, 10, 14, 3, 1],
    ['Espèce, arme et capacités individuelles ne sont pas déduites du seul nom de faction.']],
  ['ME2-ENM-BP-BOOM', 'unité Blood Pack', [130, 0, 15, 2, 1.1],
    ['Le nom Boom-Squad ne suffit pas à attribuer une explosion, un explosif ou un comportement de sacrifice.']],
  ['ME2-ENM-GETH-TROOPER', 'infanterie geth', [145, 20, 14, 3, 1],
    ['Armement et comportement d’infanterie geth propres à ME2 non reconstitués.'], { synthetic: true }],
  ['ME2-ENM-GETH-DESTROYER', 'plateforme geth de Haestrom', [245, 35, 19, 6, .75],
    ['La présence à Haestrom ne suffit pas à spécifier une arme, une portée ou un kit d’attaques.'], { synthetic: true }],
  ['ME2-ENM-GETH-DRONE', 'drone geth', [105, 15, 12, 2, 1.2],
    ['Vol, mouvements et armement du drone ne sont pas simulés.'], { synthetic: true }],
  ['ME2-ENM-HUSK', 'créature des rencontres Collecteurs', [110, 0, 12, 2, 1.15],
    ['Le contact générique ne reproduit pas la course, les prises ou les réactions du Husk original.'], { primaryAction: 'strike' }],
  ['ME2-ENM-COLLECTOR-ASSASSIN', 'tireur des Collecteurs', [145, 15, 18, 3, 1],
    ['Visée, distance et arme du tireur non reconstituées.']],
  ['ME2-ENM-OCULUS', 'drone des abords de la base', [280, 35, 20, 6, .7],
    ['Mouvements, échelle et rencontre des abords de la base Collecteur non reproduits.',
      'La fiche n’établit pas ici ses interactions avec les pouvoirs ciblant les synthétiques.']],
  ['ME2-ENM-VARRREN', 'faune hostile', [130, 0, 14, 2, 1.2],
    ['Le contact ATB ne reproduit ni déplacements ni attaques propres au varren ; aucune variante de faune n’est ajoutée.'],
    { primaryAction: 'strike' }],
  ['ME2-ENM-THRESHER', 'faune du rite de Grunt', [470, 0, 23, 9, .55],
    ['Échelle, terrain et séquence du rite ne sont pas rejoués.',
      'Le contact abstrait ne spécifie ni attaque originale ni phase du Dévoreur.'], { primaryAction: 'strike' }],

  ['ME3-ENM-GETH-TROOPER', 'infanterie geth', [150, 25, 14, 3, 1],
    ['Profil propre à l’occurrence ME3 ; aucune statistique ni arme du Trooper ME2 n’est transférée.'], { synthetic: true }],
  ['ME3-ENM-GETH-ROCKET', 'infanterie geth à roquettes', [165, 25, 17, 4, .9],
    ['Le tir générique ne reproduit ni trajectoire de roquette ni explosion de zone.'], { synthetic: true }],
  ['ME3-ENM-GETH-HUNTER', 'geth camouflé', [180, 30, 17, 4, 1.15],
    ['Camouflage, déplacement et tactiques propres au Hunter non simulés.'], { synthetic: true }],
  ['ME3-ENM-GETH-PYRO', 'geth incendiaire', [190, 25, 17, 5, .85],
    ['Le tir générique ne produit ni jet incendiaire ni brûlure ; arme et portée originales non reconstituées.'], { synthetic: true }],
  ['ME3-ENM-GETH-PRIME', 'plateforme geth lourde', [330, 50, 21, 8, .65],
    ['Armement, actions de soutien et capacités propres au Prime ME3 non reconstitués.'], { synthetic: true }],
  ['ME3-ENM-CAT6-HEAVY', 'unité CAT6 protégée', null,
    ['Protections et kit CAT6 non reconstitués ; cette occurrence reste liée à Citadel.'],
    { blocked: 'Accès au DLC Citadel non attesté par ce contexte de simulation ; aucune ouverture par le seul nom CAT6.' }],
  ['ME3-ENM-CLONE', 'antagoniste de Citadel', null,
    ['Le combat dépend de la classe du joueur ; aucune classe, arme ou capacité de Shepard n’est attribuée au clone.',
      'Rencontre, phases et issue du DLC non reproduites.'],
    { blocked: 'DLC Citadel et classe du joueur non représentés par ce banc ; le clone reste consultable sans profil de combat.' }],
  ['ME3-ENM-DRAGOON', 'Cerberus du multijoueur Retaliation', null,
    ['Occurrence exclusivement conservée dans le segment me3-multiplayer du registre.',
      'Ni campagne solo, ni édition Legendary, ni autre unité de Cerberus ne fournissent une autorisation de remplacement.'],
    { blocked: 'Accès au multijoueur Retaliation non représenté dans cet essai ; aucune activation solo ou Legendary.' }],
  ['ME3-ENM-REAPER-RANNOCH', 'confrontation spéciale de Rannoch', null,
    ['La conclusion de Rannoch ne peut pas être remplacée par une barre de vie d’infanterie.',
      'Ciblage, étapes, soutien et conséquences de la rencontre restent non reproduits.'],
    { blocked: 'Mécanique de la confrontation de Rannoch non reconstituée ; aucun boss à PV de substitution.' }],

  ['MEA-ENM-AGENT', 'soutien hors-la-loi', [150, 20, 13, 3, 1],
    ['Le rôle de soutien ne suffit pas à attribuer un pouvoir, un dispositif ou un kit technique.']],
  ['MEA-ENM-ANARCHIST', 'unité explosive hors-la-loi', [155, 10, 16, 3, 1],
    ['L’identité explosive est documentée ; le tir générique ne reproduit aucun explosif ni effet de zone.']],
  ['MEA-ENM-HYDRA', 'méca des hors-la-loi', [350, 45, 21, 8, .6],
    ['Armement, protections, autonomie et pilotage du méca non spécifiés par ce profil.',
      'Le modèle de ciblage ATB ne certifie aucune vulnérabilité originale au piratage.']],
  ['MEA-ENM-PARIAH', 'biotique hors-la-loi', [185, 25, 16, 4, 1],
    ['Le rôle biotique n’autorise aucun pouvoir nommé sans attribution de kit vérifiée.']],
  ['MEA-ENM-SABOTEUR', 'unité technique hors-la-loi', [155, 20, 14, 3, 1.05],
    ['Aucun pouvoir Sabotage ni autre capacité technique n’est déduit de son nom.']],
  ['MEA-ENM-SHARPSHOOTER', 'tireur de précision hors-la-loi', [140, 15, 18, 3, 1],
    ['Visée, distance et arme de précision originales non reconstituées.']],
  ['MEA-ENM-ASSEMBLER', 'machine reliquate', [180, 20, 14, 4, .9],
    ['Actions et éventuels renforts propres à l’Assembler non reconstitués ; aucune unité supplémentaire n’apparaît.'],
    { synthetic: true }],
  ['MEA-ENM-BREACHER', 'unité reliquate', [145, 15, 15, 3, 1],
    ['La fiche n’établit pas ici un kit d’arme, de charge ou d’explosion ; aucun n’est ajouté.'], { synthetic: true }],
  ['MEA-ENM-CREEPER', 'unité reliquate de proximité', [120, 10, 13, 3, 1.15],
    ['Le contact ATB est une primitive de test ; déplacements et attaques propres à cette machine non reproduits.'],
    { synthetic: true, primaryAction: 'strike', note: 'Le Creeper reste synthétique : le libellé historique « Assaut organique » de la primitive de contact ne décrit pas sa biologie.' }],
  ['MEA-ENM-PROGENITOR', 'boss reliquat nommé', [480, 65, 23, 9, .55],
    ['The Remnant Tiller, ses objectifs et son déroulement ne sont pas rejoués.',
      'Aucune phase, sous-cible ou capacité originale du boss n’est attribuée.'], { synthetic: true, boss: true }],
  ['MEA-ENM-ARCHON-FINAL', 'Archonte et réseau de Méridiane', null,
    ['La fiche décrit une confrontation finale et un réseau ; l’Archonte n’est pas changé en boss d’infanterie.',
      'Séquence de Méridiane, réseau, alliés, objectifs et issue finale non reproduits.'],
    { blocked: 'Réseau de Méridiane et confrontation finale non reconstitués ; aucun boss à PV de substitution.' }],
  ['MEA-ENM-SCIENTIST', 'identité kett à préciser', null,
    ['La condition du registre exige de confirmer l’identité de rencontre avant tout combat automatique.',
      'L’appartenance kett n’atteste ni hostilité individuelle, ni arme, ni capacité.'],
    { blocked: 'Identité de rencontre du scientifique kett non confirmée ; aucun combat automatique autorisé.' }],

  ['INF-ENM-TROOPER', 'soldat de Cerberus pendant la fuite', [150, 15, 14, 3, 1],
    ['Occurrence d’Infiltrator uniquement ; aucun équipement ou kit d’un soldat de ME2 ou ME3 n’est transféré.']],
  ['INF-ENM-X1', 'krogan mutant du Colosseum', [340, 15, 21, 7, .7],
    ['Le contact abstrait ne reconstitue ni mutation, ni capacités, ni rencontre du Colosseum.'], { primaryAction: 'strike' }],
  ['INF-ENM-INALI', 'Inali augmentée de l’affrontement final', [390, 45, 22, 8, .8],
    ['L’occurrence augmentée reste distincte de l’interlocutrice Inali ; aucun droit de recrutement n’est accordé.',
      'Augmentations, armes, phases et issue finale d’Infiltrator non reconstituées.'], { boss: true }],
  ['GAL-ENM-CLINT', 'chef pirate de l’enquête', [245, 20, 18, 5, .9],
    ['Kit, rencontre et issue de l’enquête Galaxy non reconstitués ; aucun inventaire de Jacob n’est importé.']],
  ['GAL-ENM-ROBOT', 'robot du bestiaire Galaxy', [180, 25, 15, 4, .9],
    ['Type documentaire de Galaxy, sans modèle nommé, arme ou capacités d’un méca d’un autre jeu.'], { synthetic: true }],
];

function compile([recordId, role, stats, limitations, options = {}]) {
  const record = getUniverseRecord(recordId), work = record && getUniverseWork(record.mediaId);
  const contexts = record?.availability.flatMap(scope => scope.periodIds.map(periodId => normalizeContext({ mediaId: scope.mediaId, periodId }))).filter(Boolean) ?? [];
  const valid = record?.fact === true && record.category === 'enemies' && record.sourceIds.length > 0
    && record.sourceIds.every(id => work?.sources.some(source => source.id === id))
    && contexts.some(context => canAccessContent(recordId, context).ok);
  const [hp, shield, attack, defense, speed] = stats ?? [];
  const blockedReason = !valid ? 'Identité, source ou segment documentaire non validé dans le registre publié.' : options.blocked ?? null;
  return {
    recordId, mode: 'enemy', role,
    simulation: stats && !blockedReason ? {
      hp, shield, attack, defense, speed, synthetic: options.synthetic === true,
      primaryAction: options.primaryAction ?? 'shoot', powers: [], boss: options.boss === true,
    } : null,
    notes: [
      record?.description ?? 'Identité documentaire non disponible.',
      `Identité : ${recordId}. Sources existantes du registre : ${record?.sourceIds.join(', ') ?? 'indisponibles'}.`,
      ...(record?.conditions ? [`Conditions documentaires conservées : ${record.conditions}`] : []),
      ...(options.note ? [options.note] : []),
      'Échantillon indépendant contre une équipe de test abstraite ; aucune mission ou rencontre canonique n’est rejouée.',
      ...(stats && !blockedReason ? ['PV, bouclier, attaque, défense, cadence et classification de ciblage sont des réglages ATB adaptés ; aucune statistique ou résistance d’origine certifiée.',
        'Tir ou contact générique seulement : aucun pouvoir nommé ni armement original attribué.']
        : ['Consultation documentaire seulement : aucune statistique de combat, action ou récompense n’est proposée.']),
    ],
    limitations: [...limitations,
      'Modèle visuel, animations, son et kit original non reconstitués.',
      'Aucun recrutement, droit d’équipement, récompense ou résultat de campagne n’est accordé.'],
    blockedReason, constraints: { editionProfile: null },
  };
}

/** Forty new identities; the six restricted/unspecified encounters stay closed. */
export const EXPANSION2_ENEMIES = freeze(definitions.map(compile));
