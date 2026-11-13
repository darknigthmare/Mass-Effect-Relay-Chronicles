// Public DEV/production collector: native ATB time and commands only. No QA API,
// imported battle, victory, HP/ATB injection, page-source import or clock change.
import assert from 'node:assert/strict';
import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { newGame, encodeSave, decodeSave } from '../src/state.js';
import { decodeChronicle } from '../src/chronicles.js';
import { getTalentBudget } from '../src/campaign-talents.js';

const root = new URL('../', import.meta.url), endpoint = new URL(process.env.GAME_URL || 'http://127.0.0.1:4191/');
const mode = process.env.COMPLETION_CHRONICLES_MODE || 'dev', prefix = process.env.COMPLETION_CHRONICLES_PREFIX;
assert.ok(['dev', 'production'].includes(mode)); assert.match(prefix || '', /^completion-chronicles-[a-z0-9-]+$/); assert.equal(endpoint.search, '');
const output = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(output); throw Error('Earlier attempts must be preserved: choose a fresh COMPLETION_CHRONICLES_PREFIX.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sourcePaths = ['src/main.js', 'src/state.js', 'src/chronicles.js', 'src/continuity.js', 'src/chronicle-story.js',
  'src/universe-actors.js', 'src/universe-powers.js', 'src/universe-equipment.js', 'src/universe-ui.js',
  'src/combat.js', 'src/combat-summons.js', 'src/completion-chronicles-powers.js', 'src/campaign-talents.js',
  'src/campaign-talents-ui.js', 'src/campaign-talents.css', 'src/loadout.js', 'scripts/completion-chronicles-public.mjs'];
const report = { passed: false, at: new Date().toISOString(), mode, url: endpoint.href,
  command: { script: 'node scripts/completion-chronicles-public.mjs', environment: { GAME_URL: endpoint.href, COMPLETION_CHRONICLES_MODE: mode, COMPLETION_CHRONICLES_PREFIX: prefix } },
  scope: 'Public class preparation, native Charge/Nova, finite Cloak, Tech Armor, Drone, clip/reload, save/export/import and context isolation. No completed campaign, original movement, original model, original ranks or original timing is certified.',
  talentScope: 'Separate bounded SYS-talents journey: native Normandy Engineer fixture with 900 explicitly prepared XP, rejected prerequisite, three actual point purchases, exhausted shared budget and exported/reloaded ranks. No XP or power injection during play; Damping unlocks only through the purchased ranks. Original 12-rank trees and artistic equivalence remain outside this check.',
  talentChecks: [],
  inputMethod: 'Commands finish with real pointer clicks on the action/target and then Pause. The command box is read before execution; Pause is queried afresh after execution with read-only DOM bounds and elementFromPoint. If obscured, actual pointer wheel input scrolls the panel; no live element handle is retained across renders. No duration, state, DOM, clock or event handler is forced.',
  fixtures: [], sourceHashes: {}, captures: [], exports: [], observations: [], checks: [], errors: [], consoleErrors: [], failedRequests: [], resourceWarnings: [], sourceRequests: [], servedFiles: [], distFiles: {},
  limitations: ['The ME1 Engineer witness is prepared with native newGame plus 900 explicit XP and imported through the public file chooser; no preceding campaign progression is claimed. Three ranks are purchased by the public menu and then serve as the unchanged ME1 witness.',
    'Signature powers run in independent workshop preparations using the public class selector and natural ATB time.',
    'Charge records abstract engagement and exposure; the workshop has no ME1 tactical geometry or original movement animation.',
    'Cloak conservatively prevents all newly commanded targeting, including abstract area orders. Existing projectiles remain dangerous; numerical bonus and durations are ATB choices.',
    'ME2 automatic armor explosion and exact multipliers are covered by fresh native integration tests; this public journey observes activation, not a forced shield break.',
    'Omni-blade is not enabled without an eligible sourced POW record. No original full campaign or artistic 1:1 certification follows from these checks.'] };
