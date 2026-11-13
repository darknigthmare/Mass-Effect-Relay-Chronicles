// New public DEV/production journey. No QA API, in-page source imports, private
// battle reads, live state/HP/ATB injection, clock changes or forged victories.
import assert from 'node:assert/strict';
import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { newGame, encodeSave } from '../src/state.js';
import { decodeChronicle } from '../src/chronicles.js';

const root = new URL('../', import.meta.url), endpoint = new URL(process.env.GAME_URL || 'http://127.0.0.1:4195/');
const mode = process.env.CONTINUATION_CHRONICLES_MODE || 'dev', prefix = process.env.CONTINUATION_CHRONICLES_PREFIX;
assert.ok(['dev', 'production'].includes(mode)); assert.match(prefix || '', /^continuation-chronicles-[a-z0-9-]+$/); assert.equal(endpoint.search, '');
const output = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(output); throw Error('Preserve every attempt; choose a fresh CONTINUATION_CHRONICLES_PREFIX.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sourcePaths = ['src/main.js', 'src/state.js', 'src/chronicles.js', 'src/continuity.js', 'src/universe-data.js',
  'src/universe-actors.js', 'src/universe-powers.js', 'src/universe-equipment.js', 'src/universe-ui.js', 'src/universe-ui.css', 'src/style.css', 'src/combat.js',
  'src/completion-chronicles-powers.js', 'src/continuation-chronicles-positions.js', 'scripts/continuation-chronicles-public.mjs'];
const report = { passed: false, at: new Date().toISOString(), baselineCommit: '5d933068cacd1b595d584b7cedfffd35b1db362d', mode, url: endpoint.href,
  command: { script: 'node scripts/continuation-chronicles-public.mjs', environment: { GAME_URL: endpoint.href, CONTINUATION_CHRONICLES_MODE: mode, CONTINUATION_CHRONICLES_PREFIX: prefix } },
  scope: 'Public ME2/ME3 Vanguard preparation, actual advance/withdraw and Charge ATB positions, finite visible exposure, preparation-only export/reload, main-period/class guards and untouched ME1 witness.',
  inputMethod: 'Real menu selections, native file input/download, pointer clicks and pointer wheel. Page evaluation only reads public DOM, displayed coordinates, storage bytes and QA-global absence.',
  fixtures: [], sourceHashes: {}, registryContextHashes: {}, captures: [], exports: [], observations: [], checks: [], errors: [], consoleErrors: [],
  failedRequests: [], sourceRequests: [], servedFiles: [], distFiles: {},
  limitations: ['The ME1 witness is a native unprogressed newGame save imported before any journey; no completed campaign is claimed.',
    'Chronicle classes and one-member groups are prepared through public menus; ATB, cooldowns, HP and status time are never set in page.',
    'Coordinates and destinations are a two-dimensional ATB adaptation. Other attacks retain their documented abstract ranges. There are no scene obstacles, physical swept path, original 3D movement or specific animation.',
    'Native tests cover RNG/resource atomicity, blocked/range/contact refusal and damage multipliers; DOM observations do not expose private live state.',
    'Omni-blade remains open because no eligible sourced existing record supports the guarded action. No artistic or full campaign certification is implied.'] };
