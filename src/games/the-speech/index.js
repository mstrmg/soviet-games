// THE SPEECH · Cuba wing, game 3. You are the official stenographer for a seven-hour address.
// Type the key phrases as they are spoken, press ENTER when a line calls for applause, and press
// ↑ on the beat to stay awake. A gentleman in a grey suit keeps his own record of the applause.
import * as THREE from 'three';
import './speech.css';
import { fontsReady } from '../../shared/fonts.js';
import { el, button, memo, toast } from '../../shared/ui.js';
import { showNewspaper } from '../../shared/newspaper.js';
import { HOURS, parseLine, TEXT, NEWSPAPER } from './speech.js';
import { buildPlaza } from './plaza.js';

const GAME_ID = 'the-speech';
const HOLD = 1.0; // seconds a finished line stays up
const APPLAUSE_WINDOW = 2.4;
const HOUR_CARD = 2.2;
const BEAT = 1.7; // seconds for the stay-awake dot to cross and come back
const ZONE = 0.16; // half-width of the beat zone, of a track of -1..1
const PHRASE_PASS = 0.6;

const phraseTime = (h) => 10.5 - h * 0.55;
const wordsPerSecond = (h) => 2.6 + h * 0.22;
const drowseRate = (h) => 0.02 + h * 0.0095;

