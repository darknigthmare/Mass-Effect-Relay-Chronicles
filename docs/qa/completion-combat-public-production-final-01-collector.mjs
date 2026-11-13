// Public Wait-mode journey. The starting Eden position is a declared fixture;
// gauges, reservation, draft, orders, movement and victory are genuinely played.
import assert from 'node:assert/strict';
import { access, readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { newGame, encodeSave, decodeSave } from '../src/state.js';
import { recordVisit } from '../src/story.js';
import { getLevelLayout } from '../src/level-layout-data.js';
import { equipItem } from '../src/loadout.js';

const root = new URL('../', import.meta.url), url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4191/');
const mode = process.env.COMPLETION_COMBAT_MODE || 'development', prefix = process.env.COMPLETION_COMBAT_PREFIX;
assert.ok(['development', 'production'].includes(mode)); assert.equal(url.search, '');
assert.match(prefix || '', /^completion-combat-public-[a-z0-9-]+$/);
const output = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(output); throw Error('Preserve earlier attempts and choose a new prefix.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const paths = ['src/combat.js', 'src/tactical-positions.js', 'src/tactical-ui.js', 'src/main.js', 'src/priority-ui.css',
  'src/world.js', 'src/world-data.js', 'src/level-layout-data.js', 'src/eden-scene.js', 'src/simulation-clock.js',
  'src/game-data.js', 'src/loadout.js', 'src/state.js', 'src/campaign-talents.js', 'src/boss-phases.js',
  'src/mission-progress.js', 'src/completion-world.js', 'src/completion-chronicles-powers.js', 'scripts/completion-combat-public.mjs'];
const report = { passed: false, at: new Date().toISOString(), mode, url: url.href,
  command: { script: 'node scripts/completion-combat-public.mjs', environment: { GAME_URL: url.href, COMPLETION_COMBAT_MODE: mode, COMPLETION_COMBAT_PREFIX: prefix } },
  scope: 'Public Wait reservation, draft/cancellation, native coordination and movement/range; actual victory/claim/reload; three natural Hard/Active KOs, retry and checkpoint recovery; Adept Stasis protection against a real allied shot. Desktop/mobile UI. No private state, ATB/HP/clock mutation, CSS injection or QA query.',
  sourceHashes: {}, registrySourceHashes: {}, registrySourceSnapshots: [], distFiles: {}, fixtures: [], exports: [], captures: [], checks: [], observations: [],
  errors: [], failedRequests: [], consoleErrors: [], resourceWarnings: [], sourceRequests: [],
  limitations: ['The initial briefing/visit and position at the first Eden encounter are prepared in Node, not played as a traversal.',
    'Three early campaign fixtures are played: Story/Wait Soldier coordination and Adept Stasis, plus a deliberately uncommanded Hard/Active defeat. Native comparisons cover other formations separately.',
    'Scene-unit ranges and local motion are ATB adaptations, not original ballistic/physics rules or a likeness certification.',
    'No physical gamepad or Windows executable is launched by this public browser collector.'] };
let browser, page;
const action = name => page.locator(`[data-do="${name}"]`).first();
const click = async locator => { await locator.waitFor({ state: 'visible' }); assert.equal(await locator.isEnabled(), true); await locator.click(); };
const check = name => { report.checks.push({ name, passed: true }); console.log(JSON.stringify({ check: name })); };
const stable = state => { const copy = structuredClone(state); delete copy.playedSeconds; return copy; };
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
  assert.deepEqual(await page.evaluate(() => ({ own: Object.hasOwn(window, '__RELAY_TEST__'), value: typeof window.__RELAY_TEST__ })), { own: false, value: 'undefined' });
}
async function capture(label) {
  const path = `docs/screenshots/${prefix}-${label}.png`, bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)), animations: 'disabled' });
  report.captures.push({ label, path, sha256: sha(bytes), bytes: bytes.length, source: 'Actual public viewport, no DOM/style/pose injection.' });
}
async function members() {
  return page.locator('#battle-ui .battle-member').evaluateAll(nodes => nodes.map(node => ({ id: node.dataset.id,
    atb: Number.parseFloat(node.querySelector('[data-stat="atb"]').style.width),
    hp: node.querySelector('[data-stat="hp-label"]').textContent,
    heat: Number(node.querySelector('[data-stat="heat-summary"]')?.textContent.match(/Chaleur\s+(\d+)/)?.[1]),
    held: node.querySelector('[data-stat="heat-summary"]')?.textContent.includes('Jauge réservée') === true,
    active: node.classList.contains('active'), ready: node.classList.contains('ready') })));
}
async function twoNaturallyReady() {
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    const party = await members(), ready = party.filter(actor => actor.ready && actor.atb >= 99.999);
    if (ready.length >= 2) return ready;
    if (ready.length) {
      await click(page.locator(`[data-do="battle-actor"][data-id="${ready[0].id}"]`));
      if (await action('coord-reserve').isEnabled()) { await click(action('coord-reserve')); report.observations.push({ kind: 'natural-gauge-reserved', actorId: ready[0].id, party }); }
    }
    await page.waitForTimeout(100);
  } throw Error('Two naturally charged gauges were not reachable in Wait mode.');
}
async function stageShots(ids) {
  for (const id of ids) {
    await click(page.locator(`[data-do="battle-actor"][data-id="${id}"]`));
    await click(page.locator('[data-do="battle-action"][data-id="shoot"]'));
    await click(page.locator('[data-do="battle-target"]:not(:disabled)').first());
  }
}
async function exported(label) {
  await ready(); await click(action('pause')); await click(action('save'));
  const [download] = await Promise.all([page.waitForEvent('download'), click(action('export'))]);
  const path = `docs/qa/${prefix}-${label}-export.json`; await download.saveAs(fileURLToPath(new URL(path, root)));
  assert.equal(await download.failure(), null);
  const bytes = await readFile(new URL(path, root)), state = decodeSave(bytes.toString()); assert.ok(state);
  report.exports.push({ label, path, sha256: sha(bytes), bytes: bytes.length });
  await click(action('close')); await ready(); return state;
}
async function playToVictory() {
  const deadline = Date.now() + 240000;
  while (!await action('claim-victory').isVisible()) {
    assert.ok(Date.now() < deadline, 'Natural battle did not reach victory in time.');
    assert.equal(await action('retry').isVisible(), false, 'Party lost the played fixture battle.');
    const party = await members(), readied = party.filter(member => member.ready && member.atb >= 99.999);
    let issued = false;
    for (const actor of readied) {
      await click(page.locator(`[data-do="battle-actor"][data-id="${actor.id}"]`));
      for (const id of ['overload', 'throw', 'burst', 'shoot']) {
        const button = page.locator(`[data-do="battle-action"][data-id="${id}"]`);
        if (!await button.count() || !await button.isEnabled()) continue;
        await click(button);
        const target = page.locator('[data-do="battle-target"]:not(:disabled)').first();
        if (!await target.count()) continue;
        const targetId = await target.getAttribute('data-id'); await click(target);
        report.observations.push({ kind: 'naturally-played-order', actorId: actor.id, actionId: id, targetId, atb: actor.atb }); issued = true; break;
      }
      if (issued) break;
      const advance = page.locator('[data-do="battle-action"][data-id="advance"]');
      if (await advance.isEnabled()) { await click(advance); issued = true; break; }
    }
    if (!issued) await page.waitForTimeout(100);
  }
  await capture('actual-victory'); await click(action('claim-victory'));
  const aftermath = page.getByRole('button', { name: 'Nous devons poursuivre.', exact: true }); if (await aftermath.isVisible()) await click(aftermath);
  await ready();
}

