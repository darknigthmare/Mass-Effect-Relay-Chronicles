// Public controls only. Native fixtures explicitly prepare earlier chapters;
// no private application state, QA harness, clock, HP, DOM or style assignment.
import assert from 'node:assert/strict';
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { newGame, recruit, zoneEncounters, winEncounter, completeZone, encodeSave, decodeSave } from '../src/state.js';
import { recordVisit } from '../src/story.js';
import { WORLD_ZONES } from '../src/world-data.js';

const root = new URL('../', import.meta.url), url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4197/');
const mode = process.env.ADVANCE_DIALOGUES_MODE || 'development', prefix = process.env.ADVANCE_DIALOGUES_PREFIX;
const gitBase = process.env.ADVANCE_BASE_MAIN || 'd2e8432ec4057890b6f86e42ce596f1ab5810148';
assert.ok(['development', 'production'].includes(mode)); assert.equal(url.search, '');
assert.match(prefix || '', /^advance-dialogues-public-[a-z0-9-]+$/); assert.match(gitBase, /^[a-f0-9]{40}$/);
const output = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(output); throw Error('Choose a fresh evidence prefix.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
await mkdir(new URL('docs/qa/', root), { recursive: true }); await mkdir(new URL('docs/screenshots/', root), { recursive: true });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
async function hashes(directory, prefixPath = '') {
  const result = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefixPath + entry.name, target = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) Object.assign(result, await hashes(target, name + '/'));
    else { const bytes = await readFile(target); result[name] = { sha256: sha(bytes), bytes: bytes.length }; }
  }
  return result;
}
async function sources() {
  const entries = await hashes(new URL('src/', root), 'src/');
  const result = Object.fromEntries(Object.entries(entries).filter(([path]) => mode === 'production' || path !== 'src/universe-data.js').map(([path, record]) => [path, record.sha256]));
  for (const path of ['scripts/advance-dialogues-public.mjs', 'tests/advance-dialogues.test.js', 'package.json', 'package-lock.json', 'vite.config.js']) {
    const bytes = await readFile(new URL(path, root)); result[path] = sha(bytes);
  }
  return result;
}
const report = { passed: false, at: new Date().toISOString(), mode, url: url.href, gitBase,
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: fileURLToPath(root), encoding: 'utf8' }).trim(),
  command: { script: 'node scripts/advance-dialogues-public.mjs', environment: { GAME_URL: url.href, ADVANCE_DIALOGUES_PREFIX: prefix, ADVANCE_DIALOGUES_MODE: mode, ADVANCE_BASE_MAIN: gitBase } },
  scope: 'Garrus/Wrex optional recruitment branches; Tali topic codex; Garrus advice persistence; Kaidan L2; Liara stage knowledge. Identical development/production scenarios.',
  sourceHashes: {}, finalSourceHashes: {}, registryContextHashes: {}, finalRegistryContextHashes: {}, distFiles: {}, finalDistFiles: {}, servedFiles: [], sourceRequests: [], deliveryErrors: [],
  fixtures: [], exports: [], captures: [], checks: [], errors: [], consoleErrors: [], failedRequests: [], resourceWarnings: [],
  limitations: ['Preceding chapters, rewards and starting positions are declared native fixtures, not played encounters or walked routes.',
    'Public imports may derive from actual public exports with listed native progression APIs; those added milestones are not presented as earned in this browser.',
    'Recruitment refusals and reports preserve the existing possibility of returning later; no permanent refusal or extra reward is invented.',
    'The general Quarian species entry stays visible at recruitment. The three new cultural/history dossiers each require the matching Tali subject.',
    'Full original dialogue, clinic/Chora’s Den/C-Sec staging, voice, original cinematic acting and artistic fidelity 1:1 remain outside these functional criteria.',
    'No new Fist scene, fate or combat is claimed. Electron/Windows/mobile/controller coverage is not claimed.'] };
