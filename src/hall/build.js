// Builds the International Hall of Fraternal Nations: a grand concourse dressed as a border
// checkpoint. Three tall doors (one per wing) with barrier booms, a guard behind glass, a queue lane.
import * as THREE from 'three';
import { flat } from '../shared/renderer.js';
import { PALETTE, CSS, FONTS } from '../shared/palette.js';
import { canvasTexture, rng, speckle, fitText } from '../shared/canvasTexture.js';
import { plasterTexture, bannerTexture, signTexture } from '../hub/textures.js';
import { HALL } from './text.js';

export const ROOM = { halfW: 15, back: -10, front: 18, height: 13 };
const DOOR_W = 3.2;
const DOOR_H = 6;

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}
function shadowed(obj, cast = true, receive = true) {
  obj.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = cast;
      o.receiveShadow = receive;
    }
  });
  return obj;
}

/** Polished stone floor in big slabs, with painted lane lines to each door. */
function floorTexture(w, d, doorXs) {
  const S = 40; // px per metre
  return canvasTexture(w * S, d * S, (ctx, cw, ch) => {
    const r = rng(9);
    for (let y = 0; y < d; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const v = 200 + Math.floor(r() * 18) - ((x + y) % 4 === 0 ? 14 : 0);
        ctx.fillStyle = `rgb(${v},${v - 6},${v - 18})`;
        ctx.fillRect(x * S, y * S, 2 * S - 2, 2 * S - 2);
      }
    }
    // veins
    ctx.strokeStyle = 'rgba(120,110,95,0.25)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 60; i++) {
      ctx.beginPath();
      let x = r() * cw;
      let y = r() * ch;
      ctx.moveTo(x, y);
      for (let k = 0; k < 6; k++) ctx.lineTo((x += (r() - 0.5) * 80), (y += (r() - 0.5) * 80));
      ctx.stroke();
    }
    // lane lines from the checkpoint to each door (texture v=0 is the back wall)
    ctx.strokeStyle = 'rgba(212,167,44,0.85)';
    ctx.lineWidth = 7;
    ctx.setLineDash([36, 22]);
    for (const dx of doorXs) {
      for (const off of [-1.4, 1.4]) {
        ctx.beginPath();
        ctx.moveTo((dx + off + w / 2) * S, 2 * S);
        ctx.lineTo((dx * 0.35 + off * 1.4 + w / 2) * S, 15 * S);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);
    speckle(ctx, cw, ch, 0.06, r, 0.01);
  });
}

