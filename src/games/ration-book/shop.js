// RATION BOOK — the bodega. Shelves with a labelled place for everything in the book, most of
// them empty; a counter, a clerk with a stamp, a queue seen from the back (you are at the end of
// it), a fan, and a slogan that is technically about the shelves.
import * as THREE from 'three';
import { flat } from '../../shared/renderer.js';
import { canvasTexture, rng, speckle, fitText } from '../../shared/canvasTexture.js';
import { FONTS } from '../../shared/palette.js';
import { ITEMS, SHELF } from './book.js';

const TIERS = [[0, 4], [4, 8], [8, 11]]; // slot ranges per shelf, bottom to top
const TIER_Y = [1.15, 1.9, 2.65];
const SHELF_Z = -2.35;
const SLOT_W = 1.1;

export function buildShop(scene) {
  const g = new THREE.Group();
  scene.add(g);
  // room
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 14), new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  g.add(floor);
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture(), roughness: 1 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), wallMat);
  back.position.set(0, 3, -2.6);
  g.add(back);
  for (const sx of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), wallMat);
    side.rotation.y = -sx * Math.PI / 2;
    side.position.set(sx * 6.5, 3, 4);
    g.add(side);
  }
  // slogan
  const slogan = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 0.6), new THREE.MeshStandardMaterial({ map: bannerTexture('¡AQUÍ NO FALTA NADA!'), roughness: 0.9 }));
  slogan.position.set(0.2, 3.55, -2.58);
  g.add(slogan);

  // shelves
  const wood = flat(0x7a5232, { roughness: 0.85 });
  const darkWood = flat(0x4a3220, { roughness: 0.9 });
  const add = (geo, mat, x, y, z, parent = g) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const slots = {};
  TIERS.forEach(([a, b], t) => {
    const n = b - a;
    const w = n * SLOT_W;
    const y = TIER_Y[t];
    add(new THREE.BoxGeometry(w + 0.1, 0.06, 0.48), wood, 0, y, SHELF_Z);
    for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.06, 0.72, 0.48), darkWood, (sx * (w + 0.1)) / 2, y + 0.36, SHELF_Z);
    for (let k = 0; k < n; k++) {
      const id = SHELF[a + k];
      const x = -w / 2 + SLOT_W * (k + 0.5);
      const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.16), new THREE.MeshBasicMaterial({ map: tagTexture(ITEMS[id].es) }));
      tag.position.set(x, y - 0.08, SHELF_Z + 0.245);
      g.add(tag);
      const stock = new THREE.Group();
      stock.position.set(x, y + 0.03, SHELF_Z);
      for (let c = 0; c < 3; c++) {
        const m = itemMesh(id);
        m.position.x = (c - 1) * 0.3;
        m.position.z = (c % 2) * 0.08 - 0.04;
        stock.add(m);
      }
      g.add(stock);
      const none = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.3), new THREE.MeshBasicMaterial({ map: noHayTexture(), transparent: true }));
      none.position.set(x, y + 0.22, SHELF_Z - 0.2);
      none.rotation.z = (k % 2 ? 1 : -1) * 0.06;
      g.add(none);
      slots[id] = { stock, none };
    }
  });

  // counter
  add(new THREE.BoxGeometry(5.0, 1.0, 0.75), flat(0x8a5a3a, { roughness: 0.8 }), 0.5, 0.5, -0.9);
  add(new THREE.BoxGeometry(5.1, 0.06, 0.85), flat(0x5a7a6a, { roughness: 0.6 }), 0.5, 1.03, -0.9);
  // the scale
  add(new THREE.BoxGeometry(0.5, 0.1, 0.36), flat(0xd9dde0, { metalness: 0.6, roughness: 0.3 }), 1.9, 1.11, -0.9);
  add(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), flat(0x333333), 1.9, 1.35, -1.0);
  add(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 16), flat(0xd9dde0, { metalness: 0.6, roughness: 0.3 }), 1.9, 1.56, -1.0);

  // the clerk
  const clerk = new THREE.Group();
  clerk.position.set(1.0, 0, -1.65);
  add(new THREE.CylinderGeometry(0.26, 0.3, 1.1, 10), flat(0x3a6a8a), 0, 0.95, 0, clerk);
  add(new THREE.SphereGeometry(0.18, 12, 10), flat(0x8a5a3a), 0, 1.68, 0, clerk);
  add(new THREE.BoxGeometry(0.36, 0.06, 0.36), flat(0x24221f), 0, 1.84, 0, clerk);
  const arm = new THREE.Group();
  arm.position.set(0.3, 1.35, 0.05);
  add(new THREE.BoxGeometry(0.1, 0.5, 0.1), flat(0x3a6a8a), 0, -0.22, 0, arm);
  add(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 8), flat(0xc1272d), 0, -0.5, 0, arm);
  arm.rotation.x = -0.9;
  clerk.add(arm);
  g.add(clerk);

  // the ration book, open on the counter
  const book = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.34), new THREE.MeshStandardMaterial({ map: bookTexture(), roughness: 0.9 }));
  book.position.set(0.3, 1.075, -0.75);
  book.rotation.y = 0.15;
  g.add(book);

  // the fan
  const fan = new THREE.Group();
  fan.position.set(0.3, 4.4, 0.8);
  add(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 4), flat(0x222222), 0, 0.4, 0, fan);
  add(new THREE.CylinderGeometry(0.12, 0.12, 0.12, 10), flat(0x5a4a3a), 0, 0, 0, fan);
  const blades = new THREE.Group();
  for (let k = 0; k < 4; k++) {
    const b = add(new THREE.BoxGeometry(1.1, 0.02, 0.18), flat(0x8a6a44), 0.6, 0, 0);
    const piv = new THREE.Group();
    piv.rotation.y = (k * Math.PI) / 2;
    piv.add(b);
    blades.add(piv);
  }
  fan.add(blades);
  g.add(fan);

  // the day sign
  const dayCanvas = document.createElement('canvas');
  dayCanvas.width = 256;
  dayCanvas.height = 128;
  const dayTex = new THREE.CanvasTexture(dayCanvas);
  dayTex.colorSpace = THREE.SRGBColorSpace;
  const daySign = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshStandardMaterial({ map: dayTex, roughness: 0.9 }));
  daySign.position.set(-3.6, 2.6, -2.56);
  g.add(daySign);

  // the queue, seen from the back. You are behind the last one.
  const queue = [];
  const r = rng(77);
  const shirts = [0xe8e0d0, 0xc1272d, 0x3a6a8a, 0xd4a72c, 0x6a8a4a, 0xe28aa8, 0xf2ede0, 0x7a5a9a];
  for (let i = 0; i < 9; i++) {
    const p = new THREE.Group();
    const h = 1.0 + r() * 0.25;
    const shirt = flat(shirts[i % shirts.length], { roughness: 0.8 });
    add(new THREE.CylinderGeometry(0.2, 0.24, h, 10), shirt, 0, h / 2 + 0.25, 0, p);
    add(new THREE.CylinderGeometry(0.17, 0.17, 0.5, 8), flat(0x2a2a3a), 0, 0.25, 0, p);
    add(new THREE.SphereGeometry(0.16, 12, 10), flat([0x8a5a3a, 0x5a3a2a, 0xc89a72][i % 3]), 0, h + 0.42, 0, p);
    if (r() < 0.5) add(new THREE.SphereGeometry(0.17, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), flat(0x2a2522), 0, h + 0.45, 0, p); // hair
    if (r() < 0.45) add(new THREE.BoxGeometry(0.26, 0.24, 0.12), flat(0x8a7a5a), 0.28, h * 0.45 + 0.1, 0, p); // a bag, hopefully
    if (r() < 0.25) {
      const um = add(new THREE.ConeGeometry(0.42, 0.18, 10), flat(0x2a4a6a), 0, h + 0.82, 0, p); // an umbrella, for the sun
      add(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 4), flat(0x111111), 0, -0.25, 0, um);
    }
    p.userData = { phase: r() * 6, slot: i };
    g.add(p);
    queue.push(p);
  }
  const placeQueue = (p, slot) => {
    p.position.set(-1.05 - slot * 0.1, 0, -0.15 + slot * 0.62);
  };
  queue.forEach((p, i) => placeQueue(p, i));

  const handed = [];
  let stampT = 0;
  let shuffleT = 0;
  let visible = 6;

  return {
    setStock(open) {
      for (const id of SHELF) {
        slots[id].stock.visible = !!open[id];
        slots[id].none.visible = !open[id];
      }
    },
    setQueue(ahead) {
      visible = Math.max(1, Math.min(queue.length, Math.round(ahead / 6)));
      queue.forEach((p, i) => (p.visible = i < visible));
    },
    setDay(es, sub) {
      const ctx = dayCanvas.getContext('2d');
      ctx.fillStyle = '#1f3a2c';
      ctx.fillRect(0, 0, 256, 128);
      ctx.strokeStyle = '#7a5232';
      ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, 256, 128);
      ctx.fillStyle = '#efe9da';
      ctx.textAlign = 'center';
      ctx.font = `600 22px ${FONTS.body}`;
      ctx.fillText(sub, 128, 40);
      const s = fitText(ctx, es, 220, 56, FONTS.display);
      ctx.font = `${s}px ${FONTS.display}`;
      ctx.fillText(es, 128, 98);
      dayTex.needsUpdate = true;
    },
    /** The queue shuffles forward. */
    shuffle() {
      shuffleT = 1;
    },
    stamp() {
      stampT = 0.5;
    },
    /** Something is handed over the counter. */
    handOver(id) {
      const m = itemMesh(id);
      m.position.set(-0.4, 1.09, -0.7);
      m.userData.life = 2.4;
      g.add(m);
      handed.push(m);
    },
    tick(dt, t) {
      blades.rotation.y += dt * 1.8;
      for (const p of queue) {
        const u = p.userData;
        p.rotation.z = Math.sin(t * 0.8 + u.phase) * 0.02;
        p.rotation.y = Math.sin(t * 0.3 + u.phase) * 0.15;
      }
      if (shuffleT > 0) {
        shuffleT = Math.max(0, shuffleT - dt);
        const k = Math.sin(shuffleT * Math.PI) * 0.25;
        queue.forEach((p, i) => {
          placeQueue(p, i);
          p.position.z -= k;
        });
      }
      if (stampT > 0) {
        stampT = Math.max(0, stampT - dt);
        arm.rotation.x = -0.9 + Math.sin((stampT / 0.5) * Math.PI) * 0.9;
      }
      for (const m of handed) {
        m.userData.life -= dt;
        if (m.userData.life < 0.6) m.position.z += dt * 2.5;
      }
      for (let i = handed.length - 1; i >= 0; i--) {
        if (handed[i].userData.life <= 0) {
          g.remove(handed[i]);
          handed.splice(i, 1);
        }
      }
    },
  };
}

