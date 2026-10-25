// Provenance is attached to a work and an explicit segment, never inferred from
// an approximate universal timeline. Chronicle selections are separate from the
// ME1 campaign inventory; gameplay validation belongs to chronicles.js.
import { MEDIA_PERIODS, getMediaPeriod, evaluateContinuity } from './continuity-data.js';
import { UNIVERSE_RECORDS, UNIVERSE_GROUPS, getUniverseRecord } from './universe-data.js';

export const CAMPAIGN_CONTEXT = Object.freeze({ mediaId: 'ME1', periodId: 'me1', galaxy: 'milky-way' });
const OWN = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const FORBIDDEN = new Set(['__proto__', 'prototype', 'constructor']);
const SESSION_KEYS = ['version', 'context', 'scenarioId', 'discovered', 'notes', 'party', 'loadouts', 'cleared'];
const OPTIONAL_SESSION_KEYS = ['builds', 'readingProgress', 'ammoModes'];
const EQUIPMENT_SLOTS = ['weapon', 'armor', 'weaponMod', 'weaponMod2'];
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const isId = value => typeof value === 'string' && ID.test(value) && !FORBIDDEN.has(value);
const fail = reason => ({ ok: false, reason });
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const exact = (value, keys) => plain(value) && Reflect.ownKeys(value).length === keys.length && keys.every(key => OWN(value, key));

function safeTree(value, depth = 0, seen = new WeakSet()) {
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'string') return value.length <= 10000;
  if (typeof value === 'number') return Number.isFinite(value);
  if (depth > 8 || !value || typeof value !== 'object' || seen.has(value)) return false;
  const array = Array.isArray(value);
  if (array ? Object.getPrototypeOf(value) !== Array.prototype : !plain(value)) return false;
  const keys = Reflect.ownKeys(value);
  if (keys.length > 2001) return false;
  if (array && (value.length > 2000 || keys.length !== value.length + 1
    || keys.some((key, index) => key !== (index === value.length ? 'length' : String(index))))) return false;
  seen.add(value);
  for (const key of keys) {
    if (array && key === 'length') continue;
    if (typeof key !== 'string' || FORBIDDEN.has(key)) return false;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor.enumerable || !OWN(descriptor, 'value') || !safeTree(descriptor.value, depth + 1, seen)) return false;
  }
  seen.delete(value);
  return true;
}
const uniqueIds = (values, limit) => Array.isArray(values) && values.length <= limit
  && values.every(isId) && new Set(values).size === values.length;

/** Only registered works/segments are valid; years and caller-defined scopes fail. */
export function normalizeContext(raw) {
  try {
    if (!safeTree(raw) || !(exact(raw, ['mediaId', 'periodId']) || exact(raw, ['mediaId', 'periodId', 'galaxy']))
      || !isId(raw.mediaId) || !isId(raw.periodId)) return null;
    const media = getMediaPeriod(raw.mediaId);
    if (!media || media.locked || !Array.isArray(media.periods) || !media.periods.some(period => period.id === raw.periodId)
      || !['milky-way', 'andromeda', 'unknown'].includes(media.galaxy) || OWN(raw, 'galaxy') && raw.galaxy !== media.galaxy) return null;
    return { mediaId: media.id, periodId: raw.periodId, galaxy: media.galaxy };
  } catch { return null; }
}

/** Campaign saves always remain ME1, regardless of caller-supplied epoch fields. */
export function getCurrentContext() { return { ...CAMPAIGN_CONTEXT }; }

export function isCampaignContext(raw) {
  const context = normalizeContext(raw);
  return !!context && Object.keys(CAMPAIGN_CONTEXT).every(key => context[key] === CAMPAIGN_CONTEXT[key]);
}

function canonicalRecord(input) {
  try {
    if (typeof input === 'string') return isId(input) ? getUniverseRecord(input) : null;
    if (!plain(input)) return null;
    const descriptor = Object.getOwnPropertyDescriptor(input, 'id');
    return descriptor && OWN(descriptor, 'value') && isId(descriptor.value) ? getUniverseRecord(descriptor.value) : null;
  } catch { return null; }
}

/** Returns documentary eligibility, not a claim that the record has playable code. */
export function canAccessContent(input, rawContext) {
  try {
    const context = normalizeContext(rawContext);
    if (!context) return fail('Œuvre ou segment indisponible.');
    const record = canonicalRecord(input);
    if (!record) return fail('Fiche inconnue.');
    if (!evaluateContinuity(record, context))
      return fail('Cette fiche n’est pas attestée dans ce segment de cette œuvre.');
    return { ok: true, reason: null };
  } catch { return fail('Fiche ou contexte invalide.'); }
}

const searchable = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
/** Returned records keep their documentary status and never enter ME1's roster. */
export function listAvailable(rawContext, { group = 'all', query = '' } = {}) {
  try {
    const context = normalizeContext(rawContext);
    if (!context || typeof query !== 'string' || query.length > 300 || !['all', 'actors', 'equipment', 'powers', 'story'].includes(group)) return [];
    const records = group === 'all' ? UNIVERSE_RECORDS : UNIVERSE_GROUPS[group];
    if (!Array.isArray(records)) return [];
    const term = searchable(query.trim());
    return records.filter(record => canAccessContent(record.id, context).ok && (!term
      || searchable([record.id, record.name, record.description, record.reference].join(' ')).includes(term)));
  } catch { return []; }
}

