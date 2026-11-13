import test from 'node:test';
import assert from 'node:assert/strict';
import { TOOL_CATALOG, TOOL_IDS, getTool } from '../src/tool-data.js';

test('generic tools use unique stable IDs and the native loadout schema', () => {
  assert.deepEqual(TOOL_IDS, [
    'omni-tool-standard', 'biotic-amp-standard', 'omni-tool-upgraded', 'biotic-amp-upgraded',
  ]);
  assert.equal(new Set(TOOL_IDS).size, 4);
  for (const item of TOOL_CATALOG) {
    assert.ok(['omniTool', 'bioticAmp'].includes(item.kind));
    assert.equal(item.slot, item.kind);
    assert.equal(item.manufacturer, 'Modèle générique');
    assert.equal(item.level, 1);
    assert.equal(item.stock, 3);
    assert.equal(item.sell, Math.floor(item.cost * .4));
    assert.equal(item.cost, item.id.endsWith('-standard') ? 80 : 240);
    assert.equal(getTool(item.id), item);
  }
});

test('neutral tools preserve baseline effects and upgrades affect only their own power family', () => {
  for (const item of TOOL_CATALOG) {
    const effect = item.kind === 'omniTool' ? 'techMultiplier' : 'bioticMultiplier';
    assert.deepEqual(Object.keys(item.bonuses), [effect]);
    assert.equal(item.bonuses[effect], item.id.endsWith('-standard') ? 1 : 1.15);
    assert.equal(Object.hasOwn(item, 'powers'), false);
    assert.match(item.detail, /[Nn]’accorde aucun pouvoir/);
  }
});

test('source metadata distinguishes documented equipment families from ATB model tuning', () => {
  for (const item of TOOL_CATALOG) {
    assert.equal(item.sourceUrl, 'https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-manuals_PC_fr.pdf');
    assert.match(item.canonicalStatus, /manuel ME1/);
    assert.match(item.canonicalStatus, /modèle générique/);
    assert.match(item.canonicalStatus, /adaptés au système ATB/);
    assert.match(item.canonicalStatus, /sans rang ni fabricant d’origine certifié/);
  }
});

test('catalogue and effects cannot be mutated and invalid lookups never coerce IDs', () => {
  assert.ok(Object.isFrozen(TOOL_CATALOG));
  assert.ok(Object.isFrozen(TOOL_IDS));
  for (const item of TOOL_CATALOG) {
    assert.ok(Object.isFrozen(item));
    assert.ok(Object.isFrozen(item.bonuses));
    assert.throws(() => { item.cost = 0; }, TypeError);
    assert.throws(() => { item.bonuses.techMultiplier = 100; }, TypeError);
  }
  let coerced = false;
  const coercible = { toString() { coerced = true; return 'omni-tool-standard'; } };
  for (const id of [undefined, null, 0, [], coercible, '__proto__', 'constructor', 'unknown']) {
    assert.equal(getTool(id), null);
  }
  assert.equal(coerced, false);
});
