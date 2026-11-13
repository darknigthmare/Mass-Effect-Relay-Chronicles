import test from 'node:test';
import assert from 'node:assert/strict';
import { geometricCover, findRetreatPoint, retreatAvailability } from '../src/completion-world.js';
import { createBattle, tickBattle, getActions, performAction, getTacticalCoverState } from '../src/combat.js';
import { createSimulationClock } from '../src/simulation-clock.js';
import { actorFor, enemiesFor, ENCOUNTERS } from '../src/game-data.js';
import { newGame, zoneEncounters } from '../src/state.js';
import { createDressedWorld } from './helpers/completion-world-fixture.js';

test('ground-solid cover is near, directional, bounded and honest about an open flank', () => {
  const position={x:0,z:0},front={id:'front',x:6,z:0},flank={id:'flank',x:0,z:6};
  const rect={kind:'rect',minX:1,maxX:2,minZ:-1,maxZ:1};
  const covered=geometricCover({position,opponentPositions:[front,flank],solids:[rect]});
  assert.equal(covered.available,true);assert.deepEqual(covered.protectedFrom,['front']);assert.match(covered.reason,/1\/2/);
  assert.equal(geometricCover({position,opponentPositions:[flank],solids:[rect]}).available,false);
  assert.equal(geometricCover({position,opponentPositions:[front],solids:[]}).available,false);
  assert.equal(geometricCover({position:{x:-4,z:0},opponentPositions:[front],solids:[rect]}).available,false);
  assert.equal(geometricCover({position,opponentPositions:[front],solids:[{kind:'circle',x:1.5,z:0,radius:.7}]}).available,true);
  assert.equal(geometricCover({position:{x:NaN,z:0},opponentPositions:[front],solids:[rect]}).available,false);
  assert.deepEqual(geometricCover().protectedFrom,[]);
});

test('the actual combat cover callback refuses empty scenery before cost and identifies a protected attacker', () => {
  const {world:w}=createDressedWorld('eden-prime',false),state=newGame();
  // This small explicit collision fixture exercises the native world→combat
  // boundary; it is not presented as an authored original-game scene.
  w.colliders=[{kind:'rect',minX:-2.5,maxX:-1.6,minZ:-4,maxZ:-1.8}];
  const arena={x:0,z:0};
  const battle=createBattle({party:['shepard'].map(id=>actorFor(id,state)),enemies:enemiesFor('eden-prime',0,state),tactical:true,
    tacticalCoverAvailable:query=>w.getTacticalCoverState(query,arena),mode:'wait'});
  const actor=battle.actors.find(a=>a.id==='shepard');actor.atb=100;
  const cover=getActions(battle,actor.id).find(a=>a.id==='cover');assert.equal(cover.available,true);
  assert.equal(performAction(battle,{actorId:actor.id,actionId:'cover',targetId:actor.id}).ok,true);
  assert.ok(actor.atb<1);assert.equal(getTacticalCoverState(battle,actor.id).active,true);
  assert.ok(getTacticalCoverState(battle,actor.id).protectedFrom.length>0);
  w.colliders=[];actor.atb=100;const before={atb:actor.atb,heat:actor.heat,rng:structuredClone(battle.rngState)};
  const rejected=performAction(battle,{actorId:actor.id,actionId:'cover',targetId:actor.id});
  assert.equal(rejected.ok,false);assert.match(rejected.reason,/obstacle/i);
  assert.deepEqual({atb:actor.atb,heat:actor.heat,rng:structuredClone(battle.rngState)},before);
});

test('every campaign contact has a real safe retreat path on its dressed ground, and bosses refuse retreat', () => {
  let contacts=0;
  for(const zone of Object.keys(ENCOUNTERS)){
    const {world:w}=createDressedWorld(zone),state=newGame();
    for(let index=0;index<3;index++){
      const poi=w.zone.pois.find(p=>p.id===zoneEncounters(zone)[index]);w.setPosition(poi);const arena=w.getCombatArena();
      const battle=createBattle({party:['shepard','garrus','tali'].map(id=>actorFor(id,state)),enemies:enemiesFor(zone,index,state),tactical:true,bossPhases:true,
        tacticalPositionAllowed:p=>w._walkable(arena.x+p.x,arena.z+p.z),mode:'wait'});
      w.setBattle(battle);for(const actor of battle.actors.filter(a=>a.team==='party'))actor.atb=100;
      const point=w.getRetreatPoint(poi),availability=retreatAvailability(battle,poi,point);
      if(index===2){assert.equal(availability.ok,false);assert.match(availability.reason,/décisive/);}
      else {assert.ok(point,`${poi.id}: no safe path`);assert.equal(availability.ok,true,poi.id);assert.ok(Math.hypot(point.x-poi.x,point.z-poi.z)>=5);assert.equal(w._walkable(point.x,point.z),true);contacts++;}
      w.setBattle(null);
    }
  }
  assert.equal(contacts,14);
});

