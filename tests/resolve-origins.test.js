import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, recruit, zoneEncounters, winEncounter, completeZone, encodeSave, decodeSave } from '../src/state.js';
import { recordVisit } from '../src/story.js';
import { createResolveOrigins, normalizeResolveOrigins, getResolveOriginContacts, getResolveOriginConversation,
  chooseResolveOriginReply, listResolveOrigins, getResolveOriginsSummary } from '../src/resolve-origins.js';

const clone = value => JSON.parse(JSON.stringify(value));
const ids = state => getResolveOriginContacts(state).map(contact => contact.id);
function travel(state, zone) { state.zone = zone; state.position = null; assert.equal(recordVisit(state, zone), true); }
function finish(state, zone) {
  travel(state, zone);
  for (const id of zoneEncounters(zone)) assert.equal(winEncounter(state, id), true);
  assert.equal(completeZone(state, zone), true);
}
function campaign(origin = 'spacer', world = true) {
  const state = newGame({ origin }); state.flags.briefed = true;
  finish(state, 'eden-prime'); travel(state, 'citadel'); assert.equal(recruit(state, 'tali'), true);
  assert.equal(completeZone(state, 'citadel'), true);
  if (world) { finish(state, 'therum'); travel(state, 'citadel'); }
  return state;
}
function reply(state, contact, choice) {
  const result = chooseResolveOriginReply(state, contact, choice);
  assert.equal(result.ok, true, result.reason);
  assert.deepEqual(decodeSave(encodeSave(state)), state, 'Real save decoder preserves each transition');
  return result;
}

test('origin assignments initialize only absent legacy state and reject explicit invalid progress', () => {
  const state = newGame();
  assert.deepEqual(state.resolveOrigins, createResolveOrigins());
  const old = JSON.parse(encodeSave(state)); delete old.state.resolveOrigins;
  assert.deepEqual(decodeSave(old), state);
  for (const invalid of [null, false, [], { version: 2, records: {} }, { version: 1, records: {}, bonus: 1 }, { version: 1, records: { unknown: {} } }]) {
    old.state.resolveOrigins = invalid; assert.equal(decodeSave(old), null);
  }
  old.state.resolveOrigins = undefined; assert.equal(decodeSave(old), null);
  assert.equal(getResolveOriginsSummary(state), null);
});

test('three assignments require one post-Citadel world and the matching origin in ME1', () => {
  const first = { earthborn: 'origin-finch', spacer: 'origin-zabaleta', colonist: 'origin-girard' };
  for (const [origin, contact] of Object.entries(first)) {
    const before = campaign(origin, false);
    assert.deepEqual(ids(before), []);
    assert.equal(chooseResolveOriginReply(before, contact, 'leave').ok, false);
    const state = campaign(origin); assert.deepEqual(ids(state), [contact]);
    for (const other of Object.values(first).filter(id => id !== contact)) assert.equal(getResolveOriginConversation(state, other), null);
    assert.deepEqual(listResolveOrigins(state), []);
    const foreign = clone(state); foreign.context = { mediaId: 'ME2', periodId: 'me2' };
    assert.deepEqual(ids(foreign), []);
    assert.equal(chooseResolveOriginReply(foreign, contact, 'leave').ok, false);
    assert.deepEqual(ids({ ...state, mediaId: 'ME3', periodId: 'me3' }), []);
    assert.deepEqual(ids({ ...state, periodId: 'me2' }), []);
    travel(state, 'normandy'); assert.deepEqual(ids(state), []);
  }
});

test('reading, leaving and changing detached contacts cannot start or spend an assignment', () => {
  const state = campaign('earthborn'), before = clone(state);
  const contacts = getResolveOriginContacts(state); contacts[0].actorPosition.x = 999;
  assert.notEqual(getResolveOriginContacts(state)[0].actorPosition.x, 999);
  const conversation = getResolveOriginConversation(state, 'origin-finch'); conversation.choices[0].id = 'forged';
  assert.equal(chooseResolveOriginReply(state, 'origin-finch', 'forged').ok, false);
  assert.equal(chooseResolveOriginReply(state, 'origin-finch', 'leave').ok, true);
  assert.deepEqual(state, before);
});