async function playStasisProtection() {
  const state = newGame({ name: 'QA Stase', classId: 'adept', difficulty: 'story', mode: 'wait' });
  state.flags.briefed = true; state.zone = 'eden-prime'; recordVisit(state, state.zone);
  state.position = { ...getLevelLayout('eden-prime').pois['encounter-1'] };
  state.settings.sound = false; state.settings.reducedMotion = true;
  const bytes = encodeSave(state), fixturePath = `docs/qa/${prefix}-stasis-fixture.json`;
  assert.ok(decodeSave(bytes)); await writeFile(new URL(fixturePath, root), bytes);
  const fixture = { path: fixturePath, sha256: sha(bytes), importedViaPublicChooser: false,
    origin: 'Independent native newGame Adept, briefing/recordVisit and explicit first-Eden encounter position. No actor, resource, timer or progression outcome forced. Sequence ends after a real protected hit, without claiming its victory.' };
  report.fixtures.push(fixture);
  await click(action('pause')); await click(action('quit'));
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), click(action('import'))]);
  await chooser.setFiles({ name: fixturePath.split('/').at(-1), mimeType: 'application/json', buffer: Buffer.from(bytes) });
  fixture.importedViaPublicChooser = true; await ready(); await page.keyboard.press('KeyE');
  await page.locator('#battle-ui .tactical-toolbar').waitFor();
  const deadline = Date.now() + 120000;
  while (!(await members()).find(member => member.id === 'shepard')?.ready) {
    assert.ok(Date.now() < deadline, 'Adept gauge must charge naturally.');
    const readied = (await members()).find(member => member.ready && !member.held);
    if (readied) {
      await click(page.locator(`[data-do="battle-actor"][data-id="${readied.id}"]`));
      await click(action('coord-reserve'));
    }
    await page.waitForTimeout(100);
  }
  await click(page.locator('[data-do="battle-actor"][data-id="shepard"]'));
  await click(page.locator('[data-do="battle-action"][data-id="stasis"]'));
  const target = page.locator('[data-do="battle-target"]:not(:disabled)').first(), targetId = await target.getAttribute('data-id');
  const bars = async () => page.locator(`[data-do="battle-target"][data-id="${targetId}"]`).evaluate(node => Object.fromEntries(['hp', 'shield'].map(key => [key, node.querySelector(`[data-stat="${key}"]`).style.width])));
  const before = await bars(); await click(target);
  const ally = (await members()).find(member => member.id !== 'shepard' && member.ready);
  assert.ok(ally, 'An independently charged ally must perform the protected shot.');
  await click(page.locator(`[data-do="battle-actor"][data-id="${ally.id}"]`));
  await click(page.locator('[data-do="battle-action"][data-id="shoot"]'));
  await click(page.locator(`[data-do="battle-target"][data-id="${targetId}"]`));
  assert.deepEqual(await bars(), before);
  assert.match(await page.locator(`[data-do="battle-target"][data-id="${targetId}"] [data-stat="status"]`).textContent(), /Stase.*protégé/);
  assert.match(await page.locator('.combat-log').textContent(), /protégé.*stase/);
  const shooter = (await members()).find(member => member.id === ally.id);
  assert.ok(shooter.atb < 20); assert.ok(shooter.heat > 0);
  report.observations.push({ kind: 'actual-stasis-protected-shot', targetId, shooterId: ally.id, before, after: await bars(),
    log: await page.locator('.combat-log').textContent(), actualShooter: shooter });
  await capture('actual-stasis-protected-shot'); await noHarness();
  check('A naturally charged Adept casts Stasis; a real allied shot consumes its order/heat while shields and health stay protected with explicit feedback');
}

