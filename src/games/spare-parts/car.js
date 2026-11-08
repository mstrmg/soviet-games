// SPARE PARTS — the garage and the car. The car faces +x. Every slot is a place a part can fail
// and a piece of junk can be mounted; the body is split into panels so each can be repainted.
import * as THREE from 'three';
import { flat } from '../../shared/renderer.js';
import { canvasTexture, rng, speckle } from '../../shared/canvasTexture.js';
import { FONTS } from '../../shared/palette.js';

export const SLOTS = {
  pump: { pos: [1.55, 1.2, -0.45], label: 'under the bonnet' },
  brakes: { pos: [1.6, 0.45, 1.02], label: 'front wheel' },
  headlight: { pos: [2.5, 0.92, 0.62], label: 'front' },
  radiator: { pos: [2.5, 0.78, -0.1], label: 'grille' },
  seat: { pos: [-0.15, 1.82, 0], label: 'roof (temporarily)' },
  tyre: { pos: [-1.6, 0.45, 1.02], label: 'rear wheel' },
  door: { pos: [-0.25, 0.85, 1.0], label: 'passenger side' },
  gearbox: { pos: [-2.55, 0.95, 0], label: 'boot' },
  engine: { pos: [1.5, 1.35, 0.2], label: 'bonnet' },
};

export function buildGarage(scene) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 9), new THREE.MeshStandardMaterial({ map: wallTexture(), roughness: 1 }));
  wall.position.set(0, 4.5, -4.5);
  scene.add(wall);
  const side = wall.clone();
  side.rotation.y = Math.PI / 2;
  side.position.set(-8, 4.5, 4);
  scene.add(side);
  // the calendar, which is the only thing that changes in here
  const cal = liveCalendar();
  cal.mesh.position.set(2.4, 2.7, -4.45);
  scene.add(cal.mesh);
  // a bare bulb
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff1c8 }));
  bulb.position.set(0, 5.4, 0.5);
  const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 3.4, 4), flat(0x111111));
  wire.position.set(0, 7.1, 0.5);
  scene.add(bulb, wire);
  // oil drums and a tyre in the corner, for atmosphere and not for use
  for (const [x, z, c] of [[-6.5, -3.4, 0x2a5c8a], [-5.6, -3.7, 0xc1272d], [5.8, -3.6, 0x4a6a3a]]) {
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.2, 14), flat(c, { metalness: 0.3 }));
    drum.position.set(x, 0.6, z);
    drum.castShadow = true;
    scene.add(drum);
  }
  return { calendar: cal };
}

function floorTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const r = rng(4);
    ctx.fillStyle = '#7d7769';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = `rgba(30,25,20,${0.08 + r() * 0.15})`;
      ctx.beginPath();
      ctx.ellipse(r() * w, r() * h, 20 + r() * 60, 10 + r() * 30, r() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    speckle(ctx, w, h, 0.12, r, 0.03);
  }, { repeat: [3, 2] });
}

function wallTexture() {
  return canvasTexture(1024, 320, (ctx, w, h) => {
    const r = rng(19);
    ctx.fillStyle = '#5fb3a8';
    ctx.fillRect(0, 0, w, h);
    // the paint is peeling to reveal a previous, more optimistic paint
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = r() < 0.5 ? '#e8dcc0' : '#d6cdb5';
      ctx.beginPath();
      const x = r() * w;
      const y = r() * h;
      ctx.moveTo(x, y);
      for (let k = 0; k < 6; k++) ctx.lineTo(x + (r() - 0.5) * 60, y + (r() - 0.5) * 40);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(0, h * 0.78, w, h * 0.22);
    ctx.fillStyle = '#a3151c';
    ctx.font = `64px ${FONTS.display}`;
    ctx.textAlign = 'center';
    ctx.fillText('¡SIEMPRE ADELANTE!', w * 0.68, 90);
    speckle(ctx, w, h, 0.15, r, 0.02);
  });
}

function liveCalendar() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 320;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.5), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
  return {
    mesh,
    set(year) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f2ede0';
      ctx.fillRect(0, 0, 256, 320);
      ctx.fillStyle = '#c1272d';
      ctx.fillRect(0, 0, 256, 70);
      ctx.fillStyle = '#f2ede0';
      ctx.font = `48px ${FONTS.display}`;
      ctx.textAlign = 'center';
      ctx.fillText('ENERO', 128, 52);
      ctx.fillStyle = '#1b1a18';
      ctx.font = `110px ${FONTS.display}`;
      ctx.fillText(String(year), 128, 200);
      ctx.font = `600 18px ${FONTS.body}`;
      ctx.fillText('AÑO DE LA PERSEVERANCIA', 128, 270);
      tex.needsUpdate = true;
    },
  };
}

