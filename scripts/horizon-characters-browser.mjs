// Explicit native fixtures; keyboard E and dialogue buttons are the real UI.
// QA setPosition stages the approach only. Navigation has separate level proofs.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { access,readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { newGame,zoneEncounters,winEncounter,completeZone,recruit,encodeSave,decodeSave,SAVE_KEY } from '../src/state.js';
import { recordVisit } from '../src/story.js';
import { HORIZON_NPCS } from '../src/horizon-characters.js';
const root=new URL('../',import.meta.url),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const prefix=process.env.HORIZON_CHARACTER_PREFIX;
assert.match(prefix||'',/^horizon-characters-[a-z0-9-]+$/,'Use a fresh HORIZON_CHARACTER_PREFIX for every run.');
const reportPath=new URL(`docs/qa/${prefix}-report.json`,root);
try{await access(reportPath);throw Error('Preserve the existing run report and use a fresh prefix.');}catch(error){if(error.code!=='ENOENT')throw error;}
const endpoint=process.env.GAME_URL||'http://127.0.0.1:4173';
const report={passed:false,at:new Date().toISOString(),url:endpoint,
  scope:'Eight ME1 information contacts, sixteen real keyboard/button topic reads and native localStorage autosaves. Node callback fixtures explicitly prepare earlier story and first Feros encounter. QA stages contact positions only; no prior victories are claimed as played.',
  command:{script:'node scripts/horizon-characters-browser.mjs',environment:{GAME_URL:endpoint,HORIZON_CHARACTER_PREFIX:prefix,PLAYWRIGHT_EXECUTABLE_PATH:process.env.PLAYWRIGHT_EXECUTABLE_PATH||'/usr/bin/chromium'}},
  sourceHashes:{},fixtures:[],contacts:[],captures:[],errors:[],failedRequests:[],limitations:['These are condensed paraphrased information conversations, not full original quests or complete dialogue trees.','Fixture placement does not establish navigation; native A* and public level journeys are separate.','A software-rendered viewport is not physical-device or original-art certification.']};
