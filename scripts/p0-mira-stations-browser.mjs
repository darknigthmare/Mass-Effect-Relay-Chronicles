import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { MISSION_DEFINITIONS, getMissionEncounterGate } from '../src/mission-progress.js';
import { getLevelLayout, isLevelGround } from '../src/level-layout-data.js';
import { levelMapProjection } from '../src/level-map-render.js';
import { findLevelPath } from '../src/world-navigation.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { completeZone, decodeSave, encodeSave, newGame, recruit, travelCampaign, winEncounter, zoneEncounters } from '../src/state.js';

const endpoint = new URL(process.env.GAME_URL || 'http://127.0.0.1:4296/');
const build = process.env.P0_BUILD_DIR || 'dist';
const directory = process.env.P0_MIRA_OUTPUT || 'test-results/p0-mira-stations';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const mission = MISSION_DEFINITIONS.noveria;
const { bounds } = WORLD_ZONES.noveria;
const projection = levelMapProjection(bounds);
const layout = getLevelLayout('noveria');
const radar = levelMapProjection(bounds, { left: 12, top: 12, width: 126, height: 126 });
const criterion = {
  id: 'QST-remise-en-marche-mira',
  exactDescription: 'Restaurer trois stations techniques persistantes de MIRA avant la suite des laboratoires du Pic 15.',
  exactCriterion: 'Objectifs techniques reflétés dans le décor.',
  passed: false,
};
const report = {
  passed: false, at: new Date().toISOString(), endpoint: endpoint.href, criterion, checks: [], stations: [],
  served: [], captures: [], errors: [],
  baseline: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  collectorSha256: sha256(await readFile(new URL(import.meta.url))),
  scope: 'Appareils 3D des trois stations, ordres et reprise dans le Pic 15 condensé de la campagne adaptée.',
};

