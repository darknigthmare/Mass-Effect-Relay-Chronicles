import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import * as THREE from 'three';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { newGame, winEncounter, completeZone, recruit, encodeSave, decodeSave } from '../src/state.js';
import { recordVisit } from '../src/story.js';
import { enemiesFor } from '../src/game-data.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { EDEN_LAYOUT } from '../src/level-layout-data.js';
import { levelMapProjection } from '../src/level-map-render.js';

const root = new URL('../', import.meta.url), dist = new URL('dist/', root);
const prefix = 'eden-immersion-production', baseMain = process.env.EDEN_BASE_MAIN;
assert.match(baseMain || '', /^[0-9a-f]{40}$/);
const entry = new URL(process.env.GAME_URL || 'http://127.0.0.1:4194'); entry.searchParams.set('qa', '');
const artPaths = ['krogan', 'rachni'].flatMap(key => [`public/assets/enemy-${key}-combat.png`, `public/assets/enemy-${key}-animation.json`]);
artPaths.push('public/assets/eden-ground-grass.png', 'public/assets/eden-ground-dirt.png');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
for (const path of ['test-results/', 'docs/qa/', 'docs/screenshots/']) await mkdir(new URL(path, root), { recursive: true });
const profile = await mkdtemp(fileURLToPath(new URL(`test-results/${prefix}-profile-`, root)));
const started = Date.now(), report = { schemaVersion: 1, passed: false, at: new Date().toISOString(), baselineCommit: baseMain,
  sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: fileURLToPath(root), encoding: 'utf8' }).trim(),
  url: entry.href, buildKind: 'production-dist', command: 'EDEN_BASE_MAIN=<baseline> PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium node scripts/eden-immersion-production.mjs',
  scope: 'Public production controls: actual keyboard travel through the expanded Eden landing/patrol route, local map/radar and mobile inspection, save outside the old rectangle, page reload and complete-browser restart. Separately declared valid fixtures show freight/beacon areas and real krogan/rachni campaign encounters. No source imports, private harness, pose setter or storage injection is used in Chromium.',
  profile: { fresh: true, path: profile, viewport: { width: 1280, height: 800 }, launches: 0, completeShutdowns: 0 },
  tools: { node: process.version, chromium: null }, sources: {}, buildFiles: {}, servedFiles: [], fixtures: [], exports: [],
  walks: [], nativeOrders: [], encounters: [], reloads: [], canvases: [], screenshots: [], activations: [], checks: [],
  pageAtlasRequests: [], responseEvidenceErrors: [], sourceRequests: [], errors: [], failedRequests: [], browserEvents: [], consoleObservations: [], resourceWarnings: [],
  limitations: ['The expanded layout is an authored adaptation, not surveyed original ME1 geometry. Named landmarks do not constitute nine complete original sublevels.',
    'Only the initial main-route section is walked through public native keyboard input here. The isolated navigation proof traverses the full seven-leg route through actual WorldView updates and declares its accelerated rendering cadence.',
    'Freight, beacon and non-Eden encounters use explicit Node-prepared save fixtures, imported through the real chooser. Their prior story progression is not presented as played in Chromium.',
    'The two new enemy families retain their old mechanical profiles; eight fixed pose drawings do not recreate original movement cycles or equipment geometry.',
    'Final full-browser restart compares public UI without a new Blob download, following the independently documented Chromium154 post-restart download failure.',
    'Console messages keep their original locations; the historical missing favicon is a separate browser-icon reserve.'] };
