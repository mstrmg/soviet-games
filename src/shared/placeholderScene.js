// A temporary scene for departments that are "under construction".
// It is fully functional as a scene: it exercises init/update/dispose,
// the overlay, the newspaper, and medal saving, so the hub can be tested.
import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { flat } from './renderer.js';
import { el, button, memo } from './ui.js';
import { showNewspaper } from './newspaper.js';

/**
 * @param {object} cfg
 *   id, title, dept, accent (hex), memo: { no, subject, body },
 *   newspaper: { headline, deck, columns, caption },
 *   buildProp(group): add meshes to the group (it slowly rotates)
 */
export function createPlaceholderScene(cfg) {
  return function factory() {
    const state = { prop: null, lamp: null, t: 0 };

    const self = {
      scene: null,
      camera: null,

      async init(ctx) {
        const { scope, layer, audio, save } = ctx;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(PALETTE.black);
        scene.fog = new THREE.Fog(PALETTE.black, 8, 22);
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(0, 3.2, 7.5);
        camera.lookAt(0, 1.6, 0);
        self.scene = scene;
        self.camera = camera;

        // Floor
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), flat(PALETTE.greyDark));
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);

        // Back wall with a giant diagonal red slash
        const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 16), flat(PALETTE.ink));
        wall.position.set(0, 8, -6);
        wall.receiveShadow = true;
        scene.add(wall);
        const slash = new THREE.Mesh(new THREE.PlaneGeometry(30, 2.4), flat(cfg.accent ?? PALETTE.red));
        slash.position.set(0, 5, -5.95);
        slash.rotation.z = 0.32;
        scene.add(slash);

        // Plinth
        const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 1, 8), flat(PALETTE.concrete));
        plinth.position.y = 0.5;
        plinth.castShadow = plinth.receiveShadow = true;
        scene.add(plinth);

        // The department's exhibit
        const prop = new THREE.Group();
        prop.position.y = 1.0;
        cfg.buildProp?.(prop);
        prop.traverse((o) => {
          if (o.isMesh) o.castShadow = o.receiveShadow = true;
        });
        scene.add(prop);
        state.prop = prop;

        // Construction barrier
        const barrier = new THREE.Group();
        const stripeMats = [flat(PALETTE.red), flat(PALETTE.cream)];
        for (let i = 0; i < 8; i++) {
          const s = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.08), stripeMats[i % 2]);
          s.position.set(-1.75 + i * 0.5, 0.9, 0);
          barrier.add(s);
        }
        for (const x of [-1.8, 1.8]) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), flat(PALETTE.greyDark));
          leg.position.set(x, 0.45, 0);
          barrier.add(leg);
        }
        barrier.position.set(0, 0, 2.4);
        barrier.rotation.y = 0.12;
        barrier.traverse((o) => o.isMesh && (o.castShadow = true));
        scene.add(barrier);

        // Light: one hard key light, long shadows, a little fill.
        scene.add(new THREE.HemisphereLight(PALETTE.cream, PALETTE.black, 0.35));
        const key = new THREE.DirectionalLight(0xfff1dc, 2.6);
        key.position.set(-6, 9, 5);
        key.castShadow = true;
        key.shadow.mapSize.set(1024, 1024);
        Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 });
        scene.add(key);
        state.lamp = key;

        // Overlay
        const backToLobby = () => ctx.goTo('hub');
        layer.append(
          el('div.dept-banner', {}, [el('div.dept-kicker', {}, cfg.dept), el('div.dept-title', {}, cfg.title)]),
          el('div.corner-actions', {}, [button('← RETURN TO LOBBY', backToLobby, { variant: 'dark' })]),
        );

        const m = memo(layer, {
          no: cfg.memo.no,
          to: 'Citizen Visitor',
          from: `Director, ${cfg.dept}`,
          subject: cfg.memo.subject,
          body: cfg.memo.body,
          stamp: 'UNDER CONSTRUCTION',
          buttons: [
            { label: 'RETURN TO LOBBY', value: 'back' },
            { label: 'FILE TEST REPORT', value: 'complete', variant: 'red' },
          ],
        });
        m.done.then((choice) => {
          if (scope.disposed) return;
          if (choice === 'back') return backToLobby();
          save.awardMedal(cfg.id, { headline: cfg.newspaper.headline, test: true });
          audio.fanfare();
          const photo = ctx.manager.snapshot();
          const np = showNewspaper(layer, { ...cfg.newspaper, photo });
          np.done.then(() => !scope.disposed && backToLobby());
        });

        scope.on(window, 'keydown', (e) => {
          if (e.key === 'Escape') backToLobby();
        });
      },

      update(dt, time) {
        state.t += dt;
        if (state.prop) state.prop.rotation.y += dt * 0.35;
        if (state.lamp) state.lamp.intensity = 2.6 + Math.sin(time * 23) * 0.05 * (Math.sin(time * 0.7) > 0.9 ? 6 : 0);
      },

      dispose() {
        state.prop = state.lamp = null;
      },
    };
    return self;
  };
}
