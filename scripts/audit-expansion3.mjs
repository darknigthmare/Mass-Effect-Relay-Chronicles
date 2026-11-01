import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { EXPANSION_ENTRIES, EXPANSION2_ENTRIES, EXPANSION3_ENTRIES, EXPANSION3_GROUPS,
  EXPANSION_ALL_ENTRIES, EXPANSION_BATCHES, getExpansionEntry, listExpansionEntries,
  canRunExpansionEntry, runExpansionTrial } from '../src/expansion.js';
import { UNIVERSE_WORKS, UNIVERSE_SUMMARY, getUniverseWork } from '../src/universe-data.js';
import { canAccessContent, normalizeContext } from '../src/continuity.js';

const root = new URL('../', import.meta.url), file = path => readFile(new URL(path, root));
const hash = data => createHash('sha256').update(data).digest('hex');
const baseline = JSON.parse(await file('docs/qa/expansion3-baseline.json'));
const previousReports = await Promise.all(['docs/qa/expansion-native-report.json', 'docs/qa/expansion2-native-report.json']
  .map(async path => ({ path, report: JSON.parse(await file(path)) })));
const contexts = UNIVERSE_WORKS.flatMap(work => work.periods.map(period => ({ mediaId: work.id, periodId: period.id })));
const editions = ['standard', 'legendary', 'deluxe'], difficulties = ['story', 'normal', 'hard'], seeds = [1, 17, 999999];
const report = { passed: false, generatedAt: new Date().toISOString(), baseline: baseline.baselineCommit,
  scope: 'Third disjoint selection of 122 source-scoped study references. Open exercises use declared ATB fixtures; closed dossiers stay closed. Two opt-in medical benches add finite-resource revival exercises without enabling campaign medical actions. No new armor set, fleet hull, complete original kit, scene, sprite or integral 1:1 fidelity is certified.',
  sourceHashes: {}, cards: [], groups: [], nativeTrials: 0, replayedTrials: 0, runnable: 0,
  consultationOnly: 0, previouslyDefinedWithNewStudy: 0, preserved: {}, previousTrialReplays: [],
  previousClosureChecks: [], domainReports: {}, errors: [], registry: UNIVERSE_SUMMARY,
  checks: { documentaryContexts: 0, editionDifficultySeedGates: 0, closedTrialGates: 0,
    invalidOptionGates: 0, invalidContextGates: 0, invalidIdentityGates: 0, getterCalls: 0,
    readonlyRegistry: false, allHistoricalOutcomesExact: false },
  gateMatrix: { seeds, difficulties, editions,
    method: 'Every registered work/segment and all 27 valid primitive option combinations are checked through the public access gate. Refused combinations also execute the public trial entry point and must remain refused. Open native exercises run with seed 17 and their prepared edition, then replay exactly.' },
  limitations: [
    'Dossier facts and many source citations are inherited, sometimes secondary or indirect; this audit does not independently certify primary-source identity, kits, mechanics or art.',
    'Actor and enemy exercises use abstract units with generic actions and explicit omissions; a successful trial is not an original encounter or a completed mission.',
    'Conventional weapon capacities, reserves and damage are existing ATB family budgets, not original model statistics or firing behavior.',
    'The medical revival proportion, timing and prepared medigel quantities are ATB fixtures. No persistent inventory, narrative death, reward, recruitment or campaign permission is altered.',
    'There are two medical/power study references, zero new named armor sets and zero new fleet entries in this lot. Earlier fleet and equipment dossiers remain in their historical batches.',
    'This script verifies native behavior, source hashes and historical preservation; browser interaction, visual inspection, workbook cells and production delivery have separate proofs.',
  ],
};

