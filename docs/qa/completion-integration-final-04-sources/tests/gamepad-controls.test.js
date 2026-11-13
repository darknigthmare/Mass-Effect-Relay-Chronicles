import test from 'node:test';
import assert from 'node:assert/strict';
import { createGamepadSampler, createGamepadControls, gamepadVector, gamepadFocusNeighbor, gamepadFocusables } from '../src/gamepad-controls.js';

const pad = (buttons = [], axes = [0, 0, 0, 0], extra = {}) => ({ index: 0, id: 'Standard test pad', mapping: 'standard', connected: true,
  buttons: Array.from({ length: 18 }, (_, index) => ({ pressed: buttons.includes(index), value: buttons.includes(index) ? 1 : 0 })), axes, ...extra });

function domFixture() {
  const listeners = new Map(), doc = { activeElement: null, hidden: false, documentElement: { dataset: {} },
    defaultView: { getComputedStyle: element => ({ display: element.hidden ? 'none' : 'block', visibility: element.hidden ? 'hidden' : 'visible' }), Event },
    addEventListener: (type, listener) => listeners.set(type, listener), removeEventListener: type => listeners.delete(type),
    querySelectorAll: () => root.elements.filter(element => element.attrs.has('data-gamepad-focus')) };
  let root;
  function element(id, options = {}) {
    const node = { id, tagName: 'BUTTON', tabIndex: 0, dataset: {}, textContent: id, attrs: new Map(), ownerDocument: doc,
      disabled: false, hidden: false, isConnected: true, events: [], clicks: 0, rect: { left: 0, top: 0, width: 80, height: 30 },
      getAttribute(name) { return this.attrs.get(name) ?? null; }, setAttribute(name, value) { this.attrs.set(name, value); },
      removeAttribute(name) { this.attrs.delete(name); }, hasAttribute(name) { return this.attrs.has(name); },
      getClientRects() { return this.hidden ? [] : [this.rect]; }, getBoundingClientRect() { return this.rect; }, closest() { return this.inert ? this : null; },
      focus() { doc.activeElement = this; }, scrollIntoView() {},
      click() { this.clicks++; this.onClick?.(); }, dispatchEvent(event) { this.events.push(event.type); this.onEvent?.(event); return true; }, ...options };
    return node;
  }
  function replace(elements) {
    for (const previous of root?.elements || []) previous.isConnected = false;
    root = { elements, querySelectorAll: () => elements, querySelector: selector => elements.find(entry => selector.includes('[data-do="close"]') && entry.dataset.do === 'close') || null };
    return root;
  }
  replace([]);
  return { doc, listeners, element, replace, get root() { return root; } };
}
function event(code, target, extra = {}) {
  return { code, key: code, target, defaultPrevented: false, prevented: false, stopped: false,
    preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; }, ...extra };
}

test('connection, mode transitions and held reconnect input require neutral before any command', () => {
  const input = createGamepadSampler();
  assert.deepEqual(input.sample([pad([0])], 0).actions, []);
  assert.equal(input.sample([pad([0])], 100).ready, false);
  assert.equal(input.sample([pad()], 200).ready, true);
  assert.deepEqual(input.sample([pad([0])], 220).actions, [{ type: 'confirm' }]);
  assert.deepEqual(input.sample([pad([0])], 600).actions, [], 'Holding A never repeats activation');
  assert.deepEqual(input.sample([pad([0])], 700, 'explore').actions, [], 'A cannot fall through a newly closed menu');
  input.sample([pad()], 800, 'explore');
  assert.deepEqual(input.sample([pad([0])], 820, 'explore').actions, [{ type: 'interact' }]);
  assert.equal(input.sample([], 900, 'explore').connected, false);
  assert.equal(input.sample([pad([], [1, 0, 0, 0])], 1000, 'explore').ready, false);
  assert.deepEqual(input.sample([pad([], [1, 0, 0, 0])], 1100, 'explore').movement, { right: 0, forward: 0, sprint: false });
});

