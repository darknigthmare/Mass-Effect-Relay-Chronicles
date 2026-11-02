import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { newGame, winEncounter, encodeSave, decodeSave } from '../src/state.js';
import { recordVisit } from '../src/story.js';
import { enemiesFor } from '../src/game-data.js';
import { WORLD_ZONES } from '../src/world-data.js';

// Node declares valid fixtures. The browser uses public import/export,
// interaction, combat and Continue controls only; it never mutates game state.
const root = new URL('../', import.meta.url), dist = new URL('dist/', root);
const prefix = 'me1-enemy-poses-production', baseMain = process.env.ME1_ENEMY_BASE_MAIN;
assert.match(baseMain || '', /^[0-9a-f]{40}$/);
const entry = new URL(process.env.GAME_URL || 'http://127.0.0.1:4194');
entry.searchParams.set('qa', '');
const keys = ['geth', 'geth-sniper', 'geth-destroyer', 'husk'];
const artPaths = [...keys.flatMap(key => [`public/assets/enemy-${key}-combat.png`, `public/assets/enemy-${key}-animation.json`]),
  'public/assets/joker-seated.png', 'public/assets/joker-seated.json'];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
for (const path of ['test-results/', 'docs/qa/', 'docs/screenshots/']) await mkdir(new URL(path, root), { recursive: true });
const profile = await mkdtemp(fileURLToPath(new URL(`test-results/${prefix}-profile-`, root)));
const started = Date.now(), report = {
  schemaVersion: 1, passed: false, at: new Date().toISOString(), baselineCommit: baseMain,
  sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: fileURLToPath(root), encoding: 'utf8' }).trim(),
  scope: 'Public production journey: Joker cockpit conversation, three actual Eden Prime encounters containing the four existing enemy types, one native player shot per encounter and three pre-combat save restores. Fixtures are explicitly prepared in Node with native state functions. The isolated renderer proof separately inspects all16 poses. No original-game likeness, complete recruitment playthrough or new enemy mechanic is certified.',
  url: entry.href, buildKind: 'production-dist', command: 'ME1_ENEMY_BASE_MAIN=<baseline> PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium node scripts/me1-enemy-poses-production.mjs',
  profile: { fresh: true, path: profile, viewport: { width: 1280, height: 800 }, launches: 0, completeShutdowns: 0 },
  tools: { node: process.version, chromium: null }, sources: {}, buildFiles: {}, servedFiles: [],
  fixtures: [], exports: [], encounters: [], nativeOrders: [], reloads: [], canvases: [], screenshots: [], activations: [], checks: [],
  pageAtlasRequests: [], responseEvidenceErrors: [], sourceRequests: [], errors: [], failedRequests: [], browserEvents: [], consoleObservations: [], resourceWarnings: [],
  limitations: ['Prepared fixtures use the native completion functions for earlier encounters; those prior victories are not played in Chromium.',
    'Each actual encounter remains unresolved and resumes its automatic pre-combat save. No new victory reward is claimed.',
    'Public frames and source asset loads do not alone certify16-pose coverage; the independent renderer fixture supplies that inspection.',
    'Joker idle is integrated at the Normandy cockpit. The second pilot drawing is produced but is not an additional timed animation.',
    'The historical Chromium154 post-restart download failure is avoided: exports follow same-process page reloads; final complete restart is checked through public UI only.',
    'Console resource warnings are recorded with locations. The historical implicit favicon404 is distinguished from game resource failures.']
};
let context, page, shuttingDown = false;
const pendingResponses = [];
const action = (name, id) => page.locator(`[data-do="${name}"]${id === undefined ? '' : `[data-id="${id}"]`}`).first();
const record = name => { report.checks.push({ name, passed: true }); console.log(JSON.stringify({ check: name })); };
const stable = (state, omit = []) => { const value = structuredClone(state); delete value.playedSeconds; for (const key of omit) delete value[key]; return value; };
const canonical = state => { const value = decodeSave(encodeSave(state)); assert.ok(value); return value; };
async function activate(target) {
  await target.waitFor({ state: 'visible' }); assert.equal(await target.isEnabled(), true);
  await target.scrollIntoViewIfNeeded(); await target.focus();
  const observed = await target.evaluate(button => {
    const rect = button.getBoundingClientRect();
    return { action: button.dataset.do, id: button.dataset.id, focused: document.activeElement === button,
      width: rect.width, height: rect.height, visible: rect.right > 0 && rect.bottom > 0 && rect.left < innerWidth && rect.top < innerHeight };
  });
  assert.equal(observed.focused, true); assert.equal(observed.visible, true);
  report.activations.push({ launch: report.profile.launches, ...observed });
  await page.keyboard.press('Enter');
}

