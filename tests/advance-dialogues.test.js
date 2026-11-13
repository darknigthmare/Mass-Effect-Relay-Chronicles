import test from 'node:test';
import assert from 'node:assert/strict';
import { ADVANCE_RECRUITMENT_IDS, getAdvanceRecruitment, advanceRecruitment } from '../src/advance-dialogues.js';
import { newGame, recruit, completeZone, zoneEncounters, winEncounter, encodeSave, decodeSave } from '../src/state.js';
import { getConversation, readTopic, chooseReply, getCodexEntries, recordVisit } from '../src/story.js';
import { writeManualSave, readManualSave } from '../src/save-slots.js';
import { FEROS_COLONIST_TARGETS, listAdvanceFerosPOIs, transitionAdvanceFeros } from '../src/advance-feros.js';

function finish(state, zone, choice) {
  state.zone = zone;
  assert.equal(recordVisit(state, zone), true);
  for (const id of zoneEncounters(zone)) assert.equal(winEncounter(state, id), true);
  assert.equal(completeZone(state, zone, choice), true);
}
function citadel(optional = []) {
  const state = newGame(); state.flags.briefed = true;
  finish(state, 'eden-prime'); state.zone = 'citadel'; assert.equal(recordVisit(state, state.zone), true);
  for (const id of optional) assert.equal(recruit(state, id), true);
  return state;
}
function normandy(optional = []) {
  const state = citadel([...optional, 'tali']); assert.equal(completeZone(state, 'citadel'), true);
  state.zone = 'normandy'; return state;
}
const ids = state => getCodexEntries(state).map(entry => entry.id);
const snapshot = state => JSON.stringify(state);
const budget = state => [state.xp, state.credits, state.medigel, state.paragon, state.renegade, JSON.stringify(state.inventory), JSON.stringify(state.party)];

for (const id of ADVANCE_RECRUITMENT_IDS) {
  test(`${id}: every reachable recruitment node has a valid exit and its questions never mutate the campaign`, () => {
    const state = citadel(), initial = snapshot(state), visited = new Set(), pending = ['intro'];
    while (pending.length) {
      const step = pending.shift(); if (visited.has(step)) continue; visited.add(step);
      const model = getAdvanceRecruitment(state, id, step); assert.equal(model.ok, true);
      assert.ok(model.text.length > 20); assert.ok(model.speaker.length); assert.ok(model.choices.length);
      assert.equal(new Set(model.choices.map(c => c.id)).size, model.choices.length);
      for (const choice of model.choices) {
        const next = advanceRecruitment(state, id, step, choice.id); assert.equal(next.ok, true);
        assert.ok(next.nextStep || next.effect === 'close');
        if (next.effect?.startsWith('recruit-')) assert.equal(next.effect, `recruit-${id}`);
        else if (next.nextStep) pending.push(next.nextStep);
      }
    }
    assert.deepEqual([...visited].sort(), ['intro', 'refused', 'deferred', ...(id === 'garrus' ? ['investigation', 'methods'] : ['mercenary', 'interest'])].sort());
    assert.equal(snapshot(state), initial);
    assert.equal(getAdvanceRecruitment(state, id, 'joined').ok, false);
  });
  for (const refusal of ['refuse', 'defer']) {
    test(`${id}: ${refusal} leaves the offer available after save/reload and the Council`, () => {
      let state = citadel(); const initial = snapshot(state);
      const response = advanceRecruitment(state, id, 'intro', refusal); assert.equal(response.ok, true);
      assert.equal(response.nextStep, refusal === 'refuse' ? 'refused' : 'deferred');
      assert.equal(advanceRecruitment(state, id, response.nextStep, 'leave').effect, 'close');
      assert.equal(snapshot(state), initial); state = decodeSave(encodeSave(state)); assert.ok(state);
      assert.equal(recruit(state, 'tali'), true); assert.equal(completeZone(state, 'citadel'), true);
      const before = budget(state); const acceptance = advanceRecruitment(state, id, 'intro', 'accept');
      assert.equal(acceptance.effect, `recruit-${id}`); assert.equal(recruit(state, id), true);
      assert.deepEqual(budget(state), before); assert.equal(state.recruited.filter(value => value === id).length, 1);
      assert.equal(getAdvanceRecruitment(state, id, 'intro').step, 'joined');
      assert.equal(advanceRecruitment(state, id, 'intro', 'accept').ok, false, 'stale acceptance cannot recruit again');
      assert.equal(recruit(state, id), false); assert.deepEqual(decodeSave(encodeSave(state)), state);
    });
  }
  test(`${id}: location, chapter, death and foreign media invalidate stale callbacks without mutation`, () => {
    for (const alter of [s => { s.zone = 'normandy'; }, s => { s.completed = []; }, s => { s.lost.push(id); }, s => { s.context = { mediaId: 'ME2', periodId: 'me2' }; }]) {
      const state = citadel(); alter(state); const before = snapshot(state);
      assert.equal(getAdvanceRecruitment(state, id).ok, false); assert.equal(advanceRecruitment(state, id, 'intro', 'accept').ok, false);
      assert.equal(snapshot(state), before);
    }
  });
}

