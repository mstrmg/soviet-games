// NORTH KOREA WING lobby dressing: lit for foreign cameras. A second giant portrait,
// a wall of plastic flowers that never wilt, loudspeakers, and a window with nothing outside it.
import * as THREE from 'three';
import { flat } from '../../shared/renderer.js';
import { rng } from '../../shared/canvasTexture.js';

export default function dressDprk(scene, { ROOM, mats, box, shadowed, portraitTexture, signTexture }) {
  const { halfW, back, height } = ROOM;
  const group = new THREE.Group();

  // ---- the second portrait, opposite the first, slightly larger -----------------
  const p = new THREE.Group();
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 3.1),
    new THREE.MeshStandardMaterial({
      map: portraitTexture({ bg: ['#d7462f', '#6a1410'], suit: '#2b2f2c', collar: 'tunic', hair: '#151311', moustache: false, glasses: true, medalRows: 0, mouth: 'smile' }),
      roughness: 0.55,
    }),
  );
  face.position.z = 0.06;
  p.add(face);
  const t = 0.24;
  p.add(box(2.5 + t * 2, t, 0.14, mats.gold, 0, 1.55 + t / 2, 0.05), box(2.5 + t * 2, t, 0.14, mats.gold, 0, -1.55 - t / 2, 0.05));
  p.add(box(t, 3.1, 0.14, mats.gold, -1.25 - t / 2, 0, 0.05), box(t, 3.1, 0.14, mats.gold, 1.25 + t / 2, 0, 0.05));
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.42), new THREE.MeshStandardMaterial({ map: signTexture(['THE OTHER LEADER', 'ALSO FIRST IN EVERYTHING'], { width: 640, height: 128, bg: '#1b1a18', fg: '#d9b44a' }) }));
  plate.position.set(0, -2.15, 0.03);
  p.add(plate);
  p.position.set(halfW - 0.05, 6.0, -1.6);
  p.rotation.y = -Math.PI / 2;
  group.add(shadowed(p, false));
  // each portrait has its own lamp, which is never switched off
  for (const [x, z] of [[-halfW + 1.2, -2.6], [halfW - 1.2, -1.6]]) {
    const lamp = new THREE.SpotLight(0xfff0d0, 22, 9, 0.45, 0.5, 1.2);
    lamp.position.set(x, 9.2, z);
    lamp.target.position.set(x > 0 ? halfW : -halfW, 5.8, z);
    group.add(lamp, lamp.target);
  }

  // ---- a wall of plastic flowers, between and beside the doors -------------------
  const r = rng(1948);
  const petals = [0xd8336a, 0xb8288f, 0xe2556f, 0xf08a3c, 0xc23a9e];
  const petalMats = petals.map((c) => flat(c, { roughness: 0.35, emissive: c, emissiveIntensity: 0.12 }));
  const leaf = flat(0x2f7a3a, { roughness: 0.5 });
  const bloomGeo = new THREE.IcosahedronGeometry(0.13, 0);
  const bank = (cx, w) => {
    const g = new THREE.Group();
    g.add(box(w, 0.9, 0.7, leaf, 0, 0.45, 0));
    const n = Math.round(w * 26);
    for (let i = 0; i < n; i++) {
      const b = new THREE.Mesh(bloomGeo, petalMats[Math.floor(r() * petalMats.length)]);
      b.position.set((r() - 0.5) * w, 0.55 + r() * 0.45, 0.1 + r() * 0.28);
      b.scale.setScalar(0.8 + r() * 0.6);
      g.add(b);
    }
    g.position.set(cx, 0, back + 0.55);
    return g;
  };
  for (const [cx, w] of [[-9.1, 2.6], [-3, 2.6], [3, 2.6], [9.1, 2.6]]) group.add(shadowed(bank(cx, w), false));
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.32), new THREE.MeshStandardMaterial({ map: signTexture(['IN FULL BLOOM', 'SINCE THE BEGINNING'], { width: 480, height: 104, bg: '#f4efe6', fg: '#a3151c' }) }));
  tag.position.set(-3, 1.05, back + 0.91);
  group.add(tag);

  // ---- loudspeakers in the corners, playing the march -----------------------------
  const horn = new THREE.ConeGeometry(0.42, 0.9, 10, 1, true);
  const hornMat = flat(0x9aa3a0, { metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide });
  const speakers = [];
  for (const sx of [-1, 1]) {
    const s = new THREE.Mesh(horn, hornMat);
    s.position.set(sx * (halfW - 0.8), height - 1.1, back + 1.2);
    s.rotation.z = sx * -1.1;
    s.rotation.x = 0.5;
    group.add(s);
    speakers.push(s);
  }

  // ---- the window (back wall, by the third door), curtained, with a notice ----------------------------------------
  const win = new THREE.Group();
  const curtainMat = flat(0x7a1218, { roughness: 1 });
  for (let k = 0; k < 5; k++) win.add(box(0.36, 2.8, 0.1 + (k % 2) * 0.08, curtainMat, -0.74 + k * 0.37, 0, 0));
  win.add(box(2.0, 0.14, 0.2, mats.gold, 0, 1.48, 0));
  const note = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.5), new THREE.MeshStandardMaterial({ map: signTexture(['PLEASE DO NOT LOOK', 'THERE IS NOTHING THERE · IT IS VERY IMPRESSIVE'], { width: 560, height: 200, bg: '#f4efe6', fg: '#1b1a18' }) }));
  note.position.set(0, -0.3, 0.16);
  win.add(note);
  win.position.set(9.7, 5.6, back + 0.12);
  group.add(shadowed(win, false));

  scene.add(group);
  return {
    tick(dt, time) {
      // the speakers throb gently in time with a march nobody chose
      const beat = Math.max(0, Math.sin(time * Math.PI * 2 * 1.1)) ** 6;
      for (const s of speakers) s.scale.setScalar(1 + beat * 0.05);
    },
  };
}
