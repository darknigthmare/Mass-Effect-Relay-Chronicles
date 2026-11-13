import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, encodeSave, decodeSave, winEncounter, zoneEncounters, completeZone, recruit, SAVE_KEY } from '../src/state.js';
import { createCampaignExport, encodeCampaignExport } from '../src/completion-persistence-campaign.js';
import { actorFor, CLASSES, CREW } from '../src/game-data.js';
import { readTopic } from '../src/story.js';
import { createBattle, getActions, performAction } from '../src/combat.js';
import { CAMPAIGN_TALENTS, getTalentOptions, trainTalent } from '../src/campaign-talents.js';
import { FEROS_COLONIST_TARGETS, listAdvanceFerosPOIs, transitionAdvanceFeros } from '../src/advance-feros.js';
import { MEDIA_PERIODS } from '../src/continuity-data.js';
import { canImportChronicleContinuity, getChronicleContinuity } from '../src/advance-continuity.js';
import { renderChronicleContinuity } from '../src/advance-continuity-ui.js';
import { createChronicle, normalizeChronicle, importChronicleContinuity, clearChronicleContinuity, getImportedChronicleContinuity,
  encodeChronicle, decodeChronicle, saveChronicle, loadChronicle, chronicleStorageKey, selectChronicleScenario, setChronicleParty,
  buildChronicleActor, startChronicleBattle, setChronicleBuild } from '../src/chronicles.js';

const context = (mediaId = 'ME2', periodId = mediaId.toLowerCase()) => ({ mediaId, periodId });
const store = () => { const values = new Map(); return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }; };
function detailedFeros(state, shiala) {
  const act = (key, choice) => {
    const id = `advance:feros:${key}`, poi = listAdvanceFerosPOIs(state).find(item => item.id === id); assert.ok(poi, key);
    state.position = { x: poi.x, z: poi.z }; const result = transitionAdvanceFeros(state, id, choice); assert.equal(result.ok, true, result.reason);
    state.advanceFeros = result.progress;
  };
  assert.equal(winEncounter(state, 'feros:encounter-1'), true); act('defense', 'coordinate'); act('lizbeth', 'listen');
  assert.equal(winEncounter(state, 'feros:encounter-2'), true); act('investigation', 'research');
  for (const index of [1, 3, 4]) act('pressure', `valve-${index}`);
  act('pressure', 'release'); act('jeong', 'confront'); act('juliana', 'prepare');
  FEROS_COLONIST_TARGETS.forEach((target, index) => act(`colonist-${target.id}`, index < 5 ? 'gas' : index < 12 ? 'melee' : 'lethal'));
  act('freighter', 'open'); assert.equal(winEncounter(state, 'feros:boss'), true); act('shiala', 'receive'); act('shiala', shiala);
  state.position = null;
}
function campaign(mask = 0, shiala = null) {
  const state = newGame({ name: 'Camille', appearance: 'female', origin: 'colonist', psychologicalProfile: 'war-hero', classId: 'sentinel' });
  state.flags.briefed = true;
  for (const [zone, choice] of [['eden-prime'], ['citadel'], ['therum'], ['feros', mask & 1 ? 'force' : 'save'],
    ['noveria', mask & 2 ? 'destroy' : 'release'], ['virmire', mask & 4 ? 'save-ashley' : 'save-kaidan'],
    ['ilos'], ['citadel-finale', mask & 8 ? 'focus-sovereign' : 'save-council']]) {
    state.zone = zone; state.position = null;
    if (zone === 'citadel') for (const id of ['tali', 'garrus', 'wrex']) assert.equal(recruit(state, id), true);
    else if (zone === 'feros' && shiala) detailedFeros(state, shiala);
    else for (const id of zoneEncounters(zone)) assert.equal(winEncounter(state, id), true);
    assert.equal(completeZone(state, zone, choice), true, zone);
    if (zone === 'virmire') {
      state.zone = 'normandy';
      assert.equal(readTopic(state, mask & 4 ? 'ashley' : 'kaidan', 'virmire-return').ok, true);
    }
  }
  assert.ok(decodeSave(encodeSave(state)));
  return state;
}
const fixtures = Array.from({ length: 16 }, (_, mask) => createCampaignExport(campaign(mask)).record);

