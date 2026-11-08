// POTEMKIN VILLAGE — scene module. Night: build. Day: the Inspector drives past.
import * as THREE from 'three';
import './potemkin.css';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { fontsReady } from '../../shared/fonts.js';
import { el, button, memo, toast } from '../../shared/ui.js';
import { showNewspaper } from '../../shared/newspaper.js';
import { LEVELS, OPTIONS, REMARKS, NEWSPAPER } from './levels.js';
import { makeMaterials, buildGround, buildThing, setFixed, buildProp, buildCar, buildTruck } from './village.js';
import { sampleRoute, visibleItems, viewFan, VIEW } from './visibility.js';

const GAME_ID = 'potemkin-village';
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const fill = (str, v) => str.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
const NIGHT = { bg: 0x0b1020, hemi: [0x5a6aa0, 0x1a1a24, 1.0], sun: [0x9fb6e8, 1.3], pos: [-20, 30, -25] };
const DAY = { bg: 0xaebfc6, hemi: [0xf2e8d5, 0x4a4030, 0.7], sun: [0xfff0d8, 2.6], pos: [-30, 22, -18] };

/** Good things seen vs. bad things seen, each weighted by how much of it he saw and for how long. */
function impressionOf(G, B) {
  if (G + B < 0.001) return 50;
  return Math.round((100 * G) / (G + B));
}

