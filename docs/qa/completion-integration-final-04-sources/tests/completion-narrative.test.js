import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, unlockedZones, recruit, completeZone, zoneEncounters, winEncounter, encodeSave, decodeSave, availableCrew, setSquad, buyUpgrade } from '../src/state.js';
import { recordVisit, getConversation, readTopic, chooseReply, migrateStoryState } from '../src/story.js';
import { getRecruitmentContext, getCompanionRelations, getNarrativeConsequences, getNarrativeSummary, getVirmireConsequence } from '../src/completion-narrative.js';
import { renderNarrativeSummary, renderCompanionRelations } from '../src/completion-narrative-ui.js';
import { createBattle, performAction } from '../src/combat.js';
import { actorFor } from '../src/game-data.js';
import { advanceOperation, getOperationInteraction } from '../src/operations.js';

const snapshot = state => JSON.stringify(state);
function travel(state, zone) {
  assert.ok(unlockedZones(state).includes(zone)); state.zone = zone; state.position = null; assert.equal(recordVisit(state, zone), true);
}
function finish(state, zone, choice = null) {
  travel(state, zone);
  for (const id of zoneEncounters(zone)) assert.equal(winEncounter(state, id), true);
  assert.equal(completeZone(state, zone, choice), true);
  assert.deepEqual(decodeSave(encodeSave(state)), state);
}
function council(optional = []) {
  const state = newGame(); state.flags.briefed = true; finish(state, 'eden-prime'); travel(state, 'citadel');
  for (const id of [...optional, 'tali']) assert.equal(recruit(state, id), true);
  assert.equal(completeZone(state, 'citadel'), true); travel(state, 'normandy'); return state;
}
const choices = { feros: 'save', noveria: 'release', virmire: 'save-kaidan' };
const permutations = values => values.length ? values.flatMap((value, index) => permutations(values.filter((_, other) => other !== index)).map(rest => [value, ...rest])) : [[]];

for (const order of permutations(['therum', 'feros', 'noveria'])) {
  test(`Liara follows actual completion order without future knowledge: ${order.join(' → ')}`, () => {
    const state = council();
    assert.equal(getRecruitmentContext(state), null);
    assert.equal(getConversation(state, 'liara'), null);
    // An unlocked destination, or a return without completing it, is not an earlier investigation.
    travel(state, 'noveria'); travel(state, 'normandy');
    for (const zone of order) {
      finish(state, zone, choices[zone]); travel(state, 'normandy');
      const context = getRecruitmentContext(state);
      if (!state.completed.includes('therum')) { assert.equal(context, null); continue; }
      const earlier = order.slice(0, order.indexOf('therum'));
      assert.deepEqual(context.earlierDestinations.map(item => item.id), earlier);
      assert.equal(context.late, earlier.length > 0);
      const archaeology = getConversation(state, 'liara').topics.find(topic => topic.id === 'archaeology');
      assert.ok(archaeology.text.startsWith(context.text));
      assert.equal(getConversation(state, 'liara').topics.some(topic => topic.id === 'cipher'), state.completed.includes('feros'));
      assert.equal(getConversation(state, 'liara').topics.some(topic => topic.id === 'vigil'), false);
      assert.ok(!archaeology.text.includes('Virmire'));
      const before = snapshot(state); getNarrativeSummary(state); renderNarrativeSummary(state); renderCompanionRelations(state);
      assert.equal(snapshot(state), before, 'Reading summaries cannot modify resources, choices or story');
      assert.equal(readTopic(state, 'liara', 'archaeology').ok, true);
      assert.deepEqual(decodeSave(encodeSave(state)), state);
    }
  });
}

test('Liara can join after both other investigations and Virmire with a specific retrospective reaction', () => {
  const state = council();
  for (const zone of ['feros', 'noveria', 'virmire']) finish(state, zone, choices[zone]);
  travel(state, 'normandy'); assert.equal(getConversation(state, 'liara'), null);
  assert.equal(renderNarrativeSummary(state).includes('data-recruitment-context'), false);
  finish(state, 'therum'); travel(state, 'normandy');
  const context = getRecruitmentContext(state);
  assert.deepEqual(context.earlierDestinations.map(item => item.id), ['feros', 'noveria', 'virmire']);
  const topic = readTopic(state, 'liara', 'archaeology'); assert.equal(topic.ok, true);
  assert.match(topic.topic.text, /Feros, Noveria, Virmire/);
  assert.ok(!topic.topic.text.includes('Ilos'));
  assert.equal(readTopic(state, 'liara', 'vigil').ok, false);
  assert.deepEqual(decodeSave(encodeSave(state)), state);
});

