// Loaded with the Chronicle UI. A reference image grants no campaign or party access.
import { normalizeContext, canAccessContent } from './continuity.js';
import { getHorizonFleetReferenceVisual } from './horizon-fleet-reference.js';
import { getHorizonFaunaReferenceVisual } from './horizon-fauna.js';

function bundledAtlases() {
  return {
    fleet: typeof __RELAY_HORIZON_FLEET_ATLASES__ === 'undefined' ? {} : __RELAY_HORIZON_FLEET_ATLASES__,
    fauna: typeof __RELAY_HORIZON_FAUNA_ATLAS__ === 'undefined' ? null : __RELAY_HORIZON_FAUNA_ATLAS__,
  };
}
export function getHorizonReferenceVisual(recordId, rawContext, options = {}, atlases = bundledAtlases()) {
  const context = normalizeContext(rawContext);
  if (!context || typeof recordId !== 'string' || options?.usage !== undefined && options.usage !== 'reference'
    || !canAccessContent(recordId, context).ok) return null;
  return getHorizonFleetReferenceVisual(recordId, context, atlases.fleet)
    || getHorizonFaunaReferenceVisual(recordId, context, atlases.fauna);
}

export function filterHorizonReferences(records, rawContext, kind, atlases = bundledAtlases()) {
  if (!['fleet', 'fauna'].includes(kind)) return records;
  const context = normalizeContext(rawContext);
  if (!context || !Array.isArray(records)) return [];
  return records.filter(record => canAccessContent(record.id, context).ok && (kind === 'fleet'
    ? getHorizonFleetReferenceVisual(record.id, context, atlases.fleet)
    : getHorizonFaunaReferenceVisual(record.id, context, atlases.fauna)));
}
