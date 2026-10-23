import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createStoryState, migrateStoryState, recordVisit, getConversation,
  readTopic, chooseReply, getCodexEntries,
} from '../src/story.js';
import {
  newGame, recruit, unlockedZones, zoneEncounters, winEncounter,
  completeZone, encodeSave, decodeSave, saveTo, loadFrom,
} from '../src/state.js';
import { writeManualSave, readManualSave } from '../src/save-slots.js';

const clone = value => JSON.parse(JSON.stringify(value));
const ids = state => getCodexEntries(state).map(entry => entry.id);
const snapshot = state => JSON.stringify(state);
function travel(state, zone) {
  assert.ok(unlockedZones(state).includes(zone));
  state.zone = zone;
  state.position = null;
  assert.equal(recordVisit(state, zone), true);
}
function finish(state, zone, choice) {
  travel(state, zone);
  for (const encounter of zoneEncounters(zone)) assert.equal(winEncounter(state, encounter), true);
  assert.equal(completeZone(state, zone, choice), true);
  assert.deepEqual(decodeSave(encodeSave(state)), state);
}
function afterEden() {
  const state = newGame();
  state.flags.briefed = true;
  finish(state, 'eden-prime');
  travel(state, 'normandy');
  return state;
}
function afterCouncil(optional = []) {
  const state = afterEden();
  travel(state, 'citadel');
  for (const id of [...optional, 'tali']) assert.equal(recruit(state, id), true);
  assert.equal(completeZone(state, 'citadel'), true);
  travel(state, 'normandy');
  return state;
}

test('a new dossier has independent story state and only the relevant initial codex', () => {
  assert.deepEqual(newGame().story, { heard: [], choices: {}, codex: [], visitedZones: ['normandy'] });
  const first = createStoryState(), second = createStoryState();
  first.heard.push('nihlus:mission'); first.visitedZones.push('eden-prime');
  assert.deepEqual(second, { heard: [], choices: {}, codex: [], visitedZones: ['normandy'] });
  assert.deepEqual(ids(newGame()), ['relay', 'heat', 'normandy', 'atb']);
  assert.ok(ids(newGame({ classId: 'adept' })).includes('biotic'));
  assert.ok(ids(newGame({ classId: 'adept' })).includes('stasis'));
  assert.ok(!ids(newGame({ classId: 'vanguard' })).includes('stasis'));
  assert.ok(!ids(newGame({ classId: 'engineer' })).includes('biotic'));
});

test('opening conversations is read-only and rejects unavailable speakers and locations', () => {
  const state = newGame();
  const before = snapshot(state);
  for (const id of ['nihlus', 'joker', 'chakwas', 'kaidan']) assert.ok(getConversation(state, id));
  for (const id of ['ashley', 'garrus', 'tali', 'wrex', 'liara', '__proto__', 'constructor', null]) assert.equal(getConversation(state, id), null);
  assert.equal(snapshot(state), before);
  state.flags.briefed = true;
  travel(state, 'eden-prime');
  assert.equal(getConversation(state, 'kaidan'), null);
});

test('Nihlus is available only before the first Eden Prime visit while earlier knowledge persists', () => {
  const state = newGame();
  assert.equal(readTopic(state, 'nihlus', 'spectres').ok, true);
  assert.equal(readTopic(state, 'nihlus', 'spectres').ok, true);
  assert.deepEqual(state.story.heard, ['nihlus:spectres']);
  assert.deepEqual(state.story.codex, ['spectre']);
  assert.ok(ids(state).includes('spectre'));
  state.flags.briefed = true;
  travel(state, 'eden-prime');
  travel(state, 'normandy');
  assert.equal(state.flags.jenkinsLost, undefined);
  assert.equal(getConversation(state, 'nihlus'), null, 'Visiting Eden Prime is sufficient; Jenkins need not have died yet');
  assert.equal(readTopic(state, 'nihlus', 'mission').ok, false);
  assert.deepEqual(decodeSave(encodeSave(state)), state);
  assert.ok(ids(state).includes('spectre'));
});