export default function createTheSpeech() {
  const s = {
    ctx: null,
    plaza: null,
    phase: 'idle', // talk | hold | applause | card | end
    hour: 0,
    lineIdx: 0,
    line: null,
    shown: 0,
    t: 0, // phase timer
    clock: 0,
    pending: [], // { text, typed, deadline, done, missed, ref }
    status: {}, // phrase key -> 'got' | 'miss'
    drowsy: 0,
    asleep: 0,
    beat: 0,
    cueHit: false,
    noticed: 0,
    hits: 0,
    cues: 0,
    total: 0,
    got: 0,
    naps: 0,
    earlyAt: -9,
    tAbs: 0,
    transcript: [],
    dev: { speed: 1, auto: false, autoT: 0 },
    ui: {},
  };
  for (const H of HOURS) for (const l of H.lines) s.total += parseLine(l).phrases.length;

  const self = {
    scene: null,
    camera: null,

    async init(ctx) {
      s.ctx = ctx;
      const { scope, layer } = ctx;
      await fontsReady();
      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x0b1428, 30, 60);
      const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 120);
      camera.position.set(0, 4.3, 13.6);
      camera.lookAt(0, 2.4, -8);
      self.scene = scene;
      self.camera = camera;
      scene.add(new THREE.HemisphereLight(0x9ab0ff, 0x2a2420, 0.7));
      const flood = new THREE.DirectionalLight(0xfff0d0, 2.2);
      flood.position.set(-8, 14, 8);
      flood.castShadow = true;
      flood.shadow.mapSize.set(1024, 1024);
      Object.assign(flood.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16 });
      scene.add(flood);
      const stage = new THREE.SpotLight(0xfff4d0, 120, 40, 0.35, 0.5, 1.2);
      stage.position.set(0, 12, -2);
      stage.target.position.set(0, 2, -11.5);
      scene.add(stage, stage.target);

      s.plaza = buildPlaza(scene);
      s.plaza.setTime(0, scene);
      buildHud(layer);

      scope.on(window, 'keydown', onKey);
    },

    async start() {
      const { layer, scope, audio } = s.ctx;
      const m = memo(layer, { no: TEXT.memo.no, to: 'Comrade Stenographer', from: TEXT.dept, subject: TEXT.memo.subject, body: TEXT.memo.body, stamp: 'BRIEF', buttons: [{ label: TEXT.memo.button, value: true, variant: 'red' }] });
      await m.done;
      if (scope.disposed) return;
      audio.unlock();
      audio.applause(2.5, 90);
      s.plaza.clap(2.5);
      beginHour(0);
    },

    update(rawDt, time) {
      if (!s.plaza) return;
      const dt = Math.min(rawDt, 0.1) * s.dev.speed;
      s.plaza.tick(dt, time, s.phase === 'talk');
      if (s.phase === 'idle' || s.phase === 'end') return;
      step(dt);
      if (s.dev.auto) autoPilot(dt);
      renderLive();
    },

    dispose() {
      s.plaza = null;
      s.ctx = null;
      s.ui = {};
    },
  };

  // ------------------------------------------------------------------ the speech
  function beginHour(h) {
    s.hour = h;
    s.lineIdx = 0;
    s.phase = 'card';
    s.t = 0;
    s.ui.card.textContent = TEXT.hour(h + 1, HOURS[h].topic);
    s.ui.card.classList.add('on');
    s.ctx.audio.ding();
    renderHud();
  }

  function beginLine() {
    s.line = parseLine(HOURS[s.hour].lines[s.lineIdx]);
    s.shown = 0;
    s.phase = 'talk';
    s.t = 0;
    s.cueHit = false;
    renderLine();
  }

  function step(dt) {
    s.t += dt;
    s.tAbs += dt;
    // the clock on the tower
    const lines = HOURS[s.hour].lines.length;
    const target = (s.hour + Math.min(1, (s.lineIdx + (s.phase === 'card' ? 0 : 0.5)) / lines)) / HOURS.length;
    s.clock += (target - s.clock) * Math.min(1, dt * 0.8);
    s.plaza.setTime(s.clock, self.scene);

    // staying awake
    s.beat += dt;
    if (s.asleep > 0) {
      s.asleep -= dt;
      if (s.asleep <= 0) {
        s.drowsy = 0.5;
        say(TEXT.awake, 2200);
      }
    } else {
      s.drowsy = Math.min(1, s.drowsy + dt * drowseRate(s.hour));
      if (s.drowsy >= 1) {
        s.asleep = 3.5;
        s.naps++;
        s.ctx.audio.snore();
        say(TEXT.asleep, 2600);
      }
    }

    // phrases that were not typed in time
    for (const p of s.pending) {
      if (!p.done && !p.missed && s.clockT() > p.deadline) {
        p.missed = true;
        s.status[p.key] = 'miss';
        s.ctx.audio.clack();
        renderLine();
        renderHud();
      }
    }
    s.pending = s.pending.filter((p) => !p.done && !p.missed);

    if (s.phase === 'card') {
      if (s.t > HOUR_CARD) {
        s.ui.card.classList.remove('on');
        beginLine();
      }
      return;
    }
    if (s.phase === 'talk') {
      const n = Math.min(s.line.words.length, Math.floor(s.t * wordsPerSecond(s.hour)) + 1);
      if (n !== s.shown) {
        for (let k = s.shown; k < n; k++) {
          // a key phrase is complete when its last word is spoken
          s.line.phrases.forEach((ph, i) => {
            if (ph.end === k) {
              const key = `${s.hour}.${s.lineIdx}.${i}`;
              s.pending.push({ key, text: ph.text, typed: 0, deadline: s.clockT() + phraseTime(s.hour), born: s.clockT(), done: false, missed: false });
            }
          });
        }
        s.shown = n;
        renderLine();
      }
      if (s.shown >= s.line.words.length) {
        s.phase = 'hold';
        s.t = 0;
      }
      return;
    }
    if (s.phase === 'hold') {
      if (s.t > HOLD) {
        if (s.line.applause) {
          s.phase = 'applause';
          s.t = 0;
          s.cues++;
          s.ui.cue.classList.add('on');
        } else nextLine();
      }
      return;
    }
    if (s.phase === 'applause') {
      if (s.t > (s.cueHit ? 1.4 : APPLAUSE_WINDOW)) {
        s.ui.cue.classList.remove('on');
        if (!s.cueHit) {
          s.noticed++;
          s.ctx.audio.stamp();
          say(TEXT.noticed[Math.min(TEXT.noticed.length - 1, s.noticed - 1)], 2600);
          s.ui.grey.classList.add('writing');
          setTimeout(() => s.ui.grey?.classList.remove('writing'), 1800);
        }
        renderHud();
        nextLine();
      }
    }
  }
  s.clockT = () => s.tAbs;

  function nextLine() {
    recordLine();
    s.lineIdx++;
    if (s.lineIdx < HOURS[s.hour].lines.length) beginLine();
    else if (s.hour + 1 < HOURS.length) beginHour(s.hour + 1);
    else finish();
  }

  function recordLine() {
    // the transcript as it will be printed: missed phrases are a dash; applause is always printed
    const L = s.line;
    const words = L.words.map((w, k) => {
      if (w.phrase < 0) return w.text;
      const st = s.status[`${s.hour}.${s.lineIdx}.${w.phrase}`];
      const ph = L.phrases[w.phrase];
      if (st === 'got') return w.text;
      return k === ph.start ? '— — —' + (w.text.match(/[.,;:!?]+$/)?.[0] || '') : '';
    });
    let txt = words.filter(Boolean).join(' ');
    if (L.applause) txt += ' (Prolonged applause.)';
    s.transcript.push(txt);
  }

  // ------------------------------------------------------------------ input
  function onKey(e) {
    if (e.key === 'Escape') {
      if (!document.querySelector('.memo-wrap') && !document.querySelector('.np-wrap')) s.ctx.goTo('hub');
      return;
    }
    if (s.phase === 'idle' || s.phase === 'end' || document.querySelector('.memo-wrap')) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      applaud();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      pinch();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      typeChar(e.key);
    }
  }

  function typeChar(c) {
    if (s.asleep > 0) return;
    const head = s.pending.find((p) => !p.done && !p.missed);
    if (!head) return;
    const want = head.text[head.typed];
    if (c.toUpperCase() === want.toUpperCase()) {
      head.typed++;
      s.drowsy = Math.max(0, s.drowsy - 0.006);
      s.ctx.audio.clack();
      if (head.typed >= head.text.length) {
        head.done = true;
        s.got++;
        s.status[head.key] = 'got';
        s.ctx.audio.ding();
        renderLine();
        renderHud();
      }
      renderPad();
    } else {
      s.ui.pad.classList.remove('err');
      void s.ui.pad.offsetWidth;
      s.ui.pad.classList.add('err');
    }
  }

  function applaud() {
    if (s.asleep > 0) return;
    if (s.phase === 'applause' && !s.cueHit) {
      s.cueHit = true;
      s.hits++;
      s.t = 0;
      s.drowsy = Math.max(0, s.drowsy - 0.1);
      s.ctx.audio.applause(1.8, 70);
      s.plaza.clap(1.8);
      s.ui.cue.classList.add('hit');
      setTimeout(() => s.ui.cue?.classList.remove('hit'), 900);
      renderHud();
    } else if (s.phase === 'talk' || s.phase === 'hold') {
      if (s.tAbs - s.earlyAt > 4) {
        s.earlyAt = s.tAbs;
        s.ctx.audio.applause(0.6, 12);
        say(TEXT.early, 2200);
      }
    }
  }

  function beatPos() {
    return Math.sin((s.beat / BEAT) * Math.PI * 2);
  }

  function pinch() {
    if (s.asleep > 0) return;
    if (Math.abs(beatPos()) < ZONE) {
      s.drowsy = Math.max(0, s.drowsy - 0.3);
      s.ctx.audio.tick();
      s.ui.awake.classList.remove('miss');
      s.ui.awake.classList.add('ok');
      setTimeout(() => s.ui.awake?.classList.remove('ok'), 250);
    } else {
      s.drowsy = Math.min(0.98, s.drowsy + 0.03);
      s.ui.awake.classList.remove('ok');
      s.ui.awake.classList.add('miss');
      setTimeout(() => s.ui.awake?.classList.remove('miss'), 250);
    }
  }

  // ------------------------------------------------------------------ the end
  async function finish() {
    const { layer, save, audio, scope, manager } = s.ctx;
    s.phase = 'end';
    s.ui.cue.classList.remove('on');
    s.ui.root.style.display = 'none';
    s.plaza.setTime(1, self.scene);
    s.drowsy = 0;
    renderLive();
    const good = s.noticed <= 1 && s.got / s.total >= PHRASE_PASS;
    const label = `${s.got} of ${s.total} phrases, ${s.noticed} noted`;
    if (good) {
      save.awardMedal(GAME_ID, { phrases: s.got, noticed: s.noticed, naps: s.naps });
      save.recordSuccess(GAME_ID, label);
    } else save.recordFailure(GAME_ID, label);
    audio.applause(3, 120);
    s.plaza.clap(3);
    await new Promise((r) => setTimeout(r, 1200));
    if (scope.disposed) return;
    audio.fanfare();
    const photo = manager.snapshot();
    const r = {
      transcript: s.transcript.slice(0, 5).join(' ') + ' …',
      phrases: s.got,
      total: s.total,
      hits: s.hits,
      cues: s.cues,
      noticed: s.noticed,
      naps: s.naps,
      good,
      applauseMinutes: 40 + s.cues * 3,
    };
    const np = showNewspaper(layer, {
      masthead: NEWSPAPER.masthead,
      motto: NEWSPAPER.motto,
      date: NEWSPAPER.date,
      price: NEWSPAPER.price,
      headline: NEWSPAPER.headline,
      deck: NEWSPAPER.deck,
      photo,
      caption: NEWSPAPER.caption,
      columns: NEWSPAPER.columns(r),
      sidebar: NEWSPAPER.sidebar(r),
      closeLabel: 'RETURN TO THE MINISTRY',
    });
    await np.done;
    if (!scope.disposed) s.ctx.goTo('hub');
  }

  // ------------------------------------------------------------------ HUD
  function buildHud(layer) {
    const hour = el('div.ts-num', {}, '1');
    const topic = el('div.ts-info', {}, HOURS[0].topic);
    const phrases = el('div.ts-num', {}, `0`);
    const noticed = el('div.ts-num', {}, '0');
    const board = el('div.ts-top', {}, [
      el('div.ts-cell', {}, [el('div.ts-lab', {}, 'Hour'), hour, topic]),
      el('div.ts-cell', {}, [el('div.ts-lab', {}, 'Key phrases'), phrases, el('div.ts-info', {}, `of ${s.total} · need ${Math.ceil(s.total * PHRASE_PASS)}`)]),
      el('div.ts-cell', {}, [el('div.ts-lab', {}, 'Noted by the grey suit'), noticed, el('div.ts-info', {}, 'allowed: 1')]),
    ]);
    const sub = el('div.ts-sub', {}, []);
    const cue = el('div.ts-cue', {}, [el('b', {}, '(APPLAUSE)'), el('span', {}, 'press ENTER')]);
    const applaudBtn = button('APPLAUD', () => applaud(), { variant: 'red' });
    const subwrap = el('div.ts-subwrap', {}, [cue, sub, el('div.ts-appl', {}, [applaudBtn])]);
    const padText = el('div.ts-padtext', {}, []);
    const padBar = el('i', {}, []);
    const padMore = el('div.ts-more', {}, '');
    const pad = el('div.ts-pad', {}, [el('div.ts-lab', {}, 'Stenographer\'s pad · type'), padText, el('div.ts-bar', {}, [padBar]), padMore]);
    const dot = el('i.ts-dot', {}, []);
    const lidFill = el('i', {}, []);
    const awake = el('div.ts-awake', {}, [
      el('div.ts-lab', {}, 'Stay awake · up arrow on the beat'),
      el('div.ts-track', {}, [el('span.ts-zone', {}, []), dot]),
      el('div.ts-lidmeter', {}, [el('span', {}, 'Eyelids'), el('div', {}, [lidFill])]),
      button('PINCH (UP ARROW)', () => pinch(), { variant: 'dark' }),
    ]);
    const grey = el('div.ts-grey', {}, [el('b', {}, 'GREY SUIT'), el('span', {}, 'is listening')]);
    const card = el('div.ts-card', {}, '');
    const lidTop = el('div.ts-lid.top', {}, []);
    const lidBot = el('div.ts-lid.bot', {}, []);
    const dim = el('div.ts-dim', {}, []);
    const zzz = el('div.ts-zzz', {}, 'Z z z');
    const back = el('div.corner-actions', {}, [button('← RETURN TO LOBBY', () => s.ctx.goTo('hub'), { variant: 'dark' })]);
    const root = el('div.ts-hud', {}, [dim, lidTop, lidBot, zzz, board, subwrap, pad, awake, grey, card, back]);
    layer.append(root);
    s.ui = { root, hour, topic, phrases, noticed, sub, cue, pad, padText, padBar, padMore, awake, dot, lidFill, grey, card, lidTop, lidBot, dim, zzz };
  }

  function renderHud() {
    const u = s.ui;
    if (!u.root) return;
    u.hour.textContent = String(s.hour + 1);
    u.topic.textContent = HOURS[s.hour].topic;
    u.phrases.textContent = String(s.got);
    u.noticed.textContent = String(s.noticed);
    u.noticed.classList.toggle('bad', s.noticed > 1);
  }

  function renderLine() {
    const u = s.ui;
    if (!u.root || !s.line) return;
    u.sub.replaceChildren(
      ...s.line.words.map((w, k) => {
        let cls = k < s.shown ? 'on' : 'off';
        if (w.phrase >= 0) {
          const st = s.status[`${s.hour}.${s.lineIdx}.${w.phrase}`];
          cls += st === 'got' ? ' key got' : st === 'miss' ? ' key miss' : ' key';
        }
        return el(`span.${cls.split(' ').join('.')}`, {}, w.text);
      }),
    );
    renderPad();
  }

  function renderPad() {
    const u = s.ui;
    const head = s.pending.find((p) => !p.done && !p.missed);
    if (!head) {
      u.padText.replaceChildren(el('em', {}, s.got ? 'Recorded. Waiting for the next key phrase.' : 'Waiting for a key phrase.'));
      u.padMore.textContent = '';
      u.pad.classList.remove('live');
      return;
    }
    u.pad.classList.add('live');
    u.padText.replaceChildren(el('b', {}, head.text.slice(0, head.typed)), el('span', {}, head.text.slice(head.typed)));
    const more = s.pending.filter((p) => !p.done && !p.missed).length - 1;
    u.padMore.textContent = more > 0 ? `+${more} waiting` : '';
  }

  function renderLive() {
    const u = s.ui;
    if (!u.root) return;
    const head = s.pending.find((p) => !p.done && !p.missed);
    if (head) u.padBar.style.width = `${Math.max(0, (head.deadline - s.clockT()) / (head.deadline - head.born)) * 100}%`;
    else u.padBar.style.width = '0%';
    u.dot.style.left = `${50 + beatPos() * 46}%`;
    const d = s.asleep > 0 ? 1 : s.drowsy;
    const lid = Math.pow(d, 1.7) * 50;
    u.lidTop.style.height = `${lid}%`;
    u.lidBot.style.height = `${lid}%`;
    u.dim.style.opacity = String(d * 0.45);
    u.lidFill.style.width = `${d * 100}%`;
    u.lidFill.classList.toggle('bad', d > 0.7);
    u.zzz.classList.toggle('on', s.asleep > 0);
  }

  function say(text, ms) {
    s.toast?.remove();
    s.toast = toast(s.ctx.layer, text, ms);
  }

  // ------------------------------------------------------------------ dev
  function autoPilot(dt) {
    const a = s.dev;
    a.autoT += dt;
    if (s.phase === 'applause' && !s.cueHit && s.t > 0.4) applaud();
    if (s.drowsy > 0.35 && Math.abs(beatPos()) < ZONE * 0.6) pinch();
    const head = s.pending.find((p) => !p.done && !p.missed);
    while (head && a.autoT > 0.07 && !head.done) {
      a.autoT -= 0.07;
      typeChar(head.text[head.typed]);
    }
    if (!head) a.autoT = 0;
  }

  if (import.meta.env.DEV) {
    self.__dev = {
      s,
      auto(on = true) {
        s.dev.auto = on;
      },
      speed(n = 3) {
        s.dev.speed = n;
      },
    };
  }

  return self;
}