for (const choice of ['save-kaidan', 'save-ashley']) {
  test(`Virmire reactions, relations, healing and later zones preserve the permanent loss: ${choice}`, () => {
    const state = council(['garrus', 'wrex']);
    for (const [id, topic] of [['kaidan', 'implants'], ['ashley', 'famille']]) {
      assert.equal(readTopic(state, id, topic).ok, true);
      assert.equal(readTopic(state, id, 'virmire-return').ok, false);
    }
    assert.equal(readTopic(state, 'chakwas', 'virmire-loss').ok, false);
    finish(state, 'therum'); finish(state, 'feros', 'save'); finish(state, 'virmire', choice); travel(state, 'normandy');
    const aftermath = getVirmireConsequence(state), dead = aftermath.lost, alive = aftermath.survivor;
    assert.equal(getConversation(state, dead), null);
    assert.equal(readTopic(state, dead, 'virmire-return').ok, false);
    const survivor = readTopic(state, alive, 'virmire-return'); assert.equal(survivor.ok, true); assert.ok(survivor.topic.text.includes(aftermath.lostName));
    assert.ok(readTopic(state, 'chakwas', 'virmire-loss').topic.text.includes(aftermath.lostName));
    const relation = getCompanionRelations(state).find(item => item.id === dead);
    assert.equal(relation.available, false); assert.equal(relation.status, 'lost'); assert.ok(relation.exchanges.length > 0);
    assert.ok(!availableCrew(state).includes(dead));
    assert.equal(setSquad(state, [dead, 'tali']), false);
    const unchanged = snapshot(state);
    assert.equal(recruit(state, dead), false); assert.equal(buyUpgrade(state, dead, 'medigel').ok, false); assert.equal(snapshot(state), unchanged);
    const battle = createBattle({ party: state.party.map(id => actorFor(id, state)), enemies: [{ id: 'geth', hp: 100, maxHp: 100, shield: 0, attack: 1 }], medigel: state.medigel });
    const shepard = battle.actors.find(actor => actor.id === 'shepard'); shepard.atb = 100; shepard.hp = 1;
    assert.equal(performAction(battle, { actorId: 'shepard', actionId: 'medigel', targetId: dead }).ok, false);
    assert.equal(performAction(battle, { actorId: 'shepard', actionId: 'medigel', targetId: 'shepard' }).ok, true);
    shepard.atb = 100;
    assert.equal(performAction(battle, { actorId: 'shepard', actionId: 'unity', targetId: dead }).ok, false);
    const knockedOut = battle.actors.find(actor => actor.team === 'party' && actor.id !== 'shepard');
    knockedOut.hp = 0;
    assert.equal(performAction(battle, { actorId: 'shepard', actionId: 'unity' }).ok, true);
    assert.ok(knockedOut.hp > 0, 'Unity really revives a combat KO from the surviving squad');
    assert.ok(!battle.actors.some(actor => actor.id === dead));
    assert.equal(snapshot(state), unchanged, 'Combat recovery cannot mutate campaign recruitment or death');
    for (const zone of ['noveria', 'ilos', 'citadel-finale']) {
      finish(state, zone, zone === 'noveria' ? 'release' : zone === 'citadel-finale' ? 'save-council' : null); travel(state, 'normandy');
      assert.equal(getConversation(state, dead), null);
      assert.ok(!state.party.includes(dead)); assert.ok(state.lost.includes(dead));
      assert.equal(getCompanionRelations(state).find(item => item.id === dead).available, false);
    }
    assert.ok(getNarrativeConsequences(state).find(item => item.id === 'virmire').text.includes(aftermath.lostName));
    assert.deepEqual(decodeSave(encodeSave(state)), state);
  });
}

test('both Garrus replies produce their own stored relation and consequence, without repeat rewards or rewritten advice', () => {
  for (const reply of ['procedure', 'results']) {
    const state = council(['garrus']);
    assert.equal(getCompanionRelations(state).find(item => item.id === 'garrus').status, 'recruited');
    const resources = [state.xp, state.credits, state.paragon, state.renegade, state.medigel];
    assert.equal(readTopic(state, 'garrus', 'procedure').ok, true);
    assert.equal(getCompanionRelations(state).find(item => item.id === 'garrus').status, 'exchanged');
    assert.equal(chooseReply(state, 'garrus', 'procedure', reply).ok, true);
    assert.equal(getCompanionRelations(state).find(item => item.id === 'garrus').status, 'advice-recorded');
    const selected = readTopic(state, 'garrus', 'followup'); assert.equal(selected.ok, true);
    assert.match(selected.topic.text, reply === 'procedure' ? /protéger les innocents/ : /privilégier les résultats/);
    const before = snapshot(state);
    assert.equal(chooseReply(state, 'garrus', 'procedure', reply === 'procedure' ? 'results' : 'procedure').ok, false);
    assert.equal(snapshot(state), before);
    assert.equal(chooseReply(state, 'garrus', 'procedure', reply).ok, true);
    assert.deepEqual([state.xp, state.credits, state.paragon, state.renegade, state.medigel], resources);
    assert.deepEqual(decodeSave(encodeSave(state)), state);
  }
});

