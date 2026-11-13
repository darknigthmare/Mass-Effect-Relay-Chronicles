// Public app journey. navigator.getGamepads is replaced only by this test's
// declared device fixture. Campaign state and application handlers are untouched.
import assert from 'node:assert/strict';
import { readFile, writeFile, access, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { newGame, encodeSave, decodeSave } from '../src/state.js';
import { recordVisit } from '../src/story.js';
import { getLevelLayout } from '../src/level-layout-data.js';

const root = new URL('../', import.meta.url), endpoint = new URL(process.env.GAME_URL || 'http://127.0.0.1:4191/');
const mode = process.env.PRIORITY_CONTROLS_MODE || 'development', prefix = process.env.PRIORITY_CONTROLS_PREFIX;
assert.ok(['development', 'production'].includes(mode)); assert.equal(endpoint.search, '');
assert.match(prefix || '', /^priority-controls-[a-z0-9-]+$/, 'Choose a new attempt prefix.');
const reportURL = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(reportURL); throw Error('Keep the existing report and choose a fresh prefix.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { passed: false, at: new Date().toISOString(), mode, url: endpoint.href,
  command: { script: 'node scripts/priority-controls-browser.mjs', environment: { GAME_URL: endpoint.href, PRIORITY_CONTROLS_MODE: mode, PRIORITY_CONTROLS_PREFIX: prefix } },
  scope: 'Actual public new-game/dialogue/settings/export/movement and one first-Eden combat order through real Tab navigation and a declared mock standard Gamepad API. No private campaign input or application handler is injected.',
  sourceHashes: {}, fixtures: [], captures: [], exports: [], checks: [], inputs: { keyboardTab: 0, keyboardOther: [], gamepadPresses: [] },
  errors: [], failedRequests: [], consoleErrors: [], resourceWarnings: [], sourceRequests: [], servedFiles: [], evidenceErrors: [], distFiles: {},
  limitations: ['The hardware device is simulated through navigator.getGamepads; no physical controller, rumble, platform driver or native file chooser navigation is certified.',
    'Tab is used to reach specific controls and gamepad A activates them; selected D-pad/analog/shoulder paths are tested explicitly. This is not a claim that every screen was traversed by controller alone.',
    'The combat fixture prepares the ME1 briefing and places the party at the first existing Eden encounter through an actual save import. The earlier route is not played.',
    'Only one public battle order and pause are checked; no full battle or campaign victory is claimed. Software-rendered viewport captures are not physical-device performance measurements.'] };
let browser, page; const responseWork = [];
async function tree(directory, prefix = '') {
  const result = {}; for (const item of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + item.name, target = new URL(item.name + (item.isDirectory() ? '/' : ''), directory);
    if (item.isDirectory()) Object.assign(result, await tree(target, name + '/'));
    else { const bytes = await readFile(target); result[name] = { bytes: bytes.length, sha256: sha(bytes) }; }
  } return result;
}
async function capture(label) {
  const path = `docs/screenshots/${prefix}-${label}.png`, bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)), animations: 'disabled' });
  report.captures.push({ label, path, sha256: sha(bytes), bytes: bytes.length, source: 'Actual public viewport; no CSS, scene or image injection.' });
}
const check = name => { report.checks.push({ name, passed: true }); console.log(JSON.stringify({ check: name })); };
async function device(change, polls = 2) {
  const previous = await page.evaluate(change => { const input = window.__PRIORITY_DEVICE__; Object.assign(input, change); return input.polls; }, change);
  if (polls) await page.waitForFunction(({ previous, polls }) => window.__PRIORITY_DEVICE__.polls >= previous + polls, { previous, polls });
}
async function press(button) {
  await device({ connected: true, buttons: [], axes: [0, 0, 0, 0] });
  report.inputs.gamepadPresses.push(button); await device({ buttons: [button] }, 1); await device({ buttons: [] });
}
async function key(code) { report.inputs.keyboardOther.push(code); await page.keyboard.press(code); }
async function tabTo(selector) {
  const target = page.locator(selector).first(); await target.waitFor({ state: 'visible' });
  for (let i = 0; i < 200; i++) {
    if (await target.evaluate(element => element === document.activeElement)) return target;
    report.inputs.keyboardTab++; await page.keyboard.press('Tab');
  }
  throw Error(`Could not reach ${selector} with native Tab navigation.`);
}
async function activate(selector) { await tabTo(selector); await press(0); }
async function ready() {
  await page.locator('#hud:not(.hidden) .location h2').waitFor();
  await page.locator('#transition.active').waitFor({ state: 'hidden' });
  await page.locator('#overlay .dialogue, #overlay .screen').waitFor({ state: 'hidden' });
}
async function exportPublic(label, viaKeyboard = false) {
  if (!await page.locator('.pause-screen [data-do="export"]').isVisible()) { if (viaKeyboard) await key('Escape'); else await press(9); }
  const button = await tabTo('.pause-screen [data-do="export"]'); assert.equal(await button.isEnabled(), true);
  const download = page.waitForEvent('download'); if (viaKeyboard) await key('Enter'); else await press(0);
  const bytes = await readFile(await (await download).path()), state = decodeSave(bytes.toString('utf8')); assert.ok(state);
  const path = `docs/qa/${prefix}-${label}-export.json`; await writeFile(new URL(path, root), bytes);
  report.exports.push({ label, path, sha256: sha(bytes), bytes: bytes.length, position: state.position, name: state.name, nativeDecodePassed: true, source: 'Actual public downloaded save.' });
  return state;
}

