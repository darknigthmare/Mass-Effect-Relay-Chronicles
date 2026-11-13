// Uses the shared Resolve evidence runner. No private state, DOM assignment,
// simulated clock, altered HP, invented reward or combat victory in the browser.
import assert from 'node:assert/strict';
import { runPublicProof } from './resolve-browser-proof.mjs';
import { newGame, recruit, zoneEncounters, winEncounter, completeZone, applyResolveVirmireInteraction, availableCrew } from '../src/state.js';
import { recordVisit } from '../src/story.js';
import { RESOLVE_VIRMIRE_POIS, virmireReport } from '../src/resolve-virmire.js';

const id = key => `resolve:virmire:${key}`;
const clone = value => structuredClone(value);
function arrive(state, zone) { state.zone = zone; state.position = null; assert.equal(recordVisit(state, zone), true); }
function nativeChapter(state, zone, choice = null) {
  arrive(state, zone);
  if (zone === 'citadel') assert.equal(recruit(state, 'tali'), true);
  for (const encounter of zoneEncounters(zone)) assert.equal(winEncounter(state, encounter), true);
  assert.equal(completeZone(state, zone, choice), true);
}
function beforeVirmire() {
  const state = newGame({ name: 'QA Resolve Virmire', difficulty: 'story' }); state.flags.briefed = true;
  nativeChapter(state, 'eden-prime'); nativeChapter(state, 'citadel'); nativeChapter(state, 'therum'); nativeChapter(state, 'noveria', 'release');
  arrive(state, 'virmire'); state.position = { x: 19, z: 34 }; return state;
}
function nativeAct(state, key, selected) {
  const point = RESOLVE_VIRMIRE_POIS[key]; state.position = { x: point.x, z: point.z };
  const result = applyResolveVirmireInteraction(state, id(key), selected); assert.equal(result.ok, true, result.reason);
}
function secondCrisis() {
  const state = beforeVirmire(); nativeAct(state, 'briefing', 'send-kaidan'); assert.equal(winEncounter(state, 'virmire:encounter-1'), true);
  nativeAct(state, 'satellite', 'destroy'); assert.equal(winEncounter(state, 'virmire:encounter-2'), true);
  nativeAct(state, 'rana', 'kill'); nativeAct(state, 'beacon', 'activate'); nativeAct(state, 'sovereign', 'confront');
  state.position = { x: -11, z: -69 }; return state;
}
const origin = (kind, APIs) => ({ kind, APIs, precedingCampaignPlayed: false, combatPreparedNatively: true,
  limit: 'Only subsequent visible public actions are browser-earned; native fixtures prepare all listed chapters, encounters and starting positions.' });

