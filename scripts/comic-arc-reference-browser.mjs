import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { comicArcBriefings } from '../src/comic-arc-briefings.js';
import { getUniverseRecord, getUniverseWork } from '../src/universe-data.js';

const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4328/');
const dist = resolve(process.env.COMIC_ARC_DIST || 'dist');
const out = resolve(process.env.COMIC_ARC_REPORT_DIR || 'test-results/comic-arc-references');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const criterion = 'L’ancrage reste bref et son numéro/segment est identifiable dans les sources; les détails non confirmés portent À vérifier.';
const works = ['RED', 'EVO', 'INV', 'DIS'];
const catalogues = new Map(await Promise.all(works.map(async id => {
  const bytes = await readFile(getUniverseWork(id).catalogPath);
  return [id, { sha256: sha(bytes), info: JSON.parse(bytes) }];
})));
const report = {
  passed: false, baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  url: url.href, generatedAt: new Date().toISOString(),
  catalogueHashes: Object.fromEntries([...catalogues].map(([id, data]) => [id, data.sha256])),
  checks: [], excluded: [], boundaryChecks: [], servedFiles: {}, captures: [], errors: [],
};
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio'],
});
const page = await browser.newPage({ viewport: { width: 1100, height: 825 } });
page.setDefaultTimeout(30_000);
const action = (id, data) => page.locator(`[data-do="${id}"]${data === undefined ? '' : `[data-id="${data}"]`}`);
const media = page.locator('#chronicle-media');
const period = page.locator('#chronicle-period');
const code = new Map();
page.on('pageerror', error => report.errors.push(error.message));
page.on('request', request => {
  const entry = new URL(request.url());
  if (entry.origin === url.origin && /^\/(?:src|@vite|@fs)\//.test(entry.pathname)) report.errors.push(entry.href);
});
page.on('response', response => {
  const entry = new URL(response.url()), path = entry.pathname.slice(1) || 'index.html';
  if (entry.origin !== url.origin) return;
  if (response.status() >= 400 && path !== 'favicon.ico') report.errors.push(path);
  if (response.status() !== 200 || code.has(path) || !/^(?:index\.html|assets\/[^/]+\.(?:js|css))$/.test(path)) return;
  code.set(path, response.body().then(async bytes => {
    const digest = sha(bytes);
    assert.equal(digest, sha(await readFile(join(dist, path))), path);
    report.servedFiles[path] = digest;
  }).catch(error => report.errors.push(error.message)));
});

async function open(brief) {
  await media.selectOption(brief.mediaId);
  await period.selectOption(brief.periodId);
  await action('universe-tab', 'reading').click();
  await action('comic-briefing-open', brief.id).click();
  const visible = page.locator(`[data-comic-briefing="${brief.id}"]`);
  await visible.waitFor();
  assert.equal(await media.inputValue(), brief.mediaId);
  assert.equal(await period.inputValue(), brief.periodId);
  return visible;
}

async function capture(locator, name) {
  const file = join(out, `${name}.png`);
  const bytes = await locator.screenshot({ animations: 'disabled' });
  await writeFile(file, bytes, { flag: 'wx' });
  report.captures.push({ file, sha256: sha(bytes) });
}

try {
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  await action('chronicles').click();
  assert.equal(await page.evaluate(() => Object.hasOwn(window, '__RELAY_TEST__')), false);
  for (const brief of comicArcBriefings.filter(brief => brief.anchorIds.some(id => /-SC-.*-REF$/.test(id)))) {
    const dossier = await open(brief);
    for (const id of brief.anchorIds.filter(id => /-SC-.*-REF$/.test(id))) {
      const row = catalogues.get(brief.mediaId).info.entries.find(row => row.id === id);
      const record = getUniverseRecord(id);
      const article = dossier.locator(`[data-comic-anchor="${id}"]`);
      assert.equal(row.priority, 'P1', id);
      assert.equal(row.acceptance, criterion, id);
      assert.equal(await article.getAttribute('data-comic-origin'), 'Fait établi', id);
      assert.match(await article.innerText(), /Fait établi/, id);
      assert.equal((await article.locator('[data-comic-reference]').innerText()).trim(), record.reference, id);
      assert.ok((await article.innerText()).includes(record.description.trim()), id);
      assert.ok(record.description.trim().length <= 160, id);
      const links = await article.locator('a[data-comic-source]').evaluateAll(nodes => nodes.map(node => ({
        id: node.dataset.comicSource, href: node.href,
      })));
      assert.deepEqual(links.map(value => value.id), row.sourceIds, id);
      assert.ok(links.every(link => /^https?:\/\//.test(link.href)), id);
      report.checks.push({ id, passed: true, priority: row.priority, exactDescription: row.description, exactCriterion: row.acceptance,
        mediaId: brief.mediaId, periodId: brief.periodId, dossier: brief.id, reference: record.reference, sources: links });
    }
    if (brief.id === 'evo-2-apres-hostilites') await capture(dossier.locator('[data-comic-anchor="EVO-SC-AFTERWAR-REF"]'), 'evolution-transition');
    await action('comic-briefing-back').click();
  }
  const discovery = await open(comicArcBriefings.find(brief => brief.id === 'dis-repere-avant-voyage'));
  const notice = discovery.locator('[data-comic-anchor="DIS-S-BOOK"]');
  assert.equal(await notice.getAttribute('data-comic-origin'), 'Source du repère');
  assert.equal(await discovery.locator('[data-comic-anchor^="DIS-SC-"]').count(), 0);
  await capture(notice, 'discovery-notice');
  report.boundaryChecks.push({ mediaId: 'DIS', proof: 'La notice encadre la période. Les détails des scènes numérotées restent hors des faits du dossier.' });
  for (const work of works) {
    const rows = catalogues.get(work).info.entries.filter(row => row.priority === 'P1' && /-SC-.*-REF$/.test(row.id) && row.acceptance === criterion);
    for (const row of rows.filter(row => !report.checks.some(check => check.id === row.id))) {
      const record = getUniverseRecord(row.id);
      report.excluded.push({ id: row.id, nature: record.nature, reason: 'L’ancre reste indisponible dans les périodes qui reçoivent ces exercices.' });
    }
  }
  await Promise.all(code.values());
  assert.equal(report.checks.length, 10);
  assert.equal(report.excluded.length, 16);
  assert.ok(Object.keys(report.servedFiles).some(file => /^assets\/universe-ui-[^/]+\.js$/.test(file)));
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (error) {
  report.errors.push(error.message);
  throw error;
} finally {
  await browser.close();
  await writeFile(join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
}
