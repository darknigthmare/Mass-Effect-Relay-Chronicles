// Separate public proof for existing modules/readings. Does not alter the frozen
// signature/talent collector or any product source. No QA API or injected state.
import assert from 'node:assert/strict';
import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { newGame, encodeSave } from '../src/state.js';
import { decodeChronicle, buildChronicleActor } from '../src/chronicles.js';
import { exerciseReadings } from './completion-chronicles-support-readings.mjs';

const root = new URL('../', import.meta.url), endpoint = new URL(process.env.GAME_URL || 'http://127.0.0.1:4193/');
const mode = process.env.COMPLETION_CHRONICLES_SUPPORT_MODE || 'development', prefix = process.env.COMPLETION_CHRONICLES_SUPPORT_PREFIX;
assert.ok(['development', 'production'].includes(mode)); assert.match(prefix || '', /^completion-chronicles-support-[a-z0-9-]+$/); assert.equal(endpoint.search, '');
const output = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(output); throw Error('Preserve every earlier attempt: choose a fresh COMPLETION_CHRONICLES_SUPPORT_PREFIX.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sourcePaths = ['src/main.js', 'src/state.js', 'src/chronicles.js', 'src/continuity.js', 'src/continuity-data.js',
  'src/chronicle-story.js', 'src/universe-data.js', 'src/universe-actors.js', 'src/universe-equipment.js', 'src/universe-ui.js',
  'src/universe-ui.css', 'src/combat.js', 'scripts/completion-chronicles-support-public.mjs', 'scripts/completion-chronicles-support-readings.mjs',
  'tests/fixtures/chronicle-v1-before-expansion.json'];
const report = { passed: false, at: new Date().toISOString(), family: 'chronicles-support', mode, url: endpoint.href,
  command: { script: 'node scripts/completion-chronicles-support-public.mjs', environment: { GAME_URL: endpoint.href,
    COMPLETION_CHRONICLES_SUPPORT_MODE: mode, COMPLETION_CHRONICLES_SUPPORT_PREFIX: prefix } },
  scope: 'Bounded public legacy migration, two compatible module families, reserve conservation, invalid-parent rejection and documentary reading/navigation/save/isolation. Existing functionality only; no original scene, model, campaign victory or artistic fidelity is certified.',
  inputMethod: 'Actual public selectors, pointer clicks, uploads/downloads, ordinary scrolling and browser reload. Page evaluation reads DOM or storage only. No QA/source import in the page, DOM/style/state manipulation, game-clock step or event-handler invocation.',
  fixtures: [], imports: [], exports: [], captures: [], checks: [], observations: [], sourceHashes: {}, registrySourceHashes: {}, registrySnapshot: null,
  errors: [], consoleErrors: [], failedRequests: [], resourceWarnings: [], sourceRequests: [], servedFiles: [], distFiles: {},
  limitations: ['The ME1 witness is a neutral native newGame imported through the public chooser, with no preceding progression claimed.',
    'The historical pre-expansion Chronicle is an unchanged native fixture from commit994a963, declared with its provenance. An invalid-parent payload is an explicitly declared rejection probe.',
    'Module statistics are read from actual public exports through the native actor builder and checked against the displayed native battle ammunition. No battle damage or victory is manufactured.',
    'Damage-only weapon multiplier behavior and all sixteen readings remain additionally covered by fresh native integration tests. This public sample inspects one reading path and its foreign-context boundary.',
    'Values and visual cards remain ATB/prototype adaptations; no original weapon model, animation or complete original campaign is certified.'] };