/** The big national panel above each door. */
function panelTexture(wing) {
  return canvasTexture(1024, 512, (ctx, w, h) => {
    const r = rng(wing.id.length * 7);
    ctx.fillStyle = CSS.ink;
    ctx.fillRect(0, 0, w, h);
    // the colour field
    const fx = 40;
    const fy = 40;
    const fw = 300;
    const fh = 200;
    if (wing.id === 'gdr') {
      ['#1b1b1b', '#c1272d', '#e2b42c'].forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(fx, fy + (i * fh) / 3, fw, fh / 3);
      });
    } else {
      ctx.fillStyle = wing.colors.field;
      ctx.fillRect(fx, fy, fw, fh);
      const star = (x, y, rad, rot = 0) => {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = rot - Math.PI / 2 + (i * Math.PI) / 5;
          const rr = i % 2 ? rad * 0.4 : rad;
          ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
        }
        ctx.fill();
      };
      ctx.fillStyle = wing.colors.mark;
      if (wing.id === 'china') {
        star(fx + 60, fy + 60, 36);
        [[110, 24], [134, 50], [134, 86], [110, 110]].forEach(([x, y], i) => star(fx + x, fy + y, 12, 0.4 + i * 0.3));
      } else {
        star(fx + 56, fy + 40, 16);
        // hammer and sickle, in outline of a kind
        ctx.strokeStyle = wing.colors.mark;
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.arc(fx + 58, fy + 96, 26, -0.4, Math.PI * 1.05);
        ctx.stroke();
        ctx.save();
        ctx.translate(fx + 56, fy + 100);
        ctx.rotate(-0.78);
        ctx.fillRect(-4, -34, 8, 62);
        ctx.fillRect(-16, -38, 32, 12);
        ctx.restore();
      }
    }
    ctx.strokeStyle = CSS.gold;
    ctx.lineWidth = 6;
    ctx.strokeRect(fx, fy, fw, fh);
    // the words
    ctx.fillStyle = CSS.gold;
    ctx.textBaseline = 'middle';
    const tx = fx + fw + 40;
    const tw = w - tx - 40;
    ctx.font = `${fitText(ctx, wing.short, tw, 120, FONTS.display)}px ${FONTS.display}`;
    ctx.fillText(wing.short, tx, 110);
    ctx.fillStyle = CSS.cream;
    ctx.font = `600 ${fitText(ctx, wing.country, tw, 30, FONTS.body, '600')}px ${FONTS.body}`;
    ctx.fillText(wing.country, tx, 190);
    ctx.fillStyle = CSS.red;
    ctx.fillRect(40, 290, w - 80, 6);
    ctx.fillStyle = CSS.cream;
    ctx.textAlign = 'center';
    ctx.font = `${fitText(ctx, wing.ministry.toUpperCase(), w - 100, 84, FONTS.display)}px ${FONTS.display}`;
    ctx.fillText(wing.ministry.toUpperCase(), w / 2, 370);
    ctx.font = `600 26px ${FONTS.body}`;
    ctx.fillStyle = CSS.greyLight;
    ctx.fillText('FRATERNAL WING · ENTRY BY STAMP ONLY', w / 2, 450);
    speckle(ctx, w, h, 0.12, r, 0.02);
  });
}

