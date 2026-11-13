// Production variant of the frozen DEV01 public collector. Only QA delivery
// metadata and guards differ; the actual dialogue walkthrough is identical.
// Real dialogue controls and public save import/export only. Fixtures explicitly
// prepare the preceding prologue and positions; no campaign traversal is claimed.
import assert from 'node:assert/strict';
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { newGame, zoneEncounters, winEncounter, completeZone, encodeSave, decodeSave } from '../src/state.js';
import { recordVisit } from '../src/story.js';
import { CHAPTERS } from '../src/game-data.js';
import { WORLD_ZONES } from '../src/world-data.js';

const root = new URL('../', import.meta.url), url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4196/');
const prefix = process.env.CONTINUATION_DIALOGUES_PREFIX, mode = process.env.CONTINUATION_DIALOGUES_MODE || 'production';
const gitBase = process.env.CONTINUATION_BASE_MAIN || '5d933068cacd1b595d584b7cedfffd35b1db362d';
assert.match(prefix || '', /^continuation-dialogues-public-production-[a-z0-9-]+$/);
assert.match(gitBase, /^[a-f0-9]{40}$/);
assert.equal(mode, 'production'); assert.equal(url.search, '');
await mkdir(new URL('docs/qa/', root), { recursive: true }); await mkdir(new URL('docs/screenshots/', root), { recursive: true });
const output = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(output); throw Error('Use a new prefix; preserve earlier attempts.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { passed: false, at: new Date().toISOString(), mode, url: url.href,
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: fileURLToPath(root), encoding: 'utf8' }).trim(), gitBase,
  command: { script: 'node scripts/continuation-dialogues-production-final.mjs', environment: { GAME_URL: url.href, CONTINUATION_DIALOGUES_PREFIX: prefix, CONTINUATION_DIALOGUES_MODE: mode } },
  scope: 'Public briefing, first audience, Tali evidence, investiture and Anderson handoff; declared native prologue and position-only imports. No QA harness or private app state access.',
  sourceHashes: {}, finalSourceHashes: {}, registryContextHashes: {}, sourceRequests: [], distFiles: {}, finalDistFiles: {}, servedFiles: [], deliveryErrors: [], fixtures: [], exports: [], captures: [], checks: [], speakers: [], errors: [], consoleErrors: [], failedRequests: [], resourceWarnings: [],
  limitations: ['The preceding Eden campaign and initial positions are explicit native fixtures, not played encounters or walked routes.',
    'Position-only transfers derive from actual public exports and are imported through the public chooser. No DOM, style, clock, ATB, HP or application-state injection is used.',
    'Tone replies are conversational variations only; no morality, relationship or new saved decision is invented.',
    'Native tests separately cover all graph branches, optional Garrus/Wrex combinations, stale callbacks, foreign contexts and existing reward idempotence.',
    'Dialogue text and staging are concise French adaptations. Full ME1 dialogue, voices, council portraits, original cinematics and fidelity 1:1 remain unverified.',
    'This collector does not certify Electron, Windows, mobile, physical controllers or original ballistics.'] };
