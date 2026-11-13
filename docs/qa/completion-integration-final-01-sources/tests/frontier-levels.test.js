import { readFileSync } from 'node:fs';
import { normalizeFrontierNPCAtlas } from '../src/frontier-characters.js';
import { createMakoState } from '../src/frontier-vehicles.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { WorldView } from '../src/world.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { getLevelLayout, isLevelGround } from '../src/level-layout-data.js';
import { findLevelPath } from '../src/world-navigation.js';
import { initialCustomization } from '../src/customization.js';
import { newGame } from '../src/state.js';
import { actorFor, enemiesFor } from '../src/game-data.js';
import { createBattle } from '../src/combat.js';

import { buildFrontierScene } from '../src/frontier-scene.js';
function fixture(zoneId, { geometry = true } = {}) {
  let seed = 2166136261;
  for (const c of zoneId) seed = Math.imul(seed ^ c.charCodeAt(0), 16777619) >>> 0;
  const world = Object.create(WorldView.prototype);
  Object.assign(world, {
    zone: WORLD_ZONES[zoneId], zoneId, levelLayout: getLevelLayout(zoneId),
    player: { ...getLevelLayout(zoneId).spawn }, mode: 'explore', time: 0, keys: new Set(), trail: [],
    commanderAppearance: 'male', commanderCustomization: initialCustomization(), storyContext: null,
    stage: new THREE.Group(), scene: new THREE.Scene(), characters: new THREE.Group(), particles: new THREE.Group(),
    spriteCache: new Map(), textureCache: new Map(), materialCache: new Map(), customizationTextures: new Map(),
    actors: [], ambientActors: [], battleActors: new Map(), characterAnimations: {}, colliders: [], effects: [], animations: [],
    atlases: { crew: new THREE.Texture({ width: 400, height: 200 }), enemy: new THREE.Texture({ width: 400, height: 200 }), boss: new THREE.Texture({width:400,height:400}) },
    assetErrors: [], operationPois: [], poiViews: [], combatOccluders: [], cleared: new Set(),
    camera: new THREE.OrthographicCamera(-23.2, 23.2, 14.5, -14.5, .1, 500), cameraOffset: new THREE.Vector3(23, 29, 27), cameraTarget: new THREE.Vector3(),
    renderer: { render() {} }, rand() { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; },
    getNearby() { return null; }, _sign() {}, _propSprite() {}, _vehicleSprite() {},
  });
  world.scene.add(world.stage, world.characters, world.particles);
  // Canvas texture loading and labels have separate browser coverage. Geometry,
  // scenery footprints, camera matrices and navigation remain the native code.
  world._edenTerrainMaterial = (kind, color, vertexColors) => {
    const key = `${kind}:${color}:${vertexColors}`;
    if (!world.materialCache.has(key)) world.materialCache.set(key, new THREE.MeshStandardMaterial({ color, vertexColors: !!vertexColors }));
    return world.materialCache.get(key);
  };
  world._texturedMaterial = color => world._material(color);
  if (geometry) buildFrontierScene(world, world.levelLayout);
  world._resetTrail(); return world;
}

