import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { access, readFile, writeFile } from 'node:fs/promises';
import { COMPANION_ANIMATION_IDS, normalizeCompanionAnimation } from '../src/companion-animation-data.js';
import { ENEMY_ANIMATION_IDS, normalizeEnemyAnimation } from '../src/enemy-animation-data.js';
import viteConfig from '../vite.config.js';

const root = new URL('../', import.meta.url), baseline = 'd19197ff43facd066abcc6ff4611e0ce0148609b';
const prefix = process.env.ME1_RUNTIME_PREFIX || 'me1-prologue-enemies-runtime-final';
assert.match(prefix, /^me1-prologue-enemies-runtime-[a-z0-9-]+$/);
const reportPath = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(reportPath); throw Error('Existing runtime evidence must be preserved; use a new ME1_RUNTIME_PREFIX.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const sha = value => createHash('sha256').update(value).digest('hex'), bytes = path => readFile(new URL(path, root));
const testFiles = ['tests/companion-combat-world.test.js', 'tests/me1-enemy-poses.test.js',
  'tests/noveria-occlusion.test.js', 'tests/me1-prologue-enemies.test.js'];
const artFiles = ['public/assets/companion-jenkins-combat.png', 'public/assets/companion-jenkins-animation.json',
  ...['creeper', 'asari'].flatMap(key => [`public/assets/enemy-${key}-combat.png`, `public/assets/enemy-${key}-animation.json`])];
const paths = ['src/world.js', 'src/companion-animation-data.js', 'src/enemy-animation-data.js', 'vite.config.js',
  'scripts/verify-me1-prologue-enemies-runtime.mjs', ...testFiles, ...artFiles];
const unchangedModules = ['src/state.js', 'src/combat.js', 'src/game-data.js', 'src/story.js', 'src/story-data.js',
  'src/loadout.js', 'src/character-data.js', 'src/world-data.js', 'src/level-layout-data.js', 'src/world-navigation.js'];
const sourceHashes = {};
for (const path of [...paths, ...unchangedModules]) sourceHashes[path] = sha(await bytes(path));
const previousRuntimePath = 'docs/qa/me1-prologue-enemies-runtime-report.json';
const previousRuntimeBytes = await bytes(previousRuntimePath), previousRuntime = JSON.parse(previousRuntimeBytes);
assert.equal(previousRuntime.passed, true); assert.equal(previousRuntime.tests, 28);
const archivePath = 'docs/qa/me1-prologue-enemies-before-feros-fix-source/snapshot-manifest.json';
const archived = JSON.parse(await bytes(archivePath));
const archivedWorld = archived.files.find(file => file.originalPath === 'src/world.js');
assert.equal(sha(await bytes(archivedWorld.path)), archivedWorld.sha256);
assert.equal(previousRuntime.sourceHashes['src/world.js'], archivedWorld.sha256);
const oldPillars = '      for (const x of [-10, 10]) { this._box(1.3, 11, 2.8, trim, x, 5.5, z); this._rectCollider(x, z, 1.3, 2.8); }';
const newPillars = `      for (const x of [-10, 10]) {
        const pillar = this._box(1.3, 11, 2.8, trim, x, 5.5, z);
        if (x > 0) {
          pillar.userData.keep = true; pillar.userData.combatOccluder = true;
          pillar.visible = this.mode !== 'combat'; this.combatOccluders.push(pillar);
        }
        this._rectCollider(x, z, 1.3, 2.8);
      }`;
const previousWorldText = (await bytes(archivedWorld.path)).toString();
assert.equal(previousWorldText.split(oldPillars).length, 2);
assert.equal((await bytes('src/world.js')).toString(), previousWorldText.replace(oldPillars, newPillars));
for (const path of unchangedModules) {
  const old = execFileSync('git', ['show', `${baseline}:${path}`], { cwd: root });
  assert.equal(sha(old), sourceHashes[path], `The visual lot must preserve ${path}`);
}
assert.equal(COMPANION_ANIMATION_IDS.length, 7); assert.equal(ENEMY_ANIMATION_IDS.length, 8);
const bundledCompanions = JSON.parse(viteConfig.define.__RELAY_COMPANION_ANIMATIONS__);
const bundledEnemies = JSON.parse(viteConfig.define.__RELAY_ENEMY_ANIMATIONS__);
assert.deepEqual(bundledCompanions.map(config => config.characterId), [...COMPANION_ANIMATION_IDS]);
assert.deepEqual(bundledEnemies.map(config => config.characterId), [...ENEMY_ANIMATION_IDS]);
const families = [];
for (const [key, type, normalize] of [['jenkins', 'companion', normalizeCompanionAnimation],
  ['creeper', 'enemy', normalizeEnemyAnimation], ['asari', 'enemy', normalizeEnemyAnimation]]) {
  const path = `public/assets/${type}-${key}-animation.json`, config = normalize(key, JSON.parse(await bytes(path)));
  assert.ok(config); const pngPath = `public/assets/${config.combat.file}`, png = await bytes(pngPath);
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16), config.combat.width); assert.equal(png.readUInt32BE(20), config.combat.height);
  assert.equal(png[25], 6);
  families.push({ key, type, metadata: path, png: pngPath, pngSha256: sha(png),
    width: config.combat.width, height: config.combat.height, poses: Object.keys(config.combat.frames) });
}
const tested = spawnSync(process.execPath, ['--test', ...testFiles], { cwd: root, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } });
const output = `${tested.stdout || ''}${tested.stderr || ''}`;
const count = key => Number(output.match(new RegExp(`^(?:#|ℹ) ${key} (\\d+)$`, 'm'))?.[1] || 0);
const outputPath = `docs/qa/${prefix}-output.txt`;
await writeFile(new URL(outputPath, root), output);
const changedSources = [];
for (const [path, value] of Object.entries(sourceHashes)) if (sha(await bytes(path)) !== value) changedSources.push(path);
const report = { passed: tested.status === 0 && count('tests') === 29 && count('pass') === 29 && count('fail') === 0
    && count('skipped') === 0 && changedSources.length === 0,
  generatedAt: new Date().toISOString(), baselineCommit: baseline,
  sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  command: 'node scripts/verify-me1-prologue-enemies-runtime.mjs',
  environment: { ME1_RUNTIME_PREFIX: prefix },
  scope: 'Twenty-nine targeted Node cases, including expanded existing companion/enemy families and four new prologue/occlusion regressions. Real WorldView geometry, frame transforms, native combat actions and save validators are used without a browser. Production app traversal and actual image review are separate acceptance gates.',
  tests: count('tests'), passedTests: count('pass'), failedTests: count('fail'), skippedTests: count('skipped'),
  exitCode: tested.status, families, newFixedDrawings: 12,
  registeredCompanions: [...COMPANION_ANIMATION_IDS], registeredEnemies: [...ENEMY_ANIMATION_IDS],
  bundledCompanionMetadata: bundledCompanions.length, bundledEnemyMetadata: bundledEnemies.length,
  sourceHashes, unchangedModules, changedSources,
  priorRuntimeEvidence: { path: previousRuntimePath, sha256: sha(previousRuntimeBytes),
    qualification: 'Historical positive28-test proof before the subsequent Feros camera-facing-pillar correction. Its source hashes and output are preserved separately and are not reinterpreted as current runtime evidence.',
    sourceArchive: { path: archivePath, sha256: sha(await bytes(archivePath)) }, exactSubsequentWorldReplacementVerified: true },
  checks: { currentNewNativeMetadataNormalized: true, newPNGHeadersMatch: true,
    nativeStatsAttacksStoryGatesAndSaveSchemaUnchanged: true,
    jenkinsUsesExistingCover: true, jenkinsHasNoAddedBioticOrUnityAbility: true,
    firstEdenVictoryLossAndAshleyReplacementPreserved: true, forgedJenkinsPartySaveRejected: true,
    explicitNarrativeBoundariesCloseJenkinsAtlas: ['lost', 'flags.jenkinsLost', 'completed eden-prime'],
    foregroundNoveriaMeshes: 12, priorOverheadMeshes: 4,
    foregroundFerosMeshes: 2, ferosOverheadMeshes: 2,
    foregroundSurvivesStaticMergeAndTwoModeCycles: true, unchangedFieldGeometryCrossesMeasuredSightline: true,
    combatSightlineClearsMeasuredEnvelope: true, collisionFootprintsPreserved: true },
  output: { path: outputPath, sha256: sha(Buffer.from(output)) },
  limitations: ['No public campaign, screenshot, hardware FPS, Windows launch or complete1:1 likeness certification is supplied by these Node checks.',
    'Jenkins has one health and zero shield only in the explicit KO witness fixture. A combat KO is separate from his persistent narrative loss after the first Eden victory.',
    'Unity tests remain restricted to the six companions who can reach the post-Spectre campaign. Jenkins has a dedicated assertion that Unity is unavailable in his valid prologue state.',
    'The Noveria and Feros raycasts sample points inside native enemy bounding envelopes. They establish solid-geometry occlusion behavior, not pixel-level visibility of every pose or viewport.',
    'The asari drawing represents the reused generic enemy profile. Thorian clone identity, summon/disappearance phases and Benezia are not implemented by this visual family.'] };
await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
assert.equal(report.passed, true, output + JSON.stringify(changedSources));
console.log(JSON.stringify({ passed: true, tests: report.tests, companionFamilies: bundledCompanions.length,
  enemyFamilies: bundledEnemies.length, newDrawings: 12, stableSources: Object.keys(sourceHashes).length }));
