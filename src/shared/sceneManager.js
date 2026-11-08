// The Scene Manager. One scene runs at a time. Switching scenes fades to black,
// fully disposes the old scene (geometries, materials, textures, listeners,
// timers, overlay UI, audio loops), then loads and initialises the next.
//
// A scene module's default export is a factory returning:
//   {
//     scene: THREE.Scene, camera: THREE.Camera,   // set during init
//     init(ctx)        // may be async; build everything here (never wait on the player)
//     start()          // optional; runs after the fade-in. Opening memos and other player waits go here
//     update(dt, time) // called every frame
//     dispose()        // release anything not covered by ctx.scope / the scene graph
//     resize?(w, h)    // optional
//   }
//
// ctx = { renderer, manager, scope, layer, audio, save, params, goTo(id, params) }
//   scope  - register listeners / timers / resources here and they are freed for you
//   layer  - this scene's own HTML overlay element
import * as THREE from 'three';
import { Scope } from './scope.js';
import { disposeObject3D } from './dispose.js';
import { createLayer } from './ui.js';
import { audio } from './audio.js';
import { save } from './save.js';

export class SceneManager {
  constructor({ renderer, container, fadeEl }) {
    this.renderer = renderer;
    this.container = container;
    this.fadeEl = fadeEl;
    this.registry = new Map();
    this.current = null;
    this.currentId = null;
    this.busy = false;
    this.timer = new THREE.Timer();
    this.elapsed = 0;
    this._raf = 0;
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
  }

  /** Register a scene id with a lazy loader: () => import('./path.js'). */
  register(id, loader, meta = {}) {
    this.registry.set(id, { loader, meta });
    return this;
  }

  has(id) {
    return this.registry.has(id);
  }

  async switchTo(id, params = {}) {
    if (this.busy) return false;
    if (!this.registry.has(id)) {
      console.warn(`[scenes] unknown scene "${id}", returning to hub`);
      id = 'hub';
    }
    this.busy = true;
    try {
      await this.fade(1, this.current ? 450 : 0);
      this._disposeCurrent();

      const { loader } = this.registry.get(id);
      const mod = await loader();
      const instance = mod.default();
      const scope = new Scope();
      const layer = createLayer(`scene-${id}`);
      const ctx = {
        renderer: this.renderer,
        manager: this,
        scope,
        layer,
        audio,
        save,
        params,
        goTo: (next, p) => this.switchTo(next, p),
      };
      this.current = { id, instance, scope, layer };
      this.currentId = id;
      await instance.init(ctx);
      this.resize();
      if (location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`);
      this.render();
      await this.fade(0, 600);
      // start() runs after the fade-in: anything that waits on the player belongs there, not in init().
      if (instance.start && this.current?.instance === instance) Promise.resolve(instance.start()).catch((err) => console.error(err));
      return true;
    } catch (err) {
      console.error(`[scenes] failed to load "${id}"`, err);
      await this.fade(0, 300);
      return false;
    } finally {
      this.busy = false;
    }
  }

  _disposeCurrent() {
    const cur = this.current;
    if (!cur) return;
    this.current = null;
    try {
      cur.instance.dispose?.();
    } catch (err) {
      console.warn('[scenes] dispose() threw', err);
    }
    cur.scope.dispose();
    disposeObject3D(cur.instance.scene);
    cur.layer.remove();
    audio.stopAllLoops();
    this.renderer.renderLists.dispose();
    if (import.meta.env.DEV) {
      const { geometries, textures } = this.renderer.info.memory;
      console.debug(`[scenes] disposed "${cur.id}" → GPU geometries: ${geometries}, textures: ${textures}`);
    }
  }

  fade(to, ms) {
    const el = this.fadeEl;
    if (!el) return Promise.resolve();
    el.style.transitionDuration = `${ms}ms`;
    el.style.opacity = String(to);
    el.style.pointerEvents = to > 0 ? 'auto' : 'none';
    return new Promise((r) => setTimeout(r, ms + 20));
  }

  start() {
    const loop = () => {
      this._raf = requestAnimationFrame(loop);
      this.timer.update();
      const dt = Math.min(this.timer.getDelta(), 0.1);
      this.elapsed += dt;
      const cur = this.current;
      if (cur && !this.busy) cur.instance.update?.(dt, this.elapsed);
      this.render();
    };
    loop();
  }

  render() {
    const inst = this.current?.instance;
    if (inst?.scene && inst?.camera) this.renderer.render(inst.scene, inst.camera);
  }

  /** Render immediately and return the frame as a data URL (for newspaper photos). */
  snapshot(type = 'image/jpeg', quality = 0.85) {
    this.render();
    return this.renderer.domElement.toDataURL(type, quality);
  }

  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    const inst = this.current?.instance;
    if (inst?.camera?.isPerspectiveCamera) {
      inst.camera.aspect = w / h;
      inst.camera.updateProjectionMatrix();
    }
    inst?.resize?.(w, h);
  }
}
