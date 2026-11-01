import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url), bytes = path => readFile(new URL(path, root));
const hash = value => createHash('sha256').update(value).digest('hex');
const digest = async path => hash(await bytes(path));
const proofs = {};
async function proof(name, positive = report => report.passed === true) {
  const path = `docs/qa/${name}.json`, raw = await bytes(path), report = JSON.parse(raw);
  assert.ok(positive(report), `Proof is not positive: ${path}`);
  proofs[name] = { path, sha256: hash(raw), bytes: raw.length }; return report;
}
async function sources(value = {}) {
  const entries = Array.isArray(value) ? value.map(item => [item.path, item.sha256]) : Object.entries(value);
  for (const [path, expected] of entries) assert.equal(await digest(path), expected, `Source changed: ${path}`);
}
async function captures(items) {
  for (const item of items) assert.equal(await digest(item.path), item.sha256, `Capture changed: ${item.path}`);
}

const art = await proof('companion-combat-art-report'), native = await proof('companion-combat-native-report');
const unit = await proof('companion-combat-unit-report'), build = await proof('companion-combat-build-report');
const world = await proof('companion-combat-world-report'), production = await proof('companion-combat-production-report');
const weapons = await proof('legendary-weapon-access-native-report'), weaponBrowser = await proof('legendary-weapon-access-browser-report');
const workbook = await proof('companion-combat-workbook-preservation', report => report.ok === true);
const workbookVisual = await proof('companion-combat-workbook-visual-report');
const visual = await proof('companion-combat-ui-visual-review');
const texture = await proof('companion-combat-texture-update-report');
await proof('companion-combat-native-art-review');

for (const report of [art, native, unit, build, world, weapons]) await sources(report.sourceHashes);
await sources(texture.sourceHashes);
await sources(production.sources); await sources(weaponBrowser.sources);
await sources(weaponBrowser.distSnapshot);
for (const [path, expected] of Object.entries(native.preserved)) assert.equal(await digest(path), expected, path);
for (const artifact of build.artifacts) assert.equal(await digest(artifact.path), artifact.sha256);
for (const [path, file] of Object.entries(production.buildFiles)) assert.equal(await digest(`dist/${path}`), file.sha256);
await captures(world.captureArtifacts); await captures(production.screenshots); await captures(weaponBrowser.captures);
assert.equal(art.assets.length, 6); assert.ok(art.assets.every(asset => asset.nativeCopyVerified && asset.actuallyOpened));
assert.equal(art.assets.reduce((sum, asset) => sum + asset.frames.length, 0), 24);
assert.equal(native.families.length, 6); assert.equal(native.catalogue.changedSpriteIds.length, 6);
assert.equal(native.catalogue.otherEntriesUnchanged, 1376); assert.equal(native.catalogue.statusPromotions, 0);
assert.equal(native.previousTrialReplays.length, 280); assert.equal(native.previousClosures.length, 218);
assert.equal(unit.tests, 766); assert.equal(unit.failedTests, 0); assert.equal(unit.skippedTests, 0);
assert.equal(build.modules, 77); assert.equal(build.pngFiles, 22); assert.equal(build.compiledJavaScriptBundles, 9);
assert.equal(world.cases.length, 24); assert.equal(world.captureArtifacts.length, 15);
assert.equal(world.applicationPreserved, true); assert.deepEqual(world.assetErrors, []);
assert.deepEqual(world.errors, []); assert.deepEqual(world.failedRequests, []);
assert.equal(production.squads.length, 3);
assert.ok(production.nativeOrders.length >= 6);
for (const id of ['ashley', 'kaidan', 'garrus', 'tali', 'wrex', 'liara'])
  assert.ok(production.nativeOrders.some(order => order.actorId === id && order.actionId === 'shoot'
    && order.nativeActivation && order.atbBefore >= 99.999 && order.atbAfter === 0), `Missing actual public companion shot: ${id}`);
