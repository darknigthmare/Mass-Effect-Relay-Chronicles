import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const baseURL = process.env.GAME_URL || 'http://127.0.0.1:4173';
const lateConrad = process.argv.includes('--late-conrad');
const out = new URL('../test-results/', import.meta.url);
await mkdir(out, { recursive: true });
const report = {
  passed: false, at: new Date().toISOString(), stage: 'launch', checks: [], encounters: [], outcomes: {},
  scenario: lateConrad ? 'late-conrad' : 'early-conrad',
  scope: 'Three condensed Citadel assignment prototypes; no claim of original dialogue or 1:1 fidelity',
  mode: 'Real UI choices, manual-save branches and legitimate campaign callbacks; accelerated combat time without statistic or progression overrides',
  errors: [], failedRequests: [],
};
const CONTACTS = {
  samesh: 'citadel:assignment-samesh-bhatia', bosker: 'citadel:assignment-bosker',
  family: 'citadel:assignment-petrovsky-family', conrad: 'citadel:assignment-conrad-verner',
};
let browser, page;
const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`);
const dialogue = id => page.locator(`.dialogue[data-assignment-id="${id}"]`);

async function idle(zone) {
  await page.waitForFunction(expected => {
    const qa = window.__RELAY_TEST__;
    return qa?.getState() && !qa.getUI().busy && (!expected || qa.getState().zone === expected);
  }, zone || null, { polling: 100, timeout: 60000 });
}

const snapshot = () => page.evaluate(() => structuredClone(window.__RELAY_TEST__.getState()));
const resources = state => ({ xp: state.xp, credits: state.credits });

async function interactiveIds() {
  return page.evaluate(() => window.__RELAY_TEST__.getWorld().getInteractivePOIs().map(poi => poi.id));
}

async function interact(id) {
  await page.evaluate(selected => window.__RELAY_TEST__.interact(selected), id);
}

async function clickChoice(index = 0) {
  await page.locator(`[data-do="dialogue-choice"][data-index="${index}"]`).click();
  await idle();
}

async function talk(contact, assignmentId) {
  await interact(CONTACTS[contact]);
  await dialogue(assignmentId).waitFor({ state: 'visible' });
}

async function choose(assignmentId, choiceId) {
  await dialogue(assignmentId).locator(`[data-assignment-choice="${choiceId}"]`).click();
  await idle();
}

async function endAssignmentDialogue(assignmentId) {
  await dialogue(assignmentId).locator('[data-assignment-end]').click();
  await page.waitForFunction(() => window.__RELAY_TEST__.getUI().screen === null, null, { polling: 100 });
}

async function deploy(zone) {
  await idle('normandy');
  await interact('normandy:galaxy');
  await action('planet', zone).click();
  await action('travel', zone).click();
  await idle(zone);
}

async function extractFromCitadel() {
  await interact('citadel:exit');
  await clickChoice();
  await idle('normandy');
}

async function finishZone(zone) {
  await interact(`${zone}:objective`);
  await clickChoice();
  await clickChoice();
  await idle('normandy');
  assert.ok((await snapshot()).completed.includes(zone), `The ${zone} objective really completed`);
}

async function validateSave() {
  await page.evaluate(async () => {
    const { encodeSave, decodeSave } = await import('/src/state.js');
    const current = window.__RELAY_TEST__.getState();
    const decoded = decodeSave(encodeSave(current));
    if (!decoded) throw new Error('Assignment progression does not survive save validation.');
    if (JSON.stringify(decoded.assignments) !== JSON.stringify(current.assignments)) throw new Error('Assignment data changes during save roundtrip.');
  });
}

async function openAssignmentsJournal() {
  await action('journal').first().click();
  await action('journal-tab', 'assignments').click();
}

async function saveBranch(id, name) {
  await page.keyboard.press('Escape');
  await action('manual-saves').click();
  await page.locator(`#manual-save-name-${id}`).fill(name);
  await action('manual-save', id).click();
  assert.equal(await page.locator(`[data-save-slot="${id}"]`).getAttribute('data-status'), 'saved');
  await action('manual-back').click();
  await page.getByRole('button', { name: 'Reprendre', exact: true }).click();
}

