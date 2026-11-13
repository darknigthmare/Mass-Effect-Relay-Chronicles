// Exact Git baseline with a two-file working snapshot, never a copied source tree.
// Keep the Completion schema so its parameterized candidate tools remain reusable.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ROOT, PUBLIC_TARGETS, fresh, sha, counts } from './completion-tracking-common.mjs';

const options = {}, args = process.argv.slice(2);
for (let index = 0; index < args.length; index += 2) {
  assert.ok(['--base', '--output', '--snapshot-dir'].includes(args[index]));
  assert.ok(args[index + 1]); options[args[index].slice(2)] = args[index + 1];
}
assert.match(options.base || '', /^[0-9a-f]{40}$/);
assert.ok(options.output && options['snapshot-dir']);
const output = path.resolve(ROOT, options.output), snapshotDir = path.resolve(options['snapshot-dir']);
await fresh(output); await fresh(snapshotDir);
const git = args => execFileSync('git', args, { cwd: ROOT, maxBuffer: 128 * 1024 * 1024 });
assert.equal(git(['rev-parse', `${options.base}^{commit}`]).toString().trim(), options.base);
const readGit = filename => git(['show', `${options.base}:${filename}`]);
const tree = git(['ls-tree', '-rz', options.base]).toString().split('\0').filter(Boolean);
const blobs = new Map(tree.map(line => { const [metadata, filename] = line.split('\t'); return [filename, metadata.split(' ')[2]]; }));
const tracked = [...blobs.keys()];
const exactBytes = async filename => {
  try {
    const bytes = await fs.readFile(path.join(ROOT, filename));
    if (crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex') === blobs.get(filename)) return bytes;
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  return readGit(filename);
};
const manifestPath = 'docs/universe/manifest.json', manifest = JSON.parse(readGit(manifestPath));
const catalogues = [{ id: 'ME1', catalogPath: PUBLIC_TARGETS[0], workbookPath: PUBLIC_TARGETS[1] },
  ...manifest.workbooks.map(item => ({ id: item.id, catalogPath: item.catalogPath,
    workbookPath: item.path || item.workbookPath || `docs/universe/outputs/relay-chronicles-20261022/${item.filename}` }))];
for (const catalogue of catalogues) if (!blobs.has(catalogue.workbookPath)) {
  const matches = tracked.filter(filename => filename.endsWith(`/${path.basename(catalogue.workbookPath)}`));
  assert.equal(matches.length, 1, catalogue.id); catalogue.workbookPath = matches[0];
}
const publicFiles = tracked.filter(filename => filename.startsWith('public/'));
const otherWorkbooks = tracked.filter(filename => filename.endsWith('.xlsx') && filename !== PUBLIC_TARGETS[1]);
const protectedInputs = new Set([manifestPath, ...publicFiles, ...otherWorkbooks, ...catalogues.flatMap(item => [item.catalogPath, item.workbookPath])]);
const historical = tracked.filter(filename => filename.startsWith('docs/qa/') || filename.startsWith('docs/workbook-previews/') || filename.startsWith('docs/universe/qa/') ||
  (filename.startsWith('docs/') && /\.(zip|png|webp|jpg|gif|webm|mp4)$/.test(filename)));
const sourcePaths = tracked.filter(filename => /^(src\/|tests\/|scripts\/|desktop\/)/.test(filename) || ['package.json', 'package-lock.json', 'vite.config.js'].includes(filename));
const publicInputHashes = {}, sourceHashes = {}, historicalHashes = {};
const historySet = new Set(historical), sourceSet = new Set(sourcePaths);
for (const filename of new Set([...protectedInputs, ...historical, ...sourcePaths])) {
  const bytes = await exactBytes(filename), digest = sha(bytes);
  if (protectedInputs.has(filename)) publicInputHashes[filename] = digest;
  if (historySet.has(filename)) historicalHashes[filename] = digest;
  if (sourceSet.has(filename)) sourceHashes[filename] = digest;
}
const all = [];
for (const catalogue of catalogues) {
  const data = JSON.parse(readGit(catalogue.catalogPath));
  catalogue.records = data.entries.length; catalogue.statuses = counts(data.entries); catalogue.sources = data.sources.length;
  catalogue.advanced = data.entries.filter(entry => ['Intégré', 'Validé'].includes(entry.status)); all.push(...data.entries);
}
assert.equal(new Set(all.map(entry => entry.id)).size, all.length);
// Only these bytes are required as ordinary files by the unmodified candidate tools.
for (const filename of PUBLIC_TARGETS) {
  const destination = path.join(snapshotDir, filename); await fs.mkdir(path.dirname(destination), { recursive: true });
  const bytes = readGit(filename); assert.equal(sha(bytes), publicInputHashes[filename]); await fs.writeFile(destination, bytes);
}
const report = { passed: true, snapshotOnly: true, generatedAt: new Date().toISOString(), baseCommit: options.base,
  gitTree: git(['rev-parse', `${options.base}^{tree}`]).toString().trim(), snapshotDir,
  snapshotPolicy: { files: PUBLIC_TARGETS, sourceTreesCopied: false, supplementalCataloguesCopied: false,
    remainingInputs: 'Read exact Git objects, verified with SHA-256; historical proofs remain in place.' },
  sourceTool: { path: 'scripts/advance-tracking-baseline.mjs', sha256: sha(await fs.readFile(fileURLToPath(import.meta.url))) },
  catalogues, records: all.length, sources: catalogues.reduce((sum, item) => sum + item.sources, 0), statuses: counts(all),
  openByPriority: Object.fromEntries(['P0', 'P1', 'P2'].map(priority => [priority, all.filter(entry => entry.priority === priority && entry.status !== 'Validé').length])),
  publicInputHashes, sourceHashes, historicalHashes,
  preservation: { historicalFiles: historical.length, publicFiles: publicFiles.length,
    publicPngs: publicFiles.filter(filename => filename.endsWith('.png')).length, allPublicBytesProtected: true,
    otherWorkbooks: otherWorkbooks.length, defaultProtectedAdvanced: catalogues.flatMap(catalogue => catalogue.advanced.map(entry => ({ catalogId: catalogue.id, entry }))),
    historicalToolPaths: sourcePaths.filter(filename => filename.startsWith('scripts/completion-') || filename.startsWith('scripts/continuation-')),
    rule: 'Every historical proof and historical tool keeps its original bytes. All existing Validé records and asset statuses are immutable. No criterion, dependency or asset is implicitly promoted.' } };
await fs.mkdir(path.dirname(output), { recursive: true }); await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, baseCommit: report.baseCommit, records: report.records,
  openByPriority: report.openByPriority, validated: report.statuses.Validé, publicFiles: publicFiles.length,
  historicalFiles: historical.length, snapshotFiles: PUBLIC_TARGETS.length, output: options.output }));
