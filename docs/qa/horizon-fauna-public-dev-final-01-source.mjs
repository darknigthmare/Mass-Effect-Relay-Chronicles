// Public optional assignment journey. Earlier main-story progression and two
// position-only fixture transfers are explicitly declared, never claimed played.
import assert from 'node:assert/strict';
import { readFile, writeFile, access, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { newGame, zoneEncounters, winEncounter, completeZone, recruit, encodeSave, decodeSave } from '../src/state.js';
import { recordVisit } from '../src/story.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { getLevelLayout } from '../src/level-layout-data.js';

const root = new URL('../', import.meta.url), mode = process.env.HORIZON_FAUNA_MODE || 'dev';
const prefix = process.env.HORIZON_FAUNA_PREFIX;
assert.ok(['dev', 'production'].includes(mode));
assert.match(prefix || '', /^horizon-fauna-public-[a-z0-9-]+$/, 'Choose a new prefix for every attempt.');
const entry = new URL(process.env.GAME_URL || 'http://127.0.0.1:4181');
assert.equal(entry.search, '');
const reportPath = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(reportPath); throw Error('Preserve this existing report and choose a fresh prefix.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { passed: false, at: new Date().toISOString(), mode, url: entry.href,
  command: { script: 'node scripts/horizon-fauna-public.mjs', environment: { HORIZON_FAUNA_MODE: mode,
    HORIZON_FAUNA_PREFIX: prefix, GAME_URL: entry.href, PLAYWRIGHT_EXECUTABLE_PATH: process.env.PLAYWRIGHT_EXECUTABLE_PATH || null } },
  scope: 'Actual public Davin dialogue/mission link, one naturally played optional three-enemy victory, report/rewards once, native exports and real reload. Two position-only transfers use the actual prior public export as their origin.',
  sourceHashes: {}, distFiles: {}, servedFiles: [], fixtures: [], exports: [], captures: [], checks: [], orders: [],
  errors: [], failedRequests: [], consoleErrors: [], sourceRequests: [], resourceWarnings: [],
  limitations: ['Earlier Eden/Citadel progression and the first Feros encounter are prepared in Node through native callbacks, not played in this browser.',
    'The walks from Davin to the pack and back are not played: position-only fixtures are derived from actual public exports. Native A* geometry coverage is separate.',
    'Three opponents condense the source-described pack; no exact original enemy count, attack damage or reward is certified.',
    'Creature body poses are static prototypes. This does not certify original locomotion, anatomy, biting animations or physical-device performance.'] };
let browser, context, page;
const action = name => page.locator(`[data-do="${name}"]`).first();
const check = name => { report.checks.push({ name, passed: true }); console.log(JSON.stringify({ check: name })); };
const stable = state => { const copy = structuredClone(state); delete copy.playedSeconds; return copy; };
async function tree(directory, prefix = '') {
  const result = {};
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + item.name, target = new URL(item.name + (item.isDirectory() ? '/' : ''), directory);
    if (item.isDirectory()) Object.assign(result, await tree(target, name + '/'));
    else { const bytes = await readFile(target); result[name] = { bytes: bytes.length, sha256: sha(bytes) }; }
  }
  return result;
}
async function activate(button) {
  await button.waitFor({ state: 'visible' }); assert.equal(await button.isEnabled(), true);
  await button.scrollIntoViewIfNeeded(); await button.focus(); await page.keyboard.press('Enter');
}
async function ready() {
  await page.locator('#hud:not(.hidden) .location h2').waitFor();
  await page.locator('#transition.active').waitFor({ state: 'hidden' });
  await page.locator('#overlay .screen, #overlay .dialogue').waitFor({ state: 'hidden' });
}
async function noHarness() {
  const value = await page.evaluate(() => ({ own: Object.hasOwn(window, '__RELAY_TEST__'), value: typeof window.__RELAY_TEST__, vite: !!document.querySelector('script[src*="/@vite/client"]') }));
  assert.deepEqual(value, { own: false, value: 'undefined', vite: mode === 'dev' });
}
async function capture(label) {
  const path = `docs/screenshots/${prefix}-${label}.png`, bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)), animations: 'disabled' });
  report.captures.push({ label, path, sha256: sha(bytes), bytes: bytes.length, source: 'Actual public viewport; no private state, CSS, pose or scene injection.' });
}
async function fixture(state, label, origin) {
  const path = `docs/qa/${prefix}-${label}-fixture.json`, bytes = encodeSave(state);
  assert.ok(decodeSave(bytes)); await writeFile(new URL(path, root), bytes);
  const value = { path, bytes: Buffer.from(bytes), state, origin, sha256: sha(bytes), importedViaPublicChooser: false };
  report.fixtures.push({ path, origin, sha256: value.sha256, position: state.position, operation: state.operations.records['feros-varrens'] || null });
  return value;
}
async function imported(value) {
  if (!await action('import').isVisible()) {
    await ready(); await activate(action('pause')); await activate(action('quit'));
  }
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), activate(action('import'))]);
  await chooser.setFiles({ name: value.path.split('/').at(-1), mimeType: 'application/json', buffer: value.bytes });
  await ready(); await noHarness(); value.importedViaPublicChooser = true;
  report.fixtures.find(item => item.path === value.path).importedViaPublicChooser = true;
}
async function exported(label) {
  await ready(); await activate(action('pause')); await activate(action('save'));
  const [download] = await Promise.all([page.waitForEvent('download'), activate(action('export'))]);
  const path = `docs/qa/${prefix}-${label}-save.json`; await download.saveAs(fileURLToPath(new URL(path, root)));
  assert.equal(await download.failure(), null);
  const bytes = await readFile(new URL(path, root)), state = decodeSave(bytes.toString('utf8')); assert.ok(state);
  const value = { label, path, sha256: sha(bytes), state };
  report.exports.push({ label, path, sha256: value.sha256, bytes: bytes.length, operation: state.operations.records['feros-varrens'], position: state.position });
  await activate(action('close')); await ready(); return value;
}
async function positionOnly(actual, position, label) {
  const state = structuredClone(actual.state), before = state.position; state.position = { ...position };
  const withoutPosition = value => { const copy = structuredClone(value); delete copy.position; return copy; };
  assert.deepEqual(withoutPosition(state), withoutPosition(actual.state));
  return fixture(state, label, { kind: 'Position-only declared transfer from actual public export', parentExport: actual.path,
    parentSHA256: actual.sha256, changedFields: [{ path: 'position', before, after: state.position }], navigationClaimed: false });
}
async function talkToDavin() {
  await ready(); await page.keyboard.press('KeyE');
  await page.locator('.dialogue[data-conversation-id="davin"]').waitFor();
  const mission = page.locator('[data-horizon-operation="feros-varrens"]'); await mission.waitFor();
  await activate(mission);
  await page.locator('.dialogue[data-operation-id="feros-varrens"]').waitFor();
}
async function playVictory() {
  const deadline = Date.now() + 600000;
  while (Date.now() < deadline && !await action('claim-victory').isVisible()) {
    if (await page.locator('[data-do="retry"]').isVisible()) throw Error('Actual optional battle ended in defeat.');
    const readyActors = await page.locator('.battle-member.ready').evaluateAll(nodes => nodes.filter(node => parseFloat(node.querySelector('[data-stat="hp-label"]')?.textContent) > 0).map(node => node.dataset.id));
    let issued = false;
    for (const actorId of readyActors) {
      const select = page.locator(`[data-do="battle-actor"][data-id="${actorId}"]`);
      await activate(select);
      const choices = ['burst', 'throw', 'warp', 'shoot', 'cover'];
      let selected;
      for (const id of choices) {
        const button = page.locator(`[data-do="battle-action"][data-id="${id}"]`);
        if (await button.isVisible() && await button.isEnabled()) { selected = id; break; }
      }
      if (!selected) continue;
      const before = await page.locator(`#combat-${actorId} [data-stat="atb"]`).evaluate(node => parseFloat(node.style.width));
      assert.ok(before >= 99.999); await activate(page.locator(`[data-do="battle-action"][data-id="${selected}"]`));
      let targetId = actorId;
      if (selected !== 'cover') {
        const targets = await page.locator('[data-do="battle-target"]:not(:disabled)').evaluateAll(nodes => nodes.map(node => node.dataset.id));
        targetId = targets.includes('feros-varrens-pack-2') ? 'feros-varrens-pack-2' : targets[0]; assert.ok(targetId);
        await activate(page.locator(`[data-do="battle-target"][data-id="${targetId}"]`));
      }
      await page.waitForFunction(id => parseFloat(document.querySelector(`#combat-${id} [data-stat="atb"]`)?.style.width) < 20, actorId);
      const log = await page.locator('#hud .combat-log').innerText();
      report.orders.push({ actorId, actionId: selected, targetId, naturallyReadyATB: before, log }); issued = true;
      if (report.orders.length === 1) await capture('first-native-order');
      break;
    }
    if (!issued) await page.waitForTimeout(200);
  }
  await action('claim-victory').waitFor(); await capture('actual-victory');
  await activate(action('claim-victory')); await ready();
}

