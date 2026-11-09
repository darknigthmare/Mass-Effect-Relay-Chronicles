import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE_COMMIT, GLOBAL_PROOF, readAssets, sha } from './me1-prologue-enemies-workbook-data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const option = name => { const index = process.argv.indexOf(name); return index < 0 ? null : process.argv[index + 1]; };
const output = option('--output'); if (!output) throw new Error('Provide a separate --output candidate file.');
const source = 'public/assets/manifest.json', baselinePath = 'docs/qa/me1-prologue-enemies-workbook-baseline.json';
const baseline = JSON.parse(await fs.readFile(path.join(root, baselinePath)));
assert.equal(baseline.baselineCommit, BASE_COMMIT);
const originalBytes = await fs.readFile(path.join(root, source));
assert.equal(sha(originalBytes), baseline.sourceHashes[source]);
const previous = JSON.parse(originalBytes), manifest = structuredClone(previous), assets = await readAssets(root);
assert.equal(previous.assets.length, 26); assert.equal(previous.combatKeyPoses, 56);
for (const [filename, digest] of Object.entries(baseline.publicPNGHashes)) assert.equal(sha(await fs.readFile(path.join(root, filename))), digest);
for (const { key, kind, normalized, configPath, pngPath, pngSha256, artPath } of assets.families) {
  const data = normalized.combat;
  assert.ok(!manifest.assets.some(asset => asset.file === path.basename(pngPath)));
  const usage = key === 'jenkins'
    ? 'ME1 : quatre poses fixes de Jenkins avant sa perte scénaristique ; action utilisée par Couverture. Aucun pouvoir, costume ou cycle complet ajouté.'
    : key === 'creeper'
    ? 'ME1 : quatre poses fixes du rampant existant ; assaut organique conservé, aucun tir ou kit supplémentaire.'
    : 'ME1 : quatre poses fixes du commando asari générique existant ; Projection et Barrière conservées. Aucun clone du Thorien ni personnage nommé attribué.';
  manifest.assets.push({ file: path.basename(pngPath), width: data.width, height: data.height, mode: 'RGBA',
    sha256: pngSha256, assetStatus: 'Prototype', fidelity: 'Non validée 1:1', character: key,
    mediaId: 'ME1', periodId: 'me1', partial: true, primaryVisualVerified: false,
    origin: `Image générée à partir du prototype ${kind === 'companion' ? 'crew-atlas.png' : 'enemy-atlas.png'}. PNG natif conservé sans retouche ; référence corporelle primaire complète non obtenue.`,
    regions: Object.values(data.frames), animationConfig: configPath, usage,
    provenance: `docs/research/me1-prologue-enemies-${key}.md`, evidence: [artPath,
      'docs/qa/me1-prologue-enemies-sprites-final-report.json', 'docs/qa/me1-prologue-enemies-production-report.json', GLOBAL_PROOF] });
}
manifest.date = new Date().toISOString().slice(0, 10);
manifest.combatKeyPoses = 68; manifest.enemyCombatKeyPoses = 32; manifest.companionCombatKeyPoses = 28;
assert.deepEqual(manifest.assets.slice(0, previous.assets.length), previous.assets);
for (const key of ['version', 'coordinates', 'subjects', 'walkFrames', 'keyArtImages', 'seatedKeyPoses', 'terrainTextureCount']) assert.deepEqual(manifest[key], previous[key]);
const bytes = Buffer.from(JSON.stringify(manifest, null, 2) + '\n');
await fs.mkdir(path.dirname(path.resolve(output)), { recursive: true }); await fs.writeFile(output, bytes);
const report = { passed: true, at: new Date().toISOString(), baselineCommit: BASE_COMMIT,
  source: { path: source, sha256: sha(originalBytes) }, candidate: { path: path.resolve(output), sha256: sha(bytes) },
  previousCoreAssets: previous.assets.length, currentCoreAssets: manifest.assets.length,
  preservedPublicPNG: Object.keys(baseline.publicPNGHashes).length, currentPublicPNG: 34, newPNG: 3,
  combatKeyPoses: 68, enemyCombatKeyPoses: 32, companionCombatKeyPoses: 28, seatedKeyPoses: 2,
  terrainTextureCount: 2, assetSourceHashes: assets.sourceHashes,
  scope: 'Native asset metadata only. All26previous core declarations and31historicalPNG remain unchanged. This candidate does not promote catalogue records or certify gameplay or original1:1 bodies.' };
await fs.writeFile(path.join(root, 'docs/qa/me1-prologue-enemies-manifest-update.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, core: manifest.assets.length, newPNG: 3, combatKeyPoses: 68, candidate: path.resolve(output) }));
