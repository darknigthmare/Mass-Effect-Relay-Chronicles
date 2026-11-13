import { decodeSave, encodeSave } from './state.js';

// A portable record of the completed condensed ME1 campaign, never an ME2
// playable save. Keep the complete validated snapshot so new narrative fields
// are not silently lost by a second, independently maintained choice schema.
export const CAMPAIGN_EXPORT_FORMAT = 'relay-chronicles.campaign-export';
export const CAMPAIGN_EXPORT_VERSION = 1;
const KEYS = ['format', 'version', 'sourceMediaId', 'sourcePeriodId', 'continuationImplemented', 'save'];
const failed = reason => ({ ok: false, reason });

export function createCampaignExport(state) {
  const validated = decodeSave({ format: 'relay-chronicles', version: 1, state });
  if (!validated) return failed('Cette progression ne peut pas être exportée.');
  if (!validated.ending || !validated.completed.includes('citadel-finale'))
    return failed('Terminez la campagne avant de créer son bilan de fin.');
  return { ok: true, record: {
    format: CAMPAIGN_EXPORT_FORMAT, version: CAMPAIGN_EXPORT_VERSION,
    sourceMediaId: 'ME1', sourcePeriodId: 'me1', continuationImplemented: false,
    save: JSON.parse(encodeSave(validated)),
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
    if (Reflect.ownKeys(descriptors).length !== KEYS.length || !KEYS.every(key => {
      const descriptor = descriptors[key];
      return descriptor?.enumerable && Object.hasOwn(descriptor, 'value');
    })) return null;
    if (record.format !== CAMPAIGN_EXPORT_FORMAT || record.version !== CAMPAIGN_EXPORT_VERSION
      || record.sourceMediaId !== 'ME1' || record.sourcePeriodId !== 'me1'
      || record.continuationImplemented !== false) return null;
    const state = decodeSave(record.save);
    if (!state || !state.ending || !state.completed.includes('citadel-finale')) return null;
    const savedAt = Object.getOwnPropertyDescriptor(record.save, 'savedAt')?.value;
    if (typeof savedAt !== 'string' || new Date(savedAt).toISOString() !== savedAt) return null;
    // Reconstruct, rather than hand the caller any reference to external data.
    const result = createCampaignExport(state);
    result.record.save.savedAt = savedAt;
    return result.record;
  } catch { return null; }
}
