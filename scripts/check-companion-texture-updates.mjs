// Read-only comparison of the archived and current native frame application.
// No renderer, image upload, frame time or FPS is measured by this probe.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import * as THREE from 'three';
import { WebGLMaterials } from '../node_modules/three/src/renderers/webgl/WebGLMaterials.js';
import { WorldView } from '../src/world.js';

const root = new URL('../', import.meta.url);
const archivePath = 'docs/qa/companion-combat-texture-before-world.js';
const expectedArchive = 'f7c8b27810951f374c1f261e739bd20ad0c321bc8b4219d8f7f4fedbf7ad330d';
const file = path => readFile(new URL(path, root));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const archive = await file(archivePath), current = await file('src/world.js');
assert.equal(hash(archive), expectedArchive, 'The before implementation must be the actually inspected snapshot');
const methodText = bytes => {
  const text = bytes.toString('utf8'), start = text.indexOf('  _applyAnimationFrame('), end = text.indexOf('\n  _animateCharacter(', start);
  assert.ok(start >= 0 && end > start); return text.slice(start, end);
};
assert.match(methodText(archive), /texture\.needsUpdate\s*=\s*true/);
assert.doesNotMatch(methodText(current), /texture\.needsUpdate\s*=\s*true/);

// Preserve the archived method exactly. Only module import specifiers are
// resolved to the existing local packages/helpers so the snapshot can execute
// from a data URL instead of its documentary docs/qa location.
let importsResolved = 0;
const bridgedArchive = archive.toString('utf8').replace(/^import (.+) from (['"])([^'"]+)\2;$/gm, (_line, binding, _quote, specifier) => {
  const resolved = specifier.startsWith('.') ? new URL(specifier, new URL('src/world.js', root)).href : import.meta.resolve(specifier);
  importsResolved++; return `import ${binding} from ${JSON.stringify(resolved)};`;
});
assert.equal(importsResolved, 7);
assert.equal(methodText(Buffer.from(bridgedArchive)), methodText(archive));
const { WorldView: BeforeWorld } = await import(`data:text/javascript;base64,${Buffer.from(bridgedArchive).toString('base64')}`);
const animation = JSON.parse(await file('public/assets/shepard-male-animation.json'));
const aim = animation.combat.frames.aim, down = animation.combat.frames.down;

function fixture(Class) {
  const world = Object.create(Class.prototype), atlas = new THREE.Texture({ width: 1536, height: 1024 });
  Object.assign(world, { atlases: { 'combat-shepard': atlas }, spriteCache: new Map(), cameraOffset: new THREE.Vector3(23, 29, 27) });
  const material = new THREE.MeshBasicMaterial({ map: atlas });
  const actor = { id: 'shepard', key: 'shepard', height: 2.85, alive: true,
    body: new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.85), material) };
  return { world, atlas, actor };
}
function observe(actor, atlas, call) {
  const texture = actor.body.material.map;
  return { call, textureVersion: texture.version, sourceVersion: texture.source.version,
    sourceSharedWithAtlas: texture.source === atlas.source, frameId: actor.animationFrame,
    repeat: texture.repeat.toArray(), offset: texture.offset.toArray(),
    bodyPosition: actor.body.position.toArray(), bodyScale: actor.body.scale.toArray() };
}
function staticProbe(Class) {
  const { world, atlas, actor } = fixture(Class), observations = [];
  const initial = { atlasVersion: atlas.version, sourceVersion: atlas.source.version };
  let allocated;
  for (let call = 1; call <= 50; call++) {
    assert.equal(world._applyAnimationFrame(actor, 'combat-shepard', aim), true);
    if (call === 1) allocated = actor.body.material.map;
    assert.equal(actor.body.material.map, allocated, 'The same per-actor clone is reused');
    if ([1, 2, 10, 50].includes(call)) observations.push(observe(actor, atlas, call));
  }
  assert.deepEqual(atlas.repeat.toArray(), [1, 1]); assert.deepEqual(atlas.offset.toArray(), [0, 0]);
  assert.ok(observations.every(item => item.sourceSharedWithAtlas));
  return { calls: 50, fixture: 'One static MeshBasicMaterial body, one 1536x1024 Texture and one shared Source; actual Shepard AIM metadata.',
    initial, observations, uniqueActorTextureClones: world.spriteCache.size,
    finalAtlas: { textureVersion: atlas.version, sourceVersion: atlas.source.version, repeat: atlas.repeat.toArray(), offset: atlas.offset.toArray() } };
}
const before = staticProbe(BeforeWorld), after = staticProbe(WorldView);
assert.deepEqual(before.observations.map(item => item.textureVersion), [2, 3, 11, 51]);
assert.deepEqual(before.observations.map(item => item.sourceVersion), [2, 3, 11, 51]);
assert.deepEqual(after.observations.map(item => item.textureVersion), [1, 1, 1, 1]);
assert.deepEqual(after.observations.map(item => item.sourceVersion), [1, 1, 1, 1]);
for (let i = 0; i < before.observations.length; i++) for (const property of ['frameId', 'repeat', 'offset', 'bodyPosition', 'bodyScale'])
  assert.deepEqual(after.observations[i][property], before.observations[i][property], property);

