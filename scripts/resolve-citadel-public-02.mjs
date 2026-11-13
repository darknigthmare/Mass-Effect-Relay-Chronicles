// DEV01 preserved: the journal proof was read below the captured viewport.
// Variant 02 scrolls the proof into view and uses combat-only click targets.
// Repeated Space could confirm a newly opened victory/dialogue menu in DEV01.
// The shared collector and the functional public scenario stay unchanged.
// Fixtures declare prior chapters and positions. No QA harness, private game
// state, HP, timer, DOM, canvas or CSS is changed by this scenario.
import assert from 'node:assert/strict';
import { runPublicProof } from './resolve-browser-proof.mjs';
import { newGame, travelCampaign, zoneEncounters, winEncounter, completeZone, recruit,
  applyResolveCitadel } from '../src/state.js';

function initialEden() {
  const state = newGame({ name: 'QA Enquête Citadelle', difficulty: 'story', mode: 'active' });
  state.flags.briefed = true;
  assert.ok(travelCampaign(state, 'eden-prime').ok);
  for (const id of zoneEncounters('eden-prime')) assert.ok(winEncounter(state,id));
  assert.ok(completeZone(state,'eden-prime'));
  return state;
}
function initialCitadel() {
  const state=initialEden(); assert.ok(travelCampaign(state,'citadel').ok);
  state.position = { x:0,z:-12 };
  return state;
}

