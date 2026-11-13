// Lot 2 adds documentary occurrences only. It never grants campaign recruitment
// or changes the first two hundred Simulation entries. APEX classes are seven
// multiplayer archetypes, not seven newly named people or Tempest companions.
import { getUniverseRecord, getUniverseWork } from './universe-data.js';
import { canAccessContent } from './continuity.js';

const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

// Independent ATB budgets, never the original character/class statistics.
const BUDGETS = {
  military: { hp: 220, shield: 90, attack: 23, defense: 6, speed: 1 },
  specialist: { hp: 200, shield: 90, attack: 21, defense: 5, speed: 1.03 },
  heavy: { hp: 280, shield: 75, attack: 25, defense: 8, speed: .9 },
};
const combat = (recordId, role, budget = 'military', extra = {}) => ({ recordId, role, budget, ...extra });
const inspect = (recordId, role, blockedReason) => ({ recordId, role, blockedReason });
const apex = (suffix, budget = 'specialist') => combat(`MEA-CHR-MP-${suffix}`, 'Archétype multijoueur APEX', budget, {
  identityKind: 'multiplayer-archetype',
  notes: ['Classe multijoueur documentée, pas une personne nommée : aucun recrutement de compagnon du Tempest.'],
  limitations: ['APEX uniquement. Les pouvoirs, talents, spécialisations et mécaniques propres à la classe ne sont pas reproduits.'],
});

