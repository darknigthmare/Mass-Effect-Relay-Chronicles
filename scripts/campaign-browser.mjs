import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const baseURL=process.env.GAME_URL||'http://127.0.0.1:4173';
const out=new URL('../test-results/',import.meta.url);
await mkdir(out,{recursive:true});
// Keep renderer and GPU processes separate, as in world-qa.mjs: a software
// WebGL renderer can otherwise stall the browser during a long campaign.
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{}),args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
page.setDefaultTimeout(60000);
const errors=[],requests=[],encounters=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)requests.push({url:r.url(),status:r.status()});});
// Zone readiness is application state, independent of a software-rendered frame.
async function idle(){await page.waitForFunction(()=>!window.__RELAY_TEST__.getUI().busy,null,{polling:100});}
async function travel(zone){await page.evaluate(z=>window.__RELAY_TEST__.travel(z),zone);await idle();assert.equal(await page.evaluate(()=>window.__RELAY_TEST__.getState().zone),zone);}
async function clickChoice(index=0){await page.locator(`[data-do="dialogue-choice"][data-index="${index}"]`).click();await idle();}
async function interact(id){await page.evaluate(p=>window.__RELAY_TEST__.interact(p),id);}
async function validateSave(){return page.evaluate(async()=>{const {decodeSave,encodeSave}=await import('/src/state.js');const s=window.__RELAY_TEST__.getState();const loaded=decodeSave(encodeSave(s));if(!loaded)throw Error('State is no longer serializable after '+s.zone);return{zone:loaded.zone,completed:loaded.completed.length,cleared:loaded.cleared.length};});}
async function battle(id){
  await page.evaluate(p=>window.__RELAY_TEST__.startBattle(p),id);
  const result=await page.evaluate(async()=>{
    const {getActions,performAction,tickBattle,summarizeBattle}=await import('/src/combat.js');
    const qa=window.__RELAY_TEST__, b=qa.getBattle();
    if(!b)throw Error('Battle did not start');
    let iterations=0;
    while(!b.winner&&iterations++<6000){
      for(const a of b.actors.filter(a=>a.team==='party'&&a.hp>0)){
        const available=getActions(b,a.id).filter(x=>x.available);
        if(!available.length)continue;
        const party=b.actors.filter(x=>x.team==='party'),enemies=b.actors.filter(x=>x.team==='enemy'&&x.hp>0);
        const target=enemies.find(x=>!x.statuses.stasis)||enemies[0];
        if(!target)break;
        const low=party.filter(x=>x.hp>0).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp)[0];
        const priorities=[];
        if(party.some(x=>x.hp<=0))priorities.push(['unity',a.id]);
        if(low.hp/low.maxHp<.42)priorities.push(['medigel',low.id]);
        if(target.shield>0)priorities.push(['overload',target.id]);
        if(target.statuses.lift>0||target.statuses.singularity>0)priorities.push(['throw',target.id]);
        priorities.push(['signature',target.id],['warp',target.id],['burst',target.id],['shoot',target.id],['throw',target.id],['overload',target.id],['barrier',a.id],['cover',a.id]);
        for(const [actionId,targetId] of priorities){if(!available.some(x=>x.id===actionId))continue;const r=performAction(b,{actorId:a.id,actionId,targetId});if(r.ok)break;}
      }
      tickBattle(b,.5);
    }
    qa.step(.001);
    return {...summarizeBattle(b),iterations};
  });
  assert.equal(result.winner,'party',`Legitimate victory at ${id}`);
  encounters.push({id,winner:result.winner,seconds:Math.round(result.elapsed),actions:result.actionCount});
  await page.locator('[data-do="claim-victory"]').click();
  if(id==='eden-prime:encounter-1')await clickChoice();
  await validateSave();
  console.log(JSON.stringify(encounters.at(-1)));
}
async function finish(zone,choice=0){
  await interact(`${zone}:objective`);await clickChoice(choice);
  if(zone!=='citadel-finale')await clickChoice();
  await validateSave();
}
try{
  await page.goto(`${baseURL}/?qa`,{waitUntil:'networkidle'});
  await page.evaluate(()=>window.__RELAY_TEST__.begin({difficulty:'normal',classId:'soldier',mode:'wait'}));
  await clickChoice();
  await interact('normandy:briefing');await clickChoice();
  await travel('eden-prime');
  for(const suffix of ['encounter-1','encounter-2','boss'])await battle(`eden-prime:${suffix}`);
  await finish('eden-prime');
  await travel('citadel');
  for(const suffix of ['encounter-1','encounter-2','boss']){await interact(`citadel:${suffix}`);await clickChoice();}
  await page.screenshot({path:new URL('06-citadel.png',out).pathname});
  await finish('citadel');
  // A normal UI purchase, then normal squad selection at the Normandy.
  await page.locator('[data-do="equipment"]').click();
  const beforeCredits=await page.evaluate(()=>window.__RELAY_TEST__.getState().credits);
  await page.locator('[data-do="buy"][data-id="rifle"]').click();
  assert.equal(await page.evaluate(()=>window.__RELAY_TEST__.getState().credits),beforeCredits-180);
  await page.locator('[data-do="close"]').click();
  await page.locator('[data-do="squad"]').first().click();
  for(const id of ['kaidan','ashley','garrus','wrex'])await page.locator(`[data-do="crew-select"][data-id="${id}"]`).click();
  await page.locator('[data-do="crew-confirm"]').click();
  assert.deepEqual(await page.evaluate(()=>window.__RELAY_TEST__.getState().party),['shepard','garrus','wrex']);
  for(const zone of ['noveria','therum','virmire','feros','ilos','citadel-finale']){
    await travel(zone);
    for(const suffix of ['encounter-1','encounter-2','boss'])await battle(`${zone}:${suffix}`);
    if(['therum','virmire','ilos'].includes(zone))await page.screenshot({path:new URL(`07-${zone}.png`,out).pathname});
    await finish(zone,zone==='virmire'?1:0);
  }
  assert.equal(await page.evaluate(()=>window.__RELAY_TEST__.getState().ending),true);
  assert.equal(encounters.length,21);
  const ending=await page.evaluate(()=>structuredClone(window.__RELAY_TEST__.getState()));
  assert.equal(ending.completed.length,8);
  assert.ok(ending.lost.includes('kaidan'));
  assert.ok(!ending.party.includes('kaidan'));
  await page.screenshot({path:new URL('08-ending.png',out).pathname});
  // Reload the real autosave through the title-screen button.
  await page.reload({waitUntil:'networkidle'});
  await page.getByRole('button',{name:/Reprendre/}).click();await idle();
  const restored=await page.evaluate(()=>window.__RELAY_TEST__.getState());
  assert.deepEqual(restored.choices,ending.choices);
  assert.deepEqual(restored.completed,ending.completed);
  assert.equal(restored.ending,true);
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  const report={passed:true,mode:'Real UI progression with accelerated combat simulation; no stat or progression overrides',difficulty:'normal',classId:'soldier',route:['eden-prime','citadel','noveria','therum','virmire','feros','ilos','citadel-finale'],encounters,completed:ending.completed,choices:ending.choices,saveReload:true,errors,requests};
  await writeFile(new URL('campaign-report.json',out),JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:true,encounters:encounters.length,ending:true,choices:ending.choices},null,2));
}catch(e){const diagnostic=await page.evaluate(()=>({zone:window.__RELAY_TEST__?.getState()?.zone,busy:window.__RELAY_TEST__?.getUI()?.busy,screen:window.__RELAY_TEST__?.getUI()?.screen})).catch(()=>null);await page.screenshot({path:new URL('campaign-failure.png',out).pathname}).catch(()=>{});console.error({errors,requests,diagnostic});throw e;}
finally{await browser.close();}
