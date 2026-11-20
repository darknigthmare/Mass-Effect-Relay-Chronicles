import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { findLevelPath } from '../src/world-navigation.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { chooseAssignmentReply } from '../src/assignments.js';
import { completeZone, decodeSave, encodeSave, newGame, recruit, travelCampaign, winEncounter, zoneEncounters } from '../src/state.js';

const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4220/');
const output = process.env.P0_NAVIGATION_REPORT || 'test-results/p0-navigation-report.json';
assert.equal(url.search, '');
const report = { passed: false, at: new Date().toISOString(), url: url.href, checks: [], captures: [], errors: [] };
report.collectorSha256 = createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 390, height: 740 }, acceptDownloads: true });
page.setDefaultTimeout(20000);
const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
const title = page.locator('.title-menu');
const reportCheck = (id, observations) => { report.checks.push({ id, observations }); console.log(id); };
const ready = async () => {
  await page.locator('#hud:not(.hidden) .location').waitFor();
  await page.locator('#transition.active, #overlay .screen, #overlay .dialogue').waitFor({ state: 'hidden' });
};
const capture = async (name, locator = page) => {
  const filename = output.replace(/-report\.json$/, `-${name}.png`);
  const bytes = await locator.screenshot({ path: filename, animations: 'disabled' });
  report.captures.push({ path: filename, sha256: sha256(bytes) });
};
async function importSave(state) {
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), action('import').click()]);
  await chooser.setFiles({ name: 'navigation-fixture.json', mimeType: 'application/json', buffer: Buffer.from(encodeSave(state)) });
  await ready();
}
async function exportSave() {
  await page.keyboard.press('Escape');
  const [download] = await Promise.all([page.waitForEvent('download'), action('export').click()]);
  const state = decodeSave(await readFile(await download.path(), 'utf8'));
  assert.ok(state, 'The exported campaign must decode');
  await action('close').click();
  await ready();
  return state;
}
async function quit() {
  await page.keyboard.press('Escape');
  await action('quit').click();
  await title.waitFor();
}
async function openMap() {
  await page.keyboard.press('KeyM');
  await page.locator('.local-map-board').waitFor();
}
async function walkToCitadelExit(interaction) {
  await openMap();
  const bounds = WORLD_ZONES.citadel.bounds;
  const target = WORLD_ZONES.citadel.pois.find(poi => poi.id === 'citadel:exit');
  const obstacles = await page.locator('[data-map-obstacle]').evaluateAll(nodes => nodes.map(node => {
    const n = key => Number(node.getAttribute(key));
    return node.tagName === 'circle' ? { x: n('cx'), z: n('cy'), radius: n('r') }
      : { x: n('x'), z: n('y'), width: n('width'), height: n('height') };
  }));
  await action('close').click();
  const walkable = (x, z) => x >= bounds.minX + .4 && x <= bounds.maxX - .4
    && z >= bounds.minZ + .4 && z <= bounds.maxZ - .4 && !obstacles.some(obstacle =>
      obstacle.radius ? Math.hypot(x - obstacle.x, z - obstacle.z) < obstacle.radius + .12
        : x > obstacle.x - .12 && x < obstacle.x + obstacle.width + .12
          && z > obstacle.z - .12 && z < obstacle.z + obstacle.height + .12);
  const directions = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  const position = () => page.locator('.minimap circle[r="3.5"]').evaluate((circle, b) => ({
    x: b.minX + (Number(circle.getAttribute('cx')) - 12) / 126 * (b.maxX - b.minX),
    z: b.minZ + (Number(circle.getAttribute('cy')) - 12) / 126 * (b.maxZ - b.minZ),
  }), bounds);
  for (let attempt = 0; attempt < 30; ++attempt) {
    if (await interaction.isVisible()) return;
    const start = await position();
    const route = findLevelPath({ bounds, start, destination: target, isWalkable: walkable });
    assert.ok(route?.length, 'Le point de sortie doit être accessible sur la carte');
    const next = route.find(point => Math.hypot(point.x - start.x, point.z - start.z) > .65) || target;
    const dx = next.x - start.x, dz = next.z - start.z;
    const [right, forward] = directions.map(([r, f]) => {
      const x = 27 * r - 23 * f, z = -23 * r - 27 * f;
      return [r, f, (dx * x + dz * z) / Math.hypot(x, z)];
    }).sort((a, b) => b[2] - a[2])[0];
    const keys = [];
    if (right) keys.push(right > 0 ? 'KeyD' : 'KeyA');
    if (forward) keys.push(forward > 0 ? 'KeyW' : 'KeyS');
    for (const key of keys) await page.keyboard.down(key);
    try {
      for (let sample = 0; sample < 15; ++sample) {
        const current = await position();
        if (await interaction.isVisible() || Math.hypot(current.x - start.x, current.z - start.z) >= .7) break;
        await page.waitForTimeout(90);
      }
    } finally {
      for (const key of keys) await page.keyboard.up(key);
    }
  }
  throw new Error('Le repère de sortie est resté hors de portée');
}
const marker = id => page.locator(`[data-map-position="${id}"]`);
const assignment = page.locator('[data-assignment-id="homecoming"][data-assignment-status]');
async function openAssignments() {
  await page.keyboard.press('KeyJ');
  await action('journal-tab', 'assignments').click();
}
function finish(state, zone, choice) {
  assert.equal(travelCampaign(state, zone).ok, true);
  if (zone === 'citadel') assert.equal(recruit(state, 'tali'), true);
  for (const id of zoneEncounters(zone)) assert.equal(winEncounter(state, id), true);
  assert.equal(completeZone(state, zone, choice), true);
  assert.equal(travelCampaign(state, 'normandy').ok, true);
}

