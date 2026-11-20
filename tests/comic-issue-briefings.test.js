import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { comicIssueBriefings } from '../src/comic-issue-briefings.js';
import { renderComicReading } from '../src/comic-briefing-ui.js';
import { createChronicle, decodeChronicle, encodeChronicle, getComicBriefing, listComicBriefings, runChronicleComicAction } from '../src/chronicles.js';
import { canAccessContent, normalizeContext } from '../src/continuity.js';
import { getUniverseRecord, getUniverseWork } from '../src/universe-data.js';

const homeworldScenes = ['VEGA-YOUTH', 'VEGA-PRESENT', 'TALI-TRACE', 'TALI-CITADEL',
  'GARRUS-PAST', 'GARRUS-OMEGA', 'LIARA-ARCHIVE', 'LIARA-KAHJE'];
const sceneIds = {
  HOM: homeworldScenes.map(scene => `HOM-SC-${scene}-REF`),
  FOU: Array.from({ length: 13 }, (_, index) => `FOU-SC-${String(index + 1).padStart(2, '0')}-REF`),
};
const catalogueCriterion = 'L’ancrage reste bref et son numéro/segment est identifiable dans les sources; les détails non confirmés portent À vérifier.';
const archiveId = 'hom-liara-archive-access';
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

test('the nineteen issue exercises remain in their exact periods, with a second exercise only in Homeworlds #4', () => {
  assert.equal(comicIssueBriefings.length, 20);
  assert.equal(new Set(comicIssueBriefings.map(entry => entry.id)).size, 20);
  for (const mediaId of ['HOM', 'FOU']) {
    const work = getUniverseWork(mediaId), entries = comicIssueBriefings.filter(entry => entry.mediaId === mediaId);
    assert.deepEqual(entries.filter(entry => entry.id !== archiveId).map(entry => entry.periodId), work.periods.map(period => period.id));
    for (const definition of entries) {
      const context = normalizeContext({ mediaId, periodId: definition.periodId });
      const expected = definition.periodId === 'hom-4-liara' ? ['hom-liara-inventaire', archiveId] : [definition.id];
      assert.deepEqual(listComicBriefings(context).map(brief => brief.id), expected);
      const brief = getComicBriefing(context, definition.id);
      assert.deepEqual(brief.anchors.map(anchor => anchor.id), definition.anchorIds);
      assert.equal(new Set(brief.trace.map(card => card.label)).size, 3);
      assert.equal(new Set(brief.review.choices).size, 3);
      for (const period of work.periods.filter(period => period.id !== definition.periodId))
        assert.equal(getComicBriefing({ mediaId, periodId: period.id }, definition.id), null);
      assert.equal(getComicBriefing({ mediaId: 'ME1', periodId: 'me1' }, definition.id), null);
    }
  }
});