const frozenDevelopmentCollector = {
  path: 'scripts/continuation-dialogues-public.mjs',
  sha256: '2e53abe50246447f72ab88656cbc8a79c7a12de62df09af981ab7d8050efe035',
  snapshot: 'docs/qa/continuation-dialogues-public-dev-01-collector.mjs',
  report: 'docs/qa/continuation-dialogues-public-dev-01-report.json',
  relation: 'Identical fixture preparation, dialogue walkthrough, seven checks, eleven capture points and seven exports; additional production delivery metadata only.',
};
report.provenance = { ...frozenDevelopmentCollector, productionMetadataAttempt: { report: 'docs/qa/continuation-dialogues-public-production-final-01-report.json', collector: 'scripts/continuation-dialogues-production.mjs', collectorSHA256: '7b497d257b476839ac74fa5249ffd75d5890a790797d8d05f84c8140df1061d5', change: 'Remove only the final global networkidle wait; all functional steps and response-byte/dist assertions are retained.' } };
for (const path of [frozenDevelopmentCollector.path, frozenDevelopmentCollector.snapshot]) {
  assert.equal(sha(await readFile(new URL(path, root))), frozenDevelopmentCollector.sha256, 'DEV01 collector stays frozen');
}
const developmentReport = JSON.parse(await readFile(new URL(frozenDevelopmentCollector.report, root), 'utf8'));
assert.equal(developmentReport.passed, true);
assert.equal(developmentReport.sourceHashes[frozenDevelopmentCollector.path], frozenDevelopmentCollector.sha256);
async function tree(directory, prefixPath = '') {
  const result = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = prefixPath + entry.name, target = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) Object.assign(result, await tree(target, filename + '/'));
    else { const bytes = await readFile(target); result[filename] = { bytes: bytes.length, sha256: sha(bytes) }; }
  }
  return result;
}
const responseChecks = [];
report.resourceWarningPolicy = 'Only the same-origin GET /favicon.ico HTTP 404 and its exact Chromium 404 console message are warnings; every other HTTP, console or transport failure remains blocking.';
const metadataAttempt = report.provenance.productionMetadataAttempt;
metadataAttempt.reportSHA256 = sha(await readFile(new URL(metadataAttempt.report, root)));
assert.equal(sha(await readFile(new URL(metadataAttempt.collector, root))), metadataAttempt.collectorSHA256);
let favicon404Observed = false;
let browser, page;
const action = name => page.locator(`[data-do="${name}"]`).first();
const dialog = (id, step) => page.locator(`.dialogue[data-conversation-id="campaign:${id}"]${step ? `[data-current-topic="${step}"]` : ''}`);
const check = name => { report.checks.push({ name, passed: true }); console.log(JSON.stringify({ check: name })); };
const click = async locator => { await locator.waitFor({ state: 'visible' }); assert.equal(await locator.isEnabled(), true); await locator.click(); };
async function ready() {
  await page.locator('#hud:not(.hidden) .location h2').waitFor(); await page.locator('#transition.active').waitFor({ state: 'hidden' });
  await page.locator('#overlay .screen, #overlay .dialogue').waitFor({ state: 'hidden' });
}
async function noHarness() {
  assert.deepEqual(await page.evaluate(() => ({ own: Object.hasOwn(window, '__RELAY_TEST__'), type: typeof window.__RELAY_TEST__, vite: !!document.querySelector('script[src*="/@vite/client"]') })),
    { own: false, type: 'undefined', vite: mode === 'development' });
}
async function capture(label) {
  const path = `docs/screenshots/${prefix}-${label}.png`, bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)), animations: 'disabled' });
  report.captures.push({ label, path, sha256: sha(bytes), bytes: bytes.length, source: 'Actual public viewport; no DOM/style/pose injection.' });
}
async function fixture(state, label, origin) {
  const bytes = Buffer.from(encodeSave(state)), path = `docs/qa/${prefix}-${label}-fixture.json`; assert.ok(decodeSave(bytes.toString()));
  await writeFile(new URL(path, root), bytes); const record = { path, sha256: sha(bytes), origin, position: state.position, importedViaPublicChooser: false };
  report.fixtures.push(record); return { bytes, record };
}
async function imported(value) {
  if (!await action('import').isVisible()) { await ready(); await page.keyboard.press('Escape'); await click(action('quit')); }
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), click(action('import'))]);
  await chooser.setFiles({ name: value.record.path.split('/').at(-1), mimeType: 'application/json', buffer: value.bytes });
  value.record.importedViaPublicChooser = true; await ready(); await noHarness();
}
async function exported(label) {
  await ready(); await page.keyboard.press('Escape'); await page.locator('.pause-screen').waitFor(); await click(action('save'));
  const [download] = await Promise.all([page.waitForEvent('download'), click(action('export'))]);
  const path = `docs/qa/${prefix}-${label}-export.json`; await download.saveAs(fileURLToPath(new URL(path, root))); assert.equal(await download.failure(), null);
  const bytes = await readFile(new URL(path, root)), state = decodeSave(bytes.toString()); assert.ok(state);
  report.exports.push({ label, path, sha256: sha(bytes), bytes: bytes.length, zone: state.zone, xp: state.xp, credits: state.credits, recruited: state.recruited, completed: state.completed, flags: state.flags });
  await click(action('close')); await ready(); return { path, state, sha256: sha(bytes) };
}
const point = (zone, suffix) => { const poi = WORLD_ZONES[zone].pois.find(entry => entry.id === `${zone}:${suffix}`); assert.ok(poi); return { x: poi.x, z: poi.z + .4 }; };
async function transfer(actual, zone, suffix, label) {
  const state = structuredClone(actual.state); assert.equal(state.zone, zone); const before = state.position; state.position = point(zone, suffix);
  const omit = value => { const copy = structuredClone(value); delete copy.position; return copy; }; assert.deepEqual(omit(state), omit(actual.state));
  await imported(await fixture(state, label, { kind: 'Position-only transfer from an actual public export', parentExport: actual.path, parentSHA256: actual.sha256,
    changedFields: [{ path: 'position', before, after: state.position }], traversalClaimed: false }));
}
async function choose(id, step, reply) {
  const current = dialog(id, step); await current.waitFor({ state: 'visible' });
  const speaker = (await current.locator('.speaker').innerText()).trim(); assert.ok(speaker); report.speakers.push({ id, step, speaker });
  await click(current.locator(`[data-reply-id="${reply}"]`));
}
async function interact(id, step) { await ready(); await page.keyboard.press('KeyE'); await dialog(id, step).waitFor({ state: 'visible' }); }
const gameplay = state => ({ flags: state.flags, completed: state.completed, recruited: state.recruited, party: state.party, choices: state.choices,
  lost: state.lost, xp: state.xp, credits: state.credits, medigel: state.medigel, paragon: state.paragon, renegade: state.renegade, inventory: state.inventory });

