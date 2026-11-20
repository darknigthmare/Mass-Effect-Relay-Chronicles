import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { applyResolveVirmireInteraction, completeZone, decodeSave, encodeSave, newGame, recruit, winEncounter, zoneEncounters } from '../src/state.js';
import { recordVisit } from '../src/story.js';
import { RESOLVE_VIRMIRE_POIS, virmireReport } from '../src/resolve-virmire.js';

const endpoint = new URL(process.env.GAME_URL || 'http://127.0.0.1:4304/');
const build = process.env.P0_BUILD_DIR || 'dist';
const output = process.env.P0_VIRMIRE_OUTPUT || 'test-results/p0-virmire-field';
const group = process.env.P0_VIRMIRE_GROUP || 'all';
assert.ok(['all', 'support', 'research'].includes(group));
const sha256 = data => createHash('sha256').update(data).digest('hex');
const report = {
  passed: false, generatedAt: new Date().toISOString(), url: endpoint.href, checks: [], captures: [], fixtures: [], errors: [],
  scope: 'Virmire dans le build Vite. Interventions, recherche et journal par les commandes publiques.',
  limits: ['Les victoires nécessaires et les arrivées aux postes sont préparées nativement entre les interactions. Les choix, le journal et les exports sont effectués dans le navigateur.'],
};
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 830 }, acceptDownloads: true });
page.setDefaultTimeout(20000);
const button = name => page.locator(`[data-do="${name}"]`).first();
const journal = page.locator('[data-resolve-id="virmire"]');
const ready = async () => {
  await page.locator('#hud:not(.hidden) .location h2').waitFor();
  await page.locator('#transition.active, #overlay .screen, #overlay .dialogue').waitFor({ state: 'hidden' });
};

const prepared = () => {
  const state = newGame({ name: 'Essai Virmire', difficulty: 'story' });
  state.flags.briefed = true;
  Object.assign(state.settings, { sound: false, reducedMotion: true });
  for (const zone of ['eden-prime', 'citadel', 'therum', 'noveria']) {
    state.zone = zone;
    assert.equal(recordVisit(state, zone), true);
    if (zone === 'citadel') assert.equal(recruit(state, 'tali'), true);
    for (const id of zoneEncounters(zone)) assert.equal(winEncounter(state, id), true, id);
    assert.equal(completeZone(state, zone, zone === 'noveria' ? 'release' : null), true, zone);
  }
  state.zone = 'virmire';
  assert.equal(recordVisit(state, 'virmire'), true);
  return state;
};

async function importAt(state, key, preparation) {
  if (!await button('import').isVisible()) {
    await ready();
    await page.keyboard.press('Escape');
    await button('quit').press('Enter');
  }
  const anchor = RESOLVE_VIRMIRE_POIS[key], positioned = { ...state, position: { x: anchor.x, z: anchor.z } };
  const bytes = Buffer.from(encodeSave(positioned));
  assert.ok(decodeSave(bytes.toString()), key);
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), button('import').press('Enter')]);
  await chooser.setFiles({ name: `virmire-${key}.json`, mimeType: 'application/json', buffer: bytes });
  await ready();
  report.fixtures.push({ key, sha256: sha256(bytes), position: positioned.position, preparation });
}

async function act(key, selection) {
  await page.keyboard.press('KeyE');
  const interaction = page.locator(`.dialogue[data-conversation-id="resolve-virmire"][data-current-topic="resolve:virmire:${key}"]`);
  const choice = interaction.locator(`[data-reply-id="${selection}"]`);
  await choice.waitFor();
  assert.equal(await choice.isEnabled(), true);
  await choice.press('Enter');
  const continuation = page.locator('.dialogue [data-do="dialogue-choice"]');
  assert.equal(await interaction.count(), 0);
  await continuation.first().press('Enter');
  await ready();
}

async function exported() {
  await page.keyboard.press('Escape');
  if (!await button('export').isVisible()) await button('save').press('Enter');
  const [download] = await Promise.all([page.waitForEvent('download'), button('export').press('Enter')]);
  const bytes = await readFile(await download.path());
  const state = decodeSave(bytes.toString());
  assert.ok(state);
  await button('close').press('Enter');
  await ready();
  return { state, sha256: sha256(bytes) };
}

async function openJournal() {
  await page.keyboard.press('KeyJ');
  await journal.waitFor();
}

async function closeJournal() {
  await page.keyboard.press('Escape');
  await ready();
}