let browser, page;
const pending = [], served = new Set(), action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
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
  report.captures.push({ label, path, bytes: bytes.length, sha256: sha(bytes), source: 'Actual public viewport without DOM, style, state or pose injection.' });
}
async function ready() {
  await page.locator('#hud:not(.hidden) .location h2').waitFor(); await page.locator('#transition.active').waitFor({ state: 'hidden' });
  await page.locator('#overlay .screen, #overlay .dialogue').waitFor({ state: 'hidden' });
}
async function recordFixture(label, bytes, origin) {
  assert.match(label, /^[a-z0-9-]+$/); const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  const path = `docs/qa/${prefix}-${label}-fixture.json`; await writeFile(new URL(path, root), buffer);
  report.fixtures.push({ label, path, bytes: buffer.length, sha256: sha(buffer), origin }); return { path, bytes: buffer };
}
async function importChronicle({ bytes, label = 'chronicle', valid = true }) {
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes), expected = decodeChronicle(buffer.toString()); assert.equal(!!expected, valid);
  // The old feedback is only observed for detachment, never clicked or mutated.
  const feedback = page.locator('.universe-feedback').first();
  const previous = await feedback.count() ? await feedback.elementHandle() : null;
  await page.locator('#chronicle-import').setInputFiles({ name: `${label}.json`, mimeType: 'application/json', buffer });
  if (previous) { await previous.waitForElementState('hidden'); await previous.dispose(); }
  await page.getByText(valid ? 'Chronique importée.' : 'Ce fichier n’est pas une chronique valide.', { exact: true }).waitFor();
  assert.equal(await page.locator('.universe-feedback.error').count(), valid ? 0 : 1);
  report.imports.push({ label, valid, bytes: buffer.length, sha256: sha(buffer), context: expected?.context || null,
    feedback: await page.locator('.universe-feedback').innerText() }); return expected;
}
async function exportChronicle(label) {
  const [download] = await Promise.all([page.waitForEvent('download'), click(action('chronicle-export'))]);
  const path = `docs/qa/${prefix}-${label}-export.json`; await download.saveAs(fileURLToPath(new URL(path, root)));
  assert.equal(await download.failure(), null); const bytes = await readFile(new URL(path, root)), session = decodeChronicle(bytes.toString()); assert.ok(session);
  report.exports.push({ label, path, bytes: bytes.length, sha256: sha(bytes), context: session.context, scenarioId: session.scenarioId }); return { bytes, session };
}
async function campaignStorage() { return page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(key => key === 'relay-chronicles.save.v1'
  || key.startsWith('relay-chronicles.manual-save.v1.')).sort().map(key => [key, localStorage.getItem(key)]))); }
