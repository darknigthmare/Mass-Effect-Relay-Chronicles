import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { WorldView } from '../src/world.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { getLevelLayout } from '../src/level-layout-data.js';
import { initialCustomization } from '../src/customization.js';
import { buildHorizonScene } from '../src/horizon-scene.js';
import { actorFor, enemiesFor } from '../src/game-data.js';
import { createBattle } from '../src/combat.js';
import { newGame, zoneEncounters, winEncounter, completeZone, recruit } from '../src/state.js';
import { recordVisit } from '../src/story.js';
import { operationPOIs } from '../src/operations.js';
import { HORIZON_NPCS } from '../src/horizon-characters.js';

function fixture(zoneId,{geometry=true}={}) {
  let seed=2183;
  const w=Object.create(WorldView.prototype);
  Object.assign(w,{zone:WORLD_ZONES[zoneId],zoneId,levelLayout:getLevelLayout(zoneId),player:{...WORLD_ZONES[zoneId].spawn},mode:'explore',time:0,keys:new Set(),trail:[],
    commanderAppearance:'male',commanderCustomization:initialCustomization(),storyContext:null,stage:new THREE.Group(),scene:new THREE.Scene(),characters:new THREE.Group(),particles:new THREE.Group(),
    spriteCache:new Map(),textureCache:new Map(),materialCache:new Map(),customizationTextures:new Map(),actors:[],ambientActors:[],battleActors:new Map(),characterAnimations:{},colliders:[],effects:[],animations:[],
    atlases:{crew:new THREE.Texture({width:400,height:200}),enemy:new THREE.Texture({width:400,height:200}),boss:new THREE.Texture({width:400,height:400}),npc:new THREE.Texture({width:400,height:200})},
    assetErrors:[],operationPois:[],poiViews:[],combatOccluders:[],cleared:new Set(),camera:new THREE.OrthographicCamera(-23.2,23.2,14.5,-14.5,.1,500),cameraOffset:new THREE.Vector3(23,29,27),cameraTarget:new THREE.Vector3(),
    renderer:{render(){}},rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},getNearby(){return null;},_sign(){},_propSprite(){},_vehicleSprite(){},_makeMarkers(){}});
  w.scene.add(w.stage,w.characters,w.particles);w._texturedMaterial=color=>w._material(color);
  if(geometry){if(w.levelLayout)buildHorizonScene(w,w.levelLayout);else w._citadel();}w._resetTrail();return w;
}
function verifyRoute(w,goal,label='') {
  const route=w._pathTo(goal);assert.ok(route?.length,`No native path: ${label} ${JSON.stringify(goal)}`);let previous=w.player;
  for(const p of route){const n=Math.max(1,Math.ceil(Math.hypot(p.x-previous.x,p.z-previous.z)/.15));for(let i=0;i<=n;i++)assert.equal(w._walkable(previous.x+(p.x-previous.x)*i/n,previous.z+(p.z-previous.z)*i/n),true,`Blocked native segment: ${label}`);previous=p;}
  assert.deepEqual({x:route.at(-1).x,z:route.at(-1).z},{x:goal.x,z:goal.z});
}
for(const zoneId of ['feros','ilos']) {
  test(`${zoneId}: seven retained mission interactions and both optional routes cross the real dressed map`,()=>{
    const w=fixture(zoneId),l=w.levelLayout;assert.equal(l.rooms.length,5);assert.equal(l.paths.length,3);assert.equal(w.zone.pois.length,7);
    assert.ok(w.horizonSceneMetrics.groundMaskAreaApprox>7000);assert.ok(w.horizonSceneMetrics.groundMaskAreaApprox<w.horizonSceneMetrics.envelopeArea*.75);
    for(const goal of [...w.zone.pois,...l.paths.slice(1).flatMap(path=>path.points.map(([x,z])=>({x,z})))])verifyRoute(w,goal,zoneId);
  });
  test(`${zoneId}: old positions recover and the three native campaign formations fit their local arenas`,()=>{
    const w=fixture(zoneId),s=newGame();w.setParty(['shepard','garrus','tali']);
    for(const p of [{x:0,z:17},{x:5,z:6},{x:-7,z:-5},{x:5,z:-10},{x:0,z:-17},{x:9999,z:-9999}]){assert.equal(w.setPosition(p),true);assert.ok(w._walkable(w.player.x,w.player.z));assert.ok(w.actors.every(a=>w._walkable(a.group.position.x,a.group.position.z)));}
    w._mergeStatic();const colliders=structuredClone(w.colliders);
    for(const[index,suffix]of ['encounter-1','encounter-2','boss'].entries()){
      w.setPosition(w.levelLayout.pois[suffix]);const battle=createBattle({party:['shepard','garrus','tali'].map(id=>actorFor(id,s)),enemies:enemiesFor(zoneId,index,s),mode:'wait',seed:2183}),before=JSON.stringify(battle);
      w.setBattle(battle);w.setMode('combat');assert.deepEqual(w.battleArena,w.levelLayout.arenas[`${zoneId}:${suffix}`]);
      const meshes=[];w.stage.updateMatrixWorld(true);w.stage.traverseVisible(object=>{if(object.isMesh)meshes.push(object);});
      const direction=w.cameraOffset.clone().normalize();
      for(const actor of w.battleActors.values()){
        assert.ok(w._walkable(actor.basePosition.x,actor.basePosition.z));
        const point=actor.group.position.clone();point.y+=actor.height*.55;
        const ray=new THREE.Raycaster(point.clone().addScaledVector(direction,100),direction.clone().negate());
        assert.deepEqual(ray.intersectObjects(meshes,false).filter(hit=>hit.distance<99.99),[],`${zoneId}:${suffix} scenery masks ${actor.id}`);
      }
      assert.deepEqual(w.colliders,colliders,'Combat cuts preserve the dressed map collisions');assert.equal(JSON.stringify(battle),before);w.setBattle(null);w.setMode('explore');assert.ok(w.combatOccluders.every(object=>object.visible));
    }
  });
  test(`${zoneId}: the steady native camera follows each of five sectors without clamping the player out of view`,()=>{
    const w=fixture(zoneId,{geometry:false});for(const r of w.levelLayout.rooms){w.setPosition(r.center);w.update(0);w.camera.updateMatrixWorld();const p=new THREE.Vector3(w.player.x,0,w.player.z).project(w.camera);assert.ok(Math.abs(p.x)<.02&&Math.abs(p.y)<.02);}
  });
}
test('Feros operation anchors retain the native objective IDs and every contact, valve, wreck and fight is reachable',()=>{
  const w=fixture('feros');w._makeMarkers=()=>{};
  for(const[operationId,steps]of Object.entries(w.levelLayout.operationAnchors))for(const[stepId,p]of Object.entries(steps)){
    verifyRoute(w,p,`${operationId}:${stepId}`);
    w.setOperationPOIs([{id:`operation:${operationId}:${stepId}`,operationId,stepId,zone:'feros',label:'Native objective',x:999,z:999}]);
    assert.equal(w.operationPois.length,1);assert.equal(w.operationPois[0].stepId,stepId);verifyRoute(w,w.operationPois[0],`${operationId}:${stepId} resolved`);
  }
  for(const[id,p]of Object.entries(w.levelLayout.sideArenas)){
    w.setPosition(p);const s=newGame(),battle=createBattle({party:['shepard','garrus','tali'].map(id=>actorFor(id,s)),enemies:enemiesFor('feros',1,s),mode:'wait',seed:2183});w.setBattle(battle);assert.deepEqual(w.battleArena,p,id);assert.ok([...w.battleActors.values()].every(a=>w._walkable(a.basePosition.x,a.basePosition.z)));w.setBattle(null);
  }
});

