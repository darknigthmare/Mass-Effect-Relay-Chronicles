// Actual public controls for the new mission steps. Earlier chapter progress and
// the explicitly recorded position-only transfers are fixtures, never a claimed
// traversal. No QA query, private state getter, HP edit or clock injection.
import assert from 'node:assert/strict';
import { readFile, writeFile, access, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { newGame, winEncounter, completeZone, recruit, zoneEncounters, encodeSave, decodeSave } from '../src/state.js';
import { recordVisit } from '../src/story.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { CHAPTERS } from '../src/game-data.js';
import { getLevelLayout } from '../src/level-layout-data.js';
import { levelMapProjection } from '../src/level-map-render.js';
import { MISSION_DEFINITIONS, normalizeMissionProgress, advanceMission, tickMission } from '../src/mission-progress.js';

const root = new URL('../', import.meta.url), mode = process.env.PRIORITY_OBJECTIVES_MODE || 'development';
const prefix = process.env.PRIORITY_OBJECTIVES_PREFIX, entry = new URL(process.env.GAME_URL || 'http://127.0.0.1:4191/');
assert.ok(['development', 'production'].includes(mode)); assert.match(prefix || '', /^priority-objectives-[a-z0-9-]+$/);
assert.equal(entry.search, ''); const reportURL = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(reportURL); throw Error('Preserve the old attempt and choose a fresh prefix.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const sha = value => createHash('sha256').update(value).digest('hex');
const report = { passed: false, at: new Date().toISOString(), mode, url: entry.href,
  command: { script: 'node scripts/priority-objectives-public.mjs', environment: { GAME_URL: entry.href, PRIORITY_OBJECTIVES_MODE: mode, PRIORITY_OBJECTIVES_PREFIX: prefix } },
  scope: 'Public mission gates, naturally timed six-second disarming, pause, four charges, three MIRA stations, Vigil window, actual timeout/retry, chapter transition and save/reload. Earlier chapter progress and position-only transfers are declared fixtures.',
  sourceHashes: {}, distFiles: {}, fixtures: [], exports: [], captures: [], checks: [], mapCoordinates: [],
  errors: [], failedRequests: [], consoleErrors: [], resourceWarnings: [], sourceRequests: [],
  limits: ['Earlier chapters and prerequisite encounters are prepared with native Node callbacks, not won in this browser.',
    'Transfers change only position in the immediately preceding actual public export. No travel path is claimed played.',
    'The failure fixture is separately prepared through native start/tick callbacks with five seconds left; its earlier elapsed time is not claimed played.',
    'MIRA repairs, the 300/60-second windows, foot travel and geometry remain partial ATB adaptations. No original complete mission fidelity or physical-device performance is certified.'] };
let browser, page;
const action = name => page.locator(`[data-do="${name}"]`).first();
const activate = async locator => { await locator.waitFor({ state: 'visible' }); assert.equal(await locator.isEnabled(), true); await locator.click(); };
const check = name => { report.checks.push({ name, passed: true }); console.log(JSON.stringify({ check: name })); };
const stable = state => { const copy = structuredClone(state); delete copy.playedSeconds; return copy; };
const resources = state => ({ xp: state.xp, credits: state.credits, medigel: state.medigel, paragon: state.paragon,
  renegade: state.renegade, choices: state.choices, inventory: state.inventory, cleared: state.cleared });
async function tree(directory, prefix = '') {
  const files = {};
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + item.name, path = new URL(item.name + (item.isDirectory() ? '/' : ''), directory);
    if (item.isDirectory()) Object.assign(files, await tree(path, name + '/'));
    else { const bytes = await readFile(path); files[name] = { bytes: bytes.length, sha256: sha(bytes) }; }
  } return files;
}
async function ready() {
  await page.locator('#hud:not(.hidden) .location h2').waitFor(); await page.locator('#transition.active').waitFor({ state: 'hidden' });
  await page.locator('#overlay .screen, #overlay .dialogue').waitFor({ state: 'hidden' });
}
async function noHarness() {
  const result = await page.evaluate(() => ({ own: Object.hasOwn(window, '__RELAY_TEST__'), type: typeof window.__RELAY_TEST__, vite: !!document.querySelector('script[src*="/@vite/client"]') }));
  assert.deepEqual(result, { own: false, type: 'undefined', vite: mode === 'development' });
}
async function capture(label) {
  const path = `docs/screenshots/${prefix}-${label}.png`, bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)), animations: 'disabled' });
  report.captures.push({ path, label, sha256: sha(bytes), bytes: bytes.length, source: 'Actual public viewport; no DOM, pose, CSS or private-state injection.' });
}
function prepare(zone, encounters) {
  const state = newGame({ name: 'QA Objectifs', difficulty: 'story' }); state.flags.briefed = true;
  const choices = { feros: 'save', noveria: 'release', virmire: 'save-kaidan' };
  for (const id of ['eden-prime', 'citadel', 'therum', 'feros', 'noveria', 'virmire', 'ilos']) {
    state.zone = id; recordVisit(state, id); if (id === 'citadel') assert.equal(recruit(state, 'tali'), true);
    for (const encounter of zoneEncounters(id).slice(0, id === zone ? encounters : 3)) assert.equal(winEncounter(state, encounter), true);
    if (id === zone) break; assert.equal(completeZone(state, id, choices[id] ?? null), true);
  }
  state.missionProgress = normalizeMissionProgress(undefined, state);
  assert.ok(decodeSave(encodeSave(state))); return state;
}
async function fixture(state, label, origin) {
  const path = `docs/qa/${prefix}-${label}-fixture.json`, bytes = encodeSave(state); assert.ok(decodeSave(bytes));
  await writeFile(new URL(path, root), bytes);
  const result = { path, sha256: sha(bytes), state, bytes: Buffer.from(bytes) };
  report.fixtures.push({ path, sha256: result.sha256, origin, position: state.position, importedViaPublicChooser: false }); return result;
}
async function imported(value) {
  if (!await action('import').isVisible()) { await ready(); await activate(action('pause')); await activate(action('quit')); }
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), activate(action('import'))]);
  await chooser.setFiles({ name: value.path.split('/').at(-1), mimeType: 'application/json', buffer: value.bytes });
  report.fixtures.find(item => item.path === value.path).importedViaPublicChooser = true;
  await ready(); await noHarness();
}
async function exported(label, { keepOpen = false } = {}) {
  if (!await action('export').isVisible()) { await ready(); await activate(action('pause')); await activate(action('save')); }
  const [download] = await Promise.all([page.waitForEvent('download'), activate(action('export'))]);
  const path = `docs/qa/${prefix}-${label}-export.json`; await download.saveAs(fileURLToPath(new URL(path, root)));
  assert.equal(await download.failure(), null); const bytes = await readFile(new URL(path, root)), state = decodeSave(bytes.toString('utf8')); assert.ok(state);
  const result = { label, path, sha256: sha(bytes), state };
  report.exports.push({ label, path, sha256: result.sha256, bytes: bytes.length, position: state.position, progress: state.missionProgress });
  if (!keepOpen) { await activate(action('close')); await ready(); } return result;
}
async function transfer(actual, destination, label) {
  const state = structuredClone(actual.state), before = state.position; state.position = { ...destination };
  const omit = value => { const copy = structuredClone(value); delete copy.position; return copy; };
  assert.deepEqual(omit(state), omit(actual.state));
  const value = await fixture(state, label, { kind: 'Position-only transfer from actual public export', parentExport: actual.path,
    parentSHA256: actual.sha256, changedFields: [{ path: 'position', before, after: state.position }], navigationClaimed: false });
  await imported(value); return value;
}
async function mapPoint(id, zone) {
  await ready(); await activate(action('map')); await activate(page.locator('[data-do="map-filter"][data-id="all"]'));
  const point = await page.locator('.local-map-board').evaluate((board, id) => {
    const numbers = [...board.querySelectorAll(':scope > .map-number')], index = numbers.findIndex(node => node.dataset.id === id);
    if (index < 0) throw Error('Missing public map marker: ' + id);
    const circle = board.querySelectorAll(':scope > svg > circle')[index]; if (!circle) throw Error('Missing source point');
    return { sourceX: Number(circle.getAttribute('cx')), sourceY: Number(circle.getAttribute('cy')) };
  }, id);
  const layout = getLevelLayout(zone), projection = levelMapProjection(layout.bounds);
  const result = { x: layout.bounds.minX + (point.sourceX - projection.originX) / projection.scale,
    z: layout.bounds.minZ + (point.sourceY - projection.originZ) / projection.scale };
  report.mapCoordinates.push({ id, from: 'Visible public map source circle, inverted with the native map projection', ...point, position: result });
  await activate(action('close')); await ready(); return result;
}
async function interactMission(id, choice, label) {
  await ready(); await page.keyboard.press('KeyE'); await page.locator(`.dialogue[data-mission-id="${id}"]`).waitFor();
  if (label) await capture(label); await activate(page.locator(`[data-mission-choice="${choice}"]`)); await ready();
}
async function journal(id, label) {
  await ready(); await activate(action('journal')); await page.locator(`[data-mission-progress="${id}"]`).scrollIntoViewIfNeeded();
  await capture(label); await activate(action('close')); await ready();
}

