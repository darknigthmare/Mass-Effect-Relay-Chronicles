import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

// Build first, then serve dist with Vite preview. The managed browser blocks
// file:// navigation; this HTTP check does not bypass that policy.
const entry = new URL(process.env.GAME_URL || 'http://127.0.0.1:4174');
const url = new URL(entry); url.searchParams.set('qa', '');
const out = new URL('../test-results/', import.meta.url);
await mkdir(out, { recursive: true });
const packageMetadata = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const report = {
  version: packageMetadata.version, at: new Date().toISOString(), passed: false,
  mode: 'Production HTTP fallback after file:// was blocked by the managed browser',
  scope: 'The real dist Vite bundles served over HTTP in Linux Chromium: native WebGL drawing, bundled resources, dossier, equipment, actual save/export/import/resume UI, separately saved ME2 and ME3 Chronicle workshops, the ME3 engineer preparation with two weapon modifications, Revelation documentary reading restored after reload, a cancellable heat beam and finite grenade charges through production UI. No Electron executable or Windows launch is tested.',
  fileURLValidation: { status: 'blocked-by-managed-browser-policy', error: 'ERR_BLOCKED_BY_ADMINISTRATOR', evidence: 'test-results/production-v02-report.json', policyBypassAttempted: false },
  entry: entry.href, buildEntry: 'dist/index.html', browser: null, checks: [], bundles: [], bundleStatuses: [], servedBundles: [], errors: [], failedRequests: [], assetRequests: [],
};
for (const filename of (await readdir(new URL('../dist/assets/', import.meta.url))).filter(name => name.endsWith('.js')).sort()) {
  const bytes = await readFile(new URL(`../dist/assets/${filename}`, import.meta.url));
  assert.equal(bytes.includes(Buffer.from('__RELAY_TEST__')), false, `No development harness in ${filename}`);
  report.bundles.push({ path: `dist/assets/${filename}`, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
assert.ok(report.bundles.length > 0, 'Production JavaScript bundles exist');
const registryBundles = report.bundles.filter(bundle => /\/universe-data-[^/]+\.js$/.test(bundle.path));
assert.ok(registryBundles.length > 0, 'The documentary registry has a separate production bundle');
const requestedBundles = () => [...requests].map(address => {
  const parsed = new URL(address);
  return parsed.origin === entry.origin ? `dist${parsed.pathname}` : null;
}).filter(path => report.bundles.some(bundle => bundle.path === path)).sort();
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
  args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
report.browser = browser.version();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await context.newPage();
page.setDefaultTimeout(60000);
const requests = new Set(), completed = new Set();
const bundleResponses = [], scheduledBundleBodies = new Set();
page.on('request', request => requests.add(request.url()));
page.on('requestfinished', request => completed.add(request.url()));
page.on('pageerror', error => report.errors.push(error.message));
page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
page.on('response', response => {
  const status = response.status();
  if (status >= 400) report.failedRequests.push(`${status} ${response.url()}`);
  const address = new URL(response.url()), filename = address.pathname.split('/').at(-1);
  const expected = report.bundles.find(bundle => bundle.path === `dist/assets/${filename}`);
  if (address.origin !== entry.origin || !expected) return;
  report.bundleStatuses.push({ url: response.url(), path: expected.path, status });
  // Redirects and cache revalidations cannot satisfy the full 200 requirement.
  // Reserve the first 200 immediately: reloads can expose another 200 whose
  // cached body is unavailable, and cannot replace a failed first collection.
  if (status !== 200 || scheduledBundleBodies.has(expected.path)) return;
  scheduledBundleBodies.add(expected.path);
  bundleResponses.push((async () => {
    const bytes = await response.body();
    report.servedBundles.push({ url: response.url(), path: expected.path, status, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  })().catch(error => { report.failedRequests.push(`Could not inspect bundle ${response.url()}: ${error.message}`); }));
});
// Count calls to the native graphics API without exposing or modifying game state.
await page.addInitScript(() => {
  const probe = window.__PRODUCTION_WEBGL_PROBE__ = { drawArrays: 0, drawElements: 0 };
  for (const type of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
    if (!type) continue;
    for (const method of ['drawArrays', 'drawElements']) {
      const original = type.prototype[method];
      if (typeof original !== 'function') continue;
      type.prototype[method] = function (...args) { probe[method] += 1; return original.apply(this, args); };
    }
  }
});
const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
const record = check => { report.checks.push(check); console.log(JSON.stringify({ check: check.name, passed: true })); };
// Compare complete values while keeping failure logs free of whole save files.
const assertExact = (actual, expected, message) => assert.ok(isDeepStrictEqual(actual, expected), message);
const savedState = () => page.evaluate(() => {
  const raw = localStorage.getItem('relay-chronicles.save.v1');
  return raw ? JSON.parse(raw).state : null;
});
async function capture(name) { await page.screenshot({ path: fileURLToPath(new URL(`production-http-${name}.png`, out)), timeout: 60000 }); }
try {
  console.log(JSON.stringify({ stage: 'Loading real production bundles over HTTP' }));
  await page.goto(url.href, { waitUntil: 'networkidle' });
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  const initialBundles = requestedBundles();
  assert.ok(registryBundles.every(bundle => !initialBundles.includes(bundle.path)), 'The registry is absent from initial production requests');
  report.chronicleLoading = { initialBundles, registryBundles: registryBundles.map(bundle => bundle.path), initialRegistryRequested: false };
  await page.getByRole('button', { name: /Nouvelle campagne/ }).click();
  await page.locator('#commander-name').fill('Jane Production');
  await page.locator('#new-appearance').selectOption('female');
  await page.locator('#new-origin').selectOption('colonist');
  await page.locator('#new-profile').selectOption('war-hero');
  assert.equal(await page.locator('#commander-preview image').count(), 1);
  await page.getByRole('button', { name: /Commencer l’aventure/ }).click();
  await page.getByRole('button', { name: 'Je rejoins le briefing.' }).click();
  await page.locator('.location h2').filter({ hasText: 'Normandy' }).waitFor();
  await page.waitForFunction(() => {
    const probe = window.__PRODUCTION_WEBGL_PROBE__;
    return (probe?.drawElements || 0) + (probe?.drawArrays || 0) > 0;
  }, null, { polling: 100, timeout: 60000 });
  const webgl = await page.evaluate(() => {
    const canvas = document.querySelector('#world canvas'), gl = canvas?.getContext('webgl2');
    return { contextAvailable: !!gl, contextLost: gl?.isContextLost(), version: gl?.getParameter(gl.VERSION), width: canvas?.width, height: canvas?.height, ...window.__PRODUCTION_WEBGL_PROBE__ };
  });
  assert.equal(webgl.contextAvailable, true); assert.equal(webgl.contextLost, false);
  assert.ok(webgl.width > 0 && webgl.height > 0); assert.ok(webgl.drawElements + webgl.drawArrays > 0);
  record({ name: 'Real female creation and native WebGL drawing from production HTTP bundles', webgl, runtimeDevelopmentHarness: 'absent' });
  await capture('normandy');

  await page.keyboard.press('Escape'); await action('dossier').click();
  assert.equal(await page.locator('.commander-name').innerText(), 'Jane Production');
  assert.match(await page.locator('.commander-record').innerText(), /Colon/);
  assert.match(await page.locator('.commander-record').innerText(), /Héros de guerre/);
  const dossierImage = await page.locator('.commander-portrait image').getAttribute('href');
  assert.match(dossierImage, /shepard-female-walk-atlas\.png$/);
  await capture('dossier'); await action('dossier-back').click(); await action('close').click();
  await action('equipment').click(); await action('eq-tab', 'shop').click();
  await action('eq-buy', 'heat-sink-i').click(); await action('eq-tab', 'inventory').click();
  await action('eq-equip', 'heat-sink-i').click(); await action('eq-tab', 'loadout').click();
  assert.match(await page.locator('[data-slot="weaponMod"]').innerText(), /Dissipateur thermique I/);
  const equipmentImage = await page.locator('.eq-portrait image').getAttribute('href');
  assert.match(equipmentImage, /shepard-female-walk-atlas\.png$/);
  assert.match(await page.locator('.eq-technical').innerText(), /0\.90/);
  await capture('equipment');
  record({ name: 'Production dossier, equipment portrait and transaction UI', dossierImage, equipmentImage, equippedModule: 'heat-sink-i', displayedHeatMultiplier: .9 });
  await action('close').click(); await page.keyboard.press('Escape'); await action('save').click();
  const before = await savedState();
  assert.equal(before.appearance, 'female'); assert.equal(before.credits, 150);
  assert.equal(before.inventory.equipped.shepard.weaponMod, 'heat-sink-i');
  const pendingDownload = page.waitForEvent('download'); await action('export').click();
  const download = await pendingDownload, exportedPath = fileURLToPath(new URL('production-http-export.json', out));
  await download.saveAs(exportedPath);
  const serialized = await readFile(exportedPath, 'utf8'), exported = JSON.parse(serialized).state;
  assert.deepEqual(exported.inventory, before.inventory); assert.equal(exported.credits, before.credits);
  await action('close').click(); await action('equipment').click(); await action('eq-tab', 'loadout').click();
  await action('eq-unequip', 'weaponMod').click();
  assert.equal((await savedState()).inventory.equipped.shepard.weaponMod, null);
  await action('close').click();
  await page.locator('#save-import').setInputFiles({ name: 'production-http.json', mimeType: 'application/json', buffer: Buffer.from(serialized) });
  await page.waitForFunction(() => {
    const saved = JSON.parse(localStorage.getItem('relay-chronicles.save.v1') || 'null');
    return saved?.state?.inventory?.equipped?.shepard?.weaponMod === 'heat-sink-i' && !document.querySelector('#transition.active');
  }, null, { polling: 100, timeout: 60000 });
  await page.locator('.location h2').filter({ hasText: 'Normandy' }).waitFor();
  assert.deepEqual((await savedState()).inventory, before.inventory);
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  await page.getByRole('button', { name: /Reprendre/ }).click();
  await page.locator('.location h2').filter({ hasText: 'Normandy' }).waitFor();
  await action('equipment').click(); await action('eq-tab', 'loadout').click();
  assert.match(await page.locator('.eq-profile h3').innerText(), /Jane Production/);
  assert.match(await page.locator('[data-slot="weaponMod"]').innerText(), /Dissipateur thermique I/);
  const after = await savedState();
  assert.equal(after.appearance, 'female'); assert.equal(after.origin, 'colonist'); assert.equal(after.psychologicalProfile, 'war-hero');
  assert.deepEqual(after.inventory, before.inventory); assert.equal(after.credits, before.credits);
  record({ name: 'HTTP-origin autosave, unchanged JSON export/import and actual title-screen resume', appearance: after.appearance, origin: after.origin, psychologicalProfile: after.psychologicalProfile, credits: after.credits, exactInventoryPreserved: true, removedThenImportedModuleRestored: true });

  assert.ok(registryBundles.every(bundle => !requestedBundles().includes(bundle.path)), 'The complete ME1 path does not request the documentary registry');
  const campaignPreviouslySaved = await savedState();
  await action('close').click(); await page.waitForTimeout(300); await page.keyboard.press('Escape');
  await action('chronicles').click(); await page.locator('.universe-screen').waitFor();
  // Entering Chronicles checkpoints recent ME1 play before its simulation pauses.
  // The immutable baseline starts after that legitimate campaign save.
  const campaignBeforeChronicle = await savedState();
  const campaignBytesBeforeChronicle = await page.evaluate(() => localStorage.getItem('relay-chronicles.save.v1'));
  assert.ok(campaignBeforeChronicle.playedSeconds > campaignPreviouslySaved.playedSeconds, 'The entry checkpoint retains recent time played since the previous save');
  assert.deepEqual(campaignBeforeChronicle.position, campaignPreviouslySaved.position, 'The paused stationary commander keeps the same world position');
  assertExact({ ...campaignBeforeChronicle, playedSeconds: campaignPreviouslySaved.playedSeconds }, campaignPreviouslySaved, 'The entry checkpoint preserves all other ME1 gameplay fields');
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  assert.equal(await page.locator('#chronicle-media option').evaluateAll(options => options.filter(option => option.value !== '').length), 28);
  await page.locator('#chronicle-media').selectOption('ME2');
  await page.locator('#chronicle-period').selectOption('me2');
  await action('universe-tab', 'session').click();
  await page.locator('#chronicle-scenario').selectOption('me2-equipment-workshop');
  await action('chronicle-start').click();
  const weapon = page.locator('[data-chronicle-gear][data-actor-id="ME2-CHR-SHEPARD"][data-slot="weapon"]');
  await weapon.selectOption('ME2-WPN-CARNIFEX');
  await action('chronicle-save').click();
  assert.equal(await weapon.inputValue(), 'ME2-WPN-CARNIFEX');
  const chronicleKey = 'relay-chronicles.chronicle.ME2.me2.v1';
  const workshop = await page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null')?.session, chronicleKey);
  assert.deepEqual(workshop.context, { mediaId: 'ME2', periodId: 'me2', galaxy: 'milky-way' });
  assert.equal(workshop.scenarioId, 'me2-equipment-workshop');
  assert.equal(workshop.loadouts['ME2-CHR-SHEPARD'].weapon, 'ME2-WPN-CARNIFEX');
  assert.ok(registryBundles.every(bundle => requestedBundles().includes(bundle.path)), 'Entering Chronicles requests its documentary registry');
  assertExact(await page.evaluate(() => localStorage.getItem('relay-chronicles.save.v1')), campaignBytesBeforeChronicle, 'Chronicle preparation does not write the ME1 autosave');
  report.chronicleLoading.enteredBundles = requestedBundles();
  await capture('chronicle-workshop');
  await action('chronicle-back').click();
  await page.getByRole('dialog', { name: 'Mission en pause', exact: true }).waitFor();
  assertExact(await page.evaluate(() => localStorage.getItem('relay-chronicles.save.v1')), campaignBytesBeforeChronicle, 'Returning to the paused campaign preserves its exact save bytes');
  record({ name: 'Deferred production Chronicles load 28 works and save a scoped ME2 workshop independently', initialRegistryRequested: false, registryRequestedOnEntry: true, worksListed: 28, context: workshop.context, scenarioId: workshop.scenarioId, equippedWeapon: workshop.loadouts['ME2-CHR-SHEPARD'].weapon, entryCheckpointRetainsRecentPlaytime: true, checkpointPlayedSeconds: campaignBeforeChronicle.playedSeconds, exactCampaignSavePreserved: true, runtimeDevelopmentHarness: 'absent' });

  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  assertExact(await savedState(), campaignBeforeChronicle, 'The production reload preserves the complete ME1 campaign state');
  const campaignBytesAfterReload = await page.evaluate(() => localStorage.getItem('relay-chronicles.save.v1'));
  await action('chronicles').click(); await page.locator('.universe-screen').waitFor();
  await page.locator('#chronicle-media').selectOption('ME2');
  await page.locator('#chronicle-period').selectOption('me2');
  await action('universe-tab', 'session').click(); await action('chronicle-load').click();
  assert.equal(await page.locator('#chronicle-scenario').inputValue(), 'me2-equipment-workshop');
  assert.equal(await weapon.inputValue(), 'ME2-WPN-CARNIFEX');
  assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null')?.session, chronicleKey), workshop);
  assertExact(await page.evaluate(() => localStorage.getItem('relay-chronicles.save.v1')), campaignBytesAfterReload, 'ME2 restoration preserves the current ME1 checkpoint bytes');
  await capture('chronicle-restored'); await action('chronicle-back').click();
  await page.getByRole('button', { name: /Nouvelle campagne/ }).waitFor();
  assertExact(await savedState(), campaignBeforeChronicle, 'Returning from the restored ME2 workshop preserves the complete ME1 state');
  record({ name: 'Production reload and title navigation restore the Chronicle without changing ME1', context: workshop.context, workshopRestored: true, exactCampaignStatePreserved: true, runtimeDevelopmentHarness: 'absent' });

  // Each real entry may refresh savedAt before freezing the campaign. Preserve
  // the complete ME1 state across entries, then require the resulting bytes to
  // stay unchanged during that activity and through reload/title navigation.
  // These paths use visible controls and read persisted envelopes only.
  let activityCampaignBytes = await page.evaluate(() => localStorage.getItem('relay-chronicles.save.v1'));
  assert.ok(typeof activityCampaignBytes === 'string', 'The ME1 entry checkpoint exists before expansion checks');
  let activityCampaignPacket = JSON.parse(activityCampaignBytes);
  assertExact(activityCampaignPacket.state, campaignBeforeChronicle, 'The complete ME1 state is preserved before expansion checks');
  const captureEntryCheckpoint = async name => {
    const bytes = await page.evaluate(() => localStorage.getItem('relay-chronicles.save.v1'));
    assert.ok(typeof bytes === 'string', `${name}: the ME1 checkpoint exists`);
    const packet = JSON.parse(bytes);
    assertExact(packet.state, activityCampaignPacket.state, `${name}: entering Chronicles preserves the complete previous ME1 state`);
    assertExact({ ...packet, savedAt: null }, { ...activityCampaignPacket, savedAt: null }, `${name}: entry may refresh savedAt only`);
    activityCampaignBytes = bytes; activityCampaignPacket = packet;
    report.chronicleEntryCheckpoints ??= [];
    report.chronicleEntryCheckpoints.push({ entry: name, savedAt: packet.savedAt,
      sha256: createHash('sha256').update(bytes).digest('hex'), completeCampaignStatePreserved: true });
  };
  const assertCampaignFrozen = async name => {
    assertExact(await savedState(), campaignBeforeChronicle, `${name}: the complete ME1 campaign state is unchanged`);
    assertExact(await page.evaluate(() => localStorage.getItem('relay-chronicles.save.v1')), activityCampaignBytes,
      `${name}: the current entry checkpoint remains byte-identical`);
  };
  const chroniclePacket = key => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), key);
  const gear = (actorId, slot) => page.locator(`[data-chronicle-gear][data-actor-id="${actorId}"][data-slot="${slot}"]`);
  const me3ActorId = 'ME3-CHR-SHEPARD', me3Key = 'relay-chronicles.chronicle.ME3.me3.v1';
  const me3Build = page.locator(`[data-chronicle-build][data-actor-id="${me3ActorId}"]`);
  const me3Card = page.locator(`[data-chronicle-actor="${me3ActorId}"]`);
  await action('chronicles').click(); await page.locator('.universe-screen').waitFor();
  await captureEntryCheckpoint('ME3 preparation entry');
  await page.locator('#chronicle-media').selectOption('ME3');
  await page.locator('#chronicle-period').selectOption('me3');
  await action('universe-tab', 'session').click();
  await page.locator('#chronicle-scenario').selectOption('me3-equipment-workshop');
  await action('chronicle-start').click();
  await me3Build.selectOption('engineer');
  await gear(me3ActorId, 'weapon').selectOption('ME3-WPN-AVENGER');
  await gear(me3ActorId, 'weaponMod').selectOption('ME3-EQP-BARREL');
  await gear(me3ActorId, 'weaponMod2').selectOption('ME3-EQP-MAGAZINE');
  assert.equal(await me3Build.inputValue(), 'engineer');
  assert.match(await me3Card.innerText(), /Chargeur ATB 23, réserve ATB 67/);
  assert.match(await me3Card.innerText(), /Dégâts des tirs ATB 112 %/);
  await action('chronicle-save').click();
  const me3Packet = await chroniclePacket(me3Key), me3Saved = me3Packet?.session;
  assert.equal(me3Packet.format, 'relay-chronicles.chronicle'); assert.equal(me3Packet.version, 1);
  assert.deepEqual(me3Saved.context, { mediaId: 'ME3', periodId: 'me3', galaxy: 'milky-way' });
  assert.equal(me3Saved.scenarioId, 'me3-equipment-workshop');
  assert.equal(me3Saved.builds[me3ActorId], 'engineer');
  const expectedMe3Loadout = { weapon: 'ME3-WPN-AVENGER', armor: null, weaponMod: 'ME3-EQP-BARREL', weaponMod2: 'ME3-EQP-MAGAZINE' };
  assert.deepEqual(me3Saved.loadouts[me3ActorId], expectedMe3Loadout);
  assert.deepEqual(me3Saved.cleared, [], 'Preparing equipment awards no tactical victory');
  await assertCampaignFrozen('ME3 preparation');
  await capture('chronicle-me3-modules'); await action('chronicle-back').click();
  await page.getByRole('button', { name: /Nouvelle campagne/ }).waitFor();
  await assertCampaignFrozen('ME3 return to title');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  await assertCampaignFrozen('ME3 production reload');
  await action('chronicles').click(); await page.locator('.universe-screen').waitFor();
  await captureEntryCheckpoint('ME3 restored preparation entry');
  await page.locator('#chronicle-media').selectOption('ME3');
  await page.locator('#chronicle-period').selectOption('me3');
  await action('universe-tab', 'session').click(); await action('chronicle-load').click();
  assert.equal(await page.locator('#chronicle-scenario').inputValue(), 'me3-equipment-workshop');
  assert.equal(await me3Build.inputValue(), 'engineer');
  for (const [slot, itemId] of Object.entries(expectedMe3Loadout)) assert.equal(await gear(me3ActorId, slot).inputValue(), itemId ?? '');
  assert.match(await me3Card.innerText(), /Chargeur ATB 23, réserve ATB 67/);
  assert.match(await me3Card.innerText(), /Dégâts des tirs ATB 112 %/);
  assertExact(await chroniclePacket(me3Key), me3Packet, 'The complete ME3 preparation persists across a production reload');
  assertExact((await chroniclePacket(chronicleKey)).session, workshop, 'ME3 preparation does not overwrite the saved ME2 workshop');
  await assertCampaignFrozen('ME3 restored preparation');
  record({ name: 'Production ME3 engineer preparation and two weapon modification ports persist through title reload',
    context: me3Saved.context, scenarioId: me3Saved.scenarioId, actorId: me3ActorId, build: 'engineer',
    loadout: expectedMe3Loadout, displayedMagazine: 23, displayedReserve: 67, displayedWeaponDamagePercent: 112,
    exactSavedPreparationRestored: true, exactME2WorkshopPreserved: true, exactCampaignCheckpointPreserved: true,
    adaptation: 'Family modification prototypes and ATB statistics; no original model ranks or numeric 1:1 certification', runtimeDevelopmentHarness: 'absent' });

  const revelationKey = 'relay-chronicles.chronicle.REV.rev.v1', readingId = 'rev-sidon';
  await page.locator('#chronicle-media').selectOption('REV');
  await page.locator('#chronicle-period').selectOption('rev');
  assert.equal(await chroniclePacket(revelationKey), null, 'This browser has no previous Revelation reading');
  await action('universe-tab', 'reading').click();
  assert.equal(await page.locator('#chronicle-reading').inputValue(), readingId);
  if (await action('chronicle-reading-open').count()) await action('chronicle-reading-open').click();
  const readingPage = page.locator(`[data-chronicle-reading="${readingId}"]`);
  await readingPage.waitFor(); assert.equal(await readingPage.getAttribute('data-reading-index'), '0');
  assert.equal(await readingPage.locator('h3').innerText(), 'Le poste détruit');
  const firstReading = (await chroniclePacket(revelationKey))?.session;
  assert.deepEqual(firstReading.readingProgress, { [readingId]: 0 });
  assert.deepEqual([...firstReading.discovered].sort(), ['REV-CHR-ANDERSON', 'REV-REF-SIDON']);
  await readingPage.locator('[data-do="chronicle-page"][data-index="1"]').click();
  assert.equal(await readingPage.getAttribute('data-reading-index'), '1');
  assert.equal(await readingPage.locator('h3').innerText(), 'Une scientifique recherchée');
  assert.match(await readingPage.locator('.universe-reading-text').innerText(), /Kahlee Sanders/);
  await action('chronicle-save').click();
  const revelationPacket = await chroniclePacket(revelationKey), revelationSaved = revelationPacket?.session;
  assert.equal(revelationPacket.format, 'relay-chronicles.chronicle'); assert.equal(revelationPacket.version, 1);
  assert.deepEqual(revelationSaved.context, { mediaId: 'REV', periodId: 'rev', galaxy: 'milky-way' });
  assert.deepEqual(revelationSaved.readingProgress, { [readingId]: 1 });
  const expectedDiscoveries = ['REV-CHR-ANDERSON', 'REV-CHR-KAHLEE', 'REV-REF-SIDON'];
  assert.deepEqual([...revelationSaved.discovered].sort(), expectedDiscoveries);
  for (const field of ['context', 'scenarioId', 'party', 'loadouts', 'builds', 'notes', 'cleared'])
    assert.deepEqual(revelationSaved[field], firstReading[field], `Reading changes no ${field}`);
  assert.equal(revelationSaved.scenarioId, null); assert.deepEqual(revelationSaved.party, []);
  assert.deepEqual(revelationSaved.loadouts, {}); assert.deepEqual(revelationSaved.cleared, []);
  for (const field of ['credits', 'xp', 'inventory', 'rewards']) assert.equal(Object.hasOwn(revelationSaved, field), false);
  await assertCampaignFrozen('Revelation page persistence');
  await capture('revelation-reading');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  await page.getByRole('button', { name: /Nouvelle campagne/ }).waitFor();
  await assertCampaignFrozen('Revelation production reload');
  await action('chronicles').click(); await page.locator('.universe-screen').waitFor();
  await captureEntryCheckpoint('Revelation restored reading entry');
  await page.locator('#chronicle-media').selectOption('REV');
  await page.locator('#chronicle-period').selectOption('rev');
  await action('universe-tab', 'reading').click();
  await readingPage.waitFor(); assert.equal(await readingPage.getAttribute('data-reading-index'), '1');
  assert.equal(await page.locator('#chronicle-reading').inputValue(), readingId);
  assert.equal(await readingPage.locator('h3').innerText(), 'Une scientifique recherchée');
  assertExact(await chroniclePacket(revelationKey), revelationPacket, 'Reading resumes at the saved page without duplicating discoveries');
  assertExact(await chroniclePacket(me3Key), me3Packet, 'Reading does not overwrite the saved class and modifications');
  assertExact((await chroniclePacket(chronicleKey)).session, workshop, 'Reading does not overwrite the ME2 workshop');
  await capture('revelation-restored'); await action('chronicle-back').click();
  await page.getByRole('button', { name: /Nouvelle campagne/ }).waitFor();
  await assertCampaignFrozen('Revelation return to title');
  record({ name: 'Production Revelation reading visits two factual pages and restores page index one after title reload without rewards',
    context: revelationSaved.context, readingId, restoredPageIndex: 1, discoveredRecordIds: expectedDiscoveries,
    exactReadingEnvelopeRestored: true, exactOtherChroniclesPreserved: true, exactCampaignCheckpointPreserved: true,
    campaignCheckpointSha256: createHash('sha256').update(activityCampaignBytes).digest('hex'),
    partyCreated: false, tacticalVictoryAwarded: false, campaignRewardAwarded: false, runtimeDevelopmentHarness: 'absent' });

  // Exercise the new combat dispatch in the real build, without the DEV API or
  // simulation acceleration. Party changes and resource use are visible orders.
  await action('chronicles').click(); await page.locator('.universe-screen').waitFor();
  await captureEntryCheckpoint('Specialist production entry');
  await page.locator('#chronicle-media').selectOption('MEA');
  await page.locator('#chronicle-period').selectOption('mea');
  await action('universe-tab', 'session').click();
  await page.locator('#chronicle-scenario').selectOption('mea-equipment-workshop');
  await action('chronicle-start').click();
  for (const id of ['MEA-CHR-CORA', 'MEA-CHR-LIAM']) await action('chronicle-party', id).click();
  const ryderWeapon = page.locator('[data-chronicle-gear][data-actor-id="MEA-CHR-RYDER"][data-slot="weapon"]');
  await ryderWeapon.selectOption('MEA-WPN-PAW');
  assert.match(await page.locator('[data-chronicle-actor="MEA-CHR-RYDER"]').innerText(), /Chaleur.*sans recharge de clips/);
  await action('chronicle-battle').click();
  await page.locator('[data-do="chronicle-action"][data-id="shoot"]:not([disabled])').waitFor();
  await action('chronicle-action', 'shoot').click();
  await action('chronicle-target', 'chronicle-enemy-0').click();
  await page.locator('[data-chronicle-channel]').waitFor();
  await page.waitForFunction(() => {
    const counter = document.querySelector('.chronicle-command .small')?.textContent || '';
    const match = counter.match(/(\d+) % de chaleur/);
    return match && Number(match[1]) > 0 && document.querySelector('[data-chronicle-channel]');
  }, null, { polling: 50 });
  const beamResource = await page.locator('.chronicle-command .small').innerText();
  assert.equal(await page.locator('[data-chronicle-ammo]').count(), 0);
  assert.match(beamResource, /Canalisation en cours/);
  await action('chronicle-action', 'cancelChannel').click();
  await page.locator('[data-chronicle-channel]').waitFor({ state: 'detached' });
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  await assertCampaignFrozen('Production heat beam and cancellation');
  await capture('specialist-heat-beam');
  record({ name: 'Production P.A.W. uses heat and a real cancellable channel without inheriting clip ammunition',
    actorId: 'MEA-CHR-RYDER', weaponId: 'MEA-WPN-PAW', resourceDisplay: beamResource,
    ammunitionCounterAbsent: true, actualCancellation: true, runtimeDevelopmentHarness: 'absent' });

  await action('chronicle-preparation').click();
  await action('chronicle-party', 'MEA-CHR-LIAM').click();
  await action('chronicle-party', 'MEA-CHR-RYDER').click();
  await action('chronicle-battle').click();
  const grenadeCount = page.locator('[data-chronicle-grenades]');
  assert.equal(await grenadeCount.innerText(), '3/3 charges de grenade');
  const startingAmmo = await page.locator('[data-chronicle-ammo]').innerText();
  const spentGrenades = [];
  for (let number = 1; number <= 3; number += 1) {
    await page.locator('[data-do="chronicle-action"][data-id="fragGrenade"]:not([disabled])').waitFor();
    await action('chronicle-action', 'fragGrenade').click();
    await action('chronicle-target', 'chronicle-enemy-0').click();
    const resource = await grenadeCount.innerText();
    assert.equal(resource, `${3 - number}/3 charges de grenade`);
    assert.equal(await page.locator('[data-chronicle-ammo]').innerText(), startingAmmo);
    spentGrenades.push(resource);
  }
  assert.equal(await action('chronicle-action', 'fragGrenade').isDisabled(), true);
  await assertCampaignFrozen('Production finite grenade charges');
  await capture('specialist-grenades-empty');
  await action('chronicle-preparation').click(); await action('chronicle-back').click();
  await page.getByRole('button', { name: /Nouvelle campagne/ }).waitFor();
  await assertCampaignFrozen('Production specialist return to title');
  record({ name: 'Production Liam spends exactly three finite grenade charges without spending weapon ammunition or altering ME1',
    actorId: 'MEA-CHR-LIAM', actionId: 'fragGrenade', spentGrenades, weaponAmmunitionUnchanged: startingAmmo,
    emptyActionDisabled: true, exactCampaignCheckpointPreserved: true, runtimeDevelopmentHarness: 'absent' });

  const femaleRequests = [...completed].filter(address => /shepard-female-(?:walk|combat)-atlas\.png$/.test(address));
  assert.equal(femaleRequests.length, 2, 'Both female PNG atlases completed HTTP loading');
  assert.ok(femaleRequests.every(address => new URL(address).origin === entry.origin));
  const jsonAnimationRequests = [...requests].filter(address => address.includes('shepard-female-animation.json'));
  assert.deepEqual(jsonAnimationRequests, [], 'Animation metadata is bundled, with no JSON fetch');
  const remoteRequests = [...requests].filter(address => /^https?:/.test(address) && new URL(address).origin !== entry.origin);
  assert.deepEqual(remoteRequests, [], 'All game resources come from the production preview origin');
  const expectedImages = ['crew-atlas.png', 'enemy-atlas.png', 'boss-atlas.png', 'props-atlas.png', 'npc-atlas.png', 'vehicle-atlas.png', 'shepard-walk-atlas.png', 'shepard-female-walk-atlas.png', 'shepard-female-combat-atlas.png', 'citadel-keyart.png'];
  for (const filename of expectedImages) assert.ok([...completed].some(address => new URL(address).origin === entry.origin && new URL(address).pathname.endsWith(`/assets/${filename}`)), `${filename} completed production HTTP loading`);
  await Promise.all(bundleResponses);
  for (const expected of report.bundles) {
    const observed = report.servedBundles.filter(bundle => bundle.path === expected.path && bundle.status === 200);
    assert.ok(observed.length > 0, `A complete HTTP 200 response was hashed for ${expected.path}`);
    for (const bundle of observed) {
      assert.equal(bundle.sha256, expected.sha256, `HTTP 200 SHA256 matches ${expected.path}`);
      assert.equal(bundle.bytes, expected.bytes, `HTTP 200 byte length matches ${expected.path}`);
    }
  }
  report.assetRequests = [...completed].filter(address => /\.(?:png|js|css)(?:\?|$)/.test(address)).map(address => `dist${new URL(address).pathname}`).sort();
  record({ name: 'Ten production images, embedded animation metadata and exact dist bundle hashes', imagesLoaded: expectedImages.length, femaleAtlasesLoaded: 2, animationJsonRequests: 0, remoteRequests: 0, developmentHarnessInBundles: 'absent', servedBundleHashesMatchDist: true });
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []);
  report.passed = true;
  console.log(JSON.stringify({ passed: true, checks: report.checks.length, errors: report.errors, failedRequests: report.failedRequests }));
} catch (error) {
  report.failure = error.stack || String(error); console.error(report.failure);
  await capture('failure').catch(() => {}); throw error;
} finally {
  await browser.close(); await writeFile(new URL('production-http-report.json', out), `${JSON.stringify(report, null, 2)}\n`);
}