async function playDefeatRecovery() {
  const state = newGame({ name: 'QA Reprise', classId: 'soldier', difficulty: 'hard', mode: 'active' });
  state.flags.briefed = true; state.zone = 'eden-prime'; recordVisit(state, state.zone);
  state.position = { ...getLevelLayout('eden-prime').pois['encounter-1'] };
  state.settings.sound = false; state.settings.reducedMotion = true;
  const bytes = encodeSave(state), fixturePath = `docs/qa/${prefix}-defeat-fixture.json`;
  assert.ok(decodeSave(bytes)); await writeFile(new URL(fixturePath, root), bytes);
  const fixture = { path: fixturePath, sha256: sha(bytes), importedViaPublicChooser: false,
    origin: 'Independent native newGame Soldier, official Hard/Active settings, briefing/recordVisit and first-Eden encounter position. Party issues no orders; enemies really eliminate all three actors. No HP/ATB/KO/timer mutation.' };
  report.fixtures.push(fixture);
  await click(action('pause')); await click(action('quit'));
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), click(action('import'))]);
  await chooser.setFiles({ name: fixturePath.split('/').at(-1), mimeType: 'application/json', buffer: Buffer.from(bytes) });
  fixture.importedViaPublicChooser = true; await ready(); await page.keyboard.press('KeyE');
  const beginning = Date.now();
  await action('retry').waitFor({ state: 'visible', timeout: 240000 });
  assert.match(await page.locator('#overlay h2').textContent(), /hors combat/);
  const defeated = await members();
  assert.equal(defeated.length, 3); assert.ok(defeated.every(member => Number.parseInt(member.hp) === 0));
  assert.equal(await action('claim-victory').isVisible(), false);
  report.observations.push({ kind: 'natural-three-person-defeat', realMilliseconds: Date.now() - beginning, defeated });
  await capture('natural-three-person-defeat');
  await click(action('retry'));
  await page.locator('#overlay .screen').waitFor({ state: 'hidden' });
  const retried = await members();
  assert.equal(retried.length, 3); assert.ok(retried.every(member => Number.parseInt(member.hp) > 0 && member.atb < 30));
  assert.equal(await action('retry').isVisible(), false);
  await capture('actual-defeat-retry');
  // Public quit/continue restores the real automatic checkpoint written before
  // this encounter. This does not manufacture a post-defeat world state.
  await click(action('pause')); await click(action('quit')); await click(action('continue')); await ready();
  const resumed = await exported('after-defeat-checkpoint');
  for (const key of ['xp', 'credits', 'medigel', 'cleared', 'completed', 'lost', 'party', 'collected']) assert.deepEqual(resumed[key], state[key], `Defeat changed ${key}`);
  assert.equal(await page.locator('#battle-ui .battle-member').count(), 0);
  await page.waitForTimeout(1500);
  assert.equal(await page.locator('#battle-ui .battle-member').count(), 0, 'The checkpoint must not restart an unwanted battle loop');
  await capture('actual-defeat-checkpoint');
  await noHarness();
  check('Three natural KOs reach the defeat screen; explicit retry rebuilds living actors, and the real prebattle checkpoint resumes with resources and progression intact');
}

