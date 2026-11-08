// THE PRESS CONFERENCE · the world: a panelled press room in the evening, seen from the
// spokesman's chair. Rows of reporters, television cameras with hot lamps, a clock, a door,
// and a television on a trolley that will later show something nobody planned.
import * as THREE from 'three';
import { flat } from '../../shared/renderer.js';
import { PALETTE, CSS, FONTS } from '../../shared/palette.js';
import { canvasTexture, rng, fitText, speckle } from '../../shared/canvasTexture.js';

export const ROOM = { halfW: 8, back: -12, front: 2.2, height: 4.6 };
export const DOOR = new THREE.Vector3(5.2, 0, ROOM.back + 0.3);

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

function panelTexture() {
  return canvasTexture(512, 256, (ctx, w, h) => {
    const r = rng(89);
    ctx.fillStyle = '#7a5a3a';
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 64) {
      const c = 105 + r() * 20;
      ctx.fillStyle = `rgb(${c},${c * 0.72},${c * 0.46})`;
      ctx.fillRect(x + 2, 0, 60, h);
      ctx.strokeStyle = 'rgba(40,24,10,0.25)';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        const y0 = r() * h;
        ctx.moveTo(x + 4, y0);
        ctx.bezierCurveTo(x + 20, y0 + 20, x + 40, y0 - 20, x + 60, y0 + 6);
        ctx.stroke();
      }
    }
    speckle(ctx, w, h, 0.08, r, 0.01);
  }, { repeat: [4, 1] });
}

function carpetTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const r = rng(9);
    ctx.fillStyle = '#5a4a3a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(140,110,70,0.25)';
    ctx.lineWidth = 3;
    for (let i = 0; i < w; i += 32) {
      ctx.strokeRect(i + 4, 4, 24, h - 8);
    }
    speckle(ctx, w, h, 0.18, r, 0.05);
  }, { repeat: [6, 6] });
}

