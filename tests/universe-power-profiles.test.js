import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIONS, createBattle, getActions, performAction } from '../src/combat.js';
import { getUniverseRecord, getUniverseWork } from '../src/universe-data.js';
import { canAccessContent } from '../src/continuity.js';
import { UNIVERSE_POWER_MAPPINGS, ACTOR_POWER_ASSIGNMENTS, getUniversePowerMapping, getActorPowerKit,
  ME3_GARRUS_AMMO_PRIMARY_REFERENCE } from '../src/universe-powers.js';
import { UNIVERSE_AMMO_PROFILES, getAmmoActionProfile } from '../src/universe-ammo.js';
import { getUniverseActor, universeActorFor, listUniverseBuilds, getUniverseBuild, getUniversePowerUsage,
  getUsedUniversePowerCatalogIds, CHRONICLE_SCENARIOS } from '../src/universe-actors.js';

const context = mediaId => ({ mediaId, periodId: mediaId.toLowerCase() });
const workshop = mediaId => `${mediaId.toLowerCase()}-equipment-workshop`;
const native = (actorId, buildId = 'default', scene) => {
  const mediaId = actorId.split('-')[0];
  return universeActorFor(actorId, context(mediaId), buildId, scene ?? workshop(mediaId));
};
const combatStats = actor => Object.fromEntries(['hp', 'maxHp', 'shield', 'maxShield', 'attack', 'defense', 'speed'].map(key => [key, actor[key]]));

test('every runtime mapping has a distinct catalogue power and explicit same-work provenance', () => {
  assert.equal(new Set(UNIVERSE_POWER_MAPPINGS.map(power => power.catalogId)).size, UNIVERSE_POWER_MAPPINGS.length);
  for (const power of UNIVERSE_POWER_MAPPINGS) {
    const record = getUniverseRecord(power.catalogId), work = getUniverseWork(power.mediaId);
    assert.equal(record.category, 'powers'); assert.equal(record.fact, true); assert.equal(record.mediaId, power.mediaId);
    assert.ok(power.sourceIds.length > 0); assert.ok(power.sourceIds.every(id => work.sources.some(source => source.id === id)));
    assert.ok(ACTIONS[power.actionId], power.actionId); assert.equal(power.statsBasis, 'ATB adaptation');
    assert.equal(Object.isFrozen(power), true); assert.equal(Object.isFrozen(power.sourceIds), true);
  }
  for (const id of ['constructor', '__proto__', 'not-a-power', null, {}, 9]) assert.equal(getUniversePowerMapping(id), null);
  assert.equal(getUniversePowerMapping('MEA-POW-BARRIER'), null, 'A passive MEA talent must not become ME1 Barrier');
  assert.equal(getUniversePowerMapping('INF-PWR-PULL'), null, 'Unverified mobile abilities are not silently enabled');
});

test('all ten new actions are exposed by explicitly prepared companion kits', () => {
  const witnesses = {
    pull: 'ME2-CHR-JACOB', incinerate: 'ME2-CHR-MORDIN', cryoBlast: 'ME2-CHR-MORDIN',
    concussiveShot: 'ME2-CHR-GARRUS', energyDrain: 'ME2-CHR-TALI', fortification: 'ME2-CHR-GRUNT',
    reave: 'ME2-CHR-SAMARA', shockwave: 'ME2-CHR-JACK', slam: 'ME2-CHR-MIRANDA', dominate: 'ME2-CHR-MORINTH',
  };
  for (const [actionId, actorId] of Object.entries(witnesses)) {
    const actor = native(actorId);
    assert.ok(actor.powers.includes(actionId), `${actorId}/${actionId}`);
    const provenance = actor.powerProvenance.find(power => power.actionId === actionId);
    assert.ok(provenance); assert.equal(provenance.actorCatalogId, actorId);
    assert.equal(canAccessContent(provenance.catalogId, context('ME2')).ok, true);
    assert.ok(provenance.attributionSourceIds.includes('ME2-SRC-SQUAD'));
    const battle = createBattle({ party: [{ ...actor, atb: 100 }], enemies: [{ id: 'target', hp: 500, shield: 0, attack: 1, synthetic: actionId === 'energyDrain' }] });
    const command = getActions(battle, actorId).find(action => action.id === actionId);
    assert.ok(command);
    const result = performAction(battle, { actorId, actionId, targetId: command.target === 'self' ? actorId : 'target' });
    assert.equal(result.ok, true, `${actorId}/${actionId}: ${result.reason}`);
    assert.equal(battle.actionCount, 1); assert.equal(battle.actors[0].atb, 0);
    assert.equal(battle.actors[0].heat, 0);
  }
});

