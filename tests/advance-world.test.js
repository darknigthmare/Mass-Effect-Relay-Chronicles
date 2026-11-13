import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, unlockedZones } from '../src/state.js';
import { WORLD_ZONES, getWorldArrival } from '../src/world-data.js';
import { createDressedWorld } from './helpers/completion-world-fixture.js';
import { getDestinationAccess } from '../src/advance-travel-access.js';
import { beginEncounterRecovery, advanceEncounterRecovery, encounterRecoveryAccess, resolveTrackedPOI } from '../src/advance-travel.js';
import { renderGalaxyMap, renderMapCollisions, renderEncounterRecovery } from '../src/advance-travel-ui.js';
import { renderLocalMap } from '../src/local-map.js';
import { levelMapProjection } from '../src/level-map-render.js';
import { getLevelLayout } from '../src/level-layout-data.js';
import { FEROS_COLONIST_TARGETS, transitionAdvanceFeros, listAdvanceFerosPOIs } from '../src/advance-feros.js';

const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

test('every campaign unlock combination has matching inspectable destination reasons without mutation', () => {
  const zones = Object.keys(WORLD_ZONES), missions = zones.filter(id => id !== 'normandy');
  for (let mask = 0; mask < 256; mask++) for (const briefed of [false,true]) for (const spectre of [false,true]) {
    const state = newGame(); state.completed = missions.filter((_,i) => mask & 1 << i); state.flags = { briefed, spectre };
    const before = JSON.stringify(state), unlocked = unlockedZones(state);
    for (const zone of zones) {
      const access = getDestinationAccess(state,zone);
      assert.equal(access.ok,unlocked.includes(zone),zone);
      assert.equal(access.missing.length === 0,access.ok);
      assert.ok(access.reason.length > 10);
    }
    assert.equal(JSON.stringify(state),before);
  }
});

