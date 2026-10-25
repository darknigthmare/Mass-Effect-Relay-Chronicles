import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, encodeSave, decodeSave } from '../src/state.js';
import { actorFor } from '../src/game-data.js';
import { equipItem, buyItem, SLOTS, initialInventory, normalizeInventory } from '../src/loadout.js';
import {
  initialCustomization, normalizeCustomization, createCustomizationDraft,
  validateCustomizationDraft, customizationPreviewState, commitCustomization, getCustomizationPalette, prepareCustomizationEquipment,
} from '../src/customization.js';
import { hasVisualCustomization, tintCustomizationPixels } from '../src/customization-render.js';

const snapshot = state => JSON.stringify(state);
const changedDraft = state => {
  const draft = createCustomizationDraft(state);
  draft.appearance = 'female';
  draft.customization.face = { preset: 'veteran', skinTone: 'deep', eyeColor: 'green', hairColor: 'white', hairStyle: 'tied' };
  draft.customization.armor = { primary: 'alliance', secondary: 'black', accent: 'white', pattern: 'split', finish: 'matte', helmet: 'combat' };
  draft.equipment.weapon = 'kessler-i';
  return draft;
};

test('new-game cosmetic choices are copied and invalid choices use the established defaults', () => {
  const choices = initialCustomization('female'); choices.armor.primary = 'teal';
  const state = newGame({ appearance: 'female', customization: choices });
  assert.equal(state.customization.armor.primary, 'teal');
  choices.armor.primary = 'purple';
  assert.equal(state.customization.armor.primary, 'teal');
  assert.deepEqual(newGame({ appearance: 'female', customization: null }).customization, initialCustomization('female'));
  assert.deepEqual(newGame({ appearance: 'unknown', customization: null }).customization, initialCustomization('male'));
});

test('old saves migrate only an absent field and preserve progression, inventory and dossier', () => {
  const state = newGame({ name: 'Jane Shepard', appearance: 'female', origin: 'colonist', psychologicalProfile: 'war-hero' });
  const save = JSON.parse(encodeSave(state)); delete save.state.customization;
  const restored = decodeSave(save);
  assert.ok(restored); assert.deepEqual(restored, state);
  for (const invalid of [null, [], 4, {}, { ...state.customization, version: 2 }]) {
    save.state.customization = invalid;
    assert.equal(decodeSave(save), null);
  }
});

test('malformed cosmetic objects reject accessors, symbols, cycles and prototypes without executing code', () => {
  let read = false;
  const accessor = initialCustomization(); Object.defineProperty(accessor.face, 'skinTone', { enumerable: true, get() { read = true; return 'deep'; } });
  assert.equal(normalizeCustomization(accessor), null); assert.equal(read, false);
  const inherited = initialCustomization(); inherited.face = Object.create(inherited.face);
  const symbolic = initialCustomization(); symbolic.face[Symbol('extra')] = 'deep';
  const cycle = initialCustomization(); cycle.face.preset = cycle;
  const polluted = initialCustomization(); polluted.armor = JSON.parse('{"__proto__":{},"primary":"graphite"}');
  const extra = initialCustomization(); extra.face.unrecognized = true;
  for (const invalid of [inherited, symbolic, cycle, polluted, extra]) assert.equal(normalizeCustomization(invalid), null);
  const save = JSON.parse(encodeSave(newGame())); save.state.customization = accessor;
  assert.equal(decodeSave(save), null); assert.equal(read, false);
});

test('a draft and every preview are detached; cancellation requires no state rollback', () => {
  const state = newGame(), before = snapshot(state), draft = changedDraft(state);
  const preview = customizationPreviewState(state, draft);
  assert.ok(preview); assert.equal(preview.appearance, 'female');
  assert.equal(preview.inventory.equipped.shepard.weapon, 'kessler-i');
  assert.equal(snapshot(state), before);
  preview.customization.face.skinTone = 'ebony';
  preview.inventory.items['lancer-i'] = 15;
  preview.flags.briefed = true;
  assert.equal(draft.customization.face.skinTone, 'deep');
  assert.equal(snapshot(state), before);
});

