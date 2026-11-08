// SPARROW CAMPAIGN · China wing, game 3. A rooftop shooter.
// Day One: shoot sparrows against a quota the loudspeakers keep raising.
// Day Two: locusts. The rifle is no help. Nobody mentions it.
import * as THREE from 'three';
import './sparrow.css';
import { fontsReady } from '../../shared/fonts.js';
import { el, button, memo } from '../../shared/ui.js';
import { showNewspaper } from '../../shared/newspaper.js';
import { LEVELS, TEXT, NEWSPAPER } from './levels.js';
import { makeMaterials, buildWorld, makeBirdKit, makeLocusts, makeRifle } from './world.js';

const GAME_ID = 'sparrow-campaign';
const CAM_POS = new THREE.Vector3(0, 6.2, 11);
const fill = (str, vars) => str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

export default function createSparrowCampaign() {
  const s = {
    ctx: null,
    m: null,
    refs: null,
    kit: null,
    birds: [],
    feathers: [],
    level: null,
    levelIndex: 0,
    phase: 'idle',
    paused: false,
    t: 0,
    tally: 0,
    quota: 0,
    raised: 0,
    nextFlock: 0,
    ammo: 5,
    boltT: 0,
    reloadT: 0,
    recoil: 0,
    harvest: 100,
    potT: 0.5,
    chirpT: 1,
    pointer: new THREE.Vector2(0, 0),
    aim: new THREE.Vector2(0, 0),
    ray: new THREE.Raycaster(),
    rifle: null,
    locusts: null,
    results: { n: 0, q: 0, met: false },
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
      scene.background = new THREE.Color(0xd9c3a0);
      scene.fog = new THREE.Fog(0xd9c3a0, 60, 230);
      const camera = new THREE.PerspectiveCamera(55, 1, 0.05, 400);
      camera.position.copy(CAM_POS);
      scene.add(camera); // the rifle rides on the camera
      self.scene = scene;
      self.camera = camera;

      s.m = makeMaterials();
      s.refs = buildWorld(scene, s.m);
      s.kit = makeBirdKit(s.m);
      s.rifle = makeRifle(s.m);
      camera.add(s.rifle);
      s.locusts = makeLocusts();
      scene.add(s.locusts);
      aimCamera(0);

      buildHud(layer);
      const canvas = ctx.renderer.domElement;
      canvas.style.cursor = 'none';
      scope.add(() => (canvas.style.cursor = ''));
      scope.on(canvas, 'pointermove', (e) => {
        const r = canvas.getBoundingClientRect();
        s.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        s.ui.cross.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      });
      scope.on(canvas, 'pointerdown', (e) => {
        if (e.button === 0) fire();
      });
      scope.on(window, 'keydown', (e) => {
        if (e.key.toLowerCase() === 'r') reload();
        if (e.key === 'Escape' && !document.querySelector('.memo-wrap')) ctx.goTo('hub');
      });
    },

    async start() {
      await runLevel(0);
    },

    update(dt, time) {
      if (!s.refs) return;
      aimCamera(dt);
      animateNeighbours(dt, time);
      updateRifle(dt);
      updateBirds(dt, time);
      updateFeathers(dt);
      if (s.phase === 'play' && !s.paused) tickLevel(dt);
      updateLocusts(dt, time);
    },

    dispose() {
      s.birds = [];
      s.feathers = [];
      s.refs = null;
      s.ctx = null;
      s.ui = {};
    },
  };

  // ------------------------------------------------------------------ levels
  async function runLevel(i) {
    const { layer, scope } = s.ctx;
    s.levelIndex = i;
    s.level = LEVELS[i];
    const L = s.level;
    const m = memo(layer, { no: L.memo.no, to: 'Comrade Marksman', from: TEXT.dept, subject: L.memo.subject, body: L.memo.body, buttons: [{ label: L.memo.button, value: true, variant: 'red' }] });
    await m.done;
    if (scope.disposed) return;
    s.ctx.audio.unlock();
    s.t = 0;
    s.tally = 0;
    s.quota = L.quota;
    s.raised = 0;
    s.nextFlock = L.flocks?.first ?? 1e9;
    s.ammo = L.rifle.clip;
    s.harvest = L.harvest.start;
    s.phase = 'play';
    s.ui.board.classList.toggle('locusts', L.locusts);
    s.ui.title.textContent = L.title;
    if (L.locusts) s.ctx.audio.loop('swarm', 'swarm', 0.02);
    renderHud();
  }

  function tickLevel(dt) {
    const L = s.level;
    s.t += dt;
    // the loudspeakers
    const next = L.raises[s.raised];
    if (next && s.t >= next.at) {
      s.raised++;
      s.quota = next.quota;
      announce(next.text);
    }
    // flocks
    if (L.flocks && s.t >= s.nextFlock && s.t < L.seconds - 4) {
      spawnFlock(L.flocks.min + Math.floor(Math.random() * (L.flocks.max - L.flocks.min + 1)));
      s.nextFlock = s.t + L.flocks.every * (0.7 + Math.random() * 0.6);
    }
    // the harvest forecast drifts; on Day Two it simply goes
    const k = Math.min(1, s.t / L.seconds);
    s.harvest = THREE.MathUtils.lerp(L.harvest.start, L.harvest.end, L.locusts ? k * k * (3 - 2 * k) : k);
    if (L.locusts) {
      const n = Math.floor(s.locusts.userData.count * Math.min(1, k * 1.4));
      s.locusts.geometry.setDrawRange(0, n);
      s.ctx.audio.loop('swarm', 'swarm', 0.02); // no-op once running
      s.refs.fieldMat.color.setRGB(1 - k * 0.55, 1 - k * 0.6, 1 - k * 0.7);
    }
    renderHud();
    if (s.t >= L.seconds) endLevel();
  }

  async function endLevel() {
    const { layer, scope } = s.ctx;
    s.phase = 'between';
    if (!s.level.locusts) {
      const met = s.tally >= s.quota;
      s.results = { n: s.tally, q: s.quota, met };
      const m = memo(layer, {
        no: TEXT.report.no,
        to: 'Comrade Marksman',
        from: TEXT.dept,
        subject: TEXT.report.subject,
        body: met ? TEXT.report.met(s.tally, s.quota) : TEXT.report.missed(s.tally, s.quota),
        stamp: met ? 'QUOTA MET' : 'FIGURES PENDING',
        buttons: [{ label: TEXT.report.button, value: true, variant: 'red' }],
      });
      await m.done;
      if (scope.disposed) return;
      // the survivors leave
      for (const b of s.birds) if (b.alive) b.vel.x *= 3;
      await runLevel(s.levelIndex + 1);
      return;
    }
    // Day Two ends without comment.
    finish();
  }

  async function finish() {
    const { layer, save, audio, scope, manager } = s.ctx;
    s.phase = 'end';
    const { n, q, met } = s.results;
    const harvest = Math.round(s.harvest);
    audio.stopLoop('swarm');
    if (met) {
      save.awardMedal(GAME_ID, { sparrows: n, quota: q, harvest });
      save.recordSuccess(GAME_ID, `Sparrows: ${n} of ${q}`);
    } else save.recordFailure(GAME_ID, `Sparrows: ${n} of ${q}`);
    audio.fanfare();
    const photo = manager.snapshot();
    const np = showNewspaper(layer, {
      headline: met ? NEWSPAPER.headline : NEWSPAPER.missedHeadline,
      deck: NEWSPAPER.deck,
      photo,
      caption: 'The skies over the commune, as of this morning.',
      columns: NEWSPAPER.columns.map((c) => fill(c, { n })),
      sidebar: NEWSPAPER.sidebar(n, harvest),
      closeLabel: 'RETURN TO THE BUREAU',
    });
    np.node.classList.add('sc-paper');
    await np.done;
    if (!scope.disposed) s.ctx.goTo('hub');
  }

  function announce(text) {
    const a = s.ui.announce;
    s.ctx.audio.ding();
    a.textContent = text;
    a.classList.remove('show');
    void a.offsetWidth;
    a.classList.add('show');
  }

  // ------------------------------------------------------------------ aiming and the rifle
  function aimCamera(dt) {
    const k = dt ? Math.min(1, dt * 4) : 1;
    s.aim.x += (s.pointer.x - s.aim.x) * k;
    s.aim.y += (s.pointer.y - s.aim.y) * k;
    const yaw = -s.aim.x * 0.32;
    const pitch = 0.04 + s.aim.y * 0.2;
    const cam = self.camera;
    cam.position.copy(CAM_POS);
    cam.rotation.set(pitch, yaw, 0, 'YXZ');
  }

  function canFire() {
    return (s.phase === 'play' || s.phase === 'between') && !s.paused && s.ammo > 0 && s.boltT <= 0 && s.reloadT <= 0 && !document.querySelector('.memo-wrap');
  }

  function fire() {
    const { audio } = s.ctx;
    if (s.phase !== 'play' || s.paused || document.querySelector('.memo-wrap')) return;
    if (s.ammo <= 0) {
      audio.click();
      return reload();
    }
    if (!canFire()) return;
    s.ammo -= 1;
    s.boltT = s.level.rifle.bolt;
    s.recoil = 1;
    audio.shot();
    s.ctx.scope.timeout(() => s.ctx?.audio.bolt(), 260);
    s.rifle.userData.flash.material.opacity = 1;

    self.camera.updateMatrixWorld();
    s.ray.setFromCamera(s.pointer, self.camera);
    const o = s.ray.ray.origin;
    const d = s.ray.ray.direction;
    const flagHit = s.ray.intersectObjects(s.refs.flags, false)[0];
    let best = null;
    let bestT = Infinity;
    const tmp = new THREE.Vector3();
    for (const b of s.birds) {
      if (!b.alive) continue;
      tmp.subVectors(b.g.position, o);
      const t = tmp.dot(d);
      if (t <= 0) continue;
      const perp = tmp.addScaledVector(d, -t).length();
      if (perp < 0.7 + t * 0.016 && t < bestT) {
        best = b;
        bestT = t;
      }
    }
    if (flagHit && flagHit.distance < bestT) return hitFlag();
    if (best) kill(best, d);
    // everything near the shot darts away
    const near = o.clone().addScaledVector(d, best ? bestT : 30);
    for (const b of s.birds) {
      if (!b.alive) continue;
      const away = b.g.position.clone().sub(near);
      const dist = away.length();
      if (dist < 12) b.vel.addScaledVector(away.normalize(), (12 - dist) * 1.1).setY(Math.abs(b.vel.y) + 2);
    }
    if (s.ammo === 0) s.ctx.scope.timeout(() => reload(), 450);
    renderHud();
  }

  function reload() {
    if (s.reloadT > 0 || s.ammo === s.level.rifle.clip || s.phase === 'end') return;
    s.reloadT = s.level.rifle.reload;
    s.ctx.audio.bolt();
    renderHud();
  }

  async function hitFlag() {
    const { layer, audio, scope } = s.ctx;
    audio.stamp();
    s.paused = true;
    renderHud();
    const m = memo(layer, { no: TEXT.flagMemo.no, to: 'Comrade Marksman', from: TEXT.dept, subject: TEXT.flagMemo.subject, body: TEXT.flagMemo.body, stamp: 'REPRIMAND', buttons: [{ label: TEXT.flagMemo.button, value: true }] });
    await m.done;
    if (scope.disposed) return;
    s.paused = false;
    if (s.ammo === 0) reload();
  }

  function updateRifle(dt) {
    const L = s.level;
    s.boltT = Math.max(0, s.boltT - dt);
    if (s.reloadT > 0 && !s.paused) {
      s.reloadT -= dt;
      if (s.reloadT <= 0) {
        s.ammo = L.rifle.clip;
        s.ctx.audio.bolt();
        renderHud();
      }
    }
    s.recoil = Math.max(0, s.recoil - dt * 6);
    const g = s.rifle;
    const reloadK = s.reloadT > 0 ? Math.sin(Math.min(1, 1 - s.reloadT / L.rifle.reload) * Math.PI) : 0;
    // the rifle points roughly where you aim
    g.rotation.set(0.04 + s.recoil * 0.25 + reloadK * 0.6 + (s.pointer.y - s.aim.y) * 0.8, 0.08 - (s.pointer.x - s.aim.x) * 0.8, reloadK * 0.5);
    g.position.set(0.42, -0.42 - reloadK * 0.25, -0.6 + s.recoil * 0.12);
    const f = g.userData.flash.material;
    f.opacity = Math.max(0, f.opacity - dt * 14);
  }

  // ------------------------------------------------------------------ birds
  function spawnFlock(n) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const base = new THREE.Vector3(side * 46, 7 + Math.random() * 7, -8 - Math.random() * 26);
    const speed = 7 + Math.random() * 3;
    for (let i = 0; i < n; i++) {
      const g = s.kit.make();
      g.position.copy(base).add(new THREE.Vector3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 4));
      self.scene.add(g);
      s.birds.push({
        g,
        alive: true,
        vel: new THREE.Vector3(-side * speed, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 2),
        phase: Math.random() * 10,
        cruise: speed,
        dir: -side,
        spin: 0,
      });
    }
  }

  function updateBirds(dt, time) {
    for (const b of s.birds) {
      const p = b.g.position;
      if (b.alive) {
        // wander, keep the cruising direction, stay airborne: the pots and flags see to that
        b.vel.x += (b.dir * b.cruise - b.vel.x) * dt * 0.8;
        b.vel.y += Math.sin(time * 3 + b.phase) * dt * 6 + (p.y < 6 ? 6 : p.y > 17 ? -6 : 0) * dt;
        b.vel.z += Math.cos(time * 2.3 + b.phase) * dt * 4 + (p.z > -4 ? -4 : p.z < -40 ? 4 : 0) * dt;
        b.vel.y *= 1 - dt * 0.8;
        b.vel.z *= 1 - dt * 0.6;
        p.addScaledVector(b.vel, dt);
        b.g.rotation.set(0, Math.atan2(-b.vel.z, b.vel.x), Math.atan2(b.vel.y, Math.abs(b.vel.x)) * 0.6);
        const flap = Math.sin(time * 26 + b.phase) * 0.9;
        b.g.userData.wings[0].rotation.x = flap;
        b.g.userData.wings[1].rotation.x = flap;
        if (Math.abs(p.x) > 52) b.gone = true;
      } else {
        b.vel.y -= 14 * dt;
        p.addScaledVector(b.vel, dt);
        b.g.rotation.x += b.spin * dt;
        b.g.rotation.z += b.spin * 0.7 * dt;
        if (p.y < -1) b.gone = true;
      }
    }
    // tidy up
    if (s.birds.some((b) => b.gone)) {
      for (const b of s.birds) if (b.gone) self.scene.remove(b.g); // geometry and materials are shared
      s.birds = s.birds.filter((b) => !b.gone);
    }
    // the occasional remark from a sparrow
    s.chirpT -= dt;
    if (s.chirpT <= 0 && s.birds.some((b) => b.alive)) {
      s.ctx.audio.chirp();
      s.chirpT = 0.3 + Math.random() * 1.2;
    }
  }

  function kill(b, dir) {
    b.alive = false;
    b.vel.set(dir.x * 3, 2, dir.z * 3);
    b.spin = 8 + Math.random() * 6;
    b.g.userData.wings.forEach((w) => (w.rotation.x = 1.2));
    s.tally += 1;
    s.ctx.audio.clack();
    puff(b.g.position);
    s.ui.tally.classList.remove('bump');
    void s.ui.tally.offsetWidth;
    s.ui.tally.classList.add('bump');
  }

  function puff(at) {
    const n = 14;
    const pos = new Float32Array(n * 3);
    const vel = [];
    for (let i = 0; i < n; i++) {
      pos.set([at.x, at.y, at.z], i * 3);
      vel.push(new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3));
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x8a6a4a, size: 0.12, transparent: true, opacity: 1, depthWrite: false }));
    self.scene.add(pts);
    s.feathers.push({ pts, vel, life: 1.4 });
  }

  function updateFeathers(dt) {
    for (const f of s.feathers) {
      f.life -= dt;
      const a = f.pts.geometry.attributes.position;
      f.vel.forEach((v, i) => {
        v.y -= dt * 1.5;
        v.multiplyScalar(1 - dt * 1.2);
        a.setXYZ(i, a.getX(i) + v.x * dt, a.getY(i) + v.y * dt, a.getZ(i) + v.z * dt);
      });
      a.needsUpdate = true;
      f.pts.material.opacity = Math.max(0, f.life / 1.4);
      if (f.life <= 0) {
        self.scene.remove(f.pts);
        f.pts.geometry.dispose();
        f.pts.material.dispose();
      }
    }
    s.feathers = s.feathers.filter((f) => f.life > 0);
  }

  function updateLocusts(dt, time) {
    const pts = s.locusts;
    const n = pts.geometry.drawRange.count;
    if (!n || !isFinite(n)) return;
    const a = pts.geometry.attributes.position;
    const seed = pts.userData.seed;
    for (let i = 0; i < Math.min(n, a.count); i++) {
      const sd = seed[i];
      a.setXYZ(i, a.getX(i) + Math.sin(time * 2 + sd) * dt * 3 + dt * 1.5, a.getY(i) + Math.cos(time * 3 + sd) * dt * 1.2, a.getZ(i) + Math.sin(time * 1.7 + sd * 2) * dt * 2);
      if (a.getX(i) > 60) a.setX(i, -60);
    }
    a.needsUpdate = true;
  }

  // ------------------------------------------------------------------ the neighbours
  function animateNeighbours(dt, time) {
    for (const nb of s.refs.neighbours) {
      if (nb.kind === 'flag') {
        nb.arm.rotation.z = Math.sin(time * 2.2 + nb.phase) * 0.45;
        const geo = nb.flag.geometry;
        const p = geo.attributes.position;
        const base = nb.flag.userData.base;
        for (let i = 0; i < p.count; i++) {
          const x = base[i * 3];
          p.setZ(i, Math.sin(time * 6 + x * 3 + nb.phase) * 0.12 * x);
        }
        p.needsUpdate = true;
      } else {
        nb.arm.rotation.x = -0.6 + Math.abs(Math.sin(time * 5 + nb.phase)) * -0.9;
      }
    }
    if (s.phase === 'play' && !s.level.locusts) {
      s.potT -= dt;
      if (s.potT <= 0) {
        s.ctx.audio.pot();
        s.potT = 0.25 + Math.random() * 0.7;
      }
    }
  }

  // ------------------------------------------------------------------ HUD
  function buildHud(layer) {
    s.ui.title = el('div.dept-title', {}, TEXT.title);
    s.ui.tally = el('div.sc-num', {}, '0');
    s.ui.quota = el('div.sc-num', {}, '0');
    s.ui.time = el('div.sc-num.sc-time', {}, '0:00');
    s.ui.board = el('div.sc-board', {}, [
      el('div.sc-cell', {}, [el('div.sc-lab.sc-lab-tally', {}, TEXT.tally), s.ui.tally]),
      el('div.sc-cell', {}, [el('div.sc-lab.sc-lab-quota', {}, TEXT.quota), s.ui.quota]),
      el('div.sc-cell', {}, [el('div.sc-lab', {}, TEXT.time), s.ui.time]),
    ]);
    s.ui.announce = el('div.sc-announce', { role: 'status' });
    s.ui.harvestFill = el('div.sc-hfill');
    s.ui.harvestNum = el('span', {}, '');
    s.ui.harvest = el('div.sc-harvest', {}, [el('div.sc-lab', {}, [TEXT.harvest, ' · ', s.ui.harvestNum]), el('div.sc-hbar', {}, s.ui.harvestFill)]);
    s.ui.rounds = el('div.sc-rounds');
    s.ui.reload = el('div.sc-reload', {}, TEXT.reload);
    s.ui.ammo = el('div.sc-ammo', {}, [s.ui.rounds, s.ui.reload]);
    s.ui.cross = el('div.sc-cross', { 'aria-hidden': 'true' });
    layer.append(
      el('div.dept-banner', {}, [el('div.dept-kicker', {}, TEXT.dept), s.ui.title]),
      el('div.corner-actions', {}, [button('← RETURN TO BUREAU', () => s.ctx.goTo('hub'), { variant: 'dark' })]),
      s.ui.board,
      s.ui.announce,
      s.ui.harvest,
      s.ui.ammo,
      s.ui.cross,
    );
  }

  function renderHud() {
    const L = s.level;
    if (!L) return;
    if (L.locusts) {
      s.ui.board.querySelector('.sc-lab-tally').textContent = TEXT.locustTally;
      s.ui.tally.textContent = '∞';
      s.ui.board.querySelector('.sc-lab-quota').textContent = TEXT.quota;
      s.ui.quota.textContent = TEXT.locustQuota;
    } else {
      s.ui.tally.textContent = String(s.tally);
      s.ui.quota.textContent = String(s.quota);
      s.ui.board.classList.toggle('met', s.tally >= s.quota);
    }
    const left = Math.max(0, Math.ceil(L.seconds - s.t));
    s.ui.time.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    s.ui.harvestFill.style.width = `${s.harvest}%`;
    s.ui.harvestFill.classList.toggle('low', s.harvest < 40);
    s.ui.harvestNum.textContent = `${Math.round(s.harvest)}%`;
    if (s.ui.shownAmmo !== s.ammo) {
      s.ui.shownAmmo = s.ammo;
      s.ui.rounds.replaceChildren(...Array.from({ length: L.rifle.clip }, (_, i) => el(`span.sc-round${i < s.ammo ? '' : '.spent'}`)));
    }
    s.ui.reload.textContent = s.reloadT > 0 ? TEXT.reloading : TEXT.reload;
    s.ui.reload.classList.toggle('active', s.reloadT > 0 || s.ammo === 0);
  }

  // Dev only: jump to the last second of the current day.
  if (import.meta.env.DEV) self.__dev = { skip: () => (s.t = s.level.seconds - 1), state: () => ({ phase: s.phase, tally: s.tally, quota: s.quota, harvest: s.harvest }) };

  return self;
}
