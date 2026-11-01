import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { newGame, winEncounter, completeZone, zoneEncounters, recruit, encodeSave, decodeSave } from '../src/state.js';

// Node prepares explicit, valid campaign fixtures. Chromium uses only the real
// import/export, squad, interaction and ATB controls. It never reads/writes
// storage directly, imports /src modules, calls a harness or forces poses.
const root = new URL('../', import.meta.url), dist = new URL('dist/', root);
const prefix = 'companion-combat-production';
const baseMain = process.env.COMPANION_BASE_MAIN;
assert.match(baseMain || '', /^[0-9a-f]{40}$/, 'COMPANION_BASE_MAIN must be the actual baseline commit.');
const entry = new URL(process.env.GAME_URL || 'http://127.0.0.1:4194');
assert.ok(['http:', 'https:'].includes(entry.protocol));
entry.searchParams.set('qa', '');
const pairs = [['garrus', 'wrex'], ['liara', 'tali'], ['ashley', 'kaidan']];
const companions = pairs.flat(), sha = bytes => createHash('sha256').update(bytes).digest('hex');
const out = new URL('test-results/', root);
await Promise.all(['test-results/', 'docs/qa/', 'docs/screenshots/'].map(path => mkdir(new URL(path, root), { recursive: true })));
const profile = await mkdtemp(fileURLToPath(new URL(`${prefix}-profile-`, out)));
const started = Date.now(), report = {
  schemaVersion: 1, at: new Date().toISOString(), passed: false, baselineCommit: baseMain,
  sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: fileURLToPath(root), encoding: 'utf8' }).trim(),
  url: entry.href, buildKind: 'production-dist',
  scope: 'Three public ME1 squad journeys: Garrus/Wrex, Liara/Tali and Ashley/Kaidan. Explicit Node-prepared fixtures place all six recruited companions after Therum and before Virmire. The browser selects each pair aboard Normandy, imports a separately declared Feros deployment, issues at least one real native shot per companion, exports actual saves and completely closes/reopens Chromium to resume the unchanged pre-combat save. This public journey does not force or claim all24 poses; isolated renderer checks cover those separately. No original1:1 artistic fidelity, complete source mission, played-through recruitment or device-performance claim.',
  command: { script: 'node scripts/companion-combat-production.mjs', environment: {
    GAME_URL: entry.href, COMPANION_BASE_MAIN: baseMain,
    PLAYWRIGHT_EXECUTABLE_PATH: process.env.PLAYWRIGHT_EXECUTABLE_PATH || null,
  } },
  profile: { fresh: true, path: profile, launches: 0, completeShutdowns: 0 },
  tools: { node: process.version, chromium: null }, sources: {}, buildFiles: {}, servedFiles: [],
  fixtures: [], exports: [], squads: [], nativeOrders: [], canvases: [], screenshots: [], activations: [], checks: [],
  pageAtlasRequests: [], sourceRequests: [], errors: [], failedRequests: [], limitations: [
    'Recruitment and completed chapters are prepared with native Node state functions, not played through in Chromium.',
    'Feros deployment changes only zone/position in a separately declared valid fixture based on the latest actual export.',
    'Combat is intentionally left unresolved, then the real pre-combat automatic save is resumed. No encounter reward is claimed.',
    'Only public native actions occur here; no exact24-pose coverage is inferred from ordinary combat screenshots.',
    'Canvas reads inspect actual WebGL pixels but do not expose private world/actor objects or certify original likeness.',
  ],
};
let context, page;
const pendingResponses = [];
const action = (name, id) => page.locator(`[data-do="${name}"]${id === undefined ? '' : `[data-id="${id}"]`}`).first();
const record = (name, details = {}) => { report.checks.push({ name, passed: true, ...details }); console.log(JSON.stringify({ check: name })); };
const stable = (state, omit = []) => {
  const result = structuredClone(state); delete result.playedSeconds;
  for (const key of omit) delete result[key];
  return result;
};
const canonical = state => { const decoded = decodeSave(encodeSave(state)); assert.ok(decoded, 'Prepared state passes the native validator.'); return decoded; };

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
    headless: true, acceptDownloads: true, viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  report.profile.launches++; report.tools.chromium = context.browser()?.version() || null;
  page = context.pages()[0] || await context.newPage(); page.setDefaultTimeout(45000);
  const launch = report.profile.launches;
  page.on('pageerror', error => report.errors.push({ launch, message: error.message }));
  page.on('requestfailed', request => report.failedRequests.push({ launch, url: request.url(), error: request.failure()?.errorText }));
  page.on('request', request => {
    const path = new URL(request.url()).pathname;
    if (/^\/(?:src|@vite|@fs)\//.test(path)) report.sourceRequests.push({ launch, url: request.url() });
  });
  page.on('response', response => {
    if (response.status() >= 400) report.failedRequests.push({ launch, url: response.url(), status: response.status() });
    const path = new URL(response.url()).pathname.slice(1);
    if (/^assets\/companion-(?:garrus|wrex|liara|tali|ashley|kaidan)-combat\.png$/.test(path)) {
      pendingResponses.push((async () => {
        const bytes = await response.body();
        assert.equal(response.status(), 200); assert.equal(sha(bytes), report.buildFiles[path]?.sha256);
        report.pageAtlasRequests.push({ launch, path, status: response.status(), bytes: bytes.length, sha256: sha(bytes) });
      })());
    }
  });
  const response = await page.goto(entry.href, { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200); assert.equal(sha(await response.body()), report.buildFiles['index.html'].sha256);
  await noHarness();
}

async function shutdown() {
  if (!context) return;
  await page.waitForLoadState('networkidle'); await Promise.all(pendingResponses.splice(0));
  const browser = context.browser(); await context.close(); context = null;
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

async function prepared(state, label, origin) {
  const validated = canonical(state), bytes = Buffer.from(encodeSave(validated));
  const path = `docs/qa/${prefix}-${label}-fixture.json`; await writeFile(new URL(path, root), bytes);
  const metadata = { label, path, bytes: bytes.length, sha256: sha(bytes), origin, party: validated.party,
    zone: validated.zone, position: validated.position, completed: validated.completed, recruited: validated.recruited,
    lost: validated.lost, importedViaPublicChooser: false };
  report.fixtures.push(metadata); return { state: validated, bytes, metadata };
}

async function importFixture(fixture) {
  const chooser = page.waitForEvent('filechooser'); await activate(action('import'));
  await (await chooser).setFiles({ name: fixture.metadata.path.split('/').pop(), mimeType: 'application/json', buffer: fixture.bytes });
  await worldReady(); fixture.metadata.importedViaPublicChooser = true;
  assert.ok((await page.locator('#hud .explore-party').innerText()).includes(fixture.state.name));
}

async function exported(label) {
  const downloadEvent = page.waitForEvent('download'); await activate(action('export'));
  const download = await downloadEvent, path = `docs/qa/${prefix}-${label}-save.json`;
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

async function selectPair(pair, label) {
  await activate(action('squad')); await action('crew-confirm').waitFor({ state: 'visible' });
  const selected = await page.locator('.crew-card.selected').evaluateAll(nodes => nodes.map(node => node.dataset.id));
  for (const id of selected) await activate(action('crew-select', id));
  for (const id of pair) await activate(action('crew-select', id));
  assert.deepEqual(await page.locator('.crew-card.selected').evaluateAll(nodes => nodes.map(node => node.dataset.id)).then(ids => ids.sort()), [...pair].sort());
  await screenshot(`${label}-normandy-selected`); await activate(action('crew-confirm')); await worldReady();
  await canvasPixels(`${label}-normandy`);
}

async function nativeCompanionShots(pair, label) {
  await page.locator('#battle-ui .battle-shell').waitFor({ state: 'visible' });
  assert.deepEqual(await page.locator('.battle-member').evaluateAll(nodes => nodes.map(node => node.dataset.id)), ['shepard', ...pair]);
  const pending = new Set(pair); let orders = 0;
  while (pending.size && orders++ < 16) {
    await page.waitForFunction(() => !!document.querySelector('.battle-member.ready'), null, { timeout: 20000 });
    const ready = await page.locator('.battle-member.ready').evaluateAll(nodes => nodes.map(node => node.dataset.id));
    const id = ready.find(id => pending.has(id)) || ready[0];
    await activate(action('battle-actor', id));
    const shoot = action('battle-action', 'shoot');
    if (!await shoot.isEnabled()) {
      assert.equal(pending.has(id), false, 'A required companion shot must be naturally available.');
      await activate(action('battle-action', 'cover')); continue;
    }
    const before = await page.locator(`#combat-${id} [data-stat="atb"]`).evaluate(node => Number.parseFloat(node.style.width));
    assert.ok(before >= 99.999); await activate(shoot);
    const target = page.locator('[data-do="battle-target"]:not(:disabled)').first(), targetId = await target.getAttribute('data-id');
    const oldTarget = await target.innerText(); await activate(target);
    await page.waitForFunction(id => Number.parseFloat(document.querySelector(`#combat-${id} [data-stat="atb"]`)?.style.width) < 20, id);
    const after = await page.locator(`#combat-${id} [data-stat="atb"]`).evaluate(node => Number.parseFloat(node.style.width));
    const log = await page.locator('#hud .combat-log').innerText();
    report.nativeOrders.push({ pair: label, actorId: id, actionId: 'shoot', targetId, atbBefore: before, atbAfter: after,
      targetTextBefore: oldTarget, publicLogAfter: log, nativeActivation: true, requiredCompanion: pending.has(id) });
    if (pending.has(id)) { pending.delete(id); await screenshot(`${label}-${id}-native-shot`); }
  }
  assert.equal(pending.size, 0); await canvasPixels(`${label}-public-battle`);
  await screenshot(`${label}-public-battle`); await noHarness();
}

try {
  const sourcePaths = ['src/world.js', 'src/main.js', 'src/state.js', 'src/combat.js', 'vite.config.js',
    'scripts/companion-combat-production.mjs', ...companions.flatMap(id =>
      [`public/assets/companion-${id}-animation.json`, `public/assets/companion-${id}-combat.png`])];
  for (const path of sourcePaths) report.sources[path] = sha(await readFile(new URL(path, root)));
  await tree(dist); report.buildManifestSha256 = sha(JSON.stringify(report.buildFiles));
  const fixture = newGame({ name: 'QA compagnons ME1', difficulty: 'story', mode: 'wait' });
  fixture.flags.briefed = true; fixture.settings.sound = false; fixture.settings.reducedMotion = true;
  for (const zone of ['eden-prime', 'citadel', 'therum']) {
    fixture.zone = zone;
    if (zone === 'citadel') for (const id of ['garrus', 'tali', 'wrex']) assert.equal(recruit(fixture, id), true);
    else for (const id of zoneEncounters(zone)) assert.equal(winEncounter(fixture, id), true);
    assert.equal(completeZone(fixture, zone), true);
  }
  fixture.zone = 'normandy'; fixture.position = null;
  let normandyFixture = await prepared(fixture, 'initial-normandy',
    'Explicit Node setup using newGame, native winEncounter/completeZone/recruit for Eden Prime, Citadel and Therum. These campaign events and recruitments are NOT claimed as played in Chromium.');
  assert.deepEqual(normandyFixture.state.completed, ['eden-prime', 'citadel', 'therum']);
  assert.deepEqual(normandyFixture.state.lost, ['jenkins']);
  assert.ok(companions.every(id => normandyFixture.state.recruited.includes(id)));
  await launch();
  const html = await readFile(new URL('index.html', dist), 'utf8');
  const servedPaths = new Set(['index.html', ...[...html.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))"/g)]
    .map(match => new URL(match[1], entry).pathname.slice(1)), ...companions.map(id => `assets/companion-${id}-combat.png`)]);
  for (const path of servedPaths) {
    assert.ok(report.buildFiles[path], `Built resource exists: ${path}`);
    const response = await context.request.get(new URL(path, entry).href); assert.equal(response.status(), 200);
    const bytes = await response.body(); assert.equal(sha(bytes), report.buildFiles[path].sha256);
    if (path.endsWith('-combat.png')) assert.equal(sha(bytes), report.sources[`public/${path}`]);
    report.servedFiles.push({ path, status: 200, bytes: bytes.length, sha256: sha(bytes), matchesDist: true });
  }
  record('Compiled HTML/JS/CSS and six exact native atlas PNGs return HTTP200 with hashes matching dist and inspected source files');
  for (const pair of pairs) {
    const label = pair.join('-');
    await importFixture(normandyFixture); await pause(); const before = await exported(`${label}-before-selection`);
    await resume(); await selectPair(pair, label); await pause(); const selected = await exported(`${label}-selected`);
    assert.deepEqual(selected.party, ['shepard', ...pair]);
    assert.deepEqual(stable(selected, ['party', 'position']), stable(before, ['party', 'position']));
    await resume(); await shutdown(); await launch();
    await activate(action('continue')); await worldReady(); await pause(); const resumed = await exported(`${label}-selected-resumed`);
    assert.deepEqual(stable(resumed), stable(selected));
    record(`${label}: public squad selection survives a complete Chromium shutdown/restart without inventory, equipment or progression changes`);
    const deployed = structuredClone(resumed); deployed.zone = 'feros'; deployed.position = { x: 5, z: 6 };
    const deployment = await prepared(deployed, `${label}-feros`,
      'Separately declared Feros encounter1 deployment based on the latest real resumed export; only zone and position changed in Node. Therum stays completed and all six companions remain recruited before Virmire.');
    assert.deepEqual(stable(deployment.state, ['zone', 'position']), stable(resumed, ['zone', 'position']));
    await importFixture(deployment); await pause(); const precombat = await exported(`${label}-precombat`);
    assert.deepEqual(stable(precombat, ['position']), stable(deployment.state, ['position']));
    await resume();
    const interaction = page.locator('#hud .interaction[data-do="interact"]');
    await interaction.waitFor({ state: 'visible' }); assert.match(await interaction.innerText(), /Barrage geth/);
    await activate(interaction); await nativeCompanionShots(pair, label);
    await shutdown(); await launch(); await activate(action('continue')); await worldReady();
    await pause(); const recovered = await exported(`${label}-precombat-resumed`);
    assert.deepEqual(stable(recovered), stable(precombat)); assert.equal(recovered.cleared.includes('feros:encounter-1'), false);
    assert.deepEqual(recovered.inventory, precombat.inventory); assert.deepEqual(recovered.party, ['shepard', ...pair]);
    report.squads.push({ pair, selectionExportPreservedExceptPartyAndElapsedTime: true, selectedRestartExactExceptElapsedTime: true,
      nativeCompanionShots: pair.map(id => report.nativeOrders.find(order => order.pair === label && order.actorId === id && order.requiredCompanion)),
      precombatRestartExactExceptElapsedTime: true, noBattleRewardClaimed: true });
    record(`${label}: both companions issue native public shots; Continue restores the exact pre-combat inventory, party and progression`);
    const next = structuredClone(recovered); next.zone = 'normandy'; next.position = null;
    if (pair !== pairs.at(-1)) normandyFixture = await prepared(next, `${label}-return-normandy`,
      'Explicit Node return to Normandy based on the latest real pre-combat recovery export; no mission reward or recruitment added.');
  }
  await Promise.all(pendingResponses.splice(0));
  assert.deepEqual([...new Set(report.nativeOrders.filter(order => order.requiredCompanion).map(order => order.actorId))].sort(), [...companions].sort());
  assert.deepEqual([...new Set(report.pageAtlasRequests.map(item => item.path))].sort(), companions.map(id => `assets/companion-${id}-combat.png`).sort());
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []); assert.deepEqual(report.sourceRequests, []);
  await noHarness(); await shutdown(); assert.equal(report.profile.launches, 7); assert.equal(report.profile.completeShutdowns, 7);
  record('All six companion atlas PNGs were requested by the actual compiled page; seven real browser launches/shutdowns and no JS/HTTP/source/harness errors');
  report.passed = true;
} catch (error) {
  report.failure = error.stack || String(error); console.error(report.failure); process.exitCode = 1;
  if (page && !page.isClosed()) await screenshot('failure').catch(() => {});
} finally {
  if (context) await shutdown().catch(error => { report.closeError = error.message; });
  report.finishedAt = new Date().toISOString(); report.elapsedSeconds = Math.round((Date.now() - started) / 10) / 100;
  const path = `docs/qa/${prefix}-report.json`; await writeFile(new URL(path, root), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, squads: report.squads.length,
    nativeOrders: report.nativeOrders.length, screenshots: report.screenshots.length, path }));
}
