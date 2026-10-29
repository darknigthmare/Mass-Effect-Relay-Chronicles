import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { newGame, encodeSave, decodeSave } from '../src/state.js';
import { actorFor } from '../src/game-data.js';
import { buyItem } from '../src/loadout.js';
import { initialCustomization } from '../src/customization.js';

// Run after npm run build, with dist served by npm run preview. The browser
// changes the campaign only through the real file chooser and game controls.
// Saved state is checked through downloaded exports, never through localStorage,
// source-module imports, or the development harness. A persistent browser
// profile is closed completely and reopened to exercise an actual restart.
const baseMain = process.env.CUSTOMIZATION_BASE_MAIN;
assert.match(baseMain || '', /^[0-9a-f]{40}$/, 'CUSTOMIZATION_BASE_MAIN must identify the actual baseline SHA.');
const prefix = process.env.CUSTOMIZATION_REPORT_PREFIX || 'customization-poses-production';
assert.match(prefix, /^[a-z0-9][a-z0-9-]*$/);
const entry = new URL(process.env.GAME_URL || 'http://127.0.0.1:4194');
assert.ok(['http:', 'https:'].includes(entry.protocol));
entry.searchParams.set('qa', '');
const root = new URL('../', import.meta.url), output = new URL('../test-results/', import.meta.url);
const dist = new URL('../dist/', import.meta.url), require = createRequire(import.meta.url);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const started = Date.now();
await mkdir(output, { recursive: true });
const profile = await mkdtemp(fileURLToPath(new URL(`${prefix}-profile-`, output)));
const report = {
  schemaVersion: 1, at: new Date().toISOString(), passed: false, baseMain,
  sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: fileURLToPath(root), encoding: 'utf8' }).trim(),
  url: entry.href, buildKind: 'production-dist',
  scope: 'Compiled workshop pose previews, cosmetic application, cancellation with prepared equipment, real exported saves, and a complete Chromium shutdown/restart using its own persistent profile. Buttons are focused and activated with native Enter after visibility/enabled/focus checks; this is not an exhaustive Tab-order test. The browser does not read/write storage directly, import source modules, or use a QA observer. Terrain screenshots and WebGL availability are recorded; combat events, physical devices, performance, Windows and artistic 1:1 fidelity are outside this check.',
  command: { script: 'node scripts/customization-poses-production.mjs', environment: {
    GAME_URL: entry.href, CUSTOMIZATION_BASE_MAIN: baseMain, CUSTOMIZATION_REPORT_PREFIX: prefix,
    PLAYWRIGHT_EXECUTABLE_PATH: process.env.PLAYWRIGHT_EXECUTABLE_PATH || null,
  } },
  tools: { node: process.version, playwright: require('playwright/package.json').version,
    vite: require('vite/package.json').version,
    three: JSON.parse(await readFile(new URL('node_modules/three/package.json', root), 'utf8')).version, chromium: null },
  profile: { fresh: true, path: profile, launches: 0, completeShutdowns: 0 },
  sources: {}, buildFiles: {}, servedFiles: [], fixture: null, exports: [],
  checks: [], previews: [], activations: [], screenshots: [], errors: [], failedRequests: [], sourceRequests: [],
};
const action = (name, id) => page.locator(`[data-do="${name}"]${id === undefined ? '' : `[data-id="${id}"]`}`).first();
const choice = (field, id) => page.locator(`[data-do="custom-choice"][data-field="${field}"][data-id="${id}"]`);
const record = (name, details = {}) => {
  report.checks.push({ name, passed: true, ...details }); console.log(JSON.stringify({ check: name, passed: true }));
};
let context, page;

