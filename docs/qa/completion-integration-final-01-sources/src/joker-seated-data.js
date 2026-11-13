const plain = value => !!value && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};

/** Two fixed drawings, not a new animation, actor or conversation state. */
export function normalizeJokerSeated(input) {
  try {
    if (!plain(input) || input.version !== 1 || input.characterId !== 'joker' || input.mediaId !== 'ME1'
      || input.periodId !== 'me1' || input.file !== 'joker-seated.png'
      || ![input.width, input.height].every(value => Number.isInteger(value) && value > 0 && value <= 8192)
      || !plain(input.frames)) return null;
    const frames = {};
    for (const pose of ['idle', 'pilot']) {
      const frame = input.frames[pose];
      if (!plain(frame) || frame.id !== `joker-seated-${pose}`
        || !Array.isArray(frame.rect) || frame.rect.length !== 4 || !frame.rect.every(Number.isInteger)
        || !Array.isArray(frame.pivot) || frame.pivot.length !== 2 || !frame.pivot.every(Number.isFinite)
        || !Number.isFinite(frame.heightScale) || frame.heightScale < .05 || frame.heightScale > 1.5) return null;
      const [x, y, width, height] = frame.rect;
      if (x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > input.width || y + height > input.height
        || frame.pivot[0] < 0 || frame.pivot[0] > width || frame.pivot[1] < 0 || frame.pivot[1] > height) return null;
      frames[pose] = { id: frame.id, rect: [...frame.rect], pivot: [...frame.pivot], heightScale: frame.heightScale };
    }
    return freeze({ version: 1, characterId: 'joker', mediaId: 'ME1', periodId: 'me1', status: 'Prototype',
      file: 'joker-seated.png', width: input.width, height: input.height, frames });
  } catch { return null; }
}

export function canShowJokerSeated(actor, zoneId) {
  return zoneId === 'normandy' && actor?.id === 'npc:joker' && actor.key === 'joker'
    && actor.enemy === false && actor.stationRole === 'normandy-pilot';
}