for(const zoneId of ['therum','noveria','virmire']) {
 test(`${zoneId}: seven stable interactions and both optional routes cross actual scenery continuously`,()=>{
  const world=fixture(zoneId),layout=world.levelLayout;
  assert.equal(layout.rooms.length,5);assert.equal(world.zone.pois.length,7);
  assert.ok(world.frontierSceneMetrics.groundAreaApprox>6000);
  assert.ok(world.frontierSceneMetrics.groundAreaApprox<world.frontierSceneMetrics.envelopeArea*.75);
  for(const goal of [...world.zone.pois,...layout.paths.slice(1).flatMap(path=>path.points.map(([x,z])=>({x,z})))]){
   const route=world._pathTo(goal);assert.ok(route?.length,`No route to ${JSON.stringify(goal)}`);let previous=world.player;
   for(const point of route){const steps=Math.max(1,Math.ceil(Math.hypot(point.x-previous.x,point.z-previous.z)/.15));for(let i=0;i<=steps;i++)assert.equal(world._walkable(previous.x+(point.x-previous.x)*i/steps,previous.z+(point.z-previous.z)*i/steps),true,JSON.stringify({zoneId,previous,point,i,steps}));previous=point;}
   assert.deepEqual(route.at(-1),{x:goal.x,z:goal.z});
  }
 });
 test(`${zoneId}: old saves recover, native formation and three local battle arenas stay on ground`,()=>{
  const world=fixture(zoneId);world.setParty(['shepard','kaidan','ashley']);
  for(const point of [{x:0,z:17},{x:-7,z:-5},{x:5,z:-10},{x:0,z:-17},{x:9999,z:-9999}]){
   assert.equal(world.setPosition(point),true);assert.equal(world._walkable(world.player.x,world.player.z),true);
   assert.ok(world.actors.every(a=>world._walkable(a.group.position.x,a.group.position.z)));
  }
  const state=newGame();
  for(const[index,suffix]of ['encounter-1','encounter-2','boss'].entries()){
   world.setPosition(world.levelLayout.pois[suffix]);const battle=createBattle({party:['shepard','kaidan','ashley'].map(id=>actorFor(id,state)),enemies:enemiesFor(zoneId,index,state),mode:'wait',seed:2183}),snapshot=JSON.stringify(battle);
   world.setBattle(battle);assert.deepEqual(world.battleArena,world.levelLayout.arenas[`${zoneId}:${suffix}`]);
   for(const actor of world.battleActors.values())assert.equal(world._walkable(actor.basePosition.x,actor.basePosition.z),true);
   assert.equal(JSON.stringify(battle),snapshot);world.setBattle(null);
  }
 });
 test(`${zoneId}: real camera projects each sector at its native controlled-player focus`,()=>{
  const world=fixture(zoneId,{geometry:false});for(const room of world.levelLayout.rooms){world.setPosition(room.center);world.update(0);world.camera.updateMatrixWorld();const projected=new THREE.Vector3(world.player.x,0,world.player.z).project(world.camera);assert.ok(Math.abs(projected.x)<.02&&Math.abs(projected.y)<.02);}
 });
}

test('Mako boards only in exploration, respects every uncleared mission checkpoint, and restores a safe foot party',()=>{
 const world=fixture('therum');world.setParty(['shepard','kaidan','ashley']);world.makoState=createMakoState(world.levelLayout.vehicleSpawn);
 world.setPosition({x:world.makoState.position.x-2,z:world.makoState.position.z});
 const closePosition=world.getPosition();world.setPosition(world.levelLayout.spawn);const approach=world._pathTo(world.makoState.position);assert.ok(approach?.length);let previous=world.player;
 for(const point of approach){const steps=Math.max(1,Math.ceil(Math.hypot(point.x-previous.x,point.z-previous.z)/.15));for(let i=0;i<=steps;i++)assert.equal(world._walkable(previous.x+(point.x-previous.x)*i/steps,previous.z+(point.z-previous.z)*i/steps),true);previous=point;}
 world.setPosition(closePosition);assert.equal(world._vehicleGround(world.makoState.position.x,world.makoState.position.z),true);
 assert.equal(world.getNearbyVehicle().available,true);world.mode='menu';assert.equal(world.boardVehicle().ok,false);world.mode='explore';
 assert.equal(world.boardVehicle().ok,true);assert.equal(world.isVehicleMounted(),true);assert.equal(WorldView.prototype.getNearby.call(world),null);
 assert.ok(world.actors.every(actor=>!actor.group.visible));
 for(const suffix of ['encounter-1','encounter-2','boss']){
  const point=world.levelLayout.pois[suffix];
  assert.equal(world._vehicleGround(point.x,point.z),false,`${suffix} cannot be crossed aboard`);
  assert.equal(world._vehicleGround(-40,point.z),false,`${suffix} cannot be bypassed on a flank`);
  world.cleared.add(`therum:${suffix}`);assert.equal(world._vehicleGround(point.x,point.z),true,`${suffix} opens after the actual campaign flag`);
 }
 world.keys.add('KeyW');world._moveReport=0;const before=world.getPosition();for(let i=0;i<20;i++)world.update(.05);assert.notDeepEqual(world.getPosition(),before);
 assert.equal(world.leaveVehicle().ok,true);assert.equal(world.isVehicleMounted(),false);assert.equal(world._walkable(world.player.x,world.player.z),true);
 assert.ok(world.actors.every(actor=>actor.group.visible && world._walkable(actor.group.position.x,actor.group.position.z)));
 world.mode='menu';assert.equal(world.leaveVehicle().ok,false);
 world.mode='explore';world.storyContext={mediaId:'ME2',periodId:'me2'};assert.equal(world.getNearbyVehicle(),null);assert.equal(world.boardVehicle().reason,'period');world.storyContext=null;
 world.zoneId='noveria';assert.equal(world.getNearbyVehicle(),null);assert.equal(world.boardVehicle().ok,false);
});

