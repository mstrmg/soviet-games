// Stand-ins for the six new games until each one is built. They work end to end
// (memo, test report, medal, newspaper) so the wings and the passport can be tested.
import * as THREE from 'three';
import { createPlaceholderScene } from '../shared/placeholderScene.js';
import { flat } from '../shared/renderer.js';
import { PALETTE } from '../shared/palette.js';
import { departmentById, wingOf } from '../wings.js';

const props = {
  furnace(g) {
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 1.4, 8), flat(0x7a5a44)));
    const glow = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.1), new THREE.MeshBasicMaterial({ color: 0xf08a24 }));
    glow.position.set(0, -0.2, 0.85);
    g.add(glow);
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.4, 6), flat(PALETTE.greyDark));
    chimney.position.y = 1.3;
    g.add(chimney);
  },
  wheat(g) {
    for (let i = 0; i < 9; i++) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 4), flat(PALETTE.gold));
      s.position.set(Math.cos(i) * 0.4, 0.4, Math.sin(i) * 0.4);
      s.rotation.z = (i - 4) * 0.06;
      g.add(s);
    }
  },
  sparrow(g) {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), flat(0x7a5a44));
    body.scale.set(1.4, 1, 1);
    body.position.y = 0.6;
    g.add(body);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 1.2), flat(0x5a4030));
    wing.position.y = 0.75;
    g.add(wing);
  },
  car(g) {
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.9), flat(0x8fb3a8)));
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.45, 0.85), flat(0xd9d2c0));
    cab.position.y = 0.45;
    g.add(cab);
  },
  ear(g) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.12, 6, 12, Math.PI * 1.4), flat(PALETTE.skin));
    t.position.y = 0.8;
    g.add(t);
  },
  microphone(g) {
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), flat(PALETTE.greyDark));
    head.position.y = 1.4;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6), flat(PALETTE.black));
    stem.position.y = 0.7;
    g.add(head, stem);
  },
};

export function placeholderFor(gameId) {
  const d = departmentById(gameId);
  const w = wingOf(gameId);
  return createPlaceholderScene({
    id: d.id,
    title: d.title,
    dept: d.dept,
    accent: PALETTE.red,
    memo: {
      no: `${w.id.toUpperCase()}-${d.number}/0`,
      subject: `${d.title}: department not yet open`,
      body: [d.blurb, 'This department is under construction. Construction is proceeding according to plan. The plan is under construction.'],
    },
    newspaper: {
      headline: `${d.title} OPENS AHEAD OF SCHEDULE`,
      deck: 'Visitors praise the department, which is not yet built',
      columns: [`The ${d.dept} has opened its doors, which are the only part completed so far.`, 'A test report was filed and found to be in order.'],
      caption: 'The department, as it will appear.',
    },
    buildProp: props[d.poster.motif],
  });
}
