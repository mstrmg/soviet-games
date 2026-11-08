// THE HALL: International Hall of Fraternal Nations. The first thing a visitor sees.
// A border checkpoint with three doors, one per wing. Click a door, the barrier lifts.
import * as THREE from 'three';
import './hall.css';
import { fontsReady } from '../shared/fonts.js';
import { el, button, toast, memo } from '../shared/ui.js';
import { WINGS, wingComplete } from '../wings.js';
import { buildHall, ROOM } from './build.js';
import { openPassport, passportBadge } from './passport.js';
import { HALL } from './text.js';

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function createHall() {
  const CAM_HOME = new THREE.Vector3(0, 4.4, 16.5);
  const LOOK_HOME = new THREE.Vector3(0, 4.6, -10);

  const s = {
    ctx: null,
    refs: null,
    pointer: new THREE.Vector2(0, -2),
    pointerPx: { x: 0, y: 0 },
    parallax: new THREE.Vector2(),
    raycaster: new THREE.Raycaster(),
    hovered: null,
    look: LOOK_HOME.clone(),
    transition: null,
    stampT: -1,
    ui: {},
  };

  const self = {
    scene: null,
    camera: null,

    async init(ctx) {
      s.ctx = ctx;
      const { scope, layer, save, audio } = ctx;
      await fontsReady();
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x15130f);
      scene.fog = new THREE.Fog(0x15130f, 30, 60);
      const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 120);
      camera.position.copy(CAM_HOME);
      camera.lookAt(LOOK_HOME);
      self.scene = scene;
      self.camera = camera;

      // Every visit counts. The passport photo improves accordingly.
      save.update((d) => {
        d.hall.visits = (d.hall.visits || 0) + 1;
        if (d.hub.citizenNo == null) d.hub.citizenNo = 100 + Math.floor(Math.random() * 899900);
      });

      s.refs = buildHall(scene, WINGS);
      buildOverlay(ctx);

      const canvas = ctx.renderer.domElement;
      scope.add(() => (canvas.style.cursor = ''));
      scope.on(canvas, 'pointermove', (e) => {
        const r = canvas.getBoundingClientRect();
        s.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        s.pointerPx = { x: e.clientX, y: e.clientY };
      });
      scope.on(canvas, 'pointerleave', () => s.pointer.set(0, -2));
      scope.on(canvas, 'click', () => {
        audio.unlock();
        if (s.hovered != null) enter(s.hovered);
      });
      scope.on(window, 'keydown', (e) => {
        if (s.transition || document.querySelector('.memo-wrap')) return;
        const n = Number(e.key);
        if (n >= 1 && n <= WINGS.length) enter(n - 1);
        if (e.key.toLowerCase() === 'p') showPassport();
      });
      audio.loop('hall-room', 'room', 0.03);

      let n = Math.floor(Math.random() * HALL.notices.length);
      s.ui.notice.textContent = HALL.notices[n];
      scope.interval(() => {
        n = (n + 1) % HALL.notices.length;
        s.ui.notice.textContent = HALL.notices[n];
      }, 9000);
    },

    /** First visit: the guard issues a passport. Later visits: any new visa stamps. */
    async start() {
      const { save, layer, audio, scope } = s.ctx;
      if (!save.data.hall.passportIssuedAt) {
        const m = memo(layer, {
          no: HALL.issue.no,
          to: 'Citizen Visitor',
          from: HALL.issue.from,
          subject: HALL.issue.subject,
          body: HALL.issue.body,
          buttons: [{ label: HALL.issue.button, value: true, variant: 'red' }],
        });
        await m.done;
        if (scope.disposed) return;
        audio.unlock();
        save.update((d) => (d.hall.passportIssuedAt = new Date().toISOString()));
        await stampPassport({ issuing: true });
        return;
      }
      const fresh = WINGS.filter((w) => wingComplete(save, w) && !save.data.hall.stampsSeen.includes(w.id));
      for (const w of fresh) {
        if (scope.disposed) return;
        toast(layer, HALL.newStamp(w), 4000);
        await stampPassport({ freshWing: w.id });
      }
    },

    update(dt, time) {
      const { refs } = s;
      if (!refs) return;
      const cam = self.camera;

      if (!s.transition) {
        s.raycaster.setFromCamera(s.pointer, cam);
        const hit = s.raycaster.intersectObjects(refs.hitboxes, false)[0];
        const door = hit ? hit.object.userData.door : null;
        if (door !== s.hovered) setHover(door);
      }

      refs.doors.forEach((d, i) => {
        d.hover += ((i === s.hovered ? 1 : 0) - d.hover) * Math.min(1, dt * 8);
        d.light.intensity = 10 + d.hover * 14;
        d.glow.material.opacity = 0.45 + d.hover * 0.25 + d.open * 0.3;
        for (const { pivot, side } of d.leaves) pivot.rotation.y = side * Math.max(d.hover * 0.08, d.open * 1.3);
        // the barrier rises a little on hover, all the way on entry
        d.boom.rotation.z = -Math.max(d.hover * 0.12, d.lift ?? 0) * 1.35;
      });

      // the guard watches you; when stamping, the arm comes down hard
      const g = refs.guard;
      g.head.rotation.y = THREE.MathUtils.lerp(g.head.rotation.y, -0.6 + s.parallax.x * 0.5, Math.min(1, dt * 2));
      if (s.stampT >= 0) {
        s.stampT += dt;
        const k = s.stampT;
        g.arm.rotation.x = k < 0.35 ? -0.6 - k * 3 : k < 0.5 ? -1.65 + (k - 0.35) * 10 : -0.6;
        if (k > 0.6) s.stampT = -1;
      }

      if (s.transition) {
        const tr = s.transition;
        tr.t += dt;
        const d = refs.doors[tr.door];
        d.lift = Math.min(1, tr.t / 0.6);
        d.open = Math.min(1, Math.max(0, (tr.t - 0.4) / 0.8));
        const e1 = ease(Math.min(1, tr.t / 1.4));
        const e2 = ease(Math.max(0, Math.min(1, (tr.t - 1.2) / 1.0)));
        const doorPos = new THREE.Vector3(d.cx, 2.8, ROOM.back + 5);
        const through = new THREE.Vector3(d.cx, 2.6, ROOM.back - 7);
        cam.position.lerpVectors(tr.fromPos, doorPos, e1).lerp(through, e2);
        s.look.lerpVectors(tr.fromLook, new THREE.Vector3(d.cx, 2.8, ROOM.back - 6), e1);
        cam.lookAt(s.look);
        if (!tr.switched && tr.t > 1.65) {
          tr.switched = true;
          s.ctx.goTo(d.wing.id, { from: 'hall' });
        }
      } else {
        const px = s.pointer.y < -1.5 ? 0 : s.pointer.x;
        const py = s.pointer.y < -1.5 ? 0 : s.pointer.y;
        s.parallax.x += (px - s.parallax.x) * Math.min(1, dt * 2.5);
        s.parallax.y += (py - s.parallax.y) * Math.min(1, dt * 2.5);
        cam.position.set(CAM_HOME.x + s.parallax.x * 1.2, CAM_HOME.y + s.parallax.y * 0.4 + Math.sin(time * 0.5) * 0.03, CAM_HOME.z);
        s.look.set(LOOK_HOME.x + s.parallax.x * 2, LOOK_HOME.y + s.parallax.y * 0.9, LOOK_HOME.z);
        cam.lookAt(s.look);
      }

      if (s.ui.tip && s.hovered != null) s.ui.tip.style.transform = `translate(${s.pointerPx.x + 18}px, ${s.pointerPx.y + 18}px)`;
    },

    dispose() {
      s.refs = null;
      s.ui = {};
      s.ctx = null;
      s.transition = null;
    },
  };

  function setHover(i) {
    s.hovered = i;
    const canvas = s.ctx.renderer.domElement;
    canvas.style.cursor = i != null ? 'pointer' : '';
    const tip = s.ui.tip;
    if (i == null) return tip.classList.remove('show');
    s.ctx.audio.click();
    const w = WINGS[i];
    const medals = w.DEPARTMENTS.filter((d) => s.ctx.save.hasMedal(d.id)).length;
    tip.replaceChildren(
      el('div.tip-kicker', {}, `FRATERNAL WING · ${w.country}`),
      el('div.tip-title', {}, w.ministry.toUpperCase()),
      el('div.tip-body', {}, w.DEPARTMENTS.map((d) => d.title).join(' · ')),
      el('div.tip-status', {}, [
        el('span.tag', {}, HALL.tip.medals(medals, w.DEPARTMENTS.length)),
        wingComplete(s.ctx.save, w) ? el('span.tag.tag-gold', {}, `★ ${HALL.tip.stamped}`) : null,
      ]),
      el('div.tip-hint', {}, 'CLICK TO PASS THE BARRIER'),
    );
    tip.classList.add('show');
  }

  function enter(i) {
    if (i == null || s.transition || s.ctx.manager.busy || document.querySelector('.memo-wrap')) return;
    setHover(null);
    const { audio } = s.ctx;
    audio.unlock();
    audio.stamp();
    s.stampT = 0;
    setTimeout(() => s.ctx?.audio.creak(), 450);
    s.transition = { door: i, t: 0, fromPos: self.camera.position.clone(), fromLook: s.look.clone(), switched: false };
    s.ctx.layer.classList.add('leaving');
  }

  function showPassport(opts) {
    if (document.querySelector('.memo-wrap')) return null;
    s.ctx.audio.click();
    return openPassport(s.ctx.layer, s.ctx.save, opts);
  }

  /** Open the passport and let a stamp land, with the guard's arm and a thump. */
  async function stampPassport(opts) {
    const { audio, scope, save } = s.ctx;
    await new Promise((res) => scope.timeout(res, 400)); // let the previous paper clear the desk
    if (scope.disposed) return;
    const pp = showPassport(opts);
    if (!pp) return;
    scope.timeout(() => {
      s.stampT = 0;
    }, 600);
    scope.timeout(() => audio.stamp(), 1000);
    if (opts.freshWing) save.update((d) => d.hall.stampsSeen.push(opts.freshWing));
    await pp.done;
    refreshBadge();
  }

  function refreshBadge() {
    const next = passportBadge(s.ctx.save, () => showPassport());
    s.ui.badge.replaceWith(next);
    s.ui.badge = next;
  }

  function buildOverlay(ctx) {
    const { layer, audio, save } = ctx;
    const soundBtn = button(audio.muted ? 'SOUND: OFF' : 'SOUND: ON', () => {
      audio.setMuted(!audio.muted);
      soundBtn.textContent = audio.muted ? 'SOUND: OFF' : 'SOUND: ON';
    }, { variant: 'small' });
    const directory = el('nav.directory', { 'aria-label': 'Wings' }, [
      el('div.dir-title', {}, HALL.directoryTitle),
      ...WINGS.map((w, i) =>
        el('button.dir-item', { type: 'button', onclick: () => enter(i) }, [
          el('span.dir-num', {}, String(i + 1)),
          el('span.dir-name', {}, w.short),
          el('span.dir-medal', {}, wingComplete(save, w) ? '★' : `${w.DEPARTMENTS.filter((d) => save.hasMedal(d.id)).length}/3`),
        ]),
      ),
    ]);
    s.ui.tip = el('div.door-tip', { role: 'tooltip' });
    s.ui.notice = el('div.notice', { role: 'status' });
    s.ui.badge = passportBadge(save, () => showPassport());
    layer.append(
      el('header.masthead.hall-masthead', {}, [
        el('div.mh-kicker', {}, HALL.masthead.kicker),
        el('h1.mh-title', {}, [HALL.masthead.title[0], el('br'), HALL.masthead.title[1]]),
        el('div.mh-sub', {}, HALL.masthead.sub),
      ]),
      el('aside.hud-right', {}, [el('div.hud-label', {}, `VISAS · ${WINGS.filter((w) => wingComplete(save, w)).length}/${WINGS.length}`), el('div.hud-buttons', {}, [soundBtn])]),
      directory,
      el('div.notice-board.hall-notice', {}, [el('span.notice-label', {}, 'NOTICE'), s.ui.notice]),
      s.ui.tip,
      s.ui.badge,
    );
  }

  return self;
}
