import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { newGame, encodeSave, decodeSave } from '../src/state.js';
import { buyItem } from '../src/loadout.js';

// A focused UI scenario. All state changes use real controls and a real save
// import. The development QA harness is used only for read-only observations.
const baseMain = process.env.CUSTOMIZATION_BASE_MAIN;
assert.match(baseMain || '', /^[0-9a-f]{40}$/, 'CUSTOMIZATION_BASE_MAIN must identify the actual baseline SHA.');
const prefix = process.env.CUSTOMIZATION_REPORT_PREFIX || 'customization-poses';
assert.match(prefix, /^[a-z0-9][a-z0-9-]*$/);
const entry = new URL(process.env.GAME_URL || 'http://127.0.0.1:4173'); entry.searchParams.set('qa', '');
assert.ok(['http:', 'https:'].includes(entry.protocol));
const project = fileURLToPath(new URL('../', import.meta.url)), output = new URL('../test-results/', import.meta.url);
await mkdir(output, { recursive: true });
const require = createRequire(import.meta.url), sha256 = value => createHash('sha256').update(value).digest('hex');
const malePath = process.env.MALE_ANIMATION_CONFIG || 'public/assets/shepard-male-animation.json';
const femalePath = 'public/assets/shepard-female-animation.json';
const started = Date.now();
const report = { at: new Date().toISOString(), baseMain, passed: false, url: entry.href,
  buildKind: process.env.RELAY_BUILD_KIND || 'unspecified',
  scope: 'Authored pose previews, transient UI selection, preserved terrain direction, current-versus-draft appearance, keyboard focus after preparation and cancellation, and desktop/mobile controls. The fixture has an explicit QA credit budget and is imported through the real file chooser. This is not a combat-rules, performance, Windows or artistic-fidelity certification.',
  command: { script: 'node scripts/customization-poses-browser.mjs', environment: {
    GAME_URL: entry.href, CUSTOMIZATION_BASE_MAIN: baseMain, RELAY_BUILD_KIND: process.env.RELAY_BUILD_KIND || null,
    CUSTOMIZATION_REPORT_PREFIX: prefix, MALE_ANIMATION_CONFIG: malePath,
    PLAYWRIGHT_EXECUTABLE_PATH: process.env.PLAYWRIGHT_EXECUTABLE_PATH || null } },
  tools: { node: process.version, playwright: require('playwright/package.json').version, browser: null },
  sources: {}, fixture: null, checks: [], frames: [], layouts: [], screenshots: [], errors: [], failedRequests: [] };
const action = (page, name, id) => page.locator(`[data-do="${name}"]${id === undefined ? '' : `[data-id="${id}"]`}`).first();
const observe = page => page.evaluate(() => ({ state: structuredClone(window.__RELAY_TEST__.getState()), draft: structuredClone(window.__RELAY_TEST__.getUI().customizationDraft) }));
const record = (name, details = {}) => { report.checks.push({ name, passed: true, ...details }); console.log(JSON.stringify({ check: name, passed: true })); };
let browser, page;

async function ready(pose, appearance, metadata) {
  await page.waitForFunction(({ pose, appearance }) => {
    const preview = document.querySelector('.customization-preview'), canvas = preview?.querySelector('[data-custom-canvas]');
    return preview?.dataset.previewAppearance === appearance && preview.dataset.previewPose === pose
      && canvas?.dataset.ready === 'true' && canvas.dataset.pose === pose;
  }, { pose, appearance });
  const observed = await page.locator('[data-custom-canvas]').evaluate(async canvas => {
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let opaque = 0, left = canvas.width, top = canvas.height, right = -1, bottom = -1;
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) if (pixels[(y * canvas.width + x) * 4 + 3] > 80) {
      opaque++; left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    const alpha = new Uint8Array(canvas.width * canvas.height);
    for (let i = 0; i < alpha.length; i++) alpha[i] = pixels[i * 4 + 3];
    const hash = async bytes => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join('');
    return { ...canvas.dataset, width: canvas.width, height: canvas.height, opaque, bounds: { left, top, right, bottom },
      pixelsSha256: await hash(pixels), alphaSha256: await hash(alpha) };
  });
  assert.ok(observed.opaque > 50, `${appearance}/${pose}: actual pixels are present`);
  if (pose !== 'field') {
    const frame = metadata.combat.frames[pose];
    assert.equal(observed.source, metadata.combat.file); assert.equal(observed.frame, frame.id);
    assert.equal(Number(observed.heightScale), frame.heightScale || 1); assert.equal(observed.direction, 'three-quarter');
    assert.equal(await page.locator('[data-do="custom-view"]:disabled').count(), 4);
  } else assert.equal(await page.locator('[data-do="custom-view"]:disabled').count(), 0);
  assert.equal(await action(page, 'custom-pose', pose).getAttribute('aria-pressed'), 'true');
  return observed;
}

