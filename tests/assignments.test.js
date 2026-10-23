import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAssignmentState, migrateAssignmentState, getAssignmentContacts,
  getAssignmentConversation, chooseAssignmentReply, getAssignments,
} from '../src/assignments.js';
import { ASSIGNMENTS, ASSIGNMENT_REWARD_XP } from '../src/assignment-data.js';
import {
  newGame, recruit, unlockedZones, zoneEncounters, winEncounter,
  completeZone, encodeSave, decodeSave, saveTo, loadFrom,
} from '../src/state.js';
import { writeManualSave, readManualSave } from '../src/save-slots.js';
import { recordVisit } from '../src/story.js';

const snapshot = state => JSON.stringify(state);
const clone = value => JSON.parse(JSON.stringify(value));
const contactIds = state => getAssignmentContacts(state).map(contact => contact.id);
const choiceIds = (state, contact) => getAssignmentConversation(state, contact)?.choices.map(choice => choice.id) || [];
function roundtrip(state) { assert.deepEqual(decodeSave(encodeSave(state)), state); }
function travel(state, zone) {
  assert.ok(unlockedZones(state).includes(zone)); state.zone = zone; state.position = null;
  assert.equal(recordVisit(state, zone), true);
}
function finish(state, zone, choice) {
  travel(state, zone);
  for (const id of zoneEncounters(zone)) assert.equal(winEncounter(state, id), true);
  assert.equal(completeZone(state, zone, choice), true); roundtrip(state);
}
function reachCouncil() {
  const state = newGame(); state.flags.briefed = true; finish(state, 'eden-prime');
  travel(state, 'citadel'); assert.equal(recruit(state, 'tali'), true);
  assert.equal(completeZone(state, 'citadel'), true); roundtrip(state); return state;
}
function afterWorld(state, zone, choice) { finish(state, zone, choice); travel(state, 'citadel'); }
function reply(state, contact, choice) {
  const result = chooseAssignmentReply(state, contact, choice);
  assert.equal(result.ok, true, result.reason); roundtrip(state); return result;
}

test('new and legacy assignment state starts independently with an empty journal', () => {
  const state = newGame();
  assert.deepEqual(state.assignments, { records: {} });
  assert.deepEqual(getAssignments(state), []);
  const first = createAssignmentState(), second = createAssignmentState();
  first.records.homecoming = { stage: 'requested', outcome: null, rewarded: false };
  assert.deepEqual(second, { records: {} });
  const old = JSON.parse(encodeSave(state)); delete old.state.assignments;
  assert.deepEqual(decodeSave(old), state);
  old.state.assignments = null; assert.equal(decodeSave(old), null);
});

test('contacts require the Council, the correct location and sufficient main-mission progress', () => {
  const state = newGame();
  assert.deepEqual(getAssignmentContacts(state), []);
  state.flags.briefed = true; finish(state, 'eden-prime'); travel(state, 'citadel');
  assert.deepEqual(getAssignmentContacts(state), []);
  assert.equal(getAssignmentConversation(state, 'samesh-bhatia'), null);
  assert.equal(recruit(state, 'tali'), true); assert.equal(completeZone(state, 'citadel'), true);
  assert.deepEqual(contactIds(state), ['samesh-bhatia', 'conrad-verner']);
  assert.equal(getAssignmentConversation(state, 'bosker'), null);
  assert.equal(getAssignmentConversation(state, 'petrovsky-family'), null);
  travel(state, 'normandy'); assert.deepEqual(getAssignmentContacts(state), []);
  assert.equal(chooseAssignmentReply(state, 'samesh-bhatia', 'accept-help').ok, false);
  afterWorld(state, 'therum');
  assert.ok(contactIds(state).includes('petrovsky-family'));
});

test('reading contacts and leaving conversations never creates records or rewards', () => {
  const state = reachCouncil(), before = snapshot(state);
  for (const contact of getAssignmentContacts(state)) {
    const first = getAssignmentConversation(state, contact.id);
    assert.ok(first.text.length > 0);
    assert.equal(chooseAssignmentReply(state, contact.id, 'leave').ok, true);
    first.choices[0].label = 'Modified'; first.text = 'Modified';
    assert.notEqual(getAssignmentConversation(state, contact.id).text, 'Modified');
  }
  assert.equal(snapshot(state), before);
  assert.deepEqual(getAssignments(state), []);
});

