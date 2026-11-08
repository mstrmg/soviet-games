// SPARROW CAMPAIGN · the world: a rooftop at dawn over a village and its fields,
// neighbours on other roofs with flags and pots, sparrows, and later, locusts.
import * as THREE from 'three';
import { flat } from '../../shared/renderer.js';
import { PALETTE, CSS, FONTS } from '../../shared/palette.js';
import { canvasTexture, rng, fitText } from '../../shared/canvasTexture.js';

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

function skyTexture() {
  return canvasTexture(16, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#6f8fae');
    g.addColorStop(0.55, '#d9c3a0');
    g.addColorStop(0.75, '#f0b27a');
    g.addColorStop(1, '#f6d7a8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

function fieldTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const r = rng(58);
    const cols = ['#c9a94a', '#b8973c', '#8a9a48', '#d4b85a', '#a08a3a'];
    let y = 0;
    while (y < h) {
      const bh = 20 + r() * 50;
      ctx.fillStyle = cols[Math.floor(r() * cols.length)];
      ctx.fillRect(0, y, w, bh);
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      for (let x = 0; x < w; x += 6) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 2, y + bh);
        ctx.stroke();
      }
      y += bh;
    }
  }, { repeat: [3, 3] });
}

function flagTexture(text) {
  return canvasTexture(256, 160, (ctx, w, h) => {
    ctx.fillStyle = CSS.red;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = CSS.gold;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? 12 : 30;
      ctx[i ? 'lineTo' : 'moveTo'](46 + Math.cos(a) * rr, 46 + Math.sin(a) * rr);
    }
    ctx.fill();
    ctx.font = `${fitText(ctx, text, w - 40, 40, FONTS.display)}px ${FONTS.display}`;
    ctx.textAlign = 'center';
    ctx.fillText(text, w / 2 + 20, h - 30);
  });
}

/** A low house with a tiled roof. Returns the group; `top` is the roof ridge height. */
function house(m, w, d, h, r) {
  const g = new THREE.Group();
  g.add(box(w, h, d, r() < 0.5 ? m.wall : m.wall2, 0, h / 2, 0));
  const roofH = 1.2;
  const roofGeo = new THREE.CylinderGeometry(0.01, 1, 1, 4, 1);
  roofGeo.rotateY(Math.PI / 4);
  const roof = new THREE.Mesh(roofGeo, r() < 0.5 ? m.roof : m.roof2);
  roof.scale.set(w * 0.78, roofH, d * 0.78);
  roof.position.y = h + roofH / 2;
  g.add(roof);
  return g;
}

/** A neighbour on a roof, with a flag or a pot. They keep the birds in the air. */
function neighbour(m, kind, flagMat, seed) {
  const g = new THREE.Group();
  const coat = [m.coatBlue, m.coatGrey, m.coatRed][seed % 3];
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.0, 6), coat);
  body.position.y = 0.6;
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), m.skin);
  head.position.y = 1.28;
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 8), m.dark);
  hat.position.y = 1.42;
  g.add(body, head, hat);
  const arm = new THREE.Group();
  arm.position.set(0.24, 1.0, 0);
  arm.add(box(0.1, 0.55, 0.1, coat, 0, 0.27, 0));
  g.add(arm);
  let flag = null;
  if (kind === 'flag') {
    const pole = box(0.05, 2.2, 0.05, m.wood, 0, 1.0, 0);
    arm.add(pole);
    const geo = new THREE.PlaneGeometry(1.3, 0.8, 8, 1);
    geo.translate(0.65, 0, 0);
    flag = new THREE.Mesh(geo, flagMat);
    flag.position.set(0.02, 1.7, 0);
    flag.userData.base = geo.attributes.position.array.slice();
    arm.add(flag);
  } else {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.22, 10), m.metal);
    pot.position.set(-0.28, 0.95, 0.15);
    g.add(pot);
    arm.add(box(0.04, 0.4, 0.04, m.wood, 0, 0.6, 0)); // the spoon
  }
  return { group: g, arm, flag, kind, phase: seed * 1.37 };
}

