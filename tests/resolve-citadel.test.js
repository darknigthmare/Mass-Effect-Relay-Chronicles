import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, travelCampaign, winEncounter, completeZone, encodeSave, decodeSave, recruit,
  applyResolveCitadel, winResolveCitadelEncounter, objectiveReady } from '../src/state.js';
import { createResolveCitadelState, normalizeResolveCitadelState, getResolveCitadelInteraction,
  getResolveCitadelEncounter, transitionResolveCitadel, resolveCitadelReport, listResolveCitadelPOIs } from '../src/resolve-citadel.js';
import { actorFor } from '../src/game-data.js';
import { getConversation, readTopic } from '../src/story.js';
import { createBattle, performAction, tickBattle } from '../src/combat.js';
const snapshot = state => JSON.stringify(state);
const load = state => decodeSave(encodeSave(state));
function citadel() {
  const state = newGame({ difficulty: 'story' }); state.flags.briefed = true;
  assert.ok(travelCampaign(state, 'eden-prime').ok);
  for (const id of ['encounter-1', 'encounter-2', 'boss']) assert.ok(winEncounter(state, `eden-prime:${id}`));
  assert.ok(completeZone(state, 'eden-prime'));
  assert.ok(travelCampaign(state, 'citadel').ok);
  return state;
}
function act(state, id, choice) { const result = applyResolveCitadel(state,id,choice); assert.ok(result.ok, result.reason); assert.ok(load(state)); return result; }
function victory(state,key) { const result = winResolveCitadelEncounter(state, `resolve-citadel:${key}-battle`); assert.ok(result.ok,result.reason); assert.ok(load(state)); return result; }
function clinic(state) { victory(state,'clinic'); act(state,'michel','testimony'); }
function fist(state,choice='spare') { victory(state,'fist'); act(state,'fist',choice); }

test('only absent historical Citadel receipts migrate without inventing Fist or contacts', () => {
  const state = citadel(); recruit(state,'tali'); const packet = JSON.parse(encodeSave(state)); delete packet.state.resolveCitadel;
  const migrated = decodeSave(packet); assert.ok(migrated); assert.equal(migrated.resolveCitadel.legacy,true);
  assert.equal(migrated.resolveCitadel.fist,null); assert.equal(migrated.resolveCitadel.hearing,false);
  assert.match(resolveCitadelReport(migrated).fistStatus,/Non enregistré/);
  for (const invalid of [null, false, undefined, {}, {...createResolveCitadelState(), version:2}]) {
    const bad = {...packet,state:{...packet.state,resolveCitadel:invalid}}; assert.equal(decodeSave(bad),null);
  }
});

test('strict receipt rejects accessor, extra fields, invented outcomes and chronology', () => {
  const state = citadel(), base = createResolveCitadelState();
  for (const changed of [{hearing:false,harkin:true},{clinic:true},{fist:'spared',fistWrex:false},
    {hearing:true,rescue:true},{hearing:true,proof:true},{legacy:true,hearing:true}, {nihlus:3}]) {
    assert.equal(normalizeResolveCitadelState({...base,...changed},state),null);
  }
  let read = false; const getter = {...base}; Object.defineProperty(getter,'hearing',{get(){read=true;return false;},enumerable:true});
  assert.equal(normalizeResolveCitadelState(getter,state),null); assert.equal(read,false);
  assert.equal(normalizeResolveCitadelState({...base,extra:true},state),null);
  const bad = {...base,battles:{clinic:false,fist:false,ambush:false,extra:false}}; assert.equal(normalizeResolveCitadelState(bad,state),null);
  const nested = {...base,battles:{...base.battles}};
  Object.defineProperty(nested.battles,'clinic',{get(){read=true;return false;},enumerable:true});
  assert.equal(normalizeResolveCitadelState(nested,state),null); assert.equal(read,false);
  assert.equal(normalizeResolveCitadelState(base,{...state,mediaId:'ME2'}),null);
});

test('first report records the demand for evidence with no early promotion or reward', () => {
  const state = citadel(), xp=state.xp, credits=state.credits;
  assert.equal(getResolveCitadelInteraction(state,'harkin').ok,false);
  act(state,'hearing','report');
  assert.equal(state.flags.spectre,undefined); assert.equal(objectiveReady(state,'citadel'),false);
  assert.equal(state.xp,xp); assert.equal(state.credits,credits);
  const before = snapshot(state); assert.equal(act(state,'hearing','report').changed,false); assert.equal(snapshot(state),before);
});