async function tree(directory, path = '') {
  for (const item of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = path + item.name, url = new URL(item.name + (item.isDirectory() ? '/' : ''), directory);
    if (item.isDirectory()) await tree(url, relative + '/');
    else if (item.isFile()) { const bytes = await readFile(url); report.buildFiles[relative] = { bytes: bytes.length, sha256: sha(bytes) }; }
  }
}

async function launch() {
  context = await chromium.launchPersistentContext(profile, {
    headless: true, acceptDownloads: true, viewport: report.profile.viewport, deviceScaleFactor: 1,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  report.profile.launches++; report.tools.chromium = context.browser()?.version() || null;
  page = context.pages()[0] || await context.newPage(); page.setDefaultTimeout(45000);
  const launch = report.profile.launches;
  page.on('crash', () => report.browserEvents.push({ launch, type: 'page-crash', intentional: shuttingDown }));
  page.on('close', () => report.browserEvents.push({ launch, type: 'page-close', intentional: shuttingDown }));
  context.on('close', () => report.browserEvents.push({ launch, type: 'context-close', intentional: shuttingDown }));
  context.browser()?.on('disconnected', () => report.browserEvents.push({ launch, type: 'browser-disconnected', intentional: shuttingDown }));
  page.on('pageerror', error => report.errors.push({ launch, message: error.message }));
  page.on('console', message => { if (message.type() === 'error') report.consoleObservations.push({ text: message.text(), location: message.location() }); });
  page.on('requestfailed', request => report.failedRequests.push({ launch, url: request.url(), error: request.failure()?.errorText }));
  page.on('request', request => {
    const path = new URL(request.url()).pathname;
    if (/^\/(?:src|@vite|@fs)\//.test(path)) report.sourceRequests.push({ launch, url: request.url() });
  });
  page.on('response', response => {
    if (response.status() >= 400) {
      const url = new URL(response.url()), observation = { launch, url: response.url(), status: response.status() };
      if (url.origin === entry.origin && url.pathname === '/favicon.ico' && response.status() === 404)
        report.resourceWarnings.push({ ...observation, qualification: 'Historical missing browser icon; game operations are checked separately.' });
      else report.failedRequests.push(observation);
    }
    const path = new URL(response.url()).pathname.slice(1);
    if (/^assets\/(?:enemy-(?:geth|geth-sniper|geth-destroyer|husk)-combat|joker-seated)\.png$/.test(path)) {
      const status = response.status();
      if (status >= 300 && status < 400) {
        report.pageAtlasRequests.push({ launch, path, status, cacheRevalidation: status === 304,
          bodyNotRead: true, note: 'A conditional or redirected response supplies no new body proof; HTTP200 responses are hashed separately.' });
        return;
      }
      pendingResponses.push((async () => {
        assert.equal(status, 200);
        const bytes = await response.body();
        assert.equal(sha(bytes), report.buildFiles[path]?.sha256);
        report.pageAtlasRequests.push({ launch, path, status, bytes: bytes.length, sha256: sha(bytes), matchesDist: true });
      })().catch(error => { report.responseEvidenceErrors.push({ launch, path, status, message: error.message }); }));
    }
  });
  const response = await page.goto(entry.href, { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200); assert.equal(sha(await response.body()), report.buildFiles['index.html'].sha256);
  await noHarness();
}

async function shutdown() {
  if (!context) return;
  const closing = context, browser = closing.browser(); context = null; shuttingDown = true;
  try {
    try {
      if (page && !page.isClosed()) await page.waitForLoadState('networkidle');
      await Promise.all(pendingResponses.splice(0));
    } finally { await closing.close(); }
  } finally { shuttingDown = false; }
  assert.equal(browser?.isConnected(), false); report.profile.completeShutdowns++;
}

async function noHarness() {
  const observed = await page.evaluate(() => ({ own: Object.hasOwn(window, '__RELAY_TEST__'),
    type: typeof window.__RELAY_TEST__, client: !!document.querySelector('script[src*="/@vite/client"]') }));
  assert.deepEqual(observed, { own: false, type: 'undefined', client: false }); return observed;
}

async function worldReady() {
  await page.locator('#hud:not(.hidden) .explore-party').waitFor({ state: 'visible' });
  await page.locator('#transition.active').waitFor({ state: 'hidden' });
  await page.locator('#overlay .screen').waitFor({ state: 'hidden' });
}
async function pause() { await worldReady(); await activate(action('pause')); await action('export').waitFor({ state: 'visible' }); }
async function resume() { await activate(action('close')); await worldReady(); }
async function reloadContinue(label) {
  const response = await page.reload({ waitUntil: 'networkidle' });
  assert.ok([200, 304].includes(response.status()));
  if (response.status() === 200) assert.equal(sha(await response.body()), report.buildFiles['index.html'].sha256);
  await noHarness(); await activate(action('continue')); await worldReady();
  report.reloads.push({ label, browserLaunch: report.profile.launches, status: response.status(),
    method: 'Actual page.reload and Continue controls; same Chromium process, no direct storage access' });
}

async function publicPersistenceView(label) {
  await worldReady(); const party = await page.locator('#hud .explore-party').innerText();
  await activate(action('equipment')); await action('eq-tab', 'loadout').waitFor({ state: 'visible' });
  await activate(action('eq-tab', 'loadout')); const loadout = await page.locator('#overlay .screen').innerText();
  await activate(action('eq-tab', 'inventory')); const inventory = await page.locator('#overlay .screen').innerText();
  await screenshot(`${label}-inventory`); await resume();
  await activate(action('journal')); await page.locator('#overlay .screen').waitFor({ state: 'visible' });
  const journal = await page.locator('#overlay .screen').innerText(); await screenshot(`${label}-journal`);
  await resume();
  return { party, loadout, inventory, journal };
}

async function prepared(state, label, origin) {
  const validated = canonical(state), bytes = Buffer.from(encodeSave(validated));
  const path = `docs/qa/${prefix}-${label}-fixture.json`; await writeFile(new URL(path, root), bytes);
  const metadata = { label, path, bytes: bytes.length, sha256: sha(bytes), origin, party: validated.party,
    zone: validated.zone, position: validated.position, completed: validated.completed, recruited: validated.recruited,
    lost: validated.lost, importedViaPublicChooser: false };
  report.fixtures.push(metadata); return { state: validated, bytes, metadata };
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
  const [download] = await Promise.all([page.waitForEvent('download'), activate(action('export'))]);
  const path = `docs/qa/${prefix}-${label}-save.json`;
  await download.saveAs(fileURLToPath(new URL(path, root))); assert.equal(await download.failure(), null);
  const bytes = await readFile(new URL(path, root)), state = decodeSave(bytes.toString('utf8'));
  assert.ok(state, 'A real downloaded save passes the native validator.');
  report.exports.push({ label, path, sha256: sha(bytes), bytes: bytes.length, source: 'Actual Exporter button and Chromium download',
    party: state.party, zone: state.zone, inventorySha256: sha(JSON.stringify(state.inventory)), stableStateSha256: sha(JSON.stringify(stable(state))) });
  return state;
}

async function screenshot(label) {
  const path = `docs/screenshots/${prefix}-${label}.png`, bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)), animations: 'disabled' });
  report.screenshots.push({ path, sha256: sha(bytes), bytes: bytes.length, viewport: page.viewportSize(),
    source: 'Actual public production browser viewport; no renderer object or pose setter used' });
}

