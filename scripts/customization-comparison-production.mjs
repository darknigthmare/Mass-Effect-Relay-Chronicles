import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { decodeSave } from '../src/state.js';

// A focused check of an already built dist served by a production preview.
// First run customization-comparison-browser.mjs to create its explicit QA
// fixture. All campaign changes below use the real file chooser and UI buttons.
// No runtime state, save storage, or QA observer is read or modified by this test.
const baseMain = process.env.CUSTOMIZATION_BASE_MAIN;
assert.match(baseMain || '', /^[0-9a-f]{40}$/, 'CUSTOMIZATION_BASE_MAIN must be the actual 40-character baseline SHA.');
const prefix = 'customization-comparison-production';
const entry = new URL(process.env.GAME_URL || 'http://127.0.0.1:4188');
assert.ok(['http:', 'https:'].includes(entry.protocol));
entry.searchParams.set('qa', ''); // The QA query must not expose a harness in production.
const output = new URL('../test-results/', import.meta.url);
const dist = new URL('../dist/', import.meta.url);
const fixtureURL = new URL('../test-results/customization-comparison-fixture-sentinel.json', import.meta.url);
const require = createRequire(import.meta.url);
const sha256 = data => createHash('sha256').update(data).digest('hex');
const started = Date.now();
await mkdir(output, { recursive: true });
const report = {
  at: new Date().toISOString(), passed: false, baseMain, url: entry.href,
  buildKind: process.env.RELAY_BUILD_KIND || 'production-dist',
  scope: 'Focused check of the compiled customization UI after a real file import. It checks multiplier values and item-versus-draft comparison in production, plus the absence of the QA harness even with the qa query. It does not inspect internal runtime state or certify Electron, Windows, gameplay completion, visual art fidelity, or performance.',
  command: { script: 'node scripts/customization-comparison-production.mjs',
    environment: { GAME_URL: entry.href, CUSTOMIZATION_BASE_MAIN: baseMain,
      RELAY_BUILD_KIND: process.env.RELAY_BUILD_KIND || null,
      PLAYWRIGHT_EXECUTABLE_PATH: process.env.PLAYWRIGHT_EXECUTABLE_PATH || null } },
  tools: { node: process.version, playwright: require('playwright/package.json').version,
    vite: require('vite/package.json').version, browser: null },
  fixture: null, sources: {}, buildFiles: {}, servedFiles: [], checks: [], screenshots: [], errors: [], failedRequests: [],
};
const record = (name, details = {}) => {
  report.checks.push({ name, passed: true, ...details });
  console.log(JSON.stringify({ check: name, passed: true }));
};
const action = (page, name, id) => page.locator(`[data-do="${name}"]${id === undefined ? '' : `[data-id="${id}"]`}`).first();
const gear = (page, slot, id) => page.locator(`[data-do="custom-equip"][data-slot="${slot}"][data-id="${id}"]`);
let browser, page;

