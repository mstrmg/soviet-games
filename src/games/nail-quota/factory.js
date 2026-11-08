// NAIL QUOTA — the factory floor of Nail Factory No. 4.
import * as THREE from 'three';
import { flat } from '../../shared/renderer.js';
import { PALETTE, CSS, FONTS } from '../../shared/palette.js';
import { canvasTexture, rng, speckle, fitText } from '../../shared/canvasTexture.js';

export const OUTPUT_CENTER = new THREE.Vector3(4, 0, 1);
export const PRESS_POS = new THREE.Vector3(-9, 0, -4);

const ROOM = { x0: -20, x1: 20, z0: -12, z1: 16, h: 12 };

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

function castShadow(m) {
  m.castShadow = true;
  return m;
}

function concreteTexture() {
  const W = ROOM.x1 - ROOM.x0;
  const D = ROOM.z1 - ROOM.z0;
  const ppm = 32;
  return canvasTexture(W * ppm, D * ppm, (ctx, w, h) => {
    const r = rng(404);
    ctx.fillStyle = '#8d8a83';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 220; i++) {
      const x = r() * w;
      const y = r() * h;
      const rad = 20 + r() * 120;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, `rgba(${r() < 0.7 ? '40,35,30' : '220,215,200'},${0.05 + r() * 0.12})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    // expansion joints every 4 m
    ctx.strokeStyle = 'rgba(30,28,25,0.5)';
    ctx.lineWidth = 2;
    for (let x = 0; x < w; x += 4 * ppm) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 4 * ppm) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    const toPx = (x, z) => [(x - ROOM.x0) * ppm, (z - ROOM.z0) * ppm];
    // hazard border around the press
    const [px, pz] = toPx(PRESS_POS.x - 3, PRESS_POS.z - 2.5);
    const stripe = (x, y, ww, hh) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, ww, hh);
      ctx.clip();
      for (let i = -hh; i < ww + hh; i += 24) {
        ctx.fillStyle = (i / 24) % 2 === 0 ? '#d9a521' : '#1b1a18';
        ctx.beginPath();
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i + 12, y);
        ctx.lineTo(x + i + 12 + hh, y + hh);
        ctx.lineTo(x + i + hh, y + hh);
        ctx.fill();
      }
      ctx.restore();
    };
    const bw = 6 * ppm;
    const bh = 5 * ppm;
    stripe(px, pz, bw, 12);
    stripe(px, pz + bh - 12, bw, 12);
    stripe(px, pz, 12, bh);
    stripe(px + bw - 12, pz, 12, bh);
    // finished goods zone
    const [ox, oz] = toPx(OUTPUT_CENTER.x - 6, OUTPUT_CENTER.z - 5);
    ctx.strokeStyle = 'rgba(242,232,213,0.75)';
    ctx.setLineDash([22, 14]);
    ctx.lineWidth = 6;
    ctx.strokeRect(ox, oz, 12 * ppm, 10 * ppm);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(242,232,213,0.7)';
    ctx.font = `90px ${FONTS.display}`;
    ctx.fillText('FINISHED GOODS', ox + 20, oz + 10 * ppm - 24);
    ctx.fillStyle = 'rgba(193,39,45,0.75)';
    ctx.font = `600 30px ${FONTS.body}`;
    ctx.fillText('QUALITY CONTROL: NOT APPLICABLE', ox + 24, oz + 10 * ppm - 120);
    // oil stains
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = `rgba(20,18,14,${0.15 + r() * 0.25})`;
      ctx.beginPath();
      ctx.ellipse(r() * w, r() * h, 10 + r() * 50, 6 + r() * 30, r() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    speckle(ctx, w, h, 0.18, r, 0.02);
  });
}

function wallTexture(seed) {
  return canvasTexture(1024, 384, (ctx, w, h) => {
    const r = rng(seed);
    ctx.fillStyle = '#6e6a62';
    ctx.fillRect(0, 0, w, h);
    // painted lower band
    ctx.fillStyle = '#3f4a45';
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.fillStyle = CSS.cream;
    ctx.fillRect(0, h * 0.72 - 4, w, 4);
    // concrete panels
    ctx.strokeStyle = 'rgba(30,28,25,0.35)';
    ctx.lineWidth = 2;
    for (let x = 0; x < w; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h * 0.72);
      ctx.stroke();
    }
    for (let i = 0; i < 80; i++) {
      const x = r() * w;
      const y = r() * h;
      const rad = 10 + r() * 60;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, `rgba(20,18,14,${0.08 + r() * 0.1})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    speckle(ctx, w, h, 0.15, r, 0.03);
  });
}

