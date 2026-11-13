// Public, uninstrumented application. Only the declared standard-controller input
// fixture replaces navigator.getGamepads. No application state or handler is injected.
import assert from 'node:assert/strict';
import { readFile, writeFile, access, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { newGame, encodeSave, decodeSave } from '../src/state.js';
import { buyItem } from '../src/loadout.js';
import { recordVisit } from '../src/story.js';
import { getLevelLayout } from '../src/level-layout-data.js';
import { READABILITY_PREVIEW, DISPLAY_PREFERENCES_KEY } from '../src/completion-accessibility.js';

const root = new URL('../', import.meta.url), endpoint = new URL(process.env.GAME_URL || 'http://127.0.0.1:4191/');
const mode = process.env.COMPLETION_CONTROLS_MODE || 'development', prefix = process.env.COMPLETION_CONTROLS_PREFIX;
assert.ok(['development', 'production'].includes(mode)); assert.equal(endpoint.search, '');
assert.match(prefix || '', /^completion-controls-[a-z0-9-]+$/, 'A new immutable attempt prefix is required.');
const reportURL = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(reportURL); throw Error('Preserve the existing attempt; choose another prefix.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { passed: false, at: new Date().toISOString(), mode, url: endpoint.href,
  command: { script: 'node scripts/completion-controls-combat.mjs', environment: { GAME_URL: endpoint.href, COMPLETION_CONTROLS_MODE: mode, COMPLETION_CONTROLS_PREFIX: prefix } },
  scope: 'Short public diagnostic only: declared native Eden save imported by a real pointer click after title reload, focus restored by a public location-heading click, neutral virtual-controller samples, A interaction, one natural ATB order and four viewport sizes. No subtitle/workshop traversal or private test harness.',
  limitations: ['The controller is virtual through navigator.getGamepads. Physical controller hardware, rumble and operating-system chooser navigation are not tested.',
    'The subtitle passage is an explicitly labelled display example, not additional canon dialogue or a campaign choice.',
    'Native save fixtures grant an owned omni-tool and prepare the first Eden encounter. Earlier progression is not played.',
    'Viewport sizes are software emulations. No physical-phone compatibility, benchmark, measured FPS improvement or entire-campaign completion is claimed.'],
  sourceHashes: {}, fixtures: [], captures: [], exports: [], checks: [], layouts: [], focusChecks: [], hints: [],
  inputs: { keyboardTab: 0, keyboardOther: [], gamepadPresses: [], fixturePublicClicks: [] }, errors: [], failedRequests: [], consoleErrors: [], resourceWarnings: [],
  sourceRequests: [], servedFiles: [], distFiles: {}, evidenceErrors: [] };
let browser, page; const responseWork = [];
async function tree(directory, prefix = '') { const result = {}; for (const item of await readdir(directory, { withFileTypes: true })) {
  const name = prefix + item.name, target = new URL(item.name + (item.isDirectory() ? '/' : ''), directory);
  if (item.isDirectory()) Object.assign(result, await tree(target, name + '/'));
  else { const bytes = await readFile(target); result[name] = { bytes: bytes.length, sha256: sha(bytes) }; }
} return result; }
const check = (name, details = {}) => { report.checks.push({ name, passed: true, ...details }); console.log(JSON.stringify({ check: name })); };
async function capture(label) {
  const path = `docs/screenshots/${prefix}-${label}.png`, bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)), animations: 'disabled' });
  report.captures.push({ label, path, sha256: sha(bytes), bytes: bytes.length, source: 'Actual public viewport; no injected CSS, DOM, scene or pixels.' });
}
async function device(change, polls = 2) {
  const previous = await page.evaluate(change => { const input = window.__COMPLETION_DEVICE__; Object.assign(input, change); return input.polls; }, change);
  if (polls) await page.waitForFunction(({ previous, polls }) => window.__COMPLETION_DEVICE__.polls >= previous + polls, { previous, polls });
}
async function pad(button) {
  await device({ connected: true, buttons: [], tapButtons: null, axes: [0, 0, 0, 0] });
  // A declared tap is visible to exactly one Gamepad API sample. A slow WebGL
  // frame must not turn automation latency into a held/repeated direction.
  report.inputs.gamepadPresses.push(button); await device({ tapButtons: [button] }, 1); await device({ buttons: [] });
}
async function key(code) { report.inputs.keyboardOther.push(code); await page.keyboard.press(code); }
async function tabTo(selector) {
  const target = page.locator(selector).first(); await target.waitFor({ state: 'visible' });
  const trail = [];
  for (let i = 0; i < 280; i++) {
    if (await target.evaluate(element => element === document.activeElement)) return target;
    trail.push(await page.evaluate(() => { const element = document.activeElement; return { tag: element.tagName, id: element.id, action: element.dataset.do,
      item: element.dataset.id, field: element.dataset.field, text: element.textContent?.trim().slice(0, 100) }; }));
    report.inputs.keyboardTab++; await page.keyboard.press('Tab');
  }
  report.unreachableControl = { selector, trail, html: await page.locator('#overlay').innerHTML() };
  throw Error(`Unreachable by native Tab: ${selector}`);
}
async function activate(selector, method = 'keyboard') { await tabTo(selector); if (method === 'pad') await pad(0); else await key('Enter'); }
async function ready() {
  await page.locator('#hud:not(.hidden) .location h2').waitFor();
  await page.locator('#transition.active').waitFor({ state: 'hidden' });
  await page.locator('#overlay .dialogue, #overlay .screen').waitFor({ state: 'hidden' });
}
async function focusCheck(label, selector = null) {
  const observed = await page.evaluate(() => {
    const active = document.activeElement, r = active.getBoundingClientRect(), style = getComputedStyle(active);
    const x = Math.max(0, Math.min(innerWidth - 1, r.x + r.width / 2)), y = Math.max(0, Math.min(innerHeight - 1, r.y + r.height / 2)), hit = document.elementFromPoint(x, y);
    return { id: active.id || null, action: active.dataset.do || null, disabled: active.disabled === true,
      visible: r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth,
      centerUnobscured: !!hit && (active === hit || active.contains(hit)), marked: active.hasAttribute('data-gamepad-focus'),
      outlineWidth: parseFloat(style.outlineWidth), outlineColor: style.outlineColor, text: active.textContent?.trim().slice(0, 180) || active.getAttribute('aria-label') };
  });
  assert.equal(observed.disabled, false); assert.equal(observed.visible, true); assert.equal(observed.centerUnobscured, true);
  assert.ok(observed.marked || observed.outlineWidth >= 2, `Visible focus: ${JSON.stringify(observed)}`);
  if (selector) assert.equal(await page.locator(selector).first().evaluate(element => element === document.activeElement), true);
  report.focusChecks.push({ label, ...observed }); return observed;
}
async function geometry(label, selectors = ['.screen']) {
  const observed = await page.evaluate(selectors => ({ viewport: { width: innerWidth, height: innerHeight }, documentWidth: document.documentElement.scrollWidth,
    largeText: document.body.classList.contains('large-text'), containers: selectors.flatMap(selector => [...document.querySelectorAll(selector)].map(element => ({ selector,
      clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, clientHeight: element.clientHeight, scrollHeight: element.scrollHeight,
      top: element.getBoundingClientRect().top, bottom: element.getBoundingClientRect().bottom }))),
    canvas: [...document.querySelectorAll('#world canvas')].map(element => ({ bufferWidth: element.width, bufferHeight: element.height,
      cssWidth: element.getBoundingClientRect().width, cssHeight: element.getBoundingClientRect().height })) }), selectors);
  assert.ok(observed.documentWidth <= observed.viewport.width + 1, `${label}: document horizontal overflow`);
  for (const box of observed.containers) { assert.ok(box.scrollWidth <= box.clientWidth + 2, `${label}: horizontal overflow in ${box.selector}`); assert.ok(box.clientHeight > 0); }
  for (const canvas of observed.canvas) {
    assert.equal(canvas.cssWidth, observed.viewport.width); assert.equal(canvas.cssHeight, observed.viewport.height);
    assert.ok(Math.abs(canvas.bufferWidth / canvas.bufferHeight - canvas.cssWidth / canvas.cssHeight) < .01, 'Canvas keeps the viewport aspect ratio');
  }
  report.layouts.push({ label, ...observed }); return observed;
}
async function exportPublic(label) {
  if (!await page.locator('.pause-screen').isVisible()) await key('Escape');
  await tabTo('.pause-screen [data-do="export"]'); const download = page.waitForEvent('download'); await key('Enter');
  const bytes = await readFile(await (await download).path()), state = decodeSave(bytes.toString('utf8')); assert.ok(state);
  const path = `docs/qa/${prefix}-${label}-export.json`; await writeFile(new URL(path, root), bytes, { flag: 'wx' });
  report.exports.push({ label, path, sha256: sha(bytes), bytes: bytes.length, nativeDecodePassed: true, source: 'Actual public native save download.' }); return state;
}
async function importFixture(fixture, label, origin) {
  const bytes = encodeSave(fixture); assert.ok(decodeSave(bytes)); const path = `docs/qa/${prefix}-${label}-fixture.json`;
  await writeFile(new URL(path, root), bytes, { flag: 'wx' });
  const record = { path, sha256: sha(bytes), origin, importedViaPublicChooser: false }; report.fixtures.push(record);
  await tabTo('[data-do="import"]'); const promise = page.waitForEvent('filechooser');
  report.inputs.fixturePublicClicks.push('[data-do="import"]'); await page.locator('[data-do="import"]').click();
  await (await promise).setFiles({ name: `${label}.json`, mimeType: 'application/json', buffer: Buffer.from(bytes) });
  record.importedViaPublicChooser = true; record.importActivation = 'Actual public pointer click after Tab, solely to prepare the declared native fixture. No OS chooser keyboard/controller certification.';
  await ready(); await page.bringToFront();
  await page.waitForFunction(() => document.hasFocus() && document.visibilityState === 'visible');
  report.inputs.fixturePublicClicks.push('#hud [data-do="pause"]'); await page.locator('#hud [data-do="pause"]').click();
  report.inputs.fixturePublicClicks.push('.pause-screen [data-do="close"]'); await page.locator('.pause-screen [data-do="close"]').click(); await ready();
  await device({ connected: true, buttons: [], tapButtons: null, axes: [0, 0, 0, 0] }, 8);
}
async function settings() { if (!await page.locator('.pause-screen').isVisible()) await key('Escape'); await activate('.pause-screen [data-do="settings"]'); }
async function hint(method) {
  await page.waitForFunction(expected => document.querySelector('.gamepad-command-hint')?.textContent.startsWith(expected), method === 'gamepad' ? 'Manette' : 'Clavier');
  const text = await page.locator('.gamepad-command-hint').innerText();
  assert.ok(text.startsWith(method === 'gamepad' ? 'Manette' : 'Clavier'), `Input hint follows ${method}: ${text}`);
  report.hints.push({ method, text });
}
async function setCheckbox(selector, wanted, method = 'keyboard') {
  if (await page.locator(selector).isChecked() !== wanted) { await tabTo(selector); if (method === 'pad') await pad(0); else await key('Space'); }
  assert.equal(await page.locator(selector).isChecked(), wanted);
}
async function subtitle(label, index, method, takeTop = false) {
  await activate('[data-completion-preview]', method); await page.locator('.dialogue[data-readability-preview="true"]').waitFor();
  const text = await page.locator('.dialogue-text').innerText(); assert.equal(text, READABILITY_PREVIEW.text); assert.equal(await page.locator('.dialogue .choice').count(), 6);
  await tabTo(`.dialogue .choice:nth-child(${index + 1})`);
  if (takeTop) {
    await key('Home'); await page.waitForFunction(() => [...document.querySelectorAll('.dialogue,.dialogue-body')].every(element => element.scrollTop === 0)); await capture(`${label}-top`);
    await key('PageDown'); const reading = await page.locator('.dialogue,.dialogue-body').evaluateAll(elements => elements.map(element => ({
      pane: element.className, scrollTop: element.scrollTop, clientHeight: element.clientHeight, scrollHeight: element.scrollHeight })));
    assert.ok(reading.some(pane => pane.scrollTop > 0), 'PageDown scrolls the actual top-dialogue reading pane');
    report.layouts.push({ label: `${label}-reading`, panes: reading });
    await key('End'); await page.keyboard.press('Shift+Tab'); await tabTo(`.dialogue .choice:nth-child(${index + 1})`);
  }
  await focusCheck(label); await geometry(label, ['.dialogue', '.dialogue-body', '.dialogue-choices']);
  if (index === 5) await capture(`${label}-last-choice`);
  if (method === 'pad') { await pad(1); assert.equal(await page.locator('.dialogue[data-readability-preview]').isVisible(), true); await pad(0); }
  else await key('Enter');
  await page.locator('[data-completion-preview]').waitFor();
}

