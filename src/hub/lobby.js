// Builds the Ministry lobby: walls, floor, three doors with posters,
// the Minister's portrait, the clock, the closed Enquiries window and its queue.
import * as THREE from 'three';
import { flat } from '../shared/renderer.js';
import { PALETTE, CSS } from '../shared/palette.js';
import { rng } from '../shared/canvasTexture.js';
import {
  plasterTexture,
  floorTexture,
  posterTexture,
  portraitTexture,
  clockFaceTexture,
  signTexture,
  bannerTexture,
} from './textures.js';
import { buildQueue } from './citizens.js';

export const ROOM = { halfW: 11, back: -8, front: 14, height: 10 };
const DOOR_W = 2.4;
const DOOR_H = 4.4;

function shadowed(obj, cast = true, receive = true) {
  obj.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = cast;
      o.receiveShadow = receive;
    }
  });
  return obj;
}

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

function texturedPlane(w, h, map, opts = {}) {
  const mat = new THREE.MeshStandardMaterial({ map, roughness: 0.9, ...opts });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}

export function makeMedal() {
  const g = new THREE.Group();
  const gold = flat(PALETTE.gold, { metalness: 0.75, roughness: 0.35, emissive: 0x3a2a00 });
  const ribbon = flat(PALETTE.red);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 10), gold);
  disc.rotation.x = Math.PI / 2;
  const starShape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const rad = i % 2 === 0 ? 0.15 : 0.065;
    const fn = i === 0 ? 'moveTo' : 'lineTo';
    starShape[fn](Math.cos(a) * rad, Math.sin(a) * rad);
  }
  const star = new THREE.Mesh(new THREE.ExtrudeGeometry(starShape, { depth: 0.03, bevelEnabled: false }), ribbon);
  star.position.z = 0.025;
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.02), ribbon);
  band.position.y = 0.32;
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.025), gold);
  stripe.position.y = 0.32;
  g.add(disc, star, band, stripe);
  return g;
}

