import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, winEncounter, completeZone, zoneEncounters, recruit, decodeSave, encodeSave } from '../src/state.js';
import { createResolveEndgameState, normalizeResolveEndgame, getVigilExchange, commitVigilExchange,
  chooseHumanRepresentative, endgameReport, getPoliticalEpilogue } from '../src/resolve-endgame.js';
import { createCampaignExport, decodeCampaignExport } from '../src/completion-persistence-campaign.js';
import { getChronicleContinuity } from '../src/advance-continuity.js';
import { getCodexEntries } from '../src/story.js';
import { createResolveNoveriaState } from '../src/resolve-noveria.js';
import { createResolveVirmireState } from '../src/resolve-virmire.js';
import { renderChronicleContinuity } from '../src/advance-continuity-ui.js';
import { createResolveCitadelState } from '../src/resolve-citadel.js';

function untilIlos() {
  const state = newGame(); state.flags.briefed = true;
  for (const [zone, choice] of [['eden-prime'], ['citadel'], ['therum'], ['feros', 'save'], ['noveria', 'release'], ['virmire', 'save-kaidan']]) {
    state.zone = zone;
    if (zone === 'citadel') recruit(state, 'tali');
    else for (const id of zoneEncounters(zone)) assert.equal(winEncounter(state, id), true, id);
    assert.equal(completeZone(state, zone, choice), true, zone);
  }
  state.zone = 'ilos'; for (const id of zoneEncounters('ilos')) assert.equal(winEncounter(state, id), true);
  return state;
}
function finale(order, representative) {
  const state = untilIlos(); assert.equal(commitVigilExchange(state).ok, true);
  assert.equal(completeZone(state, 'ilos'), true); state.zone = 'citadel-finale';
  for (const id of zoneEncounters(state.zone)) assert.equal(winEncounter(state, id), true);
  assert.equal(completeZone(state, state.zone, order), true);
  if (representative) assert.equal(chooseHumanRepresentative(state, representative).ok, true);
  return state;
}

test('Vigil graph terminates and questions do not mutate or reward before explicit receipt', () => {
  const state = untilIlos(), before = structuredClone(state), visited = new Set();
  const visit = step => {
    if (visited.has(step)) return;
    visited.add(step); const node = getVigilExchange(state, step); assert.ok(node, step);
    assert.ok(node.choices.length); for (const choice of node.choices) {
      if (choice.nextStep) visit(choice.nextStep);
      else assert.equal(choice.effect, 'record-vigil');
    }
  };
  visit('intro'); assert.equal(visited.size, 5); assert.deepEqual(state, before);
  assert.equal(getCodexEntries(state).some(entry => entry.id === 'vigil-conduit'), false);
  assert.equal(commitVigilExchange(state).changed, true);
  assert.equal(getCodexEntries(state).some(entry => entry.id === 'vigil-conduit'), true);
  assert.equal(getCodexEntries(state).some(entry => entry.id === 'vigil-reaper-cycle'), true);
  const received = structuredClone(state); assert.equal(commitVigilExchange(state).changed, false); assert.deepEqual(state, received);
  for (const key of ['xp', 'credits', 'medigel', 'paragon', 'renegade']) assert.equal(state[key], before[key]);
  const locked = newGame(), snapshot = structuredClone(locked);
  assert.equal(getVigilExchange(locked), null); assert.equal(commitVigilExchange(locked).ok, false); assert.deepEqual(locked, snapshot);
  assert.equal(getVigilExchange({ ...state, context: { mediaId: 'ME2', periodId: 'me2' } }), null);
});

test('fleet fate and human representative form four independent persistent endings', () => {
  for (const order of ['save-council', 'focus-sovereign']) for (const representative of ['anderson', 'udina']) {
    const state = finale(order, representative), report = endgameReport(state), epilogue = getPoliticalEpilogue(state);
    assert.equal(report.humanRepresentative, representative);
    assert.equal(report.councilFate, order === 'save-council' ? 'saved' : 'destroyed');
    assert.equal(epilogue.representativeName, representative === 'anderson' ? 'David Anderson' : 'Donnel Udina');
    assert.match(epilogue.councilText, order === 'save-council' ? /survécu/ : /péri/);
    const before = structuredClone(state); assert.equal(chooseHumanRepresentative(state, representative).changed, false);
    assert.equal(chooseHumanRepresentative(state, representative === 'anderson' ? 'udina' : 'anderson').ok, false); assert.deepEqual(state, before);
    const saved = decodeSave(encodeSave(state)); assert.ok(saved); assert.deepEqual(endgameReport(saved), report);
    const exported = createCampaignExport(saved); assert.equal(exported.ok, true);
    assert.deepEqual(decodeCampaignExport(exported.record).endgameReport, report);
    for (const mediaId of ['ME2', 'ME3']) {
      const continuity = getChronicleContinuity({ mediaId, periodId: mediaId.toLowerCase() }, exported.record);
      assert.equal(continuity.endgameReport.humanRepresentative, representative);
      assert.equal(continuity.endgameReport.futurePresence, 'undetermined');
    }
  }
});