test('Joker prioritizes the post-prologue report until read, then restores ordinary conversation', () => {
  const state = newGame();
  assert.deepEqual(getConversation(state, 'joker').topics.map(topic => topic.id), ['pilotage']);
  assert.equal(readTopic(state, 'joker', 'eden-prime-report').ok, false);
  state.flags.briefed = true;
  finish(state, 'eden-prime');
  travel(state, 'normandy');
  assert.deepEqual(getConversation(state, 'joker').topics.map(topic => topic.id), ['eden-prime-report']);
  assert.equal(readTopic(state, 'joker', 'pilotage').ok, false);
  assert.equal(readTopic(state, 'joker', 'eden-prime-report').ok, true);
  assert.deepEqual(getConversation(state, 'joker').topics.map(topic => topic.id), ['pilotage']);
  assert.equal(readTopic(state, 'joker', 'pilotage').ok, true);
  assert.ok(state.story.heard.includes('joker:eden-prime-report'));
  assert.deepEqual(decodeSave(encodeSave(state)), state);
});

test('Chakwas discusses the vision only after the beacon and Kaidan discusses L2 implants', () => {
  const initial = newGame();
  assert.ok(!getConversation(initial, 'chakwas').topics.some(topic => topic.id === 'vision'));
  assert.equal(readTopic(initial, 'chakwas', 'vision').ok, false);
  const kaidan = readTopic(initial, 'kaidan', 'implants');
  assert.equal(kaidan.ok, true);
  assert.match(kaidan.topic.text, /L2/);
  assert.ok(ids(initial).includes('biotic'));
  assert.ok(!ids(initial).includes('stasis'));
  const state = afterEden();
  assert.equal(readTopic(state, 'chakwas', 'vision').ok, true);
  assert.ok(ids(state).includes('protheans'));
});

test('companion topics follow actual recruitment without requiring optional recruits', () => {
  const state = afterCouncil();
  for (const id of ['kaidan', 'ashley', 'tali']) assert.ok(getConversation(state, id));
  for (const id of ['garrus', 'wrex', 'liara']) assert.equal(getConversation(state, id), null);
  assert.ok(ids(state).includes('quarian'));
  for (const id of ['asari', 'krogan', 'turian']) assert.ok(!ids(state).includes(id));
  travel(state, 'citadel');
  for (const id of ['garrus', 'wrex']) assert.equal(recruit(state, id), true);
  travel(state, 'normandy');
  assert.equal(readTopic(state, 'wrex', 'genophage').ok, true);
  assert.ok(getConversation(state, 'garrus'));
  assert.ok(ids(state).includes('turian'));
  assert.ok(ids(state).includes('krogan'));
});

test('Tali topics unlock their codex records once and do not mutate progress or combat resources', () => {
  const state = afterCouncil();
  const outsideStory = { ...state }; delete outsideStory.story;
  for (const topic of ['pilgrimage', 'flotilla', 'geth']) {
    assert.equal(readTopic(state, 'tali', topic).ok, true);
    assert.equal(readTopic(state, 'tali', topic).ok, true);
  }
  assert.equal(state.story.heard.filter(key => key.startsWith('tali:')).length, 3);
  assert.equal(state.story.codex.filter(id => id === 'quarian').length, 1);
  assert.equal(state.story.codex.filter(id => id === 'geth').length, 1);
  const afterwards = { ...state }; delete afterwards.story;
  assert.deepEqual(afterwards, outsideStory);
  assert.deepEqual(decodeSave(encodeSave(state)), state);
});

for (const replyId of ['procedure', 'results']) {
  test(`Garrus remembers the selected advice without invented bonuses: ${replyId}`, () => {
    const state = afterCouncil(['garrus']);
    const before = snapshot(state);
    assert.equal(chooseReply(state, 'garrus', 'procedure', replyId).ok, false, 'Reading the topic precedes answering');
    assert.equal(snapshot(state), before);
    assert.ok(!getConversation(state, 'garrus').topics.some(topic => topic.id === 'followup'));
    assert.equal(readTopic(state, 'garrus', 'procedure').ok, true);
    const resources = [state.xp, state.credits, state.paragon, state.renegade];
    const answer = chooseReply(state, 'garrus', 'procedure', replyId);
    assert.equal(answer.ok, true);
    assert.equal(typeof answer.response, 'string');
    assert.equal(state.story.choices['garrus:procedure'], replyId);
    assert.deepEqual([state.xp, state.credits, state.paragon, state.renegade], resources);
    const followup = readTopic(state, 'garrus', 'followup');
    assert.equal(followup.ok, true);
    assert.match(followup.topic.text, replyId === 'procedure' ? /protéger les innocents/ : /privilégier les résultats/);
    assert.equal(chooseReply(state, 'garrus', 'procedure', replyId).ok, true);
    assert.equal(chooseReply(state, 'garrus', 'procedure', replyId === 'procedure' ? 'results' : 'procedure').ok, false);
    const loaded = decodeSave(encodeSave(state));
    assert.deepEqual(loaded, state);
    assert.equal(getConversation(loaded, 'garrus').topics.find(topic => topic.id === 'procedure').choices.length, 2);
  });
}