test('loyalty powers remain unavailable before the prepared post-loyalty workshop', () => {
  const ctx = context('ME2');
  for (const [actorId, actionId] of [['ME2-CHR-MIRANDA', 'slam'], ['ME2-CHR-JACOB', 'barrier'],
    ['ME2-CHR-GRUNT', 'fortification'], ['ME2-CHR-TALI', 'energyDrain'], ['ME2-CHR-SAMARA', 'reave'], ['ME2-CHR-MORINTH', 'dominate']]) {
    const conservative = universeActorFor(actorId, ctx);
    assert.equal(conservative.powers.includes(actionId), false);
    assert.ok(conservative.lockedPowers.some(power => power.actionId === actionId && power.requirement === 'loyalty'));
    assert.ok(native(actorId).powers.includes(actionId));
  }
  const miranda = universeActorFor('ME2-CHR-MIRANDA', ctx, 'default', 'me2-freedoms-progress');
  const jacob = universeActorFor('ME2-CHR-JACOB', ctx, 'default', 'me2-freedoms-progress');
  assert.deepEqual(miranda.powers, ['warp', 'overload']); assert.deepEqual(jacob.powers, ['pull', 'ammoIncendiary']);
  assert.ok(miranda.missingPowers.includes('Slam de loyauté')); assert.ok(jacob.missingPowers.includes('Barrier de loyauté'));
  assert.equal(native('ME2-CHR-MIRANDA').missingPowers.includes('Slam de loyauté'), false);
  assert.match(CHRONICLE_SCENARIOS.find(scene => scene.id === workshop('ME2')).description, /post-loyauté/);
});

test('later and comic identities never inherit a same-name character’s powers', () => {
  assert.deepEqual(universeActorFor('RED-ACT-LIARA', { mediaId: 'RED', periodId: 'red' }, 'default', 'red-liara-feron').powers, []);
  assert.deepEqual(universeActorFor('INF-CHR-RANDALL', { mediaId: 'INF', periodId: 'inf' }, 'default', 'inf-security').powers, []);
  assert.equal(getActorPowerKit('ME2-CHR-JACK', context('ME1')), null);
  assert.equal(universeActorFor('ME3-CHR-KAIDAN', context('ME2')), null);
  assert.deepEqual(getUniverseActor('MEA-CHR-CORA').powers, ['shieldBoost']);
  assert.ok(getUniverseActor('MEA-CHR-CORA').missingPowers.includes('Charge'));
  assert.deepEqual(native('MEA-CHR-PEEBEE').powers, ['pull']);
  assert.equal(native('MEA-CHR-PEEBEE').powers.includes('shockwave'), false);
  assert.equal(native('MEA-CHR-PEEBEE').missingPowers.includes('Flak Cannon'), false, 'An unverified companion attribution must not be presented as her missing ability');
  assert.equal(native('MEA-CHR-PEEBEE').missingPowers.includes('Shockwave'), false);
  assert.ok(native('MEA-CHR-DRACK').powers.includes('incinerate'));
  assert.ok(native('MEA-CHR-JAAL').powers.includes('energyDrain'));
});

