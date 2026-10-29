import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { newGame, encodeSave, decodeSave } from '../src/state.js';
import { buyItem } from '../src/loadout.js';

// Only observations use the DEV harness. Import, workshop changes, focus
// transitions and cancellation use the game controls and real keyboard events.
const root = new URL('../', import.meta.url), out = new URL('../test-results/', import.meta.url);
const entry = new URL(process.env.GAME_URL || 'http://127.0.0.1:4193');
entry.searchParams.set('qa', '');
const prefix = process.env.CUSTOMIZATION_REPORT_PREFIX || 'customization-keyboard';
assert.match(prefix, /^[a-z0-9][a-z0-9-]*$/);
await mkdir(out, { recursive: true });
const hash = value => createHash('sha256').update(value).digest('hex');
const sources = ['src/main.js', 'src/customization-ui.js', 'src/customization-ui.css', 'scripts/customization-keyboard-browser.mjs'];
const report = {
  at: new Date().toISOString(), passed: false, url: entry.href, buildKind: 'vite-development',
  sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: fileURLToPath(root), encoding: 'utf8' }).trim(),
  sourceHashes: Object.fromEntries(await Promise.all(sources.map(async path => [path, hash(await readFile(new URL(path, root)))]))),
  scope: 'Keyboard navigation inside the actual customization workshop after opening it: prepare/remove/reset/filter, Space/Enter, Tab/Shift-Tab containment, visible fallback focus and Escape cancellation. Explicit save fixtures imported through the file chooser. Desktop and emulated mobile with enlarged text; no physical-device, production-build or gamepad claim.',
  checks: [], errors: [], failedRequests: [], screenshots: [], startup: [], layouts: [],
  tools: { node: process.version, playwright: JSON.parse(await readFile(new URL('node_modules/playwright/package.json', root), 'utf8')).version },
};
const action = (name, id) => `[data-do="${name}"]${id === undefined ? '' : `[data-id="${id}"]`}`;
const observe = page => page.evaluate(() => ({
  state: structuredClone(window.__RELAY_TEST__.getState()),
  draft: structuredClone(window.__RELAY_TEST__.getUI().customizationDraft),
}));
async function focusInfo(page) {
  return page.evaluate(() => {
    const element = document.activeElement, rect = element.getBoundingClientRect();
    let left = Math.max(0, rect.left), right = Math.min(innerWidth, rect.right);
    let top = Math.max(0, rect.top), bottom = Math.min(innerHeight, rect.bottom);
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent), box = parent.getBoundingClientRect();
      if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) { left = Math.max(left, box.left); right = Math.min(right, box.right); }
      if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) { top = Math.max(top, box.top); bottom = Math.min(bottom, box.bottom); }
    }
    return { action: element.dataset.do || null, id: element.dataset.id ?? null, htmlId: element.id || null,
      inside: !!element.closest('.customization-screen'), visible: right > left && bottom > top,
      visibleFraction: rect.width && rect.height ? Math.max(0, right - left) * Math.max(0, bottom - top) / (rect.width * rect.height) : 0 };
  });
}
async function expectFocus(page, selector, visible = true) {
  assert.equal(await page.evaluate(selector => document.activeElement.matches(selector), selector), true, `focus should stay on ${selector}`);
  const info = await focusInfo(page);
  assert.equal(info.inside, true);
  if (visible) assert.ok(info.visibleFraction > .95, `focused control must remain visible: ${JSON.stringify(info)}`);
  return info;
}
async function tabTo(page, selector) {
  assert.equal(await page.locator(selector).count(), 1, `unique keyboard target: ${selector}`);
  for (let steps = 0; steps < 160; steps++) {
    if (await page.evaluate(selector => document.activeElement.matches(selector), selector)) return;
    await page.keyboard.press('Tab');
    assert.equal((await focusInfo(page)).inside, true, `Tab cannot escape while finding ${selector}`);
  }
  throw new Error(`Keyboard target was unreachable: ${selector}`);
}
function record(layout, name, details = {}) {
  const check = { layout, name, passed: true, ...details }; report.checks.push(check); console.log(JSON.stringify(check));
}
const browser = await chromium.launch({
  headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/tmp/chromium',
  args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
report.tools.chromium = browser.version();
let activePage;
try {
  for (const layout of [
    { name: 'desktop', viewport: { width: 1440, height: 1000 }, largeText: false },
    { name: 'mobile-large-text', viewport: { width: 390, height: 844 }, largeText: true },
  ]) {
    const page = activePage = await browser.newPage({ viewport: layout.viewport }); page.setDefaultTimeout(45000);
    page.on('pageerror', error => { const entry = { layout: layout.name, message: error.message }; report.errors.push(entry); console.error(JSON.stringify({ pageError: entry })); });
    page.on('requestfailed', request => report.failedRequests.push({ layout: layout.name, url: request.url(), error: request.failure()?.errorText }));
    page.on('response', response => { if (response.status() >= 400) report.failedRequests.push({ layout: layout.name, status: response.status(), url: response.url() }); });
    const fixture = newGame({ name: `QA clavier ${layout.name}`, classId: 'sentinel' });
    fixture.credits = 1000; fixture.settings.sound = false; fixture.settings.reducedMotion = true; fixture.settings.largeText = layout.largeText;
    assert.equal(buyItem(fixture, 'omni-tool-upgraded').ok, true);
    const encoded = encodeSave(fixture); assert.deepEqual(decodeSave(encoded), fixture);
    await page.goto(entry.href, { waitUntil: 'networkidle' });
    const bootSnapshot = () => page.evaluate(() => ({
      url: location.href, readyState: document.readyState, hasHarness: !!window.__RELAY_TEST__?.getUI,
      title: document.title, overlay: document.querySelector('#overlay')?.innerText.slice(0, 2000) || '',
      entryModules: [...document.querySelectorAll('script[type="module"][src]')].map(script => script.getAttribute('src')),
      canvases: [...document.querySelectorAll('#world canvas')].map(canvas => ({ width: canvas.width, height: canvas.height })),
    }));
    report.startup.push({ layout: layout.name, phase: 'after-navigation', ...await bootSnapshot() });
    console.log(JSON.stringify({ startup: report.startup.at(-1) }));
    try { await page.waitForFunction(() => !!window.__RELAY_TEST__?.getUI); }
    catch (error) {
      report.startup.push({ layout: layout.name, phase: 'harness-timeout', ...await bootSnapshot() });
      console.error(JSON.stringify({ startupFailure: report.startup.at(-1), errors: report.errors, failedRequests: report.failedRequests }));
      throw error;
    }
    const chooser = page.waitForEvent('filechooser'); await page.locator(action('import')).click();
    await (await chooser).setFiles({ name: `${prefix}-${layout.name}.json`, mimeType: 'application/json', buffer: Buffer.from(encoded) });
    await page.waitForFunction(name => window.__RELAY_TEST__.getState()?.name === name && !window.__RELAY_TEST__.getUI().busy, fixture.name);
    await page.locator(action('pause')).click(); await page.locator(action('customization')).click();
    await page.waitForFunction(() => document.activeElement?.matches('[data-do="custom-tab"][data-id="character"]'));
    const initial = await observe(page), saved = await page.evaluate(() => localStorage.getItem('relay-chronicles.save.v1'));
    await page.keyboard.press('Shift+Tab'); await expectFocus(page, action('close'));
    await page.keyboard.press('Shift+Tab'); await expectFocus(page, action('custom-apply'));
    await page.keyboard.press('Tab'); await expectFocus(page, action('close'));
    record(layout.name, 'Tab and Shift-Tab wrap inside the workshop');

    await tabTo(page, action('custom-tab', 'weapons')); await page.keyboard.press('Enter');
    await tabTo(page, action('custom-slot', 'omniTool')); await page.keyboard.press('Enter');
    await tabTo(page, action('custom-equip', 'omni-tool-upgraded')); await page.keyboard.press('Enter');
    await expectFocus(page, action('custom-inspect', 'omni-tool-upgraded'));
    assert.equal((await observe(page)).draft.equipment.omniTool, 'omni-tool-upgraded');
    record(layout.name, 'Preparing an object keeps focus on its inspection control');

    await tabTo(page, `${action('custom-equip', '')}[data-slot="omniTool"]`); await page.keyboard.press('Enter');
    const afterRemove = await expectFocus(page, action('custom-slot', 'omniTool'));
    assert.equal((await observe(page)).draft.equipment.omniTool, null);
    await page.keyboard.press('Tab'); await expectFocus(page, action('custom-slot', 'bioticAmp'));
    record(layout.name, 'Removing an object focuses the emptied slot and Tab advances to the next slot', { focus: afterRemove });

    await tabTo(page, action('custom-reset')); await page.keyboard.press('Enter');
    const afterReset = await expectFocus(page, action('custom-compare'));
    assert.deepEqual((await observe(page)).draft, initial.draft);
    assert.equal(await page.locator(action('custom-reset')).isDisabled(), true);
    await page.keyboard.press('Tab'); await expectFocus(page, action('custom-cancel'));
    record(layout.name, 'Reset focuses the adjacent enabled footer control and Tab skips the disabled reset button', { focus: afterReset });

    await tabTo(page, action('custom-slot', 'weapon')); await page.keyboard.press('Enter');
    await tabTo(page, '#custom-weapon-filter');
    await page.keyboard.press('ArrowDown');
    await page.waitForFunction(() => window.__RELAY_TEST__.getUI().customWeaponFilter !== 'all');
    const filterFocus = await expectFocus(page, '#custom-weapon-filter');
    const filter = await page.locator('#custom-weapon-filter').inputValue();
    await page.keyboard.press('Tab'); await expectFocus(page, action('custom-show-all'));
    assert.deepEqual((await observe(page)).draft, initial.draft);
    record(layout.name, 'Changing the weapon category by keyboard preserves select focus and navigation', { filter, focus: filterFocus });

    await tabTo(page, action('custom-pose', 'aim')); await page.keyboard.press('Space');
    await expectFocus(page, action('custom-pose', 'aim'));
    assert.equal(await page.locator(action('custom-pose', 'aim')).getAttribute('aria-pressed'), 'true');
    assert.deepEqual((await observe(page)).draft, initial.draft);
    const geometry = await page.evaluate(() => {
      const screen = document.querySelector('.customization-screen'), group = document.querySelector('.custom-pose-controls');
      return { viewport: { width: innerWidth, height: innerHeight }, largeText: document.body.classList.contains('large-text'),
        documentWidth: document.documentElement.scrollWidth, screenWidth: screen.clientWidth, screenContentWidth: screen.scrollWidth,
        groupWidth: group.clientWidth, groupContentWidth: group.scrollWidth,
        buttons: [...group.querySelectorAll('button')].map(button => ({ id: button.dataset.id, label: button.innerText,
          width: button.clientWidth, contentWidth: button.scrollWidth, height: button.clientHeight, contentHeight: button.scrollHeight,
          targetHeight: button.getBoundingClientRect().height })) };
    });
    assert.ok(geometry.documentWidth <= geometry.viewport.width + 1);
    assert.ok(geometry.screenContentWidth <= geometry.screenWidth + 1);
    assert.ok(geometry.groupContentWidth <= geometry.groupWidth + 1);
    assert.equal(geometry.buttons.length, 5);
    assert.ok(geometry.buttons.every(button => button.label.trim() && button.contentWidth <= button.width + 1
      && button.contentHeight <= button.height + 1 && button.targetHeight >= 34), 'pose labels and touch targets must fit their controls');
    report.layouts.push({ name: layout.name, ...geometry });
    const screenshot = `${prefix}-${layout.name}.png`;
    await page.screenshot({ path: fileURLToPath(new URL(screenshot, out)) }); report.screenshots.push(screenshot);
    record(layout.name, 'Space selects a pose without changing the draft; its focused control is visible and all pose labels fit without horizontal overflow', { geometry });

    assert.deepEqual((await observe(page)).state, initial.state);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__RELAY_TEST__.getUI().screen === 'pause'
      && document.activeElement?.matches('[data-do="customization"]'));
    assert.deepEqual((await observe(page)).state, initial.state);
    assert.equal(await page.evaluate(() => localStorage.getItem('relay-chronicles.save.v1')), saved);
    record(layout.name, 'Escape restores opener focus and preserves campaign and saved data');
    await page.close(); activePage = null;
  }
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []); report.passed = true;
} catch (error) {
  report.failure = error.stack || String(error); console.error(report.failure); process.exitCode = 1;
  // Persist diagnostics before a screenshot/close can be delayed by host pressure.
  await writeFile(new URL(`${prefix}-report.json`, out), `${JSON.stringify(report, null, 2)}\n`);
  if (activePage) await activePage.screenshot({ path: fileURLToPath(new URL(`${prefix}-failure.png`, out)), timeout: 15000 }).catch(() => {});
} finally {
  await browser.close();
  report.finishedAt = new Date().toISOString();
  await writeFile(new URL(`${prefix}-report.json`, out), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, report: `test-results/${prefix}-report.json` }));
}