export function makeMaterials() {
  return {
    wall: flat(0xb9a07e),
    wall2: flat(0xa58a68),
    roof: flat(0x5a4a44),
    roof2: flat(0x6a3a2c),
    wood: flat(PALETTE.wood),
    dark: flat(PALETTE.black),
    skin: flat(PALETTE.skin),
    coatBlue: flat(0x3d5a7a),
    coatGrey: flat(0x6a6a62),
    coatRed: flat(0x8a2a24),
    metal: flat(0x8a9096, { metalness: 0.6, roughness: 0.4 }),
    tile: flat(0x6b4a3a),
    bird: flat(0x7a5a40),
    birdWing: flat(0x5a4030),
    grass: flat(0x7a8a48),
    hill: flat(0x6a7a58),
    hill2: flat(0x8a8a6a),
    steel: flat(0x2a2a2a, { metalness: 0.5, roughness: 0.5 }),
    stock: flat(0x6a4028, { roughness: 0.6 }),
  };
}

export function buildWorld(scene, m) {
  const refs = { neighbours: [], flags: [] };
  const r = rng(1958);

  // sky dome
  const sky = new THREE.Mesh(new THREE.SphereGeometry(160, 16, 12), new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, fog: false }));
  scene.add(sky);
  const sun = new THREE.Mesh(new THREE.CircleGeometry(6, 24), new THREE.MeshBasicMaterial({ color: 0xffe2a8, fog: false }));
  sun.position.set(-40, 18, -140);
  scene.add(sun);

  // fields, stretching away
  const fields = new THREE.Mesh(new THREE.PlaneGeometry(400, 300), new THREE.MeshStandardMaterial({ map: fieldTexture(), roughness: 1 }));
  fields.rotation.x = -Math.PI / 2;
  fields.position.set(0, 0, -120);
  fields.receiveShadow = true;
  scene.add(fields);
  refs.fieldMat = fields.material;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 60), m.grass);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.01, 0);
  ground.receiveShadow = true;
  scene.add(ground);

  // hills on the horizon
  for (let i = 0; i < 9; i++) {
    const hill = new THREE.Mesh(new THREE.ConeGeometry(20 + r() * 20, 10 + r() * 12, 6), i % 2 ? m.hill : m.hill2);
    hill.position.set(-140 + i * 36 + r() * 10, 0, -200 - r() * 40);
    scene.add(hill);
  }

  // the village: rows of low roofs between you and the fields
  for (let row = 0; row < 4; row++) {
    for (let k = 0; k < 7; k++) {
      if (r() < 0.2) continue;
      const w = 4 + r() * 2;
      const d = 3.5 + r() * 1.5;
      const h = 2.6 + r() * 0.8;
      const hs = house(m, w, d, h, r);
      hs.position.set(-24 + k * 8 + (r() - 0.5) * 2, 0, -6 - row * 9 + (r() - 0.5) * 2);
      hs.rotation.y = (r() - 0.5) * 0.2;
      hs.traverse((o) => o.isMesh && (o.castShadow = o.receiveShadow = true));
      scene.add(hs);
    }
  }
  // a few trees
  for (let i = 0; i < 14; i++) {
    const t = new THREE.Mesh(new THREE.ConeGeometry(1 + r(), 4 + r() * 2, 6), flat(0x4a5a32));
    t.position.set(-30 + r() * 60, 2.4, -10 - r() * 34);
    t.castShadow = true;
    scene.add(t);
  }

  // your own roof: the ridge you stand behind, in the foreground
  const myRoof = new THREE.Group();
  const slope = box(30, 0.3, 6, m.tile, 0, 0, 0);
  slope.rotation.x = 0.35;
  myRoof.add(slope);
  for (let i = 0; i < 24; i++) myRoof.add(box(1.2, 0.1, 6.2, i % 2 ? m.roof : m.roof2, -14 + i * 1.22, 0.16, 0));
  myRoof.children.slice(1).forEach((c) => (c.rotation.x = 0.35));
  myRoof.position.set(0, 4.2, 9);
  myRoof.traverse((o) => o.isMesh && (o.receiveShadow = true));
  scene.add(myRoof);

  // neighbours on the nearer roofs
  const flagMat = new THREE.MeshStandardMaterial({ map: flagTexture('NO REST FOR SPARROWS'), side: THREE.DoubleSide, roughness: 1 });
  const spots = [
    [-15, 3.9, -4, 'flag'],
    [-8, 4.0, -14, 'pot'],
    [-2, 4.1, -6, 'flag'],
    [7, 3.9, -15, 'pot'],
    [12, 4.0, -5, 'flag'],
    [19, 4.1, -14, 'pot'],
    [-20, 4.0, -23, 'pot'],
    [3, 4.1, -24, 'flag'],
  ];
  spots.forEach(([x, y, z, kind], i) => {
    const n = neighbour(m, kind, flagMat, i);
    n.group.position.set(x, y, z);
    n.group.rotation.y = (r() - 0.5) * 0.8;
    n.group.traverse((o) => o.isMesh && (o.castShadow = true));
    scene.add(n.group);
    refs.neighbours.push(n);
    if (n.flag) refs.flags.push(n.flag);
  });

  // the loudspeaker pole
  const pole = new THREE.Group();
  pole.add(box(0.25, 12, 0.25, m.wood, 0, 6, 0));
  for (const a of [-0.5, 0.6]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.4, 8, 1, true), flat(0x9a9a92, { side: THREE.DoubleSide }));
    horn.rotation.z = Math.PI / 2;
    horn.rotation.y = a;
    horn.position.set(Math.sin(a) * 0.6, 11.2, Math.cos(a) * 0.6);
    pole.add(horn);
  }
  pole.position.set(-11, 0, -10);
  pole.traverse((o) => o.isMesh && (o.castShadow = true));
  scene.add(pole);

  // light: low morning sun, long shadows
  scene.add(new THREE.HemisphereLight(0xf6e2c4, 0x4a4a3a, 0.9));
  const key = new THREE.DirectionalLight(0xffd9a0, 2.6);
  key.position.set(-30, 14, -20);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -40, right: 40, top: 30, bottom: -30, near: 1, far: 120 });
  key.shadow.bias = -0.0005;
  scene.add(key);
  refs.key = key;
  refs.hemi = scene.children.find((o) => o.isHemisphereLight);
  return refs;
}

