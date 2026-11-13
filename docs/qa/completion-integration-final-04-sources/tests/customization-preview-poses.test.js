import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { newGame } from '../src/state.js';
import { createCustomizationDraft, initialCustomization } from '../src/customization.js';
import { CUSTOMIZATION_POSES, renderCustomizationScreen, paintCustomizationPreview } from '../src/customization-ui.js';

// Deliberately small fixture rectangles exercise geometry without fabricating
// visual evidence. Browser checks use the actual authored male/female atlases.
const male = { schemaVersion: 1, appearance: 'male', combat: { file: 'unit-preview-male-combat.png', width: 160, height: 120, frames: {
  aim: { id: 'unit-male-aim', pose: 'aim', rect: [0, 0, 40, 80], pivot: [20, 78], heightScale: 1 },
  power: { id: 'unit-male-power', pose: 'power', rect: [40, 0, 60, 80], pivot: [24, 78], heightScale: 1 },
  hit: { id: 'unit-male-hit', pose: 'hit', rect: [100, 0, 45, 60], pivot: [22, 58], heightScale: .75 },
  down: { id: 'unit-male-down', pose: 'down', rect: [0, 90, 120, 25], pivot: [60, 24], heightScale: .3, headRegion: [.03, .1, .15, .75] },
} } };
const female = JSON.parse(readFileSync(new URL('../public/assets/shepard-female-animation.json', import.meta.url)));
const close = (actual, expected, description) => assert.ok(Math.abs(actual - expected) < 1e-9,
  `${description}: expected ${expected}, received ${actual}`);
const capture = value => JSON.stringify(value);
const model = (appearance = 'male') => {
  const state = newGame({ appearance }), draft = createCustomizationDraft(state);
  return { state, draft, ui: { customizationDraft: draft, customTab: 'armor', customSlot: 'armor',
    customView: 'back', customPose: 'field', customCompare: false, customItem: null } };
};

async function withGlobals(values, operation) {
  const originals = new Map(Object.keys(values).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(values)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  try { return await operation(); }
  finally {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
}
const withMetadata = operation => withGlobals({ __RELAY_MALESHEP_ANIMATION__: male, __RELAY_FEMSHEP_ANIMATION__: female }, operation);

function buttons(html, action) {
  return [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)]
    .filter(([, attrs]) => attrs.includes(`data-do="${action}"`))
    .map(([, attrs, text]) => ({ id: /data-id="([^"]*)"/.exec(attrs)?.[1], text,
      pressed: /aria-pressed="true"/.test(attrs), disabled: /(?:^|\s)disabled(?:\s|$|=)/.test(attrs) }));
}

function makeCanvas(width = 0, height = 0) {
  const canvas = { width, height, dataset: {}, isConnected: true };
  const context = { draws: [], writes: [], clearRect() {},
    drawImage(...args) { this.draws.push(args); },
    getImageData() { return { width: canvas.width, height: canvas.height, data: new Uint8ClampedArray(canvas.width * canvas.height * 4) }; },
    putImageData(...args) { this.writes.push(args); },
  };
  canvas.getContext = () => context;
  canvas.context = context;
  return canvas;
}

async function paint(state, ui, width = 960, height = 720) {
  const target = makeCanvas(width, height), intermediates = [], classes = new Set();
  const status = { isConnected: true, hidden: false, textContent: '', classList: { add: value => classes.add(value) } };
  const root = { querySelector: selector => selector === '[data-custom-canvas]' ? target : status };
  const document = { createElement(tag) { assert.equal(tag, 'canvas'); const canvas = makeCanvas(); intermediates.push(canvas); return canvas; } };
  class Image { set src(value) { this.sourceURL = value; queueMicrotask(() => this.onload()); } }
  await withGlobals({ document, Image }, () => paintCustomizationPreview(root, state, ui));
  return { target, status, classes, intermediates, draw: target.context.draws.at(-1) };
}

test('preview pose controls are named and transient; combat views are fixed and Terrain preserves the chosen direction', async () => {
  await withMetadata(() => {
    const { state, draft, ui } = model(), before = capture({ state, draft });
    for (const [pose, label] of Object.entries(CUSTOMIZATION_POSES)) {
      ui.customPose = pose;
      const html = renderCustomizationScreen(state, ui), poses = buttons(html, 'custom-pose'), views = buttons(html, 'custom-view');
      assert.equal(poses.length, 5); assert.deepEqual(poses.filter(button => button.pressed).map(button => button.id), [pose]);
      assert.equal(poses.find(button => button.id === pose).text, label);
      assert.ok(poses.every(button => !button.disabled));
      assert.match(html, new RegExp(`data-preview-pose="${pose}"`));
      assert.equal(views.length, 4);
      if (pose === 'field') {
        assert.ok(views.every(button => !button.disabled)); assert.deepEqual(views.filter(button => button.pressed).map(button => button.id), ['back']);
      } else {
        assert.ok(views.every(button => button.disabled && !button.pressed));
        assert.match(html, /Vue trois-quarts fixe/); assert.match(html, /Arme illustrée générique/);
        assert.match(html, /data-custom-canvas width="960" height="720"/);
      }
      assert.equal(ui.customView, 'back'); assert.equal(capture({ state, draft }), before);
    }
    ui.customPose = 'field';
    assert.deepEqual(buttons(renderCustomizationScreen(state, ui), 'custom-view').filter(button => button.pressed).map(button => button.id), ['back']);
    assert.equal(Object.hasOwn(state, 'customPose'), false); assert.equal(Object.hasOwn(draft, 'customPose'), false);
  });
});

