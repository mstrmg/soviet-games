// The Fraternal Passport: an HTML booklet with a canvas photograph that is
// retouched a little more on every visit, and one visa stamp per completed wing.
import { el, button } from '../shared/ui.js';
import { CSS } from '../shared/palette.js';
import { WINGS, wingComplete } from '../wings.js';
import { PASSPORT } from './text.js';

const MAX_REV = 10;

/** How retouched the photo is: one step per visit to the Hall, up to MAX_REV. */
export const revisionOf = (save) => Math.min(MAX_REV, Math.max(0, (save.data.hall.visits || 1) - 1));

/**
 * Draw the passport photograph at a given revision.
 * 0 is the citizen as presented: grey, tired, unremarkable. Each revision improves something.
 */
export function drawPhoto(canvas, rev) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const at = (n) => rev >= n;
  ctx.clearRect(0, 0, w, h);

  // background: office grey, then a heroic sky
  if (at(4)) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, at(9) ? '#f6d77a' : '#9fc3dd');
    g.addColorStop(1, at(9) ? '#c1272d' : '#e8eef2');
    ctx.fillStyle = g;
  } else ctx.fillStyle = '#c8c4bb';
  ctx.fillRect(0, 0, w, h);
  if (at(8)) {
    // rays, discreetly
    ctx.save();
    ctx.translate(cx, h * 0.42);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 12; i++) {
      ctx.rotate(Math.PI / 6);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-10, -h);
      ctx.lineTo(10, -h);
      ctx.fill();
    }
    ctx.restore();
  }

  // shoulders: a tired jacket, then a straightened one
  ctx.fillStyle = at(3) ? '#2f3a4a' : '#5b564e';
  ctx.beginPath();
  ctx.moveTo(w * 0.04, h);
  ctx.quadraticCurveTo(cx, h * (at(6) ? 0.6 : 0.64), w * 0.96, h);
  ctx.fill();
  ctx.fillStyle = '#e8e0cc';
  ctx.beginPath();
  ctx.moveTo(cx - 18, h * 0.74);
  ctx.lineTo(cx + 18, h * 0.74);
  ctx.lineTo(cx, h * 0.86);
  ctx.fill();
  if (at(3)) {
    ctx.fillStyle = CSS.red;
    ctx.fillRect(cx - 5, h * 0.76, 10, h * 0.2);
  }

  // head: grey and tired at first; brighter, rosier, firmer of jaw later
  ctx.fillStyle = at(2) ? '#d9b393' : '#b9a594';
  ctx.beginPath();
  if (at(6)) {
    ctx.moveTo(cx - 42, h * 0.28);
    ctx.quadraticCurveTo(cx - 46, h * 0.62, cx - 18, h * 0.66);
    ctx.lineTo(cx + 18, h * 0.66);
    ctx.quadraticCurveTo(cx + 46, h * 0.62, cx + 42, h * 0.28);
    ctx.quadraticCurveTo(cx, h * 0.12, cx - 42, h * 0.28);
  } else ctx.ellipse(cx, h * 0.42, 42, 54, 0, 0, Math.PI * 2);
  ctx.fill();
  if (at(3)) {
    ctx.fillStyle = 'rgba(214,90,80,0.35)';
    for (const sx of [-24, 24]) {
      ctx.beginPath();
      ctx.arc(cx + sx, h * 0.5, 9, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // hair: untidy, then neatly parted
  ctx.fillStyle = '#3a332c';
  ctx.beginPath();
  if (at(6)) {
    ctx.ellipse(cx, h * 0.25, 44, 18, 0, Math.PI, 0);
    ctx.fill();
  } else {
    ctx.ellipse(cx, h * 0.27, 44, 22, 0.08, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(cx + 20, h * 0.2, 6, 14);
  }
  // eyes, with bags that are gradually reassigned
  ctx.fillStyle = '#1f1d1b';
  for (const sx of [-16, 16]) ctx.fillRect(cx + sx - 6, h * 0.4, 12, 5);
  if (at(5)) {
    ctx.fillStyle = '#fff';
    for (const sx of [-16, 16]) ctx.fillRect(cx + sx - 3, h * 0.4, 3, 2);
  }
  if (!at(1)) {
    ctx.strokeStyle = 'rgba(70,50,40,0.6)';
    ctx.lineWidth = 2;
    for (const sx of [-16, 16]) {
      ctx.beginPath();
      ctx.arc(cx + sx, h * 0.445, 7, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
  }
  // brows
  ctx.fillStyle = '#3a332c';
  for (const sx of [-16, 16]) {
    ctx.save();
    ctx.translate(cx + sx, h * 0.36);
    ctx.rotate((at(2) ? -0.12 : 0.15) * Math.sign(sx));
    ctx.fillRect(-9, -2, 18, 4);
    ctx.restore();
  }
  // mouth: a frown, a line, a smile, a beam
  ctx.strokeStyle = '#6a2e26';
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (at(5)) ctx.arc(cx, h * 0.5, 16, 0.2, Math.PI - 0.2);
  else if (at(2)) ctx.arc(cx, h * 0.53, 12, 0.35, Math.PI - 0.35);
  else ctx.arc(cx, h * 0.6, 12, Math.PI + 0.4, -0.4);
  ctx.stroke();

  // decorations, earned in the photograph if not elsewhere
  const medals = at(9) ? 3 : at(7) ? 1 : 0;
  for (let i = 0; i < medals; i++) {
    const mx = cx - 40 + i * 16;
    ctx.fillStyle = CSS.red;
    ctx.fillRect(mx - 4, h * 0.8, 8, 10);
    ctx.fillStyle = CSS.gold;
    ctx.beginPath();
    ctx.arc(mx, h * 0.8 + 16, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  if (at(10)) {
    ctx.fillStyle = 'rgba(193,39,45,0.85)';
    ctx.font = `bold 13px ${'"Oswald", sans-serif'}`;
    ctx.textAlign = 'center';
    ctx.fillText('APPROVED LIKENESS', cx, h - 8);
  }
  // photo grain
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.06})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }
}

function visa(lines, color, { fresh = false, tilt = -8 } = {}) {
  return el(`div.visa${fresh ? '.fresh' : ''}`, { style: `--c:${color}; --tilt:${tilt}deg` }, [el('div.visa-a', {}, lines[0]), el('div.visa-b', {}, lines[1])]);
}

/**
 * Open the passport over the given layer. Returns { node, done }.
 * opts.freshWing: id of a wing whose stamp lands as you watch.
 * opts.issuing: first visit; the Hall stamp lands as you watch.
 */
export function openPassport(layer, save, { freshWing = null, issuing = false } = {}) {
  const d = save.data;
  const no = String(d.hub.citizenNo ?? 417).padStart(6, '0');
  const issued = d.hall.passportIssuedAt ? new Date(d.hall.passportIssuedAt) : new Date();
  const rev = revisionOf(save);
  const photo = el('canvas.pp-photo', { width: 180, height: 220 });
  drawPhoto(photo, rev);
  const fields = PASSPORT.fields({ name: `Citizen No. ${no}`, issued: issued.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) });
  const stamps = [visa(PASSPORT.hallStamp, CSS.ink, { fresh: issuing, tilt: -6 })];
  WINGS.forEach((w, i) => {
    if (wingComplete(save, w)) stamps.push(visa(w.stamp, w.colors.field === '#2a2a2a' ? '#3b5a8a' : w.colors.field, { fresh: freshWing === w.id, tilt: [9, -12, 5][i] }));
    else stamps.push(el('div.visa-empty', {}, PASSPORT.emptySlot));
  });

  let close;
  const done = new Promise((res) => (close = res));
  const node = el('div.memo-wrap.pp-wrap', {}, [
    el('div.passport', { role: 'dialog', 'aria-label': 'Passport' }, [
      el('div.pp-page.pp-left', {}, [
        el('div.pp-head', {}, [el('div.pp-crest', {}, '★'), el('div', {}, [el('div.pp-t1', {}, PASSPORT.cover[0]), el('div.pp-t2', {}, PASSPORT.cover[1])])]),
        el('div.pp-id', {}, [
          el('div.pp-photo-wrap', {}, [photo, el('div.pp-caption', {}, PASSPORT.photoCaption(rev))]),
          el('dl.pp-fields', {}, fields.flatMap(([k, v]) => [el('dt', {}, k), el('dd', {}, v)])),
        ]),
        el('div.pp-mrz', {}, `P<FRA<CITIZEN<<${no}<<<<<<<<<<<<<<<<<<<<<<<<<<`),
      ]),
      el('div.pp-page.pp-right', {}, [el('div.pp-visas-title', {}, PASSPORT.visasTitle), el('div.pp-visas', {}, stamps)]),
      el('div.pp-actions', {}, [button(PASSPORT.close, () => finish(), { variant: 'red' })]),
    ]),
  ]);
  function finish() {
    node.classList.add('memo-out');
    setTimeout(() => node.remove(), 260);
    close();
  }
  layer.append(node);
  return { node, done, close: finish };
}

/** The small passport in the corner of the Hall. */
export function passportBadge(save, onOpen) {
  const photo = el('canvas.ppb-photo', { width: 180, height: 220 });
  drawPhoto(photo, revisionOf(save));
  const n = WINGS.filter((w) => wingComplete(save, w)).length;
  return el('button.pp-badge', { type: 'button', onclick: onOpen, title: 'Your passport' }, [
    photo,
    el('div.ppb-text', {}, [el('div.ppb-t', {}, 'PASSPORT'), el('div.ppb-s', {}, `${n}/${WINGS.length} VISAS`)]),
  ]);
}
