// LISTENING POST · GDR wing, game 3.
// Apartment 4B makes soup. You listen, note three things a day, and write them up. Reports
// that say what happened do not justify a budget. Reports that justify a budget buy more
// microphones, and more microphones raise what the department expects to hear.
import * as THREE from 'three';
import './listening.css';
import { fontsReady } from '../../shared/fonts.js';
import { el, button, memo, toast } from '../../shared/ui.js';
import { showNewspaper } from '../../shared/newspaper.js';
import { RULES, MIC_SPOTS, ROUTINE, OBS, TEXT, NEWSPAPER } from './file.js';
import { FLAT, makeMaterials, makeMic, buildWorld } from './world.js';

const GAME_ID = 'listening-post';
const CAM_POS = new THREE.Vector3(-0.9, 5.0, 8.4);
const CAM_LOOK = new THREE.Vector3(-0.9, 1.05, -1.5);
const WALK = 1.5; // units per second
const DOOR_Z = (FLAT.doorZ[0] + FLAT.doorZ[1]) / 2;

export default function createListeningPost() {
  const s = {
    ctx: null,
    m: null,
    refs: null,
    phase: 'idle', // idle | listening | writing | report | review | paper
    day: 1,
    mics: RULES.micsStart,
    micMeshes: [],
    strikes: 0,
    speed: 1,
    step: -1,
    cur: null,
    clock: '07:00',
    lines: [], // { id, clock, noted, node }
    pages: 0,
    alarming: 0,
    pose: { bodyY: 0, headX: 0, headY: 0, aLx: 0, aLz: 0, aRx: 0, aRz: 0 },
    walkT: 0,
    t: 0,
    pops: [],
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
      scene.background = new THREE.Color(0x1e2024);
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.copy(CAM_POS);
      camera.lookAt(CAM_LOOK);
      self.scene = scene;
      self.camera = camera;
      s.m = makeMaterials();
      s.refs = buildWorld(scene, s.m);
      for (let i = 0; i < s.mics; i++) addMic(i, false);
      buildHud(layer);
      renderHud();
      scope.on(window, 'keydown', (e) => {
        if (e.key === 'Escape' && !document.querySelector('.memo-wrap') && !s.ui.report) ctx.goTo('hub');
      });
    },

    async start() {
      const { layer, scope } = s.ctx;
      const m = memo(layer, { no: TEXT.intro.no, to: 'Comrade Listener', from: TEXT.intro.from, subject: TEXT.intro.subject, body: TEXT.intro.body, buttons: [{ label: TEXT.intro.button, value: true, variant: 'red' }] });
      await m.done;
      if (scope.disposed) return;
      s.ctx.audio.unlock();
      s.ctx.audio.loop('room', 'room', 0.03);
      startDay();
    },

    update(dt, t) {
      if (!s.refs) return;
      s.t = t;
      updateTenant(dt);
      // the lights nobody is meant to see
      s.micMeshes.forEach((mic, i) => (mic.userData.led.visible = s.phase === 'paper' || Math.sin(t * 3 + i * 1.7) > -0.2));
      for (let i = s.pops.length - 1; i >= 0; i--) {
        const p = s.pops[i];
        p.t += dt;
        const k = Math.min(1, p.t / 0.35);
        p.mesh.scale.setScalar(1.6 * (p.out ? 1 - k : k * (1 + Math.sin(k * Math.PI) * 0.4)));
        if (k >= 1) {
          if (p.out) self.scene.remove(p.mesh);
          s.pops.splice(i, 1);
        }
      }
      if (s.phase !== 'paper') {
        self.camera.position.copy(CAM_POS);
        self.camera.lookAt(CAM_LOOK);
      }
    },

    dispose() {
      s.ctx?.audio.stopLoop('room');
      s.refs = null;
      s.ctx = null;
      s.ui = {};
    },
  };

  // ------------------------------------------------------------------ microphones
  function addMic(i, pop = true) {
    const spot = MIC_SPOTS[i];
    const mic = makeMic(s.m);
    mic.position.set(...spot.at);
    mic.scale.setScalar(pop ? 0.001 : 1.6);
    self.scene.add(mic);
    s.micMeshes.push(mic);
    if (pop) s.pops.push({ mesh: mic, t: 0 });
  }

  function removeMic() {
    const mic = s.micMeshes.pop();
    if (mic) s.pops.push({ mesh: mic, t: 0, out: true });
  }

  // ------------------------------------------------------------------ the day
  function startDay() {
    s.phase = 'listening';
    s.step = -1;
    s.lines = [];
    s.ui.log.replaceChildren(el('div.lp-empty', {}, TEXT.nothing));
    nextAction();
    renderHud();
  }

  function nextAction() {
    s.step++;
    if (s.step >= ROUTINE.length) {
      s.phase = 'writing';
      s.cur.done = true;
      s.ctx.audio.ding();
      renderHud();
      return;
    }
    const a = ROUTINE[s.step];
    const T = s.refs.tenant.position;
    const [tx, tz] = a.spot;
    const path = [];
    if (Math.sign(T.x || -1) !== Math.sign(tx)) {
      // through the doorway, not the wall
      const side = Math.sign(T.x || -1);
      path.push(new THREE.Vector2(side * 0.55, DOOR_Z), new THREE.Vector2(-side * 0.55, DOOR_Z));
    }
    path.push(new THREE.Vector2(tx, tz));
    const heard = a.obs.filter(([, n]) => n <= s.mics).map(([id], k, all) => ({ id, at: ((k + 0.6) * a.secs) / (all.length + 0.2), done: false }));
    s.cur = { a, path, stage: 'walk', t: 0, heard, done: false };
  }

  function updateTenant(dt) {
    const T = s.refs.tenant;
    const { body, head, arms } = T.userData;
    const cur = s.cur;
    const sp = dt * s.speed;
    const target = { bodyY: 0, headX: 0, headY: 0, aLx: 0, aLz: 0, aRx: 0, aRz: 0 };
    if (cur && s.phase === 'listening' && cur.stage === 'walk') {
      const p = cur.path[0];
      const dx = p.x - T.position.x;
      const dz = p.y - T.position.z;
      const d = Math.hypot(dx, dz);
      const stepLen = WALK * sp;
      if (d <= stepLen) {
        T.position.x = p.x;
        T.position.z = p.y;
        cur.path.shift();
        if (!cur.path.length) {
          cur.stage = 'act';
          s.clock = cur.a.clock;
          renderHud();
        }
      } else {
        T.position.x += (dx / d) * stepLen;
        T.position.z += (dz / d) * stepLen;
        T.rotation.y = lerpAngle(T.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 10));
      }
      s.walkT += sp * 7;
      target.bodyY = Math.abs(Math.sin(s.walkT)) * 0.04;
      target.aLx = Math.sin(s.walkT) * 0.45;
      target.aRx = -Math.sin(s.walkT) * 0.45;
      if (Math.sin(s.walkT) * Math.sin(s.walkT - sp * 7) < 0) s.ctx.audio.step?.();
    } else if (cur) {
      if (s.phase === 'listening') {
        cur.t += sp;
        for (const h of cur.heard) {
          if (!h.done && cur.t >= h.at) {
            h.done = true;
            hear(h.id, cur.a.clock, cur.heard.indexOf(h));
          }
        }
        if (cur.t >= cur.a.secs) nextAction();
      }
      T.rotation.y = lerpAngle(T.rotation.y, cur.a.face, Math.min(1, dt * 6));
      poseFor(cur.a.anim, s.t * (s.phase === 'listening' ? s.speed : 1), target);
    }
    const k = Math.min(1, dt * 8);
    for (const key in target) s.pose[key] += (target[key] - s.pose[key]) * k;
    body.position.y = s.pose.bodyY;
    head.rotation.x = s.pose.headX;
    head.rotation.y = s.pose.headY;
    arms[0].rotation.x = s.pose.aLx;
    arms[0].rotation.z = s.pose.aLz;
    arms[1].rotation.x = s.pose.aRx;
    arms[1].rotation.z = s.pose.aRz;
  }

  function poseFor(anim, t, o) {
    switch (anim) {
      case 'stir':
        o.aRx = -1.15 + Math.sin(t * 5) * 0.18;
        o.aRz = Math.cos(t * 5) * 0.22;
        o.aLx = -0.5;
        o.headX = 0.25;
        break;
      case 'sit':
        o.bodyY = -0.32;
        o.aLx = -0.7;
        o.aRx = -0.7 + Math.max(0, Math.sin(t * 2.2)) * 0.4;
        o.headX = 0.12;
        break;
      case 'doze':
        o.bodyY = -0.32;
        o.aLx = -0.4;
        o.aRx = -0.4;
        o.headX = 0.45 + Math.sin(t * 0.8) * 0.06;
        o.headY = 0.2;
        break;
      case 'look':
        o.headY = Math.sin(t * 0.7) * 0.5;
        o.aRx = Math.sin(t * 0.5) > 0.6 ? -2.4 : 0; // a wave, to somebody
        break;
      case 'radio':
        o.aRx = -1.3;
        o.aRz = Math.sin(t * 1.5) * 0.08;
        o.headY = Math.sin(t * 2) * 0.12; // humming along
        break;
      case 'water':
        o.aRx = -0.9;
        o.aLx = -0.9;
        o.headX = 0.35;
        break;
    }
  }

  function hear(id, clock, k) {
    const o = OBS[id];
    if (!o || !s.ui.log) return;
    const [hh, mm] = clock.split(':').map(Number);
    const mins = hh * 60 + mm + k * 7;
    const time = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
    if (!s.lines.length) s.ui.log.replaceChildren();
    const line = { id, clock: time, noted: false, node: null };
    line.node = el('div.lp-line', { onclick: () => toggleNote(line), title: 'Note for the report' }, [el('span.lp-time', {}, time), el('span.lp-text', {}, o.log)]);
    s.lines.push(line);
    s.ui.log.append(line.node);
    s.ui.log.scrollTop = s.ui.log.scrollHeight;
    s.ctx.audio.tick();
    renderHud();
  }

  function toggleNote(line) {
    if (s.phase !== 'listening' && s.phase !== 'writing') return;
    const n = s.lines.filter((l) => l.noted).length;
    if (!line.noted && n >= RULES.lines) {
      line.node.classList.remove('lp-nope');
      void line.node.offsetWidth;
      line.node.classList.add('lp-nope');
      return;
    }
    line.noted = !line.noted;
    s.ctx.audio.click();
    line.node.classList.toggle('noted', line.noted);
    renderHud();
  }

  // ------------------------------------------------------------------ the report
  function needed() {
    return Math.min(RULES.lines, s.lines.length);
  }

  async function writeReport() {
    if (s.phase !== 'writing') return;
    const noted = s.lines.filter((l) => l.noted);
    if (noted.length < needed()) return;
    s.phase = 'report';
    renderHud();
    const levels = await openReport(noted);
    if (!s.ctx || s.ctx.scope.disposed) return;
    fileReport(noted, levels);
  }

  function openReport(noted) {
    return new Promise((resolve) => {
      const levels = noted.map(() => 'plain');
      const exp = RULES.expected(s.mics);
      const total = el('div.lp-score-n');
      const bar = el('div.lp-bar-fill');
      const mark = el('div.lp-bar-mark', { style: { left: `${(exp / 12) * 100}%` } });
      const rows = noted.map((line, i) => {
        const o = OBS[line.id];
        const sentence = el('div.lp-sentence', {}, o.plain);
        const btns = Object.keys(RULES.weight).map((lv) =>
          el(`button.lp-lv${lv === 'plain' ? '.on' : ''}`, {
            type: 'button',
            'data-lv': lv,
            onclick: () => {
              levels[i] = lv;
              s.ctx.audio.clack();
              btns.forEach((b) => b.classList.toggle('on', b.dataset.lv === lv));
              sentence.textContent = o[lv];
              sentence.className = `lp-sentence lp-${lv}`;
              score();
            },
          }, TEXT.levels[lv]),
        );
        return el('div.lp-row', {}, [el('div.lp-heard', {}, [el('span.lp-time', {}, line.clock), o.log]), el('div.lp-lvs', {}, btns), sentence]);
      });
      const fileBtn = button(TEXT.submit, () => {
        s.ctx.audio.stamp();
        wrap.remove();
        s.ui.report = null;
        resolve(levels);
      }, { variant: 'red' });
      function score() {
        const imp = levels.reduce((a, lv) => a + RULES.weight[lv], 0);
        total.textContent = `${imp} / ${exp}`;
        total.classList.toggle('ok', imp >= exp);
        bar.style.width = `${Math.min(100, (imp / 12) * 100)}%`;
        bar.classList.toggle('ok', imp >= exp);
      }
      const wrap = el('div.lp-report-wrap', {}, [
        el('div.lp-report', {}, [
          el('div.lp-report-head', {}, TEXT.reportHead(s.day)),
          el('div.lp-report-sub', {}, `${s.mics} ${TEXT.mics.toLowerCase()} · ${s.lines.length} lines heard`),
          ...rows,
          el('div.lp-score', {}, [
            el('div.lp-score-lab', {}, [el('span', {}, TEXT.importance), el('span', {}, `${TEXT.expected}: ${exp}`)]),
            el('div.lp-bar', {}, [bar, mark]),
            total,
          ]),
          el('div.lp-report-foot', {}, [fileBtn]),
        ]),
      ]);
      s.ui.report = wrap;
      s.ctx.layer.append(wrap);
      score();
    });
  }

  async function fileReport(noted, levels) {
    const { layer, scope, audio } = s.ctx;
    const imp = levels.reduce((a, lv) => a + RULES.weight[lv], 0);
    const exp = RULES.expected(s.mics);
    s.pages += s.lines.length * 4 + imp;
    s.alarming += levels.filter((lv) => lv === 'alarming').length;
    s.phase = 'review';
    renderHud();
    if (imp >= exp) {
      const added = Math.min(RULES.micsMax - s.mics, 2 + (imp - exp));
      const m = memo(layer, { no: TEXT.review.no(s.day), to: 'Comrade Listener', from: TEXT.dept, subject: TEXT.review.subject(s.day), body: TEXT.review.good(imp, exp, added), stamp: 'APPROVED', buttons: [{ label: TEXT.review.button, value: true }] });
      await m.done;
      if (scope.disposed) return;
      if (s.day >= RULES.days) return endGood();
      s.day++;
      for (let i = 0; i < added; i++) {
        addMic(s.mics);
        toast(layer, TEXT.install(MIC_SPOTS[s.mics].name));
        s.mics++;
        audio.pot?.();
        renderHud();
        await wait(380);
        if (scope.disposed) return;
      }
      startDay();
    } else {
      s.strikes++;
      const last = s.strikes >= RULES.strikes;
      const m = memo(layer, { no: TEXT.review.no(s.day), to: 'Comrade Listener', from: TEXT.dept, subject: TEXT.review.subject(s.day), body: TEXT.review.bad(imp, exp, last), stamp: last ? undefined : 'UNIMPORTANT', buttons: [{ label: last ? 'ACKNOWLEDGED' : TEXT.review.button, value: true }] });
      await m.done;
      if (scope.disposed) return;
      if (last) return endBad();
      if (s.day >= RULES.days) return endGood();
      s.day++;
      if (s.mics > 1) {
        s.mics--;
        removeMic();
        toast(layer, TEXT.removed(MIC_SPOTS[s.mics].name));
        audio.clang?.();
      }
      renderHud();
      await wait(400);
      if (!scope.disposed) startDay();
    }
  }

  async function endGood() {
    const { layer, save, scope } = s.ctx;
    s.phase = 'paper';
    renderHud();
    s.ctx.audio.fanfare();
    const E = TEXT.end.good;
    const m = memo(layer, { no: E.no, to: 'Comrade Listener', from: TEXT.dept, subject: E.subject, body: E.body(s.mics, s.pages), stamp: E.stamp, buttons: [{ label: E.button, value: true, variant: 'red' }] });
    await m.done;
    if (scope.disposed) return;
    save.awardMedal(GAME_ID, { mics: s.mics, pages: s.pages });
    save.recordSuccess(GAME_ID, `Apartment 4B: ${s.mics} microphones`);
    paper(true);
  }

  async function endBad() {
    const { layer, save, scope } = s.ctx;
    s.phase = 'paper';
    renderHud();
    const E = TEXT.end.bad;
    const m = memo(layer, { no: E.no, to: 'Comrade Listener', from: TEXT.dept, subject: E.subject, body: E.body(), stamp: E.stamp, buttons: [{ label: E.button, value: true }] });
    await m.done;
    if (scope.disposed) return;
    save.recordFailure(GAME_ID, 'Reported what happened');
    paper(false);
  }

  async function paper(good) {
    const { layer, scope, manager } = s.ctx;
    s.ui.hud.classList.add('gone');
    // the tenant, at the stove, for the photograph
    const T = s.refs.tenant;
    T.position.set(-4.0, 0, -1.6);
    T.rotation.y = Math.PI * 0.8;
    s.cur = { a: { anim: 'stir', face: Math.PI * 0.8 }, stage: 'act', t: 0, heard: [] };
    self.camera.position.set(-1.6, 3.4, 4.6);
    self.camera.lookAt(-1.4, 1.2, -1.8);
    await wait(250);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    if (scope.disposed) return;
    const photo = manager.snapshot();
    const np = showNewspaper(layer, {
      headline: good ? NEWSPAPER.headline : NEWSPAPER.badHeadline,
      deck: good ? NEWSPAPER.deck : NEWSPAPER.badDeck,
      date: 'MARCH 1983',
      photo,
      caption: NEWSPAPER.caption,
      columns: good ? NEWSPAPER.columns : NEWSPAPER.badColumns,
      sidebar: NEWSPAPER.sidebar({ mics: s.mics, pages: s.pages, alarming: s.alarming, days: s.day }),
      closeLabel: 'RETURN TO THE MINISTRY',
    });
    np.node.classList.add('lp-paper');
    await np.done;
    if (!scope.disposed) s.ctx.goTo('hub');
  }

  const wait = (ms) => new Promise((r) => s.ctx.scope.timeout(r, ms));

  // ------------------------------------------------------------------ HUD
  function buildHud(layer) {
    s.ui.day = el('div.lp-mid');
    s.ui.clock = el('div.lp-big');
    s.ui.micN = el('div.lp-mid');
    s.ui.micDots = el('div.lp-dots');
    s.ui.budget = el('div.lp-mid');
    s.ui.panel = el('div.lp-panel', {}, [
      el('div.lp-flat', {}, TEXT.flat),
      s.ui.day,
      el('div.lp-lab', {}, TEXT.time),
      s.ui.clock,
      el('div.lp-lab', {}, TEXT.mics),
      el('div.lp-microw', {}, [s.ui.micN, s.ui.micDots]),
      el('div.lp-lab', {}, TEXT.budget),
      s.ui.budget,
    ]);
    s.ui.log = el('div.lp-log');
    s.ui.noted = el('div.lp-noted');
    s.ui.hint = el('div.lp-hint');
    s.ui.writeBtn = button(TEXT.write, () => writeReport(), { variant: 'red' });
    s.ui.speedBtn = button(TEXT.fast, () => {
      s.speed = s.speed === 1 ? 3 : 1;
      renderHud();
    }, { variant: 'dark' });
    s.ui.sheet = el('div.lp-sheet', {}, [
      el('div.lp-sheet-head', {}, [el('span', {}, TEXT.log), s.ui.noted]),
      s.ui.log,
      s.ui.hint,
      el('div.lp-sheet-foot', {}, [s.ui.speedBtn, s.ui.writeBtn]),
    ]);
    s.ui.tape = el('div.lp-tape', {}, [el('div.lp-reel'), el('div.lp-tape-mid', {}, [el('div.lp-tape-lab', {}, TEXT.tape), el('div.lp-vu')]), el('div.lp-reel')]);
    s.ui.hud = el('div.lp-hud', {}, [s.ui.panel, s.ui.sheet, s.ui.tape]);
    layer.append(
      el('div.dept-banner', {}, [el('div.dept-kicker', {}, TEXT.dept), el('div.dept-title', {}, TEXT.title)]),
      el('div.corner-actions', {}, [button('← RETURN TO MINISTRY', () => s.ctx.goTo('hub'), { variant: 'dark' })]),
      s.ui.hud,
    );
  }

  function renderHud() {
    if (!s.ui.panel) return;
    s.ui.day.textContent = TEXT.day(s.day, RULES.days);
    s.ui.clock.textContent = s.clock;
    s.ui.micN.textContent = String(s.mics);
    s.ui.micDots.replaceChildren(...Array.from({ length: RULES.micsMax }, (_, i) => el(`span${i < s.mics ? '.on' : ''}`)));
    s.ui.budget.textContent = s.strikes ? TEXT.budgetBad : TEXT.budgetOk;
    s.ui.budget.classList.toggle('bad', s.strikes > 0);
    const n = s.lines.filter((l) => l.noted).length;
    s.ui.noted.textContent = `${TEXT.noted} ${n}/${RULES.lines}`;
    s.ui.noted.classList.toggle('full', n >= RULES.lines);
    s.ui.hint.textContent = s.phase === 'writing' ? (n >= needed() ? TEXT.dayOver : TEXT.hint(needed())) : s.phase === 'listening' ? TEXT.hint(RULES.lines) : '';
    const ready = s.phase === 'writing' && n >= needed();
    s.ui.writeBtn.disabled = !ready;
    s.ui.writeBtn.classList.toggle('lp-ready', ready);
    s.ui.speedBtn.textContent = s.speed === 1 ? TEXT.fast : TEXT.normal;
    s.ui.speedBtn.disabled = s.phase !== 'listening';
    s.ui.tape.classList.toggle('rolling', s.phase === 'listening');
    s.ui.tape.classList.toggle('fast', s.speed > 1);
  }

  if (import.meta.env.DEV) {
    self.__dev = {
      state: () => ({ phase: s.phase, day: s.day, mics: s.mics, strikes: s.strikes, step: s.step, lines: s.lines.length, noted: s.lines.filter((l) => l.noted).length, pages: s.pages, clock: s.clock }),
      skip: () => {
        // finish the day at once: hear everything, end in the armchair
        while (s.phase === 'listening') {
          const cur = s.cur;
          cur.heard.forEach((h, k) => !h.done && ((h.done = true), hear(h.id, cur.a.clock, k)));
          const [x, z] = cur.a.spot;
          s.refs.tenant.position.set(x, 0, z);
          cur.stage = 'act';
          s.clock = cur.a.clock;
          nextAction();
        }
        renderHud();
      },
      note: (idx = [0, 1, 2]) => idx.forEach((i) => s.lines[i] && !s.lines[i].noted && toggleNote(s.lines[i])),
      report: async (lv = 'alarming') => {
        writeReport();
        await new Promise((r) => setTimeout(r, 50));
        s.ui.report?.querySelectorAll(`.lp-lv[data-lv="${lv}"]`).forEach((b) => b.click());
      },
      speed: (x) => (s.speed = x),
    };
  }

  return self;
}

function lerpAngle(a, b, k) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}
