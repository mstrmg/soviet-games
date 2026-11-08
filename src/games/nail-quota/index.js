// NAIL QUOTA — placeholder until build step 2.
import * as THREE from 'three';
import { createPlaceholderScene } from '../../shared/placeholderScene.js';
import { PALETTE } from '../../shared/palette.js';
import { flat } from '../../shared/renderer.js';

export default createPlaceholderScene({
  id: 'nail-quota',
  title: 'NAIL QUOTA',
  dept: 'Directorate of Fasteners',
  accent: PALETTE.red,
  memo: {
    no: '1147/N',
    subject: 'Temporary closure of the Nail Factory',
    body: [
      'The Nail Factory is being retooled to meet the new Five-Year Plan. Retooling is 112% complete.',
      'Citizens requiring nails are reminded that the national supply of nails is sufficient, and that the shortage of nails is a Western fabrication.',
    ],
  },
  newspaper: {
    headline: 'NAIL OUTPUT SURPASSES ALL EXPECTATIONS',
    deck: 'Factory No. 4 fulfils quota by weight with a single heroic nail',
    caption: 'The nail, photographed shortly before it was declared a monument.',
    columns: [
      'Workers of the Directorate of Fasteners have exceeded the annual plan by a margin that statisticians describe as "structurally significant."',
      'Asked how the nail might be used, the factory director replied that use was not among the indicators.',
    ],
  },
  buildProp(g) {
    // One giant nail, lying down. Exactly as ordered.
    const steel = flat(PALETTE.greyLight, { metalness: 0.6, roughness: 0.45 });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.2, 6), steel);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 8), steel);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.45, 6), steel);
    head.position.y = 1.66;
    tip.position.y = -1.82;
    tip.rotation.x = Math.PI;
    const nail = new THREE.Group();
    nail.add(shaft, head, tip);
    nail.rotation.z = Math.PI / 2 - 0.15;
    nail.position.y = 0.6;
    g.add(nail);
  },
});
