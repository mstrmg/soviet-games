// CUBA WING lobby dressing: a 1950s sedan on blocks (indoors, for safekeeping), a ceiling fan
// that turns once every few seconds, a ration board with nothing available, and a ladder
// beside the slogan for whoever finishes the last word.
import * as THREE from 'three';
import { flat } from '../../shared/renderer.js';
import { canvasTexture } from '../../shared/canvasTexture.js';

const RATIONS = [
  ['ARROZ', 'rice', '5 lb'],
  ['FRIJOLES', 'beans', '10 oz'],
  ['AZÚCAR', 'sugar', '4 lb'],
  ['ACEITE', 'oil', '½ lb'],
  ['CAFÉ', 'coffee', '4 oz'],
  ['JABÓN', 'soap', '1'],
  ['HUEVOS', 'eggs', '5'],
  ['PESCADO', 'fish', 'some'],
];

function rationBoardTexture() {
  return canvasTexture(512, 640, (ctx, w, h) => {
    ctx.fillStyle = '#1f2a26';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#8a6a3a';
    ctx.lineWidth = 18;
    ctx.strokeRect(9, 9, w - 18, h - 18);
    ctx.fillStyle = '#efe8d4';
    ctx.textAlign = 'center';
    ctx.font = '600 44px "Oswald", "Arial Narrow", sans-serif';
    ctx.fillText('BODEGA No. 14', w / 2, 72);
    ctx.font = '22px "Courier New", monospace';
    ctx.fillText('THIS MONTH YOU ARE ENTITLED TO:', w / 2, 112);
    RATIONS.forEach(([es, en, qty], i) => {
      const y = 170 + i * 56;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#efe8d4';
      ctx.font = '30px "Courier New", monospace';
      ctx.fillText(`${es} ${qty}`, 40, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#f2a33a';
      ctx.font = '600 30px "Oswald", "Arial Narrow", sans-serif';
      ctx.fillText(i === 2 ? 'NEXT WEEK' : 'NO HAY', w - 40, y);
      // chalk smudges where something was once written and wiped
      ctx.fillStyle = 'rgba(239,232,212,0.07)';
      ctx.fillRect(w - 210, y - 26, 170, 34);
    });
    ctx.textAlign = 'center';
    ctx.fillStyle = '#efe8d4';
    ctx.font = 'italic 20px "Courier New", monospace';
    ctx.fillText('(no hay = there is none)', w / 2, h - 34);
  });
}

function buildSedan() {
  const g = new THREE.Group();
  const body = flat(0x5fb8b0, { roughness: 0.45, metalness: 0.15 });
  const cream = flat(0xf1e6c8, { roughness: 0.45 });
  const chrome = flat(0xd9dde0, { metalness: 0.85, roughness: 0.25 });
  const glass = flat(0x22343a, { roughness: 0.1, metalness: 0.3 });
  const rust = flat(0x8a4a2a, { roughness: 1 });
  const add = (w, h, d, m, x, y, z) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    b.position.set(x, y, z);
    g.add(b);
    return b;
  };
  add(4.9, 0.55, 1.9, body, 0, 0.85, 0); // lower body
  add(2.2, 0.46, 1.66, glass, -0.15, 1.35, 0); // cabin
  add(2.4, 0.1, 1.76, cream, -0.15, 1.62, 0); // roof, two-tone
  for (const x of [-1.2, 0.9]) for (const z of [-0.8, 0.8]) add(0.08, 0.46, 0.08, cream, x, 1.35, z); // pillars
  add(5.0, 0.12, 1.96, chrome, 0, 0.6, 0); // bumper line
  // tail fins: the reason for the whole decade
  for (const z of [-0.8, 0.8]) {
    const fin = add(1.1, 0.32, 0.12, body, -2.1, 1.25, z);
    fin.rotation.z = -0.25;
  }
  add(0.4, 0.3, 0.3, rust, 1.3, 0.75, 0.96); // a patch of the original metal
  // no wheels: they are on loan. Cinder blocks instead.
  const block = flat(0x9a948a, { roughness: 1 });
  for (const x of [-1.6, 1.6]) for (const z of [-0.75, 0.75]) add(0.5, 0.58, 0.42, block, x, 0.29, z);
  // one wheel kept, leaning against it, for morale
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.22, 14), flat(0x1b1b1b, { roughness: 0.9 }));
  wheel.rotation.x = Math.PI / 2;
  wheel.rotation.y = 0.3;
  wheel.position.set(1.0, 0.42, 1.25);
  g.add(wheel);
  return g;
}

