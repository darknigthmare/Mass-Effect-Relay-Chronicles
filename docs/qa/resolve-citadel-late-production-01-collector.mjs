// Focused late-recruitment regression. The modern Barla/Wrex investigation is
// declared native preparation; return travel, walking, dialogue and reload use
// public controls. This collector is separate from the five Resolve families.
import assert from 'node:assert/strict';
import { runPublicProof } from './resolve-browser-proof.mjs';
import { newGame, travelCampaign, winEncounter, zoneEncounters, completeZone, recruit,
  setSquad, applyResolveCitadel, winResolveCitadelEncounter } from '../src/state.js';

function modernInvestitureWithoutClinic() {
  const state = newGame({ name: 'QA Garrus après investiture', difficulty: 'story' });
  state.flags.briefed = true;
  assert.equal(travelCampaign(state, 'eden-prime').ok, true);
  for (const id of zoneEncounters('eden-prime')) assert.equal(winEncounter(state, id), true);
  assert.equal(completeZone(state, 'eden-prime'), true);
  assert.equal(travelCampaign(state, 'citadel').ok, true);
  assert.equal(applyResolveCitadel(state, 'hearing', 'report').ok, true);
  assert.equal(applyResolveCitadel(state, 'barla-von', 'lead').ok, true);
  assert.equal(recruit(state, 'wrex'), true);
  assert.equal(travelCampaign(state, 'normandy').ok, true);
  assert.equal(setSquad(state, ['kaidan', 'wrex']), true);
  assert.equal(travelCampaign(state, 'citadel').ok, true);
  assert.equal(winResolveCitadelEncounter(state, 'resolve-citadel:fist-battle').ok, true);
  assert.equal(applyResolveCitadel(state, 'fist', 'wrex').ok, true);
  assert.equal(winResolveCitadelEncounter(state, 'resolve-citadel:ambush-battle').ok, true);
  assert.equal(applyResolveCitadel(state, 'tali-proof', 'receive').ok, true);
  assert.equal(completeZone(state, 'citadel'), true);
  assert.equal(travelCampaign(state, 'normandy').ok, true);
  assert.equal(state.resolveCitadel.clinic, false);
  assert.equal(state.resolveCitadel.battles.clinic, false);
  assert.equal(state.resolveCitadel.michel, false);
  assert.equal(state.recruited.includes('garrus'), false);
  return state;
}

const preserved = state => ({
  xp: state.xp, credits: state.credits, medigel: state.medigel, paragon: state.paragon, renegade: state.renegade,
  inventory: state.inventory, upgrades: state.upgrades, collected: state.collected, cleared: state.cleared,
  completed: state.completed, choices: state.choices, flags: state.flags, operations: state.operations,
  assignments: state.assignments, lost: state.lost, party: state.party, resolveCitadel: state.resolveCitadel,
});
const garrusRecruitments = state => state.logs.filter(log => log.title === 'Nouvel équipier' && log.text.includes('Garrus')).length;

