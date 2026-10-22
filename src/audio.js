/**
 * Original, local Web Audio score and effects. No recordings, remote assets or
 * franchise themes are used. AudioContext is created/resumed only by unlock(),
 * which the host should call from a click/key gesture. The host owns persistence.
 */

const PROFILES = {
  normandy: { root: 55, beat: 0.82, filter: 620, notes: [0, null, 7, null, 12, null, 7, null, 3, null, 7, null] },
  'eden-prime': { root: 61.735, beat: 0.72, filter: 880, notes: [0, null, 3, null, 7, null, 10, null, 7, null, 3, null] },
  citadel: { root: 65.406, beat: 0.7, filter: 1300, notes: [0, null, 7, 14, null, 19, null, 14, null, 7, null, null] },
  therum: { root: 58.27, beat: 0.62, filter: 700, notes: [0, null, 5, null, 7, null, 12, null, 7, null, 5, null] },
  feros: { root: 49, beat: 0.86, filter: 540, notes: [0, null, null, 2, null, 7, null, null, 10, null, 7, null] },
  noveria: { root: 65.406, beat: 0.9, filter: 1450, notes: [12, null, 7, null, null, 14, null, 5, null, null, 7, null] },
  virmire: { root: 55, beat: 0.66, filter: 920, notes: [0, null, 3, null, 7, null, 12, null, 10, null, 7, null] },
  ilos: { root: 43.654, beat: 1.05, filter: 980, notes: [0, null, null, 7, null, 12, null, null, 14, null, 7, null] },
  'citadel-finale': { root: 51.913, beat: 0.58, filter: 800, notes: [0, null, 3, 7, null, 10, null, 7, null, 3, null, null] },
};

const POWER_EVENTS = new Set(['power', 'overload', 'sabotage', 'hack', 'signature']);
const BIOTIC_EVENTS = new Set(['biotic', 'lift', 'throw', 'warp', 'singularity', 'stasis', 'barrier']);
const MAX_VOICES = 16;
const validVolume = value => Math.min(1, Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0.35));

export class AudioDirector {
  constructor() {
    this.enabled = true;
    this.volume = 0.35;
    this.zoneId = 'normandy';
    this._context = null;
    this._master = null;
    this._music = null;
    this._effects = null;
    this._filter = null;
    this._compressor = null;
    this._voices = new Set();
    this._timer = null;
    this._step = 0;
    this._nextNote = 0;
    this._lastEvents = new Map();
    this._unlocked = false;
    this._unlocking = null;
    this._disposed = false;
    this._lastExplorationZone = 'normandy';
    this._document = typeof document === 'undefined' ? null : document;
    this._visibilityHandler = () => {
      if (this._hidden()) this._stopMusic();
      this._applyVolume();
      if (!this._hidden()) this._startMusic();
    };
  }

  /** Returns false when Web Audio is unavailable or the browser blocks activation. */
  async unlock() {
    if (this._disposed) return false;
    if (this._unlocking) return this._unlocking;
    this._unlocking = this._activate();
    try { return await this._unlocking; }
    finally { this._unlocking = null; }
  }

