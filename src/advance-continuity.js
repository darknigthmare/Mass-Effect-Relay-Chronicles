// A completed ME1 report is documentary evidence, never a future campaign save.
import { normalizeContext } from './continuity.js';
import { decodeCampaignExport } from './completion-persistence-campaign.js';
import { getNarrativeSummary, getVirmireConsequence } from './completion-narrative.js';
import { UNIVERSE_WORKS } from './universe-data.js';
import { CLASSES } from './game-data.js';
import { COMMANDER_APPEARANCES } from './commander.js';
import { getPoliticalEpilogue } from './resolve-endgame.js';
import { listResolveOrigins } from './resolve-origins.js';

const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const PERIODS = { ME2: ['me2-opening', 'me2'], ME3: ['me3-prologue', 'me3'] };

export function canImportChronicleContinuity(rawContext) {
  const context = normalizeContext(rawContext);
  return !!context && !!PERIODS[context.mediaId]?.includes(context.periodId);
}

/** Inspect descriptors before reading a new optional field. Old sessions stay valid. */
export function splitChronicleContinuity(raw) {
  try {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(raw))) return null;
    const descriptors = Object.getOwnPropertyDescriptors(raw);
    if (!own(descriptors, 'importedCampaign')) return { base: raw, importedCampaign: undefined };
    const base = {};
    for (const key of Reflect.ownKeys(descriptors)) {
      const field = descriptors[key];
      if (typeof key !== 'string' || !field.enumerable || !own(field, 'value')) return null;
      if (key !== 'importedCampaign') Object.defineProperty(base, key, field);
    }
    const importedCampaign = decodeCampaignExport(descriptors.importedCampaign.value);
    if (!importedCampaign || !canImportChronicleContinuity(base.context)) return null;
    return { base, importedCampaign };
  } catch { return null; }
}

/** Read-only view of exactly the imported choices and recorded conversations. */
export function getChronicleContinuity(rawContext, rawRecord) {
  const context = normalizeContext(rawContext);
  if (!context || !canImportChronicleContinuity(context)) return null;
  const record = rawRecord === undefined ? null : decodeCampaignExport(rawRecord);
  if (rawRecord !== undefined && !record) return null;
  const opening = context.periodId === 'me2-opening', prologue = context.periodId === 'me3-prologue';
  const ship = opening ? { id: 'normandy-sr1', name: 'Normandy SR-1', text: 'L’ouverture de ME2 concerne encore le SR-1. Les installations du SR-2 ne sont pas celles de ce vaisseau.' }
    : context.mediaId === 'ME2' ? { id: 'normandy-sr2-cerberus', name: 'Normandy SR-2 · Cerberus', text: 'Le SR-2 de ME2 est un autre vaisseau. Le bilan ME1 ne transfère aucun plan, équipement ou local du SR-1.' }
      : { id: 'normandy-sr2-alliance', name: 'Normandy SR-2 · Alliance', text: prologue ? 'Le prologue terrestre ne constitue pas une visite jouable du Normandy. Son réaménagement ME3 ne doit pas devenir un intérieur ME1.' : 'Le réaménagement Alliance appartient à ME3 ; aucun intérieur n’est créé par ce dossier.' };
  const summary = record ? getNarrativeSummary(record.save.state) : null;
  if (record?.ferosReport) {
    const feros = summary.consequences.find(item => item.id === 'feros');
    if (feros) feros.limit = 'Le rapport individuel ci-dessous distingue les seize cibles, leurs méthodes et les décisions concernant Jeong et Shiala. Le score complet de viabilité de la colonie n’est pas simulé.';
  }
  const virmire = record ? getVirmireConsequence(record.save.state) : null;
  const sourceIds = context.mediaId === 'ME2' ? ['ME2-SRC-SAVE', 'ME2-SRC-GUIDE'] : ['ME3-SRC-SQUAD'];
  const sources = (UNIVERSE_WORKS.find(work => work.id === context.mediaId)?.sources || [])
    .filter(source => sourceIds.includes(source.id)).map(source => ({ id: source.id, title: source.title, url: source.url }));
  return { context, imported: !!record, sourceSavedAt: record?.save.savedAt ?? null, ship,
    sources,
    ferosReport: record?.ferosReport ?? null,
    endgameReport: record?.endgameReport ? getPoliticalEpilogue(record.save.state) : null,
    virmireReport: record?.virmireReport ?? null,
    noveriaReport: record?.noveriaReport ?? null,
    originsReport: record?.originsReport ?? null,
    origins: record?.originsReport ? listResolveOrigins(record.save.state) : [],
    citadelReport: record?.citadelReport ?? null,
    identity: record ? { name: record.save.state.name, appearance: record.save.state.appearance,
      appearanceName: COMMANDER_APPEARANCES[record.save.state.appearance]?.name,
      classId: record.save.state.classId, className: CLASSES[record.save.state.classId]?.name, origin: record.save.state.origin,
      psychologicalProfile: record.save.state.psychologicalProfile } : null,
    summary, survivor: virmire ? { ...virmire,
      relation: summary.companions.find(companion => companion.id === virmire.survivor) ?? null,
      futurePresence: 'undetermined',
      limitation: 'Ce bilan établit la survie à Virmire et les échanges ME1. La confiance, les décisions et la présence dans une campagne ME3 restent indéterminées.' } : null,
    scope: opening ? 'Repère de l’attaque du SR-1 · récit consultable, sans mission jouable.'
      : context.mediaId === 'ME2' ? 'Projet Lazare · choix ME1 consultables après le retour de Shepard ; prologue et campagne ME2 non implémentés.'
        : 'Héritage ME1 consultable · événements et relations ME2/ME3 non importés.',
    missing: ['Romances : aucun état de romance n’est défini dans cette campagne condensée.',
      'Wrex : aucun choix de confrontation ou état de survie ultérieur n’est déduit.',
      'Relations : les échanges enregistrés ne constituent pas un score de confiance ME3.',
      'Événements ME2, mission suicide et choix ME3 : aucune valeur fournie.'],
  };
}
