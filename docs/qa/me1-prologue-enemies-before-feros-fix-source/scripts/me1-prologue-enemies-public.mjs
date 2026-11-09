import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { newGame, winEncounter, completeZone, recruit, encodeSave, decodeSave } from '../src/state.js';
import { recordVisit } from '../src/story.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { enemiesFor } from '../src/game-data.js';

// This is a public production journey. Node validates two existing real exports;
// Chromium imports them through the chooser and never accesses application state.
const root = new URL('../', import.meta.url), dist = new URL('dist/', root);
const mode = process.env.ME1_BUILD_KIND || 'development';
assert.ok(['development', 'production'].includes(mode));
const prefix = process.env.ME1_PUBLIC_PREFIX || (mode === 'production' ? 'me1-prologue-enemies-production' : 'me1-prologue-enemies-public-development');
assert.match(prefix, /^me1-prologue-enemies-[a-z0-9-]+$/);
const entry = new URL(process.env.GAME_URL || (mode === 'production' ? 'http://127.0.0.1:4244' : 'http://127.0.0.1:4243'));
const baseline = process.env.ME1_BASE_MAIN;
assert.match(baseline || '', /^[0-9a-f]{40}$/);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const reportPath = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(reportPath); throw new Error(`${fileURLToPath(reportPath)} already exists; preserve it and use a new ME1_PUBLIC_PREFIX.`); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
for (const path of ['docs/qa/', 'docs/screenshots/', 'test-results/']) await mkdir(new URL(path, root), { recursive: true });
const profile = await mkdtemp(fileURLToPath(new URL(`test-results/${prefix}-profile-`, root)));
const started = Date.now();
const report = {
  schemaVersion: 1, passed: false, at: new Date().toISOString(), baselineCommit: baseline,
  sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: fileURLToPath(root), encoding: 'utf8' }).trim(),
  buildKind: mode === 'production' ? 'production-dist' : 'vite-development-public-controls', url: entry.href,
  case: mode,
  command: { script: 'node scripts/me1-prologue-enemies-public.mjs', environment: {
    ME1_BASE_MAIN: baseline, GAME_URL: entry.href, ME1_BUILD_KIND: mode, ME1_PUBLIC_PREFIX: prefix,
    PLAYWRIGHT_EXECUTABLE_PATH: process.env.PLAYWRIGHT_EXECUTABLE_PATH || null } },
  scope: 'Actual public controls, no QA harness or private state access. Node-prepared valid early-Eden and Feros encounter2 saves declare their origin. Development gates abbreviated native commands; production additionally plays the first Eden victory, claims its narrative consequence and checks save/reload. A separate unchanged historical save inspects the Noveria pillar correction. Prior prepared progression is never claimed as played.', 
  fixtures: [], sources: {}, buildFiles: {}, servedFiles: [], browserResponses: [], exports: [],
  screenshots: [], activations: [], checks: [], nativeOrders: [], reloads: [], mapViews: [],
  sourceRequests: [], evidenceErrors: [], errors: [], failedRequests: [], consoleObservations: [], resourceWarnings: [],
  profile: { fresh: true, path: profile, launches: 0, completeShutdowns: 0 },
  tools: { node: process.version, chromium: null },
  limitations: ['The Eden fixture sets the native newGame to its first encounter. The Normandy briefing, landing walk and arrival scene are not played here.',
    'The Feros fixture uses native Node completion of Eden/Citadel and Feros encounter1, with declared recruitment. Those preceding victories are not played in Chromium.',
    'The Noveria comparison imports the unchanged historical public precombat export; its earlier prepared story progression remains explicitly outside this run.',
    'Jenkins has no biotic powers. His existing cover command may use the power-labelled tactical pose; a pose file does not grant a skill.',
    'A generic asari commando is drawn. This does not certify the Thorian clone identity or its summoning/disappearance phases.',
    'A desktop/mobile Chromium viewport is not a physical device performance or complete original-game1:1 certificate.'],
};
let context, page, closing = false;
const pendingResponses = [];
const action = (name, id) => page.locator(`[data-do="${name}"]${id === undefined ? '' : `[data-id="${id}"]`}`).first();
const stable = state => { const value = structuredClone(state); delete value.playedSeconds; return value; };
const record = name => { report.checks.push({ name, passed: true }); console.log(JSON.stringify({ check: name })); };

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
  await target.scrollIntoViewIfNeeded(); await target.focus();
  const observed = await target.evaluate(button => {
    const r = button.getBoundingClientRect();
    return { action: button.dataset.do, id: button.dataset.id, focused: document.activeElement === button,
      rect: { x: r.x, y: r.y, width: r.width, height: r.height }, visible: r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight };
  });
  assert.equal(observed.focused, true); assert.equal(observed.visible, true);
  report.activations.push(observed); await page.keyboard.press('Enter');
}
async function noHarness() {
  const observed = await page.evaluate(() => ({ own: Object.hasOwn(window, '__RELAY_TEST__'), type: typeof window.__RELAY_TEST__,
    viteClient: !!document.querySelector('script[src*="/@vite/client"]') }));
  assert.deepEqual(observed, { own: false, type: 'undefined', viteClient: mode === 'development' }); return observed;
}
async function worldReady() {
  await page.locator('#hud:not(.hidden) .explore-party').waitFor({ state: 'visible' });
  await page.locator('#transition.active').waitFor({ state: 'hidden' });
  await page.locator('#overlay .screen').waitFor({ state: 'hidden' });
}
async function pause() { await worldReady(); await activate(action('pause')); await action('export').waitFor({ state: 'visible' }); }
async function resume() { await activate(action('close')); await worldReady(); }
async function toastsGone() { await page.waitForFunction(() => document.querySelectorAll('#toasts .toast').length === 0); }
async function screenshot(label) {
  const path = `docs/screenshots/${prefix}-${label}.png`;
  const bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)), animations: 'disabled' });
  report.screenshots.push({ label, path, bytes: bytes.length, sha256: sha(bytes), viewport: page.viewportSize(),
    source: 'Actual public production viewport, no CSS/scene/pose injection' });
}
async function fixture(path, origin) {
  const bytes = await readFile(new URL(path, root)), state = decodeSave(bytes.toString('utf8'));
  assert.ok(state, `${path}: native save validator accepts the existing export`);
  const metadata = { path, bytes: bytes.length, sha256: sha(bytes), origin,
    zone: state.zone, party: state.party, position: state.position, importedViaPublicChooser: false };
  report.fixtures.push(metadata); return { bytes, state, metadata };
}
async function importFixture(fixture) {
  if (!await action('import').isVisible()) {
    if (!await action('quit').isVisible()) await pause();
    await activate(action('quit')); await action('import').waitFor({ state: 'visible' });
  }
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), activate(action('import'))]);
  await chooser.setFiles({ name: fixture.metadata.path.split('/').pop(), mimeType: 'application/json', buffer: fixture.bytes });
  await worldReady(); fixture.metadata.importedViaPublicChooser = true;
  assert.ok((await page.locator('#hud .explore-party').innerText()).includes(fixture.state.name));
}
async function exported(label) {
  await activate(action('save'));
  const [download] = await Promise.all([page.waitForEvent('download'), activate(action('export'))]);
  const path = `docs/qa/${prefix}-${label}-save.json`;
  await download.saveAs(fileURLToPath(new URL(path, root))); assert.equal(await download.failure(), null);
  const bytes = await readFile(new URL(path, root)), state = decodeSave(bytes.toString('utf8'));
  assert.ok(state, 'Actual downloaded save passes the native validator');
  report.exports.push({ label, path, bytes: bytes.length, sha256: sha(bytes),
    stableStateSHA256: sha(JSON.stringify(stable(state))), source: 'Actual public Sauvegarder/Exporter and Chromium download' });
  return state;
}
async function reloadContinue() {
  const response = await page.reload({ waitUntil: 'networkidle' });
  assert.ok([200, 304].includes(response.status()));
  if (mode === 'production' && response.status() === 200) assert.equal(sha(await response.body()), report.buildFiles['index.html'].sha256);
  await noHarness(); await activate(action('continue')); await worldReady();
  report.reloads.push({ method: 'Real page.reload followed by public Continuer', responseStatus: response.status() });
}
async function launch() {
  context = await chromium.launchPersistentContext(profile, { headless: true, acceptDownloads: true,
    viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  report.profile.launches++; report.tools.chromium = context.browser()?.version() || null;
  page = context.pages()[0] || await context.newPage(); page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push({ message: error.message }));
  page.on('crash', () => report.errors.push({ type: 'page-crash', intentional: closing }));
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('console', message => { if (message.type() === 'error') report.consoleObservations.push({ text: message.text(), location: message.location() }); });
  page.on('request', request => { if (/^\/(?:src|@vite|@fs)\//.test(new URL(request.url()).pathname)) report.sourceRequests.push(request.url()); });
  page.on('response', response => {
    const url = new URL(response.url()); if (url.origin !== entry.origin) return;
    const path = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    if (response.status() >= 400) {
      const observation = { url: response.url(), status: response.status() };
      if (url.pathname === '/favicon.ico' && response.status() === 404) report.resourceWarnings.push({ ...observation, qualification: 'Missing browser icon only, not a game resource failure' });
      else report.failedRequests.push(observation);
      return;
    }
    const expected = mode === 'production' ? report.buildFiles[path]?.sha256 : report.sources['public/' + path];
    if (!expected) return;
    if (response.status() === 304) { report.browserResponses.push({ path, status: 304, bodyNotRead: true, qualification: 'Cache revalidation; HTTP200 bodies are hashed separately' }); return; }
    pendingResponses.push((async () => {
      assert.equal(response.status(), 200); const bytes = await response.body();
      assert.equal(sha(bytes), expected);
      report.browserResponses.push({ path, status: 200, bytes: bytes.length, sha256: sha(bytes), matchesDist: mode === 'production', matchesNativeSource: !!report.sources['public/' + path] });
    })().catch(error => report.evidenceErrors.push({ path, message: error.message })));
  });
  const response = await page.goto(entry.href, { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200); if (mode === 'production') assert.equal(sha(await response.body()), report.buildFiles['index.html'].sha256);
  report.noHarness = await noHarness();
}
async function shutdown() {
  if (!context) return;
  const current = context, browser = current.browser(); context = null; closing = true;
  try { await Promise.all(pendingResponses.splice(0)); await current.close(); }
  finally { closing = false; }
  assert.equal(browser?.isConnected(), false); report.profile.completeShutdowns++;
}

function canonical(state) { const decoded = decodeSave(encodeSave(state)); assert.ok(decoded); return decoded; }
function preparedEden() {
  const s = newGame({ name: 'QA Prologue ME1', difficulty: 'story', mode: 'wait' });
  s.flags.briefed = true; s.settings.sound = false; s.settings.reducedMotion = true;
  s.zone = 'eden-prime'; recordVisit(s, 'eden-prime');
  const p = WORLD_ZONES['eden-prime'].pois.find(p => p.id === 'eden-prime:encounter-1'); s.position = { x: p.x, z: p.z };
  return canonical(s);
}
function preparedFeros() {
  const s = preparedEden();
  for (const id of ['encounter-1', 'encounter-2', 'boss']) assert.equal(winEncounter(s, `eden-prime:${id}`), true);
  assert.equal(completeZone(s, 'eden-prime'), true); s.zone = 'citadel'; recordVisit(s, 'citadel');
  for (const id of ['garrus', 'tali', 'wrex']) assert.equal(recruit(s, id), true);
  assert.equal(completeZone(s, 'citadel'), true); s.zone = 'feros'; recordVisit(s, 'feros');
  assert.equal(winEncounter(s, 'feros:encounter-1'), true);
  const p = WORLD_ZONES.feros.pois.find(p => p.id === 'feros:encounter-2'); s.position = { x: p.x, z: p.z };
  return canonical(s);
}
async function generatedFixture(state, label, origin) {
  const path = `docs/qa/${prefix}-${label}-fixture.json`; await writeFile(new URL(path, root), encodeSave(state));
  return fixture(path, origin);
}
async function openEncounter(expected) {
  await activate(page.locator('#hud .interaction[data-do="interact"]'));
  await page.locator('#battle-ui .battle-shell').waitFor();
  const ids = await page.locator('[data-do="battle-target"]').evaluateAll(nodes => nodes.map(node => node.dataset.id));
  assert.deepEqual(ids, expected); return ids;
}
async function order(preferredId, preferredAction = 'burst') {
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    if (await action('claim-victory').isVisible()) return null;
    const ready = await page.locator('.battle-member.ready').evaluateAll(nodes => nodes.filter(n => parseFloat(n.querySelector('[data-stat="hp-label"]')?.textContent) > 0).map(n => n.dataset.id));
    ready.sort((a, b) => Number(b === preferredId) - Number(a === preferredId));
    for (const actorId of ready) {
      await activate(action('battle-actor', actorId));
      const options = actorId === preferredId && preferredAction === 'cover' ? ['cover'] : [preferredAction, 'shoot', 'cover'];
      const selected = [];
      for (const id of options) if (await action('battle-action', id).isVisible() && await action('battle-action', id).isEnabled()) selected.push(id);
      if (!selected.length) continue;
      const actionId = selected[0], before = await page.locator(`#combat-${actorId} [data-stat="atb"]`).evaluate(n => parseFloat(n.style.width));
      assert.ok(before >= 99.999); await activate(action('battle-action', actionId));
      let targetId = actorId;
      if (actionId !== 'cover') {
        const targets = await page.locator('[data-do="battle-target"]:not(:disabled)').evaluateAll(nodes => nodes.map(n => ({ id: n.dataset.id, hp: parseFloat(n.querySelector('[data-stat="hp"]')?.style.width) })).sort((a, b) => a.hp - b.hp));
        assert.ok(targets.length); targetId = targets[0].id; await activate(action('battle-target', targetId));
      }
      await page.waitForFunction(id => parseFloat(document.querySelector(`#combat-${id} [data-stat="atb"]`)?.style.width) < 20, actorId);
      const after = await page.locator(`#combat-${actorId} [data-stat="atb"]`).evaluate(n => parseFloat(n.style.width));
      const log = await page.locator('#hud .combat-log').innerText();
      const row = { actorId, actionId, targetId, atbBefore: before, atbAfter: after, log, method: 'Actual public enabled actor/action/target controls with naturally ready ATB. Ready CSS alone is not treated as action availability.' };
      report.nativeOrders.push(row); return row;
    }
    await page.waitForTimeout(200);
  }
  throw Error(`No enabled native order became available for preferred actor ${preferredId}`);
}
async function jenkinsCover() {
  for (let count = 0; count < 12; count++) {
    const row = await order('jenkins', 'cover'); assert.ok(row, 'Jenkins cover occurs before victory');
    if (row.actorId === 'jenkins' && row.actionId === 'cover') { await screenshot('jenkins-native-cover'); return; }
  }
  throw Error('Public Jenkins cover was not selected');
}
async function winFirstEden(initial) {
  const deadline = Date.now() + 360000; let commands = 0;
  while (!await action('claim-victory').isVisible() && Date.now() < deadline) { const result = await order(null, 'burst'); if (result) commands++; }
  await action('claim-victory').waitFor(); await screenshot('eden-native-victory');
  await activate(action('claim-victory')); await page.locator('[data-do="dialogue-choice"]').first().waitFor();
  await screenshot('jenkins-loss-dialogue'); await activate(page.locator('[data-do="dialogue-choice"]').first()); await worldReady();
  const party = await page.locator('#hud .explore-party').innerText(); assert.ok(party.includes('Ashley Williams') && !party.includes('Richard Jenkins'));
  await pause(); const won = await exported('eden-first-victory');
  assert.equal(won.flags.jenkinsLost, true); assert.ok(won.lost.includes('jenkins')); assert.ok(won.recruited.includes('ashley'));
  assert.deepEqual(won.party, ['shepard', 'kaidan', 'ashley']); assert.ok(won.cleared.includes('eden-prime:encounter-1'));
  assert.equal(won.xp, initial.xp + 65); assert.equal(won.credits, initial.credits + 85);
  await reloadContinue(); await pause(); const restored = await exported('eden-first-victory-restored'); assert.deepEqual(stable(restored), stable(won));
  report.jenkinsNarrative = { nativeVictoryPlayed: true, additionalCommands: commands, claimedOnce: true, jenkinsLost: won.flags.jenkinsLost,
    availableParty: won.party, ashleyRecruited: true, exactReloadRestore: true, rewardXP: won.xp - initial.xp, rewardCredits: won.credits - initial.credits,
    chronology: 'The retained condensed campaign loses Jenkins when the first Eden victory is claimed. This is not represented as his original-game arrival timing.' };
}
try {
  const assetPaths = ['companion-jenkins', 'enemy-creeper', 'enemy-asari'].flatMap(stem => [`public/assets/${stem}-combat.png`, `public/assets/${stem}-animation.json`]);
  const sourcePaths = ['src/world.js', 'src/world-data.js', 'src/main.js', 'src/companion-animation-data.js', 'src/enemy-animation-data.js',
    'src/state.js', 'src/game-data.js', 'src/combat.js', 'src/story.js', 'vite.config.js', 'scripts/me1-prologue-enemies-public.mjs', ...assetPaths];
  for (const path of sourcePaths) report.sources[path] = sha(await readFile(new URL(path, root)));
  if (mode === 'production') report.buildFiles = await tree(dist);
  const eden = await generatedFixture(preparedEden(), 'eden', 'Node-native newGame, explicit briefed flag/first-encounter position. No preceding encounter is won and Jenkins remains a legal initial party member.');
  const feros = await generatedFixture(preparedFeros(), 'feros', 'Node-native earlier Eden/Citadel completion, recruitment and Feros encounter1 prepare this encounter. Those previous victories are not played here.');
  const noveria = await fixture('docs/qa/eden-immersion-production-rachni-precombat-save.json', 'Unchanged actual public export from the earlier explicitly prepared campaign fixture; this run compares the same native arena, without playing its prior story.');
  await launch();
  report.servedFiles = [];
  for (const path of assetPaths) {
    const publicPath = path.replace(/^public\//, ''), response = await context.request.get(new URL(publicPath, entry).href), data = await response.body();
    assert.equal(response.status(), 200); assert.equal(sha(data), report.sources[path]);
    if (mode === 'production') assert.equal(sha(data), report.buildFiles[publicPath].sha256);
    report.servedFiles.push({ path: publicPath, status: 200, sha256: sha(data), matchesNativeSource: true, matchesDist: mode === 'production' });
  }
  await importFixture(eden); await pause(); const beforeEden = await exported('eden-precombat'); await resume();
  assert.deepEqual(await openEncounter(enemiesFor('eden-prime', 0, eden.state).map(a => a.id)), ['geth-0', 'geth-1']);
  await screenshot('eden-first-battle'); await jenkinsCover();
  if (mode === 'production') await winFirstEden(beforeEden);
  else {
    await reloadContinue(); await pause(); const restored = await exported('eden-precombat-restored'); assert.deepEqual(stable(restored), stable(beforeEden));
    report.jenkinsNarrative = { nativeCoverPlayed: true, exactPrecombatRestore: true, victoryPlayed: false, jenkinsLossNotYetExercised: true };
  }
  record('Legal prologue Jenkins appears and issues his existing cover order; saves remain native and coherent');
  await importFixture(feros); await pause(); const beforeFeros = await exported('feros-precombat'); await resume();
  const ferosIDs = await openEncounter(enemiesFor('feros', 1, feros.state).map(a => a.id)); await screenshot('feros-generic-enemies');
  const shot = await order(null, 'shoot'); assert.ok(shot && shot.actionId === 'shoot'); await screenshot('feros-native-shot');
  await reloadContinue(); await pause(); const restoredFeros = await exported('feros-precombat-restored'); assert.deepEqual(stable(restoredFeros), stable(beforeFeros));
  report.ferosEncounter = { enemyIDs: ferosIDs, nativeShotPlayed: true, exactPrecombatRestore: true, noVictoryRewardClaimed: true, genericAsariOnly: true };
  await importFixture(noveria); await toastsGone(); await screenshot('noveria-field');
  await openEncounter(['rachni-0', 'rachni-1', 'rachni-2']); await page.waitForTimeout(1200); await screenshot('noveria-battle');
  await page.setViewportSize({ width: 390, height: 844 }); await screenshot('noveria-mobile-battle'); await page.setViewportSize({ width: 1280, height: 800 });
  record('Both new generic enemy families appear in their native Feros encounter; separate Noveria views inspect the pillar fix');
  await noHarness(); await Promise.all(pendingResponses.splice(0));
  for (const key of ['errors', 'failedRequests', 'evidenceErrors']) assert.deepEqual(report[key], []);
  if (mode === 'production') assert.deepEqual(report.sourceRequests, []);
  for (const observation of report.consoleObservations) assert.ok(/Failed to load resource/.test(observation.text) && new URL(observation.location.url).pathname === '/favicon.ico');
  for (const [path, hash] of Object.entries(report.sources)) assert.equal(sha(await readFile(new URL(path, root))), hash, `Source changed during public collection:${path}`);
  if (mode === 'production') assert.deepEqual(await tree(dist), report.buildFiles);
  const requestedPNG = report.browserResponses.filter(item => /(?:companion-jenkins|enemy-(?:creeper|asari))-combat\.png$/.test(item.path) && item.status === 200);
  assert.deepEqual([...new Set(requestedPNG.map(item => item.path))].sort(), assetPaths.filter(path => path.endsWith('.png')).map(path => path.replace(/^public\//, '')).sort());
  report.sourceAndDistFrozen = true; await shutdown(); assert.equal(report.profile.completeShutdowns, 1); report.passed = true;
} catch (error) {
  report.failure = error.stack || String(error); process.exitCode = 1; console.error(report.failure);
  if (page && !page.isClosed()) await screenshot('failure').catch(() => {});
} finally {
  if (context) await shutdown().catch(error => { report.closeError = error.message; });
  report.finishedAt = new Date().toISOString(); report.elapsedSeconds = Math.round((Date.now() - started) / 10) / 100;
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, mode, shots: report.nativeOrders.length, exports: report.exports.length, screenshots: report.screenshots.length, failure: report.failure }));
}
