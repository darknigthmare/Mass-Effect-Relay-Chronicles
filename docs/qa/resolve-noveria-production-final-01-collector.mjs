// Scenario only: launcher, browser lifetime, source/dist hashes, network evidence,
// captures and export provenance are owned by resolve-browser-proof.mjs.
import assert from 'node:assert/strict';
import { runPublicProof } from './resolve-browser-proof.mjs';
import { newGame, zoneEncounters, winEncounter, completeZone, recruit } from '../src/state.js';
import { recordVisit } from '../src/story.js';
import { advanceMission } from '../src/mission-progress.js';
import { listResolveNoveriaPOIs, transitionResolveNoveria, noveriaResolutionReport } from '../src/resolve-noveria.js';

const id = key => `resolve:noveria:${key}`;
const dialog = key => `.dialogue[data-conversation-id="resolve-noveria"]${key ? `[data-current-topic="${id(key)}"]` : ''}`;
const replySelector = (key, selected) => `${dialog(key)} [data-reply-id="${selected}"]`;
const budget = state => ({ xp: state.xp, credits: state.credits, medigel: state.medigel,
  paragon: state.paragon, renegade: state.renegade, inventory: state.inventory });

function portFixture() {
  const state = newGame({ name: 'QA Resolve Novéria', difficulty: 'story' });
  state.flags.briefed = true; state.settings.reducedMotion = true;
  state.zone = 'eden-prime'; recordVisit(state, state.zone);
  for (const encounter of zoneEncounters(state.zone)) assert.equal(winEncounter(state, encounter), true);
  assert.equal(completeZone(state, 'eden-prime'), true);
  state.zone = 'citadel'; recordVisit(state, state.zone);
  assert.equal(recruit(state, 'tali'), true); assert.equal(completeZone(state, 'citadel'), true);
  state.zone = 'noveria'; recordVisit(state, state.zone);
  state.paragon = 20; state.renegade = 20; state.position = { x: 13, z: 60 };
  return state;
}

function nativeAct(state, key, selected) {
  const poi = listResolveNoveriaPOIs(state).find(poi => poi.id === id(key)); assert.ok(poi, key);
  state.position = { x: poi.x, z: poi.z };
  const result = transitionResolveNoveria(state, poi.id, selected); assert.equal(result.ok, true, result.reason);
  if (result.progress) state.resolveNoveria = result.progress;
}
function nativeEvidence(state) {
  nativeAct(state, 'anoleis', 'request'); nativeAct(state, 'lorik', 'accept'); nativeAct(state, 'evidence', 'retrieve');
  return state;
}
function nativeRepairs(state, steps) {
  assert.equal(advanceMission(state, 'noveria', 'start').ok, true);
  for (const step of steps) assert.equal(advanceMission(state, `mission:noveria:${step}`, 'repair').ok, true);
}

