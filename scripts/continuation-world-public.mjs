// Actual public controls and JSON imports/exports only. No QA harness, app-state
// assignment, clock edits, scene injection, DOM/style edits or forced cadence.
import assert from 'node:assert/strict';
import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { newGame, encodeSave, decodeSave, winEncounter, completeZone, zoneEncounters } from '../src/state.js';
import { recordVisit } from '../src/story.js';
import { WORLD_ZONES } from '../src/world-data.js';

const root = new URL('../', import.meta.url), prefix = process.env.CONTINUATION_WORLD_PREFIX;
const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4191/');
const mode = process.env.RELAY_BUILD_KIND || 'vite-development';
const development = mode === 'vite-development';
assert.match(prefix || '', /^continuation-world-[a-z0-9-]+$/); assert.equal(url.search, '');
const output = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(output); throw Error('Use a new prefix; preserve earlier attempts.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { passed: false, at: new Date().toISOString(), baselineCommit: '5d933068cacd1b595d584b7cedfffd35b1db362d', url: url.href, mode, fixtures: [], captures: [], exports: [], checks: [], observations: [],
  errors: [], failedRequests: [], consoleErrors: [], sourceHashes: {}, distFiles: {}, sourceRequests: [],
  command: { script: 'node scripts/continuation-world-public.mjs', environment: { GAME_URL: url.href, RELAY_BUILD_KIND: mode, CONTINUATION_WORLD_PREFIX: prefix } },
  scope: 'Public Citadel ascent/descent, opaque-pillar traversal, stationary camera threshold, and real Eden retreat/re-engagement with paused wall time.',
  limitations: ['Prepared native saves place the party in unlocked chapters; earlier traversal and fixture victories are not claimed played.',
    'Screenshots show the actual viewport. Native independent geometry tests measure support, feet, shadow and camera monotonicity; screenshots alone do not measure these coordinates.',
    'The Citadel stairs and retained scenery are scene-unit adaptation geometry, not original level plans or an artistic fidelity certificate.',
    'Opaque pillar traversal is a representative public scene; native tests also check depth configuration and independent front/behind geometry. No exhaustive art review is claimed.',
    'No original-game physics, device FPS, Electron or Windows behavior is certified. No victory or reward from the public retreat battle is claimed.'] };