test('all sixteen ME1 decision combinations import detached identity, consequences and actual survivor exchanges', () => {
  for (const [mask, record] of fixtures.entries()) for (const mediaId of ['ME2', 'ME3']) {
    const session = createChronicle(context(mediaId)), before = structuredClone(session), source = structuredClone(record);
    const result = importChronicleContinuity(session, record); assert.equal(result.ok, true);
    const dossier = getImportedChronicleContinuity(result.session);
    assert.equal(dossier.identity.name, 'Camille'); assert.equal(dossier.identity.classId, 'sentinel');
    assert.equal(dossier.survivor.survivor, mask & 4 ? 'ashley' : 'kaidan');
    assert.equal(dossier.survivor.lost, mask & 4 ? 'kaidan' : 'ashley');
    assert.equal(dossier.survivor.futurePresence, 'undetermined');
    assert.ok(dossier.survivor.relation.exchanges.some(topic => topic.id === 'virmire-return'));
    assert.equal(dossier.summary.consequences.find(item => item.id === 'noveria').text.includes('libéré'), !(mask & 2));
    assert.deepEqual(result.session.importedCampaign.save.state.choices, record.save.state.choices);
    assert.deepEqual(session, before); assert.deepEqual(record, source);
    assert.deepEqual(decodeChronicle(encodeChronicle(result.session)), result.session);
    result.session.importedCampaign.save.state.name = 'Détaché'; assert.deepEqual(record, source);
  }
});

test('the complete registered period matrix accepts only the four solo ME2/ME3 contexts', () => {
  const accepted = [];
  for (const work of MEDIA_PERIODS) for (const period of work.periods) {
    const ctx = context(work.id, period.id), session = createChronicle(ctx);
    const allowed = ['ME2:me2', 'ME2:me2-opening', 'ME3:me3', 'ME3:me3-prologue'].includes(`${work.id}:${period.id}`);
    assert.equal(canImportChronicleContinuity(ctx), allowed);
    if (allowed) accepted.push(`${work.id}:${period.id}`);
    if (session) assert.equal(importChronicleContinuity(session, fixtures[0]).ok, allowed);
  }
  assert.equal(accepted.length, 4);
  assert.equal(getChronicleContinuity({ ...context(), galaxy: 'andromeda' }), null);
});

test('SR-1 opening, SR-2 Cerberus and Alliance are explicit, with no fabricated battle at the ME2 opening', () => {
  for (const [ctx, ship] of [[context('ME2', 'me2-opening'), 'normandy-sr1'], [context(), 'normandy-sr2-cerberus'],
    [context('ME3'), 'normandy-sr2-alliance'], [context('ME3', 'me3-prologue'), 'normandy-sr2-alliance']]) {
    const session = importChronicleContinuity(createChronicle(ctx), fixtures[0]).session;
    assert.equal(getImportedChronicleContinuity(session).ship.id, ship);
    assert.equal(startChronicleBattle(session).ok, ctx.periodId !== 'me2-opening');
  }
  const opening = createChronicle(context('ME2', 'me2-opening'));
  assert.deepEqual(opening.party, []); assert.equal(opening.scenarioId, null);
});

test('absent legacy field has no implicit history while every present malformed field is rejected atomically', () => {
  const session = createChronicle(context()), before = structuredClone(session), valid = fixtures[0];
  assert.equal(getImportedChronicleContinuity(session).imported, false);
  assert.equal(Object.hasOwn(normalizeChronicle(session), 'importedCampaign'), false);
  const malformed = [null, undefined, false, {}, '{broken', encodeSave(newGame()),
    { ...valid, version: 2 }, { ...valid, continuationImplemented: true }, { ...valid, sourceMediaId: 'ME2' },
    { ...valid, unknown: true }];
  const incomplete = structuredClone(valid); incomplete.save.state.ending = false; malformed.push(incomplete);
  const missing = structuredClone(valid); delete missing.save.state.choices.virmire; malformed.push(missing);
  for (const value of malformed) {
    assert.equal(importChronicleContinuity(session, value).ok, false);
    assert.equal(normalizeChronicle({ ...session, importedCampaign: value }), null);
    assert.deepEqual(session, before);
  }
});

test('accessors, symbols, hidden fields, cycles and oversized imports never execute or replace the dossier', () => {
  const session = importChronicleContinuity(createChronicle(context()), fixtures[0]).session, before = structuredClone(session);
  let reads = 0;
  const getter = structuredClone(fixtures[1]); Object.defineProperty(getter.save.state, 'name', { enumerable: true, get() { reads++; return 'Intrus'; } });
  const hidden = structuredClone(fixtures[1]); Object.defineProperty(hidden, 'extra', { value: true });
  const symbolic = structuredClone(fixtures[1]); symbolic[Symbol('extra')] = true;
  const cyclic = structuredClone(fixtures[1]); cyclic.save.state.flags.cycle = cyclic;
  for (const value of [getter, hidden, symbolic, cyclic, 'x'.repeat(2_100_001)]) assert.equal(importChronicleContinuity(session, value).ok, false);
  const fieldGetter = structuredClone(session); Object.defineProperty(fieldGetter, 'importedCampaign', { enumerable: true, get() { reads++; return fixtures[1]; } });
  assert.equal(normalizeChronicle(fieldGetter), null); assert.equal(reads, 0); assert.deepEqual(session, before);
});

