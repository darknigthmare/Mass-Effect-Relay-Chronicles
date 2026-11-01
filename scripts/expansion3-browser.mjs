import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { EXPANSION3_ENTRIES } from '../src/expansion.js';
import { canAccessContent } from '../src/continuity.js';

// Expected documentary data is read by Node. The actual browser uses public
// DOM controls only: no /src import, test harness, setter or storage injection.
const mode = process.env.EXPANSION_QA_MODE === 'production' ? 'production' : 'dev';
const entry = new URL(process.env.GAME_URL || (mode === 'production' ? 'http://127.0.0.1:4174' : 'http://127.0.0.1:4173'));
const root = new URL('../', import.meta.url), out = new URL('test-results/', root);
const filename = mode === 'production' ? 'expansion3-production-report.json' : 'expansion3-browser-report.json';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
for (const directory of ['test-results/', 'docs/qa/', 'docs/screenshots/']) await mkdir(new URL(directory, root), { recursive: true });
const sources = ['scripts/expansion3-browser.mjs', 'src/expansion.js', 'src/expansion-ui.js', 'src/expansion-bench.js',
  'src/expansion-medical-bench.js', 'src/combat-medical.js',
  ...['characters', 'armor', 'weapons', 'fleet', 'enemies'].flatMap(group =>
    [`src/expansion-${group}.js`, `src/expansion2-${group}.js`, `src/expansion3-${group}.js`]),
  'src/main.js', 'src/universe-ui.js', 'src/universe-ui.css', 'src/combat.js', 'src/chronicles.js',
  'src/continuity.js', 'src/continuity-data.js', 'src/universe-data.js', 'src/universe-actors.js',
  'src/universe-equipment.js', 'src/universe-weapon-profiles.js', 'src/tool-data.js'];