test('old reports keep absent political details and malformed duplicated reports fail closed', () => {
  const state = finale('save-council', 'anderson'), record = createCampaignExport(state).record;
  const old = structuredClone(record); delete old.endgameReport; delete old.save.state.resolveEndgame;
  const imported = decodeCampaignExport(old); assert.ok(imported); assert.equal(Object.hasOwn(imported, 'endgameReport'), false);
  const continuity = getChronicleContinuity({ mediaId: 'ME2', periodId: 'me2' }, imported); assert.equal(continuity.endgameReport, null);
  for (const patch of [{ humanRepresentative: 'udina' }, { councilFate: 'destroyed' }, { extra: true }, { futurePresence: 'present' }]) {
    const bad = structuredClone(record); Object.assign(bad.endgameReport, patch); assert.equal(decodeCampaignExport(bad), null);
  }
  const invalid = [null, false, {}, { ...createResolveEndgameState(), humanRepresentative: 'hackett' },
    { ...createResolveEndgameState(), vigilExchange: 1 }, { ...createResolveEndgameState(), extra: true }];
  for (const value of invalid) assert.equal(normalizeResolveEndgame(value, newGame()), null);
  assert.equal(normalizeResolveEndgame({ ...createResolveEndgameState(), humanRepresentative: 'anderson' }, newGame()), null);
  assert.equal(normalizeResolveEndgame({ ...createResolveEndgameState(), vigilExchange: true }, newGame()), null);
  let reads = 0; const getter = { ...createResolveEndgameState() };
  Object.defineProperty(getter, 'humanRepresentative', { enumerable: true, get() { reads++; return 'anderson'; } });
  assert.equal(normalizeResolveEndgame(getter, state), null); assert.equal(reads, 0);
});

test('optional new chapter reports match their complete validated snapshots and never fill legacy gaps', () => {
  // Declared export fixtures, not a claim to have played these new interactions.
  // Branch traversal belongs to the dedicated Noveria/Virmire/Origins suites.
  const state = finale('focus-sovereign', 'udina');
  state.resolveNoveria = { ...createResolveNoveriaState(), anoleisAsked: true, lorikContract: true, evidence: 'lorik', pass: 'lorik' };
  state.resolveVirmire = { ...createResolveVirmireState(), briefed: true, stgVolunteer: 'ashley', rana: 'released',
    beacon: true, sovereign: true, bombArmed: true, rescue: 'save-kaidan',
    support: { communications: true, satellite: false, flyers: true }, alarms: 'disabled' };
  state.resolveOrigins = { version: 1, records: { 'old-unhappy-far-off-things': { stage: 'completed', outcome: 'food', initialAid: 'refused' } } };
  state.resolveCitadel = { ...createResolveCitadelState(), hearing: true, clinic: true, michel: true,
    battles: { clinic: true, fist: true, ambush: true }, fist: 'spared', fistWrex: false, rescue: true, proof: true };
  assert.ok(decodeSave(encodeSave(state)));
  const record = createCampaignExport(state).record, decoded = decodeCampaignExport(record);
  for (const key of ['noveriaReport', 'virmireReport', 'originsReport', 'citadelReport']) assert.deepEqual(decoded[key], record[key]);
  assert.equal(decoded.virmireReport.kirraheSurvived, null); assert.equal(decoded.virmireReport.rana, 'released');
  assert.equal(decoded.virmireReport.extractionSite, 'bomb'); assert.equal(decoded.noveriaReport.pass, 'lorik');
  const ctx = { mediaId: 'ME3', periodId: 'me3' }, dossier = getChronicleContinuity(ctx, decoded);
  assert.match(dossier.origins[0].summary, /nourriture/);
  const markup = renderChronicleContinuity({ context: ctx, session: { context: ctx, importedCampaign: record } });
  assert.match(markup, /data-continuity-virmire-report/); assert.match(markup, /data-continuity-origins-report/);
  assert.match(markup, /data-continuity-citadel-report/); assert.match(markup, /Épargné par Shepard/);
  assert.match(markup, /Survie de Kirrahe : indéterminée/); assert.match(markup, /Donnel Udina/);
  for (const key of ['noveriaReport', 'virmireReport', 'originsReport', 'citadelReport']) {
    const old = structuredClone(record); delete old[key]; assert.equal(Object.hasOwn(decodeCampaignExport(old), key), false);
    const extra = structuredClone(record); extra[key].invented = true; assert.equal(decodeCampaignExport(extra), null);
    let reads = 0; const getter = structuredClone(record);
    Object.defineProperty(getter, key, { enumerable: true, get() { reads++; return record[key]; } });
    assert.equal(decodeCampaignExport(getter), null); assert.equal(reads, 0);
  }
  const bad = structuredClone(record); bad.virmireReport.kirraheSurvived = true; assert.equal(decodeCampaignExport(bad), null);
  const wrongOrigin = structuredClone(record); wrongOrigin.originsReport.origin = 'colonist'; assert.equal(decodeCampaignExport(wrongOrigin), null);
  const wrongPass = structuredClone(record); wrongPass.noveriaReport.pass = 'gianna'; assert.equal(decodeCampaignExport(wrongPass), null);
});
