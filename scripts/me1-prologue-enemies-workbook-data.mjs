// Scoped production tracking. No game-state or canonical availability is owned here.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { normalizeCompanionAnimation } from '../src/companion-animation-data.js';
import { normalizeEnemyAnimation } from '../src/enemy-animation-data.js';

export const BASE_COMMIT = 'd19197ff43facd066abcc6ff4611e0ce0148609b';
export const IDS = Object.freeze(['SPR-jenkins-combat', 'CHR-jenkins', 'SPR-creeper-du-thorian-ennemi',
  'ENM-creeper-du-thorian', 'SPR-commando-asari-ennemi', 'ENM-commando-asari', 'SYS-transitions-de-camera']);
export const PROMOTED_IDS = Object.freeze(['SPR-creeper-du-thorian-ennemi', 'SPR-commando-asari-ennemi']);
export const FIELD_COLUMNS = Object.freeze({ status: 'C', assetStatus: 'D', description: 'H', acceptance: 'I',
  assetPath: 'L', gameKey: 'M', notes: 'Q' });
export const CACHE_CELLS = Object.freeze(['C30', 'D30', 'C37', 'D37']);
export const COVERAGE_FIELDS = Object.freeze(['atlases', 'combatKeyPoseCount', 'enemyCombatPoseCount',
  'companionCombatPoseCount', 'nativePNGCount', 'visualLimit', 'animationLimit']);
export const FAMILIES = Object.freeze({ jenkins: 'companion', creeper: 'enemy', asari: 'enemy' });
export const GLOBAL_PROOF = 'docs/qa/me1-prologue-enemies-report.json';
export const sha = bytes => createHash('sha256').update(bytes).digest('hex');

export function replacements(id) {
  const spriteCriteria = 'Silhouette référencée, attaques lisibles, alpha et échelle contrôlés ; cycles 1:1 non validés.';
  switch (id) {
    case 'SPR-jenkins-combat': return {
      description: 'Quatre poses fixes de Jenkins ME1 : visée, action, impact et hors combat.',
      acceptance: 'Visée, action, impact et KO sans cadre coupé ; retour à la visée hors KO. Quatre poses partielles.',
      assetPath: 'public/assets/companion-jenkins-combat.png', gameKey: 'companion:jenkins',
      notes: 'Pose action pour Couverture ; aucun pouvoir ajouté. Mort narrative, terrain et portraits conservés. Cycles et modèle 1:1 à produire.',
    };
    case 'CHR-jenkins': return {
      description: 'Équipier temporaire du prologue ; mêmes conditions de présence et de perte narrative.',
      notes: 'Quatre dessins fixes de combat ME1 ; aucun pouvoir ni nouveau costume. Le KO reste distinct de sa perte scénaristique persistante. Terrain, portrait, statistiques et restrictions conservés ; animations complètes et fidélité 1:1 non validées.',
    };
    case 'SPR-creeper-du-thorian-ennemi': return {
      status: 'Prototype', assetStatus: 'Prototype',
      description: 'Quatre poses fixes du rampant organique de Féros ; aucune nouvelle attaque.',
      acceptance: spriteCriteria, assetPath: 'public/assets/enemy-creeper-combat.png', gameKey: 'enemy:creeper',
      notes: 'Assaut natif conservé ; pas de tir ajouté. Silhouette, autres angles et cycles 1:1 non validés.',
    };
    case 'ENM-creeper-du-thorian': return {
      notes: 'Profil existant, dessins partiels : SPR-creeper-du-thorian-ennemi. Origine et mouvements non validés.',
    };
    case 'SPR-commando-asari-ennemi': return {
      status: 'Prototype', assetStatus: 'Prototype',
      description: 'Quatre poses fixes du commando asari générique ME1 ; pas un clone du Thorien.',
      acceptance: spriteCriteria, assetPath: 'public/assets/enemy-asari-combat.png', gameKey: 'enemy:asari',
      notes: 'Projection et barrière natives conservées. Aucun clone du Thorien ; costume et cycles 1:1 non validés.',
    };
    case 'ENM-commando-asari': return {
      notes: 'Profil natif Projection/Barrière ; dessins partiels SPR-commando-asari-ennemi. Aucun clone du Thorien.',
    };
    case 'SYS-transitions-de-camera': return {
      notes: 'Suivi Eden conservé. Novéria/Féros : volumes proches masqués en combat puis restaurés. Limites de visibilité dans la preuve du lot.',
    };
    default: throw new Error(`Unscoped production record: ${id}`);
  }
}

