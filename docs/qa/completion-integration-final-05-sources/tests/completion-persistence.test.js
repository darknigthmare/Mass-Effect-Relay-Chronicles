import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, encodeSave, decodeSave, saveTo, loadFrom, SAVE_KEY, inspectSave, readAutomaticSave,
  buyUpgrade, upgradePrice, collectSupply, winEncounter, zoneEncounters, completeZone, recruit } from '../src/state.js';
import { writeManualSave, readManualSave, MANUAL_SAVE_KEY_PREFIX } from '../src/save-slots.js';
import { buyItem, equipItem, unequipItem, sellItem, listShop, SLOTS } from '../src/loadout.js';
import { listOperations, getOperationInteraction, advanceOperation } from '../src/operations.js';
import { createCustomizationDraft, prepareCustomizationEquipment, commitCustomization, normalizeCustomization } from '../src/customization.js';
import { createCampaignExport, encodeCampaignExport, decodeCampaignExport } from '../src/completion-persistence-campaign.js';
import { actorFor } from '../src/game-data.js';

const storage = () => {
  const values = new Map();
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
};
function finish(state, zone, choice) {
  state.zone = zone; state.position = null;
  if (zone === 'citadel') for (const id of ['tali', 'garrus', 'wrex']) assert.equal(recruit(state, id), true);
  else for (const id of zoneEncounters(zone)) assert.equal(winEncounter(state, id), true);
  assert.equal(completeZone(state, zone, choice), true, zone);
  assert.ok(decodeSave(encodeSave(state)), zone);
}
function campaign(mask = 0, stop = null) {
  const state = newGame({ name: 'Camille', appearance: 'female', origin: 'colonist', psychologicalProfile: 'war-hero', classId: 'sentinel' });
  state.flags.briefed = true;
  const stages = [['eden-prime'], ['citadel'], ['therum'], ['feros', mask & 1 ? 'force' : 'save'],
    ['noveria', mask & 2 ? 'destroy' : 'release'], ['virmire', mask & 4 ? 'save-ashley' : 'save-kaidan'],
    ['ilos'], ['citadel-finale', mask & 8 ? 'focus-sovereign' : 'save-council']];
  for (const [zone, choice] of stages) { finish(state, zone, choice); if (zone === stop) break; }
  return state;
}

test('save writers reject getters, toJSON and erased undefined before executing or replacing bytes', () => {
  const store = storage(), good = newGame();
  assert.equal(saveTo(store, good), true); assert.equal(writeManualSave(store, '1', good).ok, true);
  const before = new Map(store.values); let executed = 0;
  const getter = newGame(); Object.defineProperty(getter.customization.face, 'preset', { enumerable: true, get() { executed++; return 'standard'; } });
  const serializer = newGame(); serializer.toJSON = () => { executed++; return good; };
  const erased = newGame(); erased.customization = undefined;
  for (const hostile of [getter, serializer, erased]) {
    assert.throws(() => encodeSave(hostile), TypeError);
    assert.equal(saveTo(store, hostile), false);
    assert.equal(writeManualSave(store, '1', hostile, { overwrite: true }).code, 'invalid-save');
    assert.deepEqual(store.values, before);
  }
  assert.equal(executed, 0);
});

test('save boundary refuses symbols, hidden values and array accessors without executing them', () => {
  let executed = 0;
  const hidden = newGame(); Object.defineProperty(hidden, 'future', { value: 'ME2' });
  const symbolic = newGame(); symbolic[Symbol('future')] = 'ME2';
  const getter = newGame(); Object.defineProperty(getter.party, '0', { enumerable: true, get() { executed++; return 'shepard'; } });
  for (const invalid of [hidden, symbolic, getter]) {
    assert.equal(decodeSave({ format: 'relay-chronicles', version: 1, state: invalid }), null);
    assert.throws(() => encodeSave(invalid), TypeError);
  }
  assert.equal(executed, 0);
});