async function hashTree(directory, path = '') {
  const entries = (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
  for (const item of entries) {
    const relative = `${path}${item.name}`, url = new URL(item.name + (item.isDirectory() ? '/' : ''), directory);
    if (item.isDirectory()) await hashTree(url, `${relative}/`);
    else if (item.isFile()) {
      const bytes = await readFile(url);
      report.buildFiles[relative] = { bytes: bytes.length, sha256: sha256(bytes) };
    }
  }
}

async function noHarness() {
  const observed = await page.evaluate(() => ({ ownProperty: Object.hasOwn(window, '__RELAY_TEST__'),
    type: typeof window.__RELAY_TEST__, developmentClient: !!document.querySelector('script[src*="/@vite/client"]') }));
  assert.deepEqual(observed, { ownProperty: false, type: 'undefined', developmentClient: false });
  return observed;
}

async function stat(key, before, after, item = false) {
  const selector = item ? `[data-custom-inspection] [data-item-stat="${key}"]` : `.custom-stat[data-stat="${key}"]`;
  const row = page.locator(selector);
  assert.equal(await row.count(), 1, `${selector}: exactly one comparison`);
  const observed = await row.evaluate(element => ({ before: Number(element.dataset.before),
    after: Number(element.dataset.after), text: element.innerText }));
  assert.ok(Math.abs(observed.before - before) < 1e-9, `${key}: actual before value`);
  assert.ok(Math.abs(observed.after - after) < 1e-9, `${key}: actual after value`);
  for (const value of [before, after]) assert.ok(observed.text.includes(`× ${value.toFixed(2).replace('.', ',')}`));
  return observed;
}

async function inspection(id, slot, status) {
  const panel = page.locator('[data-custom-inspection]');
  assert.equal(await panel.count(), 1);
  const observed = await panel.evaluate(element => ({ id: element.dataset.inspectionId,
    slot: element.dataset.inspectionSlot, status: element.dataset.inspectionStatus, text: element.innerText }));
  assert.equal(observed.id, id); assert.equal(observed.slot, slot); assert.equal(observed.status, status);
  return observed;
}

async function screenshot(name, selector) {
  if (selector) await page.locator(selector).first().scrollIntoViewIfNeeded();
  const filename = `${prefix}-${name}.png`;
  await page.screenshot({ path: fileURLToPath(new URL(filename, output)), animations: 'disabled' });
  report.screenshots.push({ file: `test-results/${filename}`, viewport: page.viewportSize(), focusedSelector: selector || null,
    capture: 'actual production browser viewport after scrolling to the referenced element' });
}

try {
  const fixtureBytes = await readFile(fixtureURL), fixture = decodeSave(fixtureBytes.toString('utf8'));
  assert.ok(fixture, 'The fixture must pass the real save validator.');
  assert.equal(fixture.classId, 'sentinel');
  assert.ok(fixture.inventory.items['omni-tool-upgraded'] >= 1 && fixture.inventory.items['biotic-amp-upgraded'] >= 1);
  report.fixture = { file: 'test-results/customization-comparison-fixture-sentinel.json', sha256: sha256(fixtureBytes),
    name: fixture.name, classId: fixture.classId,
    origin: 'Explicit Node-generated QA fixture from customization-comparison-browser.mjs; credits and items were not earned by campaign play.', importedViaUI: false };
  await hashTree(dist);
  report.buildManifestSha256 = sha256(JSON.stringify(report.buildFiles));
  report.sources = Object.fromEntries(await Promise.all(['package.json', 'src/main.js', 'src/customization-ui.js',
    'src/customization-ui.css', 'src/customization.js', 'scripts/customization-comparison-production.mjs']
    .map(async path => [path, sha256(await readFile(new URL(`../${path}`, import.meta.url)))])));
  browser = await chromium.launch({ headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  report.tools.browser = browser.version();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  page = await context.newPage(); page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('response', response => { if (response.status() >= 400) report.failedRequests.push({ url: response.url(), status: response.status() }); });
  const response = await page.goto(entry.href, { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200);
  const html = await response.text();
  assert.equal(sha256(Buffer.from(html)), report.buildFiles['index.html'].sha256, 'Served index equals local dist/index.html.');
  report.servedFiles.push({ file: 'index.html', sha256: sha256(Buffer.from(html)), matchesDist: true });
  for (const match of html.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))"/g)) {
    const assetURL = new URL(match[1], entry), path = new URL(match[1], 'http://dist.invalid/').pathname.slice(1);
    assert.ok(report.buildFiles[path], `Compiled asset exists in dist: ${path}`);
    const assetResponse = await context.request.get(assetURL.href);
    assert.equal(assetResponse.status(), 200);
    const observedHash = sha256(await assetResponse.body());
    assert.equal(observedHash, report.buildFiles[path].sha256, `Served compiled asset matches dist: ${path}`);
    report.servedFiles.push({ file: path, sha256: observedHash, matchesDist: true });
  }
  assert.ok(report.servedFiles.some(item => item.file.endsWith('.js')), 'At least one actual compiled script is checked.');
  record('The served HTML and entry scripts/styles match the production dist byte for byte', { files: report.servedFiles });
  record('The production title exposes no QA harness or Vite development client, even with ?qa', await noHarness());

  const chooser = page.waitForEvent('filechooser');
  await action(page, 'import').click();
  await (await chooser).setFiles({ name: 'customization-comparison-fixture-sentinel.json', mimeType: 'application/json', buffer: fixtureBytes });
  await page.locator('#hud:not(.hidden) .explore-party').waitFor({ state: 'visible' });
  await page.locator('#transition.active').waitFor({ state: 'hidden' });
  assert.ok((await page.locator('#hud .explore-party').innerText()).includes(fixture.name));
  assert.ok((await page.locator('#hud .explore-party').innerText()).includes('Sentinelle'));
  report.fixture.importedViaUI = true;
  await action(page, 'pause').click(); await action(page, 'customization').click();
  await page.locator('.customization-screen').waitFor(); await action(page, 'custom-tab', 'weapons').click();
  await stat('techMultiplier', 1, 1); await stat('bioticMultiplier', 1, 1);
  await action(page, 'custom-slot', 'omniTool').click(); await action(page, 'custom-inspect', 'omni-tool-upgraded').click();
  const omni = await inspection('omni-tool-upgraded', 'omniTool', 'available');
  const hypotheticalOmni = await stat('techMultiplier', 1, 1.15, true);
  await stat('techMultiplier', 1, 1); await stat('bioticMultiplier', 1, 1);
  assert.equal(await page.locator('.custom-draft-status.dirty').count(), 0, 'Inspection leaves the draft visibly unchanged.');
  await screenshot('omni-inspection', '[data-custom-inspection]');
  record('An imported Sentinel can inspect the compiled tool effect separately from the unchanged draft', { inspection: omni, hypothetical: hypotheticalOmni });

  await gear(page, 'omniTool', 'omni-tool-upgraded').click();
  await stat('techMultiplier', 1, 1.15); await stat('bioticMultiplier', 1, 1);
  await action(page, 'custom-slot', 'bioticAmp').click(); await action(page, 'custom-inspect', 'biotic-amp-upgraded').click();
  const amp = await inspection('biotic-amp-upgraded', 'bioticAmp', 'available');
  const hypotheticalAmp = await stat('bioticMultiplier', 1, 1.15, true);
  await stat('techMultiplier', 1, 1.15); await stat('bioticMultiplier', 1, 1);
  await screenshot('biotic-inspection', '[data-custom-inspection]');
  record('Inspecting the amplifier in the compiled UI preserves the prepared omni-tool comparison', { inspection: amp, hypothetical: hypotheticalAmp });

  await gear(page, 'bioticAmp', 'biotic-amp-upgraded').click();
  const technology = await stat('techMultiplier', 1, 1.15), biotics = await stat('bioticMultiplier', 1, 1.15);
  await inspection('biotic-amp-upgraded', 'bioticAmp', 'prepared');
  assert.equal(await page.locator('.custom-draft-status.dirty').count(), 1);
  await screenshot('prepared-statistics', '[data-stat="bioticMultiplier"]');
  record('Both actual multiplier comparisons appear after preparation in the production build', { technology, biotics });
  await action(page, 'custom-cancel').click(); await page.locator('.customization-screen').waitFor({ state: 'hidden' });
  record('The QA harness remains absent after importing and exercising the production workshop', await noHarness());
  assert.deepEqual(report.errors, [], 'No browser JavaScript errors.');
  assert.deepEqual(report.failedRequests, [], 'No failed resource requests.');
  report.passed = true;
} catch (error) {
  report.failure = error.stack || String(error); console.error(report.failure);
  if (page) await screenshot('failure').catch(() => {});
  process.exitCode = 1;
} finally {
  if (browser) await browser.close().catch(error => { report.closeError = error.message; });
  report.finishedAt = new Date().toISOString(); report.elapsedSeconds = Math.round((Date.now() - started) / 10) / 100;
  await writeFile(new URL(`${prefix}-report.json`, output), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, screenshots: report.screenshots.length,
    report: `test-results/${prefix}-report.json` }));
}
