import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioDirector } from '../src/audio.js';

// This double exercises lifecycle/scheduling, not perceived sound quality.
function environment({ supported = true, deferredResume = false } = {}) {
  const keys = ['AudioContext', 'webkitAudioContext', 'document', 'setInterval', 'clearInterval'];
  const previous = new Map(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const timers = new Map();
  const contexts = [];
  const listeners = new Set();
  let timerId = 0;
  let finishResume = null;
  class Parameter {
    constructor(value = 0) { this.value = value; }
    setValueAtTime(value) { this.value = value; }
    linearRampToValueAtTime(value) { this.value = value; }
    exponentialRampToValueAtTime(value) { this.value = value; }
    setTargetAtTime(value) { this.value = value; }
    cancelScheduledValues() {}
  }
  class AudioNode {
    constructor(context) {
      this.context = context;
      this.disconnected = false;
      for (const key of ['gain', 'frequency', 'Q', 'threshold', 'knee', 'ratio', 'attack', 'release']) this[key] = new Parameter();
      context.nodes.push(this);
    }
    connect() {}
    disconnect() { this.disconnected = true; }
  }
  class Oscillator extends AudioNode {
    constructor(context) {
      super(context);
      this.ended = false;
      this.stopAt = Infinity;
      context.oscillators.push(this);
    }
    start(when = this.context.currentTime) { this.startAt = when; }
    stop(when = this.context.currentTime) { this.stopAt = when; }
  }
  class AudioContextDouble {
    constructor() {
      this.nodes = [];
      this.oscillators = [];
      this.currentTime = 0;
      this.state = 'suspended';
      this.resumeCalls = 0;
      this.destination = new AudioNode(this);
      contexts.push(this);
    }
    createGain() { return new AudioNode(this); }
    createBiquadFilter() { return new AudioNode(this); }
    createDynamicsCompressor() { return new AudioNode(this); }
    createOscillator() { return new Oscillator(this); }
    async resume() {
      this.resumeCalls += 1;
      if (deferredResume) await new Promise(resolve => { finishResume = resolve; });
      if (this.state !== 'closed') this.state = 'running';
    }
    async close() { this.state = 'closed'; }
    advance(seconds) {
      this.currentTime += seconds;
      for (const oscillator of this.oscillators) {
        if (!oscillator.ended && oscillator.stopAt <= this.currentTime) {
          oscillator.ended = true;
          oscillator.onended?.();
        }
      }
    }
  }
  const fakeDocument = {
    visibilityState: 'visible',
    addEventListener(type, callback) { if (type === 'visibilitychange') listeners.add(callback); },
    removeEventListener(type, callback) { if (type === 'visibilitychange') listeners.delete(callback); },
  };
  globalThis.AudioContext = supported ? AudioContextDouble : undefined;
  globalThis.webkitAudioContext = undefined;
  globalThis.document = fakeDocument;
  globalThis.setInterval = callback => { const id = ++timerId; timers.set(id, callback); return id; };
  globalThis.clearInterval = id => timers.delete(id);
  return {
    timers, contexts, listeners,
    finishResume: () => finishResume?.(),
    advance(seconds) { for (const context of contexts) context.advance(seconds); for (const callback of [...timers.values()]) callback(); },
    hide(hidden) { fakeDocument.visibilityState = hidden ? 'hidden' : 'visible'; for (const callback of listeners) callback(); },
    restore() {
      for (const [key, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    },
  };
}

async function withAudio(callback, options) {
  const env = environment(options);
  const audio = new AudioDirector();
  try { await callback(audio, env); }
  finally { audio.dispose(); env.restore(); }
}

test('audio is lazy and cannot sound or schedule music before a gesture unlock', async () => {
  await withAudio(async (audio, env) => {
    audio.setZone('feros');
    assert.equal(env.contexts.length, 0);
    assert.equal(audio.play('shoot'), false);
    assert.equal(env.timers.size, 0);
    assert.equal(await audio.unlock(), true);
    assert.equal(env.contexts.length, 1);
    assert.equal(env.contexts[0].resumeCalls, 1);
    assert.equal(env.timers.size, 1);
    assert.equal(audio.play('shoot'), true);
  });
});

test('saved audio-off setting stays silent after unlock and can be enabled without a second context', async () => {
  await withAudio(async (audio, env) => {
    audio.setEnabled(false);
    await audio.unlock();
    assert.equal(env.timers.size, 0);
    assert.equal(audio._voices.size, 0);
    assert.equal(audio.play('ui'), false);
    audio.setEnabled(true);
    assert.equal(env.contexts.length, 1);
    assert.equal(env.timers.size, 1);
    assert.ok(audio._voices.size > 0);
    audio.setEnabled(false);
    env.advance(0.3);
    assert.equal(env.timers.size, 0);
    assert.equal(audio._voices.size, 0);
  });
});

test('concurrent unlocks share one context/resume and interrupted audio can resume', async () => {
  await withAudio(async (audio, env) => {
    const first = audio.unlock();
    const second = audio.unlock();
    assert.deepEqual(await Promise.all([first, second]), [true, true]);
    assert.equal(env.contexts.length, 1);
    assert.equal(env.contexts[0].resumeCalls, 1);
    env.contexts[0].state = 'interrupted';
    assert.equal(await audio.unlock(), true);
    assert.equal(env.contexts[0].resumeCalls, 2);
    assert.equal(env.timers.size, 1);
  });
});

test('zone changes keep one scheduler and event spam never exceeds the oscillator budget', async () => {
  await withAudio(async (audio, env) => {
    await audio.unlock();
    for (const zone of ['citadel', 'combat:citadel', 'noveria', 'combat:noveria', 'normandy']) {
      env.advance(0.3);
      audio.setZone(zone);
      assert.equal(env.timers.size, 1);
    }
    for (let index = 0; index < 50; index += 1) {
      env.advance(0.05);
      audio.play(index % 2 ? 'burst' : 'singularity');
      assert.ok(audio._voices.size <= 16);
    }
    audio.setZone('combat:feros');
    assert.equal(audio._profile().combat, true);
    env.advance(3);
    assert.ok(audio._voices.size <= 16);
  });
});

test('hidden documents stop ambience and reject new sounds, then resume with one scheduler', async () => {
  await withAudio(async (audio, env) => {
    await audio.unlock();
    env.hide(true);
    env.advance(0.5);
    assert.equal(env.timers.size, 0);
    assert.equal(audio._master.gain.value, 0);
    assert.equal(audio.play('ui'), false);
    env.hide(false);
    assert.equal(env.timers.size, 1);
    assert.equal(audio._master.gain.value, audio.volume);
  });
});

test('volume stays bounded and zero volume suppresses sound effects', async () => {
  await withAudio(async audio => {
    await audio.unlock();
    assert.equal(audio.setVolume(7), 1);
    assert.equal(audio.setVolume(-2), 0);
    assert.equal(audio.play('shoot'), false);
    assert.equal(audio.setVolume(NaN), 0.35);
    assert.equal(audio.play('shoot'), true);
  });
});

test('UI result aliases produce the same cues as canonical event names', async () => {
  await withAudio(async (audio, env) => {
    await audio.unlock();
    let tones = [];
    audio._tone = (...args) => { tones.push([args[0], args[2], args[3]]); return true; };
    for (const [alias, canonical] of [['win', 'victory'], ['lose', 'defeat'], ['dialogue', 'ui']]) {
      env.advance(0.5);
      tones = [];
      assert.equal(audio.play(canonical), true);
      const expected = [...tones];
      env.advance(0.5);
      tones = [];
      assert.equal(audio.play(alias), true);
      assert.deepEqual(tones, expected);
    }
    env.advance(0.5);
    assert.equal(audio.play({ type: 'action', actionId: 'acid' }), true);
  });
});

test('dispose clears timers/listeners/nodes, closes the context, and is idempotent', async () => {
  await withAudio(async (audio, env) => {
    await audio.unlock();
    audio.play('burst');
    audio.dispose();
    audio.dispose();
    assert.equal(env.timers.size, 0);
    assert.equal(env.listeners.size, 0);
    assert.equal(audio._voices.size, 0);
    assert.equal(env.contexts[0].state, 'closed');
    assert.ok(env.contexts[0].nodes.slice(1).every(node => node.disconnected));
    assert.equal(await audio.unlock(), false);
    assert.equal(audio.play('ui'), false);
  });
});

test('disposing during asynchronous unlock cannot restart music afterward', async () => {
  await withAudio(async (audio, env) => {
    const unlocking = audio.unlock();
    audio.dispose();
    env.finishResume();
    assert.equal(await unlocking, false);
    assert.equal(env.timers.size, 0);
    assert.equal(env.listeners.size, 0);
    assert.equal(audio._voices.size, 0);
  }, { deferredResume: true });
});

test('unsupported Web Audio degrades to silence without throwing', async () => {
  await withAudio(async (audio, env) => {
    assert.equal(await audio.unlock(), false);
    assert.equal(audio.play('ui'), false);
    assert.equal(env.timers.size, 0);
  }, { supported: false });
});
