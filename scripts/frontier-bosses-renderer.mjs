import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { BOSS_ANIMATION_IDS as IDS, BOSS_COMBAT_POSES as POSES, normalizeBossAnimation } from '../src/boss-animation-data.js';

const root = new URL('../', import.meta.url), base = process.env.GAME_URL || 'http://127.0.0.1:4173';
const prefix = process.env.FRONTIER_BOSS_PREFIX || 'frontier-bosses-renderer';
assert.match(prefix, /^frontier-bosses-renderer(?:-[a-z0-9-]+)?$/);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const configs = Object.fromEntries(await Promise.all(IDS.map(async key => [key,
  normalizeBossAnimation(key, JSON.parse(await readFile(new URL(`public/assets/boss-${key}-animation.json`, root), 'utf8')))])));
assert.ok(Object.values(configs).every(Boolean));
const paths = ['src/world.js','src/world-data.js','src/frontier-layout-data.js','src/frontier-scene.js','src/boss-animation-data.js',
  'src/game-data.js','src/combat.js','src/state.js','vite.config.js','scripts/frontier-bosses-renderer.mjs',
  ...IDS.flatMap(key => [`public/assets/boss-${key}-combat.png`,`public/assets/boss-${key}-animation.json`])];
const sourceHashes = Object.fromEntries(await Promise.all(paths.map(async path => [path,hash(await readFile(new URL(path,root)))])));
const report = { passed:false, at:new Date().toISOString(), url:base, sourceHashes,
  scope:'Detached development fixture using the actual WorldView, native boss encounter compositions and native party actor definitions. Sixteen held fixed drawings are inspected separately from four real performAction/hit/KO scratch-battle sequences. No application campaign is begun, no save is written, no victory is claimed and no route progression is represented. This is renderer/guard QA, not full original-game fidelity, complete animation, new boss phase or ordinary campaign-play evidence.',
  fixture:'New local state and renderer only; party Shepard/Garrus/Liara. Held pose events and HP0 inputs are explicit visual fixtures. Real KO sequence uses scratch HP1/shield0 and high attack override on Garrus, never canonical ENEMIES edits.',
  viewport:{width:1280,height:800,deviceScaleFactor:1}, cases:[],nativeEvents:[],scopeClosures:[],captures:[],servedAssets:[],
  errors:[],failedRequests:[],assetErrors:[],actuallyOpened:false };
