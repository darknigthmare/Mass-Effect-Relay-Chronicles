// ME1 names and equipment families; values, stock, levels and training penalties
// below are explicit ATB adaptations. No copied weapon damage tables are used.
import { TOOL_CATALOG } from './tool-data.js';
import { getEquipmentProfile } from './character-data.js';

const LEGACY_SLOTS = Object.freeze(['weapon', 'armor', 'weaponMod', 'ammoMod', 'armorMod']);
export const SLOTS = Object.freeze([...LEGACY_SLOTS, 'weaponMod2', 'armorMod2', 'omniTool', 'bioticAmp']);
export const SLOT_LABELS = Object.freeze({ weapon: 'Arme', armor: 'Armure', weaponMod: 'Module d’arme', ammoMod: 'Munitions', armorMod: 'Module d’armure', weaponMod2: 'Module d’arme 2', armorMod2: 'Module d’armure 2', omniTool: 'OmniTech', bioticAmp: 'Amplificateur biotique' });
export const WEAPON_LABELS = Object.freeze({ pistol: 'Pistolet', assault: 'Fusil d’assaut', shotgun: 'Fusil à pompe', sniper: 'Fusil de précision' });
export const ARMOR_LABELS = Object.freeze({ light: 'Légère', medium: 'Intermédiaire', heavy: 'Lourde' });
export const INVENTORY_CAPACITY = 150;
export const ITEM_CAPACITY = 20;
const MAX_STOCK = 40;
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const clone = value => JSON.parse(JSON.stringify(value));
const fail = reason => ({ ok: false, reason });
const species = { shepard: 'human', ashley: 'human', kaidan: 'human', jenkins: 'human', liara: 'human', garrus: 'turian', tali: 'quarian', wrex: 'krogan' };
const weaponSources = {
  pistol: 'https://masseffect.fandom.com/wiki/Pistols', assault: 'https://masseffect.fandom.com/wiki/Assault_Rifles',
  shotgun: 'https://masseffect.fandom.com/wiki/Shotguns', sniper: 'https://masseffect.fandom.com/wiki/Sniper_Rifles',
};
const families = [
  { tier: 'I', level: 1, manufacturer: 'Hahne-Kedar', names: ['Kessler', 'Lancer', 'Storm', 'Avenger'], attack: 0, price: 70 },
  { tier: 'III', level: 2, manufacturer: 'Elanus Risk Control Services', names: ['Striker', 'Banshee', 'Hurricane', 'Hammer'], attack: 3, price: 190 },
  { tier: 'V', level: 4, manufacturer: 'Ariake Technologies', names: ['Raikou', 'Tsunami', 'Katana', 'Naginata'], attack: 6, price: 350 },
  { tier: 'VII', level: 6, manufacturer: 'Armax Arsenal', names: ['Brawler', 'Crossfire', 'Avalanche', 'Punisher'], attack: 9, price: 560 },
  { tier: 'VII', level: 7, manufacturer: 'Spectre — Master Gear', names: ['HMWP', 'HMWA', 'HMWSG', 'HMWSR'], attack: 12, price: 780, spectre: true },
];
const weaponTypes = Object.keys(WEAPON_LABELS);
const catalogue = [];
for (const family of families) family.names.forEach((model, index) => {
  const type = weaponTypes[index], upgraded = family.level > 1;
  catalogue.push({
    id: `${model.toLowerCase()}-${family.tier.toLowerCase()}`, name: `${model} ${family.tier}`, kind: 'weapon', slot: 'weapon',
    weaponType: type, manufacturer: family.manufacturer, level: family.level, spectre: !!family.spectre,
    cost: family.price + index * 15, sell: Math.floor((family.price + index * 15) * .4), stock: 3,
    bonuses: { attack: upgraded ? family.attack + index : 0, weaponHeatMultiplier: upgraded ? [.88, 1, 1.12, 1.2][index] : 1 },
    detail: upgraded ? `${WEAPON_LABELS[type]} : équilibre entre puissance et chaleur. Le bonus de puissance est réduit sans entraînement.` : 'Dotation de départ : aucune modification des statistiques de base.',
    sourceUrl: weaponSources[type], canonicalStatus: 'Nom et famille référencés ; chiffres adaptés au système ATB.',
  });
});
const bodies = [
  { id: 'human', label: 'humains / Asari', weights: ['light', 'light', 'heavy', 'medium'] },
  { id: 'turian', label: 'Turiens', weights: ['light', 'light', 'medium', 'medium'] },
  { id: 'quarian', label: 'Quariens', weights: ['light', 'light', 'light', 'light'] },
  { id: 'krogan', label: 'Krogans', weights: ['medium', 'medium', 'heavy', 'heavy'] },
];
for (const body of bodies) {
  const lines = [
    { model: 'Onyx', tier: 'I', level: 1, manufacturer: 'Aldrin Labs', cost: 80, bonuses: {} },
    { model: 'Phoenix', tier: 'III', level: 2, manufacturer: 'Sirta Foundation', cost: 220, bonuses: { hp: 15, shield: 15, defense: 1 } },
    { model: 'Colossus', tier: 'VII', level: 6, manufacturer: 'Kassa Fabrication', cost: 600, bonuses: { hp: 30, shield: 35, defense: 6 } },
    body.id === 'quarian'
      ? { model: 'Liberator', tier: 'V', level: 4, manufacturer: 'Devlon Industries', cost: 370, bonuses: { hp: 15, shield: 30, defense: 3 } }
      : { model: 'Predator', tier: 'VII', level: 6, manufacturer: 'Armax Arsenal', cost: 620, bonuses: { shield: 65, defense: 3, controlResistance: .05 } },
  ];
  lines.forEach((line, index) => {
    const suffix = line.model === 'Predator' ? ` ${body.weights[index] === 'heavy' ? 'H' : 'M'}` : '';
    catalogue.push({
      id: `${line.model.toLowerCase()}-${body.id}-${line.tier.toLowerCase()}`, name: `${line.model}${suffix} ${line.tier} · ${body.label}`,
      kind: 'armor', slot: 'armor', armorSpecies: body.id, armorWeight: body.weights[index],
      manufacturer: line.manufacturer, level: line.level, cost: line.cost, sell: Math.floor(line.cost * .4), stock: 3,
      bonuses: line.bonuses, detail: `${ARMOR_LABELS[body.weights[index]]} pour ${body.label}. ${line.model === 'Onyx' ? 'Protection de départ, sans bonus supplémentaire.' : 'Protection et réserves ajustées au combat ATB.'}`,
      sourceUrl: line.model === 'Predator' ? 'https://masseffect.fandom.com/wiki/Predator_L/M/H_Armor' : `https://masseffect.fandom.com/wiki/${line.model}_Armor`,
      canonicalStatus: 'Nom, fabricant et morphologie référencés ; protection et déblocage adaptés.',
    });
  });
}
const mods = [
  ['heat-sink-i', 'Dissipateur thermique I', 'weaponMod', 1, 100, { weaponHeatMultiplier: .9, weaponCoolingBonus: 1 }, 'Réduit la chaleur des tirs de 10 % et ajoute 1 point de refroidissement par seconde.', 'Weapon_Upgrades'],
  ['kinetic-coil-vii', 'Bobine cinétique VII', 'weaponMod', 5, 340, { attack: 5 }, 'Renforce de 5 la puissance de tir dans cette adaptation.', 'Weapon_Upgrades'],
  ['rail-extension-iv', 'Extension de rail IV', 'weaponMod', 3, 200, { attack: 6, weaponHeatMultiplier: 1.2 }, 'Ajoute 6 en puissance mais augmente la chaleur des tirs de 20 %.', 'Weapon_Upgrades'],
  ['frictionless-materials-viii', 'Matériaux sans friction VIII', 'weaponMod', 7, 500, { attack: 4, weaponHeatMultiplier: .85, weaponCoolingBonus: 2 }, 'Ajoute 4 en puissance, réduit la chaleur de 15 % et accélère le refroidissement de 2 points par seconde.', 'Weapon_Upgrades'],
  ['armor-piercing-rounds-i', 'Munitions perforantes I', 'ammoMod', 1, 110, { syntheticDamageBonus: .15 }, 'Les tirs infligent 15 % de dégâts supplémentaires aux cibles synthétiques.', 'Ammunition_Upgrades'],
  ['tungsten-rounds-iv', 'Munitions au tungstène IV', 'ammoMod', 4, 280, { syntheticDamageBonus: .25 }, 'Les tirs infligent 25 % de dégâts supplémentaires aux cibles synthétiques.', 'Ammunition_Upgrades'],
  ['shredder-rounds-iv', 'Munitions lacérantes IV', 'ammoMod', 4, 280, { organicDamageBonus: .25 }, 'Les tirs infligent 25 % de dégâts supplémentaires aux cibles organiques.', 'Ammunition_Upgrades'],
  ['phasic-rounds-vii', 'Munitions phasiques VII', 'ammoMod', 6, 400, { shieldBypass: .2, weaponHeatMultiplier: 1.1 }, '20 % des dégâts de tir contournent les boucliers ; chaleur augmentée de 10 %.', 'Ammunition_Upgrades'],
  ['armor-plating-i', 'Plaques de blindage I', 'armorMod', 1, 110, { defense: 3 }, 'Ajoute 3 en défense.', 'Armor_Upgrades'],
  ['shield-battery-i', 'Batterie de bouclier I', 'armorMod', 1, 120, { shield: 25 }, 'Augmente la réserve de bouclier de 25.', 'Armor_Upgrades'],
  ['hardened-weave-i', 'Tissage renforcé I', 'armorMod', 2, 170, { controlResistance: .12 }, 'Réduit la durée des contrôles biotiques et technologiques de 12 %.', 'Armor_Upgrades'],
  ['shock-absorbers-iii', 'Amortisseurs III', 'armorMod', 3, 230, { hp: 15, controlResistance: .2 }, 'Ajoute 15 en santé et réduit de 20 % la durée des contrôles.', 'Armor_Upgrades'],
];
for (const [id, name, slot, level, cost, bonuses, detail, source] of mods) catalogue.push({
  id, name, kind: slot, slot, manufacturer: 'Module standard', level, cost, sell: Math.floor(cost * .4), stock: 5,
  bonuses, detail, sourceUrl: `https://masseffect.fandom.com/wiki/${source}`,
  canonicalStatus: 'Famille de module ME1 référencée ; traduction et effets ATB adaptés.',
});
const legacyIds = new Set(catalogue.map(item => item.id));
catalogue.push(...TOOL_CATALOG);
for (const item of catalogue) { Object.freeze(item.bonuses); Object.freeze(item); }
export const GEAR_CATALOG = Object.freeze(catalogue);
export const ITEMS = Object.freeze(Object.fromEntries(catalogue.map(item => [item.id, item])));
const emptySlots = () => Object.fromEntries(SLOTS.map(slot => [slot, null]));
const trainingBudget = state => Number.isSafeInteger(state?.xp) && state.xp >= 0 ? Math.floor(state.xp / 300) : 0;
const levelFor = state => trainingBudget(state) + 1;
const profileFor = (state, actorId) => getEquipmentProfile(actorId, state?.classId);
const knownActor = (state, actorId) => typeof actorId === 'string' && own(species, actorId) && !!profileFor(state, actorId)
  && (actorId === 'shepard' || state?.recruited?.includes(actorId));
