// Declare four native files; do not change any prior PNG or image pixels.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE_COMMIT, readAssets, sha } from './eden-immersion-workbook-data.mjs';
const option = name => { const i = process.argv.indexOf(name); return i < 0 ? null : process.argv[i + 1]; };
const root = path.resolve(option('--root') || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const input = path.resolve(option('--input') || path.join(root, 'public/assets/manifest.json'));
const output = option('--output'), reportPath = option('--report');
if (!output || !reportPath || path.resolve(output) === input) throw Error('Provide separate --output and --report files.');
const baseline = JSON.parse(await fs.readFile(path.join(root, 'docs/qa/eden-immersion-workbook-baseline.json')));
assert.equal(baseline.baselineCommit, BASE_COMMIT);
const beforeRaw = await fs.readFile(input), before = JSON.parse(beforeRaw), after = structuredClone(before);
assert.equal(sha(beforeRaw), baseline.sourceHashes['public/assets/manifest.json']);
assert.equal(before.assets.length, 22); assert.equal(before.combatKeyPoses, 48); assert.equal(before.enemyCombatKeyPoses, 16);
const historical = {};
for (const [rel, expected] of Object.entries(baseline.historicalPublicPNG)) {
  const actual = sha(await fs.readFile(path.join(root, rel))); assert.equal(actual, expected, rel); historical[rel] = actual;
}
assert.equal(Object.keys(historical).length, 27);
for (const asset of before.assets) assert.equal(asset.sha256, historical[`public/assets/${asset.file}`]);
const assets = await readAssets(root), additions = [];
for (const item of assets.enemies) {
  const asset = { file: path.basename(item.pngPath), width: item.data.width, height: item.data.height, mode: 'RGBA',
    sha256: assets.sourceHashes[item.pngPath], assetStatus: 'Prototype', fidelity: 'Non validée 1:1',
    character: item.key, mediaId: 'ME1', periodId: 'me1', partial: true, primaryVisualVerified: false,
    origin: 'Image générée pour ce projet à partir du prototype enemy-atlas.png. PNG natif conservé sans retouche de pixels ; aucune référence primaire complète de corps obtenue.',
    regions: item.regions, animationConfig: item.configPath,
    usage: 'ME1 : quatre poses clés fixes du personnage ennemi existant. Aucun nouveau comportement, statistique ou cycle complet déduit des images.',
    provenance: `docs/research/eden-immersion-${item.key}.md`,
    evidence: [`docs/qa/eden-immersion-${item.key}-art.json`, 'docs/qa/eden-immersion-sprites-report.json', 'docs/qa/eden-immersion-report.json'] };
  assert.ok(!before.assets.some(old => old.file === asset.file)); after.assets.push(asset);
  additions.push({ key: item.key, file: asset.file, kind: 'enemy-fixed-poses', drawnPoses: 4, sha256: asset.sha256, configPath: item.configPath, configSha256: assets.sourceHashes[item.configPath] });
}
for (const item of assets.textures) {
  const asset = { file: path.basename(item.pngPath), width: item.width, height: item.height, mode: item.mode,
    sha256: assets.sourceHashes[item.pngPath], assetStatus: 'Prototype', fidelity: 'Matériau original du projet, non certifié 1:1',
    mediaId: 'ME1', periodId: 'me1', partial: true, primaryVisualVerified: false, terrainTexture: true,
    origin: 'Texture générée pour les surfaces 3D du projet. Sortie native conservée sans retouche de pixels.',
    regions: [{ id: `eden-ground-${item.key}`, kind: 'terrain-texture', rect: [0, 0, item.width, item.height], status: 'Prototype' }],
    usage: `Texture de ${item.key === 'grass' ? 'prairie' : 'terre'} du nouvel Eden Prime, appliquée aux surfaces 3D ; aucun nouvel objet ou lieu canonique. Répétition à contrôler dans le jeu, sans matériau PBR original certifié.`,
    provenance: 'docs/research/eden-immersion-terrain-art.md',
    evidence: ['docs/qa/eden-immersion-terrain-art.json', 'docs/qa/eden-immersion-report.json'] };
  assert.ok(!before.assets.some(old => old.file === asset.file)); after.assets.push(asset);
  additions.push({ key: item.key, file: asset.file, kind: 'terrain-texture', width: item.width, height: item.height, sha256: asset.sha256 });
}
after.date = new Date().toISOString().slice(0, 10); after.combatKeyPoses = 56; after.enemyCombatKeyPoses = 24; after.terrainTextureCount = 2;
assert.deepEqual(after.assets.slice(0, 22), before.assets); assert.equal(after.assets.length, 26);
assert.equal(new Set(after.assets.map(asset => asset.file)).size, 26);
for (const key of Object.keys(before)) if (!['date', 'assets', 'combatKeyPoses', 'enemyCombatKeyPoses'].includes(key)) assert.deepEqual(after[key], before[key]);
const raw = Buffer.from(JSON.stringify(after, null, 2) + '\n');
await fs.mkdir(path.dirname(path.resolve(output)), { recursive: true }); await fs.writeFile(output, raw);
assert.equal(sha(await fs.readFile(input)), sha(beforeRaw));
const report = { passed: true, generatedAt: new Date().toISOString(), baselineCommit: BASE_COMMIT,
  sourceManifest: input, output: path.resolve(output), beforeSha256: sha(beforeRaw), afterSha256: sha(raw),
  sourceHashes: { ...historical, ...assets.sourceHashes }, additions,
  previousManifestAssetsPreserved: 22, previousPublicPNGPreserved: 27, newPNG: 4,
  newCombatKeyPoses: 8, combatKeyPoses: 56, enemyCombatKeyPoses: 24, seatedKeyPoses: before.seatedKeyPoses,
  terrainTextureCount: 2, manifestAssets: 26, unchangedMetrics: { subjects: before.subjects, walkFrames: before.walkFrames, keyArtImages: before.keyArtImages },
  limits: ['Generated poses are fixed prototype drawings, not full movement cycles or original-game likeness certification.',
    'Terrain textures decorate actual3D meshes; no new canonical character, map level or pilotable vehicle is counted.'] };
await fs.mkdir(path.dirname(path.resolve(reportPath)), { recursive: true }); await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, assets: 26, newPNG: 4, combatKeyPoses: 56, terrainTextures: 2, historicalPNGPreserved: 27 }));
