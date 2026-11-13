import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { WorldView } from '../src/world.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { getLevelLayout } from '../src/level-layout-data.js';
import { HORIZON_NPCS, normalizeHorizonNPCAtlas } from '../src/horizon-characters.js';
import { newGame, zoneEncounters, winEncounter, completeZone, recruit } from '../src/state.js';
import { recordVisit } from '../src/story.js';
import { operationPOIs } from '../src/operations.js';
import { initialCustomization } from '../src/customization.js';
const raw = JSON.parse(readFileSync(new URL('../public/assets/horizon-npcs.json',import.meta.url)));
const texture=(width=400,height=200)=>new THREE.Texture({width,height});
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);
function visit(state,zone){state.zone=zone;state.position=null;assert.equal(recordVisit(state,zone),true);}
function nativeState(zone){
  const state=newGame();state.flags.briefed=true;visit(state,'eden-prime');
  for(const id of zoneEncounters('eden-prime'))assert.equal(winEncounter(state,id),true);
  assert.equal(completeZone(state,'eden-prime'),true);visit(state,'citadel');
  for(const id of ['garrus','tali'])assert.equal(recruit(state,id),true);
  if(zone==='feros'){assert.equal(completeZone(state,'citadel'),true);visit(state,'feros');assert.equal(winEncounter(state,'feros:encounter-1'),true);}
  return state;
}
function fixture(zone){
  const state=nativeState(zone),world=Object.create(WorldView.prototype),definition=WORLD_ZONES[zone];
  Object.assign(world,{zone:definition,zoneId:zone,levelLayout:getLevelLayout(zone),player:{...definition.spawn},
    mode:'explore',time:0,keys:new Set(),trail:[],cleared:new Set(state.cleared),party:state.party,
    commanderAppearance:'male',commanderCustomization:initialCustomization(),storyContext:null,
    scene:new THREE.Scene(),stage:new THREE.Group(),characters:new THREE.Group(),particles:new THREE.Group(),
    actors:[],ambientActors:[],battleActors:new Map(),characterAnimations:{},colliders:[],effects:[],animations:[],operationPois:[],poiViews:[],combatOccluders:[],
    spriteCache:new Map(),textureCache:new Map(),materialCache:new Map(),customizationTextures:new Map(),assetErrors:[],
    atlases:{crew:texture(),enemy:texture(),npc:texture(),boss:texture(1024,1536),'horizon-npcs':texture(1536,1024)},
    horizonNPCConfig:normalizeHorizonNPCAtlas(raw),camera:new THREE.OrthographicCamera(-23,23,15,-15,.1,500),
    cameraOffset:new THREE.Vector3(23,29,27),cameraTarget:new THREE.Vector3(),renderer:{render(){}},
    // Labels/canvas have browser coverage. Native actors, animation UVs, visibility,
    // context updates and operation placement continue to use WorldView methods.
    _makeMarkers(){},
  });
  world.scene.add(world.stage,world.characters,world.particles);world._resetTrail();world.setStoryContext(state);world.update(0);
  return {world,state};
}
function contacts(world){return world.ambientActors.filter(actor=>HORIZON_NPCS.some(npc=>npc.id===actor.key));}
function matches(world,actor){
  const frame=world.horizonNPCConfig.frames[actor.key],map=actor.body.material.map,[x,y,w,h]=frame.rect;
  assert.equal(actor.animationFrame,actor.key);assert.equal(map.image,world.atlases['horizon-npcs'].image);assert.notEqual(map,world.atlases['horizon-npcs']);
  near(map.offset.x,x/1536);near(map.offset.y,1-(y+h)/1024);near(map.repeat.x,w/1536);near(map.repeat.y,h/1024);
  const height=actor.body.geometry.parameters.height*actor.body.scale.y,width=actor.body.geometry.parameters.width*actor.body.scale.x;
  near(height,frame.height);near(width,frame.height*w/h);near(actor.body.position.y+(.5-frame.pivot[1]/h)*height,.05);
  assert.equal(actor.group.visible,true);
}

test('all eight actual WorldView NPC bodies use exact native crops, relative heights and anchored feet',()=>{
  const observed=new Set();
  for(const zone of ['citadel','feros']){
    const{world,state}=fixture(zone),snapshot=structuredClone(state),actors=contacts(world);
    assert.equal(actors.length,4);assert.equal(world.getConversationPOIs().filter(poi=>poi.horizonNPC).length,4);
    for(const actor of actors){assert.equal(actor.id,`npc:${actor.key}`);matches(world,actor);observed.add(actor.key);}
    for(let n=0;n<3;n++)world.update(.05);
    for(const actor of actors)matches(world,actor);
    assert.deepEqual(state,snapshot,'Renderer never mutates the supplied campaign state.');
  }
  assert.deepEqual([...observed].sort(),HORIZON_NPCS.map(npc=>npc.id).sort());
});