test('appearance and all equipment slots apply together and survive a normal save round trip', () => {
  const state = newGame({ origin: 'earthborn', psychologicalProfile: 'ruthless' });
  const draft = changedDraft(state), prior = structuredClone(state);
  assert.equal(commitCustomization(state, draft).ok, true);
  assert.equal(state.appearance, 'female');
  assert.deepEqual(state.customization, draft.customization);
  assert.deepEqual(state.inventory.equipped.shepard, draft.equipment);
  assert.equal(state.credits, prior.credits); assert.equal(state.xp, prior.xp);
  assert.deepEqual(state.story, prior.story); assert.deepEqual(state.completed, prior.completed);
  assert.equal(state.origin, 'earthborn'); assert.equal(state.psychologicalProfile, 'ruthless');
  assert.deepEqual(decodeSave(encodeSave(state)), state);
  draft.customization.armor.primary = 'purple'; draft.equipment.weapon = null;
  assert.equal(state.customization.armor.primary, 'alliance');
  assert.equal(state.inventory.equipped.shepard.weapon, 'kessler-i');
});

test('cosmetic edits preserve second module ports and tools from the current nine-slot inventory', () => {
  const state = newGame({ classId: 'sentinel' }); state.credits = 3000;
  for (const [id, slot] of [['heat-sink-i', 'weaponMod2'], ['armor-plating-i', 'armorMod2'], ['omni-tool-upgraded', 'omniTool'], ['biotic-amp-upgraded', 'bioticAmp']]) {
    assert.equal(buyItem(state, id).ok, true); assert.equal(equipItem(state, 'shepard', id, slot).ok, true);
  }
  const inventory = structuredClone(state.inventory), draft = createCustomizationDraft(state);
  draft.customization.armor.primary = 'purple';
  assert.equal(Object.keys(draft.equipment).length, 9);
  assert.equal(commitCustomization(state, draft).ok, true);
  assert.deepEqual(state.inventory, inventory);
  assert.deepEqual(decodeSave(encodeSave(state)), state);
});

test('parent replacement and removal release all attachments in the draft and at commit without changing shared stock', () => {
  for (const replacement of ['kessler-i', null]) {
    const state = newGame(); state.credits = 3000;
    for (const [id, slot] of [['heat-sink-i', 'weaponMod'], ['heat-sink-i', 'weaponMod2'], ['armor-piercing-rounds-i', 'ammoMod']]) {
      assert.equal(buyItem(state, id).ok, true); assert.equal(equipItem(state, 'shepard', id, slot).ok, true);
    }
    const before = snapshot(state), oldInventory = structuredClone(state.inventory), draft = createCustomizationDraft(state);
    // Old callers with a directly changed parent must not transfer attachments.
    const direct = structuredClone(draft); delete direct.equipmentChanges; direct.equipment.weapon = replacement;
    const preview = customizationPreviewState(state, direct); assert.ok(preview);
    for (const slot of ['weaponMod', 'weaponMod2', 'ammoMod']) assert.equal(preview.inventory.equipped.shepard[slot], null);
    const prepared = prepareCustomizationEquipment(state, draft, 'weapon', replacement);
    assert.equal(prepared.ok, true); assert.equal(prepared.returnedMods.length, 3);
    for (const slot of ['weaponMod', 'weaponMod2', 'ammoMod']) assert.equal(prepared.draft.equipment[slot], null);
    assert.equal(snapshot(state), before);
    assert.equal(commitCustomization(state, prepared.draft).ok, true);
    assert.deepEqual(state.inventory.items, oldInventory.items); assert.deepEqual(state.inventory.stock, oldInventory.stock);
    assert.deepEqual(state.inventory.equipped.kaidan, oldInventory.equipped.kaidan);
  }
});

