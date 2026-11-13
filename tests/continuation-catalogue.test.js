import test from 'node:test';
import assert from 'node:assert/strict';
import { UNIVERSE_WORKS, UNIVERSE_RECORDS, UNIVERSE_SUMMARY } from '../src/universe-data.js';
import { getProductionCatalogueView, renderProductionCatalogue, renderProductionResults, renderProductionCredits, productionSourceURL } from '../src/continuation-catalogue.js';

const statuses = ['Défini', 'Prototype', 'Intégré', 'Validé'];

test('production archive enumerates every work once and every record across its pages without omission', () => {
  assert.equal(UNIVERSE_WORKS.length, 28);
  const all = getProductionCatalogueView();
  assert.equal(all.total, UNIVERSE_SUMMARY.recordCount);
  assert.equal(all.sourceCount, UNIVERSE_SUMMARY.sourceCount);
  assert.equal(all.records.length, UNIVERSE_RECORDS.length);
  for (const work of UNIVERSE_WORKS) {
    const expected = UNIVERSE_RECORDS.filter(record => record.catalogWorkId === work.id);
    const view = getProductionCatalogueView({ workId: work.id }), actual = [];
    for (let page = 0; page < view.pages; page++) actual.push(...getProductionCatalogueView({ workId: work.id, page }).visible);
    assert.deepEqual(actual.map(record => record.id), expected.map(record => record.id), work.id);
    assert.equal(new Set(actual.map(record => record.id)).size, expected.length);
  }
  assert.equal(Object.values(all.counts).reduce((sum, count) => sum + count, 0), all.total);
});

test('combined work/status/search filters cannot leak another work or invent a playable record', () => {
  for (const work of UNIVERSE_WORKS) for (const status of statuses) {
    const view = getProductionCatalogueView({ workId: work.id, status });
    const expected = UNIVERSE_RECORDS.filter(record => record.catalogWorkId === work.id && record.status === status);
    assert.deepEqual(view.records, expected);
    assert.ok(view.records.every(record => record.playable === false));
    for (const record of view.visible) assert.ok(renderProductionResults({ workId: work.id, status }).includes(record.id));
  }
  const first = UNIVERSE_RECORDS.find(record => record.catalogWorkId === 'ME2');
  assert.deepEqual(getProductionCatalogueView({ workId: 'ME2', status: first.status, query: first.id }).records, [first]);
  assert.equal(getProductionCatalogueView({ workId: 'ME1', query: first.id }).records.length, 0);
});

test('French accent search, invalid filters, empty results and page bounds remain usable', () => {
  assert.deepEqual(getProductionCatalogueView({ query: 'FÉROS' }).records, getProductionCatalogueView({ query: 'feros' }).records);
  assert.ok(getProductionCatalogueView({ query: 'feros' }).records.length > 0);
  for (const page of [-1, NaN, Infinity, '1', 1.5]) assert.equal(getProductionCatalogueView({ page }).page, 0);
  const maximum = getProductionCatalogueView({ page: Number.MAX_SAFE_INTEGER }); assert.equal(maximum.page, maximum.pages - 1);
  const invalid = getProductionCatalogueView({ workId: '<bad>', status: 'ready', query: 42 });
  assert.equal(invalid.workId, 'all'); assert.equal(invalid.status, ''); assert.equal(invalid.query, '');
  const empty = getProductionCatalogueView({ query: 'NO-SUCH-RECORD-782734' });
  assert.deepEqual(empty.visible, []); assert.equal(empty.selected, null); assert.equal(empty.page, 0); assert.equal(empty.pages, 1);
  assert.match(renderProductionResults({ query: 'NO-SUCH-RECORD-782734' }), /Aucune fiche/);
});

test('selection belongs to the visible page and archive rendering preserves the runtime records', () => {
  const original = JSON.stringify(UNIVERSE_RECORDS);
  const first = getProductionCatalogueView(), second = first.visible[1];
  assert.equal(getProductionCatalogueView({ recordId: second.id }).selected.id, second.id);
  assert.equal(getProductionCatalogueView({ page: 1, recordId: second.id }).selected.id, UNIVERSE_RECORDS[12].id);
  for (const work of UNIVERSE_WORKS) { renderProductionCatalogue({ workId: work.id }); renderProductionCredits(work.id); }
  assert.equal(JSON.stringify(UNIVERSE_RECORDS), original);
  assert.ok(UNIVERSE_RECORDS.every(Object.isFrozen));
});

test('references accept HTTPS only and archive text escapes search content', () => {
  for (const value of ['javascript:alert(1)', 'data:text/html,<script>', 'http://example.com', '//example.com', '', 'garbage']) assert.equal(productionSourceURL(value), '');
  assert.equal(productionSourceURL('https://example.com/reference?q=me1'), 'https://example.com/reference?q=me1');
  const text = '<img src=x onerror="evil()">&';
  const html = renderProductionCatalogue({ query: text });
  assert.ok(!html.includes(text)); assert.match(html, /&lt;img/); assert.match(html, /&quot;/); assert.match(html, /&amp;/);
  assert.ok(getProductionCatalogueView({ query: 'x'.repeat(500) }).query.length <= 300);
});

test('every work exposes its actual sources and distinguishes experiment, campaign and documentary scope', () => {
  for (const work of UNIVERSE_WORKS) {
    const html = renderProductionCredits(work.id);
    assert.match(html, new RegExp(`${work.sources.length} références`));
    assert.equal((html.match(/class="production-source"/g) || []).length, work.sources.length);
    const links = [...html.matchAll(/<a href="([^"]+)"[^>]+>/g)];
    assert.equal(links.length, work.sources.filter(source => productionSourceURL(source.url)).length);
    assert.ok(links.every(match => match[1].startsWith('https:') && match[0].includes('rel="noopener noreferrer"')));
    assert.match(html, /Campagne ME1/); assert.match(html, /Chroniques/); assert.match(html, /Simulation/);
    assert.match(html, /non officielle/); assert.match(html, /validation artistique en cours/);
  }
  const html = renderProductionCatalogue();
  for (const status of statuses) assert.ok(html.includes(status));
  assert.match(html, /Il ne rend pas cette fiche jouable/);
});
