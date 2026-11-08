// BACKYARD FURNACE · China wing, game 1.
// Drag household iron into the furnace; lumpy pig iron comes out of the spout.
// The quota rises each week. The farm tools are also made of iron.
import * as THREE from 'three';
import './furnace.css';
import { fontsReady } from '../../shared/fonts.js';
import { el, button, memo } from '../../shared/ui.js';
import { showNewspaper } from '../../shared/newspaper.js';
import { WEEKS, FURNACE, TEXT, NEWSPAPER } from './levels.js';
import { makeMaterials, buildWorld, makeItem, makeIngot, makeSparks, makeSmoke, FURNACE_POS, MOUTH_Y, PILE, HEAP, WOODPILE } from './world.js';

const GAME_ID = 'backyard-furnace';
const CAM_POS = new THREE.Vector3(0, 9.6, 12.4);
const CAM_LOOK = new THREE.Vector3(0, 1.0, -1.2);
const DRAG_Y = 3.3;
const MOUTH_R = 1.5;
const HARVEST_START = 92;
const fill = (str, vars) => str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

export default function createBackyardFurnace() {
  const s = {
    ctx: null,
    m: null,
    refs: null,
    items: [],
    ingots: [],
    pileCount: 0,
    week: null,
    weekIndex: 0,
    phase: 'idle',
    t: 0,
    output: 0,
    quota: 0,
    raised: 0,
    heat: FURNACE.heatStart,
    harvest: HARVEST_START,
    total: 0,
    results: [],
    drag: null,
    hover: null,
    pointer: new THREE.Vector2(),
    client: { x: 0, y: 0 },
    ray: new THREE.Raycaster(),
    plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -DRAG_Y),
    mouthPlane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -MOUTH_Y),
    sparks: null,
    smoke: null,
    roofSag: 0,
    gradeN: 0,
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
      scene.background = new THREE.Color(0x3a2a24);
      scene.fog = new THREE.Fog(0x6a4a40, 40, 150);
      const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 400);
      camera.position.copy(CAM_POS);
      camera.lookAt(CAM_LOOK);
      self.scene = scene;
      self.camera = camera;

      s.m = makeMaterials();
      s.refs = buildWorld(scene, s.m);
      s.sparks = makeSparks();
      scene.add(s.sparks);
      s.smoke = makeSmoke();
      scene.add(s.smoke);
      placeYardItems();

      buildHud(layer);
      const canvas = ctx.renderer.domElement;
      scope.add(() => (canvas.style.cursor = ''));
      scope.on(canvas, 'pointermove', onMove);
      scope.on(canvas, 'pointerdown', onDown);
      scope.on(window, 'pointerup', onUp);
      scope.on(window, 'keydown', (e) => {
        if (e.key === 'Escape' && !document.querySelector('.memo-wrap')) ctx.goTo('hub');
      });
    },

    async start() {
      s.ctx.audio.loop('furnace', 'fire', 0.05);
      await runWeek(0);
    },

    update(dt, time) {
      if (!s.refs) return;
      if (s.phase === 'play') tickWeek(dt);
      updateItems(dt);
      updateIngots(dt);
      updateFurnace(dt, time);
      updateSparks(dt);
      updateSmoke(dt);
      updateFloaters();
    },

    dispose() {
      s.ctx?.audio.stopLoop('furnace');
      s.items = [];
      s.ingots = [];
      s.refs = null;
      s.ctx = null;
      s.ui = {};
    },
  };

  // ------------------------------------------------------------------ weeks
  async function runWeek(i) {
    const { layer, scope } = s.ctx;
    s.weekIndex = i;
    s.week = WEEKS[i];
    const W = s.week;
    s.ui.title.textContent = W.title;
    const m = memo(layer, { no: W.memo.no, to: 'Comrade Householder', from: TEXT.dept, subject: W.memo.subject, body: W.memo.body, buttons: [{ label: W.memo.button, value: true, variant: 'red' }] });
    await m.done;
    if (scope.disposed) return;
    s.ctx.audio.unlock();
    s.ctx.audio.loop('furnace', 'fire', 0.05);
    s.t = 0;
    s.output = 0;
    s.quota = W.quota;
    s.raised = 0;
    s.heat = Math.max(s.heat, FURNACE.heatStart);
    deliver(W);
    s.phase = 'play';
    renderHud();
  }

  function tickWeek(dt) {
    const W = s.week;
    s.t += dt;
    const next = W.raises[s.raised];
    if (next && s.t >= next.at) {
      s.raised++;
      s.quota = next.quota;
      announce(next.text);
    }
    s.heat = Math.max(0, s.heat - FURNACE.heatDecay * dt);
    renderHud();
    if (s.t >= W.seconds) endWeek();
  }

  async function endWeek() {
    const { layer, scope } = s.ctx;
    s.phase = 'between';
    dropDrag();
    // anything still melting is counted: the spout is generous at the end of a week
    await new Promise((r) => scope.timeout(r, 400));
    const met = s.output >= s.quota;
    s.results.push({ n: Math.round(s.output), q: s.quota, met });
    const last = s.weekIndex === WEEKS.length - 1;
    const m = memo(layer, {
      no: TEXT.report.no(s.weekIndex),
      to: 'Comrade Householder',
      from: TEXT.dept,
      subject: TEXT.report.subject(s.week),
      body: met ? TEXT.report.met(Math.round(s.output), s.quota) : TEXT.report.missed(Math.round(s.output), s.quota),
      stamp: met ? 'QUOTA EXCEEDED' : 'PLEDGE RECORDED',
      buttons: [{ label: last ? 'END THE CAMPAIGN' : TEXT.report.button, value: true, variant: 'red' }],
    });
    await m.done;
    if (scope.disposed) return;
    if (!last) return runWeek(s.weekIndex + 1);
    const insp = memo(layer, { no: TEXT.inspector.no, to: 'Comrade Householder', from: TEXT.inspector.from, subject: TEXT.inspector.subject, body: TEXT.inspector.body(Math.round(s.total)), stamp: 'EXCELLENT', buttons: [{ label: TEXT.inspector.button, value: true, variant: 'red' }] });
    await insp.done;
    if (!scope.disposed) finish();
  }

  async function finish() {
    const { layer, save, audio, scope, manager } = s.ctx;
    s.phase = 'end';
    const final = s.results[s.results.length - 1];
    const n = Math.round(s.total);
    const harvest = Math.max(0, Math.round(s.harvest));
    const label = `Pig iron: ${n} jin · harvest ${harvest}%`;
    if (final.met) {
      save.awardMedal(GAME_ID, { jin: n, harvest });
      save.recordSuccess(GAME_ID, label);
    } else save.recordFailure(GAME_ID, label);
    audio.fanfare();
    // the photograph: the pile, proudly, and a little of the yard
    // the furnace is relit for the photographer, and a lamp is brought out
    s.heat = Math.max(s.heat, 80);
    s.refs.key.intensity = 2.6;
    s.refs.hemi.intensity = 1.3;
    self.camera.position.set(PILE.x + 2.4, 1.9, PILE.z + 4.2);
    self.camera.lookAt(PILE.x - 0.9, 0.7, PILE.z - 0.8);
    s.phase = 'paper';
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const photo = manager.snapshot();
    const np = showNewspaper(layer, {
      headline: final.met ? NEWSPAPER.headline : NEWSPAPER.missedHeadline,
      deck: NEWSPAPER.deck,
      photo,
      caption: NEWSPAPER.caption,
      columns: NEWSPAPER.columns.map((c) => fill(c, { n })),
      sidebar: NEWSPAPER.sidebar(n, harvest),
      closeLabel: 'RETURN TO THE BUREAU',
    });
    np.node.classList.add('bf-paper');
    await np.done;
    if (!scope.disposed) s.ctx.goTo('hub');
  }

  // ------------------------------------------------------------------ items
  /** The yard itself: trees, the door, the beams, the cart. Present from the start; usable when their week comes. */
  function placeYardItems() {
    const treeSlots = [...s.refs.slots.tree];
    for (let wi = 0; wi < WEEKS.length; wi++) {
      for (const def of WEEKS[wi].items) {
        if (!def.from) continue;
        for (let k = 0; k < def.count; k++) {
          const slot = def.from === 'tree' ? treeSlots.shift() : s.refs.slots[def.from];
          if (!slot) continue;
          const g = makeItem(def, s.m);
          g.position.copy(slot.pos);
          g.rotation.y = slot.rotY;
          self.scene.add(g);
          s.items.push({ g, def, week: wi, state: 'rest', vel: new THREE.Vector3(), from: def.from, ground: slot.pos.y });
        }
      }
    }
  }

  function deliver(W) {
    let delay = 0;
    for (const def of W.items) {
      if (def.from) continue;
      for (let k = 0; k < def.count; k++) {
        const g = makeItem(def, s.m);
        const area = def.heat ? WOODPILE : HEAP;
        const spot = freeSpot(area, g.userData.radius);
        g.position.set(spot.x, 7 + Math.random() * 2, spot.z);
        g.rotation.y = Math.random() * Math.PI * 2;
        g.visible = false;
        self.scene.add(g);
        const it = { g, def, week: s.weekIndex, state: 'arrive', delay, vel: new THREE.Vector3(), ground: 0 };
        s.items.push(it);
        delay += 0.08;
      }
    }
  }

  function freeSpot(area, radius) {
    let best = null;
    let bestD = -1;
    for (let tries = 0; tries < 40; tries++) {
      const x = THREE.MathUtils.lerp(area.x0 + radius * 0.5, area.x1 - radius * 0.5, Math.random());
      const z = THREE.MathUtils.lerp(area.z0 + radius * 0.5, area.z1 - radius * 0.5, Math.random());
      let d = Infinity;
      for (const it of s.items) {
        if (it.state === 'gone' || it.from) continue;
        const dx = it.g.position.x - x;
        const dz = it.g.position.z - z;
        d = Math.min(d, Math.hypot(dx, dz) - it.g.userData.radius - radius);
      }
      if (d > 0.15) return { x, z };
      if (d > bestD) {
        bestD = d;
        best = { x, z };
      }
    }
    return best;
  }

  function usable(it) {
    return it.week <= s.weekIndex && s.phase === 'play';
  }

  function updateItems(dt) {
    for (const it of s.items) {
      const g = it.g;
      if (it.state === 'arrive') {
        it.delay -= dt;
        if (it.delay > 0) continue;
        g.visible = true;
        it.state = 'fall';
      }
      if (it.state === 'fall') {
        it.vel.y -= 24 * dt;
        g.position.addScaledVector(it.vel, dt);
        it.vel.x *= 0.96;
        it.vel.z *= 0.96;
        if (g.position.y <= it.ground) {
          g.position.y = it.ground;
          if (Math.abs(it.vel.y) > 3) {
            it.vel.y *= -0.25;
            it.vel.x *= 0.5;
            it.vel.z *= 0.5;
            if (!it.def.heat) s.ctx.audio.clack();
          } else {
            it.vel.set(0, 0, 0);
            it.state = 'rest';
          }
        }
      } else if (it.state === 'drag') {
        const target = it.target;
        g.position.lerp(target, Math.min(1, dt * 18));
        const k = Math.min(1, dt * 10);
        g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, it.dragScale, k));
        g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, (target.x - g.position.x) * -0.4, k);
      } else if (it.state === 'feed') {
        it.ft += dt;
        const k = Math.min(1, it.ft / 0.45);
        g.position.lerpVectors(it.from0, it.mouth, k);
        g.position.y = THREE.MathUtils.lerp(it.from0.y, MOUTH_Y - 0.6, k * k);
        g.scale.setScalar(it.dragScale * (1 - k * 0.85));
        g.rotation.y += dt * 4;
        if (k >= 1) {
          g.visible = false;
          it.state = 'gone';
          swallow(it);
        }
      } else if (it.state === 'reject') {
        it.state = 'fall';
      }
    }
  }

  // ------------------------------------------------------------------ dragging
  function pick() {
    s.ray.setFromCamera(s.pointer, self.camera);
    const hits = [];
    for (const it of s.items) if (it.state === 'rest' && it.g.visible) hits.push(it.g.userData.hit);
    const h = s.ray.intersectObjects(hits, false)[0];
    if (!h) return null;
    return s.items.find((it) => it.g.userData.hit === h.object) || null;
  }

  function onMove(e) {
    const r = s.ctx.renderer.domElement.getBoundingClientRect();
    s.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    s.client = { x: e.clientX, y: e.clientY };
    if (s.drag) return moveDrag();
    const it = s.phase === 'play' && !document.querySelector('.memo-wrap') ? pick() : null;
    s.hover = it;
    const canvas = s.ctx.renderer.domElement;
    canvas.style.cursor = it ? (usable(it) ? 'grab' : 'not-allowed') : '';
    showTip(it ? (usable(it) ? TEXT.tip(it.def) : `${it.def.name} · not yet required`) : null);
  }

  function onDown(e) {
    if (e.button !== 0 || s.phase !== 'play' || document.querySelector('.memo-wrap')) return;
    onMove(e);
    const it = s.hover;
    if (!it || !usable(it)) return;
    s.ctx.audio.click();
    s.drag = it;
    it.state = 'drag';
    const size = Math.max(it.g.userData.radius * 2, it.g.userData.height);
    it.dragScale = Math.min(1, 1.5 / size);
    it.target = it.g.position.clone();
    it.g.rotation.x = 0;
    if (it.from === 'beams') sagRoof();
    it.from = null; // once lifted, part of the heap like anything else
    it.ground = 0;
    s.ctx.renderer.domElement.style.cursor = 'grabbing';
    moveDrag();
  }

  function moveDrag() {
    const it = s.drag;
    s.ray.setFromCamera(s.pointer, self.camera);
    const p = new THREE.Vector3();
    if (!s.ray.ray.intersectPlane(s.plane, p)) return;
    p.x = THREE.MathUtils.clamp(p.x, -12, 12);
    p.z = THREE.MathUtils.clamp(p.z, -9, 6);
    it.target.copy(p);
    it.target.y = DRAG_Y - it.g.userData.height * it.dragScale * 0.5;
    const over = pointerOverFurnace();
    s.refs.mouth.userData.over = over;
    if (over) it.target.set(FURNACE_POS.x, MOUTH_Y + 0.4 + it.g.userData.height * it.dragScale * 0.2, FURNACE_POS.z); // it hovers over the mouth
    showTip(over ? (it.def.heat ? `${it.def.name} · BURN` : `${it.def.name} · SMELT`) : TEXT.tip(it.def));
  }

  /** Is the pointer over the furnace? Generous: the mouth, or anywhere on the brickwork. */
  function pointerOverFurnace() {
    s.ray.setFromCamera(s.pointer, self.camera);
    const p = new THREE.Vector3();
    if (s.ray.ray.intersectPlane(s.mouthPlane, p) && Math.hypot(p.x - FURNACE_POS.x, p.z - FURNACE_POS.z) < MOUTH_R) return true;
    return s.ray.intersectObject(s.refs.furnace, true).length > 0;
  }

  function onUp() {
    const it = s.drag;
    if (!it) return;
    s.drag = null;
    s.refs.mouth.userData.over = false;
    s.ctx.renderer.domElement.style.cursor = '';
    showTip(null);
    if (s.phase === 'play' && pointerOverFurnace()) {
      it.state = 'feed';
      it.ft = 0;
      it.from0 = it.g.position.clone();
      it.mouth = new THREE.Vector3(FURNACE_POS.x, MOUTH_Y, FURNACE_POS.z);
      return;
    }
    putDown(it);
  }

  function putDown(it) {
    it.state = 'fall';
    it.vel.set(0, 0, 0);
    it.g.scale.setScalar(1);
    it.g.rotation.z = 0;
    // not on the furnace itself
    const d = Math.hypot(it.g.position.x - FURNACE_POS.x, it.g.position.z - FURNACE_POS.z);
    if (d < 1.9) {
      const a = Math.atan2(it.g.position.z - FURNACE_POS.z, it.g.position.x - FURNACE_POS.x);
      it.g.position.x = FURNACE_POS.x + Math.cos(a) * 2.1;
      it.g.position.z = FURNACE_POS.z + Math.sin(a) * 2.1;
    }
  }

  function dropDrag() {
    if (!s.drag) return;
    const it = s.drag;
    s.drag = null;
    s.refs.mouth.userData.over = false;
    showTip(null);
    putDown(it);
  }

  // ------------------------------------------------------------------ the furnace
  function swallow(it) {
    const { audio } = s.ctx;
    const def = it.def;
    if (def.harvest) s.harvest = Math.max(0, s.harvest - def.harvest);
    if (def.heat) {
      s.heat = Math.min(FURNACE.heatMax, s.heat + def.heat);
      audio.roar();
      burst(70, 1.4);
      puff(4);
      renderHud();
      return;
    }
    if (s.heat < 8) {
      // too cold: it comes back out, warm and offended
      audio.hiss();
      floater(TEXT.cold, it.mouth, 'cold');
      it.state = 'reject';
      it.g.visible = true;
      it.g.scale.setScalar(1);
      it.g.position.set(FURNACE_POS.x - 1.2, MOUTH_Y, FURNACE_POS.z + 1.6);
      it.vel.set(-2, 5, 2);
      if (def.harvest) s.harvest = Math.min(HARVEST_START, s.harvest + def.harvest);
      return;
    }
    s.heat = Math.max(0, s.heat - FURNACE.meltCost(def.jin));
    audio.clang();
    burst(30, 0.8);
    puff(2);
    renderHud();
    const weekAt = s.weekIndex;
    s.ctx.scope.timeout(() => pour(def, weekAt), FURNACE.meltTime * 1000);
  }

  function pour(def, weekAt) {
    if (!s.refs) return;
    const g = makeIngot(s.m, def.jin);
    const start = new THREE.Vector3(1.78, 0.48, -0.8);
    g.position.copy(start);
    self.scene.add(g);
    // a cone-shaped heap: each layer a little narrower
    const n = s.pileCount++;
    const layer = Math.floor(Math.sqrt(n / 3));
    const rad = Math.max(0.2, 1.5 - layer * 0.28) * Math.sqrt(Math.random());
    const a = Math.random() * Math.PI * 2;
    const dest = new THREE.Vector3(PILE.x + Math.cos(a) * rad, 0.12 + layer * 0.2, PILE.z + Math.sin(a) * rad);
    s.ingots.push({ g, start, dest, t: 0, cool: 0 });
    // counted as it leaves the spout
    if (weekAt === s.weekIndex && (s.phase === 'play' || s.phase === 'between')) s.output += def.jin;
    s.total += def.jin;
    s.ctx.audio.hiss();
    floater(`+${def.jin} ${TEXT.unit} · ${TEXT.grades[s.gradeN++ % TEXT.grades.length]}`, dest, def.harvest ? 'tool' : '');
    bump(s.ui.output);
    renderHud();
  }

  function updateIngots(dt) {
    for (const ig of s.ingots) {
      if (ig.t < 1) {
        ig.t = Math.min(1, ig.t + dt * 1.6);
        const k = ig.t;
        ig.g.position.lerpVectors(ig.start, ig.dest, k);
        ig.g.position.y += Math.sin(k * Math.PI) * 0.6;
        ig.g.rotation.y += dt * 3;
        if (ig.t === 1) s.ctx?.audio.clack();
      }
      if (ig.cool < 1) {
        ig.cool = Math.min(1, ig.cool + dt / 5);
        ig.g.material.emissiveIntensity = (1 - ig.cool) * (1 - ig.cool) * 1.2;
      }
    }
  }

  function sagRoof() {
    s.roofSag = 1;
  }

  function updateFurnace(dt, time) {
    const r = s.refs;
    const h = s.heat / FURNACE.heatMax;
    const flick = 0.85 + Math.sin(time * 13) * 0.08 + Math.sin(time * 31) * 0.06;
    r.fire.intensity = (6 + h * 44) * flick;
    r.spoutLight.intensity = (1 + h * 8) * flick;
    const c = new THREE.Color().setHSL(0.07 + h * 0.03, 1, 0.12 + h * 0.45);
    for (const g of r.glows) g.material.color.copy(c);
    if (r.mouth.userData.over) r.mouth.material.color.setHSL(0.11, 1, 0.75);
    // the bellows, worked harder when the fire is low
    const pump = Math.sin(time * (4 + (1 - h) * 5));
    r.bellows.scale.y = 1 + pump * 0.35;
    r.worker.userData.arms.rotation.x = 0.3 + pump * 0.35;
    // the distant furnaces breathe too
    r.distant.forEach((d, i) => d.scale.setScalar(0.8 + Math.sin(time * 3 + i) * 0.2));
    // the fields, browning as the tools go in
    const k = Math.max(0, s.harvest) / HARVEST_START;
    r.fieldMat.color.setRGB(0.45 + k * 0.55, 0.38 + k * 0.62, 0.3 + k * 0.7);
    // the roof, without its beams
    if (s.roofSag > 0) {
      s.roofSag = Math.max(0, s.roofSag - dt * 0.8);
      const sag = 1 - s.roofSag;
      r.roof.rotation.z = sag * 0.09;
      r.roof.position.y = 3.2 - sag * 0.55;
    }
    if (s.phase !== 'paper') {
      self.camera.position.copy(CAM_POS);
      self.camera.lookAt(CAM_LOOK);
    }
    // smoke is born at a rate set by the heat
    s.smokeT = (s.smokeT ?? 0) - dt;
    if (s.smokeT <= 0) {
      puff(1);
      s.smokeT = 0.35 + (1 - h) * 0.4;
    }
  }

  function burst(n, power) {
    const sp = s.sparks;
    const pos = sp.geometry.attributes.position;
    const { vel, life } = sp.userData;
    for (let k = 0; k < n; k++) {
      const i = sp.userData.next++ % life.length;
      pos.setXYZ(i, FURNACE_POS.x + (Math.random() - 0.5) * 0.8, MOUTH_Y + 0.1, FURNACE_POS.z + (Math.random() - 0.5) * 0.8);
      vel[i * 3] = (Math.random() - 0.5) * 3 * power;
      vel[i * 3 + 1] = (3 + Math.random() * 5) * power;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 3 * power;
      life[i] = 0.6 + Math.random() * 0.8;
    }
  }

  function updateSparks(dt) {
    const sp = s.sparks;
    const pos = sp.geometry.attributes.position;
    const { vel, life } = sp.userData;
    for (let i = 0; i < life.length; i++) {
      if (life[i] <= 0) {
        pos.setY(i, -50);
        continue;
      }
      life[i] -= dt;
      vel[i * 3 + 1] -= 6 * dt;
      pos.setXYZ(i, pos.getX(i) + vel[i * 3] * dt, pos.getY(i) + vel[i * 3 + 1] * dt, pos.getZ(i) + vel[i * 3 + 2] * dt);
    }
    pos.needsUpdate = true;
  }

  function puff(n) {
    const puffs = s.smoke.userData.puffs;
    for (let k = 0; k < n; k++) {
      const p = puffs.reduce((a, b) => (b.userData.life ?? 0) < (a.userData.life ?? 0) ? b : a);
      p.userData.life = 1;
      p.position.set(FURNACE_POS.x + (Math.random() - 0.5) * 0.5, MOUTH_Y + 0.3, FURNACE_POS.z + (Math.random() - 0.5) * 0.5);
      p.scale.setScalar(0.4);
    }
  }

  function updateSmoke(dt) {
    for (const p of s.smoke.userData.puffs) {
      const l = p.userData.life ?? 0;
      if (l <= 0) {
        p.material.opacity = 0;
        continue;
      }
      p.userData.life = l - dt / 4.5;
      p.position.y += dt * 1.6;
      p.position.x += dt * 0.7; // a breeze, towards the neighbours
      p.scale.setScalar(p.scale.x + dt * 0.5);
      p.material.opacity = Math.min(0.55, (1 - l) * 3) * l;
    }
  }

  // ------------------------------------------------------------------ HUD
  function buildHud(layer) {
    s.ui.title = el('div.dept-title', {}, TEXT.title);
    s.ui.output = el('div.bf-num', {}, '0');
    s.ui.quota = el('div.bf-num', {}, '0');
    s.ui.time = el('div.bf-num.bf-time', {}, '0:00');
    s.ui.board = el('div.bf-board', {}, [
      el('div.bf-cell', {}, [el('div.bf-lab', {}, TEXT.output), s.ui.output]),
      el('div.bf-cell', {}, [el('div.bf-lab', {}, TEXT.quota), s.ui.quota]),
      el('div.bf-cell', {}, [el('div.bf-lab', {}, TEXT.time), s.ui.time]),
    ]);
    s.ui.announce = el('div.bf-announce', { role: 'status' });
    s.ui.harvestFill = el('div.bf-fill');
    s.ui.harvestNum = el('span', {}, '');
    s.ui.harvest = el('div.bf-gauge.bf-harvest', {}, [el('div.bf-lab', {}, [TEXT.harvest, ' · ', s.ui.harvestNum]), el('div.bf-bar', {}, s.ui.harvestFill)]);
    s.ui.heatFill = el('div.bf-fill');
    s.ui.heatNum = el('span', {}, '');
    s.ui.heat = el('div.bf-gauge.bf-heat', {}, [el('div.bf-lab', {}, [TEXT.heat, ' · ', s.ui.heatNum]), el('div.bf-bar', {}, s.ui.heatFill)]);
    s.ui.hint = el('div.bf-hint', {}, TEXT.hint);
    s.ui.tip = el('div.bf-tip', { 'aria-hidden': 'true' });
    s.ui.floaters = el('div.bf-floaters', { 'aria-hidden': 'true' });
    layer.append(
      el('div.dept-banner', {}, [el('div.dept-kicker', {}, TEXT.dept), s.ui.title]),
      el('div.corner-actions', {}, [button('← RETURN TO BUREAU', () => s.ctx.goTo('hub'), { variant: 'dark' })]),
      s.ui.board,
      s.ui.announce,
      s.ui.harvest,
      s.ui.heat,
      s.ui.hint,
      s.ui.floaters,
      s.ui.tip,
    );
  }

  function renderHud() {
    const W = s.week;
    if (!W) return;
    s.ui.output.textContent = String(Math.round(s.output));
    s.ui.quota.textContent = String(s.quota);
    s.ui.board.classList.toggle('met', s.output >= s.quota);
    const left = Math.max(0, Math.ceil(W.seconds - s.t));
    s.ui.time.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    const hv = Math.max(0, s.harvest);
    s.ui.harvestFill.style.width = `${hv}%`;
    s.ui.harvestFill.classList.toggle('low', hv < 40);
    s.ui.harvestNum.textContent = `${Math.round(hv)}%`;
    const ht = (s.heat / FURNACE.heatMax) * 100;
    s.ui.heatFill.style.width = `${ht}%`;
    s.ui.heatFill.classList.toggle('low', ht < 20);
    s.ui.heatNum.textContent = ht < 8 ? 'COLD' : ht < 30 ? 'LOW' : ht < 70 ? 'HOT' : 'ROARING';
  }

  function showTip(text) {
    const t = s.ui.tip;
    if (!t) return;
    if (!text) {
      t.classList.remove('show');
      return;
    }
    t.textContent = text;
    t.style.transform = `translate(${s.client.x + 16}px, ${s.client.y + 14}px)`;
    t.classList.add('show');
  }

  const floaters = [];
  function floater(text, world, cls = '') {
    const node = el(`div.bf-float${cls ? '.' + cls : ''}`, {}, text);
    s.ui.floaters.append(node);
    const now = performance.now();
    const recent = floaters.filter((f) => now - f.born < 600).length;
    floaters.push({ node, world: world.clone().setY(world.y + 0.8), born: now, dy: recent * 26 });
  }

  function updateFloaters() {
    const now = performance.now();
    const canvas = s.ctx?.renderer.domElement;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      const age = (now - f.born) / 1000;
      if (age > 2.2) {
        f.node.remove();
        floaters.splice(i, 1);
        continue;
      }
      const v = f.world.clone().project(self.camera);
      const x = r.left + ((v.x + 1) / 2) * r.width;
      const y = r.top + ((1 - v.y) / 2) * r.height - age * 40 - f.dy;
      f.node.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
      f.node.style.opacity = String(Math.min(1, (2.2 - age) * 2));
    }
  }

  function bump(node) {
    node.classList.remove('bump');
    void node.offsetWidth;
    node.classList.add('bump');
  }

  function announce(text) {
    const a = s.ui.announce;
    s.ctx.audio.ding();
    a.textContent = text;
    a.classList.remove('show');
    void a.offsetWidth;
    a.classList.add('show');
  }

  // Dev only: skip to the end of the week, or feed the furnace automatically.
  if (import.meta.env.DEV) {
    self.__dev = {
      skip: () => (s.t = s.week.seconds - 1),
      state: () => ({ phase: s.phase, week: s.weekIndex, output: s.output, quota: s.quota, heat: Math.round(s.heat), harvest: s.harvest, total: s.total, left: s.items.filter((i) => i.state === 'rest' && usable(i)).length }),
      feed(filter = () => true) {
        for (const it of s.items) {
          if (it.state !== 'rest' || !usable(it) || !filter(it.def)) continue;
          if (it.from === 'beams') sagRoof();
          it.from = null;
          it.dragScale = 1;
          it.state = 'feed';
          it.ft = 0;
          it.from0 = it.g.position.clone().setY(DRAG_Y);
          it.mouth = new THREE.Vector3(FURNACE_POS.x, MOUTH_Y, FURNACE_POS.z);
        }
      },
    };
  }

  return self;
}
