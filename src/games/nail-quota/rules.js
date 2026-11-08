// NAIL QUOTA — the physics of nails and the literal mind of the Ministry.
// Pure functions: no Three.js, no DOM. Easy to test and to extend with new quota types.
import { PEOPLES_NEED } from './levels.js';

export const STEEL_DENSITY = 7.85; // g/cm³
export const DIE_AREA = 2000; // cm² of die plate stamped per press strike
export const CRATE_PACKING = 0.5; // fraction of a crate's volume nails can occupy

export const LIMITS = {
  lengthCm: [0.3, 2000],
  diameterMm: [0.1, 400],
};

/** Mass of one nail in grams. Shaft only; the head is a rounding error the Ministry ignores. */
export function nailMassG(lengthCm, diameterMm) {
  const r = diameterMm / 20; // mm diameter → cm radius
  return Math.PI * r * r * lengthCm * STEEL_DENSITY;
}

export function nailVolumeCm3(lengthCm, diameterMm) {
  const r = diameterMm / 20;
  return Math.PI * r * r * lengthCm;
}

/** Press strikes needed: each strike stamps one die plate's worth of nail footprint. */
export function strikesNeeded(lengthCm, diameterMm, count) {
  return Math.ceil((count * lengthCm * (diameterMm / 10)) / DIE_AREA);
}

/** Could a carpenter use this nail? 2–15 cm long, sensibly thick for its length. */
export function isUsable(lengthCm, diameterMm) {
  if (lengthCm < 2 || lengthCm > 15) return false;
  if (diameterMm < 1.2 || diameterMm > 6) return false;
  const lenMm = lengthCm * 10;
  return diameterMm <= lenMm * 0.08 && diameterMm >= lenMm * 0.012;
}

/** A word for what the factory made. Used for floor remarks and the report. */
export function classify(lengthCm, diameterMm) {
  if (isUsable(lengthCm, diameterMm)) return 'usable';
  if (diameterMm / 10 > lengthCm) return 'disc';
  if (lengthCm > 50 || diameterMm > 25) return 'giant';
  if (lengthCm < 1.5 || diameterMm < 0.6) return lengthCm / (diameterMm / 10) > 150 ? 'wire' : 'specks';
  if (lengthCm / (diameterMm / 10) > 150) return 'wire';
  return 'thick';
}

/** How many nails fit in one crate (by volume and by size). 0 if the nail does not fit at all. */
export function crateCapacity(crate, lengthCm, diameterMm) {
  const diag = Math.hypot(crate.l, crate.w, crate.h);
  if (lengthCm > diag || diameterMm / 10 > Math.min(crate.l, crate.w, crate.h)) return 0;
  return Math.max(1, Math.floor((crate.l * crate.w * crate.h * CRATE_PACKING) / nailVolumeCm3(lengthCm, diameterMm)));
}

/**
 * Work out everything about a production plan.
 * plan = { lengthCm, diameterMm, count, perCrate? }
 */
export function analyse(level, plan) {
  const { lengthCm, diameterMm } = plan;
  const count = Math.max(0, Math.floor(plan.count));
  const massG = nailMassG(lengthCm, diameterMm);
  const totalKg = (massG * count) / 1000;
  const strikes = strikesNeeded(lengthCm, diameterMm, count);
  const totalLengthM = (lengthCm * count) / 100;
  const usable = isUsable(lengthCm, diameterMm) ? count : 0;

  let crates = 0;
  let crateCap = 0;
  if (level.quota.type === 'crates') {
    crateCap = crateCapacity(level.quota.crate, lengthCm, diameterMm);
    const per = Math.max(1, Math.min(plan.perCrate || 1, crateCap || 1));
    crates = crateCap ? Math.ceil(count / per) : 0;
  }

  const maxBySteel = Math.floor((level.steelKg * 1000) / massG);
  const maxByPress = Math.floor((level.strikes * DIE_AREA) / (lengthCm * (diameterMm / 10)));
  const maxCount = Math.max(0, Math.min(maxBySteel, maxByPress));

  const problems = [];
  if (count < 1) problems.push('The Plan requires at least one nail.');
  if (totalKg > level.steelKg + 1e-9) problems.push('Insufficient steel. Request for more steel denied.');
  if (strikes > level.strikes) problems.push('Insufficient press time. The press is booked.');
  if (level.quota.type === 'crates' && !crateCap) problems.push('The nail does not fit in a crate. The crate is standard.');

  const measured = measure(level.quota, { count, totalKg, totalLengthM, crates });

  return {
    lengthCm,
    diameterMm,
    count,
    perCrate: plan.perCrate,
    massG,
    totalKg,
    strikes,
    totalLengthM,
    crates,
    crateCap,
    usable,
    maxCount,
    kind: classify(lengthCm, diameterMm),
    measured,
    fulfilment: measured / level.quota.target,
    ok: problems.length === 0,
    problems,
  };
}

