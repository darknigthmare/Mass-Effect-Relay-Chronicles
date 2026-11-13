// Production copy of the frozen DEV01 collector, with strict dist/HTTP checks.
// Declared native campaign fixtures, followed by ordinary public controls.
// No private browser state, harness, DOM mutation or clock acceleration.
import assert from 'node:assert/strict';
import { readFile, writeFile, access, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { newGame, recruit, winEncounter, completeZone, zoneEncounters, encodeSave, decodeSave } from '../src/state.js';
import { recordVisit } from '../src/story.js';

const root = new URL('../', import.meta.url), prefix = process.env.BANTER_REPORT_PREFIX;
const mode = 'production', entry = process.env.GAME_URL || 'http://127.0.0.1:4196/';
assert.match(prefix || '', /^continuation-banter-[a-z0-9-]+$/);
assert.ok(!process.env.BANTER_BUILD_KIND || process.env.BANTER_BUILD_KIND === mode);
const reportPath = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(reportPath); throw new Error('Use a fresh report prefix.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const sha = value => createHash('sha256').update(value).digest('hex');
const sources = ['src/continuation-banter.js', 'src/continuation-banter-data.js', 'src/story.js', 'src/story-data.js', 'src/state.js', 'src/game-data.js', 'src/main.js', 'src/continuation-catalogue.css', 'scripts/continuation-banter-production.mjs', 'src/universe-data.js', 'package.json', 'package-lock.json', 'vite.config.js'];
const devReportPath = 'docs/qa/continuation-banter-dev-01-report.json', devCollectorPath = 'scripts/continuation-banter-public.mjs';
const devReportBytes = await readFile(new URL(devReportPath, root)), devReport = JSON.parse(devReportBytes);
assert.equal(devReport.passed, true); assert.equal(devReport.mode, 'development');
const devCollectorSHA256 = sha(await readFile(new URL(devCollectorPath, root)));
assert.equal(devCollectorSHA256, devReport.sourcesBefore[devCollectorPath], 'The already executed DEV collector must remain unchanged.');
const report = { passed: false, at: new Date().toISOString(), baselineCommit: '5d933068cacd1b595d584b7cedfffd35b1db362d', mode, url: entry,
  command: { script: 'node scripts/continuation-banter-production.mjs', environment: { BANTER_REPORT_PREFIX: prefix, BANTER_BUILD_KIND: mode, GAME_URL: entry } },
  provenance: { devReportPath, devReportSHA256: sha(devReportBytes), devCollectorPath, devCollectorSHA256,
    adaptation: 'Copied the frozen DEV01 public-control scenarios verbatim; added production-only dist, HTTP, console, request refusal and immutable DEV provenance checks. No product change.' },
  sourcesBefore: {}, sourcesAfter: {}, registryContextHashes: { before: {}, after: {} }, fixtures: [], imports: [], exports: [], captures: [], checks: [], errors: [],
  distFiles: {}, distFilesAfter: {}, distFrozen: false, sourceRequests: [], servedFiles: [], failedRequests: [], consoleErrors: [], resourceWarnings: [],
  limits: ['The declared Node fixtures prepare previous chapters, recruitment and encounters; those actions were not played in this browser.',
    'Only elapsed real foreground time and public file choosers, pause, export, reload and continue controls are used.',
    'The browser samples three living squad pairs and both Virmire losses. All fifteen pairs, Jenkins, invalid imports, story budget and other-media isolation are covered natively.',
    'These are original short French ME1 adaptations. No original transcript, full romance, voice recording or elevator scene is claimed.'] };
let browser, page;
const loadedJSAndCSS = new Set();
const action = name => page.locator(`[data-do="${name}"]`).first();
const hud = () => page.locator('#exploration-banter');
const activate = async locator => { await locator.waitFor({ state: 'visible' }); await locator.click(); };
const check = name => { report.checks.push({ name, passed: true }); console.log(JSON.stringify({ check: name })); };
const assets = state => Object.fromEntries(['xp', 'credits', 'medigel', 'paragon', 'renegade', 'inventory', 'cleared', 'completed', 'choices', 'recruited', 'lost', 'party'].map(key => [key, state[key]]));
async function hashes() { return Object.fromEntries(await Promise.all(sources.map(async path => [path, sha(await readFile(new URL(path, root)))]))); }
async function registryHashes() { return { 'src/universe-data.js': sha(await readFile(new URL('src/universe-data.js', root))) }; }
async function distTree(directory = new URL('dist/', root), prefixPath = '') {
  const result = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory), path = prefixPath + entry.name;
    if (entry.isDirectory()) Object.assign(result, await distTree(target, path + '/'));
    else { const bytes = await readFile(target); result[path] = { bytes: bytes.length, sha256: sha(bytes) }; }
  }
  return result;
}
async function verifyServedFiles() {
  const origin = new URL(entry);
  for (const url of loadedJSAndCSS) {
    const target = new URL(url); assert.equal(target.origin, origin.origin);
    const path = decodeURIComponent(target.pathname).replace(/^\//, '');
    assert.ok(report.distFiles[path], `Compiled file missing: ${path}`);
    const response = await page.request.get(target.href); assert.equal(response.status(), 200);
    const bytes = await response.body(); assert.equal(bytes.length, report.distFiles[path].bytes); assert.equal(sha(bytes), report.distFiles[path].sha256);
    report.servedFiles.push({ path, bytes: bytes.length, sha256: sha(bytes), matchesDist: true });
  }
  assert.ok(report.servedFiles.some(file => file.path.endsWith('.js')));
  assert.ok(report.servedFiles.some(file => file.path.endsWith('.css')));
}
function travel(state, zone) { state.zone = zone; state.position = null; assert.equal(recordVisit(state, zone), true); }
function finish(state, zone, choice) { travel(state, zone); for (const id of zoneEncounters(zone)) assert.equal(winEncounter(state, id), true); assert.equal(completeZone(state, zone, choice), true); }
function prepare(pair, virmire) {
  const state = newGame({ name: 'QA Banter', difficulty: 'story' }); state.flags.briefed = true;
  finish(state, 'eden-prime'); travel(state, 'citadel');
  for (const id of ['garrus', 'tali', 'wrex']) assert.equal(recruit(state, id), true);
  assert.equal(completeZone(state, 'citadel'), true);
  if (virmire) { finish(state, 'therum'); finish(state, 'feros', 'save'); finish(state, 'virmire', virmire); }
  travel(state, 'citadel'); state.party = ['shepard', ...pair];
  assert.ok(decodeSave(encodeSave(state))); return state;
}
async function fixture(state, label) {
  const path = `docs/qa/${prefix}-${label}-fixture.json`, bytes = Buffer.from(encodeSave(state));
  await writeFile(new URL(path, root), bytes);
  report.fixtures.push({ path, sha256: sha(bytes), bytes: bytes.length, prepared: { completed: state.completed, recruited: state.recruited, lost: state.lost, party: state.party, zone: state.zone, position: state.position }, origin: 'Explicit native Node callbacks; prior chapters and squad preparation are not browser gameplay.' });
  return { path, bytes, state };
}
async function ready() {
  await page.locator('#hud:not(.hidden) .location h2').waitFor();
  await page.locator('#transition.active').waitFor({ state: 'hidden' });
  await page.locator('#overlay .screen, #overlay .dialogue').waitFor({ state: 'hidden' });
}
async function imported(value) {
  if (!await action('import').isVisible()) { await page.keyboard.press('Escape'); await activate(action('quit')); }
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), activate(action('import'))]);
  await chooser.setFiles({ name: value.path.split('/').at(-1), mimeType: 'application/json', buffer: value.bytes });
  report.imports.push({ path: value.path, sha256: sha(value.bytes), source: report.fixtures.some(item => item.path === value.path) ? 'declared-fixture' : 'unaltered-public-export' });
  await ready();
}
async function capture(label) {
  const path = `docs/screenshots/${prefix}-${label}.png`, bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)), animations: 'disabled' });
  report.captures.push({ label, path, sha256: sha(bytes), bytes: bytes.length, source: 'Actual public viewport, no DOM/CSS or clock injection.' });
}
async function exported(label) {
  if (!await action('export').isVisible()) await page.keyboard.press('Escape');
  await activate(action('save'));
  const [download] = await Promise.all([page.waitForEvent('download'), activate(action('export'))]);
  const path = `docs/qa/${prefix}-${label}-export.json`; await download.saveAs(fileURLToPath(new URL(path, root)));
  assert.equal(await download.failure(), null);
  const bytes = await readFile(new URL(path, root)), state = decodeSave(bytes.toString()); assert.ok(state);
  report.exports.push({ path, sha256: sha(bytes), bytes: bytes.length, story: state.story, playedSeconds: state.playedSeconds });
  return { path, bytes, state };
}
async function assertPair(pair, expectedId) {
  await hud().waitFor({ state: 'visible', timeout: 20000 });
  const observed = await hud().locator('[data-banter-speaker]').evaluateAll(nodes => nodes.map(node => ({ speaker: node.dataset.banterSpeaker, text: node.textContent })));
  assert.deepEqual(new Set(observed.map(line => line.speaker)), new Set(pair)); assert.equal(observed.length, 2);
  assert.ok(observed.every(line => line.text.length > 30));
  const id = await hud().getAttribute('data-banter-id'); if (expectedId) assert.equal(id, expectedId);
  return id;
}

