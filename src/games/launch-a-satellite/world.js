// LAUNCH A SATELLITE · the world: an outdoor provincial yield conference.
// A tall board where each county's report rises as a rocket, a stage, your county's
// wheat field (thick enough to stand on, for the photograph), and your granary.
import * as THREE from 'three';
import { flat } from '../../shared/renderer.js';
import { PALETTE, CSS, FONTS } from '../../shared/palette.js';
import { canvasTexture, rng, fitText, speckle } from '../../shared/canvasTexture.js';

export const BOARD = { x: 0, y: 1.2, z: -8, w: 15, h: 8.6 };
export const COLUMNS = [-5.25, -1.75, 1.75, 5.25]; // rivals 0..2, then you
export const LOG_MIN = 2; // 100 jin
export const LOG_MAX = 5.4; // ~250,000 jin
export const GRANARY = new THREE.Vector3(-9, 0, 0);
export const FIELD = { x0: 3.6, x1: 9.6, z0: -0.6, z1: 4.4 };
export const TRUCK_STOP = new THREE.Vector3(-8.5, 0, 4.4);

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
    g.addColorStop(0, '#5a86b4');
    g.addColorStop(0.55, '#b9cbd6');
    g.addColorStop(0.7, '#efe2c4');
    g.addColorStop(1, '#d8c49a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

function earthTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const r = rng(59);
    ctx.fillStyle = '#9a8460';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = `rgba(${r() < 0.5 ? '90,74,50' : '170,150,110'},${0.12 + r() * 0.2})`;
      ctx.beginPath();
      ctx.ellipse(r() * w, r() * h, 10 + r() * 40, 6 + r() * 20, r() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    speckle(ctx, w, h, 0.2, r, 0.03);
  }, { repeat: [5, 4] });
}

