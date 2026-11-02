// Scoped authoring metadata; no actor, reward, mission or game-state mutation.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const BASE_COMMIT = '533efaa2ca88c34be21eb53aa30fafcfedd79707';
export const FIELD_COLUMNS = Object.freeze({ status: 'C', assetStatus: 'D', description: 'H', acceptance: 'I', assetPath: 'L', gameKey: 'M', notes: 'Q' });
export const ENEMIES = Object.freeze({ krogan: 'SPR-guerrier-krogan-ennemi', rachni: 'SPR-rachni-soldat-ennemi' });
export const IDS = Object.freeze(['WRL-eden-prime', 'SCN-eden-prime-agriculture', 'SCN-eden-prime-fumee', 'SCN-eden-prime-quais',
  ...Object.values(ENEMIES), 'SYS-carte-locale', 'SYS-transitions-de-camera']);
export const PROMOTED_IDS = Object.freeze(IDS.filter(id => id.startsWith('SCN-') || id.startsWith('SPR-')));
export const CACHE_CELLS = Object.freeze(['C16', 'D16', 'C30', 'D30', 'C37', 'D37']);
export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export const snapshot = async filename => sha(await fs.readFile(filename));
const globalProof = 'docs/qa/eden-immersion-report.json';

export async function readAssets(root) {
  const enemies = [], sourceHashes = {};
  for (const [key, id] of Object.entries(ENEMIES)) {
    const configPath = `public/assets/enemy-${key}-animation.json`, pngPath = `public/assets/enemy-${key}-combat.png`;
    const configBytes = await fs.readFile(path.join(root, configPath)), config = JSON.parse(configBytes);
    assert.equal(config.version, 1); assert.equal(config.characterId, key); assert.equal(config.mediaId, 'ME1');
    assert.equal(config.periodId, 'me1'); assert.equal(config.status, 'Prototype');
    const data = config.combat, raw = await fs.readFile(path.join(root, pngPath));
    assert.equal(data.file, path.basename(pngPath)); assert.equal(data.direction, 'three-quarter');
    assert.equal(raw.subarray(0, 8).toString('hex'), '89504e470d0a1a0a'); assert.equal(raw[25], 6);
    assert.equal(raw.readUInt32BE(16), data.width); assert.equal(raw.readUInt32BE(20), data.height);
    assert.equal(data.width, 1536); assert.equal(data.height, 1024);
    const poses = ['aim', 'power', 'hit', 'down']; assert.deepEqual(Object.keys(data.frames).sort(), [...poses].sort());
    const regions = poses.map(pose => {
      const frame = data.frames[pose], [x, y, width, height] = frame.rect, [px, py] = frame.pivot;
      assert.equal(frame.id, `${key}-combat-${pose}`); assert.equal(frame.pose, pose);
      assert.ok([x, y, width, height].every(Number.isInteger) && x >= 0 && y >= 0 && width > 0 && height > 0 && x + width <= data.width && y + height <= data.height);
      assert.ok([px, py].every(Number.isFinite) && px >= 0 && py >= 0 && px <= width && py <= height);
      assert.ok(Number.isFinite(frame.heightScale) && frame.heightScale > 0 && frame.heightScale <= 1.5);
      return { ...frame, pose };
    });
    sourceHashes[configPath] = sha(configBytes); sourceHashes[pngPath] = sha(raw);
    enemies.push({ key, id, configPath, pngPath, data, regions });
  }
  const textures = [];
  for (const key of ['grass', 'dirt']) {
    const pngPath = `public/assets/eden-ground-${key}.png`, raw = await fs.readFile(path.join(root, pngPath));
    assert.equal(raw.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    const width = raw.readUInt32BE(16), height = raw.readUInt32BE(20), mode = raw[25] === 2 ? 'RGB' : raw[25] === 6 ? 'RGBA' : null;
    assert.ok(width >= 512 && width <= 4096 && height >= 512 && height <= 4096 && mode);
    sourceHashes[pngPath] = sha(raw); textures.push({ key, pngPath, width, height, mode });
  }
  return { enemies, textures, sourceHashes };
}

export function replacements(id) {
  const common = { status: 'Prototype', assetStatus: 'Prototype' };
  if (id === 'WRL-eden-prime') return {
    description: 'Eden Prime s’étend sur cinq secteurs de production reliés par des chemins courbes, une branche de ravitaillement et un retour ouest.',
    acceptance: 'Vérifier les sept objectifs, les détours et le retour, les collisions, le suivi de caméra et la reprise d’anciennes positions. Les distances et contours restent une adaptation.',
    notes: `Enveloppe 110 × 150 ; cinq clairières et neuf repères visuels, sans neuf niveaux supplémentaires. Identifiants et progression conservés ; géographie originale non validée 1:1. QA : ${globalProof}.`,
  };
  if (id === 'SCN-eden-prime-agriculture') return { ...common,
    description: 'Prairies agricoles, sentiers et bâtiments coloniaux répartis entre les secteurs du nouvel Eden Prime.',
    acceptance: 'Sols et végétation restent cohérents dans les cinq secteurs ; chemins et abords des objectifs dégagés. Vérifier les raccords visibles des textures à l’échelle du jeu.',
    assetPath: 'src/eden-scene.js', gameKey: 'eden-prime',
    notes: `Volumes 3D et sols de prototype avec deux textures générées. Proportions et matériaux d’origine non certifiés 1:1 ; aucun nouveau lieu canonique accordé. QA : ${globalProof}.`,
  };
  if (id === 'SCN-eden-prime-fumee') return { ...common,
    description: 'Fumées et lueurs de l’attaque placées dans les secteurs coloniaux d’Eden Prime.',
    acceptance: 'Les panaches préservent les silhouettes, les objectifs et les vues de combat. Leur placement accompagne le parcours sans bloquer les approches.',
    assetPath: 'src/eden-scene.js', gameKey: 'eden-prime',
    notes: `Effets 3D de prototype, intensités et positions adaptées au trajet. Aucune simulation d’incendie ni comparaison exhaustive aux plans originaux. QA : ${globalProof}.`,
  };
  if (id === 'SCN-eden-prime-quais') return { ...common,
    description: 'Quais, rails, fret et plateforme industrielle forment un secteur distinct sur le trajet vers la balise.',
    acceptance: 'Volumes et bordures lisibles, approches praticables, arène dégagée. Les repères de train et de plateforme ne créent ni conduite ni étape de désamorçage.',
    assetPath: 'src/eden-scene.js', gameKey: 'eden-prime',
    notes: `Décor 3D inspiré des lieux documentés. Train statique et plateforme de production ; trajet, échelle et géométrie exacts restent à relever. QA : ${globalProof}.`,
  };
  const enemy = Object.entries(ENEMIES).find(([, entry]) => entry === id);
  if (enemy) return { ...common,
    description: `${enemy[0] === 'krogan' ? 'Le guerrier krogan' : 'Le soldat rachni'} ME1 déjà présent dispose de quatre poses clés fixes : visée, action, impact et hors combat.`,
    acceptance: 'Contrôler aim/power/hit/down en combat : cadrages, ancrages, proportions, priorité KO et identité ME1. Aucun nouvel ennemi, pouvoir ou paramètre de combat déduit des images.',
    assetPath: `public/assets/enemy-${enemy[0]}-combat.png`, gameKey: enemy[0],
    notes: `Quatre poses du prototype existant. Anatomie, armes et cycles originaux non certifiés 1:1 ; aucune référence primaire complète de corps obtenue. QA : ${globalProof}.`,
  };
  if (id === 'SYS-carte-locale') return {
    description: 'Carte et radar représentent les clairières, couloirs et repères d’Eden Prime, avec objectifs numérotés, filtres et suivi.',
    acceptance: 'Contours et position concordent avec le sol praticable ; filtres et suivi fonctionnent après une étape. Les autres cartes et opérations conservent leurs interactions.',
    notes: `Carte de l’adaptation spatiale ; les neuf repères ne sont pas neuf niveaux canoniques. Le trajet et les distances d’origine restent à vérifier. QA : ${globalProof}.`,
  };
  if (id === 'SYS-transitions-de-camera') return {
    description: 'La caméra orthographique suit les grands espaces d’Eden Prime avec des limites issues du nouveau niveau ; les autres zones conservent leurs cadrages.',
    acceptance: 'Suivi lisible aux limites et dans les angles, mouvement indépendant du pas de temps et arènes cadrées. Ne pas masquer les sprites par les volumes proches.',
    assetPath: 'src/world.js',
    notes: `Suivi et cadrages d’Eden uniquement. Les réglages des huit autres zones restent conservés ; aucune nouvelle cinématique complète annoncée. QA : ${globalProof}.`,
  };
  throw Error(`Unknown scoped record: ${id}`);
}

export function additions(id) {
  const enemy = Object.entries(ENEMIES).find(([, entry]) => entry === id);
  const common = ['src/world.js', 'src/world-data.js', 'src/level-layout-data.js', 'src/eden-scene.js', 'src/world-navigation.js'];
  return { implementationPaths: enemy ? [`public/assets/enemy-${enemy[0]}-combat.png`, `public/assets/enemy-${enemy[0]}-animation.json`, 'src/world.js', 'src/enemy-animation-data.js']
      : id === 'SYS-carte-locale' ? [...common, 'src/local-map.js', 'src/local-map.css', 'src/level-map-render.js', 'src/main.js'] : common,
    evidence: enemy ? [`docs/research/eden-immersion-${enemy[0]}.md`, `docs/qa/eden-immersion-${enemy[0]}-art.json`, globalProof]
      : ['docs/qa/eden-immersion-before-report.json', 'docs/research/eden-level-layout.md', globalProof] };
}

export async function synchronizeCoverage(root, catalogue, manifest) {
  const { UNIVERSE_EQUIPMENT } = await import('../src/universe-equipment.js');
  const { getLevelLayout } = await import('../src/level-layout-data.js');
  const layout = getLevelLayout('eden-prime'), before = structuredClone(catalogue.meta.prototypeCoverage), after = structuredClone(before);
  const supported = UNIVERSE_EQUIPMENT.filter(item => item.runtimeSupported), weapons = supported.filter(item => item.kind === 'weapon');
  assert.equal(supported.length, 107); assert.equal(weapons.length, 79); assert.equal(manifest.combatKeyPoses, 56);
  assert.equal(manifest.enemyCombatKeyPoses, 24);
  const pngPaths = (await fs.readdir(path.join(root, 'public/assets'))).filter(name => name.endsWith('.png')).sort().map(name => `public/assets/${name}`);
  assert.equal(pngPaths.length, 31);
  const oldScopes = new Map(before.atlases.map(asset => [asset.path, asset.scope]));
  const fixedScopes = {
    'boss-atlas.png': 'Quatre silhouettes fixes de boss conservées ; tenues et mouvements complets non certifiés.',
    'crew-atlas.png': 'Huit silhouettes alliées de base, utilisées pour le terrain et les portraits de repli.',
    'enemy-atlas.png': 'Huit silhouettes ennemies de base conservées comme replis ; les planches de poses dédiées restent distinctes.',
    'npc-atlas.png': 'Huit sujets de base, dont une apparence féminine de Shepard ; portraits et PNJ conditionnels. Joker assis utilise une planche distincte.',
    'vehicle-atlas.png': 'Quatre silhouettes décoratives de véhicules ou grande machine ; aucun pilotage.',
  };
  const extras = {
    'arsenal-people.png': 'Six bustes fixes de personnages et PNJ des Chroniques, bornés à leurs œuvres.',
    'arsenal-opponents.png': 'Six illustrations fixes d’adversaires des Chroniques, sans moveset complet.',
    'arsenal-equipment.png': 'Six illustrations fixes d’équipements des Chroniques, sans géométrie originale certifiée.',
    'arsenal-fleet.png': 'Six références fixes de véhicules et vaisseaux ; aucun pilotage.',
    'chronicle-portraits-me2-me3.png': 'Trois bustes historiques des Chroniques, bornés à leurs identités et œuvres.',
  };
  after.atlases = pngPaths.map(p => {
    const asset = manifest.assets.find(asset => `public/assets/${asset.file}` === p);
    return { path: p, scope: fixedScopes[path.basename(p)] || asset?.usage || oldScopes.get(p) || extras[path.basename(p)] || 'Illustration de prototype ; fidélité complète non validée.' };
  });
  after.combatKeyPoseCount = manifest.combatKeyPoses; after.enemyCombatPoseCount = manifest.enemyCombatKeyPoses;
  after.maleCombatPoseCount = 4; after.companionCombatPoseCount = 24; after.seatedDrawingCount = manifest.seatedKeyPoses;
  after.nativePNGCount = pngPaths.length; after.terrainTextureCount = 2;
  after.visualLimit = 'Deux cycles de marche de Shepard et 56 poses clés fixes : deux apparences, six compagnons et six familles ennemies ME1. Deux dessins assis de Joker, dont idle intégré. Costumes, anatomie, armes et mouvements complets non certifiés 1:1.';
  after.animationLimit = '32 images de marche, quatre directions par apparence de Shepard. Les 56 poses de combat restent fixes ; transitions, directions supplémentaires et variantes exactes d’équipement manquent. Deux dessins assis ne constituent pas un cycle de pilotage.';
  const width = layout.bounds.maxX - layout.bounds.minX, depth = layout.bounds.maxZ - layout.bounds.minZ;
  after.coverageLimit = `Les neuf zones restent des adaptations. Eden Prime possède cinq secteurs de production dans une enveloppe ${width} × ${depth}, reliés par un sol non rectangulaire. Ses neuf repères ne terminent pas neuf niveaux originaux. Les 100 sous-zones et 91 liaisons demandent encore leur reconstitution 1:1.`;
  after.chronicles.equipmentItems = supported.length; after.chronicles.weapons = weapons.length;
  after.chronicles.limit = 'Sessions et sauvegardes séparées de ME1 ; vingt-cinq essais et seize lectures courtes. Les ateliers exposent 107 équipements dont 79 armes, avec périodes, éditions et formations contrôlées. Paramètres ATB adaptés ; acquisitions, modèles, phases de boss, pilotage et campagnes intégrales restent incomplets.';
  const changed = [];
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) changed.push({ path: `meta.prototypeCoverage.${key}`, before: before[key] ?? null, after: after[key] });
  }
  catalogue.meta.prototypeCoverage = after;
  return { before, after, changes: changed, derivedFrom: { manifestCombatKeyPoses: manifest.combatKeyPoses,
    manifestEnemyCombatKeyPoses: manifest.enemyCombatKeyPoses, runtimeSupportedEquipment: supported.length,
    runtimeSupportedWeapons: weapons.length, publicNativePNG: pngPaths.length, terrainTexturePaths: ['public/assets/eden-ground-grass.png', 'public/assets/eden-ground-dirt.png'],
    edenBounds: layout.bounds, productionSectors: layout.rooms.length, productionLandmarks: layout.landmarks.length } };
}
