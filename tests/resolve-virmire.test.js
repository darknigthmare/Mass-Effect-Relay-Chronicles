import test from 'node:test';
import assert from 'node:assert/strict';
import { createResolveVirmireState, normalizeResolveVirmireState, isResolveVirmireUntouched,
  RESOLVE_VIRMIRE_POIS, getResolveVirmireInteraction, transitionResolveVirmire, listResolveVirmirePOIs,
  resolveVirmireEncounterGate, resolveVirmireCompletionGate, virmireReport,
  getResolveVirmireAwayCrew, reconcileResolveVirmireParty } from '../src/resolve-virmire.js';
import { getLevelLayout, isLevelGround } from '../src/level-layout-data.js';
import { findLevelPath } from '../src/world-navigation.js';
import { newGame, recruit, winEncounter, zoneEncounters, completeZone, encodeSave, decodeSave,
  applyResolveVirmireInteraction, availableCrew, canTravelCampaign, travelCampaign } from '../src/state.js';
import { getCodexEntries } from '../src/story.js';
import { createCampaignExport, decodeCampaignExport } from '../src/completion-persistence-campaign.js';

const clone = value => JSON.parse(JSON.stringify(value));
const id = key => `resolve:virmire:${key}`;
const prepared = () => ({ zone: 'virmire', completed: ['eden-prime', 'citadel', 'feros', 'noveria'], cleared: [],
  flags: { briefed: true, spectre: true, jenkinsLost: true }, choices: {}, recruited: ['kaidan', 'jenkins', 'ashley', 'tali'],
  lost: ['jenkins'], party: ['shepard', 'ashley', 'kaidan'], position: null, credits: 1111, xp: 245, medigel: 4,
  paragon: 0, renegade: 0, inventory: { preserved: true }, resolveVirmire: createResolveVirmireState() });
function act(state, key, selected) {
  const poi = listResolveVirmirePOIs(state).find(point => point.id === id(key));
  assert.ok(poi, `${key} must be reachable`); state.position = { x: poi.x, z: poi.z };
  const before = clone(state), result = transitionResolveVirmire(state, id(key), selected);
  assert.equal(result.ok, true, result.reason); assert.deepEqual(state, before, 'Transition does not mutate the caller');
  state.resolveVirmire = result.progress; return result;
}
function entered(volunteer = 'ashley') {
  const state = prepared(); act(state, 'briefing', `send-${volunteer}`); state.cleared.push('virmire:encounter-1'); return state;
}
function laboratory(volunteer = 'ashley', fate = 'release') {
  const state = entered(volunteer); state.cleared.push('virmire:encounter-2'); act(state, 'rana', fate); return state;
}
function crisis(volunteer = 'ashley', fate = 'release') {
  const state = laboratory(volunteer, fate); act(state, 'beacon', 'activate'); act(state, 'sovereign', 'confront'); act(state, 'bomb', 'acknowledge'); return state;
}

test('absent legacy progress keeps historical extraction but invents no STG act, role, Rana fate or survival', () => {
  const state = prepared(); delete state.resolveVirmire;
  assert.deepEqual(normalizeResolveVirmireState(undefined, state), createResolveVirmireState());
  for (const milestone of ['encounter-1', 'encounter-2', 'boss']) {
    const old = { ...clone(state), cleared: [`virmire:${milestone}`] };
    assert.equal(normalizeResolveVirmireState(undefined, old).legacy, true);
  }
  state.completed.push('virmire'); state.choices.virmire = 'save-kaidan';
  state.resolveVirmire = normalizeResolveVirmireState(undefined, state);
  const report = virmireReport(state);
  assert.equal(report.known, false); assert.equal(report.survivor, 'kaidan'); assert.equal(report.lost, 'ashley');
  for (const key of ['support', 'rana', 'stgVolunteer', 'bombDefender', 'extractionSite', 'kirraheSurvived']) assert.equal(report[key], null);
  assert.deepEqual(listResolveVirmirePOIs(state), []); assert.equal(resolveVirmireCompletionGate(state).ok, true);
});

