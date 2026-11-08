// MASS GAMES — the stadium at night: a stand of participants holding cards, conductors with
// flags at the end of every row and the foot of every column, floodlights, a field, a track.
import * as THREE from 'three';
import { flat } from '../../shared/renderer.js';
import { rng } from '../../shared/canvasTexture.js';

export const MAX_W = 16;
export const MAX_H = 12;
export const STEP_X = 1.0;
export const RISE = 0.62;
export const DEPTH = 0.85;

/** World position of card (c, r) in a w×h image; r = 0 is the top row of the image. */
export function cardPos(c, r, w, h, out = new THREE.Vector3()) {
  const up = h - 1 - r;
  return out.set((c - (w - 1) / 2) * STEP_X, 1.2 + up * RISE, -up * DEPTH);
}

export function buildStadium(scene) {
  const refs = {};
  const concrete = flat(0x6b6a66);
  const concreteDark = flat(0x4a4946);
  // the stand: one long step per row, well beyond the image on both sides
  for (let k = 0; k < MAX_H + 3; k++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(70, 0.62, 0.85), k % 2 ? concrete : concreteDark);
    step.position.set(0, 0.6 + (k - 1) * RISE, -(k - 1) * DEPTH - 0.3);
    step.receiveShadow = true;
    scene.add(step);
  }
  // the rest of the hundred thousand: static cards either side, forming a red field with gold stars
  const r = rng(77);
  const side = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.9, 0.05), new THREE.MeshLambertMaterial(), 2 * 12 * MAX_H);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.35, 0, 0));
  const col = new THREE.Color();
  let n = 0;
  for (const sgn of [-1, 1]) {
    for (let c = 0; c < 12; c++) {
      for (let row = 0; row < MAX_H; row++) {
        const p = cardPos(0, row, 1, MAX_H);
        p.x = sgn * (MAX_W / 2 + 2.4 + c * STEP_X);
        m4.compose(p, q, new THREE.Vector3(1, 1, 1));
        side.setMatrixAt(n, m4);
        const star = (c === 5 || c === 6) && (row === 5 || row === 6);
        col.setHex(star ? 0xe9b949 : r() < 0.04 ? 0xa31f25 : 0xc1272d);
        side.setColorAt(n, col);
        n++;
      }
    }
  }
  scene.add(side);

  // field and track
  const field = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), flat(0x2f5e34));
  field.rotation.x = -Math.PI / 2;
  field.position.set(0, 0, 24);
  scene.add(field);
  const track = new THREE.Mesh(new THREE.RingGeometry(12, 15, 48, 1, 0, Math.PI), flat(0x8a4a33));
  track.rotation.x = -Math.PI / 2;
  track.position.set(0, 0.01, 22);
  track.scale.set(2, 1, 1);
  scene.add(track);

  // floodlight towers
  for (const sx of [-1, 1]) {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.5, 16, 0.5), concreteDark);
    tower.position.set(sx * 22, 8, 2);
    const head = new THREE.Mesh(new THREE.BoxGeometry(3, 1.6, 0.4), new THREE.MeshBasicMaterial({ color: 0xfff6dc }));
    head.position.set(sx * 22, 16.4, 2.3);
    scene.add(tower, head);
  }
  return refs;
}

/** A conductor's flag: pole, red flag, and an invisible box for the pointer. */
export function buildFlag(kind, index) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 5), flat(0xd9d4c4));
  pole.position.y = 0.45;
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.34), new THREE.MeshLambertMaterial({ color: 0xc1272d, side: THREE.DoubleSide, emissive: 0x330000 }));
  cloth.position.set(0.26, 0.74, 0);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.6), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 0.5;
  hit.userData.signal = { kind, index };
  g.add(pole, cloth, hit);
  g.userData.cloth = cloth;
  g.userData.hit = hit;
  return g;
}
