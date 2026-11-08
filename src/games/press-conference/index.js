// THE PRESS CONFERENCE · GDR wing, game 3.
// You are the spokesman, holding a note you have not read. Reporters ask about travel.
// You answer by combining phrases. Sound too sure of yourself and the border opens,
// which is the good ending, which your superiors hate.
import * as THREE from 'three';
import './press.css';
import { fontsReady } from '../../shared/fonts.js';
import { el, button, memo } from '../../shared/ui.js';
import { showNewspaper } from '../../shared/newspaper.js';
import { RULES, BEGIN, WHEN, WHEN_READ, QUESTIONS, NOTE, TEXT } from './script.js';
import { makeMaterials, buildWorld, drawTV, drawClock, DOOR } from './world.js';

const GAME_ID = 'press-conference';
const EYE = new THREE.Vector3(0, 1.42, 0.78);
const pickOf = (a) => a[Math.floor(Math.random() * a.length)];

export default function createPressConference() {
  const s = {
    ctx: null,
    m: null,
    refs: null,
    phase: 'idle',
    qIndex: 0,
    border: 0,
    calm: RULES.calmStart,
    readNote: false,
    readSmall: false,
    choice: { begin: null, say: null, when: null },
    speaker: null,
    look: new THREE.Vector3(0, 1.1, -5),
    lookTarget: new THREE.Vector3(0, 1.1, -5),
    tvMode: 'test',
    tvT: 0,
    clock: [18, 0],
    flashT: 0,
    said: [],
    ending: null,
    ui: {},
  };

  const self = {
    scene: null,
    camera: null,

    async init(ctx) {
      s.ctx = ctx;
      const { scope, layer } = ctx;
      await fontsReady();
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x2a241e);
      const camera = new THREE.PerspectiveCamera(56, 1, 0.05, 100);
      camera.position.copy(EYE);
      camera.lookAt(s.look);
      self.scene = scene;
      self.camera = camera;
      s.m = makeMaterials();
      s.refs = buildWorld(scene, s.m);
      setClock(18, 0);
      setTV('test');
      buildHud(layer);
      scope.on(window, 'keydown', (e) => {
        if (e.key === 'Escape' && !document.querySelector('.memo-wrap')) {
          if (s.ui.note.classList.contains('open')) return toggleNote(false);
          ctx.goTo('hub');
        }
      });
    },

    async start() {
      const { layer, scope, audio } = s.ctx;
      audio.loop('room', 'room', 0.03);
      const m = memo(layer, { no: TEXT.intro.no, to: 'Comrade Spokesman', from: TEXT.intro.from, subject: TEXT.intro.subject, body: TEXT.intro.body, buttons: [{ label: TEXT.intro.button, value: true, variant: 'red' }] });
      await m.done;
      if (scope.disposed) return;
      audio.unlock();
      setTV('live');
      s.ui.noteBtn.classList.add('show');
      flash(3);
      await wait(800);
      ask(0);
    },

    update(dt, time) {
      if (!s.refs) return;
      updateCamera(dt, time);
      updateReporters(dt, time);
      updateFlashes(dt);
      if (s.tvMode === 'crossing') {
        s.tvT += dt;
        s.tvRedraw = (s.tvRedraw || 0) - dt;
        if (s.tvRedraw <= 0) {
          drawTV(s.refs.tvCanvas, 'crossing', s.tvT);
          s.refs.tvTex.needsUpdate = true;
          s.tvRedraw = 0.25;
        }
      }
      s.refs.tvLight.intensity = 0.9 + Math.sin(time * 23) * 0.15 + Math.sin(time * 7) * 0.1;
    },

    dispose() {
      s.ctx?.audio.stopLoop('room');
      s.refs = null;
      s.ctx = null;
      s.ui = {};
    },
  };

  const wait = (ms) => new Promise((r) => s.ctx.scope.timeout(r, ms));

  // ------------------------------------------------------------------ questions
  async function ask(i) {
    const { audio } = s.ctx;
    s.qIndex = i;
    const q = QUESTIONS[i];
    s.phase = 'asking';
    const [hh, mm] = q.clock.split(':').map(Number);
    setClock(hh, mm);
    // hands go up all over the room; one is chosen
    s.refs.reporters.forEach((r) => (r.userData.handTarget = Math.random() < 0.45 ? 1 : 0));
    await wait(700);
    if (!s.refs) return;
    s.refs.reporters.forEach((r) => (r.userData.handTarget = 0));
    const rep = s.refs.reporters[q.seat % s.refs.reporters.length];
    s.speaker = rep;
    rep.userData.target = 1;
    rep.userData.handTarget = 1;
    const head = new THREE.Vector3();
    rep.getWorldPosition(head);
    s.lookTarget.set(head.x * 0.6, 1.25, head.z * 0.7);
    audio.step();
    await wait(500);
    if (!s.refs) return;
    showQuestion(q);
    audio.clack();
    openBuilder(q);
    s.phase = 'answering';
  }

  async function speak() {
    if (s.phase !== 'answering') return;
    const { begin, say, when } = s.choice;
    if (!begin || !say || !when) return;
    const { audio, scope } = s.ctx;
    s.phase = 'speaking';
    closeBuilder();
    const q = QUESTIONS[s.qIndex];
    const sentence = `${begin.text} ${say.text} ${when.text}`;
    s.said.push({ q, sentence, when });
    const gain = say.border * begin.conf * when.mult;
    s.border += gain;
    s.calm = THREE.MathUtils.clamp(s.calm + begin.calm + say.calm + when.calm, 0, 100);
    // you lean into the microphones
    s.lookTarget.set(0, 1.0, -5);
    await typeSubtitle(sentence);
    if (scope.disposed) return;
    // the room reacts
    const k = gain >= 18 || when.loud ? 'loud' : gain >= 5 ? 'murmur' : 'quiet';
    s.ui.reaction.textContent = pickOf(TEXT.reactions[k]);
    s.ui.reaction.classList.add('show');
    if (k === 'loud') {
      audio.shutter();
      flash(8);
      s.refs.reporters.forEach((r) => Math.random() < 0.5 && (r.userData.target = 0.6));
    } else if (k === 'murmur') {
      flash(3);
      audio.pot?.();
    }
    renderHud();
    await wait(1800);
    if (scope.disposed) return;
    s.ui.reaction.classList.remove('show');
    s.refs.reporters.forEach((r) => {
      r.userData.target = 0;
      r.userData.handTarget = 0;
    });
    hideQuestion();
    s.ui.subtitle.classList.remove('show');
    await wait(500);
    if (scope.disposed) return;
    if (s.qIndex < QUESTIONS.length - 1) return ask(s.qIndex + 1);
    end(when);
  }

  async function end(lastWhen) {
    const { audio, scope, layer } = s.ctx;
    s.phase = 'ending';
    s.ui.noteBtn.classList.remove('show');
    toggleNote(false);
    s.ending = lastWhen.read ? 'read' : s.border >= RULES.openAt ? 'open' : 'closed';
    setClock(19, 1);
    if (s.ending === 'open') {
      // a silence, and then everyone leaves at once
      await wait(1200);
      if (scope.disposed) return;
      flash(12);
      audio.shutter();
      s.refs.reporters.forEach((r, i) => {
        r.userData.target = 1;
        scope.timeout(() => (r.userData.run = { t: 0, from: r.position.clone() }), 300 + i * 140 + Math.random() * 300);
      });
      setTV('crossing');
      s.lookTarget.set(DOOR.x * 0.5, 1.3, DOOR.z * 0.6);
      ringPhone();
      await wait(4800);
    } else {
      s.refs.reporters.forEach((r) => (r.userData.target = Math.random() < 0.3 ? 1 : 0));
      await wait(1400);
    }
    if (scope.disposed) return;
    const E = TEXT[s.ending];
    const mm = memo(layer, { no: E.memo.no, to: 'Comrade Spokesman', from: E.memo.from, subject: E.memo.subject, body: E.memo.body, stamp: E.memo.stamp, buttons: [{ label: E.memo.button, value: true, variant: 'red' }] });
    await mm.done;
    if (!scope.disposed) finish();
  }

  async function finish() {
    const { layer, save, audio, scope, manager } = s.ctx;
    const E = TEXT[s.ending];
    const n = s.said.length;
    if (s.ending === 'open') {
      save.awardMedal(GAME_ID, { border: Math.round(s.border), calm: Math.round(s.calm) });
      save.recordSuccess(GAME_ID, `Opened the border: "${s.said[n - 1].when.text.replace(/\.$/, '')}"`);
    } else if (s.ending === 'read') save.recordFailure(GAME_ID, 'Read the note, all of it');
    else save.recordFailure(GAME_ID, 'Said nothing, at length');
    audio.fanfare();
    s.phase = 'paper';
    self.camera.position.set(-1.8, 2.4, 1.6);
    self.camera.lookAt(-2.6, 1.0, -5);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const photo = manager.snapshot();
    const np = showNewspaper(layer, {
      headline: E.headline,
      deck: E.deck,
      date: '10 NOVEMBER 1989',
      photo,
      caption: E.caption,
      columns: E.columns,
      sidebar: E.sidebar(n),
      closeLabel: 'RETURN TO THE MINISTRY',
    });
    np.node.classList.add('pc-paper');
    await np.done;
    if (!scope.disposed) s.ctx.goTo('hub');
  }

  // ------------------------------------------------------------------ the room
  function setClock(hh, mm) {
    s.clock = [hh, mm];
    drawClock(s.refs.clockCanvas, hh, mm);
    s.refs.clockTex.needsUpdate = true;
    if (s.ui.time) s.ui.time.textContent = `${hh}:${String(mm).padStart(2, '0')}`;
  }

  function setTV(mode) {
    s.tvMode = mode;
    s.tvT = 0;
    drawTV(s.refs.tvCanvas, mode, 0);
    s.refs.tvTex.needsUpdate = true;
  }

  function updateCamera(dt, time) {
    if (s.phase === 'paper') return;
    s.look.lerp(s.lookTarget, Math.min(1, dt * 2.5));
    const cam = self.camera;
    cam.position.copy(EYE);
    cam.position.y += Math.sin(time * 1.3) * 0.01; // breathing, carefully
    cam.lookAt(s.look);
  }

  function updateReporters(dt, time) {
    s.refs.reporters.forEach((r, i) => {
      const u = r.userData;
      u.stand += (u.target - u.stand) * Math.min(1, dt * 6);
      u.hand += (u.handTarget - u.hand) * Math.min(1, dt * 8);
      u.body.position.y = 0.45 + u.stand * 0.45;
      u.body.position.z = u.stand * 0.12;
      u.arm.rotation.x = -u.hand * 2.8;
      u.arm.rotation.z = u.hand * 0.2;
      u.head.rotation.y = Math.sin(time * 0.7 + i) * 0.2;
      if (u.run) {
        u.run.t += dt;
        const k = Math.min(1, u.run.t / 2.2);
        const target = new THREE.Vector3(DOOR.x, 0, DOOR.z + 0.4);
        // into the aisle first, then out of the door
        const mid = new THREE.Vector3(u.run.from.x, 0, u.run.from.z).lerp(target, 0.5);
        mid.x = DOOR.x;
        const p = k < 0.5 ? u.run.from.clone().lerp(mid, k * 2) : mid.clone().lerp(target, (k - 0.5) * 2);
        r.position.set(p.x, Math.abs(Math.sin(u.run.t * 14)) * 0.08, p.z);
        r.rotation.y = Math.atan2(target.x - r.position.x, target.z - r.position.z) || Math.PI;
        if (k >= 1) r.visible = false;
      }
    });
  }

  function flash(n) {
    for (let k = 0; k < n; k++) {
      const L = pickOf(s.refs.flashes);
      s.ctx.scope.timeout(() => {
        if (!s.refs) return;
        L.intensity = 60;
        L.userData.t = 0.09;
        s.ctx.audio.click();
      }, k * (90 + Math.random() * 160));
    }
  }

  function updateFlashes(dt) {
    for (const L of s.refs.flashes) {
      if (L.userData.t > 0) {
        L.userData.t -= dt;
        if (L.userData.t <= 0) L.intensity = 0;
      }
    }
  }

  function ringPhone() {
    const { audio, scope } = s.ctx;
    for (let i = 0; i < 4; i++) scope.timeout(() => audio.ding(), 600 + i * 900);
  }

  // ------------------------------------------------------------------ the answer builder
  function chip(opt, slot) {
    const b = el('button.pc-chip', { type: 'button' }, opt.text);
    if (opt.read) b.classList.add('read');
    b.addEventListener('click', () => {
      s.ctx.audio.click();
      s.choice[slot] = opt;
      [...b.parentElement.children].forEach((c) => c.classList.toggle('on', c === b));
      renderPreview();
    });
    return b;
  }

  function openBuilder(q) {
    s.choice = { begin: null, say: null, when: null };
    const whens = q.final && s.readSmall ? [...WHEN, WHEN_READ] : WHEN;
    s.ui.rows.begin.replaceChildren(...BEGIN.map((o) => chip(o, 'begin')));
    s.ui.rows.say.replaceChildren(...q.say.map((o) => chip(o, 'say')));
    s.ui.rows.when.replaceChildren(...whens.map((o) => chip(o, 'when')));
    renderPreview();
    s.ui.builder.classList.add('open');
  }

  function closeBuilder() {
    s.ui.builder.classList.remove('open');
  }

  function renderPreview() {
    const { begin, say, when } = s.choice;
    const part = (o, label) => el(`span.pc-part${o ? '' : '.empty'}`, {}, o ? o.text : `[${label}]`);
    s.ui.preview.replaceChildren(part(begin, TEXT.slots.begin), ' ', part(say, TEXT.slots.say), ' ', part(when, TEXT.slots.when));
    s.ui.speak.disabled = !(begin && say && when);
  }

  async function typeSubtitle(text) {
    const sub = s.ui.subtitle;
    sub.textContent = '';
    sub.classList.add('show');
    const { audio, scope } = s.ctx;
    for (let i = 0; i < text.length; i++) {
      if (scope.disposed) return;
      sub.textContent = text.slice(0, i + 1);
      if (i % 3 === 0 && text[i] !== ' ') audio.clack();
      await wait(text[i] === ',' ? 200 : 28);
    }
    await wait(400);
  }

  // ------------------------------------------------------------------ the note
  function toggleNote(open = !s.ui.note.classList.contains('open')) {
    s.ui.note.classList.toggle('open', open);
    s.ui.noteBtn.textContent = open ? TEXT.closeNote : TEXT.readNote;
    if (open && !s.readNote) {
      s.readNote = true;
      s.calm = Math.max(0, s.calm - 5); // reading in public is noticed
      renderHud();
    }
    s.ctx.audio.click();
  }

  // ------------------------------------------------------------------ HUD
  function buildHud(layer) {
    s.ui.time = el('span', {}, '18:00');
    s.ui.question = el('div.pc-question');
    s.ui.subtitle = el('div.pc-subtitle', { role: 'status' });
    s.ui.reaction = el('div.pc-reaction');
    s.ui.rows = { begin: el('div.pc-chips'), say: el('div.pc-chips'), when: el('div.pc-chips') };
    s.ui.preview = el('div.pc-preview');
    s.ui.speak = button(TEXT.speak, () => speak(), { variant: 'red' });
    s.ui.builder = el('div.pc-builder', {}, [
      s.ui.preview,
      el('div.pc-row', {}, [el('div.pc-lab', {}, TEXT.slots.begin), s.ui.rows.begin]),
      el('div.pc-row', {}, [el('div.pc-lab', {}, TEXT.slots.say), s.ui.rows.say]),
      el('div.pc-row', {}, [el('div.pc-lab', {}, TEXT.slots.when), s.ui.rows.when]),
      el('div.pc-actions', {}, [s.ui.speak]),
    ]);
    s.ui.borderFill = el('div.pc-fill');
    s.ui.borderState = el('span', {}, TEXT.borderStates[0]);
    s.ui.calmFill = el('div.pc-fill.calm');
    s.ui.calmState = el('span', {}, TEXT.calmStates[3]);
    s.ui.meters = el('div.pc-meters', {}, [
      el('div.pc-lab', {}, [TEXT.border, ' · ', s.ui.borderState]),
      el('div.pc-bar', {}, s.ui.borderFill),
      el('div.pc-lab', {}, [TEXT.calm, ' · ', s.ui.calmState]),
      el('div.pc-bar', {}, s.ui.calmFill),
    ]);
    // the note: a sheet you can pick up and read, though you were not supposed to
    const small = el('button.pc-small', { type: 'button' }, NOTE.smallPrint);
    small.addEventListener('click', () => {
      s.readSmall = true;
      small.classList.add('read');
      s.ctx.audio.stamp();
      s.ui.noteMsg.textContent = TEXT.readNote2;
      if (s.phase === 'answering' && QUESTIONS[s.qIndex].final) openBuilder(QUESTIONS[s.qIndex]);
    });
    s.ui.noteMsg = el('div.pc-note-msg', {}, NOTE.unread);
    s.ui.note = el('div.pc-note', {}, [
      el('div.pc-note-head', {}, NOTE.heading),
      ...NOTE.lines.map((l) => el('p', {}, l)),
      small,
      s.ui.noteMsg,
    ]);
    s.ui.noteBtn = button(TEXT.readNote, () => toggleNote(), { variant: 'dark' });
    s.ui.noteBtn.classList.add('pc-note-btn');
    layer.append(
      el('div.dept-banner', {}, [el('div.dept-kicker', {}, TEXT.dept), el('div.dept-title', {}, [TEXT.title, ' · ', s.ui.time])]),
      el('div.corner-actions', {}, [button('← RETURN TO MINISTRY', () => s.ctx.goTo('hub'), { variant: 'dark' })]),
      s.ui.question,
      s.ui.meters,
      s.ui.subtitle,
      s.ui.reaction,
      s.ui.builder,
      s.ui.note,
      s.ui.noteBtn,
    );
    renderHud();
  }

  function renderHud() {
    const p = s.border / RULES.openAt;
    const bi = p >= 1 ? 4 : p >= 0.7 ? 3 : p >= 0.35 ? 2 : p >= 0.1 ? 1 : 0;
    s.ui.borderFill.style.width = `${Math.min(1, p) * 100}%`;
    s.ui.borderState.textContent = TEXT.borderStates[bi];
    s.ui.meters.classList.toggle('open', bi === 4);
    const ci = s.calm > 70 ? 3 : s.calm > 40 ? 2 : s.calm > 15 ? 1 : 0;
    s.ui.calmFill.style.width = `${s.calm}%`;
    s.ui.calmState.textContent = TEXT.calmStates[ci];
  }

  function showQuestion(q) {
    s.ui.question.replaceChildren(el('div.pc-who', {}, q.who), el('div.pc-q', {}, `“${q.text}”`));
    s.ui.question.classList.add('show');
  }

  function hideQuestion() {
    s.ui.question.classList.remove('show');
  }

  if (import.meta.env.DEV) {
    self.__dev = {
      state: () => ({ phase: s.phase, q: s.qIndex, border: s.border, calm: s.calm, ending: s.ending }),
      answer: (b, sy, w) => {
        const q = QUESTIONS[s.qIndex];
        const whens = q.final && s.readSmall ? [...WHEN, WHEN_READ] : WHEN;
        s.choice = { begin: BEGIN[b], say: q.say[sy], when: whens[w] };
        speak();
      },
    };
  }

  return self;
}