test('an explicitly selected owned module can be prepared again after a weapon replacement', () => {
  const state = newGame(); state.credits = 3000;
  assert.equal(buyItem(state, 'heat-sink-i').ok, true); assert.equal(equipItem(state, 'shepard', 'heat-sink-i', 'weaponMod2').ok, true);
  const weapon = prepareCustomizationEquipment(state, createCustomizationDraft(state), 'weapon', 'kessler-i');
  assert.equal(weapon.ok, true); assert.equal(weapon.draft.equipment.weaponMod2, null);
  const module = prepareCustomizationEquipment(state, weapon.draft, 'weaponMod2', 'heat-sink-i');
  assert.equal(module.ok, true); assert.equal(commitCustomization(state, module.draft).ok, true);
  assert.equal(state.inventory.equipped.shepard.weaponMod2, 'heat-sink-i');
  const invalid = createCustomizationDraft(state); invalid.equipment.weaponMod = 'heat-sink-i';
  const before = snapshot(state); assert.equal(commitCustomization(state, invalid).ok, false); assert.equal(snapshot(state), before);
});

test('the workshop preserves a historical armor exception only while the inherited armor stays equipped', () => {
  const state = newGame({ classId: 'soldier' }); state.xp = 2100;
  const old = initialInventory(); old.version = 1; delete old.training;
  for (const id of ['omni-tool-standard', 'omni-tool-upgraded', 'biotic-amp-standard', 'biotic-amp-upgraded']) delete old.stock[id];
  for (const slots of Object.values(old.equipped)) for (const slot of SLOTS) if (!['weapon', 'armor', 'weaponMod', 'ammoMod', 'armorMod'].includes(slot)) delete slots[slot];
  old.items['colossus-human-vii'] = 1; old.equipped.shepard.armor = 'colossus-human-vii';
  state.inventory = normalizeInventory(old, state); assert.ok(state.inventory);
  const cosmetic = createCustomizationDraft(state); cosmetic.customization.armor.primary = 'white';
  assert.equal(commitCustomization(state, cosmetic).ok, true);
  assert.equal(state.inventory.training.shepard.legacyArmor, 'colossus-human-vii');
  const same = prepareCustomizationEquipment(state, createCustomizationDraft(state), 'armor', 'colossus-human-vii');
  assert.equal(same.ok, true); assert.equal(same.draft.equipmentChanges.armor, undefined);
  assert.equal(commitCustomization(state, same.draft).ok, true);
  const forgedChange = createCustomizationDraft(state); forgedChange.equipmentChanges.armor = true;
  const previous = snapshot(state); assert.equal(commitCustomization(state, forgedChange).ok, false); assert.equal(snapshot(state), previous);
  const removed = prepareCustomizationEquipment(state, createCustomizationDraft(state), 'armor', null);
  assert.equal(removed.ok, true);
  const denied = prepareCustomizationEquipment(state, removed.draft, 'armor', 'colossus-human-vii');
  assert.equal(denied.ok, false); assert.match(denied.reason, /Formation/);
  assert.equal(commitCustomization(state, removed.draft).ok, true);
  assert.equal(state.inventory.training.shepard.legacyArmor, null);
});

test('customization HTML includes both second ports, tools, and parent-module return warnings', async () => {
  const { renderCustomizationScreen } = await import('../src/customization-ui.js');
  const state = newGame(); state.credits = 3000;
  assert.equal(buyItem(state, 'heat-sink-i').ok, true); assert.equal(equipItem(state, 'shepard', 'heat-sink-i', 'weaponMod2').ok, true);
  const draft = createCustomizationDraft(state), ui = { customizationDraft: draft, customTab: 'weapons', customSlot: 'weapon', customView: 'front', customShowAll: true };
  const before = snapshot(state), weapons = renderCustomizationScreen(state, ui);
  for (const slot of ['weaponMod2', 'omniTool', 'bioticAmp']) assert.ok(weapons.includes(`data-do="custom-slot" data-id="${slot}"`));
  assert.ok(weapons.includes('Les modules actuels seront remis dans le stock'));
  const armor = renderCustomizationScreen(state, { ...ui, customTab: 'armor', customSlot: 'armor' });
  assert.ok(armor.includes('data-do="custom-slot" data-id="armorMod2"'));
  assert.equal(snapshot(state), before);
});

