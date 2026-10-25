import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame } from '../src/state.js';
import { actorFor, baseActorFor } from '../src/game-data.js';
import { buyItem } from '../src/loadout.js';
import { TOOL_CATALOG } from '../src/tool-data.js';
import { renderLoadoutScreen } from '../src/loadout-ui.js';

const helpers = { actorFor, baseActorFor, portraitStyle: () => '' };
const cardIds = html => [...html.matchAll(/<article\b[^>]*\bdata-item="([^"]+)"/g)].map(match => match[1]).sort();
const toolIds = ['biotic-amp-standard', 'biotic-amp-upgraded', 'omni-tool-standard', 'omni-tool-upgraded'];

test('the shop tools filter renders both OmniTechs and both biotic amplifiers', () => {
  const state = newGame(), before = JSON.stringify(state);
  const html = renderLoadoutScreen(state, { equipmentActor: 'kaidan', equipmentTab: 'shop', equipmentKind: 'tool' }, helpers);
  assert.deepEqual(cardIds(html), toolIds);
  assert.ok(html.includes('data-id="tool" aria-pressed="true"'));
  for (const id of toolIds) assert.ok(html.includes(`data-do="eq-buy" data-id="${id}"`));
  assert.equal(JSON.stringify(state), before, 'Browsing the filtered shop must not reserve or grant equipment.');
});

test('purchased tools remain visible and actionable under the inventory tools filter', () => {
  const state = newGame();
  state.credits = TOOL_CATALOG.reduce((sum, item) => sum + item.cost, 0);
  for (const id of toolIds) assert.equal(buyItem(state, id).ok, true, id);
  const before = JSON.stringify(state);
  const html = renderLoadoutScreen(state, { equipmentActor: 'kaidan', equipmentTab: 'inventory', equipmentKind: 'tool' }, helpers);
  assert.deepEqual(cardIds(html), toolIds);
  for (const id of toolIds) {
    assert.ok(html.includes(`data-do="eq-equip" data-id="${id}"`));
    assert.ok(html.includes(`data-do="eq-sell" data-id="${id}"`));
  }
  assert.equal(JSON.stringify(state), before, 'Filtering owned tools must preserve quantities and allocations.');
});
