// Procedural textures for the Ministry lobby, all drawn on <canvas>.
import { canvasTexture, rng, speckle, fitText } from '../shared/canvasTexture.js';
import { CSS, FONTS } from '../shared/palette.js';

const C = CSS;

function crack(ctx, x, y, len, rand, width = 1.5) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  let a = rand() * Math.PI * 2;
  for (let i = 0; i < len; i++) {
    a += (rand() - 0.5) * 0.9;
    x += Math.cos(a) * 6;
    y += Math.sin(a) * 6;
    ctx.lineTo(x, y);
    if (rand() < 0.08) crack(ctx, x, y, len * 0.3, rand, width * 0.6);
  }
  ctx.lineWidth = width;
  ctx.stroke();
}

/** Plaster wall: tired cream above, grey wainscot below, stains and cracks. */
export function plasterTexture(seed = 7) {
  return canvasTexture(1024, 400, (ctx, w, h) => {
    const r = rng(seed);
    const split = h * 0.68;
    ctx.fillStyle = '#d9cfbb';
    ctx.fillRect(0, 0, w, split);
    // mottling
    for (let i = 0; i < 140; i++) {
      const x = r() * w;
      const y = r() * split;
      const rad = 20 + r() * 90;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      const dark = r() < 0.6;
      g.addColorStop(0, dark ? 'rgba(90,70,40,0.10)' : 'rgba(255,250,235,0.12)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    // water stains running down from the top
    for (let i = 0; i < 6; i++) {
      const x = r() * w;
      const wid = 30 + r() * 80;
      const len = 60 + r() * 160;
      const g = ctx.createLinearGradient(0, 0, 0, len);
      g.addColorStop(0, 'rgba(110,85,45,0.28)');
      g.addColorStop(1, 'rgba(110,85,45,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, wid, len);
    }
    speckle(ctx, w, split, 0.12, r, 0.03);
    // wainscot
    ctx.fillStyle = '#56534d';
    ctx.fillRect(0, split, w, h - split);
    ctx.fillStyle = C.red;
    ctx.fillRect(0, split - 8, w, 8);
    ctx.fillStyle = '#2a2826';
    ctx.fillRect(0, split, w, 3);
    speckle(ctx, w, h, 0.1, r, 0.02);
    // cracks
    ctx.strokeStyle = 'rgba(40,30,20,0.55)';
    for (let i = 0; i < 9; i++) crack(ctx, r() * w, r() * split, 10 + r() * 25, r);
    // chipped plaster showing brick
    for (let i = 0; i < 4; i++) {
      const x = r() * (w - 80);
      const y = r() * (split - 60);
      ctx.fillStyle = '#9c6a4f';
      ctx.beginPath();
      ctx.ellipse(x, y, 18 + r() * 26, 10 + r() * 14, r(), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(60,40,30,0.6)';
      ctx.lineWidth = 1;
      for (let k = -2; k <= 2; k++) {
        ctx.beginPath();
        ctx.moveTo(x - 30, y + k * 7);
        ctx.lineTo(x + 30, y + k * 7);
        ctx.stroke();
      }
    }
  });
}

/** Checkerboard marble floor with missing and cracked tiles. 1 tile = 1 metre. */
export function floorTexture(tilesX, tilesY, seed = 3) {
  const px = 40;
  return canvasTexture(tilesX * px, tilesY * px, (ctx, w, h) => {
    const r = rng(seed);
    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        const light = (x + y) % 2 === 0;
        const v = Math.floor(r() * 14);
        ctx.fillStyle = light ? `rgb(${222 - v},${212 - v},${190 - v})` : `rgb(${58 + v},${55 + v},${52 + v})`;
        ctx.fillRect(x * px, y * px, px, px);
        if (r() < 0.04) {
          // missing tile: bare screed
          ctx.fillStyle = '#6d665a';
          ctx.fillRect(x * px + 2, y * px + 2, px - 4, px - 4);
          speckle(ctx, px, px, 0.3, r, 0.2);
        }
      }
    }
    // grout
    ctx.strokeStyle = 'rgba(20,18,15,0.35)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= tilesX; x++) {
      ctx.beginPath();
      ctx.moveTo(x * px, 0);
      ctx.lineTo(x * px, h);
      ctx.stroke();
    }
    for (let y = 0; y <= tilesY; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * px);
      ctx.lineTo(w, y * px);
      ctx.stroke();
    }
    // red runner carpet down the middle, worn
    const cx = w / 2;
    ctx.fillStyle = C.redDark;
    ctx.fillRect(cx - 2.2 * px, 0, 4.4 * px, h);
    ctx.fillStyle = 'rgba(212,167,44,0.8)';
    ctx.fillRect(cx - 2.0 * px, 0, 4, h);
    ctx.fillRect(cx + 2.0 * px - 4, 0, 4, h);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(30,20,15,${0.1 + r() * 0.2})`;
      ctx.beginPath();
      ctx.ellipse(cx + (r() - 0.5) * 3 * px, r() * h, 10 + r() * 25, 6 + r() * 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    speckle(ctx, w, h, 0.12, r, 0.02);
    ctx.strokeStyle = 'rgba(15,10,5,0.5)';
    for (let i = 0; i < 14; i++) crack(ctx, r() * w, r() * h, 6 + r() * 14, r, 1.2);
  });
}

/** Propaganda poster for a department door. */
export function posterTexture(dept) {
  return canvasTexture(512, 704, (ctx, w, h) => {
    const r = rng(dept.number * 101);
    ctx.fillStyle = C.cream;
    ctx.fillRect(0, 0, w, h);
    const motif = dept.poster.motif;

    if (motif === 'nail') {
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.62);
      ctx.lineTo(w, h * 0.24);
      ctx.lineTo(w, h * 0.46);
      ctx.lineTo(0, h * 0.84);
      ctx.fill();
      ctx.fillStyle = C.black;
      ctx.beginPath();
      ctx.arc(w * 0.74, h * 0.3, 92, 0, Math.PI * 2);
      ctx.fill();
      // the giant nail
      ctx.save();
      ctx.translate(w * 0.46, h * 0.5);
      ctx.rotate(-0.62);
      ctx.fillStyle = C.black;
      ctx.fillRect(-90, -205, 180, 30);
      ctx.fillRect(-20, -180, 40, 330);
      ctx.beginPath();
      ctx.moveTo(-20, 150);
      ctx.lineTo(20, 150);
      ctx.lineTo(0, 215);
      ctx.fill();
      ctx.fillStyle = C.cream;
      ctx.fillRect(-12, -170, 6, 300);
      ctx.restore();
      // a scattering of tiny useless pins
      ctx.strokeStyle = C.black;
      ctx.lineWidth = 2;
      for (let i = 0; i < 46; i++) {
        const x = 30 + r() * 170;
        const y = h * 0.66 + r() * 60;
        const a = r() * Math.PI;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9);
        ctx.stroke();
      }
    } else if (motif === 'megaphone') {
      ctx.fillStyle = C.black;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, 0);
      ctx.lineTo(w, h * 0.14);
      ctx.lineTo(0, h * 0.62);
      ctx.fill();
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.arc(w * 0.62, h * 0.42, 150, 0, Math.PI * 2);
      ctx.fill();
      // megaphone pointing up-right, speaking rays
      ctx.save();
      ctx.translate(w * 0.38, h * 0.58);
      ctx.rotate(-0.7);
      ctx.fillStyle = C.black;
      ctx.beginPath();
      ctx.moveTo(-40, -22);
      ctx.lineTo(150, -90);
      ctx.lineTo(150, 90);
      ctx.lineTo(-40, 22);
      ctx.fill();
      ctx.fillRect(-90, -16, 55, 32);
      ctx.fillStyle = C.cream;
      ctx.fillRect(140, -90, 14, 180);
      ctx.strokeStyle = C.black;
      ctx.lineWidth = 10;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(180, i * 40);
        ctx.lineTo(260, i * 70);
        ctx.stroke();
      }
      ctx.restore();
      // stacked newspapers
      ctx.fillStyle = C.cream;
      ctx.strokeStyle = C.black;
      ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(40 + i * 6, h * 0.66 - i * 14, 150, 70);
        ctx.strokeRect(40 + i * 6, h * 0.66 - i * 14, 150, 70);
      }
      ctx.fillStyle = C.black;
      ctx.font = `30px ${FONTS.display}`;
      ctx.fillText('TRUTH', 70, h * 0.66 - 14);
    } else if (motif === 'village') {
      // red sky, rising sun
      ctx.fillStyle = C.red;
      ctx.fillRect(0, 0, w, h * 0.62);
      ctx.fillStyle = C.cream;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, 120, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = C.cream;
      ctx.lineWidth = 8;
      for (let i = 0; i < 9; i++) {
        const a = Math.PI + (i + 0.5) * (Math.PI / 9);
        ctx.beginPath();
        ctx.moveTo(w * 0.5 + Math.cos(a) * 140, h * 0.5 + Math.sin(a) * 140);
        ctx.lineTo(w * 0.5 + Math.cos(a) * 240, h * 0.5 + Math.sin(a) * 240);
        ctx.stroke();
      }
      // ruins behind (barely visible), props holding up facades
      ctx.fillStyle = '#5a1418';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(30 + i * 120, h * 0.62);
        ctx.lineTo(60 + i * 120, h * 0.45);
        ctx.lineTo(110 + i * 120, h * 0.5);
        ctx.lineTo(120 + i * 120, h * 0.62);
        ctx.fill();
      }
      // cheerful facades
      for (let i = 0; i < 4; i++) {
        const x = 18 + i * 122;
        const y = h * 0.52;
        ctx.fillStyle = C.cream;
        ctx.fillRect(x, y, 100, 80);
        ctx.fillStyle = C.black;
        ctx.beginPath();
        ctx.moveTo(x - 6, y);
        ctx.lineTo(x + 50, y - 46);
        ctx.lineTo(x + 106, y);
        ctx.fill();
        ctx.fillStyle = C.red;
        ctx.fillRect(x + 14, y + 18, 24, 24);
        ctx.fillRect(x + 62, y + 18, 24, 24);
      }
      ctx.fillStyle = C.black;
      ctx.fillRect(0, h * 0.62, w, h * 0.2);
      // the inspector's car
      ctx.fillStyle = C.cream;
      ctx.fillRect(w * 0.3, h * 0.68, 200, 34);
      ctx.fillRect(w * 0.38, h * 0.65, 110, 24);
      ctx.fillStyle = C.black;
      ctx.beginPath();
      ctx.arc(w * 0.38, h * 0.74, 14, 0, Math.PI * 2);
      ctx.arc(w * 0.66, h * 0.74, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    // slogan
    ctx.save();
    ctx.translate(30, motif === 'village' ? 120 : motif === 'megaphone' ? 110 : 120);
    ctx.rotate(motif === 'megaphone' ? -0.08 : -0.1);
    const s = fitText(ctx, dept.poster.slogan, w - 70, 118, FONTS.display);
    ctx.font = `${s}px ${FONTS.display}`;
    ctx.fillStyle = motif === 'nail' ? C.black : C.cream;
    ctx.fillText(dept.poster.slogan, 0, 0);
    ctx.font = `600 26px ${FONTS.body}`;
    ctx.fillStyle = motif === 'nail' ? C.red : motif === 'village' ? C.black : C.cream;
    ctx.fillText(dept.poster.sub, 4, 38);
    ctx.restore();

    // title band
    ctx.fillStyle = C.black;
    ctx.fillRect(0, h * 0.82, w, h * 0.18);
    ctx.fillStyle = C.red;
    ctx.fillRect(0, h * 0.82, 90, h * 0.18);
    ctx.fillStyle = C.cream;
    ctx.font = `92px ${FONTS.display}`;
    ctx.fillText(String(dept.number), 26, h * 0.82 + 98);
    const ts = fitText(ctx, dept.title, w - 130, 84, FONTS.display);
    ctx.font = `${ts}px ${FONTS.display}`;
    ctx.fillText(dept.title, 110, h * 0.82 + 88);
    ctx.font = `400 18px ${FONTS.body}`;
    ctx.fillStyle = C.greyLight;
    ctx.fillText(dept.dept.toUpperCase(), 112, h * 0.82 + 112);

    // print wear
    speckle(ctx, w, h, 0.18, r, 0.03);
    ctx.fillStyle = 'rgba(120,90,40,0.12)';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    // a torn corner
    ctx.fillStyle = '#d9cfbb';
    ctx.beginPath();
    ctx.moveTo(w, h);
    ctx.lineTo(w - 46, h);
    ctx.lineTo(w - 20, h - 22);
    ctx.lineTo(w, h - 60);
    ctx.fill();
  });
}

/** Portrait of the Minister. He does not smile. He has never smiled. */
export function portraitTexture() {
  return canvasTexture(384, 480, (ctx, w, h) => {
    const r = rng(1917);
    const bg = ctx.createRadialGradient(w / 2, h * 0.35, 30, w / 2, h * 0.4, 300);
    bg.addColorStop(0, '#5d6152');
    bg.addColorStop(1, '#262822');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    // shoulders / suit
    ctx.fillStyle = '#1f1e1c';
    ctx.beginPath();
    ctx.moveTo(20, h);
    ctx.lineTo(40, h * 0.72);
    ctx.quadraticCurveTo(w / 2, h * 0.58, w - 40, h * 0.72);
    ctx.lineTo(w - 20, h);
    ctx.fill();
    // shirt and tie
    ctx.fillStyle = '#e8e0cc';
    ctx.beginPath();
    ctx.moveTo(w / 2 - 40, h * 0.66);
    ctx.lineTo(w / 2 + 40, h * 0.66);
    ctx.lineTo(w / 2, h * 0.86);
    ctx.fill();
    ctx.fillStyle = C.red;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 12, h * 0.68);
    ctx.lineTo(w / 2 + 12, h * 0.68);
    ctx.lineTo(w / 2 + 16, h * 0.9);
    ctx.lineTo(w / 2, h * 0.95);
    ctx.lineTo(w / 2 - 16, h * 0.9);
    ctx.fill();
    // medals, many
    const medalCols = ['#d4a72c', '#c1272d', '#b9b4aa', '#d4a72c'];
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = medalCols[(i + row) % 4];
        ctx.fillRect(w * 0.6 + i * 20, h * 0.74 + row * 22, 16, 9);
        ctx.beginPath();
        ctx.arc(w * 0.6 + 8 + i * 20, h * 0.74 + 16 + row * 22, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // neck & head
    ctx.fillStyle = '#b8957a';
    ctx.fillRect(w / 2 - 32, h * 0.52, 64, 70);
    ctx.fillStyle = '#c9a587';
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.38, 86, 110, 0, 0, Math.PI * 2);
    ctx.fill();
    // jowls shading
    ctx.fillStyle = 'rgba(80,50,30,0.25)';
    ctx.beginPath();
    ctx.ellipse(w / 2 + 40, h * 0.44, 40, 70, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // hair, swept back and grey
    ctx.fillStyle = '#8c8a84';
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.23, 90, 52, 0, Math.PI, 0);
    ctx.fill();
    // brows: heavy, disapproving
    ctx.fillStyle = '#3a3632';
    ctx.save();
    ctx.translate(w / 2 - 38, h * 0.33);
    ctx.rotate(0.18);
    ctx.fillRect(-30, -9, 60, 18);
    ctx.restore();
    ctx.save();
    ctx.translate(w / 2 + 38, h * 0.33);
    ctx.rotate(-0.18);
    ctx.fillRect(-30, -9, 60, 18);
    ctx.restore();
    // eyes
    ctx.fillStyle = '#1b1a18';
    ctx.fillRect(w / 2 - 50, h * 0.365, 26, 8);
    ctx.fillRect(w / 2 + 24, h * 0.365, 26, 8);
    // nose
    ctx.fillStyle = 'rgba(90,60,40,0.45)';
    ctx.beginPath();
    ctx.moveTo(w / 2 - 4, h * 0.38);
    ctx.lineTo(w / 2 - 18, h * 0.47);
    ctx.lineTo(w / 2 + 10, h * 0.47);
    ctx.fill();
    // moustache
    ctx.fillStyle = '#4a4540';
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.5, 46, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // mouth: a line
    ctx.fillStyle = '#5a2e26';
    ctx.fillRect(w / 2 - 22, h * 0.53, 44, 4);
    speckle(ctx, w, h, 0.15, r, 0.04);
    // varnish
    ctx.fillStyle = 'rgba(140,100,30,0.12)';
    ctx.fillRect(0, 0, w, h);
  });
}

/** Clock face. Reliable to within one Five-Year Plan. */
export function clockFaceTexture() {
  return canvasTexture(256, 256, (ctx, w) => {
    const c = w / 2;
    ctx.fillStyle = C.cream;
    ctx.beginPath();
    ctx.arc(c, c, c - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.black;
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.fillStyle = C.black;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `30px ${FONTS.display}`;
    for (let i = 1; i <= 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      ctx.fillText(String(i), c + Math.cos(a) * 96, c + Math.sin(a) * 96);
    }
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const len = i % 5 === 0 ? 12 : 5;
      ctx.lineWidth = i % 5 === 0 ? 3 : 1;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a) * (120 - len), c + Math.sin(a) * (120 - len));
      ctx.lineTo(c + Math.cos(a) * 120, c + Math.sin(a) * 120);
      ctx.stroke();
    }
    ctx.fillStyle = C.red;
    ctx.font = `600 13px ${FONTS.body}`;
    ctx.fillText('AHEAD OF PLAN', c, c + 44);
    ctx.fillStyle = C.black;
    ctx.font = `16px ${FONTS.display}`;
    ctx.fillText('MINISTRY TIME', c, c - 44);
  });
}

/** A painted sign: background colour, lines of text. */
export function signTexture(lines, { width = 512, height = 128, bg = C.black, fg = C.cream, accent = C.red, border = true } = {}) {
  return canvasTexture(width, height, (ctx, w, h) => {
    const r = rng(lines.join('').length * 31);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    if (border) {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, w - 12, h - 12);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const n = lines.length;
    lines.forEach((line, i) => {
      const big = i === 0;
      const size = big ? Math.min(h / (n + 0.3), 90) : Math.min(h / (n + 1.5), 34);
      const fam = big ? FONTS.display : FONTS.body;
      const s = fitText(ctx, line, w - 40, size, fam, big ? '' : '600');
      ctx.font = `${big ? '' : '600 '}${s}px ${fam}`;
      ctx.fillStyle = big ? fg : accent;
      const y = n === 1 ? h / 2 : h * ((i + 0.75) / (n + 0.4)) + (big ? 4 : 0);
      ctx.fillText(line, w / 2, y);
    });
    speckle(ctx, w, h, 0.15, r, 0.02);
  });
}

/** Long red cloth banner. */
export function bannerTexture(text) {
  return canvasTexture(2048, 128, (ctx, w, h) => {
    const r = rng(42);
    ctx.fillStyle = C.red;
    ctx.fillRect(0, 0, w, h);
    // folds
    for (let x = 0; x < w; x += 128) {
      const g = ctx.createLinearGradient(x, 0, x + 128, 0);
      g.addColorStop(0, 'rgba(0,0,0,0.18)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.05)');
      g.addColorStop(1, 'rgba(0,0,0,0.18)');
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, 128, h);
    }
    ctx.fillStyle = C.cream;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const s = fitText(ctx, text, w - 80, 92, FONTS.display);
    ctx.font = `${s}px ${FONTS.display}`;
    ctx.fillText(text, w / 2, h / 2 + 6);
    speckle(ctx, w, h, 0.1, r, 0.01);
  });
}

// ---- Live textures: drawn once, redrawn when the lobby's records change ----------

/** A canvas texture you can redraw: returns { texture, draw(fn) }. */
export function liveTexture(width, height) {
  const texture = canvasTexture(width, height, () => {});
  const canvas = texture.image;
  return {
    texture,
    draw(fn) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, width, height);
      fn(ctx, width, height);
      texture.needsUpdate = true;
    },
  };
}

/** Painted number card for the queue stand. */
export function drawQueueCard(ctx, w, h, { title, number, foot }) {
  const r = rng(number);
  ctx.fillStyle = C.cream;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = C.black;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, w - 16, h - 16);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = C.red;
  ctx.font = `600 ${fitText(ctx, title, w - 60, 30, FONTS.body, '600')}px ${FONTS.body}`;
  ctx.fillText(title, w / 2, h * 0.2);
  ctx.fillStyle = C.black;
  ctx.font = `${fitText(ctx, number, w - 50, 120, FONTS.display)}px ${FONTS.display}`;
  ctx.fillText(number, w / 2, h * 0.56);
  ctx.fillStyle = C.grey;
  ctx.font = `600 ${fitText(ctx, foot, w - 60, 20, FONTS.body, '600')}px ${FONTS.body}`;
  ctx.fillText(foot, w / 2, h * 0.86);
  speckle(ctx, w, h, 0.12, r, 0.02);
}

/** Brass plate under the clock. */
export function drawClockPlate(ctx, w, h, lines) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#c9a24a');
  g.addColorStop(0.5, '#e2c06a');
  g.addColorStop(1, '#9c7a2e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(60,40,10,0.6)';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, w - 12, h - 12);
  for (const [x, y] of [[18, 18], [w - 18, 18], [18, h - 18], [w - 18, h - 18]]) {
    ctx.fillStyle = '#6b5420';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2a1e08';
  ctx.font = `600 ${fitText(ctx, lines[0], w - 60, 24, FONTS.body, '600')}px ${FONTS.body}`;
  ctx.fillText(lines[0], w / 2, h * 0.32);
  ctx.font = `${fitText(ctx, lines[1], w - 60, 46, FONTS.display)}px ${FONTS.display}`;
  ctx.fillText(lines[1], w / 2, h * 0.68);
}

/** Layout of the honours board, shared by the drawing and the spotlight. */
export const BOARD_LAYOUT = { w: 1024, h: 1200, cols: 4, rows: 3, top: 210, pad: 34, gap: 22 };

export function boardCell(k) {
  const L = BOARD_LAYOUT;
  const cw = (L.w - L.pad * 2 - L.gap * (L.cols - 1)) / L.cols;
  const ch = (L.h - L.top - L.pad - L.gap * (L.rows - 1)) / L.rows;
  const col = k % L.cols;
  const row = Math.floor(k / L.cols);
  return { x: L.pad + col * (cw + L.gap), y: L.top + row * (ch + L.gap), w: cw, h: ch };
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function sitter(ctx, x, y, w, h, r) {
  // background
  const bgs = ['#5d6152', '#5a4e44', '#4b5560', '#615a46'];
  ctx.fillStyle = bgs[Math.floor(r() * bgs.length)];
  ctx.fillRect(x, y, w, h);
  const cx = x + w / 2;
  // shoulders
  ctx.fillStyle = ['#2b2a27', '#3d3a36', '#4a4238', '#2f3236'][Math.floor(r() * 4)];
  ctx.beginPath();
  ctx.moveTo(x + w * 0.08, y + h);
  ctx.quadraticCurveTo(cx, y + h * 0.5, x + w * 0.92, y + h);
  ctx.fill();
  // head
  ctx.fillStyle = ['#c9a587', '#b48c6e', '#d6b597'][Math.floor(r() * 3)];
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 0.42, w * 0.17, h * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  // headwear, or hair
  const hat = r();
  ctx.fillStyle = hat < 0.35 ? '#5a4a3c' : hat < 0.6 ? C.red : '#2a2522';
  if (hat < 0.35) ctx.fillRect(cx - w * 0.21, y + h * 0.17, w * 0.42, h * 0.12);
  else if (hat < 0.6) {
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.2, y + h * 0.36);
    ctx.quadraticCurveTo(cx, y + h * 0.08, cx + w * 0.2, y + h * 0.36);
    ctx.fill();
  } else ctx.fillRect(cx - w * 0.16, y + h * 0.2, w * 0.32, h * 0.07);
  // one medal
  ctx.fillStyle = C.gold;
  ctx.beginPath();
  ctx.arc(cx - w * 0.2, y + h * 0.84, w * 0.05, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * The Heroes of Labour board: title, then 4 × 3 frames, newest first.
 * entries: [{ kind, at, label, medal }]
 */
export function drawHonourBoard(ctx, w, h, entries, text, citizenNo) {
  const r = rng(77);
  // board: red cloth panel in a wooden frame
  ctx.fillStyle = '#3a2418';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C.redDark;
  ctx.fillRect(18, 18, w - 36, h - 36);
  speckle(ctx, w, h, 0.1, r, 0.03);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = C.gold;
  ctx.font = `${fitText(ctx, text.title, w - 120, 110, FONTS.display)}px ${FONTS.display}`;
  ctx.fillText(text.title, w / 2, 92);
  ctx.font = `600 34px ${FONTS.body}`;
  ctx.fillText(`★  ${text.subtitle}  ★`, w / 2, 166);

  for (let k = 0; k < BOARD_LAYOUT.cols * BOARD_LAYOUT.rows; k++) {
    const c = boardCell(k);
    const e = entries[k];
    // gilt frame
    ctx.fillStyle = '#b08d3c';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = '#7a5f22';
    ctx.fillRect(c.x + 8, c.y + 8, c.w - 16, c.h - 16);
    const px = c.x + 14;
    const py = c.y + 14;
    const pw = c.w - 28;
    const ph = c.h * 0.56;
    const capY = py + ph + 8;
    ctx.fillStyle = C.cream;
    ctx.fillRect(px, capY, pw, c.h - (capY - c.y) - 14);
    const lines = [];
    if (!e) {
      ctx.fillStyle = '#4a1014';
      ctx.fillRect(px, py, pw, ph);
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = C.grey;
      ctx.font = `600 ${fitText(ctx, text.pending, pw - 10, 22, FONTS.body, '600')}px ${FONTS.body}`;
      ctx.fillText(text.pending, c.x + c.w / 2, capY + 45);
      ctx.restore();
      continue;
    }
    const er = rng(hashStr(e.at + e.label));
    const date = new Date(e.at);
    const dateStr = isNaN(date) ? '' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    if (e.kind === 'hero') {
      sitter(ctx, px, py, pw, ph, er);
      lines.push([e.medal || 'Hero of Labour', `600 20px ${FONTS.body}`, C.red]);
      lines.push([text.citizen(citizenNo), `16px ${FONTS.type}`, C.black]);
      lines.push([e.label, `16px ${FONTS.type}`, C.black]);
      lines.push([dateStr, `15px ${FONTS.type}`, C.grey]);
    } else {
      // a cleaner rectangle of paint where a picture used to hang
      ctx.fillStyle = '#4a1014';
      ctx.fillRect(px, py, pw, ph);
      ctx.fillStyle = '#9c2f33';
      ctx.fillRect(px + pw * 0.1, py + ph * 0.08, pw * 0.8, ph * 0.84);
      ctx.fillStyle = '#2a1e18';
      ctx.beginPath();
      ctx.arc(px + pw / 2, py + ph * 0.05, 3, 0, Math.PI * 2);
      ctx.fill();
      // the caption, painted over
      ctx.fillStyle = '#d8ccb4';
      for (let i = 0; i < 3; i++) ctx.fillRect(px + 8, capY + 7 + i * 22, pw - 16 - er() * 30, 14);
      lines.push(['', '', '']);
      lines.push(['', '', '']);
      lines.push(['', '', '']);
      lines.push([dateStr, `15px ${FONTS.type}`, C.grey]);
      // stamp
      ctx.save();
      ctx.translate(px + pw / 2, py + ph * 0.5);
      ctx.rotate(-0.25);
      ctx.strokeStyle = C.cream;
      ctx.fillStyle = C.cream;
      ctx.lineWidth = 4;
      ctx.font = `${fitText(ctx, text.removed, pw * 0.8, 44, FONTS.display)}px ${FONTS.display}`;
      const tw = ctx.measureText(text.removed).width;
      ctx.strokeRect(-tw / 2 - 10, -26, tw + 20, 50);
      ctx.fillText(text.removed, 0, 2);
      ctx.restore();
    }
    lines.forEach(([str, font, col], i) => {
      if (!str) return;
      ctx.font = font;
      const size = Number(font.match(/(\d+)px/)[1]);
      const fam = font.split('px ')[1];
      const weight = font.startsWith('600') ? '600' : '';
      ctx.font = `${weight ? weight + ' ' : ''}${fitText(ctx, str, pw - 12, size, fam, weight)}px ${fam}`;
      ctx.fillStyle = col;
      ctx.fillText(str, c.x + c.w / 2, capY + 14 + i * 22);
    });
  }
}
