import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { encodeSave, newGame, SAVE_KEY } from '../src/state.js';
import { loadReferenceCases } from './p0-source-citation-cases.mjs';

const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4232/');
const dist = path.resolve(process.env.P0_CITATIONS_DIST || 'dist');
const output = process.env.P0_CITATIONS_REPORT || 'test-results/p0-source-citations.json';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(url.pathname + url.search + url.hash, '/', 'Use the root of a production build.');
assert.ok(output.endsWith('.json'), 'A fresh JSON report path is required.');
await mkdir(path.dirname(output), { recursive: true });
const cases = await loadReferenceCases();
const trackedFiles = ['src/continuation-catalogue.js', 'src/universe-data.js', 'scripts/p0-source-citations-browser.mjs',
  'scripts/p0-source-citation-cases.mjs'];
const fileHashes = async () => Object.fromEntries(await Promise.all(trackedFiles.map(async file => [file, sha256(await readFile(file))])));
const seed = encodeSave(newGame({ name: 'Témoin du catalogue', difficulty: 'story' }));
const report = {
  passed: false, at: new Date().toISOString(), url: url.href,
  baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  sources: await fileHashes(), checks: [], catalogueHashes: {}, served: {}, captures: [], errors: [],
  scope: 'Attribution et séparation documentaire dans l’application. Les notices et éditions intégrales demeurent hors de cette exécution.',
};

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1260, height: 850 } });
page.setDefaultTimeout(20000);
const responses = new Map();
page.on('pageerror', error => report.errors.push(error.message));
page.on('requestfailed', request => report.errors.push(request.url()));
page.on('request', request => {
  const requestUrl = new URL(request.url());
  if (requestUrl.origin !== url.origin || /^\/(?:src|@vite|@fs)\//.test(requestUrl.pathname)) report.errors.push(request.url());
});
page.on('response', response => {
  const file = new URL(response.url()).pathname.slice(1) || 'index.html';
  if (response.status() >= 400 && file !== 'favicon.ico') report.errors.push(`${response.status()} ${file}`);
  if (response.status() !== 200 || (file !== 'index.html' && !/^assets\/[\w.-]+\.(?:css|js)$/.test(file)) || responses.has(file)) return;
  responses.set(file, response.body().then(async body => {
    const actual = sha256(body);
    assert.equal(actual, sha256(await readFile(path.join(dist, file))), file);
    report.served[file] = actual;
  }).catch(error => report.errors.push(error.message)));
});

const action = name => page.locator(`[data-do="${name}"]`).first();
const detail = page.locator('[data-production-record]');
const workFilter = page.locator('#production-work');
const search = page.locator('#production-search');
const campaignWitness = () => page.evaluate(key => localStorage.getItem(key), SAVE_KEY);

async function capture(name, locator) {
  const file = output.replace(/\.json$/, `-${name}.png`);
  const bytes = await locator.screenshot({ animations: 'disabled' });
  await writeFile(file, bytes, { flag: 'wx' });
  report.captures.push({ name, path: file, sha256: sha256(bytes) });
}

async function readCitation(sourceId) {
  return detail.evaluate((article, id) => {
    const text = (element, selector) => element.querySelector(selector)?.textContent.trim();
    const cards = [...article.querySelectorAll('[data-production-source-id]')];
    const card = cards.find(item => item.dataset.productionSourceId === id);
    return {
      id: article.dataset.productionRecord,
      description: text(article, '[data-production-description]'),
      nature: text(article, '[data-production-record-nature]'),
      documentary: text(article, '[data-production-documentary]'),
      sourceIds: cards.map(item => item.dataset.productionSourceId),
      reference: card && text(card, '[data-production-source-reference]'),
      title: card && text(card, 'h4'),
      kind: card && text(card, '[data-production-source-kind]'),
      scope: card && text(card, '[data-production-source-scope]'),
      note: card && text(card, '[data-production-source-note]'),
      link: card?.querySelector('a')?.href,
      commands: article.querySelectorAll('button, form, [data-do]').length,
    };
  }, sourceId);
}

try {
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: SAVE_KEY, value: seed });
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  await action('continue').waitFor();
  const original = await campaignWitness();
  assert.equal(original, seed);
  await action('production-catalogue').click();

  let lastWork = null;
  for (const { id, workId, exactDescription, exactCriterion, nature, sourceIds, sourceId, source, catalogueSha256 } of cases) {
    if (lastWork !== workId) {
      await workFilter.selectOption(workId);
      await search.fill(sourceId);
      assert.equal(await detail.locator(`[data-production-source-id="${sourceId}"]`).count(), 1, sourceId);
      lastWork = workId;
    }
    await search.fill(id);
    const citation = await readCitation(sourceId);
    assert.equal(citation.id, id);
    assert.equal(citation.description, exactDescription, id);
    assert.equal(citation.nature, nature, id);
    assert.match(citation.documentary, /Il ne rend pas cette fiche jouable et ne débloque aucun contenu/, id);
    assert.equal(citation.commands, 0, id);
    assert.deepEqual(citation.sourceIds, sourceIds, id);
    assert.equal(citation.reference, sourceId, id);
    assert.equal(citation.title, source.title, id);
    assert.equal(citation.kind, source.kind, id);
    assert.equal(citation.scope, source.scope, id);
    assert.equal(citation.note, source.note, id);
    assert.equal(citation.link, new URL(source.url).href, id);
    assert.equal(new URL(citation.link).protocol, 'https:', id);
    report.catalogueHashes[workId] = catalogueSha256;
    report.checks.push({ id, passed: true, exactDescription, exactCriterion, workId, nature, sourceId,
      scope: citation.scope, consultationNote: citation.note, documentaryOnly: true });
    if (id === 'LIB-REF-COLLECTION') {
      const card = detail.locator(`[data-production-source-id="${sourceId}"]`);
      const reference = card.locator('[data-production-source-reference]');
      assert.equal(await reference.isVisible(), true);
      await capture('collection-source', card);
    }
  }

  await workFilter.selectOption('INQ');
  await search.fill('INC-S-PAIR');
  assert.equal(await detail.count(), 0);
  await search.fill('INQ-REF-SCOPE');
  await page.setViewportSize({ width: 390, height: 780 });
  const mobileSource = detail.locator('[data-production-source-id="INQ-S-PAIR"]');
  const bounds = await mobileSource.boundingBox();
  assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= 390);
  await capture('source-mobile', mobileSource);
  await page.setViewportSize({ width: 1260, height: 850 });
  assert.equal(await campaignWitness(), original);
  await action('production-back').click();
  await action('chronicles').click();
  report.lockedWorks = [];
  for (const workId of ['LIB', 'BLA']) {
    await page.locator('#chronicle-media').selectOption(workId);
    assert.equal(await page.locator('#chronicle-period').isDisabled(), true, workId);
    assert.equal(await action('chronicle-battle').count(), 0, workId);
    report.lockedWorks.push(workId);
  }
  const after = await campaignWitness();
  assert.equal(after, original);
  report.campaignSave = { beforeSha256: sha256(original), afterSha256: sha256(after) };
  await Promise.all(responses.values());
  assert.ok(report.served['index.html'] && Object.keys(report.served).filter(file => file.endsWith('.js')).length > 1);
  assert.deepEqual(report.errors, []);
  assert.deepEqual(await fileHashes(), report.sources);
  report.passed = true;
} catch (error) {
  report.failure = String(error.stack || error);
  process.exitCode = 1;
  await capture('failure', page).catch(() => {});
} finally {
  await browser.close();
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, output, failure: report.failure }));
}
