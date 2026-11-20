import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { ITEMS } from '../src/loadout.js';
import { decodeSave, encodeSave, newGame } from '../src/state.js';

const url = process.env.GAME_URL || 'http://127.0.0.1:4173/';
const mode = process.env.P0_TRANSACTION_MODE || 'development';
assert.ok(['development', 'production'].includes(mode));
const output = process.env.P0_TRANSACTION_OUTPUT || 'test-results/p0-transactions';
const reportPath = path.join(output, 'report.json');
await mkdir(output, { recursive: true });
const sourceHashes = {};
for (const filename of ['src/main.js', 'src/activation-guard.js', 'scripts/p0-transactions-browser.mjs']) {
  sourceHashes[filename] = createHash('sha256').update(await readFile(filename)).digest('hex');
}
const report = {
  url, mode, baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), sourceHashes,
  viewport: { width: 1440, height: 1000 }, checks: [], screenshots: [], errors: [], sourceRequests: [], passed: false,
};

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: report.viewport, acceptDownloads: true });
page.setDefaultTimeout(15000);
page.on('pageerror', error => report.errors.push(error.message));
page.on('requestfailed', request => report.errors.push(request.url() + ' ' + request.failure()?.errorText));
page.on('request', request => {
  const requested = new URL(request.url());
  if (requested.origin === new URL(url).origin && /^\/(?:src\/|@vite\/)/.test(requested.pathname)) {
    report.sourceRequests.push(requested.pathname);
  }
});
const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`);
const closeScreen = () => page.locator('button.close[data-do="close"]').click();
const mark = (name, values = {}) => { report.checks.push({ name, ...values }); console.log(name); };
async function screenshot(name) {
  const png = path.join(output, name + '.png');
  const bytes = await page.screenshot({ path: png });
  report.screenshots.push({ path: png, sha256: createHash('sha256').update(bytes).digest('hex') });
}
async function exported() {
  const [download] = await Promise.all([page.waitForEvent('download'), action('export').click()]);
  const state = decodeSave(await readFile(await download.path(), 'utf8'));
  assert.ok(state, 'The actual downloaded save decodes.');
  return state;
}

try {
  const entry = await page.goto(url);
  assert.equal(entry.status(), 200);
  const servedIndex = await entry.body();
  report.indexSha256 = createHash('sha256').update(servedIndex).digest('hex');
  if (mode === 'production') {
    assert.deepEqual(servedIndex, await readFile('dist/index.html'));
  }
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  // The fixture supplies enough budget and spare copies to expose duplicated writes.
  const fixture = newGame({ name: 'Validation des commandes' });
  fixture.credits = 1000;
  fixture.xp = 1200;
  fixture.inventory.items['heat-sink-i'] = 2;
  fixture.settings.reducedMotion = true;
  const [importer] = await Promise.all([page.waitForEvent('filechooser'), action('import').click()]);
  await importer.setFiles({ name: 'transactions.json', mimeType: 'application/json', buffer: Buffer.from(encodeSave(fixture)) });
  await page.locator('#hud:not(.hidden) .location h2').waitFor();
  await page.locator('#transition.active').waitFor({ state: 'hidden' });

  const moduleId = 'heat-sink-i';
  const { cost, sell } = ITEMS[moduleId];
  const initialCopies = fixture.inventory.items[moduleId];
  const initialStock = fixture.inventory.stock[moduleId];
  await action('equipment').click();
  await action('eq-tab', 'shop').click();
  await action('eq-kind', 'weaponMod').click();
  await action('eq-buy', moduleId).dblclick({ delay: 65 });
  await screenshot('shop-after-double-click');
  await closeScreen();
  await action('pause').click();
  const bought = await exported();
  assert.equal(bought.credits, fixture.credits - cost, 'A double click must buy exactly one copy.');
  assert.equal(bought.inventory.items[moduleId], initialCopies + 1);
  assert.equal(bought.inventory.stock[moduleId], initialStock - 1);
  mark('Un achat par double-clic', { credits: bought.credits, owned: bought.inventory.items[moduleId], stock: bought.inventory.stock[moduleId] });

  await closeScreen();
  await action('equipment').click();
  await action('eq-tab', 'inventory').click();
  await action('eq-sell', moduleId).dblclick({ delay: 65 });
  await closeScreen();
  await action('pause').click();
  const sold = await exported();
  assert.equal(sold.credits, bought.credits + sell, 'A double click must sell exactly one copy.');
  assert.equal(sold.inventory.items[moduleId], initialCopies);
  assert.equal(sold.inventory.stock[moduleId], initialStock);
  mark('Une vente par double-clic', { credits: sold.credits, owned: sold.inventory.items[moduleId], stock: sold.inventory.stock[moduleId] });

  await action('talents').click();
  await action('talent-buy', 'fitness').dblclick({ delay: 65 });
  await screenshot('talent-after-double-click');
  await closeScreen();
  await action('pause').click();
  const trained = await exported();
  assert.equal(trained.talents.ranks.shepard.fitness, 1, 'A double click must invest one point.');
  mark('Un rang par double-clic', { rank: trained.talents.ranks.shepard.fitness });

  await action('talents').click();
  await action('talent-buy', 'fitness').focus();
  await page.keyboard.press('Enter');
  await closeScreen();
  await action('pause').click();
  const intentional = await exported();
  assert.equal(intentional.talents.ranks.shepard.fitness, 2);
  assert.equal(intentional.credits, sold.credits);
  mark('Une validation distincte au clavier investit le rang suivant', { rank: intentional.talents.ranks.shepard.fitness });

  await action('manual-saves').click();
  await page.locator('#manual-save-name-1').fill('Contrôle des transactions');
  await action('manual-save', '1').dblclick({ delay: 65 });
  await page.locator('[data-save-slot="1"][data-status="saved"]').waitFor();
  assert.equal(await page.locator('[data-manual-confirm]').count(), 0);
  await screenshot('manual-slot-after-double-click');
  await action('manual-load', '1').click();
  await page.locator('#transition.active').waitFor({ state: 'hidden' });
  await action('pause').click();
  const manual = await exported();
  assert.equal(manual.talents.ranks.shepard.fitness, intentional.talents.ranks.shepard.fitness);
  assert.equal(manual.credits, intentional.credits);
  assert.equal(manual.inventory.items[moduleId], initialCopies);
  assert.equal(manual.inventory.stock[moduleId], initialStock);
  mark('Un emplacement créé sans ouvrir la confirmation de remplacement puis relu');
  assert.deepEqual(report.errors, []);
  if (mode === 'production') assert.deepEqual(report.sourceRequests, []);
  for (const [filename, expected] of Object.entries(sourceHashes)) {
    assert.equal(createHash('sha256').update(await readFile(filename)).digest('hex'), expected, filename);
  }
  report.passed = true;
} catch (error) {
  report.failure = String(error);
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, reportPath, failure: report.failure }));
}
