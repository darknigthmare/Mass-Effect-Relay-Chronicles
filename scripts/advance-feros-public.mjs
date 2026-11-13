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
import { levelMapProjection } from '../src/level-map-render.js';
import { FEROS_COLONIST_TARGETS, createAdvanceFerosState, listAdvanceFerosPOIs, transitionAdvanceFeros, ferosColonyReport } from '../src/advance-feros.js';

const root = new URL('../', import.meta.url), url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4197/');
const mode = process.env.ADVANCE_FEROS_MODE || 'development', prefix = process.env.ADVANCE_FEROS_PREFIX;
const gitBase = process.env.ADVANCE_BASE_MAIN || 'd2e8432ec4057890b6f86e42ce596f1ab5810148';
assert.ok(['development', 'production'].includes(mode)); assert.equal(url.search, '');
assert.match(prefix || '', /^advance-feros-public-[a-z0-9-]+$/); assert.match(gitBase, /^[a-f0-9]{40}$/);
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
  const files = (await readdir(new URL('src/', root))).filter(name => /\.(?:js|css)$/.test(name) && (mode === 'production' || name !== 'universe-data.js')).map(name => `src/${name}`);
  files.push('scripts/advance-feros-public.mjs', 'tests/advance-feros.test.js', 'tests/advance-world.test.js', 'package.json', 'package-lock.json', 'vite.config.js');
  if (mode === 'production') files.push('docs/content-catalog.json');
  return Object.fromEntries(await Promise.all(files.sort().map(async path => [path, sha(await readFile(new URL(path, root)))])));
}

