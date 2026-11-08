// BACKYARD FURNACE · the world: a village yard at dusk, a brick furnace, a heap of
// household iron, a woodpile, and the yard itself, which turns out to be flammable.
import * as THREE from 'three';
import { flat } from '../../shared/renderer.js';
import { PALETTE, CSS, FONTS } from '../../shared/palette.js';
import { canvasTexture, rng, fitText, speckle } from '../../shared/canvasTexture.js';

export const FURNACE_POS = new THREE.Vector3(0, 0, -1);
export const MOUTH_Y = 2.75;
export const SPOUT = new THREE.Vector3(1.35, 0.55, -0.4);
export const PILE = new THREE.Vector3(3.1, 0, 0.6);
export const HEAP = { x0: -8.6, x1: -3.2, z0: -2.6, z1: 3.2 };
export const WOODPILE = { x0: 5.6, x1: 9.0, z0: -2.4, z1: 2.8 };

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

function cyl(rt, rb, h, mat, seg = 10, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  return m;
}

function skyTexture() {
  return canvasTexture(16, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#2c3142');
    g.addColorStop(0.45, '#6a4a4a');
    g.addColorStop(0.62, '#c46a3a');
    g.addColorStop(0.75, '#e8a060');
    g.addColorStop(1, '#3a2a24');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

function earthTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const r = rng(1958);
    ctx.fillStyle = '#7a6248';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i++) {
      ctx.fillStyle = `rgba(${r() < 0.5 ? '60,44,30' : '140,116,84'},${0.15 + r() * 0.2})`;
      ctx.beginPath();
      ctx.ellipse(r() * w, r() * h, 10 + r() * 40, 6 + r() * 20, r() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    speckle(ctx, w, h, 0.25, r, 0.03);
  }, { repeat: [4, 3] });
}

function brickTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const r = rng(7);
    ctx.fillStyle = '#4a2a20';
    ctx.fillRect(0, 0, w, h);
    const bh = 22;
    for (let row = 0; row * bh < h; row++) {
      const off = row % 2 ? 0 : 24;
      for (let x = -48 + off; x < w; x += 48) {
        const c = 110 + r() * 50;
        ctx.fillStyle = `rgb(${c},${c * 0.48},${c * 0.32})`;
        ctx.fillRect(x + 2, row * bh + 2, 44, bh - 4);
      }
    }
    // soot from the top down
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(10,8,6,0.75)');
    g.addColorStop(0.5, 'rgba(10,8,6,0.15)');
    g.addColorStop(1, 'rgba(10,8,6,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h, 0.2, r, 0.02);
  }, { repeat: [3, 1] });
}

function fieldTexture() {
  return canvasTexture(512, 256, (ctx, w, h) => {
    const r = rng(42);
    ctx.fillStyle = '#c9a94a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(80,60,20,0.25)';
    for (let i = 0; i < 1600; i++) {
      const x = r() * w;
      const y = r() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (r() - 0.5) * 3, y - 6 - r() * 8);
      ctx.stroke();
    }
  }, { repeat: [6, 1] });
}