test('import, scenario selection, party changes, actual save/reload and removal preserve independent campaign bytes', () => {
  const storage = store(), campaignBytes = encodeSave(campaign()), manualBytes = encodeSave(newGame());
  storage.setItem(SAVE_KEY, campaignBytes); storage.setItem('relay-chronicles.manual-save.v1.1', manualBytes);
  const me3 = createChronicle(context('ME3')); saveChronicle(storage, me3);
  let session = importChronicleContinuity(createChronicle(context()), fixtures[0]).session;
  session = selectChronicleScenario(session, 'me2-equipment-workshop').session;
  session = setChronicleParty(session, [session.party[0]]).session;
  assert.ok(session.importedCampaign); assert.equal(saveChronicle(storage, session).ok, true);
  const loaded = loadChronicle(storage, context()); assert.equal(loaded.fresh, false); assert.deepEqual(loaded.session, session);
  assert.deepEqual(loadChronicle(storage, context('ME3')).session, me3);
  const prior = storage.getItem(chronicleStorageKey(context()));
  assert.equal(saveChronicle(storage, { ...session, importedCampaign: null }).ok, false);
  assert.equal(storage.getItem(chronicleStorageKey(context())), prior);
  assert.equal(storage.getItem(SAVE_KEY), campaignBytes); assert.equal(storage.getItem('relay-chronicles.manual-save.v1.1'), manualBytes);
  const cleared = clearChronicleContinuity(session); assert.equal(cleared.ok, true); assert.equal(Object.hasOwn(cleared.session, 'importedCampaign'), false);
  assert.deepEqual(cleared.session, createChronicleWithoutReport(session));
  assert.ok(session.importedCampaign);
});
function createChronicleWithoutReport(session) { const result = structuredClone(session); delete result.importedCampaign; return result; }

test('an imported ME1 class or survivor never changes a prepared future kit, roster or battle permissions', () => {
  const original = createChronicle(context('ME3'), 'me3-equipment-workshop');
  const actor = buildChronicleActor(original, original.party[0]);
  const imported = importChronicleContinuity(original, fixtures[4]).session;
  assert.deepEqual(imported.party, original.party); assert.deepEqual(buildChronicleActor(imported, imported.party[0]), actor);
  const prepared = setChronicleBuild(imported, imported.party[0], 'vanguard'); assert.equal(prepared.ok, true);
  assert.equal(prepared.session.importedCampaign.save.state.classId, 'sentinel');
  assert.ok(buildChronicleActor(prepared.session, imported.party[0]).powers.includes('nova'));
  assert.deepEqual(original, createChronicle(context('ME3'), 'me3-equipment-workshop'));
});

test('all ME1 classes and companions retain their native actions after future import and actual battle start', () => {
  const banned = ['bioticCharge', 'nova', 'tacticalCloak', 'omniBlade', 'omniblade'];
  for (const classId of Object.keys(CLASSES)) {
    const state = newGame({ classId }), before = structuredClone(state);
    const actors = Object.keys(CREW).map(id => actorFor(id, state));
    const baseline = actors.map(actor => createBattle({ party: [actor], enemies: [{ id: 'target', name: 'Cible', hp: 500, attack: 1 }], seed: 99 }));
    const report = importChronicleContinuity(createChronicle(context('ME3'), 'me3-equipment-workshop'), fixtures[4]).session;
    assert.equal(startChronicleBattle(report).ok, true);
    for (const [index, source] of actors.entries()) {
      const battle = createBattle({ party: [actorFor(source.id, state)], enemies: [{ id: 'target', name: 'Cible', hp: 500, attack: 1 }], seed: 99 });
      assert.equal(JSON.stringify(battle), JSON.stringify(baseline[index]));
      assert.ok(!getActions(battle, source.id).some(action => banned.includes(action.id)));
      const snapshot = JSON.stringify(battle);
      for (const actionId of banned) assert.equal(performAction(battle, { actorId: source.id, actionId, targetId: 'target' }).ok, false);
      assert.equal(JSON.stringify(battle), snapshot);
    }
    assert.deepEqual(state, before);
  }
});