const research = () => journal.locator('[data-virmire-research]').evaluateAll(items => items.map(item => item.dataset.virmireResearch));
async function capture(name, locator = journal) {
  const file = path.join(output, `${name}.png`);
  const bytes = await locator.screenshot({ animations: 'disabled' });
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
  const navigation = await page.goto(endpoint.href, { waitUntil: 'domcontentloaded' });
  assert.equal(navigation.status(), 200);
  report.documentSha256 = sha256(await navigation.body());
  assert.equal(report.documentSha256, sha256(await readFile(path.join(build, 'index.html'))));
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  await button('title-settings').click();
  await page.locator('#completion-quality').selectOption('economy');
  await page.keyboard.press('Escape');
  let saved;
  if (group !== 'research') {
    await importAt(prepared(), 'briefing', 'Campagne préalable et arrivée préparées.');
    await act('briefing', 'send-ashley');
    saved = await exported();
    assert.equal(virmireReport(saved.state).stgVolunteer, 'ashley');
    assert.equal(saved.state.party.includes('ashley'), false);
    assert.equal(winEncounter(saved.state, 'virmire:encounter-1'), true);
    const actions = [['communications', 'disrupt'], ['satellite', 'destroy'], ['flyers', 'destroy']];
    const seen = { communications: false, satellite: false, flyers: false };
    const changes = [];
    for (const [key, selection] of actions) {
      await importAt(saved.state, key, 'Export de la commande précédente et arrivée au poste. Premier barrage préparé au premier import.');
      await act(key, selection);
      seen[key] = true;
      await openJournal();
      for (const [id, done] of Object.entries(seen)) {
        assert.equal(await journal.locator(`[data-virmire-support="${id}"]`).getAttribute('data-done'), String(done));
      }
      assert.deepEqual(await research(), []);
      if (key === 'flyers') await capture('soutiens-confirmes');
      await closeJournal();
      saved = await exported();
      const state = virmireReport(saved.state);
      assert.deepEqual(state.support, seen);
      assert.equal(state.alarms, null);
      changes.push({ intervention: key, support: state.support, exportSha256: saved.sha256 });
  }
  await importAt(saved.state, 'alarms', 'Export après les trois soutiens et arrivée à la console.');
  await act('alarms', 'disable');
  saved = await exported();
  assert.deepEqual(virmireReport(saved.state).support, seen);
  assert.equal(virmireReport(saved.state).alarms, 'disabled');
  report.checks.push({ id: 'QST-soutien-aux-galariens', passed: true, exactDescription: 'Saboter les systèmes utiles à Kirrahe.',
    exactCriterion: 'Chaque action modifie son drapeau précis.', changes, alarmsIndependent: true });
  console.log('QST-soutien-aux-galariens');
  }

  if (group !== 'support') {
    if (!saved) {
      const state = prepared();
      const { x, z } = RESOLVE_VIRMIRE_POIS.briefing;
      state.position = { x, z };
      assert.equal(applyResolveVirmireInteraction(state, 'resolve:virmire:briefing', 'send-ashley').ok, true);
      assert.equal(winEncounter(state, 'virmire:encounter-1'), true);
      saved = { state };
  }
  assert.equal(winEncounter(saved.state, 'virmire:encounter-2'), true);
  const order = [['rana', 'release'], ['beacon', 'activate'], ['sovereign', 'confront']];
  const known = [];
  for (const [key, selection] of order) {
    await importAt(saved.state, key, 'Export des connaissances précédentes et arrivée au point. Combat du laboratoire préparé au premier import.');
    await openJournal();
    assert.deepEqual(await research(), known);
    if (!known.length) assert.doesNotMatch(await journal.innerText(), /endoctrinement|Sovereign/);
    await closeJournal();
    await act(key, selection);
    known.push(key);
    await openJournal();
    assert.deepEqual(await research(), known);
    if (key === 'rana') await capture('rapport-rana');
    await closeJournal();
    saved = await exported();
  }
  await page.reload();
  await button('continue').press('Enter');
  await ready();
  await openJournal();
  assert.deepEqual(await research(), known);
  await capture('laboratoire-repris');
  report.checks.push({ id: 'QST-laboratoires-de-saren', passed: true, exactDescription: 'Découvrir les expériences et l’endoctrinement.',
    exactCriterion: 'Informations ordonnées selon la progression.', orderedResearch: known, resumedFromAutomaticSave: true });
  console.log('QST-laboratoires-de-saren');
  }
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (error) {
  report.errors.push(error.stack);
  for (const selector of ['.interaction', '.dialogue', '#toasts']) {
    const content = await page.locator(selector).first().textContent({ timeout: 500 }).catch(() => '');
    if (content) report.errors.push(`${selector} ${content.slice(0, 300)}`);
  }
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, errors: report.errors }));
}
