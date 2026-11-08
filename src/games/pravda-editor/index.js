// PRAVDA EDITOR — placeholder until build step 4.
import * as THREE from 'three';
import { createPlaceholderScene } from '../../shared/placeholderScene.js';
import { PALETTE } from '../../shared/palette.js';
import { flat } from '../../shared/renderer.js';

export default createPlaceholderScene({
  id: 'pravda-editor',
  title: 'PRAVDA EDITOR',
  dept: 'Directorate of Correct Information',
  accent: PALETTE.redDark,
  memo: {
    no: '0001/P',
    subject: 'The editor\'s desk is not currently vacant',
    body: [
      'The position of Editor is temporarily filled by a previous Editor, who will be leaving shortly for reasons that will be announced later, or not.',
      'Applicants are asked to wait. Applicants who ask how long are asked to wait longer.',
    ],
  },
  newspaper: {
    masthead: 'PRAVDA',
    headline: 'EDITOR APPOINTED; HAS ALWAYS BEEN EDITOR',
    deck: 'Records confirm no other editor has ever existed',
    caption: 'The editor\'s desk, photographed at an approved angle.',
    columns: [
      'The Directorate is pleased to confirm the continuity of the editorial line, which has never changed and will shortly change again.',
      'Readers are reminded that yesterday\'s edition is no longer available, and never was.',
    ],
  },
  buildProp(g) {
    // A typewriter of solid construction.
    const black = flat(PALETTE.ink, { roughness: 0.6 });
    const cream = flat(PALETTE.cream);
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 1.2), black);
    body.position.y = 0.25;
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 0.6), black);
    top.position.set(0, 0.62, -0.25);
    const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.0, 8), black);
    roller.rotation.z = Math.PI / 2;
    roller.position.set(0, 0.85, -0.35);
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 0.01), cream);
    sheet.position.set(0, 1.4, -0.42);
    sheet.rotation.x = -0.15;
    g.add(body, top, roller, sheet);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 9; c++) {
        const key = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 8), cream);
        key.position.set(-0.68 + c * 0.17 + r * 0.05, 0.52 + r * 0.04, 0.45 - r * 0.15);
        g.add(key);
      }
    }
  },
});
