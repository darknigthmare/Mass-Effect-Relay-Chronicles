import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Public DOM only. This runner works against dev or dist: no /src imports,
// development harness, state injection, storage writes or simulated outcomes.
const mode = process.env.EXPANSION_QA_MODE === 'production' ? 'production' : 'dev';
const entry = new URL(process.env.GAME_URL || (mode === 'production' ? 'http://127.0.0.1:4174' : 'http://127.0.0.1:4173'));
const root = new URL('../', import.meta.url), out = new URL('test-results/', root);
const reportName = mode === 'production' ? 'expansion-production-report.json' : 'expansion-browser-report.json';
await mkdir(out, { recursive: true });
await mkdir(new URL('docs/qa/', root), { recursive: true });
await mkdir(new URL('docs/screenshots/', root), { recursive: true });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sourcePaths = ['scripts/expansion-browser.mjs', 'src/expansion.js', 'src/expansion-ui.js',
  'src/expansion-characters.js', 'src/expansion-armor.js', 'src/expansion-weapons.js',
  'src/expansion-fleet.js', 'src/expansion-enemies.js', 'src/main.js', 'src/universe-ui.js',
  'src/universe-ui.css', 'src/combat.js', 'src/universe-data.js'];
const report = {
  passed: false, at: new Date().toISOString(), mode, entry: entry.href, stage: 'prepare',
  scope: 'Public DOM checks of the independent Simulation tab, seeded ATB and logistics samples, closed references, edition restrictions, mobile overflow and byte-identical ME1/Chronicle storage. Not canonical mission reproduction, original numerical fidelity or complete artistic validation.',
  checks: [], trials: [], closed: [], captureArtifacts: [], errors: [], failedRequests: [], sources: [],
  requestedScripts: [], servedBundles: [], requestedPNGs: [], servedPNGs: [],
};
for (const path of sourcePaths) {
  const bytes = await readFile(new URL(path, root));
  report.sources.push({ path, bytes: bytes.length, sha256: sha(bytes) });
}
let browser, page, baselineStorage;
const pendingBodies = [], reservedScripts = new Set();
const mark = stage => { report.stage = stage; console.log(JSON.stringify({ stage })); };
const record = (name, details = {}) => { report.checks.push({ name, ...details }); console.log(JSON.stringify({ check: name })); };
const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
const storage = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])));
const assertStorage = async label => assert.deepEqual(await storage(), baselineStorage, label);
async function screenshot(name) {
  const filename = `expansion-${mode}-${name}.png`, path = new URL(filename, out);
  await page.screenshot({ path: fileURLToPath(path), fullPage: false, timeout: 60000 });
  const destination = new URL(`docs/screenshots/${filename}`, root);
  await copyFile(path, destination);
  const bytes = await readFile(destination);
  report.captureArtifacts.push({ path: `docs/screenshots/${filename}`, bytes: bytes.length, sha256: sha(bytes) });
}
async function context(mediaId, periodId) {
  if (await page.locator('#chronicle-media').inputValue() !== mediaId) await page.locator('#chronicle-media').selectOption(mediaId);
  if (await page.locator('#chronicle-period').inputValue() !== periodId) await page.locator('#chronicle-period').selectOption(periodId);
}
async function choose(mediaId, periodId, family, id, edition = 'standard') {
  await context(mediaId, periodId);
  await action('universe-tab', 'expansion').click();
  await page.locator('#expansion-mode').selectOption(family);
  assert.equal(await page.locator(`#expansion-record option[value="${id}"]`).count(), 1, `${id}: reference exists in this exact context`);
  await page.locator('#expansion-record').selectOption(id);
  await page.locator('#expansion-edition').selectOption(edition);
  await page.locator(`[data-expansion-record="${id}"]`).waitFor();
  const detail = page.locator('[data-expansion-record]');
  assert.ok((await detail.locator('.expansion-notes li').count()) > 0, 'The sample has visible notes');
  assert.ok((await detail.locator('.expansion-limits li').count()) > 0, 'The sample has visible limitations');
  assert.ok((await detail.locator('a[href^="https://"]').count()) > 0, 'Existing documentary source links are inspectable');
  return detail;
}
async function seed(value) {
  await page.locator('#expansion-seed').fill(String(value));
  await page.locator('#expansion-seed').press('Tab');
  assert.equal(await page.locator('#expansion-seed').inputValue(), String(value));
}
async function run(id, expectedKind, options = {}) {
  await seed(options.seed ?? 17);
  await page.locator('#expansion-difficulty').selectOption(options.difficulty ?? 'normal');
  assert.equal(await action('expansion-run').isEnabled(), true, id);
  const old = await page.locator('.expansion-result').count() ? await page.locator('.expansion-result').elementHandle() : null;
  await action('expansion-run').click();
  const result = page.locator('.expansion-result'); await result.waitFor();
  if (old) { assert.equal(await old.evaluate(element => element.isConnected), false); await old.dispose(); }
  const text = await result.innerText(), caption = await result.locator('caption').innerText();
  const rows = await result.locator('tbody tr').allTextContents();
  assert.equal(await page.locator('[data-expansion-record]').getAttribute('data-expansion-record'), id);
  if (expectedKind === 'logistics') {
    assert.match(caption, /Trois étapes/); assert.ok(rows.length >= 1 && rows.length <= 3);
    assert.match(text, /Parcours abstrait/); assert.match(text, /ni carburant/);
    assert.doesNotMatch(text, /secondes ATB|Journal de l’épreuve/);
  } else {
    assert.match(caption, /État final/); assert.ok(rows.length >= 2);
    assert.match(text, /\d+(?:[.,]\d+)? secondes ATB · \d+ ordres/);
    assert.match(text, /sans récompense ni conséquence de campagne/);
    assert.ok(await result.locator('details li').count() > 0, 'The native ATB result includes an actual action log');
    assert.match(text, /victorieuse|victorieux|Limite de 90 secondes/);
  }
  const evidence = { recordId: id, kind: expectedKind, seed: options.seed ?? 17,
    difficulty: options.difficulty ?? 'normal', edition: await page.locator('#expansion-edition').inputValue(),
    headline: await result.locator('h4').innerText(), rows: rows.map(row => row.trim()), textSha256: sha(text) };
  report.trials.push(evidence);
  await assertStorage(`Running ${id} never changes campaign, manual or Chronicle storage`);
  return { text, evidence };
}
async function closed(mediaId, periodId, family, id, expectedReason, edition = 'standard') {
  const detail = await choose(mediaId, periodId, family, id, edition);
  assert.equal(await action('expansion-run').isDisabled(), true, `${id}: a closed card cannot execute`);
  const reason = await detail.locator('.universe-lock').innerText(); assert.match(reason, expectedReason);
  assert.equal(await page.locator('.expansion-result').count(), 0);
  report.closed.push({ recordId: id, edition, reason }); await assertStorage(`Inspecting ${id} is read-only`);
}
async function createWitnesses() {
  await page.goto(entry.href, { waitUntil: 'networkidle' });
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  await page.getByRole('button', { name: /Nouvelle campagne/ }).click();
  await page.locator('#commander-name').fill('Jane Simulation');
  await page.locator('#new-appearance').selectOption('female');
  await page.getByRole('button', { name: /Commencer l’aventure/ }).click();
  await page.getByRole('button', { name: 'Je rejoins le briefing.' }).click();
  await page.locator('.location h2').filter({ hasText: 'Normandy' }).waitFor();
  await page.keyboard.press('Escape'); await action('manual-saves').click();
  await page.locator('#manual-save-name-1').fill('ME1 témoin Simulation'); await action('manual-save', '1').click();
  assert.equal(await page.locator('[data-save-slot="1"]').getAttribute('data-status'), 'saved');
  await action('manual-back').click(); await action('save').click(); await action('chronicles').click();
  await page.locator('.universe-screen').waitFor();
  for (const [mediaId, periodId, scenarioId] of [['ME2', 'me2', 'me2-equipment-workshop'], ['ME3', 'me3', 'me3-equipment-workshop']]) {
    await context(mediaId, periodId); await action('universe-tab', 'session').click();
    await page.locator('#chronicle-scenario').selectOption(scenarioId); await action('chronicle-start').click();
    await action('chronicle-save').click();
  }
  baselineStorage = await storage();
  assert.ok(baselineStorage['relay-chronicles.save.v1']);
  assert.ok(Object.keys(baselineStorage).some(key => key.startsWith('relay-chronicles.manual-save.v1.')));
  assert.ok(baselineStorage['relay-chronicles.chronicle.ME2.me2.v1']);
  assert.ok(baselineStorage['relay-chronicles.chronicle.ME3.me3.v1']);
  report.storageWitnesses = Object.entries(baselineStorage).map(([key, value]) => ({ key, bytes: Buffer.byteLength(value), sha256: sha(value) }));
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
  page.on('request', request => {
    if (request.resourceType() === 'script') report.requestedScripts.push(request.url());
    if (new URL(request.url()).pathname.endsWith('.png')) report.requestedPNGs.push(request.url());
  });
  page.on('response', response => {
    if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`);
    const address = new URL(response.url());
    const kind = address.pathname.endsWith('.js') ? 'script' : address.pathname.endsWith('.png') ? 'png' : null;
    if (mode !== 'production' || address.origin !== entry.origin || !kind
      || response.status() !== 200 || reservedScripts.has(address.pathname)) return;
    reservedScripts.add(address.pathname);
    pendingBodies.push((async () => {
      const path = `dist${address.pathname}`, expected = await readFile(new URL(path, root));
      const observed = await response.body();
      assert.equal(sha(observed), sha(expected), `${path}: served bytes match the actual build`);
      (kind === 'png' ? report.servedPNGs : report.servedBundles).push({ path, status: 200, bytes: observed.length, sha256: sha(observed) });
    })().catch(error => { report.failedRequests.push(`Production bundle inspection: ${error.message}`); }));
  });
  mark('Create genuine campaign, manual-save and two independent Chronicle witnesses');
  await createWitnesses(); record('A real ME1 save, manual slot and two Chronicle saves establish byte-level isolation witnesses');

  mark('Eight mixed ATB samples across actor, armor, weapon and enemy families');
  const cases = [
    ['ME2', 'me2', 'actor', 'ME2-NPC-RENEGAR'], ['MEA', 'mea', 'actor', 'MEA-NPC-KANDROS'],
    ['ME2', 'me2', 'armor', 'ME2-EQP-N7'], ['MEA', 'mea', 'armor', 'MEA-EQP-PATHFINDER'],
    ['ME3', 'me3', 'weapon', 'ME3-WPN-FALCON'], ['MEA', 'mea', 'weapon', 'MEA-WPN-KROGAN-HAMMER'],
    ['ME3', 'me3', 'enemy', 'ME3-ENM-PHANTOM'], ['MEA', 'mea', 'enemy', 'MEA-ENM-INVICTOR'],
  ];
  for (let index = 0; index < cases.length; index++) {
    const [mediaId, periodId, family, id] = cases[index]; await choose(mediaId, periodId, family, id);
    await run(id, 'atb', { seed: 17 + index }); await screenshot(`atb-${family}-${id.toLowerCase()}`);
  }
  record('Eight real public-button ATB exercises cover four combat families with inspectable existing sources and limitations', { exercises: cases.length });

  mark('Seed reproducibility, different seed and difficulty controls');
  await choose('ME3', 'me3', 'enemy', 'ME3-ENM-CENTURION');
  const first = await run('ME3-ENM-CENTURION', 'atb', { seed: 107 });
  const repeated = await run('ME3-ENM-CENTURION', 'atb', { seed: 107 });
  assert.equal(repeated.text, first.text, 'The same public inputs reproduce the complete displayed ATB result');
  let different;
  for (const value of [108, 109, 110, 111, 112]) {
    different = await run('ME3-ENM-CENTURION', 'atb', { seed: value });
    // Exclude the input/seed sentence so changing its label cannot satisfy this.
    if (JSON.stringify(different.evidence.rows) !== JSON.stringify(first.evidence.rows)) break;
  }
  assert.notDeepEqual(different.evidence.rows, first.evidence.rows, 'A different seed changes actual final actor/resource rows');
  const hard = await run('ME3-ENM-CENTURION', 'atb', { seed: 107, difficulty: 'hard' });
  assert.notDeepEqual(hard.evidence.rows, first.evidence.rows, 'Difficulty changes actual final rows');
  record('Identical seeds reproduce displayed outcomes, while another seed and hard difficulty change actual final rows', { sameSeed: 107, differentSeed: different.evidence.seed });

  mark('Fleet samples use logistics rather than infantry combat');
  await choose('ME2', 'me2', 'fleet', 'ME2-ZON-NORMANDY-CIC');
  const fleetFirst = await run('ME2-ZON-NORMANDY-CIC', 'logistics', { seed: 305 });
  const fleetRepeated = await run('ME2-ZON-NORMANDY-CIC', 'logistics', { seed: 305 });
  assert.equal(fleetRepeated.text, fleetFirst.text);
  await screenshot('logistics-normandy');
  record('A ship reference runs three reproducible abstract logistical stages with no infantry actors or fuel claim');

  mark('DLC, civilian and edition restrictions remain explicit');
  await closed('ME2', 'me2', 'enemy', 'ME2-ENM-VASIR', /DLC.*non attesté/);
  await closed('ME2', 'me2', 'enemy', 'ME2-ENM-VASIR', /DLC.*non attesté/, 'legendary');
  await closed('ME3', 'me3', 'actor', 'ME3-NPC-TRAYNOR', /Inspection seulement.*combattant/);
  await closed('ME2', 'me2', 'weapon', 'ME2-WPN-CAIN', /cellules|réserve|charge/);
  await closed('ME3', 'me3', 'armor', 'ME3-EQP-AJAX', /Legendary Edition/);
  await choose('ME3', 'me3', 'armor', 'ME3-EQP-AJAX', 'legendary');
  await run('ME3-EQP-AJAX', 'atb', { seed: 417 }); await screenshot('edition-legendary-armor');
  await closed('MEA', 'mea', 'armor', 'MEA-EQP-SCAVENGER', /Deluxe/);
  await choose('MEA', 'mea', 'armor', 'MEA-EQP-SCAVENGER', 'deluxe');
  await run('MEA-EQP-SCAVENGER', 'atb', { seed: 418 });
  record('DLC and noncombat roles stay closed; exact Legendary and Deluxe preparation controls gate their own references', { closedCases: report.closed.length });

  mark('No foreign work or prologue samples leak into another selected context');
  await context('ME3', 'me3-prologue'); await action('universe-tab', 'expansion').click();
  await page.locator('#expansion-mode').selectOption('enemy');
  assert.equal(await page.locator('#expansion-record option[value="ME3-ENM-PHANTOM"]').count(), 0);
  assert.equal(await page.locator('[data-expansion-record]').count(), 0);
  await context('MEA', 'mea'); await action('universe-tab', 'expansion').click();
  await page.locator('#expansion-mode').selectOption('enemy');
  assert.equal(await page.locator('#expansion-record option[value="ME3-ENM-PHANTOM"]').count(), 0);
  await assertStorage('Changing work or prologue only changes inspection state');
  record('Foreign enemy identities and main-campaign enemies are absent from other titles and the ME3 prologue');

  mark('Mobile 390px controls, result tables and limitations');
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileViews = [];
  for (const [mediaId, periodId, family, id] of [
    ['ME2', 'me2', 'actor', 'ME2-NPC-RENEGAR'],
    ['MEA', 'mea', 'armor', 'MEA-EQP-PATHFINDER'],
    ['ME3', 'me3', 'weapon', 'ME3-WPN-FALCON'],
    ['MEA', 'mea', 'enemy', 'MEA-ENM-INVICTOR'],
    ['ME2', 'me2', 'fleet', 'ME2-ZON-NORMANDY-CIC'],
  ]) {
    await choose(mediaId, periodId, family, id);
    await run(id, family === 'fleet' ? 'logistics' : 'atb', { seed: 509 });
    const overflow = await page.evaluate(() => {
      const nodes = ['.universe-screen', '.expansion-workshop', '.expansion-detail', '#expansion-mode', '#expansion-record', '#expansion-seed', '#expansion-edition'];
      return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
        nodes: nodes.map(selector => { const node = document.querySelector(selector), r = node?.getBoundingClientRect();
          return { selector, left: r?.left, right: r?.right, width: r?.width }; }),
        tables: [...document.querySelectorAll('.expansion-table-scroll')].map(node => ({ clientWidth: node.clientWidth, scrollWidth: node.scrollWidth, overflowX: getComputedStyle(node).overflowX })) };
    });
    assert.ok(overflow.scrollWidth <= overflow.width + 1, `Document overflow: ${JSON.stringify(overflow)}`);
    for (const node of overflow.nodes) assert.ok(node.width > 0 && node.left >= -1 && node.right <= overflow.width + 1, JSON.stringify(node));
    assert.ok(overflow.tables.every(table => table.overflowX === 'auto'));
    await screenshot(`mobile-${family}-result`);
    await page.locator('[data-expansion-record]').evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await screenshot(`mobile-${family}-reference`);
    mobileViews.push({ family, recordId: id, ...overflow });
  }
  record('At 390px, all five families keep controls in the viewport and result tables scroll locally', { views: mobileViews });

  mark('Reload preserves complete ME1 and Chronicle save bytes');
  await assertStorage('All public exercises leave every stored value unchanged');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  await assertStorage('Actual reload leaves the complete independent storage witnesses byte-identical');
  await action('chronicles').click(); await page.locator('.universe-screen').waitFor();
  await context('ME2', 'me2'); await action('universe-tab', 'session').click();
  assert.equal(await page.locator('#chronicle-scenario').inputValue(), 'me2-equipment-workshop');
  await assertStorage('Restoring the saved preparation from the title does not rewrite it');
  report.storageWitnessesAfter = Object.entries(await storage()).map(([key, value]) => ({ key, bytes: Buffer.byteLength(value), sha256: sha(value) }));
  assert.deepEqual(report.storageWitnessesAfter, report.storageWitnesses);
  record('ME1 autosave, manual slot and both Chronicle sessions survive all trials, context changes and reload byte-identically');
  await page.waitForLoadState('networkidle');
  await Promise.all(pendingBodies);
  if (mode === 'production') {
    assert.ok(report.servedBundles.length > 0, 'Real production bundles were served and hashed');
    assert.ok(report.requestedScripts.every(url => !new URL(url).pathname.startsWith('/src/') && !url.includes('/@vite/')),
      'The production exercise never imports source modules or a Vite development client');
    record('Production HTTP executes the real hashed dist bundles without source imports or a development harness', {
      bundles: report.servedBundles.length, pngs: report.servedPNGs.length,
    });
  }
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []);
  for (const source of report.sources) assert.equal(sha(await readFile(new URL(source.path, root))), source.sha256, `${source.path}: reviewed sources stay frozen during the run`);
  report.passed = true; report.stage = 'complete';
} catch (error) {
  report.failure = { message: error.message, stack: error.stack };
  if (page) await screenshot('failure').catch(() => {});
  console.error(error); process.exitCode = 1;
} finally {
  await browser?.close();
  const bytes = JSON.stringify(report, null, 2) + '\n';
  await writeFile(new URL(reportName, out), bytes);
  await writeFile(new URL(`docs/qa/${reportName}`, root), bytes);
  console.log(JSON.stringify({ passed: report.passed, report: `docs/qa/${reportName}`, sha256: sha(bytes), checks: report.checks.length, trials: report.trials.length }));
}
