// Paired formation comparison using the existing campaign policy, unchanged
// in memory except for observation, an explicit enemy list and seed offsets.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as engine from '../src/combat.js';
import { CLASSES, ENEMIES, ENCOUNTERS, actorFor, enemiesFor } from '../src/game-data.js';

const root = new URL('../', import.meta.url), baselineCommit = 'ff8a1cf7fd343d2bb8df6b01d5f18f3f5e7723cd';
const hash = value => createHash('sha256').update(value).digest('hex');
const policyURL = new URL('scripts/simulate-campaign.mjs', root);
const policySource = await readFile(policyURL, 'utf8');
function replaceOnce(source, from, to) {
  assert.equal(source.split(from).length, 2, `Expected one stable policy hook: ${from}`);
  return source.replace(from, to);
}
function localModule(source, originalURL) {
  const resolved = source.replace(/(from\s*['"])(\.\.?\/[^'"]+)(['"])/g,
    (_match, before, path, after) => before + new URL(path, originalURL).href + after)
    .replaceAll('import.meta.url', JSON.stringify(originalURL.href));
  return 'data:text/javascript;base64,' + Buffer.from(resolved).toString('base64');
}
// Read the actual starting revision rather than reproducing its profiles by hand.
const baselineSource = execFileSync('git', ['show', `${baselineCommit}:src/game-data.js`], { cwd: fileURLToPath(root), encoding: 'utf8' });
const baseline = await import(localModule(baselineSource, new URL('src/game-data.js', root)));
for (const [key, profile] of Object.entries(baseline.ENEMIES)) assert.deepEqual(ENEMIES[key], profile, `Existing profile changed: ${key}`);
const changed = [];
for (const [zone, rows] of Object.entries(baseline.ENCOUNTERS)) {
  assert.equal(ENCOUNTERS[zone].length, rows.length);
  for (let index = 0; index < rows.length; index++) {
    if (JSON.stringify(rows[index]) !== JSON.stringify(ENCOUNTERS[zone][index])) {
      assert.notEqual(zone, 'eden-prime'); assert.notEqual(zone, 'feros'); assert.ok(index < 2);
      changed.push({ zone, index, before: rows[index], after: ENCOUNTERS[zone][index] });
    }
  }
}
assert.equal(changed.length, 6);
const cliMarker = '\nconst options = parseOptions();';
assert.equal(policySource.split(cliMarker).length, 2);
let observedPolicy = policySource.split(cliMarker)[0];
observedPolicy = replaceOnce(observedPolicy,
  'function runEncounter(engine, state, zone, id) {',
  'function runEncounter(engine, state, zone, id, explicitEnemies = null, seedOffset = 0) {');
observedPolicy = replaceOnce(observedPolicy,
  'const seed = state.cleared.length + 2183;', 'const seed = state.cleared.length + 2183 + seedOffset;');
observedPolicy = replaceOnce(observedPolicy,
  'enemies: enemiesFor(zone, encounterIndex(id), state),', 'enemies: explicitEnemies || enemiesFor(zone, encounterIndex(id), state),');
observedPolicy = replaceOnce(observedPolicy,
  'function runCampaign(engine, difficulty, classId) {', 'function runCampaign(engine, difficulty, classId, beforeEncounter = () => {}) {');
observedPolicy = replaceOnce(observedPolicy,
  'const { battle, record } = runEncounter(engine, state, zone, id);',
  'beforeEncounter(state, zone, id);\n      const { battle, record } = runEncounter(engine, state, zone, id);');
observedPolicy += '\nexport { runEncounter, runCampaign };\n';
const policy = await import(localModule(observedPolicy, policyURL));
const report = { passed: false, generatedAt: new Date().toISOString(), baselineCommit,
  scope: 'Six changed regular formations; paired actual ATB battles at identical legally reached campaign snapshots. Current engine, existing automated Wait policy, no forced HP/ATB/resources/victory.',
  sourceHashes: { 'src/game-data.js@baseline': hash(baselineSource), 'scripts/simulate-campaign.mjs': hash(policySource),
    'scripts/frontier-enemies-balance.mjs': hash(await readFile(new URL(import.meta.url))) },
  changedFormations: changed, unchanged: { edenPrime: true, feros: true, allBossFormations: true, existingProfiles: true },
  seedOffsets: [0, 97, 211], pairs: [], campaigns: [], flags: [], limits: [
    'One fixed campaign order and an automated Wait policy; not human or Active-mode balancing.',
    'Secondary seeds reuse the same genuine pre-encounter snapshot; their rewards never enter the campaign.',
    'Time/health deltas are reported; partial original mechanics are not simulated or certified.' ] };
