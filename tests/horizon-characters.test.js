import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { HORIZON_NPCS, HORIZON_STORY_CONVERSATIONS, getHorizonNPC, horizonNPCVisible,
  normalizeHorizonNPCAtlas, getHorizonNPCFrame } from '../src/horizon-characters.js';
import { newGame, zoneEncounters, winEncounter, completeZone, recruit, encodeSave, decodeSave } from '../src/state.js';
import { getConversation, readTopic, migrateStoryState, recordVisit } from '../src/story.js';
import { OPERATIONS } from '../src/operation-data.js';
const clone = value => structuredClone(value);
const metadata = JSON.parse(readFileSync(new URL('../public/assets/horizon-npcs.json',import.meta.url)));
const withoutStory = state => { const copy=clone(state);delete copy.story;return copy; };
function travel(state,zone) { state.zone=zone;state.position=null;assert.equal(recordVisit(state,zone),true); }
function finish(state,zone,choice) {
  travel(state,zone);for(const id of zoneEncounters(zone))assert.equal(winEncounter(state,id),true);
  assert.equal(completeZone(state,zone,choice),true);
}
function afterEden() {
  const state=newGame();state.flags.briefed=true;finish(state,'eden-prime');travel(state,'citadel');return state;
}
function afterCouncil() {
  const state=afterEden();assert.equal(recruit(state,'tali'),true);assert.equal(completeZone(state,'citadel'),true);travel(state,'feros');return state;
}

test('eight new encounter identities are distinct civilians, with four informational links to real operation IDs',()=>{
  assert.equal(HORIZON_NPCS.length,8);assert.equal(new Set(HORIZON_NPCS.map(npc=>npc.catalogId)).size,8);
  assert.equal(new Set(HORIZON_NPCS.map(npc=>npc.id)).size,8);
  assert.equal(Object.values(HORIZON_STORY_CONVERSATIONS).flatMap(c=>c.topics).length,16);
  for(const key of ['constructor','__proto__','toString',null,{},'NPC-fai-dan'])assert.equal(getHorizonNPC(key),null);
  assert.throws(()=>{getHorizonNPC('pallin').visual.frame='garrus';},TypeError);
  for(const[id,operationId]of [['fai-dan','feros-geth-tunnels'],['macha','feros-water'],['michel','citadel-doctor-michel']]) {
    assert.equal(getHorizonNPC(id).operationId,operationId);assert.ok(OPERATIONS.some(op=>op.id===operationId));
  }
  assert.equal(getHorizonNPC('davin').operationId,'feros-varrens');
  assert.ok(HORIZON_NPCS.every(npc=>npc.visual.file==='horizon-npcs.png'&&!npc.companion));
});

test('native immutable PNG and all eight measured frames are paired; foreign, overlapping and malformed atlases fail closed',()=>{
  const png=readFileSync(new URL('../public/assets/horizon-npcs.png',import.meta.url));
  assert.equal(createHash('sha256').update(png).digest('hex'),metadata.provenance.sha256);
  assert.equal(png.readUInt32BE(16),1536);assert.equal(png.readUInt32BE(20),1024);
  const atlas=normalizeHorizonNPCAtlas(metadata);assert.ok(atlas);assert.ok(Object.isFrozen(atlas.frames));
  for(const npc of HORIZON_NPCS){
    assert.deepEqual(getHorizonNPCFrame(npc.id,atlas),metadata.frames[npc.id]);
    assert.equal(getHorizonNPCFrame(npc.id,atlas).pivot[1],metadata.frames[npc.id].rect[3]-8);
  }
  assert.ok(atlas.frames['barla-von'].height<atlas.frames.harkin.height);
  assert.ok(atlas.frames.pallin.height>atlas.frames.harkin.height);
  for(const key of ['jenkins','garrus','constructor',null])assert.equal(getHorizonNPCFrame(key,atlas),null);
  for(const mutate of [
    a=>{a.mediaId='ME2';},a=>{a.periodId='me3';},a=>{a.alphaCutoff=0;},a=>{a.file='../crew-atlas.png';},
    a=>{delete a.frames.harkin;},a=>{a.frames.garrus=clone(a.frames.pallin);},a=>{a.frames.macha.rect=clone(a.frames.arcelia.rect);},
    a=>{a.frames.michel.pivot[0]=-1;},a=>{a.frames.pallin.rect[3]=9999;},a=>{a.frames.davin.height=NaN;},
  ]){const invalid=clone(metadata);mutate(invalid);assert.equal(normalizeHorizonNPCAtlas(invalid),null);}
});

