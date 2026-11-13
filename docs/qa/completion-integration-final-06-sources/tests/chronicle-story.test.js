import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { MEDIA_PERIODS } from '../src/continuity-data.js';
import { getUniverseRecord, getUniverseWork } from '../src/universe-data.js';
import { normalizeContext, canAccessContent, createChronicleSession, normalizeChronicleSession } from '../src/continuity.js';
import { newGame } from '../src/state.js';
import { listChronicleStories, getChronicleStory, readChronicleStoryStep } from '../src/chronicle-story.js';

const context = (mediaId, periodId) => normalizeContext({ mediaId, periodId });
const allStories = () => MEDIA_PERIODS.flatMap(work => work.periods.flatMap(period => listChronicleStories({ mediaId: work.id, periodId: period.id })));

test('sixteen exact-context documentary readings retain distinct canonical progress anchors', () => {
  const stories = allStories();
  assert.equal(stories.length, 16);
  assert.deepEqual(stories.map(story => story.context.mediaId).sort(), ['ANN', 'ASC', 'DEC', 'DIS', 'EVO', 'EVO', 'FOU', 'HOM', 'INC', 'INI', 'INQ', 'INV', 'NEX', 'RED', 'RET', 'REV']);
  assert.equal(new Set(stories.map(story => story.progressRecordId)).size, stories.length);
  for (const summary of stories) {
    const story = getChronicleStory(summary.id, summary.context);
    assert.equal(summary.kind, 'documentary');
    assert.ok(story.steps.length >= 1 && story.steps.length <= 6);
    assert.equal(summary.stepCount, story.steps.length);
    assert.equal(story.progressRecordId, story.steps[0].recordIds[0]);
    assert.equal(canAccessContent(story.progressRecordId, story.context).ok, true);
    assert.ok(story.reference); assert.ok(story.uncertainty);
    assert.equal(new Set(story.steps.map(step => step.id)).size, story.steps.length);
    for (const step of story.steps) {
      assert.ok(step.title && step.text.length > 20 && step.text.length <= 400);
      assert.ok(step.recordIds.length > 0 && step.sourceIds.length > 0 && step.reference);
      assert.ok(!Object.hasOwn(step, 'choices'));
      assert.ok(!Object.hasOwn(step, 'reward'));
      const work = getUniverseWork(story.context.mediaId);
      for (const id of step.recordIds) {
        const record = getUniverseRecord(id);
        assert.equal(record.nature, 'Établi', id); assert.equal(record.fact, true, id);
        assert.equal(canAccessContent(id, story.context).ok, true, id);
        for (const sourceId of record.sourceIds) assert.ok(step.sourceIds.includes(sourceId), sourceId);
      }
      assert.deepEqual(step.sources.map(source => source.id), step.sourceIds);
      for (const source of step.sources) {
        const original = work.sources.find(item => item.id === source.id);
        assert.ok(original, source.id); assert.equal(source.url, original.url); assert.equal(source.title, original.title);
        assert.match(source.url, /^https?:\/\//);
      }
    }
  }
});

test('readings require exact work, segment and derived galaxy, without leaking into ME1 or anthology-wide contexts', () => {
  const evo = context('EVO', 'evo-aftermath');
  assert.equal(listChronicleStories(evo)[0].id, 'evo-apres-guerre');
  for (const wrong of [context('EVO', 'evo-contact'), context('ME1', 'me1'), context('MEA', 'mea'),
    { mediaId: 'EVO', periodId: 'evo' }, { ...evo, year: 2157 }, { ...evo, galaxy: 'andromeda' },
    { mediaId: 'HOM', periodId: 'hom' }, { mediaId: 'FOU', periodId: 'fou' }]) {
    assert.equal(listChronicleStories(wrong).some(story => story.id === 'evo-apres-guerre'), false);
    assert.equal(getChronicleStory('evo-apres-guerre', wrong), null);
    assert.equal(readChronicleStoryStep(wrong, 'evo-apres-guerre').ok, false);
  }
  for (const mediaId of ['HOM', 'FOU']) {
    for (const period of MEDIA_PERIODS.find(work => work.id === mediaId).periods) {
      const expected = period.id === 'hom-4-liara' ? ['hom-liara'] : period.id === 'fou-5' ? ['fou-recherche'] : [];
      assert.deepEqual(listChronicleStories({ mediaId, periodId: period.id }).map(story => story.id), expected);
    }
  }
  for (const mediaId of ['LIB', 'BLA', 'CUT', 'ME4', 'CON', 'HWB']) assert.deepEqual(listChronicleStories({ mediaId, periodId: mediaId.toLowerCase() }), []);
  assert.equal(getChronicleStory('unknown'), null);
});

test('the guide preserves chronology reservations and fixed published outcomes without invented dates or dialogue', () => {
  const text = id => getChronicleStory(id).steps.map(step => step.text).join('\n');
  assert.match(text('rev-sidon'), /Sidon/); assert.ok(!text('rev-sidon').includes('Shanxi'));
  assert.match(text('asc-projet'), /douze ans/); assert.match(text('asc-projet'), /Kahlee revient au projet/);
  assert.ok(!text('asc-projet').includes('dix-huit'));
  assert.match(text('ann-transit'), /pendant le trajet, avant l’arrivée/);
  assert.equal(getChronicleStory('ann-transit').context.galaxy, 'unknown');
  assert.ok(!text('ann-transit').includes('Héléus'));
  assert.equal(getChronicleStory('ini-cora').context.galaxy, 'milky-way');
  assert.match(text('evo-apres-guerre'), /après la fin des hostilités/);
  assert.match(text('inv-omega'), /départ d’Aria/);
  for (const summary of allStories()) {
    const story = getChronicleStory(summary.id);
    assert.ok(!story.steps.flatMap(step => step.recordIds).includes('RED-SC-CONTACT-REF'));
    assert.ok(!/\b21\d{2}\b/.test(story.steps.map(step => step.text).join(' ')), 'No unsourced numeric event year is added.');
    assert.ok(!story.steps.some(step => /[«»]/.test(step.text)), 'Pages paraphrase facts instead of inventing dialogue.');
  }
});

test('page navigation adds accessible facts once, retains other discoveries from the same context and never mutates ME1', () => {
  const ctx = context('REV', 'rev'), story = getChronicleStory('rev-sidon', ctx), campaign = newGame();
  const campaignBefore = JSON.stringify(campaign), contextBefore = JSON.stringify(ctx);
  let discoveries = ['REV-CHR-JILL'];
  for (let index = 0; index < story.steps.length; index += 1) {
    const before = [...discoveries], reading = readChronicleStoryStep(ctx, story.id, index, discoveries);
    assert.equal(reading.ok, true); assert.equal(reading.index, index); assert.equal(reading.total, story.steps.length);
    assert.equal(reading.previousIndex, index > 0 ? index - 1 : null);
    assert.equal(reading.nextIndex, index + 1 < story.steps.length ? index + 1 : null);
    assert.equal(reading.completed, index === story.steps.length - 1);
    assert.ok(reading.discovered.includes('REV-CHR-JILL'));
    assert.ok(reading.discovered.includes(story.progressRecordId));
    for (const id of reading.step.recordIds) assert.ok(reading.discovered.includes(id));
    assert.deepEqual(discoveries, before);
    assert.ok(reading.discovered.every(id => canAccessContent(id, ctx).ok));
    assert.ok(!['reward', 'xp', 'credits', 'party', 'loadouts', 'cleared'].some(key => Object.hasOwn(reading, key)));
    assert.deepEqual(readChronicleStoryStep(ctx, story.id, index, reading.discovered).discovered, reading.discovered);
    discoveries = reading.discovered;
  }
  assert.equal(new Set(discoveries).size, discoveries.length);
  assert.equal(JSON.stringify(campaign), campaignBefore); assert.equal(JSON.stringify(ctx), contextBefore);
});

test('progress fits existing canonical discovered and notes fields without a new session schema', () => {
  const ctx = context('ANN', 'ann'), session = createChronicleSession(ctx), before = JSON.stringify(session);
  const reading = readChronicleStoryStep(ctx, 'ann-transit', 3, session.discovered);
  assert.equal(reading.ok, true); assert.equal(JSON.stringify(session), before);
  const updated = { ...session, discovered: reading.discovered, notes: { [reading.story.progressRecordId]: `relay-story:${reading.story.id}:${reading.index}` } };
  assert.deepEqual(normalizeChronicleSession(updated), updated);
  assert.equal(normalizeChronicleSession({ ...updated, notes: { 'story:ann-transit': '3' } }), null);
});

test('foreign and unverified discoveries are filtered without mutation, while malformed or oversized inputs fail', () => {
  const ctx = context('RED', 'red');
  const discovered = ['RED-WRL-OMEGA', 'RED-WRL-OMEGA', 'ME2-CHR-JACK', 'RED-SC-CONTACT-REF', 'not-a-catalogue-record'];
  const before = [...discovered], reading = readChronicleStoryStep(ctx, 'red-recherche', 1, discovered);
  assert.equal(reading.ok, true); assert.deepEqual(discovered, before);
  assert.ok(reading.discovered.includes('RED-WRL-OMEGA')); assert.ok(reading.discovered.includes('RED-REF-FERON'));
  for (const forbidden of discovered.slice(2)) assert.ok(!reading.discovered.includes(forbidden));
  for (const invalid of [null, {}, 'RED-WRL-OMEGA', [7], Array(2), Array(2001).fill('RED-WRL-OMEGA')]) assert.equal(readChronicleStoryStep(ctx, 'red-recherche', 0, invalid).ok, false);
  let accessed = false;
  const getter = []; Object.defineProperty(getter, '0', { enumerable: true, get() { accessed = true; throw new Error('must not read'); } });
  assert.equal(readChronicleStoryStep(ctx, 'red-recherche', 0, getter).ok, false); assert.equal(accessed, false);
  const extra = ['RED-WRL-OMEGA']; extra.extra = 'RED-REF-FERON';
  assert.equal(readChronicleStoryStep(ctx, 'red-recherche', 0, extra).ok, false);
  for (const invalid of [-1, .5, NaN, Infinity, '0', 99]) assert.equal(readChronicleStoryStep(ctx, 'red-recherche', invalid).ok, false);
});

test('returned stories, sources and pages are independent copies and cannot alter the reading registry', () => {
  const ctx = context('INV', 'inv'), original = getChronicleStory('inv-omega', ctx), modified = getChronicleStory('inv-omega', ctx);
  modified.context.galaxy = 'andromeda'; modified.steps[0].text = 'changed'; modified.steps[0].sources[0].title = 'changed';
  assert.deepEqual(getChronicleStory('inv-omega', ctx), original);
  const summary = listChronicleStories(ctx); summary[0].context.periodId = 'other';
  assert.equal(listChronicleStories(ctx)[0].context.periodId, 'inv');
  const page = readChronicleStoryStep(ctx, 'inv-omega'); page.step.recordIds.length = 0; page.step.sources[0].url = 'changed';
  assert.deepEqual(getChronicleStory('inv-omega', ctx), original);
});


test('the nine published readings preserve every original ID, page, text and progress anchor', () => {
  const originalIds = ['ann-transit', 'asc-projet', 'evo-apres-guerre', 'ini-cora', 'inv-omega', 'nex-crise', 'red-recherche', 'ret-grayson', 'rev-sidon'];
  const stories = originalIds.map(id => getChronicleStory(id)).map(story => ({
    id: story.id, progressRecordId: story.progressRecordId,
    steps: story.steps.map(({ id, title, recordIds, text }) => ({ id, title, recordIds, text })),
  }));
  assert.equal(stories.reduce((total, story) => total + story.steps.length, 0), 42);
  assert.equal(createHash('sha256').update(JSON.stringify(stories)).digest('hex'), 'ea7a38c0d1f0f994e7e9efc5bfdd9cf613fff0df859b1eb7193ede809a8ea50c');
});

test('seven additions use only nineteen existing fact IDs and ten bounded pages, without filler or foreign phases', () => {
  const expected = {
    'dec-reperes': { mediaId: 'DEC', periodId: 'dec', pages: 4, ids: ['DEC-CON-11', 'DEC-REF-CERBERUS', 'DEC-REF-UNDERGROUND', 'DEC-CON-02', 'DEC-CON-03', 'DEC-CON-01', 'DEC-CON-07'] },
    'hom-liara': { mediaId: 'HOM', periodId: 'hom-4-liara', pages: 1, ids: ['HOM-REF-ISSUE4', 'HOM-ACT-LIARA'] },
    'fou-recherche': { mediaId: 'FOU', periodId: 'fou-5', pages: 1, ids: ['FOU-SC-05-REF', 'FOU-ACT-MIRANDA', 'FOU-ACT-JACOB'] },
    'dis-infiltration': { mediaId: 'DIS', periodId: 'dis', pages: 1, ids: ['DIS-REF-SCOPE', 'DIS-REF-TIRAN'] },
    'inc-omega': { mediaId: 'INC', periodId: 'inc', pages: 1, ids: ['INC-REF-SCOPE', 'INC-WRL-OMEGA'] },
    'inq-bailey': { mediaId: 'INQ', periodId: 'inq', pages: 1, ids: ['INQ-REF-SCOPE', 'INQ-WRL-CITADEL'] },
    'evo-contact': { mediaId: 'EVO', periodId: 'evo-contact', pages: 1, ids: ['EVO-SC-RESIST-REF'] },
  };
  let pageCount = 0; const allIds = new Set();
  const campaign = newGame(), campaignBefore = JSON.stringify(campaign);
  for (const [id, definition] of Object.entries(expected)) {
    const ctx = context(definition.mediaId, definition.periodId), story = getChronicleStory(id, ctx);
    assert.ok(story); assert.equal(story.steps.length, definition.pages); pageCount += story.steps.length;
    assert.deepEqual([...new Set(story.steps.flatMap(step => step.recordIds))], definition.ids);
    for (const recordId of definition.ids) allIds.add(recordId);
    let discovered = [];
    for (let index = 0; index < story.steps.length; index += 1) {
      const result = readChronicleStoryStep(ctx, id, index, discovered);
      assert.equal(result.ok, true); assert.equal(result.completed, index === story.steps.length - 1);
      assert.equal(result.nextIndex, index + 1 < story.steps.length ? index + 1 : null);
      assert.ok(!['party', 'loadouts', 'builds', 'reward', 'xp', 'credits', 'cleared'].some(key => Object.hasOwn(result, key)));
      discovered = result.discovered;
    }
    assert.ok(discovered.every(recordId => definition.ids.includes(recordId)));
    assert.equal(getChronicleStory(id, context('ME1', 'me1')), null);
  }
  assert.equal(pageCount, 10); assert.equal(allIds.size, 19);
  assert.equal(allStories().reduce((total, summary) => total + summary.stepCount, 0), 52);
  assert.equal(JSON.stringify(campaign), campaignBefore);
});

test('Deception preserves contradictions and publication uncertainty, while Inquisition never asserts guilt', () => {
  const text = id => getChronicleStory(id).steps.map(step => step.text).join(' ');
  const deception = text('dec-reperes');
  assert.match(deception, /dix-huit ans/); assert.match(deception, /douze ans/); assert.match(deception, /contradictions sont conservées/);
  assert.match(deception, /n’établissent pas qu’une édition révisée ait effectivement été publiée/);
  assert.ok(!getChronicleStory('dec-reperes').steps.flatMap(step => step.recordIds).includes('DEC-CON-08'));
  assert.ok(!/guérison|guérie|Gillian meurt/u.test(deception));
  assert.match(text('inq-bailey'), /traître présumé/); assert.ok(!/Pallin|coupable|condamné/u.test(text('inq-bailey')));
  assert.ok(!/Mars|Kahje|Rasa|Tali|Garrus/u.test(text('hom-liara')));
  assert.ok(!/Illium|Palaven|Monolithe|Desolas/u.test(text('evo-contact')));
});
