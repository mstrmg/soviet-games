// HOLE IN ELEVEN — the course: a mown green, two bunkers, a pond, a treeline, a row of
// generals with notebooks, a photographer, and the portable hole.
import * as THREE from 'three';
import { flat } from '../../shared/renderer.js';
import { canvasTexture, rng, speckle } from '../../shared/canvasTexture.js';
import { FONTS } from '../../shared/palette.js';
import { COURSE } from './course.js';

export function makeMaterials() {
  return {
    rough: new THREE.MeshStandardMaterial({ map: roughTexture(), roughness: 1 }),
    green: new THREE.MeshStandardMaterial({ map: greenTexture(), roughness: 0.9 }),
    sand: flat(0xe2cf98, { roughness: 1 }),
    water: new THREE.MeshStandardMaterial({ color: 0x3f6f86, roughness: 0.15, metalness: 0.1 }),
    pine: flat(0x24452e),
    trunk: flat(0x5a4330),
    olive: flat(0x4c5a3a),
    olivedark: flat(0x37422a),
    skin: flat(0xd8b49a),
    black: flat(0x161514),
    red: flat(0xc1272d),
    gold: flat(0xd4a72c, { metalness: 0.5, roughness: 0.4 }),
    white: flat(0xf2ede0),
    cup: flat(0x0b0b0a),
    pole: flat(0xf2ede0),
    dirt: new THREE.MeshBasicMaterial({ color: 0x4a3a28, transparent: true, opacity: 0.55, depthWrite: false }),
    ball: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 }),
    shadow: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false }),
  };
}

function roughTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const r = rng(8);
    ctx.fillStyle = '#4f7a3a';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = r() < 0.5 ? 'rgba(30,60,25,0.35)' : 'rgba(120,150,70,0.25)';
      ctx.fillRect(r() * w, r() * h, 2, 3 + r() * 5);
    }
    speckle(ctx, w, h, 0.08, r);
  }, { repeat: [6, 4] });
}

function greenTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const r = rng(9);
    // mown stripes, as straight as a decree
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#6fae4c' : '#7dbd56';
      ctx.fillRect((i * w) / 8, 0, w / 8 + 1, h);
    }
    speckle(ctx, w, h, 0.05, r);
  }, { repeat: [0.125, 0.125] });
}

function ellipseShape(rx, rz, n = 48) {
  const s = new THREE.Shape();
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const wob = 1 + Math.sin(a * 3) * 0.04 + Math.cos(a * 5) * 0.03;
    s[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rx * wob, Math.sin(a) * rz * wob);
  }
  return s;
}

function flatPatch(shape, mat, y) {
  const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  m.receiveShadow = true;
  return m;
}

/** A general: olive coat, peaked cap, notebook. Arms rise when something is recorded. */
function buildGeneral(m, r) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 1.35, 8), m.olive);
  body.position.y = 0.85;
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), m.skin);
  head.position.y = 1.75;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.12, 10), m.olivedark);
  cap.position.y = 1.95;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.05, 10), m.red);
  band.position.y = 1.9;
  const medals = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22 + r() * 0.3, 0.04), m.gold);
  medals.position.set(-0.12, 1.15, 0.36);
  const arm = new THREE.Group();
  arm.position.set(0.32, 1.35, 0);
  const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.62, 0.14), m.olive);
  sleeve.position.y = -0.3;
  const pad = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.03), m.white);
  pad.position.set(0, -0.62, 0.1);
  arm.add(sleeve, pad);
  arm.rotation.x = -0.9;
  g.add(body, head, cap, band, medals, arm);
  g.userData.arm = arm;
  g.traverse((o) => o.isMesh && (o.castShadow = true));
  return g;
}