function assertFrozen(value) {
  if (value && typeof value === 'object') {
    assert.equal(Object.isFrozen(value), true);
    Object.values(value).forEach(assertFrozen);
  }
}
function validEdition(entry, context, edition) {
  return (!entry.constraints?.editionProfile || entry.constraints.editionProfile === edition)
    && (edition !== 'legendary' || ['ME2', 'ME3'].includes(context.mediaId) && context.periodId !== 'me3-multiplayer')
    && (edition !== 'deluxe' || context.mediaId === 'MEA');
}
function invalidOptions(base) {
  const getter = Object.defineProperty({}, 'seed', { enumerable: true, get() { report.checks.getterCalls++; throw Error('Injected option getter'); } });
  const hidden = Object.defineProperty({}, 'seed', { enumerable: false, value: 17 });
  const symbol = { [Symbol('edition')]: 'legendary' };
  return [null, [], 'standard', 17, true, { ...base, seed: 0 }, { ...base, seed: 1000000 },
    { ...base, seed: .5 }, { ...base, seed: NaN }, { ...base, difficulty: 'forged' }, { ...base, edition: 'all-dlc' },
    { ...base, unlocked: true }, { ...base, batch: 'all' }, { ...base, stats: { hp: 9999 } },
    { ...base, simulation: { attack: 500 } }, { ...base, equipmentProfileId: 'ME3-WPN-AVENGER' },
    Object.create({ seed: 17 }), JSON.parse('{"__proto__":{"unlocked":true}}'), getter, hidden, symbol];
}
function invalidContexts(context) {
  const getter = Object.defineProperty({ periodId: context.periodId }, 'mediaId', {
    enumerable: true, get() { report.checks.getterCalls++; throw Error('Injected context getter'); },
  });
  return [null, undefined, [], context.mediaId, {}, { mediaId: context.mediaId },
    { ...context, periodId: 'forged-period' }, { mediaId: 'UNKNOWN', periodId: context.periodId },
    { ...context, unlocked: true }, { ...context, galaxy: 'forged-galaxy' }, getter];
}

