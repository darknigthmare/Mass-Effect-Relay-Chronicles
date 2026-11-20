// Frame capture of a real, publicly triggered shot in the compiled application.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { encodeSave, newGame } from '../src/state.js';
import { getLevelLayout } from '../src/level-layout-data.js';
import { recordVisit } from '../src/story.js';

const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4234/');
const output = process.env.P0_FLASH_OUTPUT || 'test-results/p0-flash';
await mkdir(output, { recursive: true });
const report = { passed: false, at: new Date().toISOString(), url: url.href, checks: [], captures: [], errors: [],
  scope: 'Public campaign controls, actual compiled WebGL frames, natural ATB and damage. A native save fixture prepares scene entry only.' };
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
  headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let page;
try {
  for (const reducedMotion of [false, true]) {
    const name = reducedMotion ? 'reduced' : 'normal';
    const state = newGame({ name: 'Contrôle cadre par cadre', classId: 'soldier', difficulty: 'story', mode: 'wait' });
    state.flags.briefed = true;
    state.zone = 'eden-prime';
    assert.ok(recordVisit(state, state.zone));
    state.position = { ...getLevelLayout(state.zone).pois['encounter-1'] };
    state.settings.sound = false;
    state.settings.reducedMotion = reducedMotion;
    const context = await browser.newContext({ viewport: { width: 1160, height: 800 } });
    page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('requestfailed', request => report.errors.push(`${request.url()}: ${request.failure()?.errorText}`));
    page.on('request', request => {
      if (new URL(request.url()).origin === url.origin && /\/(?:src\/|@vite\/|@fs\/)/.test(request.url())) {
        report.errors.push(`Unexpected development request: ${request.url()}`);
      }
    });
    const action = (id, dataId) => page.locator(`[data-do="${id}"]${dataId ? `[data-id="${dataId}"]` : ''}`);
    await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    await action('title-settings').first().click();
    await page.locator('#completion-quality').selectOption('economy');
    await action('close').click();
    assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), action('import').first().click()]);
    const fixture = Buffer.from(encodeSave(state));
    await chooser.setFiles({ name: 'reprise-controle.json', mimeType: 'application/json', buffer: fixture });
    await page.locator('#hud:not(.hidden) .location h2').waitFor();
    await page.locator('#transition.active').waitFor({ state: 'hidden' });
    await page.locator('#overlay .screen, #overlay .dialogue').waitFor({ state: 'hidden' });
    await page.keyboard.press('KeyE');
    await page.locator('#battle-ui .tactical-toolbar').waitFor({ timeout: 12000 });
    // Wait without simulating seconds or changing a gauge.
    const firstReady = page.locator('[data-do="battle-actor"].ready').first();
    await firstReady.waitFor({ timeout: 80000 });
    const actorId = await firstReady.getAttribute('data-id');
    await action('battle-actor', actorId).click();
    await action('battle-action', 'shoot').click();
    const target = page.locator('[data-do="battle-target"]:not(:disabled)').first();
    const targetId = await target.getAttribute('data-id');
    const targetById = action('battle-target', targetId);
    const bars = () => targetById.locator('[data-stat="hp"],[data-stat="shield"]').evaluateAll(nodes => nodes.map(node => node.style.width));
    const before = await bars();
    const beforePath = join(output, `${name}-before.png`);
    const beforeBytes = await page.screenshot({ path: beforePath });
    report.captures.push({ name, phase: 'before', path: beforePath, sha256: sha256(beforeBytes) });

    const cdp = await context.newCDPSession(page), frames = [];
    cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
      cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
      frames.push({ time: metadata.timestamp, bytes: Buffer.from(data, 'base64') });
    });
    await cdp.send('Page.startScreencast', { format: 'png', maxWidth: 940, maxHeight: 650, everyNthFrame: 1 });
    // Let the compositor deliver its initial frame before issuing the order.
    for (let step = 0; step < 25 && !frames.length; step++) await page.waitForTimeout(100);
    const clickedAt = Date.now() / 1000;
    await targetById.click({ force: true });
    await page.waitForFunction(({ id, before }) => {
      const bars = [...document.querySelectorAll(`[data-do="battle-target"][data-id="${id}"] [data-stat]`)]
        .filter(node => node.dataset.stat === 'hp' || node.dataset.stat === 'shield').map(node => node.style.width);
      return bars.length === before.length && bars.some((value, index) => parseFloat(value) < parseFloat(before[index]));
    }, { id: targetId, before });
    const after = await bars();
    const log = await page.locator('.combat-log').innerText();
    for (let step = 0; step < 15 && frames.length < 5; step++) await page.waitForTimeout(100);
    await cdp.send('Page.stopScreencast');
    assert.ok(frames.length >= 2, `The compositor produced ${frames.length} frames around the shot.`);
    for (let index = 0; index < frames.length; index++) {
      const { bytes, time } = frames[index], path = join(output, `${name}-frame-${String(index).padStart(3, '0')}.png`);
      await writeFile(path, bytes, { flag: 'wx' });
      report.captures.push({ name, phase: 'screencast', index, time, secondsFromClick: time - clickedAt, path, sha256: sha256(bytes) });
    }
    assert.match(log, /dégâts/);
    report.checks.push({ name, actorId, targetId, before, after, log, frames: frames.length, fixtureSha256: sha256(fixture) });
    await context.close();
  }
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (error) {
  report.failure = error.stack;
  if (page) await page.screenshot({ path: join(output, 'failure.png') }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks, failure: report.failure }));
}