async function loadBranch(id, zone) {
  await page.keyboard.press('Escape');
  await action('manual-saves').click();
  await action('manual-load', id).click();
  await idle(zone);
}

async function reloadFromAutosave(zone) {
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Reprendre/ }).click();
  await idle(zone);
}

async function screenshot(name) {
  await page.screenshot({ path: fileURLToPath(new URL(`assignments-${lateConrad ? 'late-' : ''}${name}.png`, out)), timeout: 60000 });
}

async function battle(id) {
  report.stage = `combat:${id}`;
  await page.evaluate(selected => window.__RELAY_TEST__.startBattle(selected), id);
  const result = await page.evaluate(async () => {
    const { getActions, performAction, tickBattle, summarizeBattle } = await import('/src/combat.js');
    const qa = window.__RELAY_TEST__, battle = qa.getBattle();
    if (!battle) throw new Error('The legitimate encounter did not start.');
    let iterations = 0;
    while (!battle.winner && iterations++ < 6000) {
      for (const actor of battle.actors.filter(actor => actor.team === 'party' && actor.hp > 0)) {
        const available = getActions(battle, actor.id).filter(action => action.available);
        if (!available.length) continue;
        const party = battle.actors.filter(member => member.team === 'party');
        const enemies = battle.actors.filter(enemy => enemy.team === 'enemy' && enemy.hp > 0);
        const target = enemies.find(enemy => !enemy.statuses.stasis) || enemies[0];
        if (!target) break;
        const low = party.filter(member => member.hp > 0).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        const priorities = [];
        if (party.some(member => member.hp <= 0)) priorities.push(['unity', actor.id]);
        if (low.hp / low.maxHp < .42) priorities.push(['medigel', low.id]);
        if (target.shield > 0) priorities.push(['overload', target.id]);
        if (target.statuses.lift > 0 || target.statuses.singularity > 0) priorities.push(['throw', target.id]);
        priorities.push(['signature', target.id], ['warp', target.id], ['burst', target.id], ['shoot', target.id], ['throw', target.id], ['overload', target.id], ['barrier', actor.id], ['cover', actor.id]);
        for (const [actionId, targetId] of priorities) {
          if (!available.some(action => action.id === actionId)) continue;
          if (performAction(battle, { actorId: actor.id, actionId, targetId }).ok) break;
        }
      }
      tickBattle(battle, .5);
    }
    qa.step(.001);
    return { ...summarizeBattle(battle), iterations };
  });
  assert.equal(result.winner, 'party', `Legitimate victory at ${id}`);
  assert.ok(result.actionCount > 0, 'Victory requires actual actions');
  await action('claim-victory').click();
  if (id === 'eden-prime:encounter-1') await clickChoice();
  assert.ok((await snapshot()).cleared.includes(id));
  await validateSave();
  report.encounters.push({ id, winner: result.winner, actions: result.actionCount });
  console.log(JSON.stringify(report.encounters.at(-1)));
}

