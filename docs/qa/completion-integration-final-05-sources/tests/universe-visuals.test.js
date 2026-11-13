import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { ARSENAL_VISUAL_DATA } from '../src/arsenal-visual-data.js';
import { getUniverseVisual, listUniverseVisuals } from '../src/universe-visuals.js';
import { normalizeContext, canAccessContent } from '../src/continuity.js';
import { CHRONICLE_SCENARIOS, canUseUniverseActor, getUniverseActor, universeActorFor } from '../src/universe-actors.js';

const me2 = { mediaId: 'ME2', periodId: 'me2' }, me3 = { mediaId: 'ME3', periodId: 'me3' };
const shepard = 'ME2-CHR-SHEPARD', jack = 'ME2-CHR-JACK', loki = 'ME2-ENM-LOKI';
const visual = (changes = {}) => ({ id: 'fixture-shepard', recordIds: [shepard], mediaId: 'ME2', periodIds: ['me2'],
  category: 'characters', src: './assets/fixture.png', atlasWidth: 1536, atlasHeight: 1024,
  sourceRect: [0, 0, 512, 512], sha256: 'a'.repeat(64), partial: true, caption: 'Illustration partielle de prototype.',
  sourceBasis: { kind: 'prototype', references: ['manual reference, no full model claim'] }, primaryVisualVerified: false,
  ...changes });
const copy = value => structuredClone(value);

