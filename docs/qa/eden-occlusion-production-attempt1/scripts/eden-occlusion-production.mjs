import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { decodeSave } from '../src/state.js';
import { enemiesFor } from '../src/game-data.js';

// This is a public production journey. Node validates two existing real exports;
// Chromium imports them through the chooser and never accesses application state.
const root = new URL('../', import.meta.url), dist = new URL('dist/', root);
const prefix = process.env.EDEN_OCCLUSION_PREFIX || 'eden-occlusion-production';
assert.match(prefix, /^[a-z0-9-]+$/);
const entry = new URL(process.env.GAME_URL || 'http://127.0.0.1:4194');
const baseline = process.env.EDEN_BASE_MAIN;
assert.match(baseline || '', /^[0-9a-f]{40}$/);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const reportPath = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(reportPath); throw new Error(`${fileURLToPath(reportPath)} already exists; preserve it and use a new EDEN_OCCLUSION_PREFIX.`); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
for (const path of ['docs/qa/', 'docs/screenshots/', 'test-results/']) await mkdir(new URL(path, root), { recursive: true });
const profile = await mkdtemp(fileURLToPath(new URL(`test-results/${prefix}-profile-`, root)));
const started = Date.now();
const report = {
  schemaVersion: 1, passed: false, at: new Date().toISOString(), baselineCommit: baseline,
  sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: fileURLToPath(root), encoding: 'utf8' }).trim(),
  buildKind: 'production-dist', url: entry.href,
  command: { script: 'node scripts/eden-occlusion-production.mjs', environment: {
    EDEN_BASE_MAIN: baseline, GAME_URL: entry.href,
    PLAYWRIGHT_EXECUTABLE_PATH: process.env.PLAYWRIGHT_EXECUTABLE_PATH || null,
    ...(prefix !== 'eden-occlusion-production' ? { EDEN_OCCLUSION_PREFIX: prefix } : {}),
  } },
  scope: 'Actual public production controls only. Import two existing real public JSON exports through the chooser. Inspect Noveria overhead scenery in the field and the three-rachni encounter, issue one natural-ATB shot, reload and download the restored precombat save. Separately scroll the Eden map board and its final list entry into view on desktop/mobile. No browser source imports, private fixture/harness, storage access/injection, renderer/pose setters, CSS injection or clock control.',
  fixtures: [], sources: {}, buildFiles: {}, servedFiles: [], browserResponses: [], exports: [],
  screenshots: [], activations: [], checks: [], nativeOrders: [], reloads: [], mapViews: [],
  sourceRequests: [], evidenceErrors: [], errors: [], failedRequests: [], consoleObservations: [], resourceWarnings: [],
  profile: { fresh: true, path: profile, launches: 0, completeShutdowns: 0 },
  tools: { node: process.version, chromium: null },
  limitations: [
    'The imported Noveria export descends from the earlier explicit native progression fixture. Those prior encounters/recruitments are not played here.',
    'The Eden export was obtained by real public keyboard travel outside the old rectangle in the previous production journey. This run imports that checkpoint and does not replay that travel.',
    'Field/battle screenshots establish visible occlusion behavior only after human review. Public DOM inspection cannot count hidden Three.js meshes; the separate unit/source checks cover registration and static merging.',
    'The rachni encounter remains unresolved. A single real shot does not establish a complete victory, reward or original-game fidelity.',
    '390x844 is a Chromium viewport test, not a physical phone or touch-input performance claim.',
    'Only playedSeconds is excluded from native downloaded state comparisons. Enclosing savedAt timestamps are not game state.',
    'A missing favicon404 is qualified separately with its exact URL; other browser errors are failures.',
  ],
};
let context, page, closing = false;
const pendingResponses = [];
const action = (name, id) => page.locator(`[data-do="${name}"]${id === undefined ? '' : `[data-id="${id}"]`}`).first();
const stable = state => { const value = structuredClone(state); delete value.playedSeconds; return value; };
const record = name => { report.checks.push({ name, passed: true }); console.log(JSON.stringify({ check: name })); };

