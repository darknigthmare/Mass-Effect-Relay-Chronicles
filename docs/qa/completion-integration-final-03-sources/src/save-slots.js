import { decodeSave, encodeSave } from './state.js';
import { CHAPTERS } from './game-data.js';

// Six manual slots are a Relay Chronicles interface choice. These keys are
// deliberately separate from state.js's automatic save key.
export const MANUAL_SAVE_KEY_PREFIX = 'relay-chronicles.manual-save.v1.';
export const MANUAL_SAVE_SLOT_IDS = Object.freeze(['1', '2', '3', '4', '5', '6']);
const FORMAT = 'relay-chronicles.manual-save';
const VERSION = 1;
const OWN = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const failure = (code, reason) => ({ ok: false, code, reason });
const validId = id => typeof id === 'string' && MANUAL_SAVE_SLOT_IDS.includes(id);
const validName = name => typeof name === 'string' && name.trim().length > 0
  && name.trim().length <= 60 && !/[\u0000-\u001f\u007f-\u009f]/u.test(name);

function storageFailure(error, writing = false) {
  let quota = false;
  try { quota = writing && ['QuotaExceededError', 'NS_ERROR_DOM_QUOTA_REACHED'].includes(error?.name); }
  catch { /* Do not let an unusual thrown value escape the storage boundary. */ }
  return quota
    ? failure('storage-full', 'Le stockage est plein. Cet emplacement n’a pas été modifié.')
    : failure('storage-unavailable', 'Le stockage des sauvegardes est indisponible.');
}

function metadataFor(name, save, state) {
  return {
    name, savedAt: save.savedAt, zone: state.zone,
    commanderName: state.name, classId: state.classId, appearance: state.appearance,
  };
}

function parseRecord(raw) {
  if (raw === null) return failure('empty', 'Cet emplacement est vide.');
  try {
    if (typeof raw !== 'string' || raw.length > 2_100_000) throw new Error('Invalid record size');
    const record = JSON.parse(raw);
    if (!record || typeof record !== 'object' || Array.isArray(record)
      || record.format !== FORMAT || record.version !== VERSION || !validName(record.name)) throw new Error('Invalid record');
    const state = decodeSave(record.save);
    if (!state || typeof record.save.savedAt !== 'string'
      || new Date(record.save.savedAt).toISOString() !== record.save.savedAt) throw new Error('Invalid save');
    return { ok: true, state, metadata: metadataFor(record.name.trim(), record.save, state) };
  } catch {
    return failure('corrupt', 'Cette sauvegarde est illisible ou invalide. Elle est conservée tant que vous ne la supprimez ou ne la remplacez pas.');
  }
}

/** List every slot, including corrupted and individually unavailable entries. */
export function listManualSaves(storage) {
  let unavailable = false;
  const slots = MANUAL_SAVE_SLOT_IDS.map(id => {
    try {
      const result = parseRecord(storage.getItem(MANUAL_SAVE_KEY_PREFIX + id));
      return {
        id, status: result.ok ? 'saved' : result.code, metadata: result.ok ? result.metadata : null,
        ...(!result.ok && result.code === 'corrupt' ? { reason: result.reason } : {}),
      };
    } catch {
      unavailable = true;
      return { id, status: 'unavailable', metadata: null };
    }
  });
  return unavailable
    ? { ...failure('storage-unavailable', 'Certains emplacements ne peuvent pas être lus.'), slots }
    : { ok: true, slots };
}

/** Read a fresh, validated state; preview fields come from this same payload. */
export function readManualSave(storage, id) {
  if (!validId(id)) return failure('invalid-id', 'Emplacement de sauvegarde inconnu.');
  try {
    const result = parseRecord(storage.getItem(MANUAL_SAVE_KEY_PREFIX + id));
    return result.ok ? { ...result, id } : result;
  } catch (error) {
    return storageFailure(error);
  }
}

/** Save without replacing existing bytes unless overwrite is explicitly true. */
export function writeManualSave(storage, id, state, options = {}) {
  if (!validId(id)) return failure('invalid-id', 'Emplacement de sauvegarde inconnu.');
  try {
    if (!options || typeof options !== 'object' || Array.isArray(options)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(options))
      || Object.keys(options).some(key => !['name', 'overwrite'].includes(key))) {
      return failure('invalid-options', 'Options de sauvegarde invalides.');
    }
    const descriptors = Object.getOwnPropertyDescriptors(options);
    if (Object.values(descriptors).some(descriptor => !OWN(descriptor, 'value'))) {
      return failure('invalid-options', 'Options de sauvegarde invalides.');
    }
    const overwrite = OWN(descriptors, 'overwrite') ? descriptors.overwrite.value : false;
    const name = OWN(descriptors, 'name') ? descriptors.name.value : undefined;
    if (typeof overwrite !== 'boolean') return failure('invalid-options', 'Le remplacement doit être demandé explicitement.');
    if (name !== undefined && !validName(name)) return failure('invalid-name', 'Le nom doit contenir entre 1 et 60 caractères, sans caractère de contrôle.');

    let validated;
    try { validated = decodeSave(encodeSave(state)); }
    catch { /* Malformed input must never replace an existing record. */ }
    if (!validated) return failure('invalid-save', 'La progression ne peut pas être sauvegardée car elle est invalide.');
    const save = JSON.parse(encodeSave(validated));
    const zoneName = validated.zone === 'normandy' ? 'Normandy SR-1' : CHAPTERS[validated.zone].name;
    const label = name === undefined ? `${zoneName} · ${save.savedAt.slice(0, 16).replace('T', ' ')} UTC` : name.trim();
    const key = MANUAL_SAVE_KEY_PREFIX + id;
    if (storage.getItem(key) !== null && overwrite !== true) {
      return failure('occupied', 'Cet emplacement contient déjà une sauvegarde. Confirmez son remplacement.');
    }
    storage.setItem(key, JSON.stringify({ format: FORMAT, version: VERSION, name: label, save }));
    return { ok: true, id, metadata: metadataFor(label, save, validated) };
  } catch (error) {
    return storageFailure(error, true);
  }
}

/** Deleting a manual slot never touches the automatic save or another slot. */
export function deleteManualSave(storage, id) {
  if (!validId(id)) return failure('invalid-id', 'Emplacement de sauvegarde inconnu.');
  try {
    storage.removeItem(MANUAL_SAVE_KEY_PREFIX + id);
    return { ok: true, id };
  } catch (error) {
    return storageFailure(error);
  }
}
