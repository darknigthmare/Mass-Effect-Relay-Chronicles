// Real public UI purchases and save operations. XP is an explicitly prepared
// fixture, never claimed earned by playing the preceding campaign.
import assert from 'node:assert/strict';
import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { newGame, encodeSave, decodeSave } from '../src/state.js';
import { getTalentBudget } from '../src/campaign-talents.js';
import { getLevelLayout } from '../src/level-layout-data.js';
import { recordVisit } from '../src/story.js';

const root = new URL('../', import.meta.url), endpoint = new URL(process.env.GAME_URL || 'http://127.0.0.1:4183/');
const mode = process.env.PRIORITY_TALENTS_MODE || 'dev', prefix = process.env.PRIORITY_TALENTS_PREFIX;
assert.ok(['dev', 'production'].includes(mode)); assert.match(prefix || '', /^priority-talents-[a-z0-9-]+$/); assert.equal(endpoint.search, '');
const output = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(output); throw Error('Preserve earlier attempts and choose a fresh PRIORITY_TALENTS_PREFIX.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const paths = ['src/main.js', 'src/state.js', 'src/game-data.js', 'src/loadout.js', 'src/combat.js', 'src/campaign-talents.js',
  'src/campaign-talents-ui.js', 'src/campaign-talents.css', 'src/save-slots.js', 'src/customization.js', 'scripts/priority-talents-public.mjs'];
const report = { passed: false, at: new Date().toISOString(), mode, url: endpoint.href,
  command: { script: 'node scripts/priority-talents-public.mjs', environment: { GAME_URL: endpoint.href, PRIORITY_TALENTS_MODE: mode, PRIORITY_TALENTS_PREFIX: prefix } },
  scope: 'Public talent purchases, armour shared budget, class prerequisite, actual exports, manual save/load, automatic reload and rejection of a malformed talent import; desktop and mobile. No campaign victory or talent combat action is claimed played by this collector.',
  sourceHashes: {}, fixtures: [], exports: [], captures: [], checks: [], errors: [], failedRequests: [], consoleErrors: [], resourceWarnings: [], sourceRequests: [], distFiles: {}, servedFiles: [],
  limitations: ['Prepared native fixtures give XP directly for a bounded menu/save inspection; that XP is not claimed earned in this browser.',
    'One Normandy soldier, one Normandy engineer and one early Eden engineer context are inspected. Complete original talent trees and physical controller/hardware performance are not certified.',
    'All talent ranks, durations and multipliers remain ATB adaptations. Native combat effects have separate integration tests.'] };
