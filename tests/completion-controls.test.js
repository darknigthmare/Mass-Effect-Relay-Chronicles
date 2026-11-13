import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_DISPLAY_PREFERENCES as DEFAULTS, DISPLAY_PREFERENCES_KEY, normalizeDisplayPreferences,
  getDisplayRenderProfile, getVisualAccessibilityPolicy, createCompletionAccessibility } from '../src/completion-accessibility.js';
import { getGamepadBackControl, getGamepadScrollTarget, createGamepadControls } from '../src/gamepad-controls.js';
import { WorldView } from '../src/world.js';
import * as THREE from 'three';

function fixture(initial = null, { denied = false } = {}) {
  const values = new Map(initial === null ? [] : [[DISPLAY_PREFERENCES_KEY, initial]]), writes = [], listeners = new Map(), windowListeners = new Map();
  const classes = new Set(), variables = new Map(), outputs = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem(key, value) { if (denied) throw Error('Storage unavailable'); values.set(key, value); writes.push([key, value]); } };
  const doc = { body: { dataset: {}, classList: { add: key => classes.add(key), toggle: (key, value) => value ? classes.add(key) : classes.delete(key) }, style: { setProperty: (key, value) => variables.set(key, value) } },
    querySelector: selector => { if (!outputs.has(selector)) outputs.set(selector, { textContent: '' }); return outputs.get(selector); },
    addEventListener: (key, fn) => listeners.set(key, fn), removeEventListener: key => listeners.delete(key) };
  let ratio = 1, resizes = 0; const ratios = [], renderer = { toneMappingExposure: 1.15, shadowMap: { enabled: true }, getPixelRatio: () => ratio,
    setPixelRatio: value => { ratio = value; ratios.push(value); } };
  const world = { renderer, resize: () => { resizes++; }, campaignSentinel: { xp: 125, credits: 480, choices: { feros: 'save' } } };
  const win = { devicePixelRatio: 1, addEventListener: (key, fn) => windowListeners.set(key, fn), removeEventListener: key => windowListeners.delete(key) };
  return { values, writes, listeners, windowListeners, classes, variables, storage, doc, win, world, ratios, get ratio() { return ratio; }, get resizes() { return resizes; } };
}
const create = (f, extra = {}) => createCompletionAccessibility({ world: f.world, document: f.doc, window: f.win, storage: f.storage, ...extra });

test('display preference normalization accepts exact data and rejects malformed/coerced versions without executing accessors', () => {
  assert.deepEqual(normalizeDisplayPreferences(undefined), DEFAULTS);
  assert.deepEqual(normalizeDisplayPreferences(JSON.stringify(DEFAULTS)), DEFAULTS);
  for (const raw of [null, [], '{}', 'x'.repeat(3001), { ...DEFAULTS, version: 2 }, { ...DEFAULTS, quality: '__proto__' },
    { ...DEFAULTS, brightness: '1' }, { ...DEFAULTS, brightness: NaN }, { ...DEFAULTS, brightness: .64 }, { ...DEFAULTS, effectIntensity: 1.01 },
    { ...DEFAULTS, highContrast: 1 }, { ...DEFAULTS, extra: true }]) assert.equal(normalizeDisplayPreferences(raw), null);
  let calls = 0; const accessor = { ...DEFAULTS }; Object.defineProperty(accessor, 'quality', { enumerable: true, get() { calls++; return 'high'; } });
  assert.equal(normalizeDisplayPreferences(accessor), null); assert.equal(calls, 0);
  assert.equal(normalizeDisplayPreferences({ ...DEFAULTS, [Symbol('hidden')]: true }), null);
});

test('quality profiles change render definition and shadows while brightness is based on the original exposure', () => {
  assert.deepEqual(getDisplayRenderProfile({ ...DEFAULTS, quality: 'economy' }, 1, 1.15), { pixelRatio: .75, exposure: 1.15, shadows: false });
  assert.deepEqual(getDisplayRenderProfile({ ...DEFAULTS, quality: 'high', brightness: 1.4 }, 2, 1.15), { pixelRatio: 2, exposure: 1.6099999999999999, shadows: true });
  assert.equal(getDisplayRenderProfile(DEFAULTS, 4).pixelRatio, 1.75);
  assert.equal(getDisplayRenderProfile(DEFAULTS, NaN).pixelRatio, 1);
  assert.equal(getDisplayRenderProfile({ ...DEFAULTS, quality: 'unknown' }), null);
});

test('live settings are absolute, idempotent and independent of campaign progression', () => {
  const f = fixture(), before = structuredClone(f.world.campaignSentinel), app = create(f);
  assert.equal(app.setPreference('brightness', 1.4).ok, true); const exposed = f.world.renderer.toneMappingExposure;
  app.setPreference('brightness', 1.4); assert.equal(f.world.renderer.toneMappingExposure, exposed); assert.equal(f.writes.length, 1);
  app.setPreference('brightness', 1); assert.equal(f.world.renderer.toneMappingExposure, 1.15);
  app.setPreference('quality', 'economy'); assert.equal(f.ratio, .75); assert.equal(f.world.renderer.shadowMap.enabled, false); assert.equal(f.resizes, 1);
  app.setPreference('quality', 'high'); assert.equal(f.ratio, 1.25); assert.equal(f.world.renderer.shadowMap.enabled, true); assert.equal(f.resizes, 2);
  assert.deepEqual(f.world.campaignSentinel, before); app.dispose();
});

