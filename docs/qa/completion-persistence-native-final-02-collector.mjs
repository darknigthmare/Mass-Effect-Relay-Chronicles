import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, access, mkdtemp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url), cwd = fileURLToPath(root);
const prefix = process.env.COMPLETION_PERSISTENCE_PREFIX;
assert.match(prefix || '', /^completion-persistence-[a-z0-9-]+$/, 'Use a fresh COMPLETION_PERSISTENCE_PREFIX.');
const baseline = process.env.COMPLETION_BASE_MAIN;
assert.match(baseline || '', /^[a-f0-9]{40}$/);
const reportPath = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(reportPath); throw Error('An existing report must be preserved.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const files = ['src/state.js', 'src/save-slots.js', 'src/loadout.js', 'src/customization.js', 'src/completion-persistence-campaign.js',
  'src/story.js', 'src/assignments.js', 'src/operations.js', 'src/mission-progress.js', 'src/campaign-talents.js',
  'src/character-data.js', 'src/game-data.js', 'tests/completion-persistence.test.js', 'scripts/completion-persistence-proof.mjs'];
const tests = ['tests/completion-persistence.test.js', 'tests/state.test.js', 'tests/save-v02.test.js', 'tests/save-slots.test.js',
  'tests/save-continuity.test.js', 'tests/loadout.test.js', 'tests/loadout-migration.test.js', 'tests/customization.test.js', 'tests/customization-comparison.test.js'];
const hashes = async () => Object.fromEntries(await Promise.all(files.map(async path => [path, sha(await readFile(new URL(path, root)))])));
const report = { passed: false, at: new Date().toISOString(), baseCommit: baseline, sourceHashes: await hashes(),
  command: { script: 'node scripts/completion-persistence-proof.mjs', environment: { COMPLETION_PERSISTENCE_PREFIX: prefix, COMPLETION_BASE_MAIN: baseline } },
  scope: 'Native persistence/inventory/workshop checks and direct baseline reproduction of five demonstrated defects. Campaign endings are prepared by native progression callbacks; no public combat or visual fidelity certification.',
  limitations: ['Browser UX and production distribution need separate current-source checks.', 'Export describes the existing condensed ME1 campaign; an ME2 continuation is not implemented.'], errors: [] };

async function probe(folder) {
  const url = pathToFileURL(join(folder, 'src/')).href;
  const state = await import(new URL('state.js', url)), custom = await import(new URL('customization.js', url));
  const loadout = await import(new URL('loadout.js', url));
  let getterCalls = 0, optionsCalls = 0;
  const hostile = state.newGame(); Object.defineProperty(hostile.customization.face, 'preset', { enumerable: true, get() { getterCalls++; return 'standard'; } });
  let getterBlocked = false; try { state.encodeSave(hostile); } catch { getterBlocked = true; }
  const balance = state.newGame(); balance.credits = NaN;
  const balanceBlocked = !state.buyUpgrade(balance, 'shepard', 'rifle').ok;
  const base = state.newGame(), draft = custom.createCustomizationDraft(base), options = {};
  Object.defineProperty(options, 'inCombat', { enumerable: true, get() { optionsCalls++; return false; } });
  const optionsBlocked = !custom.commitCustomization(base, draft, options).ok;
  const hidden = structuredClone(base.customization); Object.defineProperty(hidden.face, 'preset', { enumerable: false, value: 'standard' });
  const hiddenBlocked = custom.normalizeCustomization(hidden) === null;
  const full = state.newGame(); full.inventory.stock['kessler-i'] = 40;
  assert.ok(state.decodeSave(state.encodeSave(full)), 'Stock40 must be a valid imported fixture.');
  const beforeSale = JSON.stringify(full), stockFullSaleBlocked = !loadout.sellItem(full, 'kessler-i').ok;
  const stockFullSaleStateUnchanged = beforeSale === JSON.stringify(full);
  return { getterCalls, getterBlocked, balanceBlocked, optionsCalls, optionsBlocked, hiddenBlocked, stockFullSaleBlocked, stockFullSaleStateUnchanged };
}

try {
  const temp = await mkdtemp(join(tmpdir(), 'relay-completion-persistence-'));
  const archive = spawnSync('git', ['archive', baseline, 'src'], { cwd, maxBuffer: 20_000_000 });
  assert.equal(archive.status, 0, archive.stderr?.toString());
  assert.equal(spawnSync('tar', ['-x', '-C', temp], { input: archive.stdout }).status, 0);
  await writeFile(join(temp, 'package.json'), '{"type":"module"}\n');
  report.baselineProbe = await probe(temp); report.currentProbe = await probe(cwd);
  assert.deepEqual(report.baselineProbe, { getterCalls: 1, getterBlocked: false, balanceBlocked: false, optionsCalls: 1, optionsBlocked: false, hiddenBlocked: false, stockFullSaleBlocked: false, stockFullSaleStateUnchanged: false });
  assert.deepEqual(report.currentProbe, { getterCalls: 0, getterBlocked: true, balanceBlocked: true, optionsCalls: 0, optionsBlocked: true, hiddenBlocked: true, stockFullSaleBlocked: true, stockFullSaleStateUnchanged: true });
  report.baselineProbeSource = { commit: baseline, state: sha(await readFile(join(temp, 'src/state.js'))), customization: sha(await readFile(join(temp, 'src/customization.js'))), loadout: sha(await readFile(join(temp, 'src/loadout.js'))) };
  const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...tests], { cwd, encoding: 'utf8', maxBuffer: 8_000_000 });
  const tap = `${result.stdout || ''}${result.stderr || ''}`;
  const tapPath = `docs/qa/${prefix}-tests.tap`;
  await writeFile(new URL(tapPath, root), tap);
  report.tests = { command: [process.execPath, '--test', '--test-reporter=tap', ...tests], exitCode: result.status, path: tapPath, sha256: sha(tap),
    counts: Object.fromEntries([...tap.matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)$/gm)].map(match => [match[1], Number(match[2])])) };
  assert.equal(result.status, 0); assert.equal(report.tests.counts.tests, 107); assert.equal(report.tests.counts.pass, 107);
  assert.equal(report.tests.counts.fail, 0); assert.equal(report.tests.counts.skipped, 0); assert.equal(report.tests.counts.cancelled, 0);
  report.sourcesUnchanged = JSON.stringify(await hashes()) === JSON.stringify(report.sourceHashes);
  assert.equal(report.sourcesUnchanged, true, 'Sources changed during this proof. Preserve it and run again after the freeze.');
  report.passed = true;
} catch (error) { report.errors.push(error.stack); process.exitCode = 1; }
await mkdir(new URL('docs/qa/', root), { recursive: true });
await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ path: fileURLToPath(reportPath), passed: report.passed, tests: report.tests?.counts, baselineProbe: report.baselineProbe, currentProbe: report.currentProbe, errors: report.errors }));