async function screenshot(name, wholeViewport = false) {
  const filename = `${prefix}-${name}.png`;
  const target = wholeViewport ? page : page.locator('.customization-preview');
  await target.screenshot({ path: fileURLToPath(new URL(filename, output)), animations: 'disabled' });
  report.screenshots.push({ file: `test-results/${filename}`, viewport: page.viewportSize(),
    capture: wholeViewport ? 'actual browser viewport with the focused control' : 'actual customization preview panel captured by the browser' });
}

async function openWorkshop() {
  const screen = await page.evaluate(() => window.__RELAY_TEST__.getUI().screen);
  if (screen) { assert.equal(screen, 'pause'); await action(page, 'close').click(); }
  await action(page, 'pause').click(); await action(page, 'customization').click();
  await page.locator('.customization-screen').waitFor();
}

async function cancelWithKeyboard() {
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => window.__RELAY_TEST__.getUI().screen === 'pause');
  assert.equal(await page.locator('.customization-screen').count(), 0);
}

async function setLargeText(enabled) {
  const screen = await page.evaluate(() => window.__RELAY_TEST__.getUI().screen);
  assert.equal(screen, 'pause'); await action(page, 'settings').click();
  await page.locator('#text-setting').setChecked(enabled);
  await action(page, 'close').click();
  await page.waitForFunction(() => window.__RELAY_TEST__.getUI().screen === null);
}

async function layout(label) {
  const result = await page.evaluate(() => {
    const screen = document.querySelector('.customization-screen'), group = document.querySelector('.custom-pose-controls');
    return { viewport: { width: innerWidth, height: innerHeight }, largeText: document.body.classList.contains('large-text'),
      documentWidth: document.documentElement.scrollWidth, screenWidth: screen.clientWidth, screenContentWidth: screen.scrollWidth,
      groupWidth: group.clientWidth, groupContentWidth: group.scrollWidth,
      buttons: [...group.querySelectorAll('button')].map(button => ({ id: button.dataset.id,
        width: button.clientWidth, contentWidth: button.scrollWidth, height: button.getBoundingClientRect().height })) };
  });
  assert.ok(result.documentWidth <= result.viewport.width + 1);
  assert.ok(result.screenContentWidth <= result.screenWidth + 1);
  assert.ok(result.groupContentWidth <= result.groupWidth + 1);
  assert.ok(result.buttons.every(button => button.contentWidth <= button.width + 1 && button.height >= 34));
  report.layouts.push({ label, ...result });
}

