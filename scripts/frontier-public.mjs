import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { newGame, winEncounter, completeZone, recruit, zoneEncounters, encodeSave, decodeSave } from '../src/state.js';
import { recordVisit } from '../src/story.js';
import { enemiesFor } from '../src/game-data.js';
import { FRONTIER_LAYOUTS } from '../src/frontier-layout-data.js';

// Node prepares declared native JSON saves. Chromium only uses public controls,
// real keyboard/touch input, DOM observations and downloaded public save exports.
const root = new URL('../', import.meta.url);
const mode = process.env.FRONTIER_QA_MODE || 'dev';
assert.ok(['dev', 'production'].includes(mode));
const prefix = process.env.FRONTIER_QA_PREFIX;
assert.match(prefix || '', /^frontier-public-[a-z0-9-]+$/, 'Use a new FRONTIER_QA_PREFIX for every attempt.');
const entry = new URL(process.env.GAME_URL || (mode === 'production' ? 'http://127.0.0.1:4173' : 'http://127.0.0.1:5173'));
assert.equal(entry.search, '', 'The public journey must not request a QA harness.');
const reportPath = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(reportPath); throw Error('Existing report: preserve it and choose another FRONTIER_QA_PREFIX.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
for (const path of ['docs/qa/', 'docs/screenshots/']) await mkdir(new URL(path, root), { recursive: true });
const sha = data => createHash('sha256').update(data).digest('hex');
const started = Date.now();
const report = {
  schemaVersion: 1, passed: false, startedAt: new Date().toISOString(), mode, url: entry.href,
  sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: fileURLToPath(root), encoding: 'utf8' }).trim(),
  command: { script: 'node scripts/frontier-public.mjs', environment: { FRONTIER_QA_MODE: mode,
    FRONTIER_QA_PREFIX: prefix, GAME_URL: entry.href, PLAYWRIGHT_EXECUTABLE_PATH: process.env.PLAYWRIGHT_EXECUTABLE_PATH || null } },
  scope: 'Public Mako boarding, keyboard drive/boost, pause, dismount, native export/import/reload on foot; real Parasini topic; one real naturally-ready ATB order on Therum formation0; three desktop/mobile local maps. All preceding story completion is declared fixture preparation, never claimed as played.',
  fixtures: [], sourceHashes: {}, distFiles: {}, servedFiles: [], browserResponses: [], exports: [],
  captures: [], checks: [], orders: [], input: [], maps: [], errors: [], failedRequests: [], evidenceErrors: [],
  consoleErrors: [], sourceRequests: [], resourceWarnings: [], tools: { node: process.version },
  limitations: [
    'Native Node fixtures complete earlier Eden/Citadel, and two missions only for the Virmire map. Those prepared victories, choices and recruitment are not played in this Chromium journey.',
    'Mako state is transient. Reload/import resumes the ordinary party on foot and resets the Mako parking position; no persistent vehicle format is claimed.',
    'One Therum tactical order is issued; no full vehicle battle, mission victory or reward is claimed.',
    'Four fixed Mako views do not provide wheel animation, suspension, jump, turret/cannon/machine gun, hull damage or repair.',
    'Chromium desktop/mobile viewports and synthesized native multi-touch input are not physical device performance evidence or a canonical 1:1 certificate.',
  ],
};
let browser, context, page;
const pending = [];
const action = (name, id) => page.locator(`[data-do="${name}"]${id === undefined ? '' : `[data-id="${id}"]`}`).first();
const stable = value => { const copy = structuredClone(value); delete copy.playedSeconds; return copy; };
const check = name => { report.checks.push({ name, passed: true }); console.log(JSON.stringify({ check: name })); };

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
  await target.scrollIntoViewIfNeeded(); await target.focus(); await page.keyboard.press('Enter');
}
async function noHarness() {
  const observed = await page.evaluate(() => ({ own: Object.hasOwn(window, '__RELAY_TEST__'), type: typeof window.__RELAY_TEST__,
    viteClient: !!document.querySelector('script[src*="/@vite/client"]') }));
  assert.deepEqual(observed, { own: false, type: 'undefined', viteClient: mode === 'dev' });
  return observed;
}
async function worldReady() {
  // The party strip intentionally collapses on mobile; the public location
  // title remains visible in both layouts and does not inspect application state.
  await page.locator('#hud:not(.hidden) .location h2').waitFor({ state: 'visible' });
  await page.locator('#transition.active').waitFor({ state: 'hidden' });
  await page.locator('#overlay .screen').waitFor({ state: 'hidden' });
}
async function pause() { await worldReady(); await activate(action('pause')); await action('export').waitFor(); }
async function resume() { await activate(action('close')); await worldReady(); }
async function capture(label) {
  const path = `docs/screenshots/${prefix}-${label}.png`;
  const bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)), animations: 'disabled' });
  report.captures.push({ label, path, sha256: sha(bytes), bytes: bytes.length, viewport: page.viewportSize(),
    source: 'Actual public game viewport; no injected CSS, scene, pose, state or harness.' });
}
function travel(state, zone) { state.zone = zone; state.position = null; assert.equal(recordVisit(state, zone), true); }
function finish(state, zone, choice = null) {
  travel(state, zone);
  for (const id of zoneEncounters(zone)) assert.equal(winEncounter(state, id), true);
  assert.equal(completeZone(state, zone, choice), true);
}
function afterCouncil() {
  const state = newGame({ name: 'QA Frontières', difficulty: 'story', mode: 'wait' });
  state.flags.briefed = true; state.settings.sound = false; state.settings.reducedMotion = true;
  finish(state, 'eden-prime'); travel(state, 'citadel');
  for (const id of ['garrus', 'tali', 'wrex']) assert.equal(recruit(state, id), true);
  assert.equal(completeZone(state, 'citadel'), true);
  return state;
}
async function fixture(label, zone, position, additional = false) {
  const state = afterCouncil();
  if (additional) { finish(state, 'therum'); finish(state, 'feros', 'save'); }
  travel(state, zone); state.position = { ...position };
  const serialized = encodeSave(state), decoded = decodeSave(serialized);
  assert.ok(decoded, `Native fixture ${label} decodes`);
  const path = `docs/qa/${prefix}-${label}-fixture.json`, bytes = Buffer.from(serialized);
  await writeFile(new URL(path, root), bytes);
  const metadata = { label, path, sha256: sha(bytes), bytes: bytes.length, zone, position: decoded.position,
    origin: 'Node-native newGame / recordVisit / winEncounter / recruit / completeZone / encodeSave / decodeSave. Imported through public file chooser.',
    priorStoryPreparedNotPlayed: { completed: decoded.completed, cleared: decoded.cleared, choices: decoded.choices },
    importedViaPublicChooser: false };
  report.fixtures.push(metadata); return { bytes, state: decoded, metadata };
}
async function importSave(input, metadata = null) {
  if (!await action('import').isVisible()) {
    if (!await action('quit').isVisible()) await pause();
    await activate(action('quit')); await action('import').waitFor();
  }
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), activate(action('import'))]);
  await chooser.setFiles({ name: 'frontier-native-save.json', mimeType: 'application/json', buffer: input });
  await worldReady(); if (metadata) metadata.importedViaPublicChooser = true;
  assert.match(await page.locator('#hud .explore-party').textContent(), /QA Frontières/);
}
async function exported(label) {
  await action('export').waitFor(); await activate(action('save'));
  const [download] = await Promise.all([page.waitForEvent('download'), activate(action('export'))]);
  const path = `docs/qa/${prefix}-${label}-save.json`; await download.saveAs(fileURLToPath(new URL(path, root)));
  assert.equal(await download.failure(), null);
  const bytes = await readFile(new URL(path, root)), state = decodeSave(bytes.toString('utf8'));
  assert.ok(state, 'Public download accepted by the native save validator');
  const vehicleKeys = [];
  function inspect(value, path = 'state') {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (/^(mako|vehicle|makoState|vehicleState|velocity|mounted)$/i.test(key)) vehicleKeys.push(`${path}.${key}`);
      inspect(child, `${path}.${key}`);
    }
  }
  inspect(state); assert.deepEqual(vehicleKeys, [], 'No transient vehicle fields serialized');
  report.exports.push({ label, path, sha256: sha(bytes), bytes: bytes.length, zone: state.zone,
    position: state.position, noVehicleFields: true, stableStateSHA256: sha(JSON.stringify(stable(state))),
    source: 'Actual public Sauvegarder / Exporter, real Chromium download, Node-native decodeSave.' });
  return { bytes, state };
}
async function radar() {
  return page.locator('.minimap svg circle').last().evaluate(node => ({ x: Number(node.getAttribute('cx')), y: Number(node.getAttribute('cy')) }));
}
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
async function hold(keys, milliseconds) {
  const before = await radar(); const start = Date.now();
  try {
    for (const key of keys) await page.keyboard.down(key);
    await page.waitForTimeout(milliseconds);
    // Software WebGL may render few frames while other native reviews run.
    // Wait for the public radar itself, never advance the private game clock.
    const deadline = Date.now() + 15000;
    while (distance(before, await radar()) <= .7 && Date.now() < deadline) await page.waitForTimeout(100);
  }
  finally { for (const key of [...keys].reverse()) await page.keyboard.up(key); }
  const after = await radar(); const row = { method: 'Real Playwright keyboard down/up', keys, elapsedMs: Date.now() - start,
    radarBefore: before, radarAfter: after, radarDistance: distance(before, after) };
  report.input.push(row); return row;
}
async function mounted(expected) {
  await page.waitForFunction(value => document.querySelector('.controls-hint')?.textContent.includes('M35 MAKO') === value, expected);
}
async function makoJourney(input) {
  await importSave(input.bytes, input.metadata); await capture('therum-on-foot-parking');
  assert.match(await page.locator('#hud .interaction').innerText(), /Mako/i);
  await page.keyboard.press('KeyE'); await mounted(true); await capture('mako-boarded');
  const normal = await hold(['ArrowRight'], 700);
  assert.ok(normal.radarDistance > .5, 'Actual keyboard drive changes the public radar position');
  const boost = await hold(['ShiftLeft', 'ArrowRight'], 650);
  assert.ok(boost.radarDistance > .5, 'Actual shift boost continues to move the Mako');
  await capture('mako-driven-boost');
  await pause(); const beforePause = await exported('mako-mounted-before-pause');
  await page.keyboard.down('ArrowLeft');
  try { await page.waitForTimeout(700); } finally { await page.keyboard.up('ArrowLeft'); }
  const afterPause = await exported('mako-mounted-after-pause');
  assert.deepEqual(afterPause.state.position, beforePause.state.position, 'Pause stops movement even with a held direction');
  assert.deepEqual(stable(afterPause.state), stable(beforePause.state));
  await resume(); await mounted(true); await page.keyboard.press('KeyE'); await mounted(false);
  await capture('mako-dismounted'); await pause(); const exit = await exported('mako-after-dismount');
  assert.ok(Math.hypot(exit.state.position.x - afterPause.state.position.x, exit.state.position.z - afterPause.state.position.z) > 1);
  await importSave(afterPause.bytes); await mounted(false); await capture('mounted-export-imported-on-foot');
  await pause(); const imported = await exported('mako-imported-on-foot');
  assert.deepEqual(stable(imported.state), stable(afterPause.state), 'Public import preserves normal state and resumes on foot');
  const response = await page.reload({ waitUntil: 'networkidle' }); assert.ok([200, 304].includes(response.status()));
  await noHarness(); await activate(action('continue')); await worldReady(); await mounted(false);
  await capture('mako-reloaded-on-foot'); await pause(); const reloaded = await exported('mako-reloaded-on-foot');
  assert.deepEqual(stable(reloaded.state), stable(imported.state));
  report.mako = { boardingKeyE: true, normalDrive: normal, shiftBoost: boost, pausedPositionUnchanged: true,
    dismountKeyE: true, nativeMountedExportImportsOnFoot: true, realReloadContinuesOnFoot: true, noVehicleSaveFields: true };
  check('Mako boards, drives, boosts, pauses, dismounts and restores native saves on foot');
}
async function mapViews(input) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await importSave(input.bytes, input.metadata);
  await activate(action('map')); await page.locator('.local-map-board').waitFor();
  const layout = page.locator(`.local-map-board [data-map-layout="${input.state.zone}"]`);
  assert.equal(await layout.count(), 1);
  const observation = { zone: input.state.zone,
    sectors: await layout.locator('[data-map-sector]').evaluateAll(nodes => nodes.map(node => node.dataset.mapSector)),
    routes: await layout.locator('[data-map-route]').evaluateAll(nodes => nodes.map(node => node.dataset.mapRoute)),
    markers: await page.locator('.local-map-board [data-do="track"]').count(), desktop: true, mobile: true };
  assert.equal(observation.sectors.length, 5); assert.ok(observation.routes.length >= 3); assert.ok(observation.markers >= 7);
  await capture(`${input.state.zone}-desktop-map`);
  await page.setViewportSize({ width: 390, height: 844 }); await capture(`${input.state.zone}-mobile-map`);
  const board = await page.locator('.local-map-board').boundingBox();
  assert.ok(board.width > 200 && board.width <= 390, 'Local map remains within mobile width');
  report.maps.push(observation); await page.keyboard.press('Escape'); await worldReady();
  check(`${input.state.zone} authored five-sector map is visible at desktop and mobile sizes`);
}
async function parasiniJourney(input) {
  await page.setViewportSize({ width: 1280, height: 800 }); await importSave(input.bytes, input.metadata);
  await pause(); const before = await exported('parasini-before-topic'); await resume();
  assert.match(await page.locator('#hud .interaction').innerText(), /Parasini/);
  await page.keyboard.press('KeyE'); await page.locator('.speaker').filter({ hasText: 'Gianna Parasini' }).waitFor();
  await activate(page.locator('[data-do="dialogue-choice"][data-topic-id="reception"]'));
  assert.match(await page.locator('.dialogue-text').innerText(), /assistante de l.administrateur Anoleis/);
  await capture('parasini-public-topic');
  await activate(page.locator('[data-conversation-back]')); await activate(page.locator('[data-conversation-end]'));
  await worldReady(); await pause(); const after = await exported('parasini-after-topic');
  assert.ok(after.state.story.heard.includes('parasini:reception'));
  for (const key of ['credits', 'xp', 'inventory', 'equipment', 'completed', 'cleared', 'choices', 'recruited']) {
    assert.deepEqual(after.state[key], before.state[key], `Conversation preserves ${key}`);
  }
  report.parasini = { publicTopic: 'parasini:reception', heardPersisted: true, noRewardsOrProgressionGranted: true };
  check('Parasini reception topic plays through public contact/dialogue controls without rewards');
}
async function nativeOrder(input) {
  await page.setViewportSize({ width: 1280, height: 800 }); await importSave(input.bytes, input.metadata);
  assert.match(await page.locator('#hud .interaction').innerText(), /Avant-poste|Raffinerie|geth/i);
  await page.keyboard.press('KeyE'); await page.locator('#battle-ui .battle-shell').waitFor();
  const actual = await page.locator('[data-do="battle-target"]').evaluateAll(nodes => nodes.map(node => ({ id: node.dataset.id, text: node.innerText })));
  assert.deepEqual(actual.map(item => item.id), enemiesFor('therum', 0, input.state).map(item => item.id));
  assert.ok(actual.some(item => /recon-drone/.test(item.id)) && actual.some(item => /rocket-geth/.test(item.id)));
  await capture('therum-new-native-formation');
  const deadline = Date.now() + 90000;
  let issued = false;
  while (!issued && Date.now() < deadline) {
    const ready = await page.locator('.battle-member.ready').evaluateAll(nodes => nodes.filter(node => parseFloat(node.querySelector('[data-stat="hp-label"]')?.textContent) > 0).map(node => node.dataset.id));
    for (const actorId of ready) {
      await activate(action('battle-actor', actorId));
      if (!await action('battle-action', 'shoot').isEnabled()) continue;
      const atbBefore = await page.locator(`#combat-${actorId} [data-stat="atb"]`).evaluate(node => parseFloat(node.style.width));
      assert.ok(atbBefore >= 99.999); await activate(action('battle-action', 'shoot'));
      const target = page.locator('[data-do="battle-target"]:not(:disabled)').first();
      const targetId = await target.getAttribute('data-id'); await activate(target);
      await page.waitForFunction(id => parseFloat(document.querySelector(`#combat-${id} [data-stat="atb"]`)?.style.width) < 20, actorId);
      const atbAfter = await page.locator(`#combat-${actorId} [data-stat="atb"]`).evaluate(node => parseFloat(node.style.width));
      report.orders.push({ formation: 'therum:0', actorId, actionId: 'shoot', targetId, atbBefore, atbAfter,
        log: await page.locator('#hud .combat-log').innerText(), method: 'Public enabled actor/action/target controls, naturally ready ATB; no clock or state injection.' });
      issued = true; break;
    }
    if (!issued) await page.waitForTimeout(150);
  }
  assert.equal(issued, true); await capture('therum-public-native-shot');
  report.therumFormation = { enemies: actual, nativeOrderIssued: true, victoryClaimed: false, rewardsClaimed: false };
  check('Therum reconnaissance-drone/rocket-geth formation receives a real naturally-ready tactical order');
}
async function mobileDrive(input) {
  // Return via real reload to the last native autosave, rather than escaping battle.
  await page.reload({ waitUntil: 'networkidle' }); await noHarness();
  await page.setViewportSize({ width: 390, height: 844 }); await importSave(input.bytes, input.metadata);
  await activate(action('interact')); await mounted(true); await page.locator('.mobile-pad .boost').waitFor();
  const up = await page.locator('.mobile-pad .right').boundingBox(), boost = await page.locator('.mobile-pad .boost').boundingBox();
  assert.ok(up && boost);
  const points = [up, boost].map((box, index) => ({ id: index + 1, x: box.x + box.width / 2, y: box.y + box.height / 2, radiusX: 1, radiusY: 1, force: 1 }));
  const before = await radar(), session = await context.newCDPSession(page);
  try {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points }); await page.waitForTimeout(650);
    const deadline = Date.now() + 15000;
    while (distance(before, await radar()) <= .7 && Date.now() < deadline) await page.waitForTimeout(100);
  }
  finally { await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await session.detach(); }
  const after = await radar(); assert.ok(distance(before, after) > .5, 'Simultaneous public direction+boost touches move the rover');
  await capture('mako-mobile-direction-and-boost');
  await activate(action('interact')); await mounted(false);
  report.mobileMako = { viewport: { width: 390, height: 844 }, method: 'Chromium native multi-touch events on visible public direction/ACC buttons',
    inputPoints: points, radarBefore: before, radarAfter: after, radarDistance: distance(before, after), dismountButton: true };
  check('Visible mobile direction and ACC controls accept simultaneous native touch input');
}