async function tree(directory, path = '') {
  const files = {};
  for (const item of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = path + item.name, url = new URL(item.name + (item.isDirectory() ? '/' : ''), directory);
    if (item.isDirectory()) Object.assign(files, await tree(url, relative + '/'));
    else if (item.isFile()) { const bytes = await readFile(url); files[relative] = { bytes: bytes.length, sha256: sha(bytes) }; }
  }
  return files;
}
async function activate(target) {
  await target.waitFor({ state: 'visible' }); assert.equal(await target.isEnabled(), true);
  await target.scrollIntoViewIfNeeded(); await target.focus();
  const observed = await target.evaluate(button => {
    const r = button.getBoundingClientRect();
    return { action: button.dataset.do, id: button.dataset.id, focused: document.activeElement === button,
      rect: { x: r.x, y: r.y, width: r.width, height: r.height }, visible: r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight };
  });
  assert.equal(observed.focused, true); assert.equal(observed.visible, true);
  report.activations.push(observed); await page.keyboard.press('Enter');
}
async function noHarness() {
  const observed = await page.evaluate(() => ({ own: Object.hasOwn(window, '__RELAY_TEST__'), type: typeof window.__RELAY_TEST__,
    viteClient: !!document.querySelector('script[src*="/@vite/client"]') }));
  assert.deepEqual(observed, { own: false, type: 'undefined', viteClient: false }); return observed;
}
async function worldReady() {
  await page.locator('#hud:not(.hidden) .explore-party').waitFor({ state: 'visible' });
  await page.locator('#transition.active').waitFor({ state: 'hidden' });
  await page.locator('#overlay .screen').waitFor({ state: 'hidden' });
}
async function pause() { await worldReady(); await activate(action('pause')); await action('export').waitFor({ state: 'visible' }); }
async function resume() { await activate(action('close')); await worldReady(); }
async function toastsGone() { await page.waitForFunction(() => document.querySelectorAll('#toasts .toast').length === 0); }
async function screenshot(label) {
  const path = `docs/screenshots/${prefix}-${label}.png`;
  const bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)), animations: 'disabled' });
  report.screenshots.push({ label, path, bytes: bytes.length, sha256: sha(bytes), viewport: page.viewportSize(),
    source: 'Actual public production viewport, no CSS/scene/pose injection' });
}
async function fixture(path, origin) {
  const bytes = await readFile(new URL(path, root)), state = decodeSave(bytes.toString('utf8'));
  assert.ok(state, `${path}: native save validator accepts the existing export`);
  const metadata = { path, bytes: bytes.length, sha256: sha(bytes), origin,
    zone: state.zone, party: state.party, position: state.position, importedViaPublicChooser: false };
  report.fixtures.push(metadata); return { bytes, state, metadata };
}
async function importFixture(fixture) {
  if (!await action('import').isVisible()) {
    if (!await action('quit').isVisible()) await pause();
    await activate(action('quit')); await action('import').waitFor({ state: 'visible' });
  }
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), activate(action('import'))]);
  await chooser.setFiles({ name: fixture.metadata.path.split('/').pop(), mimeType: 'application/json', buffer: fixture.bytes });
  await worldReady(); fixture.metadata.importedViaPublicChooser = true;
  assert.ok((await page.locator('#hud .explore-party').innerText()).includes(fixture.state.name));
}
async function exported(label) {
  await activate(action('save'));
  const [download] = await Promise.all([page.waitForEvent('download'), activate(action('export'))]);
  const path = `docs/qa/${prefix}-${label}-save.json`;
  await download.saveAs(fileURLToPath(new URL(path, root))); assert.equal(await download.failure(), null);
  const bytes = await readFile(new URL(path, root)), state = decodeSave(bytes.toString('utf8'));
  assert.ok(state, 'Actual downloaded save passes the native validator');
  report.exports.push({ label, path, bytes: bytes.length, sha256: sha(bytes),
    stableStateSHA256: sha(JSON.stringify(stable(state))), source: 'Actual public Sauvegarder/Exporter and Chromium download' });
  return state;
}
async function reloadContinue() {
  const response = await page.reload({ waitUntil: 'networkidle' });
  assert.ok([200, 304].includes(response.status()));
  if (response.status() === 200) assert.equal(sha(await response.body()), report.buildFiles['index.html'].sha256);
  await noHarness(); await activate(action('continue')); await worldReady();
  report.reloads.push({ method: 'Real page.reload followed by public Continuer', responseStatus: response.status() });
}
async function nativeShot() {
  await page.waitForFunction(() => !!document.querySelector('.battle-member.ready'), null, { timeout: 90000 });
  const actorId = await page.locator('.battle-member.ready').first().getAttribute('data-id');
  await activate(action('battle-actor', actorId));
  const before = await page.locator(`#combat-${actorId} [data-stat="atb"]`).evaluate(node => parseFloat(node.style.width));
  assert.ok(before >= 99.999);
  await activate(action('battle-action', 'shoot'));
  const target = page.locator('[data-do="battle-target"]:not(:disabled)').first();
  const targetId = await target.getAttribute('data-id'), targetName = (await target.locator('span').first().innerText()).trim();
  await activate(target);
  await page.waitForFunction(id => parseFloat(document.querySelector(`#combat-${id} [data-stat="atb"]`)?.style.width) < 20, actorId);
  const after = await page.locator(`#combat-${actorId} [data-stat="atb"]`).evaluate(node => parseFloat(node.style.width));
  const log = await page.locator('#hud .combat-log').innerText(); assert.ok(log.includes(targetName));
  report.nativeOrders.push({ actorId, targetId, targetName, actionId: 'shoot', atbBefore: before, atbAfter: after, log,
    method: 'Actual public actor/action/target controls after natural ATB readiness, no clock or combat setter' });
  await screenshot('rachni-native-shot');
}