let browser, page;
const pending = [], served = new Set();
const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
const click = async locator => { await locator.waitFor({ state: 'visible' }); assert.equal(await locator.isEnabled(), true); await locator.click(); };
const check = name => { report.checks.push({ name, passed: true }); console.log(JSON.stringify({ check: name })); };
async function tree(directory, prefix = '') {
  const result = {};
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + item.name, target = new URL(item.name + (item.isDirectory() ? '/' : ''), directory);
    if (item.isDirectory()) Object.assign(result, await tree(target, name + '/'));
    else { const bytes = await readFile(target); result[name] = { bytes: bytes.length, sha256: sha(bytes) }; }
  }
  return result;
}
async function capture(label, focus) {
  if (focus) await focus.scrollIntoViewIfNeeded();
  const path = `docs/screenshots/${prefix}-${label}.png`, bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)), animations: 'disabled' });
  report.captures.push({ label, path, bytes: bytes.length, sha256: sha(bytes), source: 'Actual public viewport, unchanged DOM/style/state and natural ATB time.' });
}
async function ready() {
  await page.locator('#hud:not(.hidden) .location h2').waitFor();
  await page.locator('#transition.active').waitFor({ state: 'hidden' });
  await page.locator('#overlay .screen, #overlay .dialogue').waitFor({ state: 'hidden' });
}
async function selectContext(mediaId, periodId = mediaId.toLowerCase()) {
  if (await page.locator('#chronicle-media').inputValue() !== mediaId) await page.locator('#chronicle-media').selectOption(mediaId);
  if (await page.locator('#chronicle-period').inputValue() !== periodId) await page.locator('#chronicle-period').selectOption(periodId);
  await click(action('universe-tab', 'session'));
}
async function prepare(mediaId, buildId = 'vanguard') {
  if (await action('chronicle-preparation').isVisible()) await click(action('chronicle-preparation'));
  await selectContext(mediaId); await page.locator('#chronicle-scenario').selectOption(`${mediaId.toLowerCase()}-equipment-workshop`);
  await click(action('chronicle-start'));
  const id = `${mediaId}-CHR-SHEPARD`;
  const selected = await page.locator('[data-do="chronicle-party"][aria-pressed="true"]').evaluateAll(nodes => nodes.map(node => node.dataset.id));
  for (const otherId of selected) if (otherId !== id) await click(action('chronicle-party', otherId));
  await page.locator(`[data-chronicle-build][data-actor-id="${id}"]`).selectOption(buildId);
  assert.equal(await page.locator('[data-do="chronicle-party"][aria-pressed="true"]').count(), 1);
  return id;
}
async function launch(id) {
  await click(action('chronicle-battle')); await page.locator('.chronicle-combat').waitFor(); await click(action('chronicle-actor', id));
}
async function pause() {
  for (let attempt = 0; attempt < 12; attempt++) {
    const info = await page.evaluate(() => {
      const button = document.querySelector('[data-do="chronicle-pause"]'); if (!button) return null;
      const box = button.getBoundingClientRect(), x = box.x + box.width / 2, y = box.y + box.height / 2;
      const panel = document.querySelector('#overlay .screen-body')?.getBoundingClientRect();
      return { label: button.textContent.trim(), x, y, hittable: button.contains(document.elementFromPoint(x, y)),
        scrollX: panel ? panel.x + panel.width / 2 : innerWidth / 2, scrollY: panel ? panel.y + panel.height / 2 : innerHeight / 2 };
    });
    assert.ok(info); if (info.label === 'Reprendre') return;
    if (info.hittable) await page.mouse.click(info.x, info.y);
    else { await page.mouse.move(info.scrollX, info.scrollY); await page.mouse.wheel(0, info.y < page.viewportSize().height / 2 ? -420 : 420); }
    await page.waitForTimeout(25);
  }
  throw Error('The actual Pause control could not be reached by pointer and wheel.');
}
async function resume() { if ((await action('chronicle-pause').textContent()).trim() === 'Reprendre') await click(action('chronicle-pause')); }
async function order(id, targetId) {
  await page.waitForFunction(id => { const node = document.querySelector(`[data-do="chronicle-action"][data-id="${id}"]`); return node && !node.disabled; }, id, { polling: 100, timeout: 45000 });
  if (targetId) await click(action('chronicle-action', id));
  if (id === 'bioticCharge') {
    const description = await page.locator('.chronicle-action-description').innerText();
    assert.match(description, /15 %.*trois secondes ATB/);
    report.observations.push({ label: 'charge-risk-description-before-order', description, source: 'Visible public command description before the offensive click.' });
  }
  const control = targetId ? action('chronicle-target', targetId) : action('chronicle-action', id);
  await control.scrollIntoViewIfNeeded(); assert.equal(await control.isEnabled(), true);
  const box = await control.boundingBox(); assert.ok(box);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const immediate = await page.locator('[data-chronicle-unit]').evaluateAll(nodes => Object.fromEntries(nodes.map(node => [node.dataset.chronicleUnit,
    { signature: node.querySelector('[data-chronicle-signature-status]')?.textContent || '', atbWidth: node.querySelector('[data-chronicle-stat="atb"]')?.style.width || null }])));
  report.observations.push({ label: `${id}-immediately-after-native-click`, units: immediate,
    source: 'Read-only public DOM before scrolling or Pause; no game data or clock is set.' });
  // One genuine large wheel gesture returns from the command list to Pause.
  // The former small increments could outlast the natural three-second risk.
  await page.mouse.wheel(0, -2400);
  await pause();
  return immediate;
}
async function positions(label) {
  const observation = await page.locator('[data-chronicle-position-unit]').evaluateAll(nodes => Object.fromEntries(nodes.map(node => [node.dataset.chroniclePositionUnit, { x: Number(node.dataset.x), z: Number(node.dataset.z) }])));
  const revision = Number(await page.locator('[data-chronicle-position-revision]').getAttribute('data-chronicle-position-revision'));
  assert.ok(Object.values(observation).every(point => Number.isFinite(point.x) && Number.isFinite(point.z)));
  report.observations.push({ label, positions: observation, revision, status: await page.locator('#chronicle-battle-status').innerText(), log: await page.locator('.chronicle-log').innerText() });
  return observation;
}
const distance = (left, right) => Math.hypot(left.x - right.x, left.z - right.z);
async function exportChronicle(label) {
  const [download] = await Promise.all([page.waitForEvent('download'), click(action('chronicle-export'))]);
  const path = `docs/qa/${prefix}-${label}-export.json`; await download.saveAs(fileURLToPath(new URL(path, root)));
  assert.equal(await download.failure(), null); const bytes = await readFile(new URL(path, root)), session = decodeChronicle(bytes.toString()); assert.ok(session);
  assert.doesNotMatch(bytes.toString(), /chroniclePositions|chargeExposure|chargePositionContact|engagedTargetId/);
  report.exports.push({ label, path, bytes: bytes.length, sha256: sha(bytes), context: session.context, builds: session.builds }); return { bytes, session };
}
async function campaignStorage() {
  return page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(key => key === 'relay-chronicles.save.v1' || key.startsWith('relay-chronicles.manual-save.v1.')).sort().map(key => [key, localStorage.getItem(key)])));
}
try {
  for (const path of sourcePaths) {
    const hashes = mode === 'dev' && path === 'src/universe-data.js' ? report.registryContextHashes : report.sourceHashes;
    hashes[path] = sha(await readFile(new URL(path, root)));
  }
  if (mode === 'production') report.distFiles = await tree(new URL('dist/', root));
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  report.chromium = browser.version(); page = await browser.newPage({ viewport: { width: 1280, height: 1900 }, acceptDownloads: true }); page.setDefaultTimeout(45000);
  report.desktopViewport = { width: 1280, height: 1900 };
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('console', message => { if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico')) report.consoleErrors.push(message.text()); });
  page.on('response', response => {
    const url = new URL(response.url()); if (url.pathname.startsWith('/src/') || url.pathname.includes('/@vite/')) report.sourceRequests.push(response.url());
    if (response.status() >= 400 && !url.pathname.endsWith('/favicon.ico')) report.failedRequests.push(`${response.status()} ${response.url()}`);
    const key = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    if (mode === 'production' && response.status() === 200 && report.distFiles[key] && !served.has(key) && (key === 'index.html' || /\.(js|css)$/.test(key))) {
      served.add(key); pending.push((async () => { const bytes = await response.body(), expected = report.distFiles[key]; assert.equal(bytes.length, expected.bytes, key); assert.equal(sha(bytes), expected.sha256, key); report.servedFiles.push({ path: key, bytes: bytes.length, sha256: sha(bytes) }); })());
    }
  });
  await page.goto(endpoint.href, { waitUntil: 'networkidle' }); assert.equal(await page.evaluate(() => Object.hasOwn(window, '__RELAY_TEST__')), false);
  const fixture = encodeSave(newGame({ name: 'Témoin Continuation', classId: 'soldier' }));
  const fixturePath = `docs/qa/${prefix}-me1-witness-fixture.json`; await writeFile(new URL(fixturePath, root), fixture);
  report.fixtures.push({ path: fixturePath, sha256: sha(fixture), origin: 'Native newGame, no extra XP/items/flags; imported through the public file chooser before play.' });
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), click(action('import'))]);
  await chooser.setFiles({ name: 'me1-witness.json', mimeType: 'application/json', buffer: Buffer.from(fixture) });
  await ready(); await click(action('pause')); await click(action('chronicles')); await page.locator('.universe-screen').waitFor();
  const witnessBefore = await campaignStorage(); let me2Preparation;
  for (const mediaId of ['ME2', 'ME3']) {
    const actorId = await prepare(mediaId), targetId = 'chronicle-enemy-0';
    await click(action('chronicle-save')); const prepared = await exportChronicle(`${mediaId.toLowerCase()}-prepared`);
    if (mediaId === 'ME2') me2Preparation = prepared;
    await launch(actorId); const initial = await positions(`${mediaId}-initial`);
    await order('withdraw'); const withdrawn = await positions(`${mediaId}-withdrawn`);
    assert.ok(distance(withdrawn[actorId], withdrawn[targetId]) > distance(initial[actorId], initial[targetId]));
    await capture(`${mediaId.toLowerCase()}-withdrawn`, page.locator('[data-chronicle-position-revision]'));
    await resume(); const immediate = await order('bioticCharge', targetId); const contact = await positions(`${mediaId}-charge-contact`);
    assert.ok(distance(contact[actorId], withdrawn[actorId]) > .1);
    assert.ok(Math.abs(distance(contact[actorId], contact[targetId]) - 1.6) < .02);
    const signature = page.locator(`[data-chronicle-unit="${actorId}"] [data-chronicle-signature-status]`);
    const activeText = await signature.innerText(), activeCaptured = /Contact de position ATB.*exposition \+15 %/.test(activeText);
    report.observations.push({ label: `${mediaId}-short-exposure-public-limit`, activeSeenImmediately: /exposition \+15 %/.test(immediate[actorId]?.signature || ''), activeCaptured,
      text: activeText, limitation: activeCaptured ? null : 'État actif non capturé : la fenêtre native de trois secondes avait déjà expiré avant Pause. Aucun PNG positif de cet état n’est revendiqué ; les dégâts réels ×1,15, pause et fin sont couverts par les 91 tests natifs frais.',
      nativeEvidence: 'docs/qa/continuation-chronicles-native-02-report.json' });
    await capture(`${mediaId.toLowerCase()}-charge-contact`, page.locator('[data-chronicle-position-revision]'));
    if (activeCaptured) await capture(`${mediaId.toLowerCase()}-charge-exposure`, signature);
    if (mediaId === 'ME3') {
      await page.setViewportSize({ width: 390, height: 844 });
      await capture('me3-charge-mobile', page.locator('[data-chronicle-position-revision]'));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.setViewportSize({ width: 1280, height: 1900 });
    }
    await resume();
    await page.waitForFunction(id => { const node = document.querySelector(`[data-chronicle-unit="${id}"] [data-chronicle-signature-status]`); return node && !/exposition/.test(node.textContent); }, actorId, { polling: 100, timeout: 15000 });
    await pause(); const expired = await positions(`${mediaId}-exposure-ended`);
    assert.deepEqual(expired[actorId], contact[actorId]); assert.doesNotMatch(await signature.innerText(), /exposition/);
    await capture(`${mediaId.toLowerCase()}-exposure-ended`, page.locator('[data-chronicle-position-revision]'));
    await click(action('chronicle-preparation')); const after = await exportChronicle(`${mediaId.toLowerCase()}-after-battle`);
    assert.deepEqual(after.session, prepared.session);
    check(`${mediaId}: native withdrawal then Charge changes public coordinates to a free 1.6-unit contact; risk description is visible and exposure end is read; ${activeCaptured ? 'active state captured' : 'active state not captured, actual risk/end attributed to fresh native tests'}; export keeps only preparation`);
  }
  await page.locator('#chronicle-import').setInputFiles({ name: 'me2-prepared.json', mimeType: 'application/json', buffer: me2Preparation.bytes });
  await page.getByText('Chronique importée.', { exact: true }).waitFor(); await click(action('chronicle-save'));
  await page.reload({ waitUntil: 'networkidle' }); await click(action('chronicles')); await selectContext('ME2'); await click(action('chronicle-load'));
  const loaded = await exportChronicle('me2-reloaded'); assert.deepEqual(loaded.session, me2Preparation.session);
  await launch('ME2-CHR-SHEPARD'); const restarted = await positions('ME2-restarted'); assert.deepEqual(restarted['ME2-CHR-SHEPARD'], { x: -3.8, z: 0 });
  assert.equal(await page.locator('[data-chronicle-position-revision]').getAttribute('data-chronicle-position-revision'), '0');
  await pause(); await capture('me2-restarted', page.locator('[data-chronicle-position-revision]')); await click(action('chronicle-preparation'));
  check('Real Chronicle import, save and browser reload preserve class/equipment; a new battle starts at revision 0 without live positions or statuses');
  await prepare('ME3', 'soldier'); await launch('ME3-CHR-SHEPARD'); assert.equal(await action('chronicle-action', 'bioticCharge').count(), 0); await click(action('chronicle-preparation'));
  await selectContext('ME3', 'me3-prologue'); await page.locator('#chronicle-scenario').selectOption('me3-earth-prologue'); await click(action('chronicle-start'));
  assert.equal(await page.locator('[data-chronicle-build] option[value="vanguard"]:not(:disabled)').count(), 0);
  await launch('ME3-CHR-SHEPARD'); assert.equal(await page.locator('[data-chronicle-position-revision]').count(), 0); assert.equal(await action('chronicle-action', 'bioticCharge').count(), 0);
  await pause(); await capture('me3-prologue-isolated', page.locator('.chronicle-combat'));
  assert.deepEqual(await campaignStorage(), witnessBefore);
  check('ME3 Soldier and the earlier Earth prologue have no Charge; the prologue has no new arena; ME1 witness storage remains byte-identical');
  await Promise.all(pending); assert.deepEqual(report.errors, []); assert.deepEqual(report.consoleErrors, []); assert.deepEqual(report.failedRequests, []);
  if (mode === 'production') { assert.deepEqual(report.sourceRequests, []); assert.deepEqual(await tree(new URL('dist/', root)), report.distFiles); assert.ok(report.servedFiles.length > 1); }
  for (const [path, expected] of Object.entries(report.sourceHashes)) assert.equal(sha(await readFile(new URL(path, root))), expected, `Source changed during run: ${path}`);
  for (const [path, expected] of Object.entries(report.registryContextHashes)) assert.equal(sha(await readFile(new URL(path, root))), expected, `Registry context changed during run: ${path}`);
  report.sourceFrozen = true; report.registryContextFrozen = mode === 'dev'; report.distFrozen = mode === 'production'; report.passed = true;
} catch (error) { report.failure = error.stack || String(error); process.exitCode = 1; if (page) try { await capture('failure'); } catch {} }
finally { await browser?.close(); await writeFile(output, JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, captures: report.captures.length, exports: report.exports.length, failure: report.failure })); }
