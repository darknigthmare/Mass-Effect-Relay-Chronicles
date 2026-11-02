import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { decodeSave } from '../src/state.js';

// Aggregate existing evidence only: no browser, test, build or asset generator
// is run here, and no input report is rewritten.
const root = new URL('../', import.meta.url), proofs = {}, checkedFiles = new Map();
const bytes = path => readFile(new URL(path, root));
const hash = data => createHash('sha256').update(data).digest('hex');
async function digest(path) {
  if (!checkedFiles.has(path)) checkedFiles.set(path, hash(await bytes(path)));
  return checkedFiles.get(path);
}
async function artifact(item) {
  assert.ok(item?.path && /^[a-f0-9]{64}$/.test(item.sha256), 'A proof artifact needs its path and SHA256.');
  assert.equal(await digest(item.path), item.sha256, `Artifact changed: ${item.path}`);
  if (Number.isInteger(item.bytes)) assert.equal((await bytes(item.path)).length, item.bytes, `Artifact size changed: ${item.path}`);
}
async function artifacts(items = []) { for (const item of items) await artifact(item); }
async function sources(value = {}) {
  const pairs = Array.isArray(value) ? value.map(item => [item.path, item.sha256]) : Object.entries(value);
  for (const [path, sha256] of pairs) await artifact({ path, sha256 });
}
async function proof(name, positive = report => report.passed === true) {
  const path = `docs/qa/${name}.json`, raw = await bytes(path), report = JSON.parse(raw);
  assert.ok(positive(report), `Evidence is not final and positive: ${path}`);
  proofs[name] = { path, bytes: raw.length, sha256: hash(raw) }; return report;
}
const samePaths = (actual, expected, message) => assert.deepEqual(actual.map(item => item.path).sort(), expected.map(item => item.path).sort(), message);
const clean = (report, keys) => { for (const key of keys) assert.deepEqual(report[key], [], `Nonempty ${key}`); };

const native = await proof('eden-immersion-native-report');
const before = await proof('eden-immersion-before-report');
const beforeVisual = await proof('eden-immersion-before-visual-review');
const intermediate = await proof('eden-immersion-inspection-report');
const intermediateVisual = await proof('eden-immersion-inspection-review', report => report.passed === false && report.reviewComplete === true);
const corrected = await proof('eden-immersion-inspection-corrected-report');
const world = await proof('eden-immersion-world-report');
const worldVisual = await proof('eden-immersion-world-visual-review');
const sprites = await proof('eden-immersion-sprites-report');
const krogan = await proof('eden-immersion-krogan-art'), rachni = await proof('eden-immersion-rachni-art');
const terrain = await proof('eden-immersion-terrain-art');
const terrainBrowser = await proof('eden-immersion-terrain-browser-report');
const terrainVisual = await proof('eden-immersion-terrain-material-review');
const unit = await proof('eden-immersion-unit-report'), build = await proof('eden-immersion-build-report');
const production = await proof('eden-immersion-production-report');
const workbook = await proof('eden-immersion-workbook-public-preservation', report => report.ok === true);
const workbookVisual = await proof('eden-immersion-workbook-visual-report');
const workbookRender = await proof('eden-immersion-workbook-render-report');
const workbookReview = await proof('eden-immersion-workbook-visual-review-record');
const visual = await proof('eden-immersion-visual-review');

