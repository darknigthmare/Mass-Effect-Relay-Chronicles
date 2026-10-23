import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const baseURL = process.env.GAME_URL || 'http://127.0.0.1:4173';
const out = new URL('../test-results/', import.meta.url);
await mkdir(out, { recursive: true });
// A versioned historical starting inventory makes this migration check work
// without git history, including shallow CI checkouts.
const legacyFixture = JSON.parse(await readFile(new URL('../tests/fixtures/loadout-v02-inventory.json', import.meta.url), 'utf8'));
const report = {
  passed: false, at: new Date().toISOString(), stage: 'launch', checks: [], encounters: [], purchases: [], screenshots: [],
  mode: 'Real creation, campaign encounters, purchases, allocations, explicit training and save UI. Only simulation time and legitimate battle orders are accelerated. The legacy fixture changes the fresh export’s inventory schema, never progression, statistics or credits.',
  fidelity: 'Functional verification of the sprites/ATB adaptation; numeric equipment values and prices are not original-game certification.',
  legacyFixture: legacyFixture.provenance,
  errors: [], failedRequests: [],
};
let browser, page;
const mark = stage => { report.stage = stage; console.log(JSON.stringify({ stage })); };
const record = (name, details = {}) => { report.checks.push({ name, ...details }); console.log(JSON.stringify({ check: name })); };
const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
const card = id => page.locator(`.eq-item[data-item="${id}"]`);
const snapshot = () => page.evaluate(() => structuredClone(window.__RELAY_TEST__.getState()));
const interact = id => page.evaluate(selected => window.__RELAY_TEST__.interact(selected), id);
async function idle(zone) {
  await page.waitForFunction(expected => {
    const qa = window.__RELAY_TEST__;
    return qa?.getState() && !qa.getUI().busy && (!expected || qa.getState().zone === expected);
  }, zone || null, { polling: 100, timeout: 60000 });
}
async function choose(index = 0) { await page.locator(`[data-do="dialogue-choice"][data-index="${index}"]`).click(); await idle(); }
async function deploy(zone) {
  await idle('normandy'); await interact('normandy:galaxy');
  await action('planet', zone).click(); await action('travel', zone).click(); await idle(zone);
}
async function finish(zone) {
  await interact(`${zone}:objective`); await choose(); await choose(); await idle('normandy');
  assert.ok((await snapshot()).completed.includes(zone));
}
async function openEquipment() { await action('equipment').click(); }
async function selectEquipment(actorId, tab, kind) {
  const current = await page.evaluate(() => {
    const ui = window.__RELAY_TEST__.getUI();
    return { actor: ui.equipmentActor, tab: ui.equipmentTab, kind: ui.equipmentKind };
  });
  if (actorId && current.actor !== actorId) await action('eq-actor', actorId).click();
  if (tab && current.tab !== tab) await action('eq-tab', tab).click();
  if (kind && current.kind !== kind) await action('eq-kind', kind).click();
}
async function inventoryFor(actorId = 'shepard') {
  await selectEquipment(actorId, 'inventory', 'all');
}
async function equipped(actorId) {
  return page.evaluate(async id => (await import('/src/loadout.js')).equipmentFor(window.__RELAY_TEST__.getState(), id), actorId);
}
async function profile(actorId) {
  return page.evaluate(async id => (await import('/src/game-data.js')).actorFor(id, window.__RELAY_TEST__.getState()), actorId);
}
async function entry(itemId, shop = false) {
  return page.evaluate(async ({ itemId, shop }) => {
    const gear = await import('/src/loadout.js'), state = window.__RELAY_TEST__.getState();
    return (shop ? gear.listShop(state) : gear.listInventory(state)).find(item => item.id === itemId);
  }, { itemId, shop });
}
async function preview(actorId, itemId, slot) {
  return page.evaluate(async ({ actorId, itemId, slot }) => {
    const gear = await import('/src/loadout.js'), { baseActorFor } = await import('/src/game-data.js');
    const state = window.__RELAY_TEST__.getState();
    return gear.previewLoadout(baseActorFor(actorId, state), state, itemId, slot);
  }, { actorId, itemId, slot });
}
async function selectSlot(itemId, slot) {
  const selector = card(itemId).locator('[data-eq-slot-selector]');
  if (await selector.count() && await selector.inputValue() !== slot) await selector.selectOption(slot);
}
async function equip(actorId, itemId, slot) {
  await inventoryFor(actorId); await selectSlot(itemId, slot);
  const before = await snapshot(), button = card(itemId).locator('[data-do="eq-equip"]');
  assert.equal(await button.isDisabled(), false, `${actorId} can equip ${itemId} in ${slot}`);
  await button.click();
  const after = await snapshot();
  assert.equal((await equipped(actorId))[slot], itemId);
  assert.deepEqual(after.inventory.items, before.inventory.items, 'Allocating an exemplar never creates an owned copy');
  assert.deepEqual(after.inventory.stock, before.inventory.stock, 'Allocation does not change the merchant stock');
  assert.equal(after.credits, before.credits);
}
async function remove(actorId, slot) {
  await selectEquipment(actorId, 'loadout');
  const before = await snapshot(), oldId = (await equipped(actorId))[slot];
  assert.ok(oldId, `${actorId}.${slot} has an item to remove`);
  await action('eq-unequip', slot).click();
  assert.equal((await equipped(actorId))[slot], null);
  assert.deepEqual((await snapshot()).inventory.items, before.inventory.items);
  assert.deepEqual((await snapshot()).inventory.stock, before.inventory.stock);
}
async function blocked(actorId, itemId, reason) {
  await inventoryFor(actorId);
  assert.equal(await card(itemId).locator('[data-do="eq-equip"]').isDisabled(), true);
  assert.match(await card(itemId).innerText(), reason);
}
async function buy(itemId) {
  await selectEquipment(null, 'shop', 'all');
  const before = await snapshot(), item = await entry(itemId, true);
  assert.ok(item.canBuy, `${itemId}: ${item.reason}`);
  await card(itemId).locator('[data-do="eq-buy"]').click();
  const after = await snapshot();
  assert.equal(after.credits, before.credits - item.cost);
  assert.equal(after.inventory.items[itemId], (before.inventory.items[itemId] || 0) + 1);
  assert.equal(after.inventory.stock[itemId], before.inventory.stock[itemId] - 1);
  assert.deepEqual(after.inventory.equipped, before.inventory.equipped);
  report.purchases.push({ itemId, cost: item.cost });
}
async function saveable() {
  await page.evaluate(async () => {
    const { encodeSave, decodeSave } = await import('/src/state.js'), state = window.__RELAY_TEST__.getState();
    const decoded = decodeSave(encodeSave(state));
    if (!decoded || JSON.stringify(decoded.inventory) !== JSON.stringify(state.inventory)) throw new Error('Equipment save roundtrip changed or rejected the inventory');
  });
}
async function exportSave(filename) {
  await page.keyboard.press('Escape');
  const pending = page.waitForEvent('download'); await action('export').click();
  const download = await pending, path = fileURLToPath(new URL(filename, out));
  await download.saveAs(path);
  const contents = await readFile(path, 'utf8');
  await page.getByRole('button', { name: 'Reprendre', exact: true }).click();
  return contents;
}
async function importSave(contents) {
  await page.evaluate(() => { window.__LOADOUT_EXTENSION_PRIOR__ = window.__RELAY_TEST__.getState(); });
  await page.locator('#save-import').setInputFiles({ name: 'loadout-extensions.json', mimeType: 'application/json', buffer: Buffer.from(contents) });
  await page.waitForFunction(() => window.__RELAY_TEST__.getState() !== window.__LOADOUT_EXTENSION_PRIOR__ && !window.__RELAY_TEST__.getUI().busy, null, { polling: 100, timeout: 60000 });
  await page.evaluate(() => { delete window.__LOADOUT_EXTENSION_PRIOR__; });
}
async function saveBranch(id, name) {
  await page.keyboard.press('Escape'); await action('manual-saves').click();
  await page.locator(`#manual-save-name-${id}`).fill(name); await action('manual-save', id).click();
  assert.equal(await page.locator(`[data-save-slot="${id}"]`).getAttribute('data-status'), 'saved');
  await action('manual-back').click(); await page.getByRole('button', { name: 'Reprendre', exact: true }).click();
}
async function loadBranch(id) {
  await page.keyboard.press('Escape'); await action('manual-saves').click();
  await action('manual-load', id).click(); await idle('normandy');
}
async function screenshot(name) {
  const filename = `loadout-extensions-${name}.png`;
  await page.screenshot({ path: fileURLToPath(new URL(filename, out)), timeout: 60000 });
  report.screenshots.push(`test-results/${filename}`);
}
async function battle(id, alreadyStarted = false) {
  mark(`combat:${id}`);
  if (!alreadyStarted) await page.evaluate(selected => window.__RELAY_TEST__.startBattle(selected), id);
  const result = await page.evaluate(async () => {
    const { getActions, performAction, tickBattle, summarizeBattle } = await import('/src/combat.js');
    const qa = window.__RELAY_TEST__, battle = qa.getBattle();
    if (!battle) throw new Error('The actual encounter did not start');
    let iterations = 0;
    while (!battle.winner && iterations++ < 6000) {
      for (const actor of battle.actors.filter(actor => actor.team === 'party' && actor.hp > 0)) {
        const available = getActions(battle, actor.id).filter(action => action.available);
        if (!available.length) continue;
        const party = battle.actors.filter(member => member.team === 'party');
        const enemies = battle.actors.filter(enemy => enemy.team === 'enemy' && enemy.hp > 0);
        const target = enemies.find(enemy => !enemy.statuses.stasis) || enemies[0];
        if (!target) break;
        const low = party.filter(member => member.hp > 0).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        const priorities = [];
        if (party.some(member => member.hp <= 0)) priorities.push(['unity', actor.id]);
        if (low.hp / low.maxHp < .42) priorities.push(['medigel', low.id]);
        if (target.shield > 0) priorities.push(['overload', target.id]);
        if (target.statuses.lift > 0 || target.statuses.singularity > 0) priorities.push(['throw', target.id]);
        priorities.push(['signature', target.id], ['warp', target.id], ['burst', target.id], ['shoot', target.id], ['throw', target.id], ['overload', target.id], ['barrier', actor.id], ['cover', actor.id]);
        for (const [actionId, targetId] of priorities) {
          if (!available.some(action => action.id === actionId)) continue;
          if (performAction(battle, { actorId: actor.id, actionId, targetId }).ok) break;
        }
      }
      tickBattle(battle, .5);
    }
    qa.step(.001);
    return { ...summarizeBattle(battle), iterations };
  });
  assert.equal(result.winner, 'party'); assert.ok(result.actionCount > 0);
  await action('claim-victory').click();
  if (id === 'eden-prime:encounter-1') await choose();
  assert.ok((await snapshot()).cleared.includes(id));
  await saveable(); report.encounters.push({ id, winner: result.winner, actions: result.actionCount });
  console.log(JSON.stringify(report.encounters.at(-1)));
}