function signTexture(text, bg = '#e6dac2', fg = CSS.ink) {
  return canvasTexture(512, 128, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = fg;
    ctx.font = `${fitText(ctx, text, w - 40, 72, FONTS.display)}px ${FONTS.display}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 4);
  });
}

/** The television picture: a test card, or later, the crossing. */
export function drawTV(canvas, mode, t = 0) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  if (mode === 'test') {
    const bars = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
    bars.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect((i * w) / bars.length, 0, w / bars.length + 1, h * 0.72);
    });
    ctx.fillStyle = '#111';
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.fillStyle = '#eee';
    ctx.font = `bold 20px ${FONTS.body}`;
    ctx.textAlign = 'center';
    ctx.fillText('PROGRAMME RESUMES SHORTLY', w / 2, h * 0.88);
    return;
  }
  if (mode === 'live') {
    // the conference, live: a grey room with a man at a table
    ctx.fillStyle = '#5a5650';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#3a3630';
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.42, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(w / 2 - 44, h * 0.5, 88, 60);
    ctx.fillStyle = '#c1272d';
    ctx.font = `bold 16px ${FONTS.body}`;
    ctx.textAlign = 'left';
    ctx.fillText('● LIVE', 12, 24);
    return;
  }
  // the crossing: a barrier, a floodlight, and more and more people
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#0e1420');
  g.addColorStop(1, '#2a2a30');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,240,200,0.18)';
  ctx.beginPath();
  ctx.moveTo(w * 0.8, 0);
  ctx.lineTo(w * 0.45, h);
  ctx.lineTo(w * 1.05, h);
  ctx.fill();
  const r = rng(11);
  const n = Math.min(260, 40 + t * 40);
  for (let i = 0; i < n; i++) {
    const x = r() * w;
    const y = h * 0.55 + r() * h * 0.45;
    const s = 6 + (y / h) * 10;
    ctx.fillStyle = `rgba(${20 + r() * 40},${20 + r() * 40},${30 + r() * 40},1)`;
    ctx.beginPath();
    ctx.arc(x, y - s * 1.6, s * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - s * 0.5, y - s * 1.2, s, s * 1.4);
  }
  // the barrier, rising as t grows
  ctx.save();
  ctx.translate(w * 0.18, h * 0.6);
  ctx.rotate(-Math.min(1.2, t * 0.3));
  ctx.fillStyle = '#e6e2d6';
  ctx.fillRect(0, -6, w * 0.6, 12);
  ctx.fillStyle = '#c1272d';
  for (let x = 0; x < w * 0.6; x += 40) ctx.fillRect(x, -6, 20, 12);
  ctx.restore();
  ctx.fillStyle = '#c1272d';
  ctx.font = `bold 16px ${FONTS.body}`;
  ctx.textAlign = 'left';
  ctx.fillText('● LIVE · A CROSSING', 12, 24);
}

/** The wall clock face. */
export function drawClock(canvas, hh, mm) {
  const ctx = canvas.getContext('2d');
  const s = canvas.width;
  ctx.fillStyle = '#f2ece0';
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s / 2 - 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 6;
  ctx.stroke();
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const r0 = i % 5 ? s * 0.42 : s * 0.36;
    ctx.lineWidth = i % 5 ? 2 : 6;
    ctx.beginPath();
    ctx.moveTo(s / 2 + Math.sin(a) * r0, s / 2 - Math.cos(a) * r0);
    ctx.lineTo(s / 2 + Math.sin(a) * s * 0.46, s / 2 - Math.cos(a) * s * 0.46);
    ctx.stroke();
  }
  const hand = (a, len, wdt) => {
    ctx.lineWidth = wdt;
    ctx.beginPath();
    ctx.moveTo(s / 2, s / 2);
    ctx.lineTo(s / 2 + Math.sin(a) * len, s / 2 - Math.cos(a) * len);
    ctx.stroke();
  };
  hand(((hh % 12) + mm / 60) / 12 * Math.PI * 2, s * 0.24, 10);
  hand((mm / 60) * Math.PI * 2, s * 0.38, 6);
}

export function makeMaterials() {
  return {
    panel: new THREE.MeshStandardMaterial({ map: panelTexture(), roughness: 0.8 }),
    carpet: new THREE.MeshStandardMaterial({ map: carpetTexture(), roughness: 1 }),
    ceiling: flat(0xd8d0c0),
    table: flat(0x5a3a22),
    cloth: flat(0x2a3a5a),
    chair: flat(0x6a5a48),
    dark: flat(PALETTE.black),
    metal: flat(0x8a9096, { metalness: 0.6, roughness: 0.4 }),
    skin: flat(PALETTE.skin),
    suits: [flat(0x3a3a3e), flat(0x5a4a3a), flat(0x6a6a62), flat(0x3d4a5a), flat(0x7a6a52), flat(0x4a3a3a)],
    hair: [flat(0x2a2018), flat(0x6a5038), flat(0x9a9488), flat(0x3a2a20)],
    paper: flat(0xf2ece0),
    glass: new THREE.MeshStandardMaterial({ color: 0xbcd0d8, transparent: true, opacity: 0.4, roughness: 0.1 }),
    water: new THREE.MeshStandardMaterial({ color: 0x9ab8c8, transparent: true, opacity: 0.5 }),
    lamp: new THREE.MeshBasicMaterial({ color: 0xfff2d0 }),
    tv: flat(0x4a3a2a),
    red: flat(PALETTE.red),
    curtain: flat(0x6a2a24),
  };
}

/** A reporter in a chair. `stand` animates them up; `hand` raises a hand. */
function reporter(m, r, i) {
  const g = new THREE.Group();
  const suit = m.suits[i % m.suits.length];
  const body = new THREE.Group();
  body.add(cyl(0.22, 0.28, 0.75, suit, 7, 0, 0.42, 0));
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 0), m.skin);
  head.position.y = 0.95;
  const hair = new THREE.Mesh(new THREE.IcosahedronGeometry(0.155, 0), m.hair[i % m.hair.length]);
  hair.position.set(0, 1.0, -0.03);
  hair.scale.set(1, 0.7, 1);
  body.add(head, hair);
  if (r() < 0.3) body.add(box(0.07, 0.04, 0.02, m.dark, -0.055, 0.97, 0.14), box(0.07, 0.04, 0.02, m.dark, 0.055, 0.97, 0.14)); // spectacles
  const arm = new THREE.Group();
  arm.position.set(0.26, 0.7, 0);
  arm.add(box(0.09, 0.5, 0.09, suit, 0, -0.22, 0));
  body.add(arm);
  const pad = box(0.18, 0.02, 0.24, m.paper, -0.1, 0.55, 0.2);
  pad.rotation.x = -0.6;
  body.add(pad);
  body.position.y = 0.45;
  g.add(body);
  // the chair
  g.add(box(0.5, 0.06, 0.5, m.chair, 0, 0.45, 0), box(0.5, 0.6, 0.06, m.chair, 0, 0.75, -0.24));
  for (const [x, z] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) g.add(box(0.04, 0.45, 0.04, m.metal, x, 0.22, z));
  g.userData = { body, arm, head, stand: 0, hand: 0, target: 0, handTarget: 0, run: null };
  g.traverse((o) => o.isMesh && (o.castShadow = true));
  return g;
}

function tvCamera(m) {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = box(0.04, 1.5, 0.04, m.dark, Math.cos(a) * 0.25, 0.72, Math.sin(a) * 0.25);
    leg.rotation.set(Math.sin(a) * 0.18, 0, -Math.cos(a) * 0.18);
    g.add(leg);
  }
  const cam = new THREE.Group();
  cam.add(box(0.36, 0.4, 0.7, m.dark, 0, 0, 0), cyl(0.12, 0.14, 0.3, m.metal, 10, 0, 0.02, 0.48));
  cam.children[1].rotation.x = Math.PI / 2;
  cam.position.y = 1.6;
  g.add(cam);
  // the hot lamp
  const lamp = new THREE.Group();
  lamp.add(box(0.3, 0.3, 0.2, m.metal, 0, 0, 0));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), m.lamp);
  face.position.z = 0.11;
  lamp.add(face);
  lamp.position.set(0.32, 1.95, 0.1);
  g.add(lamp);
  return g;
}

export function buildWorld(scene, m) {
  const refs = { reporters: [], flashes: [] };
  const r = rng(1989);
  const { halfW, back, front, height } = ROOM;
  const depth = front - back;

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(halfW * 2, depth), m.carpet);
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = (front + back) / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(halfW * 2, depth), m.ceiling);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, height, (front + back) / 2);
  scene.add(ceil);
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(halfW * 2, height), m.panel);
  backWall.position.set(0, height / 2, back);
  scene.add(backWall);
  for (const s of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(depth, height), m.panel);
    wall.rotation.y = -s * Math.PI / 2;
    wall.position.set(s * halfW, height / 2, (front + back) / 2);
    scene.add(wall);
  }
  // strip lights
  for (let z = back + 2; z < front; z += 3.2) scene.add(box(3.2, 0.06, 0.3, m.lamp, 0, height - 0.04, z));

  // the door, the clock above it and a sign
  scene.add(box(1.4, 2.4, 0.08, m.table, DOOR.x, 1.2, back + 0.05));
  scene.add(box(0.08, 0.08, 0.08, m.metal, DOOR.x + 0.5, 1.1, back + 0.12));
  const exitSign = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.25), new THREE.MeshBasicMaterial({ map: signTexture('AUSGANG · EXIT', '#2a6a3a', '#f2f2ec') }));
  exitSign.position.set(DOOR.x, 2.6, back + 0.06);
  scene.add(exitSign);
  const clockCanvas = document.createElement('canvas');
  clockCanvas.width = clockCanvas.height = 256;
  const clockTex = new THREE.CanvasTexture(clockCanvas);
  clockTex.colorSpace = THREE.SRGBColorSpace;
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.45, 32), new THREE.MeshStandardMaterial({ map: clockTex, roughness: 0.6 }));
  clock.position.set(0, 3.5, back + 0.06);
  scene.add(clock);
  const rim = cyl(0.48, 0.48, 0.06, m.dark, 32, 0, 3.5, back + 0.02);
  rim.rotation.x = Math.PI / 2;
  scene.add(rim);
  refs.clockCanvas = clockCanvas;
  refs.clockTex = clockTex;
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.5), new THREE.MeshStandardMaterial({ map: signTexture('INTERNATIONAL PRESS CENTRE', CSS.red, CSS.cream), roughness: 1 }));
  banner.position.set(-2.6, 3.4, back + 0.06);
  scene.add(banner);

  // the reporters: four rows facing you
  const rows = [-2.4, -3.8, -5.2, -6.6];
  let i = 0;
  rows.forEach((z, row) => {
    const n = row < 2 ? 6 : 7;
    for (let k = 0; k < n; k++) {
      const x = (k - (n - 1) / 2) * 1.05 + (r() - 0.5) * 0.1;
      const rep = reporter(m, r, i);
      rep.position.set(x, 0, z);
      rep.rotation.y = Math.atan2(-x, -z) * 0.6; // they all face the table, roughly
      scene.add(rep);
      refs.reporters.push(rep);
      i++;
    }
  });

  // television cameras and photographers along the sides and back
  for (const [x, z, ry] of [[-6.2, -5.5, 0.5], [6.2, -6, -0.5], [-2.2, -8.6, 0.1], [2.6, -8.8, -0.1]]) {
    const c = tvCamera(m);
    c.position.set(x, 0, z);
    c.rotation.y = ry;
    scene.add(c);
  }
  for (const [x, z] of [[-6.6, -2.2], [6.6, -3], [-4.6, -8], [5.6, -8.4]]) {
    const light = new THREE.PointLight(0xffffff, 0, 10, 1.4);
    light.position.set(x, 2.2, z);
    scene.add(light);
    refs.flashes.push(light);
  }

  // the television on its trolley
  const tvCanvas = document.createElement('canvas');
  tvCanvas.width = 320;
  tvCanvas.height = 240;
  const tvTex = new THREE.CanvasTexture(tvCanvas);
  tvTex.colorSpace = THREE.SRGBColorSpace;
  const tv = new THREE.Group();
  tv.add(box(1.2, 0.95, 0.8, m.tv, 0, 0, 0));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.7), new THREE.MeshBasicMaterial({ map: tvTex }));
  screen.position.set(-0.08, 0, 0.41);
  tv.add(screen);
  tv.add(box(0.1, 0.3, 0.02, m.metal, 0.5, 0.1, 0.41));
  tv.position.set(-5.4, 1.55, -1.4);
  tv.rotation.y = 0.75;
  const trolley = new THREE.Group();
  trolley.add(box(1.3, 0.05, 0.9, m.metal, 0, 1.05, 0), box(1.3, 0.05, 0.9, m.metal, 0, 0.35, 0));
  for (const [x, z] of [[-0.6, -0.4], [0.6, -0.4], [-0.6, 0.4], [0.6, 0.4]]) trolley.add(box(0.04, 1.05, 0.04, m.metal, x, 0.53, z));
  trolley.position.set(-5.4, 0, -1.4);
  trolley.rotation.y = 0.75;
  scene.add(tv, trolley);
  refs.tvCanvas = tvCanvas;
  refs.tvTex = tvTex;
  refs.tvLight = new THREE.PointLight(0x9ab0ff, 1.2, 4, 1.6);
  refs.tvLight.position.set(-5, 1.6, -0.8);
  scene.add(refs.tvLight);

  // your table: blue cloth, microphones, water, the nameplate, the note
  const table = new THREE.Group();
  table.add(box(5.4, 0.08, 1.1, m.table, 0, 0.78, 0));
  table.add(box(5.4, 0.72, 0.04, m.cloth, 0, 0.4, -0.55));
  const mics = [];
  for (const x of [-0.5, -0.15, 0.2, 0.55]) {
    const mic = new THREE.Group();
    mic.add(cyl(0.06, 0.08, 0.04, m.dark, 8, 0, 0.02, 0));
    const stem = box(0.015, 0.4, 0.015, m.metal, 0, 0.2, 0);
    stem.rotation.x = -0.3;
    mic.add(stem);
    const head = cyl(0.035, 0.03, 0.12, m.dark, 8, 0, 0.42, -0.12);
    head.rotation.x = -1.2;
    mic.add(head);
    const tag = box(0.08, 0.05, 0.005, [m.red, m.cloth, m.paper, m.red][mics.length], 0, 0.3, -0.06);
    mic.add(tag);
    mic.position.set(x, 0.82, -0.32);
    mic.rotation.y = (x * 0.6);
    table.add(mic);
    mics.push(mic);
  }
  const glass = cyl(0.05, 0.045, 0.14, m.glass, 10, 0.95, 0.89, -0.05);
  const water = cyl(0.045, 0.04, 0.09, m.water, 10, 0.95, 0.865, -0.05);
  table.add(glass, water);
  const papers = box(0.5, 0.01, 0.36, m.paper, -0.25, 0.83, 0.15);
  papers.rotation.y = 0.15;
  table.add(papers);
  const note = box(0.21, 0.012, 0.3, m.paper, 0.4, 0.84, 0.15);
  note.rotation.y = -0.2;
  table.add(note);
  table.position.set(0, 0, 0);
  scene.add(table);
  refs.mics = mics;
  refs.note = note;
  // your hands, resting on the table, holding things
  const hands = [-0.32, 0.38].map((x) => {
    const hnd = new THREE.Group();
    hnd.add(box(0.12, 0.08, 0.3, m.suits[0], 0, 0, 0.3), box(0.1, 0.05, 0.12, m.skin, 0, -0.01, 0.08));
    hnd.position.set(x, 0.86, 0.3);
    table.add(hnd);
    return hnd;
  });
  refs.hands = hands;

  // light: tired fluorescent overhead, hot television lamps
  scene.add(new THREE.HemisphereLight(0xf0ead8, 0x4a3a2a, 0.9));
  const key = new THREE.DirectionalLight(0xfff6e0, 1.0);
  key.position.set(2, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -9, right: 9, top: 6, bottom: -14, near: 0.5, far: 30 });
  scene.add(key);
  const tvLamps = new THREE.SpotLight(0xfff0d0, 30, 18, 0.7, 0.6, 1.2);
  tvLamps.position.set(0, 2.6, -8);
  tvLamps.target.position.set(0, 1.2, 0.5);
  scene.add(tvLamps, tvLamps.target);
  refs.key = key;
  return refs;
}