test('Shepard’s six ME2 classes enforce primary-manual weapon families without changing base ATB stats', () => {
  const actorId = 'ME2-CHR-SHEPARD', scene = workshop('ME2'), ctx = context('ME2');
  const baseline = native(actorId), expected = {
    soldier: ['pistol', 'assault', 'shotgun', 'sniper'], engineer: ['pistol', 'smg'], adept: ['pistol', 'smg'],
    infiltrator: ['pistol', 'smg', 'sniper'], vanguard: ['pistol', 'smg', 'shotgun'], sentinel: ['pistol', 'smg'],
  };
  assert.deepEqual(listUniverseBuilds(actorId, ctx, scene).map(build => build.id), ['default', ...Object.keys(expected)]);
  assert.deepEqual(baseline.powers, []);
  for (const [id, allowed] of Object.entries(expected)) {
    const build = getUniverseBuild(actorId, ctx, id, scene), actor = native(actorId, id);
    assert.deepEqual(build.allowedWeapons, allowed); assert.deepEqual(actor.allowedWeapons, allowed);
    assert.deepEqual(combatStats(actor), combatStats(baseline));
    assert.match(build.attributionReference.reference, /22–24/);
    assert.ok(actor.powerProvenance.every(power => power.mediaId === 'ME2'));
  }
  assert.deepEqual(native(actorId, 'soldier').powers, ['concussiveShot', 'ammoDisruptor', 'ammoIncendiary', 'ammoCryo']);
  assert.ok(native(actorId, 'engineer').powers.includes('cryoBlast'));
  assert.ok(native(actorId, 'adept').powers.includes('singularity'));
  assert.equal(native(actorId, 'infiltrator').powers.includes('overload'), false);
  assert.ok(native(actorId, 'sentinel').missingPowers.includes('Tech Armor'));
});

test('ME3 class preparations retain free weapon carrying and keep unsupported class skills explicit', () => {
  const actorId = 'ME3-CHR-SHEPARD', ctx = context('ME3');
  for (const build of listUniverseBuilds(actorId, ctx, workshop('ME3'))) {
    assert.deepEqual(build.allowedWeapons, ['pistol', 'smg', 'assault', 'shotgun', 'sniper']);
    assert.deepEqual(combatStats(native(actorId, build.id)), combatStats(native(actorId)));
  }
  assert.ok(native(actorId, 'vanguard').missingPowers.includes('Nova'));
  assert.ok(native(actorId, 'adept').missingPowers.includes('Cluster Grenade'));
  assert.equal(getUniverseBuild(actorId, ctx, 'combat'), null);
});

test('Ryder preparations contain at most three attested skills and never claim passive profile bonuses', () => {
  const actorId = 'MEA-CHR-RYDER', ctx = context('MEA');
  const builds = listUniverseBuilds(actorId, ctx, workshop('MEA'));
  assert.deepEqual(builds.map(build => build.id), ['default', 'combat', 'biotic', 'tech']);
  for (const build of builds) {
    assert.ok(build.powers.length <= 3); assert.deepEqual(combatStats(native(actorId, build.id)), combatStats(native(actorId)));
    if (build.id !== 'default') assert.match(build.description, /Aucun bonus de profil passif/);
    assert.ok(build.powerCatalogIds.every(id => id.startsWith('MEA-POW-')));
  }
  assert.deepEqual(native(actorId).powers, []);
  assert.deepEqual(native(actorId, 'tech').powers, ['overload', 'incinerate', 'energyDrain']);
  assert.equal(getUniverseBuild(actorId, ctx, 'soldier'), null);
});

test('classes and preparations cannot escape protagonist, prologue or scenario restrictions', () => {
  assert.deepEqual(listUniverseBuilds('ME2-CHR-MORDIN', context('ME2'), workshop('ME2')).map(build => build.id), ['default']);
  assert.equal(getUniverseBuild('ME2-CHR-MORDIN', context('ME2'), 'engineer', workshop('ME2')), null);
  assert.deepEqual(listUniverseBuilds('ME3-CHR-SHEPARD', { mediaId: 'ME3', periodId: 'me3-prologue' }, 'me3-earth-prologue').map(build => build.id), ['default']);
  assert.equal(getUniverseBuild('MEA-CHR-RYDER', { mediaId: 'MEA', periodId: 'mea-prologue' }, 'tech', 'mea-habitat7'), null);
  assert.equal(getUniverseBuild('ME2-CHR-JACK', context('ME2'), 'default', 'me2-freedoms-progress'), null);
  for (const id of ['constructor', '__proto__', 'unknown', null, {}]) assert.equal(getUniverseBuild('ME2-CHR-SHEPARD', context('ME2'), id), null);
  assert.equal(getUniverseBuild('ME2-CHR-SHEPARD', { ...context('ME2'), galaxy: 'andromeda' }, 'soldier'), null);
});