assert.ok(production.profile.completeShutdowns >= 1 && production.profile.launches >= 2);
assert.deepEqual(production.sourceRequests, []); assert.deepEqual(production.errors, []);
assert.deepEqual(production.failedRequests, []); assert.deepEqual(production.responseEvidenceErrors, []);
assert.equal(weapons.equipmentAfter.supported, 105); assert.equal(weapons.equipmentAfter.weapons, 77);
assert.equal(weapons.newNativePreparations.length, 5); assert.equal(weapons.defaultScenarioReplays.length, 25);
assert.equal(weapons.previousTrialReplays.length, 280); assert.equal(weapons.previousClosureChecks.length, 218);
assert.equal(weaponBrowser.standardRefusals.length, 5); assert.equal(weaponBrowser.preparations.length, 5);
assert.deepEqual(weaponBrowser.failedRequests, []);
// Accept the actual functional observations with their explicit console reserve.
// The strict run remains failed; a later diagnostic is never a clean rerun.
assert.equal(weaponBrowser.proofKind, 'explicit-composite-functional-proof');
assert.equal(weaponBrowser.strictFullRunPassed, false); assert.equal(weaponBrowser.fullConsoleClean, false);
assert.equal(weaponBrowser.newFullRunPerformedForSummary, false);
assert.equal(weaponBrowser.functionalAcceptance.passed, true);
for (const key of ['newPreparedCases', 'actualPageReloads', 'actualPublicShots', 'actualPublicReloadOrders'])
  assert.equal(weaponBrowser.functionalAcceptance[key], 5);
for (const item of weaponBrowser.proofs) {
  assert.equal(await digest(item.path), item.sha256, `Weapon proof changed: ${item.path}`);
  if (item.runner) assert.equal(await digest(item.runner.path), item.runner.sha256);
}
const rawWeaponRun = JSON.parse(await bytes(weaponBrowser.proofs[0].path));
const favicon = JSON.parse(await bytes(weaponBrowser.proofs[1].path));
assert.equal(rawWeaponRun.passed, false);
for (const key of ['preparations', 'standardRefusals', 'foreignContextChecks', 'witnessBefore', 'witnessAfter',
  'captures', 'servedResources', 'errors', 'consoleErrors', 'mobileLayout'])
  assert.deepEqual(weaponBrowser[key], rawWeaponRun[key], `Composite changed raw observations: ${key}`);
assert.equal(rawWeaponRun.checks.length, 5); assert.equal(rawWeaponRun.errors.length, 1);
assert.match(rawWeaponRun.errors[0], /AssertionError.*Expected values to be strictly deep-equal/s);
assert.equal(rawWeaponRun.consoleErrors.length, 7);
assert.ok(rawWeaponRun.consoleErrors.every(error => error === 'Failed to load resource: the server responded with a status of 404 (Not Found)'));
assert.deepEqual(weaponBrowser.strictRunnerFailure.errors, rawWeaponRun.errors);
assert.deepEqual(favicon.pageErrors, []); assert.deepEqual(favicon.requests, []);
assert.equal(favicon.directFavicon.status, 404); assert.ok(favicon.directFavicon.url.endsWith('/favicon.ico'));
assert.ok(favicon.console.some(entry => entry.text === rawWeaponRun.consoleErrors[0]
  && entry.location.url === favicon.directFavicon.url));
assert.ok(favicon.network.some(entry => entry.status === 404 && entry.url === favicon.directFavicon.url));
assert.equal(weaponBrowser.nonBlockingFindings[0].kind, 'missing-implicit-favicon');
assert.deepEqual(weaponBrowser.witnessAfter, weaponBrowser.witnessBefore);
assert.equal(workbook.changedIds.length, 6); assert.equal(workbook.changedTextCells, 24);
assert.equal(workbook.changedMetadataFields, 12); assert.equal(workbook.unchangedEntries, 1376);
const workbookPath = 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx';
assert.equal(await digest(workbookPath), workbook.sha256);
assert.equal(workbookVisual.panelsActuallyOpened, 24); assert.equal(workbookVisual.catalogueStatusPromotions, 0);
await captures(workbookVisual.images);
assert.ok(workbookVisual.images.every(image => image.actuallyOpened));
await sources(workbookVisual.assetSourceHashes); await sources(workbookVisual.artifactDigests);
await sources(workbookVisual.currentDeliveries);
assert.equal(visual.reviewComplete, true);
const actualCaptures = [...world.captureArtifacts, ...production.screenshots];
assert.deepEqual(visual.imagesReviewed.map(image => image.path).sort(), actualCaptures.map(image => image.path).sort());
await captures(visual.imagesReviewed); assert.ok(visual.imagesReviewed.every(image => image.actuallyOpened));
for (const input of visual.inputReports) assert.equal(await digest(input.path), input.sha256);