// Substitute only the data binding and import URLs. The public helper code is
// exercised unchanged against hostile metadata; generated files stay untouched.
const helperURL = new URL('../src/universe-visuals.js', import.meta.url);
const helperSource = await readFile(helperURL, 'utf8');
let fixtureSerial = 0;
async function fixture(data) {
  const key = `__relayVisualFixture${++fixtureSerial}`;
  Object.defineProperty(globalThis, key, { configurable: true, value: data });
  const source = helperSource.replace("import { ARSENAL_VISUAL_DATA } from './arsenal-visual-data.js';",
    `const ARSENAL_VISUAL_DATA = globalThis[${JSON.stringify(key)}];`)
    .replace(/from '(\.\/[^']+)';/g, (_, relative) => `from '${new URL(relative, helperURL).href}';`);
  assert.notEqual(source, helperSource);
  try { return await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`); }
  finally { delete globalThis[key]; }
}
const deeplyFrozen = value => !value || typeof value !== 'object'
  || Object.isFrozen(value) && Object.values(value).every(deeplyFrozen);

test('distributed visual metadata points to the exact unmodified RGBA PNG atlases', async () => {
  const metadata = JSON.parse(await readFile(new URL('../public/assets/arsenal-visuals.json', import.meta.url), 'utf8'));
  assert.deepEqual(metadata.visuals, ARSENAL_VISUAL_DATA, 'Published metadata and application bindings agree exactly');
  assert.equal(metadata.globalFidelityCertified, false);
  assert.deepEqual([...new Set(ARSENAL_VISUAL_DATA.map(row => row.category))].sort(),
    ['characters', 'bosses', 'enemies', 'npcs', 'costumes', 'weapons', 'mods', 'vehicles', 'ships'].sort());
  const seen = new Map();
  for (const row of ARSENAL_VISUAL_DATA) {
    if (seen.has(row.src)) { assert.equal(row.sha256, seen.get(row.src)); continue; }
    const bytes = await readFile(new URL(`../public/${row.src.slice(2)}`, import.meta.url));
    assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    assert.equal(bytes.toString('ascii', 12, 16), 'IHDR');
    assert.equal(bytes.readUInt32BE(16), row.atlasWidth); assert.equal(bytes.readUInt32BE(20), row.atlasHeight);
    assert.equal(bytes[24], 8); assert.equal(bytes[25], 6, 'Native RGBA, without an alpha-conversion pass');
    assert.equal(createHash('sha256').update(bytes).digest('hex'), row.sha256);
    seen.set(row.src, row.sha256);
  }
  assert.equal(seen.size, new Set(ARSENAL_VISUAL_DATA.map(row => row.src)).size);
});

test('every distributed mapping respects exact documentary provenance and preserves irregular rectangles', () => {
  for (const row of ARSENAL_VISUAL_DATA) {
    assert.equal(row.partial, true); assert.equal(row.primaryVisualVerified, false);
    for (const periodId of row.periodIds) for (const id of row.recordIds) {
      const context = { mediaId: row.mediaId, periodId }, result = getUniverseVisual(id, context);
      if (!canAccessContent(id, context).ok) { assert.equal(result, null); continue; }
      assert.ok(result, `${row.id}/${id}`); assert.deepEqual(result, row);
      assert.equal(deeplyFrozen(result), true);
      assert.deepEqual(result.sourceRect, row.sourceRect, 'No assumed square-grid recropping');
      assert.throws(() => { result.sourceRect[0] = 99; }, TypeError);
      assert.equal(getUniverseVisual(id.toLowerCase(), context), null);
    }
  }
});

test('reference visuals do not grant NPCs, equipment or enemies any playable role', async () => {
  const npc = 'ME2-NPC-ILLUSIVE', weapon = 'ME2-WPN-VINDICATOR';
  const api = await fixture([visual({ id: 'npc', recordIds: [npc], category: 'npcs' }),
    visual({ id: 'weapon', recordIds: [weapon], category: 'weapons' }), visual({ id: 'enemy', recordIds: [loki], category: 'enemies' })]);
  for (const id of [npc, weapon, loki]) {
    assert.ok(api.getUniverseVisual(id, me2));
    assert.ok(api.getUniverseVisual(id, me2, { usage: 'reference', scenarioId: 'unrelated-reference-selection' }));
    assert.equal(api.getUniverseVisual(id, me2, { usage: 'party', scenarioId: 'me2-freedoms-progress' }), null);
  }
  for (const id of [npc, weapon]) {
    assert.equal(api.getUniverseVisual(id, me2, { usage: 'combat', scenarioId: 'me2-freedoms-progress' }), null);
  }
});

test('narrow ME1 Mako and Normandy references stay documentary and retain their exact separate identities', () => {
  const context = { mediaId: 'ME1', periodId: 'me1' };
  for (const id of ['REF-VEH-M35-MAKO-ME1', 'REF-SHP-NORMANDY-SR1-ME1']) {
    assert.ok(canAccessContent(id, context).ok);
    const result = getUniverseVisual(id, context); assert.ok(result); assert.equal(result.mediaId, 'ME1');
    assert.equal(getUniverseVisual(id, me2), null); assert.equal(getUniverseVisual(id, me3), null);
    for (const usage of ['party', 'combat']) {
      assert.equal(getUniverseVisual(id, context, { usage }), null);
      for (const scenarioId of ['me1-campaign', 'me2-freedoms-progress', 'me3-equipment-workshop'])
        assert.equal(getUniverseVisual(id, context, { usage, scenarioId }), null);
    }
  }
  assert.notEqual(getUniverseVisual('REF-VEH-M35-MAKO-ME1', context).id,
    getUniverseVisual('REF-SHP-NORMANDY-SR1-ME1', context).id);
});

test('party and combat visuals require the actual player roster in the exact scenario', async () => {
  const api = await fixture([visual(), visual({ id: 'jack', recordIds: [jack] })]);
  for (const usage of ['party', 'combat']) {
    assert.ok(api.getUniverseVisual(shepard, me2, { usage, scenarioId: 'me2-freedoms-progress' }));
    assert.ok(api.getUniverseVisual(jack, me2, { usage, scenarioId: 'me2-equipment-workshop' }));
    assert.equal(api.getUniverseVisual(jack, me2, { usage, scenarioId: 'me2-freedoms-progress' }), null);
    for (const scenarioId of [undefined, 'unknown', 'me3-equipment-workshop'])
      assert.equal(api.getUniverseVisual(shepard, me2, { usage, scenarioId }), null);
  }
});

test('an enemy visual is available only for a scenario declaring that exact catalogue enemy', async () => {
  const api = await fixture([visual({ id: 'loki', recordIds: [loki], category: 'enemies' })]);
  assert.ok(api.getUniverseVisual(loki, me2, { usage: 'combat', scenarioId: 'me2-freedoms-progress' }));
  assert.equal(api.getUniverseVisual(loki, me2, { usage: 'combat', scenarioId: 'me2-equipment-workshop' }), null,
    'Abstract workshop targets do not borrow a named enemy appearance');
  assert.equal(api.getUniverseVisual('chronicle-enemy-0', me2, { usage: 'combat', scenarioId: 'me2-freedoms-progress' }), null);
  assert.equal(api.getUniverseVisual(loki, me2, { usage: 'party', scenarioId: 'me2-freedoms-progress' }), null);
});

test('real distributed combat overlays agree with all scenario rosters and enemy identities', () => {
  for (const row of ARSENAL_VISUAL_DATA) for (const id of row.recordIds) for (const scene of CHRONICLE_SCENARIOS) {
    const reference = getUniverseVisual(id, scene.context);
    const player = !!reference && canUseUniverseActor(scene.context, id, scene.id).ok;
    const enemy = !!reference && scene.enemies.some(item => item.catalogId === id);
    assert.equal(!!getUniverseVisual(id, scene.context, { usage: 'party', scenarioId: scene.id }), player, `${id}/${scene.id}/party`);
    assert.equal(!!getUniverseVisual(id, scene.context, { usage: 'combat', scenarioId: scene.id }), player || enemy, `${id}/${scene.id}/combat`);
  }
});

test('same-name characters, earlier chapters, other galaxies and caller-defined dates never inherit a visual', async () => {
  const api = await fixture([visual({ id: 'garrus', recordIds: ['ME3-CHR-GARRUS'], mediaId: 'ME3', periodIds: ['me3'] })]);
  assert.ok(api.getUniverseVisual('ME3-CHR-GARRUS', me3));
  for (const ctx of [me2, { mediaId: 'ME1', periodId: 'me1' }, { mediaId: 'ME3', periodId: 'me3-prologue' },
    { mediaId: 'MEA', periodId: 'mea' }, { ...me3, galaxy: 'andromeda' }, { ...me3, year: 2186 }]) {
    assert.equal(api.getUniverseVisual('ME3-CHR-GARRUS', ctx), null);
  }
  for (const id of ['garrus', 'ME2-CHR-GARRUS', 'CHR-garrus-vakarian', {}, 1, null, 'constructor']) {
    assert.equal(api.getUniverseVisual(id, me3), null);
  }
  const foreign = await fixture([visual({ recordIds: ['ME3-CHR-GARRUS'] })]);
  assert.equal(foreign.getUniverseVisual('ME3-CHR-GARRUS', me2), null);
});

test('malformed paths, dimensions, rectangles, scopes and unsupported completion claims are rejected', async () => {
  const changes = [
    { src: 'https://example.com/image.png' }, { src: '/assets/image.png' }, { src: './assets/../image.png' },
    { src: './assets/image.svg' }, { src: './assets/image.png?script' }, { src: './assets/a//b.png' },
    { atlasWidth: 0 }, { atlasHeight: 16385 }, { atlasWidth: 1.5 },
    { sourceRect: [0, 0, 0, 512] }, { sourceRect: [-1, 0, 512, 512] }, { sourceRect: [1000, 0, 600, 512] },
    { sourceRect: [0, 900, 512, 200] }, { sourceRect: [0, 0, 512.1, 512] }, { sourceRect: [0, 0, 512] },
    { sha256: 'invalid' }, { partial: false }, { primaryVisualVerified: true },
    { caption: '' }, { sourceBasis: null }, { sourceBasis: '' }, { sourceBasis: [] },
    { recordIds: [] }, { recordIds: [shepard, shepard] }, { recordIds: ['unknown-catalogue-record'] },
    { periodIds: [] }, { periodIds: ['me2', 'me2'] }, { periodIds: ['me3'] }, { mediaId: 'ME4' },
    { extra: 'no extra fields' }, { category: {} },
  ];
  for (const change of changes) {
    const api = await fixture([visual(change)]);
    assert.equal(api.getUniverseVisual(shepard, me2), null, JSON.stringify(change));
    assert.deepEqual(api.listUniverseVisuals(me2), []);
  }
  const valid = await fixture([visual({ sourceRect: [0, 0, 620, 540] })]);
  assert.deepEqual(valid.getUniverseVisual(shepard, me2).sourceRect, [0, 0, 620, 540]);
});

test('metadata getters, inherited prototypes, hidden fields, cycles and symbols never execute or become overlays', async () => {
  let calls = 0;
  const accessor = visual(); Object.defineProperty(accessor, 'src', { enumerable: true, get() { calls++; throw Error('getter'); } });
  const nested = visual(); Object.defineProperty(nested.sourceBasis, 'reference', { enumerable: true, get() { calls++; throw Error('getter'); } });
  const hidden = visual(); Object.defineProperty(hidden, 'secret', { value: 'hidden' });
  const symbolic = visual(); symbolic[Symbol('extra')] = true;
  const cyclic = visual(); cyclic.sourceBasis.loop = cyclic;
  const inherited = Object.assign(Object.create({ inherited: true }), visual());
  const sparse = visual(); sparse.recordIds.length = 2;
  const accessorArray = visual(); Object.defineProperty(accessorArray.recordIds, '0', { enumerable: true, get() { calls++; return shepard; } });
  const forbidden = visual(); forbidden.sourceBasis = JSON.parse('{"__proto__":{}}');
  for (const row of [accessor, nested, hidden, symbolic, cyclic, inherited, sparse, accessorArray, forbidden]) {
    const api = await fixture([row, visual({ id: 'unaffected', recordIds: [jack] })]);
    assert.equal(api.getUniverseVisual(shepard, me2), null); assert.ok(api.getUniverseVisual(jack, me2));
  }
  const proxied = new Proxy(visual(), { get() { calls++; throw Error('No property reads'); } });
  const api = await fixture([proxied]); assert.ok(api.getUniverseVisual(shepard, me2), 'Only validated own data descriptors are snapshotted');
  assert.equal(calls, 0);
});

test('hostile top-level collections fail closed without evaluating indexed getters', async () => {
  let calls = 0;
  const accessor = [visual()]; Object.defineProperty(accessor, '0', { enumerable: true, get() { calls++; return visual(); } });
  const sparse = []; sparse.length = 1;
  const symbolic = [visual()]; symbolic[Symbol('extra')] = true;
  const inherited = [visual()]; Object.setPrototypeOf(inherited, Object.create(Array.prototype));
  const { proxy, revoke } = Proxy.revocable([], {}); revoke();
  for (const data of [null, {}, accessor, sparse, symbolic, inherited, proxy]) {
    const api = await fixture(data); assert.equal(api.getUniverseVisual(shepard, me2), null); assert.deepEqual(api.listUniverseVisuals(me2), []);
  }
  const data = new Proxy([visual()], { get() { calls++; throw Error('No indexed reads'); } });
  const api = await fixture(data); assert.ok(api.getUniverseVisual(shepard, me2)); assert.equal(calls, 0);
});

test('options are inspected before use, including their getters, prototypes and extra keys', async () => {
  const api = await fixture([visual()]); let calls = 0;
  const accessor = {}; Object.defineProperty(accessor, 'usage', { enumerable: true, get() { calls++; return 'reference'; } });
  const hidden = {}; Object.defineProperty(hidden, 'scenarioId', { value: 'me2-freedoms-progress' });
  for (const options of [null, [], accessor, hidden, Object.create({ usage: 'reference' }),
    { [Symbol('extra')]: true }, { usage: 'unknown' }, { extra: true }, { scenarioId: null }, { scenarioId: {} }]) {
    assert.equal(api.getUniverseVisual(shepard, me2, options), null);
  }
  assert.ok(api.getUniverseVisual(shepard, me2, { usage: undefined, scenarioId: undefined }));
  const contextGetter = { periodId: 'me2' }; Object.defineProperty(contextGetter, 'mediaId', { enumerable: true, get() { calls++; return 'ME2'; } });
  assert.equal(api.getUniverseVisual(shepard, contextGetter), null); assert.equal(calls, 0);
});

test('returned metadata is a detached immutable snapshot and gallery aliases are unique', async () => {
  const row = visual({ recordIds: [shepard, 'ME2-CHR-MIRANDA'] }), before = copy(row), api = await fixture([row]);
  const result = api.getUniverseVisual(shepard, me2);
  assert.deepEqual(result, before); assert.equal(deeplyFrozen(result), true);
  const list = api.listUniverseVisuals(me2); assert.equal(list.length, 1); assert.equal(list[0], result); assert.ok(Object.isFrozen(list));
  assert.throws(() => list.push(result), TypeError);
  assert.throws(() => result.sourceBasis.references.push('forged'), TypeError);
  row.caption = 'Mutated external configuration'; row.sourceBasis.references[0] = 'Changed'; row.recordIds.length = 0;
  assert.deepEqual(api.getUniverseVisual(shepard, me2), before);
});

test('duplicate visual identities and overlapping record scopes never resolve by array order', async () => {
  const duplicateIds = await fixture([visual(), visual({ recordIds: [jack] })]);
  assert.equal(duplicateIds.getUniverseVisual(shepard, me2), null); assert.equal(duplicateIds.getUniverseVisual(jack, me2), null);
  const ambiguity = await fixture([visual(), visual({ id: 'other' }), visual({ id: 'unrelated', recordIds: [jack] })]);
  assert.equal(ambiguity.getUniverseVisual(shepard, me2), null);
  assert.deepEqual(ambiguity.listUniverseVisuals(me2).map(item => item.id), ['unrelated']);
});

test('lookups preserve native actors, powers, stats and campaign appearance isolation', async () => {
  const api = await fixture([visual()]), profile = getUniverseActor(shepard);
  const actor = universeActorFor(shepard, me2, 'soldier', 'me2-equipment-workshop'), before = copy({ profile, actor });
  api.getUniverseVisual(shepard, me2); api.getUniverseVisual(shepard, me2, { usage: 'combat', scenarioId: 'me2-equipment-workshop' });
  assert.deepEqual({ profile: getUniverseActor(shepard), actor: universeActorFor(shepard, me2, 'soldier', 'me2-equipment-workshop') }, before);
  assert.equal(actor.portrait, null); assert.equal(actor.sprite, null);
  assert.doesNotMatch(helperSource, /from ['"]\.\/(?:main|combat|world|state|customization)(?:\.js)?['"]/);
  for (const entry of ['main', 'combat']) {
    const source = await readFile(new URL(`../src/${entry}.js`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /import[^\n]*from ['"]\.\/universe-visuals\.js['"]/);
  }
});
