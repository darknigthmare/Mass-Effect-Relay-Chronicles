// Bestiary benches use documented work/period identities, never a claim that
// this selected party met these enemies in one original mission. No campaign
// state, recruitment, loyalty or source-model equipment is granted here.
import { getUniverseRecord, getUniverseWork } from './universe-data.js';
import { canAccessContent, normalizeContext } from './continuity.js';
import { universeOpponentFor } from './universe-opponents.js';

const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const rosters = {
  ME2: ['ME2-CHR-SHEPARD', 'ME2-CHR-MIRANDA', 'ME2-CHR-JACOB', 'ME2-CHR-MORDIN',
    'ME2-CHR-GARRUS', 'ME2-CHR-GRUNT', 'ME2-CHR-JACK', 'ME2-CHR-TALI', 'ME2-CHR-THANE',
    'ME2-CHR-SAMARA', 'ME2-CHR-LEGION', 'ME2-CHR-MORINTH'],
  ME3: ['ME3-CHR-SHEPARD', 'ME3-CHR-LIARA', 'ME3-CHR-JAMES', 'ME3-CHR-GARRUS',
    'ME3-CHR-EDI', 'ME3-CHR-TALI', 'ME3-CHR-ASHLEY', 'ME3-CHR-KAIDAN'],
  MEA: ['MEA-CHR-RYDER', 'MEA-CHR-CORA', 'MEA-CHR-LIAM', 'MEA-CHR-VETRA',
    'MEA-CHR-JAAL', 'MEA-CHR-DRACK', 'MEA-CHR-PEEBEE'],
};
const alternatives = {
  ME2: [['ME2-CHR-SAMARA', 'ME2-CHR-MORINTH']],
  ME3: [['ME3-CHR-ASHLEY', 'ME3-CHR-KAIDAN']], MEA: [],
};
const definitions = [
  { id: 'me2-security-opposition', mediaId: 'ME2', name: 'ME2 — banc des mécas de sécurité',
    opponentIds: ['ME2-ENM-LOKI', 'ME2-ENM-FENRIS', 'ME2-ENM-YMIR'],
    defaultParty: ['ME2-CHR-SHEPARD', 'ME2-CHR-MIRANDA', 'ME2-CHR-TALI'] },
  { id: 'me2-collector-opposition', mediaId: 'ME2', name: 'ME2 — banc des Récolteurs',
    opponentIds: ['ME2-ENM-COLLECTOR-DRONE', 'ME2-ENM-HARBINGER', 'ME2-ENM-PRAETORIAN'],
    defaultParty: ['ME2-CHR-SHEPARD', 'ME2-CHR-MIRANDA', 'ME2-CHR-JACOB'] },
  { id: 'me3-cerberus-opposition', mediaId: 'ME3', name: 'ME3 — banc de Cerberus et Kai Leng',
    opponentIds: ['ME3-ENM-ASSAULT', 'ME3-ENM-KAI'],
    defaultParty: ['ME3-CHR-SHEPARD', 'ME3-CHR-LIARA', 'ME3-CHR-GARRUS'] },
  { id: 'me3-reaper-opposition', mediaId: 'ME3', name: 'ME3 — banc des forces moissonneuses',
    opponentIds: ['ME3-ENM-HUSK', 'ME3-ENM-MARAUDER', 'ME3-ENM-BRUTE', 'ME3-ENM-BANSHEE'],
    defaultParty: ['ME3-CHR-SHEPARD', 'ME3-CHR-LIARA', 'ME3-CHR-JAMES'] },
  { id: 'mea-kett-opposition', mediaId: 'MEA', name: 'Andromeda — banc des kett et du Cardinal',
    opponentIds: ['MEA-ENM-CHOSEN', 'MEA-ENM-ASCENDANT', 'MEA-ENM-CARDINAL'],
    defaultParty: ['MEA-CHR-RYDER', 'MEA-CHR-CORA', 'MEA-CHR-DRACK'] },
  { id: 'mea-remnant-opposition', mediaId: 'MEA', name: 'Andromeda — banc du Destructeur reliquat',
    opponentIds: ['MEA-ENM-DESTROYER'],
    defaultParty: ['MEA-CHR-RYDER', 'MEA-CHR-VETRA', 'MEA-CHR-JAAL'] },
];
const scopeNote = 'Banc d’étude indépendant : ces identités sont attestées dans cette œuvre et cette période, sans attribution de cette équipe à une rencontre précise. Les compagnons sont préparés comme recrutés et survivants dans cet état de test ; aucun pouvoir de loyauté supplémentaire n’est débloqué. Les armes du groupe restent des dotations abstraites. Statistiques, effectifs et rythme sont adaptés à l’ATB ; les phases, pouvoirs propres, déplacements et interactions de décor manquants restent signalés dans les profils. Aucune mission intégrale ni fidélité 1:1 n’est revendiquée ; aucune récompense, survie ou décision de campagne n’est accordée.';

function compile(definition) {
  const context = normalizeContext({ mediaId: definition.mediaId, periodId: definition.mediaId.toLowerCase() });
  const work = getUniverseWork(definition.mediaId), actorIds = rosters[definition.mediaId];
  if (!context || !work || !actorIds) return null;
  const sourceEntryIds = [...actorIds, ...definition.opponentIds];
  const records = sourceEntryIds.map(getUniverseRecord);
  if (records.some(record => !record?.fact || !canAccessContent(record.id, context).ok)) return null;
  const sourceIds = [...new Set(records.flatMap(record => record.sourceIds))];
  if (!sourceIds.length || sourceIds.some(id => !work.sources.some(source => source.id === id))) return null;
  const enemies = definition.opponentIds.map((id, index) => universeOpponentFor(id, context, { instanceId: `${definition.id}:opponent-${index}` }));
  if (enemies.some(enemy => !enemy)) return null;
  const opponentLimitations = enemies.map(enemy => ({ catalogId: enemy.catalogId, name: enemy.name, missingMechanics: [...enemy.missingMechanics] }));
  const limitationsText = opponentLimitations.map(enemy => `${enemy.name} : ${enemy.missingMechanics.join(' ')}`).join(' ');
  return { id: definition.id, context, name: definition.name, label: definition.name, kind: 'opposition-workshop',
    actorIds: [...actorIds], defaultParty: [...definition.defaultParty],
    exclusiveActorGroups: alternatives[definition.mediaId].map(group => [...group]),
    opponentIds: [...definition.opponentIds], opponentLimitations, enemies, sourceEntryIds, sourceIds, allowedEquipmentIds: [],
    preparedConditions: ['Présence des personnages limitée à l’œuvre et à la période du banc.',
      'Compagnons déjà recrutés et vivants dans cet état de test ; alternatives exclusives conservées.',
      'Aucune mission source rejouée, aucun modèle d’arme personnel attribué.'],
    description: `Essai tactique : ${scopeNote} Limites de cet essai : ${limitationsText}` };
}

// Withdrawing a source or its period closes the whole bench. It never widens
// availability, borrows a namesake actor or replaces a missing enemy by a prop.
export const OPPOSITION_SCENARIOS = freeze(definitions.map(compile).filter(Boolean));
