// Scoped tracking for the ME1 frontier lot. Canonical acceptance criteria remain
// unchanged; Prototype describes the partial delivery proved by current gates.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const BASE_COMMIT = 'ff8a1cf7fd343d2bb8df6b01d5f18f3f5e7723cd';
export const GLOBAL_PROOF = 'docs/qa/frontier-report.json';
export const NPCS = Object.freeze([
  ['NPC-greg-adams','adams','normandy'], ['NPC-charles-pressly','pressly','normandy'],
  ['NPC-officier-des-requisitions','requisitions-officer','normandy'], ['NPC-richard-l-jenkins','jenkins','normandy'],
  ['NPC-gianna-parasini','parasini','noveria'], ['NPC-administrator-anoleis','anoleis','noveria'],
  ['NPC-lorik-qui-in','lorik','noveria'], ['NPC-lilihierax','lilihierax','noveria'],
]);
export const ENEMIES = Object.freeze([
  ['drone-de-reconnaissance-geth','recon-drone'], ['drone-d-assaut-geth','assault-drone'],
  ['lance-roquettes-geth','rocket-geth'], ['soldat-de-choc-geth','shock-geth'],
  ['juggernaut-geth','juggernaut'], ['traqueur-geth','stalker'], ['rachni-ouvrier','rachni-worker'],
  ['tourelle-automatisee','turret'],
]);
export const BOSSES = Object.freeze([
  ['SPR-matriarche-benezia-ennemi','benezia'], ['SPR-thorian-ennemi','thorian'],
  ['SPR-saren-sur-virmire-ennemi','saren'], ['SPR-saren-a-la-citadelle-ennemi','saren-final'],
]);
export const WORLDS = Object.freeze(['therum','noveria','virmire']);
export const IDS = Object.freeze([...NPCS.map(([id])=>id), ...ENEMIES.map(([slug])=>`ENM-${slug}`),
  ...ENEMIES.map(([slug])=>`SPR-${slug}-ennemi`), ...BOSSES.map(([id])=>id), ...WORLDS.map(key=>`WRL-${key}`),
  'SYS-mako','SYS-transitions-de-camera','SPR-VEH-mako']);
export const PROMOTED_IDS = Object.freeze([...IDS.slice(0,24),'SYS-mako']);
export const FIELD_COLUMNS = Object.freeze({status:'C',assetStatus:'D',description:'H',assetPath:'L',gameKey:'M',notes:'Q'});
export const COVERAGE_FIELDS = Object.freeze(['atlases','combatKeyPoseCount','bossCombatPoseCount','nativePNGCount',
  'frontierNPCBodyCount','frontierEnemyBodyCount','makoDirectionalDrawingCount','conversationPointCount','conversationTopicCount',
  'visualLimit','animationLimit','coverageLimit','vehicleLimit']);
export const sha = value => createHash('sha256').update(value).digest('hex');

