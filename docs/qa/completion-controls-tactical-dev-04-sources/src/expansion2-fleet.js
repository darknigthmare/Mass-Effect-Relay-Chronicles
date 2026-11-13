// Twenty-six additional contextual dossiers, not twenty-six new vessels.
// Only Arcturian Jade adds a named transport identity. Hyperion is a separate
// occurrence of an existing ark in its exact prologue segment.
import { getUniverseRecord, getUniverseWork } from './universe-data.js';
import { canAccessContent } from './continuity.js';

const stationBlock = 'Consultation uniquement : cette station ne définit pas un véhicule individuel disponible pour le parcours logistique.';
const definitions = [
  ['GAL-LOC-JADE', 'spacecraft',
    'Arcturian Jade, paquebot de l’ouverture de Galaxy : seule nouvelle identité de transport nommée dans ce lot.',
    'L’ouverture, les passagers et les événements de Galaxy ne sont pas rejoués ; aucun armement ou contrôle de bord n’est déduit.'],
  ['MEA-MQ-HYPERION', 'spacecraft',
    'Hyperion dans le seul prologue d’Andromeda : occurrence documentaire distincte, pas une nouvelle arche ajoutée au dossier du contexte principal.',
    'Le réveil, la cryostase et le départ vers Habitat 7 restent fixes ; aucun trajet intergalactique ni intérieur jouable n’est accordé.'],
  ['ME2-ZON-DERELICT', 'derelict',
    'Moissonneur abandonné de l’opération IFF dans ME2 : étude d’une épave, sans modèle de vaisseau opérationnel ajouté.',
    'Aucune remise en service, propulsion, exploration intérieure ou acquisition de l’IFF n’est simulée.',
    'Consultation uniquement : la référence décrit un Moissonneur abandonné, sans transport opérationnel disponible pour le parcours logistique.'],
  ['ME2-EQP-NORMANDY-ARMOR', 'ship-system',
    'Dossier du blindage du Normandy ME2 ; il ne constitue ni une nouvelle coque ni une amélioration acquise.',
    'La table des pertes reste à vérifier : aucun bonus de résistance, protection d’équipage ou résultat d’approche finale n’est accordé.',
    'Consultation uniquement : ce système de blindage n’est pas un véhicule et sa table de conséquences n’est pas implémentée.'],
  ['ME2-EQP-NORMANDY-SHIELD', 'ship-system',
    'Dossier de l’amélioration des boucliers du Normandy ME2, avec sa condition documentaire liée à Tali.',
    'Aucun recrutement de Tali, accès à la recherche, bouclier effectif ou changement des pertes n’est accordé.',
    'Consultation uniquement : ce système de bouclier n’est pas un véhicule et ses effets ne sont pas implémentés.'],
  ['ME2-EQP-NORMANDY-GUN', 'ship-system',
    'Dossier de l’amélioration de l’armement du Normandy ME2 ; il ne donne aucune attaque de vaisseau.',
    'La table des conséquences reste à vérifier : aucun canon, dégât ou dénouement de l’approche finale n’est fourni.',
    'Consultation uniquement : ce système d’armement n’est pas un véhicule et aucune capacité de tir n’est implémentée.'],
  ['MEA-EQP-NOMAD-SKINS', 'vehicle-appearance',
    'Référence aux apparences du Nomad selon édition et contenu ; elle ne compte aucun nouveau véhicule.',
    'Aucun skin, géométrie, bonus de protection ou aptitude du Nomad n’est livré par cette fiche.',
    'Consultation uniquement : cette fiche atteste des apparences conditionnelles, sans fournir un cosmétique ni un profil logistique supplémentaire.'],
  ['ME2-WRL-CITADEL', 'station',
    'Citadelle dans le contexte ME2 : dossier de station et de hub, pas une station supplémentaire inventée.',
    'Aucun secteur, recrutement de Kasumi, service du hub ou contrôle de la station n’est accordé.', stationBlock],
  ['ME2-WRL-HERETIC', 'station',
    'Station hérétique de ME2, liée à la préparation du virus geth dans la fiche existante.',
    'Le virus, le choix concernant les geth et l’exploration de la station ne sont pas simulés.', stationBlock],
  ['ME2-SQ-N7-RESEARCH', 'station',
    'Station de recherche abandonnée désignée par son affectation N7 ; aucun autre nom ou plan n’est déduit.',
    'Le titre de mission n’atteste pas ici un véhicule pilotable ; l’affectation et ses installations ne sont pas reproduites.', stationBlock],
  ['ME2-SQ-N7-ENDANGERED', 'station',
    'Station de recherche menacée désignée par son affectation N7, distincte de l’affectation de station abandonnée.',
    'L’urgence, les personnes concernées et le résultat de l’affectation restent hors de l’exercice.', stationBlock],
  ['ME3-WRL-CITADEL', 'station',
    'Citadelle dans le seul contexte ME3 ; ce dossier ne transfère aucun état du hub de ME2.',
    'Aucune population, mission civile, décision politique ou capacité de déplacement n’est simulée.', stationBlock],
  ['ME3-WRL-OMEGA', 'station',
    'Omega occupée dans ME3 : occurrence de la station pendant ce contexte, pas une nouvelle coque.',
    'L’occupation et sa résolution ne sont pas modifiées ; aucun secteur ou contrôle de station n’est livré.', stationBlock],
  ['ME3-WRL-CERBERUS', 'station',
    'Station de Cerberus du contexte ME3, quartier général attaqué avant la Terre selon sa fiche.',
    'L’assaut, les données de Cerberus et les événements de fin de campagne ne sont pas rejoués.', stationBlock],
  ['INF-LOC-BARN', 'station',
    'The Barn dans Infiltrator : station de recherche de Cerberus selon le dossier existant.',
    'Aucun plan intérieur, expérience, équipement ou mouvement de station n’est ajouté.', stationBlock],
  ['GAL-LOC-CARTAGENA', 'station',
    'Cartagena Station dans Galaxy, limitée à son rôle d’étape de l’enquête.',
    'L’enquête, les rencontres et les installations de cette étape ne sont pas jouables.', stationBlock],
  ['GAL-LOC-AHN', 'station',
    'Ahn’Kedar Orbital Platform dans Galaxy, station de la piste des scientifiques.',
    'Aucun accès aux scientifiques, trajet orbital, intérieur ou dénouement n’est accordé.', stationBlock],
  ['GAL-LOC-CITADEL', 'station',
    'Citadelle comme destination finale de Galaxy ; ce contexte ne reprend pas les hubs de ME2 ou ME3.',
    'La progression de l’enquête et sa conclusion ne sont pas changées par la consultation.', stationBlock],
  ['REV-REF-CITADEL', 'station',
    'Citadelle dans Revelation : référence aux rapports entre espèces conciliennes, limitée au contexte du roman.',
    'Aucune scène du roman, fonction de Spectre ou connaissance anticipée des intentions de Saren n’est accordée.', stationBlock],
  ['ASC-REF-OMEGA', 'station',
    'Omega dans Ascension, pendant la rétention du groupe par Pel avant sa fuite.',
    'La fuite reste fixe ; aucun combat de Gillian, contrôle du groupe ou changement de son parcours n’est créé.', stationBlock],
  ['RET-REF-OMEGA', 'station',
    'Omega dans Retribution, où Grayson vit puis est capturé selon la fiche existante.',
    'Aucune libération ou guérison de Grayson, ni élimination définitive de Kai Leng, n’est accordée.', stationBlock],
  ['RET-REF-CITADEL', 'station',
    'Citadelle dans Retribution, liée au rôle diplomatique d’Orinia, sans nouvelle station ajoutée.',
    'L’aide diplomatique reste celle du récit ; aucune guerre nouvelle ou issue alternative n’est déduite.', stationBlock],
  ['RED-WRL-OMEGA', 'station',
    'Omega dans Redemption, traversée par la recherche de Liara ; occurrence propre à cette œuvre.',
    'Aucune présence active de Shepard, exploration de station ou modification du raccord vers ME2 n’est créée.', stationBlock],
  ['INV-WRL-OMEGA', 'station',
    'Omega dans Invasion : la station est l’enjeu de l’arc, sans constituer un véhicule individuel.',
    'L’occupation et le départ d’Aria restent fixes ; aucune victoire d’une guerre contraire au comic n’est permise.', stationBlock],
  ['INC-WRL-OMEGA', 'station',
    'Omega dans Incursion, au seul secteur du raid attesté par la notice éditeur.',
    'Le sort publié des captifs et le résultat narratif du raid restent fixes ; aucun secteur complet n’est reproduit.', stationBlock],
  ['INQ-WRL-CITADEL', 'station',
    'Citadelle dans Inquisition, contexte de l’enquête de Bailey selon la notice éditeur.',
    'La confrontation et son incertitude finale ne sont pas réécrites ; aucun verdict omniscient n’est inventé.', stationBlock],
];

