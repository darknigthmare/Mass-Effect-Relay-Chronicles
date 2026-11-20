import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { comicArcFields } from '../src/comic-field-arcs.js';
import { comicIssueFields } from '../src/comic-field-issues.js';
import { getComicField, listComicFields, createChronicle, decodeChronicle, encodeChronicle,
  chronicleStorageKey, runChronicleFieldAction } from '../src/chronicles.js';
import { getUniverseWork } from '../src/universe-data.js';
import { SAVE_KEY } from '../src/state.js';

const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4332/');
const dist = resolve(process.env.P0_BUILD_DIR || '/tmp/relay-comics-fields-proof-dist');
const output = process.env.P0_COMIC_FIELDS_REPORT || 'docs/qa/p0-comic-fields-browser.json';
const prefix = process.env.P0_COMIC_FIELDS_PREFIX || 'p0-comic-fields';
assert.match(prefix, /^[a-z0-9-]+$/);
const sha = value => createHash('sha256').update(value).digest('hex');
const definitions = [...comicArcFields, ...comicIssueFields];
assert.equal(definitions.length, 9, 'Nine declared field interventions are expected.');
const sources = ['src/main.js', 'src/chronicles.js', 'src/continuity.js', 'src/universe-data.js', 'src/universe-ui.js',
  'src/comic-field.js', 'src/comic-field-ui.js', 'src/comic-field-arcs.js', 'src/comic-field-issues.js',
  'src/comic-briefings.js', 'src/comic-briefing-ui.js', 'src/comic-library.css', 'scripts/p0-comic-fields-browser.mjs'];
const catalogues = new Map();
for (const mediaId of new Set(definitions.map(field => field.mediaId))) {
  const file = getUniverseWork(mediaId).catalogPath, bytes = await readFile(file);
  catalogues.set(mediaId, { file, sha256: sha(bytes), data: JSON.parse(bytes) }); sources.push(file);
}
const hashes = async () => Object.fromEntries(await Promise.all(sources.map(async file => [file, sha(await readFile(file))])));
async function tree(directory, prefixPath = '') {
  const files = {};
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const relative = join(prefixPath, item.name), absolute = join(directory, item.name);
    if (item.isDirectory()) Object.assign(files, await tree(absolute, relative));
    else { const bytes = await readFile(absolute); files[relative] = { bytes: bytes.length, sha256: sha(bytes) }; }
  }
  return files;
}
await mkdir(dirname(output), { recursive: true });
await mkdir('docs/screenshots', { recursive: true });
await mkdir(`docs/qa/${prefix}`, { recursive: true });
const report = { passed: false, generatedAt: new Date().toISOString(),
  baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), url: url.href, dist,
  command: { script: 'node scripts/p0-comic-fields-browser.mjs', environment: { GAME_URL: url.href, P0_BUILD_DIR: dist, P0_COMIC_FIELDS_REPORT: output, P0_COMIC_FIELDS_PREFIX: prefix } },
  sourceHashes: await hashes(), finalSourceHashes: {}, sourceFrozen: false,
  distFiles: await tree(dist), finalDistFiles: {}, distFrozen: false,
  checks: [], partial: [], cases: [], nativeChecks: [], captures: [], exports: [], servedFiles: {}, sourceRequests: [],
  errors: [], consoleErrors: [], failedRequests: [], warnings: [],
  scope: 'Nine original comic field exercises on the actual production build: eighteen public routes, gated movement/work, returns, per-dossier checkpoint reload, optional versus omitted note, read versus skipped summary, common outcome and isolated campaign/documentary state.',
  limitations: ['These are explicitly labelled original interventions, with local crews, plans and actions; they do not reproduce published panels or dialogue.',
    'Catalogue descriptions, criteria and source natures are retained verbatim. Incursion MAIN/CHOICE remain partial while their exact REF dependency is Defined.',
    'Storage is read only from the browser to compare real public saves; no private application state, DOM injection, clock manipulation or QA harness is used.',
    'The campaign isolation baseline is a fresh campaign created through the public controls; its prologue is not traversed.'] };
