import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, encodeSave, decodeSave, winEncounter, completeZone, recruit } from '../src/state.js';
import { actorFor, baseActorFor } from '../src/game-data.js';
import { GEAR_CATALOG, ITEMS, SLOTS, initialInventory, normalizeInventory, equipmentFor, listInventory, listShop,
  itemCompatibility, canEquipItem, equipItem, unequipItem, buyItem, sellItem, getTrainingOptions, trainArmor,
  previewLoadout, loadoutBonuses } from '../src/loadout.js';

const legacySlots = ['weapon', 'armor', 'weaponMod', 'ammoMod', 'armorMod'];
const toolIds = ['omni-tool-standard', 'biotic-amp-standard', 'omni-tool-upgraded', 'biotic-amp-upgraded'];
const copy = value => structuredClone(value);
const snapshot = value => JSON.stringify(value);
function oldInventory() {
  const inventory = initialInventory();
  inventory.version = 1; delete inventory.training;
  for (const id of toolIds) delete inventory.stock[id];
  for (const slots of Object.values(inventory.equipped)) for (const slot of SLOTS) if (!legacySlots.includes(slot)) delete slots[slot];
  return inventory;
}
function seniorState(options) {
  const state = newGame(options);
  state.xp = 2100; state.credits = 20000; state.flags.spectre = true;
  state.recruited = ['kaidan', 'jenkins', 'ashley', 'garrus', 'tali', 'wrex', 'liara'];
  return state;
}
function citadelState() {
  const state = newGame(); state.flags.briefed = true; state.zone = 'eden-prime';
  for (const suffix of ['encounter-1', 'encounter-2', 'boss']) assert.equal(winEncounter(state, `eden-prime:${suffix}`), true);
  assert.equal(completeZone(state, 'eden-prime'), true);
  state.zone = 'citadel'; assert.equal(recruit(state, 'tali'), true); assert.equal(completeZone(state, 'citadel'), true);
  return state;
}
function acquire(state, id, quantity = 1) {
  for (let index = 0; index < quantity; index++) assert.equal(buyItem(state, id).ok, true, id);
}
function deniedWithoutMutation(state, operation) {
  const before = snapshot(state); assert.equal(operation().ok, false); assert.equal(snapshot(state), before);
}
const available = (state, id) => listInventory(state).find(item => item.id === id)?.available || 0;

test('v1 migration preserves historical copies and stock without replaying purchases or sales', () => {
  const state = seniorState(), old = oldInventory();
  old.items['heat-sink-i'] = 2; old.stock['heat-sink-i'] = 1; old.stock['kessler-i'] = 8;
  old.equipped.shepard.weaponMod = 'heat-sink-i';
  state.inventory = old; const before = snapshot(state);
  const migrated = normalizeInventory(old, state);
  assert.equal(migrated.version, 2); assert.equal(Object.keys(migrated.stock).length, 52);
  assert.deepEqual(migrated.items, old.items); assert.deepEqual(migrated.training, {});
  for (const [id, count] of Object.entries(old.stock)) assert.equal(migrated.stock[id], count);
  for (const id of toolIds) assert.equal(migrated.stock[id], 3);
  for (const slot of legacySlots) assert.equal(migrated.equipped.shepard[slot], old.equipped.shepard[slot]);
  for (const slot of SLOTS.filter(slot => !legacySlots.includes(slot))) assert.equal(migrated.equipped.shepard[slot], null);
  assert.equal(snapshot(state), before);
  state.inventory = migrated;
  assert.equal(available(state, 'heat-sink-i'), 1);
  const credits = state.credits;
  assert.equal(sellItem(state, 'heat-sink-i').ok, true);
  assert.equal(state.credits, credits + ITEMS['heat-sink-i'].sell);
  assert.equal(state.inventory.stock['heat-sink-i'], 2);
});

test('v1 validates its exact historical schema and eligibility before any migration', () => {
  const state = seniorState();
  const changes = [
    inv => { inv.training = {}; }, inv => { inv.stock['omni-tool-standard'] = 3; },
    inv => { inv.items['omni-tool-standard'] = 1; }, inv => { inv.equipped.shepard.weaponMod2 = null; },
    inv => { inv.equipped.shepard.weaponMod = 'heat-sink-i'; }, inv => { delete inv.stock['kessler-i']; },
    inv => { inv.equipped.shepard.armor = 'colossus-krogan-vii'; inv.items['colossus-krogan-vii'] = 1; },
  ];
  for (const change of changes) { const old = oldInventory(); change(old); assert.equal(normalizeInventory(old, state), null); }
  const oldHeavy = oldInventory(); oldHeavy.items['colossus-human-vii'] = 1; oldHeavy.equipped.shepard.armor = 'colossus-human-vii';
  assert.equal(normalizeInventory(oldHeavy, { ...state, classId: 'adept' }), null);
  assert.equal(normalizeInventory(oldHeavy, { ...state, xp: 0 }), null);
});