export default function createPotemkin() {
  const s = {
    ctx: null,
    level: LEVELS[0],
    m: null,
    items: [],
    things: new Map(),
    props: new Map(),
    budget: null,
    phase: 'idle',
    controls: null,
    pointer: new THREE.Vector2(-9, -9),
    raycaster: new THREE.Raycaster(),
    markers: [],
    hovered: null,
    route: [],
    ghost: null,
    fan: null,
    scrub: 0.35,
    car: null,
    truck: null,
    drive: null,
    ui: {},
    light: {},
    dayT: 0,
  };

  const self = {
    scene: null,
    camera: null,

    async init(ctx) {
      s.ctx = ctx;
      const { scope, layer, renderer } = ctx;
      await fontsReady();
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(NIGHT.bg);
      scene.fog = new THREE.Fog(NIGHT.bg, 45, 110);
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 300);
      camera.position.set(-6, 30, -34);
      self.scene = scene;
      self.camera = camera;
      s.m = makeMaterials();

      buildGround(scene);
      s.light.hemi = new THREE.HemisphereLight(...NIGHT.hemi);
      s.light.sun = new THREE.DirectionalLight(NIGHT.sun[0], NIGHT.sun[1]);
      s.light.sun.position.set(...NIGHT.pos);
      s.light.sun.castShadow = true;
      s.light.sun.shadow.mapSize.set(2048, 2048);
      Object.assign(s.light.sun.shadow.camera, { left: -60, right: 60, top: 40, bottom: -40, near: 1, far: 120 });
      s.light.sun.shadow.normalBias = 0.04;
      scene.add(s.light.hemi, s.light.sun);
      // the lantern of the night shift
      s.light.lantern = new THREE.PointLight(0xffc070, 30, 30, 1.6);
      s.light.lantern.position.set(0, 5, 3);
      scene.add(s.light.lantern);

      // village
      for (const def of s.level.things) {
        const built = buildThing(def, s.m);
        scene.add(built.group);
        const item = { kind: 'thing', def, built, weight: def.weight, label: def.label, fixed: false, group: built.group };
        s.things.set(def.id, item);
        s.items.push(item);
      }
      scene.updateMatrixWorld(true);
      s.items.forEach(refreshItem);
      s.route = sampleRoute(s.level.route, 1);

      // build-slot markers
      const markerGeo = new THREE.OctahedronGeometry(0.55, 0);
      for (const slot of s.level.slots) {
        const mk = new THREE.Mesh(markerGeo, new THREE.MeshBasicMaterial({ color: 0xd4a72c }));
        mk.position.set(slot.pos[0], 3.6, slot.pos[1]);
        mk.userData.slot = slot;
        scene.add(mk);
        s.markers.push(mk);
      }
      // warning markers above every thing
      const warnGeo = new THREE.ConeGeometry(0.45, 1, 4);
      for (const item of s.items) {
        const w = new THREE.Mesh(warnGeo, new THREE.MeshBasicMaterial({ color: 0xc1272d }));
        w.rotation.x = Math.PI;
        const top = item.def.type === 'house' || item.def.type === 'shop' ? 7.5 : 4;
        w.position.set(item.def.pos[0], top, item.def.pos[1]);
        scene.add(w);
        item.warn = w;
      }

      // ghost car and its view cone
      s.ghost = buildCar(s.m);
      s.ghost.traverse((o) => {
        if (o.isMesh) {
          o.material = o.material.clone();
          o.material.transparent = true;
          o.material.opacity = 0.55;
        }
      });
      scene.add(s.ghost);
      s.fan = new THREE.Mesh(
        new THREE.BufferGeometry(),
        new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
      );
      scene.add(s.fan);
      // route line
      const line = new THREE.Mesh(new THREE.PlaneGeometry(92, 0.15), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.5 }));
      line.rotation.x = -Math.PI / 2;
      line.position.y = 0.05;
      scene.add(line);
      s.routeLine = line;

      s.controls = new OrbitControls(camera, renderer.domElement);
      s.controls.target.set(0, 0, 6);
      s.controls.enableDamping = true;
      s.controls.maxPolarAngle = 1.35;
      s.controls.minDistance = 12;
      s.controls.maxDistance = 80;
      scope.add(() => s.controls.dispose());

      const canvas = renderer.domElement;
      scope.on(canvas, 'pointermove', (e) => {
        const r = canvas.getBoundingClientRect();
        s.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        s.pointerPx = { x: e.clientX, y: e.clientY };
      });
      let downAt = null;
      scope.on(canvas, 'pointerdown', (e) => (downAt = { x: e.clientX, y: e.clientY }));
      scope.on(canvas, 'pointerup', (e) => {
        if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 6 && s.hovered) toggleSlot(s.hovered);
        downAt = null;
      });
      scope.add(() => (canvas.style.cursor = ''));

      s.budget = { ...s.level.budget };
      buildHud();
      recompute();
      ctx.audio.loop('wind', 'room', 0.03);
    },

    async start() {
      const { scope, layer } = s.ctx;
      s.phase = 'memo';
      const m = memo(layer, {
        no: s.level.memo.no,
        to: 'Chairman, Collective Farm "Bright Path"',
        from: 'District Committee',
        subject: s.level.memo.subject,
        body: s.level.memo.body,
        stamp: 'URGENT',
        buttons: [{ label: 'BEGIN THE NIGHT SHIFT', value: true, variant: 'red' }],
      });
      await m.done;
      if (scope.disposed) return;
      s.phase = 'build';
      s.ui.build.classList.add('show');
    },

    update(dt, time) {
      if (!s.m) return;
      s.controls.enabled = s.phase === 'build' || s.phase === 'memo';
      if (s.controls.enabled) s.controls.update();

      // markers bob
      for (const mk of s.markers) {
        mk.position.y = 3.6 + Math.sin(time * 2 + mk.position.x) * 0.2;
        mk.rotation.y += dt;
      }
      // crowds wave
      for (const p of s.props.values()) {
        for (const c of p.built.wavers) c.userData.arm.rotation.z = 2.6 + Math.sin(time * 6 + c.userData.phase) * 0.5;
      }

      if (s.phase === 'build') {
        s.raycaster.setFromCamera(s.pointer, self.camera);
        const hit = s.raycaster.intersectObjects(s.markers, false)[0];
        const slot = hit ? hit.object.userData.slot : null;
        if (slot !== s.hovered) setHover(slot);
        if (s.hovered && s.ui.tip) s.ui.tip.style.transform = `translate(${s.pointerPx.x + 16}px, ${s.pointerPx.y + 16}px)`;
      }

      if (s.phase === 'inspect') tickDrive(dt);
      if (s.phase === 'pack') tickPack(dt);

      // day/night blend
      const target = ['inspect', 'report', 'pack', 'paper'].includes(s.phase) ? 1 : 0;
      if (s.dayT !== target) {
        s.dayT += Math.sign(target - s.dayT) * Math.min(Math.abs(target - s.dayT), dt * 0.6);
        blendLight(s.dayT);
      }
    },

    dispose() {
      s.m = null;
      s.ctx = null;
      s.items = [];
      s.ui = {};
    },
  };

  // ---- helpers ---------------------------------------------------------------------
  function refreshItem(item) {
    item.own = new Set();
    item.group.traverse((o) => o.isMesh && item.own.add(o));
    item.group.updateMatrixWorld(true);
    item.worldSamples = item.built.samples.map((p) => item.group.localToWorld(p.clone()));
  }

  function occluders() {
    const out = [];
    for (const it of s.items) if (it.group.visible) out.push(...it.built.occ);
    return out;
  }

  function isBad(item) {
    return item.kind === 'thing' && !item.fixed;
  }

  function goodWeight(item) {
    if (item.kind === 'prop') return OPTIONS[item.slot.kind].good;
    if (item.fixed) return OPTIONS[item.fixKind].good;
    return 0;
  }

  function blendLight(t) {
    const lerpC = (a, b) => new THREE.Color(a).lerp(new THREE.Color(b), t);
    self.scene.background.copy(lerpC(NIGHT.bg, DAY.bg));
    self.scene.fog.color.copy(self.scene.background);
    s.light.hemi.color.copy(lerpC(NIGHT.hemi[0], DAY.hemi[0]));
    s.light.hemi.groundColor.copy(lerpC(NIGHT.hemi[1], DAY.hemi[1]));
    s.light.hemi.intensity = THREE.MathUtils.lerp(NIGHT.hemi[2], DAY.hemi[2], t);
    s.light.sun.color.copy(lerpC(NIGHT.sun[0], DAY.sun[0]));
    s.light.sun.intensity = THREE.MathUtils.lerp(NIGHT.sun[1], DAY.sun[1], t);
    s.light.sun.position.set(...NIGHT.pos.map((v, i) => THREE.MathUtils.lerp(v, DAY.pos[i], t)));
    s.light.lantern.intensity = 30 * (1 - t);
  }

  // ---- building ----------------------------------------------------------------------
  function canAfford(cost) {
    return Object.entries(cost).every(([k, v]) => s.budget[k] >= v);
  }

  function toggleSlot(slot) {
    if (s.phase !== 'build') return;
    const opt = OPTIONS[slot.kind];
    const { audio, layer } = s.ctx;
    const existing = s.props.get(slot.id) || (slot.target && s.things.get(slot.target).fixed ? s.things.get(slot.target) : null);
    if (existing) {
      // dismantle and refund
      for (const [k, v] of Object.entries(opt.cost)) s.budget[k] += v;
      if (slot.target) {
        setFixed(s.things.get(slot.target), false, s.m);
      } else {
        const p = s.props.get(slot.id);
        self.scene.remove(p.group);
        p.group.traverse((o) => o.isMesh && o.geometry.dispose());
        s.items.splice(s.items.indexOf(p), 1);
        s.props.delete(slot.id);
      }
      audio.click();
    } else {
      if (!canAfford(opt.cost)) {
        toast(layer, `Not enough ${Object.keys(opt.cost)[0]}. Requests for more will be considered next Five-Year Plan.`, 2600);
        return;
      }
      for (const [k, v] of Object.entries(opt.cost)) s.budget[k] -= v;
      if (slot.target) {
        const t = s.things.get(slot.target);
        t.fixKind = slot.kind;
        setFixed(t, true, s.m);
      } else {
        const built = buildProp(slot, s.m, s.props.size + slot.id.length);
        self.scene.add(built.group);
        const item = { kind: 'prop', slot, built, group: built.group, label: opt.praise };
        refreshItem(item);
        s.props.set(slot.id, item);
        s.items.push(item);
      }
      audio.stamp();
    }
    setHover(slot);
    recompute();
  }

  /** Work out what he will see along the whole route, and update markers and HUD. */
  function recompute() {
    self.scene.updateMatrixWorld(true);
    const occ = occluders();
    const seen = new Set();
    for (const sample of sampleRoute(s.level.route, 2)) {
      for (const [it, frac] of visibleItems(sample.pos, sample.fwd, s.level.windows, s.items, occ)) if (frac >= VIEW.notice) seen.add(it);
    }
    let badSeen = 0;
    let badHidden = 0;
    for (const it of s.items) {
      if (it.kind !== 'thing') continue;
      const bad = isBad(it);
      const vis = seen.has(it);
      it.warn.visible = bad;
      it.warn.material.color.set(vis ? 0xc1272d : 0x555a60);
      it.warn.scale.setScalar(vis ? 1.2 : 0.7);
      if (bad && vis) badSeen++;
      else if (bad) badHidden++;
    }
    for (const mk of s.markers) {
      const slot = mk.userData.slot;
      const built = s.props.has(slot.id) || (slot.target && s.things.get(slot.target).fixed);
      mk.material.color.set(built ? 0x4f9a3a : 0xd4a72c);
    }
    s.preview = { badSeen, badHidden };
    renderHud();
    updateGhost();
  }

  function updateGhost() {
    const route = s.route;
    const i = Math.min(route.length - 1, Math.floor(s.scrub * (route.length - 1)));
    const { pos, fwd } = route[i];
    s.ghost.position.copy(pos);
    s.ghost.rotation.y = -Math.atan2(fwd.z, fwd.x);
    const verts = viewFan(pos, fwd, s.level.windows, occluders());
    s.fan.geometry.dispose();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    s.fan.geometry = g;
  }

  // ---- HUD -------------------------------------------------------------------------------
  function buildHud() {
    const { layer } = s.ctx;
    s.ui.res = el('div.pv-res');
    s.ui.preview = el('div.pv-preview');
    const scrub = el('input', { type: 'range', min: 0, max: 1000, value: s.scrub * 1000, 'aria-label': 'Move the preview car along the route' });
    scrub.addEventListener('input', () => {
      s.scrub = +scrub.value / 1000;
      updateGhost();
    });
    const go = button('☀ SUNRISE: BEGIN INSPECTION', startInspection, { variant: 'red' });
    s.ui.build = el('aside.pv-panel', {}, [
      el('div.pv-h', {}, 'THE NIGHT SHIFT'),
      s.ui.res,
      el('div.pv-legend', {}, [
        el('div', {}, [el('span.pv-dot.gold'), 'Build spot. Click to build, click again to take it down.']),
        el('div', {}, [el('span.pv-dot.red'), 'Eyesore he WILL see from the car.']),
        el('div', {}, [el('span.pv-dot.grey'), 'Eyesore he will not see. Leave it.']),
      ]),
      s.ui.preview,
      el('label.pv-scrub', {}, ['PREVIEW HIS VIEW ALONG THE ROUTE', scrub]),
      go,
    ]);
    s.ui.tip = el('div.door-tip.pv-tip');
    s.ui.impression = el('div.pv-imp-fill');
    s.ui.remark = el('div.pv-remark');
    s.ui.drive = el('div.pv-drive', {}, [el('div.pv-imp-l', {}, "INSPECTOR'S IMPRESSION"), el('div.pv-imp-bar', {}, s.ui.impression), s.ui.remark]);
    layer.append(
      el('div.dept-banner', {}, [el('div.dept-kicker', {}, 'Directorate of Rural Appearances'), el('div.dept-title', {}, `VILLAGE OF ${s.level.name}`)]),
      el('div.corner-actions', {}, [button('← RETURN TO LOBBY', () => s.ctx.goTo('hub'), { variant: 'dark' })]),
      s.ui.build,
      s.ui.drive,
      s.ui.tip,
    );
  }

  function renderHud() {
    const icon = { plywood: '▤', paint: '◍', people: '☺' };
    s.ui.res.replaceChildren(
      ...Object.entries(s.budget).map(([k, v]) => el('div.pv-r', {}, [el('span.pv-r-i', {}, icon[k]), el('span.pv-r-n', {}, String(v)), el('span.pv-r-k', {}, k.toUpperCase())])),
    );
    s.ui.preview.replaceChildren(
      el('div.pv-pv', {}, [el('b', {}, String(s.preview.badSeen)), ' eyesores visible from the car']),
      el('div.pv-pv.dim', {}, [el('b', {}, String(s.preview.badHidden)), ' eyesores safely out of sight']),
    );
  }

  function setHover(slot) {
    s.hovered = slot;
    s.ctx.renderer.domElement.style.cursor = slot ? 'pointer' : '';
    if (!slot) return s.ui.tip.classList.remove('show');
    const opt = OPTIONS[slot.kind];
    const built = s.props.has(slot.id) || (slot.target && s.things.get(slot.target).fixed);
    const cost = Object.entries(opt.cost).map(([k, v]) => `${v} ${k}`).join(', ');
    const target = slot.target ? ` ${s.things.get(slot.target).label}` : '';
    s.ui.tip.replaceChildren(
      el('div.tip-kicker', {}, 'BUILD SPOT'),
      el('div.tip-title', {}, opt.label),
      el('div.tip-body', {}, slot.target ? `Disguise${target}.` : slot.kind === 'facade' ? 'A cheerful house-front. Hides whatever is behind it.' : slot.kind === 'crowd' ? 'Three volunteers, waving flags with great sincerity.' : 'A red banner on two poles.'),
      el('div.tip-hint', {}, built ? 'CLICK TO DISMANTLE (REFUND)' : `COST: ${cost.toUpperCase()}`),
    );
    s.ui.tip.classList.add('show');
  }

  // ---- inspection -----------------------------------------------------------------------
  function startInspection() {
    if (s.phase !== 'build') return;
    const { audio } = s.ctx;
    s.phase = 'inspect';
    setHover(null);
    s.ui.build.classList.remove('show');
    s.ui.drive.classList.add('show');
    for (const mk of s.markers) mk.visible = false;
    for (const it of s.items) if (it.warn) it.warn.visible = false;
    s.ghost.visible = false;
    s.fan.visible = false;
    s.routeLine.visible = false;
    audio.ding();
    s.car = buildCar(s.m);
    self.scene.add(s.car);
    s.drive = { d: 0, G: 0, B: 0, seenOnce: new Set(), noted: [], praised: [], remarkT: 0 };
  }

  function tickDrive(dt) {
    const dr = s.drive;
    const route = s.route;
    dr.d += dt * s.level.speed;
    const i = Math.min(route.length - 1, Math.floor(dr.d));
    const { pos, fwd } = route[i];
    s.car.position.lerp(pos, Math.min(1, dt * 10));
    s.car.rotation.y = -Math.atan2(fwd.z, fwd.x);
    const cam = self.camera;
    const camPos = s.car.position.clone().add(new THREE.Vector3(-10, 6, -9));
    cam.position.lerp(camPos, Math.min(1, dt * 3));
    cam.lookAt(s.car.position.clone().add(new THREE.Vector3(5, 1.5, 6)));

    const seen = visibleItems(s.car.position, fwd, s.level.windows, s.items, occluders());
    for (const [it, frac] of seen) {
      if (isBad(it)) dr.B += it.weight * frac * dt;
      else dr.G += goodWeight(it) * frac * dt;
      if (frac >= VIEW.notice && !dr.seenOnce.has(it)) {
        dr.seenOnce.add(it);
        const bad = isBad(it);
        (bad ? dr.noted : dr.praised).push(bad || it.kind === 'prop' ? it.label : it.def.praise || OPTIONS[it.fixKind].praise);
        if (dr.remarkT <= 0) {
          remark(pick(bad ? REMARKS.bad : REMARKS.good), bad);
          dr.remarkT = 1.4;
        }
        flash(it, bad);
      }
    }
    dr.remarkT -= dt;
    const imp = impression();
    s.ui.impression.style.width = `${imp}%`;
    s.ui.impression.classList.toggle('low', imp < 50);
    if (dr.d >= route.length - 1) {
      s.phase = 'report';
      report();
    }
  }

  function impression() {
    return impressionOf(s.drive.G, s.drive.B);
  }

  function remark(text, bad) {
    const n = s.ui.remark;
    n.textContent = `"${text}"`;
    n.classList.toggle('bad', bad);
    n.classList.remove('pop');
    void n.offsetWidth;
    n.classList.add('pop');
    s.ctx.audio[bad ? 'stamp' : 'click']();
  }

  function flash(item, bad) {
    item.group.traverse((o) => {
      if (!o.isMesh || !o.material || Array.isArray(o.material) || !o.material.emissive) return;
      const mat = o.material;
      if (mat.userData.baseEmissive === undefined) mat.userData.baseEmissive = mat.emissive.getHex();
      mat.emissive.set(bad ? 0x661010 : 0x665010);
      clearTimeout(mat.userData.flashT);
      mat.userData.flashT = setTimeout(() => mat.emissive && mat.emissive.setHex(mat.userData.baseEmissive), 500);
    });
  }

  function actualCondition() {
    const facades = [...s.props.values()].filter((p) => p.slot.kind === 'facade').length;
    return Math.max(3, 14 - facades);
  }

  async function report() {
    const { layer, audio, scope } = s.ctx;
    const imp = impression();
    const stamp = imp >= 80 ? 'EXEMPLARY VILLAGE' : imp >= 50 ? 'SATISFACTORY' : 'SUBJECT TO REVIEW';
    audio.ding();
    const dr = s.drive;
    const m = memo(layer, {
      no: 'PV-1/01-R',
      to: 'Chairman, Collective Farm "Bright Path"',
      from: 'Office of the Deputy Inspector',
      subject: `Inspection of ${s.level.name}`,
      body: [
        `Inspector's Impression: ${imp}%.`,
        `Actual Village Condition: ${actualCondition()}% (not inspected).`,
        dr.praised.length ? `The Inspector admired: ${[...new Set(dr.praised)].join('; ')}.` : 'The Inspector admired nothing in particular.',
        dr.noted.length ? `The Inspector noted: ${dr.noted.join('; ')}.` : 'The Inspector noted no deficiencies, as none were visible from the car.',
      ],
      stamp,
      buttons: [{ label: 'SEE THE INSPECTOR OFF', value: true, variant: 'red' }],
    });
    m.node.classList.add('pv-side');
    await m.done;
    if (scope.disposed) return;
    s.result = { imp, condition: actualCondition() };
    startPack();
  }

  // ---- the gag: everything goes on a truck to the next village ---------------------------
  function startPack() {
    s.phase = 'pack';
    s.ui.drive.classList.remove('show');
    s.car.visible = false;
    s.truck = buildTruck(s.m);
    s.truck.position.set(-52, 0, 0.5);
    self.scene.add(s.truck);
    s.pack = { t: 0, folding: [] };
    toast(s.ctx.layer, 'The Inspector has left. The village is being packed for the next village.', 3800);
    s.ctx.audio.loop('truck', 'hum', 0.05);
  }

  function tickPack(dt) {
    const p = s.pack;
    p.t += dt;
    s.truck.position.x += dt * 9;
    const cam = self.camera;
    cam.position.lerp(s.truck.position.clone().add(new THREE.Vector3(-6, 9, -16)), Math.min(1, dt * 2));
    cam.lookAt(s.truck.position.clone().add(new THREE.Vector3(6, 0, 6)));
    for (const prop of s.props.values()) {
      if (!prop.packed && s.truck.position.x > prop.group.position.x - 2) {
        prop.packed = true;
        p.folding.push(prop);
        s.ctx.audio.clack();
      }
    }
    for (const t of s.things.values()) {
      if (t.fixed && t.fixKind === 'window' && s.truck.position.x > t.def.pos[0]) setFixed(t, false, s.m);
    }
    for (const prop of p.folding) {
      prop.group.scale.y = Math.max(0.02, prop.group.scale.y - dt * 2.5);
      if (prop.group.scale.y <= 0.02) prop.group.visible = false;
    }
    if (s.truck.position.x > 60 && !p.done) {
      p.done = true;
      s.ctx.audio.stopLoop('truck');
      finish();
    }
  }

  async function finish() {
    const { layer, save, audio, scope, manager } = s.ctx;
    const { imp, condition } = s.result;
    const key = imp >= 70 ? 'good' : 'poor';
    const np0 = NEWSPAPER[key];
    const vars = { name: s.level.name.charAt(0) + s.level.name.slice(1).toLowerCase(), impression: imp };
    save.awardMedal(GAME_ID, { impression: imp, condition });
    const runLabel = `${vars.name}: ${imp}%`;
    if (imp >= 50) save.recordSuccess(GAME_ID, runLabel);
    else save.recordFailure(GAME_ID, runLabel);
    save.setGame(GAME_ID, { best: Math.max(imp, save.game(GAME_ID).best || 0) });
    audio.fanfare();
    // photograph the village as it is now: the plywood is fourteen kilometres away
    s.phase = 'paper';
    self.camera.position.set(-4, 11, -22);
    self.camera.lookAt(0, 0, 9);
    const photo = manager.snapshot();
    const np = showNewspaper(layer, {
      headline: fill(np0.headline, vars),
      deck: fill(np0.deck, vars),
      photo,
      caption: 'The village, photographed shortly after the inspection.',
      columns: np0.columns.map((c) => fill(c, vars)),
      sidebar: { title: 'THE VILLAGE IN FIGURES', items: [`Inspector's impression: ${imp}%`, `Actual condition: ${condition}%`, `Plywood returned to stores: all of it`] },
      closeLabel: 'RETURN TO THE MINISTRY',
    });
    await np.done;
    if (!scope.disposed) s.ctx.goTo('hub');
  }

  // Dev only: score the current build without driving, for balancing levels.
  if (import.meta.env.DEV) {
    self.__dev = {
      s,
      toggle: (id) => toggleSlot(s.level.slots.find((sl) => sl.id === id)),
      score() {
        self.scene.updateMatrixWorld(true);
        const occ = occluders();
        let G = 0;
        let B = 0;
        const bad = new Set();
        for (const { pos, fwd } of sampleRoute(s.level.route, 1)) {
          for (const [it, frac] of visibleItems(pos, fwd, s.level.windows, s.items, occ)) {
            if (isBad(it)) { B += it.weight * frac; if (frac >= VIEW.notice) bad.add(it.def.id); } else G += goodWeight(it) * frac;
          }
        }
        return { imp: impressionOf(G, B), G, B, bad: [...bad] };
      },
    };
  }

  return self;
}
