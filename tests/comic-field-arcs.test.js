import test from 'node:test';
import assert from 'node:assert/strict';
import { comicArcFields } from '../src/comic-field-arcs.js';
import { normalizeContext } from '../src/continuity.js';
import { getUniverseRecord, getUniverseWork } from '../src/universe-data.js';
import { resolveComicAnchor } from '../src/comic-briefings.js';

const field = id => comicArcFields.find(item => item.id === id);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const length = (definition, route) => {
  const nodes = new Map(definition.nodes.map(node => [node.id, node]));
  return route.path.slice(1).reduce((total, id, index) => total + distance(nodes.get(route.path[index]), nodes.get(id)), 0);
};

test('four original field interventions bind their existing objective and attested anchors to the correct comic period', () => {
  assert.equal(comicArcFields.length, 4);
  assert.equal(new Set(comicArcFields.map(item => item.id)).size, comicArcFields.length);
  for (const definition of comicArcFields) {
    const context = normalizeContext({ mediaId: definition.mediaId, periodId: definition.periodId });
    assert.ok(context, definition.id);
    const work = getUniverseWork(definition.mediaId), period = work.periods.find(item => item.id === definition.periodId);
    assert.ok(period);
    const objective = getUniverseRecord(definition.objectiveId);
    assert.equal(objective.mediaId, definition.mediaId);
    assert.match(objective.id, /-SC-[A-Z]+-MAIN$/);
    assert.ok(definition.anchorIds.length);
    for (const id of definition.anchorIds) {
      const anchor = resolveComicAnchor(id, work, period, context);
      assert.ok(anchor, `${definition.id}: ${id} must resolve in its own period`);
      assert.ok(anchor.sources.length);
      assert.ok(anchor.sources.every(source => work.sources.some(item => item.id === source.id)));
      assert.equal(resolveComicAnchor(id, work, period, normalizeContext({ mediaId: 'ME1', periodId: 'me1' })), null);
    }
  }
});

test('each route requires distinct local actions, shares its entry and conclusion, and keeps its optional action reachable', () => {
  for (const definition of comicArcFields) {
    const nodes = new Map(definition.nodes.map(node => [node.id, node]));
    assert.equal(nodes.size, definition.nodes.length, definition.id);
    assert.equal(new Set(definition.nodes.map(node => `${node.x},${node.y}`)).size, nodes.size);
    assert.equal(definition.routes.length, 2);
    const [first, second] = definition.routes;
    assert.equal(first.path[0], second.path[0]);
    assert.equal(first.path.at(-1), second.path.at(-1));
    assert.notDeepEqual(first.path, second.path, `${definition.id}: method changes the actual route or action order`);
    const used = new Set();
    for (const route of definition.routes) {
      assert.ok(route.path.length >= 3 && route.path.length <= 6);
      assert.equal(new Set(route.path).size, route.path.length);
      assert.ok(route.path.includes(definition.optional.nodeId));
      assert.ok(route.label.trim() && route.detail.trim());
      for (const id of route.path) { assert.ok(nodes.has(id), `${definition.id}: ${id}`); used.add(id); }
      assert.ok(length(definition, route) > 0);
    }
    assert.deepEqual([...used].sort(), [...nodes.keys()].sort(), 'no authored interaction is orphaned from both methods');
    for (const node of nodes.values()) {
      assert.ok(Number.isInteger(node.x) && node.x >= 10 && node.x <= 90);
      assert.ok(Number.isInteger(node.y) && node.y >= 10 && node.y <= 90);
      assert.ok(node.label.trim() && node.detail.trim() && node.action.trim());
    }
    assert.ok(definition.optional.label.trim() && definition.optional.text.trim());
    assert.ok(definition.result.title.trim() && definition.result.text.trim());
    assert.deepEqual(JSON.parse(JSON.stringify(definition)), definition, 'field data survives a plain save payload without executable values');
  }
});