for (const [boskerChoice, outcome, nextStage] of [['return-body', 'return-body', 'body-authorized'], ['support-research', 'research', 'research-supported']]) {
  test(`Homecoming tracks the objective, informs Samesh and grants one reward: ${outcome}`, () => {
    const state = reachCouncil(), xp = state.xp, credits = state.credits;
    reply(state, 'samesh-bhatia', 'accept-help');
    assert.equal(state.assignments.records.homecoming.stage, 'requested');
    assert.equal(state.xp, xp);
    assert.ok(contactIds(state).includes('bosker'));
    assert.match(getAssignments(state)[0].objective, /Bosker/);
    reply(state, 'bosker', boskerChoice);
    assert.equal(state.assignments.records.homecoming.stage, nextStage);
    assert.equal(state.assignments.records.homecoming.outcome, outcome);
    assert.equal(state.xp, xp);
    assert.match(getAssignments(state)[0].objective, /Samesh/);
    const otherChoice = boskerChoice === 'return-body' ? 'support-research' : 'return-body';
    const before = snapshot(state);
    assert.equal(chooseAssignmentReply(state, 'bosker', otherChoice).ok, false);
    assert.equal(snapshot(state), before, 'A resolved Bosker decision cannot silently switch branches');
    const result = reply(state, 'samesh-bhatia', 'inform-family');
    assert.deepEqual(result.reward, { xp: ASSIGNMENT_REWARD_XP });
    assert.equal(state.xp, xp + 50);
    assert.equal(state.credits, credits);
    assert.deepEqual(state.assignments.records.homecoming, { stage: 'completed', outcome, rewarded: true });
    const journal = getAssignments(state)[0];
    assert.equal(journal.status, 'completed');
    assert.equal(journal.outcome, ASSIGNMENTS.homecoming.outcomes[outcome]);
    assert.deepEqual(choiceIds(state, 'samesh-bhatia'), ['leave']);
    assert.equal(getAssignmentConversation(state, 'bosker'), null);
    assert.ok(!contactIds(state).includes('bosker'));
    const completed = snapshot(state);
    for (let i = 0; i < 3; i++) {
      assert.equal(chooseAssignmentReply(state, 'samesh-bhatia', 'inform-family').ok, false);
      reply(state, 'samesh-bhatia', 'leave');
      travel(state, 'normandy'); travel(state, 'citadel');
    }
    assert.equal(state.xp, xp + 50);
    assert.equal(state.credits, credits);
    assert.deepEqual(state.assignments, JSON.parse(completed).assignments);
  });
}

for (const outcome of ['support-therapy', 'respect-refusal']) {
  test(`Family Matter preserves the advice without inventing medical results: ${outcome}`, () => {
    const state = reachCouncil(); afterWorld(state, 'therum');
    const xp = state.xp, credits = state.credits, morals = [state.paragon, state.renegade];
    const offer = getAssignmentConversation(state, 'petrovsky-family');
    assert.match(offer.text, /Jacob/);
    assert.match(offer.text, /Rebekah/);
    assert.doesNotMatch(offer.text, /\d|%/);
    reply(state, 'petrovsky-family', 'discuss-concerns');
    assert.equal(state.assignments.records.family.stage, 'discussion');
    assert.equal(state.xp, xp);
    const discussion = getAssignmentConversation(state, 'petrovsky-family');
    assert.doesNotMatch(discussion.text, /\d|%/);
    const result = reply(state, 'petrovsky-family', outcome);
    assert.equal(state.assignments.records.family.outcome, outcome);
    assert.deepEqual(result.reward, { xp: 50 });
    assert.equal(state.xp, xp + 50);
    assert.equal(state.credits, credits);
    assert.deepEqual([state.paragon, state.renegade], morals);
    assert.equal(getAssignments(state).find(entry => entry.id === 'family').status, 'completed');
    assert.deepEqual(choiceIds(state, 'petrovsky-family'), ['leave']);
    const after = snapshot(state);
    assert.equal(chooseAssignmentReply(state, 'petrovsky-family', outcome).ok, false);
    assert.equal(chooseAssignmentReply(state, 'petrovsky-family', outcome === 'support-therapy' ? 'respect-refusal' : 'support-therapy').ok, false);
    assert.equal(snapshot(state), after);
  });
}

