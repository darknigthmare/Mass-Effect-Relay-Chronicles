import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { universeFileStem, universeJsonFilename } from '../scripts/universe-paths.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
// Walk the source/document tree directly: this also works in source archives,
// and catches newly added files before they are staged. Never invoke Git.
const excludedDirectories = new Set([
  '.git', '.vercel', 'node_modules', 'dist', 'release',
  'test-results', 'playwright-report', '__pycache__',
]);

// https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file
function windowsNameProblem(name) {
  if (!name || /[<>:"/\\|?*\x00-\x1f]/u.test(name)) return 'invalid character';
  if (/[ .]$/u.test(name)) return 'trailing space or period';
  const stem = name.split('.')[0].trimEnd();
  if (/^(?:CON|PRN|AUX|NUL|COM[1-9¹²³]|LPT[1-9¹²³])$/iu.test(stem)) return 'reserved device';
  return null;
}

async function inspectTree(relative = '') {
  const issues = [];
  const paths = [];
  const folded = new Map();
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    if (excludedDirectories.has(entry.name)) continue;
    const filename = relative ? `${relative}/${entry.name}` : entry.name;
    paths.push(filename);
    const problem = windowsNameProblem(entry.name);
    if (problem) issues.push(`${filename}: ${problem}`);
    const key = entry.name.toLowerCase();
    if (folded.has(key)) issues.push(`${filename}: case collision with ${folded.get(key)}`);
    folded.set(key, filename);
    // Do not follow symlinks outside the repository.
    if (entry.isDirectory()) {
      const child = await inspectTree(filename);
      paths.push(...child.paths);
      issues.push(...child.issues);
    }
  }
  return { paths, issues };
}

test('universe filename resolver keeps work IDs separate from portable file names', () => {
  assert.equal(universeFileStem('CON'), 'CONVICTION');
  assert.equal(universeJsonFilename('CON'), 'CONVICTION.json');
  assert.equal(universeJsonFilename('ME2'), 'ME2.json');
  for (const id of ['AUX', 'NUL', 'PRN', 'COM1', 'LPT9', '../CON', 'CON.json']) {
    assert.throws(() => universeJsonFilename(id), undefined, id);
  }
});

test('Windows component guard catches device aliases, extensions and invalid characters', () => {
  for (const name of [
    'CON', 'con.JSON', 'PRN', 'AUX.txt', 'NUL.tar.gz', 'CON .json',
    'COM1.json', 'com9', 'LPT1', 'lpt9.json', 'COM¹.txt', 'COM²', 'COM³',
    'LPT¹', 'LPT².json', 'LPT³', 'bad<name', 'bad>name', 'bad:name',
    'bad"name', 'bad/name', 'bad\\name', 'bad|name', 'bad?name', 'bad*name',
    'bad\u0000name', 'bad\u001fname', 'trailing ', 'trailing.',
  ]) assert.ok(windowsNameProblem(name), name);
  for (const name of ['CONVICTION.json', 'CON-archive.json', 'COM10.json', 'LPT10.json', '.gitignore', 'Mass_Effect_Conviction_Production.xlsx']) {
    assert.equal(windowsNameProblem(name), null, name);
  }
  assert.ok('docs/PRN/file.json'.split('/').some(windowsNameProblem), 'Directory components must also be checked.');
});

test('repository source and document paths are Windows compatible without case collisions', async () => {
  const { paths, issues } = await inspectTree();
  assert.ok(paths.includes('docs/universe/catalogs/CONVICTION.json'), 'The catalogue tree must be scanned.');
  assert.ok(paths.includes('docs/universe/qa/CONVICTION.json'), 'The QA tree must be scanned.');
  assert.deepEqual(issues, [], issues.join('\n'));
});

test('manifest resolves every catalogue and QA file, including internal work ID CON', async () => {
  const manifest = JSON.parse(await readFile(path.join(root, 'docs/universe/manifest.json'), 'utf8'));
  assert.equal(manifest.workbooks.length, 27);
  for (const record of manifest.workbooks) {
    const filename = universeJsonFilename(record.id);
    assert.equal(record.catalogPath, `docs/universe/catalogs/${filename}`);
    assert.equal(record.qaPath, `docs/universe/qa/${filename}`);
    const bytes = await readFile(path.join(root, record.catalogPath));
    assert.equal(JSON.parse(bytes).id, record.id);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), record.catalogSha256);
    const qa = JSON.parse(await readFile(path.join(root, record.qaPath), 'utf8'));
    assert.equal(qa.id, record.id);
  }
  const conviction = manifest.workbooks.find(record => record.id === 'CON');
  assert.equal(conviction.catalogPath, 'docs/universe/catalogs/CONVICTION.json');
  assert.equal(conviction.qaPath, 'docs/universe/qa/CONVICTION.json');
  assert.equal(conviction.filename, 'Mass_Effect_Conviction_Production.xlsx');
});
