// POTEMKIN VILLAGE — models for the village, the props, the car and the truck.
import * as THREE from 'three';
import { flat } from '../../shared/renderer.js';
import { PALETTE, CSS, FONTS } from '../../shared/palette.js';
import { canvasTexture, rng, speckle, fitText } from '../../shared/canvasTexture.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  return m;
}

// shared materials (created per village build so they are disposed with the scene)
export function makeMaterials() {
  return {
    wood: flat(0x5d4a3a),
    woodGrey: flat(0x6f675c),
    woodDark: flat(0x3a2e25),
    roof: flat(0x4a4038),
    hole: flat(0x0d0b0a),
    stone: flat(0x7d786f),
    rust: flat(0x7a4a32, { metalness: 0.3 }),
    mud: flat(0x3d2f22, { roughness: 1 }),
    puddle: flat(0x22292b, { roughness: 0.15, metalness: 0.3 }),
    grassGreen: flat(0x4f9a3a),
    fenceNew: flat(PALETTE.cream),
    plywood: flat(0xc9a878),
    red: flat(PALETTE.red),
    black: flat(PALETTE.black),
    cream: flat(PALETTE.cream),
    glassDark: flat(0x1b2024, { roughness: 0.2 }),
    birch: flat(0xe6e2d8),
    pine: flat(0x2e4a34),
  };
}