test('strict schema rejects extra fields, getters without evaluating them, symbols and future versions', () => {
  const state = prepared(); let reads = 0;
  const getter = createResolveVirmireState(); Object.defineProperty(getter, 'sovereign', { enumerable: true, get() { reads++; return true; } });
  assert.equal(normalizeResolveVirmireState(getter, state), null); assert.equal(reads, 0);
  const nested = createResolveVirmireState(); Object.defineProperty(nested.support, 'flyers', { enumerable: true, get() { reads++; return true; } });
  assert.equal(normalizeResolveVirmireState(nested, state), null); assert.equal(reads, 0);
  const symbol = createResolveVirmireState(); symbol[Symbol('foreign')] = false;
  for (const bad of [null, [], {}, symbol, { ...createResolveVirmireState(), version: 2 },
    { ...createResolveVirmireState(), other: true }, { ...createResolveVirmireState(), support: { communications: false, satellite: false, flyers: 0 } }])
    assert.equal(normalizeResolveVirmireState(bad, state), null);
});

test('forged chronology cannot reveal Sovereign, report a Rana outcome or confirm rescue early', () => {
  const state = prepared();
  for (const mutate of [p => { p.briefed = true; }, p => { p.stgVolunteer = 'ashley'; }, p => { p.rana = 'released'; },
    p => { p.support.flyers = true; }, p => { p.alarms = 'disabled'; }, p => { p.beacon = true; }, p => { p.sovereign = true; },
    p => { p.bombArmed = true; }, p => { p.rescue = 'save-kaidan'; }, p => { p.legacy = true; }]) {
    const p = createResolveVirmireState(); mutate(p); assert.equal(normalizeResolveVirmireState(p, state), null);
  }
  const p = createResolveVirmireState(); p.legacy = true; p.briefed = true; p.stgVolunteer = 'kaidan';
  state.cleared.push('virmire:encounter-1'); assert.equal(normalizeResolveVirmireState(p, state), null);
});

test('foreign episode, unavailable Virmire, wrong zone and distant actors cannot apply actions', () => {
  const state = prepared();
  for (const changes of [{ mediaId: 'ME2' }, { periodId: 'me3' }, { context: { mediaId: 'ME1', periodId: 'me2' } },
    { zone: 'normandy' }, { completed: ['eden-prime', 'citadel', 'feros'] }, { flags: {} }, { position: { x: 999, z: 999 } }]) {
    const blocked = { ...clone(state), position: { x: 23, z: 33 }, ...changes }, before = clone(blocked);
    assert.equal(transitionResolveVirmire(blocked, id('briefing'), 'send-ashley').ok, false); assert.deepEqual(blocked, before);
  }
  assert.deepEqual(virmireReport({ ...state, mediaId: 'ME3' }), { known: false });
});

test('Kirrahe briefing assigns one named volunteer, explains optional objectives and cannot replay', () => {
  for (const volunteer of ['ashley', 'kaidan']) {
    const state = prepared(); assert.equal(isResolveVirmireUntouched(state), true);
    assert.equal(resolveVirmireEncounterGate(state, 'virmire:encounter-1').ok, false);
    const model = getResolveVirmireInteraction(state, id('briefing'));
    assert.match(model.text, /noyau/); assert.match(model.text, /satellite/); assert.match(model.text, /facultatifs/);
    act(state, 'briefing', `send-${volunteer}`); assert.equal(isResolveVirmireUntouched(state), false);
    const report = virmireReport(state); assert.equal(report.stgVolunteer, volunteer); assert.notEqual(report.bombDefender, volunteer);
    assert.equal(resolveVirmireEncounterGate(state, 'virmire:encounter-1').ok, true);
    assert.equal(getResolveVirmireInteraction(state, id('briefing')).ok, false);
    assert.deepEqual(report.support, { communications: false, satellite: false, flyers: false });
  }
});

test('three independently targeted STG acts preserve every combination and give no automatic rewards', () => {
  const keys = ['communications', 'satellite', 'flyers'];
  for (let mask = 0; mask < 8; mask++) {
    const state = entered(), economy = clone({ credits: state.credits, xp: state.xp, medigel: state.medigel, inventory: state.inventory });
    keys.forEach((key, index) => { if (mask & 1 << index) act(state, key, key === 'communications' ? 'disrupt' : 'destroy'); });
    keys.forEach((key, index) => assert.equal(virmireReport(state).support[key], !!(mask & 1 << index)));
    assert.equal(resolveVirmireEncounterGate(state, 'virmire:encounter-2').ok, true, 'All support objectives remain optional');
    assert.deepEqual({ credits: state.credits, xp: state.xp, medigel: state.medigel, inventory: state.inventory }, economy);
    assert.deepEqual(normalizeResolveVirmireState(clone(state.resolveVirmire), state), state.resolveVirmire);
  }
});