export default function dressCuba(scene, { ROOM, mats, box, shadowed, signTexture }) {
  const { halfW, back, height } = ROOM;
  const group = new THREE.Group();

  // ---- the sedan, indoors, on blocks ---------------------------------------------
  const car = buildSedan();
  car.position.set(-4.0, 0, -0.4);
  car.rotation.y = 0.75;
  group.add(shadowed(car));
  const carSign = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.4), new THREE.MeshStandardMaterial({ map: signTexture(['IN SERVICE', 'SINCE 1958 · AWAITING ONE PART'], { width: 480, height: 150, bg: '#f1e6c8', fg: '#1b1a18' }) }));
  carSign.position.set(-2.2, 0.5, 1.3);
  carSign.rotation.set(-0.5, 0.5, 0);
  group.add(carSign);

  // ---- the ration board ----------------------------------------------------------
  const board = new THREE.Group();
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.0), new THREE.MeshStandardMaterial({ map: rationBoardTexture(), roughness: 0.95 }));
  face.position.set(0, 2.0, 0.04);
  board.add(face);
  board.add(box(1.75, 2.15, 0.06, mats.woodDark, 0, 2.0, 0));
  for (const sx of [-0.6, 0.6]) {
    const leg = box(0.08, 3.0, 0.08, mats.wood, sx, 1.4, -0.3);
    leg.rotation.x = 0.15;
    board.add(leg);
  }
  board.position.set(4.5, 0, 2.6);
  board.rotation.y = -0.4;
  group.add(shadowed(board));

  // ---- the ceiling fan -----------------------------------------------------------
  const fan = new THREE.Group();
  const rod = box(0.06, 1.6, 0.06, mats.brass, 0, -0.8, 0);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.25, 10), mats.brass);
  hub.position.y = -1.65;
  fan.add(rod, hub);
  const blades = new THREE.Group();
  blades.position.y = -1.7;
  const bladeMat = flat(0x8a6a44, { roughness: 0.7 });
  for (let k = 0; k < 4; k++) {
    const b = box(1.5, 0.04, 0.32, bladeMat, 0.9, 0, 0);
    const arm = new THREE.Group();
    arm.rotation.y = (k / 4) * Math.PI * 2;
    b.rotation.x = 0.12;
    arm.add(b);
    blades.add(arm);
  }
  fan.add(blades);
  fan.position.set(2.6, height, -1.0);
  group.add(fan);

  // ---- a ladder and a paint tin, for the last word of the slogan -----------------
  const ladder = new THREE.Group();
  for (const sx of [-0.28, 0.28]) ladder.add(box(0.08, 8.6, 0.08, mats.wood, sx, 4.3, 0));
  for (let k = 0; k < 20; k++) ladder.add(box(0.56, 0.05, 0.06, mats.wood, 0, 0.4 + k * 0.42, 0));
  ladder.position.set(7.4, 0, back + 1.2);
  ladder.rotation.x = -0.1;
  group.add(shadowed(ladder));
  const tin = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.24, 10), flat(0x6fa0b8, { metalness: 0.4 }));
  tin.position.set(7.4, 0.12, back + 2.3);
  const drip = new THREE.Mesh(new THREE.CircleGeometry(0.35, 9), flat(0x2a5c8a, { roughness: 0.2 }));
  drip.rotation.x = -Math.PI / 2;
  drip.position.set(7.6, 0.006, back + 2.6);
  group.add(tin, drip);

  scene.add(group);
  let wait = 2;
  let turn = 0;
  return {
    tick(dt) {
      // the fan turns once, then rests, then turns once
      if (turn > 0) {
        const step = Math.min(turn, dt * 3.2);
        blades.rotation.y += step;
        turn -= step;
      } else if ((wait -= dt) <= 0) {
        turn = Math.PI / 2;
        wait = 3 + Math.random() * 2;
      }
    },
  };
}
