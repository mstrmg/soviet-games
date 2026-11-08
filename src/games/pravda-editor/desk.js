// PRAVDA EDITOR — the editor's cramped office, seen from the chair.
import * as THREE from 'three';
import { flat } from '../../shared/renderer.js';
import { PALETTE, CSS, FONTS } from '../../shared/palette.js';
import { canvasTexture, rng, speckle } from '../../shared/canvasTexture.js';

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  return m;
}

function wallTex() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const r = rng(77);
    ctx.fillStyle = '#4c5a4e';
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) {
      ctx.fillStyle = x % 64 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.03)';
      ctx.fillRect(x, 0, 16, h);
    }
    for (let i = 0; i < 30; i++) {
      const g = ctx.createRadialGradient(r() * w, r() * h, 0, r() * w, r() * h, 80);
      g.addColorStop(0, 'rgba(60,45,20,0.12)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    speckle(ctx, w, h, 0.12, r, 0.03);
  });
}

function outsideTex(season) {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const r = rng(season === 'snow' ? 5 : 3);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    if (season === 'snow') {
      g.addColorStop(0, '#9aa3ab');
      g.addColorStop(1, '#d9dcdc');
    } else {
      g.addColorStop(0, '#3d4552');
      g.addColorStop(0.6, '#a8784a');
      g.addColorStop(1, '#c98f52');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // rooftops and a factory chimney
    ctx.fillStyle = season === 'snow' ? '#5c6166' : '#2a2724';
    for (let i = 0; i < 9; i++) {
      const bw = 50 + r() * 70;
      const bh = 120 + r() * 200;
      const x = i * 60 - 20;
      ctx.fillRect(x, h - bh, bw, bh);
      if (season === 'snow') {
        ctx.fillStyle = '#eef0f0';
        ctx.fillRect(x, h - bh - 6, bw, 8);
        ctx.fillStyle = '#5c6166';
      }
    }
    ctx.fillRect(360, 80, 26, 300);
    ctx.fillStyle = 'rgba(200,200,200,0.35)';
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(380 + i * 14, 70 - i * 9, 14 + i * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // lit windows
    ctx.fillStyle = '#f0c879';
    for (let i = 0; i < 26; i++) ctx.fillRect(r() * w, h - r() * 260, 6, 9);
    // a red star on a distant spire
    ctx.fillStyle = CSS.red;
    ctx.beginPath();
    ctx.arc(120, 140, 7, 0, Math.PI * 2);
    ctx.fill();
  });
}

function calendarCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 320;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const draw = (date) => {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = CSS.cream;
    ctx.fillRect(0, 0, 256, 320);
    ctx.fillStyle = CSS.red;
    ctx.fillRect(0, 0, 256, 70);
    ctx.fillStyle = CSS.cream;
    ctx.textAlign = 'center';
    ctx.font = `48px ${FONTS.display}`;
    const [d, m] = date.split(' ');
    ctx.fillText(m || '', 128, 54);
    ctx.fillStyle = CSS.black;
    ctx.font = `170px ${FONTS.display}`;
    ctx.fillText(d, 128, 250);
    ctx.font = `600 18px ${FONTS.body}`;
    ctx.fillText('1978 · YEAR OF THE PLAN', 128, 300);
    tex.needsUpdate = true;
  };
  return { tex, draw };
}

