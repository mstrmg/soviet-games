// MASS GAMES · North Korea wing, game 2. A card-stunt puzzle.
// Every participant turns one page when their row's (or column's) conductor signals.
// Signal rows and columns until the stand shows the image. One wrong card and it is reviewed.
import * as THREE from 'three';
import './mass.css';
import { fontsReady } from '../../shared/fonts.js';
import { el, button, memo } from '../../shared/ui.js';
import { showNewspaper } from '../../shared/newspaper.js';
import { IMAGES, COLOURS, TEXT, NEWSPAPER, REVIEWS_ALLOWED } from './images.js';
import { buildStadium, buildFlag, cardPos, MAX_W, MAX_H, RISE, DEPTH } from './stadium.js';

const GAME_ID = 'mass-games';
const FLIP = 0.32; // seconds for one card to turn a page

export default function createMassGames() {
  const s = {
    ctx: null,
    img: null,
    index: 0,
    w: 0,
    h: 0,
    K: 0,
    cur: [], // page each participant is showing
    target: [], // page each participant should be showing
    shown: [], // colour index currently displayed (lags cur while flipping)
    anim: [], // { t, delay } per card while turning
    cards: null,
    flags: [],
    hits: [],
    hover: null,
    bar: null,
    timeLeft: 0,
    phase: 'idle',
    reviews: 0,
    signals: 0,
    pointer: new THREE.Vector2(-9, -9),
    ray: new THREE.Raycaster(),
    m4: new THREE.Matrix4(),
    q: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.35, 0, 0)),
    v: new THREE.Vector3(),
    col: new THREE.Color(),
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
      scene.background = new THREE.Color(0x0d1424);
      scene.fog = new THREE.Fog(0x0d1424, 30, 70);
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
      camera.position.set(0, 7, 18.5);
      camera.lookAt(0, 4.3, -4);
      self.scene = scene;
      self.camera = camera;
      scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x20301e, 1.2));
      const flood = new THREE.DirectionalLight(0xfff4dc, 1.8);
      flood.position.set(4, 18, 20);
      scene.add(flood);

      buildStadium(scene);
      s.cards = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.9, 0.05), new THREE.MeshLambertMaterial(), MAX_W * MAX_H);
      s.cards.count = 0;
      scene.add(s.cards);
      s.bar = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.18, depthWrite: false }));
      s.bar.visible = false;
      scene.add(s.bar);

      buildHud(layer);
      const canvas = ctx.renderer.domElement;
      scope.add(() => (canvas.style.cursor = ''));
      const toNdc = (e) => {
        const r = canvas.getBoundingClientRect();
        s.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      };
      scope.on(canvas, 'pointermove', (e) => {
        toNdc(e);
        pickHover();
      });
      scope.on(canvas, 'pointerleave', () => setHover(null));
      scope.on(canvas, 'contextmenu', (e) => e.preventDefault());
      scope.on(canvas, 'pointerdown', (e) => {
        toNdc(e);
        pickHover();
        if (s.hover && s.phase === 'play') signal(s.hover.kind, s.hover.index, e.button === 2 ? -1 : 1);
      });
      scope.on(window, 'keydown', (e) => {
        if (e.key === 'Escape' && !document.querySelector('.memo-wrap')) ctx.goTo('hub');
      });
    },

    async start() {
      const { layer, scope, audio } = s.ctx;
      const m = memo(layer, { no: TEXT.memo.no, to: 'Comrade Conductor', from: TEXT.dept, subject: TEXT.memo.subject, body: TEXT.memo.body, stamp: 'SPONTANEOUS', buttons: [{ label: TEXT.memo.button, value: true, variant: 'red' }] });
      await m.done;
      if (scope.disposed) return;
      audio.unlock();
      audio.loop('crowd', 'room', 0.03);
      runImage(0);
    },

    update(dt, time) {
      if (!s.cards) return;
      animateCards(dt);
      for (const [i, f] of s.flags.entries()) f.userData.cloth.rotation.y = Math.sin(time * 4 + i) * 0.25 + (f.userData.wave > 0 ? Math.sin(time * 30) * 0.6 : 0);
      for (const f of s.flags) f.userData.wave = Math.max(0, (f.userData.wave || 0) - dt);
      if (s.phase === 'play') {
        s.timeLeft -= dt;
        renderClock();
        if (s.timeLeft <= 0) present();
      }
    },

    dispose() {
      s.cards = null;
      s.ctx = null;
      s.ui = {};
    },
  };

  // ------------------------------------------------------------------ images
  async function runImage(i, again = false) {
    const { layer, scope } = s.ctx;
    s.index = i;
    s.img = IMAGES[i];
    const I = s.img;
    if (!again) {
      const m = memo(layer, { no: `SC-2/1${i + 1}`, to: 'Comrade Conductor', from: TEXT.dept, subject: `Image ${i + 1} of ${IMAGES.length}: ${I.title}`, body: I.memo, buttons: [{ label: 'RAISE THE CARDS', value: true, variant: 'red' }] });
      await m.done;
      if (scope.disposed) return;
    }
    setup(I);
    s.phase = 'play';
    s.timeLeft = I.seconds;
    renderHud();
  }

  /** Lay out the image and scramble it by signals nobody gave. Always solvable. */
  function setup(I) {
    s.w = I.art[0].length;
    s.h = I.art.length;
    s.K = I.colours.length;
    const N = s.w * s.h;
    s.target = [];
    for (let r = 0; r < s.h; r++) for (let c = 0; c < s.w; c++) s.target.push(I.colours.indexOf(I.art[r][c]));
    let rowShift;
    let colShift;
    do {
      rowShift = Array.from({ length: s.h }, () => Math.floor(Math.random() * s.K));
      colShift = Array.from({ length: s.w }, () => (I.signals.includes('cols') ? Math.floor(Math.random() * s.K) : 0));
    } while (rowShift.every((x) => x === 0) && colShift.every((x) => x === 0));
    s.cur = s.target.map((t, k) => (((t - rowShift[Math.floor(k / s.w)] - colShift[k % s.w]) % s.K) + s.K) % s.K);
    s.solution = { rows: rowShift, cols: colShift };
    s.shown = s.cur.slice();
    s.anim = new Array(N).fill(null);
    s.cards.count = N;
    for (let k = 0; k < N; k++) placeCard(k, 1);
    s.cards.instanceMatrix.needsUpdate = true;
    s.cards.instanceColor.needsUpdate = true;
    buildFlags(I);
    drawPlan(I);
  }

  function placeCard(k, sy) {
    const c = k % s.w;
    const r = Math.floor(k / s.w);
    cardPos(c, r, s.w, s.h, s.v);
    s.m4.compose(s.v, s.q, new THREE.Vector3(1, Math.max(0.02, sy), 1));
    s.cards.setMatrixAt(k, s.m4);
    s.col.setHex(COLOURS[s.img.colours[s.shown[k]]]);
    s.cards.setColorAt(k, s.col);
  }

  function buildFlags(I) {
    for (const f of s.flags) self.scene.remove(f);
    s.flags = [];
    s.hits = [];
    for (let r = 0; r < s.h; r++) {
      const f = buildFlag('row', r);
      const p = cardPos(0, r, s.w, s.h);
      f.position.set(p.x - 1.4, p.y - 0.45, p.z + 0.1);
      s.flags.push(f);
    }
    if (I.signals.includes('cols')) {
      for (let c = 0; c < s.w; c++) {
        const f = buildFlag('col', c);
        const p = cardPos(c, s.h - 1, s.w, s.h);
        f.position.set(p.x - 0.2, 0.05, p.z + 1.4);
        s.flags.push(f);
      }
    }
    for (const f of s.flags) {
      self.scene.add(f);
      s.hits.push(f.userData.hit);
    }
  }

  // ------------------------------------------------------------------ signals
  function signal(kind, index, dir) {
    const { audio } = s.ctx;
    s.signals++;
    audio.click();
    const flag = s.flags.find((f) => f.userData.hit.userData.signal.kind === kind && f.userData.hit.userData.signal.index === index);
    if (flag) flag.userData.wave = 0.35;
    const cells = [];
    if (kind === 'row') for (let c = 0; c < s.w; c++) cells.push([index * s.w + c, c]);
    else for (let r = 0; r < s.h; r++) cells.push([r * s.w + index, s.h - 1 - r]);
    for (const [k, order] of cells) {
      s.cur[k] = (((s.cur[k] + dir) % s.K) + s.K) % s.K;
      s.anim[k] = { t: -order * 0.03, to: s.cur[k] };
    }
    setTimeout(() => s.ctx && audio.tick(), 120);
    renderHud();
    if (correctCount() === s.cur.length) {
      s.phase = 'settling';
      setTimeout(() => s.ctx && present(), 1100);
    }
  }

  function animateCards(dt) {
    let dirty = false;
    for (let k = 0; k < s.anim.length; k++) {
      const a = s.anim[k];
      if (!a) continue;
      a.t += dt;
      dirty = true;
      if (a.t < 0) continue;
      const u = Math.min(1, a.t / FLIP);
      if (u >= 0.5) s.shown[k] = a.to;
      placeCard(k, Math.abs(Math.cos(u * Math.PI)));
      if (u >= 1) s.anim[k] = null;
    }
    if (dirty) {
      s.cards.instanceMatrix.needsUpdate = true;
      s.cards.instanceColor.needsUpdate = true;
    }
  }

  function correctCount() {
    let n = 0;
    for (let k = 0; k < s.cur.length; k++) if (s.cur[k] === s.target[k]) n++;
    return n;
  }

  // ------------------------------------------------------------------ hover
  function pickHover() {
    if (!s.hits.length) return;
    s.ray.setFromCamera(s.pointer, self.camera);
    const hit = s.ray.intersectObjects(s.hits, false)[0];
    setHover(hit ? hit.object.userData.signal : null);
  }

  function setHover(sig) {
    s.hover = sig;
    self.camera && (s.ctx.renderer.domElement.style.cursor = sig ? 'pointer' : '');
    if (!sig) return (s.bar.visible = false);
    s.bar.visible = true;
    if (sig.kind === 'row') {
      const p = cardPos(0, sig.index, s.w, s.h);
      s.bar.position.set(0, p.y, p.z + 0.05);
      s.bar.scale.set(s.w + 0.4, 1.0, 0.3);
      s.bar.rotation.set(-0.35, 0, 0);
    } else {
      const top = cardPos(sig.index, 0, s.w, s.h);
      const bot = cardPos(sig.index, s.h - 1, s.w, s.h);
      s.bar.position.set(top.x, (top.y + bot.y) / 2, (top.z + bot.z) / 2 + 0.05);
      s.bar.scale.set(1.0, Math.hypot(top.y - bot.y, top.z - bot.z) + 1, 0.3);
      s.bar.rotation.set(-Math.atan2(DEPTH, RISE), 0, 0);
    }
  }

  // ------------------------------------------------------------------ presenting
  async function present() {
    if (s.phase === 'review' || s.phase === 'end') return;
    const { layer, scope, audio } = s.ctx;
    s.phase = 'review';
    setHover(null);
    const wrong = s.cur.length - correctCount();
    if (!wrong) {
      audio.ding();
      for (let k = 0; k < 10; k++) setTimeout(() => s.ctx && audio.click(), 200 + k * 80 + Math.random() * 50);
      const m = memo(layer, { no: `SC-2/1${s.index + 1}-A`, to: 'Comrade Conductor', from: 'The Delegation', subject: `${s.img.title}: presented`, body: [TEXT.correct], stamp: 'CORRECT', buttons: [{ label: s.index + 1 < IMAGES.length ? 'NEXT IMAGE' : 'END THE GAMES', value: true, variant: 'red' }] });
      m.node.classList.add('mg-side');
      await m.done;
      if (scope.disposed) return;
      if (s.index + 1 < IMAGES.length) runImage(s.index + 1);
      else finish();
      return;
    }
    s.reviews++;
    audio.stamp();
    const m = memo(layer, { no: `SC-2/1${s.index + 1}-R`, to: 'Comrade Conductor', from: 'Committee for Review', subject: `${s.img.title}: reviewed`, body: [TEXT.reviewed(wrong)], stamp: 'REVIEWED', buttons: [{ label: 'REHEARSE AGAIN', value: true, variant: 'red' }] });
    m.node.classList.add('mg-side');
    await m.done;
    if (scope.disposed) return;
    runImage(s.index, true);
  }

  async function finish() {
    const { layer, save, audio, scope, manager } = s.ctx;
    s.phase = 'end';
    audio.stopLoop('crowd');
    const good = s.reviews <= REVIEWS_ALLOWED;
    const label = `Three images, ${s.reviews} review${s.reviews === 1 ? '' : 's'}`;
    if (good) {
      save.awardMedal(GAME_ID, { reviews: s.reviews, signals: s.signals });
      save.recordSuccess(GAME_ID, label);
    } else save.recordFailure(GAME_ID, label);
    audio.fanfare();
    const photo = manager.snapshot();
    const r = { reviews: s.reviews, signals: s.signals };
    const np = showNewspaper(layer, {
      masthead: NEWSPAPER.masthead,
      motto: NEWSPAPER.motto,
      date: NEWSPAPER.date,
      price: NEWSPAPER.price,
      headline: NEWSPAPER.headline(good),
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
    const title = el('div.mg-title', {}, '');
    const clock = el('div.mg-num', {}, '0:00');
    const correct = el('div.mg-num', {}, '0');
    const board = el('div.mg-board', {}, [
      el('div.mg-cell.mg-wide', {}, [el('div.mg-lab', {}, 'Image'), title]),
      el('div.mg-cell', {}, [el('div.mg-lab', {}, 'Delegation arrives'), clock]),
      el('div.mg-cell', {}, [el('div.mg-lab', {}, 'Correct cards'), correct]),
    ]);
    const plan = el('canvas.mg-plan', { width: 320, height: 240 });
    const pages = el('div.mg-pages', {}, '');
    const presentBtn = button('PRESENT THE IMAGE NOW', () => s.phase === 'play' && present(), { variant: 'red' });
    const side = el('aside.mg-side-panel', {}, [el('div.mg-lab', {}, 'The plan'), plan, el('div.mg-lab', {}, 'Page order (each signal turns one page)'), pages, presentBtn]);
    const hint = el('div.mg-hint', {}, 'Click a conductor\'s flag: the row or column turns one page. Right-click turns it back.');
    const back = el('div.corner-actions', {}, [button('← RETURN TO LOBBY', () => s.ctx.goTo('hub'), { variant: 'dark' })]);
    const root = el('div.mg-hud', {}, [board, side, hint, back]);
    layer.append(root);
    s.ui = { root, title, clock, correct, plan, pages };
  }

  function drawPlan(I) {
    const cv = s.ui.plan;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const cell = Math.floor(Math.min(cv.width / s.w, cv.height / s.h));
    ctx.fillStyle = '#161514';
    ctx.fillRect(0, 0, cv.width, cv.height);
    const ox = (cv.width - cell * s.w) / 2;
    const oy = (cv.height - cell * s.h) / 2;
    for (let r = 0; r < s.h; r++) {
      for (let c = 0; c < s.w; c++) {
        ctx.fillStyle = `#${COLOURS[I.art[r][c]].toString(16).padStart(6, '0')}`;
        ctx.fillRect(ox + c * cell + 1, oy + r * cell + 1, cell - 2, cell - 2);
      }
    }
    s.ui.pages.replaceChildren(
      ...I.colours.flatMap((k, i) => [
        el('span.mg-swatch', { style: `background:#${COLOURS[k].toString(16).padStart(6, '0')}` }),
        el('span.mg-arrow', {}, i < I.colours.length - 1 ? '→' : '↺'),
      ]),
    );
  }

  function renderHud() {
    const u = s.ui;
    if (!u.root || !s.img) return;
    u.title.textContent = `${s.index + 1}/${IMAGES.length} · ${s.img.title}`;
    const n = correctCount();
    u.correct.textContent = `${n}/${s.cur.length}`;
    u.correct.classList.toggle('done', n === s.cur.length);
    renderClock();
  }

  function renderClock() {
    const u = s.ui;
    if (!u.clock) return;
    const t = Math.max(0, Math.ceil(s.timeLeft));
    u.clock.textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    u.clock.classList.toggle('low', t <= 15);
  }

  if (import.meta.env.DEV) {
    self.__dev = {
      s,
      /** Give exactly the signals that undo the scramble. */
      solve() {
        s.solution.rows.forEach((n, r) => {
          for (let k = 0; k < n; k++) signal('row', r, 1);
        });
        s.solution.cols.forEach((n, c) => {
          for (let k = 0; k < n; k++) signal('col', c, 1);
        });
      },
      fail() {
        s.timeLeft = 0.1;
      },
    };
  }

  return self;
}
