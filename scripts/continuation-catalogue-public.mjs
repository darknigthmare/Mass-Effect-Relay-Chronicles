// Current public archive controls and downloaded campaign saves. No QA harness,
// private app state, storage access, DOM rewriting or source-tree duplication.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { newGame, encodeSave, decodeSave } from '../src/state.js';
import { UNIVERSE_WORKS, UNIVERSE_RECORDS } from '../src/universe-data.js';
import { getProductionCatalogueView } from '../src/continuation-catalogue.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const mode = process.env.CONTINUATION_CATALOGUE_MODE || 'development';
assert.ok(['development', 'production'].includes(mode));
const url = new URL(process.env.GAME_URL || `http://127.0.0.1:${mode === 'production' ? 4196 : 4195}/`);
assert.equal(url.search, '');
const prefix = process.env.CONTINUATION_CATALOGUE_PREFIX;
assert.match(prefix || '', /^continuation-catalogue-public-[a-z0-9-]+$/);
const output = `docs/qa/${prefix}-report.json`;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = filename => fs.readFile(path.join(root, filename));
const write = async (filename, bytes) => { try { await fs.access(path.join(root, filename)); throw Error(`Preserve existing output: ${filename}`); } catch (error) { if (error.code !== 'ENOENT') throw error; } await fs.writeFile(path.join(root, filename), bytes); };
try { await fs.access(path.join(root, output)); throw Error('Choose a fresh output prefix.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
await fs.mkdir(path.join(root, 'docs/qa'), { recursive: true }); await fs.mkdir(path.join(root, 'docs/screenshots'), { recursive: true });
const report = {
  passed: false, generatedAt: new Date().toISOString(), baseCommit: '5d933068cacd1b595d584b7cedfffd35b1db362d',
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), mode, url: url.href,
  command: { script: 'node scripts/continuation-catalogue-public.mjs', environment: { GAME_URL: url.href, CONTINUATION_CATALOGUE_MODE: mode, CONTINUATION_CATALOGUE_PREFIX: prefix } },
  scope: 'Public production catalogue and credits: every work, statuses, search, pagination, details, HTTPS references, title/pause return, desktop/mobile layout and unchanged actual exported campaign.',
  sourcePolicy: 'SHA256 map of all current src files, collector and native tests; one exact Git baseline. DEV generated registry is separately frozen execution context; PROD registry is a strict current source. No per-run source snapshots.',
  sourceHashes: {}, registryContextHashes: {}, captures: [], checks: [], fixtures: [], exports: [], layouts: [], workCounts: [], sourceCounts: [], references: [],
  errors: [], consoleErrors: [], failedRequests: [], resourceWarnings: [], sourceRequests: [], distFiles: {}, servedFiles: [],
  limitations: ['The imported campaign is an explicitly declared newGame fixture; no played campaign or acquired rewards are claimed.',
    'Public catalogue entries are documentary records; current statuses do not imply playable original campaigns or artistic/canonical fidelity.',
    'Screenshots show software Chromium viewports, not physical phone, gamepad, Electron or Windows testing. Individual visual review is separate.'],
};
async function tree(directory, target, prefixPath = '') {
  for (const entry of await fs.readdir(path.join(root, directory), { withFileTypes: true })) {
    const filename = path.posix.join(directory, entry.name), relative = path.posix.join(prefixPath, entry.name);
    if (entry.isDirectory()) await tree(filename, target, relative);
    else { const bytes = await read(filename); target[relative] = { bytes: bytes.length, sha256: sha(bytes) }; }
  }
}
const sourceFiles = {}; await tree('src', sourceFiles);
for (const [filename, value] of Object.entries(sourceFiles)) {
  const target = mode === 'development' && filename === 'universe-data.js' ? report.registryContextHashes : report.sourceHashes;
  target[`src/${filename}`] = value.sha256;
}
for (const filename of ['tests/continuation-catalogue.test.js', 'scripts/continuation-catalogue-public.mjs', 'package.json', 'package-lock.json', 'vite.config.js']) report.sourceHashes[filename] = sha(await read(filename));
if (mode === 'production') await tree('dist', report.distFiles);
let browser, page;
const action = name => page.locator(`[data-do="${name}"]`).first();
const check = (name, details = {}) => { report.checks.push({ name, passed: true, ...details }); console.log(JSON.stringify({ check: name })); };
const click = async locator => { await locator.waitFor({ state: 'visible' }); assert.equal(await locator.isEnabled(), true); await locator.click(); };
async function capture(label, selector) {
  if (selector) await page.locator(selector).first().scrollIntoViewIfNeeded();
  const filename = `docs/screenshots/${prefix}-${label}.png`;
  try { await fs.access(path.join(root, filename)); throw Error(`Preserve existing capture: ${filename}`); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const bytes = await page.screenshot({ path: path.join(root, filename), animations: 'disabled' });
  report.captures.push({ label, path: filename, sha256: sha(bytes), bytes: bytes.length, viewport: page.viewportSize(), source: 'Actual public viewport; no injected content.' });
}
async function catalogue() { await page.locator('[data-production-catalogue]').waitFor(); }
async function credits() { await page.locator('[data-production-credits]').waitFor(); }
async function visibleIds() { return page.locator('[data-do="production-record"]').evaluateAll(elements => elements.map(element => element.dataset.id)); }
async function expectResults(filters) {
  const expected = getProductionCatalogueView(filters);
  assert.deepEqual(await visibleIds(), expected.visible.map(record => record.id));
  assert.match(await page.locator('[data-production-count]').innerText(), new RegExp(`^${expected.records.length} fiche`));
  if (expected.selected) assert.equal(await page.locator('[data-production-record]').getAttribute('data-production-record'), expected.selected.id);
  else assert.equal(await page.locator('[data-production-record]').count(), 0);
  return expected;
}
async function references() {
  const links = await page.locator('#overlay a[href]').evaluateAll(elements => elements.map(element => ({ href: element.href, target: element.target, rel: element.rel })));
  for (const link of links) { assert.equal(new URL(link.href).protocol, 'https:'); assert.equal(link.target, '_blank'); assert.match(link.rel, /noopener/); assert.match(link.rel, /noreferrer/); }
  report.references.push(...links); return links;
}
async function layout(label) {
  const result = await page.locator('#overlay .screen').evaluate(element => ({
    documentOverflow: document.documentElement.scrollWidth > innerWidth + 1,
    screenOverflow: element.scrollWidth > element.clientWidth + 1,
    viewport: { width: innerWidth, height: innerHeight },
  }));
  assert.equal(result.documentOverflow, false, label); assert.equal(result.screenOverflow, false, label);
  const controls = page.locator('#overlay .screen button:visible, #overlay .screen select:visible, #overlay .screen input:visible');
  for (let index = 0; index < await controls.count(); index++) {
    await controls.nth(index).scrollIntoViewIfNeeded(); const box = await controls.nth(index).boundingBox();
    assert.ok(box && box.x >= -1 && box.x + box.width <= page.viewportSize().width + 1, `${label}: control ${index}`);
  }
  report.layouts.push({ label, ...result });
}
async function ready() {
  await page.locator('#hud:not(.hidden)').waitFor(); await page.locator('#transition.active').waitFor({ state: 'hidden' });
  await page.locator('#overlay .screen, #overlay .dialogue').waitFor({ state: 'hidden' });
}
async function pause() { await ready(); await page.keyboard.press('Escape'); await page.locator('.pause-screen').waitFor(); }
async function exported(label) {
  const [download] = await Promise.all([page.waitForEvent('download'), click(action('export'))]);
  const bytes = await fs.readFile(await download.path()), filename = `docs/qa/${prefix}-${label}-export.json`;
  await write(filename, bytes); const state = decodeSave(bytes.toString()); assert.ok(state);
  report.exports.push({ label, path: filename, sha256: sha(bytes), bytes: bytes.length }); return state;
}
const stable = state => { const value = structuredClone(state); delete value.playedSeconds; return value; };
try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  report.browser = browser.version(); page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true }); page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('request', request => { if (/\/(?:src\/|@vite\/)/.test(new URL(request.url()).pathname)) report.sourceRequests.push(request.url()); });
  page.on('response', response => { if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) report.failedRequests.push({ url: response.url(), status: response.status() }); });
  page.on('console', message => { if (message.type() === 'error') { const item = { text: message.text(), location: message.location() }; (item.location.url?.endsWith('/favicon.ico') ? report.resourceWarnings : report.consoleErrors).push(item); } });
  const response = await page.goto(url.href, { waitUntil: 'networkidle' }); assert.equal(response.status(), 200);
  assert.equal(await page.evaluate(() => Object.hasOwn(window, '__RELAY_TEST__')), false);
  if (mode === 'production') {
    assert.equal(sha(await response.body()), report.distFiles['index.html'].sha256);
    for (const match of (await response.text()).matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))"/g)) {
      const target = new URL(match[1], url), filename = target.pathname.slice(1), loaded = await page.request.get(target.href);
      assert.equal(loaded.status(), 200); assert.equal(sha(await loaded.body()), report.distFiles[filename].sha256);
      report.servedFiles.push({ path: filename, sha256: report.distFiles[filename].sha256, matchesDist: true });
    }
  }
  await click(action('production-catalogue')); await catalogue(); await expectResults({});
  assert.deepEqual(await page.locator('#production-work option').evaluateAll(elements => elements.map(element => element.value)), ['all', ...UNIVERSE_WORKS.map(work => work.id)]);
  assert.match(await page.locator('[data-production-catalogue]').innerText(), /livrables distincts/);
  await capture('desktop-title-catalogue', '[data-production-catalogue]');
  for (const work of UNIVERSE_WORKS) {
    await page.locator('#production-work').selectOption(work.id); const result = await expectResults({ workId: work.id });
    report.workCounts.push({ id: work.id, records: result.records.length });
  }
  await page.locator('#production-work').selectOption('all');
  for (const status of ['Défini', 'Prototype', 'Intégré', 'Validé']) {
    await page.locator('#production-status').selectOption(status); await expectResults({ status });
  }
  await page.locator('#production-status').selectOption('');
  await click(page.locator('[data-do="production-page"][data-id="1"]')); await expectResults({ page: 1 });
  await click(page.locator('[data-do="production-page"][data-id="0"]')); await expectResults({ page: 0 });
  const second = UNIVERSE_RECORDS[1]; await click(page.locator(`[data-do="production-record"][data-id="${second.id}"]`));
  assert.equal(await page.locator('[data-production-record]').getAttribute('data-production-record'), second.id);
  await references();
  await page.locator('#production-search').fill('FÉROS'); await expectResults({ query: 'FÉROS' });
  await page.locator('#production-search').fill(''); await page.locator('#production-work').selectOption('ME2');
  await page.locator('#production-status').selectOption('Défini'); await page.locator('#production-search').fill('Miranda');
  await expectResults({ workId: 'ME2', status: 'Défini', query: 'Miranda' }); await references();
  await capture('desktop-filtered-detail', '[data-production-record]');
  await page.locator('#production-search').fill('NO-SUCH-RECORD-782734');
  await expectResults({ workId: 'ME2', status: 'Défini', query: 'NO-SUCH-RECORD-782734' });
  await capture('desktop-empty-search', '#production-results');
  check('All 28 works, all statuses, combined French search, empty results, both page directions and selected detail match the current registry');
  await click(action('credits')); await credits();
  for (const work of UNIVERSE_WORKS) {
    await page.locator('#production-source-work').selectOption(work.id);
    assert.match(await page.locator('[data-production-source-count]').innerText(), new RegExp(`^${work.sources.length} références`));
    assert.equal(await page.locator('.production-source').count(), work.sources.length);
    const links = await references(); report.sourceCounts.push({ workId: work.id, sources: work.sources.length, links: links.length });
  }
  await page.locator('#production-source-work').selectOption('ME1');
  const creditsText = await page.locator('[data-production-credits]').innerText();
  for (const phrase of ['Campagne ME1', 'Chroniques', 'Simulation', 'non officielle', 'validation artistique en cours']) assert.ok(creditsText.includes(phrase));
  await capture('desktop-credits-sources', '[data-production-credits]');
  await click(action('production-back')); await page.locator('.title-screen').waitFor();
  check('Every work exposes its actual source cards through safe HTTPS links; credits distinguish fan adaptation, documentary content and experiments and return to title');

  const fixture = newGame({ name: 'Catalogue Continuation', origin: 'colonist', classId: 'sentinel', difficulty: 'story' });
  fixture.settings.sound = false; fixture.settings.reducedMotion = true;
  const fixtureBytes = Buffer.from(encodeSave(fixture)), fixturePath = `docs/qa/${prefix}-campaign-fixture.json`;
  await write(fixturePath, fixtureBytes); report.fixtures.push({ path: fixturePath, sha256: sha(fixtureBytes), source: 'Native newGame fixture; no earned content, travel, XP or credits added.' });
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), click(action('import'))]);
  await chooser.setFiles({ name: 'campaign-fixture.json', mimeType: 'application/json', buffer: fixtureBytes });
  await pause(); const before = await exported('before-archive');
  await click(action('production-catalogue')); await catalogue();
  await page.locator('#production-work').selectOption('ME1'); await page.locator('#production-status').selectOption(''); await page.locator('#production-search').fill('SYS-catalogue-de-production');
  await expectResults({ workId: 'ME1', query: 'SYS-catalogue-de-production' });
  assert.match(await page.locator('[data-production-record]').innerText(), /ne débloque aucun contenu/);
  await capture('desktop-pause-catalogue', '[data-production-record]');
  await click(action('credits')); await credits(); await click(action('production-back')); await page.locator('.pause-screen').waitFor();
  const after = await exported('after-desktop-archive'); assert.deepEqual(stable(after), stable(before));
  check('Title and pause open the same documentary catalogue; return from cross-linked credits restores pause, and actual campaign exports show no content or resource mutation');

  await page.setViewportSize({ width: 390, height: 844 });
  await click(action('production-catalogue')); await catalogue();
  await page.locator('#production-search').fill(''); await layout('mobile-catalogue');
  await capture('mobile-catalogue-filters', '#production-work');
  await page.locator('#production-search').fill('SYS-catalogue-de-production'); await expectResults({ workId: 'ME1', query: 'SYS-catalogue-de-production' });
  await layout('mobile-detail'); await capture('mobile-record-detail', '[data-production-record]');
  await click(action('credits')); await credits(); await page.locator('#production-source-work').selectOption('ME2');
  await layout('mobile-credits'); await capture('mobile-credits', '[data-production-credits]');
  await references(); await click(action('production-back')); await page.locator('.pause-screen').waitFor();
  const mobile = await exported('after-mobile-archive'); assert.deepEqual(stable(mobile), stable(before));
  await click(action('quit')); await page.locator('.title-screen').waitFor();
  await click(action('production-catalogue')); await catalogue(); await click(action('production-back')); await page.locator('.title-screen').waitFor();
  check('390×844 catalogue, detail and credits expose reachable controls without horizontal overflow, preserve the exported campaign, and retain the correct title/pause return destination');
  for (const [filename, expected] of Object.entries(report.sourceHashes)) assert.equal(sha(await read(filename)), expected, `Source changed during run: ${filename}`);
  for (const [filename, expected] of Object.entries(report.registryContextHashes)) assert.equal(sha(await read(filename)), expected, `Registry execution context changed during run: ${filename}`);
  report.registryContextVerified = true;
  if (mode === 'production') {
    const loadedAssets = await page.evaluate(() => [...new Set(performance.getEntriesByType('resource')
      .map(entry => new URL(entry.name)).filter(target => target.origin === location.origin && /\.(?:js|css)$/.test(target.pathname))
      .map(target => target.pathname.slice(1)))]);
    for (const filename of loadedAssets) {
      assert.ok(report.distFiles[filename], `Loaded file absent from compiled distribution: ${filename}`);
      const loaded = await page.request.get(new URL(filename, url).href);
      assert.equal(loaded.status(), 200); assert.equal(sha(await loaded.body()), report.distFiles[filename].sha256);
      if (!report.servedFiles.some(item => item.path === filename)) report.servedFiles.push({ path: filename, sha256: report.distFiles[filename].sha256, matchesDist: true });
    }
    const finalDist = {}; await tree('dist', finalDist); assert.deepEqual(finalDist, report.distFiles); report.distFrozen = true;
    assert.deepEqual(report.sourceRequests, []);
  }
  assert.deepEqual(report.errors, []); assert.deepEqual(report.consoleErrors, []); assert.deepEqual(report.failedRequests, []);
  assert.equal(report.captures.length, 8); report.passed = true;
} catch (error) {
  report.failure = error.stack || String(error); process.exitCode = 1;
  if (page) try { await capture('failure'); } catch {}
} finally { await browser?.close(); report.browserClosed = !!browser; await write(output, JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify({ passed: report.passed, report: output, captures: report.captures.length, checks: report.checks.length, exports: report.exports.length, failure: report.failure }));
