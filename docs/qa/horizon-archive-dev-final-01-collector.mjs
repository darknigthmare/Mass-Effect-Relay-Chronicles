// Public archive controls only. Native fixtures prepare earlier progression in
// Node; that preparation is never described as story played in this browser.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { newGame, winEncounter, completeZone, recruit, zoneEncounters, encodeSave, decodeSave } from '../src/state.js';
import { recordVisit } from '../src/story.js';
import { advanceOperation } from '../src/operations.js';

const root = new URL('../', import.meta.url), sha = bytes => createHash('sha256').update(bytes).digest('hex');
const mode = process.env.HORIZON_ARCHIVE_MODE || 'development';
assert.ok(['development', 'production'].includes(mode));
const prefix = process.env.HORIZON_ARCHIVE_PREFIX;
assert.match(prefix || '', /^horizon-archive-[a-z0-9-]+$/, 'Provide a fresh HORIZON_ARCHIVE_PREFIX.');
const entry = new URL(process.env.GAME_URL || 'http://127.0.0.1:4181');
assert.equal(entry.search, '', 'Public controls must not request a QA harness.');
const reportPath = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(reportPath); throw Error('Preserve the existing report; choose a fresh prefix.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
for (const dirname of ['docs/qa/', 'docs/screenshots/']) await mkdir(new URL(dirname, root), { recursive: true });
const report = { passed: false, startedAt: new Date().toISOString(), sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: fileURLToPath(root), encoding: 'utf8' }).trim(),
  mode, url: entry.href, command: { script: 'node scripts/horizon-archive-public.mjs', environment: { HORIZON_ARCHIVE_MODE: mode,
    HORIZON_ARCHIVE_PREFIX: prefix, GAME_URL: entry.href, PLAYWRIGHT_EXECUTABLE_PATH: process.env.PLAYWRIGHT_EXECUTABLE_PATH || null } },
  scope: 'Actual public Codex/Faune-et-vaisseaux and Chronicle reference filters with three explicitly prepared native JSON fixtures; no QA API, private store, injected CSS or forced browser state.',
  fixtures: [], sourceHashes: {}, captures: [], exports: [], checks: [], dossiers: [], referenceCases: [],
  distFiles: {}, servedFiles: [], browserResponses: [], sourceRequests: [], errors: [], failedRequests: [], consoleErrors: [], evidenceErrors: [], resourceWarnings: [],
  limitations: ['Prior victories, recruitment, visits and operation acceptance are prepared by native Node functions, not played here.',
    'Reference inspection grants no pet adoption, ship pilotage, actor, equipment, reward or original quest completion.',
    'Artwork remains fixed Prototype drawings with incomplete primary comparisons. Public software-rendered viewports do not certify device performance or original-game1:1 fidelity.',
    'The development documentary registry is fingerprinted as its executed input; the final post-workbook production registry is additionally source-frozen.'] };
const collectorPath = `docs/qa/${prefix}-collector.mjs`, collectorBytes = await readFile(new URL('scripts/horizon-archive-public.mjs', root));
await writeFile(new URL(collectorPath, root), collectorBytes);
report.collectorSnapshot = { path: collectorPath, sha256: sha(collectorBytes), purpose: 'Exact executed collector bytes preserved before any later attempt changes.' };
let browser, context, page;
const pending = [], action = (name, id) => page.locator(`[data-do="${name}"]${id === undefined ? '' : `[data-id="${id}"]`}`).first();
const stable = state => { const result = structuredClone(state); delete result.playedSeconds; return result; };
const check = name => { report.checks.push({ name, passed: true }); console.log(JSON.stringify({ check: name })); };

