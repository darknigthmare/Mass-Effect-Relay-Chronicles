// Append only validated companion PNG/config declarations. This script never
// changes image bytes or replaces existing manifest regions and metadata.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const option = name => { const at = process.argv.indexOf(name); return at < 0 ? null : process.argv[at + 1]; };
const root = path.resolve(option('--root') || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const input = path.resolve(option('--input') || path.join(root, 'public/assets/manifest.json'));
const output = option('--output'), reportOutput = option('--report');
if (!output || !reportOutput || path.resolve(output) === input) throw Error('Provide separate --output and --report paths; the source manifest is read-only.');
const allowed = ['ashley', 'kaidan', 'garrus', 'wrex', 'tali', 'liara'];
const selected = option('--characters')?.split(',') || allowed;
assert.ok(selected.length && new Set(selected).size === selected.length && selected.every(id => allowed.includes(id)));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const beforeBytes = await fs.readFile(input), before = JSON.parse(beforeBytes), after = structuredClone(before);
assert.ok(Array.isArray(before.assets));
assert.equal(new Set(before.assets.map(asset => asset.file)).size, before.assets.length);
const sourceHashes = {}, additions = [];
for (const asset of before.assets) {
  const rel = `public/assets/${asset.file}`, bytes = await fs.readFile(path.join(root, rel));
  assert.equal(sha(bytes), asset.sha256, `Historical PNG differs from its existing manifest: ${rel}`);
  sourceHashes[rel] = sha(bytes);
}
for (const character of selected) {
  const configPath = `public/assets/companion-${character}-animation.json`;
  const configBytes = await fs.readFile(path.join(root, configPath)), config = JSON.parse(configBytes), combat = config.combat;
  assert.equal(config.character, character); assert.equal(config.characterId, character); assert.equal(config.mediaId, 'ME1');
  assert.equal(path.basename(combat.file), combat.file);
  assert.ok(combat.file.startsWith(`companion-${character}-`) && combat.file.endsWith('.png'));
  assert.ok(!before.assets.some(asset => asset.file === combat.file), `Refuse duplicate or replacement asset ${combat.file}`);
  const imagePath = `public/assets/${combat.file}`, imageBytes = await fs.readFile(path.join(root, imagePath));
  assert.deepEqual([...imageBytes.subarray(0, 8)], [137,80,78,71,13,10,26,10]);
  assert.equal(imageBytes[24], 8); assert.equal(imageBytes[25], 6);
  assert.equal(imageBytes.readUInt32BE(16), combat.width); assert.equal(imageBytes.readUInt32BE(20), combat.height);
  assert.deepEqual(Object.keys(combat.frames).sort(), ['aim','down','hit','power']);
  const regions = Object.entries(combat.frames).map(([pose, frame]) => {
    const [x,y,w,h] = frame.rect || [], [px,py] = frame.pivot || [];
    assert.ok([x,y,w,h].every(Number.isInteger) && x>=0 && y>=0 && w>0 && h>0 && x+w<=combat.width && y+h<=combat.height);
    assert.ok([px,py].every(Number.isFinite) && px>=0 && py>=0 && px<=w && py<=h);
    assert.ok(typeof frame.id === 'string' && Number.isFinite(frame.heightScale) && frame.heightScale>0);
    return { ...frame, pose };
  });
  assert.equal(new Set(regions.map(region => region.id)).size, 4);
  sourceHashes[configPath] = sha(configBytes); sourceHashes[imagePath] = sha(imageBytes);
  const asset = { file: combat.file, width: combat.width, height: combat.height, mode: 'RGBA', sha256: sha(imageBytes),
    assetStatus: 'Prototype', fidelity: 'Non validée 1:1', character, mediaId: 'ME1', partial: true, primaryVisualVerified: false,
    origin: 'Image générée pour ce projet à partir de la silhouette ME1 de crew-atlas.png. PNG natif conservé sans retouche de pixels.',
    regions, animationConfig: configPath,
    usage: 'ME1 : visée, geste d’action, impact et hors combat en trois-quarts fixes. Les poses de terrain historiques restent distinctes.',
    provenance: 'docs/research/companion-combat-art.md', evidence: ['docs/qa/companion-combat-art-report.json', 'docs/qa/companion-combat-report.json'] };
  after.assets.push(asset); additions.push({ character, file: asset.file, configPath, sha256: asset.sha256, configSha256: sha(configBytes), poses: regions.length });
}
const oldPoseCount = before.assets.reduce((count, asset) => count + (asset.regions || []).filter(region => ['aim','power','hit','down'].includes(region.pose)).length, 0);
assert.equal(before.combatKeyPoses, oldPoseCount);
after.combatKeyPoses = oldPoseCount + selected.length * 4;
after.date = new Date().toISOString().slice(0, 10);
assert.deepEqual(after.assets.slice(0, before.assets.length), before.assets);
for (const key of Object.keys(before)) if (!['date','assets','combatKeyPoses'].includes(key)) assert.deepEqual(after[key], before[key]);
assert.equal(new Set(after.assets.map(asset => asset.file)).size, after.assets.length);
const afterBytes = Buffer.from(JSON.stringify(after, null, 2) + '\n');
await fs.mkdir(path.dirname(path.resolve(output)), { recursive: true });
await fs.writeFile(output, afterBytes);
assert.equal(sha(await fs.readFile(input)), sha(beforeBytes));
const report = { passed: true, generatedAt: new Date().toISOString(), sourceManifest: input, output: path.resolve(output),
  beforeSha256: sha(beforeBytes), afterSha256: sha(afterBytes), sourceHashes, selectedCharacters: selected, additions,
  previousAssetsPreserved: before.assets.length, newAssets: selected.length, previousCombatPoses: oldPoseCount,
  addedCombatPoses: selected.length * 4, combatKeyPoses: after.combatKeyPoses,
  unchangedMetrics: { subjects: before.subjects, walkFrames: before.walkFrames, keyArtImages: before.keyArtImages },
  scope: 'Manifest metadata and exact PNG/config hashes only. Pixel/alpha, native-scale and runtime visual acceptance are separate linked reports. No original-game 1:1 fidelity is certified.' };
await fs.mkdir(path.dirname(path.resolve(reportOutput)), { recursive: true });
await fs.writeFile(reportOutput, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, newAssets: report.newAssets, combatKeyPoses: report.combatKeyPoses, manifestSha256: report.afterSha256 }));