// Read visible geometry and clipping only. No scrolling, styling or game mutation
// occurs in these evaluate calls; native scrolling is performed by Playwright.
async function visibility(locator) {
  return locator.evaluate(element => {
    const rect = r => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height });
    const r = element.getBoundingClientRect(), clip = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
    const ancestors = [];
    for (let node = element.parentElement; node; node = node.parentElement) {
      const style = getComputedStyle(node), b = node.getBoundingClientRect();
      if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) { clip.left = Math.max(clip.left, b.left); clip.right = Math.min(clip.right, b.right); }
      if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) { clip.top = Math.max(clip.top, b.top); clip.bottom = Math.min(clip.bottom, b.bottom); }
      if (node.scrollHeight > node.clientHeight + 1) ancestors.push({ className: node.className,
        scrollTop: node.scrollTop, scrollHeight: node.scrollHeight, clientHeight: node.clientHeight });
    }
    return { rect: rect(r), clip, fullyVisible: r.left >= clip.left - 1 && r.top >= clip.top - 1 && r.right <= clip.right + 1 && r.bottom <= clip.bottom + 1,
      viewport: { width: innerWidth, height: innerHeight }, documentWidth: document.documentElement.scrollWidth,
      toasts: document.querySelectorAll('#toasts .toast').length, scrollAncestors: ancestors };
  });
}
async function mapBoard(label) {
  const board = page.locator('.local-map-board'), marker = board.locator('.map-number').filter({ hasText: /^7$/ });
  await board.scrollIntoViewIfNeeded();
  const boardView = await visibility(board), markerView = await visibility(marker);
  assert.equal(boardView.fullyVisible, true, `${label}: entire map board fits the real viewport and clipping ancestors`);
  assert.equal(markerView.fullyVisible, true, `${label}: full marker7 fits the real viewport and clipping ancestors`);
  assert.equal(boardView.toasts, 0); assert.ok(boardView.documentWidth <= boardView.viewport.width);
  assert.equal(await board.locator('.map-number').count(), 7);
  assert.equal(await board.locator('[data-map-sector]').count(), 5);
  assert.equal(await board.locator('[data-map-route]').count(), 3);
  report.mapViews.push({ label, method: 'Actual locator.scrollIntoViewIfNeeded; no CSS injection or scrollTop assignment', board: boardView, marker7: markerView });
  await screenshot(label);
}
async function mapListEnd() {
  const list = page.locator('.map-locations'), finalEntry = list.locator('li').last().locator('button');
  const before = await visibility(finalEntry);
  await finalEntry.scrollIntoViewIfNeeded();
  const box = await list.boundingBox(); assert.ok(box);
  await page.mouse.move(box.x + Math.min(box.width / 2, 120), Math.max(1, Math.min(843, box.y + box.height / 2)));
  await page.mouse.wheel(0, 800); await page.waitForTimeout(150);
  await finalEntry.scrollIntoViewIfNeeded();
  const after = await visibility(finalEntry);
  const listScroll = await list.evaluate(node => ({ top: node.scrollTop, height: node.scrollHeight, client: node.clientHeight }));
  assert.equal(after.fullyVisible, true, 'Final numbered list entry fully visible inside its actual scroll containers');
  assert.ok(listScroll.top > 0 && listScroll.height - listScroll.client - listScroll.top < 2, 'Native list scroll reaches its real bottom');
  assert.ok((await finalEntry.innerText()).includes('7'));
  report.mapListEnd = { before, after, listScroll, method: 'Actual scrollIntoViewIfNeeded and native mouse.wheel; no scrollTop/style assignment' };
  await screenshot('map-mobile-list-end');
}