function visit(state,zone){state.zone=zone;state.position=null;assert.equal(recordVisit(state,zone),true);}
const state=newGame({name:'QA Horizon PNJ',difficulty:'story'});state.flags.briefed=true;state.settings.sound=false;state.settings.reducedMotion=true;
visit(state,'eden-prime');for(const id of zoneEncounters('eden-prime'))assert.equal(winEncounter(state,id),true);assert.equal(completeZone(state,'eden-prime'),true);
visit(state,'citadel');for(const id of ['garrus','tali'])assert.equal(recruit(state,id),true);
const fixtures={citadel:structuredClone(state)};
assert.equal(completeZone(state,'citadel'),true);visit(state,'feros');assert.equal(winEncounter(state,'feros:encounter-1'),true);fixtures.feros=structuredClone(state);
for(const[zone,snapshot]of Object.entries(fixtures)){
  const bytes=encodeSave(snapshot);assert.ok(decodeSave(bytes));const path=`docs/qa/${prefix}-${zone}-fixture.json`;
  await writeFile(new URL(path,root),bytes+'\n');report.fixtures.push({zone,path,sha256:sha(bytes+'\n'),nativeDecodePassed:true,preparation:'Native newGame/visit/winEncounter/recruit/completeZone callbacks in Node; imported through the actual save file input.'});
}
const sources=['src/horizon-characters.js','src/story.js','src/story-data.js','src/state.js','src/game-data.js','src/operations.js','src/operation-data.js','src/horizon-fauna.js','src/world.js','src/world-data.js','src/main.js','src/horizon-ui.js','src/horizon-layout-data.js','src/horizon-scene.js','public/assets/horizon-npcs.png','public/assets/horizon-npcs.json','vite.config.js','scripts/horizon-characters-browser.mjs'];
// The world owner may keep these plans in a differently named authored module.
for(const path of sources){try{report.sourceHashes[path]=sha(await readFile(new URL(path,root)));}catch(error){if(error.code!=='ENOENT')throw error;if(!/horizon-(?:layout-data|scene)\.js$/.test(path))throw error;}}
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});page.setDefaultTimeout(30000);
page.on('pageerror',error=>report.errors.push(error.message));page.on('requestfailed',request=>report.failedRequests.push(`${request.url()} ${request.failure()?.errorText}`));
page.on('response',response=>{if(response.status()>=400&&!response.url().endsWith('/favicon.ico'))report.failedRequests.push(`${response.status()} ${response.url()}`);});
try{
  await page.goto(endpoint+'/?qa=1',{waitUntil:'networkidle'});
  for(const zone of ['citadel','feros']){
    console.log(`fixture:${zone}`);
    await page.locator('#save-import').setInputFiles(fileURLToPath(new URL(report.fixtures.find(item=>item.zone===zone).path,root)));
    await page.waitForFunction(zone=>window.__RELAY_TEST__?.getState()?.zone===zone&&!window.__RELAY_TEST__.getUI().busy,zone);
    await page.waitForFunction(()=>window.__RELAY_TEST__.getWorld().atlases['horizon-npcs']?.image?.width===1536);
    for(const npc of HORIZON_NPCS.filter(npc=>npc.zone===zone)){
      console.log(`contact:${npc.id}`);report.stage=npc.id;
      const geometry=await page.evaluate(id=>{
        const qa=window.__RELAY_TEST__,world=qa.getWorld(),poi=world.getConversationPOIs().find(poi=>poi.conversationId===id);
        if(!poi||!world._walkable(poi.x,poi.z))throw Error(`Missing or blocked contact ${id}`);
        world.setPosition(poi);
        const actors=[...world.actors,...world.ambientActors].filter(actor=>actor.key===id);
        if(actors.length!==1)throw Error(`Expected one body for ${id}, got ${actors.length}`);
        const persistent=structuredClone(qa.getState());for(const key of ['story','position','playedSeconds'])delete persistent[key];
        return{poiId:poi.id,approach:{x:poi.x,z:poi.z},actorId:actors[0].id,bodySource:actors[0].body.material.map?.image?.src,frame:actors[0].animationFrame,nearby:world.getNearby()?.id,persistent};
      },npc.id);
      assert.equal(geometry.nearby,geometry.poiId);assert.ok(geometry.bodySource.endsWith('/assets/horizon-npcs.png'));assert.equal(geometry.frame,npc.id);
      await page.keyboard.press('e');const dialog=page.locator(`[data-conversation-id="${npc.id}"]`);await dialog.waitFor();
      const topics=await dialog.locator('[data-topic-id]').evaluateAll(nodes=>nodes.map(node=>node.dataset.topicId));assert.equal(topics.length,2);
      const operationLinks=await dialog.locator('[data-horizon-operation]').evaluateAll(nodes=>nodes.map(node=>node.dataset.horizonOperation));
      if(npc.operationId)assert.ok(operationLinks.includes(npc.operationId),`Missing native operation handoff for ${npc.id}`);
      for(const[index,topic]of topics.entries()){
        await dialog.locator(`[data-topic-id="${topic}"]`).click();assert.ok((await dialog.locator('.dialogue-text').innerText()).trim());
        if(index===0){
          const portrait=await dialog.locator('.dialogue-portrait').evaluate(node=>({image:node.querySelector('svg image')?.getAttribute('href'),clip:!!node.querySelector('clipPath')||!!node.querySelector('svg svg[overflow="hidden"]'),viewBox:node.querySelector('svg')?.getAttribute('viewBox')}));
          assert.ok(portrait.image?.endsWith('/assets/horizon-npcs.png'));assert.equal(portrait.clip,true);
          const path=`docs/screenshots/${prefix}-${npc.id}.png`,bytes=await page.screenshot({path:fileURLToPath(new URL(path,root)),animations:'disabled'});
          report.captures.push({path,sha256:sha(bytes),bytes:bytes.length,actuallyOpened:false,portrait});
        }
        await dialog.locator('[data-conversation-back]').click();
      }
      let operationHandoff=null;
      if(npc.operationId){
        await dialog.locator(`[data-horizon-operation="${npc.operationId}"]`).click();
        const operationDialog=page.locator(`[data-operation-id="${npc.operationId}"]`);await operationDialog.waitFor();
        operationHandoff={id:npc.operationId,stepId:await operationDialog.getAttribute('data-step-id'),speaker:await operationDialog.locator('.speaker').innerText(),cancelledWithoutAccepting:true};
        await operationDialog.locator('[data-operation-choice="cancel"]').click();
      }else await dialog.locator('[data-conversation-end]').click();
      const after=await page.evaluate(saveKey=>{
        const snapshot=structuredClone(window.__RELAY_TEST__.getState());for(const key of ['story','position','playedSeconds'])delete snapshot[key];
        return{persistent:snapshot,save:localStorage.getItem(saveKey)};
      },SAVE_KEY);
      assert.deepEqual(after.persistent,geometry.persistent);
      const saved=decodeSave(after.save);assert.ok(saved);for(const topic of topics)assert.ok(saved.story.heard.includes(`${npc.id}:${topic}`));
      const savePath=`docs/qa/${prefix}-${npc.id}-autosave.json`;await writeFile(new URL(savePath,root),after.save+'\n');
      report.contacts.push({id:npc.id,zone,topics,keyboardE:true,nativeAutosave:true,savePath,saveSHA256:sha(after.save+'\n'),operationLinks,operationHandoff,...geometry,persistent:undefined});
    }
  }
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);assert.equal(report.contacts.length,8);report.passed=true;report.stage='complete';
}catch(error){report.failure=error.stack||String(error);process.exitCode=1;}
finally{
  report.functionalPassed=report.passed;report.changedSourcesDuringRun=[];
  for(const[path,expected]of Object.entries(report.sourceHashes))if(sha(await readFile(new URL(path,root)))!==expected)report.changedSourcesDuringRun.push(path);
  if(report.changedSourcesDuringRun.length){report.passed=false;process.exitCode=1;}
  await browser.close();await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify({passed:report.passed,contacts:report.contacts.length,captures:report.captures.length,failure:report.failure,changedSources:report.changedSourcesDuringRun}));
