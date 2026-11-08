// NAIL QUOTA — the Director's control panel (HTML overlay).
import { el, button } from '../../shared/ui.js';
import { CSS, FONTS } from '../../shared/palette.js';
import { LIMITS, analyse, QUOTA_TEXT, planLabel, fmtInt, fmtNum, fmtLength, fmtMass, fmtMeasured } from './rules.js';

const STEPS = 2000;
const toLog = (v, min, max) => Math.round((Math.log(v / min) / Math.log(max / min)) * STEPS);
const fromLog = (t, min, max) => min * Math.pow(max / min, t / STEPS);

function niceRound(v) {
  if (v >= 100) return Math.round(v);
  if (v >= 10) return Math.round(v * 10) / 10;
  if (v >= 1) return Math.round(v * 100) / 100;
  return Math.round(v * 1000) / 1000;
}

/**
 * createPanel(parent, level, { onChange(result), onProduce(result), onSound() })
 * returns { node, result, setEnabled(bool), destroy() }
 */
export function createPanel(parent, level, { onChange, onProduce, onTick }) {
  const q = level.quota;
  const qt = QUOTA_TEXT[q.type];
  const plan = { ...level.start };
  let result = analyse(level, plan);

  const mkSlider = (label, id) => {
    const input = el('input', { type: 'range', min: 0, max: STEPS, step: 1, id, 'aria-label': label });
    const value = el('output.nq-val', { for: id });
    const row = el('div.nq-row', {}, [el('label.nq-lbl', { for: id }, label), value, input]);
    return { input, value, row };
  };

  const len = mkSlider('NAIL LENGTH', 'nq-len');
  const dia = mkSlider('THICKNESS', 'nq-dia');
  const cnt = mkSlider('COUNT', 'nq-cnt');
  const maxBtn = button('MAX', () => {
    plan.count = result.maxCount;
    refresh(true);
  }, { variant: 'small' });
  cnt.row.append(maxBtn);
  let per = null;
  if (q.type === 'crates') per = mkSlider('NAILS PER CRATE', 'nq-per');

  const blueprint = el('canvas.nq-blueprint', { width: 640, height: 260, 'aria-hidden': 'true' });
  const spec = el('div.nq-spec');
  const steelBar = el('div.nq-bar-fill');
  const steelTxt = el('span');
  const pressBar = el('div.nq-bar-fill');
  const pressTxt = el('span');
  const quotaBar = el('div.nq-bar-fill.nq-quota-fill');
  const quotaTxt = el('div.nq-quota-txt');
  const problems = el('div.nq-problems', { role: 'status' });
  const produceBtn = button('▶ START PRODUCTION', () => {
    if (result.ok) onProduce?.(result);
  }, { variant: 'red' });
  produceBtn.classList.add('nq-produce');

  const node = el('aside.nq-panel', { 'aria-label': 'Production controls' }, [
    el('div.nq-quota', {}, [
      el('div.nq-quota-k', {}, 'THE PLAN'),
      el('div.nq-quota-v', {}, planLabel(q)),
      el('div.nq-bar.nq-bar-quota', {}, quotaBar),
      quotaTxt,
    ]),
    el('div.nq-section', {}, [el('div.nq-h', {}, 'BLUEPRINT · ONE NAIL'), blueprint, spec]),
    el('div.nq-section', {}, [len.row, dia.row, cnt.row, per?.row]),
    el('div.nq-section', {}, [
      el('div.nq-res', {}, [el('div.nq-res-l', {}, ['STEEL ', steelTxt]), el('div.nq-bar', {}, steelBar)]),
      el('div.nq-res', {}, [el('div.nq-res-l', {}, ['PRESS ', pressTxt]), el('div.nq-bar', {}, pressBar)]),
    ]),
    problems,
    produceBtn,
  ]);
  parent.append(node);

  const syncInputs = () => {
    len.input.value = toLog(plan.lengthCm, ...LIMITS.lengthCm);
    dia.input.value = toLog(plan.diameterMm, ...LIMITS.diameterMm);
    const maxC = Math.max(1, result.maxCount);
    cnt.input.max = STEPS;
    cnt.input.value = maxC <= 1 ? STEPS : toLog(Math.max(1, plan.count), 1, maxC);
    cnt.input.disabled = result.maxCount < 1;
    if (per) {
      const cap = Math.max(1, result.crateCap);
      per.input.value = cap <= 1 ? STEPS : toLog(Math.max(1, plan.perCrate || 1), 1, cap);
      per.input.disabled = result.crateCap < 1;
    }
  };

  let lastTick = 0;
  const refresh = (fromButton = false) => {
    result = analyse(level, plan);
    // Clamp count to what steel and press time allow, then re-analyse.
    if (plan.count > result.maxCount && result.maxCount >= 1) {
      plan.count = result.maxCount;
      result = analyse(level, plan);
    }
    if (per && result.crateCap && plan.perCrate > result.crateCap) {
      plan.perCrate = result.crateCap;
      result = analyse(level, plan);
    }
    len.value.textContent = fmtLength(plan.lengthCm);
    dia.value.textContent = `${fmtNum(plan.diameterMm)} mm`;
    cnt.value.textContent = fmtInt(plan.count);
    if (per) per.value.textContent = result.crateCap ? `${fmtInt(plan.perCrate)} / ${fmtInt(result.crateCap)}` : 'DOES NOT FIT';

    const steelPct = (result.totalKg / level.steelKg) * 100;
    steelBar.style.width = `${Math.min(100, steelPct)}%`;
    steelBar.classList.toggle('over', steelPct > 100.0001);
    steelTxt.textContent = `${fmtNum(result.totalKg)} / ${fmtInt(level.steelKg)} kg`;
    const pressPct = (result.strikes / level.strikes) * 100;
    pressBar.style.width = `${Math.min(100, pressPct)}%`;
    pressBar.classList.toggle('over', pressPct > 100);
    pressTxt.textContent = `${fmtInt(result.strikes)} / ${level.strikes} strikes`;

    const f = result.fulfilment * 100;
    quotaBar.style.width = `${Math.min(100, f)}%`;
    quotaBar.classList.toggle('met', f >= 99.95);
    quotaBar.classList.toggle('nq-unmeasured', q.type === 'need');
    const lines = [];
    if (q.type === 'need') lines.push('No indicator could be devised. The year will be recorded as fulfilled.');
    else if (result.parts) {
      result.parts.forEach((pt) => lines.push(`${QUOTA_TEXT[pt.type].metric}: ${fmtMeasured(pt.type, pt.measured)} · ${fmtNum(pt.fulfilment * 100)}% of ${fmtMeasured(pt.type, pt.target)}`));
      lines.push(`Averaged: ${fmtNum(f)}% of plan`);
    } else lines.push(`${qt.metric}: ${fmtMeasured(q.type, result.measured)} · ${fmtNum(f)}% of plan`);
    if (result.inspection) lines.push(result.inspection.pass ? 'Inspector\'s nail: recognisably a nail.' : 'Inspector\'s nail: NOT RECOGNISABLY A NAIL. Output will count as scrap.');
    quotaTxt.replaceChildren(...lines.map((t) => el(`div${t.includes('NOT RECOGNISABLY') ? '.nq-warn' : ''}`, {}, t)));

    spec.textContent = `${fmtLength(plan.lengthCm)} × ${fmtNum(plan.diameterMm)} mm · ${fmtMass(result.massG)} each`;
    problems.replaceChildren(...result.problems.map((p) => el('div', {}, p)));
    produceBtn.disabled = !result.ok;
    drawBlueprint(blueprint, plan.lengthCm, plan.diameterMm);
    if (!fromButton) syncInputs();
    else syncInputs();
    const now = performance.now();
    if (now - lastTick > 45) {
      onTick?.();
      lastTick = now;
    }
    onChange?.(result);
  };

  len.input.addEventListener('input', () => {
    plan.lengthCm = niceRound(fromLog(+len.input.value, ...LIMITS.lengthCm));
    refresh();
  });
  dia.input.addEventListener('input', () => {
    plan.diameterMm = niceRound(fromLog(+dia.input.value, ...LIMITS.diameterMm));
    refresh();
  });
  cnt.input.addEventListener('input', () => {
    const maxC = Math.max(1, result.maxCount);
    plan.count = Math.max(1, Math.round(fromLog(+cnt.input.value, 1, maxC)));
    if (+cnt.input.value >= STEPS) plan.count = maxC;
    refresh();
  });
  per?.input.addEventListener('input', () => {
    const cap = Math.max(1, result.crateCap);
    plan.perCrate = Math.max(1, Math.round(fromLog(+per.input.value, 1, cap)));
    refresh();
  });

  refresh();

  return {
    node,
    get result() {
      return result;
    },
    setEnabled(on) {
      node.classList.toggle('nq-locked', !on);
      node.querySelectorAll('input,button').forEach((b) => (b.disabled = !on || (b === produceBtn && !result.ok)));
    },
    destroy() {
      node.remove();
    },
  };
}