/** One unit of something, as it sits on a shelf. */
export function itemMesh(id) {
  const it = ITEMS[id];
  const mat = flat(it.colour, { roughness: 0.75 });
  const g = new THREE.Group();
  const add = (geo, m, x, y, z) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    g.add(mesh);
    return mesh;
  };
  switch (it.model) {
    case 'sack':
      add(new THREE.CylinderGeometry(0.1, 0.13, 0.3, 8), mat, 0, 0.15, 0);
      add(new THREE.ConeGeometry(0.1, 0.08, 8), mat, 0, 0.34, 0);
      break;
    case 'bottle':
      add(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 10), flat(it.colour, { roughness: 0.2, metalness: 0.1 }), 0, 0.15, 0);
      add(new THREE.CylinderGeometry(0.025, 0.04, 0.1, 8), flat(it.colour, { roughness: 0.2 }), 0, 0.35, 0);
      break;
    case 'tray':
      add(new THREE.BoxGeometry(0.26, 0.04, 0.2), flat(0x9a8a6a), 0, 0.02, 0);
      for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) add(new THREE.SphereGeometry(0.04, 8, 6), mat, (a - 1) * 0.08, 0.07, (b - 0.5) * 0.09);
      break;
    case 'tin':
      add(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 12), mat, 0, 0.09, 0);
      add(new THREE.CylinderGeometry(0.082, 0.082, 0.03, 12), flat(0xc1272d), 0, 0.12, 0);
      break;
    case 'loaf':
      add(new THREE.CapsuleGeometry(0.07, 0.16, 4, 8), mat, 0, 0.08, 0).rotation.z = Math.PI / 2;
      break;
    case 'bar':
      add(new THREE.BoxGeometry(0.18, 0.06, 0.1), mat, 0, 0.03, 0);
      break;
    default:
      add(new THREE.BoxGeometry(0.22, 0.2, 0.18), mat, 0, 0.1, 0);
  }
  return g;
}

function floorTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const r = rng(12);
    const n = 8;
    const s = w / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        ctx.fillStyle = (i + j) % 2 ? '#b8b0a0' : '#7a5a4a';
        ctx.fillRect(i * s, j * s, s, s);
        if (r() < 0.2) {
          ctx.fillStyle = 'rgba(0,0,0,0.15)';
          ctx.fillRect(i * s + r() * s * 0.5, j * s + r() * s * 0.5, s * 0.4, s * 0.3);
        }
      }
    }
    speckle(ctx, w, h, 0.12, r, 0.03);
  }, { repeat: [4, 3.5] });
}

function wallTexture() {
  return canvasTexture(1024, 384, (ctx, w, h) => {
    const r = rng(23);
    ctx.fillStyle = '#e8c86a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#5fb3a8';
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = r() < 0.5 ? '#e8dcc0' : '#d6cdb5';
      ctx.beginPath();
      const x = r() * w;
      const y = r() * h;
      ctx.moveTo(x, y);
      for (let k = 0; k < 6; k++) ctx.lineTo(x + (r() - 0.5) * 50, y + (r() - 0.5) * 30);
      ctx.fill();
    }
    speckle(ctx, w, h, 0.15, r, 0.02);
  });
}

function bannerTexture(text) {
  return canvasTexture(1024, 120, (ctx, w, h) => {
    ctx.fillStyle = '#c1272d';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f2ede0';
    ctx.textAlign = 'center';
    const s = fitText(ctx, text, w - 60, 90, FONTS.display);
    ctx.font = `${s}px ${FONTS.display}`;
    ctx.fillText(text, w / 2, h / 2 + s * 0.36);
    speckle(ctx, w, h, 0.12, rng(3), 0.02);
  });
}

