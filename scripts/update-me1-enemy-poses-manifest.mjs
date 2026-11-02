// Append five native PNG declarations, preserving all earlier asset bytes and
// regions. This authoring tool never edits pixels or supplies combat behavior.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE_COMMIT, SUBJECTS, readSubject, sha } from './me1-enemy-poses-workbook-data.mjs';

const option = name => { const at = process.argv.indexOf(name); return at < 0 ? null : process.argv[at + 1]; };
const root = path.resolve(option('--root') || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const input = path.resolve(option('--input') || path.join(root, 'public/assets/manifest.json'));
const output = option('--output'), reportPath = option('--report');
if (!output || !reportPath || path.resolve(output) === input) throw Error('Provide separate --output and --report paths.');
const baselinePath = path.join(root, 'docs/qa/me1-enemy-poses-workbook-baseline.json');
const baseline = JSON.parse(await fs.readFile(baselinePath)); assert.equal(baseline.baselineCommit, BASE_COMMIT);
const beforeBytes = await fs.readFile(input), before = JSON.parse(beforeBytes), after = structuredClone(before);
assert.equal(sha(beforeBytes), baseline.sourceHashes['public/assets/manifest.json']);
assert.equal(before.assets.length, 17); assert.equal(before.combatKeyPoses, 32);
const sourceHashes = {};
for (const [rel, expected] of Object.entries(baseline.historicalPublicPNG)) {
  const actual = sha(await fs.readFile(path.join(root, rel))); assert.equal(actual, expected, `Historical PNG changed: ${rel}`); sourceHashes[rel] = actual;
}
for (const asset of before.assets) assert.equal(asset.sha256, sourceHashes[`public/assets/${asset.file}`]);
const additions = [];
for (const key of Object.keys(SUBJECTS)) {
  const subject = await readSubject(root, key), { joker, assetPath, configPath, data, regions, hashes } = subject;
  assert.ok(!before.assets.some(asset => `public/assets/${asset.file}` === assetPath), `Refuse asset replacement: ${assetPath}`);
  Object.assign(sourceHashes, hashes);
  const file = path.basename(assetPath);
  const asset = { file, width: data.width, height: data.height, mode: 'RGBA', sha256: hashes[assetPath],
    assetStatus: 'Prototype', fidelity: 'Non validée 1:1', character: key, mediaId: 'ME1', periodId: 'me1',
    partial: true, primaryVisualVerified: false,
    origin: `Image générée pour ce projet à partir de ${joker ? 'la silhouette ME1 de npc-atlas.png' : 'la silhouette ME1 de enemy-atlas.png'}. PNG natif conservé sans retouche de pixels.`,
    regions, animationConfig: configPath,
    usage: joker ? 'Deux dessins assis idle/pilot ; idle utilisé au cockpit du Normandy. Le dessin pilot ne certifie pas un second état jouable ou un cycle. Portraits historiques conservés.'
      : 'ME1 uniquement : visée, action, impact et hors combat en trois-quarts fixes. Aucun nouveau comportement ou mouvement complet accordé par les dessins.',
    provenance: `docs/research/me1-enemy-poses-${key}.md`, evidence: [`docs/qa/me1-enemy-poses-${key}-art.json`, 'docs/qa/me1-enemy-poses-world-report.json', 'docs/qa/me1-enemy-poses-report.json'] };
  after.assets.push(asset); additions.push({ key, file, configPath, sha256: asset.sha256, configSha256: hashes[configPath], drawnPoses: regions.length });
}
after.combatKeyPoses = 48; after.enemyCombatKeyPoses = 16; after.seatedKeyPoses = 2;
after.date = new Date().toISOString().slice(0, 10);
const regionIDs = after.assets.slice(before.assets.length).flatMap(asset => asset.regions.map(region => region.id));
assert.equal(new Set(regionIDs).size, 18);
assert.deepEqual(after.assets.slice(0, before.assets.length), before.assets);
assert.equal(new Set(after.assets.map(asset => asset.file)).size, after.assets.length);
for (const key of Object.keys(before)) if (!['date','assets','combatKeyPoses'].includes(key)) assert.deepEqual(after[key], before[key]);
const outputBytes = Buffer.from(JSON.stringify(after, null, 2) + '\n');
await fs.mkdir(path.dirname(path.resolve(output)), { recursive: true }); await fs.writeFile(output, outputBytes);
assert.equal(sha(await fs.readFile(input)), sha(beforeBytes));
const report = { passed: true, generatedAt: new Date().toISOString(), baselineCommit: BASE_COMMIT,
  sourceManifest: input, output: path.resolve(output), beforeSha256: sha(beforeBytes), afterSha256: sha(outputBytes), sourceHashes,
  additions, previousManifestAssetsPreserved: before.assets.length, previousPublicPNGPreserved: Object.keys(baseline.historicalPublicPNG).length,
  newPNG: 5, newCombatKeyPoses: 16, newSeatedDrawings: 2, runtimeSeatedStatesClaimed: ['idle'],
  combatKeyPoses: 48, seatedKeyPoses: 2, manifestAssets: after.assets.length,
  unchangedMetrics: { subjects: before.subjects, walkFrames: before.walkFrames, keyArtImages: before.keyArtImages },
  limits: ['No original-game1:1 fidelity, full movement cycle or new canonical identity is certified.', 'Joker pilot is a produced drawing, not a separately validated runtime animation.'] };
await fs.mkdir(path.dirname(path.resolve(reportPath)), { recursive: true }); await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, assets: after.assets.length, combatKeyPoses: 48, seatedDrawings: 2, historicalPNGPreserved: report.previousPublicPNGPreserved }));