test('Conrad advances at main-world milestones and revisits cannot farm experience', () => {
  const state = reachCouncil(), firstXp = state.xp, credits = state.credits;
  reply(state, 'conrad-verner', 'sign-autograph');
  assert.deepEqual(state.assignments.records.fan, { stage: 'signed', outcome: null, rewarded: false, autographAt: 0, photoAt: null });
  assert.equal(state.xp, firstXp);
  for (let i = 0; i < 3; i++) {
    travel(state, 'normandy'); travel(state, 'citadel');
    assert.deepEqual(choiceIds(state, 'conrad-verner'), ['leave']);
    assert.equal(chooseAssignmentReply(state, 'conrad-verner', 'sign-autograph').ok, false);
    assert.equal(chooseAssignmentReply(state, 'conrad-verner', 'take-photo').ok, false);
    assert.equal(state.xp, firstXp);
  }
  afterWorld(state, 'therum');
  assert.ok(choiceIds(state, 'conrad-verner').includes('take-photo'));
  const afterFirstWorldXp = state.xp;
  reply(state, 'conrad-verner', 'take-photo');
  assert.equal(state.assignments.records.fan.stage, 'photographed');
  assert.equal(state.assignments.records.fan.autographAt, 0);
  assert.equal(state.assignments.records.fan.photoAt, 1);
  assert.equal(state.xp, afterFirstWorldXp);
  assert.equal(chooseAssignmentReply(state, 'conrad-verner', 'discourage-risk').ok, false);
  travel(state, 'normandy'); travel(state, 'citadel');
  assert.equal(state.xp, afterFirstWorldXp);
  afterWorld(state, 'feros', 'save');
  const afterSecondWorldXp = state.xp;
  assert.ok(choiceIds(state, 'conrad-verner').includes('discourage-risk'));
  assert.deepEqual(reply(state, 'conrad-verner', 'discourage-risk').reward, { xp: 50 });
  assert.equal(state.xp, afterSecondWorldXp + 50);
  assert.equal(state.assignments.records.fan.outcome, 'return-home');
  assert.equal(getAssignmentConversation(state, 'conrad-verner'), null);
  assert.ok(!contactIds(state).includes('conrad-verner'));
  assert.equal(chooseAssignmentReply(state, 'conrad-verner', 'discourage-risk').ok, false);
  assert.equal(state.xp, afterSecondWorldXp + 50);
  assert.ok(state.credits >= credits, 'Only real main-mission rewards changed credits');
});

test('starting Conrad after one world still requires another world after each exchange', () => {
  const state = reachCouncil(); afterWorld(state, 'therum');
  const before = state.xp;
  reply(state, 'conrad-verner', 'sign-autograph');
  assert.equal(state.assignments.records.fan.autographAt, 1);
  assert.equal(chooseAssignmentReply(state, 'conrad-verner', 'take-photo').ok, false);
  travel(state, 'normandy'); travel(state, 'citadel');
  assert.deepEqual(choiceIds(state, 'conrad-verner'), ['leave']);
  assert.equal(state.xp, before);
  afterWorld(state, 'feros', 'save');
  reply(state, 'conrad-verner', 'take-photo');
  assert.equal(state.assignments.records.fan.photoAt, 2);
  assert.equal(chooseAssignmentReply(state, 'conrad-verner', 'discourage-risk').ok, false);
  travel(state, 'normandy'); travel(state, 'citadel');
  assert.deepEqual(choiceIds(state, 'conrad-verner'), ['leave']);
  afterWorld(state, 'noveria', 'release');
  const xp = state.xp;
  reply(state, 'conrad-verner', 'discourage-risk');
  assert.equal(state.xp, xp + 50);
  assert.deepEqual(state.assignments.records.fan, { stage: 'completed', outcome: 'return-home', rewarded: true, autographAt: 1, photoAt: 2 });
});

test('starting Conrad after two worlds cannot collapse all encounters into the same stay', () => {
  const state = reachCouncil(); afterWorld(state, 'therum'); afterWorld(state, 'feros', 'save');
  const xp = state.xp;
  reply(state, 'conrad-verner', 'sign-autograph');
  assert.deepEqual(state.assignments.records.fan, { stage: 'signed', outcome: null, rewarded: false, autographAt: 2, photoAt: null });
  assert.equal(chooseAssignmentReply(state, 'conrad-verner', 'take-photo').ok, false);
  assert.equal(chooseAssignmentReply(state, 'conrad-verner', 'discourage-risk').ok, false);
  assert.equal(state.xp, xp);
  travel(state, 'normandy'); travel(state, 'citadel');
  assert.deepEqual(choiceIds(state, 'conrad-verner'), ['leave']);
  roundtrip(state);
  afterWorld(state, 'noveria', 'release');
  const afterWorldXp = state.xp;
  assert.match(getAssignments(state).find(entry => entry.id === 'fan').objective, /Reparler/);
  reply(state, 'conrad-verner', 'take-photo');
  assert.equal(state.assignments.records.fan.photoAt, 3);
  assert.equal(chooseAssignmentReply(state, 'conrad-verner', 'discourage-risk').ok, false);
  const journal = getAssignments(state).find(entry => entry.id === 'fan');
  assert.equal(journal.status, 'active');
  assert.match(journal.objective, /Aucune nouvelle rencontre/);
  assert.equal(state.assignments.records.fan.rewarded, false);
  assert.equal(state.xp, afterWorldXp);
  roundtrip(state);
});