test('grandfathering preserves only the exact old armor until removal, then requires paid training', () => {
  const state = seniorState(), old = oldInventory();
  old.items['colossus-human-vii'] = 1; old.equipped.shepard.armor = 'colossus-human-vii';
  state.inventory = normalizeInventory(old, state);
  assert.deepEqual(state.inventory.training.shepard, { weights: {}, legacyArmor: 'colossus-human-vii' });
  assert.equal(itemCompatibility(state, 'shepard', 'colossus-human-vii').ok, true);
  assert.equal(getTrainingOptions(state, 'shepard')[0].trained, false);
  assert.equal(getTrainingOptions(state, 'shepard')[0].legacyArmor, 'colossus-human-vii');
  deniedWithoutMutation(state, () => equipItem(state, 'shepard', 'colossus-human-vii'));
  assert.ok(normalizeInventory(state.inventory, state));
  acquire(state, 'predator-human-vii');
  assert.equal(equipItem(state, 'shepard', 'predator-human-vii').ok, true);
  assert.equal(state.inventory.training.shepard.legacyArmor, null);
  deniedWithoutMutation(state, () => equipItem(state, 'shepard', 'colossus-human-vii'));
  assert.equal(trainArmor(state, 'shepard', 'heavy').ok, true);
  assert.equal(equipItem(state, 'shepard', 'colossus-human-vii').ok, true);
  assert.equal(unequipItem(state, 'shepard', 'armor').ok, true);
  assert.equal(equipItem(state, 'shepard', 'colossus-human-vii').ok, true);
});

test('grandfathering also covers eligible historical companion armor and cannot be forged for another item', () => {
  const state = seniorState(), old = oldInventory();
  old.items['colossus-turian-vii'] = 1;
  old.equipped.garrus = Object.fromEntries(legacySlots.map(slot => [slot, slot === 'armor' ? 'colossus-turian-vii' : null]));
  state.inventory = normalizeInventory(old, state);
  assert.equal(state.inventory.training.garrus.legacyArmor, 'colossus-turian-vii');
  assert.ok(normalizeInventory(state.inventory, state));
  const mismatched = copy(state.inventory); mismatched.training.garrus.legacyArmor = 'predator-turian-vii';
  assert.equal(normalizeInventory(mismatched, state), null);
  const invalidClass = copy(state.inventory); invalidClass.training.kaidan = { weights: {}, legacyArmor: 'colossus-human-vii' };
  assert.equal(normalizeInventory(invalidClass, state), null);
  assert.equal(unequipItem(state, 'garrus', 'armor').ok, true);
  assert.equal(state.inventory.training.garrus.legacyArmor, null);
  deniedWithoutMutation(state, () => equipItem(state, 'garrus', 'colossus-turian-vii'));
});

test('old orphaned modules return to available copies without changing owned or merchant quantities', () => {
  const state = newGame(), old = oldInventory();
  old.items['heat-sink-i'] = 1; old.items['armor-plating-i'] = 1;
  old.stock['heat-sink-i'] = 4; old.stock['armor-plating-i'] = 4;
  old.equipped.shepard.weapon = null; old.equipped.shepard.armor = null;
  old.equipped.shepard.weaponMod = 'heat-sink-i'; old.equipped.shepard.armorMod = 'armor-plating-i';
  state.inventory = normalizeInventory(old, state);
  assert.deepEqual(state.inventory.items, old.items);
  assert.equal(equipmentFor(state, 'shepard').weaponMod, null); assert.equal(equipmentFor(state, 'shepard').armorMod, null);
  assert.equal(available(state, 'heat-sink-i'), 1); assert.equal(available(state, 'armor-plating-i'), 1);
  assert.equal(state.inventory.stock['heat-sink-i'], 4); assert.equal(state.inventory.stock['armor-plating-i'], 4);
  deniedWithoutMutation(state, () => equipItem(state, 'shepard', 'heat-sink-i', 'weaponMod2'));
  const invalid = copy(state.inventory); invalid.equipped.shepard.weaponMod2 = 'heat-sink-i';
  assert.equal(normalizeInventory(invalid, state), null);
});