test('returned recruitment models are detached; malformed IDs and callbacks do not touch state', () => {
  const state = citadel(); const model = getAdvanceRecruitment(state, 'garrus'); model.choices[0].id = 'accept'; model.choices.push({ id: 'injected' });
  assert.equal(getAdvanceRecruitment(state, 'garrus').choices[0].id, 'investigation');
  const initial = snapshot(state);
  for (const bad of ['__proto__', 'constructor', null, '', 'tali']) assert.equal(getAdvanceRecruitment(state, bad).ok, false);
  for (const bad of ['__proto__', 'constructor', null, 'missing']) assert.equal(advanceRecruitment(state, 'garrus', 'intro', bad).ok, false);
  assert.equal(snapshot(state), initial);
});

for (const [topic, dossier] of [['pilgrimage', 'quarian-pilgrimage'], ['flotilla', 'quarian-flotilla'], ['geth', 'quarian-geth']]) {
  test(`Tali ${topic}: its new dossier appears only after this subject and survives import/export`, () => {
    const state = normandy(); const before = budget(state);
    assert.ok(ids(state).includes('quarian'), 'the existing general species entry stays available at recruitment');
    for (const entry of ['quarian-pilgrimage', 'quarian-flotilla', 'quarian-geth']) assert.ok(!ids(state).includes(entry));
    assert.equal(getConversation(state, 'tali').topics.length, 3); assert.ok(!ids(state).includes(dossier), 'opening the topic menu is read-only');
    assert.equal(readTopic(state, 'tali', topic).ok, true); assert.ok(ids(state).includes(dossier));
    assert.equal(readTopic(state, 'tali', topic).ok, true); assert.equal(state.story.codex.filter(id => id === dossier).length, 1);
    assert.deepEqual(budget(state), before); assert.deepEqual(decodeSave(encodeSave(state)), state);
    const forged = JSON.parse(encodeSave(normandy())); forged.state.story.codex.push(dossier);
    assert.equal(decodeSave(forged), null, 'a recruited Tali does not justify an unheard cultural dossier');
  });
}

for (const advice of ['procedure', 'results']) {
  test(`Garrus ${advice}: next conversation, manual save and reload retain the exact advice without rewards`, () => {
    let state = normandy(['garrus']); const initial = budget(state);
    assert.equal(readTopic(state, 'garrus', 'procedure').ok, true);
    assert.equal(chooseReply(state, 'garrus', 'procedure', advice).ok, true);
    const other = advice === 'procedure' ? 'results' : 'procedure';
    assert.equal(chooseReply(state, 'garrus', 'procedure', other).ok, false);
    const values = new Map(), storage = { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) };
    assert.equal(writeManualSave(storage, '2', state).ok, true); state = readManualSave(storage, '2').state; assert.ok(state);
    const followup = readTopic(state, 'garrus', 'followup'); assert.equal(followup.ok, true);
    assert.match(followup.topic.text, advice === 'procedure' ? /protéger les innocents/ : /privilégier les résultats/);
    assert.deepEqual(budget(state), initial); assert.equal(state.story.choices['garrus:procedure'], advice);
  });
}

test('Kaidan teaches only L2 implants and migraines; the dossier requires his subject and never grants equipment', () => {
  const state = newGame(); const initial = budget(state); assert.ok(!ids(state).includes('human-l2'));
  const result = readTopic(state, 'kaidan', 'implants'); assert.equal(result.ok, true);
  assert.match(result.topic.text, /L2/); assert.match(result.topic.text, /migraines/);
  assert.doesNotMatch(result.topic.text, /L3|L4|L5|Lazar|Cerberus/i); assert.ok(ids(state).includes('human-l2'));
  assert.deepEqual(budget(state), initial); assert.deepEqual(decodeSave(encodeSave(state)), state);
  const forged = JSON.parse(encodeSave(newGame())); forged.state.story.codex.push('human-l2'); assert.equal(decodeSave(forged), null);
});

