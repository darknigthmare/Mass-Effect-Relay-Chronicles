// Independent read-only check of tracking identities and native media/period
// boundaries. This is not an in-game integration or artwork approval gate.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {BASE_COMMIT,IDS,NPCS,ENEMIES,BOSSES,WORLDS,PROMOTED_IDS,replacements,additions,sha} from './frontier-workbook-data.mjs';
import {FRONTIER_NPCS,FRONTIER_STORY_CONVERSATIONS,frontierNPCVisible,normalizeFrontierNPCAtlas} from '../src/frontier-characters.js';
import {FRONTIER_ENEMIES,FRONTIER_ENEMY_IDS,normalizeFrontierEnemyAtlas,getFrontierEnemyVisual} from '../src/frontier-enemies.js';
import {BOSS_ANIMATION_IDS,BOSS_COMBAT_POSES,normalizeBossAnimation,canShowBossAnimation} from '../src/boss-animation-data.js';
import {FRONTIER_VEHICLES,normalizeMakoDirections,createMakoState,boardMako} from '../src/frontier-vehicles.js';
import {FRONTIER_LAYOUTS} from '../src/frontier-layout-data.js';
import {STORY_CONVERSATIONS} from '../src/story-data.js';
import {ENCOUNTERS} from '../src/game-data.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bytes=name=>fs.readFile(path.join(root,name)),json=async name=>JSON.parse(await bytes(name));
const baseline=await json('docs/qa/frontier-workbook-baseline.json'),catalogue=await json('docs/content-catalog.json');
assert.equal(baseline.baselineCommit,BASE_COMMIT);assert.deepEqual(baseline.selectedIDs,IDS);assert.equal(IDS.length,34);assert.equal(PROMOTED_IDS.length,25);
assert.equal(sha(await bytes('docs/content-catalog.json')),baseline.sourceHashes['docs/content-catalog.json'],'Run this audit before scoped publication.');
const entries=new Map(catalogue.entries.map(entry=>[entry.id,entry]));
for(const id of IDS){assert.ok(entries.has(id),id);assert.ok(!Object.hasOwn(replacements(id),'acceptance'));assert.deepEqual(Object.keys(additions(id)),['implementationPaths','evidence']);}
assert.deepEqual(FRONTIER_NPCS.map(item=>item.catalogId),NPCS.map(([id])=>id));
assert.equal(Object.keys(FRONTIER_STORY_CONVERSATIONS).length,8);assert.equal(Object.keys(STORY_CONVERSATIONS).length,17);
assert.equal(Object.values(STORY_CONVERSATIONS).reduce((sum,item)=>sum+item.topics.length,0),34);
const npcAtlas=normalizeFrontierNPCAtlas(await json('public/assets/frontier-npcs.json'));assert.ok(npcAtlas);assert.equal(Object.keys(npcAtlas.frames).length,7);
for(const npc of FRONTIER_NPCS){
  assert.equal(frontierNPCVisible({zone:npc.zone,mediaId:'ME1',periodId:'me1',completed:['citadel']},npc),true,npc.id);
  for(const foreign of[{mediaId:'ME2'},{periodId:'me2'},{context:{mediaId:'ME3'}},{context:{periodId:'me3'}}])assert.equal(frontierNPCVisible({zone:npc.zone,completed:['citadel'],...foreign},npc),false,npc.id);
}
assert.equal(frontierNPCVisible({zone:'normandy',visitedZones:['eden-prime']},'jenkins'),false);
assert.equal(frontierNPCVisible({zone:'normandy',flags:{jenkinsLost:true}},'jenkins'),false);
for(const npc of FRONTIER_NPCS.filter(item=>item.zone==='noveria'))assert.equal(frontierNPCVisible({zone:'noveria',completed:[]},npc),false);
assert.deepEqual(FRONTIER_ENEMY_IDS,ENEMIES.map(([,key])=>key));assert.ok(normalizeFrontierEnemyAtlas(await json('public/assets/frontier-enemies.json')));
for(const[slug,key]of ENEMIES){
  assert.equal(FRONTIER_ENEMIES[key].catalogId,`ENM-${slug}`);const state={id:`${key}-0`,sprite:key,team:'enemy',mediaId:'ME1',periodId:'me1'},actor={id:state.id,key,enemy:true,state};
  assert.ok(getFrontierEnemyVisual(actor));assert.equal(getFrontierEnemyVisual({...actor,mediaId:'ME2'}),null);assert.equal(getFrontierEnemyVisual(actor,{...state,periodId:'me3'}),null);
  assert.ok(Object.values(ENCOUNTERS).some(formations=>formations.some(formation=>formation.includes(key))),`No campaign occurrence for ${key}`);
}
assert.equal(BOSS_ANIMATION_IDS.length,4);assert.equal(BOSS_COMBAT_POSES.length,4);
for(const[,key]of BOSSES){
  assert.ok(normalizeBossAnimation(key,await json(`public/assets/boss-${key}-animation.json`)));
  const state={id:`${key}-0`,sprite:key,team:'enemy',mediaId:'ME1',periodId:'me1'},actor={id:state.id,key,enemy:true,state};
  assert.equal(canShowBossAnimation(actor),true);assert.equal(canShowBossAnimation({...actor,mediaId:'ME3'}),false);assert.equal(canShowBossAnimation(actor,{...state,periodId:'me2'}),false);
}
assert.ok(normalizeMakoDirections(await json('public/assets/vehicle-mako-directions.json')));
assert.equal(FRONTIER_VEHICLES.mako.zoneId,'therum');assert.equal(FRONTIER_VEHICLES.mako.weaponsAvailable,false);assert.equal(FRONTIER_VEHICLES.mako.persistent,false);
for(const zone of['normandy','noveria','virmire','ilos'])assert.equal(boardMako(createMakoState({x:0,z:0}),{x:0,z:0},zone).ok,false);
for(const key of WORLDS){const level=FRONTIER_LAYOUTS[key];assert.equal(level.rooms.length,5);assert.equal(Object.keys(level.pois).length,7);assert.equal(Object.keys(level.arenas).length,3);assert.equal(level.reference.mediaId,'ME1');assert.equal(level.reference.periodId,'me1');}
const sourcePaths=['scripts/frontier-workbook-data.mjs','src/frontier-characters.js','src/frontier-enemies.js','src/boss-animation-data.js','src/frontier-vehicles.js','src/frontier-layout-data.js','src/story-data.js','src/game-data.js',
 'public/assets/frontier-npcs.json','public/assets/frontier-enemies.json','public/assets/vehicle-mako-directions.json',...BOSSES.map(([,key])=>`public/assets/boss-${key}-animation.json`)];
