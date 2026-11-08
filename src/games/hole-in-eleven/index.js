// HOLE IN ELEVEN · North Korea wing, game 1.
// The Leader plays his first round of golf. You are the groundskeeper; the hole is portable.
// Point where the hole should be. It follows as fast as you can run. Every shot must go in.
import * as THREE from 'three';
import './hole.css';
import { fontsReady } from '../../shared/fonts.js';
import { el, button, memo } from '../../shared/ui.js';
import { showNewspaper } from '../../shared/newspaper.js';
import { COURSE, HOLES, SURFACES, TEXT, NEWSPAPER, ACES_NEEDED } from './course.js';
import { makeMaterials, buildCourse, buildHole, buildBall, surfaceAt } from './world.js';

const GAME_ID = 'hole-in-eleven';
const RUN_SPEED = 7.5; // m/s: how fast the groundskeeper carries the hole
const CAPTURE = 0.42; // a rolling ball this close drops in, if it is not going too fast
const CAPTURE_REST = 0.62; // a ball that stops this close is "in"; the lip is generous
const MAX_DROP_SPEED = 7;
const MAX_PUTTS = 3;

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; // roughly -1..1

export default function createHoleInEleven() {
  const s = {
    ctx: null,
    m: null,
    refs: null,
    hole: null,
    ball: null,
    shadow: null,
    pointer: new THREE.Vector2(0, 0),
    pointerOn: false,
    ray: new THREE.Raycaster(),
    plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    target: new THREE.Vector3(0, 0, -1),
    cupPos: new THREE.Vector3(0, 0, -1),
    holeIndex: 0,
    phase: 'idle',
    t: 0,
    shot: null, // { from, ctrl, to, T, H }
    vel: new THREE.Vector2(),
    strokes: 0, // this hole
    putts: 0,
    card: [], // strokes per hole
    aces: 0,
    run: 0,
    trail: [],
    trailI: 0,
    lastTrail: new THREE.Vector3(0, 0, -1),
    cheer: 0,
    dev: { auto: false, speed: 1 },
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
      scene.background = new THREE.Color(0xbcd3e0);
      scene.fog = new THREE.Fog(0xbcd3e0, 40, 90);
      const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);
      camera.position.set(0, 17.5, 19);
      camera.lookAt(0, 0, -2.5);
      self.scene = scene;
      self.camera = camera;

      const hemi = new THREE.HemisphereLight(0xe8f0ff, 0x4a5a30, 1.3);
      const sun = new THREE.DirectionalLight(0xfff2dc, 2.2);
      sun.position.set(-14, 26, 12);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 24, bottom: -24, near: 1, far: 80 });
      scene.add(hemi, sun);

      s.m = makeMaterials();
      s.refs = buildCourse(scene, s.m);
      s.hole = buildHole(s.m);
      s.hole.position.copy(s.cupPos);
      scene.add(s.hole);
      const { ball, shadow } = buildBall(s.m);
      s.ball = ball;
      s.shadow = shadow;
      ball.visible = shadow.visible = false;
      scene.add(ball, shadow);
      // torn turf where the hole has been
      const dirtGeo = new THREE.CircleGeometry(0.3, 7);
      for (let i = 0; i < 140; i++) {
        const d = new THREE.Mesh(dirtGeo, s.m.dirt);
        d.rotation.x = -Math.PI / 2;
        d.position.set(0, 0.028, -200);
        scene.add(d);
        s.trail.push(d);
      }

      buildHud(layer);
      const canvas = ctx.renderer.domElement;
      canvas.style.cursor = 'crosshair';
      scope.add(() => (canvas.style.cursor = ''));
      scope.on(canvas, 'pointermove', (e) => {
        const r = canvas.getBoundingClientRect();
        s.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        s.pointerOn = true;
      });
      scope.on(canvas, 'pointerdown', (e) => {
        const r = canvas.getBoundingClientRect();
        s.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        s.pointerOn = true;
      });
      scope.on(window, 'keydown', (e) => {
        if (e.key === 'Escape' && !document.querySelector('.memo-wrap')) ctx.goTo('hub');
      });
    },

    async start() {
      const { layer, scope, audio } = s.ctx;
      const m = memo(layer, { no: TEXT.memo.no, to: 'Comrade Groundskeeper', from: TEXT.dept, subject: TEXT.memo.subject, body: TEXT.memo.body, stamp: 'ALREADY ANNOUNCED', buttons: [{ label: TEXT.memo.button, value: true, variant: 'red' }] });
      await m.done;
      if (scope.disposed) return;
      audio.unlock();
      audio.loop('crowd', 'room', 0.025);
      startHole(0);
    },

    update(dt, time) {
      if (!s.refs) return;
      dt = Math.min(dt, 0.05) * s.dev.speed;
      moveHole(dt);
      if (s.phase !== 'idle' && s.phase !== 'end') tick(dt);
      animate(dt, time);
    },

    dispose() {
      s.refs = null;
      s.ctx = null;
      s.ui = {};
    },
  };

  // ------------------------------------------------------------------ the hole follows you
  function moveHole(dt) {
    if (s.pointerOn && s.phase !== 'end') {
      s.ray.setFromCamera(s.pointer, self.camera);
      const hit = new THREE.Vector3();
      if (s.ray.ray.intersectPlane(s.plane, hit)) {
        const B = COURSE.bounds;
        s.target.set(THREE.MathUtils.clamp(hit.x, -B.x, B.x), 0, THREE.MathUtils.clamp(hit.z, B.zMin, B.zMax));
      }
    }
    if (s.dev.auto && s.autoAt) s.target.copy(s.autoAt);
    const d = s.target.clone().sub(s.cupPos);
    const len = d.length();
    // in the middle of a drop, the hole stays put
    if (len > 0.001 && s.phase !== 'in') {
      const step = Math.min(len, RUN_SPEED * dt);
      s.cupPos.addScaledVector(d, step / len);
      s.run += step;
      if (s.cupPos.distanceTo(s.lastTrail) > 0.55) {
        const piece = s.trail[s.trailI++ % s.trail.length];
        piece.position.set(s.lastTrail.x, 0.028 + (s.trailI % 7) * 0.0004, s.lastTrail.z);
        piece.rotation.z = Math.random() * 6;
        s.lastTrail.copy(s.cupPos);
      }
    }
    s.hole.position.copy(s.cupPos);
  }

  // ------------------------------------------------------------------ holes
  function startHole(i) {
    s.holeIndex = i;
    s.strokes = 1;
    s.putts = 0;
    const h = { ...HOLES[i], n: i + 1 };
    s.phase = 'address';
    s.t = 0;
    s.ball.visible = s.shadow.visible = false;
    renderHud();
    announce(TEXT.address(h), 2.4, true);
    if (h.special) setTimeout(() => s.ctx && announce(TEXT.specials[h.special], 4), 1500);
  }

  /** Plan the Leader's shot: where it lands and the curve it takes to get there. */
  function planShot(h) {
    const G = COURSE.green;
    let to = new THREE.Vector3(G.x + h.aim[0] + gauss() * h.spread, 0, G.z + h.aim[1] + gauss() * h.spread * 0.8);
    if (h.special === 'bunker') {
      const b = COURSE.bunkers[0];
      to = new THREE.Vector3(b.x + gauss() * 0.8, 0, b.z + gauss() * 0.6);
    } else if (h.special === 'long') to.set(gauss() * 8, 0, -13.5 + gauss());
    else if (h.special === 'pond') to.set(COURSE.pond.x + gauss() * 1.6, 0, COURSE.pond.z + gauss() * 1.2);
    const B = COURSE.bounds;
    to.x = THREE.MathUtils.clamp(to.x, -B.x + 1, B.x - 1);
    to.z = THREE.MathUtils.clamp(to.z, B.zMin + 1, B.zMax - 1);
    // the backwards shot comes back from the far end of the course
    const from = h.special === 'backwards' ? new THREE.Vector3(gauss() * 10, 0, -60) : new THREE.Vector3(COURSE.tee.x + gauss() * 2, 0, COURSE.tee.z);
    const mid = from.clone().lerp(to, 0.5);
    const across = new THREE.Vector3(-(to.z - from.z), 0, to.x - from.x).normalize();
    const hook = h.hook * (0.7 + Math.random() * 0.6) * (h.special === 'wind' ? 2.2 : 1);
    const ctrl = mid.addScaledVector(across, hook * 3);
    return { from, ctrl, to, T: (2.3 + h.yards / 650) * (h.special === 'backwards' ? 0.8 : 1), H: 9 + h.yards / 45 };
  }

  function bezier(sh, u, out) {
    const a = 1 - u;
    out.set(a * a * sh.from.x + 2 * a * u * sh.ctrl.x + u * u * sh.to.x, 0, a * a * sh.from.z + 2 * a * u * sh.ctrl.z + u * u * sh.to.z);
    return out;
  }

  function tick(dt) {
    const h = { ...HOLES[s.holeIndex], n: s.holeIndex + 1 };
    s.t += dt;
    if (s.phase === 'address') {
      const wait = h.special === 'backwards' ? 4.4 : 2.0;
      if (s.t >= wait) {
        s.shot = planShot(h);
        s.autoAt = predictRest(s.shot, h);
        s.ctx.audio.clack();
        s.phase = 'flight';
        s.t = 0;
        s.ball.visible = s.shadow.visible = true;
      }
    } else if (s.phase === 'flight') {
      const u = Math.min(1, s.t / s.shot.T);
      const p = bezier(s.shot, u, new THREE.Vector3());
      s.ball.position.set(p.x, 0.17 + 4 * s.shot.H * u * (1 - u), p.z);
      s.shadow.position.set(p.x, 0.04, p.z);
      s.shadow.scale.setScalar(1 + (s.ball.position.y / s.shot.H) * 1.6);
      s.shadow.material.opacity = 0.35 - (s.ball.position.y / s.shot.H) * 0.15;
      if (u >= 1) land(h);
    } else if (s.phase === 'roll') {
      roll(dt);
    } else if (s.phase === 'wait') {
      if (s.t >= s.waitFor) {
        const next = s.afterWait;
        s.afterWait = null;
        next();
      }
    } else if (s.phase === 'in') {
      // the ball drops; the generals write it down
      s.ball.position.y = Math.max(-0.3, s.ball.position.y - dt * 2.5);
      s.ball.position.x += (s.cupPos.x - s.ball.position.x) * Math.min(1, dt * 12);
      s.ball.position.z += (s.cupPos.z - s.ball.position.z) * Math.min(1, dt * 12);
      if (s.t >= 2.2) nextHole();
    }
  }

  function land(h) {
    const p = s.ball.position;
    const surf = surfaceAt(p.x, p.z);
    const d = Math.hypot(p.x - s.cupPos.x, p.z - s.cupPos.z);
    if (surf === 'pond') {
      if (d < CAPTURE_REST) return holed(TEXT.pondAce);
      splash();
      return missed(TEXT.sunk);
    }
    if (d < CAPTURE) return holed(TEXT.straightIn);
    if (surf === 'bunker') return settle();
    // roll on, along the line of flight
    const end = bezier(s.shot, 1, new THREE.Vector3());
    const before = bezier(s.shot, 0.97, new THREE.Vector3());
    const dir = new THREE.Vector2(end.x - before.x, end.z - before.z).normalize();
    const speed = h.roll * (surf === 'green' ? 1 : 0.55) * (0.8 + Math.random() * 0.4);
    s.vel.copy(dir).multiplyScalar(speed);
    s.phase = 'roll';
    s.t = 0;
    s.ctx.audio.tick();
  }

  function roll(dt) {
    const p = s.ball.position;
    const sp = s.vel.length();
    const surf = surfaceAt(p.x, p.z);
    if (surf === 'pond') {
      splash();
      return missed(TEXT.sunk);
    }
    const d = Math.hypot(p.x - s.cupPos.x, p.z - s.cupPos.z);
    if (d < CAPTURE && sp < MAX_DROP_SPEED) return holed();
    const nsp = Math.max(0, sp - SURFACES[surf].friction * dt);
    if (nsp <= 0.02) return settle();
    s.vel.multiplyScalar(nsp / sp);
    p.x += s.vel.x * dt;
    p.z += s.vel.y * dt;
    p.y = 0.17;
    s.ball.rotation.x -= s.vel.y * dt * 5;
    s.ball.rotation.z += s.vel.x * dt * 5;
    s.shadow.position.set(p.x, 0.04, p.z);
    s.shadow.scale.setScalar(1);
    // a ball that rolls off the course is returned by a volunteer
    const B = COURSE.bounds;
    if (Math.abs(p.x) > B.x || p.z < B.zMin || p.z > B.zMax) {
      p.x = THREE.MathUtils.clamp(p.x, -B.x, B.x);
      p.z = THREE.MathUtils.clamp(p.z, B.zMin, B.zMax);
      s.vel.set(0, 0);
    }
  }

  /** The ball has stopped. If the hole is near enough, the hole was there all along. */
  function settle() {
    const p = s.ball.position;
    const d = Math.hypot(p.x - s.cupPos.x, p.z - s.cupPos.z);
    if (d < CAPTURE_REST) return holed();
    missed(TEXT.missed);
  }

  function holed(extra) {
    s.phase = 'in';
    s.t = 0;
    s.autoAt = null;
    const strokes = s.strokes;
    s.card[s.holeIndex] = strokes;
    if (strokes === 1) s.aces++;
    s.cheer = 1.6;
    s.refs.flash.intensity = 60;
    const { audio } = s.ctx;
    audio.ding();
    for (let k = 0; k < 7; k++) setTimeout(() => s.ctx && audio.click(), 300 + k * 90 + Math.random() * 60);
    renderHud();
    const line = strokes === 1 ? pick(TEXT.ace) : TEXT.holeDone(strokes);
    announce(extra && strokes === 1 ? `${line} ${extra}` : line, 2.2, strokes === 1);
  }

  function missed(text) {
    s.ctx.audio.stamp();
    s.strokes++;
    renderHud();
    const sunk = text === TEXT.sunk;
    announce(text, 2.4, false);
    wait(1.6, () => {
      if (sunk) {
        // a new ball is dropped where the old one went in, at the edge of the pond
        const P = COURSE.pond;
        const p = s.ball.position;
        const a = Math.atan2(p.z - P.z, p.x - P.x);
        p.set(P.x + Math.cos(a) * (P.r + 0.8), 0.17, P.z + Math.sin(a) * (P.r * 0.8 + 0.8));
        s.shadow.position.set(p.x, 0.04, p.z);
      }
      if (s.putts >= MAX_PUTTS) {
        announce(TEXT.carried, 2.4, false);
        s.ball.position.set(s.cupPos.x, 0.17, s.cupPos.z);
        return wait(1.2, () => holed());
      }
      putt();
    });
  }

  function putt() {
    s.putts++;
    announce(TEXT.putt(s.putts), 2, false);
    wait(1.3, () => {
      const p = s.ball.position;
      const to = new THREE.Vector2(s.cupPos.x - p.x, s.cupPos.z - p.z);
      const dist = Math.max(0.5, to.length());
      const surf = surfaceAt(p.x, p.z);
      const f = SURFACES[surf === 'bunker' ? 'rough' : surf].friction;
      // the Leader's putting is confident: too hard, and a little off line
      const err = (0.12 + s.holeIndex * 0.012) * (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random());
      const ang = Math.atan2(to.y, to.x) + err;
      const speed = Math.sqrt(2 * f * dist) * (1.25 + Math.random() * 0.35);
      s.vel.set(Math.cos(ang) * speed, Math.sin(ang) * speed);
      s.autoAt = predictRoll(p, s.vel);
      s.ctx.audio.tick();
      s.phase = 'roll';
      s.t = 0;
    });
  }

  function wait(secs, fn) {
    s.phase = 'wait';
    s.t = 0;
    s.waitFor = secs;
    s.afterWait = fn;
  }

  function splash() {
    s.ball.visible = false;
    s.shadow.visible = false;
    s.ctx.audio.drip?.();
    setTimeout(() => {
      if (!s.refs) return;
      s.ball.visible = s.shadow.visible = true;
    }, 1500);
  }

  function nextHole() {
    if (s.holeIndex + 1 < HOLES.length) startHole(s.holeIndex + 1);
    else finish();
  }

  // ------------------------------------------------------------------ dev: where will it stop?
  function predictRest(shot, h) {
    const end = bezier(shot, 1, new THREE.Vector3());
    if (surfaceAt(end.x, end.z) !== 'green' && surfaceAt(end.x, end.z) !== 'rough') return end;
    return end; // landing is enough for the auto-groundskeeper: it gets there first
  }
  function predictRoll(p, v) {
    const pos = new THREE.Vector2(p.x, p.z);
    const vel = v.clone();
    for (let k = 0; k < 600; k++) {
      const sp = vel.length();
      const f = SURFACES[surfaceAt(pos.x, pos.y)].friction;
      if (!isFinite(f)) break;
      const n = Math.max(0, sp - f / 60);
      if (n <= 0.02) break;
      vel.multiplyScalar(n / sp);
      pos.addScaledVector(vel, 1 / 60);
    }
    return new THREE.Vector3(pos.x, 0, pos.y);
  }

  // ------------------------------------------------------------------ the end
  async function finish() {
    const { layer, save, audio, scope, manager } = s.ctx;
    s.phase = 'end';
    audio.stopLoop('crowd');
    const strokes = s.card.reduce((a, b) => a + b, 0);
    const good = s.aces >= ACES_NEEDED;
    const label = `${s.aces} holes-in-one, ${strokes} strokes`;
    if (good) {
      save.awardMedal(GAME_ID, { aces: s.aces, strokes });
      save.recordSuccess(GAME_ID, label);
    } else save.recordFailure(GAME_ID, label);
    const m = memo(layer, {
      no: 'SR-11/02',
      to: 'Comrade Groundskeeper',
      from: TEXT.dept,
      subject: 'The official scorecard',
      body: [
        `Strokes counted: ${strokes}. Strokes recorded: 18.`,
        `Holes-in-one observed: ${s.aces}. Holes-in-one announced: ${s.aces >= 18 ? 18 : 11}.`,
        good ? 'The round has been accepted as played.' : 'The round has been accepted as announced. You are thanked for the difference.',
      ],
      stamp: good ? 'RECORD CONFIRMED' : 'RECORD CONFIRMED ANYWAY',
      buttons: [{ label: 'SEND TO THE NEWSPAPER', value: true, variant: 'red' }],
    });
    await m.done;
    if (scope.disposed) return;
    audio.fanfare();
    const photo = manager.snapshot();
    const r = { aces: s.aces, strokes, run: s.run, good };
    const np = showNewspaper(layer, {
      masthead: NEWSPAPER.masthead,
      motto: NEWSPAPER.motto,
      date: NEWSPAPER.date,
      price: NEWSPAPER.price,
      headline: NEWSPAPER.headline(s.aces),
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

  // ------------------------------------------------------------------ animation & HUD
  function animate(dt, time) {
    const flag = s.hole.userData.flag;
    flag.rotation.y = Math.sin(time * 3) * 0.15;
    // the hole bobs as it is carried
    const moving = s.target.distanceTo(s.cupPos) > 0.05;
    s.hole.children[2].rotation.z = moving ? Math.sin(time * 18) * 0.08 : 0;
    s.cheer = Math.max(0, s.cheer - dt);
    for (const [i, g] of s.refs.generals.entries()) {
      const arm = g.userData.arm;
      const up = s.cheer > 0 ? -2.6 + Math.sin(time * 14 + i) * 0.3 : -0.9 + Math.sin(time * 1.3 + i) * 0.05;
      arm.rotation.x += (up - arm.rotation.x) * Math.min(1, dt * 10);
    }
    s.refs.flash.intensity = Math.max(0, s.refs.flash.intensity - dt * 220);
  }

  function buildHud(layer) {
    const hole = el('div.hi-num', {}, '1');
    const info = el('div.hi-info', {}, '');
    const strokes = el('div.hi-num', {}, '0');
    const aces = el('div.hi-num', {}, '0');
    const board = el('div.hi-board', {}, [
      el('div.hi-cell', {}, [el('div.hi-lab', {}, 'Hole'), hole, info]),
      el('div.hi-cell', {}, [el('div.hi-lab', {}, 'Strokes'), strokes, el('div.hi-info', {}, 'official: 18')]),
      el('div.hi-cell', {}, [el('div.hi-lab', {}, 'Holes-in-one'), aces, el('div.hi-info', {}, `needed: ${ACES_NEEDED}`)]),
    ]);
    const cells = HOLES.map((_, i) => el('div.hi-sc', {}, [el('span.hi-scn', {}, String(i + 1)), el('span.hi-scv', {}, '1')]));
    const card = el('div.hi-card', {}, [el('div.hi-card-lab', {}, 'SCORECARD · PRINTED IN ADVANCE'), el('div.hi-cells', {}, cells)]);
    const ann = el('div.hi-announce', {}, '');
    const hint = el('div.hi-hint', {}, 'Point where the hole should be. Watch the shadow.');
    const back = el('div.corner-actions', {}, [button('← RETURN TO LOBBY', () => s.ctx.goTo('hub'), { variant: 'dark' })]);
    const root = el('div.hi-hud', {}, [board, ann, card, hint, back]);
    layer.append(root);
    s.ui = { root, hole, info, strokes, aces, cells, ann };
  }

  function renderHud() {
    const u = s.ui;
    if (!u.root) return;
    const h = HOLES[s.holeIndex];
    u.hole.textContent = `${s.holeIndex + 1}`;
    u.info.textContent = `${h.yards} yd · par ${h.par}`;
    const done = s.card.reduce((a, b) => a + b, 0);
    u.strokes.textContent = String(done + (s.card[s.holeIndex] === undefined ? s.strokes : 0));
    u.aces.textContent = String(s.aces);
    u.aces.classList.toggle('met', s.aces >= ACES_NEEDED);
    u.cells.forEach((c, i) => {
      const v = s.card[i];
      c.classList.toggle('now', i === s.holeIndex && v === undefined);
      c.classList.toggle('bad', v > 1);
      c.classList.toggle('ace', v === 1);
      c.lastChild.textContent = v === undefined ? '1' : String(v);
    });
  }

  function announce(text, secs = 2.5, good = true) {
    const a = s.ui.ann;
    if (!a) return;
    a.textContent = text;
    a.classList.toggle('bad', !good);
    a.style.setProperty('--dur', `${secs}s`);
    a.classList.remove('show');
    void a.offsetWidth;
    a.classList.add('show');
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