const close = (a,b,label) => assert.ok(Math.abs(a-b)<1e-6,`${label}: ${a} != ${b}`);
let browser,page;
async function capture(name) {
  const path=`docs/screenshots/${prefix}-${name}.png`, bytes=await page.screenshot({path:fileURLToPath(new URL(path,root))});
  report.captures.push({path,sha256:hash(bytes),bytes:bytes.length,actuallyOpened:false}); return path;
}
try {
  browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||'/usr/bin/chromium',
    args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  report.chromium=browser.version();page=await browser.newPage({viewport:report.viewport,deviceScaleFactor:1});page.setDefaultTimeout(45000);
  page.on('pageerror',e=>report.errors.push(e.message));page.on('requestfailed',r=>report.failedRequests.push(`${r.url()}: ${r.failure()?.errorText}`));
  page.on('response',r=>{if(r.status()>=400)report.failedRequests.push(`${r.status()} ${r.url()}`);});
  const url=`${base}/__frontier-bosses-renderer__`;
  await page.route(url,route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><style>html,body{margin:0;overflow:hidden}#world{width:100vw;height:100vh}#fixture{position:fixed;top:10px;left:12px;padding:8px 12px;background:#061522df;color:#d9e8ef;border:1px solid #426579;font:13px sans-serif;z-index:20}</style><div id="world"></div><div id="fixture">QA · fixture de rendu détachée · aucune progression de campagne</div><script type="module">import"/@vite/env";import{WorldView}from"/src/world.js";window.__FRONTIER_BOSS_QA__={world:new WorldView(document.querySelector("#world")),storageBefore:JSON.stringify({...localStorage})};</script>'}));
  await page.goto(url,{waitUntil:'networkidle'});
  await page.waitForFunction(ids=>{const w=window.__FRONTIER_BOSS_QA__?.world;return w&&['crew','boss','enemy',...ids.map(id=>`combat-${id}`)].every(name=>w.atlases[name]);},IDS);
  report.loaded=await page.evaluate(ids=>{const w=window.__FRONTIER_BOSS_QA__.world;return ids.map(key=>({key,characterId:w.characterAnimations[key]?.characterId,
    width:w.atlases[`combat-${key}`].image.width,height:w.atlases[`combat-${key}`].image.height}));},IDS);
  for(const row of report.loaded) { assert.equal(row.characterId,row.key);assert.equal(row.width,configs[row.key].combat.width);assert.equal(row.height,configs[row.key].combat.height); }
  for(const key of IDS) {
    const response=await page.request.get(`${base}/assets/boss-${key}-combat.png`);assert.equal(response.status(),200);
    const sha256=hash(await response.body());assert.equal(sha256,sourceHashes[`public/assets/boss-${key}-combat.png`]);report.servedAssets.push({key,sha256});
  }
  await page.evaluate(async()=>{
    const [{newGame},{actorFor,ENCOUNTERS,enemiesFor},{createBattle,performAction}]=await Promise.all([import('/src/state.js'),import('/src/game-data.js'),import('/src/combat.js')]);
    const f=window.__FRONTIER_BOSS_QA__,w=f.world;f.state=newGame({name:'Fixture de rendu',classId:'soldier'});f.beforeState=JSON.stringify(f.state);
    f.makeBattle=key=>{
      let zone,index;for(const [id,list]of Object.entries(ENCOUNTERS)){const found=list.findIndex(keys=>keys.includes(key));if(found>=0){zone=id;index=found;break;}}
      if(!zone)throw Error(`Missing native encounter ${key}`);
      w.setBattle(null);if(w.zoneId!==zone)w.setZone(zone);else w._clearEffects();
      const poi=w.getInteractivePOIs().find(p=>p.id===`${zone}:boss`);w.setPosition(poi||w.zone.arena);
      const battle=createBattle({party:['shepard','garrus','liara'].map(id=>({...actorFor(id,f.state),atb:100})),
        enemies:enemiesFor(zone,index,f.state).map(actor=>({...actor,atb:100})),mode:'wait',seed:2183});
      w.setBattle(battle);w.setMode('combat');
      // Hold the native settled combat target directly: no battle tick or
      // repeated software-rendered frames are needed for a fixed drawing.
      const focus=w._cameraFocus(w.battleArena||w.zone.arena,'combat');
      w.cameraTarget.copy(focus);w.camera.position.copy(focus).add(w.cameraOffset);w.camera.lookAt(focus);w.update(0);
      f.battle=battle;f.native=battle.actors.find(actor=>actor.sprite===key);f.actor=w.battleActors.get(f.native.id);
      f.context={zone,index,poi:poi?.id,arena:w.battleArena||w.zone.arena,composition:battle.actors.filter(a=>a.team==='enemy').map(a=>a.sprite)};
      return battle;
    };
    f.metric=pose=>{
      const actor=f.actor,frame=w.characterAnimations[actor.key].combat.frames[pose],map=actor.body.material.map,atlas=w.atlases[`combat-${actor.key}`],p=actor.body.geometry.parameters;
      const Vector3=w.camera.position.constructor;actor.body.updateWorldMatrix(true,false);
      const pivot=actor.body.localToWorld(new Vector3((frame.pivot[0]/frame.rect[2]-.5)*p.width,(.5-frame.pivot[1]/frame.rect[3])*p.height,0));
      const anchor=actor.group.localToWorld(new Vector3(0,.05,0)),corners=[];
      for(const x of[-1,1])for(const y of[-1,1]){const point=actor.body.localToWorld(new Vector3(x*p.width/2,y*p.height/2,0)).project(w.camera);corners.push([(point.x*.5+.5)*innerWidth,(-point.y*.5+.5)*innerHeight]);}
      return{key:actor.key,id:actor.id,pose,...f.context,frameId:actor.animationFrame,texture:map.image.src,rect:frame.rect,pivot:frame.pivot,
        repeat:map.repeat.toArray(),offset:map.offset.toArray(),relativeHeight:p.height*actor.body.scale.y/actor.height,groundAnchorError:pivot.distanceTo(anchor),
        opacity:actor.body.material.opacity,rotationZ:actor.body.rotation.z,sourceMapDistinct:map!==atlas,sourceRepeat:atlas.repeat.toArray(),sourceOffset:atlas.offset.toArray(),
        projectedBounds:{left:Math.min(...corners.map(p=>p[0])),right:Math.max(...corners.map(p=>p[0])),top:Math.min(...corners.map(p=>p[1])),bottom:Math.max(...corners.map(p=>p[1]))},
        saveUnchanged:JSON.stringify(f.state)===f.beforeState,drawCalls:w.renderer.info.render.calls,triangles:w.renderer.info.render.triangles};
    };
    f.performAction=performAction;
  });
  for(const key of IDS)for(const pose of POSES) {
    const metric=await page.evaluate(({key,pose})=>{
      const f=window.__FRONTIER_BOSS_QA__,w=f.world;f.makeBattle(key);
      if(pose==='down'){f.native.hp=0;w.setBattle(f.battle);}
      else if(pose==='hit')w.playEvent({type:'damage',targetId:f.native.id});
      else if(pose==='power')w.playEvent({type:'action',actorId:f.native.id,actionId:f.native.powers[0]||f.native.primaryAction||'cover'});
      f.actor.combatPoseTime=600;w._clearEffects();const before=JSON.stringify(f.battle);w.update(0);
      document.querySelector('#fixture').textContent=`QA · ${key} / ${pose} · état fixe tenu · aucun parcours de campagne`;
      return{...f.metric(pose),heldDrawingOnly:true,battleUnchanged:JSON.stringify(f.battle)===before};
    },{key,pose});
    const config=configs[key].combat,frame=config.frames[pose],[x,y,w,h]=frame.rect;
    assert.equal(metric.frameId,frame.id);assert.equal(new URL(metric.texture).pathname,`/assets/${config.file}`);
    assert.deepEqual(metric.rect,frame.rect);assert.deepEqual(metric.pivot,frame.pivot);
    close(metric.repeat[0],w/config.width,'UV width');close(metric.repeat[1],h/config.height,'UV height');
    close(metric.offset[0],x/config.width,'UV x');close(metric.offset[1],1-(y+h)/config.height,'UV y');
    close(metric.relativeHeight,frame.heightScale,'relative height');close(metric.groundAnchorError,0,'ground pivot');
    assert.equal(metric.rotationZ,0);assert.equal(metric.sourceMapDistinct,true);assert.deepEqual(metric.sourceRepeat,[1,1]);assert.deepEqual(metric.sourceOffset,[0,0]);
    assert.equal(metric.saveUnchanged,true);assert.equal(metric.battleUnchanged,true);assert.ok(metric.drawCalls>0&&metric.triangles>0);
    assert.ok(metric.projectedBounds.left>=0&&metric.projectedBounds.right<=1280&&metric.projectedBounds.top>=0&&metric.projectedBounds.bottom<=800);
    metric.screenshot=await capture(`${key}-${pose}`);report.cases.push({...metric,passed:true});
  }
  report.nativeEvents=await page.evaluate(ids=>{
    const f=window.__FRONTIER_BOSS_QA__,w=f.world,rows=[];
    for(const key of ids){
      f.makeBattle(key);const powers=[...f.native.powers],actionId=f.native.powers[0]||f.native.primaryAction||'shoot';
      const action=f.performAction(f.battle,{actorId:f.native.id,actionId,targetId:'shepard'});w.setBattle(f.battle);
      for(const event of action.events||[])w.playEvent(event);w.update(0);const actionFrame=f.actor.animationFrame;
      w.playEvent({type:'damage',targetId:f.native.id});w.playEvent({type:'action',actorId:f.native.id,actionId:'shoot'});w.update(0);const hitFrame=f.actor.animationFrame;
      f.native.hp=1;f.native.shield=0;const shooter=f.battle.actors.find(a=>a.id==='garrus');shooter.attack=5000;shooter.atb=100;
      const damage=f.performAction(f.battle,{actorId:'garrus',actionId:'shoot',targetId:f.native.id});w.setBattle(f.battle);
      for(const event of damage.events||[])w.playEvent(event);w.update(0);
      rows.push({key,actionId,actionOK:action.ok,actionFrame,hitFrame,damageOK:damage.ok,downFrame:f.actor.animationFrame,hp:f.native.hp,
        powersUnchanged:JSON.stringify(f.native.powers)===JSON.stringify(powers),saveUnchanged:JSON.stringify(f.state)===f.beforeState,
        explicitKOFixtureInputs:{hp:1,shield:0,garrusAttack:5000},events:damage.events});
    }return rows;
  },IDS);
  for(const row of report.nativeEvents){assert.equal(row.actionOK,true);assert.equal(row.actionFrame,`${row.key}-combat-${row.actionId==='shoot'?'aim':'power'}`);
    assert.equal(row.hitFrame,`${row.key}-combat-hit`);assert.equal(row.damageOK,true);assert.equal(row.hp,0);assert.equal(row.downFrame,`${row.key}-combat-down`);assert.equal(row.powersUnchanged,true);assert.equal(row.saveUnchanged,true);}
  report.scopeClosures=await page.evaluate(ids=>{
    const f=window.__FRONTIER_BOSS_QA__,w=f.world,rows=[];
    const patches=[{state:{mediaId:'ME3'}},{state:{periodId:'me2'}},{state:{context:{mediaId:'MEA'}}},{actor:{mediaId:'ME2'}},{actor:{periodId:'me3'}},{actor:{context:{mediaId:'MEA'}}},{state:{team:'party'}}];
    for(const key of ids)for(const patch of patches){f.makeBattle(key);if(patch.state)Object.assign(f.native,patch.state);if(patch.actor)Object.assign(f.actor,patch.actor);
      w.setBattle(f.battle);w.update(0);rows.push({key,patch,frame:f.actor.animationFrame??null,configClosed:w._combatAnimationConfig(f.actor)===null,
        borrowedBossPose:String(f.actor.body.material.map.image?.src).includes(`boss-${key}-combat.png`)});}
    return rows;
  },IDS);
  assert.ok(report.scopeClosures.every(row=>row.frame===null&&row.configClosed&&!row.borrowedBossPose));
  report.assetErrors=await page.evaluate(()=>{const f=window.__FRONTIER_BOSS_QA__;return[...f.world.assetErrors];});
  report.storageUnchanged=await page.evaluate(()=>{const f=window.__FRONTIER_BOSS_QA__;return JSON.stringify({...localStorage})===f.storageBefore;});assert.equal(report.storageUnchanged,true);
  await page.evaluate(()=>{window.__FRONTIER_BOSS_QA__.world.dispose();delete window.__FRONTIER_BOSS_QA__;});
  assert.equal(report.cases.length,16);assert.equal(report.nativeEvents.length,4);assert.equal(report.scopeClosures.length,28);
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);assert.deepEqual(report.assetErrors,[]);
  for(const[path,expected]of Object.entries(sourceHashes))assert.equal(hash(await readFile(new URL(path,root))),expected,`${path}: changed during fixture`);
  report.passed=true;
}catch(error){report.failure=error.stack||String(error);process.exitCode=1;if(page)await capture('failure').catch(()=>{});console.error(report.failure);}
finally{await browser?.close();await writeFile(new URL(`docs/qa/${prefix}.json`,root),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,cases:report.cases.length,captures:report.captures.length,failure:report.failure}));}
