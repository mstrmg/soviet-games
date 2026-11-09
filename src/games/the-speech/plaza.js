// THE SPEECH — the plaza, seen from the press box. A stage, a podium, a small figure with a
// large microphone; a crowd of instanced people who applaud when required; floodlights; a clock
// tower; a sky that goes from night to dawn over seven hours. In the foreground, your typewriter.
import * as THREE from 'three';
import { flat } from '../../shared/renderer.js';
import { canvasTexture, rng, fitText } from '../../shared/canvasTexture.js';
import { FONTS } from '../../shared/palette.js';

const SKY = [
  [0, 0x0b1428],
  [0.5, 0x070b18],
  [0.8, 0x1a1c3a],
  [0.92, 0x7a4a5a],
  [1, 0xe8a060],
];

export function buildPlaza(scene) {
  const g = new THREE.Group();
  scene.add(g);
  const add = (geo, mat, x, y, z, parent = g) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  // the plaza
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), flat(0x4a4640, { roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  g.add(ground);

  // the stage
  add(new THREE.BoxGeometry(12, 1.2, 4), flat(0x6a2a2a), 0, 0.6, -12);
  add(new THREE.BoxGeometry(12.2, 0.1, 4.2), flat(0x3a3a3a), 0, 1.25, -12);
  const backdrop = add(new THREE.PlaneGeometry(18, 7), new THREE.MeshStandardMaterial({ map: backdropTexture(), roughness: 0.9 }), 0, 4.7, -14.2);
  backdrop.castShadow = false;
  // the flags either side
  for (const sx of [-1, 1]) {
    const f = add(new THREE.PlaneGeometry(3, 5.6), new THREE.MeshStandardMaterial({ map: flagTexture(), roughness: 0.9, side: THREE.DoubleSide }), sx * 11, 4.3, -13.8);
    f.castShadow = false;
  }
  // the podium and the speaker
  add(new THREE.BoxGeometry(1.1, 1.3, 0.7), flat(0x5a3a22), 0, 1.95, -11.2);
  const speaker = new THREE.Group();
  speaker.position.set(0, 1.3, -11.9);
  const olive = flat(0x4a5a32, { roughness: 0.8 });
  add(new THREE.CylinderGeometry(0.32, 0.36, 1.5, 10), olive, 0, 0.95, 0, speaker);
  add(new THREE.SphereGeometry(0.24, 12, 10), flat(0x9a6a4a), 0, 1.92, 0, speaker);
  add(new THREE.CylinderGeometry(0.25, 0.27, 0.16, 12), olive, 0, 2.13, 0, speaker);
  add(new THREE.BoxGeometry(0.32, 0.03, 0.2), olive, 0, 2.07, 0.2, speaker);
  const arm = new THREE.Group();
  arm.position.set(0.36, 1.55, 0);
  add(new THREE.BoxGeometry(0.14, 0.7, 0.14), olive, 0, -0.32, 0, arm);
  speaker.add(arm);
  g.add(speaker);
  // the microphones, which are many
  for (let k = 0; k < 5; k++) {
    const mic = add(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 4), flat(0x222222), -0.3 + k * 0.15, 2.85, -10.95);
    mic.rotation.x = 0.4;
    add(new THREE.SphereGeometry(0.06, 8, 6), flat(0x333333), -0.3 + k * 0.15, 3.18, -11.08);
  }

  // floodlights on towers, with visible beams
  const beams = [];
  for (const sx of [-1, 1]) {
    add(new THREE.BoxGeometry(0.4, 9, 0.4), flat(0x6a6a6a, { metalness: 0.5 }), sx * 14, 4.5, -6);
    add(new THREE.BoxGeometry(1.4, 0.7, 0.5), flat(0xeeeeee, { emissive: 0xffffcc, emissiveIntensity: 0.8 }), sx * 14, 9.2, -6);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(4, 16, 18, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff4c8, transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.set(sx * 7.5, 5.5, -9);
    beam.rotation.z = sx * -1.0;
    beam.rotation.x = -0.25;
    g.add(beam);
    beams.push(beam);
  }

  // the clock tower, stage right
  add(new THREE.BoxGeometry(2.4, 12, 2.4), flat(0xc8b890), 15, 6, -16);
  add(new THREE.ConeGeometry(1.9, 2.4, 4), flat(0x8a3a2a), 15, 13.2, -16).rotation.y = Math.PI / 4;
  const face = add(new THREE.CircleGeometry(0.95, 28), flat(0xf2ede0, { emissive: 0xfff4d0, emissiveIntensity: 0.35 }), 15, 9.6, -14.78);
  face.castShadow = false;
  const handH = new THREE.Group();
  handH.position.set(15, 9.6, -14.74);
  add(new THREE.BoxGeometry(0.08, 0.55, 0.02), flat(0x111111), 0, 0.26, 0, handH);
  const handM = new THREE.Group();
  handM.position.set(15, 9.6, -14.73);
  add(new THREE.BoxGeometry(0.05, 0.82, 0.02), flat(0x111111), 0, 0.4, 0, handM);
  g.add(handH, handM);

  // the crowd
  const r = rng(61);
  const N = 1400;
  const bodyGeo = new THREE.CylinderGeometry(0.2, 0.24, 1.2, 6);
  bodyGeo.translate(0, 0.6, 0);
  const headGeo = new THREE.SphereGeometry(0.15, 6, 5);
  headGeo.translate(0, 1.38, 0);
  const bodies = new THREE.InstancedMesh(bodyGeo, new THREE.MeshStandardMaterial({ roughness: 0.85 }), N);
  const heads = new THREE.InstancedMesh(headGeo, new THREE.MeshStandardMaterial({ roughness: 0.85 }), N);
  const shirts = [0xe8e0d0, 0xc1272d, 0x3a6a8a, 0xd4a72c, 0x6a8a4a, 0xf2ede0, 0x7a5a9a, 0x2a4a8a].map((c) => new THREE.Color(c));
  const skins = [0x8a5a3a, 0x5a3a2a, 0xc89a72, 0x6a4430].map((c) => new THREE.Color(c));
  const people = [];
  for (let i = 0; i < N; i++) {
    const x = (r() - 0.5) * 26;
    const z = -9 + r() * 15;
    if (Math.abs(x) < 1.2 && z > 4) continue; // an aisle for the press box view
    people.push({ x, z, ph: r() * 6, s: 0.9 + r() * 0.2 });
    bodies.setColorAt(people.length - 1, shirts[Math.floor(r() * shirts.length)]);
    heads.setColorAt(people.length - 1, skins[Math.floor(r() * skins.length)]);
  }
  bodies.count = heads.count = people.length;
  bodies.castShadow = true;
  g.add(bodies, heads);
  // little flags, in some hands
  const flagGeo = new THREE.PlaneGeometry(0.34, 0.22);
  flagGeo.translate(0.17, 1.95, 0);
  const flags = new THREE.InstancedMesh(flagGeo, new THREE.MeshStandardMaterial({ map: flagTexture(), side: THREE.DoubleSide, roughness: 0.9 }), 260);
  const flagOf = [];
  for (let i = 0; i < 260; i++) flagOf.push(Math.floor(r() * people.length));
  g.add(flags);

  // the press box: a desk, your typewriter, a lamp, a cup
  const desk = add(new THREE.BoxGeometry(5, 0.12, 1.6), flat(0x5a3a22, { roughness: 0.7 }), 0, 2.6, 11.4);
  desk.castShadow = false;
  add(new THREE.BoxGeometry(5, 1.1, 0.1), flat(0x4a2e1a), 0, 2.0, 10.65);
  const tw = new THREE.Group();
  tw.position.set(0.15, 2.66, 11.5);
  const black = flat(0x1b1a18, { roughness: 0.35, metalness: 0.2 });
  add(new THREE.BoxGeometry(1.1, 0.22, 0.7), black, 0, 0.11, 0, tw);
  for (let row = 0; row < 3; row++) {
    for (let k = 0; k < 9; k++) add(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 8), flat(0xe8e0d0), -0.4 + k * 0.1 + row * 0.03, 0.24 + row * 0.03, 0.18 - row * 0.1, tw);
  }
  const roller = add(new THREE.CylinderGeometry(0.07, 0.07, 1.25, 12), black, 0, 0.32, -0.25, tw);
  roller.rotation.z = Math.PI / 2;
  const paper = add(new THREE.PlaneGeometry(0.75, 1), flat(0xf6f1e4, { roughness: 1, side: THREE.DoubleSide }), 0, 0.38, -0.3, tw);
  paper.castShadow = false;
  paper.rotation.x = -0.2;
  const paperBase = { y: 0.38 };
  g.add(tw);
  add(new THREE.CylinderGeometry(0.08, 0.07, 0.16, 12), flat(0xf2ede0), -1.3, 2.74, 11.2);
  add(new THREE.CylinderGeometry(0.075, 0.075, 0.01, 12), flat(0x2a1a10), -1.3, 2.82, 11.2);
  const lampArm = add(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6), flat(0x2a4a3a), 1.6, 3.0, 11.5);
  lampArm.rotation.z = 0.3;
  add(new THREE.ConeGeometry(0.18, 0.22, 12, 1, true), flat(0x2a4a3a, { side: THREE.DoubleSide }), 1.5, 3.4, 11.4);

  const tmp = new THREE.Object3D();
  let clapT = 0;
  let typed = 0;

  return {
    speakerArm: arm,
    /** 0 at 23:00, 1 at 06:00. */
    setTime(f, scene3) {
      const hours = f * 7;
      handH.rotation.z = -((((23 + hours) % 12) / 12) * Math.PI * 2);
      handM.rotation.z = -((hours % 1) * Math.PI * 2);
      let c = new THREE.Color(SKY[0][1]);
      for (let i = 1; i < SKY.length; i++) {
        if (f <= SKY[i][0]) {
          const [a, ca] = SKY[i - 1];
          const [b, cb] = SKY[i];
          c = new THREE.Color(ca).lerp(new THREE.Color(cb), (f - a) / (b - a));
          break;
        }
      }
      scene3.background = c;
      if (scene3.fog) scene3.fog.color = c;
      for (const b of beams) b.material.opacity = 0.07 * (1 - Math.max(0, (f - 0.85) / 0.15));
    },
    clap(seconds = 2) {
      clapT = seconds;
    },
    /** One character typed: the paper creeps up. */
    type() {
      typed++;
      paper.position.y = paperBase.y + Math.min(0.35, typed * 0.0015);
    },
    tick(dt, t, talking) {
      clapT = Math.max(0, clapT - dt);
      const lift = clapT > 0 ? 1 : 0;
      for (let i = 0; i < people.length; i++) {
        const p = people[i];
        const bob = lift ? Math.abs(Math.sin(t * 9 + p.ph)) * 0.12 : Math.sin(t * 0.7 + p.ph) * 0.015;
        tmp.position.set(p.x, bob, p.z);
        tmp.rotation.set(0, 0, lift ? 0 : Math.sin(t * 0.4 + p.ph) * 0.03);
        tmp.scale.setScalar(p.s);
        tmp.updateMatrix();
        bodies.setMatrixAt(i, tmp.matrix);
        heads.setMatrixAt(i, tmp.matrix);
      }
      bodies.instanceMatrix.needsUpdate = true;
      heads.instanceMatrix.needsUpdate = true;
      for (let k = 0; k < flagOf.length; k++) {
        const p = people[flagOf[k]];
        const wave = lift ? Math.sin(t * 8 + p.ph) * 0.5 : Math.sin(t * 1.2 + p.ph) * 0.12;
        tmp.position.set(p.x + 0.2, (lift ? 0.25 : 0) + (lift ? Math.abs(Math.sin(t * 9 + p.ph)) * 0.12 : 0), p.z);
        tmp.rotation.set(0, wave, 0);
        tmp.scale.setScalar(p.s);
        tmp.updateMatrix();
        flags.setMatrixAt(k, tmp.matrix);
      }
      flags.instanceMatrix.needsUpdate = true;
      // the speaker gestures while talking, and raises the arm for applause
      arm.rotation.z = clapT > 0 ? 2.6 : talking ? 0.4 + Math.abs(Math.sin(t * 2.3)) * 1.1 : 0.15;
      arm.rotation.x = talking ? Math.sin(t * 1.7) * 0.3 : 0;
    },
  };
}

