// SPARE PARTS · Cuba wing, game 1. Keep a 1957 car running for sixty years.
// Each decade a part fails. Drag junk onto the broken part; it fits if it does everything the
// work order asks. The car gets stranger. The inspection only checks the colour.
import * as THREE from 'three';
import './spare.css';
import { fontsReady } from '../../shared/fonts.js';
import { el, button, memo, toast } from '../../shared/ui.js';
import { showNewspaper } from '../../shared/newspaper.js';
import { DECADES, JUNK, TAGS, PAINTS, MONTHS_ALLOWED, TEXT, NEWSPAPER } from './parts.js';
import { buildGarage, buildCar, buildJunk, SLOTS } from './car.js';

const GAME_ID = 'spare-parts';
const DROP_PX = 70;

export default function createSpareParts() {
  const s = {
    ctx: null,
    garage: null,
    car: null,
    decade: 0,
    open: [], // failures still to fix this decade: { def, zone, done }
    used: new Set(),
    fitted: [], // names of junk now in the car
    months: 0,
    repairs: 0,
    colours: new Set([0x5fb8b0]),
    paintNext: 0,
    drag: null,
    shake: 0,
    smoke: [],
    phase: 'idle',
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
      scene.background = new THREE.Color(0x2a2622);
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.set(5.6, 3.7, 6.8);
      camera.lookAt(0, 0.9, 0);
      self.scene = scene;
      self.camera = camera;
      scene.add(new THREE.HemisphereLight(0xfff4e0, 0x3a332a, 1.1));
      const sun = new THREE.DirectionalLight(0xffe6c0, 2.0);
      sun.position.set(6, 9, 5);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 });
      scene.add(sun);
      const bulb = new THREE.PointLight(0xffd9a0, 14, 14, 1.4);
      bulb.position.set(0, 5.2, 0.5);
      scene.add(bulb);

      s.garage = buildGarage(scene);
      s.car = buildCar();
      scene.add(s.car.group);
      buildHud(layer);

      scope.on(window, 'pointermove', onDragMove);
      scope.on(window, 'pointerup', onDragEnd);
      scope.on(window, 'keydown', (e) => {
        if (e.key === 'Escape' && !document.querySelector('.memo-wrap')) ctx.goTo('hub');
      });
    },

    async start() {
      const { layer, scope, audio } = s.ctx;
      const m = memo(layer, { no: TEXT.memo.no, to: 'Comrade Mechanic', from: TEXT.dept, subject: TEXT.memo.subject, body: TEXT.memo.body, stamp: 'IN PERPETUITY', buttons: [{ label: TEXT.memo.button, value: true, variant: 'red' }] });
      await m.done;
      if (scope.disposed) return;
      audio.unlock();
      runDecade(0);
    },

    update(dt, time) {
      if (!s.car) return;
      placeZones();
      // the car idles, roughly, when it runs
      s.shake = Math.max(0, s.shake - dt);
      const g = s.car.group;
      g.position.y = s.shake > 0 ? Math.sin(time * 60) * 0.02 : 0;
      g.rotation.z = s.car.tilt || 0;
      for (const p of s.smoke) {
        p.position.y += dt * 0.6;
        p.scale.multiplyScalar(1 + dt * 0.8);
        p.material.opacity = Math.max(0, p.material.opacity - dt * 0.35);
      }
      s.smoke = s.smoke.filter((p) => (p.material.opacity > 0 ? true : (self.scene.remove(p), false)));
      if (s.phase === 'repair' && Math.random() < dt * 3) for (const f of s.open) if (!f.done) puff(f.def.slot);
    },

    dispose() {
      s.car = null;
      s.ctx = null;
      s.ui = {};
    },
  };

  // ------------------------------------------------------------------ decades
  async function runDecade(i) {
    const { layer, scope, audio } = s.ctx;
    s.decade = i;
    const D = DECADES[i];
    s.garage.calendar.set(D.year);
    // the failure happens
    audio.clang();
    for (const f of D.fails) breakPart(f.slot);
    s.open = D.fails.map((def) => ({ def, done: false, zone: null }));
    const m = memo(layer, { no: `AC-1/${i + 2}`, to: 'Comrade Mechanic', from: TEXT.dept, subject: `${D.year}: ${D.title}`, body: [D.memo, ...D.fails.map((f) => `Work order: ${f.name.toLowerCase()}. Must be: ${f.needs.map((t) => TAGS[t]).join('; ')}.`)], stamp: 'BROKEN', buttons: [{ label: 'TO THE JUNKYARD', value: true, variant: 'red' }] });
    m.node.classList.add('sp-side');
    await m.done;
    if (scope.disposed) return;
    s.phase = 'repair';
    renderHud();
  }

  function breakPart(slot) {
    const o = s.car.originals[slot];
    if (o) o.visible = false;
    if (slot === 'tyre') s.car.tilt = -0.03;
    for (let k = 0; k < 4; k++) puff(slot);
  }

  function puff(slot) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), new THREE.MeshBasicMaterial({ color: 0x9a948a, transparent: true, opacity: 0.55, depthWrite: false }));
    const [x, y, z] = SLOTS[slot].pos;
    p.position.set(x + (Math.random() - 0.5) * 0.3, y + 0.1, z + (Math.random() - 0.5) * 0.3);
    self.scene.add(p);
    s.smoke.push(p);
  }

  // ------------------------------------------------------------------ dragging junk
  function onCardDown(e, id) {
    if (s.phase !== 'repair' || s.used.has(id)) return;
    e.preventDefault();
    const ghost = el('div.sp-ghost', {}, JUNK[id].name);
    s.ui.root.append(ghost);
    s.drag = { id, ghost, over: null };
    s.ctx.audio.click();
    onDragMove(e);
  }

  function onDragMove(e) {
    const d = s.drag;
    if (!d) return;
    d.ghost.style.left = `${e.clientX}px`;
    d.ghost.style.top = `${e.clientY}px`;
    let best = null;
    let bestD = DROP_PX;
    for (const f of s.open) {
      if (f.done || !f.zone) continue;
      const r = f.zone.getBoundingClientRect();
      const dist = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      if (dist < bestD) {
        bestD = dist;
        best = f;
      }
    }
    if (best !== d.over) {
      d.over = best;
      renderOrders(best ? { fail: best, item: JUNK[d.id] } : null);
      for (const f of s.open) f.zone?.classList.toggle('hot', f === best);
    }
  }

  function onDragEnd() {
    const d = s.drag;
    if (!d) return;
    s.drag = null;
    d.ghost.remove();
    for (const f of s.open) f.zone?.classList.remove('hot');
    renderOrders(null);
    if (d.over) tryFit(d.id, d.over);
  }

  function tryFit(id, fail) {
    const { layer, audio } = s.ctx;
    const item = JUNK[id];
    const missing = fail.def.needs.filter((t) => !item.tags.includes(t));
    if (missing.length) {
      s.months++;
      audio.stamp();
      toast(layer, TEXT.wrong(item.name, missing.map((t) => TAGS[t]).join(' and ')), 3400);
      const card = s.ui.cards[id];
      card?.classList.remove('shake');
      void card?.offsetWidth;
      card?.classList.add('shake');
      renderHud();
      return;
    }
    // it fits, which is to say it is now original
    fail.done = true;
    s.used.add(id);
    s.fitted.push(/^Soviet/.test(item.name) ? item.name : item.name[0].toLowerCase() + item.name.slice(1));
    s.repairs++;
    audio.clang();
    s.shake = 0.6;
    const junk = buildJunk(item, s.repairs);
    junk.position.set(...SLOTS[fail.def.slot].pos);
    if (fail.def.slot === 'brakes' || fail.def.slot === 'tyre') junk.rotation.x = Math.PI / 2;
    if (fail.def.slot === 'door' || fail.def.slot === 'radiator') junk.rotation.y = fail.def.slot === 'radiator' ? Math.PI / 2 : 0;
    s.car.group.add(junk);
    if (fail.def.slot === 'tyre') s.car.tilt = 0.015;
    toast(layer, item.line ? `${TEXT.fitted(item.name)} ${item.line}` : TEXT.fitted(item.name), 3200);
    renderHud();
    if (s.open.every((f) => f.done)) setTimeout(() => s.ctx && inspection(), 900);
  }

  // ------------------------------------------------------------------ the inspection
  async function inspection() {
    const { layer, scope, audio } = s.ctx;
    s.phase = 'inspect';
    renderHud();
    const D = DECADES[s.decade];
    const pool = PAINTS.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    const m = memo(layer, { no: `AC-1/${s.decade + 2}-I`, to: 'Comrade Mechanic', from: 'State Vehicle Inspectorate', subject: TEXT.inspection.subject(D.year + 1), body: TEXT.inspection.body, buttons: pool.map((p, k) => ({ label: p.name.toUpperCase(), value: k, variant: k === 0 ? 'red' : '' })) });
    m.node.classList.add('sp-side');
    const k = await m.done;
    if (scope.disposed) return;
    const paint = pool[k ?? 0];
    const panel = s.car.panels[s.paintNext++ % s.car.panels.length];
    panel.material = panel.material.clone();
    panel.material.color.setHex(paint.hex);
    s.colours = new Set(s.car.panels.map((p) => p.material.color.getHex()));
    audio.stamp();
    toast(layer, `${TEXT.inspection.passed}. Colours on the car: ${s.colours.size}.`, 2600);
    s.shake = 1.4;
    await new Promise((r) => setTimeout(r, 1500));
    if (scope.disposed) return;
    if (s.decade + 1 < DECADES.length) runDecade(s.decade + 1);
    else finish();
  }

  async function finish() {
    const { layer, save, audio, scope, manager } = s.ctx;
    s.phase = 'end';
    renderHud();
    s.garage.calendar.set(2017);
    const good = s.months <= MONTHS_ALLOWED;
    const label = `Sixty years, ${s.months} months off the road`;
    if (good) {
      save.awardMedal(GAME_ID, { months: s.months, colours: s.colours.size });
      save.recordSuccess(GAME_ID, label);
    } else save.recordFailure(GAME_ID, label);
    s.shake = 3;
    audio.fanfare();
    const photo = manager.snapshot();
    const parts = s.fitted.length > 1 ? `${s.fitted.slice(0, -1).join(', ')} and ${s.fitted[s.fitted.length - 1]}` : s.fitted[0] || 'nothing';
    const r = { repairs: s.repairs, months: s.months, colours: s.colours.size, parts, good };
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
    const year = el('div.sp-num', {}, '1957');
    const months = el('div.sp-num', {}, '0');
    const board = el('div.sp-board', {}, [
      el('div.sp-cell', {}, [el('div.sp-lab', {}, 'Year'), year]),
      el('div.sp-cell', {}, [el('div.sp-lab', {}, 'Months off the road'), months, el('div.sp-info', {}, `allowed: ${MONTHS_ALLOWED}`)]),
    ]);
    const orders = el('div.sp-orders', {}, []);
    const yard = el('div.sp-yard', {}, []);
    const zones = el('div.sp-zones', {}, []);
    const hint = el('div.sp-hint', {}, 'Drag junk onto the broken part.');
    const back = el('div.corner-actions', {}, [button('← RETURN TO LOBBY', () => s.ctx.goTo('hub'), { variant: 'dark' })]);
    const root = el('div.sp-hud', {}, [zones, board, el('aside.sp-panel', {}, [el('div.sp-lab', {}, 'Work orders'), orders]), el('div.sp-yardwrap', {}, [el('div.sp-lab', {}, 'The junkyard'), yard]), hint, back]);
    layer.append(root);
    s.ui = { root, year, months, orders, yard, zones, cards: {} };
  }

  function renderHud() {
    const u = s.ui;
    if (!u.root) return;
    const D = DECADES[s.decade];
    u.year.textContent = String(D.year);
    u.months.textContent = String(s.months);
    u.months.classList.toggle('bad', s.months > MONTHS_ALLOWED);
    renderOrders(null);
    // the junkyard
    u.cards = {};
    const cards = D.junk.map((id) => {
      const it = JUNK[id];
      const used = s.used.has(id);
      const c = el(`div.sp-card${used ? '.used' : ''}`, { onpointerdown: (e) => onCardDown(e, id) }, [
        el('span.sp-swatch', { style: `background:#${it.colour.toString(16).padStart(6, '0')}` }),
        el('b', {}, it.name),
        el('div.sp-tags', {}, it.tags.map((t) => el('span', {}, TAGS[t]))),
        used ? el('i', {}, 'in the car') : null,
      ]);
      u.cards[id] = c;
      return c;
    });
    u.yard.replaceChildren(...cards);
    // drop zones over the broken parts
    u.zones.replaceChildren(
      ...s.open.filter((f) => !f.done && s.phase === 'repair').map((f) => {
        f.zone = el('div.sp-zone', {}, [el('span', {}, f.def.name)]);
        return f.zone;
      }),
    );
  }

  /** Work orders, ticking live against whatever is being held over them. */
  function renderOrders(trial) {
    const u = s.ui;
    if (!u.orders) return;
    u.orders.replaceChildren(
      ...s.open.map((f) =>
        el(`div.sp-order${f.done ? '.done' : ''}${trial?.fail === f ? '.trial' : ''}`, {}, [
          el('b', {}, f.def.name),
          el(
            'ul',
            {},
            f.def.needs.map((t) => {
              const state = f.done ? 'ok' : trial?.fail === f ? (trial.item.tags.includes(t) ? 'ok' : 'no') : '';
              return el(`li${state ? '.' + state : ''}`, {}, TAGS[t]);
            }),
          ),
        ]),
      ),
    );
  }

  function placeZones() {
    const cam = self.camera;
    const canvas = s.ctx?.renderer.domElement;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const v = new THREE.Vector3();
    for (const f of s.open) {
      if (!f.zone) continue;
      v.set(...SLOTS[f.def.slot].pos);
      s.car.group.localToWorld(v);
      v.project(cam);
      f.zone.style.left = `${r.left + ((v.x + 1) / 2) * r.width}px`;
      f.zone.style.top = `${r.top + ((1 - v.y) / 2) * r.height}px`;
    }
  }

  if (import.meta.env.DEV) {
    self.__dev = {
      s,
      /** Fit the first piece of junk that works for each open failure. */
      solve() {
        for (const f of s.open) {
          if (f.done) continue;
          const id = DECADES[s.decade].junk.find((j) => !s.used.has(j) && f.def.needs.every((t) => JUNK[j].tags.includes(t)));
          if (id) tryFit(id, f);
        }
      },
      wrong() {
        const f = s.open.find((x) => !x.done);
        const id = DECADES[s.decade].junk.find((j) => !f.def.needs.every((t) => JUNK[j].tags.includes(t)));
        tryFit(id, f);
      },
    };
  }

  return self;
}
