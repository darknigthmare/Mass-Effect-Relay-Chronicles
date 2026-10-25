import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { CHRONICLE_SCENARIOS, getUniverseActor, universeActorFor } from '../src/universe-actors.js';
import { getUniversePortrait, UNIVERSE_PORTRAITS, UNIVERSE_PORTRAIT_ATLAS } from '../src/universe-portraits.js';

const metadata = JSON.parse(readFileSync(new URL('../public/assets/chronicle-portraits.json', import.meta.url), 'utf8'));
const cases = [
  ['ME2-CHR-MIRANDA', { mediaId: 'ME2', periodId: 'me2' }, 'me2-freedoms-progress', 0],
  ['ME2-CHR-THANE', { mediaId: 'ME2', periodId: 'me2' }, 'me2-equipment-workshop', 512],
  ['ME3-CHR-GARRUS', { mediaId: 'ME3', periodId: 'me3' }, 'me3-equipment-workshop', 1024],
];

test('the distributed PNG retains the generated atlas hash, RGBA format and exact dimensions', () => {
  const bytes = readFileSync(new URL('../public/assets/chronicle-portraits-me2-me3.png', import.meta.url));
  assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  assert.equal(bytes.toString('ascii', 12, 16), 'IHDR');
  assert.equal(bytes.readUInt32BE(16), 1536);
  assert.equal(bytes.readUInt32BE(20), 1024);
  assert.equal(bytes[24], 8, 'Eight bits per channel');
  assert.equal(bytes[25], 6, 'Native PNG RGBA');
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha256, UNIVERSE_PORTRAIT_ATLAS.sha256);
  assert.equal(sha256, metadata.sha256);
  assert.equal(sha256, metadata.generation.originalSha256);
  assert.equal(bytes.length, metadata.bytes);
});

test('the three fixed portrait cells match metadata and remain immutable', () => {
  assert.equal(UNIVERSE_PORTRAITS.length, 3);
  assert.equal(metadata.portraits.length, 3);
  assert.equal(metadata.src, UNIVERSE_PORTRAIT_ATLAS.src);
  assert.match(UNIVERSE_PORTRAIT_ATLAS.src, /^\.\/assets\/[^/]+\.png$/);
  assert.equal(metadata.atlasWidth, 1536);
  assert.equal(metadata.atlasHeight, 1024);
  for (const [id, context, scenarioId, x] of cases) {
    const portrait = getUniversePortrait(id, context, scenarioId);
    const entry = metadata.portraits.find(item => item.actorId === id);
    assert.ok(portrait);
    assert.equal(portrait.actorId, id);
    assert.equal(portrait.mediaId, context.mediaId);
    assert.equal(portrait.periodId, context.periodId);
    assert.deepEqual(portrait.sourceRect, [x, 0, 512, 1024]);
    for (const key of ['assetId', 'actorId', 'mediaId', 'periodId', 'mode', 'sprite', 'status', 'partial', 'sourceRect']) {
      assert.deepEqual(portrait[key], entry[key]);
    }
    assert.equal(portrait.mode, 'generated-portrait-prototype');
    assert.equal(portrait.sprite, null);
    assert.equal(portrait.status, 'Prototype');
    assert.equal(portrait.partial, true);
    assert.ok(Object.isFrozen(portrait));
    assert.ok(Object.isFrozen(portrait.sourceRect));
    assert.throws(() => { portrait.sourceRect[0] = 999; }, TypeError);
    assert.throws(() => { portrait.actorId = 'ME1-CHR-SHEPARD'; }, TypeError);
  }
});

test('portrait eligibility follows each existing scenario roster without admitting a foreign work', () => {
  for (const [id, context] of cases) {
    assert.ok(getUniversePortrait(id, context), 'The optional scenario permits the exact registered work identity');
    const allowed = [];
    for (const scene of CHRONICLE_SCENARIOS) {
      const expected = scene.context.mediaId === context.mediaId && scene.context.periodId === context.periodId
        && scene.actorIds.includes(id);
      assert.equal(!!getUniversePortrait(id, scene.context, scene.id), expected, `${id}/${scene.id}`);
      if (expected) allowed.push(scene.id);
    }
    assert.deepEqual(allowed, id === 'ME2-CHR-MIRANDA'
      ? ['me2-freedoms-progress', 'me2-equipment-workshop']
      : [id === 'ME2-CHR-THANE' ? 'me2-equipment-workshop' : 'me3-equipment-workshop']);
    assert.equal(getUniversePortrait(id, context, 'unknown-scenario'), null);
    assert.equal(getUniversePortrait(id, context, null), null);
    assert.equal(getUniversePortrait(id, context, {}), null);
  }
});