try {
  const collectorBytes = await readFile(new URL(import.meta.url)), collectorPath = `docs/qa/${prefix}-collector.mjs`;
  await writeFile(new URL(collectorPath, root), collectorBytes); report.collectorSnapshot = { path: collectorPath, sha256: sha(collectorBytes) };
  report.sourceSnapshots = [];
  const sourceQueue = [...paths];
  for (let sourceIndex = 0; sourceIndex < sourceQueue.length; sourceIndex++) {
    const filename = sourceQueue[sourceIndex];
    const bytes = await readFile(new URL(filename, root));
    const registryContext = mode === 'development' && filename === 'src/universe-data.js';
    if (registryContext) {
      report.registrySourceHashes[filename] = sha(bytes);
      report.registryContext = 'Development registry before catalogue/workbook synchronization. Its exact executed bytes are preserved as context; the generated final registry receives separate checks and remains a frozen product source in production.';
    } else report.sourceHashes[filename] = sha(bytes);
    const destination = new URL(`docs/qa/${prefix}-sources/${filename}`, root);
    await mkdir(new URL('./', destination), { recursive: true }); await writeFile(destination, bytes);
    const sourceEntry = { path: filename, storedPath: fileURLToPath(destination).slice(fileURLToPath(root).length), sha256: sha(bytes) };
    if (registryContext) report.registrySourceSnapshots.push(sourceEntry);
    else report.sourceSnapshots.push(sourceEntry);
    for (const match of bytes.toString().matchAll(/(?:from\s*|import\s*\(?\s*)['"](\.\.?\/[^'"]+\.(?:js|mjs|css))['"]/g)) {
      const dependency = new URL(match[1], new URL(filename, root)).href.slice(root.href.length);
      if (!sourceQueue.includes(dependency)) sourceQueue.push(dependency);
    }
  }
  if (mode === 'production') report.distFiles = await tree(new URL('dist/', root));
  const state = newGame({ name: 'QA Commandement', classId: 'soldier', difficulty: 'story', mode: 'wait' });
  assert.equal(equipItem(state, 'shepard', 'storm-i', 'weapon').ok, true);
  state.flags.briefed = true; state.zone = 'eden-prime'; recordVisit(state, 'eden-prime');
  state.position = { ...getLevelLayout('eden-prime').pois['encounter-1'] }; state.settings.sound = false; state.settings.reducedMotion = true;
  const bytes = encodeSave(state), fixturePath = `docs/qa/${prefix}-eden-fixture.json`; assert.ok(decodeSave(bytes)); await writeFile(new URL(fixturePath, root), bytes);
  report.fixtures.push({ path: fixturePath, sha256: sha(bytes), origin: 'Native newGame, equipItem of the already owned Storm I starter shotgun, briefing/recordVisit and explicit position at the first encounter; no HP, ATB, XP or currency edit.', importedViaPublicChooser: false });
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  report.chromium = browser.version(); page = await browser.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true }); page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(error.message)); page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('console', message => { if (message.type() === 'error') {
    const entry = { text: message.text(), location: message.location() };
    if (entry.location.url === new URL('favicon.ico', url).href && entry.text === 'Failed to load resource: the server responded with a status of 404 (Not Found)') report.resourceWarnings.push(entry);
    else report.consoleErrors.push(entry);
  } });
  page.on('response', response => { const target = new URL(response.url());
    if (target.pathname.startsWith('/src/') || target.pathname.includes('/@vite/')) report.sourceRequests.push(response.url());
    if (response.status() >= 400 && !(response.status() === 404 && target.href === new URL('favicon.ico', url).href)) report.failedRequests.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(url.href, { waitUntil: 'networkidle' });
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), click(action('import'))]);
  await chooser.setFiles({ name: fixturePath.split('/').at(-1), mimeType: 'application/json', buffer: Buffer.from(bytes) });
  report.fixtures[0].importedViaPublicChooser = true; await ready(); await noHarness(); await page.keyboard.press('KeyE');
  await page.locator('#battle-ui .tactical-toolbar').waitFor();
  const naturallyReady = await twoNaturallyReady(), ids = naturallyReady.slice(0, 2).map(actor => actor.id);
  await click(page.locator(`[data-do="battle-actor"][data-id="${ids[0]}"]`));
  const coverButton = page.locator('[data-do="battle-action"][data-id="cover"]');
  report.observations.push({ kind: 'real-scene-cover-before-order', actorId: ids[0], available: await coverButton.isEnabled(), reason: await coverButton.getAttribute('title') });
  assert.ok((await coverButton.getAttribute('title'))?.trim());
  if (!await coverButton.isEnabled()) assert.match(await coverButton.getAttribute('title'), /obstacle/i);
  await capture('real-scene-cover-feedback');
  check('The actual scene exposes cover availability before an order; an unavailable position explains the missing protective obstacle');
  assert.ok(report.observations.some(entry => entry.kind === 'natural-gauge-reserved'), 'The Wait-mode reserve path must actually be exercised.');
  await capture('two-natural-gauges');
  const beforeDraft = await members(); await click(action('coord-start')); await stageShots(ids);
  assert.equal(await page.locator('.coordinated-orders li').count(), 2); assert.equal(await action('coord-execute').isEnabled(), true);
  const draftResources = (await members()).map(({ id, atb, hp, heat }) => ({ id, atb, hp, heat }));
  assert.deepEqual(draftResources, beforeDraft.map(({ id, atb, hp, heat }) => ({ id, atb, hp, heat })));
  await capture('two-order-draft-desktop'); await click(action('coord-cancel'));
  assert.deepEqual((await members()).map(({ id, atb, hp, heat }) => ({ id, atb, hp, heat })), draftResources);
  check('Two gauges charge naturally through explicit reservation; draft and cancellation preserve native resources');
  await click(action('coord-start')); await stageShots(ids);
  await page.setViewportSize({ width: 390, height: 844 }); await action('coord-execute').scrollIntoViewIfNeeded();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await capture('two-order-draft-mobile');
  await page.setViewportSize({ width: 1280, height: 900 }); await click(action('coord-execute'));
  const afterOrders = await members(); for (const id of ids) { assert.ok(afterOrders.find(actor => actor.id === id).atb < 15, 'Each actual participant spends its gauge');
    assert.ok(afterOrders.find(actor => actor.id === id).heat >= 20, 'Each actual shot produces its real weapon heat before the next Wait decision'); }
  report.observations.push({ kind: 'actual-coordinated-orders', actorIds: ids, before: draftResources, after: afterOrders }); await capture('two-orders-executed');
  check('Public coordination executes two native shots and consumes both participant gauges');
  // Shepard was fractionally behind the other two. Explicitly reserve any
  // earlier gauges until his own ordinary full gauge permits movement.
  const deadline = Date.now() + 120000;
  while (!(await members()).find(actor => actor.id === 'shepard').ready) {
    assert.ok(Date.now() < deadline); const ready = (await members()).find(actor => actor.ready);
    if (ready) { await click(page.locator(`[data-do="battle-actor"][data-id="${ready.id}"]`)); if (await action('coord-reserve').isEnabled()) await click(action('coord-reserve')); }
    await page.waitForTimeout(100);
  }
  await click(page.locator('[data-do="battle-actor"][data-id="shepard"]')); await click(page.locator('[data-do="battle-action"][data-id="withdraw"]'));
  while (!(await members()).find(actor => actor.id === 'shepard').ready) {
    assert.ok(Date.now() < deadline); const ready = (await members()).find(actor => actor.ready);
    if (ready) { await click(page.locator(`[data-do="battle-actor"][data-id="${ready.id}"]`)); if (await action('coord-reserve').isEnabled()) await click(action('coord-reserve')); }
    await page.waitForTimeout(100);
  }
  await click(page.locator('[data-do="battle-actor"][data-id="shepard"]')); await click(page.locator('[data-do="battle-action"][data-id="shoot"]'));
  const rangeText = await page.locator('.range-status').allTextContents(); report.observations.push({ kind: 'public-range-after-withdrawal', rangeText });
  assert.ok(rangeText.some(text => text.includes('Hors de portée'))); await capture('range-after-real-withdrawal');
  await click(page.locator('[data-do="battle-action"][data-id="advance"]')); await capture('real-advance');
  check('Real withdrawal and approach consume turns and expose a disabled out-of-range target');
  await playToVictory(); const won = await exported('claimed');
  assert.deepEqual(won.cleared, ['eden-prime:encounter-1']); assert.equal(won.xp, 65); assert.equal(won.credits, state.credits + 85);
  assert.equal(won.lost.includes('jenkins'), true);
  await page.reload({ waitUntil: 'networkidle' }); await noHarness(); await click(action('continue')); await ready();
  const resumed = await exported('reloaded'); assert.deepEqual(stable(resumed), stable(won)); await capture('actual-save-reload');
  check('Actual victory rewards once and the real automatic-save reload preserves progression and resources');
  await playDefeatRecovery();
  await playStasisProtection();
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []); assert.deepEqual(report.consoleErrors, []);
  if (mode === 'production') { assert.deepEqual(report.sourceRequests, []); assert.deepEqual(await tree(new URL('dist/', root)), report.distFiles); }
  for (const [filename, expected] of Object.entries(report.sourceHashes)) assert.equal(sha(await readFile(new URL(filename, root))), expected, `Source changed during journey: ${filename}`);
  for (const [filename, expected] of Object.entries(report.registrySourceHashes)) assert.equal(sha(await readFile(new URL(filename, root))), expected, `Registry context changed during journey: ${filename}`);
  report.sourceFrozen = true; report.distFrozen = mode === 'production'; report.passed = true;
} catch (error) { report.failure = error.stack || String(error); process.exitCode = 1; if (page) try { await capture('failure'); } catch {} }
finally { await browser?.close(); await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, captures: report.captures.length, failure: report.failure })); }