for (const choice of ['save-kaidan', 'save-ashley']) {
  test(`conversation history survives Virmire without making a dead companion reappear: ${choice}`, () => {
    const state = afterCouncil();
    assert.equal(readTopic(state, 'kaidan', 'implants').ok, true);
    assert.equal(readTopic(state, 'ashley', 'famille').ok, true);
    finish(state, 'feros', 'save');
    finish(state, 'noveria', 'release');
    finish(state, 'virmire', choice);
    travel(state, 'normandy');
    const lost = choice === 'save-kaidan' ? 'ashley' : 'kaidan';
    const survivor = choice === 'save-kaidan' ? 'kaidan' : 'ashley';
    assert.equal(getConversation(state, lost), null);
    assert.ok(getConversation(state, survivor));
    assert.ok(state.story.heard.includes('kaidan:implants'));
    assert.ok(state.story.heard.includes('ashley:famille'));
    assert.deepEqual(decodeSave(encodeSave(state)), state);
  });
}

test('Liara and spoiler codex entries respect Therum, Feros, Virmire and Ilos progression', () => {
  const state = afterCouncil();
  assert.equal(getConversation(state, 'liara'), null);
  for (const id of ['asari', 'cipher', 'sovereign', 'vigil']) assert.ok(!ids(state).includes(id));
  finish(state, 'therum');
  travel(state, 'normandy');
  assert.deepEqual(getConversation(state, 'liara').topics.map(topic => topic.id), ['archaeology']);
  assert.equal(readTopic(state, 'liara', 'archaeology').ok, true);
  assert.ok(ids(state).includes('asari'));
  assert.equal(readTopic(state, 'liara', 'vigil').ok, false);
  finish(state, 'feros', 'save');
  travel(state, 'normandy');
  assert.ok(ids(state).includes('cipher'));
  assert.equal(readTopic(state, 'liara', 'cipher').ok, true);
  assert.ok(!getConversation(state, 'liara').topics.some(topic => topic.id === 'vigil'));
  finish(state, 'virmire', 'save-kaidan');
  travel(state, 'normandy');
  assert.ok(ids(state).includes('sovereign'));
  assert.ok(!ids(state).includes('vigil'));
  finish(state, 'noveria', 'release');
  finish(state, 'ilos');
  travel(state, 'normandy');
  assert.ok(ids(state).includes('vigil'));
  assert.equal(readTopic(state, 'liara', 'vigil').ok, true);
  assert.deepEqual(decodeSave(encodeSave(state)), state);
});

test('codex search ignores French accents and case and never returns locked entries', () => {
  const initial = newGame();
  assert.deepEqual(getCodexEntries(initial, 'PROTHEENS'), []);
  assert.deepEqual(getCodexEntries(initial, 'sOvErEiGn'), []);
  const state = afterEden();
  assert.ok(getCodexEntries(state, 'PROTHEENS').some(entry => entry.id === 'protheans'));
  assert.ok(getCodexEntries(state, 'prothéens').some(entry => entry.id === 'protheans'));
  assert.ok(getCodexEntries(state, 'RELais').some(entry => entry.id === 'relay'));
  assert.deepEqual(getCodexEntries(state, 'aucun résultat à ce sujet'), []);
});

test('legacy migration derives only evidenced visits and does not mutate imported history', () => {
  const state = afterCouncil();
  travel(state, 'feros');
  assert.equal(winEncounter(state, 'feros:encounter-1'), true);
  const data = JSON.parse(encodeSave(state));
  delete data.state.story;
  const loaded = decodeSave(data);
  assert.ok(loaded);
  assert.deepEqual(new Set(loaded.story.visitedZones), new Set(['normandy', 'eden-prime', 'citadel', 'feros']));
  assert.ok(!loaded.story.visitedZones.includes('therum'), 'Unlocked does not mean visited');
  assert.deepEqual(loaded.story.heard, []);
  const original = clone(loaded.story);
  const migrated = migrateStoryState(loaded.story, loaded);
  migrated.heard.push('joker:eden-prime-report');
  migrated.choices['garrus:procedure'] = 'procedure';
  migrated.codex.push('relay');
  migrated.visitedZones.push('therum');
  assert.deepEqual(loaded.story, original);
  data.state.story = null;
  assert.equal(decodeSave(data), null);
});