test('a support act cannot replay or be applied after the base approach closes', () => {
  const state = entered(); act(state, 'communications', 'disrupt');
  const before = clone(state); assert.equal(transitionResolveVirmire(state, id('communications'), 'disrupt').ok, false); assert.deepEqual(state, before);
  state.cleared.push('virmire:encounter-2');
  assert.equal(getResolveVirmireInteraction(state, id('satellite')).ok, false);
  assert.equal(getResolveVirmireInteraction(state, id('flyers')).ok, false);
});

test('alarm choice is separate from three sabotage flags and does not invent certified Kirrahe survival', () => {
  for (const [selection, expected] of [['disable', 'disabled'], ['divert', 'diverted']]) {
    const state = entered(); act(state, 'alarms', selection);
    assert.equal(virmireReport(state).alarms, expected); assert.equal(virmireReport(state).kirraheSurvived, null);
    assert.equal(Object.values(virmireReport(state).support).some(Boolean), false);
    assert.equal(getResolveVirmireInteraction(state, id('alarms')).ok, false);
  }
});

test('Rana has two irreversible exportable outcomes and neither reveals the Reaper identity', () => {
  for (const [selection, expected] of [['release', 'released'], ['kill', 'killed']]) {
    const state = entered(); assert.equal(getResolveVirmireInteraction(state, id('rana')).ok, false);
    state.cleared.push('virmire:encounter-2');
    const text = getResolveVirmireInteraction(state, id('rana')).text; assert.match(text, /endoctrinement/); assert.doesNotMatch(text, /Moissonneur/);
    act(state, 'rana', selection); const report = virmireReport(state);
    assert.equal(report.rana, expected); assert.equal(report.sovereign, false); assert.equal(report.beacon, false);
    assert.equal(getResolveVirmireInteraction(state, id('rana')).ok, false);
    assert.equal(getResolveVirmireInteraction(state, id('beacon')).ok, true);
    assert.deepEqual(virmireReport(clone(state)), report);
  }
});

test('the laboratory beacon precedes Sovereign, who reveals no Vigil or Conduit mechanism', () => {
  const state = laboratory();
  assert.equal(getResolveVirmireInteraction(state, id('sovereign')).ok, false);
  assert.equal(getResolveVirmireInteraction(state, id('bomb')).ok, false);
  act(state, 'beacon', 'activate'); assert.equal(virmireReport(state).sovereign, false);
  const model = getResolveVirmireInteraction(state, id('sovereign'));
  assert.match(model.text, /lui-même un Moissonneur/); assert.match(model.text, /restent inconnus/);
  act(state, 'sovereign', 'confront'); assert.equal(virmireReport(state).sovereign, true);
  assert.equal(getResolveVirmireInteraction(state, id('sovereign')).ok, false);
  assert.equal(getResolveVirmireInteraction(state, id('bomb')).ok, true);
});

test('both role assignments and both rescue choices produce the correct named extraction position', () => {
  for (const volunteer of ['ashley', 'kaidan']) for (const survivor of ['ashley', 'kaidan']) {
    const state = crisis(volunteer);
    assert.equal(resolveVirmireEncounterGate(state, 'virmire:boss').ok, false);
    const model = getResolveVirmireInteraction(state, id('rescue'));
    assert.match(model.choices.find(c => c.id === `save-${volunteer}`).label, /tour antiaérienne/);
    assert.match(model.choices.find(c => c.id !== `save-${volunteer}`).label, /site de la bombe/);
    act(state, 'rescue', `save-${survivor}`); const report = virmireReport(state);
    assert.equal(report.survivor, survivor); assert.notEqual(report.lost, survivor);
    assert.equal(report.extractionSite, survivor === volunteer ? 'aa-tower' : 'bomb');
    assert.equal(resolveVirmireEncounterGate(state, 'virmire:boss').ok, true);
    assert.equal(resolveVirmireCompletionGate(state, `save-${survivor}`).ok, true);
    assert.equal(resolveVirmireCompletionGate(state, survivor === 'kaidan' ? 'save-ashley' : 'save-kaidan').ok, false);
    const before = clone(state); assert.equal(transitionResolveVirmire(state, id('rescue'), `save-${report.lost}`).ok, false); assert.deepEqual(state, before);
  }
});

