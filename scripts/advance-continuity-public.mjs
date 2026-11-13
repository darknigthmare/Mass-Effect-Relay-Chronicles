// One public DEV/production journey: declared native fixtures, real file choosers,
// downloads and menus. Page evaluation only reads public DOM/storage/global absence.
import assert from 'node:assert/strict';
import { readFile, writeFile, readdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { newGame, encodeSave, decodeSave, winEncounter, zoneEncounters, completeZone, recruit } from '../src/state.js';
import { encodeCampaignExport, decodeCampaignExport } from '../src/completion-persistence-campaign.js';
import { readTopic } from '../src/story.js';
import { FEROS_COLONIST_TARGETS, listAdvanceFerosPOIs, transitionAdvanceFeros, ferosColonyReport } from '../src/advance-feros.js';
import { decodeChronicle } from '../src/chronicles.js';

const root = new URL('../', import.meta.url), mode = process.env.ADVANCE_CONTINUITY_MODE || 'development';
const prefix = process.env.ADVANCE_CONTINUITY_PREFIX, endpoint = new URL(process.env.GAME_URL || 'http://127.0.0.1:4197/');
const publicFerosSavePath = process.env.ADVANCE_FEROS_PUBLIC_SAVE;
assert.ok(['development', 'production'].includes(mode)); assert.match(prefix || '', /^advance-continuity-[a-z0-9-]+$/); assert.equal(endpoint.search, '');
assert.match(publicFerosSavePath || '', /^docs\/qa\/advance-feros-public-[a-z0-9-]+-shiala-spared-export\.json$/);
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: fileURLToPath(root), encoding: 'utf8' }).trim();
assert.equal(process.env.EXPECTED_SOURCE_SHA, revision, 'Declare the exact source revision in EXPECTED_SOURCE_SHA.');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const reportFile = new URL(`docs/qa/${prefix}-report.json`, root);
const collectorPath = `docs/qa/${prefix}-collector.mjs`;
for (const path of [reportFile, new URL(collectorPath, root)]) {
  try { await access(path); throw Error('Preserve earlier attempts: choose a new prefix.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
const report = { passed: false, at: new Date().toISOString(), mode, url: endpoint.href, sourceSHA: revision,
  command: { script: 'node scripts/advance-continuity-public.mjs', environment: { GAME_URL: endpoint.href, ADVANCE_CONTINUITY_MODE: mode, ADVANCE_CONTINUITY_PREFIX: prefix, EXPECTED_SOURCE_SHA: revision, ADVANCE_FEROS_PUBLIC_SAVE: publicFerosSavePath } },
  scope: 'Real UI ME1 ending report export, isolated ME2 opening/main and ME3 documentary imports, malformed refusal, SR1/SR2 periods, survivor/relations, Chronicle export/import/save/browser reload.',
  inputMethod: 'Pointer/menu controls and native file chooser/download. Read-only public DOM and storage bytes; no private state, QA harness, clock, DOM or style changes.',
  fixtures: [], captures: [], exports: [], observations: [], checks: [], errors: [], consoleErrors: [], warnings: [], failedRequests: [], sourceRequests: [], servedFiles: [], sourceHashes: {}, registryContextHashes: {}, parentPublicInputs: {}, distFiles: {},
  limitations: ['The first ending fixture preserves the sixteen methods and Shiala fate from the linked actual public Feros export. Only the remaining campaign stages are completed natively before this browser; no full campaign playthrough is claimed.',
    'The first ending report is exported through the UI. The second survivor/Shiala variant is a wholly native declared campaign-export fixture.',
    'A documentary dossier grants no mission, actor, power, romance or ME3 trust state. No ME2/ME3 campaign completion or artistic fidelity is certified.'] };
const pending = [], served = new Set(); let browser, page;
const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
const click = async locator => { await locator.waitFor({ state: 'visible' }); assert.equal(await locator.isEnabled(), true); await locator.click(); };
const check = name => { report.checks.push({ name, passed: true }); console.log(JSON.stringify({ check: name })); };
async function tree(directory, path = '') {
  const files = {};
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const relative = path + item.name, url = new URL(item.name + (item.isDirectory() ? '/' : ''), directory);
    if (item.isDirectory()) Object.assign(files, await tree(url, relative + '/'));
    else { const bytes = await readFile(url); files[relative] = { bytes: bytes.length, sha256: sha(bytes) }; }
  }
  return files;
}
async function sourceHashes() {
  const hashes = Object.fromEntries(Object.entries(await tree(new URL('src/', root))).map(([path, entry]) => [`src/${path}`, entry.sha256]));
  for (const path of ['scripts/advance-continuity-public.mjs', 'package.json', 'package-lock.json', 'docs/content-catalog.json', 'docs/universe/catalogs/ME2.json', 'docs/universe/catalogs/ME3.json']) hashes[path] = sha(await readFile(new URL(path, root)));
  if (mode === 'development') for (const path of ['src/universe-data.js', 'docs/content-catalog.json']) delete hashes[path];
  return hashes;
}
async function registryContextHashes() {
  return Object.fromEntries(await Promise.all(['docs/content-catalog.json', 'src/universe-data.js'].map(async path => [path, sha(await readFile(new URL(path, root)))])));
}
function fixture(survivor) {
  const state = newGame({ name: survivor === 'kaidan' ? 'Héritage Kaidan' : 'Héritage Ashley', classId: 'sentinel', appearance: 'female', origin: 'colonist', psychologicalProfile: 'war-hero' });
  state.flags.briefed = true;
  for (const [zone, choice] of [['eden-prime'], ['citadel'], ['therum'], ['feros', 'save'], ['noveria', 'release'], ['virmire', `save-${survivor}`], ['ilos'], ['citadel-finale', 'save-council']]) {
    state.zone = zone; state.position = null;
    if (zone === 'citadel') for (const id of ['tali', 'garrus', 'wrex']) assert.equal(recruit(state, id), true);
    else if (zone === 'feros') {
      const act = (key, choice) => {
        const id = `advance:feros:${key}`, poi = listAdvanceFerosPOIs(state).find(item => item.id === id); assert.ok(poi, key);
        state.position = { x: poi.x, z: poi.z }; const result = transitionAdvanceFeros(state, id, choice); assert.equal(result.ok, true, result.reason); state.advanceFeros = result.progress;
      };
      assert.equal(winEncounter(state, 'feros:encounter-1'), true); act('defense', 'coordinate'); act('lizbeth', 'listen');
      assert.equal(winEncounter(state, 'feros:encounter-2'), true); act('investigation', 'research');
      for (const index of [1, 3, 4]) act('pressure', `valve-${index}`);
      act('pressure', 'release'); act('jeong', 'confront'); act('juliana', 'prepare');
      FEROS_COLONIST_TARGETS.forEach((target, index) => act(`colonist-${target.id}`, index < 5 ? 'gas' : index < 12 ? 'melee' : 'lethal'));
      act('freighter', 'open'); assert.equal(winEncounter(state, 'feros:boss'), true); act('shiala', 'receive'); act('shiala', survivor === 'kaidan' ? 'spare' : 'kill'); state.position = null;
    } else for (const id of zoneEncounters(zone)) assert.equal(winEncounter(state, id), true);
    assert.equal(completeZone(state, zone, choice), true, zone);
    if (zone === 'virmire') { state.zone = 'normandy'; assert.equal(readTopic(state, survivor, 'virmire-return').ok, true); }
  }
  state.zone = 'normandy'; assert.ok(decodeSave(encodeSave(state))); return state;
}
async function bridgePublicFeros() {
  const proofPath = publicFerosSavePath.replace(/-shiala-spared-export\.json$/, '-report.json');
  const proofBytes = await readFile(new URL(proofPath, root)), proof = JSON.parse(proofBytes);
  assert.equal(proof.passed, true); assert.equal(proof.mode, mode); assert.equal(proof.sourceFrozen, true);
  assert.ok(proof.checks.length > 0 && proof.checks.every(check => check.passed === true));
  for (const field of ['errors', 'consoleErrors', 'failedRequests', 'deliveryErrors']) assert.deepEqual(proof[field], []);
  for (const [path, expected] of Object.entries(proof.sourceHashes)) assert.equal(sha(await readFile(new URL(path, root))), expected, `Parent source changed: ${path}`);
  const exported = proof.exports.find(item => item.path === publicFerosSavePath && item.label === 'shiala-spared'); assert.ok(exported, 'The exact input must be an actual declared public export.');
  const sourceBytes = await readFile(new URL(publicFerosSavePath, root)); assert.equal(sha(sourceBytes), exported.sha256); assert.equal(sourceBytes.length, exported.bytes);
  const state = decodeSave(sourceBytes.toString()); assert.ok(state);
  const before = structuredClone(state.advanceFeros), colony = ferosColonyReport(state);
  assert.equal(colony.known, true); assert.equal(colony.resolved, 16); assert.equal(colony.pending, 0); assert.equal(colony.shiala, 'spared'); assert.equal(colony.cipher, true);
  assert.deepEqual(colony, exported.colonyReport);
  const completedNatively = [];
  const finish = (zone, choice) => {
    if (state.completed.includes(zone)) return;
    state.zone = zone; state.position = null;
    for (const id of zoneEncounters(zone)) if (!state.cleared.includes(id)) assert.equal(winEncounter(state, id), true);
    assert.equal(completeZone(state, zone, choice), true, zone); completedNatively.push(zone);
  };
  finish('feros', colony.completionChoice); finish('therum'); finish('noveria', 'release'); finish('virmire', 'save-kaidan');
  state.zone = 'normandy'; assert.equal(readTopic(state, 'kaidan', 'virmire-return').ok, true);
  finish('ilos'); finish('citadel-finale', 'save-council'); state.zone = 'normandy'; state.position = null;
  assert.deepEqual(state.advanceFeros, before); assert.deepEqual(ferosColonyReport(state), colony); assert.ok(decodeSave(encodeSave(state)));
  const provenance = { kind: 'Native continuation of the SHA-verified actual public Feros export, without replaying any colonist, Jeong or Shiala act.',
    parentExecution: { path: proofPath, sha256: sha(proofBytes) }, parentExport: { path: publicFerosSavePath, sha256: sha(sourceBytes) },
    completedNatively, nativeAPIs: ['winEncounter', 'completeZone', 'readTopic(kaidan,virmire-return)'], fullCampaignPlayed: false,
    publicFerosDecisionsPreservedExactly: true, colonyReport: colony };
  report.parentPublicInputs = { [proofPath]: sha(proofBytes), [publicFerosSavePath]: sha(sourceBytes) };
  return { state, provenance };
}
async function declare(label, value, origin) {
  const path = `docs/qa/${prefix}-${label}-fixture.json`, bytes = Buffer.from(value);
  await writeFile(new URL(path, root), bytes); report.fixtures.push({ path, bytes: bytes.length, sha256: sha(bytes), origin }); return bytes;
}
async function choose(button, bytes, name) {
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), click(button)]);
  await chooser.setFiles({ name, mimeType: 'application/json', buffer: bytes });
}
async function capture(label, focus) {
  if (focus) await focus.scrollIntoViewIfNeeded();
  const path = `docs/screenshots/${prefix}-${label}.png`, bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)) });
  report.captures.push({ label, path, bytes: bytes.length, sha256: sha(bytes), source: 'Unmodified actual public viewport; original PNG must be opened for review.' });
}
async function download(label, button, decode) {
  const [file] = await Promise.all([page.waitForEvent('download'), click(button)]);
  const path = `docs/qa/${prefix}-${label}-export.json`; await file.saveAs(fileURLToPath(new URL(path, root))); assert.equal(await file.failure(), null);
  const bytes = await readFile(new URL(path, root)), value = decode(bytes.toString()); assert.ok(value);
  report.exports.push({ label, path, bytes: bytes.length, sha256: sha(bytes) }); return { bytes, value };
}
async function select(mediaId, periodId = mediaId.toLowerCase()) {
  if (await page.locator('#chronicle-media').inputValue() !== mediaId) await page.locator('#chronicle-media').selectOption(mediaId);
  if (await page.locator('#chronicle-period').inputValue() !== periodId) await page.locator('#chronicle-period').selectOption(periodId);
  await click(action('universe-tab', 'continuity')); await page.locator('[data-chronicle-continuity]').waitFor();
}
async function importReport(bytes, survivor) {
  await choose(action('chronicle-continuity-import'), bytes, 'bilan-me1.json');
  await page.locator(`[data-continuity-survivor="${survivor}"]`).waitFor();
  assert.equal(await page.locator('[data-future-presence="undetermined"]').count(), 1);
}
async function storageBytes() {
  return page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(key => key === 'relay-chronicles.save.v1' || key.startsWith('relay-chronicles.manual-save.v1.')).sort().map(key => [key, localStorage.getItem(key)])));
}
try {
  const collectorBytes = await readFile(new URL(import.meta.url)); await writeFile(new URL(collectorPath, root), collectorBytes);
  report.collectorSnapshot = { path: collectorPath, sha256: sha(collectorBytes) };
  report.sourceHashes = await sourceHashes();
  report.registryContextHashes = await registryContextHashes();
  if (mode === 'production') report.distFiles = await tree(new URL('dist/', root));
  const bridged = await bridgePublicFeros(), kaidanState = bridged.state, ashleyState = fixture('ashley');
  const campaign = await declare('kaidan-campaign', encodeSave(kaidanState), bridged.provenance);
  const ashley = await declare('ashley-report', encodeCampaignExport(ashleyState), 'Native alternate completed campaign-export, declared before import. No browser playthrough claimed.');
  const malformed = await declare('malformed-report', JSON.stringify({ ...JSON.parse(encodeCampaignExport(ashleyState)), sourceMediaId: 'ME2' }), 'Only sourceMediaId differs from the native ME1 export; tests atomic refusal.');
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  report.chromium = browser.version(); page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, acceptDownloads: true }); page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('console', message => { if (message.type() !== 'error') return; const warning = message.location().url === new URL('/favicon.ico', endpoint).href && message.text() === 'Failed to load resource: the server responded with a status of 404 (Not Found)'; (warning ? report.warnings : report.consoleErrors).push(message.text()); });
  page.on('response', response => {
    const url = new URL(response.url()); if (url.origin !== endpoint.origin) return;
    if (url.pathname.startsWith('/src/') || url.pathname.includes('/@vite/')) report.sourceRequests.push(response.url());
    if (response.status() >= 400) { const warning = url.pathname === '/favicon.ico' && response.status() === 404; (warning ? report.warnings : report.failedRequests).push(`${response.status()} ${response.url()}`); }
    const key = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    if (mode === 'production' && response.status() === 200) {
      if (!report.distFiles[key]) { report.failedRequests.push(`Served file absent from frozen dist: ${key}`); return; }
      const job = (async () => {
        const bytes = await response.body(), expected = report.distFiles[key]; assert.equal(bytes.length, expected.bytes, key); assert.equal(sha(bytes), expected.sha256, key);
        report.responseBodiesVerified = (report.responseBodiesVerified || 0) + 1;
        if (!served.has(key)) { served.add(key); report.servedFiles.push({ path: key, bytes: bytes.length, sha256: sha(bytes) }); }
      })();
      job.catch(() => {}); pending.push(job);
    }
  });
  await page.goto(endpoint.href, { waitUntil: 'domcontentloaded' }); await action('import').waitFor();
  assert.equal(await page.evaluate(() => Object.hasOwn(window, '__RELAY_TEST__')), false);
  await choose(action('import'), campaign, 'campagne-me1-terminee.json');
  await page.locator('#hud:not(.hidden) .location h2').waitFor(); await page.locator('#transition.active').waitFor({ state: 'hidden' });
  await click(action('pause'));
  const exported = await download('actual-ui-me1-report', action('export-campaign'), decodeCampaignExport);
  for (const key of ['name', 'appearance', 'classId', 'choices', 'story', 'inventory', 'customization']) assert.deepEqual(exported.value.save.state[key], kaidanState[key], key);
  assert.deepEqual(exported.value.save.state.advanceFeros, kaidanState.advanceFeros);
  assert.deepEqual(exported.value.ferosReport, ferosColonyReport(kaidanState));
  assert.deepEqual([exported.value.ferosReport.spared, exported.value.ferosReport.killed, exported.value.ferosReport.gas, exported.value.ferosReport.melee], [12, 4, 5, 7]);
  assert.equal(exported.value.ferosReport.shiala, 'spared');
  await click(action('chronicles')); await page.locator('.universe-screen').waitFor(); const witnessBefore = await storageBytes();
  await select('ME2', 'me2-opening'); assert.equal(await page.locator('[data-continuity-empty]').count(), 1);
  await importReport(exported.bytes, 'kaidan'); assert.equal(await page.locator('[data-continuity-ship="normandy-sr1"]').count(), 1);
  await capture('me2-opening-sr1', page.locator('[data-continuity-ship]'));
  const opening = await download('me2-opening', action('chronicle-export'), decodeChronicle);
  assert.equal(opening.value.scenarioId, null); assert.deepEqual(opening.value.party, []);
  check('Real ending report UI export imports into the documentary ME2 SR1 opening, with no fabricated party or mission.');
  await select('ME2'); assert.equal(await page.locator('[data-continuity-empty]').count(), 1);
  await importReport(exported.bytes, 'kaidan'); assert.equal(await page.locator('[data-continuity-ship="normandy-sr2-cerberus"]').count(), 1);
  assert.match(await page.locator('[data-continuity-feros-report]').innerText(), /12\/16 habitants épargnés.*4 tués.*gaz : 5.*mêlée : 7/s);
  assert.match(await page.locator('[data-continuity-feros-report]').innerText(), /Shiala : épargnée/);
  await capture('me2-detailed-feros-report', page.locator('[data-continuity-feros-report]'));
  const me2 = await download('me2-main', action('chronicle-export'), decodeChronicle);
  const textBefore = await page.locator('[data-chronicle-continuity]').innerText();
  await choose(action('chronicle-continuity-import'), malformed, 'bilan-invalide.json'); await page.locator('.universe-feedback.error').waitFor();
  assert.equal(await page.locator('[data-chronicle-continuity]').innerText(), textBefore);
  await capture('me2-main-refused-preserved', page.locator('.universe-feedback'));
  await click(action('universe-tab', 'session')); await click(action('chronicle-battle'));
  await page.locator('.chronicle-combat').waitFor(); await click(action('chronicle-pause')); await click(action('chronicle-preparation'));
  check('Main ME2 identifies SR2 Cerberus; malformed source report refuses atomically and preserves the imported dossier.');
  await select('ME3'); assert.equal(await page.locator('[data-continuity-empty]').count(), 1);
  await importReport(ashley, 'ashley'); await capture('me3-ashley-relation', page.locator('[data-continuity-survivor]'));
  assert.match(await page.locator('[data-continuity-feros-report]').innerText(), /Shiala : exécutée/);
  assert.match(await page.locator('[data-continuity-survivor]').innerText(), /retour de Virmire/);
  const me3 = await download('me3-main', action('chronicle-export'), decodeChronicle);
  assert.equal(me3.value.importedCampaign.save.state.choices.virmire, 'save-ashley');
  await click(action('chronicle-continuity-clear')); assert.equal(await page.locator('[data-continuity-empty]').count(), 1);
  await choose(action('chronicle-import'), me3.bytes, 'chronique-me3-exportee.json');
  await page.locator('.universe-feedback:not(.error)').waitFor(); await click(action('universe-tab', 'continuity'));
  assert.equal(await page.locator('[data-continuity-survivor="ashley"]').count(), 1); await click(action('chronicle-save'));
  await page.reload({ waitUntil: 'domcontentloaded' }); await click(action('chronicles')); await page.locator('.universe-screen').waitFor(); await select('ME3');
  assert.equal(await page.locator('[data-continuity-survivor="ashley"]').count(), 1);
  await page.setViewportSize({ width: 390, height: 844 }); await capture('me3-reloaded-mobile', page.locator('[data-continuity-survivor]'));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.setViewportSize({ width: 1280, height: 1000 }); await select('ME2', 'me2-opening');
  assert.equal(await page.locator('[data-continuity-survivor="kaidan"]').count(), 1); assert.equal(await page.locator('[data-continuity-ship="normandy-sr1"]').count(), 1);
  assert.deepEqual(await storageBytes(), witnessBefore);
  report.observations.push({ me2Source: me2.value.importedCampaign.sourceMediaId, me3Source: me3.value.importedCampaign.sourceMediaId, campaignStorageUnchanged: true });
  check('Ashley relation stays documentary and undetermined for ME3; real Chronicle export/import/save/browser reload persists each period independently, with untouched ME1 storage and mobile layout.');
  await select('ME3', 'me3-multiplayer'); assert.equal(await page.locator('[data-do="chronicle-continuity-import"]').count(), 0);
  await page.locator('#chronicle-media').selectOption('MEA'); await page.locator('#chronicle-period').selectOption('mea');
  assert.equal(await page.locator('[data-do="chronicle-continuity-import"]').count(), 0);
  check('Multiplayer and Andromeda expose no ME1 report import action.');
  await Promise.all(pending); assert.deepEqual(report.errors, []); assert.deepEqual(report.consoleErrors, []); assert.deepEqual(report.failedRequests, []);
  assert.deepEqual(await sourceHashes(), report.sourceHashes); report.sourceFrozen = true;
  assert.deepEqual(await registryContextHashes(), report.registryContextHashes); report.registryContextFrozen = true;
  for (const [path, expected] of Object.entries(report.parentPublicInputs)) assert.equal(sha(await readFile(new URL(path, root))), expected, `Parent public proof changed: ${path}`);
  if (mode === 'production') { assert.deepEqual(report.sourceRequests, []); assert.deepEqual(await tree(new URL('dist/', root)), report.distFiles); assert.ok(report.servedFiles.some(item => /\.js$/.test(item.path))); report.distFrozen = true; }
  report.passed = true;
} catch (error) { report.failure = error.stack || String(error); process.exitCode = 1; if (page) try { await capture('failure'); } catch {} }
finally {
  await browser?.close();
  // Closing Chrome finishes the response list; verify any late response bodies
  // before declaring the immutable report complete, without a networkidle wait.
  try { await Promise.all(pending); assert.deepEqual(report.failedRequests, []); assert.deepEqual(report.errors, []); assert.deepEqual(report.consoleErrors, []); }
  catch (error) { report.passed = false; report.failure ||= error.stack || String(error); process.exitCode = 1; }
  await writeFile(reportFile, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, captures: report.captures.length, exports: report.exports.length, failure: report.failure }));
}