const definitions = [
  apex('HUMAN-KINETICIST'), apex('ASARI-DUELIST'), apex('TURIAN-HAVOC', 'military'),
  apex('KROGAN-ENGINEER', 'heavy'), apex('SALARIAN-ARCHITECT'), apex('ANGARA-AVENGER'), apex('BATARIAN-VANGUARD', 'military'),
  combat('ME3-NPC-JACOB', 'Protection des scientifiques d’Arrae', 'military', {
    notes: ['État de test où Jacob a survécu : aucun état de sauvegarde ni aucune survie de campagne n’est déduit.'],
    limitations: ['Occurrence de protection des rescapés uniquement ; aucun recrutement permanent ni kit Armax transféré.'],
  }),
  combat('ME3-NPC-KAI', 'Antagoniste combattant de Cerberus', 'specialist', {
    supportingRecordIds: ['ME3-ENM-KAI'],
    limitations: ['Le rôle de boss est attesté par une autre fiche de la même œuvre ; duels, phases, équipement et capacités originales ne sont pas reproduits.'],
  }),
  combat('ME3-NPC-PETROVSKY', 'Commandant de l’occupation d’Omega', 'military', {
    editionProfile: 'legendary',
    notes: ['État préparé avec le contenu Omega présent ; aucune conclusion du DLC n’est rejouée.'],
    limitations: ['Le commandement militaire justifie uniquement un gabarit ATB abstrait, sans arme personnelle ni duel original attribué.'],
  }),
  combat('ASC-CHR-PEL', 'Agent impliqué dans la capture sur Omega', 'military', {
    limitations: ['Seul son rôle dans la capture est relevé ; aucune arme ou technique personnelle n’est déduite.'],
  }),
  combat('INI-CHR-VLASSIA', 'Officier du renseignement de l’Alliance', 'specialist', {
    limitations: ['Le rôle militaire est attesté ; l’équipement, les compétences de terrain et les rencontres exactes restent non relevés.'],
  }),

  inspect('ME2-NPC-KELLY', 'Membre de l’équipage du Normandy',
    'Inspection seulement : ce rôle d’équipage ne prouve pas un rôle de combattante.'),
  inspect('ME2-NPC-CHAKWAS', 'Médecin du Normandy',
    'Inspection seulement : le rôle médical ne donne aucune attaque ni aptitude de soin utilisable en combat.'),
  inspect('ME2-NPC-KEN', 'Technicien du Normandy',
    'Inspection seulement : la demande technique de coupleurs n’atteste pas un kit combattant.'),
  inspect('ME2-NPC-GABBY', 'Technicienne du Normandy',
    'Inspection seulement : le rôle de technicienne ne suffit pas à attribuer une arme ou une attaque.'),
  inspect('ME2-NPC-VEETOR', 'Survivant de Freedom’s Progress',
    'Inspection seulement : le statut de survivant ne prouve pas un rôle combattant.'),
  inspect('ME2-NPC-OKEER', 'Scientifique de Korlus',
    'Inspection seulement : l’espèce krogan et le rôle scientifique ne suffisent pas à attribuer des attaques.'),
  inspect('ME2-NPC-DAVID', 'Victime du dispositif Overlord',
    'Inspection seulement : son lien forcé au dispositif n’est ni un kit de combat ni une autorisation de transformer la personne en ennemi.'),
  inspect('RED-ACT-TIM', 'Interlocuteur de Cerberus',
    'Inspection seulement : une scène de dialogue dans Redemption ne décrit pas un rôle combattant.'),
  inspect('ME3-NPC-CORTEZ', 'Pilote de navette',
    'Inspection seulement : la fonction de pilote ne justifie aucun profil de combattant terrestre ni pilotage jouable.'),
  inspect('ME3-NPC-MICHEL', 'Médecin de l’hôpital',
    'Inspection seulement : aucun recrutement ni pouvoir de soin n’est déduit du métier de médecin.'),
  inspect('ME3-NPC-ADAMS', 'Ingénieur du Normandy',
    'Inspection seulement : le métier d’ingénieur de bord ne donne pas automatiquement la classe ou les pouvoirs d’ingénieur combattant.'),
  inspect('ME3-NPC-ALLERS', 'Journaliste',
    'Inspection seulement : l’embarquement éventuel d’une journaliste ne donne pas de droit de combat.'),
  inspect('MEA-NPC-LEXI', 'Médecin du Tempest',
    'Inspection seulement : le rôle médical ne justifie pas un kit combattant.'),
  inspect('MEA-NPC-KALLO', 'Pilote du Tempest',
    'Inspection seulement : le rôle de pilote ne donne pas de combat terrestre ni de commande de vol.'),
  inspect('MEA-NPC-SUVI', 'Scientifique du Tempest',
    'Inspection seulement : les activités scientifiques ne prouvent pas un rôle combattant.'),
  inspect('MEA-NPC-GIL', 'Ingénieur du Tempest',
    'Inspection seulement : aucune classe de combat ni pouvoir technique n’est déduit du métier d’ingénieur de bord.'),
  inspect('REV-CHR-KAHLEE', 'Scientifique recherchée dans l’affaire Sidon',
    'Inspection seulement : le rôle scientifique et la recherche de Kahlee ne décrivent pas ici ses actions de combat.'),
  inspect('REV-CHR-GRISSOM', 'Refuge de Kahlee sur Elysium',
    'Inspection seulement : ce rôle d’accueil ne donne pas de kit militaire emprunté à une autre époque.'),
  inspect('REV-CHR-EDAN', 'Commanditaire des opérations de Skarr',
    'Inspection seulement : commander une opération ne prouve pas une participation personnelle combattante ni un rôle militaire.'),
  inspect('ASC-CHR-GILLIAN', 'Enfant biotique du projet Ascension',
    'Inspection seulement : Gillian conserve ses douze ans et son contexte ; aucune version adulte, arme ou aptitude nommée n’est inventée.'),
  inspect('ASC-CHR-PAUL', 'Père adoptif de Gillian et agent de Cerberus',
    'Inspection seulement : cette description ne précise pas ses actions combattantes ; l’appartenance à Cerberus n’est pas un kit.'),
  inspect('RET-CHR-LISELLE', 'Compagne de Grayson',
    'Inspection seulement : le lien avec Grayson et Aria ne prouve aucun armement ni rôle de mercenaire.'),
  inspect('NEX-CHR-CALIX', 'Technicien lié à la révolte du Nexus',
    'Inspection seulement : un rôle central dans la révolte ne suffit pas à transformer un technicien en combattant.'),
  inspect('NEX-CHR-IRIDA', 'Vol de données et sabotage des serveurs',
    'Inspection seulement : le sabotage documentaire des serveurs ne donne pas de pouvoir de piratage de combat.'),
  inspect('INI-CHR-SAME', 'Partition expérimentale de SAM',
    'Inspection seulement : une partition implantée pour assister Cora ne reçoit ni corps ni entité combattante autonome.'),
  inspect('ANN-CHR-YORRIK', 'Responsable de l’enjeu médical Blue-7',
    'Inspection seulement : aucun kit de combat n’est déduit du rôle médical ni de l’espèce elcor.'),
  inspect('ANN-CHR-BORBALA', 'Membre de Blue-7',
    'Inspection seulement : un ancien lien avec une famille criminelle ne prouve pas un armement ou des attaques actuelles.'),
  inspect('ANN-CHR-IRIT', 'Diagnostic des systèmes Blue-7',
    'Inspection seulement : l’activité de diagnostic ne donne pas de pouvoir technique de combat.'),
];