try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  page = await context.newPage(); page.setDefaultTimeout(60000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`); });

  mark('legacy-inventory-migration');
  await page.goto(`${baseURL}/?qa`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Nouvelle campagne/ }).click();
  await page.locator('#commander-name').fill('Alex Shepard'); await page.locator('#new-appearance').selectOption('female');
  await page.getByRole('button', { name: /Commencer l’aventure/ }).click();
  await page.getByRole('button', { name: 'Je rejoins le briefing.' }).click(); await idle('normandy');
  const fresh = await snapshot(), legacy = JSON.parse(await exportSave('loadout-extensions-fresh.json'));
  legacy.state.inventory = structuredClone(legacyFixture.inventory);
  const legacyJSON = `${JSON.stringify(legacy, null, 2)}\n`;
  await writeFile(new URL('loadout-extensions-v02-v1-fixture.json', out), legacyJSON);
  await importSave(legacyJSON); await idle('normandy');
  const migrated = await snapshot();
  assert.equal(migrated.inventory.version, 2);
  assert.deepEqual(migrated.inventory.items, legacy.state.inventory.items);
  for (const [id, count] of Object.entries(legacy.state.inventory.stock)) assert.equal(migrated.inventory.stock[id], count);
  for (const id of ['omni-tool-standard', 'omni-tool-upgraded', 'biotic-amp-standard', 'biotic-amp-upgraded']) assert.equal(migrated.inventory.stock[id], 3);
  for (const [id, slots] of Object.entries(legacy.state.inventory.equipped)) {
    for (const [slot, item] of Object.entries(slots)) assert.equal(migrated.inventory.equipped[id][slot], item);
    for (const slot of ['weaponMod2', 'armorMod2', 'omniTool', 'bioticAmp']) assert.equal(migrated.inventory.equipped[id][slot], null);
  }
  for (const key of ['name', 'classId', 'appearance', 'xp', 'credits', 'party', 'recruited', 'cleared', 'completed', 'choices', 'flags', 'story', 'operations']) assert.deepEqual(migrated[key], fresh[key], `Legacy migration preserves ${key}`);
  await saveable();
  await openEquipment();
  assert.equal(await action('eq-actor', 'jenkins').count(), 1);
  await action('eq-tab', 'loadout').click();
  assert.equal(await page.locator('[data-do="eq-train"][data-weight="heavy"]').isDisabled(), true);
  await action('close').click();
  record('Actual v0.2.0 inventory-v1 JSON import preserves owned items, merchant stock and progression while adding empty extension slots', { oldStockEntries: Object.keys(legacy.state.inventory.stock).length });

  mark('legitimate-campaign-funding');
  await interact('normandy:briefing'); await choose(); await action('travel', 'eden-prime').click(); await idle('eden-prime');
  await interact('eden-prime:cache'); await choose(1);
  for (const suffix of ['encounter-1', 'encounter-2', 'boss']) await battle(`eden-prime:${suffix}`);
  await finish('eden-prime'); await deploy('citadel');
  for (const suffix of ['encounter-1', 'encounter-2', 'boss']) { await interact(`citadel:${suffix}`); await choose(); }
  await finish('citadel'); await deploy('therum');
  await interact('therum:cache'); await choose(1);
  for (const suffix of ['encounter-1', 'encounter-2', 'boss']) await battle(`therum:${suffix}`);
  await finish('therum');
  const funded = await snapshot();
  assert.equal(funded.credits, 1500); assert.deepEqual(funded.party, ['shepard', 'kaidan', 'ashley']);
  for (const id of ['kaidan', 'ashley', 'garrus', 'tali', 'wrex', 'liara']) assert.ok(funded.recruited.includes(id));
  await saveBranch('1', 'Avant les extensions d’équipement');
  record('Six real Eden Prime and Therum encounters, Council recruitment and two caches fund the extensions without overriding progression', { credits: funded.credits, xp: funded.xp });

  mark('extension-transactions-and-training');
  await openEquipment();
  for (const id of ['shepard', 'kaidan', 'ashley', 'garrus', 'tali', 'wrex', 'liara']) assert.equal(await action('eq-actor', id).count(), 1);
  await action('eq-tab', 'shop').click(); await action('eq-kind', 'tool').click();
  assert.equal(await page.locator('.eq-item').count(), 4, 'The tools filter shows both standard and upgraded tool families');
  for (const id of ['omni-tool-standard', 'omni-tool-upgraded', 'biotic-amp-standard', 'biotic-amp-upgraded']) assert.equal(await card(id).count(), 1);
  for (const id of ['omni-tool-upgraded', 'biotic-amp-upgraded', 'heat-sink-i', 'rail-extension-iv', 'armor-piercing-rounds-i', 'shield-battery-i', 'armor-plating-i', 'phoenix-human-iii']) await buy(id);
  const beforeTraining = await snapshot();
  assert.equal(beforeTraining.inventory.training.shepard?.weights?.heavy, undefined, 'Gaining ATB levels never acquires armor training automatically');
  const initialPoints = await page.evaluate(async () => (await import('/src/loadout.js')).getTrainingOptions(window.__RELAY_TEST__.getState(), 'shepard').find(option => option.weight === 'heavy').availablePoints);
  await action('eq-actor', 'shepard').click(); await action('eq-tab', 'loadout').click();
  await page.locator('[data-do="eq-train"][data-weight="heavy"]').click();
  const trained = await snapshot();
  assert.deepEqual(trained.inventory.training.shepard, { weights: { heavy: true }, legacyArmor: null });
  assert.deepEqual(trained.inventory.items, beforeTraining.inventory.items); assert.deepEqual(trained.inventory.stock, beforeTraining.inventory.stock);
  assert.equal(trained.credits, beforeTraining.credits); assert.equal(trained.xp, beforeTraining.xp);
  assert.equal(await page.evaluate(async () => (await import('/src/loadout.js')).getTrainingOptions(window.__RELAY_TEST__.getState(), 'shepard').find(option => option.weight === 'heavy').availablePoints), initialPoints - 1);
  await action('eq-actor', 'kaidan').click();
  assert.equal(await page.locator('[data-do="eq-train"][data-weight="heavy"]').count(), 0);
  await equip('shepard', 'phoenix-human-iii', 'armor');
  record('One-click purchases consume credits and merchant stock once; earned armor training is explicit, persistent and unavailable to Kaidan', { remainingCredits: (await snapshot()).credits });

  mark('specialized-tools');
  for (const actorId of ['shepard', 'ashley']) {
    await blocked(actorId, 'omni-tool-upgraded', /technolog|omni/i);
    await blocked(actorId, 'biotic-amp-upgraded', /biotiqu/i);
  }
  await blocked('tali', 'biotic-amp-upgraded', /biotiqu/i); await blocked('garrus', 'biotic-amp-upgraded', /biotiqu/i);
  const kaidanBase = await profile('kaidan');
  await equip('kaidan', 'biotic-amp-upgraded', 'bioticAmp');
  let actor = await profile('kaidan');
  assert.deepEqual(actor.powers, kaidanBase.powers); assert.equal(actor.bioticMultiplier, 1.15); assert.equal(actor.techMultiplier, kaidanBase.techMultiplier);
  await equip('kaidan', 'omni-tool-upgraded', 'omniTool');
  actor = await profile('kaidan');
  assert.deepEqual(actor.powers, kaidanBase.powers); assert.equal(actor.bioticMultiplier, 1.15); assert.equal(actor.techMultiplier, 1.15);
  await remove('kaidan', 'omniTool');
  const liaraBase = await profile('liara');
  await equip('liara', 'omni-tool-upgraded', 'omniTool');
  actor = await profile('liara');
  assert.deepEqual(actor.powers, liaraBase.powers); assert.equal(actor.bioticMultiplier, liaraBase.bioticMultiplier); assert.equal(actor.techMultiplier, 1.15);
  await remove('kaidan', 'bioticAmp'); await equip('liara', 'biotic-amp-upgraded', 'bioticAmp');
  actor = await profile('liara');
  assert.deepEqual(actor.powers, liaraBase.powers); assert.equal(actor.bioticMultiplier, 1.15); assert.equal(actor.techMultiplier, 1.15);
  await action('eq-tab', 'loadout').click();
  await screenshot('liara-tools');
  await remove('liara', 'bioticAmp'); await equip('kaidan', 'biotic-amp-upgraded', 'bioticAmp');
  await remove('liara', 'omniTool'); await equip('tali', 'omni-tool-upgraded', 'omniTool');
  assert.ok(!(await snapshot()).party.includes('tali'));
  record('Kaidan and Liara can carry their eligible tools, Ashley and the soldier cannot, and tools neither grant powers nor strengthen the other power family');

  mark('second-module-slots');
  await equip('shepard', 'heat-sink-i', 'weaponMod');
  await inventoryFor('shepard'); await selectSlot('heat-sink-i', 'weaponMod2');
  assert.equal(await card('heat-sink-i').locator('[data-do="eq-equip"]').isDisabled(), true);
  assert.match(await card('heat-sink-i').innerText(), /exemplaire libre/i);
  await equip('shepard', 'rail-extension-iv', 'weaponMod2'); await equip('shepard', 'armor-piercing-rounds-i', 'ammoMod');
  await equip('shepard', 'shield-battery-i', 'armorMod');
  await inventoryFor('shepard'); await selectSlot('shield-battery-i', 'armorMod2');
  assert.equal(await card('shield-battery-i').locator('[data-do="eq-equip"]').isDisabled(), true);
  await equip('shepard', 'armor-plating-i', 'armorMod2');
  const modules = await equipped('shepard');
  assert.equal(modules.weaponMod, 'heat-sink-i'); assert.equal(modules.weaponMod2, 'rail-extension-iv');
  assert.equal(modules.armorMod, 'shield-battery-i'); assert.equal(modules.armorMod2, 'armor-plating-i');
  for (const id of ['heat-sink-i', 'rail-extension-iv', 'armor-piercing-rounds-i', 'shield-battery-i', 'armor-plating-i']) assert.equal((await entry(id)).available, 0);
  await action('eq-tab', 'loadout').click(); await screenshot('second-slots');
  await action('close').click(); await saveable(); await saveBranch('2', 'Extensions d’équipement prêtes');
  const geared = await snapshot(), savedInventory = geared.inventory;
  record('The second weapon and armor slots accept distinct owned modules and reject allocating a single exemplar twice');

  mark('physical-modules-and-stock');
  await openEquipment(); await inventoryFor('shepard');
  assert.equal(await card('kessler-i').locator('[data-eq-returned-mods]').count(), 1);
  const weaponPreview = await preview('shepard', 'kessler-i', 'weapon');
  assert.deepEqual([...weaponPreview.returnedMods].sort(), ['heat-sink-i', 'rail-extension-iv', 'armor-piercing-rounds-i'].sort());
  await equip('shepard', 'kessler-i', 'weapon');
  let slots = await equipped('shepard');
  for (const slot of ['weaponMod', 'weaponMod2', 'ammoMod']) assert.equal(slots[slot], null);
  assert.equal(slots.armorMod, 'shield-battery-i'); assert.equal(slots.armorMod2, 'armor-plating-i');
  await inventoryFor('shepard'); assert.equal(await card('onyx-human-i').locator('[data-eq-returned-mods]').count(), 1);
  const armorPreview = await preview('shepard', 'onyx-human-i', 'armor');
  assert.deepEqual([...armorPreview.returnedMods].sort(), ['shield-battery-i', 'armor-plating-i'].sort());
  assert.equal(armorPreview.deltas.maxShield, -40);
  await equip('shepard', 'onyx-human-i', 'armor');
  slots = await equipped('shepard'); assert.equal(slots.armorMod, null); assert.equal(slots.armorMod2, null);
  assert.deepEqual((await snapshot()).inventory.items, geared.inventory.items); assert.deepEqual((await snapshot()).inventory.stock, geared.inventory.stock);
  await action('close').click(); await loadBranch('2'); await openEquipment();
  await action('eq-tab', 'loadout').click();
  assert.ok(await page.locator('[data-eq-returned-mods]').count() >= 2);
  await remove('shepard', 'weapon'); await remove('shepard', 'armor');
  slots = await equipped('shepard');
  for (const slot of ['weapon', 'armor', 'weaponMod', 'weaponMod2', 'ammoMod', 'armorMod', 'armorMod2']) assert.equal(slots[slot], null);
  for (const id of ['heat-sink-i', 'rail-extension-iv', 'armor-piercing-rounds-i', 'shield-battery-i', 'armor-plating-i']) assert.equal((await entry(id)).available, 1);
  await inventoryFor('shepard');
  const beforeSale = await snapshot(), heat = await entry('heat-sink-i');
  await card('heat-sink-i').locator('[data-do="eq-sell"]').click();
  const sold = await snapshot();
  assert.equal(sold.inventory.items['heat-sink-i'], undefined); assert.equal(sold.inventory.stock['heat-sink-i'], beforeSale.inventory.stock['heat-sink-i'] + 1);
  assert.equal(sold.credits, beforeSale.credits + heat.sell);
  await buy('heat-sink-i');
  assert.equal((await snapshot()).inventory.items['heat-sink-i'], 1); assert.equal((await snapshot()).inventory.stock['heat-sink-i'], beforeSale.inventory.stock['heat-sink-i']);
  await action('close').click(); await loadBranch('2');
  assert.deepEqual((await snapshot()).inventory, savedInventory);
  record('Replacing or removing base equipment warns and releases all its physical modules; resale and repurchase update merchant stock once without duplication', { replacementShieldDelta: armorPreview.deltas.maxShield });

  mark('extension-persistence');
  const serialized = await exportSave('loadout-extensions-export.json');
  assert.deepEqual(JSON.parse(serialized).state.inventory, savedInventory);
  await openEquipment(); await remove('shepard', 'weaponMod2'); await action('close').click();
  const removedInventory = (await snapshot()).inventory;
  await page.reload({ waitUntil: 'networkidle' }); await page.getByRole('button', { name: /Reprendre/ }).click(); await idle('normandy');
  assert.deepEqual((await snapshot()).inventory, removedInventory, 'Autosave persists the actual removal');
  await importSave(serialized); await idle('normandy'); assert.deepEqual((await snapshot()).inventory, savedInventory);
  await page.reload({ waitUntil: 'networkidle' }); await page.getByRole('button', { name: /Reprendre/ }).click(); await idle('normandy');
  assert.deepEqual((await snapshot()).inventory, savedInventory);
  await loadBranch('1'); assert.deepEqual((await snapshot()).inventory, funded.inventory); assert.equal((await snapshot()).credits, funded.credits);
  await loadBranch('2'); assert.deepEqual((await snapshot()).inventory, savedInventory); assert.equal((await snapshot()).credits, geared.credits);
  await saveable();
  record('Autosave/reload preserves removals; unchanged export/import and independent manual slots preserve both module slots, tools, explicit training, quantities and merchant stocks');

  mark('equipped-atb-effects');
  await deploy('feros'); const projected = await profile('shepard');
  await page.evaluate(() => window.__RELAY_TEST__.startBattle('feros:encounter-1'));
  assert.equal(await action('equipment').isDisabled(), true); await page.keyboard.press('KeyI');
  assert.equal(await page.evaluate(() => window.__RELAY_TEST__.getUI().screen), null);
  const shot = await page.evaluate(async () => {
    const { getActions } = await import('/src/combat.js'), qa = window.__RELAY_TEST__, battle = qa.getBattle();
    const actor = battle.actors.find(member => member.id === 'shepard');
    const covers = [];
    for (let turn = 0; turn < 100 && !battle.winner; turn++) {
      if (getActions(battle, actor.id).some(action => action.id === 'shoot' && action.available)) break;
      for (const member of battle.actors.filter(member => member.team === 'party' && member.id !== actor.id && member.hp > 0)) {
        if (getActions(battle, member.id).some(action => action.id === 'cover' && action.available)) {
          const result = qa.action({ actorId: member.id, actionId: 'cover', targetId: member.id });
          if (!result.ok) throw new Error(result.reason); covers.push(member.id);
        }
      }
      qa.step(.25);
    }
    const shoot = getActions(battle, actor.id).find(action => action.id === 'shoot');
    if (!shoot?.available) throw new Error('Shepard did not become ready after legitimate companion orders');
    const target = battle.actors.find(enemy => enemy.team === 'enemy' && enemy.hp > 0 && !enemy.statuses.stasis);
    const before = { heat: actor.heat, target: target.hp + target.shield };
    const result = qa.action({ actorId: actor.id, actionId: 'shoot', targetId: target.id });
    if (!result.ok) throw new Error(result.reason);
    return { covers, before, heatAfter: actor.heat, targetAfter: target.hp + target.shield, heatCost: shoot.heatCost,
      attack: actor.attack, maxShield: actor.maxShield, weaponHeatMultiplier: actor.weaponHeatMultiplier, weaponCoolingBonus: actor.weaponCoolingBonus,
      syntheticDamageBonus: actor.syntheticDamageBonus, bioticMultiplier: actor.bioticMultiplier, techMultiplier: actor.techMultiplier };
  });
  assert.equal(shot.attack, projected.attack); assert.equal(shot.maxShield, projected.maxShield);
  assert.equal(shot.weaponHeatMultiplier, projected.weaponHeatMultiplier); assert.equal(shot.weaponCoolingBonus, projected.weaponCoolingBonus);
  assert.equal(shot.syntheticDamageBonus, projected.syntheticDamageBonus); assert.ok(shot.syntheticDamageBonus > 0);
  assert.ok(shot.targetAfter < shot.before.target); assert.ok(Math.abs(shot.heatAfter - shot.before.heat - shot.heatCost) < 1e-8);
  const cooling = await page.evaluate(async () => {
    const { getActions } = await import('/src/combat.js'), qa = window.__RELAY_TEST__, battle = qa.getBattle();
    for (const actor of battle.actors.filter(actor => actor.team === 'party' && actor.hp > 0)) {
      if (getActions(battle, actor.id).some(action => action.id === 'cover' && action.available)) qa.action({ actorId: actor.id, actionId: 'cover', targetId: actor.id });
    }
    const actor = battle.actors.find(actor => actor.id === 'shepard'), before = actor.heat, elapsed = battle.elapsed;
    qa.step(.5); return { before, after: actor.heat, elapsed: battle.elapsed - elapsed };
  });
  assert.ok(cooling.elapsed > 0 && cooling.after < cooling.before);
  report.combat = { shot, cooling }; await battle('feros:encounter-1', true);
  await interact('feros:exit'); await choose(); await idle('normandy');
  assert.deepEqual((await snapshot()).inventory, savedInventory); await saveable();
  await openEquipment(); await action('eq-tab', 'loadout').click(); await screenshot('final-loadout');
  record('A real equipped victory uses both weapon modules, ammunition, shield capacity and announced heat; companion cover orders release decision pauses and equipment editing stays blocked');

  assert.equal(report.encounters.length, 7); assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []);
  report.assetErrors = await page.evaluate(() => window.__RELAY_TEST__.getWorld().assetErrors || []); assert.deepEqual(report.assetErrors, []);
  report.passed = true; mark('complete'); console.log(JSON.stringify(report, null, 2));
} catch (error) {
  report.failure = error.stack || String(error);
  if (page) {
    report.diagnostic = await Promise.race([
      page.evaluate(() => ({ zone: window.__RELAY_TEST__?.getState()?.zone, busy: window.__RELAY_TEST__?.getUI()?.busy,
        screen: window.__RELAY_TEST__?.getUI()?.screen, credits: window.__RELAY_TEST__?.getState()?.credits, inventory: window.__RELAY_TEST__?.getState()?.inventory })).catch(() => null),
      new Promise(resolve => setTimeout(() => resolve({ unavailable: true }), 5000)),
    ]);
    await screenshot('failure').catch(() => {});
  }
  throw error;
} finally {
  await browser?.close(); await writeFile(new URL('loadout-extensions-report.json', out), `${JSON.stringify(report, null, 2)}\n`);
}