function slogan(text, sub, w = 1024, h = 160) {
  return canvasTexture(w, h, (ctx) => {
    const r = rng(text.length);
    ctx.fillStyle = CSS.red;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = CSS.cream;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const s = fitText(ctx, text, w - 60, sub ? h * 0.62 : h * 0.8, FONTS.display);
    ctx.font = `${s}px ${FONTS.display}`;
    ctx.fillText(text, w / 2, sub ? h * 0.42 : h / 2 + 4);
    if (sub) {
      ctx.font = `600 ${Math.round(h * 0.14)}px ${FONTS.body}`;
      ctx.fillStyle = CSS.black;
      ctx.fillText(sub, w / 2, h * 0.82);
    }
    speckle(ctx, w, h, 0.12, r, 0.02);
  });
}

/** The PLAN / FACT board on the wall. Redrawn whenever numbers change. */
function makeBoard() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 512;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const draw = ({ year = '', title = '', plan = '', fact = '—', pct = null }) => {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#1d2a24';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = CSS.cream;
    ctx.lineWidth = 10;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.fillStyle = CSS.red;
    ctx.fillRect(14, 14, w - 28, 92);
    ctx.fillStyle = CSS.cream;
    ctx.textBaseline = 'middle';
    ctx.font = `76px ${FONTS.display}`;
    ctx.fillText(`${year} · ${title}`, 40, 64);
    ctx.font = `600 34px ${FONTS.body}`;
    ctx.fillStyle = CSS.greyLight;
    ctx.fillText('PLAN', 40, 170);
    ctx.fillText('FACT', 40, 290);
    ctx.fillStyle = CSS.cream;
    ctx.font = `92px ${FONTS.display}`;
    ctx.fillText(plan, 190, 172);
    ctx.fillText(fact, 190, 292);
    if (pct != null) {
      ctx.fillStyle = pct >= 100 ? CSS.gold : CSS.red;
      ctx.font = `120px ${FONTS.display}`;
      ctx.fillText(`${Math.round(pct)}%`, 40, 420);
      ctx.font = `600 30px ${FONTS.body}`;
      ctx.fillStyle = CSS.cream;
      ctx.fillText(pct >= 100 ? 'GLORY TO THE COLLECTIVE' : 'THE COLLECTIVE IS DISAPPOINTED', 300, 420);
    } else {
      ctx.fillStyle = CSS.greyLight;
      ctx.font = `600 30px ${FONTS.body}`;
      ctx.fillText('AWAITING PRODUCTION', 40, 420);
    }
    tex.needsUpdate = true;
  };
  draw({});
  return { tex, draw };
}

function makeWorker() {
  const g = new THREE.Group();
  const overalls = flat(0x3c4a5a);
  const dark = flat(0x1f1d1b);
  const skin = flat(PALETTE.skin);
  const legs = box(0.34, 0.85, 0.22, overalls, 0, 0.43, 0);
  const torso = box(0.46, 0.62, 0.26, overalls, 0, 1.17, 0);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 0), skin);
  head.position.y = 1.62;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 8), dark);
  cap.position.set(0, 1.74, 0.02);
  const brim = box(0.2, 0.02, 0.1, dark, 0, 1.72, 0.14);
  const armL = box(0.1, 0.6, 0.12, overalls, -0.29, 1.15, 0);
  const armR = box(0.1, 0.6, 0.12, overalls, 0.29, 1.15, 0);
  armL.rotation.z = 0.1;
  armR.rotation.z = -0.1;
  const bootL = box(0.14, 0.08, 0.28, dark, -0.09, 0.04, 0.04);
  const bootR = box(0.14, 0.08, 0.28, dark, 0.09, 0.04, 0.04);
  // a hammer, hopeful
  const handle = box(0.03, 0.32, 0.03, flat(PALETTE.wood), 0.32, 0.78, 0.04);
  const hammerHead = box(0.12, 0.05, 0.05, flat(PALETTE.greyDark, { metalness: 0.5 }), 0.32, 0.62, 0.04);
  g.add(legs, torso, head, cap, brim, armL, armR, bootL, bootR, handle, hammerHead);
  g.traverse((o) => o.isMesh && (o.castShadow = o.receiveShadow = true));
  return g;
}

