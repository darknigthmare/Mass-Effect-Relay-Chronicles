// Forty documentary occurrences for the independent Simulation tab. These
// definitions never change campaign recruitment or historical scenario rights.
// A military/mercenary role supports a generic ATB test, not an original kit.
// Other roles deliberately have no combat definition at all.
import { getUniverseRecord, getUniverseWork } from './universe-data.js';
import { canAccessContent } from './continuity.js';

const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

// Test budgets only: no number, shield allocation or cadence is certified as
// an original Mass Effect statistic. No named weapon or power is assigned.
const BUDGETS = {
  military: { hp: 220, shield: 90, attack: 23, defense: 6, speed: 1 },
  mercenary: { hp: 210, shield: 80, attack: 23, defense: 5, speed: 1 },
  specialist: { hp: 200, shield: 90, attack: 21, defense: 5, speed: 1.03 },
  heavy: { hp: 280, shield: 75, attack: 25, defense: 8, speed: .9 },
  arena: { hp: 220, shield: 90, attack: 22, defense: 6, speed: 1 },
};

const combat = (recordId, role, budget = 'military', extra = {}) => ({ recordId, role, budget, ...extra });
const inspect = (recordId, role, blockedReason) => ({ recordId, role, blockedReason });
const armax = (suffix, budget = 'arena') => combat(`ME3-CHR-ARENA-${suffix}`, 'Équipier du simulateur Armax', budget, {
  editionProfile: 'legendary',
  notes: ['État préparé de test avec le contenu Citadel/Armax présent et ce personnage vivant ; aucun état de campagne n’est importé.'],
  limitations: ['Armax uniquement dans la fiche source ; cette sélection ne crée aucun équipier permanent de ME3.'],
});

const definitions = [
  combat('ME2-NPC-RENEGAR', 'Soldat quarian'),
  combat('ME2-NPC-JEDORE', 'Commandante mercenaire', 'mercenary'),
  combat('ME2-NPC-VASIR', 'Spectre adverse', 'specialist', { editionProfile: 'legendary',
    notes: ['État préparé avec Lair of the Shadow Broker présent ; le duel et ses phases ne sont pas rejoués.'] }),
  armax('GRUNT', 'heavy'), armax('JACK'), armax('JACOB'), armax('KASUMI', 'specialist'),
  armax('MIRANDA'), armax('SAMARA'), armax('ZAEED'),
  combat('ME3-NPC-TARQUIN', 'Officier turien'),
  combat('MEA-NPC-KANDROS', 'Responsable militaire'),
  combat('MEA-NPC-EVFRA', 'Chef de la Résistance'),
  combat('REV-CHR-ANDERSON', 'Officier de l’Alliance'),
  combat('REV-CHR-SAREN', 'Spectre turien', 'specialist'),
  combat('REV-CHR-SKARR', 'Mercenaire krogan', 'heavy', {
    limitations: ['La biotique mentionnée dans la fiche n’est pas simulée ; aucun pouvoir nommé n’en est déduit.'],
  }),
  combat('REV-CHR-JILL', 'Marine de l’Alliance'),
  combat('ASC-CHR-HENDEL', 'Ancien soldat et chef de la sécurité', 'specialist', {
    limitations: ['Les capacités biotiques mentionnées restent documentaires ; aucun pouvoir nommé n’est attribué.'],
  }),
  combat('RET-CHR-KAILENG', 'Assassin de Cerberus', 'specialist'),
  combat('RET-CHR-SANAK', 'Mercenaire', 'mercenary'),
  combat('INI-CHR-YGARA', 'Chef mercenaire', 'mercenary'),
  combat('INI-CHR-ZAHRA', 'Militaire protégeant les survivants'),
  combat('INV-ACT-ARIA', 'Défense d’Omega', 'specialist'),
  combat('INC-ACT-ARIA', 'Combattante face aux Collectors', 'specialist'),
  combat('PL-CHR-ARCHUK', 'Chef de l’attaque mercenaire', 'heavy'),

  inspect('ME2-CHR-KENSON', 'Alliée temporaire d’Arrival',
    'Inspection seulement : l’accompagnement temporaire est attesté, mais cette fiche ne décrit pas son kit de combat ni une fenêtre de contrôle sûre.'),
  inspect('ME2-NPC-JOKER', 'Pilote du Normandy',
    'Inspection seulement : le rôle de pilote ne justifie aucun profil de combattant terrestre.'),
  inspect('ME2-NPC-EDI', 'Intelligence du Normandy',
    'Inspection seulement : cette occurrence ME2 ne reçoit aucun corps ni kit combattant de l’occurrence ME3.'),
  inspect('ME3-NPC-TRAYNOR', 'Spécialiste des communications',
    'Inspection seulement : aucun rôle combattant n’est attesté dans la fiche de communications.'),
  inspect('GAL-CHR-MIRANDA', 'Contact de l’enquête',
    'Inspection seulement : son rôle de contact dans Galaxy ne donne pas le kit jouable de Miranda dans ME2.'),
  inspect('INF-NPC-INALI', 'Interlocutrice de Randall',
    'Inspection seulement : la description d’interlocutrice ne prouve pas un rôle de combattante.'),
  inspect('NEX-CHR-SLOANE', 'Directrice de la sécurité',
    'Inspection seulement : la fonction de direction attestée ne précise pas ici ses actions individuelles de combat.'),
  inspect('NEX-CHR-KESH', 'Surintendante du Nexus',
    'Inspection seulement : le rôle technique de surintendante ne suffit pas à attribuer une attaque.'),
  inspect('INI-CHR-CORA', 'Seconde d’Alec Ryder',
    'Inspection seulement : la mission de récupération est attestée, mais ses actions et son kit dans ce roman ne sont pas relevés ; aucun kit de MEA n’est importé.'),
  inspect('ANN-CHR-ANAX', 'Analyste drell de Blue-7',
    'Inspection seulement : des capacités biotiques ne prouvent pas un armement ni des actions de combat précises.'),
  inspect('ANN-CHR-SENNA', 'Responsable de maintenance Blue-7',
    'Inspection seulement : les responsabilités techniques n’attestent pas un rôle combattant.'),
  inspect('HOM-ACT-LIARA', 'Protagoniste du quatrième récit',
    'Inspection seulement : le rôle d’héroïne ne précise pas son arsenal dans ce segment ; aucun kit adulte d’un autre récit n’est ajouté.'),
  inspect('FOU-ACT-MIRANDA', 'Recherche de Shepard',
    'Inspection seulement : la présence dans Foundations nº5 ne décrit pas un kit combattant ; les autres numéros restent distincts.'),
  inspect('INQ-ACT-BAILEY', 'Protagoniste de l’enquête',
    'Inspection seulement : le rôle d’enquêteur ne suffit pas à attribuer des actions de combat à cette occurrence.'),
  inspect('DIS-ACT-TIRAN', 'Protagoniste de Discovery',
    'Inspection seulement : la fiche du protagoniste ne précise pas ses actions combattantes ; le rôle de Kandros dans MEA n’est pas transféré.'),
];

