// Context-bound study dossiers, not forty distinct hulls or a flight model.
// These original unitless budgets belong only to the independent logistics test.
import { getUniverseRecord, getUniverseWork } from './universe-data.js';
import { canAccessContent } from './continuity.js';

const definitions = [
  ['REF-VEH-M35-MAKO-ME1', 'ground-vehicle',
    'Mako du contexte ME1 : la référence primaire atteste son nom et une vue extérieure.',
    'Le roulage, les suspensions, le canon et les protections du Mako ne sont pas reconstitués.'],
  ['REF-SHP-NORMANDY-SR1-ME1', 'spacecraft',
    'Normandy SR-1 dans ME1 : étude indépendante de la coque nommée dans le manuel Xbox 360.',
    'La vue extérieure ne certifie ni géométrie complète, ni intérieur ou performances.'],
  ['ME2-MQ-SAVE-JOKER', 'spacecraft',
    'Normandy du prologue de ME2 uniquement ; ce dossier ne désigne pas le SR-2 de la suite.',
    'Aucun sauvetage, perte d’équipage ou dénouement du prologue ne peut être réécrit.'],
  ['ME2-ZON-NORMANDY-CIC', 'spacecraft',
    'La fiche du CIC sert de repère documentaire au Normandy SR-2 de ME2, pas de deuxième vaisseau.',
    'Aucun pont, intérieur, blindage, bouclier ou armement amélioré n’est livré par ce dossier.'],
  ['ME2-ZON-PURGATORY', 'spacecraft',
    'Le Purgatory de ME2 est identifié comme vaisseau-prison par cette fiche de lieu.',
    'Les blocs, l’évasion de Jack et les rencontres à bord ne sont pas rejoués.'],
  ['ME2-ZON-COLLECTOR-SHIP', 'spacecraft',
    'Vaisseau des Collecteurs du contexte ME2 ; aucune coque individuelle supplémentaire n’est nommée.',
    'L’embuscade, les déplacements à bord et la mission de campagne restent hors simulation.'],
  ['ME2-ZON-ALAREI', 'spacecraft',
    'Alarei du procès de Tali dans ME2, limité à son dossier documentaire.',
    'Aucune inspection intérieure, preuve du procès ou issue concernant Tali n’est accordée.'],
  ['ME2-ZON-HAGALAZ-HULL', 'unresolved-reference',
    'La fiche atteste une surface extérieure de vaisseau sur Hagalaz ; elle ne fournit pas un profil de coque.',
    'Aucun nom, modèle, équipage ou système de navigation supplémentaire n’est déduit.',
    'La fiche décrit un lieu sur une coque ; son identité technique reste insuffisante pour une épreuve logistique.'],
  ['ME2-ENM-GUNSHIP', 'aircraft',
    'Référence à des aéronefs de combat ME2, sans modèle individuel identifié dans cette fiche.',
    'Aucun armement de boss, pilote ou capacité de vol n’est accordé.',
    'La référence désigne un type d’aéronef, sans modèle individuel suffisamment établi pour la simulation.'],
  ['ME2-EQP-HAMMERHEAD', 'ground-vehicle',
    'M-44 Hammerhead du pack Firewalker ; étude du véhicule dans le seul contexte ME2.',
    'Survol, sauts, collecte, armement et acquisition du pack ne sont pas reproduits.'],
  ['ME2-LOR-FLOTILLA', 'fleet-group',
    'Flotte migrante pendant le procès de ME2 : groupement documentaire, pas coque individuelle.',
    'Aucun effectif, vaisseau membre ou puissance totale ne peut être déduit.',
    'Une flotte entière ne possède pas de budget de véhicule individuel dans cette épreuve.'],
  ['ME3-ZON-NORM-CIC', 'spacecraft',
    'Normandy dans le contexte ME3 ; la fiche du CIC et de la salle de guerre reste son seul ancrage ici.',
    'Ni salle de guerre jouable, ni ressources militaires, ni transfert du Normandy ME2 n’est créé.'],
  ['ME3-ZON-GETH-DREAD', 'spacecraft',
    'Cuirassé geth de ME3, désigné par la fiche du secteur de son canon.',
    'Canon, assaut, destruction, décisions de Rannoch et géométrie intérieure ne sont pas simulés.'],
  ['MEA-WRL-NEXUS', 'station',
    'Nexus pendant Andromeda : station centrale de l’Initiative, distincte de son dossier dans Nexus Uprising.',
    'Aucune mobilité de station, population, économie ou mission de colonisation n’est attribuée.',
    'Une station n’est pas un véhicule individuel disponible pour le parcours logistique.'],
  ['MEA-WRL-HYPERION', 'spacecraft',
    'Arche humaine Hyperion dans le contexte principal d’Andromeda.',
    'Cryostase, passagers, SAM et déplacement intergalactique ne sont pas contrôlables.'],
  ['MEA-WRL-LEUSINIA', 'spacecraft',
    'Leusinia, arche asari du contexte Andromeda.',
    'La recherche de l’arche, son sauvetage et ses passagers restent des événements documentaires.'],
  ['MEA-WRL-NATANUS', 'spacecraft',
    'Natanus, arche turienne recherchée dans Andromeda.',
    'Le dossier ne résout ni recherche, ni survie, ni nomination d’un Pionnier.'],
  ['MEA-WRL-PAARCHERO', 'spacecraft',
    'Paarchero, arche galarienne de la traque de l’Archonte dans Andromeda.',
    'Aucun choix de secours, équipage ou résultat de mission n’est modifié.'],
  ['MEA-ZON-TEMPEST-BRIDGE', 'spacecraft',
    'La fiche de passerelle ancre le Tempest dans Andromeda ; elle ne compte pas un intérieur comme nouvelle coque.',
    'Aucune passerelle jouable, route, compétence de pilote ou capacité de l’équipage n’est ajoutée.'],
  ['MEA-ZON-LIAM-SHIP', 'spacecraft',
    'Vaisseau désigné par son lien avec Calot Gurting dans la mission de Liam, sans nom de coque inventé.',
    'Le secours, l’équipage, l’inclinaison et le parcours intérieur de la mission ne sont pas reproduits.'],
  ['MEA-ZON-KETT-FLAGSHIP', 'spacecraft',
    'Vaisseau de l’Archonte dans Andromeda, conservé comme désignation contextuelle.',
    'L’étude n’accorde ni capture, ni choix de secours, ni exploration de ce vaisseau.'],
  ['MEA-LOR-ARKS', 'fleet-group',
    'Arches et Pionniers : référence collective aux arches, sans nouvelle coque individuelle.',
    'Aucun nombre de véhicules, chargement ou calendrier d’arrivée n’est extrapolé.',
    'Cette fiche regroupe plusieurs arches ; elle ne définit pas un véhicule simulable unique.'],
  ['MEA-LOR-QUARIAN', 'unresolved-reference',
    'L’épilogue d’Andromeda transmet un signal du Keelah Si’yah ; il n’établit pas une arrivée jouable.',
    'Le signal ne donne ni accès à l’arche, ni pilotage, ni découverte de sa position.',
    'Un signal documentaire ne fournit pas une coque présente et disponible pour une épreuve dans ce contexte.'],
  ['MEA-EQP-NOMAD-UPGRADES', 'ground-vehicle',
    'Le Nomad est ancré par sa fiche d’améliorations ; une seule référence représente ce véhicule ici.',
    'Aucune amélioration, recette, apparence, ressource ou aptitude de franchissement originale n’est accordée.'],
  ['MEA-WRL-MOONYARD', 'unresolved-reference',
    'La fiche du chantier lunaire mentionne un transport volé sans identifier son modèle.',
    'Le lieu, le transport et un modèle de véhicule ne sont pas assimilés.',
    'La fiche décrit un chantier et un transport non identifié ; aucun véhicule individuel fiable n’en est déduit.'],
  ['REV-REF-HASTINGS', 'spacecraft',
    'SSV Hastings dans Revelation ; la fiche atteste la frégate et les personnes qui y servent.',
    'Aucun combat spatial, armement, équipage commandable ou mission du roman n’est reconstitué.'],
  ['REV-REF-IWO', 'spacecraft',
    'SSV Iwo Jima dans Revelation, associé au transfert de Kahlee.',
    'L’exercice ne change ni transfert, ni passagers, ni destination du récit.'],
  ['ASC-REF-FLEET', 'fleet-group',
    'Flotte nomade dans Ascension, au moment où le groupe y est accueilli.',
    'Cette référence ne réutilise pas l’état du procès ME2 ni les caractéristiques de chaque vaisseau.',
    'Le groupement n’est pas une coque ; ses effectifs et ses budgets ne sont pas reconstruits.'],
  ['ASC-REF-IDENNA', 'spacecraft',
    'Idenna comme refuge dans Ascension ; le dossier ne lui attribue pas d’autres événements d’anthologie.',
    'Gillian reste une enfant dans ce récit ; aucun équipage de combat ou issue alternative n’est créé.'],
  ['ASC-REF-CYNIAD', 'spacecraft',
    'Cyniad, vaisseau éclaireur de l’Idenna piloté par Hilo dans Ascension.',
    'Le rôle d’éclaireur ne fournit ni vitesse canonique, ni armement ou contrôle de Hilo.'],
  ['RET-REF-SHUTTLE', 'spacecraft',
    'Navette d’extraction de Retribution ; la source n’ajoute pas de nom de modèle individuel.',
    'Le déplacement vers l’académie n’est pas rejoué ; aucun armement n’est inventé.'],
  ['NEX-REF-NEXUS', 'station',
    'Nexus dans Nexus Uprising, avant l’arrivée des autres arches, distinct du contexte du jeu Andromeda.',
    'La crise, les dégâts du Fléau, les passagers et leurs décisions restent inchangés.',
    'Le dossier porte sur une station pendant une crise ; aucun pilotage ou budget de transport individuel n’est établi.'],
  ['INI-REF-HYPERION', 'spacecraft',
    'Hyperion dans Initiation, avec le nœud SAM-E, dans le contexte antérieur au jeu Andromeda.',
    'SAM-E n’est pas assimilé au SAM du jeu ; aucun voyage vers Héléus ou pouvoir d’équipage n’est accordé.'],
  ['INI-REF-AUDACITY', 'spacecraft',
    'Audacity, vaisseau de Ygara dans l’opération d’Initiation.',
    'Aucune scène, propriété transférée, capacité de bord ou réplique du roman n’est ajoutée.'],
  ['ANN-REF-ARK', 'spacecraft',
    'Keelah Si’yah pendant le transit d’Annihilation, sans arrivée supposée à Héléus.',
    'La maladie, les passagers, les pertes et l’issue du roman ne dépendent pas de l’exercice.'],
  ['INI-REF-THEIA', 'station',
    'Station Theia dans Initiation, base de l’Initiative située dans la Voie lactée.',
    'La station n’est ni une arche ni un accès à Andromède.',
    'Station documentaire : aucun véhicule individuel ou modèle de déplacement n’est défini.'],
  ['PL-REF-BROODSHIP', 'spacecraft',
    'Vaisseau de Brood dans le segment Collecteurs de Paragon Lost uniquement.',
    'La traversée vers le vaisseau des Récolteurs, les pertes et la décision de Vega restent fixes.'],
  ['INI-REF-HOMEAWAY', 'station',
    'Home Away, station infiltrée pendant la recherche du code volé dans Initiation.',
    'Aucun plan, infiltration jouable ou contrôle des installations n’est fourni.',
    'La référence concerne une station, sans véhicule individuel disponible pour une épreuve logistique.'],
  ['ME2-WRL-OMEGA', 'station',
    'Omega dans ME2 : station des Systèmes Terminus, sans ajout de flotte ou de coque pilotable.',
    'La station, ses secteurs et ses occupants ne deviennent pas une unité de transport.',
    'Une station entière ne dispose pas d’un budget de véhicule individuel dans cet exercice.'],
  ['ME2-SQ-N7-CRASH', 'unresolved-reference',
    'La mission N7 Imminent Ship Crash atteste une urgence concernant un vaisseau non identifié ici.',
    'Aucun nom, modèle, trajectoire ou résultat de sauvetage n’est ajouté.',
    'Le dossier d’urgence ne définit pas une coque individuelle ou des caractéristiques utilisables.'],
];