function groundTexture() {
  return canvasTexture(1024, 512, (ctx, w, h) => {
    const r = rng(8);
    ctx.fillStyle = '#5a5236';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = r() < 0.5 ? `rgba(80,95,50,${0.2 + r() * 0.3})` : `rgba(60,45,30,${0.2 + r() * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(r() * w, r() * h, 6 + r() * 30, 4 + r() * 16, r() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // the road: a mud strip down the middle with ruts
    const y0 = h / 2 - 22;
    ctx.fillStyle = '#4a3a29';
    ctx.fillRect(0, y0, w, 44);
    ctx.strokeStyle = 'rgba(30,22,15,0.6)';
    ctx.lineWidth = 3;
    for (const dy of [12, 32]) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 16) ctx.lineTo(x, y0 + dy + Math.sin(x * 0.05) * 1.5);
      ctx.stroke();
    }
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = 'rgba(34,41,43,0.7)';
      ctx.beginPath();
      ctx.ellipse(r() * w, y0 + 6 + r() * 32, 4 + r() * 10, 2 + r() * 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    speckle(ctx, w, h, 0.15, r, 0.02);
  });
}

export function buildGround(scene) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(120, 60), new THREE.MeshStandardMaterial({ map: groundTexture(), roughness: 1 }));
  g.rotation.x = -Math.PI / 2;
  g.receiveShadow = true;
  scene.add(g);
  // a treeline all round
  const r = rng(21);
  const m = makeMaterials();
  const coneGeo = new THREE.ConeGeometry(1.4, 5, 6);
  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.16, 6, 5);
  for (let i = 0; i < 70; i++) {
    const side = i % 2 ? 1 : -1;
    const x = -58 + r() * 116;
    const z = side * (22 + r() * 8);
    if (r() < 0.5) {
      const t = new THREE.Mesh(coneGeo, m.pine);
      t.position.set(x, 2.5, z);
      t.scale.setScalar(0.8 + r() * 0.6);
      t.castShadow = true;
      scene.add(t);
    } else {
      const t = new THREE.Mesh(trunkGeo, m.birch);
      t.position.set(x, 3, z);
      t.rotation.z = (r() - 0.5) * 0.1;
      t.castShadow = true;
      scene.add(t);
    }
  }
  return g;
}

// ---- things ------------------------------------------------------------------------
function buildHouse(m, r, { shop = false } = {}) {
  const g = new THREE.Group();
  const occ = [];
  const w = shop ? 7 : 5.5;
  const d = 4.5;
  const h = shop ? 3.4 : 3;
  const walls = box(w, h, d, r() < 0.5 ? m.wood : m.woodGrey, 0, h / 2, 0);
  g.add(walls);
  occ.push(walls);
  // roof: two slabs, one partly gone
  const slope = 0.55;
  const rl = box(w + 0.4, 0.15, d / 2 / Math.cos(slope) + 0.3, m.roof, 0, h + 0.9, -d / 4);
  rl.rotation.x = -slope;
  const rrr = box(w * (shop ? 1 : 0.55), 0.15, d / 2 / Math.cos(slope) + 0.3, m.roof, shop ? 0 : -w * 0.2, h + 0.9, d / 4);
  rrr.rotation.x = slope;
  g.add(rl, rrr);
  occ.push(rl, rrr);
  const gable = new THREE.Mesh(new THREE.ConeGeometry(d / 2 + 0.1, 1.6, 3), m.woodDark);
  gable.rotation.z = Math.PI / 2;
  // front (toward the road, -z): door and boarded windows
  const door = box(0.9, 1.9, 0.08, m.woodDark, -w * 0.25, 0.95, -d / 2 - 0.02);
  door.rotation.z = 0.06;
  g.add(door);
  if (!shop) {
    for (const x of [-w * 0.05, w * 0.3]) {
      g.add(box(0.9, 0.9, 0.06, m.hole, x + 0.5, 1.7, -d / 2 - 0.02));
      for (let k = 0; k < 2; k++) {
        const board = box(1.1, 0.16, 0.05, m.woodGrey, x + 0.5, 1.5 + k * 0.4, -d / 2 - 0.06);
        board.rotation.z = (r() - 0.5) * 0.6;
        g.add(board);
      }
    }
  }
  // missing planks: dark gaps
  for (let k = 0; k < 3; k++) g.add(box(0.15 + r() * 0.3, 0.6 + r(), 0.05, m.hole, (r() - 0.5) * w * 0.8, 0.6 + r() * 1.5, -d / 2 - 0.03));
  // a chimney, failing
  const ch = box(0.5, 1.4, 0.5, m.stone, w * 0.3, h + 1.2, 0.4);
  ch.rotation.z = 0.15;
  g.add(ch);
  // sample points the Inspector might glimpse: the front, inset corners, the roof ridge
  const samples = [V(0, 1.4, -d / 2 - 0.1), V(-w / 2 + 0.8, 1.2, -d / 2 - 0.1), V(w / 2 - 0.8, 1.2, -d / 2 - 0.1), V(0, h + 1.0, 0)];
  return { group: g, occ, samples, w, d };
}

export function buildThing(def, m) {
  const r = rng(def.id.length * 97 + def.pos[0] * 13);
  let built;
  switch (def.type) {
    case 'house':
      built = buildHouse(m, r);
      if (def.id === 'house-c') {
        const tree = new THREE.Mesh(new THREE.ConeGeometry(1.6, 6, 6), m.pine);
        tree.position.set(0.5, 4.2, 0.5);
        built.group.add(tree);
      }
      break;
    case 'shop': {
      built = buildHouse(m, r, { shop: true });
      const win = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.6), new THREE.MeshStandardMaterial({ color: 0x1b2024, roughness: 0.3 }));
      win.position.set(1.0, 1.7, -built.d / 2 - 0.05);
      win.rotation.y = Math.PI;
      built.group.add(win);
      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 0.7),
        new THREE.MeshStandardMaterial({
          map: canvasTexture(512, 96, (ctx, w, h) => {
            ctx.fillStyle = '#6a6e60';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = 'rgba(242,232,213,0.55)';
            ctx.font = `70px ${FONTS.display}`;
            ctx.textAlign = 'center';
            ctx.fillText('PROD CTS', w / 2, 76);
          }),
        }),
      );
      sign.position.set(0, 3.0, -built.d / 2 - 0.06);
      sign.rotation.y = Math.PI;
      built.group.add(sign);
      built.window = win;
      break;
    }
    case 'fence': {
      const g = new THREE.Group();
      const posts = [];
      const n = Math.round(def.len / 1.2);
      for (let i = 0; i <= n; i++) {
        if (r() < 0.2) continue;
        const p = box(0.12, 1.2, 0.12, m.woodGrey, -def.len / 2 + i * 1.2, 0.6, 0);
        p.rotation.z = (r() - 0.5) * 0.5;
        p.userData.tilt = p.rotation.z;
        g.add(p);
        posts.push(p);
      }
      const rails = [];
      for (const y of [0.45, 0.95]) {
        for (let i = 0; i < n; i++) {
          if (r() < 0.35) continue;
          const rail = box(1.25, 0.1, 0.05, m.woodGrey, -def.len / 2 + (i + 0.5) * 1.2, y + (r() - 0.5) * 0.2, 0.06);
          rail.rotation.z = (r() - 0.5) * 0.3;
          g.add(rail);
          rails.push(rail);
        }
      }
      const samples = [];
      for (let i = 0; i <= 4; i++) samples.push(V(-def.len / 2 + (i * def.len) / 4, 0.7, -0.1));
      built = { group: g, occ: [], samples, posts, rails };
      break;
    }
    case 'mud': {
      const g = new THREE.Group();
      const patch = new THREE.Mesh(new THREE.CircleGeometry(3, 9), m.mud.clone());
      patch.rotation.x = -Math.PI / 2;
      patch.position.y = 0.03;
      patch.scale.set(1.3, 0.8, 1);
      patch.receiveShadow = true;
      const pud = new THREE.Mesh(new THREE.CircleGeometry(1, 7), m.puddle);
      pud.rotation.x = -Math.PI / 2;
      pud.position.set(0.8, 0.05, 0.3);
      g.add(patch, pud);
      built = { group: g, occ: [], samples: [V(0, 0.15, 0), V(-2.5, 0.15, 0), V(2.5, 0.15, 0), V(0, 0.15, -1.6)], patch, pud };
      break;
    }
    case 'well': {
      const g = new THREE.Group();
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.85, 0.9, 8, 1, true), m.stone);
      ring.position.y = 0.45;
      ring.material = flat(0x7d786f, { side: THREE.DoubleSide });
      const post = box(0.12, 2, 0.12, m.woodGrey, -0.8, 1, 0);
      const post2 = box(0.12, 1.4, 0.12, m.woodGrey, 0.8, 0.7, 0);
      post2.rotation.z = 0.4;
      const roof = box(2.2, 0.08, 1.2, m.roof, -0.3, 1.9, 0);
      roof.rotation.z = -0.5;
      g.add(ring, post, post2, roof);
      g.traverse((o) => o.isMesh && (o.castShadow = true));
      built = { group: g, occ: [], samples: [V(0, 0.8, -0.8), V(0, 1.6, 0)] };
      break;
    }
    case 'barn': {
      const g = new THREE.Group();
      const a = box(9, 0.2, 5, m.roof, 0, 1.6, -1.2);
      a.rotation.x = 0.6;
      a.rotation.z = 0.08;
      const b = box(9, 0.2, 5, m.roof, 0.3, 1.2, 2.2);
      b.rotation.x = -0.9;
      const wall = box(9, 1.2, 0.2, m.wood, 0, 0.6, 3.8);
      g.add(a, b, wall);
      for (let i = 0; i < 6; i++) {
        const beam = box(0.2, 0.2, 3, m.woodDark, -4 + r() * 8, 0.2, -2 + r() * 4);
        beam.rotation.y = r() * 3;
        g.add(beam);
      }
      built = { group: g, occ: [a, b], samples: [V(0, 1.2, -2.5), V(-3.5, 1, -2.4), V(3.5, 1, -2.4), V(0, 2.4, 0)] };
      break;
    }
    case 'junk': {
      const g = new THREE.Group();
      const block = box(2.2, 1.1, 1.4, m.rust, 0, 0.55, 0);
      block.rotation.y = 0.4;
      const tireGeo = new THREE.TorusGeometry(0.6, 0.22, 6, 10);
      for (let i = 0; i < 3; i++) {
        const t = new THREE.Mesh(tireGeo, m.black);
        t.position.set(-1.6 + i * 1.4, 0.22 + (i === 1 ? 0.5 : 0), 0.8 - i * 0.6);
        t.rotation.x = i === 1 ? 0.3 : Math.PI / 2;
        t.castShadow = true;
        g.add(t);
      }
      const seat = box(0.6, 0.1, 0.6, m.rust, 0.6, 1.3, 0.2);
      seat.rotation.z = 0.7;
      g.add(block, seat);
      built = { group: g, occ: [], samples: [V(0, 0.8, -0.8), V(-1.6, 0.5, 0.4), V(1.2, 0.6, 0)] };
      break;
    }
    default:
      built = { group: new THREE.Group(), occ: [], samples: [] };
  }
  built.group.position.set(def.pos[0], 0, def.pos[1]);
  built.group.rotation.y = def.rot || 0;
  return built;
}

/** Apply or remove a cosmetic repair on a thing. */
export function setFixed(thing, fixed, m) {
  thing.fixed = fixed;
  const b = thing.built;
  if (thing.def.type === 'fence') {
    for (const p of b.posts) {
      p.material = fixed ? m.fenceNew : m.woodGrey;
      p.rotation.z = fixed ? 0 : p.userData.tilt;
    }
    for (const rail of b.rails) {
      rail.material = fixed ? m.fenceNew : m.woodGrey;
    }
  } else if (thing.def.type === 'mud') {
    b.patch.material.color.set(fixed ? 0x4f9a3a : 0x3d2f22);
    b.pud.visible = !fixed;
  } else if (thing.def.type === 'shop') {
    const mat = b.window.material;
    if (fixed) {
      if (!b.stockTex) b.stockTex = stockedWindowTexture();
      mat.map = b.stockTex;
      mat.color.set(0xffffff);
      mat.emissive = new THREE.Color(0x332211);
    } else {
      mat.map = null;
      mat.color.set(0x1b2024);
      mat.emissive = new THREE.Color(0x000000);
    }
    mat.needsUpdate = true;
  }
}

function stockedWindowTexture() {
  return canvasTexture(512, 228, (ctx, w, h) => {
    ctx.fillStyle = '#f3e6c4';
    ctx.fillRect(0, 0, w, h);
    const r = rng(3);
    // shelves of very convincing sausages, cans and loaves
    for (let row = 0; row < 3; row++) {
      ctx.fillStyle = '#7a5a3a';
      ctx.fillRect(0, 66 + row * 72, w, 6);
      for (let i = 0; i < 12; i++) {
        const x = 12 + i * 41;
        const y = 66 + row * 72;
        const k = (i + row) % 3;
        if (k === 0) {
          ctx.fillStyle = '#9a3a2a';
          ctx.beginPath();
          ctx.ellipse(x + 15, y - 22, 9, 22, 0.3, 0, Math.PI * 2);
          ctx.fill();
        } else if (k === 1) {
          ctx.fillStyle = r() < 0.5 ? CSS.red : '#3d6a8a';
          ctx.fillRect(x + 4, y - 34, 26, 34);
          ctx.fillStyle = CSS.cream;
          ctx.fillRect(x + 4, y - 24, 26, 10);
        } else {
          ctx.fillStyle = '#c08a4a';
          ctx.beginPath();
          ctx.ellipse(x + 16, y - 14, 17, 13, 0, Math.PI, 0);
          ctx.fill();
        }
      }
    }
    ctx.fillStyle = CSS.red;
    ctx.font = `34px ${FONTS.display}`;
    ctx.fillText('ABUNDANCE · ALL ITEMS AVAILABLE', 16, 34);
  });
}

// ---- props the player builds ---------------------------------------------------------------
function facadeTexture(seed) {
  return canvasTexture(640, 400, (ctx, w, h) => {
    const r = rng(seed);
    const walls = ['#e9c46a', '#f2e8d5', '#9ec1cf', '#f4a3a3'];
    ctx.fillStyle = '#9ad0f5';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = walls[seed % walls.length];
    ctx.fillRect(40, 130, w - 80, h - 130);
    ctx.fillStyle = CSS.red;
    ctx.beginPath();
    ctx.moveTo(20, 135);
    ctx.lineTo(w / 2, 20);
    ctx.lineTo(w - 20, 135);
    ctx.fill();
    for (const x of [100, w - 200]) {
      ctx.fillStyle = '#3d6a8a';
      ctx.fillRect(x, 190, 100, 90);
      ctx.fillStyle = CSS.cream;
      ctx.fillRect(x + 46, 190, 8, 90);
      ctx.fillRect(x, 230, 100, 8);
      ctx.fillStyle = '#e55';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(x + 10 + i * 16, 290, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#4f9a3a';
      ctx.fillRect(x, 294, 100, 10);
    }
    ctx.fillStyle = '#6a3a22';
    ctx.fillRect(w / 2 - 40, 250, 80, 150);
    ctx.fillStyle = CSS.gold;
    ctx.beginPath();
    ctx.arc(w / 2 + 25, 330, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = CSS.black;
    ctx.font = `30px ${FONTS.display}`;
    ctx.textAlign = 'center';
    ctx.fillText(`MODEL DWELLING No. ${1 + Math.floor(r() * 90)}`, w / 2, 170);
    speckle(ctx, w, h, 0.06, r, 0.01);
  });
}

function bannerTexture(text) {
  return canvasTexture(768, 200, (ctx, w, h) => {
    ctx.fillStyle = CSS.red;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = CSS.cream;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const s = fitText(ctx, text, w - 50, 120, FONTS.display);
    ctx.font = `${s}px ${FONTS.display}`;
    ctx.fillText(text, w / 2, h / 2 + 6);
  });
}

function makeCitizen(color, m) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.1, 6), flat(color));
  body.position.y = 0.95;
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 0), flat(PALETTE.skin));
  head.position.y = 1.68;
  const scarf = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.28, 6), m.red);
  scarf.position.y = 1.8;
  const legs = box(0.28, 0.42, 0.14, m.black, 0, 0.21, 0);
  const arm = new THREE.Group();
  arm.position.set(0.26, 1.35, 0);
  const armMesh = box(0.09, 0.55, 0.09, flat(color), 0, 0.27, 0);
  const flag = box(0.4, 0.26, 0.02, m.red, 0.2, 0.62, 0);
  arm.add(armMesh, flag);
  g.add(body, head, scarf, legs, arm);
  g.traverse((o) => o.isMesh && (o.castShadow = true));
  g.userData.arm = arm;
  return g;
}

/** Build the prop for a slot option. Returns { group, occ, samples, wavers }. */
export function buildProp(slot, m, seed = 1) {
  const g = new THREE.Group();
  const occ = [];
  const wavers = [];
  let samples = [];
  if (slot.kind === 'facade') {
    const front = new THREE.MeshStandardMaterial({ map: facadeTexture(seed), roughness: 0.9 });
    const mats = [m.plywood, m.plywood, m.plywood, m.plywood, m.plywood, front];
    const board = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 0.06), mats);
    board.position.y = 2.5;
    board.castShadow = board.receiveShadow = true;
    g.add(board);
    occ.push(board);
    // struts behind: the truth, from the other side
    for (const x of [-3, 0, 3]) {
      const s = box(0.1, 4.6, 0.1, m.woodDark, x, 1.9, 1.4);
      s.rotation.x = -0.55;
      g.add(s);
    }
    samples = [V(0, 2.5, -0.1), V(-3.5, 2, -0.1), V(3.5, 2, -0.1)];
  } else if (slot.kind === 'banner') {
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.3), new THREE.MeshStandardMaterial({ map: bannerTexture(seed % 2 ? 'GLORY TO THE HARVEST' : 'OUR VILLAGE: AHEAD OF PLAN'), side: THREE.DoubleSide }));
    cloth.position.y = 2.1;
    cloth.rotation.y = Math.PI;
    cloth.castShadow = true;
    g.add(cloth);
    occ.push(cloth);
    for (const x of [-2.55, 2.55]) g.add(box(0.1, 2.8, 0.1, m.woodDark, x, 1.4, 0));
    samples = [V(0, 2.1, -0.05), V(-2, 2.1, -0.05), V(2, 2.1, -0.05)];
  } else if (slot.kind === 'crowd') {
    const colors = [0xd35d3a, 0x3d6a8a, 0xe9c46a];
    for (let i = 0; i < 3; i++) {
      const c = makeCitizen(colors[i], m);
      c.position.set(-1.3 + i * 1.3, 0, (i % 2) * 0.4);
      c.rotation.y = Math.PI + (i - 1) * 0.15;
      c.userData.phase = i * 1.3;
      g.add(c);
      wavers.push(c);
    }
    samples = [V(-1.3, 1.4, 0), V(0, 1.4, 0.4), V(1.3, 1.4, 0)];
  }
  g.position.set(slot.pos[0], 0, slot.pos[1]);
  return { group: g, occ, samples, wavers };
}

// ---- vehicles ----------------------------------------------------------------------------------
export function buildCar(m) {
  const g = new THREE.Group();
  const paint = flat(0x15171a, { metalness: 0.5, roughness: 0.35 });
  g.add(box(4.6, 0.7, 1.8, paint, 0, 0.65, 0));
  g.add(box(2.4, 0.6, 1.6, paint, -0.2, 1.3, 0));
  g.add(box(2.3, 0.5, 1.62, flat(0x9ab0c0, { metalness: 0.3, roughness: 0.1 }), -0.2, 1.3, 0));
  g.add(box(0.1, 0.2, 1.4, flat(0xc0c4c8, { metalness: 0.8 }), 2.32, 0.6, 0));
  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 10);
  for (const [x, z] of [[1.5, 0.85], [1.5, -0.85], [-1.5, 0.85], [-1.5, -0.85]]) {
    const w = new THREE.Mesh(wheelGeo, m.black);
    w.rotation.x = Math.PI / 2;
    w.position.set(x, 0.38, z);
    g.add(w);
  }
  // the Inspector, in the back right, with a hat
  const insp = new THREE.Group();
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), flat(PALETTE.skin));
  const hat = box(0.4, 0.08, 0.4, m.black, 0, 0.14, 0);
  insp.add(head, hat);
  insp.position.set(-0.7, 1.45, 0.45);
  g.add(insp);
  // small red flags on the wings
  for (const z of [0.7, -0.7]) {
    const f = box(0.02, 0.25, 0.35, m.red, 2.1, 1.25, z);
    g.add(f, box(0.03, 0.4, 0.03, m.black, 2.1, 1.0, z));
  }
  g.traverse((o) => o.isMesh && (o.castShadow = true));
  return g;
}

export function buildTruck(m) {
  const g = new THREE.Group();
  const green = flat(0x4a5a3a);
  g.add(box(2, 1.8, 2.2, green, 3, 1.3, 0));
  g.add(box(1.0, 0.7, 2.1, flat(0x9ab0c0), 3.6, 1.7, 0));
  g.add(box(6, 0.3, 2.4, m.woodDark, -1, 0.85, 0));
  const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 10);
  for (const [x, z] of [[3, 1.1], [3, -1.1], [-2.5, 1.1], [-2.5, -1.1], [-0.5, 1.1], [-0.5, -1.1]]) {
    const w = new THREE.Mesh(wheelGeo, m.black);
    w.rotation.x = Math.PI / 2;
    w.position.set(x, 0.5, z);
    g.add(w);
  }
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 0.8),
    new THREE.MeshStandardMaterial({ map: bannerTexture('NEXT VILLAGE · 14 KM'), side: THREE.DoubleSide }),
  );
  sign.position.set(-1, 1.5, 1.22);
  sign.rotation.y = Math.PI;
  g.add(sign);
  g.traverse((o) => o.isMesh && (o.castShadow = true));
  return g;
}
