// POTEMKIN VILLAGE — placeholder until build step 3.
import * as THREE from 'three';
import { createPlaceholderScene } from '../../shared/placeholderScene.js';
import { PALETTE } from '../../shared/palette.js';
import { flat } from '../../shared/renderer.js';

export default createPlaceholderScene({
  id: 'potemkin-village',
  title: 'POTEMKIN VILLAGE',
  dept: 'Directorate of Rural Appearances',
  accent: PALETTE.red,
  memo: {
    no: '3302/V',
    subject: 'The village is ready for inspection',
    body: [
      'The model village has been completed on schedule. Visitors are asked to view it only from the front.',
      'The back of the village is closed for reconstruction. The back of the village has always been closed for reconstruction.',
    ],
  },
  newspaper: {
    headline: 'INSPECTOR DELIGHTED BY RURAL PROSPERITY',
    deck: '"I have never seen a village so flat," says visiting official',
    caption: 'A typical village, as seen from the road.',
    columns: [
      'The Inspector toured the village at a steady 40 km/h and found no deficiencies visible from his seat.',
      'Residents waved continuously for four hours. They have since been reassigned to the next village.',
    ],
  },
  buildProp(g) {
    // A cheerful facade, propped up from behind by two planks.
    const plywood = flat(PALETTE.cream);
    const red = flat(PALETTE.red);
    const wood = flat(PALETTE.wood);
    const front = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 0.05), plywood);
    front.position.y = 0.8;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.9, 3), red);
    roof.scale.z = 0.04;
    roof.position.y = 2.05;
    const win1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.07), flat(0x8fb3c9));
    win1.position.set(-0.55, 0.95, 0);
    const win2 = win1.clone();
    win2.position.x = 0.55;
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.8, 0.07), wood);
    door.position.set(0, 0.4, 0);
    for (const x of [-0.7, 0.7]) {
      const prop = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.9, 0.06), wood);
      prop.position.set(x, 0.8, -0.5);
      prop.rotation.x = -0.5;
      g.add(prop);
    }
    g.add(front, roof, win1, win2, door);
  },
});