let context, page, shuttingDown = false;
const pendingResponses = [], action = (name, id) => page.locator(`[data-do="${name}"]${id === undefined ? '' : `[data-id="${id}"]`}`).first();
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
    if (/^assets\/(?:enemy-(?:krogan|rachni)-combat|eden-ground-(?:grass|dirt))\.png$/.test(path)) {
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
  // This real public command synchronizes the periodically reported movement
  // position before comparing an export with the automatic resume packet.
  await activate(action('save'));
  const [download] = await Promise.all([page.waitForEvent('download'), activate(action('export'))]);
  const path = `docs/qa/${prefix}-${label}-save.json`;
  await download.saveAs(fileURLToPath(new URL(path, root))); assert.equal(await download.failure(), null);
  const bytes = await readFile(new URL(path, root)), state = decodeSave(bytes.toString('utf8'));
  assert.ok(state, 'A real downloaded save passes the native validator.');
  report.exports.push({ label, path, sha256: sha(bytes), bytes: bytes.length, publicSaveBeforeExport: true, source: 'Actual Sauvegarder and Exporter buttons, then Chromium download',
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
  const targetId = await target.getAttribute('data-id'), targetName = (await target.locator('span').first().textContent()).trim();
  await activate(target);
  await page.waitForFunction(id => parseFloat(document.querySelector(`#combat-${id} [data-stat="atb"]`)?.style.width) < 20, actorId);
  const atbAfter = await page.locator(`#combat-${actorId} [data-stat="atb"]`).evaluate(node => parseFloat(node.style.width));
  const log = await page.locator('#hud .combat-log').innerText();
  assert.ok(log.includes(targetName));
  report.nativeOrders.push({ label, actorId, targetId, targetName, atbBefore, atbAfter, actionId: 'shoot', log,
    method: 'Public native command and target buttons with natural ATB readiness; no clock, pose, ammunition or actor setter.' });
  await screenshot(`${label}-native-shot`); await canvasPixels(label);
}

async function radarPosition() {
  const observed = await page.locator('.minimap svg circle[r="3.5"]').evaluate(node => ({ x: Number(node.getAttribute('cx')), z: Number(node.getAttribute('cy')) }));
  const projection = levelMapProjection(EDEN_LAYOUT.bounds, { left: 12, top: 12, width: 126, height: 126 });
  return { x: EDEN_LAYOUT.bounds.minX + (observed.x - projection.originX) / projection.scale,
    z: EDEN_LAYOUT.bounds.minZ + (observed.z - projection.originZ) / projection.scale };
}
async function walkTo(target, label) {
  const right = new THREE.Vector2(27, -23).normalize(), forward = new THREE.Vector2(-23, -27).normalize();
  const choices = [];
  for (const [dx, dz, keys] of [[0,1,['KeyW']],[0,-1,['KeyS']],[1,0,['KeyD']],[-1,0,['KeyA']],
    [1,1,['KeyW','KeyD']],[-1,1,['KeyW','KeyA']],[1,-1,['KeyS','KeyD']],[-1,-1,['KeyS','KeyA']]]) {
    const direction = right.clone().multiplyScalar(dx).add(forward.clone().multiplyScalar(dz)).normalize(); choices.push({ keys, direction });
  }
  const before = await radarPosition(), samples = []; let held = [], last, deadline = Date.now() + 150000;
  try {
    while (Date.now() < deadline) {
      last = await radarPosition(); const distance = Math.hypot(target.x-last.x, target.z-last.z);
      samples.push({ ...last, distance }); if (distance <= .65) break;
      const desired = new THREE.Vector2(target.x-last.x, target.z-last.z).normalize();
      const choice = choices.reduce((best, candidate) => candidate.direction.dot(desired) > best.direction.dot(desired) ? candidate : best);
      for (const key of held) if (!choice.keys.includes(key)) await page.keyboard.up(key);
      for (const key of choice.keys) if (!held.includes(key)) await page.keyboard.down(key);
      held = choice.keys; await page.waitForTimeout(250);
    }
  } finally { for (const key of held) await page.keyboard.up(key); }
  assert.ok(last && Math.hypot(target.x-last.x,target.z-last.z)<=.65, `${label}: public native walk must reach target`);
  report.walks.push({ label, before, target, after: last, samples,
    method: 'Actual public keyboard events, natural application clock; coordinates observed only from the visible radar SVG. No actor/world setter or time stepping.' });
  console.log(JSON.stringify({ walk: label, samples: samples.length, after: last }));
}
function initialEden() {
  const state = newGame({ name: 'QA Eden immersive', difficulty: 'story', mode: 'wait' });
  state.flags.briefed = true; state.settings.sound = false; state.settings.reducedMotion = true;
  state.zone = 'eden-prime'; state.position = { ...EDEN_LAYOUT.spawn }; recordVisit(state, 'eden-prime'); return state;
}
function laterFixture(zone, index) {
  const state = initialEden();
  for (const suffix of ['encounter-1','encounter-2','boss']) assert.equal(winEncounter(state,`eden-prime:${suffix}`),true);
  assert.equal(completeZone(state,'eden-prime'),true); state.zone='citadel'; recordVisit(state,'citadel');
  for(const id of ['garrus','tali','wrex']) assert.equal(recruit(state,id),true);
  assert.equal(completeZone(state,'citadel'),true); state.zone=zone; recordVisit(state,zone);
  for(let i=0;i<index;i++) assert.equal(winEncounter(state,`${zone}:${['encounter-1','encounter-2'][i]}`),true);
  const poi=WORLD_ZONES[zone].pois.find(poi=>poi.id===`${zone}:${['encounter-1','encounter-2','boss'][index]}`);
  state.position={x:poi.x,z:poi.z};return state;
}
async function mapViews() {
  await activate(action('map')); await page.locator('.level-map-ground').waitFor();
  assert.equal(await page.locator('.local-map-board [data-map-sector]').count(),5);
  assert.equal(await page.locator('.local-map-board [data-map-route]').count(),3);
  assert.equal(await page.locator('.local-map-board .map-number').count(),7);
  await screenshot('map-desktop');
  await activate(page.locator('.map-locations [data-do="track"][data-id="eden-prime:cache"]'));
  await worldReady();
  const tracked = await page.locator('.minimap svg circle[r="4"]').count(); assert.equal(tracked,1);
  await activate(action('map')); await page.locator('.level-map-ground').waitFor();
  await page.setViewportSize({width:390,height:844});
  const mobile=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,board:document.querySelector('.local-map-board').getBoundingClientRect().width}));
  assert.equal(mobile.viewport,390);assert.ok(mobile.document<=390);assert.ok(mobile.board>=260);
  await screenshot('map-mobile');report.mobileMap=mobile;
  await page.setViewportSize({width:1280,height:800});await resume();
  assert.equal(await page.locator('.minimap [data-map-layout="eden-prime"]').count(),1);
  record('Public map and radar show the actual five-sector ground/three routes, preserve tracking and fit a390px viewport');
}
try {
  for (const path of ['src/world.js','src/world-data.js','src/eden-scene.js','src/world-navigation.js','src/level-layout-data.js',
    'src/level-map-render.js','src/main.js','src/local-map.js','src/local-map.css','src/enemy-animation-data.js','src/state.js','src/combat.js',
    'src/game-data.js','vite.config.js','scripts/eden-immersion-production.mjs',...artPaths]) report.sources[path]=sha(await readFile(new URL(path,root)));
  await tree(dist);await launch();
  for(const path of artPaths.map(path=>path.replace(/^public\//,''))){const response=await context.request.get(new URL(path,entry).href),data=await response.body();
    assert.equal(response.status(),200);assert.equal(sha(data),report.buildFiles[path].sha256);assert.equal(sha(data),report.sources[`public/${path}`]);
    report.servedFiles.push({path,status:200,sha256:sha(data),matchesDist:true});}
  const initial=await prepared(initialEden(),'landing','Explicit native newGame fixture at the new Eden spawn; no prior story victory added.');
  await importFixture(initial);await canvasPixels('landing');await screenshot('landing');
  assert.match(await page.locator('.sector-name').innerText(),/largage/i);await mapViews();
  const route=EDEN_LAYOUT.paths.find(path=>path.id==='main').points;
  for(let i=1;i<=2;i++)await walkTo({x:route[i][0],z:route[i][1]},`landing-main-${i}`);
  await pause();const checkpoint=await exported('outside-old-rectangle');assert.ok(checkpoint.position.z>21);
  await reloadContinue('outside-old-rectangle');await pause();const restored=await exported('outside-old-rectangle-restored');
  assert.deepEqual(stable(restored),stable(checkpoint));await resume();
  report.extendedPositionRestore={before:checkpoint.position,after:restored.position,exact:true,oldBoundsExceeded:true};
  for(let i=3;i<=4;i++)await walkTo({x:route[i][0],z:route[i][1]},`landing-main-${i}`);
  await screenshot('patrol-arrival');assert.match(await page.locator('.sector-name').innerText(),/patrouille/i);
  await pause();const precombat=await exported('patrol-precombat');await resume();
  await activate(page.locator('#hud .interaction[data-do="interact"]'));await nativeShot('eden-patrol');
  await reloadContinue('patrol-precombat');await pause();const recovered=await exported('patrol-resumed');
  assert.deepEqual(stable(recovered),stable(precombat));report.edenPrecombatRestore=true;
  record('Natural keyboard travel crosses the old rectangle, page reload preserves its exact export and a real patrol shot resumes its pre-combat save');
  for(const id of ['quays','beacon']){
    const state=structuredClone(recovered);state.position={...EDEN_LAYOUT.rooms.find(room=>room.id===id).center};
    const fixture=await prepared(state,id,'Separately declared public save fixture based on the actual recovered export; only location coordinates are changed.');
    await importFixture(fixture);await canvasPixels(id);await screenshot(`${id}-public`);
    const observed=await radarPosition();assert.ok(Math.hypot(observed.x-state.position.x,observed.z-state.position.z)<.1);
  }
  for(const [zone,index,key] of [['therum',2,'krogan'],['noveria',1,'rachni']]){
    const fixture=await prepared(laterFixture(zone,index),`${key}-encounter`,'Node-native completion of Eden/Citadel and earlier encounters prepares this encounter; these previous victories are not played here.');
    await importFixture(fixture);await pause();const before=await exported(`${key}-precombat`);await resume();
    await activate(page.locator('#hud .interaction[data-do="interact"]'));await page.locator('#battle-ui .battle-shell').waitFor();
    const expected=enemiesFor(zone,index,fixture.state);const observed=await page.locator('[data-do="battle-target"]').evaluateAll(nodes=>nodes.map(node=>node.dataset.id));
    assert.deepEqual(observed,expected.map(enemy=>enemy.id));await screenshot(`${key}-public-battle`);await nativeShot(key);
    await reloadContinue(key);await pause();const after=await exported(`${key}-resumed`);assert.deepEqual(stable(after),stable(before));
    report.encounters.push({zone,key,enemyIds:observed,actualNativeShot:true,exactPrecombatRestore:true,noVictoryRewardClaimed:true});
  }
  await resume();const beforeRestart=await publicPersistenceView('before-full-restart');await pause();await shutdown();await launch();
  await activate(action('continue'));await worldReady();const afterRestart=await publicPersistenceView('after-full-restart');
  assert.deepEqual(afterRestart,beforeRestart);report.fullRestart={exactPublicUI:true,noPostRestartDownloadAttempted:true,before:beforeRestart,after:afterRestart};
  await Promise.all(pendingResponses.splice(0));await noHarness();
  assert.deepEqual([...new Set(report.pageAtlasRequests.filter(item=>item.status===200).map(item=>item.path))].sort(),
    artPaths.filter(path=>path.endsWith('.png')).map(path=>path.replace(/^public\//,'')).sort());
  for(const key of ['errors','failedRequests','sourceRequests','responseEvidenceErrors'])assert.deepEqual(report[key],[]);
  assert.deepEqual(report.browserEvents.filter(event=>!event.intentional||event.type==='page-crash'),[]);
  await shutdown();assert.equal(report.profile.launches,2);assert.equal(report.profile.completeShutdowns,2);
  record('Both generated enemy families appear in real campaign encounters and retain exact pre-combat saves; a full Chromium restart preserves public party/loadout/inventory/journal');
  report.passed=true;
}catch(error){report.failure=error.stack||String(error);process.exitCode=1;console.error(report.failure);if(page&&!page.isClosed())await screenshot('failure').catch(()=>{});}
finally{if(context)await shutdown().catch(error=>{report.closeError=error.message});report.finishedAt=new Date().toISOString();
  report.elapsedSeconds=Math.round((Date.now()-started)/10)/100;await writeFile(new URL(`docs/qa/${prefix}-report.json`,root),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,walkLegs:report.walks.length,encounters:report.encounters.length,exports:report.exports.length,captures:report.screenshots.length,failure:report.failure}));}