export function replacements(id) {
  const promote = PROMOTED_IDS.includes(id) ? {status:'Prototype',assetStatus:'Prototype'} : {};
  const npc = NPCS.find(([key])=>key===id);
  if (npc) {
    const [,key,zone] = npc;
    const specific = key==='jenkins' ? 'Même identité que CHR-jenkins ; corps historique réutilisé. Présent seulement avant le départ pour Eden Prime, sans résurrection.'
      : key==='requisitions-officer' ? 'Conversation de service seulement ; boutique, stocks et licences non implémentés par ce lot.'
      : key==='parasini' ? 'Accueil seulement ; enquête, révélation de sa fonction et embranchements complets non implémentés.'
      : key==='anoleis' ? 'Accueil seulement ; corruption, documents et résolution de l’enquête non implémentés.'
      : key==='lorik' ? 'Accueil seulement ; collecte de preuves et témoignage non implémentés.'
      : key==='lilihierax' ? 'Informations réécrites au garage ; départ canonique et dialogue intégral non reconstitués.'
      : 'Deux sujets de conversation réécrits ; évolution complète des dialogues non reconstituée.';
    return {...promote, assetPath:key==='jenkins'?'public/assets/crew-atlas.png':'public/assets/frontier-npcs.png',
      gameKey:`frontier-npc:${key}`, notes:`ME1 uniquement, ${zone==='normandy'?'Normandy SR-1':'Port Hanshan'}. ${specific} Prototype partiel ; visage, tenue et texte original 1:1 non certifiés.`};
  }
  const enemy = ENEMIES.find(([slug])=>id===`ENM-${slug}`||id===`SPR-${slug}-ennemi`);
  if (enemy) {
    const [,key]=enemy;
    const limits = key==='recon-drone'||key==='assault-drone' ? 'Aucun vol ni trajectoire originale.'
      : key==='rocket-geth' ? 'Aucune roquette, explosion ou zone de visée originale.'
      : key==='stalker' ? 'Aucune grimpe au mur ou au plafond.'
      : key==='rachni-worker' ? 'Frappe de proximité adaptée ; aucune explosion de proximité originale.'
      : key==='turret' ? 'Tir ATB adapté ; aucun véritable secteur de tir original.'
      : 'Statistiques et tir ATB adaptés ; comportement original incomplet.';
    return {...promote,assetPath:'public/assets/frontier-enemies.png',gameKey:`enemy:${key}`,
      notes:`ME1, rencontres de campagne limitées. Un corps fixe avec présentation procédurale ; aucune nouvelle planche de quatre poses. ${limits} Silhouette et mouvements 1:1 non certifiés.`};
  }
  const boss = BOSSES.find(([key])=>key===id);
  if (boss) return {assetPath:`public/assets/boss-${boss[1]}-combat.png`,gameKey:`boss:${boss[1]}`,
    notes:'ME1 : quatre dessins fixes visée/action/impact/hors combat. Profil et rencontre existants conservés ; aucune nouvelle phase ni mécanique complète. Anatomie, tenue et cycles 1:1 non certifiés.'};
  if (WORLDS.some(key=>id===`WRL-${key}`)) return {notes:'Carte ME1 agrandie en cinq secteurs reliés, sept repères et trois arènes conservés. Géographie adaptée ; proportions, intérieurs, embranchements et sous-zones canoniques 1:1 restent à reconstituer.'};
  if (id==='SYS-mako') return {...promote,assetPath:'src/frontier-vehicles.js',gameKey:'vehicle:mako',
    notes:'ME1, Thérum seulement : monter, conduire et descendre. État transitoire ; rechargement à pied. Aucun tir, canon, saut, physique originale ni conduite sur les autres mondes. Prototype partiel non certifié 1:1.'};
  if (id==='SYS-transitions-de-camera') return {
    description:'La caméra orthographique suit les grands espaces d’Eden Prime, Thérum, Novéria et Virmire ; cadrages adaptés aux limites et aux arènes.',
    notes:'Suivi des secteurs agrandis et Mako à Thérum. Masquage des volumes proches en combat conservé. Les autres mondes gardent leurs limites ; cadrages et échelles originaux 1:1 non certifiés.'};
  if (id==='SPR-VEH-mako') return {description:'Quatre vues fixes du Mako pour le prototype de conduite de Thérum ; silhouette historique conservée ailleurs.',
    assetPath:'public/assets/vehicle-mako-directions.png',
    notes:'Quatre directions fixes sans cycle de roues, suspension ou recul de canon. Pilotage transitoire de Thérum suivi par SYS-mako ; aucune arme de véhicule ajoutée. Géométrie originale 1:1 non certifiée.'};
  throw new Error(`Out-of-scope record: ${id}`);
}

export function additions(id) {
  const common = ['docs/qa/frontier-workbook-visual-report.json',GLOBAL_PROOF];
  if (NPCS.some(([key])=>key===id)) return {implementationPaths:['src/frontier-characters.js','src/story-data.js','src/story.js','src/world.js'],
    evidence:['tests/frontier-characters.test.js','docs/research/frontier-characters.md','docs/qa/frontier-characters-art.json',...common]};
  if (ENEMIES.some(([slug])=>id===`ENM-${slug}`||id===`SPR-${slug}-ennemi`)) return {
    implementationPaths:['src/frontier-enemies.js','src/game-data.js','src/world.js','public/assets/frontier-enemies.json'],
    evidence:['tests/frontier-enemies.test.js','docs/research/frontier-enemies.md','docs/qa/frontier-enemies-art.json',...common]};
  const boss=BOSSES.find(([key])=>key===id);
  if(boss)return {implementationPaths:['src/boss-animation-data.js','src/world.js',`public/assets/boss-${boss[1]}-animation.json`],
    evidence:['tests/frontier-bosses.test.js',`docs/qa/frontier-boss-${boss[1]}-art.json`,...common]};
  if(WORLDS.some(key=>id===`WRL-${key}`)||id==='SYS-transitions-de-camera')return {
    implementationPaths:['src/frontier-layout-data.js','src/frontier-scene.js','src/level-layout-data.js','src/world-data.js','src/world.js'],
    evidence:['tests/frontier-levels.test.js','docs/qa/frontier-levels-before-report.json',...common]};
  if(id==='SYS-mako'||id==='SPR-VEH-mako')return {implementationPaths:['src/frontier-vehicles.js','src/world.js','src/main.js','public/assets/vehicle-mako-directions.json'],
    evidence:['tests/frontier-vehicles.test.js','docs/research/frontier-vehicles.md','docs/qa/frontier-mako-art.json',...common]};
  throw new Error(`Out-of-scope evidence: ${id}`);
}

