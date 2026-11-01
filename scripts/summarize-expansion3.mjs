import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url), bytes = path => readFile(new URL(path, root));
const hash = data => createHash('sha256').update(data).digest('hex');
const digest = async path => hash(await bytes(path));
const proofs = {};
async function proof(name, predicate = report => report.passed === true) {
  const path = `docs/qa/${name}.json`, raw = await bytes(path), report = JSON.parse(raw);
  assert.ok(predicate(report), `Proof is not positive: ${path}`);
  proofs[name] = { path, bytes: raw.length, sha256: hash(raw) }; return report;
}
async function sources(values) {
  const entries = Array.isArray(values) ? values.map(item => [item.path, item.sha256]) : Object.entries(values);
  for (const [path, expected] of entries) assert.equal(await digest(path), expected, `Source mismatch: ${path}`);
}

const native = await proof('expansion3-native-report'), unit = await proof('expansion3-unit-report');
const build = await proof('expansion3-build-report'), review = await proof('expansion3-source-review');
const medical = await proof('expansion3-medical-reference-report');
const browser = await proof('expansion3-browser-report'), production = await proof('expansion3-production-report');
const visual = await proof('expansion3-ui-visual-review');
const workbook = await proof('expansion3-workbook-report'), workbookVisual = await proof('expansion3-workbook-visual-report');
await proof('expansion3-workbook-tool-tests');
const attemptPath = 'docs/qa/expansion3-browser-attempt-1-report.json';
const attemptBytes = await bytes(attemptPath), attempt = JSON.parse(attemptBytes);
assert.equal(attempt.passed, false); assert.match(attempt.failure.message, /mobile\/armor: no split words/);
for (const [original, archived] of [['src/expansion-ui.js', attempt.archive.uiSnapshot],
  ['scripts/expansion3-browser.mjs', attempt.archive.runnerSnapshot]]) {
  assert.equal(await digest(archived), attempt.sources.find(source => source.path === original).sha256);
}
for (const capture of attempt.captureArtifacts) assert.equal(await digest(capture.path), capture.sha256);
for (const report of [native, unit, build, review]) await sources(report.sourceHashes);
for (const report of [browser, production]) {
  await sources(report.sources);
  for (const capture of report.captureArtifacts) assert.equal(await digest(capture.path), capture.sha256);
  assert.equal(report.cards.length, 122); assert.equal(report.cards.filter(card => !card.executable).length, 84);
  assert.equal(report.benches.length, 2); assert.equal(report.weapons.length, 18); assert.equal(report.enemies.length, 15);
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []);
  assert.deepEqual(report.storageBefore, report.storageAfter);
}
assert.deepEqual(production.cards, browser.cards, 'Public card results agree in dev and dist');
assert.deepEqual(production.trials, browser.trials, 'Seeded public results agree in dev and dist');
assert.deepEqual(production.benches, browser.benches);
assert.equal(visual.reviewComplete, true);
const captures = [...browser.captureArtifacts, ...production.captureArtifacts];
assert.equal(captures.length, 38); assert.equal(visual.imagesReviewed.length, 38);
assert.deepEqual(visual.imagesReviewed.map(image => image.path).sort(), captures.map(image => image.path).sort());
for (const image of visual.imagesReviewed) {
  assert.equal(image.actuallyOpened, true); assert.equal(await digest(image.path), image.sha256);
}
for (const input of visual.inputReports) assert.equal(await digest(input.path), input.sha256);
for (const [path, expected] of Object.entries(native.preserved)) assert.equal(await digest(path), expected);
for (const artifact of build.artifacts) assert.equal(await digest(artifact.path), artifact.sha256);
assert.equal(native.cards.length, 122); assert.equal(native.nativeTrials, 38); assert.equal(native.replayedTrials, 38);
assert.equal(native.consultationOnly, 84); assert.equal(native.previousTrialReplays.length, 242);
assert.equal(native.previousClosureChecks.length, 134); assert.ok(native.previousTrialReplays.every(row => row.exact));
assert.equal(Object.keys(native.preserved).length, 1301);
assert.equal(review.newStudyIdentities, 122); assert.equal(review.overlapWithPrevious376, 0);
assert.equal(unit.tests, 745); assert.equal(unit.failedTests, 0); assert.equal(unit.skippedTests, 0);
assert.equal(build.modules, 76);
assert.equal(medical.references.length, 2);
for (const reference of medical.references) {
  assert.equal(reference.httpStatus, 200); assert.equal(reference.primaryPageActuallyOpened, true);
  assert.equal(await digest(reference.openedImagePath), reference.openedImageSha256);
}
assert.equal(workbook.rows, 122); assert.equal(workbook.cellsCompared, 2562); assert.equal(workbook.draft, false);
assert.equal(workbook.newCanonicalFacts, 0); assert.equal(workbook.historicalFilesUnchanged, true);
assert.equal(workbookVisual.workbook.sha256, workbook.xlsxSha256);
assert.equal(workbookVisual.panelsActuallyOpened, 21); assert.equal(workbookVisual.images.length, 21);
const workbookPath = 'docs/Expansion3_Simulations.xlsx'; assert.equal(await digest(workbookPath), workbook.xlsxSha256);
for (const image of workbookVisual.images) {
  assert.equal(image.actuallyOpened, true); assert.equal(await digest(image.path), image.sha256);
}
for (const evidence of workbookVisual.currentProofs) assert.equal(await digest(evidence.path), evidence.sha256);
for (const [path, expected] of Object.entries(workbookVisual.artifactDigests)) assert.equal(await digest(path), expected);

