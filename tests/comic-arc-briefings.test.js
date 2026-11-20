import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { comicArcBriefings } from '../src/comic-arc-briefings.js';
import { canAccessContent, normalizeContext } from '../src/continuity.js';
import { getMediaPeriod } from '../src/continuity-data.js';
import { getUniverseRecord, getUniverseWork } from '../src/universe-data.js';
import { createChronicle, decodeChronicle, encodeChronicle, getComicBriefing, listComicBriefings, runChronicleComicAction } from '../src/chronicles.js';

const text = value => typeof value === 'string' && value.trim().length > 0;
const appearsUnique = values => new Set(values).size === values.length;

test('the original archive exercises have distinct IDs and display a conclusion after the investigation', () => {
  assert.ok(appearsUnique(comicArcBriefings.map(brief => brief.id)));
  assert.ok(appearsUnique(comicArcBriefings.map(brief => brief.title)));
  for (const brief of comicArcBriefings) {
    assert.match(brief.id, /^[a-z0-9]+(?:-[a-z0-9]+)+$/);
    assert.ok([brief.title, brief.objective, brief.resolution].every(text), brief.id);
    assert.equal(brief.trace.length, 3, brief.id);
    assert.ok(appearsUnique(brief.trace.map(item => item.label)), brief.id);
    for (const stage of [...brief.trace, brief.optional])
      assert.ok(text(stage.label) && text(stage.text), brief.id);
    assert.equal(brief.review.choices.length, 3, brief.id);
    assert.ok(appearsUnique(brief.review.choices) && brief.review.choices.every(text), brief.id);
    assert.ok(Number.isInteger(brief.review.answer) && text(brief.review.choices[brief.review.answer]), brief.id);
    assert.ok(text(brief.review.prompt), brief.id);
  }
});