assert.equal(native.preserved.baselineFiles, 1961); assert.equal(native.preserved.protectedFiles, 1945);
assert.equal(native.preserved.protectedUnchanged, 1945); assert.equal(native.protectedBlobs.length, 1945);
assert.deepEqual(native.preserved.actualChangedTrackedFiles, native.preserved.explicitMutableFiles);
assert.ok(native.protectedBlobs.every(item => item.passed && item.baselineBlob === item.currentBlob));
await artifacts(native.protectedBlobs); await artifacts(native.preserved.gameplayModules); await artifacts(native.art.headers);
assert.equal(native.geometry.zones, 9); assert.equal(native.geometry.unchangedOtherZones.length, 8);
assert.equal(native.geometry.edenPOIIds.length, 7); assert.equal(native.geometry.edenPOISemanticsPreserved, true);
assert.equal(native.geometry.rooms, 5); assert.equal(native.geometry.paths, 3); assert.equal(native.geometry.landmarks, 9);
assert.equal(native.geometry.arenas, 3); assert.equal(native.geometry.envelopeArea, 16500);
assert.equal(native.geometry.groundArea.measuredHere, false);
assert.equal(native.catalog.entries, 1382); assert.equal(native.catalog.unchangedEntries, 1374);
assert.equal(native.catalog.changedIds.length, 8); assert.equal(native.catalog.statusPromotions.length, 5);
assert.equal(native.catalog.assetStatusPromotions.length, 5); assert.equal(native.catalog.integratedOrValidatedPromotions, 0);
assert.ok([...native.catalog.statusPromotions, ...native.catalog.assetStatusPromotions].every(item => item.to === 'Prototype'));
assert.equal(native.art.nativePNGCount, 31); assert.equal(native.art.coreAssets, 26);
assert.equal(native.art.oldPNGUnchanged, 27); assert.equal(native.art.oldCoreManifestAssetsUnchanged, 22);
assert.equal(native.art.combatKeyPoses, 56); assert.equal(native.art.enemyCombatKeyPoses, 24);
assert.equal(native.art.seatedKeyPoses, 2); assert.equal(native.art.terrainTextureCount, 2); assert.equal(native.art.nativePairs.length, 2);
for (const pair of native.art.nativePairs) {
  assert.equal(pair.passed, true); assert.deepEqual(pair.poses, ['aim', 'power', 'hit', 'down']);
  await artifact({ path: pair.pngPath, sha256: pair.pngSha256 }); await artifact({ path: pair.configPath, sha256: pair.configSha256 });
}
assert.equal(native.inheritedEquipment.supported, 107); assert.equal(native.inheritedEquipment.weapons, 79);
assert.equal(native.inheritedEquipment.unchangedModule, true); assert.equal(native.inheritedEquipment.newEquipmentInThisLot, 0);
await artifact({ path: native.reproduction.script, sha256: native.reproduction.scriptSha256 });
await artifacts([native.workbook.nativePublicProof, native.workbook.visualProof]);
await sources(native.workbook.deliveries); clean(native, ['failures']);
await artifact(native.auditHistory.initialAttempt);
assert.equal(JSON.parse(await bytes(native.auditHistory.initialAttempt.path)).passed, false);

// Before/intermediate sources are historical. Compare archived executed bytes,
// never the old world geometry against the later implementation on disk.
const historicalSources = [];
for (const [name, report] of [['before', before], ['intermediate', intermediate]]) {
  await artifacts(report.sourceArchive);
  for (const archived of report.sourceArchive) assert.equal(archived.sha256, report.sourceHashes[archived.originalPath]);
  historicalSources.push({ phase: name, archivedSourcesVerified: report.sourceArchive.length,
    sourceArchive: report.sourceArchive, recordedSourceHashes: report.sourceHashes,
    unarchivedRecordedSources: Object.keys(report.sourceHashes).filter(path => !report.sourceArchive.some(item => item.originalPath === path)),
    qualification: report.sourceArchiveQualification || 'The baseline runtime files are archived; the collection runner digest is recorded separately.' });
}
assert.equal(before.sourceArchive.length, 6); assert.equal(before.screenshots.length, 5);
assert.equal(before.baselineCommit, native.baselineCommit);
await artifacts(before.screenshots); await artifacts(beforeVisual.images); await artifact(beforeVisual.inputReport);
samePaths(beforeVisual.images, before.screenshots);
assert.ok(beforeVisual.images.every(image => image.actuallyOpened === true));
await artifacts(intermediate.screenshots); await artifacts(intermediateVisual.images); await artifact(intermediateVisual.inputReport);
samePaths(intermediateVisual.images, intermediate.screenshots);
assert.ok(intermediateVisual.blockingFindings.length > 0, 'The failed intermediate visual review must remain explicit.');
await artifacts(corrected.screenshots);
historicalSources.push({ phase: 'corrected-intermediate', recordedSourceHashes: corrected.sourceHashes,
  qualification: 'Historical targeted screenshots; no archived world.js snapshot is claimed and this phase does not replace final navigation or production evidence.' });