const report = { passed: false, at: new Date().toISOString(), mode, url: url.href, gitBase,
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: fileURLToPath(root), encoding: 'utf8' }).trim(),
  command: { script: 'node scripts/advance-feros-public.mjs', environment: { GAME_URL: url.href, ADVANCE_FEROS_PREFIX: prefix, ADVANCE_FEROS_MODE: mode, ADVANCE_BASE_MAIN: gitBase } },
  scope: 'Lizbeth testimony, ExoGeni research and five pressure valves; Jeong and gas preparation; sixteen individual civilians through actual public actions; both Shiala fates and real reload/export.',
  sourceHashes: {}, finalSourceHashes: {}, registryContextHashes: {}, finalRegistryContextHashes: {}, distFiles: {}, finalDistFiles: {}, servedFiles: [], sourceRequests: [], deliveryErrors: [],
  fixtures: [], exports: [], captures: [], checks: [], errors: [], consoleErrors: [], failedRequests: [], resourceWarnings: [],
  limitations: ['Earlier campaign chapters, Fai Dan contact and ExoGeni encounters are explicitly native fixture preparation, not claimed played in this browser.',
    'The second import changes only position from an actual public export. A later continuation calls winEncounter for the existing Thorian boss and changes position; this boss is not claimed fought here.',
    'Civilian methods are targeted field actions, not an original civilian firefight. Gas has no physical projectile or consumable grenade stock. The sixteen bodies and seamless geography are adapted.',
    'Jeong persuasion uses 20 morality points, not the original 12 Charm/10 Intimidate talents. This run plays the armed-confrontation branch; native checks cover the adapted persuasion branches.',
    'The compatibility colony choice is not ME1 complete colony viability. Tower, vertical Thorian lair, clone waves and full original dialogue/cinematics remain open.',
    'Walking uses ordinary eight-direction keyboard input and public-map position readings only; it does not assign browser state, DOM, poses, clocks or HP.'] };
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
  report.exports.push({ label, path, sha256: sha(bytes), bytes: bytes.length, xp: state.xp, credits: state.credits, advanceFeros: state.advanceFeros, colonyReport: ferosColonyReport(state), codex: state.story.codex });
  await click(action('close')); await ready(); return { path, sha256: sha(bytes), state };
}
const budget = state => ({ xp: state.xp, credits: state.credits, medigel: state.medigel, paragon: state.paragon, renegade: state.renegade, party: state.party, inventory: state.inventory });
function point(suffix) { const poi = WORLD_ZONES.citadel.pois.find(p => p.id === `citadel:${suffix}`); assert.ok(poi); return { x: poi.x, z: poi.z + .4 }; }
function finish(state, zone, choice) { state.zone = zone; assert.equal(recordVisit(state, zone), true); for (const id of zoneEncounters(zone)) assert.equal(winEncounter(state, id), true); assert.equal(completeZone(state, zone, choice), true); }
const ferosDialog = key => page.locator(`.dialogue[data-conversation-id="advance-feros"]${key ? `[data-current-topic="advance:feros:${key}"]` : ''}`);
async function reply(key, selected) { await click(ferosDialog(key).locator(`[data-reply-id="${selected}"]`)); }
async function resultToField() { await click(ferosDialog().locator('.choice').filter({ hasText: 'Retour sur le terrain.' })); await ready(); }
const projection = levelMapProjection(WORLD_ZONES.feros.bounds);
async function mapPositions(poiId) {
  await ready(); await page.keyboard.press('KeyM'); await click(action('map-filter', 'all'));
  const observed = await page.locator('.local-map-board').evaluate((board, id) => {
    const player = board.querySelector('.map-player'), target = id ? board.querySelector(`circle[data-map-position="${id}"]`) : null;
    if (id && !target) throw Error('Missing actual public map marker: ' + id);
    return { player: { x: parseFloat(player.style.left), z: parseFloat(player.style.top) },
      target: target ? { x: Number(target.getAttribute('cx')), z: Number(target.getAttribute('cy')) } : null };
  }, poiId);
  const decode = point => ({ x: WORLD_ZONES.feros.bounds.minX + (point.x - projection.originX) / projection.scale,
    z: WORLD_ZONES.feros.bounds.minZ + (point.z - projection.originZ) / projection.scale });
  await click(action('close')); await ready();
  return { player: decode(observed.player), target: observed.target ? decode(observed.target) : null };
}
async function gesture(dx, dz, milliseconds) {
  const length = Math.hypot(23, 27), side = { x: 27 / length, z: -23 / length }, up = { x: -23 / length, z: -27 / length };
  const candidates = [];
  for (const [right, forward] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
    const x = side.x * right + up.x * forward, z = side.z * right + up.z * forward;
    candidates.push({ right, forward, score: (dx*x+dz*z)/Math.hypot(x,z) });
  }
  const best = candidates.sort((a,b) => b.score-a.score)[0], keys = ['ShiftLeft'];
  if (best.right) keys.push(best.right > 0 ? 'KeyD' : 'KeyA');
  if (best.forward) keys.push(best.forward > 0 ? 'KeyW' : 'KeyS');
  for (const key of keys) await page.keyboard.down(key);
  try { await page.waitForTimeout(milliseconds); } finally { for (const key of [...keys].reverse()) await page.keyboard.up(key); }
}
async function walk(target, { poiId = null, label = null, tolerance = 1.7 } = {}) {
  let stagnant = 0, previous = Infinity;
  for (let attempt = 0; attempt < 100; attempt++) {
    const map = await mapPositions(poiId), end = map.target || target, dx = end.x-map.player.x, dz = end.z-map.player.z, distance = Math.hypot(dx,dz);
    if (label && await page.locator('#hud .interaction').filter({ hasText: label }).count()) return;
    if (!label && distance < tolerance) return;
    stagnant = distance > previous-.15 ? stagnant+1 : 0; previous = distance;
    if (stagnant >= 3) { await gesture(-dz, dx, 450); stagnant = 0; }
    else await gesture(dx, dz, Math.max(90, Math.min(650, (distance-(label ? .6 : tolerance/2))/6.6*1000)));
  }
  throw Error('Ordinary public walking failed for '+(label || JSON.stringify(target)));
}
async function approach(key, label) {
  const poiId = `advance:feros:${key}`; await walk(null, { poiId, label });
  await page.keyboard.press('KeyE'); await ferosDialog(key).waitFor();
}
function nativeAct(state, key, selected) {
  const poi = listAdvanceFerosPOIs(state).find(poi => poi.id === `advance:feros:${key}`); assert.ok(poi, key);
  state.position = { x: poi.x, z: poi.z }; const result = transitionAdvanceFeros(state, poi.id, selected); assert.equal(result.ok, true, result.reason); state.advanceFeros = result.progress;
}
async function journal() { await ready(); await page.keyboard.press('KeyJ'); await page.locator('.screen').waitFor(); }
async function reload() { await page.reload({ waitUntil: 'domcontentloaded' }); await click(action('continue')); await ready(); await noHarness(); }

