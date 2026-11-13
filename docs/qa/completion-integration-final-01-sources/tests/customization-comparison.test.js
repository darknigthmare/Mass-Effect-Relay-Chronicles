import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, encodeSave, decodeSave } from '../src/state.js';
import { actorFor } from '../src/game-data.js';
import { buyItem, equipItem, SLOTS } from '../src/loadout.js';
import {
  createCustomizationDraft, prepareCustomizationEquipment,
  customizationPreviewState, commitCustomization,
} from '../src/customization.js';
import { renderCustomizationScreen } from '../src/customization-ui.js';

const snapshot = value => JSON.stringify(value);
const close = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-10,
  `${message || 'value'}: expected ${expected}, received ${actual}`);

function fixture(classId = 'sentinel') {
  const state = newGame({ classId });
  state.credits = 3000;
  return state;
}

function buy(state, ...ids) {
  for (const id of ids) {
    const result = buyItem(state, id);
    assert.equal(result.ok, true, `${id}: ${result.reason || 'purchase'}`);
  }
}

function equip(state, actorId, id, slot) {
  const result = equipItem(state, actorId, id, slot);
  assert.equal(result.ok, true, `${actorId}/${slot}/${id}: ${result.reason || 'equip'}`);
}

function prepare(state, draft, slot, id) {
  const result = prepareCustomizationEquipment(state, draft, slot, id);
  assert.equal(result.ok, true, `${slot}/${id}: ${result.reason || 'prepare'}`);
  return result.draft;
}

function uiFor(state, draft = createCustomizationDraft(state), options = {}) {
  return {
    customizationDraft: draft, customTab: 'weapons', customSlot: 'weapon',
    customItem: null, customView: 'front', customCompare: false,
    customShowAll: true, customWeaponFilter: 'all', ...options,
  };
}

// Read the public data attributes used by the browser UI without requiring a
// DOM implementation or tying these assertions to the surrounding layout.
function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g)]
    .map(([, name, , value]) => [name, value]));
}

function tagged(html, attribute, value) {
  return [...html.matchAll(/<[A-Za-z][^>]*>/g)]
    .map(match => ({ tag: match[0], index: match.index, attrs: attributes(match[0]) }))
    .filter(element => Object.hasOwn(element.attrs, attribute)
      && (value === undefined || element.attrs[attribute] === value));
}

function stat(html, key, attribute = 'data-stat') {
  const matches = tagged(html, attribute, key);
  assert.equal(matches.length, 1, `one ${attribute}=${key} comparison`);
  const { attrs } = matches[0];
  assert.ok(Object.hasOwn(attrs, 'data-before') && Object.hasOwn(attrs, 'data-after'),
    `${key} exposes both real values`);
  const before = Number(attrs['data-before']), after = Number(attrs['data-after']);
  assert.ok(Number.isFinite(before) && Number.isFinite(after), `${key} values are finite`);
  return { before, after };
}

function expectStat(html, key, before, after, attribute = 'data-stat') {
  const values = stat(html, key, attribute);
  close(values.before, before, `${key} before`);
  close(values.after, after, `${key} after`);
}

function inspection(html) {
  const matches = tagged(html, 'data-custom-inspection');
  assert.equal(matches.length, 1, 'one individual equipment inspector');
  const element = matches[0], name = /^<([A-Za-z][\w:-]*)/.exec(element.tag)[1];
  const tags = new RegExp(`<\\/?${name}\\b[^>]*>`, 'g');
  tags.lastIndex = element.index;
  let depth = 0, end = -1;
  for (let match; (match = tags.exec(html));) {
    if (match[0].startsWith('</')) depth--;
    else if (!match[0].endsWith('/>')) depth++;
    if (depth === 0) { end = tags.lastIndex; break; }
  }
  assert.ok(end > element.index, 'inspector has a complete element');
  return { ...element, html: html.slice(element.index, end) };
}

function expectInspection(html, id, slot, status) {
  const result = inspection(html);
  assert.equal(result.attrs['data-custom-inspection'], id);
  assert.equal(result.attrs['data-inspection-id'], id);
  assert.equal(result.attrs['data-inspection-slot'], slot);
  assert.equal(result.attrs['data-inspection-status'], status);
  return result;
}

test('the workshop displays the actual technological and biotic tool multipliers before applying', () => {
  const state = fixture();
  buy(state, 'omni-tool-upgraded', 'biotic-amp-upgraded');
  const before = snapshot(state);
  let draft = createCustomizationDraft(state);
  draft = prepare(state, draft, 'omniTool', 'omni-tool-upgraded');
  draft = prepare(state, draft, 'bioticAmp', 'biotic-amp-upgraded');
  const draftBefore = snapshot(draft), projected = actorFor('shepard', customizationPreviewState(state, draft));
  close(projected.techMultiplier, 1.15);
  close(projected.bioticMultiplier, 1.15);
  const html = renderCustomizationScreen(state, uiFor(state, draft, { customSlot: 'omniTool' }));
  expectStat(html, 'techMultiplier', 1, 1.15);
  expectStat(html, 'bioticMultiplier', 1, 1.15);
  assert.match(html, /×\s*1,00/);
  assert.match(html, /×\s*1,15/);
  expectInspection(html, 'omni-tool-upgraded', 'omniTool', 'prepared');
  assert.equal(Object.keys(draft.equipment).length, SLOTS.length);
  assert.equal(snapshot(state), before);
  assert.equal(snapshot(draft), draftBefore);
});

