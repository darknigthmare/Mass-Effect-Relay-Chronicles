// Public controls only. Keyboard navigation uses actual Tab, arrows and Enter.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { chromium } from 'playwright';

const endpoint = new URL(process.env.GAME_URL || 'http://127.0.0.1:4276/');
const dist = resolve(process.env.P0_CHRONICLE_DIST || 'dist');
const reportPath = process.env.P0_CHRONICLE_REPORT || 'docs/qa/p0-chronicle-keyboard-report.json';
const captureFolder = process.env.P0_CHRONICLE_CAPTURES;
const scope = ['GAL', 'INF'];
const checks = [], exercises = [], captures = [], errors = [], responses = [], served = new Map();
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceFiles = ['scripts/p0-chronicle-keyboard-browser.mjs', 'tests/chronicle-battle-mode.test.js',
  'src/main.js', 'src/gamepad-controls.js', 'src/universe-ui.js', 'src/universe-ui.css', 'src/combat.js', 'src/chronicles.js'];
const sourceHashes = async () => Object.fromEntries(await Promise.all(sourceFiles.map(async path => [path, hash(await readFile(path))])));
const sources = await sourceHashes();
const nativeCommand = ['--test', 'tests/gamepad-controls.test.js', 'tests/chronicle-battle-mode.test.js', 'tests/universe-ui.test.js', 'tests/chronicles.test.js'];
const nativeResult = execFileSync(process.execPath, nativeCommand, { encoding: 'utf8' });
const tests = Number(/^ℹ tests (\d+)$/m.exec(nativeResult)?.[1]);
const passedTests = Number(/^ℹ pass (\d+)$/m.exec(nativeResult)?.[1]);
assert.ok(tests > 0);
assert.equal(passedTests, tests);

const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 960 }, acceptDownloads: true });
page.setDefaultTimeout(18000);
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => {
  const url = new URL(response.url());
  if (url.origin !== endpoint.origin) return;
  const path = decodeURIComponent(url.pathname.slice(1)) || 'index.html';
  if (path === 'favicon.ico' && response.status() === 404) return;
  if (response.status() >= 400 || path.startsWith('src/')) errors.push(`${response.status()} ${path}`);
  if (response.status() !== 200 || served.has(path)) return;
  served.set(path, null);
  responses.push((async () => {
    const [actual, local] = await Promise.all([response.body(), readFile(join(dist, path))]);
    assert.equal(hash(actual), hash(local), path);
    served.set(path, hash(actual));
  })().catch(error => errors.push(error.message)));
});

const action = (id, value) => `[data-do="${id}"]${value ? `[data-id="${value}"]` : ''}`;
const active = selector => page.evaluate(s => document.activeElement?.matches(s), selector);
const key = choice => page.keyboard.press(choice);
async function tabTo(selector) {
  await page.locator(selector).waitFor();
  for (let index = 0; index < 100; index++) {
    if (await active(selector)) return;
    await key('Tab');
  }
  throw new Error(`Tab ne rejoint pas ${selector}.`);
}
async function enter(selector) {
  await tabTo(selector);
  assert.equal(await page.locator(selector).isEnabled(), true, selector);
  await key('Enter');
}
async function choose(selector, value) {
  await tabTo(selector);
  await key('Home');
  const select = page.locator(selector), steps = await select.locator('option').count();
  for (let index = 0; index < steps; index++) {
    if (await select.inputValue() === value) {
      assert.equal(await active(selector), true, selector);
      return;
    }
    await key('ArrowDown');
  }
  throw new Error(`Le sélecteur ${selector} n’a pas atteint ${value}.`);
}
const status = () => page.locator('#chronicle-battle-status').innerText();
const atb = () => page.locator('[data-chronicle-stat="atb"]').evaluate(el => Number.parseFloat(el.style.width));
const journal = () => page.locator('#chronicle-journal [role="log"]').innerText();
const mode = () => page.locator('#chronicle-mode').inputValue();
async function snapshot(label) {
  if (!captureFolder) return;
  const path = join(captureFolder, `${label}.png`);
  const png = await page.screenshot({ path });
  captures.push({ path, sha256: hash(png) });
}
async function ready() {
  await page.waitForFunction(() => document.querySelector('#chronicle-battle-status')?.textContent === 'En attente d’ordres', null, { timeout: 30000 });
}

