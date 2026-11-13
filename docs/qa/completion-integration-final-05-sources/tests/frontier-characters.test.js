import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { FRONTIER_NPCS, FRONTIER_STORY_CONVERSATIONS, getFrontierNPC, frontierNPCVisible,
  normalizeFrontierNPCAtlas, getFrontierNPCFrame } from '../src/frontier-characters.js';
import { getConversation, readTopic, migrateStoryState, recordVisit } from '../src/story.js';
import { newGame, recruit, zoneEncounters, winEncounter, completeZone, encodeSave, decodeSave } from '../src/state.js';

const sourceAtlas = JSON.parse(readFileSync(new URL('../public/assets/frontier-npcs.json', import.meta.url)));
const clone = value => JSON.parse(JSON.stringify(value));
function travel(state, zone) { state.zone = zone; state.position = null; assert.equal(recordVisit(state, zone), true); }
function finish(state, zone) {
  travel(state, zone);
  for (const encounter of zoneEncounters(zone)) assert.equal(winEncounter(state, encounter), true);
  assert.equal(completeZone(state, zone), true);
}
function afterCouncil() {
  const state = newGame(); state.flags.briefed = true;
  finish(state, 'eden-prime'); travel(state, 'citadel');
  assert.equal(recruit(state, 'tali'), true); assert.equal(completeZone(state, 'citadel'), true);
  travel(state, 'noveria'); return state;
}
const withoutStory = state => { const copy = clone(state); delete copy.story; return copy; };

test('eight distinct catalogue NPCs keep Jenkins on his existing body and seven measured new bodies', () => {
  assert.equal(FRONTIER_NPCS.length, 8);
  assert.equal(new Set(FRONTIER_NPCS.map(npc => npc.catalogId)).size, 8);
  assert.equal(new Set(FRONTIER_NPCS.map(npc => npc.conversationId)).size, 8);
  assert.deepEqual(getFrontierNPC('jenkins').visual, { legacySprite: 'jenkins' });
  assert.equal(FRONTIER_NPCS.filter(npc => npc.visual.atlas).length, 7);
  assert.equal(Object.values(FRONTIER_STORY_CONVERSATIONS).flatMap(conversation => conversation.topics).length, 16);
  for (const key of ['__proto__', 'constructor', 'toString', null, {}, 'NPC-greg-adams']) assert.equal(getFrontierNPC(key), null);
  assert.throws(() => { getFrontierNPC('adams').visual.frame = 'jenkins'; }, TypeError);
});

test('native image bytes, dimensions and measured independent frame contracts stay paired', () => {
  const png = readFileSync(new URL('../public/assets/frontier-npcs.png', import.meta.url));
  assert.equal(createHash('sha256').update(png).digest('hex'), sourceAtlas.provenance.sha256);
  assert.equal(png.readUInt32BE(16), sourceAtlas.width); assert.equal(png.readUInt32BE(20), sourceAtlas.height);
  const atlas = normalizeFrontierNPCAtlas(sourceAtlas); assert.ok(atlas); assert.ok(Object.isFrozen(atlas.frames));
  for (const npc of FRONTIER_NPCS.filter(npc => npc.visual.atlas)) {
    const frame = getFrontierNPCFrame(npc.characterKey, atlas);
    assert.ok(frame); assert.deepEqual(frame, sourceAtlas.frames[npc.id]);
    assert.equal(frame.pivot[1], frame.rect[3] - 8, 'feet retain eight pixels of effective-alpha padding');
  }
  for (const key of ['jenkins', 'nihlus', '__proto__', 'constructor', null]) assert.equal(getFrontierNPCFrame(key, atlas), null);
  for (const mutate of [
    value => { value.mediaId = 'ME2'; }, value => { value.periodId = 'me3'; },
    value => { value.frames.jenkins = clone(value.frames.adams); },
    value => { value.frames.adams.rect[0] = -1; }, value => { value.frames.adams.pivot[1] = 9999; },
    value => { value.frames.pressly.rect = [...value.frames.adams.rect]; },
    value => { value.frames.adams.height = NaN; }, value => { delete value.frames.lorik; },
    value => { value.alphaCutoff = 0; },
  ]) { const invalid = clone(sourceAtlas); mutate(invalid); assert.equal(normalizeFrontierNPCAtlas(invalid), null); }
});

