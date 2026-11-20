import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { chronicleStorageKey, createChronicle, decodeChronicle, encodeChronicle, finishChronicleBattle,
  runChronicleComicAction, startChronicleBattle } from '../src/chronicles.js';
import { comicFictionReferences, getComicBriefing, listComicBriefings } from '../src/comic-briefings.js';
import { getComicLibraryIndex, getComicLibraryTarget } from '../src/comic-library.js';
import { getTargetAvailability, getActions, performAction, tickBattle } from '../src/combat.js';
import { getUniverseRecord, getUniverseWork } from '../src/universe-data.js';
import { encodeSave, newGame, SAVE_KEY } from '../src/state.js';

const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4324/');
const build = resolve(process.env.P0_COMICS_DIST || process.env.P0_BUILD_DIR || 'dist');
const output = process.env.P0_COMICS_REPORT || 'test-results/p0-comics-runtime.json';
const captures = process.env.P0_COMICS_SCREENSHOTS;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const volumes = [[['RED', 4], ['EVO', 4], ['INV', 4], ['HOM', 4], ['INC', 1], ['INQ', 1], ['CON', 1]],
  [['FOU', 13], ['HWB', 1], ['BLA', 1]]];
const indexedWorks = volumes.flat().map(([id]) => id);
const workIds = [...indexedWorks, 'DIS', 'LIB'];
const selectedWorks = (process.env.P0_COMICS_WORKS || '').split(',').filter(Boolean);
assert.ok(selectedWorks.every(id => workIds.includes(id)), 'Unknown comic work in P0_COMICS_WORKS');
const runWork = id => !selectedWorks.length || selectedWorks.includes(id);
const catalogueSources = await Promise.all(workIds.map(async id => {
  const { catalogPath } = getUniverseWork(id);
  const bytes = await readFile(catalogPath);
  return [id, { path: catalogPath, sha256: sha256(bytes), ...JSON.parse(bytes) }];
}));
const catalogues = new Map(catalogueSources);
const sourcePaths = ['src/main.js', 'src/universe-ui.js', 'src/chronicles.js', 'src/continuity.js', 'src/comic-briefings.js',
  'src/comic-arc-briefings.js', 'src/comic-issue-briefings.js', 'src/comic-short-briefings.js', 'src/comic-library.js',
  'src/comic-briefing-ui.js', 'src/comic-library.css', 'src/universe-data.js', 'scripts/p0-comics-browser.mjs'];
const sourceHashes = async () => Object.fromEntries(await Promise.all(sourcePaths.map(async path => [path, sha256(await readFile(path))])));
const report = {
  passed: false, at: new Date().toISOString(), url: url.href,
  baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  selectedWorks: workIds.filter(runWork), sourceHashes: await sourceHashes(), checks: [], cases: [], library: null,
  catalogues: Object.fromEntries(catalogueSources.map(([id, catalogue]) => [id, {
    path: catalogue.path, sha256: catalogue.sha256,
    remaining: Object.fromEntries(['P0', 'P1'].map(priority => [priority, catalogue.entries.filter(entry => entry.priority === priority && entry.status !== 'Validé').length])),
  }])),
  served: {}, captures: [], errors: [],
  scope: 'Parcours d’archives et renvois de collection par les commandes publiques. Les éditions intégrales et les scènes d’origine restent hors de ce contrôle.',
};
const checked = (workId, id, observations) => {
  const row = catalogues.get(workId).entries.find(entry => entry.id === id);
  assert.ok(row && ['P0', 'P1'].includes(row.priority), id);
  report.checks.push({ id, priority: row.priority, passed: true, exactDescription: row.description, exactCriterion: row.acceptance, observations });
};
const contexts = id => getUniverseWork(id).periods.map(period => ({ mediaId: id, periodId: period.id }));
const documentaryState = ({ comicProgress, ...session }) => session;
const referenceRows = new Set();