function compile(definition) {
  const record = getUniverseRecord(definition.recordId), work = record && getUniverseWork(record.mediaId);
  const records = [record, ...(definition.supportingRecordIds ?? []).map(getUniverseRecord)];
  const contextScopes = record?.availability.map(scope => ({ mediaId: scope.mediaId, periodIds: [...scope.periodIds] })) ?? [];
  if (!record?.fact || !['characters', 'npcs'].includes(record.category) || !work || work.locked
    || records.some(item => !item?.fact || item.mediaId !== record.mediaId || !item.sourceIds.length
      || item.sourceIds.some(id => !work.sources.some(source => source.id === id)))
    || !contextScopes.some(scope => scope.periodIds.some(periodId => records.every(item =>
      canAccessContent(item.id, { mediaId: scope.mediaId, periodId }).ok)))) return null;
  const blocked = typeof definition.blockedReason === 'string';
  const sourceIds = [...new Set(records.flatMap(item => item.sourceIds))];
  return {
    recordId: record.id, mode: 'actor', role: definition.role,
    identityKind: definition.identityKind ?? 'named-character-occurrence',
    simulation: blocked ? null : { ...BUDGETS[definition.budget], synthetic: false, primaryAction: 'shoot' },
    notes: [record.description, ...(record.conditions ? [record.conditions] : []),
      ...records.slice(1).map(item => `Complément documentaire ${item.id} : ${item.description}`),
      ...(definition.notes ?? []),
      'Occurrence de cette œuvre et de ses segments ; aucun recrutement, rencontre originale ou résultat narratif n’est accordé.'],
    limitations: [
      ...(blocked ? ['Consultation uniquement : aucune statistique, attaque ou escarmouche disponible.'] : [
        'PV, boucliers, attaque, défense, vitesse et tir générique sont des réglages de test ATB, sans équivalence certifiée avec l’œuvre.',
        'Kit original non reproduit : aucun pouvoir ni modèle d’équipement nommé ; cibles et résultats abstraits sans conséquence de campagne.',
      ]),
      ...(definition.limitations ?? []),
      'Cette fiche ne fournit aucun portrait, sprite ou animation certifié fidèle.'],
    constraints: { editionProfile: definition.editionProfile ?? null },
    blockedReason: definition.blockedReason ?? null,
    statsBasis: blocked ? null : 'ATB adaptation', powers: [], contextScopes,
    sourceEntryIds: records.map(item => item.id), sourceIds,
    provenance: {
      catalogPath: record.provenance.catalogPath, reference: record.reference,
      verification: 'Faits brefs des sources existantes, parfois secondaires ; aucun nouveau contrôle primaire du kit ou de ses statistiques.',
      sources: sourceIds.map(id => ({ ...work.sources.find(source => source.id === id) })),
      supportingRecords: records.slice(1).map(item => ({ recordId: item.id, catalogPath: item.provenance.catalogPath, reference: item.reference })),
    },
  };
}

export const EXPANSION2_CHARACTERS = freeze(definitions.map(compile).filter(Boolean));
