import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { getComicBriefing } from '../src/comic-briefings.js';
import { chronicleStorageKey, decodeChronicle } from '../src/chronicles.js';
import { SAVE_KEY, encodeSave, newGame } from '../src/state.js';

const root = new URL('../', import.meta.url);
const out = new URL('test-results/p0-inquisition-objectives/', root);
const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4328/');
const dist = resolve(process.env.P0_BUILD_DIR || 'dist');
const context = { mediaId: 'INQ', periodId: 'inq' };
const cataloguePath = 'docs/universe/catalogs/INQ.json';
const entries = JSON.parse(await readFile(new URL(cataloguePath, root))).entries;
const objectives = [
  ['INQ-SC-BRIEF-MAIN', 'inq-recevoir-les-accusations'],
  ['INQ-SC-REPORT-MAIN', 'inq-contre-signature'],
];
const sources = [cataloguePath, 'src/main.js', 'src/universe-ui.js', 'src/comic-briefing-ui.js', 'src/comic-briefings.js',
  'src/comic-short-briefings.js', 'src/chronicles.js', 'src/continuity.js', 'scripts/p0-inquisition-objectives-browser.mjs'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const hashes = async () => Object.fromEntries(await Promise.all(sources.map(async file => [file, hash(await readFile(new URL(file, root)))])));
await mkdir(out, { recursive: true });
const report = {
  at: new Date().toISOString(), passed: false, url: url.href,
  baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  sourceHashes: await hashes(), checks: [], captures: [], errors: [], served: {},
  scope: 'Deux objectifs du récit Inquisition exécutés sur une version compilée. Ces exercices d’archives originaux distinguent constat et accusation. Les scènes, personnages en action et cinématiques du numéro publié restent hors du parcours.',
};
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium', headless: true,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 430, height: 870 } });
  page.setDefaultTimeout(45_000);
  page.on('pageerror', error => report.errors.push(error.message));
  const action = (name, id) => page.locator(`[data-do="${name}"]${id === undefined ? '' : `[data-id="${id}"]`}`).first();
  const key = chronicleStorageKey(context), campaign = encodeSave(newGame());
  const stored = () => page.evaluate(key => localStorage.getItem(key), key);
  const campaignStored = () => page.evaluate(key => localStorage.getItem(key), SAVE_KEY);
  const documentaryState = ({ comicProgress, ...state }) => state;
  async function open(id) {
    await action('chronicles').click();
    await page.locator('#chronicle-media').selectOption('INQ');
    assert.equal(await page.locator('#chronicle-period').inputValue(), 'inq');
    await action('universe-tab', 'reading').click();
    await action('comic-briefing-open', id).click();
  }
  async function reload(id) {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await open(id);
  }
  const response = await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  const index = await response.body();
  assert.equal(hash(index), hash(await readFile(resolve(dist, 'index.html'))));
  for (const reference of index.toString().matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))"/g)) {
    const address = new URL(reference[1], url), file = address.pathname.slice(1);
    const asset = await page.request.get(address.href);
    assert.equal(asset.ok(), true, file);
    const digest = hash(await asset.body());
    assert.equal(digest, hash(await readFile(resolve(dist, file))));
    report.served[file] = digest;
  }
  assert.ok(Object.keys(report.served).length);
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  await page.evaluate(({ key, campaign }) => localStorage.setItem(key, campaign), { key: SAVE_KEY, campaign });
  await action('title-settings').click();
  await page.locator('#completion-quality').selectOption('economy');
  await action('close').click();

  for (const [id, dossier] of objectives) {
    const row = entries.find(entry => entry.id === id);
    assert.equal(row.priority, 'P0');
    const brief = getComicBriefing(context, dossier);
    let receipt;
    const routes = [];
    if (report.checks.length === 0) await open(dossier);
    else {
      await action('comic-briefing-back').click();
      await action('comic-briefing-open', dossier).click();
    }
    for (const method of ['trace', 'review']) {
      const paper = page.locator(`[data-comic-briefing="${dossier}"]`);
      const receiptNode = paper.locator('[data-comic-receipt]');
      const phase = () => paper.getAttribute('data-comic-phase');
      const readReceipt = async () => {
        await receiptNode.locator('summary').click();
        const paragraph = receiptNode.locator('p');
        assert.ok(await paragraph.isVisible());
        return paragraph.innerText();
      };
      if (method === 'review') await action('comic-briefing-restart').click();
      assert.equal(await phase(), 'select');
      assert.equal(await receiptNode.count(), 0);
      assert.equal(await paper.locator('[data-comic-anchor="INQ-REF-SCOPE"][data-comic-origin="Fait établi"]').count(), 1);
      assert.equal(await paper.locator('[data-comic-origin="Adaptation"]').count(), 1);
      await action('comic-briefing-method', method).click();
      const picks = method === 'trace' ? [0, 1, 2] : [brief.review.answer];
      const choice = method === 'trace' ? 'archive' : 'skip';
      const before = await stored();
      await action('comic-briefing-pick', String((picks[0] + 1) % 3)).click();
      assert.equal(await stored(), before);
      assert.equal(await receiptNode.count(), 0);
      if (method === 'trace') await action('comic-briefing-optional').click();
      await action('comic-briefing-pick', String(picks[0])).click();
      const checkpoint = await stored();
      await reload(dossier);
      assert.equal(await stored(), checkpoint);
      assert.equal(await phase(), method === 'trace' ? 'trace' : 'summary');
      assert.equal(await receiptNode.count(), 0);
      for (const index of picks.slice(1)) await action('comic-briefing-pick', String(index)).click();
      assert.equal(await phase(), 'summary');
      assert.equal(await receiptNode.count(), 0);
      await action('comic-briefing-finish', choice).click();
      assert.equal(await phase(), 'resolved');
      const final = await stored();
      const decoded = decodeChronicle(final);
      assert.deepEqual(documentaryState(decoded), documentaryState(decodeChronicle(before)));
      assert.deepEqual(decoded.comicProgress[dossier], { method, step: picks.length, extra: method === 'trace', closed: true });
      const current = await readReceipt();
      assert.equal(current, getComicBriefing(context, dossier, decoded.comicProgress[dossier]).receipt);
      if (receipt !== undefined) assert.equal(current, receipt);
      receipt = current;
      await reload(dossier);
      assert.equal(await stored(), final);
      assert.equal(await phase(), 'resolved');
      assert.equal(await readReceipt(), receipt);
      assert.equal(await campaignStored(), campaign);
      routes.push({ method, optional: method === 'trace', finish: choice, checkpointSha256: hash(checkpoint), finalSha256: hash(final), receiptAfterResume: receipt });
      if (method === 'review') {
        const name = `${dossier}.png`;
        const bytes = await paper.locator('.comic-summary').screenshot({ path: new URL(name, out).pathname, animations: 'disabled' });
        report.captures.push({ name, sha256: hash(bytes) });
      }
    }
    report.checks.push({ id, priority: row.priority, passed: true, exactDescription: row.description, exactCriterion: row.acceptance,
      dossier, title: brief.title, routes, receipt, campaignUnchanged: true });
    console.log(`${id} passé sur deux parcours.`);
  }
  assert.deepEqual(report.errors, []);
  assert.deepEqual(await hashes(), report.sourceHashes);
  report.passed = true;
} catch (error) {
  report.failure = error.stack;
  throw error;
} finally {
  await browser.close();
  await writeFile(new URL('report.json', out), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, report: new URL('report.json', out).pathname }));
}