test('cosmetics do not grant combat bonuses; weapon and module changes still affect the existing combat rules', () => {
  const state = newGame(), actor = actorFor('shepard', state), draft = changedDraft(state);
  draft.equipment = createCustomizationDraft(state).equipment;
  assert.equal(commitCustomization(state, draft).ok, true);
  assert.deepEqual(actorFor('shepard', state), { ...actor, sprite: 'femshep' });
  assert.equal(buyItem(state, 'heat-sink-i').ok, true);
  const module = createCustomizationDraft(state); module.equipment.weaponMod = 'heat-sink-i';
  assert.equal(commitCustomization(state, module).ok, true);
  assert.ok(actorFor('shepard', state).weaponHeatMultiplier < actor.weaponHeatMultiplier);
});

test('changing availability while the screen is open rejects the whole transaction', () => {
  const state = newGame(), draft = changedDraft(state);
  assert.equal(equipItem(state, 'kaidan', 'kessler-i').ok, true);
  const before = snapshot(state);
  const result = commitCustomization(state, draft);
  assert.equal(result.ok, false); assert.match(result.reason, /exemplaire/);
  assert.equal(snapshot(state), before);
});

test('unowned, wrong-slot, wrong-species and over-level items reject the entire draft', () => {
  const state = newGame();
  for (const [slot, id] of [['weapon', 'striker-iii'], ['weapon', 'onyx-human-i'], ['armor', 'onyx-turian-i'], ['weapon', 'unknown']]) {
    const draft = changedDraft(state); draft.equipment[slot] = id;
    const before = snapshot(state);
    assert.equal(validateCustomizationDraft(state, draft).ok, false);
    assert.equal(customizationPreviewState(state, draft), null);
    assert.equal(commitCustomization(state, draft).ok, false);
    assert.equal(snapshot(state), before);
  }
});

test('removing equipment is atomic and releases it for another member without selling an item', () => {
  const state = newGame(), draft = createCustomizationDraft(state);
  draft.equipment.weapon = null; draft.equipment.armor = null;
  const quantities = structuredClone(state.inventory.items);
  assert.equal(commitCustomization(state, draft).ok, true);
  assert.deepEqual(state.inventory.items, quantities);
  assert.equal(equipItem(state, 'jenkins', 'lancer-i').ok, true);
  assert.deepEqual(decodeSave(encodeSave(state)), state);
});

test('combat lock and malformed drafts leave state untouched', () => {
  const state = newGame(), before = snapshot(state), draft = changedDraft(state);
  assert.equal(commitCustomization(state, draft, { inCombat: true }).ok, false);
  const invalid = changedDraft(state); invalid.customization.armor.primary = '<script>';
  const incomplete = changedDraft(state); delete incomplete.equipment.ammoMod;
  let invoked = false; const accessor = changedDraft(state);
  Object.defineProperty(accessor, 'appearance', { get() { invoked = true; return 'female'; }, enumerable: true });
  for (const value of [null, [], invalid, incomplete, accessor]) assert.equal(commitCustomization(state, value).ok, false);
  assert.equal(invoked, false); assert.equal(snapshot(state), before);
});

