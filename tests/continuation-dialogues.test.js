import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, winEncounter, zoneEncounters, completeZone, recruit, encodeSave, decodeSave, unlockedZones } from '../src/state.js';
import { recordVisit } from '../src/story.js';
import { CAMPAIGN_DIALOGUE_IDS, getCampaignDialogue, advanceCampaignDialogue } from '../src/continuation-dialogues.js';

function citadel({ tali = false, optional = [] } = {}) {
  const state = newGame(); state.flags.briefed = true; state.zone = 'eden-prime';
  for (const id of zoneEncounters('eden-prime')) assert.equal(winEncounter(state, id), true);
  assert.equal(completeZone(state, 'eden-prime'), true);
  state.zone = 'citadel'; assert.equal(recordVisit(state, 'citadel'), true);
  for (const id of [...optional, ...(tali ? ['tali'] : [])]) assert.equal(recruit(state, id), true);
  assert.ok(decodeSave(encodeSave(state))); return state;
}

test('campaign graphs are unavailable in foreign chapters and contain no inherited flow/node keys', () => {
  for (const state of [undefined, null, {}, newGame(), citadel()]) {
    for (const id of ['constructor', '__proto__', 'unknown']) assert.equal(getCampaignDialogue(state, id).ok, false);
  }
  assert.equal(getCampaignDialogue(newGame(), 'briefing', 'constructor').ok, false);
  for (const id of CAMPAIGN_DIALOGUE_IDS.filter(id => id !== 'briefing')) assert.equal(getCampaignDialogue(newGame(), id).ok, false);
  const foreign = citadel({ tali: true }); foreign.context = { mediaId: 'ME2', periodId: 'me2' };
  for (const id of CAMPAIGN_DIALOGUE_IDS) assert.equal(getCampaignDialogue(foreign, id).ok, false);
});

test('the pre-Eden briefing cannot replay after a recorded landing, combat or completed prologue', () => {
  const state = newGame(); assert.equal(getCampaignDialogue(state, 'briefing').ok, true);
  state.flags.briefed = true; state.zone = 'eden-prime'; assert.equal(recordVisit(state, 'eden-prime'), true);
  state.zone = 'normandy'; assert.equal(getCampaignDialogue(state, 'briefing').ok, false);
  const completed = citadel(); completed.zone = 'normandy';
  assert.equal(getCampaignDialogue(completed, 'briefing').ok, false);
});

test('briefing questions and all tone choices leave the save unchanged until the explicit deploy effect', () => {
  const state = newGame(), before = encodeSave(state);
  for (const tone of ['steady', 'practical', 'direct']) {
    const reply = advanceCampaignDialogue(state, 'briefing', 'intro', tone);
    assert.equal(reply.ok, true); assert.equal(reply.effect, undefined);
    assert.ok(getCampaignDialogue(state, 'briefing', reply.nextStep).text.length > 20);
  }
  for (const topic of ['normandy', 'beacon', 'nihlus']) {
    const result = advanceCampaignDialogue(state, 'briefing', 'questions', topic);
    assert.equal(getCampaignDialogue(state, 'briefing', result.nextStep).ok, true);
  }
  assert.deepEqual(JSON.parse(encodeSave(state)).state, JSON.parse(before).state);
  assert.deepEqual(advanceCampaignDialogue(state, 'briefing', 'ready', 'deploy'), { ok: true, effect: 'brief' });
  assert.equal(state.flags.briefed, undefined);
});

test('Tali proof detail cannot be read before acceptance; recruitment is the existing persisted event', () => {
  const state = citadel(), before = structuredClone(state);
  assert.equal(getCampaignDialogue(state, 'tali-proof', 'proof').ok, false);
  assert.equal(getCampaignDialogue(state, 'tali-proof', 'geth').ok, false);
  assert.equal(getCampaignDialogue(state, 'investiture').ok, false);
  const intro = getCampaignDialogue(state, 'tali-proof'); assert.doesNotMatch(intro.text, /Bénézia/);
  assert.deepEqual(advanceCampaignDialogue(state, 'tali-proof', 'intro', 'receive'), { ok: true, nextStep: 'proof', effect: 'recruit-tali' });
  assert.deepEqual(state, before);
  assert.equal(recruit(state, 'tali'), true);
  const received = getCampaignDialogue(state, 'tali-proof', 'proof'); assert.equal(received.ok, true); assert.match(received.text, /Bénézia/);
  const loaded = decodeSave(encodeSave(state)); assert.ok(loaded);
  assert.equal(getCampaignDialogue(loaded, 'tali-proof').step, 'proof');
  assert.equal(getCampaignDialogue(loaded, 'first-audience').ok, false);
  assert.equal(advanceCampaignDialogue(loaded, 'tali-proof', 'intro', 'receive').ok, false, 'A stale recruitment choice is rejected');
  assert.deepEqual(loaded.party, before.party); assert.equal(loaded.xp, before.xp); assert.equal(loaded.credits, before.credits);
});