test('starting Conrad after all three worlds explains the unavailable next encounter without false completion', () => {
  const state = reachCouncil();
  afterWorld(state, 'therum'); afterWorld(state, 'feros', 'save'); afterWorld(state, 'noveria', 'release');
  const xp = state.xp;
  reply(state, 'conrad-verner', 'sign-autograph');
  assert.equal(state.assignments.records.fan.autographAt, 3);
  assert.deepEqual(choiceIds(state, 'conrad-verner'), ['leave']);
  const journal = getAssignments(state).find(entry => entry.id === 'fan');
  assert.equal(journal.status, 'active');
  assert.match(journal.objective, /Aucune nouvelle rencontre/);
  assert.equal(state.xp, xp);
  travel(state, 'normandy'); travel(state, 'citadel');
  assert.equal(chooseAssignmentReply(state, 'conrad-verner', 'take-photo').ok, false);
  roundtrip(state);
});

test('Conrad milestone validation rejects forged, missing, reversed or premature history', () => {
  const state = reachCouncil(); afterWorld(state, 'therum'); afterWorld(state, 'feros', 'save');
  const signed = { stage: 'signed', outcome: null, rewarded: false, autographAt: 2, photoAt: null };
  const bad = [
    { ...signed, autographAt: -1 }, { ...signed, autographAt: 0.5 }, { ...signed, autographAt: '2' },
    { ...signed, autographAt: 3 }, { ...signed, photoAt: 2 },
    { stage: 'signed', outcome: null, rewarded: false },
    { stage: 'photographed', outcome: null, rewarded: false, autographAt: 2, photoAt: 2 },
    { stage: 'photographed', outcome: null, rewarded: false, autographAt: 1, photoAt: 0 },
    { stage: 'photographed', outcome: null, rewarded: false, autographAt: 1, photoAt: 3 },
    { stage: 'completed', outcome: 'return-home', rewarded: true, autographAt: 1, photoAt: 2 },
    { ...signed, extraMilestone: 0 },
  ];
  for (const record of bad) {
    assert.equal(migrateAssignmentState({ records: { fan: record } }, state), null);
    const data = JSON.parse(encodeSave(state)); data.state.assignments = { records: { fan: record } };
    assert.equal(decodeSave(data), null);
  }
  assert.deepEqual(migrateAssignmentState({ records: { fan: signed } }, state), { records: { fan: signed } });
});

test('all three assignments coexist and keep their histories after later campaign advancement', () => {
  const state = reachCouncil();
  reply(state, 'samesh-bhatia', 'accept-help');
  reply(state, 'bosker', 'return-body'); reply(state, 'samesh-bhatia', 'inform-family');
  reply(state, 'conrad-verner', 'sign-autograph');
  afterWorld(state, 'therum'); reply(state, 'conrad-verner', 'take-photo');
  reply(state, 'petrovsky-family', 'discuss-concerns'); reply(state, 'petrovsky-family', 'respect-refusal');
  afterWorld(state, 'feros', 'save'); reply(state, 'conrad-verner', 'discourage-risk');
  const assignments = clone(state.assignments);
  assert.equal(getAssignments(state).filter(entry => entry.status === 'completed').length, 3);
  finish(state, 'virmire', 'save-ashley'); finish(state, 'noveria', 'release'); finish(state, 'ilos');
  assert.deepEqual(state.assignments, assignments);
  roundtrip(state);
});

test('assignment and conversation results are copies and invalid IDs cannot mutate records', () => {
  const state = reachCouncil(); reply(state, 'samesh-bhatia', 'accept-help');
  const before = snapshot(state);
  const hostile = { toString() { throw new Error('Must not coerce'); } };
  for (const id of [null, undefined, 'constructor', '__proto__', 'unknown', hostile]) {
    assert.equal(getAssignmentConversation(state, id), null);
    assert.equal(chooseAssignmentReply(state, id, 'accept-help').ok, false);
    assert.equal(chooseAssignmentReply(state, 'samesh-bhatia', id).ok, false);
  }
  getAssignmentContacts(state)[0].x = 999;
  getAssignments(state)[0].objective = 'Modified';
  assert.equal(snapshot(state), before);
  assert.notEqual(getAssignmentContacts(state)[0].x, 999);
  assert.notEqual(getAssignments(state)[0].objective, 'Modified');
});

