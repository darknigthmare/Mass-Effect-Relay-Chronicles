import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, recruit, winEncounter, completeZone, zoneEncounters, encodeSave, decodeSave } from '../src/state.js';
import { recordVisit, migrateStoryState, readTopic } from '../src/story.js';
import { EXPLORATION_BANTERS, isExplorationBanterKey } from '../src/continuation-banter-data.js';
import { availableExplorationBanter, createExplorationBanterController, BANTER_FIRST_DELAY, BANTER_COOLDOWN, BANTER_CAMPAIGN_LIMIT } from '../src/continuation-banter.js';

function travel(state, zone) {
  state.zone = zone; state.position = null;
  assert.equal(recordVisit(state, zone), true);
}
function finish(state, zone, choice) {
  travel(state, zone);
  for (const id of zoneEncounters(zone)) assert.equal(winEncounter(state, id), true);
  assert.equal(completeZone(state, zone, choice), true);
}
function campaign() {
  const state = newGame(); state.flags.briefed = true;
  finish(state, 'eden-prime'); travel(state, 'citadel');
  for (const id of ['garrus', 'tali', 'wrex']) assert.equal(recruit(state, id), true);
  assert.equal(completeZone(state, 'citadel'), true);
  finish(state, 'therum'); travel(state, 'citadel');
  return state;
}
function advance(controller, state, seconds, eligible = true) {
  let event = null;
  for (let i = 0; i < Math.round(seconds * 20); i++) event = controller.update(state, .05, { eligible }) || event;
  return event;
}
const resources = state => Object.fromEntries(Object.entries(state).filter(([key]) => key !== 'story'));

test('all fifteen main squad pairs speak only as the two active, living recruits in either order', () => {
  const state = campaign(), main = ['kaidan', 'ashley', 'garrus', 'tali', 'wrex', 'liara'];
  let pairs = 0;
  for (let a = 0; a < main.length; a++) for (let b = a + 1; b < main.length; b++) {
    pairs++;
    for (const pair of [[main[a], main[b]], [main[b], main[a]]]) {
      state.party = ['shepard', ...pair];
      const before = structuredClone(state), event = availableExplorationBanter(state);
      assert.ok(event); assert.equal(event.lines.length, 2);
      assert.deepEqual(new Set(event.lines.map(line => line.speakerId)), new Set(pair));
      assert.deepEqual(state, before, 'availability is a pure read');
      for (const speaker of pair) {
        state.lost.push(speaker); assert.equal(availableExplorationBanter(state), null); state.lost.pop();
        state.recruited = state.recruited.filter(id => id !== speaker);
        assert.equal(availableExplorationBanter(state), null); state.recruited.push(speaker);
      }
    }
  }
  assert.equal(pairs, 15);
});

test('foreground delay freezes during menus, combat and focus interruption, then enforces cooldown', () => {
  const state = campaign(); state.party = ['shepard', 'garrus', 'tali'];
  const scheduler = createExplorationBanterController(), before = structuredClone(resources(state));
  assert.equal(advance(scheduler, state, BANTER_FIRST_DELAY - .05), null);
  assert.equal(advance(scheduler, state, 60, false), null);
  const first = advance(scheduler, state, .05); assert.equal(first.id, 'banter:citadel-maintenance');
  assert.equal(advance(scheduler, state, BANTER_COOLDOWN - .05), null);
  assert.equal(advance(scheduler, state, 60, false), null);
  const second = advance(scheduler, state, .05); assert.equal(second.id, 'banter:garrus-tali');
  assert.equal(advance(scheduler, state, 60), null);
  assert.deepEqual(resources(state), before, 'no XP, credits, reputation, item, mission or choice mutation');
  assert.deepEqual(state.story.heard, [first.id, second.id]);
});

test('changing squad or zone restarts the approach delay and never retains a pending absent speaker', () => {
  const state = campaign(), scheduler = createExplorationBanterController();
  state.party = ['shepard', 'garrus', 'tali'];
  assert.equal(advance(scheduler, state, 7), null);
  state.party = ['shepard', 'ashley', 'liara'];
  assert.equal(advance(scheduler, state, 7), null);
  const event = advance(scheduler, state, 1);
  assert.deepEqual(event.lines.map(line => line.speakerId), ['ashley', 'liara']);
  travel(state, 'therum'); assert.equal(advance(scheduler, state, 7), null);
  assert.equal(advance(scheduler, state, 1), null, 'the single pair line was already heard');
});