test('analog walking has a radial dead zone, normalized diagonals and independent sprint', () => {
  assert.deepEqual(gamepadVector(.1, -.1), { x: 0, y: 0 });
  const diagonal = gamepadVector(1, -1); assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.y) - 1) < 1e-12);
  assert.deepEqual(gamepadVector(NaN, Infinity), { x: 0, y: 0 });
  const input = createGamepadSampler(); input.sample([pad()], 0, 'explore');
  const value = input.sample([pad([7], [1, -1, 0, 0])], 10, 'explore').movement;
  assert.equal(value.sprint, true); assert.ok(value.right > .7 && value.forward > .7); assert.ok(Math.hypot(value.right, value.forward) <= 1.0000001);
  const dpad = input.sample([pad([12, 15])], 20, 'explore').movement;
  assert.ok(Math.abs(dpad.right - Math.SQRT1_2) < 1e-12 && Math.abs(dpad.forward - Math.SQRT1_2) < 1e-12); assert.equal(dpad.sprint, false);
});

test('navigation uses hysteresis and bounded repeat, without catching up after a long frame', () => {
  const input = createGamepadSampler(); input.sample([pad()], 0);
  assert.deepEqual(input.sample([pad([], [.6, 0, 0, 0])], 10).actions, [{ type: 'navigate', direction: 'right' }]);
  assert.deepEqual(input.sample([pad([], [.5, 0, 0, 0])], 200).actions, []);
  assert.deepEqual(input.sample([pad([], [.5, 0, 0, 0])], 350).actions, [{ type: 'navigate', direction: 'right' }]);
  assert.equal(input.sample([pad([], [.5, 0, 0, 0])], 10000).actions.length, 1);
  assert.deepEqual(input.sample([pad([], [.1, 0, 0, 0])], 10020).actions, []);
  assert.deepEqual(input.sample([pad([13])], 10030).actions, [{ type: 'navigate', direction: 'down' }]);
});

test('unsupported mappings, blocked screens and competing controllers cannot create an order', () => {
  const input = createGamepadSampler();
  assert.equal(input.sample([pad([0], undefined, { mapping: '' })], 0).connected, false);
  input.sample([pad()], 1, 'combat');
  const second = pad([0], undefined, { index: 1, id: 'Second pad' });
  assert.deepEqual(input.sample([pad(), second], 2, 'combat').actions, []);
  input.sample([pad()], 3, 'blocked');
  assert.deepEqual(input.sample([pad([0, 9], [1, 1, 0, 1])], 4, 'blocked').actions, []);
  assert.deepEqual(input.sample([pad([0, 9], [1, 1, 0, 1])], 4, 'blocked').movement, { right: 0, forward: 0, sprint: false });
});

test('combat shoulder and quick-action inputs are single explicit callbacks', () => {
  const input = createGamepadSampler(); input.sample([pad()], 0, 'combat');
  assert.deepEqual(input.sample([pad([4])], 1, 'combat').actions, [{ type: 'squad', delta: -1 }]);
  input.sample([pad()], 2, 'combat');
  assert.deepEqual(input.sample([pad([5])], 3, 'combat').actions, [{ type: 'squad', delta: 1 }]);
  input.sample([pad()], 4, 'combat');
  assert.deepEqual(input.sample([pad([2])], 5, 'combat').actions, [{ type: 'quick' }]);
  input.sample([pad()], 6, 'combat');
  assert.deepEqual(input.sample([pad([0, 9, 15])], 7, 'combat').actions, [{ type: 'pause' }], 'Start has priority over simultaneous confirm/navigation');
});

test('DOM navigation skips hidden, inert and disabled controls while geometric grids remain reachable', () => {
  const fixture = domFixture(), { element } = fixture;
  const a = element('a'), b = element('b', { rect: { left: 120, top: 0, width: 80, height: 30 } });
  const c = element('c', { rect: { left: 0, top: 80, width: 80, height: 30 } });
  fixture.replace([a, element('hidden', { hidden: true }), element('disabled', { disabled: true }), element('inert', { inert: true }), b, c]);
  const controls = gamepadFocusables(fixture.root); assert.deepEqual(controls, [a, b, c]);
  assert.equal(gamepadFocusNeighbor(controls, a, 'right'), b);
  assert.equal(gamepadFocusNeighbor(controls, a, 'down'), c);
  assert.equal(gamepadFocusNeighbor(controls, a, 'left'), c, 'Document-order wrap remains deterministic at the edge');
});

