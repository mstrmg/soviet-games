// NAIL QUOTA — the Five-Year Report. Official columns first; the truth is classified.
import { el, button } from '../../shared/ui.js';
import { audio } from '../../shared/audio.js';
import { fmtInt, fmtNum, fmtMeasured, fmtLength, QUOTA_TEXT } from './rules.js';
import { PEOPLES_NEED } from './levels.js';

export function scores(results) {
  const official = results.reduce((s, r) => s + r.fulfilment, 0) / Math.max(1, results.length);
  const citizens = results.reduce((s, r) => s + r.satisfaction, 0) / Math.max(1, results.length);
  return { official: official * 100, citizens: citizens * 100 };
}

/** Show the report. Resolves when the player sends it to the newspaper. */
export function showReport(parent, { title, subtitle, results }) {
  let resolve;
  const done = new Promise((r) => (resolve = r));
  const { official, citizens } = scores(results);

  const secretCells = [];
  const secret = (text) => {
    const cell = el('td.nq-secret', {}, [el('span.nq-redact', {}, '████████'), el('span.nq-truth', {}, text)]);
    secretCells.push(cell);
    return cell;
  };

  const rows = results.map((r, i) =>
    el('tr', {}, [
      el('td', {}, `YEAR ${i + 1}`),
      el('td', {}, QUOTA_TEXT[r.quotaType].metric),
      el('td.num', {}, fmtMeasured(r.quotaType, r.target)),
      el('td.num', {}, fmtMeasured(r.quotaType, r.measured)),
      el('td.num', {}, `${fmtNum(r.fulfilment * 100)}%`),
      el(`td.nq-verdict.g${r.grade}`, {}, r.verdictLabel),
      secret(`${fmtInt(r.count)} × ${fmtLength(r.lengthCm)} / ${fmtNum(r.diameterMm)} mm`),
      secret(`${fmtInt(r.usable)}`),
    ]),
  );

  const citizenBig = el('div.nq-big.nq-secret', {}, [el('span.nq-redact', {}, '███'), el('span.nq-truth', {}, `${fmtNum(citizens)}%`)]);
  secretCells.push(citizenBig);

  const stamp = el('div.stamp.nq-declass', {}, 'DECLASSIFIED');
  const actions = el('div.memo-actions');
  const declassify = button('DECLASSIFY THE ARCHIVE', reveal, { variant: 'dark' });
  actions.append(declassify);

  const node = el('div.memo-wrap', {}, [
    el('div.nq-report.paper', { role: 'dialog', 'aria-label': 'Ten-Year Report' }, [
      el('div.memo-head', {}, [
        el('div.memo-crest', {}, '☭'),
        el('div', {}, [el('div.memo-ministry', {}, title), el('div.memo-dept', {}, subtitle)]),
        el('div.memo-no', {}, 'FORM 2×5-YR'),
      ]),
      el('table.nq-table', {}, [
        el('thead', {}, el('tr', {}, [
          el('th', {}, ''),
          el('th', {}, 'Indicator'),
          el('th.num', {}, 'Plan'),
          el('th.num', {}, 'Delivered'),
          el('th.num', {}, '%'),
          el('th', {}, 'Verdict'),
          el('th.nq-classified', {}, 'What was made'),
          el('th.nq-classified', {}, 'Usable nails'),
        ])),
        el('tbody', {}, rows),
      ]),
      el('div.nq-summary', {}, [
        el('div.nq-score', {}, [el('div.nq-score-k', {}, 'OFFICIAL SUCCESS'), el('div.nq-big', {}, `${fmtNum(official)}%`), el('div.nq-score-s', {}, 'Average plan fulfilment, as measured')]),
        el('div.nq-score.nq-score-secret', {}, [
          el('div.nq-score-k', {}, 'CITIZEN SATISFACTION'),
          citizenBig,
          el('div.nq-score-s', {}, `Usable nails against the ${fmtInt(PEOPLES_NEED)} per year the people needed`),
        ]),
      ]),
      stamp,
      actions,
    ]),
  ]);
  parent.append(node);
  audio.stamp();

  function reveal() {
    declassify.disabled = true;
    secretCells.forEach((cell, i) => {
      setTimeout(() => {
        cell.classList.add('shown');
        audio.clack();
      }, 140 * i);
    });
    setTimeout(() => {
      stamp.classList.add('stamped');
      audio.stamp();
      actions.replaceChildren(
        button('SEND TO THE NEWSPAPER', () => {
          node.classList.add('memo-out');
          setTimeout(() => node.remove(), 250);
          resolve({ official, citizens });
        }, { variant: 'red' }),
      );
      actions.querySelector('button')?.focus();
    }, 140 * secretCells.length + 400);
  }

  declassify.focus();
  return done;
}
