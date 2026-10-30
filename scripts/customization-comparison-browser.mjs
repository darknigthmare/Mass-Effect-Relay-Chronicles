import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { newGame, encodeSave, decodeSave } from '../src/state.js';
import { actorFor } from '../src/game-data.js';
import { buyItem, equipItem, SLOTS } from '../src/loadout.js';

// Run against an already running development build with its read-only QA
// observers available. Fixtures are constructed in Node and imported through
// the real title-screen file chooser. No harness setter or storage write is used.
// CUSTOMIZATION_BASE_MAIN must identify the actual baseline being checked.
// RELAY_BUILD_KIND describes the served build, e.g. vite-development or
// esbuild-diagnostic; the report never infers a Vite build from the port number.
const baseMain = process.env.CUSTOMIZATION_BASE_MAIN;
assert.match(baseMain || '', /^[0-9a-f]{40}$/,
  'CUSTOMIZATION_BASE_MAIN is required and must be the exact 40-character baseline SHA.');
const prefix = process.env.CUSTOMIZATION_REPORT_PREFIX || 'customization-comparison';
assert.match(prefix, /^[a-z0-9][a-z0-9-]*$/, 'CUSTOMIZATION_REPORT_PREFIX must be a filename prefix.');
const entry = new URL(process.env.GAME_URL || 'http://127.0.0.1:4173');
assert.ok(['http:', 'https:'].includes(entry.protocol), 'GAME_URL must be an HTTP development server.');
entry.searchParams.set('qa', '');
const output = new URL('../test-results/', import.meta.url);
await mkdir(output, { recursive: true });
const sha256 = data => createHash('sha256').update(data).digest('hex');
const started = Date.now();
const require = createRequire(import.meta.url);
const packageMetadata = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const report = {
  version: packageMetadata.version, at: new Date().toISOString(), passed: false,
  baseMain, buildKind: process.env.RELAY_BUILD_KIND || 'unspecified', url: entry.href,
  scope: 'Real customization UI: separate item inspection and draft, technological/biotic comparisons, apply/reload, cancellation, unavailable equipment, attachment returns, desktop/mobile and enlarged text. Imported Node-generated QA fixtures are explicit; credits and equipment were not earned by playing the campaign. The QA harness is read only. This is not a production, Electron, Windows, art-fidelity or performance certification.',
  tools: { node: process.version, playwright: require('playwright/package.json').version, browser: null },
  command: {
    script: 'node scripts/customization-comparison-browser.mjs',
    environment: { CUSTOMIZATION_BASE_MAIN: baseMain, GAME_URL: entry.href,
      RELAY_BUILD_KIND: process.env.RELAY_BUILD_KIND || null,
      CUSTOMIZATION_REPORT_PREFIX: prefix,
      PLAYWRIGHT_EXECUTABLE_PATH: process.env.PLAYWRIGHT_EXECUTABLE_PATH || null },
  },
  fixtures: [], checks: [], layouts: [], screenshots: [], errors: [], failedRequests: [],
};
report.sources = Object.fromEntries(await Promise.all([
  'package.json', 'src/main.js', 'src/state.js', 'src/game-data.js', 'src/loadout.js',
  'src/tool-data.js', 'src/character-data.js', 'src/customization.js', 'src/customization-ui.js',
  'src/customization-ui.css', 'src/customization-render.js', 'scripts/customization-comparison-browser.mjs',
].map(async path => [path, sha256(await readFile(new URL(`../${path}`, import.meta.url)))])));

const close = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-9,
  `${message}: expected ${expected}, received ${actual}`);
const possessions = state => ({ credits: state.credits, items: state.inventory.items, stock: state.inventory.stock });
const configuration = state => ({ appearance: state.appearance, customization: state.customization,
  inventory: state.inventory, credits: state.credits, xp: state.xp, classId: state.classId,
  origin: state.origin, psychologicalProfile: state.psychologicalProfile,
  choices: state.choices, completed: state.completed, recruited: state.recruited, lost: state.lost });
