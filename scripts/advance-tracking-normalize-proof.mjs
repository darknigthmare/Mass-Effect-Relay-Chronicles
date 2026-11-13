// Schema adapter only: preserve original executions/reviews and derive no new
// test result or image-opening attestation. Every opening must already be explicit.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha, fresh, currentSources } from './completion-tracking-common.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), options = {};
for (let index = 0; index < args.length; index += 2) {
  assert.ok(['--execution', '--review', '--output', '--dist-prefix'].includes(args[index]));
  assert.ok(args[index + 1]); options[args[index].slice(2)] = args[index + 1];
}
assert.ok(options.execution && options.output); await fresh(path.resolve(root, options.output));
const load = async filename => {
  const bytes = await fs.readFile(path.resolve(root, filename));
  return { path: filename, bytes, sha256: sha(bytes), data: JSON.parse(bytes) };
};
const execution = await load(options.execution), report = execution.data;
assert.equal(report.passed, true); assert.notEqual(report.selfcheckOnly, true); assert.notEqual(report.currentProductGate, false);
if (report.sourcesBefore) assert.deepEqual(report.sourcesAfter, report.sourcesBefore, 'Execution sources were not frozen');
const sourceHashes = report.sourceHashes || report.sourcesBefore;
assert.ok(sourceHashes && Object.keys(sourceHashes).length > 0);
await currentSources(sourceHashes, options.execution);
const originalExecution = { path: execution.path, sha256: execution.sha256 };
let output;
if (!options.review) {
  output = { ...report, sourceHashes, normalizedAt: new Date().toISOString(), schemaAdapterOnly: true,
    originalExecution, sourcePolicy: 'Source map checked against current files; any recorded before/after maps must match. Original execution and captures are preserved.' };
} else {
  const original = await load(options.review), review = original.data;
  assert.notEqual(review.passed, false);
  const findings = review.findings || [];
  if (review.passed !== true) {
    assert.ok(findings.length > 0);
    assert.ok(findings.every(finding => /^pass(?:$|-)/.test(finding.result)), 'Review contains no explicit positive overall result');
  }
  if (review.blockingFindings) assert.deepEqual(review.blockingFindings, []);
  const method = review.method || review.kind || review.reviewMethod;
  assert.equal(typeof method, 'string'); assert.match(method, /view_image|opened individually|actual screenshots opened/i);
  const images = review.images || review.capturesReviewed || review.captures || review.reviewed;
  const captures = report.captureArtifacts || report.captures || report.screenshots;
  assert.ok(Array.isArray(images) && Array.isArray(captures) && captures.length > 0);
  assert.equal(images.length, captures.length); assert.equal(new Set(images.map(image => image.path)).size, images.length);
  const normalized = [];
  for (const image of images) {
    const flags = ['actuallyOpened', 'opened', 'reviewed', 'openedIndividually'].filter(field => Object.hasOwn(image, field)).map(field => image[field]);
    assert.ok(flags.some(value => value === true) && !flags.some(value => value === false), `Missing actual opening: ${image.path}`);
    const capture = captures.find(item => item.path === image.path); assert.ok(capture, image.path);
    assert.equal(image.sha256, capture.sha256); assert.equal(sha(await fs.readFile(path.resolve(root, image.path))), image.sha256);
    normalized.push({ ...image, actuallyOpened: true, actualOpeningAttestation: { path: original.path, sha256: original.sha256 },
      observations: image.observations || image.observation || image.notes || findings });
  }
  output = { passed: true, generatedAt: new Date().toISOString(), schemaAdapterOnly: true, reviewComplete: true, blockingFindings: [],
    reviewer: review.reviewer || 'Author of the linked original image-opening review',
    method: 'Normalize the explicitly recorded original openings; this adapter opens no image and creates no new review.',
    originalReview: { path: original.path, sha256: original.sha256 }, originalExecution, sourceHashes,
    registryContextHashes: report.registryContextHashes || {}, actuallyOpenedImages: normalized.length, images: normalized,
    originalFindings: findings, limitations: review.limitations || review.limits || [], result: 'All original captures have an explicit SHA-matched actual-opening attestation in the linked original review.' };
}
if (options['dist-prefix']) {
  assert.ok(!options.review, 'Compiled paths belong to execution reports, never image-opening reviews.');
  assert.equal(options['dist-prefix'], 'dist/');
  assert.equal(report.mode, 'production'); assert.equal(report.distFrozen, true); assert.deepEqual(report.sourceRequests, []);
  assert.ok(report.distFiles && !Array.isArray(report.distFiles) && Object.keys(report.distFiles).length > 0);
  if (report.finalDistFiles) assert.deepEqual(report.finalDistFiles, report.distFiles);
  const normalizedDist = {};
  for (const [filename, expected] of Object.entries(report.distFiles)) {
    assert.ok(filename.startsWith('dist/'), filename);
    const key = filename.slice('dist/'.length);
    assert.ok(key && !key.startsWith('/') && path.posix.normalize(key) === key && !key.startsWith('../'), filename);
    assert.ok(!Object.hasOwn(normalizedDist, key), key);
    const bytes = await fs.readFile(path.join(root, 'dist', key));
    assert.equal(sha(bytes), expected.sha256, filename);
    if (expected.bytes != null) assert.equal(bytes.length, expected.bytes, filename);
    normalizedDist[key] = expected;
  }
  output.distFiles = normalizedDist;
  if (report.finalDistFiles) output.finalDistFiles = normalizedDist;
  assert.ok(Array.isArray(report.servedFiles) && report.servedFiles.length > 0);
  output.servedFiles = report.servedFiles.map(item => {
    assert.equal(typeof item.path, 'string'); assert.ok(item.path.startsWith('dist/'), item.path);
    const key = item.path.slice('dist/'.length), expected = normalizedDist[key]; assert.ok(expected, item.path);
    assert.equal(item.sha256, expected.sha256, item.path); assert.equal(item.bytes, expected.bytes, item.path);
    return { ...item, path: key };
  });
  assert.ok(output.servedFiles.some(item => item.path.endsWith('.js')));
  output.compiledPathAdapter = { schemaOnly: true, removedPrefix: 'dist/',
    originalDistMapSha256: sha(Buffer.from(JSON.stringify(report.distFiles))), filesLocallyVerified: Object.keys(normalizedDist).length,
    servedPathsNormalized: output.servedFiles.length,
    rule: 'Original prefixed keys and execution remain in originalExecution. SHA and byte counts are unchanged; no new browser execution, HTTP response or image opening is inferred.' };
}
output.sourceAdapter = { path: 'scripts/advance-tracking-normalize-proof.mjs', sha256: sha(await fs.readFile(fileURLToPath(import.meta.url))) };
await fs.writeFile(path.resolve(root, options.output), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, schemaAdapterOnly: true, images: output.images?.length, output: options.output }));
