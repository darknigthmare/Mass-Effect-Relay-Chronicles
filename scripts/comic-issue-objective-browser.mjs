import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { chronicleStorageKey, decodeChronicle } from '../src/chronicles.js';
import { comicIssueBriefings } from '../src/comic-issue-briefings.js';
import { getUniverseRecord, getUniverseWork } from '../src/universe-data.js';

const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4325/');
const dist = process.env.P0_BUILD_DIR || 'dist';
const output = process.env.P0_COMIC_ISSUE_OUTPUT || 'test-results/comic-issue-objective';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const archive = comicIssueBriefings.find(item => item.id === 'hom-liara-archive-access');
const { id, mediaId, periodId } = archive;
const storage = chronicleStorageKey({ mediaId, periodId });
const catalogue = new Map(await Promise.all(['HOM', 'FOU'].map(async work => {
  const path = getUniverseWork(work).catalogPath;
  const bytes = await readFile(path);
  const entries = new Map(JSON.parse(bytes).entries.map(row => [row.id, row]));
  return [work, { path, sha256: sha256(bytes), entries }];
})));
const report = { passed: false, baseline: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  at: new Date().toISOString(), checks: [], receipt: [], references: [], captures: [], errors: [], servedFiles: {} };
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 825 }, acceptDownloads: true });
  page.setDefaultTimeout(35_000);
  const verification = new Map();
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('request', request => {
    const resource = new URL(request.url());
    if (resource.origin === url.origin && /^\/(?:src|@vite|@fs)\//.test(resource.pathname)) report.errors.push(resource.href);
  });
  page.on('response', response => {
    const resource = new URL(response.url()), path = resource.pathname.slice(1) || 'index.html';
    if (resource.origin !== url.origin) return;
    if (response.status() >= 400 && path !== 'favicon.ico') report.errors.push(resource.href);
    if (response.status() !== 200 || verification.has(path) || !/^(?:index\.html|assets\/[^/]+\.(?:js|css))$/.test(path)) return;
    verification.set(path, response.body().then(async bytes => {
      const digest = sha256(bytes);
      assert.equal(digest, sha256(await readFile(join(dist, path))), path);
      report.servedFiles[path] = digest;
    }).catch(error => report.errors.push(error.message)));
  });
  const action = (action, value) => page.locator(`[data-do="${action}"]${value === undefined ? '' : `[data-id="${value}"]`}`).first();
  const media = page.locator('#chronicle-media'), period = page.locator('#chronicle-period');
  const dossier = page.locator('[data-comic-briefing]'), phase = () => dossier.getAttribute('data-comic-phase');
  const annex = dossier.locator('[data-comic-receipt]');
  const persisted = async () => {
    const bytes = await page.evaluate(key => localStorage.getItem(key), storage);
    const session = decodeChronicle(bytes);
    assert.ok(session);
    return { hash: sha256(bytes), session };
  };
  const outsideBriefing = ({ comicProgress: _progress, ...rest }) => rest;
  const open = async ({ mediaId, periodId, id }) => {
    await media.selectOption(mediaId); await period.selectOption(periodId);
    await action('universe-tab', 'reading').click();
    await action('comic-briefing-open', id).click();
    assert.equal(await dossier.getAttribute('data-comic-briefing'), id);
    assert.equal(await media.inputValue(), mediaId);
    assert.equal(await period.inputValue(), periodId);
  };
  const enter = async (reload = false) => {
    if (reload) await page.reload({ waitUntil: 'domcontentloaded' });
    else await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
    await action('chronicles').click();
  };
  const consultAnnex = async () => {
    assert.equal(await phase(), 'resolved');
    assert.equal(await annex.count(), 1);
    assert.equal(await annex.getAttribute('open'), null);
    await annex.locator('summary').click();
    assert.ok(await annex.locator('p').isVisible());
    assert.equal(await annex.locator('p').innerText(), archive.receipt);
  };
  const exportChronicle = async () => {
    const [download] = await Promise.all([page.waitForEvent('download'), action('chronicle-export').click()]);
    const bytes = await readFile(await download.path()), result = decodeChronicle(bytes.toString());
    assert.ok(result, 'Export accepted by the Chronicle format');
    return { hash: sha256(bytes), session: result };
  };

  await enter(); await open(archive);
  assert.equal(await dossier.locator('h4').innerText(), '#4 — suivre les archives');
  const journal = dossier.locator('[data-comic-journal]');
  for (const [anchorId, nature] of [['HOM-REF-ISSUE4', 'Fait établi'], ['HOM-SC-LIARA-ARCHIVE-REF', 'À vérifier']]) {
    const item = journal.locator(`[data-comic-anchor="${anchorId}"]`);
    assert.equal(await item.getAttribute('data-comic-origin'), nature);
    assert.ok(await item.locator('a[data-comic-source]').first().isVisible());
  }
  assert.equal(await annex.count(), 0);

  await action('comic-briefing-method', 'trace').click();
  await action('comic-briefing-pick', 0).click();
  const unfinishedTrace = await persisted();
  assert.deepEqual(unfinishedTrace.session.comicProgress[id], { method: 'trace', step: 1, extra: false, closed: false });
  await enter(true); await open(archive);
  assert.equal(await phase(), 'trace');
  assert.equal((await persisted()).hash, unfinishedTrace.hash);
  assert.equal(await annex.count(), 0);
  for (const pick of [1, 2]) await action('comic-briefing-pick', pick).click();
  assert.equal(await phase(), 'summary'); assert.equal(await annex.count(), 0);
  await action('comic-briefing-finish', 'skip').click();
  await consultAnnex();
  const trace = await persisted();
  const exported = await exportChronicle();
  assert.deepEqual(exported, trace);
  assert.deepEqual(outsideBriefing(trace.session), outsideBriefing(unfinishedTrace.session));
  await enter(true); await open(archive);
  assert.equal((await persisted()).hash, trace.hash);
  await consultAnnex();
  report.receipt.push({ method: 'trace', optional: false, skippedSummary: true, earlyReload: unfinishedTrace.hash,
    finalReload: trace.hash, export: exported.hash, receipt: archive.receipt });
  await action('comic-briefing-restart').click();
  assert.equal(await phase(), 'select'); assert.equal(await annex.count(), 0);

  await action('comic-briefing-method', 'review').click();
  await action('comic-briefing-optional').click();
  const unfinishedReview = await persisted();
  assert.deepEqual(unfinishedReview.session.comicProgress[id], { method: 'review', step: 0, extra: true, closed: false });
  await enter(true); await open(archive);
  assert.equal(await phase(), 'review'); assert.equal(await annex.count(), 0);
  assert.equal((await persisted()).hash, unfinishedReview.hash);
  await action('comic-briefing-pick', archive.review.answer).click();
  assert.equal(await phase(), 'summary'); assert.equal(await annex.count(), 0);
  await action('comic-briefing-finish', 'archive').click();
  await consultAnnex();
  const review = await persisted();
  assert.deepEqual(outsideBriefing(review.session), outsideBriefing(trace.session));
  await enter(true); await open(archive);
  assert.equal((await persisted()).hash, review.hash);
  await consultAnnex();
  report.receipt.push({ method: 'review', optional: true, skippedSummary: false, earlyReload: unfinishedReview.hash,
    finalReload: review.hash, receipt: archive.receipt });
  const objective = catalogue.get('HOM').entries.get('HOM-SC-LIARA-ARCHIVE-MAIN');
  report.checks.push({ id: objective.id, priority: 'P0', passed: true,
    description: objective.description, acceptance: objective.acceptance,
    exactDescription: objective.description, exactCriterion: objective.acceptance,
    result: 'Les deux méthodes donnent le même accès en lecture à l’annexe de travail AR-04 après classement. Provenance, choix facultatif, saut du bilan, export et quatre reprises observés. Le reste des informations de la chronique concorde.' });
  const imagePath = join(output, 'annex.png');
  const png = await dossier.screenshot({ path: imagePath, animations: 'disabled' });
  report.captures.push({ path: imagePath, sha256: sha256(png) });
  await action('comic-briefing-back').click();

  for (const brief of comicIssueBriefings.filter(item => item.id !== id)) {
    await open(brief);
    for (const anchorId of brief.anchorIds.filter(anchor => /-SC-.+-REF$/.test(anchor))) {
      const row = catalogue.get(brief.mediaId).entries.get(anchorId), record = getUniverseRecord(anchorId);
      const item = dossier.locator(`[data-comic-anchor="${anchorId}"]`);
      const category = record.fact ? 'Fait établi' : 'À vérifier';
      assert.equal(await item.getAttribute('data-comic-origin'), category, anchorId);
      assert.equal(await item.locator('[data-comic-reference]').textContent(), record.reference, anchorId);
      assert.equal((await item.locator('p').first().innerText()).trim(), row.description.trim(), anchorId);
      const links = await item.locator('a[data-comic-source]').evaluateAll(nodes =>
        nodes.map(link => ({ sourceId: link.dataset.comicSource, url: link.href })));
      assert.deepEqual(links.map(link => link.sourceId), row.sourceIds, anchorId);
      assert.ok(links.every(link => /^https?:\/\//.test(link.url)), anchorId);
      report.references.push({ id: anchorId, mediaId: brief.mediaId, periodId: brief.periodId, priority: 'P1',
        passed: true, category, reference: record.reference, criterion: row.acceptance,
        exactDescription: row.description, exactCriterion: row.acceptance, sources: links });
    }
    await action('comic-briefing-back').click();
  }
  assert.equal(report.references.length, 21);
  assert.equal(report.references.filter(row => row.category === 'À vérifier').length, 20);
  await Promise.all(verification.values());
  assert.ok(Object.keys(report.servedFiles).some(path => /^assets\/universe-ui-.+\.js$/.test(path)));
  assert.deepEqual(report.errors, []);
  report.checks.push(...report.references);
  report.passed = true;
} catch (error) {
  report.failure = error.stack;
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, references: report.references.length, failure: report.failure }));
}