for (const report of [native, world, sprites, krogan, rachni, terrain, terrainBrowser, unit, build]) await sources(report.sourceHashes);
await sources(production.sources); await artifacts(build.artifacts); await artifacts([unit.output, build.output]);
assert.deepEqual(unit.sourceHashes, build.sourceHashes); assert.equal(Object.keys(unit.sourceHashes).length, 215);
assert.equal(unit.tests, 801); assert.equal(unit.passedTests, 801); assert.equal(unit.failedTests, 0); assert.equal(unit.skippedTests, 0);
assert.equal(unit.exitCode, 0); assert.equal(build.exitCode, 0); assert.deepEqual(build.changedSources, []);
assert.equal(build.modules, 83); assert.equal(build.pngFiles, 31); assert.equal(build.compiledJavaScriptBundles, 9);
const unitText = (await bytes(unit.output.path)).toString();
for (const [label, count] of [['tests', 801], ['pass', 801], ['fail', 0], ['skipped', 0]])
  assert.match(unitText, new RegExp(`^(?:#|ℹ) ${label} ${count}$`, 'm'));
const buildText = (await bytes(build.output.path)).toString(); assert.match(buildText, /83 modules transformed/);
const distArtifacts = Object.entries(production.buildFiles).map(([path, item]) => ({ path: `dist/${path}`, ...item }));
await artifacts(distArtifacts); samePaths(distArtifacts, build.artifacts, 'Public server must represent the exact final build.');
for (const item of distArtifacts) assert.equal(item.sha256, build.artifacts.find(file => file.path === item.path).sha256);

assert.equal(world.phase, 'final'); assert.equal(world.routes.length, 7); assert.equal(world.journeys.length, 7);
assert.ok(world.routes.every(item => item.reachable && item.goalWalkable && item.allWaypointsWalkable));
assert.ok(world.journeys.every(item => item.allWalkable && item.allFollowersWalkable && item.remaining === 0 && item.distanceToGoal < .3));
assert.equal(world.screenshots.length, 13); assert.equal(world.battleArenas.length, 3);
assert.equal(world.modalFreeze.passed, true); assert.equal(world.keyboard.walkable, true);
clean(world, ['errors', 'failedRequests', 'servedAssetErrors']); assert.deepEqual(world.cleanup.assetErrors, []);
await artifacts(world.screenshots); await artifacts(worldVisual.images);
assert.equal(worldVisual.reportSHA256, proofs['eden-immersion-world-report'].sha256);
samePaths(worldVisual.images, world.screenshots); assert.ok(worldVisual.images.every(image => image.actuallyOpened));
assert.equal(worldVisual.reviewComplete, true); assert.deepEqual(worldVisual.blockingFindings, []);

assert.equal(sprites.cases.length, 8); assert.equal(sprites.nativeEvents.length, 2);
assert.equal(sprites.scopeClosures.length, 12); assert.equal(sprites.regressions.length, 4); assert.equal(sprites.captureArtifacts.length, 4);
assert.ok(sprites.cases.every(item => item.passed && item.battleUnchanged && item.saveUnchanged && item.groundAnchorError < 1e-8));
assert.ok(sprites.nativeEvents.every(item => item.actionOK && item.liveDamageOK && item.damageOK && item.powersUnchanged && item.rendererPreservesNativeBattle));
assert.ok(sprites.scopeClosures.every(item => item.frame === null && item.usesNewCombatAtlas === false));
assert.ok(sprites.regressions.every(item => item.saveUnchanged));
assert.equal(sprites.fixturePreserved.stateUnchanged, true);
assert.deepEqual(sprites.fixturePreserved.storageAfter, sprites.fixturePreserved.storageBefore);
assert.deepEqual(sprites.fixturePreserved.assetErrors, []); clean(sprites, ['errors', 'failedRequests']);
await artifacts(sprites.captureArtifacts); await artifacts(sprites.servedAssets); await artifacts(sprites.manualVisualReview.images);
samePaths(sprites.manualVisualReview.images, sprites.captureArtifacts);
assert.ok(sprites.manualVisualReview.images.every(image => image.actuallyOpened));