try {
  for (const name of ['src/horizon-fauna.js', 'src/operation-data.js', 'src/operations.js', 'src/world.js', 'src/world-data.js', 'src/main.js',
    'src/horizon-ui.js', 'src/horizon-layout-data.js', 'src/horizon-characters.js', 'src/story.js', 'src/game-data.js', 'src/state.js', 'src/combat.js', 'vite.config.js',
    'public/assets/horizon-fauna.png', 'public/assets/horizon-fauna.json', 'public/assets/horizon-npcs.png', 'public/assets/horizon-npcs.json', 'scripts/horizon-fauna-public.mjs']) {
    report.sourceHashes[name] = sha(await readFile(new URL(name, root)));
  }
  if (mode === 'production') report.distFiles = await tree(new URL('dist/', root));
  const state = newGame({ name: 'QA Faune Féros', difficulty: 'story', mode: 'wait' });
  state.flags.briefed = true; state.settings.sound = false; state.settings.reducedMotion = true;
  state.zone = 'eden-prime'; recordVisit(state, 'eden-prime');
  for (const id of zoneEncounters('eden-prime')) assert.equal(winEncounter(state, id), true);
  assert.equal(completeZone(state, 'eden-prime'), true); state.zone = 'citadel'; recordVisit(state, 'citadel');
  assert.equal(recruit(state, 'tali'), true); assert.equal(completeZone(state, 'citadel'), true);
  state.zone = 'feros'; recordVisit(state, 'feros'); assert.equal(winEncounter(state, 'feros:encounter-1'), true);
  const davin = WORLD_ZONES.feros.conversationPois.find(poi => poi.conversationId === 'davin'); assert.ok(davin);
  const anchors = getLevelLayout('feros').operationAnchors['feros-varrens']; assert.ok(anchors.pack);
  state.position = { x: davin.x, z: davin.z };
  const initial = await fixture(state, 'davin-ready', { kind: 'Native Node-prepared earlier story via callbacks', playedInThisBrowser: false });
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  context = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
  page = await context.newPage(); page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('request', request => { if (/\/(?:src|@vite|@fs)\//.test(new URL(request.url()).pathname)) report.sourceRequests.push(request.url()); });
  page.on('response', response => { if (response.status() >= 400) (response.url().endsWith('/favicon.ico') ? report.resourceWarnings : report.failedRequests).push({ url: response.url(), status: response.status() }); });
  await page.goto(entry.href, { waitUntil: 'networkidle' }); await noHarness(); await imported(initial);
  for (const path of ['public/assets/horizon-fauna.png', 'public/assets/horizon-fauna.json', 'public/assets/horizon-npcs.png', 'public/assets/horizon-npcs.json']) {
    const publicPath = path.slice(7), response = await context.request.get(new URL(publicPath, entry).href), bytes = await response.body();
    assert.equal(response.status(), 200); assert.equal(sha(bytes), report.sourceHashes[path]);
    if (mode === 'production') assert.equal(sha(bytes), report.distFiles[publicPath].sha256);
    report.servedFiles.push({ path: publicPath, status: 200, sha256: sha(bytes) });
  }
  await talkToDavin(); await capture('davin-briefing'); await activate(page.locator('[data-operation-choice="accept"]')); await ready();
  const accepted = await exported('accepted'); assert.equal(accepted.state.operations.records['feros-varrens'].stage, 1);
  assert.equal(accepted.state.xp, state.xp); assert.equal(accepted.state.credits, state.credits); check('Public Davin mission link accepts without reward');
  const atPack = await positionOnly(accepted, anchors.pack, 'accepted-at-pack'); await imported(atPack);
  await page.keyboard.press('KeyE'); await page.locator('.dialogue[data-operation-id="feros-varrens"][data-step-id="pack"]').waitFor();
  await activate(page.locator('[data-operation-choice="fight"]')); await page.locator('#battle-ui .battle-shell').waitFor();
  assert.deepEqual(await page.locator('[data-do="battle-target"]').evaluateAll(nodes => nodes.map(node => node.dataset.id)), ['feros-varrens-pack-0', 'feros-varrens-pack-1', 'feros-varrens-pack-2']);
  await capture('three-native-varrens'); await playVictory();
  const won = await exported('pack-won'); const progress = won.state.operations.records['feros-varrens'];
  assert.equal(progress.stage, 2); assert.deepEqual(progress.victories, ['pack']); assert.equal(progress.pendingBattle, null);
  assert.equal(won.state.xp, accepted.state.xp); assert.equal(won.state.credits, accepted.state.credits); check('Actual three-opponent victory advances only the pending step');
  const returnFixture = await positionOnly(won, { x: davin.x, z: davin.z }, 'won-at-davin'); await imported(returnFixture);
  await talkToDavin(); await page.locator('.dialogue[data-step-id="report"]').waitFor(); await capture('davin-report');
  await activate(page.locator('[data-operation-choice="report"]')); await ready();
  const completed = await exported('reported'); assert.equal(completed.state.operations.records['feros-varrens'].stage, 3);
  assert.equal(completed.state.xp, won.state.xp + 70); assert.equal(completed.state.credits, won.state.credits + 80); assert.equal(completed.state.paragon, won.state.paragon + 4);
  await page.keyboard.press('KeyE'); await page.locator('.dialogue[data-conversation-id="davin"]').waitFor();
  assert.equal(await page.locator('[data-horizon-operation="feros-varrens"]').count(), 0);
  await activate(page.locator('[data-conversation-end]')); await ready();
  const unchanged = await exported('no-repeat');
  assert.equal(unchanged.state.xp, completed.state.xp); assert.equal(unchanged.state.credits, completed.state.credits);
  assert.deepEqual(unchanged.state.operations, completed.state.operations); check('Report pays once and the completed mission link disappears');
  await page.reload({ waitUntil: 'networkidle' }); await noHarness(); await activate(action('continue')); await ready();
  const resumed = await exported('reloaded'); assert.deepEqual(stable(resumed.state), stable(unchanged.state)); await capture('reloaded-complete');
  check('Actual automatic-save reload preserves operation, resources and rewards exactly');
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []); assert.deepEqual(report.consoleErrors, []);
  if (mode === 'production') assert.deepEqual(report.sourceRequests, []);
  for (const [path, expected] of Object.entries(report.sourceHashes)) assert.equal(sha(await readFile(new URL(path, root))), expected, `Source changed during run:${path}`);
  if (mode === 'production') assert.deepEqual(await tree(new URL('dist/', root)), report.distFiles);
  report.sourceFrozen = true; report.distFrozen = mode === 'production'; report.passed = true;
} catch (error) {
  report.failure = error.stack || String(error); process.exitCode = 1;
  if (page) try { await capture('failure'); } catch {}
} finally {
  await browser?.close(); await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, orders: report.orders.length, captures: report.captures.length, failure: report.failure }));
}