/** Shared bird parts; each bird is a small group so it can flap, fall and be counted. */
export function makeBirdKit(m) {
  const body = new THREE.SphereGeometry(0.22, 6, 4);
  body.scale(1.5, 0.9, 0.9);
  const wing = new THREE.BoxGeometry(0.34, 0.03, 0.55);
  wing.translate(0, 0, 0.27);
  const tail = new THREE.ConeGeometry(0.1, 0.3, 4);
  tail.rotateZ(Math.PI / 2);
  return {
    make() {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(body, m.bird));
      const t = new THREE.Mesh(tail, m.birdWing);
      t.position.x = -0.38;
      g.add(t);
      const wl = new THREE.Mesh(wing, m.birdWing);
      const wr = new THREE.Mesh(wing, m.birdWing);
      wr.rotation.y = Math.PI;
      g.add(wl, wr);
      g.userData.wings = [wl, wr];
      return g;
    },
  };
}

/** A cloud of locusts: points that thicken over time. */
export function makeLocusts(count = 6000) {
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 120;
    pos[i * 3 + 1] = 1 + Math.random() * 26;
    pos[i * 3 + 2] = -6 - Math.random() * 90;
    seed[i] = Math.random() * 100;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setDrawRange(0, 0);
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x3a3218, size: 0.22, sizeAttenuation: true, transparent: true, opacity: 0.85, depthWrite: false }));
  pts.userData.seed = seed;
  pts.userData.count = count;
  return pts;
}

/** The rifle, held at the bottom right of the view. Attach to the camera. */
export function makeRifle(m) {
  const g = new THREE.Group();
  g.add(box(0.07, 0.07, 1.3, m.steel, 0, 0, -0.65)); // barrel
  g.add(box(0.11, 0.12, 0.7, m.stock, 0, -0.04, -0.15)); // fore-stock
  const butt = box(0.12, 0.2, 0.5, m.stock, 0, -0.12, 0.38);
  butt.rotation.x = -0.2;
  g.add(butt);
  g.add(box(0.03, 0.05, 0.12, m.steel, 0.08, 0.04, 0.05)); // the bolt handle
  const flash = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 6), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0 }));
  flash.rotation.x = -Math.PI / 2;
  flash.position.z = -1.45;
  g.add(flash);
  g.userData.flash = flash;
  g.scale.setScalar(0.7);
  g.position.set(0.42, -0.42, -0.6);
  g.rotation.set(0.04, 0.08, 0);
  return g;
}
