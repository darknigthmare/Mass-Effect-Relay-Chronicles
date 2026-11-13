// Capture immutable inputs for a scoped completion lot. Never edits public data.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), options = {};
for (let index = 0; index < args.length; index += 2) {
  assert.ok(args[index + 1], `Missing value: ${args[index]}`);
  assert.ok(['--base', '--output', '--snapshot-dir'].includes(args[index]));
  options[args[index].slice(2)] = args[index + 1];
}
const base = options.base;
assert.match(base || '', /^[0-9a-f]{40}$/, 'Pass the exact --base SHA.');
assert.equal(execFileSync('git', ['rev-parse', `${base}^{commit}`], { cwd: root, encoding: 'utf8' }).trim(), base);
const output = path.resolve(root, options.output || 'docs/qa/completion-tracking-baseline.json');
const snapshotDir = path.resolve(options['snapshot-dir'] || '/tmp/completion-tracking-baseline');
for (const filename of [output, snapshotDir]) {
  try { await fs.access(filename); throw Error(`Preserve existing baseline: ${filename}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const readGit = filename => execFileSync('git', ['show', `${base}:${filename}`], { cwd: root, maxBuffer: 128 * 1024 * 1024 });
const tree = execFileSync('git', ['ls-tree', '-rz', base], { cwd: root, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 }).split('\0').filter(Boolean);
const blobs = new Map(tree.map(line => { const [metadata, filename] = line.split('\t'); return [filename, metadata.split(' ')[2]]; }));
const tracked = [...blobs.keys()];
const exactBaselineBytes = async filename => {
  try {
    const raw = await fs.readFile(path.join(root, filename));
    const gitBlob = crypto.createHash('sha1').update(`blob ${raw.length}\0`).update(raw).digest('hex');
    if (gitBlob === blobs.get(filename)) return raw;
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  return readGit(filename);
};
const manifestPath = 'docs/universe/manifest.json', manifestRaw = readGit(manifestPath), manifest = JSON.parse(manifestRaw);
const catalogues = [{ id: 'ME1', catalogPath: 'docs/content-catalog.json', workbookPath: 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx' },
  ...manifest.workbooks.map(workbook => ({ id: workbook.id, catalogPath: workbook.catalogPath,
    workbookPath: workbook.path || workbook.workbookPath || `docs/universe/outputs/relay-chronicles-20261022/${workbook.filename}` }))];
// The manifest gives a filename, while its output directory is part of the
// published layout. Resolve only an exact tracked filename if that layout moves.
for (const catalogue of catalogues) {
  if (!tracked.includes(catalogue.workbookPath)) {
    const matches = tracked.filter(filename => filename.endsWith(`/${path.basename(catalogue.workbookPath)}`));
    assert.equal(matches.length, 1, `Workbook not uniquely identified: ${catalogue.id}`);
    catalogue.workbookPath = matches[0];
  }
}
const critical = new Set([manifestPath, 'public/assets/manifest.json', ...catalogues.flatMap(item => [item.catalogPath, item.workbookPath])]);
const historical = tracked.filter(filename => filename.startsWith('docs/qa/') || filename.startsWith('docs/workbook-previews/'));
const pngs = tracked.filter(filename => filename.startsWith('public/') && filename.endsWith('.png'));
const otherWorkbooks = tracked.filter(filename => filename.endsWith('.xlsx') && filename !== catalogues[0].workbookPath);
const sourcePaths = tracked.filter(filename => /^(src\/|tests\/|scripts\/|desktop\/)/.test(filename) || ['package.json', 'package-lock.json', 'vite.config.js'].includes(filename));
const hashes = {}, sourceHashes = {}, historicalHashes = {};
await fs.mkdir(snapshotDir, { recursive: true });
for (const filename of new Set([...critical, ...pngs, ...otherWorkbooks, ...historical, ...sourcePaths])) {
  const raw = await exactBaselineBytes(filename), digest = hash(raw);
  if (critical.has(filename) || pngs.includes(filename) || otherWorkbooks.includes(filename)) hashes[filename] = digest;
  if (sourcePaths.includes(filename)) sourceHashes[filename] = digest;
  if (historical.includes(filename)) historicalHashes[filename] = digest;
  if (critical.has(filename)) {
    const destination = path.join(snapshotDir, filename); await fs.mkdir(path.dirname(destination), { recursive: true }); await fs.writeFile(destination, raw);
  }
}
const count = entries => Object.fromEntries(['Défini', 'Prototype', 'Intégré', 'Validé'].map(status => [status, entries.filter(entry => entry.status === status).length]));
const all = [];
for (const catalogue of catalogues) {
  const data = JSON.parse(readGit(catalogue.catalogPath));
  catalogue.records = data.entries.length; catalogue.statuses = count(data.entries); catalogue.sources = data.sources.length;
  catalogue.advanced = data.entries.filter(entry => ['Intégré', 'Validé'].includes(entry.status));
  all.push(...data.entries);
}
assert.equal(new Set(all.map(entry => entry.id)).size, all.length);
const report = { passed: true, snapshotOnly: true, generatedAt: new Date().toISOString(), baseCommit: base, snapshotDir,
  sourceTool: { path: 'scripts/completion-tracking-baseline.mjs', sha256: hash(await fs.readFile(fileURLToPath(import.meta.url))) },
  catalogues, records: all.length, sources: catalogues.reduce((sum, item) => sum + item.sources, 0), statuses: count(all),
  openByPriority: Object.fromEntries(['P0', 'P1', 'P2'].map(priority => [priority, all.filter(entry => entry.priority === priority && entry.status !== 'Validé').length])),
  publicInputHashes: hashes, sourceHashes, historicalHashes,
  preservation: { historicalFiles: historical.length, publicPngs: pngs.length, otherWorkbooks: otherWorkbooks.length,
    defaultProtectedAdvanced: catalogues.flatMap(catalogue => catalogue.advanced.map(entry => ({ catalogId: catalogue.id, entry }))),
    rule: 'No historical proof is rewritten. Existing Validé records remain unchanged. Any Intégré promotion requires an explicit reviewed scope and fresh evidence; no dependency or asset is auto-promoted.' } };
await fs.mkdir(path.dirname(output), { recursive: true }); await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, base, records: all.length, catalogues: catalogues.length, historicalFiles: historical.length, publicPngs: pngs.length, otherWorkbooks: otherWorkbooks.length, output: path.relative(root, output) }));
