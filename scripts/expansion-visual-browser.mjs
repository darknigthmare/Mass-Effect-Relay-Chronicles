import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Targeted presentation check after the CSS-only fix. Existing functional
// proofs and their screenshots remain immutable. No source-module imports,
// development hooks, application setters or writes to browser storage.
const root = new URL('../', import.meta.url), out = new URL('test-results/', root);
const entry = new URL(process.env.GAME_URL || 'http://127.0.0.1:4174');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const historicPath = 'docs/qa/expansion-production-report.json';
const historicSHA = '41878ae742cf2999fdf4ecc303190f16f180da441f9fe5c53253127385a87493';
const archivePath = 'docs/qa/expansion-before-visual-fix-universe-ui.css';
const cssPath = 'src/universe-ui.css';
const sourcePaths = ['scripts/expansion-visual-browser.mjs', 'src/expansion.js', 'src/expansion-ui.js',
  'src/expansion-characters.js', 'src/expansion-armor.js', 'src/expansion-weapons.js',
  'src/expansion-fleet.js', 'src/expansion-enemies.js', 'src/main.js', 'src/universe-ui.js',
  cssPath, 'src/combat.js', 'src/universe-data.js'];
for (const directory of ['test-results/', 'docs/qa/', 'docs/screenshots/']) await mkdir(new URL(directory, root), { recursive: true });
const report = {
  passed: false, at: new Date().toISOString(), entry: entry.href, stage: 'prepare',
  command: `GAME_URL=${entry.origin} PLAYWRIGHT_EXECUTABLE_PATH=${process.env.PLAYWRIGHT_EXECUTABLE_PATH || '(Playwright default)'} node scripts/expansion-visual-browser.mjs`,
  scope: 'CSS-only final presentation check of five Simulation families on desktop and 390px mobile, real normal exercises, button contrast/44px targets, unbroken table tokens and local horizontal scrolling. Earlier functional and seed/storage/edition proof remains historical; this check does not certify original art, canonical stats or missions.',
  checks: [], sources: [], servedCSS: [], captureArtifacts: [], views: [], buttons: [], errors: [], failedRequests: [],
};
const historicalBytes = await readFile(new URL(historicPath, root));
assert.equal(sha(historicalBytes), historicSHA, 'The prior positive production report is preserved');
const historical = JSON.parse(historicalBytes), oldCSS = historical.sources.find(source => source.path === cssPath);
const archivedCSS = await readFile(new URL(archivePath, root)), currentCSS = await readFile(new URL(cssPath, root));
assert.equal(sha(archivedCSS), oldCSS.sha256, 'The archived CSS matches the exact pre-fix functional proof');
assert.ok(currentCSS.toString().startsWith(archivedCSS.toString()), 'The prior CSS is preserved before the scoped appended fix');
for (const previous of historical.sources.filter(source => source.path.startsWith('src/') && source.path !== cssPath)) {
  assert.equal(sha(await readFile(new URL(previous.path, root))), previous.sha256, `${previous.path}: all existing JavaScript/data stays unchanged`);
}
report.historicalEvidence = {
  path: historicPath, sha256: historicSHA, cssArchive: { path: archivePath, sha256: sha(archivedCSS) },
  currentCSS: { path: cssPath, sha256: sha(currentCSS) },
  unchangedJavaScriptAndDataFiles: historical.sources.filter(source => source.path.startsWith('src/') && source.path !== cssPath).length,
  cssDelta: currentCSS.toString().slice(archivedCSS.length),
};
for (const path of sourcePaths) {
  const bytes = await readFile(new URL(path, root)); report.sources.push({ path, bytes: bytes.length, sha256: sha(bytes) });
}
let browser, page, baseline;
const pendingCSS = [], reservedCSS = new Set();
const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
const mark = stage => { report.stage = stage; console.log(JSON.stringify({ stage })); };
const record = (name, details = {}) => { report.checks.push({ name, ...details }); console.log(JSON.stringify({ check: name })); };
const storage = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])));
const isolated = async () => assert.deepEqual(await storage(), baseline, 'Presentation exercises never change existing campaign/manual/Chronicle saves');
async function capture(name) {
  const filename = `expansion-final-${name}.png`, path = new URL(filename, out);
  await page.screenshot({ path: fileURLToPath(path), fullPage: false, timeout: 60000 });
  const destination = new URL(`docs/screenshots/${filename}`, root); await copyFile(path, destination);
  const bytes = await readFile(destination);
  report.captureArtifacts.push({ path: `docs/screenshots/${filename}`, bytes: bytes.length, sha256: sha(bytes) });
}
async function context(mediaId, periodId) {
  if (await page.locator('#chronicle-media').inputValue() !== mediaId) await page.locator('#chronicle-media').selectOption(mediaId);
  if (await page.locator('#chronicle-period').inputValue() !== periodId) await page.locator('#chronicle-period').selectOption(periodId);
}
async function choose(mediaId, periodId, family, id) {
  await context(mediaId, periodId); await action('universe-tab', 'expansion').click();
  await page.locator('#expansion-mode').selectOption(family); await page.locator('#expansion-record').selectOption(id);
  await page.locator('#expansion-edition').selectOption('standard');
  await page.locator(`[data-expansion-record="${id}"]`).waitFor();
  assert.ok(await page.locator('.expansion-notes li').count() > 0);
  assert.ok(await page.locator('.expansion-limits[open] li').count() > 0);
  assert.ok(await page.locator('[data-expansion-record] a[href^="https://"]').count() > 0);
}
async function buttonStyle(disabled, label) {
  const style = await action('expansion-run').evaluate(button => {
    const css = getComputedStyle(button), rect = button.getBoundingClientRect();
    const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
    const luminance = value => rgb(value).map(channel => {
      const x = channel / 255; return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
    const foreground = luminance(css.color), background = luminance(css.backgroundColor);
    return { disabled: button.disabled, text: button.textContent.trim(), color: css.color,
      background: css.backgroundColor, backgroundImage: css.backgroundImage, opacity: Number(css.opacity),
      width: rect.width, height: rect.height, fontSize: css.fontSize,
      contrast: (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05) };
  });
  assert.equal(style.disabled, disabled); assert.equal(style.opacity, 1, 'Disabled text is not faded into the backdrop');
  assert.equal(style.backgroundImage, 'none', 'The measured button has a solid opaque background');
  assert.match(style.background, /^rgb\(/, 'The measured background is opaque');
  assert.ok(style.contrast >= 4.5, `${label}: text contrast ${style.contrast}`);
  assert.ok(style.height >= 44 && style.width >= 44, `${label}: touch target ${style.width}×${style.height}`);
  report.buttons.push({ label, viewport: page.viewportSize(), ...style });
  return style;
}
async function measureTable() {
  return page.locator('.expansion-result').evaluate(result => {
    const table = result.querySelector('table'), scroller = table.parentElement;
    const rows = [...table.querySelectorAll('tbody tr')].map(row => row.textContent.trim());
    const brokenTokens = [];
    // Range rectangles test actual layout, not merely a white-space declaration.
    for (const cell of table.querySelectorAll('th,td')) {
      const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        for (const match of node.textContent.matchAll(/\S+/gu)) {
          const range = document.createRange(); range.setStart(node, match.index); range.setEnd(node, match.index + match[0].length);
          const lines = new Set([...range.getClientRects()].filter(rect => rect.width > 0).map(rect => Math.round(rect.top * 10) / 10));
          if (lines.size > 1) brokenTokens.push({ token: match[0], cell: cell.tagName, lines: [...lines] });
        }
      }
    }
    const targets = ['.universe-screen', '.expansion-workshop', '.expansion-detail', '#expansion-mode', '#expansion-record', '#expansion-seed', '#expansion-edition'];
    return { width: innerWidth, documentWidth: document.documentElement.scrollWidth,
      tableWidth: table.getBoundingClientRect().width, tableMinWidth: getComputedStyle(table).minWidth,
      scroller: { clientWidth: scroller.clientWidth, scrollWidth: scroller.scrollWidth, scrollLeft: scroller.scrollLeft, overflowX: getComputedStyle(scroller).overflowX },
      cellsWhiteSpace: [...table.querySelectorAll('td')].map(cell => getComputedStyle(cell).whiteSpace),
      brokenTokens, rows, targets: targets.map(selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { selector, left: r.left, right: r.right, width: r.width }; }) };
  });
}
async function verifyFamily(viewportName, [mediaId, periodId, family, id]) {
  await choose(mediaId, periodId, family, id); await buttonStyle(false, `${viewportName}/${family}/enabled`);
  await page.locator('[data-expansion-record]').evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await capture(`${viewportName}-${family}-reference`);
  await page.locator('#expansion-difficulty').selectOption('normal');
  await action('expansion-run').click(); await page.locator('.expansion-result').waitFor();
  const result = await page.locator('.expansion-result').innerText();
  assert.match(result, family === 'fleet' ? /Parcours abstrait/ : /secondes ATB · \d+ ordres/);
  await page.locator('.expansion-table-scroll').scrollIntoViewIfNeeded();
  const observed = await measureTable();
  assert.ok(observed.tableWidth >= 560 && parseFloat(observed.tableMinWidth) >= 560);
  assert.deepEqual(observed.brokenTokens, [], `${viewportName}/${family}: no table words or numbers break internally`);
  assert.ok(observed.cellsWhiteSpace.every(value => value === 'nowrap'));
  assert.equal(observed.scroller.overflowX, 'auto');
  assert.ok(observed.documentWidth <= observed.width + 1);
  for (const target of observed.targets) assert.ok(target.width > 0 && target.left >= -1 && target.right <= observed.width + 1, JSON.stringify(target));
  await capture(`${viewportName}-${family}-result-left`);
  if (viewportName === 'mobile') {
    assert.ok(observed.scroller.scrollWidth > observed.scroller.clientWidth, 'The wide table scrolls locally on mobile');
    const tableBox = await page.locator('.expansion-table-scroll').boundingBox();
    await page.mouse.move(tableBox.x + tableBox.width / 2, tableBox.y + Math.min(tableBox.height / 2, 60));
    await page.mouse.wheel(600, 0);
    await page.waitForFunction(() => document.querySelector('.expansion-table-scroll').scrollLeft > 0);
    const right = await measureTable(); assert.ok(right.scroller.scrollLeft > 0);
    assert.ok(right.documentWidth <= right.width + 1);
    assert.deepEqual(right.brokenTokens, []);
    observed.rightScroll = right.scroller;
    await capture(`${viewportName}-${family}-result-right`);
  }
  report.views.push({ viewportName, family, recordId: id, resultTextSha256: sha(result), ...observed });
  await isolated();
}
async function verifyBlocked(viewportName) {
  await choose('ME3', 'me3', 'actor', 'ME3-NPC-TRAYNOR');
  const reason = await page.locator('[data-expansion-record] .universe-lock').innerText();
  assert.match(reason, /Inspection seulement.*combattant/); await buttonStyle(true, `${viewportName}/civilian/disabled`);
  await action('expansion-run').scrollIntoViewIfNeeded(); await capture(`${viewportName}-blocked-button`);
  await isolated();
}
async function witnesses() {
  await page.goto(entry.href, { waitUntil: 'networkidle' });
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  await page.getByRole('button', { name: /Nouvelle campagne/ }).click();
  await page.locator('#commander-name').fill('Jane Présentation');
  await page.getByRole('button', { name: /Commencer l’aventure/ }).click();
  await page.getByRole('button', { name: 'Je rejoins le briefing.' }).click();
  await page.locator('.location h2').filter({ hasText: 'Normandy' }).waitFor();
  await page.keyboard.press('Escape'); await action('manual-saves').click();
  await page.locator('#manual-save-name-1').fill('ME1 témoin présentation finale'); await action('manual-save', '1').click();
  assert.equal(await page.locator('[data-save-slot="1"]').getAttribute('data-status'), 'saved');
  await action('manual-back').click(); await action('save').click(); await action('chronicles').click();
  await page.locator('.universe-screen').waitFor();
  await context('ME2', 'me2'); await action('universe-tab', 'session').click();
  await page.locator('#chronicle-scenario').selectOption('me2-equipment-workshop');
  await action('chronicle-start').click(); await action('chronicle-save').click();
  baseline = await storage();
  for (const key of ['relay-chronicles.save.v1', 'relay-chronicles.manual-save.v1.1', 'relay-chronicles.chronicle.ME2.me2.v1']) assert.ok(baseline[key]);
  report.storageBefore = Object.entries(baseline).map(([key, value]) => ({ key, bytes: Buffer.byteLength(value), sha256: sha(value) }));
}

try {
  browser = await chromium.launch({ headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  report.browser = browser.version();
  const browserContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  page = await browserContext.newPage(); page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => {
    if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`);
    const address = new URL(response.url());
    if (address.origin !== entry.origin || !address.pathname.endsWith('.css') || response.status() !== 200 || reservedCSS.has(address.pathname)) return;
    reservedCSS.add(address.pathname);
    pendingCSS.push((async () => {
      const path = `dist${address.pathname}`, expected = await readFile(new URL(path, root)), observed = await response.body();
      assert.equal(sha(observed), sha(expected), `${path}: served CSS matches the actual build bytes`);
      report.servedCSS.push({ path, status: 200, bytes: observed.length, sha256: sha(observed),
        containsFinalTableRule: observed.toString().includes('min-width:560px'), currentSourceCSSSHA256: sha(currentCSS) });
    })().catch(error => report.failedRequests.push(`CSS observation: ${error.message}`)));
  });
  mark('Establish real save witnesses through the public interface'); await witnesses();
  record('Historical functional proof and archived CSS stay exact; eleven existing JS/data sources are unchanged');
  const families = [
    ['ME2', 'me2', 'actor', 'ME2-NPC-RENEGAR'], ['MEA', 'mea', 'armor', 'MEA-EQP-PATHFINDER'],
    ['ME3', 'me3', 'weapon', 'ME3-WPN-FALCON'], ['MEA', 'mea', 'enemy', 'MEA-ENM-INVICTOR'],
    ['ME2', 'me2', 'fleet', 'ME2-ZON-NORMANDY-CIC'],
  ];
  mark('Desktop five families: identities, sources, normal exercise results and button contrast');
  for (const family of families) await verifyFamily('desktop', family);
  await verifyBlocked('desktop');
  record('Five desktop families expose sources and limits, run normal exercises and retain legible table tokens and enabled/disabled buttons');
  mark('Mobile390 five families: both table edges, native horizontal scroll, no broken words/numbers');
  await page.setViewportSize({ width: 390, height: 844 });
  for (const family of families) await verifyFamily('mobile', family);
  await verifyBlocked('mobile');
  record('Five mobile families have no page overflow or broken table tokens; local native wheel scroll reveals resources, with 44px buttons and contrast >=4.5');
  mark('Verify final HTTP CSS, source freeze and unchanged saves');
  await isolated();
  report.storageAfter = Object.entries(await storage()).map(([key, value]) => ({ key, bytes: Buffer.byteLength(value), sha256: sha(value) }));
  assert.deepEqual(report.storageAfter, report.storageBefore);
  await page.waitForLoadState('networkidle'); await Promise.all(pendingCSS);
  assert.ok(report.servedCSS.some(css => /\/universe-ui-[^/]+\.css$/.test(css.path) && css.containsFinalTableRule), 'The actual final Chronicle CSS was served over HTTP');
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []);
  for (const source of report.sources) assert.equal(sha(await readFile(new URL(source.path, root))), source.sha256, `${source.path}: source unchanged through the targeted run`);
  assert.equal(sha(await readFile(new URL(historicPath, root))), historicSHA);
  for (const artifact of report.captureArtifacts) assert.equal(sha(await readFile(new URL(artifact.path, root))), artifact.sha256);
  record('Final CSS HTTP200 bytes match dist; thirteen source hashes, all captures, historical proof and all existing saves remain unchanged');
  report.passed = true; report.stage = 'complete';
} catch (error) {
  report.failure = { message: error.message, stack: error.stack };
  if (page) await capture('failure').catch(() => {});
  console.error(error); process.exitCode = 1;
} finally {
  await browser?.close();
  const bytes = JSON.stringify(report, null, 2) + '\n', filename = 'expansion-final-visual-report.json';
  await writeFile(new URL(filename, out), bytes); await writeFile(new URL(`docs/qa/${filename}`, root), bytes);
  console.log(JSON.stringify({ passed: report.passed, report: `docs/qa/${filename}`, sha256: sha(bytes), checks: report.checks.length, views: report.views.length, captures: report.captureArtifacts.length }));
}
