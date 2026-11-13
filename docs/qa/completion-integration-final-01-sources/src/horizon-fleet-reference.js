// Imported by the lazy Chronicle UI, never by the ME1 scene or initial bundle.
import { normalizeContext, canAccessContent } from './continuity.js';
import { HORIZON_FLEET, getHorizonFleetFrame, horizonFleetContextMatches } from './horizon-fleet.js';

/** Exact catalogue eligibility and reference usage only; no world/party grant. */
export function getHorizonFleetReferenceVisual(recordId, rawContext, atlases) {
  try {
    const context = normalizeContext(rawContext);
    if (typeof recordId !== 'string' || !context || !canAccessContent(recordId, context).ok) return null;
    const entry = HORIZON_FLEET.find(item => item.recordIds.includes(recordId) && horizonFleetContextMatches(item.id, context));
    const atlas = entry && atlases?.[entry.familyId], frame = entry && getHorizonFleetFrame(entry.id, atlas);
    return frame ? { id: `horizon-fleet:${entry.id}`, recordIds: [...entry.recordIds], mediaId: entry.mediaId,
      periodIds: [...entry.periodIds], category: 'ships', src: `./assets/${atlas.file}`,
      atlasWidth: atlas.width, atlasHeight: atlas.height, sourceRect: [...frame.rect], sha256: atlas.sha256,
      caption: entry.caption, partial: true, primaryVisualVerified: false } : null;
  } catch { return null; }
}
