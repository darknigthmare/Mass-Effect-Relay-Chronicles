// Fixed simulation steps preserve elapsed foreground time at low frame rates.
// A long suspension is discarded explicitly, never replayed after focus returns.
export function createSimulationClock({ stepSeconds = 1 / 60, suspensionSeconds = 2 } = {}) {
  if (!Number.isFinite(stepSeconds) || stepSeconds <= 0 || stepSeconds > .05
    || !Number.isFinite(suspensionSeconds) || suspensionSeconds < stepSeconds || suspensionSeconds > 5) throw new RangeError('Invalid simulation clock configuration');
  let previous = null, remainder = 0;
  return {
    reset(now) { previous = Number.isFinite(now) ? now : null; remainder = 0; },
    advance(now, { suspended = false } = {}) {
      if (!Number.isFinite(now)) { previous = null; remainder = 0; return { steps: 0, stepSeconds, elapsed: 0, interrupted: false }; }
      if (previous === null) { previous = now; return { steps: 0, stepSeconds, elapsed: 0, interrupted: false }; }
      const elapsed = (now - previous) / 1000; previous = now;
      if (suspended || elapsed < 0 || elapsed > suspensionSeconds) {
        remainder = 0;
        return { steps: 0, stepSeconds, elapsed: 0, interrupted: !suspended && elapsed > suspensionSeconds };
      }
      remainder += elapsed;
      const steps = Math.floor((remainder + 1e-10) / stepSeconds);
      remainder = Math.max(0, remainder - steps * stepSeconds);
      return { steps, stepSeconds, elapsed: steps * stepSeconds, interrupted: false };
    },
  };
}
