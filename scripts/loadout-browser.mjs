import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const baseURL = process.env.GAME_URL || 'http://127.0.0.1:4173';
const out = new URL('../test-results/', import.meta.url);
const docs = new URL('../docs/qa/', import.meta.url);
const screenshots = new URL('../docs/screenshots/', import.meta.url);
await Promise.all([mkdir(out, { recursive: true }), mkdir(docs, { recursive: true }), mkdir(screenshots, { recursive: true })]);
const report = {
  version: '0.2.0', at: new Date().toISOString(), passed: false,
  mode: 'Actual UI creation, equipment transactions, save/load and one real ATB victory. Combat time is accelerated through the simulation API; no inventory, damage, reward or progression overrides.',
  checks: [], errors: [], failedRequests: [], screenshots: [],
};
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
  args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await context.newPage();
page.setDefaultTimeout(60000);
page.on('pageerror', error => report.errors.push(error.message));
page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
page.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`); });
const mark = (stage) => console.log(JSON.stringify({stage, at:new Date().toISOString()}));
const record = check => { report.checks.push(check); mark(check.name); };
const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
const state = () => page.evaluate(() => structuredClone(window.__RELAY_TEST__.getState()));
async function idle(zone) {
  await page.waitForFunction(expected => window.__RELAY_TEST__?.getState()?.zone === expected && !window.__RELAY_TEST__.getUI().busy, zone);
}
async function shot(name) {
  const filename = `v02-${name}.png`;
  await page.screenshot({ path: fileURLToPath(new URL(filename, screenshots)) });
  report.screenshots.push(`docs/screenshots/${filename}`);
}
async function openEquipment() { await action('equipment').click(); }
async function layoutCheck(label) {
  const observed = await page.evaluate(() => {
    const screen = document.querySelector('.screen');
    const clippedButtons = [...document.querySelectorAll('.eq-content button')].filter(element => {
      const rect = element.getBoundingClientRect();
      const parent = element.closest('.eq-item,.eq-slot,.eq-calibration')?.getBoundingClientRect() || screen.getBoundingClientRect();
      return rect.left < parent.left - 1 || rect.right > parent.right + 1 || element.scrollWidth > element.clientWidth + 2;
    }).map(element => element.textContent.trim());
    return { viewport: window.innerWidth, documentWidth: document.documentElement.scrollWidth, screenWidth: screen.clientWidth, contentWidth: screen.scrollWidth, clippedButtons };
  });
  assert.equal(observed.documentWidth, observed.viewport, label);
  assert.ok(observed.contentWidth <= observed.screenWidth + 1, label);
  assert.deepEqual(observed.clippedButtons, [], label);
  return { label, ...observed };
}
async function importSave(contents) {
  await page.evaluate(() => { window.__LOADOUT_PRIOR_STATE__ = window.__RELAY_TEST__.getState(); });
  await page.locator('#save-import').setInputFiles({ name: 'loadout-v02.json', mimeType: 'application/json', buffer: Buffer.from(contents) });
  await page.waitForFunction(() => window.__RELAY_TEST__.getState() !== window.__LOADOUT_PRIOR_STATE__ && !window.__RELAY_TEST__.getUI().busy);
  await page.evaluate(() => { delete window.__LOADOUT_PRIOR_STATE__; });
}
async function saveable() {
  return page.evaluate(async () => {
    const { decodeSave, encodeSave } = await import('/src/state.js');
    const loaded = decodeSave(encodeSave(window.__RELAY_TEST__.getState()));
    if (!loaded) throw new Error('Integrated equipment state is not serializable');
    return loaded.inventory;
  });
}

try {
  mark('Loading game');
  await page.goto(`${baseURL}/?qa`, { waitUntil: 'networkidle' });
  mark('Creation form');
  await page.getByRole('button', { name: /Nouvelle campagne/ }).click();
  await page.locator('#commander-name').fill('Jane Shepard');
  await page.locator('#new-appearance').selectOption('female');
  await page.locator('#new-origin').selectOption('colonist');
  await page.locator('#new-profile').selectOption('war-hero');
  await page.getByRole('button', { name: /Commencer l’aventure/ }).click();
  await page.getByRole('button', { name: 'Je rejoins le briefing.' }).click();
  await idle('normandy');
  mark('Female assets and movement');
  await page.waitForFunction(() => {
    const w = window.__RELAY_TEST__.getWorld();
    return w.atlases['motion-femshep'] && w.atlases['combat-femshep'] && w.actors.find(a => a.id === 'shepard')?.animationFrame?.startsWith('femshep-walk');
  });
  const initialPosition = await page.evaluate(() => window.__RELAY_TEST__.getWorld().getPosition());
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(prior => {
    const w = window.__RELAY_TEST__.getWorld(), position = w.getPosition();
    return Math.hypot(position.x - prior.x, position.z - prior.z) > .6 && w.actors.find(a => a.id === 'shepard')?.animationFrame?.startsWith('femshep-walk');
  }, initialPosition);
  await page.keyboard.up('ArrowRight');
  record({ name: 'Female creation and keyboard movement', appearance: (await state()).appearance, nameInSave: (await state()).name, actualMovement: true });

  mark('Equipment transactions');
  await openEquipment(); await action('eq-tab', 'shop').click();
  const beforeCredits = (await state()).credits;
  await action('eq-buy', 'heat-sink-i').click();
  assert.equal((await state()).credits, beforeCredits - 100);
  assert.equal((await state()).inventory.stock['heat-sink-i'], 4);
  await action('eq-tab', 'inventory').click();
  await action('eq-equip', 'heat-sink-i').click();
  assert.equal((await state()).inventory.equipped.shepard.weaponMod, 'heat-sink-i');
  await action('eq-sell', 'kessler-i').click();
  assert.equal((await state()).credits, beforeCredits - 100 + 28);
  assert.equal((await state()).inventory.items['kessler-i'], undefined);
  await action('eq-actor', 'jenkins').click();
  await action('eq-equip', 'storm-i').click();
  assert.equal((await state()).inventory.equipped.jenkins.weapon, 'storm-i');
  await action('eq-actor', 'shepard').click(); await action('eq-tab', 'loadout').click();
  assert.equal(await page.locator('.eq-portrait svg').count(), 1);
  assert.match(await page.locator('.eq-portrait image').getAttribute('href'), /shepard-female-walk-atlas\.png$/);
  const desktop = await layoutCheck('Equipment desktop'); await shot('equipment-loadout');
  const equipped = (await state()).inventory;
  assert.deepEqual(await saveable(), equipped);
  record({ name: 'UI purchase, equip, sale and Jenkins allocation', spent: 100, sale: 28, credits: (await state()).credits, heatSinkStock: 4, quantitySoldRemoved: true, desktop });

  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Reprendre/ }).click(); await idle('normandy');
  assert.deepEqual((await state()).inventory, equipped);
  assert.equal((await state()).appearance, 'female');
  await page.keyboard.press('Escape'); await action('manual-saves').click();
  await page.locator('#manual-save-name-1').fill('Dotation avant Eden Prime');
  await action('manual-save', '1').click();
  await page.waitForFunction(() => document.querySelector('[data-save-slot="1"]')?.dataset.status === 'saved');
  const manual = await page.evaluate(async () => (await import('/src/save-slots.js')).readManualSave(localStorage, '1'));
  assert.equal(manual.ok, true); assert.deepEqual(manual.state.inventory, equipped);
  await action('manual-back').click();
  const pendingDownload = page.waitForEvent('download'); await action('export').click();
  const download = await pendingDownload, exportedPath = fileURLToPath(new URL('loadout-export.json', out));
  await download.saveAs(exportedPath); const serialized = await readFile(exportedPath, 'utf8');
  assert.deepEqual(JSON.parse(serialized).state.inventory, equipped);
  await importSave(serialized); await idle('normandy');
  assert.deepEqual((await state()).inventory, equipped);
  await openEquipment(); await action('eq-tab', 'loadout').click();
  await action('eq-unequip', 'weaponMod').click();
  assert.equal((await state()).inventory.equipped.shepard.weaponMod, null);
  await action('close').click(); await page.keyboard.press('Escape'); await action('manual-saves').click();
  await action('manual-load', '1').click(); await idle('normandy');
  assert.deepEqual((await state()).inventory, equipped);
  record({ name: 'Automatic reload, JSON export/import and manual restore preserve inventory', autosave: true, exported: true, imported: true, manualSlot: '1', restoredEquippedModuleAfterRemoval: true });

  await page.setViewportSize({ width: 390, height: 844 }); await openEquipment(); await action('eq-tab', 'loadout').click();
  const mobileChecks = [await layoutCheck('Equipment mobile loadout')]; await shot('equipment-mobile');
  await action('eq-tab', 'inventory').click(); mobileChecks.push(await layoutCheck('Equipment mobile inventory')); await shot('equipment-mobile-inventory');
  await action('eq-tab', 'shop').click(); mobileChecks.push(await layoutCheck('Equipment mobile shop'));
  await action('eq-tab', 'calibrations').click(); mobileChecks.push(await layoutCheck('Equipment mobile calibrations'));
  record({ name: 'Actual mobile UI', widths: [390], tabs: mobileChecks });
  await action('close').click(); await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => window.__RELAY_TEST__.interact('normandy:briefing'));
  await page.getByRole('button', { name: /Mission comprise/ }).click();
  await page.getByRole('button', { name: /Préparer le déploiement/ }).click(); await idle('eden-prime');
  await page.evaluate(() => window.__RELAY_TEST__.startBattle('eden-prime:encounter-1'));
  await page.waitForFunction(() => window.__RELAY_TEST__.getWorld().battleActors.get('shepard')?.body.material.map?.image?.src?.includes('shepard-female-combat-atlas.png'));
  await shot('equipment-combat');
  const combat = await page.evaluate(async () => {
    const { getActions, performAction, tickBattle, summarizeBattle } = await import('/src/combat.js');
    const qa = window.__RELAY_TEST__, b = qa.getBattle(), shepard = b.actors.find(a => a.id === 'shepard');
    const effects = { weaponHeatMultiplier: shepard.weaponHeatMultiplier, weaponCoolingBonus: shepard.weaponCoolingBonus, announcedHeat: getActions(b, 'shepard').find(a => a.id === 'shoot').heatCost };
    let iterations = 0, observedShot = null;
    while (!b.winner && iterations++ < 6000) {
      for (const a of b.actors.filter(a => a.team === 'party' && a.hp > 0)) {
        const available = getActions(b, a.id).filter(action => action.available);
        if (!available.length) continue;
        const target = b.actors.find(a => a.team === 'enemy' && a.hp > 0);
        if (!target) break;
        const low = b.actors.filter(a => a.team === 'party' && a.hp > 0).sort((a, c) => a.hp / a.maxHp - c.hp / c.maxHp)[0];
        const priorities = [];
        if (low.hp / low.maxHp < .42) priorities.push(['medigel', low.id]);
        if (!observedShot && a.id === 'shepard') priorities.push(['shoot', target.id]);
        if (target.shield > 0) priorities.push(['overload', target.id]);
        priorities.push(['burst', target.id], ['shoot', target.id], ['throw', target.id], ['cover', a.id]);
        for (const [actionId, targetId] of priorities) {
          if (!available.some(entry => entry.id === actionId)) continue;
          const beforeHeat = a.heat;
          const result = performAction(b, { actorId: a.id, actionId, targetId });
          if (result.ok) {
            if (!observedShot && a.id === 'shepard' && actionId === 'shoot') observedShot = { beforeHeat, afterHeat: a.heat, delta: a.heat - beforeHeat };
            break;
          }
        }
      }
      tickBattle(b, .5);
    }
    qa.step(.001);
    return { ...summarizeBattle(b), iterations, effects, observedShot };
  });
  assert.equal(combat.winner, 'party');
  assert.equal(combat.effects.weaponHeatMultiplier, .9); assert.equal(combat.effects.weaponCoolingBonus, 1);
  assert.ok(Math.abs(combat.effects.announcedHeat - 21.6) < 1e-8);
  assert.ok(Math.abs(combat.observedShot.delta - 21.6) < 1e-8);
  await action('claim-victory').click(); await page.getByRole('button', { name: 'Nous devons poursuivre.' }).click();
  record({ name: 'Real ATB victory uses equipped effects', encounter: 'eden-prime:encounter-1', ...combat });

  assert.equal((await state()).lost.includes('jenkins'), true);
  await openEquipment(); await action('eq-actor', 'jenkins').click(); await action('eq-tab', 'loadout').click();
  assert.equal((await state()).inventory.equipped.jenkins.weapon, 'storm-i');
  await shot('equipment-recovery'); await action('eq-unequip', 'weapon').click();
  assert.equal(await page.evaluate(() => window.__RELAY_TEST__.getUI().equipmentActor), 'shepard');
  assert.equal(await page.locator('[data-do="eq-actor"][data-id="jenkins"]').count(), 0);
  await action('eq-tab', 'inventory').click(); await action('eq-equip', 'storm-i').click();
  assert.equal((await state()).inventory.equipped.shepard.weapon, 'storm-i');
  assert.equal((await state()).inventory.equipped.jenkins.weapon, null);
  assert.deepEqual(await saveable(), (await state()).inventory);
  record({ name: 'Jenkins recovery after the actual first encounter', lost: true, recoveredWeapon: 'storm-i', selectionReturnsToShepard: true, subsequentlyEquippedOnShepard: true, saveValid: true });

  report.assetErrors = await page.evaluate(() => window.__RELAY_TEST__.getWorld().assetErrors || []);
  assert.deepEqual(report.assetErrors, []); assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []);
  report.passed = true;
  await writeFile(new URL('loadout-report.json', docs), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  report.failure = error.stack || String(error);
  console.error(JSON.stringify({failure:report.failure, errors:report.errors, requests:report.failedRequests}));
  report.diagnostic = await page.evaluate(() => ({state:window.__RELAY_TEST__?.getState()?.zone,screen:window.__RELAY_TEST__?.getUI()?.screen,world:window.__RELAY_TEST__?.getWorld()?.actors.map(a=>({id:a.id,key:a.key,frame:a.animationFrame})),atlases:Object.keys(window.__RELAY_TEST__?.getWorld()?.atlases||{}),assetErrors:window.__RELAY_TEST__?.getWorld()?.assetErrors})).catch(()=>null);
  console.error(JSON.stringify(report.diagnostic));
  await page.screenshot({ path: fileURLToPath(new URL('loadout-failure.png', out)) }).catch(() => {});
  throw error;
} finally {
  await browser.close();
  await writeFile(new URL('loadout-report.json', out), `${JSON.stringify(report, null, 2)}\n`);
}