  async _activate() {
    try {
      if (!this._context) {
        const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!AudioContextClass) return false;
        const context = new AudioContextClass({ latencyHint: 'interactive' });
        this._context = context;
        this._master = context.createGain();
        this._music = context.createGain();
        this._effects = context.createGain();
        this._filter = context.createBiquadFilter();
        this._compressor = context.createDynamicsCompressor();
        this._master.gain.value = 0;
        this._music.gain.value = 0.16;
        this._effects.gain.value = 0.42;
        this._filter.type = 'lowpass';
        this._filter.frequency.value = 900;
        this._filter.Q.value = 0.55;
        this._compressor.threshold.value = -16;
        this._compressor.knee.value = 20;
        this._compressor.ratio.value = 3;
        this._compressor.attack.value = 0.008;
        this._compressor.release.value = 0.25;
        this._music.connect(this._filter);
        this._filter.connect(this._master);
        this._effects.connect(this._master);
        this._master.connect(this._compressor);
        this._compressor.connect(context.destination);
        this._document?.addEventListener('visibilitychange', this._visibilityHandler);
      }
      if (!['running', 'closed'].includes(this._context.state)) await this._context.resume();
      if (this._disposed || this._context.state !== 'running') return false;
      this._unlocked = true;
      this._applyVolume();
      this._startMusic();
      return true;
    } catch {
      return false;
    }
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    this._applyVolume();
    if (!this.enabled) {
      this._stopMusic();
      for (const voice of this._voices) this._release(voice);
    } else this._startMusic();
    return this.enabled;
  }

  setVolume(volume) {
    this.volume = validVolume(volume);
    this._applyVolume();
    return this.volume;
  }

  /** Use a chapter id, "combat", or "combat:chapter-id" for battle variation. */
  setZone(zoneId) {
    const next = typeof zoneId === 'string' && zoneId ? zoneId : 'normandy';
    if (next === this.zoneId || this._disposed) return;
    this.zoneId = next;
    if (PROFILES[next]) this._lastExplorationZone = next;
    this._stopMusic();
    this._startMusic();
  }

  _hidden() {
    return this._document?.visibilityState === 'hidden';
  }

  _canPlay() {
    return !this._disposed && this.enabled && this._unlocked && !this._hidden() && this._context?.state === 'running';
  }

  _applyVolume() {
    if (!this._context || !this._master || this._disposed) return;
    const now = this._context.currentTime;
    this._master.gain.cancelScheduledValues(now);
    this._master.gain.setTargetAtTime(this.enabled && !this._hidden() ? this.volume : 0, now, 0.045);
  }

  _profile() {
    const combat = /(?:combat|battle)/.test(this.zoneId);
    const requested = this.zoneId.split(':').find(part => PROFILES[part]);
    const base = PROFILES[requested || this.zoneId] || PROFILES[this._lastExplorationZone] || PROFILES.normandy;
    return combat ? { ...base, combat: true, beat: 0.36, filter: Math.min(1400, base.filter + 250) } : base;
  }

  _startMusic() {
    if (!this._canPlay() || this._timer !== null) return;
    const profile = this._profile();
    const now = this._context.currentTime;
    this._filter.frequency.setTargetAtTime(profile.filter, now, 0.5);
    this._drone(profile.root, 0.17, 'sine');
    this._drone(profile.root * 1.5, 0.075, 'triangle');
    this._step = 0;
    this._nextNote = now + 0.15;
    this._schedule();
    this._timer = globalThis.setInterval(() => this._schedule(), 120);
  }

  _stopMusic() {
    if (this._timer !== null) {
      globalThis.clearInterval(this._timer);
      this._timer = null;
    }
    for (const voice of this._voices) if (voice.kind === 'music') this._release(voice, 0.16);
  }

  _schedule() {
    if (!this._canPlay()) return;
    const now = this._context.currentTime;
    if (this._nextNote < now - 0.25) this._nextNote = now + 0.03;
    const profile = this._profile();
    let scheduled = 0;
    while (this._nextNote < now + 0.25 && scheduled < 4) {
      const offset = profile.notes[this._step % profile.notes.length];
      if (offset !== null) {
        const octave = this._step % 24 >= 12 ? 4 : 2;
        this._tone(profile.root * octave * 2 ** (offset / 12), this._nextNote, profile.combat ? 0.45 : 1.25, {
          kind: 'music', gain: profile.combat ? 0.10 : 0.09, type: 'sine',
        });
      }
      if (profile.combat && this._step % 2 === 0) {
        this._tone(profile.root * 2, this._nextNote, 0.16, { kind: 'music', gain: 0.17, type: 'triangle', to: profile.root });
      }
      this._step += 1;
      this._nextNote += profile.beat;
      scheduled += 1;
    }
  }

  _drone(frequency, gain, type) {
    if (this._voices.size >= MAX_VOICES) return;
    const now = this._context.currentTime;
    const oscillator = this._context.createOscillator();
    const envelope = this._context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.linearRampToValueAtTime(gain, now + 1.8);
    oscillator.connect(envelope);
    envelope.connect(this._music);
    const voice = this._track(oscillator, envelope, 'music');
    oscillator.start(now);
    return voice;
  }

  _tone(frequency, start, duration, { gain = 0.15, type = 'sine', to, kind = 'effect' } = {}) {
    if (!this._canPlay() || this._voices.size >= MAX_VOICES) return false;
    const now = this._context.currentTime;
    const when = Math.max(now, start);
    const oscillator = this._context.createOscillator();
    const envelope = this._context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(20, frequency), when);
    if (to) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, to), when + duration);
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.linearRampToValueAtTime(gain, when + Math.min(0.015, duration * 0.2));
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    oscillator.connect(envelope);
    envelope.connect(kind === 'music' ? this._music : this._effects);
    this._track(oscillator, envelope, kind);
    oscillator.start(when);
    oscillator.stop(when + duration + 0.025);
    return true;
  }

  _track(oscillator, envelope, kind) {
    const voice = { oscillator, envelope, kind, released: false };
    this._voices.add(voice);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
      this._voices.delete(voice);
    };
    return voice;
  }

  _release(voice, fade = 0.06) {
    if (voice.released || !this._context) return;
    voice.released = true;
    const now = this._context.currentTime;
    try {
      voice.envelope.gain.cancelScheduledValues(now);
      voice.envelope.gain.setTargetAtTime(0.0001, now, Math.max(0.005, fade / 4));
      voice.oscillator.stop(now + fade);
    } catch {
      voice.oscillator.disconnect();
      voice.envelope.disconnect();
      this._voices.delete(voice);
    }
  }

  /** Accepts a named event or a combat event containing actionId/type. */
  play(eventType) {
    if (!this._canPlay() || this.volume === 0) return false;
    const requested = typeof eventType === 'string' ? eventType : eventType?.actionId || eventType?.type;
    const event = ({ win: 'victory', lose: 'defeat', dialogue: 'ui' })[requested] || requested;
    if (!event) return false;
    const now = this._context.currentTime;
    if (now - (this._lastEvents.get(event) ?? -Infinity) < (event === 'ui' ? 0.07 : 0.045)) return false;
    this._lastEvents.set(event, now);
    const tone = (frequency, delay, duration, options = {}) => this._tone(frequency, now + delay, duration, options);
    if (['ui', 'select', 'menu', 'confirm'].includes(event)) {
      tone(740, 0, 0.07, { gain: 0.06 });
      tone(990, 0.025, 0.06, { gain: 0.035 });
    } else if (event === 'shoot' || event === 'burst') {
      const count = event === 'burst' ? 3 : 1;
      for (let index = 0; index < count; index += 1) {
        tone(190, index * 0.065, 0.105, { type: 'triangle', gain: 0.26, to: 48 });
        tone(1500, index * 0.065, 0.045, { gain: 0.055, to: 360 });
      }
    } else if (event === 'strike' || event === 'damage') {
      tone(125, 0, 0.15, { type: 'triangle', gain: 0.2, to: 42 });
    } else if (event === 'acid') {
      tone(470, 0, 0.34, { type: 'triangle', gain: 0.13, to: 75 });
      tone(165, 0.04, 0.35, { gain: 0.085, to: 215 });
    } else if (POWER_EVENTS.has(event)) {
      tone(165, 0, 0.3, { type: 'triangle', gain: 0.15, to: 680 });
      tone(490, 0.045, 0.32, { gain: 0.10, to: 880 });
    } else if (BIOTIC_EVENTS.has(event)) {
      tone(110, 0, 0.55, { gain: 0.17, to: 440 });
      tone(220, 0.07, 0.48, { type: 'triangle', gain: 0.07, to: 660 });
    } else if (['heal', 'medigel', 'unity', 'revive'].includes(event)) {
      [440, 554, 660].forEach((frequency, index) => tone(frequency, index * 0.065, 0.22, { gain: 0.09 }));
    } else if (event === 'victory') {
      [330, 440, 550, 660].forEach((frequency, index) => tone(frequency, index * 0.15, 0.48, { gain: 0.105 }));
    } else if (event === 'defeat' || event === 'gameover') {
      [165, 138.6, 110].forEach((frequency, index) => tone(frequency, index * 0.22, 0.6, { gain: 0.10 }));
    } else if (event === 'battle' || event === 'combat') {
      tone(82.4, 0, 0.6, { type: 'triangle', gain: 0.15, to: 55 });
      tone(220, 0.08, 0.35, { gain: 0.07, to: 165 });
    } else if (event === 'save' || event === 'pickup' || event === 'recruit') {
      tone(660, 0, 0.16, { gain: 0.08 });
      tone(990, 0.075, 0.2, { gain: 0.06 });
    } else if (event === 'error' || event === 'blocked') {
      tone(180, 0, 0.14, { gain: 0.08, to: 138 });
    } else if (event === 'cover' || event === 'reposition') {
      tone(310, 0, 0.1, { gain: 0.05, to: 235 });
    } else return false;
    return true;
  }

  /** Stops timers, disconnects all nodes and releases the AudioContext. */
  dispose() {
    if (this._disposed) return;
    this._stopMusic();
    this._disposed = true;
    this._document?.removeEventListener('visibilitychange', this._visibilityHandler);
    for (const voice of this._voices) {
      try { voice.oscillator.stop(); } catch { /* Already stopped. */ }
      voice.oscillator.onended = null;
      voice.oscillator.disconnect();
      voice.envelope.disconnect();
    }
    this._voices.clear();
    this._lastEvents.clear();
    for (const node of [this._music, this._effects, this._filter, this._master, this._compressor]) node?.disconnect();
    if (this._context && this._context.state !== 'closed') this._context.close().catch(() => {});
    this._unlocked = false;
  }
}

export default AudioDirector;