test('save boundary rejects inherited array serializers and iterators before executing getters', () => {
  const store = storage(), original = newGame(); saveTo(store, original); writeManualSave(store, '1', original);
  const bytes = new Map(store.values); let reads = 0;
  const hostile = [];
  for (const key of ['toJSON', Symbol.iterator]) {
    const state = newGame(), prototype = Object.create(Array.prototype);
    Object.defineProperty(prototype, key, { get() { reads++; return key === 'toJSON' ? undefined : Array.prototype[Symbol.iterator]; } });
    Object.setPrototypeOf(state.party, prototype); hostile.push(state);
  }
  const subclass = newGame(); class Party extends Array {} Object.setPrototypeOf(subclass.party, Party.prototype); hostile.push(subclass);
  const noPrototype = newGame(); Object.setPrototypeOf(noPrototype.party, null); hostile.push(noPrototype);
  for (const state of hostile) {
    assert.equal(decodeSave({ format: 'relay-chronicles', version: 1, state }), null);
    assert.throws(() => encodeSave(state), TypeError); assert.equal(saveTo(store, state), false);
    assert.equal(writeManualSave(store, '1', state, { overwrite: true }).code, 'invalid-save'); assert.deepEqual(store.values, bytes);
  }
  assert.equal(reads, 0);
  const ordinary = newGame(); ordinary.flags = Object.assign(Object.create(null), { briefed: true }); Object.freeze(ordinary.party);
  assert.equal(decodeSave(encodeSave(ordinary)).flags.briefed, true);
});

test('manual-save option whitelist rejects hidden, symbolic and accessor fields without writing or invoking getters', () => {
  const store = storage(), original = newGame(); saveTo(store, original); writeManualSave(store, '1', original);
  const bytes = new Map(store.values); let reads = 0;
  const hidden = {}; Object.defineProperty(hidden, 'extra', { value: true });
  const hiddenAllowed = {}; Object.defineProperty(hiddenAllowed, 'overwrite', { value: true });
  const symbolic = { [Symbol('extra')]: true };
  const accessor = {}; Object.defineProperty(accessor, Symbol('extra'), { get() { reads++; return true; } });
  const inherited = Object.create({ overwrite: true });
  const directGetter = {}; Object.defineProperty(directGetter, 'name', { enumerable: true, get() { reads++; return 'Intrusion'; } });
  const cycle = { name: 'Cycle' }; cycle.extra = cycle;
  for (const options of [hidden, hiddenAllowed, symbolic, accessor, inherited, directGetter, cycle, [], { overwrite: 'true' }]) {
    assert.equal(writeManualSave(store, '2', original, options).code, 'invalid-options'); assert.deepEqual(store.values, bytes);
  }
  assert.equal(reads, 0);
  assert.equal(writeManualSave(store, '2', original, Object.assign(Object.create(null), { name: 'Compatible', overwrite: false })).ok, true);
});

test('class and zone identifiers cannot enter a save through property-key coercion', () => {
  const store = storage(), original = newGame(); saveTo(store, original); const bytes = store.getItem(SAVE_KEY);
  for (const value of [['soldier'], { toString: 'soldier' }, 1, null, false]) {
    const malformed = newGame(); malformed.classId = value;
    malformed.inventory.equipped = {}; malformed.inventory.training = {}; malformed.talents.ranks = {};
    const encoded = encodeSave(malformed);
    assert.equal(decodeSave(encoded), null); assert.equal(inspectSave(encoded).code, 'corrupt');
    assert.equal(saveTo(store, malformed), false); assert.equal(store.getItem(SAVE_KEY), bytes);
  }
  const zone = newGame(); zone.flags.briefed = true; zone.zone = ['eden-prime']; assert.equal(decodeSave(encodeSave(zone)), null);
  let reads = 0; const coercive = {}; Object.defineProperty(coercive, 'toString', { get() { reads++; return () => 'soldier'; } });
  assert.equal(newGame({ classId: coercive }).classId, 'soldier'); assert.equal(reads, 0);
});

test('automatic save diagnostics distinguish empty, corruption, future schema and inaccessible storage', () => {
  const store = storage(); assert.equal(readAutomaticSave(store).code, 'empty');
  for (const raw of ['{', 'null', JSON.stringify({ format: 'relay-chronicles', version: 99, state: newGame() })]) {
    store.setItem(SAVE_KEY, raw);
    const result = readAutomaticSave(store);
    assert.equal(result.code, raw.startsWith('{"format"') ? 'unsupported-version' : 'corrupt');
    assert.match(result.reason, /nouvelle campagne|original est conservé/);
    assert.equal(store.getItem(SAVE_KEY), raw); assert.equal(loadFrom(store), null);
    assert.ok(decodeSave(encodeSave(newGame())));
  }
  assert.equal(readAutomaticSave({ getItem() { throw Error('denied'); } }).code, 'storage-unavailable');
});

test('import diagnostics never invoke a hostile getter or alter a running campaign', () => {
  const current = campaign(0, 'citadel'), before = structuredClone(current); let reads = 0;
  const raw = { format: 'relay-chronicles', state: newGame() };
  Object.defineProperty(raw, 'version', { enumerable: true, get() { reads++; return 1; } });
  assert.equal(inspectSave(raw).code, 'corrupt'); assert.equal(reads, 0);
  assert.deepEqual(current, before);
});

