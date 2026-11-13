// Shared public-control collector. Native fixtures stay explicit; browser reads
// observe public DOM only and never assign private state, clocks, HP or styles.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { encodeSave, decodeSave } from '../src/state.js';
import { decodeCampaignExport } from '../src/completion-persistence-campaign.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { levelMapProjection } from '../src/level-map-render.js';
import { getLevelLayout, isLevelGround } from '../src/level-layout-data.js';
import { findLevelPath } from '../src/world-navigation.js';
import { ROOT, sha, fresh } from './completion-tracking-common.mjs';

const BASE = 'f94bd6b7fbb36a4cd83b7672e7eb294b4830735f';
const read = filename => fs.readFile(path.resolve(ROOT, filename));
async function filesBelow(directory) {
  const result = [];
  for (const entry of await fs.readdir(path.resolve(ROOT, directory), { withFileTypes: true })) {
    const filename = `${directory}/${entry.name}`;
    if (entry.isDirectory()) result.push(...await filesBelow(filename)); else result.push(filename);
  }
  return result.sort();
}
async function distHashes() {
  return Object.fromEntries(await Promise.all((await filesBelow('dist')).map(async filename => {
    const bytes = await read(filename); return [filename.slice('dist/'.length), { bytes: bytes.length, sha256: sha(bytes) }];
  })));
}

