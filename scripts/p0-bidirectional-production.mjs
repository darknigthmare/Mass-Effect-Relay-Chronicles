import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { CHAPTERS } from '../src/game-data.js';
import { getLevelLayout } from '../src/level-layout-data.js';
import { levelMapProjection } from '../src/level-map-render.js';
import { advanceMission, getMissionExit } from '../src/mission-progress.js';
import { commitVigilExchange } from '../src/resolve-endgame.js';
import { completeZone, confirmCampaignBriefing, decodeSave, encodeSave, newGame, recruit, travelCampaign, winEncounter, zoneEncounters } from '../src/state.js';
import { getWorldArrival, WORLD_ZONES } from '../src/world-data.js';

const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4279/');
const output = process.env.P0_TRAVEL_OUTPUT || 'test-results/p0-bidirectional-production';
const dist = process.env.P0_TRAVEL_DIST || 'dist';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { passed: false, at: new Date().toISOString(), url: url.href, checks: [], pairs: [], captures: [], errors: [] };
await mkdir(output, { recursive: true });

function beforeConduitTravel() {
  const state = newGame({ name: 'Contrôle des liaisons', difficulty: 'story', mode: 'wait' });
  state.settings.sound = false;
  state.settings.reducedMotion = true;
  assert.equal(confirmCampaignBriefing(state).ok, true);
  const outcomes = { feros: 'save', noveria: 'release', virmire: 'save-kaidan' };
  for (const zone of Object.keys(CHAPTERS)) {
    if (zone === 'citadel-finale') break;
    assert.equal(travelCampaign(state, zone).ok, true, zone);
    if (zone === 'citadel') assert.equal(recruit(state, 'tali'), true);
    for (const id of zoneEncounters(zone)) assert.equal(winEncounter(state, id), true, id);
    if (zone === 'ilos') {
      assert.equal(commitVigilExchange(state).ok, true);
      assert.equal(advanceMission(state, zone, 'start').ok, true);
      assert.equal(advanceMission(state, 'mission:ilos:vigil', 'activate').ok, true);
      assert.equal(advanceMission(state, 'mission:ilos:conduit', 'enter').ok, true);
    }
    assert.equal(completeZone(state, zone, outcomes[zone]), true, zone);
  }
  assert.equal(state.zone, 'ilos');
  assert.ok(getMissionExit(state));
  return state;
}

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 1120, height: 780 }, acceptDownloads: true });
  page.setDefaultTimeout(30_000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('request', request => {
    if (new URL(request.url()).origin === url.origin && /\/(?:src|@vite|@fs)\//.test(request.url())) report.errors.push(request.url());
  });
  page.on('requestfailed', request => report.errors.push(request.url() + ' ' + request.failure()?.errorText));
  page.on('response', response => {
    if (response.status() >= 400 && new URL(response.url()).pathname !== '/favicon.ico') report.errors.push(response.url() + ' ' + response.status());
  });
  const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
  const hud = page.locator('#hud:not(.hidden) .location h2');
  const ready = async () => {
    await hud.waitFor();
    await page.locator('#transition.active, #overlay .screen, #overlay .dialogue').waitFor({ state: 'hidden' });
  };
  const fixture = async (state, label) => {
    const bytes = Buffer.from(encodeSave(state));
    assert.ok(decodeSave(bytes.toString()), label);
    if (!await action('import').isVisible()) {
      await ready(); await page.keyboard.press('Escape'); await action('quit').click();
    }
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), action('import').click()]);
    await chooser.setFiles({ name: label + '.json', mimeType: 'application/json', buffer: bytes });
    await ready();
    return hash(bytes);
  };
  const observeArrival = async (from, destination) => {
    await ready();
    await page.waitForTimeout(500);
    assert.equal(await hud.innerText(), WORLD_ZONES[destination].label);
    assert.equal(await page.locator('#overlay .dialogue, #transition.active').count(), 0);
    const expected = getWorldArrival(destination, from);
    const bounds = WORLD_ZONES[destination].bounds;
    const projection = getLevelLayout(destination) ? levelMapProjection(bounds) : {
      x: value => 5 + (value - bounds.minX) / (bounds.maxX - bounds.minX) * 90,
      z: value => 5 + (value - bounds.minZ) / (bounds.maxZ - bounds.minZ) * 90,
    };
    await page.keyboard.press('KeyM');
    const style = await page.locator('.map-player').getAttribute('style');
    assert.ok(style.includes(`left:${projection.x(expected.x)}%`), style);
    assert.ok(style.includes(`top:${projection.z(expected.z)}%`), style);
    await action('close').click();
    await ready();
    assert.equal(await hud.innerText(), WORLD_ZONES[destination].label);
    return { from, to: destination, expected, observedMarkerStyle: style, stableAfterMs: 500 };
  };
  const capture = async label => {
    const path = join(output, label + '.png');
    const bytes = await page.screenshot({ path });
    report.captures.push({ label, path, sha256: hash(bytes) });
  };

  const response = await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  assert.equal(response.status(), 200);
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  const document = await response.body();
  assert.equal(hash(document), hash(await readFile(join(dist, 'index.html'))));
  const bundles = [...document.toString().matchAll(/(?:src|href)="\.\/(assets\/[^\"]+\.(?:js|css))"/g)].map(match => match[1]);
  assert.ok(bundles.some(path => path.endsWith('.js')));
  report.files = [{ path: 'index.html', sha256: hash(document) }];
  for (const path of new Set(bundles)) {
    const response = await page.request.get(new URL(path, url).href);
    assert.equal(response.status(), 200);
    const sha256 = hash(await response.body());
    assert.equal(sha256, hash(await readFile(join(dist, path))));
    report.files.push({ path, sha256 });
  }
  await action('title-settings').click(); await page.locator('#completion-quality').selectOption('economy');
  await action('close').click();

  const beforeConduit = beforeConduitTravel();
  const exit = getMissionExit(beforeConduit);
  beforeConduit.position = { x: exit.x, z: exit.z };
  report.conduitFixtureSha256 = await fixture(beforeConduit, 'conduit');
  await page.keyboard.press('KeyE');
  report.conduit = await observeArrival('ilos', 'citadel-finale');
  await capture('conduit-arrival');
  await page.keyboard.press('KeyG');
  await page.locator('#toasts .toast').filter({ hasText: /carte galactique.*Normandy/ }).last().waitFor();
  assert.equal(await page.locator('.starmap').count(), 0);
  await page.keyboard.press('KeyM');
  assert.equal(await page.locator('[data-map-position="mission:ilos:exit"], [data-map-position*="conduit"]').count(), 0);
  await action('close').click(); await ready();
  assert.equal(await hud.innerText(), WORLD_ZONES['citadel-finale'].label);
  report.conduit.returnPortal = false;
  report.checks.push('Le Conduit jouable mène d’Ilos à la Citadelle finale, sans repère inverse et sans accès à la carte galactique depuis la zone d’arrivée.');

  // The fixture prepares only earlier progression and proximity to each local exit.
  const allZones = structuredClone(beforeConduit);
  assert.equal(travelCampaign(allZones, 'citadel-finale').ok, true);
  assert.equal(travelCampaign(allZones, 'normandy').ok, true);
  for (const zone of Object.keys(CHAPTERS)) {
    const state = structuredClone(allZones);
    assert.equal(travelCampaign(state, zone).ok, true);
    const exit = WORLD_ZONES[zone].pois.find(poi => poi.type === 'exit');
    assert.equal(exit.target, 'normandy');
    state.position = { x: exit.x, z: exit.z };
    const fixtureSha256 = await fixture(state, `exit-${zone}`);
    assert.equal(await hud.innerText(), WORLD_ZONES[zone].label);
    await page.keyboard.press('KeyE');
    await page.getByRole('button', { name: 'Extraction.', exact: true }).click();
    const extraction = await observeArrival(zone, 'normandy');
    if (zone === 'eden-prime') await capture('normandy-return');
    await page.keyboard.press('KeyG');
    await page.locator(`.starmap [data-do="planet"][data-id="${zone}"]`).click();
    await action('travel', zone).click();
    const deployment = await observeArrival('normandy', zone);
    if (zone === 'virmire') await capture('virmire-redeployment');
    report.pairs.push({ zone, fixtureSha256, extraction, deployment });
    console.log(JSON.stringify({ pair: zone, passed: true }));
  }
  assert.equal(report.pairs.length, 8);
  assert.deepEqual(report.errors, []);
  report.checks.push('Huit liaisons d’extraction et de déploiement traversées dans les deux sens, positions de carte attendues et stabilité des seize arrivées.');
  report.passed = true;
} catch (error) {
  report.failure = error.stack;
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ passed: report.passed, pairs: report.pairs.length, checks: report.checks.length, failure: report.failure }));
}