test('malformed histories, fabricated replies, impossible visits and spoilers are rejected', () => {
  const state = newGame();
  const bad = [
    null, [], {}, { ...createStoryState(), extra: [] },
    { ...createStoryState(), heard: ['nihlus:mission', 'nihlus:mission'] },
    { ...createStoryState(), heard: ['unknown:topic'] },
    { ...createStoryState(), heard: ['chakwas:vision'] },
    { ...createStoryState(), heard: ['liara:vigil'] },
    { ...createStoryState(), heard: ['garrus:procedure'] },
    { ...createStoryState(), choices: { 'garrus:procedure': 'results' } },
    { ...createStoryState(), codex: ['vigil'] },
    { ...createStoryState(), codex: ['asari'] },
    { ...createStoryState(), codex: ['biotic'] },
    { ...createStoryState(), codex: ['relay', 'relay'] },
    { ...createStoryState(), visitedZones: ['ilos', 'normandy'] },
    { ...createStoryState(), visitedZones: ['normandy', 'unknown'] },
    { ...createStoryState(), visitedZones: [] },
  ];
  for (const raw of bad) assert.equal(migrateStoryState(raw, state), null);
  const garrus = afterCouncil(['garrus']);
  for (const raw of [
    { ...createStoryState(), heard: ['garrus:followup'] },
    { ...createStoryState(), heard: ['garrus:procedure'], choices: { 'garrus:procedure': 'force' } },
    { ...createStoryState(), heard: ['garrus:procedure'], choices: { unknown: 'procedure' } },
  ]) assert.equal(migrateStoryState(raw, garrus), null);
});

test('prototype-bearing, accessor and cyclic history records are rejected without invoking getters', () => {
  const state = newGame();
  const raw = createStoryState();
  raw.choices = JSON.parse('{"__proto__":{"polluted":true}}');
  assert.equal(migrateStoryState(raw, state), null);
  const inherited = createStoryState();
  inherited.choices = Object.create({ 'garrus:procedure': 'results' });
  assert.equal(migrateStoryState(inherited, state), null);
  let invoked = false;
  const accessor = createStoryState();
  Object.defineProperty(accessor, 'heard', { enumerable: true, get() { invoked = true; return []; } });
  assert.equal(migrateStoryState(accessor, state), null);
  assert.equal(invoked, false);
  const cyclic = createStoryState(); cyclic.choices.loop = cyclic;
  assert.equal(migrateStoryState(cyclic, state), null);
  const sparse = createStoryState(); sparse.heard = new Array(1);
  assert.equal(migrateStoryState(sparse, state), null);
  const concealedHole = createStoryState();
  concealedHole.visitedZones = ['normandy', ,];
  concealedHole.visitedZones.x = 'eden-prime';
  assert.equal(Object.keys(concealedHole.visitedZones).length, concealedHole.visitedZones.length);
  assert.equal(migrateStoryState(concealedHole, state), null, 'A named property cannot conceal a missing array index');
  const customArray = createStoryState(); Object.setPrototypeOf(customArray.heard, Object.create(Array.prototype));
  assert.equal(migrateStoryState(customArray, state), null);
});

test('topic and codex results are copies and invalid interaction IDs cannot mutate history', () => {
  const state = newGame();
  getConversation(state, 'nihlus').topics[0].text = 'Modified';
  getCodexEntries(state)[0].text = 'Modified';
  assert.notEqual(getConversation(state, 'nihlus').topics[0].text, 'Modified');
  assert.notEqual(getCodexEntries(state)[0].text, 'Modified');
  const before = snapshot(state);
  for (const id of ['constructor', '__proto__', 'unknown']) {
    assert.equal(readTopic(state, 'nihlus', id).ok, false);
    assert.equal(chooseReply(state, id, 'procedure', 'results').ok, false);
  }
  assert.equal(snapshot(state), before);
});

test('story history persists through automatic saves and independent manual slots', () => {
  const state = afterCouncil(['garrus']);
  assert.equal(readTopic(state, 'garrus', 'procedure').ok, true);
  assert.equal(chooseReply(state, 'garrus', 'procedure', 'procedure').ok, true);
  const records = new Map();
  const storage = { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value) };
  assert.equal(saveTo(storage, state), true);
  assert.equal(writeManualSave(storage, '1', state, { name: 'Conseil et procédures' }).ok, true);
  assert.deepEqual(loadFrom(storage), state);
  assert.deepEqual(readManualSave(storage, '1').state, state);
});
