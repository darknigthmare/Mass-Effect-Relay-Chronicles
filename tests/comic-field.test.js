import test from 'node:test';
import assert from 'node:assert/strict';
import { comicArcFields } from '../src/comic-field-arcs.js';
import { comicIssueFields } from '../src/comic-field-issues.js';
import { getComicField, listComicFields } from '../src/comic-field.js';
import { createChronicle, decodeChronicle, encodeChronicle, runChronicleFieldAction, selectChronicleScenario } from '../src/chronicles.js';

const definitions = [...comicArcFields, ...comicIssueFields];
const contextFor = ({ mediaId, periodId }) => ({ mediaId, periodId });

test('interventions compile into one exact media and period with labelled provenance', () => {
  assert.ok(definitions.length >= 8);
  for (const definition of definitions) {
    const context = contextFor(definition);
    const field = getComicField(context, definition.id);
    assert.equal(field?.phase, 'plan', definition.id);
    assert.ok(field.anchors.every(anchor => anchor.sources.length && anchor.category));
    assert.equal(field.result, undefined);
    assert.ok(listComicFields(context).find(item => item.id === definition.id));
    assert.equal(getComicField({ mediaId: 'ME1', periodId: 'me1' }, definition.id), null);
  }
  assert.equal(getComicField({ mediaId: 'EVO', periodId: 'evo-contact' }, 'evo-depart-apres-guerre'), null);
});

test('each method enforces local movement and rejoins the same result after save and resume', () => {
  for (const definition of definitions) {
    const context = contextFor(definition);
    const initial = createChronicle(context);
    const results = [];
    for (const [methodIndex, method] of definition.routes.entries()) {
      let session = initial;
      const act = (action, value) => {
        const result = runChronicleFieldAction(session, definition.id, action, value);
        assert.equal(result.ok, true, `${definition.id}/${action}/${value}`);
        session = decodeChronicle(encodeChronicle(result.session));
        assert.ok(session);
      };
      const reject = (action, value) => assert.equal(runChronicleFieldAction(session, definition.id, action, value).ok, false);
      reject('finish', 'archive');
      act('route', method.id);
      reject('move', method.path[1]);
      reject('work', method.path[1]);
      for (const [index, node] of method.path.entries()) {
        if (index) act('move', node);
        if (index === 1) {
          act('move', method.path[0]);
          act('move', node);
        }
        if (methodIndex === 0 && node === definition.optional.nodeId) {
          act('optional');
          reject('optional');
        }
        act('work', node);
        reject('work', node);
      }
      const view = () => getComicField(context, definition.id, session.comicFields[definition.id]);
      assert.equal(view().phase, 'summary');
      act('finish', methodIndex === 0 ? 'archive' : 'skip');
      assert.equal(view().phase, 'resolved');
      assert.equal(view().state.extra, methodIndex === 0);
      results.push(view().result);
      assert.deepEqual(session.party, initial.party);
      assert.deepEqual(session.discovered, initial.discovered);
      assert.deepEqual(session.cleared, initial.cleared);
      reject('finish', 'archive');
      act('restart');
      assert.equal(session.comicFields[definition.id], undefined);
    }
    assert.deepEqual(results[0], results[1]);
  }
});

test('field progress survives an ATB scenario selection and rejects forged positions or foreign scopes', () => {
  const definition = comicArcFields.find(field => field.mediaId === 'RED');
  const context = contextFor(definition);
  const initial = createChronicle(context);
  const started = runChronicleFieldAction(initial, definition.id, 'route', definition.routes[0].id).session;
  const selected = selectChronicleScenario(started, initial.scenarioId);
  assert.deepEqual(selected.session.comicFields, started.comicFields);

  const packet = JSON.parse(encodeChronicle(started));
  packet.session.comicFields[definition.id].position = 2;
  assert.equal(decodeChronicle(packet), null);
  packet.session.comicFields[definition.id].position = 0;
  packet.session.comicFields[definition.id].closed = true;
  assert.equal(decodeChronicle(packet), null);
  packet.session = { ...createChronicle({ mediaId: 'INC', periodId: 'inc' }), comicFields: started.comicFields };
  assert.equal(decodeChronicle(packet), null);
});