let browser, page;
const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
async function click(locator) { await locator.waitFor({ state: 'visible' }); assert.equal(await locator.isEnabled(), true); await locator.click(); }
async function ready() {
  await page.locator('#hud:not(.hidden) .location h2').waitFor();
  await page.locator('#transition.active').waitFor({ state: 'hidden' });
  await page.locator('#overlay .screen, #overlay .dialogue').waitFor({ state: 'hidden' });
}
async function noHarness() {
  assert.deepEqual(await page.evaluate(() => ({ own: Object.hasOwn(window, '__RELAY_TEST__'), type: typeof window.__RELAY_TEST__ })), { own: false, type: 'undefined' });
}
async function sources() {
  const files = ['package.json', 'package-lock.json', 'scripts/continuation-world-public.mjs', 'tests/continuation-world.test.js',
    ...(await readdir(new URL('src/', root))).filter(name => /\.(?:js|css)$/.test(name) && (!development || name !== 'universe-data.js')).map(name => `src/${name}`)];
  return Object.fromEntries(await Promise.all(files.map(async name => [name, hash(await readFile(new URL(name, root)))])));
}
async function registryContextHashes() { return { 'src/universe-data.js': hash(await readFile(new URL('src/universe-data.js', root))) }; }
async function distFiles(directory = new URL('dist/', root), relative = '') {
  const result = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = relative + entry.name, target = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) Object.assign(result, await distFiles(target, path + '/'));
    else { const bytes = await readFile(target); result[path] = { bytes: bytes.length, sha256: hash(bytes) }; }
  }
  return result;
}
async function capture(label) {
  const path = `docs/screenshots/${prefix}-${label}.png`, bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)), animations: 'disabled' });
  report.captures.push({ label, path, sha256: hash(bytes), bytes: bytes.length, source: 'Actual public viewport with no DOM/style/pose injection.' });
}
async function fixture(label, zone, position) {
  const state = newGame({ name: 'QA Terrain', difficulty: 'story', mode: 'wait' }); state.flags.briefed = true;
  if (zone === 'citadel') {
    state.zone = 'eden-prime'; recordVisit(state, state.zone);
    for (const id of zoneEncounters(state.zone)) assert.equal(winEncounter(state, id), true);
    assert.equal(completeZone(state, state.zone), true);
  }
  state.zone = zone; recordVisit(state, zone); state.position = { ...position };
  const bytes = Buffer.from(encodeSave(state)); assert.ok(decodeSave(bytes.toString()));
  const path = `docs/qa/${prefix}-${label}-fixture.json`; await writeFile(new URL(path, root), bytes);
  const record = { label, path, sha256: hash(bytes), zone, position, importedViaPublicChooser: false,
    origin: zone === 'citadel' ? 'newGame Story/Wait; briefing, three native winEncounter callbacks and native completeZone unlock Citadel; recordVisit and starting position. Earlier play and victories are prepared, not browser-earned.'
      : 'newGame Story/Wait; briefing, native Eden recordVisit and initial position only. No HP, ATB or clock edits.' };
  report.fixtures.push(record); return { record, bytes };
}
async function imported(value) {
  if (!await action('import').isVisible()) { await ready(); await page.keyboard.press('Escape'); await click(action('quit')); }
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), click(action('import'))]);
  await chooser.setFiles({ name: value.record.path.split('/').at(-1), mimeType: 'application/json', buffer: value.bytes });
  value.record.importedViaPublicChooser = true; await ready(); await noHarness();
}
async function exported(label, { pauseAlreadyOpen = false, keepOpen = false } = {}) {
  if (!pauseAlreadyOpen) { await ready(); await page.keyboard.press('Escape'); }
  await page.locator('.pause-screen').waitFor(); await click(action('save'));
  const [download] = await Promise.all([page.waitForEvent('download'), click(action('export'))]);
  const path = `docs/qa/${prefix}-${label}-export.json`; await download.saveAs(fileURLToPath(new URL(path, root))); assert.equal(await download.failure(), null);
  const bytes = await readFile(new URL(path, root)), state = decodeSave(bytes.toString()); assert.ok(state);
  report.exports.push({ label, path, sha256: hash(bytes), observed: { zone: state.zone, position: state.position, playedSeconds: state.playedSeconds, xp: state.xp, credits: state.credits, cleared: state.cleared } });
  if (!keepOpen) { await click(action('close')); await ready(); } return state;
}
async function held(keys, milliseconds) {
  for (const key of keys) await page.keyboard.down(key);
  await page.waitForTimeout(milliseconds);
  for (const key of keys.toReversed()) await page.keyboard.up(key);
}
async function members() {
  return page.locator('#battle-ui .battle-member').evaluateAll(nodes => nodes.map(node => ({ id: node.dataset.id,
    atb: Number.parseFloat(node.querySelector('[data-stat="atb"]').style.width), hp: node.querySelector('[data-stat="hp-label"]').textContent,
    held: node.querySelector('[data-stat="heat-summary"]').textContent.includes('Jauge réservée'), ready: node.classList.contains('ready') })));
}
async function naturallyReady() {
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    const party = await members(); assert.equal(party.length, 3); assert.ok(party.every(actor => Number.parseFloat(actor.hp) > 0));
    if (party.every(actor => actor.ready && actor.atb >= 99.999)) return;
    const available = party.find(actor => actor.ready && actor.atb >= 99.999 && !actor.held);
    if (available) { await click(action('battle-actor', available.id)); await click(action('coord-reserve')); }
    await page.waitForTimeout(100);
  }
  throw Error('Natural party readiness timed out.');
}
const check = name => { report.checks.push({ name, passed: true }); console.log(JSON.stringify({ check: name })); };

