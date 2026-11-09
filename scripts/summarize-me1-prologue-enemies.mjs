import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { normalizeCompanionAnimation } from '../src/companion-animation-data.js';
import { normalizeEnemyAnimation } from '../src/enemy-animation-data.js';
import { decodeSave, canStartEncounter } from '../src/state.js';

// Collection only: no test, browser, build, workbook export or old report writer
// is invoked. All final gates must already be positive and source-bound.
const root = new URL('../', import.meta.url);
const baseline = 'd19197ff43facd066abcc6ff4611e0ce0148609b';
const finalWorldSHA256 = '9a22fbcfc857c20ff41ff97efec6f06789919bf8bb673bd79e20c2acf8cd643d';
const output = 'docs/qa/me1-prologue-enemies-report.json';
const expectedIds = ['SPR-jenkins-combat', 'CHR-jenkins', 'SPR-creeper-du-thorian-ennemi',
  'ENM-creeper-du-thorian', 'SPR-commando-asari-ennemi', 'ENM-commando-asari', 'SYS-transitions-de-camera'].sort();
const promotedIds = ['SPR-creeper-du-thorian-ennemi', 'SPR-commando-asari-ennemi'].sort();
const mutableFiles = ['README.md', 'docs/DESIGN.md', 'docs/ASSETS.md', 'docs/FIDELITY.md', 'docs/IMPLEMENTATION_STATUS.md',
  'docs/content-catalog.json', 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx', 'public/assets/manifest.json',
  'src/companion-animation-data.js', 'src/enemy-animation-data.js', 'src/world.js', 'src/universe-data.js',
  'tests/companion-combat-world.test.js', 'tests/me1-enemy-poses.test.js', 'tests/noveria-occlusion.test.js'].sort();
