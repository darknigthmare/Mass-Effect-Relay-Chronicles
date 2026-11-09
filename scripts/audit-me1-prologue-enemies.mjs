// Independent read-only comparison with the accepted pre-lot repository.
// This program writes only its new native report and protected-file proof.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, readlink, readdir, writeFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const baselineCommit = 'd19197ff43facd066abcc6ff4611e0ce0148609b';
const reportPath = 'docs/qa/me1-prologue-enemies-native-report.json';
const protectedPath = 'docs/qa/me1-prologue-enemies-protected-files.json';
if (process.argv.length !== 2) throw new Error('This scoped audit accepts no arguments.');
if (process.env.ME1_PROLOGUE_ENEMIES_FROZEN !== '1')
  throw new Error('Run only after the root agent declares runtime, tracking and documentation frozen: ME1_PROLOGUE_ENEMIES_FROZEN=1 node scripts/audit-me1-prologue-enemies.mjs');

// This reviewed list is deliberately independent of the working-tree diff.
const mutableFiles = [
  'README.md', 'docs/DESIGN.md', 'docs/ASSETS.md', 'docs/FIDELITY.md', 'docs/IMPLEMENTATION_STATUS.md',
  'docs/content-catalog.json', 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx',
  'public/assets/manifest.json', 'src/companion-animation-data.js', 'src/enemy-animation-data.js',
  'src/world.js', 'src/universe-data.js', 'tests/companion-combat-world.test.js',
  'tests/me1-enemy-poses.test.js', 'tests/noveria-occlusion.test.js',
].sort();
const aiFiles = ['.ai-tools/.gitignore', '.ai-tools/README.md', '.ai-tools/setup.py',
  '.ai-tools/sources.json', '.ai-tools/tests/test_setup.py', 'AGENTS.md', 'CLAUDE.md'];
const targetIds = ['SPR-jenkins-combat', 'CHR-jenkins', 'SPR-creeper-du-thorian-ennemi',
  'ENM-creeper-du-thorian', 'SPR-commando-asari-ennemi', 'ENM-commando-asari',
  'SYS-transitions-de-camera'].sort();
const promotedIds = ['SPR-creeper-du-thorian-ennemi', 'SPR-commando-asari-ennemi'].sort();
const coverageKeys = ['atlases', 'combatKeyPoseCount', 'enemyCombatPoseCount',
  'companionCombatPoseCount', 'nativePNGCount', 'visualLimit', 'animationLimit'].sort();
const newFamilies = [{ key: 'jenkins', kind: 'companion' }, { key: 'creeper', kind: 'enemy' }, { key: 'asari', kind: 'enemy' }];
const addedPNG = newFamilies.map(({ key, kind }) => `public/assets/${kind}-${key}-combat.png`).sort();
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 64 * 1024 * 1024 });
const bytes = filename => readFile(path.isAbsolute(filename) ? filename : path.join(root, filename));
const oldBytes = filename => git('show', `${baselineCommit}:${filename}`);
const sha = value => createHash('sha256').update(value).digest('hex');
const blob = value => createHash('sha1').update(`blob ${value.length}\0`).update(value).digest('hex');
const omit = (value, keys) => Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));
const changedKeys = (before, after) => [...new Set([...Object.keys(before), ...Object.keys(after)])]
  .filter(key => !isDeepStrictEqual(before[key], after[key])).sort();
const artifact = async filename => { const raw = await bytes(filename); return { path: filename, sha256: sha(raw), bytes: raw.length }; };
const positive = value => (value.passed === true || value.ok === true) && value.passed !== false && value.ok !== false;
const loadProof = async filename => {
  const raw = await bytes(filename), value = JSON.parse(raw); assert.ok(positive(value), `Nonpositive proof: ${filename}`);
  return { path: filename, sha256: sha(raw), bytes: raw.length, value };
};
const bindSources = async hashes => { for (const [filename, expected] of Object.entries(hashes || {}))
  assert.equal(sha(await bytes(filename)), expected, `Stale proof source: ${filename}`); };