test('galactic locks remain consultable and show concrete unmet requirements while deployment stays disabled', () => {
  const state = newGame(), html = renderGalaxyMap(state,'virmire',esc);
  assert.match(html,/data-destination="virmire" data-access="locked"/);
  assert.match(html,/deux enquêtes.*\(0\/2 accomplies\)/);
  assert.match(html,/preuves de Tali/); assert.match(html,/nomination comme Spectre/);
  assert.doesNotMatch(html,/<button class="planet-dot[^>]*disabled/);
  assert.match(html,/<button class="primary" data-do="travel" data-id="virmire" disabled/);
  state.flags.briefed=true;
  assert.match(renderGalaxyMap(state,'eden-prime',esc),/data-destination="eden-prime" data-access="available"/);
});

test('every deployed scene returns to a distinct safe Normandy arrival with stale movement cleared', () => {
  const { world } = createDressedWorld('normandy');
  for (const zone of Object.keys(WORLD_ZONES).filter(id => id !== 'normandy')) {
    world.setZone(zone,{fromZone:'normandy'});
    assert.deepEqual(world.getPosition(),getWorldArrival(zone,'normandy'));
    assert.ok(world._walkable(world.player.x,world.player.z),`${zone} arrival on dressed floor`);
    const exit=world.getPOIs().find(poi=>poi.type==='exit');
    const path=world._pathTo(exit);
    assert.ok(path?.length,`${zone} arrival can reach extraction`);
    assert.ok(Math.hypot(path.at(-1).x-exit.x,path.at(-1).z-exit.z)<.01);
    world.keys.add('KeyW'); world.gamepadInput={right:1,forward:1,sprint:true};
    world.pendingPOI=exit;world.targetPath=path;
    world.setZone('normandy',{fromZone:zone});
    assert.deepEqual(world.getPosition(),{x:0,z:12});
    assert.ok(world._walkable(0,12));
    assert.ok(Math.hypot(world.player.x,world.player.z-15)>2.65,'outside automatic interaction range');
    assert.equal(world.pendingPOI,null);assert.equal(world.targetPath,null);assert.equal(world.keys.size,0);
    assert.deepEqual(world.gamepadInput,{right:0,forward:0,sprint:false});
    world.update(1,{render:false});assert.deepEqual(world.getPosition(),{x:0,z:12},'no instant return or held travel input');
  }
});

test('local-map obstacles use actual native collision footprints including player clearance and detached snapshots', () => {
  const { world } = createDressedWorld('eden-prime'), snapshot = world.getMapCollisions();
  assert.equal(snapshot.length,world.colliders.length);assert.ok(snapshot.length>10);
  world.colliders.forEach((solid,index)=>{
    const footprint=snapshot[index];assert.notEqual(footprint,solid);
    if(solid.kind==='circle') {
      assert.equal(footprint.radius,solid.radius+.36);
      assert.equal(world._insideCollider(solid.x+footprint.radius-.0001,solid.z,solid),true);
      assert.equal(world._insideCollider(solid.x+footprint.radius+.0001,solid.z,solid),false);
    } else {
      assert.equal(footprint.minX,solid.minX-.36);assert.equal(footprint.maxZ,solid.maxZ+.36);
    }
  });
  const html=renderMapCollisions(world.getBounds(),snapshot), projection=levelMapProjection(world.getBounds());
  assert.ok(html.includes(`transform="${projection.transform}"`));
  assert.equal((html.match(/data-map-obstacle=/g)||[]).length,snapshot.length);
  const original=world.colliders[0].kind==='circle'?world.colliders[0].radius:world.colliders[0].minX;
  snapshot[0].radius=-100;snapshot[0].minX=-100;
  assert.equal(world.colliders[0].kind==='circle'?world.colliders[0].radius:world.colliders[0].minX,original);
});

test('map and radar retain equal world-axis scale for long layouts and the Normandy', () => {
  for(const zone of ['normandy','eden-prime','therum','feros','noveria','virmire','ilos']) {
    const b=WORLD_ZONES[zone].bounds,p=levelMapProjection(b),radar=levelMapProjection(b,{left:12,top:12,width:126,height:126});
    assert.ok(Math.abs((p.x(10)-p.x(0))-(p.z(10)-p.z(0)))<1e-10);
    assert.ok(Math.abs((radar.x(10)-radar.x(0))-(radar.z(10)-radar.z(0)))<1e-10);
  }
});

test('filtered local maps preserve marker numbers, exact anchors and a hidden followed contact', () => {
  const pois=[{id:'a',label:'Campagne',type:'objective',x:-14,z:12},{id:'b',label:'Contact <local>',conversationId:'b',x:0,z:0},{id:'c',label:'Annexe',operationId:'c',x:10,z:5}];
  const args={bounds:WORLD_ZONES['eden-prime'].bounds,layout:getLevelLayout('eden-prime'),position:{x:-20,z:44},pois,objective:'Enquête',tracked:'b',esc};
  const full=renderLocalMap(args),contacts=renderLocalMap({...args,filter:'contacts'}),campaign=renderLocalMap({...args,filter:'campaign'});
  assert.match(full,/aria-label="2\. Contact &lt;local&gt;"/);assert.match(contacts,/aria-label="2\. Contact &lt;local&gt;"/);
  assert.match(campaign,/data-map-tracked="b"/);assert.match(campaign,/masqué par le filtre/);
  assert.doesNotMatch(campaign,/data-do="track" data-id="b"/);
  const p=levelMapProjection(args.bounds);assert.ok(full.includes(`cx="${p.x(-14)}" cy="${p.z(12)}"`));
  assert.match(renderLocalMap({...args,filter:'bogus'}),/data-id="all" aria-pressed="true"/);
});

test('mission, operation and campaign follow move to the next step without following a different contact', () => {
  assert.equal(resolveTrackedPOI('mission:eden-prime:charge-a',[{id:'mission:eden-prime:charge-b',missionId:'eden-prime'}]),'mission:eden-prime:charge-b');
  assert.equal(resolveTrackedPOI('operation:a:first',[{id:'operation:a:second',operationId:'a'}],{previousPOIs:[{id:'operation:a:first',operationId:'a'}]}),'operation:a:second');
  assert.equal(resolveTrackedPOI('eden-prime:encounter-1',[{id:'eden-prime:encounter-1',type:'encounter',cleared:true},{id:'eden-prime:encounter-2',type:'encounter'}]),'eden-prime:encounter-2');
  assert.equal(resolveTrackedPOI('talk:a',[{id:'talk:b',conversationId:'b'}],{previousPOIs:[{id:'talk:a',conversationId:'a'}]}),null);
  assert.equal(resolveTrackedPOI('mission:eden-prime:charge-a',[]),null);
});

test('re-entry refuses the original encounter until exactly eight foreground terrain seconds', () => {
  let recovery=beginEncounterRecovery('eden-prime:encounter-1');
  assert.equal(encounterRecoveryAccess(recovery,'eden-prime:encounter-1').ok,false);
  assert.equal(encounterRecoveryAccess(recovery,'eden-prime:encounter-2').ok,true);
  const start=structuredClone(recovery);
  for(const seconds of [5,100,NaN,-1]) assert.deepEqual(advanceEncounterRecovery(recovery,seconds,{exploring:false}),start);
  recovery=advanceEncounterRecovery(recovery,7.999);
  assert.equal(encounterRecoveryAccess(recovery,'eden-prime:encounter-1').ok,false);
  assert.match(encounterRecoveryAccess(recovery,'eden-prime:encounter-1').reason,/1 s sur le terrain/);
  assert.match(renderEncounterRecovery(recovery),/data-recovery-remaining=/);
  assert.equal(advanceEncounterRecovery(recovery,.001),null);
  assert.equal(encounterRecoveryAccess(null,'eden-prime:encounter-1').ok,true);
  assert.equal(renderEncounterRecovery(null),'');
});

test('native clock-sized recovery ticks finish at eight seconds without floating point extra ticks', () => {
  let recovery=beginEncounterRecovery('eden-prime:encounter-1');
  for(let i=0;i<479;i++) recovery=advanceEncounterRecovery(recovery,1/60);
  assert.ok(recovery.remaining>0);assert.equal(encounterRecoveryAccess(recovery,recovery.id).ok,false);
  assert.equal(advanceEncounterRecovery(recovery,1/60),null);
});

test('the real Feros scene gives sixteen pending targets one body each and removes lethal civilians without duplicate named bodies', () => {
  const state=newGame();state.zone='feros';state.completed=['eden-prime','citadel'];state.flags={briefed:true,spectre:true};state.cleared=['feros:encounter-1'];
  const act=(key,choice)=>{const poi=listAdvanceFerosPOIs(state).find(poi=>poi.id===`advance:feros:${key}`);assert.ok(poi,key);state.position={x:poi.x,z:poi.z};const result=transitionAdvanceFeros(state,poi.id,choice);assert.equal(result.ok,true,result.reason);state.advanceFeros=result.progress;};
  act('defense','coordinate');act('lizbeth','listen');state.cleared.push('feros:encounter-2');act('investigation','research');
  for(const index of [1,3,4])act('pressure',`valve-${index}`);
  act('pressure','release');act('jeong','confront');act('juliana','prepare');
  const {world}=createDressedWorld('feros',true,state);world.setOperationPOIs(listAdvanceFerosPOIs(state));
  let civilians=world.ambientActors.filter(actor=>actor.advanceFerosCivilian);assert.equal(civilians.length,16);
  assert.equal(new Set(civilians.map(actor=>actor.advanceFerosCivilian)).size,16);
  for(const target of FEROS_COLONIST_TARGETS) {
    const actor=civilians.find(actor=>actor.advanceFerosCivilian===target.id),poi=world.getInteractivePOIs().find(poi=>poi.targetId===target.id);
    assert.ok(actor&&poi,target.id);assert.ok(Math.hypot(actor.group.position.x-poi.x,actor.group.position.z-poi.z)<1.2);
    assert.ok(world._walkable(actor.group.position.x,actor.group.position.z));assert.equal(actor.body.material.depthWrite,true);
    if(target.characterKey)assert.equal(world.ambientActors.filter(other=>other.key===target.characterKey).length,1,'one named body');
  }
  act('colonist-arcelia','lethal');act('colonist-macha','gas');world.setStoryContext(state);world.setOperationPOIs(listAdvanceFerosPOIs(state));
  civilians=world.ambientActors.filter(actor=>actor.advanceFerosCivilian);assert.equal(civilians.length,15);assert.equal(civilians.some(actor=>actor.key==='arcelia'),false);assert.equal(civilians.filter(actor=>actor.key==='macha').length,1);
  assert.equal(world.getConversationPOIs().some(poi=>poi.characterId==='arcelia'),false);
  for(const target of FEROS_COLONIST_TARGETS.filter(target=>state.advanceFeros.colonists[target.id]===null))act(`colonist-${target.id}`,'gas');
  act('freighter','open');world.setStoryContext(state);world.setOperationPOIs(listAdvanceFerosPOIs(state));world.update(0,{render:false});
  assert.equal(world.ambientActors.filter(actor=>actor.key==='fai-dan'&&actor.group.visible).length,0,'Fai Dan is outside the sixteen survivors and disappears after opening the cargo');
  assert.equal(world.ambientActors.filter(actor=>actor.advanceFerosCivilian).length,15);
});