function backdropTexture() {
  return canvasTexture(1024, 400, (ctx, w, h) => {
    ctx.fillStyle = '#c1272d';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f2ede0';
    ctx.textAlign = 'center';
    const s = fitText(ctx, '¡LA PALABRA CONTINÚA!', w - 80, 130, FONTS.display);
    ctx.font = `${s}px ${FONTS.display}`;
    ctx.fillText('¡LA PALABRA CONTINÚA!', w / 2, h * 0.42);
    ctx.font = `600 34px ${FONTS.body}`;
    ctx.fillText('ACTO CENTRAL · PLAZA DE LA PERSEVERANCIA · 23:00 HASTA NUEVO AVISO', w / 2, h * 0.72);
    ctx.fillStyle = '#d4a72c';
    ctx.fillRect(0, h - 26, w, 10);
  });
}

function flagTexture() {
  return canvasTexture(150, 100, (ctx, w, h) => {
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 ? '#f2ede0' : '#1f4a9a';
      ctx.fillRect(0, (i * h) / 5, w, h / 5 + 1);
    }
    ctx.fillStyle = '#c1272d';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w * 0.45, h / 2);
    ctx.lineTo(0, h);
    ctx.fill();
    ctx.fillStyle = '#f2ede0';
    ctx.font = `24px ${FONTS.display}`;
    ctx.fillText('★', w * 0.08, h / 2 + 9);
  });
}
