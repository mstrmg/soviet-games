// HUB: The Ministry Lobby. Click a door, the camera walks you through it.
import * as THREE from 'three';
import { PALETTE } from '../shared/palette.js';
import { fontsReady } from '../shared/fonts.js';
import { el, button, toast, memo } from '../shared/ui.js';
import { DEPARTMENTS, LOBBY_NOTICES } from './departments.js';
import { buildLobby } from './lobby.js';
import { createLobbyFeatures } from './features.js';

let admittedThisSession = false;

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function createHub() {
  const CAM_HOME = new THREE.Vector3(0, 3.7, 12.2);
  const LOOK_HOME = new THREE.Vector3(0, 4.0, -8);

  const s = {
    refs: null,
    pointer: new THREE.Vector2(0, -2), // off-screen until the mouse moves
    pointerPx: { x: 0, y: 0 },
    parallax: new THREE.Vector2(0, 0),
    raycaster: new THREE.Raycaster(),
    hovered: null,
    feature: null, // 'board' | 'clock' when the pointer is on one
    features: null,
    admission: null,
    look: LOOK_HOME.clone(),
    transition: null,
    lastSecond: -1,
    ui: {},
    ctx: null,
  };

  const self = {
    scene: null,
    camera: null,

    async init(ctx) {
      s.ctx = ctx;
      const { scope, layer, audio, save } = ctx;
      await fontsReady();

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x15130f);
      scene.fog = new THREE.Fog(0x15130f, 22, 46);
      const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
      camera.position.copy(CAM_HOME);
      camera.lookAt(LOOK_HOME);
      self.scene = scene;
      self.camera = camera;

      s.refs = buildLobby(scene, DEPARTMENTS, { medals: save.data.medals });

      buildOverlay(ctx);
      s.features = createLobbyFeatures(ctx, s.refs);

      // Input — all listeners go through scope, so they vanish on dispose.
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
        if (s.hovered) enter(s.hovered);
        else if (s.feature === 'board' && !s.transition && !document.querySelector('.memo-wrap')) {
          audio.click();
          s.features.openRegister();
        }
      });
      // Anything at all counts as not being idle. Doing nothing is how the queue moves.
      for (const type of ['pointermove', 'pointerdown', 'wheel', 'keydown']) scope.on(window, type, () => s.features?.onInput(), { passive: true });
      scope.on(window, 'keydown', (e) => {
        if (s.transition || document.querySelector('.memo-wrap')) return;
        const n = Number(e.key);
        if (n >= 1 && n <= DEPARTMENTS.length) enter(s.refs.doors[n - 1]);
      });

      // Ambient room tone, started once audio is unlocked.
      const startAmbience = () => {
        audio.loop('lobby-room', 'room', 0.035);
      };
      if (admittedThisSession) startAmbience();

      if (!admittedThisSession) {
        const m = memo(layer, {
          no: '000001',
          to: 'Citizen Visitor',
          from: 'Duty Officer, Main Lobby',
          subject: 'Admission to the Ministry of Games',
          body: [
            'You are expected. You have always been expected.',
            'Beyond this lobby are three Departments of Approved Leisure. Each is entirely voluntary. Attendance will be recorded.',
            'Please present your permit to the officer, who is on lunch.',
          ],
          stamp: 'ADMITTED',
          buttons: [{ label: 'PRESENT PERMIT', value: true, variant: 'red' }],
        });
        s.admission = m.done.then(() => {
          admittedThisSession = true;
          audio.unlock();
          startAmbience();
        });
      }

      if (import.meta.env.DEV && window.__MOG) {
        window.__MOG.dev = {
          fail: (id = 'nail-quota', label = 'Test failure') => (save.recordFailure(id, label), ctx.goTo('hub')),
          succeed: (id = 'nail-quota', label = 'Test success') => (save.recordSuccess(id, label), ctx.goTo('hub')),
          shuffle: (n = 1) => s.features?.dev.shuffle(n),
        };
      }

      // Rotate the lobby notice board every so often.
      let n = Math.floor(Math.random() * LOBBY_NOTICES.length);
      scope.interval(() => {
        n = (n + 1) % LOBBY_NOTICES.length;
        if (s.ui.notice) {
          s.ui.notice.classList.remove('notice-in');
          void s.ui.notice.offsetWidth;
          s.ui.notice.textContent = LOBBY_NOTICES[n];
          s.ui.notice.classList.add('notice-in');
        }
      }, 9000);
      s.ui.notice.textContent = LOBBY_NOTICES[n];
    },

    /** After the fade-in: admission, then medals, then the clock and the board have their say. */
    async start() {
      const { scope } = s.ctx;
      if (s.admission) await s.admission;
      if (scope.disposed) return;
      const shown = presentNewMedals(s.ctx);
      if (shown) await new Promise((res) => scope.timeout(res, shown * 1600 + 600));
      if (scope.disposed) return;
      await s.features.start();
    },

    update(dt, time) {
      const { refs } = s;
      if (!refs) return;
      const cam = self.camera;

      // --- hover picking (not during the dolly) ---
      if (!s.transition) {
        s.raycaster.setFromCamera(s.pointer, cam);
        const hit = s.raycaster.intersectObjects(refs.hitboxes, false)[0];
        const door = hit ? hit.object.userData.door || null : null;
        const feature = hit ? hit.object.userData.feature || null : null;
        if (door !== s.hovered) setHover(door);
        if (feature !== s.feature) setFeature(feature);
      }

      // --- doors: hover glow, slight ajar, opening ---
      for (const d of refs.doors) {
        const targetHover = d === s.hovered ? 1 : 0;
        d.hover += (targetHover - d.hover) * Math.min(1, dt * 8);
        d.posterMat.emissiveIntensity = 0.05 + d.hover * 0.28;
        d.light.intensity = 6 + d.hover * 8;
        const ajar = d.hover * 0.12;
        d.pivot.rotation.y = Math.max(ajar, d.open * 1.45);
        d.glow.material.opacity = 0.35 + d.hover * 0.35 + d.open * 0.3;
      }
      // the third department's lamp has a loose connection
      const flick = refs.doors[2];
      if (flick && Math.sin(time * 0.9) > 0.86) flick.light.intensity *= Math.random() < 0.5 ? 0.15 : 1;

      // --- camera: idle parallax or dolly through a door ---
      if (s.transition) {
        const tr = s.transition;
        tr.t += dt;
        const p1 = Math.min(1, tr.t / 1.3);
        const p2 = Math.max(0, Math.min(1, (tr.t - 1.1) / 1.0));
        tr.door.open = Math.min(1, Math.max(0, (tr.t - 0.35) / 0.8));
        const e1 = ease(p1);
        const e2 = ease(p2);
        const doorPos = new THREE.Vector3(tr.door.cx, 2.3, -4.2);
        const through = new THREE.Vector3(tr.door.cx, 2.2, -11.5);
        cam.position.lerpVectors(tr.fromPos, doorPos, e1).lerp(through, e2);
        const lookDoor = new THREE.Vector3(tr.door.cx, 2.3, -9);
        s.look.lerpVectors(tr.fromLook, lookDoor, e1);
        cam.lookAt(s.look);
        if (!tr.switched && tr.t > 1.55) {
          tr.switched = true;
          s.ctx.goTo(tr.door.dept.id, { from: 'hub' });
        }
      } else {
        const px = s.pointer.y < -1.5 ? 0 : s.pointer.x;
        const py = s.pointer.y < -1.5 ? 0 : s.pointer.y;
        s.parallax.x += (px - s.parallax.x) * Math.min(1, dt * 2.5);
        s.parallax.y += (py - s.parallax.y) * Math.min(1, dt * 2.5);
        cam.position.set(CAM_HOME.x + s.parallax.x * 0.9, CAM_HOME.y + s.parallax.y * 0.35 + Math.sin(time * 0.6) * 0.03, CAM_HOME.z);
        s.look.set(LOOK_HOME.x + s.parallax.x * 1.6, LOOK_HOME.y + s.parallax.y * 0.8, LOOK_HOME.z);
        cam.lookAt(s.look);
      }

      // --- the clock, the queue and the board ---
      s.features.update(dt, admittedThisSession);

      // --- the leak ---
      const dr = refs.drip;
      if (dr.wait > 0) {
        dr.wait -= dt;
        dr.drop.visible = dr.wait < 0.4; // the drop gathers
      } else {
        dr.v += 9.8 * dt;
        dr.y -= dr.v * dt;
        if (dr.y <= dr.bottom) {
          dr.y = dr.top;
          dr.v = 0;
          dr.wait = 1.6 + Math.random() * 1.8;
          dr.ripple.scale.setScalar(1);
          dr.ripple.material.opacity = 0.8;
          if (admittedThisSession) s.ctx.audio.drip();
        }
      }
      dr.drop.position.y = dr.y;
      if (dr.ripple.material.opacity > 0) {
        dr.ripple.scale.multiplyScalar(1 + dt * 3.2);
        dr.ripple.material.opacity = Math.max(0, dr.ripple.material.opacity - dt * 1.3);
      }

      // --- dust drifting through the light ---
      const pos = refs.dust.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - dt * 0.05;
        if (y < 0) y = 10;
        pos.setY(i, y);
        pos.setX(i, pos.getX(i) + Math.sin(time * 0.3 + i) * dt * 0.03);
      }
      pos.needsUpdate = true;

      // pendant lamps sway very slightly in a draught nobody has located
      refs.pendants.forEach((p, i) => (p.rotation.x = Math.sin(time * 0.5 + i * 2) * 0.012));

      // tooltip follows the pointer
      if (s.ui.tip && (s.hovered || s.feature)) {
        s.ui.tip.style.transform = `translate(${s.pointerPx.x + 18}px, ${s.pointerPx.y + 18}px)`;
      }
    },

    dispose() {
      s.refs = null;
      s.hovered = null;
      s.feature = null;
      s.features = null;
      s.transition = null;
      s.ui = {};
      s.ctx = null;
    },
  };

  function setHover(door) {
    s.hovered = door;
    const canvas = s.ctx.renderer.domElement;
    canvas.style.cursor = door ? 'pointer' : '';
    if (door) s.ctx.audio.click();
    const tip = s.ui.tip;
    if (!tip) return;
    if (!door) {
      tip.classList.remove('show');
      return;
    }
    const earned = s.ctx.save.hasMedal(door.dept.id);
    tip.replaceChildren(
      el('div.tip-kicker', {}, `DEPARTMENT № ${door.dept.number} · ${door.dept.dept}`),
      el('div.tip-title', {}, door.dept.title),
      el('div.tip-body', {}, door.dept.blurb),
      el('div.tip-status', {}, [
        el('span.tag', {}, door.dept.status),
        earned ? el('span.tag.tag-gold', {}, `★ ${door.dept.medal}`) : null,
      ]),
      el('div.tip-hint', {}, 'CLICK TO ENTER'),
    );
    tip.classList.add('show');
  }

  function setFeature(feature) {
    s.feature = feature;
    if (s.hovered) return; // a door's tooltip wins
    const tip = s.ui.tip;
    s.ctx.renderer.domElement.style.cursor = feature === 'board' ? 'pointer' : '';
    if (!tip) return;
    if (!feature) {
      tip.classList.remove('show');
      return;
    }
    tip.replaceChildren(...s.features.tipFor(feature));
    tip.classList.add('show');
  }

  function enter(door) {
    if (!door || s.transition || s.ctx.manager.busy) return;
    if (document.querySelector('.memo-wrap')) return;
    setHover(null);
    s.ctx.audio.unlock();
    s.ctx.audio.stamp();
    setTimeout(() => s.ctx?.audio.creak(), 300);
    s.transition = {
      door,
      t: 0,
      fromPos: self.camera.position.clone(),
      fromLook: s.look.clone(),
      switched: false,
    };
    s.ctx.layer.classList.add('leaving');
  }

  function buildOverlay(ctx) {
    const { layer, save, audio } = ctx;

    const medalsRow = el(
      'div.medal-row',
      {},
      DEPARTMENTS.map((d) =>
        el(
          `div.medal-icon${save.hasMedal(d.id) ? '.earned' : ''}`,
          { title: save.hasMedal(d.id) ? d.medal : `${d.medal} (not yet awarded)` },
          save.hasMedal(d.id) ? '★' : '',
        ),
      ),
    );

    const soundBtn = button(audio.muted ? 'SOUND: OFF' : 'SOUND: ON', () => {
      audio.setMuted(!audio.muted);
      soundBtn.textContent = audio.muted ? 'SOUND: OFF' : 'SOUND: ON';
    }, { variant: 'small' });

    const resetBtn = button('RESET RECORDS', () => {
      const m = memo(layer, {
        no: '0000/R',
        subject: 'Request to erase your personal file',
        body: ['All decorations will be revoked and all achievements will be declared never to have happened.', 'This is routine.'],
        buttons: [
          { label: 'CANCEL', value: false },
          { label: 'ERASE FILE', value: true, variant: 'red' },
        ],
      });
      m.done.then((ok) => {
        if (!ok) return;
        save.reset();
        ctx.goTo('hub');
      });
    }, { variant: 'small' });

    const directory = el('nav.directory', { 'aria-label': 'Departments' }, [
      el('div.dir-title', {}, 'DIRECTORY OF DEPARTMENTS'),
      ...DEPARTMENTS.map((d, i) =>
        el('button.dir-item', { type: 'button', onclick: () => enter(s.refs.doors[i]) }, [
          el('span.dir-num', {}, String(d.number)),
          el('span.dir-name', {}, d.title),
          el('span.dir-medal', {}, save.hasMedal(d.id) ? '★' : '·'),
        ]),
      ),
    ]);

    s.ui.tip = el('div.door-tip', { role: 'tooltip' });
    s.ui.notice = el('div.notice', { role: 'status' });

    layer.append(
      el('header.masthead', {}, [
        el('div.mh-kicker', {}, 'People\'s Directorate of Approved Leisure'),
        el('h1.mh-title', {}, ['MINISTRY', el('br'), 'OF GAMES']),
        el('div.mh-sub', {}, 'Est. 1922 · Rebuilt 1946 · Repairs scheduled'),
      ]),
      el('aside.hud-right', {}, [
        el('div.hud-label', {}, `STATE DECORATIONS · ${save.medalCount()}/${DEPARTMENTS.length}`),
        medalsRow,
        el('div.hud-buttons', {}, [soundBtn, resetBtn]),
      ]),
      directory,
      el('div.notice-board', {}, [el('span.notice-label', {}, 'NOTICE'), s.ui.notice]),
      s.ui.tip,
    );
  }

  function presentNewMedals(ctx) {
    const { save, audio, layer, scope } = ctx;
    const fresh = DEPARTMENTS.filter((d) => save.data.medals[d.id] && !save.data.medals[d.id].presented);
    if (!fresh.length) return 0;
    fresh.forEach((d, i) => {
      scope.timeout(() => {
        audio.fanfare();
        toast(layer, `★ DECORATION AWARDED: ${d.medal.toUpperCase()}`, 3800);
      }, 600 + i * 1600);
    });
    save.update((data) => {
      for (const d of fresh) data.medals[d.id].presented = true;
    });
    return fresh.length;
  }

  return self;
}
