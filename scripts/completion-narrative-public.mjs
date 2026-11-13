// Public ME1 dialogue controls only. Native preparation and position transfers
// are declared below; earlier fights and walking are not claimed played.
import assert from 'node:assert/strict';
import { readFile, writeFile, access, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { newGame, recruit, winEncounter, completeZone, zoneEncounters, encodeSave, decodeSave } from '../src/state.js';
import { recordVisit, readTopic } from '../src/story.js';
import { normalizeMissionProgress, advanceMission } from '../src/mission-progress.js';
import { advanceOperation } from '../src/operations.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { getLevelLayout } from '../src/level-layout-data.js';
import { levelMapProjection } from '../src/level-map-render.js';
import { CHAPTERS } from '../src/game-data.js';

const root = new URL('../', import.meta.url), mode = process.env.COMPLETION_NARRATIVE_MODE || 'development';
const prefix = process.env.COMPLETION_NARRATIVE_PREFIX, entry = new URL(process.env.GAME_URL || 'http://127.0.0.1:4191/');
assert.ok(['development', 'production'].includes(mode)); assert.match(prefix || '', /^completion-narrative-[a-z0-9-]+$/); assert.equal(entry.search, '');
const reportURL = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(reportURL); throw Error('Choose a new prefix; old attempts must be preserved.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { passed: false, at: new Date().toISOString(), mode, url: entry.href,
  command: { script: 'node scripts/completion-narrative-public.mjs', environment: { GAME_URL: entry.href, COMPLETION_NARRATIVE_MODE: mode, COMPLETION_NARRATIVE_PREFIX: prefix } },
  scope: 'Public recruitment acceptance/defer, disappearance of recruitment markers, actual squad selection and revisits, both remembered Garrus replies, early/late Liara, both Virmire survivors, permanent-unavailable crew, visible consequence/reputation summaries, real persuasion thresholds and actual save/reload.',
  sourceHashes: {}, distFiles: {}, fixtures: [], imports: [], exports: [], captures: [], checks: [], mapCoordinates: [], errors: [], failedRequests: [], consoleErrors: [], resourceWarnings: [], sourceRequests: [],
  limits: ['Earlier chapters, encounters and dialogue history in fixtures are prepared through the native Node callbacks; they are not claimed played in this browser.',
    'Position-only transfers derive from the immediately preceding actual public export; no walking path is claimed played.',
    'The two persuasion fixtures explicitly prepare 5/5 or 6/6 morality points; these points are not claimed earned in the browser. Thresholds are the existing ATB adaptation, not original Charme/Intimidation talents.',
    'All six planet orders, all nine dossier combinations, healing/Unity and exact body counts are native checks; the browser samples the public flows described in its checks.',
    'Relations describe actual exchanges only. Full romances, exact original dialogue, uncounted individual colonist outcomes and postwar political composition are not certified.'] };
let browser, page;
const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
const dialogue = () => page.locator('#overlay .dialogue');
const conversation = id => page.locator(`.dialogue[data-conversation-id="${id}"]`);
const activate = async locator => { await locator.waitFor({ state: 'visible' }); assert.equal(await locator.isEnabled(), true); await locator.click(); };
const check = name => { report.checks.push({ name, passed: true }); console.log(JSON.stringify({ check: name })); };
const stable = state => { const copy = structuredClone(state); delete copy.playedSeconds; return copy; };
const resources = state => Object.fromEntries(['xp', 'credits', 'medigel', 'paragon', 'renegade', 'inventory', 'cleared', 'completed', 'choices'].map(key => [key, state[key]]));
async function tree(directory, prefix = '') {
  const files = {};
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = new URL(item.name + (item.isDirectory() ? '/' : ''), directory), name = prefix + item.name;
    if (item.isDirectory()) Object.assign(files, await tree(path, name + '/'));
    else { const bytes = await readFile(path); files[name] = { bytes: bytes.length, sha256: sha(bytes) }; }
  } return files;
}
async function ready(zone) {
  await page.locator('#hud:not(.hidden) .location h2').waitFor(); await page.locator('#transition.active').waitFor({ state: 'hidden' });
  await page.locator('#overlay .screen, #overlay .dialogue').waitFor({ state: 'hidden' });
  if (zone) assert.equal((await page.locator('#hud .location h2').innerText()).trim(), WORLD_ZONES[zone].label);
}
async function closeToField() {
  for (let count = 0; count < 4 && await page.locator('#overlay .screen, #overlay .dialogue').isVisible(); count++) {
    await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  } await ready();
}
async function noHarness() {
  assert.deepEqual(await page.evaluate(() => ({ own: Object.hasOwn(window, '__RELAY_TEST__'), type: typeof window.__RELAY_TEST__, vite: !!document.querySelector('script[src*="/@vite/client"]') })),
    { own: false, type: 'undefined', vite: mode === 'development' });
}
async function capture(label, focus) {
  if (focus) await focus.scrollIntoViewIfNeeded();
  const path = `docs/screenshots/${prefix}-${label}.png`, bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)), animations: 'disabled' });
  report.captures.push({ label, path, sha256: sha(bytes), bytes: bytes.length, source: 'Actual public viewport after ordinary user scrolling; no DOM, CSS, pose or private-state injection.' });
}
function travelNative(state, zone) { state.zone = zone; state.position = null; assert.equal(recordVisit(state, zone), true); }
function finishNative(state, zone, choice = null) {
  travelNative(state, zone); for (const id of zoneEncounters(zone)) assert.equal(winEncounter(state, id), true); assert.equal(completeZone(state, zone, choice), true);
}
function prepare(order = [], virmire = 'save-kaidan', optional = []) {
  const state = newGame({ name: 'QA Narration', difficulty: 'story' }); state.flags.briefed = true;
  finishNative(state, 'eden-prime'); travelNative(state, 'citadel'); assert.equal(recruit(state, 'tali'), true);
  for (const id of optional) assert.equal(recruit(state, id), true);
  assert.equal(completeZone(state, 'citadel'), true); travelNative(state, 'normandy');
  assert.equal(readTopic(state, 'kaidan', 'implants').ok, true); assert.equal(readTopic(state, 'ashley', 'famille').ok, true);
  for (const zone of order) finishNative(state, zone, zone === 'feros' ? 'save' : zone === 'noveria' ? 'release' : zone === 'virmire' ? virmire : null);
  travelNative(state, 'normandy'); state.missionProgress = normalizeMissionProgress(undefined, state);
  assert.ok(decodeSave(encodeSave(state))); return state;
}
async function fixture(state, label, origin) {
  const path = `docs/qa/${prefix}-${label}-fixture.json`, bytes = Buffer.from(encodeSave(state)); assert.ok(decodeSave(bytes.toString()));
  await writeFile(new URL(path, root), bytes); const value = { path, sha256: sha(bytes), bytes, state };
  report.fixtures.push({ path, sha256: value.sha256, origin, position: state.position }); return value;
}
async function imported(value) {
  if (!await action('import').isVisible()) { await closeToField(); await page.keyboard.press('Escape'); await activate(action('quit')); }
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), activate(action('import'))]);
  await chooser.setFiles({ name: value.path.split('/').at(-1), mimeType: 'application/json', buffer: value.bytes });
  report.imports.push({ path: value.path, sha256: value.sha256, via: 'Actual public file chooser', source: report.fixtures.some(item => item.path === value.path) ? 'declared-fixture' : 'unaltered-public-export' });
  await ready(value.state.zone); await noHarness();
}
async function exported(label, { keepOpen = false } = {}) {
  await closeToField(); await page.keyboard.press('Escape'); await activate(action('save'));
  const [download] = await Promise.all([page.waitForEvent('download'), activate(action('export'))]);
  const path = `docs/qa/${prefix}-${label}-export.json`; await download.saveAs(fileURLToPath(new URL(path, root))); assert.equal(await download.failure(), null);
  const bytes = await readFile(new URL(path, root)), state = decodeSave(bytes.toString()); assert.ok(state);
  const value = { path, label, sha256: sha(bytes), bytes, state };
  report.exports.push({ path, label, sha256: value.sha256, bytes: bytes.length, observed: { zone: state.zone, recruited: state.recruited, lost: state.lost, party: state.party, choices: state.choices, story: state.story, paragon: state.paragon, renegade: state.renegade, operations: state.operations } });
  if (!keepOpen) { await activate(action('close')); await ready(); } return value;
}
async function transfer(actual, position, label) {
  const state = structuredClone(actual.state); state.position = { ...position };
  const omit = state => { const copy = structuredClone(state); delete copy.position; return copy; }; assert.deepEqual(omit(state), omit(actual.state));
  await imported(await fixture(state, label, { kind: 'Position-only transfer from actual public export', parentExport: actual.path, parentSHA256: actual.sha256, changedFields: [{ path: 'position', before: actual.state.position, after: state.position }], navigationClaimed: false }));
}
async function mapPoint(id, zone) {
  await ready(); await page.keyboard.press('KeyM'); await activate(action('map-filter', 'all'));
  const point = await page.locator('.local-map-board').evaluate((board, id) => {
    const index = [...board.querySelectorAll(':scope > .map-number')].findIndex(node => node.dataset.id === id);
    if (index < 0) throw Error('Missing public map marker: ' + id);
    const circle = board.querySelectorAll(':scope > svg > circle')[index]; if (!circle) throw Error('Missing map source circle');
    return { x: Number(circle.getAttribute('cx')), z: Number(circle.getAttribute('cy')) };
  }, id);
  const bounds = WORLD_ZONES[zone].bounds, projection = getLevelLayout(zone) ? levelMapProjection(bounds) : null;
  const result = projection ? { x: bounds.minX + (point.x - projection.originX) / projection.scale, z: bounds.minZ + (point.z - projection.originZ) / projection.scale }
    : { x: bounds.minX + (point.x - 5) * (bounds.maxX - bounds.minX) / 90, z: bounds.minZ + (point.z - 5) * (bounds.maxZ - bounds.minZ) / 90 };
  report.mapCoordinates.push({ id, zone, publicMapSource: point, worldPosition: result }); await closeToField(); return result;
}
async function atPOI(id, zone, label) {
  const point = await mapPoint(id, zone), actual = await exported(`${label}-before-transfer`); await transfer(actual, point, `${label}-position`);
  await page.keyboard.press('KeyE'); await dialogue().waitFor();
}
async function openConversation(id) {
  await closeToField(); await page.keyboard.press('KeyC'); await activate(action('conversation', id)); await conversation(id).waitFor();
}
async function topic(id, topicId) {
  await activate(conversation(id).locator(`[data-topic-id="${topicId}"]`));
  assert.equal(await conversation(id).getAttribute('data-current-topic'), topicId);
  const text = await conversation(id).locator('.dialogue-text').innerText(); assert.ok(text.trim()); return text;
}
async function reportSummary() {
  await closeToField(); await page.keyboard.press('KeyJ'); await activate(action('journal-tab', 'reports')); await page.locator('[data-narrative-summary]').waitFor();
}

