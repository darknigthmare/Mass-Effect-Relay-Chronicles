// The contextual equipment stock is exhausted. These two new study identities
// are powers supporting medical equipment, not new armour sets or costumes.
import { getUniverseRecord, getUniverseWork } from './universe-data.js';

const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const definitions = [
  { recordId: 'ME2-POW-UNITY', parentRecordId: 'ME2-EQP-MEDIGEL', actionId: 'unityMedigel',
    role: 'Secours ME2 — Unité et médi-gel',
    primaryEvidence: { url: 'https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-2-manuals_PC_fr.pdf',
      title: 'Mass Effect 2 — manuel officiel PC français', pdfPage: 14, printedPage: 25,
      sha256: 'c4d5edbe68f36fc261e6efe9e445711ec6214e38b74b61b3c89edc34ef2965e1',
      scope: 'Unité utilise du médi-gel pour ranimer les coéquipiers tombés au combat.' } },
  { recordId: 'ME3-POW-FIRST-AID', parentRecordId: 'ME3-EQP-MEDIGEL', actionId: 'firstAid',
    role: 'Secours ME3 — Premiers secours à distance',
    primaryEvidence: { url: 'https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-3-manuals_PC.pdf',
      title: 'Mass Effect 3 — manuel officiel PC anglais', pdfPage: 26, printedPage: 26,
      sha256: '07ee7dc469e5c6beb85d2050b333647aa29ee9900d83695cfbe28be51726da01',
      scope: 'First Aid relève à distance un équipier tombé et consomme du médi-gel ; le secours de proximité gratuit demeure hors de ce banc.' } },
];

export const EXPANSION3_ARMOR = freeze(definitions.map(definition => {
  const record = getUniverseRecord(definition.recordId), parent = getUniverseRecord(definition.parentRecordId);
  const work = record && getUniverseWork(record.mediaId);
  if (!record?.fact || record.category !== 'powers' || !parent?.fact || parent.category !== 'equipment'
    || parent.mediaId !== record.mediaId || !record.availability.length || !work
    || [...record.sourceIds, ...parent.sourceIds].some(id => !work.sources.some(source => source.id === id)))
    throw new Error(`Unverified medical identity: ${definition.recordId}`);
  return {
    recordId: record.id, mode: 'armor', role: definition.role, identityKind: 'medical-power-study',
    behaviorKind: 'equipment-bench',
    simulation: { hp: 200, shield: 30, attack: 16, defense: 4, speed: 1 },
    bench: { kind: 'medical', parentRecordId: parent.id, actionId: definition.actionId },
    constraints: { editionProfile: null }, blockedReason: null, statsBasis: 'ATB adaptation',
    sourceIds: [...record.sourceIds], sourceEntryIds: [record.id, parent.id], contextScopes: record.availability,
    provenance: record.provenance, primarySourceVerified: true, primaryEvidence: definition.primaryEvidence,
    notes: [record.description, definition.primaryEvidence.scope,
      `Référence primaire : ${definition.primaryEvidence.title}, page PDF ${definition.primaryEvidence.pdfPage}, page imprimée ${definition.primaryEvidence.printedPage}.`,
      'Une vraie commande native dépense une dose du stock partagé du banc et relève deux équipiers abstraits KO.',
      'L’activation, les cibles et les ressources restent isolées ; les deux dossiers de médi-gel du lot 2 conservent leur fermeture historique.'],
    limitations: [
      'Aucune nouvelle armure, tenue, gamme, modèle ou variante cosmétique : ces deux références sont des pouvoirs médicaux.',
      'La source atteste le principe du secours et du médi-gel ; dose unique de groupe, retour à 30 % de santé, bouclier nul et ATB nul sont des réglages de démonstration.',
      'Le banc couvre la réanimation à distance de KO de combat ; soins des alliés conscients, améliorations, capacités de port, recharges originales et animations restent incomplets.',
      'Dans ME3, le secours gratuit de proximité et la santé en cinq segments ne sont pas reproduits.',
      'Les cibles marquées comme mortes dans le récit ou explicitement non relevables sont exclues ; aucun décès de campagne ne peut être changé.',
      'Aucun objet, dose, compétence, récompense, inventaire, recrutement ou état de sauvegarde transféré aux campagnes ou Chroniques.',
      'Aucune fidélité mécanique, numérique, sonore ou visuelle intégrale 1:1 certifiée ; aucun nouvel asset produit.',
    ],
  };
}));
const byId = new Map(EXPANSION3_ARMOR.map(entry => [entry.recordId, entry]));
export function getExpansion3Armor(id) { return typeof id === 'string' ? byId.get(id) || null : null; }
