// Prepared specialist benches, not playable reconstructions of their DLC or
// imported survival/loyalty choices. No campaign state or equipment is granted.
import { normalizeContext, canAccessContent } from './continuity.js';
import { getUniverseRecord, getUniverseWork } from './universe-data.js';

const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const definitions = [
  {
    id: 'me2-dlc-specialists', mediaId: 'ME2', name: 'ME2 — banc des spécialistes DLC',
    actorIds: ['ME2-CHR-SHEPARD', 'ME2-CHR-KASUMI', 'ME2-CHR-ZAEED'],
    sourceEntryIds: ['ME2-CHR-SHEPARD', 'ME2-CHR-KASUMI', 'ME2-CHR-ZAEED', 'ME2-MQ-KASUMI-RECRUIT', 'ME2-MQ-KASUMI-HEIST', 'ME2-MQ-ZAEED-RECRUIT', 'ME2-MQ-ZAEED-LOY'],
    preparedConditions: ['Contenus Stolen Memory et The Price of Revenge présents.', 'Kasumi et Zaeed déjà recrutés, vivants et loyaux dans cet état de test.'],
    description: 'État préparé post-loyauté avec Shepard, Kasumi et Zaeed. Les deux contenus DLC sont supposés présents ; leurs recrutements, loyautés et conditions de survie sont des prérequis de cet état de test.',
  },
  {
    id: 'me2-shadow-broker', mediaId: 'ME2', name: 'ME2 — banc Shadow Broker',
    actorIds: ['ME2-CHR-SHEPARD', 'ME2-CHR-LIARA'],
    sourceEntryIds: ['ME2-CHR-SHEPARD', 'ME2-CHR-LIARA', 'ME2-MQ-SHADOW'],
    preparedConditions: ['Extension Lair of the Shadow Broker présente.', 'Liara disponible dans son rôle temporaire de cette extension.'],
    description: 'État préparé de Lair of the Shadow Broker avec Shepard et Liara. L’extension est supposée présente ; le rôle d’équipière de Liara demeure limité à ce contexte temporaire.',
  },
  {
    id: 'me3-from-ashes', mediaId: 'ME3', name: 'ME3 — banc From Ashes',
    actorIds: ['ME3-CHR-SHEPARD', 'ME3-CHR-JAVIK'],
    sourceEntryIds: ['ME3-CHR-SHEPARD', 'ME3-CHR-JAVIK', 'ME3-MQ-EDEN'],
    preparedConditions: ['Contenu From Ashes présent dans l’édition retenue.', 'Javik déjà recruté et disponible dans cet état de test.'],
    description: 'État préparé de From Ashes avec Shepard et Javik. Le contenu requis est supposé présent et Javik déjà recruté ; la rencontre et son recrutement sur Eden Prime restent à reproduire.',
  },
  {
    id: 'me3-omega', mediaId: 'ME3', name: 'ME3 — banc des spécialistes d’Omega',
    actorIds: ['ME3-CHR-SHEPARD', 'ME3-CHR-ARIA', 'ME3-CHR-NYREEN'],
    sourceEntryIds: ['ME3-CHR-SHEPARD', 'ME3-CHR-ARIA', 'ME3-CHR-NYREEN', 'ME3-MQ-OMEGA'],
    preparedConditions: ['Extension Omega présente.', 'Aria et Nyreen disponibles dans la phase antérieure à la perte de Nyreen.'],
    description: 'État préparé de l’extension Omega avec Shepard, Aria et Nyreen, avant la perte de Nyreen. Les deux équipières restent limitées à leur rôle dans cette extension ; aucun dénouement n’est réécrit.',
  },
  {
    id: 'me3-citadel-wrex', mediaId: 'ME3', name: 'ME3 — banc Citadel avec Wrex',
    actorIds: ['ME3-CHR-SHEPARD', 'ME3-CHR-WREX'],
    sourceEntryIds: ['ME3-CHR-SHEPARD', 'ME3-CHR-WREX'],
    preparedConditions: ['Extension Citadel présente.', 'Wrex vivant et disponible dans l’état de référence.'],
    description: 'État préparé de Citadel avec Shepard et Wrex vivant. La présence du contenu et la survie de Wrex sont des prérequis de cet état de référence ; ce banc n’altère aucune décision ni survie de campagne.',
  },
  {
    id: 'inf-incarceration', mediaId: 'INF', name: 'Infiltrator — banc Incarceration',
    actorIds: ['INF-CHR-TURIAN'],
    sourceEntryIds: ['INF-CHR-TURIAN', 'INF-SIDE-INCARCERATION'],
    preparedConditions: ['Mission bonus Incarceration disponible.', 'Prisonnier turien seul ; Randall ne rejoint pas ce banc.'],
    description: 'État préparé du bonus Incarceration, avec le prisonnier turien seul. Le personnage de Randall et la progression de sa campagne ne sont pas transférés dans ce banc.',
  },
];
const target = (scenarioId, synthetic) => ({
  id: `${scenarioId}:target-${synthetic ? 'synthetic' : 'organic'}`, catalogId: null, abstract: true,
  name: synthetic ? 'Mannequin mécanique — original' : 'Mannequin organique — original',
  hp: 250, maxHp: 250, shield: synthetic ? 35 : 0, maxShield: synthetic ? 35 : 0,
  attack: 5, defense: 3, speed: .65, powers: [], synthetic,
  visualMode: 'prototype-symbol', portrait: null, sprite: null, statsBasis: 'ATB adaptation',
});
const scopeNote = 'Les adversaires sont des mannequins originaux et les armes des dotations abstraites. Aucune mission source n’est rejouée. Les effectifs, statistiques et effets restent adaptés à l’ATB. Ce banc n’accorde ni recrutement, ni loyauté, ni survie, ni récompense à une campagne.';
function compile(definition) {
  const context = normalizeContext({ mediaId: definition.mediaId, periodId: definition.mediaId.toLowerCase() });
  const work = getUniverseWork(definition.mediaId);
  const records = definition.sourceEntryIds.map(getUniverseRecord);
  if (!context || !work || records.some(record => !record || !record.fact || !canAccessContent(record.id, context).ok)) return null;
  const sourceIds = [...new Set(records.flatMap(record => record.sourceIds))];
  if (!sourceIds.length || sourceIds.some(id => !work.sources.some(source => source.id === id))) return null;
  return {
    id: definition.id, context, name: definition.name, label: definition.name, kind: 'specialist-workshop',
    actorIds: [...definition.actorIds], defaultParty: [...definition.actorIds], enemies: [target(definition.id, true), target(definition.id, false)],
    sourceEntryIds: [...definition.sourceEntryIds], sourceIds, allowedEquipmentIds: [],
    preparedConditions: [...definition.preparedConditions], description: `Essai tactique : ${definition.description} ${scopeNote}`,
  };
}
// Withdrawing documentary evidence closes the bench instead of widening its
// context or silently borrowing a similarly named character from another work.
export const SPECIALIST_SCENARIOS = freeze(definitions.map(compile).filter(Boolean));
