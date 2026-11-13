// Three declared native preparations; all new mission transitions, travel,
// contacts and manual save/reload use ordinary public controls in the browser.
import assert from 'node:assert/strict';
import { runPublicProof } from './resolve-browser-proof.mjs';
import { newGame, recruit, zoneEncounters, winEncounter, completeZone, decodeSave, encodeSave } from '../src/state.js';
import { recordVisit } from '../src/story.js';

function visit(state, zone) { state.zone = zone; state.position = null; assert.equal(recordVisit(state, zone), true); }
function finish(state, zone) {
  visit(state, zone); for (const id of zoneEncounters(zone)) assert.equal(winEncounter(state, id), true);
  assert.equal(completeZone(state, zone), true);
}
function preparation(origin, credits) {
  const state = newGame({ origin }); state.flags.briefed = true; finish(state, 'eden-prime');
  visit(state, 'citadel'); assert.equal(recruit(state, 'tali'), true); assert.equal(completeZone(state, 'citadel'), true);
  finish(state, 'therum'); visit(state, 'citadel'); state.credits = credits;
  state.position = { x: 0, z: 16 }; assert.ok(decodeSave(encodeSave(state))); return state;
}
const budgets = state => ({ xp: state.xp, medigel: state.medigel, paragon: state.paragon, renegade: state.renegade,
  inventory: state.inventory, assignments: state.assignments, operations: state.operations });

