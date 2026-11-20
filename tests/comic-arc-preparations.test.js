import test from 'node:test';
import assert from 'node:assert/strict';
import { comicArcBriefings } from '../src/comic-arc-briefings.js';
import { createChronicle, decodeChronicle, encodeChronicle, getComicBriefing, loadChronicle,
  normalizeChronicle, runChronicleComicAction, saveChronicle } from '../src/chronicles.js';
import { renderComicReading } from '../src/comic-briefing-ui.js';
import { newGame, encodeSave } from '../src/state.js';

const preparations = ['red-approche-de-liaison', 'inv-briefing-commun', 'dis-fiche-de-couverture']
  .map(id => comicArcBriefings.find(entry => entry.id === id));
const esc = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

for (const definition of preparations) {
  assert.ok(definition);
  const { id, mediaId, periodId } = definition, context = { mediaId, periodId };
  test(`${id}: both archive methods retain the same preparation through reload, optional reading and summary skip`, () => {
    const initial = createChronicle(context), campaign = encodeSave(newGame()), values = new Map([['relay-chronicles.save.v1', campaign]]);
    const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
    const outcomes = [];
    for (const method of ['trace', 'review']) for (const optional of [false, true]) for (const finish of ['archive', 'skip']) {
      let session = structuredClone(initial);
      const advance = (action, value) => {
        const before = structuredClone(session), result = runChronicleComicAction(session, id, action, value);
        assert.equal(result.ok, true, `${id}: ${action}`); assert.deepEqual(session, before, 'the transaction does not mutate its input');
        session = result.session;
      };
      const get = () => getComicBriefing(context, id, session.comicProgress?.[id]);
      assert.equal(get().phase, 'select'); assert.equal(get().receipt, undefined);
      advance('method', method);
      const before = structuredClone(session);
      assert.equal(runChronicleComicAction(session, id, 'finish', 'skip').ok, false, 'a summary skip never bypasses the investigation');
      assert.equal(runChronicleComicAction(session, id, 'pick', method === 'trace' ? 2 : (definition.review.answer + 1) % 3).ok, false);
      assert.deepEqual(session, before);
      if (optional) advance('optional');
      const picks = method === 'trace' ? [0, 1, 2] : [definition.review.answer];
      advance('pick', picks[0]); assert.equal(saveChronicle(storage, session).ok, true);
      session = loadChronicle(storage, context).session; assert.ok(session); assert.equal(session.comicProgress[id].step, 1);
      assert.equal(session.comicProgress[id].extra, optional);
      for (const pick of picks.slice(1)) advance('pick', pick);
      assert.equal(get().phase, 'summary'); assert.equal(get().receipt, undefined);
      advance('finish', finish); session = decodeChronicle(encodeChronicle(session)); assert.ok(session);
      const completed = get(); assert.equal(completed.phase, 'resolved'); assert.equal(completed.receipt, definition.receipt);
      assert.equal(completed.resolution, definition.resolution);
      const { comicProgress, ...otherState } = session; assert.deepEqual(otherState, initial, 'actors, equipment and other information are unchanged');
      assert.equal(Object.keys(comicProgress).length, 1);
      const closed = structuredClone(session); assert.equal(runChronicleComicAction(session, id, 'finish', finish).ok, false);
      assert.deepEqual(session, closed, 'repeating a resolved callback cannot duplicate the receipt');
      outcomes.push([completed.receipt, completed.resolution]);
      advance('restart'); assert.equal(get().receipt, undefined); assert.equal(get().phase, 'select');
    }
    assert.equal(outcomes.length, 8); assert.ok(outcomes.every(outcome => JSON.stringify(outcome) === JSON.stringify(outcomes[0])));
    assert.equal(storage.getItem('relay-chronicles.save.v1'), campaign, 'the campaign witness save is byte-for-byte unchanged');
  });

  test(`${id}: the existing UI marks the fictional archive and keeps source provenance separate from its receipt`, () => {
    const session = createChronicle(context), ui = { mediaId, comicId: id }, view = { context: session.context, session };
    let html = renderComicReading(view, ui, esc);
    assert.match(html, /Exercice d’archives · Adaptation/);
    assert.match(html, /Ordonner les pièces/); assert.match(html, /Vérifier le classement/);
    assert.doesNotMatch(html, /data-comic-receipt/);
    for (const anchorId of definition.anchorIds) assert.ok(html.includes(`data-comic-anchor="${anchorId}"`));
    const state = { method: 'review', step: 1, extra: true, closed: true };
    html = renderComicReading({ ...view, session: { ...session, comicProgress: { [id]: state } } }, ui, esc);
    assert.match(html, /data-comic-receipt/); assert.ok(html.includes(esc(definition.receipt)));
    assert.match(html, /data-comic-origin="Adaptation"/);
    assert.ok(getComicBriefing(context, id).anchors.every(anchor => anchor.category === 'Fait établi'));
  });

  test(`${id}: another work cannot read, advance or import this preparation`, () => {
    const wrong = mediaId === 'RED' ? { mediaId: 'INV', periodId: 'inv' } : { mediaId: 'RED', periodId: 'red' };
    const state = { method: 'review', step: 1, extra: false, closed: true };
    assert.equal(getComicBriefing(wrong, id, state), null);
    const foreign = createChronicle(wrong); assert.equal(runChronicleComicAction(foreign, id, 'method', 'trace').ok, false);
    assert.equal(normalizeChronicle({ ...foreign, comicProgress: { [id]: state } }), null);
    assert.equal(getComicBriefing({ mediaId: 'ME1', periodId: 'me1' }, id), null);
  });
}

test('the new archive preparations do not imply scene-specific source verification or a recreated character dialogue', () => {
  const [red, invasion, discovery] = preparations;
  assert.deepEqual(red.anchorIds, ['RED-SC-PURSUIT-REF', 'RED-SC-ACCESS-REF']);
  assert.deepEqual(invasion.anchorIds, ['INV-REF-SCOPE', 'INV-SC-RETURN-REF']);
  assert.deepEqual(discovery.anchorIds, ['DIS-REF-SCOPE', 'DIS-REF-TIRAN']);
  for (const entry of preparations) {
    const authored = [entry.objective, ...entry.trace.flatMap(card => [card.label, card.text]), entry.optional.text, entry.resolution, entry.receipt].join('\n');
    assert.match(authored, /exercice/); assert.doesNotMatch(authored, /Aria\s*:|Feron\s*:|Tiran\s*:|Garson\s*:/);
    assert.equal(entry.cinematic, undefined); assert.equal(entry.fieldRoute, undefined);
  }
});