const picture = () => {
  const pixels = { width: 10, height: 10, data: new Uint8ClampedArray(400) };
  const set = (x, y, rgba) => pixels.data.set(rgba, (y * 10 + x) * 4);
  set(4, 5, [100, 105, 110, 255]); set(6, 5, [158, 43, 38, 255]);
  set(4, 1, [190, 140, 108, 255]); set(6, 0, [92, 37, 25, 255]);
  set(1, 1, [230, 110, 87, 0]);
  return pixels;
};

test('default rendering preserves every pixel and colours change the shared sprite treatment without altering alpha', () => {
  const defaults = initialCustomization(), pixels = picture(), original = pixels.data.slice();
  tintCustomizationPixels(pixels, defaults);
  assert.deepEqual(pixels.data, original); assert.equal(hasVisualCustomization(defaults), false);
  const custom = initialCustomization(); custom.armor.primary = 'teal'; custom.face.skinTone = 'deep'; custom.face.hairColor = 'white';
  assert.equal(hasVisualCustomization(custom), true);
  tintCustomizationPixels(pixels, custom);
  for (let i = 3; i < original.length; i += 4) assert.equal(pixels.data[i], original[i]);
  assert.notDeepEqual(pixels.data.slice(216, 219), original.slice(216, 219));
  assert.notDeepEqual(pixels.data.slice(56, 59), original.slice(56, 59));
  assert.deepEqual(pixels.data.slice(44, 48), original.slice(44, 48));
  assert.match(getCustomizationPalette(custom).primary, /^#[0-9a-f]{6}$/);
});

test('combat-only helmets stay hidden outside combat and their front/back views differ', () => {
  const custom = initialCustomization(); custom.armor.helmet = 'combat';
  const unmodified = picture(), outside = picture(), front = picture(), back = picture();
  tintCustomizationPixels(outside, custom, { inCombat: false });
  assert.deepEqual(outside.data, unmodified.data);
  tintCustomizationPixels(front, custom, { inCombat: true, direction: 'front' });
  tintCustomizationPixels(back, custom, { inCombat: true, direction: 'back' });
  assert.notDeepEqual(front.data, unmodified.data); assert.notDeepEqual(front.data, back.data);
  assert.equal(hasVisualCustomization(custom, 'male', true), true);
});

test('world appearance switches preserve custom choices but migrate an untouched default palette', async () => {
  const { WorldView } = await import('../src/world.js');
  const world = Object.create(WorldView.prototype);
  Object.assign(world, { commanderAppearance: 'male', commanderCustomization: initialCustomization(), actors: [], battleActors: new Map(), customizationTextures: new Map() });
  world.setCommanderAppearance('female');
  assert.deepEqual(world.commanderCustomization, initialCustomization('female'));
  const custom = initialCustomization('female'); custom.face.skinTone = 'deep'; custom.armor.primary = 'purple';
  assert.equal(world.setCommanderCustomization(custom), true);
  world.setCommanderAppearance('male');
  assert.deepEqual(world.commanderCustomization, custom);
});

test('world texture cleanup restores shared atlas sources and disposes only the generated textures', async () => {
  const { WorldView } = await import('../src/world.js');
  let atlasDisposed = false, tintedDisposed = 0;
  const source = { userData: {}, dispose() { atlasDisposed = true; } };
  const tinted = { userData: { relayCustomizationSource: source }, dispose() { tintedDisposed++; } };
  const actor = { id: 'shepard', enemy: false, body: { material: { map: tinted, userData: {} } } };
  const world = Object.create(WorldView.prototype);
  Object.assign(world, { commanderAppearance: 'female', commanderCustomization: initialCustomization('female'), actors: [actor], battleActors: new Map(), customizationTextures: new Map([['frame', tinted]]) });
  world._clearCommanderTextures();
  assert.equal(actor.body.material.map, source); assert.equal(tintedDisposed, 1);
  assert.equal(atlasDisposed, false); assert.equal(world.customizationTextures.size, 0);
  world._clearCommanderTextures(); assert.equal(tintedDisposed, 1);
});
