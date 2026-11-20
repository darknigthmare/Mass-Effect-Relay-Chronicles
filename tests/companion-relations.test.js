import test from 'node:test';
import assert from 'node:assert/strict';
import { changeCompanionNote, getCompanionNote, normalizeCompanionRelations } from '../src/companion-relations.js';
import { getCompanionRelations } from '../src/completion-narrative.js';
import { renderCompanionRelations } from '../src/completion-narrative-ui.js';
import { readTopic } from '../src/story.js';
import { applyResolveVirmireInteraction, completeZone, decodeSave, encodeSave, newGame, recruit, travelCampaign, winEncounter, zoneEncounters } from '../src/state.js';
import { RESOLVE_VIRMIRE_POIS } from '../src/resolve-virmire.js';

const options = (state, id = 'kaidan') => getCompanionNote(state, id, { editable: true }).actions.map(item => item.id);
function finish(state, zone, choice = null) {
  assert.equal(travelCampaign(state, zone).ok, true);
  if (zone === 'citadel') assert.equal(recruit(state, 'tali'), true);
  for (const id of zoneEncounters(zone)) assert.equal(winEncounter(state, id), true);
  assert.equal(completeZone(state, zone, choice), true);
}

function virmire(state, key, choice) {
  const { x, z } = RESOLVE_VIRMIRE_POIS[key];
  state.position = { x, z };
  assert.equal(applyResolveVirmireInteraction(state, `resolve:virmire:${key}`, choice).ok, true);
}

test('only recorded exchanges enable a note and romance requires explicit opt-in', () => {
  const state = newGame();
  assert.deepEqual(options(state), []);
  assert.equal(changeCompanionNote(state, 'kaidan', 'friendship').ok, false);
  assert.equal(readTopic(state, 'kaidan', 'implants').ok, true);
  assert.deepEqual(options(state), ['friendship']);
  assert.equal(changeCompanionNote(state, 'kaidan', 'romantic-interest').ok, false);
  const before = structuredClone(state);
  assert.deepEqual(changeCompanionNote(state, 'kaidan', 'friendship'), { ok: true, stage: 'friendship' });
  assert.deepEqual(state, { ...before, companionRelations: { kaidan: 'friendship' } });
  assert.deepEqual(options(state), ['romantic-interest', 'clear']);
  assert.deepEqual(changeCompanionNote(state, 'kaidan', 'romantic-interest'), { ok: true, stage: 'romantic-interest' });
  const loaded = decodeSave(encodeSave(state));
  assert.deepEqual(loaded, state);
  assert.equal(changeCompanionNote(loaded, 'kaidan', 'romantic-interest').ok, false);
  assert.deepEqual(options(loaded), ['withdraw']);
  assert.match(renderCompanionRelations(loaded, { editable: true }), /Note privée · Intérêt romantique de Shepard/);
  assert.match(renderCompanionRelations(loaded, { editable: true }), /data-choice="withdraw"/);
  assert.doesNotMatch(renderCompanionRelations(loaded), /data-do="companion-note"/);
  assert.equal(changeCompanionNote(loaded, 'kaidan', 'withdraw').stage, 'friendship');
  assert.equal(changeCompanionNote(loaded, 'kaidan', 'clear').stage, '');
  assert.deepEqual(loaded, before);
});

test('previous saves start without notes, and a forged assertion or unheard companion is refused', () => {
  const state = newGame();
  const packet = JSON.parse(encodeSave(state));
  delete packet.state.companionRelations;
  assert.deepEqual(decodeSave(packet).companionRelations, {});
  for (const invalid of [null, [], false, { kaidan: 'friendship' }, { shepard: 'friendship' }, { liara: 'romantic-interest' }, { kaidan: 'relationship' }]) {
    packet.state.companionRelations = invalid;
    assert.equal(decodeSave(packet), null);
  }
  assert.equal(readTopic(state, 'kaidan', 'implants').ok, true);
  let read = false;
  const unsafe = {};
  Object.defineProperty(unsafe, 'kaidan', { enumerable: true, get() { read = true; return 'friendship'; } });
  assert.equal(normalizeCompanionRelations(unsafe, state), null);
  assert.equal(read, false);
});

