import { CREW } from './game-data.js';
import { STORY_CONVERSATIONS } from './story-data.js';
import { migrateStoryState } from './story.js';
import { EXPLORATION_BANTERS, isExplorationBanterKey, explorationBanterPossible } from './continuation-banter-data.js';

export const BANTER_FIRST_DELAY = 8;
export const BANTER_COOLDOWN = 24;
// story.heard has a deliberate 64-entry defensive bound. Reserve every regular
// topic, including topics not yet heard, instead of truncating narrative data.
export const BANTER_CAMPAIGN_LIMIT = Math.max(0, 64 - Object.values(STORY_CONVERSATIONS).reduce((total, conversation) => total + conversation.topics.length, 0));

export function availableExplorationBanter(state) {
  const story = migrateStoryState(state?.story, state);
  if (!story || story.heard.filter(isExplorationBanterKey).length >= BANTER_CAMPAIGN_LIMIT || story.heard.length >= 64) return null;
  const entry = EXPLORATION_BANTERS.find(candidate => !story.heard.includes(candidate.id) && explorationBanterPossible(state, story, candidate));
  if (!entry) return null;
  const lines = entry.lines.map(line => ({ ...line, speaker: CREW[line.speakerId].name }));
  return { id: entry.id, catalogId: entry.catalogId, lines, text: lines.map(line => `${line.speaker} : ${line.text}`).join('\n') };
}

/** The caller supplies actual foreground simulation steps, never wall time. */
export function createExplorationBanterController() {
  let owner = null, context = '', elapsed = 0, delay = BANTER_FIRST_DELAY;
  const reset = () => { owner = null; context = ''; elapsed = 0; delay = BANTER_FIRST_DELAY; };
  return {
    reset,
    update(state, foregroundDt, { eligible = false } = {}) {
      const nextContext = `${state?.zone || ''}|${state?.party?.join(',') || ''}`;
      if (state !== owner || nextContext !== context) {
        owner = state; context = nextContext; elapsed = 0; delay = BANTER_FIRST_DELAY;
      }
      if (!eligible || !state || !Number.isFinite(foregroundDt) || foregroundDt <= 0 || foregroundDt > 1) return null;
      elapsed += foregroundDt;
      if (elapsed + 1e-9 < delay) return null;
      elapsed = 0; delay = BANTER_COOLDOWN;
      const event = availableExplorationBanter(state);
      if (!event) return null;
      // Rebuild the validated story before the sole mutation. A refusal leaves
      // the entire state untouched. Playback has no progression/reward effect.
      const story = migrateStoryState(state.story, state);
      if (!story) return null;
      story.heard.push(event.id);
      state.story = story;
      return event;
    },
  };
}
