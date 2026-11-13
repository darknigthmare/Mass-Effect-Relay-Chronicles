// Public scenery-cover, retreat and trusted-focus collector. Native preparation
// is limited to the briefing, visit and starting position. No app state getter,
// HP/ATB/clock edit, QA query, forced frame rate or simulated focus event.
import assert from 'node:assert/strict';
import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { newGame, encodeSave, decodeSave } from '../src/state.js';
import { recordVisit } from '../src/story.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { RETREAT_CLEARANCE, RETREAT_RECOVERY_SECONDS } from '../src/completion-world.js';
import { featureSourceFiles, sourceHashes as readSourceHashes, snapshot, sha } from './completion-evidence.mjs';

const root = new URL('../', import.meta.url), url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4191/');
const mode = process.env.COMPLETION_TACTICAL_MODE || 'development', prefix = process.env.COMPLETION_TACTICAL_PREFIX;
assert.ok(['development', 'production'].includes(mode)); assert.equal(url.search, '');
assert.match(prefix || '', /^completion-controls-tactical-[a-z0-9-]+$/);
const output = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(output); throw Error('Use a new prefix; preserve earlier attempts.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const report = { passed: false, at: new Date().toISOString(), mode, url: url.href,
  command: { script: 'node scripts/completion-controls-tactical.mjs', environment: { GAME_URL: url.href, COMPLETION_TACTICAL_MODE: mode, COMPLETION_TACTICAL_PREFIX: prefix } },
  scope: 'Short compact tactical UI diagnostic after naturally charged cover and next-actor selection; visible coordinated draft preparation/removal without execution. Desktop 1280x800 and phone390x844, declared standard virtual Gamepad API for native details help. Original context: Real first Eden Story/Wait combat: naturally prepared/reserved gauges, geometric cover, one full-gauge cover cost, public retreat confirmation and actual save/reload. Native trusted blur/focus pauses movement and a separate Story/Active battle; explicit resume only. No victory is claimed.',
  sourceHashes: {}, sourceSnapshots: [], distFiles: {}, fixtures: [], exports: [], captures: [], checks: [], observations: [],
  errors: [], consoleErrors: [], failedRequests: [], resourceWarnings: [], sourceRequests: [],
  limitations: ['The briefing, Eden visit and initial positions are declared native fixtures; no preceding traversal is claimed played.',
    'The public encounter is neither won nor rewarded. Gauges charge naturally and are reserved/released only through public controls.',
    'After an order the UI selects another ready actor. The collector attributes the post-order help only to that displayed actor; Shepard cover activation/direction are separately proven by native tests and the real pose capture, not by a private cover flag.',
    'This flow does not spend medi-gel; it verifies the actual unchanged reserve. It does not demonstrate non-refunding an already consumed dose; that clause requires separate evidence.',
    'This run does not play the eight-second foreground recovery/re-engagement boundary, force or accelerate that timer, or claim its persistence through reload. Certification of that boundary requires separate evidence.',
    'Focus emulation is disabled after navigation on both tabs. Trusted native blur/focus is observed; headless tabs may remain visible, so all OS visibility transitions are not certified.',
    'The separate combat-focus fixture uses native Active mode, as in priority-focus-public.mjs, so an already ready Wait gauge cannot be mistaken for suspension by blur. Cover and retreat use native Wait mode.',
    'Scene-unit cover and paths remain an ATB adaptation. No physical hardware, target-device FPS, original ballistics or artistic fidelity is certified.'] };