try {
  for (const path of ['src/main.js', 'src/continuation-dialogues.js', 'src/state.js', 'src/story.js', 'src/story-data.js', 'src/world-data.js', 'src/game-data.js', 'src/mission-progress.js', 'tests/continuation-dialogues.test.js', 'scripts/continuation-dialogues-production-final.mjs', 'scripts/continuation-dialogues-production.mjs', 'scripts/continuation-dialogues-public.mjs', 'package.json', 'package-lock.json', 'vite.config.js']) {
    report.sourceHashes[path] = sha(await readFile(new URL(path, root)));
  }
  if (mode === 'production') report.sourceHashes['src/universe-data.js'] = sha(await readFile(new URL('src/universe-data.js', root)));
  else report.registryContextHashes.before = { 'src/universe-data.js': sha(await readFile(new URL('src/universe-data.js', root))) };
  report.distFiles = await tree(new URL('dist/', root)); assert.ok(report.distFiles['index.html']);
  const collectorPath = `docs/qa/${prefix}-collector.mjs`, collector = await readFile(new URL(import.meta.url)); await writeFile(new URL(collectorPath, root), collector);
  report.collectorSnapshot = { path: collectorPath, sha256: sha(collector) };
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true }); page = await context.newPage(); page.setDefaultTimeout(60000);
  await page.route('**/*', async route => {
    const target = new URL(route.request().url());
    if (/^\/(?:src|@vite|@fs)\//.test(target.pathname)) {
      report.sourceRequests.push({ url: target.href, refused: true }); await route.abort('blockedbyclient');
    } else await route.continue();
  });
  page.on('response', response => {
    const target = new URL(response.url());
    if (target.origin !== url.origin || !/\.(?:js|css)$/.test(target.pathname)) return;
    responseChecks.push((async () => {
      const filename = decodeURIComponent(target.pathname.slice(1)), expected = report.distFiles[filename];
      assert.ok(expected, `Loaded response absent from dist: ${filename}`); assert.equal(response.status(), 200);
      const bytes = await response.body(), actual = sha(bytes); assert.equal(bytes.length, expected.bytes); assert.equal(actual, expected.sha256);
      report.servedFiles.push({ path: filename, url: target.href, status: response.status(), bytes: bytes.length, sha256: actual, matchesDist: true, observedActualBrowserResponse: true });
    })().catch(error => report.deliveryErrors.push(error.stack || String(error))));
  });
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), reason: request.failure()?.errorText }));
  page.on('response', response => {
    if (response.status() < 400) return;
    const target = new URL(response.url()), item = { url: target.href, status: response.status(), method: response.request().method() };
    if (target.origin === url.origin && target.pathname === '/favicon.ico' && response.status() === 404 && item.method === 'GET') {
      favicon404Observed = true; report.resourceWarnings.push(item);
    } else report.failedRequests.push(item);
  });
  page.on('console', message => { if (message.type() !== 'error') return; const item = { text: message.text(), location: message.location() };
    const target = item.location.url ? new URL(item.location.url) : null;
    if (favicon404Observed && target?.origin === url.origin && target?.pathname === '/favicon.ico'
      && item.text === 'Failed to load resource: the server responded with a status of 404 (Not Found)') report.resourceWarnings.push(item);
    else report.consoleErrors.push(item); });
  const entry = await page.goto(url.href, { waitUntil: 'networkidle' }); assert.equal(entry.status(), 200);
  const entryBytes = await entry.body(); assert.equal(sha(entryBytes), report.distFiles['index.html'].sha256);
  report.servedFiles.push({ path: 'index.html', url: entry.url(), status: entry.status(), bytes: entryBytes.length, sha256: sha(entryBytes), matchesDist: true, observedActualBrowserResponse: true });
  await noHarness();

  const initial = newGame({ name: 'QA Dialogues', difficulty: 'story' }); initial.position = point('normandy', 'briefing');
  await imported(await fixture(initial, 'briefing', { kind: 'Native newGame, starting position only', preparedRewards: false }));
  for (const tone of ['steady', 'practical', 'direct']) {
    await interact('briefing', 'intro'); await choose('briefing', 'intro', tone); await dialog('briefing', tone).waitFor();
    if (tone === 'steady') await capture('briefing-tone');
    await choose('briefing', tone, 'questions');
    for (const topic of ['normandy', 'beacon', 'nihlus']) { await choose('briefing', 'questions', topic); await choose('briefing', topic, 'back'); }
    await choose('briefing', 'questions', 'leave'); await ready();
  }
  const unbriefed = await exported('briefing-questions-only'); assert.deepEqual(gameplay(unbriefed.state), gameplay(initial));
  check('Three public briefing tones, three question topics and exit leave rewards, morality and progression unchanged');
  await interact('briefing', 'intro'); await choose('briefing', 'intro', 'questions'); await choose('briefing', 'questions', 'ready'); await choose('briefing', 'ready', 'deploy');
  await page.locator('.screen[aria-label="Carte de la galaxie"]').waitFor(); await capture('briefing-deploy-galaxy'); await click(action('close'));
  const briefed = await exported('briefing-confirmed'); assert.equal(briefed.state.flags.briefed, true); assert.equal(briefed.state.xp, initial.xp);
  check('Only the final briefing confirmation unlocks the existing galactic map');

  const prepared = newGame({ name: 'QA Dialogues', difficulty: 'story' }); prepared.flags.briefed = true; prepared.zone = 'eden-prime'; recordVisit(prepared, prepared.zone);
  for (const id of zoneEncounters(prepared.zone)) assert.equal(winEncounter(prepared, id), true);
  assert.equal(completeZone(prepared, prepared.zone), true); prepared.zone = 'citadel'; recordVisit(prepared, prepared.zone); prepared.position = point('citadel', 'arrival');
  await imported(await fixture(prepared, 'citadel', { kind: 'Declared native completed Eden prologue', APIs: ['newGame', 'recordVisit', 'winEncounter × 3', 'completeZone(eden-prime)'],
    prepared: ['briefed', 'three Eden wins and rewards', 'Jenkins loss', 'Ashley recruitment', 'Eden completion and rewards', 'Citadel visit', 'arrival position'],
    precedingCampaignPlayed: false, optionalCrewPrepared: [] }));
  for (const reply of ['cooperate', 'challenge', 'questions']) {
    await interact('first-audience', 'intro'); await choose('first-audience', 'intro', 'continue'); await choose('first-audience', 'anderson', 'continue');
    await choose('first-audience', 'council', reply); await capture(`first-audience-${reply}`); await choose('first-audience', reply, 'continue'); await choose('first-audience', 'udina', 'finish');
  }
  const audience = await exported('first-audience-complete'); assert.deepEqual(gameplay(audience.state), gameplay(prepared));
  check('Udina, Anderson and both councillors remain identified through all three first-audience responses; no Spectre verdict or reward is granted');

  await transfer(audience, 'citadel', 'encounter-2', 'tali-position'); await interact('tali-proof', 'intro');
  assert.doesNotMatch(await dialog('tali-proof', 'intro').locator('.dialogue-text').innerText(), /Bénézia/); await capture('tali-before-proof');
  await choose('tali-proof', 'intro', 'origin'); await choose('tali-proof', 'origin', 'back'); await choose('tali-proof', 'intro', 'pilgrimage'); await choose('tali-proof', 'pilgrimage', 'back');
  await choose('tali-proof', 'intro', 'receive'); await dialog('tali-proof', 'proof').waitFor(); assert.match(await dialog('tali-proof', 'proof').locator('.dialogue-text').innerText(), /Bénézia/);
  await capture('tali-received-proof'); await choose('tali-proof', 'proof', 'geth'); await choose('tali-proof', 'geth', 'back'); await choose('tali-proof', 'proof', 'finish');
  const tali = await exported('tali-recruited'); assert.ok(tali.state.recruited.includes('tali'));
  assert.equal(tali.state.xp, audience.state.xp); assert.equal(tali.state.credits, audience.state.credits); assert.deepEqual(tali.state.party, audience.state.party);
  assert.equal(tali.state.recruited.includes('garrus'), false); assert.equal(tali.state.recruited.includes('wrex'), false);
  check('Tali reveals the recording detail after explicit acceptance; public export contains exactly her recruitment without new resources or changed party');

  await transfer(tali, 'citadel', 'objective', 'council-position'); await interact('investiture', 'intro'); await choose('investiture', 'intro', 'continue');
  await choose('investiture', 'verdict', 'questions'); await choose('investiture', 'questions', 'honor'); await choose('investiture', 'honor', 'continue');
  await dialog('investiture', 'handoff').waitFor(); await capture('anderson-handoff-pending');
  await page.reload({ waitUntil: 'networkidle' }); await click(action('continue')); await ready();
  const pending = await exported('handoff-interrupted'); assert.deepEqual(gameplay(pending.state), gameplay(tali.state));
  check('Reloading before the final handoff preserves the prior accepted Tali event and grants neither Spectre progression nor chapter rewards');
  await interact('investiture', 'intro'); await choose('investiture', 'intro', 'continue'); await choose('investiture', 'verdict', 'resolve'); await choose('investiture', 'resolve', 'continue');
  await choose('investiture', 'handoff', 'orders'); await capture('anderson-investigation-leads'); await choose('investiture', 'orders', 'back');
  await choose('investiture', 'handoff', 'thanks'); await choose('investiture', 'thanks', 'continue'); await dialog('investiture', 'ready').waitFor(); await capture('anderson-command-confirmation');
  await choose('investiture', 'ready', 'finish'); await page.locator('.dialogue').waitFor(); await click(page.locator('[data-do="dialogue-choice"]').first()); await ready();
  assert.equal(await page.locator('#hud .location h2').innerText(), 'Normandy SR-1');
  const complete = await exported('handoff-completed'); assert.equal(complete.state.flags.spectre, true); assert.ok(complete.state.completed.includes('citadel'));
  assert.equal(complete.state.xp, tali.state.xp + CHAPTERS.citadel.reward); assert.equal(complete.state.credits, tali.state.credits + 180);
  assert.deepEqual(complete.state.recruited, tali.state.recruited); assert.deepEqual(complete.state.party, tali.state.party);
  assert.equal(complete.state.paragon, tali.state.paragon); assert.equal(complete.state.renegade, tali.state.renegade);
  check('Final Anderson confirmation grants only the existing Citadel reward once and returns the unchanged chosen squad to the Normandy');
  await page.reload({ waitUntil: 'networkidle' }); await click(action('continue')); await ready(); const resumed = await exported('handoff-reloaded');
  assert.deepEqual(gameplay(resumed.state), gameplay(complete.state));
  await page.keyboard.press('KeyG'); await page.locator('.screen[aria-label="Carte de la galaxie"]').waitFor();
  for (const id of ['therum', 'feros', 'noveria']) assert.equal(await page.locator(`[data-do="planet"][data-id="${id}"]`).isEnabled(), true);
  await capture('handoff-reloaded-destinations'); await click(action('close'));
  check('Actual save/reload preserves the single reward and unlocks the three investigation destinations after the handoff');
  for (const path of Object.keys(report.sourceHashes)) report.finalSourceHashes[path] = sha(await readFile(new URL(path, root)));
  assert.deepEqual(report.finalSourceHashes, report.sourceHashes, 'Runtime sources remain frozen through this run');
  if (mode === 'development') {
    report.registryContextHashes.after = { 'src/universe-data.js': sha(await readFile(new URL('src/universe-data.js', root))) };
    assert.deepEqual(report.registryContextHashes.after, report.registryContextHashes.before);
  }
  // All dialogue steps and observed script/style response bodies already completed.
  // A global network-idle wait would also include unrelated resource traffic.
  await Promise.all(responseChecks);
  const loadedAssets = await page.evaluate(() => [...new Set(performance.getEntriesByType('resource')
    .map(entry => new URL(entry.name)).filter(target => target.origin === location.origin && /\.(?:js|css)$/.test(target.pathname))
    .map(target => target.pathname.slice(1)))]);
  for (const filename of loadedAssets) {
    assert.ok(report.distFiles[filename]); const response = await page.request.get(new URL(filename, url).href); assert.equal(response.status(), 200);
    const bytes = await response.body(); assert.equal(sha(bytes), report.distFiles[filename].sha256);
    if (!report.servedFiles.some(file => file.path === filename)) report.servedFiles.push({ path: filename, bytes: bytes.length, sha256: sha(bytes), matchesDist: true, checkedFromResourceTiming: true });
  }
  report.finalDistFiles = await tree(new URL('dist/', root)); assert.deepEqual(report.finalDistFiles, report.distFiles); report.distFrozen = true;
  assert.deepEqual(report.sourceRequests, []); assert.deepEqual(report.deliveryErrors, []);
  assert.equal(report.captures.length, 11); assert.equal(report.exports.length, 7); assert.equal(report.checks.length, 7);
  assert.deepEqual(report.errors, []); assert.deepEqual(report.consoleErrors, []); assert.deepEqual(report.failedRequests, []); report.passed = true;
} catch (error) { report.failure = error.stack || String(error); process.exitCode = 1; if (page) try { await capture('failure'); } catch {} }
finally { await browser?.close(); report.browserClosed = !!browser; await writeFile(output, JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify({ passed: report.passed, report: fileURLToPath(output), checks: report.checks.length, captures: report.captures.length, exports: report.exports.length, failure: report.failure }));
