import { SLOTS, ITEMS, equipmentFor, normalizeInventory, itemCompatibility } from './loadout.js';

// These cosmetic choices belong to Relay Chronicles. Equipment keeps the ME1
// whole-suit model; paints and an in-campaign appearance editor are adaptations.
const choices = entries => Object.freeze(entries.map(entry => Object.freeze(entry)));
export const CUSTOMIZATION_OPTIONS = Object.freeze({
  facePresets: choices([
    { id: 'standard', label: 'Alliance' }, { id: 'veteran', label: 'Vétéran' },
    { id: 'colonist', label: 'Colon' }, { id: 'spacer', label: 'Stellaire' },
  ]),
  skinTones: choices([
    { id: 'fair', label: 'Clair', color: '#e6c1aa' }, { id: 'warm', label: 'Doré', color: '#c99473' },
    { id: 'tan', label: 'Hâlé', color: '#ad7856' }, { id: 'brown', label: 'Brun', color: '#84583e' },
    { id: 'deep', label: 'Foncé', color: '#593d31' }, { id: 'ebony', label: 'Très foncé', color: '#3b2a26' },
  ]),
  eyeColors: choices([
    { id: 'blue', label: 'Bleu', color: '#6c9fb4' }, { id: 'green', label: 'Vert', color: '#75895a' },
    { id: 'hazel', label: 'Noisette', color: '#a18a51' }, { id: 'brown', label: 'Brun', color: '#684735' },
    { id: 'grey', label: 'Gris', color: '#a4acb2' },
  ]),
  hairColors: choices([
    { id: 'black', label: 'Noir', color: '#242126' }, { id: 'brown', label: 'Brun', color: '#4b332c' },
    { id: 'auburn', label: 'Auburn', color: '#813a2b' }, { id: 'blond', label: 'Blond', color: '#bf9a5f' },
    { id: 'grey', label: 'Gris', color: '#a4a3a1' }, { id: 'white', label: 'Blanc', color: '#e2ded1' },
  ]),
  hairStyles: choices([
    { id: 'cropped', label: 'Ras' }, { id: 'short', label: 'Court' },
    { id: 'swept', label: 'Mèche' }, { id: 'tied', label: 'Attaché' },
  ]),
  armorColors: choices([
    { id: 'graphite', label: 'Graphite', color: '#414953' }, { id: 'black', label: 'Noir', color: '#232a32' },
    { id: 'silver', label: 'Argent', color: '#9ba9b3' }, { id: 'white', label: 'Blanc', color: '#e0e3db' },
    { id: 'alliance', label: 'Bleu Alliance', color: '#345e86' }, { id: 'teal', label: 'Bleu sarcelle', color: '#3d8b8a' },
    { id: 'red', label: 'Rouge N7', color: '#ad3c40' }, { id: 'orange', label: 'Orange', color: '#b57439' },
    { id: 'olive', label: 'Olive', color: '#6c7754' }, { id: 'purple', label: 'Violet', color: '#7b6096' },
  ]),
  patterns: choices([
    { id: 'classic', label: 'Bandes N7' }, { id: 'solid', label: 'Uni' },
    { id: 'stripe', label: 'Bande centrale' }, { id: 'split', label: 'Bicolore' },
  ]),
  finishes: choices([
    { id: 'standard', label: 'Standard' }, { id: 'matte', label: 'Mat' }, { id: 'gloss', label: 'Satiné' },
  ]),
  helmetModes: choices([
    { id: 'hidden', label: 'Masqué' }, { id: 'visible', label: 'Visible' }, { id: 'combat', label: 'En combat' },
  ]),
});

const owns = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const fail = reason => ({ ok: false, reason });
const isAppearance = value => value === 'male' || value === 'female';
const option = (category, value) => typeof value === 'string' && CUSTOMIZATION_OPTIONS[category].some(entry => entry.id === value);
const exact = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value)
  && Reflect.ownKeys(value).length === keys.length && keys.every(key => owns(value, key));

// Public validators also receive object input, so never read a property until
// all descriptors have been checked. This rejects accessors without invoking
// them, symbols, exotic prototypes, forbidden keys, cycles and oversized input.
function safeObject(value, depth = 0, seen = new WeakSet()) {
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'string') return value.length <= 100;
  if (typeof value === 'number') return Number.isFinite(value);
  if (depth > 5 || !value || typeof value !== 'object' || Array.isArray(value) || seen.has(value)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false;
  seen.add(value);
  const keys = Reflect.ownKeys(value);
  if (keys.length > 30) return false;
  for (const key of keys) {
    if (typeof key !== 'string' || ['__proto__', 'prototype', 'constructor'].includes(key)) return false;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!owns(descriptor, 'value') || !safeObject(descriptor.value, depth + 1, seen)) return false;
  }
  seen.delete(value);
  return true;
}

