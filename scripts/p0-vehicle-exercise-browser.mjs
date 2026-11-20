import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { getLevelLayout } from '../src/level-layout-data.js';
import { completeZone, decodeSave, encodeSave, newGame, recruit, travelCampaign, winEncounter, zoneEncounters } from '../src/state.js';

const endpoint = new URL(process.env.GAME_URL || 'http://127.0.0.1:4294/');
const build = process.env.P0_BUILD_DIR || 'dist';
const output = process.env.P0_VEHICLE_OUTPUT || 'test-results/p0-vehicle-exercise';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const report = {
  passed: false, generatedAt: new Date().toISOString(), endpoint: endpoint.href,
  scope: 'Conduite et exercice indépendant de Thérum, par les commandes publiques du build Vite.',
  checks: [], captures: [], errors: [],
};
const check = (id, detail) => {
  report.checks.push({ id, passed: true, detail });
  console.log(id);
};
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 840 }, acceptDownloads: true });
page.setDefaultTimeout(20000);
const button = name => page.locator(`[data-do="${name}"]`).first();
const prepared = () => {
  const state = newGame({ name: 'Essai de conduite', mode: 'wait' });
  state.settings.sound = false;
  state.settings.reducedMotion = true;
  state.flags.briefed = true;
  for (const zone of ['eden-prime', 'citadel']) {
    assert.equal(travelCampaign(state, zone).ok, true);
    if (zone === 'citadel') assert.equal(recruit(state, 'tali'), true);
    for (const id of zoneEncounters(zone)) assert.equal(winEncounter(state, id), true);
    assert.equal(completeZone(state, zone), true);
  }
  assert.equal(travelCampaign(state, 'therum').ok, true);
  const parking = getLevelLayout('therum').vehicleSpawn;
  state.position = { x: parking.x - 2, z: parking.z };
  const encoded = encodeSave(state);
  assert.ok(decodeSave(encoded));
  return Buffer.from(encoded);
};

const ready = async () => {
  await page.locator('#hud:not(.hidden) .location h2').waitFor();
  await page.locator('#transition.active, #overlay .screen, #overlay .dialogue').waitFor({ state: 'hidden' });
};
async function exportedState() {
  await ready();
  await page.keyboard.press('Escape');
  const [download] = await Promise.all([page.waitForEvent('download'), button('export').click()]);
  const state = decodeSave(await readFile(await download.path(), 'utf8'));
  await button('close').click();
  assert.ok(state);
  const { playedSeconds, ...rest } = state;
  return rest;
}
async function capture(name) {
  const file = path.join(output, `${name}.png`);
  const bytes = await page.screenshot({ animations: 'disabled' });
  await writeFile(file, bytes, { flag: 'wx' });
  report.captures.push({ path: file, sha256: sha256(bytes) });
}
page.on('pageerror', error => report.errors.push(error.message));
page.on('requestfailed', request => report.errors.push(`${request.url()} ${request.failure()?.errorText}`));
page.on('response', response => {
  const url = new URL(response.url());
  if (url.origin === endpoint.origin && (/^\/(?:src|@vite|@fs)\//.test(url.pathname)
    || response.status() >= 400 && url.pathname !== '/favicon.ico')) report.errors.push(response.url());
});

try {
  const document = await page.goto(endpoint.href, { waitUntil: 'domcontentloaded' });
  assert.equal(document.status(), 200);
  report.documentSha256 = sha256(await document.body());
  assert.equal(report.documentSha256, sha256(await readFile(path.join(build, 'index.html'))));
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  await button('title-settings').click();
  await page.locator('#completion-quality').selectOption('economy');
  await page.keyboard.press('Escape');
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), button('import').click()]);
  const fixture = prepared();
  report.fixture = { sha256: sha256(fixture), scope: 'Premières victoires et arrivée à Thérum préparées avant import.' };
  await chooser.setFiles({ name: 'therum.json', mimeType: 'application/json', buffer: fixture });
  await ready();

  const arrival = page.locator('[data-do="interact"]').filter({ hasText: 'Monter à bord' });
  await arrival.waitFor();
  assert.equal(await button('vehicle-exercise').count(), 0);
  await page.keyboard.press('KeyE');
  const leave = page.locator('[data-do="interact"]').filter({ hasText: 'Descendre du M35 Mako' });
  await leave.waitFor();
  await capture('conduite');
  const before = await exportedState();
  check('embarquement', 'L’exercice apparaît après embarquement au parking de Thérum.');

  await button('vehicle-exercise').click();
  await page.locator('#combat-mako').waitFor();
  assert.equal(await page.locator('.battle-member').count(), 1);
  assert.equal(await page.locator('[data-do="battle-target"]').count(), 2);
  const actions = await page.locator('[data-do="battle-action"]').evaluateAll(items => items.map(item => item.dataset.id));
  assert.deepEqual(actions, ['shoot', 'burst', 'cover']);
  const readyTarget = page.locator('[data-do="battle-target"]:not([disabled])').first();
  await readyTarget.waitFor();
  await capture('arene');
  await page.setViewportSize({ width: 420, height: 800 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await capture('arene-portrait');
  await page.setViewportSize({ width: 1280, height: 840 });
  const result = page.getByRole('dialog', { name: 'Balises neutralisées' });
  let shots = 0;
  while (!await result.isVisible() && shots < 10) {
    await readyTarget.or(result).first().waitFor();
    if (await result.isVisible()) break;
    await readyTarget.click();
    shots++;
  }
  await result.waitFor();
  report.shots = shots;
  assert.ok(shots >= 2);
  await result.locator('[data-do="vehicle-exercise-exit"]').click();
  await leave.waitFor();
  assert.deepEqual(await exportedState(), before);
  check('victoire-et-reprise', 'Les deux balises sont neutralisées par le moteur ATB. Le véhicule revient embarqué au même point avec la même partie.');

  await button('vehicle-exercise').click();
  await page.locator('#combat-mako').waitFor();
  assert.equal(await page.locator('#combat-mako [data-stat="hp-label"]').innerText(), '220 / 220');
  await button('vehicle-exercise-exit').click();
  await leave.waitFor();
  assert.deepEqual(await exportedState(), before);
  await page.keyboard.press('KeyE');
  await arrival.waitFor();
  assert.equal(await button('vehicle-exercise').count(), 0);
  check('abandon', 'Un deuxième essai réinitialise la coque, peut être quitté et laisse débarquer normalement.');
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (error) {
  report.errors.push(error.stack);
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, errors: report.errors }));
}
