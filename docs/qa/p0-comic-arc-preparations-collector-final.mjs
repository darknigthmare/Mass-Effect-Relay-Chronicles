// Public archive controls only; no injected state, DOM, clock, storage or harness.
import assert from 'node:assert/strict';
import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { decodeChronicle } from '../../src/chronicles.js';
import { comicArcBriefings } from '../../src/comic-arc-briefings.js';
import { getUniverseWork } from '../../src/universe-data.js';
const url = 'http://127.0.0.1:4332/', build = '/tmp/relay-comics-fields-proof-dist', output = 'docs/qa/p0-comic-arc-preparations.json';
try { await access(output); throw Error('Preserve the previous report; use a new collector/output for another attempt.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const sha = value => createHash('sha256').update(value).digest('hex');
async function tree(directory, prefix = '') {
  const entries = {};
  for (const item of await readdir(directory, { withFileTypes: true })) {
    if (item.isDirectory()) Object.assign(entries, await tree(`${directory}/${item.name}`, `${prefix}${item.name}/`));
    else entries[prefix + item.name] = sha(await readFile(`${directory}/${item.name}`));
  }
  return entries;
}
const ids = ['red-approche-de-liaison', 'inv-briefing-commun', 'dis-fiche-de-couverture'];
const catalogueIds = ['RED-SC-PURSUIT-MAIN', 'INV-SC-ALLIANCE-MAIN', 'DIS-SC-01-COVER-MAIN'];
const sourcePaths = ['src/comic-arc-briefings.js', 'src/comic-briefings.js', 'src/comic-briefing-ui.js', 'src/chronicles.js', 'src/continuity.js', 'src/main.js', 'src/universe-data.js', 'tests/comic-arc-preparations.test.js', 'docs/qa/p0-comic-arc-preparations-collector-final.mjs'];
async function sources() { const result = {}; for (const path of sourcePaths) result[path] = sha(await readFile(path)); return result; }
const report = { passed: false, title: 'Trois préparations d’archives · Prototype', generatedAt: new Date().toISOString(), baseCommit: '645043ed4d006c59520279a9908b5a7835fd19c9', url, build,
  scope: 'Three original archive preparations, proposed Prototype only; no complete P0 or P1 field/choice/dialogue/prop/cinematic criterion is closed by this report.',
  checks: [], exports: [], captures: [], errors: [], consoleErrors: [], resourceWarnings: [], servedFiles: {}, sourceRequests: [],
  native: { command: 'node --test tests/comic-arc-preparations.test.js tests/comic-arc-briefings.test.js tests/comic-short-briefings.test.js tests/comic-issue-briefings.test.js', observedTests: 25, observedPass: 25, newTests: 10, status: 'Passed before this browser run' },
  sourceAccess: JSON.parse(await readFile('/tmp/p0-comic-arc-sources/fetch.json', 'utf8')),
  limitations: ['Three Prototype MAIN proposals, zero P0 closed. Only original archive preparation phases are tested.', 'The two methods are ordering pieces and reviewing their classification. They are not two playable field routes or the catalogued strategy choices.', 'Summary reading/skip does not implement the cinematic criterion, a cockpit view, character dialogue or a field arrival.', 'The narrative source pages attempted in this task returned proxy 403. Existing documentary anchors retain their old provenance; no newly verified source statement or comic quotation is claimed.', 'INV alliance and DIS cover scene references remain unverified; no exact named alliance, alias, interview or source scene is recreated.', 'The public browser begins with no ME1 save. The valid ME1 witness is covered separately by native tests.'] };
let browser, page; const responses = new Map();
const action = (name, id) => page.locator(`[data-do="${name}"]${id === undefined ? '' : `[data-id="${id}"]`}`).first();
const scene = () => page.locator('[data-comic-briefing]');
async function open(def) { await page.locator('#chronicle-media').selectOption(def.mediaId); await page.locator('#chronicle-period').selectOption(def.periodId); await action('universe-tab', 'reading').click(); await action('comic-briefing-open', def.id).click(); await scene().waitFor(); }
async function capture(label) { const path = `docs/qa/p0-comic-arc-preparations-${label}.png`, bytes = await scene().screenshot({ animations: 'disabled' }); await writeFile(path, bytes, { flag: 'wx' }); report.captures.push({ path, sha256: sha(bytes), label }); }
async function exported(label) {
  const [download] = await Promise.all([page.waitForEvent('download'), action('chronicle-export').click()]);
  const bytes = await readFile(await download.path()), session = decodeChronicle(bytes.toString()); assert.ok(session);
  const path = `docs/qa/p0-comic-arc-preparations-${label}-export.json`; await writeFile(path, bytes, { flag: 'wx' });
  report.exports.push({ path, sha256: sha(bytes), context: session.context, comicProgress: session.comicProgress }); return session;
}
const outside = ({ comicProgress, ...state }) => state;
try {
  report.sourceHashes = await sources(); report.compiledFiles = await tree(build);
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio'] });
  page = await browser.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true }); page.setDefaultTimeout(30000);
  page.on('pageerror', error => report.errors.push(error.message)); page.on('requestfailed', request => report.errors.push(request.url()));
  page.on('request', request => { const target = new URL(request.url()); if (target.origin === new URL(url).origin && /^\/(?:src|@vite|@fs)\//.test(target.pathname)) report.sourceRequests.push(target.href); });
  page.on('console', message => { if (message.type() !== 'error') return; const item = { text: message.text(), location: message.location() }, target = item.location.url && new URL(item.location.url); if (target?.origin === new URL(url).origin && target.pathname === '/favicon.ico' && ['Failed to load resource: the server responded with a status of 404 (Not Found)', 'Failed to load resource: the server responded with a status of 404 (File not found)'].includes(item.text)) report.resourceWarnings.push(item); else report.consoleErrors.push(item); });
  page.on('response', response => {
    const target = new URL(response.url()), path = target.pathname.slice(1) || 'index.html'; if (target.origin !== new URL(url).origin) return;
    if (response.status() >= 400 && path !== 'favicon.ico') report.errors.push(`${response.status()} ${path}`);
    if (response.status() !== 200 || responses.has(path) || !/^(?:index\.html|assets\/[^/]+\.(?:js|css))$/.test(path)) return;
    responses.set(path, response.body().then(bytes => { assert.equal(sha(bytes), report.compiledFiles[path], path); report.servedFiles[path] = sha(bytes); }).catch(error => report.errors.push(error.message)));
  });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  assert.equal(await page.evaluate(() => Object.hasOwn(window, '__RELAY_TEST__')), false);
  const campaignBefore = await page.evaluate(() => localStorage.getItem('relay-chronicles.save.v1')); assert.equal(campaignBefore, null);
  await action('chronicles').click();
  for (let index = 0; index < ids.length; index++) {
    const def = comicArcBriefings.find(entry => entry.id === ids[index]); assert.ok(def); await open(def);
    assert.equal(await scene().getAttribute('data-comic-phase'), 'select'); assert.equal(await scene().locator('[data-comic-receipt]').count(), 0);
    assert.match(await scene().innerText(), /Exercice d’archives · Adaptation/);
    await capture(`${def.mediaId.toLowerCase()}-select`);
    await action('comic-briefing-method', 'trace').click(); await action('comic-briefing-optional').click(); await action('comic-briefing-pick', 0).click();
    const checkpoint = await exported(`${def.mediaId.toLowerCase()}-checkpoint`);
    assert.deepEqual(checkpoint.comicProgress[def.id], { method: 'trace', step: 1, extra: true, closed: false });
    await page.reload({ waitUntil: 'domcontentloaded' }); await action('chronicles').click(); await open(def);
    assert.equal(await scene().getAttribute('data-comic-phase'), 'trace');
    assert.deepEqual(await exported(`${def.mediaId.toLowerCase()}-resumed`), checkpoint);
    await action('comic-briefing-pick', 1).click(); await action('comic-briefing-pick', 2).click();
    assert.equal(await scene().getAttribute('data-comic-phase'), 'summary');
    const summary = scene().locator('.comic-summary details'); await summary.locator('summary').click(); assert.equal((await summary.locator('p').innerText()).trim(), def.resolution);
    await action('comic-briefing-finish', 'archive').click(); await scene().locator('[data-comic-receipt] summary').click();
    assert.equal((await scene().locator('[data-comic-receipt] p').innerText()).trim(), def.receipt);
    const trace = await exported(`${def.mediaId.toLowerCase()}-trace-complete`);
    await action('comic-briefing-restart').click(); assert.equal(await scene().locator('[data-comic-receipt]').count(), 0);
    await action('comic-briefing-method', 'review').click(); await action('comic-briefing-pick', def.review.answer).click();
    await action('comic-briefing-finish', 'skip').click(); await scene().locator('[data-comic-receipt] summary').click();
    assert.equal((await scene().locator('[data-comic-receipt] p').innerText()).trim(), def.receipt); await capture(`${def.mediaId.toLowerCase()}-receipt`);
    const review = await exported(`${def.mediaId.toLowerCase()}-review-complete`);
    assert.deepEqual(outside(trace), outside(checkpoint)); assert.deepEqual(outside(review), outside(trace));
    assert.deepEqual(review.comicProgress[def.id], { method: 'review', step: 1, extra: false, closed: true });
    const catalogue = JSON.parse(await readFile(getUniverseWork(def.mediaId).catalogPath, 'utf8')), row = catalogue.entries.find(entry => entry.id === catalogueIds[index]);
    report.checks.push({ id: row.id, briefingId: def.id, passed: true, checkedPhase: 'Original archive preparation only', proposedStatus: 'Prototype', exactDescription: row.description, exactCriterion: row.acceptance,
      fullCriterionPassed: false, p0Closed: false, receipt: def.receipt,
      covered: ['Both archive methods complete and give the same original preparation receipt.', 'Public checkpoint export, real reload and resumed export are identical.', 'Optional text read versus ignored and summary read versus skipped preserve actors, equipment and outside information.'],
      remaining: index === 0 ? ['The field arrival at the base and the short exposed route versus sheltered detour are not implemented by this archive.', 'No character dialogue, cockpit framing, navigation prop or cinematic is certified.'] : index === 1 ? ['Petrovsky/Aria cooperation remains unverified in the scene reference.', 'This original service briefing does not perform the catalogued joint field action or named character dialogue.'] : ['The exact story alias and interview scene remain unverified.', 'This original fictional presentation does not recreate the published cover interview or its character knowledge state.'] });
    await action('comic-briefing-back').click(); console.log(JSON.stringify({ id: row.id, preparationPassed: true, proposedStatus: 'Prototype', fullCriterionPassed: false }));
  }
  assert.equal(await page.evaluate(() => localStorage.getItem('relay-chronicles.save.v1')), campaignBefore); report.browserCampaignStorageUntouched = true;
  await Promise.all(responses.values()); report.finalSourceHashes = await sources(); assert.deepEqual(report.finalSourceHashes, report.sourceHashes); report.sourceFrozen = true;
  report.finalCompiledFiles = await tree(build); assert.deepEqual(report.finalCompiledFiles, report.compiledFiles); report.distFrozen = true;
  assert.deepEqual(report.sourceRequests, []); assert.deepEqual(report.errors, []); assert.deepEqual(report.consoleErrors, []); assert.equal(report.checks.length, 3);
  report.passed = true;
} catch (error) { report.failure = error.stack || String(error); process.exitCode = 1; }
finally { await browser?.close(); report.browserClosed = true; await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' }); }
console.log(JSON.stringify({ passed: report.passed, report: output, checks: report.checks.length, captures: report.captures.length, exports: report.exports.length, failure: report.failure }));