export async function runPublicProof({ family, collector, run, scope, limitations = [], sourcePaths = [] }) {
  assert.ok(['citadel', 'noveria', 'virmire', 'endgame', 'origins'].includes(family)); assert.equal(typeof run, 'function');
  const mode = process.env.RESOLVE_MODE || 'development'; assert.ok(['development', 'production'].includes(mode));
  const url = new URL(process.env.GAME_URL || `http://127.0.0.1:${mode === 'production' ? 4202 : 4201}/`);
  assert.equal(url.search, ''); assert.equal(url.hash, ''); assert.ok(['http:', 'https:'].includes(url.protocol));
  const prefix = process.env.RESOLVE_PREFIX; assert.match(prefix || '', new RegExp(`^resolve-${family}-[a-z0-9-]+$`));
  const collectorPath = path.relative(ROOT, fileURLToPath(collector));
  assert.match(collectorPath, /^scripts\/resolve-[a-z0-9-]+\.mjs$/);
  const output = `docs/qa/${prefix}-report.json`;
  for (const directory of ['docs/qa', 'docs/screenshots']) {
    await fs.mkdir(path.join(ROOT, directory), { recursive: true });
    const collisions = (await fs.readdir(path.join(ROOT, directory))).filter(filename => filename === prefix || filename.startsWith(prefix + '-'));
    assert.deepEqual(collisions, [], `Preserve every prior execution: choose a fresh RESOLVE_PREFIX (${directory}).`);
  }
  await fresh(path.resolve(ROOT, output));
  const files = [...new Set([...(await filesBelow('src')).filter(filename => mode === 'production' || filename !== 'src/universe-data.js'),
    ...(await filesBelow('tests')).filter(filename => filename.startsWith('tests/resolve-')),
    collectorPath, 'scripts/resolve-browser-proof.mjs', 'scripts/completion-tracking-common.mjs',
    'index.html', 'package.json', 'package-lock.json', 'vite.config.js', 'public/assets/manifest.json',
    ...(mode === 'production' ? ['docs/content-catalog.json'] : []), ...sourcePaths])].sort();
  const sources = async () => Object.fromEntries(await Promise.all(files.map(async filename => [filename, sha(await read(filename))])));
  const registry = async () => Object.fromEntries(await Promise.all(['docs/content-catalog.json', 'src/universe-data.js'].map(async filename => [filename, sha(await read(filename))])));
  const report = { passed: false, generatedAt: new Date().toISOString(), mode, family, url: url.href,
    baseCommit: BASE, baselineCommit: BASE, commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(),
    command: { script: `node ${collectorPath}`, environment: { GAME_URL: url.href, RESOLVE_MODE: mode, RESOLVE_PREFIX: prefix } },
    scope: scope || `Current ${family} public controls, declared native preparation, save/reload and actual screenshots.`,
    sourceHashes: {}, finalSourceHashes: {}, registryContextHashes: {}, finalRegistryContextHashes: {},
    distFiles: {}, finalDistFiles: {}, servedFiles: [], httpVerified: [], sourceRequests: [],
    fixtures: [], exports: [], captures: [], checks: [], walkingSamples: [], errors: [], consoleErrors: [], failedRequests: [], deliveryErrors: [],
    rawConsoleErrors: [], rawFailedRequests: [], resourceWarnings: [],
    resourceWarningPolicy: 'Only same-origin GET /favicon.ico HTTP 404 and its exact Chromium console message are retained as warnings; all other failures block the run. Console classification does not depend on response event ordering.',
    limitations: [...limitations, 'Native fixture preparation and any position transfer are explicitly declared and are not claimed played in this browser.',
      'Only actual public DOM readings, keyboard/mouse controls, imports and exports are used; no private browser state, clock, HP, DOM or style assignment.',
      'Current functional scenes do not certify full original geography, dialogue, artwork, hardware or native Windows compatibility.'] };
  let browser, page, executionComplete = false;
  const pendingResponses = new Set(), observedResponses = new Map();
  const artifact = async (filename, bytes) => { await fresh(path.resolve(ROOT, filename)); await fs.writeFile(path.resolve(ROOT, filename), bytes); return { path: filename, sha256: sha(bytes), bytes: bytes.length }; };
  const action = (name, id) => page.locator(`[data-do=${JSON.stringify(name)}]${id == null ? '' : `[data-id=${JSON.stringify(id)}]`}`).first();
  const click = async input => {
    const locator = typeof input === 'string' ? page.locator(input) : input;
    await locator.waitFor({ state: 'visible' }); assert.equal(await locator.isEnabled(), true, 'Public control must be enabled'); await locator.click();
  };
  const ready = async () => {
    await page.locator('#hud:not(.hidden) .location h2').waitFor();
    await page.locator('#transition.active').waitFor({ state: 'hidden' });
    await page.locator('#overlay .screen, #overlay .dialogue').waitFor({ state: 'hidden' });
  };
  const noHarness = async () => assert.deepEqual(await page.evaluate(() => ({ own: Object.hasOwn(window, '__RELAY_TEST__'), type: typeof window.__RELAY_TEST__ })), { own: false, type: 'undefined' });
  const check = (name, condition = true, details) => {
    assert.equal(typeof name, 'string'); assert.equal(Boolean(condition), true, name);
    report.checks.push({ name, passed: true, ...(details === undefined ? {} : { details }) }); console.log(JSON.stringify({ family, check: name }));
  };
  const capture = async (label, input) => {
    assert.match(label, /^[a-z0-9-]+$/); assert.ok(!report.captures.some(item => item.label === label));
    const target = `docs/screenshots/${prefix}-${label}.png`; await fresh(path.resolve(ROOT, target));
    const locator = typeof input === 'string' ? page.locator(input) : input;
    const bytes = await (locator || page).screenshot({ path: path.resolve(ROOT, target), animations: 'disabled' });
    const record = { label, path: target, sha256: sha(bytes), bytes: bytes.length, source: 'Actual public rendered pixels; no DOM/style/state injection.' };
    report.captures.push(record); return record;
  };
  const fixture = async (state, label, origin) => {
    assert.match(label, /^[a-z0-9-]+$/); assert.ok(origin, 'Describe the native preparation and any transferred position.');
    const bytes = Buffer.from(encodeSave(state)); assert.ok(decodeSave(bytes.toString()));
    const record = { ...await artifact(`docs/qa/${prefix}-${label}-fixture.json`, bytes), label, origin,
      zone: state.zone, position: structuredClone(state.position), importedViaPublicChooser: false };
    report.fixtures.push(record); return { bytes, record };
  };
  const imported = async value => {
    if (!await action('import').isVisible()) { await ready(); await page.keyboard.press('Escape'); await click(action('quit')); }
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), click(action('import'))]);
    await chooser.setFiles({ name: path.basename(value.record.path), mimeType: 'application/json', buffer: value.bytes });
    value.record.importedViaPublicChooser = true; await ready(); await noHarness();
  };
  const exported = async (label, options = {}) => {
    assert.match(label, /^[a-z0-9-]+$/);
    const campaign = options === 'campaign' || options?.campaign === true;
    const exportAction = action(campaign ? 'export-campaign' : 'export');
    if (!await exportAction.isVisible()) { await ready(); await page.keyboard.press('Escape'); if (!campaign) await click(action('save')); }
    const [download] = await Promise.all([page.waitForEvent('download'), click(exportAction)]);
    const filename = `docs/qa/${prefix}-${label}-${campaign ? 'campaign-export' : 'export'}.json`; await fresh(path.resolve(ROOT, filename));
    await download.saveAs(path.resolve(ROOT, filename)); assert.equal(await download.failure(), null);
    const bytes = await read(filename), decoded = campaign ? decodeCampaignExport(bytes.toString()) : null;
    const state = campaign ? decodeSave(decoded?.save) : decodeSave(bytes.toString()); assert.ok(state, 'Actual public export must decode');
    const record = { label, path: filename, sha256: sha(bytes), bytes: bytes.length, zone: state.zone,
      kind: campaign ? 'campaign' : 'save', xp: state.xp, credits: state.credits, party: state.party, publicDownload: true };
    report.exports.push(record);
    if (options?.keepOpen !== true && await action('close').isVisible()) { await click(action('close')); await ready(); }
    return { ...record, state, record: decoded || JSON.parse(bytes.toString()), bytes };
  };
  async function mapSnapshot(poiId, requestedZone) {
    await ready(); const heading = (await page.locator('#hud .location h2').textContent()).trim(), subtitle = (await page.locator('#hud .location .sub').textContent()).trim();
    const zone = requestedZone || (heading === 'La Citadelle' ? (subtitle.includes('ASSAUT FINAL') ? 'citadel-finale' : 'citadel')
      : Object.values(WORLD_ZONES).find(item => item.label === heading)?.id);
    assert.ok(WORLD_ZONES[zone], `Identify actual public zone: ${heading} / ${subtitle}`);
    await page.keyboard.press('KeyM'); await click(action('map-filter', 'all'));
    const observed = await page.locator('.local-map-board').evaluate((board, id) => {
      const player = board.querySelector('.map-player'), target = board.querySelector(`circle[data-map-position="${id}"]`);
      if (!player || !target) throw Error('Missing actual public map player/marker: ' + id);
      const button = [...board.querySelectorAll('button[data-id]')].find(node => node.dataset.id === id);
      return { player: { x: parseFloat(player.style.left), z: parseFloat(player.style.top) },
        target: { x: +target.getAttribute('cx'), z: +target.getAttribute('cy') }, label: button?.getAttribute('title') || null,
        obstacles: [...board.querySelectorAll('[data-map-obstacle]')].map(node => node.tagName.toLowerCase() === 'circle'
          ? { kind: 'circle', x: +node.getAttribute('cx'), z: +node.getAttribute('cy'), radius: +node.getAttribute('r') }
          : { kind: 'rect', minX: +node.getAttribute('x'), minZ: +node.getAttribute('y'), maxX: +node.getAttribute('x') + +node.getAttribute('width'), maxZ: +node.getAttribute('y') + +node.getAttribute('height') }) };
    }, poiId);
    const bounds = WORLD_ZONES[zone].bounds, layout = getLevelLayout(zone), projection = layout ? levelMapProjection(bounds) : null;
    const decode = point => projection ? { x: bounds.minX + (point.x - projection.originX) / projection.scale, z: bounds.minZ + (point.z - projection.originZ) / projection.scale }
      : { x: bounds.minX + (point.x - 5) / 90 * (bounds.maxX - bounds.minX), z: bounds.minZ + (point.z - 5) / 90 * (bounds.maxZ - bounds.minZ) };
    await click(action('close')); await ready(); return { zone, bounds, layout, player: decode(observed.player), target: decode(observed.target), label: observed.label, obstacles: observed.obstacles };
  }
  async function fieldSnapshot(zone) {
    const observed = await page.evaluate(() => {
      const marker = document.querySelector('.minimap svg > circle[r="3.5"]');
      if (!marker) throw Error('Actual public radar must remain present.');
      return { x: +marker.getAttribute('cx'), z: +marker.getAttribute('cy'), interaction: document.querySelector('#hud .interaction')?.textContent || '' };
    });
    const bounds = WORLD_ZONES[zone].bounds, projection = getLevelLayout(zone) ? levelMapProjection(bounds, { left: 12, top: 12, width: 126, height: 126 }) : null;
    const position = projection ? { x: bounds.minX + (observed.x - projection.originX) / projection.scale, z: bounds.minZ + (observed.z - projection.originZ) / projection.scale }
      : { x: bounds.minX + (observed.x - 12) / 126 * (bounds.maxX - bounds.minX), z: bounds.minZ + (observed.z - 12) / 126 * (bounds.maxZ - bounds.minZ) };
    return { position, interaction: observed.interaction };
  }
  const walkToPOI = async (poiId, options = {}) => {
    assert.equal(typeof poiId, 'string'); const began = Date.now(), samples = [];
    for (let attempt = 0; attempt < 100; attempt++) {
      const map = await mapSnapshot(poiId, options.zone), label = options.label || map.label;
      const initial = await fieldSnapshot(map.zone), interaction = initial.interaction;
      if (label && interaction.includes(label)) return;
      const distance = Math.hypot(map.target.x - map.player.x, map.target.z - map.player.z);
      if (!label && distance < (options.tolerance || 1.65)) return;
      if (distance < (options.tolerance || 1.3)) return;
      samples.push(map.player);
      if (samples.length >= 5 && Math.max(...samples.slice(-5).map(point => Math.hypot(point.x - map.player.x, point.z - map.player.z))) < .1) throw Error(`Five actual map samples show no progress to ${poiId}`);
      assert.ok(Date.now() - began < (options.timeout || 150000), `Public walking deadline: ${poiId}`);
      const allowed = padding => (x, z) => (!map.layout || isLevelGround(map.layout, x, z)) && !map.obstacles.some(solid => solid.kind === 'circle'
        ? Math.hypot(x - solid.x, z - solid.z) < solid.radius + padding : x > solid.minX - padding && x < solid.maxX + padding && z > solid.minZ - padding && z < solid.maxZ + padding);
      let free = allowed(.25); if (!free(map.player.x, map.player.z) || !free(map.target.x, map.target.z)) free = allowed(0);
      const route = findLevelPath({ bounds: map.bounds, start: map.player, destination: map.target, isWalkable: free });
      assert.ok(route?.length, `No path through actual public footprints: ${poiId}`);
      const clear = point => { const count = Math.max(1, Math.ceil(Math.hypot(point.x - map.player.x, point.z - map.player.z) / .15)); for (let index = 1; index <= count; index++) if (!free(map.player.x + (point.x - map.player.x) * index / count, map.player.z + (point.z - map.player.z) * index / count)) return false; return true; };
      let next = route[0]; for (const point of route) { if (Math.hypot(point.x - map.player.x, point.z - map.player.z) > 2 || !clear(point)) break; next = point; }
      const dx = next.x - map.player.x, dz = next.z - map.player.z, length = Math.hypot(23, 27), side = { x: 27 / length, z: -23 / length }, up = { x: -23 / length, z: -27 / length };
      const directions = [];
      for (const [right, forward] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const x = side.x * right + up.x * forward, z = side.z * right + up.z * forward, magnitude = Math.hypot(x, z);
        if (clear({ x: map.player.x + x / magnitude * .55, z: map.player.z + z / magnitude * .55 })) directions.push({ right, forward, score: (dx * x + dz * z) / magnitude });
      }
      assert.ok(directions.length, `No clear public keyboard direction: ${poiId}`);
      const best = directions.sort((a, b) => b.score - a.score)[0], keys = ['ShiftLeft'];
      if (best.right) keys.push(best.right > 0 ? 'KeyD' : 'KeyA'); if (best.forward) keys.push(best.forward > 0 ? 'KeyW' : 'KeyS');
      const before = initial.position, wanted = Math.min(1.1, Math.max(.3, Math.hypot(dx, dz))), deadline = Date.now() + 10000;
      let after = before, arrived = false; for (const key of keys) await page.keyboard.down(key);
      try { while (Date.now() < deadline) { await page.waitForTimeout(80); const snapshot = await fieldSnapshot(map.zone); after = snapshot.position; if (label && snapshot.interaction.includes(label)) { arrived = true; break; } if (Math.hypot(after.x - before.x, after.z - before.z) >= wanted) break; } }
      finally { for (const key of [...keys].reverse()) await page.keyboard.up(key); }
      report.walkingSamples.push({ poiId, zone: map.zone, before, after, keys, wanted, arrived, source: 'Actual public map footprints and radar displacement; ordinary held keyboard controls.' });
      if (arrived) return; assert.ok(Math.hypot(after.x - before.x, after.z - before.z) > .03, `Held public keys did not move: ${poiId}`);
    }
    throw Error(`Public walking attempts exhausted: ${poiId}`);
  };
  try {
    report.sourceHashes = await sources(); report.sourceSHA = sha(JSON.stringify(report.sourceHashes)); report.registryContextHashes = await registry();
    report.collectorSnapshot = await artifact(`docs/qa/${prefix}-collector.mjs`, await read(collectorPath));
    report.helperSnapshot = await artifact(`docs/qa/${prefix}-helper.mjs`, await read('scripts/resolve-browser-proof.mjs'));
    if (mode === 'production') { report.distFiles = await distHashes(); assert.ok(report.distFiles['index.html']); }
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
      args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    page = await context.newPage(); page.setDefaultTimeout(30000);
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('request', request => { const target = new URL(request.url()); if (target.origin === url.origin && /^\/(?:src|@vite|@fs)\//.test(target.pathname)) report.sourceRequests.push(target.href); });
    if (mode === 'production') await page.route('**/*', async route => { const target = new URL(route.request().url()); if (target.origin === url.origin && /^\/(?:src|@vite|@fs)\//.test(target.pathname)) await route.abort('blockedbyclient'); else await route.continue(); });
    page.on('requestfailed', request => { const item = { url: request.url(), reason: request.failure()?.errorText }; report.rawFailedRequests.push(item); report.failedRequests.push(item); });
    page.on('console', message => {
      if (message.type() !== 'error') return;
      const item = { text: message.text(), location: message.location() }; report.rawConsoleErrors.push(item);
      let target; try { target = new URL(item.location.url); } catch {}
      if (target?.origin === url.origin && target.pathname === '/favicon.ico' && !target.search && item.text === 'Failed to load resource: the server responded with a status of 404 (Not Found)') report.resourceWarnings.push(item);
      else report.consoleErrors.push(item);
    });
    page.on('response', response => {
      const target = new URL(response.url()); if (target.origin !== url.origin) return;
      if (response.status() >= 400) {
        const item = { url: target.href, status: response.status(), method: response.request().method() };
        if (target.pathname === '/favicon.ico' && !target.search && response.status() === 404 && item.method === 'GET') report.resourceWarnings.push(item); else report.deliveryErrors.push(item);
      }
      if (mode !== 'production' || response.status() !== 200 || !/\.(?:js|css)$/.test(target.pathname)) return;
      const task = (async () => {
        const filename = decodeURIComponent(target.pathname.slice(1)), expected = report.distFiles[filename]; assert.ok(expected, `Unexpected compiled response: ${filename}`);
        const bytes = await response.body(); assert.equal(bytes.length, expected.bytes, filename); assert.equal(sha(bytes), expected.sha256, filename);
        observedResponses.set(filename, { path: filename, bytes: bytes.length, sha256: sha(bytes), matchesDist: true, observedActualBrowserResponse: true });
      })().catch(error => report.deliveryErrors.push({ url: target.href, error: String(error) }));
      pendingResponses.add(task); task.finally(() => pendingResponses.delete(task));
    });
    const entry = await page.goto(url.href, { waitUntil: 'domcontentloaded' }); assert.equal(entry.status(), 200);
    if (mode === 'production') {
      const bytes = await entry.body(); assert.equal(sha(bytes), report.distFiles['index.html'].sha256);
      observedResponses.set('index.html', { path: 'index.html', bytes: bytes.length, sha256: sha(bytes), matchesDist: true, observedActualBrowserResponse: true });
    }
    await action('import').waitFor(); await noHarness();
    await click(action('title-settings')); await page.locator('#completion-quality').selectOption('economy'); await click(action('close'));
    report.displayPreference = { quality: 'economy', source: 'Actual title Options select; no timing or renderer injection.' };
    await run({ page, report, mode, prefix, url, click, action, ready, capture, check, fixture, imported, exported, walkToPOI });
    await noHarness(); executionComplete = true;
  } catch (error) {
    report.failure = error.stack || String(error); process.exitCode = 1;
    if (page && !page.isClosed()) try { await capture('failure'); } catch {}
  } finally {
    await browser?.close(); report.browserClosed = Boolean(browser);
    try {
      while (pendingResponses.size) await Promise.all([...pendingResponses]);
      report.finalSourceHashes = await sources(); assert.deepEqual(report.finalSourceHashes, report.sourceHashes); report.sourceFrozen = true;
      report.finalRegistryContextHashes = await registry(); assert.deepEqual(report.finalRegistryContextHashes, report.registryContextHashes); report.registryContextFrozenDuringRun = true;
      report.servedFiles = [...observedResponses.values()].sort((a, b) => a.path.localeCompare(b.path));
      if (mode === 'production') {
        report.finalDistFiles = await distHashes(); assert.deepEqual(report.finalDistFiles, report.distFiles); report.distFrozen = true; assert.deepEqual(report.sourceRequests, []);
        assert.ok(report.servedFiles.some(item => item.path.endsWith('.js')), 'Observed actual browser JavaScript response is required.');
        for (const [filename, expected] of Object.entries(report.distFiles)) {
          const response = await fetch(new URL(filename, url)); assert.equal(response.status, 200, filename);
          const bytes = Buffer.from(await response.arrayBuffer()); assert.equal(bytes.length, expected.bytes, filename); assert.equal(sha(bytes), expected.sha256, filename); report.httpVerified.push(filename);
        }
        assert.deepEqual(await distHashes(), report.distFiles); report.httpAllDistFilesSameBytes = true;
      }
      if (executionComplete) {
        assert.ok(report.captures.length >= 4 && report.captures.length <= 6, 'Each family requires four to six actual PNG captures.');
        assert.ok(report.checks.length > 0);
        for (const field of ['errors', 'consoleErrors', 'failedRequests', 'deliveryErrors']) assert.deepEqual(report[field], [], field);
        report.passed = true;
      }
    } catch (error) { report.finalizationFailure = error.stack || String(error); report.failure ||= report.finalizationFailure; process.exitCode = 1; }
    await fs.writeFile(path.resolve(ROOT, output), JSON.stringify(report, null, 2) + '\n');
  }
  console.log(JSON.stringify({ passed: report.passed, family, report: output, captures: report.captures.length, checks: report.checks.length, exports: report.exports.length, failure: report.failure }));
  return report;
}