test('completed detailed chapter must retain its exact extraction and cannot fabricate a different survivor on import', () => {
  const state = crisis(); act(state, 'rescue', 'save-ashley'); state.cleared.push('virmire:boss');
  state.completed.push('virmire'); state.choices.virmire = 'save-ashley';
  assert.ok(normalizeResolveVirmireState(state.resolveVirmire, state));
  assert.deepEqual(listResolveVirmirePOIs(state), []);
  state.choices.virmire = 'save-kaidan'; assert.equal(normalizeResolveVirmireState(state.resolveVirmire, state), null);
});

test('public POIs are detached, valid finite terrain anchors and unrelated encounters remain unaffected', () => {
  const state = prepared(); const first = listResolveVirmirePOIs(state);
  assert.equal(first.length, 1); first[0].x = 999;
  assert.equal(listResolveVirmirePOIs(state)[0].x, 23);
  for (const point of Object.values(RESOLVE_VIRMIRE_POIS)) assert.ok(Number.isFinite(point.x) && Number.isFinite(point.z));
  assert.equal(resolveVirmireEncounterGate(state, 'noveria:boss').ok, true);
  state.position = { x: 23, z: 33 }; const before = clone(state);
  assert.equal(transitionResolveVirmire(state, id('briefing'), 'invented').ok, false); assert.deepEqual(state, before);
});

test('assigned STG volunteer and bomb defender leave the active squad without recruitment changes or premature deaths', () => {
  for (const volunteer of ['ashley', 'kaidan']) {
    const state = entered(volunteer), roster = clone(state.recruited), losses = clone(state.lost);
    assert.deepEqual(getResolveVirmireAwayCrew(state), [volunteer]);
    const party = reconcileResolveVirmireParty(state);
    assert.equal(party[0], 'shepard'); assert.equal(party.includes(volunteer), false); assert.equal(party.includes('tali'), true);
    assert.equal(party.includes(volunteer === 'ashley' ? 'kaidan' : 'ashley'), true);
    assert.deepEqual(state.recruited, roster); assert.deepEqual(state.lost, losses);
    const critical = crisis(volunteer); critical.party = party;
    assert.deepEqual(new Set(getResolveVirmireAwayCrew(critical)), new Set(['ashley', 'kaidan']));
    assert.deepEqual(reconcileResolveVirmireParty(critical), ['shepard', 'tali']);
    critical.recruited.push('wrex'); assert.deepEqual(reconcileResolveVirmireParty(critical), ['shepard', 'tali', 'wrex']);
    act(critical, 'rescue', 'save-ashley'); critical.completed.push('virmire'); critical.choices.virmire = 'save-ashley';
    critical.lost.push('kaidan'); assert.deepEqual(getResolveVirmireAwayCrew(critical), []);
    assert.equal(reconcileResolveVirmireParty(critical).includes('ashley'), true);
    assert.equal(reconcileResolveVirmireParty(critical).includes('kaidan'), false);
  }
});

test('all new interaction anchors lie on connected authored Virmire ground', () => {
  const layout = getLevelLayout('virmire');
  for (const [key, point] of Object.entries(RESOLVE_VIRMIRE_POIS)) {
    assert.equal(isLevelGround(layout, point.x, point.z), true, key);
    const path = findLevelPath({ bounds: layout.bounds, start: layout.spawn, destination: point,
      isWalkable: (x, z) => isLevelGround(layout, x, z) });
    assert.ok(path?.length, `A walkable path must reach ${key} from the public landing zone`);
  }
});

function campaignBeforeVirmire() {
  const state = newGame(); state.flags.briefed = true;
  for (const zone of ['eden-prime', 'citadel', 'therum', 'noveria']) {
    state.zone = zone; if (zone === 'citadel') assert.equal(recruit(state, 'tali'), true);
    for (const encounter of zoneEncounters(zone)) assert.equal(winEncounter(state, encounter), true);
    assert.equal(completeZone(state, zone, zone === 'noveria' ? 'release' : null), true);
  }
  state.zone = 'virmire'; assert.ok(decodeSave(encodeSave(state))); return state;
}
function campaignAct(state, key, selected) {
  const point = RESOLVE_VIRMIRE_POIS[key]; state.position = { x: point.x, z: point.z };
  const result = applyResolveVirmireInteraction(state, id(key), selected);
  assert.equal(result.ok, true, result.reason); assert.ok(decodeSave(encodeSave(state)));
  return result;
}
function campaignCrisis(volunteer = 'ashley', rana = 'release') {
  const state = campaignBeforeVirmire(); campaignAct(state, 'briefing', `send-${volunteer}`);
  assert.equal(winEncounter(state, 'virmire:encounter-1'), true);
  campaignAct(state, 'communications', 'disrupt'); campaignAct(state, 'flyers', 'destroy');
  assert.equal(winEncounter(state, 'virmire:encounter-2'), true);
  campaignAct(state, 'rana', rana); campaignAct(state, 'beacon', 'activate'); campaignAct(state, 'sovereign', 'confront');
  campaignAct(state, 'bomb', 'acknowledge'); return state;
}