test('temporary absence makes notes read-only and survival restores access without changing history', () => {
  const state = newGame();
  state.flags.briefed = true;
  assert.equal(readTopic(state, 'kaidan', 'implants').ok, true);
  assert.equal(changeCompanionNote(state, 'kaidan', 'friendship').ok, true);
  assert.equal(changeCompanionNote(state, 'kaidan', 'romantic-interest').ok, true);
  for (const [zone, choice] of [['eden-prime'], ['citadel'], ['therum'], ['feros', 'save']]) finish(state, zone, choice);
  assert.equal(travelCampaign(state, 'virmire').ok, true);
  virmire(state, 'briefing', 'send-kaidan');
  const during = decodeSave(encodeSave(state));
  assert.ok(during);
  const relation = getCompanionRelations(during).find(item => item.id === 'kaidan');
  assert.equal(relation.away, true);
  assert.equal(relation.note.stage, 'romantic-interest');
  assert.deepEqual(options(during), []);
  assert.equal(changeCompanionNote(during, 'kaidan', 'withdraw').ok, false);
  assert.equal(during.companionRelations.kaidan, 'romantic-interest');

  assert.equal(winEncounter(during, 'virmire:encounter-1'), true);
  assert.equal(winEncounter(during, 'virmire:encounter-2'), true);
  for (const [key, choice] of [['rana', 'release'], ['beacon', 'activate'], ['sovereign', 'confront'], ['bomb', 'acknowledge'], ['rescue', 'save-kaidan']])
    virmire(during, key, choice);
  assert.equal(winEncounter(during, 'virmire:boss'), true);
  assert.equal(completeZone(during, 'virmire', 'save-kaidan'), true);
  assert.equal(travelCampaign(during, 'normandy').ok, true);
  const returned = decodeSave(encodeSave(during));
  assert.deepEqual(options(returned), ['withdraw']);
  assert.equal(returned.companionRelations.kaidan, 'romantic-interest');
  assert.equal(changeCompanionNote(returned, 'kaidan', 'withdraw').ok, true);
});

for (const survivor of ['kaidan', 'ashley']) {
  test(`the recorded Virmire survivor ${survivor} retains their notes and only living crew can edit`, () => {
    const state = newGame();
    state.flags.briefed = true;
    assert.equal(readTopic(state, 'kaidan', 'implants').ok, true);
    assert.equal(changeCompanionNote(state, 'kaidan', 'friendship').ok, true);
    finish(state, 'eden-prime');
    assert.equal(travelCampaign(state, 'normandy').ok, true);
    assert.equal(readTopic(state, 'ashley', 'famille').ok, true);
    assert.equal(changeCompanionNote(state, 'ashley', 'friendship').ok, true);
    finish(state, 'citadel');
    finish(state, 'therum');
    finish(state, 'feros', 'save');
    finish(state, 'virmire', `save-${survivor}`);
    assert.equal(travelCampaign(state, 'normandy').ok, true);
    const resumed = decodeSave(encodeSave(state));
    assert.deepEqual(resumed.companionRelations, { kaidan: 'friendship', ashley: 'friendship' });
    const lost = survivor === 'kaidan' ? 'ashley' : 'kaidan';
    assert.equal(getCompanionRelations(resumed).find(item => item.id === lost).status, 'lost');
    assert.deepEqual(options(resumed, lost), []);
    assert.equal(changeCompanionNote(resumed, lost, 'romantic-interest').ok, false);
    assert.deepEqual(options(resumed, survivor), ['romantic-interest', 'clear']);
    assert.equal(changeCompanionNote(resumed, survivor, 'romantic-interest').ok, true);
    const foreign = { ...resumed, context: { mediaId: 'ME2', periodId: 'me2' } };
    assert.deepEqual(options(foreign, survivor), []);
    assert.equal(changeCompanionNote(foreign, survivor, 'withdraw').ok, false);
  });
}