test('two mod ports reserve distinct copies across ports and actors; no duplication or selling reservations', () => {
  const state = seniorState(); acquire(state, 'heat-sink-i');
  assert.equal(equipItem(state, 'shepard', 'heat-sink-i').ok, true);
  deniedWithoutMutation(state, () => equipItem(state, 'shepard', 'heat-sink-i', 'weaponMod2'));
  acquire(state, 'heat-sink-i');
  assert.equal(equipItem(state, 'shepard', 'heat-sink-i', 'weaponMod2').ok, true);
  assert.equal(available(state, 'heat-sink-i'), 0);
  assert.equal(loadoutBonuses(state, 'shepard').weaponCoolingBonus, 2);
  assert.ok(Math.abs(loadoutBonuses(state, 'shepard').weaponHeatMultiplier - .81) < 1e-9);
  deniedWithoutMutation(state, () => sellItem(state, 'heat-sink-i'));
  assert.equal(equipItem(state, 'kaidan', 'kessler-i').ok, true);
  deniedWithoutMutation(state, () => equipItem(state, 'kaidan', 'heat-sink-i'));
  assert.equal(unequipItem(state, 'shepard', 'weaponMod2').ok, true);
  assert.equal(equipItem(state, 'kaidan', 'heat-sink-i').ok, true);
  const invalid = copy(state.inventory); invalid.equipped.shepard.weaponMod2 = 'heat-sink-i';
  assert.equal(normalizeInventory(invalid, state), null);
  deniedWithoutMutation(state, () => equipItem(state, 'shepard', 'heat-sink-i', 'armorMod2'));
  deniedWithoutMutation(state, () => equipItem(state, 'shepard', 'heat-sink-i', 'constructor'));
});

test('weapon preview and replacement release both weapon mods and ammunition atomically', () => {
  const state = seniorState();
  acquire(state, 'heat-sink-i', 2); acquire(state, 'armor-piercing-rounds-i');
  equipItem(state, 'shepard', 'heat-sink-i'); equipItem(state, 'shepard', 'heat-sink-i', 'weaponMod2');
  equipItem(state, 'shepard', 'armor-piercing-rounds-i');
  const before = snapshot(state), base = baseActorFor('shepard', state);
  const preview = previewLoadout(base, state, 'kessler-i');
  assert.equal(preview.ok, true); assert.equal(snapshot(state), before);
  assert.deepEqual(preview.returnedMods, ['heat-sink-i', 'heat-sink-i', 'armor-piercing-rounds-i']);
  assert.equal(preview.preview.weaponCoolingBonus, 0); assert.equal(preview.preview.syntheticDamageBonus, 0);
  assert.equal(preview.preview.weaponType, 'pistol'); assert.equal(preview.preview.weaponName, 'Kessler I');
  const same = previewLoadout(base, state, 'lancer-i');
  assert.deepEqual(same.returnedMods, []); assert.equal(same.preview.weaponCoolingBonus, 2);
  deniedWithoutMutation(state, () => equipItem(state, 'shepard', 'lancer-i'));
  const owned = copy(state.inventory.items), stock = copy(state.inventory.stock), result = equipItem(state, 'shepard', 'kessler-i');
  assert.deepEqual(result.returnedMods, preview.returnedMods);
  assert.deepEqual(actorFor('shepard', state), preview.preview);
  assert.deepEqual(state.inventory.items, owned); assert.deepEqual(state.inventory.stock, stock);
  assert.equal(available(state, 'heat-sink-i'), 2); assert.equal(available(state, 'armor-piercing-rounds-i'), 1);
});