test('real campaign transaction commits roles and party atomically; imports reject assigned human ghost fighters', () => {
  const state = campaignBeforeVirmire(), before = clone(state); state.position = { x: 23, z: 33 };
  const stable = clone(state); assert.equal(applyResolveVirmireInteraction(state, id('briefing'), 'invented').ok, false);
  assert.deepEqual(state, stable); campaignAct(state, 'briefing', 'send-ashley');
  assert.equal(state.recruited.includes('ashley'), true); assert.equal(state.lost.includes('ashley'), false);
  assert.equal(state.party.includes('ashley'), false); assert.equal(availableCrew(state).includes('ashley'), false);
  assert.equal(state.xp, before.xp); assert.equal(state.credits, before.credits); assert.deepEqual(state.inventory, before.inventory);
  const forged = JSON.parse(encodeSave(state)); forged.state.party = ['shepard', 'ashley', 'tali'];
  assert.equal(decodeSave(forged), null);
  assert.equal(state.logs.filter(entry => entry.title.startsWith('Virmire ·')).length, 1);
});

test('actual save roundtrips preserve four role/rescue combinations; native completion applies one permanent loss once', () => {
  for (const volunteer of ['ashley', 'kaidan']) for (const survivor of ['ashley', 'kaidan']) {
    const state = campaignCrisis(volunteer, survivor === 'ashley' ? 'release' : 'kill');
    assert.equal(state.party.includes('ashley'), false); assert.equal(state.party.includes('kaidan'), false);
    assert.equal(state.lost.includes('ashley'), false); assert.equal(state.lost.includes('kaidan'), false);
    campaignAct(state, 'rescue', `save-${survivor}`);
    assert.equal(winEncounter(state, 'virmire:boss'), true);
    const before = clone(state), other = survivor === 'ashley' ? 'kaidan' : 'ashley';
    assert.equal(completeZone(state, 'virmire', `save-${other}`), false); assert.deepEqual(state, before);
    assert.equal(completeZone(state, 'virmire', `save-${survivor}`), true);
    assert.equal(state.lost.includes(other), true); assert.equal(state.lost.includes(survivor), false);
    assert.equal(state.party.includes(other), false); assert.equal(availableCrew(state).includes(survivor), true);
    const resumed = decodeSave(encodeSave(state)); assert.ok(resumed); assert.deepEqual(virmireReport(resumed), virmireReport(state));
    assert.equal(resumed.lost.filter(member => member === other).length, 1);
    const final = clone(state); assert.equal(completeZone(state, 'virmire', `save-${survivor}`), false); assert.deepEqual(state, final);
  }
});

test('native Codex stays closed through Rana and beacon, opens at Sovereign receipt, and rejects premature imported dossier', () => {
  const state = campaignBeforeVirmire(); campaignAct(state, 'briefing', 'send-kaidan');
  assert.equal(winEncounter(state, 'virmire:encounter-1'), true); assert.equal(winEncounter(state, 'virmire:encounter-2'), true);
  campaignAct(state, 'rana', 'release');
  assert.equal(getCodexEntries(state).some(entry => entry.id === 'sovereign'), false);
  const premature = JSON.parse(encodeSave(state)); premature.state.story.codex.push('sovereign'); assert.equal(decodeSave(premature), null);
  campaignAct(state, 'beacon', 'activate'); assert.equal(getCodexEntries(state).some(entry => entry.id === 'sovereign'), false);
  campaignAct(state, 'sovereign', 'confront'); assert.equal(getCodexEntries(state).some(entry => entry.id === 'sovereign'), true);
  const resumed = decodeSave(encodeSave(state)); assert.ok(resumed); assert.equal(getCodexEntries(resumed).some(entry => entry.id === 'sovereign'), true);
  const invalid = JSON.parse(encodeSave(state)); invalid.state.resolveVirmire.beacon = false; assert.equal(decodeSave(invalid), null);
});

