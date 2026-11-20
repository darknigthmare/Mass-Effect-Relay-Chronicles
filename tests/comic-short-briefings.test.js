import test from 'node:test';
import assert from 'node:assert/strict';
import { comicShortBriefings } from '../src/comic-short-briefings.js';
import { comicFictionReferences, getComicBriefing, listComicBriefings } from '../src/comic-briefings.js';
import { chronicleStorageKey, createChronicle, decodeChronicle, encodeChronicle, loadChronicle, normalizeChronicle,
  runChronicleComicAction, saveChronicle, startChronicleBattle } from '../src/chronicles.js';
import { canAccessContent, normalizeContext } from '../src/continuity.js';
import { encodeSave, newGame } from '../src/state.js';
import { getUniverseRecord, getUniverseWork } from '../src/universe-data.js';

const expected = new Map([
  ['INC', { period: 'inc', source: 'INC-S-PAIR', nature: 'Établi' }],
  ['INQ', { period: 'inq', source: 'INQ-S-PAIR', nature: 'Établi' }],
  ['CON', { period: 'con', source: 'CON-S-WIKI', nature: 'À vérifier' }],
  ['BLA', { period: null, source: 'BLA-S-BOOK', nature: 'Établi' }],
  ['HWB', { period: 'hwb', source: 'HWB-S-OMNI2', nature: 'Établi' }],
]);
const secondaryAnchors = new Map([['HWB-SC-FLIGHT-REF', 'HWB-S-WIKI'], ['CON-SC-DUTY-REF', 'CON-S-WIKI']]);

test('the six short dossiers have distinct definitions across the five works', () => {
  assert.deepEqual(new Set(comicShortBriefings.map(briefing => briefing.mediaId)), new Set(expected.keys()));
  assert.equal(comicShortBriefings.length, expected.size + 1);
  assert.equal(new Set(comicShortBriefings.map(briefing => briefing.id)).size, comicShortBriefings.length);
  for (const { id, mediaId, title, objective, trace, review, optional, resolution } of comicShortBriefings) {
    assert.ok(id.startsWith(`${mediaId.toLowerCase()}-`));
    assert.ok(title && objective && resolution);
    assert.equal(trace.length, 3);
    assert.equal(new Set(trace.map(piece => piece.label)).size, 3);
    assert.ok(trace.every(piece => piece.label && piece.text));
    assert.ok(review.prompt);
    assert.equal(new Set(review.choices).size, 3);
    assert.ok(Number.isInteger(review.answer) && review.choices[review.answer]);
    assert.ok(optional.label && optional.text);
  }
});