let browser, page, other;
const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
const click = async locator => { await locator.waitFor({ state: 'visible' }); assert.equal(await locator.isEnabled(), true); await locator.click(); };
const check = name => { report.checks.push({ name, passed: true }); console.log(JSON.stringify({ check: name })); };
async function tree(directory, prefix = '') {
  const files = {};
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + item.name, target = new URL(item.name + (item.isDirectory() ? '/' : ''), directory);
    if (item.isDirectory()) Object.assign(files, await tree(target, name + '/'));
    else { const bytes = await readFile(target); files[name] = { bytes: bytes.length, sha256: sha(bytes) }; }
  } return files;
}
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
  report.captures.push({ label, path, sha256: sha(bytes), bytes: bytes.length, source: 'Actual public viewport; no DOM/style/pose injection or forced frame cadence.' });
}
async function fixture(label, position, battleMode = 'wait') {
  const state = newGame({ name: 'QA Terrain', difficulty: 'story', mode: battleMode });
  state.flags.briefed = true; state.zone = 'eden-prime'; assert.equal(recordVisit(state, state.zone), true); state.position = { x: position.x, z: position.z };
  const bytes = Buffer.from(encodeSave(state)); assert.ok(decodeSave(bytes.toString()));
  const path = `docs/qa/${prefix}-${label}-fixture.json`; await writeFile(new URL(path, root), bytes);
  const record = { label, path, sha256: sha(bytes), position: state.position, battleMode, importedViaPublicChooser: false,
    origin: `newGame Story/${battleMode}; briefing flag, native recorded Eden visit and position only. No HP/ATB/clock or progression edits.` };
  report.fixtures.push(record); return { record, bytes };
}
async function imported(value) {
  await page.bringToFront();
  if (!await action('import').isVisible()) { await page.locator('.pause-screen').waitFor(); await click(action('quit')); }
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), click(action('import'))]);
  await chooser.setFiles({ name: value.record.path.split('/').at(-1), mimeType: 'application/json', buffer: value.bytes });
  value.record.importedViaPublicChooser = true; await ready(); await noHarness();
}
async function exported(label, { pauseAlreadyOpen = false, keepOpen = false } = {}) {
  if (!pauseAlreadyOpen) { await ready(); await page.keyboard.press('Escape'); }
  await page.locator('.pause-screen').waitFor(); await click(action('save'));
  const [download] = await Promise.all([page.waitForEvent('download'), click(action('export'))]);
  const path = `docs/qa/${prefix}-${label}-export.json`; await download.saveAs(fileURLToPath(new URL(path, root))); assert.equal(await download.failure(), null);
  const bytes = await readFile(new URL(path, root)), state = decodeSave(bytes.toString()); assert.ok(state);
  report.exports.push({ label, path, sha256: sha(bytes), bytes: bytes.length, observed: { zone: state.zone, position: state.position, xp: state.xp, credits: state.credits, medigel: state.medigel, cleared: state.cleared } });
  if (!keepOpen) { await click(action('close')); await ready(); } return state;
}
async function members() {
  return page.locator('#battle-ui .battle-member').evaluateAll(nodes => nodes.map(node => ({ id: node.dataset.id,
    atb: Number.parseFloat(node.querySelector('[data-stat="atb"]').style.width), hp: node.querySelector('[data-stat="hp-label"]').textContent,
    shield: node.querySelector('[data-stat="shield"]').style.width, heat: node.querySelector('[data-stat="heat-summary"]').textContent,
    held: node.querySelector('[data-stat="heat-summary"]').textContent.includes('Jauge réservée'), ready: node.classList.contains('ready'), active: node.classList.contains('active') })));
}
async function allNaturallyReady() {
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    assert.equal(await action('retry').isVisible(), false, 'The public fixture must stay alive.');
    const party = await members(); assert.equal(party.length, 3);
    assert.ok(party.every(actor => Number.parseFloat(actor.hp) > 0), 'Retreat covers the original living squad.');
    if (party.every(actor => actor.ready && actor.atb >= 99.999)) return party;
    const available = party.find(actor => actor.ready && actor.atb >= 99.999 && !actor.held);
    if (available) { await click(action('battle-actor', available.id)); await click(action('coord-reserve')); report.observations.push({ kind: 'natural-gauge-reserved', actorId: available.id, party }); }
    await page.waitForTimeout(100);
  } throw Error('The living squad did not naturally reach three full gauges.');
}
const withoutTransientFieldChanges = state => { const copy = structuredClone(state); delete copy.position; delete copy.playedSeconds; delete copy.medigel; return copy; };