test('save imports distinguish absent legacy progress from explicit invalid values', () => {
  const state = campaignCrisis(); campaignAct(state, 'rescue', 'save-kaidan');
  assert.equal(winEncounter(state, 'virmire:boss'), true); assert.equal(completeZone(state, 'virmire', 'save-kaidan'), true);
  const absent = JSON.parse(encodeSave(state)); delete absent.state.resolveVirmire;
  const old = decodeSave(absent); assert.ok(old); assert.equal(old.resolveVirmire.legacy, true); assert.equal(virmireReport(old).known, false);
  for (const bad of [undefined, null, {}, { ...state.resolveVirmire, version: 9 }, { ...state.resolveVirmire, rescue: 'save-ashley' }]) {
    const explicit = JSON.parse(encodeSave(state)); explicit.state.resolveVirmire = bad; assert.equal(decodeSave(explicit), null);
  }
});

test('completed campaign export carries the exact Virmire facts and rejects a tampered future outcome', () => {
  const state = campaignCrisis('kaidan', 'release'); campaignAct(state, 'rescue', 'save-ashley');
  assert.equal(winEncounter(state, 'virmire:boss'), true); assert.equal(completeZone(state, 'virmire', 'save-ashley'), true);
  for (const zone of ['feros', 'ilos', 'citadel-finale']) {
    state.zone = zone; for (const encounter of zoneEncounters(zone)) assert.equal(winEncounter(state, encounter), true);
    assert.equal(completeZone(state, zone, zone === 'feros' ? 'save' : zone === 'citadel-finale' ? 'save-council' : null), true);
  }
  const result = createCampaignExport(state); assert.equal(result.ok, true, result.reason);
  assert.equal(result.record.virmireReport.rana, 'released');
  assert.equal(result.record.virmireReport.extractionSite, 'bomb');
  assert.deepEqual(result.record.virmireReport.support, { communications: true, satellite: false, flyers: true });
  assert.equal(result.record.virmireReport.kirraheSurvived, null);
  assert.ok(decodeCampaignExport(result.record));
  const tampered = clone(result.record); tampered.virmireReport.rana = 'me3-consequence'; assert.equal(decodeCampaignExport(tampered), null);
});

test('active Virmire assignment blocks departure atomically until extraction restores the surviving crew', () => {
  const state = campaignBeforeVirmire(); assert.equal(canTravelCampaign(state, 'normandy').ok, true);
  campaignAct(state, 'briefing', 'send-ashley');
  for (const destination of ['normandy', 'citadel', 'therum', 'noveria']) {
    const before = clone(state); assert.equal(canTravelCampaign(state, destination).ok, false);
    assert.equal(travelCampaign(state, destination).ok, false); assert.deepEqual(state, before);
  }
  const final = campaignCrisis(); campaignAct(final, 'rescue', 'save-kaidan');
  assert.equal(winEncounter(final, 'virmire:boss'), true); assert.equal(completeZone(final, 'virmire', 'save-kaidan'), true);
  assert.equal(canTravelCampaign(final, 'normandy').ok, true); assert.equal(travelCampaign(final, 'normandy').ok, true);
  assert.equal(final.zone, 'normandy'); assert.equal(final.party.includes('ashley'), false);
  assert.equal(availableCrew(final).includes('kaidan'), true); assert.ok(decodeSave(encodeSave(final)));
});

test('imports cannot relocate an engaged Virmire operation to Normandy or another planet', () => {
  const state = campaignBeforeVirmire(); campaignAct(state, 'briefing', 'send-ashley');
  const snapshot = JSON.parse(encodeSave(state));
  for (const destination of ['normandy', 'citadel', 'therum', 'noveria']) {
    const relocated = clone(snapshot); relocated.state.zone = destination; relocated.state.position = null;
    assert.equal(decodeSave(relocated), null, `An assigned crewmate cannot reappear by importing ${destination}`);
  }
  assert.ok(decodeSave(snapshot)); assert.equal(state.zone, 'virmire'); assert.equal(state.lost.includes('ashley'), false);
});
