import test from 'node:test';
import assert from 'node:assert/strict';
import { createChronicle, setChronicleBuild, setChronicleParty, setChronicleAmmoMode,
  getChronicleAmmoModes, getChronicleRoster, getChronicleBuilds, getChronicleGear,
  buildChronicleActor, startChronicleBattle, listChronicleScenarios } from '../src/chronicles.js';
import { UNIVERSE_WORKS } from '../src/universe-data.js';
import { getActions, performAction, tickBattle, ACTIONS } from '../src/combat.js';
import { renderUniverseScreen, renderChronicleBattle } from '../src/universe-ui.js';
import { isSummon } from '../src/combat-summons.js';

function view(session, battle = null) {
  const actors = {}, gearByActor = {}, buildsByActor = {}, ammoModesByActor = {};
  for (const id of session.party) {
    actors[id] = buildChronicleActor(session, id); gearByActor[id] = getChronicleGear(session, id);
    buildsByActor[id] = getChronicleBuilds(session, id); ammoModesByActor[id] = getChronicleAmmoModes(session, id);
  }
  return { context: session.context, session, battle, roster: getChronicleRoster(session), actors,
    gearByActor, buildsByActor, ammoModesByActor, actionLabels: ACTIONS,
    scenarios: listChronicleScenarios(session.context), works: UNIVERSE_WORKS,
    selectedActorId: session.party[0], actions: battle ? getActions(battle, session.party[0]) : [] };
}
const ui = session => ({ mediaId: session.context.mediaId, periodId: session.context.periodId, tab: 'session' });

test('real prepared ammunition modes render the validated saved selection and no invented MEA talent', () => {
  let session = createChronicle({ mediaId: 'ME3', periodId: 'me3' }, 'me3-equipment-workshop');
  session = setChronicleBuild(session, 'ME3-CHR-SHEPARD', 'soldier').session;
  session = setChronicleAmmoMode(session, 'ME3-CHR-SHEPARD', 'ME3-POW-AMMO-CRYO').session;
  const html = renderUniverseScreen(view(session), ui(session));
  assert.match(html, /data-chronicle-ammo-mode data-actor-id="ME3-CHR-SHEPARD"/);
  assert.match(html, /value="ME3-POW-AMMO-CRYO" selected/);
  assert.match(html, /Un seul mode actif/);
  const mea = createChronicle({ mediaId: 'MEA', periodId: 'mea' }, 'mea-equipment-workshop');
  assert.doesNotMatch(renderUniverseScreen(view(mea), ui(mea)), /data-chronicle-ammo-mode/);
});

test('portraits appear only for the exact authorized work identities in the live roster', () => {
  const me2 = createChronicle({ mediaId: 'ME2', periodId: 'me2' }, 'me2-equipment-workshop');
  const html = renderUniverseScreen(view(me2), ui(me2));
  assert.match(html, /data-chronicle-portrait="ME2-CHR-MIRANDA"/);
  assert.match(html, /data-chronicle-portrait="ME2-CHR-THANE"/);
  assert.doesNotMatch(html, /data-chronicle-portrait="ME2-CHR-SHEPARD"/);
  assert.doesNotMatch(html, /data-chronicle-portrait="ME2-CHR-GARRUS"/);
  assert.match(html, /viewBox="0 0 512 1024"/);
  const me3 = createChronicle({ mediaId: 'ME3', periodId: 'me3' }, 'me3-equipment-workshop');
  assert.match(renderUniverseScreen(view(me3), ui(me3)), /data-chronicle-portrait="ME3-CHR-GARRUS"/);
});

test('an actual deployed drone renders its real HP and lifetime without a player command button', () => {
  let session = createChronicle({ mediaId: 'ME3', periodId: 'me3' }, 'me3-equipment-workshop');
  session = setChronicleParty(session, ['ME3-CHR-SHEPARD']).session;
  session = setChronicleBuild(session, 'ME3-CHR-SHEPARD', 'engineer').session;
  const { battle } = startChronicleBattle(session), actor = battle.actors[0];
  for (let frame = 0; frame < 100 && !getActions(battle, actor.id).some(action => action.id === 'combatDrone' && action.available); frame++) tickBattle(battle, .1);
  const deployed = performAction(battle, { actorId: actor.id, actionId: 'combatDrone', targetId: 'chronicle-enemy-0' });
  assert.equal(deployed.ok, true, deployed.reason);
  const drone = battle.actors.find(isSummon); assert.ok(drone);
  const html = renderChronicleBattle(view(session, battle), ui(session));
  const support = html.slice(html.indexOf('class="chronicle-supports"'), html.indexOf('class="chronicle-command"'));
  assert.match(support, /Soutien autonome/); assert.match(support, /data-chronicle-support-time/);
  assert.ok(support.includes(`${Math.ceil(drone.hp)} / ${drone.maxHp}`));
  assert.doesNotMatch(support, /data-do="chronicle-actor"/);
});
