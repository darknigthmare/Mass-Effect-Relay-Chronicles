import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { WorldView } from '../src/world.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { getLevelLayout } from '../src/level-layout-data.js';
import { initialCustomization } from '../src/customization.js';
import { buildFrontierScene } from '../src/frontier-scene.js';
import { buildHorizonScene } from '../src/horizon-scene.js';
import { createSimulationClock } from '../src/simulation-clock.js';
import { actorFor, enemiesFor, ENCOUNTERS } from '../src/game-data.js';
import { newGame, zoneEncounters } from '../src/state.js';
import { createBattle, getTacticalPosition, performAction } from '../src/combat.js';
function fixture(zoneId, geometry = true) {
  const world = Object.create(WorldView.prototype); let renders = 0, seed = 2183;
  Object.assign(world, { zoneId, zone: WORLD_ZONES[zoneId], levelLayout: getLevelLayout(zoneId), player:{...WORLD_ZONES[zoneId].spawn},
    mode:'explore',time:0,keys:new Set(),trail:[],commanderAppearance:'male',commanderCustomization:initialCustomization(),storyContext:null,
    scene:new THREE.Scene(),stage:new THREE.Group(),characters:new THREE.Group(),particles:new THREE.Group(),actors:[],ambientActors:[],battleActors:new Map(),
    spriteCache:new Map(),textureCache:new Map(),materialCache:new Map(),customizationTextures:new Map(),characterAnimations:{},colliders:[],effects:[],animations:[],
    atlases:Object.fromEntries(['crew','enemy','boss','npc'].map(key=>[key,new THREE.Texture({width:400,height:400})])),
    assetErrors:[],operationPois:[],poiViews:[],combatOccluders:[],cleared:new Set(),camera:new THREE.OrthographicCamera(-24,24,15,-15,.1,500),
    cameraOffset:new THREE.Vector3(23,29,27),cameraTarget:new THREE.Vector3(),renderer:{render(){renders++;}},
    rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},getNearby(){return null;},_sign(){},_propSprite(){},_vehicleSprite(){},_makeMarkers(){} });
  world.scene.add(world.stage,world.characters,world.particles);world._texturedMaterial=color=>world._material(color);
  world._edenTerrainMaterial=(kind,color)=>world._material(color||0x556655);
  if(geometry){if(world.levelLayout?.renderer==='horizon')buildHorizonScene(world,world.levelLayout);else if(world.levelLayout?.renderer==='frontier')buildFrontierScene(world,world.levelLayout);else if(zoneId==='eden-prime')world._eden();else world._citadel(true);}
  else world._walkable=()=>true;
  world._resetTrail();return {world,get renders(){return renders;}};
}

test('native movement preserves three foreground seconds at four frame rates and submits one render per frame',()=>{
  const results=[];
  for(const fps of [10,20,60,144]){
    const view=fixture('citadel-finale',false),w=view.world,clock=createSimulationClock();w.player={x:0,z:0};w.keys.add('KeyW');clock.reset(0);
    for(let frame=1;frame<=fps*3;frame++){
      const batch=clock.advance(frame*1000/fps);
      for(let i=0;i<batch.steps;i++)w.update(batch.stepSeconds,{render:i===batch.steps-1});
      if(!batch.steps)w.update(0);
    }
    assert.equal(view.renders,fps*3);results.push(w.getPosition());
    assert.ok(Math.abs(Math.hypot(w.player.x,w.player.z)-4.35*3)<1e-7);
  }
  for(const result of results)assert.deepEqual(result,results[0]);
  const {world:w}=fixture('citadel-finale',false);w.player={x:0,z:0};w.gamepadInput={right:0,forward:.5,sprint:false};
  for(let i=0;i<60;i++)w.update(1/60,{render:false});
  assert.ok(Math.abs(Math.hypot(w.player.x,w.player.z)-4.35*.5)<1e-7);
  w.keys.add('KeyW');const from=w.getPosition();for(let i=0;i<60;i++)w.update(1/60,{render:false});
  assert.ok(Math.abs(Math.hypot(w.player.x-from.x,w.player.z-from.z)-4.35)<1e-7,'Keyboard takes priority without doubling analogue movement');
  w.setMode('menu');assert.deepEqual(w.gamepadInput,{right:0,forward:0,sprint:false});assert.equal(w.keys.size,0);
});

