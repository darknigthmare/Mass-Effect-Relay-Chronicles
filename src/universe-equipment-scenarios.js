// Edition-specific equipment belongs to separate prepared benches. This module
// does not import actors/equipment, grant ownership or change legacy rosters.
import { getUniverseRecord, getUniverseWork } from './universe-data.js';
import { canAccessContent, normalizeContext } from './continuity.js';

const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const definitions = [
  { id: 'me2-legendary-equipment-workshop', mediaId: 'ME2', editionEquipmentProfile: 'legendary',
    name: 'ME2 — atelier des équipements Legendary Edition',
    additionalEquipmentIds: ['ME2-EQP-KESTREL', 'ME2-EQP-CERBERUS', 'ME2-EQP-COLLECTOR', 'ME2-EQP-TERMINUS', 'ME2-EQP-BLOOD-DRAGON', 'ME2-EQP-INFERNO'],
    contentCondition: 'Legendary Edition de ME2 et contenus d’équipement correspondants supposés présents dans cet état de test.' },
  { id: 'me3-legendary-equipment-workshop', mediaId: 'ME3', editionEquipmentProfile: 'legendary',
    name: 'ME3 — atelier des équipements Legendary Edition',
    additionalEquipmentIds: ['ME3-EQP-AJAX', 'ME3-EQP-INFERNO', 'ME3-EQP-BLOOD-DRAGON', 'ME3-EQP-COLLECTOR', 'ME3-EQP-TERMINUS', 'ME3-EQP-CERBERUS', 'ME3-WPN-PARTICLE', 'ME3-WPN-LANCER'],
    contentCondition: 'Legendary Edition de ME3, From Ashes, Citadel et contenus d’équipement correspondants supposés présents dans cet état de test.' },
  { id: 'mea-deluxe-equipment-workshop', mediaId: 'MEA', editionEquipmentProfile: 'deluxe',
    name: 'Andromeda — atelier des équipements Deluxe',
    additionalEquipmentIds: ['MEA-EQP-SCAVENGER', 'MEA-EQP-DEEP-SPACE'],
    contentCondition: 'Édition ou droits Deluxe et bonus d’équipement Andromeda correspondants supposés présents dans cet état de test.' },
];

/** Called after the three historical workshops exist, so all base selections
 * and actor alternatives are copied without importing or mutating their owner. */
export function createEditionEquipmentScenarios(historicalScenarios) {
  if (!Array.isArray(historicalScenarios)) return freeze([]);
  return freeze(definitions.map(definition => {
    const base = historicalScenarios.find(scene => scene.id === `${definition.mediaId.toLowerCase()}-equipment-workshop`);
    const context = normalizeContext(base?.context), work = getUniverseWork(definition.mediaId);
    if (!base || !context || context.mediaId !== definition.mediaId || !work) return null;
    const allowedEquipmentIds = [...new Set([...base.allowedEquipmentIds, ...definition.additionalEquipmentIds])];
    const sourceEntryIds = [...base.actorIds, ...allowedEquipmentIds], records = sourceEntryIds.map(getUniverseRecord);
    if (records.some(record => !record?.fact || !canAccessContent(record.id, context).ok)) return null;
    const sourceIds = [...new Set(records.flatMap(record => record.sourceIds))];
    if (!sourceIds.length || sourceIds.some(id => !work.sources.some(source => source.id === id))) return null;
    return { id: definition.id, context, name: definition.name, label: definition.name,
      kind: 'equipment-workshop', editionEquipmentProfile: definition.editionEquipmentProfile,
      actorIds: [...base.actorIds], defaultParty: [...base.defaultParty],
      exclusiveActorGroups: (base.exclusiveActorGroups || []).map(group => [...group]),
      enemies: base.enemies.map((enemy, index) => ({ ...enemy, id: `${definition.id}:target-${index}`, powers: [...enemy.powers] })),
      allowedEquipmentIds, additionalEquipmentIds: [...definition.additionalEquipmentIds], sourceEntryIds, sourceIds,
      preparedConditions: [definition.contentCondition,
        'Équipements déjà disponibles pour la préparation ; achats, contenu possédé, acquisition et rangs d’origine non simulés.',
        'Mêmes personnages et alternatives que l’atelier de base ; aucune loyauté supplémentaire débloquée.'],
      description: `Essai tactique : banc de production indépendant avec profil d’équipement d’édition explicite. ${definition.contentCondition} Les pièces sont préparées disponibles, sans reproduire leur acquisition, leurs achats ou leurs rangs d’origine. Les armures personnelles restent réservées au protagoniste autorisé. Les cibles sont des mannequins originaux ; aucune mission, campagne ou rencontre canonique n’est rejouée. Les effectifs et effets sont des réglages ATB, sans fidélité 1:1 revendiquée. Ce banc n’accorde ni recrutement, ni loyauté, ni équipement ou récompense à une campagne.` };
  }).filter(Boolean));
}
