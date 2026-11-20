import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { CAMPAIGN_TALENTS, CAMPAIGN_TALENT_ACTIONS } from '../src/campaign-talents.js';
import { ACTIONS } from '../src/combat.js';
import { CHAPTERS } from '../src/game-data.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { decodeSave, encodeSave, newGame } from '../src/state.js';

const endpoint = new URL(process.env.GAME_URL || 'http://127.0.0.1:4230/');
const build = process.env.P0_BUILD_DIR || 'dist';
const output = process.env.P0_NAMES_REPORT || 'test-results/p0-french-names.json';
const catalogue = JSON.parse(await readFile(new URL('../docs/content-catalog.json', import.meta.url)));
const records = new Map(catalogue.entries.map(record => [record.id, record]));
const locations = catalogue.entries.filter(record => record.category === 'worlds' && record.gameKey);
const actionRecords = {
  me1Damping: 'PWR-amortissement',
  me1Immunity: 'PWR-immunite',
  me1Adrenaline: 'PWR-montee-d-adrenaline-me1',
};
const labels = CAMPAIGN_TALENTS.map(talent => talent.label);
const talentList = `Talents de l’adaptation : ${labels.join(', ')}.`;
const sha256 = data => createHash('sha256').update(data).digest('hex');
const report = {
  passed: false, criterionId: 'QA-noms-francais', generatedAt: new Date().toISOString(),
  scope: 'Vite production, noms de lieux et talents implémentés, plan intérieur condensé et dossier de coque du Normandy SR-1.',
  checks: [], errors: [], fixtures: [], locations: {}, talents: {}, actions: {}, captures: [],
};
const check = (id, details) => {
  report.checks.push({ id, passed: true, details });
  console.log(id);
};
const directLocations = locations.flatMap(record => record.gameKey.split(/,\s*/).map(zone => [zone, record]));
assert.deepEqual(directLocations.map(([zone]) => zone).sort(), Object.keys(WORLD_ZONES).sort());
for (const [zone, record] of directLocations) {
  const name = zone === 'citadel-finale' ? `${record.name} assiégée` : record.name;
  assert.equal(WORLD_ZONES[zone].label, name, zone);
  if (CHAPTERS[zone]) assert.equal(CHAPTERS[zone].name, name, zone);
  report.locations[zone] = { name, recordId: record.id };
}
for (const [id, recordId] of Object.entries(actionRecords)) {
  const { name } = records.get(recordId);
  assert.equal(CAMPAIGN_TALENT_ACTIONS[id].label, name);
  assert.equal(ACTIONS[id].label, name);
  report.actions[id] = { name, recordId };
}
assert.ok(records.get(report.criterionId).notes.includes(talentList));
assert.equal(CAMPAIGN_TALENTS.find(talent => talent.id === 'electronics').label, records.get('PWR-electronique').name);
check('definitions', '9 zones, 9 talents et 3 actions de talents comparés aux données du catalogue. La Citadelle assiégée est une phase de la même fiche de lieu.');

await mkdir(path.dirname(output), { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 840 } });
page.setDefaultTimeout(15000);
const button = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
const title = page.locator('.title-menu');
const checkText = async (locator, expected) => assert.equal((await locator.innerText()).trim(), expected);
async function capture(name) {
  const file = path.join(path.dirname(output), `p0-normandy-${name}.png`);
  const bytes = await page.screenshot({ animations: 'disabled' });
  await writeFile(file, bytes, { flag: 'wx' });
  report.captures.push({ path: file, sha256: sha256(bytes) });
}
page.on('pageerror', error => report.errors.push(error.message));
page.on('requestfailed', request => report.errors.push(`${request.url()} ${request.failure()?.errorText}`));
page.on('request', request => {
  const url = new URL(request.url());
  if (url.origin === endpoint.origin && /^\/(?:src|@vite|@fs)\//.test(url.pathname)) report.errors.push(url.href);
});
page.on('response', response => {
  if (response.status() >= 400 && new URL(response.url()).pathname !== '/favicon.ico') report.errors.push(response.url());
});

async function importFixture(classId) {
  if (!await title.isVisible()) {
    await page.keyboard.press('Escape');
    await button('quit').click();
  }
  await title.waitFor();
  const state = newGame({ classId, name: 'Essai des libellés' });
  state.flags.briefed = true;
  Object.assign(state.settings, { sound: false, reducedMotion: true });
  const bytes = Buffer.from(encodeSave(state));
  assert.ok(decodeSave(bytes.toString()), classId);
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), button('import').click()]);
  await chooser.setFiles({ name: `${classId}.json`, mimeType: 'application/json', buffer: bytes });
  const location = page.locator('#hud:not(.hidden) .location h2');
  await location.waitFor();
  await page.locator('#transition.active').waitFor({ state: 'hidden' });
  await checkText(location, report.locations.normandy.name);
  report.fixtures.push({ classId, zone: 'normandy', briefingPrepared: true, sha256: sha256(bytes) });
}