/** The car: body in panels (for paint), cabin, fins, chrome, four wheels, and its original parts. */
export function buildCar() {
  const g = new THREE.Group();
  const panels = [];
  const body = (w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), flat(0x5fb8b0, { roughness: 0.45, metalness: 0.15 }));
    m.position.set(x, y, z);
    m.castShadow = true;
    g.add(m);
    panels.push(m);
    return m;
  };
  body(1.7, 0.55, 1.9, 1.65, 0.85, 0); // front
  body(1.6, 0.55, 1.9, 0, 0.85, 0); // middle
  body(1.7, 0.55, 1.9, -1.65, 0.85, 0); // rear
  const cream = flat(0xf1e6c8, { roughness: 0.45 });
  const chrome = flat(0xd9dde0, { metalness: 0.85, roughness: 0.25 });
  const glass = flat(0x22343a, { roughness: 0.1, metalness: 0.3 });
  const add = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    g.add(m);
    return m;
  };
  add(new THREE.BoxGeometry(2.2, 0.46, 1.66), glass, -0.15, 1.35, 0);
  const roof = add(new THREE.BoxGeometry(2.4, 0.1, 1.76), cream, -0.15, 1.62, 0);
  panels.push(roof);
  for (const x of [-1.2, 0.9]) for (const z of [-0.8, 0.8]) add(new THREE.BoxGeometry(0.08, 0.46, 0.08), cream, x, 1.35, z);
  add(new THREE.BoxGeometry(5.0, 0.12, 1.96), chrome, 0, 0.6, 0);
  for (const z of [-0.8, 0.8]) {
    const fin = add(new THREE.BoxGeometry(1.1, 0.32, 0.12), panels[2].material, -2.1, 1.25, z);
    fin.rotation.z = -0.25;
  }
  // wheels, each its own object so a failure can take one away
  const wheels = {};
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.26, 16);
  const tyreMat = flat(0x1b1b1b, { roughness: 0.9 });
  for (const [key, x, z] of [['fl', 1.6, 0.9], ['fr', 1.6, -0.9], ['rl', -1.6, 0.9], ['rr', -1.6, -0.9]]) {
    const w = add(wheelGeo, tyreMat, x, 0.42, z);
    w.rotation.x = Math.PI / 2;
    const hub = add(new THREE.CylinderGeometry(0.18, 0.18, 0.28, 10), chrome, x, 0.42, z);
    hub.rotation.x = Math.PI / 2;
    wheels[key] = { w, hub };
  }
  // the original parts, as they were in 1957
  const originals = {
    pump: add(new THREE.BoxGeometry(0.3, 0.1, 0.3), chrome, ...SLOTS.pump.pos),
    brakes: wheels.fl.hub,
    headlight: add(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 12), flat(0xfff6c8, { emissive: 0x665a30 }), ...SLOTS.headlight.pos),
    radiator: add(new THREE.BoxGeometry(0.06, 0.3, 0.9), chrome, ...SLOTS.radiator.pos),
    seat: null,
    tyre: wheels.rl.w,
    door: add(new THREE.BoxGeometry(1.0, 0.5, 0.04), panels[1].material, ...SLOTS.door.pos),
    gearbox: null,
    engine: null,
  };
  originals.headlight.rotation.z = Math.PI / 2;
  return { group: g, panels, originals, wheels };
}

/** A piece of junk, as mounted on the car: a shape, a colour, slightly askew. */
export function buildJunk(item, seed = 1) {
  const r = rng(seed * 31 + 7);
  const mat = flat(item.colour, { roughness: 0.6, metalness: item.tags.includes('metal') ? 0.4 : 0 });
  let geo;
  switch (item.model) {
    case 'cyl':
      geo = new THREE.CylinderGeometry(0.2, 0.22, 0.45, 12);
      break;
    case 'disc':
      geo = new THREE.CylinderGeometry(0.4, 0.4, 0.12, 18);
      break;
    case 'panel':
      geo = new THREE.BoxGeometry(0.9, 0.6, 0.06);
      break;
    case 'sphere':
      geo = new THREE.SphereGeometry(0.3, 14, 10);
      break;
    default:
      geo = new THREE.BoxGeometry(0.5, 0.4, 0.45);
  }
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.rotation.set((r() - 0.5) * 0.3, (r() - 0.5) * 0.6, (r() - 0.5) * 0.3);
  const g = new THREE.Group();
  g.add(m);
  // wire, holding it on
  const wire = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.015, 4, 16), flat(0x8a8a8a, { metalness: 0.6 }));
  wire.rotation.x = Math.PI / 2 + (r() - 0.5) * 0.6;
  g.add(wire);
  return g;
}
