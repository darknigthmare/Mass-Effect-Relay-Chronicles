import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectEditorialCatalogue, observeEditorialSource, EDITORIAL_WORKS } from '../scripts/p0-editorial-audit.mjs';
import { UNIVERSE_RECORDS, getUniverseWork } from '../src/universe-data.js';
import { renderProductionCredits, renderProductionResults } from '../src/continuation-catalogue.js';

test('editorial audit reports unsupported facts and substitute text for review without making an offline source claim', async () => {
  const catalogue = {
    id: 'test',
    canonNote: 'Exemples de production.',
    coverage: [{ area: 'Sujets', remaining: 'Publication complète à consulter.' }],
    sources: [{ id: 'source', scope: 'Notice bibliographique', note: 'Édition complète à vérifier.' }],
    entries: [
      { id: 'test-ok', nature: 'Établi', sourceIds: ['source'], description: 'Une notice.' },
      { id: 'test-missing', nature: 'Établi', sourceIds: [] },
      { id: 'test-dangling', nature: 'À vérifier', sourceIds: ['different-source'] },
      { id: 'test-metric', nature: 'Établi', sourceIds: ['source'], gameplay: '100 PV.' },
      { id: 'test-dialogue', nature: 'Extrapolation', sourceIds: [], description: '— Départ.\n— Arrivée.' },
      { id: 'test-extract', nature: 'Extrapolation', sourceIds: [], description: 'Exemple '.repeat(100) },
    ],
  };
  assert.deepEqual(inspectEditorialCatalogue(catalogue).findings.map(({ id }) => id),
    ['test-missing', 'test-dangling', 'test-metric', 'test-dialogue', 'test-extract']);
  const notProbed = await observeEditorialSource({ url: 'https://example.test/reference' }, new Set());
  assert.equal(notProbed.outcome, 'not-probed');
  assert.ok(notProbed.limit);
  assert.equal((await observeEditorialSource({ url: 'https://user@example.test/reference' }, new Set())).outcome, 'invalid-url');
});

test('the production archive exposes linked source notes and separates work-wide references from unsourced entries', () => {
  for (const workId of EDITORIAL_WORKS) {
    const work = getUniverseWork(workId);
    const linked = UNIVERSE_RECORDS.find(record => record.catalogWorkId === workId && record.fact && record.sourceIds.length > 0);
    const result = renderProductionResults({ workId, query: linked.id });
    assert.ok(result.includes(`data-production-record="${linked.id}"`));
    assert.match(result, /data-production-record-nature>Établi/);
    assert.match(result, /data-production-source-kind/);
    assert.match(result, /data-production-source-note/);
    assert.match(result, /data-production-documentation-limits/);
    assert.equal(result.includes('data-production-work-sources'), false);

    const unlinked = renderProductionResults({ workId, query: `${workId}-QA-SOURCES` });
    assert.match(unlinked, /data-production-missing-source/);
    assert.match(unlinked, /<details data-production-work-sources>/);
    assert.ok(unlinked.includes(`data-production-source-id="${work.sources[0].id}"`));
    const credits = renderProductionCredits(workId);
    assert.ok(credits.includes(`data-production-source-id="${work.sources[0].id}"`));
    assert.match(credits, /data-production-documentation-limits/);
  }
});