const report = { passed: true, generatedAt: new Date().toISOString(), baseline: native.baseline,
  scope: 'Six existing ME1 companions gain 24 fixed key-pose drawings and actual renderer integration. Five existing ME2 weapon models gain explicit, source-qualified Legendary workshop preparation. This delivery adds no canonical identity, complete armour variant, pilotable hull or full original-game reconstruction.',
  additions: { existingCompanionFamilies: 6, fixedCombatKeyPoses: 24, nativeGeneratedPNG: 6,
    newCanonicalCharacters: 0, newNamedArmorSets: 0, newFleetHulls: 0,
    newlyPermittedLegendaryWeaponPreparations: 5, supportedEquipment: 105, supportedWeapons: 77,
    manifestCombatKeyPoses: 32, preservedHistoricalPNG: 16 },
  validation: { nodeTests: 766, compiledModules: 77, compiledJavaScript: 9, compiledPNG: 22,
    oldSimulationResultsExact: 280, oldSimulationConsultationsClosed: 218,
    oldDefaultScenarioResultsExact: 25, preservedHistoricalFiles: Object.keys(native.preserved).length,
    isolatedRendererCases: 24, isolatedRendererCaptures: world.captureArtifacts.length,
    publicSquadJourneys: production.squads.length, publicNativeOrders: production.nativeOrders.length,
    publicExports: production.exports.length, publicBrowserLaunches: production.profile.launches,
    publicBrowserShutdowns: production.profile.completeShutdowns, publicCaptures: production.screenshots.length,
    weaponPreparationsRestored: weaponBrowser.preparations.length,
    uiImagesActuallyReviewed: visual.imagesReviewed.length,
    textureUpdateProof: proofs['companion-combat-texture-update-report'].path,
    workbookComparedCells: workbook.nativeChecks.catalogueCells, workbookPanelsActuallyOpened: 24 },
  workbook: { path: workbookPath, sha256: workbook.sha256, changedSpriteIds: workbook.changedIds,
    changedTextCells: 24, changedMetadataFields: 12, unchangedOtherEntries: 1376,
    catalogueStatusPromotions: 0, assetStatusPromotions: 0, nativeChecks: workbook.nativeChecks,
    formatQualification: 'Active conditional formats are preserved. Artifact Tool retains 130 additional unused differential-style definitions; the native verification distinguishes effective styles from unused definitions.' },
  productionLimitations: production.limitations,
  weaponBrowserLimitations: weaponBrowser.limitations,
  weaponBrowserConsoleReserve: { strictFullRunPassed: false, fullConsoleClean: false,
    acceptedFunctionalCases: 5, nonBlockingFindings: weaponBrowser.nonBlockingFindings,
    rawErrorsPreserved: true, separatelyDiagnosed: true, fullRunRepeatedForSummary: false },
  limitations: ['Generated drawings preserve the existing prototype art direction; no complete primary original-game likeness or costume verification is certified.',
    'Each companion has four fixed poses at one combat angle. Full motion cycles, extra directions, exact loadout silhouettes, weapon variants and transitions remain incomplete.',
    'Native low-alpha fringes remain documented. Visible silhouette checks use the renderer alpha-test threshold; no pixels were rewritten.',
    'The isolated WorldView fixture deliberately holds states. The public production journey uses declared prepared saves and genuine UI commands; it does not play through recruitment or certify all24 poses by ordinary combat alone.',
    'EA evidence concerns collective DLC inclusion and integration; numerical profiles remain existing ATB budgets. Purchases, ranks, mission acquisition and per-model original statistics are not simulated.',
    'The Collector rifle, specialization-dependent ME2 models and unrelated editions remain closed.',
    'Existing Simulation definitions remain versioned; five inherited refusal texts change with the newly configured edition requirement while their consultations stay closed.',
    'Software WebGL and CI builds do not establish real-device performance or native Windows execution.'],
  aggregationTool: { path: 'scripts/summarize-companion-combat.mjs', sha256: await digest('scripts/summarize-companion-combat.mjs') }, proofs };
await writeFile(new URL('docs/qa/companion-combat-report.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, proofs: Object.keys(proofs).length, companions: 6, keyPoses: 24,
  legendaryWeapons: 5, nodeTests: 766, workbookCells: workbook.nativeChecks.catalogueCells,
  oldResultsExact: 280, preservedFiles: Object.keys(native.preserved).length }));