export function initialCustomization(appearance = 'male') {
  return {
    version: 1,
    face: { preset: 'standard', skinTone: 'fair', eyeColor: 'blue', hairColor: appearance === 'female' ? 'auburn' : 'brown', hairStyle: appearance === 'female' ? 'short' : 'cropped' },
    armor: { primary: 'graphite', secondary: 'silver', accent: 'red', pattern: 'classic', finish: 'standard', helmet: 'hidden' },
  };
}

/** Absent historic data migrates. Explicit malformed data never becomes defaults. */
export function normalizeCustomization(raw, appearance = 'male') {
  try {
    if (raw === undefined) return initialCustomization(appearance);
    if (!safeObject(raw) || !exact(raw, ['version', 'face', 'armor']) || raw.version !== 1
      || !exact(raw.face, ['preset', 'skinTone', 'eyeColor', 'hairColor', 'hairStyle'])
      || !exact(raw.armor, ['primary', 'secondary', 'accent', 'pattern', 'finish', 'helmet'])) return null;
    const face = raw.face, armor = raw.armor;
    if (!option('facePresets', face.preset) || !option('skinTones', face.skinTone)
      || !option('eyeColors', face.eyeColor) || !option('hairColors', face.hairColor) || !option('hairStyles', face.hairStyle)
      || !['primary', 'secondary', 'accent'].every(key => option('armorColors', armor[key]))
      || !option('patterns', armor.pattern) || !option('finishes', armor.finish) || !option('helmetModes', armor.helmet)) return null;
    return { version: 1, face: { ...face }, armor: { ...armor } };
  } catch { return null; }
}

export function getCustomizationPalette(customization) {
  const normalized = normalizeCustomization(customization) || initialCustomization();
  const color = (category, id) => CUSTOMIZATION_OPTIONS[category].find(entry => entry.id === id).color;
  return {
    skin: color('skinTones', normalized.face.skinTone), eyes: color('eyeColors', normalized.face.eyeColor),
    hair: color('hairColors', normalized.face.hairColor), primary: color('armorColors', normalized.armor.primary),
    secondary: color('armorColors', normalized.armor.secondary), accent: color('armorColors', normalized.armor.accent),
  };
}

/** A detached draft. Browsing, tabs, previews and cancellation never change saves. */
export function createCustomizationDraft(state) {
  return {
    appearance: isAppearance(state.appearance) ? state.appearance : 'male',
    customization: normalizeCustomization(state.customization, state.appearance) || initialCustomization(state.appearance),
    equipment: equipmentFor(state, 'shepard'),
  };
}

/** Validate against CURRENT inventory, including equipment already held by allies. */
export function validateCustomizationDraft(state, draft, { inCombat = false } = {}) {
  try {
    if (inCombat || state?.inCombat === true || state?.battle) return fail('La personnalisation est indisponible pendant un combat.');
    if (!safeObject(draft) || !exact(draft, ['appearance', 'customization', 'equipment']) || !isAppearance(draft.appearance)
      || !exact(draft.equipment, SLOTS)) return fail('Personnalisation invalide.');
    const customization = normalizeCustomization(draft.customization, draft.appearance);
    if (!customization) return fail('Options d’apparence invalides.');
    const inventory = normalizeInventory(state.inventory, state);
    if (!inventory) return fail('Inventaire invalide.');
    for (const slot of SLOTS) {
      const id = draft.equipment[slot];
      if (id === null) continue;
      if (typeof id !== 'string' || !owns(ITEMS, id) || ITEMS[id].slot !== slot) return fail('Objet incompatible avec cet emplacement.');
      const check = itemCompatibility(state, 'shepard', id);
      if (!check.ok) return fail(check.reason);
      const reservedByOthers = Object.entries(inventory.equipped).reduce((total, [actorId, slots]) => total + (actorId === 'shepard' ? 0 : Object.values(slots).filter(value => value === id).length), 0);
      if ((inventory.items[id] || 0) <= reservedByOthers) return fail('Aucun exemplaire libre dans l’inventaire.');
    }
    inventory.equipped.shepard = { ...draft.equipment };
    const validatedInventory = normalizeInventory(inventory, state);
    if (!validatedInventory) return fail('Cette dotation ne peut pas être appliquée.');
    return { ok: true, state: { ...structuredClone(state), appearance: draft.appearance, customization, inventory: validatedInventory } };
  } catch { return fail('Personnalisation invalide.'); }
}

export function customizationPreviewState(state, draft) {
  const result = validateCustomizationDraft(state, draft);
  return result.ok ? result.state : null;
}

/** Commit all appearance and loadout changes together, after every check passes. */
export function commitCustomization(state, draft, options = {}) {
  const result = validateCustomizationDraft(state, draft, options);
  if (!result.ok) return result;
  state.appearance = result.state.appearance;
  state.customization = result.state.customization;
  state.inventory = result.state.inventory;
  return { ok: true };
}