const generatedAssets = [];
for (const art of [krogan, rachni]) {
  assert.equal(art.nativeCopyVerified, true); assert.equal(art.actuallyOpened, true); assert.equal(art.pixelEditingApplied, false);
  assert.equal(art.frames.length, 4); assert.equal(art.visiblePixelsUnassigned, 0); assert.equal(art.visiblePixelsShared, 0);
  assert.equal(art.mediaId, 'ME1'); assert.equal(art.periodId, 'me1'); assert.equal(art.status, 'Prototype');
  await artifact({ path: art.png, sha256: art.sha256, bytes: art.bytes });
  generatedAssets.push({ kind: 'enemy-fixed-pose-atlas', path: art.png, sha256: art.sha256, bytes: art.bytes,
    nativeCopyVerified: art.nativeCopyVerified, actuallyOpened: art.actuallyOpened, frameCount: art.frames.length });
}
assert.equal(terrain.assets.length, 2); assert.equal(terrain.pixelEditingApplied, false);
await artifacts(terrain.assets); await artifacts(terrain.proofs); await artifacts(terrain.captures);
await artifacts(terrainBrowser.captures); await artifacts(terrainVisual.images);
assert.equal(terrainVisual.blockingFindings.length, 0); clean(terrainBrowser, ['errors', 'failedRequests']);
for (const asset of terrain.assets) {
  assert.ok(asset.nativeCopyVerified && asset.actuallyOpened && asset.opaque); assert.equal(asset.mode, 'RGB');
  assert.equal(asset.width, 1254); assert.equal(asset.height, 1254);
  generatedAssets.push({ kind: 'terrain-texture', path: asset.path, sha256: asset.sha256, bytes: asset.bytes,
    nativeCopyVerified: asset.nativeCopyVerified, actuallyOpened: asset.actuallyOpened, dimensions: [asset.width, asset.height] });
}

assert.equal(production.buildKind, 'production-dist'); assert.equal(production.walks.length, 4);
assert.equal(production.encounters.length, 2); assert.equal(production.nativeOrders.length, 3);
assert.equal(production.exports.length, 8); assert.equal(production.screenshots.length, 15);
assert.equal(production.profile.launches, 2); assert.equal(production.profile.completeShutdowns, 2);
assert.equal(production.extendedPositionRestore.exact, true); assert.equal(production.extendedPositionRestore.oldBoundsExceeded, true);
assert.deepEqual(production.extendedPositionRestore.before, production.extendedPositionRestore.after);
assert.equal(production.edenPrecombatRestore, true);
assert.ok(production.encounters.every(item => item.actualNativeShot && item.exactPrecombatRestore && item.noVictoryRewardClaimed));
assert.deepEqual(production.encounters.map(item => item.key).sort(), ['krogan', 'rachni']);
assert.equal(production.fullRestart.exactPublicUI, true); assert.equal(production.fullRestart.noPostRestartDownloadAttempted, true);
assert.deepEqual(production.fullRestart.before, production.fullRestart.after);
assert.equal(production.mobileMap.viewport, 390); assert.ok(production.mobileMap.document <= 390 && production.mobileMap.board >= 260);
clean(production, ['errors', 'failedRequests', 'sourceRequests', 'responseEvidenceErrors']);
assert.deepEqual(production.browserEvents.filter(item => !item.intentional || item.type === 'page-crash'), []);
await artifacts(production.screenshots); await artifacts(production.exports); await artifacts(production.fixtures);
assert.ok(production.fixtures.every(item => item.importedViaPublicChooser));
assert.ok(production.exports.every(item => item.publicSaveBeforeExport));
const saves = new Map();
for (const item of production.exports) {
  const saved = decodeSave((await bytes(item.path)).toString()); assert.ok(saved, `Invalid actual save: ${item.path}`);
  delete saved.playedSeconds; assert.equal(hash(JSON.stringify(saved)), item.stableStateSha256);
  assert.equal(hash(JSON.stringify(saved.inventory)), item.inventorySha256); saves.set(item.label, saved);
}
for (const [first, second] of [['outside-old-rectangle', 'outside-old-rectangle-restored'], ['patrol-precombat', 'patrol-resumed'],
  ['krogan-precombat', 'krogan-resumed'], ['rachni-precombat', 'rachni-resumed']]) {
  assert.ok(saves.has(first) && saves.has(second)); assert.deepEqual(saves.get(first), saves.get(second));
}
for (const walk of production.walks) assert.ok(walk.samples.length > 1 && Math.hypot(walk.after.x - walk.target.x, walk.after.z - walk.target.z) <= .65);
assert.equal(production.sources['scripts/eden-immersion-production.mjs'], await digest('scripts/eden-immersion-production.mjs'));
for (const item of production.servedFiles) { assert.equal(item.status, 200); assert.equal(item.matchesDist, true);
  assert.equal(item.sha256, await digest(`dist/${item.path}`)); assert.equal(item.sha256, await digest(`public/${item.path}`)); }