try {
  const paths = ['src/main.js', 'src/state.js', 'src/world.js', 'src/game-data.js', 'src/combat.js', 'src/story.js', 'src/story-data.js', 'src/completion-narrative.js', 'src/completion-narrative-ui.js', 'src/commander.js', 'src/simulation-clock.js', 'src/gamepad-controls.js', 'src/world-data.js', 'src/level-layout-data.js', 'src/local-map.js', 'src/level-map-render.js', 'src/operations.js', 'src/operation-data.js', 'src/mission-progress.js', 'src/style.css', 'src/priority-ui.css', 'src/gamepad-controls.css', 'src/completion-accessibility.css', 'scripts/completion-narrative-public.mjs'];
  for (const path of paths) report.sourceHashes[path] = sha(await readFile(new URL(path, root)));
  const collector = await readFile(new URL('scripts/completion-narrative-public.mjs', root)), path = `docs/qa/${prefix}-collector.mjs`;
  await writeFile(new URL(path, root), collector); report.collectorSnapshot = { path, sha256: sha(collector) };
  if (mode === 'production') report.distFiles = await tree(new URL('dist/', root));
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  page = await browser.newPage({ viewport: { width: 1280, height: 800 }, acceptDownloads: true }); page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), reason: request.failure()?.errorText }));
  page.on('request', request => { if (/\/(?:src|@vite|@fs)\//.test(new URL(request.url()).pathname)) report.sourceRequests.push(request.url()); });
  page.on('response', response => { if (response.status() >= 400) (new URL(response.url()).pathname === '/favicon.ico' && response.status() === 404 ? report.resourceWarnings : report.failedRequests).push({ url: response.url(), status: response.status() }); });
  page.on('console', message => { if (message.type() !== 'error') return; const value = { text: message.text(), location: message.location() };
    if (value.location.url && new URL(value.location.url).pathname === '/favicon.ico' && value.text === 'Failed to load resource: the server responded with a status of 404 (Not Found)') report.resourceWarnings.push(value); else report.consoleErrors.push(value); });
  await page.goto(entry.href, { waitUntil: 'networkidle' }); await noHarness();

  const recruitment = prepare(); travelNative(recruitment, 'citadel');
  await imported(await fixture(recruitment, 'citadel-optional-recruits', { kind: 'Native prerequisite chapters; optional Garrus and Wrex are not recruited', playedInBrowser: false }));
  const startingResources = resources(recruitment);
  for (const [id, poi] of [['garrus', 'encounter-1'], ['wrex', 'boss']]) {
    await atPOI(`citadel:${poi}`, 'citadel', `recruit-${id}`);
    assert.match(await dialogue().locator('.speaker').innerText(), id === 'garrus' ? /Garrus/i : /Wrex/i);
    await capture(`${id}-recruitment-offer`);
    await activate(dialogue().locator('[data-index="1"]')); await ready();
    const deferred = await exported(`${id}-deferred`); assert.ok(!deferred.state.recruited.includes(id)); assert.deepEqual(resources(deferred.state), startingResources);
    await page.keyboard.press('KeyE'); await dialogue().waitFor(); await activate(dialogue().locator('[data-index="0"]')); await ready();
    const joined = await exported(`${id}-joined`); assert.equal(joined.state.recruited.filter(key => key === id).length, 1); assert.deepEqual(resources(joined.state), startingResources);
    await page.keyboard.press('KeyM'); await activate(action('map-filter', 'all')); assert.equal(await page.locator(`.map-number[data-id="citadel:${poi}"]`).count(), 0); await closeToField();
  }
  await atPOI('citadel:exit', 'citadel', 'recruits-extraction'); await activate(dialogue().locator('[data-index="0"]')); await ready('normandy');
  await page.keyboard.press('KeyC');
  for (const id of ['kaidan', 'ashley', 'garrus', 'wrex']) await activate(action('crew-select', id));
  await activate(action('crew-confirm')); await ready('normandy');
  let base = await exported('both-recruits-squad'); assert.deepEqual(base.state.party, ['shepard', 'garrus', 'wrex']);
  await capture('normandy-garrus-wrex');
  await page.keyboard.press('KeyG'); await activate(action('planet', 'citadel')); await activate(action('travel', 'citadel')); await ready('citadel');
  await capture('citadel-selected-recruits-once');
  await page.keyboard.press('KeyM'); await activate(action('map-filter', 'all'));
  for (const id of ['encounter-1', 'boss']) assert.equal(await page.locator(`.map-number[data-id="citadel:${id}"]`).count(), 0);
  await closeToField(); await atPOI('citadel:exit', 'citadel', 'revisit-extraction'); await activate(dialogue().locator('[data-index="0"]')); await ready('normandy');
  base = await exported('recruits-after-revisit'); assert.deepEqual(resources(base.state), startingResources);
  await openConversation('wrex'); assert.match(await topic('wrex', 'genophage'), /génophage/); await capture('wrex-conversation-after-recruitment');
  base = await exported('wrex-conversation-after-recruitment'); assert.ok(base.state.story.heard.includes('wrex:genophage')); assert.deepEqual(resources(base.state), startingResources);
  check('Public defer/accept of both optional recruits, no reward or duplicate recruitment marker, actual Garrus/Wrex squad and Citadel/Normandy revisits');

  for (const reply of ['procedure', 'results']) {
    await imported(base); await openConversation('garrus'); await topic('garrus', 'procedure');
    await activate(conversation('garrus').locator(`[data-reply-id="${reply}"]`)); await activate(conversation('garrus').locator('[data-conversation-back]'));
    const text = await topic('garrus', 'followup'); assert.match(text, reply === 'procedure' ? /protéger les innocents/ : /privilégier les résultats/);
    await capture(`garrus-remembers-${reply}`);
    const actual = await exported(`garrus-${reply}`); assert.equal(actual.state.story.choices['garrus:procedure'], reply); assert.deepEqual(resources(actual.state), resources(base.state));
    await page.reload({ waitUntil: 'networkidle' }); await activate(action('continue')); await ready('normandy');
    const resumed = await exported(`garrus-${reply}-resumed`); assert.deepEqual(stable(resumed.state), stable(actual.state));
    await openConversation('garrus'); await topic('garrus', 'procedure'); assert.equal(await conversation('garrus').locator('[data-reply-id]').count(), 0);
  }
  check('Both public Garrus advice branches persist, follow-up reflects the exact selected choice and repeat conversation offers no conflicting reply or reward');

  for (const [label, order] of [['early', ['therum']], ['late', ['feros', 'noveria', 'virmire', 'therum']]]) {
    await imported(await fixture(prepare(order), `liara-${label}`, { kind: 'Native campaign completion in the declared order', order, playedInBrowser: false }));
    await openConversation('liara'); assert.equal(await conversation('liara').locator('[data-topic-id="vigil"]').count(), 0);
    assert.equal(await conversation('liara').locator('[data-topic-id="cipher"]').count(), label === 'late' ? 1 : 0);
    const text = await topic('liara', 'archaeology'); assert.match(text, label === 'late' ? /Feros, Noveria, Virmire/ : /au début de votre enquête/); assert.ok(!text.includes('Ilos'));
    await capture(`liara-${label}-reaction`);
    const actual = await exported(`liara-${label}-heard`); assert.ok(actual.state.story.heard.includes('liara:archaeology'));
    await page.reload({ waitUntil: 'networkidle' }); await activate(action('continue')); await ready('normandy'); await noHarness();
    const resumed = await exported(`liara-${label}-resumed`); assert.deepEqual(stable(resumed.state), stable(actual.state));
  }
  check('Public early/late Liara dialogue follows actual completed-order fixtures, has no premature Vigil/Cipher topic, and survives actual automatic-save reload');

  for (const choice of ['save-kaidan', 'save-ashley']) {
    const survivor = choice === 'save-kaidan' ? 'kaidan' : 'ashley', dead = survivor === 'kaidan' ? 'ashley' : 'kaidan', deadName = dead === 'ashley' ? 'Ashley Williams' : 'Kaidan Alenko';
    const initial = prepare(['therum', 'feros', 'virmire'], choice, ['garrus', 'wrex']);
    await imported(await fixture(initial, choice, { kind: 'Native Virmire choice and earlier read exchanges for both squadmates', choice, playedInBrowser: false }));
    await page.keyboard.press('KeyC'); assert.equal(await action('crew-select', dead).isDisabled(), true); assert.equal(await action('conversation', dead).count(), 0); assert.equal(await action('conversation', survivor).isEnabled(), true);
    const relation = page.locator(`[data-companion-relation="${dead}"]`); await relation.waitFor(); assert.equal(await relation.getAttribute('data-relation-status'), 'lost');
    await capture(`${dead}-permanently-unavailable`, relation);
    await activate(action('conversation', survivor)); const text = await topic(survivor, 'virmire-return'); assert.ok(text.includes(deadName)); await capture(`${survivor}-virmire-return`);
    await openConversation('chakwas'); const medical = await topic('chakwas', 'virmire-loss'); assert.ok(medical.includes(deadName)); assert.match(medical, /ne peuvent pas annuler ce décès/);
    if (survivor === 'kaidan') await capture('chakwas-permanent-loss');
    await reportSummary(); const consequence = page.locator('[data-narrative-consequence="virmire"]'); assert.ok((await consequence.innerText()).includes(deadName)); await capture(`${survivor}-journal-consequence`, consequence);
    const actual = await exported(`${survivor}-aftermath`); assert.deepEqual(resources(actual.state), resources(initial)); assert.ok(actual.state.lost.includes(dead)); assert.ok(!actual.state.party.includes(dead));
    await page.reload({ waitUntil: 'networkidle' }); await activate(action('continue')); await ready('normandy');
    const resumed = await exported(`${survivor}-aftermath-resumed`); assert.deepEqual(stable(resumed.state), stable(actual.state));
  }
  check('Both public Virmire survivors react to the correct loss; dead crew stay unselectable and absent from conversations while prior exchanges and journal consequences persist through real reload');

  for (const decision of ['release', 'destroy']) {
    const state = prepare(['therum', 'feros']); travelNative(state, 'noveria');
    for (const id of zoneEncounters('noveria')) assert.equal(winEncounter(state, id), true);
    assert.equal(advanceMission(state, 'noveria', 'start').ok, true);
    for (const id of ['memory', 'power', 'uplink']) assert.equal(advanceMission(state, `mission:noveria:${id}`, 'repair').ok, true);
    await imported(await fixture(state, `queen-before-${decision}`, { kind: 'Native Noveria encounters and MIRA repair callbacks prepared; queen choice undecided', playedInBrowser: false }));
    await atPOI('noveria:objective', 'noveria', `queen-${decision}`); assert.match(await dialogue().locator('.speaker').innerText(), /reine rachni/i);
    assert.equal(await dialogue().locator('.choice').count(), 2);
    if (decision === 'release') await capture('queen-two-explicit-choices');
    await activate(dialogue().locator(`[data-index="${decision === 'release' ? 0 : 1}"]`));
    await activate(dialogue().locator('[data-index="0"]')); await ready('normandy');
    await reportSummary(); const summary = page.locator('[data-narrative-consequence="noveria"]');
    assert.match(await summary.innerText(), decision === 'release' ? /libéré la reine/ : /destruction de la reine/); await capture(`queen-${decision}-consequence`, summary);
    const actual = await exported(`queen-${decision}-selected`);
    assert.equal(actual.state.choices.noveria, decision); assert.equal(actual.state.completed.filter(id => id === 'noveria').length, 1);
    assert.equal(actual.state.xp, state.xp + CHAPTERS.noveria.reward); assert.equal(actual.state.credits, state.credits + 180);
    assert.equal(actual.state[decision === 'release' ? 'paragon' : 'renegade'], state[decision === 'release' ? 'paragon' : 'renegade'] + 20);
    await page.reload({ waitUntil: 'networkidle' }); await activate(action('continue')); await ready('normandy');
    const resumed = await exported(`queen-${decision}-resumed`); assert.deepEqual(stable(resumed.state), stable(actual.state));
  }
  check('Both public queen decisions produce their own persistent/exported consequence, one native chapter reward and an unchanged actual reload without inventing later-media outcomes');

  for (const points of [5, 6]) {
    const state = prepare(); travelNative(state, 'citadel'); state.paragon = points; state.renegade = points;
    assert.equal(advanceOperation(state, 'citadel-presidium-prophet', 'officer', 'listen').ok, true);
    await imported(await fixture(state, `persuasion-${points}`, { kind: 'Native officer step with explicit threshold points fixture', changedFields: ['paragon', 'renegade'], points: { paragon: points, renegade: points }, pointsEarnedInBrowser: false }));
    await atPOI('operation:citadel-presidium-prophet:hanar', 'citadel', `hanar-${points}`);
    const operation = page.locator('.dialogue[data-operation-id="citadel-presidium-prophet"]'); await operation.waitFor();
    for (const id of ['diplomacy', 'intimidate']) {
      const button = operation.locator(`[data-operation-choice="${id}"]`); assert.equal(await button.isDisabled(), points < 6); assert.match(await button.innerText(), /6 points/);
    }
    await capture(`persuasion-${points}-points`);
    if (points === 6) { await activate(operation.locator('[data-operation-choice="diplomacy"]')); await ready(); }
    const actual = await exported(`persuasion-${points}-outcome`);
    assert.equal(actual.state.operations.records['citadel-presidium-prophet'].stage, points === 6 ? 2 : 1);
    assert.deepEqual(resources(actual.state), resources(state), 'The intermediate persuasion step grants no repeat or early completion reward');
    await reportSummary(); assert.match(await page.locator('[data-narrative-reputation]').innerText(), new RegExp(`Conciliation ${points}.*Pragmatisme ${points}`));
    if (points === 5) await capture('visible-reputation', page.locator('[data-narrative-reputation]'));
  }
  check('Public 5/6-point persuasion boundaries display both prerequisites, disable only locked options, execute an eligible choice and show the same reputation values in the journal');

  for (const [path, expected] of Object.entries(report.sourceHashes)) assert.equal(sha(await readFile(new URL(path, root))), expected, `Source changed during run: ${path}`);
  report.sourceFrozen = true;
  if (mode === 'production') { assert.deepEqual(await tree(new URL('dist/', root)), report.distFiles); assert.deepEqual(report.sourceRequests, []); report.distFrozen = true; }
  assert.deepEqual(report.errors, []); assert.deepEqual(report.consoleErrors, []); assert.deepEqual(report.failedRequests, []); report.passed = true;
} catch (error) {
  report.errors.push(error.stack || error.message);
  if (page && !page.isClosed()) try { await capture('failure'); } catch {}
} finally {
  if (browser) await browser.close(); report.browserClosed = true;
  await writeFile(reportURL, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ passed: report.passed, report: fileURLToPath(reportURL), checks: report.checks.length, captures: report.captures.length, exports: report.exports.length, imports: report.imports.length, browserClosed: report.browserClosed }));
if (!report.passed) process.exitCode = 1;