function tagTexture(text) {
  return canvasTexture(256, 46, (ctx, w, h) => {
    ctx.fillStyle = '#f2ede0';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#24221f';
    ctx.textAlign = 'center';
    const s = fitText(ctx, text, w - 16, 34, FONTS.display);
    ctx.font = `${s}px ${FONTS.display}`;
    ctx.fillText(text, w / 2, h / 2 + s * 0.36);
  });
}

function noHayTexture() {
  return canvasTexture(200, 96, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f2ede0';
    ctx.fillRect(6, 6, w - 12, h - 12);
    ctx.strokeStyle = '#c1272d';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = '#c1272d';
    ctx.font = `60px ${FONTS.display}`;
    ctx.textAlign = 'center';
    ctx.fillText('NO HAY', w / 2, h / 2 + 22);
  });
}

function bookTexture() {
  return canvasTexture(256, 176, (ctx, w, h) => {
    ctx.fillStyle = '#efe6cc';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c9bfa6';
    ctx.fillRect(w / 2 - 2, 0, 4, h);
    ctx.strokeStyle = '#8a8070';
    ctx.lineWidth = 1;
    for (let y = 22; y < h; y += 16) {
      ctx.beginPath();
      ctx.moveTo(12, y);
      ctx.lineTo(w - 12, y);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(80,60,160,0.6)';
    const r = rng(5);
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.arc(30 + r() * (w - 60), 20 + r() * (h - 40), 10, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}
