// Public documentary-reading collector, shared by development and production.
// Native modules below run in Node only. No source module or QA API is loaded
// into the page, and no browser, server or clock is created by this helper.
import assert from 'node:assert/strict';
import { createChronicle, encodeChronicle, decodeChronicle, readChroniclePage } from '../src/chronicles.js';
import { setChronicleNote } from '../src/continuity.js';
import { getChronicleStory } from '../src/chronicle-story.js';

const NOTE = 'Note témoin de fixture native ; aucune progression de récit jouée.';
const definitions = [
  { mediaId: 'REV', periodId: 'rev', storyId: 'rev-sidon' },
  { mediaId: 'ASC', periodId: 'asc', storyId: 'asc-projet' },
];

function nativeFixture(definition) {
  const session = createChronicle({ mediaId: definition.mediaId, periodId: definition.periodId });
  assert.ok(session, `Native context exists: ${definition.mediaId}/${definition.periodId}`);
  const story = getChronicleStory(definition.storyId, session.context);
  assert.ok(story && story.steps.length >= 3, 'A sourced, multi-page documentary reading exists');
  // A note needs an already discovered record. The native note transaction adds
  // exactly that record, without pretending the user has visited a reading page.
  const noted = setChronicleNote(session, story.progressRecordId, NOTE);
  assert.equal(noted.ok, true, noted.reason);
  assert.deepEqual(session.readingProgress, {});
  assert.deepEqual(session.party, []);
  assert.deepEqual(session.cleared, []);
  const encoded = encodeChronicle(session);
  assert.equal(typeof encoded, 'string');
  const normalized = decodeChronicle(encoded);
  assert.ok(normalized);
  assert.deepEqual(normalized.notes, { [story.progressRecordId]: NOTE });
  return { session: normalized, story, bytes: Buffer.from(encoded) };
}

/**
 * All clicks, option selections, downloads, imports and browser reloads use the
 * supplied public Playwright page. campaignStorage() is the parent's read-only
 * snapshot of exact ME1 storage strings; no Chronicle storage is read directly.
 *
 * Produces five public Chronicle exports and three screenshots. recordFixture
 * receives a Buffer plus a JSON-serializable provenance object, never gameplay
 * evidence. check(name) is called only after the corresponding assertions pass.
 * Returns JSON-serializable observations; callers own prefix, paths and mode.
 */