function bannerTexture(text) {
  return canvasTexture(512, 96, (ctx, w, h) => {
    ctx.fillStyle = CSS.red;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = CSS.cream;
    ctx.font = `${fitText(ctx, text, w - 40, 64, FONTS.display)}px ${FONTS.display}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 4);
  });
}

export function makeMaterials() {
  return {
    wall: flat(0xa58a68),
    mud: flat(0x8a6e50),
    roof: flat(0x4a3a36),
    wood: flat(PALETTE.wood),
    woodLight: flat(0x7a5232),
    dark: flat(PALETTE.black),
    skin: flat(PALETTE.skin),
    coatBlue: flat(0x3d5a7a),
    coatGrey: flat(0x6a6a62),
    iron: flat(0x3c3c3e, { metalness: 0.5, roughness: 0.55 }),
    ironLight: flat(0x6a6c70, { metalness: 0.55, roughness: 0.45 }),
    brass: flat(PALETTE.brass, { metalness: 0.6, roughness: 0.4 }),
    enamel: flat(0x4a7a6a),
    red: flat(PALETTE.red),
    leaf: flat(0x4a5a32),
    pear: flat(0xc9b04a),
    straw: flat(0xb89a58),
    brick: new THREE.MeshStandardMaterial({ map: brickTexture(), roughness: 1, flatShading: true }),
    glow: new THREE.MeshBasicMaterial({ color: 0xffa040 }),
    pig: flat(0x2e2a28, { metalness: 0.3, roughness: 0.8, emissive: 0xff5a10, emissiveIntensity: 1 }),
  };
}

// ------------------------------------------------------------------ the items
// Every item is a small group, roughly a metre across, sitting on y = 0.
export const ITEM_SHAPES = {
  wok(m) {
    const g = new THREE.Group();
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 5, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2.6), m.iron);
    bowl.material.side = THREE.DoubleSide;
    bowl.position.y = 0.45;
    g.add(bowl, box(0.5, 0.05, 0.07, m.wood, 0.6, 0.38, 0));
    return g;
  },
  kettle(m) {
    const g = new THREE.Group();
    g.add(cyl(0.18, 0.26, 0.34, m.ironLight, 10, 0, 0.17, 0));
    g.add(cyl(0.05, 0.18, 0.08, m.ironLight, 10, 0, 0.38, 0));
    const spout = cyl(0.03, 0.05, 0.3, m.ironLight, 6, 0.28, 0.24, 0);
    spout.rotation.z = -0.9;
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.02, 4, 10, Math.PI), m.dark);
    handle.position.y = 0.38;
    g.add(spout, handle);
    return g;
  },
  pot(m) {
    const g = new THREE.Group();
    g.add(cyl(0.38, 0.32, 0.4, m.iron, 12, 0, 0.2, 0));
    g.add(box(0.12, 0.05, 0.08, m.iron, 0.44, 0.36, 0), box(0.12, 0.05, 0.08, m.iron, -0.44, 0.36, 0));
    return g;
  },
  hinge(m) {
    const g = new THREE.Group();
    g.add(box(0.28, 0.03, 0.12, m.ironLight, -0.14, 0.02, 0), box(0.28, 0.03, 0.12, m.ironLight, 0.14, 0.04, 0));
    const pin = cyl(0.025, 0.025, 0.14, m.dark, 6, 0, 0.04, 0);
    pin.rotation.x = Math.PI / 2;
    g.add(pin);
    return g;
  },
  bicycle(m) {
    const g = new THREE.Group();
    for (const x of [-0.55, 0.55]) {
      const w = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.03, 4, 14), m.dark);
      w.position.set(x, 0.36, 0);
      g.add(w);
    }
    const bar = box(1.0, 0.04, 0.04, m.red, 0, 0.62, 0);
    const down = box(0.7, 0.04, 0.04, m.red, -0.14, 0.48, 0);
    down.rotation.z = 0.6;
    const seat = box(0.04, 0.4, 0.04, m.red, 0.25, 0.56, 0);
    g.add(bar, down, seat, box(0.2, 0.04, 0.1, m.dark, 0.25, 0.78, 0), box(0.04, 0.04, 0.4, m.ironLight, -0.5, 0.8, 0));
    g.rotation.x = -Math.PI / 2; // lying on its side in the heap
    g.position.y = 0.05;
    const wrap = new THREE.Group();
    wrap.add(g);
    return wrap;
  },
  gate(m) {
    const g = new THREE.Group();
    for (let i = 0; i < 7; i++) g.add(box(0.04, 0.04, 1.4, m.iron, -0.6 + i * 0.2, 0.03, 0));
    g.add(box(1.36, 0.05, 0.06, m.iron, 0, 0.05, -0.6), box(1.36, 0.05, 0.06, m.iron, 0, 0.05, 0.6), box(1.36, 0.05, 0.06, m.iron, 0, 0.05, 0));
    return g;
  },
  bed(m) {
    const g = new THREE.Group();
    g.add(box(1.5, 0.05, 0.05, m.iron, 0, 0.3, -0.35), box(1.5, 0.05, 0.05, m.iron, 0, 0.3, 0.35));
    for (const x of [-0.75, 0.75]) {
      g.add(box(0.05, 0.6, 0.05, m.iron, x, 0.3, -0.35), box(0.05, 0.6, 0.05, m.iron, x, 0.3, 0.35), box(0.05, 0.05, 0.75, m.iron, x, 0.58, 0));
    }
    for (let i = 0; i < 6; i++) g.add(box(0.03, 0.03, 0.7, m.ironLight, -0.6 + i * 0.24, 0.3, 0));
    return g;
  },
  sewing(m) {
    const g = new THREE.Group();
    g.add(box(0.6, 0.08, 0.3, m.wood, 0, 0.04, 0), box(0.12, 0.34, 0.14, m.dark, 0.2, 0.24, 0), box(0.5, 0.12, 0.14, m.dark, 0, 0.42, 0));
    g.add(box(0.06, 0.18, 0.06, m.dark, -0.22, 0.28, 0));
    const wheel = cyl(0.1, 0.1, 0.04, m.brass, 12, 0.32, 0.36, 0);
    wheel.rotation.z = Math.PI / 2;
    g.add(wheel);
    return g;
  },
  basin(m) {
    const g = new THREE.Group();
    g.add(cyl(0.4, 0.28, 0.2, m.enamel, 12, 0, 0.1, 0));
    return g;
  },
  hoe(m) {
    const g = new THREE.Group();
    g.add(box(1.5, 0.05, 0.05, m.woodLight, 0, 0.04, 0), box(0.05, 0.05, 0.26, m.ironLight, 0.74, 0.04, 0.1));
    return g;
  },
  sickle(m) {
    const g = new THREE.Group();
    const blade = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 3, 12, Math.PI * 1.2), m.ironLight);
    blade.rotation.x = -Math.PI / 2;
    blade.position.set(0.15, 0.03, 0);
    g.add(blade, box(0.34, 0.05, 0.05, m.woodLight, -0.2, 0.03, 0));
    return g;
  },
  plough(m) {
    const g = new THREE.Group();
    const beam = box(1.6, 0.1, 0.1, m.wood, 0, 0.45, 0);
    beam.rotation.z = -0.2;
    const share = box(0.4, 0.06, 0.3, m.ironLight, 0.6, 0.1, 0);
    share.rotation.z = 0.4;
    g.add(beam, share, box(0.06, 0.5, 0.06, m.wood, 0.45, 0.28, 0), box(0.06, 0.5, 0.4, m.wood, -0.75, 0.6, 0));
    return g;
  },
  rake(m) {
    const g = new THREE.Group();
    g.add(box(1.5, 0.05, 0.05, m.woodLight, 0, 0.04, 0), box(0.05, 0.05, 0.5, m.ironLight, 0.74, 0.04, 0));
    for (let i = 0; i < 6; i++) g.add(box(0.1, 0.03, 0.02, m.ironLight, 0.8, 0.04, -0.22 + i * 0.09));
    return g;
  },
  rim(m) {
    const g = new THREE.Group();
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 4, 18), m.iron);
    r.rotation.x = -Math.PI / 2;
    r.position.y = 0.05;
    g.add(r);
    return g;
  },
  bell(m) {
    const g = new THREE.Group();
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.42, 0.6, 12, 1, true), m.brass);
    b.material.side = THREE.DoubleSide;
    b.position.y = 0.3;
    g.add(b, cyl(0.2, 0.2, 0.06, m.brass, 12, 0, 0.6, 0), box(0.08, 0.12, 0.08, m.brass, 0, 0.68, 0));
    return g;
  },
  stove(m) {
    const g = new THREE.Group();
    g.add(box(0.9, 0.08, 0.6, m.iron, 0, 0.04, 0));
    for (const x of [-0.22, 0.22]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 4, 12), m.dark);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, 0.09, 0);
      g.add(ring);
    }
    return g;
  },
  chair(m) {
    const g = new THREE.Group();
    g.add(box(0.5, 0.06, 0.5, m.woodLight, 0, 0.45, 0), box(0.5, 0.5, 0.06, m.woodLight, 0, 0.72, -0.22));
    for (const [x, z] of [[-0.21, -0.21], [0.21, -0.21], [-0.21, 0.21], [0.21, 0.21]]) g.add(box(0.05, 0.45, 0.05, m.wood, x, 0.22, z));
    return g;
  },
  stool(m) {
    const g = new THREE.Group();
    g.add(cyl(0.22, 0.22, 0.06, m.woodLight, 8, 0, 0.36, 0));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      g.add(box(0.05, 0.36, 0.05, m.wood, Math.cos(a) * 0.15, 0.17, Math.sin(a) * 0.15));
    }
    return g;
  },
  table(m) {
    const g = new THREE.Group();
    g.add(box(1.3, 0.08, 0.8, m.woodLight, 0, 0.7, 0));
    for (const [x, z] of [[-0.58, -0.33], [0.58, -0.33], [-0.58, 0.33], [0.58, 0.33]]) g.add(box(0.07, 0.7, 0.07, m.wood, x, 0.35, z));
    return g;
  },
  bench(m) {
    const g = new THREE.Group();
    g.add(box(1.5, 0.07, 0.32, m.woodLight, 0, 0.42, 0), box(0.07, 0.42, 0.28, m.wood, -0.6, 0.21, 0), box(0.07, 0.42, 0.28, m.wood, 0.6, 0.21, 0));
    return g;
  },
  door(m) {
    const g = new THREE.Group();
    g.add(box(1.0, 2.0, 0.08, m.woodLight, 0, 1.0, 0));
    for (const y of [0.4, 1.0, 1.6]) g.add(box(1.0, 0.1, 0.1, m.wood, 0, y, 0.02));
    g.add(box(0.08, 0.08, 0.08, m.brass, 0.38, 1.0, 0.07));
    return g;
  },
  tree(m) {
    const g = new THREE.Group();
    g.add(cyl(0.1, 0.16, 1.6, m.wood, 6, 0, 0.8, 0));
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 0), m.leaf);
    crown.position.y = 2.1;
    crown.scale.set(1, 0.8, 1);
    g.add(crown);
    for (let i = 0; i < 5; i++) {
      const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), m.pear);
      const a = i * 1.3;
      p.position.set(Math.cos(a) * 0.8, 1.8 + (i % 2) * 0.4, Math.sin(a) * 0.8);
      g.add(p);
    }
    return g;
  },
  beams(m) {
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) g.add(box(2.2, 0.14, 0.14, m.wood, 0, 0.07 + i * 0.14, -0.15 + i * 0.12));
    return g;
  },
  cart(m) {
    const g = new THREE.Group();
    g.add(box(1.6, 0.1, 1.0, m.woodLight, 0, 0.6, 0), box(1.6, 0.3, 0.06, m.wood, 0, 0.8, 0.5), box(1.6, 0.3, 0.06, m.wood, 0, 0.8, -0.5));
    g.add(box(1.4, 0.06, 0.06, m.wood, 1.4, 0.6, 0.2), box(1.4, 0.06, 0.06, m.wood, 1.4, 0.6, -0.2));
    // wooden wheels, now without their rims
    for (const z of [-0.58, 0.58]) {
      const w = cyl(0.5, 0.5, 0.08, m.wood, 10, 0, 0.5, z);
      w.rotation.x = Math.PI / 2;
      g.add(w);
    }
    return g;
  },
};

/** Build one item. Returns a group with userData.item set and a generous hitbox for dragging. */
export function makeItem(def, m) {
  const g = ITEM_SHAPES[def.shape](m);
  g.traverse((o) => o.isMesh && (o.castShadow = o.receiveShadow = true));
  const bb = new THREE.Box3().setFromObject(g);
  const size = bb.getSize(new THREE.Vector3());
  const center = bb.getCenter(new THREE.Vector3());
  const hit = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.6, size.x + 0.2), Math.max(0.6, size.y + 0.2), Math.max(0.6, size.z + 0.2)), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.copy(center);
  hit.userData.hit = true;
  g.add(hit);
  const wrap = new THREE.Group();
  wrap.add(g);
  wrap.userData.item = def;
  wrap.userData.hit = hit;
  wrap.userData.radius = Math.max(size.x, size.z) / 2;
  wrap.userData.height = size.y;
  return wrap;
}

/** A lump of pig iron: an irregular, glowing, useless ingot. */
export function makeIngot(m, jin) {
  const geo = new THREE.IcosahedronGeometry(0.22, 0);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (0.8 + Math.random() * 0.5), p.getY(i) * (0.6 + Math.random() * 0.5), p.getZ(i) * (0.8 + Math.random() * 0.5));
  geo.computeVertexNormals();
  const mat = m.pig.clone();
  const mesh = new THREE.Mesh(geo, mat);
  const s = 0.7 + Math.min(1.4, Math.sqrt(jin) * 0.22);
  mesh.scale.set(s * 1.5, s * 0.7, s);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ------------------------------------------------------------------ the yard
function villager(m, coat) {
  const g = new THREE.Group();
  const body = cyl(0.24, 0.32, 1.1, coat, 6, 0, 0.6, 0);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 0), m.skin);
  head.position.y = 1.35;
  const hat = cyl(0.05, 0.36, 0.16, m.straw, 8, 0, 1.52, 0);
  g.add(body, head, hat);
  const arms = new THREE.Group();
  arms.position.set(0, 1.0, 0);
  arms.add(box(0.1, 0.1, 0.6, coat, 0.2, 0, 0.3), box(0.1, 0.1, 0.6, coat, -0.2, 0, 0.3));
  g.add(arms);
  g.userData.arms = arms;
  g.traverse((o) => o.isMesh && (o.castShadow = true));
  return g;
}

export function buildWorld(scene, m) {
  const refs = { slots: {} };
  const r = rng(1958);

  const sky = new THREE.Mesh(new THREE.SphereGeometry(160, 16, 12), new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, fog: false }));
  scene.add(sky);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshStandardMaterial({ map: earthTexture(), roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // the fields beyond the wall: they brown as the forecast falls
  const fieldMat = new THREE.MeshStandardMaterial({ map: fieldTexture(), roughness: 1 });
  const field = new THREE.Mesh(new THREE.PlaneGeometry(220, 80), fieldMat);
  field.rotation.x = -Math.PI / 2;
  field.position.set(0, 0.02, -52);
  scene.add(field);
  refs.fieldMat = fieldMat;
  for (let i = 0; i < 9; i++) {
    const hill = new THREE.Mesh(new THREE.ConeGeometry(18 + r() * 14, 8 + r() * 8, 6), flat(i % 2 ? 0x4a4a46 : 0x5a5248));
    hill.position.set(-120 + i * 30 + r() * 8, 0, -110 - r() * 20);
    scene.add(hill);
  }
  // other yards' furnaces glowing in the distance: everyone is doing this
  refs.distant = [];
  for (let i = 0; i < 9; i++) {
    const f = cyl(0.6, 1.0, 2.2, m.brick, 8, -40 + i * 10 + r() * 4, 1.1, -30 - r() * 30);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff8a30, fog: false }));
    glow.position.set(f.position.x, 2.3, f.position.z);
    scene.add(f, glow);
    refs.distant.push(glow);
  }

  // mud walls round the yard, with a gap where the gate was
  const wallH = 1.6;
  scene.add(box(30, wallH, 0.4, m.mud, 0, wallH / 2, -10.5));
  scene.add(box(0.4, wallH, 14, m.mud, -13, wallH / 2, -3.5), box(0.4, wallH, 6, m.mud, 13, wallH / 2, -7.5), box(0.4, wallH, 4, m.mud, 13, wallH / 2, 2.5));
  refs.gatePosts = [box(0.5, 2.0, 0.5, m.mud, 13, 1.0, -4.3), box(0.5, 2.0, 0.5, m.mud, 13, 1.0, 0.3)];
  scene.add(...refs.gatePosts);

  // the house, with a door and roof beams that may be needed elsewhere
  const house = new THREE.Group();
  house.add(box(11, 3.2, 4, m.wall, 0, 1.6, 0));
  house.add(box(1.1, 2.1, 0.1, m.dark, 2.5, 1.05, 2.01)); // the doorway behind the door
  house.add(box(1.4, 1.0, 0.1, m.dark, -2.5, 1.9, 2.01));
  house.add(box(1.5, 0.1, 0.2, m.wood, -2.5, 1.38, 2.05));
  const roof = new THREE.Group();
  const roofGeo = new THREE.CylinderGeometry(0.01, 1, 1, 4, 1);
  roofGeo.rotateY(Math.PI / 4);
  const roofMesh = new THREE.Mesh(roofGeo, m.roof);
  roofMesh.scale.set(8.6, 1.8, 3.4);
  roofMesh.position.y = 0.9;
  roof.add(roofMesh);
  roof.position.y = 3.2;
  house.add(roof);
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.9), new THREE.MeshStandardMaterial({ map: bannerTexture('EVERY HOUSEHOLD A STEELWORKS'), roughness: 1 }));
  banner.position.set(-1, 2.75, 2.03);
  house.add(banner);
  house.position.set(0, 0, -7.6);
  house.traverse((o) => o.isMesh && (o.castShadow = o.receiveShadow = true));
  scene.add(house);
  refs.roof = roof;
  refs.slots.door = { pos: new THREE.Vector3(2.5, 0, -5.52), rotY: 0 };
  refs.slots.beams = { pos: new THREE.Vector3(-3.6, 3.25, -5.5), rotY: 0 };
  refs.slots.tree = [
    { pos: new THREE.Vector3(-10.6, 0, -6.5), rotY: 0.3 },
    { pos: new THREE.Vector3(9.4, 0, -6.6), rotY: 1.2 },
  ];
  refs.slots.cart = { pos: new THREE.Vector3(-9.5, 0, -2.6), rotY: 0.5 };

  // the furnace: bricks, a glowing mouth, a spout, and a villager on the bellows
  const furnace = new THREE.Group();
  furnace.add(cyl(0.95, 1.45, 2.6, m.brick, 10, 0, 1.3, 0));
  furnace.add(cyl(1.05, 0.95, 0.18, m.brick, 10, 0, 2.66, 0));
  const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.78, 12), m.glow.clone());
  mouth.rotation.x = -Math.PI / 2;
  mouth.position.y = 2.76;
  furnace.add(mouth);
  const spout = box(0.9, 0.18, 0.3, m.brick, 1.35, 0.6, 0.2);
  spout.rotation.z = -0.25;
  furnace.add(spout);
  const spoutGlow = box(0.12, 0.12, 0.2, m.glow.clone(), 1.78, 0.48, 0.2);
  furnace.add(spoutGlow);
  const hole = box(0.5, 0.4, 0.1, m.glow.clone(), 0, 0.5, 1.32);
  hole.rotation.x = 0.2;
  furnace.add(hole);
  furnace.position.copy(FURNACE_POS);
  furnace.traverse((o) => o.isMesh && (o.castShadow = o.receiveShadow = true));
  scene.add(furnace);
  refs.furnace = furnace;
  refs.mouth = mouth;
  refs.glows = [mouth, spoutGlow, hole];

  const bellows = new THREE.Group();
  const bag = box(0.7, 0.3, 0.5, m.wood, 0, 0.35, 0);
  bellows.add(bag, box(0.6, 0.08, 0.08, m.wood, 0.55, 0.3, 0));
  bellows.position.set(-1.8, 0, 0.3);
  bellows.rotation.y = -0.5;
  scene.add(bellows);
  refs.bellows = bag;
  const worker = villager(m, m.coatBlue);
  worker.position.set(-2.5, 0, 0.75);
  worker.rotation.y = 0.9;
  scene.add(worker);
  refs.worker = worker;

  // the heap of household iron: a straw mat on the left
  const mat = box(HEAP.x1 - HEAP.x0 + 0.6, 0.04, HEAP.z1 - HEAP.z0 + 0.6, m.straw, (HEAP.x0 + HEAP.x1) / 2, 0.02, (HEAP.z0 + HEAP.z1) / 2);
  mat.receiveShadow = true;
  scene.add(mat);
  // the pig iron pile, with a sign
  const sign = new THREE.Group();
  sign.add(box(0.08, 1.4, 0.08, m.wood, 0, 0.7, 0));
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.5), new THREE.MeshStandardMaterial({ map: bannerTexture('STEEL FOR THE NATION'), roughness: 1 }));
  board.position.set(0, 1.3, 0.05);
  sign.add(board);
  sign.position.set(PILE.x + 1.1, 0, PILE.z - 1.5);
  sign.rotation.y = -0.3;
  scene.add(sign);

  // the loudspeaker
  const pole = new THREE.Group();
  pole.add(box(0.22, 9, 0.22, m.wood, 0, 4.5, 0));
  for (const a of [-0.4, 0.5]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 8, 1, true), flat(0x9a9a92, { side: THREE.DoubleSide }));
    horn.rotation.z = Math.PI / 2;
    horn.rotation.y = a;
    horn.position.set(Math.sin(a) * 0.5, 8.4, Math.cos(a) * 0.5);
    pole.add(horn);
  }
  pole.position.set(-6.4, 0, -9.6);
  scene.add(pole);

  // light: dusk, and the furnace
  const hemi = new THREE.HemisphereLight(0xc8a8a0, 0x2a2420, 0.7);
  scene.add(hemi);
  refs.hemi = hemi;
  const key = new THREE.DirectionalLight(0xffb070, 1.5);
  key.position.set(-20, 14, 10);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -20, right: 20, top: 16, bottom: -16, near: 1, far: 80 });
  key.shadow.bias = -0.0005;
  scene.add(key);
  refs.key = key;
  const fire = new THREE.PointLight(0xff8a3a, 30, 16, 1.6);
  fire.position.set(0, 3.4, -1);
  scene.add(fire);
  refs.fire = fire;
  const spoutLight = new THREE.PointLight(0xff7020, 6, 5, 1.8);
  spoutLight.position.set(2.2, 0.8, -0.4);
  scene.add(spoutLight);
  refs.spoutLight = spoutLight;
  return refs;
}

/** Sparks from the mouth: a small pool of points. */
export function makeSparks(n = 160) {
  const pos = new Float32Array(n * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffc060, size: 0.09, transparent: true, depthWrite: false }));
  pts.frustumCulled = false;
  pts.userData.vel = new Float32Array(n * 3);
  pts.userData.life = new Float32Array(n);
  pts.userData.next = 0;
  return pts;
}

/** Smoke: a few grey puffs, recycled. */
export function makeSmoke(n = 26) {
  const geo = new THREE.IcosahedronGeometry(0.5, 0);
  const puffs = [];
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const p = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x3a3634, transparent: true, opacity: 0, roughness: 1, flatShading: true, depthWrite: false }));
    p.userData.t = i / n;
    g.add(p);
    puffs.push(p);
  }
  g.userData.puffs = puffs;
  return g;
}