await runPublicProof({ family: 'noveria', collector: import.meta.url,
  scope: 'Five public Port Hanshan pass routes, proof/testimony/arrest and lethal betrayal; repair-conditioned MIRA assistance and both queen decisions.',
  limitations: [
    'Earlier campaign chapters, independent branch preparation and Noveria combat victories are declared native fixtures; no combat completion is claimed played here.',
    'Synthetic Insights retrieval is a condensed terminal interaction without the original ERCS/Kaira battles or complete hotel/office geography.',
    'Lorik persuasion visibly uses adapted morality thresholds; the original ME1 Charm/Intimidate talents remain absent.',
    'The Opold fast route is exercised; the complete contraband assignment, Inamorda outcomes and variable gains are not implemented by this lot.',
    'The queen conversations and decisions are played publicly. Quarantine, hot laboratories, full original cinematics and later Mass Effect campaigns remain outside this proof.',
  ], run: async api => {
  const { page, report, click, action: actionLocator, ready, capture, check, fixture, imported, exported, walkToPOI } = api;
  const action = name => click(actionLocator(name));
  async function approach(key) {
    await walkToPOI(id(key)); await action('interact'); await page.locator(dialog(key)).waitFor();
  }
  async function reply(key, selected) { await click(replySelector(key, selected)); }
  async function field() {
    const selectors = [
      `${dialog()} [data-reply-id="leave"]`,
      '.dialogue .choice:has-text("Retour sur le terrain.")',
      '.dialogue .choice:has-text("Revenir sur le terrain.")',
      '.dialogue .choice:has-text("Retourner au Normandy.")',
    ];
    for (const selector of selectors) if (await page.locator(selector).first().isVisible()) {
      await click(selector); await ready(); return;
    }
    await ready();
  }
  async function journalContains(pattern) {
    await ready(); await action('journal');
    const report = page.locator('[data-noveria-report="current"]'); await report.waitFor();
    assert.match(await report.innerText(), pattern);
    await action('close'); await ready();
  }
  async function contactsAbsent() {
    await action('map'); await click('[data-do="map-filter"][data-id="all"]');
    for (const key of ['parasini', 'anoleis'])
      assert.equal(await page.locator(`[data-map-position="${id(key)}"]`).count(), 0, key);
    await action('close'); await ready();
  }
  async function reload() {
    await page.reload({ waitUntil: 'domcontentloaded' }); await action('continue'); await ready();
  }

  // Each fixture is a declared native preparation, never a browser state edit.
  const start = portFixture();
  const startOrigin = { kind: 'Native preceding Eden Prime and Citadel, not played in this browser',
    APIs: ['newGame', 'recordVisit', 'winEncounter', 'recruit(tali)', 'completeZone(eden-prime,citadel)'],
    adaptedPersuasion: '20 morality points deliberately prepared; original ME1 persuasion ranks are absent',
    earlierCampaignPlayed: false };
  await imported(await fixture(start, 'port-start', startOrigin));
  await approach('anoleis');
  assert.equal(await page.locator(replySelector('anoleis', 'give-evidence')).count(), 0);
  assert.equal(await page.locator(replySelector('anoleis', 'report-package')).count(), 0);
  await capture('port-conditions'); await reply('anoleis', 'request'); await field();
  await approach('lorik'); await reply('lorik', 'accept'); await field();
  await approach('evidence'); await reply('evidence', 'retrieve'); await field();
  await approach('parasini'); assert.match(await page.locator(`${dialog('parasini')} .dialogue-text`).innerText(), /Affaires internes/);
  await reply('parasini', 'investigate');
  await field();
  await approach('parasini');
  assert.equal(await page.locator(replySelector('parasini', 'report-testimony')).isDisabled(), true);
  await field();
  await approach('lorik'); await reply('lorik', 'charm'); await field();
  await approach('parasini'); await reply('parasini', 'report-testimony');
  await capture('gianna-arrest'); await field(); await contactsAbsent();
  const arrested = await exported('gianna-arrested');
  assert.equal(arrested.state.resolveNoveria.pass, 'gianna');
  assert.equal(arrested.state.resolveNoveria.evidence, 'gianna');
  assert.equal(arrested.state.resolveNoveria.anoleis, 'arrested');
  assert.deepEqual(budget(arrested.state), budget(start));
  await reload(); await journalContains(/Anoleis est arrêté/);
  await check('Actual public Lorik proof retrieval, Gianna revelation, testimony and arrest persist without dialogue rewards', true,
    { export: arrested.path, report: noveriaResolutionReport(arrested.state) });

  // Independent proof-held fixtures make the alternative handoffs explicit.
  for (const [recipient, expected] of [['lorik', /Laissez-passer remis par Lorik/], ['anoleis', /Laissez-passer remis par Anoleis/]]) {
    const alternative = nativeEvidence(portFixture());
    await imported(await fixture(alternative, `evidence-to-${recipient}`, {
      kind: 'Independent native preceding port contract and evidence retrieval; handoff played publicly',
      APIs: ['transitionResolveNoveria(anoleis,request)', 'transitionResolveNoveria(lorik,accept)', 'transitionResolveNoveria(evidence,retrieve)'],
      precedingPortPlayedInThisBranch: false,
    }));
    await approach(recipient); await reply(recipient, 'give-evidence'); await field(); await journalContains(expected);
  }
  await check('Both direct evidence handoffs remain publicly reachable and the journal identifies the actual recipient', true);

  await imported(await fixture(portFixture(), 'opold-independent-start', startOrigin));
  await approach('opold'); await reply('opold', 'refuse'); await ready();
  await approach('opold'); await reply('opold', 'accept'); await field();
  await approach('package'); await reply('package', 'take'); await field();
  await approach('anoleis'); await reply('anoleis', 'report-package'); await field();
  await journalContains(/dénonçant le paquet d’Opold/);
  await check('Opold refusal can be reconsidered and only an actual retrieved package enables the fast pass route', true);

  const betrayal = nativeEvidence(portFixture());
  nativeAct(betrayal, 'parasini', 'investigate'); nativeAct(betrayal, 'lorik', 'intimidate');
  await imported(await fixture(betrayal, 'betrayal-before-denunciation', {
    kind: 'Independent native evidence and intimidated testimony preparation; denunciation and corpse retrieval played publicly',
    APIs: ['transitionResolveNoveria(request,accept,retrieve,investigate,intimidate)'], precedingPortPlayedInThisBranch: false,
  }));
  await approach('anoleis'); await reply('anoleis', 'expose-gianna'); await field();
  await contactsAbsent(); await approach('corpse');
  assert.match(await page.locator(`${dialog('corpse')} .dialogue-text`).innerText(), /entretués/);
  await capture('anoleis-corpse'); await reply('corpse', 'take-pass'); await field();
  const corpse = await exported('anoleis-corpse-pass');
  assert.equal(corpse.state.resolveNoveria.pass, 'anoleis-corpse');
  assert.equal(corpse.state.resolveNoveria.gianna, 'dead'); assert.equal(corpse.state.resolveNoveria.anoleis, 'dead');
  assert.deepEqual(budget(corpse.state), budget(betrayal));
  await reload(); await journalContains(/Gianna et Anoleis se sont entretués/);
  await check('Public denunciation kills both contacts; their markers disappear and the corpse pass survives actual export/reload', true,
    { export: corpse.path });

  const memoryOnly = structuredClone(arrested.state);
  assert.equal(winEncounter(memoryOnly, 'noveria:encounter-1'), true);
  nativeRepairs(memoryOnly, ['memory']); memoryOnly.position = { x: 6, z: -8 };
  await imported(await fixture(memoryOnly, 'mira-memory-only', {
    kind: 'Native garage victory and memory activation from actual public arrest export; reactor and uplink repaired publicly',
    parentExport: arrested.path, parentSHA256: arrested.sha256,
    APIs: ['winEncounter(noveria:encounter-1)', 'advanceMission(noveria,start)', 'advanceMission(memory,repair)'],
    battlePlayed: false, initialMemoryRepairPlayed: false,
  }));
  await approach('mira'); assert.equal(await page.locator(replySelector('mira', 'tram')).isDisabled(), true);
  await capture('mira-repair-conditions'); await field();
  for (const step of ['power', 'uplink']) {
    await walkToPOI(`mission:noveria:${step}`); await action('interact');
    await click('.dialogue[data-mission-id="noveria"] [data-mission-choice="repair"]'); await ready();
  }
  await approach('mira'); assert.equal(await page.locator(replySelector('mira', 'tram')).isDisabled(), false);
  await reply('mira', 'tram'); assert.match(await page.locator(`${dialog('mira')} .dialogue-text`).innerText(), /disponible/); await field();
  await check('MIRA tram assistance is disabled with memory alone and enabled after actual public reactor and uplink repairs', true,
    { limitation: 'This repair check is observed through public dialogue; the later queen fixture declares its own native repairs.' });

  const postBoss = structuredClone(arrested.state);
  assert.equal(winEncounter(postBoss, 'noveria:encounter-1'), true);
  nativeRepairs(postBoss, ['memory', 'power', 'uplink']);
  for (const encounter of ['noveria:encounter-2', 'noveria:boss']) assert.equal(winEncounter(postBoss, encounter), true);
  postBoss.position = { x: -2, z: -85 };
  const queenFixture = await fixture(postBoss, 'queen-post-benezia', {
    kind: 'Native three Noveria victories and complete MIRA repairs from actual public arrest export; queen dialogue played publicly',
    parentExport: arrested.path, parentSHA256: arrested.sha256,
    APIs: ['winEncounter(noveria:encounter-1,encounter-2,boss)', 'advanceMission(start,memory,power,uplink)'],
    battlesPlayed: false, theseRepairsPlayed: false,
  });
  await imported(queenFixture); await approach('queen');
  await reply('queen', 'children'); assert.match(await page.locator(`${dialog('queen')} .dialogue-text`).innerText(), /sans mon chant/);
  await reply('queen', 'back'); await reply('queen', 'future');
  assert.match(await page.locator(`${dialog('queen')} .dialogue-text`).innerText(), /paix/);
  await capture('queen-future'); await reply('queen', 'back'); await reply('queen', 'decision'); await reply('queen', 'release'); await field();
  const released = await exported('queen-released');
  assert.equal(released.state.choices.noveria, 'release'); assert.deepEqual(released.state.resolveNoveria, arrested.state.resolveNoveria);
  await reload(); await action('journal');
  await page.locator('[data-noveria-report="current"]').scrollIntoViewIfNeeded();
  assert.match(await page.locator('[data-noveria-report="current"]').innerText(), /reine rachni a été libérée/);
  await capture('queen-released-journal'); await action('close'); await ready();
  await imported(queenFixture); await approach('queen'); await reply('queen', 'decision'); await reply('queen', 'destroy'); await field();
  const destroyed = await exported('queen-destroyed');
  assert.equal(destroyed.state.choices.noveria, 'destroy'); assert.deepEqual(destroyed.state.resolveNoveria, arrested.state.resolveNoveria);
  await reload(); await journalContains(/reine rachni a été détruite/);
  await check('Both real queen choices survive export/reload and preserve the same actual Port Hanshan investigation', true,
    { exports: [released.path, destroyed.path], limitation: 'No later Mass Effect campaign or hot-lab reconstruction is claimed.' });
  assert.equal(report.captures.length, 6); assert.equal(report.exports.length, 4);
} });