test('availability closes foreign periods, locked Noveria, Jenkins loss and a first Eden visit', () => {
  const state = newGame(); assert.ok(frontierNPCVisible(state, 'adams')); assert.ok(frontierNPCVisible(state, 'jenkins'));
  assert.equal(frontierNPCVisible(state, 'parasini'), false);
  for (const context of [{ ...state, mediaId: 'ME2' }, { ...state, periodId: 'me3' }, { ...state, context: { mediaId: 'AND' } }]) {
    assert.equal(frontierNPCVisible(context, 'adams'), false); assert.equal(getConversation(context, 'adams'), null);
  }
  assert.equal(frontierNPCVisible({ ...state, lost: ['jenkins'] }, 'jenkins'), false);
  assert.equal(getConversation({ ...state, lost: ['jenkins'] }, 'jenkins'), null);
  state.flags.briefed = true; travel(state, 'eden-prime'); travel(state, 'normandy');
  assert.equal(state.flags.jenkinsLost, undefined); assert.equal(frontierNPCVisible(state, 'jenkins'), false);
  assert.equal(getConversation(state, 'jenkins'), null);
});

test('all Normandy topics execute without rewards, shopping or recruitment side effects', () => {
  const state = newGame(); const before = withoutStory(state);
  for (const npc of FRONTIER_NPCS.filter(npc => npc.zone === 'normandy')) {
    assert.equal(frontierNPCVisible(state, npc), true);
    const conversation = getConversation(state, npc.conversationId); assert.ok(conversation); assert.equal(conversation.topics.length, 2);
    for (const topic of conversation.topics) { assert.equal(readTopic(state, npc.id, topic.id).ok, true); assert.equal(readTopic(state, npc.id, topic.id).ok, true); }
  }
  assert.equal(state.story.heard.length, 8); assert.deepEqual(withoutStory(state), before);
  assert.deepEqual(decodeSave(encodeSave(state)), state);
  state.flags.briefed = true; finish(state, 'eden-prime'); travel(state, 'normandy');
  assert.equal(getConversation(state, 'jenkins'), null); assert.equal(state.flags.jenkinsLost, true);
  assert.ok(state.story.heard.includes('jenkins:deployment')); assert.ok(migrateStoryState(state.story, state));
  assert.deepEqual(decodeSave(encodeSave(state)), state);
  for (const id of ['adams', 'pressly', 'requisitions-officer']) assert.ok(getConversation(state, id));
});

test('Noveria conversations need Council completion and their own zone; they do not finish an investigation', () => {
  const locked = newGame(); locked.zone = 'noveria';
  for (const npc of FRONTIER_NPCS.filter(npc => npc.zone === 'noveria')) assert.equal(getConversation(locked, npc.id), null);
  const state = afterCouncil(); const before = withoutStory(state);
  for (const npc of FRONTIER_NPCS.filter(npc => npc.zone === 'noveria')) {
    assert.equal(frontierNPCVisible(state, npc), true);
    const conversation = getConversation(state, npc.id); assert.ok(conversation); assert.equal(conversation.topics.length, 2);
    for (const topic of conversation.topics) assert.equal(readTopic(state, npc.id, topic.id).ok, true);
  }
  assert.deepEqual(withoutStory(state), before); assert.equal(state.story.heard.length, 8);
  const parasini = getConversation(state, 'parasini').topics.map(topic => topic.text).join(' ');
  assert.doesNotMatch(parasini, /enquêtrice|infiltr|arrêt|corrompu|agent.*intérieur/i);
  assert.deepEqual(decodeSave(encodeSave(state)), state);
  travel(state, 'normandy');
  for (const id of ['parasini', 'anoleis', 'lorik', 'lilihierax']) assert.equal(getConversation(state, id), null);
  assert.ok(migrateStoryState(state.story, state));
  assert.deepEqual(decodeSave(encodeSave(state)), state);
});

test('new topic IDs do not permit forged conversation history before Noveria unlock', () => {
  const state = newGame(); const original = clone(state);
  state.story.heard.push('parasini:reception');
  assert.equal(migrateStoryState(state.story, state), null); assert.equal(decodeSave(encodeSave(state)), null);
  assert.deepEqual(original.story.heard, []);
  const legacy = clone(original); delete legacy.story;
  assert.deepEqual(decodeSave(encodeSave(legacy)).story, original.story);
});