await runPublicProof({ family: 'virmire', collector: import.meta.url,
  scope: 'ME1 Kirrahe briefing and assigned squad absence, three separate STG interventions, Rana fate, beacon then Sovereign, both permanent rescue outcomes and two real public Saren battles.',
  sourcePaths: ['docs/research/resolve-virmire-sources.json'],
  limitations: ['Prior chapters and Virmire encounter-1/encounter-2 are native fixtures; only later visible actions and both Saren battles are played in the browser.',
    'Kirrahe survival remains unknown because the consulted Prima guide conflicts with the commonly cited flyer rule. Wrex persuasion and the original cinematic geography remain incomplete.',
    'French dialogue is a condensed adaptation. No voice transcript, original full scene, new visual asset or later Rana consequence is claimed.'],
  run: async api => {
  const { page, ready, capture, check, fixture, imported, exported, walkToPOI, report } = api;
  const dialog = () => page.locator('#overlay .dialogue');
  const button = selection => dialog().locator(`[data-reply-id="${selection}"]`);
  async function open(pointId) {
    await ready(); await walkToPOI(pointId);
    if (!await dialog().isVisible()) await page.keyboard.press('KeyE');
    await dialog().waitFor({ state: 'visible' });
  }
  async function choose(selection) {
    await button(selection).click();
    await dialog().locator('[data-do="dialogue-choice"]').first().click(); await ready();
  }
  async function interaction(key, selection) { await open(id(key)); await choose(selection); }
  async function returnToNormandyFromReport() {
    await dialog().locator('[data-do="dialogue-choice"]').first().click(); await ready();
  }
  async function publicSarenFight() {
    await ready(); await walkToPOI('virmire:boss'); await page.keyboard.press('KeyE');
    await page.locator('#battle-ui .battle-shell').waitFor({ state: 'visible' });
    const victory = page.locator('[data-do="claim-victory"]'), combat = page.locator('#battle-ui'), battlefield = combat.locator('.battle-shell');
    const deadline = Date.now() + 240000;
    const commands = { shots: 0, overloads: 0, warps: 0, bursts: 0, coolingOrders: 0, advances: 0,
      source: 'Actual scoped public actor/action/target clicks; existing powers, cooldowns and heat only.' };
    (report.virmirePublicBattles ||= []).push(commands);
    async function combatClick(locator) {
      if (await victory.isVisible()) return false;
      try { await locator.click({ timeout: 900 }); return true; }
      catch (error) { if (await victory.isVisible() || await battlefield.isVisible()) return false; throw error; }
    }
    async function combatEnabled(locator) {
      if (await victory.isVisible() || !await locator.count()) return false;
      try { return await locator.isEnabled({ timeout: 250 }); }
      catch (error) { if (await victory.isVisible() || await battlefield.isVisible()) return false; throw error; }
    }
    while (!await victory.isVisible()) {
      assert.equal(await page.locator('[data-do="retry"]').isVisible(), false, 'The public Saren fight must be won without a concealed retry');
      assert.ok(Date.now() < deadline, 'The public Saren fight must complete under its real-time deadline');
      if (!await battlefield.isVisible()) {
        if (await victory.isVisible()) break;
        assert.fail('Combat remains visible until an explicit victory claim');
      }
      const actors = await combat.locator('[data-do="battle-actor"]').evaluateAll(nodes => nodes.map(node => node.dataset.id));
      for (const actorId of actors) {
        if (await victory.isVisible()) break;
        if (!await combatClick(combat.locator(`[data-do="battle-actor"][data-id="${actorId}"]`))) continue;
        if (await victory.isVisible()) break;
        const advance = combat.locator('[data-do="battle-action"][data-id="advance"]:not([disabled])');
        const cover = combat.locator('[data-do="battle-action"][data-id="cover"]:not([disabled])');
        let issued = false, hadTargetingAction = false;
        for (const actionId of ['overload', 'warp', 'burst', 'shoot']) {
          const action = combat.locator(`[data-do="battle-action"][data-id="${actionId}"]`);
          if (!await combatEnabled(action)) continue;
          hadTargetingAction = true;
          if (!await combatClick(action)) continue;
          const target = combat.locator('[data-do="battle-target"]:not([disabled])').first();
          if (await target.isVisible() && await combatClick(target)) {
            commands[{ overload: 'overloads', warp: 'warps', burst: 'bursts', shoot: 'shots' }[actionId]]++;
            issued = true; break;
          }
        }
        if (!issued && hadTargetingAction && await combatEnabled(advance)) { if (await combatClick(advance)) commands.advances++; }
        else if (!issued && await combatEnabled(cover)) { if (await combatClick(cover)) commands.coolingOrders++; }
      }
      await page.waitForTimeout(120);
    }
    check('Saren encounter won through scoped public ATB powers and attacks with visible cooling/advance orders', true,
      { ...commands, combatPreparedNatively: false, genericKeyboardConfirmation: false });
    await victory.click(); await ready();
  }
  async function chapterCompletion(label) {
    await publicSarenFight();
    await open('virmire:objective'); await capture(`${label}-permanent-loss`);
    const text = await dialog().innerText(); assert.match(text, /Ashley/); assert.match(text, /Kaidan/);
    await returnToNormandyFromReport();
    const actual = await exported(`${label}-completed`); return actual.state;
  }

  await imported(await fixture(beforeVirmire(), 'before-kirrahe', origin('Native prior ME1 chapters and Virmire landing, before all Resolve Virmire actions', ['newGame(story)', 'briefed=true', 'recordVisit', 'recruit(tali)', 'winEncounter prior zones', 'completeZone Eden/Citadel/Therum/Noveria'])));
  await open(id('briefing')); await capture('kirrahe-briefing'); await choose('send-ashley');
  // Export only after the full three-support public sequence, keeping four
  // useful exports for this scenario. The current checkpoint is the runner's
  // actual saved state, obtained through its public export helper below.
  // A declared second fixture reproduces the chosen briefing through the same
  // native transaction before preparing the first ATB defense.
  const approach = beforeVirmire(); nativeAct(approach, 'briefing', 'send-ashley');
  assert.equal(winEncounter(approach, 'virmire:encounter-1'), true); approach.position = { x: -4, z: 2 };
  await imported(await fixture(approach, 'stg-approach', origin('Native reproduction of observed Ashley assignment, first Virmire ATB victory and communications starting position', ['applyResolveVirmireInteraction(briefing,send-ashley)', 'winEncounter(virmire:encounter-1)', 'position near communications'])));
  await interaction('communications', 'disrupt'); await interaction('satellite', 'destroy'); await interaction('flyers', 'destroy'); await interaction('alarms', 'disable');
  await page.keyboard.press('KeyJ'); await page.locator('#overlay .screen').waitFor();
  const stgJournal = page.locator('[data-resolve-id="virmire"]'); await stgJournal.scrollIntoViewIfNeeded();
  await capture('stg-three-objectives-journal', stgJournal); await page.keyboard.press('Escape'); await ready();
  const stg = await exported('three-stg-objectives');
  assert.deepEqual(virmireReport(stg.state).support, { communications: true, satellite: true, flyers: true });
  assert.equal(stg.state.party.includes('ashley'), false); assert.equal(stg.state.lost.includes('ashley'), false);
  check('Three visible STG interventions persist independently; Ashley remains recruited and alive while absent on assignment', true, virmireReport(stg.state));

  const lab = clone(stg.state); assert.equal(winEncounter(lab, 'virmire:encounter-2'), true); lab.position = { x: 27, z: -45 };
  await imported(await fixture(lab, 'laboratory-before-rana', origin('Actual public STG export plus native installation ATB victory and laboratory starting position', ['public three-stg-objectives export', 'winEncounter(virmire:encounter-2)', 'position near Rana'])));
  await open(id('rana')); await capture('rana-laboratory'); await choose('release');
  await interaction('beacon', 'activate'); await interaction('sovereign', 'confront');
  await page.keyboard.press('Escape'); await page.locator('[data-do="codex"]').click(); await page.locator('#codex-search').fill('Sovereign');
  await page.locator('[data-do="codex-entry"][data-id="sovereign"]').click(); await capture('sovereign-revelation-codex'); await page.keyboard.press('Escape'); await ready();
  const revelation = await exported('rana-and-sovereign'); assert.equal(virmireReport(revelation.state).rana, 'released'); assert.equal(virmireReport(revelation.state).sovereign, true);
  check('Rana departure, second beacon and Sovereign revelation are performed through real public choices and retained together', true, virmireReport(revelation.state));

  await interaction('bomb', 'acknowledge'); await open(id('rescue'));
  assert.match(await button('save-ashley').innerText(), /tour antiaérienne/); assert.match(await button('save-kaidan').innerText(), /site de la bombe/);
  await choose('save-ashley');
  const ashley = await chapterCompletion('ashley');
  assert.equal(ashley.lost.includes('kaidan'), true); assert.equal(ashley.party.includes('kaidan'), false); assert.equal(availableCrew(ashley).includes('ashley'), true);
  check('Ashley extraction permanently removes Kaidan and restores only the surviving human crewmate after a real public Saren victory', true, virmireReport(ashley));

  await imported(await fixture(secondCrisis(), 'kaidan-stg-crisis', origin('Separate native Kaidan STG assignment and laboratory route; Rana execution and satellite-only aid explicitly prepared', ['newGame + prior chapters', 'applyResolveVirmireInteraction(briefing,send-kaidan)', 'winEncounter encounter-1/encounter-2', 'applyResolveVirmireInteraction satellite/Rana kill/beacon/Sovereign', 'position near bomb'])));
  await interaction('bomb', 'acknowledge'); await open(id('rescue'));
  assert.match(await button('save-kaidan').innerText(), /tour antiaérienne/); assert.match(await button('save-ashley').innerText(), /site de la bombe/);
  await choose('save-kaidan');
  const kaidan = await chapterCompletion('kaidan');
  assert.equal(kaidan.lost.includes('ashley'), true); assert.equal(kaidan.party.includes('ashley'), false); assert.equal(availableCrew(kaidan).includes('kaidan'), true);
  assert.equal(virmireReport(kaidan).support.communications, false); assert.equal(virmireReport(kaidan).rana, 'killed');
  check('Kaidan assignment inverts both named rescue positions, and the completed branch permanently removes Ashley without inventing Kirrahe survival', true, virmireReport(kaidan));
} });