const report = {
  passed: false, at: new Date().toISOString(), mode, entry: entry.href, stage: 'prepare', baselineCommit: '1b3444f',
  command: `GAME_URL=${entry.origin} EXPANSION_QA_MODE=${mode} PLAYWRIGHT_EXECUTABLE_PATH=${process.env.PLAYWRIGHT_EXECUTABLE_PATH || '(Playwright default)'} node scripts/expansion3-browser.mjs`,
  scope: 'All 122 third-lot documentary cards through public context/batch controls: 36 generic ATB duels, two native medical benches and 84 closed consultations; strict editions, unchanged existing saves, desktop/mobile table readability. Zero new fleet hulls or armour models. No complete source missions, kits, statistics or 1:1 artistic fidelity certified.',
  sources: [], preservation: [], checks: [], cards: [], contextListings: [], trials: [], benches: [], weapons: [], enemies: [],
  blocked: [], editionGates: [], layouts: [], captureArtifacts: [], requestedScripts: [], servedBundles: [], servedPNGs: [], servedCSS: [], errors: [], failedRequests: [],
};
for (const path of sources) {
  const bytes = await readFile(new URL(path, root)); report.sources.push({ path, bytes: bytes.length, sha256: sha(bytes) });
}
for (const path of [
  ...['characters', 'armor', 'weapons', 'fleet', 'enemies'].flatMap(group => [`src/expansion-${group}.js`, `src/expansion2-${group}.js`]),
  'src/chronicles.js', 'src/continuity.js', 'src/continuity-data.js', 'src/universe-actors.js',
  'src/universe-equipment-scenarios.js', 'src/universe-specialist-scenarios.js', 'src/universe-opposition-scenarios.js',
]) {
  const before = execFileSync('git', ['show', `1b3444f:${path}`], { cwd: fileURLToPath(root) });
  const current = await readFile(new URL(path, root)); assert.equal(sha(current), sha(before), `${path}: preserved from the latest main checkpoint`);
  report.preservation.push({ path, baseCommit: '1b3444f', sha256: sha(current) });
}
const firstContext = card => {
  const scope = card.availability[0]; return { mediaId: scope.mediaId, periodId: scope.periodIds[0] };
};
const expectedCardIDs = EXPANSION3_ENTRIES.map(card => card.id);
assert.equal(expectedCardIDs.length, 122); assert.equal(new Set(expectedCardIDs).size, 122);
const visualCases = [
  ['ME3', 'me3', 'actor', 'ME3-NPC-BROOKS', 'atb', 'legendary'],
  ['ME2', 'me2', 'armor', 'ME2-POW-UNITY', 'equipment-bench', 'standard'],
  ['ME3', 'me3', 'weapon', 'ME3-WPN-VINDICATOR', 'atb', 'standard'],
  ['ME3', 'me3', 'enemy', 'ME3-ENM-TURRET', 'atb', 'standard'],
];
let browser, page, baseline;
const pendingResources = [], reservedResources = new Set();
const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
const mark = stage => { report.stage = stage; console.log(JSON.stringify({ stage })); };
const record = (name, details = {}) => { report.checks.push({ name, ...details }); console.log(JSON.stringify({ check: name })); };
const storage = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])));
const isolated = async () => assert.deepEqual(await storage(), baseline, 'Independent trials preserve all existing save bytes');
async function capture(name) {
  const nameWithMode = `expansion3-${mode}-${name}.png`, path = new URL(nameWithMode, out);
  await page.screenshot({ path: fileURLToPath(path), fullPage: false, timeout: 60000 });
  const destination = new URL(`docs/screenshots/${nameWithMode}`, root); await copyFile(path, destination);
  const bytes = await readFile(destination); report.captureArtifacts.push({ path: `docs/screenshots/${nameWithMode}`, bytes: bytes.length, sha256: sha(bytes) });
}
async function context(mediaId, periodId) {
  if (await page.locator('#chronicle-media').inputValue() !== mediaId) await page.locator('#chronicle-media').selectOption(mediaId);
  if (await page.locator('#chronicle-period').inputValue() !== periodId) await page.locator('#chronicle-period').selectOption(periodId);
}
async function filter(mediaId, periodId, family, batch = 'lot3') {
  await context(mediaId, periodId); await action('universe-tab', 'expansion').click();
  await page.locator('#expansion-batch').selectOption(batch); await page.locator('#expansion-mode').selectOption(family);
}
async function choose(mediaId, periodId, family, id, { batch = 'lot3', edition = 'standard' } = {}) {
  await filter(mediaId, periodId, family, batch);
  assert.equal(await page.locator(`#expansion-record option[value="${id}"]`).count(), 1, `${id}: exact documentary occurrence listed`);
  await page.locator('#expansion-record').selectOption(id); await page.locator('#expansion-edition').selectOption(edition);
  await page.locator(`[data-expansion-record="${id}"]`).waitFor();
  assert.ok(await page.locator('.expansion-notes li').count() > 0);
  assert.ok(await page.locator('.expansion-limits[open] li').count() > 0);
  assert.ok(await page.locator('[data-expansion-record] a[href^="https://"]').count() > 0);
}
async function buttonStyle(disabled) {
  const observed = await action('expansion-run').evaluate(button => {
    const css = getComputedStyle(button), rect = button.getBoundingClientRect();
    const light = color => color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
      const x = value / 255; return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4;
    }).reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0);
    const fg = light(css.color), bg = light(css.backgroundColor);
    return { disabled: button.disabled, width: rect.width, height: rect.height, opacity: Number(css.opacity),
      color: css.color, background: css.backgroundColor, backgroundImage: css.backgroundImage,
      contrast: (Math.max(fg, bg) + .05) / (Math.min(fg, bg) + .05) };
  });
  assert.equal(observed.disabled, disabled); assert.equal(observed.opacity, 1);
  assert.equal(observed.backgroundImage, 'none'); assert.match(observed.background, /^rgb\(/);
  assert.ok(observed.width >= 44 && observed.height >= 44); assert.ok(observed.contrast >= 4.5);
  return observed;
}
async function run(id, kind, seed = 29) {
  await page.locator('#expansion-seed').fill(String(seed)); await page.locator('#expansion-seed').press('Tab');
  await page.locator('#expansion-difficulty').selectOption('normal'); await buttonStyle(false);
  const old = await page.locator('.expansion-result').count() ? await page.locator('.expansion-result').elementHandle() : null;
  await action('expansion-run').click(); const result = page.locator('.expansion-result'); await result.waitFor();
  if (old) { assert.equal(await old.evaluate(node => node.isConnected), false); await old.dispose(); }
  const text = await result.innerText(), caption = await result.locator('caption').innerText();
  const rows = await result.locator('tbody tr').evaluateAll(nodes => nodes.map(row => [...row.children].map(cell => cell.textContent.trim())));
  if (kind === 'equipment-bench') {
    assert.match(text, /Banc de secours|Banc d’équipement/); assert.match(caption, /Ordres natifs/);
    assert.equal(await result.locator('thead th').count(), 5); assert.ok(rows.every(row => row.length === 5));
  } else if (kind === 'logistics') {
    assert.match(text, /Parcours abstrait/); assert.match(caption, /Trois étapes/);
    assert.ok(rows.length > 0 && rows.length <= 3); assert.doesNotMatch(text, /secondes ATB/);
  } else {
    assert.match(caption, /État final/); assert.match(text, /secondes ATB · \d+ ordres/);
    assert.ok(await result.locator('details li').count() > 0);
  }
  const evidence = { recordId: id, kind, seed, batch: await page.locator('#expansion-batch').inputValue(),
    edition: await page.locator('#expansion-edition').inputValue(), headline: await result.locator('h4').innerText(), rows, textSha256: sha(text) };
  report.trials.push(evidence); await isolated(); return { text, ...evidence };
}
async function closed(mediaId, periodId, family, id, pattern, batch = 'lot3') {
  await choose(mediaId, periodId, family, id, { batch }); await buttonStyle(true);
  const reason = await page.locator('[data-expansion-record] .universe-lock').innerText(); assert.match(reason, pattern);
  assert.equal(await page.locator('.expansion-result').count(), 0); await isolated();
  report.blocked.push({ recordId: id, mediaId, periodId, batch, reason });
}
async function layout(viewportName, family) {
  const observed = await page.locator('.expansion-result').evaluate(result => {
    const table = result.querySelector('table'), scroller = table.parentElement, brokenTokens = [];
    for (const cell of table.querySelectorAll('th,td')) {
      const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT); let node;
      while ((node = walker.nextNode())) for (const match of node.textContent.matchAll(/\S+/gu)) {
        const range = document.createRange(); range.setStart(node, match.index); range.setEnd(node, match.index + match[0].length);
        const lines = new Set([...range.getClientRects()].filter(r => r.width > 0).map(r => Math.round(r.top * 10) / 10));
        if (lines.size > 1) brokenTokens.push({ token: match[0], lines: [...lines] });
      }
    }
    return { width: innerWidth, documentWidth: document.documentElement.scrollWidth, tableWidth: table.getBoundingClientRect().width,
      columns: table.querySelectorAll('thead th').length, brokenTokens,
      scroller: { clientWidth: scroller.clientWidth, scrollWidth: scroller.scrollWidth, scrollLeft: scroller.scrollLeft, overflowX: getComputedStyle(scroller).overflowX },
      controls: [...document.querySelectorAll('.expansion-controls select,.expansion-controls input')].map(node => { const r = node.getBoundingClientRect(); return { id: node.id, left: r.left, right: r.right }; }) };
  });
  assert.deepEqual(observed.brokenTokens, [], `${viewportName}/${family}: no split words/numbers`);
  assert.ok(observed.documentWidth <= observed.width + 1); assert.ok(observed.tableWidth >= 560);
  assert.equal(observed.scroller.overflowX, 'auto');
  assert.ok(observed.controls.every(control => control.left >= -1 && control.right <= observed.width + 1));
  return observed;
}
async function visual(viewportName, [mediaId, periodId, family, id, kind, edition]) {
  await choose(mediaId, periodId, family, id, { edition }); const enabledButton = await buttonStyle(false);
  await page.locator('[data-expansion-record]').evaluate(node => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await capture(`${viewportName}-${family}-reference`); await run(id, kind);
  await page.locator('.expansion-table-scroll').scrollIntoViewIfNeeded(); const observed = await layout(viewportName, family);
  await capture(`${viewportName}-${family}-result-left`);
  if (viewportName === 'mobile' && ['armor', 'weapon'].includes(family)) {
    assert.ok(observed.scroller.scrollWidth > observed.scroller.clientWidth);
    const box = await page.locator('.expansion-table-scroll').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + Math.min(60, box.height / 2)); await page.mouse.wheel(900, 0);
    await page.waitForFunction(() => document.querySelector('.expansion-table-scroll').scrollLeft > 0);
    const right = await layout(viewportName, family); assert.ok(right.scroller.scrollLeft > 0);
    observed.rightScroller = right.scroller; await capture(`${viewportName}-${family}-result-right`);
  }
  report.layouts.push({ viewportName, family, recordId: id, enabledButton, ...observed });
}
async function witnesses() {
  await page.goto(entry.href, { waitUntil: 'networkidle' }); assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  await page.getByRole('button', { name: /Nouvelle campagne/ }).click(); await page.locator('#commander-name').fill('Jane Troisième lot');
  await page.getByRole('button', { name: /Commencer l’aventure/ }).click(); await page.getByRole('button', { name: 'Je rejoins le briefing.' }).click();
  await page.locator('.location h2').filter({ hasText: 'Normandy' }).waitFor(); await page.keyboard.press('Escape');
  await action('manual-saves').click(); await page.locator('#manual-save-name-1').fill('ME1 témoin Simulation lot3'); await action('manual-save', '1').click();
  assert.equal(await page.locator('[data-save-slot="1"]').getAttribute('data-status'), 'saved');
  await action('manual-back').click(); await action('save').click(); await action('chronicles').click(); await page.locator('.universe-screen').waitFor();
  for (const mediaId of ['ME2', 'ME3']) {
    await context(mediaId, mediaId.toLowerCase()); await action('universe-tab', 'session').click();
    await page.locator('#chronicle-scenario').selectOption(`${mediaId.toLowerCase()}-equipment-workshop`);
    await action('chronicle-start').click(); await action('chronicle-save').click();
  }
  baseline = await storage();
  for (const key of ['relay-chronicles.save.v1', 'relay-chronicles.manual-save.v1.1', 'relay-chronicles.chronicle.ME2.me2.v1', 'relay-chronicles.chronicle.ME3.me3.v1']) assert.ok(baseline[key]);
  report.storageBefore = Object.entries(baseline).map(([key, content]) => ({ key, bytes: Buffer.byteLength(content), sha256: sha(content) }));
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
  page.on('request', request => { if (request.resourceType() === 'script') report.requestedScripts.push(request.url()); });
  page.on('response', response => {
    if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`);
    const address = new URL(response.url());
    const type = address.pathname.endsWith('.js') ? 'servedBundles' : address.pathname.endsWith('.png') ? 'servedPNGs' : address.pathname.endsWith('.css') ? 'servedCSS' : null;
    if (mode !== 'production' || address.origin !== entry.origin || !type || response.status() !== 200 || reservedResources.has(address.pathname)) return;
    reservedResources.add(address.pathname);
    pendingResources.push((async () => {
      const path = `dist${address.pathname}`, expected = await readFile(new URL(path, root)), bytes = await response.body();
      assert.equal(sha(bytes), sha(expected), `${path}: actual HTTP200 content matches dist`);
      report[type].push({ path, status: 200, bytes: bytes.length, sha256: sha(bytes) });
    })().catch(error => report.failedRequests.push(`Production resource: ${error.message}`)));
  });

  mark('Create genuine ME1, manual and two Chronicle witnesses'); await witnesses();
  await action('universe-tab', 'expansion').click();
  assert.equal(await page.locator('#expansion-batch').inputValue(), 'all');
  for (const [batch, count] of [['lot1', 200], ['lot2', 176], ['lot3', 122]]) {
    assert.match(await page.locator(`#expansion-batch option[value="${batch}"]`).innerText(), new RegExp(`${count} références`));
  }
  record('Four real saved witnesses and all three published batch controls are present');

  mark('Disjoint public batch union and empty third-lot fleet');
  const batches = {};
  for (const batch of ['lot1', 'lot2', 'lot3', 'all']) {
    await filter('ME3', 'me3', 'weapon', batch);
    batches[batch] = await page.locator('#expansion-record option').evaluateAll(nodes => nodes.map(node => node.value).filter(Boolean));
  }
  assert.ok(['lot1', 'lot2', 'lot3'].every(batch => batches[batch].length > 0));
  const union = [...batches.lot1, ...batches.lot2, ...batches.lot3];
  assert.equal(new Set(union).size, union.length); assert.deepEqual([...batches.all].sort(), [...union].sort());
  report.batchFilter = { mediaId: 'ME3', family: 'weapon', ...batches };
  await filter('ME3', 'me3', 'fleet');
  assert.equal(await page.locator('#expansion-record').isDisabled(), true);
  assert.match(await page.locator('.expansion-workshop').innerText(), /Aucune référence de ce lot/);
  assert.equal(await action('expansion-run').count(), 0);
  record('All is the exact union of three disjoint weapon batches; zero new fleet records are fabricated');

  mark('Every context/family listing and all 122 third-lot cards through public selectors');
  const listingKeys = new Map();
  for (const card of EXPANSION3_ENTRIES) for (const scope of card.availability) for (const periodId of scope.periodIds) {
    listingKeys.set(`${scope.mediaId}:${periodId}:${card.mode}`, { mediaId: scope.mediaId, periodId, family: card.mode });
  }
  // Empty neighboring contexts exercise the MEA prologue and APEX boundary too.
  for (const periodId of ['mea', 'mea-prologue', 'mea-apex']) for (const family of ['actor', 'armor', 'weapon', 'enemy']) {
    listingKeys.set(`MEA:${periodId}:${family}`, { mediaId: 'MEA', periodId, family });
  }
  for (const { mediaId, periodId, family } of listingKeys.values()) {
    await filter(mediaId, periodId, family);
    const expected = EXPANSION3_ENTRIES.filter(card => card.mode === family && canAccessContent(card.id, { mediaId, periodId }).ok).map(card => card.id).sort();
    const observed = await page.locator('#expansion-record option').evaluateAll(nodes => nodes.map(node => node.value).filter(Boolean).sort());
    assert.deepEqual(observed, expected, `${mediaId}/${periodId}/${family}: exact contextual listing`);
    report.contextListings.push({ mediaId, periodId, family, expected, observed });
  }
  for (const card of EXPANSION3_ENTRIES) {
    const { mediaId, periodId } = firstContext(card), edition = card.constraints?.editionProfile || 'standard';
    await choose(mediaId, periodId, card.mode, card.id, { edition });
    const expectedOpen = !!card.simulation && !card.blockedReason;
    const row = { recordId: card.id, mediaId, periodId, family: card.mode, edition, executable: expectedOpen };
    if (!expectedOpen) {
      await buttonStyle(true);
      row.reason = await page.locator('[data-expansion-record] .universe-lock').innerText();
      assert.equal(row.reason, card.blockedReason);
      assert.equal(await page.locator('.expansion-result').count(), 0);
      report.blocked.push({ ...row });
    } else {
      const kind = card.bench ? 'equipment-bench' : 'atb';
      const result = await run(card.id, kind);
      row.resultTextSha256 = result.textSha256;
      if (card.mode === 'weapon') {
        assert.match(result.rows[0][3], /^\d+(?:[.,]\d+)? \+ \d+(?:[.,]\d+)? en réserve$/);
        report.weapons.push({ recordId: card.id, resource: result.rows[0][3], textSha256: result.textSha256 });
      }
      if (card.mode === 'enemy') report.enemies.push({ recordId: card.id, edition, textSha256: result.textSha256 });
      if (card.bench?.kind === 'medical') {
        assert.match(await page.locator('[data-expansion-medical-resource]').innerText(), /2 équipiers.*une dose consommée.*ordre refusé.*ATB prête/);
        assert.equal(await page.locator('[data-expansion-primary-source]').getAttribute('href'), card.primaryEvidence.url);
        assert.ok(await page.locator('.expansion-result details li').count() > 0);
        const numbers = label => {
          const found = result.rows.find(row => row[0] === label); assert.ok(found, `${card.id}: ${label}`);
          return found.slice(1, 4).map(value => Number(value.replace(',', '.')));
        };
        assert.deepEqual(numbers('Doses partagées'), [1, 1, 0]);
        assert.deepEqual(numbers('Équipiers KO relevés'), [0, 0, 2]);
        assert.deepEqual(numbers('Santé de l’équipier A'), [0, 0, 36]);
        assert.deepEqual(numbers('Santé de l’équipier B'), [0, 0, 54]);
        assert.deepEqual(numbers('Santé du témoin conscient'), [70, 70, 70]);
        assert.deepEqual(numbers('Témoin explicitement exclu'), [0, 0, 0]);
        assert.deepEqual(numbers('ATB du secouriste'), [100, 100, 0]);
        assert.match(result.text, /Unité|Premiers secours/);
        report.benches.push({ recordId: card.id, type: 'medical', rows: result.rows, textSha256: result.textSha256 });
      }
    }
    report.cards.push(row); await isolated();
    if (report.cards.length % 20 === 0) console.log(JSON.stringify({ cardsVerified: report.cards.length, total: 122, lastRecordId: card.id }));
  }
  assert.equal(report.cards.length, 122); assert.equal(report.cards.filter(card => card.executable).length, 38);
  assert.equal(report.blocked.length, 84); assert.equal(report.weapons.length, 18); assert.equal(report.enemies.length, 15); assert.equal(report.benches.length, 2);
  assert.equal(report.trials.filter(trial => trial.kind === 'atb').length, 36);
  record('All 122 contextual cards verified: 36 real duels, two native medical benches, 84 explicit closures', {
    cards: report.cards.length, contextListings: report.contextListings.length, duels: 36, medicalBenches: 2, closed: 84 });

  mark('Prepared Legendary profiles and historical medical consultations');
  for (const card of EXPANSION3_ENTRIES.filter(card => card.simulation && card.constraints?.editionProfile === 'legendary')) {
    const { mediaId, periodId } = firstContext(card);
    await choose(mediaId, periodId, card.mode, card.id, { edition: 'standard' }); await buttonStyle(true);
    const reason = await page.locator('[data-expansion-record] .universe-lock').innerText(); assert.match(reason, /Legendary/);
    await page.locator('#expansion-edition').selectOption('legendary'); await buttonStyle(false);
    assert.equal(await page.locator('.expansion-result').count(), 0);
    assert.equal(await page.locator('#expansion-edition option[value="deluxe"]').count(), 0);
    report.editionGates.push({ recordId: card.id, refused: 'standard', reason, allowed: 'legendary' });
  }
  assert.equal(report.editionGates.length, 6);
  await closed('ME2', 'me2', 'armor', 'ME2-EQP-MEDIGEL', /Réanimation.*non raccordée/, 'lot2');
  await closed('ME3', 'me3', 'armor', 'ME3-EQP-MEDIGEL', /ne reconstitue pas.*médi-gel/, 'lot2');
  record('Six prepared Legendary profiles refuse Standard; two historical medigel dossiers remain closed');

  mark('Exact seeded replay of the public native medical result');
  await choose('ME2', 'me2', 'armor', 'ME2-POW-UNITY');
  const first = await run('ME2-POW-UNITY', 'equipment-bench', 107), repeat = await run('ME2-POW-UNITY', 'equipment-bench', 107);
  assert.equal(first.text, repeat.text); assert.deepEqual(first.rows, repeat.rows);
  report.replay = { recordId: 'ME2-POW-UNITY', seed: 107, firstSha256: first.textSha256, repeatSha256: repeat.textSha256 };
  record('Same seed exactly reproduces the complete displayed medical result');

  mark('Four actual third-lot families on desktop and mobile390');
  for (const item of visualCases) await visual('desktop', item);
  record('Four desktop families have source/reference and real result captures with readable table tokens');
  await page.setViewportSize({ width: 390, height: 844 });
  for (const item of visualCases) await visual('mobile', item);
  await closed('MEA', 'mea', 'enemy', 'MEA-ENM-OBSERVER', /allégeance/);
  await action('expansion-run').scrollIntoViewIfNeeded(); await capture('mobile-closed-observer');
  assert.equal(report.captureArtifacts.length, 19);
  record('Four mobile families remain within the viewport; medical and weapon tables scroll locally to the right');

  mark('Real reload and unchanged ME1/manual/Chronicle storage');
  await isolated(); await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined'); await isolated();
  await action('chronicles').click(); await page.locator('.universe-screen').waitFor();
  await context('ME2', 'me2'); await action('universe-tab', 'session').click();
  assert.equal(await page.locator('#chronicle-scenario').inputValue(), 'me2-equipment-workshop'); await isolated();
  report.storageAfter = Object.entries(await storage()).map(([key, content]) => ({ key, bytes: Buffer.byteLength(content), sha256: sha(content) }));
  assert.deepEqual(report.storageAfter, report.storageBefore);
  await page.waitForLoadState('networkidle'); await Promise.all(pendingResources);
  if (mode === 'production') {
    assert.ok(report.servedBundles.length > 0); assert.ok(report.servedCSS.length > 0);
    assert.ok(report.requestedScripts.every(address => !new URL(address).pathname.startsWith('/src/') && !address.includes('/@vite/')));
    record('Actual HTTP200 production scripts/images/styles match dist hashes with no source imports or harness', {
      bundles: report.servedBundles.length, pngs: report.servedPNGs.length, css: report.servedCSS.length });
  }
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []);
  for (const source of report.sources) assert.equal(sha(await readFile(new URL(source.path, root))), source.sha256, `${source.path}: frozen throughout the complete run`);
  for (const capture of report.captureArtifacts) assert.equal(sha(await readFile(new URL(capture.path, root))), capture.sha256);
  record('All four real save witnesses survive every study, context change and reload with sources frozen');
  report.passed = true; report.stage = 'complete';
} catch (error) {
  report.failure = { message: error.message, stack: error.stack };
  if (page) await capture('failure').catch(() => {});
  console.error(error); process.exitCode = 1;
} finally {
  await browser?.close(); const content = JSON.stringify(report, null, 2) + '\n';
  await writeFile(new URL(filename, out), content); await writeFile(new URL(`docs/qa/${filename}`, root), content);
  console.log(JSON.stringify({ passed: report.passed, report: `docs/qa/${filename}`, sha256: sha(content), checks: report.checks.length,
    cards: report.cards.length, trials: report.trials.length, benches: report.benches.length, weapons: report.weapons.length, captures: report.captureArtifacts.length }));
}