try {
  for (const filename of ['src/gamepad-controls.js', 'src/gamepad-controls.css', 'src/main.js', 'src/world.js', 'src/state.js', 'src/game-data.js', 'src/simulation-clock.js', 'src/save-slots.js', 'src/customization-ui.js', 'scripts/priority-controls-browser.mjs']) report.sourceHashes[filename] = sha(await readFile(new URL(filename, root)));
  const collectorBytes = await readFile(new URL('scripts/priority-controls-browser.mjs', root)), collectorPath = `docs/qa/${prefix}-collector.mjs`;
  await writeFile(new URL(collectorPath, root), collectorBytes, { flag: 'wx' });
  report.collectorSnapshot = { path: collectorPath, sha256: sha(collectorBytes), source: 'Exact executed collector bytes, preserved before browser launch.' };
  if (mode === 'production') report.distFiles = await tree(new URL('dist/', root));
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  report.chromium = browser.version(); page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 }); page.setDefaultTimeout(45000);
  await page.addInitScript(() => {
    window.__PRIORITY_DEVICE__ = { connected: true, buttons: [], axes: [0, 0, 0, 0], polls: 0 };
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value() {
      const value = window.__PRIORITY_DEVICE__; value.polls++;
      return value.connected ? [{ index: 0, id: 'Declared automated standard controller', mapping: 'standard', connected: true, timestamp: performance.now(),
        axes: value.axes, buttons: Array.from({ length: 18 }, (_, index) => ({ pressed: value.buttons.includes(index), touched: value.buttons.includes(index), value: value.buttons.includes(index) ? 1 : 0 })) }] : [];
    } });
  });
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') {
    const value = { text: message.text(), location: message.location() };
    if (value.location.url === new URL('favicon.ico', endpoint).href && value.text.includes('404')) report.resourceWarnings.push(value); else report.consoleErrors.push(value);
  } });
  page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('request', request => { const url = new URL(request.url()); if (url.origin === endpoint.origin && /\/(?:src\/|@vite\/)/.test(url.pathname)) report.sourceRequests.push(url.pathname); });
  page.on('response', response => {
    const url = new URL(response.url());
    if (response.status() >= 400 && url.pathname !== '/favicon.ico') report.failedRequests.push(`${response.status()} ${response.url()}`);
    if (mode !== 'production' || response.status() !== 200 || url.origin !== endpoint.origin) return;
    const path = decodeURIComponent(url.pathname.replace(/^\//, '') || 'index.html'), expected = report.distFiles[path];
    if (expected) responseWork.push((async () => {
      try { const bytes = await response.body(); assert.equal(sha(bytes), expected.sha256, path); report.servedFiles.push({ path, bytes: bytes.length, sha256: sha(bytes), status: response.status() }); }
      catch (error) { report.evidenceErrors.push(`${path}: ${error.message}`); }
    })());
  });
  await page.goto(endpoint.href, { waitUntil: 'networkidle' });
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  await page.locator('[data-do="new"]').waitFor(); await activate('[data-do="new"]'); await page.locator('#commander-name').waitFor();
  const originalName = await page.locator('#commander-name').inputValue();
  await activate('#commander-name'); await page.locator('.gamepad-keyboard').waitFor(); await activate('[data-pad-letter="a"]');
  assert.equal(await page.locator('#commander-name').inputValue(), originalName, 'Keyboard draft is isolated before confirmation');
  await page.setViewportSize({ width: 390, height: 844 }); await capture('keyboard-mobile');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
  await press(1); await page.locator('.gamepad-keyboard').waitFor({ state: 'hidden' }); assert.equal(await page.locator('#commander-name').inputValue(), originalName);
  await page.setViewportSize({ width: 1280, height: 800 }); await activate('#commander-name'); await activate('[data-pad-letter="a"]'); await activate('[data-pad-key="done"]');
  const chosenName = originalName + 'a'; assert.equal(await page.locator('#commander-name').inputValue(), chosenName);
  await tabTo('#new-difficulty'); await press(14); assert.equal(await page.locator('#new-difficulty').inputValue(), 'story');
  await activate('[data-do="begin"]'); await page.locator('.dialogue[data-conversation-id],.dialogue .choice').first().waitFor();
  await capture('opening-dialogue'); await activate('.dialogue .choice'); await ready();
  check('Public creation: text draft cancel/commit, mobile keyboard, native select adjustment and opening dialogue');

  const before = await exportPublic('before-movement'); assert.equal(before.name, chosenName); await press(9); await ready();
  await device({ buttons: [7], axes: [.85, 0, 0, 0] }); await page.waitForTimeout(700); await device({ buttons: [], axes: [0, 0, 0, 0] });
  const moved = await exportPublic('after-movement'); assert.ok(Math.hypot(moved.position.x - before.position.x, moved.position.z - before.position.z) > .1);
  await activate('[data-do="settings"]');
  await tabTo('#volume-setting'); const volume = Number(await page.locator('#volume-setting').inputValue()); await press(15);
  assert.ok(Number(await page.locator('#volume-setting').inputValue()) > volume); await tabTo('#mode-setting'); await press(15); assert.equal(await page.locator('#mode-setting').inputValue(), 'active');
  await capture('settings-focus'); await press(1); await ready();
  const preferences = await exportPublic('settings'); assert.equal(preferences.mode, 'active'); assert.ok(preferences.settings.volume > volume);
  check('Analog movement and public settings change are present in actual native save exports');

  await press(9); await ready(); await device({ axes: [.8, 0, 0, 0] }); await page.waitForTimeout(200); await device({ connected: false });
  const stopped = await exportPublic('disconnected-1', true); await key('Escape'); await ready(); await page.waitForTimeout(600);
  const still = await exportPublic('disconnected-2', true); assert.deepEqual(still.position, stopped.position);
  await device({ connected: true, axes: [.8, 0, 0, 0], buttons: [0] }); await page.waitForTimeout(250);
  assert.equal(await page.locator('.pause-screen').isVisible(), true, 'Held reconnect A cannot close or activate another screen');
  await device({ axes: [0, 0, 0, 0], buttons: [] }); await capture('disconnect-paused');
  check('Disconnect releases movement; held reconnect input cannot activate a menu, and keyboard remains usable');

  await activate('[data-do="quit"]'); await page.locator('[data-do="import"]').waitFor();
  const fixture = newGame({ name: 'QA commandes', difficulty: 'story', mode: 'wait' }); fixture.flags.briefed = true; fixture.zone = 'eden-prime'; recordVisit(fixture, fixture.zone);
  fixture.settings.sound = false; fixture.settings.reducedMotion = true; fixture.position = { ...getLevelLayout('eden-prime').pois['encounter-1'] };
  const fixtureBytes = encodeSave(fixture); assert.ok(decodeSave(fixtureBytes)); const fixturePath = `docs/qa/${prefix}-eden-fixture.json`;
  await writeFile(new URL(fixturePath, root), fixtureBytes); report.fixtures.push({ path: fixturePath, sha256: sha(fixtureBytes), importedViaPublicChooser: false,
    origin: 'Native Node newGame/recordVisit; briefing flag and position at the first legal Eden encounter explicitly prepared. No previous route or victory claimed.' });
  await tabTo('[data-do="import"]'); const chooserPromise = page.waitForEvent('filechooser');
  await device({ buttons: [0] }, 1); await device({ buttons: [] }, 0); const chooser = await chooserPromise;
  await chooser.setFiles({ name: 'priority-controls-fixture.json', mimeType: 'application/json', buffer: Buffer.from(fixtureBytes) }); report.fixtures[0].importedViaPublicChooser = true;
  await ready(); await device({ connected: true, axes: [0, 0, 0, 0], buttons: [] }); await press(0);
  await page.locator('#battle-ui .battle-member').first().waitFor(); await press(5);
  const selected = await page.locator('#battle-ui .battle-member.active').getAttribute('id'); assert.ok(selected?.startsWith('combat-'));
  await page.locator('[data-do="battle-action"][data-id="shoot"]:not(:disabled)').waitFor();
  await activate('[data-do="battle-action"][data-id="shoot"]:not(:disabled)');
  const actor = await page.locator('#battle-ui .battle-member.active').getAttribute('id');
  const beforeATB = Number((await page.locator(`#${actor} [data-stat="atb"]`).getAttribute('style')).match(/width:\s*([\d.]+)/)?.[1]); assert.ok(beforeATB >= 99);
  await activate('[data-do="battle-target"]:not(:disabled)');
  const afterATB = Number((await page.locator(`#${actor} [data-stat="atb"]`).getAttribute('style')).match(/width:\s*([\d.]+)/)?.[1]); assert.ok(afterATB < 60);
  report.publicOrder = { actor, action: 'shoot', beforeATBPercent: beforeATB, afterATBPercent: afterATB, source: 'Actual public DOM action/target buttons, invoked by mock gamepad A. No readiness, HP or state mutation.' };
  await capture('combat-order'); await press(9); await page.locator('.pause-screen').waitFor();
  assert.equal(await page.locator('.pause-screen [data-do="export"]').isDisabled(), true); await capture('combat-pause');
  check('First-Eden public battle: shoulder selection, action and target focus, natural-ATB order and pause restrictions');

  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []); assert.deepEqual(report.consoleErrors, []);
  await Promise.all(responseWork); assert.deepEqual(report.evidenceErrors, []);
  if (mode === 'production') { assert.deepEqual(report.sourceRequests, []); assert.deepEqual(await tree(new URL('dist/', root)), report.distFiles); }
  for (const [filename, expected] of Object.entries(report.sourceHashes)) assert.equal(sha(await readFile(new URL(filename, root))), expected, `Changed source: ${filename}`);
  report.sourceFrozen = true; report.distFrozen = mode === 'production'; report.passed = true;
} catch (error) { report.failure = error.stack || String(error); process.exitCode = 1; if (page) try { await capture('failure'); } catch {} }
finally { await Promise.allSettled(responseWork); await browser?.close(); await writeFile(reportURL, JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, captures: report.captures.length, failure: report.failure })); }