test('unreadable stored preferences fall back without overwriting the original until an explicit change', () => {
  const f = fixture('{broken'), app = create(f); assert.deepEqual(app.getPreferences(), DEFAULTS); assert.equal(f.values.get(DISPLAY_PREFERENCES_KEY), '{broken'); assert.equal(f.writes.length, 0);
  app.setPreference('brightness', 1.1); assert.equal(f.writes.length, 1); assert.equal(JSON.parse(f.values.get(DISPLAY_PREFERENCES_KEY)).brightness, 1.1); app.dispose();
});

test('display changes persist per device and returned values cannot mutate the active preferences', () => {
  const f = fixture(), first = create(f); first.setPreference('highContrast', true); first.setPreference('effectIntensity', .2);
  const copy = first.getPreferences(); copy.effectIntensity = 1; assert.equal(first.getPreferences().effectIntensity, .2); first.dispose();
  const second = create(f); assert.equal(second.getPreferences().highContrast, true); assert.equal(second.getPreferences().effectIntensity, .2);
  assert.equal(f.classes.has('completion-high-contrast'), true); second.dispose();
});

test('storage denial leaves the visual preference usable without claiming persistence', () => {
  const f = fixture(null, { denied: true }), app = create(f); const result = app.setPreference('brightness', 1.2);
  assert.equal(result.ok, true); assert.equal(result.saved, false); assert.equal(f.world.renderer.toneMappingExposure, 1.15 * 1.2);
  assert.match(f.doc.querySelector('[data-display-status]').textContent, /ne peut pas/); assert.equal(f.writes.length, 0); app.dispose();
});

test('reduced effects retain text and state cues while disabling particles, fast tints and jitter', () => {
  assert.deepEqual(getVisualAccessibilityPolicy(DEFAULTS, true), { effectIntensity: 1, reducedMotion: true, particles: false, hitTint: false, spriteShake: false, ambientPulse: false, textCues: true });
  assert.equal(getVisualAccessibilityPolicy({ ...DEFAULTS, effectIntensity: 0 }).particles, false);
  const f = fixture(), app = create(f), settings = { reducedMotion: true, largeText: true, sound: false }, before = structuredClone(settings);
  app.applyCampaignSettings(settings); assert.equal(f.classes.has('completion-reduced-effects'), true); assert.equal(f.classes.has('large-text'), true);
  assert.equal(f.world.visualAccessibility.particles, false); assert.equal(f.world.visualAccessibility.textCues, true); assert.deepEqual(settings, before);
  app.applyCampaignSettings({ reducedMotion: false, largeText: false }); assert.equal(f.classes.has('completion-reduced-effects'), false); app.dispose();
});

test('only own display input events apply a preference; preview uses its public callback', () => {
  const f = fixture(); let preview = null; const app = create(f, { onReadabilityPreview: value => { preview = value; } });
  f.listeners.get('input')({ target: { dataset: { unrelated: 'brightness' }, value: '1.4' } }); assert.equal(f.writes.length, 0);
  f.listeners.get('input')({ target: { dataset: { completionDisplay: 'brightness' }, value: '1.4' } });
  f.listeners.get('change')({ target: { dataset: { completionDisplay: 'brightness' }, value: '1.4' } }); assert.equal(f.writes.length, 1);
  f.listeners.get('click')({ target: { closest: () => ({}) } }); assert.ok(preview.text.includes('Éléonore')); assert.equal(preview.choices.length, 6);
  const before = app.getPreferences(); assert.equal(app.setPreference('__proto__', {}).ok, false); assert.equal(app.setPreference('effectIntensity', -1).ok, false); assert.deepEqual(app.getPreferences(), before);
  app.dispose(); assert.equal(f.listeners.size, 0); assert.equal(f.windowListeners.size, 0); assert.equal(app.setPreference('brightness', 1).ok, false);
});

test('valid cross-tab preferences apply live and unrelated or malformed storage events are ignored', () => {
  const f = fixture(), app = create(f), listener = f.windowListeners.get('storage');
  listener({ key: 'other', newValue: JSON.stringify({ ...DEFAULTS, brightness: 1.4 }) }); assert.equal(app.getPreferences().brightness, 1);
  listener({ key: DISPLAY_PREFERENCES_KEY, newValue: '{bad' }); assert.equal(app.getPreferences().brightness, 1);
  listener({ key: DISPLAY_PREFERENCES_KEY, newValue: JSON.stringify({ ...DEFAULTS, brightness: 1.4 }) }); assert.equal(app.getPreferences().brightness, 1.4);
  listener({ key: DISPLAY_PREFERENCES_KEY, newValue: null }); assert.deepEqual(app.getPreferences(), DEFAULTS); app.dispose();
});

