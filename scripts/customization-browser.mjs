import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { CUSTOMIZATION_OPTIONS, initialCustomization } from '../src/customization.js';

// Start with RELAY_QA=1 npm run dev (port 4173 in vite.config.js). Override
// GAME_URL when using another development port. To exercise the bundled game too,
// build it, serve the preview on 4188, and set PRODUCTION_GAME_URL accordingly.
// The normal journey uses actual UI actions and only reads the QA harness.
// Separate, named save fixtures exercise migration and inventory restrictions.
const baseURL = process.env.GAME_URL || 'http://127.0.0.1:4173';
const productionURL = process.env.PRODUCTION_GAME_URL || null;
const out = new URL('../test-results/', import.meta.url);
const docs = new URL('../docs/qa/', import.meta.url);
const screenshots = new URL('../docs/screenshots/', import.meta.url);
await Promise.all([mkdir(out, { recursive: true }), mkdir(docs, { recursive: true }), mkdir(screenshots, { recursive: true })]);

const report = {
  version: '0.3.0', at: new Date().toISOString(), passed: false, browser: null,
  scope: 'Real creation/customization/equipment UI, draft cancellation and commit, keyboard, mobile layout, save/reload/export/import, and explicit imported-save fixtures. State and world are observed, never overwritten through the development harness. This does not establish pixel-perfect canon art or a native Windows launch.',
  urls: { development: baseURL, production: productionURL }, checks: [], fixtures: [],
  command: [process.env.PLAYWRIGHT_EXECUTABLE_PATH && `PLAYWRIGHT_EXECUTABLE_PATH=${process.env.PLAYWRIGHT_EXECUTABLE_PATH}`, `GAME_URL=${baseURL}`, productionURL && `PRODUCTION_GAME_URL=${productionURL}`, 'node scripts/customization-browser.mjs'].filter(Boolean).join(' '),
  errors: [], failedRequests: [], screenshots: [], production: { status: productionURL ? 'pending' : 'not-requested' },
};
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
  args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
report.browser = browser.version();
let page;
const record = check => { report.checks.push(check); console.log(JSON.stringify({ check: check.name, passed: true })); };
const stage = name => console.log(JSON.stringify({ stage: name, at: new Date().toISOString() }));
const action = (name, id) => page.locator(`[data-do="${name}"]${id === undefined ? '' : `[data-id="${id}"]`}`).first();
const choice = (field, id) => page.locator(`[data-do="custom-choice"][data-field="${field}"][data-id="${id}"]`);
const gear = (slot, id) => page.locator(`[data-do="custom-equip"][data-slot="${slot}"][data-id="${id}"]`);
const state = () => page.evaluate(() => structuredClone(window.__RELAY_TEST__.getState()));
const draft = () => page.evaluate(() => structuredClone(window.__RELAY_TEST__.getUI().customizationDraft));
const persisted = () => page.evaluate(() => JSON.parse(localStorage.getItem('relay-chronicles.save.v1'))?.state || null);
const relevant = current => ({ appearance: current.appearance, customization: current.customization, inventory: current.inventory, credits: current.credits });
const selected = { face: { skinTone: 'brown', eyeColor: 'green', hairColor: 'black', hairStyle: 'tied', preset: 'veteran' }, armor: { primary: 'teal', secondary: 'black', accent: 'orange', pattern: 'split', finish: 'gloss', helmet: 'visible' } };