try {
  const entry = await page.goto(endpoint.href, { waitUntil: 'domcontentloaded' });
  assert.equal(entry.status(), 200);
  report.documentSha256 = sha256(await entry.body());
  assert.equal(report.documentSha256, sha256(await readFile(path.join(build, 'index.html'))));
  await title.waitFor();
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  await button('title-settings').click();
  await page.locator('#completion-quality').selectOption('economy');
  await page.keyboard.press('Escape');
  await button('production-catalogue').click();
  const testIds = [...locations.map(record => record.id), ...Object.values(actionRecords), 'PWR-electronique', report.criterionId];
  for (const id of testIds) {
    await page.locator('#production-search').fill(id);
    const record = page.locator(`[data-production-record="${id}"]`);
    await checkText(record.locator('h3'), records.get(id).name);
    if (id === report.criterionId) {
      const limits = record.getByText('Historique et limites');
      await limits.click();
      assert.ok((await record.locator('details[open]').innerText()).includes(talentList));
    }
  }
  check('catalogue', `${testIds.length} fiches ouvertes dans le catalogue public, avec liste des neuf talents.`);
  await button('production-back').click();

  const seen = new Set();
  for (const classId of ['soldier', 'engineer', 'adept']) {
    await importFixture(classId);
    if (classId === 'soldier') {
      await page.keyboard.press('KeyG');
      for (const [id, chapter] of Object.entries(CHAPTERS)) {
        await page.locator(`.planet-dot[data-id="${id}"]`).click();
        await checkText(page.locator(`.planet-detail[data-destination="${id}"] h3`), chapter.name);
      }
      await button('close').click();
      check('galactic-map', 'Les huit phases sont consultées et le HUD confirme le libellé du Normandy.');
      await page.keyboard.press('KeyM');
      const map = page.getByRole('dialog', { name: 'Normandy SR-1', exact: true });
      assert.match(await map.locator('.eyebrow').innerText(), /^carte locale · intérieur condensé$/i);
      await button('map-filter', 'campaign').click();
      const markers = await map.locator('.map-number').evaluateAll(nodes => nodes.map(node => node.dataset.id));
      assert.deepEqual(markers, WORLD_ZONES.normandy.pois.map(poi => poi.id));
      await capture('carte');
      await button('close').click();
      await page.keyboard.press('Escape');
      await button('codex').click();
      await button('horizon-archive').click();
      const hull = page.locator('[data-horizon-dossier="normandy-sr1"]');
      await checkText(hull.locator('h3'), 'Normandy SR-1');
      assert.match(await hull.locator('figcaption').innerText(), /dessin extérieur fixe, sans nouvel intérieur ni pilotage/);
      const asset = await hull.locator('svg image').getAttribute('href');
      assert.match(asset, /\/assets\/horizon-fleet-me1\.png$/);
      const metadata = JSON.parse(await readFile('public/assets/horizon-fleet-me1.json'));
      assert.equal(await hull.locator('.horizon-archive-art > svg').getAttribute('viewBox'), metadata.frames['normandy-sr1'].rect.join(' '));
      assert.equal(await page.locator('[data-do="horizon-record"][data-id*="sr2"]').count(), 0);
      await capture('coque');
      await button('codex').click();
      await button('close').click();
      check('QA-normandy-sr-1', 'Plan de la scène condensée avec ses sept services et coque SR-1 dans le dossier ME1. Aucun module ni visuel SR-2 dans ces vues.');
    }
    await page.keyboard.press('Escape');
    await button('talents').click();
    const cards = page.locator('.talent-card');
    await cards.first().waitFor();
    report.talents[classId] = [];
    for (const card of await cards.all()) {
      const id = await card.getAttribute('data-talent-id');
      const talent = CAMPAIGN_TALENTS.find(item => item.id === id);
      assert.ok(talent, id);
      await checkText(card.locator('h3'), talent.label);
      if (talent.actionId) assert.ok((await card.innerText()).includes(report.actions[talent.actionId].name));
      seen.add(id);
      report.talents[classId].push(id);
    }
    await button('close').click();
  }
  assert.deepEqual([...seen].sort(), CAMPAIGN_TALENTS.map(talent => talent.id).sort());
  check('talent-screen', 'Neuf talents et leurs trois capacités liées, consultés avec les classes Soldat, Ingénieur et Adepte.');
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (error) {
  report.errors.push(error.stack);
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
}
console.log(JSON.stringify({ output, passed: report.passed, checks: report.checks.map(check => check.id), errors: report.errors }));