test('armor replacement and removal release only armor modules, including fallen companions gear', () => {
  const state = seniorState();
  for (const id of ['armor-plating-i', 'shield-battery-i', 'phoenix-human-iii', 'heat-sink-i']) acquire(state, id);
  equipItem(state, 'shepard', 'armor-plating-i'); equipItem(state, 'shepard', 'shield-battery-i', 'armorMod2');
  equipItem(state, 'shepard', 'heat-sink-i');
  const comparison = previewLoadout(baseActorFor('shepard', state), state, 'phoenix-human-iii');
  assert.deepEqual(comparison.returnedMods, ['armor-plating-i', 'shield-battery-i']);
  assert.equal(equipItem(state, 'shepard', 'phoenix-human-iii').ok, true);
  assert.deepEqual(actorFor('shepard', state), comparison.preview);
  assert.equal(equipmentFor(state, 'shepard').weaponMod, 'heat-sink-i');
  equipItem(state, 'jenkins', 'kessler-i'); equipItem(state, 'jenkins', 'onyx-human-i');
  equipItem(state, 'jenkins', 'armor-plating-i'); equipItem(state, 'jenkins', 'shield-battery-i', 'armorMod2');
  state.lost.push('jenkins');
  deniedWithoutMutation(state, () => equipItem(state, 'jenkins', 'storm-i'));
  const stock = copy(state.inventory.stock), owned = copy(state.inventory.items);
  assert.deepEqual(unequipItem(state, 'jenkins', 'armor').returnedMods, ['armor-plating-i', 'shield-battery-i']);
  assert.deepEqual(state.inventory.stock, stock); assert.deepEqual(state.inventory.items, owned);
  assert.equal(available(state, 'armor-plating-i'), 1); assert.equal(available(state, 'shield-battery-i'), 1);
  assert.ok(normalizeInventory(state.inventory, state));
});

test('explicit armor training spends the per-actor ATB level budget without automatic grants', () => {
  const state = seniorState();
  assert.equal(itemCompatibility(state, 'shepard', 'colossus-human-vii').ok, false);
  assert.equal(itemCompatibility(state, 'garrus', 'colossus-turian-vii').ok, false);
  assert.equal(trainArmor(state, 'shepard', 'heavy').ok, true);
  assert.equal(getTrainingOptions(state, 'shepard')[0].availablePoints, 6);
  assert.equal(getTrainingOptions(state, 'ashley')[0].availablePoints, 7);
  assert.equal(itemCompatibility(state, 'shepard', 'colossus-human-vii').ok, true);
  assert.equal(trainArmor(state, 'garrus', 'medium').ok, true);
  assert.equal(itemCompatibility(state, 'garrus', 'colossus-turian-vii').ok, true);
  deniedWithoutMutation(state, () => trainArmor(state, 'shepard', 'heavy'));
  deniedWithoutMutation(state, () => trainArmor(state, 'kaidan', 'heavy'));
  deniedWithoutMutation(state, () => trainArmor(state, 'garrus', 'heavy'));
  state.lost.push('ashley'); deniedWithoutMutation(state, () => trainArmor(state, 'ashley', 'heavy'));
  const novice = newGame(); novice.xp = 299;
  deniedWithoutMutation(novice, () => trainArmor(novice, 'shepard', 'heavy'));
  novice.xp = 300; assert.equal(trainArmor(novice, 'shepard', 'heavy').ok, true);
  assert.equal(getTrainingOptions(novice, 'shepard')[0].availablePoints, 0);
});

test('training and new-slot validation rejects malformed, unsupported and overspent state', () => {
  const state = seniorState(), changes = [
    inv => { inv.training.shepard = { weights: { medium: true }, legacyArmor: null }; },
    inv => { inv.training.shepard = { weights: { heavy: false }, legacyArmor: null }; },
    inv => { inv.training.shepard = { weights: { heavy: 1 }, legacyArmor: null }; },
    inv => { inv.training.kaidan = { weights: { heavy: true }, legacyArmor: null }; },
    inv => { inv.training.unknown = { weights: {}, legacyArmor: null }; },
    inv => { inv.training.shepard = { weights: {}, legacyArmor: 'colossus-human-vii' }; },
    inv => { inv.training.shepard = { weights: {}, legacyArmor: null, extra: true }; },
    inv => { delete inv.equipped.shepard.weaponMod2; }, inv => { inv.equipped.shepard.omniTool = 'lancer-i'; },
    inv => { inv.equipped.shepard.unknown = null; }, inv => { inv.stock['omni-tool-standard'] = 41; },
  ];
  for (const change of changes) { const inv = initialInventory(); change(inv); assert.equal(normalizeInventory(inv, state), null); }
  const overspent = initialInventory(); overspent.training.shepard = { weights: { heavy: true }, legacyArmor: null };
  assert.equal(normalizeInventory(overspent, { ...state, xp: 299 }), null);
  let accessed = false;
  const getter = initialInventory(); Object.defineProperty(getter.training, 'shepard', { enumerable: true, get() { accessed = true; return {}; } });
  assert.equal(normalizeInventory(getter, state), null); assert.equal(accessed, false);
  const hidden = initialInventory(); Object.defineProperty(hidden.equipped.shepard, 'extra', { value: 1 });
  assert.equal(normalizeInventory(hidden, state), null);
  const proto = initialInventory(); proto.training = JSON.parse('{"__proto__":{}}');
  assert.equal(normalizeInventory(proto, state), null);
  const cyclic = initialInventory(); cyclic.training.loop = cyclic.training;
  assert.equal(normalizeInventory(cyclic, state), null);
});