export async function exerciseReadings({
  page, action, click, capture, exportChronicle, importChronicle, check,
  campaignStorage, baselineCampaign, recordFixture,
}) {
  for (const [name, value] of Object.entries({ action, click, capture, exportChronicle,
    importChronicle, check, campaignStorage, recordFixture })) {
    assert.equal(typeof value, 'function', `Collector supplies ${name}()`);
  }
  assert.ok(page && baselineCampaign && typeof baselineCampaign === 'object');
  const observations = {
    method: 'Public controls and native JSON imports; Node-only fixture/oracle APIs.',
    fixtures: [], visits: [], sourceLinks: [], exports: [],
    boundaries: [
      'Documentary facts and page position only; no complete novel or original chapter is reconstructed.',
      'The native note witness is fixture data, not progress earned by playing.',
      'Source links are inspected as visible links; external source pages are not opened or certified.',
    ],
  };
  const sourceLinks = new Map();
  const fixture = nativeFixture(definitions[0]);
  const otherFixture = nativeFixture(definitions[1]);

  async function isolated(stage) {
    assert.deepEqual(await campaignStorage(), baselineCampaign, `${stage}: exact ME1 storage is unchanged`);
  }
  async function openChronicles() {
    if (!await page.locator('#chronicle-media').isVisible()) {
      await click(action('chronicles'));
    }
    await page.locator('#chronicle-media').waitFor({ state: 'visible' });
  }
  async function selectContext({ mediaId, periodId }) {
    // Enter Registre first so context selection itself does not visit a page.
    await click(action('universe-tab', 'references'));
    if (await page.locator('#chronicle-media').inputValue() !== mediaId) {
      await page.locator('#chronicle-media').selectOption(mediaId);
    }
    if (await page.locator('#chronicle-period').inputValue() !== periodId) {
      await page.locator('#chronicle-period').selectOption(periodId);
    }
    assert.equal(await page.locator('#chronicle-media').inputValue(), mediaId);
    assert.equal(await page.locator('#chronicle-period').inputValue(), periodId);
  }
  async function registerFixture(label, prepared) {
    const origin = {
      kind: 'native-node-fixture', played: false,
      APIs: ['createChronicle', 'setChronicleNote', 'encodeChronicle', 'decodeChronicle'],
      context: prepared.session.context, storyId: prepared.story.id,
      initialReadingProgress: {}, initialCleared: [], initialParty: [],
      initialDiscoveries: prepared.session.discovered,
      note: 'Explicit note witness on one native documentary record; no read page, reward or recruitment is fabricated.',
    };
    await recordFixture(label, prepared.bytes, origin);
    observations.fixtures.push({ label, ...origin });
  }
  function articleFor(story) {
    return page.locator(`[data-chronicle-reading="${story.id}"]`);
  }
  async function observePage(story, index, reason) {
    const article = articleFor(story), expected = story.steps[index];
    await article.waitFor({ state: 'visible' });
    assert.equal(await article.getAttribute('data-reading-index'), String(index));
    assert.equal((await article.locator('h3').innerText()).trim(), expected.title);
    assert.equal((await article.locator('.universe-reading-text').innerText()).trim(), expected.text);
    assert.equal(await page.locator('#chronicle-reading').inputValue(), story.id);
    assert.equal(await article.locator('[data-reading-source]').count(), expected.sources.length);
    for (const source of expected.sources) {
      const link = article.locator(`a[data-reading-source="${source.id}"]`);
      assert.equal(await link.count(), 1, `Source ${source.id} is an actual link`);
      assert.equal(await link.isVisible(), true, `Source ${source.id} is visible`);
      const href = await link.getAttribute('href'), url = new URL(href);
      assert.ok(['https:', 'http:'].includes(url.protocol), 'Source links use HTTP(S)');
      assert.equal(url.username, '');
      assert.equal(url.password, '');
      assert.equal(href, new URL(source.url).href);
      assert.equal(await link.getAttribute('target'), '_blank');
      const rel = new Set((await link.getAttribute('rel') || '').split(/\s+/));
      assert.ok(rel.has('noopener') && rel.has('noreferrer'));
      assert.equal((await link.innerText()).trim(), source.title);
      sourceLinks.set(`${story.id}:${source.id}`, { storyId: story.id, id: source.id,
        title: source.title, href, target: '_blank', rel: [...rel].sort(), visible: true });
    }
    observations.visits.push({ context: story.context, storyId: story.id, index, reason,
      title: expected.title, recordIds: expected.recordIds, sourceIds: expected.sources.map(source => source.id) });
    return article;
  }
  async function openReading(story) {
    await click(action('universe-tab', 'reading'));
    if (await page.locator('#chronicle-reading').inputValue() !== story.id) {
      await page.locator('#chronicle-reading').selectOption(story.id);
    }
    const open = action('chronicle-reading-open');
    const explicitOpen = await open.isVisible();
    if (explicitOpen) await click(open);
    observations.opening ||= [];
    observations.opening.push({ storyId: story.id, method: explicitOpen
      ? 'Lecture, then public Commencer la lecture button'
      : 'Public Lecture tab opens the native article directly; no Commencer la lecture button is rendered' });
  }
  function advanced(session, storyId, index) {
    const result = readChroniclePage(session, storyId, index);
    assert.equal(result.ok, true, result.reason);
    return result.session;
  }
  function assertReadingOnly(actual, base, expected) {
    assert.deepEqual(actual, expected, 'Export equals native expected result of the actual public visits');
    for (const key of Object.keys(base).filter(key => !['discovered', 'readingProgress'].includes(key))) {
      assert.deepEqual(actual[key], base[key], `Reading preserves ${key}`);
    }
    assert.equal(new Set(actual.discovered).size, actual.discovered.length, 'Discoveries remain unique');
    assert.deepEqual(actual.notes, base.notes, 'Page position never replaces the nonempty note witness');
    assert.deepEqual(actual.cleared, [], 'Documentary reading clears no scenario');
    assert.deepEqual(actual.party, [], 'Documentary reading recruits no combat actor');
  }
  async function exported(label) {
    const result = await exportChronicle(label);
    assert.ok(result?.bytes && result?.session, 'Public download is decoded by the parent collector');
    observations.exports.push({ label, context: result.session.context,
      readingProgress: result.session.readingProgress, notes: result.session.notes,
      discoveries: result.session.discovered });
    return result;
  }

  await isolated('before documentary readings');
  await openChronicles();
  if (await action('chronicle-preparation').isVisible()) await click(action('chronicle-preparation'));
  await selectContext(definitions[0]);
  await registerFixture('readings-rev-native-fixture', fixture);
  await importChronicle({ bytes: fixture.bytes, label: 'readings-rev-native-fixture' });
  const before = await exported('readings-rev-before');
  assert.deepEqual(before.session, fixture.session);
  assert.deepEqual(before.session.readingProgress, {});
  check('readings-native-fixture-import-keeps-notes-separate-from-unvisited-progress');

  await openReading(fixture.story);
  let expected = advanced(fixture.session, fixture.story.id, 0);
  await observePage(fixture.story, 0, 'public Lecture opening');
  assert.equal(await articleFor(fixture.story).locator('[data-do="chronicle-page"]').first().isDisabled(), true);
  // Visiting 1, 0, 1 makes the duplicate-discovery check cover an actual reread.
  for (const index of [1, 0, 1, 2]) {
    await click(articleFor(fixture.story).locator(`[data-do="chronicle-page"][data-index="${index}"]`));
    expected = advanced(expected, fixture.story.id, index);
    await observePage(fixture.story, index, index === 0 ? 'public previous-page button' : 'public next-page button');
  }
  const visited = await exported('readings-rev-visited');
  assertReadingOnly(visited.session, fixture.session, expected);
  assert.equal(visited.session.readingProgress[fixture.story.id], 2);
  await capture('readings-rev-sourced-page', articleFor(fixture.story));
  await isolated('after REV next/previous/reread');
  check('readings-public-next-previous-unique-discoveries-safe-sources-and-no-gain');

  // A reset to the original declared fixture visibly changes page 2 to page 0.
  // Importing the actual public download must then restore page 2 exactly.
  await importChronicle({ bytes: fixture.bytes, label: 'readings-rev-reset-before-import' });
  await observePage(fixture.story, 0, 'declared reset fixture before restore');
  await importChronicle({ bytes: visited.bytes, label: 'readings-rev-restore-public-export' });
  await observePage(fixture.story, 2, 'native public import restores exact page');
  const imported = await exported('readings-rev-imported');
  assertReadingOnly(imported.session, fixture.session, visited.session);
  await isolated('after REV export/import');
  check('readings-public-export-import-restores-exact-page-notes-discoveries-and-session');

  await click(action('chronicle-save'));
  await page.reload({ waitUntil: 'networkidle' });
  await openChronicles();
  await selectContext(definitions[0]);
  // Documentary-only works have no tactical-preparation Reprendre button. The
  // public work/period selectors call loadChronicle automatically in main.js.
  const load = action('chronicle-load');
  if (await load.isVisible()) {
    await click(load);
    observations.reloadLoadMethod = 'Public Reprendre la chronique enregistrée button';
  } else {
    observations.reloadLoadMethod = 'Public REV/rev work/period selection invokes the native automatic load; no tactical Reprendre button is rendered';
  }
  await openReading(fixture.story);
  await observePage(fixture.story, 2, 'saved position after real browser reload and native load');
  const reloaded = await exported('readings-rev-reloaded');
  assertReadingOnly(reloaded.session, fixture.session, visited.session);
  await capture('readings-rev-reloaded-position', articleFor(fixture.story));
  await isolated('after REV save/browser reload/load');
  check('readings-public-save-real-browser-reload-native-load-preserves-exact-session');

  await selectContext(definitions[1]);
  await registerFixture('readings-asc-native-fixture', otherFixture);
  await importChronicle({ bytes: otherFixture.bytes, label: 'readings-asc-native-fixture' });
  await openReading(otherFixture.story);
  let expectedOther = advanced(otherFixture.session, otherFixture.story.id, 0);
  await observePage(otherFixture.story, 0, 'second exact documentary context');
  await click(articleFor(otherFixture.story).locator('[data-do="chronicle-page"][data-index="1"]'));
  expectedOther = advanced(expectedOther, otherFixture.story.id, 1);
  await observePage(otherFixture.story, 1, 'second context next-page button');
  const other = await exported('readings-asc-isolated');
  assertReadingOnly(other.session, otherFixture.session, expectedOther);
  assert.deepEqual(Object.keys(other.session.readingProgress), [otherFixture.story.id]);
  assert.equal(other.session.discovered.some(id => id.startsWith('REV-')), false);
  assert.equal(await page.locator('#chronicle-reading option[value="rev-sidon"]').count(), 0);
  assert.equal(await articleFor(fixture.story).count(), 0);
  await capture('readings-asc-isolated-sources', articleFor(otherFixture.story));
  await isolated('after second documentary context');
  check('readings-second-work-keeps-reading-progress-notes-and-discoveries-isolated-from-REV-and-ME1');

  observations.sourceLinks = [...sourceLinks.values()];
  observations.result = {
    context: fixture.session.context, storyId: fixture.story.id, restoredIndex: 2,
    repeatedVisitIndexes: [0, 1, 0, 1, 2], uniqueDiscoveries: visited.session.discovered.length,
    otherContext: other.session.context, otherStoryId: otherFixture.story.id, otherIndex: 1,
    exports: observations.exports.length, captures: 3,
    notesPreserved: true, clearedUnchanged: true, noRecruitmentOrGain: true,
    campaignStorageByteIdentical: true,
  };
  return observations;
}