function bannerTexture(text, bg = CSS.red, fg = CSS.cream) {
  return canvasTexture(1024, 128, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = fg;
    ctx.font = `${fitText(ctx, text, w - 60, 84, FONTS.display)}px ${FONTS.display}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 5);
  });
}

/** Height on the board for a report, by a logarithmic scale (the only scale big enough). */
export function boardY(report) {
  const k = (Math.log10(Math.max(100, report)) - LOG_MIN) / (LOG_MAX - LOG_MIN);
  return BOARD.y + 0.9 + THREE.MathUtils.clamp(k, 0, 1) * (BOARD.h - 1.6);
}

/** The board face: scale, columns, names and the current figures. Redrawn as reports arrive. */
export function drawBoard(canvas, { title, names, reports, leader, flags }) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = '#1e2a24';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = CSS.gold;
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, w - 10, h - 10);
  ctx.fillStyle = CSS.cream;
  ctx.font = `${fitText(ctx, title, w - 120, 46, FONTS.display)}px ${FONTS.display}`;
  ctx.textAlign = 'center';
  ctx.fillText(title, w / 2, 58);
  // the scale
  const yOf = (v) => {
    const k = (Math.log10(v) - LOG_MIN) / (LOG_MAX - LOG_MIN);
    const top = (0.9 / BOARD.h) * h;
    const bot = h - (0.9 / BOARD.h) * h;
    return bot - k * (bot - top - (0.7 / BOARD.h) * h);
  };
  ctx.font = `24px ${FONTS.body}`;
  ctx.textAlign = 'left';
  for (const v of [100, 1000, 10000, 100000]) {
    const y = yOf(v);
    ctx.strokeStyle = 'rgba(242,232,213,0.25)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(90, y);
    ctx.lineTo(w - 20, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(242,232,213,0.7)';
    ctx.fillText(v.toLocaleString('en-US'), 20, y - 6);
  }
  // the columns
  COLUMNS.forEach((cx, i) => {
    const x = ((cx - (BOARD.x - BOARD.w / 2)) / BOARD.w) * w;
    ctx.fillStyle = 'rgba(242,232,213,0.08)';
    ctx.fillRect(x - 36, 90, 72, h - 170);
    ctx.fillStyle = i === 3 ? CSS.gold : CSS.cream;
    ctx.textAlign = 'center';
    ctx.font = `${fitText(ctx, names[i], 220, 36, FONTS.display)}px ${FONTS.display}`;
    ctx.fillText(names[i], x, h - 44);
    if (reports[i]) {
      ctx.fillStyle = i === leader ? CSS.gold : CSS.cream;
      ctx.font = `30px ${FONTS.display}`;
      ctx.fillText(reports[i].toLocaleString('en-US'), x, h - 82);
    }
    if (flags[i]) {
      ctx.fillStyle = '#f2f2ec';
      ctx.font = `20px ${FONTS.body}`;
      ctx.fillText('WHITE FLAG', x, h - 16);
    }
  });
}

export function makeMaterials() {
  return {
    wood: flat(PALETTE.wood),
    woodLight: flat(0x7a5232),
    dark: flat(PALETTE.black),
    skin: flat(PALETTE.skin),
    red: flat(PALETTE.red),
    redDark: flat(PALETTE.redDark),
    cream: flat(PALETTE.cream),
    gold: flat(PALETTE.gold, { metalness: 0.5, roughness: 0.4, emissive: 0x6a4a00, emissiveIntensity: 0.4 }),
    mud: flat(0xa8906a),
    thatch: flat(0x8a7040),
    sack: flat(0xc9b48a),
    wheat: flat(0xd4b04a),
    wheatDark: flat(0xb08a30),
    coatBlue: flat(0x3d5a7a),
    coatGrey: flat(0x6a6a62),
    coatWhite: flat(0xe6e2d6),
    green: flat(0x4a6a3a),
    truck: flat(0x4a5a3a),
    glass: flat(0x2a3440),
    metal: flat(0x8a9096, { metalness: 0.6, roughness: 0.4 }),
    white: flat(0xf4f2ea, { side: THREE.DoubleSide }),
  };
}

export function person(m, coat, { hat = 'cap', scale = 1 } = {}) {
  const g = new THREE.Group();
  g.add(cyl(0.24, 0.32, 1.1, coat, 6, 0, 0.6, 0));
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 0), m.skin);
  head.position.y = 1.35;
  g.add(head);
  if (hat === 'cap') g.add(cyl(0.18, 0.18, 0.08, m.dark, 8, 0, 1.5, 0));
  if (hat === 'straw') g.add(cyl(0.05, 0.36, 0.16, m.thatch, 8, 0, 1.52, 0));
  if (hat === 'scarf') g.add(box(0.3, 0.08, 0.1, m.red, 0, 1.1, 0.2));
  const arms = new THREE.Group();
  arms.position.set(0, 1.05, 0);
  const la = box(0.1, 0.55, 0.1, coat, -0.3, -0.25, 0);
  const ra = box(0.1, 0.55, 0.1, coat, 0.3, -0.25, 0);
  arms.add(la, ra);
  g.add(arms);
  g.userData.arms = [la, ra];
  g.scale.setScalar(scale);
  g.traverse((o) => o.isMesh && (o.castShadow = true));
  return g;
}

/** A rocket, which is what a report becomes when it is large enough. */
export function makeRocket(m, you) {
  const g = new THREE.Group();
  const body = cyl(0.22, 0.22, 1.0, you ? m.gold : m.cream, 10, 0, 0.5, 0);
  const band = cyl(0.23, 0.23, 0.16, m.red, 10, 0, 0.62, 0);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 10), m.red);
  nose.position.y = 1.25;
  g.add(body, band, nose);
  for (let i = 0; i < 3; i++) {
    const fin = box(0.04, 0.35, 0.3, m.red, 0, 0.15, 0);
    const a = (i / 3) * Math.PI * 2;
    fin.position.set(Math.cos(a) * 0.24, 0.15, Math.sin(a) * 0.24);
    fin.rotation.y = -a;
    g.add(fin);
  }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.6, 8), new THREE.MeshBasicMaterial({ color: 0xffb040, transparent: true, opacity: 0 }));
  flame.rotation.x = Math.PI;
  flame.position.y = -0.3;
  g.add(flame);
  g.userData.flame = flame;
  // the satellite: a gold star that orbits whoever leads
  const star = new THREE.Mesh(starGeometry(), m.gold);
  star.visible = false;
  g.add(star);
  g.userData.star = star;
  // the white flag, for counties that need help with their attitude
  const flag = new THREE.Group();
  flag.add(box(0.03, 1.0, 0.03, m.wood, 0, 0.5, 0));
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4, 6, 1), m.white);
  cloth.geometry.translate(0.3, 0, 0);
  cloth.position.y = 0.8;
  flag.add(cloth);
  flag.position.set(0.35, 1.1, 0);
  flag.visible = false;
  g.add(flag);
  g.userData.flag = flag;
  g.userData.cloth = cloth;
  g.traverse((o) => o.isMesh && (o.castShadow = true));
  return g;
}

function starGeometry() {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? 0.12 : 0.3;
    s[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, -Math.sin(a) * r);
  }
  return new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false });
}

/** A sack of grain. */
export function makeSack(m) {
  const g = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.5, 7), m.sack);
  g.castShadow = true;
  g.receiveShadow = true;
  return g;
}

export function buildWorld(scene, m) {
  const refs = {};
  const r = rng(1958);

  scene.add(new THREE.Mesh(new THREE.SphereGeometry(170, 16, 12), new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, fog: false })));
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 80), new THREE.MeshStandardMaterial({ map: earthTexture(), roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // distant fields and hills
  for (let i = 0; i < 10; i++) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(20 + r() * 20, 14 + r() * 10), flat(i % 3 ? 0xc9a94a : 0x8a9a48));
    f.rotation.x = -Math.PI / 2;
    f.position.set(-60 + i * 13, 0.01, -26 - r() * 20);
    scene.add(f);
  }
  for (let i = 0; i < 8; i++) {
    const hill = new THREE.Mesh(new THREE.ConeGeometry(18 + r() * 14, 10 + r() * 10, 6), flat(i % 2 ? 0x6a7a58 : 0x7a8a68));
    hill.position.set(-110 + i * 32, 0, -110 - r() * 20);
    scene.add(hill);
  }

  // the board, on two tall posts
  const boardCanvas = document.createElement('canvas');
  boardCanvas.width = 1500;
  boardCanvas.height = 860;
  const boardTex = new THREE.CanvasTexture(boardCanvas);
  boardTex.colorSpace = THREE.SRGBColorSpace;
  boardTex.anisotropy = 4;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(BOARD.w, BOARD.h), new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.9 }));
  board.position.set(BOARD.x, BOARD.y + BOARD.h / 2, BOARD.z);
  scene.add(board);
  scene.add(box(BOARD.w + 0.6, BOARD.h + 0.6, 0.3, m.wood, BOARD.x, BOARD.y + BOARD.h / 2, BOARD.z - 0.2));
  scene.add(box(0.4, BOARD.y + BOARD.h + 1.6, 0.4, m.wood, BOARD.x - BOARD.w / 2 - 0.5, (BOARD.y + BOARD.h + 1.6) / 2, BOARD.z - 0.3));
  scene.add(box(0.4, BOARD.y + BOARD.h + 1.6, 0.4, m.wood, BOARD.x + BOARD.w / 2 + 0.5, (BOARD.y + BOARD.h + 1.6) / 2, BOARD.z - 0.3));
  refs.boardCanvas = boardCanvas;
  refs.boardTex = boardTex;

  // the stage in front of it: a long table with a red cloth and the officials
  const stage = new THREE.Group();
  stage.add(box(14, 0.6, 3.2, m.wood, 0, 0.3, 0));
  stage.add(box(9, 0.9, 0.9, m.red, 0, 1.05, 0.6));
  const officials = [];
  for (let i = 0; i < 5; i++) {
    const o = person(m, i === 2 ? m.coatGrey : m.coatBlue);
    o.position.set(-3.2 + i * 1.6, 0.6, -0.2);
    stage.add(o);
    officials.push(o);
    const flowers = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), m.red);
    flowers.position.set(-3.2 + i * 1.6, 1.6, 0.6);
    stage.add(flowers);
  }
  stage.position.set(0, 0, BOARD.z + 2.6);
  stage.traverse((o) => o.isMesh && (o.castShadow = o.receiveShadow = true));
  scene.add(stage);
  refs.officials = officials;

  // bunting between the posts
  const bunting = new THREE.Mesh(new THREE.PlaneGeometry(BOARD.w + 1, 0.9), new THREE.MeshStandardMaterial({ map: bannerTexture('MORE · FASTER · BETTER · MORE'), roughness: 1, side: THREE.DoubleSide }));
  bunting.position.set(BOARD.x, BOARD.y + BOARD.h + 1.05, BOARD.z + 0.05);
  scene.add(bunting);

  // the rockets, one per county, waiting at the bottom of their columns
  refs.rockets = COLUMNS.map((x, i) => {
    const rk = makeRocket(m, i === 3);
    rk.position.set(x, boardY(100) - 0.4, BOARD.z + 0.45);
    rk.scale.setScalar(0.9);
    scene.add(rk);
    return rk;
  });

  // the loudspeakers
  for (const x of [-9.2, 9.2]) {
    const pole = new THREE.Group();
    pole.add(box(0.2, 9, 0.2, m.wood, 0, 4.5, 0));
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 8, 1, true), flat(0x9a9a92, { side: THREE.DoubleSide }));
    horn.rotation.x = Math.PI / 2;
    horn.position.set(0, 8.4, 0.6);
    pole.add(horn);
    pole.position.set(x, 0, BOARD.z + 1);
    scene.add(pole);
  }

  // your county's field: dense wheat, instanced
  const stalkGeo = new THREE.BoxGeometry(0.05, 1, 0.05);
  stalkGeo.translate(0, 0.5, 0);
  const n = 2600;
  const wheat = new THREE.InstancedMesh(stalkGeo, m.wheat, n);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    dummy.position.set(THREE.MathUtils.lerp(FIELD.x0, FIELD.x1, r()), 0, THREE.MathUtils.lerp(FIELD.z0, FIELD.z1, r()));
    dummy.rotation.set((r() - 0.5) * 0.2, r() * 3, (r() - 0.5) * 0.2);
    dummy.scale.set(1, 0.9 + r() * 0.3, 1);
    dummy.updateMatrix();
    wheat.setMatrixAt(i, dummy.matrix);
  }
  wheat.castShadow = true;
  wheat.receiveShadow = true;
  scene.add(wheat);
  const heads = new THREE.Mesh(new THREE.BoxGeometry(FIELD.x1 - FIELD.x0, 0.18, FIELD.z1 - FIELD.z0), m.wheatDark);
  heads.position.set((FIELD.x0 + FIELD.x1) / 2, 1.0, (FIELD.z0 + FIELD.z1) / 2);
  heads.receiveShadow = true;
  scene.add(heads);
  // a sign by the field
  const sign = new THREE.Group();
  sign.add(box(0.08, 1.6, 0.08, m.wood, 0, 0.8, 0));
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.5), new THREE.MeshStandardMaterial({ map: bannerTexture('EXPERIMENTAL FIELD'), roughness: 1 }));
  plate.position.set(0, 1.5, 0.05);
  sign.add(plate);
  sign.position.set(FIELD.x0 - 0.4, 0, FIELD.z1 + 0.2);
  sign.rotation.y = -0.3;
  scene.add(sign);

  // the children, for the photograph: they will stand on the wheat
  refs.children = [0, 1, 2].map((i) => {
    const c = person(m, [m.coatWhite, m.red, m.coatBlue][i], { hat: 'scarf', scale: 0.62 });
    c.position.set(FIELD.x0 + 2.2 + i * 1.1, 1.08, FIELD.z0 + 2.2 + (i % 2) * 0.5);
    c.rotation.y = -0.3;
    c.visible = false;
    scene.add(c);
    return c;
  });
  // the photographer
  const photographer = new THREE.Group();
  const ph = person(m, m.coatGrey);
  photographer.add(ph);
  for (let i = 0; i < 3; i++) {
    const leg = box(0.04, 1.4, 0.04, m.dark, 0, 0.7, 0);
    const a = (i / 3) * Math.PI * 2;
    leg.position.set(0.6 + Math.cos(a) * 0.2, 0.65, 0.4 + Math.sin(a) * 0.2);
    leg.rotation.set(Math.sin(a) * 0.15, 0, -Math.cos(a) * 0.15);
    photographer.add(leg);
  }
  photographer.add(box(0.36, 0.3, 0.3, m.dark, 0.6, 1.45, 0.4));
  const flash = new THREE.PointLight(0xffffff, 0, 14, 1.4);
  flash.position.set(0.6, 1.9, 0.2);
  photographer.add(flash);
  photographer.position.set(FIELD.x0 - 1.6, 0, (FIELD.z0 + FIELD.z1) / 2 + 0.6);
  photographer.rotation.y = Math.PI / 2;
  photographer.visible = false;
  scene.add(photographer);
  refs.photographer = photographer;
  refs.flash = flash;

  // the granary: a round mud store with a thatched cone, and the sacks in front of it
  const granary = new THREE.Group();
  granary.add(cyl(1.7, 1.8, 2.8, m.mud, 12, 0, 1.4, 0));
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.3, 1.6, 12), m.thatch);
  roof.position.y = 3.6;
  granary.add(roof, box(0.9, 1.6, 0.1, m.wood, 0, 0.8, 1.76));
  const gsign = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.4), new THREE.MeshStandardMaterial({ map: bannerTexture('COUNTY GRANARY'), roughness: 1 }));
  gsign.position.set(0, 2.25, 1.8);
  granary.add(gsign);
  granary.position.copy(GRANARY);
  granary.rotation.y = 0.35;
  granary.traverse((o) => o.isMesh && (o.castShadow = o.receiveShadow = true));
  scene.add(granary);
  refs.sackSpots = [];
  for (let i = 0; i < 24; i++) {
    const row = Math.floor(i / 8);
    const k = i % 8;
    const local = new THREE.Vector3(-1.75 + k * 0.5 + (row % 2) * 0.25, 0.25 + row * 0.42, 2.6 - row * 0.12);
    refs.sackSpots.push(local.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.35).add(GRANARY));
  }

  // the procurement truck, parked out of sight until needed
  const truck = new THREE.Group();
  truck.add(box(1.6, 1.3, 1.7, m.truck, 1.6, 1.05, 0), box(0.1, 0.5, 1.4, m.glass, 2.42, 1.3, 0));
  truck.add(box(2.8, 0.15, 1.9, m.truck, -0.6, 0.6, 0), box(2.8, 0.6, 0.08, m.truck, -0.6, 0.95, 0.92), box(2.8, 0.6, 0.08, m.truck, -0.6, 0.95, -0.92), box(0.08, 0.6, 1.9, m.truck, -2, 0.95, 0));
  for (const [x, z] of [[1.6, 0.9], [1.6, -0.9], [-1.3, 0.9], [-1.3, -0.9]]) {
    const w = cyl(0.36, 0.36, 0.25, m.dark, 10, x, 0.36, z);
    w.rotation.x = Math.PI / 2;
    truck.add(w);
  }
  const tsign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.45), new THREE.MeshStandardMaterial({ map: bannerTexture('STATE PROCUREMENT'), roughness: 1, side: THREE.DoubleSide }));
  tsign.position.set(-0.6, 1.0, 0.97);
  truck.add(tsign);
  truck.traverse((o) => o.isMesh && (o.castShadow = true));
  truck.position.set(-26, 0, TRUCK_STOP.z);
  scene.add(truck);
  refs.truck = truck;

  // a crowd of delegates, facing the board
  refs.crowd = [];
  for (let i = 0; i < 16; i++) {
    const d = person(m, [m.coatBlue, m.coatGrey, m.coatBlue, m.coatWhite][i % 4], { hat: i % 3 ? 'cap' : 'straw' });
    d.position.set(-6 + (i % 8) * 1.6 + (r() - 0.5) * 0.5, 0, -3 + Math.floor(i / 8) * 1.3 + (r() - 0.5) * 0.4);
    d.rotation.y = Math.PI + (r() - 0.5) * 0.4;
    scene.add(d);
    refs.crowd.push(d);
  }

  // light: a bright, optimistic noon
  const hemi = new THREE.HemisphereLight(0xf6ead4, 0x5a4a3a, 1.0);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff0d0, 2.4);
  key.position.set(12, 18, 12);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -22, right: 22, top: 18, bottom: -14, near: 1, far: 80 });
  key.shadow.bias = -0.0005;
  scene.add(key);
  return refs;
}
