// Standard Gamepad API + DOM focus navigation. Device input never edits campaign
// state or synthesizes world keyboard events: it invokes the public UI controls.
const DIRECTIONS = ['up', 'down', 'left', 'right'];
const MODES = new Set(['menu', 'combat', 'explore', 'blocked']);
const FOCUSABLE = 'button,a[href],input:not([type="hidden"]),select,textarea,summary,[tabindex]';
const BUTTONS = { confirm: 0, back: 1, quick: 2, journal: 3, previous: 4, next: 5, map: 8, pause: 9 };
const BACK_SELECTORS = ['[data-conversation-back]', '[data-conversation-end]', '[data-assignment-back]', '[data-assignment-end]',
  '[data-operation-choice="cancel"]', '[data-mission-choice="leave"]', '[data-mission-choice="cancel"]',
  '[data-do="manual-cancel"]', '[data-do="custom-cancel"]', '[data-do="coord-cancel"]',
  '[data-do="manual-back"]', '[data-do="dossier-back"]', '[data-do="chronicle-back"]', '[data-do="resume"]', '[data-do="close"]'];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const number = value => typeof value === 'number' && Number.isFinite(value) ? value : 0;
const down = button => button === true || typeof button === 'number' && button > .5 || button?.pressed === true || number(button?.value) > .5;
const noMovement = () => ({ right: 0, forward: 0, sprint: false });

export const GAMEPAD_HELP = Object.freeze({
  title: 'Manette et clavier',
  text: 'Manette standard : stick gauche pour marcher ; maintenir la gâchette droite pour courir. A / Croix confirme ou interagit ; B / Rond revient ; Start ouvre la pause. Menus : croix directionnelle ou stick pour le focus, gauche/droite pour régler une liste ou un curseur. En combat : choisir un équipier, un ordre puis une cible ; LB / RB change d’équipier. Le bouton X / Carré déclenche le tir rapide. Le stick droit fait défiler le texte. Un champ de texte ouvre le clavier à l’écran avec A / Croix.',
  keyboard: 'Menus au clavier : Tab / Maj+Tab ou flèches, Entrée pour confirmer, Échap pour revenir. Les champs gardent leurs touches de saisie habituelles.',
  limitation: 'Les dialogues système d’import et d’export de fichiers dépendent du navigateur ou du système. Les modèles de manette sans correspondance standard ne sont pas pris en charge automatiquement.',
});

/** Radial dead zone; diagonals never exceed magnitude one. */
export function gamepadVector(x, y, deadZone = .2) {
  x = clamp(number(x), -1, 1); y = clamp(number(y), -1, 1);
  const magnitude = Math.hypot(x, y);
  if (magnitude <= deadZone) return { x: 0, y: 0 };
  const scaled = clamp((magnitude - deadZone) / (1 - deadZone), 0, 1) / magnitude;
  return { x: x * scaled, y: y * scaled };
}