/** Draw one nail at scale beside a reference object (ruler or worker). */
function drawBlueprint(canvas, lengthCm, diameterMm) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = '#1f3a5c';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const dCm = diameterMm / 10;
  // reference object
  const refs = [
    { maxCm: 1.2, name: 'MATCH HEAD', cm: 0.5 },
    { maxCm: 4, name: 'COIN, 2 KOP.', cm: 1.8 },
    { maxCm: 40, name: 'CARPENTER\'S HAND', cm: 18 },
    { maxCm: 400, name: 'CARPENTER', cm: 175 },
    { maxCm: Infinity, name: 'CARPENTER', cm: 175 },
  ];
  const ref = refs.find((r) => Math.max(lengthCm, dCm) <= r.maxCm);
  const span = Math.max(lengthCm, ref.cm, dCm) * 1.15;
  const scale = (w - 120) / span; // px per cm
  const cy = h * 0.5;
  const x0 = 50;

  // nail, lying horizontally, head on the left
  const nl = lengthCm * scale;
  const nd = Math.max(1.5, dCm * scale);
  const tip = Math.min(nl * 0.18, nd * 2.2);
  const headW = Math.max(2, Math.min(nl * 0.08, Math.max(nd * 0.35, 3)));
  ctx.fillStyle = '#dfe9f5';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.rect(x0, cy - nd * 1.15, headW, nd * 2.3);
  ctx.moveTo(x0 + headW, cy - nd / 2);
  ctx.lineTo(x0 + nl - tip, cy - nd / 2);
  ctx.lineTo(x0 + nl, cy);
  ctx.lineTo(x0 + nl - tip, cy + nd / 2);
  ctx.lineTo(x0 + headW, cy + nd / 2);
  ctx.closePath();
  ctx.fill();
  // dimension line
  ctx.strokeStyle = CSS.gold;
  ctx.fillStyle = CSS.gold;
  ctx.lineWidth = 2;
  const dimY = Math.min(h - 18, cy + Math.max(nd * 1.2, 10) + 22);
  ctx.beginPath();
  ctx.moveTo(x0, dimY);
  ctx.lineTo(x0 + nl, dimY);
  ctx.moveTo(x0, dimY - 8);
  ctx.lineTo(x0, dimY + 8);
  ctx.moveTo(x0 + nl, dimY - 8);
  ctx.lineTo(x0 + nl, dimY + 8);
  ctx.stroke();
  ctx.font = `600 22px ${FONTS.body}`;
  ctx.textAlign = 'center';
  ctx.fillText(fmtLength(lengthCm), x0 + Math.max(nl / 2, 30), dimY - 8);

  // reference, drawn in cream outline at the right
  const rl = ref.cm * scale;
  const rx = w - 30 - (ref.name === 'CARPENTER' ? 0 : rl);
  ctx.strokeStyle = 'rgba(242,232,213,0.85)';
  ctx.fillStyle = 'rgba(242,232,213,0.2)';
  ctx.lineWidth = 2;
  if (ref.name === 'CARPENTER') {
    // a standing figure, rl tall, at right edge
    const hgt = Math.min(rl, h - 30);
    const fx = w - 50;
    const top = h - 12 - hgt;
    ctx.beginPath();
    ctx.arc(fx, top + hgt * 0.07, hgt * 0.065, 0, Math.PI * 2);
    ctx.rect(fx - hgt * 0.1, top + hgt * 0.15, hgt * 0.2, hgt * 0.4);
    ctx.rect(fx - hgt * 0.09, top + hgt * 0.55, hgt * 0.07, hgt * 0.45);
    ctx.rect(fx + hgt * 0.02, top + hgt * 0.55, hgt * 0.07, hgt * 0.45);
    ctx.fill();
    ctx.stroke();
  } else if (ref.name === 'CARPENTER\'S HAND') {
    const hh = rl * 0.45;
    ctx.beginPath();
    ctx.roundRect(rx, cy - hh / 2 - 34, rl * 0.55, hh, 8);
    for (let i = 0; i < 4; i++) ctx.roundRect(rx + rl * 0.55, cy - hh / 2 - 34 + (i * hh) / 4 + 1, rl * 0.45 - i * rl * 0.04, hh / 4 - 3, 5);
    ctx.fill();
    ctx.stroke();
  } else if (ref.name === 'COIN, 2 KOP.') {
    ctx.beginPath();
    ctx.arc(rx + rl / 2, cy - 30, rl / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.roundRect(rx, cy - 34 - rl * 0.3, rl, rl * 0.6, rl * 0.3);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(242,232,213,0.85)';
  ctx.font = `600 16px ${FONTS.body}`;
  ctx.textAlign = 'right';
  ctx.fillText(`FOR SCALE: ${ref.name}`, w - 14, 22);
  ctx.textAlign = 'left';
  ctx.fillText('DWG. NQ-4 · NOT TO BE QUESTIONED', 14, 22);
}