test('ME1, other identities, generic Shepard, prologues and forged contexts retain no overlay', () => {
  const contexts = [
    { mediaId: 'ME1', periodId: 'me1' },
    { mediaId: 'ME2', periodId: 'me2-opening' },
    { mediaId: 'ME3', periodId: 'me3-prologue' },
    { mediaId: 'ME3', periodId: 'me3-multiplayer' },
    { mediaId: 'GAL', periodId: 'gal' },
    { mediaId: 'RED', periodId: 'red' },
    { mediaId: 'ME4', periodId: 'me4' },
  ];
  for (const [id, context] of cases) {
    for (const other of contexts) assert.equal(getUniversePortrait(id, other), null, `${id}/${other.mediaId}/${other.periodId}`);
    for (const forged of [
      { ...context, galaxy: 'andromeda' },
      { ...context, year: 2185 },
      { ...context, periodId: 'unknown' },
      { ...context, sceneId: 'me2-equipment-workshop' },
    ]) assert.equal(getUniversePortrait(id, forged), null);
    assert.ok(getUniversePortrait(id, { ...context, galaxy: 'milky-way' }));
  }
  for (const id of ['ME2-CHR-SHEPARD', 'ME3-CHR-SHEPARD', 'ME2-CHR-GARRUS', 'GAL-CHR-MIRANDA',
    'ME3-CHR-THANE', 'shepard', 'constructor', '__proto__', 'toString', '', 'me2-chr-miranda']) {
    assert.equal(getUniversePortrait(id, { mediaId: 'ME2', periodId: 'me2' }), null);
    assert.equal(getUniversePortrait(id, { mediaId: 'ME3', periodId: 'me3' }), null);
  }
});

test('invalid input, getters, inherited fields, cycles and proxies fail closed without executing getters', () => {
  let invoked = 0;
  const accessor = { periodId: 'me2' };
  Object.defineProperty(accessor, 'mediaId', { enumerable: true, get() { invoked++; throw new Error('Do not execute'); } });
  const cyclic = { mediaId: 'ME2', periodId: 'me2' }; cyclic.self = cyclic;
  const inherited = Object.create({ mediaId: 'ME2', periodId: 'me2' });
  const hidden = { mediaId: 'ME2', periodId: 'me2' };
  Object.defineProperty(hidden, 'year', { value: 2185 });
  const symbolic = { mediaId: 'ME2', periodId: 'me2', [Symbol('epoch')]: 2185 };
  const { proxy, revoke } = Proxy.revocable({}, {}); revoke();
  for (const value of [undefined, null, false, [], 'ME2', accessor, cyclic, inherited, hidden, symbolic, proxy]) {
    assert.equal(getUniversePortrait('ME2-CHR-MIRANDA', value), null);
  }
  for (const id of [undefined, null, 1, {}, new String('ME2-CHR-MIRANDA'), proxy]) {
    assert.equal(getUniversePortrait(id, { mediaId: 'ME2', periodId: 'me2' }), null);
  }
  assert.equal(invoked, 0);
});

test('the overlay leaves native profile and combat definitions untouched', () => {
  for (const [id, context, scenarioId] of cases) {
    const profile = getUniverseActor(id);
    const native = universeActorFor(id, context, 'default', scenarioId);
    const before = JSON.stringify({ profile, native });
    assert.ok(getUniversePortrait(id, context, scenarioId));
    assert.equal(JSON.stringify({ profile: getUniverseActor(id), native: universeActorFor(id, context, 'default', scenarioId) }), before);
    assert.equal(profile.sprite, null);
    assert.equal(profile.portrait, null);
    assert.equal(native.sprite, null);
    assert.equal(native.portrait, null);
    assert.equal(native.visualMode, 'prototype-symbol');
  }
});

test('provenance identifies the manual pages and keeps portraits separate from animations', () => {
  assert.equal(metadata.generation.tool, 'image_gen.imagegen');
  assert.equal(metadata.generation.transparentBackground, true);
  assert.equal(metadata.generation.promptArchivedVerbatim, false);
  assert.equal(metadata.generation.referencedImagePaths.length, 3);
  assert.match(metadata.generation.referencedImagePaths[2].usage, /Style only/);
  for (const input of metadata.generation.referencedImagePaths) assert.match(input.sha256, /^[a-f0-9]{64}$/);
  assert.match(metadata.generation.copyOperation, /original preserved/);
  assert.equal(metadata.references['me2-cover'].pdfPage, 1);
  assert.equal(metadata.references['me3-garrus'].pdfPage, 5);
  assert.deepEqual(metadata.references['me3-garrus'].embeddedScreenshotDimensions, [512, 256]);
  for (const reference of Object.values(metadata.references)) {
    assert.match(reference.url, /^https:\/\/eaassets-a\.akamaihd\.net\/eahelp\/manuals\//);
    assert.match(reference.pdfSha256, /^[a-f0-9]{64}$/);
    assert.match(reference.renderedSha256, /^[a-f0-9]{64}$/);
  }
  for (const entry of metadata.portraits) assert.ok(metadata.references[entry.referenceId]);
  assert.equal(metadata.pixelInspection.alphaMinimum, 0);
  assert.equal(metadata.pixelInspection.alphaMaximum, 254);
  assert.deepEqual(metadata.pixelInspection.cornerAlpha, [0, 0, 0, 0]);
  assert.equal(metadata.pixelInspection.fullyOpaquePixels, 0);
  assert.equal(metadata.pixelInspection.fullyTransparentPixels + metadata.pixelInspection.partialAlphaPixels, 1536 * 1024);
  assert.ok(!('frames' in metadata));
  assert.ok(!('directions' in metadata));
  assert.ok(metadata.limitations.some(text => text.includes('Aucune animation')));
});
