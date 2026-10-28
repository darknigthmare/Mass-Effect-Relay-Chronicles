import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { EXPANSION2_ENTRIES, EXPANSION_ENTRIES, EXPANSION_ALL_ENTRIES,
  canRunExpansionEntry, runExpansionTrial } from '../src/expansion.js';
import { UNIVERSE_WORKS, UNIVERSE_SUMMARY } from '../src/universe-data.js';
import { canAccessContent } from '../src/continuity.js';

const root = new URL('../', import.meta.url), file = path => readFile(new URL(path, root));
const hash = data => createHash('sha256').update(data).digest('hex');
const baseline = JSON.parse(await file('docs/qa/expansion2-baseline.json'));
const previous = JSON.parse(await file('docs/qa/expansion-native-report.json'));
const contexts = UNIVERSE_WORKS.flatMap(work => work.periods.map(period => ({ mediaId: work.id, periodId: period.id })));
const report = { passed: false, generatedAt: new Date().toISOString(), baseline: baseline.baselineCommit,
  scope: 'Second disjoint selection with actual available stock: 176 contextual study cards, 97 executable partial exercises and 79 consultations. Numerical/resource fixtures are adaptations. There are no new canonical facts, named armor sets, complete original kits, source missions or 1:1 art certification.',
  sourceHashes: {}, cards: [], groups: [], nativeTrials: 0, replayedTrials: 0, runnable: 0,
  consultationOnly: 0, previouslyDefinedWithNewStudy: 0, preserved: {}, previousTrialReplays: [], errors: [],
  registry: UNIVERSE_SUMMARY };
try {
  const paths = ['src/expansion.js', 'src/expansion-bench.js', 'src/expansion-ui.js', 'src/main.js', 'src/universe-ui.js', 'src/universe-ui.css',
    ...['characters', 'armor', 'weapons', 'fleet', 'enemies'].map(name => `src/expansion2-${name}.js`),
    'src/combat.js', 'src/tool-data.js', 'src/universe-equipment.js', 'src/universe-data.js', 'src/continuity.js', 'src/continuity-data.js'];
  for (const path of paths) report.sourceHashes[path] = hash(await file(path));
  assert.equal(EXPANSION_ENTRIES.length, 200); assert.equal(EXPANSION2_ENTRIES.length, 176);
  assert.equal(new Set(EXPANSION_ALL_ENTRIES.map(entry => entry.id)).size, 376);
  const before = JSON.stringify(EXPANSION_ALL_ENTRIES);
  for (const entry of EXPANSION2_ENTRIES) {
    const validContexts = contexts.filter(context => canAccessContent(entry.id, context).ok);
    assert.ok(validContexts.length, entry.id); assert.equal(entry.identitySourceVerified, true);
    const context = validContexts[0], options = { seed: 17, difficulty: 'normal', edition: entry.constraints?.editionProfile || 'standard' };
    const access = canRunExpansionEntry(entry.id, context, options), trial = runExpansionTrial(entry.id, context, options);
    assert.equal(trial.ok, access.ok, entry.id);
    const row = { id: entry.id, mode: entry.mode, name: entry.record.name, role: entry.role,
      originalStatus: entry.record.status, sourceIds: entry.sourceIds, catalogPath: entry.record.provenance.catalogPath,
      availability: entry.availability, testedContext: context, testedOptions: options,
      executable: access.ok, blockedReason: access.reason, bench: entry.bench || null };
    if (trial.ok) {
      report.nativeTrials++; report.runnable++;
      assert.deepEqual(trial, runExpansionTrial(entry.id, context, options), entry.id); report.replayedTrials++;
      if (entry.record.status === 'Défini') report.previouslyDefinedWithNewStudy++;
      row.result = trial.result; row.control = trial.control;
      assert.equal(Object.hasOwn(trial, 'reward'), false);
    } else { report.consultationOnly++; assert.ok(access.reason); }
    const foreign = contexts.find(candidate => candidate.mediaId !== context.mediaId);
    assert.equal(runExpansionTrial(entry.id, foreign, options).ok, false, entry.id);
    report.cards.push(row);
  }
  for (const mode of ['actor', 'armor', 'weapon', 'fleet', 'enemy']) report.groups.push({ id: mode,
    cards: report.cards.filter(card => card.mode === mode).length,
    runnable: report.cards.filter(card => card.mode === mode && card.executable).length,
    consultationOnly: report.cards.filter(card => card.mode === mode && !card.executable).length });
  assert.equal(report.nativeTrials, 97); assert.equal(report.consultationOnly, 79);
  assert.equal(report.previouslyDefinedWithNewStudy, 52);
  for (const card of previous.cards) {
    const trial = runExpansionTrial(card.id, card.testedContext, card.testedOptions);
    assert.equal(trial.ok, card.executable, card.id);
    if (trial.ok) {
      assert.deepEqual(trial.result, card.result, card.id); assert.deepEqual(trial.control, card.control, card.id);
      report.previousTrialReplays.push({ id: card.id, exact: true, resultSha256: hash(JSON.stringify([trial.result, trial.control])) });
    }
  }
  assert.equal(report.previousTrialReplays.length, 145);
  assert.equal(JSON.stringify(EXPANSION_ALL_ENTRIES), before);
  for (const [path, expected] of Object.entries({ ...previous.preserved, ...baseline.digests })) {
    assert.equal(hash(await file(path)), expected, `Historical file changed: ${path}`); report.preserved[path] = expected;
  }
  report.passed = true;
} catch (error) { report.errors.push(error.stack || String(error)); }
await writeFile(new URL('docs/qa/expansion2-native-report.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, cards: report.cards.length, groups: report.groups,
  nativeTrials: report.nativeTrials, exactReplays: report.replayedTrials, previousReplays: report.previousTrialReplays.length,
  preserved: Object.keys(report.preserved).length, errors: report.errors }, null, 2));
if (!report.passed) process.exitCode = 1;