const familyKinds = { jenkins: 'companion', creeper: 'enemy', asari: 'enemy' };
const bytes = path => readFile(new URL(path, root));
const hash = data => createHash('sha256').update(data).digest('hex');
const checked = new Map(), proofs = {};
async function digest(path) {
  if (!checked.has(path)) checked.set(path, hash(await bytes(path)));
  return checked.get(path);
}
async function artifact(item, overrides = new Map()) {
  assert.ok(item?.path && /^[a-f0-9]{64}$/.test(item.sha256), 'Evidence needs a path and SHA256.');
  const path = overrides.get(item.path) || item.path;
  assert.equal(await digest(path), item.sha256, `Changed evidence: ${path}`);
  if (Number.isInteger(item.bytes)) assert.equal((await bytes(path)).length, item.bytes, `Changed size: ${path}`);
}
async function artifacts(items = [], overrides) { for (const item of items) await artifact(item, overrides); }
async function sources(items = {}, overrides) {
  for (const [path, sha256] of Object.entries(items)) await artifact({ path, sha256 }, overrides);
}
async function tree(relative) {
  const files = [];
  for (const entry of await readdir(new URL(relative, root), { withFileTypes: true })) {
    const path = relative + entry.name;
    if (entry.isDirectory()) files.push(...await tree(path + '/'));
    else if (entry.isFile()) files.push(path);
  }
  return files.sort();
}
async function proof(name, path, accept = value => value.passed === true) {
  const raw = await bytes(path), value = JSON.parse(raw);
  assert.ok(accept(value), `Evidence is not final and accepted: ${path}`);
  proofs[name] = { path, bytes: raw.length, sha256: hash(raw) }; return value;
}
async function archive(path) {
  const raw = await bytes(path), manifest = JSON.parse(raw), overrides = new Map();
  for (const item of manifest.files) {
    const original = item.originalPath ?? item.original ?? item.source;
    const snapshot = item.snapshot ?? item.archive ?? item.path;
    assert.ok(original && snapshot);
    await artifact({ path: snapshot, sha256: item.sha256, bytes: item.bytes });
    overrides.set(original, snapshot);
  }
  return { path, sha256: hash(raw), bytes: raw.length, reason: manifest.reason || manifest.scope, files: manifest.files, overrides };
}
const clean = (value, fields) => { for (const field of fields) assert.deepEqual(value[field], [], `Nonempty ${field}`); };
const paths = items => items.map(item => item.path).sort();
const samePaths = (left, right) => assert.deepEqual(paths(left), paths(right));
const sorted = values => [...values].sort();
function consoleReserve(report) {
  for (const observation of report.consoleObservations || []) {
    assert.equal(new URL(observation.location.url).pathname, '/favicon.ico');
    assert.match(observation.text, /Failed to load resource.*404/);
  }
  for (const warning of report.resourceWarnings || []) {
    assert.equal(new URL(warning.url).pathname, '/favicon.ico'); assert.equal(warning.status, 404);
  }
}
function spriteChecks(report) {
  assert.equal(report.cases.length, 12); assert.equal(report.captureArtifacts.length, 4);
  assert.equal(report.nativeEvents.length, 4); assert.equal(report.scopeClosures.length, 18);
  assert.equal(report.narrativeClosures.length, 3); assert.equal(report.regressions.length, 12);
  assert.ok(report.cases.every(row => row.passed && row.battleUnchanged && row.saveUnchanged && row.groundAnchorError < 1e-7));
  for (const row of report.cases) {
    assert.equal(row.frameId, `${row.key}-combat-${row.pose}`); assert.equal(row.sourceMapDistinct, true);
    assert.equal(new URL(row.texture).pathname, `/assets/${familyKinds[row.key]}-${row.key}-combat.png`);
    assert.ok(Number.isFinite(row.groundAnchorError) && row.groundAnchorError >= 0);
  }
  assert.deepEqual(sorted(report.cases.map(row => `${row.key}:${row.pose}`)),
    Object.keys(familyKinds).flatMap(key => ['aim', 'power', 'hit', 'down'].map(pose => `${key}:${pose}`)).sort());
  assert.ok(report.nativeEvents.every(row => row.actionOK && row.liveDamageOK && row.koOK && row.powersUnchanged && row.rendererPreservesBattle));
  assert.deepEqual(sorted(report.nativeEvents.map(row => `${row.key}:${row.actionId}`)),
    ['jenkins:cover', 'creeper:strike', 'asari:throw', 'asari:barrier'].sort());
  for (const row of report.nativeEvents) {
    assert.equal(row.actionFrame, `${row.key}-combat-power`); assert.equal(row.hitFrame, `${row.key}-combat-hit`);
    assert.equal(row.koFrame, `${row.key}-combat-down`); assert.equal(row.hpAfterKO, 0);
    if (row.actionId === 'cover') { assert.equal(row.actionWitness.cover, true); assert.equal(row.actionWitness.barrier, 0); }
    if (row.actionId === 'throw') assert.ok(row.actionWitness.targetStagger > 0);
    if (row.actionId === 'barrier') assert.ok(row.actionWitness.barrier > 0);
  }
  assert.ok(report.scopeClosures.every(row => row.frame === null && row.usesNewAtlas === false));
  assert.ok(report.narrativeClosures.every(row => row.frame === null && row.usesNewAtlas === false && row.stateUnchanged));
  assert.ok(report.regressions.every(row => row.saveUnchanged));
  assert.deepEqual(sorted(report.regressions.map(row => row.key)),
    ['geth', 'husk', 'geth-sniper', 'geth-destroyer', 'krogan', 'rachni', 'ashley', 'kaidan', 'garrus', 'tali', 'wrex', 'liara'].sort());
  assert.equal(report.fixturePreserved.stateUnchanged, true);
  assert.deepEqual(report.fixturePreserved.storageBefore, report.fixturePreserved.storageAfter);
  assert.deepEqual(report.fixturePreserved.assetErrors, []); clean(report, ['errors', 'failedRequests']);
}
async function publicFiles(report, mode, overrides = new Map()) {
  assert.equal(report.baselineCommit, baseline); await sources(report.sources, overrides);
  clean(report, ['errors', 'failedRequests', 'evidenceErrors']); consoleReserve(report);
  assert.equal(report.profile.fresh, true); assert.equal(report.profile.launches, 1); assert.equal(report.profile.completeShutdowns, 1);
  assert.deepEqual(report.noHarness, { own: false, type: 'undefined', viteClient: mode === 'development' });
  assert.equal(report.fixtures.length, 3); assert.ok(report.fixtures.every(row => row.importedViaPublicChooser));
  await artifacts(report.fixtures); await artifacts(report.exports); await artifacts(report.screenshots);
  for (const item of report.fixtures) assert.ok(decodeSave((await bytes(item.path)).toString()), `Invalid fixture: ${item.path}`);
  assert.equal(report.servedFiles.length, 6);
  for (const item of report.servedFiles) {
    assert.equal(item.status, 200); assert.equal(item.matchesNativeSource, true);
    assert.equal(item.sha256, await digest(`public/${item.path}`));
    if (mode === 'production') { assert.equal(item.matchesDist, true); assert.equal(item.sha256, await digest(`dist/${item.path}`)); }
  }
  const pngs = Object.entries(familyKinds).map(([key, kind]) => `assets/${kind}-${key}-combat.png`).sort();
  const requested = report.browserResponses.filter(item => pngs.includes(item.path) && item.status === 200);
  assert.deepEqual(sorted(new Set(requested.map(item => item.path))), pngs);
  for (const item of report.browserResponses.filter(item => item.status === 200)) {
    if (mode === 'production') {
      assert.equal(item.matchesDist, true); assert.equal(item.sha256, report.buildFiles[item.path]?.sha256);
    } else assert.equal(item.sha256, report.sources[`public/${item.path}`]);
  }
  assert.ok(report.nativeOrders.some(row => row.actorId === 'jenkins' && row.actionId === 'cover'));
  assert.ok(report.nativeOrders.some(row => row.actionId === 'shoot'));
  assert.ok(report.nativeOrders.every(row => row.atbBefore >= 99.999 && row.atbAfter < 20));
  assert.equal(report.ferosEncounter.nativeShotPlayed, true); assert.equal(report.ferosEncounter.exactPrecombatRestore, true);
  assert.equal(report.ferosEncounter.noVictoryRewardClaimed, true); assert.equal(report.ferosEncounter.genericAsariOnly, true);
  assert.deepEqual(report.ferosEncounter.enemyIDs, ['creeper-0', 'creeper-1', 'asari-2']);
}
async function downloaded(report) {
  const states = new Map();
  for (const item of report.exports) {
    const decoded = decodeSave((await bytes(item.path)).toString()); assert.ok(decoded); delete decoded.playedSeconds;
    assert.equal(hash(JSON.stringify(decoded)), item.stableStateSHA256); states.set(item.label, decoded);
  }
  return states;
}
function opened(review, required) {
  assert.equal(review.reviewComplete, true); assert.deepEqual(review.blockingFindings, []);
  assert.ok(review.imagesReviewed.every(image => image.actuallyOpened === true));
  assert.equal(new Set(review.imagesReviewed.map(image => image.path)).size, review.imagesReviewed.length);
  for (const image of required) {
    const match = review.imagesReviewed.find(row => row.path === image.path);
    assert.ok(match?.actuallyOpened, `Not actually reviewed: ${image.path}`); assert.equal(match.sha256, image.sha256);
  }
}