test('every available ME1 talent tree and every trainable rank keeps later signature powers outside ME1', () => {
  const banned = ['bioticCharge', 'nova', 'tacticalCloak', 'omniBlade', 'omniblade'];
  assert.ok(CAMPAIGN_TALENTS.every(talent => !banned.includes(talent.actionId)));
  for (const classId of Object.keys(CLASSES)) {
    // Native boundary fixture: all crew and ample points, never injected in a browser.
    const state = newGame({ classId }); state.recruited = Object.keys(CREW).filter(id => id !== 'shepard'); state.xp = 30000;
    for (const actorId of Object.keys(CREW)) {
      const choices = getTalentOptions(state, actorId);
      for (const talent of choices) for (let rank = 1; rank <= talent.maxRank; rank++) {
        assert.equal(trainTalent(state, actorId, talent.id).ok, true, `${classId}:${actorId}:${talent.id}:${rank}`);
        const actor = actorFor(actorId, state);
        assert.ok(!actor.powers.some(id => banned.includes(id)));
        const battle = createBattle({ party: [actor], enemies: [{ id: 'target', name: 'Cible', hp: 500, attack: 1 }], seed: 99 });
        assert.ok(!getActions(battle, actorId).some(action => banned.includes(action.id)));
      }
      const before = getTalentOptions(state, actorId);
      importChronicleContinuity(createChronicle(context('ME3')), fixtures[0]);
      assert.deepEqual(getTalentOptions(state, actorId), before);
    }
  }
});

test('consultation distinguishes imported survivor from future presence, escapes names and has useful empty states', () => {
  const record = structuredClone(fixtures[0]); record.save.state.name = '<Camille & Co>';
  const session = importChronicleContinuity(createChronicle(context('ME3')), record).session;
  const view = { context: session.context, session };
  const html = renderChronicleContinuity(view);
  assert.match(html, /&lt;Camille &amp; Co&gt;/); assert.doesNotMatch(html, /<Camille/);
  assert.match(html, /data-continuity-survivor="kaidan" data-future-presence="undetermined"/);
  assert.match(html, /confiance.*indéterminées/); assert.match(html, /aucun état de romance/);
  assert.match(renderChronicleContinuity({ context: context(), session: createChronicle(context()) }), /data-continuity-empty/);
  assert.doesNotMatch(renderChronicleContinuity({ context: context('MEA'), session }), /data-continuity-identity/);
  assert.equal(encodeCampaignExport(newGame()), null);
});

test('new ending reports export exact civilian methods and both Shiala fates, while old absent reports stay unknown', () => {
  for (const [choice, fate] of [['spare', 'spared'], ['kill', 'killed']]) {
    const state = campaign(0, choice), result = createCampaignExport(state); assert.equal(result.ok, true);
    const report = result.record.ferosReport;
    assert.deepEqual([report.spared, report.killed, report.gas, report.melee], [12, 4, 5, 7]); assert.equal(report.shiala, fate);
    assert.equal(report.survivors.length, 12); assert.equal(report.survivors.some(target => target.id === 'fai-dan'), false);
    const imported = importChronicleContinuity(createChronicle(context()), encodeCampaignExport(state)); assert.equal(imported.ok, true);
    assert.deepEqual(getImportedChronicleContinuity(imported.session).ferosReport, report);
    assert.match(renderChronicleContinuity({ context: imported.session.context, session: imported.session }), /data-continuity-feros-report/);
    assert.ok(decodeChronicle(encodeChronicle(imported.session)));
    const legacyEnvelope = structuredClone(result.record); delete legacyEnvelope.ferosReport;
    const unknown = importChronicleContinuity(createChronicle(context()), legacyEnvelope); assert.equal(unknown.ok, true);
    assert.equal(Object.hasOwn(unknown.session.importedCampaign, 'ferosReport'), false);
    assert.equal(getImportedChronicleContinuity(unknown.session).ferosReport, null);
    assert.match(renderChronicleContinuity({ context: unknown.session.context, session: unknown.session }), /data-continuity-feros-unknown/);
  }
  assert.equal(Object.hasOwn(fixtures[0], 'ferosReport'), false);
});

test('duplicated Feros detail must match the validated save exactly and rejects nested hostile data without mutation', () => {
  const good = createCampaignExport(campaign(0, 'spare')).record, session = importChronicleContinuity(createChronicle(context()), good).session;
  const before = structuredClone(session), invalid = [];
  for (const change of [report => { report.spared++; }, report => { report.shiala = 'killed'; }, report => { report.survivors[0].method = 'melee'; },
    report => { report.extra = true; }, report => { report.survivors.reverse(); }]) {
    const record = structuredClone(good); change(record.ferosReport); invalid.push(record);
  }
  const legacy = structuredClone(fixtures[0]); legacy.ferosReport = good.ferosReport; invalid.push(legacy);
  let reads = 0; const accessor = structuredClone(good);
  Object.defineProperty(accessor.ferosReport.survivors[0], 'name', { enumerable: true, get() { reads++; return 'Intrus'; } }); invalid.push(accessor);
  const symbolic = structuredClone(good); symbolic.ferosReport[Symbol('extra')] = true; invalid.push(symbolic);
  for (const record of invalid) { assert.equal(importChronicleContinuity(session, record).ok, false); assert.deepEqual(session, before); }
  assert.equal(reads, 0);
});
