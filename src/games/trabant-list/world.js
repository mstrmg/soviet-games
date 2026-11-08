// THE TRABANT LIST · the world: a bare dealership showroom with one car on a turntable,
// shown "as specified". Each revision takes a piece of it away, or replaces it with cardboard.
import * as THREE from 'three';
import { flat } from '../../shared/renderer.js';
import { PALETTE, CSS, FONTS } from '../../shared/palette.js';
import { canvasTexture, rng, fitText, speckle } from '../../shared/canvasTexture.js';

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

function cyl(rt, rb, h, mat, seg = 12, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  return m;
}

function floorTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const r = rng(77);
    ctx.fillStyle = '#9a958b';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(40,36,30,0.35)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= w; i += 128) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(40,30,20,${0.05 + r() * 0.08})`;
      ctx.beginPath();
      ctx.ellipse(r() * w, r() * h, 10 + r() * 30, 6 + r() * 14, r() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    speckle(ctx, w, h, 0.15, r, 0.03);
  }, { repeat: [5, 5] });
}

function wallTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const r = rng(78);
    ctx.fillStyle = '#d8ccb0';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#b8a888';
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
    ctx.fillStyle = '#8a7a5a';
    ctx.fillRect(0, h * 0.62, w, 4);
    speckle(ctx, w, h, 0.08, r, 0.02);
  }, { repeat: [6, 1] });
}

function cardboardTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const r = rng(79);
    ctx.fillStyle = '#b08a5a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(90,60,30,0.25)';
    for (let x = 0; x < w; x += 6) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(60,40,20,0.7)';
    ctx.font = `bold 26px ${FONTS.body}`;
    ctx.textAlign = 'center';
    ctx.fillText('THIS WAY UP', w / 2, h * 0.42);
    ctx.font = `bold 40px ${FONTS.body}`;
    ctx.fillText('↑ ↑', w / 2, h * 0.68);
    speckle(ctx, w, h, 0.12, r, 0.02);
  });
}

function signTexture(text, sub, bg = CSS.red, fg = CSS.cream) {
  return canvasTexture(1024, 200, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.font = `${fitText(ctx, text, w - 60, 96, FONTS.display)}px ${FONTS.display}`;
    ctx.fillText(text, w / 2, sub ? 100 : 130);
    if (sub) {
      ctx.font = `${fitText(ctx, sub, w - 80, 40, FONTS.body)}px ${FONTS.body}`;
      ctx.fillText(sub, w / 2, 160);
    }
  });
}

/** The wall calendar: a big year, torn off once a year. */
export function drawCalendar(canvas, year) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = '#f2ece0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = CSS.red;
  ctx.fillRect(0, 0, w, h * 0.22);
  ctx.fillStyle = CSS.cream;
  ctx.font = `${Math.round(h * 0.13)}px ${FONTS.display}`;
  ctx.textAlign = 'center';
  ctx.fillText('KALENDER', w / 2, h * 0.16);
  ctx.fillStyle = CSS.ink;
  ctx.font = `${Math.round(h * 0.42)}px ${FONTS.display}`;
  ctx.fillText(String(year), w / 2, h * 0.7);
  ctx.font = `${Math.round(h * 0.07)}px ${FONTS.body}`;
  ctx.fillText('A YEAR OF ACHIEVEMENT', w / 2, h * 0.88);
}

/** The "now delivering" board. */
export function drawBoard(canvas, orderYear) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = '#1e2a24';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = CSS.cream;
  ctx.textAlign = 'center';
  ctx.font = `${Math.round(h * 0.16)}px ${FONTS.display}`;
  ctx.fillText('NOW DELIVERING ORDERS PLACED IN', w / 2, h * 0.3);
  ctx.fillStyle = CSS.gold;
  ctx.font = `${Math.round(h * 0.5)}px ${FONTS.display}`;
  ctx.fillText(String(orderYear), w / 2, h * 0.85);
}

export function makeMaterials() {
  return {
    floor: new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.9 }),
    wall: new THREE.MeshStandardMaterial({ map: wallTexture(), roughness: 1 }),
    paint: flat(0x8ab0c8, { roughness: 0.5 }),
    roof: flat(0xf2f0e6, { roughness: 0.5 }),
    beige: 0xd8c8a0,
    primer: 0x8a8a84,
    cardboard: new THREE.MeshStandardMaterial({ map: cardboardTexture(), roughness: 1 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x9ab0c0, transparent: true, opacity: 0.35, roughness: 0.1 }),
    chrome: flat(0xc8ccd0, { metalness: 0.8, roughness: 0.25 }),
    tyre: flat(0x1e1e1e),
    seat: flat(0x6a4a3a),
    dark: flat(PALETTE.black),
    lamp: new THREE.MeshStandardMaterial({ color: 0xfff2c8, emissive: 0xfff2c8, emissiveIntensity: 0.4 }),
    heater: flat(0xc8642a),
    turntable: flat(0x5a5650, { metalness: 0.3 }),
    wood: flat(PALETTE.wood),
    leaf: flat(0x4a6a3a),
    red: flat(PALETTE.red),
  };
}

/** The car, built from parts that can be taken away. Returns { group, parts }. */
export function buildCar(m) {
  const g = new THREE.Group();
  const P = {};
  const body = new THREE.Group();
  g.add(body);
  // lower body
  P.body = [box(3.5, 0.62, 1.5, m.paint, 0, 0.68, 0), box(0.9, 0.3, 1.46, m.paint, 1.35, 1.08, 0), box(0.7, 0.3, 1.46, m.paint, -1.45, 1.08, 0)];
  body.add(...P.body);
  // bumpers and grille
  body.add(box(0.12, 0.14, 1.56, m.chrome, 1.8, 0.52, 0), box(0.12, 0.14, 1.56, m.chrome, -1.8, 0.52, 0), box(0.04, 0.2, 0.9, m.dark, 1.76, 0.78, 0));
  // headlamps
  P.lamps = [-0.52, 0.52].map((z) => {
    const l = cyl(0.13, 0.13, 0.06, m.lamp, 12, 1.77, 0.86, z);
    l.rotation.z = Math.PI / 2;
    body.add(l);
    return l;
  });
  // bonnet (front, flat on top)
  P.bonnet = box(0.92, 0.05, 1.4, m.paint, 1.35, 1.25, 0);
  body.add(P.bonnet);
  // greenhouse: pillars, glass, roof
  for (const [x, z] of [[0.75, 0.66], [0.75, -0.66], [-1.0, 0.66], [-1.0, -0.66], [-0.12, 0.66], [-0.12, -0.66]]) body.add(box(0.07, 0.46, 0.07, m.paint, x, 1.4, z));
  const ws = box(0.05, 0.5, 1.32, m.glass, 0.84, 1.4, 0);
  ws.rotation.z = 0.5;
  const rw = box(0.05, 0.5, 1.32, m.glass, -1.08, 1.4, 0);
  rw.rotation.z = -0.35;
  body.add(ws, rw);
  body.add(box(1.75, 0.42, 0.03, m.glass, -0.12, 1.4, 0.68), box(1.75, 0.42, 0.03, m.glass, -0.12, 1.4, -0.68));
  P.roof = box(1.85, 0.07, 1.42, m.roof, -0.14, 1.66, 0);
  body.add(P.roof);
  // doors: passenger on +z, driver on -z (as seen from the front left)
  P.door = box(1.05, 0.62, 0.05, m.paint, 0.3, 0.84, 0.77);
  P.driverDoor = box(1.05, 0.62, 0.05, m.paint, 0.3, 0.84, -0.77);
  body.add(P.door, P.driverDoor);
  P.handles = [box(0.14, 0.03, 0.03, m.chrome, 0.05, 1.04, 0.8), box(0.14, 0.03, 0.03, m.chrome, 0.05, 1.04, -0.8)];
  body.add(...P.handles);
  // interior: seats, a heater under the dash
  P.seat = box(0.4, 0.38, 1.2, m.seat, -0.7, 1.12, 0);
  body.add(P.seat, box(0.4, 0.42, 0.5, m.seat, 0.2, 1.12, -0.32), box(0.4, 0.42, 0.5, m.seat, 0.2, 1.12, 0.32));
  P.heater = box(0.2, 0.16, 0.3, m.heater, 0.7, 1.1, 0);
  body.add(P.heater);
  // wheels and hubcaps
  P.wheels = [];
  P.hubcaps = [];
  for (const [x, z] of [[1.15, 0.72], [1.15, -0.72], [-1.15, 0.72], [-1.15, -0.72]]) {
    const w = cyl(0.33, 0.33, 0.22, m.tyre, 14, x, 0.33, z);
    w.rotation.x = Math.PI / 2;
    g.add(w);
    P.wheels.push(w);
    const hc = cyl(0.17, 0.17, 0.03, m.chrome, 12, x, 0.33, z + Math.sign(z) * 0.12);
    hc.rotation.x = Math.PI / 2;
    g.add(hc);
    P.hubcaps.push(hc);
  }
  // spare wheel strapped to the back
  P.spare = cyl(0.3, 0.3, 0.18, m.tyre, 14, -1.9, 0.85, 0);
  P.spare.rotation.z = Math.PI / 2;
  body.add(P.spare);
  g.traverse((o) => o.isMesh && (o.castShadow = o.receiveShadow = true));
  g.userData.body = body;
  return { group: g, parts: P };
}

/** Apply one downgrade to the model. */
export function applyDowngrade(car, m, part) {
  const P = car.parts;
  const hide = (o) => (o.visible = false);
  switch (part) {
    case 'colour':
      m.paint.color.setHex(m.beige);
      break;
    case 'heater':
      hide(P.heater);
      break;
    case 'seat':
      hide(P.seat);
      break;
    case 'hubcaps':
      P.hubcaps.forEach(hide);
      break;
    case 'spare':
      hide(P.spare);
      break;
    case 'door':
      hide(P.door);
      hide(P.handles[0]);
      break;
    case 'paint':
      m.paint.color.setHex(m.primer);
      m.roof.color.setHex(m.primer);
      break;
    case 'bonnet':
      P.bonnet.material = m.cardboard;
      break;
    case 'roof':
      P.roof.material = m.cardboard;
      break;
    case 'lamp':
      hide(P.lamps[1]);
      break;
    case 'driverDoor':
      P.driverDoor.material = m.cardboard;
      hide(P.handles[1]);
      break;
    case 'wheel':
      hide(P.wheels[3]);
      hide(P.hubcaps[3]);
      car.group.userData.body.rotation.x = 0.05;
      car.group.userData.body.rotation.z = 0.03;
      break;
    default:
  }
}

export function buildWorld(scene, m) {
  const refs = {};
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 24), m.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(30, 8), m.wall);
  back.position.set(0, 4, -7);
  scene.add(back);
  for (const s of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(24, 8), m.wall);
    side.rotation.y = -s * Math.PI / 2;
    side.position.set(s * 10, 4, 3);
    scene.add(side);
  }

  // the turntable, which turns, and the car on it
  const tt = cyl(2.6, 2.7, 0.18, m.turntable, 40, 0, 0.09, 0);
  tt.receiveShadow = true;
  scene.add(tt);
  const car = buildCar(m);
  car.group.position.y = 0.18;
  scene.add(car.group);
  refs.turntable = tt;
  refs.car = car;

  // the sign over everything
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.75), new THREE.MeshStandardMaterial({ map: signTexture('PEOPLE\'S MOTOR WORKS', 'SHOWROOM · VIEWING ONLY · NO TEST DRIVES'), roughness: 1 }));
  sign.position.set(0, 6.1, -6.95);
  scene.add(sign);

  // the calendar and the "now delivering" board
  const calCanvas = document.createElement('canvas');
  calCanvas.width = 256;
  calCanvas.height = 320;
  const calTex = new THREE.CanvasTexture(calCanvas);
  calTex.colorSpace = THREE.SRGBColorSpace;
  const cal = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.75), new THREE.MeshStandardMaterial({ map: calTex, roughness: 1 }));
  cal.position.set(-6.2, 2.9, -6.95);
  scene.add(cal);
  refs.calCanvas = calCanvas;
  refs.calTex = calTex;
  const boardCanvas = document.createElement('canvas');
  boardCanvas.width = 640;
  boardCanvas.height = 240;
  const boardTex = new THREE.CanvasTexture(boardCanvas);
  boardTex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.35), new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.8 }));
  board.position.set(3.4, 3.2, -6.95);
  scene.add(board);
  refs.boardCanvas = boardCanvas;
  refs.boardTex = boardTex;

  // a rubber plant, a stack of boxes (spare parts, presumably), a desk with nobody at it
  const pot = cyl(0.35, 0.28, 0.6, m.red, 10, -8.2, 0.3, -5.6);
  scene.add(pot);
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 4), m.leaf);
    leaf.scale.set(0.4, 1, 0.15);
    const a = (i / 7) * Math.PI * 2;
    leaf.position.set(-8.2 + Math.cos(a) * 0.3, 1.0 + (i % 3) * 0.35, -5.6 + Math.sin(a) * 0.3);
    leaf.rotation.set(Math.sin(a) * 0.5, a, Math.cos(a) * 0.5);
    scene.add(leaf);
  }
  for (let i = 0; i < 6; i++) {
    const b = box(0.9, 0.6, 0.7, m.cardboard, 7.4 + (i % 2) * 0.95, 0.3 + Math.floor(i / 2) * 0.6, -5.6 + (i % 3) * 0.1);
    b.rotation.y = (i % 3) * 0.08;
    b.castShadow = true;
    scene.add(b);
  }
  const desk = new THREE.Group();
  desk.add(box(2.2, 0.08, 0.9, m.wood, 0, 0.78, 0), box(0.08, 0.78, 0.8, m.wood, -1.0, 0.39, 0), box(0.08, 0.78, 0.8, m.wood, 1.0, 0.39, 0));
  const deskSign = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.2), new THREE.MeshStandardMaterial({ map: signTexture('CLOSED', null, '#e6dac2', CSS.ink), roughness: 1 }));
  deskSign.position.set(0, 0.95, 0.46);
  desk.add(deskSign);
  desk.position.set(-5.8, 0, -3.8);
  desk.rotation.y = 0.3;
  desk.traverse((o) => o.isMesh && (o.castShadow = true));
  scene.add(desk);

  // light: showroom fluorescents, one of them working properly
  scene.add(new THREE.HemisphereLight(0xf2ead8, 0x6a5a48, 1.0));
  const key = new THREE.SpotLight(0xfff4e0, 70, 22, 0.6, 0.5, 1.2);
  key.position.set(2, 9, 5);
  key.target.position.set(0, 0.5, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xdfe6f0, 0.8);
  fill.position.set(-6, 6, 8);
  scene.add(fill);
  return refs;
}