test('every combat preview uses the authored rectangle, frame identity and file for each appearance', async () => {
  await withMetadata(async () => {
    for (const [appearance, metadata] of [['male', male], ['female', female]]) {
      const { state, draft, ui } = model(appearance), before = capture({ state, draft });
      for (const [pose, frame] of Object.entries(metadata.combat.frames)) {
        ui.customPose = pose;
        const rendered = await paint(state, ui), cropDraw = rendered.intermediates[0].context.draws[0];
        assert.deepEqual(cropDraw.slice(1, 5), frame.rect);
        assert.ok(cropDraw[0].sourceURL.endsWith(metadata.combat.file));
        assert.equal(rendered.target.dataset.ready, 'true'); assert.equal(rendered.target.dataset.pose, pose);
        assert.equal(rendered.target.dataset.frame, frame.id); assert.equal(rendered.target.dataset.source, metadata.combat.file);
        assert.equal(rendered.target.dataset.direction, 'three-quarter'); assert.equal(rendered.status.hidden, true);
        assert.deepEqual(rendered.draw.slice(1, 5), [0, 0, frame.rect[2], frame.rect[3]], 'combat does not refit the alpha bounds');
        assert.equal(capture({ state, draft }), before);
      }
    }
  });
});

test('combat poses retain one nominal height and one ground anchor, so the down pose remains low and fits the canvas', async () => {
  await withMetadata(async () => {
    for (const [appearance, metadata] of [['male', male], ['female', female]]) {
      const { state, ui } = model(appearance), measurements = [];
      for (const [pose, frame] of Object.entries(metadata.combat.frames)) {
        ui.customPose = pose;
        const { draw } = await paint(state, ui), [, , w, h] = frame.rect, [px, py] = frame.pivot;
        const [, , , , , x, y, width, height] = draw;
        close(width / height, w / h, `${appearance}/${pose}: unchanged aspect ratio`);
        close(x + px / w * width, 480, `${appearance}/${pose}: shared horizontal anchor`);
        assert.ok(x >= 0 && y >= 0 && x + width <= 960 && y + height <= 720, `${appearance}/${pose}: frame is entirely visible`);
        measurements.push({ pose, nominal: height / (frame.heightScale || 1), baseline: y + py / h * height, height });
      }
      for (const frame of measurements) {
        close(frame.nominal, measurements[0].nominal, `${appearance}/${frame.pose}: common nominal height`);
        close(frame.baseline, measurements[0].baseline, `${appearance}/${frame.pose}: common ground line`);
      }
      assert.ok(measurements.find(frame => frame.pose === 'down').height < measurements.find(frame => frame.pose === 'aim').height * .4);
    }
  });
});

test('Compare to current selects the current appearance atlas without changing the prepared appearance or pose', async () => {
  await withMetadata(async () => {
    const { state, draft, ui } = model('male');
    draft.appearance = 'female'; draft.customization = initialCustomization('female'); ui.customPose = 'power';
    const before = capture({ state, draft });
    let preview = await paint(state, ui);
    assert.equal(preview.target.dataset.source, female.combat.file);
    ui.customCompare = true; preview = await paint(state, ui);
    assert.equal(preview.target.dataset.source, male.combat.file); assert.equal(preview.target.dataset.pose, 'power');
    assert.equal(capture({ state, draft }), before); assert.equal(ui.customView, 'back');
  });
});

test('a combat-only helmet is previewed in combat poses and stays hidden in Terrain', async () => {
  await withMetadata(async () => {
    const { state, draft, ui } = model(); draft.customization.armor.helmet = 'combat';
    ui.customPose = 'field'; let preview = await paint(state, ui, 720, 900);
    assert.equal(preview.intermediates[1].context.writes.length, 0); assert.equal(preview.target.dataset.direction, 'back');
    ui.customPose = 'aim'; preview = await paint(state, ui);
    assert.equal(preview.intermediates[1].context.writes.length, 1);
    ui.customPose = 'field'; preview = await paint(state, ui, 720, 900);
    assert.equal(preview.intermediates[1].context.writes.length, 0); assert.equal(preview.target.dataset.direction, 'back');
  });
});

test('a missing pose is explicitly unavailable instead of silently displaying an unrelated terrain sprite', async () => {
  await withGlobals({ __RELAY_MALESHEP_ANIMATION__: { ...male, combat: { ...male.combat, frames: { aim: male.combat.frames.aim } } } }, async () => {
    const { state, draft, ui } = model(), before = capture({ state, draft }); ui.customPose = 'down';
    const html = renderCustomizationScreen(state, ui);
    assert.equal(buttons(html, 'custom-pose').find(button => button.id === 'down').disabled, true);
    const preview = await paint(state, ui);
    assert.match(preview.status.textContent, /Pose indisponible/); assert.equal(preview.classes.has('error'), true);
    assert.equal(preview.draw, undefined); assert.equal(preview.target.dataset.ready, undefined);
    assert.equal(capture({ state, draft }), before);
  });
});
