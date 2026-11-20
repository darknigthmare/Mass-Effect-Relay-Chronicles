// Run against a served Vite production build. Uses public controls and exports.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { buildUniverseRuntime } from './build-universe-runtime.mjs';
import { chronicleStorageKey, decodeChronicle } from '../src/chronicles.js';
import { getUniverseRecord, getUniverseWork } from '../src/universe-data.js';
import { encodeSave, newGame, SAVE_KEY } from '../src/state.js';

const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4227/');
const dist = resolve(process.env.P0_CONTINUITY_DIST || 'dist');
const output = resolve(process.env.P0_CONTINUITY_REPORT || 'docs/qa/p0-next-chronicle-continuity-report.json');
const screenshotDirectory = process.env.P0_CONTINUITY_SCREENSHOTS;
const sourcePaths = ['src/continuity-data.js', 'src/continuation-catalogue.js', 'src/continuity.js', 'src/chronicles.js',
  'src/universe-ui.js', 'src/universe-data.js', 'src/main.js', 'scripts/build-universe-runtime.mjs',
  'tests/universe-ui.test.js', 'tests/chronicles.test.js', 'scripts/p0-chronicle-continuity-browser.mjs'];
const cutCases = ['CALESTON', 'LEGION', 'DARK', 'TIM', 'ARK', 'INDOC'].map(id => `CUT-CASE-${id}`);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceHashes = async () => Object.fromEntries(await Promise.all(sourcePaths.map(async path => [path, hash(await readFile(path))])));
const galContext = { mediaId: 'GAL', periodId: 'gal', galaxy: 'milky-way' };
const checks = [], served = new Map(), errors = [], screenshots = [];
const catalogues = new Map(await Promise.all(['GAL', 'INF', 'CUT'].map(async workId => {
  const { catalogPath } = getUniverseWork(workId);
  return [workId, JSON.parse(await readFile(catalogPath, 'utf8'))];
})));
const success = (id, observations) => {
  const entry = catalogues.get(getUniverseRecord(id).catalogWorkId).entries.find(record => record.id === id);
  assert.ok(entry, id);
  checks.push({ id, exactDescription: entry.description, exactCriterion: entry.acceptance, observations, passed: true });
  console.log(id);
};

const production = await buildUniverseRuntime();
assert.equal(production.source, await readFile('src/universe-data.js', 'utf8'));
for (const mediaId of ['GAL', 'INF']) {
  const catalog = catalogues.get(mediaId);
  for (const entry of catalog.entries) {
    const record = getUniverseRecord(entry.id);
    assert.equal(record.status, entry.status, entry.id);
    assert.deepEqual(record.sourceIds, entry.sourceIds, entry.id);
    assert.equal(record.playable, false, entry.id);
  }
  success(`${mediaId}-SYS-SOURCES`, { work: mediaId, recordsCompared: catalog.entries.length, operation: 'Catalogue comparé au registre régénéré, statut et références identiques pour chaque fiche.' });
}

