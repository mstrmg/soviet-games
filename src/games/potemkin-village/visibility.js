// POTEMKIN VILLAGE — what the Inspector can actually see from his car window.
// Everything is raycast from his eye toward sample points on each object; a facade,
// banner or house in the way blocks the view. Only what he sees has to look good.
import * as THREE from 'three';

export const VIEW = {
  eyeHeight: 1.45,
  halfAngle: THREE.MathUtils.degToRad(40), // how far from straight out of the window he looks (stiff neck)
  range: 42,
  notice: 0.34, // fraction of an object he must see before he registers it at all
};

const ray = new THREE.Raycaster();
const tmp = new THREE.Vector3();

/** Sample the route every `step` metres: [{ pos, fwd }] */
export function sampleRoute(route, step = 1) {
  const out = [];
  for (let i = 0; i < route.length - 1; i++) {
    const a = new THREE.Vector3(route[i][0], 0, route[i][1]);
    const b = new THREE.Vector3(route[i + 1][0], 0, route[i + 1][1]);
    const len = a.distanceTo(b);
    const fwd = b.clone().sub(a).normalize();
    for (let d = 0; d < len; d += step) out.push({ pos: a.clone().addScaledVector(fwd, d), fwd });
  }
  return out;
}

/** Directions the Inspector looks, given the car's forward vector and which windows he uses. */
export function lookDirs(fwd, windows) {
  const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
  const dirs = [];
  if (windows.includes('right')) dirs.push(right);
  if (windows.includes('left')) dirs.push(right.clone().negate());
  return dirs;
}

export function eyeAt(pos, dir) {
  return new THREE.Vector3(pos.x, VIEW.eyeHeight, pos.z).addScaledVector(dir, 0.6);
}

/** Can the eye see world point p (belonging to `own` meshes) looking along dir? */
export function canSee(eye, dir, p, occluders, own) {
  tmp.subVectors(p, eye);
  const dist = tmp.length();
  if (dist > VIEW.range) return false;
  const flatLen = Math.hypot(tmp.x, tmp.z);
  if (flatLen < 0.01) return false;
  const cos = (tmp.x * dir.x + tmp.z * dir.z) / flatLen;
  if (cos < Math.cos(VIEW.halfAngle)) return false;
  ray.set(eye, tmp.divideScalar(dist));
  ray.far = dist - 0.2;
  const hits = ray.intersectObjects(occluders, false);
  for (const h of hits) if (!own || !own.has(h.object)) return false;
  return true;
}

/**
 * How much of each item is visible from this car position?
 * items: [{ worldSamples: Vector3[], own: Set<Mesh> }]
 * Returns Map(item -> fraction of its sample points in view, 0..1); items not seen are absent.
 */
export function visibleItems(pos, fwd, windows, items, occluders) {
  const seen = new Map();
  const dirs = lookDirs(fwd, windows);
  for (const it of items) {
    const n = it.worldSamples.length;
    if (!n) continue;
    let hit = 0;
    for (const p of it.worldSamples) {
      if (dirs.some((dir) => canSee(eyeAt(pos, dir), dir, p, occluders, it.own))) hit++;
    }
    if (hit) seen.set(it, hit / n);
  }
  return seen;
}

/** A ground-level polygon of what he can see at eye height: rays fanned across the view cone. */
export function viewFan(pos, fwd, windows, occluders, rays = 48) {
  const verts = [];
  for (const dir of lookDirs(fwd, windows)) {
    const eye = eyeAt(pos, dir);
    const base = Math.atan2(dir.z, dir.x);
    const pts = [];
    for (let i = 0; i <= rays; i++) {
      const a = base - VIEW.halfAngle + (i / rays) * VIEW.halfAngle * 2;
      const d = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      ray.set(eye, d);
      ray.far = VIEW.range;
      const hit = ray.intersectObjects(occluders, false)[0];
      const len = hit ? hit.distance : VIEW.range;
      pts.push(new THREE.Vector3(eye.x + d.x * len, 0.06, eye.z + d.z * len));
    }
    const o = new THREE.Vector3(eye.x, 0.06, eye.z);
    for (let i = 0; i < pts.length - 1; i++) verts.push(o.x, o.y, o.z, pts[i + 1].x, pts[i + 1].y, pts[i + 1].z, pts[i].x, pts[i].y, pts[i].z);
  }
  return new Float32Array(verts);
}