page.on('pageerror', error => report.errors.push(String(error)));
page.on('requestfailed', request => report.errors.push(`${request.url()} ${request.failure()?.errorText}`));
page.on('response', response => {
  if (response.status() >= 400 && new URL(response.url()).pathname !== '/favicon.ico') report.errors.push(response.url());
});
try {
  await mkdir(new URL('.', new URL(output, `file://${process.cwd()}/`)), { recursive: true });
  const navigation = await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  assert.equal(navigation.status(), 200);
  report.documentSha256 = sha256(await navigation.body());
  assert.equal(report.documentSha256, sha256(await readFile('dist/index.html')), 'Served document matches the Vite production build');
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  await title.waitFor();
  await action('title-settings').click();
  await page.locator('#completion-quality').selectOption('economy');
  await page.locator('#sound-setting').uncheck();
  await page.locator('#motion-setting').check();
  assert.equal(await page.locator('#mode-setting').count(), 0);
  await page.keyboard.press('Escape');
  await title.waitFor();
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.do), 'title-settings');
  await action('credits').click();
  await page.locator('[data-production-credits] a[href]').first().waitFor();
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.do), 'credits');
  await action('production-catalogue').click();
  await page.locator('[data-production-catalogue] [data-production-count]').waitFor();
  await action('production-back').click();
  await action('chronicles').click();
  await page.locator('#chronicle-media').waitFor();
  await action('chronicle-back').click();
  await action('manual-saves').click();
  const emptySlot = page.locator('[data-save-slot="1"]');
  assert.equal(await emptySlot.getAttribute('data-status'), 'empty');
  await action('manual-back').click();
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.do), 'manual-saves');
  await capture('mobile-title', page.locator('.title-menu'));

  await page.setViewportSize({ width: 1400, height: 940 });
  await action('new').click();
  await page.locator('#commander-name').fill('Contrôle du menu');
  await action('begin').click();
  await page.getByRole('button', { name: 'Je rejoins le briefing.' }).click();
  await ready();
  const created = await exportSave();
  assert.equal(created.name, 'Contrôle du menu');
  assert.equal(created.settings.sound, false);
  assert.equal(created.settings.reducedMotion, true);
  await page.keyboard.press('Escape');
  await action('manual-saves').click();
  await page.locator('#manual-save-name-1').fill('Vérification de la reprise');
  await action('manual-save', '1').click();
  await action('manual-back').click();
  await action('quit').click();
  await action('continue').click();
  await ready();
  assert.equal((await exportSave()).name, created.name);
  await quit();
  await action('manual-saves').click();
  await action('manual-load', '1').click();
  await ready();
  assert.equal((await exportSave()).name, created.name);
  reportCheck('SYS-menu-principal', 'Création, reprise automatique, emplacement manuel, options, sources, catalogue et Chroniques parcourus. Import et retour par Échap testés. Options et crédits ouverts à 390 × 740.');

  const state = newGame({ name: 'Contrôle du commando et du journal' });
  state.flags.briefed = true;
  state.settings.reducedMotion = true;
  state.settings.sound = false;
  finish(state, 'eden-prime');
  finish(state, 'citadel');
  finish(state, 'therum');
  finish(state, 'noveria', 'release');
  finish(state, 'virmire', 'save-kaidan');
  await quit();
  await importSave(state);
  await page.keyboard.press('KeyC');
  const card = id => page.locator(`.crew-card[data-id="${id}"]`);
  for (const [id, reason] of [['garrus', 'Pas encore recruté.'], ['ashley', 'Décédé au cours de la campagne.']]) {
    assert.match(await card(id).innerText(), new RegExp(reason, 'i'));
    await card(id).click();
    await page.locator('#toasts').getByText(reason, { exact: true }).waitFor();
    assert.equal(await card(id).getAttribute('aria-pressed'), 'false');
  }
  await capture('squad-refusal', page.locator('.crew-grid'));
  await action('crew-confirm').click();
  await ready();
  assert.deepEqual((await exportSave()).party, state.party);
  reportCheck('QA-equipe-indisponible', 'Sélections publiques refusées pour un équipier non recruté et un équipier décédé. Le commando confirmé et exporté reste identique.');

  // Native fixture prepares only the earlier campaign and the two initial replies.
  assert.equal(travelCampaign(state, 'citadel').ok, true);
  assert.equal(chooseAssignmentReply(state, 'samesh-bhatia', 'accept-help').ok, true);
  assert.equal(chooseAssignmentReply(state, 'bosker', 'return-body').ok, true);
  state.position = { x: -5, z: 12 };
  delete state.missionProgress; // Simulate an older save that predates the detailed mission steps.
  report.fixture = { chapters: state.completed, assignmentPreparedThrough: 'body-authorized',
    position: state.position, detailedMissionProgressAbsent: true };
  await quit();
  await importSave(state);
  await openAssignments();
  assert.equal(await assignment.getAttribute('data-assignment-status'), 'active');
  await action('close').click();
  await openMap();
  assert.equal(await marker('citadel:objective').count(), 0);
  assert.equal(await marker('citadel:assignment-bosker').count(), 1);
  await action('close').click();
  await page.keyboard.press('KeyE');
  await page.locator('[data-assignment-choice="inform-family"]').click();
  await page.locator('[data-assignment-end]').click();
  await ready();
  await openMap();
  assert.equal(await marker('citadel:assignment-bosker').count(), 0);
  assert.equal(await marker('citadel:assignment-samesh-bhatia').count(), 1);
  await action('close').click();
  await openAssignments();
  assert.equal(await assignment.getAttribute('data-assignment-status'), 'completed');
  await capture('assignment-completed', assignment);
  await action('close').click();

  const extraction = page.locator('#hud .interaction').filter({ hasText: 'Baie d’amarrage' });
  await walkToCitadelExit(extraction);
  await extraction.click();
  await page.getByRole('button', { name: 'Extraction.', exact: true }).click();
  await ready();
  assert.match(await page.locator('#hud .location').innerText(), /Normandy/);
  await openAssignments();
  assert.equal(await assignment.getAttribute('data-assignment-status'), 'completed');
  await action('journal-tab', 'missions').click();
  assert.equal(await page.locator('[data-campaign-status="completed"]').count(), state.completed.length);
  assert.equal(await page.locator('[data-mission-id="citadel"][data-campaign-status="active"]').count(), 0);
  const historicalSteps = page.locator('[data-mission-progress-status="legacy-complete"]');
  assert.ok(await historicalSteps.count() > 0);
  assert.equal(await historicalSteps.locator('ol, [role="timer"]').count(), 0);
  await action('journal-tab', 'reports').click();
  await page.locator('.journal-reports').waitFor();
  await action('close').click();

  await page.keyboard.press('KeyG');
  await page.locator('.planet-dot[data-id="citadel"]').click();
  assert.equal(await page.locator('.planet-detail').getAttribute('data-access'), 'completed');
  await action('travel', 'citadel').click();
  await ready();
  await openMap();
  assert.equal(await marker('citadel:assignment-bosker').count(), 0);
  assert.equal(await marker('citadel:assignment-samesh-bhatia').count(), 1);
  await action('close').click();
  const after = await exportSave();
  assert.equal(after.assignments.records.homecoming.stage, 'completed');
  assert.equal(after.xp, state.xp + 50);
  reportCheck('SYS-journal-de-mission', 'Missions, assignations, opérations et rapports consultés. Les chapitres terminés restent dans leur état terminé et l’assignation change de groupe.');
  reportCheck('QA-quete-et-journal', 'Rapport de fin public, retrait de Bosker, suivi terminé, extraction et nouvelle visite. Carte et export conservent le même état et la récompense unique.');
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (error) {
  report.failure = String(error.stack || error);
  await capture('failure').catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ passed: report.passed, output, failure: report.failure }));
}
