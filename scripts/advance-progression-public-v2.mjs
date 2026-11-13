// Public controls and declared native fixtures only. No private application
// state, QA harness, DOM/style rewriting, clock, ATB or HP injection.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { encodeSave, decodeSave, confirmCampaignBriefing, travelCampaign, winEncounter, recruit, zoneEncounters } from '../src/state.js';
import { MISSION_DEFINITIONS } from '../src/mission-progress.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { CHAPTERS } from '../src/game-data.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const mode = process.env.ADVANCE_MODE || 'development';
assert.ok(['development', 'production'].includes(mode));
const prefix = process.env.ADVANCE_PREFIX;
assert.match(prefix || '', /^advance-progression-public-[a-z0-9-]+$/);
const url = new URL(process.env.GAME_URL || `http://127.0.0.1:${mode === 'production' ? 4198 : 4197}/`);
assert.equal(url.search, '');
const baseCommit = process.env.ADVANCE_BASE_MAIN || 'd2e8432ec4057890b6f86e42ce596f1ab5810148';
assert.match(baseCommit, /^[a-f0-9]{40}$/);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = filename => fs.readFile(path.join(root, filename));
const fresh = async filename => { try { await fs.access(path.join(root, filename)); throw Error(`Preserve prior proof: ${filename}`); } catch (error) { if (error.code !== 'ENOENT') throw error; } };
const write = async (filename, bytes) => { await fresh(filename); await fs.writeFile(path.join(root, filename), bytes); };
const output = `docs/qa/${prefix}-report.json`;
await fresh(output);
await fs.mkdir(path.join(root, 'docs/qa'), { recursive: true });
await fs.mkdir(path.join(root, 'docs/screenshots'), { recursive: true });

