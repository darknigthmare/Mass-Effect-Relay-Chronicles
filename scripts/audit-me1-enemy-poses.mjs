import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { ENEMY_ANIMATION_IDS, normalizeEnemyAnimation } from '../src/enemy-animation-data.js';
import { normalizeJokerSeated } from '../src/joker-seated-data.js';
import { UNIVERSE_SUMMARY } from '../src/universe-data.js';
const root = new URL('../', import.meta.url), baseline = '05d1f030dab0925d57d4ba8c5bdb9ccde8db1ad0';
const bytes = path => readFile(new URL(path, root)), sha = value => createHash('sha256').update(value).digest('hex');
const json = async path => JSON.parse(await bytes(path));
const old = path => execFileSync('git', ['show', `${baseline}:${path}`], { cwd: root, maxBuffer: 32 * 1024 * 1024 });
const mutable = new Set(['README.md', 'docs/ASSETS.md', 'docs/FIDELITY.md', 'docs/IMPLEMENTATION_STATUS.md',
  'docs/CHRONICLES.md', 'docs/content-catalog.json', 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx',
  'public/assets/manifest.json', 'src/world.js', 'src/universe-data.js', 'src/universe-equipment.js',
  'src/universe-equipment-scenarios.js', 'vite.config.js', 'tests/legendary-weapon-access.test.js']);
const entries = {
  'SPR-soldat-geth-ennemi': 'geth', 'SPR-sniper-geth-ennemi': 'geth-sniper',
  'SPR-destructeur-geth-ennemi': 'geth-destroyer', 'SPR-husk-ennemi': 'husk', 'SPR-NPC-joker-assis': 'joker',
};
const report = { passed: false, generatedAt: new Date().toISOString(), baseline,
  scope: 'Five existing sprite records and native render families. All baseline files outside the explicit mutable delivery scope remain byte-identical; this is not a complete original-game fidelity certification.',
  sourceHashes: {}, catalogue: {}, families: [], preserved: {}, historicalPNG: [], errors: [] };