test('short comic anchors keep their source and exact period or editorial restrictions', () => {
  for (const { mediaId, periodId, anchorIds } of comicShortBriefings) {
    const { period, source, nature } = expected.get(mediaId);
    assert.equal(periodId, period);
    const work = getUniverseWork(mediaId);
    assert.ok(anchorIds.length > 0);
    const context = normalizeContext({ mediaId, periodId });
    if (mediaId === 'BLA') {
      assert.equal(context, null);
      assert.equal(work.kind, 'in-universe-fiction');
      assert.equal(work.locked, true);
      assert.equal(work.periods.length, 0);
    } else assert.deepEqual(context, { mediaId, periodId, galaxy: 'milky-way' });
    for (const id of anchorIds) {
      const record = getUniverseRecord(id);
      const secondary = secondaryAnchors.get(id);
      const sourceId = secondary || source;
      const link = work.sources.find(entry => entry.id === sourceId);
      assert.match(link?.url || '', /^https:\/\//);
      assert.equal(record.mediaId, mediaId);
      assert.equal(record.nature, secondary ? 'À vérifier' : nature);
      assert.ok(record.sourceIds.includes(sourceId));
      if (secondary) assert.ok(work.periods.find(entry => entry.id === periodId).reference.includes(id));
      assert.equal(canAccessContent(id, { mediaId, periodId }).ok, !secondary && !['BLA', 'CON'].includes(mediaId));
      assert.equal(canAccessContent(id, { mediaId: 'ME1', periodId: 'me1' }).ok, false);
      for (const [otherMedia, { period: otherPeriod }] of expected) {
        if (otherMedia !== mediaId) assert.equal(canAccessContent(id, { mediaId: otherMedia, periodId: otherPeriod }).ok, false);
      }
    }
  }
});

test('the five playable short dossiers take either route, resume and converge without granting campaign progression', () => {
  const campaign = encodeSave(newGame());
  const values = new Map([['relay-chronicles.save.v1', campaign]]);
  const store = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const campaignContext = { mediaId: 'ME1', periodId: 'me1' };
  for (const { id, mediaId, periodId, review, resolution, receipt } of comicShortBriefings.filter(entry => entry.periodId !== null)) {
    const context = { mediaId, periodId };
    const initial = createChronicle(context);
    assert.ok(initial, id);
    assert.deepEqual(listComicBriefings(context).map(entry => entry.id), comicShortBriefings.filter(entry => entry.mediaId === mediaId).map(entry => entry.id));
    assert.equal(getComicBriefing(campaignContext, id), null);
    assert.equal(startChronicleBattle(initial).ok, false);
    assert.equal(getComicBriefing(context, id).anchors[0].category, mediaId === 'CON' ? 'À vérifier' : 'Fait établi');
    for (const method of ['trace', 'review']) {
      let session = initial;
      function advance(action, value) {
        const result = runChronicleComicAction(session, id, action, value);
        assert.ok(result.ok, result.reason);
        session = result.session;
      }
      advance('method', method);
      assert.equal(runChronicleComicAction(session, id, 'finish').ok, false);
      const wrong = method === 'trace' ? 2 : (review.answer + 1) % 3;
      assert.equal(runChronicleComicAction(session, id, 'pick', wrong).ok, false);
      if (method === 'trace') advance('optional');
      const picks = method === 'trace' ? [0, 1, 2] : [review.answer];
      advance('pick', picks[0]);
      assert.equal(saveChronicle(store, session).ok, true);
      session = loadChronicle(store, context).session;
      assert.equal(session.comicProgress[id].step, 1);
      assert.equal(session.comicProgress[id].extra, method === 'trace');
      for (const pick of picks.slice(1)) advance('pick', pick);
      advance('finish', method === 'trace' ? 'archive' : 'skip');
      session = decodeChronicle(encodeChronicle(session));
      const dossier = getComicBriefing(context, id, session.comicProgress[id]);
      assert.equal(dossier.phase, 'resolved');
      assert.equal(dossier.resolution, resolution);
      assert.equal(dossier.receipt, receipt);
      const { comicProgress, ...unchanged } = session;
      assert.deepEqual(unchanged, initial);
      const other = createChronicle(mediaId === 'INC' ? { mediaId: 'INQ', periodId: 'inq' } : { mediaId: 'INC', periodId: 'inc' });
      assert.equal(normalizeChronicle({ ...other, comicProgress }), null);
      advance('restart');
      assert.equal(getComicBriefing(context, id, session.comicProgress[id]).phase, 'select');
    }
  }
  assert.equal(store.getItem('relay-chronicles.save.v1'), campaign);
});

test('the Inquisition dossiers register a request and keep a report’s unanswered questions in the receipt', () => {
  const context = { mediaId: 'INQ', periodId: 'inq' };
  const filed = { method: 'review', step: 1, extra: false, closed: true };
  assert.equal(getComicBriefing(context, 'inq-recevoir-les-accusations').receipt, undefined);
  const brief = getComicBriefing(context, 'inq-recevoir-les-accusations', filed);
  assert.equal(brief.title, 'Recevoir les accusations');
  assert.match(brief.receipt, /Demande consignée.*Observation.*deux passages rapprochés.*Accusation de prêt de badge.*attribuée.*reste à vérifier/);
  const report = getComicBriefing(context, 'inq-contre-signature', filed);
  assert.equal(report.title, 'Rendre un rapport incertain');
  assert.match(report.receipt, /Rapport classé.*original.*copie.*guichet déclare.*cause de l’écart.*restent à vérifier/);
});

test('Blasto references remain editorial and cannot create a historical session', () => {
  const context = { mediaId: 'BLA', periodId: null };
  const entry = comicShortBriefings.find(briefing => briefing.mediaId === 'BLA');
  const editorial = comicFictionReferences().find(briefing => briefing.id === entry.id);
  assert.deepEqual(editorial?.anchors.map(anchor => anchor.category), ['Fiction interne', 'Fiction interne']);
  assert.deepEqual(editorial.anchors.map(anchor => anchor.id), ['BLA-SC-BRIEF-REF', 'BLA-SC-ISLAND-REF']);
  assert.ok(editorial.anchors.every(anchor => anchor.sources.some(source => source.id === 'BLA-S-BOOK')));
  assert.deepEqual(listComicBriefings(context), []);
  assert.equal(getComicBriefing(context, entry.id), null);
  assert.equal(createChronicle(context), null);
  assert.equal(chronicleStorageKey(context), null);
});

test('the short dossiers display the two period-bound secondary scenes as unverified', () => {
  for (const entry of comicShortBriefings.filter(briefing => ['CON', 'HWB'].includes(briefing.mediaId))) {
    const { id, mediaId, periodId } = entry;
    const anchor = getComicBriefing({ mediaId, periodId }, id).anchors.find(anchor => secondaryAnchors.has(anchor.id));
    assert.equal(anchor?.category, 'À vérifier');
    assert.deepEqual(anchor.sources.map(source => source.id), [secondaryAnchors.get(anchor.id)]);
  }
});