function prepareArrival() {
  const state = newGame({ name: 'Contrôle des stations', difficulty: 'story' });
  state.flags.briefed = true;
  Object.assign(state.settings, { sound: false, reducedMotion: true });
  for (const zone of ['eden-prime', 'citadel']) {
    assert.ok(travelCampaign(state, zone).ok);
    if (zone === 'citadel') assert.ok(recruit(state, 'tali'));
    for (const encounter of zoneEncounters(zone)) assert.ok(winEncounter(state, encounter));
    assert.ok(completeZone(state, zone));
  }
  assert.ok(travelCampaign(state, 'noveria').ok);
  assert.ok(winEncounter(state, zoneEncounters('noveria')[0]));
  const { x, z } = WORLD_ZONES.noveria.pois.find(poi => poi.id === 'noveria:encounter-2');
  state.position = { x, z };
  return state;
}

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
page.setDefaultTimeout(25_000);
const action = name => page.locator(`[data-do="${name}"]`).first();
const choice = id => page.locator(`.dialogue[data-mission-id="noveria"] [data-mission-choice="${id}"]`);
const cave = '.world-canvas';
const assets = new Map();
page.on('pageerror', error => report.errors.push(error.message));
page.on('requestfailed', request => report.errors.push(request.url()));
page.on('request', request => {
  const target = new URL(request.url());
  if (target.origin !== endpoint.origin || /^\/(?:src|@vite|@fs)\//.test(target.pathname)) report.errors.push(request.url());
});
page.on('response', response => {
  const file = new URL(response.url()).pathname.slice(1) || 'index.html';
  if (response.status() >= 400 && file !== 'favicon.ico') report.errors.push(response.url());
  if (response.status() !== 200 || assets.has(file) || !/^(?:index\.html|assets\/[^/]+\.(?:js|css|png))$/.test(file)) return;
  assets.set(file, response.body().then(async bytes => {
    const hash = sha256(bytes);
    assert.equal(hash, sha256(await readFile(path.join(build, file))), file);
    report.served.push({ path: file, sha256: hash });
  }).catch(error => report.errors.push(error.message)));
});

const ready = async () => {
  await page.locator('#hud:not(.hidden) .location h2').filter({ hasText: 'Novéria' }).waitFor();
  await page.locator('#transition.active, #overlay .screen, #overlay .dialogue').waitFor({ state: 'hidden' });
};
const mark = name => {
  report.checks.push({ name, passed: true });
  console.log(name);
};
async function persistImage(label, bytes) {
  const file = path.join(directory, `${label}.png`);
  await writeFile(file, bytes, { flag: 'wx' });
  report.captures.push({ path: file, sha256: sha256(bytes) });
}

async function inspectJournal(statuses, captureLabel) {
  await page.keyboard.press('KeyJ');
  const stationList = page.locator('[data-mira-stations]');
  await stationList.waitFor();
  for (const [index, id] of mission.steps.map(step => step.id).entries()) {
    const station = stationList.locator(`[data-mira-station="${id}"]`);
    assert.equal(await station.getAttribute('data-station-state'), statuses[index], id);
  }
  if (captureLabel) await persistImage(captureLabel, await stationList.screenshot());
  await action('close').click();
  await ready();
}

async function stationGeometry(step) {
  await page.keyboard.press('KeyM');
  const marker = page.locator(`circle[data-map-position="mission:noveria:${step.id}"]`);
  await marker.waitFor();
  const map = {
    x: bounds.minX + (Number(await marker.getAttribute('cx')) - projection.originX) / projection.scale,
    z: bounds.minZ + (Number(await marker.getAttribute('cy')) - projection.originZ) / projection.scale,
  };
  const obstacles = await page.locator('[data-map-obstacle]').evaluateAll(nodes => nodes.map(node => {
    const number = key => Number(node.getAttribute(key));
    return node.tagName.toLowerCase() === 'circle'
      ? { x: number('cx'), z: number('cy'), radius: number('r') }
      : { x: number('x'), z: number('y'), width: number('width'), height: number('height') };
  }));
  await action('close').click();
  await ready();
  const canvas = await page.locator(cave).boundingBox();
  const label = await page.locator('.world-labels').getByText(step.label, { exact: true }).evaluate(element => ({
    x: Number.parseFloat(element.style.left), y: Number.parseFloat(element.style.top),
  }));
  const scale = canvas.height / layout.camera.span;
  const horizontal = Math.hypot(23, 27), diagonal = Math.hypot(horizontal, 29);
  const offsetX = step.x + 1.55 - map.x, offsetZ = step.z - .75 - map.z;
  return {
    lamp: {
      x: canvas.x + label.x + scale * (27 * offsetX - 23 * offsetZ) / horizontal,
      y: canvas.y + label.y + scale * ((4.6 - .41) * horizontal / diagonal + 29 * (23 * offsetX + 27 * offsetZ) / (horizontal * diagonal)),
    },
    icon: { x: canvas.x + label.x, y: canvas.y + label.y + scale * (4.6 - 3.98) * horizontal / diagonal },
    map, obstacles,
  };
}

async function radarPosition() {
  return page.locator('.minimap svg > circle[r="3.5"]').evaluate((dot, { bounds, radar }) => ({
    x: bounds.minX + (Number(dot.getAttribute('cx')) - radar.originX) / radar.scale,
    z: bounds.minZ + (Number(dot.getAttribute('cy')) - radar.originZ) / radar.scale,
  }), { bounds, radar: { originX: radar.originX, originZ: radar.originZ, scale: radar.scale } });
}

async function approachStation(id, nearby, { map, obstacles, icon }) {
  const { width, height } = page.viewportSize();
  if (icon.x > 22 && icon.x < width - 22 && icon.y > 28 && icon.y < height - 28) {
    await page.mouse.click(icon.x, icon.y);
    try {
      await choice('repair').or(nearby).first().waitFor({ timeout: 8000 });
      if (await choice('repair').isVisible()) await choice('leave').click();
    } catch (error) {
      if (error.name !== 'TimeoutError') throw error;
    }
  }
  const ground = margin => (x, z) => isLevelGround(layout, x, z) && !obstacles.some(obstacle => obstacle.radius
    ? Math.hypot(x - obstacle.x, z - obstacle.z) < obstacle.radius + margin
    : x > obstacle.x - margin && x < obstacle.x + obstacle.width + margin
      && z > obstacle.z - margin && z < obstacle.z + obstacle.height + margin);
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  for (let attempt = 0; attempt < 90; attempt++) {
    if (await nearby.isVisible()) return;
    const start = await radarPosition();
    const isWalkable = ground(.29)(start.x, start.z) && ground(.29)(map.x, map.z) ? ground(.29) : ground(0);
    const route = findLevelPath({ bounds, start, destination: map, isWalkable });
    assert.ok(route?.length, `Passage de la station ${id} depuis le radar public.`);
    const next = route.find(point => Math.hypot(point.x - start.x, point.z - start.z) >= .85) || map;
    const options = directions.map(([r, f]) => {
      const x = 27 * r - 23 * f, z = -23 * r - 27 * f, length = Math.hypot(x, z);
      return { r, f, dx: x / length, dz: z / length, score: ((next.x - start.x) * x + (next.z - start.z) * z) / length };
    }).filter(({ dx, dz }) => isWalkable(start.x + dx * .55, start.z + dz * .55))
      .sort((a, b) => b.score - a.score);
    assert.ok(options.length, `Aucune direction libre vers ${id}.`);
    const { r: right, f: forward } = options[0];
    const keys = ['ShiftLeft'];
    if (right) keys.push(right > 0 ? 'KeyD' : 'KeyA');
    if (forward) keys.push(forward > 0 ? 'KeyW' : 'KeyS');
    for (const key of keys) await page.keyboard.down(key);
    try {
      for (let sample = 0; sample < 24; sample++) {
        const current = await radarPosition();
        if (await nearby.isVisible() || Math.hypot(current.x - start.x, current.z - start.z) >= 1.1) break;
        await page.waitForTimeout(75);
      }
    } finally {
      for (const key of [...keys].reverse()) await page.keyboard.up(key);
    }
    const end = await radarPosition();
    assert.ok(Math.hypot(end.x - start.x, end.z - start.z) > .07 || await nearby.isVisible(), `Déplacement bloqué vers ${id}.`);
  }
  throw new Error(`Station hors de portée après déplacement : ${id}`);
}

async function lampPixels(bytes, centre) {
  return page.evaluate(async ({ data, centre }) => {
    const bitmap = await createImageBitmap(new Blob([Uint8Array.fromBase64(data)], { type: 'image/png' }));
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext('2d');
    context.drawImage(bitmap, 0, 0);
    const left = Math.floor(centre.x) - 85, top = Math.floor(centre.y) - 85;
    const { data: pixels } = context.getImageData(left, top, 170, 170);
    const counts = { amber: 0, green: 0 };
    for (let p = 0; p < pixels.length; p += 4) {
      const [red, green, blue] = pixels.subarray(p, p + 3);
      if (red >= 183 && green >= 95 && green <= red - 45 && blue <= green - 40) counts.amber++;
      if (green >= 150 && green >= red + 61 && blue >= red + 37 && green >= blue + 13) counts.green++;
    }
    bitmap.close();
    return counts;
  }, { data: bytes.toString('base64'), centre });
}

async function pauseExport() {
  await page.keyboard.press('Escape');
  const [download] = await Promise.all([page.waitForEvent('download'), action('export').click()]);
  const state = decodeSave(await readFile(await download.path(), 'utf8'));
  assert.ok(state);
  return state;
}

try {
  await mkdir(directory, { recursive: true });
  await page.goto(endpoint.href, { waitUntil: 'domcontentloaded' });
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  await action('title-settings').click();
  await page.locator('#completion-quality').selectOption('economy');
  await action('close').click();
  const initial = prepareArrival(), fixture = Buffer.from(encodeSave(initial));
  report.fixture = {
    sha256: sha256(fixture),
    prepared: 'Eden Prime, Citadelle et premier contact de Novéria. La position initiale est transférée au verrou rachni ; activation, marche et réparations passent par les commandes publiques.',
  };
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), action('import').click()]);
  await chooser.setFiles({ name: 'controle-mira.json', mimeType: 'application/json', buffer: fixture });
  await ready();
  await inspectJournal(['locked', 'locked', 'locked']);
  assert.equal(getMissionEncounterGate(initial, 'noveria:encounter-2').status, 'idle');
  await page.keyboard.press('KeyE');
  assert.match(await page.locator('.dialogue[data-mission-id="noveria"] .dialogue-text').innerText(), /trois stations techniques/);
  await choice('start').click();
  await ready();
  await page.locator('.mission-chip').getByText(/0\/3/).waitFor();
  await inspectJournal(['pending', 'pending', 'pending']);
  mark('Le diagnostic expose précisément les trois stations et l’état à réparer.');

  const repairs = [];
  const order = ['uplink', 'power', 'memory'];
  for (const step of order.map(id => mission.steps.find(item => item.id === id))) {
    const target = await stationGeometry(step);
    const nearby = page.locator('#hud .interaction').getByText(step.label, { exact: true });
    await approachStation(step.id, nearby, target);
    const current = await stationGeometry(step);
    await page.waitForTimeout(350);
    const before = await page.screenshot();
    const offline = await lampPixels(before, current.lamp);
    await nearby.click();
    await choice('repair').click();
    await ready();
    await page.waitForTimeout(350);
    const after = await page.screenshot();
    const online = await lampPixels(after, current.lamp);
    assert.ok(offline.amber > 20 && online.green > 20, JSON.stringify({ id: step.id, offline, online, lamp: current.lamp }));
    assert.ok(online.amber < offline.amber / 3 && offline.green < online.green / 3, `Pas de bascule visuelle pour ${step.id}`);
    repairs.push(step.id);
    report.stations.push({ id: step.id, map: current.map, lamp: current.lamp, offline, online });
    if (repairs.length === 1) {
      await persistImage('liaison-hors-service', before);
      await persistImage('liaison-en-service', after);
      const saved = await pauseExport();
      assert.deepEqual(saved.missionProgress.records.noveria.steps, repairs);
      assert.equal(getMissionEncounterGate(saved, 'noveria:encounter-2').status, 'active');
      await action('quit').click();
      await action('continue').click();
      await ready();
      await page.waitForTimeout(350);
      const resumed = await page.screenshot();
      const loaded = await lampPixels(resumed, current.lamp);
      assert.ok(loaded.green > 20 && loaded.amber < offline.amber / 3, 'Le décor doit garder la réparation au rechargement.');
      await persistImage('liaison-reprise', resumed);
      report.stations.at(-1).loaded = loaded;
      await inspectJournal(mission.steps.map(item => repairs.includes(item.id) ? 'online' : 'pending'));
      mark('La première réparation reste visible dans le décor et dans le journal après reprise depuis le titre.');
    }
  }
  await inspectJournal(['online', 'online', 'online'], 'bilan-journal');
  const complete = await pauseExport();
  assert.deepEqual(complete.missionProgress.records.noveria.steps, repairs);
  assert.equal(complete.missionProgress.records.noveria.status, 'complete');
  assert.equal(getMissionEncounterGate(complete, 'noveria:encounter-2'), null);
  for (const field of ['credits', 'medigel', 'xp', 'cleared', 'inventory']) assert.deepEqual(complete[field], initial[field], field);
  mark('Trois appareils basculent d’ambre à vert, chaque état est conservé une fois, et le verrou de progression des laboratoires est retiré.');
  await Promise.all(assets.values());
  assert.ok(report.served.some(item => /^assets\/index-.+\.js$/.test(item.path)));
  assert.deepEqual(report.errors, []);
  criterion.passed = report.passed = true;
} catch (error) {
  report.failure = error.stack || String(error);
  if (!page.isClosed()) await page.screenshot({ path: path.join(directory, 'failure.png') }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(path.join(directory, 'report.json'), JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, failure: report.failure }));
}