test('retreat refuses impassable shortcuts, unready or incapacitated actors and ended battles without mutation', () => {
  const solid=(x,z)=>!(x>1&&x<3&&z>-8&&z<8);
  const point=findRetreatPoint({start:{x:0,z:0},encounter:{x:0,z:0},spawn:{x:8,z:0},isWalkable:solid,
    findPath:destination=>[destination]});
  assert.ok(point);assert.ok(point.x<=1,'A free destination beyond a wall cannot be reached by teleporting through it');
  const battle={actors:[{team:'party',hp:10,atb:99,statuses:{}}]},poi={id:'test:encounter-1'},destination={x:6,z:0};
  const snapshot=structuredClone(battle);assert.equal(retreatAvailability(battle,poi,destination).ok,false);assert.deepEqual(battle,snapshot);
  battle.actors[0].atb=100;battle.actors[0].statuses.stasis=2;assert.equal(retreatAvailability(battle,poi,destination).ok,false);
  battle.actors[0].statuses={};assert.equal(retreatAvailability(battle,poi,null).ok,false);
  battle.winner='enemy';assert.equal(retreatAvailability(battle,poi,destination).ok,false);
});

test('reduced effects clear native particles while keeping combat poses and persistent status indications', () => {
  const {world:w}=createDressedWorld('eden-prime',false),state=newGame(),arena=w.getCombatArena();
  const battle=createBattle({party:[actorFor('shepard',state)],enemies:enemiesFor('eden-prime',0,state),tactical:true});w.setBattle(battle);w.setMode('combat');
  const actor=battle.actors[0],body=w.battleActors.get(actor.id);actor.statuses.stasis=3;
  w.visualAccessibility={particles:false,spriteShake:false,hitTint:false,ambientPulse:false,effectIntensity:0};
  w.playEvent({type:'damage',targetId:actor.id,actorId:battle.actors[1].id});w.update(1/60,{render:false});
  assert.equal(w.effects.length,0);assert.equal(body.combatPose,'hit');assert.equal(body.statusShell.visible,true);
  assert.equal(body.body.material.color.getHex(),0xffffff);assert.equal(body.statusShell.rotation.y,0);
  assert.ok(arena);assert.equal(actor.statuses.stasis,3,'Render policy never changes simulation states');
});

test('30/60/120 foreground call rates preserve actual movement, active ATB and cooling with one render per display frame', () => {
  const outcomes=[];
  for(const fps of [30,60,120]){
    const view=createDressedWorld('citadel-finale',false),w=view.world,clock=createSimulationClock(),state=newGame({mode:'active'});
    w.player={x:0,z:0};w.keys.add('KeyW');clock.reset(0);
    const battle=createBattle({party:[actorFor('shepard',state)],enemies:enemiesFor('eden-prime',0,state),mode:'active',seed:2183});battle.actors[0].heat=80;
    for(let frame=1;frame<=fps*3;frame++){
      const batch=clock.advance(frame*1000/fps);
      for(let i=0;i<batch.steps;i++){tickBattle(battle,batch.stepSeconds);w.update(batch.stepSeconds,{render:i===batch.steps-1});}
      if(!batch.steps)w.update(0);
    }
    assert.equal(view.renders,fps*3);assert.ok(Math.abs(Math.hypot(w.player.x,w.player.z)-4.35*3)<1e-7);
    outcomes.push({position:w.getPosition(),elapsed:battle.elapsed,actors:battle.actors.map(a=>({id:a.id,atb:a.atb,heat:a.heat,hp:a.hp,shield:a.shield}))});
  }
  assert.deepEqual(outcomes[1],outcomes[0]);assert.deepEqual(outcomes[2],outcomes[0]);
});
