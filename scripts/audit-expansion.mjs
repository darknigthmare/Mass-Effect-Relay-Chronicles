import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { EXPANSION_ENTRIES, EXPANSION_GROUPS, canRunExpansionEntry, runExpansionTrial } from '../src/expansion.js';
import { UNIVERSE_WORKS, UNIVERSE_SUMMARY } from '../src/universe-data.js';
import { canAccessContent } from '../src/continuity.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const baseline = '6182756';
const contexts = UNIVERSE_WORKS.flatMap(work => work.periods.map(period => ({ mediaId: work.id, periodId: period.id })));
const sourceFiles = ['src/expansion.js', 'src/expansion-ui.js', 'src/main.js', 'src/universe-ui.js', 'src/universe-ui.css',
  ...['characters', 'armor', 'weapons', 'fleet', 'enemies'].map(name => `src/expansion-${name}.js`),
  'src/combat.js', 'src/universe-weapon-profiles.js', 'src/continuity.js', 'src/continuity-data.js', 'src/universe-data.js'];
const report = { passed: false, generatedAt: new Date().toISOString(), baseline,
  scope: '200 contextual study cards attached to existing documentary identities. Seeded ATB exercises and original logistical budgets are partial adaptations, not 200 new canonical objects, original-model mechanics, playable source missions or certified 1:1 assets. Historical catalogue production statuses remain unchanged.',
  sourceHashes: {}, registry: UNIVERSE_SUMMARY,
  cards: [], groups: [], runnable: 0, consultationOnly: 0, nativeTrials: 0, replayedTrials: 0,
  previouslyDefinedWithNewStudy: 0, outcomes: {}, preserved: {}, errors: [] };
try {
  for (const path of sourceFiles) report.sourceHashes[path] = hash(await readFile(new URL(path, new URL('../', import.meta.url))));
  assert.equal(EXPANSION_ENTRIES.length, 200);
  assert.equal(new Set(EXPANSION_ENTRIES.map(entry => entry.id)).size, 200);
  const immutableBefore = JSON.stringify(EXPANSION_ENTRIES);
  for (const entry of EXPANSION_ENTRIES) {
    const validContexts = contexts.filter(context => canAccessContent(entry.id, context).ok);
    assert.ok(validContexts.length, entry.id); assert.equal(entry.identitySourceVerified, true, entry.id);
    const context = validContexts[0], options = { seed: 17, difficulty: 'normal', edition: entry.constraints?.editionProfile || 'standard' };
    const access = canRunExpansionEntry(entry.id, context, options), trial = runExpansionTrial(entry.id, context, options);
    assert.equal(trial.ok, access.ok, entry.id);
    const row = { id: entry.id, mode: entry.mode, name: entry.record.name, role: entry.role,
      catalogPath: entry.record.provenance.catalogPath, originalStatus: entry.record.status,
      nature: entry.record.nature || entry.record.canonLevel, fact: entry.record.fact,
      sourceIds: [...entry.record.sourceIds], availability: entry.availability, testedContext: context,
      testedOptions: options, executable: access.ok, blockedReason: access.reason,
      notes: entry.notes, limitations: entry.limitations, simulation: entry.simulation };
    if (access.ok) {
      report.runnable++; report.nativeTrials++;
      if (entry.record.status === 'Défini') report.previouslyDefinedWithNewStudy++;
      assert.deepEqual(trial, runExpansionTrial(entry.id, context, options), entry.id);
      report.replayedTrials++;
      report.outcomes[trial.result.outcome] = (report.outcomes[trial.result.outcome] || 0) + 1;
      row.result = trial.result; row.control = trial.control;
      assert.equal(Object.hasOwn(trial, 'reward'), false);
    } else {
      report.consultationOnly++;
      assert.ok(access.reason, entry.id);
    }
    const foreign = contexts.find(candidate => candidate.mediaId !== context.mediaId);
    assert.equal(runExpansionTrial(entry.id, foreign, options).ok, false, entry.id);
    report.cards.push(row);
  }
  assert.equal(JSON.stringify(EXPANSION_ENTRIES), immutableBefore);
  report.groups = EXPANSION_GROUPS.map(group => ({ id: group.id, label: group.label,
    cards: report.cards.filter(row => row.mode === group.id).length,
    runnable: report.cards.filter(row => row.mode === group.id && row.executable).length,
    consultationOnly: report.cards.filter(row => row.mode === group.id && !row.executable).length }));
  const protectedPaths = ['docs/content-catalog.json', 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx',
    'docs/universe/catalogs', 'docs/universe/outputs', 'public/assets',
    'src/combat.js', 'src/state.js', 'src/customization.js', 'src/customization-ui.js', 'src/customization-render.js',
    'src/chronicles.js', 'src/continuity.js', 'src/continuity-data.js', 'src/universe-data.js',
    'src/universe-actors.js', 'src/universe-equipment.js', 'src/universe-weapon-profiles.js',
    'src/universe-opponents.js', 'src/universe-opposition-scenarios.js', 'src/universe-equipment-scenarios.js'];
  const paths = execFileSync('git', ['ls-tree', '-r', '--name-only', baseline, '--', ...protectedPaths], { cwd: root, encoding: 'utf8' }).trim().split('\n');
  for (const path of paths) {
    const before = execFileSync('git', ['show', `${baseline}:${path}`], { cwd: root, maxBuffer: 64 * 1024 * 1024 });
    const current = await readFile(new URL(path, new URL('../', import.meta.url)));
    assert.equal(hash(current), hash(before), `Preservation failed: ${path}`);
    report.preserved[path] = hash(current);
  }
  report.passed = true;
} catch (error) { report.errors.push(error.stack || String(error)); }
await mkdir(new URL('../docs/qa/', import.meta.url), { recursive: true });
await writeFile(new URL('../docs/qa/expansion-native-report.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, groups: report.groups, nativeTrials: report.nativeTrials,
  replayedTrials: report.replayedTrials, previouslyDefinedWithNewStudy: report.previouslyDefinedWithNewStudy,
  outcomes: report.outcomes, preservedFiles: Object.keys(report.preserved).length, errors: report.errors }, null, 2));
if (!report.passed) process.exitCode = 1;
