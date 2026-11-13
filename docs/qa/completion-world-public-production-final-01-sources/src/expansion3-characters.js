// Third selection: source-scoped occurrences absent from the two earlier
// Simulation batches and from the historical selectable actor roster.
// An occurrence is not necessarily a physical person: a collective, recording,
// remote contact and AI representation retain their explicit identity kind.
import { getUniverseRecord, getUniverseWork } from './universe-data.js';
import { canAccessContent } from './continuity.js';

const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
const inspect = (recordId, role, blockedReason, extra = {}) => ({ recordId, role, blockedReason, ...extra });
const combat = (recordId, role, extra = {}) => ({ recordId, role, ...extra });
const definitions = [
  inspect('ME2-NPC-KURIL', 'Antagoniste de Purgatory',
    'Inspection seulement : la fiche identifie un antagoniste mais ne décrit pas ici son attaque ni un kit de combat.'),
  inspect('ME2-NPC-HOCK', 'Marchand d’armes visé par le cambriolage',
    'Inspection seulement : le métier de marchand d’armes ne fournit ni attaque personnelle ni véhicule de boss.',
    { editionProfile: 'legendary', limitations: ['Occurrence Stolen Memory, dans un profil préparé contenant cette extension ; aucun cambriolage ou combat aérien reproduit.'] }),
  inspect('ME2-NPC-KEIJI', 'Enregistrement d’un partenaire disparu',
    'Inspection seulement : cet enregistrement ne devient ni une personne vivante, ni un combattant recrutable.',
    { identityKind: 'recorded-occurrence', editionProfile: 'legendary' }),
  inspect('ME2-NPC-BAILEY', 'Contact de C-Sec sur la Citadelle',
    'Inspection seulement : la fonction de contact C-Sec ne suffit pas à attribuer une arme ou une attaque personnelle.'),

  combat('ME3-NPC-BROOKS', 'Occurrence du complot de Citadel', {
    supportingRecordIds: ['ME3-ENM-BROOKS'], editionProfile: 'legendary',
    notes: ['Le rôle combattant est attesté par la fiche ennemie de la même œuvre ; l’occurrence PNJ reste une identité de dossier séparée, pas une nouvelle personne.'],
    limitations: ['Citadel présent dans le profil préparé ; aucun uniforme, classe, tir original, reddition ou résultat du complot n’est reconstitué.'],
  }),
  inspect('ME3-NPC-THANE', 'Présence conditionnelle à l’hôpital',
    'Inspection seulement : la présence à l’hôpital ne donne pas ici un kit d’assassin importé de ME2.'),
  inspect('ME3-NPC-JACK', 'Instructrice retrouvée à Grissom',
    'Inspection seulement : le rôle d’instructrice ne rétablit ni les pouvoirs de ME2 ni un recrutement permanent.'),
  inspect('ME3-NPC-SAMARA', 'Présence conditionnelle au monastère',
    'Inspection seulement : aucune capacité de ME2 ni attaque personnelle n’est transférée à cette présence conditionnelle.'),
  inspect('ME3-NPC-LEGION', 'Interlocuteur geth de l’arc de Rannoch',
    'Inspection seulement : la fiche couvre Legion ou une VI selon les états importés ; aucune forme physique ou survie unique n’est imposée.',
    { identityKind: 'conditional-entity-occurrence' }),
  inspect('ME3-NPC-MIRANDA', 'Recherche conditionnelle d’Oriana à Sanctuary',
    'Inspection seulement : la survie importée et la recherche d’Oriana ne donnent ni recrutement ni kit combattant ME2.'),

  inspect('MEA-NPC-FISHER', 'Membre de l’équipe de Habitat 7',
    'Inspection seulement : l’appartenance à l’équipe de Habitat 7 ne suffit pas à attribuer une attaque ; aucun retour après le prologue n’est créé.'),
  inspect('MEA-NPC-GREER', 'Membre de l’équipe de Habitat 7',
    'Inspection seulement : cette appartenance à l’équipe n’établit pas une arme personnelle ou un kit combattant.'),
  inspect('MEA-NPC-KIRKLAND', 'Membre de l’équipe du prologue',
    'Inspection seulement : le contexte reste celui du prologue ; aucun destin alternatif ou recrutement ultérieur n’est accordé.'),
  inspect('MEA-NPC-SAM', 'IA liée au Pathfinder',
    'Inspection seulement : SAM ne reçoit ni corps, ni action de tir, ni autonomie de compagnon de terrain.',
    { identityKind: 'ai-occurrence' }),
  inspect('MEA-NPC-TWIN', 'Autre jumeau Ryder dans le récit',
    'Inspection seulement : l’identité du Ryder non choisi et son état narratif restent conditionnels ; aucun second protagoniste sélectionnable n’est créé.',
    { identityKind: 'conditional-character-occurrence' }),
  inspect('MEA-NPC-RAEKA', 'Pionnière galarienne liée au choix de secours',
    'Inspection seulement : le titre de Pionnière n’attribue pas de compétences ; son choix de secours et sa succession ne sont pas résolus.'),

  inspect('REV-CHR-JELLA', 'Contact de Had’dah à Dah’tan',
    'Inspection seulement : la fonction de contact n’atteste ni armement ni action de combat.'),
  inspect('REV-CHR-QIAN', 'Chercheur associé à l’enquête sur Sidon',
    'Inspection seulement : le rôle scientifique ne donne aucun pouvoir ou attaque.'),
  inspect('REV-CHR-GROTO', 'Intermédiaire interrogé par Saren',
    'Inspection seulement : être interrogé ne prouve aucun rôle de combattant et ne permet pas de modifier le résultat du récit.'),

  inspect('ASC-CHR-KAHLEE', 'Scientifique cherchant à protéger Gillian',
    'Inspection seulement : protéger Gillian dans le récit ne définit pas ici d’action armée ou de pouvoir.'),
  inspect('ASC-CHR-LEMM', 'Jeune Quarien participant à la fuite',
    'Inspection seulement : aider à fuir ne suffit pas à attribuer une arme, une attaque ou une classe technique.'),
  inspect('ASC-CHR-GOLO', 'Contact de Cerberus sur Omega',
    'Inspection seulement : l’exil et les contacts avec Cerberus ne constituent pas un kit de combat.'),
  inspect('ASC-CHR-NICK', 'Élève biotique du projet Ascension',
    'Inspection seulement : l’élève conserve son contexte et son âge ; aucun kit adulte, arme ou pouvoir nommé n’est inventé.'),

  combat('RET-CHR-ANDERSON', 'Recherche du centre de détention avec Kahlee', {
    supportingRecordIds: ['RET-REF-SHOTGUN'],
    notes: ['La référence d’un fusil à pompe employé par Anderson dans cette œuvre atteste une action armée, sans établir son modèle ou son système de ressources.'],
    limitations: ['Le tir de test est abstrait : ni fusil original, ni cadence, ni réserve, ni chaleur originale ne sont déduits. Le combat contre Grayson et son dénouement ne sont pas rejoués.'],
  }),
  inspect('RET-CHR-GRAYSON', 'Sujet de l’expérience de Cerberus',
    'Inspection seulement : l’expérience et les implants ne donnent ni personnage guéri, ni ennemi générique, ni kit de pouvoirs des Moissonneurs.'),
  inspect('RET-CHR-KAHLEE', 'Recherche de Grayson avec l’aide d’Anderson',
    'Inspection seulement : solliciter de l’aide ne définit pas ici d’attaque ou de classe de combat.'),
  inspect('RET-CHR-ORINIA', 'Ambassadrice sollicitée pour aider l’enquête',
    'Inspection seulement : le rôle diplomatique ne donne ni tir ni capacité militaire.'),

  inspect('NEX-CHR-KANDROS', 'Membre de l’Initiative présent dans le roman',
    'Inspection seulement : la présence de Tiran dans ce roman ne transfère pas son rôle militaire ou ses scènes d’une autre œuvre.'),
  inspect('NEX-CHR-GARSON', 'Fondatrice évoquée dans le contexte du Nexus',
    'Inspection seulement : une figure évoquée ne reçoit ni présence vivante imposée, ni corps jouable, ni aptitude de combat.',
    { identityKind: 'referenced-occurrence' }),
  inspect('NEX-CHR-SPENDER', 'Négociateur du soutien krogan',
    'Inspection seulement : cette négociation n’attribue pas de pouvoir, d’armement ou de formation militaire.'),

  inspect('INI-CHR-ALEC', 'Commanditaire de la récupération du noyau',
    'Inspection seulement : confier une mission à Cora ne définit pas un kit combattant pour cette occurrence antérieure au départ des arches.'),
  inspect('INI-CHR-MEDEA', 'IA hybride dirigeant Quiet Eddy',
    'Inspection seulement : le contrôle d’êtres augmentés ne donne ni corps de combattant autonome, ni pouvoir universel de contrôle des IA.',
    { identityKind: 'ai-occurrence' }),
  inspect('INI-CHR-JENSEN', 'Scientifique parmi les survivants de Quiet Eddy',
    'Inspection seulement : survivre à Quiet Eddy n’établit ni attaque ni pouvoir technique.'),

  inspect('ANN-CHR-YSSES', 'Apothicaire de Blue-7',
    'Inspection seulement : l’activité médicale ne crée ni soin de combat, ni attaque, ni explication jouable de la maladie.'),
  inspect('ANN-CHR-QETSI', 'Capitaine de la Keelah Si’yah',
    'Inspection seulement : commander l’arche ne justifie ni combat terrestre ni pilotage jouable.'),
  inspect('ANN-CHR-SOVAL', 'Analyste liée aux premiers constats',
    'Inspection seulement : être analyste drell ne donne aucun kit d’assassin ou de combat.'),

  inspect('RED-ACT-BROKER', 'Représentation distante du Courtier de l’ombre',
    'Inspection seulement : cette représentation distante ne révèle ni identité anticipée ni boss de ME2.',
    { identityKind: 'distant-representation-occurrence' }),
  combat('INV-ACT-DEFENDERS', 'Collectif des défenseurs d’Omega', {
    identityKind: 'collective-occurrence',
    notes: ['La coopération des gangs dans la défense est attestée ; le porteur de test représente un collectif abstrait, pas un nouveau personnage nommé ou chacun de ses membres.'],
    limitations: ['Aucun membre, effectif, arme, identité individuelle ou commandement tactique original n’est déduit de ce collectif. L’occupation d’Omega reste l’issue du récit.'],
  }),
  inspect('FOU-ACT-JACOB', 'Accompagnement de Miranda dans la recherche',
    'Inspection seulement : accompagner Miranda dans ce segment n’importe aucun kit de Galaxy ou de ME2.'),
  inspect('PL-CHR-LIARA', 'Mentore contactée à distance par Treeya',
    'Inspection seulement : le contact à distance ne devient ni présence sur Fehl Prime ni combattante du commando de Vega.',
    { identityKind: 'distant-contact-occurrence' }),
];