async function bounded(operation, label) {
  let timer;
  try {
    return await Promise.race([operation, new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} exceeded 45000 ms.`)), 45000);
    })]);
  } finally { clearTimeout(timer); }
}

async function activate(target) {
  await target.waitFor({ state: 'visible' });
  assert.equal(await target.isEnabled(), true, 'The control is enabled before native activation.');
  await target.focus();
  const observed = await target.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { action: element.dataset.do, id: element.dataset.id, field: element.dataset.field,
      focused: document.activeElement === element, width: rect.width, height: rect.height,
      inViewport: rect.right > 0 && rect.bottom > 0 && rect.left < innerWidth && rect.top < innerHeight };
  });
  assert.equal(observed.focused, true, 'Native Enter targets the observed focused control.');
  assert.ok(observed.width > 0 && observed.height > 0 && observed.inViewport, 'The focused control is visible in the viewport.');
  report.activations.push(observed);
  await page.keyboard.press('Enter');
}

function stableState(state) {
  const result = structuredClone(state);
  // Elapsed play time legitimately advances between the public UI actions.
  // The envelope's savedAt is already outside the state returned by decodeSave.
  delete result.playedSeconds;
  return result;
}

function nonCosmeticState(state) {
  const result = stableState(state);
  delete result.appearance; delete result.customization;
  return result;
}

function combatProfile(state) {
  const result = actorFor('shepard', state);
  // Appearance intentionally changes the sprite; all derived gameplay fields
  // (including equipment effects and powers) must remain exactly the same.
  delete result.sprite;
  return result;
}

async function hashTree(directory, path = '') {
  for (const item of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = `${path}${item.name}`, url = new URL(item.name + (item.isDirectory() ? '/' : ''), directory);
    if (item.isDirectory()) await hashTree(url, `${relative}/`);
    else if (item.isFile()) {
      const bytes = await readFile(url); report.buildFiles[relative] = { bytes: bytes.length, sha256: sha256(bytes) };
    }
  }
}

async function launch() {
  context = await chromium.launchPersistentContext(profile, {
    headless: true, acceptDownloads: true, viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  report.profile.launches++;
  report.tools.chromium = context.browser()?.version() || null;
  page = context.pages()[0] || await context.newPage(); page.setDefaultTimeout(45000);
  const launch = report.profile.launches;
  page.on('pageerror', error => report.errors.push({ launch, message: error.message }));
  page.on('requestfailed', request => report.failedRequests.push({ launch, url: request.url(), error: request.failure()?.errorText }));
  page.on('response', response => { if (response.status() >= 400) report.failedRequests.push({ launch, url: response.url(), status: response.status() }); });
  page.on('request', request => {
    const path = new URL(request.url()).pathname;
    if (path.startsWith('/src/') || path.startsWith('/@vite/') || path.startsWith('/@fs/')) report.sourceRequests.push({ launch, url: request.url() });
  });
  const response = await page.goto(entry.href, { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200);
  assert.equal(sha256(await response.body()), report.buildFiles['index.html'].sha256, 'The actual served index matches dist.');
}

async function shutdown() {
  if (!context) return;
  const browser = context.browser();
  await page.waitForLoadState('networkidle');
  await context.close(); context = null;
  assert.equal(browser?.isConnected(), false, 'Closing the persistent context must close its browser process.');
  report.profile.completeShutdowns++;
}

async function noHarness() {
  const observed = await page.evaluate(() => ({ ownProperty: Object.hasOwn(window, '__RELAY_TEST__'),
    type: typeof window.__RELAY_TEST__, developmentClient: !!document.querySelector('script[src*="/@vite/client"]') }));
  assert.deepEqual(observed, { ownProperty: false, type: 'undefined', developmentClient: false });
  return observed;
}

async function worldReady() {
  await page.locator('#hud:not(.hidden) .explore-party').waitFor({ state: 'visible' });
  await page.locator('#transition.active').waitFor({ state: 'hidden' });
  await page.locator('#overlay .screen').waitFor({ state: 'hidden' });
}

async function pause() {
  await worldReady(); await activate(action('pause')); await action('customization').waitFor({ state: 'visible' });
}

async function openWorkshop() {
  await activate(action('customization')); await page.locator('.customization-screen').waitFor({ state: 'visible' });
}

async function screenshot(name, selector = null) {
  const file = `${prefix}-${name}.png`;
  if (selector) await page.locator(selector).first().screenshot({ path: fileURLToPath(new URL(file, output)), animations: 'disabled' });
  else await page.screenshot({ path: fileURLToPath(new URL(file, output)), animations: 'disabled' });
  report.screenshots.push({ file: `test-results/${file}`, viewport: page.viewportSize(),
    capture: selector ? `actual production browser element ${selector}` : 'actual production browser viewport' });
}

async function exportedState(label) {
  // Caller is on Pause, so exporting does not need to touch gameplay or storage.
  const pending = page.waitForEvent('download'); await activate(action('export'));
  const download = await pending, file = `${prefix}-${label}-save.json`, url = new URL(file, output);
  await download.saveAs(fileURLToPath(url));
  assert.equal(await download.failure(), null);
  const bytes = await readFile(url), saved = decodeSave(bytes.toString('utf8'));
  assert.ok(saved, `The actual downloaded ${label} export passes the save validator.`);
  assert.equal(Object.hasOwn(saved, 'customPose'), false, 'Preview pose is not serialized into the campaign.');
  report.exports.push({ label, file: `test-results/${file}`, sha256: sha256(bytes),
    source: 'real Exporter button and browser download', appearance: saved.appearance,
    customization: saved.customization, inventorySHA256: sha256(JSON.stringify(saved.inventory)),
    stableStateSHA256: sha256(JSON.stringify(stableState(saved))) });
  return saved;
}

async function readyPreview(appearance, pose, configs) {
  await page.waitForFunction(({ appearance, pose }) => {
    const preview = document.querySelector('.customization-preview'), canvas = preview?.querySelector('[data-custom-canvas]');
    return preview?.dataset.previewAppearance === appearance && preview.dataset.previewPose === pose
      && canvas?.dataset.ready === 'true' && canvas.dataset.pose === pose;
  }, { appearance, pose });
  const observed = await bounded(page.locator('[data-custom-canvas]').evaluate(async canvas => {
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    const alpha = new Uint8Array(canvas.width * canvas.height);
    let visible = 0, left = canvas.width, top = canvas.height, right = -1, bottom = -1;
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
      const offset = y * canvas.width + x; alpha[offset] = data[offset * 4 + 3];
      if (alpha[offset] > 80) { visible++; left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y); }
    }
    const hash = async bytes => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join('');
    return { ...canvas.dataset, appearance: canvas.closest('.customization-preview').dataset.previewAppearance,
      mode: canvas.closest('.customization-preview').dataset.previewMode, width: canvas.width, height: canvas.height,
      visible, bounds: { left, top, right, bottom }, pixelsSHA256: await hash(data), alphaSHA256: await hash(alpha) };
  }), `Read ${appearance}/${pose} preview pixels`);
  assert.ok(observed.visible > 50, 'The production canvas contains actual sprite pixels.');
  assert.equal(await action('custom-pose', pose).getAttribute('aria-pressed'), 'true');
  if (pose !== 'field') {
    const frame = configs[appearance].combat.frames[pose];
    assert.equal(observed.source, configs[appearance].combat.file); assert.equal(observed.frame, frame.id);
    assert.equal(Number(observed.heightScale), frame.heightScale || 1); assert.equal(observed.direction, 'three-quarter');
    assert.equal(await page.locator('[data-do="custom-view"]:disabled').count(), 4);
  } else assert.equal(await page.locator('[data-do="custom-view"]:disabled').count(), 0);
  report.previews.push(observed);
  console.log(JSON.stringify({ preview: `${appearance}/${pose}`, mode: observed.mode, passed: true }));
  return observed;
}

async function unchangedStats(expected) {
  const rows = await page.locator('.custom-stat[data-stat]').evaluateAll(elements => elements.map(element => ({
    key: element.dataset.stat, before: Number(element.dataset.before), after: Number(element.dataset.after),
  })));
  assert.ok(rows.length >= 8, 'The compiled workshop shows the complete core combat profile.');
  for (const row of rows) {
    assert.equal(row.after, row.before, `A cosmetic choice does not change ${row.key}.`);
    assert.equal(row.before, expected[row.key] ?? (row.key.endsWith('Multiplier') ? 1 : 0), `Actual ${row.key} matches the exported state.`);
  }
  return rows;
}

try {
  const sourcePaths = ['package.json', 'src/main.js', 'src/world.js', 'src/customization-ui.js', 'src/customization-ui.css',
    'src/customization-render.js', 'src/customization.js', 'src/state.js', 'vite.config.js', 'scripts/customization-poses-production.mjs',
    ...['male', 'female'].flatMap(appearance => [`public/assets/shepard-${appearance}-animation.json`, `public/assets/shepard-${appearance}-combat-atlas.png`])];
  report.sources = Object.fromEntries(await Promise.all(sourcePaths.map(async path => [path, sha256(await readFile(new URL(path, root)))])));
  const configs = Object.fromEntries(await Promise.all(['male', 'female'].map(async appearance => [appearance,
    JSON.parse(await readFile(new URL(`public/assets/shepard-${appearance}-animation.json`, root), 'utf8'))])));
  const fixture = newGame({ name: 'QA poses production', classId: 'sentinel', appearance: 'female' });
  fixture.credits = 1000; fixture.settings.sound = false; fixture.settings.reducedMotion = true;
  assert.equal(buyItem(fixture, 'omni-tool-upgraded').ok, true);
  const fixtureBytes = Buffer.from(encodeSave(fixture)), fixtureFile = `${prefix}-fixture.json`;
  assert.deepEqual(decodeSave(fixtureBytes.toString('utf8')), fixture);
  await writeFile(new URL(fixtureFile, output), fixtureBytes);
  report.fixture = { file: `test-results/${fixtureFile}`, sha256: sha256(fixtureBytes), importedViaUI: false,
    origin: 'newGame female Sentinel + explicit 1000-credit QA budget + buyItem(omni-tool-upgraded) + encodeSave; no campaign acquisition is claimed.' };
  await hashTree(dist); report.buildManifestSHA256 = sha256(JSON.stringify(report.buildFiles));
  await launch();
  const html = await readFile(new URL('index.html', dist), 'utf8');
  const paths = new Set(['index.html', ...[...html.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))"/g)]
    .map(match => new URL(match[1], entry).pathname.slice(1)),
    ...['male', 'female'].map(appearance => `assets/${configs[appearance].combat.file}`)]);
  for (const path of paths) {
    const expected = report.buildFiles[path]; assert.ok(expected, `Built asset exists: ${path}`);
    const response = await context.request.get(new URL(path, entry).href); assert.equal(response.status(), 200);
    const hash = sha256(await response.body()); assert.equal(hash, expected.sha256, `Served bytes equal dist: ${path}`);
    if (path.endsWith('-combat-atlas.png')) assert.equal(hash, report.sources[`public/${path}`], 'The shipped atlas is the source image that was inspected.');
    report.servedFiles.push({ file: path, bytes: expected.bytes, sha256: hash, matchesDist: true });
  }
  assert.ok(report.servedFiles.some(file => file.file.endsWith('.js')));
  record('The served HTML, compiled JS/CSS and both combat atlases match the local production build', { files: report.servedFiles });
  record('The compiled title exposes no development client or QA harness even with ?qa', await noHarness());

  const chooser = page.waitForEvent('filechooser'); await activate(action('import'));
  await (await chooser).setFiles({ name: fixtureFile, mimeType: 'application/json', buffer: fixtureBytes });
  await worldReady(); assert.ok((await page.locator('#hud .explore-party').innerText()).includes(fixture.name));
  report.fixture.importedViaUI = true;
  await pause(); const baseline = await exportedState('baseline');
  assert.equal(baseline.appearance, 'female'); assert.deepEqual(baseline.inventory, fixture.inventory);
  assert.equal(baseline.credits, fixture.credits);
  await openWorkshop(); await activate(action('custom-tab', 'armor'));
  await readyPreview('female', 'field', configs);
  const originalProfile = combatProfile(baseline);
  for (const appearance of ['female', 'male']) {
    if (appearance === 'male') {
      await activate(action('custom-tab', 'character')); await activate(action('custom-appearance', 'male'));
      await activate(action('custom-tab', 'armor'));
    }
    for (const pose of ['aim', 'power', 'hit', 'down']) {
      await activate(action('custom-pose', pose)); await readyPreview(appearance, pose, configs);
    }
  }
  const maleDown = await readyPreview('male', 'down', configs);
  await activate(choice('armor.primary', 'teal')); const coloredDown = await readyPreview('male', 'down', configs);
  await activate(choice('armor.helmet', 'combat')); const preparedDown = await readyPreview('male', 'down', configs);
  assert.notEqual(coloredDown.pixelsSHA256, maleDown.pixelsSHA256);
  assert.notEqual(preparedDown.pixelsSHA256, coloredDown.pixelsSHA256);
  assert.equal(coloredDown.alphaSHA256, maleDown.alphaSHA256); assert.equal(preparedDown.alphaSHA256, maleDown.alphaSHA256);
  await screenshot('male-down-prepared', '.customization-preview');
  await activate(action('custom-compare')); const currentFemale = await readyPreview('female', 'down', configs);
  assert.equal(currentFemale.mode, 'current');
  await activate(action('custom-compare')); const restoredMale = await readyPreview('male', 'down', configs);
  assert.equal(restoredMale.mode, 'draft'); assert.equal(restoredMale.pixelsSHA256, preparedDown.pixelsSHA256);
  const cosmeticRows = await unchangedStats(originalProfile);
  record('Both compiled pose families render; male color/helmet and current-versus-draft previews preserve alpha and combat stats', {
    authoredPoses: 8, cosmeticRows, alphaPreserved: true, comparedAppearance: 'female', preparedAppearance: 'male',
  });

  await activate(action('custom-apply')); await page.locator('.customization-screen').waitFor({ state: 'hidden' });
  const applied = await exportedState('applied');
  const expectedCustomization = initialCustomization('male'); expectedCustomization.armor.primary = 'teal'; expectedCustomization.armor.helmet = 'combat';
  assert.equal(applied.appearance, 'male'); assert.deepEqual(applied.customization, expectedCustomization);
  assert.deepEqual(nonCosmeticState(applied), nonCosmeticState(baseline));
  assert.deepEqual(combatProfile(applied), originalProfile);
  record('Apply commits male appearance and selected colors/helmet into a valid actual export without changing inventory, resources or derived combat stats', {
    appearance: applied.appearance, customization: applied.customization, allNineEquipmentSlotsPreserved: true,
  });
  await activate(action('close')); await worldReady();
  const terrain = await page.evaluate(() => {
    const canvas = document.querySelector('#world canvas'), gl = canvas?.getContext('webgl2');
    return { available: !!gl, lost: gl?.isContextLost(), width: canvas?.width, height: canvas?.height };
  });
  assert.equal(terrain.available, true); assert.equal(terrain.lost, false); assert.ok(terrain.width > 0 && terrain.height > 0);
  await screenshot('male-terrain-applied');
  await pause(); await openWorkshop();
  await readyPreview('male', 'field', configs);
  await activate(action('custom-appearance', 'female'));
  await activate(action('custom-tab', 'armor')); await activate(choice('armor.primary', 'orange')); await activate(choice('armor.helmet', 'hidden'));
  await activate(action('custom-pose', 'hit')); await readyPreview('female', 'hit', configs);
  await activate(action('custom-tab', 'weapons')); await activate(action('custom-slot', 'omniTool'));
  await activate(page.locator('[data-do="custom-equip"][data-slot="omniTool"][data-id="omni-tool-upgraded"]'));
  assert.equal(Number(await page.locator('[data-stat="techMultiplier"]').getAttribute('data-after')), 1.15);
  await page.keyboard.press('Escape'); await page.locator('.customization-screen').waitFor({ state: 'hidden' });
  const cancelled = await exportedState('cancelled');
  assert.deepEqual(stableState(cancelled), stableState(applied));
  assert.deepEqual(combatProfile(cancelled), originalProfile);
  record('Escape discards appearance, color, helmet and prepared equipment changes; exported state remains the committed state', {
    unchangedInventory: true, unchangedCustomization: true, unchangedResourcesAndProgression: true,
  });
  await noHarness();
  await shutdown();
  await launch(); await noHarness();
  assert.equal(await action('continue').isEnabled(), true, 'The new browser process finds the saved campaign.');
  await activate(action('continue')); await worldReady();
  await screenshot('male-terrain-resumed'); await pause();
  const resumed = await exportedState('resumed');
  assert.deepEqual(stableState(resumed), stableState(applied));
  assert.deepEqual(combatProfile(resumed), originalProfile);
  await openWorkshop(); const field = await readyPreview('male', 'field', configs);
  assert.equal(field.direction, 'front');
  assert.equal(await action('custom-appearance', 'male').getAttribute('aria-pressed'), 'true');
  await activate(action('custom-tab', 'armor'));
  assert.equal(await choice('armor.primary', 'teal').getAttribute('aria-pressed'), 'true');
  assert.equal(await choice('armor.helmet', 'combat').getAttribute('aria-pressed'), 'true');
  await activate(action('custom-pose', 'down')); const resumedDown = await readyPreview('male', 'down', configs);
  assert.equal(resumedDown.pixelsSHA256, preparedDown.pixelsSHA256, 'The resumed actual preview reproduces the applied color/helmet pixels.');
  assert.equal(resumedDown.alphaSHA256, preparedDown.alphaSHA256);
  await unchangedStats(originalProfile); await screenshot('male-down-resumed', '.customization-preview');
  record('After complete Chromium shutdown and restart, Continue restores the exact applied state and preview pixels; transient pose resets to Terrain', {
    browserLaunches: report.profile.launches, completeShutdownBeforeResume: report.profile.completeShutdowns,
    exactStateExceptElapsedPlayTime: true, exactInventory: true, exactPreviewPixels: true, transientPose: 'field', terrain,
  });
  await activate(action('custom-cancel')); await page.locator('.customization-screen').waitFor({ state: 'hidden' });
  assert.deepEqual(await noHarness(), { ownProperty: false, type: 'undefined', developmentClient: false });
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []); assert.deepEqual(report.sourceRequests, []);
  record('No JavaScript errors, failed resources, development source requests or QA harness occur throughout the production journey');
  await shutdown(); report.passed = true;
} catch (error) {
  report.failure = error.stack || String(error); console.error(report.failure);
  if (page && !page.isClosed()) await screenshot('failure').catch(() => {});
  process.exitCode = 1;
} finally {
  if (context) await context.close().catch(error => { report.closeError = error.message; });
  report.finishedAt = new Date().toISOString(); report.elapsedSeconds = Math.round((Date.now() - started) / 10) / 100;
  await writeFile(new URL(`${prefix}-report.json`, output), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, previews: report.previews.length,
    screenshots: report.screenshots.length, report: `test-results/${prefix}-report.json` }));
}