const report={passed:true,generatedAt:new Date().toISOString(),baselineCommit:BASE_COMMIT,selectedIDs:IDS,existingEntries:1382,selectedEntries:34,unchangedEntries:1348,
 plannedContentPromotions:25,plannedAssetPromotions:25,plannedIntegratedOrValidatedPromotions:0,plannedWorkbookCellChanges:IDS.reduce((sum,id)=>sum+Object.keys(replacements(id)).length,0),
 plannedMetadataFieldChanges:IDS.reduce((sum,id)=>sum+Object.keys(additions(id)).length,0),acceptanceCriteriaUnchanged:true,
 identities:{conversations:8,newNPCBodies:7,reusedJenkinsBody:1,enemyProfiles:8,newEnemyBodies:8,existingBosses:4,newBossDrawings:16,makoDirectionDrawings:4,expandedMaps:3,sectorsPerMap:5},
 mediaAndPeriodGuards:'All8NPC,8enemy and4boss subjects reject explicit foreign media/period contexts. Jenkins rejects post-Eden/lost contexts; Noveria NPCs require Citadel completion. Mako controller rejects4other zones; renderer campaign scope remains a separate browser gate.',
 sourceHashes:Object.fromEntries(await Promise.all(sourcePaths.map(async name=>[name,sha(await bytes(name))]))),
 scope:'Read-only catalogue/runtime identity and scope audit before publication. Not an original1:1 likeness, artwork, world traversal, save/reload or in-game interaction certification.'};
await fs.writeFile(path.join(root,'docs/qa/frontier-tracking-scope-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,selected:34,newBodies:15,newBossDrawings:16,conversationPoints:17,conversationTopics:34}));