test('tool comparisons survive apply and save/reload and return to one after removal without accumulating', () => {
  let state = fixture();
  buy(state, 'omni-tool-upgraded', 'biotic-amp-upgraded');
  const possessions = snapshot({ items: state.inventory.items, stock: state.inventory.stock, credits: state.credits });
  for (let cycle = 0; cycle < 2; cycle++) {
    let draft = createCustomizationDraft(state);
    draft = prepare(state, draft, 'omniTool', 'omni-tool-upgraded');
    draft = prepare(state, draft, 'bioticAmp', 'biotic-amp-upgraded');
    assert.equal(commitCustomization(state, draft).ok, true);
    state = decodeSave(encodeSave(state));
    assert.ok(state, 'applied configuration remains a valid save');
    const applied = renderCustomizationScreen(state, uiFor(state));
    expectStat(applied, 'techMultiplier', 1.15, 1.15);
    expectStat(applied, 'bioticMultiplier', 1.15, 1.15);
    assert.deepEqual(Object.keys(state.inventory.equipped.shepard).sort(), [...SLOTS].sort());
    draft = prepare(state, createCustomizationDraft(state), 'omniTool', null);
    draft = prepare(state, draft, 'bioticAmp', null);
    const removal = renderCustomizationScreen(state, uiFor(state, draft));
    expectStat(removal, 'techMultiplier', 1.15, 1);
    expectStat(removal, 'bioticMultiplier', 1.15, 1);
    assert.equal(commitCustomization(state, draft).ok, true);
    state = decodeSave(encodeSave(state));
    assert.ok(state, 'removed tools remain a valid save');
    close(actorFor('shepard', state).techMultiplier, 1);
    close(actorFor('shepard', state).bioticMultiplier, 1);
  }
  assert.equal(snapshot({ items: state.inventory.items, stock: state.inventory.stock, credits: state.credits }), possessions);
});

test('inspecting a second tool compares against the prepared draft without preparing or reserving it', () => {
  const state = fixture();
  buy(state, 'omni-tool-upgraded', 'biotic-amp-upgraded');
  const draft = prepare(state, createCustomizationDraft(state), 'omniTool', 'omni-tool-upgraded');
  const before = snapshot({ state, draft });
  const ui = uiFor(state, draft, { customSlot: 'bioticAmp', customItem: 'biotic-amp-upgraded' });
  for (let attempt = 0; attempt < 2; attempt++) {
    const html = renderCustomizationScreen(state, ui);
    expectStat(html, 'techMultiplier', 1, 1.15);
    expectStat(html, 'bioticMultiplier', 1, 1);
    const detail = expectInspection(html, 'biotic-amp-upgraded', 'bioticAmp', 'available');
    expectStat(detail.html, 'bioticMultiplier', 1, 1.15, 'data-item-stat');
    assert.equal(draft.equipment.bioticAmp, null);
    assert.equal(snapshot({ state, draft }), before);
  }
});

test('unowned, incompatible and ally-reserved equipment explains unavailability without hypothetical stats', () => {
  const cases = [
    { name: 'unowned', state: fixture(), id: 'omni-tool-upgraded', slot: 'omniTool' },
    { name: 'non-biotic class', state: fixture('soldier'), id: 'biotic-amp-upgraded', slot: 'bioticAmp', purchase: true },
    { name: 'reserved by Kaidan', state: fixture(), id: 'biotic-amp-upgraded', slot: 'bioticAmp', purchase: true, reserve: true },
  ];
  for (const scenario of cases) {
    const { state, id, slot } = scenario;
    if (scenario.purchase) buy(state, id);
    if (scenario.reserve) equip(state, 'kaidan', id, slot);
    const draft = createCustomizationDraft(state), before = snapshot({ state, draft });
    const html = renderCustomizationScreen(state, uiFor(state, draft, { customSlot: slot, customItem: id }));
    const detail = expectInspection(html, id, slot, 'unavailable');
    assert.equal(tagged(detail.html, 'data-item-stat').length, 0, `${scenario.name}: no invalid hypothetical actor`);
    assert.match(detail.html, /inventaire|exemplaire|posséd|acqu|biotique/i, `${scenario.name}: a reason is visible`);
    expectStat(html, 'techMultiplier', 1, 1);
    expectStat(html, 'bioticMultiplier', 1, 1);
    assert.equal(snapshot({ state, draft }), before, scenario.name);
  }
});