const indexFor = id => id.endsWith(':boss') ? 2 : Number(id.at(-1)) - 1;
const summarize = ({ battle, record }) => ({ ...record, remainingPartyHealth: battle.actors.filter(actor => actor.team === 'party')
  .map(actor => ({ id: actor.id, hp: actor.hp, shield: actor.shield })) });
for (const difficulty of ['story', 'normal', 'hard']) for (const classId of Object.keys(CLASSES)) {
  const campaign = policy.runCampaign(engine, difficulty, classId, (state, zone, id) => {
    const index = indexFor(id), formation = changed.find(item => item.zone === zone && item.index === index);
    if (!formation) return;
    const immutable = structuredClone(state), party = state.party.map(actorId => actorFor(actorId, state));
    const fixture = { classId, difficulty, id, xp: state.xp, level: party[0].level,
      completed: [...state.completed], party: party.map(actor => ({ id: actor.id, level: actor.level,
        hp: actor.hp, shield: actor.shield, attack: actor.attack, defense: actor.defense, powers: actor.powers })),
      medigel: state.medigel, upgrades: structuredClone(state.upgrades) };
    for (const offset of report.seedOffsets) {
      const before = summarize(policy.runEncounter(engine, state, zone, id, baseline.enemiesFor(zone, index, state), offset));
      const after = summarize(policy.runEncounter(engine, state, zone, id, enemiesFor(zone, index, state), offset));
      assert.equal(after.seed, before.seed); assert.deepEqual(after.party, before.party);
      assert.deepEqual(state, immutable, 'Detached comparisons must leave the actual campaign unchanged.');
      const delta = { seconds: Number((after.seconds - before.seconds).toFixed(2)),
        minHealthPercent: Number((after.minHealthPercent - before.minHealthPercent).toFixed(6)),
        partyKO: after.partyKO - before.partyKO, medigelUsed: after.medigelUsed - before.medigelUsed };
      const pair = { fixture, before, after, delta }; report.pairs.push(pair);
      if (after.winner !== 'party' || delta.partyKO > 0 || delta.minHealthPercent < -15)
        report.flags.push({ classId, difficulty, id, seed: after.seed, delta, reason: 'defeat, additional KO or health-floor reduction beyond 15 percentage points' });
    }
  });
  assert.equal(campaign.endingReached, true); assert.equal(campaign.won, 21); report.campaigns.push(campaign);
}
assert.equal(report.pairs.length, 324);
report.summary = { pairs: report.pairs.length, detachedBattles: report.pairs.length * 2,
  baselineWins: report.pairs.filter(pair => pair.before.winner === 'party').length,
  currentWins: report.pairs.filter(pair => pair.after.winner === 'party').length,
  baselineKO: report.pairs.reduce((sum, pair) => sum + pair.before.partyKO, 0),
  currentKO: report.pairs.reduce((sum, pair) => sum + pair.after.partyKO, 0), flags: report.flags.length,
  actualCampaigns: report.campaigns.length, actualCampaignWins: report.campaigns.reduce((sum, campaign) => sum + campaign.won, 0),
  formations: changed.map(formation => {
    const pairs = report.pairs.filter(pair => pair.fixture.id === `${formation.zone}:encounter-${formation.index + 1}`);
    const average = field => Number((pairs.reduce((sum, pair) => sum + pair.delta[field], 0) / pairs.length).toFixed(3));
    return { ...formation, pairs: pairs.length, meanSecondsDelta: average('seconds'), meanHealthFloorDelta: average('minHealthPercent'),
      worstHealthFloorDelta: Math.min(...pairs.map(pair => pair.delta.minHealthPercent)),
      baselineKO: pairs.reduce((sum, pair) => sum + pair.before.partyKO, 0), currentKO: pairs.reduce((sum, pair) => sum + pair.after.partyKO, 0) };
  }) };
for (const path of ['src/game-data.js', 'src/frontier-enemies.js', 'src/combat.js', 'src/state.js'])
  report.sourceHashes[path] = hash(await readFile(new URL(path, root)));
report.passed = report.summary.currentWins === report.pairs.length && report.flags.length === 0;
await writeFile(new URL('docs/qa/frontier-enemies-balance.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, ...report.summary }, null, 2));
if (!report.passed) process.exitCode = 1;
