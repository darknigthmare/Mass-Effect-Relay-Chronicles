// Paired native ATB comparison. Earlier progression is prepared through the
// frozen baseline callbacks; these detached fights do not claim new map or
// mission milestones were traversed in a browser.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import * as current from '../src/combat.js';
import * as currentData from '../src/game-data.js';
import { createCombatGeometry, loadCombatGeometry } from './completion-combat-geometry.mjs';

const root = fileURLToPath(new URL('../', import.meta.url)), baselineCommit = execFileSync('git', ['rev-parse', '0d76912'], { cwd: root, encoding: 'utf8' }).trim();
const prefix = process.env.COMPLETION_COMBAT_PREFIX || 'completion-combat-balance-01';
assert.match(prefix, /^completion-combat-[a-z0-9-]+$/);
const output = path.join(root, `docs/qa/${prefix}.json`), snapshotRoot = path.join(root, `docs/qa/${prefix}-baseline-sources`);
try { await fs.access(output); throw Error('Preserve the previous attempt and choose a new COMPLETION_COMBAT_PREFIX.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const frozen = new Map();
async function freezeModule(filename) {
  if (frozen.has(filename)) return;
  assert.ok(filename.startsWith('src/') && filename.endsWith('.js'));
  const bytes = execFileSync('git', ['show', `${baselineCommit}:${filename}`], { cwd: root });
  frozen.set(filename, sha(bytes));
  const destination = path.join(snapshotRoot, filename); await fs.mkdir(path.dirname(destination), { recursive: true }); await fs.writeFile(destination, bytes);
  for (const match of bytes.toString('utf8').matchAll(/(?:from\s*|import\s*)['"](\.\.?\/[^'"]+\.js)['"]/g)) {
    const dependency = path.posix.normalize(path.posix.join(path.posix.dirname(filename), match[1])); await freezeModule(dependency);
  }
}
await freezeModule('src/combat.js'); await freezeModule('src/state.js'); await freezeModule('src/operations.js');
const baseline = await import(pathToFileURL(path.join(snapshotRoot, 'src/combat.js')));
const baselineData = await import(pathToFileURL(path.join(snapshotRoot, 'src/game-data.js')));
const stateAPI = await import(pathToFileURL(path.join(snapshotRoot, 'src/state.js')));
const operationAPI = await import(pathToFileURL(path.join(snapshotRoot, 'src/operations.js')));
const missionAPI = await import(pathToFileURL(path.join(snapshotRoot, 'src/mission-progress.js')));
const worlds = new Map();
function geometry(state, id) {
  const stateKey = JSON.stringify(state);
  const previous = worlds.get(state.zone);
  const world = previous?.world || createCombatGeometry(state.zone, { state });
  if (previous && previous.stateKey !== stateKey) loadCombatGeometry(world, state.zone, state);
  worlds.set(state.zone, { world, stateKey });
  const poi = world.getInteractivePOIs().find(p => p.id === id);
  assert.ok(poi, `Missing real encounter position: ${id}`); world.setPosition(poi);
  const arena = world.getCombatArena();
  return { tacticalPositionAllowed: point => world._walkable(arena.x + point.x, arena.z + point.z),
    tacticalCoverAvailable: query => world.getTacticalCoverState(query, arena) };
}
function advanceRequiredMission(state) {
  const view = missionAPI.getMissionProgress(state);
  if (!view?.canStart || view.complete) return;
  assert.equal(missionAPI.advanceMission(state, state.zone, 'start').ok, true);
  for (const step of missionAPI.MISSION_DEFINITIONS[state.zone].steps) {
    state.position = { x: step.x, z: step.z };
    const choice = state.zone === 'eden-prime' ? 'disarm' : state.zone === 'noveria' ? 'repair' : step.id === 'vigil' ? 'activate' : 'enter';
    assert.equal(missionAPI.advanceMission(state, `mission:${state.zone}:${step.id}`, choice).ok, true);
    if (state.zone === 'eden-prime') missionAPI.tickMission(state, 6, { position: state.position });
  }
  assert.equal(missionAPI.getMissionProgress(state).complete, true);
}
const report = { passed: false, at: new Date().toISOString(), baselineCommit,
  scope: 'Three classes and three difficulties, all 21 campaign formations and all five optional combat slots, paired at identical legally prepared baseline campaign snapshots. Native default-current equality is checked separately; enabled baseline/current fights use identical real zone ground and directional cover callbacks, tactical positions and adapted boss phases.',
  commands: { command: 'node scripts/completion-combat-balance.mjs', environment: { COMPLETION_COMBAT_PREFIX: prefix } },
  sourceHashes: {}, currentSnapshots: [], baselineSnapshots: [], pairs: [], defaultCompatibility: [], campaigns: [], flags: [],
  limitations: ['Earlier campaign progression uses frozen native baseline callbacks; current mission milestone gates, paths and UI are verified separately.',
    'One deterministic Wait policy, two seeds and three classes are sampled. It is not human/Active-mode balancing or original-game damage certification.',
    'No actor HP, ATB, reward, victory or currency is forced in these fights; resources at each encounter come from the baseline legal campaign.',
    'Movement/phase-aware target validation extends the same policy for enabled fights; real ground/cover callbacks use actual current zone builders, while texture requests and renderer creation are omitted. This is not a browser visibility proof.',
    'No new talent ranks are purchased here; their class guards, costs and real combat effects have separate regression/browser checks.'] };
for (const [filename, expected] of frozen) {
  const stored = path.relative(root, path.join(snapshotRoot, filename)); report.baselineSnapshots.push({ originalPath: filename, storedPath: stored, sha256: expected });
}
async function freezeCurrent(filename) {
  if (Object.hasOwn(report.sourceHashes, filename)) return;
  const bytes = await fs.readFile(path.join(root, filename)); report.sourceHashes[filename] = sha(bytes);
  const storedPath = `docs/qa/${prefix}-current-sources/${filename}`;
  await fs.mkdir(path.dirname(path.join(root, storedPath)), { recursive: true }); await fs.writeFile(path.join(root, storedPath), bytes);
  report.currentSnapshots.push({ path: filename, storedPath, sha256: sha(bytes) });
  for (const match of bytes.toString().matchAll(/(?:from\s*|import\s*\(?\s*)['"](\.\.?\/[^'"]+\.(?:js|mjs))['"]/g)) {
    await freezeCurrent(path.posix.normalize(path.posix.join(path.posix.dirname(filename), match[1])));
  }
}
for (const filename of ['src/combat.js', 'src/world.js', 'src/game-data.js', 'src/loadout.js', 'scripts/completion-combat-balance.mjs']) await freezeCurrent(filename);

const route = ['eden-prime', 'citadel', 'therum', 'feros', 'noveria', 'virmire', 'ilos', 'citadel-finale'];
const decisions = { feros: 'save', noveria: 'release', virmire: 'save-kaidan', 'citadel-finale': 'save-council' };
const difficulties = ['story', 'normal', 'hard'], classes = ['soldier', 'engineer', 'adept'], offsets = [0, 97];
const round = number => Number(number.toFixed(6));

function prepare(state) {
  state.zone = 'normandy'; state.position = null;
  if (state.flags.spectre) assert.ok(stateAPI.setSquad(state, state.recruited.includes('liara') && state.classId !== 'adept' ? ['garrus', 'liara'] : ['garrus', 'tali']));
  for (let level = 1; level <= 5; level++) for (const id of state.party) {
    for (const [item, stat] of [['rifle', 'attack'], ['shield', 'shield'], ['armor', 'defense']]) {
      if ((state.upgrades[id]?.[`${stat}Count`] || 0) < level) stateAPI.buyUpgrade(state, id, item);
    }
  }
}

function choose(engine, battle, actor) {
  const actions = engine.getActions(battle, actor.id).filter(action => action.available);
  const can = id => actions.some(action => action.id === id);
  const fallback = () => ['cover', 'reposition', 'withdraw', 'advance'].find(can);
  const valid = (actionId, targetId) => !battle.tactical && !battle.bossPhases || engine.getTargetAvailability(battle, { actorId: actor.id, actionId, targetId }).ok;
  const allies = battle.actors.filter(candidate => candidate.team === 'party');
  let enemies = battle.actors.filter(candidate => candidate.team === 'enemy' && candidate.hp > 0 && !candidate.statuses.stasis);
  if (enemies.some(enemy => !enemy.statuses.hacked)) enemies = enemies.filter(enemy => !enemy.statuses.hacked);
  enemies.sort((left, right) => left.hp + left.shield - right.hp - right.shield);
  const pick = (actionId, candidates) => can(actionId) ? candidates.find(target => valid(actionId, target.id)) : null;
  const target = enemies[0];
  const commands = [];
  if (can('unity')) commands.push(['unity', actor.id]);
  const hurt = allies.filter(ally => ally.hp > 0 && ally.hp / ally.maxHp < .65).sort((left, right) => left.hp / left.maxHp - right.hp / right.maxHp)[0];
  if (hurt && can('medigel')) commands.push(['medigel', hurt.id]);
  if (!target) return fallback() ? [fallback(), actor.id] : null;
  if (actor.shield < actor.maxShield * .2 && actor.hp < actor.maxHp * .8 && enemies.some(enemy => enemy.atb > 40) && can('cover')) commands.push(['cover', actor.id]);
  for (const actionId of ['signature', ...(target.hp + target.shield < actor.attack * .85 ? ['shoot'] : [])]) {
    const found = pick(actionId, enemies); if (found) commands.push([actionId, found.id]);
  }
  if (can('barrier') && actor.shield < actor.maxShield * .22) commands.push(['barrier', actor.id]);
  const shielded = pick('overload', enemies.filter(enemy => enemy.shield > actor.attack * 1.1)); if (shielded) commands.push(['overload', shielded.id]);
  const hackable = pick('hack', enemies.filter(enemy => enemy.synthetic && !enemy.hackImmune && !enemy.statuses.hacked).sort((left, right) => right.attack - left.attack));
  if (enemies.length > 1 && hackable) commands.push(['hack', hackable.id]);
  if (enemies.filter(enemy => !enemy.statuses.singularity && !enemy.statuses.lift).length >= 3) { const found = pick('singularity', enemies); if (found) commands.push(['singularity', found.id]); }
  const airborne = pick('throw', enemies.filter(enemy => enemy.statuses.lift || enemy.statuses.singularity)); if (airborne) commands.push(['throw', airborne.id]);
  const warped = pick('warp', enemies.filter(enemy => enemy.maxHp >= 160 && !enemy.statuses.warp)); if (warped) commands.push(['warp', warped.id]);
  const threat = pick('lift', enemies.filter(enemy => enemy.atb >= 65 && !enemy.statuses.lift && !enemy.statuses.singularity && !enemy.statuses.stagger)); if (threat) commands.push(['lift', threat.id]);
  const armed = pick('sabotage', enemies.filter(enemy => !['strike', 'acid'].includes(enemy.primaryAction) && !enemy.statuses.sabotage && enemy.atb >= 55)); if (armed) commands.push(['sabotage', armed.id]);
  for (const actionId of ['throw', 'overload', ...(actor.heat <= 45 ? ['burst'] : []), 'shoot']) {
    const found = pick(actionId, actionId === 'overload' ? enemies.filter(enemy => enemy.synthetic) : enemies); if (found) commands.push([actionId, found.id]);
  }
  for (const [actionId, targetId] of commands) if (valid(actionId, targetId)) return [actionId, targetId];
  if (can('advance')) return ['advance', actor.id];
  return fallback() ? [fallback(), actor.id] : null;
}

function fight(engine, definitions, state, id, seed, enabled) {
  const battle = engine.createBattle({ party: state.party.map(actorId => baselineData.actorFor(actorId, state)), enemies: definitions,
    difficulty: state.difficulty, mode: 'wait', seed, medigel: state.medigel,
    ...(enabled ? { tactical: true, bossPhases: true, ...geometry(state, id) } : {}) });
  let minimum = 1, iterations = 0;
  while (!battle.winner && battle.elapsed < 420 && iterations++ < 30000) {
    for (const actor of battle.actors.filter(candidate => candidate.team === 'party')) {
      const action = choose(engine, battle, actor);
      if (action) { const result = engine.performAction(battle, { actorId: actor.id, actionId: action[0], targetId: action[1] }); assert.ok(result.ok, `${id}: ${action} ${result.reason}`); }
      minimum = Math.min(minimum, actor.hp / actor.maxHp); if (battle.winner) break;
    }
    engine.tickBattle(battle, .1);
    for (const actor of battle.actors.filter(candidate => candidate.team === 'party')) minimum = Math.min(minimum, actor.hp / actor.maxHp);
  }
  const record = { winner: battle.winner, seconds: round(battle.elapsed), actionCount: battle.actionCount, minimumHealthPercent: round(minimum * 100),
    partyKO: battle.events.filter(event => event.type === 'defeat' && state.party.includes(event.targetId)).length,
    medigelUsed: state.medigel - battle.medigel, timedOut: !battle.winner,
    moves: battle.events.filter(event => event.type === 'tacticalMove').length,
    bossPhaseEvents: battle.events.filter(event => event.type === 'bossPhase').length,
    remaining: battle.actors.filter(actor => actor.team === 'party').map(actor => ({ id: actor.id, hp: round(actor.hp), shield: round(actor.shield) })) };
  return { battle, record };
}

function paired(state, id, definitions) {
  const beforeState = JSON.stringify(state), context = { id, difficulty: state.difficulty, classId: state.classId,
    xp: state.xp, party: [...state.party], completed: [...state.completed], cleared: [...state.cleared], medigel: state.medigel };
  let actual;
  for (const offset of offsets) {
    const seed = state.cleared.length + 2183 + offset;
    const original = fight(baseline, definitions, state, id, seed, false), disabled = fight(current, definitions, state, id, seed, false);
    const before = fight(baseline, definitions, state, id, seed, true), after = fight(current, definitions, state, id, seed, true);
    assert.deepEqual(disabled.record, original.record, `Default-current changed the native baseline: ${id}`);
    assert.deepEqual(disabled.battle.actors, original.battle.actors, `Default actor delta: ${id}`);
    assert.equal(disabled.battle._rng(), original.battle._rng(), `Default random stream delta: ${id}`);
    report.defaultCompatibility.push({ ...context, seed, exactActorAndOutcomeEquality: true, identicalNextRandomDraw: true });
    const delta = { seconds: round(after.record.seconds - before.record.seconds), minimumHealthPercent: round(after.record.minimumHealthPercent - before.record.minimumHealthPercent),
      partyKO: after.record.partyKO - before.record.partyKO, medigelUsed: after.record.medigelUsed - before.record.medigelUsed };
    report.pairs.push({ context, seed, before: before.record, after: after.record, delta });
    if (after.record.winner !== 'party' || after.record.partyKO > 0) report.flags.push({ ...context, seed, delta, outcome: after.record, reason: 'Enabled defeat/timeout or a party KO requires review.' });
    if (offset === 0) actual = before;
  }
  assert.equal(JSON.stringify(state), beforeState, 'Detached fights must not change the campaign snapshot');
  return actual;
}

function optional(state, operationId, choices) {
  const detached = structuredClone(state);
  for (const [stepId, choiceId] of choices) {
    const result = operationAPI.advanceOperation(detached, operationId, stepId, choiceId); assert.equal(result.ok, true, `${operationId}/${stepId}: ${result.reason}`);
    if (result.battle) {
      const before = paired(detached, result.battle.id, result.battle.enemies); assert.equal(before.battle.winner, 'party');
      assert.equal(operationAPI.finishOperationBattle(detached, operationId, stepId, true).ok, true);
      detached.medigel = before.battle.medigel;
    }
  }
}

try {
  assert.deepEqual(currentData.ENCOUNTERS, baselineData.ENCOUNTERS, 'This lot must not edit campaign formations.');
  for (const difficulty of difficulties) for (const classId of classes) {
    const state = stateAPI.newGame({ difficulty, classId, mode: 'wait' }); state.flags.briefed = true; prepare(state);
    let victories = 0;
    for (const zone of route) {
      assert.ok(stateAPI.unlockedZones(state).includes(zone)); state.zone = zone;
      if (zone === 'citadel') {
        for (const id of ['garrus', 'tali', 'wrex']) assert.equal(stateAPI.recruit(state, id), true);
        optional(state, 'citadel-doctor-michel', [['request', 'accept'], ['morlan', 'question'], ['blackmailer', 'fight']]);
      }
      for (const id of stateAPI.zoneEncounters(zone)) {
        advanceRequiredMission(state);
        const actual = paired(state, id, baselineData.enemiesFor(zone, stateAPI.encounterIndex(id), state));
        assert.equal(actual.battle.winner, 'party', `Baseline could not reach the next snapshot: ${id}`);
        state.medigel = actual.battle.medigel; assert.equal(stateAPI.winEncounter(state, id), true); victories++;
        if (id === 'feros:encounter-1') {
          optional(state, 'feros-geth-tunnels', [['request', 'accept'], ['patrol', 'fight'], ['guards', 'fight']]);
          optional(state, 'feros-data-recovery', [['request', 'accept'], ['guards', 'fight']]);
          optional(state, 'feros-varrens', [['request', 'accept'], ['pack', 'fight']]);
        }
      }
      advanceRequiredMission(state);
      assert.equal(stateAPI.completeZone(state, zone, decisions[zone]), true); assert.ok(stateAPI.decodeSave(stateAPI.encodeSave(state))); prepare(state);
    }
    assert.equal(victories, 21); assert.equal(state.ending, true); report.campaigns.push({ difficulty, classId, baselineEndingReached: true, baselineVictories: victories });
  }
  assert.equal(report.pairs.length, 26 * 3 * 3 * offsets.length);
  report.summary = { pairs: report.pairs.length, nativeBattles: report.pairs.length * 4, defaultIdenticalCases: report.defaultCompatibility.length,
    campaignSlots: 21, optionalSlots: 5, classes, difficulties, seeds: offsets,
    beforeVictories: report.pairs.filter(pair => pair.before.winner === 'party').length,
    enabledVictories: report.pairs.filter(pair => pair.after.winner === 'party').length,
    enabledTimeouts: report.pairs.filter(pair => pair.after.timedOut).length,
    enabledKOEvents: report.pairs.reduce((sum, pair) => sum + pair.after.partyKO, 0), flags: report.flags.length };
  for (const [filename, expected] of Object.entries(report.sourceHashes)) assert.equal(sha(await fs.readFile(path.join(root, filename))), expected, `Source changed during comparison: ${filename}`);
  assert.deepEqual(report.flags, []); report.passed = true;
} catch (error) { report.failure = error.stack || String(error); process.exitCode = 1; }
await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, summary: report.summary, flags: report.flags.length, failure: report.failure }));