/** Pure poller, independently testable without a browser or an attached device. */
export function createGamepadSampler() {
  let identity = null, mode = null, armed = false, previous = new Set(), heldDirection = null, nextRepeat = 0;
  const reset = () => { identity = null; mode = null; armed = false; previous = new Set(); heldDirection = null; nextRepeat = 0; };
  function sample(pads, now = 0, nextMode = 'menu') {
    now = Math.max(0, number(now)); nextMode = MODES.has(nextMode) ? nextMode : 'blocked';
    const candidates = Array.from(pads || []).filter(pad => pad && pad.connected !== false && pad.mapping === 'standard');
    const pad = candidates.find(item => `${item.index}:${item.id}` === identity) || candidates[0];
    const empty = { connected: false, ready: false, movement: noMovement(), actions: [], scroll: 0 };
    if (!pad) { reset(); return empty; }
    const key = `${pad.index}:${pad.id}`, buttons = new Set(Array.from(pad.buttons || []).flatMap((button, index) => down(button) ? [index] : []));
    const x = clamp(number(pad.axes?.[0]), -1, 1), y = clamp(number(pad.axes?.[1]), -1, 1);
    const scrollAxis = clamp(number(pad.axes?.[3]), -1, 1);
    if (key !== identity || nextMode !== mode) {
      identity = key; mode = nextMode; armed = false; heldDirection = null; nextRepeat = 0;
    }
    const result = { ...empty, connected: true, index: pad.index, id: String(pad.id || '').slice(0, 200), mapping: 'standard' };
    if (!armed) {
      // A held button or stick cannot carry an order into a new screen, a
      // reconnected device or a resumed window. Require an actual neutral poll.
      previous = buttons;
      if (!buttons.size && Math.abs(x) <= .2 && Math.abs(y) <= .2 && Math.abs(scrollAxis) <= .2) armed = true;
      result.ready = armed; return result;
    }
    result.ready = true;
    const priorButtons = previous; previous = buttons;
    const pressed = index => buttons.has(index) && !priorButtons.has(index);
    if (mode === 'blocked') return result;
    if (pressed(BUTTONS.pause)) result.actions.push({ type: 'pause' });
    else if (pressed(BUTTONS.back)) result.actions.push({ type: 'back' });
    else if (pressed(BUTTONS.confirm)) result.actions.push({ type: mode === 'explore' ? 'interact' : 'confirm' });
    else if (mode === 'combat' && pressed(BUTTONS.previous)) result.actions.push({ type: 'squad', delta: -1 });
    else if (mode === 'combat' && pressed(BUTTONS.next)) result.actions.push({ type: 'squad', delta: 1 });
    else if (mode === 'combat' && pressed(BUTTONS.quick)) result.actions.push({ type: 'quick' });
    else if (mode === 'explore' && pressed(BUTTONS.journal)) result.actions.push({ type: 'shortcut', name: 'journal' });
    else if (mode === 'explore' && pressed(BUTTONS.map)) result.actions.push({ type: 'shortcut', name: 'map' });
    if (mode === 'explore') {
      const vector = gamepadVector(x, y);
      const right = buttons.has(15) ? 1 : buttons.has(14) ? -1 : vector.x;
      const forward = buttons.has(12) ? 1 : buttons.has(13) ? -1 : -vector.y;
      const length = Math.hypot(right, forward), scale = length > 1 ? 1 / length : 1;
      result.movement = { right: right * scale, forward: forward * scale, sprint: buttons.has(7) };
      return result;
    }
    result.scroll = Math.abs(scrollAxis) > .25 ? gamepadVector(0, scrollAxis, .25).y : 0;
    let direction = buttons.has(12) ? 'up' : buttons.has(13) ? 'down' : buttons.has(14) ? 'left' : buttons.has(15) ? 'right' : null;
    if (!direction) {
      const heldAxis = heldDirection === 'left' || heldDirection === 'right' ? x : y;
      const sameSign = heldDirection === 'left' || heldDirection === 'up' ? heldAxis < -.28 : heldAxis > .28;
      if (heldDirection && sameSign) direction = heldDirection;
      else if (Math.max(Math.abs(x), Math.abs(y)) >= .55) direction = Math.abs(x) > Math.abs(y) ? x < 0 ? 'left' : 'right' : y < 0 ? 'up' : 'down';
    }
    if (!direction) { heldDirection = null; nextRepeat = 0; }
    else if (!result.actions.length && (direction !== heldDirection || now >= nextRepeat)) {
      result.actions.push({ type: 'navigate', direction });
      nextRepeat = now + (direction === heldDirection ? 125 : 340); heldDirection = direction;
    }
    return result;
  }
  return { sample, reset };
}