export function additions(id) {
  const common = { evidence: ['tests/me1-prologue-enemies.test.js', GLOBAL_PROOF,
    'docs/qa/me1-prologue-enemies-workbook-visual-report.json'] };
  if (id === 'SYS-transitions-de-camera') return { evidence: [...common.evidence,
    'tests/noveria-occlusion.test.js', 'docs/qa/me1-prologue-enemies-production-report.json'] };
  const jenkins = id.includes('jenkins'), creeper = id.includes('creeper');
  const family = jenkins ? 'jenkins' : creeper ? 'creeper' : 'asari', kind = FAMILIES[family];
  return {
    implementationPaths: ['src/world.js', 'src/game-data.js',
      `src/${kind === 'companion' ? 'companion' : 'enemy'}-animation-data.js`,
      `public/assets/${kind}-${family}-animation.json`, `public/assets/${kind}-${family}-combat.png`],
    evidence: [`docs/research/me1-prologue-enemies-${family}.md`,
      `docs/qa/me1-prologue-enemies-${family}-art.json`, ...common.evidence],
  };
}

export async function readAssets(root) {
  const families = [], sourceHashes = {};
  for (const [key, kind] of Object.entries(FAMILIES)) {
    const configPath = `public/assets/${kind}-${key}-animation.json`, pngPath = `public/assets/${kind}-${key}-combat.png`;
    const configBytes = await fs.readFile(path.join(root, configPath)), config = JSON.parse(configBytes);
    const normalized = kind === 'companion' ? normalizeCompanionAnimation(key, config) : normalizeEnemyAnimation(key, config);
    assert.ok(normalized, `Native animation validation rejected ${key}`);
    const data = normalized.combat, raw = await fs.readFile(path.join(root, pngPath));
    assert.equal(raw.subarray(0, 8).toString('hex'), '89504e470d0a1a0a'); assert.equal(raw[25], 6);
    assert.equal(raw.readUInt32BE(16), data.width); assert.equal(raw.readUInt32BE(20), data.height);
    assert.deepEqual(Object.keys(data.frames).sort(), ['aim', 'down', 'hit', 'power']);
    const artPath = `docs/qa/me1-prologue-enemies-${key}-art.json`, artBytes = await fs.readFile(path.join(root, artPath));
    const art = JSON.parse(artBytes); assert.equal(art.passed, true);
    assert.equal(art.sha256, sha(raw)); assert.equal(art.nativeCopyVerified, true);
    assert.equal(art.actuallyOpened, true); assert.equal(art.pixelEditingApplied, false);
    families.push({ key, kind, config, normalized, configPath, pngPath, pngSha256: sha(raw), bytes: raw.length, artPath });
    sourceHashes[configPath] = sha(configBytes); sourceHashes[pngPath] = sha(raw); sourceHashes[artPath] = sha(artBytes);
  }
  for (const name of ['src/world.js', 'src/companion-animation-data.js', 'src/enemy-animation-data.js', 'vite.config.js'])
    sourceHashes[name] = sha(await fs.readFile(path.join(root, name)));
  return { families, sourceHashes };
}

export async function synchronizeCoverage(root, catalogue, manifest) {
  const before = structuredClone(catalogue.meta.prototypeCoverage), after = structuredClone(before);
  const pngPaths = (await fs.readdir(path.join(root, 'public/assets'))).filter(name => name.endsWith('.png')).sort().map(name => `public/assets/${name}`);
  assert.equal(pngPaths.length, 34); assert.equal(manifest.assets.length, 29);
  assert.equal(manifest.combatKeyPoses, 68); assert.equal(manifest.enemyCombatKeyPoses, 32);
  assert.equal(manifest.companionCombatKeyPoses, 28);
  const previous = new Map(before.atlases.map(asset => [asset.path, asset]));
  after.atlases = pngPaths.map(name => previous.get(name) || {
    path: name, scope: manifest.assets.find(asset => `public/assets/${asset.file}` === name)?.usage,
  });
  assert.ok(after.atlases.every(asset => typeof asset.scope === 'string' && asset.scope));
  after.combatKeyPoseCount = 68; after.enemyCombatPoseCount = 32; after.companionCombatPoseCount = 28;
  after.nativePNGCount = 34;
  after.visualLimit = 'Deux cycles de marche de Shepard et 68 poses clés fixes : deux apparences, sept compagnons et huit familles ennemies ME1. Jenkins reste limité au prologue ; le commando asari générique ne représente pas les clones du Thorien. Deux dessins assis de Joker, dont idle intégré. Corps, costumes, armes et cycles complets non certifiés 1:1.';
  after.animationLimit = '32 images de marche, quatre directions par apparence de Shepard. Les 68 poses de combat restent fixes ; transitions, directions supplémentaires et variantes exactes d’équipement manquent. Deux dessins assis ne constituent pas un cycle de pilotage.';
  const changes = [];
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
    assert.ok(COVERAGE_FIELDS.includes(key)); changes.push({ path: `meta.prototypeCoverage.${key}`, before: before[key] ?? null, after: after[key] });
  }
  assert.deepEqual(after.chronicles, before.chronicles); catalogue.meta.prototypeCoverage = after;
  return { before, after, changes, derivedFrom: { manifestCombatKeyPoses: 68, manifestEnemyCombatKeyPoses: 32,
    manifestCompanionCombatKeyPoses: 28, publicNativePNG: 34, oldNativePNG: 31,
    seatedKeyPoses: manifest.seatedKeyPoses, terrainTextureCount: manifest.terrainTextureCount } };
}