test('DLC and temporary companions remain outside the generic workshop roster', () => {
  const me2 = CHRONICLE_SCENARIOS.find(scene => scene.id === workshop('ME2'));
  const me3 = CHRONICLE_SCENARIOS.find(scene => scene.id === workshop('ME3'));
  for (const id of ['ME2-CHR-LIARA', 'ME2-CHR-KASUMI', 'ME2-CHR-ZAEED']) assert.equal(me2.actorIds.includes(id), false);
  for (const id of ['ME3-CHR-JAVIK', 'ME3-CHR-ARIA', 'ME3-CHR-NYREEN', 'ME3-CHR-WREX', 'ME3-CHR-ANDERSON']) assert.equal(me3.actorIds.includes(id), false);
  assert.ok(me3.allowedEquipmentIds.includes('ME3-EQP-BARREL')); assert.ok(me3.allowedEquipmentIds.includes('ME3-EQP-MAGAZINE'));
});

test('used catalogue power reports contain only bindings reachable through actual scenario builds', () => {
  const usage = getUniversePowerUsage(), ids = getUsedUniversePowerCatalogIds();
  assert.deepEqual(usage.map(row => row.catalogId), ids); assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes('ME2-POW-SLAM')); assert.ok(ids.includes('ME3-POW-FORTIFICATION'));
  assert.deepEqual(usage.find(row => row.catalogId === 'ME3-POW-SLAM').scenarioIds, ['me3-from-ashes'], 'Javik is confined to his explicitly prepared extension bench');
  assert.equal(ids.includes('ME2-POW-CHARGE'), false); assert.equal(ids.includes('MEA-POW-REMNANT-VI'), false);
  for (const row of usage) {
    assert.equal(getUniversePowerMapping(row.catalogId).actionId, row.actionId);
    assert.ok(row.scenarioIds.every(id => CHRONICLE_SCENARIOS.some(scene => scene.id === id)));
    assert.ok(row.actorIds.every(id => Object.hasOwn(ACTOR_POWER_ASSIGNMENTS, id) || id.endsWith('-SHEPARD') || id === 'MEA-CHR-RYDER'));
  }
});

test('the four summon cards have exact work, class and companion whitelists', () => {
  const supports = new Set(['combatDrone', 'sentryTurret', 'defenseDrone']);
  const actual = [];
  for (const scene of CHRONICLE_SCENARIOS) for (const actorId of scene.actorIds) {
    for (const build of listUniverseBuilds(actorId, scene.context, scene.id)) {
      for (const power of build.powerProvenance.filter(power => supports.has(power.actionId))) {
        actual.push(`${power.catalogId}/${actorId}/${build.id}`);
      }
    }
  }
  assert.deepEqual([...new Set(actual)].sort(), [
    'ME2-POW-DRONE/ME2-CHR-SHEPARD/engineer',
    'ME2-POW-DRONE/ME2-CHR-TALI/default',
    'ME2-POW-DRONE/ME2-CHR-LEGION/default',
    'ME3-POW-DRONE/ME3-CHR-SHEPARD/engineer',
    'ME3-POW-DRONE/ME3-CHR-TALI/default',
    'ME3-POW-SENTRY/ME3-CHR-SHEPARD/engineer',
    'ME3-POW-DEFENSE-DRONE/ME3-CHR-TALI/default',
  ].sort());
  assert.equal(native('ME3-CHR-TALI').powers.includes('sentryTurret'), false);
  assert.equal(native('ME3-CHR-SHEPARD', 'engineer').powers.includes('defenseDrone'), false);
  assert.equal(native('ME2-CHR-TALI').powers.includes('defenseDrone'), false);
  assert.equal(getUniversePowerMapping('MEA-POW-ASSAULT-TURRET'), null);
  assert.equal(getUniversePowerMapping('MEA-POW-REMNANT-VI'), null);
});