try {
  await page.goto(endpoint.href, { waitUntil: 'networkidle' });
  assert.equal(await page.evaluate(() => '__RELAY_TEST__' in window), false);
  await enter(action('chronicles'));
  await page.locator('#chronicle-media').waitFor();
  assert.equal(await active('#chronicle-media'), true);
  for (const [mediaId, scenario] of [['GAL', 'gal-jacob'], ['INF', 'inf-security'], ['INF', 'inf-incarceration']]) {
    console.log(scenario);
    if (await page.locator('#chronicle-media').inputValue() !== mediaId) await choose('#chronicle-media', mediaId);
    if (!(await page.locator('#chronicle-scenario').isVisible())) await enter(action('universe-tab', 'session'));
    await choose('#chronicle-scenario', scenario);
    await enter(action('chronicle-save'));
    const exportControl = action('chronicle-export');
    const [download] = await Promise.all([page.waitForEvent('download'), enter(exportControl)]);
    const packet = JSON.parse(await readFile(await download.path(), 'utf8'));
    assert.equal(packet.session.context.mediaId, mediaId);
    assert.equal(packet.session.scenarioId, scenario);
    await enter(action('chronicle-load'));
    assert.equal(await page.locator('#chronicle-scenario').inputValue(), scenario);

    await enter(action('chronicle-battle'));
    await page.locator('#chronicle-mode').waitFor();
    assert.equal(await mode(), 'wait');
    assert.equal(await active('#chronicle-mode'), true);
    await ready();
    assert.equal(await atb(), 100);
    const burst = action('chronicle-action', 'burst');
    await enter(burst);
    assert.match(await page.locator(burst).getAttribute('class'), /selected/);
    assert.equal(await active(burst), true);
    await choose('#chronicle-mode', 'active');
    assert.equal(await mode(), 'active');
    assert.match(await status(), /en cours/);
    assert.equal(await atb(), 100);
    if (scenario === 'gal-jacob') await snapshot('p0-gal-jacob-mode-actif');
    await choose('#chronicle-mode', 'wait');
    assert.equal(await status(), 'En attente d’ordres');
    assert.equal(await atb(), 100);
    assert.match(await page.locator(burst).getAttribute('class'), /selected/);

    const target = action('chronicle-target', 'chronicle-enemy-0');
    assert.ok(await page.getByRole('progressbar', {name:'Bouclier',exact:true}).count() > 0);
    const types = await page.locator('.chronicle-enemy-units article .chronicle-unit-title .small').allTextContents();
    assert.equal(types.length, 2);
    assert.ok(types.includes('Organique') && types.includes('Synthétique'));
    await enter(target);
    const afterOrder = await journal();
    assert.equal((afterOrder.match(/ : Rafale\./g) || []).length, 1);
    assert.ok(await atb() < 100);
    await enter(action('chronicle-pause'));
    assert.equal(await status(), 'Escarmouche en pause');
    await tabTo('#chronicle-journal');
    assert.match(await journal(), /Rafale/);
    await snapshot(`p0-${scenario}-keyboard`);
    await enter(action('chronicle-pause'));
    await ready();
    assert.ok(await page.locator(burst).isEnabled(), scenario);
    await enter(action('chronicle-preparation'));
    assert.equal(await active(action('chronicle-battle')), true);
    exercises.push({ mediaId, scenario, scenarioAndExport: true, commandRetained: true, atbSpentOnce: true,
      pausedJournalFocused: true, resumedAtb: true, types, afterOrder });
  }
  await key('Escape');
  await page.locator(action('chronicles')).waitFor();
  assert.equal(await active(action('chronicles')), true);
  for (const mediaId of scope) {
    const catalog = JSON.parse(await readFile(`docs/universe/catalogs/${mediaId}.json`, 'utf8'));
    for (const criterion of ['SYS-ACCESS', 'SYS-ATB', 'QA-BALANCE']) {
      const id = `${mediaId}-${criterion}`, entry = catalog.entries.find(row => row.id === id);
      assert.ok(entry);
      checks.push({ id, passed: true, exactDescription: entry.description, exactCriterion: entry.acceptance });
    }
  }
  await Promise.all(responses);
  assert.ok(served.size > 5);
  assert.deepEqual(errors, []);
  assert.deepEqual(await sourceHashes(), sources);
  await writeFile(reportPath, JSON.stringify({ passed: true, at: new Date().toISOString(), baseline: 'a63f5d9',
    command: 'node scripts/p0-chronicle-keyboard-browser.mjs', endpoint: endpoint.href, sources,
    checks, exercises, captures, served: Object.fromEntries(served),
    native: { command: ['node', ...nativeCommand].join(' '), tests,
      balance: 'Les trois combats existants sont gagnés avec rafale, tir et recharge seulement. Les scénarios sont testés par leur API ATB native, sans mettre en scène les campagnes absentes.' },
    limitations: ['Les trois essais ATB disponibles sont testés. Les campagnes mobiles et leurs embranchements ne sont pas couverts.',
      'Les entrées Chromium sont au clavier. Aucun matériel de manette ou écran tactile n’a été testé.'],
  }, null, 2) + '\n', { flag: 'wx' });
  console.log(`${checks.length} critères, ${exercises.length} essais et ${served.size} fichiers vérifiés.`);
} catch (error) {
  if (captureFolder) await page.screenshot({ path: join(captureFolder, 'failure.png'), timeout: 10000 });
  console.error({ errors });
  throw error;
} finally {
  await browser.close();
}