const TEST_BUDGET = { hp: 220, shield: 90, attack: 23, defense: 6, speed: 1 };
function compile(definition) {
  const record = getUniverseRecord(definition.recordId), work = record && getUniverseWork(record.mediaId);
  const records = [record, ...(definition.supportingRecordIds ?? []).map(getUniverseRecord)];
  if (!record?.fact || !['characters', 'npcs'].includes(record.category) || !work || work.locked
    || records.some(item => !item?.fact || item.mediaId !== record.mediaId || !item.sourceIds.length
      || item.sourceIds.some(id => !work.sources.some(source => source.id === id)))
    || !record.availability.some(scope => scope.periodIds.some(periodId => records.every(item =>
      canAccessContent(item.id, { mediaId: scope.mediaId, periodId }).ok)))) {
    throw new Error(`Invalid lot 3 character evidence: ${definition.recordId}`);
  }
  const blocked = typeof definition.blockedReason === 'string';
  const sourceIds = [...new Set(records.flatMap(item => item.sourceIds))];
  return {
    recordId: record.id, mode: 'actor', role: definition.role,
    identityKind: definition.identityKind ?? 'named-character-occurrence',
    simulation: blocked ? null : { ...TEST_BUDGET, synthetic: false, primaryAction: 'shoot' },
    powers: [], statsBasis: blocked ? null : 'ATB adaptation',
    constraints: { editionProfile: definition.editionProfile ?? null },
    blockedReason: definition.blockedReason ?? null,
    contextScopes: record.availability.map(scope => ({ mediaId: scope.mediaId, periodIds: [...scope.periodIds] })),
    sourceEntryIds: records.map(item => item.id), sourceIds,
    notes: [record.description, ...(record.conditions ? [record.conditions] : []),
      ...records.slice(1).map(item => `Complément documentaire ${item.id} : ${item.description}`),
      ...(definition.notes ?? []),
      'Occurrence propre à cette œuvre et à ses segments ; aucun recrutement, état importé, rencontre originale ou résultat narratif n’est accordé.'],
    limitations: [
      ...(blocked ? ['Consultation uniquement : aucune statistique, attaque ou escarmouche disponible.'] : [
        'PV, boucliers, attaque, défense, vitesse, tir et chaleur génériques sont des réglages de test ATB ; aucune valeur ou ressource d’origine n’est certifiée.',
        'Aucun pouvoir, modèle d’équipement, kit original ou formation de classe n’est attribué ; la cible et le résultat sont abstraits et sans conséquence de campagne.',
      ]), ...(definition.limitations ?? []),
      'Cette fiche ne fournit aucun portrait, sprite ou animation certifié fidèle.'],
    provenance: {
      catalogPath: record.provenance.catalogPath, reference: record.reference,
      verification: 'Faits brefs des sources existantes, parfois secondaires ; aucun nouveau contrôle primaire du kit ou de ses statistiques.',
      sources: sourceIds.map(id => ({ ...work.sources.find(source => source.id === id) })),
      supportingRecords: records.slice(1).map(item => ({ recordId: item.id, catalogPath: item.provenance.catalogPath, reference: item.reference })),
    },
  };
}

export const EXPANSION3_CHARACTERS = freeze(definitions.map(compile));