try {
  const before = JSON.parse(old('docs/content-catalog.json')), current = await json('docs/content-catalog.json');
  assert.equal(current.entries.length, 1382); assert.deepEqual(current.categories, before.categories);
  const former = new Map(before.entries.map(entry => [entry.id, entry]));
  const changed = [], allowed = new Set(['status', 'assetStatus', 'description', 'acceptance', 'assetPath', 'gameKey', 'notes', 'implementationPaths', 'evidence']);
  for (const entry of current.entries) {
    const prior = former.get(entry.id); assert.ok(prior, entry.id);
    if (!entries[entry.id]) { assert.deepEqual(entry, prior, entry.id); continue; }
    changed.push(entry.id); assert.equal(prior.status, 'Défini'); assert.equal(entry.status, 'Prototype'); assert.equal(entry.assetStatus, 'Prototype');
    for (const key of new Set([...Object.keys(entry), ...Object.keys(prior)]))
      if (!allowed.has(key)) assert.deepEqual(entry[key], prior[key], `${entry.id}/${key}`);
    assert.ok(entry.assetPath); for (const path of [entry.assetPath, ...entry.implementationPaths, ...entry.evidence]) await bytes(path);
  }
  assert.deepEqual(changed.sort(), Object.keys(entries).sort());
  report.catalogue = { entries: 1382, changedSpriteIds: changed, otherEntriesUnchanged: 1377, explicitPrototypePromotions: 5,
    integratedOrValidatedPromotions: 0, oldStatuses: {}, currentStatuses: {} };
  for (const [list, tally] of [[before.entries, report.catalogue.oldStatuses], [current.entries, report.catalogue.currentStatuses]])
    for (const entry of list) tally[entry.status] = (tally[entry.status] || 0) + 1;
  const beforeManifest = JSON.parse(old('public/assets/manifest.json')), manifest = await json('public/assets/manifest.json');
  assert.equal(beforeManifest.assets.length, 17); assert.equal(manifest.assets.length, 22);
  assert.deepEqual(manifest.assets.slice(0, 17), beforeManifest.assets);
  for (const key of ['subjects', 'walkFrames', 'keyArtImages']) assert.deepEqual(manifest[key], beforeManifest[key]);
  assert.equal(manifest.combatKeyPoses, 48); assert.equal(manifest.enemyCombatKeyPoses, 16); assert.equal(manifest.seatedKeyPoses, 2);
  const sourcePaths = ['scripts/audit-me1-enemy-poses.mjs', 'src/world.js', 'src/enemy-animation-data.js', 'src/joker-seated-data.js',
    'src/companion-animation-data.js', 'src/universe-data.js', 'src/universe-equipment.js', 'src/universe-equipment-scenarios.js',
    'vite.config.js', 'docs/content-catalog.json', 'public/assets/manifest.json', 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx'];
  for (const key of [...ENEMY_ANIMATION_IDS, 'joker']) {
    const png = `public/assets/${key === 'joker' ? 'joker-seated.png' : `enemy-${key}-combat.png`}`;
    const metadata = `public/assets/${key === 'joker' ? 'joker-seated.json' : `enemy-${key}-animation.json`}`;
    const config = key === 'joker' ? normalizeJokerSeated(await json(metadata)) : normalizeEnemyAnimation(key, await json(metadata));
    assert.ok(config, key); const frames = key === 'joker' ? config.frames : config.combat.frames;
    const item = manifest.assets.find(asset => asset.file === png.split('/').pop()); assert.ok(item, key);
    assert.equal(item.sha256, sha(await bytes(png))); assert.equal(item.regions.length, key === 'joker' ? 2 : 4);
    assert.equal(item.assetStatus, 'Prototype'); assert.equal(item.primaryVisualVerified, false);
    report.families.push({ key, png, metadata, frames, runtimeSeatedStates: key === 'joker' ? ['idle'] : undefined });
    sourcePaths.push(png, metadata);
  }
  assert.equal(UNIVERSE_SUMMARY.recordCount, 6708); assert.equal(UNIVERSE_SUMMARY.sourceCount, 454);
  for (const path of sourcePaths) report.sourceHashes[path] = sha(await bytes(path));
  const tree = execFileSync('git', ['ls-tree', '-r', '-z', baseline], { cwd: root, maxBuffer: 32 * 1024 * 1024 }).toString().split('\0').filter(Boolean);
  for (const entry of tree) {
    const [info, path] = entry.split('\t'), [mode, type, object] = info.split(' ');
    if (mutable.has(path)) continue;
    assert.equal(type, 'blob', path); assert.notEqual(mode, '120000', path);
    const current = await bytes(path), gitHash = createHash('sha1').update(`blob ${current.length}\0`).update(current).digest('hex');
    assert.equal(gitHash, object, `Historical file changed outside delivery scope: ${path}`);
    report.preserved[path] = sha(current);
    if (path.startsWith('public/assets/') && path.endsWith('.png')) report.historicalPNG.push({ path, sha256: sha(current), exact: true });
  }
  assert.equal(report.historicalPNG.length, 22);
  report.manifest = { assets: 22, oldCoreAssetsPreserved: 17, historicalPublicPNGPreserved: 22,
    combatKeyPoses: 48, addedEnemyCombatKeyPoses: 16, seatedDrawings: 2, newPNG: 5 };
  report.passed = true;
} catch (error) { report.errors.push(error.stack || String(error)); }
await writeFile(new URL('docs/qa/me1-enemy-poses-native-report.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, families: report.families.length, historicalPNG: report.historicalPNG.length,
  protectedFiles: Object.keys(report.preserved).length, catalogue: report.catalogue, errors: report.errors }));
if (!report.passed) process.exitCode = 1;