await runPublicProof({ family: 'origins', collector: import.meta.url,
  scope: 'Three ME1 background assignments by public physical contacts: Finch/guard/500 credits; Zabaleta/Hannah/food credit; Talitha/listen/retreat/sedation/Girard; real manual save/reload.',
  limitations: ['Native fixtures explicitly prepare Eden Prime, Tali/Council and Thérum, choose each origin, set starting resources and place the squad at the Citadel arrival. Those preceding events are not claimed played here.',
    'The three new assignments and all walking, extraction, Normandy communication, galaxy travel and save/reload transitions are performed with public controls.',
    'Original Charm/Intimidate trees, every lethal or persuasion variant, original geography and final body art are not reconstructed. The Talitha approach is a narrated adaptation.',
    'Reused contact bodies and procedural combat silhouettes remain Prototype. This scenario certifies functional origin gating and persistence, not artistic likeness.'],
  run: async api => {
    const { page, click, action, ready, fixture, imported, exported, capture, check, walkToPOI } = api;
    const dialog = contact => page.locator(`.dialogue[data-conversation-id="resolve-origins"][data-current-topic="${contact}"]`);
    const result = () => page.locator('.dialogue[data-conversation-id="resolve-result"]');
    const leaveResult = async () => { await click(result().locator('[data-reply-id="leave"]')); await ready(); };
    const talk = async (contact, zone = 'citadel') => {
      await walkToPOI(`${zone}:resolve-${contact}`, { zone }); await page.keyboard.press('KeyE');
      await dialog(contact).waitFor({ state: 'visible' });
    };
    const choose = async (contact, choice, again = false) => {
      await click(dialog(contact).locator(`[data-reply-id="${choice}"]`)); await result().waitFor({ state: 'visible' });
      if (again) { await click(result().locator('[data-reply-id="continue"]')); await dialog(contact).waitFor(); }
      else await leaveResult();
    };
    const originMap = async (expected, absent) => {
      await page.keyboard.press('KeyM'); await click(action('map-filter', 'all'));
      await page.locator(`.local-map-board [data-map-position="${expected}"]`).waitFor();
      for (const id of absent) assert.equal(await page.locator(`.local-map-board [data-map-position="${id}"]`).count(), 0);
      await click(action('close')); await ready();
    };
    const earth = preparation('earthborn', 500);
    await imported(await fixture(earth, 'earthborn-start', { kind: 'Native earlier-chapter fixture', preparation: 'Eden Prime, Tali/Council, Thérum; earthborn origin; 500 credits; Citadel arrival x0 z16; no origin assignment started.' }));
    await originMap('citadel:resolve-origin-finch', ['citadel:resolve-origin-zabaleta', 'citadel:resolve-origin-girard']);
    await talk('origin-finch'); await choose('origin-finch', 'ask-guard');
    await talk('origin-turian-guard'); assert.match(await dialog('origin-turian-guard').innerText(), /empoisonner/);
    await choose('origin-turian-guard', 'keep-detained');
    await talk('origin-finch'); await choose('origin-finch', 'challenge-blackmail', true);
    assert.match(await dialog('origin-finch').innerText(), /500/); await capture('finch-500-credits');
    await choose('origin-finch', 'pay-finch');
    const earthDone = await exported('earthborn-completed');
    assert.equal(earthDone.state.credits, 0); assert.equal(earthDone.state.origin, 'earthborn');
    assert.deepEqual(earthDone.state.resolveOrigins.records['old-friends'], { stage: 'completed', outcome: 'paid' });
    assert.deepEqual(budgets(earthDone.state), budgets(earth));
    check('Terrien seul : révélation du garde, confrontation physique et paiement de 500 unique enregistrés', true, { export: earthDone.path });

    const spacer = preparation('spacer', 40);
    await imported(await fixture(spacer, 'spacer-start', { kind: 'Native earlier-chapter fixture', preparation: 'Same earlier chapters; spacer origin; 40 credits; Citadel arrival x0 z16; no origin assignment started.' }));
    await originMap('citadel:resolve-origin-zabaleta', ['citadel:resolve-origin-finch', 'citadel:resolve-origin-girard']);
    await talk('origin-zabaleta'); await choose('origin-zabaleta', 'verify-first');
    await walkToPOI('citadel:exit', { zone: 'citadel' }); await page.keyboard.press('KeyE');
    await click(page.getByRole('button', { name: 'Extraction.', exact: true })); await ready();
    await talk('origin-hannah-call', 'normandy'); assert.match(await dialog('origin-hannah-call').innerText(), /Kilimanjaro/);
    await capture('hannah-normandy-call'); await choose('origin-hannah-call', 'finish-call');
    await page.keyboard.press('KeyG'); await click(page.locator('.planet-dot[data-do="planet"][data-id="citadel"]')); await click(action('travel', 'citadel')); await ready();
    await talk('origin-zabaleta'); await choose('origin-zabaleta', 'food-credit');
    const spacerDone = await exported('spacer-completed'); assert.equal(spacerDone.state.credits, 20);
    assert.equal(spacerDone.state.origin, 'spacer'); assert.deepEqual(budgets(spacerDone.state), budgets(spacer));
    assert.deepEqual(spacerDone.state.resolveOrigins.records['old-unhappy-far-off-things'], { stage: 'completed', outcome: 'food', initialAid: 'refused' });
    check('Stellaire seul : déplacement au Normandy, appel à Hannah et crédit nourriture de 20 persistants', true, { export: spacerDone.path });

    const colonist = preparation('colonist', 40);
    await imported(await fixture(colonist, 'colonist-start', { kind: 'Native earlier-chapter fixture', preparation: 'Same earlier chapters; colonist origin; 40 credits; Citadel arrival x0 z16; no origin assignment started.' }));
    await originMap('citadel:resolve-origin-girard', ['citadel:resolve-origin-finch', 'citadel:resolve-origin-zabaleta']);
    await talk('origin-girard'); await choose('origin-girard', 'accept-sedative');
    await talk('origin-talitha'); await choose('origin-talitha', 'share-mindoir', true);
    await choose('origin-talitha', 'approach-slowly', true); await choose('origin-talitha', 'approach-too-fast', true);
    assert.match(await dialog('origin-talitha').innerText(), /approchez pas/); await capture('talitha-agitated-retreat');
    await choose('origin-talitha', 'step-back', true); await choose('origin-talitha', 'approach-slowly', true);
    await choose('origin-talitha', 'listen-patiently', true); await choose('origin-talitha', 'offer-syringe');
    await talk('origin-girard'); await click(dialog('origin-girard').locator('[data-reply-id="report-sedation"]'));
    await result().waitFor(); assert.match(await result().innerText(), /prendre soin/); await capture('girard-medical-handoff'); await leaveResult();
    const colonistDone = await exported('colonist-completed');
    assert.deepEqual(colonistDone.state.resolveOrigins.records['i-remember-me'], { stage: 'completed', outcome: 'self-sedated' });
    assert.deepEqual(budgets(colonistDone.state), budgets(colonist)); assert.equal(colonistDone.state.credits, 40);
    check('Colon seul : écoute, agitation/recul, sédation puis rapport Girard sans médi-gel ou récompense inventée', true, { export: colonistDone.path });

    await page.keyboard.press('Escape'); await click(action('manual-saves'));
    await page.locator('#manual-save-name-1').fill('Resolve — Talitha après relais médical'); await click(action('manual-save', '1'));
    await page.locator('[data-save-slot="1"][data-status="saved"]').waitFor();
    await click(action('manual-back')); await click(action('quit'));
    await click(action('manual-saves')); await click(action('manual-load', '1')); await ready();
    const reloaded = await exported('colonist-manual-reloaded');
    assert.equal(reloaded.state.origin, 'colonist'); assert.equal(reloaded.state.psychologicalProfile, colonist.psychologicalProfile);
    assert.deepEqual(reloaded.state.resolveOrigins, colonistDone.state.resolveOrigins);
    assert.equal(reloaded.state.credits, 40); assert.deepEqual(budgets(reloaded.state), budgets(colonistDone.state));
    await page.keyboard.press('KeyM'); await click(action('map-filter', 'all'));
    assert.equal(await page.locator('.local-map-board [data-map-position="citadel:resolve-origin-talitha"]').count(), 0);
    await click(action('close')); await ready();
    check('Vrai emplacement manuel rechargé : origine/profil/issue/ressources inchangés et contact Talitha retiré', true, { export: reloaded.path });
  },
});
