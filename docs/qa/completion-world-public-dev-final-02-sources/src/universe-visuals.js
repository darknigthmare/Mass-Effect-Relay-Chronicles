// Fixed, partial visual overlays. Documentary access never grants a combat
// profile, equipment effect, recruitment, animation or a campaign appearance.
import { ARSENAL_VISUAL_DATA } from './arsenal-visual-data.js';
import { normalizeContext, canAccessContent } from './continuity.js';
import { canUseUniverseActor, getUniverseScenario } from './universe-actors.js';
import { getUniverseRecord } from './universe-data.js';

const OWN = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const KEYS = ['id', 'recordIds', 'mediaId', 'periodIds', 'category', 'src', 'atlasWidth', 'atlasHeight',
  'sourceRect', 'sha256', 'partial', 'caption', 'sourceBasis', 'primaryVisualVerified'];
const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);
const isId = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(value) && !FORBIDDEN.has(value);
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const EMPTY = Object.freeze([]);
const INVALID = Symbol('invalid-visual-data');

function dataArray(value, maximum) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) return false;
  const length = Object.getOwnPropertyDescriptor(value, 'length');
  if (!length || !OWN(length, 'value') || !Number.isSafeInteger(length.value) || length.value > maximum) return false;
  const keys = Reflect.ownKeys(value);
  return keys.length === length.value + 1 && keys.every((key, index) => {
    if (index === length.value) return key === 'length';
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return key === String(index) && descriptor.enumerable && OWN(descriptor, 'value');
  });
}

function snapshotTree(value, depth = 0, seen = new WeakSet()) {
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : INVALID;
  if (typeof value === 'string') return value.length <= 10000 ? value : INVALID;
  if (!value || typeof value !== 'object' || depth > 6 || seen.has(value)) return INVALID;
  const array = Array.isArray(value);
  if (array ? !dataArray(value, 128) : !plain(value)) return INVALID;
  const keys = Reflect.ownKeys(value);
  if (keys.length > 128) return INVALID;
  seen.add(value);
  const result = array ? [] : {};
  for (const key of keys) {
    if (array && key === 'length') continue;
    if (typeof key !== 'string' || FORBIDDEN.has(key)) return INVALID;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor.enumerable || !OWN(descriptor, 'value')) return INVALID;
    const snapshot = snapshotTree(descriptor.value, depth + 1, seen);
    if (snapshot === INVALID) return INVALID;
    result[key] = snapshot;
  }
  seen.delete(value);
  return result;
}

function detachedFrozen(value) {
  if (!value || typeof value !== 'object') return value;
  const result = Array.isArray(value) ? value.map(detachedFrozen)
    : Object.fromEntries(Object.entries(value).map(([key, item]) => [key, detachedFrozen(item)]));
  return Object.freeze(result);
}

function normalizeVisual(raw) {
  try {
    raw = snapshotTree(raw);
    if (raw === INVALID || !plain(raw) || Reflect.ownKeys(raw).length !== KEYS.length || !KEYS.every(key => OWN(raw, key))) return null;
    const ids = list => dataArray(list, 64) && list.length > 0 && list.every(isId) && new Set(list).size === list.length;
    if (!isId(raw.id) || !ids(raw.recordIds) || !raw.recordIds.every(id => getUniverseRecord(id))
      || !isId(raw.mediaId) || !ids(raw.periodIds) || !raw.periodIds.every(periodId => normalizeContext({ mediaId: raw.mediaId, periodId }))
      || !isId(raw.category) || typeof raw.src !== 'string' || !/^\.\/assets\/[A-Za-z0-9][A-Za-z0-9._/-]*\.png$/.test(raw.src)
      || raw.src.slice('./assets/'.length).split('/').some(segment => !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(segment))
      || ![raw.atlasWidth, raw.atlasHeight].every(value => Number.isSafeInteger(value) && value > 0 && value <= 16384)
      || !dataArray(raw.sourceRect, 4) || raw.sourceRect.length !== 4 || !raw.sourceRect.every(Number.isSafeInteger)
      || raw.sourceRect[0] < 0 || raw.sourceRect[1] < 0 || raw.sourceRect[2] <= 0 || raw.sourceRect[3] <= 0
      || raw.sourceRect[0] + raw.sourceRect[2] > raw.atlasWidth || raw.sourceRect[1] + raw.sourceRect[3] > raw.atlasHeight
      || typeof raw.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(raw.sha256)
      || raw.partial !== true || raw.primaryVisualVerified !== false
      || typeof raw.caption !== 'string' || !raw.caption.trim() || raw.caption.length > 2000
      || !(typeof raw.sourceBasis === 'string' ? raw.sourceBasis.trim().length > 0
        : raw.sourceBasis && typeof raw.sourceBasis === 'object' && Object.keys(raw.sourceBasis).length > 0)) return null;
    return detachedFrozen(raw);
  } catch { return null; }
}