test('all 21 tactical formations use the exact native arena and stand on real dressed ground; retired phase bodies stay hidden',()=>{
  for(const zone of Object.keys(ENCOUNTERS)){
    const {world:w}=fixture(zone),state=newGame({difficulty:'story'});
    for(let index=0;index<3;index++){
      const poi=w.zone.pois.find(p=>p.id===zoneEncounters(zone)[index]);w.setPosition(poi);const arena=w.getCombatArena();
      const battle=createBattle({party:['shepard','garrus','tali'].map(id=>actorFor(id,state)),enemies:enemiesFor(zone,index,state),tactical:true,bossPhases:true,
        tacticalPositionAllowed:point=>w._walkable(arena.x+point.x,arena.z+point.z),mode:'wait',difficulty:'story',seed:2183});
      w.setBattle(battle);assert.deepEqual(w.battleArena,arena);
      for(const actor of battle.actors){const point=getTacticalPosition(battle,actor.id),body=w.battleActors.get(actor.id);assert.ok(point);assert.equal(w._walkable(body.basePosition.x,body.basePosition.z),true,`${zone}:${index}:${actor.id}`);assert.equal(body.basePosition.x,arena.x+point.x);assert.equal(body.basePosition.z,arena.z+point.z);}
      const leader=battle.actors.find(a=>a.id==='shepard');leader.atb=100;const moved=performAction(battle,{actorId:leader.id,actionId:'advance',targetId:leader.id});w.setBattle(battle);
      if(moved.ok){const point=getTacticalPosition(battle,leader.id),body=w.battleActors.get(leader.id);assert.equal(body.basePosition.x,arena.x+point.x);assert.equal(body.basePosition.z,arena.z+point.z);}
      const enemy=battle.actors.find(a=>a.team==='enemy');enemy.bossPhaseRetired=true;w.setBattle(battle);w.setMode('combat');w.update(0,{render:false});assert.equal(w.battleActors.get(enemy.id).group.visible,false);
      w.setBattle(null);
    }
  }
});

test('all nine mission markers keep their identities and continuous approaches on the actual scenery',async()=>{
  const {recordVisit}=await import('../src/story.js');
  const {recruit,winEncounter,completeZone}=await import('../src/state.js');
  const {advanceMission,getMissionPOIs}=await import('../src/mission-progress.js');
  for(const target of ['eden-prime','noveria','ilos']){
    const state=newGame();state.flags.briefed=true;
    for(const zone of ['eden-prime','citadel','therum','feros','noveria','virmire','ilos']){
      state.zone=zone;recordVisit(state,zone);
      if(zone==='citadel')for(const id of ['garrus','tali','wrex'])recruit(state,id);
      const required=zone===target?(zone==='eden-prime'?2:zone==='noveria'?1:3):3;
      if(zone!=='citadel')for(const id of zoneEncounters(zone).slice(0,required))assert.equal(winEncounter(state,id),true);
      if(zone===target)break;
      assert.equal(completeZone(state,zone,{feros:'save',noveria:'release',virmire:'save-kaidan'}[zone]),true);
    }
    assert.equal(advanceMission(state,target,'start').ok,true);
    const {world:w}=fixture(target);w.storyContext=state;w.setOperationPOIs(getMissionPOIs(state));
    // Ilos initially shows Vigil; the same source footprint is then used for
    // its second real marker after activation, without a fabricated victory.
    const markers=[...w.operationPois];
    if(target==='ilos'){
      assert.equal(advanceMission(state,'mission:ilos:vigil','activate').ok,true);w.setOperationPOIs(getMissionPOIs(state));markers.push(...w.operationPois);
    }
    assert.equal(markers.length,target==='eden-prime'?4:target==='noveria'?3:2);
    for(const marker of markers){
      assert.equal(marker.missionId,target);assert.equal(marker.operationId,undefined);assert.equal(marker.type,'objective');
      const path=w._pathTo(marker);assert.ok(path?.length,marker.id);let previous=w.player;
      for(const point of path){const n=Math.max(1,Math.ceil(Math.hypot(point.x-previous.x,point.z-previous.z)/.2));for(let i=0;i<=n;i++)assert.equal(w._walkable(previous.x+(point.x-previous.x)*i/n,previous.z+(point.z-previous.z)*i/n),true,marker.id);previous=point;}
      assert.deepEqual(path.at(-1),{x:marker.x,z:marker.z});
    }
    assert.deepEqual(w.assetErrors,[]);
  }
});
