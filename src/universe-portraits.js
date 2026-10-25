// Generated bust portraits are a visual overlay for three exact work identities.
// They never change native actors, recruitment, combat, or the ME1 campaign.
import { normalizeContext } from './continuity.js';
import { canUseUniverseActor } from './universe-actors.js';

const MODE = 'generated-portrait-prototype';
export const UNIVERSE_PORTRAIT_ATLAS = Object.freeze({
  src: './assets/chronicle-portraits-me2-me3.png',
  atlasWidth: 1536,
  atlasHeight: 1024,
  sha256: '7e1e20382766f0740e06dcae7f4598ff3f9d2528fc434988e495a129803b3ebd',
});

export const UNIVERSE_PORTRAITS = Object.freeze([
  ['ME2-CHR-MIRANDA', 'ME2', 'me2', 'chronicle-portrait-me2-miranda', 0],
  ['ME2-CHR-THANE', 'ME2', 'me2', 'chronicle-portrait-me2-thane', 512],
  ['ME3-CHR-GARRUS', 'ME3', 'me3', 'chronicle-portrait-me3-garrus', 1024],
].map(([actorId, mediaId, periodId, assetId, x]) => Object.freeze({
  ...UNIVERSE_PORTRAIT_ATLAS,
  actorId, mediaId, periodId, assetId,
  sourceRect: Object.freeze([x, 0, 512, 1024]),
  mode: MODE,
  sprite: null,
  status: 'Prototype',
  partial: true,
})));

const byActor = new Map(UNIVERSE_PORTRAITS.map(portrait => [portrait.actorId, portrait]));

/** A missing or unavailable identity keeps its existing symbolic presentation. */
export function getUniversePortrait(actorId, rawContext, scenarioId) {
  try {
    if (typeof actorId !== 'string' || scenarioId !== undefined && typeof scenarioId !== 'string') return null;
    const portrait = byActor.get(actorId), context = normalizeContext(rawContext);
    if (!portrait || !context || portrait.mediaId !== context.mediaId || portrait.periodId !== context.periodId
      || !canUseUniverseActor(context, actorId, scenarioId).ok) return null;
    return portrait;
  } catch { return null; }
}
