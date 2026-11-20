// Personal catalogue consultation only. No campaign or Chronicle key is read.
export const COMIC_LIBRARY_PREFERENCES_KEY = 'relay-chronicles.comic-library.preferences.v1';
export const COMIC_LIBRARY_PREFERENCES_FORMAT = 'relay-chronicles.comic-library-preferences';
export const COMIC_LIBRARY_SORTS = Object.freeze(['volume', 'title', 'consultation', 'bookmarks']);
export const COMIC_LIBRARY_CONSULTATION = Object.freeze(['unseen', 'in-progress', 'consulted']);
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const failed = reason => ({ ok: false, reason });
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const exact = (value, keys) => plain(value) && Reflect.ownKeys(value).length === keys.length
  && keys.every(key => own(value, key));

function safe(value, depth = 0, seen = new WeakSet()) {
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string') return value.length <= 200;
  if (depth > 5 || !value || typeof value !== 'object' || seen.has(value)) return false;
  const array = Array.isArray(value);
  if (array ? Object.getPrototypeOf(value) !== Array.prototype : !plain(value)) return false;
  const keys = Reflect.ownKeys(value);
  if (keys.length > 100 || array && (keys.length !== value.length + 1
    || keys.some((key, index) => key !== (index === value.length ? 'length' : String(index))))) return false;
  seen.add(value);
  for (const key of keys) {
    if (array && key === 'length') continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== 'string' || ['__proto__', 'prototype', 'constructor'].includes(key)
      || !descriptor.enumerable || !own(descriptor, 'value') || !safe(descriptor.value, depth + 1, seen)) return false;
  }
  seen.delete(value); return true;
}

/** The canonical index is supplied by comic-library.js; counts are not copied. */
function domain(index) {
  const ids = new Set(), aliases = new Map(), owners = new Map(), sections = new Set();
  for (const volume of index.volumes) {
    if (volume.announcement) sections.add(`notice:${volume.number}`);
    sections.add(`bonuses:${volume.number}`);
    for (const work of volume.works) {
      ids.add(work.id); owners.set(work.id, work.id); sections.add(`units:${work.id}`);
      for (const unit of work.units) { ids.add(unit.id); owners.set(unit.id, work.id); }
    }
  }
  for (const edition of index.relatedEditions) {
    sections.add(`edition:${edition.id}`);
    for (const work of edition.works) { ids.add(work.id); owners.set(work.id, work.id); aliases.set(work.linkId, work.id); }
  }
  return { ids, aliases, owners, sections };
}
const canonical = (id, scope) => typeof id === 'string' ? scope.ids.has(id) ? id : scope.aliases.get(id) || null : null;
const unique = (values, allowed) => Array.isArray(values) && values.length <= allowed.size
  && values.every(id => typeof id === 'string' && allowed.has(id)) && new Set(values).size === values.length;

export function createLibraryPreferences() {
  return { version: 1, sort: 'volume', bookmarks: [], consultation: {}, lastTarget: null, expanded: [] };
}

/** Missing optional UI fields migrate; a present malformed field never resets. */
export function normalizeLibraryPreferences(raw, index) {
  try {
    if (!safe(raw) || !plain(raw) || !['version', 'sort', 'bookmarks', 'consultation'].every(key => own(raw, key))
      || Reflect.ownKeys(raw).some(key => !['version', 'sort', 'bookmarks', 'consultation', 'lastTarget', 'expanded'].includes(key))
      || raw.version !== 1 || !COMIC_LIBRARY_SORTS.includes(raw.sort) || !plain(raw.consultation)) return null;
    const scope = domain(index), expanded = own(raw, 'expanded') ? raw.expanded : [], lastTarget = own(raw, 'lastTarget') ? raw.lastTarget : null;
    if (!unique(raw.bookmarks, scope.ids) || !unique(expanded, scope.sections)
      || lastTarget !== null && !scope.ids.has(lastTarget) || Object.keys(raw.consultation).length > scope.ids.size
      || Object.entries(raw.consultation).some(([id, status]) => !scope.ids.has(id) || !['in-progress', 'consulted'].includes(status))) return null;
    return { version: 1, sort: raw.sort, bookmarks: [...raw.bookmarks], consultation: { ...raw.consultation }, lastTarget, expanded: [...expanded] };
  } catch { return null; }
}