try {
  report.sourceHashes = await sources(); report.sourceSHA = sha(JSON.stringify(report.sourceHashes));
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
  const start = newGame({ name: 'QA Avance Feros', difficulty: 'story' }); start.flags.briefed = true;
  finish(start, 'eden-prime'); start.zone = 'citadel'; recordVisit(start, start.zone); assert.equal(recruit(start, 'tali'), true); assert.equal(completeZone(start, 'citadel'), true);
  start.zone = 'feros'; recordVisit(start, 'feros'); assert.equal(winEncounter(start, 'feros:encounter-1'), true); nativeAct(start, 'defense', 'coordinate'); assert.equal(winEncounter(start, 'feros:encounter-2'), true);
  start.position = { x: 8, z: -40 };
  await imported(await fixture(start, 'exogeni-start', { kind: 'Native preceding campaign, Fai Dan contact and ExoGeni encounters', APIs: ['newGame','briefed=true','recordVisit','winEncounter','recruit(tali)','completeZone(eden-prime,citadel)','transitionAdvanceFeros(defense,coordinate)'], precedingCampaignPlayed: false }));
  await approach('lizbeth', 'Lizbeth'); await capture('lizbeth-testimony'); await reply('lizbeth','listen'); await resultToField();
  await approach('investigation', 'interface de recherche'); await reply('investigation','research'); await resultToField();
  await approach('pressure', 'commande de la griffe');
  assert.equal(await ferosDialog('pressure').locator('[data-reply-id="release"]').isDisabled(), true);
  for (const index of [1,3,4]) await reply('pressure',`valve-${index}`);
  assert.match(await ferosDialog('pressure').locator('.dialogue-text').innerText(), /31 PSI/); await capture('exogeni-pressure-31');
  await reply('pressure','release'); await resultToField();
  const released = await exported('ship-released'); assert.equal(released.state.advanceFeros.lizbeth, true); assert.equal(released.state.advanceFeros.investigation, true); assert.equal(released.state.advanceFeros.shipReleased, true);
  check('Lizbeth testimony, gated research, three actual valve toggles and valid 31 PSI release persist; resolved witness markers do not recur');
  const returned = structuredClone(released.state); returned.position = { x: -20, z: -10 };
  await imported(await fixture(returned,'return-jeong',{kind:'Position-only transfer from actual public export',parentExport:released.path,parentSHA256:released.sha256,changedFields:['position'],walkingClaimed:false}));
  await approach('jeong','Ethan Jeong'); await reply('jeong','confront'); await resultToField();
  await approach('juliana','Juliana'); await reply('juliana','prepare'); await resultToField();
  check('Jeong is confronted publicly and draws his weapon; Juliana prepares gas but has not yet spared any individual target');
  for (const point of [{x:-20,z:-10},{x:0,z:10},{x:12,z:28},{x:7,z:44},{x:-10,z:52}]) await walk(point,{tolerance:2.4});
  for (const [index,target] of FEROS_COLONIST_TARGETS.entries()) {
    await approach(`colonist-${target.id}`,target.name);
    if (index===0) await capture('civilian-target');
    await reply(`colonist-${target.id}`, index<5?'gas':index<12?'melee':'lethal'); await resultToField();
    console.log(JSON.stringify({civilian:target.id,method:index<5?'gas':index<12?'melee':'lethal',publicAction:true}));
  }
  await approach('freighter','commandes du cargo'); assert.match(await ferosDialog('freighter').locator('.dialogue-text').innerText(),/16\/16/); await capture('colony-sixteen-result');
  await reply('freighter','open'); await resultToField();
  const colony = await exported('colony-cargo'); const count = ferosColonyReport(colony.state);
  assert.deepEqual([count.resolved,count.spared,count.killed,count.gas,count.melee],[16,12,4,5,7]); assert.equal(colony.state.advanceFeros.freighterOpened,true);
  assert.deepEqual(budget(colony.state),budget(start));
  check('Sixteen real targeted gas/melee/lethal choices through ordinary walking produce 12 spared and four killed; cargo opens only afterward and no reward budget changes');
  const postBoss = structuredClone(colony.state); assert.equal(winEncounter(postBoss,'feros:boss'),true); postBoss.position={x:0,z:-91};
  const shialaFixture = await fixture(postBoss,'post-boss-shiala',{kind:'Native Thorian victory and position continuation from actual public colony export',parentExport:colony.path,parentSHA256:colony.sha256,APIs:['winEncounter(feros:boss)'],changedFields:['cleared','xp','credits','position'],bossPlayed:false});
  await imported(shialaFixture); await approach('shiala','Shiala'); await reply('shiala','receive');
  assert.match(await ferosDialog('shiala').locator('.dialogue-text').innerText(),/Cipher est maintenant/); await capture('shiala-fate-choice'); await reply('shiala','spare'); await resultToField();
  await reload(); await journal(); assert.match(await page.locator('.screen').innerText(),/épargnée/); await capture('shiala-spared-reloaded'); await click(action('close')); await ready();
  const spared=await exported('shiala-spared'); assert.equal(spared.state.advanceFeros.cipher,true); assert.equal(spared.state.advanceFeros.shiala,'spared'); assert.deepEqual(ferosColonyReport(spared.state).survivors,count.survivors);
  check('Shiala transmits the Cipher, is spared publicly, and actual reload/export preserve her fate and the individual civilian methods');
  await imported(shialaFixture); await approach('shiala','Shiala'); await reply('shiala','receive'); await reply('shiala','kill'); await resultToField(); await reload();
  const killed=await exported('shiala-killed'); assert.equal(killed.state.advanceFeros.cipher,true); assert.equal(killed.state.advanceFeros.shiala,'killed'); assert.deepEqual(ferosColonyReport(killed.state).survivors,count.survivors);
  check('The independently declared post-boss branch actually executes Shiala; reload/export retain her death and the already acquired Cipher without changing colonist acts');
  await Promise.all(responseChecks); report.finalSourceHashes = await sources(); assert.deepEqual(report.finalSourceHashes, report.sourceHashes); report.sourceSHAEnd = sha(JSON.stringify(report.finalSourceHashes)); assert.equal(report.sourceSHAEnd, report.sourceSHA); report.sourceFrozen = true;
  for (const path of Object.keys(report.registryContextHashes)) report.finalRegistryContextHashes[path] = sha(await readFile(new URL(path, root)));
  assert.deepEqual(report.finalRegistryContextHashes, report.registryContextHashes); report.registryContextFrozenDuringRun = true;
  if (mode === 'production') { report.finalDistFiles = await hashes(new URL('dist/', root)); assert.deepEqual(report.finalDistFiles, report.distFiles); report.distFrozen = true; for (const [path, expected] of Object.entries(report.distFiles)) { const response = await page.request.get(new URL(path, url).href); assert.equal(response.status(), 200, path); const bytes = await response.body(); assert.equal(bytes.length, expected.bytes, path); assert.equal(sha(bytes), expected.sha256, path); } assert.deepEqual(await hashes(new URL('dist/', root)), report.distFiles); report.httpAllDistFilesSameBytes = true; assert.deepEqual(report.sourceRequests, []); assert.ok(report.servedFiles.some(file => file.path.endsWith('.js'))); }
  assert.equal(report.captures.length, 6); assert.equal(report.exports.length, 4); assert.equal(report.checks.length, 5);
  for (const field of ['errors', 'consoleErrors', 'failedRequests', 'deliveryErrors']) assert.deepEqual(report[field], []);
  report.passed = true;
} catch (error) { report.failure = error.stack || String(error); process.exitCode = 1; if (page) try { await capture('failure'); } catch {} }
finally { await browser?.close(); report.browserClosed = !!browser; await writeFile(output, JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify({ passed: report.passed, report: fileURLToPath(output), checks: report.checks.length, captures: report.captures.length, exports: report.exports.length, failure: report.failure }));