function readVisuals(data) {
  try {
    if (!dataArray(data, 1024)) return EMPTY;
    const rows = [], counts = new Map(), length = Object.getOwnPropertyDescriptor(data, 'length').value;
    for (let index = 0; index < length; index++) {
      const row = normalizeVisual(Object.getOwnPropertyDescriptor(data, String(index)).value);
      if (row) rows.push(row);
    }
    for (const row of rows) counts.set(row.id, (counts.get(row.id) || 0) + 1);
    // Duplicate visual identities are configuration ambiguity, not precedence.
    return Object.freeze(rows.filter(row => counts.get(row.id) === 1));
  } catch { return EMPTY; }
}
const VISUALS = readVisuals(ARSENAL_VISUAL_DATA);

function readOptions(raw) {
  try {
    if (!plain(raw)) return null;
    const result = { usage: 'reference', scenarioId: undefined };
    for (const key of Reflect.ownKeys(raw)) {
      if (!['usage', 'scenarioId'].includes(key)) return null;
      const descriptor = Object.getOwnPropertyDescriptor(raw, key);
      if (!descriptor.enumerable || !OWN(descriptor, 'value')) return null;
      if (descriptor.value !== undefined) result[key] = descriptor.value;
    }
    return ['reference', 'party', 'combat'].includes(result.usage)
      && (result.scenarioId === undefined || isId(result.scenarioId)) ? result : null;
  } catch { return null; }
}

function resolveVisual(recordId, context) {
  if (!isId(recordId) || !canAccessContent(recordId, context).ok) return null;
  const matches = VISUALS.filter(row => row.mediaId === context.mediaId && row.periodIds.includes(context.periodId)
    && row.recordIds.includes(recordId));
  return matches.length === 1 ? matches[0] : null;
}

/** Reference images remain documentary; party/combat additionally require the
 * actual named scenario and its native actor/enemy membership. */
export function getUniverseVisual(recordId, rawContext, options = {}) {
  try {
    const context = normalizeContext(rawContext), parsed = readOptions(options);
    if (!context || !parsed) return null;
    const visual = resolveVisual(recordId, context);
    if (!visual || parsed.usage === 'reference') return visual;
    const scenario = parsed.scenarioId && getUniverseScenario(context, parsed.scenarioId);
    if (!scenario) return null;
    if (canUseUniverseActor(context, recordId, scenario.id).ok) return visual;
    return parsed.usage === 'combat' && scenario.enemies.some(enemy => enemy.catalogId === recordId) ? visual : null;
  } catch { return null; }
}

/** Unique, immutable reference overlays; this list carries no gameplay grant. */
export function listUniverseVisuals(rawContext) {
  try {
    const context = normalizeContext(rawContext);
    if (!context) return EMPTY;
    return Object.freeze(VISUALS.filter(row => row.mediaId === context.mediaId && row.periodIds.includes(context.periodId)
      && row.recordIds.some(id => resolveVisual(id, context) === row)));
  } catch { return EMPTY; }
}