try {
  report.sourcesBefore = await hashes();
  report.registryContextHashes.before = await registryHashes();
  report.distFiles = await distTree(); assert.ok(report.distFiles['index.html']);
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  page = await context.newPage(); page.on('pageerror', error => report.errors.push(String(error)));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (/\/(?:src\/|@vite\/)/.test(url.pathname)) { report.sourceRequests.push({ url: url.href, refused: true }); await route.abort('blockedbyclient'); }
    else await route.continue();
  });
  page.on('request', request => { const url = new URL(request.url()); if (/\.(?:js|css)$/.test(url.pathname)) loadedJSAndCSS.add(url.href); });
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('response', response => { if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) report.failedRequests.push({ url: response.url(), status: response.status() }); });
  page.on('console', message => { if (message.type() === 'error') { const item = { text: message.text(), location: message.location() }; (item.location.url?.endsWith('/favicon.ico') ? report.resourceWarnings : report.consoleErrors).push(item); } });
  const initialResponse = await page.goto(entry); assert.equal(initialResponse.status(), 200);
  assert.equal(sha(await initialResponse.body()), report.distFiles['index.html'].sha256);
  await page.bringToFront(); await action('import').waitFor();
  assert.deepEqual(await page.evaluate(() => ({ qa: Object.hasOwn(window, '__RELAY_TEST__'), vite: Boolean(document.querySelector('script[src*="/@vite/client"]')) })), { qa: false, vite: mode === 'development' });
  const firstFixture = await fixture(prepare(['garrus', 'tali']), 'active-garrus-tali');
  await imported(firstFixture);
  await page.keyboard.press('Escape'); await page.waitForTimeout(10000);
  assert.equal(await hud().isVisible(), false); await capture('paused-no-banter');
  const paused = await exported('paused-before-first'); assert.deepEqual(paused.state.story.heard, []);
  check('A real ten-second pause emits no dialogue and writes no heard marker.');
  await activate(action('close')); await ready();
  const firstId = await assertPair(['garrus', 'tali'], 'banter:citadel-maintenance'); await capture('garrus-tali-context');
  await page.keyboard.press('KeyC'); await action('crew-confirm').waitFor();
  assert.equal(await hud().isVisible(), false);
  assert.equal(await action('crew-confirm').isEnabled(), false, 'field squad selection remains unavailable');
  await page.keyboard.press('Escape'); await ready();
  await assertPair(['garrus', 'tali'], firstId);
  const first = await exported('first-heard'); assert.deepEqual(first.state.story.heard, [firstId]);
  assert.deepEqual(assets(first.state), assets(firstFixture.state));
  check('Only the active Garrus/Tali pair speaks; the first contextual exchange persists without any reward.');
  await activate(action('quit')); await imported(first);
  const secondId = await assertPair(['garrus', 'tali'], 'banter:garrus-tali'); assert.notEqual(secondId, firstId); await capture('resumed-second-exchange');
  const second = await exported('second-heard'); assert.deepEqual(second.state.story.heard, [firstId, secondId]);
  await page.reload(); await action('continue').waitFor(); await activate(action('continue')); await ready();
  await page.waitForTimeout(27000); assert.equal(await hud().isVisible(), false);
  const reloaded = await exported('reloaded-no-repeat'); assert.deepEqual(reloaded.state.story.heard, second.state.story.heard);
  check('Unaltered export/import and full reload preserve both markers; neither exchange repeats after twenty-seven real seconds.');
  await activate(action('quit'));
  await imported(await fixture(prepare(['ashley', 'kaidan']), 'recruited-but-absent-garrus-tali'));
  await page.keyboard.press('KeyC'); await action('crew-confirm').waitFor();
  assert.equal(await hud().isVisible(), false);
  await page.keyboard.press('Escape'); await ready();
  assert.equal(await hud().isVisible(), false, 'the old Garrus/Tali exchange cannot reappear after the imported squad changes');
  await capture('changed-party-before-next-delay');
  await assertPair(['ashley', 'kaidan'], 'banter:kaidan-ashley'); await capture('only-ashley-kaidan');
  check('After the declared imported squad change and an actual Commando open/close, no stale Garrus/Tali HUD returns; only Ashley and Kaidan speak after their new delay.');
  await page.keyboard.press('Escape'); await activate(action('quit'));
  for (const [choice, survivor, dead] of [['save-kaidan', 'kaidan', 'ashley'], ['save-ashley', 'ashley', 'kaidan']]) {
    const value = await fixture(prepare([survivor, 'tali'], choice), choice);
    await imported(value); await assertPair([survivor, 'tali']); await capture(choice);
    const actual = await exported(choice); assert.ok(actual.state.lost.includes(dead));
    assert.deepEqual(assets(actual.state), assets(value.state));
    check(`After ${choice}, only ${survivor} and Tali speak; ${dead} stays narratively dead and rewards remain unchanged.`);
    await activate(action('quit'));
  }
  report.sourcesAfter = await hashes(); assert.deepEqual(report.sourcesAfter, report.sourcesBefore);
  report.registryContextHashes.after = await registryHashes(); assert.deepEqual(report.registryContextHashes.after, report.registryContextHashes.before);
  await verifyServedFiles();
  report.distFilesAfter = await distTree(); assert.deepEqual(report.distFilesAfter, report.distFiles); report.distFrozen = true;
  assert.deepEqual(report.sourceRequests, []); assert.deepEqual(report.failedRequests, []); assert.deepEqual(report.consoleErrors, []);
  assert.equal(sha(await readFile(new URL(devReportPath, root))), report.provenance.devReportSHA256);
  assert.equal(sha(await readFile(new URL(devCollectorPath, root))), devCollectorSHA256);
  assert.deepEqual(report.errors, []); report.passed = true;
} catch (error) { report.failure = error.stack || String(error); console.error(report.failure); process.exitCode = 1; }
finally { await browser?.close(); await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n'); }