test('the native renderer keeps hit poses and status state but creates no reduced-effect impact or beam', () => {
  const source = { key: 'shepard', alive: true, group: new THREE.Group(), height: 2, state: {} }, target = { key: 'geth', alive: true, group: new THREE.Group(), height: 2, state: {} };
  target.group.position.set(5, 0, 0);
  const world = Object.create(WorldView.prototype); Object.assign(world, { battleActors: new Map([['s', source], ['t', target]]), particles: new THREE.Group(), effects: [], visualAccessibility: getVisualAccessibilityPolicy(DEFAULTS, true), _combatAnimationConfig: () => null });
  world.playEvent({ type: 'action', actionId: 'shoot', actorId: 's', targetId: 't' }); assert.equal(source.combatPose, 'aim'); assert.equal(world.effects.length, 0);
  world.playEvent({ type: 'damage', actorId: 's', targetId: 't' }); assert.equal(target.combatPose, 'hit'); assert.equal(world.effects.length, 0);
  world._impact(new THREE.Vector3(), 0xffffff); assert.equal(world.effects.length, 0); assert.equal(world.particles.children.length, 0);
});

test('return discovery never invents a Back action for a mandatory dialogue', () => {
  assert.equal(getGamepadBackControl({ querySelector: () => null }), null);
});

test('reading keys scroll the top dialogue pane and leave native input caret keys alone', () => {
  const calls = [], pane = { clientHeight: 300, scrollHeight: 5000, scrollTop: 1800, scrollTo: value => calls.push(value) }, active = { parentElement: pane, tagName: 'BUTTON' };
  const root = { contains: element => [active, pane].includes(element), querySelectorAll: () => [pane] };
  assert.equal(getGamepadScrollTarget(root, active), pane);
  const doc = { activeElement: active, documentElement: { dataset: {} }, addEventListener() {}, removeEventListener() {} };
  const controls = createGamepadControls({ document: doc, window: null, getMode: () => 'menu', getFocusRoot: () => root });
  const make = (code, target = active) => ({ code, key: code, target, preventDefault() {}, stopImmediatePropagation() {} });
  assert.equal(controls.handleKeyDown(make('PageUp')), true); assert.equal(calls[0].top, 1545);
  controls.handleKeyDown(make('Home')); assert.equal(calls[1].top, 0); controls.handleKeyDown(make('End')); assert.equal(calls[2].top, 5000);
  assert.equal(controls.handleKeyDown(make('Home', { tagName: 'INPUT' })), false); controls.dispose();
});

test('Tab and reverse Tab cross a native scroll-container stop without frame repair trapping the footer', () => {
  const doc = { documentElement: { dataset: {} }, addEventListener() {}, removeEventListener() {} }, elements = [];
  const element = (id, tagName = 'BUTTON', tabIndex = 0) => {
    const attributes = new Map();
    return { id, tagName, tabIndex, dataset: {}, disabled: false, textContent: id,
      getClientRects: () => [{}], closest: () => null, getAttribute: name => attributes.get(name) ?? null,
      setAttribute: (name, value) => attributes.set(name, value), removeAttribute: name => attributes.delete(name), hasAttribute: name => attributes.has(name),
      focus() { doc.activeElement = this; }, scrollIntoView() {} };
  };
  const view = element('profile-left'), cancel = element('cancel'), apply = element('apply'), nativePane = element('scrolling-inspector', 'ASIDE', -1);
  Object.assign(nativePane, { clientHeight: 700, scrollHeight: 1050 }); elements.push(view, cancel, apply);
  const root = { querySelectorAll: () => elements, contains: item => [...elements, nativePane].includes(item) };
  doc.querySelectorAll = () => elements.filter(item => item.hasAttribute('data-gamepad-focus'));
  const controls = createGamepadControls({ document: doc, window: null, getFocusRoot: () => root, getGamepads: () => [] });
  view.focus();
  const tab = reverse => ({ code: 'Tab', key: 'Tab', target: doc.activeElement, shiftKey: reverse, preventDefault() {}, stopImmediatePropagation() {} });
  // This is the observed Chromium fallback: an unhandled Tab visits the ASIDE;
  // the next controller frame would then repair focus back to profile-left.
  const handled = controls.handleKeyDown(tab(false)); if (!handled) nativePane.focus(); controls.update(16);
  assert.equal(handled, true); assert.equal(doc.activeElement, cancel); assert.equal(cancel.hasAttribute('data-gamepad-focus'), true);
  controls.handleKeyDown(tab(false)); controls.update(32); assert.equal(doc.activeElement, apply);
  controls.handleKeyDown(tab(true)); controls.update(48); assert.equal(doc.activeElement, cancel);
  controls.handleKeyDown(tab(true)); controls.update(64); assert.equal(doc.activeElement, view);
  assert.deepEqual(elements.filter(item => item.hasAttribute('data-gamepad-focus')), [view]); controls.dispose();
});