const browser = await chromium.launch({ headless: true,
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
page.setDefaultTimeout(25000);
const verification = new Map();
const action = (name, id, scope = page) => scope.locator(`[data-do="${name}"]${id === undefined ? '' : `[data-id="${id}"]`}`);
const paper = id => page.locator(`[data-comic-field="${id}"]`);
const phase = id => paper(id).getAttribute('data-field-phase');
const bytesFor = context => page.evaluate(key => localStorage.getItem(key), chronicleStorageKey(context.context || context));
const campaignBytes = () => page.evaluate(key => localStorage.getItem(key), SAVE_KEY);
const withoutFields = session => { const { comicFields, ...rest } = session; return rest; };
const otherFields = (session, id) => Object.fromEntries(Object.entries(session.comicFields || {}).filter(([key]) => key !== id));
const click = async locator => { await locator.waitFor({ state: 'visible' }); assert.equal(await locator.isEnabled(), true); await locator.click(); };
async function stored(context) { const bytes = await bytesFor(context); const session = bytes && decodeChronicle(bytes); assert.ok(session, `${context.mediaId}/${context.periodId} must have an actual public save`); return session; }
async function context(context) {
  await page.locator('#chronicle-media').selectOption(context.mediaId);
  await page.locator('#chronicle-period').selectOption(context.periodId);
  await click(action('universe-tab', 'reading'));
}
async function open(field) { await context(field); await click(action('comic-field-open', field.id)); await paper(field.id).waitFor(); }
async function reload(field, expected) {
  await page.reload({ waitUntil: 'domcontentloaded' }); await click(action('chronicles')); await open(field);
  assert.deepEqual(await stored(field), expected, `${field.id} public reload`);
}
async function exported(field, label) {
  const [download] = await Promise.all([page.waitForEvent('download'), click(action('chronicle-export', undefined, paper(field.id)))]);
  const file = `docs/qa/${prefix}/${field.id}-${label}.json`;
  await download.saveAs(file); assert.equal(await download.failure(), null);
  const bytes = await readFile(file), session = decodeChronicle(bytes.toString()); assert.ok(session);
  report.exports.push({ field: field.id, label, file, sha256: sha(bytes) }); return session;
}
async function capture(field, suffix = 'field') {
  const file = `docs/screenshots/${prefix}-${field.id}-${suffix}.png`;
  await paper(field.id).locator('[data-field-team]').scrollIntoViewIfNeeded();
  const bytes = await page.screenshot({ path: file });
  report.captures.push({ field: field.id, phase: await phase(field.id), file, sha256: sha(bytes), viewport: page.viewportSize() });
}
page.on('pageerror', error => report.errors.push(error.message));
page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
page.on('console', message => {
  if (message.type() !== 'error') return;
  const record = { text: message.text(), location: message.location() };
  const location = new URL(record.location.url || url.href);
  if (location.origin === url.origin && location.pathname === '/favicon.ico'
    && ['Failed to load resource: the server responded with a status of 404 (Not Found)',
      'Failed to load resource: the server responded with a status of 404 (File not found)'].includes(record.text)) report.warnings.push(record);
  else report.consoleErrors.push(record);
});
page.on('request', request => { const target = new URL(request.url()); if (target.origin !== url.origin || /^\/(?:src|@vite|@fs)\//.test(target.pathname)) report.sourceRequests.push(request.url()); });
page.on('response', response => {
  const target = new URL(response.url()), file = target.pathname.slice(1) || 'index.html';
  if (target.origin !== url.origin) return;
  if (response.status() >= 400 && !(file === 'favicon.ico' && response.status() === 404)) report.errors.push(`${response.status()} ${file}`);
  if (response.status() !== 200 || verification.has(file) || !/^(?:index\.html|assets\/[^/]+\.(?:js|css))$/.test(file)) return;
  verification.set(file, response.body().then(async bytes => {
    assert.equal(sha(bytes), report.distFiles[file]?.sha256, `Actually served ${file}`);
    report.servedFiles[file] = { sha256: sha(bytes), bytes: bytes.length };
  }).catch(error => report.errors.push(error.message)));
});

try {
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  // Publicly create a real independent campaign baseline, then leave it at title.
  await click(action('new')); await page.locator('#commander-name').fill('BD2 Isolation'); await click(action('begin'));
  await click(page.locator('.dialogue [data-do="dialogue-choice"]').first());
  await page.locator('#transition.active').waitFor({ state: 'hidden' });
  await click(action('pause')); await click(action('quit')); await click(action('chronicles'));
  const campaign = await campaignBytes(); assert.ok(campaign); report.campaignBaselineSHA256 = sha(campaign);
  // A separately saved tactical Chronicle must also remain byte-identical.
  const foreign = { mediaId: 'ME2', periodId: 'me2' };
  await context(foreign); assert.equal(await page.locator('[data-comic-field-list]').count(), 0);
  await click(action('universe-tab', 'session')); await click(action('chronicle-start')); await click(action('chronicle-save'));
  const foreignBytes = await bytesFor(foreign); assert.ok(foreignBytes); report.foreignBaselineSHA256 = sha(foreignBytes);

  for (let dossierIndex = 0; dossierIndex < definitions.length; dossierIndex++) {
    const definition = definitions[dossierIndex], fieldContext = { mediaId: definition.mediaId, periodId: definition.periodId };
    const field = getComicField(fieldContext, definition.id);
    assert.ok(field, `Compiled field ${definition.id}`);
    assert.ok(listComicFields(fieldContext).some(item => item.id === field.id));
    await open(field); assert.equal(await phase(field.id), 'plan');
    const baseline = await exported(field, 'before');
    const initialOtherFields = otherFields(baseline, field.id);
    const team = await paper(field.id).locator('[data-field-team]').textContent();
    assert.ok(team.includes(field.team[0]) && team.includes(field.team[1]));
    for (const route of field.routes) {
      const button = action('comic-field-route', route.id, paper(field.id));
      const text = await button.textContent(); assert.ok(text.includes(route.label) && text.includes(route.detail));
    }
    assert.equal(await paper(field.id).locator('[data-field-result]').count(), 0);
    assert.equal(await action('comic-field-finish', undefined, paper(field.id)).count(), 0);
    assert.equal(await paper(field.id).locator('[data-do="comic-field-move"]:enabled').count(), 0);
    const fresh = createChronicle(field.context), routed = runChronicleFieldAction(fresh, field.id, 'route', field.routes[0].id);
    assert.equal(routed.ok, true);
    for (const [name, value] of [['finish', 'archive'], ['work', field.routes[0].path[1]], ['move', field.routes[0].path.at(-1)]]) {
      const before = encodeChronicle(routed.session); assert.equal(runChronicleFieldAction(routed.session, field.id, name, value).ok, false); assert.equal(encodeChronicle(routed.session), before);
    }
    assert.equal(runChronicleFieldAction(createChronicle(foreign), field.id, 'route', field.routes[0].id).ok, false);
    report.nativeChecks.push({ field: field.id, passed: true, checks: ['early-finish', 'wrong-work', 'unearned-exit', 'foreign-context'], scope: 'Native domain checks, separate from browser commands.' });
    const routes = [];
    for (let routeIndex = 0; routeIndex < 2; routeIndex++) {
      const route = field.routes[routeIndex];
      if (routeIndex) { await click(action('comic-field-restart', undefined, paper(field.id))); assert.equal(await phase(field.id), 'plan'); }
      await click(action('comic-field-route', route.id, paper(field.id)));
      let snapshot = await stored(field);
      assert.deepEqual(withoutFields(snapshot), withoutFields(baseline));
      assert.deepEqual(otherFields(snapshot, field.id), initialOtherFields);
      assert.equal(await action('comic-field-move', route.path[1], paper(field.id)).isDisabled(), true);
      assert.equal(await paper(field.id).locator('[data-field-result]').count(), 0);
      for (let index = 0; index < route.path.length; index++) {
        const node = route.path[index];
        assert.equal(await paper(field.id).locator('[data-field-position]').getAttribute('data-field-position'), node);
        if (node === field.optional.nodeId && routeIndex === 0) await click(action('comic-field-optional', undefined, paper(field.id)));
        await click(action('comic-field-work', node, paper(field.id)));
        if (index === 0) {
          await click(action('comic-field-move', route.path[1], paper(field.id)));
          if (routeIndex === 0) {
            // Public backtracking and list return before the per-dossier reload.
            await click(action('comic-field-move', route.path[0], paper(field.id)));
            await click(action('comic-field-move', route.path[1], paper(field.id)));
            snapshot = await stored(field);
            await click(action('comic-field-back', undefined, paper(field.id))); await click(action('comic-field-open', field.id));
            assert.deepEqual(await stored(field), snapshot);
            await reload(field, snapshot); assert.equal(await phase(field.id), 'field');
            await capture(field);
          }
        } else if (index < route.path.length - 1) await click(action('comic-field-move', route.path[index + 1], paper(field.id)));
      }
      assert.equal(await phase(field.id), 'summary');
      const summary = paper(field.id).locator('.comic-summary details');
      if (routeIndex === 0) { await click(summary.locator('summary')); assert.equal(await summary.locator('p').isVisible(), true); }
      else assert.equal(await summary.locator('p').isVisible(), false);
      const expected = getComicField(field.context, field.id, (await stored(field)).comicFields[field.id]).result;
      await click(action('comic-field-finish', routeIndex ? 'skip' : 'archive', paper(field.id)));
      assert.equal(await phase(field.id), 'resolved');
      const result = { title: (await paper(field.id).locator('[data-field-result] h5').textContent()).trim(),
        text: (await paper(field.id).locator('[data-field-result] p').textContent()).trim() };
      assert.deepEqual(result, expected);
      assert.equal(await paper(field.id).locator('[data-field-team]').textContent(), team);
      snapshot = await stored(field);
      assert.deepEqual(snapshot.comicFields[field.id], { route: route.id, position: route.path.length - 1, cleared: route.path.length, extra: routeIndex === 0, closed: true });
      assert.deepEqual(withoutFields(snapshot), withoutFields(baseline)); assert.deepEqual(otherFields(snapshot, field.id), initialOtherFields);
      assert.equal(await campaignBytes(), campaign); assert.equal(await bytesFor(foreign), foreignBytes);
      assert.ok(decodeChronicle(encodeChronicle(snapshot)));
      if (dossierIndex === 0) { await reload(field, snapshot); assert.equal(await phase(field.id), 'resolved'); assert.equal((await paper(field.id).locator('[data-field-result] p').textContent()).trim(), result.text); }
      routes.push({ id: route.id, path: route.path, result, team, finish: routeIndex ? 'skip' : 'archive', extra: routeIndex === 0, persisted: true });
    }
    assert.deepEqual(routes[0].result, routes[1].result); assert.equal(routes[0].team, routes[1].team);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
    if (dossierIndex === 0) { await page.setViewportSize({ width: 430, height: 900 }); await capture(field, 'mobile-result'); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true); await page.setViewportSize({ width: 1280, height: 900 }); }
    if (dossierIndex === definitions.length - 1) await capture(field, 'result');
    const testCase = { id: field.id, mediaId: field.mediaId, periodId: field.periodId, passed: true,
      checkpointReload: true, resultReload: dossierIndex === 0, routes, factsAndCampaignUnchanged: true,
      sourceNatures: field.anchors.map(anchor => ({ id: anchor.id, category: anchor.category })) };
    report.cases.push(testCase);
    const rows = catalogues.get(field.mediaId).data.entries;
    for (const id of [field.objectiveId, field.objectiveId.replace(/-MAIN$/, '-CHOICE')]) {
      const row = rows.find(entry => entry.id === id); assert.ok(row);
      const missing = row.dependencies.filter(id => { const dependency = rows.find(entry => entry.id === id); return dependency?.status !== 'Validé' && id !== field.objectiveId; });
      const candidate = { id, passed: true, exactDescription: row.description, exactCriterion: row.acceptance,
        mediaId: field.mediaId, periodId: field.periodId, priority: row.priority, fieldId: field.id,
        observations: ['Two public field routes with their full descriptions before selection.', 'Controls and adjacent moves are required; return/list/reload preserve progress.', 'Optional/archive versus omitted/skip converge to the same result and crew; campaign, other Chronicle and documentary facts remain unchanged.'] };
      if (missing.length || field.mediaId === 'INC' || id === 'HOM-SC-TALI-TRACE-CHOICE') report.partial.push({ ...candidate, complete: false, missingDependencies: missing,
        reason: id === 'HOM-SC-TALI-TRACE-CHOICE'
          ? 'The longer detour and decoy have no consumed resource recorded by the current engine; this choice remains Prototype.'
          : 'The exact REF dependency is still Defined; no documentary reference or complete objective is promoted by this browser exercise.' });
      else report.checks.push(candidate);
    }
    console.log(JSON.stringify({ field: field.id, passed: true, completed: report.cases.length, total: definitions.length }));
    await click(action('comic-field-back', undefined, paper(field.id)));
  }
  await Promise.all(verification.values());
  assert.ok(Object.keys(report.servedFiles).some(file => /^assets\/universe-ui-.+\.js$/.test(file)));
  assert.deepEqual(report.errors, []); assert.deepEqual(report.consoleErrors, []); assert.deepEqual(report.failedRequests, []); assert.deepEqual(report.sourceRequests, []);
  report.finalSourceHashes = await hashes(); assert.deepEqual(report.finalSourceHashes, report.sourceHashes); report.sourceFrozen = true;
  report.finalDistFiles = await tree(dist); assert.deepEqual(report.finalDistFiles, report.distFiles); report.distFrozen = true;
  assert.equal(report.cases.length, 9); assert.equal(report.checks.length, 15); assert.equal(report.partial.length, 3);
  report.passed = true;
} catch (error) { report.failure = error.stack || String(error); process.exitCode = 1; }
finally {
  await browser.close(); await Promise.allSettled(verification.values());
  await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ passed: report.passed, cases: report.cases.length, checks: report.checks.length, partial: report.partial.length, captures: report.captures.length, output, failure: report.failure }));
}