test('companion ammunition is explicit and ME2 loyalty ammo never unlocks from a label alone', () => {
  const expected = {
    'ME2-CHR-JACOB': 'ammoIncendiary', 'ME2-CHR-GRUNT': 'ammoIncendiary',
    'ME2-CHR-ZAEED': 'ammoDisruptor', 'ME2-CHR-GARRUS': 'ammoArmorPiercing',
    'ME2-CHR-JACK': 'ammoWarp', 'ME2-CHR-THANE': 'ammoShredder',
    'ME3-CHR-GARRUS': 'ammoArmorPiercing', 'ME3-CHR-ASHLEY': 'ammoDisruptor',
  };
  const actual = {};
  for (const scene of CHRONICLE_SCENARIOS) for (const actorId of scene.actorIds) {
    if (actorId.endsWith('-SHEPARD') || actorId.endsWith('-RYDER')) continue;
    const actor = universeActorFor(actorId, scene.context, 'default', scene.id);
    const ammo = actor.powers.filter(id => getAmmoActionProfile(actor.mediaId, id));
    if (ammo.length) {
      assert.equal(ammo.length, 1); actual[actorId] = ammo[0];
      assert.deepEqual(actor.allowedAmmoProfileIds, [getAmmoActionProfile(actor.mediaId, ammo[0]).id]);
    }
  }
  assert.deepEqual(actual, expected);
  for (const actorId of ['ME2-CHR-GARRUS', 'ME2-CHR-JACK', 'ME2-CHR-THANE']) {
    const before = universeActorFor(actorId, context('ME2'));
    assert.deepEqual(before.allowedAmmoProfileIds, []);
    assert.equal(before.powers.includes(expected[actorId]), false);
    assert.ok(before.lockedPowers.some(power => power.actionId === expected[actorId] && power.requirement === 'loyalty'));
    assert.ok(native(actorId).powers.includes(expected[actorId]));
  }
  assert.ok(universeActorFor('ME2-CHR-JACOB', context('ME2'), 'default', 'me2-freedoms-progress').powers.includes('ammoIncendiary'));
  assert.ok(native('ME2-CHR-ZAEED', 'default', 'me2-dlc-specialists').powers.includes('ammoDisruptor'));
  assert.deepEqual(native('ME3-CHR-JAMES').allowedAmmoProfileIds, [], 'No new companion ammo attribution without inspected supporting evidence');
});

test('ammo permissions are derived from the true work and build, default to no active mode, and remain isolated', () => {
  const expected = {
    soldier: ['AMMO-DISRUPTOR', 'AMMO-INCENDIARY', 'AMMO-CRYO'],
    infiltrator: ['AMMO-DISRUPTOR', 'AMMO-CRYO'], vanguard: ['AMMO-INCENDIARY', 'AMMO-CRYO'],
    engineer: [], adept: [], sentinel: [], default: [],
  };
  for (const mediaId of ['ME2', 'ME3']) for (const [buildId, suffixes] of Object.entries(expected)) {
    const actor = native(`${mediaId}-CHR-SHEPARD`, buildId);
    assert.deepEqual(actor.allowedAmmoProfileIds, suffixes.map(suffix => `${mediaId}-POW-${suffix}`));
    assert.equal(actor.ammoModeId, null);
    assert.ok(actor.allowedAmmoProfileIds.every(id => actor.powerProvenance.some(power => power.catalogId === id)));
  }
  for (const actorId of ['MEA-CHR-RYDER', 'MEA-CHR-CORA', 'MEA-CHR-LIAM', 'MEA-CHR-VETRA', 'MEA-CHR-JAAL', 'MEA-CHR-DRACK', 'MEA-CHR-PEEBEE']) {
    for (const build of listUniverseBuilds(actorId, context('MEA'), workshop('MEA'))) {
      const actor = native(actorId, build.id);
      assert.deepEqual(actor.allowedAmmoProfileIds, []); assert.equal(actor.ammoModeId, null);
    }
  }
  const forged = native('ME2-CHR-JACOB');
  forged.allowedAmmoProfileIds.push('ME3-POW-AMMO-WARP'); forged.ammoModeId = 'ME3-POW-AMMO-WARP';
  const next = native('ME2-CHR-JACOB');
  assert.deepEqual(next.allowedAmmoProfileIds, ['ME2-POW-AMMO-INCENDIARY']); assert.equal(next.ammoModeId, null);
});