function observe(target, scope) {
  target.setDefaultTimeout(45000);
  target.on('pageerror', error => report.errors.push({ scope, message: error.message }));
  target.on('requestfailed', request => report.failedRequests.push({ scope, url: request.url(), error: request.failure()?.errorText }));
  target.on('response', response => { if (response.status() >= 400) report.failedRequests.push({ scope, url: response.url(), status: response.status() }); });
}
async function idle(zone = 'normandy') {
  await page.waitForFunction(expected => {
    const qa = window.__RELAY_TEST__;
    return qa?.getState()?.zone === expected && !qa.getUI().busy;
  }, zone);
}
async function shot(name) {
  if (await page.locator('.customization-screen').count()) await page.waitForFunction(() => document.querySelector('[data-custom-canvas]')?.dataset.ready === 'true');
  const filename = `customization-${name}.png`;
  await page.screenshot({ path: fileURLToPath(new URL(filename, screenshots)) });
  report.screenshots.push(`docs/screenshots/${filename}`);
  const alias = { 'armor-desktop': 'customization-armor.png', 'character-mobile': 'customization-mobile.png' }[name];
  if (alias) {
    await copyFile(new URL(filename, screenshots), new URL(alias, screenshots));
    report.screenshots.push(`docs/screenshots/${alias}`);
  }
}
async function previewSignature() {
  await page.waitForFunction(() => document.querySelector('[data-custom-canvas]')?.dataset.ready === 'true');
  const image = await page.locator('.customization-preview').evaluate(element => {
    const drawings = [...element.querySelectorAll('svg,canvas,img')].map(drawing => drawing instanceof HTMLCanvasElement
      ? drawing.toDataURL() : drawing.outerHTML);
    if (!drawings.length) throw new Error('Preview contains no visible drawing');
    return drawings.join('\n');
  });
  return createHash('sha256').update(image).digest('hex');
}
async function layoutCheck(label) {
  const observed = await page.evaluate(() => {
    const screen = document.querySelector('.customization-screen');
    if (!screen) throw new Error('Customization screen missing for layout check');
    const controls = [...screen.querySelectorAll('button,input,select')].filter(element => {
      const style = getComputedStyle(element), rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    });
    const clipped = controls.filter(element => {
      const rect = element.getBoundingClientRect();
      return rect.left < -1 || rect.right > window.innerWidth + 1 || element.scrollWidth > element.clientWidth + 2;
    }).map(element => ({ label: element.getAttribute('aria-label') || element.textContent.trim(), do: element.dataset.do }));
    const preview = screen.querySelector('.customization-preview')?.getBoundingClientRect();
    return { viewport: { width: innerWidth, height: innerHeight }, documentWidth: document.documentElement.scrollWidth,
      screenWidth: screen.clientWidth, screenContentWidth: screen.scrollWidth, clipped,
      preview: preview && { width: preview.width, height: preview.height }, visibleControls: controls.length };
  });
  assert.equal(observed.documentWidth, observed.viewport.width, `${label}: no document overflow`);
  assert.ok(observed.screenContentWidth <= observed.screenWidth + 1, `${label}: no screen overflow`);
  assert.deepEqual(observed.clipped, [], `${label}: no horizontally clipped controls`);
  assert.ok(observed.preview?.width > 0 && observed.preview?.height > 0, `${label}: visible preview`);
  return { label, ...observed };
}
async function toWorld() {
  for (let attempts = 0; attempts < 4; attempts += 1) {
    const current = await page.evaluate(() => window.__RELAY_TEST__.getUI().screen);
    if (!current) return;
    assert.notEqual(current, 'customization', 'Explicitly apply/cancel the draft before leaving');
    await page.keyboard.press('Escape');
  }
  throw new Error('Could not return to exploration');
}
async function openFromPause() {
  await toWorld(); await page.keyboard.press('Escape'); await action('customization').click();
  await page.locator('.customization-screen').waitFor();
}
async function useChoices(section, values) {
  await action('custom-tab', section === 'face' ? 'character' : 'armor').click();
  for (const [field, id] of Object.entries(values)) await choice(`${section}.${field}`, id).click();
}
async function importSave(contents, filename) {
  const previous = await page.evaluateHandle(() => window.__RELAY_TEST__.getState());
  try {
    await page.locator('#save-import').setInputFiles({ name: filename, mimeType: 'application/json', buffer: Buffer.from(contents) });
    await page.waitForFunction(prior => window.__RELAY_TEST__.getState() !== prior && !window.__RELAY_TEST__.getUI().busy, previous);
    await idle();
  } finally { await previous.dispose(); }
}
async function exportSave(filename) {
  await toWorld(); await page.keyboard.press('Escape');
  const pending = page.waitForEvent('download'); await action('export').click();
  const download = await pending, target = fileURLToPath(new URL(filename, out));
  await download.saveAs(target);
  return readFile(target, 'utf8');
}

