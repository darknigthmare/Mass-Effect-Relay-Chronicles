import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Run npm run build first. This checks bundled resources under local file URLs.
// Chromium's file-access flag is a test configuration, not a change to Electron.
const entry = new URL('../dist/index.html', import.meta.url);
const url = `${entry.href}?qa`;
const out = new URL('../test-results/', import.meta.url), docs = new URL('../docs/qa/', import.meta.url);
await Promise.all([mkdir(out, { recursive: true }), mkdir(docs, { recursive: true })]);
const report = {
  version: '0.2.0', at: new Date().toISOString(), passed: false,
  scope: 'Production Vite bundle loaded through file:// in Linux Chromium with --allow-file-access-from-files. This verifies bundled asset paths, UI and local save/resume. It is not an Electron executable test and is not a Windows launch test.',
  entry: 'dist/index.html', browser: null, checks: [], bundles: [], errors: [], failedRequests: [], assetRequests: [],
};
for (const filename of (await readdir(new URL('../dist/assets/', import.meta.url))).filter(name => name.endsWith('.js')).sort()) {
  const bytes = await readFile(new URL(`../dist/assets/${filename}`, import.meta.url));
  assert.equal(bytes.includes(Buffer.from('__RELAY_TEST__')), false, `No development harness in ${filename}`);
  report.bundles.push({ path: `dist/assets/${filename}`, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
assert.ok(report.bundles.length > 0, 'Production JavaScript bundles exist');
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
  args: ['--no-sandbox', '--no-zygote', '--allow-file-access-from-files', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
report.browser = browser.version();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(60000);
const requests = new Set(), completed = new Set();
page.on('request', request => requests.add(request.url()));
page.on('requestfinished', request => completed.add(request.url()));
page.on('pageerror', error => report.errors.push(error.message));
page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
page.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`); });
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
const savedState = () => page.evaluate(() => {
  const raw = localStorage.getItem('relay-chronicles.save.v1');
  return raw ? JSON.parse(raw).state : null;
});
async function capture(name) { await page.screenshot({ path: fileURLToPath(new URL(`production-v02-${name}.png`, out)) }); }
try {
  console.log(JSON.stringify({ stage: 'Loading production files' }));
  await page.goto(url, { waitUntil: 'networkidle' });
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
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
  });
  const webgl = await page.evaluate(() => {
    const canvas = document.querySelector('#world canvas'), gl = canvas?.getContext('webgl2');
    return { contextAvailable: !!gl, contextLost: gl?.isContextLost(), version: gl?.getParameter(gl.VERSION), width: canvas?.width, height: canvas?.height, ...window.__PRODUCTION_WEBGL_PROBE__ };
  });
  assert.equal(webgl.contextAvailable, true); assert.equal(webgl.contextLost, false);
  assert.ok(webgl.width > 0 && webgl.height > 0); assert.ok(webgl.drawElements + webgl.drawArrays > 0);
  record({ name: 'Real female creation and WebGL drawing from file URLs', webgl, runtimeDevelopmentHarness: 'absent' });
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
  record({ name: 'File-origin save and actual title-screen resume', appearance: after.appearance, origin: after.origin, psychologicalProfile: after.psychologicalProfile, credits: after.credits, exactInventoryPreserved: true });

  const femaleRequests = [...completed].filter(address => /shepard-female-(?:walk|combat)-atlas\.png$/.test(address));
  assert.equal(femaleRequests.length, 2, 'Both female PNG atlases completed local loading');
  assert.ok(femaleRequests.every(address => address.startsWith('file:')));
  const jsonAnimationRequests = [...requests].filter(address => address.includes('shepard-female-animation.json'));
  assert.deepEqual(jsonAnimationRequests, [], 'Animation metadata is bundled, with no local JSON fetch');
  const remoteRequests = [...requests].filter(address => /^https?:/.test(address));
  assert.deepEqual(remoteRequests, [], 'All game resources are local in this check');
  report.assetRequests = [...completed].filter(address => /\.(?:png|js|css)(?:\?|$)/.test(address)).map(address => address.replace(new URL('../dist/', import.meta.url).href, 'dist/')).sort();
  record({ name: 'Bundled metadata and local atlas availability', femaleAtlasesLoaded: 2, animationJsonRequests: 0, remoteRequests: 0, developmentHarnessInBundles: 'absent' });
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []);
  report.passed = true;
  await writeFile(new URL('production-v02-report.json', docs), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ passed: true, checks: report.checks.length, errors: report.errors, failedRequests: report.failedRequests }));
} catch (error) {
  report.failure = error.stack || String(error); console.error(report.failure);
  await capture('failure').catch(() => {}); throw error;
} finally {
  await browser.close(); await writeFile(new URL('production-v02-report.json', out), `${JSON.stringify(report, null, 2)}\n`);
}
