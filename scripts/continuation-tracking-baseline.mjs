// Strengthen the generic baseline with every public asset, including JSON atlas
// metadata. Read the exact Git base; source work in progress is not a baseline.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sha, fresh } from './completion-tracking-common.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), options = {};
for (let index = 0; index < args.length; index += 2) {
  assert.ok(['--base', '--output', '--snapshot-dir', '--seed'].includes(args[index]));
  assert.ok(args[index + 1]); options[args[index].slice(2)] = args[index + 1];
}
assert.match(options.base || '', /^[0-9a-f]{40}$/);
assert.ok(options.output && options['snapshot-dir']);
const output = path.resolve(root, options.output);
await fresh(output);
const readGit = filename => execFileSync('git', ['show', `${options.base}:${filename}`], { cwd: root, maxBuffer: 128 * 1024 * 1024 });
let report;
if (options.seed) {
  const seed = await fs.readFile(path.resolve(root, options.seed)); report = JSON.parse(seed);
  assert.equal(report.baseCommit, options.base); assert.equal(report.passed, true);
  assert.equal(report.snapshotDir, path.resolve(options['snapshot-dir']));
  report.derivedFrom = { path: options.seed, sha256: sha(seed), sameGitInputsAndSingleSnapshot: true };
} else {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'continuation-baseline-report-'));
  const input = path.join(temporary, 'baseline.json');
  try {
    execFileSync(process.execPath, ['scripts/completion-tracking-baseline.mjs', '--base', options.base,
      '--output', input, '--snapshot-dir', options['snapshot-dir']], { cwd: root, stdio: 'inherit' });
    report = JSON.parse(await fs.readFile(input));
  } finally { await fs.rm(temporary, { recursive: true, force: true }); }
}
const publicPaths = execFileSync('git', ['ls-tree', '-rz', '--name-only', options.base, '--', 'public/'],
  { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
assert.ok(publicPaths.length > 0);
for (const filename of publicPaths) report.publicInputHashes[filename] = sha(readGit(filename));
report.gitTree = execFileSync('git', ['rev-parse', `${options.base}^{tree}`], { cwd: root, encoding: 'utf8' }).trim();
report.generatedAt = new Date().toISOString();
report.preservation.publicFiles = publicPaths.length;
report.preservation.allPublicBytesProtected = true;
report.sourceTools = [...(report.sourceTools || []), report.sourceTool];
report.sourceTool = { path: 'scripts/continuation-tracking-baseline.mjs', sha256: sha(await fs.readFile(fileURLToPath(import.meta.url))) };
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, base: options.base, publicFiles: publicPaths.length,
  validated: report.preservation.defaultProtectedAdvanced.length, historicalFiles: Object.keys(report.historicalHashes).length, output: options.output }));
