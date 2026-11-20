import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { decodeSave } from '../src/state.js';

const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4286/');
const output = process.env.P0_RELATIONS_OUTPUT || 'test-results/p0-companion-notes';
const dist = process.env.P0_BUILD_DIR || 'dist';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { passed: false, generatedAt: new Date().toISOString(), url: url.href, checks: [], served: [], errors: [] };
const viewport = { width: 1000, height: 740 };
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--renderer-process-limit=1'],
});
const page = await browser.newPage({ viewport, acceptDownloads: true });
page.setDefaultTimeout(35000);
const codeResponses = new Map();
page.on('pageerror', error => report.errors.push(error.message));
page.on('response', response => {
  const uri = new URL(response.url());
  if (uri.origin !== url.origin) return;
  if (response.status() >= 400 && uri.pathname !== '/favicon.ico') report.errors.push(response.url());
  const relative = uri.pathname.slice(1) || 'index.html';
  if (response.status() !== 200 || !/(?:index\.html|assets\/[^/]+\.(?:js|css))$/.test(relative) || codeResponses.has(relative)) return;
  codeResponses.set(relative, response.body().then(async bytes => {
    assert.equal(sha(bytes), sha(await readFile(resolve(dist, relative))));
    report.served.push({ path: relative, sha256: sha(bytes) });
  }).catch(error => report.errors.push(error.message)));
});

const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
const note = page.locator('[data-companion-relation="kaidan"]');
const choice = id => note.locator(`[data-choice="${id}"]`);
async function field() {
  await page.locator('#hud:not(.hidden) .location').waitFor();
  await page.locator('#transition.active,#overlay .dialogue,#overlay .screen').waitFor({ state: 'hidden' });
}
async function exportState() {
  await page.keyboard.press('Escape');
  const [download] = await Promise.all([page.waitForEvent('download'), action('export').click()]);
  const result = decodeSave(await readFile(await download.path(), 'utf8'));
  assert.ok(result);
  await action('close').click();
  await field();
  return result;
}
const check = name => { report.checks.push({ name, passed: true }); console.log(name); };

try {
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  assert.equal(await page.evaluate(() => Object.hasOwn(window, '__RELAY_TEST__')), false);
  await action('title-settings').click();
  await page.locator('#completion-quality').selectOption('economy');
  await page.locator('#motion-setting').check();
  await page.locator('#sound-setting').uncheck();
  await action('close').click();
  await action('new').click();
  await action('begin').click();
  await page.getByRole('button', { name: 'Je rejoins le briefing.' }).click();
  await field();
  await page.keyboard.press('KeyC');
  await note.waitFor();
  assert.equal(await choice('friendship').count(), 0);
  await action('conversation', 'kaidan').click();
  await page.locator('.dialogue [data-topic-id="implants"]').click();
  await page.locator('.dialogue [data-conversation-back]').click();
  await page.locator('.dialogue [data-conversation-end]').click();
  await field();
  const before = await exportState();
  await page.keyboard.press('KeyC');
  await choice('friendship').click();
  assert.match(await note.locator('[data-companion-note]').innerText(), /Note privée · Amitié/);
  assert.equal(await choice('romantic-interest').evaluate(button => button === document.activeElement), true);
  check('Un échange réel débloque la note. Consigner l’amitié garde l’action suivante accessible au clavier.');
  await choice('romantic-interest').press('Enter');
  assert.match(await note.locator('[data-companion-note]').innerText(), /Note privée · Intérêt romantique de Shepard/);
  await note.scrollIntoViewIfNeeded();
  const screenshot = resolve(output, 'interet-prive.png');
  const bytes = await page.screenshot({ path: screenshot, animations: 'disabled' });
  report.capture = { path: screenshot, sha256: sha(bytes), viewport };

  await page.reload({ waitUntil: 'domcontentloaded' });
  await action('continue').click();
  await field();
  await page.keyboard.press('KeyC');
  await note.locator('[data-companion-note="romantic-interest"]').waitFor();
  await choice('withdraw').click();
  await note.locator('[data-companion-note="friendship"]').waitFor();
  await choice('clear').click();
  assert.equal(await note.locator('[data-companion-note]').count(), 0);
  await action('close').click();
  await field();
  const after = await exportState();
  assert.deepEqual(after.companionRelations, {});
  for (const field of ['inventory', 'party', 'recruited', 'lost', 'xp', 'credits', 'choices', 'story'])
    assert.deepEqual(after[field], before[field], field);
  check('La reprise conserve l’opt-in. Le retrait et l’effacement préservent les échanges, le commando et les ressources.');
  await Promise.all(codeResponses.values());
  assert.ok(report.served.some(entry => /^assets\/index-.+\.js$/.test(entry.path)));
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (error) {
  report.errors.push(error.message);
  throw error;
} finally {
  await browser.close();
  await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
}