const logisticsBudget = { hp: 14, shield: 10, attack: 0, defense: 2, speed: 3 };
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

function compile([recordId, role, note, limitation, blockedReason]) {
  const record = getUniverseRecord(recordId), work = record && getUniverseWork(record.mediaId);
  const contexts = record?.availability.flatMap(scope => scope.periodIds.map(periodId => ({ mediaId: scope.mediaId, periodId }))) || [];
  if (!record?.fact || !contexts.some(context => canAccessContent(recordId, context).ok)
    || !record.sourceIds.length || !work || record.sourceIds.some(id => !work.sources.some(source => source.id === id))) {
    throw new Error(`Additional fleet study requires an existing factual contextual reference: ${recordId}`);
  }
  if (!blockedReason && role !== 'spacecraft') throw new Error(`No logistics study for ${recordId}`);
  return {
    recordId, mode: 'fleet', role,
    simulation: blockedReason ? null : { ...logisticsBudget },
    notes: [record.description, note,
      blockedReason
        ? 'Consultation documentaire sans budget de simulation : ce dossier ne crée ni véhicule ni système utilisable.'
        : 'Budget original sans unité : hp = intégrité, shield = réserve abstraite, defense = marge et speed = mobilité de l’épreuve ; attack reste nul. Ces valeurs ne sont pas des statistiques de l’œuvre.'],
    limitations: [limitation,
      'Étude indépendante : aucune physique, géométrie, cabine, équipage, route narrative ou capacité de pilotage n’est reconstitué.',
      'Aucun carburant, bouclier, armement, vitesse canonique, acquisition, récompense ou changement de campagne n’est accordé.',
      ...(record.conditions ? [`Conditions documentaires conservées : ${record.conditions}`] : [])],
    ...(blockedReason ? { blockedReason } : {}),
  };
}

if (definitions.length !== 26 || new Set(definitions.map(row => row[0])).size !== 26) {
  throw new Error('The second fleet lot contains twenty-six distinct contextual dossiers, below the forty-reference target.');
}

export const EXPANSION2_FLEET = freeze(definitions.map(compile));