async function tree(base, prefix = '') {
  const files = {};
  for (const item of (await readdir(base, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const name = prefix + item.name, target = new URL(item.name + (item.isDirectory() ? '/' : ''), base);
    if (item.isDirectory()) Object.assign(files, await tree(target, name + '/'));
    else if (item.isFile()) { const bytes = await readFile(target); files[name] = { bytes: bytes.length, sha256: sha(bytes) }; }
  }
  return files;
}
async function activate(target) {
  await target.waitFor({ state: 'visible' }); assert.equal(await target.isEnabled(), true);
  await target.scrollIntoViewIfNeeded(); await target.focus(); await page.keyboard.press('Enter');
}
async function worldReady() {
  await page.locator('#hud:not(.hidden) .location h2').waitFor({ state: 'visible' });
  await page.locator('#transition.active').waitFor({ state: 'hidden' }); await page.locator('#overlay .screen').waitFor({ state: 'hidden' });
}
async function noHarness() {
  const seen = await page.evaluate(() => ({ own: Object.hasOwn(window, '__RELAY_TEST__'), type: typeof window.__RELAY_TEST__,
    viteClient: !!document.querySelector('script[src*="/@vite/client"]') }));
  assert.deepEqual(seen, { own: false, type: 'undefined', viteClient: mode === 'development' }); return seen;
}
async function capture(label) {
  const path = `docs/screenshots/${prefix}-${label}.png`, bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)), animations: 'disabled' });
  report.captures.push({ label, path, sha256: sha(bytes), bytes: bytes.length, viewport: page.viewportSize(), source: 'Actual public viewport without CSS, image, state or pose injection.' });
}
function visit(state, zone) { state.zone = zone; state.position = null; assert.equal(recordVisit(state, zone), true); }
function finish(state, zone, choice = null) {
  visit(state, zone); for (const id of zoneEncounters(zone)) assert.equal(winEncounter(state, id), true);
  assert.equal(completeZone(state, zone, choice), true);
}
function prepared(which) {
  const state = newGame({ name: 'QA Horizon Archives', difficulty: 'story', mode: 'wait' });
  state.settings.sound = false; state.settings.reducedMotion = true;
  if (which === 'fresh') return state;
  state.flags.briefed = true; finish(state, 'eden-prime'); visit(state, 'citadel');
  for (const id of ['garrus', 'tali', 'wrex']) assert.equal(recruit(state, id), true);
  assert.equal(completeZone(state, 'citadel'), true); visit(state, 'feros');
  assert.equal(winEncounter(state, 'feros:encounter-1'), true);
  assert.equal(advanceOperation(state, 'feros-varrens', 'request', 'accept').ok, true);
  if (which === 'virmire') { finish(state, 'therum'); finish(state, 'noveria', 'release'); finish(state, 'virmire', 'save-kaidan'); }
  visit(state, 'normandy'); return state;
}
async function fixture(which) {
  const state = prepared(which), bytes = Buffer.from(encodeSave(state)), decoded = decodeSave(bytes.toString()); assert.ok(decoded);
  const path = `docs/qa/${prefix}-${which}-fixture.json`; await writeFile(new URL(path, root), bytes);
  const metadata = { label: which, path, sha256: sha(bytes), bytes: bytes.length, origin: 'Native Node preparation with newGame/recordVisit/winEncounter/recruit/completeZone/advanceOperation; prior story not played in Chromium.',
    preparedProgress: { completed: decoded.completed, cleared: decoded.cleared, flags: decoded.flags, operationStage: decoded.operations.records['feros-varrens']?.stage || 0 }, importedViaPublicChooser: false };
  report.fixtures.push(metadata); return { bytes, state: decoded, metadata };
}
async function pause() { await worldReady(); await activate(action('pause')); await action('export').waitFor(); }
async function importFixture(input) {
  if (!await action('import').isVisible()) {
    if (!await action('quit').isVisible()) { if (await action('close').isVisible()) await activate(action('close')); await pause(); }
    await activate(action('quit')); await action('import').waitFor();
  }
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), activate(action('import'))]);
  await chooser.setFiles({ name: `${input.metadata.label}.json`, mimeType: 'application/json', buffer: input.bytes });
  await worldReady(); input.metadata.importedViaPublicChooser = true;
  assert.match(await page.locator('#hud .explore-party').textContent(), /QA Horizon Archives/);
}
async function exportSave(label) {
  await action('export').waitFor(); await activate(action('save'));
  const [download] = await Promise.all([page.waitForEvent('download'), activate(action('export'))]);
  const path = `docs/qa/${prefix}-${label}-export.json`; await download.saveAs(fileURLToPath(new URL(path, root)));
  assert.equal(await download.failure(), null); const bytes = await readFile(new URL(path, root)), state = decodeSave(bytes.toString()); assert.ok(state);
  report.exports.push({ label, path, sha256: sha(bytes), bytes: bytes.length, stableSHA256: sha(JSON.stringify(stable(state))), source: 'Actual public save/export and downloaded JSON.' }); return state;
}
async function openArchive() {
  await activate(action('codex')); await activate(action('horizon-archive'));
  await page.getByRole('dialog', { name: 'Faune et vaisseaux', exact: true }).waitFor();
}
const ids = locator => locator.evaluateAll(nodes => nodes.map(node => node.dataset.id));
async function campaignGroup(kind, expected) {
  await activate(action('horizon-kind', kind));
  const observed = await ids(page.locator('[data-do="horizon-record"]'));
  assert.deepEqual([...observed].sort(), [...expected].sort()); return observed;
}
async function assertDossier(id, metadata) {
  await activate(action('horizon-record', id)); const detail = page.locator(`[data-horizon-dossier="${id}"]`); await detail.waitFor();
  const expected = metadata.frames[id], observed = await detail.locator('.horizon-archive-art > svg').evaluate(svg => ({
    viewBox: svg.getAttribute('viewBox').split(' ').map(Number), overflow: svg.getAttribute('overflow'),
    source: svg.querySelector('image')?.getAttribute('href'), imageWidth: Number(svg.querySelector('image')?.getAttribute('width')),
    imageHeight: Number(svg.querySelector('image')?.getAttribute('height')), innerClips: [...svg.querySelectorAll('svg')].map(node => node.getAttribute('overflow')),
    width: svg.getBoundingClientRect().width, height: svg.getBoundingClientRect().height }));
  assert.deepEqual(observed.viewBox, expected.rect); assert.ok(observed.source.endsWith(`/assets/${metadata.file}`));
  assert.equal(observed.imageWidth, metadata.width); assert.equal(observed.imageHeight, metadata.height);
  assert.equal(observed.overflow, 'hidden'); assert.ok(observed.innerClips.every(value => value === 'hidden'));
  assert.ok(observed.width > 50 && observed.height > 50); report.dossiers.push({ id, ...observed });
}
async function responsiveCapture(label, locator) {
  await locator.scrollIntoViewIfNeeded();
  const sizes = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth,
    screen: document.querySelector('.screen')?.scrollWidth, screenWidth: document.querySelector('.screen')?.clientWidth }));
  assert.ok(sizes.document <= sizes.viewport + 1); assert.ok(sizes.screen <= sizes.screenWidth + 1);
  await capture(label);
}
async function campaignArchives(input, which, fleetAtlas, faunaAtlas) {
  await importFixture(input); await pause(); const before = await exportSave(`${which}-before`); await openArchive();
  const expectedFleet = which === 'fresh' ? ['normandy-sr1'] : which === 'council' ? ['normandy-sr1', 'destiny-ascension', 'geth-dropship'] : ['normandy-sr1', 'sovereign', 'destiny-ascension', 'geth-dropship'];
  await campaignGroup('fleet', expectedFleet);
  for (const id of expectedFleet) await assertDossier(id, fleetAtlas);
  await assertDossier(which === 'virmire' ? 'sovereign' : 'normandy-sr1', fleetAtlas);
  await responsiveCapture(`${which}-fleet-desktop`, page.locator('.horizon-archive-detail'));
  const expectedFauna = which === 'fresh' ? [] : ['varren-me1', 'alpha-varren-me1', 'gasbag-me1', 'thresher-me1'];
  await campaignGroup('fauna', expectedFauna);
  for (const id of expectedFauna) await assertDossier(id, faunaAtlas);
  if (which !== 'fresh') await assertDossier(which === 'council' ? 'alpha-varren-me1' : 'thresher-me1', faunaAtlas);
  await responsiveCapture(`${which}-fauna-desktop`, which === 'fresh' ? page.locator('.screen-head') : page.locator('.horizon-archive-detail'));
  if (which === 'virmire') {
    await page.setViewportSize({ width: 390, height: 844 });
    await campaignGroup('fleet', expectedFleet); await assertDossier('sovereign', fleetAtlas);
    await responsiveCapture('sovereign-mobile', page.locator('.horizon-archive-art'));
    await campaignGroup('fauna', expectedFauna); await assertDossier('gasbag-me1', faunaAtlas);
    await responsiveCapture('fauna-mobile', page.locator('.horizon-archive-art'));
    await page.setViewportSize({ width: 1280, height: 800 });
  }
  await activate(action('close')); await pause(); const after = await exportSave(`${which}-after`);
  assert.deepEqual(stable(after), stable(before));
  check(`Campaign ${which}: exact known dossier gates, measured clipping and no persistent inspection effect`);
}
async function chronicleContext(mediaId, periodId) {
  await page.locator('#chronicle-media').selectOption(mediaId);
  await page.locator('#chronicle-period').selectOption(periodId);
  await activate(action('universe-tab', 'references'));
}
async function referenceGroup(kind, expected) {
  await activate(action('universe-group', kind));
  const observed = await ids(page.locator('[data-do="universe-record"]'));
  assert.deepEqual([...observed].sort(), [...expected].sort()); return observed;
}
async function referenceCase(recordId, family, frameId, metadata, label) {
  await activate(action('universe-record', recordId)); const detail = page.locator(`[data-universe-record="${recordId}"]`); await detail.waitFor();
  const visual = detail.locator(`svg[data-universe-visual="${recordId}"]`); await visual.waitFor();
  const observed = await visual.evaluate(svg => ({ viewBox: svg.getAttribute('viewBox').split(' ').map(Number),
    overflow: svg.getAttribute('overflow'), source: svg.querySelector('image')?.getAttribute('href'),
    innerClips: [...svg.querySelectorAll('svg')].map(node => node.getAttribute('overflow')) }));
  assert.deepEqual(observed.viewBox, metadata.frames[frameId].rect);
  assert.ok(observed.source.endsWith(`/assets/${metadata.file}`)); assert.equal(observed.overflow, 'hidden');
  assert.ok(observed.innerClips.length > 0 && observed.innerClips.every(value => value === 'hidden'));
  if (family === 'fleet') assert.match(await detail.locator('figcaption').innerText(), /Vaisseau associé à ce lieu/);
  report.referenceCases.push({ recordId, frameId, family, ...observed });
  await responsiveCapture(label, visual);
}
async function chronicleArchives(laterAtlas, faunaAtlas) {
  const before = await exportSave('before-chronicle-references'); await activate(action('chronicles'));
  await page.locator('#chronicle-media').waitFor();
  await chronicleContext('ME2', 'me2'); await referenceGroup('fleet', ['ME2-ZON-NORMANDY-CIC']);
  await referenceCase('ME2-ZON-NORMANDY-CIC', 'fleet', 'normandy-sr2-cerberus', laterAtlas, 'chronicle-me2-sr2');
  await referenceGroup('fauna', ['ME2-ENM-VARRREN', 'ME2-SQ-TUCH-PYJAK']);
  await referenceCase('ME2-ENM-VARRREN', 'fauna', 'varren-me2', faunaAtlas, 'chronicle-me2-varren');
  await referenceCase('ME2-SQ-TUCH-PYJAK', 'fauna', 'pyjak-me2', faunaAtlas, 'chronicle-me2-pyjak');
  await chronicleContext('ME2', 'me2-opening'); await referenceGroup('fleet', []); await referenceGroup('fauna', []);
  assert.equal(await page.locator('.universe-record-detail').count(), 0); await capture('chronicle-me2-opening-closed');
  await chronicleContext('ME3', 'me3'); await referenceGroup('fleet', ['ME3-ZON-NORM-CIC']);
  await referenceCase('ME3-ZON-NORM-CIC', 'fleet', 'normandy-sr2-alliance', laterAtlas, 'chronicle-me3-sr2'); await referenceGroup('fauna', []);
  await chronicleContext('MEA', 'mea'); await referenceGroup('fleet', ['MEA-ZON-TEMPEST-BRIDGE', 'MEA-WRL-HYPERION']);
  await referenceCase('MEA-ZON-TEMPEST-BRIDGE', 'fleet', 'tempest', laterAtlas, 'chronicle-mea-tempest');
  await referenceCase('MEA-WRL-HYPERION', 'fleet', 'hyperion', laterAtlas, 'chronicle-mea-hyperion');
  await referenceGroup('fauna', ['MEA-ENM-ADHI-WILD', 'MEA-ENM-KAERKYN']);
  await referenceCase('MEA-ENM-ADHI-WILD', 'fauna', 'adhi-mea', faunaAtlas, 'chronicle-mea-adhi');
  await referenceCase('MEA-ENM-KAERKYN', 'fauna', 'kaerkyn-mea', faunaAtlas, 'chronicle-mea-kaerkyn');
  await chronicleContext('MEA', 'mea-prologue'); await referenceGroup('fleet', ['MEA-MQ-HYPERION']);
  await referenceCase('MEA-MQ-HYPERION', 'fleet', 'hyperion', laterAtlas, 'chronicle-mea-prologue-hyperion'); await referenceGroup('fauna', []);
  await chronicleContext('MEA', 'mea-apex'); await referenceGroup('fleet', []); await referenceGroup('fauna', []);
  assert.equal(await page.locator('.universe-record-detail').count(), 0); await capture('chronicle-apex-closed');
  await page.setViewportSize({ width: 390, height: 844 }); await chronicleContext('ME2', 'me2');
  await referenceGroup('fleet', ['ME2-ZON-NORMANDY-CIC']);
  await referenceCase('ME2-ZON-NORMANDY-CIC', 'fleet', 'normandy-sr2-cerberus', laterAtlas, 'chronicle-sr2-mobile');
  await referenceGroup('fauna', ['ME2-ENM-VARRREN', 'ME2-SQ-TUCH-PYJAK']);
  await referenceCase('ME2-SQ-TUCH-PYJAK', 'fauna', 'pyjak-me2', faunaAtlas, 'chronicle-pyjak-mobile');
  await page.setViewportSize({ width: 1280, height: 800 }); await activate(action('chronicle-back'));
  const after = await exportSave('after-chronicle-references'); assert.deepEqual(stable(after), stable(before));
  check('Chronicles: five contextual ship links, four animals, opening/prologue/APEX exclusions and desktop/mobile clipping without campaign mutation');
}