export async function synchronizeCoverage(root,catalogue,manifest) {
  const before=structuredClone(catalogue.meta.prototypeCoverage),after=structuredClone(before);
  const pngPaths=(await fs.readdir(path.join(root,'public/assets'))).filter(name=>name.endsWith('.png')).sort().map(name=>`public/assets/${name}`);
  const previous=new Map(before.atlases.map(item=>[item.path,item]));
  after.atlases=pngPaths.map(name=>previous.get(name)||{path:name,scope:manifest.assets.find(item=>`public/assets/${item.file}`===name)?.usage});
  assert.ok(after.atlases.every(item=>typeof item.scope==='string'&&item.scope));
  after.combatKeyPoseCount=manifest.combatKeyPoses;after.bossCombatPoseCount=manifest.bossCombatKeyPoses;
  after.nativePNGCount=pngPaths.length;after.frontierNPCBodyCount=manifest.frontierNPCBodies;
  after.frontierEnemyBodyCount=manifest.frontierEnemyBodies;after.makoDirectionalDrawingCount=manifest.makoDirectionalDrawings;
  const{STORY_CONVERSATIONS}=await import('../src/story-data.js');
  after.conversationPointCount=Object.keys(STORY_CONVERSATIONS).length;
  after.conversationTopicCount=Object.values(STORY_CONVERSATIONS).reduce((sum,item)=>sum+item.topics.length,0);
  assert.equal(after.conversationPointCount,before.conversationPointCount+NPCS.length);
  assert.equal(after.conversationTopicCount,before.conversationTopicCount+NPCS.length*2);
  after.visualLimit='84 poses de combat fixes : deux apparences de Shepard, sept compagnons, huit familles ennemies et quatre boss ME1. Sept corps PNJ et huit corps ennemis supplémentaires restent des vues fixes séparées. Jenkins réutilise son corps historique et reste limité au prologue. Visages, tenues, géométries et cycles complets non certifiés 1:1.';
  after.animationLimit='32 images de marche, quatre directions par apparence de Shepard ; 84 poses de combat fixes. Sept corps PNJ et huit corps ennemis sans cycle dessiné. Quatre vues Mako sans rotation de roues ni suspension. Deux dessins assis de Joker sans cycle de pilotage. Transitions et variantes exactes restent à produire.';
  after.coverageLimit='Les neuf zones restent des adaptations. Eden Prime, Thérum, Novéria et Virmire disposent de cinq secteurs chacun ; leurs repères ne terminent pas les lieux originaux. Les 100 sous-zones, 91 liaisons, proportions, intérieurs et campagnes canoniques demandent encore leur reconstitution 1:1.';
  after.vehicleLimit='Mako : prototype transitoire de montée/conduite/descente sur Thérum seulement, sans armes ni physique originale. Autres placements et flotte illustrés ou décoratifs ; aucune autre conduite.';
  const changes=[];
  for(const key of new Set([...Object.keys(before),...Object.keys(after)]))if(JSON.stringify(before[key])!==JSON.stringify(after[key])){
    assert.ok(COVERAGE_FIELDS.includes(key),key);changes.push({path:`meta.prototypeCoverage.${key}`,before:before[key]??null,after:after[key]});
  }
  assert.deepEqual(after.chronicles,before.chronicles);catalogue.meta.prototypeCoverage=after;
  return {before,after,changes,derivedFrom:{manifestCombatKeyPoses:manifest.combatKeyPoses,manifestBossCombatKeyPoses:manifest.bossCombatKeyPoses,
    nativePNG:pngPaths.length,manifestCoreAssets:manifest.assets.length}};
}