test('the route graph permits physical backtracking from every interaction without an isolated optional or method node', () => {
  for (const definition of comicArcFields) {
    const neighbors = new Map(definition.nodes.map(node => [node.id, new Set()]));
    for (const route of definition.routes) for (let index = 1; index < route.path.length; index++) {
      const from = route.path[index - 1], to = route.path[index];
      neighbors.get(from).add(to); neighbors.get(to).add(from);
    }
    for (const node of definition.nodes) {
      const visited = new Set([node.id]), queue = [node.id];
      while (queue.length) for (const adjacent of neighbors.get(queue.shift())) if (!visited.has(adjacent)) { visited.add(adjacent); queue.push(adjacent); }
      assert.equal(visited.size, definition.nodes.length, `${definition.id}/${node.id}: can return across the field`);
    }
    assert.equal(definition.team.length, 2);
    assert.equal(new Set(definition.team).size, 2);
    for (const role of definition.team) assert.doesNotMatch(role, /Shepard|Liara|Feron|Aria|Jack Harper|Petrovsky|Eva Coré/i, 'field crew is original, not an unauthorized comic recruitment');
  }
});

test('Redemption methods both pass identity before sector access and never turn a local credential into a universal key', () => {
  const definition = field('red-acces-local');
  for (const route of definition.routes) {
    assert.ok(route.path.indexOf('identite') < route.path.indexOf('secteur'));
    assert.ok(route.path.includes(route.id));
  }
  assert.match(definition.nodes.find(node => node.id === 'identite').detail, /aucun droit sur les autres portes/);
  assert.match(definition.nodes.find(node => node.id === 'secteur').detail, /s’arrête à C-7/);
  assert.equal(definition.optional.nodeId, 'secteur');
});

test('Evolution actually reverses the two information requests while retaining both reports and the aftermath boundary', () => {
  const definition = field('evo-depart-apres-guerre'), [military, personal] = definition.routes;
  assert.equal(definition.periodId, 'evo-aftermath');
  assert.ok(military.path.indexOf('militaire') < military.path.indexOf('personnel'));
  assert.ok(personal.path.indexOf('personnel') < personal.path.indexOf('militaire'));
  assert.deepEqual([...military.path].sort(), [...personal.path].sort(), 'both methods acquire the same reports and keep the same crew');
  const work = getUniverseWork('EVO'), contact = work.periods.find(period => period.id === 'evo-contact');
  assert.equal(resolveComicAnchor('EVO-SC-AFTERWAR-REF', work, contact, normalizeContext({ mediaId: 'EVO', periodId: 'evo-contact' })), null);
  assert.match(definition.nodes.find(node => node.id === 'annonce').detail, /après-guerre/);
});

test('Invasion routes retain the occupied-station raccord and Incursion observes both sightlines before either approach', () => {
  const invasion = field('inv-relais-conteste');
  for (const route of invasion.routes) for (const id of ['ralliement', 'liaison', 'relais']) assert.ok(route.path.includes(id));
  assert.match(invasion.result.text, /Omega toujours contestée/);
  assert.notEqual(invasion.routes[0].path[1], invasion.routes[1].path[1]);
  const incursion = field('inc-approche-du-seuil');
  assert.deepEqual(incursion.anchorIds, ['INC-REF-SCOPE'], 'use the attested publisher scope instead of upgrading the unverified CHECK reference');
  for (const route of incursion.routes) {
    assert.ok(route.path.indexOf('proche') < route.path.indexOf('eloigne'));
    assert.ok(route.path.indexOf('eloigne') < route.path.indexOf(route.id === 'direct' ? 'appui' : 'flanc'));
    assert.equal(route.path.at(-1), 'seuil');
  }
  assert.ok(length(incursion, incursion.routes.find(route => route.id === 'flanc')) < length(incursion, incursion.routes.find(route => route.id === 'direct')),
    'the announced shorter flank is shorter in the actual map geometry');
});