const report = {
  passed: false, generatedAt: new Date().toISOString(), baseCommit,
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  mode, url: url.href,
  command: { script: 'node scripts/advance-progression-public-v2.mjs', environment: { GAME_URL: url.href, ADVANCE_MODE: mode, ADVANCE_PREFIX: prefix, ADVANCE_BASE_MAIN: baseCommit } },
  supersedes: { report: 'docs/qa/advance-progression-public-dev-01-report.json',
    reportSHA256: sha(await read('docs/qa/advance-progression-public-dev-01-report.json')),
    collector: 'scripts/advance-progression-public.mjs', collectorSHA256: sha(await read('scripts/advance-progression-public.mjs')),
    reason: 'DEV01 stopped on a CSS uppercase innerText comparison; V2 reads raw textContent and accepts the current Noveria spelling. Product and native tests are unchanged.' },
  scope: 'Public dossier creation, persistent campaign tracking, actual briefing/deployment, beacon contact/extraction, Council nomination/passation, and free first investigation.',
  sourceHashes: {}, finalSourceHashes: {}, registryContextHashes: { before: {}, after: {} },
  distFiles: {}, finalDistFiles: {}, distFrozen: false, servedFiles: [], sourceRequests: [],
  fixtures: [], exports: [], captures: [], checks: [], errors: [], consoleErrors: [], failedRequests: [], resourceWarnings: [], responses: [],
  limitations: [
    'The initial dossier is created with public controls. One declared position-only transfer from its real export approaches Anderson; no walked route is claimed.',
    'The beacon fixture prepares the three existing combat victories and the four neutralized charges through declared native data; those combats and disarmings are not presented as played.',
    'The Council fixture derives from the real extracted save and prepares Citadel arrival plus Tali recruitment through named native APIs. The Council, passation and first investigation use real public choices.',
    'Unity, medi-gel, all three possible first investigations, invalid save boundaries and double validation are covered by separate native tests.',
    'Textual scenes, combat encounters and maps are French ATB adaptations. Original cinematics, full dialogue, canonical framing, physical controller/mobile and Electron/Windows are not certified.',
    'Screenshots require a separate actual image review; collection alone is not a visual acceptance result.',
  ],
};
async function tree(directory, target) {
  for (const entry of await fs.readdir(path.join(root, directory), { withFileTypes: true })) {
    const filename = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) await tree(filename, target);
    else { const bytes = await read(filename); target[filename] = { sha256: sha(bytes), bytes: bytes.length }; }
  }
}
async function sourceHashes() {
  const all = {}; await tree('src', all);
  const result = {};
  for (const [filename, value] of Object.entries(all)) if (!(mode === 'development' && filename === 'src/universe-data.js')) result[filename] = value.sha256;
  for (const filename of ['tests/advance-progression.test.js', 'tests/state.test.js', 'scripts/advance-progression-public.mjs', 'scripts/advance-progression-public-v2.mjs', 'package.json', 'package-lock.json', 'vite.config.js']) result[filename] = sha(await read(filename));
  return result;
}
async function registryHashes() {
  return Object.fromEntries(await Promise.all(['docs/content-catalog.json', 'src/universe-data.js'].map(async filename => [filename, sha(await read(filename))])));
}
let browser, page;
const responseTasks = [];
const action = name => page.locator(`[data-do="${name}"]`).first();
const milestone = id => page.locator(`[data-campaign-milestone="${id}"]`);
const check = (name, details = {}) => { report.checks.push({ name, passed: true, ...details }); console.log(JSON.stringify({ check: name })); };
const click = async locator => { await locator.waitFor({ state: 'visible' }); assert.equal(await locator.isEnabled(), true); await locator.click(); };
async function terrain() {
  await page.locator('#hud:not(.hidden) .location h2').waitFor();
  await page.locator('#transition.active').waitFor({ state: 'hidden' });
  await page.locator('#overlay .screen, #overlay .dialogue').waitFor({ state: 'hidden' });
}
async function noHarness() {
  const result = await page.evaluate(() => ({ own: Object.hasOwn(window, '__RELAY_TEST__'), type: typeof window.__RELAY_TEST__ }));
  assert.deepEqual(result, { own: false, type: 'undefined' });
}
async function capture(label, selector) {
  if (selector) await page.locator(selector).first().scrollIntoViewIfNeeded();
  const filename = `docs/screenshots/${prefix}-${label}.png`; await fresh(filename);
  const bytes = await page.screenshot({ path: path.join(root, filename) });
  report.captures.push({ label, path: filename, sha256: sha(bytes), bytes: bytes.length, viewport: page.viewportSize(), source: 'Actual public viewport; no injected content.' });
}
async function journal() { await terrain(); await page.keyboard.press('KeyJ'); await page.locator('[aria-label="Journal de mission"]').waitFor(); }
async function closeMenu() { await click(action('close')); await terrain(); }
async function quit() { await terrain(); await page.keyboard.press('Escape'); await click(action('quit')); await action('import').waitFor(); }
async function reloadContinue() { await quit(); await page.reload({ waitUntil: 'domcontentloaded' }); await click(action('continue')); await terrain(); await noHarness(); }
async function fixture(state, label, origin) {
  const bytes = Buffer.from(encodeSave(state)); assert.ok(decodeSave(bytes.toString()));
  const filename = `docs/qa/${prefix}-${label}-fixture.json`; await write(filename, bytes);
  const record = { path: filename, sha256: sha(bytes), origin, importedViaPublicChooser: false }; report.fixtures.push(record);
  return { bytes, record };
}
async function imported(value) {
  if (!await action('import').isVisible()) await quit();
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), click(action('import'))]);
  await chooser.setFiles({ name: path.basename(value.record.path), mimeType: 'application/json', buffer: value.bytes });
  value.record.importedViaPublicChooser = true; await terrain(); await noHarness();
}
async function exported(label) {
  await terrain(); await page.keyboard.press('Escape'); await click(action('save'));
  const [download] = await Promise.all([page.waitForEvent('download'), click(action('export'))]);
  const filename = `docs/qa/${prefix}-${label}-export.json`; await fresh(filename);
  await download.saveAs(path.join(root, filename)); assert.equal(await download.failure(), null);
  const bytes = await read(filename), state = decodeSave(bytes.toString()); assert.ok(state);
  report.exports.push({ label, path: filename, sha256: sha(bytes), bytes: bytes.length,
    zone: state.zone, position: state.position, campaignProgress: state.campaignProgress,
    xp: state.xp, credits: state.credits, party: state.party, flags: state.flags, completed: state.completed });
  await closeMenu(); return { path: filename, sha256: sha(bytes), state };
}
const point = (zone, suffix) => {
  const poi = WORLD_ZONES[zone].pois.find(item => item.id === `${zone}:${suffix}`); assert.ok(poi);
  return { x: poi.x, z: poi.z + .4 };
};
async function choose(id, step, reply) {
  const dialogue = page.locator(`.dialogue[data-conversation-id="campaign:${id}"][data-current-topic="${step}"]`);
  await dialogue.waitFor(); await click(dialogue.locator(`[data-reply-id="${reply}"]`));
}
try {
  report.sourceHashes = await sourceHashes(); report.registryContextHashes.before = await registryHashes();
  if (mode === 'production') await tree('dist', report.distFiles);
  browser = await chromium.launch({ headless: true,
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  page = await browser.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true }); page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), reason: request.failure()?.errorText }));
  page.on('request', request => { const pathname = new URL(request.url()).pathname;
    if (mode === 'production' && (/\/src\//.test(pathname) || /\/@vite\//.test(pathname))) report.sourceRequests.push(request.url()); });
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const item = { text: message.text(), location: message.location() };
    if (item.text === 'Failed to load resource: the server responded with a status of 404 (Not Found)'
      && new URL(item.location.url || url.href).pathname === '/favicon.ico') report.resourceWarnings.push(item);
    else report.consoleErrors.push(item);
  });
  page.on('response', response => { responseTasks.push((async () => {
    const parsed = new URL(response.url()); if (parsed.origin !== url.origin) return;
    report.responses.push({ url: response.url(), status: response.status() });
    if (mode !== 'production' || response.status() !== 200) return;
    const relative = decodeURIComponent(parsed.pathname).replace(/^\//, '') || 'index.html';
    const filename = `dist/${relative}`, expected = report.distFiles[filename]; if (!expected) return;
    const bytes = await response.body(); assert.equal(sha(bytes), expected.sha256, `HTTP bytes ${filename}`);
    report.servedFiles.push({ path: filename, url: response.url(), sha256: sha(bytes), bytes: bytes.length });
  })().catch(error => { report.errors.push(`HTTP proof: ${error.message}`); })); });
  await page.goto(url.href, { waitUntil: 'networkidle' }); await noHarness();
  await click(action('new')); await page.locator('#commander-name').fill('Ari Advance');
  await page.locator('#new-appearance').selectOption('female'); await page.locator('#new-origin').selectOption('colonist');
  await page.locator('#new-profile').selectOption('war-hero'); await click(page.locator('[data-do="class"][data-id="adept"]'));
  await page.locator('#new-difficulty').selectOption('story'); await click(action('begin'));
  await click(page.locator('.dialogue [data-do="dialogue-choice"]').first()); await terrain();
  await journal(); await click(milestone('QST-briefing-normandy').locator('[data-do="track-campaign"]')); await closeMenu();
  assert.match(await page.locator('.mission-chip p').textContent(), /Briefing du Normandy/);
  const initial = await exported('dossier-tracked');
  assert.equal(initial.state.name, 'Ari Advance'); assert.equal(initial.state.appearance, 'female'); assert.equal(initial.state.origin, 'colonist');
  assert.equal(initial.state.psychologicalProfile, 'war-hero'); assert.equal(initial.state.classId, 'adept');
  assert.equal(initial.state.campaignProgress.trackedMilestone, 'QST-briefing-normandy');
  assert.deepEqual(initial.state.party, ['shepard', 'kaidan', 'jenkins']); assert.equal(initial.state.flags.briefed, undefined);
  await reloadContinue(); assert.match(await page.locator('.mission-chip p').textContent(), /Briefing du Normandy/);
  await journal(); assert.match(await milestone('QST-profil-de-shepard').textContent(), /Ari Advance.*Féminine.*Colon.*Héros de guerre.*Adepte/);
  assert.match(await milestone('QST-briefing-normandy').textContent(), /Arrêter le suivi/i);
  await capture('01-dossier-tracking-reloaded', '[data-campaign-milestone="QST-briefing-normandy"]'); await closeMenu();
  check('Publicly selected dossier and tracked briefing persist through title, browser reload and Continue');

  const briefing = structuredClone(initial.state); briefing.position = point('normandy', 'briefing');
  const omitPosition = state => { const result = structuredClone(state); delete result.position; return result; };
  assert.deepEqual(omitPosition(briefing), omitPosition(initial.state));
  await imported(await fixture(briefing, 'briefing-position', { kind: 'Position-only transfer from actual public export', parentExport: initial.path, parentSHA256: initial.sha256,
    changedFields: [{ path: 'position', before: initial.state.position, after: briefing.position }], traversalClaimed: false }));
  await page.keyboard.press('KeyE'); await choose('briefing', 'intro', 'practical'); await choose('briefing', 'practical', 'questions');
  await choose('briefing', 'questions', 'ready'); await choose('briefing', 'ready', 'deploy');
  await page.locator('[data-destination="eden-prime"]').waitFor(); await click(page.locator('[data-do="travel"][data-id="eden-prime"]')); await terrain();
  assert.match(await page.locator('.explore-party').textContent(), /Ari Advance.*Kaidan.*Jenkins/s);
  await capture('02-eden-temporary-party');
  await journal(); assert.equal(await milestone('QST-deploiement-eden-prime').getAttribute('data-campaign-status'), 'complete');
  assert.equal(await milestone('QST-briefing-normandy').getAttribute('data-campaign-status'), 'complete'); await closeMenu();
  check('Actual final briefing confirmation and galactic departure preserve the temporary team and complete the deployment tracking');

  const beacon = structuredClone(briefing); assert.equal(confirmCampaignBriefing(beacon).ok, true); assert.equal(travelCampaign(beacon, 'eden-prime').ok, true);
  for (const id of zoneEncounters('eden-prime')) assert.equal(winEncounter(beacon, id), true);
  beacon.missionProgress.records['eden-prime'] = { status: 'complete', steps: MISSION_DEFINITIONS['eden-prime'].steps.map(step => step.id), remaining: 280, attempts: 1, channel: null };
  beacon.position = point('eden-prime', 'objective');
  await imported(await fixture(beacon, 'beacon-ready', { kind: 'Declared native prerequisite fixture',
    prepared: ['travelCampaign Eden Prime', 'three winEncounter victories', 'four charges already neutralized; 280 seconds retained'],
    contactPlayed: false, extractionPlayed: false, traversalClaimed: false }));
  await page.keyboard.press('KeyE'); await page.locator('.dialogue').waitFor();
  assert.match(await page.locator('.dialogue-text').textContent(), /balise.*contact de Shepard/s);
  await capture('03-beacon-contact-report');
  await click(page.getByRole('button', { name: 'Retourner au Normandy.', exact: true })); await terrain();
  const extracted = await exported('beacon-returned');
  assert.equal(extracted.state.campaignProgress.beaconReturned, true); assert.equal(extracted.state.zone, 'normandy');
  assert.equal(extracted.state.xp, beacon.xp + CHAPTERS['eden-prime'].reward); assert.equal(extracted.state.credits, beacon.credits + 180);
  assert.equal(extracted.state.logs.filter(log => log.title === 'Vision de la balise').length, 1);
  await reloadContinue(); const returned = await exported('beacon-returned-reloaded');
  for (const key of ['party', 'lost', 'completed', 'flags', 'xp', 'credits', 'medigel', 'campaignProgress']) assert.deepEqual(returned.state[key], extracted.state[key]);
  assert.deepEqual(returned.state.position, extracted.state.position);
  assert.equal(returned.state.logs.filter(log => log.title === 'Vision de la balise').length, 1);
  await journal(); assert.equal(await milestone('QST-vision-de-la-balise').getAttribute('data-campaign-status'), 'complete');
  await capture('04-beacon-extraction-reloaded', '[data-campaign-milestone="QST-vision-de-la-balise"]'); await closeMenu();
  check('One actual beacon contact rewards once; actual extraction receipt, squad, objective and safe Normandy position survive reload', { beforeXP: beacon.xp, afterXP: extracted.state.xp });

  const council = structuredClone(returned.state); assert.equal(travelCampaign(council, 'citadel').ok, true); assert.equal(recruit(council, 'tali'), true);
  council.position = point('citadel', 'objective');
  await imported(await fixture(council, 'council-evidence', { kind: 'Native Citadel arrival and Tali recruitment prepared from actual public extracted export',
    parentExport: returned.path, parentSHA256: returned.sha256, prepared: ['travelCampaign Citadel', 'recruit Tali'],
    nominationPlayed: false, passationPlayed: false, traversalClaimed: false }));
  await page.keyboard.press('KeyE'); await choose('investiture', 'intro', 'continue'); await choose('investiture', 'verdict', 'duty');
  await choose('investiture', 'duty', 'continue'); await choose('investiture', 'handoff', 'orders'); await choose('investiture', 'orders', 'back');
  await choose('investiture', 'handoff', 'ready'); await choose('investiture', 'ready', 'finish');
  await click(page.getByRole('button', { name: 'Retourner au Normandy.', exact: true })); await terrain(); await page.keyboard.press('KeyG');
  for (const route of ['therum', 'feros', 'noveria']) {
    await click(page.locator(`[data-do="planet"][data-id="${route}"]`).first());
    assert.equal(await page.locator(`[data-destination="${route}"]`).getAttribute('data-access'), 'available');
    assert.equal(await page.locator(`[data-do="travel"][data-id="${route}"]`).isEnabled(), true);
  }
  await capture('05-three-investigations-free');
  await click(page.locator('[data-do="travel"][data-id="noveria"]')); await terrain();
  const command = await exported('first-investigation-noveria');
  assert.equal(command.state.flags.spectre, true); assert.ok(command.state.completed.includes('citadel'));
  assert.equal(command.state.campaignProgress.commandDestination, 'noveria');
  assert.equal(command.state.xp, council.xp + CHAPTERS.citadel.reward); assert.equal(command.state.credits, council.credits + 180);
  assert.equal(command.state.logs.filter(log => log.title === 'Commandement du Normandy').length, 1);
  await reloadContinue(); await journal(); assert.equal(await milestone('QST-commandement-du-normandy').getAttribute('data-campaign-status'), 'complete');
  assert.match(await milestone('QST-commandement-du-normandy').textContent(), /Nov[ée]ria/i);
  await capture('06-command-first-choice-reloaded', '[data-campaign-milestone="QST-commandement-du-normandy"]'); await closeMenu();
  check('Actual Council nomination/passation opens all three routes; choosing Novéria first persists without a travel reward');

  await noHarness(); assert.equal(report.captures.length, 6); assert.equal(report.exports.length, 4);
  await Promise.all(responseTasks);
  report.finalSourceHashes = await sourceHashes(); report.registryContextHashes.after = await registryHashes();
  assert.deepEqual(report.finalSourceHashes, report.sourceHashes); report.sourceFrozen = true;
  assert.deepEqual(report.registryContextHashes.after, report.registryContextHashes.before); report.registryContextFrozenDuringRun = true;
  assert.deepEqual(report.errors, []); assert.deepEqual(report.consoleErrors, []); assert.deepEqual(report.failedRequests, []); assert.deepEqual(report.sourceRequests, []);
  assert.deepEqual(report.responses.filter(response => response.status >= 400 && !(response.status === 404 && new URL(response.url).pathname === '/favicon.ico')), []);
  if (mode === 'production') {
    await tree('dist', report.finalDistFiles); assert.deepEqual(report.finalDistFiles, report.distFiles); report.distFrozen = true;
    assert.ok(report.servedFiles.some(file => /\.js$/.test(file.path)), 'The real compiled JavaScript must have been loaded and hashed over HTTP.');
  }
  report.passed = true;
} catch (error) { report.failure = error.stack || String(error); console.error(report.failure); process.exitCode = 1; }
finally {
  if (browser) await browser.close();
  await Promise.allSettled(responseTasks);
  if (!Object.keys(report.finalSourceHashes).length) report.finalSourceHashes = await sourceHashes();
  if (!Object.keys(report.registryContextHashes.after).length) report.registryContextHashes.after = await registryHashes();
  await write(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ output, passed: report.passed, checks: report.checks.length, captures: report.captures.length, exports: report.exports.length }));
}
