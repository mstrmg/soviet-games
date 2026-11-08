import * as THREE from 'three';

// Draw into a 2D canvas and return it as a texture. Used for posters, signs,
// plaster, floors... the Ministry has no budget for image files.
export function canvasTexture(width, height, draw, { repeat, anisotropy = 4 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  draw(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  return tex;
}

/** Seeded PRNG so procedural textures look the same on every visit. */
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Speckle a canvas region with noise for a printed / plaster feel. */
export function speckle(ctx, w, h, amount = 0.08, rand = Math.random, density = 0.015) {
  const n = Math.floor(w * h * density);
  for (let i = 0; i < n; i++) {
    const a = rand() * amount;
    ctx.fillStyle = rand() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`;
    ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1 + rand() * 2);
  }
}

/** Fit uppercase text to a width by shrinking the font size. */
export function fitText(ctx, text, maxWidth, size, family, weight = '') {
  let s = size;
  do {
    ctx.font = `${weight} ${s}px ${family}`.trim();
    if (ctx.measureText(text).width <= maxWidth) break;
    s -= 2;
  } while (s > 8);
  return s;
}