test('invalid balances and incompatible armor refuse transactions before changing inventory or derived stats', () => {
  for (const value of [NaN, Infinity, -1, 1.5, 1_000_000_001]) {
    const state = newGame(); state.credits = value; const before = structuredClone(state);
    assert.equal(buyUpgrade(state, 'shepard', 'rifle').ok, false);
    assert.equal(buyUpgrade(state, 'shepard', 'medigel').ok, false);
    assert.deepEqual(state, before);
  }
  const state = newGame(); assert.equal(buyItem(state, 'onyx-turian-i').ok, true);
  const before = structuredClone(state), stats = actorFor('shepard', state);
  assert.equal(equipItem(state, 'shepard', 'onyx-turian-i', 'armor').ok, false);
  assert.deepEqual(state, before); assert.deepEqual(actorFor('shepard', state), stats);
  state.credits = 0; const poor = structuredClone(state);
  assert.equal(buyItem(state, 'heat-sink-i').ok, false); assert.equal(buyUpgrade(state, 'shepard', 'rifle').ok, false);
  assert.deepEqual(state, poor);
});

test('Michel discount changes only medigel refills, persists and leaves gear and calibrations at full price', () => {
  const state = campaign(0, 'citadel'); state.credits = 5000; state.paragon = 8; state.medigel = 3;
  const price = id => listShop(state).find(item => item.id === id).cost;
  const gearPrice = price('heat-sink-i'), calibration = upgradePrice(state, 'rifle');
  assert.equal(upgradePrice(state, 'medigel'), 50);
  for (const selected of [null, null, 'persuade', null]) {
    const entry = listOperations(state).find(item => item.id === 'citadel-doctor-michel');
    const interaction = getOperationInteraction(state, entry.id, entry.currentStep.id);
    const choice = selected || interaction.choices.find(choice => !choice.disabled && choice.id !== 'cancel').id;
    assert.equal(advanceOperation(state, entry.id, entry.currentStep.id, choice).ok, true);
  }
  assert.equal(upgradePrice(state, 'medigel'), 40); assert.equal(upgradePrice(state, 'rifle'), calibration); assert.equal(price('heat-sink-i'), gearPrice);
  let credits = state.credits; assert.equal(buyUpgrade(state, 'shepard', 'medigel').ok, true); assert.equal(state.credits, credits - 40);
  credits = state.credits; assert.equal(buyUpgrade(state, 'shepard', 'rifle').ok, true); assert.equal(state.credits, credits - calibration);
  credits = state.credits; assert.equal(buyItem(state, 'heat-sink-i').ok, true); assert.equal(state.credits, credits - gearPrice);
  assert.equal(upgradePrice(decodeSave(encodeSave(state)), 'medigel'), 40);
});

test('full armory stock rejects a sale atomically and the last free stock place updates all quantities once', () => {
  const state = newGame(); state.inventory.stock['kessler-i'] = 40;
  const validated = decodeSave(encodeSave(state)); assert.ok(validated);
  const before = structuredClone(validated), stats = actorFor('shepard', validated);
  const result = sellItem(validated, 'kessler-i'); assert.equal(result.ok, false); assert.match(result.reason, /stock.*plein/);
  assert.deepEqual(validated, before); assert.deepEqual(actorFor('shepard', validated), stats);
  validated.inventory.stock['kessler-i'] = 39; const credits = validated.credits;
  assert.equal(sellItem(validated, 'kessler-i').ok, true);
  assert.equal(validated.inventory.stock['kessler-i'], 40); assert.equal(validated.inventory.items['kessler-i'], undefined);
  assert.equal(validated.credits, credits + 28); assert.ok(decodeSave(encodeSave(validated)));
  const sold = structuredClone(validated); assert.equal(sellItem(validated, 'kessler-i').ok, false); assert.deepEqual(validated, sold);
});

test('fresh campaigns discard the previous dossier, inventory, choices and mutations', () => {
  const previous = campaign(15), clean = newGame();
  previous.name = 'Ancien'; previous.customization.armor.primary = 'purple'; previous.inventory.items['lancer-i'] = 12;
  const next = newGame(); assert.deepEqual(next, clean);
  next.inventory.items['lancer-i'] = 2; next.settings.sound = false; next.story.heard.push('unused');
  assert.deepEqual(newGame(), clean); assert.equal(previous.ending, true);
});