let browser, page;
const pending = [], served = new Set();
const button = action => page.locator(`[data-do="${action}"]`).first();
const click = async locator => { await locator.waitFor({ state: 'visible' }); assert.equal(await locator.isEnabled(), true); await locator.click(); };
const stable = state => { const copy = structuredClone(state); delete copy.playedSeconds; return copy; };
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
async function ready() {
  await page.locator('#hud:not(.hidden) .location h2').waitFor();
  await page.locator('#transition.active').waitFor({ state: 'hidden' });
  await page.locator('#overlay .screen, #overlay .dialogue').waitFor({ state: 'hidden' });
  assert.equal(await page.evaluate(() => Object.hasOwn(window, '__RELAY_TEST__')), false);
}
async function capture(label) {
  const path = `docs/screenshots/${prefix}-${label}.png`, bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)), animations: 'disabled' });
  report.captures.push({ label, path, sha256: sha(bytes), bytes: bytes.length, source: 'Actual public viewport, without state/DOM/style/pose injection.' });
}
async function fixture(state, label) {
  const bytes = encodeSave(state), path = `docs/qa/${prefix}-${label}-fixture.json`; assert.ok(decodeSave(bytes));
  await writeFile(new URL(path, root), bytes);
  const entry = { label, path, sha256: sha(bytes), importedViaPublicChooser: false, xp: state.xp, classId: state.classId,
    origin: 'Native newGame with explicitly prepared XP; no claim to preceding played progression.' };
  report.fixtures.push(entry); return { entry, bytes: Buffer.from(bytes) };
}
async function importFixture(value) {
  if (!await button('import').isVisible()) { await ready(); await click(button('pause')); await click(button('quit')); }
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), click(button('import'))]);
  await chooser.setFiles({ name: value.entry.path.split('/').at(-1), mimeType: 'application/json', buffer: value.bytes });
  await ready(); value.entry.importedViaPublicChooser = true;
}
async function exportState(label) {
  await ready(); await click(button('pause')); await click(button('save'));
  const [download] = await Promise.all([page.waitForEvent('download'), click(button('export'))]);
  const path = `docs/qa/${prefix}-${label}-export.json`; await download.saveAs(fileURLToPath(new URL(path, root))); assert.equal(await download.failure(), null);
  const bytes = await readFile(new URL(path, root)), state = decodeSave(bytes.toString()); assert.ok(state);
  report.exports.push({ label, path, sha256: sha(bytes), bytes: bytes.length });
  await click(button('close')); await ready(); return state;
}
async function openTalents() { await ready(); await click(button('pause')); await click(button('talents')); await page.locator('.talent-grid').waitFor(); }
async function buy(id, count = 1) {
  for (let index = 0; index < count; index++) await click(page.locator(`[data-do="talent-buy"][data-actor="shepard"][data-id="${id}"]`));
}
try {
  for (const path of paths) report.sourceHashes[path] = sha(await readFile(new URL(path, root)));
  if (mode === 'production') report.distFiles = await tree(new URL('dist/', root));
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  report.chromium = browser.version();
  page = await browser.newPage({ viewport: { width: 1280, height: 800 }, acceptDownloads: true }); page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const entry = { text: message.text(), location: message.location() };
    if (entry.location.url === new URL('favicon.ico', endpoint).href && entry.text === 'Failed to load resource: the server responded with a status of 404 (Not Found)') report.resourceWarnings.push({ ...entry, qualification: 'Exact absent-favicon request; separate from game resources.' });
    else report.consoleErrors.push(entry);
  });
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.pathname.startsWith('/src/') || url.pathname.includes('/@vite/')) report.sourceRequests.push(response.url());
    if (response.status() >= 400) {
      if (response.status() === 404 && url.href === new URL('favicon.ico', endpoint).href) report.resourceWarnings.push({ status: 404, url: url.href, qualification: 'Exact browser favicon request.' });
      else report.failedRequests.push(`${response.status()} ${response.url()}`);
    }
    const key = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    if (mode === 'production' && response.status() === 200 && report.distFiles[key] && !served.has(key)
      && (key === 'index.html' || /\.(js|css)$/.test(key))) {
      served.add(key); pending.push((async () => { const bytes = await response.body(), expected = report.distFiles[key];
        assert.equal(bytes.length, expected.bytes, key); assert.equal(sha(bytes), expected.sha256, key);
        report.servedFiles.push({ path: key, status: 200, bytes: bytes.length, sha256: sha(bytes) }); })());
    }
  });
  await page.goto(endpoint.href, { waitUntil: 'networkidle' });
  const soldier = newGame({ name: 'QA Talents Soldat', classId: 'soldier' }); soldier.xp = 1800;
  await importFixture(await fixture(soldier, 'soldier'));
  const soldierBefore = await exportState('soldier-before');
  await openTalents(); await capture('soldier-before');
  await buy('fitness', 2); await buy('assault-training', 2); await buy('pistols'); await capture('soldier-purchased');
  await click(button('close')); await ready(); await click(button('equipment'));
  await click(page.locator('[data-do="eq-train"][data-weight="heavy"]'));
  await capture('shared-armour-training'); await click(button('close')); await ready();
  const soldierAfter = await exportState('soldier-after');
  const expectedSoldier = stable(soldierBefore); expectedSoldier.talents.ranks.shepard = { fitness: 2, 'assault-training': 2, pistols: 1 };
  expectedSoldier.inventory.training.shepard = { weights: { heavy: true }, legacyArmor: null };
  assert.deepEqual(stable(soldierAfter), expectedSoldier); assert.equal(getTalentBudget(soldierAfter, 'shepard').available, 0);
  await openTalents(); assert.equal(await page.locator('[data-do="talent-buy"]:not(:disabled)').count(), 0); await capture('shared-budget-empty');
  await click(button('close')); await ready(); check('Actual soldier talent purchases and armour training exhaust the same six-point budget without granting currency or items');

  await click(button('pause')); await click(button('manual-saves'));
  await page.locator('[data-manual-name="1"]').fill('QA Talents partagés'); await click(page.locator('[data-do="manual-save"][data-id="1"]'));
  await page.locator('[data-save-slot="1"][data-status="saved"]').waitFor(); await capture('manual-save');
  await click(page.locator('[data-do="manual-load"][data-id="1"]')); await ready();
  const manual = await exportState('soldier-manual-reload'); assert.deepEqual(stable(manual), stable(soldierAfter));
  check('Public manual save and load preserve talent ranks, armour training, inventory and progression exactly except played time');

  const engineer = newGame({ name: 'QA Talents Ingénieur', classId: 'engineer' }); engineer.xp = 900;
  await importFixture(await fixture(engineer, 'engineer')); const engineerBefore = await exportState('engineer-before');
  await openTalents(); assert.equal(await page.locator('[data-do="talent-buy"][data-id="damping"]').isDisabled(), true);
  assert.equal(await page.locator('[data-talent-id="fitness"]').count(), 0); await capture('engineer-prerequisite');
  await buy('electronics'); await buy('damping', 2); await capture('engineer-unlocked');
  await click(button('close')); await ready(); const engineerAfter = await exportState('engineer-after');
  const expectedEngineer = stable(engineerBefore); expectedEngineer.talents.ranks.shepard = { electronics: 1, damping: 2 };
  assert.deepEqual(stable(engineerAfter), expectedEngineer);
  await page.reload({ waitUntil: 'networkidle' }); await click(button('continue')); await ready();
  const resumed = await exportState('engineer-automatic-reload'); assert.deepEqual(stable(resumed), stable(engineerAfter));
  check('Engineer prerequisite/class restrictions and actual automatic reload retain three purchased ranks without granting Soldier abilities');

  const invalid = JSON.parse(encodeSave(resumed)); invalid.state.talents.ranks.shepard['later-game-power'] = 1; assert.equal(decodeSave(invalid), null);
  await click(button('pause')); await click(button('quit'));
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), click(button('import'))]);
  await chooser.setFiles({ name: 'invalid-talents.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(invalid)) });
  await page.getByText('Ce fichier n’est pas une sauvegarde valide.', { exact: true }).waitFor();
  assert.equal(await button('continue').isVisible(), true); await click(button('continue')); await ready();
  const unchanged = await exportState('after-rejected-import'); assert.deepEqual(stable(unchanged), stable(resumed));
  check('Malformed talent import is visibly rejected and the previous campaign remains loadable without partial changes');

  const away = newGame({ name: 'QA Talents Terrain', classId: 'engineer' }); away.xp = 900; away.flags.briefed = true;
  away.zone = 'eden-prime'; recordVisit(away, away.zone); away.position = { ...getLevelLayout(away.zone).spawn };
  await importFixture(await fixture(away, 'early-eden'));
  await page.setViewportSize({ width: 390, height: 844 }); await openTalents();
  assert.equal(await page.locator('[data-do="talent-buy"]:not(:disabled)').count(), 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await capture('away-mobile'); await page.locator('[data-talent-id="damping"]').scrollIntoViewIfNeeded(); await capture('away-mobile-last-card');
  await click(button('close')); await ready(); const awayAfter = await exportState('away-unchanged');
  assert.deepEqual(awayAfter.talents, away.talents); assert.deepEqual(awayAfter.inventory, away.inventory);
  check('Mobile cards remain scrollable without horizontal overflow and field training is disabled without changing talents');

  await Promise.all(pending);
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []); assert.deepEqual(report.consoleErrors, []);
  if (mode === 'production') { assert.deepEqual(report.sourceRequests, []); assert.deepEqual(await tree(new URL('dist/', root)), report.distFiles); assert.ok(report.servedFiles.length > 1); }
  for (const [path, expected] of Object.entries(report.sourceHashes)) assert.equal(sha(await readFile(new URL(path, root))), expected, `Source changed during run: ${path}`);
  report.sourceFrozen = true; report.distFrozen = mode === 'production'; report.passed = true;
} catch (error) { report.failure = error.stack || String(error); process.exitCode = 1; if (page) try { await capture('failure'); } catch {} }
finally { await browser?.close(); await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, captures: report.captures.length, exports: report.exports.length, failure: report.failure })); }