test('all eight Horizon NPC approaches and operation links cross real scenery without overlapping bodies or remote quest starts',()=>{
  const seen=new Set();
  for(const zone of ['citadel','feros']){
    const w=fixture(zone),state=newGame();state.flags.briefed=true;state.zone='eden-prime';recordVisit(state,'eden-prime');
    for(const id of zoneEncounters('eden-prime'))assert.equal(winEncounter(state,id),true);
    assert.equal(completeZone(state,'eden-prime'),true);state.zone='citadel';recordVisit(state,'citadel');
    for(const id of ['garrus','tali'])assert.equal(recruit(state,id),true);
    if(zone==='feros'){assert.equal(completeZone(state,'citadel'),true);state.zone=zone;recordVisit(state,zone);assert.equal(winEncounter(state,'feros:encounter-1'),true);}
    w._makeAmbientCharacters=()=>{};w.setStoryContext(state);w.setOperationPOIs(operationPOIs(state));
    const contacts=w.getConversationPOIs().filter(p=>p.horizonNPC);assert.equal(contacts.length,4);
    for(const p of contacts){
      verifyRoute(w,p,p.id);assert.ok(w._walkable(p.actorPosition.x,p.actorPosition.z),`${p.id} body inside scenery`);
      assert.ok(Math.hypot(p.x-p.actorPosition.x,p.z-p.actorPosition.z)>=1.8);seen.add(p.horizonNPC);
      const record=HORIZON_NPCS.find(n=>n.id===p.horizonNPC);
      if(record.operationId){const op=w.operationPois.find(o=>o.operationId===record.operationId);assert.ok(op,record.operationId);verifyRoute(w,op,op.id);assert.ok(Math.hypot(op.x-p.x,op.z-p.z)<4,`${record.id} native request is near the same contact`);}
    }
    assert.deepEqual(w.assetErrors,[]);
    if(zone==='feros'){
      w.poiViews=contacts.map(poi=>({poi,group:new THREE.Group(),label:{style:{opacity:'1'}}}));
      w.setCleared([...state.cleared,'feros:boss']);assert.ok(w.poiViews.every(v=>!v.group.visible));
      w.setMode('menu');w.setMode('explore');assert.ok(w.poiViews.every(v=>!v.group.visible),'Closing a menu must not resurrect retired Feros contact markers.');
    }
  }
  assert.deepEqual([...seen].sort(),HORIZON_NPCS.map(n=>n.id).sort());
});
