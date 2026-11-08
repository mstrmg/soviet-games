// Walks an object graph and disposes every geometry, material and texture it finds.
// Shared resources are disposed once (dispose() is idempotent in Three.js anyway).
export function disposeObject3D(root) {
  if (!root) return;
  const seen = new Set();
  const disposeTexture = (tex) => {
    if (tex && tex.isTexture && !seen.has(tex)) {
      seen.add(tex);
      tex.dispose();
    }
  };
  const disposeMaterial = (mat) => {
    if (!mat || seen.has(mat)) return;
    seen.add(mat);
    for (const key of Object.keys(mat)) {
      const value = mat[key];
      if (value && value.isTexture) disposeTexture(value);
    }
    if (mat.uniforms) {
      for (const u of Object.values(mat.uniforms)) {
        if (u && u.value && u.value.isTexture) disposeTexture(u.value);
      }
    }
    mat.dispose();
  };

  root.traverse((obj) => {
    if (obj.geometry && !seen.has(obj.geometry)) {
      seen.add(obj.geometry);
      obj.geometry.dispose();
    }
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach(disposeMaterial);
      else disposeMaterial(obj.material);
    }
    if (obj.isInstancedMesh) obj.dispose();
    if (obj.isLight && obj.shadow && obj.shadow.map) {
      obj.shadow.map.dispose();
      obj.shadow.map = null;
    }
  });

  if (root.isScene) {
    disposeTexture(root.background);
    disposeTexture(root.environment);
  }
  root.clear();
}
