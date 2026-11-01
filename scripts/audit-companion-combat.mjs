import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { COMPANION_ANIMATION_IDS, normalizeCompanionAnimation } from '../src/companion-animation-data.js';
import { EXPANSION_ALL_ENTRIES, runExpansionTrial } from '../src/expansion.js';
import { UNIVERSE_SUMMARY } from '../src/universe-data.js';
import { getUniverseEquipment } from '../src/universe-equipment.js';

const root = new URL('../', import.meta.url), bytes = path => readFile(new URL(path, root));
const hash = value => createHash('sha256').update(value).digest('hex');
const load = async path => JSON.parse(await bytes(path));
const baseline = await load('docs/qa/companion-combat-baseline.json');
const beforeFile = path => execFileSync('git', ['show', `${baseline.baselineCommit}:${path}`], { cwd: fileURLToPath(root), maxBuffer: 16 * 1024 * 1024 });
const report = { passed: false, generatedAt: new Date().toISOString(), baseline: baseline.baselineCommit,
  scope: 'Six existing ME1 companion sprite families, their source tracking and five explicit Legendary ME2 preparations. Old Simulation results and retained files are checked against their published evidence; this is not complete original-game fidelity.',
  sourceHashes: {}, families: [], previousTrialReplays: [], previousClosures: [], preserved: {}, errors: [] };
try {
  const sourcePaths = ['src/world.js', 'src/companion-animation-data.js', 'vite.config.js',
    'src/universe-data.js', 'src/universe-equipment.js', 'src/universe-equipment-scenarios.js',
    'src/combat.js', 'src/character-data.js', 'src/state.js', 'src/main.js', 'src/expansion.js',
    'docs/content-catalog.json', 'public/assets/manifest.json', 'scripts/audit-companion-combat.mjs',
    'docs/qa/companion-combat-baseline.json',
    ...COMPANION_ANIMATION_IDS.flatMap(key => [`public/assets/companion-${key}-animation.json`, `public/assets/companion-${key}-combat.png`])];
  for (const path of sourcePaths) report.sourceHashes[path] = hash(await bytes(path));
  assert.equal(UNIVERSE_SUMMARY.recordCount, 6708); assert.equal(UNIVERSE_SUMMARY.sourceCount, 454);
  const oldCatalogue = JSON.parse(beforeFile('docs/content-catalog.json')), catalogue = await load('docs/content-catalog.json');
  assert.equal(catalogue.entries.length, 1382); assert.equal(catalogue.categories.length, 26);
  const oldEntries = new Map(oldCatalogue.entries.map(entry => [entry.id, entry]));
  const changed = [];
  for (const entry of catalogue.entries) {
    const old = oldEntries.get(entry.id); assert.ok(old, entry.id);
    assert.equal(entry.status, old.status); assert.equal(entry.assetStatus, old.assetStatus);
    assert.equal(entry.nature, old.nature);
    if (JSON.stringify(entry) === JSON.stringify(old)) continue;
    changed.push(entry.id);
    assert.equal(entry.category, 'sprites'); assert.match(entry.id, /^SPR-/);
    const allowed = new Set(['description', 'acceptance', 'assetPath', 'notes', 'implementationPaths', 'evidence']);
    for (const key of new Set([...Object.keys(entry), ...Object.keys(old)]))
      if (!allowed.has(key)) assert.deepEqual(entry[key], old[key], `${entry.id}/${key}`);
    assert.match(entry.assetPath, /^public\/assets\/companion-(ashley|kaidan|garrus|tali|wrex|liara)-combat\.png$/);
  }
  assert.equal(changed.length, 6);
  report.catalogue = { entries: catalogue.entries.length, changedSpriteIds: changed,
    otherEntriesUnchanged: catalogue.entries.length - changed.length, statusPromotions: 0 };
  const oldManifest = JSON.parse(beforeFile('public/assets/manifest.json')), manifest = await load('public/assets/manifest.json');
  for (const old of oldManifest.assets) assert.deepEqual(manifest.assets.find(asset => asset.file === old.file), old, old.file);
  assert.equal(manifest.assets.length, oldManifest.assets.length + 6);
  assert.equal(manifest.combatKeyPoses, 32); assert.equal(manifest.walkFrames, oldManifest.walkFrames);
  assert.equal(manifest.subjects, oldManifest.subjects);
  for (const key of COMPANION_ANIMATION_IDS) {
    const path = `public/assets/companion-${key}-animation.json`, config = await load(path);
    const normalized = normalizeCompanionAnimation(key, config); assert.ok(normalized, key);
    assert.equal(Object.keys(normalized.combat.frames).length, 4);
    const item = manifest.assets.find(asset => asset.file === normalized.combat.file);
    assert.ok(item, key); assert.equal(item.sha256, report.sourceHashes[`public/assets/${item.file}`]);
    assert.equal(item.regions.length, 4);
    report.families.push({ character: key, path, frames: Object.values(normalized.combat.frames), atlasSha256: item.sha256 });
  }
  const immutable = JSON.stringify(EXPANSION_ALL_ENTRIES);
  for (const prefix of ['expansion', 'expansion2', 'expansion3']) {
    const path = `docs/qa/${prefix}-native-report.json`, prior = await load(path); assert.equal(prior.passed, true);
    for (const card of prior.cards) {
      const trial = runExpansionTrial(card.id, card.testedContext, card.testedOptions);
      assert.equal(trial.ok, card.executable, card.id);
      if (trial.ok) {
        assert.deepEqual(trial.result, card.result, card.id); assert.deepEqual(trial.control, card.control, card.id);
        report.previousTrialReplays.push({ id: card.id, exact: true, evidence: path,
          sha256: hash(JSON.stringify([trial.result, trial.control])) });
      } else report.previousClosures.push({ id: card.id, stillClosed: true });
    }
  }
  assert.equal(report.previousTrialReplays.length, 280); assert.equal(report.previousClosures.length, 218);
  assert.equal(JSON.stringify(EXPANSION_ALL_ENTRIES), immutable);
  const additions = ['PHALANX', 'LOCUST', 'MATTOCK', 'EVISCERATOR', 'INCISOR'].map(suffix => `ME2-WPN-${suffix}`);
  for (const id of additions) {
    const item = getUniverseEquipment(id);
    assert.equal(item.runtimeSupported, true); assert.equal(item.requiredEditionProfile, 'legendary');
    assert.equal(item.weaponSystem, 'thermal-clip');
  }
  assert.equal(getUniverseEquipment('ME2-WPN-COLLECTOR-RIFLE').runtimeSupported, false);
  report.legendaryWeapons = additions;
  for (const [path, expected] of Object.entries(baseline.digests)) {
    assert.equal(hash(await bytes(path)), expected, `Retained file changed: ${path}`); report.preserved[path] = expected;
  }
  report.passed = true;
} catch (error) { report.errors.push(error.stack || String(error)); }
await writeFile(new URL('docs/qa/companion-combat-native-report.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, families: report.families.length,
  oldResultsExact: report.previousTrialReplays.length, oldClosures: report.previousClosures.length,
  preserved: Object.keys(report.preserved).length, errors: report.errors }));
if (!report.passed) process.exitCode = 1;
