// Deterministic, detached native battles. Earlier progression is prepared with
// native callbacks; none of it is presented as a played public campaign.
import assert from 'node:assert/strict';
import { access, readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as combat from '../src/combat.js';
import { CLASSES, actorFor, enemiesFor } from '../src/game-data.js';
import { newGame, unlockedZones, zoneEncounters, winEncounter, completeZone, recruit,
  setSquad, buyUpgrade, encodeSave, decodeSave } from '../src/state.js';
import { getBossTargetReason } from '../src/boss-phases.js';

const root = new URL('../', import.meta.url), prefix = process.env.BOSS_PHASE_QA_PREFIX;
assert.match(prefix || '', /^priority-bosses-[a-z0-9-]+$/, 'Choose a fresh BOSS_PHASE_QA_PREFIX for each executed attempt.');
const output = new URL(`docs/qa/${prefix}.json`, root);
try { await access(output); throw Error('Preserve the existing report.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { passed: false, at: new Date().toISOString(), baselineCommit: '259d51267a64404048c1e18a1e549f5a356b63c6',
  scope: 'Paired same-current-engine ME1 boss battles, bossPhases:false/true. Tactical ranges are disabled to isolate this mechanism. Six classes, three difficulties, two bosses and three seeds. Earlier campaign progression is native Node preparation, not played in a browser.',
  sourceHashes: {}, fixtures: [], pairs: [], alerts: [], limitations: [
    'The control is the current native engine with phases disabled, not an old source-code checkout.',
    'No character statistics, ATB gauges, victory callbacks or resources are overwritten inside the detached battles.',
    'The policy omits protected Benezia from hostile targets using the new public targeting guard; all other decisions use the existing campaign QA policy.',
    'Nominal health/shield budgets are preserved, but overkill, regeneration, target count, passive objectives and timing change practical difficulty.',
    'This does not certify original encounter composition, original mechanics, visual fidelity or physical-device performance.',
  ] };
const round = number => Number(number.toFixed(6));
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const sources = ['src/combat.js', 'src/boss-phases.js', 'src/game-data.js', 'src/state.js', 'src/loadout.js',
  'src/character-data.js', 'src/tactical-positions.js', 'src/campaign-talents.js', 'src/mission-progress.js', 'src/combat-summons.js', 'src/combat-medical.js', 'src/universe-ammo.js',
  'src/universe-weapon-profiles.js', 'scripts/simulate-campaign.mjs', 'scripts/boss-phases-comparison.mjs', 'tests/boss-phases.test.js'];
try {
  for (const path of sources) report.sourceHashes[path] = sha(await readFile(new URL(path, root)));
  // Reuse the exact authored policy rather than silently replacing it with an
  // easier boss-specific strategy. The one guard added below is declared.
  const originalPolicy = await readFile(new URL('scripts/simulate-campaign.mjs', root), 'utf8');
  const start = originalPolicy.indexOf('function chooseAction('), end = originalPolicy.indexOf('\nconst round', start);
  assert.ok(start > 0 && end > start);
  const original = originalPolicy.slice(start, end);
  const guard = "let enemies = battle.actors.filter(candidate => candidate.team === 'enemy' && candidate.hp > 0 && !candidate.statuses.stasis);";
  assert.equal(original.split(guard).length, 2);
  const instrumented = original.replace(guard, guard.replace('!candidate.statuses.stasis', '!candidate.statuses.stasis && !getBossTargetReason(battle, candidate)'));
  const chooseAction = new Function('getBossTargetReason', `return (${instrumented});`)(getBossTargetReason);
  report.policy = { source: 'scripts/simulate-campaign.mjs', sourceFunctionSHA256: sha(original), executedFunctionSHA256: sha(instrumented),
    change: 'The exact hostile-target filter additionally excludes a boss protected by the new phase guard. No other action priority changed.' };
  const decisions = { feros: 'save', noveria: 'release', virmire: 'save-kaidan', 'citadel-finale': 'save-council' };
  function prepare(state) {
    state.zone = 'normandy'; state.position = null;
    if (state.flags.spectre) assert.equal(setSquad(state, state.recruited.includes('liara') && !['adept', 'vanguard'].includes(state.classId) ? ['garrus', 'liara'] : ['garrus', 'tali']), true);
    for (let level = 1; level <= 5; level++) for (const id of state.party) for (const [item, stat] of [['rifle', 'attack'], ['shield', 'shield'], ['armor', 'defense']]) {
      if ((state.upgrades[id]?.[stat + 'Count'] || 0) < level) buyUpgrade(state, id, item);
    }
  }
  function beforeBoss(zone, difficulty, classId) {
    const state = newGame({ classId, difficulty, mode: 'wait' }); state.flags.briefed = true; prepare(state);
    for (const current of ['eden-prime', 'citadel', 'therum', 'feros', 'noveria']) {
      assert.ok(unlockedZones(state).includes(current)); state.zone = current;
      if (current === 'citadel') for (const id of ['garrus', 'tali', 'wrex']) assert.equal(recruit(state, id), true);
      for (const id of zoneEncounters(current)) {
        if (current === zone && id === `${zone}:boss`) { assert.ok(decodeSave(encodeSave(state))); return state; }
        assert.equal(winEncounter(state, id), true);
      }
      assert.equal(completeZone(state, current, own(decisions, current) ? decisions[current] : null), true); prepare(state);
    }
    throw Error('Unknown boss fixture');
  }
  function run(state, enabled, seed) {
    const before = structuredClone(state);
    const battle = combat.createBattle({ party: state.party.map(id => actorFor(id, state)), enemies: enemiesFor(state.zone, 2, state),
      difficulty: state.difficulty, mode: 'wait', seed, medigel: state.medigel, bossPhases: enabled, tactical: false });
    assert.equal(!!battle.bossPhases, enabled, 'The phase opt-in must be active in the executed native engine.');
    let iterations = 0, healthFloor = 1;
    while (!battle.winner && battle.elapsed < 300 && iterations++ < 20000) {
      for (const actor of battle.actors.filter(actor => actor.team === 'party')) {
        const action = chooseAction(combat, battle, actor);
        if (action) {
          const result = combat.performAction(battle, { actorId: actor.id, actionId: action[0], targetId: action[1] });
          assert.equal(result.ok, true, `${state.zone}/${action}: ${result.reason}`);
        }
        healthFloor = Math.min(healthFloor, actor.hp / actor.maxHp); if (battle.winner) break;
      }
      combat.tickBattle(battle, .1);
      for (const actor of battle.actors.filter(actor => actor.team === 'party')) healthFloor = Math.min(healthFloor, actor.hp / actor.maxHp);
    }
    assert.deepEqual(state, before, 'A detached battle never mutates its campaign fixture');
    const enemies = battle.actors.filter(actor => actor.team === 'enemy');
    const budget = { hp: round(enemies.reduce((sum, actor) => sum + actor.maxHp, 0)), shield: round(enemies.reduce((sum, actor) => sum + actor.maxShield, 0)) };
    const playerIds = new Set(state.party), playerOrders = battle.events.filter(event => event.type === 'action' && playerIds.has(event.actorId));
    const phaseEvents = battle.events.filter(event => event.type === 'bossPhase');
    if (enabled && battle.winner === 'party') assert.equal(battle.bossPhases.phaseIndex, state.zone === 'feros' ? 6 : 3);
    return { winner: battle.winner, seconds: round(battle.elapsed), actionCount: battle.actionCount,
      playerOrders: playerOrders.length, healthFloorPercent: round(healthFloor * 100),
      partyKO: battle.actors.filter(actor => actor.team === 'party' && actor.hp <= 0).length,
      medigelUsed: state.medigel - battle.medigel, budget, enemyCount: enemies.length,
      phaseIndex: battle.bossPhases?.phaseIndex ?? null, phaseEvents,
      publicVictoryEvents: battle.events.filter(event => event.type === 'victory').length,
      forbiddenIntermediateVictory: battle.events.some(event => event.type === 'victory' && phaseEvents.some(phase => phase.id > event.id)),
      passiveNodeOrders: battle.events.filter(event => event.type === 'action' && enemies.some(actor => actor.id === event.actorId && actor.bossPhaseRole === 'node')).length };
  }
  const fixtureDirectory = `docs/qa/${prefix}-fixtures`; await mkdir(new URL(fixtureDirectory + '/', root), { recursive: true });
  for (const difficulty of ['story', 'normal', 'hard']) for (const classId of Object.keys(CLASSES)) for (const zone of ['feros', 'noveria']) {
    const state = beforeBoss(zone, difficulty, classId), fixturePath = `${fixtureDirectory}/${zone}-${difficulty}-${classId}.json`, fixtureRaw = encodeSave(state);
    await writeFile(new URL(fixturePath, root), fixtureRaw); report.fixtures.push({ path: fixturePath, sha256: sha(fixtureRaw), zone, difficulty, classId,
      xp: state.xp, party: state.party, origin: 'Native newGame/recruit/winEncounter/completeZone/buyUpgrade callbacks; preceding victories are prepared, not played.' });
    for (const offset of [0, 17, 97]) {
      const seed = state.cleared.length + 2183 + offset, baseline = run(state, false, seed), current = run(state, true, seed);
      const pair = { zone, difficulty, classId, seed, fixture: fixturePath, baseline, current,
        secondsDelta: round(current.seconds - baseline.seconds), healthFloorDelta: round(current.healthFloorPercent - baseline.healthFloorPercent) };
      report.pairs.push(pair);
      if (current.forbiddenIntermediateVictory || current.passiveNodeOrders || current.publicVictoryEvents !== 1
        || baseline.winner === 'party' && current.winner !== 'party'
        || current.seconds > baseline.seconds * 2 + 30 || current.partyKO > baseline.partyKO + 1) report.alerts.push({ zone, difficulty, classId, seed, reason: 'Outcome/time/casualty/phase invariant requires review.' });
      if (baseline.winner === 'party' && current.winner === 'party') assert.deepEqual(current.budget, baseline.budget, 'Nominal health/shield pools must match after every actual phase was reached.');
    }
  }
  for (const [path, expected] of Object.entries(report.sourceHashes)) assert.equal(sha(await readFile(new URL(path, root))), expected, `Source changed during comparison: ${path}`);
  report.summary = { pairs: report.pairs.length, detachedBattles: report.pairs.length * 2,
    baselineWins: report.pairs.filter(pair => pair.baseline.winner === 'party').length,
    currentWins: report.pairs.filter(pair => pair.current.winner === 'party').length,
    baselineKO: report.pairs.reduce((sum, pair) => sum + pair.baseline.partyKO, 0),
    currentKO: report.pairs.reduce((sum, pair) => sum + pair.current.partyKO, 0), alerts: report.alerts.length };
  assert.equal(report.pairs.length, 108); assert.deepEqual(report.alerts, []);
  report.passed = true;
} catch (error) { report.failure = error.stack || String(error); process.exitCode = 1; }
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, summary: report.summary, failure: report.failure }));