export function isGamepadFocusable(element) {
  if (!element || element.disabled || element.getAttribute?.('aria-disabled') === 'true' || element.tabIndex < 0) return false;
  if (element.closest?.('[hidden],[inert],[aria-hidden="true"]')) return false;
  if (element.getClientRects && element.getClientRects().length === 0) return false;
  const style = element.ownerDocument?.defaultView?.getComputedStyle?.(element);
  return !style || style.display !== 'none' && style.visibility !== 'hidden' && style.visibility !== 'collapse';
}

export function gamepadFocusables(root) {
  if (!root?.querySelectorAll) return [];
  return [...root.querySelectorAll(FOCUSABLE)].filter(isGamepadFocusable);
}

export function getGamepadBackControl(root) {
  return BACK_SELECTORS.map(selector => root?.querySelector?.(selector)).find(isGamepadFocusable) || null;
}

/** Reading belongs to the top dialog/scrolling pane, never the page behind it. */
export function getGamepadScrollTarget(root, active) {
  if (!root) return null;
  const scrollable = element => element && Number.isFinite(element.scrollHeight) && Number.isFinite(element.clientHeight)
    && element.clientHeight > 0 && element.scrollHeight > element.clientHeight + 1;
  const selectors = '.dialogue-body,.custom-controls,.custom-inspector,.target-list,.action-grid,.screen-body,.gamepad-keyboard-card,.title-screen';
  let current = active;
  while (current && (current === root || root.contains?.(current))) {
    if (scrollable(current)) return current;
    if (current === root) break; current = current.parentElement;
  }
  return [...(root.querySelectorAll?.(selectors) || [])].find(scrollable) || (scrollable(root) ? root : null);
}

/** Geometric neighbors suit grids; a deterministic document-order wrap suits lists. */
export function gamepadFocusNeighbor(elements, active, direction) {
  if (!elements.length || !DIRECTIONS.includes(direction)) return null;
  const index = elements.indexOf(active);
  if (index < 0) return elements.find(element => element.dataset?.do !== 'close') || elements[0];
  const rect = active.getBoundingClientRect?.();
  if (rect) {
    const horizontal = direction === 'left' || direction === 'right', sign = direction === 'left' || direction === 'up' ? -1 : 1;
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const candidates = elements.filter(element => element !== active).map(element => {
      const other = element.getBoundingClientRect?.(); if (!other) return null;
      const dx = other.left + other.width / 2 - cx, dy = other.top + other.height / 2 - cy;
      const along = horizontal ? dx : dy, across = horizontal ? dy : dx;
      return along * sign > 2 ? { element, score: Math.abs(along) + Math.abs(across) * 2.5 } : null;
    }).filter(Boolean).sort((a, b) => a.score - b.score);
    if (candidates.length) return candidates[0].element;
  }
  return elements[(index + (direction === 'up' || direction === 'left' ? -1 : 1) + elements.length) % elements.length];
}

function fingerprint(element) {
  if (!element) return null;
  if (element.id) return { id: element.id };
  const data = Object.entries(element.dataset || {}).filter(([key]) => !['gamepadFocus'].includes(key)).sort(([a], [b]) => a.localeCompare(b));
  return { tag: element.tagName, data: JSON.stringify(data), label: element.getAttribute?.('aria-label') || element.name || element.textContent?.trim().slice(0, 120) || '' };
}
function sameFingerprint(element, expected) {
  if (!expected) return false; const actual = fingerprint(element);
  return expected.id ? actual?.id === expected.id : actual?.tag === expected.tag && actual?.data === expected.data && actual?.label === expected.label;
}
function emitInput(element, type) {
  const EventClass = element.ownerDocument?.defaultView?.Event || globalThis.Event;
  if (EventClass) element.dispatchEvent(new EventClass(type, { bubbles: true }));
}