try {
  const assets = ['horizon-fleet-me1', 'horizon-fleet-later', 'horizon-fauna'].flatMap(stem => [`public/assets/${stem}.png`, `public/assets/${stem}.json`]);
  const sources = ['src/main.js', 'src/universe-ui.js', 'src/universe-ui.css', 'src/horizon-archive-ui.js', 'src/horizon-ui.js', 'src/horizon-ui.css',
    'src/horizon-reference-visuals.js', 'src/horizon-fleet.js', 'src/horizon-fleet-reference.js', 'src/horizon-fauna.js', 'src/state.js', 'src/story.js',
    'src/operations.js', 'src/operation-data.js', 'src/world.js', 'src/world-data.js', 'src/horizon-layout-data.js', 'src/horizon-scene.js', 'src/game-data.js',
    'src/continuity.js', 'src/continuity-data.js', 'vite.config.js', 'scripts/horizon-archive-public.mjs', ...assets];
  if (mode === 'production') sources.push('src/universe-data.js');
  for (const filename of sources) report.sourceHashes[filename] = sha(await readFile(new URL(filename, root)));
  report.documentaryRegistryAtExecution = { path: 'src/universe-data.js', sha256: sha(await readFile(new URL('src/universe-data.js', root))), frozen: mode === 'production' };
  if (mode === 'production') report.distFiles = await tree(new URL('dist/', root));
  const [fleetAtlas, laterAtlas, faunaAtlas] = await Promise.all(['horizon-fleet-me1', 'horizon-fleet-later', 'horizon-fauna'].map(async stem => JSON.parse(await readFile(new URL(`public/assets/${stem}.json`, root)))));
  const fixtures = await Promise.all(['fresh', 'council', 'virmire'].map(fixture));
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  report.chromium = browser.version(); context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, acceptDownloads: true });
  page = await context.newPage(); page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(error.message)); page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), reason: request.failure()?.errorText }));
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push({ text: message.text(), location: message.location() }); });
  page.on('request', request => { if (/^\/(?:src|@vite|@fs)\//.test(new URL(request.url()).pathname)) report.sourceRequests.push(request.url()); });
  page.on('response', response => {
    const url = new URL(response.url()); if (url.origin !== entry.origin) return;
    const path = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    if (response.status() >= 400) { const error = { path, status: response.status() }; (path === 'favicon.ico' ? report.resourceWarnings : report.failedRequests).push(error); return; }
    const expected = mode === 'production' ? report.distFiles[path]?.sha256 : report.sourceHashes['public/' + path];
    if (!expected || response.status() === 304) return;
    pending.push((async () => { const bytes = await response.body(); assert.equal(sha(bytes), expected); report.browserResponses.push({ path, sha256: sha(bytes), status: response.status() }); })().catch(error => report.evidenceErrors.push({ path, error: error.message })));
  });
  const response = await page.goto(entry.href, { waitUntil: 'networkidle' }); assert.equal(response.status(), 200); report.noHarness = await noHarness();
  for (const filename of assets) {
    const path = filename.replace(/^public\//, ''), response = await context.request.get(new URL(path, entry).href), bytes = await response.body();
    assert.equal(response.status(), 200); assert.equal(sha(bytes), report.sourceHashes[filename]);
    if (mode === 'production') assert.equal(sha(bytes), report.distFiles[path].sha256);
    report.servedFiles.push({ path, sha256: sha(bytes), status: response.status(), matchesNative: true, matchesDist: mode === 'production' });
  }
  for (const [index, which] of ['fresh', 'council', 'virmire'].entries()) await campaignArchives(fixtures[index], which, fleetAtlas, faunaAtlas);
  await chronicleArchives(laterAtlas, faunaAtlas); await noHarness(); await Promise.all(pending.splice(0));
  for (const key of ['errors', 'failedRequests', 'evidenceErrors']) assert.deepEqual(report[key], []);
  for (const error of report.consoleErrors) assert.ok(/Failed to load resource/.test(error.text) && new URL(error.location.url).pathname === '/favicon.ico');
  if (mode === 'production') { assert.deepEqual(report.sourceRequests, []); assert.deepEqual(await tree(new URL('dist/', root)), report.distFiles); }
  for (const [filename, expected] of Object.entries(report.sourceHashes)) assert.equal(sha(await readFile(new URL(filename, root))), expected, `Source changed during run:${filename}`);
  report.sourceFrozen = true; report.distFrozen = mode === 'production'; report.passed = true;
} catch (error) { report.failure = error.stack || String(error); process.exitCode = 1; console.error(report.failure); if (page && !page.isClosed()) await capture('failure').catch(() => {}); }
finally {
  await Promise.all(pending.splice(0)); await context?.close(); await browser?.close(); report.finishedAt = new Date().toISOString();
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify({ passed: report.passed, report: fileURLToPath(reportPath), captures: report.captures.length, checks: report.checks.length, failure: report.failure }));
}
