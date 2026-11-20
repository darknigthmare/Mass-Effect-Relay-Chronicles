import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { getLevelLayout } from '../src/level-layout-data.js';
import { completeZone, confirmCampaignBriefing, decodeSave, encodeSave, newGame, recruit, travelCampaign, winEncounter, zoneEncounters } from '../src/state.js';

const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4279/');
const output = process.env.P0_THERUM_OUTPUT || 'test-results/p0-therum';
const recordScreens = process.env.P0_THERUM_CAPTURE === '1';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { passed: false, at: new Date().toISOString(), captures: [], checks: [], fixtures: [], errors: [] };
await mkdir(output, { recursive: true });

const state = newGame({ name: 'Contrôle de Thérum', difficulty: 'story', mode: 'wait' });
state.settings.reducedMotion = true;
state.settings.sound = false;
assert.equal(confirmCampaignBriefing(state).ok, true);
for (const zone of ['eden-prime', 'citadel']) {
  assert.equal(travelCampaign(state, zone).ok, true);
  if (zone === 'citadel') assert.equal(recruit(state, 'tali'), true);
  for (const id of zoneEncounters(zone)) assert.equal(winEncounter(state, id), true);
  assert.equal(completeZone(state, zone), true);
}
assert.equal(travelCampaign(state, 'therum').ok, true);
const { pois, vehicleSpawn } = getLevelLayout('therum');
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 640 }, acceptDownloads: true });
  page.setDefaultTimeout(30_000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('request', request => {
    if (new URL(request.url()).origin === url.origin && /\/(?:src|@vite|@fs)\//.test(request.url())) report.errors.push(request.url());
  });
  page.on('requestfailed', request => report.errors.push(request.url() + ' ' + request.failure()?.errorText));
  const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
  const hud = page.locator('#hud:not(.hidden) .location h2');
  const ready = async () => {
    await hud.waitFor();
    await page.locator('#transition.active, #overlay .screen, #overlay .dialogue').waitFor({ state: 'hidden' });
  };
  const fixture = async (name, source, position) => {
    const bytes = Buffer.from(encodeSave({ ...source, position }));
    assert.ok(decodeSave(bytes.toString()));
    if (!await action('import').isVisible()) {
      await ready(); await page.keyboard.press('Escape'); await action('quit').click();
    }
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), action('import').click()]);
    await chooser.setFiles({ name: name + '.json', mimeType: 'application/json', buffer: bytes });
    await ready();
    report.fixtures.push({ name, position, cleared: source.cleared, sha256: digest(bytes) });
  };
  const capture = async label => {
    if (!recordScreens) return;
    const path = join(output, label + '.png');
    const bytes = await page.screenshot({ path });
    report.captures.push({ label, path, sha256: digest(bytes) });
  };
  const response = await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  assert.equal(response.status(), 200);
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  report.documentSha256 = digest(await response.body());
  await action('title-settings').click(); await page.locator('#completion-quality').selectOption('economy');
  await action('close').click();

  await fixture('mako-avant-secteurs', state, { x: vehicleSpawn.x - 2, z: vehicleSpawn.z });
  const mounted = value => page.waitForFunction(expected => document.querySelector('.controls-hint')?.textContent.includes('M35 MAKO') === expected, value);
  await page.locator('#hud .interaction').filter({ hasText: /Mako/i }).first().waitFor();
  await page.keyboard.press('KeyE'); await mounted(true);
  await page.keyboard.press('KeyE'); await mounted(false);
  await page.locator('#toasts .toast').filter({ hasText: 'Commando à pied.' }).last().waitFor();
  await capture('dismounted');
  report.checks.push('Le commando monte dans le Mako et en descend par les commandes publiques.');

  await fixture('fouille-avant-combats', state, pois.objective);
  await page.keyboard.press('KeyC');
  assert.match(await action('crew-select', 'liara').innerText(), /Pas encore recruté/);
  await action('close').click(); await ready();
  await page.keyboard.press('KeyE');
  await page.locator('#toasts .toast').filter({ hasText: /Sécurisez les trois secteurs/ }).last().waitFor();
  assert.equal(await page.locator('#overlay .dialogue').count(), 0);

  for (const id of zoneEncounters('therum')) assert.equal(winEncounter(state, id), true);
  await fixture('fouille-apres-combats', state, pois.objective);
  await page.keyboard.press('KeyE');
  await page.locator('#overlay .dialogue').getByText(/Le système de confinement peut enfin être désactivé/).waitFor();
  await capture('liara-confinement');
  await page.getByRole('button', { name: 'Poursuivre.', exact: true }).click();
  await page.getByRole('button', { name: 'Retourner au Normandy.', exact: true }).click();
  await ready();
  assert.equal(await hud.innerText(), 'Normandy SR-1');
  await page.keyboard.press('KeyC');
  const liara = action('crew-select', 'liara');
  assert.equal(await liara.isEnabled(), true);
  assert.doesNotMatch(await liara.innerText(), /Pas encore recruté|Affecté ailleurs/);
  const selected = page.locator('[data-do="crew-select"][aria-pressed="true"]');
  if (await selected.count() >= 2) await selected.last().click();
  await liara.click();
  assert.equal(await liara.getAttribute('aria-pressed'), 'true');
  await capture('liara-commando');
  await action('crew-confirm').click(); await ready();
  assert.match(await page.locator('.explore-party').innerText(), /Liara/);
  await page.keyboard.press('Escape'); await action('save').click();
  const [download] = await Promise.all([page.waitForEvent('download'), action('export').click()]);
  const bytes = await readFile(await download.path());
  const saved = decodeSave(bytes.toString());
  assert.ok(saved);
  assert.equal(saved.zone, 'normandy');
  assert.equal(saved.completed.filter(zone => zone === 'therum').length, 1);
  assert.equal(saved.recruited.filter(id => id === 'liara').length, 1);
  assert.ok(saved.party.includes('liara'));
  report.liara = { zone: saved.zone, party: saved.party, chapterComplete: true, sha256: digest(bytes) };
  report.checks.push('Le repère de fouille refuse avant les trois secteurs, ouvre la libération après sécurisation, puis Liara est sélectionnée et sauvegardée au Normandy après extraction.');
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (error) {
  report.failure = error.stack;
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, failure: report.failure }));
}
