// LISTENING POST · the world: Apartment 4B, cut away like a doll's house, in a block of
// identical dark windows. A kitchen, a living room, a tenant, and the microphones.
import * as THREE from 'three';
import { flat } from '../../shared/renderer.js';
import { PALETTE, CSS } from '../../shared/palette.js';
import { canvasTexture, rng, speckle } from '../../shared/canvasTexture.js';

export const FLAT = { x0: -5, x1: 5, z0: -3, z1: 0, h: 2.8, doorZ: [-1.5, -0.3] };

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

function wallpaper(seed, base, motif) {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const r = rng(seed);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = motif;
    for (let y = 16; y < h; y += 32) {
      for (let x = (y / 32) % 2 ? 16 : 0; x < w; x += 32) {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x - 1, y - 12, 2, 24);
      }
    }
    speckle(ctx, w, h, 0.06, r, 0.01);
  }, { repeat: [3, 1.5] });
}

function lino() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const r = rng(4);
    ctx.fillStyle = '#9a7a4a';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) {
      for (let x = 0; x < w; x += 32) {
        ctx.fillStyle = (x + y) % 64 ? '#a8885a' : '#8a6a3e';
        ctx.fillRect(x, y, 32, 32);
      }
    }
    speckle(ctx, w, h, 0.1, r, 0.02);
  }, { repeat: [4, 2] });
}

function blockTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const r = rng(83);
    ctx.fillStyle = '#5a5850';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 3;
    for (let y = 0; y <= h; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let x = 0; x <= w; x += 256) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 128) {
      for (let x = 0; x < w; x += 128) {
        const lit = r() < 0.18;
        ctx.fillStyle = lit ? '#e8c878' : '#24262a';
        ctx.fillRect(x + 34, y + 30, 60, 56);
      }
    }
    speckle(ctx, w, h, 0.12, r, 0.02);
  }, { repeat: [6, 4] });
}

export function makeMaterials() {
  return {
    kitchenWall: new THREE.MeshStandardMaterial({ map: wallpaper(1, '#d8d0a8', 'rgba(120,140,90,0.45)'), roughness: 1 }),
    livingWall: new THREE.MeshStandardMaterial({ map: wallpaper(2, '#d8c0a0', 'rgba(150,80,60,0.35)'), roughness: 1 }),
    floor: new THREE.MeshStandardMaterial({ map: lino(), roughness: 0.9 }),
    block: new THREE.MeshStandardMaterial({ map: blockTexture(), roughness: 1 }),
    edge: flat(0x6a665c),
    wood: flat(PALETTE.wood),
    woodLight: flat(0x8a6a48),
    white: flat(0xe8e4d8),
    enamel: flat(0xe6e2d6),
    pot: flat(0x8a2a24),
    soup: flat(0xc89a4a),
    chair: flat(0x6a8a6a),
    radio: flat(0x5a3a2a),
    leaf: flat(0x4a6a3a),
    terracotta: flat(0xa85a3a),
    glass: new THREE.MeshStandardMaterial({ color: 0x8aa0b8, emissive: 0x3a4a6a, emissiveIntensity: 0.6, roughness: 0.2 }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffe0a0, emissiveIntensity: 0.8 }),
    rug: flat(0x8a3a3a),
    dark: flat(PALETTE.black),
    mic: flat(0x2a2a2a, { metalness: 0.4 }),
    led: new THREE.MeshBasicMaterial({ color: 0xff3020 }),
    dress: flat(0x5a6a8a),
    cardigan: flat(0x8a7a5a),
    skin: flat(PALETTE.skin),
    hair: flat(0xc8c4bc),
    picture: flat(0x6a8aa0),
    frame: flat(0xb08d3c),
    bread: flat(0xc8a060),
  };
}

/** The tenant: a woman in a cardigan, who is not doing anything wrong. */
export function makeTenant(m) {
  const g = new THREE.Group();
  const body = new THREE.Group();
  body.add(cyl(0.2, 0.3, 0.8, m.dress, 8, 0, 0.4, 0));
  body.add(cyl(0.2, 0.22, 0.42, m.cardigan, 8, 0, 0.98, 0));
  const head = new THREE.Group();
  head.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 0), m.skin));
  const hair = new THREE.Mesh(new THREE.IcosahedronGeometry(0.145, 0), m.hair);
  hair.position.set(0, 0.04, -0.03);
  hair.scale.set(1, 0.85, 1);
  const bun = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), m.hair);
  bun.position.set(0, 0.1, -0.13);
  head.add(hair, bun);
  head.position.y = 1.36;
  body.add(head);
  const arms = [-1, 1].map((sgn) => {
    const a = new THREE.Group();
    a.position.set(sgn * 0.24, 1.15, 0);
    a.add(box(0.08, 0.42, 0.08, m.cardigan, 0, -0.2, 0));
    body.add(a);
    return a;
  });
  g.add(body);
  g.userData = { body, head, arms };
  g.traverse((o) => o.isMesh && (o.castShadow = true));
  return g;
}

