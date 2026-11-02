import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url), bytes = path => readFile(new URL(path, root));
const hash = data => createHash('sha256').update(data).digest('hex'), digest = async path => hash(await bytes(path));
const proofs = {};
async function proof(name, positive = report => report.passed === true) {
  const path = `docs/qa/${name}.json`, raw = await bytes(path), report = JSON.parse(raw);
  assert.ok(positive(report), `Proof is not accepted: ${path}`);
  proofs[name] = { path, bytes: raw.length, sha256: hash(raw) }; return report;
}
async function sources(value = {}) {
  const pairs = Array.isArray(value) ? value.map(item => [item.path, item.sha256]) : Object.entries(value);
  for (const [path, sha256] of pairs) assert.equal(await digest(path), sha256, `Source changed: ${path}`);
}
async function artifacts(items = []) {
  for (const item of items) assert.equal(await digest(item.path), item.sha256, `Artifact changed: ${item.path}`);
}
const art = await proof('me1-enemy-poses-art-report'), native = await proof('me1-enemy-poses-native-report');
const unit = await proof('me1-enemy-poses-unit-report'), build = await proof('me1-enemy-poses-build-report');
const world = await proof('me1-enemy-poses-world-report'), production = await proof('me1-enemy-poses-production-report');
const weapons = await proof('me3-legendary-weapons-native-report'), weaponBrowser = await proof('me3-legendary-weapons-browser-report');
const workbook = await proof('me1-enemy-poses-workbook-preservation', report => report.ok === true);
const bookVisual = await proof('me1-enemy-poses-workbook-visual-report');
await proof('me1-enemy-poses-native-art-review');
for (const report of [art, native, unit, build, world, weapons]) await sources(report.sourceHashes);
await sources(native.preserved); await sources(production.sources); await sources(weaponBrowser.sources);
await sources(weaponBrowser.distSnapshot); await artifacts(build.artifacts);
for (const [path, artifact] of Object.entries(production.buildFiles)) assert.equal(await digest(`dist/${path}`), artifact.sha256);
await artifacts(world.captureArtifacts); await artifacts(production.screenshots); await artifacts(weaponBrowser.captures);
assert.equal(art.assets.length, 5); assert.equal(art.assets.reduce((sum, asset) => sum + asset.frames.length, 0), 18);
assert.ok(art.assets.every(asset => asset.nativeCopyVerified && asset.actuallyOpened));
assert.equal(native.catalogue.otherEntriesUnchanged, 1377); assert.equal(native.catalogue.explicitPrototypePromotions, 5);
assert.equal(native.historicalPNG.length, 22); assert.equal(native.families.length, 5);
assert.equal(unit.tests, 785); assert.equal(unit.passedTests, 785); assert.equal(unit.failedTests, 0); assert.equal(unit.skippedTests, 0);
await artifacts([unit.output, build.output]);
if (unit.collectionProvenance) {
  await artifacts([unit.collectionProvenance.rawReport, unit.collectionProvenance.rawOutput, unit.collectionProvenance.parser]);
  assert.equal(unit.collectionProvenance.newTestRunForSummary, false);
  const rawUnit = JSON.parse(await bytes(unit.collectionProvenance.rawReport.path)); assert.equal(rawUnit.exitCode, 0);
  const output = (await bytes(unit.collectionProvenance.rawOutput.path)).toString();
  assert.match(output, /^(?:#|ℹ) tests 785$/m); assert.match(output, /^(?:#|ℹ) pass 785$/m);
}
assert.equal(build.modules, 79); assert.equal(build.compiledJavaScriptBundles, 9); assert.equal(build.pngFiles, 27);
assert.equal(world.cases.length, 16); assert.equal(world.nativeEvents.length, 4); assert.equal(world.scopeClosures.length, 6);
assert.equal(world.joker.length, 2); assert.equal(world.regressions.length, 3); assert.equal(world.captureArtifacts.length, 21);
assert.equal(world.applicationPreserved, true); assert.equal(world.proofKind, 'explicit-composite-renderer-proof');
assert.equal(world.strictFullRunPassed, false); assert.equal(world.newFullRunPerformedForSummary, false);
assert.deepEqual(world.errors, []); assert.deepEqual(world.failedRequests, []); assert.deepEqual(world.assetErrors, []);
assert.equal(world.proofs.length, 3);
for (const input of world.proofs) { await artifacts([input, input.runner]); }
const rawWorld = JSON.parse(await bytes(world.proofs[0].path));
assert.equal(rawWorld.passed, false); assert.equal(rawWorld.cases.length, 16); assert.ok(rawWorld.failure);
for (const input of world.proofs.slice(1)) assert.equal(JSON.parse(await bytes(input.path)).passed, true);
assert.equal(production.encounters.length, 3); assert.equal(production.nativeOrders.length, 3);
assert.ok(production.encounters.every(item => item.actualPrecombatReload && item.saveExactExceptElapsedTime && item.noVictoryRewardClaimed));
assert.deepEqual([...new Set(production.encounters.flatMap(item => item.spriteKeys))].sort(), ['geth', 'geth-destroyer', 'geth-sniper', 'husk']);
assert.equal(production.joker.actualConversation, true); assert.equal(production.joker.exactSaveAfterPageReload, true);
assert.equal(production.fullRestart.exactPublicUI, true); assert.equal(production.fullRestart.noPostRestartDownloadAttempted, true);
assert.equal(production.profile.launches, 2); assert.equal(production.profile.completeShutdowns, 2);
for (const key of ['errors', 'failedRequests', 'sourceRequests', 'responseEvidenceErrors']) assert.deepEqual(production[key], []);
assert.equal(weapons.equipmentAfter.supported, 107); assert.equal(weapons.equipmentAfter.weapons, 79);
assert.equal(weapons.newNativePreparations.length, 2); assert.equal(weapons.defaultScenarioReplays.length, 25);
assert.equal(weapons.previousTrialReplays.length, 280); assert.equal(weapons.previousClosures.length, 218);
assert.equal(weaponBrowser.preparations.length, 2); assert.equal(weaponBrowser.standardRefusals.length, 2);
assert.deepEqual(weaponBrowser.witnessAfter, weaponBrowser.witnessBefore);
assert.deepEqual(weaponBrowser.errors, []); assert.deepEqual(weaponBrowser.failedRequests, []);
for (const entry of [...weaponBrowser.consoleErrors, ...production.consoleObservations]) {
  assert.ok(entry.location.url.endsWith('/favicon.ico'));
  assert.equal(entry.text, 'Failed to load resource: the server responded with a status of 404 (Not Found)');
}
assert.equal(workbook.changedIds.length, 5); assert.equal(workbook.changedWorkbookCells, 33); assert.equal(workbook.changedTextCells, 24);
assert.equal(workbook.changedStatusCells, 9); assert.equal(workbook.changedMetadataFields, 10); assert.equal(workbook.unchangedEntries, 1377);
assert.equal(await digest('docs/Mass_Effect_Relay_Chronicles_Production.xlsx'), workbook.sha256);
assert.equal(bookVisual.panelsActuallyOpened, 22); assert.equal(bookVisual.catalogueStatusPromotions, 5);
assert.equal(bookVisual.assetStatusPromotions, 4); assert.ok(bookVisual.images.every(image => image.actuallyOpened));
await artifacts(bookVisual.images); await sources(bookVisual.currentDeliveries);
await sources(bookVisual.assetSourceHashes); await sources(bookVisual.artifactDigests); await artifacts([bookVisual.integrationGate]);
assert.equal(bookVisual.integrationGate.worldSha256, world.sourceHashes['src/world.js']);
const visual = await proof('me1-enemy-poses-ui-visual-review');
assert.equal(visual.reviewComplete, true); assert.ok(visual.imagesReviewed.every(image => image.actuallyOpened));
const actualCaptures = [...world.captureArtifacts, ...production.screenshots];
assert.deepEqual(visual.imagesReviewed.map(image => image.path).sort(), actualCaptures.map(image => image.path).sort());
await artifacts(visual.imagesReviewed); await artifacts(visual.inputReports);
const report = { passed: true, generatedAt: new Date().toISOString(), baseline: native.baseline,
  scope: 'Four existing ME1 enemy families gain16 fixed poses; Joker gains two seated drawings with idle integrated at Normandy. Two existing ME3 DLC weapon profiles gain explicit Legendary-workshop access. Five existing SPR records become Prototype. No new canonical character, enemy kit, armour, vehicle or ship is counted.',
  additions: { nativeGeneratedPNG: 5, enemyFamilies: 4, fixedEnemyCombatPoses: 16, seatedDrawings: 2,
    runtimeSeatedStates: ['idle'], newCanonicalCharacters: 0, newEnemyMechanicalKits: 0, newArmourSets: 0,
    newPilotableHulls: 0, newlyPermittedME3LegendaryPreparations: 2, supportedEquipment: 107, supportedWeapons: 79,
    manifestCombatKeyPoses: 48, preservedHistoricalPNG: 22 },
  validation: { nodeTests: unit.tests, compiledModules: build.modules, compiledJavaScript: 9, compiledPNG: 27,
    protectedBaselineFiles: Object.keys(native.preserved).length, rendererCases: 16, rendererCaptures: world.captureArtifacts.length,
    publicEncounters: production.encounters.length, publicNativeShots: production.nativeOrders.length,
    publicActualExports: production.exports.length, publicBrowserLaunches: production.profile.launches,
    publicBrowserShutdowns: production.profile.completeShutdowns, publicCaptures: production.screenshots.length,
    uiImagesActuallyReviewed: visual.imagesReviewed.length, weaponPreparationsRestored: weaponBrowser.preparations.length,
    oldSimulationOutcomesExact: 280, oldSimulationConsultationsClosed: 218, oldDefaultScenarioOutcomesExact: 25,
    workbookComparedCells: workbook.nativeChecks.catalogueCells, workbookPanelsActuallyOpened: 22 },
  workbook: { path: 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx', sha256: workbook.sha256,
    changedSpriteIds: workbook.changedIds, changedWorkbookCells: 33, explicitPrototypePromotions: 5,
    otherEntriesUnchanged: 1377, nativeChecks: workbook.nativeChecks, formatQualification: bookVisual.formatQualification },
  rendererProofQualification: { kind: world.proofKind, strictFullRunPassed: false, originalFailurePreserved: true,
    fullRunRepeatedForSummary: false, phaseMethods: world.phaseMethods, limitations: world.limitations },
  unitCollectionQualification: unit.collectionProvenance || null,
  productionLimitations: production.limitations, weaponLimitations: weapons.limitations,
  productionConsoleReserve: { fullConsoleClean: production.consoleObservations.length === 0,
    consoleObservations: production.consoleObservations, resourceWarnings: production.resourceWarnings },
  weaponBrowserConsoleReserve: { fullConsoleClean: weaponBrowser.fullConsoleClean,
    consoleObservations: weaponBrowser.consoleErrors, nonBlockingFindings: weaponBrowser.nonBlockingFindings },
  visualObservations: visual.observations,
  limitations: ['The primary references inspected supply partial named busts and seated posture; complete original silhouettes, equipment, uniforms and likeness are not certified1:1.',
    'Four single combat poses per enemy do not supply motion cycles or extra directions. Generic illustrated weapons never grant a new attack or equipment.',
    'Only Joker idle is integrated at the cockpit. Pilot is a produced drawing inspected through an explicit fixture, not a second timed gameplay state.',
    'The public journey declares prepared saves and checks actual commands/reloads; it does not play through every previous encounter or certify all16 states from ordinary gameplay alone.',
    'Legacy meta.prototypeCoverage summary text remains as in the baseline; current entry statuses and equipment tallies are measured separately in these proofs.',
    'Weapon edition evidence combines collective EA DLC inclusion with the inherited model-to-extension associations. Purchases, unlocks and individual original statistics remain unreconstructed.',
    'Native low-alpha fringes remain in the generated files. Visible-pixel framing uses the renderer alpha-test threshold without pixel cleanup.',
    'Software-WebGL observations and CI packaging do not establish hardware FPS or a native Windows launch.'],
  aggregationTool: { path: 'scripts/summarize-me1-enemy-poses.mjs', sha256: await digest('scripts/summarize-me1-enemy-poses.mjs') }, proofs };
await writeFile(new URL('docs/qa/me1-enemy-poses-report.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, proofs: Object.keys(proofs).length, nodeTests: 785, newPNG: 5,
  enemyPoses: 16, seatedDrawings: 2, newlyPermittedME3Weapons: 2, protectedBaselineFiles: Object.keys(native.preserved).length }));