test('all sixteen final choice combinations export the complete ME1 dossier with an explicit unavailable continuation', () => {
  for (let mask = 0; mask < 16; mask++) {
    const state = campaign(mask), before = structuredClone(state), result = createCampaignExport(state);
    assert.equal(result.ok, true); assert.equal(result.record.version, 1);
    assert.equal(result.record.sourceMediaId, 'ME1'); assert.equal(result.record.sourcePeriodId, 'me1');
    assert.equal(result.record.continuationImplemented, false);
    assert.deepEqual(result.record.save.state, state); assert.equal(Object.keys(result.record.save.state.choices).length, 4);
    const encoded = encodeCampaignExport(state), decoded = decodeCampaignExport(encoded);
    assert.deepEqual(decoded.save.state, state); assert.equal(decodeSave(encoded), null);
    decoded.save.state.choices.feros = 'tampered'; assert.deepEqual(state, before);
  }
});

test('final exports reject unfinished, inconsistent, foreign and future records without invoking accessors', () => {
  assert.equal(createCampaignExport(newGame()).ok, false); assert.equal(encodeCampaignExport(newGame()), null);
  const good = createCampaignExport(campaign()).record;
  const invalid = [ { ...good, version: 2 }, { ...good, sourceMediaId: 'ME2' }, { ...good, sourcePeriodId: 'me3' },
    { ...good, continuationImplemented: true }, { ...good, extra: true } ];
  const missing = structuredClone(good); delete missing.save.state.choices.noveria; invalid.push(missing);
  const ongoing = structuredClone(good); ongoing.save.state.ending = false; invalid.push(ongoing);
  const malformed = structuredClone(good); malformed.save.savedAt = 'yesterday'; invalid.push(malformed);
  let reads = 0; const accessor = structuredClone(good);
  Object.defineProperty(accessor, 'version', { enumerable: true, get() { reads++; return 1; } }); invalid.push(accessor);
  for (const record of invalid) assert.equal(decodeCampaignExport(record), null);
  assert.equal(reads, 0);
});

test('supply containers stay empty through automatic, manual and JSON save round trips', () => {
  const store = storage(), state = newGame(); state.flags.briefed = true; state.zone = 'eden-prime';
  assert.deepEqual(collectSupply(state, 'eden-prime:cache'), { ok: true, credits: 100, medigel: 1 });
  assert.equal(saveTo(store, state), true); assert.equal(writeManualSave(store, '1', state).ok, true);
  for (const loaded of [loadFrom(store), readManualSave(store, '1').state, decodeSave(encodeSave(state))]) {
    const before = structuredClone(loaded); assert.equal(collectSupply(loaded, 'eden-prime:cache').ok, false);
    assert.deepEqual(loaded, before);
  }
  const fresh = newGame(); assert.equal(collectSupply(fresh, 'normandy:medbay-restock').ok, true);
  const resumed = decodeSave(encodeSave(fresh)); assert.equal(collectSupply(resumed, 'normandy:medbay-restock').ok, false);
  assert.equal(resumed.medigel, 6);
});

test('supply overflow, foreign containers and locked zones refuse the complete transaction', () => {
  for (const [zone, id, credits] of [['normandy', 'eden-prime:cache', 250], ['normandy', 'ME2:cache', 250],
    ['eden-prime', 'eden-prime:cache', 1_000_000_000], ['ilos', 'ilos:cache', 250]]) {
    const state = newGame(); state.flags.briefed = true; state.zone = zone; state.credits = credits;
    const before = structuredClone(state); assert.equal(collectSupply(state, id).ok, false); assert.deepEqual(state, before);
  }
});