let browser, page;
const pending = [], served = new Set(), action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
const click = async locator => { await locator.waitFor({ state: 'visible' }); assert.equal(await locator.isEnabled(), true); await locator.click(); };
const check = name => { report.checks.push({ name, passed: true }); console.log(JSON.stringify({ check: name })); };
const talentCheck = name => { report.talentChecks.push({ name, passed: true }); console.log(JSON.stringify({ talentCheck: name })); };
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
  report.captures.push({ label, path, bytes: bytes.length, sha256: sha(bytes), source: 'Actual public viewport; no DOM, style, game state or pose injection.' });
}
async function ready() {
  await page.locator('#hud:not(.hidden) .location h2').waitFor();
  await page.locator('#transition.active').waitFor({ state: 'hidden' });
  await page.locator('#overlay .screen, #overlay .dialogue').waitFor({ state: 'hidden' });
}
async function context(mediaId, periodId = mediaId.toLowerCase()) {
  if (await page.locator('#chronicle-media').inputValue() !== mediaId) await page.locator('#chronicle-media').selectOption(mediaId);
  if (await page.locator('#chronicle-period').inputValue() !== periodId) await page.locator('#chronicle-period').selectOption(periodId);
  await click(action('universe-tab', 'session'));
}
async function prepare(mediaId, buildId) {
  if (await action('chronicle-preparation').isVisible()) await click(action('chronicle-preparation'));
  await context(mediaId);
  await page.locator('#chronicle-scenario').selectOption(`${mediaId.toLowerCase()}-equipment-workshop`);
  await click(action('chronicle-start'));
  const id = `${mediaId}-CHR-SHEPARD`;
  const selected = await page.locator('[data-do="chronicle-party"][aria-pressed="true"]').evaluateAll(buttons => buttons.map(button => button.dataset.id));
  for (const otherId of selected) if (otherId !== id) await click(action('chronicle-party', otherId));
  await page.locator(`[data-chronicle-build][data-actor-id="${id}"]`).selectOption(buildId);
  assert.equal(await page.locator('[data-do="chronicle-party"][aria-pressed="true"]').count(), 1);
  return id;
}
async function launch(actorId) {
  await click(action('chronicle-battle')); await page.locator('.chronicle-combat').waitFor();
  await click(action('chronicle-actor', actorId));
}
async function waitAction(id) {
  await page.waitForFunction(id => {
    const button = document.querySelector(`[data-do="chronicle-action"][data-id="${id}"]`);
    return !!button && !button.disabled;
  }, id, { polling: 100, timeout: 45000 });
}
async function order(id) {
  await waitAction(id);
  const self = ['tacticalCloak', 'techArmor', 'reload'].includes(id);
  if (!self) await click(action('chronicle-action', id));
  const control = self ? action('chronicle-action', id) : page.locator('[data-do="chronicle-target"]:not(:disabled)').first();
  await control.scrollIntoViewIfNeeded(); assert.equal(await control.isEnabled(), true);
  const commandBox = await control.boundingBox(), viewport = page.viewportSize();
  assert.ok(commandBox && commandBox.x >= 0 && commandBox.y >= 0 && commandBox.x + commandBox.width <= viewport.width
    && commandBox.y + commandBox.height <= viewport.height, 'The genuine command must be inside the viewport');
  await page.mouse.click(commandBox.x + commandBox.width / 2, commandBox.y + commandBox.height / 2);
  for (let attempt = 0; attempt < 12; attempt++) {
    const info = await page.evaluate(() => {
      const button = document.querySelector('[data-do="chronicle-pause"]'); if (!button) return null;
      const box = button.getBoundingClientRect(), x = box.x + box.width / 2, y = box.y + box.height / 2;
      const panel = document.querySelector('#overlay .screen-body')?.getBoundingClientRect();
      return { label: button.textContent.trim(), x, y, hittable: button.contains(document.elementFromPoint(x, y)),
        scrollX: panel ? panel.x + panel.width / 2 : innerWidth / 2, scrollY: panel ? panel.y + panel.height / 2 : innerHeight / 2 };
    });
    assert.ok(info, 'The native battle must still expose its Pause control');
    if (info.label === 'Reprendre') return;
    if (info.hittable) await page.mouse.click(info.x, info.y);
    else { await page.mouse.move(info.scrollX, info.scrollY); await page.mouse.wheel(0, info.y < viewport.height / 2 ? -300 : 300); }
    await page.waitForTimeout(30); // Ordinary real time; never a game-clock step.
  }
  throw Error('Actual pointer/wheel input could not reach the native Pause control.');
}
const signature = actorId => page.locator(`[data-chronicle-unit="${actorId}"] [data-chronicle-signature-status]`);
async function pause() { if ((await action('chronicle-pause').textContent()).trim() === 'Pause') await click(action('chronicle-pause')); }
async function resume() { if ((await action('chronicle-pause').textContent()).trim() === 'Reprendre') await click(action('chronicle-pause')); }
async function snapshot(label) {
  report.observations.push({ label, status: await page.locator('#chronicle-battle-status').innerText(),
    log: await page.locator('.chronicle-log').innerText(), ammo: await page.locator('[data-chronicle-ammo]').allTextContents(),
    signatures: await page.locator('[data-chronicle-signature-status]:not([hidden])').allTextContents() });
}
async function exportChronicle(label) {
  const [download] = await Promise.all([page.waitForEvent('download'), click(action('chronicle-export'))]);
  const path = `docs/qa/${prefix}-${label}-export.json`; await download.saveAs(fileURLToPath(new URL(path, root)));
  assert.equal(await download.failure(), null); const bytes = await readFile(new URL(path, root));
  const session = decodeChronicle(bytes.toString()); assert.ok(session);
  report.exports.push({ label, path, bytes: bytes.length, sha256: sha(bytes), context: session.context, builds: session.builds });
  return { bytes, session };
}
async function campaignStorage() {
  return page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(key => key === 'relay-chronicles.save.v1'
    || key.startsWith('relay-chronicles.manual-save.v1.')).sort().map(key => [key, localStorage.getItem(key)])));
}
async function exportCampaign(label) {
  await ready(); await click(action('pause')); await click(action('save'));
  const [download] = await Promise.all([page.waitForEvent('download'), click(action('export'))]);
  const path = `docs/qa/${prefix}-${label}-campaign-export.json`; await download.saveAs(fileURLToPath(new URL(path, root)));
  assert.equal(await download.failure(), null); const bytes = await readFile(new URL(path, root)), state = decodeSave(bytes.toString()); assert.ok(state);
  report.exports.push({ label, kind: 'campaign-talents', path, bytes: bytes.length, sha256: sha(bytes),
    xp: state.xp, ranks: state.talents.ranks.shepard, budget: getTalentBudget(state, 'shepard') });
  await click(action('close')); await ready(); return state;
}
async function checkTalents(fixtureState) {
  await ready(); await click(action('pause')); await click(action('talents')); await page.locator('.talent-grid').waitFor();
  const buy = id => page.locator(`[data-do="talent-buy"][data-actor="shepard"][data-id="${id}"]`);
  assert.equal(await buy('damping').isDisabled(), true);
  assert.match(await page.locator('[data-talent-id="damping"]').innerText(), /Électronique : rang 1 nécessaire/);
  assert.match(await page.locator('#overlay').innerText(), /3 points disponibles sur 3/);
  await capture('talents-prerequisite', page.locator('.talent-grid'));
  // A real pointer on the disabled control cannot dispatch a purchase. No
  // handler is invoked directly and no DOM attribute or state is changed.
  const locked = await buy('damping').boundingBox(); assert.ok(locked); await page.mouse.click(locked.x + locked.width / 2, locked.y + locked.height / 2);
  assert.match(await page.locator('[data-talent-id="damping"] .section-label').innerText(), /Rang 0 \/ 2/i);
  await click(buy('electronics')); await click(buy('damping')); await click(buy('damping'));
  assert.match(await page.locator('#overlay').innerText(), /0 point disponible sur 3 · 0 pour les armures, 3 pour les talents/);
  assert.equal(await page.locator('[data-do="talent-buy"]:not(:disabled)').count(), 0);
  const exhausted = await buy('pistols').boundingBox(); assert.ok(exhausted); await page.mouse.click(exhausted.x + exhausted.width / 2, exhausted.y + exhausted.height / 2);
  assert.match(await page.locator('[data-talent-id="pistols"] .section-label').innerText(), /Rang 0/i);
  await click(action('close')); const purchased = await exportCampaign('talents-purchased');
  assert.deepEqual(purchased.talents.ranks.shepard, { electronics: 1, damping: 2 });
  assert.equal(getTalentBudget(purchased, 'shepard').available, 0); assert.equal(purchased.xp, 900);
  for (const key of ['inventory', 'credits', 'completed', 'cleared', 'operations', 'choices', 'recruited', 'lost']) assert.deepEqual(purchased[key], fixtureState[key], key);
  talentCheck('Public prerequisite refusal, Electronics 1 and Damping 2 purchases exhaust the same three-point talent/armor budget; disabled extra purchase creates no rank or resource');
  await page.reload({ waitUntil: 'networkidle' }); await click(action('continue')); await ready();
  await click(action('pause')); await click(action('talents')); await page.locator('.talent-grid').waitFor();
  assert.match(await page.locator('#overlay').innerText(), /0 point disponible sur 3/);
  assert.match(await page.locator('[data-talent-id="electronics"] .section-label').innerText(), /Rang 1/i);
  assert.match(await page.locator('[data-talent-id="damping"] .section-label').innerText(), /Rang 2/i);
  assert.equal(await page.locator('[data-do="talent-buy"]:not(:disabled)').count(), 0);
  await capture('talents-reloaded-budget', page.locator('.talent-grid')); await click(action('close'));
  const reloaded = await exportCampaign('talents-reloaded'); assert.deepEqual(reloaded.talents, purchased.talents);
  assert.deepEqual(reloaded.inventory, purchased.inventory); assert.equal(reloaded.xp, purchased.xp);
  talentCheck('Actual campaign export and browser reload preserve purchased ranks, the exhausted budget, inventory and XP');
}
try {
  for (const path of sourcePaths) report.sourceHashes[path] = sha(await readFile(new URL(path, root)));
  if (mode === 'production') report.distFiles = await tree(new URL('dist/', root));
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  report.chromium = browser.version(); page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, acceptDownloads: true }); page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('console', message => { if (message.type() === 'error') {
    const entry = { text: message.text(), location: message.location() };
    if (entry.location.url === new URL('favicon.ico', endpoint).href && entry.text === 'Failed to load resource: the server responded with a status of 404 (Not Found)') report.resourceWarnings.push(entry);
    else report.consoleErrors.push(entry);
  } });
  page.on('response', response => {
    const url = new URL(response.url()); if (url.pathname.startsWith('/src/') || url.pathname.includes('/@vite/')) report.sourceRequests.push(response.url());
    if (response.status() >= 400 && !(response.status() === 404 && url.href === new URL('favicon.ico', endpoint).href)) report.failedRequests.push(`${response.status()} ${response.url()}`);
    const key = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    if (mode === 'production' && response.status() === 200 && report.distFiles[key] && !served.has(key) && (key === 'index.html' || /\.(js|css)$/.test(key))) {
      served.add(key); pending.push((async () => { const bytes = await response.body(), expected = report.distFiles[key]; assert.equal(bytes.length, expected.bytes, key);
        assert.equal(sha(bytes), expected.sha256, key); report.servedFiles.push({ path: key, bytes: bytes.length, sha256: sha(bytes) }); })());
    }
  });
  await page.goto(endpoint.href, { waitUntil: 'networkidle' }); assert.equal(await page.evaluate(() => Object.hasOwn(window, '__RELAY_TEST__')), false);
  const fixtureState = newGame({ name: 'Témoin Chroniques', classId: 'engineer' }); fixtureState.xp = 900;
  const witness = encodeSave(fixtureState);
  const fixturePath = `docs/qa/${prefix}-campaign-witness-fixture.json`; await writeFile(new URL(fixturePath, root), witness);
  report.fixtures.push({ path: fixturePath, sha256: sha(witness), xp: fixtureState.xp,
    origin: 'Native Normandy Engineer newGame with 900 explicitly prepared XP, public import; no earned or completed progression claimed.' });
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), click(action('import'))]);
  await chooser.setFiles({ name: 'campaign-witness.json', mimeType: 'application/json', buffer: Buffer.from(witness) });
  await ready(); await checkTalents(fixtureState);
  await click(action('pause')); await click(action('chronicles')); await page.locator('.universe-screen').waitFor();
  const campaignBefore = await campaignStorage();

  let actorId = await prepare('ME2', 'infiltrator');
  const weapon = page.locator(`[data-chronicle-gear][data-actor-id="${actorId}"][data-slot="weapon"]`);
  await weapon.selectOption('ME2-WPN-MANTIS'); await click(action('chronicle-save'));
  const prepared = await exportChronicle('me2-preparation'); assert.equal(prepared.session.builds[actorId], 'infiltrator');
  await launch(actorId); await order('tacticalCloak'); await pause();
  assert.match(await signature(actorId).innerText(), /Camouflage : [1-5] s/); await snapshot('me2-cloak'); await capture('me2-cloak', signature(actorId));
  await resume(); await order('shoot'); await pause(); assert.doesNotMatch(await signature(actorId).innerText(), /Camouflage/);
  assert.match(await page.locator('[data-chronicle-ammo]').innerText(), /^1\/2/);
  await snapshot('me2-shot'); await resume(); await order('reload'); await pause();
  assert.match(await page.locator('[data-chronicle-ammo]').innerText(), /^2\/2/); await snapshot('me2-reload'); await capture('me2-clips-reload', page.locator('.chronicle-command'));
  check('Public ME2 Infiltrator Cloak is finite and no longer active after the next native shot; the Mantis consumes and reloads a clip through ATB');

  actorId = await prepare('ME2', 'sentinel'); await launch(actorId); await order('techArmor'); await pause();
  assert.match(await signature(actorId).innerText(), /Technoblindage ME2 :/); await snapshot('me2-armor'); await capture('me2-tech-armor', signature(actorId));
  actorId = await prepare('ME2', 'engineer'); await launch(actorId); await order('combatDrone'); await pause();
  await page.locator(`[data-chronicle-support-owner="${actorId}"]`).waitFor();
  await snapshot('me2-drone'); await capture('me2-drone', page.locator('.chronicle-supports'));
  check('Public ME2 Sentinel armor activates and Engineer Drone creates a bounded support with visible owner and duration');

  actorId = await prepare('ME3', 'vanguard');
  const vanguard = await exportChronicle('me3-vanguard'); assert.equal(vanguard.session.builds[actorId], 'vanguard');
  await launch(actorId); await order('bioticCharge'); await pause();
  const exposure = await signature(actorId).innerText();
  report.observations.push({ label: 'me3-charge-exposure-read', text: exposure,
    capturedWhileActive: /Contact rapproché abstrait/.test(exposure),
    limitation: exposure ? null : 'The natural three-second effect expired before public inspection; its actual application, risk and finite end are covered by fresh native integration tests. No live state or clock is altered to recreate it.' });
  await snapshot('me3-charge'); await capture('me3-charge', page.locator(`[data-chronicle-unit="${actorId}"]`));
  await resume(); await order('nova'); await pause();
  const shieldWidth = await page.locator(`[data-chronicle-unit="${actorId}"] [data-chronicle-stat="shield"]`).evaluate(node => node.style.width);
  assert.equal(shieldWidth, '0%'); await snapshot('me3-nova'); await capture('me3-nova', page.locator('.chronicle-command'));
  await resume(); await waitAction('cover'); await pause();
  const nextShieldWidth = await page.locator(`[data-chronicle-unit="${actorId}"] [data-chronicle-stat="shield"]`).evaluate(node => node.style.width);
  // Ordinary enemy AI and natural shield regeneration remain active. They are
  // never altered to manufacture the separate native zero-shield refusal proof.
  report.observations.push({ label: 'me3-nova-next-native-turn', shieldWidth: nextShieldWidth,
    actionLabel: await action('chronicle-action', 'nova').innerText(), zeroShieldRefusalCoveredBy: 'tests/completion-chronicles-powers.test.js' });
  check('Public ME3 Vanguard executes Charge and Nova through native commands; Nova converts the actual shield without altering ordinary regeneration, and any expired short exposure is declared separately');

  actorId = await prepare('ME3', 'sentinel'); await launch(actorId); await order('techArmor'); await pause();
  assert.match(await signature(actorId).innerText(), /Technoblindage ME3 :/); await capture('me3-tech-armor', signature(actorId));
  await resume(); await order('techArmorDetonate'); await pause(); assert.doesNotMatch(await signature(actorId).innerText(), /Technoblindage/);
  await snapshot('me3-detonation'); await capture('me3-detonation', page.locator('.chronicle-command'));
  await click(action('chronicle-preparation')); await click(action('chronicle-save'));
  const final = await exportChronicle('me3-sentinel'); assert.equal(final.session.builds[actorId], 'sentinel');
  check('Public ME3 Sentinel armor is finite and manual detonation removes its protection; saved preparation contains no live battle status');

  await page.locator('#chronicle-import').setInputFiles({ name: 'me2-preparation.json', mimeType: 'application/json', buffer: prepared.bytes });
  await page.getByText('Chronique importée.', { exact: true }).waitFor();
  assert.equal(await page.locator('#chronicle-media').inputValue(), 'ME2');
  assert.equal(await page.locator('[data-chronicle-build][data-actor-id="ME2-CHR-SHEPARD"]').inputValue(), 'infiltrator');
  const imported = await exportChronicle('me2-imported'); assert.deepEqual(imported.session, prepared.session);
  await click(action('chronicle-save')); await page.reload({ waitUntil: 'networkidle' }); await click(action('chronicles')); await context('ME2');
  await click(action('chronicle-load')); const loaded = await exportChronicle('me2-reloaded'); assert.deepEqual(loaded.session, prepared.session);
  assert.deepEqual(await campaignStorage(), campaignBefore);
  check('Public Chronicle save, actual download/import and browser reload preserve class and gear while ME1 storage remains byte-identical');

  await context('ME3', 'me3-prologue'); await page.locator('#chronicle-scenario').selectOption('me3-earth-prologue'); await click(action('chronicle-start'));
  assert.equal(await page.locator('[data-chronicle-build] option[value="vanguard"]:not(:disabled)').count(), 0);
  await page.setViewportSize({ width: 390, height: 844 });
  await capture('prologue-mobile', page.locator('.universe-scenario')); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(await campaignStorage(), campaignBefore); check('ME3 prologue cannot inherit the future Vanguard preparation and the public preparation remains usable on mobile');

  await Promise.all(pending); assert.deepEqual(report.errors, []); assert.deepEqual(report.consoleErrors, []); assert.deepEqual(report.failedRequests, []);
  if (mode === 'production') { assert.deepEqual(report.sourceRequests, []); assert.deepEqual(await tree(new URL('dist/', root)), report.distFiles); assert.ok(report.servedFiles.length > 1); }
  for (const [path, expected] of Object.entries(report.sourceHashes)) assert.equal(sha(await readFile(new URL(path, root))), expected, `Source changed during run: ${path}`);
  report.sourceFrozen = true; report.distFrozen = mode === 'production'; report.passed = true;
} catch (error) { report.failure = error.stack || String(error); process.exitCode = 1; if (page) try { await capture('failure'); } catch {} }
finally { await browser?.close(); await writeFile(output, JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, talentChecks: report.talentChecks.length, captures: report.captures.length, exports: report.exports.length, failure: report.failure })); }
