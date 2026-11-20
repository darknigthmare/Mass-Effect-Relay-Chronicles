import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { CHAPTERS } from '../src/game-data.js';
import { isLevelGround, getLevelLayout } from '../src/level-layout-data.js';
import { levelMapProjection } from '../src/level-map-render.js';
import { findLevelPath } from '../src/world-navigation.js';
import { getWorldArrival, WORLD_ZONES } from '../src/world-data.js';
import { completeZone, decodeSave, encodeSave, newGame, recruit, travelCampaign, winEncounter, zoneEncounters } from '../src/state.js';

const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4220/');
const output = process.env.P0_MISSION_EXIT_REPORT || 'test-results/p0-mission-exit-report.json';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { passed: false, generatedAt: new Date().toISOString(), url: url.href, checks: [], errors: [], captures: [], walking: [] };
report.collectorSha256 = sha256(await readFile(new URL(import.meta.url)));
assert.equal(url.search, '');
await mkdir(path.dirname(output), { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 840 }, acceptDownloads: true });
page.setDefaultTimeout(15_000);
page.on('pageerror', error => report.errors.push(String(error)));
page.on('requestfailed', request => report.errors.push(request.url() + ' ' + request.failure()?.errorText));
page.on('request', request => {
  const target = new URL(request.url());
  if (process.env.P0_PRODUCTION === '1' && target.origin === url.origin && /^\/(?:src|@vite|@fs)\//.test(target.pathname)) report.errors.push(target.href);
});
page.on('response', response => {
  if (response.status() >= 400 && new URL(response.url()).pathname !== '/favicon.ico') report.errors.push(response.url());
});

const action = name => page.locator(`[data-do="${name}"]`).first();
const marker = id => page.locator(`circle[data-map-position="${id}"]`);
const missionChoice = id => page.locator(`[data-mission-choice="${id}"]`);
const reply = id => page.locator(`.dialogue[data-conversation-id="resolve-vigil"] [data-reply-id="${id}"]`);
const title = page.locator('.title-menu');
const hud = page.locator('#hud:not(.hidden) .location');
const ready = async () => {
  await hud.waitFor();
  await page.locator('#transition.active, #overlay .screen, #overlay .dialogue').waitFor({ state: 'hidden' });
};
const capture = async (name, view = page) => {
  const filename = output.replace(/\.json$/, `-${name}.png`);
  const bytes = await view.screenshot({ animations: 'disabled' });
  await writeFile(filename, bytes, { flag: 'wx' });
  report.captures.push({ path: filename, sha256: sha256(bytes) });
};

function prepareBeforeWindow() {
  const state = newGame({ name: 'Essai de reprise', difficulty: 'story' });
  state.settings.reducedMotion = true;
  state.settings.sound = false;
  state.flags.briefed = true;
  for (const [zone, choice] of [['eden-prime'], ['citadel'], ['therum'], ['feros', 'save'], ['noveria', 'release'], ['virmire', 'save-kaidan'], ['ilos']]) {
    assert.equal(travelCampaign(state, zone).ok, true);
    if (zone === 'citadel') assert.equal(recruit(state, 'tali'), true);
    for (const id of zoneEncounters(zone)) assert.equal(winEncounter(state, id), true);
    if (zone !== 'ilos') assert.equal(completeZone(state, zone, choice), true);
  }
  const objective = WORLD_ZONES.ilos.pois.find(poi => poi.id === 'ilos:objective');
  state.position = { x: objective.x, z: objective.z + .5 };
  return state;
}

async function openMap() {
  await page.keyboard.press('KeyM');
  await page.locator('.local-map-board').waitFor();
}

const { bounds } = WORLD_ZONES.ilos;
const radar = levelMapProjection(bounds, { left: 12, top: 12, width: 126, height: 126 });
const mapProjection = levelMapProjection(bounds);
const layout = getLevelLayout('ilos');
function worldPoint(projection, x, z) {
  return { x: bounds.minX + (x - projection.originX) / projection.scale, z: bounds.minZ + (z - projection.originZ) / projection.scale };
}
async function position() {
  const { x, z } = await page.locator('.minimap circle[r="3.5"]').evaluate(circle => ({
    x: Number(circle.getAttribute('cx')), z: Number(circle.getAttribute('cy')),
  }));
  return worldPoint(radar, x, z);
}

async function approach(id, label) {
  const interaction = page.locator('#hud .interaction').filter({ hasText: label });
  await openMap();
  const dot = marker(id);
  const target = worldPoint(mapProjection, Number(await dot.getAttribute('cx')), Number(await dot.getAttribute('cy')));
  const obstacles = await page.locator('[data-map-obstacle]').evaluateAll(nodes => nodes.map(node => {
    const number = key => Number(node.getAttribute(key));
    return node.tagName.toLowerCase() === 'circle'
      ? { x: number('cx'), z: number('cy'), radius: number('r') }
      : { x: number('x'), z: number('y'), width: number('width'), height: number('height') };
  }));
  await action('close').click();
  const walkable = (x, z) => isLevelGround(layout, x, z) && !obstacles.some(obstacle => obstacle.radius
    ? Math.hypot(x - obstacle.x, z - obstacle.z) < obstacle.radius
    : x > obstacle.x && x < obstacle.x + obstacle.width && z > obstacle.z && z < obstacle.z + obstacle.height);
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  for (let attempt = 0; attempt < 55; attempt++) {
    if (await interaction.isVisible()) return interaction;
    const start = await position();
    const route = findLevelPath({ bounds, start, destination: target, isWalkable: walkable });
    assert.ok(route?.length, `${id} doit être accessible depuis la position affichée sur le radar.`);
    const next = route.find(point => Math.hypot(point.x - start.x, point.z - start.z) >= .8) || target;
    const [right, forward] = directions.map(([r, f]) => {
      const x = 27 * r - 23 * f, z = -23 * r - 27 * f;
      return [r, f, ((next.x - start.x) * x + (next.z - start.z) * z) / Math.hypot(x, z)];
    }).sort((a, b) => b[2] - a[2])[0];
    const keys = ['ShiftLeft'];
    if (right) keys.push(right > 0 ? 'KeyD' : 'KeyA');
    if (forward) keys.push(forward > 0 ? 'KeyW' : 'KeyS');
    for (const key of keys) await page.keyboard.down(key);
    try {
      for (let sample = 0; sample < 20; sample++) {
        const current = await position();
        if (await interaction.isVisible() || Math.hypot(current.x - start.x, current.z - start.z) >= .85) break;
        await page.waitForTimeout(85);
      }
    } finally {
      for (const key of keys) await page.keyboard.up(key);
    }
    report.walking.push({ id, from: start, to: await position() });
  }
  throw new Error(`Repère hors de portée : ${id}`);
}

async function exportState() {
  await ready();
  await page.keyboard.press('Escape');
  const [download] = await Promise.all([page.waitForEvent('download'), action('export').click()]);
  const state = decodeSave(await readFile(await download.path(), 'utf8'));
  assert.ok(state);
  await action('close').click();
  return state;
}

try {
  const response = await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  assert.equal(response.status(), 200);
  report.documentSha256 = sha256(await response.body());
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  await title.waitFor();
  await action('title-settings').click();
  await page.locator('#completion-quality').selectOption('economy');
  await page.keyboard.press('Escape');

  const state = prepareBeforeWindow(), bytes = Buffer.from(encodeSave(state));
  report.fixture = { position: state.position, sha256: sha256(bytes),
    prepared: 'Déploiements, chapitres antérieurs et combats achevés par les API natives. La fenêtre et le passage sont joués dans le navigateur.' };
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), action('import').click()]);
  await chooser.setFiles({ name: 'before-window.json', mimeType: 'application/json', buffer: bytes });
  await ready();
  await page.keyboard.press('KeyE');
  await reply('questions').click();
  await reply('data').click();
  await reply('receive').click();
  await missionChoice('start').click();
  await (await approach('mission:ilos:vigil', 'activer le passage')).click();
  await missionChoice('activate').click();
  await page.locator('.mission-chip').getByText(/Fenêtre du Conduit.*0\/2|Fenêtre du Conduit.*1\/2/).waitFor();
  await capture('active-window');
  await (await approach('mission:ilos:conduit', 'franchir le passage')).click();
  await missionChoice('enter').click();
  const received = await exportState();
  assert.deepEqual(received.missionProgress.records.ilos.steps, ['vigil', 'conduit']);
  assert.equal(received.missionProgress.records.ilos.status, 'complete');
  assert.ok(received.missionProgress.records.ilos.remaining > 0);
  report.checks.push('La fenêtre a été activée puis franchie en temps réel par les contrôles publics.');

  await (await approach('mission:ilos:exit', 'Emprunter le Conduit')).click();
  await page.getByRole('button', { name: 'Emprunter le Conduit et poursuivre la mission.' }).click();
  await page.getByRole('button', { name: 'Emprunter le Conduit.', exact: true }).waitFor();
  // Deliberately interrupt between chapter completion and the actual zone change.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await action('continue').click();
  await ready();
  const resumed = await exportState();
  assert.equal(resumed.zone, 'ilos');
  assert.equal(resumed.completed.filter(zone => zone === 'ilos').length, 1);
  assert.equal(resumed.story.visitedZones.includes('citadel-finale'), false);
  assert.deepEqual([resumed.xp, resumed.credits], [received.xp + CHAPTERS.ilos.reward, received.credits + 180]);
  await openMap();
  await marker('mission:ilos:exit').waitFor();
  assert.equal(await marker('ilos:objective').count(), 0);
  await capture('resumed-exit', page.locator('.local-map-board'));
  await action('close').click();
  report.checks.push('Le rechargement entre validation et voyage retrouve le passage à son emplacement et le chapitre terminal reste terminé.');

  await (await approach('mission:ilos:exit', 'Emprunter le Conduit')).click();
  await ready();
  await page.waitForTimeout(700);
  const arrived = await exportState();
  assert.equal(arrived.zone, 'citadel-finale');
  assert.deepEqual(arrived.position, getWorldArrival('citadel-finale', 'ilos'));
  assert.equal(arrived.story.visitedZones.filter(zone => zone === 'citadel-finale').length, 1);
  assert.deepEqual([arrived.xp, arrived.credits], [resumed.xp, resumed.credits]);
  report.arrival = { zone: arrived.zone, position: arrived.position, chapterXp: resumed.xp, credits: resumed.credits };
  await capture('arrival');
  report.checks.push('Le passage reprend le trajet direct, arrive au point attendu et ne rejoue ni trajet ni récompense.');
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (error) {
  report.failure = String(error.stack || error);
  process.exitCode = 1;
  await capture('failure').catch(() => {});
} finally {
  await browser.close();
  await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ passed: report.passed, output, failure: report.failure }));
}