test('Finch requires the guard revelation, moves to the confrontation and charges exactly 500 once', () => {
  const state = campaign('earthborn'); state.credits = 499;
  const xp = state.xp, morals = [state.paragon, state.renegade];
  reply(state, 'origin-finch', 'ask-guard');
  assert.match(listResolveOrigins(state)[0].objective, /garde turien/);
  assert.equal(chooseResolveOriginReply(state, 'origin-finch', 'pay-finch').ok, false);
  assert.match(getResolveOriginConversation(state, 'origin-turian-guard').text, /empoisonner/);
  reply(state, 'origin-turian-guard', 'keep-detained');
  assert.equal(getResolveOriginContacts(state).find(contact => contact.id === 'origin-finch').z, 2.8);
  reply(state, 'origin-finch', 'challenge-blackmail');
  assert.equal(getResolveOriginConversation(state, 'origin-finch').choices.find(choice => choice.id === 'pay-finch').disabled, true);
  const before = clone(state);
  assert.equal(chooseResolveOriginReply(state, 'origin-finch', 'pay-finch').ok, false); assert.deepEqual(state, before);
  state.credits = 500; assert.equal(reply(state, 'origin-finch', 'pay-finch').cost, 500);
  assert.equal(state.credits, 0); assert.equal(state.xp, xp); assert.deepEqual([state.paragon, state.renegade], morals);
  assert.equal(listResolveOrigins(state)[0].status, 'completed'); assert.ok(!ids(state).includes('origin-finch'));
  assert.match(getResolveOriginConversation(state, 'origin-turian-guard').text, /reste détenu/);
  const done = clone(state); assert.equal(chooseResolveOriginReply(state, 'origin-finch', 'pay-finch').ok, false); assert.deepEqual(state, done);
});

test('Finch lethal branch completes once without releasing Weisman or spending credits', () => {
  const state = campaign('earthborn'), credits = state.credits;
  reply(state, 'origin-finch', 'ask-guard'); reply(state, 'origin-turian-guard', 'keep-detained');
  reply(state, 'origin-finch', 'shoot-finch');
  assert.deepEqual(state.resolveOrigins.records['old-friends'], { stage: 'completed', outcome: 'finch-killed' });
  assert.equal(state.credits, credits); assert.match(listResolveOrigins(state)[0].outcome, /reste détenu/);
  assert.equal(chooseResolveOriginReply(state, 'origin-turian-guard', 'keep-detained').ok, false);
});

for (const outcome of ['food', 'cash', 'refused']) {
  test(`Zabaleta preserves the real Hannah call and the ${outcome} outcome`, () => {
    const state = campaign('spacer'); state.credits = 40;
    reply(state, 'origin-zabaleta', 'give-initial-20'); assert.equal(state.credits, 20);
    assert.match(listResolveOrigins(state)[0].objective, /Hannah/);
    assert.equal(chooseResolveOriginReply(state, 'origin-zabaleta', 'give-initial-20').ok, false);
    assert.equal(chooseResolveOriginReply(state, 'origin-zabaleta', 'food-credit').ok, false);
    assert.equal(getResolveOriginConversation(state, 'origin-hannah-call'), null);
    travel(state, 'normandy'); assert.deepEqual(ids(state), ['origin-hannah-call']);
    assert.match(getResolveOriginConversation(state, 'origin-hannah-call').text, /Kilimanjaro/);
    reply(state, 'origin-hannah-call', 'finish-call'); assert.deepEqual(ids(state), []);
    assert.equal(chooseResolveOriginReply(state, 'origin-hannah-call', 'finish-call').ok, false);
    travel(state, 'citadel');
    reply(state, 'origin-zabaleta', { food: 'food-credit', cash: 'give-20', refused: 'refuse-money' }[outcome]);
    assert.equal(state.credits, outcome === 'refused' ? 20 : 0);
    assert.deepEqual(state.resolveOrigins.records['old-unhappy-far-off-things'], { stage: 'completed', outcome, initialAid: 'cash' });
    assert.match(listResolveOrigins(state)[0].outcome, /n’a pas accepté/);
    const done = clone(state); assert.equal(chooseResolveOriginReply(state, 'origin-zabaleta', 'give-20').ok, false); assert.deepEqual(state, done);
  });
}

test('Zabaleta refuses insufficient money atomically while verification stays available', () => {
  const state = campaign('spacer'); state.credits = 19; const before = clone(state);
  assert.equal(chooseResolveOriginReply(state, 'origin-zabaleta', 'give-initial-20').ok, false); assert.deepEqual(state, before);
  reply(state, 'origin-zabaleta', 'verify-first'); travel(state, 'normandy'); reply(state, 'origin-hannah-call', 'finish-call'); travel(state, 'citadel');
  const afterCall = clone(state); assert.equal(chooseResolveOriginReply(state, 'origin-zabaleta', 'food-credit').ok, false); assert.deepEqual(state, afterCall);
  reply(state, 'origin-zabaleta', 'refuse-money'); assert.equal(state.credits, 19);
});

