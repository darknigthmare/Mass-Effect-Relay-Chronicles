import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, travelCampaign, winEncounter, completeZone, recruit, encodeSave, decodeSave,
  applyResolveCitadel, winResolveCitadelEncounter } from '../src/state.js';
import { getAdvanceRecruitment, advanceRecruitment } from '../src/advance-dialogues.js';
import { getCodexEntries } from '../src/story.js';

const clone = value => structuredClone(value);
const resumed = state => { const result = decodeSave(encodeSave(state)); assert.ok(result); return result; };
// Recruitment may append its unique roster entry and journal receipt only.
const preserved = state => Object.fromEntries(Object.entries(clone(state)).filter(([key]) => !['recruited', 'logs'].includes(key)));
function act(state, id, choice) {
  const result = applyResolveCitadel(state, id, choice); assert.equal(result.ok, true, result.reason); resumed(state);
}
function victory(state, key) {
  const result = winResolveCitadelEncounter(state, `resolve-citadel:${key}-battle`);
  assert.equal(result.ok, true, result.reason); resumed(state);
}
function modernWrexEvidence() {
  const state = newGame({ difficulty: 'story' }); state.flags.briefed = true;
  assert.equal(travelCampaign(state, 'eden-prime').ok, true);
  for (const suffix of ['encounter-1', 'encounter-2', 'boss']) assert.equal(winEncounter(state, `eden-prime:${suffix}`), true);
  assert.equal(completeZone(state, 'eden-prime'), true);
  assert.equal(travelCampaign(state, 'citadel').ok, true);
  act(state, 'hearing', 'report'); act(state, 'barla-von', 'lead'); assert.equal(recruit(state, 'wrex'), true);
  // Wrex supplies the alternative lead. He is recruited but not deployed;
  // Shepard can spare Fist. No clinic receipt or legacy encounter is forged.
  victory(state, 'fist'); act(state, 'fist', 'spare'); victory(state, 'ambush'); act(state, 'tali-proof', 'receive');
  assert.equal(state.resolveCitadel.legacy, false); assert.equal(state.resolveCitadel.clinic, false);
  assert.equal(state.resolveCitadel.michel, false); assert.equal(state.resolveCitadel.battles.clinic, false);
  assert.deepEqual(state.resolveCitadel.battles, { clinic: false, fist: true, ambush: true });
  assert.equal(state.completed.includes('citadel'), false); assert.equal(state.recruited.includes('garrus'), false);
  return state;
}

test('modern Wrex route without clinic allows Garrus after Council, Normandy and Citadel return without fabricated rewards or battles', () => {
  const state = modernWrexEvidence();
  const blocked = clone(state); assert.equal(recruit(state, 'garrus'), false); assert.deepEqual(state, blocked);
  assert.equal(completeZone(state, 'citadel'), true); assert.equal(state.flags.spectre, true);
  assert.equal(travelCampaign(state, 'normandy').ok, true); assert.equal(travelCampaign(state, 'citadel').ok, true);
  const before = preserved(state), roster = [...state.recruited], logs = state.logs.length;
  const codexBefore = getCodexEntries(state).map(entry => entry.id); assert.equal(codexBefore.includes('turian'), false);
  assert.equal(getAdvanceRecruitment(state, 'garrus').step, 'intro');
  const accepted = advanceRecruitment(state, 'garrus', 'intro', 'accept');
  assert.equal(accepted.ok, true); assert.equal(accepted.effect, 'recruit-garrus');
  assert.equal(recruit(state, 'garrus'), true);
  assert.deepEqual(state.recruited, [...roster, 'garrus']); assert.equal(state.logs.length, logs + 1);
  assert.deepEqual(preserved(state), before, 'Resources, party, flags, encounters and all quest receipts are unchanged');
  assert.equal(state.resolveCitadel.clinic, false); assert.equal(state.resolveCitadel.battles.clinic, false);
  assert.equal(state.cleared.some(id => id.startsWith('citadel:')), false, 'Recruitment does not fabricate a legacy Citadel victory');
  const loaded = resumed(state), loadedWithoutCodex = preserved(loaded), beforeWithoutCodex = clone(before);
  delete loadedWithoutCodex.story.codex; delete beforeWithoutCodex.story.codex;
  assert.deepEqual(loadedWithoutCodex, beforeWithoutCodex, 'Only the derived codex may expose the newly recruited species');
  assert.deepEqual(getCodexEntries(loaded).map(entry => entry.id).sort(), [...new Set([...codexBefore, 'turian'])].sort());
  assert.equal(loaded.recruited.filter(id => id === 'garrus').length, 1);
  assert.equal(getAdvanceRecruitment(loaded, 'garrus').step, 'joined');
  const stable = clone(loaded); assert.equal(recruit(loaded, 'garrus'), false);
  assert.equal(advanceRecruitment(loaded, 'garrus', 'intro', 'accept').ok, false); assert.deepEqual(loaded, stable);
});

test('before the modern Council promotion Garrus still requires the real clinic receipt', () => {
  const state = modernWrexEvidence(), before = clone(state);
  assert.equal(recruit(state, 'garrus'), false); assert.deepEqual(state, before);
  victory(state, 'clinic'); const afterClinic = preserved(state);
  assert.equal(state.completed.includes('citadel'), false); assert.equal(state.resolveCitadel.battles.clinic, true);
  assert.equal(recruit(state, 'garrus'), true); assert.deepEqual(preserved(state), afterClinic); resumed(state);
});