async function completeHomecoming(boskerChoice, outcome, intermediateStage) {
  const before = resources(await snapshot());
  await talk('bosker', 'homecoming');
  await choose('homecoming', boskerChoice);
  let state = await snapshot();
  assert.deepEqual(state.assignments.records.homecoming, { stage: intermediateStage, outcome, rewarded: false });
  assert.deepEqual(resources(state), before, 'Bosker does not grant the completion reward');
  await endAssignmentDialogue('homecoming');
  await talk('samesh', 'homecoming');
  await choose('homecoming', 'inform-family');
  state = await snapshot();
  assert.deepEqual(state.assignments.records.homecoming, { stage: 'completed', outcome, rewarded: true });
  assert.deepEqual(resources(state), { xp: before.xp + 50, credits: before.credits }, 'Completing Homecoming grants the declared prototype reward once');
  await endAssignmentDialogue('homecoming');
  assert.ok(!(await interactiveIds()).includes(CONTACTS.bosker), 'Bosker no longer offers another outcome after completion');
  await talk('samesh', 'homecoming');
  assert.equal(await dialogue('homecoming').locator('[data-assignment-choice="accept-help"]').count(), 0);
  assert.equal(await dialogue('homecoming').locator('[data-assignment-choice="inform-family"]').count(), 0);
  await endAssignmentDialogue('homecoming');
  assert.deepEqual(resources(await snapshot()), resources(state), 'Revisiting Samesh cannot grant another reward');
  assert.deepEqual((await snapshot()).assignments.records.homecoming, state.assignments.records.homecoming, 'The recorded outcome is immutable through repeat dialogue');
  await validateSave();
  report.outcomes.homecoming ||= [];
  report.outcomes.homecoming.push({ outcome, reward: { xp: 50, credits: 0 }, repeatReward: false });
}

async function completeFamily(choiceId) {
  const before = resources(await snapshot());
  await talk('family', 'family');
  await choose('family', choiceId);
  const state = await snapshot();
  assert.deepEqual(state.assignments.records.family, { stage: 'completed', outcome: choiceId, rewarded: true });
  assert.deepEqual(resources(state), { xp: before.xp + 50, credits: before.credits });
  await endAssignmentDialogue('family');
  await talk('family', 'family');
  for (const id of ['discuss-concerns', 'support-therapy', 'respect-refusal']) {
    assert.equal(await dialogue('family').locator(`[data-assignment-choice="${id}"]`).count(), 0, 'Completed family dialogue cannot replace its recorded outcome');
  }
  await endAssignmentDialogue('family');
  assert.deepEqual(resources(await snapshot()), resources(state));
  await validateSave();
  report.outcomes.family ||= [];
  report.outcomes.family.push({ outcome: choiceId, reward: { xp: 50, credits: 0 }, repeatReward: false });
}