/** Painted floor words. */
function floorWordsTexture(text) {
  return canvasTexture(1024, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(212,167,44,0.92)';
    ctx.fillRect(0, h - 14, w, 10);
    ctx.font = `${fitText(ctx, text, w - 40, 96, FONTS.display)}px ${FONTS.display}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 - 6);
  });
}

function buildGuard(mats) {
  const g = new THREE.Group();
  const coat = flat(0x4b5340);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 1.3, 7), coat);
  body.position.y = 1.15;
  const shoulders = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, 0.2, 7), coat);
  shoulders.position.y = 1.85;
  const head = new THREE.Group();
  head.position.y = 2.12;
  const face = new THREE.Mesh(new THREE.IcosahedronGeometry(0.19, 0), flat(PALETTE.skin));
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.2, 0.12, 10), coat);
  crown.position.y = 0.17;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.06, 10), mats.red);
  band.position.y = 0.12;
  const visor = box(0.3, 0.03, 0.16, mats.black, 0, 0.1, 0.16);
  head.add(face, crown, band, visor);
  const arm = new THREE.Group();
  arm.position.set(0.3, 1.8, 0);
  const sleeve = box(0.14, 0.7, 0.14, coat, 0, -0.35, 0);
  const stamp = box(0.12, 0.18, 0.12, mats.woodDark, 0, -0.75, 0);
  arm.add(sleeve, stamp);
  arm.rotation.x = -0.6;
  g.add(body, shoulders, head, arm);
  return { group: g, head, arm };
}

export function buildHall(scene, wings) {
  const { halfW, back, front, height } = ROOM;
  const depth = front - back;
  const refs = { doors: [], hitboxes: [] };
  const mats = {
    plaster: new THREE.MeshStandardMaterial({ map: plasterTexture(23), roughness: 0.95, color: 0xe8e2d4 }),
    stone: flat(0xd8d0be),
    stoneDark: flat(0x8f887a),
    wood: flat(PALETTE.wood, { roughness: 0.6 }),
    woodDark: flat(PALETTE.woodDark, { roughness: 0.6 }),
    brass: flat(PALETTE.brass, { metalness: 0.7, roughness: 0.4 }),
    gold: flat(PALETTE.gold, { metalness: 0.7, roughness: 0.35 }),
    black: flat(PALETTE.black),
    red: flat(PALETTE.red),
    white: flat(0xeeeae2),
    grey: flat(PALETTE.grey),
    ceiling: flat(0x3e3b36),
    corridor: new THREE.MeshStandardMaterial({ color: 0x120e0d, side: THREE.BackSide, roughness: 1 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xbfd6dc, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.1, depthWrite: false }),
  };
  const doorXs = wings.map((_, i) => (i - (wings.length - 1) / 2) * 9);

  // ---- floor, walls, ceiling ------------------------------------------------------
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(halfW * 2, depth), new THREE.MeshStandardMaterial({ map: floorTexture(halfW * 2, depth, doorXs), roughness: 0.35, metalness: 0.05 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, (front + back) / 2);
  floor.receiveShadow = true;
  scene.add(floor);

  const outline = new THREE.Shape();
  outline.moveTo(-halfW, 0);
  for (const cx of doorXs) {
    outline.lineTo(cx - DOOR_W / 2, 0);
    outline.lineTo(cx - DOOR_W / 2, DOOR_H);
    outline.lineTo(cx + DOOR_W / 2, DOOR_H);
    outline.lineTo(cx + DOOR_W / 2, 0);
  }
  outline.lineTo(halfW, 0);
  outline.lineTo(halfW, height);
  outline.lineTo(-halfW, height);
  outline.lineTo(-halfW, 0);
  const backGeo = new THREE.ShapeGeometry(outline);
  const pos = backGeo.attributes.position;
  const uv = backGeo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + halfW) / (halfW * 2), pos.getY(i) / height);
  const backWall = new THREE.Mesh(backGeo, mats.plaster);
  backWall.position.z = back;
  backWall.receiveShadow = true;
  scene.add(backWall);
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(depth, height), mats.plaster);
    wall.position.set(side * halfW, height / 2, (front + back) / 2);
    wall.rotation.y = -side * (Math.PI / 2);
    wall.receiveShadow = true;
    scene.add(wall);
    scene.add(shadowed(box(0.5, 0.5, depth, mats.stone, side * (halfW - 0.25), height - 0.25, (front + back) / 2), false));
    // tall windows the light comes through (bright panels)
    for (let z = back + 6; z < front - 4; z += 7) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 6), new THREE.MeshBasicMaterial({ color: 0xfff3dc }));
      win.position.set(side * (halfW - 0.02), 7, z);
      win.rotation.y = -side * (Math.PI / 2);
      scene.add(win);
      scene.add(box(0.1, 6.4, 0.2, mats.stoneDark, side * (halfW - 0.05), 7, z));
      scene.add(box(0.1, 0.2, 2.6, mats.stoneDark, side * (halfW - 0.05), 7, z));
    }
  }
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(halfW * 2, depth), mats.ceiling);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, height, (front + back) / 2);
  scene.add(ceiling);
  for (let z = back + 3; z < front; z += 5) scene.add(box(halfW * 2, 0.6, 0.6, mats.stoneDark, 0, height - 0.3, z));

  // ---- the banner across the top ---------------------------------------------------
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(24, 1.4), new THREE.MeshStandardMaterial({ map: bannerTexture(HALL.banner), roughness: 0.9 }));
  banner.position.set(0, 11.6, back + 0.3);
  scene.add(banner);
  const sub = new THREE.Mesh(new THREE.PlaneGeometry(14, 0.7), new THREE.MeshStandardMaterial({ map: signTexture([HALL.subBanner], { width: 1400, height: 70, border: false, bg: CSS.ink, fg: CSS.gold }), roughness: 0.9 }));
  sub.position.set(0, 10.45, back + 0.3);
  scene.add(sub);

  // ---- three doors -----------------------------------------------------------------
  wings.forEach((wing, i) => {
    const cx = doorXs[i];
    const g = new THREE.Group();
    g.position.set(cx, 0, back);
    // frame
    g.add(box(0.5, DOOR_H + 0.5, 0.6, mats.stone, -DOOR_W / 2 - 0.25, (DOOR_H + 0.5) / 2, 0.2));
    g.add(box(0.5, DOOR_H + 0.5, 0.6, mats.stone, DOOR_W / 2 + 0.25, (DOOR_H + 0.5) / 2, 0.2));
    g.add(box(DOOR_W + 1.4, 0.6, 0.7, mats.stone, 0, DOOR_H + 0.3, 0.22));
    // double doors
    const leaves = [];
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * (DOOR_W / 2), 0, 0.05);
      const leaf = box(DOOR_W / 2 - 0.02, DOOR_H - 0.02, 0.14, mats.wood, -side * (DOOR_W / 4), DOOR_H / 2, 0);
      pivot.add(leaf);
      for (const py of [1.5, 4.2]) pivot.add(box(DOOR_W / 2 - 0.5, 1.8, 0.05, mats.woodDark, -side * (DOOR_W / 4), py, 0.08));
      pivot.add(box(0.08, 0.6, 0.06, mats.brass, -side * (DOOR_W / 2 - 0.2), 3, 0.1));
      g.add(pivot);
      leaves.push({ pivot, side });
    }
    const corridor = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W, DOOR_H, 9), mats.corridor);
    corridor.position.set(0, DOOR_H / 2, -4.5);
    g.add(corridor);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(DOOR_W - 0.2, DOOR_H - 0.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(wing.colors.field === '#2a2a2a' ? '#d4a72c' : wing.colors.field), transparent: true, opacity: 0.5 }));
    glow.position.set(0, DOOR_H / 2, -8.8);
    g.add(glow);
    // national panel
    const panelMat = new THREE.MeshStandardMaterial({ map: panelTexture(wing), roughness: 0.7, emissive: 0xffffff, emissiveMap: null, emissiveIntensity: 0 });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.6), panelMat);
    panel.position.set(0, DOOR_H + 2.1, 0.12);
    g.add(panel);
    g.add(box(5.5, 2.9, 0.12, mats.gold, 0, DOOR_H + 2.1, 0.04));
    // hanging banners in the wing's colours
    for (const side of [-1, 1]) {
      const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 4.2, 1, 4), flat(wing.id === 'gdr' ? PALETTE.black : PALETTE.red, { side: THREE.DoubleSide }));
      cloth.position.set(side * 3.4, 6.3, 0.15);
      g.add(cloth);
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.22), flat(wing.id === 'gdr' ? 0xe2b42c : PALETTE.gold, { side: THREE.DoubleSide }));
      stripe.position.set(side * 3.4, 5.0, 0.16);
      g.add(stripe);
      g.add(box(1.3, 0.08, 0.08, mats.brass, side * 3.4, 8.45, 0.16));
    }
    // light over the door
    const light = new THREE.PointLight(0xffe2b0, 10, 9, 1.6);
    light.position.set(0, DOOR_H + 0.6, 2.2);
    g.add(light);
    // barrier boom: a post and a striped arm across the doorway
    const boomPost = box(0.3, 1.2, 0.3, mats.grey, DOOR_W / 2 + 0.9, 0.6, 3);
    g.add(boomPost);
    const boom = new THREE.Group();
    boom.position.set(DOOR_W / 2 + 0.9, 1.1, 3);
    for (let k = 0; k < 9; k++) boom.add(box(0.5, 0.14, 0.14, k % 2 ? mats.white : mats.red, -0.25 - k * 0.5, 0, 0));
    g.add(boom);
    g.add(box(0.12, 0.9, 0.12, mats.grey, DOOR_W / 2 + 0.9 - 4.4, 0.45, 3)); // the rest for the arm
    scene.add(shadowed(g));
    const hit = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W + 1.6, DOOR_H + 3.6, 0.5), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(cx, (DOOR_H + 3.6) / 2, back + 0.6);
    hit.userData.door = i;
    scene.add(hit);
    refs.hitboxes.push(hit);
    refs.doors.push({ wing, cx, group: g, leaves, glow, light, panelMat, boom, hit, hover: 0, open: 0 });
  });

  // ---- passport control booth, right side --------------------------------------------
  const booth = new THREE.Group();
  booth.add(box(3.2, 1.2, 2.2, mats.woodDark, 0, 0.6, 0)); // counter base
  booth.add(box(3.4, 0.1, 2.4, mats.wood, 0, 1.25, 0));
  const glass = box(3.2, 1.7, 0.04, mats.glass, 0, 2.15, 1.05);
  booth.add(glass);
  booth.add(box(0.04, 1.7, 2.2, mats.glass, -1.6, 2.15, 0));
  booth.add(box(3.4, 0.25, 2.5, mats.stoneDark, 0, 3.1, 0));
  for (const x of [-1.6, 1.6]) booth.add(box(0.12, 1.8, 0.12, mats.stoneDark, x, 2.15, 1.05));
  booth.add(box(0.7, 0.05, 0.12, mats.black, 0.4, 1.32, 1.18)); // the slot
  const boothSign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.7), new THREE.MeshStandardMaterial({ map: signTexture(HALL.booth, { width: 768, height: 168 }), roughness: 0.8 }));
  boothSign.position.set(0, 3.6, 1.27);
  booth.add(boothSign);
  const guard = buildGuard(mats);
  guard.group.position.set(0, 0, -0.4);
  booth.add(guard.group);
  booth.position.set(10, 0, 0.5);
  booth.rotation.y = -0.54;
  scene.add(shadowed(booth));
  refs.guard = guard;

  // ---- the queue lane, left side: stanchions, ropes, and painted instructions -----------
  const lane = new THREE.Group();
  const ropeMat = flat(PALETTE.redDark);
  const posts = [];
  for (let row = 0; row < 3; row++) {
    for (let k = 0; k < 5; k++) {
      const p = new THREE.Vector3(-11 + k * 1.6, 0, 2 + row * 1.6);
      posts.push(p);
      lane.add(box(0.08, 1.0, 0.08, mats.brass, p.x, 0.5, p.z));
      lane.add(box(0.3, 0.05, 0.3, mats.brass, p.x, 0.03, p.z));
    }
  }
  for (let row = 0; row < 3; row++) {
    for (let k = 0; k < 4; k++) {
      if ((row === 0 && k === 3) || (row === 1 && k === 0)) continue; // the turns in the zigzag
      const a = posts[row * 5 + k];
      const b = posts[row * 5 + k + 1];
      const rope = box(b.x - a.x, 0.05, 0.05, ropeMat, (a.x + b.x) / 2, 0.88, a.z);
      lane.add(rope);
    }
  }
  scene.add(shadowed(lane));
  const words = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.75), new THREE.MeshBasicMaterial({ map: floorWordsTexture(HALL.floorLine), transparent: true, depthWrite: false }));
  words.rotation.x = -Math.PI / 2;
  words.position.set(-7.6, 0.02, 7.6);
  scene.add(words);

  // ---- lighting -----------------------------------------------------------------------
  scene.add(new THREE.HemisphereLight(0xf2e8d5, 0x2a2420, 0.7));
  const sun = new THREE.DirectionalLight(0xffe7c4, 3.0);
  sun.position.set(-12, 14, 14);
  sun.target.position.set(2, 0, -6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 16, bottom: -14, near: 1, far: 60 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xbfc8d6, 0.6);
  fill.position.set(12, 8, 6);
  scene.add(fill);

  return refs;
}