test('Jenkins can speak before the first Eden encounter and never speaks after his narrative death', () => {
  const state = newGame(); state.flags.briefed = true; travel(state, 'eden-prime');
  const scheduler = createExplorationBanterController();
  assert.equal(advance(scheduler, state, 8).id, 'banter:eden-patrol');
  assert.equal(winEncounter(state, 'eden-prime:encounter-1'), true);
  assert.equal(advance(scheduler, state, 8).id, 'banter:eden-survivors');
  assert.ok(state.story.heard.includes('banter:eden-patrol'));
  assert.deepEqual(decodeSave(encodeSave(state)), state);
});

test('both Virmire losses preserve historical banter and permanently exclude the dead speaker', () => {
  for (const choice of ['save-kaidan', 'save-ashley']) {
    const state = campaign(); state.party = ['shepard', 'ashley', 'kaidan'];
    assert.ok(advance(createExplorationBanterController(), state, 8));
    finish(state, 'feros', 'save'); finish(state, 'virmire', choice); travel(state, 'citadel');
    const lost = choice === 'save-kaidan' ? 'ashley' : 'kaidan';
    assert.ok(state.lost.includes(lost));
    assert.deepEqual(decodeSave(encodeSave(state)), state);
    state.party = ['shepard', lost, 'garrus'];
    assert.equal(availableExplorationBanter(state), null);
  }
});

test('history survives save/resume, does not repeat on revisit, and rejects invented or premature history', () => {
  const state = campaign(); state.party = ['shepard', 'garrus', 'tali'];
  const scheduler = createExplorationBanterController(), first = advance(scheduler, state, 8);
  const resumed = decodeSave(encodeSave(state)); assert.ok(resumed);
  const next = advance(createExplorationBanterController(), resumed, 8);
  assert.ok(next); assert.notEqual(next.id, first.id);
  travel(resumed, 'normandy'); travel(resumed, 'citadel');
  assert.equal(advance(scheduler, resumed, 32), null);
  for (const id of ['banter:invented', 'banter:ilos-ruins', 'banter:finale-advance']) {
    const forged = structuredClone(state.story); forged.heard.push(id);
    assert.equal(migrateStoryState(forged, state), null);
  }
  const legacy = structuredClone(state); delete legacy.story;
  assert.deepEqual(migrateStoryState(undefined, legacy).heard, []);
});

test('reserved history budget leaves room for every existing conversation and rejects invalid data atomically', () => {
  const state = campaign(), scheduler = createExplorationBanterController();
  assert.ok(BANTER_CAMPAIGN_LIMIT > 0 && BANTER_CAMPAIGN_LIMIT <= 10);
  for (const entry of EXPLORATION_BANTERS.filter(entry => !entry.zone).slice(0, BANTER_CAMPAIGN_LIMIT)) {
    state.party = ['shepard', ...entry.speakers];
    assert.ok(advance(scheduler, state, 8));
  }
  assert.equal(state.story.heard.filter(isExplorationBanterKey).length, BANTER_CAMPAIGN_LIMIT);
  state.party = ['shepard', 'tali', 'liara']; assert.equal(advance(scheduler, state, 60), null);
  travel(state, 'normandy'); assert.equal(readTopic(state, 'kaidan', 'implants').ok, true);
  assert.deepEqual(decodeSave(encodeSave(state)), state);
  state.story.heard.push('unregistered:history');
  const before = structuredClone(state); travelWithoutRecording(state, 'citadel');
  const invalid = structuredClone(state); assert.equal(advance(scheduler, state, 8), null);
  assert.deepEqual(state, invalid); assert.equal(before.story.heard.length, state.story.heard.length);
});
function travelWithoutRecording(state, zone) { state.zone = zone; state.position = null; }

test('Normandy, ending, foreign-media contexts, malformed history and wall-time deltas cannot trigger banter', () => {
  const state = campaign(); state.party = ['shepard', 'garrus', 'tali'];
  for (const context of [{ mediaId: 'ME2', periodId: 'me2' }, { mediaId: 'ME3', periodId: 'me3' }, { mediaId: 'MEA', periodId: 'andromeda' }, null]) {
    state.context = context; assert.equal(availableExplorationBanter(state), null);
  }
  delete state.context; state.ending = true; assert.equal(availableExplorationBanter(state), null);
  state.ending = false; travel(state, 'normandy'); assert.equal(availableExplorationBanter(state), null);
  travel(state, 'citadel'); const scheduler = createExplorationBanterController();
  for (const dt of [NaN, Infinity, -1, 0, 8, 60]) assert.equal(scheduler.update(state, dt, { eligible: true }), null);
  assert.equal(advance(scheduler, state, 7.95), null);
  assert.ok(advance(scheduler, state, .05));
});