try {
  report.sourceHashes = await sources();
  report.registryContextHashes = await registryContextHashes();
  if (!development) report.distFiles = await distFiles();
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  page = await browser.newPage({ viewport: { width: 1280, height: 800 }, acceptDownloads: true }); page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('request', request => { if (/\/(?:src|@vite|@fs)\//.test(new URL(request.url()).pathname)) report.sourceRequests.push(request.url()); });
  page.on('console', message => { if (message.type() === 'error' && !/favicon\.ico/.test(message.location().url || '')) report.consoleErrors.push(message.text()); });
  await page.goto(url.href, { waitUntil: 'networkidle' }); await noHarness();
  await click(action('title-settings')); await page.locator('#completion-quality').selectOption('economy');
  assert.equal(await page.locator('body').getAttribute('data-display-quality'), 'economy');
  report.displayPreference = { quality: 'economy', source: 'Actual public title Options select; no renderer, clock or cadence injection.' };
  await capture('options-economy'); await click(action('close'));

  await imported(await fixture('stairs', 'citadel', { x: 0, z: -15.2 })); await page.waitForTimeout(900); await capture('stairs-lower');
  const lower = await exported('stairs-lower');
  await held(['KeyW', 'KeyD'], 480); await page.waitForTimeout(250); await capture('stairs-middle');
  let upper = lower;
  for (let attempt = 1; attempt <= 5 && upper.position.z >= -18.5; attempt++) {
    await held(['KeyW', 'KeyD'], 420); upper = await exported(`stairs-upper-step-${attempt}`);
  }
  assert.ok(upper.position.z < -18.5); await page.waitForTimeout(450); await capture('stairs-upper');
  let returned = upper;
  for (let attempt = 1; attempt <= 5 && returned.position.z <= -16; attempt++) {
    await held(['KeyS', 'KeyA'], 650); returned = await exported(`stairs-return-step-${attempt}`);
  }
  assert.ok(returned.position.z > -16); await page.waitForTimeout(450); await capture('stairs-returned');
  report.observations.push({ kind: 'public-stairs-traversal', lower: lower.position, upper: upper.position, returned: returned.position });
  check('Public keyboard ascent and descent cross every native Citadel approach stair; real exports record the route.');

  await imported(await fixture('opaque-pillar', 'citadel', { x: 17, z: 15.6 })); await page.waitForTimeout(900); await capture('pillar-before');
  await held(['KeyD'], 450); await page.waitForTimeout(200); await capture('pillar-behind'); const behind = await exported('pillar-behind');
  await held(['KeyA'], 650); await page.waitForTimeout(450); await capture('pillar-emerged');
  report.observations.push({ kind: 'public-opaque-pillar-traversal', behind: behind.position,
    reviewRequired: 'Identify the N7 leader across the real before/behind/emerged images. Other squad members have independent positions and occlusion.' });
  check('Public keyboard traverses the real Citadel pillar silhouette with three unmodified viewport captures.');

  await imported(await fixture('camera-threshold', 'citadel', { x: 18.65, z: 13 }));
  let stopped = { position: { x: 18.65, z: 13 } };
  for (let attempt = 1; attempt <= 4 && stopped.position.x < 18.75; attempt++) {
    await held(['KeyD'], 900); stopped = await exported(`camera-stopped-step-${attempt}`);
  }
  assert.ok(stopped.position.x >= 18.75); await page.waitForTimeout(1600); await capture('camera-threshold-stop');
  await page.waitForTimeout(1400); await capture('camera-threshold-stationary'); const stationary = await exported('camera-stationary');
  assert.deepEqual(stationary.position, stopped.position); assert.ok(stopped.position.x >= 18.75);
  report.observations.push({ kind: 'public-camera-threshold', stopped: stopped.position, stationary: stationary.position });
  check('Public crossing and stop at the x=18.75 camera clamp retains an identical position across stationary exports.');

  const first = WORLD_ZONES['eden-prime'].pois.find(poi => poi.id === 'eden-prime:encounter-1');
  await imported(await fixture('retreat-boundary', 'eden-prime', { x: first.x, z: first.z }));
  await page.keyboard.press('KeyE'); await page.locator('.battle-member').first().waitFor(); await naturallyReady();
  await click(action('battle-retreat')); await page.locator('.dialogue').waitFor(); await capture('retreat-confirmation');
  await click(page.locator('.choice').filter({ hasText: 'Confirmer le repli.' })); await ready();
  const retreated = await exported('retreated');
  const clearances = WORLD_ZONES['eden-prime'].pois.filter(poi => poi.type === 'encounter').map(poi => ({ id: poi.id, distance: Math.hypot(retreated.position.x - poi.x, retreated.position.z - poi.z) }));
  assert.ok(clearances.every(value => value.distance >= 5));
  // Labels are the public DOM projection of their marker. The icon lies .62
  // scene units below its label anchor (about 13 px at this viewport), so this
  // actual pointer click targets the existing marker and native pathfinder.
  const anchor = await page.locator('.world-labels > div').nth(2).evaluate(el => ({ x: Number.parseFloat(el.style.left), y: Number.parseFloat(el.style.top) }));
  await page.mouse.click(anchor.x, anchor.y + 13.3);
  await page.locator('#toasts .toast').filter({ hasText: 'Repli en cours' }).last().waitFor();
  assert.equal(await page.locator('.battle-member').count(), 0); await page.keyboard.press('Escape');
  const beforeBoundary = await exported('boundary-denied', { pauseAlreadyOpen: true, keepOpen: true }); await capture('boundary-denied-paused');
  assert.ok(Math.hypot(beforeBoundary.position.x - first.x, beforeBoundary.position.z - first.z) < 2.65);
  assert.ok(beforeBoundary.playedSeconds - retreated.playedSeconds < 8);
  const pauseStart = Date.now(); await page.waitForTimeout(9100);
  const afterPausedWallTime = await exported('boundary-paused-wall-time', { pauseAlreadyOpen: true, keepOpen: true });
  assert.deepEqual(afterPausedWallTime, beforeBoundary);
  await click(action('close')); await ready(); await page.keyboard.press('KeyE');
  assert.equal(await page.locator('.battle-member').count(), 0);
  const stillDenied = await page.locator('#toasts .toast').filter({ hasText: 'Repli en cours' }).last().innerText();
  await capture('boundary-still-denied-after-pause');
  const denialSamples = [{ elapsedAfterResumeMs: 0, message: stillDenied }], resumedAt = Date.now();
  let entered = false;
  for (let attempt = 0; attempt < 24; attempt++) {
    await page.waitForTimeout(400); await page.keyboard.press('KeyE');
    if (await page.locator('.battle-member').count()) { entered = true; break; }
    const denial = page.locator('#toasts .toast').filter({ hasText: 'Repli en cours' }).last();
    denialSamples.push({ elapsedAfterResumeMs: Date.now() - resumedAt, message: await denial.innerText() });
  }
  assert.equal(entered, true); await capture('boundary-natural-reentry');
  report.observations.push({ kind: 'real-retreat-boundary', clearances, nearContact: beforeBoundary.position,
    foregroundSecondsBeforePause: beforeBoundary.playedSeconds - retreated.playedSeconds,
    pausedWallTimeMs: Date.now() - pauseStart - (Date.now() - resumedAt), pausedExportsIdentical: true,
    denialSamples, enteredAfterResumeMs: Date.now() - resumedAt, timerOrStateInjected: false });
  check('A real safe retreat refuses immediate near-contact re-entry, ignores over nine seconds paused wall time, then accepts after naturally elapsed foreground recovery.');
  assert.deepEqual(await sources(), report.sourceHashes); report.sourceFrozen = true;
  assert.deepEqual(await registryContextHashes(), report.registryContextHashes); report.registryContextFrozenDuringRun = true;
  if (!development) {
    assert.deepEqual(await distFiles(), report.distFiles); report.distFrozen = true;
    assert.deepEqual(report.sourceRequests, []);
  }
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []); assert.deepEqual(report.consoleErrors, []); report.passed = true;
} catch (error) {
  report.failure = error.stack || String(error);
  if (page && !page.isClosed()) try { await capture('failure'); } catch {}
} finally {
  if (browser) await browser.close(); report.browserClosed = true;
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ passed: report.passed, report: fileURLToPath(output), checks: report.checks.length, captures: report.captures.length, failure: report.failure }));
if (!report.passed) process.exitCode = 1;