test('tools use capabilities, preserve neutral kits and never grant powers or cross-buff another family', () => {
  for (const classId of ['soldier', 'engineer', 'adept', 'infiltrator', 'vanguard', 'sentinel']) {
    const state = newGame({ classId }), slots = equipmentFor(state, 'shepard');
    assert.equal(slots.omniTool, null); assert.equal(slots.bioticAmp, null);
    const base = baseActorFor('shepard', state), actual = actorFor('shepard', state);
    for (const key of ['attack', 'defense', 'hp', 'shield']) assert.equal(actual[key], base[key]);
    assert.deepEqual(actual.powers, base.powers);
  }
  const state = seniorState(); acquire(state, 'omni-tool-upgraded'); acquire(state, 'biotic-amp-upgraded');
  deniedWithoutMutation(state, () => equipItem(state, 'shepard', 'omni-tool-upgraded'));
  deniedWithoutMutation(state, () => equipItem(state, 'tali', 'biotic-amp-upgraded'));
  assert.equal(equipItem(state, 'liara', 'omni-tool-upgraded').ok, true);
  const liaraBase = baseActorFor('liara', state), liara = actorFor('liara', state);
  assert.deepEqual(liara.powers, liaraBase.powers); assert.equal(liara.bioticMultiplier, 1); assert.equal(liara.techMultiplier, 1.15);
  assert.equal(equipItem(state, 'liara', 'biotic-amp-upgraded').ok, true);
  assert.equal(actorFor('liara', state).bioticMultiplier, 1.15);
  assert.equal(unequipItem(state, 'liara', 'omniTool').ok, true);
  assert.equal(equipItem(state, 'kaidan', 'omni-tool-upgraded').ok, true);
  assert.equal(actorFor('kaidan', state).techMultiplier, 1.15); assert.equal(actorFor('kaidan', state).bioticMultiplier, 1);
  assert.equal(listShop(state).find(item => item.id === 'omni-tool-upgraded').stock, 2);
});

test('full save migration, export and reload preserve v1 armor exception then v2 training and purchases', () => {
  const state = citadelState(); state.xp = 1800;
  const old = oldInventory(); old.items['colossus-human-vii'] = 1; old.equipped.shepard.armor = 'colossus-human-vii';
  old.stock['colossus-human-vii'] = 1; old.stock['heat-sink-i'] = 3; old.items['heat-sink-i'] = 2;
  old.equipped.shepard.weaponMod = 'heat-sink-i'; state.inventory = old;
  const credits = state.credits;
  const migrated = decodeSave(encodeSave(state));
  assert.ok(migrated); assert.equal(migrated.credits, credits); assert.equal(migrated.inventory.version, 2);
  assert.equal(migrated.inventory.training.shepard.legacyArmor, 'colossus-human-vii');
  assert.deepEqual(migrated.inventory.items, old.items); assert.equal(migrated.inventory.stock['colossus-human-vii'], 1);
  assert.deepEqual(decodeSave(encodeSave(migrated)), migrated);
  assert.equal(trainArmor(migrated, 'shepard', 'heavy').ok, true);
  assert.equal(equipItem(migrated, 'shepard', 'heat-sink-i', 'weaponMod2').ok, true);
  acquire(migrated, 'omni-tool-upgraded'); equipItem(migrated, 'kaidan', 'omni-tool-upgraded');
  const reloaded = decodeSave(encodeSave(migrated)); assert.deepEqual(reloaded, migrated);
  assert.deepEqual(actorFor('shepard', reloaded), actorFor('shepard', migrated));
  assert.equal(actorFor('kaidan', reloaded).techMultiplier, 1.15);
  assert.equal(reloaded.credits, credits - 240);
});