test('focus survives DOM replacement and A activates the live current control once', () => {
  const fixture = domFixture(); let currentPad = pad(), count = 0;
  const a = fixture.element('action'), b = fixture.element('target', { rect: { left: 0, top: 60, width: 80, height: 30 }, onClick: () => { count++; } });
  fixture.replace([a, b]);
  const controls = createGamepadControls({ document: fixture.doc, window: null, getFocusRoot: () => fixture.root, getGamepads: () => [currentPad] });
  controls.update(0); controls.focus(); b.focus();
  currentPad = pad([13]); controls.update(10); // b wraps to a; explicitly put focus back on b.
  b.focus(); currentPad = pad(); controls.update(20);
  const live = fixture.element('target', { onClick: () => { count++; } }); fixture.replace([fixture.element('action'), live]);
  controls.update(30); assert.equal(fixture.doc.activeElement, live);
  currentPad = pad([0]); controls.update(40); controls.update(200);
  assert.equal(count, 1); assert.equal(b.clicks, 0); assert.equal(live.clicks, 1);
  controls.dispose();
});

test('menu keyboard actions trap boundary focus and never consume world movement or text editing', () => {
  const fixture = domFixture(); let mode = 'menu', backs = 0;
  const a = fixture.element('a'), b = fixture.element('b', { rect: { left: 0, top: 60, width: 80, height: 30 } });
  fixture.replace([a, b]); const controls = createGamepadControls({ document: fixture.doc, window: null, getMode: () => mode, getFocusRoot: () => fixture.root, onBack: () => { backs++; } });
  controls.focus(); const down = event('ArrowDown', a); assert.equal(controls.handleKeyDown(down), true); assert.equal(fixture.doc.activeElement, b);
  const tab = event('Tab', b); assert.equal(controls.handleKeyDown(tab), true); assert.equal(fixture.doc.activeElement, a);
  controls.handleKeyDown(event('Enter', a)); controls.handleKeyDown(event('Enter', a, { repeat: true })); assert.equal(a.clicks, 1);
  controls.handleKeyDown(event('Escape', a)); controls.handleKeyDown(event('Escape', a, { repeat: true })); assert.equal(backs, 1);
  const input = fixture.element('name', { tagName: 'INPUT', type: 'text' });
  assert.equal(controls.handleKeyDown(event('ArrowLeft', input)), false, 'Native caret movement is untouched');
  mode = 'combat'; assert.equal(controls.handleKeyDown(event('Space', a)), false, 'Existing quick-fire shortcut is not replaced by confirm');
  mode = 'explore'; assert.equal(controls.handleKeyDown(event('KeyW', a)), false); assert.equal(controls.handleKeyDown(event('KeyE', a)), false);
  controls.dispose();
});

test('gamepad lists and sliders dispatch actual change events, skip disabled options and clamp values', () => {
  const fixture = domFixture(); let currentPad = pad();
  const select = fixture.element('mode', { tagName: 'SELECT', value: 'wait', options: [{ value: 'wait' }, { value: 'forbidden', disabled: true }, { value: 'active' }] });
  fixture.replace([select]); const controls = createGamepadControls({ document: fixture.doc, window: null, getFocusRoot: () => fixture.root, getGamepads: () => [currentPad] });
  controls.update(0); controls.focus(); currentPad = pad([15]); controls.update(1);
  assert.equal(select.value, 'active'); assert.deepEqual(select.events, ['input', 'change']);
  currentPad = pad(); controls.update(2);
  const range = fixture.element('volume', { tagName: 'INPUT', type: 'range', value: '.95', min: '0', max: '1', step: '.05' }); fixture.replace([range]);
  currentPad = pad([15]); controls.update(3); assert.equal(range.value, '1');
  currentPad = pad(); controls.update(4); currentPad = pad([15]); controls.update(5); assert.equal(range.value, '1');
  assert.deepEqual(range.events, ['input', 'change'], 'Clamped repeated adjustment emits no duplicate change');
  controls.dispose();
});