const check = name => { report.checks.push({ name, passed: true }); console.log(JSON.stringify({ check: name })); };
let browser, page, favicon404 = false;
const responseChecks = [];
const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
const dialog = (id, step) => page.locator(`.dialogue[data-conversation-id="${id}"]${step ? `[data-current-topic="${step}"]` : ''}`);
const click = async locator => { await locator.waitFor({ state: 'visible' }); assert.equal(await locator.isEnabled(), true); await locator.click(); };
async function ready() { await page.locator('#hud:not(.hidden) .location h2').waitFor(); await page.locator('#transition.active').waitFor({ state: 'hidden' }); await page.locator('#overlay .screen, #overlay .dialogue').waitFor({ state: 'hidden' }); }
async function noHarness() { assert.deepEqual(await page.evaluate(() => ({ own: Object.hasOwn(window, '__RELAY_TEST__'), type: typeof window.__RELAY_TEST__ })), { own: false, type: 'undefined' }); }
async function capture(label) {
  const path = `docs/screenshots/${prefix}-${label}.png`, bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)), animations: 'disabled' });
  report.captures.push({ label, path, sha256: sha(bytes), bytes: bytes.length, source: 'Actual public viewport; no DOM, style or state injection.' });
}
async function fixture(state, label, origin) {
  const bytes = Buffer.from(encodeSave(state)), path = `docs/qa/${prefix}-${label}-fixture.json`; assert.ok(decodeSave(bytes.toString())); await writeFile(new URL(path, root), bytes);
  const record = { path, sha256: sha(bytes), origin, position: state.position, importedViaPublicChooser: false }; report.fixtures.push(record); return { bytes, record };
}
async function imported(value) {
  if (!await action('import').isVisible()) { await ready(); await page.keyboard.press('Escape'); await click(action('quit')); }
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), click(action('import'))]);
  await chooser.setFiles({ name: value.record.path.split('/').at(-1), mimeType: 'application/json', buffer: value.bytes });
  value.record.importedViaPublicChooser = true; await ready(); await noHarness();
}
async function exported(label) {
  await ready(); await page.keyboard.press('Escape'); await click(action('save'));
  const [download] = await Promise.all([page.waitForEvent('download'), click(action('export'))]);
  const path = `docs/qa/${prefix}-${label}-export.json`; await download.saveAs(fileURLToPath(new URL(path, root))); assert.equal(await download.failure(), null);
  const bytes = await readFile(new URL(path, root)), state = decodeSave(bytes.toString()); assert.ok(state);
  report.exports.push({ label, path, sha256: sha(bytes), bytes: bytes.length, recruited: state.recruited, xp: state.xp, credits: state.credits, heard: state.story.heard, storyChoices: state.story.choices, codex: state.story.codex });
  await click(action('close')); await ready(); return { path, sha256: sha(bytes), state };
}
const budget = state => ({ xp: state.xp, credits: state.credits, medigel: state.medigel, paragon: state.paragon, renegade: state.renegade, party: state.party, inventory: state.inventory });
function point(suffix) { const poi = WORLD_ZONES.citadel.pois.find(p => p.id === `citadel:${suffix}`); assert.ok(poi); return { x: poi.x, z: poi.z + .4 }; }
function finish(state, zone, choice) { state.zone = zone; assert.equal(recordVisit(state, zone), true); for (const id of zoneEncounters(zone)) assert.equal(winEncounter(state, id), true); assert.equal(completeZone(state, zone, choice), true); }
async function chooseRecruit(id, step, reply) { await click(dialog(`advance-recruit:${id}`, step).locator(`[data-reply-id="${reply}"]`)); }
async function talk(id) { await ready(); await page.keyboard.press('KeyC'); await click(action('conversation', id)); await dialog(id).waitFor(); }
async function topic(id, topicId) { await click(dialog(id).locator(`[data-topic-id="${topicId}"]`)); await dialog(id, topicId).waitFor(); }
async function back(id) { await click(dialog(id).locator('[data-conversation-back]')); }
async function endTalk(id) { await click(dialog(id).locator('[data-conversation-end]')); await ready(); }
async function codex() { await ready(); await page.keyboard.press('Escape'); await click(action('codex')); }