test('each reference belongs to the exercise’s selected work and period', () => {
  for (const { id, mediaId, periodId, anchorIds } of comicArcBriefings) {
    const context = normalizeContext({ mediaId, periodId });
    assert.ok(context, id);
    const work = getUniverseWork(mediaId);
    const period = getMediaPeriod(mediaId, periodId);
    assert.ok(anchorIds.length && appearsUnique(anchorIds), id);
    for (const anchorId of anchorIds) {
      const record = getUniverseRecord(anchorId);
      if (record) {
        assert.equal(record.mediaId, mediaId, anchorId);
        assert.equal(record.fact, true, anchorId);
        assert.equal(record.nature, 'Établi', anchorId);
        assert.ok(canAccessContent(anchorId, context).ok, anchorId);
        assert.ok(record.sourceIds.length, anchorId);
        for (const sourceId of record.sourceIds)
          assert.ok(work.sources.some(source => source.id === sourceId && /^https?:\/\//.test(source.url)), sourceId);
      } else {
        assert.ok(period.sourceIds.includes(anchorId), anchorId);
        assert.ok(work.sources.some(source => source.id === anchorId && /^https?:\/\//.test(source.url)), anchorId);
      }
    }
  }
});

test('numbered exercise titles match explicit same-period references', () => {
  const numbered = comicArcBriefings.filter(brief => /#\d/.test(brief.title));
  const issueIds = numbered.map(({ mediaId, title }) => `${mediaId}-${title.match(/#(\d)/)[1]}`);
  assert.deepEqual(issueIds.sort(), ['EVO-1', 'EVO-2', 'EVO-3', 'EVO-4', 'INV-4', 'RED-1', 'RED-3', 'RED-4']);
  for (const brief of numbered) {
    const issue = brief.title.match(/#(\d)/)[0];
    assert.ok(brief.anchorIds.some(id => getUniverseRecord(id)?.reference?.includes(issue)), brief.id);
  }
  assert.equal(comicArcBriefings.find(brief => brief.id === 'evo-1-hostilites').periodId, 'evo-contact');
  assert.ok(comicArcBriefings.filter(brief => /^evo-[234]-/.test(brief.id)).every(brief => brief.periodId === 'evo-aftermath'));
  assert.ok(comicArcBriefings.some(brief => brief.mediaId === 'DIS'));
});

test('both methods complete every archive exercise with the same anchors and preserve isolated progress', () => {
  for (const { id, mediaId, periodId, anchorIds, review, resolution } of comicArcBriefings) {
    const context = normalizeContext({ mediaId, periodId });
    assert.ok(listComicBriefings(context).some(item => item.id === id), id);
    const initial = createChronicle(context);
    const get = session => getComicBriefing(context, id, session.comicProgress?.[id]);
    assert.equal(get(initial).phase, 'select', id);
    const conclusions = [];
    for (const mode of ['trace', 'review']) {
      let session = initial;
      const act = (action, value) => {
        const result = runChronicleComicAction(session, id, action, value);
        assert.equal(result.ok, true, `${id} ${action}`);
        session = decodeChronicle(encodeChronicle(result.session));
        assert.ok(session);
      };
      act('method', mode);
      assert.equal(get(session).phase, mode);
      if (mode === 'trace') {
        assert.equal(runChronicleComicAction(session, id, 'pick', 1).ok, false);
        for (const index of [0, 1, 2]) act('pick', index);
      } else {
        act('optional');
        assert.equal(runChronicleComicAction(session, id, 'pick', (review.answer + 1) % 3).ok, false);
        act('pick', review.answer);
      }
      assert.equal(get(session).phase, 'summary');
      act('finish');
      const complete = get(session);
      assert.equal(complete.phase, 'resolved');
      assert.equal(complete.state.extra, mode === 'review');
      conclusions.push([complete.resolution, complete.anchors.map(anchor => anchor.id)]);
      const untouched = { ...session };
      delete untouched.comicProgress;
      const expected = { ...initial };
      delete expected.comicProgress;
      assert.deepEqual(untouched, expected, id);
      assert.equal(runChronicleComicAction(createChronicle({ mediaId: 'ME1', periodId: 'me1' }), id, 'method', mode).ok, false);
      const wrongPeriod = mediaId === 'EVO' && (periodId === 'evo-contact' ? 'evo-aftermath' : 'evo-contact');
      if (wrongPeriod) assert.equal(getComicBriefing({ mediaId, periodId: wrongPeriod }, id), null);
    }
    assert.deepEqual(conclusions, [[resolution, anchorIds], [resolution, anchorIds]], id);
  }
});

test('the ten eligible P1 narrative references compile with a short attributed summary and same-period sources', () => {
  const selected = [
    'RED-SC-PURSUIT-REF', 'RED-SC-ACCESS-REF', 'RED-SC-RECOVER-REF',
    'EVO-SC-RESIST-REF', 'EVO-SC-AFTERWAR-REF', 'EVO-SC-ILLIUM-REF', 'EVO-SC-PALAVEN-REF', 'EVO-SC-BREAK-REF',
    'INV-SC-RETURN-REF', 'INV-SC-EXILE-REF',
  ];
  const opened = new Map();
  for (const { id, mediaId, periodId } of comicArcBriefings) {
    const briefing = getComicBriefing({ mediaId, periodId }, id);
    for (const anchor of briefing.anchors) {
      if (/-SC-.*-REF$/.test(anchor.id)) opened.set(anchor.id, { anchor, periodId, mediaId });
    }
  }
  assert.deepEqual([...opened.keys()].sort(), selected.sort());
  const criterion = 'L’ancrage reste bref et son numéro/segment est identifiable dans les sources; les détails non confirmés portent À vérifier.';
  let total = 0;
  for (const id of ['RED', 'EVO', 'INV', 'DIS']) {
    const work = getUniverseWork(id);
    const catalogue = JSON.parse(readFileSync(new URL(`../${work.catalogPath}`, import.meta.url), 'utf8'));
    const references = catalogue.entries.filter(row => row.priority === 'P1' && /-SC-.*-REF$/.test(row.id) && row.acceptance === criterion);
    total += references.length;
    for (const row of references) {
      const record = getUniverseRecord(row.id);
      const compiled = opened.get(row.id);
      const periods = work.periods.filter(period => canAccessContent(row.id, { mediaId: id, periodId: period.id }).ok);
      assert.equal(Boolean(compiled), periods.length > 0, row.id);
      if (!compiled) continue;
      const { anchor, mediaId, periodId } = compiled;
      assert.equal(mediaId, id, row.id);
      assert.ok(periods.some(period => period.id === periodId), row.id);
      assert.equal(anchor.category, 'Fait établi', row.id);
      assert.equal(anchor.description, record.description, row.id);
      assert.ok(anchor.description.trim().length <= 160, row.id);
      assert.match(record.reference, /#\d/, row.id);
      assert.deepEqual(anchor.sources.map(source => source.id), row.sourceIds, row.id);
    }
  }
  assert.equal(total, 26);
  const dis = getComicBriefing({ mediaId: 'DIS', periodId: 'dis' }, 'dis-repere-avant-voyage');
  const notice = dis.anchors.find(anchor => anchor.id === 'DIS-S-BOOK');
  assert.equal(notice.category, 'Source du repère');
  assert.ok(!opened.has('DIS-SC-01-COVER-REF'));
});