function runNativeVariants(context, id) {
  const briefing = getComicBriefing(context, id);
  const starting = createChronicle(context);
  assert.ok(briefing && starting, id);
  const foreign = createChronicle({ mediaId: context.mediaId === 'RED' ? 'INV' : 'RED', periodId: context.mediaId === 'RED' ? 'inv' : 'red' });
  assert.equal(runChronicleComicAction(foreign, id, 'method', 'trace').ok, false, id);
  assert.ok(briefing.anchors.length > 0 && briefing.anchors.every(anchor => anchor.sources.length > 0), id);
  const categories = briefing.anchors.map(anchor => ({ id: anchor.id, nature: anchor.category, sources: anchor.sources.map(source => source.id) }));
  for (const { id: anchorId, nature } of categories) {
    assert.ok(['Fait établi', 'À vérifier', 'Source du repère'].includes(nature), `${id} / ${anchorId}`);
    if (nature !== 'Source du repère') assert.equal(getUniverseRecord(anchorId).nature, nature === 'Fait établi' ? 'Établi' : nature);
  }
  for (const method of ['trace', 'review']) {
    let session = starting;
    const advance = (action, value) => {
      const result = runChronicleComicAction(session, id, action, value);
      assert.equal(result.ok, true, `${id}/${method}/${action}`);
      session = result.session;
    };
    advance('method', method);
    const required = method === 'trace' ? [0, 1, 2] : [briefing.review.answer];
    const checkpoint = encodeChronicle(session);
    assert.equal(runChronicleComicAction(session, id, 'pick', (required[0] + 1) % 3).ok, false);
    assert.equal(encodeChronicle(session), checkpoint);
    assert.equal(runChronicleComicAction(session, id, 'finish', 'archive').ok, false);
    session = decodeChronicle(checkpoint);
    if (method === 'trace') {
      advance('optional');
      const optionalOnce = encodeChronicle(session);
      advance('optional');
      assert.equal(encodeChronicle(session), optionalOnce);
    }
    for (const index of required) advance('pick', index);
    const before = getComicBriefing(context, id, session.comicProgress[id]);
    assert.equal(before.phase, 'summary');
    advance('finish', method === 'trace' ? 'archive' : 'skip');
    const completed = decodeChronicle(encodeChronicle(session));
    const after = getComicBriefing(context, id, completed.comicProgress[id]);
    assert.equal(after.phase, 'resolved');
    assert.equal(after.resolution, briefing.resolution);
    assert.deepEqual(after.anchors, briefing.anchors);
    assert.deepEqual(documentaryState(completed), starting);
    assert.equal(runChronicleComicAction(completed, id, 'finish', 'archive').ok, false);
  }
  return { id, periodId: context.periodId, categories, methods: ['trace', 'review'] };
}
await mkdir(dirname(output), { recursive: true });
if (captures) await mkdir(captures, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 870 }, acceptDownloads: true });
page.setDefaultTimeout(25000);
const responses = new Map();
page.on('pageerror', error => report.errors.push(error.message));
page.on('requestfailed', request => report.errors.push(request.url()));
page.on('request', request => {
  const target = new URL(request.url());
  if (target.origin !== url.origin || /^\/(?:src|@vite|@fs)\//.test(target.pathname)) report.errors.push(request.url());
});
page.on('response', response => {
  const file = new URL(response.url()).pathname.slice(1) || 'index.html';
  if (response.status() >= 400 && file !== 'favicon.ico') report.errors.push(`${response.status()} ${file}`);
  if (response.status() !== 200 || (file !== 'index.html' && !/^assets\/[\w.-]+\.(?:css|js)$/.test(file)) || responses.has(file)) return;
  responses.set(file, response.body().then(async bytes => {
    const digest = sha256(bytes);
    assert.equal(digest, sha256(await readFile(join(build, file))), file);
    report.served[file] = digest;
  }).catch(error => report.errors.push(error.message)));
});

const action = (name, id) => page.locator(`[data-do="${name}"]${id == null ? '' : `[data-id="${id}"]`}`).first();
const media = page.locator('#chronicle-media');
const period = page.locator('#chronicle-period');
const witness = () => page.evaluate(key => localStorage.getItem(key), SAVE_KEY);
const library = page.locator('[data-comic-library]');
const briefings = page.locator('[data-comic-briefing-list]');
const scene = page.locator('[data-comic-briefing]');
const stage = () => scene.getAttribute('data-comic-phase');
const stored = context => page.evaluate(key => localStorage.getItem(key), chronicleStorageKey(context));

async function snapshot(label, locator = page) {
  if (!captures) return;
  const file = join(captures, `${label}.png`);
  const bytes = await locator.screenshot({ animations: 'disabled' });
  await writeFile(file, bytes, { flag: 'wx' });
  report.captures.push({ path: file, sha256: sha256(bytes) });
}

async function openWork(workId, periodId) {
  await media.selectOption(workId);
  if (periodId) await period.selectOption(periodId);
  await action('universe-tab', 'reading').click();
  assert.equal(await media.inputValue(), workId);
  if (periodId) assert.equal(await period.inputValue(), periodId);
}

async function loadExport() {
  const [download] = await Promise.all([page.waitForEvent('download'), action('chronicle-export').click()]);
  const bytes = await readFile(await download.path());
  const decoded = decodeChronicle(bytes.toString());
  assert.ok(decoded, 'Export de chronique rejeté par le lecteur natif');
  return { decoded, sha256: sha256(bytes) };
}

async function libraryRoutes() {
  await openWork('LIB');
  await library.waitFor();
  assert.equal(await period.isDisabled(), true);
  assert.equal(await action('chronicle-battle').count(), 0);
  assert.equal(await library.locator('[data-comic-work]').count(), 10);
  assert.equal(await library.locator('[data-comic-unit]').count(), 34);
  const links = [], indexModel = getComicLibraryIndex();
  assert.equal(indexModel.workCount, 10);
  assert.equal(indexModel.unitCount, 34);
  assert.ok(indexModel.volumes.flatMap(volume => volume.works).every(work => work.units.every(unit => unit.page === null)));

  for (const [index, works] of volumes.entries()) {
    const volume = library.locator(`[data-comic-volume="${index + 1}"]`);
    assert.deepEqual(await volume.locator('[data-comic-work]').evaluateAll(rows => rows.map(row => row.dataset.comicWork)), works.map(([id]) => id));
    for (const [id, units] of works) {
      const exhibition = volume.locator(`[data-comic-work="${id}"]`);
      assert.equal(await exhibition.count(), 1, id);
      const expected = Array.from({ length: units }, (_, index) => `${id}:${units === 1 ? 'single' : index + 1}`);
      const actual = await exhibition.locator('[data-comic-unit]').evaluateAll(rows => rows.map(row => row.dataset.comicUnit));
      assert.deepEqual(actual, expected, id);
      assert.match(await exhibition.innerText(), /(?:À vérifier|à contrôler|consultation)/i, id);
      const entry = catalogues.get('LIB').entries.find(row => row.id === `LIB-STORY-${id}`);
      const declaredPath = entry.adaptation.match(/docs\/universe\/catalogs\/[A-Z]+\.json/)?.[0];
      assert.ok(declaredPath, id);
      if (declaredPath !== catalogues.get(id).path) assert.equal(id, 'CON');
      const model = indexModel.volumes[index].works.find(work => work.id === id);
      const editionAppearances = indexModel.relatedEditions.filter(edition => edition.works.some(work => work.id === id)).map(edition => {
        const appearance = edition.works.find(work => work.id === id);
        assert.equal(appearance.id, model.id, id);
        assert.deepEqual(appearance.unitIds, model.units.map(unit => unit.id), id);
        return edition.id;
      });
      links.push({ workId: id, volume: index + 1, canonicalCatalogue: catalogues.get(id).path, units: actual, editionAppearances,
        ...(declaredPath !== catalogues.get(id).path ? { historicalPathHint: declaredPath } : {}) });
    }
  }
  assert.equal(new Set(indexedWorks).size, 10);
  const editionIds = await library.locator('[data-comic-edition]').evaluateAll(rows => rows.map(row => row.dataset.comicEdition));
  for (const id of ['omnibus-1', 'omnibus-2', 'complete-comics']) assert.ok(editionIds.includes(id), id);
  for (const link of links) {
    await action('comic-library-open', link.workId).click();
    assert.equal(await media.inputValue(), link.workId, link.workId);
    link.destinationPeriod = await period.inputValue();
    assert.deepEqual(getComicLibraryTarget(link.workId), { mediaId: link.workId, periodId: link.destinationPeriod });
    await openWork('LIB');
  }

  const discovery = library.locator('[data-comic-volume] [data-do="comic-library-open"][data-id="DIS"]');
  assert.equal(await discovery.count(), 0);
  await library.locator('[data-comic-edition="complete-comics"] > summary').click();
  await action('comic-library-open', 'DIS').click();
  assert.equal(await media.inputValue(), 'DIS');
  await openWork('LIB');
  assert.equal(await library.locator('[data-comic-unit]').count(), 34);
  const periodRoutes = [];
  for (const [id, expected] of [['FOU:13', 'fou-13'], ['HOM:2', 'hom-2-tali'], ['EVO:2', 'evo-aftermath']]) {
    await library.locator(`[data-comic-work="${id.split(':')[0]}"] .comic-library-units > summary`).click();
    await action('comic-library-open', id).click();
    assert.equal(await period.inputValue(), expected);
    periodRoutes.push({ id, period: expected });
    await openWork('LIB');
  }
  const editionLink = action('comic-library-open', 'omnibus-1/RED');
  if (await editionLink.count()) {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const editionDetails = library.locator('[data-comic-edition="omnibus-1"]');
    await editionDetails.locator('summary').focus();
    await page.keyboard.press('Enter');
    await editionLink.focus();
    await page.keyboard.press('Enter');
    assert.equal(await media.inputValue(), 'RED');
    await action('comic-library-back').focus();
    await page.keyboard.press('Enter');
    assert.equal(await media.inputValue(), 'LIB');
    assert.notEqual(await editionDetails.getAttribute('open'), null);
    assert.equal(await page.evaluate(() => document.activeElement?.dataset.id), 'omnibus-1/RED');
    checked('LIB', 'LIB-DOMAIN-ANIMATIONS', { reducedMotion: true, input: 'keyboard', restoredOccurrence: 'omnibus-1/RED' });
  }
  await snapshot('library-contents', library);
  for (const link of links) {
    checked('LIB', `LIB-STORY-${link.workId}`, link);
    if (['RED', 'INV', 'HOM', 'HWB', 'BLA'].includes(link.workId))
      checked('LIB', `LIB-DEDUP-${link.workId}`, { ...link, sameUnitAndOwnerAcrossEditions: true });
  }
  checked('LIB', 'LIB-LINK-DISCOVERY', { independentlyLinked: true, countedInVolumes: false, includedUnits: 34 });
  report.library = { uniqueWorks: 10, uniqueUnits: 34, links, periodRoutes, editionIds };
}

async function openBriefing(id) {
  await action('comic-briefing-open', id).click();
  assert.equal(await scene.getAttribute('data-comic-briefing'), id);
}

async function observeProvenance(briefing) {
  const journal = scene.locator('[data-comic-journal]');
  await journal.waitFor();
  return journalAnchors(journal, briefing, true);
}

async function journalAnchors(journal, briefing, adaptation) {
  const rows = await journal.locator('[data-comic-origin]').evaluateAll(items => items.map(item => ({
    id: item.dataset.comicAnchor, origin: item.dataset.comicOrigin,
    title: item.querySelector('h5')?.textContent, text: item.querySelector('p')?.textContent,
    reference: item.querySelector('[data-comic-reference]')?.textContent,
    links: [...item.querySelectorAll('a[data-comic-source]')].map(link => ({ id: link.dataset.comicSource, href: link.href })),
  })));
  assert.equal(rows.length, briefing.anchors.length + Number(adaptation), briefing.id);
  if (adaptation) assert.equal(rows.at(-1).origin, 'Adaptation', briefing.id);
  const facts = rows.filter(row => row.id);
  assert.deepEqual(facts.map(row => row.id), briefing.anchors.map(anchor => anchor.id), briefing.id);
  for (const [index, anchor] of briefing.anchors.entries()) {
    const row = facts[index];
    assert.equal(row.origin, anchor.category, anchor.id);
    assert.equal(row.title, anchor.title, anchor.id);
    assert.equal(row.text, anchor.description, anchor.id);
    assert.deepEqual(row.links, anchor.sources.map(source => ({ id: source.id, href: new URL(source.url).href })), anchor.id);
    if (!/-SC-.+-REF$/.test(anchor.id)) continue;
    const record = getUniverseRecord(anchor.id);
    assert.equal(row.reference, record.reference, anchor.id);
    assert.ok(row.text.trim().split(/\s+/).length <= 60, anchor.id);
    if (record.nature === 'À vérifier') assert.equal(row.origin, 'À vérifier', anchor.id);
    if (!referenceRows.has(anchor.id)) {
      checked(record.catalogWorkId, anchor.id, { briefingId: briefing.id, reference: row.reference, origin: row.origin, sources: row.links });
      referenceRows.add(anchor.id);
    }
  }
  return rows;
}

async function exerciseBriefing(context, briefing, evidence = {}) {
  const { mediaId, periodId } = context;
  await openBriefing(briefing.id);
  assert.equal(await stage(), 'select');
  const provenance = await observeProvenance(briefing);
  if (evidence.capture) await snapshot(`${mediaId.toLowerCase()}-sources`, scene.locator('[data-comic-journal]'));
  await action('comic-briefing-method', 'trace').click();
  assert.equal(await stage(), 'trace');
  await action('comic-briefing-pick', 2).click();
  assert.equal(await stage(), 'trace');
  assert.equal(decodeChronicle(await stored(context)).comicProgress[briefing.id].step, 0);
  await action('comic-briefing-optional').click();
  await action('comic-briefing-pick', 0).click();
  const checkpoint = await stored(context);
  const before = decodeChronicle(checkpoint);
  assert.deepEqual(before.comicProgress[briefing.id], { method: 'trace', step: 1, extra: true, closed: false });
  await action('chronicle-back').click();
  if (evidence.reload) await page.reload({ waitUntil: 'domcontentloaded' });
  await action('chronicles').click();
  await openWork(mediaId, periodId);
  await openBriefing(briefing.id);
  assert.equal(await stage(), 'trace');
  assert.equal(await stored(context), checkpoint);
  await action('comic-briefing-pick', 1).click();
  await action('comic-briefing-pick', 2).click();
  assert.equal(await stage(), 'summary');
  await action('comic-briefing-finish', 'archive').click();
  assert.equal(await stage(), 'resolved');
  const trace = await stored(context);
  const closedTrace = decodeChronicle(trace);
  assert.deepEqual(closedTrace.comicProgress[briefing.id], { method: 'trace', step: 3, extra: true, closed: true });
  assert.deepEqual(documentaryState(closedTrace), documentaryState(before));
  assert.ok((await scene.innerText()).includes(briefing.resolution), briefing.id);
  await action('chronicle-back').click();
  await action('chronicles').click();
  await openWork(mediaId, periodId);
  await openBriefing(briefing.id);
  assert.equal(await stage(), 'resolved');
  assert.equal(await stored(context), trace);
  assert.deepEqual(await observeProvenance(briefing), provenance);

  if (evidence.export) {
    const exported = await loadExport();
    assert.deepEqual(exported.decoded, closedTrace);
    assert.equal(exported.sha256, sha256(trace));
  }
  await action('comic-briefing-restart').click();
  assert.equal(await stage(), 'select');
  assert.equal(decodeChronicle(await stored(context)).comicProgress?.[briefing.id], undefined);
  await action('comic-briefing-method', 'review').click();
  assert.equal(await stage(), 'review');
  await action('comic-briefing-pick', briefing.review.answer).click();
  assert.equal(await stage(), 'summary');
  await action('comic-briefing-finish', 'skip').click();
  assert.equal(await stage(), 'resolved');
  const review = await stored(context);
  const closedReview = decodeChronicle(review);
  assert.deepEqual(closedReview.comicProgress[briefing.id], { method: 'review', step: 1, extra: false, closed: true });
  assert.deepEqual(documentaryState(closedReview), documentaryState(before));
  assert.ok((await scene.innerText()).includes(briefing.resolution), briefing.id);
  assert.deepEqual(await observeProvenance(briefing), provenance);
  await action('comic-briefing-back').click();
  await briefings.waitFor();
  return { mediaId, periodId, briefingId: briefing.id, provenance, beforeSha256: sha256(checkpoint),
    savedTraceSha256: sha256(trace), savedReviewSha256: sha256(review), sameResolution: true, gameplayStateUnchanged: true };
}

function combatResultPreservesEditorialState() {
  const context = { mediaId: 'RED', periodId: 'red' };
  const { id } = listComicBriefings(context)[0];
  const opened = runChronicleComicAction(createChronicle(context), id, 'method', 'trace');
  assert.equal(opened.ok, true);
  const { session } = opened, { battle } = startChronicleBattle(session);
  assert.ok(battle, 'Banc ATB Redemption absent');
  const before = getComicBriefing(context, id, session.comicProgress[id]);
  for (let index = 0; index < 1200 && !battle.winner; index += 1) {
    tickBattle(battle, .2);
    for (const actor of battle.actors.filter(candidate => candidate.team === 'party' && candidate.hp > 0)) {
      const order = getActions(battle, actor.id).find(action => ['shoot', 'reload'].includes(action.id) && action.available);
      if (!order) continue;
      const target = order.target === 'self' ? actor : battle.actors.find(candidate => candidate.team === 'enemy' && candidate.hp > 0
        && getTargetAvailability(battle, { actorId: actor.id, actionId: order.id, targetId: candidate.id }).ok);
      if (target) performAction(battle, { actorId: actor.id, actionId: order.id, targetId: target.id });
    }
  }
  assert.ok(battle.winner);
  const finished = finishChronicleBattle(session, battle);
  assert.equal(finished.ok, true, finished.reason);
  assert.deepEqual(finished.session.comicProgress, session.comicProgress);
  assert.deepEqual(getComicBriefing(context, id, finished.session.comicProgress[id]), before);
  return { scenarioId: session.scenarioId, winner: battle.winner, unchangedBriefing: id };
}

async function timelineFor(workId) {
  const timeline = page.locator('[data-comic-timeline]');
  if ((await timeline.getAttribute('open')) === null) await timeline.locator('summary').click();
  const chronicleRow = getUniverseRecord(`${workId}-CNT-PLACE`);
  const timelineText = await timeline.innerText();
  assert.ok(timelineText.includes(chronicleRow.description), workId);
  const periodIds = await timeline.locator('[data-do="comic-period"]').evaluateAll(items => items.map(item => item.dataset.id));
  const work = getUniverseWork(workId);
  assert.deepEqual(periodIds, work.periods.map(period => period.id), workId);
  for (const window of work.periods) {
    assert.ok(timelineText.includes(window.uncertainty), window.id);
    const sources = await timeline.locator(`li:has([data-do="comic-period"][data-id="${window.id}"]) a[data-comic-source]`)
      .evaluateAll(links => links.map(link => link.dataset.comicSource));
    assert.deepEqual(sources, window.sourceIds, window.id);
  }
  const related = await timeline.locator('[data-do="comic-related"]').evaluateAll(items => items.map(item => item.dataset.id));
  assert.ok(related.length > 0 && related.every(id => id !== workId && getUniverseWork(id)), workId);
  const recordDates = work.periods.map(period => [period.id, period.yearStart, period.yearEnd]);
  assert.ok(recordDates.every(([, start, end]) => start == null && end == null), workId);
  checked(workId, `${workId}-CNT-PLACE`, { periodIds, related, yearFieldsUnset: true, periodSourceGroups: work.periods.length });
}

try {
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  const campaignSave = encodeSave(newGame({ name: 'Témoin archives BD', classId: 'engineer' }));
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: SAVE_KEY, value: campaignSave });
  await action('chronicles').click();
  const combat = combatResultPreservesEditorialState();
  report.combatIsolation = combat;
  if (runWork('LIB')) await libraryRoutes();

  for (const workId of workIds.filter(id => id !== 'LIB' && runWork(id))) {
    console.log(`Contrôle des dossiers ${workId}`);
    if (workId === 'BLA') {
      await openWork(workId);
      assert.equal(await period.isDisabled(), true);
      assert.equal(await action('comic-briefing-open').count(), 0);
      assert.equal(await action('chronicle-battle').count(), 0);
      const fiction = comicFictionReferences();
      assert.equal(fiction.length, 1);
      const journal = page.locator('[data-comic-archive] [data-comic-journal]');
      const provenance = await journalAnchors(journal, fiction[0], false);
      assert.ok(provenance.every(row => row.origin === 'Fiction interne'));
      await timelineFor(workId);
      checked(workId, `${workId}-SYS-CANON`, { provenance, referencedFictionOnly: true, combat });
      continue;
    }

    const workContexts = contexts(workId);
    assert.ok(workContexts.length > 0, workId);
    const native = [];
    let exercised;
    for (const [position, context] of workContexts.entries()) {
      await openWork(workId, context.periodId);
      if (position === 0) await timelineFor(workId);
      const available = listComicBriefings(context);
      const list = await briefings.locator('[data-do="comic-briefing-open"]').evaluateAll(items => items.map(item => item.dataset.id));
      assert.ok(list.length > 0, context.periodId);
      assert.deepEqual(list, available.map(entry => entry.id), context.periodId);
      for (const { id } of available) {
        const briefing = getComicBriefing(context, id);
        const nativeCase = runNativeVariants(context, id);
        native.push(nativeCase);
        if (!exercised) {
          exercised = await exerciseBriefing(context, briefing, { reload: workId === 'FOU', capture: ['CON', 'FOU'].includes(workId), export: workId === 'RED' });
          continue;
        }
        await openBriefing(id);
        assert.equal(await stage(), 'select');
        await observeProvenance(briefing);
        await action('comic-briefing-back').click();
      }
    }
    if (workContexts.length > 1) {
      const first = workContexts[0], last = workContexts.at(-1);
      assert.notEqual(chronicleStorageKey(first), chronicleStorageKey(last));
      const firstSession = decodeChronicle(await stored(first));
      const lastBytes = await stored(last);
      assert.equal(firstSession.comicProgress[exercised.briefingId].closed, true);
      if (lastBytes) assert.equal(decodeChronicle(lastBytes).comicProgress?.[exercised.briefingId], undefined);
      assert.equal(getComicBriefing(last, exercised.briefingId), null);
    }
    assert.equal(await witness(), campaignSave, workId);
    report.cases.push({ workId, exhaustiveNative: native, publicExercise: exercised });
    checked(workId, `${workId}-SYS-SAVE`, { publicExercise: exercised.briefingId, nativeDossiers: native.length, exactlyResumedBothSides: true, noDuplicateState: true });
    checked(workId, `${workId}-SYS-CANON`, { publicDossiers: native.length, sameProvenanceAfterVariants: true, campaignAndCombatScope: combat });
  }

  if (!selectedWorks.length) assert.equal(referenceRows.size, 35, 'L’affichage doit couvrir les 35 fiches scénographiques sourcées sélectionnées.');
  report.referenceRows = [...referenceRows];
  assert.equal(await witness(), campaignSave);
  report.campaignSha256 = sha256(campaignSave);
  await Promise.all(responses.values());
  assert.ok(report.served['index.html'] && Object.keys(report.served).filter(file => file.endsWith('.js')).length > 1);
  assert.deepEqual(report.errors, []);
  assert.deepEqual(await sourceHashes(), report.sourceHashes);
  report.passed = true;
} catch (error) {
  report.failure = String(error.stack || error);
  process.exitCode = 1;
  await snapshot('failure').catch(() => {});
} finally {
  await browser.close();
  await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, cases: report.cases.length, output, failure: report.failure }));
}