const report = {
  passed: true, generatedAt: new Date().toISOString(), baseline: native.baseline,
  scope: 'Third disjoint study selection: 122 contextual dossiers with 38 executable partial exercises and 84 consultations. Two opt-in native medical commands add actual finite-resource revival experiments, with independently inspected primary manual pages. There are no new armour models, fleet hulls, source statistics, images or complete original missions.',
  groups: native.groups,
  additions: { references: 122, executable: 38, consultationOnly: 84,
    actorOccurrences: 40, executableActorStudies: 3, conventionalWeaponDossiers: 18,
    weaponConsultations: 22, enemyDossiers: 40, executableEnemyStudies: 15,
    medicalPowerReferences: 2, newNativeMedicalCommands: 2,
    namedArmorSetsAdded: 0, fleetDossiersAdded: 0, newImages: 0, newCanonicalFacts: 0,
    previouslyDefinedWithNewPartialStudy: native.previouslyDefinedWithNewStudy, historicalStatusPromotions: 0 },
  cumulative: { studyReferences: 498, executablePartialExercises: 280, consultations: 218,
    originalRegistryRecords: 6708, originalRegistrySources: 454 },
  validation: { nodeTests: unit.tests, nativeNewTrials: 38, exactNewReplays: 38,
    exactPriorOutcomeComparisons: 242, priorConsultationsStillClosed: 134,
    protectedHistoricalFiles: Object.keys(native.preserved).length,
    nativeGateChecks: native.checks,
    developmentChecks: browser.checks.length, developmentTrials: browser.trials.length,
    productionChecks: production.checks.length, productionTrials: production.trials.length,
    publicNewDossiersVerifiedPerMode: 122, productionServedJavaScript: production.servedBundles.length,
    productionServedPNG: production.servedPNGs.length, productionServedCSS: production.servedCSS.length,
    actualUICaptures: browser.captureArtifacts.length + production.captureArtifacts.length,
    uiVisualReview: proofs['expansion3-ui-visual-review'].path,
    compiledModules: build.modules, compiledJavaScript: build.compiledJavaScriptBundles, compiledPNG: build.pngFiles,
    workbookComparedCells: workbook.cellsCompared, workbookPanelsActuallyOpened: workbookVisual.panelsActuallyOpened },
  workbook: { path: workbookPath, sha256: workbook.xlsxSha256, rows: 122, sheets: 5,
    simulationStatuses: { Prototype: 38, 'Défini': 84 }, originalCatalogStatusesSeparate: true },
  resolvedIssues: [{ issue: 'Medical table headers split words on a 390px viewport.',
    correction: 'Result table header groups preserve whole words and use the existing local horizontal scroll.',
    failedAttempt: { path: attemptPath, sha256: hash(attemptBytes), acceptanceProof: false },
    finalVerification: 'The complete unchanged public workflow passes in development and production, including whole-word mobile header checks and left/right captures.' }],
  limitations: [
    'A study dossier, native primitive, equipment acquisition, complete campaign and full visual asset are distinct deliverables.',
    'Only the medical principle is newly verified against primary pages. A single shared dose, group revival, 30 percent health, ATB and other numerical fixtures remain adaptations.',
    'No trained medical action is granted to any existing ME1 or Chronicle actor; no dose, narrative death, saved party or campaign inventory is changed.',
    'Five ME2 DLC units and the Brooks NPC study require a prepared Legendary profile. The separate Brooks encounter dossier remains closed.',
    'Unprepared packs, special boss phases, conditional allegiances and insufficiently identified wildlife remain consultations.',
    'Inherited secondary links may be generic or indirect. This delivery does not certify complete original kits, models, animations, sounds or 1:1 fidelity.',
  ], proofs,
};
await writeFile(new URL('docs/qa/expansion3-report.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, proofs: Object.keys(proofs).length, cards: 122, executable: 38,
  cumulativeCards: 498, nodeTests: unit.tests, workbookCells: workbook.cellsCompared,
  previousOutcomesIdentical: 242, protectedFiles: Object.keys(native.preserved).length }));
