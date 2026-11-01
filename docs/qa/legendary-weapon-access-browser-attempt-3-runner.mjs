import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Public production controls only. Node reads expected resource budgets from
// the separate native proof; the browser never imports source modules, calls a
// harness, assigns game state, injects storage or constructs a save fixture.
const root = new URL('../', import.meta.url), entry = new URL(process.env.GAME_URL || 'http://127.0.0.1:4194');
const reportPath = 'docs/qa/legendary-weapon-access-browser-report.json';
const ids = ['PHALANX', 'LOCUST', 'MATTOCK', 'EVISCERATOR', 'INCISOR'].map(suffix => `ME2-WPN-${suffix}`);
const actorId = 'ME2-CHR-SHEPARD', me2Key = 'relay-chronicles.chronicle.ME2.me2.v1';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const file = path => readFile(new URL(path, root));
const report = { passed: false, generatedAt: new Date().toISOString(), entry: entry.href,
  mode: 'production', stage: 'prepare', baselineCommit: '105d03727dc51c6121ed1bd2811b0146d047cbb2',
  command: `GAME_URL=${entry.origin} PLAYWRIGHT_EXECUTABLE_PATH=${process.env.PLAYWRIGHT_EXECUTABLE_PATH || '(Playwright default)'} node scripts/legendary-weapon-access-browser.mjs`,
  scope: 'Five existing ME2 weapons selected only in the prepared Legendary workshop through public DOM controls, saved and restored after real reloads, then used for one native shot and reload each. A genuine UI-created ME1 autosave and manual slot remain byte-identical. No canonical acquisition, original numerical fidelity, new weapon artwork or integral 1:1 certification.',
  observationMethods: {
    actions: 'Public buttons, selects and keyboard navigation only.',
    storage: 'Read-only localStorage observation verifies bytes and the session actually written by public UI actions. There are no storage writes, save injections or private state assignments from the runner.',
    runtime: 'DOM observations and verification that the development harness is absent; no browser source imports or hidden game API calls.',
    expectedResources: 'Node reads the separate native proof; resource changes in this run are observed from the actual public combat DOM.',
  },
  sources: [], distSnapshot: [], servedResources: [], captures: [], checks: [],
  standardRefusals: [], foreignContextChecks: [], collectorRefusal: null, preparations: [], preparationHandoffs: [],
  witnessBefore: [], witnessAfter: [], requestedScripts: [], errors: [], consoleErrors: [], failedRequests: [],
  limitations: [
    'The collective EA inclusion proof and inherited individual catalogue identities are qualified in the separate source report.',
    'The resource figures displayed and exercised are existing ATB family budgets, not original weapon-model statistics.',
    'Each saved preparation is independently restored by a real page reload; only one saved loadout per context exists at a time.',
    'Only one shot and one reload per model are exercised here; depletion, forgery and historical outcomes have native proofs.',
    'Captures document the actual interface and prototype representations. No new original weapon geometry, audio, animation or artistic fidelity is validated.',
  ],
};
let browser, page, witness;
const pending = [], seenResources = new Set();
const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
const weaponSelect = () => page.locator(`[data-chronicle-gear][data-actor-id="${actorId}"][data-slot="weapon"]`);
const mark = stage => { report.stage = stage; console.log(JSON.stringify({ stage })); };
const check = (name, data = {}) => { report.checks.push({ name, ...data }); console.log(JSON.stringify({ check: name })); };
const storage = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])));
const me1Only = all => Object.fromEntries(Object.entries(all).filter(([key]) => key === 'relay-chronicles.save.v1' || key.startsWith('relay-chronicles.manual-save.v1.')));
const describeStorage = data => Object.entries(data).map(([key, value]) => ({ key, bytes: Buffer.byteLength(value), sha256: hash(value) }));
async function preserveWitness() { assert.deepEqual(me1Only(await storage()), witness, 'Genuine ME1 save bytes must remain unchanged'); }
async function context(mediaId, periodId) {
  if (await page.locator('#chronicle-media').inputValue() !== mediaId) await page.locator('#chronicle-media').selectOption(mediaId);
  if (await page.locator('#chronicle-period').inputValue() !== periodId) await page.locator('#chronicle-period').selectOption(periodId);
}
async function workshop(mediaId, scenarioId) {
  await context(mediaId, mediaId.toLowerCase()); await action('universe-tab', 'session').click();
  await page.locator('#chronicle-scenario').selectOption(scenarioId);
  // Explicitly prepare the chosen scene before inspecting its gear. A visible
  // selector alone does not prove which saved/session preparation is active.
  await action('chronicle-start').click();
  await page.locator('.universe-party-loadouts').waitFor();
  assert.equal(await page.locator('#chronicle-scenario').inputValue(), scenarioId);
  const key = `relay-chronicles.chronicle.${mediaId}.${mediaId.toLowerCase()}.v1`;
  const packet = JSON.parse((await storage())[key]);
  assert.equal(packet.session.scenarioId, scenarioId);
  report.preparationHandoffs.push({ mediaId, scenarioId, savedScenarioId: packet.session.scenarioId,
    publicPrepareButton: true, packetSha256: hash(JSON.stringify(packet)) });
}
async function capture(name) {
  const path = `docs/screenshots/legendary-weapon-access-${name}.png`;
  await page.screenshot({ path: fileURLToPath(new URL(path, root)), fullPage: false, timeout: 60000 });
  const bytes = await file(path); report.captures.push({ path, bytes: bytes.length, sha256: hash(bytes) });
}
async function ammo() {
  const text = await page.locator('[data-chronicle-ammo]').innerText();
  const parsed = text.match(/(\d+)\s*\/\s*(\d+).*?réserve\s+(\d+)/u);
  assert.ok(parsed, text);
  return { ammo: Number(parsed[1]), magazineCapacity: Number(parsed[2]), reserveAmmo: Number(parsed[3]), text };
}
async function publicCombat(id, expected) {
  await action('chronicle-battle').click(); await page.locator('.chronicle-combat').waitFor();
  const initial = await ammo();
  for (const key of ['ammo', 'magazineCapacity', 'reserveAmmo']) assert.equal(initial[key], expected[key], `${id}:${key}`);
  // Playwright waits for natural ATB readiness. The one-member party avoids
  // another ready ally keeping wait-mode time paused after Shepard acts.
  await action('chronicle-action', 'shoot').click();
  await page.locator('[data-do="chronicle-target"]:not([disabled])').first().click();
  await page.waitForFunction(expected => {
    const text = document.querySelector('[data-chronicle-ammo]')?.textContent || '';
    return Number(text.match(/^(\d+)\//u)?.[1]) === expected;
  }, expected.ammo - 1);
  const afterShot = await ammo(); assert.equal(afterShot.ammo, expected.ammo - 1); assert.equal(afterShot.reserveAmmo, expected.reserveAmmo);
  const shotLog = await page.locator('.chronicle-log').innerText();
  await action('chronicle-action', 'reload').click();
  await page.waitForFunction(expected => {
    const text = document.querySelector('[data-chronicle-ammo]')?.textContent || '';
    return Number(text.match(/réserve\s+(\d+)/u)?.[1]) === expected;
  }, expected.reserveAmmo - 1);
  const afterReload = await ammo();
  assert.equal(afterReload.ammo, expected.magazineCapacity); assert.equal(afterReload.reserveAmmo, expected.reserveAmmo - 1);
  assert.equal(afterReload.ammo + afterReload.reserveAmmo, initial.ammo + initial.reserveAmmo - 1);
  const reloadLog = await page.locator('.chronicle-log').innerText();
  if (id === ids[0] || id === ids.at(-1)) {
    await page.locator('.chronicle-command').scrollIntoViewIfNeeded(); await capture(`${id.toLowerCase()}-native-reload`);
  }
  await action('chronicle-preparation').click(); await weaponSelect().waitFor();
  assert.equal(await weaponSelect().inputValue(), id); await preserveWitness();
  return { initial, afterShot, afterReload, shotLog, reloadLog,
    method: 'One real shot and reload through native public command/target buttons, naturally ready ATB; no time, actor or ammunition setter.' };
}
async function sourceSnapshots() {
  const paths = ['scripts/legendary-weapon-access-browser.mjs', 'src/universe-equipment.js', 'src/universe-equipment-scenarios.js',
    'src/universe-data.js', 'src/universe-actors.js', 'src/universe-ui.js', 'src/main.js', 'src/chronicles.js',
    'src/continuity.js', 'src/continuity-data.js', 'src/combat.js', 'public/assets/manifest.json',
    'docs/qa/legendary-weapon-access-native-report.json', 'docs/qa/legendary-weapon-access-reference-report.json'];
  for (const path of paths) { const bytes = await file(path); report.sources.push({ path, bytes: bytes.length, sha256: hash(bytes) }); }
  assert.equal(report.sources.find(source => source.path === 'src/universe-data.js').sha256,
    '00c8914a2fb5ff02d090f4a2780f30b1935f69f28fee74b177c04bef7051652b');
  const walk = async relative => {
    for (const entry of await readdir(new URL(relative, root), { withFileTypes: true })) {
      const path = `${relative}/${entry.name}`;
      if (entry.isDirectory()) await walk(path);
      else if (/\.(?:js|css|png|html)$/u.test(path)) {
        const bytes = await file(path); report.distSnapshot.push({ path, bytes: bytes.length, sha256: hash(bytes) });
      }
    }
  };
  await walk('dist');
}

try {
  await mkdir(new URL('docs/screenshots/', root), { recursive: true });
  await sourceSnapshots();
  const native = JSON.parse(await file('docs/qa/legendary-weapon-access-native-report.json'));
  assert.equal(native.passed, true); assert.equal(native.newNativePreparations.length, 5);
  browser = await chromium.launch({ headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  report.browser = browser.version();
  const browserContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  page = await browserContext.newPage(); page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('request', request => { if (request.resourceType() === 'script') report.requestedScripts.push(request.url()); });
  page.on('response', response => {
    const url = new URL(response.url());
    if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`);
    const isIndex = url.pathname === '/' || url.pathname.endsWith('/index.html');
    if (url.origin !== entry.origin || response.status() !== 200 || !isIndex && !/\.(?:js|css|png)$/u.test(url.pathname)
      || seenResources.has(url.pathname)) return;
    seenResources.add(url.pathname);
    pending.push((async () => {
      const path = isIndex ? 'dist/index.html' : `dist${decodeURIComponent(url.pathname)}`;
      const expected = await file(path), actual = await response.body();
      assert.equal(hash(actual), hash(expected), `${path}: actual HTTP bytes equal the frozen distribution`);
      report.servedResources.push({ path, url: url.href, status: 200, bytes: actual.length, sha256: hash(actual) });
    })().catch(error => report.failedRequests.push(`Production resource: ${error.stack || error}`)));
  });

  mark('Create real ME1 autosave and manual-slot witnesses through public controls');
  await page.goto(entry.href, { waitUntil: 'networkidle' });
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  await page.getByRole('button', { name: /Nouvelle campagne/ }).click();
  await page.locator('#commander-name').fill('Jane Arsenal Legendary');
  await page.getByRole('button', { name: /Commencer l’aventure/ }).click();
  await page.getByRole('button', { name: 'Je rejoins le briefing.' }).click();
  await page.locator('.location h2').filter({ hasText: 'Normandy' }).waitFor(); await page.keyboard.press('Escape');
  await action('manual-saves').click(); await page.locator('#manual-save-name-1').fill('ME1 témoin cinq armes Legendary');
  await action('manual-save', '1').click();
  assert.equal(await page.locator('[data-save-slot="1"]').getAttribute('data-status'), 'saved');
  await action('manual-back').click(); await action('save').click(); await action('chronicles').click();
  await page.locator('.universe-screen').waitFor();
  witness = me1Only(await storage()); assert.equal(Object.keys(witness).length, 2);
  assert.ok(witness['relay-chronicles.save.v1'] && witness['relay-chronicles.manual-save.v1.1']);
  report.witnessBefore = describeStorage(witness); check('Two genuine ME1 witnesses were created without storage injection');

  mark('Standard and foreign-work gates remain closed');
  await workshop('ME2', 'me2-equipment-workshop');
  for (const id of ids) {
    const option = weaponSelect().locator(`option[value="${id}"]`);
    assert.equal(await option.count(), 1);
    const observed = await option.evaluate(node => ({ disabled: node.disabled, html: node.outerHTML }));
    assert.equal(observed.disabled, true, `${id}: ${JSON.stringify(observed)}`);
    const reason = await option.innerText(); assert.match(reason, /Legendary Edition/);
    report.standardRefusals.push({ id, disabled: observed.disabled, reason, optionHtml: observed.html });
  }
  await weaponSelect().scrollIntoViewIfNeeded(); await capture('standard-refusals'); await preserveWitness();
  await workshop('ME3', 'me3-equipment-workshop');
  const foreignSelect = page.locator('[data-chronicle-gear][data-actor-id="ME3-CHR-SHEPARD"][data-slot="weapon"]');
  for (const id of ids) {
    assert.equal(await foreignSelect.locator(`option[value="${id}"]`).count(), 0);
    report.foreignContextChecks.push({ id, mediaId: 'ME3', periodId: 'me3', listed: false });
  }
  check('Five edition-only options are disabled in Standard and absent from ME3');

  mark('Legendary choices and Collector exclusion');
  await workshop('ME2', 'me2-legendary-equipment-workshop');
  for (const id of ids) {
    const option = weaponSelect().locator(`option[value="${id}"]`);
    assert.equal(await option.count(), 1);
    const observed = await option.evaluate(node => ({ disabled: node.disabled, html: node.outerHTML }));
    assert.equal(observed.disabled, false, `${id}: ${JSON.stringify(observed)}`);
  }
  const collector = weaponSelect().locator('option[value="ME2-WPN-COLLECTOR-RIFLE"]');
  const collectorObserved = await collector.evaluate(node => ({ disabled: node.disabled, html: node.outerHTML }));
  assert.equal(collectorObserved.disabled, true, JSON.stringify(collectorObserved));
  report.collectorRefusal = { id: 'ME2-WPN-COLLECTOR-RIFLE', disabled: collectorObserved.disabled,
    reason: await collector.innerText(), optionHtml: collectorObserved.html };
  for (const companion of ['ME2-CHR-MIRANDA', 'ME2-CHR-JACOB']) {
    const button = action('chronicle-party', companion); assert.equal(await button.getAttribute('aria-pressed'), 'true'); await button.click();
  }
  assert.equal(await page.locator('.universe-party-loadout').count(), 1);
  await weaponSelect().scrollIntoViewIfNeeded(); await capture('legendary-selection');
  check('Five canonical Legendary options are enabled; Collector remains disabled and no class right is changed');

  for (const id of ids) {
    mark(`Save, reload and exercise ${id}`);
    const expected = native.newNativePreparations.find(item => item.id === id).exactResourceProfile;
    await weaponSelect().selectOption(id); await action('chronicle-save').click();
    assert.equal(await weaponSelect().inputValue(), id);
    const savedBefore = (await storage())[me2Key]; assert.ok(savedBefore);
    assert.equal(JSON.parse(savedBefore).session.loadouts[actorId].weapon, id);
    await weaponSelect().scrollIntoViewIfNeeded(); await capture(`${id.toLowerCase()}-prepared`);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
    await action('chronicles').click(); await page.locator('.universe-screen').waitFor();
    await context('ME2', 'me2'); await action('universe-tab', 'session').click();
    assert.equal(await page.locator('#chronicle-scenario').inputValue(), 'me2-legendary-equipment-workshop');
    assert.equal(await weaponSelect().inputValue(), id);
    assert.equal((await storage())[me2Key], savedBefore, 'A context reload reads the actual saved Chronicle without rewriting its bytes');
    const combat = await publicCombat(id, expected);
    report.preparations.push({ id, scenarioId: 'me2-legendary-equipment-workshop',
      savedWeapon: id, restoredWeapon: await weaponSelect().inputValue(), savedPacketSha256: hash(savedBefore),
      savedPacketBytes: Buffer.byteLength(savedBefore), publicPageReload: true, nativePublicCombat: combat });
    await preserveWitness();
  }
  check('All five preparations survive real page reloads and perform one public native shot and reload each');

  await page.setViewportSize({ width: 390, height: 844 }); await weaponSelect().scrollIntoViewIfNeeded();
  const layout = await weaponSelect().evaluate(select => {
    const rect = select.getBoundingClientRect();
    return { viewportWidth: innerWidth, documentWidth: document.documentElement.scrollWidth,
      select: { left: rect.left, right: rect.right, width: rect.width, height: rect.height },
      selectedText: select.selectedOptions[0]?.textContent || '' };
  });
  assert.ok(layout.documentWidth <= layout.viewportWidth + 1); assert.ok(layout.select.left >= -1 && layout.select.right <= layout.viewportWidth + 1);
  assert.ok(layout.select.height >= 44); report.mobileLayout = layout; await capture('mobile-restored-incisor');
  await preserveWitness(); report.witnessAfter = describeStorage(me1Only(await storage()));
  check('ME1 autosave/manual bytes remain exact after all Chronicle changes and the restored mobile selector remains visible');

  await page.waitForLoadState('networkidle'); await Promise.all(pending);
  assert.equal(report.preparations.length, 5); assert.equal(report.standardRefusals.length, 5);
  assert.ok(report.servedResources.some(resource => resource.path.endsWith('.js')));
  assert.ok(report.servedResources.some(resource => resource.path.endsWith('.png')));
  assert.ok(report.servedResources.some(resource => resource.path.endsWith('.css')));
  assert.equal(report.requestedScripts.some(url => new URL(url).pathname.startsWith('/src/')), false);
  assert.deepEqual(report.errors, []); assert.deepEqual(report.consoleErrors, []); assert.deepEqual(report.failedRequests, []);
  for (const source of report.sources) assert.equal(hash(await file(source.path)), source.sha256, `Source changed during run: ${source.path}`);
  for (const artifact of report.distSnapshot) assert.equal(hash(await file(artifact.path)), artifact.sha256, `Distribution changed during run: ${artifact.path}`);
  check('Actual HTTP200 JavaScript, CSS and PNG bytes match dist; production has no QA harness or source-module requests');
  report.passed = true; report.stage = 'complete';
} catch (error) {
  report.errors.push(error.stack || String(error));
  if (page) await capture('failure').catch(() => {});
} finally {
  await Promise.allSettled(pending);
  if (browser) await browser.close();
  await writeFile(new URL(reportPath, root), JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ passed: report.passed, stage: report.stage, checks: report.checks.length,
  preparations: report.preparations.length, servedResources: report.servedResources.length,
  captures: report.captures.length, reportPath, errors: report.errors, failedRequests: report.failedRequests }, null, 2));
if (!report.passed) process.exitCode = 1;