const budgets = {
  'ground-vehicle': { hp: 12, shield: 8, attack: 0, defense: 2, speed: 3 },
  spacecraft: { hp: 14, shield: 10, attack: 0, defense: 2, speed: 3 },
};
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

function compile([recordId, role, note, limitation, blockedReason]) {
  const record = getUniverseRecord(recordId);
  const contexts = record?.availability.flatMap(scope => scope.periodIds.map(periodId => ({ mediaId: scope.mediaId, periodId }))) || [];
  const work = record && getUniverseWork(record.mediaId);
  if (!record?.fact || !contexts.some(context => canAccessContent(recordId, context).ok)
    || !record.sourceIds.length || !work || record.sourceIds.some(id => !work.sources.some(source => source.id === id))) {
    throw new Error(`Fleet study requires an existing factual contextual reference: ${recordId}`);
  }
  if (!blockedReason && !budgets[role]) throw new Error(`No independent logistics budget for ${recordId}`);
  return {
    recordId, mode: 'fleet', role,
    simulation: blockedReason ? { hp: 0, shield: 0, attack: 0, defense: 0, speed: 0 } : { ...budgets[role] },
    notes: [record.description, note,
      'Budget original sans unité : hp = intégrité, shield = réserve abstraite, defense = marge et speed = mobilité de l’épreuve ; attack reste nul. Ces valeurs ne sont pas des statistiques de l’œuvre.'],
    limitations: [limitation,
      'Épreuve logistique indépendante : aucune physique, géométrie, cabine, équipage, route narrative ou capacité de pilotage n’est reconstitué.',
      'Aucun carburant, bouclier, armement, vitesse canonique, acquisition, récompense ou changement de campagne n’est accordé.',
      ...(record.conditions ? [`Conditions documentaires conservées : ${record.conditions}`] : [])],
    ...(blockedReason ? { blockedReason } : {}),
  };
}

if (definitions.length !== 40 || new Set(definitions.map(row => row[0])).size !== 40) {
  throw new Error('Fleet expansion must contain exactly forty distinct contextual record IDs.');
}

export const EXPANSION_FLEET = freeze(definitions.map(compile));