test('Harkin, Barla and direct clinic remain flexible routes with independent receipts', () => {
  for (const route of [['harkin','barla-von'],['barla-von','harkin'],[]]) {
    const state = citadel(); act(state,'hearing','report');
    for (const contact of route) act(state,contact,'lead');
    clinic(state); assert.equal(state.resolveCitadel.michel,true);
    assert.equal(state.resolveCitadel.harkin,route.includes('harkin'));
    assert.equal(state.resolveCitadel.barla,route.includes('barla-von'));
    assert.ok(getResolveCitadelInteraction(state,'fist').ok);
  }
});

test('medical inquiry does not complete, reward or overwrite Doctor Michel blackmail service', () => {
  const state = citadel(); const operations=JSON.stringify(state.operations);
  act(state,'hearing','report'); clinic(state);
  assert.equal(JSON.stringify(state.operations),operations);
  assert.match(getResolveCitadelInteraction(state,'michel').text,/fournitures.*chantage restent séparées/);
});

test('all battle previews detach actors and cannot secure or reward an encounter', () => {
  const state = citadel(); act(state,'hearing','report'); const before=snapshot(state);
  const one = getResolveCitadelEncounter(state,'resolve-citadel:clinic-battle'); assert.ok(one.ok);
  one.enemies[0].powers.push('warp'); one.enemies[0].hp=1;
  const two = getResolveCitadelEncounter(state,'resolve-citadel:clinic-battle'); assert.equal(two.enemies[0].hp,100); assert.deepEqual(two.enemies[0].powers,[]);
  assert.equal(snapshot(state),before); assert.deepEqual(state.cleared.filter(id=>id.startsWith('citadel')),[]);
  assert.equal(getResolveCitadelEncounter(state,'resolve-citadel:fist-battle').ok,false);
  assert.equal(getResolveCitadelEncounter(state,'resolve-citadel:ambush-battle').ok,false);
});

test('all three real ATB definitions play to victory and grant one adapted receipt each', () => {
  const state = citadel(); act(state,'hearing','report'); const xp=state.xp, credits=state.credits;
  for (const key of ['clinic','fist','ambush']) {
    const id=`resolve-citadel:${key}-battle`, model=getResolveCitadelEncounter(state,id); assert.ok(model.ok);
    const battle=createBattle({party:state.party.map(id=>actorFor(id,state)),enemies:model.enemies,difficulty:'story',mode:'active',seed:99,medigel:9});
    for(let frame=0;frame<20000&&!battle.winner;frame++) {
      tickBattle(battle,.1);
      for (const actor of battle.actors.filter(a=>a.team==='party'&&a.hp>0&&a.atb>=100)) {
        const target=battle.actors.find(a=>a.team==='enemy'&&a.hp>0);
        if(target)performAction(battle,{actorId:actor.id,actionId:'shoot',targetId:target.id});
      }
    }
    assert.equal(battle.winner,'party',key); victory(state,key);
    const after=snapshot(state); assert.equal(winResolveCitadelEncounter(state,id).ok,false); assert.equal(snapshot(state),after);
    if(key==='clinic')act(state,'michel','testimony');
    if(key==='fist')act(state,'fist','spare');
  }
  assert.equal(state.xp,xp+195); assert.equal(state.credits,credits+255);
  assert.equal(state.resolveCitadel.rescue,true); assert.equal(state.recruited.includes('tali'),false);
});

test('Wrex recruited but absent permits spare or Shepard kill; both persist without losing the clue', () => {
  for(const choice of ['spare','kill']) {
    const state=citadel(); act(state,'hearing','report'); assert.ok(recruit(state,'wrex')); fist(state,choice);
    const p=load(state).resolveCitadel; assert.equal(p.fist,choice==='spare'?'spared':'shepard'); assert.equal(p.fistWrex,false);
    assert.ok(getResolveCitadelEncounter(state,'resolve-citadel:ambush-battle').ok);
    const before=snapshot(state); assert.equal(applyResolveCitadel(state,'fist',choice).ok,false); assert.equal(snapshot(state),before);
  }
});

test('Wrex present in the real deployed group executes the contract and stale spare is refused', () => {
  const state=citadel(); act(state,'hearing','report'); recruit(state,'wrex'); state.party=['shepard','kaidan','wrex'];
  victory(state,'fist'); assert.deepEqual(getResolveCitadelInteraction(state,'fist').choices.map(c=>c.id),['wrex','leave']);
  const before=snapshot(state); assert.equal(applyResolveCitadel(state,'fist','spare').ok,false); assert.equal(snapshot(state),before);
  act(state,'fist','wrex'); assert.equal(load(state).resolveCitadel.fist,'wrex');
});