/** A microphone: small, dark, with a light that nobody is meant to see. */
export function makeMic(m) {
  const g = new THREE.Group();
  g.add(cyl(0.05, 0.05, 0.1, m.mic, 8));
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), m.led);
  led.position.set(0, 0.06, 0.04);
  g.add(led);
  g.userData.led = led;
  return g;
}

export function buildWorld(scene, m) {
  const refs = {};
  const { x0, x1, z0, z1, h, doorZ } = FLAT;

  // the block around the apartment: everyone else's windows
  const block = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), m.block);
  block.position.set(0, 3, z0 - 0.4);
  scene.add(block);
  // the floor slab and ceiling slab edges, cut
  scene.add(box(x1 - x0 + 0.4, 0.3, z1 - z0 + 0.4, m.edge, 0, -0.15, (z0 + z1) / 2));
  scene.add(box(x1 - x0 + 0.4, 0.3, 0.4, m.edge, 0, h + 0.15, z0));

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), m.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.01, (z0 + z1) / 2);
  floor.receiveShadow = true;
  scene.add(floor);
  // back walls (kitchen | living), side walls, the divider with a doorway
  const back = (x, w, mat) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    p.position.set(x, h / 2, z0);
    p.receiveShadow = true;
    scene.add(p);
  };
  back(-2.5, 5, m.kitchenWall);
  back(2.5, 5, m.livingWall);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(z1 - z0, h), m.kitchenWall);
  left.rotation.y = Math.PI / 2;
  left.position.set(x0, h / 2, (z0 + z1) / 2);
  scene.add(left);
  const right = new THREE.Mesh(new THREE.PlaneGeometry(z1 - z0, h), m.livingWall);
  right.rotation.y = -Math.PI / 2;
  right.position.set(x1, h / 2, (z0 + z1) / 2);
  scene.add(right);
  scene.add(box(0.12, h, doorZ[0] - z0, m.white, 0, h / 2, (z0 + doorZ[0]) / 2));
  scene.add(box(0.12, h, z1 - doorZ[1], m.white, 0, h / 2, (doorZ[1] + z1) / 2));
  scene.add(box(0.12, h - 2.1, doorZ[1] - doorZ[0], m.white, 0, 2.1 + (h - 2.1) / 2, (doorZ[0] + doorZ[1]) / 2));
  // cut edges of the walls, so it reads as a cutaway
  for (const x of [x0, 0, x1]) scene.add(box(0.14, h, 0.06, m.edge, x, h / 2, z1));

  // kitchen: stove with a pot, counter with a bread bin, table and chairs, window
  scene.add(box(0.8, 0.9, 0.6, m.enamel, -4.1, 0.45, -2.6));
  for (const [dx, dz] of [[-0.18, -0.12], [0.18, -0.12], [-0.18, 0.12], [0.18, 0.12]]) scene.add(cyl(0.11, 0.11, 0.02, m.dark, 10, -4.1 + dx, 0.91, -2.6 + dz));
  refs.pot = cyl(0.17, 0.15, 0.2, m.pot, 12, -4.1, 1.02, -2.48);
  scene.add(refs.pot);
  scene.add(cyl(0.16, 0.16, 0.01, m.soup, 12, -4.1, 1.115, -2.48));
  scene.add(box(1.4, 0.9, 0.55, m.woodLight, -3.0, 0.45, -2.7), box(1.4, 0.04, 0.6, m.white, -3.0, 0.92, -2.7));
  scene.add(box(0.4, 0.26, 0.3, m.bread, -3.2, 1.07, -2.72));
  scene.add(box(1.2, 0.05, 0.8, m.woodLight, -2.4, 0.72, -0.8));
  for (const [dx, dz] of [[-0.55, -0.35], [0.55, -0.35], [-0.55, 0.35], [0.55, 0.35]]) scene.add(box(0.05, 0.72, 0.05, m.wood, -2.4 + dx, 0.36, -0.8 + dz));
  scene.add(cyl(0.12, 0.1, 0.06, m.enamel, 10, -2.3, 0.77, -0.95));
  for (const x of [-2.4, -1.4]) {
    const ch = new THREE.Group();
    ch.add(box(0.42, 0.05, 0.42, m.chair, 0, 0.45, 0), box(0.42, 0.45, 0.05, m.chair, 0, 0.7, -0.19));
    for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) ch.add(box(0.04, 0.45, 0.04, m.wood, dx, 0.22, dz));
    ch.position.set(x === -2.4 ? -2.4 : -3.3, 0, x === -2.4 ? -1.35 : -0.8);
    ch.rotation.y = x === -2.4 ? 0 : Math.PI / 2;
    scene.add(ch);
  }
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.0), m.glass);
  win.position.set(-1.4, 1.6, z0 + 0.02);
  scene.add(win, box(1.2, 0.06, 0.06, m.white, -1.4, 1.1, z0 + 0.03), box(1.2, 0.06, 0.06, m.white, -1.4, 2.1, z0 + 0.03), box(0.06, 1.0, 0.06, m.white, -1.4, 1.6, z0 + 0.03));

  // living room: rug, armchair, sideboard with radio, plant, picture
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6), m.rug);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(2.4, 0.02, -1.3);
  scene.add(rug);
  const chair = new THREE.Group();
  chair.add(box(0.8, 0.4, 0.75, m.chair, 0, 0.3, 0), box(0.8, 0.6, 0.18, m.chair, 0, 0.75, -0.3), box(0.14, 0.3, 0.75, m.chair, -0.38, 0.6, 0), box(0.14, 0.3, 0.75, m.chair, 0.38, 0.6, 0));
  chair.position.set(2.7, 0, -1.6);
  scene.add(chair);
  scene.add(box(1.4, 0.8, 0.45, m.wood, 3.9, 0.4, -2.72));
  const radio = new THREE.Group();
  radio.add(box(0.55, 0.32, 0.22, m.radio, 0, 0, 0), box(0.3, 0.2, 0.01, m.frame, -0.08, 0, 0.115));
  radio.position.set(3.9, 0.96, -2.62);
  scene.add(radio);
  refs.radio = radio;
  scene.add(cyl(0.2, 0.15, 0.35, m.terracotta, 10, 1.0, 0.18, -2.55));
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.28, 6, 4), m.leaf);
    leaf.scale.set(0.35, 1, 0.12);
    const a = (i / 6) * Math.PI * 2;
    leaf.position.set(1.0 + Math.cos(a) * 0.18, 0.62 + (i % 2) * 0.2, -2.55 + Math.sin(a) * 0.18);
    leaf.rotation.set(Math.sin(a) * 0.5, a, Math.cos(a) * 0.5);
    scene.add(leaf);
  }
  scene.add(box(0.9, 0.65, 0.04, m.frame, 2.2, 1.7, z0 + 0.03), box(0.78, 0.53, 0.02, m.picture, 2.2, 1.7, z0 + 0.06));
  // lamps
  for (const x of [-2.6, 2.4]) {
    scene.add(box(0.02, 0.25, 0.02, m.dark, x, h - 0.12, -1.2));
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.22, 10, 1, true), m.lamp);
    shade.position.set(x, h - 0.3, -1.2);
    scene.add(shade);
    const light = new THREE.PointLight(0xffe2b0, 8, 6, 1.4);
    light.position.set(x, h - 0.45, -1.2);
    light.castShadow = x < 0;
    scene.add(light);
  }

  // the tenant
  const tenant = makeTenant(m);
  tenant.position.set(-1.0, 0, -1.0);
  scene.add(tenant);
  refs.tenant = tenant;

  scene.traverse((o) => {
    if (o.isMesh && o !== block) {
      o.castShadow = o.castShadow || o.geometry.type === 'BoxGeometry';
      o.receiveShadow = true;
    }
  });

  // light: the street outside, and the apartment's own lamps
  scene.add(new THREE.HemisphereLight(0x9aa8c8, 0x2a2420, 0.55));
  const moon = new THREE.DirectionalLight(0xb8c8e8, 0.7);
  moon.position.set(-4, 8, 10);
  scene.add(moon);
  return refs;
}