test('Citadel contacts need a completed Eden mission and remain in their own ME1 zone',()=>{
  const locked=newGame();locked.zone='citadel';
  for(const npc of HORIZON_NPCS.filter(npc=>npc.zone==='citadel'))assert.equal(getConversation(locked,npc.id),null);
  const state=afterEden();
  for(const npc of HORIZON_NPCS.filter(npc=>npc.zone==='citadel')){
    assert.ok(horizonNPCVisible(state,npc));assert.equal(getConversation(state,npc.id).topics.length,2);
    for(const foreign of [{...state,mediaId:'ME2'},{...state,periodId:'me3'},{...state,context:{mediaId:'MEA'}},{...state,context:{periodId:'me2'}}]){
      assert.equal(horizonNPCVisible(foreign,npc),false);assert.equal(getConversation(foreign,npc.id),null);
    }
  }
  travel(state,'normandy');for(const npc of HORIZON_NPCS)assert.equal(getConversation(state,npc.id),null);
});

test('Feros information contacts need Council/Spectre and all leave before the boss outcome can resurrect Fai Dan',()=>{
  const locked=afterEden();locked.zone='feros';
  for(const npc of HORIZON_NPCS.filter(npc=>npc.zone==='feros'))assert.equal(getConversation(locked,npc.id),null);
  const state=afterCouncil();
  for(const npc of HORIZON_NPCS.filter(npc=>npc.zone==='feros')){
    assert.ok(getConversation(state,npc.id));assert.equal(horizonNPCVisible({...state,flags:{...state.flags,spectre:false}},npc),false);
    assert.equal(horizonNPCVisible({...state,cleared:[...state.cleared,'feros:boss']},npc),false);
    assert.equal(horizonNPCVisible({...state,completed:[...state.completed,'feros']},npc),false);
    assert.equal(horizonNPCVisible({...state,zone:'noveria'},npc),false);
  }
});

test('sixteen real topics can be read repeatedly and saved without operation, inventory, reward or recruitment mutation',()=>{
  const state=afterCouncil();travel(state,'citadel');
  for(const zone of ['citadel','feros']){
    travel(state,zone);const before=withoutStory(state);
    for(const npc of HORIZON_NPCS.filter(npc=>npc.zone===zone))for(const topic of getConversation(state,npc.id).topics){
      assert.equal(readTopic(state,npc.id,topic.id).ok,true);assert.equal(readTopic(state,npc.id,topic.id).ok,true);
    }
    assert.deepEqual(withoutStory(state),before);assert.deepEqual(decodeSave(encodeSave(state)),state);
  }
  assert.equal(state.story.heard.length,16);
  assert.ok(!state.operations.records['feros-water']);assert.ok(!state.operations.records['feros-varrens']);
});

test('heard Feros topics remain valid history after either colony decision; dead contacts cannot be reopened',()=>{
  for(const decision of ['save','force']){
    const state=afterCouncil();
    for(const npc of HORIZON_NPCS.filter(npc=>npc.zone==='feros'))for(const topic of getConversation(state,npc.id).topics)assert.equal(readTopic(state,npc.id,topic.id).ok,true);
    for(const id of zoneEncounters('feros'))assert.equal(winEncounter(state,id),true);
    assert.ok(migrateStoryState(state.story,state));assert.equal(completeZone(state,'feros',decision),true);
    const before=clone(state);
    for(const npc of HORIZON_NPCS.filter(npc=>npc.zone==='feros')){
      assert.equal(getConversation(state,npc.id),null);assert.equal(readTopic(state,npc.id,HORIZON_STORY_CONVERSATIONS[npc.id].topics[0].id).ok,false);
    }
    assert.deepEqual(state,before);assert.equal(state.story.heard.length,8);assert.deepEqual(decodeSave(encodeSave(state)),state);
  }
});

test('new topic IDs cannot forge knowledge before their native narrative gates, while legacy saves still migrate',()=>{
  for(const[state,key]of [[newGame(),'pallin:csec'],[newGame(),'fai-dan:colony'],[afterEden(),'davin:varrens']]){
    const original=clone(state);state.story.heard.push(key);
    assert.equal(migrateStoryState(state.story,state),null);assert.equal(decodeSave(encodeSave(state)),null);
    assert.deepEqual(original.story.heard,[]);
  }
  const legacy=newGame();delete legacy.story;
  const migrated=decodeSave(encodeSave(legacy));assert.ok(migrated);assert.deepEqual(migrated.story.heard,[]);
});
