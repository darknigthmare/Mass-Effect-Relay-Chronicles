import { decodeSave, encodeSave } from './state.js';
import { ferosColonyReport } from './advance-feros.js';
import { endgameReport } from './resolve-endgame.js';
import { virmireReport } from './resolve-virmire.js';
import { noveriaResolutionReport } from './resolve-noveria.js';
import { getResolveOriginsSummary } from './resolve-origins.js';
import { resolveCitadelReport } from './resolve-citadel.js';

// A portable record of the completed condensed ME1 campaign, never an ME2
// playable save. Keep the complete validated snapshot so new narrative fields
// are not silently lost by a second, independently maintained choice schema.
export const CAMPAIGN_EXPORT_FORMAT = 'relay-chronicles.campaign-export';
export const CAMPAIGN_EXPORT_VERSION = 1;
const KEYS = ['format', 'version', 'sourceMediaId', 'sourcePeriodId', 'continuationImplemented', 'save'];
const failed = reason => ({ ok: false, reason });
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function detailedFerosReport(state) {
  const report = ferosColonyReport(state);
  return report.known && report.pending === 0 && report.shiala !== null ? report : null;
}

const REPORTS = {
  ferosReport: detailedFerosReport,
  endgameReport: state => {
    const report = endgameReport(state);
    return report && (report.vigilExchange || report.humanRepresentative !== null) ? report : null;
  },
  virmireReport: state => {
    const report = virmireReport(state);
    return state.completed.includes('virmire') && report.known && report.rescue !== null ? report : null;
  },
  noveriaReport: state => {
    const report = noveriaResolutionReport(state);
    return state.completed.includes('noveria') && report.known ? report : null;
  },
  originsReport: getResolveOriginsSummary,
  citadelReport: state => {
    const report = resolveCitadelReport(state);
    return state.completed.includes('citadel') && report?.known && report.proof ? report : null;
  },
};

// Compare to a report derived from the validated save without reading accessors,
// invoking serializers, accepting extra fields or trusting duplicated counts.
function matchesReport(raw, expected) {
  if (expected === null || typeof expected !== 'object') return raw === expected;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) !== Array.isArray(expected)
    || (Array.isArray(raw) ? Object.getPrototypeOf(raw) !== Array.prototype
      : ![Object.prototype, null].includes(Object.getPrototypeOf(raw)))) return false;
  const fields = Object.getOwnPropertyDescriptors(raw), keys = Reflect.ownKeys(expected);
  return Reflect.ownKeys(fields).length === keys.length && keys.every(key => {
    const field = fields[key];
    return field && own(field, 'value') && field.enumerable === (key !== 'length' || !Array.isArray(expected))
      && matchesReport(field.value, expected[key]);
  });
}

export function createCampaignExport(state) {
  const validated = decodeSave({ format: 'relay-chronicles', version: 1, state });
  if (!validated) return failed('Cette progression ne peut pas être exportée.');
  if (!validated.ending || !validated.completed.includes('citadel-finale'))
    return failed('Terminez la campagne avant de créer son bilan de fin.');
  const reports = Object.fromEntries(Object.entries(REPORTS).map(([key, derive]) => [key, derive(validated)]).filter(([, report]) => report !== null));
  return { ok: true, record: {
    format: CAMPAIGN_EXPORT_FORMAT, version: CAMPAIGN_EXPORT_VERSION,
    sourceMediaId: 'ME1', sourcePeriodId: 'me1', continuationImplemented: false,
    save: JSON.parse(encodeSave(validated)),
    ...reports,
  } };
}

export function encodeCampaignExport(state) {
  const result = createCampaignExport(state);
  return result.ok ? JSON.stringify(result.record, null, 2) : null;
}

/** Fail closed on unknown schemas, contexts, malformed choices or getters. */
export function decodeCampaignExport(raw) {
  try {
    if (typeof raw === 'string' && raw.length > 2_100_000) return null;
    const record = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!record || typeof record !== 'object' || Array.isArray(record)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(record))) return null;
    const descriptors = Object.getOwnPropertyDescriptors(record);
    const fields = [...KEYS, ...Object.keys(REPORTS).filter(key => own(descriptors, key))];
    if (Reflect.ownKeys(descriptors).length !== fields.length || !fields.every(key => {
      const descriptor = descriptors[key];
      return descriptor?.enumerable && Object.hasOwn(descriptor, 'value');
    })) return null;
    if (record.format !== CAMPAIGN_EXPORT_FORMAT || record.version !== CAMPAIGN_EXPORT_VERSION
      || record.sourceMediaId !== 'ME1' || record.sourcePeriodId !== 'me1'
      || record.continuationImplemented !== false) return null;
    const state = decodeSave(record.save);
    if (!state || !state.ending || !state.completed.includes('citadel-finale')) return null;
    for (const [key, derive] of Object.entries(REPORTS)) {
      if (!own(descriptors, key)) continue;
      const expected = derive(state);
      if (!expected || !matchesReport(descriptors[key].value, expected)) return null;
    }
    const savedAt = Object.getOwnPropertyDescriptor(record.save, 'savedAt')?.value;
    if (typeof savedAt !== 'string' || new Date(savedAt).toISOString() !== savedAt) return null;
    // Reconstruct, rather than hand the caller any reference to external data.
    const result = createCampaignExport(state);
    // A legacy absent report remains unknown; no retrospective detail is added.
    for (const key of Object.keys(REPORTS)) if (!own(descriptors, key)) delete result.record[key];
    result.record.save.savedAt = savedAt;
    return result.record;
  } catch { return null; }
}
