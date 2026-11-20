import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyResolveCitadel, canStartEncounter, canTravelCampaign, completeZone, confirmCampaignBriefing,
  confirmEdenSupport, decodeSave, encodeSave, newGame, recordEdenDigClue, trackCampaignMilestone,
  travelCampaign, winEncounter,
} from '../src/state.js';
import { getResolveCitadelInteraction } from '../src/resolve-citadel.js';
import { getCampaignMilestones, getTrackedCampaignObjective } from '../src/advance-progression.js';
import { advanceMission, MISSION_DEFINITIONS, tickMission } from '../src/mission-progress.js';
import { EDEN_CLUE, EDEN_SUPPORT, edenFieldPOIs } from '../src/eden-prologue.js';
import { getLevelLayout, isLevelGround } from '../src/level-layout-data.js';

const EDEN = 'eden-prime';
const FIRST = 'eden-prime:encounter-1';
const SECOND = 'eden-prime:encounter-2';
const BOSS = 'eden-prime:boss';
const QUEST = 'QST-recherche-de-la-balise';
const reload = state => {
  const loaded = decodeSave(encodeSave(state));
  assert.deepEqual(loaded, state);
  return loaded;
};

test('guided deployment requires the actual briefing and contact, and starts with the temporary squad', () => {
  const state = newGame({ guidedPrologue: true });
  assert.equal(canTravelCampaign(state, EDEN).ok, false);
  assert.equal(getResolveCitadelInteraction(state, 'nihlus').choices.some(choice => choice.id === 'evaluation'), false);
  assert.equal(confirmCampaignBriefing(state).ok, true);
  assert.equal(canTravelCampaign(state, EDEN).ok, false);
  assert.match(canTravelCampaign(state, EDEN).reason, /Nihlus/);
  const pending = reload(state);
  assert.equal(applyResolveCitadel(pending, 'nihlus', 'colony').ok, true);
  assert.equal(getResolveCitadelInteraction(pending, 'nihlus').choices.some(choice => choice.id === 'evaluation'), true);
  assert.equal(travelCampaign(pending, EDEN).ok, true);
  assert.deepEqual(pending.party, ['shepard', 'kaidan', 'jenkins']);
  assert.equal(pending.story.visitedZones.filter(zone => zone === EDEN).length, 1);
  assert.equal(getResolveCitadelInteraction(reload(pending), 'nihlus').ok, false);
  assert.equal(confirmCampaignBriefing(pending).ok, false);
});

test('first contact records loss, then support and clue advance once to their next destination', () => {
  const state = newGame({ guidedPrologue: true });
  assert.equal(applyResolveCitadel(state, 'nihlus', 'colony').ok, true);
  assert.equal(applyResolveCitadel(state, 'nihlus', 'evaluation').ok, false);
  assert.equal(confirmCampaignBriefing(state).ok, true);
  assert.equal(travelCampaign(state, EDEN).ok, true);
  assert.equal(confirmEdenSupport(state).ok, false);
  assert.equal(recordEdenDigClue(state).ok, false);
  assert.equal(winEncounter(state, FIRST), true);
  assert.deepEqual(state.party, ['shepard', 'kaidan']);
  const pending = reload(state);
  assert.deepEqual(edenFieldPOIs(pending).map(point => point.id), [EDEN_SUPPORT]);
  assert.equal(canStartEncounter(pending, SECOND).ok, false);
  assert.equal(travelCampaign(pending, 'normandy').ok, false);
  const gains = [state.credits, state.xp];
  assert.equal(confirmEdenSupport(pending).ok, true);
  assert.equal(confirmEdenSupport(pending).ok, false);
  assert.deepEqual(pending.party, ['shepard', 'kaidan', 'ashley']);
  assert.deepEqual(pending.lost, ['jenkins']);
  assert.deepEqual([pending.credits, pending.xp], gains);
  const [clue] = edenFieldPOIs(pending);
  assert.equal(clue.id, EDEN_CLUE);
  assert.equal(isLevelGround(getLevelLayout(EDEN), clue.x, clue.z), true);
  assert.equal(trackCampaignMilestone(pending, QUEST).ok, true);
  assert.equal(getTrackedCampaignObjective(pending).targetPoiId, EDEN_CLUE);
  assert.equal(canStartEncounter(pending, SECOND).ok, false);
  assert.equal(recordEdenDigClue(pending).ok, true);
  assert.equal(recordEdenDigClue(pending).ok, false);
  assert.equal(getTrackedCampaignObjective(reload(pending)).targetPoiId, SECOND);
  assert.equal(winEncounter(pending, SECOND), true);
  assert.equal(getTrackedCampaignObjective(pending).targetPoiId, BOSS);
  assert.equal(advanceMission(pending, EDEN, 'start').ok, true);
  assert.equal(getTrackedCampaignObjective(pending).targetPoiId, 'mission:eden-prime:charge-1');
  for (const { id, x, z } of MISSION_DEFINITIONS[EDEN].steps) {
    pending.position = { x, z };
    assert.equal(advanceMission(pending, `mission:eden-prime:${id}`, 'disarm').ok, true);
    for (let seconds = 0; seconds < 6; seconds++) {
      // The public clock passes the current position in the same coordinate system.
      tickMission(pending, 1, { position: pending.position });
    }
  }
  assert.equal(winEncounter(pending, BOSS), true);
  assert.equal(getTrackedCampaignObjective(pending).targetPoiId, 'eden-prime:objective');
  assert.equal(completeZone(pending, EDEN), true);
  assert.equal(getCampaignMilestones(reload(pending)).find(entry => entry.id === QUEST).status, 'complete');
});

test('legacy first-contact saves and their existing reward survive the new route', () => {
  const legacy = newGame();
  assert.equal(confirmCampaignBriefing(legacy).ok, true);
  assert.equal(travelCampaign(legacy, EDEN).ok, true);
  assert.equal(winEncounter(legacy, FIRST), true);
  assert.deepEqual(reload(legacy).party, ['shepard', 'kaidan', 'ashley']);
  assert.equal(legacy.campaignProgress.prologue, undefined);
});

test('guided save migration refuses skipped receipts and malformed clues', () => {
  const state = newGame({ guidedPrologue: true });
  const initial = JSON.parse(encodeSave(state));
  const malformed = structuredClone(initial);
  malformed.state.campaignProgress.prologue.digClue = 'true';
  assert.equal(decodeSave(malformed), null);
  const early = structuredClone(initial);
  early.state.campaignProgress.prologue.digClue = true;
  assert.equal(decodeSave(early), null);
  const landed = structuredClone(initial);
  landed.state.flags.briefed = true;
  landed.state.zone = EDEN;
  landed.state.story.visitedZones.push(EDEN);
  assert.equal(decodeSave(landed), null);
});