test('every audience line identifies the active speaker and neither tone invents an immediate verdict', () => {
  const state = citadel(), before = structuredClone(state);
  for (const step of ['intro', 'anderson', 'council', 'cooperate', 'challenge', 'questions', 'udina']) {
    const model = getCampaignDialogue(state, 'first-audience', step);
    assert.equal(model.ok, true); assert.ok(model.speaker.trim()); assert.ok(model.choices.length);
    assert.equal(model.catalogId, 'DIA-premiere-audience');
  }
  for (const choice of ['cooperate', 'challenge']) {
    const result = advanceCampaignDialogue(state, 'first-audience', 'council', choice);
    assert.equal(result.effect, undefined); assert.ok(result.nextStep);
  }
  assert.deepEqual(state, before); assert.equal(state.flags.spectre, undefined);
});

for (const optional of [[], ['garrus'], ['wrex'], ['garrus', 'wrex']]) {
  test(`investiture and handoff preserve optional recruitment (${optional.join(', ') || 'neither'}) and grant the existing reward once`, () => {
    const state = citadel({ tali: true, optional }), before = structuredClone(state);
    for (const step of ['intro', 'verdict', 'honor', 'duty', 'resolve', 'questions', 'handoff', 'orders', 'thanks', 'ready']) {
      const model = getCampaignDialogue(state, 'investiture', step); assert.equal(model.ok, true);
      assert.equal(model.catalogId, ['handoff', 'orders', 'thanks', 'ready'].includes(step) ? 'DIA-anderson-transmission' : 'DIA-intronisation');
      for (const choice of model.choices) {
        const result = advanceCampaignDialogue(state, 'investiture', step, choice.id); assert.equal(result.ok, true);
        assert.ok(result.effect !== 'complete-citadel' || step === 'ready');
      }
    }
    assert.deepEqual(state, before); assert.equal(unlockedZones(state).includes('therum'), false);
    assert.deepEqual(advanceCampaignDialogue(state, 'investiture', 'ready', 'finish'), { ok: true, effect: 'complete-citadel' });
    assert.equal(completeZone(state, 'citadel'), true);
    const after = structuredClone(state); assert.equal(state.flags.spectre, true);
    assert.ok(state.xp > before.xp); assert.equal(state.credits, before.credits + 180);
    assert.deepEqual(state.party, before.party); assert.deepEqual(state.recruited, before.recruited);
    assert.equal(advanceCampaignDialogue(state, 'investiture', 'ready', 'finish').ok, false);
    assert.equal(completeZone(state, 'citadel'), false); assert.deepEqual(state, after);
    assert.ok(decodeSave(encodeSave(state))); assert.equal(getCampaignDialogue(decodeSave(encodeSave(state)), 'investiture').ok, false);
    for (const id of ['garrus', 'wrex'].filter(id => !optional.includes(id))) assert.equal(recruit(state, id), true, 'Optional later recruitment remains possible');
  });
}

test('every reachable graph branch resolves to a valid node or an explicit effect and can reach an end', () => {
  const starts = { briefing: newGame(), 'first-audience': citadel(), 'tali-proof': citadel(), investiture: citadel({ tali: true }) };
  for (const [id, start] of Object.entries(starts)) {
    const queue = [{ state: start, step: 'intro' }], nodes = new Map();
    while (queue.length) {
      const { state, step } = queue.shift(), model = getCampaignDialogue(state, id, step); assert.equal(model.ok, true);
      const key = `${model.step}:${state.recruited.includes('tali')}`; if (nodes.has(key)) continue;
      const edges = []; nodes.set(key, edges); assert.ok(model.speaker); assert.ok(model.text); assert.ok(model.choices.length);
      const before = structuredClone(state);
      for (const choice of model.choices) {
        const result = advanceCampaignDialogue(state, id, model.step, choice.id); assert.equal(result.ok, true);
        assert.deepEqual(state, before, 'Graph traversal never mutates rewards, decisions or progression');
        if (!result.nextStep) { assert.ok(['close', 'brief', 'complete-citadel'].includes(result.effect)); edges.push(null); continue; }
        const nextState = structuredClone(state);
        if (result.effect === 'recruit-tali') assert.equal(recruit(nextState, 'tali'), true);
        const next = getCampaignDialogue(nextState, id, result.nextStep); assert.equal(next.ok, true);
        edges.push(`${next.step}:${nextState.recruited.includes('tali')}`); queue.push({ state: nextState, step: next.step });
      }
    }
    const resolves = (key, seen = new Set()) => {
      if (key === null) return true; if (seen.has(key)) return false;
      const next = new Set(seen).add(key); return nodes.get(key).some(edge => resolves(edge, next));
    };
    for (const key of nodes.keys()) assert.equal(resolves(key), true, `${id}/${key} must have an exit`);
  }
});

test('display models are detached and stale or unknown responses cannot execute effects', () => {
  const state = citadel({ tali: true }), before = structuredClone(state);
  const model = getCampaignDialogue(state, 'investiture'); model.choices[0].label = 'changed'; model.choices.push({ id: 'injected' });
  assert.notEqual(getCampaignDialogue(state, 'investiture').choices[0].label, 'changed');
  assert.equal(advanceCampaignDialogue(state, 'investiture', 'intro', 'injected').ok, false);
  assert.equal(advanceCampaignDialogue(state, 'investiture', 'intro', 'finish').ok, false);
  assert.deepEqual(state, before);
});