try {
  const files = await featureSourceFiles(['scripts/completion-evidence.mjs', 'scripts/completion-controls-tactical.mjs']);
  report.sourceHashes = await readSourceHashes(files);
  const directory = `docs/qa/${prefix}-sources`, saved = await snapshot(files, directory); assert.deepEqual(saved, report.sourceHashes);
  report.sourceSnapshots = files.map(path => ({ path, storedPath: `${directory}/${path}`, sha256: saved[path] }));
  const collectorBytes = await readFile(new URL(import.meta.url)), collectorPath = `docs/qa/${prefix}-collector.mjs`;
  await writeFile(new URL(collectorPath, root), collectorBytes); report.collectorSnapshot = { path: collectorPath, sha256: sha(collectorBytes) };
  if (mode === 'production') report.distFiles = await tree(new URL('dist/', root));
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
  page = await context.newPage(); page.setDefaultTimeout(60000);
  await page.addInitScript(() => { window.__TACTICAL_PAD__={polls:0,tap:null};Object.defineProperty(navigator,'getGamepads',{configurable:true,value(){const p=window.__TACTICAL_PAD__;p.polls++;const buttons=p.tap||[];p.tap=null;return[{index:0,id:'Declared virtual tactical standard controller',mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:18},(_,i)=>({pressed:buttons.includes(i),value:buttons.includes(i)?1:0}))}];}}); window.__COMPLETION_WORLD_FOCUS_EVENTS__ = []; for (const type of ['blur', 'focus', 'visibilitychange']) window.addEventListener(type, event => window.__COMPLETION_WORLD_FOCUS_EVENTS__.push({ type, isTrusted: event.isTrusted, hidden: document.hidden, focused: document.hasFocus() })); });
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), reason: request.failure()?.errorText }));
  page.on('request', request => { if (/\/(?:src|@vite|@fs)\//.test(new URL(request.url()).pathname)) report.sourceRequests.push(request.url()); });
  page.on('response', response => { if (response.status() >= 400) (response.status() === 404 && new URL(response.url()).pathname === '/favicon.ico' ? report.resourceWarnings : report.failedRequests).push({ url: response.url(), status: response.status() }); });
  page.on('console', message => { if (message.type() !== 'error') return; const value = { text: message.text(), location: message.location() };
    if (value.location.url && new URL(value.location.url).pathname === '/favicon.ico' && value.text === 'Failed to load resource: the server responded with a status of 404 (Not Found)') report.resourceWarnings.push(value); else report.consoleErrors.push(value); });
  await page.goto(url.href, { waitUntil: 'networkidle' }); const focusSession = await context.newCDPSession(page);
  await focusSession.send('Emulation.setFocusEmulationEnabled', { enabled: false }); report.mainFocusEmulationDisabledAfterNavigation = true; await noHarness();

  const first = WORLD_ZONES['eden-prime'].pois.find(poi => poi.id === 'eden-prime:encounter-1');
  await imported(await fixture('cover-retreat', first)); const beforeCombat = await exported('before-combat');
  await page.keyboard.press('KeyE'); await page.locator('.battle-member').first().waitFor();
  await allNaturallyReady(); if (await action('coord-release').isEnabled()) await click(action('coord-release'));
  await click(action('battle-actor', 'shepard')); const beforeCover = await members();
  assert.equal(beforeCover.find(actor => actor.id === 'shepard').atb, 100);
  assert.equal(await action('battle-action', 'cover').isEnabled(), true); await capture('geometric-cover-available');
  await click(action('battle-action', 'cover'));
  const afterCover = await members(); assert.equal(afterCover.find(actor => actor.id === 'shepard').atb, 0);
  const selectedAfterOrder = afterCover.find(actor => actor.active)?.id;
  const coverHelp = page.locator('.action-help [data-cover-status]');
  const postOrderHelp = await coverHelp.count() ? await coverHelp.innerText() : null;
  await capture('geometric-cover-after-order'); report.observations.push({ kind: 'native-cover-cost', before: beforeCover, after: afterCover, actorId: 'shepard', cost: 100,
    selectedAfterOrder, postOrderHelp, helpAttributedToActorId: selectedAfterOrder,
    activationAndDirectionNativeEvidence: ['tests/completion-world.test.js', 'tests/completion-combat.test.js'],
    privateCoverFlagRead: false });
  check('Public Shepard cover is available beside actual scenery and consumes exactly one full gauge; post-order help is attributed only to the newly selected actor');


  async function tabTo(selector) { const target=page.locator(selector).first();for(let i=0;i<180;i++){if(await target.evaluate(el=>el===document.activeElement))return;await page.keyboard.press('Tab');}throw Error('Tab cannot reach '+selector); }
  async function neutral(polls=2) { const previous=await page.evaluate(()=>{window.__TACTICAL_PAD__.tap=null;return window.__TACTICAL_PAD__.polls});await page.waitForFunction(({previous,polls})=>window.__TACTICAL_PAD__.polls>=previous+polls,{previous,polls}); }
  async function padA() { await neutral();const previous=await page.evaluate(()=>{window.__TACTICAL_PAD__.tap=[0];return window.__TACTICAL_PAD__.polls});await page.waitForFunction(previous=>window.__TACTICAL_PAD__.polls>previous,previous);await neutral(); }
  for(const size of [{label:'desktop',width:1280,height:800},{label:'phone',width:390,height:844}]) {
    await page.setViewportSize({width:size.width,height:size.height});
    await page.waitForFunction(size=>{const c=document.querySelector('#world canvas');return c&&c.width===size.width&&c.height===size.height;},size);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const bounds=await page.locator('.tactical-toolbar').evaluate(el=>({height:el.getBoundingClientRect().height,top:el.getBoundingClientRect().top,width:el.clientWidth,scrollWidth:el.scrollWidth}));
    assert.ok(bounds.height<=(size.label==='desktop'?60:120),'Closed command bar stays compact');assert.ok(bounds.scrollWidth<=bounds.width+1);
    await capture(size.label+'-after-cover-closed');
    await tabTo('[data-tactical-help] > summary');await padA();assert.equal(await page.locator('[data-tactical-help]').evaluate(el=>el.open),true);
    const reason=await page.locator('[data-tactical-help-body] [data-retreat-status]').innerText();assert.ok(reason.trim());
    await tabTo('[data-tactical-help-body]');await page.keyboard.press('PageDown');
    const reading=await page.locator('[data-tactical-help-body]').evaluate(el=>({scrollTop:el.scrollTop,clientHeight:el.clientHeight,scrollHeight:el.scrollHeight,focused:el===document.activeElement}));assert.equal(reading.focused,true);
    if(reading.scrollHeight>reading.clientHeight+1)assert.ok(reading.scrollTop>0);
    await capture(size.label+'-help-open');await page.keyboard.press('Shift+Tab');await padA();assert.equal(await page.locator('[data-tactical-help]').evaluate(el=>el.open),false);
    await capture(size.label+'-help-closed-restored');report.observations.push({kind:'compact-toolbar',viewport:size,bounds,reason,reading});
  }
  check('Compact default commands leave the scene visible; public virtual A opens/closes native help, keyboard reads its actual retreat reason at desktop and phone sizes');
  for(const size of [{label:'desktop',width:1280,height:800},{label:'phone',width:390,height:844}]) {
    await page.setViewportSize({width:size.width,height:size.height});await page.waitForFunction(size=>{const c=document.querySelector('#world canvas');return c&&c.width===size.width&&c.height===size.height;},size);
    await click(action('battle-actor','kaidan'));const before=await members();await click(action('coord-start'));await click(action('battle-action','shoot'));
    await click(page.locator('[data-do="battle-target"]:not(:disabled)').first());
    const chip=page.locator('[data-tactical-draft] li');assert.equal(await chip.count(),1);assert.equal(await chip.isVisible(),true);assert.match(await chip.innerText(),/Kaidan Alenko.*Tir contrôlé/);
    assert.equal(await page.locator('[data-tactical-help]').evaluate(el=>el.open),false);assert.equal(await page.locator('[data-do="coord-execute"]').getAttribute('aria-label'),'Exécuter 1 ordres coordonnés');
    assert.deepEqual(await members(),before,'Preparing a visible draft spends no gauge, HP, shield or heat');await capture(size.label+'-visible-order-draft');
    await tabTo('[data-do="coord-remove"][data-id="kaidan"]');if(size.label==='phone')await padA();else await page.keyboard.press('Enter');
    assert.equal(await page.locator('[data-tactical-draft] li').count(),0);assert.deepEqual(await members(),before,'Removing a draft leaves actual combat resources unchanged');
    await click(action('coord-cancel'));await capture(size.label+'-removed-draft-restored');
  }
  check('Prepared order stays visible outside closed help and can be removed before Execute by keyboard and virtual A without spending combat resources');

  report.nativeFocusEvents = await page.evaluate(() => window.__COMPLETION_WORLD_FOCUS_EVENTS__);
  
  assert.deepEqual(await readSourceHashes(Object.keys(report.sourceHashes)), report.sourceHashes); report.sourceFrozen = true;
  if (mode === 'production') { assert.deepEqual(await tree(new URL('dist/', root)), report.distFiles); assert.deepEqual(report.sourceRequests, []); report.distFrozen = true; }
  assert.deepEqual(report.errors, []); assert.deepEqual(report.consoleErrors, []); assert.deepEqual(report.failedRequests, []); report.passed = true;
} catch (error) {
  report.failure = error.stack || String(error); report.errors.push(report.failure);
  if (page && !page.isClosed()) { report.focusAtFailure = await page.evaluate(() => ({ events: window.__COMPLETION_WORLD_FOCUS_EVENTS__, focused: document.hasFocus(), hidden: document.hidden, overlay: document.querySelector('#overlay')?.textContent })).catch(() => null); try { await capture('failure'); } catch {} }
} finally {
  if (browser) await browser.close(); report.browserClosed = true; await writeFile(output, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ passed: report.passed, report: fileURLToPath(output), checks: report.checks.length, captures: report.captures.length, exports: report.exports.length, browserClosed: report.browserClosed, failure: report.failure }));
if (!report.passed) process.exitCode = 1;