assert.equal(git('rev-parse', 'HEAD').toString().trim(), baselineCommit, 'This audit belongs to the frozen baseline plus this uncommitted lot.');
const report = { version: 1, generatedAt: new Date().toISOString(), passed: false, baselineCommit,
  scope: 'Independent baseline-byte, catalogue, native-art and workbook-proof audit for Jenkins, the existing creeper and generic asari, plus the scoped Feros/Noveria visibility corrections. No game source, old report, catalogue, workbook, index, build, save, commit or remote is modified.',
  reproduction: { script: 'scripts/audit-me1-prologue-enemies.mjs',
    command: 'ME1_PROLOGUE_ENEMIES_FROZEN=1 node scripts/audit-me1-prologue-enemies.mjs',
    scriptSha256: sha(await readFile(fileURLToPath(import.meta.url))) }, sourceHashes: {}, errors: [] };

try {
  const tree = git('ls-tree', '-r', '-z', baselineCommit).toString().split('\0').filter(Boolean).map(row => {
    const match = /^(\d+) (\S+) ([a-f0-9]{40})\t([\s\S]+)$/.exec(row); assert.ok(match, 'Unrecognized baseline tree entry.');
    return { mode: match[1], kind: match[2], baselineBlob: match[3], path: match[4] };
  });
  assert.ok(tree.every(item => item.kind === 'blob'));
  assert.ok(mutableFiles.length === 15 && mutableFiles.every(filename => tree.some(item => item.path === filename)));
  const baselinePaths = new Set(tree.map(item => item.path));
  const changedPaths = git('diff', '--name-only', '-z', baselineCommit).toString().split('\0').filter(Boolean).sort();
  const actualChanged = changedPaths.filter(filename => baselinePaths.has(filename));
  const indexedNewFiles = changedPaths.filter(filename => !baselinePaths.has(filename));
  const declaredNewFiles = new Set(['tests/me1-prologue-enemies.test.js', ...newFamilies.flatMap(({ key, kind }) =>
    [`public/assets/${kind}-${key}-combat.png`, `public/assets/${kind}-${key}-animation.json`])]);
  const scopedNewFile = filename => declaredNewFiles.has(filename)
    || /^docs\/(?:qa|research|screenshots|workbook-previews)\/me1-prologue-enemies/.test(filename)
    || filename.startsWith('scripts/') && path.basename(filename).includes('me1-prologue-enemies');
  assert.ok(indexedNewFiles.every(scopedNewFile), 'An indexed new file is outside the explicitly named lot outputs.');
  assert.deepEqual(actualChanged, mutableFiles, 'Tracked mutations exceed or differ from the independently reviewed fifteen-file scope.');
  const protectedBlobs = [];
  for (const item of tree.filter(item => !mutableFiles.includes(item.path))) {
    const raw = item.mode === '120000' ? Buffer.from(await readlink(path.join(root, item.path))) : await bytes(item.path);
    const currentBlob = blob(raw); assert.equal(currentBlob, item.baselineBlob, `Protected baseline file changed: ${item.path}`);
    protectedBlobs.push({ path: item.path, baselineBlob: item.baselineBlob, currentBlob, sha256: sha(raw), bytes: raw.length });
  }
  const protectedByPath = new Map(protectedBlobs.map(item => [item.path, item]));
  for (const filename of aiFiles) assert.ok(protectedByPath.has(filename), `Latest GitHub AI integration is not protected: ${filename}`);
  const oldWorkbooks = tree.filter(item => item.path.endsWith('.xlsx') && !item.path.startsWith('docs/qa/'));
  const otherWorkbooks = oldWorkbooks.filter(item => item.path !== 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx');
  assert.equal(oldWorkbooks.length, 31); assert.equal(otherWorkbooks.length, 30);
  assert.ok(otherWorkbooks.every(item => protectedByPath.has(item.path)));
  const gameplayPaths = ['src/state.js', 'src/combat.js', 'src/game-data.js', 'src/story.js', 'src/story-data.js',
    'src/loadout.js', 'src/loadout-ui.js', 'src/character-data.js', 'src/operations.js', 'src/operation-data.js',
    'src/universe-equipment.js', 'src/universe-equipment-scenarios.js', 'src/chronicles.js', 'src/chronicle-story.js'];
  assert.ok(gameplayPaths.every(filename => protectedByPath.has(filename)), 'A save, combat, progression, narrative or equipment implementation was changed.');
  const protectedBytes = Buffer.from(JSON.stringify({ baselineCommit, explicitMutableFiles: mutableFiles, files: protectedBlobs }, null, 2) + '\n');
  await writeFile(path.join(root, protectedPath), protectedBytes);
  report.preserved = { baselineFiles: tree.length, explicitMutableFiles: mutableFiles, actualChangedTrackedFiles: actualChanged,
    indexedNewFiles,
    protectedFiles: protectedBlobs.length, protectedUnchanged: protectedBlobs.length,
    protectedFileProof: { path: protectedPath, sha256: sha(protectedBytes), bytes: protectedBytes.length },
    latestAIToolingFiles: aiFiles.map(filename => protectedByPath.get(filename)),
    otherWorkbooks: otherWorkbooks.map(item => protectedByPath.get(item.path)),
    previousQAFileCount: protectedBlobs.filter(item => /^docs\/(?:qa|universe\/qa)\//.test(item.path)).length,
    gameplayModules: gameplayPaths.map(filename => protectedByPath.get(filename)) };

  const cataloguePath = 'docs/content-catalog.json', before = JSON.parse(oldBytes(cataloguePath)), after = JSON.parse(await bytes(cataloguePath));
  assert.equal(before.entries.length, 1382); assert.equal(after.entries.length, 1382);
  assert.deepEqual(after.entries.map(item => item.id), before.entries.map(item => item.id));
  assert.equal(new Set(after.entries.map(item => item.id)).size, 1382);
  assert.deepEqual(omit(after, ['entries', 'meta']), omit(before, ['entries', 'meta']));
  const currentEntries = new Map(after.entries.map(item => [item.id, item]));
  const changedEntries = before.entries.filter(item => !isDeepStrictEqual(item, currentEntries.get(item.id)));
  assert.deepEqual(changedEntries.map(item => item.id).sort(), targetIds);
  const productionFields = ['status', 'assetStatus', 'description', 'acceptance', 'assetPath', 'gameKey', 'notes', 'implementationPaths', 'evidence'];
  const entryChanges = changedEntries.map(item => {
    const fields = changedKeys(item, currentEntries.get(item.id)); assert.ok(fields.every(field => productionFields.includes(field)), `Canonical/identity field changed: ${item.id}`);
    return { id: item.id, fields };
  });
  const transitions = field => before.entries.filter(item => item[field] !== currentEntries.get(item.id)[field])
    .map(item => ({ id: item.id, from: item[field], to: currentEntries.get(item.id)[field] }));
  const statusPromotions = transitions('status'), assetStatusPromotions = transitions('assetStatus');
  for (const [items, from] of [[statusPromotions, 'Défini'], [assetStatusPromotions, 'À produire']]) {
    assert.deepEqual(items.map(item => item.id).sort(), promotedIds); assert.ok(items.every(item => item.from === from && item.to === 'Prototype'));
  }
  for (const id of targetIds.filter(id => !promotedIds.includes(id))) {
    const old = before.entries.find(item => item.id === id), current = currentEntries.get(id);
    assert.equal(current.status, old.status); assert.equal(current.assetStatus, old.assetStatus);
  }
  const cloneIds = before.entries.filter(item => /clone-asari-du-thorian/.test(item.id)).map(item => item.id);
  assert.ok(cloneIds.length >= 2); for (const id of cloneIds) assert.deepEqual(currentEntries.get(id), before.entries.find(item => item.id === id));
  assert.deepEqual(omit(after.meta, ['prototypeCoverage']), omit(before.meta, ['prototypeCoverage']));
  assert.deepEqual(changedKeys(before.meta.prototypeCoverage, after.meta.prototypeCoverage), coverageKeys);
  const workbookUpdate = await loadProof('docs/qa/me1-prologue-enemies-workbook-update.json');
  assert.equal(workbookUpdate.value.baseCommit, baselineCommit);
  assert.equal(workbookUpdate.value.outputHashes.catalogue, sha(await bytes(cataloguePath)));
  const coverage = workbookUpdate.value.prototypeCoverage;
  assert.deepEqual(coverage.before, before.meta.prototypeCoverage); assert.deepEqual(coverage.after, after.meta.prototypeCoverage);
  assert.equal(coverage.changes.length, 7);
  assert.deepEqual(coverage.changes.map(item => item.path.replace(/^meta\.prototypeCoverage\./, '')).sort(), coverageKeys);
  for (const patch of coverage.changes) {
    const key = patch.path.replace(/^meta\.prototypeCoverage\./, '');
    assert.deepEqual(patch.before, before.meta.prototypeCoverage[key] ?? null); assert.deepEqual(patch.after, after.meta.prototypeCoverage[key]);
  }
  assert.deepEqual(after.meta.prototypeCoverage.chronicles, before.meta.prototypeCoverage.chronicles);
  report.catalog = { entries: after.entries.length, changedIds: targetIds, unchangedEntries: 1375, entryChanges,
    statusPromotions, assetStatusPromotions, integratedOrValidatedPromotions: 0,
    unchangedCloneIds: cloneIds, prototypeCoverageChangedKeys: coverageKeys,
    otherMetadataPreserved: true, sourcesCategoriesAndCanonicalFieldsPreserved: true,
    coverageProof: omit(workbookUpdate, ['value']) };

  const oldPNG = tree.filter(item => /^public\/assets\/.*\.png$/.test(item.path)).map(item => item.path).sort();
  const currentPNG = (await readdir(path.join(root, 'public/assets'))).filter(name => name.endsWith('.png')).map(name => `public/assets/${name}`).sort();
  assert.equal(oldPNG.length, 31); assert.equal(currentPNG.length, 34);
  assert.ok(oldPNG.every(filename => protectedByPath.has(filename))); assert.deepEqual(currentPNG.filter(filename => !oldPNG.includes(filename)), addedPNG);
  const headers = [];
  for (const filename of currentPNG) {
    const raw = await bytes(filename);
    assert.equal(raw.subarray(0, 8).toString('hex'), '89504e470d0a1a0a'); assert.equal(raw.readUInt32BE(8), 13);
    assert.equal(raw.subarray(12, 16).toString(), 'IHDR'); assert.equal(raw[24], 8);
    const mode = ({ 0: 'L', 2: 'RGB', 3: 'P', 4: 'LA', 6: 'RGBA' })[raw[25]]; assert.ok(mode);
    headers.push({ path: filename, width: raw.readUInt32BE(16), height: raw.readUInt32BE(20), mode, bitDepth: raw[24], sha256: sha(raw), bytes: raw.length });
  }
  const headerByPath = new Map(headers.map(item => [item.path, item]));
  const manifestPath = 'public/assets/manifest.json', oldManifest = JSON.parse(oldBytes(manifestPath)), manifest = JSON.parse(await bytes(manifestPath));
  assert.equal(oldManifest.assets.length, 26); assert.equal(manifest.assets.length, 29);
  assert.deepEqual(manifest.assets.slice(0, 26), oldManifest.assets);
  assert.deepEqual(omit(manifest, ['date', 'assets', 'combatKeyPoses', 'enemyCombatKeyPoses', 'companionCombatKeyPoses']),
    omit(oldManifest, ['date', 'assets', 'combatKeyPoses', 'enemyCombatKeyPoses', 'companionCombatKeyPoses']));
  const assetByFile = new Map(manifest.assets.map(item => [item.file, item])); assert.equal(assetByFile.size, 29);
  for (const item of manifest.assets) {
    const header = headerByPath.get(`public/assets/${item.file}`); assert.ok(header);
    for (const field of ['width', 'height', 'mode', 'sha256']) assert.equal(item[field], header[field], `Manifest/native mismatch ${item.file}/${field}`);
    for (const region of (item.regions || []).filter(region => region.rect)) {
      const [x, y, width, height] = region.rect;
      assert.ok([x, y, width, height].every(Number.isInteger) && x >= 0 && y >= 0 && width > 0 && height > 0 && x + width <= item.width && y + height <= item.height);
    }
  }
  const countRegions = expression => manifest.assets.filter(item => expression.test(item.file)).reduce((count, item) => count + item.regions.length, 0);
  const nativeCounts = { combatKeyPoses: countRegions(/combat.*\.png$/), companionCombatKeyPoses: countRegions(/^companion-.*-combat\.png$/),
    enemyCombatKeyPoses: countRegions(/^enemy-.*-combat\.png$/), seatedKeyPoses: countRegions(/^joker-seated\.png$/),
    terrainTextureCount: manifest.assets.filter(item => /^eden-ground-.*\.png$/.test(item.file)).length };
  assert.deepEqual(nativeCounts, { combatKeyPoses: 68, companionCombatKeyPoses: 28, enemyCombatKeyPoses: 32, seatedKeyPoses: 2, terrainTextureCount: 2 });
  for (const [key, value] of Object.entries(nativeCounts)) assert.equal(manifest[key], value);
  const companion = await import(pathToFileURL(path.join(root, 'src/companion-animation-data.js')));
  const enemy = await import(pathToFileURL(path.join(root, 'src/enemy-animation-data.js')));
  const oldCompanion = await import(`data:text/javascript;base64,${oldBytes('src/companion-animation-data.js').toString('base64')}`);
  const oldEnemy = await import(`data:text/javascript;base64,${oldBytes('src/enemy-animation-data.js').toString('base64')}`);
  assert.deepEqual(companion.COMPANION_ANIMATION_IDS, [...oldCompanion.COMPANION_ANIMATION_IDS, 'jenkins']);
  assert.deepEqual(enemy.ENEMY_ANIMATION_IDS, [...oldEnemy.ENEMY_ANIMATION_IDS, 'creeper', 'asari']);
  assert.deepEqual(companion.COMPANION_COMBAT_POSES, oldCompanion.COMPANION_COMBAT_POSES);
  assert.deepEqual(enemy.ENEMY_COMBAT_POSES, oldEnemy.ENEMY_COMBAT_POSES);
  const nativePairs = [];
  for (const { key, kind } of newFamilies) {
    const configPath = `public/assets/${kind}-${key}-animation.json`, pngPath = `public/assets/${kind}-${key}-combat.png`;
    const config = JSON.parse(await bytes(configPath)), normalized = kind === 'companion'
      ? companion.normalizeCompanionAnimation(key, config) : enemy.normalizeEnemyAnimation(key, config);
    assert.ok(normalized); assert.equal(normalized.characterId, key); assert.equal(normalized.mediaId, 'ME1'); assert.equal(normalized.periodId, 'me1');
    assert.equal(normalized.status, 'Prototype'); assert.deepEqual(Object.keys(normalized.combat.frames).sort(), ['aim', 'down', 'hit', 'power']);
    const header = headerByPath.get(pngPath), declaration = assetByFile.get(path.basename(pngPath));
    assert.equal(header.mode, 'RGBA'); assert.equal(header.width, normalized.combat.width); assert.equal(header.height, normalized.combat.height);
    assert.deepEqual(declaration.regions, Object.values(normalized.combat.frames));
    const art = await loadProof(`docs/qa/me1-prologue-enemies-${key}-art.json`);
    assert.equal(art.value.sha256, header.sha256); assert.equal(art.value.nativeCopyVerified, true);
    assert.equal(art.value.actuallyOpened, true); assert.equal(art.value.pixelEditingApplied, false);
    assert.equal(art.value.visiblePixelsUnassigned, 0); assert.equal(art.value.visiblePixelsShared, 0);
    assert.equal(art.value.characterId, key); assert.equal(art.value.mediaId, 'ME1'); assert.equal(art.value.periodId, 'me1');
    assert.deepEqual(await bytes(pngPath), await bytes(art.value.nativeSource), `Copied PNG differs from generator output: ${key}`);
    await bindSources(art.value.sourceHashes);
    nativePairs.push({ character: key, kind, configPath, pngPath, configSha256: sha(await bytes(configPath)), pngSha256: header.sha256,
      nativeSource: art.value.nativeSource, nativeCopyRechecked: true, dimensions: [header.width, header.height],
      normalized: true, poses: Object.keys(normalized.combat.frames), artProof: omit(art, ['value']) });
  }
  const jenkinsActor = { id: 'jenkins', key: 'jenkins', enemy: false,
    state: { id: 'jenkins', sprite: 'jenkins', team: 'party', mediaId: 'ME1', periodId: 'me1' } };
  assert.equal(companion.canShowCompanionAnimation(jenkinsActor, jenkinsActor.state, { flags: {}, lost: [], completed: [] }), true);
  const deathClosures = [{ flags: { jenkinsLost: true } }, { lost: ['jenkins'] }, { completed: ['eden-prime'] }];
  for (const context of deathClosures) assert.equal(companion.canShowCompanionAnimation(jenkinsActor, jenkinsActor.state, context), false);
  for (const field of ['mediaId', 'periodId']) assert.equal(companion.canShowCompanionAnimation(jenkinsActor,
    { ...jenkinsActor.state, [field]: field === 'mediaId' ? 'ME3' : 'me3' }), false);
  report.art = { nativePNGCount: currentPNG.length, coreAssets: manifest.assets.length, oldPNGUnchanged: oldPNG.length,
    oldCoreManifestAssetsUnchanged: oldManifest.assets.length, newPNG: addedPNG, ...nativeCounts, headers, nativePairs,
    additionalCompanion: 'jenkins', additionalEnemies: ['creeper', 'asari'], jenkinsNarrativeClosuresChecked: deathClosures.length,
    limitation: 'This native audit checks bytes, declared frames and pure identity/context guards. It does not render new gameplay or certify original-game appearance.' };

  const oldWorld = oldBytes('src/world.js').toString(), world = (await bytes('src/world.js')).toString();
  const oldGuard = 'return canShowCompanionAnimation(actor, state)';
  const newGuard = 'return canShowCompanionAnimation(actor, state, this.storyContext)';
  const oldPillars = `        this._box(1.3, 10, 1.3, steel, x - Math.sign(x) * 6.6, 5, z);
        this._box(.12, 5.5, .2, this._material(0xadcfe1, .5, .1, 0x517e96), x - Math.sign(x) * 7.3, 4.5, z + .6);`;
  const newPillars = `        const pillar = this._box(1.3, 10, 1.3, steel, x - Math.sign(x) * 6.6, 5, z);
        const light = this._box(.12, 5.5, .2, this._material(0xadcfe1, .5, .1, 0x517e96), x - Math.sign(x) * 7.3, 4.5, z + .6);
        // The camera-facing row cuts across wide enemy silhouettes in combat.
        if (x > 0) for (const object of [pillar, light]) {
          object.userData.keep = true; object.userData.combatOccluder = true;
          object.visible = this.mode !== 'combat'; this.combatOccluders.push(object);
        }`;
  const oldFeros = '      for (const x of [-10, 10]) { this._box(1.3, 11, 2.8, trim, x, 5.5, z); this._rectCollider(x, z, 1.3, 2.8); }';
  const newFeros = `      for (const x of [-10, 10]) {
        const pillar = this._box(1.3, 11, 2.8, trim, x, 5.5, z);
        if (x > 0) {
          pillar.userData.keep = true; pillar.userData.combatOccluder = true;
          pillar.visible = this.mode !== 'combat'; this.combatOccluders.push(pillar);
        }
        this._rectCollider(x, z, 1.3, 2.8);
      }`;
  for (const before of [oldGuard, oldPillars, oldFeros]) assert.equal(oldWorld.split(before).length, 2);
  assert.equal(world, oldWorld.replace(oldGuard, newGuard).replace(oldPillars, newPillars).replace(oldFeros, newFeros),
    'World changes exceed the three exact reviewed replacements.');
  assert.equal(sha(Buffer.from(world)), '9a22fbcfc857c20ff41ff97efec6f06789919bf8bb673bd79e20c2acf8cd643d');
  for (const filename of ['src/world-data.js', 'src/level-layout-data.js', 'src/eden-scene.js', 'src/world-navigation.js']) assert.ok(protectedByPath.has(filename));
  const { WORLD_ZONES } = await import(pathToFileURL(path.join(root, 'src/world-data.js')));
  assert.equal(Object.keys(WORLD_ZONES).length, 9); assert.equal(WORLD_ZONES['eden-prime'].pois.length, 7);
  report.geometry = { zones: 9, unchangedZoneData: Object.keys(WORLD_ZONES), unchangedOtherZones: Object.keys(WORLD_ZONES).filter(id => id !== 'eden-prime'),
    edenPOIIds: WORLD_ZONES['eden-prime'].pois.map(poi => poi.id), edenSceneAndNavigationPreserved: true,
    coordinateChanges: 0, worldRendererExactScopedReplacement: true,
    changedMethods: ['_combatAnimationConfig', '_feros', '_noveria'], addedNoveriaOccluderMeshes: 12,
    addedFerosOccluderMeshes: 2, addedVisibilityRegistrations: 14,
    totalNoveriaVisibilityRegistrations: 16, totalFerosVisibilityRegistrations: 4,
    qualification: 'World/layout/scene/navigation data sources are preserved. Only pure Jenkins context forwarding and the camera-facing Feros/Noveria pillar/light visibility registrations differ in the renderer; field geometry and progression remain unchanged.' };

  const runtime = await loadProof('docs/qa/me1-prologue-enemies-runtime-final-report.json');
  assert.equal(runtime.sha256, 'f6540c765778e8d6d4351388af8449da4496c662c67bff948beeb1a034acb6b2');
  assert.equal(runtime.value.baselineCommit, baselineCommit); assert.equal(runtime.value.tests, 29);
  assert.equal(runtime.value.passedTests, 29); assert.equal(runtime.value.failedTests, 0); assert.equal(runtime.value.skippedTests, 0);
  assert.deepEqual(runtime.value.changedSources, []); await bindSources(runtime.value.sourceHashes);
  assert.equal(runtime.value.checks.foregroundNoveriaMeshes, 12); assert.equal(runtime.value.checks.foregroundFerosMeshes, 2);
  report.runtimeProof = { ...omit(runtime, ['value']), tests: 29,
    qualification: 'Source-bound current targeted runtime evidence is verified, not rerun by this audit. Earlier runtime phases retain their historical scope.' };

  const { ITEMS } = await import(pathToFileURL(path.join(root, 'src/loadout.js')));
  const { UNIVERSE_EQUIPMENT } = await import(pathToFileURL(path.join(root, 'src/universe-equipment.js')));
  const supported = UNIVERSE_EQUIPMENT.filter(item => item.runtimeSupported), weapons = supported.filter(item => item.kind === 'weapon');
  assert.equal(Object.keys(ITEMS).length, 52); assert.equal(UNIVERSE_EQUIPMENT.length, 224); assert.equal(supported.length, 107); assert.equal(weapons.length, 79);
  report.inheritedEquipment = { campaignItems: 52, documentaryChronicleItems: 224, supportedChronicleItems: 107,
    supportedChronicleWeapons: 79, implementationBytesPreserved: true, newEquipmentInThisLot: 0 };

  const { buildUniverseRuntime } = await import(pathToFileURL(path.join(root, 'scripts/build-universe-runtime.mjs')));
  const generated = await buildUniverseRuntime(root), currentUniverse = (await bytes('src/universe-data.js')).toString();
  assert.equal(currentUniverse, generated.source, 'Generated documentary runtime is stale or differs from its inputs.');
  const oldUniverse = oldBytes('src/universe-data.js').toString();
  const summaryOf = source => JSON.parse(source.match(/^export const UNIVERSE_SUMMARY = freeze\((\{[^\n]+\})\);$/m)?.[1] || 'null');
  const rowsOf = source => JSON.parse(source.match(/^const ROWS = (\[[^\n]+\]);$/m)?.[1] || 'null');
  const oldSummary = summaryOf(oldUniverse), currentSummary = summaryOf(currentUniverse); assert.ok(oldSummary && currentSummary);
  assert.deepEqual(omit(currentSummary, ['catalogDigests']), omit(oldSummary, ['catalogDigests']));
  assert.equal(currentSummary.recordCount, 6708); assert.equal(currentSummary.sourceCount, 454); assert.equal(currentSummary.catalogCount, 28);
  assert.equal(currentSummary.catalogDigests[cataloguePath], sha(await bytes(cataloguePath)));
  assert.deepEqual(omit(currentSummary.catalogDigests, [cataloguePath]), omit(oldSummary.catalogDigests, [cataloguePath]));
  const oldRows = rowsOf(oldUniverse), currentRows = rowsOf(currentUniverse); assert.ok(oldRows && currentRows);
  assert.deepEqual(currentRows.map(row => row[0]), oldRows.map(row => row[0]));
  const rowChanges = [];
  for (const [index, row] of oldRows.entries()) if (!isDeepStrictEqual(row, currentRows[index])) {
    const fields = row.map((value, slot) => !isDeepStrictEqual(value, currentRows[index][slot]) ? slot : -1).filter(slot => slot >= 0);
    assert.ok(fields.every(slot => [5, 8, 13].includes(slot)), `Generated runtime changed identity, provenance or continuity: ${row[0]}`);
    rowChanges.push({ id: row[0], tupleFields: fields });
  }
  assert.deepEqual(rowChanges.map(item => item.id).sort(), targetIds);
  report.generatedUniverse = { reproducedWithoutWriting: true, recordCount: currentSummary.recordCount,
    sourceCount: currentSummary.sourceCount, workCount: currentSummary.catalogCount, summary: currentSummary,
    changedRows: rowChanges, untouchedRows: oldRows.length - rowChanges.length,
    allowedTupleFieldMeaning: { 5: 'status', 8: 'description', 13: 'notes' },
    qualification: 'The existing generator is invoked as its side-effect-free data function only. No build CLI or output writer is executed.' };

  const workbookNative = await loadProof('docs/qa/me1-prologue-enemies-workbook-public-preservation.json');
  const workbookVisual = await loadProof('docs/qa/me1-prologue-enemies-workbook-visual-report.json');
  assert.equal(workbookNative.value.catalogueEntries, 1382); assert.equal(workbookNative.value.unchangedEntries, 1375);
  assert.equal(workbookNative.value.statusPromotions, 2); assert.equal(workbookNative.value.assetStatusPromotions, 2);
  assert.equal(workbookNative.value.sha256, sha(await bytes('docs/Mass_Effect_Relay_Chronicles_Production.xlsx')));
  assert.equal(workbookUpdate.value.outputHashes.workbook, workbookNative.value.sha256);
  const expectedNative = { sheets: 28, tables: 26, formulas: 274, dataValidations: 130, conditionalRules: 130, catalogueCells: 23494 };
  for (const [key, value] of Object.entries(expectedNative)) assert.equal(workbookNative.value.nativeChecks[key], value);
  assert.equal(workbookVisual.value.actualVisualReview.actuallyOpenedImages, 30);
  assert.equal(Object.keys(workbookVisual.value.deliveries).length, 3); await bindSources(workbookVisual.value.deliveries);
  assert.equal(workbookVisual.value.deliveries[cataloguePath], sha(await bytes(cataloguePath)));
  assert.equal(workbookVisual.value.deliveries['public/assets/manifest.json'], sha(await bytes('public/assets/manifest.json')));
  assert.equal(workbookVisual.value.deliveries['docs/Mass_Effect_Relay_Chronicles_Production.xlsx'], workbookNative.value.sha256);
  report.workbook = { nativePublicProof: omit(workbookNative, ['value']), visualProof: omit(workbookVisual, ['value']),
    updateProof: omit(workbookUpdate, ['value']), deliveries: workbookVisual.value.deliveries,
    nativeChecks: workbookNative.value.nativeChecks, actualVisualReview: workbookVisual.value.actualVisualReview,
    statusPromotions: 2, assetStatusPromotions: 2, unchangedEntries: 1375,
    qualification: 'The final published XLSX/catalogue/manifest are bound to the completed Open XML and thirty-panel visual proofs. This native audit does not execute Excel or claim to have reopened the panels.' };

  const sourcePaths = [...mutableFiles, ...newFamilies.flatMap(({ key, kind }) => [
    `public/assets/${kind}-${key}-animation.json`, `public/assets/${kind}-${key}-combat.png`,
    `docs/qa/me1-prologue-enemies-${key}-art.json`]), 'scripts/audit-me1-prologue-enemies.mjs',
    'scripts/build-universe-runtime.mjs', 'tests/me1-prologue-enemies.test.js', 'vite.config.js'];
  for (const filename of sourcePaths) report.sourceHashes[filename] = sha(await bytes(filename));
  report.passed = true;
  report.limitations = [
    'This audit verifies source bytes, structured data and final workbook evidence. It performs no new browser journey, full test suite, Vite build, Microsoft Excel run or packaged Windows launch.',
    'The three generated families provide twelve fixed drawings. Exact original-game anatomy, costumes, material, motion and geography remain uncertified1:1.',
    'Jenkins pure context guards close after his narrative loss; this native check does not itself play through that event. The gameplay and renderer proofs are separate.',
    'The generic asari sprite does not complete the distinct Thorian clone or its phases. Both existing clone records remain byte-identical.',
    'Visibility registration is source-scoped and field geometry is preserved. Actual combat visibility must be established by the separate current public captures.',
  ];
} catch (error) {
  report.errors.push(error.stack || String(error)); process.exitCode = 1;
}
await writeFile(path.join(root, reportPath), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, baselineFiles: report.preserved?.baselineFiles,
  protectedFiles: report.preserved?.protectedFiles, newPNG: report.art?.newPNG.length,
  changedCatalogueEntries: report.catalog?.changedIds.length, promotedSPR: report.catalog?.statusPromotions.length,
  errors: report.errors }));
