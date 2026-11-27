import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { ARMAX_FIGHTERS, ARMAX_STAGES } from '../src/armax-data.js';
import { ARMAX_BOSSES, ARMAX_ENEMIES, ARMAX_CAMPAIGNS } from '../src/armax-expansion-data.js';
import { createArmaxMatch, stepArmaxMatch, armaxCPUInput, nextArmaxRound, requestArmaxFinisher } from '../src/armax-engine.js';
import { ARMAX_CAMPAIGN_KEY, createArmaxCampaign, armaxCampaignEncounter, beginArmaxCampaignBattle, commitArmaxCampaignResult, armaxCampaignEnding, parseArmaxCampaignSave, loadArmaxCampaign, saveArmaxCampaign } from '../src/armax-campaign.js';

const duel = opponent => createArmaxMatch({ fighters: [ARMAX_FIGHTERS[0], opponent], mode: 'cpu' });
const tick = (state, count, input = () => ({})) => { for (let i = 0; i < count; i++) stepArmaxMatch(state, [input(i), armaxCPUInput(state)]); };
const until = (state, predicate, max = 900) => { for (let i = 0; i < max && !predicate(state); i++) tick(state, 1); assert.ok(predicate(state), 'Expected combat state was not reached'); };

test('twenty stages and forty distinct opposition profiles preserve design boundaries', () => {
  assert.equal(ARMAX_STAGES.length, 20);
  assert.equal(ARMAX_BOSSES.length, 20);
  assert.equal(ARMAX_ENEMIES.length, 20);
  assert.equal(new Set([...ARMAX_BOSSES, ...ARMAX_ENEMIES].map(p => p.id)).size, 40);
  for (const profile of [...ARMAX_BOSSES, ...ARMAX_ENEMIES]) {
    assert.equal(profile.fullKitImplemented, false);
    assert.equal(profile.encounter.fullDesignImplemented, false);
    assert.equal(profile.finisherCompatible, false);
    const state = duel(profile);
    assert.equal(state.roundsToWin, 1);
    assert.equal(state.roundFrames, 5940);
    if (profile.assetAvailable) {
      assert.ok(existsSync(new URL(`../public/${profile.sprite}`, import.meta.url)));
      assert.equal(profile.visualBounds.length, 4);
    }
  }
});

test('boss thresholds announce transitions, cancel owned offense and never restore life', () => {
  const s = duel(ARMAX_BOSSES[0]), boss = s.players[1];
  boss.hp = Math.floor(boss.profile.life * .65);
  boss.shield = 70; boss.shieldDelay = 300;
  s.projectiles.push({ id: 31, owner: 1, x: 6, y: 4, vx: 0, life: 90, armed: 0, move: {} });
  const hp = boss.hp;
  stepArmaxMatch(s);
  assert.equal(boss.encounterState.phase, 1);
  assert.equal(boss.hp, hp);
  assert.equal(boss.shield, 70);
  assert.equal(s.projectiles.length, 0);
  assert.equal(boss.action, null);
  assert.equal(boss.encounterState.noticeFrames, 90);
  assert.match(s.lastEvent, /phase 2/);
  boss.hp = Math.floor(boss.profile.life * .32);
  stepArmaxMatch(s);
  assert.equal(boss.encounterState.phase, 2);
  assert.match(s.lastEvent, /phase 3/);
});

test('all twenty bosses have three reachable health phases without healing or invulnerability', () => {
  for (const profile of ARMAX_BOSSES) {
    assert.equal(profile.encounter.phases.length, 3);
    const s = duel(profile), boss = s.players[1];
    boss.shieldDelay = 300;
    for (const [phase, ratio] of [[1, .66], [2, .33]]) {
      boss.hp = Math.floor(profile.life * ratio);
      const hp = boss.hp;
      stepArmaxMatch(s);
      assert.equal(boss.encounterState.phase, phase, profile.id);
      assert.equal(boss.hp, hp, profile.id);
      assert.equal(Object.hasOwn(boss, 'invulnerable'), false);
    }
  }
});

test('a locked zone damages a stationary target but misses a player who leaves its announced footprint', () => {
  function zone(moveAway) {
    const s = duel(ARMAX_BOSSES[0]);
    s.players[1].hp = Math.floor(s.players[1].hp * .6);
    until(s, state => !!state.players[1].action?.area);
    const lock = s.players[1].action.targetX;
    assert.equal(lock, s.players[0].x);
    if (moveAway) s.players[0].x = 4.5;
    tick(s, 65);
    return s.players[0].shield;
  }
  assert.equal(zone(false), 100);
  assert.equal(zone(true), 220);
});