try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  page = await context.newPage();
  page.setDefaultTimeout(60000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`); });

  report.stage = 'creation';
  await page.goto(`${baseURL}/?qa`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Nouvelle campagne/ }).click();
  await page.locator('#commander-name').fill('Alex Shepard');
  await page.locator('#new-appearance').selectOption('female');
  await page.locator('#new-origin').selectOption('colonist');
  await page.locator('#new-profile').selectOption('war-hero');
  await page.locator('#new-difficulty').selectOption('normal');
  await page.getByRole('button', { name: /Commencer l’aventure/ }).click();
  await page.getByRole('button', { name: 'Je rejoins le briefing.' }).click();
  await idle('normandy');
  await interact('normandy:briefing');
  await clickChoice();
  await action('travel', 'eden-prime').click();
  await idle('eden-prime');
  for (const suffix of ['encounter-1', 'encounter-2', 'boss']) await battle(`eden-prime:${suffix}`);
  await finishZone('eden-prime');
  await deploy('citadel');
  await interact('citadel:encounter-2');
  await clickChoice();
  await finishZone('citadel');
  let state = await snapshot();
  assert.equal(state.flags.spectre, true);
  assert.ok(state.recruited.includes('tali'));
  assert.ok(!state.recruited.includes('garrus') && !state.recruited.includes('wrex'));
  report.checks.push('A real new campaign completes Eden Prime and the Council audience with Tali as the only Citadel recruit');

  report.stage = 'homecoming-start';
  await deploy('citadel');
  const initialContacts = await interactiveIds();
  assert.ok(initialContacts.includes(CONTACTS.samesh));
  assert.ok(initialContacts.includes(CONTACTS.conrad));
  assert.ok(!initialContacts.includes(CONTACTS.family), 'Family concerns remain unavailable before completing an investigation world');
  await talk('samesh', 'homecoming');
  await choose('homecoming', 'accept-help');
  assert.deepEqual((await snapshot()).assignments.records.homecoming, { stage: 'requested', outcome: null, rewarded: false });
  await endAssignmentDialogue('homecoming');
  assert.ok((await interactiveIds()).includes(CONTACTS.bosker));
  await openAssignmentsJournal();
  assert.equal(await page.locator('[data-assignment-id="homecoming"][data-assignment-status="active"]').count(), 1);
  await screenshot('homecoming-active-journal');
  await action('close').click();
  const homecomingBefore = await snapshot();
  await saveBranch('1', 'Bhatia — avant la décision');

  report.stage = 'homecoming-return-body';
  await completeHomecoming('return-body', 'return-body', 'body-authorized');
  await openAssignmentsJournal();
  assert.equal(await page.locator('[data-assignment-id="homecoming"][data-assignment-status="completed"]').count(), 1);
  await screenshot('homecoming-body-returned');
  await action('close').click();
  const bodyReturned = await snapshot();
  await reloadFromAutosave('citadel');
  assert.deepEqual((await snapshot()).assignments, bodyReturned.assignments, 'The first Homecoming outcome persists after a real reload');

  report.stage = 'homecoming-research';
  await loadBranch('1', 'citadel');
  state = await snapshot();
  assert.deepEqual(state.assignments, homecomingBefore.assignments, 'A genuine manual save restores the undecided assignment branch');
  assert.deepEqual(resources(state), resources(homecomingBefore));
  await completeHomecoming('support-research', 'research', 'research-supported');
  const researchSupported = await snapshot();
  await reloadFromAutosave('citadel');
  assert.deepEqual((await snapshot()).assignments, researchSupported.assignments);
  assert.deepEqual(resources(await snapshot()), resources(researchSupported));
  report.checks.push('Both Homecoming outcomes run through Samesh and Bosker using a real manual-save branch; each grants 50 prototype XP once and remains immutable after repeat dialogue/reload');

  if (!lateConrad) {
    report.stage = 'conrad-first-meeting';
    const beforeAutograph = resources(await snapshot());
    await talk('conrad', 'fan');
    assert.equal(await dialogue('fan').locator('[data-assignment-choice="take-photo"]').count(), 0);
    await choose('fan', 'sign-autograph');
    assert.deepEqual((await snapshot()).assignments.records.fan, { stage: 'signed', outcome: null, rewarded: false, autographAt: 0, photoAt: null });
    await endAssignmentDialogue('fan');
    await talk('conrad', 'fan');
    for (const choice of ['sign-autograph', 'take-photo', 'discourage-risk']) assert.equal(await dialogue('fan').locator(`[data-assignment-choice="${choice}"]`).count(), 0);
    await endAssignmentDialogue('fan');
    assert.deepEqual(resources(await snapshot()), beforeAutograph, 'An autograph and repeated conversation do not grant completion rewards');
    report.checks.push('Conrad starts with an autograph, offers no premature photo/resolution and gives no repeated stage reward');
  }

  report.stage = 'first-investigation-world';
  await extractFromCitadel();
  await deploy('therum');
  for (const suffix of ['encounter-1', 'encounter-2', 'boss']) await battle(`therum:${suffix}`);
  await finishZone('therum');
  await deploy('citadel');
  assert.ok((await interactiveIds()).includes(CONTACTS.family), 'The family contact becomes available after one completed investigation world');
  if (!lateConrad) {
    await talk('conrad', 'fan');
    assert.equal(await dialogue('fan').locator('[data-assignment-choice="discourage-risk"]').count(), 0);
    const beforePhoto = resources(await snapshot());
    await choose('fan', 'take-photo');
    assert.deepEqual((await snapshot()).assignments.records.fan, { stage: 'photographed', outcome: null, rewarded: false, autographAt: 0, photoAt: 1 });
    await endAssignmentDialogue('fan');
    await talk('conrad', 'fan');
    assert.equal(await dialogue('fan').locator('[data-assignment-choice="discourage-risk"]').count(), 0, 'Conrad resolution still requires a second completed world');
    await endAssignmentDialogue('fan');
    assert.deepEqual(resources(await snapshot()), beforePhoto);
    report.checks.push('Completing Therum through three legitimate encounters unlocks Conrad’s photo stage and the family assignment, but not his final resolution');
  } else {
    assert.equal((await snapshot()).assignments.records.fan, undefined, 'The late-contact campaign has not met Conrad before finishing Therum');
    report.checks.push('Therum is completed through real combat before any Conrad contact, while family concerns unlock normally');
  }

  report.stage = 'family-start';
  await talk('family', 'family');
  await choose('family', 'discuss-concerns');
  assert.deepEqual((await snapshot()).assignments.records.family, { stage: 'discussion', outcome: null, rewarded: false });
  await endAssignmentDialogue('family');
  const familyBefore = await snapshot();
  await saveBranch('2', 'Famille — avant le conseil');
  await completeFamily('support-therapy');
  const therapySupported = await snapshot();
  await reloadFromAutosave('citadel');
  assert.deepEqual((await snapshot()).assignments, therapySupported.assignments);
  await loadBranch('2', 'citadel');
  assert.deepEqual((await snapshot()).assignments, familyBefore.assignments);
  assert.deepEqual(resources(await snapshot()), resources(familyBefore));
  await completeFamily('respect-refusal');
  await openAssignmentsJournal();
  assert.equal(await page.locator('[data-assignment-id="family"][data-assignment-status="completed"]').count(), 1);
  await screenshot('family-advice-journal');
  await action('close').click();
  report.checks.push('Both family advice outcomes run from an actual saved branch after Therum, persist through reload, grant one 50 XP prototype reward and cannot be replaced by revisiting');

  report.stage = 'second-investigation-world';
  await extractFromCitadel();
  await deploy('feros');
  for (const suffix of ['encounter-1', 'encounter-2', 'boss']) await battle(`feros:${suffix}`);
  await finishZone('feros');
  await deploy('citadel');
  state = await snapshot();
  assert.ok(state.completed.includes('therum') && state.completed.includes('feros'));
  if (!lateConrad) {
    const beforeConradFinal = resources(state);
    await talk('conrad', 'fan');
    await choose('fan', 'discourage-risk');
    assert.deepEqual((await snapshot()).assignments.records.fan, { stage: 'completed', outcome: 'return-home', rewarded: true, autographAt: 0, photoAt: 1 });
    await endAssignmentDialogue('fan');
    const completed = await snapshot();
    assert.deepEqual(resources(completed), { xp: beforeConradFinal.xp + 50, credits: beforeConradFinal.credits });
    assert.ok(!(await interactiveIds()).includes(CONTACTS.conrad), 'Conrad is no longer an active assignment contact after the final resolution');
    await validateSave();
    await reloadFromAutosave('citadel');
    assert.deepEqual((await snapshot()).assignments, completed.assignments);
    assert.deepEqual(resources(await snapshot()), resources(completed));
    assert.ok(!(await interactiveIds()).includes(CONTACTS.conrad));
    await openAssignmentsJournal();
    for (const id of ['homecoming', 'family', 'fan']) {
      assert.equal(await page.locator(`[data-assignment-id="${id}"][data-assignment-status="completed"]`).count(), 1);
      assert.equal(await page.locator(`[data-assignment-id="${id}"][data-assignment-status="active"]`).count(), 0);
    }
    await screenshot('all-completed-journal');
    report.outcomes.fan = { outcome: 'return-home', reward: { xp: 50, credits: 0 }, autographAt: 0, photoAt: 1, stages: ['signed', 'photographed', 'completed'] };
    report.checks.push('After a second real investigation world, Conrad resolves once, disappears as a contact and all three completed assignments survive reload in the journal');
  } else {
    report.stage = 'late-conrad-first-contact';
    assert.equal(state.assignments.records.fan, undefined, 'Two worlds have been completed without any Conrad contact');
    await saveBranch('3', 'Conrad — avant la première rencontre tardive');
    const beforeLateAutograph = resources(await snapshot());
    await talk('conrad', 'fan');
    assert.equal(await dialogue('fan').locator('[data-assignment-choice="take-photo"]').count(), 0);
    await choose('fan', 'sign-autograph');
    const signed = { stage: 'signed', outcome: null, rewarded: false, autographAt: 2, photoAt: null };
    assert.deepEqual((await snapshot()).assignments.records.fan, signed);
    await endAssignmentDialogue('fan');
    await talk('conrad', 'fan');
    for (const id of ['sign-autograph', 'take-photo', 'discourage-risk']) {
      assert.equal(await dialogue('fan').locator(`[data-assignment-choice="${id}"]`).count(), 0, 'Preexisting world completions cannot advance a newly signed autograph');
    }
    await screenshot('conrad-waits-after-late-autograph');
    await endAssignmentDialogue('fan');
    assert.deepEqual(resources(await snapshot()), beforeLateAutograph);
    const lateState = await snapshot();
    await validateSave();
    await reloadFromAutosave('citadel');
    assert.deepEqual((await snapshot()).assignments, lateState.assignments);
    await talk('conrad', 'fan');
    for (const id of ['take-photo', 'discourage-risk']) assert.equal(await dialogue('fan').locator(`[data-assignment-choice="${id}"]`).count(), 0, 'Reload does not bypass the relative assignment milestone');
    await endAssignmentDialogue('fan');
    assert.deepEqual(resources(await snapshot()), beforeLateAutograph);
    await openAssignmentsJournal();
    assert.equal(await page.locator('[data-assignment-id="fan"][data-assignment-status="active"]').count(), 1);
    assert.equal(await page.locator('[data-assignment-id="fan"][data-assignment-status="completed"]').count(), 0);
    for (const id of ['homecoming', 'family']) assert.equal(await page.locator(`[data-assignment-id="${id}"][data-assignment-status="completed"]`).count(), 1);
    await screenshot('conrad-late-active-journal');
    report.outcomes.fan = { ...signed, reward: { xp: 0, credits: 0 }, photoBlockedImmediately: true, photoBlockedAfterReload: true };
    report.checks.push('A first Conrad meeting after two completed worlds records that relative milestone, offers no immediate photo or resolution, gives no reward and remains active after reload');
  }

  assert.equal(report.encounters.length, 9);
  assert.deepEqual(report.errors, [], 'No uncaught browser errors');
  assert.deepEqual(report.failedRequests, [], 'No failed network requests or HTTP errors');
  report.stage = 'complete';
  report.passed = true;
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  report.failure = error.stack || String(error);
  if (page) {
    report.diagnostic = await Promise.race([
      page.evaluate(() => ({
        zone: window.__RELAY_TEST__?.getState()?.zone,
        busy: window.__RELAY_TEST__?.getUI()?.busy,
        screen: window.__RELAY_TEST__?.getUI()?.screen,
        assignments: window.__RELAY_TEST__?.getState()?.assignments,
        completed: window.__RELAY_TEST__?.getState()?.completed,
        visibility: document.visibilityState,
      })).catch(() => null),
      new Promise(resolve => setTimeout(() => resolve({ unavailable: true }), 5000)),
    ]);
    await screenshot('failure').catch(() => {});
  }
  throw error;
} finally {
  await browser?.close();
  await writeFile(new URL(lateConrad ? 'assignments-late-report.json' : 'assignments-report.json', out), `${JSON.stringify(report, null, 2)}\n`);
}