try {
  const paths = ['src/main.js', 'src/state.js', 'src/world.js', 'src/game-data.js', 'src/combat.js', 'src/mission-progress.js', 'src/mission-progress-ui.js',
    'src/simulation-clock.js', 'src/gamepad-controls.js', 'src/campaign-talents.js', 'src/level-layout-data.js', 'src/frontier-layout-data.js', 'src/horizon-layout-data.js',
    'src/world-data.js', 'src/story.js', 'src/level-map-render.js', 'src/local-map.js', 'scripts/priority-objectives-public.mjs'];
  for (const path of paths) report.sourceHashes[path] = sha(await readFile(new URL(path, root)));
  const collector = await readFile(new URL('scripts/priority-objectives-public.mjs', root));
  const collectorPath = `docs/qa/${prefix}-collector.mjs`; await writeFile(new URL(collectorPath, root), collector);
  report.collectorSnapshot = { path: collectorPath, sha256: sha(collector) };
  if (mode === 'production') report.distFiles = await tree(new URL('dist/', root));
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  page = await browser.newPage({ viewport: { width: 1280, height: 800 }, acceptDownloads: true }); page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), reason: request.failure()?.errorText }));
  page.on('request', request => { if (/\/(?:src|@vite|@fs)\//.test(new URL(request.url()).pathname)) report.sourceRequests.push(request.url()); });
  page.on('response', response => { if (response.status() >= 400) (new URL(response.url()).pathname === '/favicon.ico' && response.status() === 404 ? report.resourceWarnings : report.failedRequests).push({ url: response.url(), status: response.status() }); });
  page.on('console', message => { if (message.type() !== 'error') return; const value = { text: message.text(), location: message.location() };
    const url = value.location.url; if (url && new URL(url).pathname === '/favicon.ico' && value.text === 'Failed to load resource: the server responded with a status of 404 (Not Found)') report.resourceWarnings.push(value); else report.consoleErrors.push(value); });
  await page.goto(entry.href, { waitUntil: 'networkidle' }); await noHarness();

  const eden = prepare('eden-prime', 2); eden.position = { x: 22, z: -52.7 };
  await imported(await fixture(eden, 'eden-before-gate', { kind: 'Earlier progression and two encounters prepared through native callbacks', playedInBrowser: false }));
  await interactMission('eden-prime', 'start', 'eden-gate');
  let actual = await exported('eden-started'); assert.equal(actual.state.missionProgress.records['eden-prime'].status, 'active');
  const edenResources = resources(actual.state);
  for (const [index, step] of MISSION_DEFINITIONS['eden-prime'].steps.entries()) {
    const point = await mapPoint(`mission:eden-prime:${step.id}`, 'eden-prime');
    actual = await exported(`eden-before-${step.id}`); await transfer(actual, point, `eden-at-${step.id}`);
    await interactMission('eden-prime', 'disarm', index === 0 ? 'eden-charge-dialogue' : null);
    if (index === 0) {
      await page.waitForTimeout(1800); const paused = await exported('eden-channel-paused', { keepOpen: true });
      assert.ok(paused.state.missionProgress.records['eden-prime'].channel?.remaining > 0);
      await capture('eden-save-pauses-channel'); await page.waitForTimeout(2200);
      const held = await exported('eden-channel-still-paused', { keepOpen: true });
      assert.deepEqual(held.state.missionProgress, paused.state.missionProgress);
      await activate(action('close')); await ready(); await page.waitForTimeout((held.state.missionProgress.records['eden-prime'].channel.remaining + .8) * 1000);
    } else await page.waitForTimeout(6800);
    actual = await exported(`eden-${step.id}-complete`); assert.ok(actual.state.missionProgress.records['eden-prime'].steps.includes(step.id));
    assert.equal(actual.state.missionProgress.records['eden-prime'].steps.length, index + 1); assert.deepEqual(resources(actual.state), edenResources);
  }
  assert.equal(actual.state.missionProgress.records['eden-prime'].status, 'complete'); await journal('eden-prime', 'eden-four-charges-complete');
  check('Four public six-second disarmings, save-menu pause and no reward for mission-only completion');

  const failure = prepare('eden-prime', 2); failure.position = { ...MISSION_DEFINITIONS['eden-prime'].start };
  advanceMission(failure, 'eden-prime', 'start'); tickMission(failure, 295);
  await imported(await fixture(failure, 'eden-five-seconds', { kind: 'Isolated native start/tick failure-boundary fixture', timerPreparedSeconds: 295, elapsedTimeClaimedPlayed: false }));
  await page.locator('.dialogue[data-mission-id="eden-prime"] [data-mission-choice="retry"]').waitFor({ timeout: 20000 });
  await capture('eden-timeout'); await activate(page.locator('[data-mission-choice="retry"]')); await ready();
  const restarted = await exported('eden-restarted'); assert.equal(restarted.state.missionProgress.records['eden-prime'].attempts, 2);
  assert.equal(restarted.state.missionProgress.records['eden-prime'].steps.length, 0); assert.ok(restarted.state.missionProgress.records['eden-prime'].remaining > 290);
  assert.deepEqual(resources(restarted.state), resources(failure)); check('Public real expiry and explicit checkpoint reset without resource changes');

  const noveria = prepare('noveria', 1); noveria.position = { x: 23, z: -40.7 };
  await imported(await fixture(noveria, 'mira-before-gate', { kind: 'Earlier progression and first Noveria encounter prepared through native callbacks', playedInBrowser: false }));
  await interactMission('noveria', 'start', 'mira-gate'); actual = await exported('mira-started'); const miraResources = resources(actual.state);
  for (const [index, id] of ['uplink', 'memory', 'power'].entries()) {
    const point = await mapPoint(`mission:noveria:${id}`, 'noveria'); actual = await exported(`mira-before-${id}`);
    await transfer(actual, point, `mira-at-${id}`); await interactMission('noveria', 'repair', index === 0 ? 'mira-repair-dialogue' : null);
    actual = await exported(`mira-${id}-repaired`); assert.equal(actual.state.missionProgress.records.noveria.steps.length, index + 1);
    assert.deepEqual(resources(actual.state), miraResources);
  }
  assert.equal(actual.state.missionProgress.records.noveria.status, 'complete'); await journal('noveria', 'mira-three-stations');
  check('Three different public MIRA stations persist in the selected order without rewards');

  const ilos = prepare('ilos', 3); ilos.position = { x: -4, z: -80 };
  await imported(await fixture(ilos, 'ilos-at-objective', { kind: 'Earlier progression and Ilos encounters prepared through native callbacks', playedInBrowser: false }));
  await interactMission('ilos', 'start', 'ilos-objective'); actual = await exported('ilos-before-vigil'); assert.equal(actual.state.missionProgress.records.ilos.remaining, null);
  const vigilPoint = await mapPoint('mission:ilos:vigil', 'ilos'); actual = await exported('ilos-to-vigil');
  await transfer(actual, vigilPoint, 'ilos-at-vigil'); await interactMission('ilos', 'activate', 'vigil-window-dialogue');
  actual = await exported('ilos-window-active'); assert.ok(actual.state.missionProgress.records.ilos.remaining > 0 && actual.state.missionProgress.records.ilos.remaining <= 60);
  const conduitPoint = await mapPoint('mission:ilos:conduit', 'ilos'); actual = await exported('ilos-to-conduit');
  await transfer(actual, conduitPoint, 'ilos-at-conduit'); await interactMission('ilos', 'enter', 'conduit-arrival'); actual = await exported('ilos-window-complete');
  assert.equal(actual.state.missionProgress.records.ilos.status, 'complete'); assert.equal(actual.state.completed.includes('ilos'), false);
  await journal('ilos', 'ilos-passage-reached'); const beforeTransition = await exported('ilos-before-transition');
  const objective = WORLD_ZONES.ilos.pois.find(poi => poi.type === 'objective'); assert.ok(objective);
  await transfer(beforeTransition, { x: objective.x, z: objective.z }, 'ilos-transition-point'); await page.keyboard.press('KeyE');
  await page.getByRole('button', { name: 'Emprunter le Conduit et poursuivre la mission.', exact: true }).waitFor(); await capture('ilos-transition-confirmation');
  await activate(page.getByRole('button', { name: 'Emprunter le Conduit et poursuivre la mission.', exact: true }));
  await page.getByRole('button', { name: 'Emprunter le Conduit.', exact: true }).waitFor(); await activate(page.getByRole('button', { name: 'Emprunter le Conduit.', exact: true })); await ready();
  const transitioned = await exported('citadel-arrival'); assert.equal(transitioned.state.zone, 'citadel-finale'); assert.ok(transitioned.state.completed.includes('ilos'));
  assert.equal(transitioned.state.xp, beforeTransition.state.xp + CHAPTERS.ilos.reward); assert.equal(transitioned.state.credits, beforeTransition.state.credits + 180);
  check('Vigil activation, actual public Conduit arrival and one native chapter transition/reward');
  await page.reload({ waitUntil: 'networkidle' }); await noHarness(); await activate(action('continue')); await ready();
  const resumed = await exported('reloaded-citadel'); assert.deepEqual(stable(resumed.state), stable(transitioned.state)); await capture('resumed-at-citadel');
  check('Actual automatic-save reload preserves the completed mission and chapter transition');

  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []); assert.deepEqual(report.consoleErrors, []);
  if (mode === 'production') assert.deepEqual(report.sourceRequests, []);
  for (const [path, expected] of Object.entries(report.sourceHashes)) assert.equal(sha(await readFile(new URL(path, root))), expected, `Source changed during run: ${path}`);
  if (mode === 'production') assert.deepEqual(await tree(new URL('dist/', root)), report.distFiles);
  report.sourceFrozen = true; report.distFrozen = mode === 'production'; report.passed = true;
} catch (error) { report.failure = error.stack || String(error); process.exitCode = 1; if (page) try { await capture('failure'); } catch {} }
finally { await browser?.close(); await writeFile(reportURL, JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, captures: report.captures.length, failure: report.failure })); }