test('boss startup and transition recovery stay vulnerable to ordinary player attacks', () => {
  const s = duel(ARMAX_BOSSES[0]);
  s.players[0].x = 0; s.players[1].x = .7;
  until(s, state => !!state.players[1].action);
  assert.equal(s.players[1].action.encounter, true);
  const before = s.players[1].shield;
  tick(s, 7, i => i === 0 ? { attack: 'L' } : {});
  assert.equal(s.players[1].shield, before - 55);
  assert.equal(s.players[1].action, null);
});

test('fixed machinery keeps its position while still running a telegraphed attack', () => {
  for (const profile of [...ARMAX_BOSSES, ...ARMAX_ENEMIES].filter(p => p.encounter.stationary)) {
    const s = duel(profile), x = s.players[1].x;
    let started = false;
    for (let i = 0; i < 260; i++) {
      tick(s, 1);
      started ||= !!s.players[1].action?.encounter;
      assert.equal(s.players[1].x, x, profile.id);
    }
    assert.equal(started, true, profile.id);
    const pushed = duel(profile);
    pushed.players[0].x = x - .64;
    pushed.players[1].encounterState.noticeFrames = 1000;
    tick(pushed, 60, () => ({ right: true }));
    assert.equal(pushed.players[1].x, x, `${profile.id}: body collision`);
    const shield = pushed.players[1].shield;
    tick(pushed, 12, i => i === 0 ? { attack: 'L' } : {});
    assert.equal(pushed.players[1].shield, shield - 55);
    assert.equal(pushed.players[1].x, x, `${profile.id}: impact recoil`);
    const tech = duel(profile);
    tech.players[0].x = x - .68;
    for (let i = 0; i < 6; i++) stepArmaxMatch(tech, [i === 0 ? { attack: 'throw' } : {}, {}]);
    assert.ok(tech.throwPending);
    stepArmaxMatch(tech, [{}, { attack: 'throw' }]);
    assert.equal(tech.players[1].x, x, `${profile.id}: throw tech`);
  }
});

test('opposition support casts use two finite reserves and never heal health', () => {
  const s = duel(ARMAX_ENEMIES[7]), p = s.players[1];
  p.shield = 0; p.shieldDelay = 300; p.hp -= 50;
  const hp = p.hp;
  until(s, state => state.players[1].specialCharges === 0);
  tick(s, 40);
  assert.equal(p.hp, hp);
  assert.ok(p.shield <= p.profile.shield);
  assert.equal(p.specialCharges, 0);
});

test('a boss loss ends its single round and rejects unsupported finisher presentation', () => {
  const s = duel(ARMAX_BOSSES[0]);
  s.players[0].x = 0; s.players[1].x = .7;
  s.players[1].hp = 1; s.players[1].shield = 0; s.players[1].shieldDelay = 300;
  tick(s, 8, i => i === 0 ? { attack: 'L' } : {});
  assert.equal(s.phase, 'match-over');
  assert.equal(s.result.winner, 0);
  assert.deepEqual(s.result.wins, [1, 0]);
  assert.equal(requestArmaxFinisher(s), false);
  assert.throws(() => { s.result.wins[0] = 9; }, TypeError);
});

test('ten personal routes contain eight linked encounters and one named rival', () => {
  assert.equal(ARMAX_CAMPAIGNS.length, 10);
  for (const route of ARMAX_CAMPAIGNS) {
    const campaign = createArmaxCampaign(route.fighterId);
    assert.equal(route.stageIds.length, 8);
    assert.equal(new Set(route.stageIds).size, 8);
    let rivals = 0;
    for (let i = 0; i < 8; i++) {
      const encounter = armaxCampaignEncounter(campaign, i);
      assert.ok(encounter.stage && encounter.opponent);
      rivals += Number(encounter.rival);
      if (encounter.rival) assert.equal(encounter.opponent.id, route.rivalId);
    }
    assert.equal(rivals, 1);
    assert.equal(armaxCampaignEncounter(campaign, 8), null);
  }
});