// A final positive summary is immutable. The initial pending placeholder may be
// replaced only after every assertion below has passed.
try { assert.notEqual(JSON.parse((await bytes(output)).toString()).passed, true, 'Accepted aggregate already exists.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const native = await proof('native', 'docs/qa/me1-prologue-enemies-native-report.json');
const unit = await proof('unit', 'docs/qa/me1-prologue-enemies-unit-report.json');
const build = await proof('build', 'docs/qa/me1-prologue-enemies-build-report.json');
const runtime = await proof('runtime-final', 'docs/qa/me1-prologue-enemies-runtime-final-report.json');
const sprites = await proof('sprites-final', 'docs/qa/me1-prologue-enemies-sprites-final-report.json');
const development = await proof('development-final', 'docs/qa/me1-prologue-enemies-public-development-final-report.json');
const developmentVisual = await proof('development-visual', 'docs/qa/me1-prologue-enemies-development-visual-review.json');
const production = await proof('production', 'docs/qa/me1-prologue-enemies-production-report.json');
const productionBuildGate = await proof('production-build-gate', 'docs/qa/me1-prologue-enemies-production-build-gate.json');
const visual = await proof('visual-final', 'docs/qa/me1-prologue-enemies-visual-review.json');
assert.equal(await digest('src/world.js'), finalWorldSHA256);

// Independently protected baseline files include all previous QA, the latest
// seven AI-tool integration files and every other current workbook.
assert.equal(native.baselineCommit, baseline); clean(native, ['errors']); await sources(native.sourceHashes);
assert.deepEqual(native.preserved.explicitMutableFiles, mutableFiles);
assert.deepEqual(native.preserved.actualChangedTrackedFiles, mutableFiles);
assert.equal(native.preserved.baselineFiles - 15, native.preserved.protectedFiles);
assert.equal(native.preserved.protectedUnchanged, native.preserved.protectedFiles);
await artifact(native.preserved.protectedFileProof);
const protectedProof = JSON.parse(await bytes(native.preserved.protectedFileProof.path));
assert.equal(protectedProof.baselineCommit, baseline); assert.equal(protectedProof.files.length, native.preserved.protectedFiles);
await artifacts(protectedProof.files); assert.ok(protectedProof.files.every(row => row.baselineBlob === row.currentBlob));
const baselineTree = execFileSync('git', ['ls-tree', '-r', '-z', baseline], { cwd: root, maxBuffer: 16 * 1024 * 1024 }).toString()
  .split('\0').filter(Boolean).map(line => { const row = line.match(/^\d+ blob ([a-f0-9]{40})\t(.+)$/); assert.ok(row); return { path: row[2], blob: row[1] }; });
assert.equal(baselineTree.length, native.preserved.baselineFiles);
samePaths(protectedProof.files, baselineTree.filter(row => !mutableFiles.includes(row.path)));
for (const row of protectedProof.files) assert.equal(row.baselineBlob, baselineTree.find(item => item.path === row.path).blob);
assert.equal(native.preserved.latestAIToolingFiles.length, 7); await artifacts(native.preserved.latestAIToolingFiles);
assert.equal(native.preserved.otherWorkbooks.length, 30); await artifacts(native.preserved.otherWorkbooks);
assert.equal(native.preserved.gameplayModules.length, 14); await artifacts(native.preserved.gameplayModules);
await artifact(native.runtimeProof); assert.equal(native.runtimeProof.tests, 29);
assert.equal(native.runtimeProof.sha256, proofs['runtime-final'].sha256);
assert.equal(native.reproduction.scriptSha256, await digest(native.reproduction.script));
assert.equal(native.catalog.entries, 1382); assert.equal(native.catalog.unchangedEntries, 1375);
assert.deepEqual(sorted(native.catalog.changedIds), expectedIds);
assert.deepEqual(sorted(native.catalog.statusPromotions.map(row => row.id)), promotedIds);
assert.deepEqual(sorted(native.catalog.assetStatusPromotions.map(row => row.id)), promotedIds);
assert.ok(native.catalog.statusPromotions.every(row => row.from === 'Défini' && row.to === 'Prototype'));
assert.ok(native.catalog.assetStatusPromotions.every(row => row.from === 'À produire' && row.to === 'Prototype'));
assert.equal(native.catalog.integratedOrValidatedPromotions, 0); assert.equal(native.catalog.prototypeCoverageChangedKeys.length, 7);
assert.ok(native.catalog.unchangedCloneIds.includes('SPR-clone-asari-du-thorian-ennemi'));
assert.ok(native.catalog.unchangedCloneIds.includes('ENM-clone-asari-du-thorian'));
assert.equal(native.art.nativePNGCount, 34); assert.equal(native.art.coreAssets, 29);
assert.equal(native.art.oldPNGUnchanged, 31); assert.equal(native.art.oldCoreManifestAssetsUnchanged, 26);
assert.equal(native.art.newPNG.length, 3); assert.equal(native.art.nativePairs.length, 3);
for (const pair of native.art.nativePairs) {
  assert.equal(pair.normalized, true); assert.equal(pair.nativeCopyRechecked, true);
  assert.equal(pair.pngSha256, await digest(pair.pngPath)); assert.equal(pair.configSha256, await digest(pair.configPath));
  await artifact(pair.artProof);
}
assert.equal(native.art.combatKeyPoses, 68); assert.equal(native.art.companionCombatKeyPoses, 28);
assert.equal(native.art.enemyCombatKeyPoses, 32); assert.equal(native.art.seatedKeyPoses, 2); assert.equal(native.art.terrainTextureCount, 2);
assert.equal(native.geometry.worldRendererExactScopedReplacement, true); assert.equal(native.geometry.coordinateChanges, 0);
assert.equal(native.geometry.addedNoveriaOccluderMeshes, 12); assert.equal(native.geometry.addedFerosOccluderMeshes, 2);
assert.equal(native.geometry.addedVisibilityRegistrations, 14);
assert.deepEqual(sorted(native.geometry.changedMethods), ['_combatAnimationConfig', '_feros', '_noveria'].sort());
assert.equal(native.geometry.edenSceneAndNavigationPreserved, true);
assert.deepEqual(native.inheritedEquipment, { campaignItems: 52, documentaryChronicleItems: 224,
  supportedChronicleItems: 107, supportedChronicleWeapons: 79, implementationBytesPreserved: true, newEquipmentInThisLot: 0 });

const artReports = [], artCaptures = [];
for (const [key, kind] of Object.entries(familyKinds)) {
  const art = await proof(`art-${key}`, `docs/qa/me1-prologue-enemies-${key}-art.json`);
  const png = `public/assets/${kind}-${key}-combat.png`, metadata = `public/assets/${kind}-${key}-animation.json`;
  assert.equal(art.characterId, key); assert.equal(art.mediaId, 'ME1'); assert.equal(art.periodId, 'me1');
  assert.equal(art.status, 'Prototype'); assert.equal(art.actuallyOpened, true); assert.equal(art.nativeCopyVerified, true);
  assert.equal(art.pixelEditingApplied, false); assert.equal(art.globalFidelityCertified, false);
  assert.equal(art.visiblePixelsUnassigned, 0); assert.equal(art.visiblePixelsShared, 0); assert.equal(art.frames.length, 4);
  const raw = await bytes(png); assert.equal(hash(raw), art.sha256); assert.deepEqual(raw, await bytes(art.nativeSource));
  assert.equal(raw.subarray(0, 8).toString('hex'), '89504e470d0a1a0a'); assert.equal(raw[24], 8); assert.equal(raw[25], 6);
  assert.equal(raw.readUInt32BE(16), 1536); assert.equal(raw.readUInt32BE(20), 1024); await sources(art.sourceHashes);
  const config = JSON.parse(await bytes(metadata));
  const normalized = (kind === 'companion' ? normalizeCompanionAnimation : normalizeEnemyAnimation)(key, config);
  assert.ok(normalized); assert.equal(normalized.mediaId, 'ME1'); assert.equal(normalized.periodId, 'me1');
  assert.equal(normalized.status, 'Prototype');
  if (key === 'jenkins') assert.equal(config.primaryVisualVerified, false);
  else assert.equal(config.provenance.primaryOriginalBodyReferenceObtained, false);
  for (const row of art.frames) {
    const frame = normalized.combat.frames[row.pose]; assert.ok(frame);
    assert.deepEqual(frame.rect, row.rect); assert.deepEqual(frame.pivot, row.pivot); assert.equal(frame.heightScale, row.heightScale);
    assert.ok((row.paddingAtAlpha51 || row.visibleMargin || row.visibleMarginsLTRB).every(value => value >= 8));
  }
  const captures = key === 'jenkins' ? art.visualReview.captures
    : key === 'creeper' ? [art.nativeVisualReview.capture] : art.manualVisualReview.images;
  assert.ok(captures.every(item => item.actuallyOpened)); await artifacts(captures); await artifacts(art.proofs);
  artCaptures.push(...captures);
  artReports.push({ characterId: key, kind, png, metadata, sha256: art.sha256, nativeCopyVerified: true,
    fixedDrawings: 4, sourceReview: proofs[`art-${key}`], limitations: art.limits || art.limitations });
}

// Baseline Novéria is a fresh public observation of the old, verified reused
// build. Its eighteen executed sources are checked through their own archive.
const before = await proof('before', 'docs/qa/me1-prologue-enemies-before-report.json');
const beforeVisual = await proof('before-visual', 'docs/qa/me1-prologue-enemies-before-visual-review.json');
assert.equal(before.baselineCommit, baseline); assert.equal(before.sourceArchive.length, 18); assert.equal(before.screenshots.length, 2);
assert.deepEqual(before.noHarness, { own: false, type: 'undefined', viteClient: false });
assert.equal(before.profile.launches, 1); assert.equal(before.profile.completeShutdowns, 1);
assert.equal(before.nativeOrders.length, 0); assert.equal(before.exports.length, 0);
assert.equal(before.encounter.nativeEncounterStarted, true); assert.equal(before.encounter.shotPerformed, false);
const beforeOverrides = new Map(before.sourceArchive.map(row => [row.originalPath, row.path]));
await artifacts(before.sourceArchive); await sources(before.sources, beforeOverrides);
await artifacts(before.screenshots); await artifacts(beforeVisual.images); await artifact(beforeVisual.inputReport);
samePaths(beforeVisual.images, before.screenshots); assert.ok(beforeVisual.images.every(row => row.actuallyOpened));
assert.equal(beforeVisual.reviewComplete, true); assert.equal(beforeVisual.commandRecordCorrection.rawReportPreserved, true);
assert.match(beforeVisual.commandRecordCorrection.actualCommand, /ME1_BASE_MAIN=d19197ff43facd066abcc6ff4611e0ce0148609b/);
assert.equal(before.reusedBuild.freshBuildPerformed, false);
await artifact({ path: before.reusedBuild.report, sha256: before.reusedBuild.sha256 });
for (const row of before.sourceArchive) {
  assert.equal(row.sha256, before.sources[row.originalPath]);
  if (!row.originalPath.startsWith('scripts/')) {
    const original = execFileSync('git', ['show', `${baseline}:${row.originalPath}`], { cwd: root, maxBuffer: 8 * 1024 * 1024 });
    assert.equal(hash(original), row.sha256);
  }
}
clean(before, ['errors', 'failedRequests', 'sourceRequests', 'evidenceErrors']); consoleReserve(before);

// The first candidate remains fully historical after the bounded Féros fix.
// Its old world/test/collector hashes are never compared to later files.
const initialSourceArchive = await archive('docs/qa/me1-prologue-enemies-before-feros-fix-source/snapshot-manifest.json');
const initialRuntimeArchive = await archive('docs/qa/me1-prologue-enemies-before-feros-fix-runtime-sources/snapshot-manifest.json');
const initialManifestArchive = await archive('docs/qa/me1-prologue-enemies-manifest-pre-feros-snapshot.json');
const initialOverrides = new Map([...initialSourceArchive.overrides, ...initialRuntimeArchive.overrides]);
for (const item of [...initialSourceArchive.files, ...initialRuntimeArchive.files]) {
  if (item.originalPath?.startsWith('docs/qa/')) assert.equal(await digest(item.originalPath), item.sha256, `Historical raw proof changed: ${item.originalPath}`);
}
const initialRuntime = await proof('runtime-initial', initialOverrides.get('docs/qa/me1-prologue-enemies-runtime-report.json'));
assert.equal(initialRuntime.tests, 28); await sources(initialRuntime.sourceHashes, initialOverrides); await artifact(initialRuntime.output, initialOverrides);
const oldSprites = await proof('sprites-initial-composite', 'docs/qa/me1-prologue-enemies-sprites-summary.json');
const firstSprites = await proof('sprites-initial-raw', 'docs/qa/me1-prologue-enemies-sprites-report.json', row => row.passed === false);
const eventRetry = await proof('sprites-initial-events', 'docs/qa/me1-prologue-enemies-sprites-events-report.json');
const spriteAttempt = await archive('docs/qa/me1-prologue-enemies-sprites-attempt1/snapshot-manifest.json');
const firstOverrides = new Map([...initialOverrides, ...spriteAttempt.overrides]);
assert.equal(oldSprites.proofKind, 'explicit-composite-detached-renderer-proof'); assert.equal(oldSprites.composite, true);
assert.equal(oldSprites.executionCount, 2); assert.equal(oldSprites.strictFullRunPassed, false);
assert.equal(oldSprites.newBrowserRunPerformedForSummary, false); spriteChecks(oldSprites);
assert.equal(firstSprites.cases.length, 12); assert.equal(eventRetry.case, 'events'); assert.equal(eventRetry.cases.length, 0);
assert.deepEqual(oldSprites.cases, firstSprites.cases); assert.deepEqual(oldSprites.nativeEvents, eventRetry.nativeEvents);
assert.deepEqual(oldSprites.captureArtifacts, firstSprites.captureArtifacts.filter(row => !row.path.endsWith('-failure.png')));
await sources(firstSprites.sourceHashes, firstOverrides); await sources(eventRetry.sourceHashes, initialOverrides);
await sources(oldSprites.sourceHashes, initialOverrides); await artifacts(oldSprites.rawReports, initialOverrides);
for (const item of oldSprites.rawReports) assert.equal(await digest(item.path), item.sha256, `Original sprite raw proof changed: ${item.path}`);
for (const item of spriteAttempt.files) if (item.original?.startsWith('docs/'))
  assert.equal(await digest(item.original), item.sha256, `Original attempted capture/report changed: ${item.original}`);
await artifacts(oldSprites.executedDrivers, initialOverrides); await artifact(oldSprites.collectionTool, initialOverrides);
await artifacts(oldSprites.captureArtifacts); await artifacts(firstSprites.captureArtifacts);
const initialDevelopment = await proof('development-initial', 'docs/qa/me1-prologue-enemies-public-development-report.json');
const initialVisual = await proof('development-initial-visual', 'docs/qa/me1-prologue-enemies-development-initial-visual-review.json');
await publicFiles(initialDevelopment, 'development', initialOverrides);
await sources(initialVisual.sourceHashes, initialOverrides); await artifacts(initialVisual.inputReports, initialOverrides);
await artifacts(initialVisual.imagesReviewed);
opened(initialVisual, [...artCaptures, ...before.screenshots, ...oldSprites.captureArtifacts, ...initialDevelopment.screenshots]);
assert.equal(initialVisual.imagesReviewed.length, 17);

// Current-candidate gates are independent of those earlier observations.
assert.equal(runtime.tests, 29); assert.equal(runtime.passedTests, 29); assert.equal(runtime.failedTests, 0);
assert.equal(runtime.skippedTests, 0); assert.equal(runtime.exitCode, 0); clean(runtime, ['changedSources']);
assert.equal(runtime.sourceHashes['src/world.js'], finalWorldSHA256); await sources(runtime.sourceHashes); await artifact(runtime.output);
assert.equal(Object.keys(runtime.sourceHashes).length, 25);
assert.equal(runtime.registeredCompanions.length, 7); assert.equal(runtime.registeredEnemies.length, 8);
assert.equal(runtime.newFixedDrawings, 12); assert.equal(runtime.bundledCompanionMetadata, 7); assert.equal(runtime.bundledEnemyMetadata, 8);
for (const key of ['currentNewNativeMetadataNormalized', 'newPNGHeadersMatch', 'nativeStatsAttacksStoryGatesAndSaveSchemaUnchanged',
  'jenkinsUsesExistingCover', 'jenkinsHasNoAddedBioticOrUnityAbility', 'firstEdenVictoryLossAndAshleyReplacementPreserved',
  'forgedJenkinsPartySaveRejected', 'foregroundSurvivesStaticMergeAndTwoModeCycles',
  'unchangedFieldGeometryCrossesMeasuredSightline', 'combatSightlineClearsMeasuredEnvelope', 'collisionFootprintsPreserved'])
  assert.equal(runtime.checks[key], true);
assert.equal(runtime.checks.foregroundNoveriaMeshes, 12); assert.equal(runtime.checks.foregroundFerosMeshes, 2);
assert.equal(runtime.checks.priorOverheadMeshes, 4); assert.equal(runtime.checks.ferosOverheadMeshes, 2);
spriteChecks(sprites); assert.equal(sprites.case, 'all'); assert.equal(sprites.sourceHashes['src/world.js'], finalWorldSHA256);
await sources(sprites.sourceHashes); await artifacts(sprites.captureArtifacts); await artifacts(sprites.servedAssets);
assert.equal(development.buildKind, 'vite-development-public-controls'); assert.equal(development.sourceFrozen, true);
assert.equal(development.compiledDistApplicable, false); assert.equal(development.sourceAndDistFrozen, false);
assert.equal(development.sources['src/world.js'], finalWorldSHA256); await publicFiles(development, 'development');
assert.equal(development.screenshots.length, 7); assert.equal(development.exports.length, 4);
assert.equal(development.jenkinsNarrative.nativeCoverPlayed, true); assert.equal(development.jenkinsNarrative.exactPrecombatRestore, true);
assert.equal(development.jenkinsNarrative.victoryPlayed, false); assert.equal(development.jenkinsNarrative.jenkinsLossNotYetExercised, true);
const developmentSaves = await downloaded(development);
assert.deepEqual(developmentSaves.get('eden-precombat'), developmentSaves.get('eden-precombat-restored'));
assert.deepEqual(developmentSaves.get('feros-precombat'), developmentSaves.get('feros-precombat-restored'));
await sources(developmentVisual.sourceHashes); await artifacts(developmentVisual.inputReports); await artifacts(developmentVisual.imagesReviewed);
assert.equal(developmentVisual.sourceHashes['src/world.js'], finalWorldSHA256);
opened(developmentVisual, [...sprites.captureArtifacts, ...development.screenshots]);

const workbookUpdate = await proof('workbook-update', 'docs/qa/me1-prologue-enemies-workbook-update.json');
const manifestUpdate = await proof('manifest-current', 'docs/qa/me1-prologue-enemies-manifest-update.json');
await sources(manifestUpdate.assetSourceHashes); await artifact(manifestUpdate.candidate);
assert.equal(manifestUpdate.candidate.sha256, await digest('public/assets/manifest.json'));
assert.equal(manifestUpdate.source.sha256, hash(execFileSync('git', ['show', `${baseline}:public/assets/manifest.json`], { cwd: root })));
assert.equal(manifestUpdate.previousCoreAssets, 26); assert.equal(manifestUpdate.currentCoreAssets, 29);
assert.equal(manifestUpdate.preservedPublicPNG, 31); assert.equal(manifestUpdate.currentPublicPNG, 34);
assert.equal(manifestUpdate.newPNG, 3); assert.equal(manifestUpdate.combatKeyPoses, 68);
const workbook = await proof('workbook-native', 'docs/qa/me1-prologue-enemies-workbook-public-preservation.json', row =>
  (row.ok === true || row.passed === true) && row.ok !== false && row.passed !== false);
const workbookVisual = await proof('workbook-visual', 'docs/qa/me1-prologue-enemies-workbook-visual-report.json');
const workbookRender = await proof('workbook-render', 'docs/qa/me1-prologue-enemies-workbook-render-report.json');
const workbookReview = await proof('workbook-opened', 'docs/qa/me1-prologue-enemies-workbook-visual-review-record.json');
assert.equal(workbook.catalogueEntries, 1382); assert.equal(workbook.unchangedEntries, 1375);
assert.equal(workbook.changedWorkbookCells, 24); assert.equal(workbook.changedTextCells, 20); assert.equal(workbook.changedStatusCells, 4);
assert.equal(workbook.changedCatalogueFields, 37); assert.equal(workbook.changedMetadataFields, 13);
assert.equal(workbook.prototypeCoverageChangedKeys.length, 7); assert.equal(workbook.integratedOrValidatedPromotions, 0);
assert.equal(workbook.statusPromotions, 2); assert.equal(workbook.assetStatusPromotions, 2);
assert.deepEqual(sorted(workbook.changedIds), expectedIds); assert.equal(workbook.sha256, await digest('docs/Mass_Effect_Relay_Chronicles_Production.xlsx'));
for (const [key, count] of Object.entries({ sheets: 28, tables: 26, formulas: 274, dataValidations: 130, conditionalRules: 130, catalogueCells: 23494 }))
  assert.equal(workbook.nativeChecks[key], count);
assert.equal(workbookUpdate.baseCommit, baseline); assert.equal(workbookUpdate.cellChanges.length, 24);
assert.equal(workbookUpdate.catalogueChanges.length, 37); assert.equal(workbookUpdate.prototypeCoverage.changes.length, 7);
assert.equal(workbookVisual.actualVisualReview.actuallyOpenedImages, 30); assert.equal(workbookVisual.integratedOrValidatedPromotions, 0);
assert.equal(Object.keys(workbookVisual.deliveries).length, 3); await sources(workbookVisual.deliveries);
await sources(workbookVisual.assetSourceHashes); await sources(workbookVisual.artifactDigests);
await artifacts(workbookVisual.integrationProofs);
assert.equal(workbookRender.sourceWorkbookUnchanged, true); assert.equal(workbookRender.images.length, 30);
assert.equal(workbookReview.actuallyOpenedImages, 30); assert.equal(workbookReview.images.length, 30);
assert.equal(workbookReview.rowPanels, 28); assert.equal(workbookReview.dashboardPanels, 2);
assert.equal(workbookReview.reviewComplete, true); assert.deepEqual(workbookReview.blockingFindings, []);
assert.ok(workbookReview.images.every(row => row.actuallyOpened));
await artifacts(workbookRender.images); await artifacts(workbookReview.images); samePaths(workbookRender.images, workbookReview.images);
assert.equal(workbookReview.sourceWorkbookSha256, workbook.sha256);
assert.equal(workbookReview.renderReportSha256, proofs['workbook-render'].sha256);
for (const [suffix, gate] of [['sprites', proofs['sprites-final']], ['development', proofs['development-final']], ['visual', proofs['development-visual']]]) {
  const path = `docs/qa/me1-prologue-enemies-workbook-${suffix}-gate.json`;
  assert.equal(await digest(path), gate.sha256, `Workbook used another ${suffix} gate.`);
}

// Validate the exact frozen full-suite/build records without executing them.
assert.equal(unit.tests, 806); assert.equal(unit.passedTests, 806); assert.equal(unit.failedTests, 0);
assert.equal(unit.skippedTests, 0); assert.equal(unit.cancelledTests, 0); assert.equal(unit.exitCode, 0);
assert.equal(build.exitCode, 0); assert.equal(build.pngFiles, 34); assert.equal(build.compiledJavaScriptBundles, 9);
assert.equal(build.modules, 83); assert.equal(Object.keys(unit.sourceHashes).length, 235);
clean(build, ['changedSources']); assert.deepEqual(unit.sourceHashes, build.sourceHashes);
await sources(unit.sourceHashes); await artifacts([unit.output, build.output]); await artifacts(build.artifacts);
const requiredInputs = [...await tree('src/'), ...(await tree('tests/')).filter(path => path.endsWith('.test.js')),
  ...await tree('public/assets/'), ...mutableFiles, 'package.json', 'package-lock.json', 'vite.config.js',
  'AGENTS.md', 'CLAUDE.md', '.ai-tools/README.md', '.ai-tools/setup.py', '.ai-tools/sources.json',
  '.ai-tools/tests/test_setup.py', '.ai-tools/.gitignore', 'scripts/verify-me1-prologue-enemies-build.mjs'];
for (const path of requiredInputs) assert.ok(Object.hasOwn(unit.sourceHashes, path), `A required build/test input is unbound: ${path}`);
samePaths(build.artifacts, (await tree('dist/')).map(path => ({ path })));
const unitText = (await bytes(unit.output.path)).toString();
for (const [name, count] of [['tests', 806], ['pass', 806], ['fail', 0], ['skipped', 0], ['cancelled', 0]])
  assert.match(unitText, new RegExp(`^(?:#|ℹ) ${name} ${count}$`, 'm'));
assert.match((await bytes(build.output.path)).toString(), new RegExp(`${build.modules} modules transformed`));
const catalog = JSON.parse(await bytes('docs/content-catalog.json'));
const mainCounts = {}, universeCounts = {};
for (const row of catalog.entries) mainCounts[row.status] = (mainCounts[row.status] || 0) + 1;
const universeSource = (await bytes('src/universe-data.js')).toString();
const tuples = JSON.parse(universeSource.match(/^const ROWS = (\[[^\n]+\]);$/m)?.[1] || 'null'); assert.ok(tuples);
for (const row of tuples) universeCounts[row[5]] = (universeCounts[row[5]] || 0) + 1;
assert.deepEqual(mainCounts, { Prototype: 350, 'Défini': 1026, 'Validé': 3, 'Intégré': 3 });
assert.deepEqual(universeCounts, { Prototype: 641, 'Défini': 6061, 'Validé': 3, 'Intégré': 3 });
assert.equal(native.generatedUniverse.reproducedWithoutWriting, true); assert.equal(native.generatedUniverse.recordCount, 6708);
assert.equal(native.generatedUniverse.sourceCount, 454); assert.equal(native.generatedUniverse.workCount, 28);
assert.deepEqual(sorted(native.generatedUniverse.changedRows.map(row => row.id)), expectedIds);

assert.equal(production.buildKind, 'production-dist'); assert.equal(production.sourceAndDistFrozen, true);
assert.equal(production.sourceFrozen, true); assert.equal(production.compiledDistApplicable, true);
await artifact(productionBuildGate.buildReport); assert.equal(productionBuildGate.buildReport.sha256, proofs.build.sha256);
assert.equal(productionBuildGate.checkedBuildArtifacts, build.artifacts.length);
assert.equal(productionBuildGate.checkedSources, Object.keys(build.sourceHashes).length);
assert.equal(production.sources['src/world.js'], finalWorldSHA256); await publicFiles(production, 'production');
clean(production, ['sourceRequests']); assert.equal(production.screenshots.length, 9); assert.equal(production.exports.length, 5);
const dist = Object.entries(production.buildFiles).map(([path, row]) => ({ path: `dist/${path}`, ...row }));
await artifacts(dist); samePaths(dist, build.artifacts);
for (const item of dist) assert.equal(item.sha256, build.artifacts.find(row => row.path === item.path).sha256);
assert.ok(production.browserResponses.some(row => row.path === 'index.html' && row.status === 200
  && row.sha256 === production.buildFiles['index.html'].sha256));
assert.ok(production.browserResponses.some(row => row.path.endsWith('.js') && row.status === 200 && row.matchesDist));
const saved = await downloaded(production), beforeEden = saved.get('eden-precombat');
const won = saved.get('eden-first-victory'), restored = saved.get('eden-first-victory-restored');
assert.ok(beforeEden && won && restored); assert.deepEqual(won, restored);
assert.deepEqual(beforeEden.party, ['shepard', 'kaidan', 'jenkins']); assert.equal(beforeEden.flags.jenkinsLost, undefined);
assert.equal(won.flags.jenkinsLost, true); assert.equal(won.lost.filter(id => id === 'jenkins').length, 1);
assert.equal(won.recruited.filter(id => id === 'ashley').length, 1); assert.deepEqual(won.party, ['shepard', 'kaidan', 'ashley']);
assert.equal(won.cleared.filter(id => id === 'eden-prime:encounter-1').length, 1);
assert.equal(won.xp - beforeEden.xp, 65); assert.equal(won.credits - beforeEden.credits, 85);
assert.equal(canStartEncounter(won, 'eden-prime:encounter-1').ok, false);
assert.deepEqual(saved.get('feros-precombat'), saved.get('feros-precombat-restored'));
for (const key of ['nativeVictoryPlayed', 'claimedOnce', 'jenkinsLost', 'ashleyRecruited', 'exactReloadRestore'])
  assert.equal(production.jenkinsNarrative[key], true);
assert.deepEqual(production.jenkinsNarrative.availableParty, won.party);
assert.equal(production.jenkinsNarrative.rewardXP, 65); assert.equal(production.jenkinsNarrative.rewardCredits, 85);

// Final acceptance requires actual visual opening of every mandatory capture.
// Historical views keep their own labels and do not count as final Féros proof.
await sources(visual.sourceHashes); await artifacts(visual.inputReports); await artifacts(visual.imagesReviewed);
assert.equal(visual.sourceHashes['src/world.js'], finalWorldSHA256);
const historicalCaptures = [...before.screenshots, ...oldSprites.captureArtifacts, ...initialDevelopment.screenshots];
const finalCaptures = [...sprites.captureArtifacts, ...development.screenshots, ...production.screenshots];
opened(visual, [...artCaptures, ...historicalCaptures, ...finalCaptures]);
for (const item of finalCaptures) assert.match(visual.imagesReviewed.find(row => row.path === item.path).category, /^current-/);
for (const item of historicalCaptures) assert.match(visual.imagesReviewed.find(row => row.path === item.path).category, /^historical-/);
assert.ok(visual.inputReports.some(row => row.path === proofs['development-visual'].path && row.sha256 === proofs['development-visual'].sha256));

const report = {
  passed: true, generatedAt: new Date().toISOString(), baselineCommit: baseline, currentWorldSha256: finalWorldSHA256,
  specification: { path: 'docs/research/me1-prologue-enemies-scope.md', sha256: await digest('docs/research/me1-prologue-enemies-scope.md') },
  scope: 'Three existing ME1 actors gain twelve fixed combat drawings. Existing Jenkins presence/loss rules and native commands remain intact; generic asari does not implement the Thorian clone. Twelve existing Noveria pillar/light meshes and two Feros foreground posts now yield in combat. The existing bible, catalogue and workbook are synchronized without a mechanics or engine migration.',
  additions: { nativePNG: 3, fixedCombatDrawings: 12, companionFamilies: 1, enemyFamilies: 2,
    newCanonicalCharacters: 0, newMechanicalKits: 0, newEquipment: 0, newPilotableVehiclesOrShips: 0,
    existingVisibilityMeshesRegistered: 14 },
  currentVisualTotals: { nativePNG: 34, coreManifestAssets: 29, combatKeyPoses: 68, shepard: 8,
    companions: 28, enemies: 32, seatedDrawings: 2, groundTextures: 2 },
  artwork: artReports, sourceScope: { preserved: native.preserved, catalogue: native.catalog,
    geometry: native.geometry, inheritedEquipment: native.inheritedEquipment, generatedUniverse: native.generatedUniverse },
  validation: { fullNodeTests: unit.tests, targetedNativeTests: runtime.tests, compiledModules: build.modules,
    compiledJavaScriptBundles: build.compiledJavaScriptBundles, compiledPNG: build.pngFiles,
    frozenSources: Object.keys(unit.sourceHashes).length, currentHeldPoseCases: sprites.cases.length,
    currentNativeEventSequences: sprites.nativeEvents.length, currentForeignContextClosures: sprites.scopeClosures.length,
    currentNarrativeClosures: sprites.narrativeClosures.length, earlierFamilyAimRegressions: sprites.regressions.length,
    developmentPublicCaptures: development.screenshots.length, productionPublicCaptures: production.screenshots.length,
    productionNativeOrders: production.nativeOrders.length, developmentDownloadedSaves: development.exports.length,
    productionDownloadedSaves: production.exports.length, finalRuntimeCapturesActuallyOpened: finalCaptures.length,
    allVisualCapturesActuallyOpened: visual.imagesReviewed.length, workbookPanelsActuallyOpened: workbookReview.images.length,
    newTestBuildBrowserOrWorkbookRunForSummary: false },
  productionEvidence: { report: proofs.production, buildPreflight: proofs['production-build-gate'],
    uninterruptedPassingRun: true, nativeFirstEdenVictory: production.jenkinsNarrative,
    duplicateVictoryRefusedByNativeValidator: true, secondVictoryClaimAttemptedInBrowser: false,
    ferosEncounter: production.ferosEncounter, preparedFixtureOrigins: production.fixtures,
    reloads: production.reloads, fullConsoleClean: production.consoleObservations.length === 0,
    consoleObservations: production.consoleObservations, resourceWarnings: production.resourceWarnings },
  workbook: { deliveries: workbookVisual.deliveries, changedIds: workbook.changedIds, changedWorkbookCells: 24,
    changedTextCells: 20, changedStatusCells: 4, changedCatalogueFields: 37, changedMetadataFields: 13,
    prototypeCoverageKeysChanged: 7, prototypePromotions: 2, assetPrototypePromotions: 2,
    integratedOrValidatedPromotions: 0, otherEntriesUnchanged: 1375, nativeChecks: workbook.nativeChecks,
    actualVisualReview: workbookVisual.actualVisualReview, limits: workbookVisual.limits,
    mainStatusCounts: mainCounts, universeStatusCounts: universeCounts },
  historicalEvidence: { baseline: proofs.before, baselineSourceArchive: before.sourceArchive,
    reusedBuild: before.reusedBuild, baselineCommandQualification: beforeVisual.commandRecordCorrection,
    initialCandidateSourceArchive: { ...initialSourceArchive, overrides: undefined },
    initialCandidateRuntimeArchive: { ...initialRuntimeArchive, overrides: undefined },
    initialManifestDrafts: { ...initialManifestArchive, overrides: undefined },
    initialRuntimeTests: initialRuntime.tests, initialSpriteComposite: proofs['sprites-initial-composite'],
    initialSpriteAttempt: { ...spriteAttempt, overrides: undefined },
    spriteCollectorFailure: oldSprites.collectorFailure,
    initialDevelopment: proofs['development-initial'], initialVisual: proofs['development-initial-visual'],
    qualification: 'The original raw sprite collector remains negative; its12 held states were combined with a later native-only run and explicitly labelled composite. Those two executions and the initial development journey belong to the archived pre-Feros candidate. Fresh current-candidate held/development/production gates are verified separately. The initial development collector used production wording in screenshot metadata and an inapplicable dist-frozen label; its actual buildKind was development and its empty buildFiles are retained, without claiming a production build.' },
  visualReview: { report: proofs['visual-final'], observations: visual.observations,
    residualFindings: visual.residualFindings, limitations: visual.limitations },
  limitations: [
    'Sprites and ATB remain an authored adaptation. Four fixed drawings per family do not establish full cycles, additional directions, exact original bodies, equipment geometry or1:1 fidelity.',
    'The generic asari profile is reused by the condensed campaign. The distinct Thorian clone records and summon/disappearance phases remain unfinished.',
    'The real production victory validates the retained prototype timing: Jenkins is lost when the first Eden victory is claimed. It does not replay the original scripted drone death or the earlier Normandy/landing journey.',
    'Feros and Noveria use explicit valid prepared saves. Their previous story victories and recruitment are not represented as played in Chromium; Feros shot/restore does not claim a new victory or reward.',
    'The held renderer fixture explicitly prepares timing, shields and one-health KO witnesses. It is separate from natural public actions and ordinary campaign statistics.',
    'KO contrast and mobile framing retain the capture-specific reserves in the final visual review. A390px software-WebGL viewport is not physical-phone, hardware-FPS or controller certification.',
    'Workbook panels were visually inspected through the available rendering tool and native XML preservation checks. Microsoft Excel and the packaged Windows game were not launched here.',
    'Historical evidence remains immutable and phase-bound. A composite collector does not become a fresh uninterrupted passing run, and old world hashes are not current-source results.',
    'The final local HTTP production build is verified. Vercel deployment and remote application state require their separate service observations.',
  ],
  aggregationTool: { path: 'scripts/summarize-me1-prologue-enemies.mjs', sha256: await digest('scripts/summarize-me1-prologue-enemies.mjs') },
  verifiedFileCount: checked.size, proofs,
};
await writeFile(new URL(output, root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, proofs: Object.keys(proofs).length, checkedFiles: checked.size,
  nodeTests: unit.tests, newPNG: 3, currentRuntimeCaptures: finalCaptures.length, workbookPanels: 30 }));
