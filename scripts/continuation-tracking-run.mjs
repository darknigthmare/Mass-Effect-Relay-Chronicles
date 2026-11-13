// Reuse the parameterized completion mechanics without their historical default
// paths. This driver writes only fresh continuation outputs unless publishing
// the two principal files has explicitly been requested after all gates.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [operation, ...args] = process.argv.slice(2);
const stages = {
  baseline: ['node', 'continuation-tracking-baseline.mjs', ['--base', '--output', '--snapshot-dir']],
  audit: ['node', 'completion-tracking-audit.mjs', ['--baseline', '--output-prefix']],
  preservation: ['node', 'continuation-tracking-preservation.mjs', ['--baseline', '--output']],
  plan: ['node', 'completion-tracking-plan.mjs', ['--baseline', '--output', '--archive-dir', '--select-file', '--feature-paths-file']],
  gates: ['node', 'completion-tracking-compose-gates.mjs', ['--scope', '--native-report', '--stage', '--execution-output', '--visual-output']],
  candidate: ['node', 'completion-tracking-candidate.mjs', ['--scope', '--output-dir', '--report', '--integration-report', '--development-report', '--visual-review']],
  verify: ['python', 'completion-tracking-verify-workbook.py', ['--baseline', '--before', '--after', '--catalog-before', '--catalog-after', '--changes', '--scope', '--output']],
  render: ['node', 'completion-tracking-render-workbook.mjs', ['--input', '--update-report', '--output-dir', '--report']],
  'workbook-review': ['node', 'completion-tracking-compose-workbook-review.mjs', ['--render-report', '--review', '--output']],
  publish: ['node', 'completion-tracking-publish.mjs', ['--update-report', '--native-report', '--render-report', '--visual-review', '--scope', '--output']],
};
assert.ok(Object.hasOwn(stages, operation), `Use one of: ${Object.keys(stages).join(', ')}`);
const [executable, script, required] = stages[operation];
const value = option => {
  const index = args.indexOf(option);
  assert.ok(index >= 0 && args[index + 1] && !args[index + 1].startsWith('--'), `Pass ${option} explicitly; historical defaults are not used.`);
  return args[index + 1];
};
for (const option of required) value(option);
for (const option of ['--output', '--output-prefix', '--execution-output', '--visual-output', '--report', '--output-dir', '--archive-dir', '--snapshot-dir']) {
  if (!args.includes(option)) continue;
  const destination = path.resolve(root, value(option));
  assert.ok(destination.split(path.sep).some(part => part.startsWith('continuation-')), `Use a new continuation- output: ${option}`);
}
if (args.includes('--baseline')) {
  const baseline = JSON.parse(fs.readFileSync(path.resolve(root, value('--baseline'))));
  assert.equal(baseline.passed, true);
  assert.match(baseline.baseCommit, /^[0-9a-f]{40}$/);
  assert.equal(baseline.catalogues[0].advanced.filter(entry => entry.status === 'Validé').length,
    baseline.catalogues[0].statuses.Validé);
}
if (operation === 'baseline') assert.match(value('--base'), /^[0-9a-f]{40}$/);
execFileSync(executable, [path.join('scripts', script), ...args], { cwd: root, stdio: 'inherit', env: process.env });