export function createChronicleSession(rawContext) {
  const context = normalizeContext(rawContext);
  return context ? { version: 1, context, scenarioId: null, discovered: [], notes: {}, party: [], loadouts: {}, builds: {}, readingProgress: {}, ammoModes: {}, cleared: [] } : null;
}

/** Pure base validator. chronicles.js additionally checks scenarios, actors and gear. */
export function normalizeChronicleSession(raw) {
  try {
    if (!safeTree(raw) || !plain(raw) || !SESSION_KEYS.every(key => OWN(raw, key))
      || Reflect.ownKeys(raw).some(key => ![...SESSION_KEYS, ...OPTIONAL_SESSION_KEYS].includes(key)) || raw.version !== 1) return null;
    const context = normalizeContext(raw.context);
    if (!context || raw.scenarioId !== null && !isId(raw.scenarioId)
      || !uniqueIds(raw.discovered, 2000) || !uniqueIds(raw.party, 3) || !uniqueIds(raw.cleared, 1000)
      || !plain(raw.notes) || !plain(raw.loadouts)) return null;
    if (!raw.discovered.every(id => canAccessContent(id, context).ok)) return null;
    const notes = {};
    if (Object.keys(raw.notes).length > 500) return null;
    for (const [id, note] of Object.entries(raw.notes)) {
      if (!raw.discovered.includes(id) || typeof note !== 'string' || note.length > 2000) return null;
      notes[id] = note;
    }
    const loadouts = {};
    if (Object.keys(raw.loadouts).length > raw.party.length) return null;
    for (const [actorId, loadout] of Object.entries(raw.loadouts)) {
      if (!raw.party.includes(actorId) || !(exact(loadout, ['weapon', 'armor']) || exact(loadout, EQUIPMENT_SLOTS))
        || !EQUIPMENT_SLOTS.every(slot => !OWN(loadout, slot) || loadout[slot] === null || isId(loadout[slot]))) return null;
      loadouts[actorId] = Object.fromEntries(EQUIPMENT_SLOTS.map(slot => [slot, loadout[slot] ?? null]));
    }
    const rawBuilds = OWN(raw, 'builds') ? raw.builds : {};
    if (!plain(rawBuilds) || Object.keys(rawBuilds).length > raw.party.length
      || Object.entries(rawBuilds).some(([actorId, buildId]) => !raw.party.includes(actorId) || !isId(buildId))) return null;
    const builds = Object.fromEntries(raw.party.map(actorId => [actorId, rawBuilds[actorId] ?? 'default']));
    const rawAmmoModes = OWN(raw, 'ammoModes') ? raw.ammoModes : Object.fromEntries(raw.party.map(actorId => [actorId, null]));
    if (!plain(rawAmmoModes) || Object.keys(rawAmmoModes).length !== raw.party.length
      || Object.entries(rawAmmoModes).some(([actorId, modeId]) => !raw.party.includes(actorId)
        || modeId !== null && (!isId(modeId) || !canAccessContent(modeId, context).ok))) return null;
    const ammoModes = Object.fromEntries(raw.party.map(actorId => [actorId, rawAmmoModes[actorId]]));
    const rawProgress = OWN(raw, 'readingProgress') ? raw.readingProgress : {};
    if (!plain(rawProgress) || Object.keys(rawProgress).length > 500
      || Object.entries(rawProgress).some(([storyId, index]) => !isId(storyId) || !Number.isInteger(index) || index < 0 || index > 999)) return null;
    return { version: 1, context, scenarioId: raw.scenarioId, discovered: [...raw.discovered], notes,
      party: [...raw.party], loadouts, builds, readingProgress: { ...rawProgress }, ammoModes, cleared: [...raw.cleared] };
  } catch { return null; }
}

/** Discovery/notes are transactional and require a currently valid base session. */
export function discoverContent(session, input) {
  const normalized = normalizeChronicleSession(session), record = canonicalRecord(input);
  if (!normalized || !record) return fail('Session ou fiche invalide.');
  const access = canAccessContent(record.id, normalized.context);
  if (!access.ok) return access;
  if (!normalized.discovered.includes(record.id)) normalized.discovered.push(record.id);
  if (normalized.discovered.length > 2000) return fail('Limite de découvertes atteinte.');
  session.discovered = normalized.discovered;
  return { ok: true, reason: null };
}
export function setChronicleNote(session, input, note) {
  const normalized = normalizeChronicleSession(session), record = canonicalRecord(input);
  if (!normalized || !record || typeof note !== 'string' || note.length > 2000) return fail('Note ou session invalide.');
  const access = canAccessContent(record.id, normalized.context);
  if (!access.ok) return access;
  const text = note.trim();
  if (text) {
    normalized.notes[record.id] = text;
    if (!normalized.discovered.includes(record.id)) normalized.discovered.push(record.id);
  } else delete normalized.notes[record.id];
  if (normalized.discovered.length > 2000 || Object.keys(normalized.notes).length > 500) return fail('Limite de notes atteinte.');
  session.discovered = normalized.discovered; session.notes = normalized.notes;
  return { ok: true, reason: null };
}

// Read-only metadata for callers listing unavailable works and their stated reasons.
export function listMediaPeriods() { return MEDIA_PERIODS; }