export function buildDesk(scene) {
  const refs = {};
  const m = {
    wall: new THREE.MeshStandardMaterial({ map: wallTex(), roughness: 0.95 }),
    floor: flat(0x3a2a20),
    wood: flat(PALETTE.wood, { roughness: 0.6 }),
    woodDark: flat(PALETTE.woodDark, { roughness: 0.6 }),
    black: flat(PALETTE.ink, { roughness: 0.45 }),
    cream: flat(PALETTE.cream),
    paper: flat(PALETTE.paper),
    green: flat(0x23503a, { roughness: 0.4 }),
    brass: flat(PALETTE.brass, { metalness: 0.7, roughness: 0.35 }),
    glass: flat(0x8a9a9a, { metalness: 0.2, roughness: 0.1, transparent: true, opacity: 0.6 }),
    coat: flat(0x5a5c5e),
  };

  // room: 4 wide, 3 deep, 3 high
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), m.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.2), m.wall);
  back.position.set(0, 1.6, -2.2);
  back.receiveShadow = true;
  scene.add(back);
  for (const s of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.2), m.wall);
    side.position.set(s * 2.2, 1.6, 0);
    side.rotation.y = -s * (Math.PI / 2);
    side.receiveShadow = true;
    scene.add(side);
  }
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), flat(0x2a2926));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = 3.2;
  scene.add(ceil);

  // window (left of the back wall) showing the season
  const outsideMat = new THREE.MeshBasicMaterial({ map: outsideTex('autumn') });
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.5), outsideMat);
  outside.position.set(-0.9, 1.75, -2.19);
  scene.add(outside);
  refs.outside = outside;
  scene.add(box(1.42, 0.08, 0.1, m.woodDark, -0.9, 2.53, -2.15));
  scene.add(box(1.42, 0.12, 0.2, m.woodDark, -0.9, 0.97, -2.1));
  scene.add(box(0.08, 1.6, 0.1, m.woodDark, -1.6, 1.75, -2.15));
  scene.add(box(0.08, 1.6, 0.1, m.woodDark, -0.2, 1.75, -2.15));
  scene.add(box(0.05, 1.5, 0.06, m.woodDark, -0.9, 1.75, -2.15));
  scene.add(box(1.3, 0.05, 0.06, m.woodDark, -0.9, 1.85, -2.15));

  // door on the right of the back wall, where visitors appear
  const doorFrame = new THREE.Group();
  doorFrame.add(box(0.1, 2.15, 0.12, m.woodDark, -0.5, 1.07, 0));
  doorFrame.add(box(0.1, 2.15, 0.12, m.woodDark, 0.5, 1.07, 0));
  doorFrame.add(box(1.1, 0.1, 0.12, m.woodDark, 0, 2.15, 0));
  doorFrame.position.set(1.15, 0, -2.15);
  scene.add(doorFrame);
  const doorway = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.1), new THREE.MeshBasicMaterial({ color: 0x0c0b0a }));
  doorway.position.set(1.15, 1.05, -2.18);
  scene.add(doorway);
  // the door itself, ajar
  const doorPivot = new THREE.Group();
  doorPivot.position.set(1.6, 0, -2.18);
  const door = box(0.9, 2.08, 0.05, m.wood, -0.45, 1.04, 0);
  doorPivot.add(door);
  doorPivot.rotation.y = -1.1;
  scene.add(doorPivot);

  // the man in the grey coat (hidden until Party approval falls)
  const man = new THREE.Group();
  const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.25, 6), m.coat);
  coat.position.y = 0.85;
  const shoulders = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.2, 6), m.coat);
  shoulders.position.y = 1.55;
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), flat(0xb59a82));
  head.position.y = 1.75;
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 10), m.black);
  hatBrim.position.y = 1.84;
  const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.12, 10), m.black);
  hatTop.position.y = 1.91;
  const legs = box(0.26, 0.25, 0.14, m.black, 0, 0.12, 0);
  man.add(coat, shoulders, head, hatBrim, hatTop, legs);
  man.traverse((o) => o.isMesh && (o.castShadow = true));
  man.position.set(1.15, 0, -2.6);
  man.visible = false;
  scene.add(man);
  refs.man = man;

  // portrait and calendar
  const calendar = calendarCanvas();
  const cal = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.4), new THREE.MeshStandardMaterial({ map: calendar.tex }));
  cal.position.set(0.25, 1.75, -2.18);
  scene.add(cal);
  refs.calendar = calendar;

  // the deadline clock on the wall
  const clock = new THREE.Group();
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), m.cream);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 6, 24), m.black);
  const hand = (len, w) => {
    const g = new THREE.Group();
    const h = box(w, len, 0.01, m.black, 0, len / 2, 0.01);
    h.castShadow = false;
    g.add(h);
    return g;
  };
  const hour = hand(0.11, 0.02);
  const minute = hand(0.17, 0.012);
  clock.add(face, rim, hour, minute);
  clock.position.set(0.25, 2.45, -2.17);
  scene.add(clock);
  refs.clock = { hour, minute };

  // ---- the desk ------------------------------------------------------------
  const desk = new THREE.Group();
  desk.add(box(1.9, 0.06, 0.95, m.wood, 0, 0.76, 0));
  desk.add(box(1.86, 0.02, 0.9, m.green, 0, 0.8, 0.0)); // green leather inlay
  desk.add(box(0.06, 0.73, 0.9, m.woodDark, -0.9, 0.37, 0));
  desk.add(box(0.06, 0.73, 0.9, m.woodDark, 0.9, 0.37, 0));
  desk.add(box(1.8, 0.6, 0.04, m.woodDark, 0, 0.4, -0.42));
  desk.position.set(0, 0, -0.6);
  scene.add(desk);

  // typewriter
  const tw = new THREE.Group();
  tw.add(box(0.48, 0.12, 0.34, m.black, 0, 0.06, 0));
  tw.add(box(0.44, 0.1, 0.16, m.black, 0, 0.16, -0.08));
  const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.56, 8), m.black);
  roller.rotation.z = Math.PI / 2;
  roller.position.set(0, 0.22, -0.1);
  tw.add(roller);
  const sheet = box(0.3, 0.34, 0.004, m.cream, 0, 0.38, -0.12);
  sheet.rotation.x = -0.15;
  tw.add(sheet);
  const keys = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 10; c++) {
      const k = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 6), m.cream);
      k.position.set(-0.18 + c * 0.04 + r * 0.01, 0.13 + r * 0.012, 0.14 - r * 0.035);
      tw.add(k);
      keys.push(k);
    }
  }
  tw.position.set(0, 0.81, -0.62);
  scene.add(tw);
  refs.typewriter = { group: tw, keys, sheet };

  // paper stacks: the wire tray (left) and the outbox (right)
  const stackL = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const s = box(0.26, 0.006, 0.34, i % 3 ? m.paper : m.cream, (Math.random() - 0.5) * 0.02, i * 0.007, (Math.random() - 0.5) * 0.02);
    s.rotation.y = (Math.random() - 0.5) * 0.12;
    stackL.add(s);
  }
  stackL.position.set(-0.62, 0.81, -0.55);
  scene.add(stackL);
  refs.wireStack = stackL;
  const stackR = new THREE.Group();
  stackR.position.set(0.55, 0.81, -0.5);
  scene.add(stackR);
  refs.outbox = stackR;

  // rotary phone
  const phone = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.09, 8), m.black);
  body.position.y = 0.045;
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.01, 12), m.cream);
  dial.position.set(0, 0.09, 0.035);
  dial.rotation.x = 0.4;
  const handset = new THREE.Group();
  handset.add(box(0.26, 0.035, 0.05, m.black, 0, 0, 0));
  handset.add(box(0.06, 0.05, 0.06, m.black, -0.11, -0.02, 0));
  handset.add(box(0.06, 0.05, 0.06, m.black, 0.11, -0.02, 0));
  handset.position.y = 0.12;
  phone.add(body, dial, handset);
  phone.position.set(0.72, 0.81, -0.82);
  phone.rotation.y = -0.4;
  scene.add(phone);
  refs.phone = { group: phone, handset };

  // ashtray with a smouldering cigarette
  const ash = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.03, 10), m.glass);
  ash.position.set(-0.35, 0.83, -0.25);
  scene.add(ash);
  const cig = box(0.07, 0.01, 0.01, m.cream, -0.33, 0.85, -0.25);
  cig.rotation.y = 0.5;
  scene.add(cig);
  const smokeGeo = new THREE.BufferGeometry();
  const smokeN = 40;
  smokeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(smokeN * 3), 3));
  const smoke = new THREE.Points(smokeGeo, new THREE.PointsMaterial({ color: 0xcfcfcf, size: 0.02, transparent: true, opacity: 0.35, depthWrite: false }));
  smoke.userData.t = new Float32Array(smokeN).map(() => Math.random() * 3);
  smoke.userData.origin = new THREE.Vector3(-0.3, 0.86, -0.24);
  scene.add(smoke);
  refs.smoke = smoke;

  // green banker's lamp
  const lamp = new THREE.Group();
  lamp.add(box(0.16, 0.02, 0.1, m.brass, 0, 0.01, 0));
  lamp.add(box(0.015, 0.25, 0.015, m.brass, 0, 0.13, 0));
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, 0.08, 10, 1, true, 0, Math.PI), m.green);
  shade.rotation.z = Math.PI / 2;
  shade.rotation.y = Math.PI / 2;
  shade.position.y = 0.27;
  shade.material = flat(0x23503a, { side: THREE.DoubleSide, emissive: 0x0c2a1c });
  lamp.add(shade);
  lamp.position.set(-0.75, 0.81, -0.85);
  scene.add(lamp);
  const lampLight = new THREE.PointLight(0xffd9a0, 2.2, 3.5, 1.5);
  lampLight.position.set(-0.7, 1.05, -0.75);
  lampLight.castShadow = true;
  lampLight.shadow.mapSize.set(512, 512);
  scene.add(lampLight);

  // light: dusk through the window, plus a bare bulb overhead
  scene.add(new THREE.HemisphereLight(0xd8cfbf, 0x201a14, 0.45));
  const sun = new THREE.DirectionalLight(0xffc890, 1.6);
  sun.position.set(-2.5, 3, -6);
  sun.target.position.set(0.4, 0.7, -0.4);
  scene.add(sun, sun.target);
  refs.sun = sun;
  const bulb = new THREE.PointLight(0xfff0d0, 1.4, 6, 1.4);
  bulb.position.set(0.2, 2.9, -0.4);
  scene.add(bulb);

  refs.setSeason = (season) => {
    outsideMat.map.dispose();
    outsideMat.map = outsideTex(season);
    outsideMat.needsUpdate = true;
    sun.color.set(season === 'snow' ? 0xd0dae0 : 0xffc890);
  };

  /** Add one finished front page to the outbox pile. */
  refs.addPage = () => {
    const n = stackR.children.length;
    const p = box(0.32, 0.006, 0.42, m.cream, (Math.random() - 0.5) * 0.03, n * 0.008, (Math.random() - 0.5) * 0.03);
    p.rotation.y = (Math.random() - 0.5) * 0.2;
    p.material = flat(0xe8e0cc);
    stackR.add(p);
  };

  return refs;
}

export function updateSmoke(smoke, dt) {
  const pos = smoke.geometry.attributes.position;
  const t = smoke.userData.t;
  const o = smoke.userData.origin;
  for (let i = 0; i < pos.count; i++) {
    t[i] += dt;
    if (t[i] > 3) t[i] = 0;
    const k = t[i];
    pos.setXYZ(i, o.x + Math.sin(k * 2 + i) * 0.02 * k, o.y + k * 0.18, o.z + Math.cos(k * 1.5 + i) * 0.015 * k);
  }
  pos.needsUpdate = true;
}