test('eleven native ammo profiles map to distinct cards while only the ten permitted profiles are exposed', () => {
  const profileIds = UNIVERSE_AMMO_PROFILES.map(profile => profile.id);
  const mapped = UNIVERSE_POWER_MAPPINGS.filter(power => getAmmoActionProfile(power.mediaId, power.actionId));
  assert.deepEqual(mapped.map(power => power.catalogId).sort(), [...profileIds].sort());
  assert.equal(profileIds.length, 11);
  const used = getUniversePowerUsage().filter(power => profileIds.includes(power.catalogId));
  assert.deepEqual(used.map(power => power.catalogId).sort(), profileIds.filter(id => id !== 'ME3-POW-AMMO-WARP').sort());
  assert.equal(getUniversePowerMapping('ME3-POW-AMMO-SHREDDER'), null);
  assert.equal(getUniversePowerMapping('MEA-EQP-AMMO-FIRE'), null);
  assert.equal(getUniversePowerMapping('MEA-EQP-AMMO-CRYO'), null);
  assert.equal(getUniversePowerMapping('MEA-EQP-AMMO-DISRUPT'), null);
  assert.equal(getAmmoActionProfile('MEA', 'ammoIncendiary'), null);
});

test('Garrus ME3 armor-piercing attribution retains its inspected primary image and precise limits', () => {
  const actor = native('ME3-CHR-GARRUS');
  const ammo = actor.powerProvenance.find(power => power.catalogId === 'ME3-POW-AMMO-AP');
  assert.deepEqual(ammo.attributionReference, ME3_GARRUS_AMMO_PRIMARY_REFERENCE);
  assert.match(ammo.attributionReference.sourceUrl, /mass-effect-3-manuals_PC\.pdf$/);
  assert.match(ammo.attributionReference.reference, /page imprimée 5/);
  assert.equal(ammo.attributionReference.sha256, '07ee7dc469e5c6beb85d2050b333647aa29ee9900d83695cfbe28be51726da01');
  assert.match(ammo.attributionVerification, /Primary manual image inspected/);
  assert.match(ammo.attributionVerification, /not ranks, progression or ATB parameters/);
  assert.equal(native('ME2-CHR-GARRUS').powerProvenance.find(power => power.actionId === 'ammoArmorPiercing').attributionReference, undefined);
  assert.equal(actor.powerProvenance.find(power => power.actionId === 'overload').attributionReference, undefined);
});

test('build and actor snapshots cannot mutate shared source mappings or future preparations', () => {
  const actor = native('ME2-CHR-MIRANDA'); actor.powers.length = 0;
  actor.powerProvenance[0].sourceIds.push('forged'); actor.powerProvenance[0].actorCatalogId = 'wrong';
  const next = native('ME2-CHR-MIRANDA');
  assert.deepEqual(next.powers, ['warp', 'overload', 'slam']);
  assert.equal(next.powerProvenance[0].sourceIds.includes('forged'), false);
  assert.equal(next.powerProvenance[0].actorCatalogId, 'ME2-CHR-MIRANDA');
  const build = getUniverseBuild('ME2-CHR-SHEPARD', context('ME2'), 'engineer');
  assert.equal(Object.isFrozen(build), true); assert.equal(Object.isFrozen(build.powers), true);
});
