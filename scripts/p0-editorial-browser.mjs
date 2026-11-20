import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { EDITORIAL_WORKS } from './p0-editorial-audit.mjs';
import { UNIVERSE_RECORDS, getUniverseWork } from '../src/universe-data.js';

const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4231/');
const output = process.env.P0_EDITORIAL_REPORT || 'test-results/p0-editorial-browser.json';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(url.search, '');
await mkdir(path.dirname(output), { recursive: true });
const report = {
  passed: false,
  at: new Date().toISOString(),
  url: url.href,
  collectorSha256: sha256(await readFile(new URL(import.meta.url))),
  sourceSha256: Object.fromEntries(await Promise.all(['src/continuation-catalogue.js', 'src/universe-data.js']
    .map(async filename => [filename, sha256(await readFile(filename))]))),
  checks: [],
  captures: [],
  errors: [],
  scope: 'Fiches de production et crédits publics. Les notes de portée et de consultation du registre sont affichées. Le navigateur ne visite aucune source distante pendant le parcours.',
};

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 930 } });
page.setDefaultTimeout(15_000);
page.on('pageerror', error => report.errors.push(error.message));
page.on('requestfailed', request => report.errors.push(request.url()));
page.on('request', request => {
  const target = new URL(request.url());
  if (target.origin !== url.origin) report.errors.push(`Requête hors du build : ${target.origin}`);
  if (process.env.P0_PRODUCTION === '1' && /^\/(?:src|@vite|@fs)\//.test(target.pathname)) report.errors.push(target.pathname);
});
page.on('response', response => {
  if (response.status() >= 400 && new URL(response.url()).pathname !== '/favicon.ico') report.errors.push(response.url());
});
const detail = page.locator('[data-production-record]');
const workSelect = page.locator('#production-work');
const search = page.locator('#production-search');
const action = name => page.locator(`[data-do="${name}"]`).first();

async function capture(name, locator) {
  const filename = output.replace(/\.json$/, `-${name}.png`);
  const bytes = await locator.screenshot({ animations: 'disabled' });
  await writeFile(filename, bytes, { flag: 'wx' });
  report.captures.push({ path: filename, sha256: sha256(bytes) });
}

async function openDisclosure(element) {
  await element.locator('summary').focus();
  await page.keyboard.press('Enter');
  assert.notEqual(await element.getAttribute('open'), null);
}

try {
  const response = await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  assert.equal(response.status(), 200);
  report.documentSha256 = sha256(await response.body());
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  await action('production-catalogue').click();
  for (const id of EDITORIAL_WORKS) {
    const work = getUniverseWork(id);
    const linked = UNIVERSE_RECORDS.find(record => record.catalogWorkId === id && record.fact && record.sourceIds.length > 0);
    await workSelect.selectOption(id);
    await search.fill(linked.id);
    assert.equal(await detail.getAttribute('data-production-record'), linked.id);
    assert.equal(await detail.locator('[data-production-record-nature]').innerText(), 'Établi');
    const relevantSources = work.sources.filter(source => linked.sourceIds.includes(source.id));
    assert.deepEqual(await detail.locator('[data-production-source-id]').evaluateAll(cards => cards.map(card => card.dataset.productionSourceId)),
      relevantSources.map(source => source.id));
    for (const source of relevantSources) {
      const card = detail.locator(`[data-production-source-id="${source.id}"]`);
      assert.equal(await card.locator('[data-production-source-kind]').innerText(), source.kind);
      assert.equal(await card.locator('[data-production-source-note]').innerText(), source.note);
      assert.equal(new URL(await card.locator('a').getAttribute('href')).protocol, 'https:');
    }
    const limits = detail.locator('[data-production-documentation-limits]');
    await openDisclosure(limits);
    assert.equal(await limits.locator('p').innerText(), work.canonNote);
    if (id === 'ASC') await capture('reference-limitee', detail);

    await search.fill(`${id}-QA-SOURCES`);
    assert.equal(await detail.getAttribute('data-production-record'), `${id}-QA-SOURCES`);
    assert.equal(await detail.locator('[data-production-record-nature]').innerText(), 'Extrapolation');
    await detail.locator('[data-production-missing-source]').waitFor();
    const fallback = detail.locator('[data-production-work-sources]');
    assert.equal(await fallback.getAttribute('open'), null);
    assert.equal(await fallback.locator('[data-production-source-id]:visible').count(), 0);
    await openDisclosure(fallback);
    assert.equal(await fallback.locator('[data-production-source-note]:visible').count(), work.sources.filter(source => source.note).length);
    report.checks.push({ criterionId: `${id}-QA-SOURCES`, linkedRecord: linked.id, associatedSources: relevantSources.map(source => source.id),
      workSourceCount: work.sources.length, workLimitsVisible: true, individualReferenceAbsent: true, workReferencesAccessibleByKeyboard: true });
  }

  await action('credits').click();
  const credits = page.locator('[data-production-credits]');
  await credits.waitFor();
  await page.setViewportSize({ width: 390, height: 740 });
  await page.locator('#production-source-work').selectOption('REV');
  const selectedSource = credits.locator('[data-production-source-id="REV-SRC-WIKI"]');
  assert.equal(await selectedSource.locator('[data-production-source-note]').innerText(), getUniverseWork('REV').sources.find(source => source.id === 'REV-SRC-WIKI').note);
  const column = await selectedSource.boundingBox();
  assert.ok(column && column.x >= 0 && column.x + column.width <= 390);
  await capture('source-credits-mobile', selectedSource);
  assert.deepEqual(report.errors, []);
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
