// A work-scoped bestiary for independent ATB study benches. These definitions
// do not reproduce mission encounters, boss phases, original kits or statistics.
import { normalizeContext, canAccessContent } from './continuity.js';
import { getUniverseRecord, getUniverseWork } from './universe-data.js';

const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const definitions = [
  { id: 'ME2-ENM-LOKI', role: 'security-infantry', synthetic: true,
    stats: [130, 15, 13, 3, .8], facts: ['Méca de sécurité.'], missing: ['Comportement et arme du modèle original.'] },
  { id: 'ME2-ENM-FENRIS', role: 'quadruped', synthetic: true,
    stats: [120, 0, 13, 2, 1.15], facts: ['Méca quadrupède.'], missing: ['Déplacements quadrupèdes et attaques de proximité propres au modèle.'] },
  { id: 'ME2-ENM-YMIR', role: 'heavy-mech', synthetic: true,
    stats: [300, 55, 20, 8, .55], facts: ['Méca lourd.'], missing: ['Armement, protections et destruction du modèle original.'] },
  { id: 'ME2-ENM-COLLECTOR-DRONE', role: 'collector-infantry',
    stats: [145, 10, 14, 3, .8], facts: ['Infanterie des Collecteurs.'], missing: ['Armement et comportement d’infanterie des Collecteurs.'] },
  { id: 'ME2-ENM-HARBINGER', role: 'possessed-host',
    stats: [245, 35, 20, 6, .7], facts: ['Harbinger prend le contrôle d’hôtes Collecteurs.'],
    missing: ['Prise et transfert de possession non simulés.', 'Attaques propres de l’hôte possédé non reproduites.'] },
  { id: 'ME2-ENM-PRAETORIAN', role: 'flying-boss', boss: true,
    stats: [390, 65, 22, 9, .5], facts: ['Boss volant des rencontres Collecteurs.'],
    missing: ['Vol et poursuite non simulés.', 'Cycle de barrières et phases de boss non reproduits.'] },
  { id: 'ME3-ENM-ASSAULT', role: 'cerberus-infantry',
    stats: [140, 20, 14, 3, .8], facts: ['Fantassin Cerberus.'], missing: ['Armement, déplacements et tactiques Cerberus du modèle original.'] },
  { id: 'ME3-ENM-HUSK', role: 'transformed-infantry', primaryAction: 'strike',
    stats: [100, 0, 12, 2, 1], facts: ['Infanterie transformée des Moissonneurs.'], missing: ['Course et attaques corporelles propres au Husk.'] },
  { id: 'ME3-ENM-MARAUDER', role: 'reaper-support',
    stats: [150, 25, 14, 4, .8], facts: ['Unité de soutien des Moissonneurs.'], missing: ['Soutien et armement propres au Marauder.'] },
  { id: 'ME3-ENM-BRUTE', role: 'heavy-reaper', primaryAction: 'strike',
    stats: [260, 0, 21, 8, .65], facts: ['Unité lourde des Moissonneurs.'], missing: ['Charges, attaques corporelles et protections propres à la Brute.'] },
  { id: 'ME3-ENM-BANSHEE', role: 'biotic-reaper',
    stats: [270, 35, 20, 6, .7], facts: ['Unité biotique des Moissonneurs.'], missing: ['Pouvoirs biotiques nommés non attribués faute de kit précisément attesté.', 'Déplacement et prises spécifiques non reproduits.'] },
  { id: 'ME3-ENM-KAI', role: 'cerberus-boss', boss: true,
    stats: [450, 70, 22, 8, .9], facts: ['Boss récurrent de Cerberus.'],
    missing: ['Phases de Thessia et du QG de Cerberus non reproduites.', 'Armes, pouvoirs et interventions de rencontre non reconstitués.'] },
  { id: 'MEA-ENM-CHOSEN', role: 'kett-infantry',
    stats: [140, 15, 14, 3, .8], facts: ['Infanterie kett.'], missing: ['Armement et comportement du Chosen original.'] },
  { id: 'MEA-ENM-ASCENDANT', role: 'orb-protected-kett',
    stats: [240, 45, 19, 6, .65], facts: ['Unité kett protégée par un orbe.'],
    missing: ['Orbe, ciblage et cycle de protection non simulés.', 'Attaques et comportement spécifiques non reproduits.'] },
  { id: 'MEA-ENM-CARDINAL', role: 'kett-boss', boss: true,
    stats: [370, 60, 21, 8, .65], facts: ['Boss de l’installation d’exaltation.'],
    missing: ['Rencontre A Trail of Hope II, phases et objectifs non reproduits.', 'Orbe et kit de boss non reconstitués.'] },
  { id: 'MEA-ENM-DESTROYER', role: 'heavy-remnant', synthetic: true,
    stats: [480, 85, 22, 9, .5], facts: ['Machine reliquate lourde.'],
    missing: ['Sous-cibles, armement et comportement propres au Destroyer non reproduits.'] },
];

