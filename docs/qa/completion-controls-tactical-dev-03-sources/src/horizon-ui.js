const escapeAttribute = value => String(value).replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]));

/** The inner viewport clips the source cell even in an outer letterbox. */
export function atlasFrameSVG(atlas, frame, baseURL = './') {
  if (!atlas || !/^[A-Za-z0-9][A-Za-z0-9._-]*\.png$/.test(atlas.file)
    || ![atlas.width, atlas.height].every(value => Number.isInteger(value) && value > 0)
    || !Array.isArray(frame?.rect) || frame.rect.length !== 4 || !frame.rect.every(Number.isInteger)) return '';
  const [x, y, width, height] = frame.rect;
  if (x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > atlas.width || y + height > atlas.height) return '';
  const box = frame.rect.join(' '), href = escapeAttribute(`${baseURL}assets/${atlas.file}`);
  return `<svg viewBox="${box}" overflow="hidden" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${box}" overflow="hidden"><image href="${href}" width="${atlas.width}" height="${atlas.height}"/></svg></svg>`;
}

/** Contact links must never activate an operation's distant objective/battle. */
export function nearbyConversationOperation(npc, conversationPOI, operationPOIs) {
  if (!npc?.operationId || !conversationPOI || !Array.isArray(operationPOIs)
    || ![conversationPOI.x, conversationPOI.z].every(Number.isFinite)) return null;
  return operationPOIs.find(poi => poi.operationId === npc.operationId
    && typeof poi.stepId === 'string' && [poi.x, poi.z].every(Number.isFinite)
    && Math.hypot(poi.x - conversationPOI.x, poi.z - conversationPOI.z) < 4) || null;
}