test('nine-slot workshop commit preserves identity and quantities in every persistence channel', () => {
  const state = campaign(0, 'citadel'); state.zone = 'normandy'; state.credits = 20_000;
  const prepared = [['heat-sink-i','weaponMod'], ['heat-sink-i','weaponMod2'], ['armor-piercing-rounds-i','ammoMod'],
    ['armor-plating-i','armorMod'], ['armor-plating-i','armorMod2'], ['omni-tool-upgraded','omniTool'], ['biotic-amp-upgraded','bioticAmp']];
  for (const [id] of prepared) assert.equal(buyItem(state, id).ok, true);
  const before = structuredClone(state); let draft = createCustomizationDraft(state);
  draft.appearance = 'male'; draft.customization.face.preset = 'veteran'; draft.customization.armor.primary = 'purple';
  for (const [id, slot] of prepared) { const staged = prepareCustomizationEquipment(state, draft, slot, id); assert.equal(staged.ok, true); draft = staged.draft; }
  assert.deepEqual(state, before); assert.equal(Object.keys(draft.equipment).length, SLOTS.length);
  assert.equal(commitCustomization(state, draft).ok, true);
  const expected = structuredClone(state); expected.appearance = before.appearance; expected.customization = before.customization; expected.inventory = before.inventory;
  assert.deepEqual(expected, before); assert.deepEqual(state.inventory.items, before.inventory.items); assert.deepEqual(state.inventory.stock, before.inventory.stock);
  const stats = actorFor('shepard', state), store = storage(); assert.equal(saveTo(store, state), true);
  for (let index = 1; index <= 6; index++) {
    assert.equal(writeManualSave(store, String(index), state).ok, true);
    assert.deepEqual(readManualSave(store, String(index)).state, state);
  }
  for (const resumed of [loadFrom(store), decodeSave(encodeSave(state))]) {
    assert.deepEqual(resumed, state); assert.deepEqual(actorFor('shepard', resumed), stats);
  }
});

test('workshop stock races reject appearance and all slots atomically, while cancel/reset leave state intact', () => {
  const state = newGame(); state.credits = 2000; assert.equal(buyItem(state, 'heat-sink-i').ok, true);
  const original = structuredClone(state); let draft = createCustomizationDraft(state);
  draft.customization.face.preset = 'veteran'; draft.appearance = 'female';
  draft = prepareCustomizationEquipment(state, draft, 'weaponMod', 'heat-sink-i').draft;
  assert.deepEqual(state, original);
  assert.deepEqual(createCustomizationDraft(state), createCustomizationDraft(original));
  assert.equal(equipItem(state, 'kaidan', 'kessler-i', 'weapon').ok, true);
  assert.equal(equipItem(state, 'kaidan', 'heat-sink-i', 'weaponMod').ok, true);
  const current = structuredClone(state); assert.equal(commitCustomization(state, draft).ok, false); assert.deepEqual(state, current);
});

test('workshop validation options refuse accessors and malformed combat locks without running a getter', () => {
  const state = newGame(), draft = createCustomizationDraft(state), before = structuredClone(state); let reads = 0;
  const accessor = {}; Object.defineProperty(accessor, 'inCombat', { enumerable: true, get() { reads++; return false; } });
  const hidden = {}; Object.defineProperty(hidden, 'inCombat', { value: false });
  for (const options of [accessor, hidden, { inCombat: 'false' }, { unexpected: true }, null]) {
    assert.equal(commitCustomization(state, draft, options).ok, false); assert.deepEqual(state, before);
  }
  assert.equal(reads, 0); assert.equal(commitCustomization(state, draft, { inCombat: false }).ok, true);
  const hiddenPalette = structuredClone(state.customization);
  Object.defineProperty(hiddenPalette.face, 'preset', { enumerable: false, value: 'standard' });
  assert.equal(normalizeCustomization(hiddenPalette), null);
});

test('historic absent customization migrates without losing identity or progress, explicit invalid data cannot overwrite it', () => {
  const state = campaign(0, 'citadel'), packet = JSON.parse(encodeSave(state)); delete packet.state.customization;
  const migrated = decodeSave(packet); assert.ok(migrated); assert.deepEqual(migrated, state);
  const store = storage(); assert.equal(saveTo(store, migrated), true); const bytes = store.getItem(SAVE_KEY);
  for (const invalid of [null, { version: 9 }, { version: 1, face: {}, armor: {} }]) {
    const bad = { ...state, customization: invalid };
    assert.equal(saveTo(store, bad), false); assert.equal(store.getItem(SAVE_KEY), bytes);
  }
});

test('fallen crew gear remains owned, recoverable and never duplicated by export or reload', () => {
  const state = campaign(4, 'noveria'); assert.equal(equipItem(state, 'kaidan', 'kessler-i', 'weapon').ok, true);
  finish(state, 'virmire', 'save-ashley'); assert.ok(state.lost.includes('kaidan'));
  const resumed = decodeSave(encodeSave(state)); assert.ok(resumed);
  assert.equal(sellItem(resumed, 'kessler-i').ok, false);
  assert.equal(unequipItem(resumed, 'kaidan', 'weapon').ok, true);
  assert.equal(equipItem(resumed, 'shepard', 'kessler-i', 'weapon').ok, true);
  assert.equal(resumed.inventory.items['kessler-i'], 1);
  assert.equal(equipItem(resumed, 'kaidan', 'kessler-i', 'weapon').ok, false);
});