const action = (page, name, id) => page.locator(`[data-do="${name}"]${id === undefined ? '' : `[data-id="${id}"]`}`).first();
const gear = (page, slot, id) => page.locator(`[data-do="custom-equip"][data-slot="${slot}"][data-id="${id}"]`);
const liveState = page => page.evaluate(() => structuredClone(window.__RELAY_TEST__.getState()));
const liveDraft = page => page.evaluate(() => structuredClone(window.__RELAY_TEST__.getUI().customizationDraft));
const savedState = page => page.evaluate(() => JSON.parse(localStorage.getItem('relay-chronicles.save.v1'))?.state || null);
const record = (name, details = {}) => {
  report.checks.push({ name, passed: true, ...details });
  console.log(JSON.stringify({ check: name, passed: true }));
};
const stage = name => console.log(JSON.stringify({ stage: name, at: new Date().toISOString() }));
let browser, activePage;

function observe(page, label) {
  page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push({ page: label, message: error.message }));
  page.on('requestfailed', request => report.failedRequests.push({ page: label, url: request.url(), error: request.failure()?.errorText }));
  page.on('response', response => {
    if (response.status() >= 400) report.failedRequests.push({ page: label, url: response.url(), status: response.status() });
  });
}

async function makeFixture(label, classId, withAttachments) {
  const state = newGame({ name: label, classId });
  state.credits = 3000;
  state.settings.sound = false;
  state.settings.reducedMotion = true;
  const purchases = classId === 'sentinel'
    ? ['omni-tool-upgraded', 'biotic-amp-upgraded', 'heat-sink-i', 'heat-sink-i', 'armor-piercing-rounds-i']
    : ['biotic-amp-upgraded'];
  for (const id of purchases) {
    const result = buyItem(state, id);
    assert.equal(result.ok, true, `Fixture purchase ${id}: ${result.reason || 'ok'}`);
  }
  if (withAttachments) {
    for (const [slot, id] of [['weaponMod', 'heat-sink-i'], ['weaponMod2', 'heat-sink-i'], ['ammoMod', 'armor-piercing-rounds-i']]) {
      const result = equipItem(state, 'shepard', id, slot);
      assert.equal(result.ok, true, `Fixture equipment ${slot}: ${result.reason || 'ok'}`);
    }
  }
  const serialized = encodeSave(state);
  assert.deepEqual(decodeSave(serialized), state, 'Fixture uses the real save validator');
  const filename = `${prefix}-fixture-${classId}.json`;
  await writeFile(new URL(filename, output), serialized);
  report.fixtures.push({ label, file: `test-results/${filename}`, sha256: sha256(serialized),
    generator: 'newGame + explicit 3000-credit QA budget + buyItem + equipItem + encodeSave',
    classId, purchases, attachmentSlots: withAttachments ? ['weaponMod', 'weaponMod2', 'ammoMod'] : [],
    importedViaUI: false, startingPossessions: possessions(state) });
  return { label, filename, serialized, state };
}

async function idle(page, name) {
  await page.waitForFunction(expected => {
    const qa = window.__RELAY_TEST__;
    return qa?.getState()?.zone === 'normandy' && !qa.getUI().busy
      && (!expected || qa.getState().name === expected);
  }, name || null);
}

async function importFixture(page, fixture) {
  await page.goto(entry.href, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__RELAY_TEST__?.getUI);
  const previous = await page.evaluateHandle(() => window.__RELAY_TEST__.getState());
  try {
    const chooser = page.waitForEvent('filechooser');
    await action(page, 'import').click();
    await (await chooser).setFiles({ name: fixture.filename, mimeType: 'application/json', buffer: Buffer.from(fixture.serialized) });
    await page.waitForFunction(prior => window.__RELAY_TEST__.getState() !== prior
      && !window.__RELAY_TEST__.getUI().busy, previous);
    await idle(page, fixture.label);
    assert.deepEqual(configuration(await liveState(page)), configuration(fixture.state));
    report.fixtures.find(item => item.file === `test-results/${fixture.filename}`).importedViaUI = true;
  } finally { await previous.dispose(); }
}