test('Fist presence snapshot survives extraction and later changes of active group', () => {
  const state=citadel(); act(state,'hearing','report'); recruit(state,'wrex'); state.party=['shepard','kaidan','wrex']; victory(state,'fist');
  state.party=['shepard','kaidan','ashley'];
  assert.equal(getResolveCitadelInteraction(load(state),'fist').choices[0].id,'wrex');
});

test('Tali is unavailable before rescue and the proof/recruitment receipt is atomic and unique', () => {
  const state=citadel(); act(state,'hearing','report'); clinic(state); fist(state);
  assert.equal(getResolveCitadelInteraction(state,'tali-proof').ok,false); assert.equal(recruit(state,'tali'),false);
  victory(state,'ambush'); assert.equal(recruit(state,'tali'),false); const xp=state.xp,credits=state.credits;
  act(state,'tali-proof','receive'); assert.ok(state.recruited.includes('tali')); assert.ok(objectiveReady(state,'citadel'));
  assert.ok(state.logs.some(log=>log.title==='Preuve de Tali'&&/enregistrement/.test(log.text)));
  assert.equal(state.xp,xp); assert.equal(state.credits,credits);
  const before=snapshot(state); assert.equal(applyResolveCitadel(state,'tali-proof','receive').ok,false); assert.equal(snapshot(state),before);
  assert.ok(completeZone(state,'citadel')); assert.ok(load(state));
});

test('foreign scope, remote interactions and reward overflow fail without mutation', () => {
  const state=citadel(); act(state,'hearing','report');
  for(const altered of [{zone:'normandy'},{context:{mediaId:'ME2',periodId:'me2'}}]) {
    const candidate={...state,...altered}, before=snapshot(candidate); assert.equal(applyResolveCitadel(candidate,'harkin','lead').ok,false); assert.equal(snapshot(candidate),before);
  }
  state.credits=1_000_000_000; const before=snapshot(state);
  assert.equal(winResolveCitadelEncounter(state,'resolve-citadel:clinic-battle').ok,false); assert.equal(snapshot(state),before);
});

test('Nihlus reveals evaluation only after the briefing, and Joker return precedes ordinary topics', () => {
  const state=newGame(); assert.equal(getResolveCitadelInteraction(state,'nihlus').choices.some(c=>c.id==='evaluation'),false);
  assert.equal(getConversation(state,'nihlus').topics.some(topic=>topic.id==='mission'),false);
  assert.equal(readTopic(state,'nihlus','mission').ok,false);
  assert.equal(normalizeResolveCitadelState({...state.resolveCitadel,nihlus:2},state),null);
  assert.equal(applyResolveCitadel(state,'nihlus','evaluation').ok,false);
  act(state,'nihlus','colony'); assert.equal(getResolveCitadelInteraction(state,'nihlus').choices.some(c=>c.id==='evaluation'),false);
  state.flags.briefed=true; assert.ok(getConversation(state,'nihlus').topics.some(topic=>topic.id==='mission'));
  act(state,'nihlus','evaluation'); assert.equal(state.resolveCitadel.nihlus,2);
  assert.equal(getResolveCitadelInteraction(state,'joker').ok,false);
  const after=citadel(); assert.ok(travelCampaign(after,'normandy').ok);
  assert.ok(getResolveCitadelInteraction(after,'joker').ok); act(after,'joker','report');
  assert.equal(getResolveCitadelInteraction(load(after),'joker').ok,false); assert.equal(getResolveCitadelInteraction(after,'nihlus').ok,false);
});

test('public markers and journal report are detached and respect historical and chapter boundaries', () => {
  const state=citadel(); const markers=listResolveCitadelPOIs(state); assert.equal(markers.length,1); markers[0].x=9999;
  assert.notEqual(listResolveCitadelPOIs(state)[0].x,9999); assert.equal(listResolveCitadelPOIs({...state,context:{mediaId:'ME3',periodId:'me3'}}).length,0);
  act(state,'hearing','report'); const report=resolveCitadelReport(state); report.battles.clinic=true;
  assert.equal(state.resolveCitadel.battles.clinic,false);
  const leave=transitionResolveCitadel(state,'harkin','leave'); assert.equal(leave.changed,false); assert.equal(state.resolveCitadel.harkin,false);
});