const sources = await sourceHashes();
const browser = await chromium.launch({
  headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
page.setDefaultTimeout(30000);
const responses = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => {
  const responseUrl = new URL(response.url());
  if (responseUrl.origin !== url.origin) return;
  const file = decodeURIComponent(responseUrl.pathname.slice(1)) || 'index.html';
  if (file === 'favicon.ico' && response.status() === 404) return;
  if (response.status() >= 400 || file.startsWith('src/')) errors.push(`${response.status()} ${file}`);
  if (response.status() === 200 && !served.has(file)) {
    served.set(file, null);
    responses.push((async () => {
      const actual = await response.body(), expected = await readFile(join(dist, file));
      assert.equal(hash(actual), hash(expected), file);
      served.set(file, hash(actual));
    })().catch(error => errors.push(error.message)));
  }
});
const action = (id, value) => page.locator(`[data-do="${id}"]${value ? `[data-id="${value}"]` : ''}`);
const context = async (mediaId, periodId = mediaId.toLowerCase()) => {
  await page.selectOption('#chronicle-media', mediaId);
  await page.selectOption('#chronicle-period', periodId);
};
const witness = () => page.evaluate(key => localStorage.getItem(key), SAVE_KEY);
const snapshot = async label => {
  if (!screenshotDirectory) return;
  const file = join(screenshotDirectory, `${label}.png`);
  const buffer = await page.screenshot({ path: file, animations: 'disabled' });
  screenshots.push({ file, sha256: hash(buffer) });
};
async function exportSession() {
  const [download] = await Promise.all([page.waitForEvent('download'), action('chronicle-export').click()]);
  const contents = await readFile(await download.path(), 'utf8');
  const decoded = decodeChronicle(contents);
  assert.ok(decoded);
  return { decoded, contents };
}
try {
  await page.goto(url.href, { waitUntil: 'networkidle' });
  assert.equal(await page.evaluate(() => '__RELAY_TEST__' in window), false);
  const fixture = encodeSave(newGame({ name: 'Témoin d’isolation', classId: 'soldier' }));
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), action('import').click()]);
  await chooser.setFiles({ name: 'temoin-me1.json', mimeType: 'application/json', buffer: Buffer.from(fixture) });
  await page.locator('#hud:not(.hidden) .location h2').waitFor();
  await page.locator('#transition.active').waitFor({ state: 'hidden' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await action('continue').waitFor();
  await action('chronicles').click();
  const originalCampaign = await witness();
  assert.ok(originalCampaign);

  await context('GAL');
  const conflict = page.locator('.universe-context-title > p').filter({ hasText: /BioWare situe Galaxy/ });
  assert.match(await conflict.innerText(), /entre Mass Effect et Mass Effect 2.*2183.*indéterminée/);
  const notes = page.locator('.universe-period-notes');
  assert.equal(await notes.getAttribute('open'), null);
  await notes.locator('summary').click();
  assert.equal(await notes.locator('a').count(), 3);
  assert.match(await notes.innerText(), /Date non fixée.*GAL-CNT-DATE/s);
  for (const tab of ['reading', 'continuity', 'references', 'session']) {
    await action('universe-tab', tab).click();
    assert.equal(await conflict.isVisible(), true, tab);
  }
  await snapshot('p0-next-galaxy-chronology');

  const bouts = [
    { mediaId: 'GAL', scenarioId: 'gal-jacob', actorId: 'GAL-CHR-JACOB' },
    { mediaId: 'INF', scenarioId: 'inf-security', actorId: 'INF-CHR-RANDALL' },
    { mediaId: 'INF', scenarioId: 'inf-incarceration', actorId: 'INF-CHR-TURIAN' },
  ];
  const play = [];
  let galaxyExport;
  for (const { mediaId, scenarioId, actorId } of bouts) {
    console.log(`Préparation et journal : ${scenarioId}`);
    if (await page.locator('#chronicle-media').inputValue() !== mediaId) await context(mediaId);
    await page.selectOption('#chronicle-scenario', scenarioId);
    const prepared = await exportSession();
    assert.equal(prepared.decoded.scenarioId, scenarioId);
    assert.deepEqual(prepared.decoded.party, [actorId]);
    assert.deepEqual(prepared.decoded.discovered, []);
    assert.deepEqual(prepared.decoded.cleared, []);
    assert.deepEqual(Object.keys(prepared.decoded.context), ['mediaId', 'periodId', 'galaxy']);
    assert.equal(prepared.decoded.context.mediaId, mediaId);
    if (mediaId === 'GAL') galaxyExport = prepared;
    await action('chronicle-battle').click();
    const scope = page.getByRole('heading', { name: /Journal de l’essai ATB.*adaptation indépendante/ });
    assert.equal(await scope.isVisible(), true);
    const log = page.locator('.chronicle-log');
    const priorLog = await log.locator('[role="log"]').innerText();
    const shoot = action('chronicle-action', 'shoot');
    await shoot.waitFor();
    await shoot.click();
    await action('chronicle-target', 'chronicle-enemy-0').click();
    await page.waitForFunction(prior => {
      const journal = document.querySelector('.chronicle-log [role="log"]');
      return journal && journal.innerText !== prior;
    }, priorLog, { timeout: 12000 });
    play.push({ mediaId, scenarioId, actorId, heading: await scope.innerText(), log: await log.innerText() });
    if (scenarioId === 'inf-security') await snapshot('p0-next-infiltrator-atb-log');
    await action('chronicle-preparation').click();
  }

  assert.deepEqual(galaxyExport.decoded.context, galContext);
  assert.equal(await page.evaluate(key => localStorage.getItem(key), chronicleStorageKey(galContext)), galaxyExport.contents);
  assert.equal(await witness(), originalCampaign);
  await context('GAL');
  assert.equal(await conflict.isVisible(), true);
  assert.equal((await exportSession()).contents, galaxyExport.contents);
  success('GAL-CNT-DATE', 'Les repères contradictoires restent visibles dans les onglets. Trois liens de provenance sont affichés. Le contexte enregistré et exporté conserve son identifiant de période sans année.');
  await action('chronicle-back').click();

  await action('credits').click();
  for (const mediaId of ['GAL', 'INF']) {
    await page.selectOption('#production-source-work', mediaId);
    assert.match(await page.locator('[data-production-credits]').innerText(), /Adaptation de fan indépendante et non officielle/);
    assert.match(await page.locator('.production-scope').innerText(), /exercices limités à leur œuvre et leur période/);
    const facts = play.filter(entry => entry.mediaId === mediaId);
    success(`${mediaId}-QA-SCOPE`, { battles: facts, campaignSaveSha256: hash(originalCampaign), exportPath: 'Fichier de chronique v1 local. Aucun état de campagne modifié.' });
  }
  await action('production-catalogue').click();
  await page.selectOption('#production-work', 'CUT');
  for (const id of cutCases) {
    await page.fill('#production-search', id);
    const card = page.locator(`[data-production-record="${id}"]`);
    assert.match(await card.locator('[data-production-archive-scope]').innerText(), /projet de fan.*hors de la continuité publiée/);
    const record = getUniverseRecord(id);
    assert.equal(record.lockReason, 'cut-content');
    assert.equal(record.playable, false);
    assert.deepEqual(record.availability, []);
    assert.ok(record.sourceIds.length > 0, id);
    const sources = [];
    for (const sourceId of record.sourceIds) {
      const source = getUniverseWork('CUT').sources.find(source => source.id === sourceId);
      assert.equal(await card.locator(`[data-production-source-id="${sourceId}"] a`).getAttribute('href'), source.url);
      sources.push({ id: sourceId, title: source.title, kind: source.kind, url: source.url });
    }
    success(id, { sources, archiveOnly: true, playable: record.playable });
  }
  await snapshot('p0-next-cut-archive');
  await action('production-back').click();
  await action('chronicles').click();
  await page.selectOption('#chronicle-media', 'CUT');
  assert.equal(await page.locator('#chronicle-period').isDisabled(), true);
  assert.equal(await action('chronicle-battle').count(), 0);
  assert.equal(await witness(), originalCampaign);

  await Promise.all(responses);
  assert.ok(served.size > 4);
  assert.deepEqual(errors, []);
  assert.deepEqual(await sourceHashes(), sources);
  await writeFile(output, JSON.stringify({ passed: true, at: new Date().toISOString(),
    baseline: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), command: 'node scripts/p0-chronicle-continuity-browser.mjs',
    mode: 'production', url: url.href, sources, checks, screenshots, served: Object.fromEntries(served),
    limitations: [
      'La sauvegarde témoin est produite par newGame et importée par le jeu sans progression.',
      'Le test vérifie les liens et le périmètre affichés par le registre. Les pièces externes n’ont pas été consultées.',
      'Les tirs sont des actions ATB dans les bancs existants. Les campagnes mobiles, les scènes d’origine et les propositions d’archives restent distinctes.',
    ] }, null, 2) + '\n', { flag: 'wx' });
  console.log(`${checks.length} groupes vérifiés. Rapport ${output}`);
} catch (error) {
  if (screenshotDirectory) await snapshot('p0-next-continuity-failure');
  console.error({ errors });
  throw error;
} finally {
  await browser.close();
}