async function launch() {
  context = await chromium.launchPersistentContext(profile, { headless: true, acceptDownloads: true,
    viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  report.profile.launches++; report.tools.chromium = context.browser()?.version() || null;
  page = context.pages()[0] || await context.newPage(); page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push({ message: error.message }));
  page.on('crash', () => report.errors.push({ type: 'page-crash', intentional: closing }));
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('console', message => { if (message.type() === 'error') report.consoleObservations.push({ text: message.text(), location: message.location() }); });
  page.on('request', request => { if (/^\/(?:src|@vite|@fs)\//.test(new URL(request.url()).pathname)) report.sourceRequests.push(request.url()); });
  page.on('response', response => {
    const url = new URL(response.url()); if (url.origin !== entry.origin) return;
    const path = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    if (response.status() >= 400) {
      const observation = { url: response.url(), status: response.status() };
      if (url.pathname === '/favicon.ico' && response.status() === 404) report.resourceWarnings.push({ ...observation, qualification: 'Missing browser icon only, not a game resource failure' });
      else report.failedRequests.push(observation);
      return;
    }
    if (!report.buildFiles[path]) return;
    if (response.status() === 304) { report.browserResponses.push({ path, status: 304, bodyNotRead: true, qualification: 'Cache revalidation; HTTP200 bodies are hashed separately' }); return; }
    pendingResponses.push((async () => {
      assert.equal(response.status(), 200); const bytes = await response.body();
      assert.equal(sha(bytes), report.buildFiles[path].sha256);
      report.browserResponses.push({ path, status: 200, bytes: bytes.length, sha256: sha(bytes), matchesDist: true });
    })().catch(error => report.evidenceErrors.push({ path, message: error.message })));
  });
  const response = await page.goto(entry.href, { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200); assert.equal(sha(await response.body()), report.buildFiles['index.html'].sha256);
  report.noHarness = await noHarness();
}
async function shutdown() {
  if (!context) return;
  const current = context, browser = current.browser(); context = null; closing = true;
  try { await Promise.all(pendingResponses.splice(0)); await current.close(); }
  finally { closing = false; }
  assert.equal(browser?.isConnected(), false); report.profile.completeShutdowns++;
}

try {
  const sourcePaths = ['src/world.js', 'src/world-data.js', 'src/eden-scene.js', 'src/level-layout-data.js',
    'src/main.js', 'src/local-map.js', 'src/local-map.css', 'src/style.css', 'src/level-map-render.js',
    'src/state.js', 'src/combat.js', 'src/game-data.js', 'src/enemy-animation-data.js', 'vite.config.js',
    'scripts/eden-occlusion-production.mjs', 'public/assets/enemy-rachni-combat.png', 'public/assets/enemy-rachni-animation.json'];
  for (const path of sourcePaths) report.sources[path] = sha(await readFile(new URL(path, root)));
  report.buildFiles = await tree(dist);
  const rachni = await fixture('docs/qa/eden-immersion-production-rachni-precombat-save.json',
    'Existing real public Sauvegarder/Exporter output from the previous Eden production run. Its declared earlier native fixture completed Eden/Citadel and Noveria encounter1 in Node, recruited the crew, and selected Shepard/Kaidan/Ashley. This new run does not manufacture or alter it.');
  const eden = await fixture('docs/qa/eden-immersion-production-outside-old-rectangle-save.json',
    'Existing real public exported checkpoint following native keyboard travel in the previous production journey. New run imports its unchanged bytes; no new fixture or coordinates are generated.');
  assert.equal(rachni.state.zone, 'noveria'); assert.deepEqual(rachni.state.party, ['shepard', 'kaidan', 'ashley']);
  assert.equal(eden.state.zone, 'eden-prime'); assert.ok(eden.state.position.z > 21);
  await launch();
  for (const path of Object.keys(report.buildFiles).filter(path => path === 'index.html' || /\.(?:js|css)$/.test(path) || path === 'assets/enemy-rachni-combat.png')) {
    const response = await context.request.get(new URL(path, entry).href), bytes = await response.body();
    assert.equal(response.status(), 200); assert.equal(sha(bytes), report.buildFiles[path].sha256);
    report.servedFiles.push({ path, status: 200, bytes: bytes.length, sha256: sha(bytes), matchesDist: true });
  }
  await importFixture(rachni); await pause(); const before = await exported('rachni-precombat');
  assert.deepEqual(stable(before), stable(rachni.state)); await resume(); await toastsGone();
  await screenshot('noveria-field');
  await activate(page.locator('#hud .interaction[data-do="interact"]'));
  await page.locator('#battle-ui .battle-shell').waitFor({ state: 'visible' });
  const actualEnemies = await page.locator('[data-do="battle-target"]').evaluateAll(nodes => nodes.map(node => node.dataset.id));
  const expectedEnemies = enemiesFor('noveria', 1, rachni.state).map(enemy => enemy.id);
  assert.deepEqual(expectedEnemies, ['rachni-0', 'rachni-1', 'rachni-2']); assert.deepEqual(actualEnemies, expectedEnemies);
  const party = await page.locator('.battle-member').evaluateAll(nodes => nodes.map(node => node.dataset.id));
  assert.deepEqual(party, rachni.state.party);
  await page.waitForTimeout(1000); await screenshot('rachni-public-battle');
  await nativeShot();
  await reloadContinue(); await pause(); const restored = await exported('rachni-restored');
  assert.deepEqual(stable(restored), stable(before));
  report.encounter = { zone: 'noveria', actualEnemyIDs: actualEnemies, expectedEnemyIDs: expectedEnemies, party,
    actualNaturalATBShot: true, exactPrecombatRestore: true, omittedStateFields: ['playedSeconds'], noVictoryRewardClaimed: true };
  record('Noveria public field/battle frames, three native rachni targets, one natural-ATB shot, real reload and exact downloaded precombat restore');
  await importFixture(eden); await activate(action('map')); await page.locator('.local-map-board .level-map-ground').waitFor();
  await toastsGone(); await mapBoard('map-desktop');
  await page.setViewportSize({ width: 390, height: 844 }); await toastsGone();
  await mapBoard('map-mobile'); await mapListEnd();
  record('Entire Eden map board and marker7 fit the actual desktop/mobile viewport; real mobile nested scrolling reaches list entry7');
  await noHarness(); await Promise.all(pendingResponses.splice(0));
  for (const key of ['errors', 'failedRequests', 'sourceRequests', 'evidenceErrors']) assert.deepEqual(report[key], []);
  for (const observation of report.consoleObservations) {
    assert.ok(/Failed to load resource/.test(observation.text) && new URL(observation.location.url).pathname === '/favicon.ico',
      `Unexpected console error: ${JSON.stringify(observation)}`);
  }
  assert.ok(report.browserResponses.some(item => item.path === 'assets/enemy-rachni-combat.png' && item.status === 200), 'Real page requested the exact rachni atlas');
  for (const [path, hash] of Object.entries(report.sources)) assert.equal(sha(await readFile(new URL(path, root))), hash, `Source changed while collecting: ${path}`);
  for (const item of report.fixtures) assert.equal(sha(await readFile(new URL(item.path, root))), item.sha256);
  assert.deepEqual(await tree(dist), report.buildFiles, 'Build bytes remain unchanged throughout collection');
  report.sourceAndDistFrozen = true; await shutdown();
  assert.equal(report.profile.launches, 1); assert.equal(report.profile.completeShutdowns, 1); report.passed = true;
} catch (error) {
  report.failure = error.stack || String(error); process.exitCode = 1; console.error(report.failure);
  if (page && !page.isClosed()) await screenshot('failure').catch(() => {});
} finally {
  if (context) await shutdown().catch(error => { report.closeError = error.message; });
  report.finishedAt = new Date().toISOString(); report.elapsedSeconds = Math.round((Date.now() - started) / 10) / 100;
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, captures: report.screenshots.length,
    exports: report.exports.length, browserClosed: report.profile.completeShutdowns === report.profile.launches, failure: report.failure }));
}