const { world, actor, atlas } = fixture(WorldView);
const uniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.basic.uniforms);
const nativeMaterials = WebGLMaterials({}, { get: () => ({}) });
const alternatingObservations = [];
for (let call = 1; call <= 50; call++) {
  const frame = call % 2 ? aim : down;
  assert.equal(world._applyAnimationFrame(actor, 'combat-shepard', frame), true);
  const texture = actor.body.material.map, [x, y, width, height] = frame.rect;
  nativeMaterials.refreshMaterialUniforms(uniforms, actor.body.material, 1, 1024, undefined);
  const expected = new THREE.Matrix3().setUvTransform(x / 1536, 1 - (y + height) / 1024, width / 1536, height / 1024, 0, 0, 0);
  assert.deepEqual(uniforms.mapTransform.value.toArray(), expected.toArray());
  assert.equal(texture.matrixAutoUpdate, true); assert.equal(texture.version, 1); assert.equal(texture.source.version, 1);
  const displayHeight = actor.height * frame.heightScale;
  assert.ok(Math.abs(actor.body.position.y + (.5 - frame.pivot[1] / height) * displayHeight - .05) < 1e-12, 'Ground pivot remains correct');
  if ([1, 2, 49, 50].includes(call)) alternatingObservations.push({ ...observe(actor, atlas, call), mapTransformUniform: uniforms.mapTransform.value.toArray() });
}
assert.notDeepEqual(alternatingObservations[0].mapTransformUniform, alternatingObservations[1].mapTransformUniform);

const sourceHashes = {};
for (const path of ['scripts/check-companion-texture-updates.mjs', archivePath, 'src/world.js',
  'src/companion-animation-data.js', 'public/assets/shepard-male-animation.json', 'node_modules/three/package.json',
  'node_modules/three/src/textures/Texture.js', 'node_modules/three/src/textures/Source.js',
  'node_modules/three/src/renderers/webgl/WebGLMaterials.js', 'node_modules/three/src/renderers/webgl/WebGLTextures.js',
  'node_modules/three/src/renderers/WebGLRenderer.js']) sourceHashes[path] = hash(await file(path));
const report = { passed: true, generatedAt: new Date().toISOString(), command: 'node scripts/check-companion-texture-updates.mjs',
  nodeVersion: process.version, threeRevision: THREE.REVISION, sourceHashes,
  scope: 'Measured texture/source invalidation counters and actual native UV uniform refresh; no WebGL upload counters, frame time, FPS or cause of the observed slow production battle is established.',
  archiveExecution: { path: archivePath, sha256: hash(archive), expectedHashMatched: true, importsResolved,
    methodTextUnchanged: true, helperResolution: 'Archived static imports resolve to the same installed Three package and current local src helper modules; the archived _applyAnimationFrame text is unchanged.' },
  initialReadOnlyObservation: { recordedBeforeCoreEdit: true, calls: 50,
    firstTextureVersion: 2, firstSourceVersion: 2, lastTextureVersion: 51, lastSourceVersion: 51,
    note: 'The initial inline probe was actually executed before the patch. The before block below is a new reproducible replay of its exact archived implementation, not an invented reconstruction.' },
  before, after,
  nativeUniformProbe: { calls: 50, alternatingPoses: ['aim', 'down'],
    api: 'Three180 WebGLMaterials.refreshMaterialUniforms, actual MeshBasicMaterial mapTransform uniform',
    matrixAutoUpdate: true, initialTextureVersionAfterClone: 1, finalTextureVersion: 1,
    initialSourceVersionAfterClone: 1, finalSourceVersion: 1, allUniformTransformsMatched: true,
    allGroundPivotsMatched: true, observations: alternatingObservations },
  inspectedThreeBehavior: [
    'Texture.needsUpdate=true increments Texture.version and marks the shared Source for update; Source.needsUpdate=true increments Source.version.',
    'Texture.copy invoked by clone marks the new texture once for its initial upload; that initialization is retained.',
    'WebGLMaterials refreshTransformUniform calls map.updateMatrix when matrixAutoUpdate is true, then copies the UV matrix to the material uniform.',
    'WebGLRenderer resets the current material identity at the end of rendering, so subsequent material refreshes update UV transform uniforms.',
    'WebGLTextures.setTexture2D checks texture versions; uploadTexture checks Source.version and contains the image upload and conditional mipmap path. This source inspection is not a measured GPU upload count.'
  ],
  limitations: ['Synthetic native Texture/Source and mesh objects, no browser or GPU renderer timing.',
    'Only the per-frame image invalidation assignment in _applyAnimationFrame is evaluated; walk, texture loading and other optimization paths are outside this change.',
    'UV, body scale and ground pivot equality establish preserved frame application for these fixtures, not every visual or artistic condition.',
    'The production browser run is a separate validation. No FPS gain or full causal explanation of its slow ATB progress is asserted.'] };
await writeFile(new URL('docs/qa/companion-combat-texture-update-report.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, threeRevision: THREE.REVISION,
  beforeLastTextureAndSourceVersions: [before.observations.at(-1).textureVersion, before.observations.at(-1).sourceVersion],
  afterLastTextureAndSourceVersions: [after.observations.at(-1).textureVersion, after.observations.at(-1).sourceVersion],
  exactNativeUvRefreshes: 50, output: 'docs/qa/companion-combat-texture-update-report.json' }));