async function toWorld(page) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const screen = await page.evaluate(() => window.__RELAY_TEST__.getUI().screen);
    if (!screen) return;
    assert.notEqual(screen, 'customization', 'Apply or cancel a draft explicitly before leaving');
    await page.keyboard.press('Escape');
  }
  throw new Error('The UI did not return to exploration.');
}

async function openWorkshop(page) {
  await toWorld(page);
  await page.keyboard.press('Escape');
  await action(page, 'customization').click();
  await page.locator('.customization-screen').waitFor();
  await action(page, 'custom-tab', 'weapons').click();
}

async function stat(page, key, expectedBefore, expectedAfter, item = false) {
  const selector = item ? `[data-custom-inspection] [data-item-stat="${key}"]` : `.custom-stat[data-stat="${key}"]`;
  const row = page.locator(selector);
  assert.equal(await row.count(), 1, `${selector}: one comparison`);
  const values = await row.evaluate(element => ({ before: Number(element.dataset.before), after: Number(element.dataset.after), text: element.innerText }));
  close(values.before, expectedBefore, `${key} before`);
  close(values.after, expectedAfter, `${key} after`);
  if (['techMultiplier', 'bioticMultiplier'].includes(key)) {
    for (const value of [expectedBefore, expectedAfter]) {
      assert.ok(values.text.includes(`× ${value.toFixed(2).replace('.', ',')}`), `${key}: multiplier is legible and uses French decimals`);
    }
  }
  return values;
}

async function inspector(page, id, slot, status) {
  const panel = page.locator('[data-custom-inspection]');
  assert.equal(await panel.count(), 1, 'One equipment inspector');
  const observed = await panel.evaluate(element => ({ id: element.dataset.inspectionId,
    slot: element.dataset.inspectionSlot, status: element.dataset.inspectionStatus,
    text: element.innerText, hypotheticalRows: element.querySelectorAll('[data-item-stat]').length }));
  assert.equal(observed.id, id); assert.equal(observed.slot, slot); assert.equal(observed.status, status);
  if (['unavailable', 'empty'].includes(status)) assert.equal(observed.hypotheticalRows, 0);
  return observed;
}

async function shot(page, name, selector) {
  if (selector) await page.locator(selector).first().scrollIntoViewIfNeeded();
  const filename = `${prefix}-${name}.png`;
  await page.screenshot({ path: fileURLToPath(new URL(filename, output)), animations: 'disabled' });
  report.screenshots.push({ file: `test-results/${filename}`, viewport: page.viewportSize(),
    focusedSelector: selector || null, capture: 'actual browser viewport after scrolling to the referenced content' });
}

async function layout(page, label) {
  const observed = await page.evaluate(() => {
    const screen = document.querySelector('.customization-screen'), inspector = screen?.querySelector('.custom-inspector');
    if (!screen || !inspector) throw new Error('Workshop inspector is missing.');
    const nodes = [...inspector.querySelectorAll('[data-stat], [data-item-stat], [data-custom-inspection], [data-stat] > div:first-child, [data-item-stat] > div:first-child, [data-custom-inspection] h4, [data-custom-inspection] p')];
    const overflowing = nodes.filter(element => {
      const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none'
        && (rect.left < -1 || rect.right > innerWidth + 1 || element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 2);
    }).map(element => ({ selector: element.dataset.stat || element.dataset.itemStat || element.className,
      text: element.textContent.trim(), width: element.clientWidth, contentWidth: element.scrollWidth }));
    return { viewport: { width: innerWidth, height: innerHeight }, largeText: document.body.classList.contains('large-text'),
      documentWidth: document.documentElement.scrollWidth, screenWidth: screen.clientWidth,
      screenContentWidth: screen.scrollWidth, inspectorWidth: inspector.clientWidth,
      inspectorContentWidth: inspector.scrollWidth, comparedElements: nodes.length, overflowing };
  });
  assert.equal(observed.documentWidth, observed.viewport.width, `${label}: no document overflow`);
  assert.ok(observed.screenContentWidth <= observed.screenWidth + 1, `${label}: no workshop overflow`);
  assert.ok(observed.inspectorContentWidth <= observed.inspectorWidth + 1, `${label}: no inspector overflow`);
  assert.ok(observed.comparedElements > 0, `${label}: actual comparison elements were inspected`);
  assert.deepEqual(observed.overflowing, [], `${label}: no clipped comparison or inspected-item text`);
  report.layouts.push({ label, ...observed });
  return observed;
}