/** All callbacks are optional. Call update(performance.now()) once per frame. */
export function createGamepadControls({ getMode = () => 'menu', getFocusRoot = () => null, onMove, onInteract, onBack, onPause,
  onSquad, onQuickAction, onShortcut, onConnectionChange, getGamepads = () => globalThis.navigator?.getGamepads?.() || [],
  document: doc = globalThis.document, window: win = globalThis.window } = {}) {
  const sampler = createGamepadSampler();
  let disposed = false, method = null, focused = true, lastNow = null, focusMark = null, keyboard = null, connected = null;
  let lastMovement = noMovement(), lastRoot = null;
  const mode = () => keyboard ? 'menu' : getMode();
  const root = () => keyboard?.panel || getFocusRoot();
  function setMethod(value) { method = value; if (doc?.documentElement) doc.documentElement.dataset.inputMethod = value; }
  function movement(value) {
    if (value.right !== lastMovement.right || value.forward !== lastMovement.forward || value.sprint !== lastMovement.sprint) {
      lastMovement = { ...value }; onMove?.({ ...value });
    }
  }
  function markFocus(element) {
    for (const previous of doc?.querySelectorAll?.('[data-gamepad-focus]') || []) if (previous !== element) previous.removeAttribute('data-gamepad-focus');
    if (!element.hasAttribute?.('data-gamepad-focus')) element.setAttribute?.('data-gamepad-focus', '');
    focusMark = fingerprint(element);
  }
  function focus(element) {
    if (!isGamepadFocusable(element)) return false;
    markFocus(element); element.focus?.({ preventScroll: true });
    element.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'instant' }); return true;
  }
  function ensureFocus() {
    const owner = root(), elements = gamepadFocusables(owner), active = doc?.activeElement;
    if (!owner || !elements.length) return null;
    if (elements.includes(active)) { markFocus(active); lastRoot = owner; return active; }
    const restored = elements.find(element => sameFingerprint(element, focusMark));
    const first = restored || elements.find(element => element.hasAttribute?.('autofocus')) || elements.find(element => element.dataset?.do !== 'close') || elements[0];
    lastRoot = owner; focus(first); return first;
  }
  function adjust(element, delta) {
    if (!isGamepadFocusable(element)) return false;
    if (element.readOnly) return true;
    if (element.tagName === 'SELECT') {
      const options = [...element.options].filter(option => !option.disabled && !option.parentElement?.disabled);
      if (!options.length) return true;
      const current = options.findIndex(option => option.value === element.value), next = options[(Math.max(0, current) + delta + options.length) % options.length];
      if (next.value !== element.value) { element.value = next.value; emitInput(element, 'input'); emitInput(element, 'change'); }
      return true;
    }
    if (element.tagName === 'INPUT' && ['range', 'number'].includes(element.type)) {
      const minimum = element.min === '' ? element.type === 'range' ? 0 : -Number.MAX_SAFE_INTEGER : Number(element.min);
      const maximum = element.max === '' ? element.type === 'range' ? 100 : Number.MAX_SAFE_INTEGER : Number(element.max);
      const step = Number(element.step) > 0 ? Number(element.step) : 1;
      const value = clamp((Number(element.value) || 0) + delta * step, minimum, maximum);
      if (Number(element.value) !== value) { element.value = String(Number(value.toFixed(8))); emitInput(element, 'input'); emitInput(element, 'change'); }
      return true;
    }
    return false;
  }
  function navigate(direction) {
    const current = ensureFocus(); if (!current) return;
    if (['left', 'right'].includes(direction) && adjust(current, direction === 'left' ? -1 : 1)) { ensureFocus(); return; }
    focus(gamepadFocusNeighbor(gamepadFocusables(root()), current, direction));
  }
  function closeKeyboard(commit = false) {
    if (!keyboard) return; const { panel, source, draft } = keyboard; keyboard = null; panel.remove();
    if (commit && source.isConnected !== false && isGamepadFocusable(source)) {
      let value = draft;
      if (source.type === 'number') {
        const parsed = Number(draft), minimum = source.min === '' ? -Number.MAX_SAFE_INTEGER : Number(source.min), maximum = source.max === '' ? Number.MAX_SAFE_INTEGER : Number(source.max);
        value = String(clamp(Number.isFinite(parsed) ? parsed : Number(source.value) || 0, minimum, maximum));
      }
      source.value = value; emitInput(source, 'input'); emitInput(source, 'change');
    }
    if (source.isConnected !== false) focus(source); lastRoot = root(); sampler.reset();
  }
  function openKeyboard(source) {
    if (!doc?.createElement || source.readOnly || source.disabled || keyboard) return;
    const panel = doc.createElement('section'); panel.className = 'gamepad-keyboard'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Clavier à l’écran');
    const draft = String(source.value || ''); keyboard = { panel, source, draft, uppercase: false };
    panel.innerHTML = '<div class="gamepad-keyboard-card"><h2>Clavier à l’écran</h2><p class="gamepad-keyboard-value" aria-live="polite"></p><div class="gamepad-keyboard-grid"></div><div class="gamepad-keyboard-footer"><button data-pad-key="case">Majuscule</button><button data-pad-key="space">Espace</button><button data-pad-key="delete">Effacer</button><button data-pad-key="cancel">Annuler</button><button data-pad-key="done">Valider</button></div><p class="small">Croix / stick : choisir · A / Croix : saisir · B / Rond : annuler</p></div>';
    const numeric = source.type === 'number';
    for (const character of (numeric ? '1234567890-' : 'abcdefghijklmnopqrstuvwxyz0123456789éèêàâçôùûïë-\'').split('')) {
      const button = doc.createElement('button'); button.type = 'button'; button.dataset.padLetter = character; button.textContent = character;
      panel.querySelector('.gamepad-keyboard-grid').appendChild(button);
    }
    panel.querySelector('.gamepad-keyboard-value').textContent = draft || '…';
    panel.addEventListener('click', event => {
      const button = event.target.closest('button'); if (!button || !keyboard || button.disabled) return;
      event.stopPropagation(); const key = button.dataset.padKey;
      if (key === 'cancel' || key === 'done') { closeKeyboard(key === 'done'); return; }
      if (key === 'case') { keyboard.uppercase = !keyboard.uppercase; for (const letter of panel.querySelectorAll('[data-pad-letter]')) letter.textContent = keyboard.uppercase ? letter.dataset.padLetter.toUpperCase() : letter.dataset.padLetter; }
      else if (key === 'delete') keyboard.draft = [...keyboard.draft].slice(0, -1).join('');
      else {
        const character = key === 'space' ? ' ' : button.dataset.padLetter;
        const maxLength = source.maxLength >= 0 ? source.maxLength : 300;
        const addition = keyboard.uppercase ? character?.toUpperCase() : character;
        if (addition && keyboard.draft.length + addition.length <= maxLength) keyboard.draft += addition;
      }
      panel.querySelector('.gamepad-keyboard-value').textContent = keyboard.draft || '…';
    });
    doc.body.appendChild(panel); lastRoot = panel; focusMark = null; ensureFocus(); sampler.reset();
  }
  function confirm() {
    const element = ensureFocus(); if (!element) return;
    if (element.tagName === 'SELECT') { adjust(element, 1); return; }
    if (['INPUT', 'TEXTAREA'].includes(element.tagName) && !['checkbox', 'radio', 'range', 'file', 'button', 'submit'].includes(element.type)) { openKeyboard(element); return; }
    if (isGamepadFocusable(element)) element.click?.();
  }
  function back() {
    if (keyboard) { closeKeyboard(false); return; }
    const owner = root();
    // Cancel the top transaction/step before a generic header close. Document
    // order would otherwise hide the explicit cancellation behind that header.
    const button = getGamepadBackControl(owner);
    if (isGamepadFocusable(button)) button.click(); else onBack?.();
  }
  let hintNode = null;
  function syncHint() {
    const currentMode = mode(), owner = root();
    if (!focused || keyboard || !owner || !['menu', 'combat'].includes(currentMode) || !['gamepad', 'keyboard'].includes(method)) {
      hintNode?.remove(); hintNode = null; return;
    }
    if (!doc?.createElement) return;
    const active = doc.activeElement, input = ['INPUT', 'TEXTAREA', 'SELECT'].includes(active?.tagName), hasBack = !!getGamepadBackControl(owner);
    const padBack = hasBack ? ' · B / Rond : retour' : '', keyBack = hasBack ? ' · Échap : retour' : '';
    let message;
    if (method === 'gamepad') {
      message = active?.tagName === 'SELECT' ? `Manette · Gauche / droite : changer le choix · A / Croix : suivant${padBack}`
        : input && ['range', 'number'].includes(active.type) ? `Manette · Gauche / droite : régler${padBack}`
          : input && !['checkbox', 'radio'].includes(active.type) ? `Manette · A / Croix : clavier à l’écran${padBack}`
            : currentMode === 'combat' ? 'Manette · A / Croix : choisir · LB / RB : équipier · Start : pause'
              : `Manette · A / Croix : confirmer${padBack} · Croix directionnelle : choisir · Stick droit : lire`;
    } else {
      message = input ? active.tagName === 'SELECT' || ['range', 'number'].includes(active.type)
        ? 'Clavier · Flèches : régler · Tab : champ suivant'
        : ['checkbox', 'radio'].includes(active.type) ? 'Clavier · Espace : cocher · Tab : champ suivant'
          : 'Clavier · Saisir le texte · Tab : champ suivant'
        : currentMode === 'combat' ? 'Clavier · Entrée : choisir · Flèches / Tab : naviguer · Espace : tir rapide'
          : `Clavier · Entrée : confirmer · Flèches / Tab : choisir${keyBack} · Page haut / bas : lire`;
    }
    if (!hintNode || !owner.contains?.(hintNode)) {
      hintNode?.remove(); hintNode = doc.createElement('p'); hintNode.className = 'gamepad-command-hint';
      const container = owner.querySelector?.('.screen-foot,.dialogue-body,.actions-panel,.title-menu') || owner.querySelector?.('.screen') || owner;
      container.appendChild(hintNode);
    }
    if (hintNode.textContent !== message) hintNode.textContent = message;
  }
  function dispatch(action) {
    if (action.type === 'navigate') navigate(action.direction);
    else if (action.type === 'confirm') confirm(); else if (action.type === 'back') back();
    else if (action.type === 'interact') onInteract?.(); else if (action.type === 'pause') { if (keyboard) closeKeyboard(false); else onPause?.(); }
    else if (action.type === 'squad') onSquad?.(action.delta); else if (action.type === 'quick') onQuickAction?.();
    else if (action.type === 'shortcut') onShortcut?.(action.name);
  }
  function reset() { sampler.reset(); movement(noMovement()); lastNow = null; }
  function handleKeyDown(event) {
    if (disposed || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return false;
    setMethod('keyboard');
    if (!['menu', 'combat'].includes(mode())) return false;
    if (mode() === 'combat' && event.code === 'Space') return false; // Preserve the campaign's existing quick-fire shortcut.
    const target = event.target, editing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName) || target?.isContentEditable;
    if (editing && event.code !== 'Tab') return false;
    let handled = false;
    if (DIRECTIONS.includes(event.key?.toLowerCase().replace('arrow', ''))) { setMethod('keyboard'); navigate(event.key.toLowerCase().replace('arrow', '')); handled = true; }
    else if (['Enter', 'Space', 'NumpadEnter'].includes(event.code)) { if (event.repeat) handled = true; else { setMethod('keyboard'); confirm(); handled = true; } }
    else if (event.code === 'Escape') { setMethod('keyboard'); if (!event.repeat) back(); handled = true; }
    else if (['PageUp', 'PageDown', 'Home', 'End'].includes(event.code)) {
      const scrolling = getGamepadScrollTarget(root(), doc?.activeElement);
      if (scrolling) {
        const amount = Math.max(30, scrolling.clientHeight * .85), current = Number(scrolling.scrollTop) || 0;
        const next = event.code === 'Home' ? 0 : event.code === 'End' ? scrolling.scrollHeight
          : current + (event.code === 'PageUp' ? -amount : amount);
        scrolling.scrollTo?.({ top: Math.max(0, next), behavior: 'instant' }); handled = true;
      }
    }
    else if (event.code === 'Tab') {
      const elements = gamepadFocusables(root()), index = elements.indexOf(doc?.activeElement);
      if (elements.length) {
        // Chromium may add scrollable containers to the native Tab sequence even
        // without tabindex. Frame-based focus repair would restore the previous
        // button and trap Tab before the footer. Follow the same actionable list
        // for every Tab, including inputs, without replacing their editing keys.
        const next = index < 0 ? event.shiftKey ? elements.length - 1 : 0
          : (index + (event.shiftKey ? -1 : 1) + elements.length) % elements.length;
        setMethod('keyboard'); focus(elements[next]); handled = true;
      }
    }
    if (handled) { event.preventDefault(); event.stopImmediatePropagation?.(); }
    return handled;
  }
  const blur = () => { focused = false; closeKeyboard(false); reset(); };
  const resume = () => { focused = !doc?.hidden; reset(); };
  const visibility = () => { if (doc?.hidden) blur(); else resume(); };
  const pointer = () => { setMethod('pointer'); };
  doc?.addEventListener?.('keydown', handleKeyDown, true); doc?.addEventListener?.('visibilitychange', visibility);
  doc?.addEventListener?.('pointerdown', pointer, true); win?.addEventListener?.('blur', blur); win?.addEventListener?.('focus', resume);
  function update(now = 0) {
    if (disposed) return;
    now = Math.max(0, number(now)); const delta = lastNow === null ? 0 : (now - lastNow) / 1000;
    const elapsed = delta >= 0 && delta <= 2 ? delta : 0; lastNow = now;
    let pads = []; if (focused && !doc?.hidden) try { pads = getGamepads(); } catch { /* Permissions/browser: remain keyboard-accessible. */ }
    const input = sampler.sample(pads, now, mode());
    if (input.connected !== connected) { connected = input.connected; onConnectionChange?.({ connected, id: input.id || null, standardMapping: connected }); }
    movement(input.movement);
    if (input.connected && (input.actions.length || input.scroll || input.movement.right || input.movement.forward)) setMethod('gamepad');
    if (focused && !doc?.hidden && ['menu', 'combat'].includes(mode()) && ['gamepad', 'keyboard'].includes(method)) ensureFocus();
    syncHint();
    if (!input.connected) return;
    for (const action of input.actions) dispatch(action);
    if (input.scroll && elapsed) {
      const owner = root(), scrolling = getGamepadScrollTarget(owner, doc?.activeElement);
      scrolling?.scrollBy?.({ top: input.scroll * elapsed * 520, behavior: 'instant' });
    }
  }
  function dispose() {
    if (disposed) return; closeKeyboard(false); reset(); hintNode?.remove(); hintNode = null; disposed = true;
    doc?.removeEventListener?.('keydown', handleKeyDown, true); doc?.removeEventListener?.('visibilitychange', visibility);
    doc?.removeEventListener?.('pointerdown', pointer, true); win?.removeEventListener?.('blur', blur); win?.removeEventListener?.('focus', resume);
  }
  return { update, reset, dispose, handleKeyDown, focus: ensureFocus, getSnapshot: () => ({ method, connected: connected === true, focused, editing: !!keyboard, movement: { ...lastMovement } }) };
}