try {
  for (const filename of ['src/completion-accessibility.js', 'src/completion-accessibility.css', 'src/gamepad-controls.js', 'src/gamepad-controls.css',
    'src/main.js', 'src/world.js', 'src/state.js', 'src/style.css', 'src/audio.js', 'src/customization.js', 'src/customization-ui.js', 'src/customization-ui.css',
    'scripts/completion-controls-combat.mjs', 'tests/completion-controls.test.js']) report.sourceHashes[filename] = sha(await readFile(new URL(filename, root)));
  const collector = await readFile(new URL('scripts/completion-controls-combat.mjs', root)), path = `docs/qa/${prefix}-collector.mjs`;
  await writeFile(new URL(path, root), collector, { flag: 'wx' }); report.collectorSnapshot = { path, sha256: sha(collector) };
  if (mode === 'production') report.distFiles = await tree(new URL('dist/', root));
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  report.chromium = browser.version(); page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 }); page.setDefaultTimeout(15000);
  await page.addInitScript(() => {
    window.__COMPLETION_FOCUS_LOG__ = []; for (const type of ['focus','blur']) window.addEventListener(type, () => window.__COMPLETION_FOCUS_LOG__.push({type,time:performance.now(),focused:document.hasFocus(),hidden:document.hidden}));
    window.__COMPLETION_DEVICE__ = { connected: true, buttons: [], tapButtons: null, axes: [0, 0, 0, 0], polls: 0 };
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value() {
      const input = window.__COMPLETION_DEVICE__; input.polls++; const buttons = input.tapButtons || input.buttons; input.tapButtons = null;
      return input.connected ? [{ index: 0, id: 'Declared automated standard controller', mapping: 'standard', connected: true, timestamp: performance.now(), axes: input.axes,
        buttons: Array.from({ length: 18 }, (_, index) => ({ pressed: buttons.includes(index), touched: buttons.includes(index), value: buttons.includes(index) ? 1 : 0 })) }] : [];
    } });
  });
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') { const value = { text: message.text(), location: message.location() };
    if (value.location.url === new URL('favicon.ico', endpoint).href && value.text.includes('404')) report.resourceWarnings.push(value); else report.consoleErrors.push(value); } });
  page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('request', request => { const url = new URL(request.url()); if (url.origin === endpoint.origin && /\/(?:src\/|@vite\/)/.test(url.pathname)) report.sourceRequests.push(url.pathname); });
  page.on('response', response => {
    const url = new URL(response.url()); if (response.status() >= 400 && url.pathname !== '/favicon.ico') report.failedRequests.push(`${response.status()} ${response.url()}`);
    if (mode !== 'production' || response.status() !== 200 || url.origin !== endpoint.origin) return;
    const path = decodeURIComponent(url.pathname.replace(/^\//, '') || 'index.html'), expected = report.distFiles[path];
    if (expected) responseWork.push((async () => { try { const bytes = await response.body(); assert.equal(sha(bytes), expected.sha256, path); report.servedFiles.push({ path, bytes: bytes.length, sha256: sha(bytes) }); }
      catch (error) { report.evidenceErrors.push(`${path}: ${error.message}`); } })());
  });
  await page.goto(endpoint.href, { waitUntil: 'networkidle' }); assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  await page.reload({ waitUntil: 'networkidle' });
  const eden = newGame({ name: 'QA alertes muettes', difficulty: 'story', mode: 'wait' }); eden.flags.briefed = true; eden.zone = 'eden-prime'; recordVisit(eden, eden.zone);
  eden.settings.sound = false; eden.settings.reducedMotion = true; eden.position = { ...getLevelLayout('eden-prime').pois['encounter-1'] };
  await importFixture(eden, 'eden', 'Native newGame, briefing flag and position at first legal Eden encounter; muted and reduced-effects campaign preferences. No earlier route or victory claimed.');
  await pad(0); await page.locator('#battle-ui .battle-member').first().waitFor();
  await page.locator('[data-do="battle-action"][data-id="shoot"]:not(:disabled)').waitFor();
  await activate('[data-do="battle-action"][data-id="shoot"]:not(:disabled)', 'pad');
  const beforeLog = await page.locator('.combat-log').innerText(); const actor = await page.locator('#battle-ui .battle-member.active').getAttribute('id');
  const beforeATB = Number((await page.locator(`#${actor} [data-stat="atb"]`).getAttribute('style')).match(/width:\s*([\d.]+)/)?.[1]);
  await activate('[data-do="battle-target"]:not(:disabled)', 'pad');
  await page.waitForFunction(previous => document.querySelector('.combat-log').innerText !== previous, beforeLog);
  const afterLog = await page.locator('.combat-log').innerText(); assert.ok(afterLog.trim());
  const afterATB = Number((await page.locator(`#${actor} [data-stat="atb"]`).getAttribute('style')).match(/width:\s*([\d.]+)/)?.[1]);
  assert.ok(beforeATB >= 99 && afterATB < 70); report.publicOrder = { actor, action: 'shoot', beforeATB, afterATB, beforeLog, afterLog,
    source: 'Actual public action/target, naturally ready ATB; muted and reduced effects. Text log and HP/shield/ATB remain the event cues.' };
  for (const viewport of [{ name: 'combat-1080', width: 1920, height: 1080 }, { name: 'combat-720', width: 1280, height: 720 }, { name: 'combat-1440', width: 2560, height: 1440 }, { name: 'combat-mobile', width: 390, height: 844 }]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height }); await tabTo('[data-do="battle-target"]:not(:disabled)'); await focusCheck(viewport.name);
    await geometry(viewport.name, ['#battle-ui', '.battle-shell', '.target-list']); await capture(viewport.name);
    await key('Escape'); await page.locator('.pause-screen').waitFor(); await tabTo('[data-do="close"]'); await focusCheck(`${viewport.name}-pause`); await capture(`${viewport.name}-pause`);
    await key('Enter'); await page.locator('.pause-screen').waitFor({ state: 'hidden' });
  }
  check('Diagnostic court : entrée A après focus public et neutres, ordre naturel, cibles/pause et combat muet/réduit aux quatre tailles');

  await Promise.all(responseWork); assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []); assert.deepEqual(report.consoleErrors, []); assert.deepEqual(report.evidenceErrors, []);
  if (mode === 'production') { assert.deepEqual(report.sourceRequests, []); assert.deepEqual(await tree(new URL('dist/', root)), report.distFiles); }
  for (const [filename, expected] of Object.entries(report.sourceHashes)) assert.equal(sha(await readFile(new URL(filename, root))), expected, `Changed source: ${filename}`);
  report.sourceFrozen = true; report.distFrozen = mode === 'production'; report.passed = true;
} catch (error) { report.failure = error.stack || String(error); process.exitCode = 1; if (page) try { await capture('failure'); } catch {} }
finally { if (page) try { report.focusDiagnostic = await page.evaluate(() => ({ events:window.__COMPLETION_FOCUS_LOG__,focused:document.hasFocus(),hidden:document.hidden,inputMethod:document.documentElement.dataset.inputMethod,device:window.__COMPLETION_DEVICE__,hud:document.querySelector('#hud')?.innerText,battle:document.querySelector('#battle-ui')?.innerText })); } catch {} await Promise.allSettled(responseWork); await browser?.close(); await writeFile(reportURL, JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, captures: report.captures.length, failure: report.failure })); }