export function buildLobby(scene, departments, { medals = {} } = {}) {
  const { halfW, back, front, height } = ROOM;
  const depth = front - back;
  const refs = { doors: [], hitboxes: [] };

  const mats = {
    plasterBack: new THREE.MeshStandardMaterial({ map: plasterTexture(7), roughness: 0.95 }),
    plasterSide: new THREE.MeshStandardMaterial({ map: plasterTexture(11), roughness: 0.95 }),
    stone: flat(0xcfc6b2),
    stoneDark: flat(0x8f887a),
    brick: flat(0x9c6a4f),
    wood: flat(PALETTE.wood, { roughness: 0.7 }),
    woodDark: flat(PALETTE.woodDark, { roughness: 0.7 }),
    brass: flat(PALETTE.brass, { metalness: 0.7, roughness: 0.4 }),
    gold: flat(PALETTE.gold, { metalness: 0.7, roughness: 0.35 }),
    black: flat(PALETTE.black),
    red: flat(PALETTE.red),
    redDark: flat(PALETTE.redDark),
    velvet: flat(0x4a1014, { roughness: 1 }),
    ceiling: flat(0x4a4741),
    grey: flat(PALETTE.grey),
    corridor: new THREE.MeshStandardMaterial({ color: 0x15100f, side: THREE.BackSide, roughness: 1 }),
  };

  // ---- Floor ---------------------------------------------------------------
  const floor = texturedPlane(halfW * 2, depth, floorTexture(halfW * 2, depth));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, (front + back) / 2);
  floor.receiveShadow = true;
  scene.add(floor);

  // ---- Back wall (one shape with three door-shaped notches) ----------------
  const doorXs = departments.map((_, i) => (i - (departments.length - 1) / 2) * 6);
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
  const backWall = new THREE.Mesh(backGeo, mats.plasterBack);
  backWall.position.z = back;
  backWall.receiveShadow = true;
  scene.add(backWall);

  // ---- Side walls & ceiling -------------------------------------------------
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(depth, height), mats.plasterSide);
    wall.position.set(side * halfW, height / 2, (front + back) / 2);
    wall.rotation.y = -side * (Math.PI / 2);
    wall.receiveShadow = true;
    scene.add(wall);
    // skirting + cornice
    scene.add(shadowed(box(0.12, 0.3, depth, mats.stoneDark, side * (halfW - 0.06), 0.15, (front + back) / 2), false));
    scene.add(shadowed(box(0.4, 0.4, depth, mats.stone, side * (halfW - 0.2), height - 0.2, (front + back) / 2), false));
  }
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(halfW * 2, depth), mats.ceiling);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, height, (front + back) / 2);
  scene.add(ceiling);
  for (let z = back + 2; z < front; z += 4) {
    scene.add(box(halfW * 2, 0.5, 0.5, mats.stoneDark, 0, height - 0.25, z));
  }
  // the hole in the ceiling (repairs scheduled)
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.75, 7), mats.black);
  hole.rotation.x = Math.PI / 2;
  hole.position.set(-4, height - 0.02, -1);
  scene.add(hole);
  scene.add(box(halfW * 2, 0.4, 0.4, mats.stone, 0, height - 0.2, back + 0.2));

  // pendant lamps hanging from the ceiling, one slightly askew
  refs.pendants = [];
  for (const [px, pz, tilt] of [[0, 1, 0.04]]) {
    const pend = new THREE.Group();
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 5), mats.black);
    rod.position.y = -0.7;
    const shadeP = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.45, 10, 1, true), flat(PALETTE.greyDark, { side: THREE.DoubleSide }));
    shadeP.position.y = -1.5;
    const bulbP = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe2a8 }));
    bulbP.position.y = -1.65;
    pend.add(rod, shadeP, bulbP);
    pend.position.set(px, height, pz);
    pend.rotation.z = tilt;
    scene.add(pend);
    refs.pendants.push(pend);
  }

  // ---- Pilasters on the back wall (one is losing its plaster) ---------------
  const pilasterXs = [-9, -3, 3, 9];
  for (const x of pilasterXs) {
    const g = new THREE.Group();
    if (x === -9) {
      g.add(box(0.7, 3.4, 0.4, mats.stone, 0, 1.7, 0));
      g.add(box(0.45, 1.0, 0.25, mats.brick, 0, 3.9, -0.05)); // exposed core
      g.add(box(0.7, 5.6, 0.4, mats.stone, 0, 7.2, 0));
    } else {
      g.add(box(0.7, height, 0.4, mats.stone, 0, height / 2, 0));
    }
    g.add(box(0.95, 0.5, 0.55, mats.stoneDark, 0, 0.25, 0));
    g.add(box(0.95, 0.4, 0.55, mats.stoneDark, 0, height - 1.0, 0));
    g.position.set(x, 0, back + 0.2);
    scene.add(shadowed(g));
  }
  // rubble at the foot of the damaged pilaster
  const rr = rng(77);
  const rubbleGeo = new THREE.DodecahedronGeometry(0.12, 0);
  for (let i = 0; i < 9; i++) {
    const chunk = new THREE.Mesh(rubbleGeo, i % 3 === 0 ? mats.brick : mats.stone);
    chunk.position.set(-9 + (rr() - 0.3) * 1.4, 0.06, back + 0.6 + rr() * 1.0);
    chunk.scale.setScalar(0.5 + rr() * 1.4);
    chunk.rotation.set(rr() * 3, rr() * 3, rr() * 3);
    scene.add(shadowed(chunk));
  }

  // ---- Banner ----------------------------------------------------------------
  const banner = texturedPlane(17, 1.05, bannerTexture('LEISURE IS LABOUR  ★  LABOUR IS LEISURE  ★  FULFIL THE PLAN FOR FUN'));
  banner.position.set(0, 8.95, back + 0.56);
  banner.rotation.z = -0.012; // one nail came loose
  scene.add(banner);

  // ---- Doors -----------------------------------------------------------------
  departments.forEach((dept, i) => {
    const cx = doorXs[i];
    const door = { dept, cx, open: 0, hover: 0 };
    const g = new THREE.Group();
    g.position.set(cx, 0, back);

    // frame
    const frame = new THREE.Group();
    frame.add(box(0.3, DOOR_H + 0.3, 0.4, mats.stone, -DOOR_W / 2 - 0.15, (DOOR_H + 0.3) / 2, 0.1));
    frame.add(box(0.3, DOOR_H + 0.3, 0.4, mats.stone, DOOR_W / 2 + 0.15, (DOOR_H + 0.3) / 2, 0.1));
    frame.add(box(DOOR_W + 0.9, 0.42, 0.45, mats.stone, 0, DOOR_H + 0.21, 0.12));
    frame.add(box(DOOR_W + 1.1, 0.14, 0.55, mats.red, 0, DOOR_H + 0.49, 0.14));
    g.add(shadowed(frame));

    // the door leaf, hinged on its left edge, opening inward
    const pivot = new THREE.Group();
    pivot.position.set(-DOOR_W / 2, 0, 0);
    const leaf = box(DOOR_W - 0.02, DOOR_H - 0.02, 0.12, mats.wood, DOOR_W / 2, DOOR_H / 2, 0);
    pivot.add(leaf);
    for (const [px, py, ph] of [
      [0.62, 3.15, 1.7],
      [1.78, 3.15, 1.7],
      [0.62, 1.0, 1.3],
      [1.78, 1.0, 1.3],
    ]) {
      pivot.add(box(0.8, ph, 0.05, mats.woodDark, px, py, 0.07));
    }
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), mats.brass);
    knob.position.set(DOOR_W - 0.3, 2.1, 0.14);
    pivot.add(knob);
    pivot.add(box(0.12, 0.5, 0.02, mats.brass, DOOR_W - 0.3, 2.15, 0.07));
    g.add(shadowed(pivot));

    // corridor behind the door: dark, with a faint glow at the far end
    const corridor = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W, DOOR_H, 7), mats.corridor);
    corridor.position.set(0, DOOR_H / 2, -3.5);
    g.add(corridor);
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(DOOR_W * 0.9, DOOR_H * 0.9),
      new THREE.MeshBasicMaterial({ color: PALETTE.red, transparent: true, opacity: 0.55 }),
    );
    glow.position.set(0, DOOR_H / 2, -6.9);
    g.add(glow);

    // name plaque on the lintel
    const plaque = texturedPlane(
      DOOR_W + 0.7,
      0.36,
      signTexture([`№ ${dept.number}  ·  ${dept.dept.toUpperCase()}`], { width: 768, height: 96, border: false, bg: CSS.ink }),
    );
    plaque.position.set(0, DOOR_H + 0.21, 0.35);
    g.add(plaque);

    // propaganda poster
    const posterMap = posterTexture(dept);
    const posterMat = new THREE.MeshStandardMaterial({
      map: posterMap,
      emissive: 0xffffff,
      emissiveMap: posterMap,
      emissiveIntensity: 0.05,
      roughness: 0.85,
    });
    const poster = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 2.68), posterMat);
    poster.position.set(0, 6.55, 0.04);
    poster.rotation.z = [0.012, -0.008, 0.02][i % 3];
    poster.receiveShadow = true;
    g.add(poster);
    g.add(shadowed(box(2.08, 2.8, 0.04, mats.black, 0, 6.55, 0.01), false));

    // gooseneck lamp over the poster
    const lampArm = box(0.06, 0.06, 0.6, mats.brass, 0, 8.15, 0.3);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.3, 8, 1, true), mats.redDark);
    shade.material = mats.redDark;
    shade.position.set(0, 8.02, 0.62);
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffe2a8 }),
    );
    bulb.position.set(0, 7.9, 0.62);
    g.add(lampArm, shade, bulb);
    const light = new THREE.PointLight(0xffd59a, 6, 7, 1.6);
    light.position.set(0, 7.6, 0.9);
    g.add(light);

    // medal board beside the door
    const board = box(0.8, 1.15, 0.06, mats.velvet, DOOR_W / 2 + 0.75, 2.7, 0.04);
    g.add(shadowed(board, false));
    g.add(box(0.9, 0.06, 0.1, mats.gold, DOOR_W / 2 + 0.75, 3.3, 0.06));
    const slot = new THREE.Group();
    slot.position.set(DOOR_W / 2 + 0.75, 2.55, 0.1);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.17, 0.21, 16), flat(0x7a5a5a));
    slot.add(ring);
    g.add(slot);
    const medal = makeMedal();
    medal.visible = Boolean(medals[dept.id]);
    ring.visible = !medal.visible;
    medal.position.z = 0.04;
    slot.add(shadowed(medal));

    // invisible hitbox for clicking the whole doorway + poster
    const hit = new THREE.Mesh(new THREE.BoxGeometry(3.4, 8.4, 1), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(0, 4.2, 0.3);
    hit.userData.door = door;
    g.add(hit);

    scene.add(g);
    Object.assign(door, { group: g, pivot, poster, posterMat, light, glow, medal, ring, hit });
    refs.doors.push(door);
    refs.hitboxes.push(hit);
  });

  // ---- The Minister (left wall) -----------------------------------------------
  const portrait = new THREE.Group();
  const face = texturedPlane(2.3, 2.9, portraitTexture(), { roughness: 0.6 });
  face.position.z = 0.06;
  portrait.add(face);
  const fw = 2.3,
    fh = 2.9,
    t = 0.22;
  portrait.add(box(fw + t * 2, t, 0.14, mats.gold, 0, fh / 2 + t / 2, 0.05));
  portrait.add(box(fw + t * 2, t, 0.14, mats.gold, 0, -fh / 2 - t / 2, 0.05));
  portrait.add(box(t, fh, 0.14, mats.gold, -fw / 2 - t / 2, 0, 0.05));
  portrait.add(box(t, fh, 0.14, mats.gold, fw / 2 + t / 2, 0, 0.05));
  const nameplate = texturedPlane(
    2.2,
    0.42,
    signTexture(['THE MINISTER OF GAMES', 'UNDEFEATED SINCE 1953'], { width: 640, height: 128, bg: CSS.ink, fg: CSS.gold }),
  );
  nameplate.position.set(0, -fh / 2 - 0.6, 0.02);
  portrait.add(nameplate);
  portrait.position.set(-halfW + 0.05, 5.6, -2.6);
  portrait.rotation.y = Math.PI / 2;
  scene.add(shadowed(portrait, false));
  // flags either side
  for (const dz of [-1.9, 1.9]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 4.2, 6), mats.brass);
    pole.position.set(-halfW + 0.6, 2.1, -2.6 + dz);
    pole.rotation.x = dz > 0 ? -0.18 : 0.18;
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.3, 4, 1), new THREE.MeshStandardMaterial({ color: PALETTE.red, side: THREE.DoubleSide, flatShading: true, roughness: 1 }));
    cloth.position.set(0.0, 1.35, dz > 0 ? 0.48 : -0.48);
    cloth.rotation.y = Math.PI / 2;
    pole.add(cloth);
    const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), mats.gold);
    tip.position.y = 2.15;
    pole.add(tip);
    scene.add(shadowed(pole));
  }

  // ---- Enquiries window, clock and the queue (right wall) ---------------------
  const wx = halfW - 0.05;
  const enquiries = new THREE.Group();
  enquiries.add(box(0.3, 2.2, 2.6, mats.stoneDark, 0, 1.6, 0));
  const shutter = new THREE.Group();
  for (let k = 0; k < 9; k++) shutter.add(box(0.06, 0.16, 2.0, mats.grey, -0.17, 1.0 + k * 0.17, 0));
  enquiries.add(shutter);
  enquiries.add(box(0.6, 0.08, 2.4, mats.wood, -0.35, 0.95, 0));
  const enqSign = texturedPlane(2.4, 0.6, signTexture(['ENQUIRIES', 'WINDOW CLOSED · REOPENS AFTER LUNCH'], { width: 640, height: 160 }));
  enqSign.position.set(-0.17, 3.05, 0);
  enqSign.rotation.y = -Math.PI / 2;
  enquiries.add(enqSign);
  enquiries.position.set(wx, 0, -5.3);
  scene.add(shadowed(enquiries));

  const clock = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.16, 16), mats.black);
  rim.rotation.x = Math.PI / 2;
  const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.68, 32), new THREE.MeshStandardMaterial({ map: clockFaceTexture(), roughness: 0.6 }));
  clockFace.position.z = 0.085;
  const handMat = mats.black;
  const mkHand = (len, w, mat, z) => {
    const pivotG = new THREE.Group();
    const h = box(w, len, 0.015, mat, 0, len / 2 - 0.06, 0);
    pivotG.add(h);
    pivotG.position.z = z;
    return pivotG;
  };
  const hourHand = mkHand(0.36, 0.06, handMat, 0.1);
  const minuteHand = mkHand(0.54, 0.04, handMat, 0.11);
  const secondHand = mkHand(0.58, 0.015, mats.red, 0.12);
  clock.add(rim, clockFace, hourHand, minuteHand, secondHand);
  clock.position.set(wx - 0.1, 5.3, -5.3);
  clock.rotation.y = -Math.PI / 2;
  scene.add(shadowed(clock, true, false));
  refs.clock = { hourHand, minuteHand, secondHand };

  const queue = buildQueue({ x: 9.6, zStart: -4.0 });
  scene.add(queue);

  // queue registration stand
  const stand = new THREE.Group();
  stand.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6), mats.brass));
  stand.children[0].position.y = 0.75;
  stand.add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.05, 10), mats.brass));
  const standSign = texturedPlane(0.9, 0.6, signTexture(['QUEUE HERE', 'TO JOIN THE QUEUE'], { width: 300, height: 200, bg: CSS.cream, fg: CSS.black }));
  standSign.position.y = 1.7;
  stand.add(standSign);
  stand.position.set(8.2, 0, 1.2);
  stand.rotation.y = -0.5;
  scene.add(shadowed(stand));

  // ---- The leak, the bucket and the puddle ------------------------------------
  const bucket = new THREE.Group();
  const bucketWall = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.24, 0.45, 10, 1, true),
    flat(0x6b7178, { metalness: 0.4, roughness: 0.5, side: THREE.DoubleSide }),
  );
  bucketWall.position.y = 0.225;
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.27, 10), flat(0x2c3538, { roughness: 0.15, metalness: 0.2 }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.36;
  bucket.add(bucketWall, water);
  bucket.position.set(-4, 0, -1);
  scene.add(shadowed(bucket));
  const puddle = new THREE.Mesh(
    new THREE.CircleGeometry(0.9, 9),
    new THREE.MeshStandardMaterial({ color: 0x1b2023, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.55 }),
  );
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.set(-3.6, 0.005, -0.6);
  puddle.scale.set(1.3, 0.8, 1);
  scene.add(puddle);
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), new THREE.MeshBasicMaterial({ color: 0x9fb4bd }));
  drop.position.set(-4, height - 0.1, -1);
  scene.add(drop);
  const ripple = new THREE.Mesh(
    new THREE.RingGeometry(0.03, 0.05, 16),
    new THREE.MeshBasicMaterial({ color: 0xbcd0d6, transparent: true, opacity: 0 }),
  );
  ripple.rotation.x = -Math.PI / 2;
  ripple.position.set(-4, 0.37, -1);
  scene.add(ripple);
  refs.drip = { drop, ripple, top: height - 0.1, bottom: 0.38, y: height - 0.1, v: 0, wait: 1.2 };

  // ---- Dust in the light --------------------------------------------------------
  const dustCount = 350;
  const dustPos = new Float32Array(dustCount * 3);
  const dr = rng(5);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (dr() - 0.5) * halfW * 2;
    dustPos[i * 3 + 1] = dr() * height;
    dustPos[i * 3 + 2] = back + dr() * depth;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({ color: 0xfff1d6, size: 0.035, transparent: true, opacity: 0.5, depthWrite: false }),
  );
  scene.add(dust);
  refs.dust = dust;

  // ---- Lighting: one hard low sun, warm sconces, dim fill ---------------------
  scene.add(new THREE.HemisphereLight(0xf2e8d5, 0x2a2420, 0.55));
  const sun = new THREE.DirectionalLight(0xffe2bd, 3.2);
  sun.position.set(7, 8.5, 20);
  sun.target.position.set(-1, 0, -6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 14, bottom: -10, near: 1, far: 60 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xbfc8d6, 0.7);
  fill.position.set(-10, 6, 6);
  scene.add(fill);
  refs.sun = sun;

  return refs;
}
