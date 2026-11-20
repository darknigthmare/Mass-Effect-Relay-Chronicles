// Keep this list alongside the delegated click dispatcher. These controls
// can commit a transaction, launch an irreversible step or advance a dialogue.
const CONFIRMATION_ACTIONS = new Set([
  'begin', 'continue', 'load', 'travel', 'return-normandy', 'interact',
  'dialogue-choice', 'human-nomination',
  'manual-save', 'manual-load', 'manual-delete', 'manual-confirm', 'save',
  'export', 'export-campaign', 'import', 'custom-apply',
  'buy', 'eq-buy', 'eq-sell', 'eq-equip', 'eq-unequip', 'eq-train', 'talent-buy',
  'crew-confirm', 'track', 'track-campaign', 'track-operation',
  'battle-action', 'battle-target', 'battle-retreat', 'claim-victory', 'retry',
  'coord-reserve', 'coord-release', 'coord-execute',
  'chronicle-start', 'chronicle-load', 'chronicle-save', 'chronicle-import',
  'chronicle-export', 'chronicle-continuity-import', 'chronicle-continuity-clear',
  'chronicle-party', 'chronicle-battle', 'chronicle-action', 'chronicle-target',
]);

/**
 * Accept the first click in the browser's multi-click sequence. A mutation can
 * rerender the screen before the second click, so node identity is not a safe
 * way to recognize the gesture. Keyboard and gamepad activations carry no
 * pointer click count and retain their own held-input handling.
 */
export function isRepeatedConfirmation(event, action) {
  return event.detail > 1 && CONFIRMATION_ACTIONS.has(action);
}