try {
  // Reject stale test option IDs before touching the UI.
  const categoryFor = { skinTone: 'skinTones', eyeColor: 'eyeColors', hairColor: 'hairColors', hairStyle: 'hairStyles', preset: 'facePresets', primary: 'armorColors', secondary: 'armorColors', accent: 'armorColors', pattern: 'patterns', finish: 'finishes', helmet: 'helmetModes' };
  for (const values of Object.values(selected)) for (const [field, id] of Object.entries(values)) {
    assert.ok(CUSTOMIZATION_OPTIONS[categoryFor[field]].some(option => option.id === id), `Known option ${field}/${id}`);
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  page = await context.newPage(); observe(page, 'development');
  stage('Loading development game');
  await page.goto(`${baseURL}/?qa`, { waitUntil: 'networkidle' });
  stage('Opening creation form');
  await page.getByRole('button', { name: /Nouvelle campagne/ }).click();
  await page.locator('#commander-name').fill('Jane Custom');
  await page.locator('#new-appearance').selectOption('female');
  await page.locator('#new-origin').selectOption('colonist');
  await page.locator('#new-profile').selectOption('war-hero');
  await action('customization-create').click();
  await page.locator('.customization-screen').waitFor();
  stage('Customization creation screen'); await shot('creation-initial');
  await choice('face.skinTone', 'tan').click();
  await action('custom-tab', 'armor').click(); await choice('armor.primary', 'alliance').click();
  await action('custom-tab', 'weapons').click(); await gear('weapon', 'storm-i').click();
  await action('custom-tab', 'character').click();
  await shot('creation'); await action('custom-apply').click();
  assert.equal(await page.locator('#commander-name').inputValue(), 'Jane Custom');
  await action('class', 'engineer').click();
  await page.getByRole('button', { name: /Commencer l’aventure/ }).click();
  await page.getByRole('button', { name: 'Je rejoins le briefing.' }).click(); await idle();
  const created = await state();
  assert.equal(created.appearance, 'female'); assert.equal(created.customization.face.skinTone, 'tan');
  assert.equal(created.customization.armor.primary, 'alliance');
  assert.equal(created.classId, 'engineer'); assert.equal(created.inventory.equipped.shepard.weapon, 'storm-i');
  record({ name: 'Creation customization and equipment survive a class change and reach the campaign', identity: created.name, appearance: created.appearance, skin: created.customization.face.skinTone, armor: created.customization.armor.primary, classChangedAfterCustomization: created.classId, weapon: created.inventory.equipped.shepard.weapon });

  await openFromPause();
  const beforeCancel = relevant(await state());
  await action('custom-appearance', 'male').click();
  assert.equal((await draft()).appearance, 'male');
  await choice('face.skinTone', selected.face.skinTone).click();
  assert.equal((await draft()).customization.face.skinTone, selected.face.skinTone);
  assert.deepEqual(relevant(await state()), beforeCancel, 'Draft edits do not mutate the live campaign');
  await action('custom-cancel').click();
  assert.deepEqual(relevant(await state()), beforeCancel, 'Cancel retains live appearance and equipment');
  await openFromPause(); await choice('face.hairColor', 'white').click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.customization-screen').count(), 0, 'Escape closes the draft');
  assert.deepEqual(relevant(await state()), beforeCancel, 'Escape discards pending changes');
  record({ name: 'Cancel and Escape discard detached drafts', liveStateUntouchedWhileEditing: true, inventoryUntouched: true });

  await toWorld(); await action('equipment').click(); await action('eq-tab', 'shop').click();
  await action('eq-buy', 'heat-sink-i').click(); await action('eq-buy', 'armor-plating-i').click();
  const afterShopping = await state();
  assert.equal(afterShopping.credits, beforeCancel.credits - 210);
  assert.equal(afterShopping.inventory.items['heat-sink-i'], 1); assert.equal(afterShopping.inventory.items['armor-plating-i'], 1);
  await action('customization').click();
  await useChoices('face', selected.face); await useChoices('armor', selected.armor);
  await action('custom-slot', 'armorMod').click(); await gear('armorMod', 'armor-plating-i').click();
  await action('custom-tab', 'weapons').click();
  await action('custom-slot', 'weapon').click(); await gear('weapon', 'kessler-i').click(); await gear('weapon', 'storm-i').click();
  await action('custom-slot', 'weaponMod').click(); await gear('weaponMod', 'heat-sink-i').click();
  const readyDraft = await draft();
  assert.equal(readyDraft.equipment.weapon, 'storm-i'); assert.equal(readyDraft.equipment.weaponMod, 'heat-sink-i');
  assert.equal(readyDraft.equipment.armorMod, 'armor-plating-i');
  assert.deepEqual(relevant(await state()), relevant(afterShopping), 'Loadout remains detached until Apply');
  assert.ok(await page.locator('.custom-stat').count() > 0, 'Equipment statistics are visible');
  await shot('weapons-desktop');
  await action('custom-tab', 'character').focus(); await page.keyboard.press('Enter');
  assert.equal(await choice('face.skinTone', selected.face.skinTone).count(), 1, 'Tab activation works with the keyboard');
  await choice('face.eyeColor', selected.face.eyeColor).focus(); await page.keyboard.press('Space');
  assert.equal((await draft()).customization.face.eyeColor, selected.face.eyeColor);
  const directions = [];
  for (const direction of ['front', 'right', 'back', 'left']) {
    await action('custom-view', direction).click();
    const signature = await previewSignature(); directions.push({ direction, signature });
  }
  assert.ok(new Set(directions.map(entry => entry.signature)).size >= 3, 'Direction controls update the visible preview');
  await action('custom-view', 'front').click();
  const changedPreview = await previewSignature();
  await action('custom-compare').click();
  const comparisonPreview = await previewSignature();
  assert.notEqual(comparisonPreview, changedPreview, 'Compare changes the visible preview');
  await action('custom-compare').click();
  assert.equal(await previewSignature(), changedPreview, 'Leaving comparison restores the draft preview');
  const desktop = await layoutCheck('1440 × 1000'); await shot('character-desktop');
  await action('custom-tab', 'armor').click(); await shot('armor-desktop');
  await action('custom-apply').click();
  const applied = await state();
  assert.deepEqual(applied.customization, readyDraft.customization); assert.deepEqual(applied.inventory.equipped.shepard, readyDraft.equipment);
  assert.deepEqual(relevant(await persisted()), relevant(applied), 'Apply saves the committed appearance and equipment');
  record({ name: 'Real purchased modules, customization, comparison and atomic application', creditsSpent: 210, directions, keyboardActivation: true, equipment: applied.inventory.equipped.shepard, desktop });

  await toWorld();
  await page.waitForFunction(() => {
    const world = window.__RELAY_TEST__.getWorld();
    const actor = world.actors.find(entry => entry.id === 'shepard');
    return actor?.body?.material?.map?.isCanvasTexture && world.renderer.info.render.calls > 0;
  });
  const worldObserved = await page.evaluate(() => {
    const world = window.__RELAY_TEST__.getWorld(), actor = world.actors.find(entry => entry.id === 'shepard');
    const texture = actor?.body?.material?.map, source = texture?.userData?.relayCustomizationSource;
    let changedPixels = 0, alphaDifferences = 0;
    if (texture?.image instanceof HTMLCanvasElement && source?.image) {
      const canvas = document.createElement('canvas'); canvas.width = texture.image.width; canvas.height = texture.image.height;
      const context = canvas.getContext('2d');
      context.drawImage(source.image, Math.round(source.offset.x * source.image.width),
        Math.round((1 - source.offset.y - source.repeat.y) * source.image.height),
        Math.round(source.repeat.x * source.image.width), Math.round(source.repeat.y * source.image.height),
        0, 0, canvas.width, canvas.height);
      const original = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const rendered = texture.image.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      for (let index = 0; index < rendered.length; index += 4) {
        if (rendered[index] !== original[index] || rendered[index + 1] !== original[index + 1] || rendered[index + 2] !== original[index + 2]) changedPixels += 1;
        if (rendered[index + 3] !== original[index + 3]) alphaDifferences += 1;
      }
    }
    return { appearance: world.commanderAppearance, customization: world.commanderCustomization,
      actorKey: actor?.key, draws: world.renderer.info.render.calls, triangles: world.renderer.info.render.triangles,
      canvasTexture: texture?.isCanvasTexture === true, changedPixels, alphaDifferences,
      materialDataKeys: Object.keys(actor?.body?.material?.userData || {}), assetErrors: world.assetErrors || [] };
  });
  assert.equal(worldObserved.appearance, applied.appearance); assert.ok(worldObserved.draws > 0);
  assert.deepEqual(worldObserved.customization, applied.customization, 'Exploration receives committed appearance choices');
  assert.equal(worldObserved.canvasTexture, true); assert.ok(worldObserved.changedPixels > 0, 'The actual world texture has recolored pixels');
  assert.equal(worldObserved.alphaDifferences, 0, 'Customization preserves sprite transparency');
  assert.deepEqual(worldObserved.assetErrors, []);
  await shot('world'); record({ name: 'Committed customization reaches the rendered world', ...worldObserved });

  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Reprendre/ }).click(); await idle();
  assert.deepEqual(relevant(await state()), relevant(applied), 'Automatic resume preserves the committed customization');
  const serialized = await exportSave('customization-export.json');
  assert.deepEqual(relevant(JSON.parse(serialized).state), relevant(applied));
  await importSave(serialized, 'customization-export.json');
  assert.deepEqual(relevant(await state()), relevant(applied), 'Import restores the exported customization');
  await toWorld(); await page.keyboard.press('Escape'); await action('manual-saves').click();
  await page.locator('#manual-save-name-1').fill('Personnalisation confirmée'); await action('manual-save', '1').click();
  await page.waitForFunction(() => document.querySelector('[data-save-slot="1"]')?.dataset.status === 'saved');
  await action('manual-back').click(); await action('customization').click();
  await choice('face.skinTone', 'ebony').click(); await action('custom-apply').click();
  await toWorld(); await page.keyboard.press('Escape'); await action('manual-saves').click(); await action('manual-load', '1').click(); await idle();
  assert.deepEqual(relevant(await state()), relevant(applied), 'Manual restore recovers the saved customization');
  record({ name: 'Automatic resume, downloaded JSON export/import and named manual restore', exactCustomizationPreserved: true, exactInventoryPreserved: true, manualSlot: 1 });

  await page.setViewportSize({ width: 360, height: 800 }); await openFromPause();
  const mobile = [];
  for (const tab of ['character', 'armor', 'weapons']) {
    await action('custom-tab', tab).click(); mobile.push(await layoutCheck(`360 × 800 / ${tab}`)); await shot(`${tab}-mobile`);
  }
  await action('custom-tab', 'character').click(); await choice('face.skinTone', 'fair').click();
  await action('custom-reset').click();
  assert.deepEqual((await draft()).customization, applied.customization, 'Reset returns to the committed appearance');
  assert.deepEqual(relevant(await state()), relevant(applied), 'Reset only affects the draft');
  await action('custom-cancel').click(); assert.deepEqual(relevant(await state()), relevant(applied));
  record({ name: 'Mobile tabs, scrollable controls and draft-only reset', mobile });
  await page.setViewportSize({ width: 1440, height: 1000 });

  // Deliberate migration fixture: remove only the new field from an actual UI export.
  const oldSave = JSON.parse(serialized); delete oldSave.state.customization;
  await importSave(JSON.stringify(oldSave), 'fixture-pre-customization-save.json');
  const migrated = await state(); assert.deepEqual(migrated.customization, initialCustomization(migrated.appearance));
  assert.deepEqual(migrated.inventory, applied.inventory); assert.equal(migrated.name, applied.name);
  report.fixtures.push({ name: 'pre-customization-save', source: 'actual UI export', changes: ['customization field removed'], importedViaUI: true });
  record({ name: 'Legacy save without customization migrates without losing inventory or identity', defaults: migrated.customization, preservedName: migrated.name });

  // Deliberate restrictions fixture: inventory-only changes, with no claim that
  // advanced gear was earned through normal progression in this QA journey.
  const restricted = JSON.parse(serialized);
  restricted.state.inventory.items['onyx-turian-i'] = 1;
  restricted.state.inventory.items['colossus-human-vii'] = 1;
  restricted.state.inventory.equipped.jenkins = { weapon: 'avenger-i', armor: null, weaponMod: null, ammoMod: null, armorMod: null };
  await importSave(JSON.stringify(restricted), 'fixture-customization-restrictions.json'); await openFromPause();
  await action('custom-tab', 'armor').click(); await action('custom-slot', 'armor').click();
  await action('custom-show-all').click();
  for (const id of ['onyx-turian-i', 'colossus-human-vii']) {
    const button = gear('armor', id);
    assert.equal(await button.count(), 1, `${id} appears in the complete catalog`);
    assert.equal(await button.isDisabled(), true, `${id} cannot be equipped`);
  }
  await action('custom-tab', 'weapons').click(); await action('custom-slot', 'weapon').click();
  const reservedWeapon = gear('weapon', 'avenger-i');
  assert.equal(await reservedWeapon.count(), 1); assert.equal(await reservedWeapon.isDisabled(), true, 'The only copy carried by Jenkins is unavailable');
  const unownedWeapon = gear('weapon', 'hmwa-vii');
  assert.equal(await unownedWeapon.count(), 1); assert.equal(await unownedWeapon.isDisabled(), true, 'Unowned gear cannot be equipped');
  const restrictedBefore = relevant(await state());
  await action('custom-cancel').click(); assert.deepEqual(relevant(await state()), restrictedBefore);
  report.fixtures.push({ name: 'inventory-restrictions', source: 'actual UI export', changes: ['owned Turian armor', 'owned level-6 armor at level 1', 'Jenkins reserves the only Avenger I'], importedViaUI: true });
  record({ name: 'Explicit inventory fixture excludes or disables incompatible, over-level, reserved and unowned gear', liveInventoryPreserved: true });
  await importSave(serialized, 'customization-original-journey.json');

  if (productionURL) {
    await context.close();
    const productionContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    page = await productionContext.newPage(); observe(page, 'production');
    await page.goto(`${productionURL}/?qa`, { waitUntil: 'networkidle' });
    assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined', 'No development harness in the bundled game');
    await page.getByRole('button', { name: /Nouvelle campagne/ }).click();
    await page.locator('#commander-name').fill('Production Custom'); await page.locator('#new-appearance').selectOption('female');
    await action('customization-create').click(); await choice('face.skinTone', 'brown').click();
    await action('custom-tab', 'armor').click(); await choice('armor.primary', 'teal').click(); await action('custom-apply').click();
    await page.getByRole('button', { name: /Commencer l’aventure/ }).click();
    await page.getByRole('button', { name: 'Je rejoins le briefing.' }).click();
    await page.locator('.location h2').filter({ hasText: 'Normandy' }).waitFor();
    const productionSaved = await persisted();
    assert.equal(productionSaved.customization.face.skinTone, 'brown'); assert.equal(productionSaved.customization.armor.primary, 'teal');
    await page.keyboard.press('Escape'); await action('customization').click();
    await action('custom-tab', 'armor').click(); await choice('armor.accent', 'orange').click(); await action('custom-apply').click();
    const committedProduction = await persisted(); assert.equal(committedProduction.customization.armor.accent, 'orange');
    await page.reload({ waitUntil: 'networkidle' }); await page.getByRole('button', { name: /Reprendre/ }).click();
    await page.locator('.location h2').filter({ hasText: 'Normandy' }).waitFor();
    await page.keyboard.press('Escape'); await action('customization').click(); await action('custom-tab', 'armor').click();
    assert.deepEqual((await persisted()).customization, committedProduction.customization);
    const productionLayout = await layoutCheck('Production 1440 × 1000'); await shot('production');
    const webgl = await page.evaluate(() => {
      const canvas = document.querySelector('#world canvas'), gl = canvas?.getContext('webgl2');
      return { available: !!gl, lost: gl?.isContextLost(), width: canvas?.width, height: canvas?.height };
    });
    assert.equal(webgl.available, true); assert.equal(webgl.lost, false); assert.ok(webgl.width > 0 && webgl.height > 0);
    report.production = { status: 'passed', uiCreation: true, uiApplication: true, reload: true, developmentHarness: 'absent', layout: productionLayout, webgl };
    record({ name: 'Built production game creates, applies and resumes customization through UI', ...report.production });
  }

  assert.deepEqual(report.errors, [], 'No uncaught browser errors'); assert.deepEqual(report.failedRequests, [], 'No failed HTTP/asset requests');
  report.passed = true;
  await writeFile(new URL('customization-report.json', docs), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ passed: true, checks: report.checks.length, screenshots: report.screenshots.length, production: report.production.status }));
} catch (error) {
  report.failure = error.stack || String(error); console.error(report.failure);
  console.error(JSON.stringify({ errors: report.errors, failedRequests: report.failedRequests }));
  if (page) await page.screenshot({ path: fileURLToPath(new URL('customization-failure.png', out)) }).catch(() => {});
  throw error;
} finally {
  await browser.close();
  await writeFile(new URL('customization-report.json', out), `${JSON.stringify(report, null, 2)}\n`);
}
