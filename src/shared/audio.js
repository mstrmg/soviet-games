// Every sound is synthesised with the Web Audio API. No recordings exist.
// The AudioContext is created on the first user gesture (browser policy).
import { save } from './save.js';

let ctx = null;
let unlocked = false; // no AudioContext until a user gesture
let master = null;
let noiseBuffer = null;
const loops = new Map();

function ensure() {
  if (ctx) return ctx;
  if (!unlocked) return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = save.data.settings.muted ? 0 : save.data.settings.volume;
  master.connect(ctx.destination);
  // One second of white noise, reused by every percussive sound.
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return ctx;
}

function noise(duration, { type = 'bandpass', freq = 1000, q = 1, gain = 0.5, attack = 0.001, when = 0 } = {}) {
  const c = ensure();
  if (!c) return;
  const t = c.currentTime + when;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer;
  const filter = c.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(filter).connect(g).connect(master);
  src.start(t, Math.random() * 0.5);
  src.stop(t + duration + 0.05);
}

function tone(freq, duration, { type = 'sine', gain = 0.3, attack = 0.005, when = 0, slideTo } = {}) {
  const c = ensure();
  if (!c) return;
  const t = c.currentTime + when;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

export const audio = {
  /** Call from any user gesture to unlock audio. */
  unlock() {
    unlocked = true;
    const c = ensure();
    if (c && c.state === 'suspended') c.resume();
  },

  get muted() {
    return save.data.settings.muted;
  },

  setMuted(muted) {
    save.update((d) => {
      d.settings.muted = muted;
    });
    if (master) master.gain.setTargetAtTime(muted ? 0 : save.data.settings.volume, ctx.currentTime, 0.05);
  },

  /** Rubber stamp: a dull thump plus a papery slap. */
  stamp() {
    tone(90, 0.18, { type: 'sine', gain: 0.7, slideTo: 45 });
    noise(0.12, { type: 'lowpass', freq: 900, gain: 0.6 });
    noise(0.05, { type: 'highpass', freq: 3000, gain: 0.15, when: 0.01 });
  },

  /** Typewriter key: sharp click with a metallic tail. */
  clack() {
    const pitch = 2200 + Math.random() * 900;
    noise(0.035, { type: 'bandpass', freq: pitch, q: 3, gain: 0.5 });
    tone(140 + Math.random() * 30, 0.05, { type: 'square', gain: 0.06 });
  },

  /** Carriage-return bell. */
  ding() {
    tone(1760, 0.9, { type: 'sine', gain: 0.18 });
    tone(3520, 0.5, { type: 'sine', gain: 0.05 });
  },

  /** Small UI tick. */
  click() {
    noise(0.02, { type: 'bandpass', freq: 1800, q: 4, gain: 0.25 });
  },

  /** Clock tick for the lobby clock. */
  tick() {
    noise(0.015, { type: 'highpass', freq: 4000, gain: 0.06 });
  },

  /** One shuffling footstep on stone. */
  step() {
    noise(0.07, { type: 'lowpass', freq: 500 + Math.random() * 200, gain: 0.12 });
  },

  /** A metal shutter meeting a forehead, or being slammed for lunch. */
  shutter() {
    noise(0.35, { type: 'bandpass', freq: 700, q: 1.5, gain: 0.35 });
    tone(110, 0.3, { type: 'square', gain: 0.05, slideTo: 70 });
  },

  /** Clock hands being wound back: a ratchet click. */
  ratchet() {
    noise(0.02, { type: 'bandpass', freq: 3200, q: 6, gain: 0.22 });
    tone(900, 0.02, { type: 'square', gain: 0.03 });
  },

  /** Water drip into a bucket. */
  drip() {
    tone(1300 + Math.random() * 300, 0.12, { type: 'sine', gain: 0.07, slideTo: 600 });
  },

  /** Heavy door groaning open. */
  creak() {
    const c = ensure();
    if (!c) return;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(70, t);
    osc.frequency.linearRampToValueAtTime(110, t + 0.4);
    osc.frequency.linearRampToValueAtTime(60, t + 0.9);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 600;
    bp.Q.value = 6;
    const lfo = c.createOscillator();
    lfo.frequency.value = 23;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 300;
    lfo.connect(lfoGain).connect(bp.frequency);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.0);
    osc.connect(bp).connect(g).connect(master);
    osc.start(t);
    lfo.start(t);
    osc.stop(t + 1.1);
    lfo.stop(t + 1.1);
  },

  /** Short brass fanfare for medals. Slightly out of tune, as is traditional. */
  fanfare() {
    const notes = [392, 523.25, 659.25, 784, 659.25, 784];
    notes.forEach((f, i) => {
      tone(f * (1 + (Math.random() - 0.5) * 0.008), 0.32, { type: 'sawtooth', gain: 0.07, when: i * 0.14 });
      tone(f / 2, 0.32, { type: 'triangle', gain: 0.08, when: i * 0.14 });
    });
  },

  /**
   * Start a named looping drone (factory hum, room tone). Returns a stop function.
   * Kinds: 'hum' (factory), 'room' (lobby tone).
   */
  loop(name, kind = 'hum', level = 0.06) {
    const c = ensure();
    if (!c || loops.has(name)) return () => this.stopLoop(name);
    const g = c.createGain();
    g.gain.value = 0;
    g.gain.setTargetAtTime(level, c.currentTime, 0.6);
    const nodes = [];
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = kind === 'hum' ? 420 : 260;
    lp.connect(g).connect(master);
    const freqs = kind === 'hum' ? [50, 100, 150.5] : [55, 110.3];
    for (const f of freqs) {
      const o = c.createOscillator();
      o.type = kind === 'hum' ? 'sawtooth' : 'sine';
      o.frequency.value = f;
      const og = c.createGain();
      og.gain.value = 1 / freqs.length;
      o.connect(og).connect(lp);
      o.start();
      nodes.push(o);
    }
    const src = c.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;
    const ng = c.createGain();
    ng.gain.value = kind === 'hum' ? 0.25 : 0.4;
    src.connect(ng).connect(lp);
    src.start();
    nodes.push(src);
    loops.set(name, { g, nodes });
    return () => this.stopLoop(name);
  },

  stopLoop(name) {
    const l = loops.get(name);
    if (!l || !ctx) return;
    loops.delete(name);
    l.g.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
    setTimeout(() => {
      l.nodes.forEach((n) => {
        try {
          n.stop();
        } catch {
          /* already stopped */
        }
        n.disconnect();
      });
      l.g.disconnect();
    }, 1200);
  },

  stopAllLoops() {
    for (const name of [...loops.keys()]) this.stopLoop(name);
  },
};
