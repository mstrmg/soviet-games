// A Scope collects everything a scene creates that must be torn down later:
// event listeners, timers, animation frames, and anything with dispose().
// Calling scope.dispose() releases all of it in reverse order.
export class Scope {
  constructor() {
    this._cleanups = [];
    this.disposed = false;
  }

  /** addEventListener that is removed automatically on dispose. */
  on(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    this._cleanups.push(() => target.removeEventListener(type, handler, options));
    return handler;
  }

  timeout(fn, ms) {
    const id = setTimeout(() => {
      if (!this.disposed) fn();
    }, ms);
    this._cleanups.push(() => clearTimeout(id));
    return id;
  }

  interval(fn, ms) {
    const id = setInterval(fn, ms);
    this._cleanups.push(() => clearInterval(id));
    return id;
  }

  /** Track a Three.js resource (geometry, material, texture, render target...). */
  track(resource) {
    if (resource && typeof resource.dispose === 'function') {
      this._cleanups.push(() => resource.dispose());
    }
    return resource;
  }

  /** Register an arbitrary cleanup function. */
  add(fn) {
    this._cleanups.push(fn);
    return fn;
  }

  dispose() {
    this.disposed = true;
    while (this._cleanups.length) {
      const fn = this._cleanups.pop();
      try {
        fn();
      } catch (err) {
        console.warn('[scope] cleanup failed', err);
      }
    }
  }
}