export function updateLibraryPreferences(raw, command, index) {
  const preferences = normalizeLibraryPreferences(raw, index);
  if (!preferences) return failed('Préférences de consultation invalides ; données conservées.');
  const before = JSON.stringify(preferences);
  try {
    if (!safe(command) || !plain(command)) return failed('Commande de consultation invalide.');
    const scope = domain(index);
    if (command.type === 'sort' && exact(command, ['type', 'value']) && COMIC_LIBRARY_SORTS.includes(command.value)) preferences.sort = command.value;
    else if (command.type === 'section' && exact(command, ['type', 'id', 'value']) && scope.sections.has(command.id) && typeof command.value === 'boolean') {
      if (preferences.expanded.includes(command.id) === command.value) return { ok: true, preferences, changed: false };
      preferences.expanded = preferences.expanded.filter(id => id !== command.id);
      if (command.value) preferences.expanded.push(command.id);
    } else {
      const id = canonical(command.id, scope);
      if (!id) return failed('Ce repère n’appartient pas au sommaire de la bibliothèque.');
      if (command.type === 'bookmark' && exact(command, ['type', 'id'])) {
        preferences.bookmarks = preferences.bookmarks.includes(id) ? preferences.bookmarks.filter(entry => entry !== id) : [...preferences.bookmarks, id];
      } else if (command.type === 'consultation' && exact(command, ['type', 'id', 'value']) && COMIC_LIBRARY_CONSULTATION.includes(command.value)) {
        if (command.value === 'unseen') delete preferences.consultation[id];
        else preferences.consultation[id] = command.value;
      } else if (command.type === 'visit' && exact(command, ['type', 'id'])) {
        preferences.lastTarget = id;
        for (const target of new Set([scope.owners.get(id), id])) if (!own(preferences.consultation, target)) preferences.consultation[target] = 'in-progress';
      } else return failed('Commande de consultation invalide.');
    }
    return { ok: true, preferences, changed: JSON.stringify(preferences) !== before };
  } catch { return failed('Commande de consultation invalide.'); }
}

export function encodeLibraryPreferences(raw, index) {
  const preferences = normalizeLibraryPreferences(raw, index);
  return preferences ? JSON.stringify({ format: COMIC_LIBRARY_PREFERENCES_FORMAT, version: 1, preferences }) : null;
}
export function decodeLibraryPreferences(raw, index) {
  try {
    if (typeof raw === 'string' && raw.length > 100000) return null;
    const packet = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!safe(packet) || !exact(packet, ['format', 'version', 'preferences'])
      || packet.format !== COMIC_LIBRARY_PREFERENCES_FORMAT || packet.version !== 1) return null;
    return normalizeLibraryPreferences(packet.preferences, index);
  } catch { return null; }
}
export function loadLibraryPreferences(storage, index) {
  try {
    const bytes = storage.getItem(COMIC_LIBRARY_PREFERENCES_KEY);
    if (bytes === null) return { ok: true, preferences: createLibraryPreferences(), fresh: true };
    const preferences = decodeLibraryPreferences(bytes, index);
    return preferences ? { ok: true, preferences, fresh: false }
      : { ...failed('Préférences de consultation illisibles ; contenu local conservé.'), preferences: null, fresh: false };
  } catch { return { ...failed('Stockage des préférences indisponible ; consultation en lecture seule.'), preferences: null, fresh: false }; }
}
export function saveLibraryPreferences(storage, raw, index) {
  try {
    const bytes = encodeLibraryPreferences(raw, index);
    if (!bytes) return failed('Préférences invalides ; enregistrement précédent conservé.');
    storage.setItem(COMIC_LIBRARY_PREFERENCES_KEY, bytes);
    return { ok: true };
  } catch { return failed('Préférences non enregistrées ; stockage indisponible.'); }
}