test('assignment migration validates every record, outcome and reward marker against progression', () => {
  const initial = newGame();
  assert.equal(migrateAssignmentState({ records: { homecoming: { stage: 'requested', outcome: null, rewarded: false } } }, initial), null);
  const state = reachCouncil();
  const bad = [
    null, [], {}, { records: {}, extra: true }, { records: [] },
    { records: { invented: { stage: 'requested', outcome: null, rewarded: false } } },
    { records: { homecoming: { stage: 'requested', outcome: 'research', rewarded: false } } },
    { records: { homecoming: { stage: 'completed', outcome: 'research', rewarded: false } } },
    { records: { homecoming: { stage: 'requested', outcome: null, rewarded: true } } },
    { records: { homecoming: { stage: 'completed', outcome: 'invented', rewarded: true } } },
    { records: { homecoming: { stage: 'requested', outcome: null, rewarded: false, extra: 'field' } } },
    { records: { family: { stage: 'discussion', outcome: null, rewarded: false } } },
    { records: { fan: { stage: 'photographed', outcome: null, rewarded: false } } },
    { records: { fan: { stage: 'completed', outcome: 'return-home', rewarded: true } } },
  ];
  for (const raw of bad) {
    assert.equal(migrateAssignmentState(raw, state), null);
    const data = JSON.parse(encodeSave(state)); data.state.assignments = raw;
    assert.equal(decodeSave(data), null);
  }
  const hidden = createAssignmentState();
  Object.defineProperty(hidden.records, 'invented', { value: { stage: 'requested', outcome: null, rewarded: false } });
  assert.equal(migrateAssignmentState(hidden, state), null);
});

test('assignment migration rejects accessors, prototype keys, inherited records and cycles', () => {
  const state = reachCouncil();
  const poisoned = createAssignmentState(); poisoned.records = JSON.parse('{"__proto__":{}}');
  assert.equal(migrateAssignmentState(poisoned, state), null);
  const inherited = createAssignmentState(); inherited.records = Object.create({ homecoming: { stage: 'requested', outcome: null, rewarded: false } });
  assert.equal(migrateAssignmentState(inherited, state), null);
  let invoked = false;
  const accessor = createAssignmentState();
  Object.defineProperty(accessor.records, 'homecoming', { enumerable: true, get() { invoked = true; return {}; } });
  assert.equal(migrateAssignmentState(accessor, state), null);
  assert.equal(invoked, false);
  const cyclic = createAssignmentState(); cyclic.records.homecoming = cyclic;
  assert.equal(migrateAssignmentState(cyclic, state), null);
});

test('progress and unique rewards survive automatic saves, manual slots and legacy initialization', () => {
  const state = reachCouncil(); reply(state, 'samesh-bhatia', 'accept-help'); reply(state, 'bosker', 'support-research');
  const original = clone(state.assignments);
  const migrated = migrateAssignmentState(state.assignments, state);
  migrated.records.homecoming.outcome = 'changed';
  assert.deepEqual(state.assignments, original);
  const records = new Map();
  const storage = { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value) };
  assert.equal(saveTo(storage, state), true);
  assert.equal(writeManualSave(storage, '1', state, { name: 'Avant le rapport à Samesh' }).ok, true);
  assert.deepEqual(loadFrom(storage), state);
  const loaded = readManualSave(storage, '1').state;
  const xp = loaded.xp;
  reply(loaded, 'samesh-bhatia', 'inform-family');
  assert.equal(loaded.xp, xp + 50);
  const completed = decodeSave(encodeSave(loaded));
  assert.equal(chooseAssignmentReply(completed, 'samesh-bhatia', 'inform-family').ok, false);
  assert.equal(completed.xp, xp + 50);
  const legacy = JSON.parse(encodeSave(state)); delete legacy.state.assignments;
  assert.deepEqual(decodeSave(legacy).assignments, { records: {} });
});

test('an experience overflow cannot partly complete an assignment', () => {
  const state = reachCouncil();
  reply(state, 'samesh-bhatia', 'accept-help'); reply(state, 'bosker', 'return-body');
  state.xp = 999_999_980;
  const before = snapshot(state);
  assert.equal(chooseAssignmentReply(state, 'samesh-bhatia', 'inform-family').ok, false);
  assert.equal(snapshot(state), before);
  roundtrip(state);
});