try {
  report.sourceHashes = await sources();
  for (const path of ['docs/content-catalog.json', 'src/universe-data.js']) report.registryContextHashes[path] = sha(await readFile(new URL(path, root)));
  const collector = await readFile(new URL(import.meta.url)), path = `docs/qa/${prefix}-collector.mjs`; await writeFile(new URL(path, root), collector); report.collectorSnapshot = { path, sha256: sha(collector) };
  if (mode === 'production') { report.distFiles = await hashes(new URL('dist/', root)); assert.ok(report.distFiles['index.html']); }
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true }); page = await context.newPage(); page.setDefaultTimeout(30000);
  if (mode === 'production') await page.route('**/*', async route => { const target = new URL(route.request().url()); if (/^\/(?:src|@vite|@fs)\//.test(target.pathname)) { report.sourceRequests.push(target.href); await route.abort('blockedbyclient'); } else await route.continue(); });
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), reason: request.failure()?.errorText }));
  page.on('response', response => {
    const target = new URL(response.url()); if (target.origin !== url.origin) return;
    if (response.status() >= 400) { if (target.pathname === '/favicon.ico' && response.status() === 404 && response.request().method() === 'GET') { favicon404 = true; report.resourceWarnings.push({ url: target.href, status: 404 }); } else report.deliveryErrors.push({ url: target.href, status: response.status() }); }
    if (mode !== 'production' || response.status() !== 200 || !/\.(?:js|css)$/.test(target.pathname)) return;
    responseChecks.push((async () => { const filename = decodeURIComponent(target.pathname.slice(1)), expected = report.distFiles[filename]; assert.ok(expected, filename); const bytes = await response.body(); assert.equal(sha(bytes), expected.sha256); report.servedFiles.push({ path: filename, bytes: bytes.length, sha256: sha(bytes), matchesDist: true, observedActualBrowserResponse: true }); })().catch(error => report.deliveryErrors.push({ url: target.href, error: String(error) })));
  });
  page.on('console', message => { if (message.type() !== 'error') return; const item = { text: message.text(), location: message.location() }, target = item.location.url ? new URL(item.location.url) : null; if (favicon404 && target?.origin === url.origin && target.pathname === '/favicon.ico' && item.text === 'Failed to load resource: the server responded with a status of 404 (Not Found)') report.resourceWarnings.push(item); else report.consoleErrors.push(item); });
  const entry = await page.goto(url.href, { waitUntil: 'domcontentloaded' }); assert.equal(entry.status(), 200);
  if (mode === 'production') { const bytes = await entry.body(); assert.equal(sha(bytes), report.distFiles['index.html'].sha256); report.servedFiles.push({ path: 'index.html', bytes: bytes.length, sha256: sha(bytes), matchesDist: true, observedActualBrowserResponse: true }); }
  await action('import').waitFor(); await noHarness();
  const start = newGame({ name: 'QA Avance Dialogue', difficulty: 'story' }); start.flags.briefed = true; finish(start, 'eden-prime'); start.zone = 'citadel'; recordVisit(start, start.zone); start.position = point('encounter-1');
  await imported(await fixture(start, 'citadel-garrus', { kind: 'Declared native Eden completion and Citadel position', APIs: ['newGame', 'briefed=true', 'recordVisit', 'winEncounter ×3', 'completeZone(eden-prime)'], precedingCampaignPlayed: false }));
  for (const id of ['garrus', 'wrex']) {
    await ready(); await page.keyboard.press('KeyE'); await dialog(`advance-recruit:${id}`, 'intro').waitFor();
    for (const q of id === 'garrus' ? ['investigation', 'methods'] : ['mercenary', 'interest']) { await chooseRecruit(id, 'intro', q); await chooseRecruit(id, q, 'back'); }
    await chooseRecruit(id, 'intro', 'refuse'); await dialog(`advance-recruit:${id}`, 'refused').waitFor();
    if (id === 'garrus') await capture('garrus-refusal');
    await chooseRecruit(id, 'refused', 'leave'); await ready(); await page.keyboard.press('KeyE'); await chooseRecruit(id, 'intro', 'defer');
    if (id === 'wrex') await capture('wrex-deferral');
    await chooseRecruit(id, 'deferred', 'leave'); await ready(); await page.keyboard.press('KeyE'); await chooseRecruit(id, 'intro', 'accept'); await chooseRecruit(id, 'joined', 'leave');
    const actual = await exported(`${id}-recruited`); assert.equal(actual.state.recruited.filter(value => value === id).length, 1); assert.deepEqual(budget(actual.state), budget(start));
    check(`${id}: two questions, explicit refusal, deferral, return and acceptance keep valid exits and exactly one recruit without resource or squad changes`);
    if (id === 'garrus') { const moved = structuredClone(actual.state); moved.position = point('boss'); await imported(await fixture(moved, 'wrex-position', { kind: 'Position-only transfer from public export', parentExport: actual.path, parentSHA256: actual.sha256, changedFields: ['position'], traversalClaimed: false })); }
    else {
      const state = structuredClone(actual.state); assert.equal(recruit(state, 'tali'), true); assert.equal(completeZone(state, 'citadel'), true); finish(state, 'therum'); state.zone = 'normandy'; state.position = null; recordVisit(state, state.zone);
      await imported(await fixture(state, 'normandy-early-liara', { kind: 'Declared native continuation from actual public export', parentExport: actual.path, parentSHA256: actual.sha256, APIs: ['recruit(tali)', 'completeZone(citadel)', 'Therum recordVisit/winEncounter ×3/completeZone', 'return Normandy'], precedingCampaignPlayed: false }));
    }
  }
  await codex();
  assert.equal(await action('codex-entry', 'quarian').count(), 1);
  for (const id of ['quarian-pilgrimage', 'quarian-flotilla', 'quarian-geth', 'human-l2']) assert.equal(await action('codex-entry', id).count(), 0);
  await click(action('close'));
  for (const topicId of ['pilgrimage', 'flotilla', 'geth']) { await talk('tali'); await topic('tali', topicId); await back('tali'); await endTalk('tali'); }
  await codex(); for (const id of ['quarian-pilgrimage', 'quarian-flotilla', 'quarian-geth']) assert.equal(await action('codex-entry', id).count(), 1);
  await click(action('codex-entry', 'quarian-flotilla')); await capture('tali-flotilla-dossier'); await click(action('close'));
  check('Three Tali subjects each discover their own dossier after reading; the existing species entry stays available before the subjects');
  await talk('kaidan'); await topic('kaidan', 'implants'); const implants = await dialog('kaidan', 'implants').locator('.dialogue-text').innerText(); assert.match(implants, /L2/); assert.match(implants, /migraines/); assert.doesNotMatch(implants, /L3|L4|L5|Lazar|Cerberus/i); await capture('kaidan-l2'); await back('kaidan'); await endTalk('kaidan');
  await talk('garrus'); await topic('garrus', 'procedure'); await click(dialog('garrus', 'procedure').locator('[data-reply-id="procedure"]')); await back('garrus'); await endTalk('garrus');
  await page.reload({ waitUntil: 'domcontentloaded' }); await click(action('continue')); await ready(); await talk('garrus'); await topic('garrus', 'followup'); assert.match(await dialog('garrus', 'followup').locator('.dialogue-text').innerText(), /protéger les innocents/); await capture('garrus-advice-reloaded'); await back('garrus'); await endTalk('garrus');
  await talk('liara'); assert.equal(await dialog('liara').locator('[data-topic-id="cipher"]').count(), 0); assert.equal(await dialog('liara').locator('[data-topic-id="vigil"]').count(), 0); await topic('liara', 'archaeology'); await back('liara'); await endTalk('liara');
  const onboard = await exported('onboard-discoveries'); assert.equal(onboard.state.story.choices['garrus:procedure'], 'procedure'); for (const id of ['human-l2', 'quarian-pilgrimage', 'quarian-flotilla', 'quarian-geth']) assert.ok(onboard.state.story.codex.includes(id));
  check('Kaidan retains L2-only knowledge and Garrus recalls the exact advice after a real reload; Liara initially reveals neither Cipher nor Vigil');
  const middle = structuredClone(onboard.state); finish(middle, 'feros', 'save'); middle.zone = 'normandy'; middle.position = null;
  await imported(await fixture(middle, 'liara-after-feros', { kind: 'Declared native Feros continuation from public export', parentExport: onboard.path, parentSHA256: onboard.sha256, APIs: ['recordVisit(feros)', 'winEncounter ×3', 'completeZone(feros,save)', 'return Normandy'], precedingCampaignPlayed: false }));
  await talk('liara'); assert.equal(await dialog('liara').locator('[data-topic-id="cipher"]').count(), 1); assert.equal(await dialog('liara').locator('[data-topic-id="vigil"]').count(), 0); await topic('liara', 'cipher'); await back('liara'); await endTalk('liara');
  const late = structuredClone(middle); finish(late, 'noveria', 'release'); finish(late, 'virmire', 'save-kaidan'); finish(late, 'ilos'); late.zone = 'normandy'; late.position = null;
  await imported(await fixture(late, 'liara-after-ilos', { kind: 'Declared native later milestones from the Feros fixture (not from an export of the preceding public Cipher reading)', parentFixture: report.fixtures.at(-1).path, APIs: ['Noveria,Virmire,Ilos recordVisit/winEncounter ×3/completeZone', 'return Normandy'], precedingCampaignPlayed: false }));
  await talk('liara'); await topic('liara', 'vigil'); assert.match(await dialog('liara', 'vigil').locator('.dialogue-text').innerText(), /Sur Ilos, Vigil/); await capture('liara-after-vigil'); await back('liara'); await endTalk('liara');
  const final = await exported('liara-vigil-read'); assert.ok(final.state.story.heard.includes('liara:vigil')); assert.equal(final.state.story.choices['garrus:procedure'], 'procedure');
  check('Liara learns Cipher only after Feros and Vigil only after Ilos; final public export preserves advice and the actual Vigil subject');
  await Promise.all(responseChecks); report.finalSourceHashes = await sources(); assert.deepEqual(report.finalSourceHashes, report.sourceHashes); report.sourceFrozen = true;
  for (const path of Object.keys(report.registryContextHashes)) report.finalRegistryContextHashes[path] = sha(await readFile(new URL(path, root)));
  assert.deepEqual(report.finalRegistryContextHashes, report.registryContextHashes); report.registryContextFrozenDuringRun = true;
  if (mode === 'production') { report.finalDistFiles = await hashes(new URL('dist/', root)); assert.deepEqual(report.finalDistFiles, report.distFiles); report.distFrozen = true; assert.deepEqual(report.sourceRequests, []); assert.ok(report.servedFiles.some(file => file.path.endsWith('.js'))); }
  assert.equal(report.captures.length, 6); assert.equal(report.exports.length, 4); assert.equal(report.checks.length, 6);
  for (const field of ['errors', 'consoleErrors', 'failedRequests', 'deliveryErrors']) assert.deepEqual(report[field], []);
  report.passed = true;
} catch (error) { report.failure = error.stack || String(error); process.exitCode = 1; if (page) try { await capture('failure'); } catch {} }
finally { await browser?.close(); report.browserClosed = !!browser; await writeFile(output, JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify({ passed: report.passed, report: fileURLToPath(output), checks: report.checks.length, captures: report.captures.length, exports: report.exports.length, failure: report.failure }));