/** The Ministry measures exactly one thing, as written. */
export function measure(quota, p) {
  switch (quota.type) {
    case 'weight':
      return p.totalKg;
    case 'count':
      return p.count;
    case 'length':
      return p.totalLengthM;
    case 'crates':
      return p.crates;
    default:
      return 0;
  }
}

export const QUOTA_TEXT = {
  weight: { metric: 'Total weight', unit: 'kg', short: 'KG OF NAILS' },
  count: { metric: 'Nails counted', unit: 'nails', short: 'NAILS' },
  length: { metric: 'Length end to end', unit: 'm', short: 'METRES OF NAIL' },
  crates: { metric: 'Crates shipped', unit: 'crates', short: 'CRATES OF NAILS' },
};

export function verdict(fulfilment) {
  if (fulfilment >= 1.5) return { stamp: 'HEROICALLY OVERFULFILLED', grade: 3, label: 'Hero of Fasteners' };
  if (fulfilment >= 1.1) return { stamp: 'OVERFULFILLED', grade: 2, label: 'Overfulfilled' };
  if (fulfilment >= 0.9995) return { stamp: 'PLAN FULFILLED', grade: 1, label: 'Fulfilled' };
  return { stamp: 'UNDERFULFILLED', grade: 0, label: 'Reprimand' };
}

/** Citizen satisfaction for one year: usable nails against what people needed. 0..1 */
export function satisfaction(result) {
  return Math.min(1, result.usable / PEOPLES_NEED);
}

// ---- number formatting -----------------------------------------------------
const nf = new Intl.NumberFormat('en-GB');
export function fmtInt(n) {
  return nf.format(Math.round(n));
}
export function fmtNum(n, digits = 1) {
  if (!isFinite(n)) return '∞';
  if (Math.abs(n) >= 1000) return fmtInt(n);
  if (Math.abs(n) >= 100) return n.toFixed(0);
  if (Math.abs(n) >= 10) return n.toFixed(Math.min(digits, 1));
  return n.toFixed(Math.max(digits, 2)).replace(/\.?0+$/, '') || '0';
}
export function fmtLength(cm) {
  if (cm >= 100) return `${fmtNum(cm / 100)} m`;
  if (cm < 1) return `${fmtNum(cm * 10)} mm`;
  return `${fmtNum(cm)} cm`;
}
export function fmtMass(g) {
  if (g >= 1e6) return `${fmtNum(g / 1e6)} t`;
  if (g >= 1000) return `${fmtNum(g / 1000)} kg`;
  if (g < 0.01) return `${fmtNum(g * 1000)} mg`;
  return `${fmtNum(g)} g`;
}
export function fmtMeasured(type, v) {
  if (type === 'weight') return `${fmtNum(v)} kg`;
  if (type === 'length') return v >= 1000 ? `${fmtNum(v / 1000)} km` : `${fmtNum(v)} m`;
  if (type === 'count') return `${fmtInt(v)} nails`;
  if (type === 'crates') return `${fmtInt(v)} crates`;
  return String(v);
}