function compile(definition) {
  const record = getUniverseRecord(definition.id), mediaId = record?.mediaId;
  const context = normalizeContext({ mediaId, periodId: mediaId?.toLowerCase() });
  const work = mediaId && getUniverseWork(mediaId);
  if (!record?.fact || record.category !== 'enemies' || !context || !work
    || !canAccessContent(record.id, context).ok || !record.sourceIds.length
    || record.sourceIds.some(id => !work.sources.some(source => source.id === id))) return null;
  const [hp, shield, attack, defense, speed] = definition.stats;
  return {
    id: record.id, catalogId: record.id, name: record.name, mediaId, context,
    availability: record.availability.map(scope => ({ mediaId: scope.mediaId, periodIds: [...scope.periodIds] })),
    description: record.description, conditions: record.conditions,
    role: definition.role, boss: definition.boss === true, synthetic: definition.synthetic === true,
    primaryAction: definition.primaryAction ?? 'shoot',
    silhouetteFacts: [...definition.facts], powers: [], powerProvenance: [],
    missingMechanics: [...definition.missing],
    sourceEntryIds: [record.id], sourceIds: [...record.sourceIds],
    provenance: {
      catalogPath: record.provenance.catalogPath,
      verification: 'Existing secondary catalogue descriptions; no new primary kit or visual-model verification.',
      sources: record.sourceIds.map(id => ({ ...work.sources.find(source => source.id === id) })),
    },
    tuning: { hp, maxHp: hp, shield, maxShield: shield, attack, defense, speed },
    statsBasis: 'ATB adaptation', visualMode: 'prototype-symbol', portrait: null, sprite: null,
    implementationNote: 'Profil ATB partiel de banc indépendant : actions génériques seulement. Chiffres, protections et cadence adaptés, sans équivalence avec les statistiques d’origine. Phases, pouvoirs non attestés et mécaniques manquantes restent explicitement non reproduits.',
  };
}

// Missing or withdrawn documentary evidence closes a profile instead of opening
// a similarly named enemy from another title, expansion, or multiplayer segment.
export const UNIVERSE_OPPONENTS = freeze(definitions.map(compile).filter(Boolean));
const byId = new Map(UNIVERSE_OPPONENTS.map(profile => [profile.id, profile]));

/** Documentary eligibility never implies that a source mission is playable. */
export function getUniverseOpponent(id, rawContext) {
  try {
    if (typeof id !== 'string') return null;
    const profile = byId.get(id), context = normalizeContext(rawContext);
    return profile && context && profile.context.mediaId === context.mediaId
      && profile.context.periodId === context.periodId && canAccessContent(id, context).ok ? profile : null;
  } catch { return null; }
}

const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const FORBIDDEN = new Set(['__proto__', 'prototype', 'constructor']);
function instanceOptions(raw) {
  if (raw === undefined) return {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(raw))) return null;
  const keys = Reflect.ownKeys(raw);
  if (!keys.length) return {};
  if (keys.length !== 1 || keys[0] !== 'instanceId') return null;
  const descriptor = Object.getOwnPropertyDescriptor(raw, 'instanceId');
  if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')
    || typeof descriptor.value !== 'string' || !ID.test(descriptor.value) || FORBIDDEN.has(descriptor.value)) return null;
  return { instanceId: descriptor.value };
}

/** Fresh native definition; the scenario/composite separately validates a party. */
export function universeOpponentFor(id, rawContext, rawOptions) {
  try {
    const profile = getUniverseOpponent(id, rawContext), options = instanceOptions(rawOptions);
    if (!profile || !options) return null;
    return {
      id: options.instanceId ?? `${profile.id}:prototype`, catalogId: profile.id,
      name: profile.name, mediaId: profile.mediaId,
      ...profile.tuning,
      role: profile.role, boss: profile.boss, synthetic: profile.synthetic,
      primaryAction: profile.primaryAction,
      powers: [], powerProvenance: [], missingMechanics: [...profile.missingMechanics],
      sourceEntryIds: [...profile.sourceEntryIds], sourceIds: [...profile.sourceIds],
      visualMode: 'prototype-symbol', portrait: null, sprite: null,
      statsBasis: 'ATB adaptation', implementationNote: profile.implementationNote,
    };
  } catch { return null; }
}