test('disconnect, blur and dispose release only analog movement and do not replay held input', () => {
  const fixture = domFixture(), listeners = new Map(); let current = [pad()], interactions = 0;
  const moves = [], win = { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) };
  const controls = createGamepadControls({ document: fixture.doc, window: win, getMode: () => 'explore', getGamepads: () => current, onMove: value => moves.push(value), onInteract: () => { interactions++; } });
  controls.update(0); current = [pad([], [1, 0, 0, 0])]; controls.update(1); assert.equal(moves.at(-1).right, 1);
  current = []; controls.update(2); assert.deepEqual(moves.at(-1), { right: 0, forward: 0, sprint: false });
  current = [pad([0], [1, 0, 0, 0])]; controls.update(3); listeners.get('blur')(); listeners.get('focus')(); controls.update(4);
  assert.equal(interactions, 0); assert.equal(controls.getSnapshot().movement.right, 0);
  current = [pad()]; controls.update(5); current = [pad([0])]; controls.update(6); assert.equal(interactions, 1);
  controls.dispose(); controls.update(7); assert.equal(interactions, 1); assert.equal(listeners.size, 0); assert.equal(fixture.listeners.size, 0);
});

test('blocked Gamepad API leaves keyboard navigation usable without side effects', () => {
  const fixture = domFixture(), button = fixture.element('continue'); fixture.replace([button]);
  const controls = createGamepadControls({ document: fixture.doc, window: null, getFocusRoot: () => fixture.root, getGamepads: () => { throw Error('Permission denied'); } });
  assert.doesNotThrow(() => controls.update(0)); assert.equal(controls.getSnapshot().connected, false);
  controls.handleKeyDown(event('Enter', button)); assert.equal(button.clicks, 1); controls.dispose();
});

test('keyboard-only focus is restored after a screen rebuild even with no connected device', () => {
  const fixture = domFixture(), old = fixture.element('known-control'); fixture.replace([old]);
  const controls = createGamepadControls({ document: fixture.doc, window: null, getFocusRoot: () => fixture.root, getGamepads: () => [] });
  controls.handleKeyDown(event('Enter', old));
  const replacement = fixture.element('known-control'); fixture.replace([fixture.element('other'), replacement]);
  controls.update(20); assert.equal(fixture.doc.activeElement, replacement); assert.equal(replacement.clicks, 0);
  controls.dispose();
});

test('Back cancels an open transaction before considering a generic header close', () => {
  const fixture = domFixture(), close = fixture.element('close', { dataset: { do: 'close' } }), cancel = fixture.element('cancel', { dataset: { do: 'manual-cancel' } });
  fixture.replace([close, cancel]); fixture.root.querySelector = selector => [close, cancel].find(element => selector === `[data-do="${element.dataset.do}"]`) || null;
  const controls = createGamepadControls({ document: fixture.doc, window: null, getFocusRoot: () => fixture.root });
  controls.handleKeyDown(event('Escape', cancel)); assert.equal(cancel.clicks, 1); assert.equal(close.clicks, 0);
  controls.dispose();
});

test('a native Tab focus change moves the explicit marker instead of leaving two indicated controls', () => {
  const fixture = domFixture(), a = fixture.element('a'), b = fixture.element('b'); fixture.replace([a, b]);
  const controls = createGamepadControls({ document: fixture.doc, window: null, getFocusRoot: () => fixture.root, getGamepads: () => [] });
  controls.handleKeyDown(event('Enter', a)); assert.equal(a.hasAttribute('data-gamepad-focus'), true);
  b.focus(); controls.update(20);
  assert.equal(a.hasAttribute('data-gamepad-focus'), false); assert.equal(b.hasAttribute('data-gamepad-focus'), true);
  assert.deepEqual(fixture.root.elements.filter(element => element.hasAttribute('data-gamepad-focus')), [b]);
  controls.dispose();
});