assert.equal(production.servedFiles.length, 6);
const pngRequests = production.pageAtlasRequests.filter(item => item.status === 200);
for (const item of pngRequests) { assert.equal(item.matchesDist, true); assert.equal(item.sha256, await digest(`public/${item.path}`)); }
assert.deepEqual([...new Set(pngRequests.map(item => item.path))].sort(), generatedAssets.map(item => item.path.replace(/^public\//, '')).sort());
for (const item of production.consoleObservations) {
  assert.ok(item.location.url.endsWith('/favicon.ico'));
  assert.equal(item.text, 'Failed to load resource: the server responded with a status of 404 (Not Found)');
}

// Preserve the unsuccessful first collector verbatim, including its own runner
// and screenshots. It is a selector failure, never counted as a passing journey.
const attemptPath = 'docs/qa/eden-immersion-production-attempt1/snapshot-manifest.json';
const attemptManifest = JSON.parse(await bytes(attemptPath));
for (const item of attemptManifest.files) await artifact({ path: item.snapshot, sha256: item.sha256 });
const attemptReportFile = attemptManifest.files.find(item => item.original === 'docs/qa/eden-immersion-production-report.json');
const attempt = JSON.parse(await bytes(attemptReportFile.snapshot));
assert.equal(attempt.passed, false); assert.match(attempt.failure, /strict mode violation/);
for (const capture of attempt.screenshots) {
  const archived = attemptManifest.files.find(item => item.original === capture.path);
  assert.equal(archived?.sha256, capture.sha256);
}
const archivedRunner = attemptManifest.files.find(item => item.original === 'scripts/eden-immersion-production.mjs');
assert.equal(archivedRunner.sha256, attempt.sources['scripts/eden-immersion-production.mjs']);
for (const [path, sha256] of Object.entries(attempt.sources)) if (path !== 'scripts/eden-immersion-production.mjs')
  assert.equal(sha256, production.sources[path], `A game source changed after the collector-only correction: ${path}`);
const priorAttempt = { path: attemptPath, sha256: await digest(attemptPath), originalFailure: attempt.failure,
  qualification: attemptManifest.reason, preservedFiles: attemptManifest.files, countedAsPassingJourney: false };

assert.equal(workbook.changedIds.length, 8); assert.equal(workbook.unchangedEntries, 1374); assert.equal(workbook.catalogueEntries, 1382);
assert.deepEqual([...native.catalog.changedIds].sort(), [...workbook.changedIds].sort());
assert.equal(workbook.statusPromotions, 5); assert.equal(workbook.assetStatusPromotions, 5);
assert.equal(workbook.changedWorkbookCells, 45); assert.equal(workbook.changedTextCells, 35); assert.equal(workbook.changedStatusCells, 10);
assert.equal(await digest('docs/Mass_Effect_Relay_Chronicles_Production.xlsx'), workbook.sha256);
assert.equal(workbookVisual.integratedOrValidatedPromotions, 0); assert.equal(workbookVisual.actualVisualReview.actuallyOpenedImages, 35);
assert.equal(Object.keys(workbookVisual.deliveries).length, 3); await sources(workbookVisual.deliveries);
await sources(workbookVisual.assetSourceHashes); await sources(workbookVisual.artifactDigests); await artifacts(workbookVisual.integrationProofs);
assert.equal(Object.keys(workbookVisual.assetSourceHashes).length, 6);
assert.equal(workbookVisual.integrationProofs[0].sha256, proofs['eden-immersion-world-report'].sha256);
assert.equal(workbookVisual.integrationProofs[1].sha256, proofs['eden-immersion-sprites-report'].sha256);
assert.equal(workbookRender.images.length, 35); assert.equal(workbookRender.sourceWorkbookUnchanged, true);
assert.equal(workbookReview.actuallyOpenedImages, 35); assert.equal(workbookReview.rowPanels, 32); assert.equal(workbookReview.dashboardPanels, 3);
assert.equal(workbookReview.sourceWorkbookSha256, workbook.sha256);
assert.equal(workbookReview.renderReportSha256, proofs['eden-immersion-workbook-render-report'].sha256);
await artifacts(workbookRender.images); await artifacts(workbookReview.images); samePaths(workbookReview.images, workbookRender.images);
assert.ok(workbookReview.images.every(image => image.actuallyOpened));

assert.equal(visual.reviewComplete, true); assert.equal(visual.finalNavigationReviewComplete, true);
assert.equal(visual.finalSpriteReviewComplete, true); assert.equal(visual.finalPublicReviewComplete, true);
assert.equal(visual.counts.finalNavigation, 13); assert.equal(visual.counts.finalSprites, 4); assert.equal(visual.counts.finalPublic, 15);
assert.equal(visual.imagesReviewed.length, 45); assert.equal(visual.globalFidelityCertified, false);
assert.deepEqual(visual.blockingFindings, []); await artifacts(visual.inputReports); await artifacts(visual.imagesReviewed);
assert.ok(visual.imagesReviewed.every(image => image.actuallyOpened));
assert.equal(new Set(visual.imagesReviewed.map(item => item.path)).size, visual.imagesReviewed.length);
const finalCaptures = [...world.screenshots, ...sprites.captureArtifacts, ...production.screenshots];
for (const capture of finalCaptures) {
  const reviewed = visual.imagesReviewed.find(item => item.path === capture.path);
  assert.ok(reviewed?.actuallyOpened, `Final capture not actually reviewed: ${capture.path}`);
  assert.equal(reviewed.sha256, capture.sha256); assert.match(reviewed.category, /^final-/);
}
for (const capture of [...before.screenshots, ...intermediate.screenshots, ...corrected.screenshots]) {
  const reviewed = visual.imagesReviewed.find(item => item.path === capture.path);
  assert.ok(reviewed?.actuallyOpened); assert.equal(reviewed.sha256, capture.sha256);
  assert.doesNotMatch(reviewed.category, /^final-/, 'Historical captures cannot count as final-state visual evidence.');
}

const report = {
  passed: true, generatedAt: new Date().toISOString(), baselineCommit: native.baselineCommit,
  scope: 'Eden Prime gains an authored five-sector traversal, scenery, following camera and matching local map/radar. Two existing enemy families gain eight fixed combat drawings; two generated ground textures are integrated. The remaining campaign zones and enemy mechanics are preserved.',
  additions: { expandedCampaignZones: 1, sectors: 5, paths: 3, retainedProgressionPOIs: 7, partialNamedLandmarks: 9,
    generatedPNG: 4, enemyFamilies: 2, fixedCombatPoses: 8, groundTextures: 2, newCanonicalCharacters: 0,
    newEnemyMechanicalKits: 0, newArmourSets: 0, newWeapons: 0, newPilotableVehiclesOrShips: 0 },
  generatedAssets, finalArtFiles: workbookVisual.assetSourceHashes,
  nativeIntegration: { preserved: native.preserved, catalogue: native.catalog,
    geometry: native.geometry, art: native.art, inheritedEquipment: native.inheritedEquipment },
  validation: { nodeTests: unit.tests, compiledModules: build.modules, compiledJavaScriptBundles: build.compiledJavaScriptBundles,
    compiledPNG: build.pngFiles, stableSources: Object.keys(unit.sourceHashes).length,
    navigationRoutes: world.routes.length, actualNativeRendererJourneys: world.journeys.length,
    rendererNavigationCaptures: world.screenshots.length, heldEnemyPoseCases: sprites.cases.length,
    spriteCaptures: sprites.captureArtifacts.length, nativeEnemyEventSequences: sprites.nativeEvents.length,
    closedIdentityContexts: sprites.scopeClosures.length, retainedEnemyFamilyRegressions: sprites.regressions.length,
    publicWalks: production.walks.length, publicPreparedCampaignEncounters: production.encounters.length,
    publicNativeShots: production.nativeOrders.length, publicExports: production.exports.length,
    publicCaptures: production.screenshots.length, publicBrowserLaunches: production.profile.launches,
    publicBrowserShutdowns: production.profile.completeShutdowns, finalViewportImagesActuallyOpened: finalCaptures.length,
    allViewportImagesActuallyOpened: visual.imagesReviewed.length, workbookPanelsActuallyOpened: 35,
    newExecutionForSummary: false },
  geometryQualification: { envelope: { ...native.geometry.bounds, width: 110, depth: 150, rectangularArea: 16500 },
    actualWalkableGround: 'Only the union of five authored room polygons and three widened routes, reduced for actor clearance and scenery collisions. The rectangular envelope is not the actual ground area.',
    originalGeometrySurveyed: false },
  workbook: { deliveries: workbookVisual.deliveries, changedIds: workbook.changedIds,
    changedWorkbookCells: 45, changedTextCells: 35, changedStatusCells: 10, explicitPrototypePromotions: 5,
    assetPrototypePromotions: 5, integratedOrValidatedPromotions: 0, otherEntriesUnchanged: 1374,
    nativeChecks: workbook.nativeChecks, review: workbookVisual.actualVisualReview, limits: workbookVisual.limits },
  historicalEvidence: { sourcePhases: historicalSources, beforeCaptures: before.screenshots.length,
    intermediateReviewPassed: false, intermediateFindings: intermediateVisual.blockingFindings,
    correctedIntermediateCaptures: corrected.screenshots.length, priorPublicCollectorAttempt: priorAttempt,
    priorNativeAuditorAttempt: native.auditHistory.initialAttempt },
  publicProofQualification: { productionBuildOnly: true, fixtureOrigins: production.fixtures.map(item => ({ label: item.label, origin: item.origin })),
    extendedPositionRestore: production.extendedPositionRestore, edenPrecombatRestore: production.edenPrecombatRestore,
    encounterRestores: production.encounters, fullBrowserRestart: production.fullRestart,
    limitations: production.limitations, fullConsoleClean: production.consoleObservations.length === 0,
    consoleObservations: production.consoleObservations, resourceWarnings: production.resourceWarnings,
    consoleQualification: 'Every recorded error-level console message is checked individually; only the historical missing favicon404 is accepted here. A successful journey is not a claim of an empty console.' },
  visualReview: { path: proofs['eden-immersion-visual-review'].path, counts: visual.counts,
    observations: visual.observations, initialReportedFindings: visual.initialReportedFindings,
    acceptance: visual.acceptance, residualFindings: visual.residualFindings, coverageQualifications: visual.coverageQualifications,
    spriteContrastReserve: sprites.manualVisualReview.observations, terrainObservations: terrain.visualObservations },
  limitations: [
    'This is a partial adaptation with sprites and ATB. Original likenesses, costumes, equipment silhouettes, movement cycles and geography are not certified1:1.',
    'Only Eden Prime receives the expanded layout. Nine production landmarks are visual markers, not nine completed original sublevels; the other eight campaign zones keep their prior layouts.',
    'The public keyboard journey naturally walks four initial legs. Freight/beacon and Thérum/Novéria use explicitly prepared valid saves; their preceding victories are not presented as played in Chromium.',
    'Full seven-leg navigation uses actual WorldView updates with an explicitly accelerated render sampling cadence. Held sprite fixtures and native event fixtures are separately declared and do not replace the public journey.',
    'The110×150unit envelope includes nonwalkable scenery. It is not a16,500unit² floor. Terrain motifs may repeat; these opaque RGB textures are not certified seamless or PBR surfaces.',
    'The inherited KO opacity makes down sprites faint against grass, especially the rachni. Source pixels are unchanged; four poses per family do not form complete animation cycles.',
    'The public Noveria encounter retains an inherited foreground beam that occludes some combat bodies. This qualified Eden acceptance does not certify complete arena readability; a separate subsequent fix must have separate evidence.',
    'Workbook previews were opened through the Artifact Tool. Native Microsoft Excel on Windows and a packaged Windows game launch were not executed.',
    'Software WebGL and a390px layout inspection do not establish hardware FPS, physical-phone performance or controller support.',
    'Vercel project linkage or configuration is not evidence of a deployed playable application; this aggregate checks the local production build.',
  ],
  aggregationTool: { path: 'scripts/summarize-eden-immersion.mjs', sha256: await digest('scripts/summarize-eden-immersion.mjs') },
  verifiedFileCount: checkedFiles.size, proofs,
};
await writeFile(new URL('docs/qa/eden-immersion-report.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, proofs: Object.keys(proofs).length, checkedFiles: checkedFiles.size,
  nodeTests: unit.tests, generatedPNG: generatedAssets.length, finalCaptures: finalCaptures.length, workbookPanels: 35 }));