test('service dossier reacts to all stored origins and profiles without hidden morality grants', () => {
  for (const origin of ['spacer', 'colonist', 'earthborn']) for (const psychologicalProfile of ['sole-survivor', 'war-hero', 'ruthless']) {
    const state = newGame({ origin, psychologicalProfile });
    const before = snapshot(state), summary = getNarrativeSummary(state);
    const topic = getConversation(state, 'chakwas').topics.find(item => item.id === 'commander-history');
    assert.ok(topic.text.includes(summary.origin.description)); assert.ok(topic.text.includes(summary.psychologicalProfile.description));
    assert.equal(snapshot(state), before);
    assert.equal(readTopic(state, 'chakwas', 'commander-history').ok, true);
    assert.equal(state.paragon, 0); assert.equal(state.renegade, 0);
    const loaded = decodeSave(encodeSave(state)); assert.ok(loaded); assert.equal(loaded.origin, origin); assert.equal(loaded.psychologicalProfile, psychologicalProfile);
  }
});

test('known consequences and visible reputation remain separate from undecided politics and uncounted colonists', () => {
  const state = council(); finish(state, 'therum'); finish(state, 'feros', 'force'); finish(state, 'noveria', 'destroy'); finish(state, 'virmire', 'save-ashley'); finish(state, 'ilos'); finish(state, 'citadel-finale', 'focus-sovereign');
  const before = snapshot(state), html = renderNarrativeSummary(state), relations = renderCompanionRelations(state);
  assert.match(html, /Conciliation <strong>0<\/strong> · Pragmatisme <strong>60<\/strong>/);
  assert.match(html, /ne fournit pas de décompte individuel/); assert.match(html, /représentant humain ne sont pas décidés/);
  assert.match(relations, /data-companion-relation="kaidan" data-relation-status="lost"/);
  assert.ok(!relations.includes('romance')); assert.equal(snapshot(state), before);
  assert.ok(getNarrativeConsequences(state).find(item => item.id === 'noveria').text.includes('destruction'));
  assert.equal(getRecruitmentContext(state).late, false);
});

test('new history is validated against actual prerequisites; absent legacy history does not invent exchanges', () => {
  const state = newGame();
  const premature = { ...state.story, heard: ['kaidan:virmire-return'] };
  assert.equal(migrateStoryState(premature, state), null);
  const another = { ...state.story, heard: ['chakwas:virmire-loss'] };
  assert.equal(migrateStoryState(another, state), null);
  assert.deepEqual(migrateStoryState(undefined, state).heard, []);
  assert.equal(getCompanionRelations(state).find(item => item.id === 'kaidan').status, 'recruited');
});

test('both queen decisions are exported separately and cannot pay or change their mind on repeat completion', () => {
  for (const decision of ['release', 'destroy']) {
    const state = council(); finish(state, 'noveria', decision);
    const consequence = getNarrativeConsequences(state).find(item => item.id === 'noveria');
    assert.match(consequence.text, decision === 'release' ? /libéré/ : /destruction/);
    const before = snapshot(state);
    assert.equal(completeZone(state, 'noveria', decision), false);
    assert.equal(completeZone(state, 'noveria', decision === 'release' ? 'destroy' : 'release'), false);
    assert.equal(snapshot(state), before);
    const loaded = decodeSave(encodeSave(state)); assert.equal(loaded.choices.noveria, decision);
    assert.deepEqual(getNarrativeConsequences(loaded), getNarrativeConsequences(state));
    assert.ok(!consequence.text.includes('Moissonneur'));
  }
});

test('actual persuasion thresholds expose the prerequisite and reject a locked choice without side effects', () => {
  for (const tone of ['paragon', 'renegade']) for (const points of [5, 6]) {
    const state = council(); travel(state, 'citadel'); state[tone] = points;
    assert.equal(advanceOperation(state, 'citadel-presidium-prophet', 'officer', 'listen').ok, true);
    const before = snapshot(state), interaction = getOperationInteraction(state, 'citadel-presidium-prophet', 'hanar');
    assert.equal(interaction.ok, true);
    const choice = interaction.choices.find(item => item.id === (tone === 'paragon' ? 'diplomacy' : 'intimidate'));
    assert.equal(choice.disabled, points < 6); assert.match(choice.reason || choice.consequence, /6 points/);
    assert.equal(advanceOperation(state, 'citadel-presidium-prophet', 'hanar', choice.id).ok, points >= 6);
    if (points < 6) assert.equal(snapshot(state), before);
    assert.deepEqual(decodeSave(encodeSave(state)), state);
  }
});