test('Mako full driving footprint follows authored mining road and return route after checkpoints without touching scenery',()=>{
 const world=fixture('therum');world.cleared=new Set(['therum:encounter-1','therum:encounter-2','therum:boss']);
 for(const path of world.levelLayout.paths)for(let i=1;i<path.points.length;i++){
  const a=path.points[i-1],b=path.points[i],steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.18));
  for(let n=0;n<=steps;n++)assert.equal(world._vehicleGround(a[0]+(b[0]-a[0])*n/steps,a[1]+(b[1]-a[1])*n/steps),true,`${path.id} ${i}:${n}`);
 }
 const parking=world.levelLayout.vehicleSpawn;world.makoState=createMakoState(parking);world.setPosition({x:parking.x-2,z:parking.z});
 world.colliders.push({kind:'rect',minX:parking.x-1.2,maxX:parking.x-1,minZ:parking.z-4,maxZ:parking.z+4});
 assert.equal(world.boardVehicle().ok,false,'A nearby vehicle cannot be boarded through a wall');
});

test('four Novéria conversations remain reachable in their authored sectors and foreign media hide them',()=>{
 const world=fixture('noveria');world._makeMarkers=()=>{};world.atlases.npc=new THREE.Texture({width:400,height:200});
 world.setStoryContext({recruited:['shepard','kaidan','ashley'],lost:['jenkins'],completed:['citadel'],visitedZones:['eden-prime']});
 assert.deepEqual(world.getConversationPOIs().map(poi=>poi.conversationId),['parasini','anoleis','lorik','lilihierax']);
 for(const poi of world.getConversationPOIs()){
  const route=world._pathTo(poi);assert.ok(route?.length,poi.id);let previous=world.player;
  for(const point of route){const steps=Math.max(1,Math.ceil(Math.hypot(point.x-previous.x,point.z-previous.z)/.15));for(let i=0;i<=steps;i++)assert.equal(world._walkable(previous.x+(point.x-previous.x)*i/steps,previous.z+(point.z-previous.z)*i/steps),true,poi.id);previous=point;}
  assert.deepEqual(route.at(-1),{x:poi.x,z:poi.z});assert.equal(world._walkable(poi.actorPosition.x,poi.actorPosition.z),true,poi.id);
  assert.equal(world.ambientActors.filter(actor=>actor.conversationId===poi.conversationId).length,1);
 }
 world.setStoryContext({recruited:[],lost:[],completed:['citadel'],mediaId:'ME2',periodId:'me2'});
 assert.deepEqual(world.getConversationPOIs(),[]);assert.ok(!world.ambientActors.some(actor=>actor.conversationId));
});


test('native NPC crops reset on wrong identity, foreign scope, absent data or wrong image dimensions',()=>{
 const world=fixture('noveria',{geometry:false});world._makeMarkers=()=>{};
 world.frontierNPCConfig=normalizeFrontierNPCAtlas(JSON.parse(readFileSync(new URL('../public/assets/frontier-npcs.json',import.meta.url))));
 world.atlases['frontier-npcs']=new THREE.Texture({width:world.frontierNPCConfig.width,height:world.frontierNPCConfig.height});
 world.storyContext={recruited:[],lost:[],completed:['citadel'],flags:{},visitedZones:[]};
 world._makeAmbientCharacters();const actor=world.ambientActors.find(actor=>actor.conversationId==='parasini');assert.ok(actor);
 assert.equal(world._applyFrontierNPCBody(actor),true);assert.equal(actor.animationFrame,'parasini');
 actor.enemy=true;assert.equal(world._applyFrontierNPCBody(actor),false);assert.equal(actor.animationFrame,null);actor.enemy=false;
 assert.equal(world._applyFrontierNPCBody(actor),true);world.storyContext.mediaId='ME2';assert.equal(world._applyFrontierNPCBody(actor),false);assert.equal(actor.animationFrame,null);world.storyContext.mediaId='ME1';
 assert.equal(world._applyFrontierNPCBody(actor),true);world.atlases['frontier-npcs'].image={width:1,height:1};assert.equal(world._applyFrontierNPCBody(actor),false);assert.equal(actor.animationFrame,null);
});
