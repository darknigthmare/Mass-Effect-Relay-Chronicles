import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { comicIssueFields } from '../src/comic-field-issues.js';
import { normalizeContext } from '../src/continuity.js';
import { getUniverseRecord, getUniverseWork } from '../src/universe-data.js';

const expected = [
  ['hom-vega-present-field', 'HOM', 'hom-1-present', 'HOM-SC-VEGA-PRESENT-MAIN'],
  ['hom-tali-trace-field', 'HOM', 'hom-2-tali', 'HOM-SC-TALI-TRACE-MAIN'],
  ['hom-tali-citadel-field', 'HOM', 'hom-2-tali', 'HOM-SC-TALI-CITADEL-MAIN'],
  ['fou-themis-field', 'FOU', 'fou-1', 'FOU-SC-01-MAIN'],
  ['fou-kasumi-field', 'FOU', 'fou-10', 'FOU-SC-10-MAIN'],
];
const text = value => typeof value === 'string' && value.trim().length > 0;
const field = id => comicIssueFields.find(entry => entry.id === id);

test('the five original fields address exact existing issue objectives without moving their source periods', () => {
  assert.deepEqual(comicIssueFields.map(entry => [entry.id, entry.mediaId, entry.periodId, entry.objectiveId]), expected);
  for (const definition of comicIssueFields) {
    const context = normalizeContext({ mediaId: definition.mediaId, periodId: definition.periodId });
    assert.ok(context, definition.id);
    const work = getUniverseWork(definition.mediaId), period = work.periods.find(entry => entry.id === definition.periodId);
    const catalogue = JSON.parse(readFileSync(new URL(`../docs/universe/catalogs/${definition.mediaId}.json`, import.meta.url), 'utf8'));
    const objective = catalogue.entries.find(entry => entry.id === definition.objectiveId);
    assert.equal(objective.priority, 'P0');
    assert.equal(objective.category, 'main_quests');
    assert.ok(objective.name.startsWith(definition.title), definition.objectiveId);
    assert.deepEqual(definition.anchorIds.slice(1), objective.dependencies);
    assert.ok(period.sourceIds.includes(definition.anchorIds[0]), definition.id);
    for (const id of definition.anchorIds) {
      const source = work.sources.find(entry => entry.id === id);
      if (source) { assert.match(source.url, /^https?:\/\//); continue; }
      const anchor = getUniverseRecord(id);
      assert.equal(anchor.mediaId, definition.mediaId); assert.ok(period.reference.includes(id), id);
      assert.equal(anchor.nature, 'À vérifier', 'A playable original exercise cannot promote the historical confidence of a reference');
      assert.equal(anchor.fact, false, id);
      assert.ok(anchor.sourceIds.length); assert.ok(anchor.sourceIds.every(sourceId => work.sources.some(source => source.id === sourceId)));
    }
  }
  assert.notEqual(field('hom-vega-present-field').periodId, 'hom-1-youth');
});

test('both spatial approaches reach the same finish through distinct nodes and a shared optional halt', () => {
  for (const definition of comicIssueFields) {
    assert.equal(definition.routes.length, 2, definition.id);
    assert.equal(new Set(definition.routes.map(route => route.id)).size, 2);
    const nodes = new Map(definition.nodes.map(node => [node.id, node]));
    assert.equal(nodes.size, definition.nodes.length, 'Node IDs cannot silently replace a required step');
    const positions = new Set();
    for (const node of definition.nodes) {
      assert.ok([node.id, node.label, node.detail, node.action].every(text));
      assert.ok(Number.isInteger(node.x) && node.x >= 10 && node.x <= 90);
      assert.ok(Number.isInteger(node.y) && node.y >= 10 && node.y <= 90);
      assert.ok(!positions.has(`${node.x}:${node.y}`), 'Distinct stops must have distinct visible positions');
      positions.add(`${node.x}:${node.y}`);
    }
    const [first, second] = definition.routes;
    assert.notDeepEqual(first.path, second.path);
    assert.equal(first.path[0], second.path[0]); assert.equal(first.path.at(-1), second.path.at(-1));
    assert.ok(first.path.some(id => !second.path.includes(id)) && second.path.some(id => !first.path.includes(id)), 'A method must change the actual traversed nodes');
    for (const route of definition.routes) {
      assert.ok([route.id, route.label, route.detail].every(text));
      assert.ok(route.path.length >= 3 && route.path.length <= 6); assert.equal(new Set(route.path).size, route.path.length);
      assert.ok(route.path.every(id => nodes.has(id)));
      assert.ok(route.path.includes(definition.optional.nodeId));
      assert.ok(route.path.indexOf(definition.optional.nodeId) > 0 && route.path.indexOf(definition.optional.nodeId) < route.path.length - 1);
      assert.ok(nodes.get(route.path[0]).action && nodes.get(route.path.at(-1)).action, 'Entering or reaching the exit still requires a local action');
    }
    assert.deepEqual(new Set([...first.path, ...second.path]), new Set(nodes.keys()), 'No authored stop is unreachable from both approaches');
    assert.ok([definition.optional.label, definition.optional.text, definition.result.title, definition.result.text].every(text));
  }
});

test('the routes retain the catalogue choice categories instead of replacing them with generic reading methods', () => {
  const categories = new Map([
    ['hom-vega-present-field', [/registre/i, /guichet/i]],
    ['hom-tali-trace-field', [/dissimuler/i, /diversion technique/i]],
    ['hom-tali-citadel-field', [/service/i, /contact indirect/i]],
    ['fou-themis-field', [/rondes/i, /passage de service/i]],
    ['fou-kasumi-field', [/fenêtre d’observation/i, /interface locale/i]],
  ]);
  for (const definition of comicIssueFields) {
    const catalogue = JSON.parse(readFileSync(new URL(`../docs/universe/catalogs/${definition.mediaId}.json`, import.meta.url), 'utf8'));
    const choice = catalogue.entries.find(entry => entry.id === definition.objectiveId.replace(/-MAIN$/, '-CHOICE'));
    assert.deepEqual(choice.dependencies, [definition.objectiveId]);
    categories.get(definition.id).forEach((pattern, index) => assert.match(definition.routes[index].label, pattern));
    assert.ok(definition.routes.every(route => route.detail.length > 60), 'Both approaches need a useful description before selection');
    assert.ok(definition.routes.every(route => !['trace', 'review'].includes(route.id)), 'A spatial approach is not an archive quiz method');
  }
});

test('custody, preparation and young-character restrictions are explicit in the authored local actions', () => {
  const protectedFile = field('hom-tali-trace-field');
  const [hidden, diversion] = protectedFile.routes;
  assert.ok(hidden.path.length > diversion.path.length, 'The concealed detour includes an extra mandatory halt');
  assert.ok(diversion.path.indexOf('workbench') < diversion.path.indexOf('emitter'), 'Local diversion preparation precedes use');
  assert.ok(protectedFile.routes.every(route => route.path.indexOf('checkpoint') < route.path.indexOf('finish')));
  assert.match(protectedFile.nodes.find(node => node.id === 'start').action, /scellé PT-02/);
  assert.match(protectedFile.nodes.find(node => node.id === 'checkpoint').action, /seconde fois/);
  assert.match(protectedFile.result.text, /même support PT-02.*scellé/);
  const childhood = field('fou-themis-field');
  assert.match(childhood.team[0], /Jeune/);
  assert.doesNotMatch(JSON.stringify(childhood), /fusil|pistolet|assassinat|biotique|grenade|recrut/i);
  const infiltration = field('fou-kasumi-field');
  assert.ok(infiltration.routes[1].path.indexOf('preparation') < infiltration.routes[1].path.indexOf('interface'));
  assert.match(infiltration.result.text, /accessoire ER-10 reste sur place/);
  for (const definition of comicIssueFields) {
    assert.equal(definition.team.length, 2); assert.equal(new Set(definition.team).size, 2);
    assert.ok(definition.team.every(text));
    assert.ok(Object.isFrozen(definition) && Object.isFrozen(definition.nodes) && Object.isFrozen(definition.routes[0].path));
  }
});