test('request/report markers share one NPC body rather than duplicating mission speakers',()=>{
  for(const zone of ['citadel','feros']){
    const{world,state}=fixture(zone),before=structuredClone(state);
    world.setOperationPOIs(operationPOIs(state));world._makeAmbientCharacters();world.update(0);
    for(const npc of HORIZON_NPCS.filter(npc=>npc.zone===zone)){
      assert.equal([...world.actors,...world.ambientActors].filter(actor=>actor.key===npc.id).length,1,npc.id);
      assert.equal(world.getConversationPOIs().filter(poi=>poi.conversationId===npc.id).length,1);
      if(npc.operationId){
        const marker=world.operationPois.find(poi=>poi.operationId===npc.operationId);
        assert.ok(marker,`${npc.id} keeps its native operation marker`);
        assert.ok(['request','report'].includes(marker.stepId));
      }
    }
    assert.deepEqual(state,before);
  }
});

test('the same Feros scene removes Fai Dan and all four provisional contacts immediately after boss clearance',()=>{
  const{world,state}=fixture('feros');assert.equal(contacts(world).length,4);
  world.poiViews=world.getConversationPOIs().map(poi=>({poi,group:new THREE.Group(),label:{style:{opacity:'1'}}}));
  const pending=world.getConversationPOIs().find(poi=>poi.conversationId==='fai-dan');world.pendingPOI=pending;world.targetPath=[{x:pending.x,z:pending.z}];
  world.setCleared([...state.cleared,'feros:boss']);world.update(0);
  assert.equal(world.getConversationPOIs().filter(poi=>poi.horizonNPC).length,0);assert.equal(world.pendingPOI,null);
  assert.ok(contacts(world).every(actor=>!actor.group.visible&&actor.animationFrame===null));
  assert.ok(world.poiViews.every(view=>!view.group.visible),'Closed contact markers disappear with their bodies.');
  world.setMode('menu');world.setMode('explore');world.update(0);
  assert.ok(contacts(world).every(actor=>!actor.group.visible));
  assert.ok(world.poiViews.every(view=>!view.group.visible),'Switching modes cannot resurrect a dead contact marker.');
  world.setStoryContext({...state,cleared:[...state.cleared,'feros:encounter-2','feros:boss']});world.update(0);
  assert.equal(contacts(world).length,0,'A later context rebuild cannot resurrect removed bodies.');
  assert.ok(![...world.spriteCache.keys()].some(key=>key.startsWith('horizon-npcs:')),'Removed actors release their private atlas crops.');
});

test('explicit foreign scope, wrong zone, enemy side and forged actor identity cannot retain a civilian crop',()=>{
  for(const zone of ['citadel','feros'])for(const mutation of ['media','period','nested','zone','identity','conversation','enemy']){
    const{world}=fixture(zone),actor=contacts(world)[0];matches(world,actor);
    if(mutation==='media')world.storyContext={...world.storyContext,mediaId:'ME2'};
    if(mutation==='period')world.storyContext={...world.storyContext,periodId:'me3'};
    if(mutation==='nested')world.storyContext={...world.storyContext,context:{mediaId:'MEA',periodId:'mea'}};
    if(mutation==='zone')world.zoneId='noveria';
    if(mutation==='identity')actor.id+='-forged';
    if(mutation==='conversation')actor.conversationId='parasini';
    if(mutation==='enemy')actor.enemy=true;
    assert.equal(world._applyHorizonNPCBody(actor),false,mutation);assert.equal(actor.animationFrame,null,mutation);
    assert.equal(actor.body.material.map,world._neutralSpriteTexture(),mutation);
    if(['media','period','nested','zone'].includes(mutation))assert.equal(world._ambientActorVisible(actor),false);
  }
});

test('bad source dimensions and crop geometry are refused, without borrowing a neighboring NPC body',()=>{
  for(const zone of ['citadel','feros']){
    const{world}=fixture(zone),actor=contacts(world)[0],atlas=world.atlases['horizon-npcs'];matches(world,actor);
    atlas.image={width:1537,height:1024};assert.equal(world._applyHorizonNPCBody(actor),false);assert.equal(actor.animationFrame,null);
    assert.equal(actor.body.material.map,world._neutralSpriteTexture());
    atlas.image={width:1536,height:1024};assert.equal(world._applyHorizonNPCBody(actor),true);matches(world,actor);
    const before=actor.body.material.map.offset.clone(),frame=world.horizonNPCConfig.frames[actor.key];
    assert.equal(world._applyAnimationFrame(actor,'horizon-npcs',{...frame,rect:[-1,0,20,20]}),false);
    assert.equal(world._applyAnimationFrame(actor,'horizon-npcs',{...frame,rect:[1500,1000,300,300]}),false);
    assert.deepEqual(actor.body.material.map.offset,before);
    const invalid=structuredClone(raw);invalid.frames.michel.rect=[...invalid.frames.harkin.rect];
    assert.equal(world.registerHorizonNPCAtlas(invalid),false);matches(world,actor);
  }
});

test('changing the actual context releases old crops and restores only the legal contacts on return',()=>{
  const{world,state}=fixture('citadel');assert.equal(contacts(world).length,4);
  assert.equal([...world.spriteCache.keys()].filter(key=>key.startsWith('horizon-npcs:')).length,4);
  world.setStoryContext({...state,mediaId:'ME2',periodId:'me2'});world.update(0);
  assert.equal(contacts(world).length,0);assert.ok(![...world.spriteCache.keys()].some(key=>key.startsWith('horizon-npcs:')));
  world.setMode('menu');world.setMode('explore');assert.equal(contacts(world).length,0);
  world.setStoryContext(state);world.update(0);assert.equal(contacts(world).length,4);for(const actor of contacts(world))matches(world,actor);
});
