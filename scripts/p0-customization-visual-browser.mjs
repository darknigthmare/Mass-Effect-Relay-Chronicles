import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { encodeSave, newGame } from '../src/state.js';

const root = new URL('../', import.meta.url);
const out = new URL('test-results/p0-customization-visual/', root);
const buildPath = path.resolve(process.env.RELAY_VISUAL_DIST || 'dist');
const url = new URL(process.env.GAME_URL || 'http://localhost:4268/');
url.searchParams.set('qa', '1');
await mkdir(out, { recursive: true });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const files = ['src/customization-ui.js', 'src/customization-ui.css', 'src/customization-render.js', 'scripts/p0-customization-visual-browser.mjs'];
const hashes = async () => Object.fromEntries(await Promise.all(files.map(async file => [file, sha(await readFile(new URL(file, root)))])));
const report = {
  baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  at: new Date().toISOString(), passed: false, sourceHashes: await hashes(), checks: [], captures: [], served: [], errors: [],
  scope: 'Workshop on a compiled build. A level-one fixture is loaded via the public importer. Pixel geometry is measured on the visible preview canvas. No development harness, WebGL battle instrumentation, or changes to public assets.',
};
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium', headless: true,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(35_000);
  page.on('pageerror', error => report.errors.push(error.message));
  const action = (name, id) => page.locator(`[data-do="${name}"]${id === undefined ? '' : `[data-id="${id}"]`}`).first();
  const choice = (field, id) => page.locator(`[data-do="custom-choice"][data-field="${field}"][data-id="${id}"]`);
  const paint = (pose, direction) => page.locator(`[data-custom-canvas][data-ready="true"][data-pose="${pose}"][data-direction="${direction}"]`);
  async function check(name, detail) { report.checks.push({ name, detail }); console.log(name); }
  async function capture(name, locator) {
    const file = `${name}.png`;
    const bytes = await locator.screenshot({ path: new URL(file, out).pathname, animations: 'disabled' });
    report.captures.push({ path: file, sha256: sha(bytes) });
  }
  async function geometry(pose, direction) {
    const preview = paint(pose, direction);
    await preview.waitFor();
    return preview.evaluate(canvas => {
      const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      let left = canvas.width, top = canvas.height, right = 0, bottom = 0, tealPixels = 0, visorPixels = 0;
      for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        if (data[i + 3] < 100) continue;
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
        const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
        if (g > r * 1.3 && b > r * 1.3) tealPixels++;
        if (r >= 90 && r <= 98 && g >= 210 && b >= 222) visorPixels++;
      }
      const rect = canvas.getBoundingClientRect(), buttons = document.querySelector('.custom-pose-controls').getBoundingClientRect();
      return {
        frame: canvas.dataset.frame, pose: canvas.dataset.pose, direction: canvas.dataset.direction,
        left, top, right, bottom, width: canvas.width, height: canvas.height, tealPixels, visorPixels,
        controlsBelow: rect.bottom <= buttons.top + 1,
      };
    });
  }

  const response = await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  assert.equal(response.status(), 200);
  const index = await response.body();
  assert.equal(sha(index), sha(await readFile(path.join(buildPath, 'index.html'))));
  for (const match of index.toString().matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))"/g)) {
    const address = new URL(match[1], url);
    const file = address.pathname.slice(1);
    const response = await page.request.get(address.href);
    assert.equal(response.status(), 200);
    const actual = sha(await response.body());
    assert.equal(actual, sha(await readFile(path.join(buildPath, file))));
    report.served.push({ path: file, sha256: actual });
  }
  assert.ok(report.served.some(file => file.path.endsWith('.js')));
  assert.equal(await page.evaluate(() => Object.hasOwn(window, '__RELAY_TEST__')), false);

  const fixture = newGame({ name: 'QA palette atelier' });
  fixture.settings.sound = false;
  fixture.settings.reducedMotion = true;
  fixture.customization.armor = { primary: 'teal', secondary: 'silver', accent: 'purple', pattern: 'stripe', finish: 'standard', helmet: 'visible' };
  const chooser = page.waitForEvent('filechooser');
  await action('import').click();
  await (await chooser).setFiles({ name: 'qa-palette.json', mimeType: 'application/json', buffer: Buffer.from(encodeSave(fixture)) });
  await page.locator('#hud .explore-party').waitFor();
  await page.keyboard.press('Escape');
  await action('customization').click();
  const portrait = page.locator('.custom-face-art');
  await portrait.waitFor();
  const before = await portrait.getAttribute('aria-label');
  await choice('face.eyeColor', 'green').click();
  await choice('face.hairStyle', 'tied').click();
  const after = await portrait.getAttribute('aria-label');
  assert.notEqual(after, before);
  assert.match(after, /iris vert, coiffure attaché/);
  assert.equal(await portrait.locator('[fill="#68b9d1"]').count(), 0);
  await capture('portrait-sous-armure', page.locator('.custom-portrait-frame'));
  await check('The portrait keeps its face visible with helmet Visible and reports the selected iris and hair style', { before, after });

  const poses = [];
  for (const appearance of ['male', 'female']) {
    if (appearance === 'female') {
      await action('custom-tab', 'character').click();
      await action('custom-appearance', appearance).click();
    }
    await action('custom-tab', 'armor').click();
    await action('custom-pose', 'field').click();
    for (const direction of ['front', 'back', 'right', 'left']) {
      await action('custom-view', direction).click();
      const observed = await geometry('field', direction);
      assert.ok(observed.tealPixels > 0 && observed.left < observed.right && observed.top < observed.bottom);
      assert.equal(await page.locator('[data-do="custom-view"]:enabled').count(), 4);
      poses.push({ appearance, ...observed });
    }
    let aim;
    for (const pose of ['aim', 'power', 'hit', 'down']) {
      await action('custom-pose', pose).click();
      const observed = await geometry(pose, 'three-quarter');
      assert.ok(observed.tealPixels > 0 && observed.left > 0 && observed.right < observed.width - 1);
      assert.ok(observed.top > 0 && observed.bottom < observed.height - 1 && observed.controlsBelow);
      assert.equal(await page.locator('[data-do="custom-view"]:disabled').count(), 4);
      if (pose === 'aim') aim = observed;
      if (pose === 'down') {
        assert.ok(observed.bottom - observed.top < (aim.bottom - aim.top) * .55);
        assert.ok(Math.abs(observed.bottom - aim.bottom) < observed.height * .05);
        await capture(`armure-${appearance}-hors-combat`, page.locator('.customization-preview'));
      }
      poses.push({ appearance, ...observed });
    }
  }
  await check('Four field directions and four fixed three-quarter combat poses for each appearance retain color and framing', poses);

  await action('custom-tab', 'weapons').click();
  const families = [];
  for (const [item, family, label] of [
    ['lancer-i', 'assault', 'Lancer I'], ['kessler-i', 'pistol', 'Kessler I'],
    ['storm-i', 'shotgun', 'Storm I'], ['avenger-i', 'sniper', 'Avenger I'],
  ]) {
    await action('custom-inspect', item).click();
    const card = page.locator(`[data-inspection-id="${item}"]`);
    assert.equal(await card.getByRole('heading', { name: label, exact: true }).count(), 1);
    const diagram = card.locator(`[data-weapon-family="${family}"]`);
    assert.equal(await diagram.getByRole('img').count(), 1);
    assert.match(await diagram.locator('figcaption').innerText(), /silhouette générique/i);
    assert.equal(await page.locator('[data-weapon-family]').count(), 1);
    families.push({ item, family, modelLabel: label });
    if (family === 'sniper') await capture('fiche-famille', diagram);
  }
  await check('The inspected model owns the labelled generic diagram for each of the four families', families);
  assert.deepEqual(report.errors, []);
  assert.deepEqual(await hashes(), report.sourceHashes);
  report.passed = true;
} catch (error) {
  report.failure = String(error.stack || error);
  throw error;
} finally {
  await browser.close();
  await writeFile(new URL('report.json', out), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, captures: report.captures.length, report: new URL('report.json', out).pathname }));
}
