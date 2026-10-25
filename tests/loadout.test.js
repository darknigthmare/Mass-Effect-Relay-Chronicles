import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, encodeSave, decodeSave, winEncounter } from '../src/state.js';
import { actorFor, baseActorFor } from '../src/game-data.js';
import { GEAR_CATALOG, ITEMS, SLOTS, initialInventory, normalizeInventory, inventoryCount, equipmentFor, listInventory, listShop, itemCompatibility, canEquipItem, equipItem, unequipItem, buyItem, sellItem, loadoutBonuses, applyLoadout, previewLoadout, trainArmor } from '../src/loadout.js';
import { renderLoadoutScreen, loadoutActors } from '../src/loadout-ui.js';

const snapshot = state => JSON.stringify(state);
const equippedState = () => { const state = newGame(); state.inventory ??= initialInventory(); return state; };
function seniorState() {
  const state = equippedState();
  state.xp = 2100; state.credits = 20000; state.flags.spectre = true;
  state.recruited = ['kaidan', 'jenkins', 'ashley', 'garrus', 'tali', 'wrex', 'liara'];
  return state;
}
function acquire(state, id) { assert.equal(buyItem(state, id).ok, true, id); }
function assertUnchanged(state, operation) { const before = snapshot(state); assert.equal(operation().ok, false); assert.equal(snapshot(state), before); }

test('catalogue preserves 48 historical items and adds four generic tools with nine slots', () => {
  assert.equal(GEAR_CATALOG.length, 52);
  assert.equal(new Set(GEAR_CATALOG.map(item => item.id)).size, 52);
  assert.deepEqual(Object.fromEntries(SLOTS.map(slot => [slot, GEAR_CATALOG.filter(item => item.slot === slot).length])), { weapon: 20, armor: 16, weaponMod: 4, ammoMod: 4, armorMod: 4, weaponMod2: 0, armorMod2: 0, omniTool: 2, bioticAmp: 2 });
  assert.ok(GEAR_CATALOG.every(item => item.sell < item.cost && item.sourceUrl.startsWith('https://')));
  assert.ok(GEAR_CATALOG.every(item => Object.isFrozen(item) && Object.isFrozen(item.bonuses)));
});

test('starter inventory is independent and preserves all base combat statistics', () => {
  const a = equippedState(), b = equippedState();
  assert.equal(inventoryCount(a), 5);
  const base = baseActorFor('shepard', a), actor = applyLoadout(base, a);
  for (const key of ['hp', 'maxHp', 'shield', 'maxShield', 'attack', 'defense', 'speed']) assert.equal(actor[key], base[key]);
  assert.equal(actor.weaponHeatMultiplier, 1); assert.equal(actor.weaponCoolingBonus, 0);
  a.inventory.items['kessler-i'] = 3;
  assert.equal(b.inventory.items['kessler-i'], 1);
  assert.deepEqual(actorFor('shepard', b), applyLoadout(baseActorFor('shepard', b), b));
});

test('only absent inventory migrates and a valid copy does not share references', () => {
  const state = equippedState();
  assert.deepEqual(normalizeInventory(undefined, state), initialInventory());
  for (const value of [null, [], {}, 5, { ...state.inventory, version: 3 }]) assert.equal(normalizeInventory(value, state), null);
  const copy = normalizeInventory(state.inventory, state); copy.items['kessler-i'] = 2;
  assert.equal(state.inventory.items['kessler-i'], 1);
  const save = JSON.parse(encodeSave(state)); delete save.state.inventory;
  assert.deepEqual(decodeSave(save).inventory, initialInventory());
  save.state.inventory = null; assert.equal(decodeSave(save), null);
});

