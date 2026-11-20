import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { newGame, travelCampaign, winEncounter, zoneEncounters, encodeSave, decodeSave } from '../src/state.js';
import { advanceMission, MISSION_DEFINITIONS, tickMission } from '../src/mission-progress.js';

const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4286/');
const dist = process.env.P0_BUILD_DIR || 'dist';
const out = process.env.P0_EDEN_OUTPUT || 'test-results/p0-eden-charge';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const mission = MISSION_DEFINITIONS['eden-prime'];
const report = {
  passed: false, generatedAt: new Date().toISOString(), url: url.href,
  criterion: {
    id: 'QST-desamorcage-du-spatioport',
    exactDescription: 'Neutraliser quatre charges du spatioport sur le terrain, avec désamorçage de six secondes, délai, annulation et reprise.',
    exactCriterion: 'Temps, pause et échec clairement définis.',
  },
  checks: [], fixtures: [], captures: [], servedFiles: [], errors: [],
};
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--renderer-process-limit=1'],
});
const page = await browser.newPage({ viewport: { width: 1000, height: 740 }, acceptDownloads: true });
page.setDefaultTimeout(35_000);
const action = id => page.locator(`[data-do="${id}"]`).first();
const answer = id => page.locator(`.dialogue[data-mission-id="eden-prime"] [data-mission-choice="${id}"]`);
const text = page.locator('.dialogue[data-mission-id="eden-prime"] .dialogue-text');
const hud = page.locator('.mission-chip');
const check = name => { report.checks.push({ name, passed: true }); console.log(name); };

function prepare(position) {
  const state = newGame({ name: 'Essai spatioport', difficulty: 'story' });
  state.flags.briefed = true;
  Object.assign(state.settings, { sound: false, reducedMotion: true });
  assert.equal(travelCampaign(state, 'eden-prime').ok, true);
  for (const id of zoneEncounters('eden-prime').slice(0, 2)) assert.equal(winEncounter(state, id), true);
  state.position = position;
  return state;
}
async function ready() {
  await page.locator('#hud:not(.hidden) .location').waitFor();
  await page.locator('#transition.active,#overlay .dialogue,#overlay .screen').waitFor({ state: 'hidden' });
}
async function importSave(name, state, precondition) {
  if (!await action('import').isVisible()) {
    await page.keyboard.press('Escape');
    await action('quit').click();
  }
  const bytes = Buffer.from(encodeSave(state));
  assert.ok(decodeSave(bytes.toString()));
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), action('import').click()]);
  await chooser.setFiles({ name: `${name}.json`, mimeType: 'application/json', buffer: bytes });
  report.fixtures.push({ name, sha256: hash(bytes), precondition });
}
async function exportPaused() {
  const [download] = await Promise.all([page.waitForEvent('download'), action('export').click()]);
  const state = decodeSave(await readFile(await download.path(), 'utf8'));
  assert.ok(state);
  return state;
}
async function capture(name) {
  const path = resolve(out, `${name}.png`);
  const bytes = await page.screenshot({ path, animations: 'disabled' });
  report.captures.push({ path, sha256: hash(bytes) });
}
const progress = state => state.missionProgress.records['eden-prime'];
const compiled = new Map();
page.on('pageerror', error => report.errors.push(error.message));
page.on('response', response => {
  const uri = new URL(response.url()), file = uri.pathname.slice(1) || 'index.html';
  if (uri.origin !== url.origin) return;
  if (response.status() >= 400 && file !== 'favicon.ico') report.errors.push(response.url());
  if (response.status() !== 200 || compiled.has(file) || !/^(?:index\.html|assets\/[^/]+\.(?:js|css))$/.test(file)) return;
  compiled.set(file, response.body().then(async bytes => {
    const sha256 = hash(bytes);
    assert.equal(sha256, hash(await readFile(resolve(dist, file))), file);
    report.servedFiles.push({ path: file, sha256 });
  }).catch(error => report.errors.push(error.message)));
});

try {
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  assert.equal(await page.evaluate(() => Object.hasOwn(window, '__RELAY_TEST__')), false);
  await action('title-settings').click();
  await page.locator('#completion-quality').selectOption('economy');
  await action('close').click();

  await importSave('avant-le-delai', prepare({ x: 22, z: -52.7 }), 'Briefing et deux contacts préparés par les API natives.');
  await ready();
  await page.keyboard.press('KeyE');
  await answer('start').waitFor();
  const rules = await text.innerText();
  assert.match(rules, /cinq minutes/);
  assert.match(rules, /six secondes immobile/);
  assert.match(rules, /Menus, combats, chargements et perte du focus suspendent/);
  await capture('regles');
  await answer('start').click();
  await hud.getByText(/0\/4.*(?:5:00|4:59|4:58)/).waitFor();
  check('Le dialogue précise les cinq minutes, les six secondes immobiles et les conditions qui suspendent le temps.');

  const { x, z, id } = mission.steps[0], started = prepare({ x, z });
  assert.equal(advanceMission(started, 'eden-prime', 'start').ok, true);
  await importSave('premiere-charge', started, 'Mission activée par les API natives et départ à côté de la première charge.');
  await ready();
  await page.keyboard.press('KeyE');
  assert.match(await answer('disarm').innerText(), /6 secondes immobile/);
  await answer('disarm').click();
  await page.keyboard.press('Escape');
  const first = await exportPaused();
  assert.equal(progress(first).channel?.stepId, id);
  assert.ok(progress(first).channel.remaining > 0 && progress(first).channel.remaining <= 6);
  await new Promise(resolve => setTimeout(resolve, 1500));
  const second = await exportPaused();
  assert.deepEqual(progress(second), progress(first));
  await action('close').click();
  await ready();
  await page.keyboard.press('KeyE');
  await answer('cancel').waitFor();
  await answer('cancel').click();
  await page.keyboard.press('Escape');
  const cancelled = await exportPaused();
  assert.equal(progress(cancelled).channel, null);
  assert.deepEqual(progress(cancelled).steps, []);
  await action('close').click();
  await ready();
  check('En pause, le délai et le canal restent identiques entre deux exports. L’annulation n’enregistre aucune charge neutralisée.');

  const late = prepare({ ...mission.start });
  assert.equal(advanceMission(late, 'eden-prime', 'start').ok, true);
  assert.deepEqual(tickMission(late, 299), []);
  await importSave('avant-expiration', late, 'Les API natives préparent les 299 premières secondes, la dernière seconde se déroule dans le navigateur.');
  await answer('retry').waitFor();
  assert.match(await text.innerText(), /délai est écoulé/);
  assert.match(await hud.innerText(), /Échec.*point de contrôle/);
  await capture('echec');
  await answer('retry').click();
  await ready();
  await page.keyboard.press('Escape');
  const retried = await exportPaused();
  assert.equal(progress(retried).attempts, 2);
  assert.ok(progress(retried).remaining <= 300 && progress(retried).remaining > 295);
  assert.deepEqual(progress(retried).steps, []);
  assert.deepEqual([retried.xp, retried.credits, retried.medigel], [late.xp, late.credits, late.medigel]);
  check('L’expiration réelle affiche l’échec, puis le point de contrôle réarme la mission sans changer les ressources.');

  await Promise.all(compiled.values());
  assert.ok(report.servedFiles.some(entry => /^assets\/index-.+\.js$/.test(entry.path)));
  assert.deepEqual(report.errors, []);
  report.criterion.passed = report.passed = true;
} catch (error) {
  report.errors.push(error.message);
  throw error;
} finally {
  await browser.close();
  await writeFile(resolve(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
}