async function exerciseModules(baselineCampaign) {
  const fixture = JSON.parse(await readFile(new URL('tests/fixtures/chronicle-v1-before-expansion.json', root))), original = structuredClone(fixture.packet);
  assert.equal(Object.hasOwn(original.session, 'builds'), false); assert.equal(Object.keys(original.session.loadouts[original.session.party[0]]).length, 2);
  const declared = await recordFixture('historical-two-slot', JSON.stringify(original), { kind: 'unchanged-historical-native-fixture', played: false, ...fixture.provenance });
  await importChronicle({ bytes: declared.bytes, label: 'historical-two-slot' }); const migrated = await exportChronicle('modules-migrated');
  const id = 'ME3-CHR-SHEPARD', before = buildChronicleActor(migrated.session, id); assert.ok(before);
  for (const actorId of original.session.party) {
    assert.equal(migrated.session.builds[actorId], 'default');
    assert.deepEqual(migrated.session.loadouts[actorId], { ...original.session.loadouts[actorId], weaponMod: null, weaponMod2: null });
  }
  assert.deepEqual(migrated.session.readingProgress, {}); assert.deepEqual(migrated.session.cleared, []);
  const gear = slot => page.locator(`[data-chronicle-gear][data-actor-id="${id}"][data-slot="${slot}"]`);
  assert.equal(await page.locator(`[data-chronicle-build][data-actor-id="${id}"]`).inputValue(), 'default');
  assert.equal(await page.locator(`[data-chronicle-gear][data-actor-id="${id}"]`).count(), 4);
  await gear('weaponMod').selectOption('ME3-EQP-BARREL');
  assert.equal(await gear('weaponMod2').locator('option[value="ME3-EQP-BARREL"]').isDisabled(), true);
  await gear('weaponMod2').selectOption('ME3-EQP-MAGAZINE'); const modules = await exportChronicle('modules-equipped');
  const actor = buildChronicleActor(modules.session, id);
  assert.equal(actor.magazineCapacity, 23); assert.equal(actor.ammo, 23); assert.equal(actor.reserveAmmo, 67);
  assert.equal(actor.ammo + actor.reserveAmmo, before.ammo + before.reserveAmmo);
  assert.equal(actor.weaponDamageMultiplier, 1.12); assert.equal(actor.attack, before.attack); assert.deepEqual(actor.powers, before.powers);
  assert.equal(modules.session.loadouts[id].weapon, original.session.loadouts[id].weapon); assert.equal(modules.session.loadouts[id].armor, original.session.loadouts[id].armor);
  report.observations.push({ label: 'module-export-native-reconstruction', origin: 'Native buildChronicleActor from real public downloads; no live state injected',
    before: { ammo: before.ammo, reserveAmmo: before.reserveAmmo, attack: before.attack, weaponDamageMultiplier: before.weaponDamageMultiplier },
    after: { ammo: actor.ammo, reserveAmmo: actor.reserveAmmo, attack: actor.attack, weaponDamageMultiplier: actor.weaponDamageMultiplier } });
  await capture('modules-two-families', page.locator(`[data-chronicle-actor="${id}"] .universe-module-ports`));
  await click(action('chronicle-battle')); await page.locator('.chronicle-combat').waitFor(); await click(action('chronicle-actor', id));
  assert.match(await page.locator('[data-chronicle-ammo]').innerText(), /^23\/23 au chargeur · réserve 67/);
  await capture('modules-native-ammunition', page.locator('.chronicle-command')); await click(action('chronicle-preparation'));
  check('Unchanged native two-slot import migrates to default/four ports; actual two-family preparation preserves the ninety-shot pool and the native battle displays23/23 with reserve67');
  await gear('weapon').selectOption('ME3-WPN-MANTIS');
  assert.equal(await gear('weaponMod').inputValue(), ''); assert.equal(await gear('weaponMod2').inputValue(), '');
  for (const slot of ['weaponMod', 'weaponMod2']) for (const item of ['ME3-EQP-BARREL', 'ME3-EQP-MAGAZINE'])
    assert.equal(await gear(slot).locator(`option[value="${item}"]`).isDisabled(), true);
  const changed = await exportChronicle('modules-parent-changed'); assert.deepEqual(changed.session.loadouts[id], { weapon: 'ME3-WPN-MANTIS', armor: 'ME3-EQP-N7', weaponMod: null, weaponMod2: null });
  const invalid = JSON.parse(changed.bytes.toString()); invalid.session.loadouts[id].weaponMod = 'ME3-EQP-BARREL';
  const rejection = await recordFixture('invalid-module-parent', JSON.stringify(invalid), { kind: 'declared-invalid-import-probe', played: false,
    basis: 'Actual public export with exactly one invalid retained assault-rifle barrel on the Mantis sniper parent; intended rejection, never a played preparation.' });
  await importChronicle({ bytes: rejection.bytes, label: 'invalid-module-parent', valid: false });
  const afterRejection = await exportChronicle('modules-rejected-parent'); assert.deepEqual(afterRejection.session, changed.session);
  assert.deepEqual(await campaignStorage(), baselineCampaign);
  await capture('modules-parent-rejected', page.locator('.universe-feedback'));
  check('Real weapon change removes both modules, incompatible parents stay disabled, and invalid-parent public import is rejected atomically without changing the Chronicle or ME1');
}
try {
  for (const path of sourcePaths) {
    const bytes = await readFile(new URL(path, root));
    if (mode === 'development' && path === 'src/universe-data.js') {
      const snapshotPath = `docs/qa/${prefix}-registry-source.js`; await writeFile(new URL(snapshotPath, root), bytes);
      report.registrySourceHashes[path] = sha(bytes); report.registrySnapshot = { sourcePath: path, path: snapshotPath, bytes: bytes.length, sha256: sha(bytes),
        scope: 'Exact generated-registry context bytes at DEV start; separate from product logic. Current bytes and snapshot are checked again at end. Production keeps this source in strict sourceHashes.' };
    } else report.sourceHashes[path] = sha(bytes);
  }
  if (mode === 'production') report.distFiles = await tree(new URL('dist/', root));
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  report.chromium = browser.version(); page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, acceptDownloads: true }); page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(error.message)); page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('console', message => { if (message.type() === 'error') { const entry = { text: message.text(), location: message.location() };
    if (entry.location.url === new URL('favicon.ico', endpoint).href && entry.text === 'Failed to load resource: the server responded with a status of 404 (Not Found)') report.resourceWarnings.push(entry); else report.consoleErrors.push(entry); } });
  page.on('response', response => {
    const url = new URL(response.url()); if (url.pathname.startsWith('/src/') || url.pathname.includes('/@vite/')) report.sourceRequests.push(response.url());
    if (response.status() >= 400 && !(response.status() === 404 && url.href === new URL('favicon.ico', endpoint).href)) report.failedRequests.push(`${response.status()} ${response.url()}`);
    const key = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    if (mode === 'production' && response.status() === 200 && report.distFiles[key] && !served.has(key) && (key === 'index.html' || /\.(js|css)$/.test(key))) {
      served.add(key); pending.push((async () => { const bytes = await response.body(), expected = report.distFiles[key]; assert.equal(bytes.length, expected.bytes, key); assert.equal(sha(bytes), expected.sha256, key);
        report.servedFiles.push({ path: key, bytes: bytes.length, sha256: sha(bytes) }); })());
    }
  });
  await page.goto(endpoint.href, { waitUntil: 'networkidle' }); assert.equal(await page.evaluate(() => Object.hasOwn(window, '__RELAY_TEST__')), false);
  const witness = await recordFixture('campaign-witness', encodeSave(newGame({ name: 'Témoin modules lectures', classId: 'engineer' })), { kind: 'native-newGame', APIs: ['newGame', 'encodeSave'], played: false, xp: 0 });
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), click(action('import'))]); await chooser.setFiles({ name: 'campaign-witness.json', mimeType: 'application/json', buffer: witness.bytes });
  await ready(); await click(action('pause')); await click(action('chronicles')); await page.locator('.universe-screen').waitFor(); const baselineCampaign = await campaignStorage();
  await exerciseModules(baselineCampaign);
  report.readings = await exerciseReadings({ page, action, click, capture, exportChronicle, importChronicle, check, campaignStorage, baselineCampaign, recordFixture });
  assert.deepEqual(await campaignStorage(), baselineCampaign); await Promise.all(pending);
  assert.deepEqual(report.errors, []); assert.deepEqual(report.consoleErrors, []); assert.deepEqual(report.failedRequests, []);
  if (mode === 'production') { assert.deepEqual(report.sourceRequests, []); assert.deepEqual(await tree(new URL('dist/', root)), report.distFiles); assert.ok(report.servedFiles.length > 1); }
  for (const [path, expected] of Object.entries(report.sourceHashes)) assert.equal(sha(await readFile(new URL(path, root))), expected, `Source changed during run: ${path}`);
  for (const [path, expected] of Object.entries(report.registrySourceHashes)) {
    const bytes = await readFile(new URL(path, root)); assert.equal(bytes.length, report.registrySnapshot.bytes, path); assert.equal(sha(bytes), expected, path);
    const snapshot = await readFile(new URL(report.registrySnapshot.path, root)); assert.equal(snapshot.length, bytes.length); assert.equal(sha(snapshot), expected);
  }
  report.registrySourceFrozen = mode === 'development';
  report.sourceFrozen = true; report.distFrozen = mode === 'production'; report.passed = true;
} catch (error) { report.failure = error.stack || String(error); process.exitCode = 1; if (page) try { await capture('failure'); } catch {} }
finally { await browser?.close(); await writeFile(output, JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length,
  captures: report.captures.length, exports: report.exports.length, imports: report.imports.length, failure: report.failure })); }