test('invalid quantities, unknown items, unknown actors and duplicated equipment are rejected', () => {
  const state = equippedState();
  const changes = [
    inv => { inv.items['unknown'] = 1; }, inv => { inv.items['kessler-i'] = 0; }, inv => { inv.items['kessler-i'] = 1.5; }, inv => { inv.items['kessler-i'] = 21; },
    inv => { inv.stock['heat-sink-i'] = -1; }, inv => { delete inv.stock['heat-sink-i']; }, inv => { inv.extra = true; },
    inv => { inv.equipped.liara = { ...inv.equipped.shepard }; },
    inv => { inv.equipped.kaidan = { ...inv.equipped.shepard }; },
    inv => { inv.equipped.shepard.ammoMod = 'lancer-i'; }, inv => { delete inv.equipped.shepard.armorMod; },
  ];
  for (const change of changes) { const invalid = structuredClone(state.inventory); change(invalid); assert.equal(normalizeInventory(invalid, state), null); }
  const full = structuredClone(state.inventory);
  for (const item of GEAR_CATALOG.slice(0, 8)) full.items[item.id] = 20;
  assert.equal(normalizeInventory(full, state), null);
});

test('inventory validation rejects prototype keys, accessors, symbols and cycles without executing getters', () => {
  const state = equippedState();
  const bad = structuredClone(state.inventory); bad.items = JSON.parse('{"__proto__":1}');
  assert.equal(normalizeInventory(bad, state), null);
  const inherited = structuredClone(state.inventory); inherited.items = Object.create({ 'kessler-i': 1 });
  assert.equal(normalizeInventory(inherited, state), null);
  let accessed = false;
  const accessor = structuredClone(state.inventory); Object.defineProperty(accessor.items, 'trap', { enumerable: true, get() { accessed = true; return 1; } });
  assert.equal(normalizeInventory(accessor, state), null); assert.equal(accessed, false);
  const symbolic = structuredClone(state.inventory); symbolic.items[Symbol('x')] = 1;
  assert.equal(normalizeInventory(symbolic, state), null);
  const cycle = structuredClone(state.inventory); cycle.items.loop = cycle;
  assert.equal(normalizeInventory(cycle, state), null);
});

test('purchase spends exact credits and decrements shared stock; denied transactions are atomic', () => {
  const state = equippedState();
  acquire(state, 'heat-sink-i');
  assert.equal(state.credits, 150); assert.equal(state.inventory.items['heat-sink-i'], 1); assert.equal(state.inventory.stock['heat-sink-i'], 4);
  state.zone = 'eden-prime'; assertUnchanged(state, () => buyItem(state, 'heat-sink-i'));
  state.zone = 'normandy'; state.credits = 99; assertUnchanged(state, () => buyItem(state, 'heat-sink-i'));
  assertUnchanged(state, () => buyItem(state, 'constructor'));
  state.credits = 5000; assertUnchanged(state, () => buyItem(state, 'striker-iii'));
  state.xp = 2100; assertUnchanged(state, () => buyItem(state, 'hmwp-vii'));
  state.flags.spectre = true; acquire(state, 'hmwp-vii');
  assert.equal(state.inventory.stock['hmwp-vii'], 2);
});

test('stock and bag capacity are enforced before purchases', () => {
  const state = seniorState();
  state.inventory.stock['heat-sink-i'] = 0;
  assertUnchanged(state, () => buyItem(state, 'heat-sink-i'));
  state.inventory.stock['heat-sink-i'] = 5; state.inventory.items['heat-sink-i'] = 20;
  assertUnchanged(state, () => buyItem(state, 'heat-sink-i'));
  state.inventory = initialInventory();
  const keys = GEAR_CATALOG.filter(item => !state.inventory.items[item.id]).slice(0, 8).map(item => item.id);
  for (let i = 0; i < 7; i++) state.inventory.items[keys[i]] = 20;
  state.inventory.items[keys[7]] = 5;
  assert.equal(inventoryCount(state), 150);
  assertUnchanged(state, () => buyItem(state, 'heat-sink-i'));
});