for (const [choice, outcome] of [['offer-syringe', 'self-sedated'], ['administer-sedative', 'administered']]) {
  test(`Talitha needs Girard, listening, a safe retreat and the final report: ${outcome}`, () => {
    const state = campaign('colonist'), medigel = state.medigel, credits = state.credits, xp = state.xp;
    assert.equal(getResolveOriginConversation(state, 'origin-talitha'), null);
    reply(state, 'origin-girard', 'accept-sedative');
    assert.equal(chooseResolveOriginReply(state, 'origin-talitha', choice).ok, false);
    reply(state, 'origin-talitha', 'share-mindoir'); reply(state, 'origin-talitha', 'approach-slowly');
    reply(state, 'origin-talitha', 'approach-too-fast');
    const agitated = clone(state); assert.equal(chooseResolveOriginReply(state, 'origin-talitha', choice).ok, false); assert.deepEqual(state, agitated);
    reply(state, 'origin-talitha', 'step-back'); reply(state, 'origin-talitha', 'approach-slowly');
    reply(state, 'origin-talitha', 'listen-patiently'); reply(state, 'origin-talitha', choice);
    assert.ok(!ids(state).includes('origin-talitha')); assert.equal(listResolveOrigins(state)[0].status, 'active');
    assert.match(listResolveOrigins(state)[0].objective, /Girard/);
    reply(state, 'origin-girard', 'report-sedation'); assert.equal(listResolveOrigins(state)[0].status, 'completed');
    assert.deepEqual(state.resolveOrigins.records['i-remember-me'], { stage: 'completed', outcome });
    assert.deepEqual([state.medigel, state.credits, state.xp], [medigel, credits, xp]);
    assert.equal(chooseResolveOriginReply(state, 'origin-girard', 'report-sedation').ok, false);
  });
}

test('strict progress rejects forged origins, impossible outcome stages, accessors and polluted trees', () => {
  const state = campaign('colonist'); reply(state, 'origin-girard', 'accept-sedative');
  const good = clone(state.resolveOrigins);
  for (const change of [x => { x.records['i-remember-me'].outcome = 'self-sedated'; }, x => { x.records['i-remember-me'].stage = 'unknown'; }, x => { x.records['i-remember-me'].rewarded = true; }]) {
    const candidate = clone(good); change(candidate); assert.equal(normalizeResolveOrigins(candidate, state), null);
    const save = JSON.parse(encodeSave(state)); save.state.resolveOrigins = candidate; assert.equal(decodeSave(save), null);
  }
  assert.equal(normalizeResolveOrigins(good, { ...state, origin: 'earthborn' }), null);
  assert.equal(normalizeResolveOrigins(good, { ...state, completed: ['eden-prime', 'citadel'] }), null);
  const evil = { version: 1, records: {} }; let accessed = false;
  Object.defineProperty(evil.records, 'i-remember-me', { enumerable: true, get() { accessed = true; return good.records['i-remember-me']; } });
  assert.equal(normalizeResolveOrigins(evil, state), null); assert.equal(accessed, false);
  assert.equal(normalizeResolveOrigins(JSON.parse('{"version":1,"records":{"__proto__":{}}}'), state), null);
  const summary = getResolveOriginsSummary(state); summary.records['i-remember-me'].stage = 'completed';
  assert.equal(state.resolveOrigins.records['i-remember-me'].stage, 'talk');
});

test('late travel closes callbacks while keeping recorded history and isolating other assignments', () => {
  const state = campaign('earthborn'); reply(state, 'origin-finch', 'ask-guard');
  const untouched = clone({ assignments: state.assignments, operations: state.operations, origin: state.origin });
  state.ending = true; assert.deepEqual(ids(state), []);
  assert.equal(chooseResolveOriginReply(state, 'origin-turian-guard', 'keep-detained').ok, false);
  assert.equal(listResolveOrigins(state)[0].status, 'unavailable');
  assert.deepEqual(normalizeResolveOrigins(state.resolveOrigins, state), state.resolveOrigins);
  assert.deepEqual({ assignments: state.assignments, operations: state.operations, origin: state.origin }, untouched);
});
