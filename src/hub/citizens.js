// Low-poly citizens for the queue. They are waiting. They have always been waiting.
import * as THREE from 'three';
import { flat } from '../shared/renderer.js';
import { PALETTE } from '../shared/palette.js';
import { rng } from '../shared/canvasTexture.js';

export function buildQueue({ count = 20, x = 9.7, zStart = -4.3, spacing = 0.92, seed = 1984 } = {}) {
  const r = rng(seed);
  const group = new THREE.Group();
  group.name = 'queue';

  // Shared geometry: one set for the whole queue.
  const geo = {
    coat: new THREE.CylinderGeometry(0.25, 0.36, 1.15, 6),
    shoulders: new THREE.CylinderGeometry(0.2, 0.26, 0.18, 6),
    leg: new THREE.BoxGeometry(0.11, 0.5, 0.13),
    head: new THREE.IcosahedronGeometry(0.15, 0),
    ushanka: new THREE.BoxGeometry(0.36, 0.17, 0.34),
    flap: new THREE.BoxGeometry(0.06, 0.16, 0.18),
    cap: new THREE.CylinderGeometry(0.17, 0.17, 0.07, 8),
    scarf: new THREE.ConeGeometry(0.22, 0.32, 6),
    bag: new THREE.BoxGeometry(0.22, 0.22, 0.08),
    paper: new THREE.BoxGeometry(0.34, 0.24, 0.01),
  };
  const coats = [0x3d3a36, 0x4a4238, 0x2f3236, 0x5b4c3e, 0x3e4a42, 0x55524b, 0x6a2a26].map((c) => flat(c));
  const mats = {
    skin: [flat(0xc9a587), flat(0xb48c6e), flat(0xd6b597)],
    dark: flat(0x1f1d1b),
    fur: flat(0x5a4a3c),
    scarf: [flat(PALETTE.red), flat(0x6d6a8a), flat(0x8a7a5a)],
    cream: flat(PALETTE.cream),
    bag: flat(0x8a7a5a),
  };

  for (let i = 0; i < count; i++) {
    const p = new THREE.Group();
    const h = 0.9 + r() * 0.16;
    const coatMat = coats[Math.floor(r() * coats.length)];
    const coat = new THREE.Mesh(geo.coat, coatMat);
    coat.position.y = 0.5 + 0.575;
    const shoulders = new THREE.Mesh(geo.shoulders, coatMat);
    shoulders.position.y = 1.72;
    const legL = new THREE.Mesh(geo.leg, mats.dark);
    legL.position.set(-0.1, 0.25, 0);
    const legR = legL.clone();
    legR.position.x = 0.1;
    const head = new THREE.Mesh(geo.head, mats.skin[Math.floor(r() * 3)]);
    head.position.y = 1.95;
    p.add(coat, shoulders, legL, legR, head);

    const hat = r();
    if (hat < 0.4) {
      const u = new THREE.Mesh(geo.ushanka, mats.fur);
      u.position.y = 2.07;
      const fl = new THREE.Mesh(geo.flap, mats.fur);
      fl.position.set(-0.17, 1.95, 0);
      const fr = fl.clone();
      fr.position.x = 0.17;
      p.add(u, fl, fr);
    } else if (hat < 0.7) {
      const s = new THREE.Mesh(geo.scarf, mats.scarf[Math.floor(r() * 3)]);
      s.position.y = 2.0;
      p.add(s);
    } else {
      const c = new THREE.Mesh(geo.cap, mats.dark);
      c.position.set(0, 2.08, -0.03);
      p.add(c);
    }

    const prop = r();
    if (prop < 0.3) {
      const bag = new THREE.Mesh(geo.bag, mats.bag);
      bag.position.set(0.33, 0.85, 0);
      p.add(bag);
    } else if (prop < 0.42) {
      // reading yesterday's good news
      const paper = new THREE.Mesh(geo.paper, mats.cream);
      paper.position.set(0, 1.55, -0.35);
      paper.rotation.x = -0.4;
      p.add(paper);
    }

    p.scale.setScalar(h);
    // Facing the closed window (toward -z), with small idle variations frozen in time.
    p.rotation.y = (r() - 0.5) * 0.5;
    p.rotation.z = (r() - 0.5) * 0.06;
    if (i === 6) p.rotation.z = 0.16; // this one has been asleep since spring
    p.position.set(x + (r() - 0.5) * 0.35, 0, zStart + i * spacing + (r() - 0.5) * 0.15);
    p.traverse((o) => {
      if (o.isMesh) o.castShadow = o.receiveShadow = true;
    });
    group.add(p);
  }
  return group;
}