test('stage 03 records the real outpost opponent and never claims a Halek victory', () => {
  const campaign = createArmaxCampaign('nacre_ilyra_senn');
  const index = ARMAX_CAMPAIGNS.find(p => p.fighterId === campaign.fighterId).stageIds.indexOf('nacre_stage_03');
  const encounter = armaxCampaignEncounter(campaign, index);
  assert.equal(encounter.opponent.id, 'nacre_enemy_05');
  assert.equal(encounter.outpost, true);
  assert.match(encounter.victory, /Halek Orr n’a pas été affronté/);
});

test('eight fixture combat victories reach the ending exactly once through real match results', () => {
  const campaign = createArmaxCampaign('nacre_mara_vey');
  for (let step = 0; step < 8; step++) {
    const encounter = armaxCampaignEncounter(campaign), token = beginArmaxCampaignBattle(campaign);
    const s = duel(encounter.opponent);
    // Deliberately low-health fixtures verify progression, not combat balance.
    for (let round = 0; round < s.roundsToWin; round++) {
      s.players[0].x = 0; s.players[1].x = .7;
      s.players[1].hp = 1; s.players[1].shield = 0; s.players[1].shieldDelay = 300;
      for (let frame = 0; frame < 8; frame++) stepArmaxMatch(s, [frame === 0 ? { attack: 'L' } : {}, {}]);
      if (s.phase === 'round-over') nextArmaxRound(s);
    }
    assert.equal(s.result.winner, 0);
    assert.equal(commitArmaxCampaignResult(campaign, token, s.result), true);
    assert.equal(commitArmaxCampaignResult(campaign, token, s.result), false);
    assert.equal(campaign.index, step + 1);
  }
  assert.equal(campaign.status, 'completed');
  assert.ok(armaxCampaignEnding(campaign).length > 100);
  assert.equal(beginArmaxCampaignBattle(campaign), null);
  assert.equal(campaign.cleared.length, 8);
});

test('defeat and a stale battle token cannot advance or duplicate a checkpoint', () => {
  const campaign = createArmaxCampaign('nacre_mara_vey');
  assert.equal(armaxCampaignEnding(campaign), null);
  const first = beginArmaxCampaignBattle(campaign);
  assert.equal(commitArmaxCampaignResult(campaign, first, { winner: 1, reason: 'KO_final' }), true);
  assert.equal(campaign.index, 0);
  assert.equal(campaign.status, 'defeat');
  const retry = beginArmaxCampaignBattle(campaign);
  assert.notEqual(first, retry);
  assert.equal(commitArmaxCampaignResult(campaign, first, { winner: 0, reason: 'KO_final' }), false);
  assert.equal(commitArmaxCampaignResult(campaign, retry, { winner: 0, reason: 'temps_ecoule' }), true);
  assert.equal(campaign.index, 1);
});

test('campaign save validation rejects forged indices, awards and impossible endings', () => {
  const valid = createArmaxCampaign('nacre_mara_vey');
  for (const changed of [{ version: 2 }, { fighterId: '__proto__' }, { index: 1 }, { cleared: ['nacre_boss_20'] }, { attempts: NaN }, { status: 'completed' }, { index: 99 }]) {
    assert.equal(parseArmaxCampaignSave(JSON.stringify({ ...valid, ...changed })), null);
  }
  assert.equal(parseArmaxCampaignSave('not json'), null);
  assert.equal(parseArmaxCampaignSave('null'), null);
  assert.equal(parseArmaxCampaignSave(' '.repeat(12001)), null);
});

test('saving and resuming an interrupted encounter touches only the separate Nacre key', () => {
  const values = new Map([['relay-campaign-main', '{existing}'], ['chronicle-progress', '{untouched}']]);
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  const campaign = createArmaxCampaign('nacre_dalo_ruun');
  beginArmaxCampaignBattle(campaign);
  assert.equal(saveArmaxCampaign(storage, campaign), true);
  assert.equal(values.size, 3);
  assert.ok(values.has(ARMAX_CAMPAIGN_KEY));
  const resumed = loadArmaxCampaign(storage);
  assert.equal(resumed.status, 'ready');
  assert.equal(resumed.index, 0);
  assert.deepEqual(resumed.cleared, []);
  assert.equal(values.get('relay-campaign-main'), '{existing}');
  assert.equal(values.get('chronicle-progress'), '{untouched}');
  assert.equal(saveArmaxCampaign({ setItem() { throw new Error('Storage denied'); } }, campaign), false);
});
