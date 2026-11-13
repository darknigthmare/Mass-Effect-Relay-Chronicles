import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
export const ADVANCE_BASE_COMMIT = 'd2e8432ec4057890b6f86e42ce596f1ab5810148';
export const projectRoot = new URL('../', import.meta.url);
export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export async function filesBelow(directory, prefix = '') {
  const result = [];
  for (const item of await readdir(new URL(directory, projectRoot), { withFileTypes: true })) {
    const path = `${directory}${item.name}`;
    if (item.isDirectory()) result.push(...await filesBelow(`${path}/`, prefix));
    else result.push(path);
  }
  return result.sort();
}
export async function featureSourceFiles(extra = []) {
  // The generated catalogue index changes only after publication. Its separate
  // reproduction/registry/build gate is required after the workbook sync.
  return [...new Set([...(await filesBelow('src/')).filter(path => path !== 'src/universe-data.js'),
    ...(await filesBelow('desktop/')), 'index.html', 'package.json', 'package-lock.json', 'vite.config.js', 'public/assets/manifest.json', ...extra])].sort();
}
export async function sourceHashes(files) {
  return Object.fromEntries(await Promise.all(files.map(async path => [path, sha(await readFile(new URL(path, projectRoot)))])));
}
export async function snapshot(files, directory) {
  const hashes = {};
  for (const path of files) {
    const bytes = await readFile(new URL(path, projectRoot)), target = new URL(`${directory}/${path}`, projectRoot);
    await mkdir(new URL('./', target), { recursive: true });await writeFile(target, bytes);hashes[path] = sha(bytes);
  }
  return hashes;
}