test('equipping exchanges a slot without duplicating owned items or reserving previews', () => {
  const state = equippedState();
  assert.equal(equipItem(state, 'shepard', 'kessler-i').ok, true);
  assert.equal(inventoryCount(state), 5); assert.equal(equipmentFor(state, 'shepard').weapon, 'kessler-i');
  assert.equal(listInventory(state).find(item => item.id === 'lancer-i').available, 1);
  assert.equal(equipItem(state, 'kaidan', 'lancer-i').ok, true);
  assertUnchanged(state, () => equipItem(state, 'jenkins', 'lancer-i'));
  assertUnchanged(state, () => equipItem(state, 'shepard', 'kessler-i'));
  assertUnchanged(state, () => equipItem(state, 'liara', 'storm-i'));
  assert.equal(unequipItem(state, 'kaidan', 'weapon').ok, true);
  assert.equal(equipItem(state, 'jenkins', 'lancer-i').ok, true);
});

test('weapon training halves only the weapon attack bonus and remains visible', () => {
  const state = seniorState();
  state.classId = 'adept'; acquire(state, 'crossfire-vii');
  const check = itemCompatibility(state, 'shepard', 'crossfire-vii');
  assert.equal(check.ok, true); assert.equal(check.trained, false); assert.ok(check.warning.includes('divisé'));
  assert.equal(equipItem(state, 'shepard', 'crossfire-vii').ok, true);
  assert.equal(loadoutBonuses(state, 'shepard').attack, 5); // Crossfire is +10.
  acquire(state, 'kinetic-coil-vii'); equipItem(state, 'shepard', 'kinetic-coil-vii');
  assert.equal(loadoutBonuses(state, 'shepard').attack, 10); // Module bonus stays full.
  state.classId = 'soldier'; assert.equal(loadoutBonuses(state, 'shepard').attack, 15);
});

test('armor compatibility respects human-Asari sharing, species, class and weight unlocks', () => {
  const state = seniorState();
  assert.equal(itemCompatibility(state, 'liara', 'phoenix-human-iii').ok, true);
  assert.equal(itemCompatibility(state, 'tali', 'phoenix-human-iii').ok, false);
  assert.equal(itemCompatibility(state, 'garrus', 'onyx-turian-i').ok, true);
  assert.equal(itemCompatibility(state, 'kaidan', 'colossus-human-vii').ok, false);
  assert.equal(itemCompatibility(state, 'ashley', 'colossus-human-vii').ok, false);
  assert.equal(trainArmor(state, 'ashley', 'heavy').ok, true);
  assert.equal(itemCompatibility(state, 'ashley', 'colossus-human-vii').ok, true);
  assert.equal(itemCompatibility(state, 'wrex', 'colossus-krogan-vii').ok, false);
  assert.equal(trainArmor(state, 'wrex', 'heavy').ok, true);
  assert.equal(itemCompatibility(state, 'wrex', 'colossus-krogan-vii').ok, true);
  assert.equal(itemCompatibility(state, 'tali', 'liberator-quarian-v').ok, true);
  state.xp = 0; assert.equal(itemCompatibility(state, 'shepard', 'colossus-human-vii').ok, false);
});

test('selling equipped copies is blocked, free duplicates sell once and cannot generate profit', () => {
  const state = equippedState();
  assertUnchanged(state, () => sellItem(state, 'lancer-i'));
  const before = state.credits;
  acquire(state, 'kessler-i'); assert.equal(sellItem(state, 'kessler-i').ok, true);
  assert.equal(state.credits, before - ITEMS['kessler-i'].cost + ITEMS['kessler-i'].sell);
  assert.equal(state.inventory.items['kessler-i'], 1);
  assert.equal(sellItem(state, 'kessler-i').ok, true);
  assert.equal(state.inventory.items['kessler-i'], undefined);
  assertUnchanged(state, () => sellItem(state, 'kessler-i'));
  state.zone = 'feros'; assertUnchanged(state, () => sellItem(state, 'avenger-i'));
});