try {
  const runtimeSources = ['src/main.js', 'src/world.js', 'src/state.js', 'src/story.js', 'src/game-data.js', 'src/combat.js',
    'src/frontier-vehicles.js', 'src/frontier-layout-data.js', 'src/frontier-scene.js', 'src/frontier-characters.js',
    'src/frontier-enemies.js', 'src/frontier-ui.js', 'src/local-map.js', 'src/level-map-render.js', 'src/level-layout-data.js',
    'vite.config.js', 'scripts/frontier-public.mjs'];
  const assets = (await readdir(new URL('public/assets/', root))).filter(name => /^(vehicle-mako-directions|frontier-|boss-)/.test(name) && /\.(png|json)$/.test(name)).map(name => 'public/assets/' + name);
  for (const path of [...runtimeSources, ...assets]) report.sourceHashes[path] = sha(await readFile(new URL(path, root)));
  if (mode === 'production') report.distFiles = await tree(new URL('dist/', root));
  const drive = await fixture('therum-drive', 'therum', { x: -20, z: 65 });
  const formation = await fixture('therum-formation0', 'therum', FRONTIER_LAYOUTS.therum.pois['encounter-1']);
  const contact = await fixture('noveria-parasini', 'noveria', { x: -13, z: 62 });
  const virmire = await fixture('virmire-map', 'virmire', FRONTIER_LAYOUTS.virmire.spawn, true);
  browser = await chromium.launch({ headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  report.tools.chromium = browser.version();
  context = await browser.newContext({ viewport: { width: 1280, height: 800 }, hasTouch: true, acceptDownloads: true, deviceScaleFactor: 1 });
  page = await context.newPage(); page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('request', request => { if (/^\/(src|@vite|@fs)\//.test(new URL(request.url()).pathname)) report.sourceRequests.push(request.url()); });
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push({ text: message.text(), location: message.location() }); });
  page.on('response', response => {
    const url = new URL(response.url()); if (url.origin !== entry.origin) return;
    const path = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    if (response.status() >= 400) {
      const item = { url: response.url(), status: response.status() };
      if (url.pathname === '/favicon.ico' && response.status() === 404) report.resourceWarnings.push(item);
      else report.failedRequests.push(item);
      return;
    }
    const expected = mode === 'production' ? report.distFiles[path]?.sha256 : report.sourceHashes['public/' + path];
    if (!expected || response.status() === 304) return;
    pending.push((async () => { const bytes = await response.body(); assert.equal(sha(bytes), expected);
      report.browserResponses.push({ path, status: response.status(), sha256: sha(bytes), bytes: bytes.length, matchesDist: mode === 'production' });
    })().catch(error => report.evidenceErrors.push({ path, error: error.message })));
  });
  const response = await page.goto(entry.href, { waitUntil: 'networkidle' }); assert.equal(response.status(), 200);
  if (mode === 'production') assert.equal(sha(await response.body()), report.distFiles['index.html'].sha256);
  report.noHarness = await noHarness();
  for (const path of assets) {
    const publicPath = path.replace(/^public\//, ''), response = await context.request.get(new URL(publicPath, entry).href), bytes = await response.body();
    assert.equal(response.status(), 200); assert.equal(sha(bytes), report.sourceHashes[path]);
    if (mode === 'production') assert.equal(sha(bytes), report.distFiles[publicPath].sha256);
    report.servedFiles.push({ path: publicPath, status: response.status(), sha256: sha(bytes), matchesNative: true, matchesDist: mode === 'production' });
  }
  await makoJourney(drive);
  for (const input of [drive, contact, virmire]) await mapViews(input);
  await parasiniJourney(contact);
  await nativeOrder(formation);
  await mobileDrive(drive);
  await noHarness(); await Promise.all(pending.splice(0));
  for (const key of ['errors', 'failedRequests', 'evidenceErrors']) assert.deepEqual(report[key], []);
  for (const row of report.consoleErrors) assert.ok(/Failed to load resource/.test(row.text) && new URL(row.location.url).pathname === '/favicon.ico');
  if (mode === 'production') { assert.deepEqual(report.sourceRequests, []); assert.deepEqual(await tree(new URL('dist/', root)), report.distFiles); }
  for (const [path, expected] of Object.entries(report.sourceHashes)) assert.equal(sha(await readFile(new URL(path, root))), expected, `Source changed during run:${path}`);
  report.sourceFrozen = true; report.distFrozen = mode === 'production'; report.passed = true;
} catch (error) {
  report.failure = error.stack || String(error); process.exitCode = 1; console.error(report.failure);
  if (page && !page.isClosed()) await capture('failure').catch(() => {});
} finally {
  await Promise.all(pending.splice(0));
  if (context) await context.close(); if (browser) await browser.close();
  report.finishedAt = new Date().toISOString(); report.elapsedSeconds = (Date.now() - started) / 1000;
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, report: fileURLToPath(reportPath), failure: report.failure, captures: report.captures.length, orders: report.orders.length }));
}