export function buildFactory(scene) {
  const refs = {};
  const mats = {
    steel: flat(0x6b7178, { metalness: 0.5, roughness: 0.5 }),
    steelDark: flat(0x3a3e43, { metalness: 0.4, roughness: 0.6 }),
    red: flat(PALETTE.red),
    black: flat(PALETTE.black),
    cream: flat(PALETTE.cream),
    yellow: flat(0xd9a521),
    rust: flat(0x7a4a32),
    glass: new THREE.MeshBasicMaterial({ color: 0xdfe6e0 }),
    mullion: flat(0x2a2a28),
  };

  // floor
  const W = ROOM.x1 - ROOM.x0;
  const D = ROOM.z1 - ROOM.z0;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: concreteTexture(), roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set((ROOM.x0 + ROOM.x1) / 2, 0, (ROOM.z0 + ROOM.z1) / 2);
  floor.receiveShadow = true;
  scene.add(floor);

  // back wall with tall windows (a grid of panes; light pours through)
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture(9), roughness: 0.95 });
  const sideMat = new THREE.MeshStandardMaterial({ map: wallTexture(13), roughness: 0.95 });
  const backZ = ROOM.z0;
  const winY0 = 3.2;
  const winY1 = 10.2;
  const winXs = [-15, -9, -3, 3, 9, 15];
  const winW = 3.6;
  // build wall from strips around the windows
  const strips = [];
  strips.push(box(W, winY0, 0.3, wallMat, 0, winY0 / 2, backZ));
  strips.push(box(W, ROOM.h - winY1, 0.3, wallMat, 0, (ROOM.h + winY1) / 2, backZ));
  let x = ROOM.x0;
  for (const wx of winXs) {
    const left = wx - winW / 2;
    if (left > x) strips.push(box(left - x, winY1 - winY0, 0.3, wallMat, (x + left) / 2, (winY0 + winY1) / 2, backZ));
    x = wx + winW / 2;
  }
  if (x < ROOM.x1) strips.push(box(ROOM.x1 - x, winY1 - winY0, 0.3, wallMat, (x + ROOM.x1) / 2, (winY0 + winY1) / 2, backZ));
  strips.forEach((s) => {
    s.receiveShadow = true;
    s.castShadow = true; // so the sun only gets in through the windows
    scene.add(s);
  });
  const r = rng(12);
  for (const wx of winXs) {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(winW, winY1 - winY0), mats.glass);
    pane.position.set(wx, (winY0 + winY1) / 2, backZ - 0.1);
    scene.add(pane);
    for (let i = 1; i < 4; i++) scene.add(castShadow(box(0.08, winY1 - winY0, 0.12, mats.mullion, wx - winW / 2 + (i * winW) / 4, (winY0 + winY1) / 2, backZ)));
    for (let j = 1; j < 6; j++) scene.add(castShadow(box(winW, 0.08, 0.12, mats.mullion, wx, winY0 + (j * (winY1 - winY0)) / 6, backZ)));
    // a few broken panes, patched with plywood
    for (let k = 0; k < 2; k++) {
      if (r() < 0.6) {
        const cx = wx - winW / 2 + (Math.floor(r() * 4) + 0.5) * (winW / 4);
        const cy = winY0 + (Math.floor(r() * 6) + 0.5) * ((winY1 - winY0) / 6);
        scene.add(castShadow(box(winW / 4 - 0.1, (winY1 - winY0) / 6 - 0.1, 0.05, flat(0x8a6a48), cx, cy, backZ + 0.12)));
      }
    }
  }
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(D, ROOM.h), sideMat);
    wall.position.set(side > 0 ? ROOM.x1 : ROOM.x0, ROOM.h / 2, (ROOM.z0 + ROOM.z1) / 2);
    wall.rotation.y = -side * (Math.PI / 2);
    wall.receiveShadow = true;
    scene.add(wall);
  }
  // roof trusses
  for (let z = ROOM.z0 + 3; z < ROOM.z1; z += 5) {
    scene.add(box(W, 0.35, 0.25, mats.steelDark, 0, ROOM.h - 0.5, z));
    for (let i = -4; i <= 4; i++) {
      const diag = box(0.12, 1.6, 0.12, mats.steelDark, i * 4.4, ROOM.h - 1.2, z);
      diag.rotation.z = i % 2 ? 0.6 : -0.6;
      scene.add(diag);
    }
  }
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, D), flat(0x2a2926));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, ROOM.h, (ROOM.z0 + ROOM.z1) / 2);
  scene.add(ceiling);

  // slogans
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 1.6),
    new THREE.MeshStandardMaterial({ map: slogan('THE PLAN IS LAW · FULFIL THE PLAN · OVERFULFIL THE PLAN'), roughness: 1 }),
  );
  banner.position.set(0, 11.05, backZ + 0.2);
  scene.add(banner);
  const sideSign = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 1.4),
    new THREE.MeshStandardMaterial({ map: slogan('A NAIL IS A UNIT OF MEASUREMENT', 'DIRECTORATE OF FASTENERS'), roughness: 1 }),
  );
  sideSign.position.set(ROOM.x1 - 0.05, 7.6, 3);
  sideSign.rotation.y = -Math.PI / 2;
  scene.add(sideSign);

  // plan/fact board (left wall)
  const board = makeBoard();
  const boardMesh = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), new THREE.MeshStandardMaterial({ map: board.tex, roughness: 0.8 }));
  boardMesh.position.set(ROOM.x0 + 0.06, 5.2, 4);
  boardMesh.rotation.y = Math.PI / 2;
  scene.add(boardMesh);
  scene.add(box(0.12, 4.3, 6.3, mats.black, ROOM.x0 + 0.02, 5.2, 4));
  refs.board = board;

  // ---- the press ----------------------------------------------------------
  const press = new THREE.Group();
  press.position.copy(PRESS_POS);
  const base = box(3.4, 1.2, 2.6, mats.steelDark, 0, 0.6, 0);
  const die = box(2.2, 0.12, 1.6, mats.steel, 0, 1.26, 0);
  const colL = box(0.45, 5.2, 0.45, mats.red, -1.4, 3.6, 0);
  const colR = box(0.45, 5.2, 0.45, mats.red, 1.4, 3.6, 0);
  const crown = box(3.6, 1.2, 2.0, mats.red, 0, 6.6, 0);
  const crownPlate = box(3.7, 0.15, 2.1, mats.black, 0, 6.0, 0);
  const ram = new THREE.Group();
  ram.add(box(2.0, 1.0, 1.4, mats.steel, 0, 0, 0));
  ram.add(box(0.5, 1.6, 0.5, mats.steel, 0, 1.2, 0));
  const ramUp = 4.9;
  const ramDown = 1.85;
  ram.position.y = ramUp;
  const flywheel = new THREE.Group();
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.3, 16), mats.steelDark);
  wheel.rotation.z = Math.PI / 2;
  flywheel.add(wheel);
  for (let i = 0; i < 4; i++) {
    const spoke = box(0.34, 2.4, 0.18, mats.red, 0, 0, 0);
    spoke.rotation.x = (i * Math.PI) / 4;
    flywheel.add(spoke);
  }
  flywheel.position.set(2.1, 6.3, 0);
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 0.6),
    new THREE.MeshStandardMaterial({ map: slogan('PRESS No. 1 "PERSEVERANCE"', null, 512, 112) }),
  );
  plaque.position.set(0, 6.6, 1.01);
  press.add(base, die, colL, colR, crown, crownPlate, ram, flywheel, plaque);
  press.traverse((o) => o.isMesh && (o.castShadow = o.receiveShadow = true));
  scene.add(press);
  refs.press = { group: press, ram, flywheel, ramUp, ramDown };

  // conveyor from the press to finished goods
  const conveyor = new THREE.Group();
  const belt = box(8, 0.12, 1.2, mats.black, 0, 0.9, 0);
  conveyor.add(belt);
  for (let i = -3.8; i <= 3.8; i += 0.8) {
    const leg = box(0.1, 0.85, 0.1, mats.steelDark, i, 0.43, 0.5);
    const leg2 = leg.clone();
    leg2.position.z = -0.5;
    conveyor.add(leg, leg2);
  }
  conveyor.add(box(8, 0.2, 0.08, mats.yellow, 0, 1.0, 0.64));
  conveyor.add(box(8, 0.2, 0.08, mats.yellow, 0, 1.0, -0.64));
  conveyor.position.set(PRESS_POS.x + 5.6, 0, PRESS_POS.z + 0.2);
  conveyor.traverse((o) => o.isMesh && (o.castShadow = o.receiveShadow = true));
  scene.add(conveyor);

  // steel coils: the year's allocation, consumed during production
  refs.coils = [];
  const coilGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.7, 12);
  const coilEnd = new THREE.CylinderGeometry(0.22, 0.22, 0.72, 10);
  const coilMat = flat(0x7d838a, { metalness: 0.6, roughness: 0.4 });
  for (let i = 0; i < 24; i++) {
    const c = new THREE.Group();
    c.add(new THREE.Mesh(coilGeo, coilMat));
    c.add(new THREE.Mesh(coilEnd, mats.black));
    c.rotation.x = Math.PI / 2;
    const row = Math.floor(i / 6);
    const col = i % 6;
    c.position.set(-17.2 + col * 1.2, 0.55, -8 + row * 1.0);
    c.traverse((o) => o.isMesh && (o.castShadow = o.receiveShadow = true));
    scene.add(c);
    refs.coils.push(c);
  }
  const coilSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 0.7),
    new THREE.MeshStandardMaterial({ map: slogan('STEEL ALLOCATION', 'DO NOT ASK FOR MORE', 512, 112) }),
  );
  coilSign.position.set(-14.2, 2.2, -8.6);
  scene.add(coilSign);

  // hanging lamps
  for (const [lx, lz] of [[-9, -2], [4, 2], [12, -4]]) {
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.5, 10, 1, true), flat(0x2f4a3a, { side: THREE.DoubleSide }));
    shade.position.set(lx, 8.2, lz);
    const cord = box(0.03, ROOM.h - 8.4, 0.03, mats.black, lx, (ROOM.h + 8.4) / 2, lz);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe2a8 }));
    bulb.position.set(lx, 8.0, lz);
    scene.add(shade, cord, bulb);
    const pl = new THREE.PointLight(0xffd59a, 10, 14, 1.4);
    pl.position.set(lx, 7.7, lz);
    scene.add(pl);
  }

  // a worker for scale; moved next to whatever the factory produces
  const worker = makeWorker();
  worker.position.set(OUTPUT_CENTER.x - 2, 0, OUTPUT_CENTER.z + 2);
  scene.add(worker);
  refs.worker = worker;

  // sparks
  const sparkCount = 80;
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sparkCount * 3), 3));
  const sparks = new THREE.Points(
    sparkGeo,
    new THREE.PointsMaterial({ color: 0xffc46b, size: 0.09, transparent: true, opacity: 0, depthWrite: false }),
  );
  sparks.userData.vel = new Float32Array(sparkCount * 3);
  scene.add(sparks);
  refs.sparks = sparks;

  // light: low sun through the windows, long shadows toward us
  scene.add(new THREE.HemisphereLight(0xe8e2d4, 0x2a2622, 0.6));
  const sun = new THREE.DirectionalLight(0xffe6c4, 3.4);
  sun.position.set(-8, 14, -30);
  sun.target.position.set(2, 0, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 22, bottom: -22, near: 1, far: 80 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xc8d0dc, 0.8);
  fill.position.set(10, 8, 20);
  scene.add(fill);

  return refs;
}