async function setLargeText(page, enabled) {
  await toWorld(page); await page.keyboard.press('Escape'); await action(page, 'settings').click();
  await page.locator('#text-setting').setChecked(enabled);
  assert.equal((await liveState(page)).settings.largeText, enabled);
  assert.equal(await page.locator('body').evaluate(element => element.classList.contains('large-text')), enabled);
  // The checkbox retains focus, and global Escape ignores input targets.
  await action(page, 'close').click();
  await page.waitForFunction(() => window.__RELAY_TEST__.getUI().screen === null);
}

try {
  const sentinel = await makeFixture('QA Sentinelle', 'sentinel', true);
  const soldier = await makeFixture('QA Soldat', 'soldier', false);
  browser = await chromium.launch({ headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  report.tools.browser = browser.version();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = activePage = await context.newPage(); observe(page, 'sentinel');
  stage('Importing the explicit Sentinel fixture through the title UI');
  await importFixture(page, sentinel); await openWorkshop(page);
  const initial = await liveState(page), initialPossessions = possessions(initial);
  assert.deepEqual(Object.keys(initial.inventory.equipped.shepard).sort(), [...SLOTS].sort());

  await action(page, 'custom-slot', 'omniTool').click();
  const untouched = { state: await liveState(page), draft: await liveDraft(page) };
  await action(page, 'custom-inspect', 'omni-tool-upgraded').click();
  const omniInspection = await inspector(page, 'omni-tool-upgraded', 'omniTool', 'available');
  await stat(page, 'techMultiplier', 1, 1);
  await stat(page, 'techMultiplier', 1, 1.15, true);
  assert.deepEqual({ state: await liveState(page), draft: await liveDraft(page) }, untouched);
  await shot(page, 'desktop-omni-inspection', '[data-custom-inspection]');
  record('Owned tool inspection is hypothetical and leaves campaign and draft unchanged', { inspection: omniInspection });

  await gear(page, 'omniTool', 'omni-tool-upgraded').click();
  await stat(page, 'techMultiplier', 1, 1.15);
  await action(page, 'custom-slot', 'bioticAmp').click();
  const beforeBioticInspection = await liveDraft(page);
  await action(page, 'custom-inspect', 'biotic-amp-upgraded').click();
  await inspector(page, 'biotic-amp-upgraded', 'bioticAmp', 'available');
  await stat(page, 'techMultiplier', 1, 1.15);
  await stat(page, 'bioticMultiplier', 1, 1);
  await stat(page, 'bioticMultiplier', 1, 1.15, true);
  assert.deepEqual(await liveDraft(page), beforeBioticInspection);
  assert.deepEqual(await liveState(page), untouched.state);
  await shot(page, 'desktop-biotic-inspection', '[data-custom-inspection]');
  await gear(page, 'bioticAmp', 'biotic-amp-upgraded').click();
  const technology = await stat(page, 'techMultiplier', 1, 1.15), biotics = await stat(page, 'bioticMultiplier', 1, 1.15);
  await inspector(page, 'biotic-amp-upgraded', 'bioticAmp', 'prepared');
  assert.equal((await liveDraft(page)).equipment.bioticAmp, 'biotic-amp-upgraded');
  assert.deepEqual(await liveState(page), untouched.state);
  await layout(page, 'desktop 1440 × 1000');
  await shot(page, 'desktop-prepared-statistics', '[data-stat="bioticMultiplier"]');
  record('Preparing both tools displays their actual multipliers without applying or charging again', { technology, biotics });

  await action(page, 'custom-apply').click();
  await page.waitForFunction(() => window.__RELAY_TEST__.getUI().screen !== 'customization');
  const applied = await liveState(page);
  assert.deepEqual(possessions(applied), initialPossessions);
  assert.equal(applied.inventory.equipped.shepard.omniTool, 'omni-tool-upgraded');
  assert.equal(applied.inventory.equipped.shepard.bioticAmp, 'biotic-amp-upgraded');
  close(actorFor('shepard', applied).techMultiplier, 1.15, 'applied technology');
  close(actorFor('shepard', applied).bioticMultiplier, 1.15, 'applied biotics');
  assert.deepEqual(configuration(await savedState(page)), configuration(applied));
  await page.reload({ waitUntil: 'networkidle' }); await action(page, 'continue').click(); await idle(page, sentinel.label);
  assert.deepEqual(configuration(await liveState(page)), configuration(applied));
  await openWorkshop(page);
  await stat(page, 'techMultiplier', 1.15, 1.15); await stat(page, 'bioticMultiplier', 1.15, 1.15);
  assert.deepEqual(Object.keys((await liveState(page)).inventory.equipped.shepard).sort(), [...SLOTS].sort());
  record('Apply and automatic resume preserve both tools, nine ports, quantities and credits', { possessions: initialPossessions, slots: SLOTS });

  await action(page, 'custom-slot', 'omniTool').click(); await gear(page, 'omniTool', '').click();
  await action(page, 'custom-slot', 'bioticAmp').click(); await gear(page, 'bioticAmp', '').click();
  await stat(page, 'techMultiplier', 1.15, 1); await stat(page, 'bioticMultiplier', 1.15, 1);
  await inspector(page, '', 'bioticAmp', 'empty');
  assert.deepEqual(configuration(await liveState(page)), configuration(applied));
  assert.deepEqual(configuration(await savedState(page)), configuration(applied));
  await action(page, 'custom-cancel').click();
  assert.deepEqual(configuration(await liveState(page)), configuration(applied));
  assert.deepEqual(configuration(await savedState(page)), configuration(applied));
  record('Cancelling tool removal keeps the applied loadout and automatic save intact');

  await openWorkshop(page); await action(page, 'custom-slot', 'omniTool').click();
  await action(page, 'custom-show-all').click();
  const beforeUnavailable = { state: await liveState(page), draft: await liveDraft(page) };
  await action(page, 'custom-inspect', 'omni-tool-standard').click();
  const unavailable = await inspector(page, 'omni-tool-standard', 'omniTool', 'unavailable');
  assert.match(unavailable.text, /inventaire|exemplaire|posséd|acqu/i);
  assert.equal(await gear(page, 'omniTool', 'omni-tool-standard').isDisabled(), true);
  assert.deepEqual({ state: await liveState(page), draft: await liveDraft(page) }, beforeUnavailable);
  await shot(page, 'desktop-unowned-tool', '[data-custom-inspection]');
  record('An unowned tool explains its refusal and exposes no hypothetical statistics', { inspection: unavailable });

  await action(page, 'custom-slot', 'weapon').click();
  const beforeWeapon = { state: await liveState(page), draft: await liveDraft(page) };
  await action(page, 'custom-inspect', 'kessler-i').click();
  const replacement = await inspector(page, 'kessler-i', 'weapon', 'available');
  await stat(page, 'weaponHeatMultiplier', .81, .81);
  await stat(page, 'weaponHeatMultiplier', .81, 1, true);
  await stat(page, 'weaponCoolingBonus', 2, 0, true);
  await stat(page, 'syntheticDamageBonus', .15, 0, true);
  assert.match(replacement.text, /Dissipateur thermique I/); assert.match(replacement.text, /Munitions perforantes I/);
  assert.deepEqual({ state: await liveState(page), draft: await liveDraft(page) }, beforeWeapon);
  await shot(page, 'desktop-weapon-attachment-returns', '[data-custom-inspection]');
  await action(page, 'custom-cancel').click();
  record('A replacement-weapon inspection includes the return of both weapon modules and ammunition without applying it', { inspection: replacement });

  for (const configurationCase of [
    { label: 'mobile', viewport: { width: 390, height: 844 }, largeText: false },
    { label: 'desktop-large-text', viewport: { width: 1440, height: 1000 }, largeText: true },
    { label: 'mobile-large-text', viewport: { width: 390, height: 844 }, largeText: true },
  ]) {
    stage(`Checking ${configurationCase.label}`);
    await page.setViewportSize(configurationCase.viewport);
    await setLargeText(page, configurationCase.largeText); await openWorkshop(page);
    await action(page, 'custom-slot', 'bioticAmp').click(); await gear(page, 'bioticAmp', '').click();
    await action(page, 'custom-inspect', 'biotic-amp-upgraded').click();
    await stat(page, 'bioticMultiplier', 1.15, 1);
    await stat(page, 'bioticMultiplier', 1, 1.15, true);
    await inspector(page, 'biotic-amp-upgraded', 'bioticAmp', 'available');
    await layout(page, configurationCase.label);
    await shot(page, `${configurationCase.label}-statistics`, '[data-stat="bioticMultiplier"]');
    await shot(page, `${configurationCase.label}-inspection`, '[data-custom-inspection]');
    await action(page, 'custom-cancel').click();
    assert.deepEqual(configuration(await liveState(page)), configuration(applied));
    assert.deepEqual(possessions(await liveState(page)), initialPossessions);
  }
  record('Desktop, mobile and enlarged-text comparisons remain horizontally readable and cancellation stays reachable',
    { layouts: report.layouts.map(({ label, viewport, largeText }) => ({ label, viewport, largeText })) });

  const soldierContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const soldierPage = activePage = await soldierContext.newPage(); observe(soldierPage, 'soldier');
  stage('Importing the explicit incompatible-tool fixture');
  await importFixture(soldierPage, soldier); await openWorkshop(soldierPage);
  await action(soldierPage, 'custom-slot', 'bioticAmp').click();
  const beforeSoldier = { state: await liveState(soldierPage), draft: await liveDraft(soldierPage) };
  await action(soldierPage, 'custom-inspect', 'biotic-amp-upgraded').click();
  const incompatible = await inspector(soldierPage, 'biotic-amp-upgraded', 'bioticAmp', 'unavailable');
  assert.match(incompatible.text, /biotique/i);
  assert.equal(await gear(soldierPage, 'bioticAmp', 'biotic-amp-upgraded').isDisabled(), true);
  assert.deepEqual({ state: await liveState(soldierPage), draft: await liveDraft(soldierPage) }, beforeSoldier);
  await shot(soldierPage, 'desktop-incompatible-tool', '[data-custom-inspection]');
  await action(soldierPage, 'custom-cancel').click();
  assert.deepEqual(configuration(await liveState(soldierPage)), configuration(soldier.state));
  record('An owned biotic amplifier stays unavailable to the Soldier and grants no ability', { inspection: incompatible });

  assert.deepEqual(report.errors, [], 'No browser JavaScript errors');
  assert.deepEqual(report.failedRequests, [], 'No failed resource requests');
  report.passed = true;
  console.log(JSON.stringify({ passed: true, checks: report.checks.length, layouts: report.layouts.length,
    screenshots: report.screenshots.length, buildKind: report.buildKind }));
} catch (error) {
  report.failure = error.stack || String(error);
  console.error(report.failure);
  if (activePage) await shot(activePage, 'failure').catch(() => {});
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  report.finishedAt = new Date().toISOString();
  report.elapsedSeconds = Math.round((Date.now() - started) / 10) / 100;
  await writeFile(new URL(`${prefix}-browser-report.json`, output), `${JSON.stringify(report, null, 2)}\n`);
}
