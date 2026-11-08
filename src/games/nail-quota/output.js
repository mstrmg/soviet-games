// NAIL QUOTA — the year's output, drawn to true scale (1 unit = 1 metre).
// A handful of large nails are laid out in rows; anything more becomes a heap
// of instanced nails over a solid core. Heaps are capped at MAX_INSTANCES
// visible nails; the heap's size is still true to the total volume.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { nailVolumeCm3 } from './rules.js';

const MAX_INSTANCES = 12000;
const ROWS_LIMIT = 400;
const PILE_PACKING = 0.35;
const PILE_SLOPE = Math.tan((30 * Math.PI) / 180);

/** One nail along +Y, centred on the origin. Real dimensions in metres. */
export function makeNailGeometry(lengthM, diameterM) {
  const d = Math.max(diameterM, 0.00035); // specks still need to glitter
  const tipLen = Math.min(lengthM * 0.18, d * 2.2);
  const headH = Math.min(Math.max(d * 0.35, 0.0002), lengthM * 0.15);
  const shaftLen = Math.max(lengthM - tipLen - headH, lengthM * 0.3);
  const shaft = new THREE.CylinderGeometry(d / 2, d / 2, shaftLen, 6);
  shaft.translate(0, -lengthM / 2 + tipLen + shaftLen / 2, 0);
  const tip = new THREE.ConeGeometry(d / 2, tipLen, 6);
  tip.rotateX(Math.PI);
  tip.translate(0, -lengthM / 2 + tipLen / 2, 0);
  const head = new THREE.CylinderGeometry(d * 1.15, d * 1.15, headH, 8);
  head.translate(0, lengthM / 2 - headH / 2, 0);
  const merged = mergeGeometries([shaft.toNonIndexed(), tip.toNonIndexed(), head.toNonIndexed()]);
  shaft.dispose();
  tip.dispose();
  head.dispose();
  merged.computeVertexNormals();
  return merged;
}

/**
 * Build the output for an analysis result.
 * Returns { group, center, radius, height, setProgress(p), dispose() }
 */
export function buildOutput(result, center) {
  const L = result.lengthCm / 100;
  const d = result.diameterMm / 1000;
  const N = result.count;
  const group = new THREE.Group();
  group.position.copy(center);

  const geometry = makeNailGeometry(L, d);
  const material = new THREE.MeshStandardMaterial({
    color: 0xb9bec4,
    metalness: 0.85,
    roughness: 0.3,
    flatShading: true,
  });
  const dummy = new THREE.Object3D();
  let mesh;
  let core = null;
  let radius;
  let height;

  if (N <= ROWS_LIMIT) {
    // Lay them out in neat rows, as for a parade.
    const gapX = Math.max(d * 2.6, 0.004);
    const gapZ = L * 1.12;
    const perRow = Math.max(1, Math.min(N, Math.round(Math.sqrt((N * gapZ) / gapX))));
    const rows = Math.ceil(N / perRow);
    mesh = new THREE.InstancedMesh(geometry, material, N);
    const w = perRow * gapX;
    const depth = rows * gapZ;
    for (let i = 0; i < N; i++) {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      dummy.position.set(-w / 2 + (col + 0.5) * gapX, Math.max(d * 1.15, 0.0003), -depth / 2 + (row + 0.5) * gapZ);
      dummy.rotation.set(Math.PI / 2, 0, (Math.random() - 0.5) * 0.04);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    radius = Math.max(w, depth) / 2;
    height = d * 2.3;
  } else {
    // A heap. Size from the true bulk volume of everything produced.
    const bulkM3 = (N * nailVolumeCm3(result.lengthCm, result.diameterMm)) / 1e6 / PILE_PACKING;
    let r = Math.cbrt((3 * bulkM3) / (Math.PI * PILE_SLOPE));
    r = Math.max(r, L * 0.7);
    const h = r * PILE_SLOPE;
    const K = Math.min(N, MAX_INSTANCES);
    mesh = new THREE.InstancedMesh(geometry, material, K);
    for (let i = 0; i < K; i++) {
      const rho = r * Math.sqrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const y = (r - rho) * PILE_SLOPE + d * 0.5;
      dummy.position.set(Math.cos(theta) * rho, y, Math.sin(theta) * rho);
      dummy.rotation.set(Math.PI / 2 + (Math.random() - 0.5) * 0.9, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.9, 'YXZ');
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    core = new THREE.Mesh(
      new THREE.ConeGeometry(r * 0.98, h * 0.97, 28, 1),
      new THREE.MeshStandardMaterial({ color: 0x5d6168, metalness: 0.7, roughness: 0.45, flatShading: true }),
    );
    core.position.y = (h * 0.97) / 2;
    core.castShadow = core.receiveShadow = true;
    group.add(core);
    radius = r;
    height = h;
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  group.add(mesh);
  const total = mesh.count;

  return {
    group,
    radius,
    height,
    instances: total,
    setProgress(p) {
      const k = Math.max(0, Math.min(1, p));
      if (core) {
        // a heap grows as a whole
        group.scale.setScalar(Math.max(0.0001, Math.cbrt(k)));
        mesh.count = k > 0 ? total : 0;
      } else {
        mesh.count = Math.max(k > 0 ? 1 : 0, Math.floor(total * k));
      }
    },
    dispose() {
      group.removeFromParent();
      geometry.dispose();
      material.dispose();
      mesh.dispose();
      if (core) {
        core.geometry.dispose();
        core.material.dispose();
      }
    },
  };
}