test('inspection revalidates an open draft when another character takes its sole tool', () => {
  const state = fixture();
  buy(state, 'biotic-amp-upgraded');
  const draft = prepare(state, createCustomizationDraft(state), 'bioticAmp', 'biotic-amp-upgraded');
  equip(state, 'kaidan', 'biotic-amp-upgraded', 'bioticAmp');
  assert.equal(customizationPreviewState(state, draft), null);
  const before = snapshot({ state, draft });
  const html = renderCustomizationScreen(state, uiFor(state, draft,
    { customSlot: 'bioticAmp', customItem: 'biotic-amp-upgraded' }));
  const detail = expectInspection(html, 'biotic-amp-upgraded', 'bioticAmp', 'unavailable');
  assert.equal(tagged(detail.html, 'data-item-stat').length, 0);
  assert.equal(snapshot({ state, draft }), before);
});

test('inspecting a replacement weapon accounts for all returned attachments without changing either loadout', () => {
  const state = fixture();
  buy(state, 'heat-sink-i', 'heat-sink-i', 'armor-piercing-rounds-i');
  equip(state, 'shepard', 'heat-sink-i', 'weaponMod');
  equip(state, 'shepard', 'heat-sink-i', 'weaponMod2');
  equip(state, 'shepard', 'armor-piercing-rounds-i', 'ammoMod');
  const draft = createCustomizationDraft(state), before = snapshot({ state, draft });
  const html = renderCustomizationScreen(state, uiFor(state, draft,
    { customSlot: 'weapon', customItem: 'kessler-i' }));
  expectStat(html, 'weaponHeatMultiplier', .81, .81);
  expectStat(html, 'weaponCoolingBonus', 2, 2);
  const detail = expectInspection(html, 'kessler-i', 'weapon', 'available');
  expectStat(detail.html, 'weaponHeatMultiplier', .81, 1, 'data-item-stat');
  expectStat(detail.html, 'weaponCoolingBonus', 2, 0, 'data-item-stat');
  expectStat(detail.html, 'syntheticDamageBonus', .15, 0, 'data-item-stat');
  assert.match(detail.html, /Dissipateur thermique I/);
  assert.match(detail.html, /Munitions perforantes I/);
  assert.equal(snapshot({ state, draft }), before);
});

test('inspecting a replacement armor includes both released armor modules in the hypothetical values', () => {
  const state = fixture();
  state.xp = 300;
  buy(state, 'shield-battery-i', 'armor-plating-i', 'phoenix-human-iii');
  equip(state, 'shepard', 'shield-battery-i', 'armorMod');
  equip(state, 'shepard', 'armor-plating-i', 'armorMod2');
  const draft = createCustomizationDraft(state), current = actorFor('shepard', state);
  const before = snapshot({ state, draft });
  const html = renderCustomizationScreen(state, uiFor(state, draft,
    { customTab: 'armor', customSlot: 'armor', customItem: 'phoenix-human-iii' }));
  const detail = expectInspection(html, 'phoenix-human-iii', 'armor', 'available');
  expectStat(detail.html, 'maxHp', current.maxHp, current.maxHp + 15, 'data-item-stat');
  expectStat(detail.html, 'maxShield', current.maxShield, current.maxShield - 25 + 15, 'data-item-stat');
  expectStat(detail.html, 'defense', current.defense, current.defense - 3 + 1, 'data-item-stat');
  assert.match(detail.html, /Batterie de bouclier I/);
  assert.match(detail.html, /Plaques de blindage I/);
  assert.equal(snapshot({ state, draft }), before);
});

test('an empty active port stays empty and a stale inspected item falls back to that port rather than the weapon', () => {
  const state = fixture();
  buy(state, 'shield-battery-i');
  equip(state, 'shepard', 'shield-battery-i', 'armorMod2');
  const draft = createCustomizationDraft(state), before = snapshot({ state, draft });
  for (const customItem of [null, 'lancer-i']) {
    const html = renderCustomizationScreen(state, uiFor(state, draft, { customSlot: 'omniTool', customItem }));
    const detail = expectInspection(html, '', 'omniTool', 'empty');
    assert.equal(tagged(detail.html, 'data-item-stat').length, 0);
    assert.doesNotMatch(detail.html, /Lancer I/);
  }
  const occupied = renderCustomizationScreen(state, uiFor(state, draft,
    { customTab: 'armor', customSlot: 'armorMod2', customItem: 'lancer-i' }));
  expectInspection(occupied, 'shield-battery-i', 'armorMod2', 'prepared');
  const wrongTabSlot = renderCustomizationScreen(state, uiFor(state, draft,
    { customTab: 'armor', customSlot: 'weapon', customItem: 'lancer-i' }));
  expectInspection(wrongTabSlot, 'onyx-human-i', 'armor', 'prepared');
  assert.equal(snapshot({ state, draft }), before);
});

test('unknown inspected identifiers are not interpolated as markup and preserve the valid active item', () => {
  const state = fixture();
  state.name = '<img src=x>';
  const draft = createCustomizationDraft(state), before = snapshot({ state, draft });
  const html = renderCustomizationScreen(state, uiFor(state, draft,
    { customItem: '\"><img src=x onerror=alert(1)>' }));
  expectInspection(html, 'lancer-i', 'weapon', 'prepared');
  assert.match(html, /&lt;img src=x&gt;/);
  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /onerror=alert\(1\)/);
  assert.equal(snapshot({ state, draft }), before);
});
