import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, encodeSave, decodeSave } from '../src/state.js';
import { actorFor } from '../src/game-data.js';
import { buyItem } from '../src/loadout.js';
import { CUSTOMIZATION_OPTIONS, createCustomizationDraft, commitCustomization, prepareCustomizationEquipment, customizationPreviewState } from '../src/customization.js';
import { customizationFaceSVG } from '../src/customization-ui.js';

// These checks fill gaps in the original transactional tests: actual portrait
// drawing content, each persisted face enum, and accessors in equipmentChanges.
test('portrait drawing restores every preset and exposes each skin and eye colour without combat changes', () => {
  for (const appearance of ['male', 'female']) {
    const state = newGame({ appearance }), actor = actorFor('shepard', state);
    const draft = createCustomizationDraft(state), initial = customizationFaceSVG(draft);
    const drawings = new Set();
    for (const option of CUSTOMIZATION_OPTIONS.facePresets) {
      draft.customization.face.preset = option.id;
      drawings.add(customizationFaceSVG(draft));
      draft.customization.face.preset = 'standard';
      assert.equal(customizationFaceSVG(draft), initial);
    }
    assert.equal(drawings.size, CUSTOMIZATION_OPTIONS.facePresets.length);
    for (const [category, key] of [['skinTones', 'skinTone'], ['eyeColors', 'eyeColor']]) {
      const drawings = new Set();
      for (const option of CUSTOMIZATION_OPTIONS[category]) {
        draft.customization.face[key] = option.id;
        const svg = customizationFaceSVG(draft); drawings.add(svg);
        assert.ok(svg.includes(key === 'eyeColor' ? `<g fill="${option.color}"><ellipse` : `stop-color="${option.color}"`));
        assert.equal(commitCustomization(state, draft).ok, true);
        assert.equal(decodeSave(encodeSave(state)).customization.face[key], option.id);
        assert.deepEqual(actorFor('shepard', state), actor);
      }
      assert.equal(drawings.size, CUSTOMIZATION_OPTIONS[category].length);
    }
  }
});

test('hair style and colour remain independent in every portrait combination and invalid face enums are refused', () => {
  const state = newGame(), draft = createCustomizationDraft(state);
  for (const style of CUSTOMIZATION_OPTIONS.hairStyles) {
    draft.customization.face.hairStyle = style.id;
    const drawings = new Set();
    for (const colour of CUSTOMIZATION_OPTIONS.hairColors) {
      draft.customization.face.hairColor = colour.id;
      assert.equal(draft.customization.face.hairStyle, style.id);
      const svg = customizationFaceSVG(draft); drawings.add(svg);
      assert.ok(svg.includes(`fill="${colour.color}"`));
      assert.equal(commitCustomization(state, draft).ok, true);
      const resumed = decodeSave(encodeSave(state));
      assert.equal(resumed.customization.face.hairStyle, style.id);
      assert.equal(resumed.customization.face.hairColor, colour.id);
    }
    assert.equal(drawings.size, CUSTOMIZATION_OPTIONS.hairColors.length);
  }
  for (const key of Object.keys(state.customization.face)) {
    const packet = JSON.parse(encodeSave(state)); packet.state.customization.face[key] = 'not-a-choice';
    assert.equal(decodeSave(packet), null, `${key}: present unknown enum is not a migration`);
  }
});

test('equipmentChanges nested accessors and invalid markers are refused before code execution or transaction mutation', () => {
  const state = newGame(), before = structuredClone(state); let reads = 0;
  for (const key of ['weapon', 'armor', 'weaponMod2', 'armorMod2']) {
    const draft = createCustomizationDraft(state);
    Object.defineProperty(draft.equipmentChanges, key, { enumerable: true, get() { reads++; return true; } });
    assert.equal(commitCustomization(state, draft).ok, false);
    assert.deepEqual(state, before);
  }
  for (const changes of [{ weapon: false }, { torso: true }, [], { weapon: 'true' }]) {
    const draft = createCustomizationDraft(state); draft.equipmentChanges = changes;
    assert.equal(commitCustomization(state, draft).ok, false); assert.deepEqual(state, before);
  }
  assert.equal(reads, 0);
});

test('both weapon upgrade ports reject owned armor and ammunition modules; removing an armor module preserves its quantity', () => {
  const state = newGame(); state.credits = 1000;
  for (const id of ['armor-plating-i', 'armor-piercing-rounds-i']) assert.equal(buyItem(state, id).ok, true);
  const before = structuredClone(state), draft = createCustomizationDraft(state);
  for (const slot of ['weaponMod', 'weaponMod2']) for (const id of ['armor-plating-i', 'armor-piercing-rounds-i']) {
    assert.equal(prepareCustomizationEquipment(state, draft, slot, id).ok, false);
    const forged = structuredClone(draft); forged.equipment[slot] = id;
    assert.equal(commitCustomization(state, forged).ok, false); assert.deepEqual(state, before);
  }
  const selected = prepareCustomizationEquipment(state, draft, 'armorMod', 'armor-plating-i'); assert.equal(selected.ok, true);
  assert.equal(actorFor('shepard', customizationPreviewState(state, selected.draft)).defense, actorFor('shepard', state).defense + 3);
  assert.equal(commitCustomization(state, selected.draft).ok, true);
  const quantities = structuredClone(state.inventory.items);
  const removed = prepareCustomizationEquipment(state, createCustomizationDraft(state), 'armorMod', null); assert.equal(removed.ok, true);
  assert.equal(commitCustomization(state, removed.draft).ok, true);
  assert.equal(actorFor('shepard', state).defense, actorFor('shepard', before).defense);
  assert.deepEqual(state.inventory.items, quantities);
});
