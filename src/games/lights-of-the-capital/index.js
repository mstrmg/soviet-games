// LIGHTS OF THE CAPITAL · North Korea wing, game 3.
// A night map of the country and a tiny power budget. When a camera is overhead, light what is
// in its frame. A photograph is as bright as the share of its districts that are lit.
import * as THREE from 'three';
import './lights.css';
import { fontsReady } from '../../shared/fonts.js';
import { el, button, memo, toast } from '../../shared/ui.js';
import { showNewspaper } from '../../shared/newspaper.js';
import { canvasTexture, rng } from '../../shared/canvasTexture.js';
import { DISTRICTS, NIGHTS, WARM_UP, PASS_MARK, TEXT, NEWSPAPER } from './grid.js';

const GAME_ID = 'lights-of-the-capital';
const SAMPLE = 0.25;

export default function createLightsOfTheCapital() {
  const s = {
    ctx: null,
    night: 0,
    t: 0,
    phase: 'idle',
    d: [], // per district: { def, on, warm, lights:[instance indices], glow, hit }
    lights: null,
    events: [], // active and pending for this night: { def, started, done, samples, frame }
    photos: [], // { pct, kind, night }
    switches: 0,
    hover: null,
    pointer: new THREE.Vector2(-9, -9),
    ray: new THREE.Raycaster(),
    hits: [],
    col: new THREE.Color(),
    sampleT: 0,
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
      scene.background = new THREE.Color(0x05070d);
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
      camera.position.set(0, 38, 12.5);
      camera.lookAt(0, 0, 1.6);
      self.scene = scene;
      self.camera = camera;
      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      buildMap(scene);
      buildHud(layer);

      const canvas = ctx.renderer.domElement;
      scope.add(() => (canvas.style.cursor = ''));
      const toNdc = (e) => {
        const r = canvas.getBoundingClientRect();
        s.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        s.pointerPx = { x: e.clientX, y: e.clientY };
      };
      scope.on(canvas, 'pointermove', (e) => {
        toNdc(e);
        pickHover();
      });
      scope.on(canvas, 'pointerleave', () => setHover(null));
      scope.on(canvas, 'pointerdown', (e) => {
        toNdc(e);
        pickHover();
        if (s.hover && s.phase === 'play') toggle(s.hover);
      });
      scope.on(window, 'keydown', (e) => {
        if (e.key === 'Escape' && !document.querySelector('.memo-wrap')) ctx.goTo('hub');
      });
    },

    async start() {
      const { scope, audio } = s.ctx;
      audio.unlock();
      await runNight(0);
      if (scope.disposed) return;
    },

    update(dt, time) {
      if (!s.lights) return;
      dt = Math.min(dt, 0.05) * s.dev.speed;
      if (s.phase === 'play') tick(dt);
      animate(dt, time);
    },

    dispose() {
      s.lights = null;
      s.ctx = null;
      s.ui = {};
    },
  };

  // ------------------------------------------------------------------ the map
  function landShape() {
    // a tall, ragged country; the outline is approximate and the border is exact
    const r = rng(38);
    const pts = [];
    const n = 64;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const wob = 1 + Math.sin(a * 3 + 1) * 0.08 + Math.sin(a * 7) * 0.05 + (r() - 0.5) * 0.06;
      const bulge = Math.cos(a) > 0 && Math.sin(a) < 0.2 ? 1.08 : 1;
      pts.push([Math.cos(a) * 8.6 * wob * bulge, Math.sin(a) * 13.4 * wob]);
    }
    return pts;
  }

  function buildMap(scene) {
    const land = landShape();
    // sea and land, painted onto one big plane
    const W = 40;
    const H = 34;
    const tex = canvasTexture(1024, 870, (ctx, w, h) => {
      const sx = w / W;
      const sz = h / H;
      ctx.fillStyle = '#060912';
      ctx.fillRect(0, 0, w, h);
      ctx.beginPath();
      land.forEach(([x, z], i) => ctx[i ? 'lineTo' : 'moveTo']((x + W / 2) * sx, (z + H / 2) * sz));
      ctx.closePath();
      ctx.fillStyle = '#12161d';
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,140,170,0.18)';
      ctx.lineWidth = 2;
      ctx.stroke();
      // the northern border: straight, and very well lit on the other side
      ctx.setLineDash([10, 8]);
      ctx.strokeStyle = 'rgba(200,60,60,0.45)';
      ctx.beginPath();
      ctx.moveTo(0, (-13 + H / 2) * sz);
      ctx.lineTo(w, (-13 + H / 2) * sz);
      ctx.stroke();
      ctx.setLineDash([]);
      // roads between the towns, unlit
      ctx.strokeStyle = 'rgba(90,100,120,0.25)';
      ctx.lineWidth = 2;
      const towns = DISTRICTS.filter((d) => !d.capital);
      for (const t of towns) {
        ctx.beginPath();
        ctx.moveTo((-1.4 + W / 2) * sx, (1.6 + H / 2) * sz);
        ctx.lineTo((t.x + W / 2) * sx, (t.z + H / 2) * sz);
        ctx.stroke();
      }
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: tex }));
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);
    // the lights over the border, which are someone else's problem
    const r = rng(12);
    const across = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.05, 0.12), new THREE.MeshBasicMaterial({ color: 0xffe2a0 }), 260);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 260; i++) {
      m4.makeTranslation(-20 + r() * 40, 0.05, -13.6 - r() * 3.4);
      across.setMatrixAt(i, m4);
    }
    scene.add(across);

    // districts: little clusters of lights, a glow, and a hit area
    const total = DISTRICTS.reduce((a, d) => a + (d.capital ? 26 : 10), 0);
    s.lights = new THREE.InstancedMesh(new THREE.BoxGeometry(0.13, 0.06, 0.13), new THREE.MeshBasicMaterial(), total);
    const glowTex = canvasTexture(128, 128, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,220,140,0.9)');
      g.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
    let k = 0;
    for (const def of DISTRICTS) {
      const n = def.capital ? 26 : 10;
      const rad = def.capital ? 0.55 : 0.6;
      const idx = [];
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2;
        const rr = Math.sqrt(r()) * rad;
        m4.makeTranslation(def.x + Math.cos(a) * rr, 0.06, def.z + Math.sin(a) * rr);
        s.lights.setMatrixAt(k, m4);
        idx.push(k++);
      }
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(def.capital ? 3.2 : 2.6, def.capital ? 3.2 : 2.6), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
      glow.rotation.x = -Math.PI / 2;
      glow.position.set(def.x, 0.08, def.z);
      scene.add(glow);
      const hit = new THREE.Mesh(new THREE.CylinderGeometry(def.capital ? 0.62 : 0.95, def.capital ? 0.62 : 0.95, 0.3, 12), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.set(def.x, 0.15, def.z);
      scene.add(hit);
      const ring = new THREE.Mesh(new THREE.RingGeometry(def.capital ? 0.62 : 0.9, def.capital ? 0.7 : 0.98, 28), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0 }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(def.x, 0.1, def.z);
      scene.add(ring);
      const d = { def, on: Boolean(def.locked), warm: def.locked ? 1 : 0, idx, glow, hit, ring, flash: 0 };
      hit.userData.d = d;
      s.hits.push(hit);
      s.d.push(d);
    }
    scene.add(s.lights);
    paintLights();

    // camera frames: the satellite band and the delegation's rings
    s.band = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x7fd4ff, transparent: true, opacity: 0.12, depthWrite: false }));
    s.band.rotation.x = -Math.PI / 2;
    s.band.position.y = 0.2;
    s.band.visible = false;
    s.bandEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1)), new THREE.LineBasicMaterial({ color: 0x9fe0ff }));
    s.bandEdge.rotation.x = -Math.PI / 2;
    s.bandEdge.position.y = 0.21;
    s.bandEdge.visible = false;
    scene.add(s.band, s.bandEdge);
    s.delegRings = [];
    for (let i = 0; i < 6; i++) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.3, 32), new THREE.MeshBasicMaterial({ color: 0xff5a4a, transparent: true, opacity: 0, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.22;
      scene.add(ring);
      s.delegRings.push(ring);
    }
  }

  function paintLights() {
    for (const d of s.d) {
      const w = d.warm;
      const flick = d.on && w < 1 ? (Math.random() < 0.5 ? 0.3 : 1) : 1;
      for (const i of d.idx) {
        if (d.def.id === 'res') s.col.setHex(0xfff6e8);
        else s.col.setRGB(0.08 + 0.92 * w * flick, 0.08 + 0.78 * w * flick, 0.1 + 0.45 * w * flick);
        s.lights.setColorAt(i, s.col);
      }
      d.glow.material.opacity = w * (d.def.capital ? 0.85 : 0.6);
    }
    s.lights.instanceColor.needsUpdate = true;
  }

  // ------------------------------------------------------------------ nights
  async function runNight(i) {
    const { layer, scope } = s.ctx;
    s.night = i;
    const N = NIGHTS[i];
    for (const d of s.d) if (!d.def.locked) d.on = false;
    const m = memo(layer, { no: TEXT.memoNo(i), to: 'Comrade Grid Operator', from: TEXT.dept, subject: `${N.title}: ${N.budget} megawatts`, body: N.memo, stamp: 'NIGHT SHIFT', buttons: [{ label: 'TAKE THE SWITCHBOARD', value: true, variant: 'red' }] });
    await m.done;
    if (scope.disposed) return;
    s.t = 0;
    s.events = N.events.map((def) => ({ def, started: false, done: false, samples: [] }));
    s.ui.photos?.replaceChildren();
    s.phase = 'play';
    renderHud();
  }

  function tick(dt) {
    const N = NIGHTS[s.night];
    s.t += dt;
    for (const d of s.d) {
      d.warm = d.on ? Math.min(1, d.warm + dt / WARM_UP) : Math.max(0, d.warm - dt * 6);
      d.flash = Math.max(0, d.flash - dt);
    }
    if (s.dev.auto) autoPilot();
    // cameras
    s.sampleT -= dt;
    const take = s.sampleT <= 0;
    if (take) s.sampleT = SAMPLE;
    for (const ev of s.events) {
      const e = ev.def;
      if (!ev.started && s.t >= e.at) {
        ev.started = true;
        s.ctx.audio.ratchet();
        if (e.type === 'sat') toast(s.ctx.layer, TEXT.satIncoming, 2000);
        else toast(s.ctx.layer, `${e.name}.`, 2600);
      }
      if (ev.started && !ev.done) {
        if (take) {
          const inFrame = s.d.filter((d) => inside(ev, d.def));
          if (inFrame.length) {
            let lit = 0;
            let all = 0;
            for (const d of inFrame) {
              const w = d.def.capital ? 2 : 1;
              all += w;
              lit += w * d.warm;
            }
            ev.samples.push(lit / all);
          }
        }
        if (s.t >= e.at + e.dur) closeEvent(ev);
      }
    }
    if (s.t >= N.length && s.events.every((ev) => ev.done)) endNight();
    paintLights();
    renderHud();
  }

  /** Where a camera's frame is right now, and whether a district is in it. */
  function frameOf(ev) {
    const e = ev.def;
    const u = THREE.MathUtils.clamp((s.t - e.at) / e.dur, 0, 1);
    return { centre: e.from + (e.to - e.from) * u, u };
  }
  function inside(ev, def) {
    const e = ev.def;
    if (e.type === 'deleg') return e.ids.includes(def.id);
    const { centre } = frameOf(ev);
    const v = e.axis === 'z' ? def.z : def.x;
    return Math.abs(v - centre) <= e.width / 2;
  }

  function closeEvent(ev) {
    ev.done = true;
    const pct = ev.samples.length ? Math.round((ev.samples.reduce((a, b) => a + b, 0) / ev.samples.length) * 100) : 100;
    s.photos.push({ pct, kind: ev.def.type, night: s.night });
    s.ctx.audio.shutter();
    toast(s.ctx.layer, `Photograph ${s.photos.length}: ${pct}%. ${TEXT.photo(pct)}`, 2600);
    renderPhotos();
  }

  async function endNight() {
    const { layer, scope, audio } = s.ctx;
    s.phase = 'between';
    const mine = s.photos.filter((p) => p.night === s.night);
    const pct = Math.round(mine.reduce((a, p) => a + p.pct, 0) / Math.max(1, mine.length));
    audio.ding();
    const m = memo(layer, { no: `${TEXT.memoNo(s.night)}-R`, to: 'Comrade Grid Operator', from: TEXT.dept, subject: `${NIGHTS[s.night].title}: the photographs`, body: [TEXT.nightEnd(pct)], stamp: pct >= PASS_MARK ? 'BRILLIANT' : 'RETOUCHED', buttons: [{ label: s.night + 1 < NIGHTS.length ? 'THE NEXT NIGHT' : 'SEE THE PAPERS', value: true, variant: 'red' }] });
    m.node.classList.add('lc-side');
    await m.done;
    if (scope.disposed) return;
    if (s.night + 1 < NIGHTS.length) runNight(s.night + 1);
    else finish();
  }

  async function finish() {
    const { layer, save, audio, scope, manager } = s.ctx;
    s.phase = 'end';
    const avg = Math.round(s.photos.reduce((a, p) => a + p.pct, 0) / Math.max(1, s.photos.length));
    const good = avg >= PASS_MARK;
    const label = `Photographs at ${avg}% brightness`;
    if (good) {
      save.awardMedal(GAME_ID, { avg, photos: s.photos.length });
      save.recordSuccess(GAME_ID, label);
    } else save.recordFailure(GAME_ID, label);
    // the front-page photograph: the capital, everything it can have
    for (const d of s.d) {
      d.on = Boolean(d.def.capital);
      d.warm = d.on ? 1 : 0;
    }
    paintLights();
    s.band.visible = s.bandEdge.visible = false;
    await new Promise((r) => setTimeout(r, 120));
    if (scope.disposed) return;
    audio.fanfare();
    const photo = manager.snapshot();
    const r = { avg, photos: s.photos.length, switches: s.switches };
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

  // ------------------------------------------------------------------ switching
  function used() {
    return s.d.reduce((a, d) => a + (d.on ? d.def.mw : 0), 0);
  }

  function toggle(d) {
    const { layer, audio } = s.ctx;
    if (d.def.locked) return toast(layer, TEXT.locked, 1800);
    if (!d.on && used() + d.def.mw > NIGHTS[s.night].budget) {
      audio.stamp();
      d.flash = 0.5;
      return toast(layer, TEXT.noPower, 1600);
    }
    d.on = !d.on;
    s.switches++;
    audio.clack();
    renderHud();
  }

  /** Dev: light whatever is (or will shortly be) in a frame, best first, within budget. */
  function autoPilot() {
    const B = NIGHTS[s.night].budget;
    const want = new Map();
    for (const ev of s.events) {
      if (ev.done) continue;
      const soon = ev.def.at - s.t;
      if (soon > WARM_UP + 0.6) continue;
      const look = { ...ev, def: ev.def };
      const saveT = s.t;
      s.t = Math.max(s.t, ev.def.at) + WARM_UP;
      for (const d of s.d) if (inside(look, d.def) || inside(ev, d.def)) want.set(d, (want.get(d) || 0) + (d.def.capital ? 2 : 1));
      s.t = saveT;
    }
    for (const d of s.d) if (d.on && !d.def.locked && !want.has(d)) d.on = false;
    let left = B - used();
    for (const [d] of [...want.entries()].sort((a, b) => b[1] / Math.max(1, b[0].def.mw) - a[1] / Math.max(1, a[0].def.mw))) {
      if (!d.on && d.def.mw <= left) {
        d.on = true;
        left -= d.def.mw;
      }
    }
  }

  // ------------------------------------------------------------------ hover, frames, HUD
  function pickHover() {
    s.ray.setFromCamera(s.pointer, self.camera);
    const hit = s.ray.intersectObjects(s.hits, false)[0];
    setHover(hit ? hit.object.userData.d : null);
  }

  function setHover(d) {
    s.hover = d;
    s.ctx.renderer.domElement.style.cursor = d ? 'pointer' : '';
    const tip = s.ui.tip;
    if (!tip) return;
    if (!d) return tip.classList.remove('show');
    tip.replaceChildren(el('b', {}, d.def.name), el('span', {}, d.def.locked ? 'always on · off the meter' : `${d.def.mw} MW · ${d.on ? 'ON' : 'OFF'}`));
    tip.style.left = `${s.pointerPx.x + 16}px`;
    tip.style.top = `${s.pointerPx.y + 12}px`;
    tip.classList.add('show');
  }

  function animate(dt, time) {
    for (const d of s.d) {
      const hov = d === s.hover;
      d.ring.material.opacity = hov ? 0.9 : d.flash > 0 ? 0.9 : d.on && !d.def.locked ? 0.35 : 0;
      d.ring.material.color.setHex(d.flash > 0 ? 0xff4a3a : 0xffe08a);
    }
    // camera frames, and a warning of the ones about to begin
    let band = null;
    let rings = 0;
    for (const ev of s.events) {
      const e = ev.def;
      const soon = e.at - s.t;
      const live = ev.started && !ev.done;
      if (!live && !(soon > 0 && soon < 4)) continue;
      if (e.type === 'sat' && !band) band = { ev, live };
      if (e.type === 'deleg') {
        for (const id of e.ids) {
          const ring = s.delegRings[rings++];
          if (!ring) break;
          const def = DISTRICTS.find((x) => x.id === id);
          ring.position.x = def.x;
          ring.position.z = def.z;
          ring.material.opacity = live ? 0.85 : 0.3 + Math.sin(time * 10) * 0.25;
          ring.scale.setScalar(def.capital ? 0.6 : 1);
        }
      }
    }
    for (let i = rings; i < s.delegRings.length; i++) s.delegRings[i].material.opacity = 0;
    if (band && s.phase === 'play') {
      const e = band.ev.def;
      const c = band.live ? frameOf(band.ev).centre : e.from;
      const big = 40;
      if (e.axis === 'z') {
        s.band.scale.set(big, e.width, 1);
        s.band.position.set(0, 0.2, c);
      } else {
        s.band.scale.set(e.width, big, 1);
        s.band.position.set(c, 0.2, 0);
      }
      s.bandEdge.scale.copy(s.band.scale);
      s.bandEdge.position.set(s.band.position.x, 0.21, s.band.position.z);
      s.band.material.opacity = band.live ? 0.14 : 0.05 + Math.abs(Math.sin(time * 6)) * 0.05;
      s.band.visible = s.bandEdge.visible = true;
    } else s.band.visible = s.bandEdge.visible = false;
  }

  function buildHud(layer) {
    const night = el('div.lc-num', {}, '');
    const clock = el('div.lc-info', {}, '');
    const power = el('div.lc-num', {}, '');
    const meter = el('div.lc-fill', {}, '');
    const last = el('div.lc-num', {}, '—');
    const board = el('div.lc-board', {}, [
      el('div.lc-cell', {}, [el('div.lc-lab', {}, 'Night'), night, clock]),
      el('div.lc-cell.lc-wide', {}, [el('div.lc-lab', {}, 'Power in use'), power, el('div.lc-meter', {}, [meter])]),
      el('div.lc-cell', {}, [el('div.lc-lab', {}, 'Last photograph'), last]),
    ]);
    const sched = el('ol.lc-sched', {}, []);
    const side = el('aside.lc-panel', {}, [el('div.lc-lab', {}, 'Cameras tonight'), sched]);
    const photos = el('div.lc-photos', {}, []);
    const tip = el('div.lc-tip', {}, '');
    const hint = el('div.lc-hint', {}, 'Click a district to switch it on or off. Light what the camera sees.');
    const back = el('div.corner-actions', {}, [button('← RETURN TO LOBBY', () => s.ctx.goTo('hub'), { variant: 'dark' })]);
    const root = el('div.lc-hud', {}, [board, side, photos, hint, tip, back]);
    layer.append(root);
    s.ui = { root, night, clock, power, meter, last, sched, photos, tip };
  }

  function renderHud() {
    const u = s.ui;
    if (!u.root) return;
    const N = NIGHTS[s.night];
    u.night.textContent = `${s.night + 1}/${NIGHTS.length}`;
    const left = Math.max(0, Math.ceil(N.length - s.t));
    u.clock.textContent = `dawn in ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    const use = used();
    u.power.textContent = `${use}/${N.budget} MW`;
    u.meter.style.width = `${(use / N.budget) * 100}%`;
    u.meter.classList.toggle('full', use >= N.budget);
    const rows = s.events
      .filter((ev) => !ev.done)
      .slice(0, 4)
      .map((ev) => {
        const e = ev.def;
        const live = ev.started;
        const when = live ? 'NOW' : `in ${Math.ceil(e.at - s.t)}s`;
        const what = e.type === 'sat' ? `Satellite pass, ${e.axis === 'z' ? (e.to > e.from ? 'north to south' : 'south to north') : e.to > e.from ? 'west to east' : 'east to west'}` : e.name;
        return el(`li${live ? '.live' : ''}`, {}, [el('b', {}, when), ` ${what}`]);
      });
    u.sched.replaceChildren(...rows);
  }

  function renderPhotos() {
    const u = s.ui;
    if (!u.root) return;
    const p = s.photos[s.photos.length - 1];
    u.last.textContent = `${p.pct}%`;
    u.last.classList.toggle('dim', p.pct < PASS_MARK);
    u.photos.append(el(`div.lc-photo${p.pct < PASS_MARK ? '.dim' : ''}`, {}, [el('span', {}, p.kind === 'sat' ? '🛰' : '📷'), el('b', {}, `${p.pct}%`)]));
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