test('fallen companions retain recoverable equipment and cannot receive new gear', () => {
  const state = equippedState();
  equipItem(state, 'jenkins', 'kessler-i'); state.flags.briefed = true; state.zone = 'eden-prime';
  assert.equal(winEncounter(state, 'eden-prime:encounter-1'), true);
  assert.equal(state.lost.includes('jenkins'), true);
  assert.ok(normalizeInventory(state.inventory, state));
  assert.equal(loadoutActors(state).includes('jenkins'), true);
  assertUnchanged(state, () => equipItem(state, 'jenkins', 'storm-i'));
  assert.equal(unequipItem(state, 'jenkins', 'weapon').ok, true);
  assert.equal(loadoutActors(state).includes('jenkins'), false);
  assert.equal(equipItem(state, 'ashley', 'kessler-i').ok, true);
  assert.deepEqual(decodeSave(encodeSave(state)), state);
});

test('actual applied effects combine heat, cooling, target bonuses and defenses', () => {
  const state = seniorState();
  for (const id of ['predator-human-vii', 'frictionless-materials-viii', 'phasic-rounds-vii', 'hardened-weave-i']) { acquire(state, id); assert.equal(equipItem(state, 'shepard', id).ok, true); }
  const bonus = loadoutBonuses(state, 'shepard');
  assert.ok(Math.abs(bonus.weaponHeatMultiplier - .935) < 1e-9);
  assert.equal(bonus.weaponCoolingBonus, 2); assert.equal(bonus.shieldBypass, .2);
  assert.ok(Math.abs(bonus.controlResistance - .17) < 1e-9);
  const actor = actorFor('shepard', state), base = baseActorFor('shepard', state);
  assert.equal(actor.maxShield, base.maxShield + 65); assert.equal(actor.defense, base.defense + 3); assert.equal(actor.attack, base.attack + 4);
  acquire(state, 'tungsten-rounds-iv'); equipItem(state, 'shepard', 'tungsten-rounds-iv');
  assert.equal(actorFor('shepard', state).syntheticDamageBonus, .25);
  assert.equal(actorFor('shepard', state).shieldBypass, 0);
});

test('shop comparisons are pure, work before ownership and match equipped results', () => {
  const state = seniorState(), base = baseActorFor('shepard', state), before = snapshot(state), baseBefore = snapshot(base);
  const comparison = previewLoadout(base, state, 'crossfire-vii');
  assert.equal(comparison.ok, true); assert.equal(comparison.deltas.attack, 10);
  assert.equal(snapshot(state), before); assert.equal(snapshot(base), baseBefore);
  assert.equal(canEquipItem(state, 'shepard', 'crossfire-vii').ok, false);
  acquire(state, 'crossfire-vii'); equipItem(state, 'shepard', 'crossfire-vii');
  assert.deepEqual(actorFor('shepard', state), comparison.preview);
  assert.equal(previewLoadout(base, state, 'colossus-quarian-vii').ok, false);
});

test('renderers are pure, cover all tabs and escape the commander name', () => {
  const state = equippedState(); state.name = '<img src=x onerror=1>';
  const before = snapshot(state), options = { actorFor, baseActorFor, portraitStyle: () => '', upgradePrice: () => 50 };
  for (const tab of ['loadout', 'inventory', 'shop', 'calibrations']) {
    const html = renderLoadoutScreen(state, { equipmentActor: 'shepard', equipmentTab: tab }, options);
    assert.ok(html.includes('eq-roster')); assert.ok(!html.includes('<img src=x'));
    assert.ok(html.includes('&lt;img src=x onerror=1&gt;'));
    assert.equal(snapshot(state), before);
  }
  const shop = renderLoadoutScreen(state, { equipmentActor: 'shepard', equipmentTab: 'shop' }, options);
  assert.equal((shop.match(/<article[^>]*data-item=/g) || []).length, 52);
  assert.ok(listShop(state).find(item => item.id === 'hmwp-vii').reason);
});