test('all twenty-one P1 references carry their issue number, source and exact confidence in the journal', () => {
  for (const mediaId of ['HOM', 'FOU']) {
    const work = getUniverseWork(mediaId);
    const catalogue = JSON.parse(readFileSync(new URL(`../docs/universe/catalogs/${mediaId}.json`, import.meta.url), 'utf8'));
    const entries = comicIssueBriefings.filter(entry => entry.mediaId === mediaId);
    const covered = new Set();
    for (const definition of entries) {
      const { periodId, id } = definition;
      const period = work.periods.find(item => item.id === periodId);
      const context = normalizeContext({ mediaId, periodId }), session = createChronicle(context);
      const brief = getComicBriefing(context, id);
      const html = renderComicReading({ context, session }, { mediaId, comicId: id }, escape);
      assert.ok(html.includes('data-comic-origin="Adaptation"'), id);
      for (const anchor of brief.anchors) {
        assert.ok(html.includes(`data-comic-origin="${anchor.category}" data-comic-anchor="${anchor.id}"`), anchor.id);
        assert.ok(anchor.sources.length, anchor.id);
        for (const source of anchor.sources) {
          assert.match(source.url, /^https?:\/\//, source.id);
          assert.ok(html.includes(`data-comic-source="${source.id}"`), source.id);
        }
        if (anchor.category === 'Source du repère') assert.ok(period.sourceIds.includes(anchor.id));
        if (!sceneIds[mediaId].includes(anchor.id)) continue;
        const row = catalogue.entries.find(entry => entry.id === anchor.id);
        const record = getUniverseRecord(anchor.id);
        assert.equal(row.priority, 'P1');
        assert.equal(row.acceptance, catalogueCriterion);
        const issue = period.label.match(/#\d+/)[0];
        assert.ok(record.reference.includes(issue) && anchor.title.includes(issue), anchor.id);
        assert.ok(period.reference.includes(anchor.id), anchor.id);
        assert.ok(anchor.description.trim().length < 180, anchor.id);
        assert.equal(anchor.category, record.fact ? 'Fait établi' : 'À vérifier', anchor.id);
        assert.equal(canAccessContent(anchor.id, context).ok, record.fact, anchor.id);
        covered.add(anchor.id);
      }
    }
    assert.deepEqual([...covered].sort(), [...sceneIds[mediaId]].sort());
  }
});

test('both methods reach the same conclusion for every issue and preserve progress only within the current period', () => {
  for (const { id, mediaId, periodId, review, resolution } of comicIssueBriefings) {
    const context = normalizeContext({ mediaId, periodId }), original = createChronicle(context);
    const exercise = session => getComicBriefing(context, id, session.comicProgress?.[id]);
    const conclusions = [];
    for (const method of ['trace', 'review']) {
      let session = original;
      const act = (action, value) => {
        const moved = runChronicleComicAction(session, id, action, value);
        assert.equal(moved.ok, true, `${id} ${action}`);
        session = decodeChronicle(encodeChronicle(moved.session));
        assert.ok(session, id);
      };
      act('method', method);
      if (method === 'trace') {
        assert.equal(runChronicleComicAction(session, id, 'pick', 2).ok, false);
        for (const index of [0, 1, 2]) act('pick', index);
      } else {
        act('optional');
        assert.equal(runChronicleComicAction(session, id, 'pick', (review.answer + 1) % 3).ok, false);
        act('pick', review.answer);
      }
      assert.equal(exercise(session).phase, 'summary', id);
      act('finish', method === 'trace' ? 'skip' : 'archive');
      assert.equal(exercise(session).phase, 'resolved', id);
      assert.equal(exercise(session).state.extra, method === 'review');
      conclusions.push(exercise(session).resolution);
      const { comicProgress: _progress, ...unchanged } = session;
      const { comicProgress: _original, ...expected } = original;
      assert.deepEqual(unchanged, expected, id);
    }
    assert.deepEqual(conclusions, [resolution, resolution], id);
  }
});

test('Liara’s classified file grants the same documented local access after either method and a save reload', () => {
  const { entries } = JSON.parse(readFileSync(new URL('../docs/universe/catalogs/HOM.json', import.meta.url), 'utf8'));
  const catalogue = entries.find(entry => entry.id === 'HOM-SC-LIARA-ARCHIVE-MAIN');
  assert.equal(catalogue.description, 'Consulter les sources accessibles et obtenir un accès documenté.');
  assert.equal(catalogue.acceptance, 'L\'objectif « #4 — suivre les archives » atteint son raccord annoncé après chaque méthode; sauvegarde, rechargement et saut de scène n\'en changent ni le groupe ni les informations acquises.');
  const context = normalizeContext({ mediaId: 'HOM', periodId: 'hom-4-liara' });
  const initial = createChronicle(context);
  const dossier = getComicBriefing(context, archiveId);
  const receipt = comicIssueBriefings.find(entry => entry.id === archiveId).receipt;
  assert.equal(dossier.title, '#4 — suivre les archives');
  assert.equal(dossier.receipt, undefined);
  assert.ok(dossier.anchors.some(anchor => anchor.id === 'HOM-REF-ISSUE4' && anchor.category === 'Fait établi'));
  assert.ok(dossier.anchors.some(anchor => anchor.id === catalogue.dependencies[0] && anchor.category === 'À vérifier'));
  assert.match(receipt, /lecture à l’annexe de travail AR-04 de cet exercice/);
  assert.match(receipt, /justificatif associe le relevé daté AR-04 au visa/);
  const render = session => renderComicReading({ context, session }, { mediaId: 'HOM', comicId: archiveId }, escape);
  for (const method of ['trace', 'review']) for (const extra of [false, true]) {
    let session = initial;
    const act = (action, value) => {
      const result = runChronicleComicAction(session, archiveId, action, value);
      assert.ok(result.ok, action);
      session = decodeChronicle(encodeChronicle(result.session));
      assert.ok(session);
    };
    assert.ok(render(session).includes('data-comic-source="HOM-S-DH4"'));
    assert.ok(!render(session).includes(escape(receipt)));
    act('method', method);
    assert.equal(runChronicleComicAction(session, archiveId, 'finish', 'skip').ok, false);
    if (extra) act('optional');
    for (const pick of method === 'trace' ? [0, 1, 2] : [dossier.review.answer]) act('pick', pick);
    assert.ok(!render(session).includes(escape(receipt)), 'the summary does not grant access');
    act('finish', extra ? 'archive' : 'skip');
    const classified = render(session);
    assert.match(classified, /<details data-comic-receipt>/);
    assert.ok(classified.includes(escape(receipt)), 'the classified dossier grants the same documented access');
    const { comicProgress, ...rest } = session;
    assert.equal(comicProgress[archiveId].closed, true);
    assert.equal(comicProgress[archiveId].extra, extra);
    const { comicProgress: _progress, ...before } = initial;
    assert.deepEqual(rest, before);
    act('restart');
    assert.ok(!render(session).includes(escape(receipt)), 'restarting only this dossier no longer presents the visa');
  }
  assert.equal(runChronicleComicAction(createChronicle({ mediaId: 'HOM', periodId: 'hom-3-omega' }), archiveId, 'method', 'trace').ok, false);
});