async function canvasPixels(label) {
  const observed = await page.locator('#world canvas').evaluate(canvas => new Promise(resolve => requestAnimationFrame(() => {
    const gl = canvas.getContext('webgl2'), data = new Uint8Array(canvas.width * canvas.height * 4);
    if (!gl || gl.isContextLost()) { resolve({ available: false }); return; }
    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, data);
    let alpha = 0; const colors = new Set();
    for (let i = 0; i < data.length; i += 64) { if (data[i + 3]) alpha++; colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`); }
    resolve({ available: true, width: canvas.width, height: canvas.height, sampledOpaque: alpha, distinctSampledColors: colors.size, glError: gl.getError() });
  })));
  assert.equal(observed.available, true); assert.equal(observed.glError, 0);
  assert.ok(observed.sampledOpaque > 1000 && observed.distinctSampledColors > 20, 'Actual world framebuffer contains nonempty varied pixels.');
  report.canvases.push({ label, ...observed }); return observed;
}


async function nativeShot(label) {
  await page.locator('#battle-ui .battle-shell').waitFor({ state: 'visible' });
  await page.waitForFunction(() => !!document.querySelector('.battle-member.ready'), null, { timeout: 90000 });
  const actorId = await page.locator('.battle-member.ready').first().getAttribute('data-id');
  await activate(action('battle-actor', actorId));
  const atbBefore = await page.locator(`#combat-${actorId} [data-stat="atb"]`).evaluate(node => parseFloat(node.style.width));
  assert.ok(atbBefore >= 99.999);
  await activate(action('battle-action', 'shoot'));
  const target = page.locator('[data-do="battle-target"]:not(:disabled)').first();
  const targetId = await target.getAttribute('data-id'), targetName = (await target.innerText()).split('\n')[0];
  await activate(target);
  await page.waitForFunction(id => parseFloat(document.querySelector(`#combat-${id} [data-stat="atb"]`)?.style.width) < 20, actorId);
  const atbAfter = await page.locator(`#combat-${actorId} [data-stat="atb"]`).evaluate(node => parseFloat(node.style.width));
  const log = await page.locator('#hud .combat-log').innerText();
  assert.ok(log.includes(targetName));
  report.nativeOrders.push({ label, actorId, targetId, targetName, atbBefore, atbAfter, actionId: 'shoot', log,
    method: 'Public native command and target buttons with natural ATB readiness; no clock, pose, ammunition or actor setter.' });
  await screenshot(`${label}-native-shot`); await canvasPixels(label);
}

try {
  for (const path of ['src/world.js', 'src/enemy-animation-data.js', 'src/joker-seated-data.js', 'vite.config.js',
    'src/main.js', 'src/state.js', 'src/story.js', 'src/game-data.js', 'src/combat.js', 'src/companion-animation-data.js',
    'scripts/me1-enemy-poses-production.mjs', ...artPaths]) report.sources[path] = sha(await readFile(new URL(path, root)));
  await tree(dist); await launch();
  for (const path of artPaths.map(path => path.replace(/^public\//, ''))) {
    const response = await context.request.get(new URL(path, entry).href), bytes = await response.body();
    assert.equal(response.status(), 200); assert.equal(sha(bytes), report.buildFiles[path].sha256);
    assert.equal(sha(bytes), report.sources[`public/${path}`]);
    report.servedFiles.push({ path, status: 200, sha256: sha(bytes), matchesDist: true });
  }
  record('Five new PNGs and their metadata are served byte-exact from the production build without a development harness');
  const jokerState = newGame({ name: 'QA ennemis ME1', difficulty: 'story', mode: 'wait' });
  jokerState.flags.briefed = true; jokerState.settings.sound = false; jokerState.settings.reducedMotion = true;
  jokerState.position = { x: 0, z: -13.2 };
  const joker = await prepared(jokerState, 'joker-cockpit', 'Explicit newGame fixture placed next to the existing public Joker conversation point; no story completion or recruitment is claimed.');
  await importFixture(joker); await canvasPixels('joker-cockpit'); await screenshot('joker-seated-cockpit');
  const interaction = page.locator('#hud .interaction[data-do="interact"]');
  await interaction.waitFor({ state: 'visible' }); assert.ok((await interaction.innerText()).includes('Joker'));
  await activate(interaction); await page.locator('.dialogue[data-conversation-id="joker"]').waitFor();
  const dialogue = await page.locator('.dialogue').innerText(); assert.ok(dialogue.includes('Joker'));
  await screenshot('joker-conversation'); await activate(page.locator('[data-conversation-end]').first());
  await worldReady(); await pause(); const jokerBefore = await exported('joker-before-reload');
  await reloadContinue('joker-cockpit'); await pause(); const jokerAfter = await exported('joker-after-reload');
  assert.deepEqual(stable(jokerAfter), stable(jokerBefore));
  report.joker = { actualConversation: true, text: dialogue, exactSaveAfterPageReload: true, animationClaim: 'idle only; pilot drawing retained without a timed cycle' };
  record('Seated Joker remains a real public conversation contact and the actual downloaded save survives a page reload');

  for (let index = 0; index < 3; index++) {
    const suffix = ['encounter-1', 'encounter-2', 'boss'][index], label = `eden-${suffix}`;
    const fixture = newGame({ name: 'QA ennemis ME1', difficulty: 'story', mode: 'wait' });
    fixture.flags.briefed = true; fixture.settings.sound = false; fixture.settings.reducedMotion = true;
    fixture.zone = 'eden-prime'; recordVisit(fixture, 'eden-prime');
    for (let prior = 0; prior < index; prior++) assert.equal(winEncounter(fixture, `eden-prime:${['encounter-1', 'encounter-2'][prior]}`), true);
    const poi = WORLD_ZONES['eden-prime'].pois.find(poi => poi.id === `eden-prime:${suffix}`);
    fixture.position = { x: poi.x, z: poi.z };
    const expectedEnemies = enemiesFor('eden-prime', index, fixture);
    const input = await prepared(fixture, label, `Node newGame/recordVisit and exactly${index} native earlier encounter completions; only this encounter is entered through real public controls.`);
    await importFixture(input); await pause(); const before = await exported(`${label}-precombat`); await resume();
    await interaction.waitFor({ state: 'visible' }); await activate(interaction);
    await page.locator('#battle-ui .battle-shell').waitFor({ state: 'visible' });
    const targets = await page.locator('[data-do="battle-target"]').evaluateAll(nodes => nodes.map(node => ({ id: node.dataset.id, text: node.textContent })));
    assert.deepEqual(targets.map(target => target.id), expectedEnemies.map(enemy => enemy.id));
    for (let i = 0; i < targets.length; i++) assert.ok(targets[i].text.includes(expectedEnemies[i].name));
    await screenshot(`${label}-public-battle`); await nativeShot(label);
    await reloadContinue(label); await pause(); const after = await exported(`${label}-resumed`);
    assert.deepEqual(stable(after), stable(before)); assert.equal(after.cleared.includes(poi.id), false);
    report.encounters.push({ label, poiId: poi.id, enemyIds: expectedEnemies.map(enemy => enemy.id), spriteKeys: expectedEnemies.map(enemy => enemy.sprite),
      targetNames: expectedEnemies.map(enemy => enemy.name), nativePlayerShot: true, actualPrecombatReload: true, saveExactExceptElapsedTime: true,
      noVictoryRewardClaimed: true });
    record(`${label}: actual enemy identities, native public shot and exact pre-combat save restoration`);
  }
  await resume(); const before = await publicPersistenceView('before-full-restart');
  await pause(); await shutdown(); await launch(); await activate(action('continue')); await worldReady();
  const after = await publicPersistenceView('after-full-restart'); assert.deepEqual(after, before);
  report.fullRestart = { exactPublicUI: true, launches: 2, noPostRestartDownloadAttempted: true, before, after };
  await screenshot('after-full-restart-world'); await canvasPixels('after-full-restart');
  await Promise.all(pendingResponses.splice(0));
  assert.deepEqual([...new Set(report.encounters.flatMap(encounter => encounter.spriteKeys))].sort(), [...keys].sort());
  const requested = [...new Set(report.pageAtlasRequests.filter(request => request.status === 200).map(request => request.path))].sort();
  assert.deepEqual(requested, artPaths.filter(path => path.endsWith('.png')).map(path => path.replace(/^public\//, '')).sort());
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []); assert.deepEqual(report.sourceRequests, []); assert.deepEqual(report.responseEvidenceErrors, []);
  assert.deepEqual(report.browserEvents.filter(event => !event.intentional || event.type === 'page-crash'), []);
  await noHarness(); await shutdown(); assert.equal(report.profile.completeShutdowns, 2);
  record('The four enemy families and Joker are actually requested by the compiled page; a full browser restart preserves visible party, equipment, inventory and journal');
  report.passed = true;
} catch (error) {
  report.failure = error.stack || String(error); process.exitCode = 1; console.error(report.failure);
  if (page && !page.isClosed()) await screenshot('failure').catch(() => {});
} finally {
  if (context) await shutdown().catch(error => { report.closeError = error.message; });
  report.finishedAt = new Date().toISOString(); report.elapsedSeconds = Math.round((Date.now() - started) / 10) / 100;
  await writeFile(new URL(`docs/qa/${prefix}-report.json`, root), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, encounters: report.encounters.length,
    shots: report.nativeOrders.length, exports: report.exports.length, captures: report.screenshots.length, failure: report.failure }));
}
