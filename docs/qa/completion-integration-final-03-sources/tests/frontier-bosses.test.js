import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { BOSS_ANIMATION_IDS, BOSS_COMBAT_POSES, normalizeBossAnimation, canShowBossAnimation } from '../src/boss-animation-data.js';

const root = new URL('../', import.meta.url);
const json = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const inputs = Object.fromEntries(await Promise.all(BOSS_ANIMATION_IDS.map(async key => [key,
  await json(`public/assets/boss-${key}-animation.json`)])));
const actorFor = key => ({ key, id: `${key}-0`, enemy: true,
  state: { id: `${key}-0`, sprite: key, team: 'enemy' } });

test('all four existing boss families have four distinct bounded native RGBA crops', async () => {
  assert.deepEqual(BOSS_ANIMATION_IDS, ['saren', 'benezia', 'thorian', 'saren-final']);
  for (const key of BOSS_ANIMATION_IDS) {
    const config = normalizeBossAnimation(key, inputs[key]); assert.ok(config, key);
    assert.equal(config.status, 'Prototype');
    assert.deepEqual(Object.keys(config.combat.frames), BOSS_COMBAT_POSES);
    const data = await readFile(new URL(`public/assets/${config.combat.file}`, root));
    assert.equal(data.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(data.toString('ascii', 12, 16), 'IHDR');
    assert.equal(data.readUInt32BE(16), config.combat.width);
    assert.equal(data.readUInt32BE(20), config.combat.height);
    assert.equal(data[25], 6, 'PNG must have a native RGBA colour type');
    const rects = Object.values(config.combat.frames).map(frame => frame.rect);
    for (let i = 0; i < rects.length; i++) for (let j = i+1; j < rects.length; j++) {
      const [x,y,w,h] = rects[i], [xx,yy,ww,hh] = rects[j];
      assert.ok(x+w <= xx || xx+ww <= x || y+h <= yy || yy+hh <= y, `${key} poses overlap`);
    }
    assert.equal(config.combat.frames.aim.heightScale, 1);
    assert.ok(config.combat.frames.down.heightScale < .7, `${key} collapse must retain natural proportions`);
  }
});

test('metadata copies freeze all nested state and discard untrusted additions', () => {
  const input = structuredClone(inputs.saren); input.status = 'Validé'; input.attack = 999;
  input.combat.frames.aim.power = 'new-power';
  const result = normalizeBossAnimation('saren', input);
  assert.equal(result.status, 'Prototype'); assert.equal(result.attack, undefined);
  assert.equal(result.combat.frames.aim.power, undefined);
  assert.ok(Object.isFrozen(result.combat.frames.aim.rect));
  const oldX = result.combat.frames.aim.rect[0]; input.combat.frames.aim.rect[0] += 50;
  assert.equal(result.combat.frames.aim.rect[0], oldX);
  assert.throws(() => { result.combat.frames.aim.pivot[0] = 0; }, TypeError);
});

test('incomplete, cross-family, cross-period, external or malformed metadata fails closed', () => {
  const cases = [
    input => { delete input.combat.frames.down; },
    input => { input.characterId = 'saren-final'; },
    input => { input.character = 'saren-final'; },
    input => { input.mediaId = 'ME2'; },
    input => { input.periodId = 'me3'; },
    input => { input.combat.file = 'https://example.com/saren.png'; },
    input => { input.combat.url = '../boss-saren-combat.png'; },
    input => { input.combat.width = Infinity; },
    input => { input.combat.frames.aim.rect[0] = -1; },
    input => { input.combat.frames.hit.rect[2] = 9000; },
    input => { input.combat.frames.down.pivot[1] = NaN; },
    input => { input.combat.frames.power.heightScale = 0; },
    input => { input.combat.frames.hit.id = 'benezia-combat-hit'; },
    input => { input.combat.frames.aim.pose = 'power'; },
  ];
  for (const mutate of cases) {
    const input = structuredClone(inputs.saren); mutate(input);
    assert.equal(normalizeBossAnimation('saren', input), null);
  }
  assert.equal(normalizeBossAnimation('clone-asari', inputs.benezia), null);
  assert.equal(normalizeBossAnimation('saren', []), null);
  assert.equal(normalizeBossAnimation('saren', Object.create(inputs.saren)), null);
});

test('native ME1 boss instances accept legacy scope and matching explicit scope', () => {
  for (const key of BOSS_ANIMATION_IDS) {
    const actor = actorFor(key); assert.equal(canShowBossAnimation(actor), true);
    actor.mediaId = actor.state.mediaId = 'ME1'; actor.periodId = actor.state.periodId = 'me1';
    actor.context = actor.state.context = { mediaId: 'ME1', periodId: 'me1' };
    assert.equal(canShowBossAnimation(actor), true);
    assert.equal(canShowBossAnimation(actor, { ...actor.state, id: `${key}-1` }), false);
  }
});

test('player, NPC, foreign media/period and Chronicle IDs never borrow campaign boss art', () => {
  const mutations = [
    actor => { actor.enemy = false; },
    actor => { actor.state.team = 'party'; },
    actor => { actor.state.sprite = 'benezia'; },
    actor => { actor.id = actor.state.id = 'chronicle-ME1-saren-0'; },
    actor => { actor.id = actor.state.id = 'saren-final-0'; },
    actor => { actor.id = actor.state.id = 'saren-0-extra'; },
    actor => { actor.mediaId = 'ME3'; },
    actor => { actor.periodId = 'me2'; },
    actor => { actor.context = { mediaId: 'MEA' }; },
    actor => { actor.context = { periodId: 'me3' }; },
    actor => { actor.state.mediaId = 'ME2'; },
    actor => { actor.state.periodId = 'me3'; },
    actor => { actor.state.context = { mediaId: 'ME3' }; },
    actor => { actor.state.context = { periodId: 'me2' }; },
    actor => { actor.state.mediaId = null; },
  ];
  for (const mutate of mutations) {
    const actor = actorFor('saren'); mutate(actor); assert.equal(canShowBossAnimation(actor), false);
  }
  assert.equal(canShowBossAnimation(null), false);
  assert.equal(canShowBossAnimation({ ...actorFor('saren'), key: 'geth' }), false);
});

test('current native-copy, frame and browser-review evidence matches each committed PNG', async () => {
  for (const key of BOSS_ANIMATION_IDS) {
    const report = await json(`docs/qa/frontier-boss-${key}-art.json`);
    const bytes = await readFile(new URL(report.png, root));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), report.sha256);
    assert.equal(report.nativeCopyVerified, true); assert.equal(report.pixelEditingApplied, false);
    assert.equal(report.visiblePixelsUnassigned, 0); assert.equal(report.visiblePixelsShared, 0);
    for (const frame of Object.values(report.frames)) assert.ok(Math.min(...frame.visibleAlpha51Margin) >= 8);
    assert.equal(report.actuallyOpened, true); assert.equal(report.nativeBrowserReview.passed, true);
    assert.equal(report.nativeBrowserReview.servedSHA256, report.sha256);
    for (const capture of report.nativeBrowserReview.captures) {
      assert.equal(capture.actuallyOpened, true);
      const image = await readFile(new URL(capture.path, root));
      assert.equal(createHash('sha256').update(image).digest('hex'), capture.sha256);
    }
  }
});