try {
  assert.equal(baseline.baselineCommit, '1b3444f67ca1d159f5c71f4e4c4d8991f67abef5');
  assert.equal(Object.keys(baseline.digests).length, 1301);
  const paths = ['src/expansion.js', 'src/expansion-ui.js', 'src/main.js', 'src/expansion-bench.js',
    'src/expansion-medical-bench.js', 'src/combat-medical.js', 'src/combat.js', 'src/combat-summons.js',
    ...['characters', 'armor', 'weapons', 'fleet', 'enemies'].map(name => `src/expansion3-${name}.js`),
    'src/universe-data.js', 'src/universe-equipment.js', 'src/universe-weapon-profiles.js', 'src/universe-actors.js',
    'src/universe-powers.js', 'src/continuity.js', 'src/continuity-data.js', 'src/tool-data.js',
    'docs/content-catalog.json', 'scripts/audit-expansion3.mjs', 'docs/qa/expansion3-baseline.json'];
  for (const path of paths) report.sourceHashes[path] = hash(await file(path));
  assert.equal(EXPANSION_ENTRIES.length, 200); assert.equal(EXPANSION2_ENTRIES.length, 176);
  assert.equal(EXPANSION3_ENTRIES.length, 122); assert.equal(EXPANSION_ALL_ENTRIES.length, 498);
  assert.equal(new Set(EXPANSION_ALL_ENTRIES.map(entry => entry.id)).size, 498);
  assert.equal(UNIVERSE_SUMMARY.recordCount, 6708); assert.equal(UNIVERSE_SUMMARY.sourceCount, 454);
  const historicalIds = previousReports.flatMap(({ report: previous }) => previous.cards.map(card => card.id));
  assert.equal(new Set(historicalIds).size, 376);
  assert.deepEqual(EXPANSION_ALL_ENTRIES.slice(0, 376).map(entry => entry.id), historicalIds);
  assert.deepEqual(baseline.priorRecordIds, historicalIds);
  assert.deepEqual(EXPANSION_BATCHES.map(({ id, count }) => ({ id, count })), [
    { id: 'lot1', count: 200 }, { id: 'lot2', count: 176 }, { id: 'lot3', count: 122 },
  ]);
  assert.deepEqual(Object.fromEntries(EXPANSION3_GROUPS.map(group => [group.id, group.entries.length])),
    { actor: 40, armor: 2, weapon: 40, fleet: 0, enemy: 40 });
  const before = JSON.stringify(EXPANSION_ALL_ENTRIES);
  assertFrozen(EXPANSION_ALL_ENTRIES);

  for (const entry of EXPANSION3_ENTRIES) {
    assert.equal(historicalIds.includes(entry.id), false, entry.id);
    assert.equal(entry.record.id, entry.id); assert.equal(entry.record.fact, true);
    assert.equal(entry.identitySourceVerified, true); assert.equal(entry.partial, true);
    assert.ok(entry.notes.length && entry.limitations.length, entry.id);
    const work = getUniverseWork(entry.record.mediaId);
    assert.ok(work && !work.locked); assert.ok(entry.sourceIds.length);
    assert.ok(entry.sourceIds.every(id => work.sources.some(source => source.id === id)), entry.id);
    const validContexts = contexts.filter(context => canAccessContent(entry.id, context).ok);
    assert.ok(validContexts.length, entry.id);
    const context = validContexts[0], options = { seed: 17, difficulty: 'normal', edition: entry.constraints?.editionProfile || 'standard' };
    const access = canRunExpansionEntry(entry.id, context, options), trial = runExpansionTrial(entry.id, context, options);
    assert.equal(trial.ok, access.ok, entry.id);
    const row = { id: entry.id, mode: entry.mode, name: entry.record.name, role: entry.role,
      originalStatus: entry.record.status, sourceIds: entry.sourceIds, catalogPath: entry.record.provenance.catalogPath,
      availability: entry.availability, testedContext: context, testedOptions: options,
      executable: access.ok, blockedReason: access.reason, bench: entry.bench || null };
    if (trial.ok) {
      report.nativeTrials++; report.runnable++;
      assert.equal(trial.recordId, entry.id); assert.equal(trial.partial, true);
      assert.equal(trial.statsBasis, 'ATB adaptation'); assert.ok(trial.result);
      assert.deepEqual(trial, runExpansionTrial(entry.id, context, options), entry.id); report.replayedTrials++;
      if (entry.record.status === 'Défini') report.previouslyDefinedWithNewStudy++;
      row.result = trial.result; row.control = trial.control;
      for (const key of ['reward', 'inventory', 'save', 'campaign', 'recruitment']) assert.equal(Object.hasOwn(trial, key), false);
    } else { report.consultationOnly++; assert.ok(access.reason); }

    for (const candidate of contexts) {
      const documentaryAccess = canAccessContent(entry.id, candidate).ok;
      assert.equal(!!getExpansionEntry(entry.id, candidate), documentaryAccess, entry.id);
      report.checks.documentaryContexts++;
      for (const edition of editions) for (const difficulty of difficulties) for (const seed of seeds) {
        const candidateOptions = { seed, difficulty, edition };
        const expected = access.ok && documentaryAccess && validEdition(entry, candidate, edition);
        assert.equal(canRunExpansionEntry(entry.id, candidate, candidateOptions).ok, expected,
          `${entry.id}: ${candidate.mediaId}/${candidate.periodId}, ${edition}/${difficulty}/${seed}`);
        report.checks.editionDifficultySeedGates++;
        if (!expected) {
          assert.equal(runExpansionTrial(entry.id, candidate, candidateOptions).ok, false, entry.id);
          report.checks.closedTrialGates++;
        }
      }
    }
    for (const forged of invalidOptions(options)) {
      assert.equal(canRunExpansionEntry(entry.id, context, forged).ok, false, entry.id);
      assert.equal(runExpansionTrial(entry.id, context, forged).ok, false, entry.id);
      report.checks.invalidOptionGates++;
    }
    for (const forged of invalidContexts(context)) {
      assert.equal(getExpansionEntry(entry.id, forged), null, entry.id);
      assert.equal(runExpansionTrial(entry.id, forged, options).ok, false, entry.id);
      report.checks.invalidContextGates++;
    }
    assert.equal(getExpansionEntry(entry.id, { ...normalizeContext(context) }), entry);
    const forgedId = { get id() { report.checks.getterCalls++; throw Error('Injected identity getter'); },
      toString() { report.checks.getterCalls++; throw Error('Injected identity coercion'); } };
    for (const id of [null, undefined, [], {}, forgedId, '__proto__', 'constructor', 'UNKNOWN']) {
      assert.equal(getExpansionEntry(id, context), null);
      assert.equal(runExpansionTrial(id, context, options).ok, false);
      report.checks.invalidIdentityGates++;
    }
    report.cards.push(row);
  }
  for (const mode of ['actor', 'armor', 'weapon', 'fleet', 'enemy']) report.groups.push({ id: mode,
    cards: report.cards.filter(card => card.mode === mode).length,
    runnable: report.cards.filter(card => card.mode === mode && card.executable).length,
    consultationOnly: report.cards.filter(card => card.mode === mode && !card.executable).length });
  assert.equal(report.nativeTrials, report.replayedTrials);
  assert.equal(report.runnable + report.consultationOnly, 122);
  assert.equal(report.groups.find(group => group.id === 'actor').runnable, 3);
  assert.equal(report.groups.find(group => group.id === 'armor').runnable, 2);
  assert.equal(report.groups.find(group => group.id === 'weapon').runnable, 18);
  assert.equal(report.groups.find(group => group.id === 'fleet').runnable, 0);

  for (const { path, report: previous } of previousReports) {
    assert.equal(previous.passed, true, path);
    for (const card of previous.cards) {
      const trial = runExpansionTrial(card.id, card.testedContext, card.testedOptions);
      assert.equal(trial.ok, card.executable, card.id);
      if (trial.ok) {
        assert.deepEqual(trial.result, card.result, card.id); assert.deepEqual(trial.control, card.control, card.id);
        report.previousTrialReplays.push({ id: card.id, sourceReport: path, exact: true,
          resultSha256: hash(JSON.stringify([trial.result, trial.control])) });
      } else report.previousClosureChecks.push({ id: card.id, sourceReport: path, stillClosed: true, reason: trial.reason });
    }
  }
  assert.equal(report.previousTrialReplays.length, 242); assert.equal(report.previousClosureChecks.length, 134);
  report.checks.allHistoricalOutcomesExact = true;
  for (const context of contexts) {
    assert.deepEqual(listExpansionEntries(context), listExpansionEntries(context, 'all', 'lot1'));
    assert.deepEqual(listExpansionEntries(context, 'all', 'all'), [
      ...listExpansionEntries(context, 'all', 'lot1'), ...listExpansionEntries(context, 'all', 'lot2'),
      ...listExpansionEntries(context, 'all', 'lot3'),
    ]);
    assert.deepEqual(listExpansionEntries(context, 'all', 'forged-lot'), []);
  }
  assert.equal(report.checks.getterCalls, 0);
  assert.equal(JSON.stringify(EXPANSION_ALL_ENTRIES), before); report.checks.readonlyRegistry = true;
  for (const [path, expected] of Object.entries(baseline.digests)) {
    assert.equal(hash(await file(path)), expected, `Historical file changed: ${path}`); report.preserved[path] = expected;
  }
  for (const name of ['characters', 'armor', 'weapons', 'fleet', 'enemies']) {
    const path = `docs/qa/expansion3-${name}-report.json`, bytes = await file(path), domain = JSON.parse(bytes);
    // The character domain records individual test counts under validation;
    // the other domains expose an aggregate boolean. Preserve those reports.
    if (name === 'characters') {
      assert.equal(domain.validation.passed, 9, path); assert.equal(domain.validation.failed, 0, path);
      assert.equal(domain.validation.realAtbShootOrders, 3, path);
      assert.equal(domain.validation.syntaxCheck, true, path); assert.equal(domain.validation.diffCheck, true, path);
    } else assert.equal(domain.passed, true, path);
    report.domainReports[name] = { path, sha256: hash(bytes),
      qualification: 'Domain report has its own recorded source/test scope. Passing this audit does not promote an inherited documentary fact or a partial trial to original 1:1 content.' };
  }
  report.passed = true;
} catch (error) { report.errors.push(error.stack || String(error)); }
await writeFile(new URL('docs/qa/expansion3-native-report.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, cards: report.cards.length, groups: report.groups,
  nativeTrials: report.nativeTrials, exactReplays: report.replayedTrials,
  historicalExactReplays: report.previousTrialReplays.length, historicalClosures: report.previousClosureChecks.length,
  preserved: Object.keys(report.preserved).length, checks: report.checks, errors: report.errors }, null, 2));
if (!report.passed) process.exitCode = 1;