export function buildCourse(scene, m) {
  const refs = {};
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 70), m.rough);
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = 5;
  ground.receiveShadow = true;
  scene.add(ground);
  const G = COURSE.green;
  const green = flatPatch(ellipseShape(G.rx, G.rz), m.green, 0.01);
  green.position.x = G.x;
  green.position.z = G.z;
  scene.add(green);
  for (const b of COURSE.bunkers) {
    const p = flatPatch(ellipseShape(b.r, b.r * 0.85, 24), m.sand, 0.02);
    p.position.set(b.x, 0.02, b.z);
    scene.add(p);
  }
  const P = COURSE.pond;
  const pond = flatPatch(ellipseShape(P.r, P.r * 0.8, 32), m.water, 0.025);
  pond.position.set(P.x, 0.025, P.z);
  scene.add(pond);
  refs.pond = pond;

  // treeline behind and to the sides
  const r = rng(53);
  const cone = new THREE.ConeGeometry(1.5, 5.5, 7);
  const trunk = new THREE.CylinderGeometry(0.15, 0.2, 1.4, 5);
  for (let i = 0; i < 46; i++) {
    const a = r();
    let x;
    let z;
    if (i < 26) {
      x = -32 + a * 64;
      z = -20 - r() * 6;
    } else {
      const side = i % 2 ? 1 : -1;
      x = side * (27 + r() * 5);
      z = -18 + r() * 34;
    }
    const t = new THREE.Group();
    const c = new THREE.Mesh(cone, m.pine);
    c.position.y = 3.6;
    const tr = new THREE.Mesh(trunk, m.trunk);
    tr.position.y = 0.7;
    t.add(c, tr);
    t.position.set(x, 0, z);
    t.scale.setScalar(0.8 + r() * 0.6);
    t.traverse((o) => o.isMesh && (o.castShadow = true));
    scene.add(t);
  }

  // the generals, in a row by the green, and the photographer
  refs.generals = [];
  for (let i = 0; i < 9; i++) {
    const g = buildGeneral(m, r);
    g.position.set(-21 + i * 1.3, 0, -10.5 + i * 0.25);
    g.rotation.y = 0.5;
    scene.add(g);
    refs.generals.push(g);
  }
  for (let i = 0; i < 8; i++) {
    const g = buildGeneral(m, r);
    g.position.set(17 + i * 1.2, 0, -12 + i * 0.6);
    g.rotation.y = -0.6;
    scene.add(g);
    refs.generals.push(g);
  }
  const cam = new THREE.Group();
  const tripod = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.3, 3, 1, true), m.black);
  tripod.position.y = 0.65;
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.45), m.black);
  box.position.y = 1.45;
  const flash = new THREE.PointLight(0xffffff, 0, 30, 1.5);
  flash.position.set(0, 1.8, 0.4);
  cam.add(tripod, box, flash);
  cam.position.set(-15, 0, -13);
  cam.rotation.y = 0.6;
  scene.add(cam);
  refs.flash = flash;

  // a sign at the back of the green
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 1.6),
    new THREE.MeshStandardMaterial({
      map: canvasTexture(1024, 180, (ctx, w, h) => {
        ctx.fillStyle = '#a3151c';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#d4a72c';
        ctx.lineWidth = 8;
        ctx.strokeRect(8, 8, w - 16, h - 16);
        ctx.fillStyle = '#f2ede0';
        ctx.textAlign = 'center';
        ctx.font = `76px ${FONTS.display}`;
        ctx.fillText('THE PEOPLE\'S GOLF COURSE', w / 2, 86);
        ctx.font = `600 30px ${FONTS.body}`;
        ctx.fillText('OPENED THIS MORNING · RECORDS SET THIS AFTERNOON', w / 2, 140);
      }),
    }),
  );
  sign.position.set(0, 2.6, -17);
  const legs = [-3.8, 3.8].map((x) => {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.4, 0.15), m.trunk);
    l.position.set(x, 1.2, -17.1);
    return l;
  });
  scene.add(sign, ...legs);
  return refs;
}

/** The portable hole: a black disc on a plate, the flag in it, and a little earth where it has been. */
export function buildHole(m) {
  const g = new THREE.Group();
  const lip = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), m.white);
  lip.rotation.x = -Math.PI / 2;
  lip.position.y = 0.03;
  const cup = new THREE.Mesh(new THREE.CircleGeometry(0.34, 24), m.cup);
  cup.rotation.x = -Math.PI / 2;
  cup.position.y = 0.035;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.2, 6), m.pole);
  pole.position.y = 1.6;
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7, 6, 1), new THREE.MeshStandardMaterial({ color: 0xc1272d, side: THREE.DoubleSide, roughness: 1 }));
  flag.position.set(0.58, 2.8, 0);
  const star = new THREE.Mesh(new THREE.CircleGeometry(0.14, 5), new THREE.MeshBasicMaterial({ color: 0xd4a72c, side: THREE.DoubleSide }));
  star.position.set(0.45, 2.8, 0.01);
  g.add(lip, cup, pole, flag, star);
  g.traverse((o) => o.isMesh && (o.castShadow = true));
  lip.castShadow = cup.castShadow = false;
  g.userData.flag = flag;
  return g;
}

export function buildBall(m) {
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), m.ball);
  ball.castShadow = true;
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), m.shadow);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.04;
  return { ball, shadow };
}

/** Which surface is at (x, z)? */
export function surfaceAt(x, z) {
  const P = COURSE.pond;
  if (((x - P.x) / P.r) ** 2 + ((z - P.z) / (P.r * 0.8)) ** 2 < 1) return 'pond';
  for (const b of COURSE.bunkers) if (((x - b.x) / b.r) ** 2 + ((z - b.z) / (b.r * 0.85)) ** 2 < 1) return 'bunker';
  const G = COURSE.green;
  if (((x - G.x) / G.rx) ** 2 + ((z - G.z) / G.rz) ** 2 < 1) return 'green';
  return 'rough';
}