const liveActor = (state, actorId) => knownActor(state, actorId) && !state?.lost?.includes(actorId);
const shopOpen = state => state?.zone === 'normandy' || state?.zone === 'citadel' && state?.completed?.includes('eden-prime');
const isTrained = (state, actorId, type) => profileFor(state, actorId)?.weaponTraining.includes(type) === true;
const slotKind = slot => slot === 'weaponMod2' ? 'weaponMod' : slot === 'armorMod2' ? 'armorMod' : slot;
const moduleParent = slot => ['weaponMod', 'weaponMod2', 'ammoMod'].includes(slot) ? 'weapon'
  : ['armorMod', 'armorMod2'].includes(slot) ? 'armor' : null;
const childSlots = parent => parent === 'weapon' ? ['weaponMod', 'weaponMod2', 'ammoMod'] : parent === 'armor' ? ['armorMod', 'armorMod2'] : [];
const emptyTraining = () => ({ weights: {}, legacyArmor: null });

export function initialInventory() {
  return { version: 2,
    items: { 'kessler-i': 1, 'lancer-i': 1, 'storm-i': 1, 'avenger-i': 1, 'onyx-human-i': 1 },
    equipped: { shepard: { ...emptySlots(), weapon: 'lancer-i', armor: 'onyx-human-i' } },
    stock: Object.fromEntries(GEAR_CATALOG.map(item => [item.id, item.stock])), training: {},
  };
}
function safeObject(value, depth = 0, seen = new WeakSet()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (depth > 6 || !value || typeof value !== 'object' || Array.isArray(value) || seen.has(value)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false;
  seen.add(value);
  const keys = Reflect.ownKeys(value);
  if (keys.length > 100) return false;
  for (const key of keys) {
    if (typeof key !== 'string' || ['__proto__', 'prototype', 'constructor'].includes(key)) return false;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor.enumerable || !own(descriptor, 'value') || !safeObject(descriptor.value, depth + 1, seen)) return false;
  }
  seen.delete(value);
  return true;
}
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const exact = (value, keys) => plain(value) && Reflect.ownKeys(value).length === keys.length && keys.every(key => own(value, key));
function legacyArmorCapacity(state, actorId) {
  const level = levelFor(state), type = actorId === 'shepard' ? state.classId : actorId;
  if (['soldier', 'ashley', 'jenkins', 'wrex'].includes(type)) return level >= 5 ? 'heavy' : 'medium';
  if (['infiltrator', 'vanguard', 'garrus'].includes(type)) return level >= 4 ? 'medium' : 'light';
  return 'light';
}
function legacyCompatibility(state, actorId, item) {
  if (!knownActor(state, actorId) || !legacyIds.has(item.id) || item.level > levelFor(state)
    || item.spectre && state?.flags?.spectre !== true) return false;
  return item.slot !== 'armor' || item.armorSpecies === species[actorId]
    && ['light', 'medium', 'heavy'].indexOf(item.armorWeight) <= ['light', 'medium', 'heavy'].indexOf(legacyArmorCapacity(state, actorId));
}
function checkCompatibility(state, actorId, itemId, slot, inventory) {
  const item = typeof itemId === 'string' && own(ITEMS, itemId) ? ITEMS[itemId] : null;
  if (!item) return fail('Objet inconnu.');
  if (!liveActor(state, actorId)) return fail('Cet équipier ne peut plus recevoir d’équipement.');
  const targetSlot = slot ?? item.slot;
  if (!SLOTS.includes(targetSlot) || slotKind(targetSlot) !== item.slot) return fail('Cet objet ne correspond pas à cet emplacement.');
  if (item.level > levelFor(state)) return fail(`Niveau ${item.level} requis.`);
  if (item.spectre && state?.flags?.spectre !== true) return fail('Accréditation Spectre requise.');
  const profile = profileFor(state, actorId), slots = inventory.equipped[actorId] || emptySlots();
  if (item.slot === 'armor') {
    if (item.armorSpecies !== profile.armorSpecies) return fail('Cette armure ne correspond pas à la morphologie de l’équipier.');
    const training = inventory.training[actorId];
    const inherited = training?.legacyArmor === itemId && slots.armor === itemId;
    if (!profile.armorWeights.includes(item.armorWeight) && training?.weights[item.armorWeight] !== true && !inherited)
      return fail(`Formation aux armures ${ARMOR_LABELS[item.armorWeight].toLowerCase()} requise.`);
  }
  if (item.slot === 'omniTool' && !profile.canUseOmniTool) return fail('Cet équipier ne peut pas utiliser d’OmniTech.');
  if (item.slot === 'bioticAmp' && !profile.biotic) return fail('Cet équipier ne possède pas de capacités biotiques.');
  const parent = moduleParent(targetSlot);
  if (parent && !slots[parent]) return fail(`Équipez d’abord ${parent === 'weapon' ? 'une arme' : 'une armure'}.`);
  const trainedWeapon = item.kind !== 'weapon' || isTrained(state, actorId, item.weaponType);
  return { ok: true, slot: targetSlot, trained: trainedWeapon, warning: trainedWeapon ? null : 'Arme sans entraînement : bonus de puissance divisé par deux (arrondi inférieur).', item };
}