await runPublicProof({ family: 'citadel', collector: import.meta.url, run: async api => {
  const { page, report, click, ready, capture, check, fixture, imported, exported, walkToPOI } = api;
  report.provenance={ priorAttempt:'docs/qa/resolve-citadel-dev-01-report.json',
    priorCollector:'scripts/resolve-citadel-public.mjs',
    corrections:['Scroll the real journal evidence block into the captured viewport.',
      'Use combat actor/action/target clicks instead of repeated Space, which also confirms menus after victory.'],
    priorFailureObservation:'The actual failure screenshot shows exploration with no battle or overlay; the Space loop passed through victory/dialogue menus before its next visibility sample.' };
  report.publicBattleCommands=[];
  const reply = async id => click(`.dialogue [data-reply-id="${id}"]`);
  const dialog = id => page.locator(`.dialogue[data-conversation-id="resolve-citadel"][data-current-topic="${id}"]`);
  async function leaveResult() {
    await page.locator('.dialogue[data-conversation-id="resolve-result"]').waitFor();
    await reply('leave'); await ready();
  }
  async function approach(id) { await ready(); await walkToPOI(id); await page.keyboard.press('KeyE'); }
  async function fight(label, photograph = false) {
    await reply('battle'); await page.locator('#battle-ui .battle-shell').waitFor();
    if (photograph) await capture(label);
    const victory=page.locator('[data-do="claim-victory"]'), battlefield=page.locator('#battle-ui .battle-shell');
    const deadline=Date.now()+240_000;
    let shots=0,covers=0,advances=0;
    const combatClick=async locator=>{
      try { await locator.click({timeout:900}); return true; }
      catch(error) {
        if(await victory.isVisible())return false;
        if(await battlefield.isVisible())return false; // Availability can change during active ATB.
        throw error;
      }
    };
    const enabled=async locator=>{
      if(await victory.isVisible())return false;
      try { return await locator.isEnabled({timeout:250}); }
      catch(error) {
        if(await victory.isVisible()||await battlefield.isVisible())return false;
        throw error;
      }
    };
    while (!await victory.isVisible()) {
      assert.ok(Date.now()<deadline,`Public ATB timed out: ${label}`);
      assert.equal(await page.locator('[data-do="retry"]').isVisible(),false,`Public battle lost: ${label}`);
      if(!await battlefield.isVisible()) {
        if(await victory.isVisible())break;
        assert.fail(`Combat must remain visible until an explicit victory claim: ${label}`);
      }
      // Actor/action/target selectors cannot activate a narrative response.
      // Every gauge, cooldown, enemy turn and heat value advances in real time.
      const actors=await page.locator('[data-do="battle-actor"]').evaluateAll(nodes=>nodes.map(node=>node.dataset.id));
      for(const actorId of actors) {
        if(await victory.isVisible())break;
        if(!await combatClick(page.locator(`[data-do="battle-actor"][data-id="${actorId}"]`)))continue;
        const shoot=page.locator('[data-do="battle-action"][data-id="shoot"]');
        if(await enabled(shoot)) {
          if(!await combatClick(shoot))continue;
          const target=page.locator('[data-do="battle-target"]:not(:disabled)').first();
          if(await target.count()&&await combatClick(target))shots++;
          else {
            const advance=page.locator('[data-do="battle-action"][data-id="advance"]');
            if(await enabled(advance)&&await combatClick(advance))advances++;
          }
        } else {
          const cover=page.locator('[data-do="battle-action"][data-id="cover"]');
          if(await enabled(cover)&&await combatClick(cover))covers++;
        }
      }
      await page.waitForTimeout(120);
    }
    const actionCount=await page.locator('.ending-stat').last().innerText();
    assert.match(actionCount,/ACTIONS EXÉCUTÉES/);
    report.publicBattleCommands.push({label,shots,covers,advances,source:'Public actor/action/target buttons; no menu confirmation key, private state, clock or HP mutation.'});
    await click('[data-do="claim-victory"]');
  }

  const start=initialCitadel(), origin={ kind:'Declared native Eden Prime completion and Citadel arrival',
    APIs:['newGame(story,active)','briefed=true','travelCampaign(eden-prime)','winEncounter ×3','completeZone(eden-prime)','travelCampaign(citadel)'],
    precedingCampaignPlayed:false,changedFields:['position'] };
  await imported(await fixture(start,'investigation-start',origin));
  await approach('resolve-citadel:hearing'); await dialog('hearing').waitFor();
  await capture('first-report-no-promotion'); await reply('report'); await leaveResult();
  await approach('citadel:talk-harkin'); await reply('resolve-report'); await dialog('harkin').waitFor(); await reply('lead'); await leaveResult();
  await approach('resolve-citadel:clinic'); await dialog('clinic').waitFor();
  await fight('clinic-real-atb',true);
  await dialog('michel').waitFor(); await reply('testimony'); await leaveResult();
  await approach('resolve-citadel:fist'); await dialog('fist').waitFor(); await fight('fist-real-atb');
  await dialog('fist').waitFor(); assert.equal(await dialog('fist').locator('[data-reply-id="wrex"]').count(),0);
  await reply('spare'); await leaveResult();
  await approach('resolve-citadel:tali-rescue'); await dialog('tali-rescue').waitFor(); await fight('tali-ambush-real-atb');
  await dialog('tali-proof').waitFor(); await reply('receive'); await leaveResult();
  await page.keyboard.press('KeyJ'); await page.locator('[data-resolve-id="citadel"]').waitFor();
  const journal=await page.locator('[data-resolve-id="citadel"]').innerText();
  assert.match(journal,/Enregistrement|enregistrement/); assert.match(journal,/Épargné/);
  await page.locator('[data-resolve-id="citadel"]').scrollIntoViewIfNeeded();
  await capture('tali-evidence-journal'); await page.keyboard.press('Escape'); await ready();
  const saved=await exported('tali-proof-and-spared-fist');
  assert.ok(saved.state.recruited.includes('tali')); assert.equal(saved.state.resolveCitadel.proof,true);
  assert.deepEqual(saved.state.resolveCitadel.battles,{clinic:true,fist:true,ambush:true}); assert.equal(saved.state.resolveCitadel.fist,'spared');
  assert.equal(saved.state.flags.spectre,undefined); assert.equal(saved.state.xp,start.xp+195); assert.equal(saved.state.credits,start.credits+255);
  await check('Three real public ATB victories precede Tali recruitment and the journal proof; the first report never promotes Shepard',true,{battles:saved.state.resolveCitadel.battles,xp:saved.state.xp,credits:saved.state.credits});

  const wrex=initialCitadel(); assert.ok(applyResolveCitadel(wrex,'hearing','report').ok);
  assert.ok(applyResolveCitadel(wrex,'barla-von','lead').ok); assert.ok(recruit(wrex,'wrex'));
  wrex.party=['shepard','kaidan','wrex']; wrex.position={x:8,z:7};
  await imported(await fixture(wrex,'wrex-deployed',{kind:'Declared Barla/Wrex route and active field group fixture',
    APIs:['native Eden completion as above','applyResolveCitadel(hearing,report)','applyResolveCitadel(barla-von,lead)','recruit(wrex)'],
    changedFields:['party','position'],precedingCampaignPlayed:false,recruitmentPlayed:false}));
  await approach('resolve-citadel:fist'); await fight('fist-wrex-real-atb'); await dialog('fist').waitFor();
  assert.equal(await dialog('fist').locator('[data-reply-id="spare"]').count(),0); assert.equal(await dialog('fist').locator('[data-reply-id="kill"]').count(),0);
  await capture('wrex-contract-after-aveu'); await reply('wrex'); await leaveResult();
  const wrexSave=await exported('fist-killed-by-deployed-wrex');
  assert.equal(wrexSave.state.resolveCitadel.fist,'wrex'); assert.equal(wrexSave.state.resolveCitadel.fistWrex,true);
  await page.reload({waitUntil:'domcontentloaded'}); await click('[data-do="continue"]'); await ready();
  await approach('resolve-citadel:fist'); await dialog('fist').waitFor();
  assert.match(await dialog('fist').innerText(),/mort.*Wrex/); await reply('leave');
  await check('Wrex in the real deployed group executes his contract after the clue; the persisted outcome has no stale spare option',true);

  const prologue=newGame({name:'QA Nihlus',difficulty:'story',mode:'active'}); prologue.flags.briefed=true;
  prologue.position={x:3.8,z:-8.5};
  await imported(await fixture(prologue,'nihlus-after-briefing',{kind:'Declared confirmed mission briefing before first landing',APIs:['newGame','briefed=true'],changedFields:['position'],briefingPlayed:false}));
  await approach('normandy:talk-nihlus'); await reply('resolve-report'); await dialog('nihlus').waitFor();
  assert.equal(await dialog('nihlus').locator('[data-reply-id="evaluation"]').count(),0);
  await reply('colony'); await leaveResult(); await approach('normandy:talk-nihlus'); await reply('resolve-report');
  await capture('nihlus-evaluation-after-briefing'); await reply('evaluation'); await leaveResult();
  const nihlus=await exported('nihlus-candidacy'); assert.equal(nihlus.state.resolveCitadel.nihlus,2); assert.equal(nihlus.state.flags.spectre,undefined);
  await check('Nihlus starts with Eden Prime then explains a candidacy after briefing without granting Spectre status',true);

  const returning=initialEden(); assert.ok(travelCampaign(returning,'normandy').ok); returning.position={x:0,z:-12.8};
  await imported(await fixture(returning,'joker-prologue-return',{kind:'Declared native Eden completion and direct Normandy return before any Citadel visit',APIs:origin.APIs.filter(api=>api!=='travelCampaign(citadel)').concat('travelCampaign(normandy)'),changedFields:['position'],precedingCampaignPlayed:false}));
  await approach('normandy:talk-joker'); await reply('resolve-report'); await dialog('joker').waitFor(); await capture('joker-return-before-ordinary');
  await reply('report'); await leaveResult();
  const joker=await exported('joker-return-reported'); assert.equal(joker.state.resolveCitadel.jokerReported,true);
  assert.ok(joker.state.story.heard.includes('joker:eden-prime-report'));
  await page.reload({waitUntil:'domcontentloaded'}); await click('[data-do="continue"]'); await ready();
  await approach('normandy:talk-joker');
  assert.equal(await page.locator('.dialogue[data-conversation-id="joker"] [data-topic-id="eden-prime-report"]').count(),0);
  assert.equal(await page.locator('.dialogue[data-conversation-id="joker"] [data-topic-id="pilotage"]').count(),1);
  await check('Joker return report is persisted before the ordinary pilotage topic and does not reappear after a real reload',true);
} });