/** Burst of sparks at the die. */
export function emitSparks(sparks, origin) {
  const pos = sparks.geometry.attributes.position;
  const vel = sparks.userData.vel;
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(i, origin.x + (Math.random() - 0.5) * 1.6, origin.y, origin.z + (Math.random() - 0.5) * 1.0);
    vel[i * 3] = (Math.random() - 0.5) * 6;
    vel[i * 3 + 1] = Math.random() * 4 + 1;
    vel[i * 3 + 2] = (Math.random() - 0.5) * 6;
  }
  pos.needsUpdate = true;
  sparks.material.opacity = 1;
}

export function updateSparks(sparks, dt) {
  if (sparks.material.opacity <= 0) return;
  const pos = sparks.geometry.attributes.position;
  const vel = sparks.userData.vel;
  for (let i = 0; i < pos.count; i++) {
    vel[i * 3 + 1] -= 12 * dt;
    let y = pos.getY(i) + vel[i * 3 + 1] * dt;
    if (y < 0.02) {
      y = 0.02;
      vel[i * 3 + 1] *= -0.3;
    }
    pos.setXYZ(i, pos.getX(i) + vel[i * 3] * dt, y, pos.getZ(i) + vel[i * 3 + 2] * dt);
  }
  pos.needsUpdate = true;
  sparks.material.opacity = Math.max(0, sparks.material.opacity - dt * 1.4);
}