function compile(definition) {
  const record = getUniverseRecord(definition.recordId);
  const work = record && getUniverseWork(record.mediaId);
  const contextScopes = record?.availability.map(scope => ({ mediaId: scope.mediaId, periodIds: [...scope.periodIds] })) ?? [];
  // Withdrawn or ambiguous documentary evidence closes the entry. In particular,
  // neither a title nor an approximate date opens another anthology segment.
  if (!record?.fact || !['characters', 'npcs'].includes(record.category) || !work || work.locked
    || !record.sourceIds.length || record.sourceIds.some(id => !work.sources.some(source => source.id === id))
    || !contextScopes.some(scope => scope.periodIds.some(periodId => canAccessContent(record.id, { mediaId: scope.mediaId, periodId }).ok))) return null;
  const blocked = typeof definition.blockedReason === 'string';
  return {
    recordId: record.id, mode: 'actor', role: definition.role,
    simulation: blocked ? null : { ...BUDGETS[definition.budget], synthetic: false, primaryAction: 'shoot' },
    notes: [record.description, ...(record.conditions ? [record.conditions] : []),
      ...(definition.notes ?? []),
      'Occurrence liée à cette œuvre et à ses segments documentaires ; aucun recrutement ni rencontre originale n’est accordé.'],
    limitations: [
      ...(blocked ? ['Consultation uniquement : aucune statistique, attaque ou escarmouche disponible.'] : [
        'PV, boucliers, attaque, défense, vitesse et tir générique sont des réglages de test ATB, sans équivalence certifiée avec l’œuvre.',
        'Kit original non reproduit : aucun pouvoir ni modèle d’équipement nommé ; cible et résultat d’essai abstraits, sans conséquence narrative.',
      ]),
      ...(definition.limitations ?? []),
      'Aucun sprite, portrait ou animation fidèle n’est fourni par cette fiche.',
    ],
    constraints: { editionProfile: definition.editionProfile ?? null },
    blockedReason: definition.blockedReason ?? null,
    statsBasis: blocked ? null : 'ATB adaptation', powers: [],
    contextScopes, sourceEntryIds: [record.id], sourceIds: [...record.sourceIds],
    provenance: {
      catalogPath: record.provenance.catalogPath,
      reference: record.reference,
      verification: 'Faits brefs des sources existantes, parfois secondaires ; aucun nouveau contrôle primaire du kit ou de ses statistiques.',
      sources: record.sourceIds.map(id => ({ ...work.sources.find(source => source.id === id) })),
    },
  };
}

export const EXPANSION_CHARACTERS = freeze(definitions.map(compile).filter(Boolean));
