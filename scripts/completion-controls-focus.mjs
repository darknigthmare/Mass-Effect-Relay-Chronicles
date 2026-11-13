// Diagnostic public court. La seule donnée préparée est une sauvegarde native
// importée par le sélecteur réel ; le journal d’événements ne modifie aucun handler.
import { chromium } from 'playwright';
import { newGame, encodeSave } from '../src/state.js';
import fs from 'node:fs/promises';
const prefix = process.env.COMPLETION_CONTROLS_PREFIX;
if (!/^completion-controls-focus-[0-9]+$/.test(prefix || '')) throw Error('Fresh diagnostic prefix required');
const out = `docs/qa/${prefix}-report.json`; try { await fs.access(out); throw Error('Preserve existing output'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const report = { passed: false, prefix, public: true, fixture: 'newGame sentinel with enlarged text, no earlier route played', events: [], trail: [], errors: [] };
let browser, page;
try {
  browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 }); page.setDefaultTimeout(15000);
  await page.addInitScript(() => { window.__COMPLETION_FOCUS_EVENTS__ = []; document.addEventListener('focusin', e => {
    const a = e.target; window.__COMPLETION_FOCUS_EVENTS__.push({ type: 'focusin', tag: a.tagName, classes: a.className, tabIndex: a.tabIndex,
      action: a.dataset.do, id: a.dataset.id, scrollHeight: a.scrollHeight, clientHeight: a.clientHeight });
  }, true); });
  page.on('pageerror', e => report.errors.push(e.message)); await page.goto(process.env.GAME_URL || 'http://127.0.0.1:4193/', { waitUntil: 'networkidle' }); await page.bringToFront();
  async function active() { return page.evaluate(() => { const a = document.activeElement; return { tag: a.tagName, classes: a.className, tabIndex: a.tabIndex, scrollHeight: a.scrollHeight, clientHeight: a.clientHeight,
    action: a.dataset.do, id: a.dataset.id, field: a.dataset.field, text: a.textContent.slice(0, 60), hasFocus: document.hasFocus(), hidden: document.hidden }; }); }
  async function tabTo(selector) { for (let i = 0; i < 120; i++) { report.trail.push(await active()); if (await page.locator(selector).evaluate(el => el === document.activeElement)) return;
    await page.keyboard.press('Tab'); report.trail.push({ phase: 'after-key', ...await active() }); await page.evaluate(() => new Promise(requestAnimationFrame)); report.trail.push({ phase: 'after-frame', ...await active() }); } throw Error(`Unreachable ${selector}`); }
  async function activate(selector) { await tabTo(selector); await page.keyboard.press('Enter'); }
  const fixture = newGame({ name: 'Diagnostic focus', classId: 'sentinel' }); fixture.flags.briefed = true; fixture.settings.largeText = true; fixture.settings.reducedMotion = true; fixture.settings.sound = false;
  await tabTo('[data-do="import"]'); const chooser = page.waitForEvent('filechooser'); await page.locator('[data-do="import"]').click(); await (await chooser).setFiles({ name: 'focus.json', mimeType: 'application/json', buffer: Buffer.from(encodeSave(fixture)) });
  await page.locator('#hud:not(.hidden) .location h2').waitFor(); await page.locator('#overlay .screen').waitFor({ state: 'hidden' }); await page.locator('#transition.active').waitFor({ state: 'hidden' }); await page.bringToFront(); await page.evaluate(() => new Promise(requestAnimationFrame));
  await page.keyboard.press('Escape'); await activate('.pause-screen [data-do="customization"]');
  await activate('[data-do="custom-tab"][data-id="character"]'); report.phase = 'tab-to-cancel'; await tabTo('[data-do="custom-cancel"]'); report.passed = true;
} catch (error) { report.failure = error.stack; process.exitCode = 1; }
finally { if (page) { report.events = await page.evaluate(() => window.__COMPLETION_FOCUS_EVENTS__); report.html = await page.locator('#overlay').innerHTML(); await page.screenshot({ path: `docs/screenshots/${prefix}.png` }); } await browser?.close(); await fs.writeFile(out, JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify({ passed: report.passed, failure: report.failure, last: report.trail.slice(-10) })); }
