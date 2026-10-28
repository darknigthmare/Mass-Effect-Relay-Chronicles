import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

// Public DOM only, for both dev and dist. No /src runtime import, harness,
// application setter, artificial outcome or direct browser-storage write.
const mode = process.env.EXPANSION_QA_MODE === 'production' ? 'production' : 'dev';
const entry = new URL(process.env.GAME_URL || (mode === 'production' ? 'http://127.0.0.1:4174' : 'http://127.0.0.1:4173'));
const root = new URL('../', import.meta.url), out = new URL('test-results/', root);
const filename = mode === 'production' ? 'expansion2-production-report.json' : 'expansion2-browser-report.json';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
for (const directory of ['test-results/', 'docs/qa/', 'docs/screenshots/']) await mkdir(new URL(directory, root), { recursive: true });
const sources = ['scripts/expansion2-browser.mjs', 'src/expansion.js', 'src/expansion-ui.js', 'src/expansion-bench.js',
  ...['characters', 'armor', 'weapons', 'fleet', 'enemies'].flatMap(group => [`src/expansion-${group}.js`, `src/expansion2-${group}.js`]),
  'src/main.js', 'src/universe-ui.js', 'src/universe-ui.css', 'src/combat.js', 'src/continuity.js', 'src/universe-data.js',
  'src/universe-equipment.js', 'src/universe-weapon-profiles.js', 'src/tool-data.js'];