try {
  const male = JSON.parse(await readFile(resolve(project, malePath), 'utf8'));
  const female = JSON.parse(await readFile(resolve(project, femalePath), 'utf8'));
  for (const [name, metadata] of [['male', male], ['female', female]]) for (const pose of ['aim', 'power', 'hit', 'down']) {
    assert.ok(metadata.combat?.file && metadata.combat.frames?.[pose]?.rect, `${name}/${pose}: real metadata is required`);
  }
  const sources = ['src/main.js', 'src/customization-ui.js', 'src/customization-ui.css', 'src/customization-render.js', 'src/world.js',
    'scripts/customization-poses-browser.mjs', malePath, femalePath, `public/assets/${male.combat.file}`, `public/assets/${female.combat.file}`];
  report.sources = Object.fromEntries(await Promise.all(sources.map(async path => [path, sha256(await readFile(resolve(project, path)))])));
  const fixture = newGame({ name: 'QA Poses N7', classId: 'sentinel' });
  fixture.credits = 1000; fixture.settings.sound = false; fixture.settings.reducedMotion = true;
  assert.equal(buyItem(fixture, 'omni-tool-upgraded').ok, true);
  const save = encodeSave(fixture); assert.deepEqual(decodeSave(save), fixture);
  const fixtureName = `${prefix}-fixture.json`; await writeFile(new URL(fixtureName, output), save);
  report.fixture = { file: `test-results/${fixtureName}`, sha256: sha256(save),
    generator: 'newGame + explicit 1000-credit QA budget + buyItem(omni-tool-upgraded) + encodeSave', importedViaUI: false };
  browser = await chromium.launch({ headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  report.tools.browser = browser.version();
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('response', response => { if (response.status() >= 400) report.failedRequests.push({ url: response.url(), status: response.status() }); });
  await page.goto(entry.href, { waitUntil: 'networkidle' }); await page.waitForFunction(() => !!window.__RELAY_TEST__?.getUI);
  const chooser = page.waitForEvent('filechooser'); await action(page, 'import').click();
  await (await chooser).setFiles({ name: fixtureName, mimeType: 'application/json', buffer: Buffer.from(save) });
  await page.waitForFunction(name => window.__RELAY_TEST__.getState()?.name === name && !window.__RELAY_TEST__.getUI().busy, fixture.name);
  report.fixture.importedViaUI = true;
  await openWorkshop(); const originalState = (await observe(page)).state;
  await action(page, 'custom-tab', 'armor').click(); await action(page, 'custom-view', 'back').click(); await ready('field', 'male', male);
  await layout('desktop');
  for (const [appearance, metadata] of [['male', male], ['female', female]]) {
    if (appearance === 'female') {
      await action(page, 'custom-tab', 'character').click(); await action(page, 'custom-appearance', 'female').click(); await action(page, 'custom-tab', 'armor').click();
    }
    const untouched = await observe(page);
    for (const pose of ['aim', 'power', 'hit', 'down']) {
      await action(page, 'custom-pose', pose).click();
      report.frames.push({ appearance, pose, ...await ready(pose, appearance, metadata) });
      assert.deepEqual(await observe(page), untouched);
      assert.equal(await page.evaluate(() => window.__RELAY_TEST__.getUI().customView), 'back');
      await screenshot(`${appearance}-${pose}`);
    }
    const downBefore = await ready('down', appearance, metadata);
    const armorBefore = untouched.draft.customization.armor;
    await page.locator('[data-do="custom-choice"][data-field="armor.primary"][data-id="purple"]').click();
    const coloredDown = await ready('down', appearance, metadata);
    assert.notEqual(coloredDown.pixelsSha256, downBefore.pixelsSha256); assert.equal(coloredDown.alphaSha256, downBefore.alphaSha256);
    await screenshot(`${appearance}-down-purple`);
    await page.locator('[data-do="custom-choice"][data-field="armor.helmet"][data-id="combat"]').click();
    const helmetDown = await ready('down', appearance, metadata);
    assert.notEqual(helmetDown.pixelsSha256, coloredDown.pixelsSha256); assert.equal(helmetDown.alphaSha256, downBefore.alphaSha256);
    await screenshot(`${appearance}-down-purple-helmet`);
    assert.deepEqual((await observe(page)).state, untouched.state);
    record(`${appearance}: the down pose accepts the armor color and combat helmet without changing alpha or campaign state`,
      { before: downBefore, colored: coloredDown, helmet: helmetDown, headRegion: metadata.combat.frames.down.headRegion, headAxis: metadata.combat.frames.down.headAxis });
    await page.locator(`[data-do="custom-choice"][data-field="armor.primary"][data-id="${armorBefore.primary}"]`).click();
    await page.locator(`[data-do="custom-choice"][data-field="armor.helmet"][data-id="${armorBefore.helmet}"]`).click();
    await action(page, 'custom-pose', 'field').click(); const restored = await ready('field', appearance, metadata);
    assert.equal(restored.direction, 'back'); assert.deepEqual(await observe(page), untouched);
    record(`${appearance}: four authored poses leave state/draft unchanged and Terrain restores the chosen direction`);
  }
  await action(page, 'custom-pose', 'power').click(); await ready('power', 'female', female);
  await action(page, 'custom-compare').click(); await ready('power', 'male', male);
  await action(page, 'custom-compare').click(); await ready('power', 'female', female);
  assert.equal((await observe(page)).draft.appearance, 'female'); assert.deepEqual((await observe(page)).state, originalState);
  record('Compare to current switches only the preview appearance while keeping the prepared appearance and chosen pose');
  await cancelWithKeyboard(); assert.deepEqual((await observe(page)).state, originalState);

  await openWorkshop(); assert.equal(await page.evaluate(() => window.__RELAY_TEST__.getUI().customPose), 'field');
  await action(page, 'custom-tab', 'weapons').click(); await action(page, 'custom-slot', 'omniTool').click();
  const beforePreparation = await observe(page), savedBefore = await page.evaluate(() => localStorage.getItem('relay-chronicles.save.v1'));
  await action(page, 'custom-inspect', 'omni-tool-upgraded').click(); await page.keyboard.press('Tab');
  const focused = () => page.evaluate(() => ({ action: document.activeElement?.dataset.do, id: document.activeElement?.dataset.id,
    inside: !!document.activeElement?.closest('.customization-screen') }));
  assert.deepEqual(await focused(), { action: 'custom-equip', id: 'omni-tool-upgraded', inside: true });
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__RELAY_TEST__.getUI().customizationDraft.equipment.omniTool === 'omni-tool-upgraded');
  assert.deepEqual(await focused(), { action: 'custom-inspect', id: 'omni-tool-upgraded', inside: true });
  await screenshot('keyboard-after-prepare', true);
  await page.keyboard.press('Tab'); const nextFocus = await focused(); assert.equal(nextFocus.inside, true); assert.notEqual(nextFocus.action, 'close');
  await cancelWithKeyboard(); assert.deepEqual((await observe(page)).state, beforePreparation.state);
  assert.equal(await page.evaluate(() => localStorage.getItem('relay-chronicles.save.v1')), savedBefore);
  record('Preparing with Enter keeps focus on the inspected item; Tab continues inside the workshop and Escape cancels without saving');

  for (const target of [
    { label: 'mobile', viewport: { width: 390, height: 844 }, largeText: false },
    { label: 'desktop-large-text', viewport: { width: 1440, height: 1000 }, largeText: true },
    { label: 'mobile-large-text', viewport: { width: 390, height: 844 }, largeText: true },
  ]) {
    await page.setViewportSize(target.viewport); await setLargeText(target.largeText); await openWorkshop();
    await action(page, 'custom-tab', 'armor').click(); const untouched = await observe(page);
    await action(page, 'custom-pose', 'down').click(); await ready('down', 'male', male);
    await layout(target.label); await screenshot(`${target.label}-down`);
    assert.deepEqual(await observe(page), untouched); await cancelWithKeyboard();
  }
  record('Pose controls remain readable on desktop/mobile, with normal and enlarged text', { layouts: report.layouts.map(({ label, viewport, largeText }) => ({ label, viewport, largeText })) });
  await openWorkshop(); assert.equal(await page.evaluate(() => window.__RELAY_TEST__.getUI().customPose), 'field');
  assert.equal(await page.evaluate(() => Object.hasOwn(window.__RELAY_TEST__.getState(), 'customPose')), false);
  await cancelWithKeyboard();
  record('Reopening the workshop resets its transient pose to Terrain');
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []);
  report.passed = true;
} catch (error) {
  report.failure = error.stack || String(error); console.error(report.failure);
  if (page && await page.locator('.customization-preview').count()) await screenshot('failure').catch(() => {});
  process.exitCode = 1;
} finally {
  if (browser) await browser.close().catch(error => { report.closeError = error.message; });
  report.finishedAt = new Date().toISOString(); report.elapsedSeconds = Math.round((Date.now() - started) / 10) / 100;
  await writeFile(new URL(`${prefix}-browser-report.json`, output), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, frames: report.frames.length, screenshots: report.screenshots.length }));
}