/** Compatibility ignores ownership; use canEquipItem before a transaction. */
export function itemCompatibility(state, actorId, itemId, slot) {
  const inventory = normalizeInventory(state?.inventory, state);
  return inventory ? checkCompatibility(state, actorId, itemId, slot, inventory) : fail('Inventaire invalide.');
}

/** Absent saves receive neutral gear; explicit v1 data is validated before migration. */
export function normalizeInventory(raw, state) {
  try {
    if (raw === undefined) return initialInventory();
    if (!safeObject(raw) || ![1, 2].includes(raw?.version)) return null;
    const legacy = raw.version === 1;
    if (!exact(raw, legacy ? ['version', 'items', 'equipped', 'stock'] : ['version', 'items', 'equipped', 'stock', 'training'])
      || !plain(raw.items) || !plain(raw.equipped) || !plain(raw.stock) || !legacy && !plain(raw.training)) return null;
    let total = 0;
    for (const [id, quantity] of Object.entries(raw.items)) {
      if (!own(ITEMS, id) || legacy && !legacyIds.has(id) || !Number.isInteger(quantity) || quantity < 1 || quantity > ITEM_CAPACITY) return null;
      total += quantity;
    }
    if (total > INVENTORY_CAPACITY || Object.keys(raw.equipped).length > Object.keys(species).length) return null;
    if (Object.keys(raw.stock).length !== (legacy ? legacyIds.size : GEAR_CATALOG.length)) return null;
    for (const [id, quantity] of Object.entries(raw.stock))
      if (!own(ITEMS, id) || legacy && !legacyIds.has(id) || !Number.isInteger(quantity) || quantity < 0 || quantity > MAX_STOCK) return null;
    const inventory = clone(raw);
    if (legacy) {
      inventory.version = 2; inventory.training = {};
      for (const tool of TOOL_CATALOG) inventory.stock[tool.id] = tool.stock;
      for (const slots of Object.values(inventory.equipped)) {
        if (!exact(slots, LEGACY_SLOTS)) return null;
      }
    } else {
      for (const [actorId, training] of Object.entries(inventory.training)) {
        const profile = profileFor(state, actorId);
        if (!knownActor(state, actorId) || !exact(training, ['weights', 'legacyArmor']) || !plain(training.weights)) return null;
        const weights = Object.keys(training.weights);
        if (weights.length > trainingBudget(state) || weights.some(weight => !profile.trainableArmorWeights.includes(weight) || training.weights[weight] !== true)) return null;
        if (training.legacyArmor !== null) {
          const armor = typeof training.legacyArmor === 'string' && own(ITEMS, training.legacyArmor) ? ITEMS[training.legacyArmor] : null;
          if (!armor || armor.slot !== 'armor' || !legacyIds.has(armor.id) || inventory.equipped[actorId]?.armor !== armor.id
            || !profile.trainableArmorWeights.includes(armor.armorWeight) || !legacyCompatibility(state, actorId, armor)) return null;
        }
      }
    }
    const allocations = {};
    const compatibilityState = { ...state, lost: [] }; // Fallen allies' gear remains recoverable.
    for (const [actorId, slots] of Object.entries(inventory.equipped)) {
      if (!knownActor(state, actorId) || !exact(slots, legacy ? LEGACY_SLOTS : SLOTS)) return null;
      for (const slot of legacy ? LEGACY_SLOTS : SLOTS) {
        const id = slots[slot];
        if (id === null) continue;
        if (typeof id !== 'string' || !own(ITEMS, id) || ITEMS[id].slot !== slotKind(slot)) return null;
        if (legacy ? !legacyCompatibility(state, actorId, ITEMS[id]) : !checkCompatibility(compatibilityState, actorId, id, slot, inventory).ok) return null;
        allocations[id] = (allocations[id] || 0) + 1;
        if (allocations[id] > (raw.items[id] || 0)) return null;
      }
      if (legacy) {
        const armor = ITEMS[slots.armor], profile = profileFor(state, actorId);
        if (armor && !profile.armorWeights.includes(armor.armorWeight)) {
          if (!profile.trainableArmorWeights.includes(armor.armorWeight)) return null;
          inventory.training[actorId] = { weights: {}, legacyArmor: armor.id };
        }
        Object.assign(slots, { weaponMod2: null, armorMod2: null, omniTool: null, bioticAmp: null });
        // v1 allowed unattached modules. Release their reservations, preserving items and shop stock.
        for (const slot of SLOTS) if (moduleParent(slot) && !slots[moduleParent(slot)]) slots[slot] = null;
      }
    }
    return inventory;
  } catch { return null; }
}
export function inventoryCount(state) {
  const inventory = normalizeInventory(state?.inventory, state);
  return inventory ? Object.values(inventory.items).reduce((sum, n) => sum + n, 0) : 0;
}
export function equipmentFor(state, actorId) {
  const inventory = normalizeInventory(state?.inventory, state);
  return inventory ? { ...emptySlots(), ...inventory.equipped[actorId] } : emptySlots();
}
function allocated(inventory, itemId) {
  return Object.values(inventory.equipped).reduce((sum, slots) => sum + Object.values(slots).filter(id => id === itemId).length, 0);
}
export function listInventory(state) {
  const inventory = normalizeInventory(state?.inventory, state);
  return inventory ? GEAR_CATALOG.filter(item => inventory.items[item.id]).map(item => ({
    ...item, quantity: inventory.items[item.id], equipped: allocated(inventory, item.id), available: inventory.items[item.id] - allocated(inventory, item.id),
    actors: Object.entries(inventory.equipped).filter(([, slots]) => Object.values(slots).includes(item.id)).map(([actorId]) => actorId),
  })) : [];
}
export function listShop(state) {
  const inventory = normalizeInventory(state?.inventory, state);
  if (!inventory) return [];
  return GEAR_CATALOG.map(item => {
    const reason = !shopOpen(state) ? 'Rejoignez le Normandy ou la Citadelle.' : item.level > levelFor(state) ? `Niveau ${item.level} requis.`
      : item.spectre && state?.flags?.spectre !== true ? 'Accréditation Spectre requise.' : inventory.stock[item.id] < 1 ? 'Stock épuisé.'
        : (inventory.items[item.id] || 0) >= ITEM_CAPACITY ? 'Limite de 20 exemplaires atteinte.'
          : Object.values(inventory.items).reduce((a, n) => a + n, 0) >= INVENTORY_CAPACITY ? 'Inventaire plein.'
            : !Number.isSafeInteger(state.credits) || state.credits < item.cost ? 'Crédits insuffisants.' : null;
    return { ...item, stock: inventory.stock[item.id], owned: inventory.items[item.id] || 0, canBuy: !reason, reason };
  });
}
export function canEquipItem(state, actorId, itemId, slot) {
  const inventory = normalizeInventory(state?.inventory, state);
  if (!inventory) return fail('Inventaire invalide.');
  const check = checkCompatibility(state, actorId, itemId, slot, inventory);
  if (!check.ok) return check;
  if (inventory.equipped[actorId]?.[check.slot] === itemId) return fail('Cet objet est déjà équipé.');
  if ((inventory.items[itemId] || 0) <= allocated(inventory, itemId)) return fail('Aucun exemplaire libre dans l’inventaire.');
  return check;
}
function replaceSlot(inventory, actorId, slot, itemId) {
  const slots = { ...emptySlots(), ...inventory.equipped[actorId] }, returnedMods = [];
  if (slots[slot] !== itemId) {
    for (const child of childSlots(slot)) {
      if (slots[child]) returnedMods.push(slots[child]);
      slots[child] = null;
    }
    if (slot === 'armor' && inventory.training[actorId]?.legacyArmor) inventory.training[actorId].legacyArmor = null;
  }
  slots[slot] = itemId;
  inventory.equipped[actorId] = slots;
  return returnedMods;
}
export function equipItem(state, actorId, itemId, slot) {
  const check = canEquipItem(state, actorId, itemId, slot);
  if (!check.ok) return check;
  const inventory = normalizeInventory(state.inventory, state);
  const returnedMods = replaceSlot(inventory, actorId, check.slot, itemId);
  state.inventory = inventory;
  return { ok: true, item: check.item, warning: check.warning, returnedMods };
}
export function unequipItem(state, actorId, slot) {
  if (!knownActor(state, actorId) || !SLOTS.includes(slot)) return fail('Emplacement indisponible.');
  const inventory = normalizeInventory(state?.inventory, state);
  if (!inventory) return fail('Inventaire invalide.');
  const id = inventory.equipped[actorId]?.[slot];
  if (!id) return fail('Cet emplacement est déjà libre.');
  const returnedMods = replaceSlot(inventory, actorId, slot, null);
  state.inventory = inventory;
  return { ok: true, item: ITEMS[id], returnedMods };
}
export function buyItem(state, itemId) {
  const item = listShop(state).find(item => item.id === itemId);
  if (!item) return fail('Objet inconnu ou inventaire invalide.');
  if (!item.canBuy) return fail(item.reason);
  const inventory = normalizeInventory(state.inventory, state);
  inventory.items[itemId] = (inventory.items[itemId] || 0) + 1;
  inventory.stock[itemId] -= 1;
  state.inventory = inventory;
  state.credits -= item.cost;
  return { ok: true, item: ITEMS[itemId] };
}
export function sellItem(state, itemId) {
  if (!shopOpen(state)) return fail('Rejoignez le Normandy ou la Citadelle.');
  const inventory = normalizeInventory(state?.inventory, state);
  const item = typeof itemId === 'string' && own(ITEMS, itemId) ? ITEMS[itemId] : null;
  if (!inventory || !item) return fail('Objet inconnu ou inventaire invalide.');
  if ((inventory.items[itemId] || 0) <= allocated(inventory, itemId)) return fail('Déséquipez d’abord un exemplaire de cet objet.');
  if (!Number.isSafeInteger(state.credits) || state.credits < 0 || state.credits + item.sell > 1_000_000_000) return fail('Le solde ne peut pas être mis à jour.');
  inventory.items[itemId] -= 1;
  if (!inventory.items[itemId]) delete inventory.items[itemId];
  inventory.stock[itemId] = Math.min(MAX_STOCK, inventory.stock[itemId] + 1);
  state.inventory = inventory;
  state.credits += item.sell;
  return { ok: true, item };
}
/** One training point per ATB level after level 1; these costs are adaptation values. */
export function getTrainingOptions(state, actorId) {
  if (!knownActor(state, actorId)) return [];
  const profile = profileFor(state, actorId), inventory = normalizeInventory(state?.inventory, state);
  if (!inventory) return [];
  const training = inventory.training[actorId] || emptyTraining();
  const availablePoints = trainingBudget(state) - Object.keys(training.weights).length;
  return profile.trainableArmorWeights.map(weight => {
    const trained = training.weights[weight] === true;
    const reason = !liveActor(state, actorId) ? 'Cet équipier ne peut plus recevoir de formation.'
      : trained ? 'Formation déjà acquise.' : availablePoints < 1 ? 'Un point de formation est nécessaire.' : null;
    return { id: weight, weight, label: ARMOR_LABELS[weight], cost: 1, trained, availablePoints, canTrain: !reason, reason,
      legacyArmor: training.legacyArmor && ITEMS[training.legacyArmor]?.armorWeight === weight ? training.legacyArmor : null };
  });
}
export function trainArmor(state, actorId, weight) {
  const option = getTrainingOptions(state, actorId).find(option => option.weight === weight);
  if (!option) return fail('Cette formation ne convient pas à cet équipier.');
  if (!option.canTrain) return fail(option.reason);
  const inventory = normalizeInventory(state.inventory, state);
  const training = inventory.training[actorId] ||= emptyTraining();
  training.weights[weight] = true;
  state.inventory = inventory;
  return { ok: true, weight, cost: 1 };
}
export function loadoutBonuses(state, actorId, slotsOverride) {
  const slots = slotsOverride || equipmentFor(state, actorId);
  const total = { hp: 0, shield: 0, attack: 0, defense: 0, speed: 0, weaponHeatMultiplier: 1, weaponCoolingBonus: 0, syntheticDamageBonus: 0, organicDamageBonus: 0, shieldBypass: 0, controlResistance: 0, bioticMultiplier: 1, techMultiplier: 1 };
  for (const slot of SLOTS) {
    const item = own(ITEMS, slots[slot]) ? ITEMS[slots[slot]] : null;
    if (!item) continue;
    for (const [key, raw] of Object.entries(item.bonuses)) {
      const value = key === 'attack' && item.kind === 'weapon' && !isTrained(state, actorId, item.weaponType) ? Math.floor(raw / 2) : raw;
      if (['weaponHeatMultiplier', 'bioticMultiplier', 'techMultiplier'].includes(key)) total[key] *= value;
      else total[key] += value;
    }
  }
  total.weaponHeatMultiplier = Math.max(.4, Math.min(2, total.weaponHeatMultiplier));
  total.weaponCoolingBonus = Math.min(8, total.weaponCoolingBonus);
  total.syntheticDamageBonus = Math.min(.6, total.syntheticDamageBonus);
  total.organicDamageBonus = Math.min(.6, total.organicDamageBonus);
  total.shieldBypass = Math.min(.5, total.shieldBypass);
  total.controlResistance = Math.min(.6, total.controlResistance);
  return total;
}
function applyBonuses(base, bonus, slots, state) {
  const weapon = ITEMS[slots.weapon], profile = profileFor(state, base.id);
  return { ...base, hp: base.hp + bonus.hp, maxHp: base.maxHp + bonus.hp,
    shield: base.shield + bonus.shield, maxShield: base.maxShield + bonus.shield,
    attack: base.attack + bonus.attack, defense: base.defense + bonus.defense, speed: Math.max(.25, (base.speed || 1) + bonus.speed),
    weaponHeatMultiplier: bonus.weaponHeatMultiplier, weaponCoolingBonus: bonus.weaponCoolingBonus,
    syntheticDamageBonus: bonus.syntheticDamageBonus, organicDamageBonus: bonus.organicDamageBonus, shieldBypass: bonus.shieldBypass,
    controlResistance: Math.min(.6, (base.controlResistance || 0) + bonus.controlResistance),
    bioticMultiplier: bonus.bioticMultiplier, techMultiplier: bonus.techMultiplier,
    weaponType: weapon?.weaponType || profile?.defaultWeaponType || base.weaponType,
    weaponName: weapon?.name || base.weaponName || 'Dotation de base',
  };
}
/** Call once on baseActorFor(), never on an already equipped actor. */
export function applyLoadout(baseActor, state) {
  const slots = equipmentFor(state, baseActor.id);
  return applyBonuses(baseActor, loadoutBonuses(state, baseActor.id, slots), slots, state);
}
/** Preview never acquires, assigns or reserves an item. Ownership is not required. */
export function previewLoadout(baseActor, state, itemId, slot) {
  const inventory = normalizeInventory(state?.inventory, state);
  if (!inventory) return fail('Inventaire invalide.');
  const check = checkCompatibility(state, baseActor.id, itemId, slot, inventory);
  if (!check.ok) return check;
  const returnedMods = replaceSlot(inventory, baseActor.id, check.slot, itemId), slots = inventory.equipped[baseActor.id];
  const current = applyLoadout(baseActor, state), preview = applyBonuses(baseActor, loadoutBonuses(state, baseActor.id, slots), slots, state);
  const deltas = Object.fromEntries(['maxHp', 'maxShield', 'attack', 'defense', 'weaponHeatMultiplier', 'weaponCoolingBonus', 'syntheticDamageBonus', 'organicDamageBonus', 'shieldBypass', 'controlResistance', 'bioticMultiplier', 'techMultiplier'].map(key => [key, Math.round((preview[key] - current[key]) * 1000) / 1000]));
  return { ok: true, current, preview, deltas, warning: check.warning, item: check.item, slot: check.slot, returnedMods };
}