await runPublicProof({ family: 'citadel', collector: import.meta.url,
  scope: 'Focused modern Barla/Wrex route: late Garrus recruitment after investiture without any clinic receipt, via public return travel, walking, deferral, acceptance and actual reload.',
  limitations: ['The initial modern investigation, deployment of Wrex, Fist/ambush victories, Tali proof and investiture are declared native fixtures, not played in this browser.',
    'No clinic battle, clinic victory, Doctor Michel testimony or corresponding reward is prepared or claimed.',
    'This regression proof is separate from the five frozen Resolve family proofs.'],
  run: async api => {
    const { page, click, action, ready, capture, check, fixture, imported, exported, walkToPOI } = api;
    const start = modernInvestitureWithoutClinic(), baseline = structuredClone(preserved(start));
    const reply = id => click(`.dialogue[data-conversation-id="advance-recruit:garrus"] [data-reply-id="${id}"]`);
    const dialog = step => page.locator(`.dialogue[data-conversation-id="advance-recruit:garrus"][data-current-topic="${step}"]`);
    const assertPreserved = state => {
      assert.deepEqual(preserved(state), baseline);
      assert.equal(state.resolveCitadel.legacy, false);
      assert.equal(state.resolveCitadel.clinic, false); assert.equal(state.resolveCitadel.battles.clinic, false);
      assert.equal(state.resolveCitadel.michel, false); assert.equal(state.resolveCitadel.proof, true);
      assert.equal(state.resolveCitadel.fist, 'wrex');
    };
    await imported(await fixture(start, 'modern-investiture-without-clinic', {
      kind: 'Declared modern Barla/Wrex route after investiture at the Normandy, with Garrus still unrecruited and no clinic act.',
      APIs: ['newGame', 'briefed=true', 'travelCampaign', 'winEncounter(Eden ×3)', 'completeZone(eden-prime)',
        'applyResolveCitadel(hearing/report)', 'applyResolveCitadel(barla-von/lead)', 'recruit(wrex)',
        'setSquad(kaidan,wrex) at Normandy', 'winResolveCitadelEncounter(fist/ambush)',
        'applyResolveCitadel(fist/wrex)', 'applyResolveCitadel(tali-proof/receive)', 'completeZone(citadel)', 'travelCampaign(normandy)'],
      initialInvestigationPlayed: false, clinicPlayed: false,
    }));
    await page.keyboard.press('KeyG');
    await click('.planet-dot[data-do="planet"][data-id="citadel"]');
    await page.locator('[data-destination="citadel"][data-access="completed"]').waitFor();
    await capture('return-to-completed-citadel', '.galaxy-layout');
    await click('[data-do="travel"][data-id="citadel"]'); await ready();
    const arrived = await exported('returned-citadel-before-garrus');
    assertPreserved(arrived.state); assert.equal(arrived.state.recruited.includes('garrus'), false);
    assert.equal(garrusRecruitments(arrived.state), 0);
    check('Public galaxy return preserves a modern completed investigation without inventing a clinic victory', true, { export: arrived.path });

    await walkToPOI('citadel:encounter-1'); await page.keyboard.press('KeyE'); await dialog('intro').waitFor();
    await reply('investigation'); await dialog('investigation').waitFor(); await reply('back');
    await reply('defer'); await dialog('deferred').waitFor();
    await capture('garrus-late-deferral', '.dialogue[data-conversation-id="advance-recruit:garrus"]');
    await reply('leave'); await ready();
    const deferred = await exported('garrus-deferred'); assertPreserved(deferred.state);
    assert.equal(deferred.state.recruited.includes('garrus'), false); assert.equal(garrusRecruitments(deferred.state), 0);
    check('Late Garrus uses the Advance graph and can be deferred without rewards or clinic receipts', true, { export: deferred.path });

    await page.keyboard.press('KeyE'); await dialog('intro').waitFor();
    await reply('accept'); await dialog('joined').waitFor();
    await capture('garrus-late-accepted', '.dialogue[data-conversation-id="advance-recruit:garrus"]');
    await reply('leave'); await ready();
    const accepted = await exported('garrus-accepted'); assertPreserved(accepted.state);
    assert.deepEqual(accepted.state.recruited, [...start.recruited, 'garrus']);
    assert.equal(garrusRecruitments(accepted.state), 1);
    check('Acceptance recruits Garrus once while preserving proof, Fist fate, resources and all rewards', true, { export: accepted.path });

    await page.reload({ waitUntil: 'domcontentloaded' }); await click(action('continue')); await ready();
    const reloaded = await exported('garrus-after-reload'); assertPreserved(reloaded.state);
    assert.deepEqual(reloaded.state.recruited, accepted.state.recruited); assert.equal(garrusRecruitments(reloaded.state), 1);
    await page.keyboard.press('KeyM'); await click(action('map-filter', 'all'));
    assert.equal(await page.locator('circle[data-map-position="citadel:encounter-1"]').count(), 0);
    await click(action('close')); await ready();
    await page.keyboard.press('KeyC');
    assert.equal(await page.locator('.crew-card[data-id="garrus"]').count(), 1);
    assert.equal(await page.locator('.crew-card[data-id="garrus"].unavailable').count(), 0);
    await capture('garrus-available-after-reload', '.crew-grid');
    await click(action('close')); await ready();
    check('Actual reload keeps one Garrus recruitment and removes his recruitment marker without changing the deployed squad', true, { export: reloaded.path });
  },
});