test('Liara archaeological knowledge follows real rescue, Cipher and Vigil in both early and late recruitment orders', () => {
  for (const order of [['therum', 'feros', 'noveria'], ['feros', 'noveria', 'therum']]) {
    const state = normandy(); assert.equal(getConversation(state, 'liara'), null);
    for (const zone of order) {
      finish(state, zone, zone === 'feros' ? 'save' : zone === 'noveria' ? 'release' : undefined); state.zone = 'normandy';
      const model = getConversation(state, 'liara');
      if (!state.completed.includes('therum')) { assert.equal(model, null); continue; }
      assert.ok(model.topics.some(t => t.id === 'archaeology'));
      assert.equal(model.topics.some(t => t.id === 'cipher'), state.completed.includes('feros'));
      assert.equal(model.topics.some(t => t.id === 'vigil'), false);
      assert.equal(readTopic(state, 'liara', 'vigil').ok, false);
      assert.doesNotMatch(model.topics.map(t => t.text).join('\n'), /Sur Ilos, Vigil/);
    }
    finish(state, 'virmire', 'save-kaidan'); finish(state, 'ilos'); state.zone = 'normandy';
    assert.equal(readTopic(state, 'liara', 'vigil').ok, true); assert.deepEqual(decodeSave(encodeSave(state)), state);
  }
});

test('ME1 companion topics reject foreign media before reading or changing history', () => {
  const state = normandy(['garrus']); state.context = { mediaId: 'ME2', periodId: 'me2' }; const initial = snapshot(state);
  for (const id of ['kaidan', 'garrus', 'tali']) { assert.equal(getConversation(state, id), null); assert.equal(readTopic(state, id, id === 'kaidan' ? 'implants' : id === 'garrus' ? 'procedure' : 'flotilla').ok, false); }
  assert.equal(snapshot(state), initial);
});


test('Feros deaths close living conversations while Shiala unlocks Cipher at transmission before chapter completion', () => {
  const state = normandy(); state.zone = 'feros'; assert.equal(recordVisit(state, state.zone), true);
  assert.equal(winEncounter(state, 'feros:encounter-1'), true);
  function act(key, choiceId) {
    const id = `advance:feros:${key}`, poi = listAdvanceFerosPOIs(state).find(p => p.id === id); assert.ok(poi, key);
    state.position = { x: poi.x, z: poi.z }; const result = transitionAdvanceFeros(state, id, choiceId);
    assert.equal(result.ok, true, result.reason); state.advanceFeros = result.progress;
  }
  for (const id of ['fai-dan', 'arcelia', 'macha', 'davin']) assert.ok(getConversation(state, id));
  assert.equal(readTopic(state, 'macha', 'water').ok, true);
  act('defense', 'coordinate'); act('lizbeth', 'listen'); assert.equal(winEncounter(state, 'feros:encounter-2'), true);
  act('investigation', 'research'); for (const index of [1, 3, 4]) act('pressure', `valve-${index}`);
  act('pressure', 'release'); act('jeong', 'confront'); act('juliana', 'prepare');
  for (const target of FEROS_COLONIST_TARGETS) act(`colonist-${target.id}`, ['arcelia', 'macha', 'davin'].includes(target.id) ? 'lethal' : 'gas');
  for (const id of ['arcelia', 'macha', 'davin']) { assert.equal(getConversation(state, id), null); assert.equal(readTopic(state, id, 'water').ok, false); }
  assert.ok(getConversation(state, 'fai-dan')); act('freighter', 'open'); assert.equal(getConversation(state, 'fai-dan'), null);
  assert.ok(state.story.heard.includes('macha:water'), 'historical knowledge survives the speaker death');
  assert.equal(ids(state).includes('cipher'), false); assert.equal(winEncounter(state, 'feros:boss'), true);
  assert.equal(ids(state).includes('cipher'), false, 'the boss victory alone is not the transmission');
  act('shiala', 'receive'); assert.equal(state.completed.includes('feros'), false); assert.ok(ids(state).includes('cipher'));
  state.story.codex.push('cipher'); assert.deepEqual(decodeSave(encodeSave(state)), state);
  const forged = normandy(); forged.advanceFeros.cipher = true; assert.equal(ids(forged).includes('cipher'), false, 'a malformed unearned receipt never reveals the dossier');
});
