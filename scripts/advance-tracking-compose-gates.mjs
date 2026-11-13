// Strengthen, then reuse the historical composer. No browser run or image-opening
// claim is created here; every such fact must already exist in immutable inputs.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, sha, currentSources } from './completion-tracking-common.mjs';
const args = process.argv.slice(2), forwarded = [], reports = [];
const options = {};
for (let index = 0; index < args.length; index += 2) {
  const key = args[index], value = args[index + 1]; assert.ok(value);
  if (key === '--required-kinds' || key === '--publication-report') options[key.slice(2)] = value;
  else {
    forwarded.push(key, value);
    if (key === '--report') {
      const split = value.indexOf('='); assert.ok(split > 0);
      reports.push({ kind: value.slice(0, split), path: value.slice(split + 1) });
    } else if (key === '--stage' || key === '--scope' || key === '--native-report') options[key.slice(2)] = value;
  }
}
assert.ok(options.stage && options.scope && options['native-report']);
const requiredKinds = (options['required-kinds'] || 'progression,dialogues,world,feros,continuity').split(',');
assert.deepEqual(reports.map(report => report.kind).sort(), [...requiredKinds].sort(), 'Every declared current family is required exactly once.');
const load = async filename => {
  const bytes = await fs.readFile(path.resolve(ROOT, filename)); return { bytes, data: JSON.parse(bytes) };
};
const registryContext = (report, label) => {
  const context = report.registryContextHashes || {};
  if (Object.hasOwn(context, 'before') || Object.hasOwn(context, 'after')) {
    assert.deepEqual(context.after, context.before, `${label}: registry context changed during execution`);
    assert.ok(context.before && Object.keys(context.before).length > 0, label);
    return context.before;
  }
  if (report.finalRegistryContextHashes) assert.deepEqual(report.finalRegistryContextHashes, context, `${label}: registry context changed during execution`);
  return context;
};
const scope = (await load(options.scope)).data;
const native = (await load(options['native-report'])).data;
assert.equal(native.passed, true); assert.ok(native.sourceHashes && Object.keys(native.sourceHashes).length > 0);
await currentSources(native.sourceHashes, options['native-report']);
let publication;
if (options.stage === 'production') {
  assert.ok(options['publication-report'], 'Compiled gates must follow the current verified principal copy.');
  publication = (await load(options['publication-report'])).data;
  assert.equal(publication.passed, true); assert.equal(publication.baselineCommit, scope.baseCommit);
  assert.deepEqual(publication.changedIds, scope.changedIds);
  await currentSources(publication.deliveries, options['publication-report']);
}
for (const input of reports) {
  const report = (await load(input.path)).data;
  assert.equal(report.passed, true); assert.ok(report.sourceHashes && Object.keys(report.sourceHashes).length > 0, input.path);
  await currentSources(report.sourceHashes, input.path);
  if (report.sourcesBefore) assert.deepEqual(report.sourcesAfter, report.sourcesBefore, `${input.path}: sources changed during execution`);
  const contextHashes = registryContext(report, input.path);
  if (Object.keys(contextHashes).length) await currentSources(contextHashes, `${input.path}: current registry context`);
  if (options.stage === 'production') {
    assert.equal(report.distFrozen, true, `${input.path}: require an explicit frozen-build result`);
    assert.deepEqual(report.sourceRequests, [], `${input.path}: require an explicit empty DEV-source request list`);
    const context = { ...report.sourceHashes, ...contextHashes };
    for (const filename of ['docs/content-catalog.json', 'src/universe-data.js']) {
      assert.equal(context[filename], sha(await fs.readFile(path.join(ROOT, filename))), `${input.path}: missing current synchronized context ${filename}`);
    }
    assert.ok(report.distFiles && Object.keys(report.distFiles).length > 0, `${input.path}: compiled files required`);
    if (report.generatedAt && publication.generatedAt) assert.ok(Date.parse(report.generatedAt) >= Date.parse(publication.generatedAt), `${input.path}: execution predates current public copy`);
  }
}
execFileSync(process.execPath, ['scripts/completion-tracking-compose-gates.mjs', ...forwarded], { cwd: ROOT, env: process.env, stdio: 'inherit' });
