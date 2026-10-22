import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const baseURL = process.env.GAME_URL || 'http://127.0.0.1:4173';
const out = new URL('../test-results/', import.meta.url);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
  args: ['--no-sandbox', '--no-zygote', '--single-process', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [], failed = [];
page.on('pageerror', e => errors.push(e.message));
page.on('requestfailed', r => failed.push(`${r.url()}: ${r.failure()?.errorText}`));
try {
  await page.goto(`${baseURL}/?qa`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: new URL('01-title.png', out).pathname });
  await page.getByRole('button', { name: /Nouvelle campagne/ }).click();
  await page.locator('#commander-name').fill('Shepard');
  await page.locator('#new-difficulty').selectOption('normal');
  await page.getByRole('button', { name: /Commencer l’aventure/ }).click();
  await page.getByRole('button', { name: 'Je rejoins le briefing.' }).click();
  await page.waitForFunction(() => window.__RELAY_TEST__?.getState()?.zone === 'normandy' && !window.__RELAY_TEST__.getUI().busy);
  const start = await page.evaluate(() => window.__RELAY_TEST__.getWorld().getPosition());
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(p => { const q=window.__RELAY_TEST__.getWorld().getPosition(); return Math.hypot(p.x-q.x,p.z-q.z)>.5; }, start, { timeout: 15000 });
  await page.keyboard.up('ArrowUp');
  const moved = await page.evaluate(() => window.__RELAY_TEST__.getWorld().getPosition());
  assert.ok(Math.hypot(start.x - moved.x, start.z - moved.z) > .5, 'Keyboard movement changes world position');
  await page.screenshot({ path: new URL('02-normandy.png', out).pathname });
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('heading', { name: 'Mission en pause' }).count(), 1);
  await page.getByRole('button', { name: 'Reprendre', exact: true }).click();
  await page.evaluate(() => window.__RELAY_TEST__.interact('normandy:briefing'));
  await page.getByRole('button', { name: /Mission comprise/ }).click();
  await page.screenshot({ path: new URL('03-galaxy.png', out).pathname });
  await page.getByRole('button', { name: /Préparer le déploiement/ }).click();
  await page.waitForFunction(() => window.__RELAY_TEST__.getState().zone === 'eden-prime' && !window.__RELAY_TEST__.getUI().busy);
  await page.screenshot({ path: new URL('04-eden.png', out).pathname });
  await page.evaluate(() => window.__RELAY_TEST__.startBattle('eden-prime:encounter-1'));
  // Accelerate simulated time only; damage and action selection still use real game rules.
  await page.evaluate(() => window.__RELAY_TEST__.step(6));
  await page.waitForFunction(() => window.__RELAY_TEST__.getBattle()?.waiting);
  await page.screenshot({ path: new URL('05-combat.png', out).pathname });
  const hpBefore = await page.evaluate(() => window.__RELAY_TEST__.getBattle().actors.filter(a => a.team === 'enemy').map(a => a.hp + a.shield).reduce((a,b)=>a+b,0));
  await page.keyboard.press('Space');
  const hpAfter = await page.evaluate(() => window.__RELAY_TEST__.getBattle().actors.filter(a => a.team === 'enemy').map(a => a.hp + a.shield).reduce((a,b)=>a+b,0));
  assert.ok(hpAfter < hpBefore, 'Real keyboard action damages an enemy');
  await page.keyboard.press('Escape');
  const beforePause = await page.evaluate(() => window.__RELAY_TEST__.getBattle().elapsed);
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => window.__RELAY_TEST__.getBattle().elapsed), beforePause, 'Pause freezes simulation');
  await page.getByRole('button', { name: 'Reprendre', exact: true }).click();
  assert.deepEqual(errors, [], 'No uncaught browser errors');
  assert.deepEqual(failed, [], 'No failed network requests');
  const result = { passed: true, checks: ['title', 'new game', 'keyboard movement', 'pause', 'briefing', 'galaxy navigation', '3D exploration', 'combat ATB', 'keyboard damage', 'combat pause'], errors, failed, snapshot: await page.evaluate(() => window.__RELAY_TEST__.snapshot()) };
  await writeFile(new URL('smoke-report.json', out), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  await page.screenshot({ path: new URL('smoke-failure.png', out).pathname }).catch(()=>{});
  console.error({ errors, failed });
  throw e;
} finally {
  await browser.close();
}