const report = {
  passed: false, at: new Date().toISOString(), mode, entry: entry.href, stage: 'prepare',
  command: `GAME_URL=${entry.origin} EXPANSION_QA_MODE=${mode} PLAYWRIGHT_EXECUTABLE_PATH=${process.env.PLAYWRIGHT_EXECUTABLE_PATH || '(Playwright default)'} node scripts/expansion2-browser.mjs`,
  scope: 'Second independent Simulation lot: public batch/context controls, nine native equipment benches, forty existing conventional weapon profiles, APEX/prologue boundaries, closed references, seeded exercises, desktop/mobile layout and unchanged real ME1/manual/Chronicle storage. New dossiers reuse explicit ATB mechanisms; no new canonical missions, source statistics or artistic fidelity are certified.',
  sources: [], preservation: [], checks: [], trials: [], benches: [], weapons: [], blocked: [], layouts: [],
  captureArtifacts: [], requestedScripts: [], servedBundles: [], servedPNGs: [], servedCSS: [], errors: [], failedRequests: [],
};
for (const path of sources) {
  const bytes = await readFile(new URL(path, root)); report.sources.push({ path, bytes: bytes.length, sha256: sha(bytes) });
}
for (const path of ['src/expansion-characters.js', 'src/expansion-armor.js', 'src/expansion-weapons.js',
  'src/expansion-fleet.js', 'src/expansion-enemies.js', 'src/combat.js', 'src/chronicles.js', 'src/continuity.js']) {
  const before = execFileSync('git', ['show', `64c305f:${path}`], { cwd: fileURLToPath(root) });
  const current = await readFile(new URL(path, root)); assert.equal(sha(current), sha(before), `${path}: preserved from the lot-one checkpoint`);
  report.preservation.push({ path, baseCommit: '64c305f', sha256: sha(current) });
}
const weaponIDs = {
  ME2: ['PREDATOR', 'CARNIFEX', 'SHURIKEN', 'TEMPEST', 'AVENGER', 'VINDICATOR', 'KATANA', 'SCIMITAR', 'MANTIS', 'VIPER'],
  ME3: ['AVENGER', 'MATTOCK', 'PHAESTON', 'SABER', 'GETH-RIFLE', 'PREDATOR', 'PHALANX', 'CARNIFEX', 'PALADIN', 'KATANA',
    'SCIMITAR', 'EVISCERATOR', 'DISCIPLE', 'MANTIS', 'BLACK-WIDOW', 'SHURIKEN'],
  MEA: ['AVENGER', 'MATTOCK', 'VALKYRIE', 'PREDATOR', 'CARNIFEX', 'PHALANX', 'EAGLE', 'CHARGER', 'KATANA', 'DISCIPLE', 'PIRANHA', 'MANTIS', 'VIPER', 'VANQUISHER'],
};
const benchCases = [
  ['ME1', 'me1', 'EQP-omni-outil', 'tool'], ['ME1', 'me1', 'EQP-amplificateur-biotique', 'tool'],
  ['ME2', 'me2', 'ME2-EQP-THERMAL', 'thermal-clips'], ['ME3', 'me3', 'ME3-EQP-BARREL', 'barrel'],
  ['ME3', 'me3', 'ME3-EQP-MAGAZINE', 'magazine'], ['ME3', 'me3', 'ME3-EQP-ULTRALIGHT', 'ultralight'],
  ['ME3', 'me3', 'ME3-EQP-GRENADE-STOCK', 'finite'], ['ME3', 'me3', 'ME3-EQP-THERMAL', 'thermal-clips'],
  ['MEA', 'mea', 'MEA-EQP-POWER-CELLS', 'finite'],
];
const visualCases = [
  ['ME3', 'me3', 'actor', 'ME3-NPC-JACOB', 'atb'], ['ME3', 'me3', 'armor', 'ME3-EQP-MAGAZINE', 'equipment-bench'],
  ['ME2', 'me2', 'weapon', 'ME2-WPN-PREDATOR', 'atb'], ['GAL', 'gal', 'fleet', 'GAL-LOC-JADE', 'logistics'],
  ['INF', 'inf', 'enemy', 'INF-ENM-X1', 'atb'],
];
let browser, page, baseline;
const pendingResources = [], reservedResources = new Set();
const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
const mark = stage => { report.stage = stage; console.log(JSON.stringify({ stage })); };
const record = (name, details = {}) => { report.checks.push({ name, ...details }); console.log(JSON.stringify({ check: name })); };
const storage = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])));
const isolated = async () => assert.deepEqual(await storage(), baseline, 'Independent trials preserve all existing save bytes');
async function capture(name) {
  const nameWithMode = `expansion2-${mode}-${name}.png`, path = new URL(nameWithMode, out);
  await page.screenshot({ path: fileURLToPath(path), fullPage: false, timeout: 60000 });
  const destination = new URL(`docs/screenshots/${nameWithMode}`, root); await copyFile(path, destination);
  const bytes = await readFile(destination); report.captureArtifacts.push({ path: `docs/screenshots/${nameWithMode}`, bytes: bytes.length, sha256: sha(bytes) });
}
async function context(mediaId, periodId) {
  if (await page.locator('#chronicle-media').inputValue() !== mediaId) await page.locator('#chronicle-media').selectOption(mediaId);
  if (await page.locator('#chronicle-period').inputValue() !== periodId) await page.locator('#chronicle-period').selectOption(periodId);
}
async function filter(mediaId, periodId, family, batch = 'lot2') {
  await context(mediaId, periodId); await action('universe-tab', 'expansion').click();
  await page.locator('#expansion-batch').selectOption(batch); await page.locator('#expansion-mode').selectOption(family);
}
async function choose(mediaId, periodId, family, id, { batch = 'lot2', edition = 'standard' } = {}) {
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
    assert.match(text, /Banc d’équipement/); assert.match(caption, /Ordres natifs/);
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
const value = text => Number(text.replace(',', '.'));
async function verifyBench([mediaId, periodId, id, type]) {
  await choose(mediaId, periodId, 'armor', id); const result = await run(id, 'equipment-bench');
  const row = label => { const found = result.rows.find(row => row[0] === label); assert.ok(found, `${id}: ${label}`); return found.slice(1, 4).map(value); };
  if (type === 'finite') {
    assert.deepEqual(row('Charges disponibles'), [3, 0, 0]); assert.deepEqual(row('Ordres exécutés'), [0, 3, 3]);
    assert.match(await page.locator('[data-expansion-finite-resource]').innerText(), /Trois usages exécutés.*quatrième ordre refusé.*Aucune charge restituée/);
  } else if (['thermal-clips', 'magazine'].includes(type)) {
    const capacity = row('Capacité du chargeur'), ammo = row('Munitions chargées'), reserve = row('Réserve restante');
    assert.equal(ammo[0], 0); assert.ok(ammo[1] > 0 && ammo[2] > 0);
    assert.equal(ammo[0] + reserve[0], ammo[1] + reserve[1]); assert.equal(ammo[0] + reserve[0], ammo[2] + reserve[2]);
    if (type === 'magazine') { assert.deepEqual(capacity, [23, 18, 23]); assert.deepEqual(reserve, [90, 72, 67]); }
    else assert.equal(capacity[1], capacity[2]);
  } else if (type === 'ultralight') {
    assert.deepEqual(row('Recharge du pouvoir'), [0, 8, 7.2]);
    for (const label of ['Santé retirée à la cible', 'Boucliers retirés à la cible']) { const values = row(label); assert.equal(values[1], values[2]); }
  } else {
    const hp = row('Santé retirée à la cible'), shields = row('Boucliers retirés à la cible');
    assert.ok(hp[2] + shields[2] > hp[1] + shields[1], `${id}: native tool/barrel has an observed effect`);
  }
  report.benches.push({ recordId: id, type, rows: result.rows });
}
async function closed(mediaId, periodId, family, id, pattern, batch = 'lot2') {
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
async function visual(viewportName, [mediaId, periodId, family, id, kind]) {
  await choose(mediaId, periodId, family, id); const enabledButton = await buttonStyle(false);
  await page.locator('[data-expansion-record]').evaluate(node => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await capture(`${viewportName}-${family}-reference`); await run(id, kind);
  await page.locator('.expansion-table-scroll').scrollIntoViewIfNeeded(); const observed = await layout(viewportName, family);
  await capture(`${viewportName}-${family}-result-left`);
  if (viewportName === 'mobile') {
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
  await page.getByRole('button', { name: /Nouvelle campagne/ }).click(); await page.locator('#commander-name').fill('Jane Deuxième lot');
  await page.getByRole('button', { name: /Commencer l’aventure/ }).click(); await page.getByRole('button', { name: 'Je rejoins le briefing.' }).click();
  await page.locator('.location h2').filter({ hasText: 'Normandy' }).waitFor(); await page.keyboard.press('Escape');
  await action('manual-saves').click(); await page.locator('#manual-save-name-1').fill('ME1 témoin Simulation lot2'); await action('manual-save', '1').click();
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
  const browserContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } }); page = await browserContext.newPage(); page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('request', request => { if (request.resourceType() === 'script') report.requestedScripts.push(request.url()); });
  page.on('response', response => {
    if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`);
    const address = new URL(response.url()), type = address.pathname.endsWith('.js') ? 'servedBundles' : address.pathname.endsWith('.png') ? 'servedPNGs' : address.pathname.endsWith('.css') ? 'servedCSS' : null;
    if (mode !== 'production' || address.origin !== entry.origin || !type || response.status() !== 200 || reservedResources.has(address.pathname)) return;
    reservedResources.add(address.pathname);
    pendingResources.push((async () => {
      const path = `dist${address.pathname}`, expected = await readFile(new URL(path, root)), bytes = await response.body();
      assert.equal(sha(bytes), sha(expected), `${path}: actual HTTP200 content matches dist`);
      report[type].push({ path, status: 200, bytes: bytes.length, sha256: sha(bytes) });
    })().catch(error => report.failedRequests.push(`Production resource: ${error.message}`)));
  });
  mark('Create genuine ME1, manual and two Chronicle witnesses'); await witnesses();
  await action('universe-tab', 'expansion').click(); assert.equal(await page.locator('#expansion-batch').inputValue(), 'all');
  assert.match(await page.locator('#expansion-batch option[value="lot1"]').innerText(), /200 références/);
  assert.match(await page.locator('#expansion-batch option[value="lot2"]').innerText(), /176 références/);
  record('Real saved witnesses and default all/200-record lot1/176-record lot2 controls are present');

  mark('Public batch filtering and all forty new conventional weapon references');
  await filter('ME2', 'me2', 'weapon', 'lot1');
  const lot1 = await page.locator('#expansion-record option').evaluateAll(nodes => nodes.map(node => node.value).filter(Boolean));
  await page.locator('#expansion-batch').selectOption('lot2');
  const lot2 = await page.locator('#expansion-record option').evaluateAll(nodes => nodes.map(node => node.value).filter(Boolean));
  await page.locator('#expansion-batch').selectOption('all');
  const all = await page.locator('#expansion-record option').evaluateAll(nodes => nodes.map(node => node.value).filter(Boolean));
  assert.ok(lot1.length && lot2.length); assert.ok(lot1.every(id => !lot2.includes(id)));
  assert.deepEqual([...all].sort(), [...lot1, ...lot2].sort());
  report.batchFilter = { mediaId: 'ME2', family: 'weapon', lot1, lot2, all };
  for (const [mediaId, suffixes] of Object.entries(weaponIDs)) {
    await filter(mediaId, mediaId.toLowerCase(), 'weapon');
    const expected = suffixes.map(suffix => `${mediaId}-WPN-${suffix}`);
    assert.deepEqual((await page.locator('#expansion-record option').evaluateAll(nodes => nodes.map(node => node.value))).sort(), [...expected].sort());
    for (const id of expected) {
      await page.locator('#expansion-record').selectOption(id); await page.locator('#expansion-edition').selectOption('standard');
      const result = await run(id, 'atb'); assert.match(result.rows[0][3], /^\d+(?:[.,]\d+)? \+ \d+(?:[.,]\d+)? en réserve$/);
      report.weapons.push({ recordId: id, resource: result.rows[0][3], textSha256: result.textSha256 });
    }
  }
  assert.equal(report.weapons.length, 40); assert.equal(new Set(report.weapons.map(item => item.recordId)).size, 40);
  record('Batch all is the exact disjoint union, and forty new exact weapon references execute with finite clip resources', { weapons: 40 });

  mark('Nine native equipment benches and two finite-charge resources');
  for (const bench of benchCases) await verifyBench(bench);
  assert.equal(report.benches.length, 9);
  record('Nine real equipment benches have five-column measured results: tools, clips, modules, grenades and power cells', { benches: report.benches.length });

  mark('APEX/prologue boundaries and independent named ship logistics');
  const apexId = 'MEA-CHR-MP-HUMAN-KINETICIST';
  await filter('MEA', 'mea', 'actor'); assert.equal(await page.locator(`#expansion-record option[value="${apexId}"]`).count(), 0);
  await filter('MEA', 'mea-prologue', 'actor'); assert.equal(await page.locator(`#expansion-record option[value="${apexId}"]`).count(), 0);
  await choose('MEA', 'mea-apex', 'actor', apexId); assert.match(await page.locator('.expansion-notes').innerText(), /Classe multijoueur.*pas une personne nommée/);
  await run(apexId, 'atb');
  await filter('MEA', 'mea', 'fleet'); assert.equal(await page.locator('#expansion-record option[value="MEA-MQ-HYPERION"]').count(), 0);
  await choose('MEA', 'mea-prologue', 'fleet', 'MEA-MQ-HYPERION'); await run('MEA-MQ-HYPERION', 'logistics');
  record('An APEX archetype is absent from solo/prologue and the Hyperion prologue occurrence never leaks into main MEA');

  mark('Existing four DLC closures and unresolved medigel/network/individual identities');
  for (const [mediaId, id] of [['ME2', 'ME2-ENM-VASIR'], ['ME2', 'ME2-ENM-BROKER'], ['ME3', 'ME3-ENM-RAMPART'], ['ME3', 'ME3-ENM-ADJUTANT']]) {
    await closed(mediaId, mediaId.toLowerCase(), 'enemy', id, /DLC.*non attesté/, 'lot1');
  }
  await closed('ME2', 'me2', 'armor', 'ME2-EQP-MEDIGEL', /Réanimation.*non raccordée/);
  await closed('ME3', 'me3', 'armor', 'ME3-EQP-MEDIGEL', /ne reconstitue pas.*médi-gel/);
  await closed('ME3', 'me3', 'enemy', 'ME3-ENM-CLONE', /DLC Citadel.*classe du joueur/);
  await closed('ME3', 'me3-multiplayer', 'enemy', 'ME3-ENM-DRAGOON', /multijoueur Retaliation/);
  await closed('MEA', 'mea', 'enemy', 'MEA-ENM-ARCHON-FINAL', /Réseau de Méridiane/);
  await closed('MEA', 'mea', 'enemy', 'MEA-ENM-SCIENTIST', /non confirmée/);
  await closed('ME2', 'me2', 'actor', 'ME2-NPC-CHAKWAS', /Inspection seulement.*médical/);
  record('DLC, medigel, class/network encounters and noncombat identities remain explicitly closed', { closedCases: report.blocked.length });

  mark('Same seed reproduces the complete displayed native result');
  await choose('ME2', 'me2', 'enemy', 'ME2-ENM-BS-CENTURION');
  const first = await run('ME2-ENM-BS-CENTURION', 'atb', 107), repeat = await run('ME2-ENM-BS-CENTURION', 'atb', 107);
  assert.equal(first.text, repeat.text);
  let different;
  for (const seed of [108, 109, 110, 111, 112]) {
    different = await run('ME2-ENM-BS-CENTURION', 'atb', seed); if (JSON.stringify(first.rows) !== JSON.stringify(different.rows)) break;
  }
  assert.notDeepEqual(first.rows, different.rows, 'Changing the seed changes actual final rows, not merely a label');
  record('Identical inputs reproduce the displayed result, while a different seed changes actual actor/resource rows', { sameSeed: 107, differentSeed: different.seed });

  mark('Five desktop families with inspectable source/reference and real result views');
  for (const item of visualCases) await visual('desktop', item);
  record('All five lot-two families have real desktop reference/result views with contrast and unbroken table tokens');
  mark('Five mobile390 families with actual local horizontal scrolling to resources');
  await page.setViewportSize({ width: 390, height: 844 });
  for (const item of visualCases) await visual('mobile', item);
  await closed('ME2', 'me2', 'actor', 'ME2-NPC-CHAKWAS', /Inspection seulement.*médical/);
  await action('expansion-run').scrollIntoViewIfNeeded(); await capture('mobile-closed-button');
  record('Mobile five-family reference/results remain legible with local table scrolling and no page overflow');

  mark('Actual reload and exact storage/source/build verification');
  await isolated(); await page.reload({ waitUntil: 'networkidle' }); assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  await isolated(); await action('chronicles').click(); await page.locator('.universe-screen').waitFor();
  await context('ME2', 'me2'); await action('universe-tab', 'session').click();
  assert.equal(await page.locator('#chronicle-scenario').inputValue(), 'me2-equipment-workshop'); await isolated();
  report.storageAfter = Object.entries(await storage()).map(([key, content]) => ({ key, bytes: Buffer.byteLength(content), sha256: sha(content) }));
  assert.deepEqual(report.storageAfter, report.storageBefore);
  await page.waitForLoadState('networkidle'); await Promise.all(pendingResources);
  if (mode === 'production') {
    assert.ok(report.servedBundles.length > 0); assert.ok(report.servedCSS.length > 0);
    assert.ok(report.requestedScripts.every(address => !new URL(address).pathname.startsWith('/src/') && !address.includes('/@vite/')));
    record('Production executes real HTTP200 dist resources with matching hashes and no source imports/harness', { bundles: report.servedBundles.length, pngs: report.servedPNGs.length, css: report.servedCSS.length });
  }
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []);
  for (const source of report.sources) assert.equal(sha(await readFile(new URL(source.path, root))), source.sha256, `${source.path}: immutable during the complete run`);
  for (const capture of report.captureArtifacts) assert.equal(sha(await readFile(new URL(capture.path, root))), capture.sha256);
  record('All existing ME1/manual/Chronicle save bytes survive every public exercise, context change and reload, with frozen sources');
  report.passed = true; report.stage = 'complete';
} catch (error) {
  report.failure = { message: error.message, stack: error.stack };
  if (page) await capture('failure').catch(() => {});
  console.error(error); process.exitCode = 1;
} finally {
  await browser?.close(); const content = JSON.stringify(report, null, 2) + '\n';
  await writeFile(new URL(filename, out), content); await writeFile(new URL(`docs/qa/${filename}`, root), content);
  console.log(JSON.stringify({ passed: report.passed, report: `docs/qa/${filename}`, sha256: sha(content), checks: report.checks.length,
    trials: report.trials.length, benches: report.benches.length, weapons: report.weapons.length, captures: report.captureArtifacts.length }));
}
